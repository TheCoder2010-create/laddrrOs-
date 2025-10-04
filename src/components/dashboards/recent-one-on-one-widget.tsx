"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRole, type Role } from '@/hooks/use-role';
import { getOneOnOneHistory, OneOnOneHistoryItem } from '@/services/feedback-service';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Check, CheckSquare, MessageSquare, Star } from 'lucide-react';
import Link from 'next/link';

export default function RecentOneOnOneWidget() {
  const { role } = useRole();
  const [latestSession, setLatestSession] = useState<OneOnOneHistoryItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchLatestSession = useCallback(async () => {
    if (!role) return;
    setIsLoading(true);
    const history = await getOneOnOneHistory();
    // Simplified for demo: assuming 'Casey Day' is the employee's name
    const employeeHistory = history.filter(item => item.employeeName === 'Casey Day' || item.supervisorName === 'Casey Day');
    setLatestSession(employeeHistory[0] || null);
    setIsLoading(false);
  }, [role]);

  useEffect(() => {
    fetchLatestSession();
    window.addEventListener('feedbackUpdated', fetchLatestSession);
    return () => window.removeEventListener('feedbackUpdated', fetchLatestSession);
  }, [fetchLatestSession]);

  if (isLoading) {
    return <Skeleton className="h-80 w-full" />;
  }

  if (!latestSession) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent 1-on-1 Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No 1-on-1 sessions have been logged yet.</p>
        </CardContent>
      </Card>
    );
  }

  const { analysis } = latestSession;
  const actionItems = analysis.actionItems?.filter(item => item.owner === 'Employee') || [];
  
  const sentimentScore = analysis.effectivenessScore;
  const sentimentLabel = sentimentScore > 8 ? "Excellent" : sentimentScore > 6 ? "Good" : sentimentScore > 4 ? "Okay" : "Needs Improvement";

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
            <MessageSquare className="text-primary"/>
            Recent 1-on-1 Summary
        </CardTitle>
        <CardDescription>
          Highlights from your last session with {latestSession.supervisorName} on {new Date(latestSession.date).toLocaleDateString()}.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
            <h4 className="font-semibold text-foreground mb-2">Key Feedback</h4>
            <p className="text-sm text-muted-foreground italic p-3 bg-muted/50 rounded-lg">
                "{analysis.employeeSummary}"
            </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <h4 className="font-semibold text-foreground mb-2">Your Action Items</h4>
                {actionItems.length > 0 ? (
                    <ul className="space-y-2">
                        {actionItems.map(item => (
                            <li key={item.id} className="flex items-center gap-2 text-sm">
                                <CheckSquare className="h-4 w-4 text-muted-foreground" />
                                <span>{item.task}</span>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-sm text-muted-foreground">No specific action items for you from this session.</p>
                )}
            </div>
            <div className="flex flex-col items-center justify-center p-4 rounded-lg bg-background border">
                <h4 className="font-semibold text-foreground mb-2">Session Sentiment</h4>
                <div className="flex items-baseline gap-1">
                    <p className="text-4xl font-bold text-primary">{sentimentScore.toFixed(1)}</p>
                    <p className="text-muted-foreground">/ 10</p>
                </div>
                <p className="text-sm font-medium text-primary mt-1">{sentimentLabel}</p>
            </div>
        </div>
      </CardContent>
       <CardFooter>
          <Button variant="outline" asChild className="w-full">
              <Link href="/1-on-1">View Full History</Link>
          </Button>
      </CardFooter>
    </Card>
  );
}
