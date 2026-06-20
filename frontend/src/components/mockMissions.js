export const mockMissions = [
  {
    id: "misi-essay-1",
    title: "Analisis Dialektika dalam Puisi Chairil Anwar",
    type: "essay",
    category: "Sastra",
    description: "Tuliskan esai kritis sepanjang 500-800 kata mengenai penggunaan metafora kematian dalam karya 'Aku' dan 'Derai-derai Cemara'. Gunakan perspektif sejarah sastra Indonesia modern.",
    difficulty: "Tinggi",
    limit: "12 Jam",
    coin_reward: "200 Koin",
    exp_reward: "+50 XP",
    aspects: ["Kedalaman Analisis Struktural (30%)", "Kesesuaian Teori Dialektika (40%)", "Kreativitas Argumen (30%)"]
  },
  {
    id: "misi-quiz-1",
    title: "Dinamika Ekosistem Pesisir: Mangrove",
    type: "quiz",
    category: "Sains",
    description: "Uji pemahamanmu tentang peran vital hutan mangrove dalam menjaga keseimbangan ekosistem laut dan pencegahan abrasi.",
    difficulty: "Sedang",
    limit: "10 Menit",
    coin_reward: "60 Koin",
    exp_reward: "+150 EXP",
    questions: [
      {
        id: "q1",
        question: "Apa fungsi utama dari akar pneumatofor pada tanaman mangrove?",
        options: [
          { label: "A", text: "Menyerap nutrisi dari sedimen dalam." },
          { label: "B", text: "Membantu pertukaran gas (oksigen) di lingkungan berlumpur anaerob." },
          { label: "C", text: "Menyimpan cadangan air tawar." },
          { label: "D", text: "Melindungi pohon dari hempasan gelombang tsunami langsung." }
        ],
        correct: "B",
        explanation: "Akar pneumatofor (akar napas) tumbuh ke atas permukaan tanah/lumpur untuk mengambil oksigen dari udara karena sedimen mangrove sangat miskin oksigen (anaerob)."
      },
      {
        id: "q2",
        question: "Manakah dari berikut ini yang merupakan ancaman antropogenik terbesar bagi kelestarian mangrove?",
        options: [
          { label: "A", text: "Kenaikan permukaan air laut global." },
          { label: "B", text: "Konversi lahan menjadi tambak udang intensif dan pemukiman." },
          { label: "C", text: "Serangan hama serangga daun." },
          { label: "D", text: "Siklon tropis musiman." }
        ],
        correct: "B",
        explanation: "Konversi lahan oleh aktivitas manusia (antropogenik) seperti pembuatan tambak udang komersial menyumbang kerusakan mangrove terbesar dibanding faktor alamiah."
      }
    ]
  },
  {
    id: "misi-essay-2",
    title: "Sejarah Peradaban Kuno Mesopotamia",
    type: "essay",
    category: "Sejarah",
    description: "Menelusuri asal-usul sistem penulisan dan hukum pertama di dunia yang membentuk fondasi masyarakat modern saat ini.",
    difficulty: "Tinggi",
    limit: "12 Jam",
    coin_reward: "200 Koin",
    exp_reward: "+50 EXP",
    aspects: ["Akurasi Fakta Sejarah (40%)", "Kekuatan Analisis Kritis (30%)", "Kualitas Sintesis Sumber (30%)"]
  },
  {
    id: "misi-quiz-2",
    title: "Mekanika Kuantum Tingkat Dasar",
    type: "quiz",
    category: "Fisika",
    description: "Eksplorasi konsep dualitas gelombang-partikel dan prinsip ketidakpastian Heisenberg dalam kerangka fisika modern.",
    difficulty: "Tinggi",
    limit: "15 Menit",
    coin_reward: "80 Koin",
    exp_reward: "+180 EXP",
    questions: [
      {
        id: "q1",
        question: "Siapakah fisikawan yang mengemukakan prinsip ketidakpastian bahwa posisi dan momentum suatu partikel tidak dapat diukur secara presisi bersamaan?",
        options: [
          { label: "A", text: "Albert Einstein" },
          { label: "B", text: "Max Planck" },
          { label: "C", text: "Werner Heisenberg" },
          { label: "D", text: "Erwin Schrödinger" }
        ],
        correct: "C",
        explanation: "Prinsip Ketidakpastian Heisenberg dirumuskan oleh Werner Heisenberg pada tahun 1927."
      }
    ]
  },
  {
    id: "misi-essay-3",
    title: "Sastra Komparatif: Asia Tenggara",
    type: "essay",
    category: "Sastra",
    description: "Membandingkan tema resistensi dalam karya sastra Indonesia dan Filipina selama periode awal abad ke-20.",
    difficulty: "Sedang",
    limit: "12 Jam",
    coin_reward: "150 Koin",
    exp_reward: "+40 EXP",
    aspects: ["Komparasi Lintas Budaya (40%)", "Struktur Argumentasi (30%)", "Kekayaan Kosakata (30%)"]
  }
];
