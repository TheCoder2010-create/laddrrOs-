"use client";

import { useState, useTransition, useRef, useEffect, useCallback } from 'react';
import type { Role } from '@/hooks/use-role';
import { useRole, availableRolesForAssignment } from '@/hooks/use-role';
import DashboardLayout from '@/components/dashboard-layout';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Bot, User, Send, Loader2, ChevronsRight, ArrowLeft, SlidersHorizontal, Briefcase, Users, UserCheck, ShieldCheck, UserCog, Lightbulb, Play, ClipboardEdit, Edit, FileClock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { runNetsConversation } from '@/ai/flows/nets-flow';
import type { NetsConversationInput, NetsMessage, NetsInitialInput, NetsAnalysisOutput } from '@/ai/schemas/nets-schemas';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { MagicWandIcon } from '@/components/ui/magic-wand-icon';
import { roleUserMapping, formatActorName } from '@/lib/role-mapping';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { generateNetsSuggestion } from '@/ai/flows/generate-nets-suggestion-flow';
import { generateNetsNudge } from '@/ai/flows/generate-nets-nudge-flow';
import { completePracticeScenario, getPracticeScenariosForUser, AssignedPracticeScenario, assignPracticeScenario } from '@/services/feedback-service';
import { analyzeNetsConversation } from '@/ai/flows/analyze-nets-conversation-flow';
import { formatDistanceToNow } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';


const difficulties = [
    { value: "friendly", label: "Friendly" },
    { value: "neutral", label: "Neutral" },
    { value: "strict", label: "Strict / Defensive" },
    { value: "aggressive", label: "Aggressive" },
];

const personaIcons: Record<string, React.ElementType> = {
    'Team Lead': Users,
    'AM': UserCog,
    'Manager': Briefcase,
    'HR Head': ShieldCheck,
    'Employee': UserCheck,
};


