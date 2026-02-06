"use client";

import { useState, useEffect } from 'react';
import { useRole } from '@/hooks/use-role';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Lightbulb } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function CoachingTipWidget() {
  const { role } = useRole();
  const { toast } = useToast();
  const [tip, setTip] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTip = async () => {
      if (!role) return;
      
      const today = new Date().toDateString();
      const storedData = sessionStorage.getItem('daily_coaching_tip');
      if (storedData) {
          const { date, tip } = JSON.parse(storedData);
          if (date === today) {
              setTip(tip);
              setIsLoading(false);
              return;
          }
      }

      setIsLoading(true);
      try {
        const response = await fetch('/api/ai/get-daily-coaching-tip', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ role }),
        });

        if (!response.ok) {
            throw new Error('Failed to get daily coaching tip');
        }

        const result = await response.json();
        setTip(result.tip);
        sessionStorage.setItem('daily_coaching_tip', JSON.stringify({ date: today, tip: result.tip }));
      } catch (error) {
        console.error("Failed to fetch coaching tip:", error);
        // Don't show toast, just fail gracefully
      } finally {
        setIsLoading(false);
      }
    };

    fetchTip();
  }, [role]);

  if (isLoading) {
    return <Skeleton className="h-28 w-full" />;
  }

  if (!tip) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="p-2">
        <CardTitle className="flex items-center gap-2 text-base text-primary">
          <Lightbulb className="h-5 w-5" />
          Coaching Tip
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm italic text-muted-foreground">
          "{tip}"
        </p>
      </CardContent>
    </Card>
  );
}
