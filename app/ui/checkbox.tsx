import { useId, type ComponentProps, type ReactNode } from "react";

type Props = Omit<ComponentProps<"input">, "type"> & {
  label: ReactNode;
  error?: string;
};

export default function Checkbox({ label, error, id, className = "", ...props }: Props) {
  const generatedId = useId();
  const controlId = id ?? generatedId;
  const errorId = `${controlId}-error`;

  return (
    <div>
      <div className="flex items-start gap-3">
        <input
          id={controlId}
          type="checkbox"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          className={`mt-0.5 size-5 shrink-0 cursor-pointer accent-blue-800 ${className}`}
          {...props}
        />

        <label htmlFor={controlId} className="text-sm text-slate-200">
          {label}
        </label>
      </div>

      {error && (
        <p id={errorId} className="mt-2 text-sm text-danger-400">
          {error}
        </p>
      )}
    </div>
  );
}
