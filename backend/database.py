import os
from dotenv import load_dotenv
from supabase import create_client, Client

# Load environment variables
load_dotenv()

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
    raise ValueError(
        "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables"
    )

# Initialize Supabase service client
supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)


def get_profile(user_id: str):
    """
    Fetch a user's profile statistics from profiles table.
    """
    response = supabase.table("profiles").select("*").eq("id", user_id).single().execute()
    return response.data


def get_mission(mission_id: str):
    """
    Fetch mission details from missions table.
    """
    response = supabase.table("missions").select("*").eq("id", mission_id).single().execute()
    return response.data


def get_daily_missions():
    """
    Fetch all daily missions (where is_practice is false).
    """
    response = supabase.table("missions").select("*").eq("is_practice", False).execute()
    return response.data


def get_practice_missions():
    """
    Fetch all practice missions (where is_practice is true).
    """
    response = supabase.table("missions").select("*").eq("is_practice", True).execute()
    return response.data



def get_quiz_questions(mission_id: str):
    """
    Fetch all quiz questions for a specific mission, ordered by order_index.
    """
    response = (
        supabase.table("quiz_questions")
        .select("*")
        .eq("mission_id", mission_id)
        .order("order_index")
        .execute()
    )
    return response.data


def get_quiz_questions_by_group(mission_id: str, group_number: int):
    """
    Fetch quiz questions for a specific mission and group_number, ordered by order_index.
    """
    response = (
        supabase.table("quiz_questions")
        .select("*")
        .eq("mission_id", mission_id)
        .eq("group_number", group_number)
        .order("order_index")
        .execute()
    )
    return response.data


def get_max_completed_quiz_group(user_id: str, mission_id: str) -> int:
    """
    Retrieve the highest group_number completed by the user for a specific quiz mission.
    """
    response = (
        supabase.table("quiz_results")
        .select("group_number")
        .eq("user_id", user_id)
        .eq("mission_id", mission_id)
        .order("group_number", desc=True)
        .limit(1)
        .execute()
    )
    data = response.data
    if data:
        return data[0].get("group_number", 0)
    return 0


def get_random_card_by_rarity(rarity: str):
    """
    Fetch a random card from the cards table based on rarity.
    Uses PostgreSQL random() or client-side random sampling.
    """
    response = supabase.table("cards").select("*").eq("rarity", rarity).execute()
    cards = response.data
    if not cards:
        raise ValueError(f"No cards found with rarity: {rarity}")
    
    # Import random locally to select one
    import random
    return random.choice(cards)


def save_quiz_result(user_id: str, mission_id: str, answers: list, correct_count: int, total_questions: int, score: int, coins_earned: int, exp_earned: int, ai_feedback: str = None, group_number: int = 1):
    """
    Save the quiz submission history to quiz_results.
    """
    data = {
        "user_id": user_id,
        "mission_id": mission_id,
        "answers": answers,
        "correct_count": correct_count,
        "total_questions": total_questions,
        "score": score,
        "coins_earned": coins_earned,
        "exp_earned": exp_earned,
        "ai_feedback": ai_feedback,
        "group_number": group_number
    }
    response = supabase.table("quiz_results").insert(data).execute()
    return response.data


def save_essay_result(user_id: str, mission_id: str, content: str, score: int, grade: str, aspect_scores: dict, ai_feedback: str, suggestions: list, coins_earned: int, exp_earned: int):
    """
    Save the essay result to essays table.
    """
    data = {
        "user_id": user_id,
        "mission_id": mission_id,
        "content": content,
        "score": score,
        "grade": grade,
        "aspect_scores": aspect_scores,
        "ai_feedback": ai_feedback,
        "suggestions": suggestions,
        "coins_earned": coins_earned,
        "exp_earned": exp_earned
    }
    response = supabase.table("essays").insert(data).execute()
    return response.data


