
"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRole, availableRolesForAssignment, type Role } from '@/hooks/use-role';
import DashboardLayout from '@/components/dashboard-layout';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Scale, PlusCircle, AlertTriangle, CheckCircle, Users, ChevronDown, Send, Loader2 } from 'lucide-react';
import { PoshComplaint, getAllPoshComplaints, PoshAuditEvent, assignPoshCase, addPoshInternalNote } from '@/services/posh-service';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { formatActorName } from '@/lib/role-mapping';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { DropdownMenu, DropdownMenuContent, DropdownMenuCheckboxItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { CustomSwitch } from '@/components/ui/custom-switch';


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

function ActionPanel({ complaint, onUpdate }: { complaint: PoshComplaint, onUpdate: () => void }) {
    const { role } = useRole();
    const { toast } = useToast();

    const [assignees, setAssignees] = useState<Role[]>([]);
    const [assignmentComment, setAssignmentComment] = useState('');
    const [isAssigning, setIsAssigning] = useState(false);
    const [isUnassignMode, setIsUnassignMode] = useState(false);

    const [note, setNote] = useState('');
    const [isAddingNote, setIsAddingNote] = useState(false);

    useEffect(() => {
        setAssignees([]);
    }, [isUnassignMode]);
    
    const handleAssigneeChange = (role: Role) => {
        setAssignees(prev => 
            prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]
        );
    };

    const handleAssign = async () => {
        if (!role || assignees.length === 0) return;
        setIsAssigning(true);
        try {
            await assignPoshCase(complaint.caseId, assignees, role, isUnassignMode ? 'unassign' : 'assign', assignmentComment);
            toast({ title: `Case ${isUnassignMode ? 'Unassigned' : 'Assigned'}`, description: `Case has been updated for ${assignees.join(', ')}.`});
            onUpdate();
            setAssignees([]);
            setAssignmentComment('');
        } catch (error) {
            toast({ variant: 'destructive', title: 'Assignment Failed' });
        } finally {
            setIsAssigning(false);
        }
    };
    
    const handleAddNote = async () => {
        if (!role || !note) return;
        setIsAddingNote(true);
        try {
            await addPoshInternalNote(complaint.caseId, note, role);
            toast({ title: 'Note Added', description: 'Your internal note has been saved.' });
            setNote('');
            onUpdate();
        } catch (error) {
            toast({ variant: 'destructive', title: 'Failed to Add Note' });
        } finally {
            setIsAddingNote(false);
        }
    }

    const assignableRolesForDropdown = isUnassignMode 
        ? (complaint.assignedTo || []) 
        : availableRolesForAssignment.filter(r => r === 'ICC Member' && !complaint.assignedTo?.includes(r));
    
    return (
        <div className="pt-4 border-t">
            <h3 className="font-semibold text-lg text-foreground mb-4">ICC Actions</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3 p-4 border rounded-lg bg-background">
                    <Label className="font-semibold text-base">{isUnassignMode ? 'Unassign Case' : 'Assign Case'}</Label>
                    <div className="flex items-center justify-between">
                        <CustomSwitch id="assign-mode-switch" checked={isUnassignMode} onCheckedChange={setIsUnassignMode} />
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="justify-between"
                                  disabled={isUnassignMode && (!complaint.assignedTo || complaint.assignedTo.length === 0)}
                                >
                                    <span>{assignees.length > 0 ? assignees.join(', ') : 'Select Member(s)'}</span>
                                    <ChevronDown className="ml-2 h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-auto" align="end">
                                {assignableRolesForDropdown.map(r => (
                                    <DropdownMenuCheckboxItem
                                        key={r}
                                        checked={assignees.includes(r)}
                                        onCheckedChange={() => handleAssigneeChange(r)}
                                        onSelect={(e) => e.preventDefault()}
                                    >
                                        {r}
                                    </DropdownMenuCheckboxItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                     <p className="text-xs text-muted-foreground">
                        {complaint.assignedTo && complaint.assignedTo.length > 0 && (
                            <span className="block">
                                Currently: <span className="font-semibold text-primary">{complaint.assignedTo.join(', ')}</span>
                            </span>
                        )}
                    </p>
                    <div className="relative">
                         <Textarea 
                            placeholder="Add an assignment note..."
                            value={assignmentComment}
                            onChange={(e) => setAssignmentComment(e.target.value)}
                            className="w-full text-sm pr-12 pb-12"
                            rows={2}
                        />
                         <Button onClick={handleAssign} disabled={assignees.length === 0 || isAssigning} size="icon" className="absolute bottom-2 right-2 h-7 w-7 rounded-full">
                            {isAssigning ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4"/>}
                        </Button>
                    </div>
                </div>

                <div className="space-y-3 p-4 border rounded-lg bg-background">
                     <Label className="font-semibold text-base">Add Internal Note</Label>
                     <p className="text-sm text-muted-foreground">Add a private note to the case history, visible only to the ICC.</p>
                     <div className="relative">
                        <Textarea 
                            value={note} 
                            onChange={(e) => setNote(e.target.value)}
                            placeholder="Your private notes..."
                            rows={3}
                            className="pr-12"
                        />
                        <Button onClick={handleAddNote} disabled={isAddingNote || !note} size="icon" className="absolute top-2 right-2 h-7 w-7 rounded-full">
                            {isAddingNote ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                        </Button>
                     </div>
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

    const handleUpdate = useCallback(() => {
        fetchComplaints();
    }, [fetchComplaints]);

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
                                    <div className="flex items-center gap-4">
                                        {complaint.assignedTo.length > 0 && (
                                            <Badge variant="outline" className="hidden md:flex items-center gap-2">
                                                <Users className="h-3 w-3" />
                                                {complaint.assignedTo.join(', ')}
                                            </Badge>
                                        )}
                                        <Badge variant={complaint.caseStatus === 'New' ? 'destructive' : 'secondary'}>
                                            {complaint.caseStatus}
                                        </Badge>
                                    </div>
                                </div>
                            </AccordionTrigger>
                            <AccordionContent className="p-4 border-t space-y-6">
                               <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-6">
                                    {renderDetail("Complainant", complaint.complainantInfo.name)}
                                    {renderDetail("Complainant Dept", complaint.complainantInfo.department)}
                                    {renderDetail("Respondent", complaint.respondentInfo.name)}
                                    {renderDetail("Respondent Details", complaint.respondentInfo.details)}
                                    {renderDetail("Incident Date", complaint.dateOfIncident)}
                                    {renderDetail("Incident Location", complaint.location)}
                                </div>
                                
                                <div className="pt-4 space-y-4">
                                    <div>
                                        <h4 className="font-semibold">Incident Details</h4>
                                        <div className="text-sm text-muted-foreground whitespace-pre-wrap mt-1 border p-3 rounded-md bg-background">
                                            {complaint.incidentDetails}
                                        </div>
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
                                </div>
                                
                                <PoshCaseHistory trail={complaint.auditTrail} />
                                
                                <ActionPanel complaint={complaint} onUpdate={handleUpdate} />

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

    if (!['ICC Head', 'ICC Member'].includes(role)) {
      return (
        <DashboardLayout role={role} onSwitchRole={setRole}>
          <div className="p-4 md:p-8">
            <Card>
              <CardHeader>
                <CardTitle>Access Denied</CardTitle>
                <CardDescription>You do not have permission to view the POSH Desk. This view is for ICC members only.</CardDescription>
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
