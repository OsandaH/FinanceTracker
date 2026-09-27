"use client";

import { useState } from "react";
import { useAccounts } from "@/lib/hooks/useFinanceData";
import { formatCurrency } from "@/lib/format";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import type { AccountBalance, AccountType } from "@/types/database.types";

const ACCOUNT_TYPES: { value: AccountType; label: string }[] = [
  { value: "cash", label: "Cash" },
  { value: "bank", label: "Bank account" },
  { value: "credit_card", label: "Credit card" },
  { value: "debit_card", label: "Debit card" },
  { value: "savings", label: "Savings" },
  { value: "other", label: "Other" },
];

export default function AccountsPage() {
  const { accounts, loading, addAccount, updateAccount, deleteAccount } = useAccounts();
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<AccountBalance | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<AccountBalance | null>(null);
  const [error, setError] = useState<string | null>(null);

  const active = accounts.filter((a) => !a.is_archived);
  const archived = accounts.filter((a) => a.is_archived);

  async function handleDelete() {
    if (!confirmDelete) return;
    try {
      await deleteAccount(confirmDelete.account_id);
    } catch {
      setError("Can't delete an account with existing transactions. Archive it instead.");
      await updateAccount(confirmDelete.account_id, { is_archived: true });
    }
    setConfirmDelete(null);
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Accounts</h1>
        <button onClick={() => setShowAdd(true)} className="rounded-pill bg-accent px-4 py-2 text-sm font-medium text-accent-ink">
          + Add account
        </button>
      </div>

      {error && <p className="text-sm text-expense">{error}</p>}

      {loading ? (
        <p className="py-10 text-center text-sm text-muted">Loading…</p>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {active.map((a) => (
            <div key={a.account_id} className="rounded-card border border-border bg-surface p-5">
              <p className="text-sm text-muted">{ACCOUNT_TYPES.find((t) => t.value === a.type)?.label}</p>
              <p className="mt-0.5 text-base font-medium">{a.name}</p>
              <p className={`mt-2 text-2xl font-semibold tabular ${a.balance < 0 ? "text-expense" : ""}`}>
                {formatCurrency(a.balance)}
              </p>
              <div className="mt-4 flex gap-3 text-xs">
                <button onClick={() => setEditing(a)} className="text-accent">
                  Edit
                </button>
                <button onClick={() => updateAccount(a.account_id, { is_archived: true })} className="text-muted">
                  Archive
                </button>
                <button onClick={() => setConfirmDelete(a)} className="text-expense">
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {archived.length > 0 && (
        <div>
          <p className="mb-2 text-sm font-medium text-muted">Archived</p>
          <div className="flex flex-col gap-2">
            {archived.map((a) => (
              <div key={a.account_id} className="flex items-center justify-between rounded-xl border border-border bg-surface px-4 py-3">
                <span className="text-sm text-muted">{a.name}</span>
                <button onClick={() => updateAccount(a.account_id, { is_archived: false })} className="text-xs text-accent">
                  Unarchive
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {showAdd && (
        <AccountFormModal
          title="Add account"
          onClose={() => setShowAdd(false)}
          onSubmit={async (data) => {
            await addAccount(data);
            setShowAdd(false);
          }}
        />
      )}

      {editing && (
        <AccountFormModal
          title="Edit account"
          initial={{ name: editing.name, type: editing.type }}
          onClose={() => setEditing(null)}
          onSubmit={async (data) => {
            await updateAccount(editing.account_id, { name: data.name, type: data.type });
            setEditing(null);
          }}
        />
      )}

      {confirmDelete && (
        <ConfirmDialog
          title={`Delete "${confirmDelete.name}"?`}
          description="If this account has transactions, it will be archived instead so your history stays intact."
          confirmLabel="Delete"
          onCancel={() => setConfirmDelete(null)}
          onConfirm={handleDelete}
        />
      )}
    </div>
  );
}

function AccountFormModal({
  title,
  initial,
  onClose,
  onSubmit,
}: {
  title: string;
  initial?: { name: string; type: AccountType };
  onClose: () => void;
  onSubmit: (data: { name: string; type: AccountType; opening_balance: number }) => Promise<void>;
}) {
  const [name, setName] = useState(initial?.name || "");
  const [type, setType] = useState<AccountType>(initial?.type || "cash");
  const [openingBalance, setOpeningBalance] = useState("0");
  const [saving, setSaving] = useState(false);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 sm:items-center" onClick={onClose}>
      <div className="w-full max-w-[380px] rounded-t-card border border-border bg-surface p-5 sm:rounded-card" onClick={(e) => e.stopPropagation()}>
        <h2 className="mb-4 text-base font-semibold">{title}</h2>
        <div className="flex flex-col gap-3">
          <label className="flex flex-col gap-1.5 text-sm">
            Name
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. HNB Savings"
              className="rounded-xl border border-border bg-bg px-3.5 py-2 outline-none focus:border-accent"
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            Type
            <select value={type} onChange={(e) => setType(e.target.value as AccountType)} className="rounded-xl border border-border bg-bg px-3.5 py-2 outline-none focus:border-accent">
              {ACCOUNT_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </label>
          {!initial && (
            <label className="flex flex-col gap-1.5 text-sm">
              Opening balance
              <input
                type="text"
                inputMode="decimal"
                value={openingBalance}
                onChange={(e) => setOpeningBalance(e.target.value.replace(/[^0-9.-]/g, ""))}
                className="rounded-xl border border-border bg-bg px-3.5 py-2 outline-none focus:border-accent"
              />
            </label>
          )}
        </div>
        <div className="mt-5 flex gap-2">
          <button onClick={onClose} className="flex-1 rounded-xl border border-border py-2.5 text-sm font-medium">
            Cancel
          </button>
          <button
            disabled={!name.trim() || saving}
            onClick={async () => {
              setSaving(true);
              await onSubmit({ name: name.trim(), type, opening_balance: Number(openingBalance) || 0 });
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
