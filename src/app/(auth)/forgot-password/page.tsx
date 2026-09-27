"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    setSent(true);
  }

  if (sent) {
    return (
      <div className="text-center">
        <h2 className="mb-2 text-lg font-medium">Check your inbox</h2>
        <p className="text-sm text-muted">
          If an account exists for <span className="text-ink">{email}</span>, we sent a password reset link.
        </p>
        <Link href="/login" className="mt-6 inline-block text-sm font-medium text-accent">
          Back to log in
        </Link>
      </div>
    );
  }

  return (
    <>
      <h2 className="mb-1 text-lg font-medium">Reset your password</h2>
      <p className="mb-6 text-sm text-muted">We'll email you a link to choose a new one.</p>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1.5 text-sm">
          Email
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="rounded-xl border border-border bg-bg px-3.5 py-2.5 text-ink outline-none focus:border-accent"
          />
        </label>
        {error && <p className="text-sm text-expense">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="mt-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-medium text-accent-ink disabled:opacity-60"
        >
          {loading ? "Sending…" : "Send reset link"}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-muted">
        <Link href="/login" className="font-medium text-accent">
          Back to log in
        </Link>
      </p>
    </>
  );
}
