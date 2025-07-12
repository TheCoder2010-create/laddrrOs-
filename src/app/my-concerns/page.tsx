
"use client";

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { submitAnonymousConcernFromDashboard, getFeedbackByIds, Feedback, respondToIdentityReveal, requestIdentityReveal, employeeAcknowledgeMessageRead } from '@/services/feedback-service';
import { Skeleton } from '@/components/ui/skeleton';
import { ShieldQuestion, Send, Loader2, User, UserX, List, CheckCircle, Clock, ShieldCheck, Info } from 'lucide-react';
import { useRole } from '@/hooks/use-role';
import DashboardLayout from '@/components/dashboard-layout';
import { roleUserMapping } from '@/lib/role-mapping';
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
import { formatDistanceToNow } from 'date-fns';
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


const getAnonymousCaseKey = (role: string | null) => role ? `anonymous_cases_${role.replace(/\s/g, '_')}` : null;

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


function IdentifiedConcernForm() {
    const { role } = useRole();
    const { toast } = useToast();
    const [subject, setSubject] = useState('');
    const [concern, setConcern] = useState('');
    const [criticality, setCriticality] = useState<'Low' | 'Medium' | 'High' | 'Critical'>('Medium');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        // This functionality is not fully wired up in the prototype as it's not the primary flow.
        toast({ title: "Not Implemented", description: "This feature is for demonstration purposes." });
    }

    return (
        <form onSubmit={handleSubmit} className="mt-6 space-y-6">
            <p className="text-sm text-muted-foreground">
                Use this form to confidentially report a concern directly to HR. Your identity will be attached to this submission.
            </p>
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
                <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                    Submit Concern to HR
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
            const key = getAnonymousCaseKey(role);
            if (key) {
                let ids = JSON.parse(localStorage.getItem(key) || '[]');
                ids = ids.filter((id: string) => id !== item.trackingId);
                localStorage.setItem(key, JSON.stringify(ids));
            }
             toast({ variant: 'destructive', title: "Request Declined", description: "The case has been closed as you have declined to reveal your identity."});
        }
        
        onUpdate();
    }

    return (
        <div className="p-4 border-2 border-destructive/50 bg-destructive/5 rounded-lg space-y-4">
            <h4 className="font-bold text-lg text-destructive">Action Required: Your manager has requested you reveal your identity</h4>
            
            {!hasAcknowledged ? (
                <>
                    <div className="p-4 bg-background/50 rounded-md border">
                        <p className="font-semibold text-foreground">Manager's Message:</p>
                        <p className="text-muted-foreground mt-2 whitespace-pre-wrap">{revealRequest?.details}</p>
                    </div>
                    <div className="p-4 bg-blue-500/10 rounded-lg border border-blue-500/20 text-blue-800 dark:text-blue-300">
                         <div className="flex items-start gap-3">
                            <ShieldCheck className="h-5 w-5 mt-1 flex-shrink-0 text-blue-500" />
                            <div>
                                <h5 className="font-bold">Please Acknowledge This Message</h5>
                                <p className="text-sm mt-1">
                                    Your identity has <span className="font-bold">not</span> been revealed. Clicking the button below only confirms that you have read this message. You will decide whether to reveal your identity on the next step.
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="flex justify-end">
                        <Button onClick={handleAcknowledge}>I Understand, Show Me My Options</Button>
                    </div>
                </>
            ) : (
                <>
                     <div className="p-3 bg-background/50 rounded-md border">
                        <p className="font-semibold text-foreground">Manager's Message:</p>
                        <p className="text-muted-foreground mt-1 whitespace-pre-wrap">{revealRequest?.details}</p>
                    </div>
                    <p className="text-sm text-muted-foreground">
                        To proceed with this investigation, the manager needs to know who you are. Your case will be de-anonymized if you accept. If you decline, the case will be closed.
                    </p>
                    <div className="flex gap-4">
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button>Reveal Identity & Proceed</Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>This will reveal your name to the manager and permanently attach it to this case. This action cannot be undone.</AlertDialogDescription></AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleResponse(true)}>Yes, Reveal My Identity</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>

                         <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="secondary">Decline & Close Case</Button>
                            </AlertDialogTrigger>
                             <AlertDialogContent>
                                <AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>If you decline, this case will be closed and no further action can be taken. This cannot be undone.</AlertDialogDescription></AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleResponse(false)} className={cn(buttonVariants({variant: 'destructive'}))}>Yes, Decline and Close</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                </>
            )}
        </div>
    )
}

function MyAnonymousSubmissions({ onUpdate }: { onUpdate: () => void }) {
    const { role } = useRole();
    const [cases, setCases] = useState<Feedback[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchCases = useCallback(async () => {
        setIsLoading(true);
        const key = getAnonymousCaseKey(role);
        if (key) {
            const caseIds = JSON.parse(localStorage.getItem(key) || '[]');
            if (caseIds.length > 0) {
                const fetchedCases = await getFeedbackByIds(caseIds);
                setCases(fetchedCases.sort((a,b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()));
            } else {
                setCases([]);
            }
        }
        setIsLoading(false);
    }, [role]);

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
                <p className="text-muted-foreground">You have not submitted any anonymous concerns yet.</p>
            </div>
        );
    }
    
    const getStatusBadge = (status?: string) => {
        switch(status) {
            case 'Resolved': return <Badge variant="success" className="flex items-center gap-1.5"><CheckCircle className="h-3 w-3" />Resolved</Badge>;
            case 'Pending Manager Action': return <Badge className="bg-orange-500 text-white flex items-center gap-1.5"><Clock className="h-3 w-3" />Manager Review</Badge>;
            case 'Pending Identity Reveal': return <Badge variant="destructive" className="flex items-center gap-1.5"><UserX className="h-3 w-3" />Reveal Requested</Badge>;
            case 'Closed': return <Badge variant="secondary" className="flex items-center gap-1.5"><UserX className="h-3 w-3" />Closed</Badge>;
            default: return <Badge variant="secondary" className="flex items-center gap-1.5"><Clock className="h-3 w-3" />Submitted</Badge>;
        }
    }

    return (
        <div className="mt-6 space-y-4">
             <h3 className="text-lg font-semibold flex items-center gap-2 text-muted-foreground">
                <List className="h-5 w-5" />
                My Anonymous Submissions
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
                           <div className="space-y-2">
                                <Label>Original Submission</Label>
                                <p className="whitespace-pre-wrap text-sm text-muted-foreground p-4 border rounded-md bg-muted/50">{item.message}</p>
                            </div>
                             {item.resolution && (
                                <div className="space-y-2">
                                    <Label>Manager's Final Resolution</Label>
                                    <p className="whitespace-pre-wrap text-sm text-muted-foreground p-4 border rounded-md bg-green-500/10">{item.resolution}</p>
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
  const [key, setKey] = useState(0);

  const remountSubmissions = useCallback(() => {
    setKey(prevKey => prevKey + 1);
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
                    <IdentifiedConcernForm />
                </TabsContent>
                <TabsContent value="anonymous">
                    <AnonymousConcernForm onCaseSubmitted={remountSubmissions} />
                    <MyAnonymousSubmissions onUpdate={remountSubmissions} key={key} />
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

    