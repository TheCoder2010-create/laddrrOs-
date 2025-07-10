
"use client";

import { useState, useMemo, useEffect, useRef, useTransition, useCallback } from 'react';
import type { ChangeEvent } from 'react';
import { useRole, Role } from '@/hooks/use-role';
import RoleSelection from '@/components/role-selection';
import DashboardLayout from '@/components/dashboard-layout';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, Calendar, Clock, Video, CalendarCheck, CalendarX, Info, Mic, Square, Upload, MessageSquareQuote, Bot, Send, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarIcon } from 'lucide-react';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { buttonVariants } from "@/components/ui/button";
import { useToast } from '@/hooks/use-toast';
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { analyzeOneOnOne } from '@/ai/flows/analyze-one-on-one-flow';
import { formSchema, type AnalyzeOneOnOneOutput } from '@/ai/schemas/one-on-one-schemas';


const roleUserMapping = {
  'Manager': { name: 'Alex Smith', role: 'Manager', imageHint: 'manager' },
  'Team Lead': { name: 'Ben Carter', role: 'Team Lead', imageHint: 'leader' },
  'AM': { name: 'Ashley Miles', role: 'AM', imageHint: 'assistant manager' },
  'Employee': { name: 'Casey Day', role: 'Employee', imageHint: 'employee' },
  'HR Head': { name: 'Dana Evans', role: 'HR Head', imageHint: 'hr head' },
};

const getMeetingDataForRole = (role: Role) => {
    let currentUser = roleUserMapping[role as keyof typeof roleUserMapping];
    let participant;
    switch(role) {
        case 'Employee':
            participant = roleUserMapping['Team Lead'];
            break;
        case 'Team Lead':
            participant = roleUserMapping['Employee'];
            break;
        case 'AM':
            participant = roleUserMapping['Team Lead'];
            break;
        case 'Manager':
            participant = roleUserMapping['Team Lead'];
            break;
        case 'HR Head':
            participant = roleUserMapping['Manager'];
            break;
        default:
             participant = { name: 'Participant', role: 'Role', imageHint: 'person' };
             currentUser = { name: 'Current User', role: 'Role', imageHint: 'person' };
            break;
    }

    return {
      meetings: [
        {
          id: 1,
          with: participant.name,
          withRole: participant.role,
          date: new Date(new Date().setDate(new Date().getDate() + 2)),
          time: '10:00',
        },
        {
          id: 2,
          with: participant.name,
          withRole: participant.role,
          date: new Date(new Date().setDate(new Date().getDate() + 9)),
          time: '14:30',
        },
      ],
      supervisor: currentUser.name,
    };
};

type Meeting = ReturnType<typeof getMeetingDataForRole>['meetings'][0];

