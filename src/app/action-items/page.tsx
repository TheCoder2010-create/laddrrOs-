
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
import { ListTodo, ShieldAlert, AlertTriangle, Info, CheckCircle, Clock, User, MessageSquare, Send, ChevronsRight, FileCheck, UserX, ShieldCheck as ShieldCheckIcon, FolderClosed, MessageCircleQuestion, UserPlus, FileText, Loader2, Link as LinkIcon, Paperclip, Users, Briefcase, ExternalLink, GitMerge, ChevronDown, Flag, UserCog, Download, Bot, BrainCircuit, CheckSquare } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
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
import { formatActorName } from '@/lib/role-mapping';

const criticalityConfig = {
    'Critical': { icon: ShieldAlert, color: 'bg-destructive/20 text-destructive', badge: 'destructive' as const },
    'High': { icon: AlertTriangle, color: 'bg-orange-500/20 text-orange-500', badge: 'destructive' as const },
    'Medium': { icon: Info, color: 'bg-yellow-500/20 text-yellow-500', badge: 'secondary' as const },
    'Low': { icon: CheckCircle, color: 'bg-green-500/20 text-green-500', badge: 'success' as const },
    'Retaliation Claim': { icon: ShieldAlert, color: 'bg-destructive/20 text-destructive', badge: 'destructive' as const },
};

const auditEventIcons = {
    'Submitted': FileCheck,
    'Critical Insight Identified': Bot,
    'AI Analysis Completed': ChevronsRight,
    'Assigned': Send,
    'Unassigned': UserX,
    'Responded': MessageSquare,
    'Acknowledged': CheckCircle,
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
    'AM Coaching Notes': BrainCircuit,
    'AM Responded to Employee': MessageSquare,
    'Supervisor Retry Action': MessageSquare,
    'Manager Resolution': Briefcase,
    'HR Resolution': ShieldCheckIcon,
    'Assigned to Ombudsman': UserX,
    'Assigned to Grievance Office': UserPlus,
    'Logged Dissatisfaction & Closed': FileText,
    'default': Info,
}

const formatEventTitle = (event: string) => {
  const prefixesToRemove = ['Supervisor ', 'Employee ', 'Manager ', 'HR ', 'AM '];
  let formattedEvent = event;
  for (const prefix of prefixesToRemove) {
    if (formattedEvent.startsWith(prefix)) {
      formattedEvent = formattedEvent.substring(prefix.length);
      break; 
    }
  }
  return formattedEvent;
};


function AuditTrail({ item, handleViewCaseDetails, onDownload }: { item: Feedback | OneOnOneHistoryItem, handleViewCaseDetails: (e: React.MouseEvent, caseId: string) => void, onDownload: () => void }) {
    
    let displayTrail: AuditEvent[] = [];
    const isOneOnOne = 'analysis' in item;

    if (isOneOnOne) {
        const insight = item.analysis.criticalCoachingInsight;
        if (insight) {
            const initialEvent: AuditEvent = {
                event: 'Critical Insight Identified',
                timestamp: insight.auditTrail?.[0]?.timestamp || item.date,
                actor: 'AI System',
                details: `${insight.summary}\n\n**Reasoning:** ${insight.reason}`
            };
            displayTrail = [initialEvent, ...(insight.auditTrail || [])];
        }
    } else {
        displayTrail = item.auditTrail || [];
    }

    if (displayTrail.length === 0) return null;

    return (
        <div className="space-y-2">
            <div className="flex justify-between items-center">
                <Label className="text-base">Case History</Label>
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" onClick={onDownload}>
                                <Download className="h-4 w-4" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Download PDF</p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            </div>
            <div className="relative p-4 border rounded-md bg-muted/50">
                <div className="absolute left-8 top-8 bottom-8 w-px bg-border -translate-x-1/2"></div>
                <div className="space-y-4">
                    {displayTrail.map((event, index) => {
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
                                                return <div key={`${index}-line-${i}`}>Claim submitted for case <a href="#" onClick={(e) => handleViewCaseDetails(e, parentId)} className="font-mono text-primary hover:underline">{parentId}</a>.</div>
                                            }
                                            if (lineChildMatch) {
                                                const childId = lineChildMatch[2];
                                                return <div key={`${index}-line-${i}`}>New Case ID: <a href="#" onClick={(e) => handleViewCaseDetails(e, childId)} className="font-mono text-primary hover:underline">{childId}</a></div>
                                            }
                                            return <div key={`${index}-line-${i}`}>{line}</div>
                                        })}
                                    </div>
                                );
                            }

                            return <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">{event.details}</p>;
                        };

                        return (
                            <div key={`${event.event}-${index}`} className="flex items-start gap-4 relative">
                                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-background border flex items-center justify-center z-10">
                                    <Icon className="h-5 w-5 text-muted-foreground" />
                                </div>
                                <div className="flex-1 -mt-1">
                                    <p className="font-medium text-sm">
                                        {formatEventTitle(event.event)} by <span className="text-primary">{formatActorName(event.actor)}</span>
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
             {allItemsCompleted && feedback.status !== 'Resolved' && (
                <div className="pt-4 border-t">
                    <Button variant="success" onClick={handleResolve}>Mark as Completed</Button>
                </div>
             )}
        </div>
    )
}

