
import DevelopmentPlanWidget from "./development-plan-widget";
import OrganizationalLearningMapWidget from "./organizational-learning-map-widget";
import CoachingRoiWidget from "./coaching-roi-widget";
import LeadershipPersonaWidget from "./leadership-persona-widget";
import AttritionRiskWidget from "./attrition-risk-widget";
import AiAdvisorWidget from "./ai-advisor-widget";


export default function ManagerDashboard() {
  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold font-headline mb-6 text-foreground">Manager Dashboard</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <OrganizationalLearningMapWidget />
          <LeadershipPersonaWidget />
        </div>
        <div className="space-y-6">
            <CoachingRoiWidget />
            <AttritionRiskWidget />
        </div>
      </div>
      
       <AiAdvisorWidget />

      <DevelopmentPlanWidget />
    </div>
  );
}
