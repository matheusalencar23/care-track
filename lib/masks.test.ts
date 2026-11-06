import { describe, expect, it } from "vitest";
import { formatWithMask, isValidCpf, maskCpf, normalizeSearch, onlyDigits } from "./masks";

describe("onlyDigits", () => {
  it("remove tudo que não é dígito", () => {
    expect(onlyDigits("529.982.247-25")).toBe("52998224725");
    expect(onlyDigits("(11) 98765-4321")).toBe("11987654321");
  });
});

describe("formatWithMask", () => {
  it("formata CPF e Cartão SUS", () => {
    expect(formatWithMask("cpf", "52998224725")).toBe("529.982.247-25");
    expect(formatWithMask("cns", "898001160660004")).toBe("898 0011 6066 0004");
  });

  it("escolhe a máscara de telefone pelo número de dígitos", () => {
    expect(formatWithMask("phone", "1134567890")).toBe("(11) 3456-7890");
    expect(formatWithMask("phone", "11987654321")).toBe("(11) 98765-4321");
  });
});

describe("isValidCpf", () => {
  it("aceita CPF válido, com ou sem máscara", () => {
    expect(isValidCpf("52998224725")).toBe(true);
    expect(isValidCpf("529.982.247-25")).toBe(true);
  });

  it("recusa dígito verificador errado", () => {
    expect(isValidCpf("52998224724")).toBe(false);
    expect(isValidCpf("52998224715")).toBe(false);
  });

  it("recusa tamanho errado e dígitos todos iguais", () => {
    expect(isValidCpf("5299822472")).toBe(false);
    expect(isValidCpf("529982247250")).toBe(false);
    expect(isValidCpf("11111111111")).toBe(false);
  });
});

describe("maskCpf", () => {
  it("mostra só os dígitos do meio", () => {
    expect(maskCpf("52998224725")).toBe("***.982.247-**");
  });

  it("esconde tudo quando o valor não tem 11 dígitos", () => {
    expect(maskCpf("123")).toBe("***.***.***-**");
  });
});

describe("normalizeSearch", () => {
  it("tira a máscara de CPF e Cartão SUS", () => {
    expect(normalizeSearch(" 529.982.247-25 ")).toBe("52998224725");
    expect(normalizeSearch("898 0011 6066 0004")).toBe("898001160660004");
  });

  it("mantém nomes e junta espaços repetidos", () => {
    expect(normalizeSearch("  maria   josé ")).toBe("maria josé");
    expect(normalizeSearch("José 2")).toBe("José 2");
  });

  it("devolve vazio para busca em branco", () => {
    expect(normalizeSearch("   ")).toBe("");
  });
});
