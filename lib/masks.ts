import { IMask } from "react-imask";

export const masks = {
  cpf: { mask: "000.000.000-00" },
  cns: { mask: "000 0000 0000 0000" },
  phone: { mask: [{ mask: "(00) 0000-0000" }, { mask: "(00) 00000-0000" }] },
};

export type MaskName = keyof typeof masks;

export function onlyDigits(value: string) {
  return value.replace(/\D/g, "");
}

export function formatWithMask(name: MaskName, value: string) {
  return IMask.pipe(value, masks[name]);
}

function cpfCheckDigit(digits: number[]) {
  const sum = digits.reduce(
    (total, digit, index) => total + digit * (digits.length + 1 - index),
    0,
  );
  const remainder = (sum * 10) % 11;

  return remainder === 10 ? 0 : remainder;
}

export function isValidCpf(value: string) {
  const cpf = onlyDigits(value);

  if (!/^\d{11}$/.test(cpf) || /^(\d)\1{10}$/.test(cpf)) {
    return false;
  }

  const digits = [...cpf].map(Number);

  return (
    cpfCheckDigit(digits.slice(0, 9)) === digits[9] &&
    cpfCheckDigit(digits.slice(0, 10)) === digits[10]
  );
}

export function maskCpf(value: string) {
  const cpf = onlyDigits(value);

  if (cpf.length !== 11) {
    return "***.***.***-**";
  }

  return `***.${cpf.slice(3, 6)}.${cpf.slice(6, 9)}-**`;
}

export function normalizeSearch(value: string) {
  const term = value.trim().replace(/\s+/g, " ");

  if (/\d/.test(term) && /^[\d.\-/ ]+$/.test(term)) {
    return onlyDigits(term);
  }

  return term;
}
