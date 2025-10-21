

"use client";

import { useState, useTransition, useCallback, useEffect } from 'react';
import { useRole } from '@/hooks/use-role';
import DashboardLayout from '@/components/dashboard-layout';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { HeartPulse, Check, Loader2, Plus, Wand2, Info, Send, ListChecks, Activity, Bot, MessageSquare, Eye, XCircle, Download, UserX, Users, Edit, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { generateSurveyQuestions } from '@/ai/flows/generate-survey-questions-flow';
import { summarizeSurveyResults, type SummarizeSurveyResultsOutput } from '@/ai/flows/summarize-survey-results-flow';
import { generateLeadershipPulse } from '@/ai/flows/generate-leadership-pulse-flow';
import type { GenerateLeadershipPulseOutput, LeadershipQuestion } from '@/ai/schemas/leadership-pulse-schemas';
import type { SurveyQuestion, DeployedSurvey } from '@/ai/schemas/survey-schemas';
import { deploySurvey, getAllSurveys, closeSurvey, sendLeadershipPulse } from '@/services/survey-service';
import { v4 as uuidv4 } from 'uuid';
import { format, formatDistanceToNow } from 'date-fns';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';


function CreateSurveyWizard({ onSurveyDeployed }: { onSurveyDeployed: () => void }) {
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
    
    toast({ variant: 'success', title: "Survey Deployed!", description: "Your anonymous survey is now active."});
    
    // Reset state and notify parent
    setObjective('');
    setSuggestedQuestions([]);
    setSelectedQuestions({});
    onSurveyDeployed();
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

const mockResponses: Record<string, string>[] = [
    {
        'q1': "I feel like my work isn't valued.",
        'q2': "Rarely, maybe once a month.",
        'q3': "More transparency about company direction.",
    },
    {
        'q1': "The work is interesting, but the deadlines are stressful.",
        'q2': "My manager gives good feedback weekly.",
        'q3': "Better work-life balance would be great.",
    },
    {
        'q1': "I enjoy my team, but the overall company morale seems low.",
        'q2': "Almost never. I usually hear about my performance during the quarterly review.",
        'q3': "Clearer communication from leadership.",
    },
    {
        'q1': "It feels like we're always in a state of chaos after the re-org.",
        'q2': "I get regular feedback, which I appreciate.",
        'q3': "I just want to know if my job is secure.",
    },
];

function LeadershipPulseDialog({ open, onOpenChange, summary, surveyObjective }: { open: boolean, onOpenChange: (open: boolean) => void, summary: SummarizeSurveyResultsOutput | null, surveyObjective: string }) {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [pulseData, setPulseData] = useState<GenerateLeadershipPulseOutput | null>(null);
    const [customQuestions, setCustomQuestions] = useState<Record<string, string>>({});
    const [isGeneratingTargeted, setIsGeneratingTargeted] = useState(false);
    const [targetedQuestionInput, setTargetedQuestionInput] = useState('');

    const { toast } = useToast();

    useEffect(() => {
        if (open && summary && !pulseData) {
            setIsLoading(true);
            setError(null);
            generateLeadershipPulse({ anonymousSurveySummary: summary, surveyObjective })
                .then(result => {
                    setPulseData(result);
                })
                .catch(err => {
                    console.error("Failed to generate leadership pulse", err);
                    setError("Could not generate leadership questions at this time.");
                })
                .finally(() => setIsLoading(false));
        } else if (!open) {
            // Reset when dialog is closed
            setPulseData(null);
            setCustomQuestions({});
            setTargetedQuestionInput('');
        }
    }, [open, summary, surveyObjective, pulseData]);
    
    const handleAddCustomQuestion = (role: 'teamLeadQuestions' | 'amQuestions' | 'managerQuestions') => {
        const questionText = customQuestions[role];
        if (!questionText || !pulseData) return;

        const newQuestion: LeadershipQuestion = {
            id: uuidv4(),
            questionText,
            reasoning: 'Custom question added by HR Head.',
            type: 'free-text', // Default type for custom questions
        };

        setPulseData(prev => {
            if (!prev) return null;
            return {
                ...prev,
                [role]: [...prev[role], newQuestion]
            }
        });
        
        setCustomQuestions(prev => ({ ...prev, [role]: '' }));
    };
    
    const handleGenerateTargetedQuestion = async (roleKey: 'teamLeadQuestions' | 'amQuestions' | 'managerQuestions') => {
        if (!targetedQuestionInput) {
            toast({ variant: 'destructive', title: "Input required", description: "Please provide a metric or insight to generate a question." });
            return;
        }
        setIsGeneratingTargeted(true);
        try {
            const result = await generateSurveyQuestions({ objective: targetedQuestionInput });
            if (result.questions.length > 0) {
                const newQuestion: LeadershipQuestion = { ...result.questions[0], id: uuidv4(), type: 'free-text' };
                 setPulseData(prev => {
                    if (!prev) return null;
                    return {
                        ...prev,
                        [roleKey]: [...prev[roleKey], newQuestion]
                    }
                });
                setTargetedQuestionInput('');
                toast({ title: "Question Generated", description: "A new targeted question has been added to the list." });
            } else {
                throw new Error("AI did not return a question.");
            }
        } catch (e) {
            console.error("Failed to generate targeted question", e);
            toast({ variant: 'destructive', title: "Generation Failed" });
        } finally {
            setIsGeneratingTargeted(false);
        }
    };

    const handleSendToLeaders = async () => {
        if (!pulseData) return;
        setIsLoading(true);
        try {
            await sendLeadershipPulse({
                objective: `Follow-up on: ${surveyObjective}`,
                questions: {
                    'Team Lead': pulseData.teamLeadQuestions,
                    'AM': pulseData.amQuestions,
                    'Manager': pulseData.managerQuestions
                }
            });
            toast({ title: "Leadership Pulse Sent", description: "Leaders have been notified in their Messages." });
            onOpenChange(false);
        } catch (e) {
            toast({ variant: 'destructive', title: "Failed to send", description: "Could not send the leadership pulse." });
        } finally {
            setIsLoading(false);
        }
    };
    
    const renderQuestionList = (questions: LeadershipQuestion[], roleKey: 'teamLeadQuestions' | 'amQuestions' | 'managerQuestions') => (
        <div className="py-4 max-h-[50vh] overflow-y-auto pr-4 space-y-4">
            {questions.map((q, index) => (
                <div key={q.id} className="space-y-2">
                     <Label className="flex items-center gap-2">
                        {q.reasoning === 'Custom question added by HR Head.' ? <UserPlus className="h-4 w-4 text-primary"/> : <Bot className="h-4 w-4 text-muted-foreground"/>}
                        Question {index + 1}
                    </Label>
                    <div className="flex items-center gap-2">
                        <Textarea defaultValue={q.questionText} />
                        <Button variant="ghost" size="icon"><Edit className="h-4 w-4"/></Button>
                    </div>
                    {q.reasoning !== 'Custom question added by HR Head.' && (
                        <p className="text-xs text-muted-foreground flex items-start gap-1.5 mt-1">
                            <Info className="h-3 w-3 mt-0.5 flex-shrink-0" />
                            <span>AI Rationale: {q.reasoning}</span>
                        </p>
                    )}
                </div>
            ))}
             <div className="space-y-4 pt-4 border-t">
                <div className="space-y-2">
                    <Label htmlFor={`targeted-q-${roleKey}`} className="font-semibold">Generate a question from a specific insight</Label>
                    <Textarea
                        id={`targeted-q-${roleKey}`}
                        placeholder="e.g., 'Low sentiment around work-life balance' or 'Scores for leadership clarity are down 15%'"
                        value={targetedQuestionInput}
                        onChange={(e) => setTargetedQuestionInput(e.target.value)}
                        rows={2}
                    />
                     <Button variant="secondary" size="sm" onClick={() => handleGenerateTargetedQuestion(roleKey)} disabled={isGeneratingTargeted}>
                        {isGeneratingTargeted ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Wand2 className="mr-2 h-4 w-4"/>}
                        Generate
                    </Button>
                </div>
                 <div className="space-y-2">
                    <Label htmlFor={`custom-q-${roleKey}`}>Or add a custom question</Label>
                    <div className="flex items-center gap-2">
                        <Textarea
                            id={`custom-q-${roleKey}`}
                            placeholder="Type your question here..."
                            value={customQuestions[roleKey] || ''}
                            onChange={(e) => setCustomQuestions(prev => ({ ...prev, [roleKey]: e.target.value }))}
                            rows={2}
                        />
                        <Button variant="outline" size="icon" onClick={() => handleAddCustomQuestion(roleKey)} disabled={!customQuestions[roleKey]}>
                            <Plus />
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2"><Users className="text-primary"/> Generate Leadership Pulse Survey</DialogTitle>
                    <DialogDescription>
                        AI has generated role-specific questions for leadership based on the anonymous feedback. Review, edit, and send.
                    </DialogDescription>
                </DialogHeader>
                 {isLoading && <div className="flex justify-center items-center h-40"><Loader2 className="animate-spin" /></div>}
                 {error && <Alert variant="destructive"><AlertTitle>Error</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>}
                 {pulseData && (
                    <Tabs defaultValue="team-lead" className="w-full">
                        <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="team-lead">Team Lead</TabsTrigger>
                            <TabsTrigger value="am">AM</TabsTrigger>
                            <TabsTrigger value="manager">Manager</TabsTrigger>
                        </TabsList>
                        <TabsContent value="team-lead">
                            {renderQuestionList(pulseData.teamLeadQuestions, 'teamLeadQuestions')}
                        </TabsContent>
                         <TabsContent value="am">
                            {renderQuestionList(pulseData.amQuestions, 'amQuestions')}
                        </TabsContent>
                         <TabsContent value="manager">
                            {renderQuestionList(pulseData.managerQuestions, 'managerQuestions')}
                        </TabsContent>
                    </Tabs>
                 )}
                <DialogFooter>
                    <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handleSendToLeaders} disabled={isLoading || !pulseData}>
                        {isLoading && <Loader2 className="mr-2 animate-spin"/>}
                        Send to Leaders
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

function SurveyResults({ survey }: { survey: DeployedSurvey }) {
    const [summary, setSummary] = useState<SummarizeSurveyResultsOutput | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isLeadershipPulseDialogOpen, setIsLeadershipPulseDialogOpen] = useState(false);

    const handleAnalyze = () => {
        setIsLoading(true);
        setError(null);
        // Flatten responses for the AI summary
        const flatResponses = mockResponses.flatMap(res => Object.values(res));
        summarizeSurveyResults({ surveyObjective: survey.objective, anonymousResponses: flatResponses })
            .then(setSummary)
            .catch(err => {
                console.error("Failed to summarize results", err);
                setError("Could not generate an AI summary at this time.");
            })
            .finally(() => setIsLoading(false));
    }
    
    const handleDownloadCsv = () => {
        const headers = survey.questions.map(q => `"${q.questionText.replace(/"/g, '""')}"`).join(',');
        const rows = mockResponses.map(response => {
            return survey.questions.map((q, qIndex) => {
                // The mock data keys are 'q1', 'q2', etc.
                const questionKey = `q${qIndex + 1}`;
                const answer = response[questionKey] || '';
                return `"${answer.replace(/"/g, '""')}"`;
            }).join(',');
        });

        const csvContent = [headers, ...rows].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', `survey_results_${survey.id}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };


    return (
        <div className="space-y-6">
             <LeadershipPulseDialog 
                open={isLeadershipPulseDialogOpen}
                onOpenChange={setIsLeadershipPulseDialogOpen}
                summary={summary}
                surveyObjective={survey.objective}
            />

            <div>
                <div className="flex justify-between items-center mb-2">
                    <h3 className="font-semibold text-lg flex items-center gap-2">
                        <Eye className="h-5 w-5 text-primary" />
                        Raw Responses ({mockResponses.length} total)
                    </h3>
                    <Button variant="outline" size="sm" onClick={handleDownloadCsv}>
                        <Download className="mr-2 h-4 w-4" /> Download CSV
                    </Button>
                </div>
                <div className="border rounded-lg overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                {survey.questions.map(q => (
                                    <TableHead key={q.id} className="min-w-[200px]">{q.questionText}</TableHead>
                                ))}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {mockResponses.map((response, index) => (
                                <TableRow key={index}>
                                    {survey.questions.map((q, qIndex) => {
                                        const questionKey = `q${qIndex + 1}`;
                                        return (
                                            <TableCell key={q.id} className="text-sm">
                                                {response[questionKey] || 'No answer'}
                                            </TableCell>
                                        )
                                    })}
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </div>

            {survey.status === 'closed' && (
                <div>
                     <Button onClick={handleAnalyze} disabled={isLoading}>
                        {isLoading ? <Loader2 className="mr-2 animate-spin" /> : <Bot className="mr-2" />}
                        Analyse Responses
                    </Button>

                    {error && (
                         <Alert variant="destructive" className="mt-4">
                            <AlertTitle>Error</AlertTitle>
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}
                    {summary && (
                        <Card className="mt-4">
                             <CardHeader>
                                <CardTitle className="flex items-center justify-between">
                                    <span className="flex items-center gap-2"><Bot className="text-primary" /> AI Summary & Actions</span>
                                     <Button onClick={() => setIsLeadershipPulseDialogOpen(true)}>
                                        <Users className="mr-2 h-4 w-4" /> Generate Leadership Pulse
                                    </Button>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <h4 className="font-semibold text-foreground">Overall Sentiment</h4>
                                    <p className="text-sm text-muted-foreground">{summary.overallSentiment}</p>
                                </div>
                                <div>
                                    <h4 className="font-semibold text-foreground">Key Themes</h4>
                                    <ul className="list-disc pl-5 space-y-2 mt-2">
                                        {summary.keyThemes.map((theme, i) => (
                                            <li key={i}>
                                                <span className="font-semibold">{theme.theme}</span>
                                                <p className="text-sm text-muted-foreground">{theme.summary}</p>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                                <div>
                                    <h4 className="font-semibold text-foreground">Actionable Recommendations</h4>
                                    <ul className="list-disc pl-5 space-y-2 mt-2">
                                        {summary.recommendations.map((rec, i) => (
                                            <li key={i} className="text-sm text-muted-foreground">{rec}</li>
                                        ))}
                                    </ul>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            )}
        </div>
    );
}

function ActiveSurveys() {
    const [surveys, setSurveys] = useState<DeployedSurvey[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();

    const fetchSurveys = useCallback(async () => {
        setIsLoading(true);
        const allSurveys = await getAllSurveys();
        setSurveys(allSurveys);
        setIsLoading(false);
    }, []);

    useEffect(() => {
        fetchSurveys();
        const handleDataUpdate = () => fetchSurveys();
        window.addEventListener('storage', handleDataUpdate);
        window.addEventListener('feedbackUpdated', handleDataUpdate);
        return () => {
            window.removeEventListener('storage', handleDataUpdate);
            window.removeEventListener('feedbackUpdated', handleDataUpdate);
        };
    }, [fetchSurveys]);
    
    const handleCloseSurvey = async (surveyId: string) => {
        await closeSurvey(surveyId);
        toast({ title: "Survey Closed", description: "The survey is no longer accepting new responses." });
        fetchSurveys();
    }

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
                    <ListChecks /> Deployed Surveys
                </CardTitle>
            </CardHeader>
            <CardContent>
                <Accordion type="single" collapsible className="w-full space-y-3">
                     {surveys.map(survey => (
                         <AccordionItem value={survey.id} key={survey.id} className="border rounded-lg bg-card-foreground/5">
                            <div className="flex justify-between items-center w-full p-4">
                                <AccordionTrigger className="p-0 flex-1 hover:no-underline">
                                    <div className="text-left">
                                        <p className="font-semibold text-lg text-foreground">{survey.objective}</p>
                                        <p className="text-sm font-normal text-muted-foreground">
                                            Deployed {formatDistanceToNow(new Date(survey.deployedAt), { addSuffix: true })}
                                        </p>
                                    </div>
                                </AccordionTrigger>
                                <div className="flex items-center gap-4 pl-4">
                                     <div className="flex items-center gap-1.5 text-sm">
                                        <Activity />
                                        <span className="font-semibold text-foreground">{survey.submissionCount}</span> Submissions
                                    </div>
                                    <div className="flex items-center gap-1.5 text-sm">
                                        <UserX />
                                        <span className="font-semibold text-foreground">{survey.optOutCount || 0}</span> Opt-outs
                                    </div>
                                     <Badge variant={survey.status === 'active' ? 'success' : 'secondary'}>
                                        {survey.status === 'active' ? 'Active' : 'Closed'}
                                    </Badge>
                                    {survey.status === 'active' && (
                                        <Button variant="destructive" size="sm" onClick={(e) => { e.stopPropagation(); handleCloseSurvey(survey.id); }}>
                                            <XCircle className="mr-2 h-4 w-4" /> Close Survey
                                        </Button>
                                    )}
                                 </div>
                            </div>
                            <AccordionContent className="p-4 pt-2 border-t">
                                <SurveyResults survey={survey} />
                            </AccordionContent>
                        </AccordionItem>
                     ))}
                </Accordion>
            </CardContent>
        </Card>
    );
}

function OrgHealthContent() {
  const [_, forceUpdate] = useState(0);

  const handleSurveyDeployed = () => {
    forceUpdate(c => c + 1); // Force re-render of ActiveSurveys
  };

  return (
    <div className="p-4 md:p-8 space-y-8">
        <div className="flex justify-between items-start">
            <div className="space-y-1">
                <h1 className="text-3xl font-bold font-headline flex items-center gap-3">
                    <HeartPulse className="h-8 w-8 text-primary" />
                    Org Health
                </h1>
            </div>
        </div>
        
        <ActiveSurveys />
        
        <CreateSurveyWizard onSurveyDeployed={handleSurveyDeployed} />
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
