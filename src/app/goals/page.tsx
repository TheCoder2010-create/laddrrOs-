
"use client";

import { useState } from 'react';
import { useRole } from '@/hooks/use-role';
import DashboardLayout from '@/components/dashboard-layout';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Scale, Target, CheckCircle, SlidersHorizontal, ArrowRight, BookCopy, LineChart, Users, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

const frameworks = [
  {
    id: 'bell-curve',
    title: 'Bell Curve',
    description: 'Traditional ranking distribution.',
    icon: LineChart,
  },
  {
    id: '9-box',
    title: '9-Box Grid',
    description: 'Performance vs. Potential matrix.',
    icon: BookCopy,
  },
  {
    id: 'okr',
    title: 'OKR-based System',
    description: 'Objectives and Key Results.',
    icon: Target,
  },
  {
    id: 'custom',
    title: 'Custom Framework',
    description: 'Create your own weighted scoring system.',
    icon: SlidersHorizontal,
  },
];

type SetupStep = 'framework' | 'reviewGroup';

function FrameworkStep({ onNext }: { onNext: () => void }) {
    const [selectedFramework, setSelectedFramework] = useState<string | null>(null);

    return (
        <Card className="max-w-4xl mx-auto">
            <CardHeader>
                <CardTitle className="text-3xl font-bold font-headline flex items-center gap-3">
                    <Scale className="h-8 w-8 text-primary" />
                    Set Up Your Performance Framework
                </CardTitle>
                <CardDescription className="text-lg text-muted-foreground">
                    Choose the evaluation methodology that best fits your team's needs. This will define how performance is tracked and measured.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-4">
                <div className="space-y-2">
                    <Label className="text-base font-semibold">Step 1: Choose Evaluation Methodology</Label>
                    <RadioGroup
                        value={selectedFramework ?? ''}
                        onValueChange={setSelectedFramework}
                        className="grid grid-cols-1 md:grid-cols-2 gap-4"
                    >
                        {frameworks.map((framework) => {
                            const Icon = framework.icon;
                            return (
                                <Label
                                    key={framework.id}
                                    htmlFor={framework.id}
                                    className={cn(
                                        "flex flex-col items-start p-4 border-2 rounded-lg cursor-pointer transition-all",
                                        selectedFramework === framework.id
                                            ? "border-primary bg-primary/5 shadow-lg"
                                            : "border-muted hover:border-primary/50"
                                    )}
                                >
                                    <div className="flex justify-between items-center w-full">
                                        <div className="flex items-center gap-3">
                                            <Icon className={cn("h-6 w-6", selectedFramework === framework.id ? "text-primary" : "text-muted-foreground")} />
                                            <span className="font-bold text-lg text-foreground">{framework.title}</span>
                                        </div>
                                        <RadioGroupItem value={framework.id} id={framework.id} className="h-5 w-5" />
                                    </div>
                                    <p className="text-sm text-muted-foreground mt-2 ml-9">{framework.description}</p>
                                </Label>
                            );
                        })}
                    </RadioGroup>
                </div>
            </CardContent>
            <CardFooter>
                <Button onClick={onNext} disabled={!selectedFramework} size="lg">
                    Next: Define Review Group <ArrowRight className="ml-2" />
                </Button>
            </CardFooter>
        </Card>
    );
}

function ReviewGroupStep({ onBack }: { onBack: () => void }) {
    return (
        <Card className="max-w-4xl mx-auto">
            <CardHeader>
                 <div className="flex justify-between items-start">
                    <div>
                        <CardTitle className="text-3xl font-bold font-headline flex items-center gap-3">
                            <Users className="h-8 w-8 text-primary" />
                            Define Review Group
                        </CardTitle>
                        <CardDescription className="text-lg text-muted-foreground mt-1">
                            Specify who will be part of this performance review cycle.
                        </CardDescription>
                    </div>
                    <Button variant="ghost" onClick={onBack}>
                        <ArrowLeft className="mr-2" /> Back
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="space-y-6 pt-4">
                <div className="p-8 border-2 border-dashed rounded-lg flex flex-col items-center justify-center text-center h-64">
                    <p className="text-muted-foreground">Step 2 content will go here.</p>
                    <p className="text-sm text-muted-foreground">This includes headcount, KPI categories, and KPI assignments.</p>
                </div>
            </CardContent>
            <CardFooter>
                <Button size="lg">
                    Next: Data Collection <ArrowRight className="ml-2" />
                </Button>
            </CardFooter>
        </Card>
    )
}

function GoalsSetup() {
  const [setupStep, setSetupStep] = useState<SetupStep>('framework');

  return (
    <div className="p-4 md:p-8">
        {setupStep === 'framework' && <FrameworkStep onNext={() => setSetupStep('reviewGroup')} />}
        {setupStep === 'reviewGroup' && <ReviewGroupStep onBack={() => setSetupStep('framework')} />}
    </div>
  );
}


export default function GoalsPage() {
  const { role, setRole, isLoading } = useRole();

  if (isLoading || !role) {
    return (
      <DashboardLayout role="Manager" onSwitchRole={() => {}}>
        <Skeleton className="w-full h-screen" />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role={role} onSwitchRole={setRole}>
      <GoalsSetup />
    </DashboardLayout>
  );
}
