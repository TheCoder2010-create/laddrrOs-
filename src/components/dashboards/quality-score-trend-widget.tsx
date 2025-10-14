
"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRole } from '@/hooks/use-role';
import { getOneOnOneHistory } from '@/services/feedback-service';
import { roleUserMapping } from '@/lib/role-mapping';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { LineChart, CartesianGrid, XAxis, YAxis, Line } from 'recharts';
import { BarChart as BarChartIcon } from 'lucide-react';

export default function QualityScoreTrendWidget() {
  const { role } = useRole();
  const [chartData, setChartData] = useState<{ date: string; score: number }[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchScores = useCallback(async () => {
    if (!role) return;
    const userName = roleUserMapping[role]?.name;
    if (!userName) return;

    setIsLoading(true);
    const history = await getOneOnOneHistory();
    const userSessions = history
      .filter(item => item.supervisorName === userName)
      .slice(0, 5) // Get last 5 sessions
      .reverse(); // Reverse to show trend over time

    const data = userSessions.map(item => ({
      date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      score: item.analysis.effectivenessScore,
    }));

    setChartData(data);
    setIsLoading(false);
  }, [role]);

  useEffect(() => {
    fetchScores();
    window.addEventListener('feedbackUpdated', fetchScores);
    return () => window.removeEventListener('feedbackUpdated', fetchScores);
  }, [fetchScores]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChartIcon className="text-primary" />
          1-on-1 Quality Score Trend
        </CardTitle>
        <CardDescription>
          Your average AI meeting effectiveness score over the last 5 sessions.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-48 w-full" />
        ) : chartData.length > 0 ? (
          <div className="h-[250px] w-full">
            <ChartContainer
              config={{ score: { label: "Effectiveness", color: "hsl(var(--primary))" } }}
            >
              <LineChart
                data={chartData}
                margin={{ top: 5, right: 20, left: -10, bottom: 0 }}
              >
                <CartesianGrid vertical={false} />
                <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} />
                <YAxis domain={[0, 10]} tickLine={false} axisLine={false} tickMargin={8} />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent indicator="dot" />}
                />
                <Line
                  dataKey="score"
                  type="monotone"
                  stroke="var(--color-score)"
                  strokeWidth={3}
                  dot={{ r: 5, fill: "var(--color-score)", strokeWidth: 2, stroke: "hsl(var(--card))" }}
                  activeDot={{ r: 7 }}
                />
              </LineChart>
            </ChartContainer>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Not enough session data to display a trend.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
