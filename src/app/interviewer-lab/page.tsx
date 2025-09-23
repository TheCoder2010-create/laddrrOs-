
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
import { FlaskConical, PlusCircle, Users, Briefcase, UserCheck, Loader2, Send } from 'lucide-react';
import { getNominationsForManager, nominateUser, getNominationForUser, type Nomination } from '@/services/interviewer-lab-service';

function NominateDialog({ onNomination }: { onNomination: () => void }) {
    const { role } = useRole();
    const { toast } = useToast();
    const [isOpen, setIsOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [nominee, setNominee] = useState<Role | null>(null);
    const [targetRole, setTargetRole] = useState<string | null>(null);

    const availableNominees: Role[] = ['Team Lead', 'AM', 'Employee'];
    const targetRoles = ['IC', 'TL', 'Manager'];

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
                        <Label htmlFor="target-role">Target Interview Level</Label>
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

function LearnerView({ nomination }: { nomination: Nomination }) {
    return (
        <div className="p-4 md:p-8">
            <Card>
                <CardHeader>
                    <CardTitle className="text-3xl font-bold font-headline flex items-center gap-3">
                        <FlaskConical className="h-8 w-8 text-primary" />
                        My Interviewer Lab
                    </CardTitle>
                    <CardDescription className="text-lg text-muted-foreground">
                        You've been nominated for Laddrr's Interviewer Coaching Program.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="border-2 border-dashed rounded-lg p-8 text-center">
                        <h3 className="text-xl font-semibold">Training Track Coming Soon!</h3>
                        <p className="text-muted-foreground mt-2">This is where your training modules will appear. After completing your pre-assessment, you'll unlock your learning path here.</p>
                        {nomination.status === 'Pre-assessment pending' && (
                             <Button className="mt-6">Begin Pre-Assessment</Button>
                        )}
                         {nomination.status === 'In Progress' && (
                             <div className="mt-4">
                                <p className="text-green-500 font-semibold">Pre-assessment completed!</p>
                                <p>Score: {nomination.scorePre}</p>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
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
                                        <TableCell>{n.scorePre ?? '—'}</TableCell>
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

    useEffect(() => {
        if (!role) return;
        getNominationForUser(role).then(userNomination => {
            setNomination(userNomination);
            setIsCheckingNomination(false);
        });
    }, [role]);

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
                <LearnerView nomination={nomination} />
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

    