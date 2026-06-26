import type { Metadata } from "next";
import "./globals.css";
import { inter } from "./ui/fonts";

export const metadata: Metadata = {
  title: "Care Track",
  description: "Aplicação para acompanhamento de pacientes",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt" className={`${inter.className}`}>
      <body>{children}</body>
    </html>
  );
}
