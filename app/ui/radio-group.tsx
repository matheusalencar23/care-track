import { useId, type ReactNode, type Ref } from "react";

export interface RadioOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface Props {
  label: string;
  name: string;
  options: RadioOption[];
  value?: string;
  onChange?: (value: string) => void;
  onBlur?: () => void;
  ref?: Ref<HTMLInputElement>;
  error?: string;
  hint?: ReactNode;
  autoFocusFirst?: boolean;
}

export default function RadioGroup({
  label,
  name,
  options,
  value,
  onChange,
  onBlur,
  ref,
  error,
  hint,
  autoFocusFirst = false,
}: Props) {
  const id = useId();
  const legendId = `${id}-label`;
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const describedBy =
    [hint ? hintId : null, error ? errorId : null].filter(Boolean).join(" ") ||
    undefined;
  const firstEnabled = options.find((option) => !option.disabled)?.value;

  return (
    <fieldset
      role="radiogroup"
      aria-labelledby={legendId}
      aria-describedby={describedBy}
      aria-invalid={error ? true : undefined}
    >
      <legend id={legendId} className="mb-2 text-sm text-white">
        {label}
      </legend>

      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        {options.map((option) => (
          <label
            key={option.value}
            className={`flex flex-1 items-center gap-3 rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm text-white transition has-checked:border-blue-400 has-checked:bg-blue-800 has-checked:font-semibold focus-within:border-white focus-within:ring-2 focus-within:ring-white/30 sm:min-w-44 ${
              option.disabled
                ? "cursor-not-allowed opacity-50"
                : "cursor-pointer hover:bg-white/15"
            }`}
          >
            <input
              ref={option.value === firstEnabled ? ref : undefined}
              type="radio"
              name={name}
              value={option.value}
              checked={value === option.value}
              disabled={option.disabled}
              onChange={() => onChange?.(option.value)}
              onBlur={onBlur}
              data-autofocus={
                autoFocusFirst && option.value === firstEnabled
                  ? true
                  : undefined
              }
              className="h-4 w-4 shrink-0 scheme-dark accent-blue-800"
            />
            {option.label}
          </label>
        ))}
      </div>

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
    </fieldset>
  );
}
