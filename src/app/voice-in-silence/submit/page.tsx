
"use client";

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft } from 'lucide-react';

export default function VoiceInSilenceSubmitPage() {
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
                <Input id="title" placeholder="e.g., Feedback on Project Phoenix, Concerns about team dynamics" />
            </div>
            <div className="space-y-2">
                <Label htmlFor="message">Your Message</Label>
                <Textarea 
                    id="message" 
                    placeholder="Please describe the situation, event, or feedback in detail. Include dates, times, and specific examples if possible. Do not include any personal identifying information."
                    rows={10}
                />
            </div>
        </CardContent>
        <CardFooter className="flex justify-end">
            <Button>Submit Anonymously</Button>
        </CardFooter>
      </Card>
    </div>
  );
}
