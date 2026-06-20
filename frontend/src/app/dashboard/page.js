'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import { mockCards } from '@/components/mockCards';
import Sidebar from '@/components/Sidebar';
import OnboardingTour from '@/components/OnboardingTour';

export default function DashboardPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [showTour, setShowTour] = useState(false);
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
  const [dailyMissions, setDailyMissions] = useState({ essay: null, quiz: null });
  const [secondsRemaining, setSecondsRemaining] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);
  const [totalMissions, setTotalMissions] = useState(0);
  const [recentScores, setRecentScores] = useState([70, 75, 80, 85, 90]);
  const [recentCards, setRecentCards] = useState([]);
  const [checkinStatus, setCheckinStatus] = useState(null);
  const [leaderboard, setLeaderboard] = useState({ top_users: [], user_rank: 0 });

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        window.location.href = '/login';
        return;
      }

      // Fetch profile
      try {
        const { data: profile, error } = await supabase
          .table('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (error || !profile) {
          throw new Error(error?.message || "Profile not found");
        }

        setUser(profile);
        localStorage.setItem('mock_user', JSON.stringify(profile));
        const tourDismissed = localStorage.getItem('onboarding_tour_dismissed') === 'true' ||
                              session.user.user_metadata?.onboarding_tour_dismissed === true;
        if (profile && !profile.onboarding_completed && !tourDismissed) {
          setShowTour(true);
        }

        // Fetch active daily missions
        const activeRes = await fetch('http://localhost:8000/api/missions/active');
        if (activeRes.ok) {
          const activeData = await activeRes.json();
          setDailyMissions({
            essay: activeData.essay,
            quiz: activeData.quiz
          });
          setSecondsRemaining(activeData.seconds_remaining);
          setTotalMissions(2);
        } else {
          console.error("Failed to fetch active daily missions");
        }

        // Fetch checkin status
        const checkinRes = await fetch('http://localhost:8000/api/checkin/status', {
          headers: { 'Authorization': `Bearer ${session.access_token}` }
        });
        if (checkinRes.ok) {
          const checkinData = await checkinRes.json();
          setCheckinStatus(checkinData);
        }

        // Fetch leaderboard
        const leaderboardRes = await fetch('http://localhost:8000/api/leaderboard', {
          headers: { 'Authorization': `Bearer ${session.access_token}` }
        });
        if (leaderboardRes.ok) {
          const leaderboardData = await leaderboardRes.json();
          setLeaderboard(leaderboardData);
        }

        // Fetch essays count
        const { data: essays } = await supabase
          .table('essays')
          .select('score, created_at')
          .eq('user_id', session.user.id);

        // Fetch quizzes count
        const { data: quizzes } = await supabase
          .table('quiz_results')
          .select('score, created_at')
          .eq('user_id', session.user.id);

        const eCount = essays?.length || 0;
        const qCount = quizzes?.length || 0;
        setCompletedCount(eCount + qCount);

        // Combine score trend
        const allActivities = [
          ...(essays || []).map(e => ({ score: e.score, date: new Date(e.created_at) })),
          ...(quizzes || []).map(q => ({ score: q.score, date: new Date(q.created_at) }))
        ]
        .sort((a, b) => a.date - b.date)
        .slice(-5);

        const defaultScores = [70, 75, 80, 85, 90];
        allActivities.forEach((act, idx) => {
          defaultScores[defaultScores.length - allActivities.length + idx] = act.score;
        });
        setRecentScores(defaultScores);

        // Fetch recent cards (user_cards)
        const { data: userCards } = await supabase
          .table('user_cards')
          .select('*, cards(*)')
          .eq('user_id', session.user.id)
          .order('obtained_at', { ascending: false })
          .limit(2);

        const mappedCards = (userCards || []).map(uc => {
          const template = mockCards.find(mc => mc.name === uc.cards?.name);
          return template ? {
            name: template.name,
            rarity: template.rarity,
            icon: template.icon,
            bgClass: template.bgClass,
            textClass: template.textClass,
            image_url: template.image_url,
            desc: `${template.rarity} • ${template.subject}`
          } : {
            name: uc.cards?.name || "Kartu Baru",
            rarity: uc.cards?.rarity || "Common",
            icon: "school",
            bgClass: "from-[#7f8c8d] to-[#5d6d7e]",
            textClass: "text-[#5d6d7e]",
            image_url: uc.cards?.image_url || "",
            desc: `${uc.cards?.rarity || 'Common'}`
          };
        });
        setRecentCards(mappedCards);

      } catch (err) {
        console.error("Failed to load profile:", err);
        // Fallback using local storage or metadata
        const savedUser = localStorage.getItem('mock_user');
        const tourDismissed = localStorage.getItem('onboarding_tour_dismissed') === 'true' ||
                              session.user.user_metadata?.onboarding_tour_dismissed === true;
        if (savedUser) {
          const parsed = JSON.parse(savedUser);
          setUser(parsed);
          if (parsed && !parsed.onboarding_completed && !tourDismissed) {
            setShowTour(true);
          }
        } else {
          setUser({
            username: session.user.user_metadata?.full_name || session.user.email.split('@')[0],
            coins: 200,
            level: 1,
            exp: 0,
            pity_counter: 0,
            active_title: "",
            onboarding_completed: false
          });
          if (!tourDismissed) {
            setShowTour(true);
          }
        }
      } finally {
        setLoading(false);
      }
    };

    checkSession();
  }, []);

  useEffect(() => {
    if (secondsRemaining <= 0) return;
    const timer = setInterval(() => {
      setSecondsRemaining(prev => {
        if (prev <= 1) {
          clearInterval(timer);
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

  const sidebarUser = user || { username: "Memuat...", level: 1, coins: 0, active_title: "" };

  if (!mounted) {
    return (
      <div className="bg-background text-ink-text font-body-md min-h-screen flex items-center justify-center">
        <p className="font-label-mono text-ink-muted animate-pulse">Menyiapkan Halaman...</p>
      </div>
    );
  }

  return (
    <div className="bg-background text-ink-text font-body-md overflow-x-hidden min-h-screen selection:bg-primary-fixed selection:text-on-primary-fixed">
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes wobble-light {
          0% { transform: rotate(0deg) scale(1); }
          25% { transform: rotate(-3deg) scale(1.05); }
          75% { transform: rotate(3deg) scale(1.05); }
          100% { transform: rotate(0deg) scale(1); }
        }
        .wobble-hover {
          transition: transform 0.15s ease-in-out;
        }
        .wobble-hover:hover {
          animation: wobble-light 0.25s ease-in-out infinite alternate;
        }
      `}} />
      {!loading && showTour && (
        <OnboardingTour
          user={user}
          onComplete={async () => {
            setShowTour(false);
            localStorage.setItem('onboarding_tour_dismissed', 'true');
            try {
              await supabase.auth.updateUser({
                data: { onboarding_tour_dismissed: true }
              });
            } catch (err) {
              console.error("Failed to update user metadata:", err);
            }
          }}
        />
      )}
      {/* Sidebar Navigation */}
      <Sidebar
        activePage="dashboard"
        user={sidebarUser}
        isCollapsed={isSidebarCollapsed}
        handleLogout={handleLogout}
        onToggle={toggleSidebar}
        isMobileOpen={isMobileOpen}
        onCloseMobile={() => setIsMobileOpen(false)}
      />

      {/* Main Content Shell */}
      <main className={`min-h-screen transition-all duration-300 ease-in-out ${isSidebarCollapsed ? 'md:ml-20' : 'md:ml-72'}`}>
        <header className="flex justify-between items-center h-16 px-6 md:px-margin-desktop w-full bg-surface border-b border-parchment-border/30 sticky top-0 z-40 no-print">
          <div className="flex items-center gap-2">
            {/* Mobile Drawer Toggle */}
            <button
              onClick={() => setIsMobileOpen(true)}
              className="md:hidden text-ink-muted hover:text-primary transition-colors cursor-pointer p-2 rounded-lg hover:bg-surface-container-high/60 active:scale-95 flex items-center justify-center"
              title="Buka Menu"
            >
              <span className="material-symbols-outlined text-xl block">side_navigation</span>
            </button>
            <h2 className="font-headline-lg text-xl font-bold text-primary">Dashboard</h2>
          </div>
          <div className="flex items-center gap-6">
            <button className="material-symbols-outlined text-ink-muted hover:text-primary transition-colors cursor-pointer">search</button>
            <button className="material-symbols-outlined text-ink-muted hover:text-primary transition-colors cursor-pointer">notifications</button>
            <div className="h-8 w-[1px] bg-parchment-border"></div>
            <Link href="/portfolio" className="flex items-center gap-3 hover:no-underline hover:opacity-90 transition-opacity">
              <div className="text-right hidden sm:block">
                <p className="font-label-mono text-[12px] font-bold text-on-surface">{sidebarUser.username}</p>
                <p className="font-label-mono text-[10px] text-ink-muted">Level {sidebarUser.level} {sidebarUser.active_title || 'Scholar'}</p>
              </div>
              <img
                alt="Student avatar"
                className="w-10 h-10 rounded-full border-2 border-primary object-cover"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuDER-IP0xCIxwf0F8PNcFPWFsmUpUmTQwbO1loH0RDU0b_EfzYzASpAe20c9bLNtiTLgExfzNULE8iw_IZBJF1BqcHukNS06DO3SvVSqlMkAmzL39OV_LHHweaDbnfvy9tcB1uNikuFTbEPvR22C42vPpskVuUziZPOimhk0K3gjkLs_sMlc_Tn2syTUO_hFNaEGotgMt6MO6yR4MAeSDEeT4pcx24NwS-P1TfhqJLUeG6W9uKD1O7Ztd_wNPV1hGx3FfP2xKGLg0NO"
              />
            </Link>
          </div>
        </header>

        {/* Canvas */}
        {loading ? (
          <div className="flex h-[400px] w-full items-center justify-center bg-background">
            <p className="font-label-mono text-ink-muted animate-pulse">Memuat Perpustakaan Akademis...</p>
          </div>
        ) : (
          <div className="p-4 sm:p-6 md:p-12 max-w-container-max mx-auto">
          {/* Overview Section */}
          <section className="mb-16">
            <div className="mb-8 px-2">
              <h3 className="text-headline-lg text-ink-text font-headline-lg">Ringkasan Akademik</h3>
              <p className="text-body-md text-ink-muted mt-1">Statistik perkembangan gacha dan hasil belajarmu hari ini.</p>
            </div>
            <div id="onboarding-stats" className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Koin Stats */}
              <div className="paper-texture bg-paper-surface rounded-2xl p-8 border border-parchment-border/40 relative overflow-hidden group shadow-sm">
                <span className="material-symbols-outlined absolute -right-4 -bottom-4 text-9xl opacity-[0.03] group-hover:opacity-[0.06] transition-opacity rotate-12">toll</span>
                <p className="font-label-mono text-label-mono text-ink-muted mb-3">Total Koin</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-stats-lg text-4xl text-primary font-bold">{user.coins.toLocaleString('id-ID')}</span>
                  <span className="font-label-mono text-xs text-tier-legendary font-bold px-2 py-0.5 bg-tier-legendary/10 rounded-full">EMAS</span>
                </div>
                <div className="mt-6 h-1.5 bg-surface-container rounded-full overflow-hidden">
                  <div className="bg-tier-legendary h-full rounded-full" style={{ width: `${Math.min((user.coins / 1000) * 100, 100)}%` }}></div>
                </div>
              </div>
              {/* Level & EXP */}
              <div className="paper-texture bg-paper-surface rounded-2xl p-8 border border-parchment-border/40 relative overflow-hidden group shadow-sm">
                <span className="material-symbols-outlined absolute -right-4 -bottom-4 text-9xl opacity-[0.03] group-hover:opacity-[0.06] transition-opacity -rotate-12">auto_stories</span>
                <p className="font-label-mono text-label-mono text-ink-muted mb-3">Pangkat Cendekia</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-stats-lg text-4xl text-primary font-bold">LVL {user.level}</span>
                  <span className="font-label-mono text-xs text-ink-muted font-medium">{user.exp} / 1000 EXP</span>
                </div>
                <div className="mt-6 h-1.5 bg-surface-container rounded-full overflow-hidden">
                  <div className="bg-primary h-full rounded-full" style={{ width: `${(user.exp / 1000) * 100}%` }}></div>
                </div>
              </div>
              {/* Pity Counter */}
              <div className="paper-texture bg-paper-surface rounded-2xl p-8 border border-parchment-border/40 relative overflow-hidden group shadow-sm">
                <span className="material-symbols-outlined absolute -right-4 -bottom-4 text-9xl opacity-[0.03] group-hover:opacity-[0.06] transition-opacity">ink_marker</span>
                <p className="font-label-mono text-label-mono text-ink-muted mb-3">Pity Counter (SSR)</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-stats-lg text-4xl text-primary font-bold">{user.pity_counter} <span className="text-2xl text-ink-muted font-normal">/ 60</span></span>
                  <span className="font-label-mono text-xs text-tier-epic font-bold px-2 py-0.5 bg-tier-epic/10 rounded-full">EPIC STREAK</span>
                </div>
                <div className="mt-6 h-1.5 bg-surface-container rounded-full overflow-hidden">
                  <div className="bg-tier-epic h-full rounded-full" style={{ width: `${(user.pity_counter / 60) * 100}%` }}></div>
                </div>
              </div>
            </div>
          </section>

          {/* Newbie Quests (Visible only when onboarding_completed is false) */}
          {user && !user.onboarding_completed && (
            <section id="onboarding-newbie-quests" className="mb-12 paper-texture bg-paper-surface border-2 border-primary/30 rounded-2xl p-8 shadow-sm">
              <h4 className="font-headline-lg text-lg text-primary mb-4 font-bold">Misi Pemula Cendekia</h4>
              <p className="text-xs text-ink-muted mb-6">Selesaikan tugas panduan berikut untuk membiasakan diri dengan sistem dan klaim koin perdana!</p>
              
              <div className="space-y-4 max-w-md">
                {/* Task 1: Checkin */}
                <div className="flex items-center justify-between p-3 bg-white/40 border border-parchment-border/40 rounded-xl">
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{(checkinStatus?.today_checked_in || user.streak_count > 0) ? '✅' : '⬜'}</span>
                    <span className={`text-xs ${(checkinStatus?.today_checked_in || user.streak_count > 0) ? 'line-through text-ink-muted' : 'font-bold'}`}>Presensi Pertama</span>
                  </div>
                  <span className="font-label-mono text-[10px] text-tier-legendary bg-tier-legendary/10 px-2 py-0.5 rounded">Selesai</span>
                </div>

                {/* Task 2: Quiz/Essay completion */}
                <div className="flex items-center justify-between p-3 bg-white/40 border border-parchment-border/40 rounded-xl">
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{completedCount > 0 ? '✅' : '⬜'}</span>
                    <span className={`text-xs ${completedCount > 0 ? 'line-through text-ink-muted' : 'font-bold'}`}>Selesaikan Misi Pertama (Kuis/Esai)</span>
                  </div>
                  <span className="font-label-mono text-[10px] text-tier-legendary bg-tier-legendary/10 px-2 py-0.5 rounded">Selesai</span>
                </div>

                {/* Task 3: Gacha card check */}
                <div className="flex items-center justify-between p-3 bg-white/40 border border-parchment-border/40 rounded-xl">
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{recentCards.length > 0 ? '✅' : '⬜'}</span>
                    <span className={`text-xs ${recentCards.length > 0 ? 'line-through text-ink-muted' : 'font-bold'}`}>Tarik Gacha Perdana Anda</span>
                  </div>
                  <span className="font-label-mono text-[10px] text-tier-legendary bg-tier-legendary/10 px-2 py-0.5 rounded">Selesai</span>
                </div>
              </div>

              <div className="mt-6">
                <button
                  onClick={async () => {
                    const { data: { session } } = await supabase.auth.getSession();
                    if (!session) return;
                    const res = await fetch('http://localhost:8000/api/onboarding/complete', {
                      method: 'POST',
                      headers: { 'Authorization': `Bearer ${session.access_token}` }
                    });
                    if (res.ok) {
                      const data = await res.json();
                      setUser(data.profile);
                      localStorage.setItem('mock_user', JSON.stringify(data.profile));
                      alert('Selamat! Anda telah menyelesaikan Misi Pemula dan mendapatkan 100 Koin & 200 EXP!');
                    } else {
                      alert('Selesaikan seluruh misi terlebih dahulu sebelum mengklaim hadiah!');
                    }
                  }}
                  disabled={!((checkinStatus?.today_checked_in || user.streak_count > 0) && completedCount > 0 && recentCards.length > 0)}
                  className={`px-6 py-3 rounded-xl font-bold font-label-mono text-xs transition-all ${
                    ((checkinStatus?.today_checked_in || user.streak_count > 0) && completedCount > 0 && recentCards.length > 0)
                      ? 'bg-primary text-white cursor-pointer hover:scale-105'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  Klaim Hadiah Pemula (+100 Koin, +200 EXP)
                </button>
              </div>
            </section>
          )}

          {/* Bento Grid Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Daily Missions (Bento Card) */}
            {(dailyMissions.essay || dailyMissions.quiz) ? (
              <div id="onboarding-missions" className="lg:col-span-8 paper-texture bg-paper-surface border border-parchment-border/40 rounded-2xl p-10 min-h-[480px] flex flex-col shadow-sm">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 pb-4 border-b border-parchment-border/40 gap-4">
                  <div>
                    <span className="inline-block px-4 py-1.5 bg-secondary-container text-on-secondary-container font-label-mono text-[10px] rounded-full mb-2">MISI HARI INI</span>
                    <h4 className="text-headline-lg text-ink-text font-headline-lg">Tantangan Harian Cendekia</h4>
                  </div>
                  {secondsRemaining > 0 && (
                    <div className="bg-primary/5 border border-primary/20 px-4 py-2 rounded-xl text-center shrink-0">
                      <p className="font-label-mono text-[8px] text-primary uppercase tracking-wider font-bold">Rotasi Misi</p>
                      <p className="font-label-mono text-[14px] text-primary font-bold tracking-widest mt-0.5">{formatTime(secondsRemaining)}</p>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1">
                  {/* Essay Daily Mission */}
                  {dailyMissions.essay ? (
                    <div className="border border-parchment-border/60 rounded-2xl p-6 flex flex-col justify-between hover:bg-surface-container-low/30 transition-all paper-texture">
                      <div>
                        <div className="flex justify-between items-center mb-4">
                          <span className="text-[10px] font-label-mono bg-primary/5 text-primary border border-primary/20 px-2.5 py-0.5 rounded-full font-bold">📝 ESAI</span>
                          <span className="material-symbols-outlined text-sm text-ink-muted">draw</span>
                        </div>
                        <h5 className="font-bold text-sm text-ink-text mb-2 line-clamp-2">{dailyMissions.essay.title}</h5>
                        <p className="text-xs text-ink-muted line-clamp-3 leading-relaxed mb-4">{dailyMissions.essay.description}</p>
                      </div>
                      <div className="pt-4 border-t border-parchment-border/40 flex justify-between items-center mt-auto">
                        <div className="flex flex-col text-[10px] font-label-mono text-ink-muted">
                          <span className="font-bold text-tier-legendary flex items-center gap-1">
                            <span className="material-symbols-outlined text-xs" style={{ fontVariationSettings: "'FILL' 1" }}>monetization_on</span>
                            {dailyMissions.essay.coin_reward_base} Koin
                          </span>
                        </div>
                        <Link href={`/missions/essay/${dailyMissions.essay.id}`} className="bg-primary text-white text-[10px] font-label-mono px-4 py-2 rounded-lg hover:no-underline font-bold hover:bg-primary-container transition-colors">
                          MULAI ESAL
                        </Link>
                      </div>
                    </div>
                  ) : (
                    <div className="border border-dashed border-parchment-border rounded-2xl p-6 flex items-center justify-center text-center text-xs text-ink-muted italic">
                      Misi esai tidak tersedia
                    </div>
                  )}

                  {/* Quiz Daily Mission */}
                  {dailyMissions.quiz ? (
                    <div className="border border-parchment-border/60 rounded-2xl p-6 flex flex-col justify-between hover:bg-surface-container-low/30 transition-all paper-texture">
                      <div>
                        <div className="flex justify-between items-center mb-4">
                          <span className="text-[10px] font-label-mono bg-secondary-container text-primary border border-primary/20 px-2.5 py-0.5 rounded-full font-bold">❓ KUIS</span>
                          <span className="material-symbols-outlined text-sm text-ink-muted">quiz</span>
                        </div>
                        <h5 className="font-bold text-sm text-ink-text mb-2 line-clamp-2">{dailyMissions.quiz.title}</h5>
                        <p className="text-xs text-ink-muted line-clamp-3 leading-relaxed mb-4">{dailyMissions.quiz.description}</p>
                      </div>
                      <div className="pt-4 border-t border-parchment-border/40 flex justify-between items-center mt-auto">
                        <div className="flex flex-col text-[10px] font-label-mono text-ink-muted">
                          <span className="font-bold text-tier-legendary flex items-center gap-1">
                            <span className="material-symbols-outlined text-xs" style={{ fontVariationSettings: "'FILL' 1" }}>monetization_on</span>
                            {dailyMissions.quiz.coin_reward_base} Koin
                          </span>
                        </div>
                        <Link href={`/missions/quiz/${dailyMissions.quiz.id}`} className="bg-primary text-white text-[10px] font-label-mono px-4 py-2 rounded-lg hover:no-underline font-bold hover:bg-primary-container transition-colors">
                          MULAI KUIS
                        </Link>
                      </div>
                    </div>
                  ) : (
                    <div className="border border-dashed border-parchment-border rounded-2xl p-6 flex items-center justify-center text-center text-xs text-ink-muted italic">
                      Misi kuis tidak tersedia
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div id="onboarding-missions" className="lg:col-span-8 paper-texture bg-paper-surface border border-parchment-border/40 rounded-2xl p-10 min-h-[480px] flex flex-col shadow-sm items-center justify-center text-center">
                <span className="material-symbols-outlined text-6xl text-ink-muted/30 mb-4 animate-pulse">edit_document</span>
                <p className="font-body-lg text-ink-muted italic">Tidak ada misi aktif saat ini.</p>
                <Link href="/missions" className="mt-6 bg-primary text-white py-3 px-6 rounded-xl font-label-mono text-xs font-bold shadow-sm hover:no-underline">
                  Buka Misi
                </Link>
              </div>
            )}

            {/* Activity Sidebar (Recent Progress) */}
            <div className="lg:col-span-4 space-y-8">
              {/* Mini Check-in Tracker */}
              <div id="onboarding-checkin" className="paper-texture bg-paper-surface border border-parchment-border/40 rounded-2xl p-8 shadow-sm">
                <div className="flex justify-between items-center mb-6">
                  <h5 className="font-label-mono text-label-mono text-ink-text flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-lg wobble-hover cursor-pointer">calendar_today</span>
                    <span>Presensi Harian</span>
                  </h5>
                  {checkinStatus && (
                    <span className="font-label-mono text-[10px] text-ink-muted">
                      Streak: {checkinStatus.streak_count} Hari
                    </span>
                  )}
                </div>

                {checkinStatus && (
                  <div className="space-y-6">
                    {/* Horizontal 7-Day Dots */}
                    <div className="flex justify-between gap-1.5 py-2">
                      {checkinStatus.grid_days.map((d) => {
                        const isCompleted = d.status === "completed";
                        const isActive = d.status === "active";
                        
                        let dotClass = "bg-surface-container border border-parchment-border text-ink-muted/50";
                        if (isCompleted) {
                          dotClass = "bg-green-100 border-2 border-green-600 text-green-700 font-bold";
                        } else if (isActive) {
                          dotClass = "bg-amber-100 border-2 border-[#ffb300] text-[#ff8f00] font-bold animate-pulse";
                        }

                        return (
                          <div
                            key={d.day}
                            title={`Hari ${d.day}: ${d.reward_coins} G`}
                            className={`w-8 h-8 rounded-full flex items-center justify-center text-xs cursor-pointer wobble-hover ${dotClass}`}
                          >
                            {isCompleted ? "✓" : d.day}
                          </div>
                        );
                      })}
                    </div>

                    {/* Requirements checklist summary */}
                    <div className="bg-[#fdfaf2] border border-parchment-border/30 rounded-xl p-4 text-xs space-y-2">
                      <p className="font-bold border-b border-dashed border-parchment-border/40 pb-1 mb-1">
                        Syarat Hari Ini (Hari ke-{checkinStatus.active_day})
                      </p>
                      <div className="flex justify-between">
                        <span>1 Misi Harian:</span>
                        <span className={`transition-all duration-200 hover:scale-105 ${checkinStatus.requirements.daily_mission_completed ? "text-green-600 font-bold" : "text-red-600"}`}>
                          {checkinStatus.requirements.daily_mission_completed ? "✓ Terpenuhi" : "✗ Belum"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>1 Latihan Mandiri:</span>
                        <span className={`transition-all duration-200 hover:scale-105 ${checkinStatus.requirements.practice_mission_completed ? "text-green-600 font-bold" : "text-red-600"}`}>
                          {checkinStatus.requirements.practice_mission_completed ? "✓ Terpenuhi" : "✗ Belum"}
                        </span>
                      </div>
                    </div>

                    {/* Action Button */}
                    <div className="text-center">
                      {checkinStatus.today_checked_in ? (
                        <div className="text-xs text-green-700 font-bold bg-green-50 border border-green-200 py-2.5 rounded-xl">
                          ✓ Presensi Hari Ini Selesai!
                        </div>
                      ) : (
                        <Link
                          href={checkinStatus.can_claim ? "/checkin" : "/missions"}
                          className={`inline-block w-full py-2.5 rounded-xl font-label-mono text-xs font-bold text-center border border-transparent shadow-sm hover:no-underline transition-all ${
                            checkinStatus.can_claim
                              ? "bg-[#ffb300] hover:bg-[#ffa000] text-[#4e3629]"
                              : "bg-[#a1887f] hover:bg-[#8d6e63] text-white"
                          }`}
                        >
                          {checkinStatus.can_claim ? "KLAIM REWARD SEKARANG" : "LANJUT BELAJAR"}
                        </Link>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Leaderboard Siswa */}
              <div className="paper-texture bg-paper-surface border border-parchment-border/40 rounded-2xl p-8 shadow-sm">
                <h5 className="font-label-mono text-label-mono text-ink-text mb-6 flex items-center justify-between">
                  <span>Papan Peringkat Cendekia</span>
                  <span className="material-symbols-outlined text-primary text-lg">emoji_events</span>
                </h5>
                <div className="space-y-3">
                  {leaderboard.top_users.length === 0 ? (
                    <p className="font-body-md text-xs text-ink-muted italic py-6 text-center">Belum ada data peringkat.</p>
                  ) : (
                    <>
                      {leaderboard.top_users.map((student, idx) => {
                        const trophy = idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : `${idx + 1}.`;
                        const isSelf = student.username === user?.username;
                        
                        return (
                          <div 
                            key={idx} 
                            className={`flex items-center gap-4 p-3 rounded-xl border transition-all ${
                              isSelf 
                                ? "bg-[#ffb300]/10 border-[#ffb300]/40 font-bold animate-pulse" 
                                : "border-transparent hover:bg-surface-container/30"
                            }`}
                          >
                            <span className="text-lg w-6 text-center shrink-0">{trophy}</span>
                            <div className="w-9 h-9 rounded-full border border-parchment-border/40 overflow-hidden bg-surface-container-high flex-shrink-0 flex items-center justify-center">
                              {student.avatar_url ? (
                                <img src={student.avatar_url} alt={student.username} className="w-full h-full object-cover" />
                              ) : (
                                <span className="material-symbols-outlined text-lg text-ink-muted">person</span>
                              )}
                            </div>
                            <div className="flex-1 min-w-0 leading-tight">
                              <p className="text-xs font-bold truncate text-ink-text flex items-center gap-1.5">
                                <span>{student.username}</span>
                                {isSelf && <span className="text-[9px] bg-primary/10 text-primary px-1.5 py-0.2 rounded">Anda</span>}
                              </p>
                              <p className="text-[10px] text-ink-muted truncate mt-0.5">{student.active_title || "Scholar"}</p>
                            </div>
                            <div className="text-right shrink-0">
                              <p className="text-xs font-bold text-primary">Lvl {student.level}</p>
                              <p className="text-[9px] text-ink-muted">{student.exp} EXP</p>
                            </div>
                          </div>
                        );
                      })}

                      {/* Display user relative rank at the bottom if outside Top 5 */}
                      {leaderboard.user_rank > 5 && (
                        <div className="mt-4 pt-3 border-t border-dashed border-parchment-border/40 flex items-center justify-between p-3 bg-[#fdfaf2] border border-[#ffb300]/30 rounded-xl">
                          <div className="flex items-center gap-3 min-w-0">
                            <span className="font-label-mono text-xs font-bold text-ink-muted shrink-0">#{leaderboard.user_rank}</span>
                            <div className="leading-tight min-w-0">
                              <p className="text-xs font-bold truncate text-ink-text">{user?.username}</p>
                              <p className="text-[9px] text-ink-muted truncate">{user?.active_title || "Scholar"}</p>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-xs font-bold text-primary">Lvl {user?.level}</p>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div></div>
            </div>

          {/* Gamification Teaser Section */}
          <section className="mt-16 bg-surface-container-high/40 rounded-3xl p-12 border-2 border-dashed border-parchment-border/50">
            <div className="flex flex-col lg:flex-row items-center gap-12">
              <div className="flex-1 text-center lg:text-left">
                <h4 className="text-headline-lg text-primary mb-6 font-headline-lg">Siap Mencoba Keberuntungan?</h4>
                <p className="text-body-md text-ink-text max-w-xl mb-10 leading-relaxed mx-auto lg:mx-0">
                  Gunakan koin hasil menulis esaimu untuk menarik undian di Mesin Gacha. Dapatkan kartu artefak langka untuk membantumu naik peringkat lebih cepat!
                </p>
                <Link href="/gacha" className="inline-block bg-tier-legendary text-on-surface font-bold font-label-mono text-label-mono px-12 py-5 rounded-2xl shadow-xl shadow-tier-legendary/20 hover:scale-105 active:scale-95 transition-all cursor-pointer hover:no-underline">
                  MASUK MESIN GACHA
                </Link>
              </div>
              <div className="w-full lg:w-96 aspect-square bg-paper-surface rounded-2xl border border-parchment-border/40 relative flex items-center justify-center p-12 shrink-0 shadow-sm paper-texture">
                <div className="relative w-full h-full rounded-2xl border-2 border-double border-primary/10 flex items-center justify-center bg-white/30">
                  <span className="material-symbols-outlined text-[100px] text-primary/10">stars</span>
                  <div className="absolute inset-0 flex items-center justify-center animate-pulse">
                    <span className="material-symbols-outlined text-[140px] text-tier-legendary opacity-10">award_star</span>
                  </div>
                  <p className="absolute bottom-6 font-label-mono text-[10px] tracking-[0.2em] text-ink-muted/50 uppercase">Reward Room</p>
                </div>
              </div>
            </div>
          </section>
        </div>
        )}

        {/* Footer */}
        <footer className="w-full py-16 border-t border-parchment-border/30 bg-surface-container/20 mt-12">
          <div className="flex flex-col md:flex-row justify-between items-center px-12 max-w-container-max mx-auto gap-8">
            <div className="text-center md:text-left">
              <p className="text-headline-lg text-3xl text-ink-text font-headline-lg">EduGacha</p>
              <p className="text-body-md text-sm text-on-surface-variant mt-3 italic">Academic Excellence through Play.</p>
              <p className="font-label-mono text-[11px] text-on-surface-variant mt-4 opacity-50 uppercase tracking-widest">© 2024 EduGacha. All Rights Reserved.</p>
            </div>
            <div className="flex flex-wrap justify-center gap-10">
              <a className="font-label-mono text-xs text-on-surface-variant hover:text-primary transition-colors" href="#">Terms of Service</a>
              <a className="font-label-mono text-xs text-on-surface-variant hover:text-primary transition-colors" href="#">Privacy Policy</a>
              <a className="font-label-mono text-xs text-on-surface-variant hover:text-primary transition-colors" href="#">Institutional Access</a>
              <a className="font-label-mono text-xs text-on-surface-variant hover:text-primary transition-colors" href="#">Support</a>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
