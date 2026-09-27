"use client";

import { useMemo, useState } from "react";
import { useAccounts, useCategories, useTransactions } from "@/lib/hooks/useFinanceData";
import { formatCurrency, formatDateLabel } from "@/lib/format";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import type { TransactionWithRelations } from "@/types/database.types";

const PAGE_SIZE = 30;

export default function TransactionsPage() {
  const [search, setSearch] = useState("");
  const [type, setType] = useState<"all" | "income" | "expense">("all");
  const [categoryId, setCategoryId] = useState("all");
  const [accountId, setAccountId] = useState("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [editing, setEditing] = useState<TransactionWithRelations | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<TransactionWithRelations | null>(null);

  const { categories } = useCategories();
  const { accounts } = useAccounts();
  const { transactions, loading, deleteTransaction } = useTransactions({
    type,
    categoryId,
    accountId,
    from: from || undefined,
    to: to || undefined,
  });

  const filtered = useMemo(() => {
    if (!search.trim()) return transactions;
    const q = search.trim().toLowerCase();
    return transactions.filter(
      (t) =>
        t.description?.toLowerCase().includes(q) ||
        t.category?.name.toLowerCase().includes(q) ||
        String(t.amount).includes(q)
    );
  }, [transactions, search]);

  const visible = filtered.slice(0, visibleCount);

  async function handleDelete() {
    if (!confirmDelete) return;
    await deleteTransaction(confirmDelete.id);
    setConfirmDelete(null);
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Transactions</h1>
      </div>

      {/* Search */}
      <input
        type="search"
        placeholder="Search by description, category, or amount"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="rounded-xl border border-border bg-surface px-4 py-2.5 text-sm outline-none focus:border-accent"
      />

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <select value={type} onChange={(e) => setType(e.target.value as typeof type)} className="filter-select">
          <option value="all">All types</option>
          <option value="income">Income</option>
          <option value="expense">Expense</option>
        </select>
        <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="filter-select">
          <option value="all">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <select value={accountId} onChange={(e) => setAccountId(e.target.value)} className="filter-select">
          <option value="all">All accounts</option>
          {accounts.map((a) => (
            <option key={a.account_id} value={a.account_id}>
              {a.name}
            </option>
          ))}
        </select>
        <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="filter-select" />
        <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="filter-select" />
      </div>

      {/* List */}
      <div className="rounded-card border border-border bg-surface">
        {loading ? (
          <p className="py-10 text-center text-sm text-muted">Loading…</p>
        ) : visible.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted">No transactions match your filters.</p>
        ) : (
          <div className="divide-y divide-border">
            {visible.map((t) => (
              <div key={t.id} className="flex items-center justify-between gap-3 px-4 py-3 sm:px-5">
                <div className="flex min-w-0 items-center gap-3">
                  <span
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs"
                    style={{ backgroundColor: `${t.category?.color ?? "#999"}22`, color: t.category?.color }}
                  >
                    ●
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{t.description || t.category?.name || "—"}</p>
                    <p className="truncate text-xs text-muted">
                      {formatDateLabel(t.transaction_date)} · {t.category?.name} · {t.account?.name}
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <span className={`tabular text-sm font-medium ${t.type === "income" ? "text-income" : "text-expense"}`}>
                    {t.type === "income" ? "+" : "-"}
                    {formatCurrency(t.amount)}
                  </span>
                  <button
                    onClick={() => setEditing(t)}
                    className="rounded-lg px-2 py-1 text-xs text-muted hover:bg-bg hover:text-ink"
                    aria-label="Edit transaction"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => setConfirmDelete(t)}
                    className="rounded-lg px-2 py-1 text-xs text-expense hover:bg-bg"
                    aria-label="Delete transaction"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {visibleCount < filtered.length && (
        <button
          onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
          className="self-center rounded-pill border border-border px-4 py-2 text-sm text-ink"
        >
          Load more
        </button>
      )}

      {editing && (
        <EditTransactionModal transaction={editing} onClose={() => setEditing(null)} />
      )}

      {confirmDelete && (
        <ConfirmDialog
          title="Delete this transaction?"
          description="This can't be undone, and account balances will update immediately."
          confirmLabel="Delete"
          onCancel={() => setConfirmDelete(null)}
          onConfirm={handleDelete}
        />
      )}

      <style jsx global>{`
        .filter-select {
          border-radius: 12px;
          border: 1px solid var(--border);
          background: var(--surface);
          padding: 0.5rem 0.75rem;
          font-size: 0.875rem;
          color: var(--ink);
        }
      `}</style>
    </div>
  );
}

function EditTransactionModal({
  transaction,
  onClose,
}: {
  transaction: TransactionWithRelations;
  onClose: () => void;
}) {
  const { categories } = useCategories();
  const { accounts } = useAccounts();
  const { updateTransaction } = useTransactions();
  const [amount, setAmount] = useState(String(transaction.amount));
  const [categoryId, setCategoryId] = useState(transaction.category_id);
  const [accountId, setAccountId] = useState(transaction.account_id);
  const [date, setDate] = useState(transaction.transaction_date);
  const [description, setDescription] = useState(transaction.description || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    if (Number(amount) <= 0) return;
    setSaving(true);
    setError(null);
    try {
      await updateTransaction(transaction.id, {
        amount: Number(amount),
        category_id: categoryId,
        account_id: accountId,
        transaction_date: date,
        description: description || null,
      });
      onClose();
    } catch {
      setError("Couldn't save changes. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  const relevantCategories = categories.filter((c) => c.type === transaction.type);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 sm:items-center" onClick={onClose}>
      <div
        className="w-full max-w-[420px] rounded-t-card border border-border bg-surface p-5 sm:rounded-card"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-4 text-base font-semibold">Edit {transaction.type}</h2>
        <div className="flex flex-col gap-3">
          <label className="flex flex-col gap-1.5 text-sm">
            Amount
            <input
              type="text"
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ""))}
              className="rounded-xl border border-border bg-bg px-3.5 py-2 outline-none focus:border-accent"
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            Category
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="rounded-xl border border-border bg-bg px-3.5 py-2 outline-none focus:border-accent"
            >
              {relevantCategories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            Account
            <select
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              className="rounded-xl border border-border bg-bg px-3.5 py-2 outline-none focus:border-accent"
            >
              {accounts.map((a) => (
                <option key={a.account_id} value={a.account_id}>
                  {a.name}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            Date
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="rounded-xl border border-border bg-bg px-3.5 py-2 outline-none focus:border-accent"
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            Notes
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="rounded-xl border border-border bg-bg px-3.5 py-2 outline-none focus:border-accent"
            />
          </label>
        </div>

        {error && <p className="mt-3 text-sm text-expense">{error}</p>}

        <div className="mt-5 flex gap-2">
          <button onClick={onClose} className="flex-1 rounded-xl border border-border py-2.5 text-sm font-medium">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-[2] rounded-xl bg-accent py-2.5 text-sm font-semibold text-accent-ink disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