function EscalationWidget({ item, onUpdate }: { item: OneOnOneHistoryItem, onUpdate: () => void }) {
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

    const isItemClosed = insight.status === 'resolved' || ['pending_final_hr_action', 'resolved'].includes(insight.status);
    const isActionable = (role === 'AM' && insight.status === 'pending_am_review') || (role === 'Manager' && insight.status === 'pending_manager_review');
    

    return (
        <div className="space-y-6">
            <h3 className="text-lg font-semibold flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-500" />
                Escalation Details
            </h3>

            {isActionable && !isItemClosed && (
                 <div className="bg-orange-500/10 p-4 rounded-lg border border-orange-500/20 flex flex-col items-start gap-4">
                    <Label className="font-semibold text-base text-orange-700 dark:text-orange-400">Your Action</Label>
                    
                    {isManagerWidget ? (
                         <div className="w-full space-y-3">
                             <p className="text-sm text-muted-foreground">
                                This case requires your direct intervention. Document the actions you will take to resolve this situation. This resolution will be sent to the employee for final acknowledgement.
                            </p>
                             <Textarea 
                                value={resolutionNotes}
                                onChange={(e) => setResolutionNotes(e.target.value)}
                                rows={4}
                                className="bg-background"
                                placeholder="Document your final resolution actions here..."
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
                                value={actionNotes}
                                onChange={(e) => setActionNotes(e.target.value)}
                                rows={4}
                                className="bg-background"
                                placeholder={action === 'coach' ? 'Enter your coaching notes...' : 'Enter your direct response...'}
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
                                <Button variant="secondary" className="bg-yellow-400/80 text-yellow-900 hover:bg-yellow-400/90" onClick={() => handleActionClick('coach')}>
                                    <BrainCircuit className="mr-2 h-4 w-4" />
                                    Coach Supervisor
                                </Button>
                                <Button onClick={() => handleActionClick('address')} className="bg-blue-600 text-white hover:bg-blue-700">
                                    <ChevronsRight className="mr-2 h-4 w-4" />
                                    Address Employee
                                </Button>
                            </div>
                        </>
                    )}
                </div>
            )}
        </div>
    );
}

