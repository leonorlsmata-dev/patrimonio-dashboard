export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      categories: {
        Row: {
          id: string;
          name: string;
          display_name: string;
          icon: string | null;
          color: string | null;
          tax_rate: number | null;
          is_custom: boolean;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          display_name: string;
          icon?: string | null;
          color?: string | null;
          tax_rate?: number | null;
          is_custom?: boolean;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          display_name?: string;
          icon?: string | null;
          color?: string | null;
          tax_rate?: number | null;
          is_custom?: boolean;
          sort_order?: number;
          created_at?: string;
        };
      };
      generic_assets: {
        Row: {
          id: string;
          category_id: string;
          name: string;
          description: string | null;
          invested_amount: number;
          current_value: number;
          currency: string;
          start_date: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          category_id: string;
          name: string;
          description?: string | null;
          invested_amount?: number;
          current_value?: number;
          currency?: string;
          start_date?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          category_id?: string;
          name?: string;
          description?: string | null;
          invested_amount?: number;
          current_value?: number;
          currency?: string;
          start_date?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      etf_positions: {
        Row: {
          id: string;
          category_id: string;
          ticker: string;
          name: string;
          broker: string;
          shares: number;
          avg_buy_price: number;
          total_invested: number;
          currency: string;
          current_price: number | null;
          current_value: number | null;
          last_price_update: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          category_id: string;
          ticker: string;
          name: string;
          broker?: string;
          shares: number;
          avg_buy_price: number;
          total_invested: number;
          currency?: string;
          current_price?: number | null;
          current_value?: number | null;
          last_price_update?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          category_id?: string;
          ticker?: string;
          name?: string;
          broker?: string;
          shares?: number;
          avg_buy_price?: number;
          total_invested?: number;
          currency?: string;
          current_price?: number | null;
          current_value?: number | null;
          last_price_update?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      etf_transactions: {
        Row: {
          id: string;
          etf_position_id: string;
          type: "buy" | "sell";
          shares: number;
          price_per_share: number;
          total_amount: number;
          fees: number;
          transaction_date: string;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          etf_position_id: string;
          type: "buy" | "sell";
          shares: number;
          price_per_share: number;
          total_amount: number;
          fees?: number;
          transaction_date: string;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          etf_position_id?: string;
          type?: "buy" | "sell";
          shares?: number;
          price_per_share?: number;
          total_amount?: number;
          fees?: number;
          transaction_date?: string;
          notes?: string | null;
          created_at?: string;
        };
      };
      etf_price_history: {
        Row: {
          id: string;
          ticker: string;
          price: number;
          currency: string;
          date: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          ticker: string;
          price: number;
          currency?: string;
          date: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          ticker?: string;
          price?: number;
          currency?: string;
          date?: string;
          created_at?: string;
        };
      };
      certificados_aforro: {
        Row: {
          id: string;
          category_id: string;
          series: string;
          invested_amount: number;
          current_value: number;
          interest_rate: number | null;
          subscription_date: string;
          maturity_date: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          category_id: string;
          series: string;
          invested_amount: number;
          current_value: number;
          interest_rate?: number | null;
          subscription_date: string;
          maturity_date?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          category_id?: string;
          series?: string;
          invested_amount?: number;
          current_value?: number;
          interest_rate?: number | null;
          subscription_date?: string;
          maturity_date?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      ppr: {
        Row: {
          id: string;
          category_id: string;
          name: string;
          provider: string;
          invested_amount: number;
          current_value: number;
          risk_profile: "conservador" | "moderado" | "dinamico" | null;
          start_date: string;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          category_id: string;
          name: string;
          provider: string;
          invested_amount: number;
          current_value: number;
          risk_profile?: "conservador" | "moderado" | "dinamico" | null;
          start_date: string;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          category_id?: string;
          name?: string;
          provider?: string;
          invested_amount?: number;
          current_value?: number;
          risk_profile?: "conservador" | "moderado" | "dinamico" | null;
          start_date?: string;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      bank_accounts: {
        Row: {
          id: string;
          category_id: string;
          bank_name: string;
          account_type: "corrente" | "poupanca";
          balance: number;
          interest_rate: number;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          category_id: string;
          bank_name: string;
          account_type: "corrente" | "poupanca";
          balance: number;
          interest_rate?: number;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          category_id?: string;
          bank_name?: string;
          account_type?: "corrente" | "poupanca";
          balance?: number;
          interest_rate?: number;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      liquid_cash: {
        Row: {
          id: string;
          category_id: string;
          description: string;
          amount: number;
          location: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          category_id: string;
          description?: string;
          amount: number;
          location?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          category_id?: string;
          description?: string;
          amount?: number;
          location?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      patrimony_snapshots: {
        Row: {
          id: string;
          date: string;
          total_value: number;
          etf_value: number;
          certificados_value: number;
          ppr_value: number;
          bank_value: number;
          cash_value: number;
          trade_republic_cash_value: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          date: string;
          total_value: number;
          etf_value?: number;
          certificados_value?: number;
          ppr_value?: number;
          bank_value?: number;
          cash_value?: number;
          trade_republic_cash_value?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          date?: string;
          total_value?: number;
          etf_value?: number;
          certificados_value?: number;
          ppr_value?: number;
          bank_value?: number;
          cash_value?: number;
          trade_republic_cash_value?: number;
          created_at?: string;
        };
      };
      goals: {
        Row: {
          id: string;
          name: string;
          target_amount: number;
          current_amount: number;
          target_date: string | null;
          category: string | null;
          icon: string | null;
          color: string | null;
          is_completed: boolean;
          completed_at: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          target_amount: number;
          current_amount?: number;
          target_date?: string | null;
          category?: string | null;
          icon?: string | null;
          color?: string | null;
          is_completed?: boolean;
          completed_at?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          target_amount?: number;
          current_amount?: number;
          target_date?: string | null;
          category?: string | null;
          icon?: string | null;
          color?: string | null;
          is_completed?: boolean;
          completed_at?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      alerts: {
        Row: {
          id: string;
          type: "price_above" | "price_below" | "goal_milestone" | "portfolio_value";
          target_value: number;
          reference_ticker: string | null;
          reference_goal_id: string | null;
          message: string | null;
          is_triggered: boolean;
          triggered_at: string | null;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          type: "price_above" | "price_below" | "goal_milestone" | "portfolio_value";
          target_value: number;
          reference_ticker?: string | null;
          reference_goal_id?: string | null;
          message?: string | null;
          is_triggered?: boolean;
          triggered_at?: string | null;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          type?: "price_above" | "price_below" | "goal_milestone" | "portfolio_value";
          target_value?: number;
          reference_ticker?: string | null;
          reference_goal_id?: string | null;
          message?: string | null;
          is_triggered?: boolean;
          triggered_at?: string | null;
          is_active?: boolean;
          created_at?: string;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}
