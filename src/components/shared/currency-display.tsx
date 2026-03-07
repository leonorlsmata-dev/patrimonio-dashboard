"use client";

import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface CurrencyDisplayProps {
  value: number;
  className?: string;
}

export function CurrencyDisplay({ value, className }: CurrencyDisplayProps) {
  return <span className={cn(className)}>{formatCurrency(value)}</span>;
}
