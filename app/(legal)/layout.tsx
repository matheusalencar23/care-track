import LegalLinks from "@/app/ui/legal-links";
import Image from "next/image";
import Link from "next/link";
import logo from "../../public/logo.png";

export default function LegalLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-white/10 bg-white/10 px-4 py-2 backdrop-blur-2xl sm:px-6">
        <Link href="/" className="inline-flex items-center gap-1.5">
          <Image src={logo} alt="" className="w-10 sm:w-12" preload />
          <span className="text-xl font-semibold text-white">
            Care<span className="text-teal-300">Track</span>
          </span>
        </Link>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:px-6 sm:py-12">
        <div className="rounded-3xl border border-white/10 bg-slate-900/60 p-6 shadow-2xl backdrop-blur-2xl sm:p-10">
          {children}
        </div>
      </main>

      <footer className="px-4 pb-8">
        <LegalLinks />
      </footer>
    </div>
  );
}
