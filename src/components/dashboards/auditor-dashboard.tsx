import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { FileText, ShieldAlert, GanttChartSquare, Bell } from "lucide-react";

export default function AuditorDashboard() {
  const complianceChecks = [
    { id: 'CHK-001', team: 'Engineering', status: 'Compliant', date: '2023-10-26' },
    { id: 'CHK-002', team: 'Marketing', status: 'Pending', date: '2023-10-25' },
    { id: 'CHK-003', team: 'Sales', status: 'Non-Compliant', date: '2023-10-24' },
    { id: 'CHK-004', team: 'HR', status: 'Compliant', date: '2023-10-23' },
  ];

  return (
    <div>
      <h1 className="text-3xl font-bold font-headline mb-6 text-foreground">Auditor Dashboard</h1>
       <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Compliance Reports</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">128</div>
            <p className="text-xs text-muted-foreground">+5 this week</p>
          </CardContent>
        </Card>
        <Card className="shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Violations</CardTitle>
            <ShieldAlert className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">7</div>
            <p className="text-xs text-muted-foreground">2 critical</p>
          </CardContent>
        </Card>
        <Card className="shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Audits in Progress</CardTitle>
            <GanttChartSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-muted-foreground">Engineering team audit next</p>
          </CardContent>
        </Card>
        <Card className="shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alerts</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">14</div>
            <p className="text-xs text-muted-foreground">New policy updates</p>
          </CardContent>
        </Card>
      </div>
      <div className="mt-8">
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="font-headline">Recent Compliance Checks</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Check ID</TableHead>
                  <TableHead>Team</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {complianceChecks.map((check) => (
                  <TableRow key={check.id}>
                    <TableCell className="font-medium">{check.id}</TableCell>
                    <TableCell>{check.team}</TableCell>
                    <TableCell>
                      <Badge variant={
                        check.status === 'Compliant' ? 'success' :
                        check.status === 'Non-Compliant' ? 'destructive' : 'secondary'
                      }>
                        {check.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{check.date}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
