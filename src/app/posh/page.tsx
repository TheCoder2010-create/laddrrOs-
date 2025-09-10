
"use client";

import { useState, useTransition, useEffect, useCallback, Key, ChangeEvent, useRef } from 'react';
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRole } from '@/hooks/use-role';
import DashboardLayout from '@/components/dashboard-layout';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { format, differenceInDays } from 'date-fns';
import { Scale, CalendarIcon, Send, Loader2, Paperclip, XIcon, List, CheckCircle, Handshake, AlertTriangle, GitBranch } from 'lucide-react';
import { submitPoshComplaint, type PoshComplaintInput, getComplaintsForUser, PoshComplaint, PoshAuditEvent, getComplaintsByIds, requestPoshCaseWithdrawal, requestPoshCaseConciliation, reportPoshRetaliation, getAllPoshComplaints, submitPoshComplainantAcknowledgement } from '@/services/posh-service';
import { Skeleton } from '@/components/ui/skeleton';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { roleUserMapping, formatActorName } from '@/lib/role-mapping';

const formSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters."),
  location: z.string().min(3, "Location is required."),
  dateOfIncident: z.date({ required_error: "Date of incident is required." }),
  complainantName: z.string().min(1, "Your name is required."),
  complainantDepartment: z.string().min(1, "Your department is required."),
  respondentName: z.string().min(1, "Respondent's name is required."),
  respondentDetails: z.string().optional(),
  incidentDetails: z.string().min(20, "Please provide a detailed description of the incident."),
  witnesses: z.string().optional(),
  evidenceFiles: z.array(z.instanceof(File)).optional(),
  priorIncidents: z.enum(['yes', 'no']),
  priorIncidentsDetails: z.string().optional(),
  priorComplaints: z.enum(['yes', 'no']),
  priorComplaintsDetails: z.string().optional(),
  delayJustification: z.string().optional(),
  delayEvidenceFiles: z.array(z.instanceof(File)).optional(),
  confidentialityAcknowledgement: z.boolean().refine(val => val === true, { message: "You must acknowledge the confidentiality policy." }),
  consent: z.boolean().refine(val => val === true, { message: "You must provide consent to proceed." }),
});

