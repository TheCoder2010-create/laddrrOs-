import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Target, Activity, BarChart2 } from "lucide-react";

export default function ManagerDashboard() {
  return (
    <div>
      <h1 className="text-3xl font-bold font-headline mb-6 text-foreground">Manager Dashboard</h1>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Team Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">+2 from last month</p>
          </CardContent>
        </Card>
        <Card className="shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Projects</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">4 Active</div>
            <p className="text-xs text-muted-foreground">1 pending approval</p>
          </CardContent>
        </Card>
        <Card className="shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Team Productivity</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+92%</div>
            <p className="text-xs text-muted-foreground">Trending up</p>
          </CardContent>
        </Card>
        <Card className="shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Budget Utilization</CardTitle>
            <BarChart2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">68%</div>
            <p className="text-xs text-muted-foreground">$20k remaining</p>
          </CardContent>
        </Card>
      </div>
      <div className="mt-8 grid gap-6 md:grid-cols-2">
        <Card className="shadow-md">
            <CardHeader>
                <CardTitle className="font-headline">Team Performance</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground">Chart or table showing team performance metrics.</p>
                <div className="w-full h-64 bg-muted rounded-lg mt-4 flex items-center justify-center text-muted-foreground">
                    Performance Chart
                </div>
            </CardContent>
        </Card>
        <Card className="shadow-md">
            <CardHeader>
                <CardTitle className="font-headline">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground">List of recent activities and updates from the team.</p>
                <div className="w-full h-64 bg-muted rounded-lg mt-4 flex items-center justify-center text-muted-foreground">
                    Activity Feed
                </div>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
