"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function SettingsPage() {
  const supabase = createClient();
  const router = useRouter();
  const [email, setEmail] = useState<string>("");

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email || ""));
  }, [supabase]);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="flex max-w-[560px] flex-col gap-6">
      <h1 className="text-xl font-semibold">Settings</h1>

      <section className="rounded-card border border-border bg-surface p-5">
        <p className="mb-3 text-sm font-medium">Account</p>
        <p className="text-sm text-muted">Signed in as</p>
        <p className="text-sm">{email || "—"}</p>
        <button onClick={handleLogout} className="mt-4 rounded-xl border border-border px-4 py-2 text-sm">
          Log out
        </button>
      </section>

      <section className="rounded-card border border-border bg-surface p-5">
        <p className="mb-3 text-sm font-medium">Appearance</p>
        <ThemeToggle />
      </section>

      <section className="rounded-card border border-border bg-surface p-5">
        <p className="mb-3 text-sm font-medium">Currency</p>
        <p className="text-sm text-muted">LKR — Sri Lankan Rupees (Rs.)</p>
      </section>

      <section className="rounded-card border border-border bg-surface p-5">
        <p className="mb-3 text-sm font-medium">Install this app</p>
        <div className="flex flex-col gap-4 text-sm text-muted">
          <div>
            <p className="mb-1 font-medium text-ink">iPhone / iPad</p>
            <ol className="list-decimal space-y-0.5 pl-4">
              <li>Open this site in Safari.</li>
              <li>Tap the Share icon.</li>
              <li>Select "Add to Home Screen".</li>
              <li>Tap Add, then launch it from your Home Screen.</li>
            </ol>
          </div>
          <div>
            <p className="mb-1 font-medium text-ink">MacBook</p>
            <ol className="list-decimal space-y-0.5 pl-4">
              <li>Open this site in Safari or Chrome.</li>
              <li>
                Safari: File → Add to Dock. Chrome: click the install icon in the address bar (or menu → Cast, save
                and share → Install page as app).
              </li>
              <li>Launch it like any other app from your Dock or Applications folder.</li>
            </ol>
          </div>
        </div>
      </section>

      <section className="rounded-card border border-border bg-surface p-5">
        <p className="mb-2 text-sm font-medium">How sync works</p>
        <p className="text-sm text-muted">
          Every transaction you add is written straight to your cloud database and appears on any other device the
          moment you open the app there. If you lose your connection, new entries are queued on your device and sync
          automatically the next time you're online — you'll never lose data, and nothing is duplicated.
        </p>
      </section>
    </div>
  );
}
