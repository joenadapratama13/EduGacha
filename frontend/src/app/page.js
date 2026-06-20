'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import Navbar from '../components/Navbar';

function UnifiedVideoPlayer() {
  const [activeVideo, setActiveVideo] = useState(1); // 1 = adegan_awal_2.mp4, 2 = adegan_awal_1.mp4
  const videoRef1 = useRef(null);
  const videoRef2 = useRef(null);

  useEffect(() => {
    if (activeVideo === 1 && videoRef1.current) {
      videoRef1.current.play().catch((err) => console.log("Video 1 play failed:", err));
    }
  }, [activeVideo]);

  const handleVideo1Ended = () => {
    setActiveVideo(2);
    if (videoRef2.current) {
      videoRef2.current.currentTime = 0;
      videoRef2.current.play().catch((err) => console.log("Video 2 play failed:", err));
    }
  };

  const handleVideo2Ended = () => {
    setActiveVideo(1);
    if (videoRef1.current) {
      videoRef1.current.currentTime = 0;
      videoRef1.current.play().catch((err) => console.log("Video 1 play failed:", err));
    }
  };

  return (
    <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-black">
      {/* Video 2 (Typing -> Chest Appears) */}
      <video
        ref={videoRef1}
        src="/videos/adegan_awal_2.mp4"
        muted
        playsInline
        disablePictureInPicture={true}
        onContextMenu={(e) => e.preventDefault()}
        onEnded={handleVideo1Ended}
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${
          activeVideo === 1 ? 'opacity-100 z-10' : 'opacity-0 z-0'
        }`}
      />
      {/* Video 1 (Chest Opens -> Typing) */}
      <video
        ref={videoRef2}
        src="/videos/adegan_awal_1.mp4"
        muted
        playsInline
        disablePictureInPicture={true}
        onContextMenu={(e) => e.preventDefault()}
        onEnded={handleVideo2Ended}
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${
          activeVideo === 2 ? 'opacity-100 z-10' : 'opacity-0 z-0'
        }`}
      />
    </div>
  );
}

