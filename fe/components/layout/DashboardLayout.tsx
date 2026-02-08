import { ReactNode } from "react";

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="h-screen w-screen bg-[var(--color-surface)] flex overflow-hidden fixed inset-0">
      {children}
    </div>
  );
}