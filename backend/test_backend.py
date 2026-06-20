import json
import unittest
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient

# Mock environmental variables before importing app
with patch.dict('os.environ', {
    'SUPABASE_URL': 'https://rytrhulfuphehittrqkm.supabase.co',
    'SUPABASE_SERVICE_ROLE_KEY': 'mock-key',
    'SUPABASE_JWT_SECRET': 'mock-jwt-secret',
    'GEMINI_API_KEY': 'mock-gemini-key'
}):
    # Import the FastAPI app
    from backend.main import app


class TestEduGachaBackend(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)
        self.headers = {"Authorization": "Bearer mock-token-user-123"}

    def test_health_check(self):
        response = self.client.get("/health")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["status"], "ok")

    @patch('backend.main.get_mission')
    @patch('backend.main.get_active_daily_missions_logic')
    @patch('backend.main.calculate_semantic_similarity')
    @patch('backend.main.get_gemini_feedback')
    @patch('backend.main.save_essay_result')
    @patch('backend.main.update_user_gamification')
    def test_grade_essay(self, mock_update, mock_save, mock_feedback, mock_sim, mock_active, mock_mission):
        # Setup mocks
        mock_active.return_value = (
            {"id": "misi-essay-1", "type": "essay", "is_practice": False, "coin_reward_base": 200, "exp_reward_base": 50},
            {"id": "misi-quiz-1", "type": "quiz", "is_practice": False, "coin_reward_base": 100, "exp_reward_base": 100},
            3600
        )
        mock_mission.return_value = {
            "id": "misi-essay-1",
            "type": "essay",
            "coin_reward_base": 200,
            "exp_reward_base": 50,
            "description": "Tuliskan esai kritis..."
        }
        mock_sim.return_value = 85
        mock_feedback.return_value = {
            "grammar": 90,
            "argument": 85,
            "relevance": 90,
            "vocabulary": 80,
            "feedback": "Bagus sekali!",
            "suggestions": [
                {"title": "Perkuat Referensi", "desc": "Sertakan lebih banyak referensi akademis."}
            ]
        }
        
        payload = {
            "mission_id": "misi-essay-1",
            "content": "Ini adalah esai percobaan mahasiswa."
        }
        
        response = self.client.post("/api/essays/grade", json=payload, headers=self.headers)
        self.assertEqual(response.status_code, 200)
        
        data = response.json()
        self.assertEqual(data["score"], 86) # Average of 90, 85, 90, 80 = 86.25 -> round = 86
        self.assertEqual(data["grade"], "B+")
        self.assertEqual(data["coins_earned"], 172) # 0.86 * 200 = 172
        self.assertEqual(data["exp_earned"], 43) # 0.86 * 50 = 43
        self.assertEqual(data["suggestions"][0]["title"], "Perkuat Referensi")
        self.assertEqual(data["suggestions"][0]["desc"], "Sertakan lebih banyak referensi akademis.")

    @patch('backend.main.get_quiz_gemini_feedback')
    @patch('backend.main.get_mission')
    @patch('backend.main.get_active_daily_missions_logic')
    @patch('backend.main.get_quiz_questions')
    @patch('backend.main.save_quiz_result')
    @patch('backend.main.update_user_gamification')
    def test_submit_quiz(self, mock_update, mock_save, mock_questions, mock_active, mock_mission, mock_quiz_feedback):
        mock_quiz_feedback.return_value = "Bagus!"
        mock_active.return_value = (
            {"id": "misi-essay-1", "type": "essay", "is_practice": False, "coin_reward_base": 200, "exp_reward_base": 50},
            {"id": "misi-quiz-1", "type": "quiz", "is_practice": False, "coin_reward_base": 100, "exp_reward_base": 100},
            3600
        )
        mock_mission.return_value = {
            "id": "misi-quiz-1",
            "type": "quiz",
            "coin_reward_base": 100,
            "exp_reward_base": 100
        }
        mock_questions.return_value = [
            {"id": "q1", "correct_answer": "A", "explanation": "Pembahasan 1"},
            {"id": "q2", "correct_answer": "B", "explanation": "Pembahasan 2"}
        ]
        
        payload = {
            "mission_id": "misi-quiz-1",
            "answers": [
                {"question_id": "q1", "selected_option": "A"},
                {"question_id": "q2", "selected_option": "C"} # Wrong
            ]
        }
        
        response = self.client.post("/api/quiz/submit", json=payload, headers=self.headers)
        self.assertEqual(response.status_code, 200)
        
        data = response.json()
        self.assertEqual(data["score"], 50)
        self.assertEqual(data["correct_count"], 1)
        self.assertEqual(data["total_questions"], 2)
        self.assertEqual(data["coins_earned"], 50)
        self.assertEqual(data["exp_earned"], 50)

    @patch('backend.main.roll_gacha')
    def test_roll_gacha(self, mock_roll):
        mock_roll.return_value = {
            "reward_type": "card",
            "reward_rarity": "Epic",
            "reward_name": "Penyihir Aljabar",
            "reward_detail": {
                "card_id": "card-123",
                "quote": "Quote",
                "image_url": "/cards/image.png"
            },
            "new_coins": 150,
            "new_pity": 5
        }
        
        response = self.client.post("/api/gacha/roll", headers=self.headers)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["reward_rarity"], "Epic")
        self.assertEqual(data["reward_name"], "Penyihir Aljabar")

    @patch('backend.main.get_mission')
    @patch('backend.main.get_active_daily_missions_logic')
    @patch('backend.main.get_profile')
    @patch('backend.main.calculate_semantic_similarity')
    @patch('backend.main.get_gemini_feedback')
    @patch('backend.main.save_essay_result')
    @patch('backend.main.update_user_gamification')
    def test_grade_essay_with_legendary_multiplier(self, mock_update, mock_save, mock_feedback, mock_sim, mock_profile, mock_active, mock_mission):
        mock_active.return_value = (
            {"id": "misi-essay-1", "type": "essay", "is_practice": False, "coin_reward_base": 200, "exp_reward_base": 50},
            {"id": "misi-quiz-1", "type": "quiz", "is_practice": False, "coin_reward_base": 100, "exp_reward_base": 100},
            3600
        )
        mock_mission.return_value = {
            "id": "misi-essay-1",
            "type": "essay",
            "coin_reward_base": 200,
            "exp_reward_base": 50,
            "topic": "Fisika",
            "description": "Tuliskan esai..."
        }
        mock_profile.return_value = {
            "active_title": "Profesor Fisika"
        }
        mock_sim.return_value = 85
        mock_feedback.return_value = {
            "grammar": 90,
            "argument": 85,
            "relevance": 90,
            "vocabulary": 80,
            "feedback": "Bagus sekali!",
            "suggestions": []
        }
        
        payload = {
            "mission_id": "misi-essay-1",
            "content": "Ini adalah esai percobaan mahasiswa."
        }
        
        response = self.client.post("/api/essays/grade", json=payload, headers=self.headers)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        # Profesor Fisika (+20% topic, +5% activity = +25% total -> 1.25 multiplier)
        # score = 86, base_coins = 200 -> 172 * 1.25 = 215
        # base_exp = 50 -> 43 * 1.25 = 53.75 -> rounded to 54
        self.assertEqual(data["coins_earned"], 215)
        self.assertEqual(data["exp_earned"], 54)

    @patch('backend.main.get_quiz_gemini_feedback')
    @patch('backend.main.get_mission')
    @patch('backend.main.get_active_daily_missions_logic')
    @patch('backend.main.get_profile')
    @patch('backend.main.get_quiz_questions')
    @patch('backend.main.save_quiz_result')
    @patch('backend.main.update_user_gamification')
    def test_submit_quiz_with_legendary_multiplier(self, mock_update, mock_save, mock_questions, mock_profile, mock_active, mock_mission, mock_quiz_feedback):
        mock_quiz_feedback.return_value = "Bagus!"
        mock_active.return_value = (
            {"id": "misi-essay-1", "type": "essay", "is_practice": False, "coin_reward_base": 200, "exp_reward_base": 50},
            {"id": "misi-quiz-1", "type": "quiz", "is_practice": False, "coin_reward_base": 100, "exp_reward_base": 100},
            3600
        )
        mock_mission.return_value = {
            "id": "misi-quiz-1",
            "type": "quiz",
            "coin_reward_base": 100,
            "exp_reward_base": 100
        }
        mock_profile.return_value = {
            "active_title": "Filsuf Kebijaksanaan"
        }
        mock_questions.return_value = [
            {"id": "q1", "correct_answer": "A", "explanation": "Pembahasan 1"},
            {"id": "q2", "correct_answer": "B", "explanation": "Pembahasan 2"}
        ]
        
        payload = {
            "mission_id": "misi-quiz-1",
            "answers": [
                {"question_id": "q1", "selected_option": "A"},
                {"question_id": "q2", "selected_option": "C"}
            ]
        }
        
        response = self.client.post("/api/quiz/submit", json=payload, headers=self.headers)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        # Filsuf Kebijaksanaan (+15% subject "all", +0% activity match since it is quiz -> 1.15 multiplier)
        # score = 50, base_coins = 100 -> 50 * 1.15 = 57.5 -> rounded to 58
        # base_exp = 100 -> 50 * 1.15 = 57.5 -> rounded to 58
        self.assertEqual(data["coins_earned"], 58)
        self.assertEqual(data["exp_earned"], 58)

    @patch('backend.main.get_daily_missions')
    @patch('time.time')
    def test_get_active_missions(self, mock_time, mock_daily):
        mock_time.return_value = 21600 * 2 + 100  # In the 2nd epoch block
        mock_daily.return_value = [
            {"id": "m1", "type": "essay", "is_practice": False},
            {"id": "m2", "type": "essay", "is_practice": False},
            {"id": "q1", "type": "quiz", "is_practice": False},
            {"id": "q2", "type": "quiz", "is_practice": False},
        ]
        response = self.client.get("/api/missions/active")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["essay"]["id"], "m1")  # (2 % 2 = 0) -> m1
        self.assertEqual(data["quiz"]["id"], "q1")    # (2 % 2 = 0) -> q1
        self.assertEqual(data["seconds_remaining"], 21500)  # (3 * 21600) - (2 * 21600 + 100) = 21500

    @patch('backend.main.get_practice_missions')
    def test_get_practice_missions(self, mock_practice):
        mock_practice.return_value = [
            {"id": "p1", "type": "quiz", "is_practice": True, "topic": "Matematika"}
        ]
        response = self.client.get("/api/missions/practice")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(len(data), 1)
        self.assertEqual(data[0]["id"], "p1")

    @patch('backend.main.get_quiz_gemini_feedback')
    @patch('backend.main.get_mission')
    @patch('backend.main.get_quiz_questions')
    @patch('backend.main.save_quiz_result')
    @patch('backend.main.update_user_gamification')
    def test_submit_practice_quiz(self, mock_update, mock_save, mock_questions, mock_mission, mock_quiz_feedback):
        mock_quiz_feedback.return_value = "Bagus!"
        mock_mission.return_value = {
            "id": "p1",
            "type": "quiz",
            "is_practice": True,
            "coin_reward_base": 100,
            "exp_reward_base": 100
        }
        mock_questions.return_value = [
            {"id": "q1", "correct_answer": "A", "explanation": "Pembahasan 1"},
            {"id": "q2", "correct_answer": "B", "explanation": "Pembahasan 2"}
        ]
        payload = {
            "mission_id": "p1",
            "answers": [
                {"question_id": "q1", "selected_option": "A"},
                {"question_id": "q2", "selected_option": "C"}  # 50% score
            ]
        }
        response = self.client.post("/api/quiz/submit", json=payload, headers=self.headers)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["coins_earned"], 15)  # 50% score on 30 base = 15
        self.assertEqual(data["exp_earned"], 15)

    @patch('backend.main.get_mission')
    @patch('backend.main.get_daily_missions')
    @patch('time.time')
    def test_submit_inactive_daily_quiz(self, mock_time, mock_daily, mock_mission):
        mock_time.return_value = 21600 * 2 + 100
        mock_daily.return_value = [
            {"id": "q1", "type": "quiz", "is_practice": False},
            {"id": "q2", "type": "quiz", "is_practice": False},
            {"id": "m1", "type": "essay", "is_practice": False},
        ]
        mock_mission.return_value = {
            "id": "q2",
            "type": "quiz",
            "is_practice": False
        }
        payload = {
            "mission_id": "q2",
            "answers": []
        }
        response = self.client.post("/api/quiz/submit", json=payload, headers=self.headers)
        self.assertEqual(response.status_code, 400)
        self.assertIn("sedang tidak aktif", response.json()["detail"])


if __name__ == "__main__":
    unittest.main()

