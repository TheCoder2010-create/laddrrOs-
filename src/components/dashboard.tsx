
import type { Role } from '@/hooks/use-role';
import ManagerDashboard from './dashboards/manager-dashboard';
import LeadDashboard from './dashboards/lead-dashboard';
import EmployeeDashboard from './dashboards/employee-dashboard';
import HRHeadDashboard from './dashboards/hr-head-dashboard';
import AmDashboard from './dashboards/am-dashboard';
import CoachingWidget from './coaching-widget';

interface DashboardProps {
  role: Role;
}

export default function Dashboard({ role }: DashboardProps) {
  const isSupervisor = role === 'Team Lead' || role === 'AM' || role === 'Manager';

  const renderDashboard = () => {
    switch (role) {
      case 'Manager':
        return <ManagerDashboard />;
      case 'Team Lead':
        return <LeadDashboard />;
      case 'AM':
        return <AmDashboard />;
      case 'Employee':
        return <EmployeeDashboard />;
      case 'HR Head':
        return <HRHeadDashboard />;
      default:
        return <div>Invalid Role</div>;
    }
  };

  return (
    <div className="p-4 md:p-8 space-y-8">
      {isSupervisor && <CoachingWidget />}
      {renderDashboard()}
    </div>
  );
}
