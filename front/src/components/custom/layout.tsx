import { Header } from "@/components/custom/header";
import { Toaster } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";
import { useMatchRoute } from "@tanstack/react-router";
import type { ReactNode } from "react";

interface LayoutProps {
  children: ReactNode;
  className?: string;
}

export const MainLayout = ({ children, className }: LayoutProps) => {
  const matchRoute = useMatchRoute();
  const isForgot = matchRoute({ to: "/auth/forgot-password" });
  const isLogin = matchRoute({ to: "/auth/login" });
  const isRegister = matchRoute({ to: "/auth/register" });
  const displayHeader = !isForgot && !isLogin && !isRegister;

  return (
    <div className={cn("min-h-screen", className)}>
      {displayHeader ? <Header /> : null}
      <main>{children}</main>
      <Toaster />
    </div>
  );
};
