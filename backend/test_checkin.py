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
    from backend.main import app


class TestCheckinEndpoints(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)
        self.headers = {"Authorization": "Bearer mock-token-test-user"}

    @patch('backend.main.get_profile')
    @patch('backend.main.get_user_completions_today')
    def test_get_checkin_status(self, mock_completions, mock_profile):
        from datetime import datetime, timezone, timedelta
        jakarta_tz = timezone(timedelta(hours=7))
        now = datetime.now(jakarta_tz)
        yesterday_str = (now - timedelta(days=1)).strftime('%Y-%m-%d')

        mock_profile.return_value = {
            "id": "test-user",
            "streak_count": 2,
            "last_checkin_date": yesterday_str,
            "epic_tickets": 0
        }
        mock_completions.return_value = (True, False) # Daily mission done, practice missing
        
        response = self.client.get("/api/checkin/status", headers=self.headers)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["streak_count"], 2)
        self.assertEqual(data["active_day"], 3)
        self.assertEqual(data["can_claim"], False)
        self.assertEqual(data["requirements"]["daily_mission_completed"], True)
        self.assertEqual(data["requirements"]["practice_mission_completed"], False)

    @patch('backend.main.get_profile')
    @patch('backend.main.get_user_completions_today')
    def test_get_checkin_status_today_checked_in(self, mock_completions, mock_profile):
        from datetime import datetime, timezone, timedelta
        jakarta_tz = timezone(timedelta(hours=7))
        now = datetime.now(jakarta_tz)
        today_str = now.strftime('%Y-%m-%d')

        mock_profile.return_value = {
            "id": "test-user",
            "streak_count": 2,
            "last_checkin_date": today_str,
            "epic_tickets": 0
        }
        mock_completions.return_value = (True, True)
        
        response = self.client.get("/api/checkin/status", headers=self.headers)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["streak_count"], 2)
        self.assertEqual(data["active_day"], 2)
        self.assertEqual(data["today_checked_in"], True)
        self.assertEqual(data["can_claim"], False)
        
        grid = data["grid_days"]
        self.assertEqual(grid[0]["status"], "completed") # Day 1 completed
        self.assertEqual(grid[1]["status"], "completed") # Day 2 completed
        self.assertEqual(grid[2]["status"], "pending")   # Day 3 pending (no longer "active" today)

    @patch('backend.main.get_profile')
    @patch('backend.main.get_user_completions_today')
    @patch('backend.main.record_user_checkin')
    def test_claim_checkin_success(self, mock_record, mock_completions, mock_profile):
        from datetime import datetime, timezone, timedelta
        jakarta_tz = timezone(timedelta(hours=7))
        now = datetime.now(jakarta_tz)
        yesterday_str = (now - timedelta(days=1)).strftime('%Y-%m-%d')

        mock_profile.return_value = {
            "id": "test-user",
            "streak_count": 2,
            "last_checkin_date": yesterday_str
        }
        mock_completions.return_value = (True, True) # Requirements met!
        mock_record.return_value = {
            "coins": 300,
            "streak_count": 3
        }
        
        response = self.client.post("/api/checkin/claim", headers=self.headers)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["status"], "success")
        self.assertEqual(data["day_number"], 3)
        self.assertEqual(data["coins_earned"], 100)
        self.assertEqual(data["new_streak"], 3)

    @patch('backend.main.get_profile')
    @patch('backend.main.get_user_completions_today')
    def test_claim_checkin_fails_requirements(self, mock_completions, mock_profile):
        from datetime import datetime, timezone, timedelta
        jakarta_tz = timezone(timedelta(hours=7))
        now = datetime.now(jakarta_tz)
        yesterday_str = (now - timedelta(days=1)).strftime('%Y-%m-%d')

        mock_profile.return_value = {
            "id": "test-user",
            "streak_count": 2,
            "last_checkin_date": yesterday_str
        }
        mock_completions.return_value = (True, False) # Missing practice
        
        response = self.client.post("/api/checkin/claim", headers=self.headers)
        self.assertEqual(response.status_code, 400)
        self.assertIn("Syarat presensi belum terpenuhi", response.json()["detail"])

    @patch('backend.main.roll_gacha')
    def test_roll_gacha_with_ticket(self, mock_roll):
        mock_roll.return_value = {
            "reward_type": "card",
            "reward_rarity": "Epic",
            "reward_name": "Penyihir Aljabar",
            "reward_detail": {"card_id": "c1"},
            "new_coins": 100,
            "new_pity": 5,
            "new_tickets": 0
        }
        
        response = self.client.post("/api/gacha/roll", json={"use_ticket": True}, headers=self.headers)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["reward_rarity"], "Epic")
        self.assertEqual(data["new_tickets"], 0)

    @patch('backend.database.supabase')
    def test_get_leaderboard(self, mock_supabase):
        # Mock Supabase table query result
        mock_execute = MagicMock()
        mock_execute.execute.return_value = MagicMock(data=[
            {"id": "user-1", "username": "Socrates", "level": 15, "exp": 420, "active_title": "Filsuf"},
            {"id": "user-2", "username": "Newton", "level": 12, "exp": 800, "active_title": "Profesor"},
            {"id": "test-user", "username": "TestUser", "level": 10, "exp": 100, "active_title": "Scholar"}
        ])
        
        mock_supabase.table.return_value.select.return_value.order.return_value.order.return_value = mock_execute
        
        response = self.client.get("/api/leaderboard", headers=self.headers)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["user_rank"], 3)
        self.assertEqual(len(data["top_users"]), 3)
        self.assertEqual(data["top_users"][0]["username"], "Socrates")

    @patch('backend.database.supabase')
    def test_equip_title_success(self, mock_supabase):
        # Mock possession check and profiles update
        mock_execute = MagicMock()
        mock_execute.execute.return_value = MagicMock(data=[
            {"id": "uc-1", "cards": {"name": "Penyihir Matematika"}}
        ])
        mock_supabase.table.return_value.select.return_value.eq.return_value.eq.return_value = mock_execute
        
        response = self.client.post("/api/profile/equip_title", json={"title": "Penyihir Matematika"}, headers=self.headers)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["active_title"], "Penyihir Matematika")

    @patch('backend.database.supabase')
    def test_equip_title_not_owned(self, mock_supabase):
        mock_execute = MagicMock()
        mock_execute.execute.return_value = MagicMock(data=[]) # Not owned
        mock_supabase.table.return_value.select.return_value.eq.return_value.eq.return_value = mock_execute
        
        response = self.client.post("/api/profile/equip_title", json={"title": "Profesor Fisika"}, headers=self.headers)
        self.assertEqual(response.status_code, 400)
        self.assertIn("Anda tidak memiliki kartu", response.json()["detail"])

    def test_calculate_title_multiplier(self):
        from backend.main import calculate_title_multiplier
        
        # Test perfect match (Epic + quiz match)
        mult = calculate_title_multiplier("Penyihir Matematika", "Matematika", "quiz")
        self.assertEqual(mult, 1.20) # 15% + 5%
        
        # Test partial match (Epic, subject match only)
        mult = calculate_title_multiplier("Penyihir Matematika", "Matematika", "essay")
        self.assertEqual(mult, 1.15) # 15% subject only
        
        # Test mismatched topic
        mult = calculate_title_multiplier("Penyihir Matematika", "Kimia", "quiz")
        self.assertEqual(mult, 1.0)
        
        # Test Legendary global matching
        mult = calculate_title_multiplier("Filsuf Kebijaksanaan", "Kimia", "essay")
        self.assertEqual(mult, 1.20) # 15% base + 5% essay
        
        mult = calculate_title_multiplier("Filsuf Kebijaksanaan", "Matematika", "quiz")
        self.assertEqual(mult, 1.15) # 15% base only


