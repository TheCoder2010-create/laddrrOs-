

"use client";

import { useState, useEffect, useCallback } from 'react';
import type { Role } from '@/hooks/use-role';
import { useRole } from '@/hooks/use-role';
import DashboardLayout from '@/components/dashboard-layout';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { roleUserMapping } from '@/lib/role-mapping';
import { FlaskConical, PlusCircle, Users, Briefcase, UserCheck, Loader2, Send, Info, CheckCircle, BookOpen } from 'lucide-react';
import { getNominationsForManager, nominateUser, getNominationForUser, type Nomination, completeModule, savePreAssessment } from '@/services/interviewer-lab-service';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { NetsInitialInput, NetsAnalysisOutput, InterviewerAnalysisOutput } from '@/ai/schemas/nets-schemas';
import SimulationArena from '@/components/simulation-arena';
import { analyzeInterview } from '@/ai/flows/analyze-interview-flow';
import type { InterviewerConversationInput } from '@/ai/schemas/interviewer-lab-schemas';


function NominateDialog({ onNomination }: { onNomination: () => void }) {
    const { role } = useRole();
    const { toast } = useToast();
    const [isOpen, setIsOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [nominee, setNominee] = useState<Role | null>(null);
    const [targetRole, setTargetRole] = useState<string | null>(null);

    const availableNominees: Role[] = ['Team Lead', 'AM', 'Employee'];
    const targetRoles = ['Entry Level', 'IC', 'TL', 'Manager'];

    const handleSubmit = async () => {
        if (!role || !nominee || !targetRole) {
            toast({ variant: 'destructive', title: 'Missing fields', description: 'Please select a nominee and target role.' });
            return;
        }
        setIsSubmitting(true);
        try {
            await nominateUser(role, nominee, targetRole);
            toast({ title: 'Nomination Successful!', description: `${roleUserMapping[nominee].name} has been nominated for interviewer coaching.` });
            setIsOpen(false);
            setNominee(null);
            setTargetRole(null);
            onNomination();
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
                    <PlusCircle className="mr-2" />
                    Nominate User
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Nominate for Interviewer Coaching</DialogTitle>
                    <DialogDescription>
                        Select a team member to begin the Laddrr Interviewer Coaching Program. They will start with a baseline mock interview.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="nominee">Team Member</Label>
                        <Select onValueChange={(value) => setNominee(value as Role)} value={nominee || ''}>
                            <SelectTrigger id="nominee">
                                <SelectValue placeholder="Select a user to nominate" />
                            </SelectTrigger>
                            <SelectContent>
                                {availableNominees.map(role => (
                                    <SelectItem key={role} value={role}>{roleUserMapping[role].name} ({role})</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <div className="flex items-center gap-2">
                                        <Label htmlFor="target-role">Target Interview Level</Label>
                                        <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                                    </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p className="max-w-xs">
                                        This defines the type of candidate the nominee is being trained to interview (e.g., training to interview a Manager requires different skills than for an IC).
                                    </p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>

                        <Select onValueChange={setTargetRole} value={targetRole || ''}>
                            <SelectTrigger id="target-role">
                                <SelectValue placeholder="Select the target level" />
                            </SelectTrigger>
                            <SelectContent>
                                {targetRoles.map(role => (
                                    <SelectItem key={role} value={role}>{role}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <DialogFooter>
                    <DialogClose asChild><Button variant="ghost">Cancel</Button></DialogClose>
                    <Button onClick={handleSubmit} disabled={isSubmitting || !nominee || !targetRole}>
                        {isSubmitting && <Loader2 className="mr-2 animate-spin" />}
                        Confirm Nomination
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function LearnerView({ initialNomination, onUpdate }: { initialNomination: Nomination, onUpdate: () => void }) {
    const { toast } = useToast();
    const [nomination, setNomination] = useState(initialNomination);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [config, setConfig] = useState<NetsInitialInput | null>(null);

    const handleStartPreAssessment = () => {
        setConfig({
            persona: 'Candidate', // The AI plays a generic candidate
            scenario: `This is a pre-assessment mock interview for an interviewer. I am the interviewer, and you are the candidate. Please answer my questions as a candidate would.`,
            difficulty: 'neutral',
        });
    };

    const handleExitSimulation = async (messages?: { role: 'user' | 'model', content: string }[]) => {
        if (!messages || messages.length === 0) {
            setConfig(null); // Just exit if there's no conversation
            return;
        }

        const transcript = messages.map(m => `${m.role === 'user' ? 'Interviewer' : 'Candidate'}: ${m.content}`).join('\n');
        
        try {
            const analysisInput: InterviewerConversationInput = { transcript };
            const analysisResult = await analyzeInterview(analysisInput);
            
            await savePreAssessment(nomination.id, analysisResult);

            toast({
                title: "Pre-Assessment Complete!",
                description: "Your baseline score has been saved. You can now begin your training modules.",
            });
            onUpdate(); // Notify parent to re-fetch and update the view
        } catch (e) {
            console.error("Failed to analyze interview", e);
            toast({ variant: 'destructive', title: "Analysis Failed", description: "Could not generate a score for this session." });
        } finally {
            setConfig(null);
        }
    };

    const handleCompleteModule = async (moduleId: string) => {
        setIsSubmitting(true);
        try {
            const updatedNomination = await completeModule(nomination.id, moduleId);
            setNomination(updatedNomination);
            toast({ title: "Module Completed!", description: "Your progress has been updated."});
        } catch (error) {
            console.error("Failed to complete module", error);
            toast({ variant: 'destructive', title: "Update Failed"});
        } finally {
            setIsSubmitting(false);
        }
    };

    const allModulesCompleted = nomination.modulesCompleted === nomination.modulesTotal;

    if (config) {
        return (
            <div className="p-4 md:p-8 flex items-center justify-center">
                 <SimulationArena 
                    initialConfig={config} 
                    onExit={handleExitSimulation} 
                    arenaTitle="Pre-Assessment Mock Interview"
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
                        You've been nominated for Laddrr's Interviewer Coaching Program. Complete the modules below to unlock your certification.
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

             {nomination.status !== 'Pre-assessment pending' && (
                 <div className="space-y-4">
                    {nomination.modules.map((module, index) => (
                        <Card key={module.id} className={module.isCompleted ? 'bg-green-500/5 border-green-500/20' : 'bg-card'}>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <div className="space-y-1.5">
                                    <CardTitle className="flex items-center gap-3">
                                        <BookOpen className="h-5 w-5 text-primary" />
                                        Module {index + 1}: {module.title}
                                    </CardTitle>
                                    <CardDescription>{module.description}</CardDescription>
                                </div>
                                {module.isCompleted ? (
                                    <div className="flex items-center gap-2 text-green-600 dark:text-green-400 font-semibold">
                                        <CheckCircle className="h-5 w-5" /> Completed
                                    </div>
                                ) : (
                                    <Button size="sm" onClick={() => handleCompleteModule(module.id)} disabled={isSubmitting}>
                                        {isSubmitting ? <Loader2 className="animate-spin" /> : 'Mark as Complete'}
                                    </Button>
                                )}
                            </CardHeader>
                             {!module.isCompleted && (
                                <CardContent>
                                    <div className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground p-4 border rounded-lg bg-muted/30">
                                        <p>{module.content}</p>
                                        <h4>Key Takeaways</h4>
                                        <ul>
                                            <li>This is placeholder content for the key takeaways.</li>
                                            <li>Each module will contain specific learning points and examples.</li>
                                            <li>Quizzes and reflection exercises can be added here.</li>
                                        </ul>
                                    </div>
                                </CardContent>
                            )}
                        </Card>
                    ))}
                 </div>
            )}
            
            {allModulesCompleted && nomination.status !== 'Certified' && (
                <Card className="border-primary/50">
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


function ManagerView() {
    const { role } = useRole();
    const [nominations, setNominations] = useState<Nomination[]>([]);
    const [isLoading, setIsLoading] = useState(true);

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
            <div className="flex justify-between items-center">
                <div className="space-y-1">
                    <h1 className="text-3xl font-bold font-headline flex items-center gap-3">
                        <FlaskConical className="h-8 w-8 text-primary" />
                        Interviewer Lab
                    </h1>
                    <p className="text-muted-foreground">Nominate, track, and coach your team members through the Interviewer Coaching Program.</p>
                </div>
                <NominateDialog onNomination={fetchNominations} />
            </div>

             <Card>
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
                                            <Button variant="ghost" size="sm">View</Button>
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
    
    // Manager always sees the ManagerView. Others see LearnerView if nominated.
    if (role === 'Manager') {
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
