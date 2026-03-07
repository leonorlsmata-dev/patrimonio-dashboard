"use client";

import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MobileNav } from "./mobile-nav";

export function Header() {
  const { theme, setTheme } = useTheme();

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 lg:px-6">
      <MobileNav />
      <div className="flex-1 lg:hidden">
        <h1 className="text-lg font-bold tracking-tight">Meu Património</h1>
      </div>
      <div className="flex-1 hidden lg:block" />
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      >
        <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
        <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        <span className="sr-only">Alternar tema</span>
      </Button>
    </header>
  );
}
