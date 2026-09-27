-- ============================================================================
-- Finance Tracker — Row Level Security
-- Every table is locked down so a user can only ever see or change rows
-- where user_id = auth.uid(). This is enforced by Postgres itself, not by
-- application code, so it holds even if a client bug or a leaked anon key
-- tries to read someone else's data.
-- ============================================================================

alter table public.profiles enable row level security;
alter table public.accounts enable row level security;
alter table public.categories enable row level security;
alter table public.transactions enable row level security;
alter table public.recurring_transactions enable row level security;
alter table public.budgets enable row level security;
alter table public.user_quick_add_defaults enable row level security;

-- profiles ---------------------------------------------------------------
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id);

-- accounts -----------------------------------------------------------------
drop policy if exists "accounts_all_own" on public.accounts;
create policy "accounts_all_own" on public.accounts
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- categories -----------------------------------------------------------------
drop policy if exists "categories_all_own" on public.categories;
create policy "categories_all_own" on public.categories
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- transactions -----------------------------------------------------------------
drop policy if exists "transactions_all_own" on public.transactions;
create policy "transactions_all_own" on public.transactions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- recurring_transactions ------------------------------------------------------
drop policy if exists "recurring_all_own" on public.recurring_transactions;
create policy "recurring_all_own" on public.recurring_transactions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- budgets -----------------------------------------------------------------
drop policy if exists "budgets_all_own" on public.budgets;
create policy "budgets_all_own" on public.budgets
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- user_quick_add_defaults ------------------------------------------------------
drop policy if exists "quick_add_defaults_all_own" on public.user_quick_add_defaults;
create policy "quick_add_defaults_all_own" on public.user_quick_add_defaults
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
