'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import Sidebar from '@/components/Sidebar';

export default function MissionsPage() {
  const [user, setUser] = useState(null);
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

  const toggleSidebar = () => {
    const nextState = !isSidebarCollapsed;
    setIsSidebarCollapsed(nextState);
    localStorage.setItem('sidebar_collapsed', String(nextState));
  };
  const [search, setSearch] = useState('');
  
  // New States
  const [activeMissions, setActiveMissions] = useState({ essay: null, quiz: null });
  const [practiceMissions, setPracticeMissions] = useState([]);
  const [completedMissionIds, setCompletedMissionIds] = useState(new Set());
  const [secondsRemaining, setSecondsRemaining] = useState(0);
  const [activeTheme, setActiveTheme] = useState(null);

  useEffect(() => {
    const checkSessionAndLoadData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        window.location.href = '/login';
        return;
      }

      try {
        // 1. Fetch Profile
        const { data: profile, error: profileErr } = await supabase
          .table('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (profileErr || !profile) {
          throw new Error(profileErr?.message || "Profil tidak ditemukan");
        }
        setUser(profile);
        localStorage.setItem('mock_user', JSON.stringify(profile));

        // 2. Fetch Active Daily Missions from Backend
        const activeRes = await fetch('http://localhost:8000/api/missions/active');
        if (activeRes.ok) {
          const activeData = await activeRes.json();
          setActiveMissions({
            essay: activeData.essay,
            quiz: activeData.quiz
          });
          setSecondsRemaining(activeData.seconds_remaining);
        } else {
          console.error("Failed to fetch active daily missions");
        }

        // 3. Fetch Practice Missions from Backend
        const practiceRes = await fetch('http://localhost:8000/api/missions/practice');
        if (practiceRes.ok) {
          const practiceData = await practiceRes.json();
          setPracticeMissions(practiceData || []);
        } else {
          console.error("Failed to fetch practice missions");
        }

        // 4. Fetch User Completion History (Essays & Quizzes)
        const { data: essays } = await supabase
          .table('essays')
          .select('mission_id')
          .eq('user_id', session.user.id);

        const { data: quizzes } = await supabase
          .table('quiz_results')
          .select('mission_id')
          .eq('user_id', session.user.id);

        const completedIds = new Set([
          ...(essays || []).map(e => e.mission_id),
          ...(quizzes || []).map(q => q.mission_id)
        ]);
        setCompletedMissionIds(completedIds);

      } catch (err) {
        console.error("Failed to load missions data:", err);
      } finally {
        setLoading(false);
      }
    };

    checkSessionAndLoadData();
  }, []);

  // Countdown Interval
  useEffect(() => {
    if (secondsRemaining <= 0) return;
    const timer = setInterval(() => {
      setSecondsRemaining(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          // Reload page to rotate missions
          window.location.reload();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [secondsRemaining]);

  const formatTime = (totalSeconds) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('mock_user');
    window.location.href = '/login';
  };

  const getActiveBuff = (topic, activityType) => {
    if (!user || !user.active_title) return 0;
    
    const activeTitle = user.active_title;
    
    // Card configurations matching backend main.py
    const CARD_METADATA = {
      "Profesor Fisika": { subjects: ["Fisika", "Sains"], activity: "all", base_boost: 20 },
      "Filsuf Kebijaksanaan": { subjects: ["all"], activity: "essay", base_boost: 15 },
      "Penyihir Matematika": { subjects: ["Matematika"], activity: "quiz", base_boost: 15 },
      "Sastrawan Pujangga": { subjects: ["Sastra"], activity: "essay", base_boost: 15 },
      "Ksatria Sejarah": { subjects: ["Sejarah"], activity: "all", base_boost: 10 },
      "Astronom Muda": { subjects: ["Sains", "Fisika"], activity: "all", base_boost: 10 },
      "Asisten Lab Kimia": { subjects: ["Kimia", "Sains"], activity: "all", base_boost: 5 },
      "Magang Sejarah": { subjects: ["Sejarah"], activity: "all", base_boost: 5 }
    };
    
    const meta = CARD_METADATA[activeTitle];
    if (!meta) return 0;
    
    let bonusSubject = 0;
    let bonusActivity = 0;
    
    // 1. Subject match check
    const subjects = meta.subjects;
    if (subjects.includes("all") || subjects.includes(topic)) {
      bonusSubject = meta.base_boost;
    }
    
    // 2. Activity type preference match check (only if subject matches or global)
    if (bonusSubject > 0) {
      const prefAct = meta.activity;
      if (prefAct === "all" || prefAct === activityType) {
        bonusActivity = 5;
      }
    }
    
    return bonusSubject + bonusActivity;
  };

  const sidebarUser = user || { username: "Memuat...", level: 1, coins: 0, active_title: "" };

  // Filter practice missions by topic/search if user uses search
  const filteredPractice = practiceMissions.filter(m =>
    m.title.toLowerCase().includes(search.toLowerCase()) ||
    m.topic.toLowerCase().includes(search.toLowerCase())
  );

  // Define themes details for cards
  const themes = [
    {
      name: 'Matematika',
      icon: 'calculate',
      accentColor: 'text-[#3b82f6] border-[#3b82f6]/20 bg-[#3b82f6]/5 hover:bg-[#3b82f6]/10',
      badgeColor: 'bg-[#3b82f6]/10 text-[#3b82f6]',
      description: 'Latih kemampuan logika, aljabar, geometri, dan pemecahan masalah numerik.'
    },
    {
      name: 'Geografi',
      icon: 'public',
      accentColor: 'text-[#eab308] border-[#eab308]/20 bg-[#eab308]/5 hover:bg-[#eab308]/10',
      badgeColor: 'bg-[#eab308]/10 text-[#eab308]',
      description: 'Pelajari bentang alam, iklim bumi, kependudukan, dan persebaran geologis.'
    },
    {
      name: 'Kimia',
      icon: 'science',
      accentColor: 'text-[#f97316] border-[#f97316]/20 bg-[#f97316]/5 hover:bg-[#f97316]/10',
      badgeColor: 'bg-[#f97316]/10 text-[#f97316]',
      description: 'Pahami reaksi zat, ikatan kimia, konfigurasi atom, dan stoikiometri larutan.'
    },
    {
      name: 'Biologi',
      icon: 'eco',
      accentColor: 'text-[#10b981] border-[#10b981]/20 bg-[#10b981]/5 hover:bg-[#10b981]/10',
      badgeColor: 'bg-[#10b981]/10 text-[#10b981]',
      description: 'Telusuri sel kehidupan, sistem organ manusia, rantai makanan, dan genetika.'
    }
  ];

  if (!mounted) {
    return (
      <div className="bg-background text-ink-text font-body-md min-h-screen flex items-center justify-center">
        <p className="font-label-mono text-ink-muted animate-pulse">Menyiapkan Halaman...</p>
      </div>
    );
  }

  return (
    <div className="bg-background text-ink-text font-body-md min-h-screen overflow-x-hidden selection:bg-secondary-container">
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

      {/* Main Canvas */}
      <main className={`flex-1 min-h-screen bg-background relative overflow-hidden transition-all duration-300 ease-in-out ${isSidebarCollapsed ? 'md:ml-20' : 'md:ml-72'}`}>
        {/* TopAppBar */}
        <header className="flex justify-between items-center h-16 px-6 md:px-margin-desktop w-full sticky top-0 bg-surface/80 backdrop-blur-md z-40 border-b border-parchment-border/30">
          <div className="flex items-center gap-2">
            {/* Mobile Drawer Toggle */}
            <button
              onClick={() => setIsMobileOpen(true)}
              className="md:hidden text-ink-muted hover:text-primary transition-colors cursor-pointer p-2 rounded-lg hover:bg-surface-container-high/60 active:scale-95 flex items-center justify-center"
              title="Buka Menu"
            >
              <span className="material-symbols-outlined text-xl block">side_navigation</span>
            </button>
            <div className="flex items-center gap-4 bg-surface-container-low px-4 py-1.5 border border-parchment-border rounded-sm w-full max-w-xs md:w-96">
              <span className="material-symbols-outlined text-ink-muted text-[20px]">search</span>
              <input
                className="bg-transparent border-none focus:ring-0 text-body-md w-full placeholder:text-ink-muted/50 focus:outline-none"
                placeholder="Cari misi, tema, atau topik..."
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-4">
              <button className="text-ink-muted hover:text-primary transition-colors cursor-pointer">
                <span className="material-symbols-outlined">notifications</span>
              </button>
            </div>
            <div className="h-8 w-[1px] bg-parchment-border"></div>
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="font-label-mono text-[12px] font-bold">{sidebarUser.username}</p>
                <p className="font-label-mono text-[10px] text-ink-muted">Level {sidebarUser.level} {sidebarUser.active_title || 'Scholar'}</p>
              </div>
              <img
                alt="Student avatar"
                className="w-10 h-10 rounded-full border-2 border-primary object-cover"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuDER-IP0xCIxwf0F8PNcFPWFsmUpUmTQwbO1loH0RDU0b_EfzYzASpAe20c9bLNtiTLgExfzNULE8iw_IZBJF1BqcHukNS06DO3SvVSqlMkAmzL39OV_LHHweaDbnfvy9tcB1uNikuFTbEPvR22C42vPpskVuUziZPOimhk0K3gjkLs_sMlc_Tn2syTUO_hFNaEGotgMt6MO6yR4MAeSDEeT4pcx24NwS-P1TfhqJLUeG6W9uKD1O7Ztd_wNPV1hGx3FfP2xKGLg0NO"
              />
            </div>
          </div>
        </header>

        {/* Content Area */}
        {loading || !user ? (
          <div className="flex h-[400px] w-full items-center justify-center bg-background">
            <p className="font-label-mono text-ink-muted animate-pulse">Memuat Misi Akademis...</p>
          </div>
        ) : (
          <div className="px-4 sm:px-6 md:px-margin-desktop py-12 max-w-container-max mx-auto relative">
          
          {/* Header Title */}
          <div className="mb-12 border-l-4 border-primary pl-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="font-headline-lg text-headline-lg text-ink-text mb-2">Tantangan Akademis</h2>
              <p className="font-body-lg text-body-lg text-ink-muted italic">Pilih misi harian ber-reward tinggi atau berlatihlah kapan saja untuk memperkaya ilmu.</p>
            </div>
            {secondsRemaining > 0 && (
              <div className="bg-primary/5 border border-primary/20 px-5 py-3 rounded-2xl text-center flex flex-col shrink-0">
                <span className="font-label-mono text-[9px] text-primary uppercase tracking-wider font-bold">Rotasi Misi Berikutnya</span>
                <span className="font-label-mono text-xl text-primary font-bold tracking-widest mt-1">{formatTime(secondsRemaining)}</span>
              </div>
            )}
          </div>

          {/* Section 1: Misi Harian Cendekia */}
          <section className="mb-16">
            <h3 className="font-label-mono text-xs uppercase tracking-widest text-ink-muted mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-sm text-primary">schedule</span>
              Misi Harian Cendekia (Reset 6 Jam)
            </h3>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Essay Daily Mission Card */}
              {activeMissions.essay && (
                <div className="group bg-paper-surface border border-parchment-border p-8 relative flex flex-col transition-all duration-300 hover:bg-[#ece5d8] hover:border-primary/40 rounded-xl shadow-sm paper-texture">
                  <div className="flex justify-between items-start mb-6">
                    <span className="font-label-mono text-[11px] px-3 py-1 border border-primary/30 rounded-full bg-primary/5 text-primary font-bold">
                      📝 Esai Harian
                    </span>
                    <span className="material-symbols-outlined text-primary/40 group-hover:text-primary transition-colors">draw</span>
                  </div>
                  <h4 className="font-headline-lg text-[22px] leading-tight mb-3 text-ink-text group-hover:text-primary transition-colors">{activeMissions.essay.title}</h4>
                  <p className="font-body-md text-ink-muted mb-8 line-clamp-3 leading-relaxed">{activeMissions.essay.description}</p>
                  
                  <div className="mt-auto pt-6 border-t border-parchment-border/40 flex justify-between items-end">
                    <div className="space-y-1">
                      {getActiveBuff(activeMissions.essay.topic, "essay") > 0 && (
                        <div className="flex items-center gap-1 bg-[#10b981]/15 text-[#10b981] border border-[#10b981]/30 text-[10px] font-bold px-2 py-0.5 rounded-sm font-label-mono animate-pulse mb-2 w-fit">
                          <span>✨</span>
                          <span>Buff Gelar: +{getActiveBuff(activeMissions.essay.topic, "essay")}%</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 font-label-mono text-[13px] text-tier-legendary font-bold">
                        <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>monetization_on</span>
                        <span>
                          {activeMissions.essay.coin_reward_base} Koin
                          {getActiveBuff(activeMissions.essay.topic, "essay") > 0 && (
                            <span className="text-[#10b981] ml-1.5">
                              (→ {Math.round(activeMissions.essay.coin_reward_base * (1 + getActiveBuff(activeMissions.essay.topic, "essay")/100))})
                            </span>
                          )}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 font-label-mono text-[13px] text-tier-rare font-bold">
                        <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                        <span>
                          {activeMissions.essay.exp_reward_base} XP
                          {getActiveBuff(activeMissions.essay.topic, "essay") > 0 && (
                            <span className="text-[#10b981] ml-1.5">
                              (→ {Math.round(activeMissions.essay.exp_reward_base * (1 + getActiveBuff(activeMissions.essay.topic, "essay")/100))})
                            </span>
                          )}
                        </span>
                      </div>
                    </div>

                    {completedMissionIds.has(activeMissions.essay.id) ? (
                      <span className="bg-[#10b981]/15 text-[#10b981] border border-[#10b981]/20 font-label-mono text-[13px] px-6 py-2.5 rounded-xl font-bold flex items-center gap-1">
                        <span className="material-symbols-outlined text-[16px]">check_circle</span>
                        SELESAI
                      </span>
                    ) : (
                      <Link className="bg-primary text-white font-label-mono text-[13px] px-6 py-2.5 hover:bg-primary-container transition-colors tracking-wider hover:no-underline rounded-xl font-bold" href={`/missions/essay/${activeMissions.essay.id}`}>
                        MULAI ESAL
                      </Link>
                    )}
                  </div>
                </div>
              )}

              {/* Quiz Daily Mission Card */}
              {activeMissions.quiz && (
                <div className="group bg-paper-surface border border-parchment-border p-8 relative flex flex-col transition-all duration-300 hover:bg-[#ece5d8] hover:border-primary/40 rounded-xl shadow-sm paper-texture">
                  <div className="flex justify-between items-start mb-6">
                    <span className="font-label-mono text-[11px] px-3 py-1 border border-secondary/30 rounded-full bg-secondary-container text-primary font-bold">
                      ❓ Kuis Harian
                    </span>
                    <span className="material-symbols-outlined text-primary/40 group-hover:text-primary transition-colors">quiz</span>
                  </div>
                  <h4 className="font-headline-lg text-[22px] leading-tight mb-3 text-ink-text group-hover:text-primary transition-colors">{activeMissions.quiz.title}</h4>
                  <p className="font-body-md text-ink-muted mb-8 line-clamp-3 leading-relaxed">{activeMissions.quiz.description}</p>
                  
                  <div className="mt-auto pt-6 border-t border-parchment-border/40 flex justify-between items-end">
                    <div className="space-y-1">
                      {getActiveBuff(activeMissions.quiz.topic, "quiz") > 0 && (
                        <div className="flex items-center gap-1 bg-[#10b981]/15 text-[#10b981] border border-[#10b981]/30 text-[10px] font-bold px-2 py-0.5 rounded-sm font-label-mono animate-pulse mb-2 w-fit">
                          <span>✨</span>
                          <span>Buff Gelar: +{getActiveBuff(activeMissions.quiz.topic, "quiz")}%</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 font-label-mono text-[13px] text-tier-legendary font-bold">
                        <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>monetization_on</span>
                        <span>
                          {activeMissions.quiz.coin_reward_base} Koin
                          {getActiveBuff(activeMissions.quiz.topic, "quiz") > 0 && (
                            <span className="text-[#10b981] ml-1.5">
                              (→ {Math.round(activeMissions.quiz.coin_reward_base * (1 + getActiveBuff(activeMissions.quiz.topic, "quiz")/100))})
                            </span>
                          )}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 font-label-mono text-[13px] text-tier-rare font-bold">
                        <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                        <span>
                          {activeMissions.quiz.exp_reward_base} XP
                          {getActiveBuff(activeMissions.quiz.topic, "quiz") > 0 && (
                            <span className="text-[#10b981] ml-1.5">
                              (→ {Math.round(activeMissions.quiz.exp_reward_base * (1 + getActiveBuff(activeMissions.quiz.topic, "quiz")/100))})
                            </span>
                          )}
                        </span>
                      </div>
                    </div>

                    {completedMissionIds.has(activeMissions.quiz.id) ? (
                      <span className="bg-[#10b981]/15 text-[#10b981] border border-[#10b981]/20 font-label-mono text-[13px] px-6 py-2.5 rounded-xl font-bold flex items-center gap-1">
                        <span className="material-symbols-outlined text-[16px]">check_circle</span>
                        SELESAI
                      </span>
                    ) : (
                      <Link className="bg-primary text-white font-label-mono text-[13px] px-6 py-2.5 hover:bg-primary-container transition-colors tracking-wider hover:no-underline rounded-xl font-bold" href={`/missions/quiz/${activeMissions.quiz.id}`}>
                        KERJAKAN KUIS
                      </Link>
                    )}
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Section 2: Latihan Mandiri Bertema */}
          <section>
            <h3 className="font-label-mono text-xs uppercase tracking-widest text-ink-muted mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-sm text-primary">auto_stories</span>
              Latihan Mandiri Bertema (Bebas Batas Waktu)
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {themes.map((theme) => {
                // Find matching practice missions for this theme
                const quizPractice = practiceMissions.find(pm => pm.topic === theme.name && pm.type === 'quiz');
                const essayPractice = practiceMissions.find(pm => pm.topic === theme.name && pm.type === 'essay');
                const isOpen = activeTheme === theme.name;

                return (
                  <div
                    key={theme.name}
                    className={`bg-paper-surface border border-parchment-border rounded-2xl p-6 transition-all duration-300 flex flex-col relative overflow-hidden shadow-sm paper-texture ${isOpen ? 'ring-2 ring-primary border-transparent shadow-md' : 'hover:shadow-md hover:border-primary/20'}`}
                  >
                    {/* Theme header */}
                    <div className="flex justify-between items-start mb-4">
                      <div className={`w-12 h-12 rounded-xl border flex items-center justify-center ${theme.accentColor}`}>
                        <span className="material-symbols-outlined text-[24px]">{theme.icon}</span>
                      </div>
                      <span className={`font-label-mono text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${theme.badgeColor}`}>
                        Latihan
                      </span>
                    </div>

                    <h4 className="font-headline-lg text-lg text-ink-text font-bold mb-2">{theme.name}</h4>
                    <p className="font-body-md text-ink-muted text-[13px] leading-relaxed mb-6 flex-1">{theme.description}</p>

                    {/* Action buttons */}
                    <div className="space-y-2 mt-auto">
                      {isOpen ? (
                        <div className="space-y-2 animate-fadeIn pt-2 border-t border-parchment-border/40 font-bold">
                          {/* Quiz option */}
                          {quizPractice ? (
                            <Link
                              href={`/missions/quiz/${quizPractice.id}`}
                              className="w-full flex items-center justify-between p-3 rounded-xl bg-primary/5 hover:bg-primary/10 border border-primary/20 text-primary text-xs font-label-mono font-bold hover:no-underline transition-all"
                            >
                              <span className="flex items-center gap-2">
                                <span className="material-symbols-outlined text-sm">quiz</span>
                                Latihan Kuis
                                {getActiveBuff(theme.name, "quiz") > 0 && (
                                  <span className="bg-[#10b981]/15 text-[#10b981] border border-[#10b981]/30 text-[9px] font-bold px-1.5 py-0.5 rounded-sm animate-pulse">
                                    +{getActiveBuff(theme.name, "quiz")}%
                                  </span>
                                )}
                              </span>
                              <span className="text-[10px] text-ink-muted font-normal">
                                Maks {Math.round(30 * (1 + getActiveBuff(theme.name, "quiz")/100))} Koin
                              </span>
                            </Link>
                          ) : (
                            <div className="w-full p-2.5 rounded-xl bg-surface-container-low text-ink-muted text-[11px] italic text-center">
                              Kuis tidak tersedia
                            </div>
                          )}

                          {/* Essay option */}
                          {essayPractice ? (
                            <Link
                              href={`/missions/essay/${essayPractice.id}`}
                              className="w-full flex items-center justify-between p-3 rounded-xl bg-secondary-container hover:bg-secondary-container/80 border border-primary/10 text-primary text-xs font-label-mono font-bold hover:no-underline transition-all"
                            >
                              <span className="flex items-center gap-2">
                                <span className="material-symbols-outlined text-sm">draw</span>
                                Latihan Esai
                                {getActiveBuff(theme.name, "essay") > 0 && (
                                  <span className="bg-[#10b981]/15 text-[#10b981] border border-[#10b981]/30 text-[9px] font-bold px-1.5 py-0.5 rounded-sm animate-pulse">
                                    +{getActiveBuff(theme.name, "essay")}%
                                  </span>
                                )}
                              </span>
                              <span className="text-[10px] text-ink-muted font-normal">
                                Maks {Math.round(30 * (1 + getActiveBuff(theme.name, "essay")/100))} Koin
                              </span>
                            </Link>
                          ) : (
                            <div className="w-full p-2.5 rounded-xl bg-surface-container-low text-ink-muted text-[11px] italic text-center">
                              Esai tidak tersedia
                            </div>
                          )}

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveTheme(null);
                            }}
                            className="w-full text-center py-1.5 text-[10px] font-label-mono text-ink-muted hover:text-primary transition-colors mt-2"
                          >
                            TUTUP PILIHAN
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setActiveTheme(theme.name)}
                          className="w-full bg-primary text-white py-3 rounded-xl font-label-mono text-xs font-bold hover:bg-primary/95 transition-all text-center flex items-center justify-center gap-2"
                        >
                          PILIH LATIHAN
                          <span className="material-symbols-outlined text-sm">expand_more</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

        </div>
        )}
      </main>
    </div>
  );
}
