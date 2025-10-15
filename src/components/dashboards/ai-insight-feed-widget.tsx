
"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRole } from '@/hooks/use-role';
import { getOneOnOneHistory } from '@/services/feedback-service';
import { Skeleton } from '@/components/ui/skeleton';
import { Bot, MessageSquareQuote } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';

export default function AiInsightFeedWidget() {
  const { role } = useRole();
  const [insights, setInsights] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchInsights = useCallback(async () => {
    if (!role) return;
    setIsLoading(true);
    const history = await getOneOnOneHistory();
    const allInsights = history
      .filter(item => item.employeeName === 'Casey Day' || item.supervisorName === 'Casey Day') // Assuming 'Casey Day' is the employee
      .flatMap(item => item.analysis.employeeInsights || [])
      .slice(0, 5); // Get the last 5 insights
    setInsights(allInsights);
    setIsLoading(false);
  }, [role]);

  useEffect(() => {
    fetchInsights();
    window.addEventListener('feedbackUpdated', fetchInsights);
    return () => window.removeEventListener('feedbackUpdated', fetchInsights);
  }, [fetchInsights]);

  if (isLoading) {
    return <Skeleton className="h-40 w-full" />;
  }

  if (insights.length === 0) {
    return (
        <Card className="h-full">
         <CardHeader>
            <CardTitle className="flex items-center gap-2">
                <Bot className="h-5 w-5 text-primary" />
                AI Insight Feed
            </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-full pb-16">
            <p className="text-sm text-muted-foreground">No insights yet.</p>
        </CardContent>
    </Card>
    )
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-primary" />
            AI Insight Feed
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex items-center justify-center">
        <Carousel
          opts={{
            align: "start",
            loop: true,
          }}
          className="w-full max-w-xs"
        >
          <CarouselContent>
            {insights.map((insight, index) => (
              <CarouselItem key={index}>
                <div className="p-1">
                  <div className="flex h-28 items-center justify-center p-6 bg-muted/50 rounded-lg">
                    <p className="text-center text-sm font-medium leading-relaxed italic text-foreground">
                      <MessageSquareQuote className="inline-block h-4 w-4 mr-2 text-primary/70" />
                      {insight}
                    </p>
                  </div>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="-left-4" />
          <CarouselNext className="-right-4" />
        </Carousel>
      </CardContent>
    </Card>
  );
}
