'use client';

import { useState, useEffect } from 'react';

const steps = [
  {
    targetId: 'onboarding-checkin',
    title: 'Presensi Harian',
    text: 'Lakukan absen harian di sini untuk menjaga streak belajarmu dan mendapatkan tiket Gacha Epic!',
    position: 'bottom'
  },
  {
    targetId: 'onboarding-missions',
    title: 'Misi Hari Ini',
    text: 'Pusat tantangan harian Anda. Kerjakan latihan esai dan kuis di sini untuk mengumpulkan koin emas.',
    position: 'top'
  },
  {
    targetId: 'onboarding-stats',
    title: 'Statistik Cendekia',
    text: 'Perhatikan total koin emas, level pangkat, dan counter pity SSR Anda di panel statistik.',
    position: 'bottom'
  },
  {
    targetId: 'onboarding-sidebar-gacha',
    title: 'Menu Navigasi Gacha',
    text: 'Gunakan navigasi menu ini untuk membuka mesin Gacha dan berburu kartu cendekia legendaris!',
    position: 'right'
  },
  {
    targetId: 'onboarding-newbie-quests',
    title: 'Misi Pemula Cendekia',
    text: 'Ini adalah daftar misi khusus pemula. Selesaikan presensi harian, kuis/esai pertama, dan tarik gacha perdana Anda untuk mengklaim hadiah awal!',
    position: 'top'
  }
];

