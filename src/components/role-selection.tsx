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
  },
  'Team Lead': {
    icon: Users,
  },
  'Manager': {
    icon: Briefcase,
  },
  'HR Head': {
    icon: ShieldCheck,
  },
  'Voice – In Silence': {
    icon: ShieldQuestion,
  }
};

export default function RoleSelection({ onSelectRole }: RoleSelectionProps) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="text-center mb-12">
        <h1 className="font-headline text-4xl font-bold tracking-tight text-primary">Welcome to AccountabilityOS</h1>
        <p className="text-muted-foreground mt-2 text-lg">Please select your role to continue.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-2 max-w-5xl w-full">
        {availableRoles.map(role => {
          const details = roleDetails[role as keyof typeof roleDetails];
          const Icon = details.icon;
          return (
            <div 
              key={role} 
              className="group cursor-pointer transform transition-all duration-300 hover:scale-110 hover:drop-shadow-lg flex flex-col items-center text-center p-2 gap-2"
              onClick={() => onSelectRole(role)}
            >
              <div className="p-4 bg-primary/10 rounded-full transition-colors group-hover:bg-primary/20">
                <Icon className="h-10 w-10 text-primary" />
              </div>
              <div>
                <h2 className="font-headline text-2xl text-foreground">{role}</h2>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
