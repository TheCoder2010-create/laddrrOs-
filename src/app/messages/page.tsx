
"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRole, Role } from '@/hooks/use-role';
import DashboardLayout from '@/components/dashboard-layout';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { MessageSquare, MessageCircleQuestion, AlertTriangle, CheckCircle, Loader2, ChevronsRight, User, Users, Briefcase, ShieldCheck, UserX, UserPlus, FileText } from 'lucide-react';
import { getOneOnOneHistory, OneOnOneHistoryItem, submitEmployeeAcknowledgement, submitAmCoachingNotes, submitManagerResolution, submitHrResolution, submitFinalHrDecision } from '@/services/feedback-service';
import { roleUserMapping } from '@/lib/role-mapping';
import { format } from 'date-fns';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import { CriticalCoachingInsight } from '@/ai/schemas/one-on-one-schemas';
import { Textarea } from '@/components/ui/textarea';

function AcknowledgementWidget({ item, onUpdate }: { item: OneOnOneHistoryItem, onUpdate: () => void }) {
    const { toast } = useToast();
    const [employeeAcknowledgement, setEmployeeAcknowledgement] = useState('');
    const [isSubmittingAck, setIsSubmittingAck] = useState(false);

    const handleEmployeeAckSubmit = async () => {
        if (!employeeAcknowledgement) return;
        setIsSubmittingAck(true);
        
        const previousStatus = item.analysis.criticalCoachingInsight?.status;

        try {
            await submitEmployeeAcknowledgement(item.id, employeeAcknowledgement, previousStatus);
            setEmployeeAcknowledgement("");
            
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
    
    const wasHrAction = item.analysis.criticalCoachingInsight?.auditTrail?.some(e => e.event === 'HR Resolution');

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
                            {item.analysis.criticalCoachingInsight?.auditTrail.find(e => e.event === 'HR Resolution')?.details}
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

function EscalationWidget({ item, onUpdate }: { item: OneOnOneHistoryItem, onUpdate: () => void }) {
    const insight = item.analysis.criticalCoachingInsight as CriticalCoachingInsight;
    const { toast } = useToast();
    const { role } = useRole();
    const [action, setAction] = useState<'coach' | 'address' | null>(null);
    const [coachingNotes, setCoachingNotes] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleAmActionSubmit = async () => {
        if (action === 'coach' && !coachingNotes) return;

        setIsSubmitting(true);
        try {
            if (action === 'coach') {
                await submitAmCoachingNotes(item.id, role!, coachingNotes);
                toast({ title: "Coaching Notes Submitted", description: "The supervisor has been notified to retry the 1-on-1." });
            } else if (action === 'address') {
                 // Placeholder for next step
                toast({ title: "Action Recorded", description: "Next step: Address Employee directly. This will be implemented next." });
            }
            onUpdate();
        } catch (error) {
            console.error("Failed to submit AM action", error);
            toast({ variant: 'destructive', title: "Submission Failed" });
        } finally {
            setIsSubmitting(false);
            setAction(null);
            setCoachingNotes('');
        }
    };
    
    const handleActionClick = (selectedAction: 'coach' | 'address') => {
        setAction(selectedAction);
        if (selectedAction === 'address') {
            handleAmActionSubmit(); // Immediately submit for 'address' as there's no form
        }
    };


    return (
        <Card className="border-orange-500/50">
            <CardHeader className="bg-orange-500/10">
                <CardTitle className="flex items-center gap-2 text-orange-700 dark:text-orange-400">
                    <AlertTriangle className="h-6 w-6" />
                    Critical Escalation Review
                </CardTitle>
                <CardDescription>
                    Escalated from the 1-on-1 between {item.supervisorName} and {item.employeeName} on {format(new Date(item.date), 'PPP')}.
                </CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
                 <div className="p-3 bg-red-500/10 rounded-md border border-red-500/20">
                    <p className="font-semibold text-red-700 dark:text-red-500">Original AI Insight</p>
                    <p className="text-sm text-red-600 dark:text-red-400 mt-1 whitespace-pre-wrap">{insight.summary}</p>
                 </div>
                 <div className="p-3 bg-muted/80 rounded-md border">
                    <p className="font-semibold text-foreground">{item.supervisorName}'s (TL) Response</p>
                    <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">{insight.supervisorResponse}</p>
                </div>
                <div className="p-3 bg-blue-500/10 rounded-md border border-blue-500/20">
                    <p className="font-semibold text-blue-700 dark:text-blue-500">{item.employeeName}'s (Employee) Acknowledgement</p>
                    <p className="text-sm text-blue-600 dark:text-blue-400 mt-1 whitespace-pre-wrap">{insight.employeeAcknowledgement}</p>
                </div>
            </CardContent>
            <CardFooter className="bg-orange-500/10 pt-4 flex-col items-start gap-4">
                 <Label className="font-semibold text-orange-700 dark:text-orange-400">Your Action</Label>
                
                 {action === 'coach' ? (
                     <div className="w-full space-y-3">
                         <p className="text-sm text-muted-foreground">Log your coaching notes for the supervisor. This will be visible to them.</p>
                         <Textarea 
                            placeholder="e.g., Coached Ben on active listening and validating concerns before offering solutions. Suggested a follow-up meeting..."
                            value={coachingNotes}
                            onChange={(e) => setCoachingNotes(e.target.value)}
                            rows={4}
                            className="bg-background"
                         />
                         <div className="flex gap-2">
                             <Button onClick={handleAmActionSubmit} disabled={isSubmitting || !coachingNotes}>
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                                Submit Coaching Notes
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
                                <User className="mr-2 h-4 w-4" />
                                Address Employee
                            </Button>
                        </div>
                    </>
                 )}
            </CardFooter>
        </Card>
    )
}

function ManagerEscalationWidget({ item, onUpdate }: { item: OneOnOneHistoryItem, onUpdate: () => void }) {
    const insight = item.analysis.criticalCoachingInsight as CriticalCoachingInsight;
    const amCoachingNotes = insight.auditTrail?.find(e => e.event === 'AM Coaching Notes')?.details;
    const supervisorRetryNotes = insight.auditTrail?.find(e => e.event === 'Supervisor Retry Action')?.details;
    const { toast } = useToast();
    const { role } = useRole();

    const [resolutionNotes, setResolutionNotes] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleManagerSubmit = async () => {
        if (!resolutionNotes) return;
        setIsSubmitting(true);
        try {
            await submitManagerResolution(item.id, role!, resolutionNotes);
            toast({ title: "Resolution Submitted", description: "The employee has been notified for a final acknowledgement." });
            onUpdate();
        } catch (error) {
            console.error("Failed to submit manager resolution", error);
            toast({ variant: 'destructive', title: "Submission Failed" });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Card className="border-destructive">
            <CardHeader className="bg-destructive/10">
                <CardTitle className="flex items-center gap-2 text-destructive">
                    <Briefcase className="h-6 w-6" />
                    Manager Level Escalation
                </CardTitle>
                <CardDescription>
                    Final review for the case between {item.supervisorName} and {item.employeeName}.
                </CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
                <div className="space-y-2 p-3 bg-red-500/10 rounded-md border border-red-500/20">
                    <p className="font-bold text-red-700 dark:text-red-500 text-sm">Initial AI Insight</p>
                    <p className="text-sm text-red-600 dark:text-red-400 whitespace-pre-wrap">{insight.summary}</p>
                </div>
                <div className="space-y-2 p-3 bg-muted/80 rounded-md border">
                    <p className="font-bold text-foreground text-sm">TL Response</p>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{insight.supervisorResponse}</p>
                </div>
                 <div className="space-y-2 p-3 bg-blue-500/10 rounded-md border border-blue-500/20">
                    <p className="font-bold text-blue-700 dark:text-blue-500 text-sm">First Employee Acknowledgement</p>
                    <p className="text-sm text-blue-600 dark:text-blue-400 whitespace-pre-wrap">{insight.auditTrail?.find(e => e.event === 'Employee Acknowledged')?.details}</p>
                </div>
                <div className="space-y-2 p-3 bg-orange-500/10 rounded-md border border-orange-500/20">
                    <p className="font-bold text-orange-700 dark:text-orange-500 text-sm">AM Coaching Notes</p>
                    <p className="text-sm text-orange-600 dark:text-orange-400 whitespace-pre-wrap">{amCoachingNotes}</p>
                </div>
                <div className="space-y-2 p-3 bg-muted/80 rounded-md border">
                    <p className="font-bold text-foreground text-sm">TL Retry Notes</p>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{supervisorRetryNotes}</p>
                </div>
                 <div className="space-y-2 p-3 bg-blue-500/10 rounded-md border border-blue-500/20">
                    <p className="font-bold text-blue-700 dark:text-blue-500 text-sm">Final Employee Acknowledgement</p>
                    <p className="text-sm text-blue-600 dark:text-blue-400 whitespace-pre-wrap">{insight.employeeAcknowledgement}</p>
                </div>
            </CardContent>
            <CardFooter className="bg-destructive/10 pt-4 flex-col items-start gap-4">
                <Label className="font-semibold text-destructive">Your Action</Label>
                <p className="text-sm text-muted-foreground">
                    This case requires your direct intervention. Document the actions you will take to resolve this situation. The employee will be asked to acknowledge this final resolution.
                </p>
                <div className="w-full space-y-3">
                     <Textarea 
                        placeholder="e.g., I have scheduled a mediated session between the TL and employee, and will be implementing a new communication protocol for the team..."
                        value={resolutionNotes}
                        onChange={(e) => setResolutionNotes(e.target.value)}
                        rows={4}
                        className="bg-background"
                     />
                     <div className="flex gap-2">
                         <Button variant="destructive" onClick={handleManagerSubmit} disabled={isSubmitting || !resolutionNotes}>
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                            Submit Final Resolution
                         </Button>
                     </div>
                 </div>
            </CardFooter>
        </Card>
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
                {renderAuditEntry("Employee Acknowledged", `First Employee Acknowledgement`, insight.auditTrail?.find(e => e.event === 'Employee Acknowledged')?.details, "bg-blue-500/10 border-blue-500/20", "text-blue-700 dark:text-blue-500")}
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
                                        {isSubmittingFinal && <Loader2 className="mr-2 animate-spin"/>}
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
  const [pendingAcknowledgements, setPendingAcknowledgements] = useState<OneOnOneHistoryItem[]>([]);
  const [amEscalatedItems, setAmEscalatedItems] = useState<OneOnOneHistoryItem[]>([]);
  const [managerEscalatedItems, setManagerEscalatedItems] = useState<OneOnOneHistoryItem[]>([]);
  const [hrEscalatedItems, setHrEscalatedItems] = useState<OneOnOneHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchMessages = useCallback(async () => {
    setIsLoading(true);
    const history = await getOneOnOneHistory();
    const currentUser = roleUserMapping[role];

    // For Employees: Find items waiting for their acknowledgement
    const pending = history.filter(item => 
        item.employeeName === currentUser.name &&
        item.analysis.criticalCoachingInsight?.status === 'pending_employee_acknowledgement'
    );
    setPendingAcknowledgements(pending);

    // For AMs: Find items escalated to them
    const amEscalated = history.filter(item =>
        role === 'AM' && item.analysis.criticalCoachingInsight?.status === 'pending_am_review'
    );
    setAmEscalatedItems(amEscalated);

    // For Managers: Find items escalated to them
    const managerEscalated = history.filter(item =>
        role === 'Manager' && item.analysis.criticalCoachingInsight?.status === 'pending_manager_review'
    );
    setManagerEscalatedItems(managerEscalated);

    // For HR Head: Find items escalated to them (both initial and final)
    const hrEscalated = history.filter(item =>
        role === 'HR Head' && 
        (item.analysis.criticalCoachingInsight?.status === 'pending_hr_review' || item.analysis.criticalCoachingInsight?.status === 'pending_final_hr_action')
    );
    setHrEscalatedItems(hrEscalated);
    
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

  const hasMessages = pendingAcknowledgements.length > 0 || amEscalatedItems.length > 0 || managerEscalatedItems.length > 0 || hrEscalatedItems.length > 0;

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
                <>
                    {pendingAcknowledgements.map(item => (
                        <AcknowledgementWidget key={item.id} item={item} onUpdate={fetchMessages} />
                    ))}
                    {amEscalatedItems.map(item => (
                        <EscalationWidget key={item.id} item={item} onUpdate={fetchMessages} />
                    ))}
                    {managerEscalatedItems.map(item => (
                        <ManagerEscalationWidget key={item.id} item={item} onUpdate={fetchMessages} />
                    ))}
                    {hrEscalatedItems.map(item => (
                        <HrReviewWidget key={item.id} item={item} onUpdate={fetchMessages} />
                    ))}
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
