"use client";

import { useState, useEffect, useCallback } from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { getOneOnOneHistory, OneOnOneHistoryItem, submitIdentifiedConcern, IdentifiedConcernInput } from '@/services/feedback-service';
import { format, formatDistanceToNow } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { ShieldQuestion, AlertTriangle, CheckCircle, MessageCircleQuestion, Repeat, Briefcase, FileText, UserX, UserPlus, EyeOff, UserCheck, Send, Loader2 } from 'lucide-react';
import { useRole } from '@/hooks/use-role';
import { Badge } from '@/components/ui/badge';
import DashboardLayout from '@/components/dashboard-layout';
import { roleUserMapping } from '@/lib/role-mapping';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";


function PastConcernsList() {
  const [concerns, setConcerns] = useState<OneOnOneHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { role } = useRole();

  const fetchConcerns = useCallback(async () => {
    if (!role) return;
    setIsLoading(true);
    try {
      const allHistory = await getOneOnOneHistory();
      const currentUser = roleUserMapping[role];
      
      const myConcerns = allHistory.filter(item => {
        const isParticipant = item.supervisorName === currentUser.name || item.employeeName === currentUser.name;
        return isParticipant && !!item.analysis.criticalCoachingInsight;
      }).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      setConcerns(myConcerns);
    } catch (error) {
      console.error("Failed to fetch concerns", error);
    } finally {
      setIsLoading(false);
    }
  }, [role]);

  useEffect(() => {
    fetchConcerns();

    const handleDataUpdate = () => fetchConcerns();
    window.addEventListener('storage', handleDataUpdate);
    window.addEventListener('feedbackUpdated', handleDataUpdate);
    return () => {
        window.removeEventListener('storage', handleDataUpdate);
        window.removeEventListener('feedbackUpdated', handleDataUpdate);
    }
  }, [fetchConcerns]);

  if (isLoading) {
    return (
        <div className="space-y-4 mt-6">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
        </div>
    );
  }

  const getStatusBadge = (insight: OneOnOneHistoryItem['analysis']['criticalCoachingInsight']) => {
    if (!insight) return null;

    const finalDecisionEvent = insight?.auditTrail?.find(e => ["Assigned to Ombudsman", "Assigned to Grievance Office", "Logged Dissatisfaction & Closed"].includes(e.event));

    if (finalDecisionEvent) {
        let Icon = FileText;
        let text = "Case Logged";
        if (finalDecisionEvent.event.includes("Ombudsman")) { Icon = UserX; text = "Ombudsman"; }
        if (finalDecisionEvent.event.includes("Grievance")) { Icon = UserPlus; text = "Grievance"; }
        return <Badge className="bg-gray-700 text-white flex items-center gap-1.5"><Icon className="h-3 w-3" />{text}</Badge>;
    }

    switch(insight.status) {
        case 'open':
        case 'pending_supervisor_retry':
            return <Badge variant="destructive" className="flex items-center gap-1.5"><AlertTriangle className="h-3 w-3" />Action Required</Badge>;
        case 'pending_employee_acknowledgement':
            return <Badge className="bg-blue-500 text-white flex items-center gap-1.5"><MessageCircleQuestion className="h-3 w-3" />Pending Your Ack</Badge>;
        case 'pending_am_review':
            return <Badge className="bg-orange-500 text-white flex items-center gap-1.5"><AlertTriangle className="h-3 w-3" />Under AM Review</Badge>;
        case 'pending_manager_review':
            return <Badge className="bg-red-700 text-white flex items-center gap-1.5"><Briefcase className="h-3 w-3" />Under Manager Review</Badge>;
        case 'pending_hr_review':
        case 'pending_final_hr_action':
            return <Badge className="bg-black text-white flex items-center gap-1.5"><ShieldCheck className="h-3 w-3" />Under HR Review</Badge>;
        case 'resolved':
            return <Badge variant="success" className="flex items-center gap-1.5"><CheckCircle className="h-3 w-3" />Resolved</Badge>;
        default:
            return null;
    }
  }

  if (concerns.length === 0) {
    return (
      <div className="text-center py-12 border-2 border-dashed rounded-lg mt-6">
        <p className="text-muted-foreground text-lg">You have no active or past concerns.</p>
        <p className="text-sm text-muted-foreground mt-2">
          Critical insights from your 1-on-1s will appear here.
        </p>
      </div>
    )
  }

  return (
    <Accordion type="single" collapsible className="w-full mt-6">
    {concerns.map((item) => {
        const insight = item.analysis.criticalCoachingInsight;
        if (!insight) return null;
        const isSupervisor = roleUserMapping[role!].name === item.supervisorName;

        return (
        <AccordionItem value={item.id} key={item.id} className="px-4">
            <AccordionTrigger>
            <div className="flex justify-between items-center w-full pr-4">
                <div className="text-left">
                    <p className="font-medium">
                        Concern from 1-on-1 with {isSupervisor ? item.employeeName : item.supervisorName}
                    </p>
                    <p className="text-sm text-muted-foreground font-normal">
                        {format(new Date(item.date), 'PPP')} ({formatDistanceToNow(new Date(item.date), { addSuffix: true })})
                    </p>
                </div>
                <div className="hidden md:flex items-center gap-2">
                    {getStatusBadge(insight)}
                </div>
            </div>
            </AccordionTrigger>
            <AccordionContent className="space-y-6 pt-2">
               <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20">
                    <h4 className="font-semibold text-destructive flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />Critical Insight Summary
                    </h4>
                    <p className="text-destructive/90 my-2 text-sm">{insight.summary}</p>
                </div>

                 {insight.supervisorResponse && (
                    <div className="mt-4 p-3 bg-muted/80 rounded-md border">
                        <p className="font-semibold text-foreground text-sm flex items-center gap-2"><UserCheck />Supervisor's Response</p>
                        <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">{insight.supervisorResponse}</p>
                    </div>
                )}

                {insight.employeeAcknowledgement && (
                    <div className="mt-4 p-3 bg-blue-500/10 rounded-md border border-blue-500/20">
                        <p className="font-semibold text-blue-700 dark:text-blue-500 text-sm flex items-center gap-2"><EyeOff />Employee's Acknowledgement</p>
                        <p className="text-sm text-blue-600 dark:text-blue-400 mt-1 whitespace-pre-wrap">{insight.employeeAcknowledgement}</p>
                    </div>
                )}
                
                <div className="space-y-2 text-xs text-muted-foreground/80 pt-4 border-t">
                    <p>This is a read-only view of the case history.</p>
                    <p>Tracking ID: <code className="font-mono">{item.id}</code></p>
                </div>

            </AccordionContent>
        </AccordionItem>
        )
    })}
    </Accordion>
  )
}

