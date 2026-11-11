import { describe, expect, it } from "vitest";
import {
  ageOn,
  formatAge,
  formatDate,
  formatDateTime,
  isBeforeBirth,
  isMinorAt,
  todayIso,
  toLocalDateTimeInput,
} from "./dates";

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

describe("todayIso", () => {
  it("usa a data local, não a de UTC", () => {
    expect(todayIso(new Date(2026, 0, 5, 23, 30))).toBe("2026-01-05");
  });
});

describe("formatDateTime", () => {
  it("mostra data e hora no fuso local", () => {
    const local = new Date(2026, 10, 6, 14, 5);

    expect(formatDateTime(local.toISOString())).toBe("06/11/2026, 14:05");
  });
});

describe("isMinorAt", () => {
  it("usa o mesmo corte da API: meia-noite UTC do aniversário de 18 anos", () => {
    expect(isMinorAt("2008-11-09", new Date("2026-11-08T23:59:59.000Z"))).toBe(true);
    expect(isMinorAt("2008-11-09", new Date("2026-11-09T00:00:00.000Z"))).toBe(false);
  });
});

describe("isBeforeBirth", () => {
  it("usa o mesmo corte da API: meia-noite UTC do dia do nascimento", () => {
    expect(isBeforeBirth("2008-11-09", new Date("2008-11-08T23:59:59.000Z"))).toBe(true);
    expect(isBeforeBirth("2008-11-09", new Date("2008-11-09T00:00:00.000Z"))).toBe(false);
  });
});

describe("toLocalDateTimeInput", () => {
  it("devolve o formato do campo datetime-local, na hora local", () => {
    expect(toLocalDateTimeInput(new Date(2026, 0, 5, 7, 3))).toBe("2026-01-05T07:03");
  });
});
