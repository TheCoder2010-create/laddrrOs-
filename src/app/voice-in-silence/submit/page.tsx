

"use client";

import { useState, ChangeEvent, useRef } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Loader2, Copy, CheckCircle, Clock, Send, FileCheck, ChevronsRight, MessageSquare, Info, MessageCircleQuestion, UserX, UserPlus, FileText, Paperclip, Undo2, XIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { submitAnonymousFeedback, AnonymousFeedbackOutput } from '@/services/feedback-service';
import { trackFeedback, TrackedFeedback, submitAnonymousReply, submitAnonymousAcknowledgement } from '@/services/feedback-service';
import { rewriteText } from '@/ai/flows/rewrite-text-flow';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { format, formatDistanceToNow } from 'date-fns';
import type { AuditEvent, Feedback } from '@/services/feedback-service';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { getFeedbackByIds } from '@/services/feedback-service';
import { Skeleton } from '@/components/ui/skeleton';
import { formatActorName } from '@/lib/role-mapping';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { MagicWandIcon } from '@/components/ui/magic-wand-icon';


function SubmissionForm({ onSubmitted }: { onSubmitted: (result: AnonymousFeedbackOutput) => void }) {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // AI Rewrite State
  const [isRewriting, setIsRewriting] = useState(false);
  const [originalConcern, setOriginalConcern] = useState('');
  const [isRewritten, setIsRewritten] = useState(false);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(prev => [...prev, ...Array.from(e.target.files)]);
      toast({ title: "File(s) Attached" });
    }
  };

  const removeFile = (fileToRemove: File) => {
    setFiles(prev => prev.filter(f => f !== fileToRemove));
  }

  const handleAiAction = async () => {
    if (isRewritten) {
      // Undo the rewrite
      setMessage(originalConcern);
      setOriginalConcern('');
      setIsRewritten(false);
      toast({ title: "Original Text Restored" });
    } else {
      // Perform the rewrite
      if (!message) {
        toast({ variant: 'destructive', title: "Nothing to rewrite", description: "Please enter a message first." });
        return;
      }
      setIsRewriting(true);
      try {
        setOriginalConcern(message); // Save original text
        const result = await rewriteText({ textToRewrite: message });
        setMessage(result.rewrittenText);
        setIsRewritten(true);
        toast({ title: "Text Rewritten", description: "Your message has been updated by the AI." });
      } catch (error) {
        console.error(error);
        toast({ variant: 'destructive', title: "Rewrite Failed", description: "Could not rewrite the text." });
      } finally {
        setIsRewriting(false);
      }
    }
  };

  const handleSubmit = async () => {
    if (!subject || !message) {
      toast({
        variant: 'destructive',
        title: 'Missing Information',
        description: 'Please provide both a subject and a message.',
      });
      return;
    }
    setIsSubmitting(true);
    try {
      const result = await submitAnonymousFeedback({ subject, message, files });
      onSubmitted(result);
    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'Submission Failed',
        description: 'There was an error submitting your feedback. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <CardContent className="space-y-6">
      <p className="text-muted-foreground text-center">
        This is a protected space for anonymous feedback. Your submission is confidential. Please provide as much detail as possible.
      </p>
      <div className="flex items-center gap-2">
        <Label htmlFor="title" className="whitespace-nowrap">Subject</Label>
        <Input
          id="title"
          placeholder="Enter a subject for your feedback..."
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          disabled={isSubmitting || isRewriting}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="message">Your Message</Label>
        <div className="relative">
          <Textarea
            id="message"
            placeholder="Describe the situation in detail..."
            rows={10}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            disabled={isSubmitting || isRewriting}
            className="pr-12 pb-12"
          />
          <Input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              onChange={handleFileChange} 
              multiple
          />
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                    variant="ghost" 
                    size="icon" 
                    className="absolute top-2 right-2 text-muted-foreground hover:bg-transparent hover:text-primary"
                    onClick={() => fileInputRef.current?.click()}
                    aria-label="Attach file"
                >
                    <Paperclip className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent><p>Attach File</p></TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <div className="absolute bottom-2 right-2 flex items-center gap-1">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                      type="button"
                      variant="secondary"
                      size="icon"
                      className="h-8 w-8 rounded-full"
                      onClick={handleAiAction}
                      disabled={isRewriting || isSubmitting || (!isRewritten && !message)}
                  >
                      {isRewriting ? <Loader2 className="h-4 w-4 animate-spin" /> : (isRewritten ? <Undo2 className="h-4 w-4" /> : <MagicWandIcon className="h-4 w-4" />)}
                  </Button>
                </TooltipTrigger>
                <TooltipContent><p>{isRewritten ? "Undo Rewrite" : "Rewrite with AI"}</p></TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <Button onClick={handleSubmit} disabled={isSubmitting || isRewriting} size="icon" className="h-8 w-8 rounded-full">
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
        </div>
        {files.length > 0 && (
            <div className="space-y-1 pt-2">
                 {files.map((file, i) => (
                    <div key={i} className="text-sm flex items-center justify-between">
                        <span className="font-medium text-primary truncate">{file.name}</span>
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive" onClick={() => removeFile(file)}>
                            <XIcon className="h-4 w-4" />
                        </Button>
                    </div>
                ))}
            </div>
        )}
      </div>
    </CardContent>
  );
}

