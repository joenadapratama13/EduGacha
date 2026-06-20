import matplotlib.pyplot as plt
import seaborn as sns
import os

# Set style
sns.set_theme(style="whitegrid")
plt.rcParams['font.family'] = 'DejaVu Sans'

# Data
categories = [
    'Academic Burnout\n(Survei Nasional 2025)',
    'Kejenuhan Belajar\n(Studi Empiris)',
    'Prokrastinasi Akademik\n(Tingkat Pelajar)'
]
percentages = [56.0, 69.9, 70.8]

# Colors (modern tailored palette: blue, orange, red)
colors = ['#34495e', '#e67e22', '#c0392b']

# Create plot
fig, ax = plt.subplots(figsize=(8, 4.5))
bars = ax.bar(categories, percentages, color=colors, width=0.45, alpha=0.9)

# Customize axes
ax.set_ylim(0, 100)
ax.set_ylabel('Persentase (%)', fontsize=11, fontweight='bold', color='#2c3e50')
ax.set_title('Statistik Urgensi Permasalahan Pembelajaran Digital', fontsize=13, fontweight='bold', pad=15, color='#2c3e50')

# Add value labels on top of bars
for bar in bars:
    height = bar.get_height()
    ax.annotate(f'{height}%',
                xy=(bar.get_x() + bar.get_width() / 2, height),
                xytext=(0, 4),  # offset points
                textcoords="offset points",
                ha='center', va='bottom', fontsize=10, fontweight='bold', color='#2c3e50')

# Clean layout
sns.despine(left=True, bottom=True)
plt.tight_layout()

# Save image
os.makedirs('docs/assets', exist_ok=True)
plt.savefig('docs/assets/statistik_urgensi.png', dpi=300)
print("Chart generated successfully at docs/assets/statistik_urgensi.png")
