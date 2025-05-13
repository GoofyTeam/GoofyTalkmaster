import { cn } from "@/lib/utils";
import type { ReactNode } from "react";
interface LayoutProps {
  children: ReactNode;
  className?: string;
}

export const MainLayout = ({ children, className }: LayoutProps) => {
  return (
    <div className={cn("flex min-h-screen flex-col", className)}>
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
};
