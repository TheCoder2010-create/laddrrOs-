

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
import { getAllFeedback, Feedback, AuditEvent, assignFeedback, addFeedbackUpdate, resolveFeedback, markAllFeedbackAsViewed, summarizeFeedback, requestAnonymousInformation } from '@/services/feedback-service';
import { format, formatDistanceToNow } from 'date-fns';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Lock, ArrowLeft, ShieldAlert, AlertTriangle, Info, CheckCircle, Clock, User, MessageSquare, Send, ChevronsRight, FileCheck, Users, Bot, Loader2, ChevronDown, Download, MessageCircleQuestion, UserX, LogOut, X } from 'lucide-react';
import { useRole, Role } from '@/hooks/use-role';
import { Badge, badgeVariants } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
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
import { downloadAuditTrailPDF } from '@/lib/pdf-generator';
import { CustomSwitch } from '@/components/ui/custom-switch';
import { formatActorName } from '@/lib/role-mapping';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

function VaultLoginPage({ onUnlock }: { onUnlock: () => void; }) {
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
    );
}

const criticalityConfig = {
    'Critical': { icon: ShieldAlert, color: 'bg-destructive/20 text-destructive', badge: 'destructive' as const },
    'High': { icon: AlertTriangle, color: 'bg-orange-500/20 text-orange-500', badge: 'destructive' as const },
    'Medium': { icon: Info, color: 'bg-yellow-500/20 text-yellow-500', badge: 'secondary' as const },
    'Low': { icon: CheckCircle, color: 'bg-green-500/20 text-green-500', badge: 'success' as const },
};

const auditEventIcons = {
    'Submitted': FileCheck,
    'AI Analysis Completed': ChevronsRight,
    'Assigned': Send,
    'Unassigned': UserX,
    'Update Added': MessageSquare,
    'Resolved': CheckCircle,
    'Information Requested': MessageCircleQuestion,
    'Anonymous User Responded': MessageSquare,
    'default': Info,
}

