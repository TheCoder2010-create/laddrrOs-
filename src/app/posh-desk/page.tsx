

"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRole, availableRolesForAssignment, type Role } from '@/hooks/use-role';
import DashboardLayout from '@/components/dashboard-layout';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Scale, Users, AlertTriangle, CheckCircle, ChevronDown, Send, Loader2, File, User, FileText, Download, Clock, BarChart3, Folder, Shield, Timer, Undo2, History, Briefcase, Search } from 'lucide-react';
import { PoshComplaint, getAllPoshComplaints, PoshAuditEvent, assignPoshCase, addPoshInternalNote, updatePoshStatus, poshCaseStatuses } from '@/services/posh-service';
import { Badge } from '@/components/ui/badge';
import { format, differenceInDays, startOfQuarter, endOfQuarter, startOfMonth, endOfYear } from 'date-fns';
import { formatActorName, roleUserMapping } from '@/lib/role-mapping';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { DropdownMenu, DropdownMenuContent, DropdownMenuCheckboxItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { CustomSwitch } from '@/components/ui/custom-switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import type { DateRange } from 'react-day-picker';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { getAdminAuditLog, getAllUsers, manageIccMembership, overrideCaseStatus, type AdminLogEntry } from '@/services/admin-service';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { downloadPoshCasePDF } from '@/lib/pdf-generator';

function PoshCaseHistory({ trail, onDownload }: { trail: PoshAuditEvent[], onDownload: () => void }) {
    if (!trail || trail.length === 0) return null;

    return (
        <div className="space-y-2">
            <div className="flex justify-between items-center">
                <h4 className="font-semibold">Case History</h4>
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" onClick={onDownload}>
                                <Download className="h-4 w-4" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Download PDF</p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            </div>
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

type CaseStatus = typeof poshCaseStatuses[number];

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

    const handleStatusChange = async (status: CaseStatus) => {
        if (!role) return;
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
    
    const currentStatusIndex = complaint.caseStatus === 'New' 
      ? -1 
      : poshCaseStatuses.indexOf(complaint.caseStatus as CaseStatus);

    
    return (
        <div className="pt-4 border-t space-y-6">
            <h3 className="font-semibold text-lg text-foreground">Case Actions</h3>
            
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

            <div className="p-4 border rounded-lg bg-background space-y-3">
                <Label className="font-semibold text-base">Interactive Case Status Checklist</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
                    {poshCaseStatuses.map((status, index) => {
                        const isCompleted = index < currentStatusIndex;
                        const isNextAction = index === currentStatusIndex + 1;
                        
                        const isChecked = isCompleted || index === currentStatusIndex;
                        const isDisabled = !isNextAction;

                        return (
                        <div key={status} className="flex items-center space-x-2">
                            <Checkbox 
                                id={`status-${status.replace(/\s/g, '-')}`} 
                                checked={isChecked}
                                disabled={isDisabled}
                                onCheckedChange={() => {
                                    if (isNextAction) {
                                        handleStatusChange(status);
                                    }
                                }}
                            />
                            <label
                                htmlFor={`status-${status.replace(/\s/g, '-')}`}
                                className={cn(
                                    "text-sm font-medium leading-none peer-disabled:cursor-not-allowed", 
                                    (isDisabled && !isChecked) ? "text-muted-foreground/50" : "text-foreground",
                                    isChecked ? "text-muted-foreground line-through" : ""
                                )}
                            >
                                {status}
                            </label>
                        </div>
                    )})}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
                    <div className="relative">
                         <Textarea 
                            placeholder="Add a private note..." 
                            value={assignmentComment} 
                            onChange={(e) => setAssignmentComment(e.target.value)} 
                            rows={2} 
                            className="pr-12 pb-8"
                        />
                         <Button onClick={handleAssign} disabled={assignees.length === 0 || isAssigning} size="icon" className="absolute bottom-2 right-2 h-7 w-7 rounded-full">
                            {isAssigning ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4"/>}
                        </Button>
                    </div>
                </div>

                <div className="space-y-3 p-4 border rounded-lg bg-background flex flex-col">
                    <Label className="font-semibold text-base">Disciplinary Action</Label>
                    <div className="relative flex-grow">
                        <Textarea 
                            value={disciplinaryAction}
                            onChange={(e) => setDisciplinaryAction(e.target.value)}
                            placeholder="Describe disciplinary actions proposed..." 
                            className="h-full pr-12 pb-8"
                            rows={4}
                        />
                        <Button onClick={handleProposeAction} disabled={!disciplinaryAction || isSubmittingDisciplinary} size="icon" className="absolute bottom-2 right-2 h-7 w-7 rounded-full">
                            {isSubmittingDisciplinary ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                        </Button>
                    </div>
                </div>
                
                <div className="space-y-3 p-4 border rounded-lg bg-background flex flex-col">
                    <Label className="font-semibold text-base">Final Report</Label>
                    <div className="relative flex-grow">
                        <Textarea 
                            value={finalReport}
                            onChange={(e) => setFinalReport(e.target.value)}
                            placeholder="Paste summary of final report..." 
                            className="h-full pr-12 pb-12"
                            rows={4}
                        />
                        <div className="absolute bottom-2 right-2 flex items-center gap-2">
                             <div className="flex items-center space-x-2">
                               <Checkbox id="tag-final" checked={tagAsFinal} onCheckedChange={(checked) => setTagAsFinal(!!checked)}/>
                               <label htmlFor="tag-final" className="text-xs font-medium leading-none cursor-pointer">Tag Final</label>
                            </div>
                            <Button onClick={handleSubmitFinalReport} disabled={!finalReport || isSubmittingFinal} size="icon" className="h-7 w-7 rounded-full">
                               {isSubmittingFinal ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function IccHeadDashboardWidgets({ complaints, onUpdate }: { complaints: PoshComplaint[], onUpdate: () => void }) {
    const { toast } = useToast();
    const [reportDialogOpen, setReportDialogOpen] = useState(false);
    const [timePeriod, setTimePeriod] = useState('all');
    const [customDate, setCustomDate] = useState<DateRange | undefined>();
    const [fileFormat, setFileFormat] = useState('pdf');

    const [adminHistoryDialogOpen, setAdminHistoryDialogOpen] = useState(false);
    const [adminLog, setAdminLog] = useState<AdminLogEntry[]>([]);
    const [searchTerm, setSearchTerm] = useState('');

    const [manageMembersDialogOpen, setManageMembersDialogOpen] = useState(false);
    const [allUsers, setAllUsers] = useState<string[]>([]);
    const [iccMembers, setIccMembers] = useState<string[]>([]);

    const [overrideDialogOpen, setOverrideDialogOpen] = useState(false);
    const [selectedCaseId, setSelectedCaseId] = useState('');
    const [selectedStatus, setSelectedStatus] = useState<CaseStatus | ''>('');
    const [overrideReason, setOverrideReason] = useState('');
    const [isOverriding, setIsOverriding] = useState(false);

    const openAdminHistory = async () => {
        const log = await getAdminAuditLog();
        setAdminLog(log);
        setAdminHistoryDialogOpen(true);
    }
    
    const openManageMembers = async () => {
        const users = await getAllUsers();
        setAllUsers(users.all);
        setIccMembers(users.icc);
        setManageMembersDialogOpen(true);
    };

    const handleManageMembership = async (user: string, action: 'add' | 'remove') => {
        await manageIccMembership(user, action);
        toast({ title: 'Membership Updated', description: `${user} has been ${action === 'add' ? 'added to' : 'removed from'} the ICC.`});
        openManageMembers(); // Refresh the dialog content
    };

    const handleOverrideSubmit = async () => {
        if (!selectedCaseId || !selectedStatus || !overrideReason) {
            toast({ variant: 'destructive', title: 'Missing Information', description: 'Please fill all fields to override.'});
            return;
        }
        setIsOverriding(true);
        try {
            await overrideCaseStatus(selectedCaseId, selectedStatus as CaseStatus, overrideReason);
            toast({ title: 'Override Successful', description: `Case ${selectedCaseId} status has been changed.`});
            onUpdate();
            setOverrideDialogOpen(false);
            setSelectedCaseId('');
            setSelectedStatus('');
            setOverrideReason('');
        } catch(e) {
            toast({ variant: 'destructive', title: 'Override Failed'});
        } finally {
            setIsOverriding(false);
        }
    };
    
    const filteredAdminLog = adminLog.filter(log => log.caseId?.toLowerCase().includes(searchTerm.toLowerCase()));

    const totalCases = complaints.length;
    const closedCases = complaints.filter(c => c.caseStatus.startsWith('Resolved') || c.caseStatus.startsWith('Closed'));
    
    const avgCloseDays = (() => {
        if (closedCases.length === 0) return 0;
        const totalDays = closedCases.reduce((sum, c) => {
            const closeEvent = c.auditTrail.find(e => e.event === 'Status Updated' && (e.details?.includes('Resolved') || e.details?.includes('Closed')));
            if (closeEvent) {
                return sum + differenceInDays(new Date(closeEvent.timestamp), new Date(c.createdAt));
            }
            return sum;
        }, 0);
        return Math.round(totalDays / closedCases.length);
    })();

    const openCases = totalCases - closedCases.length;

    return (
        <div className="mb-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
             <Dialog open={reportDialogOpen} onOpenChange={setReportDialogOpen}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Generate POSH Report</DialogTitle></DialogHeader>
                    <div className="space-y-4 py-4">
                        <RadioGroup value={timePeriod} onValueChange={setTimePeriod}>
                            <Label>Time Period</Label>
                            <div className="grid grid-cols-2 gap-2">
                                <div className="flex items-center space-x-2"><RadioGroupItem value="all" id="all" /><Label htmlFor="all">All Cases</Label></div>
                                <div className="flex items-center space-x-2"><RadioGroupItem value="quarter" id="quarter" /><Label htmlFor="quarter">Current Quarter</Label></div>
                                <div className="flex items-center space-x-2"><RadioGroupItem value="month" id="month" /><Label htmlFor="month">Current Month</Label></div>
                                <div className="flex items-center space-x-2"><RadioGroupItem value="year" id="year" /><Label htmlFor="year">Current Year</Label></div>
                                <div className="flex items-center space-x-2 col-span-2"><RadioGroupItem value="custom" id="custom" /><Label htmlFor="custom">Custom Range</Label></div>
                            </div>
                        </RadioGroup>
                        {timePeriod === 'custom' && (
                            <Popover><PopoverTrigger asChild>
                                <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !customDate && "text-muted-foreground")}>
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {customDate?.from ? (customDate.to ? `${format(customDate.from, "LLL dd, y")} - ${format(customDate.to, "LLL dd, y")}` : format(customDate.from, "LLL dd, y")) : <span>Pick a date</span>}
                                </Button>
                            </PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar initialFocus mode="range" defaultMonth={customDate?.from} selected={customDate} onSelect={setCustomDate} numberOfMonths={2} /></PopoverContent></Popover>
                        )}
                        <RadioGroup value={fileFormat} onValueChange={setFileFormat}>
                            <Label>File Format</Label>
                            <div className="flex gap-4">
                                <div className="flex items-center space-x-2"><RadioGroupItem value="pdf" id="pdf" /><Label htmlFor="pdf">PDF</Label></div>
                                <div className="flex items-center space-x-2"><RadioGroupItem value="csv" id="csv" /><Label htmlFor="csv">CSV</Label></div>
                            </div>
                        </RadioGroup>
                    </div>
                    <DialogFooter><Button onClick={() => toast({title: "Coming Soon!", description: "Report generation is not yet implemented."})}>Download</Button></DialogFooter>
                </DialogContent>
            </Dialog>

             <Dialog open={manageMembersDialogOpen} onOpenChange={setManageMembersDialogOpen}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Manage ICC Members</DialogTitle></DialogHeader>
                    <div className="py-4 space-y-4">
                        <div>
                            <Label>Current Members</Label>
                            <div className="space-y-1 mt-2">
                                {iccMembers.map(member => (
                                    <div key={member} className="flex items-center justify-between rounded-md border p-2">
                                        <span className="text-sm">{roleUserMapping[member as Role]?.name || member} ({member})</span>
                                        <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => handleManageMembership(member, 'remove')} disabled={member === 'ICC Head'}>Remove</Button>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div>
                            <Label>Add New Members</Label>
                            <Select onValueChange={(userRole) => handleManageMembership(userRole, 'add')}>
                                <SelectTrigger><SelectValue placeholder="Select an employee to add..." /></SelectTrigger>
                                <SelectContent>
                                    {allUsers.filter(u => !iccMembers.includes(u)).map(userRole => (
                                        <SelectItem key={userRole} value={userRole}>{roleUserMapping[userRole as Role]?.name || userRole} ({userRole})</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={adminHistoryDialogOpen} onOpenChange={setAdminHistoryDialogOpen}>
                <DialogContent className="max-w-4xl">
                     <DialogHeader><DialogTitle>System-Wide Admin Log</DialogTitle></DialogHeader>
                    <div className="py-4 space-y-2">
                         <div className="relative">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input placeholder="Search by Case ID..." className="pl-8" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                        </div>
                        <ScrollArea className="h-[60vh]">
                            <Table>
                                <TableHeader>
                                    <TableRow><TableHead>Timestamp</TableHead><TableHead>Case ID</TableHead><TableHead>Actor</TableHead><TableHead>Action</TableHead></TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredAdminLog.map(log => (
                                        <TableRow key={log.id}>
                                            <TableCell>{format(new Date(log.timestamp), 'Pp')}</TableCell>
                                            <TableCell className="font-mono text-xs">{log.caseId}</TableCell>
                                            <TableCell>{log.actor}</TableCell>
                                            <TableCell>{log.action}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </ScrollArea>
                    </div>
                </DialogContent>
            </Dialog>
            
            <Dialog open={overrideDialogOpen} onOpenChange={setOverrideDialogOpen}>
                <DialogContent>
                     <DialogHeader><DialogTitle>Override Case Status</DialogTitle></DialogHeader>
                    <div className="py-4 space-y-4">
                        <Select value={selectedCaseId} onValueChange={setSelectedCaseId}>
                            <SelectTrigger><SelectValue placeholder="Select a case..." /></SelectTrigger>
                            <SelectContent>
                                {complaints.map(c => <SelectItem key={c.caseId} value={c.caseId}>{c.title} ({c.caseId})</SelectItem>)}
                            </SelectContent>
                        </Select>
                        <Select value={selectedStatus} onValueChange={(v) => setSelectedStatus(v as CaseStatus)}>
                            <SelectTrigger><SelectValue placeholder="Select new status..." /></SelectTrigger>
                            <SelectContent>
                                {[...poshCaseStatuses, 'New' as const, 'Closed' as const, 'Resolved' as const].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        <Textarea placeholder="Enter detailed justification for this override..." value={overrideReason} onChange={e => setOverrideReason(e.target.value)} rows={4}/>
                    </div>
                    <DialogFooter><Button variant="destructive" onClick={handleOverrideSubmit} disabled={isOverriding}>
                        {isOverriding && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                        Confirm Override
                    </Button></DialogFooter>
                </DialogContent>
            </Dialog>

            <Card className="bg-card/50">
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Reporting &amp; Analytics</CardTitle>
                    <Button variant="outline" size="sm" onClick={() => setReportDialogOpen(true)}><Download className="mr-2 h-4 w-4"/>Report</Button>
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
                     <Button variant="outline" onClick={openManageMembers}><Users className="mr-2 h-4 w-4"/>Manage Members</Button>
                     <Button variant="outline" onClick={() => toast({title: "Coming Soon!", description: "SLA timer setting is not yet implemented."})}><Timer className="mr-2 h-4 w-4"/>Set SLA Timers</Button>
                     <Button variant="destructive" onClick={() => setOverrideDialogOpen(true)}><Undo2 className="mr-2 h-4 w-4"/>Override Decision</Button>
                     <Button variant="outline" onClick={openAdminHistory}><History className="mr-2 h-4 w-4"/>View History</Button>
                </CardContent>
            </Card>
        </div>
    )
}

function PoshDeskContent() {
    const { role } = useRole();
    const [complaints, setComplaints] = useState<PoshComplaint[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [openAccordionItem, setOpenAccordionItem] = useState<string | undefined>(undefined);


    const fetchComplaints = useCallback(async () => {
        setIsLoading(true);
        const data = await getAllPoshComplaints();
        
        if (role === 'ICC Member') {
            setComplaints(data.filter(c => c.assignedTo.includes('ICC Member')));
        } else {
            setComplaints(data);
        }

        setIsLoading(false);
    }, [role]);

    const handleUpdate = useCallback(() => {
        const currentOpenItem = openAccordionItem;
        fetchComplaints().then(() => {
            if (currentOpenItem) {
                setOpenAccordionItem(currentOpenItem);
            }
        });
    }, [fetchComplaints, openAccordionItem]);

    useEffect(() => {
        fetchComplaints();
        const handleStorageChange = () => handleUpdate();
        window.addEventListener('storage', handleStorageChange);
        window.addEventListener('poshComplaintUpdated', handleStorageChange);

        return () => {
            window.removeEventListener('storage', handleStorageChange);
            window.removeEventListener('poshComplaintUpdated', handleStorageChange);
        };
    }, [fetchComplaints, handleUpdate]);
    
    const capitalizeFirstLetter = (string: string) => {
        if (!string) return '';
        return string.charAt(0).toUpperCase() + string.slice(1);
    }
    
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
                    {role === 'ICC Head' && <IccHeadDashboardWidgets complaints={complaints} onUpdate={handleUpdate} />}

                    {complaints.length === 0 ? (
                         <div className="text-center py-12 border-2 border-dashed rounded-lg">
                            <p className="text-muted-foreground text-lg">No active cases.</p>
                            <p className="text-sm text-muted-foreground mt-2">
                                New complaints will appear here as they are submitted.
                            </p>
                        </div>
                    ) : (
                        <Accordion 
                            type="single" 
                            collapsible 
                            className="w-full space-y-2"
                            value={openAccordionItem}
                            onValueChange={setOpenAccordionItem}
                        >
                            {complaints.map((complaint) => (
                                <AccordionItem value={complaint.caseId} key={complaint.caseId} className="border rounded-lg">
                                     <AccordionTrigger className="px-4 py-3 text-left hover:no-underline [&[data-state=open]>svg]:rotate-180">
                                        <div className="flex justify-between items-center w-full">
                                            <div className="flex-1 min-w-0 text-left">
                                                <p className="font-semibold text-foreground truncate">{capitalizeFirstLetter(complaint.title)}</p>
                                            </div>
                                            <div className="flex items-center gap-4 pl-2">
                                                <span className="text-xs text-muted-foreground font-mono cursor-text hidden sm:inline-block">
                                                    ID: {complaint.caseId}
                                                </span>
                                                <Badge variant={complaint.caseStatus === 'New' ? 'destructive' : 'secondary'}>
                                                    {complaint.caseStatus}
                                                </Badge>
                                            </div>
                                        </div>
                                    </AccordionTrigger>
                                    <AccordionContent className="p-4 border-t space-y-6">
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
                                            <div className="space-y-1">
                                                <h4 className="font-bold flex items-center gap-2 text-base"><FileText className="h-4 w-4" />Incident Information</h4>
                                                <div><strong className="text-muted-foreground">Case ID: </strong> <span className="text-foreground font-mono text-xs">{complaint.caseId}</span></div>
                                                <div><strong className="text-muted-foreground">Title: </strong> <span className="text-foreground">{complaint.title}</span></div>
                                                <div><strong className="text-muted-foreground">Date: </strong> <span className="text-foreground">{format(new Date(complaint.dateOfIncident), 'PPP')}</span></div>
                                                <div><strong className="text-muted-foreground">Location: </strong> <span className="text-foreground">{complaint.location}</span></div>
                                            </div>
                                             <div className="space-y-1">
                                                <h4 className="font-bold flex items-center gap-2 text-base"><User className="h-4 w-4" />Complainant</h4>
                                                <div><strong className="text-muted-foreground">Name: </strong> <span className="text-foreground">{complaint.complainantInfo.name}</span></div>
                                                <div><strong className="text-muted-foreground">Department: </strong> <span className="text-foreground">{complaint.complainantInfo.department}</span></div>
                                            </div>
                                             <div className="space-y-1">
                                                <h4 className="font-bold flex items-center gap-2 text-base"><User className="h-4 w-4" />Respondent</h4>
                                                <div><strong className="text-muted-foreground">Name: </strong> <span className="text-foreground">{complaint.respondentInfo.name}</span></div>
                                                {complaint.respondentInfo.details && <div><strong className="text-muted-foreground">Details: </strong> <span className="text-foreground">{complaint.respondentInfo.details}</span></div>}
                                            </div>
                                        </div>
                                         <div className="space-y-2 pt-4">
                                            <h4 className="font-bold text-base">Narrative</h4>
                                            <div className="text-sm text-foreground whitespace-pre-wrap break-words mt-1 border p-3 rounded-md bg-background">
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
                                        
                                        <PoshCaseHistory trail={complaint.auditTrail} onDownload={() => role && downloadPoshCasePDF(complaint, role)} />
                                        
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

