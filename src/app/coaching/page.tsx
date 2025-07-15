
"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRole, Role } from '@/hooks/use-role';
import DashboardLayout from '@/components/dashboard-layout';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { getOneOnOneHistory, OneOnOneHistoryItem, updateCoachingRecommendationStatus, reviewCoachingRecommendationDecline, acknowledgeDeclinedRecommendation } from '@/services/feedback-service';
import type { CoachingRecommendation } from '@/ai/schemas/one-on-one-schemas';
import { roleUserMapping } from '@/lib/role-mapping';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Zap, BookOpen, Podcast, Newspaper, GraduationCap, Lightbulb, ThumbsUp, ThumbsDown, Loader2, CheckCircle, MessageSquareQuote, BrainCircuit, Users, CheckSquare as CheckSquareIcon } from 'lucide-react';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';

const RecommendationIcon = ({ type }: { type: CoachingRecommendation['type'] }) => {
    switch (type) {
        case 'Book': return <BookOpen className="h-4 w-4" />;
        case 'Podcast': return <Podcast className="h-4 w-4" />;
        case 'Article': return <Newspaper className="h-4 w-4" />;
        case 'Course': return <GraduationCap className="h-4 w-4" />;
        default: return <Lightbulb className="h-4 w-4" />;
    }
};

