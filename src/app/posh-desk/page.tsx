
"use client";

import { useRole } from '@/hooks/use-role';
import DashboardLayout from '@/components/dashboard-layout';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Scale } from 'lucide-react';


function PoshDeskContent() {
    return (
        <div className="p-4 md:p-8">
            <Card>
                <CardHeader>
                    <CardTitle className="text-3xl font-bold font-headline mb-2 text-foreground flex items-center gap-3">
                        <Scale className="h-8 w-8" />
                        POSH Desk
                    </CardTitle>
                    <CardDescription className="text-lg text-muted-foreground">
                        This page is under construction. Content for managing POSH cases will be added here.
                    </CardDescription>
                </CardHeader>
            </Card>
        </div>
    );
}


export default function PoshDeskPage() {
    const { role, setRole, isLoading } = useRole();

    if (isLoading || !role) {
        return (
            <div className="p-4 md:p-8">
                <Skeleton className="h-screen w-full" />
            </div>
        )
    }

    const canAccessPage = role === 'ICC Head' || role === 'ICC Member';

    if (!canAccessPage) {
         return (
            <DashboardLayout role={role!} onSwitchRole={setRole}>
                <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] text-center p-4">
                  <Card className="max-w-md">
                      <CardHeader>
                          <CardTitle>Access Denied</CardTitle>
                          <CardDescription>You do not have permission to view this page.</CardDescription>
                      </CardHeader>
                      <CardContent>
                          <p>This page is restricted to ICC roles.</p>
                      </CardContent>
                  </Card>
              </div>
            </DashboardLayout>
        );
    }
  
    return (
        <DashboardLayout role={role} onSwitchRole={setRole}>
            <PoshDeskContent />
        </DashboardLayout>
    );
}
