"use client";

import { useRole } from '@/hooks/use-role';
import RoleSelection from '@/components/role-selection';
import DashboardLayout from '@/components/dashboard-layout';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

function VoiceInSilencePage() {
  return (
    <div className="p-4 md:p-8">
      <h1 className="text-3xl font-bold font-headline mb-6 text-foreground">Voice – in Silence</h1>
      <Card>
        <CardHeader>
          <CardTitle>Welcome</CardTitle>
        </CardHeader>
        <CardContent>
          <p>This is the page for "Voice – in Silence". Content can be added here.</p>
        </CardContent>
      </Card>
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
        <VoiceInSilencePage />
    </DashboardLayout>
  );
}
