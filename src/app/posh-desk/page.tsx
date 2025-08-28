
"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRole } from '@/hooks/use-role';
import DashboardLayout from '@/components/dashboard-layout';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Scale, PlusCircle, AlertTriangle, CheckCircle } from 'lucide-react';
import { PoshComplaint, getAllPoshComplaints, PoshAuditEvent } from '@/services/posh-service';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { formatActorName } from '@/lib/role-mapping';
import { Label } from '@/components/ui/label';

function PoshCaseHistory({ trail }: { trail: PoshAuditEvent[] }) {
    if (!trail || trail.length === 0) return null;

    return (
        <div className="space-y-2">
            <h4 className="font-semibold">Case History</h4>
            <div className="relative p-4 border rounded-md bg-muted/50">
                <div className="absolute left-8 top-8 bottom-8 w-px bg-border -translate-x-1/2"></div>
                <div className="space-y-4">
                    {trail.map((event, index) => {
                        return (
                            <div key={index} className="flex items-start gap-4 relative">
                                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-background border flex items-center justify-center z-10">
                                    <CheckCircle className="h-5 w-5 text-muted-foreground" />
                                </div>
                                <div className="flex-1 -mt-1">
                                    <p className="font-medium text-sm">
                                        {event.event} by <span className="text-primary">{formatActorName(event.actor)}</span>
                                    </p>
                                    <p className="text-xs text-muted-foreground">{format(new Date(event.timestamp), "PPP p")}</p>
                                    {event.details && <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">{event.details}</p>}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

function PoshDeskContent() {
    const [complaints, setComplaints] = useState<PoshComplaint[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchComplaints = useCallback(async () => {
        setIsLoading(true);
        const data = await getAllPoshComplaints();
        setComplaints(data);
        setIsLoading(false);
    }, []);

    useEffect(() => {
        fetchComplaints();
        const handleStorageChange = () => fetchComplaints();
        window.addEventListener('storage', handleStorageChange);
        window.addEventListener('poshComplaintUpdated', handleStorageChange);

        return () => {
            window.removeEventListener('storage', handleStorageChange);
            window.removeEventListener('poshComplaintUpdated', handleStorageChange);
        };
    }, [fetchComplaints]);

    const renderDetail = (label: string, value?: string | null | Date) => {
        if (!value) return null;
        const displayValue = value instanceof Date ? format(value, 'PPP') : value;
        return (
            <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{label}</p>
                <p className="text-sm text-foreground">{displayValue}</p>
            </div>
        );
    };

    return (
      <div className="p-4 md:p-8 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl font-bold font-headline mb-2 text-foreground flex items-center gap-3">
              <Scale className="h-8 w-8" />
              POSH Desk
            </CardTitle>
            <CardDescription className="text-lg text-muted-foreground">
              Internal Complaints Committee (ICC) master dashboard for managing all POSH cases.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
                <Skeleton className="h-40 w-full" />
            ) : complaints.length === 0 ? (
                 <div className="text-center py-12 border-2 border-dashed rounded-lg">
                    <p className="text-muted-foreground text-lg">No active cases.</p>
                    <p className="text-sm text-muted-foreground mt-2">
                        New complaints will appear here as they are submitted.
                    </p>
                </div>
            ) : (
                <Accordion type="single" collapsible className="w-full space-y-2">
                    {complaints.map((complaint) => (
                        <AccordionItem value={complaint.caseId} key={complaint.caseId} className="border rounded-lg">
                             <AccordionTrigger className="px-4 py-3 hover:no-underline">
                                <div className="flex justify-between items-center w-full">
                                    <div className="text-left">
                                        <p className="font-medium text-foreground">{complaint.title}</p>
                                        <p className="text-sm text-muted-foreground">
                                            Case #{complaint.caseId.substring(0, 8)}...
                                        </p>
                                    </div>
                                    <Badge variant={complaint.caseStatus === 'New' ? 'destructive' : 'secondary'}>
                                        {complaint.caseStatus}
                                    </Badge>
                                </div>
                            </AccordionTrigger>
                            <AccordionContent className="p-4 border-t space-y-6">
                               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
                                        <h3 className="font-semibold text-foreground">Complainant</h3>
                                        {renderDetail("Name", complaint.complainantInfo.name)}
                                        {renderDetail("Department", complaint.complainantInfo.department)}
                                    </div>
                                    <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
                                        <h3 className="font-semibold text-foreground">Respondent</h3>
                                        {renderDetail("Name", complaint.respondentInfo.name)}
                                        {renderDetail("Details", complaint.respondentInfo.details)}
                                    </div>
                                    <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
                                        <h3 className="font-semibold text-foreground">Incident</h3>
                                        {renderDetail("Date", complaint.dateOfIncident)}
                                        {renderDetail("Location", complaint.location)}
                                    </div>
                                </div>
                                
                                <div>
                                    <h4 className="font-semibold">Incident Details</h4>
                                    <p className="text-sm text-muted-foreground whitespace-pre-wrap mt-1 border p-3 rounded-md bg-background">
                                        {complaint.incidentDetails}
                                    </p>
                                </div>

                                {complaint.priorHistory.hasPriorIncidents && (
                                     <div>
                                        <h4 className="font-semibold flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-orange-500" />Prior Incidents</h4>
                                        <p className="text-sm text-muted-foreground whitespace-pre-wrap mt-1 border p-3 rounded-md bg-orange-500/10">
                                            {complaint.priorHistory.priorIncidentsDetails}
                                        </p>
                                    </div>
                                )}
                                {complaint.priorHistory.hasPriorComplaints && (
                                     <div>
                                        <h4 className="font-semibold flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-orange-500" />Prior Complaints</h4>
                                        <p className="text-sm text-muted-foreground whitespace-pre-wrap mt-1 border p-3 rounded-md bg-orange-500/10">
                                            {complaint.priorHistory.priorComplaintsDetails}
                                        </p>
                                    </div>
                                )}
                                
                                <PoshCaseHistory trail={complaint.auditTrail} />
                                
                                <div className="pt-4 border-t">
                                    <h3 className="font-semibold text-lg text-foreground">ICC Actions (Placeholder)</h3>
                                    <p className="text-sm text-muted-foreground">
                                        The interactive status checklist and action panel will be built here in the next step.
                                    </p>
                                </div>

                            </AccordionContent>
                        </AccordionItem>
                    ))}
                </Accordion>
            )}
          </CardContent>
        </Card>
      </div>
    )
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

    if (role !== 'ICC Head') {
      return (
        <DashboardLayout role={role} onSwitchRole={setRole}>
          <div className="p-4 md:p-8">
            <Card>
              <CardHeader>
                <CardTitle>Access Denied</CardTitle>
                <CardDescription>You do not have permission to view the POSH Desk. This view is for the ICC Head. ICC Members will see their assigned cases here.</CardDescription>
              </CardHeader>
            </Card>
          </div>
        </DashboardLayout>
      )
    }
  
    return (
        <DashboardLayout role={role} onSwitchRole={setRole}>
            <PoshDeskContent />
        </DashboardLayout>
    );
}
