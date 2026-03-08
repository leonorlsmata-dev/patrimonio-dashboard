"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CurrencyDisplay } from "@/components/shared/currency-display";
import { PercentageBadge } from "@/components/shared/percentage-badge";
import { Pencil, Trash2, History } from "lucide-react";
import { TransactionHistory } from "./transaction-history";
import type { CryptoPosition } from "@/types/investment";

interface CryptoCardProps {
  position: CryptoPosition;
  onEdit: (position: CryptoPosition) => void;
  onDelete: (id: string) => void;
}

export function CryptoCard({ position, onEdit, onDelete }: CryptoCardProps) {
  const [historyOpen, setHistoryOpen] = useState(false);
  const currentValue =
    Number(position.current_value) ||
    Number(position.shares) *
      Number(position.current_price ?? position.avg_buy_price);
  const gainLoss = currentValue - Number(position.total_invested);
  const gainLossPercent =
    Number(position.total_invested) > 0
      ? (gainLoss / Number(position.total_invested)) * 100
      : 0;

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <div>
          <CardTitle className="text-base font-semibold">
            {position.symbol}
          </CardTitle>
          <p className="text-sm text-muted-foreground line-clamp-1">
            {position.name}
          </p>
        </div>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => setHistoryOpen(true)}
          >
            <History className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => onEdit(position)}
          >
            <Pencil className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => onDelete(position.id)}
          >
            <Trash2 className="h-3 w-3 text-destructive" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-baseline justify-between">
          <CurrencyDisplay
            value={currentValue}
            className="text-2xl font-bold"
          />
          <PercentageBadge value={gainLossPercent} />
        </div>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <span className="text-muted-foreground">Unidades</span>
            <p className="font-medium">
              {Number(position.shares).toFixed(8)}
            </p>
          </div>
          <div>
            <span className="text-muted-foreground">Preço médio</span>
            <p className="font-medium">
              <CurrencyDisplay value={Number(position.avg_buy_price)} />
            </p>
          </div>
          <div>
            <span className="text-muted-foreground">Investido (USD)</span>
            <p className="font-medium">
              <CurrencyDisplay value={Number(position.total_invested)} />
            </p>
          </div>
          <div>
            <span className="text-muted-foreground">Ganho/Perda</span>
            <p
              className={
                gainLoss >= 0
                  ? "font-medium text-emerald-600 dark:text-emerald-400"
                  : "font-medium text-red-600 dark:text-red-400"
              }
            >
              <CurrencyDisplay value={gainLoss} />
            </p>
          </div>
        </div>
      </CardContent>
      <TransactionHistory
        open={historyOpen}
        onOpenChange={setHistoryOpen}
        positionId={position.id}
        positionName={`${position.symbol} - ${position.name}`}
        tableName="crypto_transactions"
        foreignKey="crypto_position_id"
      />
    </Card>
  );
}