export default function Home() {
  // Micro-interactions: Scroll reveal effects
  useEffect(() => {
    const observerOptions = {
      threshold: 0.1,
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('reveal-active');
        }
      });
    }, observerOptions);

    const animatedElements = document.querySelectorAll('section > div');
    animatedElements.forEach((el) => {
      el.classList.add('transition-all', 'duration-1000', 'reveal-init');
      observer.observe(el);
    });

    return () => {
      animatedElements.forEach((el) => observer.unobserve(el));
    };
  }, []);

  return (
    <>
      <Navbar />
      <main className="pt-20 bg-background text-ink-text font-body-md selection:bg-primary-fixed selection:text-on-primary-fixed">
        {/* Hero Section */}
        <section className="relative min-h-[819px] flex items-center justify-center overflow-hidden paper-texture">
          <div className="absolute inset-0 bg-primary/5 pointer-events-none transition-all duration-1000 opacity-100 translate-y-0"></div>
          <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop flex flex-col items-center text-center relative z-10 transition-all duration-1000 opacity-100 translate-y-0 w-full">
            <div className="inline-block px-4 py-1 mb-6 border border-primary/30 rounded-full bg-surface-container-low font-label-mono text-label-mono text-primary uppercase tracking-widest">
              Reinvensi Akademik
            </div>
            <h1 className="font-headline-xl text-headline-xl text-ink-text mb-6 max-w-4xl leading-tight">
              Ketika Kedisiplinan Akademik Bertemu <span className="text-primary italic">dengan Kebahagiaan Reward.</span>
            </h1>
            <p className="font-body-lg text-body-lg text-on-surface-variant mb-10 max-w-2xl">
              Kuasai kurikulum Anda melalui pembelajaran terfokus, dapatkan artefak koleksi langka, dan ubah pembelajaran tradisional menjadi petualangan legendaris.
            </p>
            <div className="flex flex-col sm:flex-row gap-gutter">
              <a
                className="px-10 py-4 bg-primary text-white text-lg flex items-center justify-center gap-2 hover:opacity-90 transition-all duration-300 font-bold hover:no-underline rounded-lg"
                href="#how-it-works"
              >
                Mulai Belajar <span className="material-symbols-outlined">school</span>
              </a>
            </div>
          </div>
          {/* Decorative Pencil Sketch Mockup Background (Abstract) */}
          <div className="absolute -bottom-10 right-0 opacity-20 hidden lg:block transition-all duration-1000 opacity-100 translate-y-0">
            <img
              alt="Sketsa pensil abstrak dari meja belajar akademis yang berantakan dengan koin dan bintang yang melayang."
              className="w-[600px] transform rotate-3"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuDodenjvQNMkYngH_yJ8uAIolAH8Qg4g_6VNUz2_OsJ1jbL7O7qwc7VcRAyfVhy69djbdD9zr2I30DL4B2XpQkmfbIzVaoYZ6MmQR--dTudueuvY9Z5dUC5xUAsJBQsQ7JM_wtHyzeR3iz8ksqB6YzuJRaj5Ke2Ta5eXNQiSI5PNVhTwCi0vAl59KLobDbmHEXZ6OQEjbGXlGYsFyZuRVO0lwTfTvGV7ryBBp3dAnWlZxJTxITuNfoV41OkG71lv96vsVxOXt07UlLk"
            />
          </div>
        </section>

        {/* Section Gabungan: Video Showcase & Deskripsi EduGacha */}
        <section className="py-24 bg-surface-container-low border-y border-parchment-border mb-16">
          <div className="max-w-4xl mx-auto px-margin-mobile md:px-margin-desktop w-full text-center flex flex-col items-center">
            
            {/* Heading */}
            <h2 className="font-headline-lg text-4xl text-ink-text mb-6 tracking-tighter max-w-2xl leading-tight">
              EduGacha: Merevolusi Cara Belajar Anda
            </h2>

            {/* Video Player Terpadu (Menyatukan Video 2 dan Video 1 secara berurutan) */}
            <div className="max-w-2xl w-full mb-12 bg-paper-surface p-3 border border-parchment-border rounded-xl ink-drop-shadow">
              <UnifiedVideoPlayer />
            </div>

            {/* Description */}
            <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl leading-relaxed">
              EduGacha adalah platform e-learning inovatif terbaru yang dirancang khusus untuk mengatasi kejenuhan belajar. Dengan menyatukan kecerdasan buatan (AI) untuk penilaian esai objektif dan psikologi gamifikasi berkeadilan (Pity System), kami mengubah penulisan esai tradisional menjadi pencarian harta karun akademis yang mendebarkan. Setiap tulisan berkualitas yang Anda kirimkan akan dianalisis secara instan, menghasilkan koin untuk menarik gacha, dan membuka hadiah legendaris yang memacu motivasi intrinsik Anda.
            </p>
          </div>
        </section>

        {/* Why Choose EduGacha */}
        <section className="py-24 bg-surface-container-low border-y border-parchment-border mb-16">
          <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop transition-all duration-1000 opacity-100 translate-y-0 w-full">
            <div className="text-center mb-16">
              <h2 className="font-headline-lg text-headline-lg text-ink-text mb-4 tracking-tighter">
                Kenapa Memilih EduGacha?
              </h2>
              <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl mx-auto">
                Inovasi pendidikan yang menggabungkan kecerdasan buatan dengan keseruan bermain.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-gutter">
              {/* Card 1 */}
              <div className="flex flex-col gap-4 p-4">
                <div className="bg-white p-2 border border-parchment-border rounded-lg ink-drop-shadow">
                  <img
                    alt="AI Grading"
                    className="w-full h-48 object-contain"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuDY7UusKF_BFs-UrdRKvxwpv-FCYLiwjtx7bGwUBdNpZthZ2jJ0q_I0KrJSdCZ6FbLFFPiSSH7aNyacvkD87DMUnUQ_AwTWhDtk2IRqzeIyRmbaLqH29qo0FEXd1SM0msVP-F-OaM4eYxP4AbURI_YYp52Xkqf5EzSqJlcwjfaLOgbmndLGZcGGMnweS8DUhVi9UybTlsolun4eGiv-qPhSTFz7N3RQ_r1R_6po3QPX6TZkIcK6ZMz6K1XLoiNPFuUm_9MZKWDYKJkv"
                  />
                </div>
                <p className="font-body-md text-on-surface-variant leading-relaxed">
                  Lupakan rasa cemas menunggu hasil koreksi berhari-hari. Sistem AI cerdas kami menganalisis esaimu secara mendalam dan memberikan penilaian akurat hanya dalam hitungan detik setelah kamu mengirimkannya.
                </p>
              </div>
              {/* Card 2 */}
              <div className="flex flex-col gap-4 p-4">
                <div className="bg-white p-2 border border-parchment-border rounded-lg ink-drop-shadow">
                  <img
                    alt="Magic Chest"
                    className="w-full h-48 object-contain"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuD7eS4-aWXa-lnw8AnAVa-HHAbf9pr33D5ekcYLkWeidmAONyZDxBiZiXKD9ZAZjpyQbrkRQNf3YmHP3JP8Axpzji-L5cSXCqG9h4BkfyU-QKShrWPXE4KFLMQR9ZBETdMgzGJ0EvTHCkI6Tj5X6wjIdM-k6phHo86LzDsW17sQf0vICvW3a-Ye7vnHj5Y4mVPbBK5D2qnWad4bl7YNCqtRCHxodQjcYwi1n8aMzB5VcrYAg-Gc5F7SF1IhGt-UJGF0wyd8y_6LqkZy"
                  />
                </div>
                <p className="font-body-md text-on-surface-variant leading-relaxed">
                  Ubah setiap kerja keras dan nilai tulisanmu menjadi Token Gacha. Buka peti ajaib untuk mengoleksi item-item langka dan hadiah menarik. Semakin berkualitas esaimu, semakin tinggi kesempatanmu mendapat reward premium.
                </p>
              </div>
              {/* Card 3 */}
              <div className="flex flex-col gap-4 p-4">
                <div className="bg-white p-2 border border-parchment-border rounded-lg ink-drop-shadow">
                  <img
                    alt="Student Writing"
                    className="w-full h-48 object-contain"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuCxlZudFfeYPSxEcJcJlzeZ2723nvM4j9U5zKQ8nf3bXOYPIB4g-sQjkN5Ps3jjhYysBE5bXxXPNXIZgc28Wrp2JEM4uUiaz_lrkXfu8rayk8ZVOhVdan3ISiQ9BrLGaag1n6TYFZWxqipAsDd4g_bb9fkncW-mjkRRp_b9L83gK87Ka4leOd6fyonI3s0vis6CNzZakApt26hHifoOszaqLGt_RMZLVfXHT2rHDxfYZ_mx3VR4sQS91YIZ9NyToQYVdjbtFam2u4yf"
                  />
                </div>
                <p className="font-body-md text-on-surface-variant leading-relaxed">
                  Belajar tidak lagi terbatas pada memilih opsi A, B, atau C secara kaku. Saatnya kamu menuliskan opini, menyusun argumen orisinal, dan melatih cara berpikir kritis dengan caramu sendiri.
                </p>
              </div>
              {/* Card 4 */}
              <div className="flex flex-col gap-4 p-4">
                <div className="bg-white p-2 border border-parchment-border rounded-lg ink-drop-shadow">
                  <img
                    alt="Feedback Checklist"
                    className="w-full h-48 object-contain"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuAkUEewDntmaQG0AklR-togueZspcvFdhSkNVV-UCR1yBg6hK3EifUqrgXxJyYq-C5IcOg58g3Lu3HijHZCJHhEtJqS_8nGHdvN2PM-JnEotUCt644TfOUKBG7Nb0kj1sLiyl7ccgaiR54tXGQxsSnE03O32Pm7nSHQu9J2uBLLbrOUn-pfZrB1XsF4OqzhXMqNkjEzplej69T7Aflew0dg94Fj78woyKWoNuR0bTnYizZRgJ8T_Z6FBrGlESFKF6rH4udwvOUyUKHw"
                  />
                </div>
                <p className="font-body-md text-on-surface-variant leading-relaxed">
                  Lebih dari sekadar angka, kamu akan mendapatkan coretan masukan yang personal. Kami membedah tata bahasa, logika berpikir, dan memberikan tips menulis agar kemampuan tulisanmu terus meningkat tajam.
                </p>
              </div>
              {/* Card 5 */}
              <div className="flex flex-col gap-4 p-4">
                <div className="bg-white p-2 border border-parchment-border rounded-lg ink-drop-shadow">
                  <img
                    alt="Free Coins"
                    className="w-full h-48 object-contain"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuBjK2AMm9lxrfsVQYoMRyKw-z4Fd46ktyELUfWRYPe9QCiqSuiErwoPnaJ9LXKpvJtL51X7kDHu6IDU9rb9FwKmoSHQIsFo2Hrnxxj0JT_Bk35JuTcfjbYRHL5D4VfQP2KQNMQ3AfbLXSP8paoEbHB1I2rr81oVzkiwpxnlmGQifQbr1vrgJEV2a0GYePaivOhVmtRfqkKXJRQmJ9DFHo3_Ien1sAqnAh5J-8QzpFn4ia5hhnSZToK2bUk9XDrUMeK5PRDCgEgPyId0"
                  />
                </div>
                <p className="font-body-md text-on-surface-variant leading-relaxed">
                  Semua siswa berhak mendapatkan pendidikan berkualitas. Seluruh analisis AI, token gacha, dan akses ke perpustakaan fitur dapat dinikmati secara gratis tanpa batasan biaya tersembunyi.
                </p>
              </div>
              {/* Card 6 */}
              <div className="flex flex-col gap-4 p-4">
                <div className="bg-white p-2 border border-parchment-border rounded-lg ink-drop-shadow">
                  <img
                    alt="Digital Portfolio"
                    className="w-full h-48 object-contain"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuD3eL_Yw0Va21YxzE--OtxIcGqMQXDyDOhsB4v8g40k1HJYOYQAsU5-bvzhw4xwMcm93_KvjjwPjvu-sgrleHNFErF9ylR1f9QSc2XOpZIbWnynAs_nmlTw4XzhV4k2pQNWSqFgkuZvmOP4GLMHqkuRo6WHDnUC41Ud7s-43yyIsw6wNtuHpWR4QtYK8S03SGt0JLtxYWlULJ2rEpDeYAGcj8O65UbeSHc2IXIsrTDohLJgtKHubSMkIKzPshZ9h_BKN7SqU54MB2BW"
                  />
                </div>
                <p className="font-body-md text-on-surface-variant leading-relaxed">
                  Setiap esai terbaik yang kamu selesaikan dan semua koleksi gacha yang berhasil kamu menangkan akan terdokumentasi rapi di portofolio digital pribadimu, siap dipamerkan sebagai bukti nyata pencapaianmu.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* The Problem */}
        <section className="py-24 bg-surface-container-lowest mb-16">
          <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop grid md:grid-cols-2 gap-16 items-center transition-all duration-1000 opacity-100 translate-y-0 w-full">
            <div>
              <h2 className="font-headline-lg text-headline-lg text-ink-text mb-8 tracking-tighter">
                Keluar dari Monotonnya LMS
              </h2>
              <div className="space-y-6 text-on-surface-variant font-body-md text-body-md">
                <p>
                  Sistem manajemen pembelajaran (LMS) tradisional sering kali terasa seperti pekerjaan rumah digital—daftar tugas tanpa akhir, antarmuka yang steril, dan motivasi ekstrinsik yang memudar setelah minggu pertama.
                </p>
                <p className="border-l-4 border-primary/20 pl-6 italic">
                  &quot;Kami mengubah perpustakaan dari tempat yang membosankan menjadi dunia penemuan aktif.&quot;
                </p>
                <div className="grid grid-cols-2 gap-6 pt-6">
                  <div className="p-6 bg-surface-container-low border border-parchment-border">
                    <span className="material-symbols-outlined text-primary text-3xl mb-2">trending_down</span>
                    <p className="font-label-mono text-xs uppercase tracking-tighter text-ink-muted">
                      Penurunan Retensi
                    </p>
                    <p className="font-stats-lg text-stats-lg text-ink-text">45%</p>
                  </div>
                  <div className="p-6 bg-surface-container-low border border-parchment-border">
                    <span className="material-symbols-outlined text-primary text-3xl mb-2">sentiment_dissatisfied</span>
                    <p className="font-label-mono text-xs uppercase tracking-tighter text-ink-muted">
                      Kejenuhan Siswa
                    </p>
                    <p className="font-stats-lg text-stats-lg text-ink-text">Tinggi</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-paper-surface p-4 border border-parchment-border ink-drop-shadow rounded-lg w-full">
              <img
                alt="Serangkaian panel yang menunjukkan seorang siswa yang berjuang dengan buku-buku tradisional vs menemukan sistem hadiah EduGacha."
                className="w-full h-auto grayscale hover:grayscale-0 transition-all duration-700"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuDUqgQ2n5MJjwbaD37uDmEpP0cavxv1KBpExsU8en-fJOMc6sfsPWIPw3J9M89FTwSCCA0TgTXNoJepVWAjQ4rNH1tVYu0LVYNa3iq0bL1aU6rVib6FoHeryRJF3p5TU4HH-inRp4X2XqOWVWkpsv4CVUY1JbVhHRL-ve6zXPbjsTItuNBdrp7astMf98_eyFY9S0MWSxdfFg1VV1m1DcHTy0se7tDI44hZ7_AOcC0tTq-AMXJweIiRjTQtnMhwpscJEowQrSk5lbw0"
              />
            </div>
          </div>
        </section>

        {/* Solution (How It Works) */}
        <section className="py-24 paper-texture mb-16" id="how-it-works">
          <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop text-center mb-16 transition-all duration-1000 opacity-100 translate-y-0 w-full">
            <h2 className="font-headline-lg text-headline-lg text-ink-text mb-4 tracking-tighter">
              Siklus Keunggulan
            </h2>
            <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl mx-auto">
              Metodologi empat langkah kami memastikan bahwa setiap menit fokus diterjemahkan menjadi kemajuan nyata dan kejutan yang menyenangkan.
            </p>
          </div>
          <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop transition-all duration-1000 opacity-100 translate-y-0 w-full">
            <div className="relative bg-paper-surface border border-parchment-border p-8 ink-drop-shadow">
              <img
                alt="Ilustrasi instruksional empat panel: 1. Siswa menulis esai, 2. Mengumpulkan token emas bercahaya ke dalam tas, 3. Berinteraksi dengan mesin gacha kuno, 4. Merayakan dengan peti hadiah."
                className="w-full h-auto mb-12"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuDUqgQ2n5MJjwbaD37uDmEpP0cavxv1KBpExsU8en-fJOMc6sfsPWIPw3J9M89FTwSCCA0TgTXNoJepVWAjQ4rNH1tVYu0LVYNa3iq0bL1aU6rVib6FoHeryRJF3p5TU4HH-inRp4X2XqOWVWkpsv4CVUY1JbVhHRL-ve6zXPbjsTItuNBdrp7astMf98_eyFY9S0MWSxdfFg1VV1m1DcHTy0se7tDI44hZ7_AOcC0tTq-AMXJweIiRjTQtnMhwpscJEowQrSk5lbw0"
              />
              <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
                <div className="text-center group">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-primary group-hover:text-white transition-all bg-primary/20 text-primary">
                    <span className="font-stats-lg">1</span>
                  </div>
                  <h3 className="font-headline-lg text-lg text-ink-text mb-2">Kerjakan Kuis</h3>
                  <p className="text-on-surface-variant font-body-md text-sm">
                    Selesaikan tantangan akademis yang ketat dan rancang esai yang mendalam.
                  </p>
                </div>
                <div className="hidden md:flex items-center justify-center text-primary/30">
                  <span className="material-symbols-outlined text-4xl">arrow_forward</span>
                </div>
                <div className="text-center group">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-primary group-hover:text-white transition-all bg-primary/20 text-primary">
                    <span className="font-stats-lg">2</span>
                  </div>
                  <h3 className="font-headline-lg text-lg text-ink-text mb-2">Kumpulkan Token</h3>
                  <p className="text-on-surface-variant font-body-md text-sm">
                    Dapatkan mata uang Gacha berdasarkan performa dan akurasi jawabanmu.
                  </p>
                </div>
                <div className="hidden md:flex items-center justify-center text-primary/30">
                  <span className="material-symbols-outlined text-4xl">arrow_forward</span>
                </div>
                <div className="text-center group">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-primary group-hover:text-white transition-all bg-primary/20 text-primary">
                    <span className="font-stats-lg">3</span>
                  </div>
                  <h3 className="font-headline-lg text-lg text-ink-text mb-2">Tarik Gacha</h3>
                  <p className="text-on-surface-variant font-body-md text-sm">
                    Putar roda mesin akademik untuk mendapatkan hadiah misteri bertingkat.
                  </p>
                </div>
                <div className="hidden md:flex items-center justify-center text-primary/30">
                  <span className="material-symbols-outlined text-4xl">arrow_forward</span>
                </div>
                <div className="text-center group">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-primary group-hover:text-white transition-all bg-primary/20 text-primary">
                    <span className="font-stats-lg">4</span>
                  </div>
                  <h3 className="font-headline-lg text-lg text-ink-text mb-2">Klaim Hadiah</h3>
                  <p className="text-on-surface-variant font-body-md text-sm">
                    Buka hadiah nyata, sertifikat pencapaian, dan akses fitur eksklusif.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* AI Grading Feature */}
        <section className="py-24 bg-surface-container-high overflow-hidden mb-16">
          <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop transition-all duration-1000 opacity-100 translate-y-0 w-full">
            <div className="grid lg:grid-cols-5 gap-16 items-center">
              <div className="lg:col-span-3 order-2 lg:order-1 relative w-full">
                <div className="absolute -top-10 -left-10 w-40 h-40 border-t-2 border-l-2 border-primary/20 pointer-events-none"></div>
                <div className="bg-paper-surface border border-parchment-border p-2 rounded-xl ink-drop-shadow">
                  <img
                    alt="Ilustrasi sketsa pensil terperinci dari robot futuristik yang duduk di meja, dengan hati-hati menilai esai kertas fisik dengan pensil merah dan bintang emas yang melayang."
                    className="w-full rounded-lg"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuCPtqFjP5xOwaE9q7_RcWe8EKtd3jCLOHzAPL9Wg2NIlQcQvS9jUucZOY0duKoUCzL2n_PuFNXSG2oIJcnjPkHzW0nqnYvXNe1N8QKhvLnctgP4kgpvvMbwNHdDMJBRrU3QFjyXKiKYMc7zglXbWqF6i1v8OCuE_3m0_urXbjLP6PYls3YveGKokr55IGueUjk3TKkL2_DwDi26w19wWM0LAD2Se3IjUaBFTiMcjrbrtDyUEK1_RAewAnBnv0_-OiUl7VOoMfSC8F2S"
                  />
                </div>
                <div className="absolute -bottom-6 -right-6 p-6 bg-primary text-white border-2 border-surface ink-drop-shadow max-w-[200px]">
                  <p className="font-label-mono text-xs uppercase tracking-widest mb-1">Status</p>
                  <p className="font-headline-lg text-sm italic">&quot;Meninjau Kedalaman Kognitif...&quot;</p>
                </div>
              </div>
              <div className="lg:col-span-2 order-1 lg:order-2">
                <div className="flex items-center gap-3 mb-6 text-primary">
                  <span className="material-symbols-outlined text-4xl">neurology</span>
                  <span className="font-label-mono font-bold uppercase tracking-widest">Mesin NLP Hibrida</span>
                </div>
                <h2 className="font-headline-lg text-headline-lg text-ink-text mb-6 tracking-tighter">
                  AI Generatif dengan Sentuhan Manusia
                </h2>
                <p className="font-body-lg text-body-lg text-on-surface-variant mb-8">
                  Berbeda dengan penilai otomatis tradisional, sistem kami menggunakan AI generatif canggih untuk memberikan umpan balik semantik—tidak hanya mengidentifikasi kesalahan, tetapi juga membimbing Anda menuju penguasaan.
                </p>
                <ul className="space-y-4">
                  <li className="flex items-start gap-4">
                    <span className="material-symbols-outlined text-primary mt-1">check_circle</span>
                    <div>
                      <h4 className="font-bold text-ink-text">Analisis Kontekstual</h4>
                      <p className="text-sm text-on-surface-variant">Memahami nuansa argumen Anda, bukan hanya sekadar kata kunci.</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-4">
                    <span className="material-symbols-outlined text-primary mt-1">history_edu</span>
                    <div>
                      <h4 className="font-bold text-ink-text">Evolusi Umpan Balik</h4>
                      <p className="text-sm text-on-surface-variant">Menyesuaikan gaya bimbingannya berdasarkan riwayat kiriman esai Anda sebelumnya.</p>
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Reward Tiers */}
        <section className="py-24 paper-texture mb-16" id="rewards">
          <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop transition-all duration-1000 opacity-100 translate-y-0 w-full">
            <div className="text-center mb-16">
              <h2 className="font-headline-lg text-headline-lg text-ink-text mb-4 tracking-tighter">
                Naikkan Tingkatan Anda
              </h2>
              <p className="font-body-lg text-body-lg text-on-surface-variant">
                Kerja keras Anda akan terwujud sebagai harta karun legendaris dari prestise akademik.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {/* Common */}
              <div className="bg-paper-surface border border-parchment-border p-6 rounded group hover:border-primary transition-all duration-300">
                <div className="h-48 flex items-center justify-center mb-6 overflow-hidden">
                  <img
                    alt="Kotak harta karun kayu sederhana yang mewakili hadiah Common, diilustrasikan dengan gaya sketsa pensil yang bersih."
                    className="w-full h-full object-contain transform group-hover:scale-110 transition-transform duration-500"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuDSS474Z0aXvTqAsdcPX14F2g48FnCMG2D5tkI8Cwf1siEHZj-AHocihdw3LkJct2DjysNxdm3JoQ-XhhtWs5eOvlAMSk1VVA_vgWl7h-SgKRfLzgsddPoBrR6Dob-JK3tjo5vJmbqlncaDjDrmEHNAJI0AlpXXRCvBSIqLj4zUHY1-gIOp7cRVJ1jyPiJ6IQAnDhM49pNEI_gyh9PgL3-V5sDW0KbSlSt_vmH8RR3Tpb2ex2E1AZrltGFO1QkArF1SPpaSXbo4VWm7"
                  />
                </div>
                <div className="text-center">
                  <span className="font-label-mono text-xs text-ink-muted uppercase mb-2 block">Akses Standar</span>
                  <h3 className="font-headline-lg text-xl text-ink-text mb-3">Common</h3>
                  <p className="text-sm text-on-surface-variant mb-4">
                    Alat bantu belajar dasar, lencana dekoratif, dan token sumber daya kuis.
                  </p>
                </div>
              </div>
              {/* Rare */}
              <div className="bg-paper-surface border border-parchment-border p-6 rounded group hover:border-tier-rare transition-all duration-300">
                <div className="h-48 flex items-center justify-center mb-6 overflow-hidden">
                  <img
                    alt="Peti harta karun yang diperkuat perak yang mewakili hadiah Rare dengan aksen batu permata biru."
                    className="w-full h-full object-contain transform group-hover:scale-110 transition-transform duration-500"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuDSS474Z0aXvTqAsdcPX14F2g48FnCMG2D5tkI8Cwf1siEHZj-AHocihdw3LkJct2DjysNxdm3JoQ-XhhtWs5eOvlAMSk1VVA_vgWl7h-SgKRfLzgsddPoBrR6Dob-JK3tjo5vJmbqlncaDjDrmEHNAJI0AlpXXRCvBSIqLj4zUHY1-gIOp7cRVJ1jyPiJ6IQAnDhM49pNEI_gyh9PgL3-V5sDW0KbSlSt_vmH8RR3Tpb2ex2E1AZrltGFO1QkArF1SPpaSXbo4VWm7"
                  />
                </div>
                <div className="text-center">
                  <span className="font-label-mono text-xs text-tier-rare uppercase mb-2 block font-bold">
                    Akses Prioritas
                  </span>
                  <h3 className="font-headline-lg text-xl text-ink-text mb-3">Rare</h3>
                  <p className="text-sm text-on-surface-variant mb-4">
                    Materi belajar premium, undangan seminar eksklusif, dan avatar profil langka.
                  </p>
                </div>
              </div>
              {/* Epic */}
              <div className="bg-paper-surface border border-parchment-border p-6 rounded group hover:border-tier-epic transition-all duration-300">
                <div className="h-48 flex items-center justify-center mb-6 overflow-hidden">
                  <img
                    alt="Peti berornamen dengan cahaya ungu dan filigri emas, mewakili hadiah tingkat Epic."
                    className="w-full h-full object-contain transform group-hover:scale-110 transition-transform duration-500"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuDSS474Z0aXvTqAsdcPX14F2g48FnCMG2D5tkI8Cwf1siEHZj-AHocihdw3LkJct2DjysNxdm3JoQ-XhhtWs5eOvlAMSk1VVA_vgWl7h-SgKRfLzgsddPoBrR6Dob-JK3tjo5vJmbqlncaDjDrmEHNAJI0AlpXXRCvBSIqLj4zUHY1-gIOp7cRVJ1jyPiJ6IQAnDhM49pNEI_gyh9PgL3-V5sDW0KbSlSt_vmH8RR3Tpb2ex2E1AZrltGFO1QkArF1SPpaSXbo4VWm7"
                  />
                </div>
                <div className="text-center">
                  <span className="font-label-mono text-xs text-tier-epic uppercase mb-2 block font-bold">
                    Manfaat Elit
                  </span>
                  <h3 className="font-headline-lg text-xl text-ink-text mb-3">Epic</h3>
                  <p className="text-sm text-on-surface-variant mb-4">
                    Voucher bimbingan belajar 1-lawan-1 langsung dan merchandise akademik fisik eksklusif.
                  </p>
                </div>
              </div>
              {/* Legendary */}
              <div className="bg-paper-surface border border-parchment-border p-6 rounded group hover:border-tier-legendary transition-all duration-300 relative">
                <div className="absolute -top-3 -right-3 bg-tier-legendary text-white px-3 py-1 text-[10px] font-bold uppercase tracking-widest z-10 shadow-sm">
                  Jaminan Pity
                </div>
                <div className="h-48 flex items-center justify-center mb-6 overflow-hidden">
                  <img
                    alt="Peti harta karun emas bercahaya terang yang diisi dengan artefak dan pedang, mewakili hadiah tingkat Legendary tertinggi."
                    className="w-full h-full object-contain transform group-hover:scale-110 transition-transform duration-500"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuDSS474Z0aXvTqAsdcPX14F2g48FnCMG2D5tkI8Cwf1siEHZj-AHocihdw3LkJct2DjysNxdm3JoQ-XhhtWs5eOvlAMSk1VVA_vgWl7h-SgKRfLzgsddPoBrR6Dob-JK3tjo5vJmbqlncaDjDrmEHNAJI0AlpXXRCvBSIqLj4zUHY1-gIOp7cRVJ1jyPiJ6IQAnDhM49pNEI_gyh9PgL3-V5sDW0KbSlSt_vmH8RR3Tpb2ex2E1AZrltGFO1QkArF1SPpaSXbo4VWm7"
                  />
                </div>
                <div className="text-center">
                  <span className="font-label-mono text-xs text-tier-legendary uppercase mb-2 block font-bold">
                    Prestise Utama
                  </span>
                  <h3 className="font-headline-lg text-xl text-ink-text mb-3">Legendary</h3>
                  <p className="text-sm text-on-surface-variant mb-4">
                    Beasiswa penuh, akses magang industri eksklusif, dan status Hall of Fame permanen.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Fairness: Pity System */}
        <section className="py-20 bg-surface-container-low border-y border-parchment-border">
          <div className="max-w-4xl mx-auto px-margin-mobile md:px-margin-desktop flex flex-col md:flex-row items-center gap-12 transition-all duration-1000 opacity-100 translate-y-0 w-full">
            <div className="w-24 h-24 flex-shrink-0 flex items-center justify-center bg-white rounded-full border-2 border-tier-legendary ink-drop-shadow">
              <span className="material-symbols-outlined text-4xl text-tier-legendary" style={{ fontVariationSettings: '"FILL" 1' }}>
                verified
              </span>
            </div>
            <div>
              <h2 className="font-headline-lg text-2xl text-ink-text mb-2 tracking-tighter">
                Keadilan Akademik yang Transparan
              </h2>
              <p className="font-body-md text-on-surface-variant leading-relaxed">
                Kami percaya bahwa usaha yang konsisten harus selalu dihargai. <span className="font-bold text-primary italic">Pity System</span> kami memastikan bahwa meskipun keberuntungan sedang tidak berpihak pada Anda, kemajuan Anda tetap terlacak.{' '}
                <span className="font-label-mono font-bold text-ink-text px-2 bg-tier-legendary/20">
                  Jaminan hadiah tingkat Legendary pada setiap 60 kali tarikan.
                </span>
              </p>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-24 paper-texture border-t border-parchment-border mb-16" id="faq">
          <div className="max-w-4xl mx-auto px-margin-mobile md:px-margin-desktop transition-all duration-1000 opacity-100 translate-y-0 w-full">
            <div className="text-center mb-16">
              <h2 className="font-headline-lg text-headline-lg text-ink-text mb-4 tracking-tighter">
                Pertanyaan Umum (FAQ)
              </h2>
              <p className="font-body-lg text-body-lg text-on-surface-variant">
                Segala hal yang perlu Anda ketahui tentang perjalanan akademis di EduGacha.
              </p>
            </div>
            <div className="space-y-8">
              <div className="border-b border-parchment-border pb-6">
                <h3 className="font-headline-lg text-xl text-primary mb-3">Apa itu Edu-Gacha?</h3>
                <p className="font-body-md text-on-surface-variant leading-relaxed">
                  Edu-Gacha adalah platform e-learning yang mengubah pencapaian akademis menjadi token hadiah menggunakan psikologi gamification.
                </p>
              </div>
              <div className="border-b border-parchment-border pb-6">
                <h3 className="font-headline-lg text-xl text-primary mb-3">Bagaimana AI menilai esai saya?</h3>
                <p className="font-body-md text-on-surface-variant leading-relaxed">
                  Kami menggunakan sistem hybrid: Cosine Similarity untuk akurasi semantik dan Gemini AI untuk memberikan feedback yang konstruktif dan suportif.
                </p>
              </div>
              <div className="border-b border-parchment-border pb-6">
                <h3 className="font-headline-lg text-xl text-primary mb-3">Apa itu Pity System?</h3>
                <p className="font-body-md text-on-surface-variant leading-relaxed" dangerouslySetInnerHTML={{ __html: 'Sistem yang menjamin keadilan. Anda pasti akan mendapatkan hadiah tingkat \'Legendary\' setiap 60 kali tarikan gacha.' }}></p>
              </div>
              <div className="pb-6">
                <h3 className="font-headline-lg text-xl text-primary mb-3">Bagaimana cara mengklaim hadiah?</h3>
                <p className="font-body-md text-on-surface-variant leading-relaxed">
                  Setiap hadiah yang dimenangkan akan masuk ke inventori Anda dengan kode klaim unik yang dapat ditukarkan.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="w-full py-12 bg-surface-container-high border-t border-parchment-border">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto gap-gutter w-full">
            <div className="max-w-sm">
              <div className="font-headline-lg text-headline-lg text-ink-text mb-4">EduGacha</div>
              <p className="font-body-md text-body-md text-on-surface-variant">
                &copy; 2024 EduGacha. Academic Excellence through Play.
              </p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-8">
              <div className="flex flex-col gap-2">
                <span className="font-label-mono text-xs uppercase tracking-widest text-ink-muted">Resources</span>
                <a className="text-on-surface-variant hover:text-primary underline underline-offset-4 transition-all duration-300 font-label-mono text-sm" href="#">
                  Terms of Service
                </a>
                <a className="text-on-surface-variant hover:text-primary underline underline-offset-4 transition-all duration-300 font-label-mono text-sm" href="#">
                  Privacy Policy
                </a>
              </div>
              <div className="flex flex-col gap-2">
                <span className="font-label-mono text-xs uppercase tracking-widest text-ink-muted">Access</span>
                <a className="text-on-surface-variant hover:text-primary underline underline-offset-4 transition-all duration-300 font-label-mono text-sm" href="#">
                  Institutional Access
                </a>
                <a className="text-on-surface-variant hover:text-primary underline underline-offset-4 transition-all duration-300 font-label-mono text-sm" href="#">
                  Support
                </a>
              </div>
              <div className="flex flex-col gap-2">
                <span className="font-label-mono text-xs uppercase tracking-widest text-ink-muted">Social</span>
                <a className="text-on-surface-variant hover:text-primary underline underline-offset-4 transition-all duration-300 font-label-mono text-sm" href="#">
                  Twitter/X
                </a>
                <a className="text-on-surface-variant hover:text-primary underline underline-offset-4 transition-all duration-300 font-label-mono text-sm" href="#">
                  Discord
                </a>
              </div>
            </div>
          </div>
        </footer>
      </main>
    </>
  );
}
