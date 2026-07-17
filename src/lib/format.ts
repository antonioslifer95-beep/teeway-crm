export function formatEUR(value: unknown) {
  return new Intl.NumberFormat("pt-PT", {
    style: "currency",
    currency: "EUR",
  }).format(Number(value));
}

export function formatDatePT(date: Date) {
  return new Intl.DateTimeFormat("pt-PT", { dateStyle: "medium" }).format(date);
}

export function formatDateTimePT(date: Date) {
  return new Intl.DateTimeFormat("pt-PT", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}
