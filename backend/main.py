import os
import time
from fastapi import FastAPI, Depends, Header, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from dotenv import load_dotenv

from backend.database import (
    get_profile,
    get_mission,
    get_quiz_questions,
    save_quiz_result,
    save_essay_result,
    update_user_gamification,
    get_daily_missions,
    get_practice_missions,
    get_user_completions_today,
    record_user_checkin
)
from backend.grading import calculate_semantic_similarity, get_gemini_feedback, get_quiz_gemini_feedback
from backend.gacha import roll_gacha, GachaError

load_dotenv()

SUPABASE_JWT_SECRET = os.environ.get("SUPABASE_JWT_SECRET")

app = FastAPI(title="EduGacha Backend", version="1.0.0")

# Setup CORS middleware to allow connection from frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


async def get_current_user_id(authorization: str = Header(None)) -> str:
    """
    Dependency to validate Supabase JWT token and extract the user's UUID.
    Supports mock tokens (mock-token-<user_id>) in development.
    """
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization header missing"
        )
    if not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authorization scheme"
        )
    token = authorization.split(" ")[1]
    
    # Development testing fallback
    if token.startswith("mock-token-"):
        return token.replace("mock-token-", "")

    try:
        from backend.database import supabase
        user_response = supabase.auth.get_user(token)
        if not user_response or not user_response.user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired session token"
            )
        return user_response.user.id
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid token: {str(e)}"
        )


# Letter grade conversion helper
def get_letter_grade(score: int) -> str:
    if score >= 95: return "A"
    elif score >= 90: return "A-"
    elif score >= 85: return "B+"
    elif score >= 80: return "B"
    elif score >= 75: return "B-"
    elif score >= 70: return "C+"
    elif score >= 65: return "C"
    elif score >= 60: return "D"
    else: return "F"


# Pydantic Schemas
class EssaySubmission(BaseModel):
    mission_id: str
    content: str


class QuizAnswer(BaseModel):
    question_id: str
    selected_option: str


class QuizSubmission(BaseModel):
    mission_id: str
    answers: List[QuizAnswer]
    group_number: Optional[int] = 1


class EquipTitleRequest(BaseModel):
    title: str


