import DevelopmentPlanWidget from "./development-plan-widget";
import RecentOneOnOneWidget from "./recent-one-on-one-widget";
import AiInsightFeedWidget from "./ai-insight-feed-widget";
import NextStepsWidget from "./next-steps-widget";
import NetsScoreboardWidget from "./nets-scoreboard-widget";
import TeamPulseWidget from "./team-pulse-widget";
import CoachingTipWidget from "./coaching-tip-widget";

export default function EmployeeDashboard() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <RecentOneOnOneWidget />
        <NextStepsWidget />
      </div>
      <div className="space-y-6">
        <DevelopmentPlanWidget />
        <AiInsightFeedWidget />
        <NetsScoreboardWidget />
        <CoachingTipWidget />
        <TeamPulseWidget />
      </div>
    </div>
  );
}