function AuditTrail({ trail, onDownload }: { trail: AuditEvent[], onDownload: () => void }) {
    if (!trail || trail.length === 0) return null;

    return (
        <div className="space-y-2">
            <div className="flex justify-between items-center">
                <Label className="text-base">Case History</Label>
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
                        const Icon = auditEventIcons[event.event as keyof typeof auditEventIcons] || auditEventIcons.default;
                        return (
                            <div key={index} className="flex items-start gap-4 relative">
                                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-background border flex items-center justify-center z-10">
                                    <Icon className="h-5 w-5 text-muted-foreground" />
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

function ActionPanel({ feedback, onUpdate }: { feedback: Feedback, onUpdate: () => void }) {
    const { role } = useRole();
    const { toast } = useToast();
    const [assignees, setAssignees] = useState<Role[]>([]);
    const [assignmentComment, setAssignmentComment] = useState('');
    const [updateComment, setUpdateComment] = useState('');
    const [resolutionComment, setResolutionComment] = useState('');
    const [informationRequest, setInformationRequest] = useState('');
    const [isUnassignMode, setIsUnassignMode] = useState(false);

    const [isAssigning, setIsAssigning] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);
    const [isResolving, setIsResolving] = useState(false);
    const [isRequestingInfo, setIsRequestingInfo] = useState(false);
    
    useEffect(() => {
        // Reset selections when toggling modes
        setAssignees([]);
    }, [isUnassignMode]);

    const handleAssigneeChange = (role: Role) => {
        setAssignees(prev => 
            prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]
        );
    };

    const handleAssign = async () => {
        if (assignees.length === 0) return;
        setIsAssigning(true);
        try {
            await assignFeedback(feedback.trackingId, assignees, role!, assignmentComment, isUnassignMode ? 'unassign' : 'assign');
            toast({ title: `Case ${isUnassignMode ? 'Unassigned' : 'Assigned'}`, description: `Case has been updated for ${assignees.join(', ')}.`});
            setAssignmentComment('');
            setAssignees([]);
            onUpdate();
        } catch (error) {
            toast({ variant: 'destructive', title: "Assignment Failed" });
        } finally {
            setIsAssigning(false);
        }
    }

    const handleAddUpdate = async () => {
        if (!updateComment) return;
        setIsUpdating(true);
        try {
            await addFeedbackUpdate(feedback.trackingId, role!, updateComment);
            toast({ title: "Update Added", description: "Your notes have been added to the case history." });
            setUpdateComment('');
            onUpdate();
        } catch (error) {
            toast({ variant: 'destructive', title: "Update Failed" });
        } finally {
            setIsUpdating(false);
        }
    }

    const handleResolve = async () => {
        if (!resolutionComment) return;
        setIsResolving(true);
        try {
            await resolveFeedback(feedback.trackingId, role!, resolutionComment);
            toast({ 
                title: "Resolution Submitted", 
                description: "The resolution has been sent to the user for acknowledgement. If the complainant is not satisfied, they will have the option to escalate the case." 
            });
            setResolutionComment('');
            onUpdate();
        } catch (error) {
            toast({ variant: 'destructive', title: "Resolution Failed" });
        } finally {
            setIsResolving(false);
        }
    }

    const handleRequestInfo = async () => {
        if (!informationRequest) return;
        setIsRequestingInfo(true);
        try {
            await requestAnonymousInformation(feedback.trackingId, role!, informationRequest);
            toast({ title: "Information Requested", description: "The anonymous user has been prompted to reply."});
            setInformationRequest('');
            onUpdate();
        } catch (error) {
            toast({ variant: 'destructive', title: "Request Failed" });
        } finally {
            setIsRequestingInfo(false);
        }
    };
    
    const canTakeAction = role === 'HR Head' || feedback.assignedTo?.includes(role!);

    if (!canTakeAction || feedback.status === 'Resolved' || feedback.status === 'Closed') return null;

    const assignableRolesForDropdown = isUnassignMode 
        ? (feedback.assignedTo || []) 
        : availableRolesForAssignment.filter(r => !feedback.assignedTo?.includes(r));

    return (
        <div className="space-y-2">
            {role === 'HR Head' && (
                 <>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-x-4 gap-y-2">
                        <div className="p-4 border rounded-lg bg-background flex flex-col space-y-3">
                            <Label className="font-medium">Assign Case</Label>
                             <div className="flex items-center justify-between">
                                <CustomSwitch id="assign-mode-switch" checked={isUnassignMode} onCheckedChange={setIsUnassignMode} />
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button 
                                          variant="outline" 
                                          size="sm" 
                                          className="justify-between"
                                          disabled={isUnassignMode && (!feedback.assignedTo || feedback.assignedTo.length === 0)}
                                        >
                                            <span>Select</span>
                                            <ChevronDown className="ml-2 h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent className="w-auto" align="end">
                                        {assignableRolesForDropdown.map(r => (
                                            <DropdownMenuCheckboxItem
                                                key={r}
                                                checked={assignees.includes(r)}
                                                onCheckedChange={() => handleAssigneeChange(r)}
                                                onSelect={(e) => e.preventDefault()}
                                            >
                                                {r}
                                            </DropdownMenuCheckboxItem>
                                        ))}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                {feedback.assignedTo && feedback.assignedTo.length > 0 && (
                                    <span className="block">
                                        Currently: <span className="font-semibold text-primary">{feedback.assignedTo.join(', ')}</span>
                                    </span>
                                )}
                            </p>
                            <div className="relative">
                                 <Textarea 
                                    placeholder="Add a note..."
                                    value={assignmentComment}
                                    onChange={(e) => setAssignmentComment(e.target.value)}
                                    className="w-full text-sm pr-12 pb-12"
                                    rows={2}
                                />
                                 <Button onClick={handleAssign} disabled={assignees.length === 0 || isAssigning} size="icon" className="absolute bottom-2 right-2 h-7 w-7 rounded-full">
                                    {isAssigning ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4"/>}
                                </Button>
                            </div>
                        </div>
                        
                        <div className="p-4 border rounded-lg bg-background flex flex-col space-y-3">
                            <Label className="font-medium">Ask Information</Label>
                            <div className="relative flex-grow">
                                <Textarea 
                                    placeholder="Ask a clarifying question..."
                                    value={informationRequest}
                                    onChange={(e) => setInformationRequest(e.target.value)}
                                    className="pr-12 pb-12 h-full"
                                />
                                <Button size="icon" className="absolute bottom-2 right-2 h-7 w-7 rounded-full" onClick={handleRequestInfo} disabled={!informationRequest || isRequestingInfo}>
                                    {isRequestingInfo ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4"/>}
                                </Button>
                            </div>
                        </div>
                        
                        <div className="p-4 border rounded-lg bg-background flex flex-col space-y-3">
                            <Label className="font-medium">Add Update</Label>
                            <div className="relative flex-grow">
                                <Textarea 
                                    placeholder="Add your notes here..."
                                    value={updateComment}
                                    onChange={(e) => setUpdateComment(e.target.value)}
                                    className="pr-12 pb-12 h-full"
                                />
                                <Button size="icon" className="absolute bottom-2 right-2 h-7 w-7 rounded-full" onClick={handleAddUpdate} disabled={!updateComment || isUpdating}>
                                    {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4"/>}
                                </Button>
                            </div>
                        </div>
                    </div>

                    <div className="p-4 border rounded-lg bg-background space-y-3">
                        <Label className="font-medium">Resolve Case</Label>
                        <div className="relative">
                            <Textarea 
                                placeholder="Explain the final resolution..."
                                value={resolutionComment}
                                onChange={(e) => setResolutionComment(e.target.value)}
                                rows={3}
                                className="pr-12 pb-12"
                            />
                            <Button variant="success" size="icon" className="absolute bottom-2 right-2 h-7 w-7 rounded-full" onClick={handleResolve} disabled={!resolutionComment || isResolving}>
                                {isResolving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4"/>}
                            </Button>
                        </div>
                    </div>
                </>
            )}

            {role !== 'HR Head' && (
                 <div className="p-4 border rounded-lg bg-background space-y-3">
                    <Label className="font-medium">Add Update</Label>
                    <Textarea 
                        placeholder="Add your notes here..."
                        value={updateComment}
                        onChange={(e) => setUpdateComment(e.target.value)}
                    />
                    <Button onClick={handleAddUpdate} disabled={!updateComment || isUpdating}>
                        {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Add Update
                    </Button>
                </div>
            )}
        </div>
    );
}

const HIDDEN_SUMMARIES_KEY = 'vault_hidden_summaries';

function VaultContent({ onLogout }: { onLogout: () => void }) {
  const [allFeedback, setAllFeedback] = useState<Feedback[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSummarizing, setIsSummarizing] = useState<string | null>(null);
  const [hiddenSummaries, setHiddenSummaries] = useState<Set<string>>(new Set());
  const { toast } = useToast();
  const [openAccordionItem, setOpenAccordionItem] = useState<string | undefined>(undefined);

  useEffect(() => {
    try {
        const storedHidden = localStorage.getItem(HIDDEN_SUMMARIES_KEY);
        if (storedHidden) {
            setHiddenSummaries(new Set(JSON.parse(storedHidden)));
        }
    } catch (error) {
        console.error("Failed to load hidden summaries from localStorage", error);
    }
  }, []);

  const fetchFeedback = useCallback(async () => {
    setIsLoading(true);
    try {
      const feedback = await getAllFeedback();
      const vaultItems = feedback.filter(f => f.source === 'Voice – In Silence');
      setAllFeedback(vaultItems.sort((a,b) => new Date(b.submittedAt).getTime() - new Date(a.date).getTime()));
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

  const handleUpdate = useCallback(() => {
    const currentOpenItem = openAccordionItem;
    fetchFeedback().then(() => {
        if (currentOpenItem) {
            setOpenAccordionItem(currentOpenItem);
        }
    });
  }, [fetchFeedback, openAccordionItem]);

  useEffect(() => {
    fetchFeedback();

    const handleStorageChange = () => {
        handleUpdate();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('feedbackUpdated', handleStorageChange);

    return () => {
        window.removeEventListener('storage', handleStorageChange);
        window.removeEventListener('feedbackUpdated', handleStorageChange);
    };
  }, [fetchFeedback, handleUpdate]);
  
  const handleSummarize = async (trackingId: string) => {
    setIsSummarizing(trackingId);
    try {
        await summarizeFeedback(trackingId);
        toast({
            title: "Analysis Complete",
            description: "AI summary and criticality have been added to the case.",
        });
        handleUpdate();
        // Ensure the newly generated summary is visible
        toggleSummaryVisibility(trackingId, false);
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

  const toggleSummaryVisibility = (trackingId: string, shouldHide?: boolean) => {
    setHiddenSummaries(prev => {
        const newSet = new Set(prev);
        const isCurrentlyHidden = newSet.has(trackingId);

        // If shouldHide is explicitly provided, use it. Otherwise, toggle.
        const hide = shouldHide !== undefined ? shouldHide : !isCurrentlyHidden;

        if (hide) {
            newSet.add(trackingId);
        } else {
            newSet.delete(trackingId);
        }
        
        try {
            localStorage.setItem(HIDDEN_SUMMARIES_KEY, JSON.stringify(Array.from(newSet)));
        } catch (error) {
            console.error("Failed to save hidden summaries to localStorage", error);
        }

        return newSet;
    });
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

  const getStatusBadge = (status?: string) => {
    switch(status) {
        case 'Resolved': return <Badge variant='success'>Resolved</Badge>;
        case 'Closed': return <Badge variant='secondary'>Closed</Badge>;
        case 'In Progress': return <Badge variant='secondary'>In Progress</Badge>;
        case 'Pending Anonymous Reply': return <Badge className="bg-blue-500/20 text-blue-500">Awaiting Reply</Badge>;
        case 'Pending Anonymous Acknowledgement': return <Badge className="bg-blue-500/20 text-blue-500">Pending User Ack.</Badge>;
        default: return <Badge variant='default'>Open</Badge>;
    }
  }

  return (
    <div className="p-4 md:p-8">
      <Card>
        <CardHeader>
            <div className="flex justify-between items-start">
                <div>
                    <CardTitle className="text-2xl font-bold font-headline mb-2 text-foreground">
                        🔒 Feedback Vault
                    </CardTitle>
                    <CardDescription className="text-base text-muted-foreground italic">
                        Confidential submissions from Voice – in Silence, with AI-powered analysis.
                    </CardDescription>
                </div>
                <Button variant="ghost" onClick={onLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                </Button>
            </div>
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
             <Popover>
                <Accordion 
                  type="single" 
                  collapsible 
                  className="w-full"
                  value={openAccordionItem}
                  onValueChange={setOpenAccordionItem}
                >
                {allFeedback.map((feedback) => {
                    const criticalityBadgeVariant = badgeVariants({ variant: criticalityConfig[feedback.criticality || 'Low']?.badge || 'secondary' });
                    const Icon = criticalityConfig[feedback.criticality || 'Low']?.icon || Info;
                    const isSummarizingThis = isSummarizing === feedback.trackingId;
                    const capitalizedSubject = feedback.subject.charAt(0).toUpperCase() + feedback.subject.slice(1);
                    const isSummaryHidden = hiddenSummaries.has(feedback.trackingId);
                    const isCaseClosed = feedback.status === 'Resolved' || feedback.status === 'Closed';
                    
                    const handleDownload = () => {
                        const caseDetails = {
                            title: feedback.subject,
                            trackingId: feedback.trackingId,
                            initialMessage: feedback.message,
                            aiSummary: feedback.summary ? `Criticality: ${feedback.criticality}\nReason: ${feedback.criticalityReasoning}` : undefined,
                            finalResolution: feedback.resolution,
                            trail: feedback.auditTrail || [],
                            isCaseClosed: isCaseClosed,
                        };
                        downloadAuditTrailPDF(caseDetails);
                    };

                    return (
                    <AccordionItem value={feedback.trackingId} key={feedback.trackingId}>
                        <AccordionTrigger className="w-full px-4 py-3 text-left hover:no-underline [&[data-state=open]>svg]:rotate-180">
                           <div className="flex justify-between items-center w-full">
                                <div className="flex items-center gap-4 flex-1 min-w-0">
                                    <span className="font-medium truncate">{capitalizedSubject}</span>
                                    {feedback.criticality && (
                                        <Badge className={cn(criticalityBadgeVariant)}>{feedback.criticality}</Badge>
                                    )}
                                </div>
                                <div className="flex items-center gap-4 pl-4 mr-2">
                                    {getStatusBadge(feedback.status)}
                                </div>
                            </div>
                        </AccordionTrigger>
                        <AccordionContent className="space-y-2 pt-4 px-4">
                            {feedback.assignedTo && feedback.assignedTo.length > 0 && (
                                 <div className="flex items-center gap-2 text-sm font-medium p-2 bg-muted rounded-md w-fit">
                                    <Users className="h-4 w-4 text-muted-foreground"/>
                                    <span>Assigned to: <span className="text-primary">{feedback.assignedTo.join(', ')}</span></span>
                                </div>
                            )}

                            {feedback.summary && !isSummaryHidden && (
                                <div className={cn("p-4 rounded-lg border space-y-3 relative", criticalityConfig[feedback.criticality || 'Low']?.color || 'bg-blue-500/20 text-blue-500')}>
                                     <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        className="absolute top-2 right-2 h-6 w-6" 
                                        onClick={() => toggleSummaryVisibility(feedback.trackingId, true)}
                                    >
                                        <X className="h-4 w-4" />
                                     </Button>
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
                                         {!feedback.summary && (
                                             <Button
                                                size="sm"
                                                onClick={() => handleSummarize(feedback.trackingId)}
                                                disabled={isSummarizingThis}
                                                variant="ghost"
                                             >
                                                {isSummarizingThis ? (
                                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                ) : (
                                                    <Bot className="mr-2 h-4 w-4" />
                                                )}
                                                Summarize
                                            </Button>
                                         )}
                                        {feedback.summary && isSummaryHidden && (
                                            <Button
                                                size="sm"
                                                onClick={() => toggleSummaryVisibility(feedback.trackingId, false)}
                                                variant="ghost"
                                                className="text-primary"
                                            >
                                                <Bot className="mr-2 h-4 w-4" />
                                                Show Analysis
                                            </Button>
                                        )}
                                    </div>
                                    <span className="text-xs text-muted-foreground font-mono cursor-text">
                                        {isCaseClosed ? `ID: ${feedback.trackingId}` : 'ID Hidden Until Closure'}
                                    </span>
                                </div>
                                <p className="whitespace-pre-wrap text-base border rounded-md p-4">{feedback.message}</p>
                            </div>

                            {feedback.auditTrail && <AuditTrail trail={feedback.auditTrail} onDownload={handleDownload} />}

                            <ActionPanel feedback={feedback} onUpdate={handleUpdate} />
                        </AccordionContent>
                    </AccordionItem>
                    )
                })}
                </Accordion>
            </Popover>
          )}
        </CardContent>
      </Card>
    </div>
  );
}


export default function VaultPage() {
    const [isUnlocked, setIsUnlocked] = useState(false);
    const { role, setRole } = useRole();

    useEffect(() => {
        setIsUnlocked(false);
    }, [role]);

    if (role !== 'HR Head') {
        return (
          <div className="flex flex-col items-center justify-center min-h-screen text-center p-4">
              <div className="absolute top-4 left-4 z-10">
                  <Button variant="ghost" asChild>
                      <Link href="/">
                          <ArrowLeft className="mr-2 h-4 w-4" />
                          Back to Dashboard
                      </Link>
                  </Button>
              </div>
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
        )
    }

    if (!isUnlocked) {
        return (
            <>
                <div className="absolute top-4 left-4 z-10">
                    <Button variant="ghost" asChild>
                        <Link href="/">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Dashboard
                        </Link>
                    </Button>
                </div>
                <VaultLoginPage onUnlock={() => setIsUnlocked(true)} />
            </>
        )
    }

    return (
        <div className="pt-4">
            <VaultContent onLogout={() => setRole(null)} />
        </div>
    );
}
