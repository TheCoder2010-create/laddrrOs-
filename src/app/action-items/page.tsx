
"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { getAllFeedback, Feedback, AuditEvent, submitSupervisorUpdate, toggleActionItemStatus, resolveFeedback, requestIdentityReveal, addFeedbackUpdate, submitCollaborativeResolution, submitFinalDisposition, submitHrRetaliationResponse } from '@/services/feedback-service';
import { format, formatDistanceToNow } from 'date-fns';
import { Label } from '@/components/ui/label';
import { Button, buttonVariants } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ListTodo, ShieldAlert, AlertTriangle, Info, CheckCircle, Clock, User, MessageSquare, Send, ChevronsRight, FileCheck, UserX, ShieldCheck as ShieldCheckIcon, FolderClosed, MessageCircleQuestion, UserPlus, FileText, Loader2, Link as LinkIcon, Paperclip } from 'lucide-react';
import { useRole, Role } from '@/hooks/use-role';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Textarea } from '@/components/ui/textarea';
import DashboardLayout from '@/components/dashboard-layout';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';

const criticalityConfig = {
    'Critical': { icon: ShieldAlert, color: 'bg-destructive/20 text-destructive', badge: 'destructive' },
    'High': { icon: AlertTriangle, color: 'bg-orange-500/20 text-orange-500', badge: 'destructive' },
    'Medium': { icon: Info, color: 'bg-yellow-500/20 text-yellow-500', badge: 'secondary' },
    'Low': { icon: CheckCircle, color: 'bg-green-500/20 text-green-500', badge: 'success' },
    'Retaliation Claim': { icon: ShieldAlert, color: 'bg-destructive/20 text-destructive', badge: 'destructive' },
};

const auditEventIcons = {
    'Submitted': FileCheck,
    'Critical Insight Identified': ShieldAlert,
    'To-Do List Created': ListTodo,
    'AI Analysis Completed': ChevronsRight,
    'Assigned': Send,
    'Supervisor Responded': MessageSquare,
    'Resolved': CheckCircle,
    'default': Clock,
}

