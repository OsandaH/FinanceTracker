-- ============================================================================
-- Finance Tracker — core schema
-- Run this in Supabase SQL Editor (or via `supabase db push`) as migration 1.
-- ============================================================================

create extension if not exists "uuid-ossp";

-- ----------------------------------------------------------------------------
-- profiles: one row per auth user (auth.users is managed by Supabase Auth)
-- ----------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  display_name text,
  currency text not null default 'LKR',
  theme_preference text not null default 'system' check (theme_preference in ('light', 'dark', 'system')),
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- accounts: cash / bank / card / savings etc, each with a running balance
-- ----------------------------------------------------------------------------
create table if not exists public.accounts (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  type text not null check (type in ('cash', 'bank', 'credit_card', 'debit_card', 'savings', 'other')),
  opening_balance numeric(14, 2) not null default 0,
  currency text not null default 'LKR',
  is_archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists accounts_user_id_idx on public.accounts (user_id);

-- ----------------------------------------------------------------------------
-- categories: income & expense categories, per-user, default + custom
-- ----------------------------------------------------------------------------
create table if not exists public.categories (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  type text not null check (type in ('income', 'expense')),
  icon text not null default 'circle',
  color text not null default '#1F6E5C',
  is_default boolean not null default false,
  is_archived boolean not null default false,
  created_at timestamptz not null default now(),
  unique (user_id, name, type)
);
create index if not exists categories_user_id_idx on public.categories (user_id);

-- ----------------------------------------------------------------------------
-- recurring_transactions: templates that generate real transactions
-- ----------------------------------------------------------------------------
create table if not exists public.recurring_transactions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users (id) on delete cascade,
  account_id uuid not null references public.accounts (id) on delete cascade,
  category_id uuid not null references public.categories (id) on delete restrict,
  type text not null check (type in ('income', 'expense')),
  amount numeric(14, 2) not null check (amount > 0),
  description text,
  frequency text not null check (frequency in ('daily', 'weekly', 'monthly', 'yearly')),
  start_date date not null,
  end_date date,
  next_occurrence date not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists recurring_user_id_idx on public.recurring_transactions (user_id);
create index if not exists recurring_next_occurrence_idx on public.recurring_transactions (next_occurrence) where active;

-- ----------------------------------------------------------------------------
-- transactions: the source of truth for every income/expense record
-- ----------------------------------------------------------------------------
create table if not exists public.transactions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users (id) on delete cascade,
  account_id uuid not null references public.accounts (id) on delete cascade,
  category_id uuid not null references public.categories (id) on delete restrict,
  type text not null check (type in ('income', 'expense')),
  amount numeric(14, 2) not null check (amount > 0),
  currency text not null default 'LKR',
  transaction_date date not null default current_date,
  description text,
  recurring_transaction_id uuid references public.recurring_transactions (id) on delete set null,
  client_generated_id uuid, -- lets offline-created rows be deduplicated on sync
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists transactions_user_id_idx on public.transactions (user_id);
create index if not exists transactions_date_idx on public.transactions (user_id, transaction_date desc);
create index if not exists transactions_account_idx on public.transactions (account_id);
create index if not exists transactions_category_idx on public.transactions (category_id);
create unique index if not exists transactions_client_id_unique
  on public.transactions (user_id, client_generated_id)
  where client_generated_id is not null; -- prevents duplicate inserts from the offline queue

-- ----------------------------------------------------------------------------
-- budgets: one monthly amount per category
-- ----------------------------------------------------------------------------
create table if not exists public.budgets (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users (id) on delete cascade,
  category_id uuid not null references public.categories (id) on delete cascade,
  amount numeric(14, 2) not null check (amount >= 0),
  month int not null check (month between 1 and 12),
  year int not null check (year between 2000 and 2100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, category_id, month, year)
);
create index if not exists budgets_user_period_idx on public.budgets (user_id, year, month);

-- ----------------------------------------------------------------------------
-- last-used category/account per type, for instant defaults on the add form
-- ----------------------------------------------------------------------------
create table if not exists public.user_quick_add_defaults (
  user_id uuid not null references auth.users (id) on delete cascade,
  type text not null check (type in ('income', 'expense')),
  category_id uuid references public.categories (id) on delete set null,
  account_id uuid references public.accounts (id) on delete set null,
  updated_at timestamptz not null default now(),
  primary key (user_id, type)
);

-- ----------------------------------------------------------------------------
-- updated_at triggers
-- ----------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_updated_at on public.accounts;
create trigger set_updated_at before update on public.accounts
  for each row execute procedure public.set_updated_at();

drop trigger if exists set_updated_at on public.transactions;
create trigger set_updated_at before update on public.transactions
  for each row execute procedure public.set_updated_at();

drop trigger if exists set_updated_at on public.recurring_transactions;
create trigger set_updated_at before update on public.recurring_transactions
  for each row execute procedure public.set_updated_at();

drop trigger if exists set_updated_at on public.budgets;
create trigger set_updated_at before update on public.budgets
  for each row execute procedure public.set_updated_at();
