'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Sidebar from '@/components/Sidebar';
import { supabase } from '@/lib/supabaseClient';

export default function CheckinPage() {
  const [user, setUser] = useState(null);
  const [statusData, setStatusData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);
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

  const fetchStatus = async (userId) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    try {
      const res = await fetch('http://localhost:8000/api/checkin/status', {
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setStatusData(data);
      }
    } catch (err) {
      console.error("Failed to load status:", err);
    }
  };

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        window.location.href = '/login';
        return;
      }

      try {
        const { data: profile } = await supabase
          .table('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        setUser(profile);
        await fetchStatus(session.user.id);
      } catch (err) {
        console.error("Failed to load profile:", err);
      } finally {
        setLoading(false);
      }
    };

    checkSession();
  }, []);

  const handleClaim = async () => {
    if (!statusData || !statusData.can_claim) return;
    setClaiming(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('http://localhost:8000/api/checkin/claim', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await res.json();
      if (res.ok) {
        alert(`Sukses! Anda memperoleh ${data.coins_earned} G koin ${data.tickets_earned > 0 ? 'dan 1x Tiket Gacha Epic!' : ''}`);
        // Refresh data
        await fetchStatus(session.user.id);
        // Refresh user profile details
        const { data: profile } = await supabase
          .table('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
        setUser(profile);
      } else {
        alert(data.detail || "Gagal mencatat presensi");
      }
    } catch (err) {
      console.error(err);
      alert("Terjadi kesalahan jaringan.");
    } finally {
      setClaiming(false);
    }
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
    <div className="bg-[#fdfaf2] text-[#4e3629] min-h-screen font-sans selection:bg-[#ffb300]/30 relative overflow-hidden flex">
      {/* Style block for font import and wobble hover keyframes */}
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Patrick+Hand&family=Gochi+Hand&display=swap');
        
        .handdraw-container {
          font-family: 'Patrick Hand', cursive, sans-serif;
          background-image: radial-gradient(#ece5d8 1px, transparent 0);
          background-size: 24px 24px;
        }
        
        .gochi-font {
          font-family: 'Gochi Hand', cursive, sans-serif;
        }
        
        @keyframes wobble {
          0% { transform: rotate(0deg) scale(1); }
          25% { transform: rotate(-1.5deg) scale(1.02); }
          75% { transform: rotate(1.5deg) scale(1.02); }
          100% { transform: rotate(0deg) scale(1); }
        }
        
        .sketch-card {
          transition: transform 0.2s ease, border-color 0.2s ease;
        }

        .sketch-card:hover {
          animation: wobble 0.25s ease-in-out infinite alternate;
          border-color: #ffb300;
        }
        
        .sketch-badge {
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        
        .sketch-badge:hover {
          transform: scale(1.05);
          box-shadow: 2px 2px 0px #4e3629;
        }
      `}} />

      {/* Sidebar Navigation */}
      <Sidebar
        activePage="checkin"
        user={sidebarUser}
        isCollapsed={isSidebarCollapsed}
        handleLogout={handleLogout}
        onToggle={toggleSidebar}
        isMobileOpen={isMobileOpen}
        onCloseMobile={() => setIsMobileOpen(false)}
      />

      {/* Main Canvas */}
      <main className={`flex-1 min-h-screen bg-background relative overflow-hidden flex flex-col transition-all duration-300 ease-in-out ${isSidebarCollapsed ? 'md:ml-20' : 'md:ml-72'}`}>
        {/* TopAppBar */}
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
            <h2 className="font-headline-lg text-xl font-bold text-primary">Presensi Harian</h2>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-tier-legendary text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>monetization_on</span>
              <span className="font-stats-lg text-lg font-bold">{sidebarUser.coins.toLocaleString('id-ID')}</span>
            </div>
            <div className="h-8 w-[1px] bg-parchment-border"></div>
            <div className="flex items-center gap-3">
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
          </div>
        </header>

        {/* Content Area */}
        {loading || !user || !statusData ? (
          <div className="flex-1 flex h-[400px] w-full items-center justify-center bg-[#fdfaf2]">
            <p className="font-label-mono text-[#4e3629] animate-pulse">Membuka Buku Presensi Harian...</p>
          </div>
        ) : (
          <div className="flex-1 py-12 px-4 sm:px-6 md:px-margin-desktop w-full max-w-container-max mx-auto flex flex-col justify-center items-center handdraw-container relative z-10">
          <div className="max-w-[850px] w-full bg-[#fdfaf2] border-[3px] border-[#4e3629] p-4 sm:p-8 md:p-10 shadow-[8px_8px_0px_#e6dfd1] rounded-[255px_15px_225px_15px/15px_225px_15px_255px]">
          
          {/* Header */}
          <div className="text-center mb-8">
            <h2 className="gochi-font text-3xl md:text-4xl font-bold mb-1">~ Presensi Harian Cendekia ~</h2>
            <p className="text-lg text-[#5d4037]">Selesaikan misi akademik harian untuk mengklaim koin presensi.</p>
            <div className="mt-2 text-sm text-[#8c826e] font-mono">Streak Presensi: {statusData.streak_count} Hari berturut-turut</div>
          </div>

          {/* 7-Day Calendar Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2 sm:gap-4 mb-8 w-full">
            {statusData.grid_days.map((d) => {
              const isCompleted = d.status === "completed";
              const isActive = d.status === "active";
              
              let cardClass = "bg-white border-2 border-[#4e3629] text-[#4e3629]";
              let statusText = "Belum";
              let statusColor = "text-[#8c826e]";

              if (isCompleted) {
                cardClass = "bg-[#e8f5e9] border-2 border-[#2e7d32] text-[#2e7d32]";
                statusText = "✓ Klaim";
                statusColor = "text-[#2e7d32]";
              } else if (isActive) {
                cardClass = "bg-[#fff8e1] border-[3px] border-[#ffb300] shadow-[3px_3px_0px_#ffe082] scale-[1.03] rotate-[-1deg]";
                statusText = "HARI INI";
                statusColor = "text-[#ff8f00] font-bold";
              }

              return (
                <div key={d.day} className={`sketch-card p-2.5 sm:p-4 rounded-[12px_4px_10px_4px/4px_10px_4px_12px] text-center transition-all cursor-pointer ${cardClass}`}>
                  <div className="text-[10px] sm:text-xs uppercase font-bold tracking-wider">Hari {d.day}</div>
                  <div className="text-xl sm:text-2xl my-1 sm:my-2">{d.reward_ticket > 0 ? '👑' : d.reward_coins >= 100 ? '💰' : '🪙'}</div>
                  <div className="text-xs sm:text-sm font-bold">{d.reward_coins} G{d.reward_ticket > 0 ? ' + 🎫' : ''}</div>
                  <div className={`text-[10px] sm:text-xs mt-1.5 sm:mt-2 ${statusColor}`}>{statusText}</div>
                </div>
              );
            })}
          </div>

          {/* Daily Requirements Checklists */}
          <div className="bg-white border-2 border-[#4e3629] p-6 rounded-[20px_10px_20px_10px/10px_20px_10px_20px] shadow-[4px_4px_0px_#e6dfd1] mb-8">
            <h3 className="gochi-font text-xl md:text-2xl border-b-2 border-dashed border-[#4e3629] pb-2 mb-4">
              Syarat Presensi Hari Ini (Hari ke-{statusData.active_day})
            </h3>
            
            <div className="space-y-4">
              {/* Condition 1: Clicked claim button */}
              <div className="flex items-center justify-between py-2 border-b border-dashed border-[#e6dfd1]">
                <span className="text-lg">Klaim melalui Tombol Check-in</span>
                <span className={`sketch-badge text-xs font-bold px-3 py-1 border-2 border-[#4e3629] rounded-[15px_5px_15px_5px/5px_15px_5px_15px] cursor-pointer ${
                  statusData.today_checked_in ? 'bg-[#c8e6c9] text-[#1b5e20] border-[#2e7d32]' : 'bg-[#ffcdd2] text-[#b71c1c] border-[#c62828]'
                }`}>
                  {statusData.today_checked_in ? '✓ Sudah Klaim' : '✗ Belum Klaim'}
                </span>
              </div>

              {/* Condition 2: Completed 1 daily mission */}
              <div className="flex items-center justify-between py-2 border-b border-dashed border-[#e6dfd1]">
                <span className="text-lg">Menyelesaikan minimal 1 Misi Harian</span>
                <span className={`sketch-badge text-xs font-bold px-3 py-1 border-2 border-[#4e3629] rounded-[15px_5px_15px_5px/5px_15px_5px_15px] cursor-pointer ${
                  statusData.requirements.daily_mission_completed ? 'bg-[#c8e6c9] text-[#1b5e20] border-[#2e7d32]' : 'bg-[#ffcdd2] text-[#b71c1c] border-[#c62828]'
                }`}>
                  {statusData.requirements.daily_mission_completed ? '✓ Terpenuhi' : '✗ Belum Selesai'}
                </span>
              </div>

              {/* Condition 3: Completed 1 practice task */}
              <div className="flex items-center justify-between py-2">
                <span className="text-lg">Menyelesaikan minimal 1 Latihan Mandiri</span>
                <span className={`sketch-badge text-xs font-bold px-3 py-1 border-2 border-[#4e3629] rounded-[15px_5px_15px_5px/5px_15px_5px_15px] cursor-pointer ${
                  statusData.requirements.practice_mission_completed ? 'bg-[#c8e6c9] text-[#1b5e20] border-[#2e7d32]' : 'bg-[#ffcdd2] text-[#b71c1c] border-[#c62828]'
                }`}>
                  {statusData.requirements.practice_mission_completed ? '✓ Terpenuhi' : '✗ Belum Selesai'}
                </span>
              </div>
            </div>
          </div>

          {/* Action Box */}
          <div className="text-center">
            {statusData.today_checked_in ? (
              <div className="gochi-font text-2xl text-[#2e7d32] font-bold">
                ✓ Presensi Hari Ini Telah Selesai! Kembali besok untuk reward berikutnya.
              </div>
            ) : (
              <>
                <button
                  onClick={handleClaim}
                  disabled={claiming || !statusData.can_claim}
                  className={`gochi-font text-xl font-bold px-10 py-3 border-2 border-[#4e3629] rounded-[12px_5px_12px_5px/5px_12px_5px_12px] transition-transform active:scale-95 shadow-[4px_4px_0px_#4e3629] ${
                    statusData.can_claim 
                      ? 'bg-[#ffb300] text-[#4e3629] cursor-pointer hover:bg-[#ffa000]'
                      : 'bg-[#a1887f] text-white cursor-not-allowed opacity-75'
                  }`}
                >
                  {claiming ? 'MENCATAT...' : `KLAIM REWARD (HARI KE-${statusData.active_day})`}
                </button>
                {!statusData.can_claim && (
                  <div className="text-red-600 font-bold mt-3 text-sm">
                    Selesaikan misi harian & latihan mandiri hari ini terlebih dahulu untuk mengklaim!
                  </div>
                )}
              </>
            )}
          </div>

        </div>
        </div>
        )}
      </main>
    </div>
  );
}