def update_user_gamification(user_id: str, coins_added: int, exp_added: int):
    """
    Update user's profile with coins and exp rewards, handling leveling up.
    Each level requires 1000 exp.
    """
    # Fetch current profile
    profile = get_profile(user_id)
    if not profile:
        raise ValueError("User profile not found")

    new_coins = profile.get("coins", 0) + coins_added
    current_exp = profile.get("exp", 0) + exp_added
    current_level = profile.get("level", 1)

    # Calculate level ups
    level_ups = current_exp // 1000
    new_level = current_level + level_ups
    new_exp = current_exp % 1000

    # Update profile
    update_data = {
        "coins": new_coins,
        "exp": new_exp,
        "level": new_level
    }
    response = supabase.table("profiles").update(update_data).eq("id", user_id).execute()
    return response.data[0] if response.data else None


def execute_gacha_transaction(user_id: str, cost: int, pity_counter: int, reward_type: str, reward_rarity: str, reward_detail: dict, use_ticket: bool = False):
    """
    Execute database operations atomically via RPC.
    """
    params = {
        "p_user_id": user_id,
        "p_cost": cost,
        "p_pity_counter": pity_counter,
        "p_reward_type": reward_type,
        "p_reward_rarity": reward_rarity,
        "p_reward_detail": reward_detail,
        "p_use_ticket": use_ticket
    }
    response = supabase.rpc("execute_gacha_transaction", params).execute()
    return response.data


def get_user_completions_today(user_id: str):
    """
    Query essays and quiz_results submitted today (Asia/Jakarta) to count completions.
    """
    from datetime import datetime, timezone, timedelta
    jakarta_tz = timezone(timedelta(hours=7))
    today_str = datetime.now(jakarta_tz).strftime('%Y-%m-%d')
    
    # Query essays submitted today
    essay_response = supabase.table("essays").select("id, mission_id, missions(is_practice)").eq("user_id", user_id).gte("created_at", f"{today_str}T00:00:00+07:00").execute()
    
    # Query quiz results submitted today
    quiz_response = supabase.table("quiz_results").select("id, mission_id, missions(is_practice)").eq("user_id", user_id).gte("created_at", f"{today_str}T00:00:00+07:00").execute()
    
    daily_completed = False
    practice_completed = False
    
    for item in (essay_response.data or []):
        is_practice = item.get("missions", {}).get("is_practice", False)
        if is_practice:
            practice_completed = True
        else:
            daily_completed = True
            
    for item in (quiz_response.data or []):
        is_practice = item.get("missions", {}).get("is_practice", False)
        if is_practice:
            practice_completed = True
        else:
            daily_completed = True
            
    return daily_completed, practice_completed


def record_user_checkin(user_id: str, day_number: int, coins_rewarded: int, tickets_rewarded: int, today_str: str):
    """
    Records check-in log and updates profiles streak, coins, and last_checkin_date.
    """
    # 1. Log check-in
    log_data = {
        "user_id": user_id,
        "day_number": day_number,
        "coins_rewarded": coins_rewarded,
        "tickets_rewarded": tickets_rewarded,
        "checked_in_date": today_str
    }
    supabase.table("checkin_logs").insert(log_data).execute()
    
    # 2. Get profile to update
    profile = get_profile(user_id)
    new_coins = profile.get("coins", 0) + coins_rewarded
    new_tickets = profile.get("epic_tickets", 0) + tickets_rewarded
    
    profile_update = {
        "coins": new_coins,
        "epic_tickets": new_tickets,
        "streak_count": profile.get("streak_count", 0) + 1,
        "last_checkin_date": today_str
    }
    
    supabase.table("profiles").update(profile_update).eq("id", user_id).execute()
    return profile_update


def complete_user_onboarding(user_id: str):
    """
    Set onboarding_completed to true in profiles table, and award 100 coins & 200 EXP.
    """
    supabase.table("profiles").update({"onboarding_completed": True}).eq("id", user_id).execute()
    return update_user_gamification(user_id, coins_added=100, exp_added=200)

