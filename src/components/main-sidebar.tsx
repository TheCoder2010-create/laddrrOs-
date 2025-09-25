

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
  DropdownMenuGroup,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sidebar, SidebarHeader, SidebarContent, SidebarFooter, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarMenuSub, SidebarMenuSubItem, SidebarMenuSubButton, useSidebar } from '@/components/ui/sidebar';
import { LogOut, User, BarChart, CheckSquare, Vault, Check, ListTodo, MessageSquare, ShieldQuestion, BrainCircuit, Scale, MessagesSquare, FlaskConical } from 'lucide-react';
import type { Role } from '@/hooks/use-role';
import { useRole } from '@/hooks/use-role';
import { getAllFeedback, getOneOnOneHistory } from '@/services/feedback-service';
import { getNominationForUser } from '@/services/interviewer-lab-service';
import { Badge } from '@/components/ui/badge';
import { roleUserMapping } from '@/lib/role-mapping';
import { cn } from '@/lib/utils';


interface MainSidebarProps {
  currentRole: Role;
  onSwitchRole: (role: Role | null) => void;
}

export default function MainSidebar({ currentRole, onSwitchRole }: MainSidebarProps) {
  const { availableRoles } = useRole();
  const currentUser = roleUserMapping[currentRole] || { name: 'User', fallback: 'U', imageHint: 'person', role: currentRole };
  const currentUserName = currentUser.name;
  const pathname = usePathname();
  const [messageCount, setMessageCount] = useState(0);
  const [coachingCount, setCoachingCount] = useState(0);
  const [isNominated, setIsNominated] = useState(false);
  const [openSubMenus, setOpenSubMenus] = useState<string[]>([]);
  const { state: sidebarState } = useSidebar();

  useEffect(() => {
    if (sidebarState === 'collapsed') {
      setOpenSubMenus([]);
    }
  }, [sidebarState]);


  const fetchData = useCallback(async () => {
    if (!currentRole) return;
    try {
      // Fetch feedback counts
      const feedback = await getAllFeedback();
      const history = await getOneOnOneHistory();

      let totalMessages = feedback.filter(f => {
        const isAssignedToMe = f.assignedTo?.includes(currentRole as any);
        if (!isAssignedToMe) return false;
        const isPendingAck = f.status === 'Pending Acknowledgement';
        const isIdentifiedAck = f.status === 'Pending Employee Acknowledgment' && f.submittedBy === currentRole;
        return isPendingAck || isIdentifiedAck;
      }).length;
      setMessageCount(totalMessages);

      let devCount = 0;
      history.forEach(h => {
        if (h.supervisorName === currentUserName) {
          devCount += h.analysis.coachingRecommendations.filter(rec => rec.status === 'pending').length;
        }
      });
      const recStatusesToCount: string[] = [];
      if (currentRole === 'AM') recStatusesToCount.push('pending_am_review');
      if (currentRole === 'Manager') recStatusesToCount.push('pending_manager_acknowledgement');
      if (recStatusesToCount.length > 0) {
        history.forEach(h => {
            devCount += h.analysis.coachingRecommendations.filter(rec => rec.status && recStatusesToCount.includes(rec.status)).length;
        });
      }
      setCoachingCount(devCount);

      // Check nomination status
      const nomination = await getNominationForUser(currentRole);
      setIsNominated(!!nomination);

    } catch (error) {
      console.error("Failed to fetch sidebar data", error);
      setMessageCount(0);
      setCoachingCount(0);
      setIsNominated(false);
    }
  }, [currentRole, currentUserName]);


  useEffect(() => {
    fetchData();

    const handleDataUpdate = () => {
        fetchData();
    };

    window.addEventListener('storage', handleDataUpdate);
    window.addEventListener('feedbackUpdated', handleDataUpdate);

    return () => {
        window.removeEventListener('storage', handleDataUpdate);
        window.removeEventListener('feedbackUpdated', handleDataUpdate);
    };
  }, [fetchData]);

  const isSupervisor = ['Team Lead', 'AM', 'Manager', 'HR Head'].includes(currentRole);
  const isManagerial = ['Manager', 'HR Head'].includes(currentRole);
  
  const menuItems = [
    { href: '/', icon: <BarChart className="text-blue-500"/>, label: 'Dashboard' },
    { href: '/1-on-1', icon: <CheckSquare className="text-green-500"/>, label: '1-on-1' },
    { href: '/nets', icon: <MessagesSquare className="text-indigo-500"/>, label: 'Nets' },
    ...(isSupervisor ? [{ href: '/coaching', icon: <BrainCircuit className="text-purple-500"/>, label: 'Coaching', badge: coachingCount > 0 ? coachingCount : null, badgeVariant: 'secondary' as const }] : []),
    ...(isManagerial ? [{ 
        href: '/managers-lab', 
        icon: <FlaskConical className="text-orange-500"/>, 
        label: "Manager's Lab",
        children: [
           { href: '/interviewer-lab', icon: <FlaskConical className="text-teal-500"/>, label: "Interviewer Lab" },
           { href: '/leadership', icon: <Scale className="text-red-500"/>, label: "Leadership" }
        ]
    }] : []),
    ...(!isManagerial && isNominated ? [{ href: '/interviewer-lab', icon: <FlaskConical className="text-teal-500"/>, label: "Interviewer Lab" }] : []),
    { href: '/messages', icon: <MessageSquare className="text-yellow-500"/>, label: 'Messages', badge: messageCount > 0 ? messageCount : null, badgeVariant: 'destructive' as const },
  ];
  
  const toggleSubMenu = (label: string) => {
    setOpenSubMenus(prev => prev.includes(label) ? prev.filter(l => l !== label) : [...prev, label]);
  }

  const renderMenuItem = (item: any) => {
     if (item.children) {
      const isSubMenuOpen = openSubMenus.includes(item.label);
      const isParentActive = pathname.startsWith(item.href);

      return (
        <SidebarMenuItem key={item.label} className="flex flex-col">
            <SidebarMenuButton 
                asChild={false}
                isActive={isParentActive && !isSubMenuOpen}
                onClick={() => toggleSubMenu(item.label)}
                className="w-full"
            >
              <div className="flex justify-between items-center w-full">
                <div className="flex items-center gap-2">
                    {item.icon}
                    <span>{item.label}</span>
                </div>
              </div>
            </SidebarMenuButton>
            {isSubMenuOpen && (
              <SidebarMenuSub className="mt-1">
                {item.children.map((child: any) => (
                  <SidebarMenuSubItem key={child.href}>
                     <Link href={child.href} passHref>
                      <SidebarMenuSubButton asChild isActive={pathname === child.href}>
                          <div className="flex items-center gap-2">
                             {child.icon}
                             <span>{child.label}</span>
                          </div>
                      </SidebarMenuSubButton>
                    </Link>
                  </SidebarMenuSubItem>
                ))}
              </SidebarMenuSub>
            )}
        </SidebarMenuItem>
      )
    }

    return (
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
  }

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
                            <Check className="mr-2 h-4 w-4 text-green-500" />
                        ) : (
                            <span className="mr-2 h-4 w-4" />
                        )}
                        <span>{role}</span>
                    </DropdownMenuItem>
                ))}
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onSwitchRole(null)}>
              <LogOut className="mr-2 h-4 w-4 text-destructive" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarHeader>
      <SidebarContent className="p-2">
        <SidebarMenu>
          {menuItems.map(renderMenuItem)}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={() => onSwitchRole(null)}>
              <LogOut className="text-destructive"/>
              <span>Log out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
