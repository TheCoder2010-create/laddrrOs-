

"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRole, Role } from '@/hooks/use-role';
import DashboardLayout from '@/components/dashboard-layout';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { MessageSquare, MessageCircleQuestion, AlertTriangle, CheckCircle, Loader2, ChevronsRight, User, Users, Briefcase, ShieldCheck, UserX, UserPlus, FileText, Zap, BookOpen, Podcast, Newspaper, GraduationCap, Lightbulb, MessageSquareQuote, CheckSquare as CheckSquareIcon, Info } from 'lucide-react';
import { getOneOnOneHistory, OneOnOneHistoryItem, submitEmployeeAcknowledgement, getAllFeedback, Feedback, resolveFeedback, submitEmployeeFeedbackAcknowledgement } from '@/services/feedback-service';
import { roleUserMapping } from '@/lib/role-mapping';
import { format } from 'date-fns';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import { CriticalCoachingInsight, CoachingRecommendation } from '@/ai/schemas/one-on-one-schemas';
import { Textarea } from '@/components/ui/textarea';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

function OneOnOneAcknowledgementWidget({ item, onUpdate }: { item: OneOnOneHistoryItem, onUpdate: () => void }) {
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

function GeneralNotificationWidget({ item, onUpdate }: { item: Feedback, onUpdate: () => void }) {
    const { toast } = useToast();
    const { role } = useRole();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleAcknowledge = async () => {
        setIsSubmitting(true);
        try {
            // Resolve the feedback item, which serves as acknowledging it
            await resolveFeedback(item.trackingId, role!, "Notification acknowledged.");
            toast({ title: "Notification Acknowledged" });
            onUpdate();
        } catch (error) {
            console.error("Failed to acknowledge notification", error);
            toast({ variant: 'destructive', title: "Acknowledgement Failed" });
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <Card className="border-green-500/50">
            <CardHeader className="bg-green-500/10">
                <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-400">
                    <Info className="h-6 w-6" />
                    For Your Information
                </CardTitle>
                <CardDescription>
                   {item.subject}
                </CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
                 <p className="text-sm text-muted-foreground whitespace-pre-wrap">{item.message}</p>
            </CardContent>
             <CardFooter>
                <Button variant="success" onClick={handleAcknowledge} disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Acknowledge
                </Button>
            </CardFooter>
        </Card>
    )
}

function ConcernAcknowledgementWidget({ item, onUpdate }: { item: Feedback, onUpdate: () => void }) {
    const { toast } = useToast();
    const [comments, setComments] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const lastResponderEvent = item.auditTrail?.slice().reverse().find(e => ['Supervisor Responded', 'HR Resolution Submitted'].includes(e.event));

    const handleAcknowledge = async (accepted: boolean) => {
        setIsSubmitting(true);
        try {
            await submitEmployeeFeedbackAcknowledgement(item.trackingId, accepted, comments);
            if (accepted) {
                toast({ title: "Resolution Accepted", description: "The case has been closed." });
            } else {
                toast({ title: "Concern Escalated", description: "Your feedback has been escalated to the next level." });
            }
            onUpdate();
        } catch (error) {
            console.error("Failed to submit acknowledgement", error);
            toast({ variant: 'destructive', title: "Acknowledgement Failed" });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Card className="border-blue-500/50">
            <CardHeader className="bg-blue-500/10">
                <CardTitle className="flex items-center gap-2 text-blue-700 dark:text-blue-400">
                    <MessageCircleQuestion className="h-6 w-6" />
                    Response to Your Concern
                </CardTitle>
                <CardDescription>
                    Regarding: {item.subject}
                </CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
                <div className="p-3 bg-muted/80 rounded-md border">
                    <p className="font-semibold text-foreground">{lastResponderEvent?.actor}'s Response:</p>
                    <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">{item.supervisorUpdate}</p>
                </div>
                <div className="space-y-3">
                    <Label className="font-semibold">Your Acknowledgement</Label>
                    <p className="text-sm text-muted-foreground">
                        Please review the response and provide your feedback on the resolution.
                    </p>
                    <div className="space-y-2 pt-2">
                        <Label htmlFor={`ack-comments-${item.trackingId}`}>Additional Comments (Optional)</Label>
                        <Textarea
                            id={`ack-comments-${item.trackingId}`}
                            value={comments}
                            onChange={(e) => setComments(e.target.value)}
                            placeholder="Provide more detail about your selection..."
                            rows={3}
                            className="bg-background"
                        />
                    </div>
                    <div className="flex flex-wrap gap-2 pt-2">
                        <Button onClick={() => handleAcknowledge(true)} variant="success" disabled={isSubmitting}>
                            {isSubmitting && <Loader2 className="mr-2 animate-spin" />}
                            Accept Resolution
                        </Button>
                        <Button onClick={() => handleAcknowledge(false)} variant="destructive" disabled={isSubmitting}>
                            {isSubmitting && <Loader2 className="mr-2 animate-spin" />}
                            I'm Not Satisfied, Escalate
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

function MessagesContent({ role }: { role: Role }) {
  const [messages, setMessages] = useState<(OneOnOneHistoryItem | Feedback)[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchMessages = useCallback(async () => {
    setIsLoading(true);
    const history = await getOneOnOneHistory();
    const feedback = await getAllFeedback();
    const currentUser = roleUserMapping[role];

    const userMessages: (OneOnOneHistoryItem | Feedback)[] = [];

    // Critical Insight Escalations
    history.forEach(item => {
        const insight = item.analysis.criticalCoachingInsight;
        if (insight && insight.status !== 'resolved') {
            // Employee acknowledgements always appear in their message inbox
            if (role === 'Employee' && item.employeeName === currentUser.name && insight.status === 'pending_employee_acknowledgement') {
                userMessages.push(item);
            }
        }
    });

    // General notifications and identified concern acknowledgements
    feedback.forEach(item => {
        const isAssignedToMe = item.assignedTo?.includes(role);
        // For general "for your info" notifications
        if (item.status === 'Pending Acknowledgement' && isAssignedToMe) {
            userMessages.push(item);
        }
        // For acknowledgements of identified concerns I submitted
        if (item.status === 'Pending Employee Acknowledgment' && item.submittedBy === role) {
            userMessages.push(item);
        }
    });

    userMessages.sort((a, b) => {
        const dateA = 'submittedAt' in a ? a.submittedAt : a.date;
        const dateB = 'submittedAt' in b ? b.submittedAt : b.date;
        return new Date(dateB).getTime() - new Date(dateA).getTime();
    });

    setMessages(userMessages);
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

  const renderWidgets = (item: OneOnOneHistoryItem | Feedback) => {
    // Check if it's a OneOnOneHistoryItem (has 'analysis' property)
    if ('analysis' in item) {
        const insight = item.analysis.criticalCoachingInsight;
        if (insight && insight.status === 'pending_employee_acknowledgement' && role === 'Employee') {
            return <OneOnOneAcknowledgementWidget key={`${item.id}-1on1`} item={item} onUpdate={fetchMessages} />;
        }
    } 
    // Check if it's a Feedback item (has 'trackingId' property)
    else if ('trackingId' in item) {
        if (item.status === 'Pending Acknowledgement') {
            return <GeneralNotificationWidget key={`${item.trackingId}-info`} item={item} onUpdate={fetchMessages} />;
        }
        if (item.status === 'Pending Employee Acknowledgment') {
            return <ConcernAcknowledgementWidget key={`${item.trackingId}-concern`} item={item} onUpdate={fetchMessages} />;
        }
    }
    return null;
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
            A central place for critical notifications and actions.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
            {isLoading ? (
                 <Skeleton className="h-48 w-full" />
            ) : hasMessages ? (
                <>
                    {messages.map(item => renderWidgets(item))}
                </>
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
