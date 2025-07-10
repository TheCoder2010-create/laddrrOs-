import type { Role } from '@/hooks/use-role';
import ManagerDashboard from './dashboards/manager-dashboard';
import LeadDashboard from './dashboards/lead-dashboard';
import ContributorDashboard from './dashboards/contributor-dashboard';
import AuditorDashboard from './dashboards/auditor-dashboard';

interface DashboardProps {
  role: Role;
}

export default function Dashboard({ role }: DashboardProps) {
  const renderDashboard = () => {
    switch (role) {
      case 'Manager':
        return <ManagerDashboard />;
      case 'Team Lead':
        return <LeadDashboard />;
      case 'Individual Contributor':
        return <ContributorDashboard />;
      case 'Auditor':
        return <AuditorDashboard />;
      default:
        return <div>Invalid Role</div>;
    }
  };

  return (
    <div className="p-4 md:p-8">
      {renderDashboard()}
    </div>
  );
}
