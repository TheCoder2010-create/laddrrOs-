"use client";

import { useState } from "react";
import { useRole, Role } from "@/hooks/use-role";
import { useToast } from "@/hooks/use-toast";
import { assignPracticeScenario } from "@/services/feedback-service";
import { roleUserMapping } from "@/lib/role-mapping";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ClipboardEdit, Send, Loader2 } from "lucide-react";

// In a real app, this would come from a database query of the manager's team
const teamMembers: Role[] = ['Team Lead', 'AM', 'Employee'];

export default function AssignPracticeWidget() {
    const { role } = useRole();
    const { toast } = useToast();
    const [selectedUser, setSelectedUser] = useState<Role | null>(null);
    const [scenario, setScenario] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async () => {
        if (!role || !selectedUser || !scenario) {
            toast({
                variant: 'destructive',
                title: "Missing Information",
                description: "Please select a user and describe a scenario."
            });
            return;
        }

        setIsSubmitting(true);
        try {
            await assignPracticeScenario(role, selectedUser, scenario);
            toast({
                title: "Practice Scenario Assigned!",
                description: `${roleUserMapping[selectedUser].name} has been assigned a new practice scenario.`
            });
            // Reset form
            setSelectedUser(null);
            setScenario('');
        } catch (error) {
            console.error("Failed to assign practice scenario", error);
            toast({ variant: 'destructive', title: "Assignment Failed" });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (role !== 'Manager') {
        return null;
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <ClipboardEdit className="text-primary" />
                    Assign Practice Scenario
                </CardTitle>
                <CardDescription>
                    Assign a specific conversation scenario to a team member for them to practice in the Nets arena.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="assign-user">Assign To</Label>
                        <Select
                            value={selectedUser ?? ''}
                            onValueChange={(value) => setSelectedUser(value as Role)}
                        >
                            <SelectTrigger id="assign-user">
                                <SelectValue placeholder="Select a team member" />
                            </SelectTrigger>
                            <SelectContent>
                                {teamMembers.map(memberRole => (
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
                        placeholder="e.g., Practice delivering the Q3 project update to the leadership team, focusing on executive presence."
                        rows={4}
                        value={scenario}
                        onChange={(e) => setScenario(e.target.value)}
                    />
                </div>
            </CardContent>
            <CardFooter>
                <Button onClick={handleSubmit} disabled={isSubmitting || !selectedUser || !scenario}>
                    {isSubmitting ? <Loader2 className="mr-2 animate-spin" /> : <Send className="mr-2" />}
                    Assign Scenario
                </Button>
            </CardFooter>
        </Card>
    )
}