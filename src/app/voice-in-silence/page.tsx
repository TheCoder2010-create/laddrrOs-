

"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRole, Role } from '@/hooks/use-role';
import DashboardLayout from '@/components/dashboard-layout';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { getAllFeedback, Feedback, AuditEvent, addFeedbackUpdate } from '@/services/feedback-service';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Lock, ArrowLeft, ShieldAlert, AlertTriangle, Info, CheckCircle, Clock, User, MessageSquare, Send, ChevronsRight, FileCheck, Users, Bot, Loader2, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

const criticalityConfig = {
    'Critical': { icon: ShieldAlert, color: 'bg-destructive/20 text-destructive', badge: 'destructive' },
    'High': { icon: AlertTriangle, color: 'bg-orange-500/20 text-orange-500', badge: 'destructive' },
    'Medium': { icon: Info, color: 'bg-yellow-500/20 text-yellow-500', badge: 'secondary' },
    'Low': { icon: CheckCircle, color: 'bg-green-500/20 text-green-500', badge: 'success' },
};

const auditEventIcons = {
    'Submitted': FileCheck,
    'AI Analysis Completed': ChevronsRight,
    'Assigned': Send,
    'Update Added': MessageSquare,
    'Resolved': CheckCircle,
    'default': Info,
}

function AuditTrail({ trail }: { trail: AuditEvent[] }) {
    if (!trail || trail.length === 0) return null;

    return (
        <div className="space-y-2">
            <Label className="text-base">Case History</Label>
            <div className="relative p-4 border rounded-md bg-muted/50">
                 <div className="absolute left-8 top-8 bottom-8 w-px bg-border -translate-x-1/2"></div>
                <div className="space-y-8">
                    {trail.map((event, index) => {
                        const Icon = auditEventIcons[event.event as keyof typeof auditEventIcons] || auditEventIcons.default;
                        return (
                            <div key={index} className="flex items-start gap-4 relative">
                                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-background border flex items-center justify-center z-10">
                                    <Icon className="h-5 w-5 text-muted-foreground" />
                                </div>
                                <div className="flex-1 -mt-1">
                                    <p className="font-medium text-sm">
                                        {event.event} by <span className="text-primary">{event.actor}</span>
                                    </p>
                                    <p className="text-xs text-muted-foreground">{format(new Date(event.timestamp), "PPP p")}</p>
                                    {event.details && <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">{event.details}</p>}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

function AssignedCaseActionPanel({ feedback, onUpdate }: { feedback: Feedback, onUpdate: () => void }) {
    const { role } = useRole();
    const { toast } = useToast();
    const [updateComment, setUpdateComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleAddUpdate = async () => {
        if (!updateComment || !role) return;
        setIsSubmitting(true);
        try {
            await addFeedbackUpdate(feedback.trackingId, role, updateComment);
            setUpdateComment('');
            toast({ title: "Update Submitted", description: "Your update has been added to the case history."});
            onUpdate();
        } catch (e) {
            console.error(e);
            toast({ variant: 'destructive', title: "Failed to add update" });
        } finally {
            setIsSubmitting(false);
        }
    };
    
    return (
         <div className="p-4 border-t mt-4 space-y-4">
            <Label className="text-base font-semibold">Case Management</Label>
            <div className="p-4 border rounded-lg bg-background space-y-3">
                <Label className="font-medium">Add Update</Label>
                <p className="text-sm text-muted-foreground">Add notes on actions taken or findings. This will be visible to the HR Head.</p>
                <Textarea 
                    placeholder="Provide an update on the case..."
                    value={updateComment}
                    onChange={(e) => setUpdateComment(e.target.value)}
                    rows={4}
                />
                <Button onClick={handleAddUpdate} disabled={!updateComment || isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Add Update
                </Button>
            </div>
        </div>
    );
}


function AssignedCasesView({ cases, onUpdate }: { cases: Feedback[], onUpdate: () => void }) {
    const getStatusVariant = (status?: string) => {
        switch(status) {
            case 'Resolved': return 'success';
            case 'In Progress': return 'secondary';
            default: return 'default';
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-3xl font-bold font-headline mb-2 text-foreground">
                    🕊️ Assigned Cases from Voice – in Silence
                </CardTitle>
                <CardDescription className="text-lg text-muted-foreground">
                    These are confidential cases assigned to you for investigation. Add updates as you make progress.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Accordion type="single" collapsible className="w-full">
                    {cases.map((feedback) => {
                        const config = criticalityConfig[feedback.criticality || 'Low'];
                        const Icon = config?.icon || Info;
                        const isCaseClosed = feedback.status === 'Resolved' || feedback.status === 'Closed';
                        return (
                             <AccordionItem value={feedback.trackingId} key={feedback.trackingId}>
                                <AccordionTrigger className="w-full px-4 py-3 text-left">
                                   <div className="flex justify-between items-center w-full">
                                        <div className="flex items-center gap-4 flex-1 min-w-0">
                                            {feedback.criticality ? (
                                                <Badge variant={config?.badge as any || 'secondary'}>{feedback.criticality}</Badge>
                                            ) : (
                                                <Badge variant="outline">Unanalyzed</Badge>
                                            )}
                                            <span className="font-medium truncate">{feedback.subject}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Badge variant={getStatusVariant(feedback.status)} className="mr-2">{feedback.status || 'Open'}</Badge>
                                        </div>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent className="space-y-4 pt-4 px-4">
                                     {feedback.summary && (
                                        <div className={cn("p-4 rounded-lg border space-y-3", config?.color || 'bg-blue-500/20 text-blue-500')}>
                                             <div className="flex items-center gap-2 font-bold">
                                                <Icon className="h-5 w-5" />
                                                <span>AI Analysis: {feedback.criticality}</span>
                                             </div>
                                             <p><span className="font-semibold">Summary:</span> {feedback.summary}</p>
                                             <p><span className="font-semibold">Reasoning:</span> {feedback.criticalityReasoning}</p>
                                        </div>
                                    )}
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center gap-4">
                                            <Label className="text-base">Original Submission</Label>
                                            <span className="text-xs text-muted-foreground font-mono cursor-text">
                                               {isCaseClosed ? `ID: ${feedback.trackingId}` : 'ID Hidden Until Closure'}
                                            </span>
                                        </div>
                                        <p className="whitespace-pre-wrap text-base text-muted-foreground p-4 border rounded-md bg-muted/50">{feedback.message}</p>
                                    </div>
                                    {feedback.auditTrail && <AuditTrail trail={feedback.auditTrail} />}
                                    <AssignedCaseActionPanel feedback={feedback} onUpdate={onUpdate} />
                                </AccordionContent>
                             </AccordionItem>
                        )
                    })}
                </Accordion>
            </CardContent>
        </Card>
    )
}

function StaticInfoPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-3xl font-bold font-headline mb-2 text-foreground">
          🕊️ Voice – In Silence
        </CardTitle>
        <p className="text-muted-foreground italic text-lg">
          “Because speaking up should never feel unsafe.”
        </p>
      </CardHeader>
      <CardContent className="space-y-6 text-base">
        <div>
          <h2 className="text-xl font-semibold mb-2">🔍 What is this?</h2>
          <p className="text-muted-foreground">
            Voice – In Silence is a protected space designed for those who want to raise a concern, flag an issue, or share sensitive feedback — without being identified.
          </p>
          <p className="text-muted-foreground mt-2">
            You don’t need to log in. You don’t need to reveal who you are. You don’t even need to say your name.
          </p>
          <p className="text-muted-foreground mt-2">
            Whether you're reporting misconduct, unfair treatment, a policy violation, or something that just doesn’t feel right — this space exists for you to speak safely and securely.
          </p>
        </div>
        <div>
          <h2 className="text-xl font-semibold mb-2">🔐 Why is this outside the login system?</h2>
          <p className="text-muted-foreground">
            To protect your identity, Voice – In Silence is intentionally kept outside your account. When you're ready to submit a concern, the system ensures that:
          </p>
          <ul className="list-disc list-inside mt-2 space-y-1 text-muted-foreground">
            <li>You are fully logged out</li>
            <li>No personal data or session info is attached</li>
            <li>You may choose to remain anonymous or use a pseudonym</li>
          </ul>
          <p className="text-muted-foreground mt-2">
            We’ve designed this separation not just for privacy — but for your peace of mind.
          </p>
        </div>
        <div>
          <h2 className="text-xl font-semibold mb-2">🔒 How your submission is protected:</h2>
          <ul className="list-disc list-inside space-y-1 text-muted-foreground">
            <li>Stored as a tamper-evident, cryptographically hashed record</li>
            <li>Routed only to the appropriate compliance or HR reviewers</li>
            <li>You receive a tracking token to follow up anonymously later</li>
          </ul>
        </div>
        <div>
          <h2 className="text-xl font-semibold mb-2">🚪 How to begin?</h2>
          <p className="text-muted-foreground">
            Logout, and then look for Voice – In Silence on the top header of the screen. That will take you to a private submission page — no login required.
          </p>
        </div>
        <div>
          <h2 className="text-xl font-semibold mb-2">🙌 You are not alone.</h2>
          <p className="text-muted-foreground">
            Silence isn’t always consent — sometimes, it’s fear. Voice – In Silence gives you a safe, protected channel to speak your truth.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function VoiceInSilenceContent({ role }: { role: Role }) {
    const [assignedCases, setAssignedCases] = useState<Feedback[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    
    const fetchAssignedCases = useCallback(async () => {
        setIsLoading(true);
        const allFeedback = await getAllFeedback();
        const myCases = allFeedback.filter(f => 
            f.source === 'Voice – In Silence' && 
            f.assignedTo?.includes(role) &&
            f.status !== 'Resolved'
        );
        setAssignedCases(myCases);
        setIsLoading(false);
    }, [role]);

    useEffect(() => {
        fetchAssignedCases();
        window.addEventListener('feedbackUpdated', fetchAssignedCases);
        return () => window.removeEventListener('feedbackUpdated', fetchAssignedCases);
    }, [fetchAssignedCases]);

    if (isLoading) {
        return <Skeleton className="h-96 w-full" />;
    }

    if (assignedCases.length > 0) {
        return <AssignedCasesView cases={assignedCases} onUpdate={fetchAssignedCases} />;
    }

    return <StaticInfoPage />;
}

export default function VoiceInSilencePage() {
  const { role, setRole, isLoading } = useRole();

  if (isLoading || !role) {
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

  return (
    <DashboardLayout role={role} onSwitchRole={setRole}>
        <div className="p-4 md:p-8">
            <VoiceInSilenceContent role={role} />
        </div>
    </DashboardLayout>
  );
}