export default function OnboardingTour({ user, onComplete }) {
  // -1 = Welcome Modal, 0..3 = Step Tour, null = Hidden
  const [step, setStep] = useState(-1);
  const [tooltipStyle, setTooltipStyle] = useState({});

  useEffect(() => {
    if (step < 0 || step >= steps.length) {
      // Reset highlighted element styles
      const activeElements = document.querySelectorAll('.onboarding-highlight');
      activeElements.forEach(el => el.classList.remove('onboarding-highlight'));
      
      if (step >= steps.length) {
        setTimeout(() => {
          setStep(null);
          if (onComplete) onComplete();
        }, 0);
      }
      return;
    }

    const activeStep = steps[step];
    const target = document.getElementById(activeStep.targetId);

    if (!target) {
      // Fallback to next step if target element is not found on page
      setTimeout(() => {
        setStep(prev => prev + 1);
      }, 0);
      return;
    }

    // Add highlight class
    const activeElements = document.querySelectorAll('.onboarding-highlight');
    activeElements.forEach(el => el.classList.remove('onboarding-highlight'));
    target.classList.add('onboarding-highlight');
    target.scrollIntoView({ behavior: 'smooth', block: 'center' });

    // Calculate tooltip position
    const rect = target.getBoundingClientRect();
    const scrollY = window.scrollY;
    const scrollX = window.scrollX;

    let top = 0;
    let left = 0;
    const offset = 12;

    switch (activeStep.position) {
      case 'bottom':
        top = rect.bottom + offset;
        left = rect.left + (rect.width / 2) - 130;
        break;
      case 'top':
        top = rect.top - 140 - offset;
        left = rect.left + (rect.width / 2) - 130;
        break;
      case 'right':
        top = rect.top + (rect.height / 2) - 60;
        left = rect.right + offset;
        break;
      case 'left':
        top = rect.top + (rect.height / 2) - 60;
        left = rect.left - 280 - offset;
        break;
      default:
        break;
    }

    setTimeout(() => {
      setTooltipStyle({
        position: 'absolute',
        top: `${Math.max(top, 10)}px`,
        left: `${Math.max(left, 10)}px`,
        zIndex: 10005,
        width: '280px',
        pointerEvents: 'auto'
      });
    }, 0);
  }, [step, onComplete]);

  if (step === null) return null;

  return (
    <>
      {/* Blocker: sits below the highlighted element (z-index 10001) but above the page */}
      <div style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: step === -1 ? 'rgba(0,0,0,0.5)' : 'transparent',
        zIndex: 10000,
        pointerEvents: 'auto'
      }} />
      
      {/* Overlay: sits above everything including the highlighted element's shadow */}
      <div className="onboarding-overlay" style={{
        position: 'fixed',
        inset: 0,
        zIndex: 10005,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        pointerEvents: 'none'
      }}>
      <style dangerouslySetInnerHTML={{ __html: `
        .onboarding-highlight {
          position: relative !important;
          z-index: 10001 !important;
          box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.6) !important;
          pointer-events: none !important;
          border-radius: 12px;
        }
        .parchment-tooltip {
          background: #fdfaf2;
          border: 2px solid #8c6d3f;
          border-radius: 12px;
          padding: 1.25rem;
          box-shadow: 0 10px 25px rgba(0,0,0,0.25);
          font-family: inherit;
          color: #5d4037;
        }
      `}} />

      {/* Step -1: Welcome Modal (NO ICONS / NO EMOJIS) */}
      {step === -1 && (
        <div className="parchment-tooltip" style={{ maxWidth: '420px', textAlign: 'center', margin: '20px', pointerEvents: 'auto' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#8c6d3f', marginBottom: '0.75rem' }}>
            Selamat Datang di Dunia Cendekia EduGacha
          </h3>
          <p style={{ fontSize: '0.85rem', lineHeight: '1.5', marginBottom: '1.25rem', color: '#5d4037' }}>
            EduGacha menggabungkan aktivitas belajar menulis esai dan kuis dengan elemen permainan gacha. Kirim esai Anda, dapatkan evaluasi AI instan, kumpulkan koin emas, dan gunakan koin tersebut untuk menarik kartu cendekia legendaris di mesin Gacha.
          </p>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
            <button
              onClick={() => setStep(0)}
              className="hover:scale-105 transition-all"
              style={{
                background: '#ffb300',
                color: '#3e2723',
                border: 'none',
                padding: '0.5rem 1.25rem',
                borderRadius: '8px',
                fontWeight: 'bold',
                cursor: 'pointer',
                fontSize: '0.8rem'
              }}
            >
              Mulai Tur Panduan
            </button>
            <button
              onClick={() => {
                setStep(null);
                if (onComplete) onComplete();
              }}
              className="hover:bg-gray-100 transition-all"
              style={{
                background: 'transparent',
                color: '#8c6d3f',
                border: '1px solid #8c6d3f',
                padding: '0.5rem 1.25rem',
                borderRadius: '8px',
                fontWeight: 'bold',
                cursor: 'pointer',
                fontSize: '0.8rem'
              }}
            >
              Lewati Panduan
            </button>
          </div>
        </div>
      )}

      {/* Steps 0..3: Tooltips */}
      {step >= 0 && step < steps.length && (
        <div className="parchment-tooltip onboarding-tooltip-step" style={tooltipStyle}>
          <div style={{ fontSize: '0.7rem', fontWeight: 'bold', color: '#ffb300', marginBottom: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Langkah {step + 1} dari {steps.length}
          </div>
          <h4 style={{ fontSize: '0.95rem', fontWeight: 'bold', color: '#8c6d3f', marginBottom: '0.35rem' }}>
            {steps[step].title}
          </h4>
          <p style={{ fontSize: '0.8rem', lineHeight: '1.4', marginBottom: '0.75rem', color: '#5d4037' }}>
            {steps[step].text}
          </p>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <button
              onClick={() => {
                setStep(null);
                if (onComplete) onComplete();
              }}
              style={{ background: 'none', border: 'none', color: '#a1887f', fontSize: '0.75rem', cursor: 'pointer', textDecoration: 'underline' }}
            >
              Lewati
            </button>
            <div style={{ display: 'flex', gap: '8px' }}>
              {step > 0 && (
                <button
                  onClick={() => setStep(prev => prev - 1)}
                  style={{ background: 'transparent', border: '1px solid #8c6d3f', color: '#8c6d3f', padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', cursor: 'pointer' }}
                >
                  Kembali
                  </button>
              )}
              <button
                onClick={() => {
                  if (step === steps.length - 1) {
                    setStep(null);
                    if (onComplete) onComplete();
                  } else {
                    setStep(prev => prev + 1);
                  }
                }}
                style={{ background: '#ffb300', border: 'none', color: '#3e2723', padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold', cursor: 'pointer' }}
              >
                {step === steps.length - 1 ? 'Selesai' : 'Lanjut'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </>
  );
}
