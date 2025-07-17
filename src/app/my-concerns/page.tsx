

"use client";

import { useState, useEffect, useCallback, ChangeEvent, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { submitAnonymousConcernFromDashboard, getFeedbackByIds, Feedback, respondToIdentityReveal, employeeAcknowledgeMessageRead, submitIdentifiedConcern, submitEmployeeFeedbackAcknowledgement, submitRetaliationReport, getAllFeedback, submitDirectRetaliationReport } from '@/services/feedback-service';
import { Skeleton } from '@/components/ui/skeleton';
import { ShieldQuestion, Send, Loader2, User, UserX, List, CheckCircle, Clock, ShieldCheck, Info, MessageCircleQuestion, AlertTriangle, FileUp, GitMerge, Link as LinkIcon, Paperclip, Flag, FolderClosed, FileCheck, MessageSquare } from 'lucide-react';
import { useRole } from '@/hooks/use-role';
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
import { roleUserMapping, getRoleByName } from '@/lib/role-mapping';


const getAnonymousCaseKey = (role: string | null) => role ? `anonymous_cases_${role.replace(/\s/g, '_')}` : null;
const getIdentifiedCaseKey = (role: string | null) => role ? `identified_cases_${role.replace(/\s/g, '_')}` : null;
const getRetaliationCaseKey = (role: string | null) => role ? `direct_retaliation_cases_${role.replace(/\s/g, '_')}` : null;

function AnonymousConcernForm({ onCaseSubmitted }: { onCaseSubmitted: () => void }) {
    const { toast } = useToast();
    const { role } = useRole();
    const [subject, setSubject] = useState('');
    const [concern, setConcern] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!subject || !concern || !role) {
            toast({ variant: 'destructive', title: "Missing Information", description: "Please fill out all fields."});
            return;
        }

        setIsSubmitting(true);
        try {
            const result = await submitAnonymousConcernFromDashboard({ subject, message: concern });
            
            const key = getAnonymousCaseKey(role);
            if (key) {
                const existingIds = JSON.parse(localStorage.getItem(key) || '[]');
                existingIds.push(result.trackingId);
                localStorage.setItem(key, JSON.stringify(existingIds));
            }

            toast({ title: "Anonymous Concern Submitted", description: "Your concern has been confidentially routed to management." });
            setSubject('');
            setConcern('');
            onCaseSubmitted();
        } catch (error) {
            toast({ variant: 'destructive', title: "Submission Failed", description: "Could not submit your concern."});
            console.error(error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="mt-6 space-y-6">
            <p className="text-sm text-muted-foreground">
                Your name and role will NOT be attached to this submission. It will be routed anonymously to management for review. You can track its status on this page.
            </p>
            <div className="space-y-2">
                <Label htmlFor="anon-subject">Subject</Label>
                <Input 
                    id="anon-subject" 
                    value={subject} 
                    onChange={e => setSubject(e.target.value)} 
                    placeholder="e.g., Suggestion for team workflow, Unfair treatment concern" 
                    required 
                />
            </div>
            <div className="space-y-2">
                <Label htmlFor="anon-concern">Details of Concern</Label>
                <Textarea 
                    id="anon-concern" 
                    value={concern} 
                    onChange={e => setConcern(e.target.value)} 
                    placeholder="Please describe the situation in detail without revealing your identity. Include examples, dates, and impact if possible." 
                    rows={8} 
                    required 
                />
            </div>
            <div className="flex justify-end">
                <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                    Submit Anonymously
                </Button>
            </div>
        </form>
    );
}


function IdentifiedConcernForm({ onCaseSubmitted }: { onCaseSubmitted: () => void }) {
    const { toast } = useToast();
    const { role } = useRole();
    const [recipient, setRecipient] = useState('');
    const [subject, setSubject] = useState('');
    const [concern, setConcern] = useState('');
    const [criticality, setCriticality] = useState<'Low' | 'Medium' | 'High' | 'Critical'>('Medium');
    const [isSubmitting, setIsSubmitting] = useState(false);

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
                    placeholder="e.g., Unfair project assignment, Issue with team communication" 
                    required 
                />
            </div>
            <div className="space-y-2">
                <Label htmlFor="concern">Details of Concern</Label>
                <Textarea 
                    id="concern" 
                    value={concern} 
                    onChange={e => setConcern(e.target.value)} 
                    placeholder="Please describe the situation in detail. Include specific examples, dates, and impact if possible." 
                    rows={8} 
                    required 
                />
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

function DirectRetaliationForm({ onCaseSubmitted }: { onCaseSubmitted: () => void }) {
    const { toast } = useToast();
    const { role } = useRole();
    const [subject, setSubject] = useState('');
    const [description, setDescription] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
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
                file,
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
            setFile(null);
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
                    placeholder="e.g., Retaliation after informal feedback, Biased project assignments"
                    required
                />
            </div>
            <div className="space-y-2">
                <Label htmlFor="retaliation-description">Description of Incident</Label>
                <Textarea
                    id="retaliation-description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe the retaliation or bias you observed. Please include dates, individuals involved, specific actions or comments, and the impact on you or your work."
                    rows={8}
                    required
                />
            </div>
            <div className="space-y-2">
                <Label htmlFor="retaliation-file">Attach Evidence (Optional)</Label>
                <Input
                    id="retaliation-file"
                    type="file"
                    onChange={handleFileChange}
                />
                <p className="text-xs text-muted-foreground">You can attach screenshots, documents, or audio recordings.</p>
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
                                <div className="text-sm mt-2 text-muted-foreground prose prose-sm prose-p:my-1 whitespace-pre-wrap">
                                    <p className="font-semibold">Manager’s Acknowledgment:</p>
                                    <blockquote className="border-l-2 pl-4 italic">
                                        "I acknowledge my responsibility to protect the employee from any form of bias, retaliation, or adverse consequence during this process. I am committed to handling this matter with fairness, discretion, and confidentiality."
                                    </blockquote>
                                    <p className="font-semibold mt-4">Manager’s Reason:</p>
                                    <blockquote className="border-l-2 pl-4 italic">
                                        {revealRequest?.details}
                                    </blockquote>
                                </div>
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
                            <div className="text-muted-foreground mt-1 whitespace-pre-wrap prose prose-sm prose-p:my-1">{revealRequest?.details}</div>
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
                    <p className="font-semibold text-foreground">{responderEventActor}'s Response:</p>
                    <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">{responderEventDetails}</p>
                </div>
                <div className="space-y-2 pt-2">
                    <Label htmlFor={`ack-comments-${item.trackingId}`}>Additional Comments (Optional)</Label>
                    <Textarea
                        id={`ack-comments-${item.trackingId}`}
                        value={comments}
                        onChange={(e) => setComments(e.target.value)}
                        placeholder="Provide more detail about your selection..."
                        rows={3}
                        className="bg-background"
                    />
                </div>
                <div className="flex flex-wrap gap-2 pt-2">
                    <Button onClick={() => handleAcknowledge(true)} variant="success" disabled={isSubmitting}>
                        {isSubmitting && <Loader2 className="mr-2 animate-spin" />}
                        Accept Resolution
                    </Button>
                    <Button onClick={() => handleAcknowledge(false)} variant="destructive" disabled={isSubmitting}>
                        {isSubmitting && <Loader2 className="mr-2 animate-spin" />}
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
    const [file, setFile] = useState<File | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
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
                file,
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
                <Textarea
                    id="retaliation-description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe the retaliation or bias you observed. Please include dates, individuals involved, specific actions or comments, and the impact on you or your work."
                    rows={8}
                    required
                />
            </div>
            <div className="space-y-2">
                <Label htmlFor="retaliation-file">Attach Evidence (Optional)</Label>
                <Input
                    id="retaliation-file"
                    type="file"
                    onChange={handleFileChange}
                />
                <p className="text-xs text-muted-foreground">You can attach screenshots, documents, or audio recordings.</p>
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
    'Submitted': FileCheck,
    'Retaliation Claim Submitted': Flag,
    'Retaliation Claim Filed': Flag,
    'Identity Revealed': User,
    'Identity Reveal Requested': UserX,
    'Resolved': CheckCircle,
    'Update Added': MessageSquare,
    'default': Info,
}

function CaseHistory({ trail, handleScrollToCase }: { trail: Feedback['auditTrail'], handleScrollToCase: (e: React.MouseEvent, caseId: string) => void }) {
    if (!trail || trail.length === 0) return null;
    return (
        <div className="space-y-2">
            <Label>Case History</Label>
            <div className="relative p-4 border rounded-md bg-muted/50">
                 <div className="absolute left-8 top-8 bottom-8 w-px bg-border -translate-x-1/2"></div>
                <div className="space-y-4">
                    {trail.map((event, index) => {
                        const Icon = auditEventIcons[event.event as keyof typeof auditEventIcons] || auditEventIcons.default;
                        
                        const renderDetails = () => {
                            if (!event.details) return null;

                            const childRegex = /(New Case ID: )([a-f0-9-]+)/;
                            const childMatch = event.details.match(childRegex);

                            if (childMatch) {
                                const childId = childMatch[2];
                                return (
                                    <div className="text-sm text-muted-foreground mt-1">
                                        New Case ID: <a href="#" onClick={(e) => handleScrollToCase(e, childId)} className="font-mono text-primary hover:underline">{childId}</a>
                                    </div>
                                );
                            }

                            return <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">{event.details}</p>;
                        };
                        
                        return (
                            <div key={index} className="flex items-start gap-4 relative">
                                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-background border flex items-center justify-center z-10">
                                    <Icon className="h-5 w-5 text-muted-foreground" />
                                </div>
                                <div className="flex-1 -mt-1">
                                    <p className="font-medium text-sm">
                                        {event.event} by <span className="text-primary">{event.actor}</span>
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


function MySubmissions({ onUpdate, storageKey, title, allCases, concernType, accordionRef }: { onUpdate: () => void, storageKey: string | null, title: string, allCases: Feedback[], concernType: 'retaliation' | 'other', accordionRef: React.RefObject<HTMLDivElement> }) {
    const [cases, setCases] = useState<Feedback[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [retaliationDialogOpen, setRetaliationDialogOpen] = useState(false);
    const [activeCaseId, setActiveCaseId] = useState<string | null>(null);

    useEffect(() => {
        const loadCases = async () => {
            setIsLoading(true);
            if (storageKey) {
                const caseIds = JSON.parse(localStorage.getItem(storageKey) || '[]');
                if (caseIds.length > 0) {
                    const fetchedCases = await getFeedbackByIds(caseIds);
                    
                    let filteredCases;
                    if (concernType === 'retaliation') {
                        // For retaliation tab, show only direct retaliation claims
                        filteredCases = fetchedCases.filter(c => c.criticality === 'Retaliation Claim' && !c.parentCaseId);
                    } else {
                        // For other tabs, show everything that isn't a retaliation claim
                        filteredCases = fetchedCases.filter(c => c.criticality !== 'Retaliation Claim');
                    }

                    setCases(filteredCases.sort((a,b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()));
                } else {
                    setCases([]);
                }
            }
            setIsLoading(false);
        };
        loadCases();
    }, [storageKey, allCases, concernType]);
    
    const handleScrollToCase = (e: React.MouseEvent, caseId: string) => {
        e.preventDefault();
        const caseElement = accordionRef.current?.querySelector(`#accordion-item-${caseId}`);
        caseElement?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        
        // Use a timeout to ensure the element is visible before trying to click the trigger
        setTimeout(() => {
            const trigger = caseElement?.querySelector('[data-radix-collection-item]');
            if (trigger instanceof HTMLElement) {
                trigger.click();
            }
        }, 300);
    };

    if (isLoading) return <Skeleton className="h-24 w-full" />;

    if (cases.length === 0) {
        return (
            <div className="mt-4 text-center py-8 border-2 border-dashed rounded-lg">
                <p className="text-muted-foreground">You have not submitted any concerns of this type yet.</p>
            </div>
        );
    }
    
    const getStatusBadge = (item: Feedback) => {
        const { status, resolution } = item;
        if (status === 'Closed' && resolution) {
            if (resolution.includes('Ombudsman')) return <Badge className="bg-gray-700 text-white flex items-center gap-1.5"><FolderClosed className="h-3 w-3" />Ombudsman</Badge>;
            if (resolution.includes('Grievance')) return <Badge className="bg-gray-700 text-white flex items-center gap-1.5"><FolderClosed className="h-3 w-3" />Grievance</Badge>;
            return <Badge variant="secondary" className="flex items-center gap-1.5"><FolderClosed className="h-3 w-3" />Closed</Badge>;
        }
        
        switch(status) {
            case 'Resolved': return <Badge variant="success" className="flex items-center gap-1.5"><CheckCircle className="h-3 w-3" />Resolved</Badge>;
            case 'Pending Manager Action': return <Badge className="bg-orange-500 text-white flex items-center gap-1.5"><Clock className="h-3 w-3" />Manager Review</Badge>;
            case 'Pending Supervisor Action': return <Badge className="bg-orange-500 text-white flex items-center gap-1.5"><Clock className="h-3 w-3" />Reviewing</Badge>;
            case 'Pending Identity Reveal': return <Badge variant="destructive" className="flex items-center gap-1.5"><UserX className="h-3 w-3" />Reveal Requested</Badge>;
            case 'Pending HR Action': return <Badge className="bg-black text-white flex items-center gap-1.5"><ShieldCheck className="h-3 w-3" />HR Review</Badge>;
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

    return (
        <div className="mt-6 space-y-4">
             <h3 className="text-lg font-semibold flex items-center gap-2 text-muted-foreground">
                <List className="h-5 w-5" />
                {title}
            </h3>
            <Accordion type="single" collapsible className="w-full border rounded-lg" ref={accordionRef}>
                 {cases.map(item => {
                    const retaliationCase = allCases.find(c => c.parentCaseId === item.trackingId);
                    
                    const responderEvent = item.auditTrail?.find(e => ['Supervisor Responded', 'HR Resolution Submitted'].includes(e.event));
                    const retaliationResponderEvent = retaliationCase?.auditTrail?.find(e => e.event === 'HR Responded to Retaliation Claim');
                    
                    const isLinkedClaim = !!item.parentCaseId;
                    
                    const accordionTitle = isLinkedClaim
                        ? `Linked Retaliation Claim`
                        : item.subject;
                    
                    return (
                        <AccordionItem value={item.trackingId} key={item.trackingId} id={`accordion-item-${item.trackingId}`}>
                             <AccordionTrigger className="w-full px-4 py-3 text-left hover:no-underline [&_svg]:ml-auto">
                                <div className="flex items-center gap-4 flex-1 min-w-0">
                                    <p className="font-medium truncate">{accordionTitle}</p>
                                </div>
                                <div className="flex items-center gap-4 pl-4">
                                    <span className="text-xs text-muted-foreground font-mono cursor-text">
                                        ID: {item.trackingId}
                                    </span>
                                    {getStatusBadge(item)}
                                </div>
                            </AccordionTrigger>
                            <AccordionContent className="space-y-4 pt-2 px-4">
                               {item.status === 'Pending Identity Reveal' && (
                                   <RevealIdentityWidget item={item} onUpdate={onUpdate} />
                               )}
                               {item.status === 'Pending Employee Acknowledgment' && (
                                    <AcknowledgementWidget 
                                        item={item} 
                                        onUpdate={onUpdate}
                                        title="Action Required: Acknowledge Response"
                                        description="A response has been provided for your concern. Please review and provide your feedback."
                                        responderEventActor={responderEvent?.actor}
                                        responderEventDetails={responderEvent?.details}
                                    />
                               )}
                               <div className="space-y-2">
                                    <Label>Original Submission</Label>
                                    <p className="whitespace-pre-wrap text-sm text-muted-foreground p-4 border rounded-md bg-muted/50">{item.message}</p>
                                </div>
                               
                                <CaseHistory trail={item.auditTrail} handleScrollToCase={handleScrollToCase} />
                                
                                 {item.resolution && (
                                    <div className="space-y-2">
                                        <Label>Manager's Final Resolution</Label>
                                        <p className="whitespace-pre-wrap text-sm text-muted-foreground p-4 border rounded-md bg-green-500/10">{item.resolution}</p>
                                    </div>
                                )}

                                {!item.isAnonymous && (
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
                                                />
                                            </DialogContent>
                                        </Dialog>
                                    </div>
                                )}
                                 
                                {retaliationCase && (
                                    <div className="mt-4 pt-4 border-t-2 border-destructive/50 space-y-4">
                                        <h4 className="text-lg font-semibold flex items-center gap-2 text-destructive">
                                            <GitMerge /> Linked Retaliation Claim 
                                        </h4>
                                        
                                        {retaliationCase.status === 'Pending Employee Acknowledgment' && (
                                            <AcknowledgementWidget 
                                                item={retaliationCase} 
                                                onUpdate={onUpdate}
                                                title="Action Required: Acknowledge HR Response"
                                                description="HR has responded to your retaliation claim. Please review their resolution."
                                                responderEventActor={retaliationResponderEvent?.actor}
                                                responderEventDetails={retaliationResponderEvent?.details}
                                            />
                                        )}
                                        
                                        <div className="p-4 border rounded-lg bg-muted/50 space-y-4">
                                            <div className="flex flex-wrap justify-between items-center gap-2">
                                                <Label>Claim Status</Label>
                                                <div className="flex items-center gap-4">
                                                    <span className="text-xs text-muted-foreground font-mono cursor-text">
                                                       ID: {retaliationCase.trackingId}
                                                    </span>
                                                    {getRetaliationStatusBadge(retaliationCase.status)}
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <Label>Your Claim Description</Label>
                                                <p className="whitespace-pre-wrap text-sm text-muted-foreground p-3 border rounded-md bg-background">{retaliationCase.message}</p>
                                            </div>

                                            {retaliationCase.attachment && (
                                                <div className="space-y-2">
                                                    <Label>Your Attachment</Label>
                                                    <div>
                                                        <Button variant="outline" size="sm" asChild>
                                                            <a href="#" onClick={(e) => { e.preventDefault(); alert('In a real app, this would securely download the attachment.'); }}>
                                                                <LinkIcon className="mr-2 h-4 w-4" /> View Attachment ({retaliationCase.attachment.name})
                                                            </a>
                                                        </Button>
                                                    </div>
                                                </div>
                                            )}

                                           <CaseHistory trail={retaliationCase.auditTrail} handleScrollToCase={handleScrollToCase} />

                                        </div>
                                    </div>
                                )}
                            </AccordionContent>
                        </AccordionItem>
                    );
                })}
            </Accordion>
        </div>
    );
}

function MyConcernsContent() {
  const [remountKey, setRemountKey] = useState(0);
  const { role } = useRole();
  const [allCases, setAllCases] = useState<Feedback[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const accordionRef = useRef<HTMLDivElement>(null);

  const fetchAllCases = useCallback(() => {
    setIsLoading(true);
    getAllFeedback().then(data => {
        setAllCases(data);
        setIsLoading(false);
    });
  }, []);

  useEffect(() => {
    fetchAllCases();
  }, [fetchAllCases]);


  const handleCaseSubmitted = useCallback(() => {
    // Re-fetch all cases after a new submission
    fetchAllCases();
  }, [fetchAllCases]);

  return (
    <div className="p-4 md:p-8">
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
            <Tabs defaultValue="identity-revealed">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="identity-revealed">
                        <User className="mr-2" />
                        Identity Revealed
                    </TabsTrigger>
                    <TabsTrigger value="anonymous">
                        <UserX className="mr-2" />
                        Anonymous
                    </TabsTrigger>
                    <TabsTrigger value="retaliation" className="text-destructive/80 data-[state=active]:text-destructive">
                        <Flag className="mr-2" />
                        Report Retaliation
                    </TabsTrigger>
                </TabsList>
                <TabsContent value="identity-revealed">
                    <IdentifiedConcernForm onCaseSubmitted={handleCaseSubmitted} />
                     <MySubmissions onUpdate={handleCaseSubmitted} storageKey={getIdentifiedCaseKey(role)} title="My Identified Concerns" key={`identified-${remountKey}`} allCases={allCases} concernType="other" accordionRef={accordionRef} />
                </TabsContent>
                <TabsContent value="anonymous">
                    <AnonymousConcernForm onCaseSubmitted={handleCaseSubmitted} />
                    <MySubmissions onUpdate={handleCaseSubmitted} storageKey={getAnonymousCaseKey(role)} title="My Anonymous Submissions" key={`anonymous-${remountKey}`} allCases={allCases} concernType="other" accordionRef={accordionRef} />
                </TabsContent>
                 <TabsContent value="retaliation">
                    <DirectRetaliationForm onCaseSubmitted={handleCaseSubmitted} />
                    <MySubmissions onUpdate={handleCaseSubmitted} storageKey={getRetaliationCaseKey(role)} title="My Retaliation Reports" key={`retaliation-${remountKey}`} allCases={allCases} concernType="retaliation" accordionRef={accordionRef} />
                </TabsContent>
            </Tabs>
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

    
