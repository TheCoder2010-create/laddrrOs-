
"use client";

import { useState, useTransition, useEffect, useRef, ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { analyzeOneOnOne } from '@/ai/flows/analyze-one-on-one-flow';
import { formSchema, type AnalyzeOneOnOneOutput } from '@/ai/schemas/one-on-one-schemas';
import { saveOneOnOneHistory, updateOneOnOneHistoryItem, getFeedbackById, submitSupervisorUpdate, type Feedback } from '@/services/feedback-service';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { format } from 'date-fns';
import { Info, Mic, Square, Upload, MessageSquareQuote, Bot, Send, Loader2, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import DashboardLayout from '@/components/dashboard-layout';
import { useRole } from '@/hooks/use-role';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';

// Define meeting type locally as it's not exported from the main page
interface Meeting {
  id: number;
  with: string;
  withRole: string;
  date: string | Date; // Allow for serialized date
  time: string;
}

function OneOnOneFeedbackForm({ meeting, supervisor }: { meeting: Meeting, supervisor: string }) {
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
        transcript: "",
        supervisorName: supervisor,
        employeeName: meeting.with,
    },
  });

  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const { role } = useRole();
  
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
  const [relatedFeedbackItem, setRelatedFeedbackItem] = useState<Feedback | null>(null);
  const [showAddressInsight, setShowAddressInsight] = useState(false);
  const [supervisorResponse, setSupervisorResponse] = useState("");
  const [isSubmittingResponse, setIsSubmittingResponse] = useState(false);

  const hasMedia = !!recordedAudioUri || !!audioFile || !!transcriptContent;

  useEffect(() => {
    return () => { // Cleanup on unmount
        if (recordingIntervalRef.current) clearInterval(recordingIntervalRef.current);
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
            mediaRecorderRef.current.stop();
        }
    }
  }, []);

  const updateTranscript = (content: string | null) => {
    setTranscriptContent(content);
    if (content) {
      form.setValue('transcript', content, { shouldValidate: true });
    } else {
      form.setValue('transcript', '', { shouldValidate: true });
    }
  };

  const handleStartRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setMicPermission('granted');
      setRecordedAudioUri(null);
      setAudioFile(null);
      updateTranscript(null);
      
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
        // In a real app, this would be transcribed. For now, we use a placeholder.
        updateTranscript("This is a placeholder for the transcribed audio recording. The AI would normally process the actual audio.");
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
        // Simple mock for transcript upload
        if (file.type === 'text/plain') {
            const reader = new FileReader();
            reader.onload = (e) => updateTranscript(e.target?.result as string);
            reader.readAsText(file);
        } else {
            updateTranscript(`This is a placeholder for the transcribed audio file: ${file.name}.`);
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
    setRelatedFeedbackItem(null);
    setShowAddressInsight(false);

    startTransition(async () => {
        try {
            const historyItem = await saveOneOnOneHistory({
                supervisorName: supervisor,
                employeeName: meeting.with,
                date: new Date(meeting.date).toISOString(),
                // Temporarily store empty analysis
                analysis: { keyThemes: [], actionItems: [], sentimentAnalysis: '' }, 
            });

            // Pass the new history ID to the analysis flow
            const result = await analyzeOneOnOne({
                ...values,
                oneOnOneId: historyItem.id, // Pass the ID for linking
            });

            setAnalysisResult(result);

            if (result.criticalCoachingInsight) {
                // Find the newly created feedback item to manage its state
                const feedbackItem = await getFeedbackById(historyItem.id, true);
                setRelatedFeedbackItem(feedbackItem);
            }
            
            // Now update the history item with the real analysis
            historyItem.analysis = result;
            await updateOneOnOneHistoryItem(historyItem);
            
            toast({ title: "Analysis Complete", description: "The AI has processed the session feedback." });
        } catch (error) {
            console.error("Analysis failed", error);
            setAnalysisError("The AI analysis failed. Please check the console for details.");
            toast({ variant: 'destructive', title: "Analysis Failed", description: "Could not get AI analysis results." });
        }
    });
  };

  const handleAddressInsightSubmit = async () => {
    if (!supervisorResponse || !relatedFeedbackItem || !role) return;

    setIsSubmittingResponse(true);
    try {
        await submitSupervisorUpdate(relatedFeedbackItem.trackingId, role, supervisorResponse);
        setSupervisorResponse("");
        setShowAddressInsight(false);
        // Refetch the feedback item to update its status locally
        const updatedFeedbackItem = await getFeedbackById(relatedFeedbackItem.oneOnOneId!, true);
        setRelatedFeedbackItem(updatedFeedbackItem);

        toast({ title: "Response Submitted", description: "The employee has been notified to acknowledge your response." });
    } catch (error) {
        console.error("Failed to submit response", error);
        toast({ variant: 'destructive', title: "Submission Failed", description: "Could not submit your response." });
    } finally {
        setIsSubmittingResponse(false);
    }
  };


  return (
    <div className="p-4 md:p-8">
       <div className="mb-4">
          <Button variant="ghost" asChild>
              <Link href="/1-on-1">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Meetings
              </Link>
          </Button>
      </div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card className="shadow-lg">
              <CardHeader>
                  <CardTitle className="text-2xl font-bold">1-on-1 Session Feedback</CardTitle>
                  <CardDescription>
                      Complete this form to document your session with {meeting.with} and generate AI-powered insights.
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
                              <p><strong>Date & Time:</strong> {format(new Date(meeting.date), 'PPP')} at {format(new Date(`1970-01-01T${meeting.time}`), 'p')}</p>
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
                                  <FormItem><FormLabel>Primary Feedback / Talking Points {!hasMedia && <span className="text-destructive">*</span>}</FormLabel><FormControl><Textarea rows={5} placeholder="What was the core message delivered? (Optional if recording is provided)" {...field} /></FormControl><FormMessage /></FormItem>
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
      
      <div className="mt-6">
        {analysisResult && (
            <Alert className="bg-primary/5 border-primary/20">
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
                    {analysisResult.criticalCoachingInsight && (
                        <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20 mt-4">
                            <h4 className="font-semibold text-destructive">Critical Coaching Insight</h4>
                            <p className="text-destructive/90">{analysisResult.criticalCoachingInsight}</p>
                             {relatedFeedbackItem?.status === 'Pending Supervisor Action' && (
                                <div className="mt-4">
                                    {!showAddressInsight ? (
                                        <Button variant="destructive" onClick={() => setShowAddressInsight(true)}>
                                            Address Insight
                                        </Button>
                                    ) : (
                                        <div className="space-y-2">
                                            <Label htmlFor="supervisor-response" className="text-foreground font-semibold">
                                                How will you address this?
                                            </Label>
                                            <Textarea
                                                id="supervisor-response"
                                                value={supervisorResponse}
                                                onChange={(e) => setSupervisorResponse(e.target.value)}
                                                placeholder="Explain the actions you will take to resolve this concern..."
                                                rows={4}
                                                className="bg-background"
                                            />
                                            <div className="flex gap-2">
                                                <Button
                                                    onClick={handleAddressInsightSubmit}
                                                    disabled={isSubmittingResponse || !supervisorResponse}
                                                >
                                                    {isSubmittingResponse && <Loader2 className="mr-2 animate-spin" />}
                                                    Submit Response
                                                </Button>
                                                <Button variant="ghost" onClick={() => setShowAddressInsight(false)}>
                                                    Cancel
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                            {relatedFeedbackItem?.status !== 'Pending Supervisor Action' && relatedFeedbackItem?.supervisorUpdate && (
                                <div className="mt-4 p-3 bg-muted/50 rounded-md">
                                    <p className="font-semibold text-foreground">Your response has been submitted and is pending employee acknowledgement.</p>
                                </div>
                            )}
                        </div>
                    )}
                    {analysisResult.coachingImpactAnalysis && (
                        <div className="p-3 rounded-md bg-green-500/10 border border-green-500/20 mt-4">
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
      </div>
    </div>
  );
}

export default function OneOnOneFeedbackPage() {
    const { role, setRole, isLoading: isRoleLoading } = useRole();
    const router = useRouter();
    const [meeting, setMeeting] = useState<Meeting | null>(null);
    const [supervisor, setSupervisor] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const storedData = sessionStorage.getItem('current_1_on_1_meeting');
        if (storedData) {
            const { meeting, supervisor } = JSON.parse(storedData);
            setMeeting(meeting);
            setSupervisor(supervisor);
        } else {
            // If no data, redirect back to the list
            router.replace('/1-on-1');
        }
        setIsLoading(false);
    }, [router]);

    if (isRoleLoading || isLoading || !role) {
        return (
            <div className="flex h-screen w-screen items-center justify-center bg-background">
                <Skeleton className="h-[500px] w-full max-w-4xl" />
            </div>
        );
    }
    
    return (
        <DashboardLayout role={role} onSwitchRole={setRole}>
            {meeting && supervisor ? (
                <OneOnOneFeedbackForm meeting={meeting} supervisor={supervisor} />
            ) : (
                <div className="flex h-full w-full items-center justify-center">
                    <p>Loading meeting data...</p>
                </div>
            )}
        </DashboardLayout>
    );
}