function AssignPracticeDialog({ onAssign }: { onAssign: () => void }) {
    const { role } = useRole();
    const { toast } = useToast();
    const [selectedUser, setSelectedUser] = useState<Role | null>(null);
    const [scenario, setScenario] = useState('');
    const [persona, setPersona] = useState<Role | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isOpen, setIsOpen] = useState(false);

    const handleSubmit = async () => {
        if (!role || !selectedUser || !scenario || !persona) {
            toast({
                variant: 'destructive',
                title: "Missing Information",
                description: "Please fill out all fields."
            });
            return;
        }

        setIsSubmitting(true);
        try {
            await assignPracticeScenario(role, selectedUser, scenario, persona);
            toast({
                title: "Practice Scenario Assigned!",
                description: `${roleUserMapping[selectedUser].name} has been assigned a new practice scenario.`
            });
            // Reset form and close dialog
            setSelectedUser(null);
            setScenario('');
            setPersona(null);
            setIsOpen(false);
            onAssign(); // Notify parent to re-fetch
        } catch (error) {
            console.error("Failed to assign practice scenario", error);
            toast({ variant: 'destructive', title: "Assignment Failed" });
        } finally {
            setIsSubmitting(false);
        }
    };
    
    return (
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button variant="outline">
            <Edit className="mr-2 h-4 w-4" />
            Assign
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ClipboardEdit className="text-primary" />
              Assign Practice Scenario
            </DialogTitle>
            <DialogDescription>
              Assign a specific conversation scenario to a team member for them to practice.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
              <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="assign-user" className="text-right">Assign To</Label>
                  <div className="col-span-3">
                    <Select
                        value={selectedUser ?? ''}
                        onValueChange={(value) => setSelectedUser(value as Role)}
                    >
                        <SelectTrigger id="assign-user">
                            <SelectValue placeholder="Select a team member" />
                        </SelectTrigger>
                        <SelectContent>
                            {availableRolesForAssignment.map(memberRole => (
                                <SelectItem key={memberRole} value={memberRole}>
                                    {roleUserMapping[memberRole].name} - ({memberRole})
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                  </div>
              </div>
              <div className="space-y-2">
                  <Label htmlFor="assign-scenario">Scenario to Practice</Label>
                  <Textarea
                      id="assign-scenario"
                      placeholder="e.g., Practice delivering the Q3 project update to the leadership team..."
                      rows={3}
                      value={scenario}
                      onChange={(e) => setScenario(e.target.value)}
                  />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="assign-persona" className="text-right">Persona</Label>
                   <div className="col-span-3">
                    <Select
                        value={persona ?? ''}
                        onValueChange={(value) => setPersona(value as Role)}
                    >
                        <SelectTrigger id="assign-persona">
                            <SelectValue placeholder="Select the AI persona" />
                        </SelectTrigger>
                        <SelectContent>
                            {Object.keys(personaIcons).map(p => (
                               <SelectItem key={p} value={p}>{p}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                  </div>
              </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="ghost">Cancel</Button>
            </DialogClose>
            <Button onClick={handleSubmit} disabled={isSubmitting || !selectedUser || !scenario || !persona}>
                {isSubmitting ? <Loader2 className="mr-2 animate-spin" /> : <Send className="mr-2" />}
                Assign Scenario
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
}

function SimulationArena({
    initialConfig,
    assignedScenarioId,
    onExit
}: {
    initialConfig: NetsInitialInput,
    assignedScenarioId?: string,
    onExit: (analysis?: NetsAnalysisOutput) => void
}) {
    const [isPending, startTransition] = useTransition();
    const [isGettingNudge, startNudgeTransition] = useTransition();
    const [isAnalyzing, startAnalysis] = useTransition();
    const [messages, setMessages] = useState<NetsMessage[]>([]);
    const [userInput, setUserInput] = useState('');
    const { toast } = useToast();
    const scrollAreaRef = useRef<HTMLDivElement>(null);
    const router = useRouter();


    const handleExit = () => {
        startAnalysis(async () => {
            try {
                const analysisInput: NetsConversationInput = {
                    ...initialConfig,
                    history: messages.filter(m => m.role !== 'system'),
                };
                const analysisResult = await analyzeNetsConversation(analysisInput);
                
                if (assignedScenarioId) {
                    await completePracticeScenario(assignedScenarioId, analysisResult);
                }
                
                toast({
                    title: "Simulation Complete!",
                    description: "Your scorecard has been updated with the results.",
                });

                onExit(analysisResult);

            } catch(e) {
                console.error("Failed to analyze conversation", e);
                toast({ variant: 'destructive', title: "Analysis Failed", description: "Could not generate a scorecard for this session." });
                onExit(); // Exit without analysis
            }
        });
    };

    useEffect(() => {
        // Add the initial system message and trigger the first AI response
        const startSimulation = () => {
            const initialSystemMessage: NetsMessage = {
                role: 'system',
                content: `Simulation started. The AI is playing the role of a ${initialConfig.persona}.`
            };
            const currentMessages = [initialSystemMessage];
            setMessages(currentMessages);

            startTransition(async () => {
                try {
                    const input: NetsConversationInput = {
                        ...initialConfig,
                        history: [], // History is empty for the first turn
                    };
                    const aiResponse = await runNetsConversation(input);
                    setMessages(prev => [...prev, aiResponse]);
                } catch (error) {
                    console.error("AI simulation failed on start", error);
                    toast({ variant: 'destructive', title: "Simulation Error", description: "The AI could not start the conversation. Please try again." });
                    onExit(); // Exit if the start fails
                }
            });
        };

        startSimulation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [initialConfig, toast]);
    
    useEffect(() => {
        // Scroll to bottom when new messages are added
        if (scrollAreaRef.current) {
            scrollAreaRef.current.scrollTo({ top: scrollAreaRef.current.scrollHeight, behavior: 'smooth' });
        }
    }, [messages]);

    const handleSendMessage = () => {
        if (!userInput.trim()) return;

        const newUserMessage: NetsMessage = { role: 'user', content: userInput };
        const currentMessages = [...messages, newUserMessage];
        setMessages(currentMessages);
        setUserInput('');

        startTransition(async () => {
            try {
                const input: NetsConversationInput = {
                    ...initialConfig,
                    history: currentMessages.filter(m => m.role !== 'system'), // Don't send system messages to AI
                };
                const aiResponse = await runNetsConversation(input);
                setMessages(prev => [...prev, aiResponse]);
            } catch (error) {
                console.error("AI simulation failed", error);
                toast({ variant: 'destructive', title: "Simulation Error", description: "The AI could not respond. Please try again." });
                // Remove the user message that failed to get a response
                setMessages(prev => prev.slice(0, -1));
            }
        });
    };
    
    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if (!isPending) {
                handleSendMessage();
            }
        }
    };
    
    const handleGetNudge = () => {
        startNudgeTransition(async () => {
            try {
                const input: NetsConversationInput = {
                    ...initialConfig,
                    history: messages.filter(m => m.role !== 'system'),
                };
                const result = await generateNetsNudge(input);
                toast({
                    title: "Coach's Nudge",
                    description: result.nudge,
                    duration: 8000,
                });
            } catch (error) {
                console.error("Failed to get nudge", error);
                toast({ variant: 'destructive', title: "Nudge Failed", description: "Could not get a hint at this time." });
            }
        });
    };

    return (
        <Card className="w-full max-w-4xl mx-auto shadow-2xl shadow-primary/10">
            <CardHeader>
                 <div className="flex justify-between items-center">
                    <CardTitle className="flex items-center gap-2 text-2xl">
                        <MagicWandIcon className="h-6 w-6 text-primary" />
                        Conversation Arena
                    </CardTitle>
                     <Button variant="ghost" onClick={handleExit} disabled={isAnalyzing}>
                        {isAnalyzing ? (
                            <>
                                <Loader2 className="mr-2 animate-spin" /> Analyzing...
                            </>
                        ) : (
                            <>
                                <ArrowLeft className="mr-2" /> End & Analyze
                            </>
                        )}
                    </Button>
                </div>
                <CardDescription>
                    You are in a simulation with a <span className="font-semibold text-primary">{initialConfig.persona}</span>.
                    The scenario is: <span className="font-semibold text-primary">{initialConfig.scenario}</span>.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <ScrollArea className="h-[50vh] w-full border rounded-lg p-4 space-y-4" ref={scrollAreaRef}>
                    {messages.map((msg, index) => (
                        <div key={index} className={cn("flex items-start gap-3", msg.role === 'user' ? 'justify-end' : 'justify-start')}>
                             {msg.role === 'model' && <Avatar icon={<Bot className="text-primary" />} />}
                             {msg.role === 'system' ? (
                                <div className="text-center text-xs text-muted-foreground italic w-full py-4">{msg.content}</div>
                             ) : (
                                <div className={cn("max-w-[75%] rounded-lg px-4 py-2", msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted')}>
                                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                                </div>
                             )}
                            {msg.role === 'user' && <Avatar icon={<User />} />}
                        </div>
                    ))}
                    {isPending && messages.length > 0 && (
                        <div className="flex items-start gap-3 justify-start">
                            <Avatar icon={<Bot className="text-primary" />} />
                            <div className="bg-muted rounded-lg px-4 py-3">
                                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                            </div>
                        </div>
                    )}
                </ScrollArea>
            </CardContent>
            <CardFooter>
                 <div className="flex w-full items-center gap-2 relative">
                    <Button variant="ghost" size="icon" onClick={handleGetNudge} disabled={isGettingNudge || isPending} className="absolute left-2 top-1/2 -translate-y-1/2">
                         {isGettingNudge ? <Loader2 className="animate-spin text-yellow-400" /> : <Lightbulb className="text-yellow-400" />}
                    </Button>
                    <Textarea
                        value={userInput}
                        onChange={(e) => setUserInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Type your response here..."
                        className="pl-14 pr-12"
                        rows={1}
                        disabled={isPending}
                    />
                    <Button
                        size="icon"
                        onClick={handleSendMessage}
                        disabled={isPending || !userInput.trim()}
                        className="absolute right-2"
                    >
                        <Send />
                    </Button>
                </div>
            </CardFooter>
        </Card>
    );
}

const Avatar = ({ icon }: { icon: React.ReactNode }) => (
    <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
        {icon}
    </div>
);


function SetupView({ onStart, role, assignedScenarios, onAssign }: { onStart: (config: NetsInitialInput, assignedScenarioId?: string) => void, role: Role, assignedScenarios: AssignedPracticeScenario[], onAssign: () => void }) {
    const { availableRoles } = useRole();
    const [selectedPersona, setSelectedPersona] = useState<Role | null>(null);
    const [scenario, setScenario] = useState('');
    const [difficulty, setDifficulty] = useState('neutral');
    const [isSuggesting, startSuggestion] = useTransition();
    const { toast } = useToast();

    const handleStart = (assignedScenarioId?: string) => {
        if (!selectedPersona || !scenario) return;
        onStart({
            persona: selectedPersona,
            scenario: scenario,
            difficulty: difficulty,
        }, assignedScenarioId);
    };

    const handleGetSuggestion = () => {
        startSuggestion(async () => {
            try {
                const result = await generateNetsSuggestion({ forRole: role });
                setScenario(result.suggestedScenario);
                toast({
                    title: "Scenario Suggested!",
                    description: "A practice scenario has been generated for you based on your recent activity."
                });
            } catch (e) {
                console.error("Failed to get suggestion", e);
                toast({
                    variant: "destructive",
                    title: "Suggestion Failed",
                    description: "Could not generate a suggestion at this time."
                });
            }
        });
    };

    const handleStartAssigned = (assigned: AssignedPracticeScenario) => {
        // Pre-fill the setup for the assigned scenario
        setSelectedPersona(assigned.persona as Role);
        setScenario(assigned.scenario);
        // Start simulation immediately
        onStart({
            persona: assigned.persona,
            scenario: assigned.scenario,
            difficulty: 'neutral', // default difficulty for assigned
        }, assigned.id);
    };

    if (!selectedPersona) {
        return (
             <div className="w-full max-w-4xl mx-auto">
                <div className="mb-8 flex justify-between items-center">
                    <h1 className="text-3xl font-bold font-headline flex items-center gap-2">
                        <MagicWandIcon className="h-8 w-8 text-primary" />
                         Nets – Conversation Arena
                    </h1>
                     <div className="flex items-center gap-2">
                         <Button variant="outline" asChild>
                            <Link href="/nets/scorecard">Scorecard</Link>
                        </Button>
                        {availableRolesForAssignment.includes(role) && <AssignPracticeDialog onAssign={onAssign} />}
                     </div>
                </div>

                <h2 className="text-xl font-semibold mb-3 text-center">Start a new session:</h2>
                <p className="text-lg text-muted-foreground text-center mb-6">
                    Choose a persona to practice your conversation with.
                </p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {availableRoles.filter(r => r !== 'Anonymous').map(role => {
                         const Icon = personaIcons[role] || Briefcase;
                         return (
                            <button
                                key={role}
                                onClick={() => setSelectedPersona(role)}
                                className="group flex flex-col items-center justify-center gap-2 p-4 border rounded-lg hover:bg-accent hover:border-primary transition-colors h-28"
                            >
                                <Icon className="h-8 w-8 text-muted-foreground group-hover:text-primary" />
                                <span className="font-semibold text-foreground">{role}</span>
                            </button>
                         )
                    })}
                </div>
                
                {assignedScenarios.length > 0 && (
                    <div className="mt-12">
                        <h2 className="text-xl font-semibold mb-3 flex items-center gap-2">
                            <ClipboardEdit className="h-5 w-5 text-purple-500" />
                            Assigned for Practice
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {assignedScenarios.map(s => (
                                <Card key={s.id} className="bg-purple-500/5">
                                    <CardHeader className="pb-3">
                                        <CardDescription>
                                            Assigned by {formatActorName(s.assignedBy)} {formatDistanceToNow(new Date(s.assignedAt), { addSuffix: true })}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="font-medium text-foreground-primary">{s.scenario}</p>
                                        <p className="text-sm text-muted-foreground mt-1">Persona: {s.persona}</p>
                                    </CardContent>
                                    <CardFooter>
                                        <Button className="w-full bg-purple-600 hover:bg-purple-700" onClick={() => handleStartAssigned(s)}>
                                            <Play className="mr-2" /> Start Practice
                                        </Button>
                                    </CardFooter>
                                </Card>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        );
    }
    
    const Icon = personaIcons[selectedPersona] || Briefcase;

    return (
        <Card className="w-full max-w-2xl mx-auto">
            <CardHeader>
                 <div className="flex items-start justify-between">
                     <div className="space-y-1.5">
                        <CardTitle className="flex items-center gap-2 text-3xl font-bold font-headline">
                            <MagicWandIcon className="h-8 w-8 text-primary" />
                             Configure Simulation
                        </CardTitle>
                        <CardDescription className="text-lg flex items-center gap-2">
                             Practicing with: <Icon className="h-5 w-5 text-primary" /> <span className="font-bold text-primary">{selectedPersona}</span>
                        </CardDescription>
                    </div>
                    <Button variant="ghost" onClick={() => setSelectedPersona(null)}>
                        <ArrowLeft className="mr-2" /> Back
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="space-y-6 pt-2">
                <div className="space-y-2">
                    <div className="flex justify-between items-center">
                        <Label htmlFor="scenario">Describe the scenario to practice</Label>
                        <Button variant="ghost" size="sm" onClick={handleGetSuggestion} disabled={isSuggesting}>
                            {isSuggesting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lightbulb className="h-4 w-4 mr-2 text-yellow-400" />}
                            Get Suggestion
                        </Button>
                    </div>
                    <Textarea 
                        id="scenario" 
                        placeholder="e.g., Giving tough feedback about missed deadlines to a good performer."
                        rows={4}
                        value={scenario}
                        onChange={(e) => setScenario(e.target.value)}
                    />
                </div>
                
                <div className="space-y-2">
                    <Label htmlFor="difficulty">Set AI Demeanor</Label>
                    <Select value={difficulty} onValueChange={setDifficulty}>
                        <SelectTrigger id="difficulty">
                            <SelectValue placeholder="Select a difficulty" />
                        </SelectTrigger>
                        <SelectContent>
                            {difficulties.map(d => <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
            </CardContent>
            <CardFooter>
                <Button className="w-full" size="lg" onClick={() => handleStart()} disabled={!scenario}>
                    Start Practice <ChevronsRight className="ml-2" />
                </Button>
            </CardFooter>
        </Card>
    );
}

export default function NetsPage() {
    const { role, setRole, isLoading: isRoleLoading } = useRole();
    const router = useRouter();
    const { toast } = useToast();
    const [config, setConfig] = useState<NetsInitialInput | null>(null);
    const [assignedScenarioId, setAssignedScenarioId] = useState<string | undefined>();
    const [assignedScenarios, setAssignedScenarios] = useState<AssignedPracticeScenario[]>([]);
    
    const fetchAssignedScenarios = useCallback(async () => {
        if (!role) return;
        const scenarios = await getPracticeScenariosForUser(role);
        setAssignedScenarios(scenarios);
    }, [role]);

    useEffect(() => {
        fetchAssignedScenarios();

        window.addEventListener('feedbackUpdated', fetchAssignedScenarios);
        return () => {
            window.removeEventListener('feedbackUpdated', fetchAssignedScenarios);
        };
    }, [fetchAssignedScenarios]);

    const handleStartSimulation = (newConfig: NetsInitialInput, scenarioId?: string) => {
        setConfig(newConfig);
        setAssignedScenarioId(scenarioId);
        toast({ title: "Simulation Started", description: "The AI will begin the conversation." });
    };

    const handleExitSimulation = (analysis?: NetsAnalysisOutput) => {
        setConfig(null);
        setAssignedScenarioId(undefined);
        fetchAssignedScenarios(); // Re-fetch in case a scenario was completed
        if (analysis) {
             // After analysis, redirect to the scorecard to show the new result
            router.push('/nets/scorecard');
        }
    }
    
    if (isRoleLoading || !role) {
        return <DashboardLayout role="Employee" onSwitchRole={() => {}}><Skeleton className="w-full h-screen" /></DashboardLayout>;
    }

    return (
        <DashboardLayout role={role} onSwitchRole={setRole}>
            <div className="p-4 md:p-8 flex items-center justify-center">
                 {config ? (
                    <SimulationArena 
                        initialConfig={config} 
                        assignedScenarioId={assignedScenarioId} 
                        onExit={handleExitSimulation} 
                    />
                ) : (
                    <SetupView onStart={handleStartSimulation} role={role} assignedScenarios={assignedScenarios} onAssign={fetchAssignedScenarios} />
                )}
            </div>
        </DashboardLayout>
    );
}
