
"use client";

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Loader2, Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { submitAnonymousFeedback } from '@/ai/flows/submit-anonymous-feedback-flow';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

function triggerDataRefresh() {
  // This is a simple way to signal other tabs/components to refresh.
  // We write a random value to ensure a "change" event is fired.
  localStorage.setItem('data-refresh-key', Date.now().toString());
}

export default function VoiceInSilenceSubmitPage() {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<{ trackingId: string } | null>(null);
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
      setSubmissionResult(result);
      triggerDataRefresh(); // Signal that data has changed
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
        </CardContent>
        <CardFooter className="flex justify-end">
            <Button onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Submit Anonymously
            </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