function AuditTrail({ trail }: { trail: AuditEvent[] }) {
    if (!trail || trail.length === 0) return null;

    return (
        <div className="space-y-2">
            <Label className="text-base">Case History</Label>
            <div className="p-4 border rounded-md bg-muted/50 space-y-4">
                {trail.map((event, index) => {
                    const Icon = auditEventIcons[event.event as keyof typeof auditEventIcons] || auditEventIcons.default;
                    return (
                        <div key={index} className="flex items-start gap-3">
                            <Icon className="h-5 w-5 mt-0.5 text-muted-foreground" />
                            <div className="flex-1">
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
    );
}

function ToDoPanel({ feedback, onUpdate }: { feedback: Feedback, onUpdate: () => void }) {
    const { toast } = useToast();
    const allItemsCompleted = feedback.actionItems?.every(item => item.status === 'completed');

    const handleToggle = async (actionItemId: string) => {
        await toggleActionItemStatus(feedback.trackingId, actionItemId);
        onUpdate();
    }
    
    const handleResolve = async () => {
        await resolveFeedback(feedback.trackingId, feedback.assignedTo!, "All action items completed.");
        toast({ title: "To-Do List Completed", description: "You've completed all action items." });
        onUpdate();
    }

    return (
        <div className="space-y-4">
             <div className="p-4 rounded-lg border bg-green-500/10 space-y-3">
                 <div className="flex items-center gap-2 font-bold text-green-700 dark:text-green-400">
                    <ListTodo className="h-5 w-5" />
                    <span>To-Do from 1-on-1 with {feedback.employee}</span>
                 </div>
                 <p className="text-sm text-green-600 dark:text-green-300">
                    The following action items were generated from your recent 1-on-1. Check them off as you complete them.
                 </p>
             </div>
             <div className="space-y-3 pl-4">
                {feedback.actionItems?.map(item => (
                    <div key={item.id} className="flex items-center space-x-3">
                        <Checkbox 
                            id={`action-${item.id}`}
                            checked={item.status === 'completed'}
                            onCheckedChange={() => handleToggle(item.id)}
                            aria-label={item.text}
                        />
                        <label
                            htmlFor={`action-${item.id}`}
                            className={cn("text-sm font-medium leading-none", item.status === 'completed' && "line-through text-muted-foreground")}
                        >
                           ({item.owner}) {item.text}
                        </label>
                    </div>
                ))}
             </div>
             {allItemsCompleted && (
                <div className="pt-4 border-t">
                    <Button variant="success" onClick={handleResolve}>Mark as Completed</Button>
                </div>
             )}
        </div>
    )
}

function RetaliationActionPanel({ feedback, onUpdate }: { feedback: Feedback, onUpdate: () => void }) {
    const { role } = useRole();
    const { toast } = useToast();
    const [response, setResponse] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async () => {
        if (!response || !role) return;
        setIsSubmitting(true);
        try {
            await submitHrRetaliationResponse(feedback.trackingId, role, response);
            setResponse('');
            toast({ title: "Response Submitted", description: "The employee has been notified to acknowledge your response." });
            onUpdate();
        } catch (error) {
            console.error(error);
            toast({ variant: "destructive", title: "Submission Failed" });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="p-4 border-t mt-4 space-y-4 bg-background rounded-b-lg">
            <Label className="text-base font-semibold text-destructive">Action Required: Retaliation Claim</Label>
            <p className="text-sm text-muted-foreground">
                A retaliation claim has been filed. Please investigate thoroughly. Document your findings and the resolution steps taken below. This will be sent to the employee for acknowledgment.
            </p>
            <div className="p-4 border rounded-lg bg-muted/20 space-y-3">
                <Label htmlFor="hr-response">HR Resolution Summary</Label>
                <Textarea
                    id="hr-response"
                    placeholder="e.g., 'After reviewing the case, we have spoken with all parties involved and have implemented the following corrective actions...'"
                    value={response}
                    onChange={(e) => setResponse(e.target.value)}
                    rows={4}
                />
                <Button onClick={handleSubmit} disabled={!response || isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Submit for Employee Acknowledgment
                </Button>
            </div>
        </div>
    );
}


function CollaborativeActionPanel({ feedback, onUpdate }: { feedback: Feedback, onUpdate: () => void }) {
    const { role } = useRole();
    const { toast } = useToast();
    const [update, setUpdate] = useState('');
    const [resolution, setResolution] = useState('');

    const handleAddUpdate = async () => {
        if (!update || !role) return;
        await addFeedbackUpdate(feedback.trackingId, role, update);
        setUpdate('');
        toast({ title: "Update Added", description: "Your notes have been added to the case history." });
        onUpdate();
    }

    const handleResolve = async () => {
        if (!resolution || !role) return;
        await submitCollaborativeResolution(feedback.trackingId, role, resolution);
        toast({ title: "Resolution Statement Submitted", description: "The case will be resolved once all parties submit their statements." });
        onUpdate();
    }
    
    const managerHasResolved = !!feedback.managerResolution;
    const hrHasResolved = !!feedback.hrHeadResolution;
    const isManager = role === 'Manager';
    const isHrHead = role === 'HR Head';
    const canManagerAct = isManager && !managerHasResolved;
    const canHrAct = isHrHead && !hrHasResolved;

    return (
        <div className="p-4 border-t mt-4 space-y-4 bg-background rounded-b-lg">
            <Label className="text-base font-semibold">Collaborative Action Required</Label>
            <p className="text-sm text-muted-foreground">
                This anonymous case has been escalated for joint review. Both Manager and HR Head must add a resolution summary to close the case. Regular updates can be added at any time.
            </p>
             <div className="p-4 border rounded-lg bg-muted/20 space-y-3">
                <Label htmlFor="add-update" className="font-medium">Add Interim Update</Label>
                <p className="text-xs text-muted-foreground">
                    Add notes, observations, or actions taken. This will be visible in the case history.
                </p>
                <Textarea 
                    id="add-update"
                    placeholder="e.g., 'Met with the team to discuss communication protocols...'"
                    value={update}
                    onChange={(e) => setUpdate(e.target.value)}
                    rows={4}
                />
                <Button onClick={handleAddUpdate} disabled={!update}>Add Update</Button>
            </div>
            
            <div className="p-4 border rounded-lg bg-muted/20 space-y-3">
                <Label htmlFor="resolve-case" className="font-medium">Submit Final Resolution</Label>
                 <p className="text-xs text-muted-foreground">
                    Provide your final resolution summary. The case will be closed once both Manager and HR Head have submitted their statements.
                </p>

                {(isManager && managerHasResolved) && <p className="text-sm font-semibold text-green-600">Your resolution has been submitted. Waiting for HR Head.</p>}
                {(isHrHead && hrHasResolved) && <p className="text-sm font-semibold text-green-600">Your resolution has been submitted. Waiting for Manager.</p>}

                {(canManagerAct || canHrAct) && (
                    <Textarea 
                        id="resolve-case"
                        placeholder="e.g., 'Thank you for this feedback. We have implemented new guidelines...'"
                        value={resolution}
                        onChange={(e) => setResolution(e.target.value)}
                        rows={4}
                    />
                )}
                
                <Button variant="success" onClick={handleResolve} disabled={!resolution || (isManager && managerHasResolved) || (isHrHead && hrHasResolved)}>Submit Resolution</Button>
            </div>
        </div>
    )
}

function AnonymousConcernPanel({ feedback, onUpdate }: { feedback: Feedback, onUpdate: () => void }) {
    const { role } = useRole();
    const { toast } = useToast();
    const [revealReason, setRevealReason] = useState('');
    const [resolution, setResolution] = useState('');

    const handleRequestIdentity = async () => {
        if (!revealReason || !role) return;
        await requestIdentityReveal(feedback.trackingId, role, revealReason);
        setRevealReason('');
        toast({ title: "Request Submitted", description: "The user has been notified of your request."});
        onUpdate();
    }

    const handleResolveDirectly = async () => {
        if (!resolution || !role) return;
        await resolveFeedback(feedback.trackingId, role, resolution);
        setResolution('');
        toast({ title: "Case Resolved", description: "You have resolved the anonymous concern."});
        onUpdate();
    }
    
    return (
        <div className="p-4 border-t mt-4 space-y-4 bg-background rounded-b-lg">
            <Label className="text-base font-semibold">Your Action Required</Label>
            <p className="text-sm text-muted-foreground">
                This is an anonymous submission. You can resolve it directly with a closing statement, or request the user reveal their identity if more information is needed.
            </p>
            <div className="p-4 border rounded-lg bg-muted/20 space-y-3">
                <Label htmlFor="resolve-directly" className="font-medium">Option 1: Resolve Directly</Label>
                <p className="text-xs text-muted-foreground">
                    If you have enough information to close this case, provide a final resolution summary. This will be visible to the anonymous user.
                </p>
                <Textarea 
                    id="resolve-directly"
                    placeholder="e.g., 'Thank you for this feedback. We have reviewed the team's workflow and will be implementing new guidelines for project planning to ensure equitable task distribution...'"
                    value={resolution}
                    onChange={(e) => setResolution(e.target.value)}
                    rows={4}
                />
                <Button onClick={handleResolveDirectly} disabled={!resolution}>Resolve Case</Button>
            </div>
            <div className="p-4 border rounded-lg bg-muted/20 space-y-3">
                <Label htmlFor="revealReason" className="font-medium">Option 2: Request Identity Reveal</Label>
                 <p className="text-xs text-muted-foreground">
                    If you cannot proceed without more details, explain why you need to know their identity. This message will be shown to the user.
                </p>
                <Textarea 
                    id="revealReason"
                    placeholder="e.g., 'Thank you for raising this. To investigate fully, I need to speak with you directly. I assure you this will be handled with confidentiality and without retaliation.'"
                    value={revealReason}
                    onChange={(e) => setRevealReason(e.target.value)}
                    rows={4}
                />
                 <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button disabled={!revealReason}>Request Identity Reveal</Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Acknowledge Your Responsibility</AlertDialogTitle>
                            <AlertDialogDescription>
                                By requesting to reveal the user's identity, you acknowledge your responsibility to ensure their safety from any form of bias, retaliation, or adverse consequences. This request must be treated with the highest standards of confidentiality, sensitivity, and fairness. Your acknowledgment and intent will be logged for accountability
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={handleRequestIdentity} className={cn(buttonVariants({variant: 'default'}))}>
                                Acknowledge & Continue
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </div>
    );
}

function FinalDispositionPanel({ feedback, onUpdate }: { feedback: Feedback, onUpdate: () => void }) {
    const { role } = useRole();
    const { toast } = useToast();
    const [disposition, setDisposition] = useState<string | null>(null);
    const [notes, setNotes] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async () => {
        if (!disposition || !notes || !role) return;
        setIsSubmitting(true);
        try {
            await submitFinalDisposition(feedback.trackingId, role, disposition, notes);
            toast({ title: "Final Action Logged", description: "The case has been closed." });
            onUpdate();
        } catch (error) {
            console.error("Failed to submit final disposition", error);
            toast({ variant: 'destructive', title: "Submission Failed" });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="p-4 border-t mt-4 space-y-4 bg-background rounded-b-lg">
            <Label className="text-base font-semibold text-destructive">Final Disposition Required</Label>
            <p className="text-sm text-muted-foreground">
                The employee rejected the previous resolution. This is the final step. Please select a formal disposition to close this case. This action is irreversible.
            </p>
            {!disposition ? (
                <div className="flex flex-wrap gap-2">
                    <Button variant="secondary" onClick={() => setDisposition('Assigned to Ombudsman')}><UserX className="mr-2" /> Assign to Ombudsman</Button>
                    <Button variant="secondary" onClick={() => setDisposition('Assigned to Grievance Office')}><UserPlus className="mr-2" /> Assign to Grievance Office</Button>
                    <Button variant="destructive" onClick={() => setDisposition('Logged Dissatisfaction & Closed')}><FileText className="mr-2" /> Log & Close</Button>
                </div>
            ) : (
                <div className="w-full space-y-3 p-3 bg-muted/50 rounded-lg">
                    <p className="font-medium">Action: <span className="text-primary">{disposition}</span></p>
                    <Label htmlFor="final-notes">Reasoning / Final Notes</Label>
                    <Textarea
                        id="final-notes"
                        placeholder={`Provide reasoning for selecting: ${disposition}`}
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        rows={4}
                        className="bg-background"
                    />
                    <div className="flex gap-2">
                        <Button className="bg-black hover:bg-black/80 text-white" onClick={handleSubmit} disabled={isSubmitting || !notes}>
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Submit Final Action
                        </Button>
                        <Button variant="ghost" onClick={() => setDisposition(null)}>Cancel</Button>
                    </div>
                </div>
            )}
        </div>
    );
}

function ActionPanel({ feedback, onUpdate }: { feedback: Feedback, onUpdate: () => void }) {
    const { role } = useRole();
    const { toast } = useToast();
    const [supervisorUpdate, setSupervisorUpdate] = useState('');

    const handleSupervisorUpdate = async () => {
        if (!supervisorUpdate || !role) return;
        await submitSupervisorUpdate(feedback.trackingId, role, supervisorUpdate);
        setSupervisorUpdate('');
        toast({ title: "Update Submitted", description: "The employee has been notified to acknowledge your response." });
        onUpdate();
    }
    
    // Retaliation claims are handled by a specific panel for HR Head
    if (role === 'HR Head' && feedback.status === 'Retaliation Claim') {
        return <RetaliationActionPanel feedback={feedback} onUpdate={onUpdate} />;
    }

    // For anonymous concerns escalated to HR, show the collaborative panel
    if (feedback.status === 'Pending HR Action' && feedback.isAnonymous) {
        return <CollaborativeActionPanel feedback={feedback} onUpdate={onUpdate} />;
    }

    // For identified concerns that were rejected by employee at HR level
    if (role === 'HR Head' && feedback.auditTrail?.some(e => e.event === 'Final Disposition Required')) {
        return <FinalDispositionPanel feedback={feedback} onUpdate={onUpdate} />;
    }
    
    if (feedback.assignedTo !== role) return null;
    
    if (feedback.status === 'To-Do') {
        return <ToDoPanel feedback={feedback} onUpdate={onUpdate} />
    }
    
    if (feedback.isAnonymous) {
        return <AnonymousConcernPanel feedback={feedback} onUpdate={onUpdate} />;
    }

    // This handles all identified concerns for TL, AM, Manager, and HR Head
    const isEscalatedConcern = 
        feedback.status === 'Pending Supervisor Action' ||
        feedback.status === 'Pending Manager Action' ||
        (feedback.status === 'Pending HR Action' && !feedback.isAnonymous);
        
    if (isEscalatedConcern) {
        let title = 'Your Action Required';
        let description = "A concern requires your attention. Please review the details and provide a summary of the actions you have taken or will take to address it. This will be sent to the employee for acknowledgment.";

        if (feedback.status === 'Pending Manager Action') {
            title = 'Escalation: Review Required';
            description = `This concern has been escalated to you as the ${role}. Please review the case history and provide your resolution summary.`;
        } else if (feedback.status === 'Pending HR Action') {
             if (feedback.isAnonymous) { // The collaborative case
                return <CollaborativeActionPanel feedback={feedback} onUpdate={onUpdate} />;
            }
            title = 'Final Escalation: HR Review Required';
            description = "This concern has been escalated to HR for final review. Provide your resolution summary to be sent to the employee for their final acknowledgment."
        }


        return (
            <div className="p-4 border-t mt-4 space-y-4 bg-background rounded-b-lg">
                <Label className="text-base font-semibold">{title}</Label>
                 <p className="text-sm text-muted-foreground">{description}</p>
                <div className="p-4 border rounded-lg bg-muted/20 space-y-3">
                    <Label htmlFor="supervisorUpdate">Resolution Summary</Label>
                    <Textarea 
                        id="supervisorUpdate"
                        placeholder="e.g., 'I spoke with the employee to clarify the issue and we have agreed on the following steps...'"
                        value={supervisorUpdate}
                        onChange={(e) => setSupervisorUpdate(e.target.value)}
                        rows={4}
                    />
                    <Button onClick={handleSupervisorUpdate} disabled={!supervisorUpdate}>Submit for Acknowledgement</Button>
                </div>
            </div>
        );
    }
    
    return null; // No action panel for other statuses
}

function ParentCaseModal({ parentCase, open, onOpenChange }: { parentCase: Feedback | null, open: boolean, onOpenChange: (open: boolean) => void }) {
    if (!parentCase) return null;

    const config = criticalityConfig[parentCase.criticality || 'Low'];
    const Icon = config?.icon || Info;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl">
                <DialogHeader>
                    <DialogTitle>Parent Case Details: {parentCase.subject}</DialogTitle>
                    <DialogDescription>
                        Tracking ID: {parentCase.trackingId}
                    </DialogDescription>
                </DialogHeader>
                <ScrollArea className="max-h-[70vh] pr-6">
                    <div className="space-y-6 py-4">
                        <div className="space-y-2">
                            <Label className="text-base">Original Submission Context</Label>
                            <p className="whitespace-pre-wrap text-sm text-muted-foreground p-4 border rounded-md bg-muted/50">{parentCase.message}</p>
                        </div>
                        {parentCase.auditTrail && <AuditTrail trail={parentCase.auditTrail} />}
                        {parentCase.resolution && (
                             <div className="space-y-2">
                                <Label className="text-base">Final Resolution</Label>
                                <p className="whitespace-pre-wrap text-sm text-muted-foreground p-4 border rounded-md bg-green-500/10">{parentCase.resolution}</p>
                            </div>
                        )}
                    </div>
                </ScrollArea>
                <DialogFooter className="pt-0" />
            </DialogContent>
        </Dialog>
    );
}


function ActionItemsContent() {
  const [allFeedback, setAllFeedback] = useState<Feedback[]>([]);
  const [activeItems, setActiveItems] = useState<Feedback[]>([]);
  const [closedItems, setClosedItems] = useState<Feedback[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { role } = useRole();
  const accordionRef = useRef<HTMLDivElement>(null);
  const [openAccordionItem, setOpenAccordionItem] = useState<string | undefined>(undefined);
  
  const [parentCaseInModal, setParentCaseInModal] = useState<Feedback | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchFeedback = useCallback(async () => {
    if (!role) return;
    setIsLoading(true);
    try {
      const fetchedFeedback = await getAllFeedback();
      setAllFeedback(fetchedFeedback); // Store all for modal lookup

      const myFeedback = fetchedFeedback.filter(f => {
        const isCurrentlyAssigned = f.assignedTo === role;
        const isCollaboratorOnAnonymousCase = f.isAnonymous && f.status === 'Pending HR Action' && (role === 'HR Head' || role === 'Manager');
        const wasInvolved = f.auditTrail?.some(e => e.actor === role) ?? false;
        
        // Include closed cases if the user was ever involved.
        if (f.status === 'Resolved' || f.status === 'Closed') {
            return wasInvolved;
        }
        
        return isCurrentlyAssigned || isCollaboratorOnAnonymousCase || wasInvolved;
      });

      const active = myFeedback.filter(f => f.status !== 'Resolved' && f.status !== 'Closed');
      const closed = myFeedback.filter(f => f.status === 'Resolved' || f.status === 'Closed');
      
      active.sort((a, b) => {
        if (a.status === 'To-Do' && b.status !== 'To-Do') return -1;
        if (b.status === 'To-Do' && a.status !== 'To-Do') return 1;
        return new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime();
      });

      closed.sort((a, b) => {
        const bDate = b.auditTrail?.find(e => e.event === 'Resolved' || e.event === 'Closed')?.timestamp || b.submittedAt;
        const aDate = a.auditTrail?.find(e => e.event === 'Resolved' || e.event === 'Closed')?.timestamp || a.submittedAt;
        return new Date(bDate).getTime() - new Date(aDate).getTime();
      });

      setActiveItems(active);
      setClosedItems(closed);
      if (active.length > 0 && !openAccordionItem) {
        setOpenAccordionItem(active[0].trackingId);
      }
    } catch (error) {
      console.error("Failed to fetch feedback", error);
    } finally {
      setIsLoading(false);
    }
  }, [role, openAccordionItem]);

  useEffect(() => {
    fetchFeedback();

    const handleStorageChange = () => {
        fetchFeedback();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('feedbackUpdated', handleStorageChange);

    return () => {
        window.removeEventListener('storage', handleStorageChange);
        window.removeEventListener('feedbackUpdated', handleStorageChange);
    };
  }, [fetchFeedback]);

  if (isLoading) {
    return (
        <div className="p-4 md:p-8">
            <Card>
                <CardHeader>
                    <Skeleton className="h-8 w-48 mb-2" />
                    <Skeleton className="h-6 w-72" />
                </CardHeader>
                <CardContent className="space-y-4">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                </CardContent>
            </Card>
        </div>
    );
  }

  const getStatusVariant = (status?: Feedback['status']) => {
    switch(status) {
        case 'Resolved': return 'success';
        case 'To-Do': return 'default';
        case 'Pending Supervisor Action': return 'destructive';
        case 'Pending Manager Action': return 'destructive';
        case 'Pending Employee Acknowledgment': return 'destructive';
        case 'Pending HR Action': 
            return 'default';
        case 'Pending Identity Reveal': return 'secondary';
        case 'Retaliation Claim': return 'destructive';
        case 'Closed': return 'secondary';
        default: return 'secondary';
    }
  }

  const handleOpenParentCase = (parentId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const parentCase = allFeedback.find(f => f.trackingId === parentId);
    if (parentCase) {
        setParentCaseInModal(parentCase);
        setIsModalOpen(true);
    }
  };

  const renderFeedbackList = (items: Feedback[], isClosedList = false) => {
    return (
        <Accordion 
            type="single" 
            collapsible 
            className="w-full" 
            value={openAccordionItem}
            onValueChange={setOpenAccordionItem}
        >
        {items.map((feedback) => {
            const config = criticalityConfig[feedback.criticality || 'Low'];
            let Icon = Info;
            if (feedback.status === 'Retaliation Claim') Icon = ShieldAlert;
            else if (feedback.isAnonymous) Icon = UserX;
            else if (config?.icon) Icon = config.icon;
            
            let statusBadge;
            
            if (feedback.status === 'Pending HR Action') {
                statusBadge = <Badge className="bg-black text-white"><ShieldCheckIcon className="mr-2 h-4 w-4" />HR Review</Badge>;
            } else {
                statusBadge = <Badge variant={getStatusVariant(feedback.status)}>{feedback.status || 'N/A'}</Badge>;
            }

            return (
            <AccordionItem value={feedback.trackingId} key={feedback.trackingId} id={feedback.trackingId}>
                <AccordionTrigger>
                <div className="flex justify-between items-center w-full pr-4">
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                        <Badge variant={config?.badge as any || 'secondary'}>{feedback.status === 'Retaliation Claim' ? 'Retaliation' : (feedback.isAnonymous ? 'Anonymous' : (feedback.criticality || 'N/A'))}</Badge>
                        <span className="font-medium text-left truncate">{feedback.subject}</span>
                    </div>
                    <div className="flex items-center gap-4 ml-4">
                        <div className="hidden md:flex items-center gap-2">
                            <span className="text-xs text-muted-foreground font-mono">ID: ...{feedback.trackingId.slice(-6)}</span>
                            {statusBadge}
                        </div>
                    </div>
                </div>
                </AccordionTrigger>
                <AccordionContent className="space-y-6 pt-4">
                     {feedback.status !== 'To-Do' && (
                        <>
                             <div className={cn("p-4 rounded-lg border space-y-3", config?.color || 'bg-blue-500/20 text-blue-500')}>
                                <div className="flex items-center gap-2 font-bold">
                                    <Icon className="h-5 w-5" />
                                    <span>
                                        {feedback.status === 'Retaliation Claim'
                                            ? 'Retaliation Claim'
                                            : feedback.isAnonymous
                                            ? 'Anonymous Submission'
                                            : `AI Analysis: ${feedback.criticality}`}
                                    </span>
                                </div>
                                {feedback.summary && <p><span className="font-semibold">Summary:</span> {feedback.summary}</p>}
                                
                                {feedback.parentCaseId && (
                                     <Button variant="outline" size="sm" onClick={(e) => handleOpenParentCase(feedback.parentCaseId!, e)}>
                                        <LinkIcon className="mr-2" /> View Parent Case
                                    </Button>
                                )}
                                {feedback.attachment && (
                                    <Button variant="outline" size="sm" asChild>
                                        <a href="#" onClick={(e) => e.preventDefault()}>
                                            <Paperclip className="mr-2" /> View Attachment ({feedback.attachment.name})
                                        </a>
                                    </Button>
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label className="text-base">Original Submission Context</Label>
                                <p className="whitespace-pre-wrap text-sm text-muted-foreground p-4 border rounded-md bg-muted/50">{feedback.message}</p>
                            </div>
                        </>
                     )}

                    {feedback.auditTrail && <AuditTrail trail={feedback.auditTrail} />}

                    {(!isClosedList) && <ActionPanel feedback={feedback} onUpdate={fetchFeedback} />}
                    
                    {feedback.resolution && (
                         <div className="space-y-2">
                            <Label className="text-base">Final Resolution</Label>
                            <p className="whitespace-pre-wrap text-sm text-muted-foreground p-4 border rounded-md bg-green-500/10">{feedback.resolution}</p>
                        </div>
                    )}
                </AccordionContent>
            </AccordionItem>
            )
        })}
        </Accordion>
    );
  }

  return (
    <div className="p-4 md:p-8" ref={accordionRef}>
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl font-bold font-headline mb-2 text-foreground">
            <ListTodo className="inline-block mr-3 h-8 w-8" /> Action Items
          </CardTitle>
           <CardDescription className="text-lg text-muted-foreground">
            Cases and to-do lists assigned to you for review and action.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {activeItems.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed rounded-lg">
              <p className="text-muted-foreground text-lg">Your active action item list is empty.</p>
              <p className="text-sm text-muted-foreground mt-2">
                New cases assigned to you will appear here.
              </p>
            </div>
          ) : (
                renderFeedbackList(activeItems)
          )}
        </CardContent>
      </Card>
      
      <ParentCaseModal parentCase={parentCaseInModal} open={isModalOpen} onOpenChange={setIsModalOpen} />

      {closedItems.length > 0 && (
          <div className="mt-8">
            <Accordion type="single" collapsible className="w-full border rounded-lg">
                <AccordionItem value="closed-items">
                    <AccordionTrigger className="px-4 py-3">
                        <div className="flex items-center gap-2 text-lg font-semibold text-muted-foreground">
                           <FolderClosed />
                           Closed Items ({closedItems.length})
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="p-2">
                        {renderFeedbackList(closedItems, true)}
                    </AccordionContent>
                </AccordionItem>
            </Accordion>
          </div>
      )}
    </div>
  );
}


export default function ActionItemsPage() {
    const { role, setRole, isLoading } = useRole();

    if (isLoading) {
        return (
            <div className="p-4 md:p-8">
                <Skeleton className="h-screen w-full" />
            </div>
        )
    }
    
    const canAccessPage = role === 'Team Lead' || role === 'AM' || role === 'Manager' || role === 'HR Head';

    if (!role || !canAccessPage) {
         return (
            <DashboardLayout role={role!} onSwitchRole={setRole}>
                <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] text-center p-4">
                  <Card className="max-w-md">
                      <CardHeader>
                          <CardTitle>Access Denied</CardTitle>
                          <CardDescription>You do not have permission to view this page.</CardDescription>
                      </CardHeader>
                      <CardContent>
                          <p>This page is restricted to leadership roles with assigned action items.</p>
                      </CardContent>
                  </Card>
              </div>
            </DashboardLayout>
        );
    }
  
    return (
        <DashboardLayout role={role} onSwitchRole={setRole}>
            <ActionItemsContent />
        </DashboardLayout>
    );
}
