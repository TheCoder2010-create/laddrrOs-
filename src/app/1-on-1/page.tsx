
"use client";

import { useRole } from '@/hooks/use-role';
import RoleSelection from '@/components/role-selection';
import DashboardLayout from '@/components/dashboard-layout';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { PlusCircle, Calendar, Clock, Video } from 'lucide-react';
import { format } from 'date-fns';

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


function OneOnOnePage() {
  return (
    <div className="p-4 md:p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold font-headline text-foreground">1-on-1s</h1>
        <Button>
          <PlusCircle className="mr-2" />
          Schedule New Meeting
        </Button>
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
                  <Button className="w-full" variant="secondary">
                    <Video className="mr-2" />
                    Join Meeting
                  </Button>
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
