import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckSquare, GitMerge, Hourglass, Users } from "lucide-react";

export default function LeadDashboard() {
  return (
    <div>
      <h1 className="text-3xl font-bold font-headline mb-6 text-foreground">Team Lead Dashboard</h1>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Tasks</CardTitle>
            <CheckSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">24</div>
            <p className="text-xs text-muted-foreground">5 overdue</p>
          </CardContent>
        </Card>
        <Card className="shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pull Requests</CardTitle>
            <GitMerge className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8</div>
            <p className="text-xs text-muted-foreground">3 awaiting review</p>
          </CardContent>
        </Card>
        <Card className="shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Team Blockers</CardTitle>
            <Hourglass className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2</div>
            <p className="text-xs text-muted-foreground">Needs attention</p>
          </CardContent>
        </Card>
        <Card className="shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Team Capacity</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">85%</div>
            <p className="text-xs text-muted-foreground">Next sprint planning soon</p>
          </CardContent>
        </Card>
      </div>
       <div className="mt-8">
        <Card className="shadow-md">
            <CardHeader>
                <CardTitle className="font-headline">Project Progress</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground">Chart showing progress on current project milestones.</p>
                <div className="w-full h-80 bg-muted rounded-lg mt-4 flex items-center justify-center text-muted-foreground">
                    Project Timeline Chart
                </div>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
