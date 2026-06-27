import Image from "next/image";
import logo from "../public/logo.png";
import Link from "next/link";

export default function Home() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-950">
      {/* Background */}
      <div className="absolute inset-0 bg-linear-to-br from-blue-900 via-blue-800 to-teal-700" />

      <div className="absolute -left-40 top-20 h-96 w-96 rounded-full bg-white/10 blur-3xl" />
      <div className="absolute right-0 top-0 h-125 w-125 rounded-full bg-teal-400/20 blur-3xl" />

      {/* Content */}
      <section className="relative mx-auto flex min-h-screen max-w-7xl items-center p-6">
        <div className="grid w-full items-center gap-16 lg:grid-cols-1">
          {/* Left */}
          <div>
            <div className="flex items-center gap-8 flex-col md:flex-row mb-6">
              <Image src={logo} alt="Logo" className="w-75" loading="eager" />
              <h1 className="text-8xl font-bold text-blue-600">
                Care<span className="text-teal-600">Track</span>
              </h1>
            </div>
            <span className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm text-white backdrop-blur">
              Acompanhar &middot; Cuidar &middot; Transformar
            </span>

            <h1 className="mt-6 text-5xl font-bold leading-tight text-white">
              Acompanhe a evolução dos seus pacientes com mais organização.
            </h1>

            <p className="mt-4 max-w-3xl text-lg text-slate-200">
              O CareTrack centraliza informações clínicas, registros de evolução
              e acompanhamento multidisciplinar em uma única plataforma moderna
              e intuitiva.
            </p>

            <div className="mt-10 flex gap-4">
              <Link
                href="/login"
                className="rounded-xl bg-white px-8 py-4 font-semibold text-blue-700 transition hover:scale-105"
              >
                Começar Agora
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
