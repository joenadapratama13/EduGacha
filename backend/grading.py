import os
import json
import logging
from google import genai
from google.genai import types
from pydantic import BaseModel, Field
from typing import List
from dotenv import load_dotenv

# Setup logger
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("grading")

load_dotenv()

GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")

# Initialize Gemini Client if API key is provided
gemini_client = None
if GEMINI_API_KEY:
    gemini_client = genai.Client(api_key=GEMINI_API_KEY)
else:
    logger.warning("GEMINI_API_KEY not found in environment. AI feedback will use fallback values.")

# Lazy load sentence-transformers to speed up startup time
sentence_transformer_model = None
try:
    from sentence_transformers import SentenceTransformer
    import numpy as np

    def get_transformer_model():
        global sentence_transformer_model
        if sentence_transformer_model is None:
            logger.info("Loading paraphrase-multilingual-MiniLM-L12-v2...")
            sentence_transformer_model = SentenceTransformer(
                "paraphrase-multilingual-MiniLM-L12-v2"
            )
        return sentence_transformer_model
except Exception as e:
    logger.warning(f"Could not load sentence-transformers: {e}. Falling back.")
    get_transformer_model = None


# Define Pydantic Models for Structured Output
class SuggestionItem(BaseModel):
    title: str = Field(description="Judul Singkat saran (2-4 kata)")
    desc: str = Field(description="Penjelasan saran perbaikan secara spesifik (1-2 kalimat)")


class EssayGradingResponse(BaseModel):
    grammar: int = Field(description="Skor tata bahasa, ejaan, tanda baca (0-100)")
    argument: int = Field(description="Skor struktur argumen, logika, koherensi (0-100)")
    relevance: int = Field(description="Skor kesesuaian topik dengan acuan (0-100)")
    vocabulary: int = Field(description="Skor variasi dan ketepatan kosa kata (0-100)")
    feedback: str = Field(description="2-3 kalimat evaluasi evaluatif sesuai kepribadian Scholar AI")
    suggestions: List[SuggestionItem] = Field(description="Daftar berisi 2-3 saran perbaikan terstruktur")


def compute_pure_python_similarity(text1: str, text2: str) -> float:
    """
    Fallback cosine similarity using pure Python and standard library.
    """
    import math
    from collections import Counter
    import re
    
    def get_tokens(text):
        words = re.findall(r'\w+', text.lower())
        return words

    words1 = get_tokens(text1)
    words2 = get_tokens(text2)
    
    if not words1 or not words2:
        return 0.0
        
    vec1 = Counter(words1)
    vec2 = Counter(words2)
    
    intersection = set(vec1.keys()) & set(vec2.keys())
    numerator = sum([vec1[x] * vec2[x] for x in intersection])
    
    sum1 = sum([vec1[x]**2 for x in vec1.keys()])
    sum2 = sum([vec2[x]**2 for x in vec2.keys()])
    denominator = math.sqrt(sum1) * math.sqrt(sum2)
    
    if not denominator:
        return 0.0
    else:
        return float(numerator) / denominator


def calculate_semantic_similarity(student_essay: str, reference_essay: str) -> float:
    """
    Calculate semantic similarity score (0 to 100) using SentenceTransformers MiniLM
    with a fallback to pure Python token similarity.
    """
    if not student_essay.strip() or not reference_essay.strip():
        return 0.0

    if get_transformer_model is not None:
        try:
            model = get_transformer_model()
            embeddings = model.encode([student_essay, reference_essay])
            # Compute cosine similarity
            emb1 = embeddings[0]
            emb2 = embeddings[1]
            dot_product = np.dot(emb1, emb2)
            norm_1 = np.linalg.norm(emb1)
            norm_2 = np.linalg.norm(emb2)
            cos_sim = float(dot_product / (norm_1 * norm_2))
            
            logger.info(f"Similarity computed using SentenceTransformer: {cos_sim:.4f}")
            # Convert to 0-100 score using the calibrated formula from spec:
            # Score = max(0, min(100, round((cos_sim - 0.2) / 0.8 * 100)))
            calibrated_score = max(0, min(100, round(((cos_sim - 0.2) / 0.8) * 100)))
            return float(calibrated_score)
        except Exception as e:
            logger.error(f"Error computing similarity using SentenceTransformer: {e}. Falling back.")
    
    # Fallback to pure Python similarity
    cos_sim = compute_pure_python_similarity(student_essay, reference_essay)
    logger.info(f"Similarity computed using pure Python counter: {cos_sim:.4f}")
    calibrated_score = max(0, min(100, round(((cos_sim - 0.2) / 0.8) * 100)))
    return float(calibrated_score)