function HrReviewWidget({ item, onUpdate }: { item: OneOnOneHistoryItem, onUpdate: () => void }) {
    const insight = item.analysis.criticalCoachingInsight as CriticalCoachingInsight;
    const { toast } = useToast();
    const { role } = useRole();
    const [resolutionNotes, setResolutionNotes] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const [finalAction, setFinalAction] = useState<string | null>(null);
    const [finalActionNotes, setFinalActionNotes] = useState('');
    const [isSubmittingFinal, setIsSubmittingFinal] = useState(false);
    
    const isActionable = role === 'HR Head';
    const isPendingFinalAction = insight.status === 'pending_final_hr_action';
    const isPendingInitialReview = insight.status === 'pending_hr_review';

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

    return (
        <div className="space-y-6">
            <h3 className="text-lg font-semibold flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                HR Review Details
            </h3>
            {isActionable && (
                <div className="bg-black/10 dark:bg-gray-800/50 pt-4 p-4 rounded-lg flex flex-col items-start gap-4">
                     {isPendingInitialReview && (
                        <>
                            <Label className="font-semibold text-black dark:text-white">Your Action</Label>
                             <p className="text-sm text-muted-foreground">
                                The automated workflow for this case has concluded. Document your final actions to resolve this situation. The employee will be asked for a final acknowledgement.
                            </p>
                            <div className="w-full space-y-3">
                                 <Textarea 
                                    value={resolutionNotes}
                                    onChange={(e) => setResolutionNotes(e.target.value)}
                                    rows={4}
                                    className="bg-background"
                                    placeholder="Enter your final resolution notes..."
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
                     {isPendingFinalAction && (
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
                                         value={finalActionNotes}
                                         onChange={(e) => setFinalActionNotes(e.target.value)}
                                         rows={4}
                                         className="bg-background"
                                         placeholder="Provide your justification for this final action..."
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
            )}
        </div>
    );
}


function ActionPanel({ item, onUpdate, handleViewCaseDetails }: { item: Feedback | OneOnOneHistoryItem, onUpdate: () => void, handleViewCaseDetails: (e: React.MouseEvent, caseId: string) => void }) {
    const { role } = useRole();

    // Render widget for 1-on-1 Escalations
    if ('analysis' in item) {
        const insight = item.analysis.criticalCoachingInsight;
        if (!insight) return null;
        
        const isActionableForRole = () => {
            if (!role) return false;
            // A case is actionable for a manager if they are assigned, regardless of status, unless a final disposition has been made.
            const finalDispositionEvent = insight.auditTrail?.find(e => ["Assigned to Ombudsman", "Assigned to Grievance Office", "Logged Dissatisfaction & Closed", "Final Disposition"].includes(e.event));
            if (finalDispositionEvent) return false;

            if (role === 'AM' && (insight.status === 'pending_am_review' || item.assignedTo === 'AM')) return true;
            if (role === 'Manager' && (insight.status === 'pending_manager_review' || item.assignedTo === 'Manager')) return true;
            if (role === 'HR Head' && (insight.status === 'pending_hr_review' || insight.status === 'pending_final_hr_action' || item.assignedTo === 'HR Head')) return true;
            return false;
        };

        if (isActionableForRole()) {
            if (role === 'AM' || role === 'Manager') {
                 return <EscalationWidget item={item} onUpdate={onUpdate} />;
            }
            if (role === 'HR Head') {
                return <HrReviewWidget item={item} onUpdate={onUpdate} />;
            }
        }
        
        return null;
    }

    // Render widgets for standard Feedback items
    const feedback = item;
    
    if (feedback.status === 'To-Do') {
        return <ToDoPanel feedback={feedback} onUpdate={onUpdate} />;
    }
    
    return null; // No action panel for other statuses
}

function CaseDetailsModal({ caseItem, open, onOpenChange, handleViewCaseDetails }: { caseItem: Feedback | OneOnOneHistoryItem | null, open: boolean, onOpenChange: (open: boolean) => void, handleViewCaseDetails: (e: React.MouseEvent, caseId: string) => void }) {
    if (!caseItem) return null;

    const isOneOnOne = 'analysis' in caseItem;
    const subject = isOneOnOne ? `${caseItem.employeeName} & ${caseItem.supervisorName}` : (caseItem.subject || 'No Subject');
    const trackingId = isOneOnOne ? caseItem.id : caseItem.trackingId;
    const initialMessage = isOneOnOne ? caseItem.analysis.criticalCoachingInsight?.summary || 'N/A' : caseItem.message;
    const trail = isOneOnOne ? caseItem.analysis.criticalCoachingInsight?.auditTrail || [] : caseItem.auditTrail || [];
    const finalResolution = isOneOnOne ? caseItem.analysis.criticalCoachingInsight?.auditTrail?.find(e => e.event.includes('Resolution') || e.event.includes('Disposition'))?.details : caseItem.resolution;
    const aiSummary = isOneOnOne ? caseItem.analysis.criticalCoachingInsight?.reason : caseItem.summary;

    const handleDownload = () => {
        const caseDetails = {
            title: subject,
            trackingId,
            initialMessage,
            aiSummary,
            finalResolution,
            trail: trail,
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
                        <AuditTrail item={caseItem} handleViewCaseDetails={handleViewCaseDetails} onDownload={handleDownload}/>
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
  const [activeItems, setActiveItems] = useState<(Feedback | OneOnOneHistoryItem)[]>([]);
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

        const localActiveItems: (Feedback | OneOnOneHistoryItem)[] = [];
        const allItems: (Feedback | OneOnOneHistoryItem)[] = [...fetchedFeedback, ...history];
        
        const isEverAssigned = (item: Feedback | OneOnOneHistoryItem) => {
            if ('analysis' in item) {
                const insight = item.analysis.criticalCoachingInsight;
                if (!insight || !insight.auditTrail) return false;
                // An insight is considered "assigned" if the top-level assignedTo field was ever set to the current role
                // or if an audit trail event shows an assignment to this role.
                const wasAssignedInTrail = insight.auditTrail.some(e => e.event === 'Assigned' && e.details?.includes(role as string));
                return wasAssignedInTrail;
            } else {
                 if (!item.auditTrail) return false;
                 return item.auditTrail.some(e => e.event === 'Assigned' && e.details?.includes(role as string));
            }
        };

        allItems.forEach(item => {
            const wasEverAssignedToMe = isEverAssigned(item);

            if (wasEverAssignedToMe) {
                 localActiveItems.push(item);
                 return; // Add it and stop checking
            }

            // Also include To-Do items currently assigned
            if (!('analysis' in item) && item.status === 'To-Do' && item.assignedTo?.includes(role as Role)) {
                localActiveItems.push(item);
            }

            // And include 1-on-1 insights currently assigned
            if ('analysis' in item && item.analysis.criticalCoachingInsight) {
                 const insight = item.analysis.criticalCoachingInsight;
                 const isAmMatch = role === 'AM' && insight.status === 'pending_am_review';
                 const isManagerMatch = role === 'Manager' && insight.status === 'pending_manager_review';
                 const isHrMatch = role === 'HR Head' && (insight.status === 'pending_hr_review' || insight.status === 'pending_final_hr_action');
                 if(isAmMatch || isManagerMatch || isHrMatch) {
                    if (!localActiveItems.some(li => ('analysis' in li) && li.id === item.id)) {
                       localActiveItems.push(item);
                    }
                 }
            }
        });
        
        const sortFn = (a: Feedback | OneOnOneHistoryItem, b: Feedback | OneOnOneHistoryItem) => {
            const dateA = 'submittedAt' in a ? new Date(a.submittedAt) : new Date(a.date);
            const dateB = 'submittedAt' in b ? new Date(b.submittedAt) : new Date(b.date);
            return dateB.getTime() - dateA.getTime();
        };
        
        setActiveItems(localActiveItems.sort(sortFn));

    } catch (error) {
      console.error("Failed to fetch feedback", error);
    } finally {
      setIsLoading(false);
    }
  }, [role]);
  
  const handleUpdate = useCallback(() => {
    const currentOpenItem = openAccordionItem;
    fetchFeedback().then(() => {
        if (currentOpenItem) {
            setOpenAccordionItem(currentOpenItem);
        }
    });
  }, [fetchFeedback, openAccordionItem]);

  useEffect(() => {
    fetchFeedback();

    const handleStorageChange = () => handleUpdate();

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('feedbackUpdated', handleStorageChange);

    return () => {
        window.removeEventListener('storage', handleStorageChange);
        window.removeEventListener('feedbackUpdated', handleStorageChange);
    };
  }, [fetchFeedback, handleUpdate]);

  const handleViewCaseDetails = async (e: React.MouseEvent, caseId: string) => {
      e.preventDefault();
      e.stopPropagation();
      
      const allItems: (Feedback | OneOnOneHistoryItem)[] = [...activeItems];
      
      let caseItem = allItems.find(item => ('analysis' in item ? item.id : item.trackingId) === caseId);

      if (caseItem) {
          setViewingCaseDetails(caseItem);
      } else {
           // Fallback to fetch from service if not in current view
          let feedbackItem = await getFeedbackById(caseId);
          if (feedbackItem) {
               setViewingCaseDetails(feedbackItem);
          } else {
               const history = await getOneOnOneHistory();
               const oneOnOneItem = history.find(item => item.id === caseId);
               if (oneOnOneItem) {
                   setViewingCaseDetails(oneOnOneItem);
               }
          }
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
  
  const toDoItems = activeItems.filter(item => !('analysis' in item) && item.status === 'To-Do');
  const oneOnOneEscalations = activeItems.filter(item => 'analysis' in item);

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
            const subject = isOneOnOne ? `1-on-1: ${item.employeeName} & ${item.supervisorName}` : (item.subject || 'No Subject');
            
            const handleDownload = () => {
                const trail = isOneOnOne ? item.analysis.criticalCoachingInsight?.auditTrail || [] : item.auditTrail || [];
                const initialMessage = isOneOnOne ? item.analysis.criticalCoachingInsight?.summary || 'N/A' : item.message;
                const finalResolution = isOneOnOne ? item.analysis.criticalCoachingInsight?.auditTrail?.find(e => e.event.includes('Resolution') || e.event.includes('Disposition'))?.details : item.resolution;
                 const aiSummary = isOneOnOne ? item.analysis.criticalCoachingInsight?.reason : item.summary;

                downloadAuditTrailPDF({
                    title: subject || 'Case Details',
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
                      case 'pending_am_review': return <Badge variant="secondary">AM Review</Badge>;
                      case 'pending_manager_review': return <Badge variant="secondary">Manager Review</Badge>;
                      case 'pending_hr_review': return <Badge variant="secondary">HR Review</Badge>;
                      case 'pending_final_hr_action': return <Badge variant="secondary" className="bg-black/80 text-white">Final HR Action</Badge>;
                      case 'resolved': return <Badge variant="success">Resolved</Badge>;
                      default: return <Badge variant="secondary">{insightStatus?.replace(/_/g, ' ')}</Badge>;
                  }
              }
              const feedbackStatus = item.status;
              switch (feedbackStatus) {
                  case 'Resolved': return <Badge variant="success">Resolved</Badge>;
                  case 'To-Do': return <Badge variant="default">To-Do</Badge>;
                  case 'Closed': return <Badge variant="secondary">Closed</Badge>;
                  default: return <Badge variant="secondary">{feedbackStatus || 'N/A'}</Badge>;
              }
            }
            
            const getTypeBadge = () => {
                let type: "1-on-1" | "To-Do" = "1-on-1";
                let variant: "default" | "secondary" = "secondary";
                
                if (isOneOnOne) {
                    type = "1-on-1";
                } else {
                    type = "To-Do";
                    variant = "default";
                }
                
                return <Badge variant={variant}>{type}</Badge>;
            }


            return (
            <AccordionItem value={id} key={id} id={`accordion-item-${id}`}>
                <AccordionTrigger className="w-full px-4 py-3 text-left hover:no-underline [&_svg]:ml-auto">
                    <div className="flex justify-between items-center w-full">
                         <div className="flex items-center gap-3 flex-1 min-w-0">
                            <span className="font-medium truncate">{subject}</span>
                            {getTypeBadge()}
                        </div>
                        <div className="flex items-center gap-4 pl-4 mr-2">
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

                    <AuditTrail item={item} handleViewCaseDetails={handleViewCaseDetails} onDownload={handleDownload} />
                    
                    <ActionPanel item={item} onUpdate={handleUpdate} handleViewCaseDetails={handleViewCaseDetails} />
                    
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

  const allActiveItemsCount = activeItems.length;

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
            Actionable escalations and to-do lists assigned to you.
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
                {renderCategorySection("1-on-1 Escalations", UserCog, oneOnOneEscalations, true)}
            </div>
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
