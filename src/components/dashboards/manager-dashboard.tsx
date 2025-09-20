
import DevelopmentPlanWidget from "./development-plan-widget";
import AssignPracticeWidget from "./assign-practice-widget";

export default function ManagerDashboard() {
  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold font-headline mb-6 text-foreground">Manager Dashboard</h1>
      <AssignPracticeWidget />
      <DevelopmentPlanWidget />
    </div>
  );
}
