import { TERMS_UPDATED_AT } from "@/lib/legal";
import type { ReactNode } from "react";

interface DocumentProps {
  title: string;
  children: ReactNode;
}

export function LegalDocument({ title, children }: DocumentProps) {
  return (
    <article className="space-y-8 text-slate-200">
      <header>
        <h1 className="text-3xl font-bold text-white sm:text-4xl">{title}</h1>
        <p className="mt-2 text-sm text-slate-300">
          Última atualização: {TERMS_UPDATED_AT}
        </p>
      </header>

      {children}
    </article>
  );
}

interface SectionProps {
  id: string;
  title: string;
  children: ReactNode;
}

export function LegalSection({ id, title, children }: SectionProps) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-title`}
      className="scroll-mt-24 space-y-3 leading-relaxed"
    >
      <h2 id={`${id}-title`} className="text-xl font-semibold text-white">
        {title}
      </h2>

      {children}
    </section>
  );
}

export function LegalList({ children }: { children: ReactNode }) {
  return <ul className="list-disc space-y-2 pl-6 marker:text-teal-400">{children}</ul>;
}

export function LegalTable({
  headers,
  rows,
}: {
  headers: string[];
  rows: ReactNode[][];
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/10">
      <table className="w-full text-left text-sm">
        <thead className="sr-only bg-white/10 text-white sm:not-sr-only">
          <tr>
            {headers.map((header) => (
              <th key={header} scope="col" className="px-4 py-3 font-semibold">
                {header}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {rows.map((row, rowIndex) => (
            <tr
              key={rowIndex}
              className="block border-t border-white/10 py-2 align-top first:border-t-0 sm:table-row sm:py-0 sm:first:border-t"
            >
              {row.map((cell, cellIndex) => (
                <td
                  key={cellIndex}
                  data-label={headers[cellIndex]}
                  className="block px-4 py-1.5 before:block before:text-xs before:font-semibold before:text-slate-400 before:content-[attr(data-label)] sm:table-cell sm:py-3 sm:before:content-none"
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
