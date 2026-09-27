"use client";

import type { SyncStatus as Status } from "@/lib/hooks/useFinanceData";

const LABEL: Record<Status, string> = {
  synced: "Synced",
  syncing: "Syncing…",
  offline: "Offline — changes will sync when you're online",
  error: "Couldn't sync",
};

export function SyncStatusBadge({ status }: { status: Status }) {
  const dotColor =
    status === "synced"
      ? "bg-income"
      : status === "syncing"
      ? "bg-accent"
      : status === "offline"
      ? "bg-muted"
      : "bg-expense";

  return (
    <div className="flex items-center gap-1.5 text-xs text-muted" role="status" aria-live="polite">
      <span
        className={`h-1.5 w-1.5 rounded-full ${dotColor} ${status === "syncing" ? "animate-pulse" : ""}`}
        aria-hidden
      />
      <span>{LABEL[status]}</span>
    </div>
  );
}
