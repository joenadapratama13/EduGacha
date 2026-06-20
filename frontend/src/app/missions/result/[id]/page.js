'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import Sidebar from '@/components/Sidebar';

export default function ResultPage({ params: paramsPromise }) {
  const params = use(paramsPromise);
  const id = params.id;
  const [user, setUser] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setTimeout(() => {
      setMounted(true);
      const savedUser = localStorage.getItem('mock_user');
      if (savedUser) {
        setUser(JSON.parse(savedUser));
      }
      const savedCollapsed = localStorage.getItem('sidebar_collapsed') === 'true';
      setIsSidebarCollapsed(savedCollapsed);
    }, 0);
  }, []);

  useEffect(() => {
    // Session load is handled inside useEffect fetchUserData
  }, []);

  const toggleSidebar = () => {
    const nextState = !isSidebarCollapsed;
    setIsSidebarCollapsed(nextState);
    localStorage.setItem('sidebar_collapsed', String(nextState));
  };

  useEffect(() => {
    const fetchUserData = () => {
      const savedUser = localStorage.getItem('mock_user');
      
      let foundResult = null;
      if (id.startsWith('result-essay-')) {
        const essayHistory = JSON.parse(localStorage.getItem('essay_results') || '[]');
        foundResult = essayHistory.find(r => r.id === id);
      } else if (id.startsWith('result-quiz-')) {
        const quizHistory = JSON.parse(localStorage.getItem('quiz_results') || '[]');
        foundResult = quizHistory.find(r => r.id === id);
      }

      if (!savedUser) {
        window.location.href = '/login';
      } else if (!foundResult) {
        window.location.href = '/missions';
      } else {
        setUser(JSON.parse(savedUser));
        setResult(foundResult);
        setLoading(false);
      }
    };

    fetchUserData();
  }, [id]);

  const handleLogout = () => {
    localStorage.removeItem('mock_user');
    window.location.href = '/login';
  };

  const sidebarUser = user || { username: "Memuat...", level: 1, coins: 0, active_title: "" };

  if (!mounted) {
    return (
      <div className="bg-background text-ink-text font-body-md min-h-screen flex items-center justify-center">
        <p className="font-label-mono text-ink-muted animate-pulse">Menyiapkan Halaman...</p>
      </div>
    );
  }

  return (
    <div className="bg-background text-ink-text font-body-md overflow-x-hidden min-h-screen selection:bg-secondary-container">
      {/* Sidebar Navigation */}
      <Sidebar
        activePage="missions"
        user={sidebarUser}
        isCollapsed={isSidebarCollapsed}
        handleLogout={handleLogout}
        onToggle={toggleSidebar}
        isMobileOpen={isMobileOpen}
        onCloseMobile={() => setIsMobileOpen(false)}
      />

      {/* Main Content */}
      <main className={`min-h-screen paper-texture bg-[#fdf9ee]/40 pb-16 transition-all duration-300 ease-in-out ${isSidebarCollapsed ? 'md:ml-20' : 'md:ml-72'}`}>
        {/* TopAppBar */}
        <header className="flex justify-between items-center h-16 px-6 md:px-margin-desktop w-full bg-surface border-b border-parchment-border/30 sticky top-0 z-40 mb-12">
          <div className="flex items-center gap-2">
            {/* Mobile Drawer Toggle */}
            <button
              onClick={() => setIsMobileOpen(true)}
              className="md:hidden text-ink-muted hover:text-primary transition-colors cursor-pointer p-2 rounded-lg hover:bg-surface-container-high/60 active:scale-95 flex items-center justify-center"
              title="Buka Menu"
            >
              <span className="material-symbols-outlined text-xl block">side_navigation</span>
            </button>
            <h2 className="font-headline-lg text-xl font-bold text-primary">Hasil Evaluasi Misi</h2>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-right hidden sm:block">
              <p className="font-label-mono text-label-mono text-on-surface font-bold">{sidebarUser.username}</p>
              <p className="font-label-mono text-[10px] text-ink-muted">Level {sidebarUser.level} {sidebarUser.active_title || 'Scholar'}</p>
            </div>
            <img
              className="w-10 h-10 rounded-full border border-parchment-border"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuDER-IP0xCIxwf0F8PNcFPWFsmUpUmTQwbO1loH0RDU0b_EfzYzASpAe20c9bLNtiTLgExfzNULE8iw_IZBJF1BqcHukNS06DO3SvVSqlMkAmzL39OV_LHHweaDbnfvy9tcB1uNikuFTbEPvR22C42vPpskVuUziZPOimhk0K3gjkLs_sMlc_Tn2syTUO_hFNaEGotgMt6MO6yR4MAeSDEeT4pcx24NwS-P1TfhqJLUeG6W9uKD1O7Ztd_wNPV1hGx3FfP2xKGLg0NO"
              alt="Profile"
            />
          </div>
        </header>

        <div className="px-4 sm:px-6 md:px-margin-desktop max-w-container-max mx-auto">
          {loading || !user || !result ? (
            <div className="flex h-[400px] w-full items-center justify-center bg-background">
              <p className="font-label-mono text-ink-muted animate-pulse">Menyiapkan Hasil Evaluasi...</p>
            </div>
          ) : (
            <>
          
          {result.type === 'essay' ? (
            // Essay Result View
            <div>
              {/* Header (Grade Card & AI Intro) */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
                <div className="lg:col-span-4 bg-paper-surface border border-parchment-border p-8 flex flex-col items-center justify-center text-center relative overflow-hidden group rounded-xl shadow-sm">
                  <span className="material-symbols-outlined absolute -top-4 -right-4 opacity-5 group-hover:opacity-10 transition-opacity text-9xl">workspace_premium</span>
                  <p className="font-label-mono text-ink-muted uppercase tracking-widest mb-2">Nilai Akhir</p>
                  <div className="font-headline-xl text-primary text-6xl lg:text-7xl mb-2 font-bold font-headline-lg">{result.score}<span className="text-3xl font-body-md text-ink-muted font-normal">/100</span></div>
                  <div className="bg-primary/10 px-4 py-1 rounded-full text-primary font-bold text-lg font-headline-lg">{result.grade}</div>
                </div>
                <div className="lg:col-span-8 bg-paper-surface border border-parchment-border p-8 flex flex-col md:flex-row gap-8 items-center rounded-xl shadow-sm">
                  <div className="w-32 h-32 flex-shrink-0 bg-surface-container-high rounded-full overflow-hidden border border-parchment-border shrink-0">
                    <img alt="AI Scholar" className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCV0aANvWfc5qvDj6lVLdaVLpgb3G8LX--7lh1CvNcFjV5z5z79k3JTfmyD1HV6_mbEP1aVKB7kt6ZmcYMab7aekZgPTaXyE5zhNjIkBYeJ99iMHuoL6Xd4M1R_s7JrgxKAIfsc0udoCVuXbWT9Svu4t7vCb7j_Hn9MS5Dkg391W2A3YMIzgJ9Wjs7gKcUz2Dn7eGNBxMlggXDQVnr-zazgu74W4sBKETX-89kq7q-SbDjnTr35wkZHzjWKo0dlCjQDWcUyURjZcXCz" />
                  </div>
                  <div>
                    <h2 className="font-headline-lg text-primary mb-4 font-headline-lg">Ulasan Scholar AI</h2>
                    <p className="font-body-lg text-ink-text leading-relaxed font-body-lg">
                      &quot;{result.feedback}&quot;
                    </p>
                  </div>
                </div>
              </div>

              {/* Score Breakdown & Suggestions */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
                <div className="lg:col-span-5 bg-paper-surface border border-parchment-border p-8 rounded-xl shadow-sm">
                  <h3 className="font-headline-lg text-primary text-xl mb-6 flex items-center gap-2 font-headline-lg">
                    <span className="material-symbols-outlined">analytics</span> Detail Penilaian
                  </h3>
                  <div className="space-y-6">
                    {Object.entries(result.aspects).map(([key, val]) => {
                      const aspectNames = {
                        grammar: "Tata Bahasa",
                        argument: "Struktur Argumen",
                        relevance: "Kesesuaian Topik",
                        vocabulary: "Kosa Kata"
                      };
                      return (
                        <div key={key}>
                          <div className="flex justify-between mb-2">
                            <span className="font-label-mono text-ink-text">{aspectNames[key]}</span>
                            <span className="font-stats-lg text-primary text-sm font-bold">{val}/100</span>
                          </div>
                          <div className="h-2 w-full bg-surface-container-highest rounded-full overflow-hidden">
                            <div className="h-full bg-primary rounded-full" style={{ width: `${val}%` }}></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="lg:col-span-7 bg-paper-surface border border-parchment-border p-8 border-l-4 border-l-primary rounded-xl shadow-sm">
                  <h3 className="font-headline-lg text-primary text-xl mb-6 flex items-center gap-2 font-headline-lg">
                    <span className="material-symbols-outlined">lightbulb</span> Saran Perbaikan AI
                  </h3>
                  <ul className="space-y-4 font-body-md">
                    {result.suggestions.map((sug, idx) => (
                      <li key={idx} className="flex gap-4">
                        <span className="material-symbols-outlined text-primary mt-1">check_circle</span>
                        <div>
                          <p className="font-bold text-ink-text mb-1">{sug.title}</p>
                          <p className="font-body-md text-ink-muted">{sug.desc}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ) : (
            // Quiz Result View
            <div className="mb-12">
              {/* Header (Score Card & AI Intro) */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
                <div className="lg:col-span-4 bg-paper-surface border border-parchment-border p-8 flex flex-col items-center justify-center text-center relative overflow-hidden group rounded-xl shadow-sm">
                  <span className="material-symbols-outlined absolute -top-4 -right-4 opacity-5 group-hover:opacity-10 transition-opacity text-9xl">workspace_premium</span>
                  <p className="font-label-mono text-ink-muted uppercase tracking-widest mb-2">Skor Kuis</p>
                  <div className="font-headline-xl text-primary text-6xl lg:text-7xl mb-2 font-bold font-headline-lg">{result.score}<span className="text-3xl font-body-md text-ink-muted font-normal">%</span></div>
                  <div className="bg-primary/10 px-4 py-1 rounded-full text-primary font-bold text-sm font-headline-lg">{result.correctCount} / {result.totalQuestions} Benar</div>
                </div>
                <div className="lg:col-span-8 bg-paper-surface border border-parchment-border p-8 flex flex-col md:flex-row gap-8 items-center rounded-xl shadow-sm">
                  <div className="w-32 h-32 flex-shrink-0 bg-surface-container-high rounded-full overflow-hidden border border-parchment-border shrink-0">
                    <img alt="AI Scholar" className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCV0aANvWfc5qvDj6lVLdaVLpgb3G8LX--7lh1CvNcFjV5z5z79k3JTfmyD1HV6_mbEP1aVKB7kt6ZmcYMab7aekZgPTaXyE5zhNjIkBYeJ99iMHuoL6Xd4M1R_s7JrgxKAIfsc0udoCVuXbWT9Svu4t7vCb7j_Hn9MS5Dkg391W2A3YMIzgJ9Wjs7gKcUz2Dn7eGNBxMlggXDQVnr-zazgu74W4sBKETX-89kq7q-SbDjnTr35wkZHzjWKo0dlCjQDWcUyURjZcXCz" />
                  </div>
                  <div>
                    <h2 className="font-headline-lg text-primary mb-4 font-headline-lg">Ulasan Scholar AI</h2>
                    <p className="font-body-lg text-ink-text leading-relaxed font-body-lg">
                      &quot;{result.ai_feedback || "Kerja bagus! Evaluasi kuis Anda telah dicatat oleh sistem."}&quot;
                    </p>
                  </div>
                </div>
              </div>

              <section className="space-y-8">
                <div className="flex items-center gap-4 mb-6">
                  <div className="h-px bg-parchment-border flex-1"></div>
                  <h3 className="font-headline-lg text-[24px] text-ink-text px-4 font-headline-lg">Pembahasan</h3>
                  <div className="h-px bg-parchment-border flex-1"></div>
                </div>

                {result.resultsDetails.map((detail, idx) => (
                  <div key={idx} className={`bg-paper-surface border-l-4 border border-parchment-border p-6 rounded shadow-sm relative overflow-hidden ${detail.isCorrect ? 'border-l-tier-legendary' : 'border-l-error'}`}>
                    <div className="flex justify-between items-start mb-4">
                      <span className={`font-label-mono text-label-mono px-2 py-0.5 rounded ${detail.isCorrect ? 'bg-secondary-container text-on-secondary-container' : 'bg-error-container text-on-error-container'}`}>
                        {detail.isCorrect ? 'BENAR' : 'SALAH'}
                      </span>
                      <span className="font-label-mono text-label-mono text-ink-muted">Pertanyaan {idx + 1}</span>
                    </div>
                    <h4 className="font-headline-lg text-[20px] mb-4 text-ink-text font-headline-lg">{detail.questionText}</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                      <div className="p-3 bg-surface-container-low rounded border border-parchment-border">
                        <p className="font-label-mono text-[12px] text-ink-muted mb-1">Jawaban Anda:</p>
                        <p className={`font-body-md ${detail.isCorrect ? 'text-primary font-bold' : 'text-error font-bold'}`}>{detail.selectedAnswer}</p>
                      </div>
                      <div className="p-3 bg-secondary-container/20 rounded border border-parchment-border">
                        <p className="font-label-mono text-[12px] text-ink-muted mb-1">Jawaban Benar:</p>
                        <p className="font-body-md text-primary font-bold">{detail.correctAnswer}</p>
                      </div>
                    </div>
                    <div className="bg-surface-container-highest/30 p-4 rounded italic">
                      <p className="font-body-md text-ink-text"><strong className="not-italic font-bold">Rasional:</strong> {detail.explanation}</p>
                    </div>
                  </div>
                ))}
              </section>
            </div>
          )}

          {/* Reward Summary Section */}
          <div className="bg-paper-surface border border-parchment-border p-8 border-dashed border-2 bg-secondary-container/10 mb-8 overflow-hidden relative rounded-xl shadow-sm">
            <div className="absolute top-0 right-0 p-4 pointer-events-none opacity-20">
              <span className="material-symbols-outlined text-9xl">auto_awesome</span>
            </div>
            <div className="flex flex-col md:flex-row justify-between items-center gap-8 relative z-10">
              <div>
                <h3 className="font-headline-lg text-primary text-2xl mb-2 font-headline-lg">Hadiah Akademik</h3>
                <p className="font-body-lg text-ink-muted italic font-body-lg">&quot;Luar biasa! Kamu semakin dekat dengan jaminan Legendary.&quot;</p>
                <div className="flex gap-8 mt-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-tier-legendary/20 flex items-center justify-center border border-tier-legendary">
                      <span className="material-symbols-outlined text-tier-legendary" style={{ fontVariationSettings: "'FILL' 1" }}>monetization_on</span>
                    </div>
                    <div>
                      <div className="font-stats-lg text-primary font-bold">+{result.coins}</div>
                      <div className="font-label-mono text-xs text-ink-muted uppercase">Koin Misi</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-tier-rare/20 flex items-center justify-center border border-tier-rare">
                      <span className="material-symbols-outlined text-tier-rare" style={{ fontVariationSettings: "'FILL' 1" }}>military_tech</span>
                    </div>
                    <div>
                      <div className="font-stats-lg text-primary font-bold">+{result.exp}</div>
                      <div className="font-label-mono text-xs text-ink-muted uppercase">XP Pelajar</div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-3 w-full md:w-auto">
                <Link className="bg-primary text-white text-center px-10 py-3 font-headline-lg text-sm font-bold tracking-tight hover:opacity-90 transition-all flex items-center justify-center gap-2 rounded-lg hover:no-underline" href="/dashboard">
                  Kembali ke Dashboard
                  <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </Link>
                <Link className="border border-primary text-primary text-center px-10 py-3 font-headline-lg text-sm font-bold tracking-tight hover:bg-secondary-container/50 transition-all rounded-lg hover:no-underline" href="/missions">
                  Kerjakan Misi Lain
                </Link>
              </div>
            </div>
          </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
