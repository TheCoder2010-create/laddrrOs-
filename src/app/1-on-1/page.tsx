
"use client";

import { useState } from 'react';
import { useRole } from '@/hooks/use-role';
import RoleSelection from '@/components/role-selection';
import DashboardLayout from '@/components/dashboard-layout';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { PlusCircle, Calendar, Clock, Video, X } from 'lucide-react';
import { format } from 'date-fns';
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

const upcomingMeetings = [
  {
    id: 1,
    with: 'Alex Smith',
    role: 'Manager',
    avatar: {
      src: 'https://placehold.co/100x100.png',
      fallback: 'AS',
      hint: 'manager avatar',
    },
    date: new Date(new Date().setDate(new Date().getDate() + 2)),
    time: '10:00 AM',
  },
  {
    id: 2,
    with: 'Alex Smith',
    role: 'Manager',
    avatar: {
      src: 'https://placehold.co/100x100.png',
      fallback: 'AS',
      hint: 'manager avatar',
    },
    date: new Date(new Date().setDate(new Date().getDate() + 9)),
    time: '2:30 PM',
  },
];

function ScheduleMeetingDialog() {
  const [date, setDate] = useState<Date>();

  const handleSchedule = () => {
    // In a real app, this would save the meeting
    console.log("Meeting scheduled!");
    // You would typically close the dialog here
  }

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Schedule New 1-on-1</DialogTitle>
        <DialogDescription>
          Select a participant, date, and time for your meeting.
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-4 py-4">
        <div className="space-y-2">
          <Label htmlFor="participant">Participant</Label>
          <Input id="participant" placeholder="Enter name..." />
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
          <Input id="time" type="time" />
        </div>
      </div>
      <DialogFooter>
        <DialogClose asChild>
          <Button type="button" variant="secondary">
            Cancel
          </Button>
        </DialogClose>
        <DialogClose asChild>
            <Button type="submit" onClick={handleSchedule}>Schedule</Button>
        </DialogClose>
      </DialogFooter>
    </DialogContent>
  )
}

function OneOnOnePage() {
  return (
    <div className="p-4 md:p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold font-headline text-foreground">1-on-1s</h1>
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2" />
              Schedule New Meeting
            </Button>
          </DialogTrigger>
          <ScheduleMeetingDialog />
        </Dialog>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4 text-muted-foreground">Upcoming Meetings</h2>
        {upcomingMeetings.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {upcomingMeetings.map((meeting) => (
              <Card key={meeting.id} className="flex flex-col">
                <CardHeader>
                  <div className="flex items-center gap-4">
                     <Avatar className="h-12 w-12">
                        <AvatarImage src={meeting.avatar.src} alt={meeting.with} data-ai-hint={meeting.avatar.hint} />
                        <AvatarFallback>{meeting.avatar.fallback}</AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-xl">{meeting.with}</CardTitle>
                      <p className="text-muted-foreground">{meeting.role}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex-grow space-y-3">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-5 w-5" />
                    <span>{format(meeting.date, 'EEEE, MMMM d')}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="h-5 w-5" />
                    <span>{meeting.time}</span>
                  </div>
                </CardContent>
                <CardFooter>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                       <Button className="w-full" variant="secondary">
                        <Video className="mr-2" />
                        Join Meeting
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Ready to join?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action will open the video conference link for your meeting with {meeting.with}.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => console.log('Joining meeting...')}>
                          Join
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </CardFooter>
              </Card>
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
        <OneOnOnePage />
    </DashboardLayout>
  );
}
