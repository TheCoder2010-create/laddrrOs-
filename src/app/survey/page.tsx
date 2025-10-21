
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { getLatestActiveSurvey, submitSurveyResponse, type DeployedSurvey } from '@/services/survey-service';
import { FileQuestion, Send, CheckCircle, ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function SurveyPage() {
    const [survey, setSurvey] = useState<DeployedSurvey | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [responses, setResponses] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [submissionNumber, setSubmissionNumber] = useState<string | null>(null);
    const { toast } = useToast();

    useEffect(() => {
        const fetchSurvey = async () => {
            setIsLoading(true);
            const activeSurvey = await getLatestActiveSurvey();
            setSurvey(activeSurvey);
            setIsLoading(false);
        };
        fetchSurvey();
    }, []);

    const handleResponseChange = (questionId: string, value: string) => {
        setResponses(prev => ({ ...prev, [questionId]: value }));
    };

    const handleSubmit = async () => {
        if (!survey) return;

        const unansweredQuestions = survey.questions.filter(q => !responses[q.id!]);
        if (unansweredQuestions.length > 0) {
            toast({
                variant: 'destructive',
                title: 'Incomplete Survey',
                description: `Please answer all ${survey.questions.length} questions before submitting.`,
            });
            return;
        }

        setIsSubmitting(true);
        try {
            await submitSurveyResponse(survey.id);
            
            // Generate a memorable 6-digit number (e.g., 123-456)
            const num = Math.floor(100000 + Math.random() * 900000).toString();
            const memorableNumber = `${num.substring(0, 3)}-${num.substring(3)}`;
            setSubmissionNumber(memorableNumber);
            
            setIsSubmitted(true);
            toast({
                variant: 'success',
                title: 'Survey Submitted',
                description: 'Thank you for your anonymous feedback.',
            });
        } catch (error) {
            console.error("Failed to submit survey", error);
            toast({ variant: 'destructive', title: "Submission Failed" });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex h-screen w-screen items-center justify-center p-4 bg-muted">
                <Skeleton className="h-96 w-full max-w-2xl" />
            </div>
        );
    }
    
    if (isSubmitted) {
        return (
             <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
                 <Card className="w-full max-w-2xl text-center">
                    <CardHeader>
                        <CheckCircle className="mx-auto h-16 w-16 text-green-500 mb-4" />
                        <CardTitle className="text-2xl">Thank You!</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-muted-foreground">Your anonymous response has been submitted successfully.</p>
                        {submissionNumber && (
                            <div className="p-4 bg-muted border rounded-lg">
                                <p className="text-sm text-muted-foreground">Your Submission Number:</p>
                                <p className="text-2xl font-bold font-mono tracking-widest text-primary">{submissionNumber}</p>
                                <p className="text-xs text-muted-foreground mt-2">Please save this number for your records if you need to reference this submission.</p>
                            </div>
                        )}
                    </CardContent>
                    <CardFooter className="justify-center">
                        <Button asChild variant="outline">
                            <Link href="/">
                                <ArrowLeft className="mr-2 h-4 w-4" /> Go Back
                            </Link>
                        </Button>
                    </CardFooter>
                 </Card>
            </div>
        );
    }

    if (!survey) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
                 <Card className="w-full max-w-2xl text-center">
                    <CardHeader>
                        <FileQuestion className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
                        <CardTitle>No Active Survey</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground">There are currently no active surveys available. Please check back later.</p>
                    </CardContent>
                     <CardFooter className="justify-center">
                        <Button asChild variant="outline">
                            <Link href="/">
                                <ArrowLeft className="mr-2 h-4 w-4" /> Go Back
                            </Link>
                        </Button>
                    </CardFooter>
                 </Card>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
            <Card className="w-full max-w-2xl">
                <CardHeader>
                    <CardTitle className="text-2xl">Anonymous Survey</CardTitle>
                    <CardDescription>{survey.objective}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {survey.questions.map((q, index) => (
                        <div key={q.id} className="space-y-2">
                            <Label htmlFor={q.id} className="font-semibold">
                                Question {index + 1}
                            </Label>
                            <p className="text-sm text-foreground">{q.questionText}</p>
                            <Textarea
                                id={q.id}
                                placeholder="Your anonymous response..."
                                value={responses[q.id!] || ''}
                                onChange={(e) => handleResponseChange(q.id!, e.target.value)}
                                rows={3}
                            />
                        </div>
                    ))}
                </CardContent>
                <CardFooter className="flex justify-between">
                     <Button asChild variant="outline">
                        <Link href="/">
                            <ArrowLeft className="mr-2 h-4 w-4" /> Cancel
                        </Link>
                    </Button>
                    <Button onClick={handleSubmit} disabled={isSubmitting}>
                        {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                        Submit Anonymously
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}