function CaseHistory({ trail }: { trail: PoshAuditEvent[] }) {
    if (!trail || trail.length === 0) return null;

    const publicTrail = trail.filter(event => event.isPublic || !('isPublic' in event));

    return (
        <div className="space-y-2 pt-4">
            <h4 className="font-semibold">Case History</h4>
            <div className="relative p-4 border rounded-md bg-muted/50">
                <div className="absolute left-8 top-8 bottom-8 w-px bg-border -translate-x-1/2"></div>
                <div className="space-y-4">
                    {publicTrail.map((event, index) => {
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

function RetaliationAcknowledgementWidget({ item, onUpdate }: { item: PoshComplaint, onUpdate: () => void }) {
    const { toast } = useToast();
    const { role } = useRole();
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const handleAccept = async () => {
        if (!role) return;
        setIsSubmitting(true);
        try {
            await submitPoshComplainantAcknowledgement(item.caseId, role, true);
            toast({ title: "Resolution Accepted", description: "This case has now been closed." });
            onUpdate();
        } catch (error) {
            toast({ variant: 'destructive', title: 'Submission Failed' });
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const handleEscalate = async () => {
         if (!role) return;
        setIsSubmitting(true);
        try {
            await submitPoshComplainantAcknowledgement(item.caseId, role, false, 'Employee escalated after retaliation response.');
            toast({ title: "Case Escalated", description: "Your dissatisfaction has been noted and the case has been sent back for final disposition." });
            onUpdate();
        } catch (error) {
            toast({ variant: 'destructive', title: 'Submission Failed' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const resolutionEvent = item.auditTrail.find(e => e.event === 'HR Responded to Retaliation Claim');

    return (
        <Card className="border-2 border-blue-500/50 bg-blue-500/5 rounded-lg mt-4">
            <CardHeader>
                <CardTitle className="text-lg text-blue-700 dark:text-blue-400">Action Required: Response to Your Retaliation Claim</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="p-3 bg-background/50 rounded-md border">
                    <p className="font-semibold text-foreground">ICC Head's Response:</p>
                    <p className="text-muted-foreground mt-1 whitespace-pre-wrap">{resolutionEvent?.details}</p>
                </div>
                <p className="text-sm text-muted-foreground">
                    Please review the response. If you are satisfied, you can accept it to close the case. If not, you may escalate it for a final logged disposition by the ICC Head.
                </p>
                <div className="flex flex-wrap gap-2">
                    <Button variant="success" onClick={handleAccept} disabled={isSubmitting}>
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Accept Resolution
                    </Button>
                    <Button variant="destructive" onClick={handleEscalate} disabled={isSubmitting}>
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        I'm Not Satisfied, Escalate
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}

function CaseActionDialog({
  open,
  onOpenChange,
  caseId,
  actionType,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  caseId: string;
  actionType: 'Withdraw' | 'Conciliation';
  onSubmit: () => void;
}) {
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { role } = useRole();

  const handleSubmit = async () => {
    if (!reason || !role) {
      toast({ variant: 'destructive', title: 'Reason required', description: 'Please provide a reason for your request.' });
      return;
    }
    setIsSubmitting(true);
    try {
      if (actionType === 'Withdraw') {
        await requestPoshCaseWithdrawal(caseId, role, reason);
      } else {
        await requestPoshCaseConciliation(caseId, role, reason);
      }
      toast({ title: 'Request Submitted', description: `Your request for ${actionType.toLowerCase()} has been sent to the ICC.` });
      onSubmit();
      onOpenChange(false);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Submission Failed' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Request Case {actionType}</DialogTitle>
          <DialogDescription>Please provide a detailed reason for your request. This will be sent to the ICC for review.</DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={6} placeholder={`My reason for requesting ${actionType.toLowerCase()} is...`} />
        </div>
        <DialogFooter>
          <DialogClose asChild><Button variant="ghost">Cancel</Button></DialogClose>
          <Button onClick={handleSubmit} disabled={isSubmitting || !reason}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Submit Request
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function RetaliationDialog({
  open,
  onOpenChange,
  parentCaseId,
  onSubmit
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  parentCaseId: string;
  onSubmit: (newCaseId: string) => void;
}) {
    const { role } = useRole();
    const { toast } = useToast();
    const [description, setDescription] = useState('');
    const [files, setFiles] = useState<File[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setFiles([...files, ...Array.from(e.target.files)]);
        }
    };

    const removeFile = (fileToRemove: File) => {
        setFiles(files.filter(file => file !== fileToRemove));
    };

    const handleSubmit = async () => {
        if (!description || !role) {
            toast({ variant: 'destructive', title: "Description Required", description: "Please describe the incident of retaliation." });
            return;
        }
        setIsSubmitting(true);
        try {
            const newCase = await reportPoshRetaliation({
                parentCaseId,
                submittedBy: role,
                description,
                files,
            });
            toast({ title: "Retaliation Report Submitted", description: "A new linked case has been created and sent to the ICC Head." });
            onSubmit(newCase.caseId);
            onOpenChange(false);
        } catch (error) {
            toast({ variant: 'destructive', title: 'Submission Failed' });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Report Retaliation</DialogTitle>
                    <DialogDescription>This will create a new, confidential case linked to this one and assign it directly to the ICC Head. Describe the retaliatory action in detail.</DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-4">
                    <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={8} placeholder="Describe the incident of retaliation..." />
                    <div className="space-y-2">
                        <Label>Attach Evidence (Optional)</Label>
                        <Button asChild variant="outline" size="sm">
                            <Label>
                                <Paperclip className="mr-2 h-4 w-4" />
                                Attach Files
                                <input type="file" ref={fileInputRef} className="hidden" multiple onChange={handleFileChange} />
                            </Label>
                        </Button>
                        <div className="space-y-1">
                            {files.map((file, i) => (
                               <div key={i} className="text-sm flex items-center justify-between p-1 bg-muted rounded-md">
                                   <span className="font-medium text-muted-foreground truncate">{file.name}</span>
                                   <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive" onClick={() => removeFile(file)}>
                                       <XIcon className="h-4 w-4" />
                                   </Button>
                               </div>
                           ))}
                        </div>
                    </div>
                </div>
                <DialogFooter>
                    <DialogClose asChild><Button variant="ghost">Cancel</Button></DialogClose>
                    <Button variant="destructive" onClick={handleSubmit} disabled={isSubmitting || !description}>
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Submit Report
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

const getPoshCaseKey = (role: string | null) => role ? `posh_cases_${role.replace(/\s/g, '_')}` : null;

function MyPoshSubmissions({ onUpdate, allCases, setAllCases }: { onUpdate: () => void, allCases: PoshComplaint[], setAllCases: (cases: PoshComplaint[]) => void }) {
    const [myCases, setMyCases] = useState<PoshComplaint[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { role } = useRole();
    
    // State for action dialogs
    const [dialogState, setDialogState] = useState<{ open: 'withdraw' | 'conciliation' | 'retaliation' | null, caseId: string | null }>({ open: null, caseId: null });

    const fetchMyCases = useCallback(async () => {
        if (!role) return;
        setIsLoading(true);
        const caseKey = getPoshCaseKey(role);
        let allKnownCaseIds: string[] = [];

        if (caseKey) {
            allKnownCaseIds = JSON.parse(sessionStorage.getItem(caseKey) || '[]');
        }
        
        const mySubmittedCases = allCases.filter(c => c.complainantInfo.name === roleUserMapping[role].name);
        mySubmittedCases.forEach(c => {
            if (!allKnownCaseIds.includes(c.caseId)) {
                allKnownCaseIds.push(c.caseId);
            }
        });

        if (caseKey) {
            sessionStorage.setItem(caseKey, JSON.stringify(allKnownCaseIds));
        }

        if (allKnownCaseIds.length > 0) {
            const cases = await getComplaintsByIds(allKnownCaseIds);
            setMyCases(cases);
        } else {
            setMyCases([]);
        }

        setIsLoading(false);
    }, [role, allCases]);

    useEffect(() => {
        fetchMyCases();
    }, [fetchMyCases]);
    
    const handleLocalUpdate = async () => {
      const caseKey = getPoshCaseKey(role);
      let allKnownCaseIds: string[] = [];
       if (caseKey) {
            allKnownCaseIds = JSON.parse(sessionStorage.getItem(caseKey) || '[]');
        }
      const updatedCases = await getComplaintsByIds(allKnownCaseIds);
      setAllCases(updatedCases);
      onUpdate();
    }

    const capitalizeFirstLetter = (string: string) => {
        if (!string) return '';
        return string.charAt(0).toUpperCase() + string.slice(1);
    }


    if (isLoading) {
        return <Skeleton className="h-24 w-full" />
    }

    if (myCases.length === 0) {
        return (
             <div className="mt-4 text-center py-8 border-2 border-dashed rounded-lg">
                <p className="text-muted-foreground">You have not submitted any POSH complaints.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
                <List className="h-5 w-5" />
                My Raised Cases
            </h2>
            <CaseActionDialog
              open={dialogState.open === 'withdraw'}
              onOpenChange={() => setDialogState({ open: null, caseId: null })}
              caseId={dialogState.caseId!}
              actionType="Withdraw"
              onSubmit={handleLocalUpdate}
            />
            <CaseActionDialog
              open={dialogState.open === 'conciliation'}
              onOpenChange={() => setDialogState({ open: null, caseId: null })}
              caseId={dialogState.caseId!}
              actionType="Conciliation"
              onSubmit={handleLocalUpdate}
            />
            <RetaliationDialog
              open={dialogState.open === 'retaliation'}
              onOpenChange={() => setDialogState({ open: null, caseId: null })}
              parentCaseId={dialogState.caseId!}
              onSubmit={() => {
                  const caseKey = getPoshCaseKey(role);
                  if (caseKey) {
                     // The new case ID will be fetched with the update
                      handleLocalUpdate();
                  }
              }}
            />

             <Accordion type="single" collapsible className="w-full">
                 {myCases.map(item => {
                    const isCaseClosed = item.caseStatus.startsWith('Closed') || item.caseStatus.startsWith('Resolved');
                    const isAwaitingMyAction = item.caseStatus === 'Pending Complainant Acknowledgement';
                    return (
                    <AccordionItem value={item.caseId} key={item.caseId}>
                        <AccordionTrigger className="text-left hover:no-underline">
                           <div className="flex justify-between items-center w-full">
                                <div className="flex items-center gap-4 flex-1 min-w-0">
                                    <p className="font-semibold truncate">{capitalizeFirstLetter(item.title)}</p>
                                </div>
                                <div className="flex items-center gap-4 pl-4 mr-2">
                                    <span className="font-mono text-sm text-muted-foreground truncate hidden sm:inline-block">
                                        ID: {item.caseId}
                                    </span>
                                     <Badge variant={item.caseStatus === 'New' || isAwaitingMyAction ? 'destructive' : 'secondary'}>
                                        {item.caseStatus}
                                    </Badge>
                                </div>
                            </div>
                        </AccordionTrigger>
                        <AccordionContent className="space-y-4 pt-2">
                            {isAwaitingMyAction && <RetaliationAcknowledgementWidget item={item} onUpdate={handleLocalUpdate} />}
                            <CaseHistory trail={item.auditTrail} />
                             <div className="pt-4 border-t">
                                <p className="text-sm font-medium mb-2">Case Actions</p>
                                <div className="flex flex-wrap gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        disabled={isCaseClosed}
                                        onClick={() => setDialogState({ open: 'withdraw', caseId: item.caseId })}
                                    >
                                        <XIcon className="mr-2 h-4 w-4" />
                                        Withdraw
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        disabled={isCaseClosed}
                                        onClick={() => setDialogState({ open: 'conciliation', caseId: item.caseId })}
                                    >
                                        <Handshake className="mr-2 h-4 w-4" />
                                        Request Conciliation
                                    </Button>
                                    <Button
                                        variant="destructive"
                                        size="sm"
                                        onClick={() => setDialogState({ open: 'retaliation', caseId: item.caseId })}
                                    >
                                        <AlertTriangle className="mr-2 h-4 w-4" />
                                        Report Retaliation
                                    </Button>
                                </div>
                            </div>
                        </AccordionContent>
                    </AccordionItem>
                )})}
            </Accordion>
        </div>
    )
}

function PoshComplaintForm({ onSubmitted }: { onSubmitted: () => void }) {
  const { toast } = useToast();
  const { role } = useRole();
  const [isPending, startTransition] = useTransition();
  const [showDelayDialog, setShowDelayDialog] = useState(false);
  const [showConfirmationDialog, setShowConfirmationDialog] = useState(false);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      location: "",
      complainantName: role ? roleUserMapping[role].name : "",
      complainantDepartment: "",
      respondentName: "",
      respondentDetails: "",
      incidentDetails: "",
      witnesses: "",
      evidenceFiles: [],
      priorIncidents: 'no',
      priorIncidentsDetails: "",
      priorComplaints: 'no',
      priorComplaintsDetails: "",
      delayJustification: "",
      delayEvidenceFiles: [],
      confidentialityAcknowledgement: false,
      consent: false,
    },
  });

  const handleDateChange = (date: Date | undefined) => {
    if (!date) return;
    form.setValue("dateOfIncident", date);
    setIsDatePickerOpen(false);
    const daysDiff = differenceInDays(new Date(), date);
    if (daysDiff > 90) {
      setShowDelayDialog(true);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, fieldName: "evidenceFiles" | "delayEvidenceFiles") => {
    const currentFiles = form.getValues(fieldName) || [];
    const newFiles = e.target.files ? Array.from(e.target.files) : [];
    form.setValue(fieldName, [...currentFiles, ...newFiles]);
  };

  const removeFile = (fileToRemove: File, fieldName: "evidenceFiles" | "delayEvidenceFiles") => {
    const currentFiles = form.getValues(fieldName) || [];
    form.setValue(fieldName, currentFiles.filter(file => file !== fileToRemove));
  };
  
  const onSubmit = (values: z.infer<typeof formSchema>) => {
    startTransition(async () => {
      try {
        if (!role) {
            toast({
                variant: "destructive",
                title: "Error",
                description: "User role not found.",
            });
            return;
        }
        await submitPoshComplaint({ ...values, role });
        setShowConfirmationDialog(true);
        form.reset();
        onSubmitted();
      } catch (error) {
        console.error("POSH Submission failed:", error);
        toast({
          variant: "destructive",
          title: "Submission Failed",
          description: "There was an error submitting your complaint. Please try again.",
        });
      }
    });
  };

  const evidenceFiles = form.watch("evidenceFiles");
  const delayEvidenceFiles = form.watch("delayEvidenceFiles");
  const priorIncidents = form.watch("priorIncidents");
  const priorComplaints = form.watch("priorComplaints");


  return (
    <>
      <AlertDialog open={showConfirmationDialog} onOpenChange={setShowConfirmationDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Complaint Received</AlertDialogTitle>
            <AlertDialogDescription>
              Your POSH complaint has been submitted successfully. The ICC will review your case and contact you for the next steps. You can monitor the status of your case below.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setShowConfirmationDialog(false)}>Close</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={showDelayDialog} onOpenChange={setShowDelayDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Submission Beyond Time Limit</DialogTitle>
            <DialogDescription>
                The incident date is more than 90 days ago. Submissions beyond this period require special approval. Please provide a justification for the delay; this will be sent to the ICC Head for review before the case can proceed.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <FormField
              control={form.control}
              name="delayJustification"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Justification for Delay</FormLabel>
                  <FormControl>
                    <Textarea {...field} rows={5} placeholder="Explain the reason for the delay..." />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <div className="space-y-2">
                <FormLabel>Supporting Documents for Delay (Optional)</FormLabel>
                 <Button asChild variant="outline" size="sm">
                  <Label>
                    <Paperclip className="mr-2 h-4 w-4" />
                    Attach Files
                    <Controller
                      control={form.control}
                      name="delayEvidenceFiles"
                      render={({ field }) => (
                        <input type="file" className="hidden" multiple onChange={(e) => handleFileChange(e, "delayEvidenceFiles")} />
                      )}
                    />
                  </Label>
                </Button>
                <div className="space-y-1">
                    {delayEvidenceFiles?.map((file, i) => (
                       <div key={i} className="text-sm flex items-center justify-between p-1 bg-muted rounded-md">
                           <span className="font-medium text-muted-foreground truncate">{file.name}</span>
                           <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive" onClick={() => removeFile(file, "delayEvidenceFiles")}>
                               <XIcon className="h-4 w-4" />
                           </Button>
                       </div>
                   ))}
                </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setShowDelayDialog(false)}>Submit Justification</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <div className="p-4 md:p-8">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <Card>
              <CardHeader>
                <CardTitle className="text-3xl font-bold font-headline mb-2 text-foreground flex items-center gap-3">
                  <Scale className="h-8 w-8" />
                  POSH Complaint Form
                </CardTitle>
                <CardDescription className="text-lg text-muted-foreground">
                  File a confidential complaint with the Internal Complaints Committee (ICC). All submissions are treated with the utmost seriousness and privacy.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-8">
                
                <div className="space-y-4 p-4 border rounded-lg">
                    <h3 className="font-semibold text-lg">Complaint Information</h3>
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <FormField control={form.control} name="title" render={({ field }) => (
                           <FormItem className="space-y-2">
                             <FormLabel>Title</FormLabel>
                             <FormControl><Input {...field} placeholder="e.g., Incident of Harassment" /></FormControl>
                             <FormMessage />
                           </FormItem>
                         )} />
                         <FormField control={form.control} name="location" render={({ field }) => (
                           <FormItem className="space-y-2">
                             <FormLabel>Location</FormLabel>
                             <FormControl><Input {...field} placeholder="e.g., Office, Cafeteria" /></FormControl>
                             <FormMessage />
                           </FormItem>
                         )} />
                         <FormField
                            control={form.control}
                            name="dateOfIncident"
                            render={({ field }) => (
                            <FormItem className="flex flex-col space-y-2">
                                <FormLabel>Date of Incident</FormLabel>
                                <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
                                    <PopoverTrigger asChild>
                                        <FormControl>
                                            <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !field.value && "text-muted-foreground")}>
                                                <CalendarIcon className="mr-2 h-4 w-4" />
                                                {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                                            </Button>
                                        </FormControl>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar mode="single" selected={field.value} onSelect={handleDateChange} disabled={(date) => date > new Date()} initialFocus />
                                    </PopoverContent>
                                </Popover>
                                <FormMessage/>
                            </FormItem>
                         )} />
                     </div>
                </div>
                
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <div className="space-y-4 p-4 border rounded-lg">
                         <h3 className="font-semibold text-lg">Your Details (Complainant)</h3>
                         <FormField control={form.control} name="complainantName" render={({ field }) => (
                           <FormItem className="space-y-2">
                            <FormLabel>Full Name</FormLabel>
                             <FormControl><Input {...field} /></FormControl>
                             <FormMessage />
                           </FormItem>
                         )} />
                         <FormField control={form.control} name="complainantDepartment" render={({ field }) => (
                           <FormItem className="space-y-2">
                            <FormLabel>Department</FormLabel>
                             <FormControl><Input {...field} /></FormControl>
                             <FormMessage />
                           </FormItem>
                         )} />
                     </div>
                     <div className="space-y-4 p-4 border rounded-lg">
                         <h3 className="font-semibold text-lg">Accused Person's Details (Respondent)</h3>
                         <FormField control={form.control} name="respondentName" render={({ field }) => (
                           <FormItem className="space-y-2">
                            <FormLabel>Full Name</FormLabel>
                             <FormControl><Input {...field} /></FormControl>
                             <FormMessage />
                           </FormItem>
                         )} />
                         <FormField control={form.control} name="respondentDetails" render={({ field }) => (
                           <FormItem className="space-y-2">
                            <FormLabel>Department/Role (if known)</FormLabel>
                             <FormControl><Input {...field} placeholder="(if known)" /></FormControl>
                             <FormMessage />
                           </FormItem>
                         )} />
                     </div>
                 </div>

                <div className="space-y-4 p-4 border rounded-lg">
                    <h3 className="font-semibold text-lg">Incident Details</h3>
                     <FormField control={form.control} name="incidentDetails" render={({ field }) => (
                       <FormItem><FormLabel>Detailed Description of Incident(s)</FormLabel><FormControl><Textarea {...field} rows={8} placeholder="Describe what happened, including dates, times, and sequence of events..." /></FormControl><FormMessage /></FormItem>
                     )} />
                     <FormField control={form.control} name="witnesses" render={({ field }) => (
                       <FormItem><FormLabel>Witnesses (if any)</FormLabel><FormControl><Textarea {...field} rows={3} placeholder="List names and contact information of anyone who witnessed the incident(s)." /></FormControl><FormMessage /></FormItem>
                     )} />
                     <div className="space-y-2">
                        <FormLabel>Supporting Evidence (e.g., emails, screenshots)</FormLabel>
                        <Button asChild variant="outline" size="sm">
                          <Label>
                            <Paperclip className="mr-2 h-4 w-4" />
                            Attach Files
                            <Controller
                              control={form.control}
                              name="evidenceFiles"
                              render={({ field }) => (
                                <input type="file" className="hidden" multiple onChange={(e) => handleFileChange(e, "evidenceFiles")} />
                              )}
                            />
                          </Label>
                        </Button>
                        <div className="space-y-1">
                            {evidenceFiles?.map((file, i) => (
                               <div key={i} className="text-sm flex items-center justify-between p-1 bg-muted rounded-md">
                                   <span className="font-medium text-muted-foreground truncate">{file.name}</span>
                                   <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive" onClick={() => removeFile(file, "evidenceFiles")}>
                                       <XIcon className="h-4 w-4" />
                                   </Button>
                               </div>
                           ))}
                        </div>
                    </div>
                </div>

                <div className="space-y-4 p-4 border rounded-lg">
                     <h3 className="font-semibold text-lg">Prior History</h3>
                     <FormField control={form.control} name="priorIncidents" render={({ field }) => (
                        <FormItem className="space-y-3">
                            <FormLabel>Have similar incidents with the respondent occurred before?</FormLabel>
                            <FormControl><RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex gap-4">
                               <FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="yes" /></FormControl><FormLabel className="font-normal">Yes</FormLabel></FormItem>
                               <FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="no" /></FormControl><FormLabel className="font-normal">No</FormLabel></FormItem>
                            </RadioGroup></FormControl><FormMessage />
                        </FormItem>
                     )} />
                    {priorIncidents === 'yes' && (
                        <FormField control={form.control} name="priorIncidentsDetails" render={({ field }) => (
                           <FormItem><FormLabel>If yes, please provide details</FormLabel><FormControl><Textarea {...field} rows={3} placeholder="Briefly describe previous incidents..." /></FormControl><FormMessage /></FormItem>
                        )} />
                    )}
                    <FormField control={form.control} name="priorComplaints" render={({ field }) => (
                        <FormItem className="space-y-3">
                            <FormLabel>Have you filed any complaints against the respondent before?</FormLabel>
                            <FormControl><RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex gap-4">
                               <FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="yes" /></FormControl><FormLabel className="font-normal">Yes</FormLabel></FormItem>
                               <FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="no" /></FormControl><FormLabel className="font-normal">No</FormLabel></FormItem>
                            </RadioGroup></FormControl><FormMessage />
                        </FormItem>
                     )} />
                    {priorComplaints === 'yes' && (
                        <FormField control={form.control} name="priorComplaintsDetails" render={({ field }) => (
                           <FormItem><FormLabel>If yes, please provide details</FormLabel><FormControl><Textarea {...field} rows={3} placeholder="Briefly describe previous complaints (e.g., when, to whom)..." /></FormControl><FormMessage /></FormItem>
                        )} />
                    )}
                </div>

                <div className="space-y-4 p-4 border rounded-lg">
                    <h3 className="font-semibold text-lg">Confidentiality and Consent</h3>
                    <FormField control={form.control} name="confidentialityAcknowledgement" render={({ field }) => (
                       <FormItem className="flex flex-row items-start space-x-3 space-y-0"><FormControl>
                           <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                       </FormControl><div className="space-y-1 leading-none">
                           <FormLabel>I acknowledge that this complaint will be handled confidentially by the ICC.</FormLabel>
                       </div></FormItem>
                     )} />
                     <FormField control={form.control} name="consent" render={({ field }) => (
                       <FormItem className="flex flex-row items-start space-x-3 space-y-0"><FormControl>
                           <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                       </FormControl><div className="space-y-1 leading-none">
                           <FormLabel>I confirm that the information provided is true to the best of my knowledge and consent to the ICC proceeding with an inquiry.</FormLabel>
                       </div></FormItem>
                     )} />
                </div>
              </CardContent>
              <CardFooter>
                 <Button type="submit" disabled={isPending || !form.watch("consent") || !form.watch("confidentialityAcknowledgement")}>
                    {isPending ? <Loader2 className="mr-2 animate-spin" /> : <Send className="mr-2" />}
                    Submit Complaint
                </Button>
              </CardFooter>
            </Card>
          </form>
        </Form>
      </div>
    </>
  );
}


export default function PoshPage() {
    const { role, setRole, isLoading } = useRole();
    const [allCases, setAllCases] = useState<PoshComplaint[]>([]);
    
    const fetchAllCases = useCallback(async () => {
        const all = await getAllPoshComplaints();
        setAllCases(all);
    }, []);

    useEffect(() => {
        fetchAllCases();
         const handleStorageChange = () => fetchAllCases();
        window.addEventListener('storage', handleStorageChange);
        window.addEventListener('poshComplaintUpdated', handleStorageChange);
        return () => {
            window.removeEventListener('storage', handleStorageChange);
            window.removeEventListener('poshComplaintUpdated', handleStorageChange);
        };
    }, [fetchAllCases]);


    if (isLoading || !role) {
        return (
            <div className="p-4 md:p-8">
                <Skeleton className="h-screen w-full" />
            </div>
        )
    }
  
    return (
        <DashboardLayout role={role} onSwitchRole={setRole}>
            <PoshComplaintForm onSubmitted={fetchAllCases} />
            <div className="p-4 md:p-8">
              <Separator className="my-8" />
              <MyPoshSubmissions onUpdate={fetchAllCases} allCases={allCases} setAllCases={setAllCases} />
            </div>
        </DashboardLayout>
    );
}
