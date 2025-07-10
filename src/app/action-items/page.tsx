
"use client";

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { getAllFeedback, Feedback, AuditEvent, assignFeedback, addFeedbackUpdate } from '@/services/feedback-service';
import { format, formatDistanceToNow } from 'date-fns';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ListTodo, ShieldAlert, AlertTriangle, Info, CheckCircle, Clock, User, MessageSquare, Send, ChevronsRight, FileCheck } from 'lucide-react';
import { useRole, Role, availableRolesForAssignment } from '@/hooks/use-role';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import DashboardLayout from '@/components/dashboard-layout';

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
                                {event.details && <p className="text-sm text-muted-foreground mt-1">{event.details}</p>}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

function ActionPanel({ feedback, onUpdate }: { feedback: Feedback, onUpdate: () => void }) {
    const { role } = useRole();
    const [updateComment, setUpdateComment] = useState('');
    const [assignmentComment, setAssignmentComment] = useState('');
    const [assignTo, setAssignTo] = useState<Role | ''>('');
    const [returnComment, setReturnComment] = useState('');


    const handleAddUpdate = async () => {
        if (!updateComment) return;
        await addFeedbackUpdate(feedback.trackingId, role!, updateComment);
        setUpdateComment('');
        onUpdate();
    }
    
    const handleReturnToHR = async () => {
        await assignFeedback(feedback.trackingId, 'HR Head', role!, returnComment || 'Returning case to HR for review/resolution.');
        setReturnComment('');
        onUpdate();
    }
    
    const handleAssign = async () => {
        if (!assignTo) return;
        await assignFeedback(feedback.trackingId, assignTo as Role, role!, assignmentComment);
        setAssignTo('');
        setAssignmentComment('');
        onUpdate();
    }


    if (feedback.status === 'Resolved') return null;

    return (
        <div className="p-4 border-t mt-4 space-y-6">
            <Label className="text-base font-semibold">Case Management</Label>
            
            <div className="p-4 border rounded-lg bg-background space-y-3">
                <Label className="font-medium">Add Update</Label>
                <Textarea 
                    placeholder="Provide an update on the investigation or actions taken..."
                    value={updateComment}
                    onChange={(e) => setUpdateComment(e.target.value)}
                />
                <Button onClick={handleAddUpdate} disabled={!updateComment}>Add Update</Button>
            </div>
            
            <div className="p-4 border rounded-lg bg-background space-y-3">
                <Label className="font-medium">Re-assign Case</Label>
                 <Select value={assignTo} onValueChange={(val) => setAssignTo(val as Role)}>
                    <SelectTrigger>
                        <SelectValue placeholder="Select a role to assign..." />
                    </SelectTrigger>
                    <SelectContent>
                        {availableRolesForAssignment.map(r => <SelectItem key={r} value={r} disabled={r === role}>{r}</SelectItem>)}
                    </SelectContent>
                </Select>
                <Textarea 
                    placeholder="Add an assignment note (optional)..."
                    value={assignmentComment}
                    onChange={(e) => setAssignmentComment(e.target.value)}
                />
                <Button onClick={handleAssign} disabled={!assignTo}>Assign</Button>
            </div>


            <div className="p-4 border rounded-lg bg-background space-y-3">
                <Label className="font-medium">Return to HR Head</Label>
                <Textarea 
                    placeholder="Add a final comment before returning the case (optional)..."
                    value={returnComment}
                    onChange={(e) => setReturnComment(e.target.value)}
                />
                <Button onClick={handleReturnToHR} variant="secondary">Mark as Ready for HR Review</Button>
            </div>
        </div>
    );
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
      const myFeedback = allFeedback.filter(f => f.assignedTo === role && f.status === 'In Progress');
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
    window.addEventListener('complaintsUpdated', handleStorageChange);

    return () => {
        window.removeEventListener('storage', handleStorageChange);
        window.removeEventListener('complaintsUpdated', handleStorageChange);
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

  const getStatusVariant = (status?: string) => {
    switch(status) {
        case 'Resolved': return 'success';
        case 'In Progress': return 'secondary';
        default: return 'default';
    }
  }

  return (
    <div className="p-4 md:p-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl font-bold font-headline mb-2 text-foreground">
            <ListTodo className="inline-block mr-3 h-8 w-8" /> Action Items
          </CardTitle>
           <CardDescription className="text-lg text-muted-foreground">
            Cases assigned to you for investigation and action.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {assignedFeedback.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground text-lg">Your action item list is empty.</p>
              <p className="text-sm text-muted-foreground mt-2">
                New cases assigned to you by HR will appear here.
              </p>
            </div>
          ) : (
             <TooltipProvider>
                <Accordion type="single" collapsible className="w-full">
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
                                <span className="text-sm text-muted-foreground font-normal hidden md:inline-block">
                                    Assigned {formatDistanceToNow(new Date(feedback.auditTrail?.find(a => a.event === 'Assigned' && a.details?.includes(role || ''))?.timestamp || feedback.submittedAt), { addSuffix: true })}
                                </span>
                            </div>
                        </div>
                        </AccordionTrigger>
                        <AccordionContent className="space-y-6 pt-4">
                            <div className={cn("p-4 rounded-lg border space-y-3", config?.color || 'bg-blue-500/20 text-blue-500')}>
                                 <div className="flex items-center gap-2 font-bold">
                                    <Icon className="h-5 w-5" />
                                    <span>AI Analysis: {feedback.criticality}</span>
                                 </div>
                                 <p><span className="font-semibold">Summary:</span> {feedback.summary}</p>
                                 <p><span className="font-semibold">Reasoning:</span> {feedback.criticalityReasoning}</p>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-base">Original Submission</Label>
                                <p className="whitespace-pre-wrap text-base text-muted-foreground p-4 border rounded-md bg-muted/50">{feedback.message}</p>
                            </div>

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
            </TooltipProvider>
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

    if (!role || !availableRolesForAssignment.includes(role)) {
         return (
            <DashboardLayout role={role!} onSwitchRole={setRole}>
                <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] text-center p-4">
                  <Card className="max-w-md">
                      <CardHeader>
                          <CardTitle>Access Denied</CardTitle>
                          <CardDescription>You do not have permission to view this page.</CardDescription>
                      </CardHeader>
                      <CardContent>
                          <p>This page is restricted to Manager, Team Lead, and AM roles.</p>
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
