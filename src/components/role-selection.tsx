
import type { Role } from '@/hooks/use-role';
import { useRole } from '@/hooks/use-role';
import { Briefcase, Users, UserCheck, ShieldCheck, ShieldQuestion, UserCog, ChevronRight } from 'lucide-react';
import Header from './header';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface RoleSelectionProps {
  onSelectRole: (role: Role) => void;
}

const roleDetails = {
  'Employee': {
    icon: UserCheck,
    description: "Access your tasks and feedback.",
  },
  'Team Lead': {
    icon: Users,
    description: "Manage your team's performance.",
  },
  'AM': {
    icon: UserCog,
    description: "Coach leads and track escalations.",
  },
  'Manager': {
    icon: Briefcase,
    description: "Oversee departmental accountability.",
  },
  'HR Head': {
    icon: ShieldCheck,
    description: "Access the vault and manage all cases.",
  },
  'Voice – In Silence': {
    icon: ShieldQuestion,
    description: "Submit feedback with full anonymity.",
  }
};

export default function RoleSelection({ onSelectRole }: RoleSelectionProps) {
  const { availableRoles } = useRole();
  const specialRole = 'Voice – In Silence';
  const standardRoles = availableRoles.filter(r => r !== specialRole);

  const RoleTile = ({ role, isSpecial = false }: { role: Role, isSpecial?: boolean }) => {
    const details = roleDetails[role as keyof typeof roleDetails];
    const Icon = details.icon;
    return (
      <button
        onClick={() => onSelectRole(role)}
        className={cn(
          "group relative w-full text-left rounded-lg transition-all duration-300 ease-in-out overflow-hidden",
           "bg-card/50 hover:bg-card/100 hover:-translate-y-1 hover:shadow-2xl hover:shadow-primary/20",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          isSpecial 
            ? "border-2 border-dashed border-muted-foreground/50 hover:border-primary hover:bg-primary/10" 
            : "p-4"
        )}
      >
        <div className="flex items-center gap-4">
            <Icon className="h-6 w-6 text-muted-foreground transition-colors group-hover:text-primary" />
            <div>
              <p className="font-semibold text-foreground">{role}</p>
            </div>
          </div>
      </button>
    );
  };
  
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-1 flex flex-col items-center justify-center p-4">
        <Card className="w-full max-w-sm border-0 bg-transparent shadow-none md:border md:bg-card/30 md:shadow-lg">
          <CardHeader className="px-4 md:px-6 pt-4 pb-2">
            <p className="text-muted-foreground">Please select your role to continue.</p>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 p-4 md:p-6 pt-0">
            {standardRoles.map((role) => (
              <RoleTile key={role} role={role} />
            ))}
            {availableRoles.includes(specialRole) && (
              <>
                <div className="relative flex py-2 items-center">
                  <div className="flex-grow border-t border-border"></div>
                  <span className="flex-shrink mx-4 text-xs text-muted-foreground uppercase">Or</span>
                  <div className="flex-grow border-t border-border"></div>
                </div>
                <RoleTile role={specialRole} isSpecial={true} />
              </>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
