import DevelopmentPlanWidget from "./development-plan-widget";
import RecentOneOnOneWidget from "./recent-one-on-one-widget";
import AiInsightFeedWidget from "./ai-insight-feed-widget";
import NextStepsWidget from "./next-steps-widget";
import NetsScoreboardWidget from "./nets-scoreboard-widget";
import TeamPulseWidget from "./team-pulse-widget";
import CoachingTipWidget from "./coaching-tip-widget";
import MyGoalsWidget from "./my-goals-widget";
import RankCardWidget from "./rank-card-widget";

export default function EmployeeDashboard() {
  return (
    <div className="space-y-6">
      <RecentOneOnOneWidget />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <MyGoalsWidget />
        <RankCardWidget />
      </div>
      <NextStepsWidget />
      <DevelopmentPlanWidget />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <NetsScoreboardWidget />
          <CoachingTipWidget />
          <TeamPulseWidget />
          <AiInsightFeedWidget />
      </div>
    </div>
  );
}
