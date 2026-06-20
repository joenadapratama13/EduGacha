import os
import argparse
import json
from google import genai
from google.genai import types
from pydantic import BaseModel, Field
from typing import List
from dotenv import load_dotenv
from backend.database import supabase

load_dotenv()

GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    raise ValueError("GEMINI_API_KEY tidak ditemukan di environment.")

client = genai.Client(api_key=GEMINI_API_KEY)

class OptionSchema(BaseModel):
    label: str
    text: str

class QuestionSchema(BaseModel):
    question: str
    options: List[OptionSchema]
    correct_answer: str
    explanation: str

class QuizQuestionsList(BaseModel):
    questions: List[QuestionSchema]

def generate_questions(mission_id: str, topic: str, group_number: int):
    print(f"Menghasilkan 10 soal untuk misi '{mission_id}' dengan topik '{topic}' kelompok {group_number}...")
    
    prompt = f"""Buatkan 10 soal pilihan ganda baru bahasa Indonesia yang unik, menarik, dan mendidik untuk kuis bertopik: {topic}.
    Setiap soal harus memiliki 4 opsi jawaban (A, B, C, dan D), kunci jawaban yang tepat, dan pembahasan/penjelasan singkat yang logis.
    Format soal tingkat menengah (SMP/SMA). Pastikan semua jawaban benar secara objektif."""

    try:
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=QuizQuestionsList
            )
        )
        
        data = json.loads(response.text)
        questions_to_insert = []
        for idx, q in enumerate(data.get("questions", [])):
            questions_to_insert.append({
                "mission_id": mission_id,
                "question": q["question"],
                "options": q["options"],
                "correct_answer": q["correct_answer"],
                "explanation": q["explanation"],
                "order_index": idx + 1,
                "group_number": group_number
            })

        # Insert into Supabase
        res = supabase.table("quiz_questions").insert(questions_to_insert).execute()
        print(f"Sukses memasukkan {len(questions_to_insert)} soal kelompok {group_number} ke database!")
    except Exception as e:
        print(f"Error saat memproses AI generator: {e}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="AI Quiz Question Generator")
    parser.add_argument("--mission_id", required=True, type=str, help="ID misi kuis")
    parser.add_argument("--topic", required=True, type=str, help="Topik kuis (e.g. Matematika)")
    parser.add_argument("--group", required=True, type=int, help="Kelompok soal yang ingin dihasilkan")
    
    args = parser.parse_args()
    generate_questions(args.mission_id, args.topic, args.group)
