import { useId, type ComponentProps } from "react";

type Props = ComponentProps<"select"> & {
  label: string;
  error?: string;
};

export default function Select({
  label,
  error,
  id,
  className = "",
  children,
  ...props
}: Props) {
  const generatedId = useId();
  const selectId = id ?? generatedId;
  const errorId = `${selectId}-error`;

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <label htmlFor={selectId} className="text-sm text-white">
          {label}
        </label>
      </div>

      <select
        id={selectId}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        className={`w-full cursor-pointer rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-white outline-none transition focus:border-white focus:ring-2 focus:ring-white/30 aria-invalid:border-danger-400 [&>option]:text-slate-900 ${className}`}
        {...props}
      >
        {children}
      </select>

      {error && (
        <p id={errorId} className="mt-2 text-sm text-danger-400">
          {error}
        </p>
      )}
    </div>
  );
}
