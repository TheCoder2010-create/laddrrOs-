
"use client";

import { useState, useMemo, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { Role } from '@/hooks/use-role';
import { useRole } from '@/hooks/use-role';
import RoleSelection from '@/components/role-selection';
import DashboardLayout from '@/components/dashboard-layout';
import { Skeleton } from '@/components/ui/skeleton';
import { Button, buttonVariants } from '@/components/ui/button';
import { PlusCircle, Calendar, Clock, Video, CalendarCheck, CalendarX, History, AlertTriangle } from 'lucide-react';
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
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
  AlertDialogFooter,
} from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarIcon } from 'lucide-react';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { roleUserMapping } from '@/lib/role-mapping';
import { getOneOnOneHistory, OneOnOneHistoryItem, getAllFeedback } from '@/services/feedback-service';
import Link from 'next/link';

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

    const fetchHistory = useCallback(async () => {
        setIsLoading(true);
        const allHistory = await getOneOnOneHistory();
        const currentUser = roleUserMapping[role];
        
        // Filter history for the current user, either as supervisor or employee
        const userHistory = allHistory.filter(item => 
            item.supervisorName === currentUser.name || item.employeeName === currentUser.name
        );
        
        // Check for related critical feedback items to link alerts
        const allFeedback = await getAllFeedback();
        const userHistoryWithAlerts = userHistory.map(item => {
            const hasEscalationAlert = !!item.analysis.escalationAlert;
            if (!hasEscalationAlert) return { ...item, hasPendingAction: false };

            const relatedFeedback = allFeedback.find(fb => 
                fb.summary === item.analysis.escalationAlert && 
                (fb.supervisor === role || fb.employee === role)
            );

            const hasPendingAction = relatedFeedback?.status === 'Pending Supervisor Action' && relatedFeedback?.assignedTo === role;

            return {
                ...item,
                hasPendingAction,
            };
        });

        setHistory(userHistoryWithAlerts as any);
        setIsLoading(false);
    }, [role]);

    useEffect(() => {
        fetchHistory();
        window.addEventListener('storage', fetchHistory);
        window.addEventListener('feedbackUpdated', fetchHistory); // Listen for custom event
        return () => {
            window.removeEventListener('storage', fetchHistory);
            window.removeEventListener('feedbackUpdated', fetchHistory);
        }
    }, [fetchHistory]);

    if (isLoading) {
        return <Skeleton className="h-24 w-full mt-8" />;
    }

    if (history.length === 0) {
        return null; // Don't show the section if there's no history
    }

    return (
        <div className="mt-12">
            <h2 className="text-xl font-semibold mb-4 text-muted-foreground flex items-center gap-2">
                <History className="h-5 w-5" />
                Session History
            </h2>
            <Accordion type="single" collapsible className="w-full border rounded-lg">
                {history.map(item => (
                    <AccordionItem value={item.id} key={item.id} className="px-4">
                        <AccordionTrigger>
                            <div className="flex justify-between items-center w-full pr-4">
                                <div className="text-left">
                                    <p className="font-medium">
                                        1-on-1 with {role === item.supervisorName ? item.employeeName : item.supervisorName}
                                    </p>
                                    <p className="text-sm text-muted-foreground font-normal">
                                        {format(new Date(item.date), 'PPP')} ({formatDistanceToNow(new Date(item.date), { addSuffix: true })})
                                    </p>
                                </div>
                                 {item.analysis.escalationAlert && (
                                    <div className={cn("flex items-center gap-2", (item as any).hasPendingAction ? "text-destructive" : "text-muted-foreground")}>
                                        <AlertTriangle className="h-5 w-5" />
                                        <span className="hidden md:inline">Critical Insight</span>
                                    </div>
                                )}
                            </div>
                        </AccordionTrigger>
                        <AccordionContent className="space-y-4 pt-2">
                            {(item as any).hasPendingAction && (
                                <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20 text-center">
                                    <h4 className="font-semibold text-destructive">Action Required</h4>
                                    <p className="text-destructive/90 text-sm mb-2">{item.analysis.escalationAlert}</p>
                                     <Button variant="destructive" size="sm" asChild>
                                        <Link href="/action-items">Address Insight</Link>
                                    </Button>
                                </div>
                            )}
                             {!((item as any).hasPendingAction) && item.analysis.escalationAlert && (
                                <div className="p-3 rounded-md bg-muted/50 border">
                                    <h4 className="font-semibold text-muted-foreground">Critical Insight Logged</h4>
                                    <p className="text-muted-foreground text-sm">{item.analysis.escalationAlert}</p>
                                </div>
                             )}

                            <div>
                                <h4 className="font-semibold">Key Themes</h4>
                                <ul className="list-disc pl-5 text-muted-foreground text-sm">
                                    {item.analysis.keyThemes.map((theme, i) => <li key={i}>{theme}</li>)}
                                </ul>
                            </div>
                             <div>
                                <h4 className="font-semibold">Action Items</h4>
                                <ul className="list-disc pl-5 text-muted-foreground text-sm">
                                    {item.analysis.actionItems.map((action, i) => <li key={i}>{action}</li>)}
                                </ul>
                            </div>
                            {item.analysis.coachingImpactAnalysis && (
                                 <div>
                                    <h4 className="font-semibold">Coaching Impact Analysis</h4>
                                    <p className="text-muted-foreground text-sm">{item.analysis.coachingImpactAnalysis}</p>
                                </div>
                            )}
                        </AccordionContent>
                    </AccordionItem>
                ))}
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
