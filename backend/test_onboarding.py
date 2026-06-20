import unittest
from fastapi.testclient import TestClient
from backend.main import app

class TestOnboarding(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)
        # Use seeded student ID
        self.user_id = "4b85497a-f1c3-4bd0-969f-587efb73f5b7"
        self.headers = {"Authorization": f"Bearer mock-token-{self.user_id}"}

    def test_onboarding_completion_flow(self):
        # Reset state in Supabase first
        from backend.database import supabase
        supabase.table("profiles").update({"onboarding_completed": False}).eq("id", self.user_id).execute()

        # Request completion
        res = self.client.post("/api/onboarding/complete", headers=self.headers)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["status"], "success")
        self.assertTrue(data["profile"]["onboarding_completed"])

        # Request again, should say already completed
        res_again = self.client.post("/api/onboarding/complete", headers=self.headers)
        self.assertEqual(res_again.status_code, 200)
        self.assertEqual(res_again.json()["status"], "already_completed")

if __name__ == "__main__":
    unittest.main()
