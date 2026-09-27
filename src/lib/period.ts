export type PeriodKey = "this_month" | "last_month" | "this_year" | "custom";

function iso(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function rangeForPeriod(period: PeriodKey, custom?: { from: string; to: string }) {
  const now = new Date();

  if (period === "this_month") {
    const from = new Date(now.getFullYear(), now.getMonth(), 1);
    const to = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return { from: iso(from), to: iso(to), label: "This month" };
  }

  if (period === "last_month") {
    const from = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const to = new Date(now.getFullYear(), now.getMonth(), 0);
    return { from: iso(from), to: iso(to), label: "Last month" };
  }

  if (period === "this_year") {
    const from = new Date(now.getFullYear(), 0, 1);
    const to = new Date(now.getFullYear(), 11, 31);
    return { from: iso(from), to: iso(to), label: "This year" };
  }

  return {
    from: custom?.from || iso(now),
    to: custom?.to || iso(now),
    label: "Custom range",
  };
}
