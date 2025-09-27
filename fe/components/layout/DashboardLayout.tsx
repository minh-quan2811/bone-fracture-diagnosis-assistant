import { ReactNode } from "react";

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="h-screen w-screen bg-gray-50 flex overflow-hidden fixed inset-0">
      {children}
    </div>
  );
}