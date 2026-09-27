// The database always stores raw numeric amounts + a currency code, never a
// pre-formatted string. Formatting for display happens only here, so
// switching currencies later only touches this file.

export function formatCurrency(amount: number, currency: string = "LKR"): string {
  if (currency === "LKR") {
    // Sri Lankan Rupees are conventionally shown as "Rs. 125,450" rather
    // than via Intl's "LKR" symbol, so this is special-cased.
    const sign = amount < 0 ? "-" : "";
    const abs = Math.abs(amount);
    return `${sign}Rs. ${abs.toLocaleString("en-LK", { maximumFractionDigits: 2 })}`;
  }
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatDateLabel(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00");
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  const isSameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

  if (isSameDay(date, today)) return "Today";
  if (isSameDay(date, yesterday)) return "Yesterday";

  return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export function todayISO(): string {
  const d = new Date();
  const offset = d.getTimezoneOffset();
  const local = new Date(d.getTime() - offset * 60 * 1000);
  return local.toISOString().slice(0, 10);
}
