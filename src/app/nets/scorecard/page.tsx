
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import DashboardLayout from "@/components/dashboard-layout";
import { useRole } from "@/hooks/use-role";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { ArrowLeft, BarChart2, Star, TrendingUp, TrendingDown, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from 'date-fns';

// Placeholder data for past simulations
const scorecardData = [
    {
        id: 1,
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
    }
];

function ScorecardPage() {
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
                {scorecardData.map((entry) => (
                    <Card key={entry.id} className="shadow-md hover:shadow-lg transition-shadow">
                        <CardHeader>
                            <div className="flex justify-between items-start">
                                <div>
                                    <CardTitle className="text-xl">{entry.scenario}</CardTitle>
                                    <CardDescription>
                                        Practiced with a <span className="font-semibold text-primary">{entry.persona}</span> on {format(entry.date, 'PPP')}
                                    </CardDescription>
                                </div>
                                <div className="flex flex-col items-end gap-2">
                                    <Badge variant="secondary">{entry.difficulty}</Badge>
                                    <div className="flex items-center gap-2 text-2xl font-bold text-secondary">
                                        <Star className="h-6 w-6 fill-secondary" />
                                        <span>{entry.scores.overall.toFixed(1)}</span>
                                    </div>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                                <div className="p-3 rounded-md bg-muted">
                                    <p className="text-sm text-muted-foreground">Clarity</p>
                                    <p className="text-lg font-semibold">{entry.scores.clarity.toFixed(1)}</p>
                                </div>
                                <div className="p-3 rounded-md bg-muted">
                                    <p className="text-sm text-muted-foreground">Empathy</p>
                                    <p className="text-lg font-semibold">{entry.scores.empathy.toFixed(1)}</p>
                                </div>
                                <div className="p-3 rounded-md bg-muted">
                                    <p className="text-sm text-muted-foreground">Assertiveness</p>
                                    <p className="text-lg font-semibold">{entry.scores.assertiveness.toFixed(1)}</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
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
                        </CardContent>
                    </Card>
                ))}
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
