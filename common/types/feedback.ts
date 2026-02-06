
import type { Role } from './role';
import type { AnalyzeOneOnOneOutput, CriticalCoachingInsight, CoachingRecommendation, CheckIn, ActionItem, NetsConversationInput, NetsAnalysisOutput } from './ai';

export interface AuditEvent {
  event: string;
  timestamp: Date | string;
  actor: Role | string;
  details?: string;
  isPublic?: boolean;
}

export type FeedbackStatus =
  | 'Open'
  | 'In Progress'
  | 'Pending Supervisor Action'
  | 'Pending Manager Action'
  | 'Pending Identity Reveal'
  | 'Pending Anonymous Reply'
  | 'Pending HR Action'
  | 'Pending Employee Acknowledgment'
  | 'Pending Anonymous Acknowledgement'
  | 'Pending Acknowledgement'
  | 'Final Disposition Required'
  | 'To-Do'
  | 'Resolved'
  | 'Closed'
  | 'Retaliation Claim';


export interface Attachment {
    name: string;
    dataUri: string;
}

export interface Feedback {
  trackingId: string;
  subject: string;
  message: string;
  submittedAt: Date | string;
  submittedBy?: Role;
  summary?: string;
  criticality?: 'Low' | 'Medium' | 'High' | 'Critical' | 'Retaliation Claim';
  criticalityReasoning?: string;
  auditTrail?: AuditEvent[];
  viewed?: boolean;
  status?: FeedbackStatus;
  assignedTo?: Role[];
  resolution?: string;
  oneOnOneId?: string;
  supervisor?: Role | string;
  employee?: Role | string;
  supervisorUpdate?: string;
  actionItems?: ActionItem[];
  isAnonymous?: boolean;
  managerResolution?: string;
  hrHeadResolution?: string;
  parentCaseId?: string;
  attachmentNames?: string[];
  attachments?: Attachment[];
}

export interface OneOnOneHistoryItem {
    id: string;
    supervisorName: string;
    employeeName: string;
    date: string;
    analysis: AnalyzeOneOnOneOutput;
    assignedTo?: Role[];
}

export interface AssignedPracticeScenario {
    id: string;
    assignedBy: Role | 'System';
    assignedTo: Role;
    scenario: string;
    persona: Role;
    status: 'pending' | 'completed';
    assignedAt: string;
    dueDate: string;
    completedAt?: string;
    analysis?: NetsAnalysisOutput;
}

export interface ActionItemWithSource extends ActionItem {
    sourceType: '1-on-1' | 'Coaching' | 'Training';
    source: string;
    dueDate?: string;
}

export interface AnalyzeOneOnOneResult {
  analysisOutput: AnalyzeOneOnOneOutput;
  feedbackRecords: Feedback[];
  assignedPracticeScenario?: AssignedPracticeScenario;
}
