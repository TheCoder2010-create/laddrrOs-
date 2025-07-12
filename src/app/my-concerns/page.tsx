
"use client";

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { submitAnonymousConcernFromDashboard, getFeedbackByIds, Feedback, respondToIdentityReveal, employeeAcknowledgeMessageRead, submitIdentifiedConcern, submitEmployeeFeedbackAcknowledgement } from '@/services/feedback-service';
import { Skeleton } from '@/components/ui/skeleton';
import { ShieldQuestion, Send, Loader2, User, UserX, List, CheckCircle, Clock, ShieldCheck, Info, MessageCircleQuestion, AlertTriangle } from 'lucide-react';
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
import { formatDistanceToNow, format } from 'date-fns';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
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
             toast({ variant: 'default', title: "Request Declined", description: "The case has been escalated to HR for review."});
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
                            <div>
                                <h3 className="font-bold text-base text-foreground">Your Manager's Commitment & Request</h3>
                                <div className="text-sm mt-2 text-muted-foreground prose prose-sm prose-p:my-1 whitespace-pre-wrap">{revealRequest?.details}</div>
                                <h3 className="font-bold mt-4 text-base text-foreground">Please Acknowledge This Message</h3>
                                <p className="text-sm mt-1">
                                    Your identity has <span className="font-bold">not</span> been revealed. Clicking the button below only confirms that you have read this message. You will decide whether to reveal your identity on the next step.
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
                                            <p>This action cannot be undone. Once revealed, your name will be attached to this case.</p>
                                            <p className="font-bold mt-4">A new "Retaliation/Bias Observed" button will become available for you on this case. You can use this button at any time, even after the case is closed, to report any unfair treatment. Please provide any information that would substantiate your claim when using this feature.</p>
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

function AcknowledgementWidget({ item, onUpdate }: { item: Feedback, onUpdate: () => void }) {
    const { toast } = useToast();
    const [comments, setComments] = useState('');

    const supervisorResponse = item.auditTrail?.find(e => e.event === 'Supervisor Responded');

    const handleAcknowledge = async (accepted: boolean) => {
        await submitEmployeeFeedbackAcknowledgement(item.trackingId, accepted, comments);
        if (accepted) {
            toast({ title: "Resolution Accepted", description: "The case has been closed." });
        } else {
            toast({ title: "Concern Escalated", description: "Your feedback has been escalated to the next level." });
        }
        onUpdate();
    }

    return (
        <Card className="border-blue-500/50 my-4">
            <CardHeader className="bg-blue-500/10">
                <CardTitle className="flex items-center gap-2 text-blue-700 dark:text-blue-400">
                    <MessageCircleQuestion className="h-6 w-6" />
                    Action Required: Please Acknowledge
                </CardTitle>
                <CardDescription>
                    Your manager has responded to your concern. Please review and provide your feedback.
                </CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
                <div className="p-3 bg-muted/80 rounded-md border">
                    <p className="font-semibold text-foreground">{supervisorResponse?.actor}'s Response:</p>
                    <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">{supervisorResponse?.details}</p>
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
                    <Button onClick={() => handleAcknowledge(true)} variant="success">Accept Resolution</Button>
                    <Button onClick={() => handleAcknowledge(false)} variant="destructive">I'm Not Satisfied, Escalate</Button>
                </div>
            </CardContent>
        </Card>
    )
}

