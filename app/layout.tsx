import type { Metadata } from "next";
import "./globals.css";
import { inter } from "./ui/fonts";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "CareTrack",
  description: "Aplicação para acompanhamento de pacientes",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt" className={`${inter.className}`}>
      <body className="relative min-h-screen overflow-hidden bg-slate-950">
        <Providers>
          <div className="absolute inset-0 bg-linear-to-br from-blue-900 via-blue-800 to-teal-700" />
          <div className="absolute -left-40 top-20 h-96 w-96 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute right-0 top-0 h-125 w-125 rounded-full bg-teal-400/20 blur-3xl" />
          {children}
        </Providers>
      </body>
    </html>
  );
}
