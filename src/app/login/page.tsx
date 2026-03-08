import { AuthForm } from "@/components/auth/auth-form";
import { Landmark } from "lucide-react";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      {/* Brand / Logo Area */}
      <div className="mb-8 flex flex-col items-center justify-center text-center">
        <div className="bg-primary/10 p-4 rounded-full mb-4 ring-1 ring-primary/20">
          <Landmark className="h-8 w-8 text-primary" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
          Meu Património
        </h1>
        <p className="text-muted-foreground mt-2 max-w-sm">
          O teu dashboard financeiro pessoal, seguro e centralizado.
        </p>
      </div>

      <AuthForm />

      <p className="mt-8 text-xs text-muted-foreground text-center">
        &copy; {new Date().getFullYear()} Meu Património. Todos os direitos reservados.
      </p>
    </div>
  );
}
