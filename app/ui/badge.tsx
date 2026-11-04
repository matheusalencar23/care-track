import type { ReactNode } from "react";

type Tone = "neutral" | "info" | "success" | "warning" | "danger";

interface Props {
  tone?: Tone;
  children: ReactNode;
}

const toneClassNames: Record<Tone, string> = {
  neutral: "border-white/20 bg-white/10 text-slate-100",
  info: "border-teal-300/30 bg-teal-400/15 text-teal-100",
  success: "border-success-400/30 bg-success-500/15 text-success-400",
  warning: "border-warning-400/30 bg-warning-500/15 text-warning-400",
  danger: "border-danger-400/30 bg-danger-500/15 text-danger-400",
};

export default function Badge({ tone = "neutral", children }: Props) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${toneClassNames[tone]}`}
    >
      {children}
    </span>
  );
}
