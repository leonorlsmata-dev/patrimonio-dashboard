"use client";

import { cn } from "@/lib/utils";
import { formatPercentage } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface PercentageBadgeProps {
  value: number;
  className?: string;
}

export function PercentageBadge({ value, className }: PercentageBadgeProps) {
  const isPositive = value > 0;
  const isNegative = value < 0;
  const Icon = isPositive ? TrendingUp : isNegative ? TrendingDown : Minus;

  return (
    <Badge
      variant="secondary"
      className={cn(
        "gap-1 font-medium",
        isPositive && "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
        isNegative && "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
        !isPositive && !isNegative && "bg-muted text-muted-foreground",
        className
      )}
    >
      <Icon className="h-3 w-3" />
      {formatPercentage(Math.abs(value))}
    </Badge>
  );
}
