import { format as formatDateFns, isValid, parseISO } from "date-fns";

export function formatCurrency(
  amount: number,
  currency = "INR",
  locale = "en-IN",
): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(
  date: string | Date | number,
  pattern = "dd MMM yyyy",
): string {
  const parsed =
    typeof date === "string"
      ? parseISO(date)
      : date instanceof Date
        ? date
        : new Date(date);

  if (!isValid(parsed)) {
    return "";
  }

  return formatDateFns(parsed, pattern);
}

export function slugify(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}
