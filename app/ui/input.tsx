import { useId, type ComponentProps, type ReactNode } from "react";

type Props = ComponentProps<"input"> & {
  label: string;
  error?: string;
  /** Conteúdo exibido à direita do rótulo (ex.: link "Esqueceu sua senha?"). */
  labelAction?: ReactNode;
};

export default function Input({
  label,
  error,
  labelAction,
  id,
  className = "",
  ...props
}: Props) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const errorId = `${inputId}-error`;

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <label htmlFor={inputId} className="text-sm text-white">
          {label}
        </label>

        {labelAction}
      </div>

      <input
        id={inputId}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        className={`w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-white placeholder:text-slate-300 outline-none transition focus:border-white focus:ring-2 focus:ring-white/30 aria-invalid:border-danger-400 ${className}`}
        {...props}
      />

      {error && (
        <p id={errorId} className="mt-2 text-sm text-danger-400">
          {error}
        </p>
      )}
    </div>
  );
}
