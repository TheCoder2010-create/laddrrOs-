

"use client";

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Loader2, Copy, CheckCircle, Clock, Send, FileCheck, ChevronsRight, MessageSquare, Info, MessageCircleQuestion } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { submitAnonymousFeedback, AnonymousFeedbackOutput } from '@/services/feedback-service';
import { trackFeedback, TrackedFeedback, submitAnonymousReply } from '@/services/feedback-service';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { format, formatDistanceToNow } from 'date-fns';
import type { AuditEvent, Feedback } from '@/services/feedback-service';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { getFeedbackByIds } from '@/services/feedback-service';
import { Skeleton } from '@/components/ui/skeleton';


function SubmissionForm({ onSubmitted }: { onSubmitted: (result: AnonymousFeedbackOutput) => void }) {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

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
      const result = await submitAnonymousFeedback({ subject, message });
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
      <div className="space-y-2">
        <Label htmlFor="title">Subject</Label>
        <Input
          id="title"
          placeholder="Enter a subject for your feedback..."
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          disabled={isSubmitting}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="message">Your Message</Label>
        <Textarea
          id="message"
          placeholder="Describe the situation in detail..."
          rows={10}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          disabled={isSubmitting}
        />
      </div>
       <CardFooter className="flex justify-end">
        <Button onClick={handleSubmit} disabled={isSubmitting}>
          {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Submit Anonymously
        </Button>
      </CardFooter>
    </CardContent>
  );
}

const publicAuditEventIcons = {
    'Submitted': FileCheck,
    'AI Analysis Completed': ChevronsRight,
    'Assigned': Send,
    'Update Added': MessageSquare,
    'Resolved': CheckCircle,
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
                                        {eventText} by <span className="text-primary">{event.actor}</span>
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
        case 'In Progress': return <Badge variant='secondary'>In Progress</Badge>;
        case 'Pending Anonymous Reply': return <Badge variant='destructive'>Action Required</Badge>;
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

               <div>
                  <Label>Assigned To</Label>
                  <p className="text-muted-foreground">
                    {searchResult.status === 'Resolved' ? 'Case Closed' : `Under review by ${searchResult.assignedTo && searchResult.assignedTo.length > 0 ? searchResult.assignedTo.join(', ') : 'HR Head'}`}
                  </p>
              </div>
              <div>
                <Label>Your Original Subject</Label>
                <p className="text-muted-foreground">{searchResult.subject}</p>
              </div>
              {searchResult.auditTrail && <PublicAuditTrail trail={searchResult.auditTrail} />}
              {searchResult.resolution && (
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
