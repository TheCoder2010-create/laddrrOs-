
"use client";

import { useState, useTransition, useEffect, useCallback } from 'react';
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
import { Scale, CalendarIcon, Send, Loader2, Paperclip, XIcon, List, CheckCircle } from 'lucide-react';
import { submitPoshComplaint, type PoshComplaintInput, getComplaintsForUser, PoshComplaint, PoshAuditEvent, getComplaintsByIds } from '@/services/posh-service';
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

    return (
        <div className="space-y-2 pt-4">
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

const getPoshCaseKey = (role: string | null) => role ? `posh_cases_${role.replace(/\s/g, '_')}` : null;

function MyPoshSubmissions({ onUpdate, key }: { onUpdate: () => void, key: number }) {
    const [myCases, setMyCases] = useState<PoshComplaint[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { role } = useRole();

    const fetchMyCases = useCallback(async () => {
        if (!role) return;
        setIsLoading(true);
        const caseKey = getPoshCaseKey(role);
        if (caseKey) {
            const caseIds = JSON.parse(sessionStorage.getItem(caseKey) || '[]');
            if (caseIds.length > 0) {
                const cases = await getComplaintsByIds(caseIds);
                setMyCases(cases);
            } else {
                setMyCases([]);
            }
        } else {
             setMyCases([]);
        }
        setIsLoading(false);
    }, [role]);

    useEffect(() => {
        fetchMyCases();
        const handleStorageChange = () => fetchMyCases();
        window.addEventListener('storage', handleStorageChange);
        window.addEventListener('poshComplaintUpdated', handleStorageChange);
        return () => {
            window.removeEventListener('storage', handleStorageChange);
            window.removeEventListener('poshComplaintUpdated', handleStorageChange);
        };
    }, [fetchMyCases, key]);

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
             <Accordion type="single" collapsible className="w-full">
                 {myCases.map(item => (
                    <AccordionItem value={item.caseId} key={item.caseId}>
                        <AccordionTrigger>
                           <div className="flex justify-between items-center w-full">
                                <div className="flex flex-col items-start text-left">
                                    <p className="font-semibold">{item.title}</p>
                                    <p className="text-sm font-normal text-muted-foreground">
                                        Case #{item.caseId.substring(0, 8)}... &bull; Submitted {format(new Date(item.createdAt), 'PPP')}
                                    </p>
                                </div>
                                <div className="mr-2">
                                     <Badge variant={item.caseStatus === 'New' ? 'destructive' : 'secondary'}>
                                        {item.caseStatus}
                                    </Badge>
                                </div>
                            </div>
                        </AccordionTrigger>
                        <AccordionContent className="space-y-4 pt-2">
                            <CaseHistory trail={item.auditTrail} />
                        </AccordionContent>
                    </AccordionItem>
                ))}
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
        await submitPoshComplaint(values as PoshComplaintInput);
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
              Your incident date is more than 90 days ago. Please provide a justification for the delay in filing your complaint.
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
                            <FormItem><FormLabel>Title</FormLabel><FormControl><Input {...field} placeholder="e.g., Incident of Harassment" /></FormControl><FormMessage /></FormItem>
                         )} />
                         <FormField control={form.control} name="location" render={({ field }) => (
                            <FormItem><FormLabel>Location</FormLabel><FormControl><Input {...field} placeholder="e.g., Office, Cafeteria" /></FormControl><FormMessage /></FormItem>
                         )} />
                         <FormField control={form.control} name="dateOfIncident" render={({ field }) => (
                           <FormItem><FormLabel>Date</FormLabel>
                             <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}><PopoverTrigger asChild>
                               <FormControl>
                                 <Button variant={"outline"} className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                                   {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                                   <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                 </Button>
                               </FormControl>
                             </PopoverTrigger>
                             <PopoverContent className="w-auto p-0" align="start">
                               <Calendar mode="single" selected={field.value} onSelect={handleDateChange} disabled={(date) => date > new Date()} initialFocus />
                             </PopoverContent></Popover><FormMessage />
                           </FormItem>
                         )} />
                     </div>
                </div>
                
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <div className="space-y-4 p-4 border rounded-lg">
                         <h3 className="font-semibold text-lg">Your Details (Complainant)</h3>
                         <div className="grid grid-cols-3 items-center gap-4">
                             <Label className="text-right">Full Name</Label>
                             <FormField control={form.control} name="complainantName" render={({ field }) => (
                               <FormItem className="col-span-2">
                                 <FormControl><Input {...field} /></FormControl>
                                 <FormMessage />
                               </FormItem>
                             )} />
                         </div>
                         <div className="grid grid-cols-3 items-center gap-4">
                              <Label className="text-right">Department</Label>
                             <FormField control={form.control} name="complainantDepartment" render={({ field }) => (
                               <FormItem className="col-span-2">
                                 <FormControl><Input {...field} /></FormControl>
                                 <FormMessage />
                               </FormItem>
                             )} />
                         </div>
                     </div>
                     <div className="space-y-4 p-4 border rounded-lg">
                         <h3 className="font-semibold text-lg">Accused Person's Details (Respondent)</h3>
                         <div className="grid grid-cols-3 items-center gap-4">
                            <Label className="text-right">Full Name</Label>
                             <FormField control={form.control} name="respondentName" render={({ field }) => (
                               <FormItem className="col-span-2">
                                 <FormControl><Input {...field} /></FormControl>
                                 <FormMessage />
                               </FormItem>
                             )} />
                         </div>
                         <div className="grid grid-cols-3 items-center gap-4">
                            <Label className="text-right">Department/Role</Label>
                             <FormField control={form.control} name="respondentDetails" render={({ field }) => (
                               <FormItem className="col-span-2">
                                 <FormControl><Input {...field} placeholder="(if known)" /></FormControl>
                                 <FormMessage />
                               </FormItem>
                             )} />
                         </div>
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
    const [key, setKey] = useState(0); 

    const handleSubmission = () => {
        setKey(prev => prev + 1);
    }

    if (isLoading || !role) {
        return (
            <div className="p-4 md:p-8">
                <Skeleton className="h-screen w-full" />
            </div>
        )
    }
  
    return (
        <DashboardLayout role={role} onSwitchRole={setRole}>
            <PoshComplaintForm onSubmitted={handleSubmission} />
            <div className="p-4 md:p-8">
              <Separator className="my-8" />
              <MyPoshSubmissions onUpdate={handleSubmission} key={key} />
            </div>
        </DashboardLayout>
    );
}
