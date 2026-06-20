'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';

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
    <div className="relative w-full h-full">
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

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const illustrationRef = useRef(null);

  const handleMouseMove = (e) => {
    if (!illustrationRef.current) return;
    const { clientWidth, clientHeight } = e.currentTarget;
    const x = (clientWidth / 2 - e.clientX) / 40;
    const y = (clientHeight / 2 - e.clientY) / 40;
    illustrationRef.current.style.transform = `scale(1.03) translate(${x}px, ${y}px)`;
  };

  const handleMouseLeave = () => {
    if (!illustrationRef.current) return;
    illustrationRef.current.style.transform = `scale(1) translate(0px, 0px)`;
  };

  const handleGoogleLogin = async () => {
    setErrorMsg('');
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/dashboard`
        }
      });
      if (error) {
        setErrorMsg("Gagal login dengan Google: " + error.message);
      }
    } catch (err) {
      setErrorMsg("Terjadi kesalahan sistem saat mencoba login Google.");
      console.error(err);
    }
  };

  return (
    <div className="bg-background text-ink-text font-body-md min-h-screen selection:bg-primary-fixed selection:text-on-primary-fixed overflow-x-hidden">
      <main className="flex flex-col lg:flex-row min-h-screen lg:h-screen w-screen bg-background text-ink-text font-body-md overflow-x-hidden lg:overflow-hidden">
      {/* Left Side: Authentication Form */}
      <section className="w-full lg:w-[45%] flex flex-col justify-start px-margin-mobile md:px-24 bg-surface relative z-10 paper-texture shadow-xl lg:border-r border-parchment-border min-h-screen lg:h-full overflow-y-auto py-12 lg:py-16">
        <div className="max-w-md w-full mx-auto space-y-10">
          {/* Back to Home Link */}
          <div className="no-print">
            <Link href="/" className="flex items-center gap-1.5 text-xs font-label-mono text-ink-muted hover:text-primary transition-colors hover:no-underline">
              <span className="material-symbols-outlined text-[16px]">arrow_back</span>
              <span>KEMBALI KE BERANDA</span>
            </Link>
          </div>

          {/* Brand Anchor */}
          <div className="flex items-center gap-3">
            <Link href="/" className="text-headline-lg font-headline-lg text-primary tracking-tight hover:no-underline">
              EduGacha
            </Link>
          </div>
          
          <div className="space-y-4">
            <h1 className="font-headline-lg text-headline-lg text-ink-text">Sign in to your account</h1>
            <p className="font-body-md text-body-md text-on-surface-variant">
              Enter your credentials below to continue your academic journey.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 pt-2">
            <button 
              onClick={handleGoogleLogin}
              className="flex items-center justify-center gap-3 w-full py-3.5 border border-parchment-border bg-white hover:bg-surface-container-high ink-transition rounded-lg cursor-pointer"
              type="button"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"></path>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"></path>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"></path>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"></path>
              </svg>
              <span className="font-label-mono text-ink-text text-sm">Lanjutkan dengan Google</span>
            </button>
          </div>

          <div className="relative py-2">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-parchment-border"></div>
            </div>
            <div className="relative flex justify-center text-label-mono">
              <span className="bg-surface px-4 text-outline uppercase tracking-widest text-[10px] font-bold">
                ATAU
              </span>
            </div>
          </div>

          <form className="space-y-5" onSubmit={async (e) => {
            e.preventDefault();
            setErrorMsg('');
            setSubmitting(true);
            const formData = new FormData(e.currentTarget);
            const email = formData.get('email');
            const password = formData.get('password');

            try {
              const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password
              });

              if (error) {
                setErrorMsg(error.message);
              } else if (data.session) {
                // Fetch profiles data
                const { data: profile } = await supabase
                  .table('profiles')
                  .select('*')
                  .eq('id', data.user.id)
                  .single();

                const userSession = {
                  id: data.user.id,
                  username: profile?.username || data.user.email.split('@')[0],
                  department: profile?.department || "Sastra Indonesia",
                  email: data.user.email,
                  coins: profile?.coins ?? 200,
                  level: profile?.level ?? 1,
                  exp: profile?.exp ?? 0,
                  pity_counter: profile?.pity_counter ?? 0,
                  active_title: profile?.active_title || "",
                  created_at: profile?.created_at || new Date().toISOString()
                };

                localStorage.setItem('mock_user', JSON.stringify(userSession));
                window.location.href = '/dashboard';
              }
            } catch (err) {
              setErrorMsg("Terjadi kesalahan koneksi saat login.");
              console.error(err);
            } finally {
              setSubmitting(false);
            }
          }}>
            {errorMsg && (
              <div className="bg-red-50 text-red-600 border border-red-200 p-4 rounded-lg text-xs font-label-mono">
                {errorMsg}
              </div>
            )}
            <div className="space-y-1.5">
              <label className="font-label-mono text-xs uppercase text-ink-muted" htmlFor="email">
                Email
              </label>
              <div className="relative transition-transform duration-300 focus-within:scale-[1.01]">
                <input
                  className="w-full bg-surface-container-low border border-parchment-border focus:outline-none focus:border-primary focus:ring-0 px-4 py-3 font-body-md placeholder:text-outline-variant/60 rounded-lg ink-transition"
                  id="email"
                  name="email"
                  placeholder="Masukkan email Anda"
                  type="email"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="font-label-mono text-xs uppercase text-ink-muted" htmlFor="password">
                  Password
                </label>
                <a className="text-xs text-primary hover:underline underline-offset-4 ink-transition" href="#">
                  Forgot?
                </a>
              </div>
              <div className="relative group transition-transform duration-300 focus-within:scale-[1.01]">
                <input
                  className="w-full bg-surface-container-low border border-parchment-border focus:outline-none focus:border-primary focus:ring-0 px-4 py-3 pr-12 font-body-md placeholder:text-outline-variant/60 rounded-lg ink-transition"
                  id="password"
                  name="password"
                  placeholder="Masukkan password Anda"
                  type={showPassword ? "text" : "password"}
                  required
                />
                <button
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted hover:text-primary transition-colors flex items-center"
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  <span className="material-symbols-outlined">
                    {showPassword ? "visibility_off" : "visibility"}
                  </span>
                </button>
              </div>
            </div>

            <button className="w-full py-3.5 bg-primary text-white font-label-mono text-sm uppercase rounded-lg hover:bg-on-primary-fixed-variant ink-transition transform active:scale-[0.98] shadow-md cursor-pointer font-bold mt-2" type="submit">
              Lanjutkan dengan email
            </button>
          </form>

          <p className="text-center text-xs font-body-md text-ink-muted/80 leading-normal">
            Dengan melanjutkan, Anda menyetujui Ketentuan Layanan dan{" "}
            <Link className="underline underline-offset-2 hover:text-primary transition-colors font-bold" href="#">
              Kebijakan Privasi
            </Link>{" "}
            EduGacha.
          </p>

          <p className="text-center font-body-md text-on-surface-variant pt-2">
            Don&apos;t have an account?{" "}
            <Link className="text-primary font-bold hover:underline underline-offset-4 ink-transition" href="/register">
              Sign up
            </Link>
          </p>
        </div>


      </section>

      {/* Right Side: Immersive Sequential Video Player (Uncropped) */}
      <section
        className="hidden lg:block lg:w-[55%] relative overflow-hidden bg-surface-container h-full"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        {/* Parallax Wrapper preserving 16:9 Video Aspect Ratio (Uncropped) */}
        <div
          ref={illustrationRef}
          className="absolute inset-0 w-full h-full flex items-center justify-center p-16 transition-transform duration-300 ease-out bg-surface-container"
        >
          <div className="w-full max-w-2xl aspect-video rounded-xl overflow-hidden border border-parchment-border ink-drop-shadow bg-black">
            <UnifiedVideoPlayer />
          </div>
        </div>

        <div className="absolute inset-0 bg-gradient-to-l from-transparent via-surface-container/20 to-surface/40 pointer-events-none z-15"></div>

        {/* Subtle Texture Overlays */}
        <div
          className="absolute inset-0 pointer-events-none z-10"
          style={{ background: "radial-gradient(circle at center, transparent 0%, rgba(74, 63, 53, 0.05) 100%)" }}
        ></div>
      </section>
    </main>

    {/* Mobile Footer */}
    <footer className="lg:hidden bg-surface-container-high py-8 px-margin-mobile border-t border-parchment-border">
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="text-headline-lg font-headline-lg text-primary tracking-tight">EduGacha</div>

        <div className="flex gap-4">
          <a className="font-label-mono text-label-mono text-primary underline text-xs" href="#">
            Terms
          </a>
          <a className="font-label-mono text-label-mono text-primary underline text-xs" href="#">
            Privacy
          </a>
        </div>
      </div>
    </footer>
  </div>
);
}
