"use client";

import { useState } from "react";
import { useCategories } from "@/lib/hooks/useFinanceData";
import type { Category, TransactionType } from "@/types/database.types";

const PALETTE = ["#C9503C", "#D98A3D", "#C9A23D", "#7FA13D", "#2F8F5B", "#1F6E5C", "#2E7D9A", "#3D5FA1", "#6A4FA1", "#A14F8E"];

export default function CategoriesPage() {
  const { categories, addCategory, renameCategory, deleteCategory } = useCategories();
  const [tab, setTab] = useState<TransactionType>("expense");
  const [showAdd, setShowAdd] = useState(false);
  const [renaming, setRenaming] = useState<Category | null>(null);
  const [deleting, setDeleting] = useState<Category | null>(null);

  const list = categories.filter((c) => c.type === tab);
  const otherCategoriesForReassign = list.filter((c) => c.id !== deleting?.id);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Categories</h1>
        <button onClick={() => setShowAdd(true)} className="rounded-pill bg-accent px-4 py-2 text-sm font-medium text-accent-ink">
          + Add category
        </button>
      </div>

      <div className="flex rounded-pill border border-border bg-surface p-1 sm:w-fit">
        {(["expense", "income"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 rounded-pill px-5 py-1.5 text-sm capitalize transition-colors sm:flex-none ${
              tab === t ? "bg-accent text-accent-ink" : "text-muted"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4">
        {list.map((c) => (
          <div key={c.id} className="flex items-center justify-between gap-2 rounded-xl border border-border bg-surface px-3.5 py-3">
            <span className="flex items-center gap-2 text-sm">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: c.color }} />
              {c.name}
            </span>
            <div className="flex gap-1.5 text-xs">
              <button onClick={() => setRenaming(c)} className="text-muted hover:text-ink" aria-label={`Edit ${c.name}`}>
                ✎
              </button>
              <button onClick={() => setDeleting(c)} className="text-muted hover:text-expense" aria-label={`Delete ${c.name}`}>
                ✕
              </button>
            </div>
          </div>
        ))}
      </div>

      {showAdd && (
        <CategoryFormModal
          title={`Add ${tab} category`}
          onClose={() => setShowAdd(false)}
          onSubmit={async (name, color) => {
            await addCategory(name, tab, color);
            setShowAdd(false);
          }}
        />
      )}

      {renaming && (
        <CategoryFormModal
          title="Rename category"
          initialName={renaming.name}
          onClose={() => setRenaming(null)}
          onSubmit={async (name) => {
            await renameCategory(renaming.id, name);
            setRenaming(null);
          }}
        />
      )}

      {deleting && (
        <DeleteCategoryModal
          category={deleting}
          reassignOptions={otherCategoriesForReassign}
          onClose={() => setDeleting(null)}
          onConfirm={async (reassignId) => {
            await deleteCategory(deleting.id, reassignId);
            setDeleting(null);
          }}
        />
      )}
    </div>
  );
}

function CategoryFormModal({
  title,
  initialName = "",
  onClose,
  onSubmit,
}: {
  title: string;
  initialName?: string;
  onClose: () => void;
  onSubmit: (name: string, color: string) => Promise<void>;
}) {
  const [name, setName] = useState(initialName);
  const [color, setColor] = useState(PALETTE[0]);
  const [saving, setSaving] = useState(false);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4" onClick={onClose}>
      <div className="w-full max-w-[360px] rounded-card border border-border bg-surface p-5" onClick={(e) => e.stopPropagation()}>
        <h2 className="mb-4 text-base font-semibold">{title}</h2>
        <label className="flex flex-col gap-1.5 text-sm">
          Name
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="rounded-xl border border-border bg-bg px-3.5 py-2 outline-none focus:border-accent"
          />
        </label>
        {!initialName && (
          <div className="mt-3">
            <p className="mb-1.5 text-sm">Color</p>
            <div className="flex flex-wrap gap-2">
              {PALETTE.map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className={`h-7 w-7 rounded-full ${color === c ? "ring-2 ring-offset-2 ring-offset-surface ring-accent" : ""}`}
                  style={{ backgroundColor: c }}
                  aria-label={`Choose color ${c}`}
                />
              ))}
            </div>
          </div>
        )}
        <div className="mt-5 flex gap-2">
          <button onClick={onClose} className="flex-1 rounded-xl border border-border py-2.5 text-sm font-medium">
            Cancel
          </button>
          <button
            disabled={!name.trim() || saving}
            onClick={async () => {
              setSaving(true);
              await onSubmit(name.trim(), color);
              setSaving(false);
            }}
            className="flex-[2] rounded-xl bg-accent py-2.5 text-sm font-semibold text-accent-ink disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

function DeleteCategoryModal({
  category,
  reassignOptions,
  onClose,
  onConfirm,
}: {
  category: Category;
  reassignOptions: Category[];
  onClose: () => void;
  onConfirm: (reassignId?: string) => Promise<void>;
}) {
  const [reassignId, setReassignId] = useState<string>("");
  const [saving, setSaving] = useState(false);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4" onClick={onClose}>
      <div className="w-full max-w-[380px] rounded-card border border-border bg-surface p-5" onClick={(e) => e.stopPropagation()}>
        <h2 className="mb-1.5 text-base font-semibold">Delete "{category.name}"?</h2>
        <p className="mb-4 text-sm text-muted">
          If this category has existing transactions, choose a category to move them to. Otherwise it will be
          archived, not deleted, so your history stays intact.
        </p>
        {reassignOptions.length > 0 && (
          <label className="flex flex-col gap-1.5 text-sm">
            Move existing transactions to
            <select
              value={reassignId}
              onChange={(e) => setReassignId(e.target.value)}
              className="rounded-xl border border-border bg-bg px-3.5 py-2 outline-none focus:border-accent"
            >
              <option value="">Don't reassign — archive instead</option>
              {reassignOptions.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
        )}
        <div className="mt-5 flex gap-2">
          <button onClick={onClose} className="flex-1 rounded-xl border border-border py-2.5 text-sm font-medium">
            Cancel
          </button>
          <button
            disabled={saving}
            onClick={async () => {
              setSaving(true);
              await onConfirm(reassignId || undefined);
              setSaving(false);
            }}
            className="flex-[2] rounded-xl bg-expense py-2.5 text-sm font-semibold text-white disabled:opacity-50"
          >
            {saving ? "Working…" : "Confirm"}
          </button>
        </div>
      </div>
    </div>
  );
}
