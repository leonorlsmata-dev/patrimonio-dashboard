"use client";

import { CurrencyDisplay } from "@/components/shared/currency-display";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash2, CheckCircle2 } from "lucide-react";
import { formatDate } from "@/lib/utils";
import type { Goal } from "@/types/investment";

interface GoalCardProps {
  goal: Goal;
  onEdit: (goal: Goal) => void;
  onDelete: (id: string) => void;
  onToggleComplete: (goal: Goal) => void;
}

export function GoalCard({
  goal,
  onEdit,
  onDelete,
  onToggleComplete,
}: GoalCardProps) {
  const target = Number(goal.target_amount);
  const current = Number(goal.current_amount);
  const percentage = target > 0 ? Math.min((current / target) * 100, 100) : 0;
  const remaining = Math.max(target - current, 0);

  return (
    <Card className={goal.is_completed ? "opacity-75" : ""}>
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <div className="flex items-center gap-2">
          <div
            className="h-3 w-3 rounded-full shrink-0"
            style={{ backgroundColor: goal.color ?? "#3B82F6" }}
          />
          <CardTitle className="text-base">{goal.name}</CardTitle>
        </div>
        <div className="flex gap-1">
          {!goal.is_completed && (
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={() => onToggleComplete(goal)}
              title="Marcar como concluído"
            >
              <CheckCircle2 className="h-3 w-3 text-emerald-500" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => onEdit(goal)}
          >
            <Pencil className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => onDelete(goal.id)}
          >
            <Trash2 className="h-3 w-3 text-destructive" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-baseline justify-between">
          <CurrencyDisplay
            value={current}
            className="text-2xl font-bold"
          />
          <span className="text-sm text-muted-foreground">
            de <CurrencyDisplay value={target} />
          </span>
        </div>

        {/* Progress bar */}
        <div className="space-y-1">
          <div className="h-2.5 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${percentage}%`,
                backgroundColor: goal.color ?? "#3B82F6",
              }}
            />
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{percentage.toFixed(1)}%</span>
            <span>
              Faltam <CurrencyDisplay value={remaining} />
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between text-sm">
          {goal.category && (
            <Badge variant="secondary" className="text-xs">
              {goal.category}
            </Badge>
          )}
          {goal.is_completed && (
            <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300 text-xs">
              Concluído
            </Badge>
          )}
          {goal.target_date && !goal.is_completed && (
            <span className="text-xs text-muted-foreground ml-auto">
              Meta: {formatDate(goal.target_date)}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
