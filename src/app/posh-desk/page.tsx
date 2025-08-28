
"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRole, availableRolesForAssignment, type Role } from '@/hooks/use-role';
import DashboardLayout from '@/components/dashboard-layout';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Scale, Users, AlertTriangle, CheckCircle, ChevronDown, Send, Loader2, File, User, FileText, Download, Clock, BarChart3, Folder, Shield, Timer, Undo2, History, Briefcase } from 'lucide-react';
import { PoshComplaint, getAllPoshComplaints, PoshAuditEvent, assignPoshCase, addPoshInternalNote, updatePoshStatus } from '@/services/posh-service';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { formatActorName } from '@/lib/role-mapping';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { DropdownMenu, DropdownMenuContent, DropdownMenuCheckboxItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { CustomSwitch } from '@/components/ui/custom-switch';
import { Checkbox } from '@/components/ui/checkbox';


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

const caseStatuses = [
    'Under Preliminary Review',
    'Inquiry Initiated',
    'Evidence Review',
    'Hearing Scheduled',
    'Report Drafted',
    'Resolved (Action Taken)',
    'Closed (No Action Required)',
    'Escalated to External Authority'
] as const;

type CaseStatus = typeof caseStatuses[number];

function ActionPanel({ complaint, onUpdate }: { complaint: PoshComplaint, onUpdate: () => void }) {
    const { role } = useRole();
    const { toast } = useToast();

    // Assignment state
    const [assignees, setAssignees] = useState<Role[]>([]);
    const [assignmentComment, setAssignmentComment] = useState('');
    const [isAssigning, setIsAssigning] = useState(false);
    const [isUnassignMode, setIsUnassignMode] = useState(false);

    // Note/Update state
    const [note, setNote] = useState('');
    const [isAddingNote, setIsAddingNote] = useState('');

    // Disciplinary & Final Report state
    const [disciplinaryAction, setDisciplinaryAction] = useState('');
    const [finalReport, setFinalReport] = useState('');
    const [tagAsFinal, setTagAsFinal] = useState(false);
    const [isSubmittingDisciplinary, setIsSubmittingDisciplinary] = useState(false);
    const [isSubmittingFinal, setIsSubmittingFinal] = useState(false);

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
    
    const handleAddNote = async (noteType: string, isPublic = false) => {
        if (!role || !note) return;
        setIsAddingNote(noteType);
        try {
            await addPoshInternalNote(complaint.caseId, note, role, noteType, isPublic);
            toast({ title: `${noteType} Added`, description: 'Your note has been saved to the case history.' });
            setNote('');
            onUpdate();
        } catch (error) {
            toast({ variant: 'destructive', title: 'Failed to Add Note' });
        } finally {
            setIsAddingNote('');
        }
    }

    const handleStatusChange = async (status: CaseStatus, checked: boolean) => {
        if (!role) return;
        // For this demo, we only allow advancing status, not reversing.
        if (!checked) return;

        try {
            await updatePoshStatus(complaint.caseId, status, role);
            toast({ title: 'Status Updated', description: `Case status changed to: ${status}`});
            onUpdate();
        } catch (error) {
             toast({ variant: 'destructive', title: 'Failed to Update Status' });
        }
    };

    const handleProposeAction = async () => {
        if (!role || !disciplinaryAction) return;
        setIsSubmittingDisciplinary(true);
        try {
            await addPoshInternalNote(complaint.caseId, disciplinaryAction, role, 'Disciplinary Action Proposed', false);
            toast({ title: 'Action Proposed', description: 'Your disciplinary proposal has been logged.' });
            setDisciplinaryAction('');
            onUpdate();
        } catch (error) {
            toast({ variant: 'destructive', title: 'Failed to Propose Action' });
        } finally {
            setIsSubmittingDisciplinary(false);
        }
    }

    const handleSubmitFinalReport = async () => {
        if (!role || !finalReport) return;
        setIsSubmittingFinal(true);
        try {
            await addPoshInternalNote(complaint.caseId, finalReport, role, 'Final Report Submitted', false);
            if (tagAsFinal) {
                // In a real app, this would also trigger case locking.
                await updatePoshStatus(complaint.caseId, 'Closed (No Action Required)', role);
            }
            toast({ title: 'Final Report Submitted', description: 'The final report has been added to the case.' });
            setFinalReport('');
            onUpdate();
        } catch (error) {
            toast({ variant: 'destructive', title: 'Failed to Submit Report' });
        } finally {
            setIsSubmittingFinal(false);
        }
    }

    const assignableRolesForDropdown = isUnassignMode 
        ? (complaint.assignedTo || []) 
        : availableRolesForAssignment.filter(r => r === 'ICC Member' && !complaint.assignedTo?.includes(r));

    const isStatusChecked = (status: CaseStatus) => {
        return complaint.auditTrail.some(e => e.event === 'Status Updated' && e.details?.includes(status));
    }
    
    return (
        <div className="pt-4 border-t space-y-6">
            <h3 className="font-semibold text-lg text-foreground">Case Actions</h3>
            
            {/* Case Updates Section */}
            <div className="p-4 border rounded-lg bg-background space-y-3">
                <Label className="font-semibold text-base">Add Internal Notes or Public Status Updates</Label>
                <p className="text-sm text-muted-foreground">Internal notes are visible to ICC members only. Complainant updates are visible to the complainant.</p>
                <Textarea 
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Type your note or update here..."
                    rows={4}
                />
                <div className="flex flex-wrap gap-2">
                    <Button variant="outline" onClick={() => handleAddNote('Observation')} disabled={!note || !!isAddingNote}>
                        {isAddingNote === 'Observation' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Add Observation
                    </Button>
                    <Button variant="outline" onClick={() => handleAddNote('Meeting Notes')} disabled={!note || !!isAddingNote}>
                        {isAddingNote === 'Meeting Notes' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Add Meeting Notes
                    </Button>
                    <Button variant="outline" onClick={() => handleAddNote('Follow-up')} disabled={!note || !!isAddingNote}>
                        {isAddingNote === 'Follow-up' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Add Follow-up
                    </Button>
                    <Button onClick={() => handleAddNote('Complainant Update', true)} disabled={!note || !!isAddingNote}>
                        {isAddingNote === 'Complainant Update' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Complainant Update
                    </Button>
                     <Button variant="secondary" onClick={() => handleAddNote('Meeting')} disabled={!note || !!isAddingNote}>
                        {isAddingNote === 'Meeting' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Meeting
                    </Button>
                </div>
            </div>

            {/* Status Checklist Section */}
            <div className="p-4 border rounded-lg bg-background space-y-3">
                <Label className="font-semibold text-base">Interactive Case Status Checklist</Label>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                    {caseStatuses.map(status => {
                        const isChecked = isStatusChecked(status);
                        return (
                        <div key={status} className="flex items-center space-x-2">
                            <Checkbox 
                                id={`status-${status.replace(/\s/g, '-')}`} 
                                checked={isChecked}
                                disabled={isChecked}
                                onCheckedChange={(checked) => handleStatusChange(status, !!checked)}
                            />
                            <label
                                htmlFor={`status-${status.replace(/\s/g, '-')}`}
                                className={cn("text-sm font-medium leading-none", isChecked ? "text-muted-foreground" : "text-foreground", "peer-disabled:cursor-not-allowed peer-disabled:opacity-70")}
                            >
                                {status}
                            </label>
                        </div>
                    )})}
                </div>
            </div>

            {/* Bottom Action Panels */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Assign Case */}
                <div className="space-y-3 p-4 border rounded-lg bg-background">
                    <Label className="font-semibold text-base">{isUnassignMode ? 'Unassign Case' : 'Assign Case'}</Label>
                    <div className="flex items-center justify-between">
                        <CustomSwitch id="assign-mode-switch" checked={isUnassignMode} onCheckedChange={setIsUnassignMode} />
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm" className="justify-between" disabled={isUnassignMode && (!complaint.assignedTo || complaint.assignedTo.length === 0)}>
                                    <span>{assignees.length > 0 ? assignees.join(', ') : 'Select...'}</span>
                                    <ChevronDown className="ml-2 h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-auto" align="end">
                                {assignableRolesForDropdown.map(r => (
                                    <DropdownMenuCheckboxItem key={r} checked={assignees.includes(r)} onCheckedChange={() => handleAssigneeChange(r)} onSelect={(e) => e.preventDefault()}>
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
                    <Textarea placeholder="Add a private note for this assignment..." value={assignmentComment} onChange={(e) => setAssignmentComment(e.target.value)} rows={2} />
                    <Button onClick={handleAssign} disabled={assignees.length === 0 || isAssigning} className="w-full">
                        {isAssigning ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Confirm'}
                    </Button>
                </div>

                {/* Disciplinary Action */}
                <div className="space-y-3 p-4 border rounded-lg bg-background flex flex-col">
                    <Label className="font-semibold text-base">Disciplinary Action</Label>
                    <Textarea 
                        value={disciplinaryAction}
                        onChange={(e) => setDisciplinaryAction(e.target.value)}
                        placeholder="Describe disciplinary actions proposed..." 
                        className="flex-grow" 
                        rows={4}
                    />
                    <Button onClick={handleProposeAction} disabled={!disciplinaryAction || isSubmittingDisciplinary} className="w-full mt-auto">
                        {isSubmittingDisciplinary ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Propose Action'}
                    </Button>
                </div>
                
                {/* Final Report */}
                <div className="space-y-3 p-4 border rounded-lg bg-background flex flex-col">
                    <Label className="font-semibold text-base">Final Report</Label>
                    <Textarea 
                        value={finalReport}
                        onChange={(e) => setFinalReport(e.target.value)}
                        placeholder="Paste summary of final report..." 
                        className="flex-grow"
                        rows={4}
                    />
                    <div className="flex items-center justify-between gap-4 mt-auto">
                        <div className="flex items-center space-x-2">
                           <Checkbox id="tag-final" checked={tagAsFinal} onCheckedChange={(checked) => setTagAsFinal(!!checked)}/>
                           <label htmlFor="tag-final" className="text-sm font-medium leading-none">Tag as "ICC Final Report"</label>
                        </div>
                        <Button onClick={handleSubmitFinalReport} disabled={!finalReport || isSubmittingFinal}>
                           {isSubmittingFinal ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Submit & Lock'}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}

function IccHeadDashboardWidgets({ complaints }: { complaints: PoshComplaint[] }) {
    const totalCases = complaints.length;
    const openCases = complaints.filter(c => c.caseStatus !== 'Resolved' && c.caseStatus !== 'Closed').length;
    // Placeholder for average close days logic
    const avgCloseDays = 0;

    return (
        <div className="mb-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-card/50">
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Reporting &amp; Analytics</CardTitle>
                    <Button variant="outline" size="sm"><Download className="mr-2 h-4 w-4"/>Report</Button>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex justify-between items-center text-sm">
                        <span className="flex items-center gap-2 text-muted-foreground"><Folder/>Total Cases</span>
                        <span className="font-bold">{totalCases}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                        <span className="flex items-center gap-2 text-muted-foreground"><Clock/>Avg. Close Days</span>
                        <span className="font-bold">{avgCloseDays}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                        <span className="flex items-center gap-2 text-muted-foreground"><BarChart3/>Open Cases</span>
                        <span className="font-bold">{openCases}</span>
                    </div>
                </CardContent>
            </Card>
             <Card className="bg-card/50">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Shield/>Admin-Only Actions</CardTitle>
                    <CardDescription>Manage ICC members, system settings, and case overrides.</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-3">
                     <Button variant="outline"><Users className="mr-2 h-4 w-4"/>Manage Members</Button>
                     <Button variant="outline"><Timer className="mr-2 h-4 w-4"/>Set SLA Timers</Button>
                     <Button variant="destructive"><Undo2 className="mr-2 h-4 w-4"/>Override Decision</Button>
                     <Button variant="outline"><History className="mr-2 h-4 w-4"/>View History</Button>
                </CardContent>
            </Card>
        </div>
    )
}

function PoshDeskContent() {
    const { role } = useRole();
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
            ) : (
                <>
                    {role === 'ICC Head' && <IccHeadDashboardWidgets complaints={complaints} />}

                    {complaints.length === 0 ? (
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
                                        <div className="space-y-4">
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
                                                 <div className="space-y-2">
                                                    <h4 className="font-bold flex items-center gap-2 text-base"><FileText className="h-4 w-4" />Incident Information</h4>
                                                    <div><span className="font-semibold text-muted-foreground">Case ID: </span> <span className="text-muted-foreground">{complaint.caseId}</span></div>
                                                    <div><span className="font-semibold text-muted-foreground">Title: </span> <span className="text-muted-foreground">{complaint.title}</span></div>
                                                    <div><span className="font-semibold text-muted-foreground">Date: </span> <span className="text-muted-foreground">{format(new Date(complaint.dateOfIncident), 'PPP')}</span></div>
                                                    <div><span className="font-semibold text-muted-foreground">Location: </span> <span className="text-muted-foreground">{complaint.location}</span></div>
                                                </div>
                                                 <div className="space-y-2">
                                                    <h4 className="font-bold flex items-center gap-2 text-base"><User className="h-4 w-4" />Complainant</h4>
                                                    <div><span className="font-semibold text-muted-foreground">Name: </span> <span className="text-muted-foreground">{complaint.complainantInfo.name}</span></div>
                                                    <div><span className="font-semibold text-muted-foreground">Department: </span> <span className="text-muted-foreground">{complaint.complainantInfo.department}</span></div>
                                                </div>
                                                 <div className="space-y-2">
                                                    <h4 className="font-bold flex items-center gap-2 text-base"><User className="h-4 w-4" />Respondent</h4>
                                                    <div><span className="font-semibold text-muted-foreground">Name: </span> <span className="text-muted-foreground">{complaint.respondentInfo.name}</span></div>
                                                    {complaint.respondentInfo.details && <div><span className="font-semibold text-muted-foreground">Details: </span> <span className="text-muted-foreground">{complaint.respondentInfo.details}</span></div>}
                                                </div>
                                            </div>

                                            <div className="space-y-2 pt-4">
                                                <h4 className="font-bold text-base">Narrative</h4>
                                                <div className="text-sm text-muted-foreground whitespace-pre-wrap break-words mt-1 border p-3 rounded-md bg-background">
                                                    {complaint.incidentDetails}
                                                </div>
                                            </div>

                                            {complaint.priorHistory.hasPriorIncidents && complaint.priorHistory.priorIncidentsDetails && (
                                                 <div className="space-y-2">
                                                    <h4 className="font-semibold flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-orange-500" />Prior Incidents Details</h4>
                                                    <p className="text-sm text-muted-foreground whitespace-pre-wrap mt-1 border p-3 rounded-md bg-orange-500/10">
                                                        {complaint.priorHistory.priorIncidentsDetails}
                                                    </p>
                                                </div>
                                            )}
                                            {complaint.priorHistory.hasPriorComplaints && complaint.priorHistory.priorComplaintsDetails && (
                                                 <div className="space-y-2">
                                                    <h4 className="font-semibold flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-orange-500" />Prior Complaints Details</h4>
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
                </>
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
