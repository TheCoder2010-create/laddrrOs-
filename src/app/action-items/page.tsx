
"use client";

import { useState, useEffect, useCallback } from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { getAllFeedback, Feedback, AuditEvent, submitSupervisorUpdate, amAcknowledgeResolution, amSubmitCoachingNotes, managerAcknowledge, toggleActionItemStatus, resolveFeedback, ActionItem } from '@/services/feedback-service';
import { format, formatDistanceToNow } from 'date-fns';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ListTodo, ShieldAlert, AlertTriangle, Info, CheckCircle, Clock, User, MessageSquare, Send, ChevronsRight, FileCheck, UserCheck, UserX, UserRoundCog, BrainCircuit, MessageCircleQuestion } from 'lucide-react';
import { useRole, Role, availableRolesForAssignment } from '@/hooks/use-role';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Textarea } from '@/components/ui/textarea';
import DashboardLayout from '@/components/dashboard-layout';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { Checkbox } from '@/components/ui/checkbox';

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
    'Employee Approved': UserCheck,
    'Employee Rejected': UserX,
    'AM Acknowledged Resolution': UserRoundCog,
    'AM Coached Supervisor': BrainCircuit,
    'Manager Acknowledged': CheckCircle,
    'Update Added': MessageSquare,
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

function ActionPanel({ feedback, onUpdate }: { feedback: Feedback, onUpdate: () => void }) {
    const { role } = useRole();
    const { toast } = useToast();
    const [supervisorUpdate, setSupervisorUpdate] = useState('');
    const [amCoachingNotes, setAmCoachingNotes] = useState('');

    const handleSupervisorUpdate = async () => {
        if (!supervisorUpdate) return;
        await submitSupervisorUpdate(feedback.trackingId, role!, supervisorUpdate);
        setSupervisorUpdate('');
        toast({ title: "Update Submitted", description: "The employee has been notified to acknowledge your response." });
        onUpdate();
    }
    
    const handleAmAcknowledge = async () => {
        await amAcknowledgeResolution(feedback.trackingId, role!);
        toast({ title: "Resolution Acknowledged", description: "The case has been escalated to the Manager for final review." });
        onUpdate();
    };

    const handleAmCoaching = async () => {
        if (!amCoachingNotes) return;
        await amSubmitCoachingNotes(feedback.trackingId, role!, amCoachingNotes);
        setAmCoachingNotes('');
        toast({ title: "Coaching Notes Submitted", description: "The case has been escalated to the Manager for final review." });
        onUpdate();
    };

    const handleManagerAcknowledge = async () => {
        await managerAcknowledge(feedback.trackingId, role!);
        toast({ title: "Case Closed", description: "You have acknowledged the full audit trail. The case is now resolved." });
        onUpdate();
    };

    if (feedback.assignedTo !== role) return null;
    
    if (feedback.status === 'To-Do') {
        return <ToDoPanel feedback={feedback} onUpdate={onUpdate} />
    }

    // Supervisor's action panel
    if (feedback.status === 'Pending Supervisor Action') {
        return (
            <div className="p-4 border-t mt-4 space-y-4 bg-background rounded-b-lg">
                <Label className="text-base font-semibold">Your Action Required</Label>
                 <p className="text-sm text-muted-foreground">
                    A critical insight was flagged in your 1-on-1. Please review the details and provide a summary of the actions you have taken or will take to address the concern.
                </p>
                <div className="p-4 border rounded-lg bg-muted/20 space-y-3">
                    <Label htmlFor="supervisorUpdate" className="font-medium">Resolution Summary</Label>
                    <Textarea 
                        id="supervisorUpdate"
                        placeholder="e.g., 'I spoke with the employee to clarify the issue and we have agreed on the following steps...'"
                        value={supervisorUpdate}
                        onChange={(e) => setSupervisorUpdate(e.target.value)}
                        rows={4}
                    />
                    <Button onClick={handleSupervisorUpdate} disabled={!supervisorUpdate}>Submit Update to Employee</Button>
                </div>
            </div>
        );
    }
    
    // AM's action panel
    if (feedback.status === 'Pending AM Review') {
         const wasApproved = feedback.employeeAcknowledgement?.approved;
         return (
             <div className="p-4 border-t mt-4 space-y-4 bg-background rounded-b-lg">
                 <Label className="text-base font-semibold">Your Action Required</Label>
                  <div className={cn("p-4 rounded-lg border", wasApproved ? "bg-green-500/10" : "bg-destructive/10")}>
                    <h4 className="font-bold flex items-center gap-2">
                        {wasApproved ? <UserCheck /> : <UserX />}
                        Employee {wasApproved ? 'Approved' : 'Rejected'} Supervisor's Response
                    </h4>
                    <p className="text-muted-foreground mt-2 pl-6">{feedback.employeeAcknowledgement?.justification}</p>
                 </div>

                 {wasApproved ? (
                      <div className="p-4 border rounded-lg bg-muted/20 space-y-3">
                        <Label className="font-medium">Acknowledge Resolution</Label>
                         <p className="text-sm text-muted-foreground">The employee has confirmed the issue is resolved. Please acknowledge to escalate for final managerial sign-off.</p>
                        <Button onClick={handleAmAcknowledge} variant="success">Acknowledge and Close Loop</Button>
                     </div>
                 ) : (
                     <div className="p-4 border rounded-lg bg-muted/20 space-y-3">
                        <Label htmlFor="amCoaching" className="font-medium">Submit Coaching Notes</Label>
                        <p className="text-sm text-muted-foreground">The employee has indicated the issue is not resolved. Please coach the supervisor and document the coaching actions you took below.</p>
                        <Textarea 
                            id="amCoaching"
                            placeholder="e.g., 'Coached supervisor on active listening techniques and scheduled a follow-up...'"
                            value={amCoachingNotes}
                            onChange={(e) => setAmCoachingNotes(e.target.value)}
                            rows={4}
                        />
                        <Button onClick={handleAmCoaching} disabled={!amCoachingNotes}>Submit Coaching Notes & Escalate</Button>
                     </div>
                 )}
             </div>
         );
    }

    // Manager's action panel
    if (feedback.status === 'Pending Manager Acknowledgement') {
        return (
            <div className="p-4 border-t mt-4 space-y-4 bg-background rounded-b-lg">
                <Label className="text-base font-semibold">Final Acknowledgement Required</Label>
                 <p className="text-sm text-muted-foreground">
                    Please review the complete audit trail for this critical insight. Your acknowledgement will close this case.
                </p>
                <div className="p-4 border rounded-lg bg-muted/20 space-y-3">
                    <Button onClick={handleManagerAcknowledge}>Read and Acknowledge</Button>
                </div>
            </div>
        )
    }

    return null; // No action panel for other statuses
}


