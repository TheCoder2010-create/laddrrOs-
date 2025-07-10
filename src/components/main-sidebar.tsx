import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
} from '@/components/ui/dropdown-menu';
import { Sidebar, SidebarHeader, SidebarContent, SidebarFooter, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from '@/components/ui/sidebar';
import { LogOut, User, BarChart, CheckSquare, Vault, Check } from 'lucide-react';
import type { Role } from '@/hooks/use-role';
import { useRole } from '@/hooks/use-role';
import { getAllFeedback } from '@/services/feedback-service';
import { Badge } from '@/components/ui/badge';

interface MainSidebarProps {
  currentRole: Role;
  onSwitchRole: (role: Role | null) => void;
}

const roleUserMapping: Record<Role, { name: string; fallback: string; imageHint: string }> = {
  'Manager': { name: 'Alex Smith', fallback: 'AS', imageHint: 'manager' },
  'Team Lead': { name: 'Ben Carter', fallback: 'BC', imageHint: 'leader' },
  'Employee': { name: 'Casey Day', fallback: 'CD', imageHint: 'employee' },
  'HR Head': { name: 'Dana Evans', fallback: 'DE', imageHint: 'hr head' },
  'Voice – In Silence': { name: 'Anonymous', fallback: '??', imageHint: 'anonymous person' }
};

export default function MainSidebar({ currentRole, onSwitchRole }: MainSidebarProps) {
  const { availableRoles, refreshKey } = useRole();
  const currentUser = roleUserMapping[currentRole] || { name: 'User', fallback: 'U', imageHint: 'person' };
  const pathname = usePathname();
  const [feedbackCount, setFeedbackCount] = useState(0);

  useEffect(() => {
    if (currentRole !== 'HR Head') {
      setFeedbackCount(0);
      return;
    }

    const fetchFeedbackCount = async () => {
      try {
        const feedback = await getAllFeedback();
        setFeedbackCount(feedback.length);
      } catch (error) {
        console.error("Failed to fetch feedback count", error);
        setFeedbackCount(0);
      }
    };

    fetchFeedbackCount();
    
  }, [currentRole, refreshKey]); // Rerun when role or refreshKey changes


  const menuItems = [
    { href: '/', icon: <BarChart />, label: 'Dashboard' },
    { href: '/1-on-1', icon: <CheckSquare />, label: '1-on-1' },
    { href: '/voice-in-silence', icon: <User />, label: 'Voice – in Silence' },
  ];

  const hrMenuItems = [
    { href: '/vault', icon: <Vault />, label: 'Vault', badge: feedbackCount > 0 ? feedbackCount : null },
  ]

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <div className="flex items-center gap-3 cursor-pointer">
              <Avatar className="h-12 w-12">
                <AvatarImage src="https://placehold.co/100x100.png" alt={currentUser.name} data-ai-hint={`${currentUser.imageHint} avatar`} />
                <AvatarFallback>{currentUser.fallback}</AvatarFallback>
              </Avatar>
              <div className="flex flex-col items-start">
                <span className="font-semibold text-lg text-sidebar-foreground">{currentUser.name}</span>
                <span className="text-sm text-muted-foreground">{currentRole}</span>
              </div>
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56 ml-4">
            <DropdownMenuLabel>{currentUser.name}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
                <DropdownMenuLabel>Switch Role</DropdownMenuLabel>
                {availableRoles.map(role => (
                    <DropdownMenuItem key={role} onClick={() => onSwitchRole(role)}>
                         {currentRole === role ? (
                            <Check className="mr-2 h-4 w-4" />
                        ) : (
                            <span className="mr-2 h-4 w-4" />
                        )}
                        <span>{role}</span>
                    </DropdownMenuItem>
                ))}
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onSwitchRole(null)}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarHeader>
      <SidebarContent className="p-2">
        <SidebarMenu>
          {menuItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <Link href={item.href} passHref>
                <SidebarMenuButton asChild isActive={pathname === item.href}>
                  <div>
                    {item.icon}
                    <span>{item.label}</span>
                  </div>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          ))}
          {currentRole === 'HR Head' && hrMenuItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <Link href={item.href} passHref>
                <SidebarMenuButton asChild isActive={pathname === item.href}>
                  <div className="flex justify-between items-center w-full">
                    <div className="flex items-center gap-2">
                      {item.icon}
                      <span>{item.label}</span>
                    </div>
                    {item.badge && (
                       <Badge variant="secondary" className="h-6 w-6 flex items-center justify-center p-0 rounded-full">
                        {item.badge}
                      </Badge>
                    )}
                  </div>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={() => onSwitchRole(null)}>
              <LogOut />
              <span>Log out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
