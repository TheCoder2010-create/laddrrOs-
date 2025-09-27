
"use client";

import { useState, useEffect, useCallback } from 'react';
import type { Role } from '@/hooks/use-role';
import { useRole } from '@/hooks/use-role';
import DashboardLayout from '@/components/dashboard-layout';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { LeadershipIcon } from '@/components/ui/leadership-icon';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { roleUserMapping } from '@/lib/role-mapping';
import { PlusCircle, Loader2, BookOpen, CheckCircle, ArrowRight, ArrowLeft } from 'lucide-react';
import { getLeadershipNominationsForManager, getNominationForUser as getLeadershipNominationForUser, type LeadershipNomination, type LeadershipModule, nominateForLeadership, completeLeadershipLesson, type LessonStep } from '@/services/leadership-service';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';


function NominateDialog({ onNomination }: { onNomination: () => void }) {
    const { role } = useRole();
    const { toast } = useToast();
    const [selectedNominee, setSelectedNominee] = useState<Role | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isOpen, setIsOpen] = useState(false);

    const getNextRole = (currentRole: Role | null): Role | null => {
        if (!currentRole) return null;
        switch (currentRole) {
            case 'Employee': return 'Team Lead';
            case 'Team Lead': return 'AM';
            case 'AM': return 'Manager';
            default: return null;
        }
    };

    const targetRole = getNextRole(selectedNominee);

    const handleNominate = async () => {
        if (!role || !selectedNominee || !targetRole) return;

        setIsSubmitting(true);
        try {
            await nominateForLeadership(role, selectedNominee, targetRole);
            toast({ title: 'Nomination Submitted!', description: `${roleUserMapping[selectedNominee]?.name} has been enrolled in the Leadership Development Program.` });
            onNomination();
            setIsOpen(false);
            setSelectedNominee(null);
        } catch (error) {
            console.error("Failed to nominate user", error);
            toast({ variant: 'destructive', title: 'Nomination Failed' });
        } finally {
            setIsSubmitting(false);
        }
    };
    
    // A manager can nominate employees, team leads, and AMs.
    const eligibleNominees: Role[] = ['Employee', 'Team Lead', 'AM'];

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button>
                    <PlusCircle className="mr-2" /> Nominate for Leadership
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Nominate for Leadership Development</DialogTitle>
                    <DialogDescription>
                        Select an employee to enroll them in a structured program to groom them for the next level.
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-4">
                     <div className="space-y-2">
                        <p className="font-semibold text-foreground">Select Nominee:</p>
                        <Select onValueChange={(value: Role) => setSelectedNominee(value)}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select an employee or team lead" />
                            </SelectTrigger>
                            <SelectContent>
                                {eligibleNominees.map(nomineeRole => (
                                    <SelectItem key={nomineeRole} value={nomineeRole}>
                                        {roleUserMapping[nomineeRole].name} ({nomineeRole})
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {selectedNominee && targetRole && (
                        <div className="flex items-center justify-center gap-4 pt-4 text-center">
                            <div className="text-center">
                                <p className="text-sm text-muted-foreground">Current Role</p>
                                <p className="font-semibold">{selectedNominee}</p>
                            </div>
                            <ArrowRight className="h-5 w-5 text-muted-foreground" />
                            <div className="text-center">
                                <p className="text-sm text-muted-foreground">Target Role</p>
                                <p className="font-semibold text-primary">{targetRole}</p>
                            </div>
                        </div>
                    )}
                </div>
                <DialogFooter>
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button disabled={!selectedNominee || isSubmitting}>
                                {isSubmitting ? <Loader2 className="mr-2 animate-spin" /> : 'Confirm Nomination'}
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    You are nominating {selectedNominee ? roleUserMapping[selectedNominee].name : '...'} for Leadership Coaching to become a {targetRole}.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={handleNominate}>
                                    Confirm
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function LessonStepComponent({ step, onComplete, onUpdateAnswer, answer }: { step: LessonStep, onComplete: () => void, onUpdateAnswer: (answer: string) => void, answer?: string }) {
    const { toast } = useToast();

    const handleQuizSubmit = () => {
        if (step.type !== 'quiz_mcq' || !answer) return;
        
        const isCorrect = answer === step.correctAnswer;
        toast({
            title: isCorrect ? "Correct!" : "Not Quite",
            description: isCorrect ? step.feedback?.correct : step.feedback?.incorrect,
            variant: isCorrect ? "success" : "destructive",
        });

        if (isCorrect) {
            onComplete();
        }
    };

    switch (step.type) {
        case 'script':
            return (
                <div className="prose prose-sm dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: step.content }} />
            );
        case 'quiz_mcq':
            return (
                <div className='space-y-4'>
                    <p className="font-semibold">{step.question}</p>
                    <RadioGroup value={answer} onValueChange={onUpdateAnswer}>
                        {step.options.map((opt, i) => (
                            <div key={i} className="flex items-center space-x-2 p-2 rounded-md hover:bg-muted/50">
                                <RadioGroupItem value={opt} id={`q-${i}`} />
                                <Label htmlFor={`q-${i}`} className="flex-1 cursor-pointer">{opt}</Label>
                            </div>
                        ))}
                    </RadioGroup>
                    <Button onClick={handleQuizSubmit} disabled={!answer}>Submit Answer</Button>
                </div>
            );
        case 'activity':
             return (
                 <div className='space-y-4'>
                    <div className="prose prose-sm dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: step.content }} />
                    <Textarea 
                        value={answer || ''} 
                        onChange={(e) => onUpdateAnswer(e.target.value)} 
                        placeholder="Your reflections..." 
                        rows={8} 
                    />
                    <Button onClick={onComplete} disabled={!answer}>Save & Continue</Button>
                </div>
            );
        default:
            return null;
    }
}

function LearnerView({ initialNomination, onUpdate }: { initialNomination: LeadershipNomination, onUpdate: () => void }) {
    const [nomination, setNomination] = useState(initialNomination);
    const { toast } = useToast();
    
    // Lesson navigation state
    const [activeLesson, setActiveLesson] = useState<{ moduleIndex: number; lessonIndex: number } | null>(null);
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const [stepAnswers, setStepAnswers] = useState<Record<string, string>>({});

    useEffect(() => {
        setNomination(initialNomination);
    }, [initialNomination]);
    
    const currentModule = activeLesson ? nomination.modules[activeLesson.moduleIndex] : null;
    const currentLesson = currentModule && activeLesson ? currentModule.lessons[activeLesson.lessonIndex] : null;
    const currentStep = currentLesson?.steps?.[currentStepIndex];

    const handleStartLesson = (moduleIndex: number, lessonIndex: number) => {
        setActiveLesson({ moduleIndex, lessonIndex });
        setCurrentStepIndex(0);
    };

    const handleStepComplete = async () => {
        if (!currentLesson || !currentModule || activeLesson === null || !currentStep) return;
        
        const nextStepIndex = currentStepIndex + 1;
        if (currentLesson.steps && nextStepIndex < currentLesson.steps.length) {
            setCurrentStepIndex(nextStepIndex);
        } else {
            // Lesson is complete
            await completeLeadershipLesson(nomination.id, currentModule.id, currentLesson.id);
            toast({ title: "Lesson Complete!", description: `"${currentLesson.title}" has been marked as complete.`});
            onUpdate();
            setActiveLesson(null); // Return to module list
            setStepAnswers({}); // Clear answers for next lesson
        }
    };
    
    const handleUpdateAnswer = (answer: string) => {
        if (!currentStep) return;
        setStepAnswers(prev => ({ ...prev, [currentStep.id]: answer }));
    };

    if (activeLesson !== null && currentLesson && currentStep) {
        return (
            <div className="p-4 md:p-8 space-y-6">
                <Card className="shadow-lg">
                    <CardHeader>
                        <div className="flex justify-between items-center">
                            <CardTitle className="flex items-center gap-3 text-2xl">{currentLesson.title}</CardTitle>
                            <Button variant="ghost" onClick={() => setActiveLesson(null)}>
                                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Modules
                            </Button>
                        </div>
                        <CardDescription>Module {activeLesson.moduleIndex + 1}: {currentModule?.title}</CardDescription>
                    </CardHeader>
                    
                    <CardContent>
                        <div className="p-4 border bg-muted/50 rounded-lg min-h-[300px]">
                            <LessonStepComponent 
                                step={currentStep} 
                                onComplete={handleStepComplete} 
                                onUpdateAnswer={handleUpdateAnswer}
                                answer={stepAnswers[currentStep.id]}
                            />
                        </div>
                    </CardContent>
                    
                    <CardFooter className="flex justify-between items-center">
                        <Button
                            variant="outline"
                            onClick={() => setCurrentStepIndex(p => p - 1)}
                            disabled={currentStepIndex === 0}
                        >
                            <ArrowLeft className="mr-2 h-4 w-4" /> Back
                        </Button>
                        
                        <p className="text-sm text-muted-foreground">
                            Step {currentStepIndex + 1} of {currentLesson.steps?.length || 1}
                        </p>
                        
                        {(currentStep.type === 'script') && (
                            <Button onClick={handleStepComplete}>
                                Next <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        )}
                    </CardFooter>
                </Card>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-8 space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="text-3xl font-bold font-headline flex items-center gap-3">
                        <LeadershipIcon className="h-8 w-8 text-red-500" />
                        My Leadership Journey
                    </CardTitle>
                    <CardDescription className="text-lg text-muted-foreground">
                        You've been nominated for the Leadership Coaching Program. Complete the modules below to grow your skills.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center gap-4">
                        <span className="text-sm font-medium">Progress:</span>
                        <Progress value={(nomination.modulesCompleted / nomination.modules.length) * 100} className="w-full max-w-sm" />
                        <span className="text-sm font-medium text-muted-foreground">
                            {Math.round((nomination.modulesCompleted / nomination.modules.length) * 100)}%
                        </span>
                    </div>
                </CardContent>
            </Card>

            <Accordion type="multiple" defaultValue={[`module-${nomination.modules.findIndex(m => !m.isCompleted)}`]} className="w-full space-y-4">
                {nomination.modules.map((module, moduleIndex) => (
                    <AccordionItem key={module.id} value={`module-${moduleIndex}`} className="border rounded-lg bg-card shadow-sm">
                        <AccordionTrigger className="p-4 hover:no-underline">
                            <div className="flex-1 text-left">
                                <p className="text-lg font-semibold">{`Module ${moduleIndex + 1}: ${module.title}`}</p>
                                <p className="text-sm text-muted-foreground">{module.description}</p>
                            </div>
                            <div className="ml-4">
                                {module.isCompleted ? (
                                    <Badge variant="success">Completed</Badge>
                                ) : (
                                    <Badge variant="secondary">{nomination.currentModuleId === module.id ? 'In Progress' : 'Not Started'}</Badge>
                                )}
                            </div>
                        </AccordionTrigger>
                        <AccordionContent className="p-4 border-t">
                            <div className="space-y-2">
                               {module.lessons.map((lesson, lessonIndex) => {
                                   const isLocked = moduleIndex > 0 && !nomination.modules[moduleIndex - 1].isCompleted; // Simple lock logic
                                   return (
                                        <div key={lesson.id} className="flex items-center justify-between p-3 rounded-md hover:bg-muted/50">
                                            <div className="flex items-center gap-3">
                                                {lesson.isCompleted ? <CheckCircle className="h-5 w-5 text-green-500" /> : <BookOpen className="h-5 w-5 text-muted-foreground" />}
                                                <p className="font-medium">{lesson.title}</p>
                                            </div>
                                            <Button 
                                                variant={lesson.isCompleted ? "secondary" : "default"} 
                                                size="sm"
                                                onClick={() => handleStartLesson(moduleIndex, lessonIndex)}
                                                disabled={isLocked || (lessonIndex > 0 && !module.lessons[lessonIndex-1].isCompleted)}
                                            >
                                                {lesson.isCompleted ? 'Review' : 'Start'}
                                            </Button>
                                        </div>
                                   )
                               })}
                            </div>
                        </AccordionContent>
                    </AccordionItem>
                ))}
            </Accordion>
        </div>
    );
}

function ManagerView() {
    const { role } = useRole();
    const [nominations, setNominations] = useState<LeadershipNomination[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchNominations = useCallback(async () => {
        if (!role) return;
        setIsLoading(true);
        const userNominations = await getLeadershipNominationsForManager(role);
        setNominations(userNominations);
        setIsLoading(false);
    }, [role]);

    useEffect(() => {
        fetchNominations();
    }, [fetchNominations]);

    return (
        <div className="p-4 md:p-8">
            <div className="flex justify-between items-center mb-6">
                <div className="space-y-1">
                    <CardTitle className="text-3xl font-bold font-headline flex items-center gap-3">
                        <LeadershipIcon className="h-8 w-8 text-red-500" />
                        Leadership Development
                    </CardTitle>
                    <CardDescription className="text-lg text-muted-foreground">
                        Nominate high-potential employees and track their progress in the leadership program.
                    </CardDescription>
                </div>
                <NominateDialog onNomination={fetchNominations} />
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Nomination Overview</CardTitle>
                </CardHeader>
                <CardContent>
                    {isLoading ? <Skeleton className="h-48 w-full" /> : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Employee</TableHead>
                                    <TableHead>Current Module</TableHead>
                                    <TableHead>Progress</TableHead>
                                    <TableHead>Growth Score</TableHead>
                                    <TableHead>Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {nominations.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center h-24">
                                            No employees have been nominated yet.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    nominations.map(n => (
                                        <TableRow key={n.id}>
                                            <TableCell>
                                                <div className="font-medium">{roleUserMapping[n.nomineeRole]?.name || n.nomineeRole}</div>
                                            </TableCell>
                                            <TableCell>{n.modules.find(m => m.id === n.currentModuleId)?.title || 'N/A'}</TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <Progress value={(n.modulesCompleted / n.modules.length) * 100} className="w-24" />
                                                    <span>{Math.round((n.modulesCompleted / n.modules.length) * 100)}%</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>7.5/10</TableCell>
                                            <TableCell>
                                                <Button variant="ghost" size="sm">View Report</Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

export default function LeadershipPage() {
  const { role, setRole, isLoading: isRoleLoading } = useRole();
  const [nomination, setNomination] = useState<LeadershipNomination | null>(null);
  const [isCheckingNomination, setIsCheckingNomination] = useState(true);

  const fetchNominationData = useCallback(async () => {
    if (!role) return;
    setIsCheckingNomination(true);
    const userNomination = await getLeadershipNominationForUser(role);
    setNomination(userNomination);
    setIsCheckingNomination(false);
  }, [role]);

  useEffect(() => {
    if(role) {
        fetchNominationData();
         window.addEventListener('feedbackUpdated', fetchNominationData);
    }
     return () => {
      window.removeEventListener('feedbackUpdated', fetchNominationData);
    };
  }, [role, fetchNominationData]);

  const isLoading = isRoleLoading || isCheckingNomination;

  if (isLoading || !role) {
    return (
      <DashboardLayout role="Manager" onSwitchRole={() => {}}>
        <Skeleton className="w-full h-screen" />
      </DashboardLayout>
    );
  }
  
  // Managerial roles see the main dashboard.
  const isManagerialRole = ['Manager', 'HR Head'].includes(role);
  if (isManagerialRole) {
      return (
          <DashboardLayout role={role} onSwitchRole={setRole}>
              <ManagerView />
          </DashboardLayout>
      );
  }

  // Nominated employees see the learner view.
  if (nomination) {
    return (
        <DashboardLayout role={role} onSwitchRole={setRole}>
            <LearnerView initialNomination={nomination} onUpdate={fetchNominationData} />
        </DashboardLayout>
    );
  }

  // Fallback for non-managerial roles who are not nominated.
  return (
    <DashboardLayout role={role} onSwitchRole={setRole}>
      <div className="p-8"><p>Access to the Leadership hub is by nomination only.</p></div>
    </DashboardLayout>
  );
}
