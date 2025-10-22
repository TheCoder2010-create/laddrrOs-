
"use client"

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Users, FileCheck, UserX } from 'lucide-react';

const metrics = {
    participationRate: 78,
    submissionCount: 156,
    optOutRate: 5,
};

export default function ParticipationMetricsWidget() {
    return (
        <Card className="h-full">
            <CardHeader className="p-2 pt-2">
                <CardTitle className="text-base font-medium flex items-center gap-2">
                    <Users className="text-primary" />
                    Survey Engagement
                </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-3 gap-4 pt-2">
                <div className="text-center p-3 rounded-lg bg-muted">
                    <p className="text-sm font-medium text-muted-foreground">Participation</p>
                    <p className="text-2xl font-bold text-primary">{metrics.participationRate}%</p>
                </div>
                <div className="text-center p-3 rounded-md bg-muted/50">
                    <p className="text-sm font-medium text-muted-foreground">Submissions</p>
                    <p className="text-2xl font-bold">{metrics.submissionCount}</p>
                </div>
                <div className="text-center p-3 rounded-md bg-muted/50">
                    <p className="text-sm font-medium text-muted-foreground">Opt-Outs</p>
                    <p className="text-2xl font-bold">{metrics.optOutRate}%</p>
                </div>
            </CardContent>
        </Card>
    );
}
