"use client";

import { useEffect, useState, useCallback } from "react";
import { PageHeader } from "@/components/layout/page-header";
import {
  AccountForm,
  type AccountFormData,
} from "@/components/investments/account-form";
import {
  CashForm,
  type CashFormData,
} from "@/components/investments/cash-form";
import { EmptyState } from "@/components/shared/empty-state";
import { CurrencyDisplay } from "@/components/shared/currency-display";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { getSupabase } from "@/lib/supabase/client";
import { Landmark, Wallet, Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { BankAccount, LiquidCash } from "@/types/investment";

export default function ContasPage() {
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [cash, setCash] = useState<LiquidCash[]>([]);
  const [loading, setLoading] = useState(true);
  const [accountFormOpen, setAccountFormOpen] = useState(false);
  const [cashFormOpen, setCashFormOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<BankAccount | null>(null);
  const [editingCash, setEditingCash] = useState<LiquidCash | null>(null);

  const fetchAll = useCallback(async () => {
    try {
      const supabase = getSupabase();
      const [accountsRes, cashRes] = await Promise.all([
        supabase.from("bank_accounts").select("*").order("created_at", { ascending: false }),
        supabase.from("liquid_cash").select("*").order("created_at", { ascending: false }),
      ]);
      setAccounts((accountsRes.data as BankAccount[] | null) ?? []);
      setCash((cashRes.data as LiquidCash[] | null) ?? []);
    } catch {
      setAccounts([]);
      setCash([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  async function handleAccountSubmit(formData: AccountFormData) {
    const supabase = getSupabase();
    const { data: category } = await supabase
      .from("categories")
      .select("id")
      .eq("name", "conta_bancaria")
      .single();
    if (!category) throw new Error("Category not found");

    if (editingAccount) {
      const { error } = await supabase
        .from("bank_accounts")
        .update({ ...formData, notes: formData.notes || null, updated_at: new Date().toISOString() })
        .eq("id", editingAccount.id);
      if (error) throw error;
      toast.success("Conta atualizada");
    } else {
      const { error } = await supabase.from("bank_accounts").insert({
        category_id: category.id,
        ...formData,
        notes: formData.notes || null,
      });
      if (error) throw error;
      toast.success("Conta adicionada");
    }
    setEditingAccount(null);
    fetchAll();
  }

  async function handleCashSubmit(formData: CashFormData) {
    const supabase = getSupabase();
    const { data: category } = await supabase
      .from("categories")
      .select("id")
      .eq("name", "dinheiro_liquido")
      .single();
    if (!category) throw new Error("Category not found");

    if (editingCash) {
      const { error } = await supabase
        .from("liquid_cash")
        .update({
          description: formData.description,
          amount: formData.amount,
          location: formData.location || null,
          notes: formData.notes || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", editingCash.id);
      if (error) throw error;
      toast.success("Dinheiro atualizado");
    } else {
      const { error } = await supabase.from("liquid_cash").insert({
        category_id: category.id,
        description: formData.description,
        amount: formData.amount,
        location: formData.location || null,
        notes: formData.notes || null,
      });
      if (error) throw error;
      toast.success("Dinheiro adicionado");
    }
    setEditingCash(null);
    fetchAll();
  }

  async function handleDeleteAccount(id: string) {
    const { error } = await getSupabase().from("bank_accounts").delete().eq("id", id);
    if (error) { toast.error("Erro ao eliminar"); return; }
    toast.success("Conta eliminada");
    fetchAll();
  }

  async function handleDeleteCash(id: string) {
    const { error } = await getSupabase().from("liquid_cash").delete().eq("id", id);
    if (error) { toast.error("Erro ao eliminar"); return; }
    toast.success("Dinheiro eliminado");
    fetchAll();
  }

  return (
    <div>
      <PageHeader
        title="Contas Bancárias"
        description="Gestão das tuas contas bancárias e dinheiro líquido"
      />

      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Contas Bancárias</h2>
          <Button onClick={() => { setEditingAccount(null); setAccountFormOpen(true); }}>
            <Plus className="mr-2 h-4 w-4" />
            Adicionar Conta
          </Button>
        </div>

        {loading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2].map((i) => (
              <div key={i} className="h-32 animate-pulse rounded-lg bg-muted" />
            ))}
          </div>
        ) : accounts.length === 0 ? (
          <EmptyState
            icon={Landmark}
            title="Sem Contas"
            description="Adiciona a tua primeira conta bancária."
            action={{ label: "Adicionar Conta", onClick: () => setAccountFormOpen(true) }}
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {accounts.map((acc) => (
              <Card key={acc.id}>
                <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                  <div>
                    <CardTitle className="text-base">{acc.bank_name}</CardTitle>
                    <Badge variant="secondary" className="text-xs mt-1">
                      {acc.account_type === "corrente" ? "Corrente" : "Poupança"}
                    </Badge>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon-xs" onClick={() => { setEditingAccount(acc); setAccountFormOpen(true); }}>
                      <Pencil className="h-3 w-3" />
                    </Button>
                    <Button variant="ghost" size="icon-xs" onClick={() => handleDeleteAccount(acc.id)}>
                      <Trash2 className="h-3 w-3 text-destructive" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <CurrencyDisplay value={Number(acc.balance)} className="text-2xl font-bold" />
                  {Number(acc.interest_rate) > 0 && (
                    <p className="text-sm text-muted-foreground mt-1">
                      Taxa: {Number(acc.interest_rate).toFixed(3)}%
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Separator className="my-8" />

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Dinheiro Líquido</h2>
          <Button onClick={() => { setEditingCash(null); setCashFormOpen(true); }}>
            <Plus className="mr-2 h-4 w-4" />
            Adicionar
          </Button>
        </div>

        {loading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div className="h-32 animate-pulse rounded-lg bg-muted" />
          </div>
        ) : cash.length === 0 ? (
          <EmptyState
            icon={Wallet}
            title="Sem Dinheiro Líquido"
            description="Adiciona o teu dinheiro em espécie."
            action={{ label: "Adicionar", onClick: () => setCashFormOpen(true) }}
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {cash.map((c) => (
              <Card key={c.id}>
                <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                  <CardTitle className="text-base">{c.description}</CardTitle>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon-xs" onClick={() => { setEditingCash(c); setCashFormOpen(true); }}>
                      <Pencil className="h-3 w-3" />
                    </Button>
                    <Button variant="ghost" size="icon-xs" onClick={() => handleDeleteCash(c.id)}>
                      <Trash2 className="h-3 w-3 text-destructive" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <CurrencyDisplay value={Number(c.amount)} className="text-2xl font-bold" />
                  {c.location && (
                    <p className="text-sm text-muted-foreground mt-1">{c.location}</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <AccountForm
        open={accountFormOpen}
        onOpenChange={setAccountFormOpen}
        onSubmit={handleAccountSubmit}
        initialData={editingAccount}
      />
      <CashForm
        open={cashFormOpen}
        onOpenChange={setCashFormOpen}
        onSubmit={handleCashSubmit}
        initialData={editingCash}
      />
    </div>
  );
}