def get_active_daily_missions_logic():
    # Fetch all daily missions (is_practice = False)
    all_daily = get_daily_missions()
    if not all_daily:
        raise HTTPException(
            status_code=500,
            detail="No daily missions found in the database."
        )
    essay_missions = [m for m in all_daily if m.get("type") == "essay"]
    quiz_missions = [m for m in all_daily if m.get("type") == "quiz"]
    
    # Sort them by ID to ensure deterministic order
    essay_missions.sort(key=lambda x: x.get("id"))
    quiz_missions.sort(key=lambda x: x.get("id"))
    
    if not essay_missions or not quiz_missions:
        raise HTTPException(
            status_code=500,
            detail="Daily missions are not properly populated (missing essay or quiz)."
        )
    
    # Global 6-hour epoch block index
    current_time = time.time()
    epoch_6h = int(current_time // 21600)  # 21600 seconds = 6 hours
    
    active_essay = essay_missions[epoch_6h % len(essay_missions)]
    active_quiz = quiz_missions[epoch_6h % len(quiz_missions)]
    
    seconds_remaining = int(((epoch_6h + 1) * 21600) - current_time)
    
    return active_essay, active_quiz, seconds_remaining


@app.get("/health")
def health_check():
    return {"status": "ok", "message": "EduGacha backend service is healthy"}


@app.get("/api/missions/active")
def get_active_missions():
    """
    Returns the currently active 6-hour daily essay and quiz missions.
    """
    try:
        active_essay, active_quiz, seconds_remaining = get_active_daily_missions_logic()
        return {
            "essay": active_essay,
            "quiz": active_quiz,
            "seconds_remaining": seconds_remaining
        }
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/missions/practice")
def get_practice_missions_endpoint():
    """
    Returns all practice missions (is_practice = True).
    """
    try:
        missions = get_practice_missions()
        return missions
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/essays/grade")
async def grade_essay(submission: EssaySubmission, user_id: str = Depends(get_current_user_id)):
    """
    Grades an essay using semantic similarity & Gemini AI.
    Calculates rewards based on score, saves to DB, and updates user profile.
    """
    mission_id = submission.mission_id
    content = submission.content

    # 1. Fetch mission
    mission = get_mission(mission_id)
    if not mission:
        raise HTTPException(status_code=404, detail="Mission not found")
        
    if mission.get("type") != "essay":
        raise HTTPException(status_code=400, detail="Mission is not an essay mission")

    is_practice = mission.get("is_practice", False)
    if not is_practice:
        active_essay, _, _ = get_active_daily_missions_logic()
        if active_essay.get("id") != mission_id:
            raise HTTPException(
                status_code=400,
                detail="Misi esai harian ini sedang tidak aktif atau telah kedaluwarsa."
            )

    # Use reference_answer if present, fallback to description
    reference_text = mission.get("reference_answer") or mission.get("description", "")

    # 2. Semantic Similarity Score
    similarity_score = calculate_semantic_similarity(content, reference_text)

    # 3. Gemini Feedback
    feedback_data = await get_gemini_feedback(content, reference_text, similarity_score)

    # Extract aspect scores, feedback, and suggestions
    aspect_scores = {
        "grammar": feedback_data.get("grammar", 80),
        "argument": feedback_data.get("argument", 80),
        "relevance": feedback_data.get("relevance", int(similarity_score)),
        "vocabulary": feedback_data.get("vocabulary", 80)
    }
    ai_feedback = feedback_data.get("feedback", "Esai Anda telah dinilai.")
    suggestions = feedback_data.get("suggestions", [])

    # Calculate final score (average of aspects)
    score = round(sum(aspect_scores.values()) / len(aspect_scores))
    grade = get_letter_grade(score)

    # Rewards calculations with Subject Card dynamic multiplier
    multiplier = 1.0
    try:
        profile = get_profile(user_id)
        active_title = profile.get("active_title", "")
        topic = mission.get("topic", "")
        multiplier = calculate_title_multiplier(active_title, topic, "essay")
    except Exception:
        pass

    base_coins = 30 if is_practice else mission.get("coin_reward_base", 0)
    base_exp = 30 if is_practice else mission.get("exp_reward_base", 0)
    coins_earned = round(round(round((score / 100) * base_coins) * multiplier, 2))
    exp_earned = round(round(round((score / 100) * base_exp) * multiplier, 2))

    # Save to essays history
    save_essay_result(
        user_id=user_id,
        mission_id=mission_id,
        content=content,
        score=score,
        grade=grade,
        aspect_scores=aspect_scores,
        ai_feedback=ai_feedback,
        suggestions=suggestions,
        coins_earned=coins_earned,
        exp_earned=exp_earned
    )

    # Update profile coins & exp
    update_user_gamification(user_id, coins_earned, exp_earned)

    return {
        "score": score,
        "grade": grade,
        "aspect_scores": aspect_scores,
        "ai_feedback": ai_feedback,
        "suggestions": suggestions,
        "coins_earned": coins_earned,
        "exp_earned": exp_earned
    }


@app.get("/api/missions/quiz/{id}/questions")
def get_randomized_quiz_questions(id: str, user_id: str = Depends(get_current_user_id)):
    """
    Returns the dynamic next group of quiz questions for the user, consolidated with user profile & mission info,
    with correct answers and explanations stripped.
    """
    from backend.database import (
        get_profile,
        get_mission,
        get_max_completed_quiz_group,
        get_quiz_questions_by_group
    )
    
    # 1. Fetch user profile and mission
    profile = get_profile(user_id)
    mission = get_mission(id)
    if not mission or mission.get("type") != "quiz":
        raise HTTPException(status_code=404, detail="Misi kuis tidak ditemukan.")
    
    # 2. Determine group number
    completed_max = get_max_completed_quiz_group(user_id, id)
    next_group = completed_max + 1
    
    # 3. Fetch questions
    questions = get_quiz_questions_by_group(id, next_group)
    
    # Boundary handling: If next group has no questions, loop back to group 1
    if not questions:
        next_group = 1
        questions = get_quiz_questions_by_group(id, next_group)

    if not questions:
        raise HTTPException(status_code=404, detail="Tidak ada soal kuis yang terdaftar.")

    # 4. Strip sensitive grading info
    sanitized_questions = []
    for idx, q in enumerate(questions):
        sanitized_questions.append({
            "id": q["id"],
            "question": q["question"],
            "options": q["options"],
            "order_index": idx + 1
        })

    return {
        "group_number": next_group,
        "user": {
            "username": profile.get("username"),
            "level": profile.get("level"),
            "coins": profile.get("coins"),
            "active_title": profile.get("active_title")
        },
        "mission": {
            "id": mission.get("id"),
            "title": mission.get("title"),
            "description": mission.get("description"),
            "topic": mission.get("topic")
        },
        "questions": sanitized_questions
    }


@app.post("/api/quiz/submit")
async def submit_quiz(submission: QuizSubmission, user_id: str = Depends(get_current_user_id)):
    """
    Grades multiple choice quiz answers server-side.
    Calculates rewards based on score, saves to DB, and updates user profile.
    """
    mission_id = submission.mission_id
    answers = submission.answers

    # 1. Fetch mission
    mission = get_mission(mission_id)
    if not mission:
        raise HTTPException(status_code=404, detail="Mission not found")

    if mission.get("type") != "quiz":
        raise HTTPException(status_code=400, detail="Mission is not a quiz mission")

    is_practice = mission.get("is_practice", False)
    if not is_practice:
        _, active_quiz, _ = get_active_daily_missions_logic()
        if active_quiz.get("id") != mission_id:
            raise HTTPException(
                status_code=400,
                detail="Misi kuis harian ini sedang tidak aktif atau telah kedaluwarsa."
            )

    # 2. Fetch quiz questions
    questions = get_quiz_questions(mission_id)
    if not questions:
        raise HTTPException(status_code=404, detail="No questions found for this mission")

    # Map questions for fast lookup
    question_map = {q["id"]: q for q in questions}

    correct_count = 0
    total_questions = len(questions)
    details = []
    saved_answers = []

    for ans in answers:
        q_id = ans.question_id
        selected = ans.selected_option

        if q_id not in question_map:
            continue

        q = question_map[q_id]
        correct = (selected == q.get("correct_answer"))
        if correct:
            correct_count += 1

        details.append({
            "question_id": q_id,
            "selected": selected,
            "correct": correct,
            "correct_answer": q.get("correct_answer"),
            "explanation": q.get("explanation", "")
        })

        saved_answers.append({
            "question_id": q_id,
            "selected": selected,
            "correct": correct
        })

    total_questions = len(saved_answers)
    score = round((correct_count / total_questions) * 100) if total_questions > 0 else 0

    # Reward calculations with Subject Card dynamic multiplier
    multiplier = 1.0
    try:
        profile = get_profile(user_id)
        active_title = profile.get("active_title", "")
        topic = mission.get("topic", "")
        multiplier = calculate_title_multiplier(active_title, topic, "quiz")
    except Exception:
        pass

    base_coins = 30 if is_practice else mission.get("coin_reward_base", 0)
    base_exp = 30 if is_practice else mission.get("exp_reward_base", 0)
    coins_earned = round(round(round((score / 100) * base_coins) * multiplier, 2))
    exp_earned = round(round(round((score / 100) * base_exp) * multiplier, 2))

    # Fetch AI feedback
    ai_feedback = await get_quiz_gemini_feedback(
        score=score,
        total_questions=total_questions,
        correct_count=correct_count,
        mission_title=mission.get("title", "Kuis")
    )

    # Save to quiz_results
    save_quiz_result(
        user_id=user_id,
        mission_id=mission_id,
        answers=saved_answers,
        correct_count=correct_count,
        total_questions=total_questions,
        score=score,
        coins_earned=coins_earned,
        exp_earned=exp_earned,
        ai_feedback=ai_feedback,
        group_number=submission.group_number
    )

    # Update profile coins & exp
    update_user_gamification(user_id, coins_earned, exp_earned)

    return {
        "score": score,
        "correct_count": correct_count,
        "total_questions": total_questions,
        "coins_earned": coins_earned,
        "exp_earned": exp_earned,
        "details": details,
        "ai_feedback": ai_feedback
    }


class GachaRollRequest(BaseModel):
    use_ticket: Optional[bool] = False


@app.post("/api/gacha/roll")
async def roll(request: Optional[GachaRollRequest] = None, user_id: str = Depends(get_current_user_id)):
    """
    Triggers the secure gacha roll logic.
    Supports coin-based or ticket-based pulls.
    """
    use_ticket = request.use_ticket if request else False
    try:
        result = roll_gacha(user_id, use_ticket=use_ticket)
        return result
    except GachaError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/checkin/status")
def get_checkin_status(user_id: str = Depends(get_current_user_id)):
    """
    Retrieves check-in requirements checklist, streak count, and 7-day grid status.
    """
    from datetime import datetime, timezone, timedelta
    jakarta_tz = timezone(timedelta(hours=7))
    now = datetime.now(jakarta_tz)
    today_str = now.strftime('%Y-%m-%d')
    yesterday_str = (now - timedelta(days=1)).strftime('%Y-%m-%d')
    
    profile = get_profile(user_id)
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
        
    streak = profile.get("streak_count", 0)
    last_date = profile.get("last_checkin_date")
    epic_tickets = profile.get("epic_tickets", 0)
    
    # Determine active day and whether checked in today
    today_checked_in = (last_date == today_str)
    
    if today_checked_in:
        active_day = ((streak - 1) % 7) + 1
    else:
        if last_date == yesterday_str or last_date is None:
            active_day = (streak % 7) + 1
        else:
            # Streak broken
            active_day = 1
            
    daily_done, practice_done = get_user_completions_today(user_id)
    can_claim = not today_checked_in and daily_done and practice_done
    
    # Rewards mapping
    rewards_coins = {1: 10, 2: 15, 3: 100, 4: 20, 5: 25, 6: 30, 7: 500}
    rewards_tickets = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 1}
    
    grid_days = []
    for d in range(1, 8):
        status = "pending"
        if today_checked_in:
            if d <= active_day:
                status = "completed"
        else:
            if d < active_day:
                status = "completed"
            elif d == active_day:
                status = "active"
                
        grid_days.append({
            "day": d,
            "reward_coins": rewards_coins[d],
            "reward_ticket": rewards_tickets[d],
            "status": status
        })
        
    return {
        "streak_count": streak,
        "today_checked_in": today_checked_in,
        "active_day": active_day,
        "requirements": {
            "daily_mission_completed": daily_done,
            "practice_mission_completed": practice_done
        },
        "can_claim": can_claim,
        "epic_tickets": epic_tickets,
        "grid_days": grid_days
    }


