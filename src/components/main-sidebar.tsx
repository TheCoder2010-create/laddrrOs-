

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
import { LogOut, User, BarChart, CheckSquare, Vault, Check, ListTodo, MessageSquare, ShieldQuestion, BrainCircuit } from 'lucide-react';
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
  const currentUser = roleUserMapping[currentRole] || { name: 'User', fallback: 'U', imageHint: 'person', role: currentRole };
  const currentUserName = currentUser.name;
  const pathname = usePathname();
  const [vaultFeedbackCount, setVaultFeedbackCount] = useState(0);
  const [actionItemCount, setActionItemCount] = useState(0);
  const [messageCount, setMessageCount] = useState(0);
  const [coachingCount, setCoachingCount] = useState(0);
  const [voiceInSilenceCount, setVoiceInSilenceCount] = useState(0);
  const [myConcernsCount, setMyConcernsCount] = useState(0);

  const fetchFeedbackCounts = useCallback(async () => {
    if (!currentRole) return;
    try {
      const feedback = await getAllFeedback();
      const history = await getOneOnOneHistory();

      // Vault count (HR Head only)
      if (currentRole === 'HR Head') {
        setVaultFeedbackCount(feedback.filter(c => !c.viewed && c.status === 'Open' && c.source === 'Voice – In Silence').length);
      } else {
        setVaultFeedbackCount(0);
      }
      
      // Voice - in Silence count (for assignees)
       setVoiceInSilenceCount(feedback.filter(f => 
            f.source === 'Voice – In Silence' && 
            f.assignedTo?.includes(currentRole) &&
            f.status !== 'Resolved'
        ).length);


      // Action items count
      let totalActionItems = 0;
      
      // Active To-Do lists
      totalActionItems += feedback.filter(f => {
         const isAssigned = f.assignedTo?.includes(currentRole as any);
         const isToDo = f.status === 'To-Do';
         return isAssigned && isToDo;
      }).length;

      // Escalated 1-on-1 insights
      totalActionItems += history.filter(h => {
          const insight = h.analysis.criticalCoachingInsight;
          if (!insight || insight.status === 'resolved') return false;
          
          const isAmMatch = currentRole === 'AM' && insight.status === 'pending_am_review';
          const isManagerMatch = currentRole === 'Manager' && insight.status === 'pending_manager_review';
          const isHrMatch = currentRole === 'HR Head' && (insight.status === 'pending_hr_review' || insight.status === 'pending_final_hr_action');

          return isAmMatch || isManagerMatch || isHrMatch;
      }).length;

      setActionItemCount(totalActionItems);


      // Messages count
      let totalMessages = 0;
      // Critical Insights for employee acknowledgement
      totalMessages += history.filter(h => {
          const insight = h.analysis.criticalCoachingInsight;
          if (!insight || insight.status === 'resolved') return false;

          return currentRole === 'Employee' && h.employeeName === currentUserName && insight.status === 'pending_employee_acknowledgement';
      }).length;
      
      // General Notifications (e.g. from coaching plans) and identified concern acknowledgements
      totalMessages += feedback.filter(f => {
        const isAssignedToMe = f.assignedTo?.includes(currentRole as any);
        if (!isAssignedToMe) return false;

        const isPendingAck = f.status === 'Pending Acknowledgement';
        const isIdentifiedAck = f.status === 'Pending Employee Acknowledgment' && f.submittedBy === currentRole;
        return isPendingAck || isIdentifiedAck;
      }).length;
      
      setMessageCount(totalMessages);

       // My Concerns Count
      let concernsActionCount = 0;
      const complainantActionStatuses: string[] = ['Pending Identity Reveal', 'Pending Anonymous Reply', 'Pending Employee Acknowledgment'];
      const respondentActionStatuses: string[] = ['Pending Supervisor Action', 'Pending Manager Action', 'Pending HR Action', 'Final Disposition Required', 'Retaliation Claim'];
      
      feedback.forEach(f => {
          const isMyConcern = f.submittedBy === currentRole || f.submittedBy === currentUserName;
          const isAssignedToMe = f.assignedTo?.includes(currentRole as any);

          if (isMyConcern && complainantActionStatuses.includes(f.status || '')) {
              concernsActionCount++;
          }
          if (isAssignedToMe && respondentActionStatuses.includes(f.status || '')) {
              concernsActionCount++;
          }
      });
      setMyConcernsCount(concernsActionCount);
      
      // Coaching & Development Count
      let devCount = 0;
      // My Development (pending recommendations for me)
      history.forEach(h => {
        if (h.supervisorName === currentUserName) {
          devCount += h.analysis.coachingRecommendations.filter(rec => rec.status === 'pending').length;
        }
      });

      // Team Development (escalations for me to review)
      const recStatusesToCount: string[] = [];
      if (currentRole === 'AM') recStatusesToCount.push('pending_am_review');
      if (currentRole === 'Manager') recStatusesToCount.push('pending_manager_acknowledgement');

      if (recStatusesToCount.length > 0) {
        history.forEach(h => {
            devCount += h.analysis.coachingRecommendations.filter(rec => rec.status && recStatusesToCount.includes(rec.status)).length;
        });
      }
      setCoachingCount(devCount);


    } catch (error) {
      console.error("Failed to fetch feedback counts", error);
      setVaultFeedbackCount(0);
      setActionItemCount(0);
      setMessageCount(0);
      setCoachingCount(0);
      setVoiceInSilenceCount(0);
      setMyConcernsCount(0);
    }
  }, [currentRole, currentUserName]);


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

  const isSupervisor = ['Team Lead', 'AM', 'Manager', 'HR Head'].includes(currentRole);

  const menuItems = [
    { href: '/', icon: <BarChart />, label: 'Dashboard' },
    { href: '/1-on-1', icon: <CheckSquare />, label: '1-on-1' },
    ...(isSupervisor ? [{ href: '/coaching', icon: <BrainCircuit />, label: 'Coaching', badge: coachingCount > 0 ? coachingCount : null, badgeVariant: 'secondary' as const }] : []),
    { href: '/my-concerns', icon: <ShieldQuestion />, label: 'My Concerns', badge: myConcernsCount > 0 ? myConcernsCount : null, badgeVariant: 'destructive' as const },
    { href: '/messages', icon: <MessageSquare />, label: 'Messages', badge: messageCount > 0 ? messageCount : null, badgeVariant: 'destructive' as const },
    { href: '/voice-in-silence', icon: <User />, label: 'Voice – in Silence', badge: voiceInSilenceCount > 0 ? voiceInSilenceCount : null, badgeVariant: 'destructive' as const },
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
