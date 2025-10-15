"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRole } from '@/hooks/use-role';
import { getTeamActionItemStatus } from '@/services/feedback-service';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { ListChecks, AlertTriangle } from 'lucide-react';
import { roleUserMapping } from '@/lib/role-mapping';

export default function ActionItemHeatmapWidget() {
  const { role } = useRole();
  const [teamStatus, setTeamStatus] = useState<Record<string, { open: number, overdue: number }>>({});
  const [isLoading, setIsLoading] = useState(true);

  const fetchStatus = useCallback(async () => {
    if (!role) return;
    setIsLoading(true);
    const status = await getTeamActionItemStatus(role);
    setTeamStatus(status);
    setIsLoading(false);
  }, [role]);

  useEffect(() => {
    fetchStatus();
    window.addEventListener('feedbackUpdated', fetchStatus);
    return () => window.removeEventListener('feedbackUpdated', fetchStatus);
  }, [fetchStatus]);

  const getColor = (open: number, overdue: number) => {
    if (overdue > 2) return 'bg-red-500';
    if (overdue > 0) return 'bg-yellow-500';
    if (open > 5) return 'bg-yellow-400';
    if (open > 0) return 'bg-green-500';
    return 'bg-green-300';
  };
  
  const hasData = Object.keys(teamStatus).length > 0;

  return (
    <Card>
      <CardHeader className="p-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <ListChecks className="text-primary" />
          Team Action Item Heatmap
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-24 w-full" />
        ) : hasData ? (
          <div className="flex flex-wrap gap-3">
            <TooltipProvider>
              {Object.entries(teamStatus).map(([name, { open, overdue }]) => (
                <Tooltip key={name}>
                  <TooltipTrigger>
                    <div className="flex items-center gap-2 border rounded-full px-3 py-1.5 bg-muted/50">
                       <span
                          className={cn(
                            "h-3 w-3 rounded-full relative flex items-center justify-center",
                            getColor(open, overdue)
                          )}
                        >
                          {overdue > 0 && 
                            <AlertTriangle className="h-3 w-3 absolute text-white" />}
                       </span>
                      <span className="text-sm font-medium">{name}</span>
                      <span className="text-sm text-muted-foreground">({open})</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{open} open action item(s)</p>
                    {overdue > 0 && <p className="text-destructive">{overdue} overdue</p>}
                  </TooltipContent>
                </Tooltip>
              ))}
            </TooltipProvider>
          </div>
        ) : (
          <div className="text-center py-4">
            <p className="text-muted-foreground">No action items found for your team.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
