"use client";

import { useState } from "react";
import { Loader2, Mail, ArrowLeft } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { getSupabase } from "@/lib/supabase/client";
import { toast } from "sonner";
import Link from "next/link";

export function RecoverPasswordForm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const supabase = getSupabase();
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/atualizar-password`,
      });

      if (error) throw error;
      
      setSuccess(true);
      toast.success("Email de recuperação enviado com sucesso!");
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message || "Ocorreu um erro ao enviar o email");
      } else {
        toast.error("Ocorreu um erro.");
      }
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <Card className="w-full max-w-md shadow-lg border-primary/10">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold tracking-tight">Verifica o teu Email</CardTitle>
          <CardDescription>
            Enviámos um link de recuperação para <strong>{email}</strong>. Clica no link para definires uma nova password.
          </CardDescription>
        </CardHeader>
        <CardFooter>
          <Link href="/login" className={buttonVariants({ variant: "outline", className: "w-full" })}>
            Voltar para o Login
          </Link>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md shadow-lg border-primary/10">
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="text-2xl font-bold tracking-tight">Recuperar Password</CardTitle>
        <CardDescription>
          Introduz o teu email associado à conta para receberes um link de recuperação.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleReset}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input 
                id="email" 
                type="email" 
                placeholder="nome@exemplo.com" 
                className="pl-9"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required 
              />
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <Button className="w-full" type="submit" disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Enviar Email de Recuperação"}
          </Button>
          <Link href="/login" className={buttonVariants({ variant: "ghost", className: "w-full flex items-center gap-2" })}>
            <ArrowLeft className="w-4 h-4" /> Voltar ao Login
          </Link>
        </CardFooter>
      </form>
    </Card>
  );
}
