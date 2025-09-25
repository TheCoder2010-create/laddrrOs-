

"use client";

import { useState, useEffect, useCallback } from 'react';
import type { Role } from '@/hooks/use-role';
import { useRole } from '@/hooks/use-role';
import DashboardLayout from '@/components/dashboard-layout';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { roleUserMapping } from '@/lib/role-mapping';
import { FlaskConical, PlusCircle, Users, Briefcase, UserCheck, Loader2, Send, Info, CheckCircle, BookOpen, Video, FileQuestion, Gamepad2, Play, ArrowLeft, ArrowRight, Book, CheckSquare } from 'lucide-react';
import { getNominationsForManager, nominateUser, getNominationForUser, type Nomination, completeModule, savePreAssessment, type TrainingModule, type TrainingLesson, saveLessonResult, type LessonActivity } from '@/services/interviewer-lab-service';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import type { NetsInitialInput, InterviewerAnalysisOutput } from '@/ai/schemas/nets-schemas';
import SimulationArena from '@/components/simulation-arena';
import { analyzeInterview } from '@/ai/flows/analyze-interview-flow';
import type { InterviewerConversationInput } from '@/ai/schemas/interviewer-lab-schemas';
import { cn } from '@/lib/utils';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';


function LessonComponent({ lesson, onComplete }: { lesson: TrainingLesson, onComplete: (result?: any) => void }) {
    const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
    const [journalEntry, setJournalEntry] = useState('');
    const [checkedItems, setCheckedItems] = useState<string[]>([]);
    
    const { toast } = useToast();

    const getIcon = () => {
        switch (lesson.type) {
            case 'video': return <Video className="h-6 w-6 text-primary" />;
            case 'reading': return <BookOpen className="h-6 w-6 text-primary" />;
            case 'interactive': return <Gamepad2 className="h-6 w-6 text-primary" />;
            case 'practice': return <Play className="h-6 w-6 text-primary" />;
            default: return <FileQuestion className="h-6 w-6 text-primary" />;
        }
    };
    
    const handleChecklistChange = (item: string) => {
        setCheckedItems(prev => prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]);
    };

    const handleSimpleSubmit = () => {
        if (lesson.activity?.type === 'journal') {
            onComplete(journalEntry);
            setJournalEntry('');
        } else if (lesson.activity?.type === 'checklist') {
            onComplete(checkedItems);
            setCheckedItems([]);
        } else if (lesson.activity?.type === 'fill_blank') {
            onComplete(journalEntry); // Re-use journalEntry state for simplicity
            setJournalEntry('');
        } 
        else {
            onComplete();
        }
    };
    
    const handleQuizSubmit = () => {
        const activity = lesson.activity;
        if (activity?.type !== 'quiz_mcq' || !selectedAnswer) return;
        
        const isCorrect = selectedAnswer === activity.correctAnswer;
        toast({
            title: isCorrect ? "Correct!" : "Not Quite",
            description: isCorrect ? "Great job." : `The correct answer was: ${activity.correctAnswer}`,
            variant: isCorrect ? "success" : "destructive",
        });

        if(isCorrect) {
            onComplete(selectedAnswer);
        }
        setSelectedAnswer(null);
    };

    const handleSwipeSubmit = (answer: 'Legal' | 'Illegal', correctAnswer: 'Legal' | 'Illegal') => {
         const isCorrect = answer === correctAnswer;
         toast({
            title: isCorrect ? "Correct!" : "Not Quite",
            description: `That question is ${correctAnswer}.`,
            variant: isCorrect ? "success" : "destructive",
        });
        if(isCorrect) {
            onComplete(answer);
        }
    }


    const renderActivity = (activity: LessonActivity) => {
        switch (activity.type) {
            case 'quiz_mcq':
                return (
                    <div className='space-y-4'>
                        <p className="font-semibold">{activity.question}</p>
                        <RadioGroup value={selectedAnswer ?? ''} onValueChange={setSelectedAnswer}>
                            {activity.options.map((opt, i) => (
                                <div key={i} className="flex items-center space-x-2 p-2 rounded-md hover:bg-muted/50">
                                    <RadioGroupItem value={opt} id={`q-${lesson.id}-${i}`} />
                                    <Label htmlFor={`q-${lesson.id}-${i}`} className="flex-1 cursor-pointer">{opt}</Label>
                                </div>
                            ))}
                        </RadioGroup>
                    </div>
                );
            case 'match_game':
                return (
                     <div className='space-y-4'>
                        <p className="font-semibold">{activity.prompt}</p>
                         <div className="space-y-2">
                            {activity.items.map((item, i) => (
                                <Card key={i} className="p-3">
                                    <p className="font-medium">"{item.text}"</p>
                                    <p className="text-sm text-green-500">Correctly matches: {item.category}</p>
                                </Card>
                            ))}
                        </div>
                    </div>
                );
            case 'fill_blank':
                 return (
                    <div className='space-y-2'>
                        <p className="font-semibold">{activity.prompt}</p>
                        <Textarea value={journalEntry} onChange={e => setJournalEntry(e.target.value)} placeholder="Type your answer..."/>
                    </div>
                 );
            case 'checklist':
                return (
                    <div className='space-y-2'>
                        <p className="font-semibold">{activity.prompt}</p>
                        {activity.options.map((opt, i) => (
                             <div key={i} className="flex items-center space-x-2 p-2 rounded-md hover:bg-muted/50">
                                <Checkbox id={`c-${lesson.id}-${i}`} onCheckedChange={() => handleChecklistChange(opt)} checked={checkedItems.includes(opt)} />
                                <Label htmlFor={`c-${lesson.id}-${i}`} className="flex-1 cursor-pointer">{opt}</Label>
                            </div>
                        ))}
                    </div>
                );
            case 'branching_scenario':
                 return (
                    <div className='space-y-4'>
                        <p className="font-semibold">{activity.prompt}</p>
                        <div className="flex flex-col gap-2">
                        {activity.options.map((opt, i) => (
                            <Button key={i} variant={opt.isCorrect ? "success" : "destructive"} onClick={() => {
                                toast({ title: opt.isCorrect ? "Correct Choice!" : "Incorrect Choice", description: opt.isCorrect ? "This keeps the conversation focused and legally compliant." : "This question is illegal and introduces bias."});
                                if(opt.isCorrect) onComplete(opt.text);
                            }}>
                                {opt.text}
                            </Button>
                        ))}
                        </div>
                    </div>
                 );
            case 'journal':
                 return (
                    <div className='space-y-2'>
                        <p className="font-semibold">{activity.prompt}</p>
                        <Textarea value={journalEntry} onChange={e => setJournalEntry(e.target.value)} placeholder="Your reflections..."/>
                    </div>
                );
            case 'swipe_quiz':
                return (
                     <div className='space-y-4'>
                        <p className="font-semibold">{activity.prompt}</p>
                        {activity.cards.map((card, i) => (
                             <Card key={i} className="p-4">
                                <p className="text-center font-medium italic">"{card.text}"</p>
                                <div className="flex justify-center gap-4 mt-4">
                                    <Button variant="success" onClick={() => handleSwipeSubmit('Legal', card.correctAnswer)}>Legal</Button>
                                    <Button variant="destructive" onClick={() => handleSwipeSubmit('Illegal', card.correctAnswer)}>Illegal</Button>
                                </div>
                            </Card>
                        ))}
                    </div>
                )
            default:
                return null;
        }
    }

    const renderFooter = () => {
        if (lesson.type === 'practice') {
            return <Button onClick={() => onComplete()}><Play className="mr-2 h-4 w-4"/> Start Practice</Button>;
        }
        if (!lesson.activity) {
            return <Button onClick={() => onComplete()}>Continue</Button>;
        }
        switch (lesson.activity.type) {
            case 'quiz_mcq':
                return <Button onClick={handleQuizSubmit} disabled={!selectedAnswer}>Submit Answer</Button>;
            case 'match_game':
                 return <Button onClick={handleSimpleSubmit}>Continue</Button>; // Auto-completes
             case 'branching_scenario':
                return null; // Buttons are inline
            case 'swipe_quiz':
                return null; // Buttons are inline
            case 'fill_blank':
                 return <Button onClick={handleSimpleSubmit} disabled={!journalEntry}>Submit</Button>;
            case 'checklist':
                 return <Button onClick={handleSimpleSubmit} disabled={checkedItems.length === 0}>Submit</Button>;
            case 'journal':
                return <Button onClick={handleSimpleSubmit} disabled={!journalEntry}>Save Reflection</Button>;
            default:
                return <Button onClick={() => onComplete()}>Continue</Button>;
        }
    };
    
    return (
        <Card className="shadow-lg">
            <CardHeader>
                <CardTitle className="flex items-center gap-3">{getIcon()} {lesson.title}</CardTitle>
                {lesson.script && <CardDescription className="whitespace-pre-wrap pt-2">{lesson.script}</CardDescription>}
            </CardHeader>
            
            {lesson.activity && (
                <CardContent>
                    <div className="p-4 border bg-muted/50 rounded-lg">
                        <h4 className="font-bold mb-4 text-center text-primary">Activity</h4>
                        {renderActivity(lesson.activity)}
                    </div>
                </CardContent>
            )}

            <CardFooter>
                {renderFooter()}
            </CardFooter>
        </Card>
    );
}

