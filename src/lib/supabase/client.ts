import { createBrowserClient } from "@supabase/ssr";

// Client used in Client Components. Relies only on the public anon key,
// which is safe to expose — Row Level Security in Postgres does the real
// access control (see supabase/migrations/0002_rls_policies.sql).
//
// Deliberately untyped (no <Database> generic): this project ships its own
// hand-written row types in src/types/database.types.ts and casts query
// results to them at the call site, rather than a full `supabase gen
// types`-style generic, which needs Relationships/Functions/Enums entries
// to satisfy the client's generic constraints. Run `supabase gen types
// typescript` yourself later and pass that here for stricter checking.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
