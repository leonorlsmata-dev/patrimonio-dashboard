export const ASSET_CATEGORIES = {
  etf: { label: "ETFs", color: "#3B82F6", icon: "TrendingUp" },
  certificado_aforro: {
    label: "Certificados de Aforro",
    color: "#10B981",
    icon: "Shield",
  },
  ppr: { label: "PPR", color: "#8B5CF6", icon: "PiggyBank" },
  conta_bancaria: {
    label: "Contas Bancárias",
    color: "#F59E0B",
    icon: "Landmark",
  },
  dinheiro_liquido: {
    label: "Dinheiro Líquido",
    color: "#6B7280",
    icon: "Wallet",
  },
  trade_republic_cash: {
    label: "Cash Trade Republic",
    color: "#EF4444",
    icon: "CircleDollarSign",
  },
  crypto: { label: "Crypto", color: "#F7931A", icon: "Bitcoin" },
} as const;

export const TAX_RATES = {
  capital_gains: 0.28,
  interest: 0.28,
  ppr_8_plus_years_retirement: 0.08,
  ppr_8_plus_years_other: 0.172,
  ppr_5_to_8_years: 0.215,
  ppr_under_5_years: 0.28,
} as const;

export const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: "LayoutDashboard" },
  { href: "/investimentos", label: "Investimentos", icon: "Briefcase" },
  { href: "/investimentos/etfs", label: "ETFs", icon: "TrendingUp" },
  { href: "/investimentos/crypto", label: "Crypto", icon: "Bitcoin" },
  {
    href: "/investimentos/certificados",
    label: "Certificados",
    icon: "Shield",
  },
  { href: "/investimentos/ppr", label: "PPR", icon: "PiggyBank" },
  { href: "/investimentos/contas", label: "Contas", icon: "Landmark" },
  { href: "/transacoes", label: "Transações", icon: "ArrowLeftRight" },
  { href: "/objetivos", label: "Objetivos", icon: "Target" },
  { href: "/projecoes", label: "Projeções", icon: "TrendingUp" },
  { href: "/impostos", label: "Impostos", icon: "Receipt" },
  { href: "/alertas", label: "Alertas", icon: "Bell" },
] as const;
