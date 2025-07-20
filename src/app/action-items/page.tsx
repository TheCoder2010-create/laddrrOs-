

"use client";

import { useState, useEffect, useCallback, useRef, ChangeEvent } from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { getAllFeedback, Feedback, AuditEvent, submitSupervisorUpdate, toggleActionItemStatus, resolveFeedback, requestIdentityReveal, addFeedbackUpdate, submitCollaborativeResolution, submitFinalDisposition, submitHrRetaliationResponse, getFeedbackById, requestAnonymousInformation, submitEmployeeFeedbackAcknowledgement, submitAnonymousReply } from '@/services/feedback-service';
import { OneOnOneHistoryItem, getOneOnOneHistory, submitAmCoachingNotes, submitManagerResolution, submitHrResolution, submitFinalHrDecision, submitAmDirectResponse } from '@/services/feedback-service';
import type { CriticalCoachingInsight } from '@/ai/schemas/one-on-one-schemas';
import { format, formatDistanceToNow } from 'date-fns';
import { Label } from '@/components/ui/label';
import { Button, buttonVariants } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ListTodo, ShieldAlert, AlertTriangle, Info, CheckCircle, Clock, User, MessageSquare, Send, ChevronsRight, FileCheck, UserX, ShieldCheck as ShieldCheckIcon, FolderClosed, MessageCircleQuestion, UserPlus, FileText, Loader2, Link as LinkIcon, Paperclip, Users, Briefcase, ExternalLink, GitMerge, ChevronDown, Flag, UserCog, Download } from 'lucide-react';
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
import { downloadAuditTrailPDF } from '@/lib/pdf-generator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

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
    'HR Resolution Submitted': ShieldCheckIcon,
    'Resolved': CheckCircle,
    'Identity Reveal Requested': UserX,
    'User acknowledged manager\'s assurance message': CheckCircle,
    'Identity Reveal Declined; Escalated to HR': ShieldCheckIcon,
    'Employee Accepted Resolution': CheckCircle,
    'Employee Escalated Concern': AlertTriangle,
    'Final Disposition Required': ShieldAlert,
    'Final Disposition': FileCheck,
    'Retaliation Claim Submitted': Flag,
    'Retaliation Claim Filed': Flag,
    'Update Added': MessageSquare,
    'Information Requested': MessageCircleQuestion,
    'Anonymous User Responded': MessageSquare,
    'default': Info,
}

