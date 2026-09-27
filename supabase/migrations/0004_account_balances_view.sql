-- ============================================================================
-- Finance Tracker — computed account balances
-- A view instead of a stored balance column, so balances can never drift
-- out of sync with the transactions that produced them.
-- ============================================================================

create or replace view public.account_balances as
select
  a.id as account_id,
  a.user_id,
  a.name,
  a.type,
  a.currency,
  a.is_archived,
  a.opening_balance
    + coalesce(sum(case when t.type = 'income' then t.amount else 0 end), 0)
    - coalesce(sum(case when t.type = 'expense' then t.amount else 0 end), 0)
    as balance
from public.accounts a
left join public.transactions t on t.account_id = a.id
group by a.id;

-- Views don't carry RLS from their base tables automatically in all
-- Supabase configurations, so this is defined with security_invoker so
-- it runs as the querying user and inherits their RLS on `accounts`.
alter view public.account_balances set (security_invoker = true);
