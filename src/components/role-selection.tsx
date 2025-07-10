import type { Role } from '@/hooks/use-role';
import { useRole } from '@/hooks/use-role';
import { Briefcase, Users, UserCheck, ShieldCheck, ShieldQuestion, UserCog } from 'lucide-react';
import Header from './header';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

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
  'AM': {
    icon: UserCog,
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
  const { availableRoles } = useRole();

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-1 flex flex-col items-center justify-center p-4">
        <div className="text-center mb-12">
          <h1 className="font-headline text-4xl font-bold tracking-tight text-foreground">Welcome to AccountabilityOS</h1>
          <p className="text-muted-foreground mt-2 text-lg">Please select your role to continue.</p>
        </div>
        <div className="w-full max-w-md">
            <div className="flex flex-col">
            {availableRoles.map((role, index) => {
                const details = roleDetails[role as keyof typeof roleDetails];
                const Icon = details.icon;
                return (
                <Button 
                    key={role} 
                    size="lg"
                    className={cn(
                        "w-full justify-start text-base py-8",
                        "hover:bg-primary/90",
                        "focus-visible:ring-offset-0",
                        {
                            "rounded-t-lg rounded-b-none": index === 0,
                            "rounded-none": index > 0 && index < availableRoles.length - 1,
                            "rounded-b-lg rounded-t-none": index === availableRoles.length - 1,
                        }
                    )}
                    onClick={() => onSelectRole(role)}
                >
                    <Icon className="mr-4 h-6 w-6" />
                    <span>{role}</span>
                </Button>
                );
            })}
            </div>
        </div>
      </main>
    </div>
  );
}
