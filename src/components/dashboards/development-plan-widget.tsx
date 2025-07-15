
"use client";

import { useState, useEffect, useCallback, useTransition } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { getOneOnOneHistory, OneOnOneHistoryItem, updateCoachingProgress } from '@/services/feedback-service';
import type { CoachingRecommendation } from '@/ai/schemas/one-on-one-schemas';
import { useRole } from '@/hooks/use-role';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Activity, BookOpen, Podcast, Newspaper, GraduationCap, Lightbulb } from 'lucide-react';
import { useDebounce } from 'react-use';

const RecommendationIcon = ({ type }: { type: CoachingRecommendation['type'] }) => {
    switch (type) {
        case 'Book': return <BookOpen className="h-4 w-4" />;
        case 'Podcast': return <Podcast className="h-4 w-4" />;
        case 'Article': return <Newspaper className="h-4 w-4" />;
        case 'Course': return <GraduationCap className="h-4 w-4" />;
        default: return <Lightbulb className="h-4 w-4" />;
    }
};

export default function DevelopmentPlanWidget() {
    const { role } = useRole();
    const [activePlans, setActivePlans] = useState<{ historyId: string; rec: CoachingRecommendation }[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isPending, startTransition] = useTransition();

    const fetchActivePlans = useCallback(async () => {
        if (!role) return;
        setIsLoading(true);
        const history = await getOneOnOneHistory();
        const plans: { historyId: string; rec: CoachingRecommendation }[] = [];
        const currentUserName = role ? roleUserMapping[role].name : null;

        history.forEach(item => {
            if (item.supervisorName === currentUserName) {
                item.analysis.coachingRecommendations.forEach(rec => {
                    if (rec.status === 'accepted' && (rec.progress ?? 0) < 100) {
                        plans.push({ historyId: item.id, rec });
                    }
                });
            }
        });
        setActivePlans(plans);
        setIsLoading(false);
    }, [role]);

    useEffect(() => {
        fetchActivePlans();
        const handleDataUpdate = () => fetchActivePlans();
        window.addEventListener('storage', handleDataUpdate);
        window.addEventListener('feedbackUpdated', handleDataUpdate);
        return () => {
            window.removeEventListener('storage', handleDataUpdate);
            window.removeEventListener('feedbackUpdated', handleDataUpdate);
        };
    }, [fetchActivePlans]);

    const handleProgressChange = (historyId: string, recId: string, newProgress: number) => {
        startTransition(async () => {
            await updateCoachingProgress(historyId, recId, newProgress);
            // Optimistically update UI, but a full refetch will happen on storage event
             setActivePlans(prevPlans =>
                prevPlans.map(plan =>
                    plan.historyId === historyId && plan.rec.id === recId
                        ? { ...plan, rec: { ...plan.rec, progress: newProgress } }
                        : plan
                )
            );
        });
    };
    
    if (isLoading) {
        return <Skeleton className="h-48 w-full" />;
    }

    if (activePlans.length === 0) {
        return null; // Don't render the widget if there are no active plans
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Activity />
                    Active Development Plan
                </CardTitle>
                <CardDescription>
                    Update your progress on your current coaching goals.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {activePlans.map(({ historyId, rec }) => (
                    <div key={rec.id} className="p-4 border rounded-lg bg-muted/50">
                        <div className="flex justify-between items-start">
                             <div>
                                <p className="font-semibold text-foreground">{rec.area}</p>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                                    <RecommendationIcon type={rec.type} />
                                    <span>{rec.type}: {rec.resource}</span>
                                </div>
                            </div>
                            <Badge variant={rec.progress === 100 ? "success" : "secondary"}>
                                {rec.progress ?? 0}% Complete
                            </Badge>
                        </div>
                        <div className="mt-4">
                             <Slider
                                defaultValue={[rec.progress ?? 0]}
                                max={100}
                                step={10}
                                onValueChange={(value) => handleProgressChange(historyId, rec.id, value[0])}
                            />
                        </div>
                    </div>
                ))}
            </CardContent>
        </Card>
    );
}

    