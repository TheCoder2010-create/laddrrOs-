"use client"

import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Award, TrendingUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ComparePerformanceSheet } from './compare-performance-sheet';

// Mock data representing the employee's rank
const rankData = {
  rank: 3,
  total: 25,
  percentile: 12,
  methodology: 'Bell Curve'
};

export default function RankCardWidget() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between p-4">
        <CardTitle className="flex items-center gap-2">
          <Award className="text-yellow-500" />
          Rank
        </CardTitle>
        <ComparePerformanceSheet />
      </CardHeader>
      <CardContent className="flex flex-col items-center justify-center pt-4">
        <div className="flex items-baseline text-6xl font-bold">
            <span className="text-4xl text-muted-foreground mr-1">#</span>
            <span className="text-primary">{rankData.rank}</span>
            <span className="text-2xl text-muted-foreground ml-1">/ {rankData.total}</span>
        </div>
        <p className="text-lg font-medium text-muted-foreground mt-1">
            Top {rankData.percentile}%
        </p>
         <Badge variant="secondary" className="flex items-center gap-1.5 mt-4">
            <TrendingUp className="h-3 w-3 text-green-500"/>
            Up 2 spots from last quarter
        </Badge>
      </CardContent>
    </Card>
  );
}
