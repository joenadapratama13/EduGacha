import Link from 'next/link';

export default function Navbar() {
  return (
    <nav className="fixed top-0 w-full z-50 border-b border-parchment-border bg-surface/95 backdrop-blur-sm">
      <div className="flex justify-between items-center h-20 px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto w-full">
        <Link href="/" className="text-headline-lg text-primary tracking-tight font-bold hover:no-underline">
          EduGacha
        </Link>
        <div className="hidden md:flex gap-gutter items-center">
          <Link href="/" className="text-primary font-bold border-b-2 border-primary text-label-mono hover:no-underline">
            Home
          </Link>
          <a href="#how-it-works" className="text-on-surface-variant hover:text-primary transition-colors duration-200 text-label-mono hover:no-underline">
            Methodology
          </a>
          <a href="#rewards" className="text-on-surface-variant hover:text-primary transition-colors duration-200 text-label-mono hover:no-underline">
            Rewards
          </a>
          <a href="#faq" className="text-on-surface-variant hover:text-primary transition-colors duration-200 text-label-mono hover:no-underline">
            Community
          </a>
        </div>
        <div className="flex gap-4 items-center">
          <Link href="/login" className="px-6 py-2 border border-primary text-primary text-sm hover:bg-surface-container-low transition-all duration-200 rounded-lg font-bold hover:no-underline">
            Login
          </Link>
          <Link href="/register" className="px-6 py-2 bg-primary text-white text-sm hover:opacity-90 transition-all duration-200 shadow-sm active:scale-95 rounded-lg hover:scale-105 font-bold hover:no-underline">
            Register
          </Link>
        </div>
      </div>
    </nav>
  );
}
