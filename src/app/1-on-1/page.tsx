
"use client";

import { useState, useMemo, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { Role } from '@/hooks/use-role';
import { useRole } from '@/hooks/use-role';
import RoleSelection from '@/components/role-selection';
import DashboardLayout from '@/components/dashboard-layout';
import { Skeleton } from '@/components/ui/skeleton';
import { Button, buttonVariants } from '@/components/ui/button';
import { PlusCircle, Calendar, Clock, Video, CalendarCheck, CalendarX, History, AlertTriangle, Send, Loader2, CheckCircle, MessageCircleQuestion, Lightbulb, BrainCircuit, ShieldCheck, TrendingDown, EyeOff, UserCheck, Star, Repeat, MessageSquare, Briefcase, UserX, UserPlus, FileText, Bot, BarChart, Zap, ShieldAlert, DatabaseZap, Timer, ListTodo, ThumbsUp, ThumbsDown, BookOpen, Mic as MicIcon, Podcast, Newspaper, GraduationCap, MessageSquareQuote, CheckCircle2, XCircle } from 'lucide-react';
import { format, formatDistanceToNow, addHours } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarIcon } from 'lucide-react';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { roleUserMapping, getRoleByName, formatActorName } from '@/lib/role-mapping';
import { getOneOnOneHistory, OneOnOneHistoryItem, submitSupervisorInsightResponse, submitSupervisorRetry, getAllFeedback, Feedback, updateCoachingRecommendationStatus, resolveFeedback, toggleActionItemStatus, AuditEvent } from '@/services/feedback-service';
import Link from 'next/link';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import type { CoachingRecommendation } from '@/ai/schemas/one-on-one-schemas';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const getMeetingDataForRole = (role: Role) => {
    let currentUser = roleUserMapping[role as keyof typeof roleUserMapping];
    let participant;
    switch(role) {
        case 'Employee':
            participant = roleUserMapping['Team Lead'];
            break;
        case 'Team Lead':
            participant = roleUserMapping['Employee'];
            break;
        case 'AM':
            participant = roleUserMapping['Team Lead'];
            break;
        case 'Manager':
            participant = roleUserMapping['Team Lead'];
            break;
        case 'HR Head':
            participant = roleUserMapping['Manager'];
            break;
        default:
             participant = { name: 'Participant', role: 'Role', imageHint: 'person' };
             currentUser = { name: 'Current User', role: 'Role', imageHint: 'person' };
            break;
    }

    return {
      meetings: [
        {
          id: 1,
          with: participant.name,
          withRole: participant.role,
          date: new Date(new Date().setDate(new Date().getDate() + 2)),
          time: '10:00',
        },
        {
          id: 2,
          with: participant.name,
          withRole: participant.role,
          date: new Date(new Date().setDate(new Date().getDate() + 9)),
          time: '14:30',
        },
      ],
      supervisor: currentUser.name,
    };
};

type Meeting = ReturnType<typeof getMeetingDataForRole>['meetings'][0];

