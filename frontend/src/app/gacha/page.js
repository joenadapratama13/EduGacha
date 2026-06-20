'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Sidebar from '@/components/Sidebar';
import { mockCards } from '@/components/mockCards';
import { supabase } from '@/lib/supabaseClient';

export default function GachaPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [drawResult, setDrawResult] = useState(null); // null or { type: 'card'|'coins'|'exp', item: Card|number, rarity: string }
  const [multipleResults, setMultipleResults] = useState(null); // null or array of results for 10x pull
  const [animating, setAnimating] = useState(false);
  const [showResultModal, setShowResultModal] = useState(false);
  const [gachaHistory, setGachaHistory] = useState([]);
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

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        window.location.href = '/login';
        return;
      }

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

        // Fetch gacha history from Supabase
        const { data: history } = await supabase
          .table('gacha_history')
          .select('*')
          .eq('user_id', session.user.id)
          .order('created_at', { ascending: false })
          .limit(50);

        setGachaHistory(history || []);
      } catch (err) {
        console.error("Failed to load profile:", err);
      } finally {
        setLoading(false);
      }
    };

    checkSession();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('mock_user');
    window.location.href = '/login';
  };

  const handleDraw = async (times) => {
    const cost = times * 50; // Align with 50 coins cost in backend/DB
    if (user.coins < cost) {
      alert("Koin Anda tidak cukup! Selesaikan Misi terlebih dahulu untuk mengumpulkan koin.");
      return;
    }

    setAnimating(true);
    setDrawResult(null);
    setMultipleResults(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        alert("Sesi Anda telah berakhir. Silakan login kembali.");
        window.location.href = '/login';
        return;
      }

      if (times === 1) {
        const res = await fetch('http://localhost:8000/api/gacha/roll', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.detail || "Gagal melakukan gacha");
        }

        const apiResult = await res.json();
        
        let drawRes = null;
        if (apiResult.reward_type === 'card') {
          const cardTemplate = mockCards.find(c => c.name === apiResult.reward_name);
          drawRes = {
            type: 'card',
            rarity: apiResult.reward_rarity,
            item: cardTemplate ? {
              ...cardTemplate,
              id: apiResult.reward_detail.card_id,
              quote: apiResult.reward_detail.quote || cardTemplate.quote,
              description: apiResult.reward_detail.description || cardTemplate.description,
              image_url: apiResult.reward_detail.image_url || cardTemplate.image_url
            } : {
              id: apiResult.reward_detail.card_id,
              name: apiResult.reward_name,
              rarity: apiResult.reward_rarity,
              quote: apiResult.reward_detail.quote || "",
              description: apiResult.reward_detail.description || "",
              stats: { Logika: 70, Kreativitas: 70, Penulisan: 70, Riset: 70 },
              icon: "school",
              bgClass: "from-[#7f8c8d] via-[#f2f4f4] to-[#5d6d7e]",
              textClass: "text-[#5d6d7e]",
              borderClass: "border-[#7f8c8d]",
              glowClass: "shadow-none"
            }
          };
        } else {
          drawRes = {
            type: apiResult.reward_type,
            rarity: apiResult.reward_rarity,
            item: apiResult.reward_detail.amount
          };
        }

        setDrawResult(drawRes);
        setUser(prev => ({
          ...prev,
          coins: apiResult.new_coins,
          pity_counter: apiResult.new_pity
        }));
      } else {
        // 10x roll: perform 10 rolls sequentially to prevent db race conditions
        const results = [];
        let lastCoins = user.coins;
        let lastPity = user.pity_counter;

        for (let i = 0; i < 10; i++) {
          const res = await fetch('http://localhost:8000/api/gacha/roll', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${session.access_token}`,
              'Content-Type': 'application/json'
            }
          });

          if (!res.ok) {
            const errData = await res.json();
            throw new Error(errData.detail || `Gagal melakukan gacha pada tarikan ke-${i + 1}`);
          }

          const apiResult = await res.json();
          lastCoins = apiResult.new_coins;
          lastPity = apiResult.new_pity;

          let drawRes = null;
          if (apiResult.reward_type === 'card') {
            const cardTemplate = mockCards.find(c => c.name === apiResult.reward_name);
            drawRes = {
              type: 'card',
              rarity: apiResult.reward_rarity,
              item: cardTemplate ? {
                ...cardTemplate,
                id: apiResult.reward_detail.card_id,
                quote: apiResult.reward_detail.quote || cardTemplate.quote,
                description: apiResult.reward_detail.description || cardTemplate.description,
                image_url: apiResult.reward_detail.image_url || cardTemplate.image_url
              } : {
                id: apiResult.reward_detail.card_id,
                name: apiResult.reward_name,
                rarity: apiResult.reward_rarity,
                quote: apiResult.reward_detail.quote || "",
                description: apiResult.reward_detail.description || "",
                stats: { Logika: 70, Kreativitas: 70, Penulisan: 70, Riset: 70 },
                icon: "school",
                bgClass: "from-[#7f8c8d] via-[#f2f4f4] to-[#5d6d7e]",
                textClass: "text-[#5d6d7e]",
                borderClass: "border-[#7f8c8d]",
                glowClass: "shadow-none"
              }
            };
          } else {
            drawRes = {
              type: apiResult.reward_type,
              rarity: apiResult.reward_rarity,
              item: apiResult.reward_detail.amount
            };
          }
          results.push(drawRes);
        }

        setMultipleResults(results);
        setUser(prev => ({
          ...prev,
          coins: lastCoins,
          pity_counter: lastPity
        }));
      }

      // Fetch updated history
      const { data: history } = await supabase
        .table('gacha_history')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      setGachaHistory(history || []);
      setShowResultModal(true);
    } catch (err) {
      console.error(err);
      alert(err.message || "Terjadi kesalahan jaringan saat melakukan gacha.");
    } finally {
      setAnimating(false);
    }
  };

  const formatTimestamp = (isoString) => {
    try {
      const date = new Date(isoString);
      const now = new Date();
      const isToday = date.toDateString() === now.toDateString();

      const timeStr = date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
      if (isToday) {
        return `Hari ini, ${timeStr}`;
      }

      const day = date.getDate();
      const month = date.toLocaleDateString('id-ID', { month: 'short' });
      return `${day} ${month}, ${timeStr}`;
    } catch (e) {
      return isoString;
    }
  };

  const sidebarUser = user || { username: "Memuat...", level: 1, coins: 0, active_title: "", epic_tickets: 0 };

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
        activePage="gacha"
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
            <h2 className="font-headline-lg text-xl font-bold text-primary">Mesin Gacha Akademis</h2>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-tier-legendary text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>monetization_on</span>
              <span className="font-stats-lg text-lg font-bold">{sidebarUser.coins.toLocaleString('id-ID')}</span>
            </div>
            <div className="flex items-center gap-2 bg-[#ffb300]/10 px-3 py-1 rounded-full border border-[#ffb300]/30">
              <span className="material-symbols-outlined text-[#ffb300] text-xl">confirmation_number</span>
              <span className="font-stats-lg text-sm font-bold text-[#ffb300]">{sidebarUser.epic_tickets || 0} Tiket Epic</span>
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
        {loading || !user ? (
          <div className="flex h-[400px] w-full items-center justify-center bg-background">
            <p className="font-label-mono text-ink-muted animate-pulse">Menghubungkan ke Mesin Gacha...</p>
          </div>
        ) : (
          <div className="flex-1 px-4 sm:px-6 md:px-margin-desktop py-12 max-w-container-max mx-auto w-full flex flex-col justify-center items-center relative z-10">
          {/* Background Sparks & Textures */}
          <div className="absolute inset-0 paper-texture opacity-30 pointer-events-none"></div>

          {/* Gacha Machine Container */}
          <div className="max-w-xl w-full text-center space-y-8 relative">
            
            {/* Pity Stats Display */}
            <div className="inline-block bg-paper-surface border border-parchment-border px-6 py-2 rounded-full shadow-sm text-sm font-label-mono">
              Jaminan Legendary: <span className="text-tier-legendary font-bold">{user.pity_counter || 0} / 60</span> tarikan
            </div>

            {/* Visual Machine Area */}
            <div className="relative bg-[#fffcf5] border border-parchment-border p-8 rounded-2xl shadow-xl paper-texture select-none sketch-border max-w-sm mx-auto">
              
              {/* Glass dome with scrolls */}
              <div className="h-64 bg-gradient-to-b from-[#e5dec9]/30 to-[#fdf9ee]/90 rounded-t-xl border border-parchment-border/60 relative overflow-hidden flex items-center justify-center">
                {/* Floating scrolls */}
                <div className={`absolute inset-0 flex flex-wrap gap-4 p-6 justify-center items-center transition-all ${animating ? 'animate-bounce' : 'opacity-85'}`}>
                  <span className="material-symbols-outlined text-primary text-4xl transform rotate-12 animate-pulse" style={{ animationDelay: '100ms' }}>history_edu</span>
                  <span className="material-symbols-outlined text-tier-epic text-4xl transform -rotate-45" style={{ animationDelay: '400ms' }}>school</span>
                  <span className="material-symbols-outlined text-tier-rare text-5xl transform rotate-45" style={{ animationDelay: '200ms' }}>functions</span>
                  <span className="material-symbols-outlined text-tier-legendary text-6xl transform -rotate-12 animate-pulse">workspace_premium</span>
                  <span className="material-symbols-outlined text-[#7f8c8d] text-4xl transform rotate-90">menu_book</span>
                  <span className="material-symbols-outlined text-primary text-5xl transform -rotate-12">psychology</span>
                </div>
                {/* Reflection effect */}
                <div className="absolute top-0 left-0 w-full h-1/2 bg-white/20 transform -skew-y-12"></div>
              </div>

              {/* Lower Body of Gacha Machine */}
              <div className="bg-surface-container border-t border-parchment-border p-6 rounded-b-xl flex flex-col items-center justify-center relative">
                
                {/* Dial / Key / Turn Button */}
                <button
                  disabled={animating}
                  onClick={() => handleDraw(1)}
                  className={`w-24 h-24 rounded-full border-4 border-parchment-border flex items-center justify-center bg-paper-surface hover:border-primary transition-all duration-300 relative z-20 cursor-pointer shadow-md ${
                    animating ? 'animate-spin' : 'hover:scale-105 active:scale-95'
                  }`}
                >
                  <span className="material-symbols-outlined text-primary text-4xl font-bold">cached</span>
                </button>

                {/* Dispenser chute */}
                <div className="w-20 h-10 bg-black/20 rounded-t-lg border-b-4 border-parchment-border mt-6 flex items-center justify-center">
                  <div className={`w-8 h-8 rounded-full bg-primary/20 border border-primary/40 ${animating ? 'animate-ping' : ''}`}></div>
                </div>
              </div>
            </div>

            {/* Instruction / Motivational Text */}
            <div className="space-y-2 max-w-sm mx-auto">
              <h3 className="font-headline-lg text-2xl text-ink-text font-headline-lg">Tukar Koin untuk Inspirasi</h3>
              <p className="font-body-md text-ink-muted leading-relaxed">
                Setiap tarikan berharga <strong className="text-primary font-bold">50 Koin</strong>. Dapatkan Kartu Karakter unik dengan quote motivasi akademis dan bonus Koin atau EXP.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <button
                disabled={animating || user.coins < 50}
                onClick={() => handleDraw(1)}
                className="w-48 bg-primary hover:opacity-95 text-white py-3 px-6 rounded-lg font-headline-lg text-sm font-bold shadow-md tracking-wide active:scale-95 transition-all disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
              >
                TARIK 1x (50 Koin)
              </button>
              {user.epic_tickets > 0 && (
                <button
                  disabled={animating}
                  onClick={async () => {
                    setAnimating(true);
                    setDrawResult(null);
                    setMultipleResults(null);
                    try {
                      const { data: { session } } = await supabase.auth.getSession();
                      if (!session) {
                        alert("Sesi berakhir.");
                        return;
                      }
                      const res = await fetch('http://localhost:8000/api/gacha/roll', {
                        method: 'POST',
                        headers: {
                          'Authorization': `Bearer ${session.access_token}`,
                          'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ use_ticket: true })
                      });
                      if (!res.ok) {
                        const err = await res.json();
                        throw new Error(err.detail || "Gagal menarik gacha");
                      }
                      const apiResult = await res.json();
                      const cardTemplate = mockCards.find(c => c.name === apiResult.reward_name);
                      setDrawResult({
                        type: 'card',
                        rarity: apiResult.reward_rarity,
                        item: cardTemplate ? {
                          ...cardTemplate,
                          id: apiResult.reward_detail.card_id,
                          quote: apiResult.reward_detail.quote || cardTemplate.quote,
                          description: apiResult.reward_detail.description || cardTemplate.description,
                          image_url: apiResult.reward_detail.image_url || cardTemplate.image_url
                        } : {
                          id: apiResult.reward_detail.card_id,
                          name: apiResult.reward_name,
                          rarity: apiResult.reward_rarity,
                          quote: apiResult.reward_detail.quote || "",
                          description: apiResult.reward_detail.description || "",
                          stats: { Logika: 70, Kreativitas: 70, Penulisan: 70, Riset: 70 },
                          icon: "school",
                          bgClass: "from-[#7f8c8d] to-[#5d6d7e]",
                          textClass: "text-[#5d6d7e]",
                          borderClass: "border-[#7f8c8d]",
                          glowClass: "shadow-none"
                        }
                      });
                      setUser(prev => ({
                        ...prev,
                        epic_tickets: apiResult.new_tickets,
                        pity_counter: apiResult.new_pity
                      }));
                      setShowResultModal(true);

                      // Refresh gacha history
                      const { data: history } = await supabase
                        .table('gacha_history')
                        .select('*')
                        .eq('user_id', session.user.id)
                        .order('created_at', { ascending: false })
                        .limit(50);
                      setGachaHistory(history || []);
                    } catch (e) {
                      alert(e.message);
                    } finally {
                      setAnimating(false);
                    }
                  }}
                  className="w-48 bg-[#ffb300] hover:bg-[#ffa000] text-[#4e3629] py-3 px-6 rounded-lg font-headline-lg text-sm font-bold shadow-md tracking-wide active:scale-95 transition-all cursor-pointer animate-pulse"
                >
                  TARIK EPIC (1 Tiket)
                </button>
              )}
              <button
                disabled={animating || user.coins < 500}
                onClick={() => handleDraw(10)}
                className="w-48 border border-primary text-primary hover:bg-secondary-container py-3 px-6 rounded-lg font-headline-lg text-sm font-bold shadow-sm tracking-wide active:scale-95 transition-all disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
              >
                TARIK 10x (500 Koin)
              </button>
            </div>

          </div>

          {/* Gacha History Log Table */}
          <div className="w-full max-w-4xl bg-paper-surface border border-parchment-border rounded-xl shadow-sm paper-texture overflow-hidden text-left mt-12 relative">
            <div className="px-6 py-4 border-b border-parchment-border flex justify-between items-center bg-surface-container/10">
              <h3 className="font-headline-lg text-lg text-ink-text flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[22px]">history</span>
                <span>Riwayat Tarikan Terakhir</span>
              </h3>
              {gachaHistory.length > 0 && (
                <button
                  onClick={() => {
                    if (confirm("Apakah Anda yakin ingin menghapus seluruh riwayat penarikan?")) {
                      localStorage.setItem('gacha_history', '[]');
                      setGachaHistory([]);
                    }
                  }}
                  className="font-label-mono text-xs text-primary hover:underline cursor-pointer"
                >
                  Hapus Riwayat
                </button>
              )}
            </div>

            {gachaHistory.length === 0 ? (
              <p className="font-body-md text-sm text-ink-muted italic py-8 text-center bg-white/50">Belum ada riwayat penarikan gacha.</p>
            ) : (
              <div className="overflow-x-auto max-h-[300px] overflow-y-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="font-label-mono text-[10px] text-ink-muted uppercase tracking-widest border-b border-parchment-border bg-surface-container/5">
                      <th className="px-6 py-3">Tanggal &amp; Waktu</th>
                      <th className="px-6 py-3">Hadiah</th>
                      <th className="px-6 py-3">Tipe</th>
                      <th className="px-6 py-3">Biaya</th>
                    </tr>
                  </thead>
                  <tbody className="font-body-md text-sm text-ink-text divide-y divide-parchment-border/50">
                    {gachaHistory.map((log) => {
                      const rarity = log.reward_rarity || 'Common';
                      const rarityColor = {
                        Legendary: "bg-tier-legendary/10 text-tier-legendary border border-tier-legendary/30 animate-pulse",
                        Epic: "bg-tier-epic/10 text-tier-epic border border-tier-epic/30",
                        Rare: "bg-tier-rare/10 text-tier-rare border border-tier-rare/30",
                        Common: "bg-ink-muted/10 text-ink-muted border border-parchment-border/30"
                      }[rarity] || "bg-surface-container text-ink-muted";

                      const rewardName = log.reward_type === 'card'
                        ? (log.reward_detail?.name || 'Kartu Baru')
                        : `+${log.reward_detail?.amount} ${log.reward_type.toUpperCase()}`;

                      return (
                        <tr key={log.id} className="hover:bg-surface-container-low transition-colors">
                          <td className="px-6 py-4 font-label-mono text-xs text-ink-muted">
                            {formatTimestamp(log.created_at)}
                          </td>
                          <td className="px-6 py-4 font-bold text-ink-text">
                            {rewardName}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${rarityColor}`}>
                              {rarity.toUpperCase()}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-ink-muted">50 Koin</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
        )}
      </main>

      {/* Gacha Reveal Modal */}
      {showResultModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="max-w-4xl w-full flex flex-col items-center">
            
            {/* Display single pull */}
            {drawResult && (
              <div className="flex flex-col items-center max-w-md w-full animate-fade-in text-center">
                <h2 className="font-label-mono text-white text-sm tracking-widest uppercase mb-8">Hasil Tarikan Gacha</h2>
                
                {drawResult.type === 'card' ? (
                  /* Premium TCG Card Display */
                  <div className={`paper-texture bg-paper-surface border-4 ${drawResult.item.borderClass} ${drawResult.item.glowClass} p-6 w-80 rounded-2xl flex flex-col items-center text-center relative select-none max-w-xs transition-transform duration-500 hover:scale-105`}>
                    <div className="absolute top-4 left-4 font-label-mono text-[10px] text-ink-muted uppercase border border-parchment-border px-2 py-0.5 rounded-sm">
                      {drawResult.item.subject}
                    </div>
                    <div className={`absolute top-4 right-4 font-label-mono text-[10px] font-bold px-2 py-0.5 rounded-sm ${
                      drawResult.rarity === 'Legendary' ? 'bg-tier-legendary/20 text-primary border border-tier-legendary' :
                      drawResult.rarity === 'Epic' ? 'bg-tier-epic/20 text-tier-epic border border-tier-epic' :
                      drawResult.rarity === 'Rare' ? 'bg-tier-rare/20 text-tier-rare border border-tier-rare' :
                      'bg-surface-container text-ink-muted border border-parchment-border'
                    }`}>
                      {drawResult.rarity}
                    </div>

                    {/* Character Icon Container */}
                    <div className={`w-28 h-28 rounded-full overflow-hidden flex items-center justify-center border-2 ${drawResult.item.borderClass} mt-12 mb-6 bg-gradient-to-br ${drawResult.item.bgClass}`}>
                      {drawResult.item.image_url ? (
                        <img 
                          src={drawResult.item.image_url} 
                          alt={drawResult.item.name} 
                          className="w-full h-full object-cover" 
                        />
                      ) : (
                        <span className="material-symbols-outlined text-5xl text-ink-text">{drawResult.item.icon}</span>
                      )}
                    </div>

                    {/* Card Title */}
                    <h3 className="font-headline-lg text-2xl font-bold text-ink-text mb-2 font-headline-lg">{drawResult.item.name}</h3>
                    
                    {/* Quote */}
                    <p className={`font-body-md text-xs italic ${drawResult.item.textClass} px-3 py-2 bg-secondary-container/20 rounded-md border border-parchment-border/40 mb-4 min-h-[50px] flex items-center justify-center`}>
                      &quot;{drawResult.item.quote}&quot;
                    </p>

                    {/* Description */}
                    <p className="font-body-md text-[11px] text-ink-muted leading-relaxed mb-6 border-b border-parchment-border/40 pb-4 flex-1">
                      {drawResult.item.description}
                    </p>

                    {/* Passive Boost Panel */}
                    {drawResult.item.passiveBoost && (
                      <div className="w-full bg-[#10b981]/10 border-l-4 border-[#10b981] p-3 rounded-r-xl mb-4 text-left">
                        <h4 className="font-label-mono text-[9px] text-[#0f766e] font-bold uppercase tracking-wider mb-1 flex items-center gap-1">
                          <span>✨</span> Efek Pasif Gelar
                        </h4>
                        <p className="font-body-md text-[10px] text-ink-text leading-relaxed">
                          Memberikan tambahan {drawResult.item.passiveBoost}.
                        </p>
                      </div>
                    )}

                    {/* Stats Radar Breakdown */}
                    <div className="w-full space-y-2 text-left">
                      {Object.entries(drawResult.item.stats).map(([statName, val]) => (
                        <div key={statName} className="flex justify-between items-center text-[11px]">
                          <span className="font-label-mono text-ink-muted uppercase">{statName}</span>
                          <div className="flex items-center gap-2 flex-1 ml-4 justify-end">
                            <div className="h-1.5 bg-surface-container-highest rounded-full overflow-hidden w-24">
                              <div className="h-full bg-primary" style={{ width: `${val}%` }}></div>
                            </div>
                            <span className="font-label-mono font-bold w-6 text-right">{val}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  /* Resource Reward Card */
                  <div className="bg-paper-surface border border-parchment-border rounded-xl p-8 max-w-sm w-full flex flex-col items-center shadow-lg">
                    <span className="material-symbols-outlined text-6xl text-tier-legendary mb-4 animate-bounce">
                      {drawResult.type === 'coins' ? 'monetization_on' : 'star'}
                    </span>
                    <h3 className="font-headline-lg text-2xl font-bold text-primary mb-2 font-headline-lg">Bonus {drawResult.type === 'coins' ? 'Koin Kebaikan' : 'Poin Pengalaman'}</h3>
                    <p className="font-body-md text-ink-muted mb-6">Anda beruntung mendapatkan hadiah dari reward pool gacha!</p>
                    <div className="font-stats-lg text-4xl font-bold text-ink-text mb-2">
                      +{drawResult.item} {drawResult.type === 'coins' ? 'Koin' : 'EXP'}
                    </div>
                    <span className="font-label-mono text-xs text-tier-rare uppercase font-bold tracking-widest">{drawResult.rarity} TIER</span>
                  </div>
                )}
              </div>
            )}

            {/* Display 10x Pull */}
            {multipleResults && (
              <div className="flex flex-col items-center w-full animate-fade-in text-center">
                <h2 className="font-label-mono text-white text-sm tracking-widest uppercase mb-8">Hasil Tarikan Gacha (10x)</h2>
                
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 w-full mb-12">
                  {multipleResults.map((res, idx) => (
                    <div
                      key={idx}
                      className={`bg-paper-surface border-2 ${
                        res.type === 'card' ? res.item.borderClass : 'border-parchment-border'
                      } rounded-xl p-4 flex flex-col items-center justify-between shadow-sm relative text-center min-h-[180px] hover:scale-105 transition-transform`}
                    >
                      <span className={`absolute top-2 right-2 font-label-mono text-[8px] font-bold px-1 py-0.5 rounded-sm ${
                        res.rarity === 'Legendary' ? 'bg-tier-legendary/20 text-primary border border-tier-legendary' :
                        res.rarity === 'Epic' ? 'bg-tier-epic/20 text-tier-epic border border-tier-epic' :
                        res.rarity === 'Rare' ? 'bg-tier-rare/20 text-tier-rare border border-tier-rare' :
                        'bg-surface-container text-ink-muted border border-parchment-border'
                      }`}>
                        {res.rarity[0]}
                      </span>

                      <div className="w-12 h-12 rounded-full overflow-hidden flex items-center justify-center border border-parchment-border/50 mt-4 mb-2 bg-surface-container">
                        {res.type === 'card' && res.item.image_url ? (
                          <img 
                            src={res.item.image_url} 
                            alt={res.item.name} 
                            className="w-full h-full object-cover" 
                          />
                        ) : (
                          <span className="material-symbols-outlined text-2xl text-ink-text">
                            {res.type === 'card' ? res.item.icon : res.type === 'coins' ? 'monetization_on' : 'star'}
                          </span>
                        )}
                      </div>

                      <div className="flex-1 flex flex-col justify-center">
                        <h4 className="font-headline-lg text-[13px] leading-tight font-bold text-ink-text mb-1">
                          {res.type === 'card' ? res.item.name : res.type === 'coins' ? `+${res.item} Koin` : `+${res.item} EXP`}
                        </h4>
                        <p className="font-label-mono text-[9px] text-ink-muted uppercase">{res.type}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Close / Action Button */}
            <button
              onClick={() => setShowResultModal(false)}
              className="mt-8 px-10 py-3 bg-primary text-white font-headline-lg text-sm font-bold rounded-lg shadow-md hover:opacity-95 active:scale-95 transition-all cursor-pointer"
            >
              KEMBALI KE MESIN
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
