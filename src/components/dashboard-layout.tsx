import type { Role } from '@/hooks/use-role';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import MainSidebar from '@/components/main-sidebar';
import Dashboard from '@/components/dashboard';

interface DashboardLayoutProps {
  role: Role;
  onSwitchRole: (role: Role | null) => void;
}

export default function DashboardLayout({ role, onSwitchRole }: DashboardLayoutProps) {
  return (
    <SidebarProvider>
      <MainSidebar currentRole={role} onSwitchRole={onSwitchRole} />
      <SidebarInset>
        <Dashboard role={role} />
      </SidebarInset>
    </SidebarProvider>
  );
}
