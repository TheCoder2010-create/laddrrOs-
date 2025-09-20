
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import DashboardLayout from "@/components/dashboard-layout";
import { useRole } from "@/hooks/use-role";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { ArrowLeft, BarChart2, Star, TrendingUp, TrendingDown, Users, LineChart as LineChartIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from 'date-fns';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { LineChart, CartesianGrid, XAxis, Line, YAxis } from "recharts"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";


// Placeholder data for past simulations
const scorecardData = [
    {
        id: 1,
        date: new Date(new Date().setDate(new Date().getDate() - 15)),
        scenario: "Addressing a conflict with a peer from another team.",
        persona: "Employee",
        difficulty: "Friendly",
        scores: {
            clarity: 7.0,
            empathy: 8.5,
            assertiveness: 6.5,
            overall: 7.3,
        },
        strengths: ["Focused on shared goals.", "Listened without interrupting."],
        gaps: ["Was slightly apologetic when stating needs.", "Didn't define a clear next step."],
    },
    {
        id: 2,
        date: new Date(new Date().setDate(new Date().getDate() - 7)),
        scenario: "Asking for a promotion and raise.",
        persona: "Manager",
        difficulty: "Neutral",
        scores: {
            clarity: 9.0,
            empathy: 7.5,
            assertiveness: 8.8,
            overall: 8.4,
        },
        strengths: ["Provided specific examples of accomplishments.", "Maintained a professional tone throughout."],
        gaps: ["Could have prepared a response for budget constraints."],
    },
    {
        id: 3,
        date: new Date(new Date().setDate(new Date().getDate() - 2)),
        scenario: "Giving tough feedback about missed deadlines to a good performer.",
        persona: "Team Lead",
        difficulty: "Strict / Defensive",
        scores: {
            clarity: 8.5,
            empathy: 6.0,
            assertiveness: 7.8,
            overall: 7.4,
        },
        strengths: ["Opened the conversation clearly.", "Used 'I' statements effectively."],
        gaps: ["Could have acknowledged their perspective more.", "Closing was a bit abrupt."],
    },
];

const chartData = scorecardData.map(entry => ({
  date: format(entry.date, 'MMM d'),
  overall: entry.scores.overall,
})).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());


const chartConfig = {
  overall: {
    label: "Overall Score",
    color: "hsl(var(--primary))",
  },
} satisfies ChartConfig

