"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { LineChart, CartesianGrid, XAxis, YAxis, Line, Legend } from "recharts"
import { TrendingUp } from "lucide-react"

// Mock data representing performance over a 12-month period
const allPerformanceData = [
  { month: "Jan", score: 75, target: 80 },
  { month: "Feb", score: 78, target: 80 },
  { month: "Mar", score: 82, target: 80 },
  { month: "Apr", score: 80, target: 82 },
  { month: "May", score: 85, target: 82 },
  { month: "Jun", score: 84, target: 82 },
  { month: "Jul", score: 88, target: 85 },
  { month: "Aug", score: 90, target: 85 },
  { month: "Sep", score: 87, target: 85 },
  { month: "Oct", score: 92, target: 90 },
  { month: "Nov", score: 91, target: 90 },
  { month: "Dec", score: 94, target: 90 },
];

const chartConfig = {
  score: {
    label: "My Score",
    color: "hsl(var(--primary))",
  },
  target: {
    label: "Target",
    color: "hsl(var(--muted-foreground))",
  },
};

export default function PerformanceTrendWidget() {
  const [range, setRange] = useState([0, 11]); // Default to showing all 12 months

  const visibleData = useMemo(() => {
    return allPerformanceData.slice(range[0], range[1] + 1);
  }, [range]);

  const handleRangeChange = (newRange: number[]) => {
    // Ensure the range has at least two data points if possible
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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
            <TrendingUp className="text-primary" />
            Performance Trend
        </CardTitle>
        <CardDescription>
          Your performance score over time compared to the target.
        </CardDescription>
      </CardHeader>
      <CardContent>
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
                    dataKey="score"
                    type="monotone"
                    stroke="var(--color-score)"
                    strokeWidth={3}
                    dot={{ r: 5 }}
                    activeDot={{ r: 7 }}
                />
                <Line
                    dataKey="target"
                    type="monotone"
                    stroke="var(--color-target)"
                    strokeWidth={2}
                    strokeDasharray="3 3"
                    dot={false}
                />
              </LineChart>
            </ChartContainer>
        </div>
        <div className="px-2">
            <Slider
                defaultValue={[0, 11]}
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
      </CardContent>
    </Card>
  );
}