function ActionItemsContent() {
  const [assignedFeedback, setAssignedFeedback] = useState<Feedback[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { role } = useRole();

  const fetchFeedback = useCallback(async () => {
    if (!role) return;
    setIsLoading(true);
    try {
      const allFeedback = await getAllFeedback();
      const myFeedback = allFeedback.filter(f => f.assignedTo === role && f.status !== 'Resolved' && f.status !== 'Open');
      // Sort to show To-Do items first, then by date
      myFeedback.sort((a, b) => {
        if (a.status === 'To-Do' && b.status !== 'To-Do') return -1;
        if (b.status === 'To-Do' && a.status !== 'To-Do') return 1;
        return new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime();
      });
      setAssignedFeedback(myFeedback);
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
        case 'Pending Supervisor Action':
        case 'Pending AM Review':
        case 'Pending Manager Acknowledgement':
            return 'destructive';
        case 'Pending Employee Acknowledgement':
            return 'secondary';
        default: return 'secondary';
    }
  }

  // Special handling for employee acknowledgement
  if (role === 'Employee') {
      const ackItems = assignedFeedback.filter(f => f.status === 'Pending Employee Acknowledgement');
      return (
           <div className="p-4 md:p-8">
              <Card>
                  <CardHeader>
                      <CardTitle className="text-3xl font-bold font-headline mb-2 text-foreground">
                          <MessageCircleQuestion className="inline-block mr-3 h-8 w-8" /> Acknowledgements
                      </CardTitle>
                      <CardDescription className="text-lg text-muted-foreground">
                          Please review the following items and confirm if your concern has been addressed.
                      </CardDescription>
                  </CardHeader>
                  <CardContent>
                      {ackItems.length === 0 ? (
                           <div className="text-center py-12 border-2 border-dashed rounded-lg">
                              <p className="text-muted-foreground text-lg">You have no pending acknowledgements.</p>
                          </div>
                      ) : (
                          <div className="space-y-4">
                              {ackItems.map(item => (
                                  <Card key={item.trackingId} className="p-4">
                                      <CardTitle>{item.subject}</CardTitle>
                                      <CardDescription className="mt-2">Your supervisor, {item.supervisor}, has provided the following update regarding your concern:</CardDescription>
                                      <blockquote className="mt-2 p-4 bg-muted/50 border-l-4 rounded-md whitespace-pre-wrap">
                                          {item.supervisorUpdate}
                                      </blockquote>
                                      <div className="mt-4">
                                        <Link href={`/acknowledge/${item.trackingId}`}>
                                            <Button>Respond to Update</Button>
                                        </Link>
                                      </div>
                                  </Card>
                              ))}
                          </div>
                      )}
                  </CardContent>
              </Card>
          </div>
      )
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
          {assignedFeedback.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed rounded-lg">
              <p className="text-muted-foreground text-lg">Your action item list is empty.</p>
              <p className="text-sm text-muted-foreground mt-2">
                New cases assigned to you will appear here.
              </p>
            </div>
          ) : (
                <Accordion type="single" collapsible className="w-full" defaultValue={assignedFeedback[0]?.trackingId}>
                {assignedFeedback.map((feedback) => {
                    const config = criticalityConfig[feedback.criticality || 'Low'];
                    const Icon = config?.icon || Info;
                    return (
                    <AccordionItem value={feedback.trackingId} key={feedback.trackingId}>
                        <AccordionTrigger>
                        <div className="flex justify-between items-center w-full pr-4">
                            <div className="flex items-center gap-4 flex-1 min-w-0">
                                <Badge variant={config?.badge as any || 'secondary'}>{feedback.criticality || 'N/A'}</Badge>
                                <span className="font-medium text-left truncate">{feedback.subject}</span>
                            </div>
                            <div className="flex items-center gap-4 ml-4">
                                 <Badge variant={getStatusVariant(feedback.status)}>{feedback.status || 'N/A'}</Badge>
                                <span className="text-sm text-muted-foreground font-normal hidden md:inline-block">
                                    Assigned {formatDistanceToNow(new Date(feedback.auditTrail?.find(a => a.event === 'Assigned' || a.event === 'To-Do List Created')?.timestamp || feedback.submittedAt), { addSuffix: true })}
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
                                            <span>AI Analysis: {feedback.criticality}</span>
                                        </div>
                                        <p><span className="font-semibold">Summary:</span> {feedback.summary}</p>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-base">Original Submission</Label>
                                        <p className="whitespace-pre-wrap text-base text-muted-foreground p-4 border rounded-md bg-muted/50">{feedback.message}</p>
                                    </div>
                                </>
                             )}

                            {feedback.auditTrail && <AuditTrail trail={feedback.auditTrail} />}

                            <ActionPanel feedback={feedback} onUpdate={fetchFeedback} />

                            <div className="text-xs text-muted-foreground/80 pt-4 border-t">
                                Tracking ID: <code className="font-mono">{feedback.trackingId}</code>
                            </div>
                        </AccordionContent>
                    </AccordionItem>
                    )
                })}
                </Accordion>
          )}
        </CardContent>
      </Card>
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

    if (!role || (!availableRolesForAssignment.includes(role) && role !== 'Employee')) {
         return (
            <DashboardLayout role={role!} onSwitchRole={setRole}>
                <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] text-center p-4">
                  <Card className="max-w-md">
                      <CardHeader>
                          <CardTitle>Access Denied</CardTitle>
                          <CardDescription>You do not have permission to view this page.</CardDescription>
                      </CardHeader>
                      <CardContent>
                          <p>This page is restricted to roles with assigned action items.</p>
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
