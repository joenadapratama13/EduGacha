import "./globals.css";

export const metadata = {
  title: "EduGacha | Academic Excellence through Play",
  description: "Platform E-Learning Cerdas dengan Hybrid NLP-Generative AI dan Algoritma Pity System untuk Siklus Penghargaan Belajar yang Adil dan Interaktif.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="id" className="scroll-smooth" suppressHydrationWarning={true}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&family=Lora:ital,wght@0,400..700;1,400..700&family=IBM+Plex+Mono:wght@400;500;600&family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
      </head>
      <body suppressHydrationWarning={true}>{children}</body>
    </html>
  );
}
