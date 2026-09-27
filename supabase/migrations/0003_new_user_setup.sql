-- ============================================================================
-- Finance Tracker — new user provisioning
-- When someone confirms a Supabase Auth signup, this trigger automatically:
--   1. creates their profiles row
--   2. creates a "Cash" starter account
--   3. seeds the default expense + income categories
-- so the dashboard is immediately usable with no empty-state setup.
-- ============================================================================

create or replace function public.handle_new_user()
returns trigger as $$
declare
  default_expense_categories text[] := array[
    'Food', 'Transport', 'Shopping', 'Bills & Utilities', 'Entertainment',
    'Education', 'Health', 'Fitness', 'Travel', 'Rent', 'Subscriptions',
    'Personal', 'Gifts', 'Other'
  ];
  default_income_categories text[] := array[
    'Salary', 'Freelance', 'Business', 'Allowance', 'Investment', 'Other'
  ];
  category_colors text[] := array[
    '#C9503C', '#D98A3D', '#C9A23D', '#7FA13D', '#2F8F5B',
    '#1F6E5C', '#2E7D9A', '#3D5FA1', '#6A4FA1', '#A14F8E',
    '#A14F63', '#8A6A4F', '#5C6570', '#7A7A78'
  ];
  cat text;
  i int := 1;
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);

  insert into public.accounts (user_id, name, type, opening_balance)
  values (new.id, 'Cash', 'cash', 0);

  foreach cat in array default_expense_categories loop
    insert into public.categories (user_id, name, type, color, is_default)
    values (new.id, cat, 'expense', category_colors[1 + ((i - 1) % array_length(category_colors, 1))], true);
    i := i + 1;
  end loop;

  i := 1;
  foreach cat in array default_income_categories loop
    insert into public.categories (user_id, name, type, color, is_default)
    values (new.id, cat, 'income', category_colors[1 + ((i - 1) % array_length(category_colors, 1))], true);
    i := i + 1;
  end loop;

  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
