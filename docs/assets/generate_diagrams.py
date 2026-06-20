import matplotlib.pyplot as plt
import matplotlib.patches as patches
import os

def generate_workflow():
    fig, ax = plt.subplots(figsize=(8, 6))
    ax.set_xlim(0, 10)
    ax.set_ylim(0, 10)
    ax.axis('off')
    
    # Title
    ax.text(5, 9.5, 'Diagram Alur Penilaian Esai Hibrida (EduGacha)', 
            ha='center', va='center', fontsize=12, fontweight='bold', color='#2c3e50')
    
    # Box styles
    def draw_box(x, y, w, h, text, border_color, fill_color):
        rect = patches.FancyBboxPatch(
            (x, y), w, h, boxstyle="round,pad=0.03", 
            linewidth=1.5, edgecolor=border_color, facecolor=fill_color
        )
        ax.add_patch(rect)
        ax.text(x + w/2, y + h/2, text, ha='center', va='center', fontsize=9, color='#2c3e50', fontweight='bold')
    
    # 1. Siswa Mengunggah Esai
    draw_box(3.5, 7.8, 3.0, 0.8, "Siswa Mengunggah Esai\n(Antarmuka Next.js)", "#2980b9", "#ebf5fb")
    
    # 2. FastAPI Backend
    draw_box(3.5, 6.0, 3.0, 0.8, "FastAPI Backend Server\n(Orchestrator Penilaian)", "#2c3e50", "#f2f4f4")
    
    # 3. Parallel paths (Left: Local NLP, Right: Gemini API)
    draw_box(0.5, 4.0, 4.0, 1.0, "NLP sentence-transformers (Lokal)\nModel: MiniLM-L12-v2\n(Menghitung Cosine Similarity)", "#27ae60", "#eaafaf" if False else "#e8f8f5")
    draw_box(5.5, 4.0, 4.0, 1.0, "Generative AI (Gemini API)\nModel: gemini-2.5-flash\n(Membuat Umpan Balik Kualitatif)", "#8e44ad", "#f5eef8")
    
    # 4. Results
    draw_box(0.5, 2.2, 4.0, 0.8, "Skor Objektif Kesamaan\n(Skala 0 - 100)", "#27ae60", "#e8f8f5")
    draw_box(5.5, 2.2, 4.0, 0.8, "Umpan Balik Narasi Kualitatif\n(Aspek Tata Bahasa & Argumen)", "#8e44ad", "#f5eef8")
    
    # 5. Supabase & Mutasi
    draw_box(2.0, 0.2, 6.0, 1.0, "Supabase Database (PostgreSQL)\n- Menyimpan Skor & Feedback (RLS Aktif)\n- Menambah Koin Belajar & Update Pity Counter", "#e67e22", "#fdf2e9")
    
    # Draw Arrows
    # Top to FastAPI
    ax.annotate('', xy=(5.0, 6.85), xytext=(5.0, 7.8), arrowprops=dict(arrowstyle="->", color='#34495e', lw=1.5))
    # FastAPI to Left NLP
    ax.annotate('', xy=(2.5, 5.05), xytext=(4.0, 6.0), arrowprops=dict(arrowstyle="->", color='#34495e', lw=1.5))
    # FastAPI to Right Gemini
    ax.annotate('', xy=(7.5, 5.05), xytext=(6.0, 6.0), arrowprops=dict(arrowstyle="->", color='#34495e', lw=1.5))
    
    # Left NLP to Left Result
    ax.annotate('', xy=(2.5, 3.05), xytext=(2.5, 4.0), arrowprops=dict(arrowstyle="->", color='#27ae60', lw=1.5))
    # Right Gemini to Right Result
    ax.annotate('', xy=(7.5, 3.05), xytext=(7.5, 4.0), arrowprops=dict(arrowstyle="->", color='#8e44ad', lw=1.5))
    
    # Left Result to Supabase
    ax.annotate('', xy=(3.5, 1.25), xytext=(2.5, 2.2), arrowprops=dict(arrowstyle="->", color='#e67e22', lw=1.5))
    # Right Result to Supabase
    ax.annotate('', xy=(6.5, 1.25), xytext=(7.5, 2.2), arrowprops=dict(arrowstyle="->", color='#e67e22', lw=1.5))

    plt.tight_layout()
    os.makedirs('docs/assets', exist_ok=True)
    plt.savefig('docs/assets/alur_kerja.png', dpi=300)
    plt.close()