function MyDevelopmentWidget() {
    const { role } = useRole();
    const [pendingRecommendations, setPendingRecommendations] = useState<{ historyItem: OneOnOneHistoryItem; recommendation: CoachingRecommendation }[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();

    const [decliningRec, setDecliningRec] = useState<{ historyId: string; recommendation: CoachingRecommendation } | null>(null);
    const [rejectionReason, setRejectionReason] = useState('');
    const [isSubmittingDecline, setIsSubmittingDecline] = useState(false);

    const fetchRecommendations = useCallback(async () => {
        if (!role) return;
        setIsLoading(true);
        const history = await getOneOnOneHistory();
        const pending: { historyItem: OneOnOneHistoryItem; recommendation: CoachingRecommendation }[] = [];
        
        const currentUserName = role ? roleUserMapping[role].name : null;

        history.forEach(item => {
            if (item.supervisorName === currentUserName) {
                item.analysis.coachingRecommendations.forEach(rec => {
                    if (rec.status === 'pending') {
                        pending.push({ historyItem: item, recommendation: rec });
                    }
                });
            }
        });

        setPendingRecommendations(pending);
        setIsLoading(false);
    }, [role]);

    useEffect(() => {
        fetchRecommendations();
        const handleDataUpdate = () => fetchRecommendations();
        window.addEventListener('storage', handleDataUpdate);
        window.addEventListener('feedbackUpdated', handleDataUpdate);
        return () => {
            window.removeEventListener('storage', handleDataUpdate);
            window.removeEventListener('feedbackUpdated', handleDataUpdate);
        };
    }, [fetchRecommendations]);

    const handleCoachingRecAction = async (historyId: string, recommendationId: string, status: 'accepted' | 'declined', reason?: string) => {
        try {
            await updateCoachingRecommendationStatus(historyId, recommendationId, status, reason);
            toast({
                title: `Recommendation ${status}`,
                description: `The coaching recommendation has been updated.`,
            });
            fetchRecommendations();
        } catch (error) {
            console.error(`Failed to ${status} recommendation`, error);
            toast({ variant: 'destructive', title: 'Update Failed' });
        }
    };

    const handleDeclineSubmit = () => {
        if (!decliningRec || !rejectionReason) return;
        setIsSubmittingDecline(true);
        handleCoachingRecAction(decliningRec.historyId, decliningRec.recommendation.id, 'declined', rejectionReason).finally(() => {
            setIsSubmittingDecline(false);
            setDecliningRec(null);
            setRejectionReason('');
        });
    };

    if (isLoading) {
        return <Skeleton className="h-48 w-full" />;
    }

    return (
        <>
            <Dialog open={!!decliningRec} onOpenChange={() => setDecliningRec(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Decline Recommendation</DialogTitle>
                        <DialogDescription>
                            Please provide a reason for declining this coaching recommendation. This helps in understanding your needs better.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <Label htmlFor="rejection-reason">Justification</Label>
                        <Textarea
                            id="rejection-reason"
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                            placeholder="e.g., I have already read this book, I prefer a different learning style, etc."
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setDecliningRec(null)}>Cancel</Button>
                        <Button variant="destructive" onClick={handleDeclineSubmit} disabled={!rejectionReason || isSubmittingDecline}>
                            {isSubmittingDecline && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Submit Justification
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <BrainCircuit />
                        My Development Plan
                    </CardTitle>
                    <CardDescription>
                        AI-powered recommendations based on your recent 1-on-1 sessions.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {pendingRecommendations.length === 0 ? (
                         <div className="flex flex-col items-center justify-center text-center p-8 border-2 border-dashed rounded-lg">
                            <CheckCircle className="h-12 w-12 text-green-500 mb-4" />
                            <h3 className="text-lg font-semibold">All Caught Up!</h3>
                            <p className="text-muted-foreground mt-1">There are no new coaching recommendations for you.</p>
                        </div>
                    ) : (
                        <Accordion type="single" collapsible className="w-full">
                            {pendingRecommendations.map(({ historyItem, recommendation: rec }) => (
                                <AccordionItem value={rec.id} key={rec.id}>
                                    <AccordionTrigger>
                                        <div className="flex flex-col items-start text-left">
                                            <p className="font-semibold">{rec.area}</p>
                                            <p className="text-sm font-normal text-muted-foreground">From 1-on-1 with {historyItem.employeeName} on {format(new Date(historyItem.date), 'PPP')}</p>
                                        </div>
                                    </AccordionTrigger>
                                    <AccordionContent className="space-y-4 pt-2">
                                        <div className="p-3 bg-background/60 rounded-lg border space-y-3">
                                             <p className="text-sm text-muted-foreground">{rec.recommendation}</p>

                                             {rec.example && (
                                                <div className="p-3 bg-muted/50 rounded-md border-l-4 border-primary">
                                                    <p className="text-xs font-semibold uppercase text-muted-foreground flex items-center gap-1.5"><MessageSquareQuote className="h-4 w-4" /> Example from Session</p>
                                                    <blockquote className="mt-1 text-sm italic text-primary/90">"{rec.example}"</blockquote>
                                                </div>
                                             )}

                                            <div className="mt-3 pt-3 border-t">
                                                <div className="flex items-center gap-2 text-sm text-foreground mb-2">
                                                    <RecommendationIcon type={rec.type} />
                                                    <strong>{rec.type}:</strong> {rec.resource}
                                                </div>
                                                <p className="text-xs text-muted-foreground italic">AI Justification: "{rec.justification}"</p>
                                            </div>
                                             <div className="flex gap-2 mt-4 pt-4 border-t">
                                                <Button size="sm" variant="success" onClick={() => handleCoachingRecAction(historyItem.id, rec.id, 'accepted')}>
                                                    <ThumbsUp className="mr-2 h-4 w-4" /> Accept
                                                </Button>
                                                <Button size="sm" variant="destructive" onClick={() => setDecliningRec({ historyId: historyItem.id, recommendation: rec })}>
                                                    <ThumbsDown className="mr-2 h-4 w-4" /> Decline
                                                </Button>
                                            </div>
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>
                            ))}
                        </Accordion>
                    )}
                </CardContent>
            </Card>
        </>
    );
}

function AmReviewWidget({ item, rec, onUpdate }: { item: OneOnOneHistoryItem, rec: CoachingRecommendation, onUpdate: () => void }) {
    const { toast } = useToast();
    const { role } = useRole();
    const [amNotes, setAmNotes] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleAmDecision = async (approved: boolean) => {
        if (!amNotes || !role) {
            toast({ variant: 'destructive', title: "Notes Required", description: "Please provide notes for your decision."});
            return;
        };
        setIsSubmitting(true);
        try {
            await reviewCoachingRecommendationDecline(item.id, rec.id, role, approved, amNotes);
            toast({ title: "Decision Submitted", description: `The coaching recommendation has been updated.`});
            onUpdate(); // This will trigger a re-fetch in the parent
        } catch (error) {
            console.error("Failed to submit review", error);
            toast({ variant: 'destructive', title: "Submission Failed" });
        } finally {
            setIsSubmitting(false);
            setAmNotes('');
        }
    };

    return (
        <Card className="border-orange-500/50">
            <CardHeader className="bg-orange-500/10">
                 <CardTitle className="flex items-center gap-2 text-orange-700 dark:text-orange-400">
                    <Users />
                    Review Declined Recommendation
                </CardTitle>
                <CardDescription>
                    From {item.supervisorName} (1-on-1 with {item.employeeName})
                </CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
                <div className="p-3 bg-muted/80 rounded-lg border space-y-2">
                    <p className="font-semibold text-foreground">Original AI Recommendation ({rec.area})</p>
                    <p className="text-sm text-muted-foreground">{rec.recommendation}</p>
                    {rec.example && (
                        <div className="mt-2 p-3 bg-background/80 rounded-md border-l-4 border-primary">
                            <p className="text-xs font-semibold uppercase text-muted-foreground flex items-center gap-1.5"><MessageSquareQuote className="h-4 w-4" /> Example from Session</p>
                            <blockquote className="mt-1 text-sm italic text-primary/90">"{rec.example}"</blockquote>
                        </div>
                    )}
                </div>
                <div className="p-3 bg-blue-500/10 rounded-lg border border-blue-500/20 space-y-2">
                    <p className="font-semibold text-blue-700 dark:text-blue-500">Supervisor's Reason for Declining</p>
                    <p className="text-sm text-blue-600 dark:text-blue-400 whitespace-pre-wrap">{rec.rejectionReason}</p>
                </div>
                <div className="space-y-2 pt-4 border-t">
                    <Label htmlFor={`am-notes-${rec.id}`}>Your Decision & Notes</Label>
                    <Textarea 
                        id={`am-notes-${rec.id}`}
                        placeholder="e.g., I agree this isn't a priority now, let's focus on X instead. OR I believe this is a critical skill, let's discuss how to approach it."
                        value={amNotes}
                        onChange={(e) => setAmNotes(e.target.value)}
                        rows={3}
                    />
                </div>
                <div className="flex gap-2">
                    <Button onClick={() => handleAmDecision(false)} disabled={isSubmitting || !amNotes} variant="destructive">
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Uphold AI
                    </Button>
                    <Button onClick={() => handleAmDecision(true)} disabled={isSubmitting || !amNotes} variant="secondary">
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Approve Decline
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}

function ManagerAcknowledgementWidget({ item, rec, onUpdate }: { item: OneOnOneHistoryItem, rec: CoachingRecommendation, onUpdate: () => void }) {
    const { toast } = useToast();
    const { role } = useRole();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleAcknowledge = async () => {
        if (!role) return;
        setIsSubmitting(true);
        try {
            await acknowledgeDeclinedRecommendation(item.id, rec.id, role);
            toast({ title: "Acknowledgement Logged", description: "The workflow for this recommendation is now complete." });
            onUpdate();
        } catch (error) {
            console.error("Failed to submit acknowledgement", error);
            toast({ variant: 'destructive', title: "Submission Failed" });
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const amApprovalNotes = rec.auditTrail?.find(e => e.event === "Decline Approved by AM")?.details;
    const isActionable = rec.status === 'pending_manager_acknowledgement';

    return (
        <Card className="border-gray-500/50">
            <CardHeader className="bg-gray-500/10 flex flex-row justify-between items-start">
                <div>
                    <CardTitle className="flex items-center gap-2 text-gray-700 dark:text-gray-400">
                        <CheckSquareIcon className="h-6 w-6" />
                        {isActionable ? "FYI: Action Required" : "FYI: Acknowledged & Closed"}
                    </CardTitle>
                    <CardDescription>
                       For 1-on-1 between {item.supervisorName} and {item.employeeName} on {format(new Date(item.date), 'PPP')}.
                    </CardDescription>
                </div>
                 {!isActionable && <Badge variant="success">Acknowledged & Closed</Badge>}
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
                <div className="space-y-2 p-3 rounded-lg border bg-muted/50">
                    <Label className="font-semibold text-foreground">Original AI Recommendation: {rec.area}</Label>
                    <p className="text-sm text-muted-foreground">{rec.recommendation}</p>
                    {rec.example && (
                        <div className="p-2 bg-background/80 rounded-md border-l-2 border-primary mt-2">
                             <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5"><MessageSquareQuote className="h-4 w-4" /> Example from Session</p>
                             <blockquote className="mt-1 text-sm italic text-primary/90">"{rec.example}"</blockquote>
                        </div>
                    )}
                </div>

                <div className="space-y-2 p-3 rounded-lg border bg-blue-500/10 border-blue-500/20">
                    <Label className="font-semibold text-blue-700 dark:text-blue-500">{item.supervisorName}'s (TL) Decline Reason</Label>
                    <p className="text-sm text-blue-600 dark:text-blue-400 whitespace-pre-wrap">{rec.rejectionReason}</p>
                </div>
                
                {amApprovalNotes && (
                    <div className="space-y-2 p-3 rounded-lg border bg-orange-500/10 border-orange-500/20">
                        <Label className="font-semibold text-orange-700 dark:text-orange-500">AM's Approval Notes</Label>
                        <p className="text-sm text-orange-600 dark:text-orange-400 whitespace-pre-wrap">{amApprovalNotes}</p>
                    </div>
                )}
                
                {isActionable && (
                    <div className="space-y-3 pt-4 border-t">
                         <Label className="font-semibold text-base">Your Action</Label>
                        <p className="text-sm text-muted-foreground">
                            No action is required other than acknowledging that you have seen this decision. This is for your awareness of your team's coaching and development activities.
                        </p>
                        <div className="flex gap-2 pt-2">
                             <Button onClick={handleAcknowledge} disabled={isSubmitting} variant="secondary">
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Acknowledge & Close
                            </Button>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

function TeamDevelopmentWidget({ role }: { role: Role }) {
    const [teamActions, setTeamActions] = useState<{ historyItem: OneOnOneHistoryItem; recommendation: CoachingRecommendation }[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchTeamActions = useCallback(async () => {
        setIsLoading(true);
        const history = await getOneOnOneHistory();
        const pendingActions: { historyItem: OneOnOneHistoryItem; recommendation: CoachingRecommendation }[] = [];
        
        const amStatuses: CoachingRecommendation['status'][] = ['pending_am_review'];
        const managerStatuses: CoachingRecommendation['status'][] = ['pending_manager_acknowledgement', 'declined'];

        history.forEach(item => {
            item.analysis.coachingRecommendations.forEach(rec => {
                if (role === 'AM' && amStatuses.includes(rec.status)) {
                    pendingActions.push({ historyItem: item, recommendation: rec });
                } else if (role === 'Manager' && managerStatuses.includes(rec.status)) {
                    // Only include 'declined' if the manager was the one who acknowledged it.
                    const wasManagerInvolved = rec.auditTrail?.some(e => e.event === "Manager Acknowledged Declined Recommendation");
                    if (rec.status === 'declined' && !wasManagerInvolved) {
                        return; // Skip if manager wasn't involved in this declined item.
                    }
                    pendingActions.push({ historyItem: item, recommendation: rec });
                }
            });
        });
        
        setTeamActions(pendingActions);
        setIsLoading(false);
    }, [role]);

    useEffect(() => {
        fetchTeamActions();
        const handleDataUpdate = () => fetchTeamActions();
        window.addEventListener('storage', handleDataUpdate);
        window.addEventListener('feedbackUpdated', handleDataUpdate);
        return () => {
            window.removeEventListener('storage', handleDataUpdate);
            window.removeEventListener('feedbackUpdated', handleDataUpdate);
        };
    }, [fetchTeamActions]);

    if (isLoading) {
        return <Skeleton className="h-48 w-full" />;
    }

    if (!['AM', 'Manager', 'HR Head'].includes(role)) {
        return null;
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Users />
                    Team Development
                </CardTitle>
                <CardDescription>
                    Review coaching and development items from your direct reports.
                </CardDescription>
            </CardHeader>
            <CardContent>
                {teamActions.length === 0 ? (
                    <div className="flex flex-col items-center justify-center text-center p-8 border-2 border-dashed rounded-lg">
                        <CheckCircle className="h-12 w-12 text-green-500 mb-4" />
                        <h3 className="text-lg font-semibold">No Pending Team Actions</h3>
                        <p className="text-muted-foreground mt-1">Actions requiring your review will appear here.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {teamActions.map(({ historyItem, recommendation: rec }) => {
                            if (rec.status === 'pending_am_review' && role === 'AM') {
                                return <AmReviewWidget key={rec.id} item={historyItem} rec={rec} onUpdate={fetchTeamActions} />;
                            }
                            if ((rec.status === 'pending_manager_acknowledgement' || rec.status === 'declined') && role === 'Manager') {
                                return <ManagerAcknowledgementWidget key={rec.id} item={historyItem} rec={rec} onUpdate={fetchTeamActions} />;
                            }
                            return null;
                        })}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

function CoachingPageContent() {
    const { role } = useRole();
    const isSupervisor = role === 'Team Lead' || role === 'AM' || role === 'Manager';
    const isManager = role === 'AM' || role === 'Manager' || role === 'HR Head';
    
    return (
         <div className="p-4 md:p-8 space-y-8">
            {isSupervisor && <MyDevelopmentWidget />}
            {isManager && <TeamDevelopmentWidget role={role!} />}
         </div>
    )
}

export default function CoachingPage() {
  const { role, setRole, isLoading } = useRole();

  if (isLoading || !role) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <Skeleton className="h-screen w-full" />
      </div>
    );
  }
  
  return (
    <DashboardLayout role={role} onSwitchRole={setRole}>
        <CoachingPageContent />
    </DashboardLayout>
  );
}
