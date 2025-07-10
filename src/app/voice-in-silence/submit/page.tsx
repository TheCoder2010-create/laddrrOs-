
"use client";

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Loader2, Copy, CheckCircle, Clock, Send, FileCheck, ChevronsRight, MessageSquare } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { submitAnonymousFeedback, AnonymousFeedbackOutput } from '@/services/feedback-service';
import { trackFeedback, TrackedFeedback } from '@/services/feedback-service';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { format, formatDistanceToNow } from 'date-fns';
import type { AuditEvent } from '@/services/feedback-service';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';


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
          placeholder="e.g., Feedback on Project Phoenix, Concerns about team dynamics"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          disabled={isSubmitting}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="message">Your Message</Label>
        <Textarea
          id="message"
          placeholder="Please describe the situation, event, or feedback in detail. Include dates, times, and specific examples if possible. Do not include any personal identifying information."
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
    'default': Clock,
}

function PublicAuditTrail({ trail }: { trail: AuditEvent[] }) {
    if (!trail || trail.length === 0) return null;

    return (
        <div className="space-y-2">
            <Label>Case History</Label>
            <div className="p-4 border rounded-md bg-muted/50 space-y-4">
                {trail.map((event, index) => {
                    const Icon = publicAuditEventIcons[event.event as keyof typeof publicAuditEventIcons] || publicAuditEventIcons.default;
                    let eventText = event.event;
                    if (event.event === 'Assigned') {
                        eventText = 'Case assigned for review';
                    } else if (event.event === 'Update Added') {
                        eventText = 'An update was added to the case';
                    }

                    return (
                        <div key={index} className="flex items-start gap-3">
                            <Icon className="h-5 w-5 mt-0.5 text-muted-foreground" />
                            <div className="flex-1">
                                <p className="font-medium text-sm">
                                    {eventText}
                                </p>
                                <p className="text-xs text-muted-foreground">{format(new Date(event.timestamp), "PPP p")}</p>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}


function TrackingForm() {
  const [trackingId, setTrackingId] = useState('');
  const [isTracking, setIsTracking] = useState(false);
  const [searchResult, setSearchResult] = useState<TrackedFeedback | null>(null);
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
      const result = await trackFeedback({ trackingId });
      if (result.found && result.feedback) {
        setSearchResult(result.feedback);
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

  const getStatusVariant = (status?: string) => {
    switch(status) {
        case 'Resolved': return 'success';
        case 'In Progress': return 'secondary';
        default: return 'default';
    }
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

        {searchResult && (
           <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                <span>Submission Status</span>
                <Badge variant={getStatusVariant(searchResult.status)}>{searchResult.status || 'Open'}</Badge>
              </CardTitle>
              <CardDescription>
                Submitted on {format(new Date(searchResult.submittedAt), "PPP p")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
               <div>
                  <Label>Assigned To</Label>
                  <p className="text-muted-foreground">
                    {searchResult.status === 'Resolved' ? 'Case Closed' : `Under review by ${searchResult.assignedTo || 'HR Head'}`}
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
              No submission found with that Tracking ID. Please check the ID and try again.
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
