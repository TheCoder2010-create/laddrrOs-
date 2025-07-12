
"use client";

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { submitIdentifiedConcern, IdentifiedConcernInput } from '@/services/feedback-service';
import { Skeleton } from '@/components/ui/skeleton';
import { ShieldQuestion, Send, Loader2, User, UserX } from 'lucide-react';
import { useRole } from '@/hooks/use-role';
import DashboardLayout from '@/components/dashboard-layout';
import { roleUserMapping } from '@/lib/role-mapping';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from 'next/link';


function RaiseConcernForm() {
    const { role, setRole } = useRole();
    const { toast } = useToast();
    const [subject, setSubject] = useState('');
    const [concern, setConcern] = useState('');
    const [criticality, setCriticality] = useState<'Low' | 'Medium' | 'High' | 'Critical'>('Medium');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!subject || !concern || !role) {
            toast({ variant: 'destructive', title: "Missing Information", description: "Please fill out all fields."});
            return;
        }

        setIsSubmitting(true);
        try {
            const submitter = roleUserMapping[role];
            const input: IdentifiedConcernInput = {
                submittedBy: submitter.name,
                submittedByRole: submitter.role,
                subject,
                message: concern,
                criticality,
            }
            await submitIdentifiedConcern(input);
            toast({ title: "Concern Submitted", description: "Your concern has been confidentially routed to HR." });
            setSubject('');
            setConcern('');
            setCriticality('Medium');
        } catch (error) {
            toast({ variant: 'destructive', title: "Submission Failed", description: "Could not submit your concern."});
            console.error(error);
        } finally {
            setIsSubmitting(false);
        }
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

function MyConcernsContent() {
  const { setRole } = useRole();

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
            <Tabs defaultValue="identity-revealed">
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
                    <RaiseConcernForm />
                </TabsContent>
                <TabsContent value="anonymous">
                    <div className="text-center py-8 px-4 space-y-4">
                        <h3 className="text-xl font-semibold">For Full Anonymity</h3>
                        <p className="text-muted-foreground">
                            To ensure your submission is completely anonymous, we need to make sure you are logged out. Please use the "Voice – in Silence" feature available from the main login screen.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-2 justify-center">
                            <Button onClick={() => setRole(null)}>
                                Log Out and Go to Anonymous Form
                            </Button>
                             <Button variant="outline" asChild>
                                <Link href="/voice-in-silence">
                                    Learn More About Anonymity
                                </Link>
                            </Button>
                        </div>
                    </div>
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
