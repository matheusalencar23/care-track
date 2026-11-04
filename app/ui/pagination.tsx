import { FaChevronLeft, FaChevronRight } from "react-icons/fa";

interface Props {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  disabled?: boolean;
}

type PageItem = number | "ellipsis-start" | "ellipsis-end";

function pageItems(page: number, totalPages: number): PageItem[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const start = Math.max(2, Math.min(page - 1, totalPages - 4));
  const end = Math.min(totalPages - 1, Math.max(page + 1, 5));
  const middle = Array.from(
    { length: end - start + 1 },
    (_, index) => start + index,
  );

  return [
    1,
    ...(start > 2 ? (["ellipsis-start"] as const) : []),
    ...middle,
    ...(end < totalPages - 1 ? (["ellipsis-end"] as const) : []),
    totalPages,
  ];
}

const itemClassName =
  "flex h-10 min-w-10 items-center justify-center rounded-xl px-3 text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40 disabled:cursor-not-allowed disabled:opacity-40";

export default function Pagination({
  page,
  totalPages,
  onPageChange,
  disabled = false,
}: Props) {
  if (totalPages <= 1) {
    return null;
  }

  return (
    <nav
      aria-label="Paginação"
      className="flex flex-wrap items-center justify-center gap-1 text-white"
    >
      <button
        type="button"
        onClick={() => onPageChange(page - 1)}
        disabled={disabled || page <= 1}
        aria-label="Página anterior"
        className={`${itemClassName} cursor-pointer hover:bg-white/10`}
      >
        <FaChevronLeft aria-hidden className="text-xs" />
      </button>

      <p className="px-2 text-sm text-slate-200 sm:hidden">
        Página {page} de {totalPages}
      </p>

      <ul className="hidden items-center gap-1 sm:flex">
        {pageItems(page, totalPages).map((item) =>
          typeof item === "number" ? (
            <li key={item}>
              <button
                type="button"
                onClick={() => onPageChange(item)}
                disabled={disabled}
                aria-label={`Página ${item}`}
                aria-current={item === page ? "page" : undefined}
                className={`${itemClassName} cursor-pointer ${
                  item === page
                    ? "bg-white text-blue-700"
                    : "hover:bg-white/10"
                }`}
              >
                {item}
              </button>
            </li>
          ) : (
            <li key={item} aria-hidden className="px-1 text-slate-300">
              …
            </li>
          ),
        )}
      </ul>

      <button
        type="button"
        onClick={() => onPageChange(page + 1)}
        disabled={disabled || page >= totalPages}
        aria-label="Próxima página"
        className={`${itemClassName} cursor-pointer hover:bg-white/10`}
      >
        <FaChevronRight aria-hidden className="text-xs" />
      </button>
    </nav>
  );
}