function MySubmissions({ onUpdate, storageKey, title }: { onUpdate: () => void, storageKey: string | null, title: string }) {
    const { role } = useRole();
    const [cases, setCases] = useState<Feedback[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchCases = useCallback(async () => {
        setIsLoading(true);
        if (storageKey) {
            const caseIds = JSON.parse(localStorage.getItem(storageKey) || '[]');
            if (caseIds.length > 0) {
                const fetchedCases = await getFeedbackByIds(caseIds);
                setCases(fetchedCases.sort((a,b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()));
            } else {
                setCases([]);
            }
        }
        setIsLoading(false);
    }, [storageKey]);

    useEffect(() => {
        fetchCases();
        
        const handleFeedbackUpdate = () => fetchCases();
        window.addEventListener('feedbackUpdated', handleFeedbackUpdate);

        return () => {
            window.removeEventListener('feedbackUpdated', handleFeedbackUpdate);
        };
    }, [fetchCases]);
    
    if (isLoading) return <Skeleton className="h-24 w-full" />;

    if (cases.length === 0) {
        return (
            <div className="mt-4 text-center py-8 border-2 border-dashed rounded-lg">
                <p className="text-muted-foreground">You have not submitted any concerns of this type yet.</p>
            </div>
        );
    }
    
    const getStatusBadge = (status?: string) => {
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

    return (
        <div className="mt-6 space-y-4">
             <h3 className="text-lg font-semibold flex items-center gap-2 text-muted-foreground">
                <List className="h-5 w-5" />
                {title}
            </h3>
            <Accordion type="single" collapsible className="w-full border rounded-lg">
                 {cases.map(item => (
                    <AccordionItem value={item.trackingId} key={item.trackingId} className="px-4">
                        <AccordionTrigger>
                            <div className="flex justify-between items-center w-full pr-4">
                                <div className="text-left">
                                    <p className="font-medium truncate">{item.subject}</p>
                                    <p className="text-sm text-muted-foreground font-normal">
                                        Submitted {formatDistanceToNow(new Date(item.submittedAt), { addSuffix: true })}
                                    </p>
                                </div>
                                <div className="hidden md:flex items-center gap-2">
                                    {getStatusBadge(item.status)}
                                </div>
                            </div>
                        </AccordionTrigger>
                        <AccordionContent className="space-y-4 pt-2">
                           {item.status === 'Pending Identity Reveal' && (
                               <RevealIdentityWidget item={item} onUpdate={fetchCases} />
                           )}
                           {item.status === 'Pending Employee Acknowledgment' && (
                                <AcknowledgementWidget item={item} onUpdate={fetchCases} />
                           )}
                           <div className="space-y-2">
                                <Label>Original Submission</Label>
                                <p className="whitespace-pre-wrap text-sm text-muted-foreground p-4 border rounded-md bg-muted/50">{item.message}</p>
                            </div>
                            <div className="space-y-2">
                                <Label>Case History</Label>
                                <div className="p-4 border rounded-md bg-muted/50 space-y-4">
                                    {item.auditTrail?.map((event, index) => (
                                        <div key={index} className="flex items-start gap-3">
                                            <Info className="h-5 w-5 mt-0.5 text-muted-foreground" />
                                            <div className="flex-1">
                                                <p className="font-medium text-sm">
                                                    {event.event} by <span className="text-primary">{event.actor}</span>
                                                </p>
                                                <p className="text-xs text-muted-foreground">{format(new Date(event.timestamp), "PPP p")}</p>
                                                {event.details && <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">{event.details}</p>}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                             {item.resolution && (
                                <div className="space-y-2">
                                    <Label>Manager's Final Resolution</Label>
                                    <p className="whitespace-pre-wrap text-sm text-muted-foreground p-4 border rounded-md bg-green-500/10">{item.resolution}</p>
                                </div>
                            )}

                            {!item.isAnonymous && (
                                <div className="pt-4 border-t border-dashed">
                                    <Button variant="destructive" disabled>
                                        <AlertTriangle className="mr-2 h-4 w-4" />
                                        Retaliation/Bias Observed
                                    </Button>
                                </div>
                            )}
                             
                             <div className="text-xs text-muted-foreground/80 pt-2 border-t">
                                Tracking ID: <code className="font-mono">{item.trackingId}</code>
                            </div>
                        </AccordionContent>
                    </AccordionItem>
                 ))}
            </Accordion>
        </div>
    );
}

function MyConcernsContent() {
  const [remountKey, setRemountKey] = useState(0);
  const { role } = useRole();

  const remountSubmissions = useCallback(() => {
    setRemountKey(prevKey => prevKey + 1);
  }, []);

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
            <Tabs defaultValue="anonymous">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="identity-revealed">
                        <User className="mr-2" />
                        Identity Revealed
                    </TabsTrigger>
                    <TabsTrigger value="anonymous">
                        <UserX className="mr-2" />
                        Anonymous
                    </TabsTrigger>
                </TabsList>
                <TabsContent value="identity-revealed">
                    <IdentifiedConcernForm onCaseSubmitted={remountSubmissions} />
                     <MySubmissions onUpdate={remountSubmissions} storageKey={getIdentifiedCaseKey(role)} title="My Identified Concerns" key={`identified-${remountKey}`} />
                </TabsContent>
                <TabsContent value="anonymous">
                    <AnonymousConcernForm onCaseSubmitted={remountSubmissions} />
                    <MySubmissions onUpdate={remountSubmissions} storageKey={getAnonymousCaseKey(role)} title="My Anonymous Submissions" key={`anonymous-${remountKey}`} />
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

    