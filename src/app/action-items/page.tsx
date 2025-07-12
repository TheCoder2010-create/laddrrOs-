
"use client";

import { useState, useEffect, useCallback } from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { getAllFeedback, Feedback, AuditEvent, submitSupervisorUpdate, toggleActionItemStatus, resolveFeedback, requestIdentityReveal, addFeedbackUpdate, submitCollaborativeResolution } from '@/services/feedback-service';
import { format, formatDistanceToNow } from 'date-fns';
import { Label } from '@/components/ui/label';
import { Button, buttonVariants } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ListTodo, ShieldAlert, AlertTriangle, Info, CheckCircle, Clock, User, MessageSquare, Send, ChevronsRight, FileCheck, UserX, ShieldCheck as ShieldCheckIcon, FolderClosed, MessageCircleQuestion } from 'lucide-react';
import { useRole, Role } from '@/hooks/use-role';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Textarea } from '@/components/ui/textarea';
import DashboardLayout from '@/components/dashboard-layout';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';


const criticalityConfig = {
    'Critical': { icon: ShieldAlert, color: 'bg-destructive/20 text-destructive', badge: 'destructive' },
    'High': { icon: AlertTriangle, color: 'bg-orange-500/20 text-orange-500', badge: 'destructive' },
    'Medium': { icon: Info, color: 'bg-yellow-500/20 text-yellow-500', badge: 'secondary' },
    'Low': { icon: CheckCircle, color: 'bg-green-500/20 text-green-500', badge: 'success' },
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
                                By requesting the user's identity, you acknowledge your responsibility to protect the employee from any form of bias or retaliation. This conversation must be handled with the utmost confidentiality and fairness. This acknowledgment will be logged.
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
    
    if (feedback.status === 'Pending HR Action') {
        return <CollaborativeActionPanel feedback={feedback} onUpdate={onUpdate} />;
    }

    if (feedback.assignedTo !== role) return null;
    
    if (feedback.status === 'To-Do') {
        return <ToDoPanel feedback={feedback} onUpdate={onUpdate} />
    }
    
    if (feedback.isAnonymous) {
        return <AnonymousConcernPanel feedback={feedback} onUpdate={onUpdate} />;
    }

    // Supervisor's action panel for critical insights from 1-on-1s or identified concerns
    if (feedback.status === 'Pending Supervisor Action') {
        return (
            <div className="p-4 border-t mt-4 space-y-4 bg-background rounded-b-lg">
                <Label className="text-base font-semibold">Your Action Required</Label>
                 <p className="text-sm text-muted-foreground">
                    A critical insight or identified concern requires your attention. Please review the details and provide a summary of the actions you have taken or will take to address the concern. This will be sent to the employee for acknowledgment.
                </p>
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


function ActionItemsContent() {
  const [activeItems, setActiveItems] = useState<Feedback[]>([]);
  const [closedItems, setClosedItems] = useState<Feedback[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { role } = useRole();

  const fetchFeedback = useCallback(async () => {
    if (!role) return;
    setIsLoading(true);
    try {
      const allFeedback = await getAllFeedback();
      const myFeedback = allFeedback.filter(f => {
        // A case is relevant if user is assigned OR it's a collaborative HR case and user is the Manager or HR Head.
        const isAssignedToMe = f.assignedTo === role;
        const isCollaborator = f.status === 'Pending HR Action' && (role === 'HR Head' || role === f.assignedTo);
        const isActive = f.status !== 'Resolved' && f.status !== 'Open' && f.status !== 'Closed';

        return (isActive && (isAssignedToMe || isCollaborator)) || f.status === 'Resolved';
      });

      const active = myFeedback.filter(f => f.status !== 'Resolved');
      const closed = myFeedback.filter(f => f.status === 'Resolved');
      
      active.sort((a, b) => {
        if (a.status === 'To-Do' && b.status !== 'To-Do') return -1;
        if (b.status === 'To-Do' && a.status !== 'To-Do') return 1;
        return new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime();
      });

      closed.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());

      setActiveItems(active);
      setClosedItems(closed);
    } catch (error) {
      console.error("Failed to fetch feedback", error);
    } finally {
      setIsLoading(false);
    }
  }, [role]);

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
        case 'Pending HR Action': return 'default';
        case 'Pending Identity Reveal': return 'secondary';
        default: return 'secondary';
    }
  }

  const renderFeedbackList = (items: Feedback[], defaultOpenId?: string) => {
    return (
        <Accordion type="single" collapsible className="w-full" defaultValue={defaultOpenId}>
        {items.map((feedback) => {
            const config = criticalityConfig[feedback.criticality || 'Low'];
            const Icon = feedback.isAnonymous ? UserX : (config?.icon || Info);
            return (
            <AccordionItem value={feedback.trackingId} key={feedback.trackingId}>
                <AccordionTrigger>
                <div className="flex justify-between items-center w-full pr-4">
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                        <Badge variant={config?.badge as any || 'secondary'}>{feedback.isAnonymous ? 'Anonymous' : (feedback.criticality || 'N/A')}</Badge>
                        <span className="font-medium text-left truncate">{feedback.subject}</span>
                    </div>
                    <div className="flex items-center gap-4 ml-4">
                         {feedback.status === 'Pending HR Action' ? (
                            <Badge className="bg-black text-white"><ShieldCheckIcon className="mr-2 h-4 w-4" />HR Review</Badge>
                         ) : (
                            <Badge variant={getStatusVariant(feedback.status)}>{feedback.status || 'N/A'}</Badge>
                         )}
                        <span className="text-sm text-muted-foreground font-normal hidden md:inline-block">
                            Assigned {formatDistanceToNow(new Date(feedback.auditTrail?.find(a => a.event === 'Assigned' || a.event === 'To-Do List Created' || a.event.includes("Submitted"))?.timestamp || feedback.submittedAt), { addSuffix: true })}
                        </span>
                    </div>
                </div>
                </AccordionTrigger>
                <AccordionContent className="space-y-6 pt-4">
                     {feedback.status !== 'To-Do' && (
                        <>
                            <div className={cn("p-4 rounded-lg border space-y-3", config?.color || 'bg-blue-500/20 text-blue-500')}>
                                <div className="flex items-center gap-2 font-bold">
                                    <Icon className="h-5 w-5" />
                                    <span>{feedback.isAnonymous ? 'Anonymous Submission' : `AI Analysis: ${feedback.criticality}`}</span>
                                </div>
                                {feedback.summary && <p><span className="font-semibold">Summary:</span> {feedback.summary}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label className="text-base">Original Submission Context</Label>
                                <p className="whitespace-pre-wrap text-sm text-muted-foreground p-4 border rounded-md bg-muted/50">{feedback.message}</p>
                            </div>
                        </>
                     )}

                    {feedback.auditTrail && <AuditTrail trail={feedback.auditTrail} />}

                    {feedback.status !== 'Resolved' && <ActionPanel feedback={feedback} onUpdate={fetchFeedback} />}

                    <div className="text-xs text-muted-foreground/80 pt-4 border-t">
                        Tracking ID: <code className="font-mono">{feedback.trackingId}</code>
                    </div>
                </AccordionContent>
            </AccordionItem>
            )
        })}
        </Accordion>
    );
  }

  return (
    <div className="p-4 md:p-8">
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
                renderFeedbackList(activeItems, activeItems[0]?.trackingId)
          )}
        </CardContent>
      </Card>

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
                        {renderFeedbackList(closedItems)}
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