function OneOnOneFeedbackForm({ meeting, supervisor, onClose }: { meeting: Meeting, supervisor: string, onClose: () => void }) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
        location: "",
        liveConversation: false,
        employeeAware: false,
        primaryFeedback: "",
        feedbackTone: "Constructive",
        employeeAcceptedFeedback: "Partially",
        improvementAreas: "",
        growthRating: "3",
        showedSignsOfStress: "No",
        stressDescription: "",
        expressedAspirations: false,
        aspirationDetails: "",
        didAppreciate: false,
        appreciationMessage: "",
        isCrossFunctional: false,
        broadcastAppreciation: false,
        otherComments: "",
    },
  });

  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  
  // Audio recording state
  const [isRecording, setIsRecording] = useState(false);
  const [micPermission, setMicPermission] = useState<'granted' | 'denied' | 'prompt'>('prompt');
  const [recordedAudioUri, setRecordedAudioUri] = useState<string | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // File upload state
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [transcriptContent, setTranscriptContent] = useState<string | null>(null);

  // AI result state
  const [analysisResult, setAnalysisResult] = useState<AnalyzeOneOnOneOutput | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  useEffect(() => {
    return () => { // Cleanup on unmount
        if (recordingIntervalRef.current) clearInterval(recordingIntervalRef.current);
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
            mediaRecorderRef.current.stop();
        }
    }
  }, []);

  const handleStartRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setMicPermission('granted');
      setRecordedAudioUri(null);
      setAudioFile(null);
      setTranscriptContent(null);
      
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      const audioChunks: Blob[] = [];

      recorder.ondataavailable = (event) => {
        audioChunks.push(event.data);
      };

      recorder.onstop = () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
        const audioUrl = URL.createObjectURL(audioBlob);
        setRecordedAudioUri(audioUrl);
        stream.getTracks().forEach(track => track.stop());
        if(recordingIntervalRef.current) clearInterval(recordingIntervalRef.current);
      };

      recorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      recordingIntervalRef.current = setInterval(() => {
          setRecordingTime(prev => prev + 1);
      }, 1000);

    } catch (error) {
      console.error("Mic permission denied", error);
      setMicPermission('denied');
      toast({ variant: 'destructive', title: "Microphone Access Denied", description: "Please enable microphone access in your browser settings."});
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };
  
  const handleFileUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
        setAudioFile(file);
        setRecordedAudioUri(null);
        setTranscriptContent(null);
        // Simple mock for transcript upload
        if (file.type === 'text/plain') {
            const reader = new FileReader();
            reader.onload = (e) => setTranscriptContent(e.target?.result as string);
            reader.readAsText(file);
        }
    }
  };

  const formatRecordingTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
    const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
  }
  
  const onSubmit = (values: z.infer<typeof formSchema>) => {
    setAnalysisResult(null);
    setAnalysisError(null);
    startTransition(async () => {
        try {
            // In a real app, you'd convert the recorded audio URI to a data URI or upload it.
            // For this prototype, we'll pass a placeholder or the transcript content.
            let transcript = transcriptContent;
            if (!transcript && recordedAudioUri) {
                transcript = "This is a placeholder for the transcribed audio recording. The AI would normally process the actual audio.";
            } else if (!transcript && audioFile) {
                transcript = `This is a placeholder for the transcribed audio file: ${audioFile.name}.`;
            }

            const result = await analyzeOneOnOne({
                ...values,
                transcript: transcript || ""
            });
            
            setAnalysisResult(result);
            toast({ title: "Analysis Complete", description: "The AI has processed the session feedback." });

        } catch (error) {
            console.error("Analysis failed", error);
            setAnalysisError("The AI analysis failed. Please check the console for details.");
            toast({ variant: 'destructive', title: "Analysis Failed", description: "Could not get AI analysis results." });
        }
    });
  };

  return (
    <>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>1-on-1 Session Feedback</DialogTitle>
          <DialogDescription>
            Document the key points from your meeting with {meeting.with} to generate insights.
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto pr-6 -mr-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <Card className="shadow-lg">
                    <CardHeader>
                        <CardTitle className="text-2xl font-bold">1-on-1 Session Feedback</CardTitle>
                        <CardDescription>
                            Complete this form to document your session and generate AI-powered insights.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* Session Context */}
                        <div className="border rounded-lg p-3 space-y-3">
                            <div className="flex items-center gap-2 font-semibold">
                                <Info className="h-5 w-5 text-primary" />
                                <h3>Session Context</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2 text-sm text-muted-foreground p-4 bg-muted/50 rounded-md">
                                    <p><strong>Date & Time:</strong> {format(meeting.date, 'PPP')} at {format(new Date(`1970-01-01T${meeting.time}`), 'p')}</p>
                                    <p><strong>Employee:</strong> {meeting.with}</p>
                                    <p><strong>Supervisor:</strong> {supervisor}</p>
                                    <p><strong>Employee Role/Level:</strong> {meeting.withRole}</p>
                                </div>
                                <div>
                                    <FormField
                                        control={form.control}
                                        name="location"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Location <span className="text-destructive">*</span></FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger><SelectValue placeholder="Select meeting location" /></SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="Conference Room">Conference Room</SelectItem>
                                                        <SelectItem value="At Desk">At Desk</SelectItem>
                                                        <SelectItem value="Remote">Remote</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Record or Upload */}
                         <div className="border rounded-lg p-3 space-y-3">
                             <div className="flex items-center gap-2 font-semibold">
                                <Mic className="h-5 w-5 text-primary" />
                                <h3>Record or Upload</h3>
                            </div>
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:border-l md:pl-4">
                                <div className="space-y-4">
                                    <Label>Record Session or Upload Audio/Transcript</Label>
                                    {micPermission === 'denied' && (
                                        <Alert variant="destructive">
                                            <AlertTitle>Microphone Access Denied</AlertTitle>
                                            <AlertDescription>
                                                Please enable it in your browser settings to record.
                                            </AlertDescription>
                                        </Alert>
                                    )}
                                    <div className="flex gap-2">
                                        {!isRecording ? (
                                             <Button type="button" onClick={handleStartRecording}><Mic className="mr-2"/> Start Recording</Button>
                                        ) : (
                                            <Button type="button" variant="destructive" onClick={handleStopRecording}><Square className="mr-2"/> Stop Recording</Button>
                                        )}
                                        <Button type="button" variant="secondary" size="icon" asChild>
                                            <Label htmlFor="file-upload" className="cursor-pointer"><Upload /></Label>
                                        </Button>
                                        <Input id="file-upload" type="file" className="hidden" onChange={handleFileUpload} accept="audio/*,text/plain"/>
                                    </div>
                                    <p className="text-sm text-muted-foreground min-h-[20px]">
                                        {isRecording && `${formatRecordingTime(recordingTime)} - Recording...`}
                                        {!isRecording && recordedAudioUri && `✅ Live recording saved.`}
                                        {audioFile && `📎 Uploaded: ${audioFile.name}`}
                                    </p>
                                    {recordedAudioUri && <audio src={recordedAudioUri} controls className="w-full" />}
                                </div>
                                <div className="space-y-4">
                                    <Label>Acknowledgements</Label>
                                    <FormField control={form.control} name="liveConversation" render={({ field }) => (
                                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                            <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                                            <FormLabel className="font-normal">This conversation occurred live.</FormLabel>
                                        </FormItem>
                                     )} />
                                     <FormField control={form.control} name="employeeAware" render={({ field }) => (
                                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                            <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                                            <FormLabel className="font-normal">Employee is aware of any action items. <span className="text-destructive">*</span></FormLabel>
                                        </FormItem>
                                     )} />
                                </div>
                            </div>
                        </div>

                        {/* Detailed Input Accordion */}
                        <Accordion type="multiple" defaultValue={['feedback']}>
                            <AccordionItem value="feedback">
                                <AccordionTrigger><MessageSquareQuote className="mr-2" /> Feedback & Conversation Capture</AccordionTrigger>
                                <AccordionContent className="space-y-4 p-2">
                                     <FormField control={form.control} name="primaryFeedback" render={({ field }) => (
                                        <FormItem><FormLabel>Primary Feedback / Talking Points <span className="text-destructive">*</span></FormLabel><FormControl><Textarea rows={5} placeholder="What was the core message delivered?" {...field} /></FormControl><FormMessage /></FormItem>
                                     )} />
                                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                         <FormField control={form.control} name="feedbackTone" render={({ field }) => (
                                            <FormItem><FormLabel>Feedback Tone</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="Constructive">Constructive</SelectItem><SelectItem value="Positive">Positive</SelectItem><SelectItem value="Corrective">Corrective</SelectItem><SelectItem value="Neutral">Neutral</SelectItem></SelectContent></Select><FormMessage /></FormItem>
                                         )} />
                                         <FormField control={form.control} name="employeeAcceptedFeedback" render={({ field }) => (
                                            <FormItem><FormLabel>How was it received?</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="Fully">Fully</SelectItem><SelectItem value="Partially">Partially</SelectItem><SelectItem value="Not Well">Not Well</SelectItem></SelectContent></Select><FormMessage /></FormItem>
                                         )} />
                                     </div>
                                     <FormField control={form.control} name="improvementAreas" render={({ field }) => (
                                        <FormItem><FormLabel>Specific Areas for Improvement {form.getValues("feedbackTone") === 'Corrective' && <span className="text-destructive">*</span>}</FormLabel><FormControl><Input placeholder="e.g., meeting deadlines, communication style" {...field} /></FormControl><FormMessage /></FormItem>
                                     )} />
                                     <FormField control={form.control} name="growthRating" render={({ field }) => (
                                        <FormItem><FormLabel>Growth/Performance Trajectory (1=Needs significant improvement, 5=Exceeding expectations) <span className="text-destructive">*</span></FormLabel><FormControl><RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex gap-4 pt-2"><FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="1" /></FormControl><FormLabel className="font-normal">1</FormLabel></FormItem><FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="2" /></FormControl><FormLabel className="font-normal">2</FormLabel></FormItem><FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="3" /></FormControl><FormLabel className="font-normal">3</FormLabel></FormItem><FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="4" /></FormControl><FormLabel className="font-normal">4</FormLabel></FormItem><FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="5" /></FormControl><FormLabel className="font-normal">5</FormLabel></FormItem></RadioGroup></FormControl><FormMessage /></FormItem>
                                     )} />
                                </AccordionContent>
                            </AccordionItem>
                             <AccordionItem value="signals">
                                <AccordionTrigger>Sentiment & Signals</AccordionTrigger>
                                <AccordionContent className="space-y-4 p-2">
                                     <FormField control={form.control} name="showedSignsOfStress" render={({ field }) => (
                                        <FormItem><FormLabel>Did employee show signs of stress or disengagement?</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="Yes">Yes</SelectItem><SelectItem value="No">No</SelectItem><SelectItem value="Unsure">Unsure</SelectItem></SelectContent></Select><FormMessage /></FormItem>
                                     )} />
                                    <FormField control={form.control} name="stressDescription" render={({ field }) => (
                                        <FormItem><FormLabel>If yes, describe</FormLabel><FormControl><Textarea placeholder="e.g., body language, tone of voice, specific comments" {...field} /></FormControl><FormMessage /></FormItem>
                                     )} />
                                    <FormField control={form.control} name="expressedAspirations" render={({ field }) => (
                                        <FormItem className="flex flex-row items-start space-x-3 space-y-0"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl><FormLabel className="font-normal">Did employee express career aspirations or goals?</FormLabel></FormItem>
                                     )} />
                                    <FormField control={form.control} name="aspirationDetails" render={({ field }) => (
                                        <FormItem><FormLabel>If yes, what were they?</FormLabel><FormControl><Textarea placeholder="e.g., promotion, new projects, learning new skills" {...field} /></FormControl><FormMessage /></FormItem>
                                     )} />
                                </AccordionContent>
                            </AccordionItem>
                            <AccordionItem value="appreciation">
                                <AccordionTrigger>Appreciation Block</AccordionTrigger>
                                <AccordionContent className="space-y-4 p-2">
                                     <FormField control={form.control} name="didAppreciate" render={({ field }) => (
                                        <FormItem className="flex flex-row items-start space-x-3 space-y-0"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl><FormLabel className="font-normal">Did you specifically appreciate the employee for something?</FormLabel></FormItem>
                                     )} />
                                    <FormField control={form.control} name="appreciationMessage" render={({ field }) => (
                                        <FormItem><FormLabel>If yes, what was the message?</FormLabel><FormControl><Textarea placeholder="e.g., Thank you for your work on Project X..." {...field} /></FormControl><FormMessage /></FormItem>
                                     )} />
                                    <FormField control={form.control} name="isCrossFunctional" render={({ field }) => (
                                        <FormItem className="flex flex-row items-start space-x-3 space-y-0"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl><FormLabel className="font-normal">Was the contribution cross-functional?</FormLabel></FormItem>
                                     )} />
                                    <FormField control={form.control} name="broadcastAppreciation" render={({ field }) => (
                                        <FormItem className="flex flex-row items-start space-x-3 space-y-0"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl><FormLabel className="font-normal">Should this appreciation be broadcast to a wider team?</FormLabel></FormItem>
                                     )} />
                                </AccordionContent>
                            </AccordionItem>
                             <AccordionItem value="summary">
                                <AccordionTrigger>Media & Summary</AccordionTrigger>
                                <AccordionContent className="space-y-4 p-2">
                                    <FormField control={form.control} name="otherComments" render={({ field }) => (
                                        <FormItem><FormLabel>Other Comments or Observations</FormLabel><FormControl><Textarea rows={4} placeholder="Anything else of note from the conversation?" {...field} /></FormControl><FormMessage /></FormItem>
                                     )} />
                                </AccordionContent>
                            </AccordionItem>
                        </Accordion>
                    </CardContent>
                    <CardFooter>
                         <Button type="submit" className="w-full" disabled={isPending}>
                            {isPending ? <Loader2 className="mr-2 animate-spin"/> : <Send className="mr-2" />}
                            Submit One-on-One Session
                        </Button>
                    </CardFooter>
                </Card>
              </form>
            </Form>
        </div>
        {analysisResult && (
            <Alert className="mt-6 bg-primary/5 border-primary/20">
                <div className="flex items-center gap-2 font-bold text-primary">
                    <Bot />
                    <AlertTitle>Analysis Complete</AlertTitle>
                </div>
                <AlertDescription className="space-y-4 text-primary/90">
                    <div className="mt-4">
                        <h4 className="font-semibold text-foreground">Key Themes</h4>
                        <ul className="list-disc pl-5">
                            {analysisResult.keyThemes.map((theme, i) => <li key={i}>{theme}</li>)}
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-semibold text-foreground">Action Items</h4>
                        <ul className="list-disc pl-5">
                            {analysisResult.actionItems.map((item, i) => <li key={i}>{item}</li>)}
                        </ul>
                    </div>
                    {analysisResult.sentimentAnalysis && (
                        <div>
                            <h4 className="font-semibold text-foreground">Sentiment Analysis</h4>
                            <p>{analysisResult.sentimentAnalysis}</p>
                        </div>
                    )}
                    {analysisResult.escalationAlert && (
                        <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20">
                            <h4 className="font-semibold text-destructive">Escalation Alert</h4>
                            <p className="text-destructive/90">{analysisResult.escalationAlert}</p>
                        </div>
                    )}
                    {analysisResult.coachingImpactAnalysis && (
                        <div className="p-3 rounded-md bg-green-500/10 border border-green-500/20">
                            <h4 className="font-semibold text-green-700 dark:text-green-400">Coaching Impact Analysis</h4>
                            <p className="text-green-600 dark:text-green-300">{analysisResult.coachingImpactAnalysis}</p>
                        </div>
                    )}
                </AlertDescription>
            </Alert>
        )}
        {analysisError && (
            <Alert variant="destructive" className="mt-6">
                <AlertTitle>Analysis Error</AlertTitle>
                <AlertDescription>{analysisError}</AlertDescription>
            </Alert>
        )}
      </DialogContent>
    </>
  );
}


