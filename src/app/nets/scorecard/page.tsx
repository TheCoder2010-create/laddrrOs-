
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import DashboardLayout from "@/components/dashboard-layout";
import { useRole } from "@/hooks/use-role";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { ArrowLeft, BarChart2, Star, TrendingUp, TrendingDown, Users, LineChart as LineChartIcon, Bot, User, ThumbsUp, ThumbsDown, Award, Sparkles, Activity } from "lucide-react";
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
        conversation: [
            { role: 'model', content: "Hey, got a minute? You wanted to chat about the Q3 project launch." },
            { role: 'user', content: "Yeah, thanks for making time. I wanted to talk about the data integration part. It seems like our teams are not on the same page.", annotation: "Good, direct opening. Clearly states the topic.", type: 'positive' },
            { role: 'model', content: "Oh? I thought we were aligned after the last sync. What's the issue?" },
            { role: 'user', content: "Well, it's just that it feels like my team's requirements were kind of ignored. We need the data in a different format.", annotation: "The phrase 'it feels like' can weaken the statement. Try being more direct.", type: 'negative' },
            { role: 'model', content: "Ignored is a strong word. We followed the spec that was approved. Changing the format now would cause significant delays." },
            { role: 'user', content: "I understand that, and I'm sorry if it causes issues, but we can't proceed without it. It's a must-have for us.", annotation: "Apologizing here undermines your position. It's okay to state your team's needs firmly.", type: 'negative' },
            { role: 'model', content: "This is the first I'm hearing of it being a 'must-have'. Why wasn't this in the initial spec?" },
            { role: 'user', content: "You're right, it should have been clearer from our side. Let's work together to find a solution that minimizes delay but still gets us what we need. How about we whiteboard a few options this afternoon?", annotation: "Excellent pivot. Takes ownership and proposes a collaborative next step.", type: 'positive' }
        ]
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
        conversation: [
            { role: 'model', content: "Hi, come on in. What's on your mind?" },
            { role: 'user', content: "Thanks for meeting. Based on my work leading the Project Phoenix launch and the resulting 15% efficiency gain, I'd like to be considered for a promotion to Senior Developer and discuss a corresponding salary adjustment.", annotation: "Perfect opening. Confident, data-backed, and clearly states the desired outcome.", type: 'positive' },
            { role: 'model', content: "I agree, your work on Phoenix was outstanding. The official promotion cycle is in Q4, but let's talk about what that would look like." }
        ]
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
        conversation: [
            { role: 'model', content: "What's up? You scheduled this meeting." },
            { role: 'user', content: "Thanks for joining. I wanted to talk about the deadlines for the past two sprints. I've noticed you've missed them, which is unusual for you. I want to understand what's going on and how I can help.", annotation: "Good use of a SOFT start: Specific, Objective, Feeling, and Thought.", type: 'positive'},
            { role: 'model', content: "I've been swamped. Everyone has. The workload is insane right now."},
            { role: 'user', content: "The workload is high, I agree. But the missed deadlines are impacting the rest of the team's ability to move forward. We need to find a way to ensure your tasks are completed on time.", annotation: "This could be perceived as dismissive. Try acknowledging their point more directly before stating the impact.", type: 'negative'}
        ]
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

const badges = [
    { title: "Clarity Champion", icon: Award, description: "Achieved a Clarity score of 9+ in a simulation." },
    { title: "Empathy Explorer", icon: Sparkles, description: "Showed high levels of empathy in 3 consecutive sessions." },
    { title: "5-Day Streak", icon: Activity, description: "Completed a simulation every day for 5 days." },
    { title: "Assertiveness Ace", icon: ThumbsUp, description: "Scored 8.5+ in Assertiveness with a 'Strict' persona." },
];

function ScorecardPage() {
    const overallScores = scorecardData.map(d => d.scores.overall);
    const averageScore = overallScores.reduce((a, b) => a + b, 0) / overallScores.length;
    const bestScore = Math.max(...overallScores);

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
                                    <div className="space-y-6 border-t pt-4">
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

                                        <div>
                                            <h4 className="font-semibold text-foreground mb-3">Simulation Replay</h4>
                                            <ScrollArea className="h-[300px] w-full border rounded-lg p-4 space-y-4 bg-muted/30">
                                                {entry.conversation.map((msg, index) => (
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
