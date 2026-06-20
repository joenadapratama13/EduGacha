import matplotlib.pyplot as plt
import matplotlib.patches as patches
import os

# Set up figure
fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(10, 5))
plt.rcParams['font.family'] = 'DejaVu Sans'

# Common styles
box_width = 0.8
box_height = 0.5

# Panel 1: LMS Konvensional (Siklus Negatif)
ax1.set_xlim(0, 1.2)
ax1.set_ylim(0, 4)
ax1.axis('off')
ax1.set_title('Siklus LMS Konvensional\n(Pemicu Burnout)', fontsize=12, fontweight='bold', color='#c0392b', pad=15)

# Draw boxes for LMS Konvensional
boxes_left = [
    {"y": 3.0, "text": "Tugas Administratif Monoton\n(Beban Tinggi, Pasif)"},
    {"y": 2.0, "text": "Koreksi Manual & Lambat\n(Tanpa Umpan Balik Instan)"},
    {"y": 1.0, "text": "Kejenuhan & Prokrastinasi\n(Burnout Pelajar)"},
    {"y": 0.0, "text": "Penurunan Motivasi Intrinsik\n(Siklus Berulang)"}
]

for box in boxes_left:
    rect = patches.FancyBboxPatch(
        (0.1, box["y"]), box_width, box_height,
        boxstyle="round,pad=0.03", linewidth=1.5, edgecolor='#c0392b', facecolor='#fdf2e9'
    )
    ax1.add_patch(rect)
    ax1.text(0.5, box["y"] + box_height/2, box["text"], ha='center', va='center', fontsize=9, color='#2c3e50')

# Draw arrows for left panel
for i in range(3):
    ax1.annotate('', xy=(0.5, 3.0 - i - 0.05), xytext=(0.5, 3.0 - i + 0.05 + box_height),
                arrowprops=dict(arrowstyle="->", color='#c0392b', lw=1.5))

# Panel 2: EduGacha (Siklus Positif)
ax2.set_xlim(0, 1.2)
ax2.set_ylim(0, 4)
ax2.axis('off')
ax2.set_title('Siklus Belajar EduGacha\n(Siklus Penghargaan yang Adil)', fontsize=12, fontweight='bold', color='#27ae60', pad=15)

# Draw boxes for EduGacha
boxes_right = [
    {"y": 3.0, "text": "Misi Belajar Aktif (Quest)\n(Esai & Tantangan Interaktif)"},
    {"y": 2.0, "text": "Penilaian AI Hibrida Instan\n(NLP Similarity & Feedback)"},
    {"y": 1.0, "text": "Gamifikasi Pity Gacha\n(Penghargaan Berkeadilan)"},
    {"y": 0.0, "text": "Motivasi Belajar Berkelanjutan\n(Siklus Penghargaan Efektif)"}
]

for box in boxes_right:
    rect = patches.FancyBboxPatch(
        (0.1, box["y"]), box_width, box_height,
        boxstyle="round,pad=0.03", linewidth=1.5, edgecolor='#27ae60', facecolor='#ebf5fb'
    )
    ax2.add_patch(rect)
    ax2.text(0.5, box["y"] + box_height/2, box["text"], ha='center', va='center', fontsize=9, color='#2c3e50')

# Draw arrows for right panel
for i in range(3):
    ax2.annotate('', xy=(0.5, 3.0 - i - 0.05), xytext=(0.5, 3.0 - i + 0.05 + box_height),
                arrowprops=dict(arrowstyle="->", color='#27ae60', lw=1.5))

plt.tight_layout()
os.makedirs('docs/assets', exist_ok=True)
plt.savefig('docs/assets/perbandingan_sistem.png', dpi=300)
print("Comparison chart generated successfully at docs/assets/perbandingan_sistem.png")
