"use client";

import { masks, type MaskName } from "@/lib/masks";
import type { ReactNode, Ref } from "react";
import { IMaskInput } from "react-imask";
import Field, { fieldControlClassName } from "./field";

interface Props {
  label: string;
  mask: MaskName;
  value?: string;
  onChange?: (value: string) => void;
  onBlur?: () => void;
  name?: string;
  ref?: Ref<HTMLInputElement>;
  id?: string;
  error?: string;
  hint?: ReactNode;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export default function MaskedInput({
  label,
  mask,
  value,
  onChange,
  onBlur,
  name,
  ref,
  id,
  error,
  hint,
  placeholder,
  disabled,
  className = "",
}: Props) {
  return (
    <Field id={id} label={label} error={error} hint={hint}>
      {(control) => (
        <IMaskInput
          {...control}
          {...masks[mask]}
          unmask
          value={value ?? ""}
          onAccept={(unmasked: string) => onChange?.(unmasked)}
          onBlur={onBlur}
          name={name}
          inputRef={ref}
          type="text"
          inputMode="numeric"
          autoComplete="off"
          placeholder={placeholder}
          disabled={disabled}
          className={`${fieldControlClassName} ${className}`}
        />
      )}
    </Field>
  );
}
