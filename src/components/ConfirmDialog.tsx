"use client";

export function ConfirmDialog({
  title,
  description,
  confirmLabel = "Confirm",
  onCancel,
  onConfirm,
}: {
  title: string;
  description: string;
  confirmLabel?: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4" onClick={onCancel}>
      <div className="w-full max-w-[360px] rounded-card border border-border bg-surface p-5" onClick={(e) => e.stopPropagation()}>
        <h2 className="mb-1.5 text-base font-semibold">{title}</h2>
        <p className="mb-5 text-sm text-muted">{description}</p>
        <div className="flex gap-2">
          <button onClick={onCancel} className="flex-1 rounded-xl border border-border py-2.5 text-sm font-medium">
            Cancel
          </button>
          <button onClick={onConfirm} className="flex-1 rounded-xl bg-expense py-2.5 text-sm font-semibold text-white">
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
