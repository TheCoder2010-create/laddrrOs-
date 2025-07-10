import type { Role } from '@/hooks/use-role';
import { availableRoles } from '@/hooks/use-role';
import { Briefcase, Users, UserCheck, ShieldCheck, ShieldQuestion } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RoleSelectionProps {
  onSelectRole: (role: Role) => void;
}

const roleDetails = {
  'Employee': {
    icon: UserCheck,
    description: "Focus on personal tasks and contribute to team goals.",
  },
  'Team Lead': {
    icon: Users,
    description: "Lead project execution and mentor team members.",
  },
  'Manager': {
    icon: Briefcase,
    description: "Oversee team performance and manage resources.",
  },
  'HR Head': {
    icon: ShieldCheck,
    description: "Review compliance and ensure accountability standards.",
  },
  'Voice – In Silence': {
    icon: ShieldQuestion,
    description: "Raise a concern safely and anonymously.",
  }
};

export default function RoleSelection({ onSelectRole }: RoleSelectionProps) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="text-center mb-12">
        <h1 className="font-headline text-4xl font-bold tracking-tight text-primary">Welcome to AccountabilityOS</h1>
        <p className="text-muted-foreground mt-2 text-lg">Please select your role to continue to your personalized dashboard.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 max-w-7xl w-full">
        {availableRoles.map(role => {
          const details = roleDetails[role as keyof typeof roleDetails];
          const Icon = details.icon;
          return (
            <div 
              key={role} 
              className="group cursor-pointer transform transition-all duration-300 hover:scale-110 hover:drop-shadow-lg flex flex-col items-center text-center p-4 gap-4"
              onClick={() => onSelectRole(role)}
            >
              <div className="p-4 bg-primary/10 rounded-full transition-colors group-hover:bg-primary/20">
                <Icon className="h-10 w-10 text-primary" />
              </div>
              <div>
                <h2 className="font-headline text-2xl text-foreground">{role}</h2>
                <p className="text-sm text-muted-foreground">{details.description}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
