
"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRole, Role } from '@/hooks/use-role';
import DashboardLayout from '@/components/dashboard-layout';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { MessageSquare, MessageCircleQuestion, AlertTriangle, CheckCircle, Loader2, ChevronsRight, User, Users, Briefcase, ShieldCheck, UserX, UserPlus, FileText, Zap, BookOpen, Podcast, Newspaper, GraduationCap, Lightbulb, MessageSquareQuote, CheckSquare as CheckSquareIcon } from 'lucide-react';
import { getOneOnOneHistory, OneOnOneHistoryItem, submitEmployeeAcknowledgement, submitAmCoachingNotes, submitManagerResolution, submitHrResolution, submitFinalHrDecision, escalateToManager, submitAmDirectResponse, reviewCoachingRecommendationDecline, acknowledgeDeclinedRecommendation } from '@/services/feedback-service';
import { roleUserMapping } from '@/lib/role-mapping';
import { format } from 'date-fns';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import { CriticalCoachingInsight, CoachingRecommendation } from '@/ai/schemas/one-on-one-schemas';
import { Textarea } from '@/components/ui/textarea';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

function AcknowledgementWidget({ item, onUpdate }: { item: OneOnOneHistoryItem, onUpdate: () => void }) {
    const { toast } = useToast();
    const [employeeAcknowledgement, setEmployeeAcknowledgement] = useState('');
    const [acknowledgementComments, setAcknowledgementComments] = useState('');
    const [isSubmittingAck, setIsSubmittingAck] = useState(false);

    const handleEmployeeAckSubmit = async () => {
        if (!employeeAcknowledgement) return;
        setIsSubmittingAck(true);
        
        const previousStatus = item.analysis.criticalCoachingInsight?.status;

        try {
            await submitEmployeeAcknowledgement(item.id, employeeAcknowledgement, acknowledgementComments, previousStatus);
            setEmployeeAcknowledgement("");
            setAcknowledgementComments("");
            
            if (employeeAcknowledgement === "The concern was fully addressed to my satisfaction.") {
                 toast({ title: "Acknowledgement Submitted", description: "Thank you for your feedback. This insight is now resolved." });
            } else {
                 toast({ title: "Feedback Escalated", description: "Your feedback has been sent to the next level for review." });
            }

            onUpdate(); // Re-fetch data in parent component
        } catch (error) {
            console.error("Failed to submit acknowledgement", error);
            toast({ variant: 'destructive', title: "Submission Failed", description: "Could not submit your acknowledgement." });
        } finally {
            setIsSubmittingAck(false);
        }
    };
    
    const wasHrAction = item.analysis.criticalCoachingInsight?.auditTrail?.some(e => e.event === 'HR Responded to Retaliation Claim');
    const amResponse = item.analysis.criticalCoachingInsight?.auditTrail?.find(e => e.event === 'AM Responded to Employee');
    const managerResponse = item.analysis.criticalCoachingInsight?.auditTrail?.find(e => e.event === 'Manager Resolution');


    return (
        <Card className="border-blue-500/50">
            <CardHeader className="bg-blue-500/10">
                <CardTitle className="flex items-center gap-2 text-blue-700 dark:text-blue-400">
                    <MessageCircleQuestion className="h-6 w-6" />
                    1-on-1 Follow-Up Required
                </CardTitle>
                <CardDescription>
                    From your meeting with {item.supervisorName} on {format(new Date(item.date), 'PPP')}.
                </CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
                <div className="p-3 bg-muted/80 rounded-md border">
                    <p className="font-semibold text-foreground">Supervisor's Response</p>
                    <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">
                        {item.analysis.criticalCoachingInsight?.supervisorResponse}
                    </p>
                </div>
                 {amResponse && (
                     <div className="p-3 bg-orange-500/10 rounded-md border border-orange-500/20">
                        <p className="font-semibold text-orange-700 dark:text-orange-500">{amResponse.actor}'s Response</p>
                        <p className="text-sm text-orange-600 dark:text-orange-400 mt-1 whitespace-pre-wrap">{amResponse.details}</p>
                    </div>
                 )}
                 {managerResponse && (
                     <div className="p-3 bg-destructive/10 rounded-md border border-destructive/20">
                        <p className="font-semibold text-destructive">{managerResponse.actor}'s Response</p>
                        <p className="text-sm text-destructive/90 mt-1 whitespace-pre-wrap">{managerResponse.details}</p>
                    </div>
                 )}
                 {item.analysis.criticalCoachingInsight?.auditTrail?.some(e => e.event === 'Supervisor Retry Action') && (
                     <div className="p-3 bg-muted/80 rounded-md border">
                        <p className="font-semibold text-foreground">Supervisor's Follow-up Notes</p>
                        <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">
                            {item.analysis.criticalCoachingInsight?.auditTrail.find(e => e.event === 'Supervisor Retry Action')?.details}
                        </p>
                    </div>
                )}
                 {item.analysis.criticalCoachingInsight?.auditTrail?.some(e => e.event === 'Manager Resolution') && (
                     <div className="p-3 bg-muted/80 rounded-md border">
                        <p className="font-semibold text-foreground">Manager's Final Resolution</p>
                        <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">
                            {item.analysis.criticalCoachingInsight?.auditTrail.find(e => e.event === 'Manager Resolution')?.details}
                        </p>
                    </div>
                )}
                {wasHrAction && (
                     <div className="p-3 bg-muted/80 rounded-md border">
                        <p className="font-semibold text-foreground">HR Head's Final Resolution</p>
                        <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">
                            {item.analysis.criticalCoachingInsight?.auditTrail.find(e => e.event === 'HR Responded to Retaliation Claim')?.details}
                        </p>
                    </div>
                )}
                <div className="space-y-3">
                    <Label className="font-semibold">Your Acknowledgement</Label>
                    <p className="text-sm text-muted-foreground">
                        Please review the latest response and provide feedback on the resolution.
                    </p>
                    <RadioGroup onValueChange={setEmployeeAcknowledgement} value={employeeAcknowledgement}>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="The concern was fully addressed to my satisfaction." id={`ack-yes-${item.id}`} />
                            <Label htmlFor={`ack-yes-${item.id}`}>The concern was fully addressed to my satisfaction.</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="The concern was partially addressed, but I still have reservations." id={`ack-partial-${item.id}`} />
                            <Label htmlFor={`ack-partial-${item.id}`}>The concern was partially addressed, but I still have reservations.</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="I do not feel the concern was adequately addressed." id={`ack-no-${item.id}`} />
                            <Label htmlFor={`ack-no-${item.id}`}>I do not feel the concern was adequately addressed.</Label>
                        </div>
                    </RadioGroup>
                    <div className="space-y-2 pt-2">
                        <Label htmlFor={`ack-comments-${item.id}`}>Additional Comments (Optional)</Label>
                        <Textarea
                            id={`ack-comments-${item.id}`}
                            value={acknowledgementComments}
                            onChange={(e) => setAcknowledgementComments(e.target.value)}
                            placeholder="Provide more detail about your selection..."
                            rows={3}
                            className="bg-background"
                        />
                    </div>
                    <div className="flex gap-2 pt-2">
                        <Button
                            onClick={handleEmployeeAckSubmit}
                            disabled={isSubmittingAck || !employeeAcknowledgement}
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                            {isSubmittingAck && <Loader2 className="mr-2 animate-spin" />}
                            Submit Acknowledgement
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

function RecommendationIcon({ type }: { type: CoachingRecommendation['type'] }) {
    switch (type) {
        case 'Book': return <BookOpen className="h-4 w-4" />;
        case 'Podcast': return <Podcast className="h-4 w-4" />;
        case 'Article': return <Newspaper className="h-4 w-4" />;
        case 'Course': return <GraduationCap className="h-4 w-4" />;
        default: return <Lightbulb className="h-4 w-4" />;
    }
};

function DeclinedCoachingReviewWidget({ item, rec, onUpdate }: { item: OneOnOneHistoryItem, rec: CoachingRecommendation, onUpdate: () => void }) {
    const { toast } = useToast();
    const { role } = useRole();
    const [amNotes, setAmNotes] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleDecision = async (approved: boolean) => {
        if (!amNotes || !role) {
            toast({ variant: 'destructive', title: "Notes Required", description: "Please provide notes for your decision."});
            return;
        };
        setIsSubmitting(true);
        try {
            await reviewCoachingRecommendationDecline(item.id, rec.id, role, approved, amNotes);
            toast({ title: "Decision Submitted", description: `The coaching recommendation has been updated.`});
            onUpdate();
        } catch (error) {
            console.error("Failed to submit review", error);
            toast({ variant: 'destructive', title: "Submission Failed" });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Card className="border-orange-500/50">
            <CardHeader className="bg-orange-500/10">
                <CardTitle className="flex items-center gap-2 text-orange-700 dark:text-orange-400">
                    <Zap className="h-6 w-6" />
                    Review Declined Coaching Recommendation
                </CardTitle>
                <CardDescription>
                   {item.supervisorName} (Team Lead) declined an AI recommendation from their 1-on-1 with {item.employeeName}.
                </CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
                <div className="p-3 bg-muted/80 rounded-lg border space-y-3">
                    <p className="font-semibold text-foreground">Original AI Recommendation</p>
                    <p className="text-sm text-muted-foreground">{rec.recommendation}</p>
                    
                    {rec.example && (
                        <div className="p-3 bg-background/80 rounded-md border-l-4 border-primary">
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
                </div>
                 <div className="p-3 bg-blue-500/10 rounded-lg border border-blue-500/20 space-y-2">
                    <p className="font-semibold text-blue-700 dark:text-blue-500">Supervisor's Reason for Declining</p>
                    <p className="text-sm text-blue-600 dark:text-blue-400 whitespace-pre-wrap">{rec.rejectionReason}</p>
                </div>
                <div className="space-y-3 pt-4">
                     <Label htmlFor={`am-notes-${rec.id}`} className="font-semibold text-base">Your Decision & Notes</Label>
                    <p className="text-sm text-muted-foreground">
                        Uphold the AI's recommendation (deny the decline) or agree with the supervisor (approve the decline). Your notes will be visible to the supervisor.
                    </p>
                    <Textarea 
                        id={`am-notes-${rec.id}`}
                        placeholder="e.g., I agree this isn't a priority now, let's focus on X instead. OR I believe this is a critical skill, let's discuss how to approach it."
                        value={amNotes}
                        onChange={(e) => setAmNotes(e.target.value)}
                        rows={3}
                        className="bg-background"
                    />
                    <div className="flex gap-2 pt-2">
                        <Button onClick={() => handleDecision(false)} disabled={isSubmitting || !amNotes} variant="destructive">
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Uphold AI Recommendation
                        </Button>
                         <Button onClick={() => handleDecision(true)} disabled={isSubmitting || !amNotes} variant="secondary">
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Approve Decline
                        </Button>
                    </div>
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
        setIsSubmitting(true);
        try {
            await acknowledgeDeclinedRecommendation(item.id, rec.id, role!);
            toast({ title: "Acknowledgement Logged", description: "The workflow for this recommendation is now complete." });
            onUpdate();
        } catch (error) {
            console.error("Failed to submit acknowledgement", error);
            toast({ variant: 'destructive', title: "Submission Failed" });
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const renderAuditEntry = (event: string, label: string, details?: string, className?: string, textColor?: string) => {
        const entry = rec.auditTrail?.find(e => e.event === event);
        if (!details && !entry?.details) return null;
        return (
            <div className={`space-y-2 p-3 rounded-md border ${className}`}>
                <p className={`font-bold text-sm ${textColor}`}>{label}</p>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{details || entry?.details}</p>
            </div>
        );
    };

    return (
        <Card className="border-gray-500/50">
            <CardHeader className="bg-gray-500/10">
                <CardTitle className="flex items-center gap-2 text-gray-700 dark:text-gray-400">
                    <CheckSquareIcon className="h-6 w-6" />
                    FYI: Declined Recommendation Approved
                </CardTitle>
                <CardDescription>
                   For 1-on-1 between {item.supervisorName} and {item.employeeName} on {format(new Date(item.date), 'PPP')}.
                </CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
                 {renderAuditEntry("Recommendation Declined by Supervisor", `${item.supervisorName}'s (TL) Decline Reason`, rec.rejectionReason, "bg-blue-500/10 border-blue-500/20", "text-blue-700 dark:text-blue-500")}
                 {renderAuditEntry("Decline Approved by AM", "AM's Approval Notes", undefined, "bg-orange-500/10 border-orange-500/20", "text-orange-700 dark:text-orange-500")}
                <div className="space-y-3 pt-4">
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
            </CardContent>
        </Card>
    );
}

function EscalationWidget({ item, onUpdate, title, titleIcon: TitleIcon, titleColor, bgColor, borderColor }: { item: OneOnOneHistoryItem, onUpdate: () => void, title: string, titleIcon: React.ElementType, titleColor: string, bgColor: string, borderColor: string }) {
    const insight = item.analysis.criticalCoachingInsight as CriticalCoachingInsight;
    const { toast } = useToast();
    const { role } = useRole();
    const [action, setAction] = useState<'coach' | 'address' | null>(null);
    const [actionNotes, setActionNotes] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // Specific logic for Manager widget
    const isManagerWidget = role === 'Manager';
    const [resolutionNotes, setResolutionNotes] = useState('');
    const [isSubmittingManager, setIsSubmittingManager] = useState(false);

    const handleAmActionSubmit = async () => {
        if (!actionNotes) return;

        setIsSubmitting(true);
        try {
            if (action === 'coach') {
                await submitAmCoachingNotes(item.id, role!, actionNotes);
                toast({ title: "Coaching Notes Submitted", description: "The supervisor has been notified to retry the 1-on-1." });
            } else if (action === 'address') {
                await submitAmDirectResponse(item.id, role!, actionNotes);
                toast({ title: "Response Submitted", description: "Your response has been sent to the employee for acknowledgement." });
            }
            onUpdate();
        } catch (error) {
            console.error("Failed to submit AM action", error);
            toast({ variant: 'destructive', title: "Submission Failed" });
        } finally {
            setIsSubmitting(false);
            setAction(null);
            setActionNotes('');
        }
    };
    
    const handleActionClick = (selectedAction: 'coach' | 'address') => {
        setAction(selectedAction);
    };

    const handleManagerSubmit = async () => {
        if (!resolutionNotes) return;
        setIsSubmittingManager(true);
        try {
            await submitManagerResolution(item.id, role!, resolutionNotes);
            toast({ title: "Resolution Submitted", description: "The case has been sent to the employee for final acknowledgement." });
            onUpdate();
        } catch (error) {
            console.error("Failed to submit manager resolution", error);
            toast({ variant: 'destructive', title: "Submission Failed" });
        } finally {
            setIsSubmittingManager(false);
        }
    };
    
    const renderAuditEntry = (event: string, label: string, details?: string, className?: string, textColor?: string) => {
        const entry = insight.auditTrail?.find(e => e.event === event);
        if (!details && !entry?.details) return null;
        return (
            <div className={`space-y-2 p-3 rounded-md border ${className}`}>
                <p className={`font-bold text-sm ${textColor}`}>{label}</p>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{details || entry?.details}</p>
            </div>
        );
    };

    return (
        <Accordion type="single" collapsible className="w-full">
            <AccordionItem value={item.id}>
                <AccordionTrigger>
                    <div className="flex justify-between items-center w-full pr-4">
                        <div className="flex items-center gap-2">
                             <TitleIcon className={`h-5 w-5 ${titleColor}`} />
                             <span className={`font-semibold ${titleColor}`}>
                                {title}: {isManagerWidget ? "Manager Review" : "AM Review"}
                            </span>
                        </div>
                        <span className="text-sm text-muted-foreground">
                            {item.employeeName} & {item.supervisorName}
                        </span>
                    </div>
                </AccordionTrigger>
                <AccordionContent className="space-y-6 pt-4">
                     <div className="space-y-4">
                        {renderAuditEntry("Critical Insight Identified", "Initial AI Insight", insight.summary, "bg-red-500/10 border-red-500/20", "text-red-700 dark:text-red-500")}
                        {renderAuditEntry("Supervisor Responded", `${item.supervisorName}'s (TL) Response`, insight.supervisorResponse, "bg-muted/80", "text-foreground")}
                        {renderAuditEntry("Employee Acknowledged", `${item.employeeName}'s (Employee) Acknowledgement`, insight.auditTrail?.find(e => e.event === 'Employee Acknowledged' && e.actor === item.employeeName)?.details, "bg-blue-500/10 border-blue-500/20", "text-blue-700 dark:text-blue-500")}
                        
                        {isManagerWidget && renderAuditEntry("AM Coaching Notes", "AM Coaching Notes", undefined, "bg-orange-500/10 border-orange-500/20", "text-orange-700 dark:text-orange-500")}
                        {isManagerWidget && renderAuditEntry("AM Responded to Employee", "AM Response to Employee", insight.auditTrail?.find(e => e.event === 'AM Responded to Employee')?.details, "bg-orange-500/10 border-orange-500/20", "text-orange-700 dark:text-orange-500")}

                        {isManagerWidget && renderAuditEntry("Supervisor Retry Action", `${item.supervisorName}'s (TL) Retry Notes`, undefined, "bg-muted/80", "text-foreground")}
                        {isManagerWidget && renderAuditEntry("Employee Acknowledged", `Final Employee Acknowledgement`, insight.employeeAcknowledgement, "bg-blue-500/10 border-blue-500/20", "text-blue-700 dark:text-blue-500")}
                    </div>
                
                    <CardFooter className={`${bgColor} pt-4 flex-col items-start gap-4`}>
                        <Label className={`font-semibold ${titleColor}`}>Your Action</Label>
                        
                        {isManagerWidget ? (
                             <div className="w-full space-y-3">
                                 <p className="text-sm text-muted-foreground">
                                    This case requires your direct intervention. Document the actions you will take to resolve this situation. This resolution will be sent to the employee for final acknowledgement.
                                </p>
                                 <Textarea 
                                    placeholder="e.g., I have scheduled a mediated session between the TL and employee, and will be implementing a new communication protocol for the team..."
                                    value={resolutionNotes}
                                    onChange={(e) => setResolutionNotes(e.target.value)}
                                    rows={4}
                                    className="bg-background"
                                 />
                                 <div className="flex gap-2">
                                     <Button variant="destructive" onClick={handleManagerSubmit} disabled={isSubmittingManager || !resolutionNotes}>
                                        {isSubmittingManager && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                                        Submit to Employee
                                     </Button>
                                 </div>
                             </div>
                        ) : action ? (
                            <div className="w-full space-y-3">
                                <Label htmlFor={`action-notes-${item.id}`}>
                                    {action === 'coach' ? 'Coaching Notes for Supervisor' : 'Notes for Employee'}
                                </Label>
                                <p className="text-sm text-muted-foreground">
                                    {action === 'coach' 
                                        ? 'Log your coaching notes for the supervisor. This will be visible to them.'
                                        : "Describe the conversation you had with the employee. This will be sent to them for acknowledgement."
                                    }
                                </p>
                                <Textarea 
                                    id={`action-notes-${item.id}`}
                                    placeholder={action === 'coach' 
                                        ? "e.g., Coached Ben on active listening and validating concerns before offering solutions..."
                                        : "e.g., I spoke with Casey to understand their perspective and we've agreed on a path forward..."
                                    }
                                    value={actionNotes}
                                    onChange={(e) => setActionNotes(e.target.value)}
                                    rows={4}
                                    className="bg-background"
                                />
                                <div className="flex gap-2">
                                    <Button onClick={handleAmActionSubmit} disabled={isSubmitting || !actionNotes}>
                                        {isSubmitting && <Loader2 className="mr-2 animate-spin"/>}
                                        Submit
                                    </Button>
                                    <Button variant="ghost" onClick={() => setAction(null)}>Cancel</Button>
                                </div>
                            </div>
                        ) : (
                            <>
                                <p className="text-sm text-muted-foreground">This case now requires your review and action. Please select a path to resolution.</p>
                                <div className="flex gap-4">
                                    <Button variant="secondary" onClick={() => handleActionClick('coach')}>
                                        <Users className="mr-2 h-4 w-4" />
                                        Coach Supervisor
                                    </Button>
                                    <Button onClick={() => handleActionClick('address')}>
                                        <ChevronsRight className="mr-2 h-4 w-4" />
                                        Address Employee
                                    </Button>
                                </div>
                            </>
                        )}
                    </CardFooter>
                </AccordionContent>
            </AccordionItem>
        </Accordion>
    );
}


function HrReviewWidget({ item, onUpdate }: { item: OneOnOneHistoryItem, onUpdate: () => void }) {
    const insight = item.analysis.criticalCoachingInsight as CriticalCoachingInsight;
    const { toast } = useToast();
    const { role } = useRole();
    const [resolutionNotes, setResolutionNotes] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // State for the final action step
    const [finalAction, setFinalAction] = useState<string | null>(null);
    const [finalActionNotes, setFinalActionNotes] = useState('');
    const [isSubmittingFinal, setIsSubmittingFinal] = useState(false);

    const handleHrSubmit = async () => {
        if (!resolutionNotes) return;
        setIsSubmitting(true);
        try {
            await submitHrResolution(item.id, role!, resolutionNotes);
            toast({ title: "Resolution Submitted", description: "The employee has been notified for a final acknowledgement." });
            onUpdate();
        } catch (error) {
            console.error("Failed to submit HR resolution", error);
            toast({ variant: 'destructive', title: "Submission Failed" });
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const handleFinalHrDecision = async () => {
        if (!finalAction || !finalActionNotes) return;
        setIsSubmittingFinal(true);
        try {
            await submitFinalHrDecision(item.id, role!, finalAction, finalActionNotes);
            toast({ title: "Final Action Logged", description: "The case has been closed." });
            onUpdate();
        } catch (error) {
             console.error("Failed to submit final HR decision", error);
            toast({ variant: 'destructive', title: "Submission Failed" });
        } finally {
            setIsSubmittingFinal(false);
        }
    }

    const renderAuditEntry = (event: string, label: string, details?: string, className?: string, textColor?: string) => {
        const entry = insight.auditTrail?.find(e => e.event === event);
        if (!details && !entry?.details) return null;
        return (
            <div className={`space-y-2 p-3 rounded-md border ${className}`}>
                <p className={`font-bold text-sm ${textColor}`}>{label}</p>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{details || entry?.details}</p>
            </div>
        );
    };

    return (
        <Card className="border-black dark:border-gray-600">
            <CardHeader className="bg-black/10 dark:bg-gray-800/50">
                <CardTitle className="flex items-center gap-2 text-black dark:text-white">
                    <ShieldCheck className="h-6 w-6" />
                    Final Escalation for HR Review
                </CardTitle>
                <CardDescription>
                    Case between {item.supervisorName} and {item.employeeName}.
                </CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
                {renderAuditEntry("Critical Insight Identified", "Initial AI Insight", insight.summary, "bg-red-500/10 border-red-500/20", "text-red-700 dark:text-red-500")}
                {renderAuditEntry("Supervisor Responded", `${item.supervisorName}'s (TL) Response`, insight.supervisorResponse, "bg-muted/80", "text-foreground")}
                {renderAuditEntry("Employee Acknowledged", `First Employee Acknowledgement`, insight.auditTrail?.find(e => e.event === 'Employee Acknowledged' && e.actor !== 'HR Head')?.details, "bg-blue-500/10 border-blue-500/20", "text-blue-700 dark:text-blue-500")}
                {renderAuditEntry("AM Coaching Notes", "AM Coaching Notes", undefined, "bg-orange-500/10 border-orange-500/20", "text-orange-700 dark:text-orange-500")}
                {renderAuditEntry("Supervisor Retry Action", `${item.supervisorName}'s (TL) Retry Notes`, undefined, "bg-muted/80", "text-foreground")}
                {renderAuditEntry("Manager Resolution", "Manager's Final Resolution", insight.auditTrail?.find(e => e.event === 'Manager Resolution')?.details, "bg-muted/80", "text-foreground")}
                 {renderAuditEntry("Employee Acknowledged", `Final Employee Acknowledgement`, insight.employeeAcknowledgement, "bg-blue-500/10 border-blue-500/20", "text-blue-700 dark:text-blue-500")}
            </CardContent>
            <CardFooter className="bg-black/10 dark:bg-gray-800/50 pt-4 flex-col items-start gap-4">
                 {insight.status === 'pending_hr_review' && (
                    <>
                        <Label className="font-semibold text-black dark:text-white">Your Action</Label>
                         <p className="text-sm text-muted-foreground">
                            The automated workflow for this case has concluded. Document your final actions to resolve this situation. The employee will be asked for a final acknowledgement.
                        </p>
                        <div className="w-full space-y-3">
                             <Textarea 
                                placeholder="e.g., I have met with all parties involved and have put a formal performance improvement plan in place for the supervisor..."
                                value={resolutionNotes}
                                onChange={(e) => setResolutionNotes(e.target.value)}
                                rows={4}
                                className="bg-background"
                             />
                             <div className="flex gap-2">
                                 <Button className="bg-black hover:bg-black/80 text-white" onClick={handleHrSubmit} disabled={isSubmitting || !resolutionNotes}>
                                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                                    Submit Final HR Resolution
                                 </Button>
                             </div>
                         </div>
                    </>
                )}
                 {insight.status === 'pending_final_hr_action' && (
                    <>
                         <Label className="font-semibold text-black dark:text-white">Final Action Required</Label>
                         <p className="text-sm text-muted-foreground">
                            The employee remains dissatisfied. Please select a final action to formally close this case. This is the last step in the automated workflow.
                         </p>

                         {!finalAction ? (
                             <div className="flex flex-wrap gap-2">
                                 <Button variant="secondary" onClick={() => setFinalAction('Assigned to Ombudsman')}><UserX className="mr-2" /> Assign to Ombudsman</Button>
                                 <Button variant="secondary" onClick={() => setFinalAction('Assigned to Grievance Office')}><UserPlus className="mr-2" /> Assign to Grievance Office</Button>
                                 <Button variant="destructive" onClick={() => setFinalAction('Logged Dissatisfaction & Closed')}><FileText className="mr-2" /> Log & Close</Button>
                             </div>
                         ) : (
                             <div className="w-full space-y-3">
                                <p className="font-medium">Action: <span className="text-primary">{finalAction}</span></p>
                                 <Label htmlFor="final-notes">Reasoning / Notes</Label>
                                 <Textarea
                                     id="final-notes"
                                     placeholder={`Provide reasoning for selecting: ${finalAction}`}
                                     value={finalActionNotes}
                                     onChange={(e) => setFinalActionNotes(e.target.value)}
                                     rows={4}
                                     className="bg-background"
                                 />
                                 <div className="flex gap-2">
                                     <Button className="bg-black hover:bg-black/80 text-white" onClick={handleFinalHrDecision} disabled={isSubmittingFinal || !finalActionNotes}>
                                        {isSubmittingFinal && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                                        Submit Final Action
                                     </Button>
                                     <Button variant="ghost" onClick={() => setFinalAction(null)}>Cancel</Button>
                                 </div>
                             </div>
                         )}
                    </>
                 )}
            </CardFooter>
        </Card>
    );
}

function MessagesContent({ role }: { role: Role }) {
  const [messages, setMessages] = useState<OneOnOneHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchMessages = useCallback(async () => {
    setIsLoading(true);
    const history = await getOneOnOneHistory();
    const currentUser = roleUserMapping[role];

    const userMessages = history.filter(item => {
        // Critical Insight Escalations
        const insight = item.analysis.criticalCoachingInsight;
        if (insight && insight.status !== 'resolved') {
            switch (role) {
                case 'Employee':
                    return item.employeeName === currentUser.name && insight.status === 'pending_employee_acknowledgement';
                case 'AM':
                    if (insight.status === 'pending_am_review') return true;
                    break;
                case 'Manager':
                    if (insight.status === 'pending_manager_review') return true;
                    break;
                case 'HR Head':
                    if (insight.status === 'pending_hr_review' || insight.status === 'pending_final_hr_action') return true;
                    break;
            }
        }
        
        // Declined Coaching Recommendation Escalations
        const hasPendingRecReview = item.analysis.coachingRecommendations.some(rec => {
            if (role === 'AM' && rec.status === 'pending_am_review') return true;
            if (role === 'Manager' && rec.status === 'pending_manager_acknowledgement') return true;
            return false;
        });
        if (hasPendingRecReview) return true;

        return false;
    });

    setMessages(userMessages.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    setIsLoading(false);
  }, [role]);

  useEffect(() => {
    fetchMessages();
    
    const handleDataUpdate = () => {
        fetchMessages();
    }
    window.addEventListener('storage', handleDataUpdate);
    window.addEventListener('feedbackUpdated', handleDataUpdate);
    return () => {
        window.removeEventListener('storage', handleDataUpdate);
        window.removeEventListener('feedbackUpdated', handleDataUpdate);
    }
  }, [fetchMessages]);

  const hasMessages = messages.length > 0;

  const renderWidgets = (item: OneOnOneHistoryItem) => {
    const widgets = [];
    
    // Widget for Critical Insight Escalation
    const insight = item.analysis.criticalCoachingInsight;
    if (insight && insight.status !== 'resolved') {
        const canEmployeeAcknowledge = role === 'Employee' && insight.status === 'pending_employee_acknowledgement';
        if (canEmployeeAcknowledge) {
            widgets.push(<AcknowledgementWidget key={`${item.id}-insight`} item={item} onUpdate={fetchMessages} />);
        }
        if (role === 'AM' && insight.status === 'pending_am_review') {
            widgets.push(<EscalationWidget key={`${item.id}-insight`} item={item} onUpdate={fetchMessages} title="Escalation" titleIcon={AlertTriangle} titleColor="text-orange-700 dark:text-orange-400" bgColor="bg-orange-500/10" borderColor="border-orange-500/50" />);
        }
        if (role === 'Manager' && insight.status === 'pending_manager_review') {
            widgets.push(<EscalationWidget key={`${item.id}-insight`} item={item} onUpdate={fetchMessages} title="Escalation" titleIcon={Briefcase} titleColor="text-destructive" bgColor="bg-destructive/10" borderColor="border-destructive" />);
        }
        if (role === 'HR Head' && (insight.status === 'pending_hr_review' || insight.status === 'pending_final_hr_action')) {
            widgets.push(<HrReviewWidget key={`${item.id}-insight`} item={item} onUpdate={fetchMessages} />);
        }
    }

    // Widgets for Declined Coaching Recommendations
    item.analysis.coachingRecommendations.forEach(rec => {
        if (role === 'AM' && rec.status === 'pending_am_review') {
            widgets.push(<DeclinedCoachingReviewWidget key={`${item.id}-${rec.id}`} item={item} rec={rec} onUpdate={fetchMessages} />);
        }
        if (role === 'Manager' && rec.status === 'pending_manager_acknowledgement') {
            widgets.push(<ManagerAcknowledgementWidget key={`${item.id}-${rec.id}`} item={item} rec={rec} onUpdate={fetchMessages} />);
        }
    });

    return widgets;
  };


  return (
    <div className="p-4 md:p-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl font-bold font-headline mb-2 text-foreground flex items-center gap-3">
            <MessageSquare className="h-8 w-8" />
            Messages
          </CardTitle>
          <CardDescription className="text-lg text-muted-foreground">
            A central place for information, notifications, and actions gathered by the tool.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
            {isLoading ? (
                 <Skeleton className="h-48 w-full" />
            ) : hasMessages ? (
                messages.flatMap(item => renderWidgets(item))
            ) : (
                <div className="text-center py-12 border-2 border-dashed rounded-lg">
                    <p className="text-muted-foreground text-lg">No new messages or actions.</p>
                    <p className="text-sm text-muted-foreground mt-2">
                        Important updates and required actions will appear here.
                    </p>
                </div>
            )}
        </CardContent>
      </Card>
    </div>
  );
}


export default function MessagesPage() {
  const { role, setRole, isLoading } = useRole();

  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <div className="w-full max-w-sm flex flex-col items-center gap-4">
          <Skeleton className="h-12 w-48" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-32 w-full mt-8" />
        </div>
      </div>
    );
  }
  
  if (!role) {
    // This shouldn't happen if navigation is correct, but as a fallback
    return null;
  }

  return (
    <DashboardLayout role={role} onSwitchRole={setRole}>
        <MessagesContent role={role} />
    </DashboardLayout>
  );
}
