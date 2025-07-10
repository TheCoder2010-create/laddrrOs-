
"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { getAllFeedback, Feedback } from '@/services/feedback-service';
import { formatDistanceToNow } from 'date-fns';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Lock, ArrowLeft } from 'lucide-react';

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

function VaultContent() {
  const [allFeedback, setAllFeedback] = useState<Feedback[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchFeedback = async () => {
      try {
        const feedback = await getAllFeedback();
        setAllFeedback(feedback);
      } catch (error) {
        console.error("Failed to fetch feedback", error);
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchFeedback(); // Initial fetch
    const intervalId = setInterval(fetchFeedback, 5000); // Poll every 5 seconds

    return () => clearInterval(intervalId); // Cleanup on component unmount
  }, []);

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

  return (
    <div className="p-4 md:p-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl font-bold font-headline mb-2 text-foreground">
            🔒 Feedback Vault
          </CardTitle>
           <CardDescription className="text-lg text-muted-foreground italic">
            Confidential submissions from Voice – in Silence.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {allFeedback.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground text-lg">The vault is currently empty.</p>
              <p className="text-sm text-muted-foreground mt-2">
                New anonymous submissions will appear here.
              </p>
            </div>
          ) : (
            <Accordion type="single" collapsible className="w-full">
              {allFeedback.map((feedback) => (
                <AccordionItem value={feedback.trackingId} key={feedback.trackingId}>
                  <AccordionTrigger>
                    <div className="flex justify-between w-full pr-4">
                      <span className="font-medium">{feedback.subject}</span>
                      <span className="text-sm text-muted-foreground font-normal">
                        {formatDistanceToNow(feedback.submittedAt, { addSuffix: true })}
                      </span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4 pt-2">
                    <p className="whitespace-pre-wrap text-base text-muted-foreground">{feedback.message}</p>
                    <div className="text-xs text-muted-foreground/80">
                      Tracking ID: <code className="font-mono">{feedback.trackingId}</code>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </CardContent>
      </Card>
    </div>
  );
}


export default function VaultPage() {
    const [isUnlocked, setIsUnlocked] = useState(false);

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
          {!isUnlocked ? (
              <VaultLoginPage onUnlock={() => setIsUnlocked(true)} />
          ) : (
              <div className="pt-16">
                  <VaultContent />
              </div>
          )}
      </div>
    );
}
