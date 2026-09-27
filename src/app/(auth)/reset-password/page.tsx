"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const supabase = createClient();
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    setDone(true);
    setTimeout(() => router.push("/dashboard"), 1200);
  }

  if (done) {
    return (
      <div className="text-center">
        <h2 className="mb-2 text-lg font-medium">Password updated</h2>
        <p className="text-sm text-muted">Taking you to your dashboard…</p>
      </div>
    );
  }

  return (
    <>
      <h2 className="mb-1 text-lg font-medium">Choose a new password</h2>
      <p className="mb-6 text-sm text-muted">Use this link only once — it expires after use.</p>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1.5 text-sm">
          New password
          <input
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="rounded-xl border border-border bg-bg px-3.5 py-2.5 text-ink outline-none focus:border-accent"
          />
        </label>
        {error && <p className="text-sm text-expense">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="mt-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-medium text-accent-ink disabled:opacity-60"
        >
          {loading ? "Updating…" : "Update password"}
        </button>
      </form>
    </>
  );
}
