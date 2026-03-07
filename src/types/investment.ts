import type { Database } from "@/lib/supabase/types";

export type Category = Database["public"]["Tables"]["categories"]["Row"];
export type EtfPosition = Database["public"]["Tables"]["etf_positions"]["Row"];
export type EtfTransaction =
  Database["public"]["Tables"]["etf_transactions"]["Row"];
export type CertificadoAforro =
  Database["public"]["Tables"]["certificados_aforro"]["Row"];
export type PPR = Database["public"]["Tables"]["ppr"]["Row"];
export type BankAccount = Database["public"]["Tables"]["bank_accounts"]["Row"];
export type LiquidCash = Database["public"]["Tables"]["liquid_cash"]["Row"];
export type PatrimonySnapshot =
  Database["public"]["Tables"]["patrimony_snapshots"]["Row"];
export type Goal = Database["public"]["Tables"]["goals"]["Row"];
export type Alert = Database["public"]["Tables"]["alerts"]["Row"];

export interface CategorySummary {
  name: string;
  label: string;
  color: string;
  icon: string;
  totalInvested: number;
  currentValue: number;
  gainLoss: number;
  gainLossPercent: number;
}

export interface PatrimonySummary {
  totalValue: number;
  totalInvested: number;
  totalGainLoss: number;
  totalGainLossPercent: number;
  categories: CategorySummary[];
}