function AuditTrail({ trail, handleViewCaseDetails, onDownload }: { trail: AuditEvent[], handleViewCaseDetails: (e: React.MouseEvent, caseId: string) => void, onDownload: () => void }) {
    if (!trail || trail.length === 0) return null;

    return (
        <div className="space-y-2">
            <div className="flex justify-between items-center">
                <Label className="text-base">Case History</Label>
                <Button variant="ghost" size="sm" onClick={onDownload}>
                    <Download className="mr-2 h-4 w-4" />
                    Download PDF
                </Button>
            </div>
            <div className="relative p-4 border rounded-md bg-muted/50">
                <div className="absolute left-8 top-8 bottom-8 w-px bg-border -translate-x-1/2"></div>
                <div className="space-y-4">
                    {trail.map((event, index) => {
                        const Icon = auditEventIcons[event.event as keyof typeof auditEventIcons] || auditEventIcons.default;
                        
                        const renderDetails = () => {
                            if (!event.details) return null;

                            const parentRegex = /(Claim submitted for case )([a-f0-9-]+)/;
                            const childRegex = /(New Case ID: )([a-f0-9-]+)/;
                            
                            const parentMatch = event.details.match(parentRegex);
                            const childMatch = event.details.match(childRegex);

                            if (parentMatch || childMatch) {
                                return (
                                    <div className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">
                                        {event.details.split('\n').map((line, i) => {
                                            const lineParentMatch = line.match(/(Claim submitted for case )([a-f0-9-]+)/);
                                            const lineChildMatch = line.match(/(New Case ID: )([a-f0-9-]+)/);
                                            
                                            if (lineParentMatch) {
                                                const parentId = lineParentMatch[2];
                                                return <div key={i}>Claim submitted for case <a href="#" onClick={(e) => handleViewCaseDetails(e, parentId)} className="font-mono text-primary hover:underline">{parentId}</a>.</div>
                                            }
                                            if (lineChildMatch) {
                                                const childId = lineChildMatch[2];
                                                return <div key={i}>New Case ID: <a href="#" onClick={(e) => handleViewCaseDetails(e, childId)} className="font-mono text-primary hover:underline">{childId}</a></div>
                                            }
                                            return <div key={i}>{line}</div>
                                        })}
                                    </div>
                                );
                            }

                            return <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">{event.details}</p>;
                        };

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
                                    {renderDetails()}
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
                            placeholder="Document your actions here..."
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
                                ? "Log your coaching notes..."
                                : "Describe your conversation..."
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
                                placeholder="Document your final actions here..."
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
                                     placeholder={`Provide reasoning for selecting this action...`}
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
                    placeholder="Add confidential notes for your records..."
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
                    placeholder="Provide your final resolution summary..."
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
                    placeholder="Add your notes here..."
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
                        placeholder="Provide your final resolution summary..."
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
    const [update, setUpdate] = useState('');
    const [question, setQuestion] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleRequestIdentity = async () => {
        if (!revealReason || !role) return;
        setIsSubmitting(true);
        try {
            await requestIdentityReveal(feedback.trackingId, role, revealReason);
            setRevealReason('');
            toast({ title: "Request Submitted", description: "The user has been notified of your request."});
            onUpdate();
        } finally {
            setIsSubmitting(false);
        }
    }

    const handleResolveDirectly = async () => {
        if (!resolution || !role) return;
        setIsSubmitting(true);
        try {
            await submitSupervisorUpdate(feedback.trackingId, role, resolution);
            setResolution('');
            toast({ title: "Resolution Submitted", description: "The anonymous user has been notified and must acknowledge your response."});
            onUpdate();
        } finally {
            setIsSubmitting(false);
        }
    }
    
    const handleAddUpdate = async () => {
        if (!update || !role) return;
        setIsSubmitting(true);
        try {
            await addFeedbackUpdate(feedback.trackingId, role, update);
            setUpdate('');
            toast({ title: "Update Added", description: "Your notes have been added to the case history." });
            onUpdate();
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const handleRequestInformation = async () => {
        if (!question || !role) return;
        setIsSubmitting(true);
        try {
            await requestAnonymousInformation(feedback.trackingId, role, question);
            setQuestion('');
            toast({ title: "Question Submitted", description: "The user has been notified to provide more information." });
            onUpdate();
        } finally {
            setIsSubmitting(false);
        }
    };
    
    return (
        <div className="p-4 border-t mt-4 space-y-4 bg-background rounded-b-lg">
            <Label className="text-base font-semibold">Your Action Required</Label>
            
            {feedback.status === 'Pending Anonymous Reply' ? (
                 <div className="p-4 border rounded-lg bg-blue-500/10 text-blue-700 dark:text-blue-400">
                    <p className="font-semibold flex items-center gap-2"><Clock className="h-4 w-4" /> Awaiting User Response</p>
                    <p className="text-sm mt-1">You have requested more information. This case will reappear in your queue once the user has responded.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="p-4 border rounded-lg bg-muted/20 space-y-3 flex flex-col">
                             <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Label className="font-medium flex items-center gap-2 cursor-help">
                                            Add Updates <Info className="h-4 w-4 text-muted-foreground" />
                                        </Label>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>Log your investigation steps or notes.</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                            <Textarea 
                                id="interim-update"
                                placeholder="Add your notes here..."
                                value={update}
                                onChange={(e) => setUpdate(e.target.value)}
                                rows={3}
                                className="flex-grow"
                            />
                            <Button onClick={handleAddUpdate} disabled={!update || isSubmitting} variant="secondary" className="mt-auto w-full">
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Add Confidential Update
                            </Button>
                        </div>
                        
                        <div className="p-4 border rounded-lg bg-muted/20 space-y-3 flex flex-col">
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Label className="font-medium flex items-center gap-2 cursor-help">
                                            Additional Information <Info className="h-4 w-4 text-muted-foreground" />
                                        </Label>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>Ask a clarifying question. The user will see this and can respond anonymously.</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                            <Textarea 
                                id="ask-question"
                                placeholder="Ask your question here..."
                                value={question}
                                onChange={(e) => setQuestion(e.target.value)}
                                rows={3}
                                className="flex-grow"
                            />
                            <Button onClick={handleRequestInformation} disabled={!question || isSubmitting} className="mt-auto w-full">
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Send Question
                            </Button>
                        </div>

                        <div className="p-4 border rounded-lg bg-muted/20 space-y-3 flex flex-col">
                             <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Label className="font-medium flex items-center gap-2 cursor-help">
                                            Request Identity <Info className="h-4 w-4 text-muted-foreground" />
                                        </Label>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>If you cannot proceed, explain why you need their identity.</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                            <Textarea 
                                id="revealReason"
                                placeholder="Explain your reasoning here..."
                                value={revealReason}
                                onChange={(e) => setRevealReason(e.target.value)}
                                rows={3}
                                className="flex-grow"
                            />
                             <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button disabled={!revealReason || isSubmitting} className="mt-auto w-full">
                                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Request Identity Reveal
                                    </Button>
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
                    
                    <div className="p-4 border rounded-lg bg-muted/20 space-y-3">
                         <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Label className="font-medium flex items-center gap-2 cursor-help">
                                        Resolution <Info className="h-4 w-4 text-muted-foreground" />
                                    </Label>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>Propose a resolution for this case. This will be sent to the anonymous user for their final acknowledgement or escalation.</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                        <Textarea 
                            id="resolve-directly"
                            placeholder="Provide your resolution summary..."
                            value={resolution}
                            onChange={(e) => setResolution(e.target.value)}
                            rows={4}
                        />
                        <Button onClick={handleResolveDirectly} disabled={!resolution || isSubmitting} className="mt-2">
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Submit for Acknowledgement
                        </Button>
                    </div>
                </div>
            )}
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
                        placeholder="Provide reasoning for your selection..."
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

function ActionPanel({ item, onUpdate, handleViewCaseDetails }: { item: Feedback | OneOnOneHistoryItem, onUpdate: () => void, handleViewCaseDetails: (e: React.MouseEvent, caseId: string) => void }) {
    const { role } = useRole();
    const [resolutionSummary, setResolutionSummary] = useState('');
    const [interimUpdate, setInterimUpdate] = useState('');
    const { toast } = useToast();

    const handleSupervisorUpdate = async (trackingId: string, isFinal: boolean) => {
        const comment = isFinal ? resolutionSummary : interimUpdate;
        if (!comment || !role) return;

        if (isFinal) {
            await submitSupervisorUpdate(trackingId, role, comment);
            setResolutionSummary('');
            toast({ title: "Resolution Submitted", description: "The employee has been notified to acknowledge your response." });
        } else {
            await addFeedbackUpdate(trackingId, role, comment);
            setInterimUpdate('');
            toast({ title: "Update Added", description: "Your notes have been added to the case history." });
        }
        onUpdate();
    }
    
    // Render widget for 1-on-1 Escalations
    if ('analysis' in item) {
        const insight = item.analysis.criticalCoachingInsight;
        if (!insight) return null;
        
        if (role === 'HR Head' && (insight.status === 'pending_hr_review' || insight.status === 'pending_final_hr_action')) {
            return <HrReviewWidget item={item} onUpdate={onUpdate} />
        }
        
        let widgetProps;
        if (role === 'AM' && insight.status === 'pending_am_review') {
             widgetProps = { title: "1-on-1 Escalation", titleIcon: AlertTriangle, titleColor: "text-orange-600 dark:text-orange-500", bgColor: "bg-orange-500/10", borderColor: "border-orange-500/20" };
        } else if (role === 'Manager' && insight.status === 'pending_manager_review') {
             widgetProps = { title: "1-on-1 Escalation", titleIcon: Briefcase, titleColor: "text-red-600 dark:text-red-500", bgColor: "bg-red-500/10", borderColor: "border-red-500/20" };
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
    if (feedback.isAnonymous && feedback.status === 'Pending HR Action' && (role === 'Manager' || role === 'HR Head')) {
        return <CollaborativeActionPanel feedback={feedback} onUpdate={onUpdate} />;
    }

    // For identified concerns that were rejected by employee at HR level
    if (role === 'HR Head' && feedback.status === 'Final Disposition Required') {
        return <FinalDispositionPanel feedback={feedback} onUpdate={onUpdate} />;
    }
    
    if (feedback.status === 'To-Do' && feedback.assignedTo?.includes(role!)) {
        return <ToDoPanel feedback={feedback} onUpdate={onUpdate} />
    }
    
    if (feedback.isAnonymous && (feedback.status === 'Pending Manager Action' || feedback.status === 'Pending Anonymous Reply') && feedback.assignedTo?.includes(role!)) {
        return <AnonymousConcernPanel feedback={feedback} onUpdate={onUpdate} />;
    }

    // This handles all identified concerns for TL, AM, Manager, and HR Head
    const isEscalatedConcern = 
        feedback.status === 'Pending Supervisor Action' ||
        feedback.status === 'Pending Manager Action' ||
        (feedback.status === 'Pending HR Action' && !feedback.isAnonymous);
        
    if (isEscalatedConcern && feedback.assignedTo?.includes(role!)) {
        let title = 'Your Action Required';
        let description = "A concern requires your attention. You can add interim updates or submit a final resolution for the employee's acknowledgment.";

        if (feedback.status === 'Pending Manager Action') {
            title = 'Escalation: Review Required';
            description = `This concern has been escalated to you as the ${role}. Please review the case history, add updates as needed, and provide your final resolution summary.`;
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
                    <Label htmlFor={`interim-update-${feedback.trackingId}`} className="font-medium">Add Interim Update (Private)</Label>
                    <p className="text-xs text-muted-foreground">Log actions taken or conversation notes. This will be added to the audit trail but NOT sent to the employee yet.</p>
                    <Textarea 
                        id={`interim-update-${feedback.trackingId}`}
                        placeholder="Add your notes here..."
                        value={interimUpdate}
                        onChange={(e) => setInterimUpdate(e.target.value)}
                        rows={3}
                    />
                    <Button onClick={() => handleSupervisorUpdate(feedback.trackingId, false)} disabled={!interimUpdate}>Add Update to History</Button>
                </div>

                <div className="p-4 border rounded-lg bg-muted/20 space-y-3">
                    <Label htmlFor={`final-resolution-${feedback.trackingId}`} className="font-medium">Submit Final Resolution</Label>
                    <p className="text-xs text-muted-foreground">Provide the final summary of actions taken. This WILL be sent to the employee for their acknowledgement.</p>
                    <Textarea 
                        id={`final-resolution-${feedback.trackingId}`}
                        placeholder="Provide your resolution summary..."
                        value={resolutionSummary}
                        onChange={(e) => setResolutionSummary(e.target.value)}
                        rows={4}
                    />
                    <Button onClick={() => handleSupervisorUpdate(feedback.trackingId, true)} disabled={!resolutionSummary}>Submit for Acknowledgement</Button>
                </div>
            </div>
        );
    }
    
    return null; // No action panel for other statuses
}

function CaseDetailsModal({ caseItem, open, onOpenChange, handleViewCaseDetails }: { caseItem: Feedback | OneOnOneHistoryItem | null, open: boolean, onOpenChange: (open: boolean) => void, handleViewCaseDetails: (e: React.MouseEvent, caseId: string) => void }) {
    if (!caseItem) return null;

    const isOneOnOne = 'analysis' in caseItem;
    const subject = isOneOnOne ? `1-on-1 Escalation: ${caseItem.employeeName} & ${caseItem.supervisorName}` : caseItem.subject;
    const trackingId = isOneOnOne ? caseItem.id : caseItem.trackingId;
    const initialMessage = isOneOnOne ? caseItem.analysis.criticalCoachingInsight?.summary || 'N/A' : caseItem.message;
    const trail = isOneOnOne ? (item: OneOnOneHistoryItem) => item.analysis.criticalCoachingInsight?.auditTrail || [] : (item: Feedback) => item.auditTrail || [];
    const finalResolution = isOneOnOne ? caseItem.analysis.criticalCoachingInsight?.auditTrail?.find(e => e.event.includes('Resolution'))?.details : caseItem.resolution;

    const handleDownload = () => {
        const caseDetails = {
            title: subject,
            trackingId,
            initialMessage,
            aiSummary: isOneOnOne ? caseItem.analysis.criticalCoachingInsight?.reason : undefined,
            finalResolution,
            trail: trail(caseItem as any) || [],
        };
        downloadAuditTrailPDF(caseDetails);
    };

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
                            <p className="whitespace-pre-wrap text-sm text-muted-foreground">{initialMessage}</p>
                        </div>
                        <AuditTrail trail={trail(caseItem as any)} handleViewCaseDetails={handleViewCaseDetails} onDownload={handleDownload}/>
                        {finalResolution && (
                             <div className="space-y-2">
                                <Label className="text-base">Final Resolution</Label>
                                <p className="whitespace-pre-wrap text-sm text-muted-foreground p-4 border rounded-md bg-green-500/10">{finalResolution}</p>
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
  const [anonymousConcerns, setAnonymousConcerns] = useState<Feedback[]>([]);
  const [retaliationClaims, setRetaliationClaims] = useState<Feedback[]>([]);
  
  const [allClosedItems, setAllClosedItems] = useState<(Feedback | OneOnOneHistoryItem)[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const { role } = useRole();
  const accordionRef = useRef<HTMLDivElement>(null);
  const [openAccordionItem, setOpenAccordionItem] = useState<string | undefined>(undefined);
  const [viewingCaseDetails, setViewingCaseDetails] = useState<Feedback | OneOnOneHistoryItem | null>(null);
  
  const fetchFeedback = useCallback(async () => {
    if (!role) return;
    setIsLoading(true);
    try {
        const fetchedFeedback = await getAllFeedback();
        const history = await getOneOnOneHistory();

        const activeToDoItems: Feedback[] = [];
        const activeOneOnOneEscalations: OneOnOneHistoryItem[] = [];
        const activeIdentifiedConcerns: Feedback[] = [];
        const activeAnonymousConcerns: Feedback[] = [];
        const activeRetaliationClaims: Feedback[] = [];
        
        const localAllClosed: (Feedback | OneOnOneHistoryItem)[] = [];

        const allItems: (Feedback | OneOnOneHistoryItem)[] = [...fetchedFeedback, ...history];
        
        const closedStatuses: (FeedbackStatus | CriticalCoachingInsight['status'])[] = ['Resolved', 'Closed', 'resolved'];
        const finalDispositionEvents = ["Assigned to Ombudsman", "Assigned to Grievance Office", "Logged Dissatisfaction & Closed", "Final Disposition"];
        
        const retaliationClaimParentIds = new Set(fetchedFeedback.filter(f => f.parentCaseId).map(f => f.parentCaseId));

        allItems.forEach(item => {
            let isItemClosed = false;
            
            if ('analysis' in item) { // It's a OneOnOneHistoryItem
                const insight = item.analysis.criticalCoachingInsight;
                if (!insight) return;

                const finalDispositionEvent = insight.auditTrail?.find(e => finalDispositionEvents.includes(e.event));
                isItemClosed = closedStatuses.includes(insight.status) || !!finalDispositionEvent;
                
                const isAmMatch = role === 'AM' && insight.status === 'pending_am_review';
                const isManagerMatch = role === 'Manager' && insight.status === 'pending_manager_review';
                const isHrMatch = role === 'HR Head' && (insight.status === 'pending_hr_review' || insight.status === 'pending_final_hr_action');
                
                const isActionable = isAmMatch || isManagerMatch || isHrMatch;
                const wasEverInvolved = insight.auditTrail?.some(e => e.actor === role) ?? false;

                if (isActionable) activeOneOnOneEscalations.push(item);
                else if (isItemClosed && wasEverInvolved) localAllClosed.push(item);

            } else { // It's a Feedback item
                // Exclude cases from "Voice – in Silence" as they are handled on a separate page
                if (item.source === 'Voice – In Silence') return;

                const finalDispositionEvent = item.auditTrail?.find(e => finalDispositionEvents.includes(e.event));
                isItemClosed = closedStatuses.includes(item.status as any) || !!finalDispositionEvent;

                const isActionableForRole = !isItemClosed && (item.assignedTo?.includes(role as Role) ?? false);
                let wasEverInvolved = item.auditTrail?.some(e => e.actor === role) ?? false;

                // For HR Head, if they are reviewing a child retaliation claim, they are "involved" in the parent.
                if (role === 'HR Head' && retaliationClaimParentIds.has(item.trackingId)) {
                    wasEverInvolved = true;
                }

                if (isActionableForRole) {
                    if (item.status === 'To-Do') activeToDoItems.push(item);
                    else if (item.criticality === 'Retaliation Claim') activeRetaliationClaims.push(item);
                    else if (item.isAnonymous) activeAnonymousConcerns.push(item);
                    else activeIdentifiedConcerns.push(item);
                } else if (isItemClosed && (wasEverInvolved || item.isAnonymous)) {
                    localAllClosed.push(item);
                }
            }
        });
        
        const sortFn = (a: Feedback | OneOnOneHistoryItem, b: Feedback | OneOnOneHistoryItem) => {
            const dateA = 'submittedAt' in a ? new Date(a.submittedAt) : new Date(a.date);
            const dateB = 'submittedAt' in b ? new Date(b.submittedAt) : new Date(a.date);
            return dateB.getTime() - dateA.getTime();
        };
        
        setToDoItems(activeToDoItems.sort(sortFn));
        setOneOnOneEscalations(activeOneOnOneEscalations.sort(sortFn));
        setIdentifiedConcerns(activeIdentifiedConcerns.sort(sortFn));
        setAnonymousConcerns(activeAnonymousConcerns.sort(sortFn));
        setRetaliationClaims(activeRetaliationClaims.sort(sortFn));
        setAllClosedItems(localAllClosed.sort(sortFn));

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

  const handleViewCaseDetails = async (e: React.MouseEvent, caseId: string) => {
      e.preventDefault();
      e.stopPropagation();
      
      const allItems: (Feedback | OneOnOneHistoryItem)[] = [
          ...toDoItems, ...oneOnOneEscalations, ...identifiedConcerns, ...anonymousConcerns, ...retaliationClaims, ...allClosedItems
      ];
      
      let caseItem = allItems.find(item => ('analysis' in item ? item.id : item.trackingId) === caseId);

      if (!caseItem) {
         try {
             caseItem = await getFeedbackById(caseId);
         } catch (error) {
             console.error("Could not fetch case details", error);
         }
      }

      if (caseItem) {
          setViewingCaseDetails(caseItem);
      }
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
    items: (Feedback | OneOnOneHistoryItem)[],
    isSevere = false
  ) => {
    if (items.length === 0) return null;
    const Icon = icon;

    return (
        <div className="pt-6">
            <h2 className={cn(
                "text-xl font-semibold mb-4 flex items-center gap-3",
                isSevere ? "text-destructive" : "text-muted-foreground"
            )}>
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
            
            const handleDownload = () => {
                const trail = isOneOnOne ? item.analysis.criticalCoachingInsight?.auditTrail || [] : item.auditTrail || [];
                const initialMessage = isOneOnOne ? item.analysis.criticalCoachingInsight?.summary || 'N/A' : item.message;
                const finalResolution = isOneOnOne ? item.analysis.criticalCoachingInsight?.auditTrail?.find(e => e.event.includes('Resolution'))?.details : item.resolution;
                 const aiSummary = isOneOnOne ? item.analysis.criticalCoachingInsight?.reason : item.summary;

                downloadAuditTrailPDF({
                    title: subject,
                    trackingId: id,
                    initialMessage,
                    trail,
                    aiSummary,
                    finalResolution
                });
            };
            
            const getStatusBadge = () => {
              const auditTrail = isOneOnOne ? item.analysis.criticalCoachingInsight?.auditTrail : item.auditTrail;
              const finalDispositionEvent = auditTrail?.find(e => ["Assigned to Ombudsman", "Assigned to Grievance Office", "Logged Dissatisfaction & Closed", "Final Disposition"].includes(e.event));
              
              if (finalDispositionEvent) {
                  let Icon = FileText;
                  let text = "Closed";
                  if (finalDispositionEvent.event.includes("Ombudsman")) { Icon = UserX; text = "Ombudsman"; }
                  if (finalDispositionEvent.event.includes("Grievance")) { Icon = UserPlus; text = "Grievance"; }
                  
                  return <Badge className="bg-gray-700 text-white flex items-center gap-1.5"><Icon className="h-3 w-3" />{text}</Badge>;
              }

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
                  case 'Pending Anonymous Reply': return <Badge className="bg-blue-500 text-white">Awaiting Reply</Badge>;
                  case 'Retaliation Claim': return <Badge variant="destructive">Retaliation Claim</Badge>;
                  case 'Closed': return <Badge variant="secondary">Closed</Badge>;
                  default: return <Badge variant="secondary">{feedbackStatus || 'N/A'}</Badge>;
              }
            }
            
            const getTypeBadge = () => {
                let type: "1-on-1" | "Anonymous" | "Identified" | "To-Do" | "Retaliation" = "Identified";
                let variant: "default" | "secondary" | "destructive" = "secondary";
                
                if (isOneOnOne) {
                    type = "1-on-1";
                } else {
                    if (item.status === 'To-Do') type = "To-Do";
                    else if (item.criticality === 'Retaliation Claim' || item.parentCaseId) {
                        type = "Retaliation";
                        variant = "destructive";
                    } else if (item.isAnonymous) {
                        type = "Anonymous";
                        variant = "default";
                    }
                }
                
                return <Badge variant={variant}>{type}</Badge>;
            }


            return (
            <AccordionItem value={id} key={id} id={`accordion-item-${id}`}>
                <AccordionTrigger className="w-full px-4 py-3 text-left hover:no-underline [&_svg]:ml-auto">
                    <div className="flex justify-between items-center w-full">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                             <span className="font-medium truncate">{subject}</span>
                        </div>
                        <div className="flex items-center gap-4 pl-4">
                            {getTypeBadge()}
                            <span 
                                className="text-xs text-muted-foreground font-mono cursor-text"
                                onClick={(e) => { e.stopPropagation(); }}
                            >
                               ID: {id}
                            </span>
                            {getStatusBadge()}
                        </div>
                    </div>
                </AccordionTrigger>
                <AccordionContent className="space-y-6 pt-4 px-4">
                    {!isOneOnOne && item.status !== 'To-Do' && (
                        <>
                            <div className="space-y-2">
                                <Label className="text-base">Original Submission Context</Label>
                                <p className="whitespace-pre-wrap text-sm text-muted-foreground">{item.message}</p>
                            </div>
                        </>
                     )}

                    { !isOneOnOne && item.auditTrail && <AuditTrail trail={item.auditTrail} handleViewCaseDetails={handleViewCaseDetails} onDownload={handleDownload} />}
                    { isOneOnOne && item.analysis.criticalCoachingInsight?.auditTrail && <AuditTrail trail={item.analysis.criticalCoachingInsight.auditTrail} handleViewCaseDetails={handleViewCaseDetails} onDownload={handleDownload}/> }

                    <ActionPanel item={item} onUpdate={fetchFeedback} handleViewCaseDetails={handleViewCaseDetails} />
                    
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

  const allActiveItemsCount = toDoItems.length + oneOnOneEscalations.length + identifiedConcerns.length + anonymousConcerns.length + retaliationClaims.length;
  
  const ClosedItemsSection = () => {
    return (
        <div className="mt-8">
            <div className="border rounded-t-lg">
                <div className="flex w-full items-center justify-between px-4 py-3 text-lg font-semibold text-muted-foreground border-b bg-muted/30">
                    <div className="flex items-center gap-3">
                        <FolderClosed />
                        Closed Items
                    </div>
                </div>
            </div>
            <div className="border border-t-0 rounded-b-lg p-2 md:p-4 space-y-4">
               {renderFeedbackList(allClosedItems)}
            </div>
        </div>
    );
  };


  return (
    <div className="p-4 md:p-8" ref={accordionRef}>
      <CaseDetailsModal 
        caseItem={viewingCaseDetails} 
        open={!!viewingCaseDetails} 
        onOpenChange={(open) => !open && setViewingCaseDetails(null)}
        handleViewCaseDetails={handleViewCaseDetails}
      />
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
                {renderCategorySection("Anonymous Concerns", UserX, anonymousConcerns)}
                {renderCategorySection("Retaliation Claims", Flag, retaliationClaims, true)}
            </div>
          )}
        </CardContent>
      </Card>
      
      {allClosedItems.length > 0 && <ClosedItemsSection />}
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
