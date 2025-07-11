
"use client";

import { useState, useMemo, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { Role } from '@/hooks/use-role';
import { useRole } from '@/hooks/use-role';
import RoleSelection from '@/components/role-selection';
import DashboardLayout from '@/components/dashboard-layout';
import { Skeleton } from '@/components/ui/skeleton';
import { Button, buttonVariants } from '@/components/ui/button';
import { PlusCircle, Calendar, Clock, Video, CalendarCheck, CalendarX, History, AlertTriangle, Send, Loader2, CheckCircle, MessageCircleQuestion } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
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
import { roleUserMapping, getRoleByName } from '@/lib/role-mapping';
import { getOneOnOneHistory, OneOnOneHistoryItem, submitSupervisorInsightResponse, submitEmployeeAcknowledgement } from '@/services/feedback-service';
import Link from 'next/link';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

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
          <Input id="participant" placeholder="Enter name..." value={participant} onChange={e => setParticipant(e.target.value)} />
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

function HistorySection({ role }: { role: Role }) {
    const [history, setHistory] = useState<OneOnOneHistoryItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();

    // State for inline insight addressing
    const [addressingInsightId, setAddressingInsightId] = useState<string | null>(null);
    const [supervisorResponse, setSupervisorResponse] = useState('');
    const [isSubmittingResponse, setIsSubmittingResponse] = useState(false);

    // State for employee acknowledgement
    const [employeeAcknowledgement, setEmployeeAcknowledgement] = useState('');
    const [isSubmittingAck, setIsSubmittingAck] = useState(false);


    const fetchHistory = useCallback(async () => {
        setIsLoading(true);
        const historyData = await getOneOnOneHistory();
        
        const currentUser = roleUserMapping[role];
        
        const userHistory = historyData.filter(item => {
             const supervisorRole = getRoleByName(item.supervisorName);
             const employeeRole = getRoleByName(item.employeeName);
             return item.supervisorName === currentUser.name || 
                    item.employeeName === currentUser.name || 
                    (role === 'AM' && (supervisorRole === 'Team Lead' || employeeRole === 'Team Lead')) ||
                    (role === 'Manager' && (supervisorRole === 'Team Lead' || employeeRole === 'Team Lead' || supervisorRole === 'AM' || employeeRole === 'AM'));
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
    
    const handleEmployeeAckSubmit = async (itemToUpdate: OneOnOneHistoryItem) => {
        if (!employeeAcknowledgement) return;
        setIsSubmittingAck(true);

        try {
            await submitEmployeeAcknowledgement(itemToUpdate.id, employeeAcknowledgement);
            setEmployeeAcknowledgement("");
            toast({ title: "Acknowledgement Submitted", description: "Thank you for your feedback. This insight is now resolved." });
            fetchHistory(); // Re-fetch to update UI
        } catch (error) {
            console.error("Failed to submit acknowledgement", error);
            toast({ variant: 'destructive', title: "Submission Failed", description: "Could not submit your acknowledgement." });
        } finally {
            setIsSubmittingAck(false);
        }
    };


    if (isLoading) {
        return <Skeleton className="h-24 w-full mt-8" />;
    }

    if (history.length === 0) {
        return null;
    }

    return (
        <div className="mt-12">
            <h2 className="text-xl font-semibold mb-4 text-muted-foreground flex items-center gap-2">
                <History className="h-5 w-5" />
                Session History
            </h2>
            <Accordion type="single" collapsible className="w-full border rounded-lg">
                {history.map(item => {
                    const insight = item.analysis.criticalCoachingInsight;
                    if (!insight) return null;
                    
                    const insightStatus = insight.status || 'open';
                    const currentUserName = roleUserMapping[role].name;
                    
                    const isSupervisor = currentUserName === item.supervisorName;
                    const isEmployee = currentUserName === item.employeeName;

                    const canSupervisorAct = isSupervisor && insightStatus === 'open';
                    const canEmployeeRespond = isEmployee && insightStatus === 'pending_employee_acknowledgement';
                    
                    const getStatusBadge = () => {
                        switch(insightStatus) {
                            case 'open':
                                if (isSupervisor) {
                                    return <Badge variant="destructive" className="flex items-center gap-1.5"><AlertTriangle className="h-3 w-3" />Action Required</Badge>;
                                }
                                return null;
                            case 'pending_employee_acknowledgement':
                                return <Badge className="flex items-center gap-1.5"><MessageCircleQuestion className="h-3 w-3" />Pending Acknowledgement</Badge>
                            case 'resolved':
                                return <Badge variant="success" className="flex items-center gap-1.5"><CheckCircle className="h-3 w-3" />Resolved</Badge>;
                            default:
                                return null;
                        }
                    }

                    return (
                        <AccordionItem value={item.id} key={item.id} className="px-4">
                            <AccordionTrigger>
                                <div className="flex justify-between items-center w-full pr-4">
                                    <div className="text-left">
                                        <p className="font-medium">
                                            1-on-1 with {isSupervisor ? item.employeeName : item.supervisorName}
                                        </p>
                                        <p className="text-sm text-muted-foreground font-normal">
                                            {format(new Date(item.date), 'PPP')} ({formatDistanceToNow(new Date(item.date), { addSuffix: true })})
                                        </p>
                                    </div>
                                    <div className="hidden md:flex items-center gap-2">
                                        {getStatusBadge()}
                                    </div>
                                </div>
                            </AccordionTrigger>
                            <AccordionContent className="space-y-4 pt-2">
                                
                                <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20">
                                    <h4 className="font-semibold text-destructive flex items-center gap-2">
                                       <AlertTriangle className="h-4 w-4" />Critical Coaching Insight
                                    </h4>
                                    <p className="text-destructive/90 my-2">{insight.summary}</p>
                                    
                                    {/* Supervisor's action form */}
                                    {canSupervisorAct && (
                                        <div className="mt-4">
                                            {addressingInsightId !== item.id ? (
                                                <Button variant="destructive" onClick={() => setAddressingInsightId(item.id)}>
                                                    Address Insight
                                                </Button>
                                            ) : (
                                                <div className="space-y-2 bg-background/50 p-3 rounded-md">
                                                    <Label htmlFor={`supervisor-response-${item.id}`} className="text-foreground font-semibold">
                                                        How did you address this?
                                                    </Label>
                                                    <Textarea
                                                        id={`supervisor-response-${item.id}`}
                                                        value={supervisorResponse}
                                                        onChange={(e) => setSupervisorResponse(e.target.value)}
                                                        placeholder="Explain the actions you took to resolve this concern..."
                                                        rows={4}
                                                        className="bg-background"
                                                    />
                                                    <div className="flex gap-2">
                                                        <Button
                                                            onClick={() => handleAddressInsightSubmit(item)}
                                                            disabled={isSubmittingResponse || !supervisorResponse}
                                                        >
                                                            {isSubmittingResponse && <Loader2 className="mr-2 animate-spin" />}
                                                            Submit for Acknowledgement
                                                        </Button>
                                                        <Button variant="ghost" onClick={() => setAddressingInsightId(null)}>
                                                            Cancel
                                                        </Button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Display supervisor's response when pending or resolved */}
                                    {insight.supervisorResponse && (
                                         <div className="mt-4 p-3 bg-muted/80 rounded-md border">
                                            <p className="font-semibold text-foreground">Supervisor's Response</p>
                                            <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">{insight.supervisorResponse}</p>
                                        </div>
                                    )}

                                    {/* Employee's acknowledgement form */}
                                    {canEmployeeRespond && (
                                        <div className="mt-4 p-3 bg-blue-500/10 rounded-md border border-blue-500/20 space-y-3">
                                            <Label className="font-semibold text-blue-700 dark:text-blue-400">Your Acknowledgement is Requested</Label>
                                            <p className="text-sm text-blue-600 dark:text-blue-300">
                                                Your supervisor has responded to the concern raised. Please review their notes and provide your feedback on the resolution.
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
                                                    onClick={() => handleEmployeeAckSubmit(item)}
                                                    disabled={isSubmittingAck || !employeeAcknowledgement}
                                                    className="bg-blue-600 hover:bg-blue-700 text-white"
                                                >
                                                    {isSubmittingAck && <Loader2 className="mr-2 animate-spin" />}
                                                    Submit Acknowledgement
                                                </Button>
                                            </div>
                                        </div>
                                    )}

                                    {/* Display employee's acknowledgement when resolved */}
                                    {insight.employeeAcknowledgement && (
                                         <div className="mt-4 p-3 bg-green-500/10 rounded-md border border-green-500/20">
                                            <p className="font-semibold text-green-700 dark:text-green-400">Your Acknowledgement</p>
                                            <p className="text-sm text-green-600 dark:text-green-300 mt-1 whitespace-pre-wrap">{insight.employeeAcknowledgement}</p>
                                        </div>
                                    )}
                                </div>
                                
                                <div>
                                    <h4 className="font-semibold">Summary</h4>
                                    <p className="text-muted-foreground text-sm whitespace-pre-wrap">{item.analysis.summary}</p>
                                </div>

                                {item.analysis.strengthsObserved && item.analysis.strengthsObserved.length > 0 && (
                                    <div>
                                        <h4 className="font-semibold">Strengths Observed</h4>
                                        <ul className="list-disc pl-5 text-muted-foreground text-sm">
                                            {item.analysis.strengthsObserved.map((strength, i) => <li key={i}><strong>{strength.action}:</strong> "{strength.example}"</li>)}
                                        </ul>
                                    </div>
                                )}
                                
                                {item.analysis.coachingRecommendations && item.analysis.coachingRecommendations.length > 0 && (
                                    <div>
                                        <h4 className="font-semibold">Coaching Recommendations</h4>
                                        <ul className="list-disc pl-5 text-muted-foreground text-sm">
                                            {item.analysis.coachingRecommendations.map((rec, i) => <li key={i}><strong>{rec.recommendation}:</strong> {rec.reason}</li>)}
                                        </ul>
                                    </div>
                                )}

                                {item.analysis.actionItems && item.analysis.actionItems.length > 0 && (
                                    <div>
                                        <h4 className="font-semibold">Action Items</h4>
                                        <ul className="list-disc pl-5 text-muted-foreground text-sm">
                                            {item.analysis.actionItems.map((action, i) => <li key={i}><strong>{action.owner}:</strong> {action.task}</li>)}
                                        </ul>
                                    </div>
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
    setMeetings(meetings.filter(m => m.id !== meetingId));
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
        <Dialog open={isScheduleDialogOpen} onOpenChange={setIsScheduleDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2" />
              Schedule New Meeting
            </Button>
          </DialogTrigger>
          <ScheduleMeetingDialog onSchedule={handleSchedule} />
        </Dialog>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4 text-muted-foreground">Upcoming Meetings</h2>
        {meetings.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {meetings.map((meeting) => (
              <div key={meeting.id} className="border rounded-lg">
                <div className="flex items-center justify-between p-3 py-2">
                    <h3 className="text-lg font-semibold">{meeting.with}</h3>
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
            <p className="text-sm text-muted-foreground mt-2">
              Click "Schedule New Meeting" to get started.
            </p>
          </div>
        )}
      </div>

      <HistorySection role={role} />
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

    