
"use client";

import { useState, useTransition, useRef, useEffect, useCallback } from 'react';
import { useRole } from '@/hooks/use-role';
import DashboardLayout from '@/components/dashboard-layout';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Bot, User, Send, Loader2, ChevronsRight, CornerDownLeft, Sparkles, SlidersHorizontal, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { runNetsConversation, type NetsConversationInput, type NetsMessage, type NetsInitialInput } from '@/ai/flows/nets-flow';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { MagicWandIcon } from '@/components/ui/magic-wand-icon';


const scenarios = [
    { value: "tough_feedback", label: "Give tough feedback to a direct report" },
    { value: "ask_for_raise", label: "Ask for a promotion or raise" },
    { value: "conflict_resolution", label: "Resolve a conflict with a peer" },
    { value: "performance_review", label: "Conduct a performance review" },
    { value: "interview_practice", label: "Practice for a job interview" },
];

const personas = [
    { value: "supportive", label: "Supportive Colleague" },
    { value: "challenging", label: "Challenging Manager" },
    { value: "distracted", label: "Distracted Peer" },
    { value: "hostile", label: "Hostile Client" },
    { value: "neutral_hr", label: "Neutral HR Representative" },
];

const difficulties = [
    { value: "friendly", label: "Friendly" },
    { value: "neutral", label: "Neutral" },
    { value: "strict", label: "Strict / Defensive" },
    { value: "aggressive", label: "Aggressive" },
];

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
        // Add the initial system message
        setMessages([{
            role: 'system',
            content: `Simulation started. The AI is playing the role of a ${initialConfig.persona.toLowerCase()}. You can start the conversation.`
        }]);
    }, [initialConfig]);
    
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
                    history: currentMessages,
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
                    You are in a simulation with a <span className="font-semibold text-primary">{initialConfig.persona.toLowerCase()}</span>.
                    The scenario is: <span className="font-semibold text-primary">{scenarios.find(s => s.value === initialConfig.scenario)?.label}</span>.
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
                    {isPending && (
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


export default function NetsPage() {
    const { role, setRole, isLoading: isRoleLoading } = useRole();
    const { toast } = useToast();
    const [config, setConfig] = useState<NetsInitialInput>({
        scenario: 'tough_feedback',
        persona: 'challenging',
        difficulty: 'neutral',
    });
    const [simulationStarted, setSimulationStarted] = useState(false);
    
    if (isRoleLoading || !role) {
        return <DashboardLayout role="Employee" onSwitchRole={() => {}}><Skeleton className="w-full h-screen" /></DashboardLayout>;
    }
    
    const handleConfigChange = <T extends keyof NetsInitialInput>(key: T, value: NetsInitialInput[T]) => {
        setConfig(prev => ({ ...prev, [key]: value }));
    };

    const handleStartSimulation = () => {
        setSimulationStarted(true);
        toast({ title: "Simulation Started", description: "You are now in the conversation arena." });
    };

    if (simulationStarted) {
        return (
            <DashboardLayout role={role} onSwitchRole={setRole}>
                <div className="p-4 md:p-8">
                    <SimulationArena initialConfig={config} onExit={() => setSimulationStarted(false)} />
                </div>
            </DashboardLayout>
        );
    }
    
    return (
        <DashboardLayout role={role} onSwitchRole={setRole}>
            <div className="p-4 md:p-8">
                 <Card className="w-full max-w-2xl mx-auto">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-3xl font-bold font-headline">
                            <MagicWandIcon className="h-8 w-8 text-primary" />
                             Nets – Conversation Arena
                        </CardTitle>
                        <CardDescription className="text-lg">
                            Practice critical conversations in a safe, AI-powered environment.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6 pt-2">
                        <div className="space-y-2">
                            <Label htmlFor="scenario">Choose a Scenario</Label>
                             <Select value={config.scenario} onValueChange={(value) => handleConfigChange('scenario', value)}>
                                <SelectTrigger id="scenario">
                                    <SelectValue placeholder="Select a conversation scenario" />
                                </SelectTrigger>
                                <SelectContent>
                                    {scenarios.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        
                        <Alert>
                            <SlidersHorizontal className="h-4 w-4" />
                            <AlertTitle>Customize Your Simulation</AlertTitle>
                            <AlertDescription>
                                Set the persona and difficulty to tailor your practice session.
                            </AlertDescription>
                        </Alert>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="persona">AI Persona</Label>
                                <Select value={config.persona} onValueChange={(value) => handleConfigChange('persona', value)}>
                                    <SelectTrigger id="persona">
                                        <SelectValue placeholder="Select a persona" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {personas.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="difficulty">Difficulty Level</Label>
                                <Select value={config.difficulty} onValueChange={(value) => handleConfigChange('difficulty', value)}>
                                    <SelectTrigger id="difficulty">
                                        <SelectValue placeholder="Select a difficulty" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {difficulties.map(d => <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button className="w-full" size="lg" onClick={handleStartSimulation}>
                            Start Simulation <ChevronsRight className="ml-2" />
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        </DashboardLayout>
    );
}