function ScorecardPage() {
    const overallScores = scorecardData.map(d => d.scores.overall);
    const averageScore = overallScores.reduce((a, b) => a + b, 0) / overallScores.length;
    const bestScore = Math.max(...overallScores);

    return (
        <div className="p-4 md:p-8">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold font-headline flex items-center gap-2">
                    <BarChart2 className="h-8 w-8 text-primary" />
                    My Scorecard
                </h1>
                <Button variant="outline" asChild>
                    <Link href="/nets">
                        <ArrowLeft className="mr-2" />
                        Back to Arena
                    </Link>
                </Button>
            </div>

            <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <LineChartIcon className="h-6 w-6 text-primary" />
                            Overall Performance Trend
                        </CardTitle>
                        <CardDescription>
                            Your progress across all simulations over time.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-3 gap-4 text-center">
                            <div className="p-3 rounded-md bg-muted">
                                <p className="text-sm text-muted-foreground">Average Score</p>
                                <p className="text-2xl font-bold">{averageScore.toFixed(1)}</p>
                            </div>
                            <div className="p-3 rounded-md bg-muted">
                                <p className="text-sm text-muted-foreground">Best Score</p>
                                <p className="text-2xl font-bold text-green-500">{bestScore.toFixed(1)}</p>
                            </div>
                            <div className="p-3 rounded-md bg-muted">
                                <p className="text-sm text-muted-foreground">Simulations</p>
                                <p className="text-2xl font-bold">{scorecardData.length}</p>
                            </div>
                        </div>
                        <div className="h-[250px] w-full">
                             <ChartContainer config={chartConfig} className="h-full w-full">
                                <LineChart
                                    accessibilityLayer
                                    data={chartData}
                                    margin={{
                                    left: 12,
                                    right: 12,
                                    top: 12,
                                    }}
                                >
                                    <CartesianGrid vertical={false} />
                                    <XAxis
                                        dataKey="date"
                                        tickLine={false}
                                        axisLine={false}
                                        tickMargin={8}
                                        tickFormatter={(value) => value.slice(0, 3)}
                                    />
                                    <YAxis
                                        domain={[Math.min(...overallScores) - 1, 10]}
                                        tickLine={false}
                                        axisLine={false}
                                        tickMargin={8}
                                    />
                                    <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                                    <Line
                                        dataKey="overall"
                                        type="monotone"
                                        stroke="var(--color-overall)"
                                        strokeWidth={2}
                                        dot={{
                                            fill: "var(--color-overall)",
                                        }}
                                        activeDot={{
                                            r: 6,
                                        }}
                                    />
                                </LineChart>
                            </ChartContainer>
                        </div>
                    </CardContent>
                </Card>

                <div className="space-y-4">
                    <h2 className="text-xl font-semibold pt-4">Simulation History</h2>
                    <Accordion type="single" collapsible className="w-full space-y-2">
                        {scorecardData.slice().reverse().map((entry) => (
                            <AccordionItem value={`item-${entry.id}`} key={entry.id} className="border rounded-lg bg-card shadow-sm hover:shadow-md transition-shadow">
                                <AccordionTrigger className="px-4 py-3 hover:no-underline">
                                     <div className="flex justify-between items-center w-full">
                                        <div className="text-left">
                                            <p className="font-semibold text-foreground">{entry.scenario}</p>
                                            <p className="text-sm text-muted-foreground font-normal">
                                                vs. {entry.persona} on {format(entry.date, 'PPP')}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-4 pr-2">
                                            <div className="flex items-center gap-2 text-xl font-bold text-secondary">
                                                <Star className="h-5 w-5 fill-secondary" />
                                                <span>{entry.scores.overall.toFixed(1)}</span>
                                            </div>
                                             <Badge variant="secondary">{entry.difficulty}</Badge>
                                        </div>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent className="p-4 pt-0">
                                    <div className="space-y-4 border-t pt-4">
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                                            <div className="p-2 rounded-md bg-muted">
                                                <p className="text-xs text-muted-foreground">Clarity</p>
                                                <p className="text-md font-semibold">{entry.scores.clarity.toFixed(1)}</p>
                                            </div>
                                            <div className="p-2 rounded-md bg-muted">
                                                <p className="text-xs text-muted-foreground">Empathy</p>
                                                <p className="text-md font-semibold">{entry.scores.empathy.toFixed(1)}</p>
                                            </div>
                                            <div className="p-2 rounded-md bg-muted">
                                                <p className="text-xs text-muted-foreground">Assertiveness</p>
                                                <p className="text-md font-semibold">{entry.scores.assertiveness.toFixed(1)}</p>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                                            <div className="space-y-2">
                                                <h4 className="font-semibold flex items-center gap-2 text-green-600 dark:text-green-400">
                                                    <TrendingUp /> Strengths
                                                </h4>
                                                <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
                                                    {entry.strengths.map((s, i) => <li key={i}>{s}</li>)}
                                                </ul>
                                            </div>
                                            <div className="space-y-2">
                                                <h4 className="font-semibold flex items-center gap-2 text-yellow-600 dark:text-yellow-400">
                                                    <TrendingDown /> Areas for Improvement
                                                </h4>
                                                <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
                                                    {entry.gaps.map((g, i) => <li key={i}>{g}</li>)}
                                                </ul>
                                            </div>
                                        </div>
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                </div>
            </div>
        </div>
    );
}


export default function ScorecardLayout() {
    const { role, setRole, isLoading } = useRole();

    if (isLoading || !role) {
        return (
            <DashboardLayout role="Employee" onSwitchRole={() => { }}>
                <Skeleton className="w-full h-screen" />
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout role={role} onSwitchRole={setRole}>
            <ScorecardPage />
        </DashboardLayout>
    );
}
