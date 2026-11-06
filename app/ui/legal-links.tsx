import Link from "next/link";

interface Props {
  className?: string;
}

export default function LegalLinks({ className = "" }: Props) {
  return (
    <nav aria-label="Documentos legais" className={className}>
      <ul className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-sm text-slate-300">
        <li>
          <Link href="/termos" className="hover:text-white hover:underline">
            Termos de Uso
          </Link>
        </li>
        <li>
          <Link href="/privacidade" className="hover:text-white hover:underline">
            Política de Privacidade
          </Link>
        </li>
      </ul>
    </nav>
  );
}
