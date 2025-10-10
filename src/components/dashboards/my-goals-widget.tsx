"use client"

import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Target } from 'lucide-react';

// Mock data representing goals assigned to the 'Employee' role.
// In a real application, this would be fetched based on the user's role.
const myGoalsData = [
    { kpi: 'Project Delivery Rate', weightage: '50%' },
    { kpi: 'Code Quality Score', weightage: '30%' },
    { kpi: 'Team Collaboration Rating', weightage: '20%' },
];

export default function MyGoalsWidget() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="text-primary" />
          My Goals & KPIs
        </CardTitle>
        <CardDescription>
          Your key performance indicators and their weightage for the current review cycle.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Key Performance Indicator (KPI)</TableHead>
                    <TableHead className="text-right w-[120px]">Weightage</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {myGoalsData.map((goal, index) => (
                    <TableRow key={index}>
                        <TableCell className="font-medium">{goal.kpi}</TableCell>
                        <TableCell className="text-right font-semibold text-primary">{goal.weightage}</TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
