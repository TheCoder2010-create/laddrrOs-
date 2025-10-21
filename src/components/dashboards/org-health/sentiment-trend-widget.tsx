"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartConfig } from "@/components/ui/chart"
import { LineChart, CartesianGrid, XAxis, YAxis, Line, Dot } from "recharts"
import { HeartPulse } from "lucide-react"

const chartData = [
  { month: "Jan", score: 72 },
  { month: "Feb", score: 75 },
  { month: "Mar", score: 70 },
  { month: "Apr", score: 68 },
  { month: "May", score: 78 },
  { month: "Jun", score: 82 },
]

const chartConfig = {
  score: {
    label: "Morale Score",
    color: "hsl(var(--primary))",
  },
} satisfies ChartConfig

export default function SentimentTrendWidget() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-medium flex items-center gap-2">
            <HeartPulse className="text-primary"/>
            Historical Morale Trends
        </CardTitle>
        <CardDescription>Overall employee morale score over the last 6 months.</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[250px] w-full">
          <LineChart
            accessibilityLayer
            data={chartData}
            margin={{
              left: 12,
              right: 12,
            }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              domain={[60, 90]}
            />
            <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
            <Line
              dataKey="score"
              type="monotone"
              stroke="var(--color-score)"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}