
"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { getAllFeedback, Feedback, OneOnOneHistoryItem, getOneOnOneHistory } from '@/services/feedback-service';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { ListTodo, ShieldAlert, UserCog, AlertTriangle } from 'lucide-react';
import { useRole, Role } from '@/hooks/use-role';
import { Badge } from '@/components/ui/badge';
import DashboardLayout from '@/components/dashboard-layout';
import { roleUserMapping } from '@/lib/role-mapping';

function ActionItemsContent() {
  const [escalations, setEscalations] = useState<OneOnOneHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { role } = useRole();
  const router = useRouter();

  const fetchActionItems = useCallback(async () => {
    if (!role) return;
    setIsLoading(true);
    try {
        const history = await getOneOnOneHistory();
        
        const isCurrentlyAssigned = (item: OneOnOneHistoryItem) => {
            if ('analysis' in item) { // OneOnOneHistoryItem
                const insight = item.analysis.criticalCoachingInsight;
                if (!insight || insight.status === 'resolved') return false;

                const isAmMatch = role === 'AM' && insight.status === 'pending_am_review';
                const isManagerMatch = role === 'Manager' && insight.status === 'pending_manager_review';
                const isHrMatch = role === 'HR Head' && (insight.status === 'pending_hr_review' || insight.status === 'pending_final_hr_action');

                return isAmMatch || isManagerMatch || isHrMatch;
            }
            return false;
        };
        
        const userEscalations = history.filter(isCurrentlyAssigned);

        const sortFn = (a: OneOnOneHistoryItem, b: OneOnOneHistoryItem) => {
            const dateA = new Date(a.date);
            const dateB = new Date(b.date);
            return dateB.getTime() - dateA.getTime();
        };
        
        setEscalations(userEscalations.sort(sortFn));

    } catch (error) {
      console.error("Failed to fetch action items", error);
    } finally {
      setIsLoading(false);
    }
  }, [role]);
  
  useEffect(() => {
    fetchActionItems();
    const handleDataUpdate = () => fetchActionItems();
    window.addEventListener('storage', handleDataUpdate);
    window.addEventListener('feedbackUpdated', handleDataUpdate);
    return () => {
        window.removeEventListener('storage', handleDataUpdate);
        window.removeEventListener('feedbackUpdated', handleDataUpdate);
    };
  }, [fetchActionItems]);

  const handleItemClick = (itemId: string) => {
    // Navigate to 1-on-1 page and signal to open the specific item
    // For simplicity, we can just navigate. The user will have to find it, but it should be near the top.
    router.push('/1-on-1');
  };

  if (isLoading) {
    return (
        <div className="p-4 md:p-8">
            <Card>
                <CardHeader>
                    <Skeleton className="h-8 w-48 mb-2" />
                    <Skeleton className="h-6 w-72" />
                </CardHeader>
                <CardContent className="space-y-4">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                </CardContent>
            </Card>
        </div>
    );
  }

  const renderCategorySection = (
    title: string,
    icon: React.ElementType,
    items: OneOnOneHistoryItem[],
    isSevere = false
  ) => {
    if (items.length === 0) return null;
    const Icon = icon;

    return (
        <div className="pt-6">
            <h2 className={`text-xl font-semibold mb-4 flex items-center gap-3 ${isSevere ? "text-destructive" : "text-muted-foreground"}`}>
               <Icon className="h-6 w-6" /> {title}
            </h2>
            <div className="border rounded-lg">
                 {items.map((item) => (
                    <div 
                        key={item.id} 
                        className="flex justify-between items-center w-full px-4 py-3 text-left border-b last:border-b-0 hover:bg-muted/50 cursor-pointer"
                        onClick={() => handleItemClick(item.id)}
                        onKeyDown={(e) => e.key === 'Enter' && handleItemClick(item.id)}
                        role="button"
                        tabIndex={0}
                    >
                         <div className="flex items-center gap-3 flex-1 min-w-0">
                            <span className="font-medium truncate">1-on-1 Escalation: {item.supervisorName} & {item.employeeName}</span>
                        </div>
                        <div className="flex items-center gap-4 pl-4 mr-2">
                             <span className="text-xs text-muted-foreground">{format(new Date(item.date), 'PPP')}</span>
                             <Badge variant="destructive">Action Required</Badge>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
  };

  const allActiveItemsCount = escalations.length;

  return (
    <div className="p-4 md:p-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl font-bold font-headline mb-2 text-foreground">
            <ListTodo className="inline-block mr-3 h-8 w-8" /> Action Items
          </CardTitle>
           <CardDescription className="text-lg text-muted-foreground">
            A centralized list of items requiring your direct action.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {allActiveItemsCount === 0 ? (
            <div className="text-center py-12 border-2 border-dashed rounded-lg">
              <p className="text-muted-foreground text-lg">Your action item list is empty.</p>
              <p className="text-sm text-muted-foreground mt-2">
                New escalations or tasks assigned to you will appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
                {renderCategorySection("1-on-1 Escalations", AlertTriangle, escalations, true)}
            </div>
          )}
        </CardContent>
      </Card>
      
    </div>
  );
}


export default function ActionItemsPage() {
    const { role, setRole, isLoading } = useRole();

    if (isLoading) {
        return (
            <div className="p-4 md:p-8">
                <Skeleton className="h-screen w-full" />
            </div>
        )
    }
    
    const canAccessPage = role === 'Team Lead' || role === 'AM' || role === 'Manager' || role === 'HR Head';

    if (!role || !canAccessPage) {
         return (
            <DashboardLayout role={role!} onSwitchRole={setRole}>
                <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] text-center p-4">
                  <Card className="max-w-md">
                      <CardHeader>
                          <CardTitle>Access Denied</CardTitle>
                          <CardDescription>You do not have permission to view this page.</CardDescription>
                      </CardHeader>
                      <CardContent>
                          <p>This page is restricted to leadership roles with assigned action items.</p>
                      </CardContent>
                  </Card>
              </div>
            </DashboardLayout>
        );
    }
  
    return (
        <DashboardLayout role={role} onSwitchRole={setRole}>
            <ActionItemsContent />
        </DashboardLayout>
    );
}
