
"use client";

import { useState, useEffect, useCallback, useTransition } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { getOneOnOneHistory, OneOnOneHistoryItem, updateCoachingProgress, addCoachingCheckIn, addCustomCoachingPlan } from '@/services/feedback-service';
import type { CoachingRecommendation } from '@/ai/schemas/one-on-one-schemas';
import { useRole } from '@/hooks/use-role';
import { roleUserMapping } from '@/lib/role-mapping';
import { Skeleton } from '@/components/ui/skeleton';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Activity, BookOpen, Podcast, Newspaper, GraduationCap, Lightbulb, History, MessageSquare, Loader2, Check, Plus, Calendar as CalendarIcon, NotebookPen } from 'lucide-react';
import { useDebouncedCallback } from 'use-debounce';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';

const RecommendationIcon = ({ type }: { type: CoachingRecommendation['type'] }) => {
    switch (type) {
        case 'Book': return <BookOpen className="h-4 w-4" />;
        case 'Podcast': return <Podcast className="h-4 w-4" />;
        case 'Article': return <Newspaper className="h-4 w-4" />;
        case 'Course': return <GraduationCap className="h-4 w-4" />;
        default: return <Lightbulb className="h-4 w-4" />;
    }
};

function AddPlanDialog({ open, onOpenChange, onPlanAdded }: { open: boolean; onOpenChange: (open: boolean) => void; onPlanAdded: () => void }) {
    const { role } = useRole();
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // Form state
    const [area, setArea] = useState('');
    const [resource, setResource] = useState('');
    const [startDate, setStartDate] = useState<Date | undefined>();
    const [endDate, setEndDate] = useState<Date | undefined>();

    const handleSubmit = async () => {
        if (!role || !area || !resource || !startDate || !endDate) {
            toast({ variant: 'destructive', title: "Missing Information", description: "Please fill out all fields to add a plan." });
            return;
        }
        setIsSubmitting(true);
        try {
            await addCustomCoachingPlan(role, { area, resource, startDate, endDate });
            toast({ title: "Development Plan Added", description: "Your new goal is now active." });
            onPlanAdded();
            onOpenChange(false);
        } catch (error) {
            console.error("Failed to add custom plan", error);
            toast({ variant: 'destructive', title: "Submission Failed" });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Add a Custom Development Goal</DialogTitle>
                    <DialogDescription>
                        Define a new coaching or development activity for yourself. This will appear in your active plan.
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="goal-area">Goal Area</Label>
                        <Input id="goal-area" value={area} onChange={(e) => setArea(e.target.value)} placeholder="e.g., Public Speaking, Project Management" />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="goal-resource">Activity / Resource</Label>
                        <Input id="goal-resource" value={resource} onChange={(e) => setResource(e.target.value)} placeholder="e.g., Read 'Crucial Conversations', Complete Udemy course" />
                    </div>
                    <div className="space-y-2">
                      <Label>Start Date</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !startDate && "text-muted-foreground")}>
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {startDate ? format(startDate, "PPP") : <span>Pick a start date</span>}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                            <Calendar mode="single" selected={startDate} onSelect={setStartDate} initialFocus />
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div className="space-y-2">
                       <Label>Tentative End Date</Label>
                       <Popover>
                        <PopoverTrigger asChild>
                          <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !endDate && "text-muted-foreground")}>
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {endDate ? format(endDate, "PPP") : <span>Pick an end date</span>}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                            <Calendar mode="single" selected={endDate} onSelect={setEndDate} disabled={(date) => date < (startDate || new Date())} initialFocus />
                        </PopoverContent>
                      </Popover>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handleSubmit} disabled={isSubmitting || !area || !resource || !startDate || !endDate}>
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Add to My Plan
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

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
    const [isAddPlanDialogOpen, setIsAddPlanDialogOpen] = useState(false);

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
        setActivePlans(plans.sort((a, b) => new Date(a.rec.startDate || 0).getTime() - new Date(b.rec.startDate || 0).getTime()));
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
            // Only trigger check-in if progress has increased
            if (newProgress > (plan.rec.progress ?? 0)) {
                setCheckInRec({ historyId, rec: plan.rec, newProgress });
            }
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
            fetchActivePlans();
        });
    }
    
    const handleCheckInCancel = () => {
        setCheckInRec(null);
        // Re-fetch to reset slider state to last saved value
        fetchActivePlans();
    }


    if (isLoading) {
        return <Skeleton className="h-48 w-full" />;
    }

    return (
        <>
            <AddPlanDialog 
                open={isAddPlanDialogOpen} 
                onOpenChange={setIsAddPlanDialogOpen} 
                onPlanAdded={fetchActivePlans} 
            />

            <Dialog open={!!checkInRec} onOpenChange={(isOpen) => !isOpen && handleCheckInCancel()}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>How is it going?</DialogTitle>
                        <DialogDescription>
                            Let's log a quick check-in for your work on "{checkInRec?.rec.area}". Your progress is now at {checkInRec?.newProgress}%.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4 space-y-2 relative">
                        <Label htmlFor="checkin-notes">What have you learned or tried so far?</Label>
                        <Textarea 
                            id="checkin-notes"
                            value={checkInNotes}
                            onChange={(e) => setCheckInNotes(e.target.value)}
                            placeholder="Log your learnings and attempts here..."
                            rows={5}
                            className="pr-12 pb-12"
                        />
                         <Button 
                            size="icon" 
                            className="absolute bottom-6 right-4 h-8 w-8 rounded-full bg-success hover:bg-success/90"
                            onClick={handleCheckInSubmit} 
                            disabled={isSubmittingCheckIn || !checkInNotes}
                            aria-label="Save check-in"
                        >
                            {isSubmittingCheckIn ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={!!historyInView} onOpenChange={setHistoryInView}>
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
                </DialogContent>
            </Dialog>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div className="space-y-1.5">
                        <CardTitle className="flex items-center gap-2">
                            <Activity />
                            Active Development Plan
                        </CardTitle>
                        <CardDescription>
                            Update your progress on your current coaching goals. Click a card to view its history.
                        </CardDescription>
                    </div>
                     <Button variant="ghost" size="icon" onClick={() => setIsAddPlanDialogOpen(true)}>
                        <Plus className="h-5 w-5" />
                    </Button>
                </CardHeader>
                <CardContent>
                    {activePlans.length === 0 ? (
                        <div className="flex flex-col items-center justify-center text-center p-8 border-2 border-dashed rounded-lg">
                            <NotebookPen className="h-12 w-12 text-muted-foreground mb-4" />
                            <h3 className="text-lg font-semibold">No Active Plans</h3>
                            <p className="text-muted-foreground mt-1">Accept an AI recommendation or add your own goal to get started.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                            {activePlans.map(({ historyId, rec }) => (
                                <div 
                                    key={rec.id} 
                                    className="p-2 space-y-1.5 border rounded-lg bg-card/50 flex flex-col justify-between cursor-pointer hover:bg-muted/50 transition-colors min-h-[100px]"
                                    onClick={() => setHistoryInView(rec)}
                                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setHistoryInView(rec); }}
                                    role="button"
                                    tabIndex={0}
                                >
                                    <div className="flex justify-between items-start gap-2">
                                        <p className="font-semibold text-foreground leading-tight truncate pr-2">{rec.area}</p>
                                        <p className="text-lg font-bold text-secondary flex-shrink-0">{rec.progress ?? 0}%</p>
                                    </div>
                                    <div 
                                        className="w-full space-y-2 mt-auto"
                                        onClick={(e) => e.stopPropagation()}
                                        onKeyDown={(e) => e.stopPropagation()}
                                    >
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground truncate">
                                            <RecommendationIcon type={rec.type} />
                                            <span className="truncate">{rec.type}: {rec.resource}</span>
                                        </div>
                                        <div 
                                            className="w-full"
                                        >
                                            <Slider
                                                defaultValue={[rec.progress ?? 0]}
                                                max={100}
                                                step={10}
                                                onValueChange={(value) => debouncedProgressUpdate(historyId, rec.id, value[0])}
                                                className="w-full"
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </>
    );
}
