
"use client";

import { useState, useEffect, useCallback, useTransition } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { getOneOnOneHistory, OneOnOneHistoryItem, updateCoachingProgress, addCoachingCheckIn } from '@/services/feedback-service';
import type { CoachingRecommendation } from '@/ai/schemas/one-on-one-schemas';
import { useRole } from '@/hooks/use-role';
import { roleUserMapping } from '@/lib/role-mapping';
import { Skeleton } from '@/components/ui/skeleton';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Activity, BookOpen, Podcast, Newspaper, GraduationCap, Lightbulb, History, MessageSquare, Loader2 } from 'lucide-react';
import { useDebouncedCallback } from 'use-debounce';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ScrollArea } from '@/components/ui/scroll-area';

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

    const [historyInView, setHistoryInView] = useState<CoachingRecommendation | null>(null);

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

            <Dialog open={!!historyInView} onOpenChange={() => setHistoryInView(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Check-in History</DialogTitle>
                        <DialogDescription>
                            Your progress journal for "{historyInView?.area}".
                        </DialogDescription>
                    </DialogHeader>
                    <ScrollArea className="max-h-[60vh] pr-4">
                        <div className="py-4 space-y-4">
                            {historyInView?.checkIns && historyInView.checkIns.length > 0 ? (
                                historyInView.checkIns.slice().reverse().map(checkIn => (
                                    <div key={checkIn.id} className="flex items-start gap-3">
                                        <MessageSquare className="h-4 w-4 mt-1 text-primary/70 flex-shrink-0" />
                                        <div className="flex-1">
                                            <p className="text-xs text-muted-foreground">{format(new Date(checkIn.date), 'PPP, p')}</p>
                                            <p className="text-sm text-foreground">{checkIn.notes}</p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-sm text-muted-foreground text-center py-4">No check-ins have been logged for this item yet.</p>
                            )}
                        </div>
                    </ScrollArea>
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button variant="outline">Close</Button>
                        </DialogClose>
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
                        Update your progress on your current coaching goals. Click on an item to view its history.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {activePlans.map(({ historyId, rec }) => (
                        <div 
                            key={rec.id} 
                            className="p-4 border rounded-lg bg-muted/50 space-y-4 cursor-pointer hover:bg-muted/80 transition-colors"
                            onClick={() => setHistoryInView(rec)}
                            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setHistoryInView(rec); }}
                            role="button"
                            tabIndex={0}
                        >
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="font-semibold text-foreground">{rec.area}</p>
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                                        <RecommendationIcon type={rec.type} />
                                        <span>{rec.type}: {rec.resource}</span>
                                    </div>
                                </div>
                                <div 
                                    className="flex flex-col items-end gap-2"
                                    onClick={(e) => e.stopPropagation()} // Prevent card click when interacting with slider
                                >
                                     <p className="text-3xl font-bold text-primary">{rec.progress ?? 0}%</p>
                                     <Slider
                                        defaultValue={[rec.progress ?? 0]}
                                        max={100}
                                        step={10}
                                        onValueChange={(value) => debouncedProgressUpdate(historyId, rec.id, value[0])}
                                        className="w-28"
                                     />
                                </div>
                            </div>
                        </div>
                    ))}
                </CardContent>
            </Card>
        </>
    );
}