@app.post("/api/checkin/claim")
def claim_checkin(user_id: str = Depends(get_current_user_id)):
    """
    Processes check-in log creation and profile reward updating.
    """
    from datetime import datetime, timezone, timedelta
    jakarta_tz = timezone(timedelta(hours=7))
    now = datetime.now(jakarta_tz)
    today_str = now.strftime('%Y-%m-%d')
    yesterday_str = (now - timedelta(days=1)).strftime('%Y-%m-%d')
    
    profile = get_profile(user_id)
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
        
    streak = profile.get("streak_count", 0)
    last_date = profile.get("last_checkin_date")
    
    if last_date == today_str:
        raise HTTPException(status_code=400, detail="Anda sudah melakukan presensi hari ini.")
        
    # Detect if streak broke
    if last_date != yesterday_str and last_date is not None:
        # Reset streak in DB profile first
        from backend.database import supabase
        supabase.table("profiles").update({"streak_count": 0}).eq("id", user_id).execute()
        streak = 0
        
    daily_done, practice_done = get_user_completions_today(user_id)
    if not daily_done or not practice_done:
        raise HTTPException(status_code=400, detail="Syarat presensi belum terpenuhi. Selesaikan 1 Misi Harian dan 1 Latihan Mandiri terlebih dahulu.")
        
    day_number = (streak % 7) + 1
    
    # Rewards mapping
    rewards_coins = {1: 10, 2: 15, 3: 100, 4: 20, 5: 25, 6: 30, 7: 500}
    rewards_tickets = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 1}
    
    coins_rewarded = rewards_coins[day_number]
    tickets_rewarded = rewards_tickets[day_number]
    
    updated_profile = record_user_checkin(
        user_id=user_id,
        day_number=day_number,
        coins_rewarded=coins_rewarded,
        tickets_rewarded=tickets_rewarded,
        today_str=today_str
    )
    
    return {
        "status": "success",
        "message": "Presensi berhasil dicatat!",
        "day_number": day_number,
        "coins_earned": coins_rewarded,
        "tickets_earned": tickets_rewarded,
        "new_coins": updated_profile["coins"],
        "new_streak": updated_profile["streak_count"]
    }


