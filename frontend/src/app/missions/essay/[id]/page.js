'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import Sidebar from '@/components/Sidebar';
import { mockMissions } from '@/components/mockMissions';
import { supabase } from '@/lib/supabaseClient';

export default function EssayEditorPage({ params: paramsPromise }) {
  const params = use(paramsPromise);
  const id = params.id;
  const [user, setUser] = useState(null);
  const [mission, setMission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [essayTitle, setEssayTitle] = useState('');
  const [essayContent, setEssayContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
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
  const wordCount = essayContent.trim() ? essayContent.trim().split(/\s+/).length : 0;

  useEffect(() => {
    // Session load is handled inside useEffect checkSession and other async methods
  }, []);

  const toggleSidebar = () => {
    const nextState = !isSidebarCollapsed;
    setIsSidebarCollapsed(nextState);
    localStorage.setItem('sidebar_collapsed', String(nextState));
  };

  useEffect(() => {
    const checkSessionAndMission = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        window.location.href = '/login';
        return;
      }

      let foundMission = mockMissions.find(m => m.id === id);
      if (!foundMission) {
        try {
          const { data: dbMission } = await supabase
            .table('missions')
            .select('*')
            .eq('id', id)
            .single();
          if (dbMission) {
            foundMission = {
              id: dbMission.id,
              title: dbMission.title,
              description: dbMission.description,
              type: dbMission.type,
              category: dbMission.topic,
              coin_reward: dbMission.coin_reward_base,
              exp_reward: dbMission.exp_reward_base,
              aspects: ["Tata Bahasa", "Struktur Argumen", "Kesesuaian Topik", "Kosa Kata"]
            };
          }
        } catch (e) {
          console.error("Error fetching mission from DB:", e);
        }
      }

      if (!foundMission) {
        window.location.href = '/missions';
        return;
      }

      setMission(foundMission);

      try {
        const { data: profile } = await supabase
          .table('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
        if (profile) {
          setUser(profile);
        }
      } catch (err) {
        console.error("Error loading user profile:", err);
      }
      setLoading(false);
    };

    checkSessionAndMission();
  }, [id]);


  const handleLogout = () => {
    localStorage.removeItem('mock_user');
    window.location.href = '/login';
  };

  const handleSubmit = async () => {
    if (wordCount < 50) {
      alert("Esai Anda terlalu pendek. Minimal 50 kata untuk dinilai.");
      return;
    }
    setSubmitting(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        alert("Sesi Anda berakhir. Silakan masuk kembali.");
        window.location.href = '/login';
        return;
      }

      const response = await fetch('http://localhost:8000/api/essays/grade', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          mission_id: mission.id,
          content: essayContent
        })
      });

      const grading = await response.json();
      if (response.ok) {
        // Fetch updated profile
        const { data: updatedProfile } = await supabase
          .table('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (updatedProfile) {
          setUser(updatedProfile);
          const updatedUser = {
            ...user,
            coins: updatedProfile.coins,
            level: updatedProfile.level,
            exp: updatedProfile.exp,
            pity_counter: updatedProfile.pity_counter,
            active_title: updatedProfile.active_title
          };
          localStorage.setItem('mock_user', JSON.stringify(updatedUser));
        }

        // Save essay result to history
        const resultsHistory = JSON.parse(localStorage.getItem('essay_results') || '[]');
        const resultId = `result-essay-${Date.now()}`;
        const newResult = {
          id: resultId,
          type: "essay",
          title: mission.title,
          grade: grading.grade,
          score: grading.score,
          aspects: grading.aspect_scores,
          feedback: grading.ai_feedback,
          suggestions: grading.suggestions || [
            { title: "Perkuat Kesimpulan", desc: "Hubungkan kembali paragraf penutup dengan argumen utama secara eksplisit." },
            { title: "Variasi Konjungsi", desc: "Gunakan kata transisi yang bervariasi agar aliran tulisan mengalir alami." }
          ],
          coins: grading.coins_earned,
          exp: grading.exp_earned,
          essayTitle,
          essayContent,
          created_at: new Date().toISOString()
        };
        resultsHistory.push(newResult);
        localStorage.setItem('essay_results', JSON.stringify(resultsHistory));

        // Redirect to result page
        window.location.href = `/missions/result/${resultId}`;
      } else {
        alert(`Gagal menilai esai: ${grading.detail || grading.error}`);
      }
    } catch (err) {
      console.error("FastAPI Backend Grader Failure:", err);
      alert("Terjadi kesalahan jaringan saat menilai esai. Pastikan server backend Anda menyala.");
    } finally {
      setSubmitting(false);
    }
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

      <div className={`transition-all duration-300 ease-in-out min-h-screen flex flex-col ${isSidebarCollapsed ? 'md:ml-20' : 'md:ml-72'}`}>
        {/* TopAppBar */}
        <header className="flex justify-between items-center h-16 px-6 md:px-margin-desktop w-full bg-surface border-b border-parchment-border/30 sticky top-0 z-40">
          <div className="flex items-center gap-2">
            {/* Mobile Drawer Toggle */}
            <button
              onClick={() => setIsMobileOpen(true)}
              className="md:hidden text-ink-muted hover:text-primary transition-colors cursor-pointer p-2 rounded-lg hover:bg-surface-container-high/60 active:scale-95 flex items-center justify-center"
              title="Buka Menu"
            >
              <span className="material-symbols-outlined text-xl block">side_navigation</span>
            </button>
            <h2 className="font-headline-lg text-xl font-bold text-primary">Workspace Esai</h2>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="font-label-mono text-label-mono text-on-surface font-bold">{sidebarUser.username}</p>
              <p className="font-label-mono text-[10px] text-ink-muted uppercase tracking-widest">Level {sidebarUser.level} {sidebarUser.active_title || 'Scholar'}</p>
            </div>
            <img
              className="w-10 h-10 rounded-full border border-parchment-border"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuDER-IP0xCIxwf0F8PNcFPWFsmUpUmTQwbO1loH0RDU0b_EfzYzASpAe20c9bLNtiTLgExfzNULE8iw_IZBJF1BqcHukNS06DO3SvVSqlMkAmzL39OV_LHHweaDbnfvy9tcB1uNikuFTbEPvR22C42vPpskVuUziZPOimhk0K3gjkLs_sMlc_Tn2syTUO_hFNaEGotgMt6MO6yR4MAeSDEeT4pcx24NwS-P1TfhqJLUeG6W9uKD1O7Ztd_wNPV1hGx3FfP2xKGLg0NO"
              alt="Profile"
            />
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 p-4 sm:p-6 md:p-margin-desktop bg-background relative">
          {loading || !user || !mission ? (
            <div className="flex h-[400px] w-full items-center justify-center bg-background">
              <p className="font-label-mono text-ink-muted animate-pulse">Menyiapkan Ruang Menulis...</p>
            </div>
          ) : (
            <>
              {submitting && (
                <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center">
                  <span className="material-symbols-outlined text-[64px] text-primary animate-spin">history_edu</span>
                  <p className="font-headline-lg text-primary text-xl mt-6 animate-pulse font-headline-lg">Scholar AI Sedang Menilai Esai Anda...</p>
                  <p className="text-body-md text-ink-muted mt-2">Mengevaluasi tata bahasa, struktur argumen, dan kesesuaian topik.</p>
                </div>
              )}

              <div className="max-w-container-max mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Column: Mission info */}
            <div className="lg:col-span-4 space-y-6">
              <div className="bg-paper-surface border border-parchment-border p-8 rounded-xl shadow-sm paper-texture">
                <div className="flex items-center justify-between mb-6">
                  <span className="bg-primary/10 text-primary px-3 py-1 rounded font-label-mono text-[12px] uppercase tracking-tighter">Misi Akademik</span>
                  <span className="font-label-mono text-xs font-bold text-tier-legendary">Kategori: {mission.category}</span>
                </div>
                <h1 className="font-headline-lg text-headline-lg text-ink-text mb-4 leading-tight font-headline-lg">{mission.title}</h1>
                <p className="font-body-md text-ink-muted mb-8 italic leading-relaxed">
                  &quot;{mission.description}&quot;
                </p>
                <div className="grid grid-cols-2 gap-4 mb-8">
                  <div className="bg-surface-container rounded p-4 flex flex-col items-center justify-center text-center">
                    <span className="material-symbols-outlined text-tier-legendary mb-2">payments</span>
                    <span className="font-label-mono text-xs text-ink-muted uppercase">Hadiah</span>
                    <span className="font-stats-lg text-stats-lg text-on-surface font-bold">{mission.coin_reward}</span>
                  </div>
                  <div className="bg-surface-container rounded p-4 flex flex-col items-center justify-center text-center">
                    <span className="material-symbols-outlined text-tier-rare mb-2">trending_up</span>
                    <span className="font-label-mono text-xs text-ink-muted uppercase">EXP</span>
                    <span className="font-stats-lg text-stats-lg text-on-surface font-bold">{mission.exp_reward}</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <h3 className="font-label-mono text-label-mono font-bold text-ink-text border-b border-parchment-border pb-2">Kriteria Penilaian:</h3>
                  <ul className="space-y-2 text-sm text-ink-muted font-body-md">
                    {mission.aspects.map((aspect, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="material-symbols-outlined text-primary text-lg">check_circle</span>
                        <span>{aspect}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Right Column: Text editor */}
            <div className="lg:col-span-8 flex flex-col gap-6">
              <div className="paper-texture bg-paper-surface border border-parchment-border rounded-xl shadow-lg flex-1 flex flex-col min-h-[500px]">
                {/* Toolbar */}
                <div className="border-b border-parchment-border px-6 py-3 flex items-center justify-between bg-white/30 backdrop-blur-sm">
                  <div className="flex items-center gap-2">
                    <button className="p-1 hover:bg-surface-container rounded transition-colors cursor-pointer"><span className="material-symbols-outlined">format_bold</span></button>
                    <button className="p-1 hover:bg-surface-container rounded transition-colors cursor-pointer"><span className="material-symbols-outlined">format_italic</span></button>
                    <button className="p-1 hover:bg-surface-container rounded transition-colors cursor-pointer"><span className="material-symbols-outlined">format_underlined</span></button>
                  </div>
                  <span className="font-label-mono text-[10px] sm:text-[12px] text-ink-muted">Tersimpan otomatis secara lokal</span>
                </div>
                {/* Writing fields */}
                <div className="flex-1 p-6 sm:p-12 flex flex-col">
                  <input
                    className="w-full bg-transparent border-none p-0 mb-8 font-headline-xl text-headline-xl text-on-surface placeholder:text-outline-variant/60 focus:ring-0 focus:border-none font-bold focus:outline-none"
                    placeholder="Judul Esai Anda"
                    type="text"
                    value={essayTitle}
                    onChange={(e) => setEssayTitle(e.target.value)}
                  />
                  <textarea
                    className="w-full flex-1 bg-transparent border-none p-0 font-body-lg text-body-lg leading-loose text-ink-text placeholder:text-outline-variant/60 focus:ring-0 focus:border-none resize-none min-h-[300px] focus:outline-none"
                    placeholder="Mulai menulis analisis Anda di sini..."
                    value={essayContent}
                    onChange={(e) => setEssayContent(e.target.value)}
                  />
                </div>
                {/* Bottom bar */}
                <div className="border-t border-parchment-border px-6 sm:px-8 py-4 flex flex-col sm:flex-row gap-4 items-center justify-between bg-white/30">
                  <div className="flex items-center gap-6 w-full sm:w-auto justify-between sm:justify-start">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-ink-muted text-sm">sticky_note_2</span>
                      <span className="font-label-mono text-label-mono text-ink-muted">Jumlah Kata: {wordCount} kata</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 w-full sm:w-auto">
                    <button
                      onClick={handleSubmit}
                      className="w-full sm:w-auto px-10 py-3 sm:py-2 bg-primary text-white font-headline-lg text-body-md font-bold hover:opacity-90 active:scale-95 transition-all shadow-md rounded-xl cursor-pointer"
                    >
                      Kirim Esai
                    </button>
                  </div>
                </div>
              </div>
            </div>
            </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
