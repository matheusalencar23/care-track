"use client";

import { useState } from "react";
import { FaEye, FaEyeSlash } from "react-icons/fa";

interface Props {
  label: string;
  value: string;
  masked: string;
}

export default function SensitiveValue({ label, value, masked }: Props) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <span className="inline-flex items-center gap-2">
      <span className="font-mono">{isVisible ? value : masked}</span>
      <button
        type="button"
        onClick={() => setIsVisible((visible) => !visible)}
        aria-pressed={isVisible}
        aria-label={`Mostrar ${label}`}
        className="cursor-pointer rounded-lg p-1.5 text-slate-300 transition hover:bg-white/10 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
      >
        {isVisible ? <FaEyeSlash aria-hidden /> : <FaEye aria-hidden />}
      </button>
    </span>
  );
}
