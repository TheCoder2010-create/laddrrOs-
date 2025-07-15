
import DevelopmentPlanWidget from "./development-plan-widget";

export default function AmDashboard() {
  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold font-headline mb-6 text-foreground">AM Dashboard</h1>
      <DevelopmentPlanWidget />
    </div>
  );
}
