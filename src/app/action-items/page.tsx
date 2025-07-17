

"use client";

import { useState, useEffect, useCallback, useRef, ChangeEvent } from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { getAllFeedback, Feedback, AuditEvent, submitSupervisorUpdate, toggleActionItemStatus, resolveFeedback, requestIdentityReveal, addFeedbackUpdate, submitCollaborativeResolution, submitFinalDisposition, submitHrRetaliationResponse } from '@/services/feedback-service';
import { OneOnOneHistoryItem, getOneOnOneHistory, submitAmCoachingNotes, submitManagerResolution, submitHrResolution, submitFinalHrDecision, submitAmDirectResponse } from '@/services/feedback-service';
import type { CriticalCoachingInsight } from '@/ai/schemas/one-on-one-schemas';
import { format, formatDistanceToNow } from 'date-fns';
import { Label } from '@/components/ui/label';
import { Button, buttonVariants } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ListTodo, ShieldAlert, AlertTriangle, Info, CheckCircle, Clock, User, MessageSquare, Send, ChevronsRight, FileCheck, UserX, ShieldCheck as ShieldCheckIcon, FolderClosed, MessageCircleQuestion, UserPlus, FileText, Loader2, Link as LinkIcon, Paperclip, Users, Briefcase, ExternalLink, GitMerge, ChevronDown, Flag, UserCog } from 'lucide-react';
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
import { Input } from '@/components/ui/input';

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
    'Identity Reveal Requested': UserX,
    'Identity Revealed': User,
    'User acknowledged manager\'s assurance message': CheckCircle,
    'Identity Reveal Declined; Escalated to HR': ShieldCheckIcon,
    'Employee Accepted Resolution': CheckCircle,
    'Employee Escalated Concern': AlertTriangle,
    'HR Resolution Submitted': ShieldCheckIcon,
    'Final Disposition Required': ShieldAlert,
    'Final Disposition': FileCheck,
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

