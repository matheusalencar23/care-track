import Link from "next/link";
import { FaChevronLeft } from "react-icons/fa";

interface Props {
  href: string;
  children: React.ReactNode;
}

export default function BackLink({ href, children }: Props) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-2 text-sm text-slate-300 transition hover:text-white"
    >
      <FaChevronLeft aria-hidden className="text-xs" />
      {children}
    </Link>
  );
}
