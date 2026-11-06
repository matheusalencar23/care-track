import { describe, expect, it } from "vitest";
import { ageOn, formatAge, formatDate } from "./dates";

const today = new Date(2026, 10, 6);

describe("formatDate", () => {
  it("formata sem depender do fuso horário", () => {
    expect(formatDate("1950-03-15")).toBe("15/03/1950");
    expect(formatDate("2000-01-01T00:00:00.000Z")).toBe("01/01/2000");
  });
});

describe("ageOn", () => {
  it("conta o aniversário só a partir do dia", () => {
    expect(ageOn("1950-11-06", today)).toBe(76);
    expect(ageOn("1950-11-07", today)).toBe(75);
    expect(ageOn("1950-12-01", today)).toBe(75);
  });
});

describe("formatAge", () => {
  it("usa singular, plural e menos de 1 ano", () => {
    expect(formatAge("2025-11-06", today)).toBe("1 ano");
    expect(formatAge("1990-01-01", today)).toBe("36 anos");
    expect(formatAge("2026-05-01", today)).toBe("menos de 1 ano");
  });
});