async def get_gemini_feedback(student_essay: str, reference_essay: str, similarity_score: float) -> dict:
    """
    Get qualitative assessment of the essay from Gemini API.
    """
    default_fallback = {
        "grammar": 75,
        "argument": 75,
        "relevance": int(similarity_score),
        "vocabulary": 75,
        "feedback": "Hasil evaluasi otomatis: Esai Anda telah diterima. Pertahankan kerja keras Anda dan kembangkan argumen secara lebih mendalam.",
        "suggestions": [
            {"title": "Tingkatkan Referensi", "desc": "Sertakan lebih banyak referensi akademis untuk memperkuat argumen Anda."},
            {"title": "Kembangkan Argumen", "desc": "Perkuat argumen utama Anda dengan bukti empiris atau kutipan teoretis."}
        ]
    }

    if not gemini_client:
        logger.warning("No Gemini Client initialized, returning fallback feedback.")
        return default_fallback
        
    prompt = f"""Anda adalah "Scholar AI", asisten dosen bahasa Indonesia yang cerdas, percaya diri, dan sedikit sombong.

Kepribadian Anda:
- Jika skor rata-rata RENDAH (di bawah 60): Anda MENGEJEK dengan santai dan sarkastik, tapi tetap memberikan saran yang berguna. Contoh nada: "Wah, ini serius? Kayaknya kamu nulis sambil tidur deh...", "Hmm, kreatif sih — kreatif banget ngaconya."
- Jika skor rata-rata SEDANG (60-79): Anda bersikap biasa saja, netral tapi sedikit meremehkan. Contoh: "Yaa lumayan lah, tapi jangan bangga dulu.", "Standar. Bisa lebih bagus kalau kamu mau usaha dikit lagi."
- Jika skor rata-rata TINGGI (80+): Anda memberi pujian ENGGAN dan tsundere. Contoh: "Hmm... bolehlah.", "Oke sih, aku akui ini... lumayan bagus. Jangan ge-er ya.", "Nah gitu dong, baru segini harusnya dari tadi."

Tugas Anda:
Nilailah esai siswa berikut ini berdasarkan kunci jawaban acuan dan berikan skor serta umpan balik sesuai kepribadian di atas.

Esai Siswa:
"{student_essay}"

Kunci Jawaban Acuan:
"{reference_essay}"

Skor Kemiripan Semantik (dihitung oleh sistem): {similarity_score}/100

Petunjuk Tambahan:
- Berikan respons dalam format JSON bersih yang sesuai dengan schema yang ditentukan.
- Kunci suggestions harus memiliki 2-3 saran perbaikan terstruktur yang konstruktif meskipun nada evaluasi Anda mengejek.
"""

    try:
        response = await gemini_client.aio.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=EssayGradingResponse
            )
        )
        # Parse the JSON response
        data = json.loads(response.text)
        return data
    except Exception as e:
        logger.error(f"Error fetching response from Gemini API: {e}")
        return default_fallback


async def get_quiz_gemini_feedback(score: int, total_questions: int, correct_count: int, mission_title: str) -> str:
    """
    Get qualitative AI feedback from Gemini for a quiz based on the user's score.
    """
    default_fallback = {
        "Low": "Wah, ini serius? Kamu menjawab kuis ini sambil merem ya? Coba pelajari pembahasannya biar nggak ngaco terus.",
        "Medium": "Yaa lumayan lah untuk pemula, tapi jangan bangga dulu. Masih banyak yang harus dipelajari dari pembahasan kuis ini.",
        "High": "Hmm... bolehlah. Jawabanmu hampir semuanya benar. Tapi ingat, jangan malas dan cepat puas ya!"
    }
    
    # Determine fallback base on score
    if score < 60:
        fallback = default_fallback["Low"]
    elif score < 80:
        fallback = default_fallback["Medium"]
    else:
        fallback = default_fallback["High"]

    if not gemini_client:
        logger.warning("No Gemini Client initialized, returning fallback quiz feedback.")
        return fallback

    prompt = f"""Anda adalah "Scholar AI", asisten dosen yang cerdas, percaya diri, dan sedikit sombong (tsundere).
    
Kepribadian Anda:
- Jika skor kuis RENDAH (di bawah 40): Anda mengejek dengan sangat keras,tertawa, dan memaksanya mengulang kuis ini, dan sarkas
- Jika skor kuis RENDAH (di bawah 60): Anda MENGEJEK dengan santai dan sarkastik, tapi tetap memberikan dorongan belajar. Contoh nada: "Wah, ini serius? Kayaknya kamu asal klik deh...", "Hmm, kreatif sih — kreatif banget ngaconya."
- Jika skor kuis SEDANG (60-79): Anda bersikap biasa saja, netral tapi sedikit meremehkan. Contoh: "Yaa lumayan lah, tapi jangan bangga dulu.", "Standar. Bisa lebih bagus kalau kamu mau belajar pembahasan dikit lagi."
- Jika skor kuis TINGGI (80+): Anda memberi pujian ENGGAN dan tsundere. Contoh: "Hmm... bolehlah.", "Oke sih, aku akui ini... hampir semuanya benar. Jangan ge-er ya."

Tugas Anda:
Berikan 1-2 kalimat feedback umpan balik evaluatif singkat (maksimal 200 karakter) yang sangat sesuai dengan kepribadian Anda tentang hasil kuis siswa berikut.

Informasi Kuis Siswa:
- Judul Misi Kuis: "{mission_title}"
- Skor Akhir: {score}/100
- Jawaban Benar: {correct_count} dari {total_questions} pertanyaan

Keluarkan respon berupa teks feedback pendek langsung tanpa format tambahan.
"""
    try:
        response = await gemini_client.aio.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt
        )
        return response.text.strip().replace('"', '')
    except Exception as e:
        logger.error(f"Error fetching quiz feedback from Gemini: {e}")
        return fallback
