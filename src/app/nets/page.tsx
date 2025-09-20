
"use client";

import { useState, useTransition, useRef, useEffect, useCallback } from 'react';
import type { Role } from '@/hooks/use-role';
import { useRole } from '@/hooks/use-role';
import DashboardLayout from '@/components/dashboard-layout';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Bot, User, Send, Loader2, ChevronsRight, ArrowLeft, SlidersHorizontal, Briefcase, Users, UserCheck, ShieldCheck, UserCog } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { runNetsConversation } from '@/ai/flows/nets-flow';
import type { NetsConversationInput, NetsMessage, NetsInitialInput } from '@/ai/schemas/nets-schemas';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { MagicWandIcon } from '@/components/ui/magic-wand-icon';
import { roleUserMapping } from '@/lib/role-mapping';
import Link from 'next/link';

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


function SimulationArena({
    initialConfig,
    onExit
}: {
    initialConfig: NetsInitialInput,
    onExit: () => void
}) {
    const [isPending, startTransition] = useTransition();
    const [messages, setMessages] = useState<NetsMessage[]>([]);
    const [userInput, setUserInput] = useState('');
    const { toast } = useToast();
    const scrollAreaRef = useRef<HTMLDivElement>(null);

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
    }, [initialConfig, onExit, toast]);
    
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

    return (
        <Card className="w-full max-w-4xl mx-auto shadow-2xl shadow-primary/10">
            <CardHeader>
                 <div className="flex justify-between items-center">
                    <CardTitle className="flex items-center gap-2 text-2xl">
                        <MagicWandIcon className="h-6 w-6 text-primary" />
                        Conversation Arena
                    </CardTitle>
                    <Button variant="ghost" onClick={onExit}><ArrowLeft className="mr-2" /> End Simulation</Button>
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
                    <Textarea
                        value={userInput}
                        onChange={(e) => setUserInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Type your response here..."
                        className="pr-12"
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


function SetupView({ onStart }: { onStart: (config: NetsInitialInput) => void }) {
    const { availableRoles } = useRole();
    const [selectedPersona, setSelectedPersona] = useState<Role | null>(null);
    const [scenario, setScenario] = useState('');
    const [difficulty, setDifficulty] = useState('neutral');

    const handleStart = () => {
        if (!selectedPersona || !scenario) return;
        onStart({
            persona: selectedPersona,
            scenario: scenario,
            difficulty: difficulty,
        });
    };

    if (!selectedPersona) {
        return (
             <div className="w-full max-w-3xl mx-auto">
                 <div className="mb-8 text-center flex justify-between items-center">
                    <h1 className="text-3xl font-bold font-headline flex items-center gap-2">
                        <MagicWandIcon className="h-8 w-8 text-primary" />
                         Nets – Conversation Arena
                    </h1>
                     <Button variant="outline" asChild>
                        <Link href="/nets/scorecard">Scorecard</Link>
                    </Button>
                </div>
                <p className="text-lg text-muted-foreground text-center mb-8">
                    Choose a persona to practice your conversation with.
                </p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {availableRoles.filter(r => r !== 'Anonymous').map(role => {
                         const Icon = personaIcons[role] || Briefcase;
                         return (
                            <button
                                key={role}
                                onClick={() => setSelectedPersona(role)}
                                className="flex flex-col items-center justify-center gap-2 p-4 border rounded-lg hover:bg-accent hover:border-primary transition-colors h-28"
                            >
                                <Icon className="h-8 w-8 text-muted-foreground group-hover:text-primary" />
                                <span className="font-semibold text-foreground">{role}</span>
                            </button>
                         )
                    })}
                </div>
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
                    <Label htmlFor="scenario">Describe the scenario to practice</Label>
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
                <Button className="w-full" size="lg" onClick={handleStart} disabled={!scenario}>
                    Start Practice <ChevronsRight className="ml-2" />
                </Button>
            </CardFooter>
        </Card>
    );
}

export default function NetsPage() {
    const { role, setRole, isLoading: isRoleLoading } = useRole();
    const { toast } = useToast();
    const [config, setConfig] = useState<NetsInitialInput | null>(null);
    
    if (isRoleLoading || !role) {
        return <DashboardLayout role="Employee" onSwitchRole={() => {}}><Skeleton className="w-full h-screen" /></DashboardLayout>;
    }

    const handleStartSimulation = (newConfig: NetsInitialInput) => {
        setConfig(newConfig);
        toast({ title: "Simulation Started", description: "The AI will begin the conversation." });
    };
    
    return (
        <DashboardLayout role={role} onSwitchRole={setRole}>
            <div className="p-4 md:p-8 flex items-center justify-center">
                 {config ? (
                    <SimulationArena initialConfig={config} onExit={() => setConfig(null)} />
                ) : (
                    <SetupView onStart={handleStartSimulation} />
                )}
            </div>
        </DashboardLayout>
    );
}
