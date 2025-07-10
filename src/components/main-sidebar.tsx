import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Sidebar, SidebarHeader, SidebarContent, SidebarFooter, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from '@/components/ui/sidebar';
import { LogOut, User, BarChart, CheckSquare, Shield } from 'lucide-react';
import type { Role } from '@/hooks/use-role';

interface MainSidebarProps {
  currentRole: Role;
  onSwitchRole: () => void;
}

export default function MainSidebar({ currentRole, onSwitchRole }: MainSidebarProps) {
  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-12 w-12">
            <AvatarImage src="https://placehold.co/100x100.png" alt="Jane Doe" data-ai-hint="person avatar" />
            <AvatarFallback>JD</AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="font-semibold text-lg text-sidebar-foreground">Jane Doe</span>
            <span className="text-sm text-muted-foreground">{currentRole}</span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent className="p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton isActive>
              <BarChart />
              <span>Dashboard</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton>
              <CheckSquare />
              <span>Tasks</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
           <SidebarMenuItem>
            <SidebarMenuButton>
              <User />
              <span>Team</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
           <SidebarMenuItem>
            <SidebarMenuButton>
              <Shield />
              <span>Audit Log</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="p-2">
        <SidebarMenu>
            <SidebarMenuItem>
                <SidebarMenuButton onClick={onSwitchRole}>
                    <LogOut />
                    <span>Switch Role</span>
                </SidebarMenuButton>
            </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