function ScheduleMeetingDialog({ meetingToEdit, onSchedule }: { meetingToEdit?: Meeting, onSchedule: (details: any) => void }) {
  const [date, setDate] = useState<Date | undefined>(meetingToEdit?.date);
  const [time, setTime] = useState(meetingToEdit?.time || '');
  const [participant, setParticipant] = useState(meetingToEdit?.with || '');
  
  const handleSchedule = () => {
    onSchedule({ date, time, participant });
  }

  const title = meetingToEdit ? "Reschedule 1-on-1" : "Schedule New 1-on-1";
  const description = meetingToEdit ? "Update the date and time for your meeting." : "Select a participant, date, and time for your meeting.";

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>
          {description}
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-4 py-4">
        <div className="space-y-2">
          <Label htmlFor="participant">Participant</Label>
          <Input id="participant" placeholder="Enter name..." value={participant} onChange={e => setParticipant(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !date && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date ? format(date, "PPP") : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <CalendarComponent
                mode="single"
                selected={date}
                onSelect={setDate}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
        <div className="space-y-2">
          <Label htmlFor="time">Time</Label>
          <Input id="time" type="time" value={time} onChange={e => setTime(e.target.value)} />
        </div>
      </div>
      <DialogFooter>
        <DialogClose asChild>
          <Button type="button" variant="secondary">
            Cancel
          </Button>
        </DialogClose>
        <DialogClose asChild>
            <Button type="submit" onClick={handleSchedule}>{meetingToEdit ? "Update" : "Schedule"}</Button>
        </DialogClose>
      </DialogFooter>
    </DialogContent>
  )
}

function OneOnOnePage({ role }: { role: Role }) {
  const { meetings: upcomingMeetings, supervisor } = useMemo(() => getMeetingDataForRole(role), [role]);
  const [meetings, setMeetings] = useState(upcomingMeetings);
  const [isScheduleDialogOpen, setIsScheduleDialogOpen] = useState(false);
  const { toast } = useToast();
  
  const handleSchedule = (details: any) => {
    toast({
        title: "Meeting Scheduled!",
        description: "In a real app, this would save to a database."
    })
    setIsScheduleDialogOpen(false);
  }
  
  const handleCancelMeeting = (meetingId: number) => {
    toast({
        title: "Meeting Cancelled",
        description: `Meeting ${meetingId} has been removed.`,
    })
    setMeetings(meetings.filter(m => m.id !== meetingId));
  }

  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':');
    const date = new Date();
    date.setHours(parseInt(hours, 10));
    date.setMinutes(parseInt(minutes, 10));
    return format(date, 'p');
  }

  return (
    <div className="p-4 md:p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold font-headline text-foreground">1-on-1s</h1>
        <Dialog open={isScheduleDialogOpen} onOpenChange={setIsScheduleDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2" />
              Schedule New Meeting
            </Button>
          </DialogTrigger>
          <ScheduleMeetingDialog onSchedule={handleSchedule} />
        </Dialog>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4 text-muted-foreground">Upcoming Meetings</h2>
        {meetings.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {meetings.map((meeting) => (
              <div key={meeting.id} className="border rounded-lg">
                <div className="flex items-center justify-between p-3 py-2">
                    <h3 className="text-lg font-semibold">{meeting.with}</h3>
                    <div className="flex items-center gap-1">
                      <Dialog>
                        <DialogTrigger asChild>
                           <Button variant="ghost" size="icon">
                            <Video className="h-5 w-5" />
                          </Button>
                        </DialogTrigger>
                        <OneOnOneFeedbackForm meeting={meeting} supervisor={supervisor} onClose={()=>{}}/>
                      </Dialog>

                      <Dialog>
                        <DialogTrigger asChild>
                            <Button variant="ghost" size="icon">
                                <CalendarCheck className="h-5 w-5" />
                            </Button>
                        </DialogTrigger>
                        <ScheduleMeetingDialog meetingToEdit={meeting} onSchedule={handleSchedule} />
                      </Dialog>
                      
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                                <CalendarX className="h-5 w-5" />
                            </Button>
                        </AlertDialogTrigger>
                          <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently cancel your meeting with {meeting.with} on {format(new Date(meeting.date), 'PPP')} at {formatTime(meeting.time)}. This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Go Back</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleCancelMeeting(meeting.id)} className={cn(buttonVariants({variant: 'destructive'}))}>
                              Yes, Cancel
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                  </div>
                </div>
                <div className="border-t p-3 py-2">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-5 w-5" />
                    <span>{format(new Date(meeting.date), 'MM/dd/yy')}</span>
                    <Clock className="h-5 w-5" />
                    <span>{formatTime(meeting.time)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 border-2 border-dashed rounded-lg">
            <p className="text-muted-foreground text-lg">No upcoming meetings.</p>
            <p className="text-sm text-muted-foreground mt-2">
              Click "Schedule New Meeting" to get started.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}


export default function Home() {
  const { role, setRole, isLoading } = useRole();

  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <div className="w-full max-w-sm flex flex-col items-center gap-4">
          <Skeleton className="h-12 w-48" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-32 w-full mt-8" />
        </div>
      </div>
    );
  }

  if (!role) {
    return <RoleSelection onSelectRole={setRole} />;
  }

  return (
    <DashboardLayout role={role} onSwitchRole={setRole}>
        <OneOnOnePage role={role} />
    </DashboardLayout>
  );
}
