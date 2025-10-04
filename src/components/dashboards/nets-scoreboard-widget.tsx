"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRole } from '@/hooks/use-role';
import { getCompletedPracticeScenariosForUser, AssignedPracticeScenario } from '@/services/feedback-service';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { TrendingUp, TrendingDown, Minus, MessagesSquare } from 'lucide-react';
import Link from 'next/link';

function ScoreCard({ label, score, previousScore }: { label: string; score: number; previousScore?: number }) {
  const diff = previousScore !== undefined ? score - previousScore : 0;
  const Icon = diff > 0 ? TrendingUp : diff < 0 ? TrendingDown : Minus;
  const color = diff > 0 ? 'text-green-500' : diff < 0 ? 'text-red-500' : 'text-muted-foreground';

  return (
    <div className="flex flex-col items-center justify-center p-2 rounded-lg bg-background/50">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-lg font-bold">{score.toFixed(1)}</p>
      {previousScore !== undefined && (
        <div className={`flex items-center text-xs ${color}`}>
          <Icon className="h-3 w-3 mr-0.5" />
          <span>{diff.toFixed(1)}</span>
        </div>
      )}
    </div>
  );
}

export default function NetsScoreboardWidget() {
  const { role } = useRole();
  const [scenarios, setScenarios] = useState<AssignedPracticeScenario[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchScenarios = useCallback(async () => {
    if (!role) return;
    setIsLoading(true);
    const completedScenarios = getCompletedPracticeScenariosForUser(role).slice(0, 3);
    setScenarios(completedScenarios);
    setIsLoading(false);
  }, [role]);

  useEffect(() => {
    fetchScenarios();
    window.addEventListener('feedbackUpdated', fetchScenarios);
    return () => window.removeEventListener('feedbackUpdated', fetchScenarios);
  }, [fetchScenarios]);

  if (isLoading) {
    return <Skeleton className="h-56 w-full" />;
  }

  if (scenarios.length === 0) {
    return null; // Don't show if no practice has been done
  }
  
  const latest = scenarios[0]?.analysis?.scores;
  const previous = scenarios[1]?.analysis?.scores;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <MessagesSquare className="text-indigo-500" />
          Nets Practice Scoreboard
        </CardTitle>
      </CardHeader>
      <CardContent>
        {latest ? (
          <div className="grid grid-cols-3 gap-2">
            <ScoreCard label="Clarity" score={latest.clarity} previousScore={previous?.clarity} />
            <ScoreCard label="Empathy" score={latest.empathy} previousScore={previous?.empathy} />
            <ScoreCard label="Assertiveness" score={latest.assertiveness} previousScore={previous?.assertiveness} />
          </div>
        ) : (
            <p className="text-sm text-muted-foreground text-center">Complete a practice session to see your scores.</p>
        )}
      </CardContent>
      <CardFooter>
          <Button variant="outline" size="sm" asChild className="w-full">
              <Link href="/nets/scorecard">View Full Scorecard</Link>
          </Button>
      </CardFooter>
    </Card>
  );
}
