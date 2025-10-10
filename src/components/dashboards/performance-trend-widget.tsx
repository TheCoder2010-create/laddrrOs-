
"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartConfig } from "@/components/ui/chart"
import { LineChart, CartesianGrid, XAxis, YAxis, Line, Legend } from "recharts"
import { TrendingUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

// Mock data representing performance over a 12-month period for different KPIs
const allPerformanceData = [
  { month: "Jan", overall: 75, projectDelivery: 80, codeQuality: 70, collaboration: 75 },
  { month: "Feb", overall: 78, projectDelivery: 82, codeQuality: 75, collaboration: 77 },
  { month: "Mar", overall: 82, projectDelivery: 85, codeQuality: 80, collaboration: 81 },
  { month: "Apr", overall: 80, projectDelivery: 83, codeQuality: 78, collaboration: 79 },
  { month: "May", overall: 85, projectDelivery: 88, codeQuality: 82, collaboration: 85 },
  { month: "Jun", overall: 84, projectDelivery: 86, codeQuality: 81, collaboration: 85 },
  { month: "Jul", overall: 88, projectDelivery: 90, codeQuality: 85, collaboration: 89 },
  { month: "Aug", overall: 90, projectDelivery: 92, codeQuality: 88, collaboration: 90 },
  { month: "Sep", overall: 87, projectDelivery: 89, codeQuality: 86, collaboration: 86 },
  { month: "Oct", overall: 92, projectDelivery: 94, codeQuality: 90, collaboration: 92 },
  { month: "Nov", overall: 91, projectDelivery: 92, codeQuality: 91, collaboration: 89 },
  { month: "Dec", overall: 94, projectDelivery: 95, codeQuality: 93, collaboration: 94 },
];

const kpis = [
    { key: 'overall', label: 'Overall' },
    { key: 'projectDelivery', label: 'Project Delivery' },
    { key: 'codeQuality', label: 'Code Quality' },
    { key: 'collaboration', label: 'Collaboration' },
] as const;

type KpiKey = typeof kpis[number]['key'];

export default function PerformanceTrendWidget() {
  const [range, setRange] = useState([0, 11]); // Default to showing all 12 months
  const [selectedKpi, setSelectedKpi] = useState<KpiKey>('overall');

  const visibleData = useMemo(() => {
    return allPerformanceData.slice(range[0], range[1] + 1);
  }, [range]);

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
                    defaultValue={range}
                    min={0}
                    max={11}
                    step={1}
                    onValueChange={handleRangeChange}
                    aria-label="Date Range Slider"
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-2">
                    <span>{allPerformanceData[range[0]].month}</span>
                    <span>{allPerformanceData[range[1]].month}</span>
                </div>
            </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-4 flex flex-wrap gap-2">
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
        <div className="h-[250px] w-full mb-4">
            <ChartContainer config={chartConfig}>
              <LineChart
                data={visibleData}
                margin={{ top: 5, right: 20, left: -10, bottom: 0 }}
              >
                <CartesianGrid vertical={false} />
                <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
                <YAxis
                    domain={[60, 100]}
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                />
                <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent indicator="dot" />}
                />
                <Legend verticalAlign="top" height={36} />
                <Line
                    dataKey={selectedKpi}
                    type="monotone"
                    stroke={`var(--color-${selectedKpi})`}
                    strokeWidth={3}
                    dot={{ r: 5 }}
                    activeDot={{ r: 7 }}
                />
              </LineChart>
            </ChartContainer>
        </div>
      </CardContent>
    </Card>
  );
}
