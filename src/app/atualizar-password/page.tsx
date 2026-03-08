import { UpdatePasswordForm } from "@/components/auth/update-password-form";
import { Landmark } from "lucide-react";

export default function AtualizarPasswordPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      <div className="mb-8 flex flex-col items-center justify-center text-center">
        <div className="bg-primary/10 p-4 rounded-full mb-4 ring-1 ring-primary/20">
          <Landmark className="h-8 w-8 text-primary" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
          Meu Património
        </h1>
      </div>

      <UpdatePasswordForm />
    </div>
  );
}
