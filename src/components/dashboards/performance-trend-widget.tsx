
"use client"

import { useMemo, useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartConfig } from "@/components/ui/chart"
import { LineChart, CartesianGrid, XAxis, YAxis, Line, Legend } from "recharts"
import { TrendingUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { format } from "date-fns"

// Mock data representing performance over different time periods
const generateData = (numPoints: number, period: 'day' | 'week' | 'month') => {
    let data = [];
    const baseDate = new Date(2023, 0, 1);
    for (let i = 0; i < numPoints; i++) {
        let date;
        if (period === 'day') {
            date = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate() + i);
        } else if (period === 'week') {
            date = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate() + (i * 7));
        } else { // month
            date = new Date(baseDate.getFullYear(), baseDate.getMonth() + i, 1);
        }
        
        const overall = 75 + (i * 1.5) + (Math.random() * 5 - 2.5);
        const projectDelivery = overall + (Math.random() * 3 - 1.5);
        const codeQuality = overall - (Math.random() * 3 - 1.5);
        const collaboration = overall + (Math.random() * 2 - 1);
        
        data.push({
            date,
            overall: parseFloat(overall.toFixed(1)),
            projectDelivery: parseFloat(projectDelivery.toFixed(1)),
            codeQuality: parseFloat(codeQuality.toFixed(1)),
            collaboration: parseFloat(collaboration.toFixed(1)),
        });
    }
    return data;
}

const monthlyData = generateData(12, 'month');
const weeklyData = generateData(52, 'week');
const dailyData = generateData(90, 'day');

const allPerformanceData = {
    M: monthlyData,
    W: weeklyData,
    D: dailyData
};

const kpis = [
    { key: 'overall', label: 'Overall' },
    { key: 'projectDelivery', label: 'Project Delivery' },
    { key: 'codeQuality', label: 'Code Quality' },
    { key: 'collaboration', label: 'Collaboration' },
] as const;

type KpiKey = typeof kpis[number]['key'];
type TimePeriod = 'D' | 'W' | 'M';

export default function PerformanceTrendWidget() {
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('M');
  const [range, setRange] = useState<number[]>([0, 11]); 
  const [selectedKpi, setSelectedKpi] = useState<KpiKey>('overall');

  const currentData = useMemo(() => allPerformanceData[timePeriod], [timePeriod]);

  // Reset range when time period changes
  useEffect(() => {
    setRange([0, currentData.length - 1]);
  }, [timePeriod, currentData]);

  const visibleData = useMemo(() => {
    return currentData.slice(range[0], range[1] + 1);
  }, [range, currentData]);

  const handleRangeChange = (newRange: number[]) => {
    if (newRange[1] - newRange[0] < 1) {
      if (newRange[0] > 0) {
        setRange([newRange[0] - 1, newRange[0]]);
      } else {
        setRange([newRange[1], newRange[1] + 1]);
      }
    } else {
      setRange(newRange);
    }
  };

  const chartConfig: ChartConfig = {
    [selectedKpi]: {
      label: kpis.find(k => k.key === selectedKpi)?.label || "Score",
      color: "hsl(var(--primary))",
    },
  };

  const formatLabel = (date: Date) => {
    if (!(date instanceof Date) || isNaN(date.getTime())) {
        return ''; // Return empty string for invalid dates
    }
    switch (timePeriod) {
        case 'D': return format(date, 'MMM d');
        case 'W': return `W${format(date, 'w')}`;
        case 'M': return format(date, 'MMM');
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-1.5">
                <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="text-primary" />
                    Performance Trend
                </CardTitle>
                <CardDescription>
                    Your performance score over time.
                </CardDescription>
            </div>
            <div className="w-full sm:w-64">
                <Slider
                    value={range}
                    min={0}
                    max={currentData.length - 1}
                    step={1}
                    onValueChange={handleRangeChange}
                    aria-label="Date Range Slider"
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-2">
                    <span>{formatLabel(currentData[range[0]].date)}</span>
                    <span>{formatLabel(currentData[range[1]].date)}</span>
                </div>
            </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
             <div className="flex flex-wrap gap-2">
                {kpis.map(kpi => (
                    <Button
                        key={kpi.key}
                        variant={selectedKpi === kpi.key ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setSelectedKpi(kpi.key)}
                    >
                        {kpi.label}
                    </Button>
                ))}
            </div>
            <div className="flex items-center gap-1 rounded-md bg-muted p-1">
                {(['D', 'W', 'M'] as TimePeriod[]).map(period => (
                    <Button
                        key={period}
                        variant={timePeriod === period ? 'secondary' : 'ghost'}
                        size="sm"
                        className="h-7 px-2.5"
                        onClick={() => setTimePeriod(period)}
                    >
                        {period}
                    </Button>
                ))}
            </div>
        </div>
        <div className="h-[250px] w-full mb-4">
            <ChartContainer config={chartConfig}>
              <LineChart
                data={visibleData}
                margin={{ top: 5, right: 20, left: -10, bottom: 0 }}
              >
                <CartesianGrid vertical={false} />
                <XAxis 
                    dataKey="date" 
                    tickLine={false} 
                    axisLine={false} 
                    tickMargin={8}
                    tickFormatter={(value) => formatLabel(new Date(value))}
                />
                <YAxis
                    domain={[60, 100]}
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                />
                <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent indicator="dot" labelFormatter={(value) => formatLabel(new Date(value))} />}
                />
                <Legend verticalAlign="top" height={36} />
                <Line
                    dataKey={selectedKpi}
                    type="monotone"
                    stroke={`var(--color-${selectedKpi})`}
                    strokeWidth={3}
                    dot={{ r: 5 }}
                    activeDot={{ r: 7 }}
                    name={chartConfig[selectedKpi]?.label}
                />
              </LineChart>
            </ChartContainer>
        </div>
      </CardContent>
    </Card>
  );
}
