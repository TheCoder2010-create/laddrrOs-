"use client";

import { useState, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import DashboardLayout from "@/components/dashboard-layout";
import { useRole } from "@/hooks/use-role";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { ArrowLeft, BarChart2, Star, TrendingUp, TrendingDown, Users, LineChart as LineChartIcon, Bot, User, ThumbsUp, ThumbsDown, Award, Sparkles, Activity, FileClock } from "lucide-react";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { getCompletedPracticeScenariosForUser, AssignedPracticeScenario } from '@/services/feedback-service';


const chartConfig = {
  overall: {
    label: "Overall Score",
    color: "hsl(var(--primary))",
  },
} satisfies ChartConfig

const badges = [
    { title: "Clarity Champion", icon: Award, description: "Achieved a Clarity score of 9+ in a simulation." },
    { title: "Empathy Explorer", icon: Sparkles, description: "Showed high levels of empathy in 3 consecutive sessions." },
    { title: "5-Day Streak", icon: Activity, description: "Completed a simulation every day for 5 days." },
    { title: "Assertiveness Ace", icon: ThumbsUp, description: "Scored 8.5+ in Assertiveness with a 'Strict' persona." },
];

function ScorecardPage() {
    const { role } = useRole();
    const [completedScenarios, setCompletedScenarios] = useState<AssignedPracticeScenario[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchCompletedScenarios = useCallback(async () => {
        if (!role) return;
        setIsLoading(true);
        const scenarios = await getCompletedPracticeScenariosForUser(role);
        setCompletedScenarios(scenarios.sort((a,b) => new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime()));
        setIsLoading(false);
    }, [role]);

    useEffect(() => {
        fetchCompletedScenarios();
    }, [fetchCompletedScenarios]);


    const chartData = completedScenarios.map(entry => ({
        date: format(new Date(entry.completedAt!), 'MMM d'),
        overall: entry.analysis?.scores.overall,
    })).reverse();

    const overallScores = completedScenarios.map(d => d.analysis?.scores.overall || 0);
    const averageScore = overallScores.length > 0 ? overallScores.reduce((a, b) => a + b, 0) / overallScores.length : 0;
    const bestScore = overallScores.length > 0 ? Math.max(...overallScores) : 0;

    const Annotation = ({ text, type }: { text: string; type: 'positive' | 'negative' }) => {
        const Icon = type === 'positive' ? ThumbsUp : ThumbsDown;
        const colorClass = type === 'positive' ? 'text-green-600 dark:text-green-400' : 'text-yellow-600 dark:text-yellow-400';
        const bgClass = type === 'positive' ? 'bg-green-500/10' : 'bg-yellow-500/10';

        return (
            <div className={cn("mt-1.5 flex items-start gap-2 p-2 rounded-md text-xs", colorClass, bgClass)}>
                <Icon className="h-4 w-4 flex-shrink-0 mt-0.5" />
                <p className="flex-1">{text}</p>
            </div>
        );
    };
    
    if (isLoading) {
        return (
             <div className="p-4 md:p-8 space-y-6">
                <Skeleton className="h-10 w-64" />
                <Skeleton className="h-96 w-full" />
                <Skeleton className="h-48 w-full" />
                <Skeleton className="h-64 w-full" />
            </div>
        )
    }

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
            
             {completedScenarios.length === 0 ? (
                <Card>
                    <CardHeader>
                         <CardTitle className="flex items-center gap-2">
                            <FileClock className="h-6 w-6 text-muted-foreground" />
                            No History Found
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="text-center py-12">
                        <p className="text-lg text-muted-foreground">You haven't completed any practice simulations yet.</p>
                        <p className="mt-2">Complete a simulation in the "Nets" arena to see your scorecard.</p>
                         <Button asChild className="mt-6">
                            <Link href="/nets">Go to Nets Arena</Link>
                        </Button>
                    </CardContent>
                </Card>
            ) : (
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
                                    <p className="text-2xl font-bold">{completedScenarios.length}</p>
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
                                            domain={[Math.min(...overallScores) > 1 ? Math.min(...overallScores) - 1 : 0, 10]}
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

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Award className="h-6 w-6 text-yellow-500" />
                                Badges & Streaks
                            </CardTitle>
                            <CardDescription>
                                Your achievements from practicing in the Nets arena.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {badges.map((badge, index) => (
                                    <div key={index} className="flex flex-col items-center text-center p-4 border rounded-lg bg-muted/50">
                                        <badge.icon className="h-10 w-10 text-yellow-400 mb-2" />
                                        <p className="font-semibold text-sm">{badge.title}</p>
                                        <p className="text-xs text-muted-foreground">{badge.description}</p>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    <div className="space-y-4">
                        <h2 className="text-xl font-semibold pt-4">Simulation History</h2>
                        <Accordion type="single" collapsible className="w-full space-y-2">
                            {completedScenarios.map((entry) => (
                                <AccordionItem value={`item-${entry.id}`} key={entry.id} className="border rounded-lg bg-card shadow-sm hover:shadow-md transition-shadow">
                                    <AccordionTrigger className="px-4 py-3 hover:no-underline">
                                        <div className="flex justify-between items-center w-full">
                                            <div className="text-left">
                                                <p className="font-semibold text-foreground">{entry.scenario}</p>
                                                <p className="text-sm text-muted-foreground font-normal">
                                                    vs. {entry.persona} on {format(new Date(entry.completedAt!), 'PPP')}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-4 pr-2">
                                                <div className="flex items-center gap-2 text-xl font-bold text-secondary">
                                                    <Star className="h-5 w-5 fill-secondary" />
                                                    <span>{entry.analysis?.scores.overall.toFixed(1)}</span>
                                                </div>
                                                <Badge variant="secondary">{entry.analysis?.scores.overall ? (entry.analysis.scores.overall > 8 ? "Excellent" : "Good") : "N/A"}</Badge>
                                            </div>
                                        </div>
                                    </AccordionTrigger>
                                    <AccordionContent className="p-4 pt-0">
                                        {entry.analysis ? (
                                        <div className="space-y-6 border-t pt-4">
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                                                <div className="p-2 rounded-md bg-muted">
                                                    <p className="text-xs text-muted-foreground">Clarity</p>
                                                    <p className="text-md font-semibold">{entry.analysis.scores.clarity.toFixed(1)}</p>
                                                </div>
                                                <div className="p-2 rounded-md bg-muted">
                                                    <p className="text-xs text-muted-foreground">Empathy</p>
                                                    <p className="text-md font-semibold">{entry.analysis.scores.empathy.toFixed(1)}</p>
                                                </div>
                                                <div className="p-2 rounded-md bg-muted">
                                                    <p className="text-xs text-muted-foreground">Assertiveness</p>
                                                    <p className="text-md font-semibold">{entry.analysis.scores.assertiveness.toFixed(1)}</p>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                                                <div className="space-y-2">
                                                    <h4 className="font-semibold flex items-center gap-2 text-green-600 dark:text-green-400">
                                                        <TrendingUp /> Strengths
                                                    </h4>
                                                    <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
                                                        {entry.analysis.strengths.map((s, i) => <li key={i}>{s}</li>)}
                                                    </ul>
                                                </div>
                                                <div className="space-y-2">
                                                    <h4 className="font-semibold flex items-center gap-2 text-yellow-600 dark:text-yellow-400">
                                                        <TrendingDown /> Areas for Improvement
                                                    </h4>
                                                    <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
                                                        {entry.analysis.gaps.map((g, i) => <li key={i}>{g}</li>)}
                                                    </ul>
                                                </div>
                                            </div>

                                            <div>
                                                <h4 className="font-semibold text-foreground mb-3">Simulation Replay</h4>
                                                <ScrollArea className="h-[300px] w-full border rounded-lg p-4 space-y-4 bg-muted/30">
                                                    {entry.analysis.annotatedConversation.map((msg, index) => (
                                                        <div key={index} className="space-y-2">
                                                            <div className={cn("flex items-start gap-3", msg.role === 'user' ? 'justify-end' : 'justify-start')}>
                                                                {msg.role === 'model' && (
                                                                    <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                                                                        <Bot className="text-secondary-foreground" />
                                                                    </div>
                                                                )}
                                                                <div className={cn(
                                                                    "max-w-[85%] rounded-lg px-4 py-2 text-sm",
                                                                    msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-background border'
                                                                )}>
                                                                    <p className="whitespace-pre-wrap">{msg.content}</p>
                                                                </div>
                                                                {msg.role === 'user' && (
                                                                    <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                                                                        <User className="text-muted-foreground" />
                                                                    </div>
                                                                )}
                                                            </div>
                                                            {msg.annotation && msg.type && (
                                                                <div className={cn("flex items-start gap-3", msg.role === 'user' ? 'justify-end' : 'justify-start')}>
                                                                    {msg.role === 'model' && <div className="w-8 flex-shrink-0" />}
                                                                    <div className="w-[85%]">
                                                                        <Annotation text={msg.annotation} type={msg.type} />
                                                                    </div>
                                                                    {msg.role === 'user' && <div className="w-8 flex-shrink-0" />}
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}
                                                </ScrollArea>
                                            </div>
                                        </div>
                                        ) : (
                                            <p className="text-muted-foreground text-center py-4">Analysis data is not available for this session.</p>
                                        )}
                                    </AccordionContent>
                                </AccordionItem>
                            ))}
                        </Accordion>
                    </div>
                </div>
            )}
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
