"use client";

import { cn } from "@/lib/utils";
import { useExchangeRate } from "@/lib/hooks/use-exchange-rate";

function formatWithCurrency(value: number, currency: string): string {
  return new Intl.NumberFormat(currency === "EUR" ? "pt-PT" : "en-US", {
    style: "currency",
    currency,
  }).format(value);
}

interface CurrencyDisplayProps {
  value: number;
  className?: string;
  currency?: string;
  showEurConversion?: boolean;
}

export function CurrencyDisplay({
  value,
  className,
  currency = "EUR",
  showEurConversion = false,
}: CurrencyDisplayProps) {
  const needsConversion = currency !== "EUR" && showEurConversion;
  const rate = useExchangeRate(currency, "EUR");

  if (!needsConversion) {
    return (
      <span className={cn(className)}>
        {formatWithCurrency(value, currency)}
      </span>
    );
  }

  const eurValue = rate !== null ? value * rate : null;

  return (
    <span className={cn("inline-flex flex-col", className)}>
      <span>{formatWithCurrency(value, currency)}</span>
      {eurValue !== null && (
        <span className="text-xs text-muted-foreground">
          ~{formatWithCurrency(eurValue, "EUR")}
        </span>
      )}
    </span>
  );
}
