
"use client";

import { useRole } from '@/hooks/use-role';
import DashboardLayout from '@/components/dashboard-layout';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { HeartPulse } from 'lucide-react';

function OrgHealthContent() {
  return (
    <div className="p-4 md:p-8">
        <Card>
            <CardHeader>
                <CardTitle className="text-3xl font-bold font-headline flex items-center gap-3">
                    <HeartPulse className="h-8 w-8 text-primary" />
                    Org Health
                </CardTitle>
                <CardDescription className="text-lg text-muted-foreground">
                    This space will contain widgets and data related to the overall health of the organization.
                </CardDescription>
            </CardHeader>
        </Card>
    </div>
  );
}


export default function OrgHealthPage() {
  const { role, setRole, isLoading } = useRole();

  if (isLoading || !role) {
    return (
      <DashboardLayout role="HR Head" onSwitchRole={() => {}}>
        <Skeleton className="w-full h-screen" />
      </DashboardLayout>
    );
  }

  if (role !== 'HR Head') {
    return (
      <DashboardLayout role={role} onSwitchRole={setRole}>
        <div className="p-8 text-center">
            <h1 className="text-2xl font-bold">Access Denied</h1>
            <p className="text-muted-foreground mt-2">This page is only available for the HR Head role.</p>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout role={role} onSwitchRole={setRole}>
      <OrgHealthContent />
    </DashboardLayout>
  );
}
