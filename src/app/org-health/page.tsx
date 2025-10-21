
"use client";

import { useState, useTransition, useCallback, useEffect } from 'react';
import { useRole } from '@/hooks/use-role';
import DashboardLayout from '@/components/dashboard-layout';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { HeartPulse, Check, Loader2, Plus, Wand2, Info, Send, ListChecks, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { generateSurveyQuestions } from '@/ai/flows/generate-survey-questions-flow';
import type { SurveyQuestion, DeployedSurvey } from '@/ai/schemas/survey-schemas';
import { deploySurvey, getActiveSurveys } from '@/services/survey-service';
import { v4 as uuidv4 } from 'uuid';
import { format, formatDistanceToNow } from 'date-fns';

function CreateSurveyWizard() {
  const [objective, setObjective] = useState('');
  const [suggestedQuestions, setSuggestedQuestions] = useState<SurveyQuestion[]>([]);
  const [selectedQuestions, setSelectedQuestions] = useState<Record<string, boolean>>({});
  const [customQuestion, setCustomQuestion] = useState('');
  const [isGenerating, startGeneration] = useTransition();
  const { toast } = useToast();

  const handleGenerateQuestions = () => {
    if (!objective.trim()) {
      toast({ variant: 'destructive', title: "Objective is required", description: "Please describe the goal of your survey." });
      return;
    }

    startGeneration(async () => {
      try {
        const result = await generateSurveyQuestions({ objective });
        const questionsWithIds = result.questions.map(q => ({ ...q, id: uuidv4() }));
        setSuggestedQuestions(questionsWithIds);
        // Pre-select all suggested questions by default
        const initialSelection = questionsWithIds.reduce((acc, q) => {
          if (q.id) acc[q.id] = true;
          return acc;
        }, {} as Record<string, boolean>);
        setSelectedQuestions(initialSelection);
      } catch (e) {
        console.error("Failed to generate questions", e);
        toast({ variant: 'destructive', title: "Generation Failed", description: "Could not get AI suggestions at this time." });
      }
    });
  };

  const handleAddCustomQuestion = () => {
    if (!customQuestion.trim()) return;
    const newQuestion: SurveyQuestion = {
      id: uuidv4(),
      questionText: customQuestion,
      reasoning: 'Custom question added by HR Head.',
      isCustom: true,
    };
    setSuggestedQuestions(prev => [...prev, newQuestion]);
    setSelectedQuestions(prev => ({ ...prev, [newQuestion.id!]: true }));
    setCustomQuestion('');
  };

  const handleDeploySurvey = async () => {
    const finalQuestions = suggestedQuestions.filter(q => selectedQuestions[q.id!]);
    if (finalQuestions.length === 0) {
        toast({ variant: 'destructive', title: "No questions selected", description: "Please select at least one question for the survey." });
        return;
    }
    
    await deploySurvey({
        objective,
        questions: finalQuestions,
    });

    // Set a flag in sessionStorage to indicate an active survey exists
    sessionStorage.setItem('active_survey_exists', 'true');
    
    toast({ variant: 'success', title: "Survey Deployed!", description: "Your anonymous survey is now active."});
    
    // Reset state
    setObjective('');
    setSuggestedQuestions([]);
    setSelectedQuestions({});
  };
  
  const allQuestionsSelected = suggestedQuestions.length > 0 && suggestedQuestions.every(q => selectedQuestions[q.id!]);
  const handleSelectAll = () => {
      const newSelection: Record<string, boolean> = {};
      suggestedQuestions.forEach(q => {
          newSelection[q.id!] = !allQuestionsSelected;
      });
      setSelectedQuestions(newSelection);
  }

  return (
    <div className="space-y-6">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Create New Anonymous Survey</CardTitle>
          <CardDescription>Describe your objective, and let Laddrr AI help you build an effective survey to check the health of your organization.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="survey-objective" className="text-base font-semibold">Step 1: Define Survey Objective</Label>
            <Textarea
              id="survey-objective"
              placeholder="e.g., 'Check employee morale after the recent re-organization' or 'Assess team sentiment regarding work-life balance.'"
              value={objective}
              onChange={(e) => setObjective(e.target.value)}
              rows={3}
            />
          </div>
          <Button onClick={handleGenerateQuestions} disabled={isGenerating}>
            {isGenerating ? <Loader2 className="mr-2 animate-spin" /> : <Wand2 className="mr-2" />}
            Generate Question Suggestions
          </Button>
        </CardContent>
      </Card>
      
      {(isGenerating || suggestedQuestions.length > 0) && (
        <Card>
           <CardHeader>
            <CardTitle>Step 2: Curate and Add Questions</CardTitle>
            <CardDescription>Select the AI-suggested questions and add your own to finalize the survey.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {isGenerating ? <Skeleton className="h-40 w-full" /> : (
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                    <Checkbox id="select-all" checked={allQuestionsSelected} onCheckedChange={handleSelectAll} />
                    <Label htmlFor="select-all" className="font-semibold">Select All</Label>
                </div>
                {suggestedQuestions.map((q) => (
                  <div key={q.id} className="flex items-start gap-4 p-3 border rounded-lg bg-muted/50">
                    <Checkbox
                      id={q.id}
                      checked={!!selectedQuestions[q.id!]}
                      onCheckedChange={(checked) => {
                        setSelectedQuestions(prev => ({ ...prev, [q.id!]: !!checked }));
                      }}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <Label htmlFor={q.id} className="font-medium">{q.questionText}</Label>
                      <p className="text-xs text-muted-foreground flex items-start gap-1.5 mt-1">
                        <Info className="h-3 w-3 mt-0.5 flex-shrink-0" />
                        <span>{q.reasoning}</span>
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
             <div className="space-y-2 pt-4 border-t">
                <Label htmlFor="custom-question">Add a Custom Question</Label>
                <div className="flex items-center gap-2">
                    <Input 
                        id="custom-question" 
                        placeholder="Type your own question here" 
                        value={customQuestion}
                        onChange={(e) => setCustomQuestion(e.target.value)}
                    />
                    <Button variant="outline" onClick={handleAddCustomQuestion} disabled={!customQuestion.trim()}>
                        <Plus className="mr-2"/> Add
                    </Button>
                </div>
             </div>
          </CardContent>
          <CardFooter>
            <Button size="lg" onClick={handleDeploySurvey} disabled={suggestedQuestions.filter(q => selectedQuestions[q.id!]).length === 0}>
                <Send className="mr-2"/> Deploy Survey
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  )
}

function ActiveSurveys() {
    const [surveys, setSurveys] = useState<DeployedSurvey[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchSurveys = useCallback(async () => {
        setIsLoading(true);
        const activeSurveys = await getActiveSurveys();
        setSurveys(activeSurveys);
        setIsLoading(false);
    }, []);

    useEffect(() => {
        fetchSurveys();
        const handleStorageChange = () => fetchSurveys();
        window.addEventListener('storage', handleStorageChange);
        window.addEventListener('feedbackUpdated', handleStorageChange);
        return () => {
            window.removeEventListener('storage', handleStorageChange);
            window.removeEventListener('feedbackUpdated', handleStorageChange);
        };
    }, [fetchSurveys]);

    if (isLoading) {
        return <Skeleton className="h-32 w-full" />;
    }
    
    if (surveys.length === 0) {
        return null;
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <ListChecks /> Active Surveys
                </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {surveys.map(survey => (
                    <Card key={survey.id} className="bg-card-foreground/5">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-lg">{survey.objective}</CardTitle>
                            <CardDescription>
                                Deployed {formatDistanceToNow(new Date(survey.deployedAt), { addSuffix: true })}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1.5">
                                <Activity />
                                <span className="font-semibold text-foreground">{survey.submissionCount}</span> Submissions
                            </div>
                            <div className="flex items-center gap-1.5">
                                <ListChecks />
                                <span className="font-semibold text-foreground">{survey.questions.length}</span> Questions
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button variant="secondary" size="sm">View Results</Button>
                        </CardFooter>
                    </Card>
                ))}
            </CardContent>
        </Card>
    );
}

function OrgHealthContent() {
  return (
    <div className="p-4 md:p-8 space-y-8">
        <div className="flex justify-between items-start">
            <div className="space-y-1">
                <h1 className="text-3xl font-bold font-headline flex items-center gap-3">
                    <HeartPulse className="h-8 w-8 text-primary" />
                    Org Health
                </h1>
                <p className="text-muted-foreground max-w-2xl">
                    Deploy anonymous surveys to gauge employee morale, gather feedback on initiatives, and proactively monitor the health of your organization.
                </p>
            </div>
        </div>
        
        <ActiveSurveys />
        
        <CreateSurveyWizard />
    </div>
  );
}


export default function OrgHealthPage() {
  const { role, setRole, isLoading } = useRole();

  if (isLoading || !role) {
    return (
      <DashboardLayout role="HR Head" onSwitchRole={() => {}}>
        <Skeleton className="w-full h-screen" />
      </DashboardLayout>
    );
  }

  if (role !== 'HR Head') {
    return (
      <DashboardLayout role={role} onSwitchRole={setRole}>
        <div className="p-8 text-center">
            <h1 className="text-2xl font-bold">Access Denied</h1>
            <p className="text-muted-foreground mt-2">This page is only available for the HR Head role.</p>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout role={role} onSwitchRole={setRole}>
      <OrgHealthContent />
    </DashboardLayout>
  );
}