function LearnerView({ initialNomination, onUpdate }: { initialNomination: Nomination, onUpdate: () => void }) {
    const { toast } = useToast();
    const [nomination, setNomination] = useState(initialNomination);
    
    // Simulation state
    const [simulationConfig, setSimulationConfig] = useState<NetsInitialInput | null>(null);
    const [currentPracticeLesson, setCurrentPracticeLesson] = useState<TrainingLesson | null>(null);

    // Lesson navigation state
    const [currentModuleIndex, setCurrentModuleIndex] = useState(0);
    const [currentLessonIndex, setCurrentLessonIndex] = useState(0);
    
    useEffect(() => {
        // This ensures the component state updates when the parent re-fetches data.
        setNomination(initialNomination);

        if (initialNomination.status !== 'Pre-assessment pending') {
            // When nomination data changes (e.g. after pre-assessment), find the first uncompleted module
            const firstUncompletedModuleIndex = initialNomination.modules.findIndex(m => !m.isCompleted);
            const newModuleIndex = firstUncompletedModuleIndex >= 0 ? firstUncompletedModuleIndex : initialNomination.modules.length - 1;
            setCurrentModuleIndex(newModuleIndex);
            
            const firstUncompletedLessonIndex = initialNomination.modules[newModuleIndex]?.lessons.findIndex(l => !l.isCompleted);
            const newLessonIndex = firstUncompletedLessonIndex >= 0 ? firstUncompletedLessonIndex : 0;
            setCurrentLessonIndex(newLessonIndex);
        }

    }, [initialNomination]);

    const currentModule = nomination.modules[currentModuleIndex];
    const currentLesson = currentModule?.lessons[currentLessonIndex];
    const allModulesCompleted = nomination.modules.every(m => m.isCompleted);

    const handleStartPreAssessment = () => {
        setSimulationConfig({
            persona: 'Candidate', // The AI plays a generic candidate
            scenario: `This is a pre-assessment mock interview for a ${nomination.targetInterviewRole} role. I am the interviewer, and you are the candidate. Please answer my questions as a candidate would.`,
            difficulty: 'neutral',
        });
    };
    
    const handleStartPractice = (lesson: TrainingLesson) => {
        if (lesson.practiceScenario) {
            setCurrentPracticeLesson(lesson);
            setSimulationConfig(lesson.practiceScenario);
        }
    };

    const handleLessonComplete = async (result?: any) => {
        if (!currentLesson || !currentModule) return;

        // If it's a practice lesson, start the simulation instead of completing it right away
        if (currentLesson.type === 'practice') {
            handleStartPractice(currentLesson);
            return;
        }
        
        await saveLessonResult(nomination.id, currentModule.id, currentLesson.id, result);

        const nextLessonIndex = currentLessonIndex + 1;
        if (nextLessonIndex < currentModule.lessons.length) {
            setCurrentLessonIndex(nextLessonIndex);
        } else {
            // This was the last lesson of the module.
            await completeModule(nomination.id, currentModule.id);
            toast({ title: `Module ${currentModuleIndex + 1} Complete!` });
            onUpdate();
        }
        onUpdate();
    };

    const handleExitSimulation = async (messages?: { role: 'user' | 'model', content: string }[]) => {
        if (!messages || messages.length < 2) { // Need at least one user turn
            setSimulationConfig(null);
            setCurrentPracticeLesson(null);
            return;
        }

        const transcript = messages.map(m => `${m.role === 'user' ? 'Interviewer' : 'Candidate'}: ${m.content}`).join('\n');
        
        try {
            const analysisInput: InterviewerConversationInput = { transcript };
            const analysisResult = await analyzeInterview(analysisInput);

            if (nomination.status === 'Pre-assessment pending') {
                await savePreAssessment(nomination.id, analysisResult);
                 toast({
                    title: "Pre-Assessment Complete!",
                    description: "Your baseline score has been saved. You can now begin your training modules.",
                });
            } else if (currentPracticeLesson && currentModule) {
                // This was a practice session for a module
                await saveLessonResult(nomination.id, currentModule.id, currentPracticeLesson.id, analysisResult);
                
                // Check if this was the last lesson of the module to complete the module
                const isLastLesson = currentModule.lessons[currentModule.lessons.length - 1].id === currentPracticeLesson.id;
                if (isLastLesson) {
                    await completeModule(nomination.id, currentModule.id);
                    toast({
                        title: `Module ${currentModuleIndex+1} Complete!`,
                        description: "Your progress has been updated.",
                    });
                } else {
                     // Not the last lesson, but still show a toast for completing the practice
                    toast({
                        title: "Practice Complete!",
                        description: `You can now proceed to the next lesson.`
                    });
                }
            }

            onUpdate(); // Notify parent to re-fetch and update the view
        } catch (e) {
            console.error("Failed to analyze interview", e);
            toast({ variant: 'destructive', title: "Analysis Failed", description: "Could not generate a score for this session." });
        } finally {
            setSimulationConfig(null);
            setCurrentPracticeLesson(null);
        }
    };
    
    if (simulationConfig) {
        return (
            <div className="p-4 md:p-8 flex items-center justify-center">
                 <SimulationArena 
                    initialConfig={simulationConfig} 
                    onExit={handleExitSimulation} 
                    arenaTitle={nomination.status === 'Pre-assessment pending' ? "Pre-Assessment Mock Interview" : `Practice: ${currentModule?.title}`}
                />
            </div>
        )
    }

    return (
        <div className="p-4 md:p-8 space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="text-3xl font-bold font-headline flex items-center gap-3">
                        <FlaskConical className="h-8 w-8 text-primary" />
                        My Interviewer Lab
                    </CardTitle>
                    <CardDescription className="text-lg text-muted-foreground">
                        {allModulesCompleted ? "You've completed your training! It's time for the final assessment." : "You've been nominated for Laddrr's Interviewer Coaching Program. Complete the modules below to get certified."}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                     <div className="flex items-center gap-4">
                        <span className="text-sm font-medium">Progress:</span>
                        <Progress value={(nomination.modulesCompleted / nomination.modulesTotal) * 100} className="w-full max-w-sm" />
                        <span className="text-sm font-medium text-muted-foreground">
                            {nomination.modulesCompleted} / {nomination.modulesTotal}
                        </span>
                    </div>

                    {nomination.status === 'Pre-assessment pending' && (
                        <div className="border-2 border-dashed rounded-lg p-8 text-center bg-card">
                            <h3 className="text-xl font-semibold">Start Your Journey</h3>
                            <p className="text-muted-foreground mt-2">Your first step is to complete a baseline mock interview. This helps us tailor your learning path.</p>
                            <Button className="mt-6" onClick={handleStartPreAssessment}>Begin Pre-Assessment</Button>
                        </div>
                    )}
                </CardContent>
            </Card>

            {nomination.status !== 'Pre-assessment pending' && !allModulesCompleted && currentModule && currentLesson && (
                 <div className="space-y-4">
                    <h2 className="text-xl font-semibold">Module {currentModuleIndex + 1}: {currentModule.title}</h2>
                    <LessonComponent lesson={currentLesson} onComplete={handleLessonComplete} />
                 </div>
            )}
            
            {allModulesCompleted && (
                <Card className="border-primary/50 mt-8">
                    <CardHeader className="text-center">
                        <CardTitle>Training Complete!</CardTitle>
                        <CardDescription>You've completed all the training modules. It's time for your final assessment to get certified.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex justify-center">
                        <Button size="lg" className="bg-primary hover:bg-primary/90">
                           Begin Post-Assessment
                        </Button>
                    </CardContent>
                </Card>
            )}

        </div>
    );
}