const publicAuditEventIcons = {
    'Submitted': FileCheck,
    'AI Analysis Completed': ChevronsRight,
    'Assigned': Send,
    'Update Added': MessageSquare,
    'Resolved': CheckCircle,
    'Resolution Provided by HR': MessageSquare,
    'Resolution Accepted': CheckCircle,
    'User Escalated to Ombudsman': UserX,
    'User Escalated to Grievance Office': UserPlus,
    'Case Closed': FileText,
    'Information Requested': MessageCircleQuestion,
    'Anonymous User Responded': MessageSquare,
    'default': Info,
}

function PublicAuditTrail({ trail }: { trail: AuditEvent[] }) {
    if (!trail || trail.length === 0) return null;

    return (
        <div className="space-y-2">
            <Label>Case History</Label>
            <div className="relative p-4 border rounded-md bg-muted/50">
                 <div className="absolute left-8 top-8 bottom-8 w-px bg-border -translate-x-1/2"></div>
                <div className="space-y-4">
                    {trail.map((event, index) => {
                        const Icon = publicAuditEventIcons[event.event as keyof typeof publicAuditEventIcons] || publicAuditEventIcons.default;
                        
                        let eventText = event.event;
                        let detailsText = event.details;

                        if (event.event === 'Assigned') {
                            eventText = 'Case assigned for review';
                            detailsText = undefined; // Don't show assignment notes publicly
                        } else if (event.event === 'Update Added') {
                            eventText = 'An update was added to the case';
                            detailsText = undefined; // Don't show private updates
                        }

                        return (
                            <div key={index} className="flex items-start gap-4 relative">
                                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-background border flex items-center justify-center z-10">
                                    <Icon className="h-5 w-5 text-muted-foreground" />
                                </div>
                                <div className="flex-1 -mt-1">
                                    <p className="font-medium text-sm">
                                        {eventText} by <span className="text-primary">{formatActorName(event.actor)}</span>
                                    </p>
                                    <p className="text-xs text-muted-foreground">{format(new Date(event.timestamp), "PPP p")}</p>
                                    {detailsText && <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">{detailsText}</p>}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}


function TrackingForm() {
  const [trackingId, setTrackingId] = useState('');
  const [isTracking, setIsTracking] = useState(false);
  const [searchResult, setSearchResult] = useState<Feedback | null>(null);
  const [notFound, setNotFound] = useState(false);
  const { toast } = useToast();
  
  const handleTrack = async () => {
    if (!trackingId) {
      toast({
        variant: 'destructive',
        title: 'Missing Tracking ID',
        description: 'Please enter the tracking ID you received upon submission.',
      });
      return;
    }
    setIsTracking(true);
    setSearchResult(null);
    setNotFound(false);
    try {
      const [foundCase] = await getFeedbackByIds([trackingId]);
      if (foundCase && foundCase.source === 'Voice – In Silence') {
        setSearchResult(foundCase);
      } else {
        setNotFound(true);
      }
    } catch (error) {
      console.error(error);
      setNotFound(true);
      toast({
        variant: 'destructive',
        title: 'Tracking Failed',
        description: 'There was an error tracking your submission. Please check the ID and try again.',
      });
    } finally {
      setIsTracking(false);
    }
  };

  const getStatusBadge = (status?: string) => {
    switch(status) {
        case 'Resolved': return <Badge variant='success'>Resolved</Badge>;
        case 'Closed': return <Badge variant='secondary'>Closed</Badge>;
        case 'In Progress': return <Badge variant='secondary'>In Progress</Badge>;
        case 'Pending Anonymous Reply': return <Badge variant='destructive'>Action Required</Badge>;
        case 'Pending Anonymous Acknowledgement': return <Badge variant='destructive'>Action Required</Badge>;
        default: return <Badge variant='default'>Open</Badge>;
    }
  }

  function ReplyWidget({ item }: { item: Feedback }) {
    const [reply, setReply] = useState('');
    const [isSubmittingReply, setIsSubmittingReply] = useState(false);
    
    const request = item.auditTrail?.find(e => e.event === 'Information Requested');
    if (!request) return null;

    const handleReply = async () => {
        if (!reply) return;
        setIsSubmittingReply(true);
        try {
            await submitAnonymousReply(item.trackingId, reply);
            toast({ title: "Reply Sent", description: "Your anonymous reply has been sent to the HR Head." });
            handleTrack(); // Re-fetch the case to show the updated status
        } catch (error) {
            toast({ variant: "destructive", title: "Reply Failed" });
        } finally {
            setIsSubmittingReply(false);
        }
    };

    return (
         <Card className="border-2 border-blue-500/50 bg-blue-500/5 rounded-lg mt-4">
            <CardHeader>
                <CardTitle className="text-lg text-blue-700 dark:text-blue-400">Action Required: The HR Head has requested more information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="p-3 bg-background/50 rounded-md border">
                    <p className="font-semibold text-foreground">HR Head's Question:</p>
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
                <Button onClick={handleReply} disabled={isSubmittingReply || !reply}>
                    {isSubmittingReply && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Submit Reply
                </Button>
            </CardContent>
         </Card>
    )
  }

  function FinalAcknowledgementWidget({ item }: { item: Feedback }) {
      const [isSubmitting, setIsSubmitting] = useState(false);
      const [escalationPath, setEscalationPath] = useState('');
      const [justification, setJustification] = useState('');
      const [isEscalateDialogOpen, setIsEscalateDialogOpen] = useState(false);

      const handleAccept = async () => {
          setIsSubmitting(true);
          try {
              await submitAnonymousAcknowledgement(item.trackingId, true, '', '');
              toast({ title: "Resolution Accepted", description: "This case is now closed." });
              handleTrack();
          } catch (error) {
              toast({ variant: "destructive", title: "Action Failed" });
          } finally {
              setIsSubmitting(false);
          }
      };

      const handleEscalateSubmit = async () => {
          if (!escalationPath || !justification) {
              toast({ variant: 'destructive', title: "Missing Information", description: "Please select an escalation path and provide a justification."});
              return;
          }
          setIsSubmitting(true);
          try {
              await submitAnonymousAcknowledgement(item.trackingId, false, escalationPath, justification);
              toast({ title: "Case Escalated", description: `Your final justification has been logged and the case is now closed.` });
              setIsEscalateDialogOpen(false);
              handleTrack();
          } catch (error) {
              toast({ variant: "destructive", title: "Action Failed" });
          } finally {
              setIsSubmitting(false);
          }
      }

      return (
          <>
            <Dialog open={isEscalateDialogOpen} onOpenChange={setIsEscalateDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Challenge & Escalate Resolution</DialogTitle>
                        <DialogDescription>
                            Please provide your final justification for challenging this outcome. This will be logged with the case before it is formally closed and routed.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="escalation-path">Escalate To</Label>
                            <Select onValueChange={setEscalationPath} value={escalationPath}>
                                <SelectTrigger id="escalation-path">
                                    <SelectValue placeholder="Select a final destination..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Ombudsman">Ombudsman</SelectItem>
                                    <SelectItem value="Grievance Office">Grievance Office</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                             <Label htmlFor="justification">Justification</Label>
                             <Textarea
                                id="justification"
                                value={justification}
                                onChange={(e) => setJustification(e.target.value)}
                                placeholder="Explain why you are challenging the resolution..."
                                rows={6}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <DialogClose asChild><Button variant="ghost">Cancel</Button></DialogClose>
                        <Button variant="destructive" onClick={handleEscalateSubmit} disabled={isSubmitting || !escalationPath || !justification}>
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Submit Final Justification
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Card className="border-2 border-blue-500/50 bg-blue-500/5 rounded-lg mt-4">
                <CardHeader>
                    <CardTitle className="text-lg text-blue-700 dark:text-blue-400">Action Required: A resolution has been provided by HR</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                     <div className="p-3 bg-background/50 rounded-md border">
                        <p className="font-semibold text-foreground">HR Head's Final Resolution:</p>
                        <p className="text-muted-foreground mt-1 whitespace-pre-wrap">{item.resolution}</p>
                    </div>
                    <p className="text-sm text-muted-foreground">
                        Please review the resolution. If you are satisfied, you can accept it to close the case. If not, you may challenge and escalate it, which will also close the case but log your dissatisfaction and final comments.
                    </p>
                    <div className="flex flex-wrap gap-2">
                         <Button variant="success" onClick={handleAccept} disabled={isSubmitting}>
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Accept Resolution
                        </Button>
                        <Button variant="destructive" onClick={() => setIsEscalateDialogOpen(true)} disabled={isSubmitting}>
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Challenge & Escalate
                        </Button>
                    </div>
                </CardContent>
            </Card>
          </>
      );
  }
  
  return (
     <CardContent className="space-y-6">
        <p className="text-muted-foreground text-center">
          Enter the tracking ID you received to check the status of your submission.
        </p>
        <div className="flex w-full items-center space-x-2">
          <Input 
            id="trackingId"
            placeholder="Enter your tracking ID"
            value={trackingId}
            onChange={(e) => setTrackingId(e.target.value)}
            disabled={isTracking}
          />
          <Button onClick={handleTrack} disabled={isTracking}>
            {isTracking ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Track"}
          </Button>
        </div>

        {isTracking && <Skeleton className="h-48 w-full" />}

        {searchResult && (
           <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                <span>Submission Status</span>
                {getStatusBadge(searchResult.status)}
              </CardTitle>
              <CardDescription>
                Submitted on {format(new Date(searchResult.submittedAt), "PPP p")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {searchResult.status === 'Pending Anonymous Reply' && <ReplyWidget item={searchResult} />}
              {searchResult.status === 'Pending Anonymous Acknowledgement' && <FinalAcknowledgementWidget item={searchResult} />}


               <div>
                  <Label>Assigned To</Label>
                  <p className="text-muted-foreground">
                    {searchResult.status === 'Resolved' || searchResult.status === 'Closed' ? 'Case Closed' : `Under review by ${searchResult.assignedTo && searchResult.assignedTo.length > 0 ? searchResult.assignedTo.join(', ') : 'HR Head'}`}
                  </p>
              </div>
              <div>
                <Label>Your Original Subject</Label>
                <p className="text-muted-foreground">{searchResult.subject}</p>
              </div>
              {searchResult.auditTrail && <PublicAuditTrail trail={searchResult.auditTrail} />}
              {searchResult.resolution && searchResult.status !== 'Pending Anonymous Acknowledgement' && (
                <div>
                  <Label>Final Resolution</Label>
                  <p className="text-muted-foreground whitespace-pre-wrap p-4 border rounded-md bg-muted/50">{searchResult.resolution}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {notFound && (
           <Alert variant="destructive" className="mt-6">
            <AlertTitle>Not Found</AlertTitle>
            <AlertDescription>
              No "Voice - in Silence" submission found with that Tracking ID. Please check the ID and try again.
            </AlertDescription>
          </Alert>
        )}

     </CardContent>
  )
}

export default function VoiceInSilenceSubmitPage() {
  const [submissionResult, setSubmissionResult] = useState<AnonymousFeedbackOutput | null>(null);
  const { toast } = useToast();

  const copyToClipboard = () => {
    if (submissionResult?.trackingId) {
      navigator.clipboard.writeText(submissionResult.trackingId);
      toast({
        title: 'Copied!',
        description: 'Tracking ID copied to clipboard.',
      });
    }
  };

  if (submissionResult) {
    return (
      <div className="flex flex-col min-h-screen items-center justify-center bg-background p-4">
        <Card className="w-full max-w-2xl">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold font-headline mb-2 text-foreground">
              ✅ Submission Received
            </CardTitle>
            <CardDescription className="italic text-lg">
              Thank you for speaking up.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground text-center">
              Your feedback has been submitted securely and anonymously. Please save the tracking ID below. You will need it to follow up on the status of your submission.
            </p>
            <Alert>
              <AlertTitle className="font-semibold">Your Tracking ID</AlertTitle>
              <AlertDescription className="flex items-center justify-between">
                <code className="text-sm font-mono">{submissionResult.trackingId}</code>
                <Button variant="ghost" size="icon" onClick={copyToClipboard}>
                  <Copy className="h-4 w-4" />
                </Button>
              </AlertDescription>
            </Alert>
            <p className="text-sm text-muted-foreground text-center pt-4">
              Keep this ID in a safe place. It is the only way to check for a response to your submission.
            </p>
          </CardContent>
          <CardFooter className="flex justify-center">
            <Button asChild>
              <Link href="/">
                Return to Home
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen items-center justify-center bg-background p-4">
      <div className="absolute top-4 left-4">
        <Button variant="ghost" asChild>
          <Link href="/">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Link>
        </Button>
      </div>
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold font-headline mb-2 text-foreground">
            🕊️ Voice – In Silence
          </CardTitle>
          <CardDescription className="italic text-lg">
            “Because speaking up should never feel unsafe.”
          </CardDescription>
        </CardHeader>
        <Tabs defaultValue="submit" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="submit">Submit Feedback</TabsTrigger>
                <TabsTrigger value="track">Track Submission</TabsTrigger>
            </TabsList>
            <TabsContent value="submit">
                <SubmissionForm onSubmitted={setSubmissionResult} />
            </TabsContent>
            <TabsContent value="track">
                <TrackingForm />
            </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
}


