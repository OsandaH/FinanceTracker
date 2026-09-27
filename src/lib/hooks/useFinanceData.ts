"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useOnlineStatus } from "./useOnlineStatus";
import {
  enqueue,
  getQueue,
  removeFromQueue,
  getCachedTransactions,
  setCachedTransactions,
  type PendingTransaction,
} from "@/lib/offlineQueue";
import type {
  Account,
  AccountBalance,
  Category,
  Transaction,
  TransactionType,
  TransactionWithRelations,
} from "@/types/database.types";

export type SyncStatus = "synced" | "syncing" | "offline" | "error";

// ---------------------------------------------------------------------------
// Accounts
// ---------------------------------------------------------------------------
export function useAccounts() {
  const supabase = createClient();
  const [accounts, setAccounts] = useState<AccountBalance[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const { data } = await supabase
      .from("account_balances")
      .select("*")
      .order("name", { ascending: true });
    if (data) setAccounts(data as AccountBalance[]);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    refresh();
    const channel = supabase
      .channel("accounts-sync")
      .on("postgres_changes", { event: "*", schema: "public", table: "accounts" }, refresh)
      .on("postgres_changes", { event: "*", schema: "public", table: "transactions" }, refresh)
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function addAccount(input: Pick<Account, "name" | "type" | "opening_balance">) {
    const { data: userRes } = await supabase.auth.getUser();
    if (!userRes.user) throw new Error("Not signed in");
    const { error } = await supabase.from("accounts").insert({
      user_id: userRes.user.id,
      name: input.name,
      type: input.type,
      opening_balance: input.opening_balance,
      currency: "LKR",
    });
    if (error) throw error;
  }

  async function updateAccount(id: string, patch: Partial<Pick<Account, "name" | "type" | "is_archived">>) {
    const { error } = await supabase.from("accounts").update(patch).eq("id", id);
    if (error) throw error;
  }

  async function deleteAccount(id: string) {
    const { error } = await supabase.from("accounts").delete().eq("id", id);
    if (error) throw error;
  }

  return { accounts, loading, addAccount, updateAccount, deleteAccount, refresh };
}

// ---------------------------------------------------------------------------
// Categories
// ---------------------------------------------------------------------------
export function useCategories() {
  const supabase = createClient();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const { data } = await supabase
      .from("categories")
      .select("*")
      .eq("is_archived", false)
      .order("name", { ascending: true });
    if (data) setCategories(data as Category[]);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    refresh();
    const channel = supabase
      .channel("categories-sync")
      .on("postgres_changes", { event: "*", schema: "public", table: "categories" }, refresh)
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function addCategory(name: string, type: TransactionType, color: string) {
    const { data: userRes } = await supabase.auth.getUser();
    if (!userRes.user) throw new Error("Not signed in");
    const { error } = await supabase
      .from("categories")
      .insert({ user_id: userRes.user.id, name, type, color, icon: "circle" });
    if (error) throw error;
  }

  async function renameCategory(id: string, name: string) {
    const { error } = await supabase.from("categories").update({ name }).eq("id", id);
    if (error) throw error;
  }

  // Archives the category and, if a replacement is given, reassigns its
  // historical transactions so past reports stay intact instead of
  // breaking a foreign key or losing history.
  async function deleteCategory(id: string, reassignToId?: string) {
    if (reassignToId) {
      const { error: reassignError } = await supabase
        .from("transactions")
        .update({ category_id: reassignToId })
        .eq("category_id", id);
      if (reassignError) throw reassignError;
      const { error } = await supabase.from("categories").delete().eq("id", id);
      if (error) throw error;
    } else {
      // No replacement chosen: archive instead of deleting, so existing
      // transactions keep a valid category_id.
      const { error } = await supabase.from("categories").update({ is_archived: true }).eq("id", id);
      if (error) throw error;
    }
  }

  return { categories, loading, addCategory, renameCategory, deleteCategory, refresh };
}

// ---------------------------------------------------------------------------
// Transactions (with offline queue + realtime cross-device sync)
// ---------------------------------------------------------------------------
export interface TransactionFilters {
  from?: string; // ISO date
  to?: string; // ISO date
  type?: TransactionType | "all";
  categoryId?: string | "all";
  accountId?: string | "all";
  search?: string;
}

export function useTransactions(filters: TransactionFilters = {}) {
  const supabase = createClient();
  const isOnline = useOnlineStatus();
  const [transactions, setTransactions] = useState<TransactionWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("synced");
  const flushing = useRef(false);

  const refresh = useCallback(async () => {
    if (!isOnline) {
      setTransactions(getCachedTransactions() as TransactionWithRelations[]);
      setLoading(false);
      setSyncStatus("offline");
      return;
    }
    setSyncStatus("syncing");
    let query = supabase
      .from("transactions")
      .select("*, category:categories(id,name,color,icon), account:accounts(id,name,type)")
      .order("transaction_date", { ascending: false })
      .order("created_at", { ascending: false });

    if (filters.from) query = query.gte("transaction_date", filters.from);
    if (filters.to) query = query.lte("transaction_date", filters.to);
    if (filters.type && filters.type !== "all") query = query.eq("type", filters.type);
    if (filters.categoryId && filters.categoryId !== "all") query = query.eq("category_id", filters.categoryId);
    if (filters.accountId && filters.accountId !== "all") query = query.eq("account_id", filters.accountId);
    if (filters.search) query = query.ilike("description", `%${filters.search}%`);

    const { data, error } = await query;
    if (error) {
      setSyncStatus("error");
      setLoading(false);
      return;
    }
    const rows = (data ?? []) as unknown as TransactionWithRelations[];
    setTransactions(rows);
    setCachedTransactions(rows);
    setLoading(false);
    setSyncStatus("synced");
  }, [supabase, isOnline, JSON.stringify(filters)]); // eslint-disable-line react-hooks/exhaustive-deps

  const flushQueue = useCallback(async () => {
    if (flushing.current || !isOnline) return;
    const queue = getQueue();
    if (queue.length === 0) return;
    flushing.current = true;
    setSyncStatus("syncing");
    const { data: userRes } = await supabase.auth.getUser();
    if (!userRes.user) {
      flushing.current = false;
      return;
    }
    for (const item of queue) {
      const { error } = await supabase.from("transactions").insert({ ...item, user_id: userRes.user.id });
      // A unique-violation here means this exact offline item already made
      // it to the server on a previous attempt — treat it as success so we
      // never show the user a duplicate transaction.
      if (!error || error.code === "23505") {
        removeFromQueue(item.client_generated_id);
      }
    }
    flushing.current = false;
    await refresh();
  }, [supabase, isOnline, refresh]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (isOnline) flushQueue();
  }, [isOnline, flushQueue]);

  useEffect(() => {
    const channel = supabase
      .channel("transactions-sync")
      .on("postgres_changes", { event: "*", schema: "public", table: "transactions" }, () => refresh())
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function addTransaction(input: {
    type: TransactionType;
    amount: number;
    category_id: string;
    account_id: string;
    transaction_date: string;
    description?: string;
  }) {
    const clientId = crypto.randomUUID();
    const payload: PendingTransaction = {
      account_id: input.account_id,
      category_id: input.category_id,
      type: input.type,
      amount: input.amount,
      currency: "LKR",
      transaction_date: input.transaction_date,
      description: input.description || null,
      recurring_transaction_id: null,
      client_generated_id: clientId,
    };

    // Remember last-used category/account for faster future entries.
    const { data: userRes } = await supabase.auth.getUser();
    if (userRes.user) {
      supabase
        .from("user_quick_add_defaults")
        .upsert({
          user_id: userRes.user.id,
          type: input.type,
          category_id: input.category_id,
          account_id: input.account_id,
        })
        .then(() => {});
    }

    if (!isOnline) {
      enqueue(payload);
      setSyncStatus("offline");
      setTransactions((prev) => [
        {
          id: clientId,
          user_id: "",
          ...payload,
          category: null,
          account: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        } as TransactionWithRelations,
        ...prev,
      ]);
      return;
    }

    if (!userRes.user) throw new Error("Not signed in");
    const { error } = await supabase.from("transactions").insert({ ...payload, user_id: userRes.user.id });
    if (error) throw error;
    await refresh();
  }

  async function updateTransaction(
    id: string,
    patch: Partial<Pick<Transaction, "amount" | "category_id" | "account_id" | "transaction_date" | "description" | "type">>
  ) {
    const { error } = await supabase.from("transactions").update(patch).eq("id", id);
    if (error) throw error;
    await refresh();
  }

  async function deleteTransaction(id: string) {
    const { error } = await supabase.from("transactions").delete().eq("id", id);
    if (error) throw error;
    await refresh();
  }

  return {
    transactions,
    loading,
    syncStatus,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    refresh,
  };
}

// ---------------------------------------------------------------------------
// Last-used category / account, for quick-add defaults
// ---------------------------------------------------------------------------
export function useQuickAddDefaults(type: TransactionType) {
  const supabase = createClient();
  const [defaults, setDefaults] = useState<{ category_id: string | null; account_id: string | null }>({
    category_id: null,
    account_id: null,
  });

  useEffect(() => {
    let active = true;
    supabase
      .from("user_quick_add_defaults")
      .select("category_id, account_id")
      .eq("type", type)
      .maybeSingle()
      .then(({ data }) => {
        if (active && data) setDefaults(data);
      });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type]);

  return defaults;
}
