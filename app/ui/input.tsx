import type { ComponentProps, ReactNode } from "react";
import Field, { fieldControlClassName } from "./field";

export type InputProps = ComponentProps<"input"> & {
  label: string;
  error?: string;
  hint?: ReactNode;
  /** Conteúdo exibido à direita do rótulo (ex.: link "Esqueceu sua senha?"). */
  labelAction?: ReactNode;
};

export default function Input({
  label,
  error,
  hint,
  labelAction,
  id,
  className = "",
  ...props
}: InputProps) {
  return (
    <Field
      id={id}
      label={label}
      error={error}
      hint={hint}
      labelAction={labelAction}
    >
      {(control) => (
        <input
          {...control}
          className={`${fieldControlClassName} ${className}`}
          {...props}
        />
      )}
    </Field>
  );
}