def generate_erd():
    fig, ax = plt.subplots(figsize=(8, 4))
    ax.set_xlim(0, 10)
    ax.set_ylim(0, 5)
    ax.axis('off')
    
    # Title
    ax.text(5, 4.5, 'Skema Relasi Database Supabase PostgreSQL (ERD)', 
            ha='center', va='center', fontsize=12, fontweight='bold', color='#2c3e50')
    
    # Draw table profiles
    rect1 = patches.FancyBboxPatch(
        (0.5, 0.5), 3.5, 3.2, boxstyle="round,pad=0.03", 
        linewidth=1.5, edgecolor='#2c3e50', facecolor='#f8f9f9'
    )
    ax.add_patch(rect1)
    ax.text(2.25, 3.4, "tabel: profiles", ha='center', va='center', fontsize=10, fontweight='bold', color='#2c3e50')
    ax.axhline(3.2, xmin=0.08, xmax=0.42, color='#2c3e50', lw=1.0)
    
    cols1 = [
        "id : UUID (PK, FK to auth)",
        "username : TEXT",
        "coins : INTEGER (default 200)",
        "exp : INTEGER (default 0)",
        "level : INTEGER (default 1)",
        "pity_counter : INTEGER (default 0)",
        "created_at : TIMESTAMPTZ"
    ]
    for idx, col in enumerate(cols1):
        ax.text(0.7, 2.9 - (idx * 0.35), f"• {col}", ha='left', va='center', fontsize=8, color='#34495e')
        
    # Draw table essays
    rect2 = patches.FancyBboxPatch(
        (6.0, 0.5), 3.5, 3.2, boxstyle="round,pad=0.03", 
        linewidth=1.5, edgecolor='#2c3e50', facecolor='#f8f9f9'
    )
    ax.add_patch(rect2)
    ax.text(7.75, 3.4, "tabel: essays", ha='center', va='center', fontsize=10, fontweight='bold', color='#2c3e50')
    ax.axhline(3.2, xmin=0.63, xmax=0.97, color='#2c3e50', lw=1.0)
    
    cols2 = [
        "id : UUID (PK)",
        "user_id : UUID (FK to profiles)",
        "content : TEXT",
        "score : INTEGER (0-100)",
        "ai_feedback : TEXT",
        "coins_earned : INTEGER",
        "created_at : TIMESTAMPTZ"
    ]
    for idx, col in enumerate(cols2):
        ax.text(6.2, 2.9 - (idx * 0.35), f"• {col}", ha='left', va='center', fontsize=8, color='#34495e')
        
    # Draw relationship line (1 to N)
    # 1 side: profiles
    ax.text(4.1, 2.1, "1", fontsize=10, color='#e67e22', fontweight='bold')
    # N side: essays
    ax.text(5.7, 2.1, "N", fontsize=10, color='#e67e22', fontweight='bold')
    
    ax.annotate('', xy=(6.0, 2.1), xytext=(4.0, 2.1), 
                arrowprops=dict(arrowstyle="<|-|>", color='#e67e22', lw=1.5))
    ax.text(5.0, 2.3, "memiliki (owns)", ha='center', va='center', fontsize=8, color='#e67e22', fontstyle='italic')

    plt.tight_layout()
    os.makedirs('docs/assets', exist_ok=True)
    plt.savefig('docs/assets/skema_database.png', dpi=300)
    plt.close()

if __name__ == "__main__":
    generate_workflow()
    generate_erd()
    print("Diagrams generated successfully!")
