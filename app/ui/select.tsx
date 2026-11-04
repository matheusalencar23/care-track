import type { ComponentProps, ReactNode } from "react";
import Field, { fieldControlClassName } from "./field";

type Props = ComponentProps<"select"> & {
  label: string;
  error?: string;
  hint?: ReactNode;
};

export default function Select({
  label,
  error,
  hint,
  id,
  className = "",
  children,
  ...props
}: Props) {
  return (
    <Field id={id} label={label} error={error} hint={hint}>
      {(control) => (
        <select
          {...control}
          className={`${fieldControlClassName} cursor-pointer [&>option]:text-slate-900 ${className}`}
          {...props}
        >
          {children}
        </select>
      )}
    </Field>
  );
}
