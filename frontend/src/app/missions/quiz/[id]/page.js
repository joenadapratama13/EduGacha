'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import Sidebar from '@/components/Sidebar';
import { supabase } from '@/lib/supabaseClient';

export default function QuizPage({ params: paramsPromise }) {
  const params = use(paramsPromise);
  const id = params.id;
  const [user, setUser] = useState(null);
  const [mission, setMission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState({}); // { questionId: "A" }
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
    // Session load is handled inside useEffect checkSessionAndLoadMission
  }, []);

  const toggleSidebar = () => {
    const nextState = !isSidebarCollapsed;
    setIsSidebarCollapsed(nextState);
    localStorage.setItem('sidebar_collapsed', String(nextState));
  };

  useEffect(() => {
    const checkSessionAndLoadMission = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        window.location.href = '/login';
        return;
      }

      try {
        // Fetch consolidated questions, user, and mission details from Backend API in a single request
        const res = await fetch(`http://localhost:8000/api/missions/quiz/${id}/questions`, {
          headers: { 'Authorization': `Bearer mock-token-${session.user.id}` }
        });
        
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.detail || "Gagal memuat soal kuis dari server.");
        }
        
        const data = await res.json();
        
        // Update user state with fresh data from backend
        setUser(data.user);
        localStorage.setItem('mock_user', JSON.stringify(data.user));
        
        const mappedQuestions = data.questions.map(q => ({
          id: q.id,
          question: q.question,
          options: q.options
        }));
        
        setMission({
          id: data.mission.id,
          title: data.mission.title,
          description: data.mission.description,
          category: data.mission.topic,
          group_number: data.group_number,
          questions: mappedQuestions
        });
      } catch (err) {
        console.error("Failed to load quiz data:", err);
      } finally {
        setLoading(false);
      }
    };

    checkSessionAndLoadMission();
  }, [id]);

  const handleSelectOption = (qId, optionLabel) => {
    setAnswers(prev => ({
      ...prev,
      [qId]: optionLabel
    }));
  };

  const handleNext = () => {
    if (!answers[mission.questions[currentIdx].id]) {
      alert("Silakan pilih salah satu jawaban terlebih dahulu.");
      return;
    }
    
    if (currentIdx < mission.questions.length - 1) {
      setCurrentIdx(currentIdx + 1);
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (currentIdx > 0) {
      setCurrentIdx(currentIdx - 1);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        alert("Sesi Anda telah berakhir. Silakan login kembali.");
        window.location.href = '/login';
        return;
      }

      const payload = {
        mission_id: id,
        group_number: mission.group_number,
        answers: Object.entries(answers).map(([qId, val]) => ({
          question_id: qId,
          selected_option: val
        }))
      };

      const res = await fetch('http://localhost:8000/api/quiz/submit', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || "Gagal mengirimkan jawaban kuis");
      }

      const apiResult = await res.json();

      // Map resultsDetails to structure expected by result/[id]
      const resultsDetails = apiResult.details.map(d => {
        const q = mission.questions.find(quest => quest.id === d.question_id);
        return {
          questionId: d.question_id,
          questionText: q ? q.question : "Pertanyaan",
          selectedAnswer: d.selected,
          correctAnswer: d.correct_answer,
          explanation: d.explanation,
          isCorrect: d.correct
        };
      });

      const resultId = `result-quiz-${Date.now()}`;
      const newResult = {
        id: resultId,
        type: "quiz",
        title: mission.title,
        score: apiResult.score,
        correctCount: apiResult.correct_count,
        totalQuestions: apiResult.total_questions,
        resultsDetails,
        coins: apiResult.coins_earned,
        exp: apiResult.exp_earned,
        ai_feedback: apiResult.ai_feedback,
        created_at: new Date().toISOString()
      };

      // Save to localStorage so that result/[id]/page.js can fetch it
      const quizHistory = JSON.parse(localStorage.getItem('quiz_results') || '[]');
      quizHistory.push(newResult);
      localStorage.setItem('quiz_results', JSON.stringify(quizHistory));

      // Also update mock_user in localStorage in case other pages still fall back to it
      const savedUser = localStorage.getItem('mock_user');
      if (savedUser) {
        const parsed = JSON.parse(savedUser);
        const updated = {
          ...parsed,
          coins: parsed.coins + apiResult.coins_earned,
          exp: parsed.exp + apiResult.exp_earned
        };
        if (updated.exp >= 1000) {
          updated.level += 1;
          updated.exp -= 1000;
        }
        localStorage.setItem('mock_user', JSON.stringify(updated));
      }

      // Redirect to the result page
      window.location.href = `/missions/result/${resultId}`;
    } catch (err) {
      console.error(err);
      alert(err.message || "Terjadi kesalahan jaringan saat mengirimkan kuis.");
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('mock_user');
    window.location.href = '/login';
  };

  const sidebarUser = user || { username: "Memuat...", level: 1, coins: 0, active_title: "" };

  const currentQuestion = mission?.questions?.[currentIdx] || { question: "", options: [] };
  const progressPercent = mission?.questions?.length ? ((currentIdx + 1) / mission.questions.length) * 100 : 0;

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

      {/* Main Content Area */}
      <main className={`flex-1 min-h-screen bg-background flex flex-col transition-all duration-300 ease-in-out ${isSidebarCollapsed ? 'md:ml-20' : 'md:ml-72'}`}>
        {/* Top App Bar */}
        <header className="flex justify-between items-center h-16 px-6 md:px-margin-desktop w-full border-b border-parchment-border bg-surface sticky top-0 z-10">
          <div className="flex items-center gap-2">
            {/* Mobile Drawer Toggle */}
            <button
              onClick={() => setIsMobileOpen(true)}
              className="md:hidden text-ink-muted hover:text-primary transition-colors cursor-pointer p-2 rounded-lg hover:bg-surface-container-high/60 active:scale-95 flex items-center justify-center"
              title="Buka Menu"
            >
              <span className="material-symbols-outlined text-xl block">side_navigation</span>
            </button>
            <h2 className="font-headline-lg text-xl font-bold text-primary">Kuis Interaktif</h2>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="font-label-mono text-label-mono text-on-surface font-bold">{sidebarUser.username}</p>
              <p className="font-label-mono text-[10px] text-ink-muted">Level {sidebarUser.level} {sidebarUser.active_title || 'Scholar'}</p>
            </div>
          </div>
        </header>

        {/* Quiz Content Container */}
        {loading || !user || !mission ? (
          <div className="flex-1 flex h-[400px] w-full items-center justify-center bg-background">
            <p className="font-label-mono text-ink-muted animate-pulse">Menyiapkan Ruang Kuis...</p>
          </div>
        ) : (
          <div className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 md:px-margin-desktop py-8 md:py-12">
          <div className="mb-12">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
              <div>
                <span className="font-label-mono text-label-mono text-primary bg-secondary-container/50 px-3 py-1 rounded-full border border-parchment-border">KUIS INTERAKTIF</span>
                <h3 className="font-headline-lg text-headline-lg text-ink-text mt-4 font-headline-lg">{mission.title}</h3>
              </div>
              <div className="text-right">
                <p className="font-label-mono text-label-mono text-ink-muted">PROGRESS</p>
                <p className="font-stats-lg text-stats-lg text-primary font-bold font-headline-lg">Soal {currentIdx + 1} <span className="text-ink-muted text-sm font-normal">dari {mission.questions.length}</span></p>
              </div>
            </div>
            <div className="w-full h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
              <div className="h-full bg-primary transition-all duration-500 ease-out" style={{ width: `${progressPercent}%` }}></div>
            </div>
          </div>

          {/* Question Card */}
          <section className="paper-texture bg-paper-surface border border-parchment-border rounded-xl p-6 md:p-12 mb-8 relative shadow-sm">
            <div className="absolute top-4 right-4 opacity-10">
              <span className="material-symbols-outlined text-6xl">school</span>
            </div>
            <div className="max-w-3xl">
              <p className="font-label-mono text-xs text-ink-muted mb-6 tracking-widest uppercase">Pertanyaan Multiple Choice</p>
              <h4 className="font-headline-lg text-2xl md:text-3xl text-ink-text leading-snug italic font-headline-lg">
                &quot;{currentQuestion.question}&quot;
              </h4>
            </div>
          </section>

          {/* Options Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12">
            {currentQuestion.options.map((option) => {
              const isSelected = answers[currentQuestion.id] === option.label;
              return (
                <button
                  key={option.label}
                  onClick={() => handleSelectOption(currentQuestion.id, option.label)}
                  className={`group flex items-start gap-4 p-6 bg-paper-surface border rounded-lg text-left transition-all duration-200 cursor-pointer ${
                    isSelected
                      ? 'bg-[#ece2cc] border-primary shadow-sm'
                      : 'border-parchment-border hover:bg-[#ece5d8] hover:border-primary/40'
                  }`}
                >
                  <span className={`flex-shrink-0 w-10 h-10 flex items-center justify-center border rounded-full font-label-mono font-bold transition-colors ${
                    isSelected
                      ? 'bg-primary text-white border-primary'
                      : 'border-parchment-border text-ink-muted group-hover:bg-primary group-hover:text-white'
                  }`}>
                    {option.label}
                  </span>
                  <span className="font-body-lg text-ink-text pt-1 font-body-lg">{option.text}</span>
                </button>
              );
            })}
          </div>

          {/* Footer Navigation */}
          <div className="flex items-center justify-between pt-8 border-t border-parchment-border">
            <button
              onClick={handleBack}
              disabled={currentIdx === 0}
              className="flex items-center gap-2 px-6 py-3 border border-primary text-primary font-headline-lg text-sm rounded transition-all hover:bg-secondary-container disabled:opacity-30 disabled:pointer-events-none cursor-pointer font-bold"
            >
              <span className="material-symbols-outlined">arrow_back</span>
              SEBELUMNYA
            </button>
            <button
              onClick={handleNext}
              className="flex items-center gap-2 px-8 py-3 bg-primary text-white font-headline-lg text-sm rounded shadow-sm transition-all hover:opacity-95 active:scale-95 cursor-pointer font-bold"
            >
              {currentIdx === mission.questions.length - 1 ? 'KIRIM JAWABAN' : 'SELANJUTNYA'}
              <span className="material-symbols-outlined">arrow_forward</span>
            </button>
          </div>
        </div>
        )}
      </main>
    </div>
  );
}
