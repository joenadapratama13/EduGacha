'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { mockCards } from '@/components/mockCards';
import { supabase } from '@/lib/supabaseClient';

export default function PublicPortfolioPage({ params: paramsPromise }) {
  const params = use(paramsPromise);
  const userId = params.userId;
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('essays'); // 'essays' or 'cards'
  const [essays, setEssays] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [obtainedCards, setObtainedCards] = useState([]);
  const [selectedEssay, setSelectedEssay] = useState(null);
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [selectedCard, setSelectedCard] = useState(null);

  useEffect(() => {
    const loadPublicProfileData = async () => {
      try {
        // Resolve profile by username (userId is route parameter)
        const { data: profile, error: profileErr } = await supabase
          .table('profiles')
          .select('*')
          .eq('username', userId)
          .single();

        if (profileErr || !profile) {
          console.error("Public profile resolution error:", profileErr);
          setUser(null);
          return;
        }

        setUser(profile);

        // Fetch essays for this public user
        const { data: essayData } = await supabase
          .table('essays')
          .select('*, missions(title)')
          .eq('user_id', profile.id)
          .order('created_at', { ascending: false });

        const mappedEssays = (essayData || []).map(e => ({
          id: e.id,
          title: e.missions?.title || "Misi Esai",
          essayTitle: e.missions?.title || "Misi Esai",
          essayContent: e.content,
          score: e.score,
          grade: e.grade,
          aspects: e.aspect_scores,
          feedback: e.ai_feedback,
          coins: e.coins_earned,
          exp: e.exp_earned,
          created_at: e.created_at
        }));
        setEssays(mappedEssays);

        // Fetch quizzes for this public user
        const { data: quizData } = await supabase
          .table('quiz_results')
          .select('*, missions(title)')
          .eq('user_id', profile.id)
          .order('created_at', { ascending: false });

        const mappedQuizzes = (quizData || []).map(q => ({
          id: q.id,
          title: q.missions?.title || "Misi Kuis",
          score: q.score,
          correctCount: q.correct_count,
          totalQuestions: q.total_questions,
          resultsDetails: q.answers,
          coins: q.coins_earned,
          exp: q.exp_earned,
          ai_feedback: q.ai_feedback,
          created_at: q.created_at
        }));
        setQuizzes(mappedQuizzes);

        // Fetch obtained cards (user_cards joined with cards) for this public user
        const { data: userCards } = await supabase
          .table('user_cards')
          .select('*, cards(*)')
          .eq('user_id', profile.id);

        const mappedCards = (userCards || []).map(uc => {
          const template = mockCards.find(mc => mc.name === uc.cards?.name);
          return {
            cardId: template ? template.id : uc.card_id,
            obtainedAt: uc.obtained_at
          };
        });
        setObtainedCards(mappedCards);
      } catch (err) {
        console.error("Failed to load public profile data:", err);
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      loadPublicProfileData();
    }
  }, [userId]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <p className="font-label-mono text-ink-muted animate-pulse">Menghubungkan ke Portofolio Publik...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center bg-background p-6 text-center">
        <span className="material-symbols-outlined text-6xl text-error mb-4">error</span>
        <h2 className="font-headline-lg text-2xl font-bold text-ink-text mb-2 font-headline-lg">Portofolio Tidak Ditemukan</h2>
        <p className="font-body-md text-ink-muted mb-6">Profil dengan identitas &quot;{userId}&quot; belum terdaftar atau tidak mempublikasikan portofolionya.</p>
        <Link href="/login" className="bg-primary text-white font-label-mono text-sm px-6 py-2.5 rounded hover:opacity-90 no-underline">
          Masuk ke EduGacha
        </Link>
      </div>
    );
  }

  // Calculate statistics
  const totalEssays = essays.length;
  const avgEssayScore = totalEssays > 0 
    ? Math.round(essays.reduce((sum, e) => sum + e.score, 0) / totalEssays)
    : 0;

  // Calculate average of aspects
  const avgAspects = { grammar: 0, argument: 0, relevance: 0, vocabulary: 0 };
  if (totalEssays > 0) {
    essays.forEach(e => {
      if (e.aspects) {
        avgAspects.grammar += e.aspects.grammar || 0;
        avgAspects.argument += e.aspects.argument || 0;
        avgAspects.relevance += e.aspects.relevance || 0;
        avgAspects.vocabulary += e.aspects.vocabulary || 0;
      }
    });
    avgAspects.grammar = Math.round(avgAspects.grammar / totalEssays);
    avgAspects.argument = Math.round(avgAspects.argument / totalEssays);
    avgAspects.relevance = Math.round(avgAspects.relevance / totalEssays);
    avgAspects.vocabulary = Math.round(avgAspects.vocabulary / totalEssays);
  }

  // Calculate unique cards collected
  const collectedCardIds = obtainedCards.map(c => c.cardId);
  const uniqueCollectedCount = mockCards.filter(c => collectedCardIds.includes(c.id)).length;

  return (
    <div className="bg-background text-ink-text font-body-md min-h-screen overflow-x-hidden selection:bg-secondary-container">
      {/* Print Stylesheet (Hides Header & Buttons during print) */}
      <style jsx global>{`
        @media print {
          header, button, .no-print {
            display: none !important;
          }
          main {
            padding: 0 !important;
          }
          .print-card {
            border: 1px solid #79542e !important;
            box-shadow: none !important;
            background: #fffcf5 !important;
          }
        }
      `}</style>

      {/* Public Banner & Toolbar */}
      <header className="bg-[#fffcf5] border-b border-parchment-border/40 py-4 px-4 sm:px-6 md:px-12 flex flex-col sm:flex-row justify-between items-center gap-4 sticky top-0 z-40 shadow-sm no-print">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-primary text-2xl">visibility</span>
          <p className="font-label-mono text-xs text-ink-muted uppercase tracking-widest text-center sm:text-left">Pratinjau Portofolio Publik: <strong className="text-primary font-bold">Read-Only</strong></p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto justify-center sm:justify-end">
          <button onClick={handlePrint} className="flex items-center gap-2 px-4 py-2 border border-parchment-border hover:bg-surface-container rounded transition-colors text-sm font-label-mono text-ink-muted cursor-pointer">
            <span className="material-symbols-outlined text-[18px]">print</span>
            <span>Cetak PDF</span>
          </button>
          <Link href="/dashboard" className="px-4 py-2 bg-primary text-white hover:opacity-90 rounded transition-colors text-sm font-label-mono no-underline">
            Dashboard Saya
          </Link>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-12 md:py-16 space-y-12">
        
        {/* Section: Scholar Overview */}
        <section className="bg-paper-surface border border-parchment-border p-8 md:p-12 rounded-2xl shadow-sm paper-texture flex flex-col md:flex-row justify-between items-center gap-8 print-card">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="w-24 h-24 rounded-full border-4 border-primary overflow-hidden bg-surface-container-high flex-shrink-0">
              <img
                alt="Student Profile"
                className="w-full h-full object-cover"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuDER-IP0xCIxwf0F8PNcFPWFsmUpUmTQwbO1loH0RDU0b_EfzYzASpAe20c9bLNtiTLgExfzNULE8iw_IZBJF1BqcHukNS06DO3SvVSqlMkAmzL39OV_LHHweaDbnfvy9tcB1uNikuFTbEPvR22C42vPpskVuUziZPOimhk0K3gjkLs_sMlc_Tn2syTUO_hFNaEGotgMt6MO6yR4MAeSDEeT4pcx24NwS-P1TfhqJLUeG6W9uKD1O7Ztd_wNPV1hGx3FfP2xKGLg0NO"
              />
            </div>
            <div className="text-center md:text-left space-y-1">
              <span className="bg-primary/15 text-primary text-[10px] font-label-mono font-bold px-3 py-1 rounded-full uppercase">Level {user.level} {user.active_title || 'Scholar'}</span>
              <h2 className="font-headline-lg text-3xl font-bold text-ink-text pt-2 font-headline-lg">{user.username}</h2>
              <p className="font-body-md text-ink-muted italic">{user.department || 'Cendekia Independen'}</p>
            </div>
          </div>
          
          {/* Quick Metrics */}
          <div className="grid grid-cols-3 gap-6 md:gap-12 text-center border-t border-parchment-border md:border-t-0 md:border-l border-parchment-border/50 pt-6 md:pt-0 md:pl-12 w-full md:w-auto">
            <div>
              <p className="font-stats-lg text-3xl text-primary font-bold">{totalEssays}</p>
              <p className="font-label-mono text-[10px] text-ink-muted uppercase tracking-widest mt-1">Total Esai</p>
            </div>
            <div>
              <p className="font-stats-lg text-3xl text-primary font-bold">{avgEssayScore}<span className="text-sm font-normal text-ink-muted">/100</span></p>
              <p className="font-label-mono text-[10px] text-ink-muted uppercase tracking-widest mt-1">Rerata Skor</p>
            </div>
            <div>
              <p className="font-stats-lg text-3xl text-primary font-bold">{uniqueCollectedCount}<span className="text-sm font-normal text-ink-muted">/8</span></p>
              <p className="font-label-mono text-[10px] text-ink-muted uppercase tracking-widest mt-1">Kartu Gacha</p>
            </div>
          </div>
        </section>

        {/* Section: Tab Navigation - Hidden on Print */}
        <div className="flex border-b border-parchment-border no-print">
          <button
            onClick={() => setActiveTab('essays')}
            className={`pb-4 px-6 font-headline-lg text-sm font-bold tracking-wide border-b-2 cursor-pointer transition-colors ${
              activeTab === 'essays' ? 'border-primary text-primary' : 'border-transparent text-ink-muted hover:text-primary'
            }`}
          >
            KARYA TULIS & ANALISIS AI
          </button>
          <button
            onClick={() => setActiveTab('cards')}
            className={`pb-4 px-6 font-headline-lg text-sm font-bold tracking-wide border-b-2 cursor-pointer transition-colors ${
              activeTab === 'cards' ? 'border-primary text-primary' : 'border-transparent text-ink-muted hover:text-primary'
            }`}
          >
            ALBUM KARTU GACHA ({uniqueCollectedCount}/8)
          </button>
        </div>

        {/* Tab Content 1: Essays & Writing Radar */}
        {(activeTab === 'essays' || typeof window !== 'undefined' && window.matchMedia && window.matchMedia('print').matches) && (
          <div className="space-y-8">
            
            {/* Average Writing Aspect Chart */}
            {totalEssays > 0 && (
              <section className="bg-paper-surface border border-parchment-border p-8 rounded-2xl shadow-sm print-card">
                <h3 className="font-headline-lg text-xl text-primary mb-6 flex items-center gap-2 font-headline-lg">
                  <span className="material-symbols-outlined">analytics</span> Rerata Profil Kompetensi Menulis
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  {Object.entries(avgAspects).map(([key, val]) => {
                    const aspectNames = {
                      grammar: "Tata Bahasa",
                      argument: "Struktur Argumen",
                      relevance: "Kesesuaian Topik",
                      vocabulary: "Kosa Kata"
                    };
                    return (
                      <div key={key} className="bg-surface-container rounded-xl p-5 border border-parchment-border/40 text-center">
                        <p className="font-label-mono text-xs text-ink-muted uppercase mb-1">{aspectNames[key]}</p>
                        <div className="font-stats-lg text-3xl font-bold text-primary mb-3">{val}/100</div>
                        <div className="h-1.5 w-full bg-surface-container-highest rounded-full overflow-hidden">
                          <div className="h-full bg-primary rounded-full" style={{ width: `${val}%` }}></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Essay List Grid */}
            <section className="space-y-4">
              <h3 className="font-headline-lg text-xl text-ink-text font-headline-lg">Riwayat Analisis Esai</h3>
              
              {essays.length === 0 ? (
                <div className="text-center bg-paper-surface border border-parchment-border border-dashed p-16 rounded-xl">
                  <span className="material-symbols-outlined text-6xl text-ink-muted/30 mb-4">edit_document</span>
                  <p className="font-body-lg text-ink-muted italic font-body-lg">Portofolio belum memiliki catatan esai.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {essays.map((essay) => (
                    <div key={essay.id} className="bg-paper-surface border border-parchment-border p-6 rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-sm hover:border-primary/50 transition-colors print-card">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-3">
                          <span className="bg-secondary-container text-on-secondary-container text-[10px] font-label-mono font-bold px-2.5 py-0.5 border border-parchment-border/40 rounded-sm">
                            ESAI
                          </span>
                          <span className="text-xs text-ink-muted font-label-mono">
                            {new Date(essay.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                          </span>
                        </div>
                        <h4 className="font-headline-lg text-lg font-bold text-ink-text font-headline-lg">{essay.essayTitle || essay.title}</h4>
                        <p className="font-body-md text-sm text-ink-muted line-clamp-1 italic">Misi: {essay.title}</p>
                      </div>
                      
                      <div className="flex items-center gap-6 shrink-0 w-full md:w-auto border-t md:border-t-0 border-parchment-border/30 pt-4 md:pt-0">
                        <div className="text-right">
                          <p className="font-stats-lg text-2xl text-primary font-bold">{essay.score}<span className="text-xs text-ink-muted font-normal">/100</span></p>
                          <span className="text-xs font-label-mono font-bold text-tier-legendary bg-tier-legendary/10 px-2 py-0.5 rounded-full">{essay.grade}</span>
                        </div>
                        <button
                          onClick={() => setSelectedEssay(essay)}
                          className="bg-primary/10 text-primary font-label-mono text-xs px-5 py-2.5 rounded-md hover:bg-primary hover:text-white transition-all cursor-pointer font-bold no-print"
                        >
                          LIHAT ULASAN AI
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Quiz List Grid */}
            <section className="space-y-4">
              <h3 className="font-headline-lg text-xl text-ink-text font-headline-lg">Riwayat Analisis Kuis</h3>
              
              {quizzes.length === 0 ? (
                <div className="text-center bg-paper-surface border border-parchment-border border-dashed p-16 rounded-xl">
                  <span className="material-symbols-outlined text-6xl text-ink-muted/30 mb-4">quiz</span>
                  <p className="font-body-lg text-ink-muted italic font-body-lg">Portofolio belum memiliki catatan kuis.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {quizzes.map((quiz) => (
                    <div key={quiz.id} className="bg-paper-surface border border-parchment-border p-6 rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-sm hover:border-primary/50 transition-colors print-card">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-3">
                          <span className="bg-secondary-container text-on-secondary-container text-[10px] font-label-mono font-bold px-2.5 py-0.5 border border-parchment-border/40 rounded-sm">
                            KUIS
                          </span>
                          <span className="text-xs text-ink-muted font-label-mono">
                            {new Date(quiz.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                          </span>
                        </div>
                        <h4 className="font-headline-lg text-lg font-bold text-ink-text font-headline-lg">{quiz.title}</h4>
                        <p className="font-body-md text-sm text-ink-muted line-clamp-1 italic">Hasil: {quiz.correctCount} / {quiz.totalQuestions} Benar</p>
                      </div>
                      
                      <div className="flex items-center gap-6 shrink-0 w-full md:w-auto border-t md:border-t-0 border-parchment-border/30 pt-4 md:pt-0">
                        <div className="text-right">
                          <p className="font-stats-lg text-2xl text-primary font-bold">{quiz.score}<span className="text-xs text-ink-muted font-normal">%</span></p>
                        </div>
                        <button
                          onClick={() => setSelectedQuiz(quiz)}
                          className="bg-primary/10 text-primary font-label-mono text-xs px-5 py-2.5 rounded-md hover:bg-primary hover:text-white transition-all cursor-pointer font-bold no-print"
                        >
                          LIHAT ULASAN AI
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}

        {/* Tab Content 2: Album Binder */}
        {activeTab === 'cards' && (
          <section className="space-y-8">
            <div className="flex justify-between items-center border-b border-parchment-border/40 pb-4">
              <h3 className="font-headline-lg text-xl text-ink-text font-headline-lg">Koleksi Karakter Akademik</h3>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
              {mockCards.map((card) => {
                const cardPulls = obtainedCards.filter(c => c.cardId === card.id);
                const isUnlocked = cardPulls.length > 0;

                return (
                  <div
                    key={card.id}
                    onClick={() => isUnlocked && setSelectedCard(card)}
                    className={`group relative paper-texture bg-paper-surface border-2 p-6 rounded-xl flex flex-col items-center text-center shadow-sm select-none min-h-[300px] transition-all duration-300 ${
                      isUnlocked
                        ? `${card.borderClass} ${card.glowClass} hover:scale-105 hover:bg-[#fffdf9] cursor-pointer`
                        : 'border-dashed border-parchment-border opacity-50 filter grayscale'
                    }`}
                  >
                    {/* Duplicate badge */}
                    {isUnlocked && cardPulls.length > 1 && (
                      <div className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-primary text-white font-stats-lg text-xs flex items-center justify-center border-2 border-white shadow-md font-bold z-10">
                        x{cardPulls.length}
                      </div>
                    )}

                    {/* Locked icon / Subject */}
                    {!isUnlocked ? (
                      <span className="material-symbols-outlined text-ink-muted text-4xl mt-12 mb-4">lock</span>
                    ) : (
                      <div className="absolute top-4 left-4 font-label-mono text-[9px] text-ink-muted uppercase border border-parchment-border px-2 py-0.5 rounded-sm">
                        {card.subject}
                      </div>
                    )}

                    {/* Rarity */}
                    <div className={`absolute top-4 right-4 font-label-mono text-[9px] font-bold px-2 py-0.5 rounded-sm ${
                      !isUnlocked ? 'bg-surface-container text-ink-muted' :
                      card.rarity === 'Legendary' ? 'bg-tier-legendary/20 text-primary border border-tier-legendary' :
                      card.rarity === 'Epic' ? 'bg-tier-epic/20 text-tier-epic border border-tier-epic' :
                      card.rarity === 'Rare' ? 'bg-tier-rare/20 text-tier-rare border border-tier-rare' :
                      'bg-surface-container text-ink-muted border border-parchment-border'
                    }`}>
                      {card.rarity}
                    </div>

                    {/* Mascot Icon */}
                    <div className={`w-20 h-20 rounded-full overflow-hidden flex items-center justify-center border-2 ${isUnlocked ? card.borderClass : 'border-parchment-border'} mt-12 mb-4 bg-gradient-to-br ${isUnlocked ? card.bgClass : 'from-[#dddacf] to-[#dddacf]'}`}>
                      {isUnlocked && card.image_url ? (
                        <img 
                          src={card.image_url} 
                          alt={card.name} 
                          className="w-full h-full object-cover" 
                        />
                      ) : (
                        <span className={`material-symbols-outlined text-4xl ${isUnlocked ? 'text-ink-text' : 'text-ink-muted'}`}>
                          {card.icon}
                        </span>
                      )}
                    </div>

                    {/* Card Info */}
                    <h4 className="font-headline-lg text-lg font-bold text-ink-text mb-1 leading-tight font-headline-lg">
                      {isUnlocked ? card.name : 'Terkunci'}
                    </h4>
                    <p className="font-body-md text-[11px] text-ink-muted italic leading-relaxed px-2">
                      {isUnlocked ? `"${card.quote.substring(0, 40)}..."` : 'Belum diperoleh'}
                    </p>

                    {isUnlocked && (
                      <span className="mt-auto pt-4 text-[10px] font-label-mono text-primary font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                        KLIK DETAIL
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </main>

      {/* Essay Detail Modal */}
      {selectedEssay && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto no-print">
          <div className="bg-paper-surface border border-parchment-border max-w-3xl w-full rounded-2xl shadow-xl paper-texture p-8 md:p-12 relative my-8">
            <button
              onClick={() => setSelectedEssay(null)}
              className="absolute top-4 right-4 text-ink-muted hover:text-primary transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[28px]">close</span>
            </button>

            <div className="space-y-6">
              <div>
                <span className="bg-secondary-container text-on-secondary-container font-label-mono text-xs px-3 py-1 rounded border border-parchment-border/40">
                  EVALUASI ESAI PUBLIK
                </span>
                <h2 className="font-headline-lg text-3xl font-bold text-ink-text mt-4 font-headline-lg">{selectedEssay.essayTitle || selectedEssay.title}</h2>
                <p className="font-body-md text-ink-muted italic mt-1">Misi: {selectedEssay.title}</p>
              </div>

              {/* Essay Content Box */}
              <div className="bg-surface-container/50 p-6 rounded-lg border border-parchment-border/30 max-h-[300px] overflow-y-auto text-sm leading-loose text-ink-text font-body-md whitespace-pre-line">
                {selectedEssay.essayContent}
              </div>

              {/* Assessment Panel */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-parchment-border/40">
                <div className="bg-[#fffcf5] border border-parchment-border rounded-xl p-6 flex flex-col items-center justify-center text-center">
                  <p className="font-label-mono text-xs text-ink-muted uppercase mb-1">Skor Penilaian</p>
                  <div className="font-headline-xl text-5xl font-bold text-primary mb-2 font-headline-lg">{selectedEssay.score}<span className="text-xl text-ink-muted font-normal">/100</span></div>
                  <span className="bg-primary/10 text-primary font-bold px-3 py-0.5 rounded-full">{selectedEssay.grade}</span>
                </div>
                
                <div className="space-y-3">
                  <h4 className="font-label-mono text-xs font-bold text-ink-text uppercase">Aspek Kompetensi:</h4>
                  {Object.entries(selectedEssay.aspects || {}).map(([key, val]) => {
                    const aspectNames = {
                      grammar: "Tata Bahasa",
                      argument: "Struktur Argumen",
                      relevance: "Kesesuaian Topik",
                      vocabulary: "Kosa Kata"
                    };
                    return (
                      <div key={key} className="flex justify-between items-center text-xs">
                        <span className="font-label-mono text-ink-muted">{aspectNames[key]}</span>
                        <span className="font-stats-lg text-primary font-bold">{val}/100</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* AI Feedback */}
              <div className="bg-secondary-container/20 border-l-4 border-primary p-6 rounded-r-xl italic">
                <h4 className="font-headline-lg text-sm text-primary font-bold mb-2 not-italic font-headline-lg">Ulasan Profesor AI</h4>
                <p className="font-body-md text-ink-text text-sm leading-relaxed">&quot;{selectedEssay.feedback}&quot;</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quiz Detail Modal */}
      {selectedQuiz && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto no-print">
          <div className="bg-paper-surface border border-parchment-border max-w-3xl w-full rounded-2xl shadow-xl paper-texture p-8 md:p-12 relative my-8">
            <button
              onClick={() => setSelectedQuiz(null)}
              className="absolute top-4 right-4 text-ink-muted hover:text-primary transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[28px]">close</span>
            </button>

            <div className="space-y-6">
              <div>
                <span className="bg-secondary-container text-on-secondary-container font-label-mono text-xs px-3 py-1 rounded border border-parchment-border/40">
                  EVALUASI KUIS PUBLIK
                </span>
                <h2 className="font-headline-lg text-3xl font-bold text-ink-text mt-4 font-headline-lg">{selectedQuiz.title}</h2>
              </div>

              {/* Assessment Panel */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-parchment-border/40">
                <div className="bg-[#fffcf5] border border-parchment-border rounded-xl p-6 flex flex-col items-center justify-center text-center">
                  <p className="font-label-mono text-xs text-ink-muted uppercase mb-1">Skor Kuis</p>
                  <div className="font-headline-xl text-5xl font-bold text-primary mb-2 font-headline-lg">{selectedQuiz.score}<span className="text-xl text-ink-muted font-normal">%</span></div>
                  <span className="bg-primary/10 text-primary font-bold px-3 py-0.5 rounded-full text-xs">{selectedQuiz.correctCount} / {selectedQuiz.totalQuestions} Benar</span>
                </div>
                
                <div className="bg-[#fffcf5] border border-parchment-border rounded-xl p-6 flex flex-col items-center justify-center text-center">
                  <p className="font-label-mono text-xs text-ink-muted uppercase mb-1">Hadiah Diperoleh</p>
                  <div className="text-left space-y-2 mt-2">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="material-symbols-outlined text-tier-legendary" style={{ fontVariationSettings: "'FILL' 1" }}>monetization_on</span>
                      <span className="font-bold text-ink-text">+{selectedQuiz.coins} Koin</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="material-symbols-outlined text-tier-rare" style={{ fontVariationSettings: "'FILL' 1" }}>military_tech</span>
                      <span className="font-bold text-ink-text">+{selectedQuiz.exp} XP</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* AI Feedback */}
              <div className="bg-secondary-container/20 border-l-4 border-primary p-6 rounded-r-xl italic">
                <h4 className="font-headline-lg text-sm text-primary font-bold mb-2 not-italic font-headline-lg">Ulasan Profesor AI</h4>
                <p className="font-body-md text-ink-text text-sm leading-relaxed">&quot;{selectedQuiz.ai_feedback || "Kerja bagus! Evaluasi kuis Anda telah dicatat oleh sistem."}&quot;</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Card Detail Modal */}
      {selectedCard && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto no-print">
          <div className="max-w-md w-full relative">
            <button
              onClick={() => setSelectedCard(null)}
              className="absolute top-[-40px] right-0 text-white hover:text-primary transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[32px]">close</span>
            </button>

            <div className={`paper-texture bg-paper-surface border-4 ${selectedCard.borderClass} ${selectedCard.glowClass} p-8 rounded-2xl flex flex-col items-center text-center relative select-none w-full`}>
              <div className="absolute top-6 left-6 font-label-mono text-[10px] text-ink-muted uppercase border border-parchment-border px-2 py-0.5 rounded-sm">
                {selectedCard.subject}
              </div>
              <div className={`absolute top-6 right-6 font-label-mono text-[10px] font-bold px-2 py-0.5 rounded-sm ${
                selectedCard.rarity === 'Legendary' ? 'bg-tier-legendary/20 text-primary border border-tier-legendary' :
                selectedCard.rarity === 'Epic' ? 'bg-tier-epic/20 text-tier-epic border border-tier-epic' :
                selectedCard.rarity === 'Rare' ? 'bg-tier-rare/20 text-tier-rare border border-tier-rare' :
                'bg-surface-container text-ink-muted border border-parchment-border'
              }`}>
                {selectedCard.rarity}
              </div>

              {/* Character Icon Container */}
              <div className={`w-28 h-28 rounded-full overflow-hidden flex items-center justify-center border-2 ${selectedCard.borderClass} mt-12 mb-6 shadow-sm bg-gradient-to-br ${selectedCard.bgClass}`}>
                {selectedCard.image_url ? (
                  <img 
                    src={selectedCard.image_url} 
                    alt={selectedCard.name} 
                    className="w-full h-full object-cover" 
                  />
                ) : (
                  <span className="material-symbols-outlined text-5xl text-ink-text">{selectedCard.icon}</span>
                )}
              </div>

              {/* Card Title */}
              <h3 className="font-headline-lg text-2xl font-bold text-ink-text mb-2 font-headline-lg">{selectedCard.name}</h3>
              
              {/* Quote */}
              <p className={`font-body-md text-xs italic ${selectedCard.textClass} px-4 py-3 bg-secondary-container/20 rounded-md border border-parchment-border/40 mb-6 min-h-[50px] flex items-center justify-center`}>
                &quot;{selectedCard.quote}&quot;
              </p>

              {/* Description */}
              <p className="font-body-md text-[12px] text-ink-muted leading-relaxed mb-6 border-b border-parchment-border/40 pb-4 flex-1">
                {selectedCard.description}
              </p>

              {/* Stats Breakdown */}
              <div className="w-full space-y-2.5 text-left mb-4">
                {Object.entries(selectedCard.stats).map(([statName, val]) => (
                  <div key={statName} className="flex justify-between items-center text-[12px]">
                    <span className="font-label-mono text-ink-muted uppercase">{statName}</span>
                    <div className="flex items-center gap-2 flex-1 ml-4 justify-end">
                      <div className="h-1.5 bg-surface-container-highest rounded-full overflow-hidden w-32">
                        <div className="h-full bg-primary" style={{ width: `${val}%` }}></div>
                      </div>
                      <span className="font-label-mono font-bold w-6 text-right">{val}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
