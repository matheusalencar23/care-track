import type { ReactNode } from "react";
import type { IconType } from "react-icons";

interface Props {
  title: string;
  description?: ReactNode;
  icon?: IconType;
  action?: ReactNode;
}

export default function EmptyState({
  title,
  description,
  icon: Icon,
  action,
}: Props) {
  return (
    <div className="flex flex-col items-center rounded-3xl border border-white/10 bg-white/10 px-6 py-12 text-center shadow-2xl backdrop-blur-2xl">
      {Icon && (
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-white/10 text-2xl text-teal-200">
          <Icon aria-hidden />
        </div>
      )}

      <h2 className="text-lg font-semibold text-white">{title}</h2>

      {description && (
        <p className="mt-2 max-w-md text-sm text-slate-300">{description}</p>
      )}

      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
