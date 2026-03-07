"use client";

import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { TrendingUp, Shield, PiggyBank, Landmark, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

const actions = [
  {
    label: "Adicionar ETF",
    href: "/investimentos/etfs",
    icon: TrendingUp,
    color: "text-blue-500",
  },
  {
    label: "Atualizar Certificados",
    href: "/investimentos/certificados",
    icon: Shield,
    color: "text-emerald-500",
  },
  {
    label: "Atualizar PPR",
    href: "/investimentos/ppr",
    icon: PiggyBank,
    color: "text-violet-500",
  },
  {
    label: "Atualizar Contas",
    href: "/investimentos/contas",
    icon: Landmark,
    color: "text-amber-500",
  },
];

export function QuickActions() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Ações Rápidas</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-2">
        {actions.map((action) => (
          <Link
            key={action.href}
            href={action.href}
            className={cn(
              buttonVariants({ variant: "outline" }),
              "justify-start gap-3 h-11"
            )}
          >
            <action.icon className={`h-4 w-4 ${action.color}`} />
            <Plus className="h-3 w-3 text-muted-foreground" />
            {action.label}
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}
