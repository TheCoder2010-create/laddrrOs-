

"use client";

import { useState, useEffect, useCallback, ChangeEvent, useRef, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { submitAnonymousConcernFromDashboard, getFeedbackByIds, Feedback, respondToIdentityReveal, employeeAcknowledgeMessageRead, submitIdentifiedConcern, submitEmployeeFeedbackAcknowledgement, submitRetaliationReport, getAllFeedback, submitDirectRetaliationReport, submitAnonymousReply, submitIdentifiedReply, submitSupervisorUpdate, requestIdentityReveal, requestAnonymousInformation, submitFinalDisposition } from '@/services/feedback-service';
import { Skeleton } from '@/components/ui/skeleton';
import { ShieldQuestion, Send, Loader2, User, UserX, List, CheckCircle, Clock, ShieldCheck, Info, MessageCircleQuestion, AlertTriangle, FileUp, GitMerge, Link as LinkIcon, Paperclip, Flag, FolderClosed, FileCheck, MessageSquare, Copy, Download, Sparkles, UserPlus, FileText, ChevronsRight, X as XIcon } from 'lucide-react';
import { useRole, Role } from '@/hooks/use-role';
import DashboardLayout from '@/components/dashboard-layout';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button, buttonVariants } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import { roleUserMapping, getRoleByName, formatActorName } from '@/lib/role-mapping';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { downloadAuditTrailPDF } from '@/lib/pdf-generator';
import { rewriteText } from '@/ai/flows/rewrite-text-flow';
import { Switch } from '@/components/ui/switch';
import { Tooltip, TooltipProvider, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';


const getIdentifiedCaseKey = (role: string | null) => role ? `identified_cases_${role.replace(/\s/g, '_')}` : null;
const getRetaliationCaseKey = (role: string | null) => role ? `direct_retaliation_cases_${role.replace(/\s/g, '_')}` : null;

function AnonymousConcernForm({ onCaseSubmitted, files, setFiles }: { onCaseSubmitted: (trackingId: string) => void, files: File[], setFiles: (files: File[]) => void }) {
    const { toast } = useToast();
    const { role } = useRole();
    const [subject, setSubject] = useState('');
    const [concern, setConcern] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isRewriting, setIsRewriting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setFiles([...files, ...Array.from(e.target.files)]);
        }
    };

    const removeFile = (fileToRemove: File) => {
        setFiles(files.filter(file => file !== fileToRemove));
    };

    const handleRewrite = async () => {
        if (!concern) {
            toast({ variant: 'destructive', title: "Nothing to rewrite", description: "Please enter a message first." });
            return;
        }
        setIsRewriting(true);
        try {
            const result = await rewriteText({ textToRewrite: concern });
            setConcern(result.rewrittenText);
            toast({ title: "Text Rewritten", description: "Your message has been updated by the AI." });
        } catch (error) {
            console.error(error);
            toast({ variant: 'destructive', title: "Rewrite Failed", description: "Could not rewrite the text." });
        } finally {
            setIsRewriting(false);
        }
    };


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!subject || !concern || !role) {
            toast({ variant: 'destructive', title: "Missing Information", description: "Please fill out all fields."});
            return;
        }

        setIsSubmitting(true);
        try {
            const result = await submitAnonymousConcernFromDashboard({ subject, message: concern, files });
            onCaseSubmitted(result.trackingId);
        } catch (error) {
            toast({ variant: 'destructive', title: "Submission Failed", description: "Could not submit your concern."});
            console.error(error);
        } finally {
            setIsSubmitting(false);
            setSubject('');
            setConcern('');
            setFiles([]);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="mt-6 space-y-6">
            <p className="text-sm text-muted-foreground">
                Your name and role will NOT be attached to this submission. It will be routed anonymously to management for review. After submitting, you will be given a unique Tracking ID to check the status of your case on this page.
            </p>
            <div className="space-y-2">
                <Label htmlFor="anon-subject">Subject</Label>
                <Input 
                    id="anon-subject" 
                    value={subject} 
                    onChange={e => setSubject(e.target.value)} 
                    placeholder="Enter a subject for your concern..." 
                    required 
                    disabled={isSubmitting || isRewriting}
                />
            </div>
            <div className="space-y-2">
                <Label htmlFor="anon-concern">Details of Concern</Label>
                <div className="relative">
                    <Textarea 
                        id="anon-concern" 
                        value={concern} 
                        onChange={e => setConcern(e.target.value)} 
                        placeholder="Describe the situation in detail..." 
                        rows={8} 
                        required 
                        disabled={isSubmitting || isRewriting}
                        className="pr-10"
                    />
                     <Input 
                        type="file" 
                        ref={fileInputRef} 
                        className="hidden" 
                        onChange={handleFileChange}
                        multiple
                    />
                    <Button 
                        type="button"
                        variant="ghost" 
                        size="icon" 
                        className="absolute top-2 right-2 text-muted-foreground hover:bg-transparent hover:text-primary"
                        onClick={() => fileInputRef.current?.click()}
                        aria-label="Attach file"
                    >
                        <Paperclip className="h-5 w-5" />
                    </Button>
                </div>
                 {files.length > 0 && (
                    <div className="space-y-2 pt-2">
                        <Label>Attachments</Label>
                        <div className="space-y-1">
                        {files.map((file, i) => (
                            <div key={i} className="text-sm text-muted-foreground flex items-center justify-between p-1.5 bg-muted/50 rounded-md">
                               <span>{file.name}</span>
                               <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeFile(file)}>
                                  <XIcon className="h-4 w-4" />
                               </Button>
                            </div>
                        ))}
                        </div>
                    </div>
                )}
            </div>
            <div className="flex justify-between items-center">
                 <Button variant="outline" type="button" onClick={handleRewrite} disabled={isRewriting || isSubmitting || !concern}>
                    {isRewriting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                    Rewrite with AI
                </Button>
                <Button type="submit" disabled={isSubmitting || isRewriting}>
                    {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                    Submit Anonymously
                </Button>
            </div>
        </form>
    );
}


