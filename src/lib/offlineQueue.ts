"use client";

// A small localStorage-backed outbox for transactions added while offline.
// Each queued item carries a client_generated_id (see the unique index in
// 0001_init_schema.sql) so a retried sync can never insert the same
// transaction twice, even if the network drops mid-request.

import type { Transaction } from "@/types/database.types";

const QUEUE_KEY = "finance-tracker:pending-transactions";
const CACHE_KEY = "finance-tracker:cached-transactions";

export type PendingTransaction = Omit<Transaction, "id" | "created_at" | "updated_at" | "user_id"> & {
  client_generated_id: string;
};

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage full or unavailable — the in-memory app state still works
    // for this session, it just won't survive a reload.
  }
}

export function getQueue(): PendingTransaction[] {
  return read<PendingTransaction[]>(QUEUE_KEY, []);
}

export function enqueue(tx: PendingTransaction) {
  const queue = getQueue();
  queue.push(tx);
  write(QUEUE_KEY, queue);
}

export function removeFromQueue(clientGeneratedId: string) {
  const queue = getQueue().filter((t) => t.client_generated_id !== clientGeneratedId);
  write(QUEUE_KEY, queue);
}

export function clearQueue() {
  write(QUEUE_KEY, []);
}

// Last-known-good transaction list, so the app still shows real data
// (not a blank screen) when opened with no connection at all.
export function getCachedTransactions(): unknown[] {
  return read(CACHE_KEY, []);
}

export function setCachedTransactions(rows: unknown[]) {
  write(CACHE_KEY, rows);
}
