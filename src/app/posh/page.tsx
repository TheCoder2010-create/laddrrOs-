
"use client";

import { useState, useTransition } from 'react';
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
import { Scale, CalendarIcon, Send, Loader2, Paperclip, XIcon } from 'lucide-react';
import { submitPoshComplaint, type PoshComplaintInput } from '@/services/posh-service';
import { Skeleton } from '@/components/ui/skeleton';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

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

function PoshComplaintForm() {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [showDelayDialog, setShowDelayDialog] = useState(false);
  const [showConfirmationDialog, setShowConfirmationDialog] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      location: "",
      complainantName: "",
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
              Your POSH complaint has been submitted successfully. The ICC will review your case and contact you for the next steps.
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
                  <FormLabel>Justification for Delay <span className="text-destructive">*</span></FormLabel>
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
                {/* Complaint Info */}
                <div className="space-y-4 p-4 border rounded-lg">
                    <h3 className="font-semibold text-lg">1. Complaint Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField control={form.control} name="title" render={({ field }) => (
                           <FormItem><FormLabel>Complaint Title <span className="text-destructive">*</span></FormLabel><FormControl><Input {...field} placeholder="e.g., Incident of Harassment" /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="location" render={({ field }) => (
                           <FormItem><FormLabel>Location of Incident <span className="text-destructive">*</span></FormLabel><FormControl><Input {...field} placeholder="e.g., Office, Cafeteria" /></FormControl><FormMessage /></FormItem>
                        )} />
                    </div>
                     <FormField control={form.control} name="dateOfIncident" render={({ field }) => (
                       <FormItem className="flex flex-col"><FormLabel>Date of Incident <span className="text-destructive">*</span></FormLabel>
                         <Popover><PopoverTrigger asChild>
                           <FormControl>
                             <Button variant={"outline"} className={cn("w-[240px] pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                               {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                               <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                             </Button>
                           </FormControl>
                         </PopoverTrigger>
                         <PopoverContent className="w-auto p-0" align="start">
                           <Calendar mode="single" selected={field.value} onSelect={(date) => handleDateChange(date)} disabled={(date) => date > new Date()} initialFocus />
                         </PopoverContent></Popover><FormMessage />
                       </FormItem>
                     )} />
                </div>
                
                {/* Complainant & Respondent */}
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <div className="space-y-4 p-4 border rounded-lg">
                         <h3 className="font-semibold text-lg">2. Your Details (Complainant)</h3>
                         <FormField control={form.control} name="complainantName" render={({ field }) => (
                           <FormItem><FormLabel>Full Name <span className="text-destructive">*</span></FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                         )} />
                         <FormField control={form.control} name="complainantDepartment" render={({ field }) => (
                           <FormItem><FormLabel>Department <span className="text-destructive">*</span></FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                         )} />
                     </div>
                     <div className="space-y-4 p-4 border rounded-lg">
                         <h3 className="font-semibold text-lg">3. Accused Person's Details (Respondent)</h3>
                         <FormField control={form.control} name="respondentName" render={({ field }) => (
                           <FormItem><FormLabel>Full Name <span className="text-destructive">*</span></FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                         )} />
                         <FormField control={form.control} name="respondentDetails" render={({ field }) => (
                           <FormItem><FormLabel>Department/Role (if known)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                         )} />
                     </div>
                 </div>

                {/* Incident Details */}
                <div className="space-y-4 p-4 border rounded-lg">
                    <h3 className="font-semibold text-lg">4. Incident Details</h3>
                     <FormField control={form.control} name="incidentDetails" render={({ field }) => (
                       <FormItem><FormLabel>Detailed Description of Incident(s) <span className="text-destructive">*</span></FormLabel><FormControl><Textarea {...field} rows={8} placeholder="Describe what happened, including dates, times, and sequence of events..." /></FormControl><FormMessage /></FormItem>
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

                {/* Prior History */}
                <div className="space-y-4 p-4 border rounded-lg">
                     <h3 className="font-semibold text-lg">5. Prior History</h3>
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

                {/* Consent */}
                <div className="space-y-4 p-4 border rounded-lg">
                    <h3 className="font-semibold text-lg">6. Confidentiality and Consent</h3>
                    <FormField control={form.control} name="confidentialityAcknowledgement" render={({ field }) => (
                       <FormItem className="flex flex-row items-start space-x-3 space-y-0"><FormControl>
                           <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                       </FormControl><div className="space-y-1 leading-none">
                           <FormLabel>I acknowledge that this complaint will be handled confidentially by the ICC. <span className="text-destructive">*</span></FormLabel>
                       </div></FormItem>
                     )} />
                     <FormField control={form.control} name="consent" render={({ field }) => (
                       <FormItem className="flex flex-row items-start space-x-3 space-y-0"><FormControl>
                           <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                       </FormControl><div className="space-y-1 leading-none">
                           <FormLabel>I confirm that the information provided is true to the best of my knowledge and consent to the ICC proceeding with an inquiry. <span className="text-destructive">*</span></FormLabel>
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

    if (isLoading || !role) {
        return (
            <div className="p-4 md:p-8">
                <Skeleton className="h-screen w-full" />
            </div>
        )
    }
  
    return (
        <DashboardLayout role={role} onSwitchRole={setRole}>
            <PoshComplaintForm />
        </DashboardLayout>
    );
}