function NominateDialog({ onNomination }: { onNomination: () => void }) {
    const { role } = useRole();
    const { toast } = useToast();
    const [selectedNominee, setSelectedNominee] = useState('');
    const [targetRole, setTargetRole] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isOpen, setIsOpen] = useState(false);

    const handleNominate = async () => {
        if (!role || !selectedNominee || !targetRole) {
            toast({ variant: 'destructive', title: 'Missing fields', description: 'Please select a nominee and target role.' });
            return;
        }
        setIsSubmitting(true);
        try {
            await nominateUser(role, selectedNominee as Role, targetRole);
            toast({ title: 'Nomination Submitted!', description: `${roleUserMapping[selectedNominee as Role]?.name} has been enrolled.` });
            onNomination();
            setIsOpen(false);
        } catch (error) {
            console.error("Failed to nominate user", error);
            toast({ variant: 'destructive', title: 'Nomination Failed' });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button>
                    <PlusCircle className="mr-2" /> Nominate
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Nominate for Interviewer Training</DialogTitle>
                    <DialogDescription>
                        Enroll a team member in the Interviewer Coaching Program to improve their hiring skills.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="nominee">Select Nominee</Label>
                        <Select onValueChange={setSelectedNominee}>
                            <SelectTrigger id="nominee">
                                <SelectValue placeholder="Select a team member" />
                            </SelectTrigger>
                            <SelectContent>
                                {Object.values(roleUserMapping).filter(user => user.role !== role && user.role !== 'HR Head' && user.role !== 'Anonymous' && user.role !== 'Manager').map(user => (
                                    <SelectItem key={user.role} value={user.role}>
                                        {user.name} ({user.role})
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="target-role">Target Interview Role</Label>
                        <TooltipProvider>
                            <div className="flex items-center gap-2">
                                <Select onValueChange={setTargetRole}>
                                    <SelectTrigger id="target-role">
                                        <SelectValue placeholder="Select target role" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Individual Contributor">Individual Contributor</SelectItem>
                                        <SelectItem value="Team Lead">Team Lead</SelectItem>
                                        <SelectItem value="Manager">Manager</SelectItem>
                                    </SelectContent>
                                </Select>
                                <Tooltip>
                                    <TooltipTrigger>
                                        <Info className="h-4 w-4 text-muted-foreground" />
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p className="max-w-xs">
                                            This defines the type of candidate the nominee is being trained to interview (e.g., training to interview a Manager requires different skills than for an IC).
                                        </p>
                                    </TooltipContent>
                                </Tooltip>
                            </div>
                        </TooltipProvider>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="ghost" onClick={() => setIsOpen(false)}>Cancel</Button>
                    <Button onClick={handleNominate} disabled={isSubmitting || !selectedNominee || !targetRole}>
                        {isSubmitting && <Loader2 className="mr-2 animate-spin" />}
                        Submit Nomination
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function NominationDetailDialog({ nomination, open, onOpenChange }: { nomination: Nomination | null, open: boolean, onOpenChange: (open: boolean) => void }) {
    if (!nomination) return null;

    const nomineeName = roleUserMapping[nomination.nominee]?.name || nomination.nominee;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Nomination Details: {nomineeName}</DialogTitle>
                    <DialogDescription>
                        Reviewing progress for the {nomination.targetInterviewRole} interview track.
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Card className="text-center">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-lg">Pre-Assessment</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className={cn("text-3xl font-bold", nomination.scorePre ? 'text-primary' : 'text-muted-foreground')}>
                                    {nomination.scorePre ? nomination.scorePre.toFixed(0) : 'N/A'}
                                </p>
                            </CardContent>
                        </Card>
                        <Card className="text-center">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-lg">Current Progress</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-3xl font-bold text-primary">
                                    {nomination.modulesCompleted}/{nomination.modulesTotal}
                                </p>
                                <p className="text-xs text-muted-foreground">Modules Completed</p>
                            </CardContent>
                        </Card>
                         <Card className="text-center">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-lg">Post-Assessment</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className={cn("text-3xl font-bold", nomination.scorePost ? 'text-green-500' : 'text-muted-foreground')}>
                                    {nomination.scorePost ? nomination.scorePost.toFixed(0) : 'N/A'}
                                </p>
                            </CardContent>
                        </Card>
                    </div>

                    <div>
                        <h4 className="font-semibold mb-2">Module Status</h4>
                        <div className="space-y-2">
                            {nomination.modules.map(module => (
                                <div key={module.id} className="flex items-center justify-between p-2 border rounded-md bg-muted/50">
                                    <p className="font-medium text-sm">{module.title}</p>
                                    {module.isCompleted ? (
                                        <CheckSquare className="h-5 w-5 text-green-500" />
                                    ) : (
                                        <CheckSquare className="h-5 w-5 text-muted-foreground/30" />
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                </div>
                 <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function ManagerView() {
    const { role } = useRole();
    const [nominations, setNominations] = useState<Nomination[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedNomination, setSelectedNomination] = useState<Nomination | null>(null);

    const fetchNominations = useCallback(async () => {
        if (!role) return;
        setIsLoading(true);
        const userNominations = await getNominationsForManager(role);
        setNominations(userNominations);
        setIsLoading(false);
    }, [role]);

    useEffect(() => {
        fetchNominations();
        window.addEventListener('feedbackUpdated', fetchNominations);
        return () => window.removeEventListener('feedbackUpdated', fetchNominations);
    }, [fetchNominations]);

    const getStatusBadge = (status: Nomination['status']) => {
        switch (status) {
            case 'Certified': return <Badge variant="success">Certified</Badge>;
            case 'In Progress': return <Badge variant="secondary">In Progress</Badge>;
            case 'Retry Needed': return <Badge variant="destructive">Retry Needed</Badge>;
            default: return <Badge variant="outline">{status}</Badge>;
        }
    };
    
    const benchStrength = nominations.reduce((acc, n) => {
        if (n.certified) acc.certified++;
        else if (n.status === 'Retry Needed') acc.retry++;
        else acc.inProgress++;
        return acc;
    }, { certified: 0, inProgress: 0, retry: 0 });

    return (
        <div className="p-4 md:p-8 space-y-6">
            <NominationDetailDialog
                nomination={selectedNomination}
                open={!!selectedNomination}
                onOpenChange={() => setSelectedNomination(null)}
            />
            <div className="flex justify-between items-center">
                <div className="space-y-1">
                    <h1 className="text-3xl font-bold font-headline flex items-center gap-3">
                        <FlaskConical className="h-8 w-8 text-primary" />
                        Interviewer Lab
                    </h1>
                    <p className="text-muted-foreground">Nominate, track, and coach your team members through the Interviewer Coaching Program.</p>
                </div>
                {role === 'Manager' && <NominateDialog onNomination={fetchNominations} />}
            </div>

             <Card className="w-fit">
                <CardHeader>
                    <CardTitle>Your Interviewer Bench</CardTitle>
                </CardHeader>
                <CardContent className="flex gap-4">
                     <div className="p-4 rounded-lg bg-green-500/10 text-green-700 dark:text-green-400">
                        <p className="font-bold text-2xl">{benchStrength.certified}</p>
                        <p className="text-sm">Certified</p>
                    </div>
                    <div className="p-4 rounded-lg bg-yellow-500/10 text-yellow-700 dark:text-yellow-400">
                        <p className="font-bold text-2xl">{benchStrength.inProgress}</p>
                        <p className="text-sm">In Progress</p>
                    </div>
                     <div className="p-4 rounded-lg bg-red-500/10 text-red-700 dark:text-red-500">
                        <p className="font-bold text-2xl">{benchStrength.retry}</p>
                        <p className="text-sm">Needs Retry</p>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Nomination Overview</CardTitle>
                </CardHeader>
                <CardContent>
                    {isLoading ? <Skeleton className="h-48 w-full" /> : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Target Level</TableHead>
                                    <TableHead>Pre Score</TableHead>
                                    <TableHead>Progress</TableHead>
                                    <TableHead>Post Score</TableHead>
                                    <TableHead>Growth %</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {nominations.map(n => (
                                    <TableRow key={n.id}>
                                        <TableCell>
                                            <div className="font-medium">{roleUserMapping[n.nominee]?.name || n.nominee}</div>
                                            <div className="text-sm text-muted-foreground">{roleUserMapping[n.nominee]?.role || ''}</div>
                                        </TableCell>
                                        <TableCell>{n.targetInterviewRole}</TableCell>
                                        <TableCell>{n.scorePre ? n.scorePre.toFixed(0) : '—'}</TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <span>{n.modulesCompleted}/{n.modulesTotal}</span>
                                                <Progress value={(n.modulesCompleted / n.modulesTotal) * 100} className="w-24 h-2" />
                                            </div>
                                        </TableCell>
                                        <TableCell>{n.scorePost ?? '—'}</TableCell>
                                        <TableCell>
                                            {n.scorePre && n.scorePost ? 
                                                `+${(((n.scorePost - n.scorePre) / n.scorePre) * 100).toFixed(0)}%` : 
                                                '—'
                                            }
                                        </TableCell>
                                        <TableCell>{getStatusBadge(n.status)}</TableCell>
                                        <TableCell>
                                            <Button variant="ghost" size="sm" onClick={() => setSelectedNomination(n)}>View</Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

export default function InterviewerLabPage() {
    const { role, setRole, isLoading: isRoleLoading } = useRole();
    const [nomination, setNomination] = useState<Nomination | null>(null);
    const [isCheckingNomination, setIsCheckingNomination] = useState(true);

    const fetchNominationData = useCallback(async () => {
        if (!role) return;
        setIsCheckingNomination(true);
        getNominationForUser(role).then(userNomination => {
            setNomination(userNomination);
            setIsCheckingNomination(false);
        });
    }, [role]);

    useEffect(() => {
        fetchNominationData();
    }, [fetchNominationData]);

    const isLoading = isRoleLoading || isCheckingNomination;

    if (isLoading || !role) {
        return (
            <DashboardLayout role="Manager" onSwitchRole={() => { }}>
                <Skeleton className="w-full h-screen" />
            </DashboardLayout>
        );
    }
    
    // Managerial roles see the ManagerView. Others see LearnerView if nominated.
    const isManagerialRole = ['Manager', 'HR Head'].includes(role);
    if (isManagerialRole) {
        return (
            <DashboardLayout role={role} onSwitchRole={setRole}>
                <ManagerView />
            </DashboardLayout>
        );
    } else if (nomination) {
        return (
            <DashboardLayout role={role} onSwitchRole={setRole}>
                <LearnerView initialNomination={nomination} onUpdate={fetchNominationData} />
            </DashboardLayout>
        );
    }

    // Default for non-managers who are not nominated (though the sidebar should hide the link)
    return (
        <DashboardLayout role={role} onSwitchRole={setRole}>
             <div className="p-8"><p>Access to the Interviewer Lab is by nomination only.</p></div>
        </DashboardLayout>
    );
}
