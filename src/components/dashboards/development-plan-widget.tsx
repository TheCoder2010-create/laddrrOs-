
"use client";

import { useState, useEffect, useCallback, useTransition } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { getOneOnOneHistory, OneOnOneHistoryItem, updateCoachingProgress, addCoachingCheckIn } from '@/services/feedback-service';
import type { CoachingRecommendation } from '@/ai/schemas/one-on-one-schemas';
import { useRole } from '@/hooks/use-role';
import { roleUserMapping } from '@/lib/role-mapping';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Activity, BookOpen, Podcast, Newspaper, GraduationCap, Lightbulb, History, MessageSquare, Loader2 } from 'lucide-react';
import { useDebouncedCallback } from 'use-debounce';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

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
    const { toast } = useToast();
    const [activePlans, setActivePlans] = useState<{ historyId: string; rec: CoachingRecommendation }[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isPending, startTransition] = useTransition();
    
    const [checkInRec, setCheckInRec] = useState<{ historyId: string, rec: CoachingRecommendation, newProgress: number } | null>(null);
    const [checkInNotes, setCheckInNotes] = useState('');
    const [isSubmittingCheckIn, setIsSubmittingCheckIn] = useState(false);

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

    const debouncedProgressUpdate = useDebouncedCallback((historyId: string, recId: string, newProgress: number) => {
        const plan = activePlans.find(p => p.historyId === historyId && p.rec.id === recId);
        if (plan) {
            setCheckInRec({ historyId, rec: plan.rec, newProgress });
        }
    }, 500);

    const handleCheckInSubmit = () => {
        if (!checkInRec || !checkInNotes) return;
        
        const { historyId, rec, newProgress } = checkInRec;

        setIsSubmittingCheckIn(true);
        startTransition(async () => {
            await updateCoachingProgress(historyId, rec.id, newProgress);
            await addCoachingCheckIn(historyId, rec.id, checkInNotes);
            
            toast({
                title: "Progress Updated",
                description: "Your check-in has been logged successfully.",
            });

            // Optimistically update UI
            setActivePlans(prevPlans =>
                prevPlans.map(plan =>
                    plan.historyId === historyId && plan.rec.id === rec.id
                        ? { ...plan, rec: { 
                              ...plan.rec, 
                              progress: newProgress,
                              checkIns: [...(plan.rec.checkIns || []), { id: 'temp', date: new Date().toISOString(), notes: checkInNotes }]
                          } }
                        : plan
                )
            );
            
            setCheckInRec(null);
            setCheckInNotes('');
            setIsSubmittingCheckIn(false);
            fetchActivePlans(); // re-fetch for consistency
        });
    }

    if (isLoading) {
        return <Skeleton className="h-48 w-full" />;
    }

    if (activePlans.length === 0) {
        return null; // Don't render the widget if there are no active plans
    }

    return (
        <>
            <Dialog open={!!checkInRec} onOpenChange={() => setCheckInRec(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>How is it going?</DialogTitle>
                        <DialogDescription>
                            Let's log a quick check-in for your work on "{checkInRec?.rec.area}". Your progress is now at {checkInRec?.newProgress}%.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4 space-y-2">
                        <Label htmlFor="checkin-notes">What have you learned or tried so far?</Label>
                        <Textarea 
                            id="checkin-notes"
                            value={checkInNotes}
                            onChange={(e) => setCheckInNotes(e.target.value)}
                            placeholder="e.g., I tried the 'state my path' technique from the book. It was difficult but...' or 'This podcast episode had a great tip on...'"
                            rows={5}
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setCheckInRec(null)}>Cancel</Button>
                        <Button onClick={handleCheckInSubmit} disabled={isSubmittingCheckIn || !checkInNotes}>
                            {isSubmittingCheckIn && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save Check-in
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

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
                        <div key={rec.id} className="p-4 border rounded-lg bg-muted/50 space-y-4">
                            <div>
                                <p className="font-semibold text-foreground">{rec.area}</p>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                                    <RecommendationIcon type={rec.type} />
                                    <span>{rec.type}: {rec.resource}</span>
                                </div>
                            </div>
                            
                            <div className="space-y-2">
                                <div className="flex justify-between items-center mb-1">
                                    <Label className="text-xs text-muted-foreground">Progress</Label>
                                    <Badge variant={rec.progress === 100 ? "success" : "secondary"}>
                                        {rec.progress ?? 0}% Complete
                                    </Badge>
                                </div>
                                <Slider
                                   defaultValue={[rec.progress ?? 0]}
                                   max={100}
                                   step={10}
                                   onValueChange={(value) => debouncedProgressUpdate(historyId, rec.id, value[0])}
                                />
                            </div>

                             {rec.checkIns && rec.checkIns.length > 0 && (
                                <Accordion type="single" collapsible className="w-full">
                                    <AccordionItem value="check-in-history">
                                        <AccordionTrigger className="pt-2 text-sm font-medium flex items-center gap-2 text-muted-foreground hover:no-underline">
                                            <History className="h-4 w-4" />
                                            Check-in History
                                        </AccordionTrigger>
                                        <AccordionContent className="pt-2 space-y-3">
                                            {rec.checkIns.slice(-3).reverse().map(checkIn => (
                                                <div key={checkIn.id} className="flex items-start gap-3">
                                                    <MessageSquare className="h-4 w-4 mt-1 text-primary/70" />
                                                    <div className="flex-1">
                                                        <p className="text-xs text-muted-foreground">{format(new Date(checkIn.date), 'PPP')}</p>
                                                        <p className="text-sm text-foreground">{checkIn.notes}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </AccordionContent>
                                    </AccordionItem>
                                </Accordion>
                            )}
                        </div>
                    ))}
                </CardContent>
            </Card>
        </>
    );
}
