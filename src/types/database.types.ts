export type TransactionType = "income" | "expense";
export type AccountType = "cash" | "bank" | "credit_card" | "debit_card" | "savings" | "other";
export type Frequency = "daily" | "weekly" | "monthly" | "yearly";

export interface Profile {
  id: string;
  email: string;
  display_name: string | null;
  currency: string;
  theme_preference: "light" | "dark" | "system";
  created_at: string;
}

export interface Account {
  id: string;
  user_id: string;
  name: string;
  type: AccountType;
  opening_balance: number;
  currency: string;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

export interface AccountBalance {
  account_id: string;
  user_id: string;
  name: string;
  type: AccountType;
  currency: string;
  is_archived: boolean;
  opening_balance: number;
  balance: number;
}

export interface Category {
  id: string;
  user_id: string;
  name: string;
  type: TransactionType;
  icon: string;
  color: string;
  is_default: boolean;
  is_archived: boolean;
  created_at: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  account_id: string;
  category_id: string;
  type: TransactionType;
  amount: number;
  currency: string;
  transaction_date: string;
  description: string | null;
  recurring_transaction_id: string | null;
  client_generated_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface TransactionWithRelations extends Transaction {
  category: Pick<Category, "id" | "name" | "color" | "icon"> | null;
  account: Pick<Account, "id" | "name" | "type"> | null;
}

export interface RecurringTransaction {
  id: string;
  user_id: string;
  account_id: string;
  category_id: string;
  type: TransactionType;
  amount: number;
  description: string | null;
  frequency: Frequency;
  start_date: string;
  end_date: string | null;
  next_occurrence: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Budget {
  id: string;
  user_id: string;
  category_id: string;
  amount: number;
  month: number;
  year: number;
  created_at: string;
  updated_at: string;
}

export interface QuickAddDefaults {
  user_id: string;
  type: TransactionType;
  category_id: string | null;
  account_id: string | null;
  updated_at: string;
}

// Minimal Supabase Database generic — enough for the typed client without
// requiring the full `supabase gen types` codegen step. You can replace
// this file with a generated one later (see README) for full type safety.
export interface Database {
  public: {
    Tables: {
      profiles: { Row: Profile; Insert: Partial<Profile>; Update: Partial<Profile> };
      accounts: { Row: Account; Insert: Partial<Account>; Update: Partial<Account> };
      categories: { Row: Category; Insert: Partial<Category>; Update: Partial<Category> };
      transactions: { Row: Transaction; Insert: Partial<Transaction>; Update: Partial<Transaction> };
      recurring_transactions: {
        Row: RecurringTransaction;
        Insert: Partial<RecurringTransaction>;
        Update: Partial<RecurringTransaction>;
      };
      budgets: { Row: Budget; Insert: Partial<Budget>; Update: Partial<Budget> };
      user_quick_add_defaults: {
        Row: QuickAddDefaults;
        Insert: Partial<QuickAddDefaults>;
        Update: Partial<QuickAddDefaults>;
      };
    };
    Views: {
      account_balances: { Row: AccountBalance };
    };
  };
}
