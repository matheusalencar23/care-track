import { useId, type ReactNode } from "react";

interface FieldControlProps {
  id: string;
  "aria-invalid"?: true;
  "aria-describedby"?: string;
}

interface Props {
  id?: string;
  label: string;
  hint?: ReactNode;
  error?: string;
  labelAction?: ReactNode;
  children: (control: FieldControlProps) => ReactNode;
}

export const fieldControlClassName =
  "w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-white placeholder:text-slate-300 outline-none transition focus:border-white focus:ring-2 focus:ring-white/30 aria-invalid:border-danger-400";

export default function Field({
  id,
  label,
  hint,
  error,
  labelAction,
  children,
}: Props) {
  const generatedId = useId();
  const controlId = id ?? generatedId;
  const hintId = `${controlId}-hint`;
  const errorId = `${controlId}-error`;

  const describedBy =
    [hint ? hintId : null, error ? errorId : null].filter(Boolean).join(" ") ||
    undefined;

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-2">
        <label htmlFor={controlId} className="text-sm text-white">
          {label}
        </label>

        {labelAction}
      </div>

      {children({
        id: controlId,
        "aria-invalid": error ? true : undefined,
        "aria-describedby": describedBy,
      })}

      {hint && (
        <p id={hintId} className="mt-2 text-xs text-slate-300">
          {hint}
        </p>
      )}

      {error && (
        <p id={errorId} className="mt-2 text-sm text-danger-400">
          {error}
        </p>
      )}
    </div>
  );
}
