
"use client";

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getFeedbackById, submitEmployeeAcknowledgement, Feedback } from '@/services/feedback-service';
import { useRole } from '@/hooks/use-role';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Send, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';

export default function AcknowledgePage() {
    const { trackingId } = useParams();
    const router = useRouter();
    const { toast } = useToast();
    const { role, isLoading: isRoleLoading } = useRole();
    const [feedbackItem, setFeedbackItem] = useState<Feedback | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [acknowledgement, setAcknowledgement] = useState<'yes' | 'no' | null>(null);
    const [justification, setJustification] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const fetchFeedback = useCallback(async () => {
        if (!trackingId || typeof trackingId !== 'string') return;
        setIsLoading(true);
        try {
            // Note: In a real app, you'd fetch by trackingId, not oneOnOneId
            const item = await getFeedbackById(trackingId);
            setFeedbackItem(item);
        } catch (error) {
            console.error("Failed to fetch feedback", error);
            toast({ variant: 'destructive', title: 'Error', description: 'Could not load the feedback item.' });
        } finally {
            setIsLoading(false);
        }
    }, [trackingId, toast]);

    useEffect(() => {
        fetchFeedback();
    }, [fetchFeedback]);

    const handleSubmit = async () => {
        if (!acknowledgement || !justification) {
            toast({ variant: 'destructive', title: 'Missing Information', description: 'Please make a selection and provide a justification.' });
            return;
        }
        if (!feedbackItem || !role) return;

        setIsSubmitting(true);
        try {
            await submitEmployeeAcknowledgement(feedbackItem.trackingId, role, acknowledgement === 'yes', justification);
            toast({ title: 'Acknowledgement Submitted', description: 'Thank you for your feedback. The case has been updated.' });
            router.push('/action-items');
        } catch (error) {
            console.error(error);
            toast({ variant: 'destructive', title: 'Submission Failed', description: 'Could not submit your acknowledgement. Please try again.' });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading || isRoleLoading) {
        return (
            <div className="flex h-screen w-screen items-center justify-center p-4">
                <Skeleton className="h-96 w-full max-w-2xl" />
            </div>
        );
    }
    
    if (!feedbackItem) {
        return (
            <div className="flex h-screen w-screen items-center justify-center p-4">
                <Card className="w-full max-w-2xl text-center">
                    <CardHeader>
                        <CardTitle>Item Not Found</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p>The feedback item you are looking for could not be found.</p>
                    </CardContent>
                    <CardFooter>
                         <Button asChild variant="outline">
                            <Link href="/action-items">
                                <ArrowLeft className="mr-2 h-4 w-4" /> Go Back
                            </Link>
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        )
    }
    
    // Authorization check
    if (role !== feedbackItem.employee) {
         return (
            <div className="flex h-screen w-screen items-center justify-center p-4">
                <Card className="w-full max-w-2xl text-center">
                    <CardHeader>
                        <CardTitle>Access Denied</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p>You do not have permission to acknowledge this item.</p>
                    </CardContent>
                     <CardFooter className="flex justify-center">
                         <Button asChild variant="outline">
                            <Link href="/">
                                <ArrowLeft className="mr-2 h-4 w-4" /> Go to Dashboard
                            </Link>
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        )
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
             <Card className="w-full max-w-2xl">
                <CardHeader>
                    <CardTitle>Acknowledge Resolution</CardTitle>
                    <CardDescription>Review your supervisor's response and confirm if the issue has been addressed to your satisfaction.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div>
                        <Label className="font-semibold">Original Concern</Label>
                        <p className="text-muted-foreground text-sm mt-1">{feedbackItem.subject}</p>
                    </div>
                     <div>
                        <Label className="font-semibold">Supervisor's Response</Label>
                        <blockquote className="mt-1 p-4 bg-muted/50 border-l-4 rounded-md whitespace-pre-wrap">{feedbackItem.supervisorUpdate}</blockquote>
                    </div>
                    <div className="space-y-3">
                        <Label htmlFor="acknowledgement" className="font-semibold">Is this concern now resolved?</Label>
                        <RadioGroup 
                            id="acknowledgement"
                            onValueChange={(value: 'yes' | 'no') => setAcknowledgement(value)}
                            className="flex gap-4"
                        >
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="yes" id="yes" />
                                <Label htmlFor="yes">Yes, this is resolved.</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="no" id="no" />
                                <Label htmlFor="no">No, I still have concerns.</Label>
                            </div>
                        </RadioGroup>
                    </div>
                    <div className="space-y-2">
                         <Label htmlFor="justification" className="font-semibold">Please explain your choice</Label>
                         <Textarea
                            id="justification"
                            placeholder="e.g., 'The plan my supervisor proposed is fair and addresses my original point.' OR 'I appreciate the response, but the core issue about X has not been addressed...'"
                            value={justification}
                            onChange={(e) => setJustification(e.target.value)}
                            rows={4}
                         />
                    </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                     <Button asChild variant="outline">
                        <Link href="/action-items">
                            <ArrowLeft className="mr-2 h-4 w-4" /> Cancel
                        </Link>
                    </Button>
                    <Button onClick={handleSubmit} disabled={isSubmitting || !acknowledgement || !justification}>
                        {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                        Submit Acknowledgement
                    </Button>
                </CardFooter>
             </Card>
        </div>
    )
}

    