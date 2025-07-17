

"use client";

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { getAllFeedback, Feedback, AuditEvent, assignFeedback, addFeedbackUpdate, resolveFeedback, markAllFeedbackAsViewed, summarizeFeedback } from '@/services/feedback-service';
import { format, formatDistanceToNow } from 'date-fns';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Lock, ArrowLeft, ShieldAlert, AlertTriangle, Info, CheckCircle, Clock, User, MessageSquare, Send, ChevronsRight, FileCheck, Users, Bot, Loader2, ChevronDown } from 'lucide-react';
import { useRole, Role } from '@/hooks/use-role';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { availableRolesForAssignment } from '@/hooks/use-role';
import { useToast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';

function VaultLoginPage({ onUnlock }: { onUnlock: () => void }) {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleLogin = () => {
        if (username === 'hr_head' && password === 'password123') {
            setError('');
            onUnlock();
        } else {
            setError('Invalid username or password.');
        }
    };
    
    return (
        <div className="flex items-center justify-center min-h-screen bg-background p-4 md:p-8">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <div className="mx-auto bg-primary text-primary-foreground rounded-full p-3 w-fit mb-4">
                        <Lock className="h-6 w-6" />
                    </div>
                    <CardTitle className="text-2xl font-bold font-headline">Vault is Locked</CardTitle>
                    <CardDescription>Enter credentials to access sensitive content.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="username">Username</Label>
                        <Input 
                            id="username" 
                            placeholder="Enter username" 
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="password">Password</Label>
                        <Input 
                            id="password" 
                            type="password" 
                            placeholder="Enter password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>
                     {error && <p className="text-sm text-destructive text-center">{error}</p>}
                </CardContent>
                <CardFooter className="flex flex-col gap-4">
                    <Button className="w-full" onClick={handleLogin}>Unlock Vault</Button>
                    <div className="text-xs text-muted-foreground text-center">
                        <p>For demo purposes:</p>
                        <p>Username: <code className="font-mono">hr_head</code> | Password: <code className="font-mono">password123</code></p>
                    </div>
                </CardFooter>
            </Card>
        </div>
    )
}

const criticalityConfig = {
    'Critical': { icon: ShieldAlert, color: 'bg-destructive/20 text-destructive', badge: 'destructive' },
    'High': { icon: AlertTriangle, color: 'bg-orange-500/20 text-orange-500', badge: 'destructive' },
    'Medium': { icon: Info, color: 'bg-yellow-500/20 text-yellow-500', badge: 'secondary' },
    'Low': { icon: CheckCircle, color: 'bg-green-500/20 text-green-500', badge: 'success' },
};

const auditEventIcons = {
    'Submitted': FileCheck,
    'AI Analysis Completed': ChevronsRight,
    'Assigned': Send,
    'Update Added': MessageSquare,
    'Resolved': CheckCircle,
    'default': Info,
}

function AuditTrail({ trail }: { trail: AuditEvent[] }) {
    if (!trail || trail.length === 0) return null;

    return (
        <div className="space-y-2">
            <Label className="text-base">Case History</Label>
            <div className="relative p-4 border rounded-md bg-muted/50">
                <div className="absolute left-8 top-8 bottom-8 w-px bg-border -translate-x-1/2"></div>
                <div className="space-y-8">
                    {trail.map((event, index) => {
                        const Icon = auditEventIcons[event.event as keyof typeof auditEventIcons] || auditEventIcons.default;
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

function ActionPanel({ feedback, onUpdate }: { feedback: Feedback, onUpdate: () => void }) {
    const { role } = useRole();
    const [assignees, setAssignees] = useState<Role[]>([]);
    const [assignmentComment, setAssignmentComment] = useState('');
    const [updateComment, setUpdateComment] = useState('');
    const [resolutionComment, setResolutionComment] = useState('');

    const handleAssigneeChange = (role: Role) => {
        setAssignees(prev => 
            prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]
        );
    };

    const handleAssign = async () => {
        if (assignees.length === 0) return;
        await assignFeedback(feedback.trackingId, assignees, role!, assignmentComment);
        setAssignmentComment('');
        setAssignees([]);
        onUpdate();
    }

    const handleAddUpdate = async () => {
        if (!updateComment) return;
        await addFeedbackUpdate(feedback.trackingId, role!, updateComment);
        setUpdateComment('');
        onUpdate();
    }

    const handleResolve = async () => {
        if (!resolutionComment) return;
        await resolveFeedback(feedback.trackingId, role!, resolutionComment);
        setResolutionComment('');
        onUpdate();
    }
    
    const canTakeAction = role === 'HR Head' || feedback.assignedTo?.includes(role!);

    if (!canTakeAction || feedback.status === 'Resolved') return null;

    return (
        <div className="p-4 border-t mt-4 space-y-4">
            <Label className="text-base font-semibold">Case Management</Label>
            
            {role === 'HR Head' && (
                <div className="p-4 border rounded-lg bg-background space-y-3">
                    <Label className="font-medium">Assign Case</Label>
                    <p className="text-sm text-muted-foreground">
                        Select one or more roles to investigate this case.
                        {feedback.assignedTo && feedback.assignedTo.length > 0 && (
                            <span className="block mt-1">
                                Currently assigned to: <span className="font-semibold text-primary">{feedback.assignedTo.join(', ')}</span>
                            </span>
                        )}
                    </p>
                    <div className="flex gap-4 items-start">
                         <div className="flex flex-col gap-2">
                             <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline">
                                        Select Roles <ChevronDown className="ml-2 h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="w-56">
                                    <DropdownMenuLabel>Assignable Roles</DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    {availableRolesForAssignment.map(r => (
                                         <DropdownMenuCheckboxItem
                                            key={r}
                                            checked={assignees.includes(r)}
                                            onCheckedChange={() => handleAssigneeChange(r)}
                                        >
                                            {r}
                                        </DropdownMenuCheckboxItem>
                                    ))}
                                </DropdownMenuContent>
                            </DropdownMenu>
                            <Button onClick={handleAssign} disabled={assignees.length === 0}>Assign</Button>
                        </div>
                        <div className="flex-1 space-y-2">
                            <Textarea 
                                placeholder="Add an assignment note (optional)..."
                                value={assignmentComment}
                                onChange={(e) => setAssignmentComment(e.target.value)}
                                className="w-full"
                                rows={4}
                            />
                        </div>
                    </div>
                </div>
            )}

            <div className="p-4 border rounded-lg bg-background space-y-3">
                <Label className="font-medium">Add Update</Label>
                <Textarea 
                    placeholder="Provide an update on the case..."
                    value={updateComment}
                    onChange={(e) => setUpdateComment(e.target.value)}
                />
                <Button onClick={handleAddUpdate} disabled={!updateComment}>Add Update</Button>
            </div>

            {role === 'HR Head' && (
                <div className="p-4 border rounded-lg bg-background space-y-3">
                    <Label className="font-medium">Resolve Case</Label>
                    <Textarea 
                        placeholder="Explain the final resolution..."
                        value={resolutionComment}
                        onChange={(e) => setResolutionComment(e.target.value)}
                    />
                    <Button variant="success" onClick={handleResolve} disabled={!resolutionComment}>Mark as Resolved</Button>
                </div>
            )}
        </div>
    );
}


function VaultContent() {
  const [allFeedback, setAllFeedback] = useState<Feedback[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSummarizing, setIsSummarizing] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchFeedback = useCallback(async () => {
    setIsLoading(true);
    try {
      const feedback = await getAllFeedback();
      const vaultItems = feedback.filter(f => f.source === 'Voice – In Silence');
      setAllFeedback(vaultItems);
      const unreadVaultIds = vaultItems.filter(c => !c.viewed).map(c => c.trackingId);
      if (unreadVaultIds.length > 0) {
        await markAllFeedbackAsViewed(unreadVaultIds);
      }
    } catch (error) {
      console.error("Failed to fetch feedback", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFeedback();

    const handleStorageChange = () => {
        fetchFeedback();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('feedbackUpdated', handleStorageChange);

    return () => {
        window.removeEventListener('storage', handleStorageChange);
        window.removeEventListener('feedbackUpdated', handleStorageChange);
    };
  }, [fetchFeedback]);
  
  const handleSummarize = async (trackingId: string) => {
    setIsSummarizing(trackingId);
    try {
        await summarizeFeedback(trackingId);
        toast({
            title: "Analysis Complete",
            description: "AI summary and criticality have been added to the case.",
        });
        fetchFeedback();
    } catch (error) {
        console.error("Failed to summarize feedback", error);
        toast({
            variant: "destructive",
            title: "Analysis Failed",
            description: "The AI summary could not be generated.",
        });
    } finally {
        setIsSummarizing(null);
    }
  };

  if (isLoading) {
    return (
        <div className="p-4 md:p-8">
            <Card>
                <CardHeader>
                    <Skeleton className="h-8 w-48 mb-2" />
                    <Skeleton className="h-6 w-72" />
                </CardHeader>
                <CardContent className="space-y-4">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                </CardContent>
            </Card>
        </div>
    );
  }

  const getStatusVariant = (status?: string) => {
    switch(status) {
        case 'Resolved': return 'success';
        case 'In Progress': return 'secondary';
        default: return 'default';
    }
  }

  return (
    <div className="p-4 md:p-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold font-headline mb-2 text-foreground">
            🔒 Feedback Vault
          </CardTitle>
           <CardDescription className="text-base text-muted-foreground italic">
            Confidential submissions from Voice – in Silence, with AI-powered analysis.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {allFeedback.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed rounded-lg">
              <p className="text-muted-foreground text-lg">The vault is currently empty.</p>
              <p className="text-sm text-muted-foreground mt-2">
                New anonymous submissions will appear here.
              </p>
            </div>
          ) : (
             <TooltipProvider>
                <Accordion type="single" collapsible className="w-full">
                {allFeedback.map((feedback) => {
                    const config = criticalityConfig[feedback.criticality || 'Low'];
                    const Icon = config?.icon || Info;
                    const isSummarizingThis = isSummarizing === feedback.trackingId;
                    return (
                    <AccordionItem value={feedback.trackingId} key={feedback.trackingId}>
                        <AccordionTrigger className="w-full px-4 py-3 text-left">
                           <div className="flex justify-between items-center w-full">
                                <div className="flex items-center gap-4 flex-1 min-w-0">
                                    {feedback.criticality ? (
                                        <Badge variant={config?.badge as any || 'secondary'}>{feedback.criticality}</Badge>
                                    ) : (
                                        <Badge variant="outline">Unanalyzed</Badge>
                                    )}
                                    <span className="font-medium truncate">{feedback.subject}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Badge variant={getStatusVariant(feedback.status)} className="mr-2">{feedback.status || 'Open'}</Badge>
                                </div>
                            </div>
                        </AccordionTrigger>
                        <AccordionContent className="space-y-4 pt-4 px-4">
                            {feedback.assignedTo && feedback.assignedTo.length > 0 && (
                                 <div className="flex items-center gap-2 text-sm font-medium p-2 bg-muted rounded-md w-fit">
                                    <Users className="h-4 w-4 text-muted-foreground"/>
                                    <span>Assigned to: <span className="text-primary">{feedback.assignedTo.join(', ')}</span></span>
                                </div>
                            )}

                            {feedback.summary && (
                                <div className={cn("p-4 rounded-lg border space-y-3", config?.color || 'bg-blue-500/20 text-blue-500')}>
                                     <div className="flex items-center gap-2 font-bold">
                                        <Icon className="h-5 w-5" />
                                        <span>AI Analysis: {feedback.criticality}</span>
                                     </div>
                                     <p><span className="font-semibold">Summary:</span> {feedback.summary}</p>
                                     <p><span className="font-semibold">Reasoning:</span> {feedback.criticalityReasoning}</p>
                                </div>
                            )}
                            
                            <div className="space-y-2">
                                <div className="flex justify-between items-center gap-4">
                                    <div className="flex items-center gap-2">
                                        <Label className="text-base">Original Submission</Label>
                                         <Button
                                            size="sm"
                                            onClick={() => handleSummarize(feedback.trackingId)}
                                            disabled={isSummarizingThis || !!feedback.summary}
                                            variant="ghost"
                                         >
                                            {isSummarizingThis ? (
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            ) : (
                                                <Bot className="mr-2 h-4 w-4" />
                                            )}
                                            Summarize
                                        </Button>
                                    </div>
                                    <span 
                                        className="text-xs text-muted-foreground font-mono cursor-text"
                                    >
                                       ID: {feedback.trackingId}
                                    </span>
                                </div>
                                <p className="whitespace-pre-wrap text-base text-muted-foreground p-4 border rounded-md bg-muted/50">{feedback.message}</p>
                            </div>

                            {feedback.auditTrail && <AuditTrail trail={feedback.auditTrail} />}

                            <ActionPanel feedback={feedback} onUpdate={fetchFeedback} />
                        </AccordionContent>
                    </AccordionItem>
                    )
                })}
                </Accordion>
            </TooltipProvider>
          )}
        </CardContent>
      </Card>
    </div>
  );
}


export default function VaultPage() {
    const [isUnlocked, setIsUnlocked] = useState(false);
    const { role } = useRole();

    useEffect(() => {
        setIsUnlocked(false);
    }, [role]);

    return (
      <div className="relative min-h-screen">
          <div className="absolute top-4 left-4 z-10">
              <Button variant="ghost" asChild>
                  <Link href="/">
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Back to Dashboard
                  </Link>
              </Button>
          </div>
          {role !== 'HR Head' ? (
              <div className="flex flex-col items-center justify-center min-h-screen text-center p-4">
                  <Card className="max-w-md">
                      <CardHeader>
                          <CardTitle>Access Denied</CardTitle>
                          <CardDescription>You do not have permission to view this page.</CardDescription>
                      </CardHeader>
                      <CardContent>
                          <p>The Vault is restricted to the HR Head role.</p>
                      </CardContent>
                  </Card>
              </div>
          ) : !isUnlocked ? (
              <VaultLoginPage onUnlock={() => setIsUnlocked(true)} />
          ) : (
              <div className="pt-16">
                  <VaultContent />
              </div>
          )}
      </div>
    );
}
