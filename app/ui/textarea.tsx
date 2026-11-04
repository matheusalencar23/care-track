import type { ComponentProps, ReactNode } from "react";
import Field, { fieldControlClassName } from "./field";

type Props = ComponentProps<"textarea"> & {
  label: string;
  error?: string;
  hint?: ReactNode;
};

export default function Textarea({
  label,
  error,
  hint,
  id,
  rows = 4,
  className = "",
  ...props
}: Props) {
  return (
    <Field id={id} label={label} error={error} hint={hint}>
      {(control) => (
        <textarea
          {...control}
          rows={rows}
          className={`${fieldControlClassName} resize-y ${className}`}
          {...props}
        />
      )}
    </Field>
  );
}
