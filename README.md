# Finance — Personal Finance Tracker

A real, cloud-synced personal finance tracker: Next.js + TypeScript + Tailwind on the frontend, Supabase
(Postgres + Auth + Row Level Security) on the backend. Log in on your iPhone, iPad, or MacBook and see the
same data everywhere, instantly.

**This is phase 1 (MVP)** — the core loop end to end: auth, cloud sync, fast expense/income entry, dashboard,
accounts, categories, transactions with search/filter/edit/delete, dark mode, and PWA install support.
Budgets, full reports, recurring transactions, and CSV import/export are stubbed for phase 2 (see
`src/app/(app)/budgets` and `.../reports`) so the rest of the app is real, not a demo.

---

## 1. What you need before you start

- A free [Supabase](https://supabase.com) account
- A free [Vercel](https://vercel.com) account
- Node.js 18+ installed locally (only needed if you want to run it on your own machine before deploying —
  you can also deploy straight from GitHub without ever running it locally)
- A GitHub account (Vercel deploys from a GitHub repo)

Total setup time: about 15 minutes.

---

## 2. Create your Supabase project

1. Go to [supabase.com](https://supabase.com) → **New project**.
2. Pick an organization, name it (e.g. `finance-tracker`), set a database password (save it somewhere safe),
   choose a region close to you, and click **Create new project**. Wait ~2 minutes for it to provision.
3. Once it's ready, open **SQL Editor** in the left sidebar.
4. Run each file in `supabase/migrations/` **in order**, one at a time — paste the contents of the file into
   a new query and click **Run**:
   - `0001_init_schema.sql` (tables, indexes, constraints)
   - `0002_rls_policies.sql` (Row Level Security — this is what keeps every user's data private)
   - `0003_new_user_setup.sql` (auto-creates a starter "Cash" account + default categories for every new signup)
   - `0004_account_balances_view.sql` (a view that computes live account balances from transactions)
5. Go to **Project Settings → API**. You'll need two values from this page in step 4 below:
   - **Project URL**
   - **anon public** key (never copy the `service_role` key into this app — it's not needed, and it must
     never be exposed to a browser)
6. Go to **Authentication → URL Configuration** and set:
   - **Site URL**: your future Vercel URL (you can update this after deploying, e.g.
     `https://your-app.vercel.app`)
   - **Redirect URLs**: add `https://your-app.vercel.app/dashboard` and
     `https://your-app.vercel.app/reset-password`
7. (Optional) Go to **Authentication → Providers** to enable Google or Apple sign-in if you want it — each
   needs OAuth credentials from Google/Apple's own developer consoles, which is outside what this app needs
   to function with email/password.

---

## 3. Push this code to GitHub

1. Create a new empty repository on GitHub.
2. From this project folder:
   ```bash
   git init
   git add .
   git commit -m "Finance tracker MVP"
   git branch -M main
   git remote add origin https://github.com/YOUR-USERNAME/YOUR-REPO.git
   git push -u origin main
   ```

---

## 4. Deploy to Vercel

1. Go to [vercel.com/new](https://vercel.com/new) and import the GitHub repo you just pushed.
2. In **Environment Variables**, add:
   | Name | Value |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | the Project URL from Supabase step 2.5 |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | the anon public key from Supabase step 2.5 |
3. Click **Deploy**. After ~1–2 minutes you'll get a live URL like `https://your-app.vercel.app`.
4. Go back to Supabase → **Authentication → URL Configuration** and make sure the Site URL and Redirect URLs
   match your real Vercel URL (update them if you used a placeholder earlier).

That's it — open the URL, sign up, and you have a real account. Log in with the same account on your
iPhone, iPad, or MacBook and every transaction you add on one shows up on the others within seconds.

### Running it locally (optional)

```bash
npm install
cp .env.example .env.local   # fill in the two Supabase values
npm run dev
```

Open `http://localhost:3000`.

---

## 5. Architecture

```
Browser / iPhone / iPad / Mac  ──HTTPS──▶  Vercel (Next.js app)  ──HTTPS──▶  Supabase (Postgres + Auth)
        (PWA, installable)                  server + client code              source of truth
```

- **Frontend**: Next.js App Router, TypeScript, Tailwind. Client Components talk to Supabase directly using
  the public anon key; a middleware (`src/middleware.ts`) refreshes the auth session on every request and
  redirects signed-out users to `/login`.
- **Auth**: Supabase Auth (email/password, with password reset). Every table's rows are tied to
  `auth.uid()`.
- **Data model**: `profiles`, `accounts`, `categories`, `transactions`, `budgets`, `recurring_transactions`,
  and a `user_quick_add_defaults` table that remembers your last-used category/account so the add-expense
  flow stays a few seconds. See `supabase/migrations/0001_init_schema.sql` for the full schema, and
  `0004_account_balances_view.sql` for how account balances are computed live from transactions rather than
  stored (so they can never drift out of sync).
- **Security**: Row Level Security policies in `0002_rls_policies.sql` mean Postgres itself refuses to
  return or modify a row that doesn't belong to the requesting user — this holds even if there's a bug in
  the frontend code, since the anon key alone grants no cross-user access.
- **Realtime cross-device sync**: `src/lib/hooks/useFinanceData.ts` subscribes to Postgres changes on
  `transactions`, `accounts`, and `categories` via Supabase Realtime, so a change made on one device appears
  on another within a couple of seconds with no manual refresh.
- **Offline support**: `src/lib/offlineQueue.ts` keeps a small localStorage outbox. Adding a transaction
  while offline queues it locally and shows it immediately in the UI; when the browser comes back online,
  the queue flushes to Supabase using each item's `client_generated_id`, which has a unique constraint in
  the database (`transactions_client_id_unique`) so a retried sync can never create a duplicate.
- **PWA**: `public/manifest.json` + `public/sw.js` make the app installable on iPhone/iPad ("Add to Home
  Screen") and macOS, with app-shell caching so the UI still loads offline (see Settings → Install this app
  in-product for user-facing instructions).

---

## 6. What's next (phase 2)

The priority order in the original brief put these below the core loop, so they're intentionally stubbed
rather than half-built:

- Monthly budgets with 75% / 90% / exceeded warnings
- Full reports (income vs. expenses bar chart, monthly trends line chart, category comparison)
- Recurring transactions (server-side generation on a schedule)
- CSV import/export and backup/restore

The database schema already has `budgets` and `recurring_transactions` tables ready for these, so phase 2 is
additive — no migration of existing data required.
