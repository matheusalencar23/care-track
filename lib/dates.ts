function dateParts(isoDate: string) {
  const [year, month, day] = isoDate.slice(0, 10).split("-").map(Number);
  return { year, month, day };
}

export function formatDate(isoDate: string) {
  const { year, month, day } = dateParts(isoDate);
  return `${String(day).padStart(2, "0")}/${String(month).padStart(2, "0")}/${year}`;
}

export function ageOn(birthDate: string, today = new Date()) {
  const { year, month, day } = dateParts(birthDate);
  const hadBirthday =
    today.getMonth() + 1 > month ||
    (today.getMonth() + 1 === month && today.getDate() >= day);

  return today.getFullYear() - year - (hadBirthday ? 0 : 1);
}

export function formatAge(birthDate: string, today = new Date()) {
  const age = ageOn(birthDate, today);

  if (age < 1) {
    return "menos de 1 ano";
  }

  return age === 1 ? "1 ano" : `${age} anos`;
}

export function todayIso(today = new Date()) {
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${today.getFullYear()}-${month}-${day}`;
}

const dateTimeFormat = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
});

export function formatDateTime(isoDateTime: string) {
  return dateTimeFormat.format(new Date(isoDateTime));
}
