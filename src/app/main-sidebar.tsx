
import { useState, useEffect, useCallback } from 'react';
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
import { LogOut, User, BarChart, CheckSquare, Vault, Check, ListTodo, MessageSquare, ShieldQuestion } from 'lucide-react';
import type { Role } from '@/hooks/use-role';
import { useRole } from '@/hooks/use-role';
import { getAllFeedback, getOneOnOneHistory } from '@/services/feedback-service';
import { Badge } from '@/components/ui/badge';
import { roleUserMapping } from '@/lib/role-mapping';


interface MainSidebarProps {
  currentRole: Role;
  onSwitchRole: (role: Role | null) => void;
}

export default function MainSidebar({ currentRole, onSwitchRole }: MainSidebarProps) {
  const { availableRoles } = useRole();
  const currentUser = roleUserMapping[currentRole] || { name: 'User', fallback: 'U', imageHint: 'person' };
  const pathname = usePathname();
  const [vaultFeedbackCount, setVaultFeedbackCount] = useState(0);
  const [actionItemCount, setActionItemCount] = useState(0);
  const [messageCount, setMessageCount] = useState(0);

  const fetchFeedbackCounts = useCallback(async () => {
    if (!currentRole) return;
    try {
      // Vault count for HR Head
      if (currentRole === 'HR Head') {
        const feedback = await getAllFeedback();
        const newCount = feedback.filter(c => !c.viewed && c.status === 'Open' && c.source === 'Voice – In Silence').length;
        setVaultFeedbackCount(newCount);
      } else {
        setVaultFeedbackCount(0);
      }
      
      // Action items for assignees
      const feedback = await getAllFeedback();
      const assignedCount = feedback.filter(f => f.assignedTo?.includes(currentRole) && f.status !== 'Resolved').length;
      setActionItemCount(assignedCount);

      // Messages count logic
      const history = await getOneOnOneHistory();
      let count = 0;
      
      // Count critical insight escalations
      const insightStatusesToCount: string[] = [];
      if (currentRole === 'Employee') insightStatusesToCount.push('pending_employee_acknowledgement');
      if (currentRole === 'AM') insightStatusesToCount.push('pending_am_review');
      if (currentRole === 'Manager') insightStatusesToCount.push('pending_manager_review');
      if (currentRole === 'HR Head') insightStatusesToCount.push('pending_hr_review', 'pending_final_hr_action');

      count += history.filter(h => {
          const insight = h.analysis.criticalCoachingInsight;
          if (!insight || !insight.status) return false;
          
          if (currentRole === 'Employee') {
              return h.employeeName === currentUser.name && insightStatusesToCount.includes(insight.status);
          }
          return insightStatusesToCount.includes(insight.status);
      }).length;

      // Count declined coaching recommendation escalations for AM
      if (currentRole === 'AM') {
          count += history.flatMap(h => h.analysis.coachingRecommendations)
                           .filter(rec => rec.status === 'pending_am_review').length;
      }
      
      setMessageCount(count);

    } catch (error) {
      console.error("Failed to fetch feedback counts", error);
      setVaultFeedbackCount(0);
      setActionItemCount(0);
      setMessageCount(0);
    }
  }, [currentRole, currentUser.name]);


  useEffect(() => {
    fetchFeedbackCounts();

    const handleDataUpdate = () => {
        fetchFeedbackCounts();
    };

    window.addEventListener('storage', handleDataUpdate);
    window.addEventListener('feedbackUpdated', handleDataUpdate);

    return () => {
        window.removeEventListener('storage', handleDataUpdate);
        window.removeEventListener('feedbackUpdated', handleDataUpdate);
    };
  }, [fetchFeedbackCounts]);


  const menuItems = [
    { href: '/', icon: <BarChart />, label: 'Dashboard' },
    { href: '/1-on-1', icon: <CheckSquare />, label: '1-on-1' },
    { href: '/my-concerns', icon: <ShieldQuestion />, label: 'My Concerns' },
    { href: '/messages', icon: <MessageSquare />, label: 'Messages', badge: messageCount > 0 ? messageCount : null, badgeVariant: 'destructive' as const },
    { href: '/voice-in-silence', icon: <User />, label: 'Voice – in Silence' },
  ];

  const hrMenuItems = [
    { href: '/vault', icon: <Vault />, label: 'Vault', badge: vaultFeedbackCount > 0 ? vaultFeedbackCount : null, badgeVariant: 'secondary' as const },
  ]

  const assigneeMenuItems = [
    { href: '/action-items', icon: <ListTodo />, label: 'Action Items', badge: actionItemCount > 0 ? actionItemCount : null, badgeVariant: 'destructive' as const }
  ]

  const renderMenuItem = (item: any) => (
     <SidebarMenuItem key={item.href}>
        <Link href={item.href} passHref>
          <SidebarMenuButton asChild isActive={pathname === item.href}>
            <div className="flex justify-between items-center w-full">
              <div className="flex items-center gap-2">
                {item.icon}
                <span>{item.label}</span>
              </div>
              {item.badge ? (
                  <Badge variant={item.badgeVariant} className="h-6 w-6 flex items-center justify-center p-0 rounded-full">
                  {item.badge}
                </Badge>
              ) : null}
            </div>
          </SidebarMenuButton>
        </Link>
      </SidebarMenuItem>
  );

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <div className="flex items-center gap-3 cursor-pointer">
              <Avatar className="h-12 w-12">
                <AvatarImage src={`https://placehold.co/100x100.png`} alt={currentUser.name} data-ai-hint={`${currentUser.imageHint} avatar`} />
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
          {menuItems.map(renderMenuItem)}
          {currentRole === 'HR Head' && hrMenuItems.map(renderMenuItem)}
          {(currentRole === 'HR Head' || currentRole === 'Manager' || currentRole === 'AM' || currentRole === 'Team Lead') && assigneeMenuItems.map(renderMenuItem)}
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
