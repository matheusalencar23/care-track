import Image from "next/image";
import logo from "../public/logo.png";
import Link from "next/link";

export default function Home() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-950">
      {/* Background */}
      <div className="absolute inset-0 bg-linear-to-br from-caretrack-blue-700 via-caretrack-blue-600 to-caretrack-teal-500" />

      <div className="absolute -left-40 top-20 h-96 w-96 rounded-full bg-white/10 blur-3xl" />
      <div className="absolute right-0 top-0 h-125 w-125 rounded-full bg-caretrack-teal-400/20 blur-3xl" />

      {/* Content */}
      <section className="relative mx-auto flex min-h-screen max-w-7xl items-center p-6">
        <div className="grid w-full items-center gap-16 lg:grid-cols-1">
          {/* Left */}
          <div>
            <Image src={logo} alt="Logo" className="w-75 mb-6" />
            <span className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm text-white backdrop-blur">
              Acompanhar &middot; Cuidar &middot; Transformar
            </span>

            <h1 className="mt-8 text-6xl font-bold leading-tight text-white">
              Acompanhe a evolução dos seus pacientes com mais organização.
            </h1>

            <p className="mt-6 max-w-3xl text-lg text-slate-200">
              O CareTrack centraliza informações clínicas, registros de evolução
              e acompanhamento multidisciplinar em uma única plataforma moderna
              e intuitiva.
            </p>

            <div className="mt-10 flex gap-4">
              <Link
                href="/login"
                className="rounded-xl bg-white px-8 py-4 font-semibold text-caretrack-blue-700 transition hover:scale-105"
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