function ToDoPanel({ feedback, onUpdate }: { feedback: Feedback, onUpdate: () => void }) {
    const { toast } = useToast();
    const allItemsCompleted = feedback.actionItems?.every(item => item.status === 'completed');

    const handleToggle = async (actionItemId: string) => {
        await toggleActionItemStatus(feedback.trackingId, actionItemId);
        onUpdate();
    }
    
    const handleResolve = async () => {
        if (!feedback.assignedTo || feedback.assignedTo.length === 0) return;
        await resolveFeedback(feedback.trackingId, feedback.assignedTo[0], "All action items completed.");
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

function EscalationWidget({ item, onUpdate, title, titleIcon: TitleIcon, titleColor, bgColor, borderColor }: { item: OneOnOneHistoryItem, onUpdate: () => void, title: string, titleIcon: React.ElementType, titleColor: string, bgColor: string, borderColor: string }) {
    const insight = item.analysis.criticalCoachingInsight as CriticalCoachingInsight;
    const { toast } = useToast();
    const { role } = useRole();
    const [action, setAction] = useState<'coach' | 'address' | null>(null);
    const [actionNotes, setActionNotes] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const isManagerWidget = role === 'Manager';
    const [resolutionNotes, setResolutionNotes] = useState('');
    const [isSubmittingManager, setIsSubmittingManager] = useState(false);

    const handleAmActionSubmit = async () => {
        if (!actionNotes || !role) return;

        setIsSubmitting(true);
        try {
            if (action === 'coach') {
                await submitAmCoachingNotes(item.id, role, actionNotes);
                toast({ title: "Coaching Notes Submitted", description: "The supervisor has been notified to retry the 1-on-1." });
            } else if (action === 'address') {
                await submitAmDirectResponse(item.id, role, actionNotes);
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
        if (!resolutionNotes || !role) return;
        setIsSubmittingManager(true);
        try {
            await submitManagerResolution(item.id, role, resolutionNotes);
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
        <div className="space-y-6">
             <div className="space-y-4">
                {renderAuditEntry("Critical Insight Identified", "Initial AI Insight", insight.summary, "bg-red-500/10 border-red-500/20", "text-red-700 dark:text-red-500")}
                {renderAuditEntry("Supervisor Responded", `${item.supervisorName}'s (TL) Response`, insight.supervisorResponse, "bg-muted/80", "text-foreground")}
                {renderAuditEntry("Employee Acknowledged", `${item.employeeName}'s (Employee) Acknowledgement`, insight.auditTrail?.find(e => e.event === 'Employee Acknowledged' && e.actor === item.employeeName)?.details, "bg-blue-500/10 border-blue-500/20", "text-blue-700 dark:text-blue-500")}
                
                {isManagerWidget && renderAuditEntry("AM Coaching Notes", "AM Coaching Notes", undefined, "bg-orange-500/10 border-orange-500/20", "text-orange-700 dark:text-orange-500")}
                {isManagerWidget && renderAuditEntry("AM Responded to Employee", "AM Response to Employee", insight.auditTrail?.find(e => e.event === 'AM Responded to Employee')?.details, "bg-orange-500/10 border-orange-500/20", "text-orange-700 dark:text-orange-500")}

                {isManagerWidget && renderAuditEntry("Supervisor Retry Action", `${item.supervisorName}'s (TL) Retry Notes`, undefined, "bg-muted/80", "text-foreground")}
                {isManagerWidget && renderAuditEntry("Employee Acknowledged", `Final Employee Acknowledgement`, insight.employeeAcknowledgement, "bg-blue-500/10 border-blue-500/20", "text-blue-700 dark:text-blue-500")}
            </div>
        
            <div className={`${bgColor} p-4 rounded-lg border ${borderColor} flex flex-col items-start gap-4`}>
                <Label className={`font-semibold text-base ${titleColor}`}>Your Action</Label>
                
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
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
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
            </div>
        </div>
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
        if (!resolutionNotes || !role) return;
        setIsSubmitting(true);
        try {
            await submitHrResolution(item.id, role, resolutionNotes);
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
        if (!finalAction || !finalActionNotes || !role) return;
        setIsSubmittingFinal(true);
        try {
            await submitFinalHrDecision(item.id, role, finalAction, finalActionNotes);
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
        <div className="space-y-6">
            <div className="space-y-4">
                {renderAuditEntry("Critical Insight Identified", "Initial AI Insight", insight.summary, "bg-red-500/10 border-red-500/20", "text-red-700 dark:text-red-500")}
                {renderAuditEntry("Supervisor Responded", `${item.supervisorName}'s (TL) Response`, insight.supervisorResponse, "bg-muted/80", "text-foreground")}
                {renderAuditEntry("Employee Acknowledged", `First Employee Acknowledgement`, insight.auditTrail?.find(e => e.event === 'Employee Acknowledged' && e.actor !== 'HR Head')?.details, "bg-blue-500/10 border-blue-500/20", "text-blue-700 dark:text-blue-500")}
                {renderAuditEntry("AM Coaching Notes", "AM Coaching Notes", undefined, "bg-orange-500/10 border-orange-500/20", "text-orange-700 dark:text-orange-500")}
                {renderAuditEntry("Supervisor Retry Action", `${item.supervisorName}'s (TL) Retry Notes`, undefined, "bg-muted/80", "text-foreground")}
                {renderAuditEntry("Manager Resolution", "Manager's Final Resolution", insight.auditTrail?.find(e => e.event === 'Manager Resolution')?.details, "bg-muted/80", "text-foreground")}
                 {renderAuditEntry("Employee Acknowledged", `Final Employee Acknowledgement`, insight.employeeAcknowledgement, "bg-blue-500/10 border-blue-500/20", "text-blue-700 dark:text-blue-500")}
            </div>
            <div className="bg-black/10 dark:bg-gray-800/50 pt-4 p-4 rounded-lg flex flex-col items-start gap-4">
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
            </div>
        </div>
    );
}

function RetaliationActionPanel({ feedback, onUpdate }: { feedback: Feedback, onUpdate: () => void }) {
    const { role } = useRole();
    const { toast } = useToast();
    const [response, setResponse] = useState('');
    const [isSubmittingResponse, setIsSubmittingResponse] = useState(false);
    const [update, setUpdate] = useState('');
    const [isSubmittingUpdate, setIsSubmittingUpdate] = useState(false);
    const [file, setFile] = useState<File | null>(null);

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleAddUpdate = async () => {
        if (!update || !role) return;
        setIsSubmittingUpdate(true);
        try {
            await addFeedbackUpdate(feedback.trackingId, role, update, file);
            setUpdate('');
            if (document.getElementById('hr-update-file')) {
                (document.getElementById('hr-update-file') as HTMLInputElement).value = '';
            }
            setFile(null);
            toast({ title: "Update Added", description: "Your confidential notes have been added to the case history." });
            onUpdate();
        } catch (error) {
            console.error(error);
            toast({ variant: "destructive", title: "Update Failed" });
        } finally {
            setIsSubmittingUpdate(false);
        }
    };
    
    const handleSubmitResponse = async () => {
        if (!response || !role) return;
        setIsSubmittingResponse(true);
        try {
            await submitHrRetaliationResponse(feedback.trackingId, role, response);
            setResponse('');
            toast({ title: "Response Submitted", description: "The employee has been notified to acknowledge your response." });
            onUpdate();
        } catch (error) {
            console.error(error);
            toast({ variant: "destructive", title: "Submission Failed" });
        } finally {
            setIsSubmittingResponse(false);
        }
    };

    return (
        <div className="p-4 border-t mt-4 space-y-6 bg-background rounded-b-lg">
            <Label className="text-base font-semibold text-destructive">Action Required: Retaliation Claim</Label>
            <p className="text-sm text-muted-foreground">
                A retaliation claim has been filed. Please investigate thoroughly. You can add confidential interim updates that are only visible to you. Once your investigation is complete, submit a final resolution summary to the employee for acknowledgment.
            </p>

            <div className="p-4 border rounded-lg bg-muted/20 space-y-3">
                <Label htmlFor="hr-update" className="font-medium">Add Interim Update (Confidential)</Label>
                <Textarea
                    id="hr-update"
                    placeholder="e.g., 'Met with the alleged party on [Date]. Their statement is...' These notes are for your records and will not be shared."
                    value={update}
                    onChange={(e) => setUpdate(e.target.value)}
                    rows={4}
                />
                 <div className="space-y-2">
                    <Label htmlFor="hr-update-file" className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Paperclip className="h-4 w-4" /> Attach supporting documents (optional)
                    </Label>
                    <Input id="hr-update-file" type="file" onChange={handleFileChange} />
                </div>
                <Button onClick={handleAddUpdate} disabled={!update || isSubmittingUpdate}>
                    {isSubmittingUpdate && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Add Confidential Update
                </Button>
            </div>
            
            <div className="p-4 border rounded-lg bg-muted/20 space-y-3">
                <Label htmlFor="hr-response" className="font-medium">Submit Final Resolution to Employee</Label>
                <Textarea
                    id="hr-response"
                    placeholder="e.g., 'After reviewing the case, we have spoken with all parties involved and have implemented the following corrective actions...'"
                    value={response}
                    onChange={(e) => setResponse(e.target.value)}
                    rows={4}
                />
                <Button variant="destructive" onClick={handleSubmitResponse} disabled={!response || isSubmittingResponse}>
                    {isSubmittingResponse && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
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

function ActionPanel({ item, onUpdate }: { item: Feedback | OneOnOneHistoryItem, onUpdate: () => void }) {
    const { role } = useRole();
    const [supervisorUpdate, setSupervisorUpdate] = useState('');
    const { toast } = useToast();

    const handleSupervisorUpdate = async (trackingId: string) => {
        if (!supervisorUpdate || !role) return;
        await submitSupervisorUpdate(trackingId, role, supervisorUpdate);
        setSupervisorUpdate('');
        toast({ title: "Update Submitted", description: "The employee has been notified to acknowledge your response." });
        onUpdate();
    }
    
    // Render widget for 1-on-1 Escalations
    if ('analysis' in item) {
        const insight = item.analysis.criticalCoachingInsight;
        if (!insight) return null;
        
        let widgetProps;
        if (role === 'AM' && insight.status === 'pending_am_review') {
             widgetProps = { title: "1-on-1 Escalation", titleIcon: AlertTriangle, titleColor: "text-orange-600 dark:text-orange-500", bgColor: "bg-orange-500/10", borderColor: "border-orange-500/20" };
        } else if (role === 'Manager' && insight.status === 'pending_manager_review') {
             widgetProps = { title: "1-on-1 Escalation", titleIcon: Briefcase, titleColor: "text-red-600 dark:text-red-500", bgColor: "bg-red-500/10", borderColor: "border-red-500/20" };
        } else if (role === 'HR Head' && (insight.status === 'pending_hr_review' || insight.status === 'pending_final_hr_action')) {
            return <HrReviewWidget item={item} onUpdate={onUpdate} />
        }

        if (widgetProps) {
            return <EscalationWidget item={item} onUpdate={onUpdate} {...widgetProps} />
        }
        return null;
    }

    // Render widgets for standard Feedback items
    const feedback = item;
    
    // Retaliation claims are handled by a specific panel for HR Head
    if (role === 'HR Head' && feedback.status === 'Retaliation Claim') {
        return <RetaliationActionPanel feedback={feedback} onUpdate={onUpdate} />;
    }

    // For anonymous concerns escalated to HR, show the collaborative panel
    if (feedback.status === 'Pending HR Action' && feedback.isAnonymous) {
        return <CollaborativeActionPanel feedback={feedback} onUpdate={onUpdate} />;
    }

    // For identified concerns that were rejected by employee at HR level
    if (role === 'HR Head' && feedback.status === 'Final Disposition Required') {
        return <FinalDispositionPanel feedback={feedback} onUpdate={onUpdate} />;
    }
    
    if (!feedback.assignedTo?.includes(role!)) return null;
    
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
                    <Button onClick={() => handleSupervisorUpdate(feedback.trackingId)} disabled={!supervisorUpdate}>Submit for Acknowledgement</Button>
                </div>
            </div>
        );
    }
    
    return null; // No action panel for other statuses
}

function CaseDetailsModal({ caseItem, open, onOpenChange }: { caseItem: Feedback | OneOnOneHistoryItem | null, open: boolean, onOpenChange: (open: boolean) => void }) {
    if (!caseItem) return null;

    const isOneOnOne = 'analysis' in caseItem;
    const subject = isOneOnOne ? `1-on-1 Escalation: ${caseItem.employeeName} & ${caseItem.supervisorName}` : caseItem.subject;
    const trackingId = isOneOnOne ? caseItem.id : caseItem.trackingId;
    const initialMessage = isOneOnOne ? caseItem.analysis.criticalCoachingInsight?.summary : caseItem.message;
    const auditTrail = isOneOnOne ? caseItem.analysis.criticalCoachingInsight?.auditTrail : caseItem.auditTrail;
    const resolution = isOneOnOne ? caseItem.analysis.criticalCoachingInsight?.supervisorResponse : caseItem.resolution;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl">
                <DialogHeader>
                    <DialogTitle>Case Details: {subject}</DialogTitle>
                    <DialogDescription>
                        Tracking ID: {trackingId}
                    </DialogDescription>
                </DialogHeader>
                <ScrollArea className="max-h-[70vh] pr-6">
                    <div className="space-y-6 py-4">
                        <div className="space-y-2">
                            <Label className="text-base">Initial Submission Context</Label>
                            <p className="whitespace-pre-wrap text-sm text-muted-foreground p-4 border rounded-md bg-muted/50">{initialMessage}</p>
                        </div>
                        {auditTrail && <AuditTrail trail={auditTrail} />}
                        {resolution && (
                             <div className="space-y-2">
                                <Label className="text-base">Final Resolution</Label>
                                <p className="whitespace-pre-wrap text-sm text-muted-foreground p-4 border rounded-md bg-green-500/10">{resolution}</p>
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
  const [toDoItems, setToDoItems] = useState<Feedback[]>([]);
  const [oneOnOneEscalations, setOneOnOneEscalations] = useState<OneOnOneHistoryItem[]>([]);
  const [identifiedConcerns, setIdentifiedConcerns] = useState<Feedback[]>([]);
  const [retaliationClaims, setRetaliationClaims] = useState<Feedback[]>([]);
  
  const [closedToDoItems, setClosedToDoItems] = useState<Feedback[]>([]);
  const [closedOneOnOneEscalations, setClosedOneOnOneEscalations] = useState<OneOnOneHistoryItem[]>([]);
  const [closedIdentifiedConcerns, setClosedIdentifiedConcerns] = useState<Feedback[]>([]);
  const [closedRetaliationClaims, setClosedRetaliationClaims] = useState<Feedback[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const { role } = useRole();
  const accordionRef = useRef<HTMLDivElement>(null);
  const [openAccordionItem, setOpenAccordionItem] = useState<string | undefined>(undefined);
  
  const fetchFeedback = useCallback(async () => {
    if (!role) return;
    setIsLoading(true);
    try {
        const fetchedFeedback = await getAllFeedback();
        const history = await getOneOnOneHistory();

        const activeToDoItems: Feedback[] = [];
        const activeOneOnOneEscalations: OneOnOneHistoryItem[] = [];
        const activeIdentifiedConcerns: Feedback[] = [];
        const activeRetaliationClaims: Feedback[] = [];
        
        const localClosedToDo: Feedback[] = [];
        const localClosed1on1: OneOnOneHistoryItem[] = [];
        const localClosedIdentified: Feedback[] = [];
        const localClosedRetaliation: Feedback[] = [];
        

        const allItems: (Feedback | OneOnOneHistoryItem)[] = [...fetchedFeedback, ...history];

        allItems.forEach(item => {
            let isActionable = false;
            let wasInvolved = false;
            let category: 'todo' | '1on1' | 'concern' | 'retaliation' | 'none' = 'none';

            if ('analysis' in item) { // It's a OneOnOneHistoryItem
                const insight = item.analysis.criticalCoachingInsight;
                if (insight) {
                    const isAmMatch = role === 'AM' && insight.status === 'pending_am_review';
                    const isManagerMatch = role === 'Manager' && insight.status === 'pending_manager_review';
                    const isHrMatch = role === 'HR Head' && (insight.status === 'pending_hr_review' || insight.status === 'pending_final_hr_action');
                    isActionable = isAmMatch || isManagerMatch || isHrMatch;
                    wasInvolved = insight.auditTrail?.some(e => e.actor === role) ?? false;
                    if(isActionable || wasInvolved) category = '1on1';
                }
            } else { // It's a Feedback item
                if (item.source === 'Voice – In Silence') return;
                
                const isAssigned = item.assignedTo?.includes(role as Role);
                const isActiveStatus = item.status !== 'Resolved' && item.status !== 'Closed';
                isActionable = !!isAssigned && isActiveStatus;
                wasInvolved = item.auditTrail?.some(e => e.actor === role) ?? false;

                if (isActionable || wasInvolved) {
                    if (item.status === 'To-Do' || item.auditTrail?.some(e => e.event === 'To-Do List Created')) {
                        category = 'todo';
                    } else if (item.criticality === 'Retaliation Claim' || item.parentCaseId) {
                        category = 'retaliation';
                    } else {
                        category = 'concern';
                    }
                }
            }

            if (isActionable) {
                if (category === '1on1') activeOneOnOneEscalations.push(item as OneOnOneHistoryItem);
                else if (category === 'todo') activeToDoItems.push(item as Feedback);
                else if (category === 'retaliation') activeRetaliationClaims.push(item as Feedback);
                else if (category === 'concern') activeIdentifiedConcerns.push(item as Feedback);
            } else if (wasInvolved) {
                if (category === '1on1') localClosed1on1.push(item as OneOnOneHistoryItem);
                else if (category === 'todo') localClosedToDo.push(item as Feedback);
                else if (category === 'retaliation') localClosedRetaliation.push(item as Feedback);
                else if (category === 'concern') localClosedIdentified.push(item as Feedback);
            }
        });

        const sortFn = (a: Feedback | OneOnOneHistoryItem, b: Feedback | OneOnOneHistoryItem) => {
            const dateA = 'submittedAt' in a ? new Date(a.submittedAt) : new Date(a.date);
            const dateB = 'submittedAt' in b ? new Date(b.submittedAt) : new Date(b.date);
            return dateB.getTime() - dateA.getTime();
        };
        
        setToDoItems(activeToDoItems.sort(sortFn));
        setOneOnOneEscalations(activeOneOnOneEscalations.sort(sortFn));
        setIdentifiedConcerns(activeIdentifiedConcerns.sort(sortFn));
        setRetaliationClaims(activeRetaliationClaims.sort(sortFn));
        
        setClosedToDoItems(localClosedToDo.sort(sortFn));
        setClosedOneOnOneEscalations(localClosed1on1.sort(sortFn));
        setClosedIdentifiedConcerns(localClosedIdentified.sort(sortFn));
        setClosedRetaliationClaims(localClosedRetaliation.sort(sortFn));

    } catch (error) {
      console.error("Failed to fetch feedback", error);
    } finally {
      setIsLoading(false);
    }
  }, [role]);

  useEffect(() => {
    fetchFeedback();

    const handleStorageChange = () => fetchFeedback();

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('feedbackUpdated', handleStorageChange);

    return () => {
        window.removeEventListener('storage', handleStorageChange);
        window.removeEventListener('feedbackUpdated', handleStorageChange);
    };
  }, [fetchFeedback]);

  const handleScrollToCase = (e: React.MouseEvent, caseId: string) => {
      e.preventDefault();
      const caseElement = accordionRef.current?.querySelector(`#accordion-item-${caseId}`);
      caseElement?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      
      // Use a timeout to ensure the element is visible before trying to click the trigger
      setTimeout(() => {
          const trigger = caseElement?.querySelector('[data-radix-collection-item]');
          if (trigger instanceof HTMLElement) {
              trigger.click();
          }
      }, 300);
  };

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
  
  const renderCategorySection = (
    title: string,
    icon: React.ElementType,
    items: (Feedback | OneOnOneHistoryItem)[]
  ) => {
    if (items.length === 0) return null;
    const Icon = icon;

    return (
        <div className="pt-6">
            <h2 className="text-xl font-semibold mb-4 text-muted-foreground flex items-center gap-3">
               <Icon className="h-6 w-6" /> {title}
            </h2>
            {renderFeedbackList(items)}
        </div>
    );
  };

  const renderFeedbackList = (items: (Feedback | OneOnOneHistoryItem)[]) => {
    return (
        <Accordion 
            type="single" 
            collapsible 
            className="w-full" 
            value={openAccordionItem}
            onValueChange={setOpenAccordionItem}
        >
        {items.map((item) => {
            const isOneOnOne = 'analysis' in item;
            
            const id = isOneOnOne ? item.id : item.trackingId;
            const rawSubject = isOneOnOne ? `1-on-1 Escalation: ${item.employeeName} & ${item.supervisorName}` : item.subject;
            const subject = rawSubject.charAt(0).toUpperCase() + rawSubject.slice(1);
            const status = isOneOnOne ? item.analysis.criticalCoachingInsight?.status : item.status;

            const statusBadge = () => {
              if (isOneOnOne) {
                  const insightStatus = item.analysis.criticalCoachingInsight?.status;
                  switch (insightStatus) {
                      case 'pending_am_review': return <Badge className="bg-orange-500 text-white">AM Review</Badge>;
                      case 'pending_manager_review': return <Badge className="bg-red-700 text-white">Manager Review</Badge>;
                      case 'pending_hr_review':
                      case 'pending_final_hr_action': return <Badge className="bg-black text-white">HR Review</Badge>;
                      case 'resolved': return <Badge variant="success">Resolved</Badge>;
                      default: return <Badge variant="secondary">{insightStatus?.replace(/_/g, ' ')}</Badge>;
                  }
              }
              const feedbackStatus = item.status;
              switch (feedbackStatus) {
                  case 'Resolved': return <Badge variant="success">Resolved</Badge>;
                  case 'To-Do': return <Badge variant="default">To-Do</Badge>;
                  case 'Pending Supervisor Action': return <Badge variant="destructive">Supervisor Action</Badge>;
                  case 'Pending Manager Action': return <Badge variant="destructive">Manager Action</Badge>;
                  case 'Pending Employee Acknowledgment': return <Badge variant="destructive">Employee Ack.</Badge>;
                  case 'Pending HR Action': return <Badge className="bg-black text-white">HR Review</Badge>;
                  case 'Final Disposition Required': return <Badge variant="destructive">Final Disposition</Badge>;
                  case 'Pending Identity Reveal': return <Badge variant="secondary">Reveal Requested</Badge>;
                  case 'Retaliation Claim': return <Badge variant="destructive">Retaliation Claim</Badge>;
                  case 'Closed': return <Badge variant="secondary">Closed</Badge>;
                  default: return <Badge variant="secondary">{feedbackStatus || 'N/A'}</Badge>;
              }
            }


            return (
            <AccordionItem value={id} key={id} id={id}>
                <AccordionTrigger className="w-full px-4 py-3 text-left hover:no-underline [&_svg]:ml-auto">
                    <div className="flex justify-between items-center w-full">
                        <div className="flex items-center gap-4 flex-1 min-w-0">
                            <span className="font-medium truncate">{subject}</span>
                        </div>
                        <div className="flex items-center gap-4 pl-4 mr-4">
                            <span 
                                className="text-xs text-muted-foreground font-mono cursor-text"
                                onClick={(e) => { e.stopPropagation(); }}
                            >
                               ID: {id}
                            </span>
                            {statusBadge()}
                        </div>
                    </div>
                </AccordionTrigger>
                <AccordionContent className="space-y-6 pt-4 px-4">
                     {!isOneOnOne && item.parentCaseId && (
                         <div className="space-y-2">
                             <a
                                href="#"
                                onClick={(e) => handleScrollToCase(e, item.parentCaseId!)}
                                className="text-sm italic text-muted-foreground hover:text-primary transition-colors"
                            >
                                Parent Case: {item.parentCaseId}
                            </a>
                        </div>
                     )}
                     {!isOneOnOne && item.status !== 'To-Do' && (
                        <>
                            <div className="space-y-2">
                                <Label className="text-base">Original Submission Context</Label>
                                <p className="whitespace-pre-wrap text-sm text-muted-foreground p-4 border rounded-md bg-muted/50">{item.message}</p>
                            </div>
                        </>
                     )}

                    { !isOneOnOne && item.auditTrail && <AuditTrail trail={item.auditTrail} />}
                    { isOneOnOne && item.analysis.criticalCoachingInsight?.auditTrail && <AuditTrail trail={item.analysis.criticalCoachingInsight.auditTrail} /> }

                    <ActionPanel item={item} onUpdate={fetchFeedback} />
                    
                    {!isOneOnOne && item.resolution && (
                         <div className="space-y-2">
                            <Label className="text-base">Final Resolution</Label>
                            <p className="whitespace-pre-wrap text-sm text-muted-foreground p-4 border rounded-md bg-green-500/10">{item.resolution}</p>
                        </div>
                    )}
                </AccordionContent>
            </AccordionItem>
            )
        })}
        </Accordion>
    );
  }

  const allActiveItemsCount = toDoItems.length + oneOnOneEscalations.length + identifiedConcerns.length + retaliationClaims.length;
  const allClosedItemsCount = closedToDoItems.length + closedOneOnOneEscalations.length + closedIdentifiedConcerns.length + closedRetaliationClaims.length;

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
          {allActiveItemsCount === 0 ? (
            <div className="text-center py-12 border-2 border-dashed rounded-lg">
              <p className="text-muted-foreground text-lg">Your active action item list is empty.</p>
              <p className="text-sm text-muted-foreground mt-2">
                New cases assigned to you will appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
                {renderCategorySection("To-Do Lists", ListTodo, toDoItems)}
                {renderCategorySection("1-on-1 Escalations", UserCog, oneOnOneEscalations)}
                {renderCategorySection("Identified Concerns", Users, identifiedConcerns)}
                {renderCategorySection("Retaliation Claims", Flag, retaliationClaims)}
            </div>
          )}
        </CardContent>
      </Card>
      
      {allClosedItemsCount > 0 && (
          <div className="mt-8">
            <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="closed-items" className="border rounded-lg">
                    <AccordionTrigger className="flex w-full items-center justify-between px-4 py-3 hover:no-underline [&_svg]:ml-auto">
                        <div className="flex items-center gap-3 text-lg font-semibold text-muted-foreground">
                           <FolderClosed />
                           Closed Items
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="p-2 space-y-4">
                        {closedToDoItems.length > 0 && (
                            <div>
                                <h3 className="text-lg font-semibold mb-2 text-muted-foreground flex items-center gap-3 px-2"><ListTodo className="h-5 w-5" />To-Do Lists</h3>
                                {renderFeedbackList(closedToDoItems)}
                            </div>
                        )}
                        {closedOneOnOneEscalations.length > 0 && (
                             <div>
                                <h3 className="text-lg font-semibold mb-2 text-muted-foreground flex items-center gap-3 px-2"><UserCog className="h-5 w-5" />1-on-1 Escalations</h3>
                                {renderFeedbackList(closedOneOnOneEscalations)}
                            </div>
                        )}
                        {closedIdentifiedConcerns.length > 0 && (
                             <div>
                                <h3 className="text-lg font-semibold mb-2 text-muted-foreground flex items-center gap-3 px-2"><Users className="h-5 w-5" />Identified Concerns</h3>
                                {renderFeedbackList(closedIdentifiedConcerns)}
                            </div>
                        )}
                        {closedRetaliationClaims.length > 0 && (
                             <div>
                                <h3 className="text-lg font-semibold mb-2 text-muted-foreground flex items-center gap-3 px-2"><Flag className="h-5 w-5" />Retaliation Claims</h3>
                                {renderFeedbackList(closedRetaliationClaims)}
                            </div>
                        )}
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

    