@app.get("/api/leaderboard")
def get_leaderboard(user_id: str = Depends(get_current_user_id)):
    """
    Fetches the top 5 students sorted by level and exp, 
    and calculates the relative rank of the current user.
    """
    from backend.database import supabase
    
    try:
        # Query all users sorted by level desc, exp desc
        response = (
            supabase.table("profiles")
            .select("id, username, avatar_url, level, exp, active_title")
            .order("level", desc=True)
            .order("exp", desc=True)
            .execute()
        )
        
        profiles = response.data or []
        
        # Find top 5 users
        top_users = profiles[:5]
        
        # Find current user rank (1-based index)
        user_rank = 0
        for idx, p in enumerate(profiles):
            if p.get("id") == user_id:
                user_rank = idx + 1
                break
                
        # Strip IDs from top users for security/privacy before returning
        sanitized_top = []
        for p in top_users:
            sanitized_top.append({
                "username": p.get("username", "Scholar"),
                "level": p.get("level", 1),
                "exp": p.get("exp", 0),
                "active_title": p.get("active_title", ""),
                "avatar_url": p.get("avatar_url")
            })
            
        return {
            "top_users": sanitized_top,
            "user_rank": user_rank
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


def calculate_title_multiplier(active_title: str, topic: str, activity_type: str) -> float:
    """
    Calculates the koin/EXP reward multiplier based on equipped active title.
    Formula: 1.0 + (Subject Match % + Activity Match %) / 100
    """
    if not active_title:
        return 1.0
        
    # Card configurations
    CARD_METADATA = {
        "Profesor Fisika": {"subjects": ["Fisika", "Sains"], "activity": "all", "base_boost": 20},
        "Filsuf Kebijaksanaan": {"subjects": ["all"], "activity": "essay", "base_boost": 15},
        "Penyihir Matematika": {"subjects": ["Matematika"], "activity": "quiz", "base_boost": 15},
        "Sastrawan Pujangga": {"subjects": ["Sastra"], "activity": "essay", "base_boost": 15},
        "Ksatria Sejarah": {"subjects": ["Sejarah"], "activity": "all", "base_boost": 10},
        "Astronom Muda": {"subjects": ["Sains", "Fisika"], "activity": "all", "base_boost": 10},
        "Asisten Lab Kimia": {"subjects": ["Kimia", "Sains"], "activity": "all", "base_boost": 5},
        "Magang Sejarah": {"subjects": ["Sejarah"], "activity": "all", "base_boost": 5}
    }
    
    meta = CARD_METADATA.get(active_title)
    if not meta:
        return 1.0
        
    bonus_subject = 0
    bonus_activity = 0
    
    # 1. Subject match check
    subjects = meta["subjects"]
    if "all" in subjects or topic in subjects:
        bonus_subject = meta["base_boost"]
        
    # 2. Activity type preference match check (only if subject matches or global)
    if bonus_subject > 0:
        pref_act = meta["activity"]
        if pref_act == "all" or pref_act == activity_type:
            bonus_activity = 5
            
    total_boost_percent = bonus_subject + bonus_activity
    return round(1.0 + (total_boost_percent / 100.0), 2)


@app.post("/api/profile/equip_title")
def equip_title(request: EquipTitleRequest, user_id: str = Depends(get_current_user_id)):
    """
    Equips an owned card title. If title is empty, unequips the title.
    """
    from backend.database import supabase
    
    title = request.title.strip()
    
    try:
        if title != "":
            # 1. Fetch user owned cards to verify possession
            response = (
                supabase.table("user_cards")
                .select("*, cards!inner(*)")
                .eq("user_id", user_id)
                .eq("cards.name", title)
                .execute()
            )
            owned_cards = response.data or []
            if not owned_cards:
                raise HTTPException(
                    status_code=400,
                    detail=f"Anda tidak memiliki kartu dengan gelar: {title}."
                )
        
        # 2. Update profiles active_title
        supabase.table("profiles").update({"active_title": title}).eq("id", user_id).execute()
        return {"status": "success", "active_title": title}
        
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/onboarding/complete")
def complete_onboarding(user_id: str = Depends(get_current_user_id)):
    """
    API endpoint to complete user onboarding and award coins/EXP.
    """
    from backend.database import get_profile, complete_user_onboarding
    profile = get_profile(user_id)
    if not profile:
        raise HTTPException(status_code=404, detail="Profil tidak ditemukan")
    
    if profile.get("onboarding_completed", False):
        return {
            "status": "already_completed",
            "message": "Onboarding sudah diselesaikan sebelumnya.",
            "profile": profile
        }
    
    try:
        updated_profile = complete_user_onboarding(user_id)
        return {
            "status": "success",
            "message": "Selamat! Anda menyelesaikan onboarding dan mendapat 100 Koin & 200 EXP.",
            "profile": updated_profile
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))