function ScheduleMeetingDialog({ meetingToEdit, onSchedule }: { meetingToEdit?: Meeting, onSchedule: (details: any) => void }) {
  const [date, setDate] = useState<Date | undefined>(meetingToEdit?.date);
  const [time, setTime] = useState(meetingToEdit?.time || '');
  const [participant, setParticipant] = useState(meetingToEdit?.with || '');
  
  const handleSchedule = () => {
    onSchedule({ date, time, participant });
  }

  const title = meetingToEdit ? "Reschedule 1-on-1" : "Schedule New 1-on-1";
  const description = meetingToEdit ? "Update the date and time for your meeting." : "Select a participant, date, and time for your meeting.";

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>
          {description}
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-4 py-4">
        <div className="space-y-2">
          <Label htmlFor="participant">Participant</Label>
          <Input id="participant" value={participant} onChange={e => setParticipant(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !date && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date ? format(date, "PPP") : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <CalendarComponent
                mode="single"
                selected={date}
                onSelect={setDate}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
        <div className="space-y-2">
          <Label htmlFor="time">Time</Label>
          <Input id="time" type="time" value={time} onChange={e => setTime(e.target.value)} />
        </div>
      </div>
      <DialogFooter>
        <DialogClose asChild>
          <Button type="button" variant="secondary">
            Cancel
          </Button>
        </DialogClose>
        <DialogClose asChild>
            <Button type="submit" onClick={handleSchedule}>{meetingToEdit ? "Update" : "Schedule"}</Button>
        </DialogClose>
      </DialogFooter>
    </DialogContent>
  )
}

function ToDoSection({ role }: { role: Role }) {
    const [toDoItems, setToDoItems] = useState<Feedback[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();

    const fetchToDos = useCallback(async () => {
        setIsLoading(true);
        const allFeedback = await getAllFeedback();
        const supervisorRole = roleUserMapping[role];

        const userToDos = allFeedback.filter(item => 
            item.status === 'To-Do' &&
            item.supervisor === supervisorRole.name
        );
        
        setToDoItems(userToDos.sort((a,b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()));
        setIsLoading(false);
    }, [role]);

    useEffect(() => {
        fetchToDos();
        const handleDataUpdate = () => fetchToDos();
        window.addEventListener('storage', handleDataUpdate);
        window.addEventListener('feedbackUpdated', handleDataUpdate);
        return () => {
            window.removeEventListener('storage', handleDataUpdate);
            window.removeEventListener('feedbackUpdated', handleDataUpdate);
        }
    }, [fetchToDos]);

    const handleToggleActionItem = async (trackingId: string, actionItemId: string) => {
        await toggleActionItemStatus(trackingId, actionItemId);
        fetchToDos(); // Re-fetch to update UI
    };

    const handleMarkAsCompleted = async (trackingId: string) => {
        const item = toDoItems.find(i => i.trackingId === trackingId);
        if (!item || !item.assignedTo || item.assignedTo.length === 0) return;
        
        await resolveFeedback(trackingId, item.assignedTo[0], "All action items completed.");
        toast({ title: "To-Do List Completed", description: "This item has been moved to your history." });
        fetchToDos(); // Re-fetch to remove the item from the active list
    };

    if (isLoading) {
        return <Skeleton className="h-24 w-full mt-8" />;
    }

    if (!['Team Lead', 'AM', 'Manager', 'HR Head'].includes(role)) {
        return null; // Only show for supervisors
    }

    return (
        <div className="mt-8">
            <h2 className="text-xl font-semibold mb-4 text-muted-foreground flex items-center gap-2">
                <ListTodo className="h-5 w-5" />
                To-Do
            </h2>
            {toDoItems.length > 0 ? (
                <div className="space-y-4">
                    {toDoItems.map(item => {
                        const allItemsCompleted = item.actionItems?.every(action => action.status === 'completed');
                        return (
                            <div key={item.trackingId} className="border rounded-lg p-4">
                                <h3 className="font-medium">From 1-on-1 with {item.employee} on {format(new Date(item.submittedAt), 'PPP')}</h3>
                                <div className="space-y-2 mt-3">
                                    {item.actionItems?.map(action => (
                                        <div key={action.id} className="flex items-center space-x-3">
                                            <Checkbox 
                                                id={`action-${action.id}`} 
                                                checked={action.status === 'completed'}
                                                onCheckedChange={() => handleToggleActionItem(item.trackingId, action.id)}
                                            />
                                            <label htmlFor={`action-${action.id}`} className={cn("text-sm leading-none", action.status === 'completed' && "line-through text-muted-foreground")}>
                                                ({action.owner}) {action.text}
                                            </label>
                                        </div>
                                    ))}
                                </div>
                                {allItemsCompleted && (
                                    <div className="mt-4 pt-4 border-t">
                                        <Button variant="success" onClick={() => handleMarkAsCompleted(item.trackingId)}>Mark as Completed</Button>
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>
            ) : (
                <div className="mt-4 text-center py-12 border-2 border-dashed rounded-lg">
                    <ListTodo className="mx-auto h-12 w-12 text-muted-foreground" />
                    <h3 className="mt-4 text-lg font-semibold text-foreground">No Action Items</h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                        Action items from your 1-on-1 sessions will appear here.
                    </p>
                </div>
            )}
        </div>
    );
}

function SlaTimer({ expiryTimestamp }: { expiryTimestamp: number }) {
    const [timeLeft, setTimeLeft] = useState(expiryTimestamp - Date.now());

    useEffect(() => {
        const interval = setInterval(() => {
            setTimeLeft(expiryTimestamp - Date.now());
        }, 1000);

        return () => clearInterval(interval);
    }, [expiryTimestamp]);

    const formatTime = (ms: number) => {
        if (ms <= 0) return '00:00:00';
        const totalSeconds = Math.floor(ms / 1000);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    };

    return (
        <div className="flex items-center gap-2">
            <Timer className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-mono text-muted-foreground">
                {formatTime(timeLeft)}
            </span>
        </div>
    );
}

function InsightAuditTrail({ trail }: { trail: AuditEvent[] }) {
    const eventIcons = {
        'default': Briefcase,
        'Responded': MessageSquare,
        'Acknowledged': CheckCircle,
        'AM Coaching Notes': BrainCircuit,
        'AM Responded to Employee': MessageSquare,
        'Supervisor Retry Action': MessageSquare,
        'Manager Resolution': Briefcase,
        'HR Resolution': ShieldCheck,
        'Assigned to Ombudsman': UserX,
        'Assigned to Grievance Office': UserPlus,
        'Logged Dissatisfaction & Closed': FileText,
    };

    const formatEventTitle = (event: string) => {
        switch (event) {
            case 'Responded': return "Supervisor's Response";
            case 'Acknowledged': return "Employee's Acknowledgement";
            case 'AM Coaching Notes': return "AM's Coaching Notes for Supervisor";
            case 'AM Responded to Employee': return "AM's Direct Response";
            case 'Supervisor Retry Action': return "Supervisor's Follow-up Action";
            case 'Manager Resolution': return "Manager's Resolution";
            case 'HR Resolution': return "HR's Final Resolution";
            default: return event;
        }
    };
    
    // The initial "Critical Insight Identified" event is now part of the card title, so we can skip it here.
    // However, the first response from the supervisor should be shown.
    const eventsToDisplay = trail.filter(event => event.event !== 'Critical Insight Identified');

    return (
        <div className="space-y-4 pt-4 border-t border-muted">
            {eventsToDisplay.map((event, index) => { 
                const Icon = eventIcons[event.event as keyof typeof eventIcons] || eventIcons.default;
                return (
                    <div key={index} className="space-y-2">
                        <p className="font-semibold text-foreground text-sm flex items-center gap-2">
                            <Icon className="h-4 w-4 text-muted-foreground" />
                            {formatEventTitle(event.event)} by {formatActorName(event.actor)}
                        </p>
                        {event.details && <p className="text-sm text-muted-foreground whitespace-pre-wrap ml-6 italic">"{event.details}"</p>}
                    </div>
                )
            })}
        </div>
    );
}

function HistorySection({ role }: { role: Role }) {
    const [history, setHistory] = useState<OneOnOneHistoryItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();

    // State for inline insight addressing
    const [addressingInsightId, setAddressingInsightId] = useState<string | null>(null);
    const [supervisorResponse, setSupervisorResponse] = useState('');
    const [isSubmittingResponse, setIsSubmittingResponse] = useState(false);

    // State for retry flow
    const [retryingInsightId, setRetryingInsightId] = useState<string | null>(null);
    const [retryResponse, setRetryResponse] = useState('');
    const [isSubmittingRetry, setIsSubmittingRetry] = useState(false);

    const fetchHistory = useCallback(async () => {
        setIsLoading(true);
        const historyData = await getOneOnOneHistory();
        
        const currentUser = roleUserMapping[role];
        
        const userHistory = historyData.filter(item => {
             // Show if user is direct participant (supervisor or employee)
             return item.supervisorName === currentUser.name || item.employeeName === currentUser.name;
        });
        
        setHistory(userHistory.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
        setIsLoading(false);
    }, [role]);

    useEffect(() => {
        fetchHistory();
        const handleDataUpdate = () => fetchHistory();
        window.addEventListener('storage', handleDataUpdate);
        window.addEventListener('feedbackUpdated', handleDataUpdate);
        return () => {
            window.removeEventListener('storage', handleDataUpdate);
            window.removeEventListener('feedbackUpdated', handleDataUpdate);
        }
    }, [fetchHistory]);

    const handleAddressInsightSubmit = async (itemToUpdate: OneOnOneHistoryItem) => {
        if (!supervisorResponse) return;
        setIsSubmittingResponse(true);

        try {
            await submitSupervisorInsightResponse(itemToUpdate.id, supervisorResponse);
            setSupervisorResponse("");
            setAddressingInsightId(null);
            toast({ title: "Response Submitted", description: "The employee will be asked to acknowledge the resolution." });
            fetchHistory(); // Re-fetch to update UI
        } catch (error) {
            console.error("Failed to submit response", error);
            toast({ variant: 'destructive', title: "Submission Failed", description: "Could not submit your response." });
        } finally {
            setIsSubmittingResponse(false);
        }
    };
    
    const handleRetrySubmit = async (itemToUpdate: OneOnOneHistoryItem) => {
        if (!retryResponse) return;
        setIsSubmittingRetry(true);
        try {
            await submitSupervisorRetry(itemToUpdate.id, retryResponse);
            toast({ title: "Follow-up Submitted", description: "Your notes have been logged and the employee has been notified to acknowledge again."});
            setRetryResponse('');
            setRetryingInsightId(null);
            fetchHistory();
        } catch (error) {
            console.error("Failed to submit retry", error);
            toast({ variant: 'destructive', title: "Submission Failed" });
        } finally {
            setIsSubmittingRetry(false);
        }
    };

    if (isLoading) {
        return <Skeleton className="h-24 w-full mt-8" />;
    }

    if (history.length === 0) {
        return (
             <div className="mt-12 text-center py-12 border-2 border-dashed rounded-lg">
                <History className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-semibold text-foreground">No Session History</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Your past 1-on-1 sessions and their analyses will appear here.
                </p>
            </div>
        );
    }

    return (
        <div className="mt-12">
            <h2 className="text-xl font-semibold mb-4 text-muted-foreground flex items-center gap-2">
                <History className="h-5 w-5" />
                Session History
            </h2>
            <Accordion type="single" collapsible className="w-full border rounded-lg">
                {history.map(item => {
                    const analysisResult = item.analysis;
                    const insight = analysisResult.criticalCoachingInsight;
                    const insightStatus = insight?.status;
                    const currentUserName = roleUserMapping[role].name;
                    
                    const isSupervisor = currentUserName === item.supervisorName;
                    const isEmployee = currentUserName === item.employeeName;

                    const canSupervisorAct = isSupervisor && insightStatus === 'open';
                    const canSupervisorRetry = isSupervisor && insightStatus === 'pending_supervisor_retry';
                    const finalDecisionEvent = insight?.auditTrail?.find(e => ["Assigned to Ombudsman", "Assigned to Grievance Office", "Logged Dissatisfaction & Closed"].includes(e.event));
                    const amCoachingNotes = item.analysis.criticalCoachingInsight?.auditTrail?.find(e => e.event === 'AM Coaching Notes')?.details;

                    const displayedMissedSignals = analysisResult?.missedSignals?.filter(
                        signal => signal !== analysisResult.criticalCoachingInsight?.summary
                    ) || [];

                    const getStatusBadge = () => {
                        if (!insight) return null;

                        if (finalDecisionEvent) {
                            let Icon = FileText;
                            let text = "Case Logged";
                            if (finalDecisionEvent.event.includes("Ombudsman")) { Icon = UserX; text = "Ombudsman"; }
                            if (finalDecisionEvent.event.includes("Grievance")) { Icon = UserPlus; text = "Grievance"; }
                            return <Badge className="bg-gray-700 text-white flex items-center gap-1.5"><Icon className="h-3 w-3" />{text}</Badge>;
                        }

                        switch(insightStatus) {
                            case 'open':
                                return <Badge variant="destructive" className="flex items-center gap-1.5"><AlertTriangle className="h-3 w-3" />Action Required</Badge>;
                            case 'pending_employee_acknowledgement':
                                return <Badge className="bg-blue-500 text-white flex items-center gap-1.5"><MessageCircleQuestion className="h-3 w-3" />Pending Ack</Badge>;
                             case 'pending_supervisor_retry':
                                return <Badge className="bg-purple-500 text-white flex items-center gap-1.5"><Repeat className="h-3 w-3" />Retry Required</Badge>;
                            case 'pending_am_review':
                                return <Badge className="bg-orange-500 text-white flex items-center gap-1.5"><AlertTriangle className="h-3 w-3" />Escalated to AM</Badge>;
                            case 'pending_manager_review':
                                return <Badge className="bg-red-700 text-white flex items-center gap-1.5"><Briefcase className="h-3 w-3" />Manager Review</Badge>;
                            case 'pending_hr_review':
                            case 'pending_final_hr_action':
                                return <Badge className="bg-black text-white flex items-center gap-1.5"><ShieldCheck className="h-3 w-3" />HR Review</Badge>;
                            case 'resolved':
                                return <Badge variant="success" className="flex items-center gap-1.5"><CheckCircle className="h-3 w-3" />Resolved</Badge>;
                            default:
                                return null;
                        }
                    }

                    return (
                        <AccordionItem value={item.id} key={item.id} className="border-b">
                            <AccordionTrigger className="px-4 py-3 w-full">
                                <div className="flex justify-between items-center w-full">
                                    <div className="text-left">
                                        <p className="font-medium">
                                            1-on-1 with {isSupervisor ? item.employeeName : item.supervisorName}
                                        </p>
                                        <p className="text-sm text-muted-foreground font-normal">
                                            {format(new Date(item.date), 'PPP')} ({formatDistanceToNow(new Date(item.date), { addSuffix: true })})
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-4 mr-2">
                                        {getStatusBadge()}
                                    </div>
                                </div>
                            </AccordionTrigger>
                            <AccordionContent className="space-y-6 pt-2 px-4 pb-4">
                                
                                {isSupervisor && (
                                    <div className="space-y-4">
                                        <div className="bg-muted/50 p-4 rounded-lg">
                                            <div className="flex justify-between items-center mb-2">
                                                <h4 className="font-semibold text-lg flex items-center gap-2 text-primary"><Bot />AI Analysis & Coaching Report</h4>
                                                <span 
                                                    className="text-xs text-muted-foreground font-mono cursor-text"
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    ID: {item.id}
                                                </span>
                                            </div>
                                            
                                            <div className="space-y-6 text-primary/90">
                                                {analysisResult.supervisorSummary && (
                                                    <div>
                                                        <h4 className="font-semibold text-foreground mb-2">Session Summary for Supervisor</h4>
                                                        <p className="whitespace-pre-wrap">{analysisResult.supervisorSummary}</p>
                                                    </div>
                                                )}
                                                
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div className="p-3 rounded-md bg-background/50 border">
                                                        <h4 className="font-semibold text-foreground flex items-center gap-2"><Star /> Leadership Score</h4>
                                                        <p className="text-2xl font-bold">{analysisResult.leadershipScore}/10</p>
                                                    </div>
                                                    <div className="p-3 rounded-md bg-background/50 border">
                                                        <h4 className="font-semibold text-foreground flex items-center gap-2"><BarChart /> Effectiveness Score</h4>
                                                        <p className="text-2xl font-bold">{analysisResult.effectivenessScore}/10</p>
                                                    </div>
                                                </div>

                                                {analysisResult.coachingImpactAnalysis && analysisResult.coachingImpactAnalysis.length > 0 && (
                                                    <div>
                                                        <h4 className="font-semibold text-foreground">Coaching Impact Analysis</h4>
                                                        <div className="mt-2 space-y-3">
                                                            {analysisResult.coachingImpactAnalysis.map((impact, i) => (
                                                                <div key={i} className={cn(
                                                                    "p-3 border rounded-md",
                                                                    impact.didApply ? "bg-green-500/10 border-green-500/20" : "bg-yellow-500/10 border-yellow-500/20"
                                                                )}>
                                                                    <p className={cn(
                                                                        "font-semibold flex items-center gap-2",
                                                                        impact.didApply ? "text-green-700 dark:text-green-400" : "text-yellow-700 dark:text-yellow-400"
                                                                    )}>
                                                                        {impact.didApply ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                                                                        {impact.didApply ? 'Learning Applied' : 'Missed Opportunity'}: {impact.goalArea}
                                                                    </p>
                                                                    <p className={cn(
                                                                        "text-sm mt-1 whitespace-pre-wrap",
                                                                        impact.didApply ? "text-green-600 dark:text-green-300" : "text-yellow-600 dark:text-yellow-300"
                                                                    )}>
                                                                        {impact.didApply ? impact.applicationExample : impact.missedOpportunityExample}
                                                                    </p>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                <div>
                                                    <h4 className="font-semibold text-foreground">Strengths Observed</h4>
                                                    <ul className="list-disc pl-5 mt-2 space-y-1">
                                                        {analysisResult.strengthsObserved.map((strength, i) => <li key={i}><strong>{strength.action}:</strong> "{strength.example}"</li>)}
                                                    </ul>
                                                </div>
                                                
                                                {analysisResult.coachingRecommendations.length > 0 && (
                                                    <div>
                                                        <h4 className="font-semibold text-foreground">Coaching Recommendations</h4>
                                                        <div className="mt-2 space-y-3">
                                                            {analysisResult.coachingRecommendations.map((rec, i) => (
                                                                <div key={i} className="p-3 border rounded-md bg-background/50">
                                                                    <p className="font-medium text-foreground">{rec.area}</p>
                                                                    <p className="text-sm text-muted-foreground mt-1">{rec.recommendation}</p>
                                                                    {rec.example && (
                                                                        <div className="mt-2 p-2 bg-muted/50 rounded-md border-l-2 border-primary">
                                                                            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5"><MessageSquareQuote className="h-4 w-4" /> Example</p>
                                                                            <blockquote className="mt-1 text-sm italic text-primary/90">"{rec.example}"</blockquote>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}


                                                <div>
                                                    <h4 className="font-semibold text-foreground">Action Items</h4>
                                                    <ul className="list-disc pl-5 mt-2 space-y-1">
                                                        {analysisResult.actionItems.map((item, i) => <li key={i}><strong>{item.owner}:</strong> {item.task} {item.deadline && `(by ${item.deadline})`}</li>)}
                                                    </ul>
                                                </div>
                                                
                                                {displayedMissedSignals.length > 0 && (
                                                     <div className="p-3 rounded-md bg-yellow-500/10 border border-yellow-500/20 mt-4">
                                                        <h4 className="font-semibold text-yellow-700 dark:text-yellow-400">Missed Signals</h4>
                                                         <ul className="list-disc pl-5 mt-2 space-y-1 text-yellow-600 dark:text-yellow-300">
                                                            {displayedMissedSignals.map((signal, i) => <li key={i}>{signal}</li>)}
                                                        </ul>
                                                    </div>
                                                )}

                                                {analysisResult.dataHandling && (
                                                    <div className="p-3 rounded-md bg-muted/50 border mt-4 text-xs text-muted-foreground">
                                                        <h4 className="font-semibold text-foreground flex items-center gap-2 mb-2"><DatabaseZap className="h-4 w-4" /> Data Handling</h4>
                                                        <div className="flex flex-wrap gap-x-4 gap-y-1">
                                                            <p className="flex items-center gap-1.5"><Clock className="h-3 w-3" /><strong>Analyzed:</strong> {format(new Date(analysisResult.dataHandling.analysisTimestamp), 'PPP p')}</p>
                                                            {analysisResult.dataHandling.recordingDeleted && (
                                                                <>
                                                                    <p className="flex items-center gap-1.5"><Timer className="h-3 w-3" /><strong>Session Duration:</strong> {analysisResult.dataHandling.deletionTimestamp}</p>
                                                                    <p className="flex items-center gap-1.5"><Clock className="h-3 w-3" /><strong>Recording Deleted:</strong> {format(new Date(analysisResult.dataHandling.deletionTimestamp), 'PPP p')}</p>
                                                                </>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}

                                            </div>
                                        </div>

                                        {insight && (
                                            <Card className="mt-4">
                                                <CardHeader>
                                                    <CardTitle className="font-semibold text-foreground flex items-center gap-2 text-lg">
                                                        <AlertTriangle className="h-5 w-5 text-destructive" />Critical Coaching Insight
                                                    </CardTitle>
                                                </CardHeader>
                                                <CardContent className="space-y-4">
                                                    <div className="space-y-4">
                                                        <p className="text-sm text-muted-foreground">{insight.summary}</p>
                                                        
                                                        {canSupervisorAct && (
                                                            <div className="mt-4">
                                                                {addressingInsightId !== item.id ? (
                                                                    <div className="flex items-center gap-4">
                                                                        <Button variant="destructive" onClick={() => setAddressingInsightId(item.id)}>
                                                                            Address Insight
                                                                        </Button>
                                                                        {insight.auditTrail && insight.auditTrail.length > 0 && (
                                                                            <SlaTimer expiryTimestamp={addHours(new Date(insight.auditTrail[0].timestamp), 48).getTime()} />
                                                                        )}
                                                                    </div>
                                                                ) : (
                                                                    <div className="space-y-2 bg-background/50 p-3 rounded-md">
                                                                        <Label htmlFor={`supervisor-response-${item.id}`} className="text-foreground font-semibold">
                                                                            How did you address this?
                                                                        </Label>
                                                                        <Textarea
                                                                            id={`supervisor-response-${item.id}`}
                                                                            value={supervisorResponse}
                                                                            onChange={(e) => setSupervisorResponse(e.target.value)}
                                                                            rows={4}
                                                                            className="bg-background"
                                                                        />
                                                                        <div className="flex gap-2">
                                                                            <Button
                                                                                onClick={() => handleAddressInsightSubmit(item)}
                                                                                disabled={isSubmittingResponse || !supervisorResponse}
                                                                            >
                                                                                {isSubmittingResponse && <Loader2 className="mr-2 animate-spin" />}
                                                                                Submit
                                                                            </Button>
                                                                            <Button variant="ghost" onClick={() => setAddressingInsightId(null)}>
                                                                                Cancel
                                                                            </Button>
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}
                                                        
                                                        {insight.auditTrail && <InsightAuditTrail trail={insight.auditTrail} />}

                                                        {canSupervisorRetry && (
                                                             <div className="mt-4 p-4 border rounded-lg bg-purple-500/10 space-y-4">
                                                                <h4 className="font-semibold text-lg text-purple-700 dark:text-purple-400">Action Required: Retry 1-on-1</h4>
                                                                
                                                                {amCoachingNotes && (
                                                                     <div className="p-3 bg-muted/80 rounded-md border">
                                                                        <p className="font-semibold text-foreground flex items-center gap-2"><MessageSquare className="h-4 w-4" />AM Coaching Notes ({formatActorName('AM')})</p>
                                                                        <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">{amCoachingNotes}</p>
                                                                    </div>
                                                                )}
                                                                
                                                                <p className="text-sm text-muted-foreground">
                                                                  Your AM has reviewed this case and coached you. Please re-engage with the employee to address their remaining concerns.
                                                                </p>

                                                                {retryingInsightId !== item.id ? (
                                                                    <Button className="bg-purple-600 hover:bg-purple-700 text-white" onClick={() => setRetryingInsightId(item.id)}>
                                                                        <Repeat className="mr-2 h-4 w-4" /> Log Retry Actions
                                                                    </Button>
                                                                ) : (
                                                                    <div className="space-y-2 bg-background/50 p-3 rounded-md">
                                                                        <Label htmlFor={`retry-response-${item.id}`} className="text-foreground font-semibold">
                                                                            Describe your follow-up actions
                                                                        </Label>
                                                                        <Textarea
                                                                            id={`retry-response-${item.id}`}
                                                                            value={retryResponse}
                                                                            onChange={(e) => setRetryResponse(e.target.value)}
                                                                            rows={4}
                                                                            className="bg-background"
                                                                        />
                                                                        <div className="flex gap-2">
                                                                            <Button
                                                                                onClick={() => handleRetrySubmit(item)}
                                                                                disabled={isSubmittingRetry || !retryResponse}
                                                                                className="bg-purple-600 hover:bg-purple-700 text-white"
                                                                            >
                                                                                {isSubmittingRetry && <Loader2 className="mr-2 animate-spin" />}
                                                                                Submit Follow-up
                                                                            </Button>
                                                                            <Button variant="ghost" onClick={() => setRetryingInsightId(null)}>
                                                                                Cancel
                                                                            </Button>
                                                                        </div>
                                                                    </div>
                                                                )}
                                                             </div>
                                                        )}
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        )}
                                    </div>
                                )}
                                
                                {isEmployee && (
                                     <Card>
                                        <CardHeader>
                                            <CardTitle className="font-semibold text-foreground flex items-center gap-2 text-lg">
                                                <EyeOff className="h-5 w-5" /> Employee View
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                             <p className="whitespace-pre-wrap text-sm text-muted-foreground">{analysisResult.employeeSummary}</p>
                                        
                                            {analysisResult.employeeSwotAnalysis && (
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 text-muted-foreground">
                                                    <div className="space-y-1">
                                                        <h5 className="font-medium flex items-center gap-1.5 text-green-600 dark:text-green-400"><Lightbulb className="h-4 w-4"/>Strengths</h5>
                                                        <ul className="list-disc pl-5 text-sm">
                                                            {analysisResult.employeeSwotAnalysis?.strengths.map((s, i) => <li key={i}>{s}</li>)}
                                                        </ul>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <h5 className="font-medium flex items-center gap-1.5 text-yellow-600 dark:text-yellow-400"><TrendingDown className="h-4 w-4"/>Weaknesses</h5>
                                                        <ul className="list-disc pl-5 text-sm">
                                                            {analysisResult.employeeSwotAnalysis?.weaknesses.map((s, i) => <li key={i}>{s}</li>)}
                                                        </ul>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <h5 className="font-medium flex items-center gap-1.5 text-blue-600 dark:text-blue-400"><BrainCircuit className="h-4 w-4"/>Opportunities</h5>
                                                        <ul className="list-disc pl-5 text-sm">
                                                            {analysisResult.employeeSwotAnalysis?.opportunities.map((s, i) => <li key={i}>{s}</li>)}
                                                        </ul>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <h5 className="font-medium flex items-center gap-1.5 text-red-600 dark:text-red-500"><ShieldCheck className="h-4 w-4"/>Threats</h5>
                                                        <ul className="list-disc pl-5 text-sm">
                                                           {analysisResult.employeeSwotAnalysis?.threats.map((s, i) => <li key={i}>{s}</li>)}
                                                        </ul>
                                                    </div>
                                                </div>
                                            )}
                                        </CardContent>
                                        
                                        {insight && (
                                            <>
                                                <CardHeader className="pt-0">
                                                    <CardTitle className="font-semibold text-foreground flex items-center gap-2 text-lg">
                                                        <AlertTriangle className="h-5 w-5" />Critical Insight & Resolution
                                                    </CardTitle>
                                                </CardHeader>
                                                <CardContent className="space-y-4">
                                                    <div className="space-y-3">
                                                        <div className="space-y-2">
                                                            <p className="font-semibold text-foreground text-sm">Initial Summary</p>
                                                            <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">{insight.summary}</p>
                                                        </div>
                                                        
                                                        {insight.auditTrail && <InsightAuditTrail trail={insight.auditTrail} />}
                                                    </div>
                                                    
                                                    {insight.status === 'pending_employee_acknowledgement' && (
                                                        <div className="mt-4 pt-4 border-t">
                                                            <p className="text-sm font-medium">
                                                                You have a pending action for this item. Please go to your <Link href="/messages" className="font-bold underline text-primary">Messages</Link> to respond.
                                                            </p>
                                                        </div>
                                                    )}
                                                </CardContent>
                                            </>
                                        )}
                                     </Card>
                                )}
                            </AccordionContent>
                        </AccordionItem>
                    );
                })}
            </Accordion>
        </div>
    );
}

function OneOnOnePage({ role }: { role: Role }) {
  const { meetings: upcomingMeetings, supervisor } = useMemo(() => getMeetingDataForRole(role), [role]);
  const [meetings, setMeetings] = useState(upcomingMeetings);
  const [isScheduleDialogOpen, setIsScheduleDialogOpen] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  
  const handleSchedule = (details: any) => {
    toast({
        title: "Meeting Scheduled!",
        description: "In a real app, this would save to a database."
    })
    setIsScheduleDialogOpen(false);
  }
  
  const handleCancelMeeting = (meetingId: number) => {
    toast({
        title: "Meeting Cancelled",
        description: `Meeting ${meetingId} has been removed.`,
    })
    setMeetings(meetings.filter(m => m.id !== m.id));
  }

  const handleStartMeeting = (meeting: Meeting) => {
    // Save meeting data to sessionStorage to pass it to the next page
    sessionStorage.setItem('current_1_on_1_meeting', JSON.stringify({ meeting, supervisor }));
    router.push('/1-on-1/feedback');
  };

  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':');
    const date = new Date();
    date.setHours(parseInt(hours, 10));
    date.setMinutes(parseInt(minutes, 10));
    return format(date, 'p');
  }

  return (
    <div className="p-4 md:p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold font-headline text-foreground">1-on-1s</h1>
        {['Team Lead', 'AM', 'Manager', 'HR Head'].includes(role) && (
            <Dialog open={isScheduleDialogOpen} onOpenChange={setIsScheduleDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <PlusCircle className="mr-2" />
                  Schedule New Meeting
                </Button>
              </DialogTrigger>
              <ScheduleMeetingDialog onSchedule={handleSchedule} />
            </Dialog>
        )}
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4 text-muted-foreground">Upcoming Meetings</h2>
        {meetings.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {meetings.map((meeting) => (
              <div key={meeting.id} className="border rounded-lg">
                <div className="flex items-center justify-between p-3 py-2">
                    <h3 className="text-lg font-semibold">{meeting.with}</h3>
                     {['Team Lead', 'AM', 'Manager', 'HR Head'].includes(role) && (
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon" onClick={() => handleStartMeeting(meeting)}>
                            <Video className="h-5 w-5" />
                          </Button>

                          <Dialog>
                            <DialogTrigger asChild>
                                <Button variant="ghost" size="icon">
                                    <CalendarCheck className="h-5 w-5" />
                                </Button>
                            </DialogTrigger>
                            <ScheduleMeetingDialog meetingToEdit={meeting} onSchedule={handleSchedule} />
                          </Dialog>
                          
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                                    <CalendarX className="h-5 w-5" />
                                </Button>
                            </AlertDialogTrigger>
                              <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will permanently cancel your meeting with {meeting.with} on {format(new Date(meeting.date), 'PPP')} at {formatTime(meeting.time)}. This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Go Back</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleCancelMeeting(meeting.id)} className={cn(buttonVariants({variant: 'destructive'}))}>
                                  Yes, Cancel
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                      </div>
                    )}
                </div>
                <div className="border-t p-3 py-2">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-5 w-5" />
                    <span>{format(new Date(meeting.date), 'MM/dd/yy')}</span>
                    <Clock className="h-5 w-5" />
                    <span>{formatTime(meeting.time)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 border-2 border-dashed rounded-lg">
            <p className="text-muted-foreground text-lg">No upcoming meetings.</p>
            {['Team Lead', 'AM', 'Manager', 'HR Head'].includes(role) && (
                <p className="text-sm text-muted-foreground mt-2">
                  Click "Schedule New Meeting" to get started.
                </p>
            )}
          </div>
        )}
      </div>
      
      <HistorySection role={role} />
      <ToDoSection role={role} />
    </div>
  );
}


export default function Home() {
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
    return <RoleSelection onSelectRole={setRole} />;
  }

  return (
    <DashboardLayout role={role} onSwitchRole={setRole}>
        <OneOnOnePage role={role} />
    </DashboardLayout>
  );
}
