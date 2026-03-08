"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, Mail, Lock, LogIn, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { getSupabase } from "@/lib/supabase/client";
import { toast } from "sonner";

export function AuthForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const router = useRouter();

  async function handleAuth(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const supabase = getSupabase();
      
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        
        if (error) throw error;
        toast.success("Conta criada! Podes fazer login agora.");
        setIsSignUp(false);
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;
        toast.success("Login efetuado com sucesso!");
        router.push("/");
        router.refresh(); // Refresh to apply middleware session
      }
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message || "Ocorreu um erro na autenticação");
      } else {
        toast.error("Ocorreu um erro na autenticação");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-md shadow-lg border-primary/10">
      <CardHeader className="space-y-1 text-center">
        <div className="flex justify-center mb-4 text-primary">
          {isSignUp ? <UserPlus className="h-10 w-10" /> : <LogIn className="h-10 w-10" />}
        </div>
        <CardTitle className="text-2xl font-bold tracking-tight">
          {isSignUp ? "Criar Conta" : "Bem-vindo de volta"}
        </CardTitle>
        <CardDescription>
          {isSignUp 
            ? "Regista-te para acederes ao teu dashboard." 
            : "Introduz as tuas credenciais para entrar."}
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleAuth}>
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
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input 
                id="password" 
                type="password" 
                placeholder="••••••••" 
                className="pl-9"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required 
              />
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <Button className="w-full" type="submit" disabled={loading}>
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : isSignUp ? (
              "Registar Conta"
            ) : (
              "Entrar"
            )}
          </Button>
          <div className="text-sm text-center text-muted-foreground flex flex-col gap-2">
            <div>
              {isSignUp ? "Já tens uma conta? " : "Ainda não tens conta? "}
              <button 
                type="button" 
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-primary hover:underline font-medium"
              >
                {isSignUp ? "Terminar Login" : "Criar uma agora"}
              </button>
            </div>
            
            {!isSignUp && (
              <div>
                <Link href="/recuperar-password" className="text-primary hover:underline font-medium">
                  Esqueceste-te da password?
                </Link>
              </div>
            )}
          </div>
        </CardFooter>
      </form>
    </Card>
  );
}
