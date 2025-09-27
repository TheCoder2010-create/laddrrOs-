
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
import { PlusCircle, Loader2, BookOpen, CheckCircle, ArrowRight } from 'lucide-react';
import { getLeadershipNominationsForManager, getNominationForUser as getLeadershipNominationForUser, type LeadershipNomination, type LeadershipModule, nominateForLeadership } from '@/services/leadership-service';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';


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
    
    // A manager can nominate employees and team leads.
    const eligibleNominees: Role[] = ['Employee', 'Team Lead'];

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

function LearnerView({ initialNomination }: { initialNomination: LeadershipNomination }) {
    const [nomination, setNomination] = useState(initialNomination);

    useEffect(() => {
        setNomination(initialNomination);
    }, [initialNomination]);

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
                                <p className="text-sm text-muted-foreground">{module.content}</p>
                                {/* Placeholder for lessons */}
                                <Button disabled>Start Lesson</Button>
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
    }
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
            <LearnerView initialNomination={nomination} />
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
