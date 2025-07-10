import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { availableRoles, type Role } from '@/hooks/use-role';
import { Briefcase, Users, UserCheck, ShieldCheck } from 'lucide-react';

interface RoleSelectionProps {
  onSelectRole: (role: Role) => void;
}

const roleDetails = {
  'Manager': {
    icon: Briefcase,
    description: "Oversee team performance and manage resources.",
  },
  'Team Lead': {
    icon: Users,
    description: "Lead project execution and mentor team members.",
  },
  'Employee': {
    icon: UserCheck,
    description: "Focus on personal tasks and contribute to team goals.",
  },
  'Auditor': {
    icon: ShieldCheck,
    description: "Review compliance and ensure accountability standards.",
  },
};

export default function RoleSelection({ onSelectRole }: RoleSelectionProps) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="text-center mb-12">
        <h1 className="font-headline text-4xl font-bold tracking-tight text-primary">Welcome to AccountabilityOS</h1>
        <p className="text-muted-foreground mt-2 text-lg">Please select your role to continue to your personalized dashboard.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl w-full">
        {availableRoles.map(role => {
          const details = roleDetails[role as keyof typeof roleDetails];
          const Icon = details.icon;
          return (
            <Card 
              key={role} 
              className="group cursor-pointer transform transition-all duration-300 hover:scale-105 hover:shadow-lg hover:border-primary shadow-md"
              onClick={() => onSelectRole(role)}
            >
              <CardHeader className="items-center text-center">
                <div className="p-4 bg-primary/10 rounded-full mb-4 transition-colors group-hover:bg-primary/20">
                  <Icon className="h-10 w-10 text-primary" />
                </div>
                <CardTitle className="font-headline text-2xl">{role}</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <CardDescription>{details.description}</CardDescription>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
