// frontend/src/types/ai.ts

// --- Types from backend/src/ai/schemas/nets-schemas.ts ---
export type NetsMessage = {
  role: "user" | "model" | "system";
  content: string;
};

export type NetsInitialInput = {
  persona: string;
  scenario: string;
  difficulty?: 'friendly' | 'neutral' | 'strict' | 'aggressive';
};

export type NetsConversationInput = NetsInitialInput & {
  history: NetsMessage[];
};

export type NetsAnalysisOutput = {
    scores: {
        clarity: number;
        empathy: number;
        assertiveness: number;
        overall: number;
    };
    strengths: string[];
    gaps: string[];
    annotatedConversation: (NetsMessage & { annotation?: string; type?: "positive" | "negative"; })[];
};

export type InterviewerAnalysisOutput = NetsAnalysisOutput;

export type NetsSuggestionOutput = {
    suggestedScenario: string;
};

export type NetsNudgeOutput = {
    nudge: string;
};

// --- Types from backend/src/ai/schemas/one-on-one-schemas.ts ---
export type OneOnOneAuditEvent = {
  event: string;
  actor: string;
  timestamp: string;
  details?: string;
};

export type CriticalCoachingInsight = {
    summary: string;
    reason: string;
    severity: "low" | "medium" | "high";
    status: 'open' | 'pending_employee_acknowledgement' | 'resolved' | 'pending_am_review' | 'pending_supervisor_retry' | 'pending_manager_review' | 'pending_hr_review' | 'pending_final_hr_action';
    supervisorResponse?: string;
    employeeAcknowledgement?: string;
    auditTrail?: OneOnOneAuditEvent[];
  };

export type CheckIn = {
    id: string;
    date: string;
    notes: string;
    rating?: "On Track" | "Needs Support" | "Blocked";
};

export type CoachingRecommendation = {
  id: string;
  area: string;
  recommendation: string;
  example?: string;
  type: "Book" | "Podcast" | "Article" | "Course" | "Other";
  resource: string;
  justification: string;
  status?: "pending" | "accepted" | "declined" | "pending_am_review" | "pending_manager_acknowledgement";
  rejectionReason?: string;
  auditTrail?: {
        event: string;
        actor: string;
        timestamp: string;
        details?: string;
    }[];
  startDate?: string;
  endDate?: string;
  progress?: number;
  checkIns?: CheckIn[];
};

export type ActionItem = {
  id: string;
  owner: "Employee" | "Supervisor";
  task: string;
  status?: "pending" | "completed";
  completedAt?: string;
};

export type CoachingImpactAnalysis = {
    goalId: string;
    goalArea: string;
    didApply: boolean;
    applicationExample?: string;
    missedOpportunityExample?: string;
    completedGoalId?: string;
    masteryJustification?: string;
};

export type AnalyzeOneOnOneOutput = {
  supervisorSummary: string;
  employeeSummary: string;
  employeeInsights?: string[];
  employeeSwotAnalysis: {
      strengths: string[];
      weaknesses: string[];
      opportunities: string[];
      threats: string[];
  };
  leadershipScore: number;
  effectivenessScore: number;
  strengthsObserved: {
    action: string;
    example: string;
  }[];
  coachingRecommendations: CoachingRecommendation[];
  actionItems: ActionItem[];
  suggestedPracticeScenario?: string;
  coachingImpactAnalysis?: CoachingImpactAnalysis[];
  missedSignals?: string[];
  criticalCoachingInsight?: CriticalCoachingInsight;
  biasFairnessCheck: {
    flag: boolean;
    details?: string;
  };
  localizationCompliance: {
    applied: boolean;
    locale?: string;
  };
  legalDataCompliance: {
    piiOmitted: boolean;
    privacyRequest: boolean;
  };
  dataHandling?: {
    analysisTimestamp: string;
    recordingDeleted: boolean;
    deletionTimestamp: string;
  };
};

// --- Types from backend/src/ai/schemas/survey-schemas.ts ---
export type SurveyQuestion = {
    id?: string;
    questionText: string;
    reasoning?: string;
    isCustom?: boolean;
};

export type DeployedSurvey = {
    id: string;
    objective: string;
    questions: SurveyQuestion[];
    deployedAt: string;
    status: 'active' | 'closed';
    submissionCount: number;
    optOutCount: number;
    summary?: SummarizeSurveyResultsOutput;
    leadershipPulseSent?: boolean;
    coachingRecommendations?: any[]; // Simplified
};

export type SummarizeSurveyResultsOutput = {
    overallSentiment: string;
    keyThemes: { theme: string; summary: string; }[];
    recommendations: string[];
};

// --- Types from backend/src/ai/schemas/leadership-pulse-schemas.ts ---
export type LeadershipQuestion = {
    id: string;
    questionText: string;
    reasoning?: string;
    type?: 'rating' | 'free-text'; // added for mock data
};

export type GenerateLeadershipPulseOutput = {
    teamLeadQuestions: LeadershipQuestion[];
    amQuestions: LeadershipQuestion[];
    managerQuestions: LeadershipQuestion[];
};


// --- Types from backend/src/ai/schemas/development-suggestion-schemas.ts ---
export type DevelopmentSuggestionInput = {
    userName: string;
    coachingGoalsInProgress: {
        area: string;
        resource: string;
    }[];
};

export type DevelopmentSuggestionOutput = {
    suggestions: {
        area: string;
        resource: string;
        justification: string;
    }[];
};

// --- Types from backend/src/ai/schemas/goal-feedback-schemas.ts ---
export type GoalFeedbackInput = {
    goalArea: string;
    goalDescription: string;
    userSituation: string;
};

export type GoalFeedbackOutput = {
    feedback: string;
};

// --- Types from backend/src/ai/schemas/briefing-packet-schemas.ts ---
export type BriefingPacketInput = {
    supervisorName: string;
    employeeName: string;
    meetingDate: string;
    pastOneOnOneSummaries: { supervisorSummary: string; employeeSummary: string; }[];
    activeGoals: { area: string; resource: string; }[];
    outstandingActionItems: { task: string; owner: "Employee" | "Supervisor"; }[];
    criticalInsights: { summary: string; reason: string; }[];
    upcomingMeetings: { with: string; withRole: string; date: string; time: string; }[];
};

export type BriefingPacketOutput = {
    actionItemAnalysis?: string;
    keyDiscussionPoints?: string[];
    outstandingActionItems?: string[];
    coachingOpportunities?: string[];
    suggestedQuestions?: string[];
    talkingPoints?: string[];
    employeeSummary?: string;
};

// --- Types from backend/src/ai/schemas/interviewer-lab-schemas.ts ---
export type InterviewerConversationInput = {
    transcript: string;
};

// --- Types for backend/src/ai/schemas/performance-chat-schemas.ts ---
export type ChatMessage = {
    role: "user" | "model";
    content: string;
};

export type PerformanceChatInput = {
    userQuestion: string;
    performanceContext: {
        name: string;
        metrics: Record<string, { value: number; trend: string; }>;
    }[];
    chatHistory: ChatMessage[];
};