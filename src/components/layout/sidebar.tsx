"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { NAV_ITEMS } from "@/lib/constants";
import { Separator } from "@/components/ui/separator";

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
};

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 z-40">
      <div className="flex flex-col flex-grow border-r bg-card pt-5 pb-4 overflow-y-auto">
        <div className="flex items-center flex-shrink-0 px-6">
          <h1 className="text-xl font-bold tracking-tight">
            Meu Património
          </h1>
        </div>
        <Separator className="mt-5" />
        <nav className="flex-1 mt-5 px-3 space-y-1">
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
      </div>
    </aside>
  );
}
