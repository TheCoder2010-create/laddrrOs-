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
            <CardHeader className="pb-2">
                <CardTitle className="text-base font-medium flex items-center gap-2">
                    <Users className="text-primary" />
                    Survey Engagement
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted">
                    <div>
                        <p className="text-sm font-medium text-muted-foreground">Participation Rate</p>
                        <p className="text-2xl font-bold text-primary">{metrics.participationRate}%</p>
                    </div>
                    <Users className="h-8 w-8 text-muted-foreground/50" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                     <div className="text-center p-2 rounded-md bg-muted/50">
                        <p className="text-xs text-muted-foreground">Submissions</p>
                        <p className="text-lg font-bold">{metrics.submissionCount}</p>
                    </div>
                     <div className="text-center p-2 rounded-md bg-muted/50">
                        <p className="text-xs text-muted-foreground">Opt-Outs</p>
                        <p className="text-lg font-bold">{metrics.optOutRate}%</p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