function IdentifiedConcernForm({ onCaseSubmitted, files, setFiles }: { onCaseSubmitted: () => void, files: File[], setFiles: (files: File[]) => void }) {
    const { toast } = useToast();
    const { role } = useRole();
    const [recipient, setRecipient] = useState('');
    const [subject, setSubject] = useState('');
    const [concern, setConcern] = useState('');
    const [criticality, setCriticality] = useState<'Low' | 'Medium' | 'High' | 'Critical'>('Medium');
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const recipientRole = getRoleByName(recipient);
        if (!subject || !concern || !role || !recipient || !recipientRole) {
            toast({ variant: 'destructive', title: "Missing Information", description: "Please fill out all fields and select a recipient."});
            return;
        }

        setIsSubmitting(true);
        try {
            const result = await submitIdentifiedConcern({
                submittedBy: roleUserMapping[role].name,
                submittedByRole: role,
                recipient: recipientRole,
                subject,
                message: concern,
                criticality,
                isAnonymous: false,
                files,
            });

            const key = getIdentifiedCaseKey(role);
            if (key) {
                const existingIds = JSON.parse(localStorage.getItem(key) || '[]');
                existingIds.push(result.trackingId);
                localStorage.setItem(key, JSON.stringify(existingIds));
            }

            toast({ title: "Concern Submitted", description: `Your concern has been sent to ${recipient}.` });
            setSubject('');
            setConcern('');
            setRecipient('');
            setFiles([]);
            onCaseSubmitted();
        } catch (error) {
            toast({ variant: 'destructive', title: "Submission Failed", description: "Could not submit your concern."});
            console.error(error);
        } finally {
            setIsSubmitting(false);
        }
    }

    const availableRecipients = Object.values(roleUserMapping).filter(user => user.role !== 'Voice – In Silence' && user.role !== role);

    return (
        <form onSubmit={handleSubmit} className="mt-6 space-y-6">
            <p className="text-sm text-muted-foreground">
                Use this form to confidentially report a concern directly to a specific person. Your identity will be attached to this submission.
            </p>
             <div className="space-y-2">
                <Label htmlFor="recipient">Raise Concern To</Label>
                 <Select onValueChange={setRecipient} value={recipient} required>
                    <SelectTrigger id="recipient">
                        <SelectValue placeholder="Select a person to direct your concern to..." />
                    </SelectTrigger>
                    <SelectContent>
                        {availableRecipients.map(user => (
                             <SelectItem key={user.name} value={user.name}>
                                {user.name} ({user.role})
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            <div className="space-y-2">
                <Label htmlFor="subject">Subject</Label>
                <Input 
                    id="subject" 
                    value={subject} 
                    onChange={e => setSubject(e.target.value)} 
                    placeholder="Enter a subject for your concern..." 
                    required 
                />
            </div>
            <div className="space-y-2">
                <Label htmlFor="concern">Details of Concern</Label>
                 <div className="relative">
                    <Textarea 
                        id="concern" 
                        value={concern} 
                        onChange={e => setConcern(e.target.value)} 
                        placeholder="Describe the situation in detail..." 
                        rows={8} 
                        required
                        className="pr-10"
                    />
                     <Input 
                        type="file" 
                        ref={fileInputRef} 
                        className="hidden" 
                        onChange={handleFileChange}
                        multiple
                    />
                    <Button 
                        type="button"
                        variant="ghost" 
                        size="icon" 
                        className="absolute top-2 right-2 text-muted-foreground hover:bg-transparent hover:text-primary"
                        onClick={() => fileInputRef.current?.click()}
                        aria-label="Attach file"
                    >
                        <Paperclip className="h-5 w-5" />
                    </Button>
                </div>
                 {files.length > 0 && (
                    <div className="space-y-2 pt-2">
                        <Label>Attachments</Label>
                        <div className="space-y-1">
                        {files.map((file, i) => (
                            <div key={i} className="text-sm text-muted-foreground flex items-center justify-between p-1.5 bg-muted/50 rounded-md">
                               <span>{file.name}</span>
                               <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeFile(file)}>
                                  <XIcon className="h-4 w-4" />
                               </Button>
                            </div>
                        ))}
                        </div>
                    </div>
                )}
            </div>
            <div className="space-y-2">
                <Label htmlFor="criticality">Perceived Criticality</Label>
                 <Select onValueChange={(value) => setCriticality(value as any)} defaultValue={criticality}>
                    <SelectTrigger id="criticality">
                        <SelectValue placeholder="Select a criticality level" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="Low">Low - Needs attention but not urgent</SelectItem>
                        <SelectItem value="Medium">Medium - Affecting work or morale</SelectItem>
                        <SelectItem value="High">High - Significant impact, needs prompt review</SelectItem>
                        <SelectItem value="Critical">Critical - Urgent issue, potential policy violation</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <div className="flex justify-end">
                <Button type="submit" disabled={isSubmitting || !recipient}>
                    {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                    Submit Concern
                </Button>
            </div>
        </form>
    )
}

function DirectRetaliationForm({ onCaseSubmitted, files, setFiles }: { onCaseSubmitted: () => void, files: File[], setFiles: (files: File[]) => void }) {
    const { toast } = useToast();
    const { role } = useRole();
    const [subject, setSubject] = useState('');
    const [description, setDescription] = useState('');
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!subject || !description || !role) {
            toast({ variant: 'destructive', title: "Missing Information", description: "Please provide a subject and a detailed description." });
            return;
        }
        setIsSubmitting(true);
        try {
            const result = await submitDirectRetaliationReport({
                submittedBy: role,
                subject,
                description,
                files,
            });

            const key = getRetaliationCaseKey(role);
            if (key) {
                const existingIds = JSON.parse(localStorage.getItem(key) || '[]');
                existingIds.push(result.trackingId);
                localStorage.setItem(key, JSON.stringify(existingIds));
            }

            toast({ title: "Retaliation Report Submitted", description: "Your report has been sent directly to the HR Head for immediate review." });
            setSubject('');
            setDescription('');
            setFiles([]);
            onCaseSubmitted();
        } catch (error) {
            toast({ variant: 'destructive', title: "Submission Failed", description: "Could not submit your report." });
            console.error(error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="mt-6 space-y-6">
            <p className="text-sm text-muted-foreground">
                This form is for reporting instances of retaliation or bias. Your identity will be attached, and the report will be sent directly to the HR Head for immediate and confidential review.
            </p>
             <div className="space-y-2">
                <Label htmlFor="retaliation-subject">Subject</Label>
                <Input
                    id="retaliation-subject"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Enter a subject for your report..."
                    required
                />
            </div>
            <div className="space-y-2">
                <Label htmlFor="retaliation-description">Description of Incident</Label>
                <div className="relative">
                    <Textarea
                        id="retaliation-description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Describe the incident in detail..."
                        rows={8}
                        required
                        className="pr-10"
                    />
                    <Input 
                        type="file" 
                        ref={fileInputRef} 
                        className="hidden" 
                        onChange={handleFileChange}
                        multiple
                    />
                    <Button 
                        type="button"
                        variant="ghost" 
                        size="icon" 
                        className="absolute top-2 right-2 text-muted-foreground hover:bg-transparent hover:text-primary"
                        onClick={() => fileInputRef.current?.click()}
                        aria-label="Attach file"
                    >
                        <Paperclip className="h-5 w-5" />
                    </Button>
                </div>
                 {files.length > 0 && (
                    <div className="space-y-2 pt-2">
                        <Label>Attachments</Label>
                        <div className="space-y-1">
                        {files.map((file, i) => (
                            <div key={i} className="text-sm text-muted-foreground flex items-center justify-between p-1.5 bg-muted/50 rounded-md">
                               <span>{file.name}</span>
                               <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeFile(file)}>
                                  <XIcon className="h-4 w-4" />
                               </Button>
                            </div>
                        ))}
                        </div>
                    </div>
                )}
            </div>
            <div className="flex justify-end">
                <Button type="submit" variant="destructive" disabled={isSubmitting}>
                    {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                    Submit to HR Head
                </Button>
            </div>
        </form>
    );
}

function AnonymousReplyWidget({ item, onUpdate }: { item: Feedback, onUpdate: () => void}) {
    const { toast } = useToast();
    const [reply, setReply] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const request = item.auditTrail?.find(e => e.event === 'Information Requested');

    const handleReply = async () => {
        if (!reply) return;
        setIsSubmitting(true);
        try {
            await submitAnonymousReply(item.trackingId, reply);
            toast({ title: "Reply Sent", description: "Your anonymous reply has been sent to the manager." });
            onUpdate();
        } catch (error) {
            toast({ variant: "destructive", title: "Reply Failed" });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
         <Card className="border-2 border-blue-500/50 bg-blue-500/5 rounded-lg">
            <CardHeader>
                <CardTitle className="text-lg text-blue-700 dark:text-blue-400">Action Required: Your manager has requested more information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="p-3 bg-background/50 rounded-md border">
                    <p className="font-semibold text-foreground">Manager's Question:</p>
                    <p className="text-muted-foreground mt-1 whitespace-pre-wrap">{request?.details}</p>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="anonymous-reply">Your Anonymous Reply</Label>
                    <Textarea 
                        id="anonymous-reply"
                        value={reply}
                        onChange={(e) => setReply(e.target.value)}
                        placeholder="Provide the additional information requested here..."
                        rows={5}
                    />
                </div>
                <Button onClick={handleReply} disabled={isSubmitting || !reply}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Submit Reply
                </Button>
            </CardContent>
         </Card>
    )
}

function IdentifiedReplyWidget({ item, onUpdate }: { item: Feedback, onUpdate: () => void}) {
    const { toast } = useToast();
    const [reply, setReply] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const request = item.auditTrail?.find(e => e.event === 'Information Requested');
    const { role } = useRole();

    const handleReply = async () => {
        if (!reply || !role) return;
        setIsSubmitting(true);
        try {
            await submitIdentifiedReply(item.trackingId, role, reply);
            toast({ title: "Reply Sent", description: "Your reply has been sent to the manager." });
            onUpdate();
        } catch (error) {
            toast({ variant: "destructive", title: "Reply Failed" });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
         <Card className="border-2 border-blue-500/50 bg-blue-500/5 rounded-lg">
            <CardHeader>
                <CardTitle className="text-lg text-blue-700 dark:text-blue-400">Action Required: Your manager has requested more information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="p-3 bg-background/50 rounded-md border">
                    <p className="font-semibold text-foreground">Manager's Question:</p>
                    <p className="text-muted-foreground mt-1 whitespace-pre-wrap">{request?.details}</p>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="identified-reply">Your Reply</Label>
                    <Textarea 
                        id="identified-reply"
                        value={reply}
                        onChange={(e) => setReply(e.target.value)}
                        placeholder="Provide the additional information requested here..."
                        rows={5}
                    />
                </div>
                <Button onClick={handleReply} disabled={isSubmitting || !reply}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Submit Reply
                </Button>
            </CardContent>
         </Card>
    )
}

function RevealIdentityWidget({ item, onUpdate }: { item: Feedback, onUpdate: () => void}) {
    const { role } = useRole();
    const { toast } = useToast();
    const [hasAcknowledged, setHasAcknowledged] = useState(false);

    const revealRequest = item.auditTrail?.find(e => e.event === 'Identity Reveal Requested');
    const employeeHasRead = item.auditTrail?.some(e => e.event === "Employee acknowledged manager's assurance message");

    useEffect(() => {
        if (employeeHasRead) {
            setHasAcknowledged(true);
        }
    }, [employeeHasRead]);

    const handleAcknowledge = async () => {
        if (!role) return;
        await employeeAcknowledgeMessageRead(item.trackingId, role);
        setHasAcknowledged(true);
        toast({ title: "Message Acknowledged", description: "You may now respond to the request." });
        onUpdate();
    }

    const handleResponse = async (accept: boolean) => {
        if (!role) return;
        
        await respondToIdentityReveal(item.trackingId, role, accept);

        if (accept) {
            toast({ title: "Identity Revealed", description: "Your identity has been attached to the case. The manager has been notified."});
        } else {
             toast({ variant: 'default', title: "Request Declined", description: "The case has been escalated to HR for a final review."});
        }
        
        onUpdate();
    }

    return (
        <Card className="border-2 border-blue-500/50 bg-blue-500/5 rounded-lg">
            <CardHeader>
                 <CardTitle className="text-lg text-blue-700 dark:text-blue-400">Action Required: Your manager has requested you reveal your identity</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                 {!hasAcknowledged ? (
                     <div className="p-4 bg-background/50 rounded-lg border border-blue-500/20 text-blue-800 dark:text-blue-300">
                         <div className="flex items-start gap-3">
                            <ShieldCheck className="h-5 w-5 mt-1 flex-shrink-0 text-blue-500" />
                            <div className="w-full">
                                <h3 className="font-bold text-base text-foreground">Your Manager's Commitment & Request</h3>
                                <div className="text-sm mt-2 text-muted-foreground prose prose-sm prose-p:my-1 whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: revealRequest?.details?.replace(/\n/g, '<br />') || '' }} />
                                <h3 className="font-bold mt-4 text-base text-foreground">Please Acknowledge This Message</h3>
                                <p className="text-sm mt-1">
                                    Your identity has <strong>not</strong> been revealed. By clicking the button below, you are only confirming that you’ve read this message.<br/>You will decide whether or not to reveal your identity in the next step.
                                </p>
                                <div className="mt-4">
                                    <Button onClick={handleAcknowledge} className="bg-blue-600 hover:bg-blue-700">I Understand, Show Me My Options</Button>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="p-3 bg-background/50 rounded-md border">
                            <p className="font-semibold text-foreground">Manager's Message:</p>
                            <div className="text-muted-foreground mt-1 whitespace-pre-wrap prose prose-sm prose-p:my-1" dangerouslySetInnerHTML={{ __html: revealRequest?.details?.replace(/\n/g, '<br />') || '' }} />
                        </div>
                        <p className="text-sm text-muted-foreground">
                            To proceed with this investigation, the manager needs to know who you are. Your case will be de-anonymized if you accept. If you decline, the case will be escalated to HR for a final review while your identity remains anonymous.
                        </p>
                        <div className="flex flex-wrap gap-2">
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button>Reveal Identity & Proceed</Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Are you sure you want to reveal your identity?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            This action is permanent — once revealed, your name will be attached to this case.
                                            <br /><br />
                                            To protect you, a new button labeled "Report Retaliation or Bias" will become available on this case. You may use this feature at any time, even after the case is closed, to report any unfair treatment.
                                            <br /><br />
                                            When reporting, please include any information that can help support your concern.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => handleResponse(true)}>Yes, Reveal My Identity</AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>

                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="secondary">Decline & Escalate to HR</Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader><AlertDialogTitle>Confirm Escalation</AlertDialogTitle><AlertDialogDescription>This will keep your identity anonymous but escalate the case, along with its history, to the HR Head for final review. This is the final step for this case.</AlertDialogDescription></AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => handleResponse(false)} className={cn(buttonVariants({variant: 'destructive'}))}>Yes, Decline and Escalate</AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </div>
                    </>
                )}
            </CardContent>
        </Card>
    )
}

function AcknowledgementWidget({ item, onUpdate, title, description, responderEventDetails, responderEventActor }: { item: Feedback, onUpdate: () => void, title: string, description: string, responderEventDetails?: string, responderEventActor?: string }) {
    const { toast } = useToast();
    const [comments, setComments] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const handleAcknowledge = async (accepted: boolean) => {
        setIsSubmitting(true);
        try {
            await submitEmployeeFeedbackAcknowledgement(item.trackingId, accepted, comments);
            if (accepted) {
                toast({ title: "Resolution Accepted", description: "The case has been closed." });
            } else {
                if (item.criticality === 'Retaliation Claim') {
                    toast({ title: "Feedback Submitted", description: "The case has been closed with your feedback noted." });
                } else {
                    toast({ title: "Concern Escalated", description: "Your feedback has been escalated to the next level." });
                }
            }
            onUpdate();
        } catch (error) {
            console.error("Failed to submit acknowledgement", error);
            toast({ variant: 'destructive', title: "Acknowledgement Failed" });
        } finally {
            setIsSubmitting(false);
        }
    };
    
    if (!responderEventDetails) return null;

    return (
        <Card className="border-blue-500/50 my-4">
            <CardHeader className="bg-blue-500/10">
                <CardTitle className="flex items-center gap-2 text-blue-700 dark:text-blue-400">
                    <MessageCircleQuestion className="h-6 w-6" />
                    {title}
                </CardTitle>
                <CardDescription>
                   {description}
                </CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
                <div className="p-3 bg-muted/80 rounded-md border">
                    <p className="font-semibold text-foreground">{formatActorName(responderEventActor)}'s Response:</p>
                    <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">{responderEventDetails}</p>
                </div>
                <div className="space-y-2 pt-2">
                    <Label htmlFor={`ack-comments-${item.trackingId}`}>Additional Comments (Optional)</Label>
                    <Textarea
                        id={`ack-comments-${item.trackingId}`}
                        value={comments}
                        onChange={(e) => setComments(e.target.value)}
                        placeholder="Provide more detail here..."
                        rows={3}
                        className="bg-background"
                    />
                </div>
                <div className="flex flex-wrap gap-2 pt-2">
                    <Button onClick={() => handleAcknowledge(true)} variant="success" disabled={isSubmitting}>
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Accept Resolution
                    </Button>
                    <Button onClick={() => handleAcknowledge(false)} variant="destructive" disabled={isSubmitting}>
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        I'm Not Satisfied, {item.criticality === 'Retaliation Claim' ? 'Close Case' : 'Escalate'}
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}

function RetaliationForm({ parentCaseId, onSubmitted }: { parentCaseId: string, onSubmitted: () => void }) {
    const { toast } = useToast();
    const { role } = useRole();
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


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!description || !role) {
            toast({ variant: 'destructive', title: "Missing Information", description: "Please provide a detailed description." });
            return;
        }
        setIsSubmitting(true);
        try {
            await submitRetaliationReport({
                parentCaseId,
                submittedBy: role,
                description,
                files,
            });
            toast({ title: "Retaliation Report Submitted", description: "Your report has been sent directly to the HR Head for immediate review." });
            onSubmitted();
        } catch (error) {
            toast({ variant: 'destructive', title: "Submission Failed", description: "Could not submit your report." });
            console.error(error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="retaliation-description">Description of Incident</Label>
                <div className="relative">
                    <Textarea
                        id="retaliation-description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Describe the incident in detail..."
                        rows={8}
                        required
                        className="pr-10"
                    />
                    <Input 
                        type="file" 
                        ref={fileInputRef} 
                        className="hidden" 
                        onChange={handleFileChange}
                        multiple
                    />
                    <Button 
                        type="button"
                        variant="ghost" 
                        size="icon" 
                        className="absolute top-2 right-2 text-muted-foreground hover:bg-transparent hover:text-primary"
                        onClick={() => fileInputRef.current?.click()}
                        aria-label="Attach file"
                    >
                        <Paperclip className="h-5 w-5" />
                    </Button>
                </div>
                 {files.length > 0 && (
                    <div className="space-y-2 pt-2">
                        <Label>Attachments</Label>
                        <div className="space-y-1">
                        {files.map((file, i) => (
                            <div key={i} className="text-sm text-muted-foreground flex items-center justify-between p-1.5 bg-muted/50 rounded-md">
                               <span>{file.name}</span>
                               <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeFile(file)}>
                                  <XIcon className="h-4 w-4" />
                               </Button>
                            </div>
                        ))}
                        </div>
                    </div>
                )}
            </div>
            <DialogFooter>
                <DialogClose asChild>
                    <Button type="button" variant="secondary">Cancel</Button>
                </DialogClose>
                <Button type="submit" variant="destructive" disabled={isSubmitting}>
                    {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                    Submit to HR Head
                </Button>
            </DialogFooter>
        </form>
    );
}

const auditEventIcons = {
    'Submitted': { icon: FileCheck, color: 'text-muted-foreground' },
    'Identified Concern Submitted': { icon: FileCheck, color: 'text-muted-foreground' },
    'Resolution Submitted': { icon: ChevronsRight, color: 'text-green-500' },
    'HR Resolution Submitted': { icon: ShieldCheck, color: 'text-green-500' },
    'Retaliation Claim Submitted': { icon: Flag, color: 'text-destructive' },
    'Retaliation Claim Filed': { icon: Flag, color: 'text-destructive' },
    'HR Responded to Retaliation Claim': { icon: ShieldCheck, color: 'text-green-500' },
    'Identity Revealed': { icon: User, color: 'text-blue-500' },
    'Identity Reveal Requested': { icon: UserX, color: 'text-yellow-500' },
    'Information Requested': { icon: MessageCircleQuestion, color: 'text-blue-500' },
    'Anonymous User Responded': { icon: MessageSquare, color: 'text-blue-500' },
    'User Responded to Information Request': { icon: MessageSquare, color: 'text-blue-500' },
    'Resolved': { icon: CheckCircle, color: 'text-green-500' },
    'Update Added': { icon: MessageSquare, color: 'text-blue-500' },
    'Employee Escalated Concern': { icon: AlertTriangle, color: 'text-orange-500' },
    'Employee Accepted Resolution': { icon: CheckCircle, color: 'text-green-500' },
    'Final Disposition': { icon: FolderClosed, color: 'text-destructive' },
    'default': { icon: Info, color: 'text-muted-foreground' },
};

const formatEventTitle = (event: string) => {
  const prefixesToRemove = ['Supervisor ', 'Employee ', 'Manager ', 'HR ', 'AM '];
  let formattedEvent = event;
  for (const prefix of prefixesToRemove) {
    if (formattedEvent.startsWith(prefix)) {
      formattedEvent = formattedEvent.substring(prefix.length);
      break; 
    }
  }
  return formattedEvent;
};

function CaseHistory({ item, handleViewCaseDetails, onDownload }: { item: Feedback, handleViewCaseDetails: (e: React.MouseEvent, caseId: string) => void, onDownload: () => void }) {
    const { role } = useRole();

    const filteredTrail = useMemo(() => {
        if (!item.auditTrail) return [];
        if (role === 'Manager') {
            return item.auditTrail.filter(event => event.event !== 'Retaliation Claim Filed');
        }
        return item.auditTrail;
    }, [item.auditTrail, role]);

    if (!filteredTrail || filteredTrail.length === 0) return null;

    return (
        <div className="space-y-2">
            <div className="flex justify-between items-center">
                <Label>Case History</Label>
                <Button variant="ghost" size="sm" onClick={onDownload}>
                    <Download className="mr-2 h-4 w-4" />
                    Download PDF
                </Button>
            </div>
            <div className="relative p-4 border rounded-md bg-muted/50">
                 <div className="absolute left-8 top-8 bottom-8 w-px bg-border -translate-x-1/2"></div>
                <div className="space-y-4">
                    {filteredTrail.map((event, index) => {
                        const eventConfig = auditEventIcons[event.event as keyof typeof auditEventIcons] || auditEventIcons.default;
                        const Icon = eventConfig.icon;
                        
                        const renderDetails = () => {
                            if (!event.details) return null;

                            if (role === 'HR Head' && item.parentCaseId) {
                                return (
                                    <div className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">
                                        Claim submitted for case <a href="#" onClick={(e) => handleViewCaseDetails(e, item.parentCaseId!)} className="font-mono text-primary hover:underline">{item.parentCaseId}</a>.
                                    </div>
                                );
                            }
                            
                            const childRegex = /(New Case ID: )([a-f0-9-]+)/;
                            const childMatch = event.details.match(childRegex);
                            if (childMatch) {
                                const childId = childMatch[2];
                                return (
                                    <div className="text-sm text-muted-foreground mt-1">
                                        New Case ID: <a href="#" onClick={(e) => handleViewCaseDetails(e, childId)} className="font-mono text-primary hover:underline">{childId}</a>
                                    </div>
                                );
                            }

                            return <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">{event.details}</p>;
                        };
                        
                        return (
                            <div key={index} className="flex items-start gap-4 relative">
                                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-background border flex items-center justify-center z-10">
                                    <Icon className={cn("h-5 w-5", eventConfig.color)} />
                                </div>
                                <div className="flex-1 -mt-1">
                                    <p className="font-medium text-sm">
                                        {formatEventTitle(event.event)} by <span className="text-primary">{formatActorName(event.actor)}</span>
                                    </p>
                                    <p className="text-xs text-muted-foreground">{format(new Date(event.timestamp), "PPP p")}</p>
                                    {renderDetails()}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

function FinalDispositionPanel({ feedback, onUpdate }: { feedback: Feedback, onUpdate: () => void }) {
    const { role } = useRole();
    const { toast } = useToast();
    const [finalAction, setFinalAction] = useState<string | null>(null);
    const [finalActionNotes, setFinalActionNotes] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async () => {
        if (!finalAction || !finalActionNotes || !role) {
            toast({ variant: 'destructive', title: "Information Missing", description: "Please select an action and provide notes."});
            return;
        };
        setIsSubmitting(true);
        try {
            await submitFinalDisposition(feedback.trackingId, role, finalAction, finalActionNotes);
            toast({ title: "Final Action Logged", description: `The case has been closed and routed to ${finalAction}.`});
            onUpdate();
        } catch (error) {
            console.error(error);
            toast({ variant: 'destructive', title: "Submission Failed" });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="p-4 border-t mt-4 space-y-4 bg-destructive/10 rounded-b-lg">
            <Label className="text-base font-semibold text-destructive">Final Disposition Required</Label>
            <p className="text-sm text-destructive/90">
                The employee rejected the final resolution. Select a final action to formally close this case. This is the last step in the automated workflow.
            </p>

            {!finalAction ? (
                <div className="flex flex-wrap gap-2">
                    <Button variant="secondary" onClick={() => setFinalAction('Ombudsman')}><UserX className="mr-2" /> Assign to Ombudsman</Button>
                    <Button variant="secondary" onClick={() => setFinalAction('Grievance Office')}><UserPlus className="mr-2" /> Assign to Grievance Office</Button>
                    <Button variant="destructive" onClick={() => setFinalAction('Log & Close')}><FileText className="mr-2" /> Log Dissatisfaction & Close</Button>
                </div>
            ) : (
                <div className="w-full space-y-3">
                    <p className="font-medium">Action: <span className="text-primary">{finalAction}</span></p>
                    <Label htmlFor="final-notes">Reasoning / Final Notes</Label>
                    <Textarea
                        id="final-notes"
                        value={finalActionNotes}
                        onChange={(e) => setFinalActionNotes(e.target.value)}
                        rows={4}
                        className="bg-background"
                        placeholder="Provide your justification for this final action..."
                    />
                    <div className="flex gap-2">
                        <Button className="bg-black hover:bg-black/80 text-white" onClick={handleSubmit} disabled={isSubmitting || !finalActionNotes}>
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                        Submit Final Action
                        </Button>
                        <Button variant="ghost" onClick={() => setFinalAction(null)}>Cancel</Button>
                    </div>
                </div>
            )}
        </div>
    );
}

function AddUpdatePanel({ feedback, onUpdate }: { feedback: Feedback, onUpdate: () => void }) {
    const { role } = useRole();
    const { toast } = useToast();
    const [interimUpdate, setInterimUpdate] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSupervisorUpdate = async () => {
        if (!interimUpdate || !role) return;
        
        setIsSubmitting(true);
        try {
            await submitSupervisorUpdate(feedback.trackingId, role, interimUpdate, false);
            setInterimUpdate('');
            toast({ title: "Update Added" });
            onUpdate();
        } catch(e) {
            console.error(e);
            toast({ variant: 'destructive', title: "Update Failed"});
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <div className="p-4 border rounded-lg bg-muted/20 space-y-3">
            <Label htmlFor={`interim-update-${feedback.trackingId}`} className="font-medium">Add Interim Update (Private)</Label>
            <p className="text-xs text-muted-foreground">Log actions taken or conversation notes. This will be added to the audit trail but NOT sent to the employee yet.</p>
            <Textarea 
                id={`interim-update-${feedback.trackingId}`}
                value={interimUpdate}
                onChange={(e) => setInterimUpdate(e.target.value)}
                rows={3}
                placeholder="Add your notes..."
                disabled={isSubmitting}
            />
            <Button onClick={handleSupervisorUpdate} disabled={!interimUpdate || isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Add Update
            </Button>
        </div>
    );
}

function SubmitResolutionPanel({ feedback, onUpdate }: { feedback: Feedback, onUpdate: () => void }) {
    const { role } = useRole();
    const { toast } = useToast();
    const [resolutionSummary, setResolutionSummary] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const handleSupervisorUpdate = async () => {
        if (!resolutionSummary || !role) return;
        
        setIsSubmitting(true);
        try {
            await submitSupervisorUpdate(feedback.trackingId, role, resolutionSummary, true);
            setResolutionSummary('');
            toast({ title: "Resolution Submitted", description: "The employee has been notified to acknowledge your response." });
            onUpdate();
        } catch(e) {
            console.error(e);
            toast({ variant: 'destructive', title: "Update Failed"});
        } finally {
            setIsSubmitting(false);
        }
    }

     return (
        <div className="p-4 border rounded-lg bg-muted/20 space-y-3">
            <Label htmlFor={`final-resolution-${feedback.trackingId}`} className="font-medium">Submit Final Resolution</Label>
            <p className="text-xs text-muted-foreground">Provide the final summary of actions taken. This WILL be sent to the employee for their acknowledgement.</p>
            <Textarea 
                id={`final-resolution-${feedback.trackingId}`}
                value={resolutionSummary}
                onChange={(e) => setResolutionSummary(e.target.value)}
                rows={4}
                placeholder="Add your final resolution notes..."
                disabled={isSubmitting}
            />
            <Button onClick={handleSupervisorUpdate} disabled={!resolutionSummary || isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Submit
            </Button>
        </div>
    );
}


function IdentifiedConcernActionPanel({ feedback, onUpdate }: { feedback: Feedback, onUpdate: () => void }) {
    if (feedback.status === 'Final Disposition Required') {
        return <FinalDispositionPanel feedback={feedback} onUpdate={onUpdate} />;
    }

    if (feedback.status === 'Resolved' || feedback.status === 'Closed' || feedback.status === 'Pending Employee Acknowledgment') {
        return null;
    }

    return (
        <div className="mt-4 space-y-4">
             <AddUpdatePanel feedback={feedback} onUpdate={onUpdate} />
             <SubmitResolutionPanel feedback={feedback} onUpdate={onUpdate} />
        </div>
    );
}

function AnonymousConcernActionPanel({ feedback, onUpdate }: { feedback: Feedback, onUpdate: () => void }) {
    const { role } = useRole();
    const { toast } = useToast();
    const [revealReason, setRevealReason] = useState('');
    const [resolution, setResolution] = useState('');
    const [update, setUpdate] = useState('');
    const [question, setQuestion] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleRequestIdentity = async () => {
        if (!revealReason || !role) return;
        setIsSubmitting(true);
        try {
            await requestIdentityReveal(feedback.trackingId, role, revealReason);
            setRevealReason('');
            toast({ title: "Request Submitted", description: "The user has been notified of your request."});
            onUpdate();
        } finally {
            setIsSubmitting(false);
        }
    }
    
    const handleAddUpdate = async () => {
        if (!update || !role) return;
        setIsSubmitting(true);
        try {
            await submitSupervisorUpdate(feedback.trackingId, role, update, false);
            setUpdate('');
            toast({ title: "Update Added" });
            onUpdate();
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const handleRequestInformation = async () => {
        if (!question || !role) return;
        setIsSubmitting(true);
        try {
            await requestAnonymousInformation(feedback.trackingId, role, question);
            setQuestion('');
            toast({ title: "Question Submitted", description: "The user has been notified to provide more information." });
            onUpdate();
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleResolveDirectly = async () => {
        if (!resolution || !role) return;
        setIsSubmitting(true);
        try {
            await submitSupervisorUpdate(feedback.trackingId, role, resolution, true);
            setResolution('');
            toast({ title: "Resolution Submitted", description: "The anonymous user has been notified and must acknowledge your response."});
            onUpdate();
        } finally {
            setIsSubmitting(false);
        }
    }
    
    if (feedback.status === 'Pending Anonymous Reply') {
        return (
             <div className="p-4 border rounded-lg bg-blue-500/10 text-blue-700 dark:text-blue-400 mt-4">
                <p className="font-semibold flex items-center gap-2"><Clock className="h-4 w-4" /> Awaiting User Response</p>
                <p className="text-sm mt-1">You have requested more information. This case will reappear in your queue once the user has responded.</p>
            </div>
        );
    }
    
    return (
        <div className="space-y-4 pt-4 mt-4 border-t">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 border rounded-lg bg-muted/20 space-y-3 flex flex-col">
                     <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Label className="font-medium flex items-center gap-2 cursor-help">
                                    Add Update <Info className="h-4 w-4 text-muted-foreground" />
                                </Label>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Log your investigation steps or notes.</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                    <Textarea 
                        id="interim-update"
                        value={update}
                        onChange={(e) => setUpdate(e.target.value)}
                        rows={3}
                        className="flex-grow"
                        placeholder="Log your private notes..."
                    />
                    <Button onClick={handleAddUpdate} disabled={!update || isSubmitting} variant="secondary" className="mt-auto w-full">
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Add Update
                    </Button>
                </div>
                
                <div className="p-4 border rounded-lg bg-muted/20 space-y-3 flex flex-col">
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Label className="font-medium flex items-center gap-2 cursor-help">
                                    Additional Information <Info className="h-4 w-4 text-muted-foreground" />
                                </Label>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Ask a clarifying question. The user will see this and can respond anonymously.</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                    <Textarea 
                        id="ask-question"
                        value={question}
                        onChange={(e) => setQuestion(e.target.value)}
                        rows={3}
                        className="flex-grow"
                        placeholder="Ask a clarifying question..."
                    />
                    <Button onClick={handleRequestInformation} disabled={!question || isSubmitting} className="mt-auto w-full">
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Send Question
                    </Button>
                </div>

                <div className="p-4 border rounded-lg bg-muted/20 space-y-3 flex flex-col">
                     <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Label className="font-medium flex items-center gap-2 cursor-help">
                                    Request Identity <Info className="h-4 w-4 text-muted-foreground" />
                                </Label>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>If you cannot proceed, explain why you need their identity.</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                    <Textarea 
                        id="revealReason"
                        value={revealReason}
                        onChange={(e) => setRevealReason(e.target.value)}
                        rows={3}
                        className="flex-grow"
                        placeholder="Explain why identity is needed..."
                    />
                     <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button disabled={!revealReason || isSubmitting} className="mt-auto w-full">
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Request Identity Reveal
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Acknowledge Your Responsibility</AlertDialogTitle>
                                <AlertDialogDescription>
                                    By requesting to reveal the user's identity, you acknowledge your responsibility to ensure their safety from any form of bias, retaliation, or adverse consequences. This request must be treated with the highest standards of confidentiality, sensitivity, and fairness. Your acknowledgment and intent will be logged for accountability
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={handleRequestIdentity} className={cn(buttonVariants({variant: 'default'}))}>
                                    Acknowledge & Continue
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                     </AlertDialog>
                </div>
            </div>
            
            <div className="p-4 border rounded-lg bg-muted/20 space-y-3">
                 <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Label className="font-medium flex items-center gap-2 cursor-help">
                                Resolution <Info className="h-4 w-4 text-muted-foreground" />
                            </Label>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Propose a resolution for this case. This will be sent to the anonymous user for their final acknowledgement or escalation.</p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
                <Textarea 
                    id="resolve-directly"
                    value={resolution}
                    onChange={(e) => setResolution(e.target.value)}
                    rows={4}
                    placeholder="Propose a resolution..."
                />
                <Button onClick={handleResolveDirectly} disabled={!resolution || isSubmitting} className="mt-2">
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Submit
                </Button>
            </div>
        </div>
    );
}

function MySubmissions({ items, onUpdate, accordionRef, allCases, concernType, isReceivedView }: { items: Feedback[], onUpdate: (trackingId?: string) => void, accordionRef: React.RefObject<HTMLDivElement>, allCases: Feedback[], concernType: 'retaliation' | 'other' | 'anonymous', isReceivedView: boolean }) {
    const { role } = useRole();
    const [retaliationDialogOpen, setRetaliationDialogOpen] = useState(false);
    const [activeCaseId, setActiveCaseId] = useState<string | null>(null);

    const [trackingIdInput, setTrackingIdInput] = useState('');
    const [trackedCase, setTrackedCase] = useState<Feedback | null>(null);
    const [isTracking, setIsTracking] = useState(false);
    const [notFound, setNotFound] = useState(false);
    
    const [viewingCaseDetails, setViewingCaseDetails] = useState<Feedback | null>(null);
    
    const handleViewCaseDetails = async (e: React.MouseEvent, caseId: string) => {
      e.preventDefault();
      e.stopPropagation();
      
      const [foundCase] = await getFeedbackByIds([caseId]);
      if (foundCase) {
          setViewingCaseDetails(foundCase);
      }
    };

    const handleTrackAnonymous = async () => {
        if (!trackingIdInput) return;
        setIsTracking(true);
        setTrackedCase(null);
        setNotFound(false);
        try {
            const [foundCase] = await getFeedbackByIds([trackingIdInput]);
            if (foundCase && foundCase.isAnonymous) {
                setTrackedCase(foundCase);
            } else {
                setNotFound(true);
            }
        } catch (e) {
            setNotFound(true);
        } finally {
            setIsTracking(false);
        }
    };
    
    useEffect(() => {
        if (trackedCase) {
             const updatedCase = allCases.find(c => c.trackingId === trackedCase.trackingId);
             if (updatedCase) {
                 setTrackedCase(updatedCase);
             }
        }
    }, [allCases, trackedCase]);
    
    const renderCaseList = (itemsToRender: Feedback[]) => {
        if (itemsToRender.length === 0) {
             if (concernType === 'anonymous' && !isReceivedView) {
                return (
                    <div className="mt-4 text-center py-8">
                        {notFound && <p className="text-destructive">No submission found with that ID.</p>}
                    </div>
                )
             }
            return null;
        }
        return (
             <Accordion type="single" collapsible className="w-full" ref={accordionRef}>
                 {itemsToRender.map(item => {
                    const retaliationCase = allCases.find(c => c.parentCaseId === item.trackingId);
                    const relevantResponderEvents = ['Resolution Submitted', 'HR Resolution Submitted', 'HR Responded to Retaliation Claim', 'Manager Resolution'];
                    const responderEvent = item.auditTrail?.slice().reverse().find(e => relevantResponderEvents.includes(e.event));
                    const retaliationResponderEvent = retaliationCase?.auditTrail?.slice().reverse().find(e => e.event === 'HR Responded to Retaliation Claim');
                    
                    const isComplainant = item.submittedBy === role;
                    const isCaseClosed = item.status === 'Resolved' || item.status === 'Closed';
                    const canReportRetaliation = !item.isAnonymous && isComplainant;

                    const isLinkedClaim = !!item.parentCaseId;
                    const accordionTitle = isLinkedClaim ? `Linked Retaliation Claim` : item.subject;
                    
                    const handleDownload = (itemToDownload: Feedback) => {
                        downloadAuditTrailPDF({
                            title: itemToDownload.subject,
                            trackingId: itemToDownload.trackingId,
                            initialMessage: itemToDownload.message,
                            trail: itemToDownload.auditTrail || [],
                            finalResolution: itemToDownload.resolution,
                            isCaseClosed: isCaseClosed,
                        });
                    };

                    const getStatusBadge = (item: Feedback) => {
                        const { status, resolution } = item;
                        if (status === 'Closed' && resolution) {
                            if (resolution.includes('Ombudsman')) return <Badge className="bg-gray-700 text-white flex items-center gap-1.5"><FolderClosed className="h-3 w-3" />Ombudsman</Badge>;
                            if (resolution.includes('Grievance')) return <Badge className="bg-gray-700 text-white flex items-center gap-1.5"><FolderClosed className="h-3 w-3" />Grievance</Badge>;
                            return <Badge variant="secondary" className="flex items-center gap-1.5"><FolderClosed className="h-3 w-3" />Closed</Badge>;
                        }
                        
                        switch(status) {
                            case 'Resolved': return <Badge variant="success" className="flex items-center gap-1.5"><CheckCircle className="h-3 w-3" />Resolved</Badge>;
                            case 'Pending Manager Action': return <Badge variant="secondary" className="flex items-center gap-1.5"><Clock className="h-3 w-3" />Manager Review</Badge>;
                            case 'Pending Supervisor Action': return <Badge variant="secondary" className="flex items-center gap-1.5"><Clock className="h-3 w-3" />Reviewing</Badge>;
                            case 'Pending Identity Reveal': return <Badge variant="destructive" className="flex items-center gap-1.5"><UserX className="h-3 w-3" />Action Required</Badge>;
                            case 'Pending Anonymous Reply': return <Badge variant="destructive" className="flex items-center gap-1.5"><MessageCircleQuestion className="h-3 w-3" />Action Required</Badge>;
                            case 'Pending HR Action': return <Badge className="bg-black/80 text-white flex items-center gap-1.5"><ShieldCheck className="h-3 w-3" />HR Review</Badge>;
                            case 'Final Disposition Required': return <Badge className="bg-black/80 text-white flex items-center gap-1.5"><AlertTriangle className="h-3 w-3" />Final Action</Badge>;
                            case 'Pending Employee Acknowledgment': return <Badge variant="destructive" className="flex items-center gap-1.5"><MessageCircleQuestion className="h-3 w-3" />Action Required</Badge>;
                            case 'Closed': return <Badge variant="secondary" className="flex items-center gap-1.5"><UserX className="h-3 w-3" />Closed</Badge>;
                            default: return <Badge variant="secondary" className="flex items-center gap-1.5"><Clock className="h-3 w-3" />Submitted</Badge>;
                        }
                    }
                    
                    const getRetaliationStatusBadge = (status?: string) => {
                        switch(status) {
                            case 'Resolved': return <Badge variant="success" className="flex items-center gap-1.5"><CheckCircle className="h-3 w-3" />Claim Resolved</Badge>;
                            case 'Retaliation Claim': return <Badge variant="destructive" className="flex items-center gap-1.5"><AlertTriangle className="h-3 w-3"/>HR Reviewing Claim</Badge>;
                            case 'Pending Employee Acknowledgment': return <Badge variant="destructive" className="flex items-center gap-1.5"><MessageCircleQuestion className="h-3 w-3" />Your Ack. Required</Badge>;
                            case 'Closed': return <Badge variant="secondary" className="flex items-center gap-1.5"><UserX className="h-3 w-3" />Claim Closed</Badge>;
                            default: return <Badge variant="secondary" className="flex items-center gap-1.5"><Clock className="h-3 w-3" />Claim Submitted</Badge>;
                        }
                    }

                    const renderActionPanel = () => {
                        if (!isReceivedView) return null;
                        
                        if (item.isAnonymous) {
                            return <AnonymousConcernActionPanel feedback={item} onUpdate={() => onUpdate()} />;
                        } else {
                            return <IdentifiedConcernActionPanel feedback={item} onUpdate={() => onUpdate()} />;
                        }
                    };

                    return (
                        <AccordionItem value={item.trackingId} key={item.trackingId} id={`accordion-item-${item.trackingId}`}>
                             <AccordionTrigger className="w-full px-4 py-3 text-left hover:no-underline [&_svg]:ml-auto">
                                <div className="flex justify-between items-center w-full">
                                    <div className="flex items-center gap-4 flex-1 min-w-0">
                                        <p className="font-medium truncate">{accordionTitle}</p>
                                    </div>
                                    <div className="flex items-center gap-4 pl-4 mr-2">
                                        <span className="text-xs text-muted-foreground font-mono cursor-text">
                                            {item.isAnonymous && !isCaseClosed && isReceivedView ? 'ID Hidden Until Closure' : `ID: ${item.trackingId}`}
                                        </span>
                                        {getStatusBadge(item)}
                                    </div>
                                </div>
                            </AccordionTrigger>
                            <AccordionContent className="space-y-4 pt-2 px-4">
                               {item.status === 'Pending Anonymous Reply' && !isReceivedView && (
                                   <AnonymousReplyWidget item={item} onUpdate={() => onUpdate()} />
                               )}
                               {item.status === 'Pending Anonymous Reply' && !isReceivedView && !item.isAnonymous && (
                                   <IdentifiedReplyWidget item={item} onUpdate={() => onUpdate()} />
                               )}
                               {item.status === 'Pending Identity Reveal' && concernType === 'anonymous' && !isReceivedView && (
                                   <RevealIdentityWidget item={item} onUpdate={() => onUpdate()} />
                               )}
                               {item.status === 'Pending Employee Acknowledgment' && !isReceivedView &&(
                                    <AcknowledgementWidget 
                                        item={item} 
                                        onUpdate={() => onUpdate()}
                                        title="Action Required: Acknowledge Response"
                                        description="A response has been provided for your concern. Please review and provide your feedback."
                                        responderEventActor={responderEvent?.actor}
                                        responderEventDetails={responderEvent?.details}
                                    />
                               )}
                               <div className="space-y-2">
                                    <Label>Original Submission</Label>
                                    <p className="whitespace-pre-wrap text-sm text-muted-foreground">{item.message}</p>
                                </div>
                               
                                <CaseHistory item={item} handleViewCaseDetails={handleViewCaseDetails} onDownload={() => handleDownload(item)} />
                                
                                 {item.resolution && (
                                    <div className="space-y-2">
                                        <Label>Manager's Final Resolution</Label>
                                        <p className="whitespace-pre-wrap text-sm text-muted-foreground p-4 border rounded-md bg-green-500/10">{item.resolution}</p>
                                    </div>
                                )}

                                {canReportRetaliation && (
                                    <div className="pt-4 border-t border-dashed">
                                        <Dialog open={retaliationDialogOpen && activeCaseId === item.trackingId} onOpenChange={(open) => {
                                            if (!open) setRetaliationDialogOpen(false);
                                        }}>
                                            <DialogTrigger asChild>
                                                <Button variant="destructive" onClick={() => { setActiveCaseId(item.trackingId); setRetaliationDialogOpen(true); }}>
                                                    <AlertTriangle className="mr-2 h-4 w-4" />
                                                    Retaliation/Bias Observed
                                                </Button>
                                            </DialogTrigger>
                                            <DialogContent>
                                                <DialogHeader>
                                                    <DialogTitle>Report Retaliation or Bias</DialogTitle>
                                                    <DialogDescription>
                                                        This will create a new, separate case linked to this one and assign it directly to the HR Head for immediate review. All information will be handled with the highest level of confidentiality.
                                                    </DialogDescription>
                                                </DialogHeader>
                                                <RetaliationForm 
                                                    parentCaseId={item.trackingId} 
                                                    onSubmitted={() => {
                                                        setRetaliationDialogOpen(false);
                                                        onUpdate();
                                                    }} 
                                                    files={[]}
                                                    setFiles={() => {}}
                                                />
                                            </DialogContent>
                                        </Dialog>
                                    </div>
                                )}
                                 
                                {retaliationCase && (isComplainant || role === 'HR Head') && (
                                    <div className="mt-4 pt-4 border-t-2 border-destructive/50 space-y-4">
                                        <h4 className="text-lg font-semibold flex items-center gap-2 text-destructive">
                                            <GitMerge /> Linked Retaliation Claim 
                                        </h4>
                                        <div className="p-4 border rounded-lg bg-muted/50 space-y-4">
                                            {isComplainant && retaliationCase.status === 'Pending Employee Acknowledgment' && (
                                                <AcknowledgementWidget 
                                                    item={retaliationCase} 
                                                    onUpdate={() => onUpdate()}
                                                    title="Action Required: Acknowledge HR Response"
                                                    description="HR has responded to your retaliation claim. Please review their resolution."
                                                    responderEventActor={retaliationResponderEvent?.actor}
                                                    responderEventDetails={retaliationResponderEvent?.details}
                                                />
                                            )}
                                            
                                            <div className="flex justify-between items-center">
                                                <div>
                                                    <Label>Claim Status</Label>
                                                    <div className="mt-1">{getRetaliationStatusBadge(retaliationCase.status)}</div>
                                                </div>
                                                <div className="text-right">
                                                    <Label>Case ID</Label>
                                                    <p className="text-xs text-muted-foreground font-mono cursor-text">{retaliationCase.trackingId}</p>
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <Label>Your Claim Description</Label>
                                                <p className="whitespace-pre-wrap text-sm text-muted-foreground p-3 border rounded-md bg-background">{retaliationCase.message}</p>
                                            </div>
                                            
                                            {retaliationCase.attachmentNames && retaliationCase.attachmentNames.length > 0 && (
                                                <div className="space-y-2">
                                                    <Label>Your Attachments</Label>
                                                    <div>
                                                        {retaliationCase.attachmentNames.map((name, i) => (
                                                            <Button key={i} variant="outline" size="sm" asChild className="mr-2 mb-2">
                                                                <a href="#" onClick={(e) => { e.preventDefault(); alert('In a real app, this would securely download the attachment.'); }}>
                                                                    <LinkIcon className="mr-2 h-4 w-4" /> View Attachment
                                                                </a>
                                                            </Button>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                            <CaseHistory item={retaliationCase} handleViewCaseDetails={handleViewCaseDetails} onDownload={() => handleDownload(retaliationCase)} />
                                        </div>
                                    </div>
                                )}
                                {renderActionPanel()}
                            </AccordionContent>
                        </AccordionItem>
                    );
                })}
            </Accordion>
        );
    }

    const itemsToDisplay = concernType === 'anonymous' && trackedCase && !isReceivedView ? [trackedCase] : items;

    if (concernType === 'anonymous' && !isReceivedView) {
        return (
            <>
                 <div className="space-y-4 mt-4">
                    <p className="text-sm text-muted-foreground">Enter the tracking ID you saved after submission to see the status of your case.</p>
                    <div className="flex items-center gap-2">
                        <Input 
                            placeholder="Enter Tracking ID..." 
                            value={trackingIdInput}
                            onChange={(e) => setTrackingIdInput(e.target.value)}
                        />
                        <Button onClick={handleTrackAnonymous} disabled={isTracking || !trackingIdInput}>
                            {isTracking && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Track
                        </Button>
                    </div>
                     {renderCaseList(itemsToDisplay)}
                </div>
            </>
        )
    }

    return (
        <>
            <Dialog open={!!viewingCaseDetails} onOpenChange={setViewingCaseDetails}>
                <DialogContent className="max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>Case Details: {viewingCaseDetails?.subject}</DialogTitle>
                        <DialogDescription>
                            Tracking ID: {viewingCaseDetails?.trackingId}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4 max-h-[70vh] overflow-y-auto pr-4">
                        {viewingCaseDetails && (
                           <CaseHistory 
                                item={viewingCaseDetails} 
                                handleViewCaseDetails={handleViewCaseDetails}
                                onDownload={() => downloadAuditTrailPDF({
                                    title: viewingCaseDetails.subject,
                                    trackingId: viewingCaseDetails.trackingId,
                                    initialMessage: viewingCaseDetails.message,
                                    trail: viewingCaseDetails.auditTrail || [],
                                    finalResolution: viewingCaseDetails.resolution,
                                    isCaseClosed: viewingCaseDetails.status === 'Resolved' || viewingCaseDetails.status === 'Closed'
                                })}
                            />
                        )}
                    </div>
                </DialogContent>
            </Dialog>
            {renderCaseList(itemsToDisplay)}
        </>
    )
}

function MyConcernsContent() {
  const { role, toast } = useRole();
  const [allCases, setAllCases] = useState<Feedback[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const accordionRef = useRef<HTMLDivElement>(null);
  const [viewMode, setViewMode] = useState<'raised' | 'received'>('raised');
  
  // State for file attachments, lifted up
  const [attachmentState, setAttachmentState] = useState<{
    identified: File[],
    anonymous: File[],
    retaliation: File[]
  }>({ identified: [], anonymous: [], retaliation: [] });


  const [showIdDialog, setShowIdDialog] = useState(false);
  const [newCaseId, setNewCaseId] = useState('');
  const [activeTab, setActiveTab] = useState('identity-revealed');

  const isSupervisor = role && ['Team Lead', 'AM', 'Manager', 'HR Head'].includes(role);

  const fetchAllCases = useCallback(() => {
    setIsLoading(true);
    getAllFeedback().then(data => {
        setAllCases(data.sort((a,b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()));
        setIsLoading(false);
    });
  }, []);

  useEffect(() => {
    fetchAllCases();
    window.addEventListener('feedbackUpdated', fetchAllCases);
    return () => {
      window.removeEventListener('feedbackUpdated', fetchAllCases);
    };
  }, [fetchAllCases]);


  const handleCaseSubmitted = useCallback((trackingId?: string) => {
    fetchAllCases();
    if (trackingId) {
        setNewCaseId(trackingId);
        setShowIdDialog(true);
    }
  }, [fetchAllCases]);

  const copyToClipboard = (id: string) => {
    navigator.clipboard.writeText(id);
    toast({
      title: 'Copied!',
      description: 'Tracking ID copied to clipboard.',
    });
  };

  const { identifiedRaised, anonymousRaised, retaliationRaised, identifiedReceived, anonymousReceived, retaliationReceived, actionCounts } = useMemo(() => {
    if (!role) return { identifiedRaised: [], anonymousRaised: [], retaliationRaised: [], identifiedReceived: [], anonymousReceived: [], retaliationReceived: [], actionCounts: { raised: { identified: 0, anonymous: 0, retaliation: 0 }, received: { identified: 0, anonymous: 0, retaliation: 0 } } };
    
    const currentUserName = roleUserMapping[role]?.name;

    const complainantActionStatuses: string[] = ['Pending Identity Reveal', 'Pending Anonymous Reply', 'Pending Employee Acknowledgment'];
    const respondentActionStatuses: string[] = ['Pending Supervisor Action', 'Pending Manager Action', 'Pending HR Action', 'Final Disposition Required', 'Retaliation Claim'];
    
    const raisedActionCounts = { identified: 0, anonymous: 0, retaliation: 0 };
    const receivedActionCounts = { identified: 0, anonymous: 0, retaliation: 0 };

    const identifiedRaised: Feedback[] = [];
    const anonymousRaised: Feedback[] = [];
    const retaliationRaised: Feedback[] = [];
    const identifiedReceived: Feedback[] = [];
    const anonymousReceived: Feedback[] = [];
    const retaliationReceived: Feedback[] = [];

    allCases.forEach(c => {
      const isRaisedByMe = c.submittedBy === role || c.submittedBy === currentUserName;
      const isAssignedToMe = c.assignedTo?.includes(role as any);
      
      const isRaisedActionable = complainantActionStatuses.includes(c.status || '');
      const isReceivedActionable = respondentActionStatuses.includes(c.status || '');

      if (isRaisedByMe) {
          if (!c.isAnonymous && c.criticality !== 'Retaliation Claim') {
              identifiedRaised.push(c);
              if (isRaisedActionable) raisedActionCounts.identified++;
          } else if (c.isAnonymous) {
              anonymousRaised.push(c);
              if (isRaisedActionable) raisedActionCounts.anonymous++;
          } else if (c.criticality === 'Retaliation Claim' && !c.parentCaseId) {
              retaliationRaised.push(c);
              if (isRaisedActionable) raisedActionCounts.retaliation++;
          }
      }

      if (isAssignedToMe) {
          if (!c.isAnonymous && c.criticality !== 'Retaliation Claim') {
              identifiedReceived.push(c);
              if (isReceivedActionable) receivedActionCounts.identified++;
          } else if (c.isAnonymous) {
              anonymousReceived.push(c);
              if (isReceivedActionable) receivedActionCounts.anonymous++;
          } else if (c.criticality === 'Retaliation Claim') {
              retaliationReceived.push(c);
              if (isReceivedActionable) receivedActionCounts.retaliation++;
          }
      }
    });

    return { identifiedRaised, anonymousRaised, retaliationRaised, identifiedReceived, anonymousReceived, retaliationReceived, actionCounts: { raised: raisedActionCounts, received: receivedActionCounts } };
  }, [allCases, role]);
  
  const getSectionTitle = () => {
    if (viewMode === 'received') return 'Received Concerns';
    return 'My Submissions';
  };

  const renderTabTrigger = (value: string, label: string, icon: React.ReactNode, count: number) => (
    <TabsTrigger value={value} className={cn("relative", value === 'retaliation' && "text-destructive/80 data-[state=active]:text-destructive")}>
        {icon}
        {label}
        {count > 0 && (
            <span className="absolute top-1 right-1 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
            </span>
        )}
    </TabsTrigger>
  );

  const renderSubmissions = () => {
    const isReceivedView = isSupervisor && viewMode === 'received';
    
    let concernsToShow;
    let submissionType: 'other' | 'anonymous' | 'retaliation' = 'other';
    let noItemsMessage = `You have no ${isReceivedView ? 'received' : 'raised'} concerns in this category.`;
    
    switch (activeTab) {
        case 'identity-revealed':
            concernsToShow = isReceivedView ? identifiedReceived : identifiedRaised;
            submissionType = 'other';
            break;
        case 'anonymous':
            concernsToShow = isReceivedView ? anonymousReceived : anonymousRaised;
            submissionType = 'anonymous';
            break;
        case 'retaliation':
            concernsToShow = isReceivedView ? retaliationReceived : retaliationRaised;
            submissionType = 'retaliation';
            break;
        default:
            concernsToShow = [];
    }

    if (isLoading) {
        return <Skeleton className="h-40 w-full mt-4" />;
    }
    
    return (
        <>
            <MySubmissions 
                onUpdate={handleCaseSubmitted} 
                items={concernsToShow}
                allCases={allCases} 
                concernType={submissionType}
                accordionRef={accordionRef}
                isReceivedView={isReceivedView}
            />
            {concernsToShow.length === 0 && (submissionType !== 'anonymous' || isReceivedView) && (
                 <div className="mt-4 text-center py-8 border-2 border-dashed rounded-lg">
                    <p className="text-muted-foreground">{noItemsMessage}</p>
                </div>
            )}
            {concernsToShow.length === 0 && submissionType === 'anonymous' && !isReceivedView && (
                 <div className="mt-4 text-center py-8 border-2 border-dashed rounded-lg">
                    <p className="text-muted-foreground">You have not raised any anonymous concerns from this dashboard.</p>
                </div>
            )}
        </>
    );
  };

  const countsForView = viewMode === 'raised' ? actionCounts.raised : actionCounts.received;

  return (
    <div className="p-4 md:p-8 space-y-8">
      <Dialog open={showIdDialog} onOpenChange={setShowIdDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>✅ Submission Received</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
                Please copy and save the tracking ID below — it is the only way to check the status of your submission in the future.
                <br/><br/>
                You may check for updates after 2 business days, as the reviewer may request additional information or provide updates regarding the status of your concern.
            </p>
            <Alert>
              <AlertTitle className="font-semibold">Your Tracking ID</AlertTitle>
              <div className="flex items-center justify-between mt-2">
                <code className="text-sm font-mono">{newCaseId}</code>
                <Button variant="ghost" size="icon" onClick={() => copyToClipboard(newCaseId)}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </Alert>
          </div>
        </DialogContent>
      </Dialog>
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl font-bold font-headline mb-2 text-foreground flex items-center gap-3">
            <ShieldQuestion className="h-8 w-8" /> Raise a Concern
          </CardTitle>
           <CardDescription className="text-lg text-muted-foreground">
            Choose how you would like to submit a concern for review.
          </CardDescription>
        </CardHeader>
        <CardContent>
            <Tabs defaultValue="identity-revealed" onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-3">
                    {renderTabTrigger("identity-revealed", "Identity Revealed", <User className="mr-2" />, actionCounts.raised.identified)}
                    {renderTabTrigger("anonymous", "Anonymous", <UserX className="mr-2" />, actionCounts.raised.anonymous)}
                    {renderTabTrigger("retaliation", "Report Retaliation", <Flag className="mr-2" />, actionCounts.raised.retaliation)}
                </TabsList>
                <TabsContent value="identity-revealed">
                    <IdentifiedConcernForm 
                        onCaseSubmitted={() => handleCaseSubmitted()} 
                        files={attachmentState.identified}
                        setFiles={(files) => setAttachmentState(s => ({...s, identified: files}))}
                    />
                </TabsContent>
                <TabsContent value="anonymous">
                    <AnonymousConcernForm 
                        onCaseSubmitted={handleCaseSubmitted}
                        files={attachmentState.anonymous}
                        setFiles={(files) => setAttachmentState(s => ({...s, anonymous: files}))}
                    />
                </TabsContent>
                 <TabsContent value="retaliation">
                    <DirectRetaliationForm 
                        onCaseSubmitted={() => handleCaseSubmitted()} 
                        files={attachmentState.retaliation}
                        setFiles={(files) => setAttachmentState(s => ({...s, retaliation: files}))}
                    />
                </TabsContent>
            </Tabs>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
            <div className="flex justify-between items-center">
                <CardTitle className="text-xl font-semibold flex items-center gap-2">
                    <List className="h-5 w-5" />
                    {getSectionTitle()}
                </CardTitle>
                {isSupervisor && (
                    <div className="flex items-center space-x-2">
                        <Label htmlFor="view-mode-toggle" className="text-sm text-muted-foreground">
                            {viewMode === 'raised' ? 'Showing My Raised' : 'Showing Received by Me'}
                        </Label>
                        <Switch
                            id="view-mode-toggle"
                            checked={viewMode === 'received'}
                            onCheckedChange={(checked) => setViewMode(checked ? 'received' : 'raised')}
                        />
                    </div>
                )}
            </div>
        </CardHeader>
        <CardContent>
            <div className="mt-4">
                {renderSubmissions()}
            </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function MyConcernsPage() {
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
            <MyConcernsContent />
        </DashboardLayout>
    );
}

