"use client";

import { useEffect, useState, useCallback } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { AlertForm, type AlertFormData } from "@/components/alerts/alert-form";
import { EmptyState } from "@/components/shared/empty-state";
import { CurrencyDisplay } from "@/components/shared/currency-display";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getSupabase } from "@/lib/supabase/client";
import {
  Bell,
  Plus,
  Trash2,
  TrendingUp,
  TrendingDown,
  Target,
  Briefcase,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import { toast } from "sonner";
import type { Alert } from "@/types/investment";

const ALERT_TYPE_CONFIG = {
  price_above: {
    label: "Preço acima de",
    icon: TrendingUp,
    color: "text-emerald-600 dark:text-emerald-400",
  },
  price_below: {
    label: "Preço abaixo de",
    icon: TrendingDown,
    color: "text-red-600 dark:text-red-400",
  },
  portfolio_value: {
    label: "Portfolio acima de",
    icon: Briefcase,
    color: "text-blue-600 dark:text-blue-400",
  },
  goal_milestone: {
    label: "Marco de objetivo",
    icon: Target,
    color: "text-purple-600 dark:text-purple-400",
  },
} as const;

export default function AlertasPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Alert | null>(null);

  const fetchAlerts = useCallback(async () => {
    try {
      const { data } = await getSupabase()
        .from("alerts")
        .select("*")
        .order("created_at", { ascending: false });
      setAlerts((data as Alert[] | null) ?? []);
    } catch {
      // Supabase connection may not be configured
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  async function handleSubmit(formData: AlertFormData) {
    const supabase = getSupabase();

    if (editing) {
      const { error } = await supabase
        .from("alerts")
        .update({
          type: formData.type,
          target_value: formData.target_value,
          reference_ticker: formData.reference_ticker || null,
          message: formData.message || null,
        })
        .eq("id", editing.id);
      if (error) throw error;
      toast.success("Alerta atualizado");
    } else {
      const { error } = await supabase.from("alerts").insert({
        type: formData.type,
        target_value: formData.target_value,
        reference_ticker: formData.reference_ticker || null,
        message: formData.message || null,
      });
      if (error) throw error;
      toast.success("Alerta criado");
    }

    setEditing(null);
    fetchAlerts();
  }

  async function handleDelete(id: string) {
    const { error } = await getSupabase()
      .from("alerts")
      .delete()
      .eq("id", id);
    if (error) {
      toast.error("Erro ao eliminar alerta");
      return;
    }
    toast.success("Alerta eliminado");
    fetchAlerts();
  }

  async function handleToggleActive(alert: Alert) {
    const { error } = await getSupabase()
      .from("alerts")
      .update({ is_active: !alert.is_active })
      .eq("id", alert.id);
    if (error) {
      toast.error("Erro ao atualizar alerta");
      return;
    }
    toast.success(alert.is_active ? "Alerta desativado" : "Alerta ativado");
    fetchAlerts();
  }

  const activeAlerts = alerts.filter((a) => a.is_active && !a.is_triggered);
  const triggeredAlerts = alerts.filter((a) => a.is_triggered);
  const inactiveAlerts = alerts.filter((a) => !a.is_active && !a.is_triggered);

  function renderAlertCard(alert: Alert) {
    const config = ALERT_TYPE_CONFIG[alert.type];
    const Icon = config.icon;

    return (
      <Card
        key={alert.id}
        className={!alert.is_active ? "opacity-60" : ""}
      >
        <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
          <div className="flex items-center gap-2">
            <Icon className={`h-4 w-4 ${config.color}`} />
            <CardTitle className="text-sm font-medium">
              {config.label}
            </CardTitle>
          </div>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={() => handleToggleActive(alert)}
              title={alert.is_active ? "Desativar" : "Ativar"}
            >
              {alert.is_active ? (
                <ToggleRight className="h-4 w-4 text-emerald-500" />
              ) : (
                <ToggleLeft className="h-4 w-4 text-muted-foreground" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={() => handleDelete(alert.id)}
            >
              <Trash2 className="h-3 w-3 text-destructive" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          <CurrencyDisplay
            value={Number(alert.target_value)}
            className="text-2xl font-bold"
          />
          {alert.reference_ticker && (
            <Badge variant="secondary" className="text-xs">
              {alert.reference_ticker}
            </Badge>
          )}
          {alert.message && (
            <p className="text-sm text-muted-foreground">{alert.message}</p>
          )}
          {alert.is_triggered && alert.triggered_at && (
            <p className="text-xs text-emerald-600 dark:text-emerald-400">
              Disparado em{" "}
              {new Intl.DateTimeFormat("pt-PT", {
                dateStyle: "short",
                timeStyle: "short",
              }).format(new Date(alert.triggered_at))}
            </p>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <PageHeader
          title="Alertas"
          description="Configura alertas para os teus investimentos"
        />
        <Button onClick={() => { setEditing(null); setFormOpen(true); }}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Alerta
        </Button>
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-36 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      ) : alerts.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="Sem Alertas"
          description="Cria o teu primeiro alerta para seres notificado sobre movimentos importantes."
          action={{
            label: "Criar Alerta",
            onClick: () => setFormOpen(true),
          }}
        />
      ) : (
        <div className="space-y-8">
          {activeAlerts.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-4">
                Ativos ({activeAlerts.length})
              </h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {activeAlerts.map(renderAlertCard)}
              </div>
            </div>
          )}

          {triggeredAlerts.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-4">
                Disparados ({triggeredAlerts.length})
              </h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {triggeredAlerts.map(renderAlertCard)}
              </div>
            </div>
          )}

          {inactiveAlerts.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-4">
                Inativos ({inactiveAlerts.length})
              </h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {inactiveAlerts.map(renderAlertCard)}
              </div>
            </div>
          )}
        </div>
      )}

      <AlertForm
        open={formOpen}
        onOpenChange={setFormOpen}
        onSubmit={handleSubmit}
        initialData={editing}
      />
    </div>
  );
}
