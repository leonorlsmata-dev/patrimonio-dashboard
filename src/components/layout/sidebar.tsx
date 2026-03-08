"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Briefcase,
  TrendingUp,
  Shield,
  PiggyBank,
  Landmark,
  Target,
  Receipt,
  Bell,
  Bitcoin,
  ArrowLeftRight,
  LogOut,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { NAV_ITEMS } from "@/lib/constants";
import { getSupabase } from "@/lib/supabase/client";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  LayoutDashboard,
  Briefcase,
  TrendingUp,
  Shield,
  PiggyBank,
  Landmark,
  Target,
  Receipt,
  Bell,
  Bitcoin,
  ArrowLeftRight,
};

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    async function getUser() {
      const { data: { user } } = await getSupabase().auth.getUser();
      if (user) {
        setUserEmail(user.email ?? null);
      }
    }
    getUser();
  }, []);

  async function handleLogout() {
    await getSupabase().auth.signOut();
    router.push("/login"); // Força ida para o login
    router.refresh(); // Dispara o middleware
  }

  return (
    <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 z-40">
      <div className="flex flex-col flex-grow border-r bg-card overflow-y-auto">
        <div className="flex h-14 items-center shrink-0 px-6 border-b">
          <h1 className="text-xl font-bold tracking-tight">
            Meu Património
          </h1>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = iconMap[item.icon];
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                {Icon && <Icon className="h-4 w-4" />}
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* User / Logout Area */}
        {userEmail && (
          <div className="p-4 border-t mt-auto">
            <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-accent/50 mb-2">
              <div className="p-1 bg-primary/10 rounded-full text-primary">
                <User className="w-4 h-4" />
              </div>
              <span className="text-sm font-medium truncate flex-1" title={userEmail}>
                {userEmail}
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10"
            >
              <LogOut className="h-4 w-4" />
              Terminar Sessão
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