function RaiseConcernForm() {
    const { role } = useRole();
    const { toast } = useToast();
    const [subject, setSubject] = useState('');
    const [concern, setConcern] = useState('');
    const [criticality, setCriticality] = useState<'Low' | 'Medium' | 'High' | 'Critical'>('Medium');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!subject || !concern || !role) {
            toast({ variant: 'destructive', title: "Missing Information", description: "Please fill out all fields."});
            return;
        }

        setIsSubmitting(true);
        try {
            const submitter = roleUserMapping[role];
            const input: IdentifiedConcernInput = {
                submittedBy: submitter.name,
                submittedByRole: submitter.role,
                subject,
                message: concern,
                criticality,
            }
            await submitIdentifiedConcern(input);
            toast({ title: "Concern Submitted", description: "Your concern has been confidentially routed to HR." });
            setSubject('');
            setConcern('');
            setCriticality('Medium');
        } catch (error) {
            toast({ variant: 'destructive', title: "Submission Failed", description: "Could not submit your concern."});
            console.error(error);
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <form onSubmit={handleSubmit} className="mt-6 space-y-6">
            <p className="text-sm text-muted-foreground">
                Use this form to confidentially report a concern directly to HR. Your identity will be attached to this submission. If you wish to remain anonymous, please log out and use the "Voice – In Silence" feature.
            </p>
            <div className="space-y-2">
                <Label htmlFor="subject">Subject</Label>
                <Input 
                    id="subject" 
                    value={subject} 
                    onChange={e => setSubject(e.target.value)} 
                    placeholder="e.g., Unfair project assignment, Issue with team communication" 
                    required 
                />
            </div>
            <div className="space-y-2">
                <Label htmlFor="concern">Details of Concern</Label>
                <Textarea 
                    id="concern" 
                    value={concern} 
                    onChange={e => setConcern(e.target.value)} 
                    placeholder="Please describe the situation in detail. Include specific examples, dates, and impact if possible." 
                    rows={8} 
                    required 
                />
            </div>
            <div className="space-y-2">
                <Label htmlFor="criticality">Perceived Criticality</Label>
                 <Select onValueChange={(value) => setCriticality(value as any)} defaultValue={criticality}>
                    <SelectTrigger id="criticality">
                        <SelectValue placeholder="Select a criticality level" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="Low">Low - Needs attention but not urgent</SelectItem>
                        <SelectItem value="Medium">Medium - Affecting work or morale</SelectItem>
                        <SelectItem value="High">High - Significant impact, needs prompt review</SelectItem>
                        <SelectItem value="Critical">Critical - Urgent issue, potential policy violation</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <div className="flex justify-end">
                <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                    Submit Concern to HR
                </Button>
            </div>
        </form>
    )
}

function MyConcernsContent() {
  return (
    <div className="p-4 md:p-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl font-bold font-headline mb-2 text-foreground flex items-center gap-3">
            <ShieldQuestion className="h-8 w-8" /> My Concerns
          </CardTitle>
           <CardDescription className="text-lg text-muted-foreground">
            Track AI-flagged insights you are involved in or raise a new concern directly to HR.
          </CardDescription>
        </CardHeader>
        <CardContent>
            <Tabs defaultValue="past-concerns" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="past-concerns">My Past Concerns</TabsTrigger>
                    <TabsTrigger value="raise-concern">Raise a New Concern</TabsTrigger>
                </TabsList>
                <TabsContent value="past-concerns">
                    <PastConcernsList />
                </TabsContent>
                <TabsContent value="raise-concern">
                    <RaiseConcernForm />
                </TabsContent>
            </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

export default function MyConcernsPage() {
    const { role, setRole, isLoading } = useRole();

    if (isLoading || !role) {
        return (
            <div className="p-4 md:p-8">
                <Skeleton className="h-screen w-full" />
            </div>
        )
    }
  
    return (
        <DashboardLayout role={role} onSwitchRole={setRole}>
            <MyConcernsContent />
        </DashboardLayout>
    );
}
