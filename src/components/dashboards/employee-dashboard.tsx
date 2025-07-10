import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, ListTodo, Award, TrendingUp } from "lucide-react";
import { Progress } from "@/components/ui/progress";

export default function EmployeeDashboard() {
  return (
    <div>
      <h1 className="text-3xl font-bold font-headline mb-6 text-foreground">Employee Dashboard</h1>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tasks To Do</CardTitle>
            <ListTodo className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">7</div>
            <p className="text-xs text-muted-foreground">2 high priority</p>
          </CardContent>
        </Card>
        <Card className="shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tasks Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">32</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>
        <Card className="shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Performance Score</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8.9/10</div>
            <p className="text-xs text-muted-foreground">Above average</p>
          </CardContent>
        </Card>
        <Card className="shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Badges Earned</CardTitle>
            <Award className="h-4 w-4 text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-muted-foreground">New: "Code Wizard"</p>
          </CardContent>
        </Card>
      </div>
      <div className="mt-8">
        <Card className="shadow-md">
            <CardHeader>
                <CardTitle className="font-headline">My Current Sprint</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="flex justify-between text-sm text-muted-foreground mb-1">
                    <span>Progress</span>
                    <span>60%</span>
                </div>
                <Progress value={60} className="w-full" />
                <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                    <div>
                        <p className="text-muted-foreground">To Do</p>
                        <p className="font-bold text-lg">4</p>
                    </div>
                    <div>
                        <p className="text-muted-foreground">In Progress</p>
                        <p className="font-bold text-lg">2</p>
                    </div>
                    <div>
                        <p className="text-muted-foreground">Done</p>
                        <p className="font-bold text-lg">6</p>
                    </div>
                </div>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
