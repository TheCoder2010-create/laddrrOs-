

/**
 * @fileOverview A service for managing feedback submissions using sessionStorage.
 *
 * This service provides a simple, client-side persistent storage mechanism for feedback,
 * suitable for a prototype. It now includes custom event dispatching for same-tab updates.
 */
import { v4 as uuidv4 } from 'uuid';
import type { Role } from '@/hooks/use-role';
import { roleUserMapping } from '@/lib/role-mapping';
import type { AnalyzeOneOnOneOutput, CriticalCoachingInsight, CoachingRecommendation, CheckIn } from '@/ai/schemas/one-on-one-schemas';
import { summarizeAnonymousFeedback } from '@/ai/flows/summarize-anonymous-feedback-flow';

// Helper function to generate a new ID format
const generateTrackingId = () => `Org-Ref-${Math.floor(100000 + Math.random() * 900000)}`;

export interface AuditEvent {
  event: string;
  timestamp: Date | string; 
  actor: Role | string;
  details?: string;
}

// Simplified status for the first level of escalation
export type FeedbackStatus = 
  | 'Open' 
  | 'In Progress'
  | 'Pending Supervisor Action'
  | 'Pending Manager Action'
  | 'Pending Identity Reveal'
  | 'Pending Anonymous Reply'
  | 'Pending HR Action'
  | 'Pending Employee Acknowledgment' // New status for identified concerns
  | 'Pending Anonymous Acknowledgement' // For anonymous users to ack HR resolution
  | 'Pending Acknowledgement' // For FYI notifications
  | 'Final Disposition Required' // For HR's final action
  | 'To-Do'
  | 'Resolved'
  | 'Closed'
  | 'Retaliation Claim'; // New status for child cases

export interface ActionItem {
    id: string;
    text: string;
    status: 'pending' | 'completed';
    owner: Role | string;
}

export interface Feedback {
  trackingId: string;
  subject: string;
  message: string;
  submittedAt: Date | string; 
  submittedBy?: Role; // For identified concerns
  summary?: string;
  criticality?: 'Low' | 'Medium' | 'High' | 'Critical' | 'Retaliation Claim';
  criticalityReasoning?: string;
  auditTrail?: AuditEvent[];
  viewed?: boolean;
  status?: FeedbackStatus;
  assignedTo?: Role[];
  resolution?: string;
  oneOnOneId?: string; // Link back to the 1-on-1 history item
  supervisor?: Role | string; 
  employee?: Role | string;
  supervisorUpdate?: string;
  actionItems?: ActionItem[];
  isAnonymous?: boolean; // Flag for anonymous submissions from dashboard
  managerResolution?: string; // For collaborative resolution
  hrHeadResolution?: string;  // For collaborative resolution
  parentCaseId?: string; // For retaliation claims
  attachment?: {
    name: string;
    type: string;
    size: number;
  };
  source?: 'Voice – In Silence';
}

export interface OneOnOneHistoryItem {
    id: string;
    supervisorName: string;
    employeeName: string;
    date: string;
    analysis: AnalyzeOneOnOneOutput;
    // We add a top-level assignedTo for escalation routing outside the insight
    assignedTo?: Role | null; 
}

// Client-side submission types
export interface AnonymousFeedbackInput {
  subject: string;
  message: string;
}
export interface AnonymousFeedbackOutput {
  trackingId: string;
}

export interface IdentifiedConcernInput {
    submittedBy: string;
    submittedByRole: Role;
    recipient: Role;
    subject: string;
    message: string;
    criticality: 'Low' | 'Medium' | 'High' | 'Critical';
}

export interface RetaliationReportInput {
    parentCaseId: string;
    submittedBy: Role;
    description: string;
    file?: File | null;
}

export interface DirectRetaliationReportInput {
    submittedBy: Role;
    subject: string;
    description: string;
    file?: File | null;
}

// Client-side tracking types
export interface TrackFeedbackInput {
  trackingId: string;
}
export interface TrackedFeedback {
  trackingId: string;
  subject: string;
  submittedAt: string;
  status?: FeedbackStatus;
  assignedTo?: Role[];
  auditTrail?: AuditEvent[];
  resolution?: string;
}
export interface TrackFeedbackOutput {
  found: boolean;
  feedback?: TrackedFeedback | Feedback; // Can return full feedback for interactive widgets
}


const FEEDBACK_KEY = 'accountability_feedback_v3';
const ONE_ON_ONE_HISTORY_KEY = 'one_on_one_history_v3';

const getIdentifiedCaseKey = (role: string | null) => role ? `identified_cases_${role.replace(/\s/g, '_')}` : null;


// ==========================================
// Generic Storage Helpers
// ==========================================

const getFromStorage = <T>(key: string): T[] => {
    if (typeof window === 'undefined') return [];
    const json = sessionStorage.getItem(key);
    if (!json) return [];
    try {
        const data = JSON.parse(json) as any[];
        // Basic data migration/validation
        if (key === FEEDBACK_KEY && data.length > 0 && !data[0].status) {
             console.log("Old feedback data detected, clearing for new structure.");
             sessionStorage.removeItem(key);
             return [];
        }
        return data as T[];
    } catch (e) {
        console.error(`Error parsing ${key} from sessionStorage`, e);
        return [];
    }
}

const saveToStorage = (key: string, data: any[]): void => {
    if (typeof window === 'undefined') return;
    sessionStorage.setItem(key, JSON.stringify(data));
    window.dispatchEvent(new CustomEvent('feedbackUpdated'));
    window.dispatchEvent(new Event('storage')); // for wider compatibility
}


// ==========================================
// 1-on-1 History Service
// ==========================================

export async function getOneOnOneHistory(): Promise<OneOnOneHistoryItem[]> {
    const history = getFromStorage<OneOnOneHistoryItem>(ONE_ON_ONE_HISTORY_KEY);
    return history.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export async function getDeclinedCoachingAreasForSupervisor(supervisorName: string): Promise<string[]> {
    const history = await getOneOnOneHistory();
    const declinedAreas = new Set<string>();

    history.forEach(item => {
        if (item.supervisorName === supervisorName) {
            item.analysis.coachingRecommendations.forEach(rec => {
                // A recommendation is officially declined only after the manager acknowledges it,
                // or if the AM approved the decline and it's pending manager acknowledgement.
                if (rec.status === 'declined' || rec.status === 'pending_manager_acknowledgement') {
                    declinedAreas.add(rec.area);
                }
            });
        }
    });

    return Array.from(declinedAreas);
}

export async function getActiveCoachingPlansForSupervisor(supervisorName: string): Promise<{ historyId: string, rec: CoachingRecommendation }[]> {
    const history = await getOneOnOneHistory();
    const activePlans: { historyId: string, rec: CoachingRecommendation }[] = [];

    history.forEach(item => {
        if (item.supervisorName === supervisorName) {
            item.analysis.coachingRecommendations.forEach(rec => {
                if (rec.status === 'accepted') {
                    activePlans.push({ historyId: item.id, rec });
                }
            });
        }
    });

    return activePlans;
}


export async function saveOneOnOneHistory(item: Omit<OneOnOneHistoryItem, 'id' | 'assignedTo'>): Promise<OneOnOneHistoryItem> {
    const history = await getOneOnOneHistory();
    const newHistoryItem: OneOnOneHistoryItem = { ...item, id: generateTrackingId(), assignedTo: null };
    history.unshift(newHistoryItem);
    saveToStorage(ONE_ON_ONE_HISTORY_KEY, history);
    return newHistoryItem;
}

export async function updateOneOnOneHistoryItem(updatedItem: OneOnOneHistoryItem): Promise<void> {
    let allHistory = await getOneOnOneHistory();
    const index = allHistory.findIndex(h => h.id === updatedItem.id);
    if (index !== -1) {
        allHistory[index] = updatedItem;
        saveToStorage(ONE_ON_ONE_HISTORY_KEY, allHistory);
    }
}

export async function submitSupervisorInsightResponse(historyId: string, response: string): Promise<void> {
    let allHistory = await getOneOnOneHistory();
    const index = allHistory.findIndex(h => h.id === historyId);
    if (index !== -1 && allHistory[index].analysis.criticalCoachingInsight) {
        const item = allHistory[index];
        item.analysis.criticalCoachingInsight!.supervisorResponse = response;
        item.analysis.criticalCoachingInsight!.status = 'pending_employee_acknowledgement';

        if (!item.analysis.criticalCoachingInsight!.auditTrail) {
            item.analysis.criticalCoachingInsight!.auditTrail = [];
        }
        item.analysis.criticalCoachingInsight!.auditTrail.push({
            event: 'Responded',
            timestamp: new Date(),
            actor: item.supervisorName,
            details: response,
        });
        
        saveToStorage(ONE_ON_ONE_HISTORY_KEY, allHistory);
    } else {
        throw new Error("Could not find history item or critical insight to update.");
    }
}

export async function submitEmployeeAcknowledgement(historyId: string, acknowledgement: string, comments: string, previousStatus?: CriticalCoachingInsight['status']): Promise<void> {
    let allHistory = await getOneOnOneHistory();
    const index = allHistory.findIndex(h => h.id === historyId);
    if (index === -1 || !allHistory[index].analysis.criticalCoachingInsight) {
         throw new Error("Could not find history item or critical insight to update.");
    }
    
    const item = allHistory[index];
    const insight = item.analysis.criticalCoachingInsight as CriticalCoachingInsight;

    const fullAcknowledgement = `${acknowledgement}${comments ? `\n\nComments: ${comments}` : ''}`;
    insight.employeeAcknowledgement = fullAcknowledgement;
    
    if (!insight.auditTrail) {
        insight.auditTrail = [];
    }
    insight.auditTrail.push({
        event: 'Acknowledged',
        timestamp: new Date(),
        actor: item.employeeName as Role,
        details: fullAcknowledgement,
    });
    
    const wasAmResponse = insight.auditTrail?.some(e => e.event === 'AM Responded to Employee');
    const wasRetry = insight.auditTrail?.some(e => e.event === 'Supervisor Retry Action');
    const wasManagerAction = insight.auditTrail?.some(e => e.event === 'Manager Resolution');
    const wasHrAction = insight.auditTrail?.some(e => e.event === 'HR Resolution');

    if (acknowledgement === "The concern was fully addressed to my satisfaction.") {
        insight.status = 'resolved';
    } else if (wasHrAction) {
        insight.status = 'pending_final_hr_action';
        item.assignedTo = 'HR Head';
    } else if (wasManagerAction) {
        insight.status = 'pending_hr_review';
        item.assignedTo = 'HR Head';
    } else if (wasRetry || wasAmResponse) {
        insight.status = 'pending_manager_review';
        item.assignedTo = 'Manager';
    } else {
        insight.status = 'pending_am_review';
        item.assignedTo = 'AM';
    }

    saveToStorage(ONE_ON_ONE_HISTORY_KEY, allHistory);
}

export async function submitAmCoachingNotes(historyId: string, actor: Role, notes: string): Promise<void> {
    let allHistory = await getOneOnOneHistory();
    const index = allHistory.findIndex(h => h.id === historyId);
    if (index === -1 || !allHistory[index].analysis.criticalCoachingInsight) {
         throw new Error("Could not find history item or critical insight to update.");
    }
    
    const item = allHistory[index];
    const insight = item.analysis.criticalCoachingInsight as CriticalCoachingInsight;

    insight.status = 'pending_supervisor_retry';
    
    if (!insight.auditTrail) {
        insight.auditTrail = [];
    }
    insight.auditTrail.push({
        event: 'AM Coaching Notes',
        timestamp: new Date(),
        actor: actor,
        details: notes,
    });

    saveToStorage(ONE_ON_ONE_HISTORY_KEY, allHistory);
}

export async function submitAmDirectResponse(historyId: string, actor: Role, notes: string): Promise<void> {
    let allHistory = await getOneOnOneHistory();
    const index = allHistory.findIndex(h => h.id === historyId);
    if (index === -1 || !allHistory[index].analysis.criticalCoachingInsight) {
         throw new Error("Could not find history item or critical insight to update.");
    }

    const item = allHistory[index];
    const insight = item.analysis.criticalCoachingInsight as CriticalCoachingInsight;
    
    // Send back to employee for acknowledgement
    insight.status = 'pending_employee_acknowledgement';

    if (!insight.auditTrail) {
        insight.auditTrail = [];
    }
    insight.auditTrail.push({
        event: 'AM Responded to Employee',
        timestamp: new Date(),
        actor: actor,
        details: notes,
    });

    saveToStorage(ONE_ON_ONE_HISTORY_KEY, allHistory);
}


export async function escalateToManager(historyId: string, actor: Role, notes: string): Promise<void> {
    let allHistory = await getOneOnOneHistory();
    const index = allHistory.findIndex(h => h.id === historyId);
    if (index === -1 || !allHistory[index].analysis.criticalCoachingInsight) {
         throw new Error("Could not find history item or critical insight to update.");
    }
    
    const item = allHistory[index];
    const insight = item.analysis.criticalCoachingInsight as CriticalCoachingInsight;

    insight.status = 'pending_manager_review';
    item.assignedTo = 'Manager';
    
    if (!insight.auditTrail) {
        insight.auditTrail = [];
    }
    insight.auditTrail.push({
        event: 'Escalated by AM',
        timestamp: new Date(),
        actor: actor,
        details: `Case escalated to Manager for direct intervention. Notes: ${notes}`,
    });

    saveToStorage(ONE_ON_ONE_HISTORY_KEY, allHistory);
}

export async function submitSupervisorRetry(historyId: string, retryNotes: string): Promise<void> {
    let allHistory = await getOneOnOneHistory();
    const index = allHistory.findIndex(h => h.id === historyId);
    if (index === -1 || !allHistory[index].analysis.criticalCoachingInsight) {
         throw new Error("Could not find history item or critical insight to update.");
    }
    
    const item = allHistory[index];
    const insight = item.analysis.criticalCoachingInsight as CriticalCoachingInsight;

    // Reset for the next acknowledgement round
    insight.status = 'pending_employee_acknowledgement';
    
    if (!insight.auditTrail) {
        insight.auditTrail = [];
    }
    insight.auditTrail.push({
        event: 'Supervisor Retry Action',
        timestamp: new Date(),
        actor: item.supervisorName as Role, // Assuming supervisorName is a valid Role
        details: retryNotes,
    });

    saveToStorage(ONE_ON_ONE_HISTORY_KEY, allHistory);
}

export async function submitManagerResolution(historyId: string, actor: Role, notes: string): Promise<void> {
    let allHistory = await getOneOnOneHistory();
    const index = allHistory.findIndex(h => h.id === historyId);
    if (index === -1 || !allHistory[index].analysis.criticalCoachingInsight) {
         throw new Error("Could not find history item or critical insight to update.");
    }
    
    const item = allHistory[index];
    const insight = item.analysis.criticalCoachingInsight as CriticalCoachingInsight;

    // Send back to employee for acknowledgement
    insight.status = 'pending_employee_acknowledgement';
    item.assignedTo = null; // Unassign so it only appears in employee's inbox
    
    if (!insight.auditTrail) {
        insight.auditTrail = [];
    }
    insight.auditTrail.push({
        event: 'Manager Resolution',
        timestamp: new Date(),
        actor: actor,
        details: notes,
    });

    saveToStorage(ONE_ON_ONE_HISTORY_KEY, allHistory);
}

export async function submitHrResolution(historyId: string, actor: Role, notes: string): Promise<void> {
    let allHistory = await getOneOnOneHistory();
    const index = allHistory.findIndex(h => h.id === historyId);
    if (index === -1 || !allHistory[index].analysis.criticalCoachingInsight) {
         throw new Error("Could not find history item or critical insight to update.");
    }
    
    const item = allHistory[index];
    const insight = item.analysis.criticalCoachingInsight as CriticalCoachingInsight;

    // Send back to employee for one last acknowledgement
    insight.status = 'pending_employee_acknowledgement';
    
    if (!insight.auditTrail) {
        insight.auditTrail = [];
    }
    insight.auditTrail.push({
        event: 'HR Resolution',
        timestamp: new Date(),
        actor: actor,
        details: notes,
    });

    saveToStorage(ONE_ON_ONE_HISTORY_KEY, allHistory);
}


export async function submitFinalHrDecision(historyId: string, actor: Role, decision: string, notes: string): Promise<void> {
    let allHistory = await getOneOnOneHistory();
    const index = allHistory.findIndex(h => h.id === historyId);
    if (index === -1 || !allHistory[index].analysis.criticalCoachingInsight) {
        throw new Error("Could not find history item or critical insight to update.");
    }

    const item = allHistory[index];
    const insight = item.analysis.criticalCoachingInsight as CriticalCoachingInsight;
    
    // This is the end of the line. Mark as resolved.
    insight.status = 'resolved';
    item.assignedTo = null; // No longer assigned to anyone

    if (!insight.auditTrail) {
        insight.auditTrail = [];
    }
    insight.auditTrail.push({
        event: decision, // e.g., 'Assigned to Ombudsman'
        timestamp: new Date(),
        actor: actor,
        details: notes,
    });

    saveToStorage(ONE_ON_ONE_HISTORY_KEY, allHistory);
}

export async function updateCoachingRecommendationStatus(
    historyId: string, 
    recommendationId: string, 
    status: 'accepted' | 'declined', 
    data?: { reason?: string, startDate?: string, endDate?: string }
): Promise<void> {
    let allHistory = await getOneOnOneHistory();
    const historyIndex = allHistory.findIndex(h => h.id === historyId);
    if (historyIndex === -1) throw new Error("History item not found.");
    
    const item = allHistory[historyIndex];
    const recIndex = item.analysis.coachingRecommendations.findIndex(rec => rec.id === recommendationId);
    if (recIndex === -1) throw new Error("Coaching recommendation not found.");
    
    const recommendation = item.analysis.coachingRecommendations[recIndex];
    const supervisorName = item.supervisorName;

    // Initialize audit trail if it doesn't exist
    if (!recommendation.auditTrail) {
        recommendation.auditTrail = [];
    }

    if (status === 'accepted') {
        recommendation.status = 'accepted';
        recommendation.startDate = data?.startDate;
        recommendation.endDate = data?.endDate;
        recommendation.progress = 0; // Initialize progress
        recommendation.auditTrail.push({
            event: 'Recommendation Accepted',
            actor: supervisorName,
            timestamp: new Date().toISOString(),
            details: `Plan set from ${data?.startDate ? new Date(data.startDate).toLocaleDateString() : 'N/A'} to ${data?.endDate ? new Date(data.endDate).toLocaleDateString() : 'N/A'}.`
        });

        // Create notification for AM and Manager
        const allFeedback = getFeedbackFromStorage();
        const notification: Feedback = {
            trackingId: generateTrackingId(),
            subject: `Development Plan Started by ${supervisorName}`,
            message: `${supervisorName} has accepted a coaching recommendation and started a new development plan for the area: "${recommendation.area}".\n\n**Recommendation:** ${recommendation.recommendation}\n**Resource:** ${recommendation.type} - "${recommendation.resource}"\n**Timeline:** ${data?.startDate ? new Date(data.startDate).toLocaleDateString() : 'N/A'} to ${data?.endDate ? new Date(data.endDate).toLocaleDateString() : 'N/A'}.`,
            submittedAt: new Date(),
            criticality: 'Low',
            status: 'Pending Acknowledgement',
            assignedTo: ['AM', 'Manager'],
            viewed: false,
            auditTrail: [{
                event: 'Notification Created',
                timestamp: new Date(),
                actor: 'System',
                details: `Automated notification for accepted coaching plan by ${supervisorName}.`
            }]
        };
        allFeedback.unshift(notification);
        saveFeedbackToStorage(allFeedback);

    } else if (status === 'declined') {
        recommendation.status = 'pending_am_review';
        recommendation.rejectionReason = data?.reason;
        recommendation.auditTrail.push({
            event: 'Recommendation Declined by Supervisor',
            actor: supervisorName,
            timestamp: new Date().toISOString(),
            details: `Reason: ${data?.reason}`,
        });
    }
    
    saveToStorage(ONE_ON_ONE_HISTORY_KEY, allHistory);
}

export async function updateCoachingProgress(historyId: string, recommendationId: string, progress: number): Promise<void> {
    let allHistory = await getOneOnOneHistory();
    const historyIndex = allHistory.findIndex(h => h.id === historyId);
    if (historyIndex === -1) throw new Error("History item not found.");
    
    const item = allHistory[historyIndex];
    const recIndex = item.analysis.coachingRecommendations.findIndex(rec => rec.id === recommendationId);
    if (recIndex === -1) throw new Error("Coaching recommendation not found.");
    
    const recommendation = item.analysis.coachingRecommendations[recIndex];
    recommendation.progress = progress;
    
    saveToStorage(ONE_ON_ONE_HISTORY_KEY, allHistory);
}

export async function addCoachingCheckIn(historyId: string, recommendationId: string, notes: string): Promise<void> {
    let allHistory = await getOneOnOneHistory();
    const historyIndex = allHistory.findIndex(h => h.id === historyId);
    if (historyIndex === -1) throw new Error("History item not found.");

    const item = allHistory[historyIndex];
    const recIndex = item.analysis.coachingRecommendations.findIndex(rec => rec.id === recommendationId);
    if (recIndex === -1) throw new Error("Coaching recommendation not found.");

    const recommendation = item.analysis.coachingRecommendations[recIndex];
    
    if (!recommendation.checkIns) {
        recommendation.checkIns = [];
    }

    const newCheckIn: CheckIn = {
        id: uuidv4(),
        date: new Date().toISOString(),
        notes: notes,
    };

    recommendation.checkIns.push(newCheckIn);

    saveToStorage(ONE_ON_ONE_HISTORY_KEY, allHistory);
}


export async function reviewCoachingRecommendationDecline(
    historyId: string,
    recommendationId: string,
    amActor: Role,
    approved: boolean,
    amNotes: string
): Promise<void> {
    let allHistory = await getOneOnOneHistory();
    const historyIndex = allHistory.findIndex(h => h.id === historyId);
    if (historyIndex === -1) throw new Error("History item not found.");

    const item = allHistory[historyIndex];
    const recIndex = item.analysis.coachingRecommendations.findIndex(rec => rec.id === recommendationId);
    if (recIndex === -1) throw new Error("Coaching recommendation not found.");

    const recommendation = item.analysis.coachingRecommendations[recIndex];
    
    if (!recommendation.auditTrail) {
        recommendation.auditTrail = [];
    }

    if (approved) {
        recommendation.status = 'pending_manager_acknowledgement'; // Escalate to manager for FYI
        recommendation.auditTrail.push({
            event: "Decline Approved by AM",
            actor: amActor,
            timestamp: new Date().toISOString(),
            details: `AM approved decline. Notes: ${amNotes}`
        });
    } else {
        recommendation.status = 'accepted';
        recommendation.progress = 0;
        const now = new Date();
        const endDate = new Date(new Date().setDate(now.getDate() + 30)); // Default 30 day timeline
        recommendation.startDate = now.toISOString();
        recommendation.endDate = endDate.toISOString();

        recommendation.auditTrail.push({
            event: "Decline Denied by AM",
            actor: amActor,
            timestamp: new Date().toISOString(),
            details: `AM upheld AI recommendation and created a mandatory development plan. Notes: ${amNotes}`
        });
    }

    saveToStorage(ONE_ON_ONE_HISTORY_KEY, allHistory);
}

export async function acknowledgeDeclinedRecommendation(
    historyId: string,
    recommendationId: string,
    managerActor: Role
): Promise<void> {
    let allHistory = await getOneOnOneHistory();
    const historyIndex = allHistory.findIndex(h => h.id === historyId);
    if (historyIndex === -1) throw new Error("History item not found.");

    const item = allHistory[historyIndex];
    const recIndex = item.analysis.coachingRecommendations.findIndex(rec => rec.id === recommendationId);
    if (recIndex === -1) throw new Error("Coaching recommendation not found.");

    const recommendation = item.analysis.coachingRecommendations[recIndex];

    recommendation.status = 'declined'; // Final status
    if (!recommendation.auditTrail) {
        recommendation.auditTrail = [];
    }
    recommendation.auditTrail.push({
        event: "Manager Acknowledged Declined Recommendation",
        actor: managerActor,
        timestamp: new Date().toISOString(),
        details: "Manager acknowledged the AM's approval of the decline. This recommendation is now closed."
    });

    saveToStorage(ONE_ON_ONE_HISTORY_KEY, allHistory);
}


// ==========================================
// Feedback Service
// ==========================================

export const getFeedbackFromStorage = (): Feedback[] => {
  const feedback = getFromStorage<Feedback>(FEEDBACK_KEY);
  return feedback.map(c => ({
    ...c,
    submittedAt: new Date(c.submittedAt),
    auditTrail: c.auditTrail?.map(a => ({...a, timestamp: new Date(a.timestamp)}))
  }));
};

export const saveFeedbackToStorage = (feedback: Feedback[]): void => {
   saveToStorage(FEEDBACK_KEY, feedback);
};

export async function submitAnonymousFeedback(input: AnonymousFeedbackInput): Promise<AnonymousFeedbackOutput> {
  const allFeedback = getFeedbackFromStorage();
  const trackingId = generateTrackingId();
  const submittedAt = new Date();

  const newFeedback: Feedback = {
    ...input,
    trackingId,
    submittedAt,
    viewed: false,
    status: 'Open',
    assignedTo: [],
    source: 'Voice – In Silence',
    auditTrail: [
      {
        event: 'Submitted',
        timestamp: submittedAt,
        actor: 'Anonymous',
        details: 'Feedback was received by the system.',
      },
    ]
  };

  allFeedback.unshift(newFeedback);
  saveFeedbackToStorage(allFeedback);
  
  return { trackingId };
}

export async function summarizeFeedback(trackingId: string): Promise<void> {
    const allFeedback = getFeedbackFromStorage();
    const feedbackIndex = allFeedback.findIndex(f => f.trackingId === trackingId);
    if (feedbackIndex === -1) {
        throw new Error("Feedback item not found.");
    }

    const feedback = allFeedback[feedbackIndex];
    if (feedback.summary) {
        return; // Already summarized
    }

    // Call the on-demand summarization flow
    const analysis = await summarizeAnonymousFeedback({
        subject: feedback.subject,
        message: feedback.message,
    });

    // Update the feedback item with the analysis results
    feedback.summary = analysis.summary;
    feedback.criticality = analysis.criticality;
    feedback.criticalityReasoning = analysis.criticalityReasoning;

    if (!feedback.auditTrail) {
        feedback.auditTrail = [];
    }
    feedback.auditTrail.push({
        event: 'AI Analysis Completed',
        timestamp: new Date(),
        actor: 'HR Head', // Attributed to the user who triggered it
        details: `AI assessed criticality as ${analysis.criticality}.`,
    });
    
    saveFeedbackToStorage(allFeedback);
}

export async function submitAnonymousConcernFromDashboard(input: AnonymousFeedbackInput): Promise<AnonymousFeedbackOutput> {
    const allFeedback = getFeedbackFromStorage();
    const trackingId = generateTrackingId();
    const newFeedback: Feedback = {
        ...input,
        trackingId,
        submittedAt: new Date(),
        isAnonymous: true,
        status: 'Pending Manager Action', // Route directly to Manager
        assignedTo: ['Manager'],
        criticality: 'Medium', // Default criticality
        auditTrail: [{
            event: 'Submitted',
            timestamp: new Date(),
            actor: 'Anonymous',
            details: 'A concern was submitted anonymously from a user dashboard.'
        }]
    };
    allFeedback.unshift(newFeedback);
    saveFeedbackToStorage(allFeedback);
    return { trackingId };
}

export async function submitIdentifiedConcern(input: IdentifiedConcernInput): Promise<AnonymousFeedbackOutput> {
    const allFeedback = getFeedbackFromStorage();
    const trackingId = generateTrackingId();
    const newFeedback: Feedback = {
        trackingId: trackingId,
        subject: input.subject,
        message: input.message,
        submittedAt: new Date(),
        submittedBy: input.submittedByRole,
        criticality: input.criticality,
        status: 'Pending Supervisor Action', 
        assignedTo: [input.recipient],
        viewed: false,
        auditTrail: [
            {
                event: 'Identified Concern Submitted',
                timestamp: new Date(),
                actor: input.submittedByRole,
                details: `Concern submitted by ${input.submittedBy} (${input.submittedByRole}) to ${input.recipient}.`
            }
        ]
    };
    allFeedback.unshift(newFeedback);
    saveFeedbackToStorage(allFeedback);
    return { trackingId };
}

export async function submitDirectRetaliationReport(input: DirectRetaliationReportInput): Promise<AnonymousFeedbackOutput> {
    const allFeedback = getFeedbackFromStorage();
    const trackingId = generateTrackingId();
    const newRetaliationCase: Feedback = {
        trackingId,
        subject: input.subject,
        message: input.description,
        submittedAt: new Date(),
        submittedBy: input.submittedBy,
        criticality: 'Retaliation Claim',
        status: 'Retaliation Claim',
        assignedTo: ['HR Head'],
        viewed: false,
        auditTrail: [{
            event: 'Retaliation Claim Submitted',
            timestamp: new Date(),
            actor: input.submittedBy,
            details: `A direct retaliation claim was submitted.${input.file ? ` An attachment named "${input.file.name}" was securely uploaded.` : ''}`
        }],
        attachment: input.file ? { name: input.file.name, type: input.file.type, size: input.file.size } : undefined,
    };
    allFeedback.unshift(newRetaliationCase);
    saveFeedbackToStorage(allFeedback);
    return { trackingId };
}


export async function submitRetaliationReport(input: RetaliationReportInput): Promise<AnonymousFeedbackOutput> {
    const allFeedback = getFeedbackFromStorage();
    const childCaseId = generateTrackingId();

    // Create the new child retaliation case
    const newRetaliationCase: Feedback = {
        trackingId: childCaseId,
        parentCaseId: input.parentCaseId,
        subject: `Retaliation Claim`,
        message: input.description,
        submittedAt: new Date(),
        submittedBy: input.submittedBy,
        criticality: 'Retaliation Claim',
        status: 'Retaliation Claim',
        assignedTo: ['HR Head'],
        viewed: false,
        auditTrail: [{
            event: 'Retaliation Claim Submitted',
            timestamp: new Date(),
            actor: input.submittedBy,
            details: `Claim submitted for case ${input.parentCaseId}.\nNew Case ID: ${childCaseId}${input.file ? `\nAn attachment named "${input.file.name}" was securely uploaded.` : ''}`
        }],
        attachment: input.file ? { name: input.file.name, type: input.file.type, size: input.file.size } : undefined,
    };
    allFeedback.unshift(newRetaliationCase);
    
    // Add an event to the parent case linking to the new child case
    const parentCaseIndex = allFeedback.findIndex(f => f.trackingId === input.parentCaseId);
    if (parentCaseIndex !== -1) {
        if (!allFeedback[parentCaseIndex].auditTrail) {
            allFeedback[parentCaseIndex].auditTrail = [];
        }
        allFeedback[parentCaseIndex].auditTrail!.push({
            event: 'Retaliation Claim Filed',
            timestamp: new Date(),
            actor: input.submittedBy,
            details: `A new retaliation claim has been filed and linked to this case. New Case ID: ${childCaseId}`
        });
    }

    saveFeedbackToStorage(allFeedback);
    return { trackingId: childCaseId };
}

export async function submitHrRetaliationResponse(trackingId: string, actor: Role, response: string): Promise<void> {
    const allFeedback = getFeedbackFromStorage();
    const feedbackIndex = allFeedback.findIndex(f => f.trackingId === trackingId);
    if (feedbackIndex === -1) return;

    const item = allFeedback[feedbackIndex];
    item.status = 'Pending Employee Acknowledgment';
    item.supervisorUpdate = response; // Re-use this field for the response
    
    // Ensure the employee who submitted the claim is assigned to see the response.
    if (item.submittedBy) {
        item.assignedTo = [item.submittedBy];
    } else {
        // Fallback, though a retaliation claim should always have a submitter.
        item.assignedTo = [];
    }


    item.auditTrail?.push({
        event: 'HR Responded to Retaliation Claim',
        timestamp: new Date(),
        actor,
        details: response,
    });

    saveFeedbackToStorage(allFeedback);
}


export async function trackFeedback(input: TrackFeedbackInput): Promise<TrackFeedbackOutput> {
  const allFeedback = getFeedbackFromStorage();
  const feedback = allFeedback.find(f => f.trackingId === input.trackingId);

  if (!feedback) {
    return { found: false };
  }
  
  // If the case requires interaction, return the full object.
  if (['Pending Identity Reveal', 'Pending Anonymous Reply', 'Pending Anonymous Acknowledgement'].includes(feedback.status || '')) {
      return { found: true, feedback };
  }

  // Otherwise, create a limited, public-safe version of the feedback
  const publicAuditTrail = feedback.auditTrail?.map(event => ({
      event: event.event,
      timestamp: new Date(event.timestamp).toISOString(),
      actor: event.actor,
      // Omit details for privacy unless it's a 'Resolved' event
      details: event.event === 'Resolved' ? event.details : undefined,
  }));

  return {
    found: true,
    feedback: {
      trackingId: feedback.trackingId,
      subject: feedback.subject,
      submittedAt: new Date(feedback.submittedAt).toISOString(),
      status: feedback.status,
      assignedTo: feedback.assignedTo,
      auditTrail: publicAuditTrail,
      resolution: feedback.resolution,
    },
  };
}

export async function getFeedbackById(id: string): Promise<Feedback | null> {
    const allFeedback = getFeedbackFromStorage();
    return allFeedback.find(f => f.trackingId === id) || null;
}

export async function getFeedbackByIds(ids: string[]): Promise<Feedback[]> {
    const allFeedback = getFeedbackFromStorage();
    return allFeedback.filter(f => ids.includes(f.trackingId));
}


export async function getCriticalFeedbackByOneOnOneId(oneOnOneId: string): Promise<Feedback | null> {
    const allFeedback = getFeedbackFromStorage();
    return allFeedback.find(f => f.oneOnOneId === oneOnOneId && f.criticality === 'Critical') || null;
}

export async function getAllFeedback(): Promise<Feedback[]> {
  return getFeedbackFromStorage();
}

export async function saveFeedback(feedback: Feedback[], append = false): Promise<void> {
    if (append) {
        const existingFeedback = getFeedbackFromStorage();
        saveFeedbackToStorage([...feedback, ...existingFeedback]);
    } else {
        saveFeedbackToStorage(feedback);
    }
}

export async function markAllFeedbackAsViewed(idsToMark?: string[]): Promise<void> {
  let allFeedback = getFeedbackFromStorage();
  let changed = false;

  if (idsToMark) {
    allFeedback = allFeedback.map(c => {
        if (idsToMark.includes(c.trackingId) && !c.viewed) {
            changed = true;
            return { ...c, viewed: true };
        }
        return c;
    });
  } else { // Fallback to old behavior if no IDs are passed
      if (allFeedback.some(c => !c.viewed)) {
        changed = true;
        allFeedback = allFeedback.map(c => ({ ...c, viewed: true }));
      }
  }
  
  if (changed) {
    saveFeedbackToStorage(allFeedback);
  }
}

/**
 * Assigns or unassigns roles for a feedback item.
 */
export async function assignFeedback(
    trackingId: string, 
    roles: Role[], 
    actor: Role, 
    comment: string,
    mode: 'assign' | 'unassign' = 'assign'
): Promise<void> {
    const allFeedback = getFeedbackFromStorage();
    const feedbackIndex = allFeedback.findIndex(f => f.trackingId === trackingId);
    if (feedbackIndex === -1) return;

    const item = allFeedback[feedbackIndex];
    const currentAssignees = new Set(item.assignedTo || []);

    if (mode === 'assign') {
        roles.forEach(role => currentAssignees.add(role));
        item.status = 'In Progress';
    } else { // unassign
        roles.forEach(role => currentAssignees.delete(role));
    }
    
    item.assignedTo = Array.from(currentAssignees);

    const eventName = mode === 'assign' ? 'Assigned' : 'Unassigned';
    item.auditTrail?.push({
        event: eventName,
        timestamp: new Date(),
        actor,
        details: `Case ${eventName.toLowerCase()} for ${roles.join(', ')}.${comment ? `\nNote: "${comment}"` : ''}`,
    });

    saveFeedbackToStorage(allFeedback);
}


/**
 * Adds a general update to a feedback item's audit trail.
 */
export async function addFeedbackUpdate(trackingId: string, actor: Role, comment: string, file?: File | null): Promise<void> {
    const allFeedback = getFeedbackFromStorage();
    const feedbackIndex = allFeedback.findIndex(f => f.trackingId === trackingId);
    if (feedbackIndex === -1) return;

    const item = allFeedback[feedbackIndex];
    
    let details = comment;
    if (file) {
        details += `\n\n[System]: An attachment named "${file.name}" was securely uploaded.`;
        item.attachment = { name: file.name, type: file.type, size: file.size };
    }

    item.auditTrail?.push({
        event: 'Update Added',
        timestamp: new Date(),
        actor,
        details: details,
    });

    saveFeedbackToStorage(allFeedback);
}

/**
 * Submits a collaborative resolution from a Manager or HR Head.
 * The case is only resolved when both parties have submitted their resolution.
 */
export async function submitCollaborativeResolution(trackingId: string, actor: Role, comment: string): Promise<void> {
    const allFeedback = getFeedbackFromStorage();
    const feedbackIndex = allFeedback.findIndex(f => f.trackingId === trackingId);
    if (feedbackIndex === -1) return;

    const item = allFeedback[feedbackIndex];

    if (actor === 'HR Head') {
        item.hrHeadResolution = comment;
        item.auditTrail?.push({ event: 'HR Head provided resolution', timestamp: new Date(), actor, details: comment });
    } else if (actor === 'Manager') {
        item.managerResolution = comment;
        item.auditTrail?.push({ event: 'Manager provided resolution', timestamp: new Date(), actor, details: comment });
    }

    // Check if both have provided their resolutions
    if (item.hrHeadResolution && item.managerResolution) {
        item.status = 'Resolved';
        const finalResolution = `JOINT RESOLUTION:\n\nManager: ${item.managerResolution}\n\nHR Head: ${item.hrHeadResolution}`;
        item.resolution = finalResolution;
        item.auditTrail?.push({ event: 'Resolved', timestamp: new Date(), actor: 'System', details: 'Case resolved by joint agreement.' });
    }

    saveFeedbackToStorage(allFeedback);
}



/**
 * Supervisor submits an update for a critical insight or identified concern.
 * This now sends it back to the employee for acknowledgment.
 */
export async function submitSupervisorUpdate(trackingId: string, supervisor: Role, update: string): Promise<void> {
    const allFeedback = getFeedbackFromStorage();
    const feedbackIndex = allFeedback.findIndex(f => f.trackingId === trackingId);
    if (feedbackIndex === -1) return;

    const item = allFeedback[feedbackIndex];
    item.supervisorUpdate = update;
    item.status = 'Pending Employee Acknowledgment'; // Send for acknowledgment
    item.assignedTo = []; // Unset assignee so it leaves the manager's queue
    
    // Use a more specific event for HR to break the loop
    const eventName = supervisor === 'HR Head' ? 'HR Resolution Submitted' : 'Supervisor Responded';

    item.auditTrail?.push({
        event: eventName,
        timestamp: new Date(),
        actor: supervisor,
        details: update,
    });

    saveFeedbackToStorage(allFeedback);
}

/**
 * Handles the employee's acknowledgment of a feedback resolution.
 * Can resolve the case or escalate it.
 */
export async function submitEmployeeFeedbackAcknowledgement(trackingId: string, accepted: boolean, comments: string): Promise<void> {
    const allFeedback = getFeedbackFromStorage();
    const feedbackIndex = allFeedback.findIndex(f => f.trackingId === trackingId);
    if (feedbackIndex === -1) return;

    const item = allFeedback[feedbackIndex];
    const actor = item.submittedBy || 'Anonymous';
    
    const relevantEvents = ['Supervisor Responded', 'HR Resolution Submitted', 'HR Responded to Retaliation Claim'];
    const lastResponderEvent = item.auditTrail?.slice().reverse().find(e => relevantEvents.includes(e.event));
    const lastResponder = lastResponderEvent?.actor as Role | undefined;

    if (accepted) {
        item.status = 'Resolved';
        item.resolution = item.supervisorUpdate;
        item.auditTrail?.push({
            event: 'Employee Accepted Resolution',
            timestamp: new Date(),
            actor: actor,
            details: `Resolution accepted.${comments ? `\nComments: ${comments}` : ''}`
        });
        item.auditTrail?.push({
            event: 'Resolved',
            timestamp: new Date(),
            actor: actor,
            details: 'Case resolved after employee acknowledgment.',
        });
    } else {
        const escalationDetails = `Resolution not accepted. Escalating further.${comments ? `\nComments: ${comments}` : ''}`;
        
        let nextAssignee: Role | undefined = undefined;
        let nextStatus: FeedbackStatus = 'Pending Manager Action';

        const lastResponderRole = Object.values(roleUserMapping).find(u => u.name === lastResponder)?.role || lastResponder;
        
        if (item.criticality === 'Retaliation Claim' || lastResponderEvent?.event === 'HR Resolution Submitted') {
             item.status = 'Final Disposition Required';
             item.assignedTo = ['HR Head'];
             item.auditTrail?.push({
                event: 'Final Disposition Required',
                timestamp: new Date(),
                actor: 'System',
                details: 'Employee rejected HR resolution. Final disposition is required from HR Head.'
            });
        } else if (lastResponderRole === 'Team Lead') {
            nextAssignee = 'AM';
            nextStatus = 'Pending Manager Action';
        } else if (lastResponderRole === 'AM') {
            nextAssignee = 'Manager';
            nextStatus = 'Pending Manager Action';
        } else if (lastResponderRole === 'Manager') {
            nextAssignee = 'HR Head';
            nextStatus = 'Pending HR Action';
        }


        if (nextAssignee) {
             item.status = nextStatus;
             item.assignedTo = [nextAssignee];
             item.auditTrail?.push({
                event: 'Employee Escalated Concern',
                timestamp: new Date(),
                actor: actor,
                details: `Concern escalated to ${nextAssignee}. ${escalationDetails}`
            });
        }
    }

    saveFeedbackToStorage(allFeedback);
}

export async function submitAnonymousAcknowledgement(
    trackingId: string, 
    accepted: boolean, 
    escalationPath: string, 
    justification: string
): Promise<void> {
    const allFeedback = getFeedbackFromStorage();
    const feedbackIndex = allFeedback.findIndex(f => f.trackingId === trackingId);
    if (feedbackIndex === -1) return;

    const item = allFeedback[feedbackIndex];
    if (item.status !== 'Pending Anonymous Acknowledgement') return;

    if (accepted) {
        item.status = 'Resolved';
        item.auditTrail?.push({
            event: 'Resolution Accepted',
            timestamp: new Date(),
            actor: 'Anonymous',
            details: 'Anonymous user accepted the final resolution from HR.'
        });
    } else {
        item.status = 'Closed';
        item.resolution = `Case closed after user escalated to ${escalationPath}.\n\nUser Justification: ${justification}`;
        item.auditTrail?.push({
            event: 'User Escalated to ' + escalationPath,
            timestamp: new Date(),
            actor: 'Anonymous',
            details: `User challenged the HR resolution and chose to escalate to the ${escalationPath}.\n\nJustification: ${justification}`
        });
    }

    item.auditTrail?.push({
        event: 'Case Closed',
        timestamp: new Date(),
        actor: 'System',
        details: 'The case was closed following the anonymous user\'s final decision.'
    });

    saveFeedbackToStorage(allFeedback);
}


/**
 * Resolves a feedback item.
 */
export async function resolveFeedback(trackingId: string, actor: Role, resolution: string): Promise<void> {
    const allFeedback = getFeedbackFromStorage();
    const feedbackIndex = allFeedback.findIndex(f => f.trackingId === trackingId);

    if (feedbackIndex === -1) return;

    const feedback = allFeedback[feedbackIndex];
    
    // For anonymous "Voice - in Silence" cases, resolving it puts it in a pending state for the user
    if (feedback.source === 'Voice – In Silence' && actor === 'HR Head') {
        feedback.status = 'Pending Anonymous Acknowledgement';
        feedback.resolution = resolution;
        feedback.auditTrail?.push({
            event: 'Resolution Provided by HR',
            timestamp: new Date(),
            actor,
            details: resolution,
        });
        feedback.auditTrail?.push({
            event: 'Notification to HR',
            timestamp: new Date(),
            actor: 'System',
            details: 'The resolution has been sent to the user for final acknowledgement. If the complainant is dissatisfied, they will have the option to escalate the case to the Ombudsman or Grievance Office.'
        });
    } else {
        feedback.status = 'Resolved';
        feedback.resolution = resolution;
        feedback.assignedTo = [];
        feedback.auditTrail?.push({
            event: 'Resolved',
            timestamp: new Date(),
            actor,
            details: resolution
        });
    }

    saveFeedbackToStorage(allFeedback);
}

export async function submitFinalDisposition(trackingId: string, actor: Role, disposition: string, notes: string): Promise<void> {
    const allFeedback = getFeedbackFromStorage();
    const feedbackIndex = allFeedback.findIndex(f => f.trackingId === trackingId);
    if (feedbackIndex === -1) return;

    const item = allFeedback[feedbackIndex];
    item.status = 'Closed';
    item.resolution = `Final Disposition: ${disposition}.\n\nHR Notes: ${notes}`;
    item.assignedTo = [];
    item.auditTrail?.push({
        event: 'Final Disposition',
        timestamp: new Date(),
        actor: actor,
        details: `Case routed to ${disposition}. Notes: ${notes}`
    });
     item.auditTrail?.push({
        event: 'Closed',
        timestamp: new Date(),
        actor: 'System',
        details: 'Case closed after final disposition by HR.'
    });

    saveFeedbackToStorage(allFeedback);
}

/**
 * Toggles the status of a specific action item within a feedback object.
 */
export async function toggleActionItemStatus(trackingId: string, actionItemId: string): Promise<void> {
    const allFeedback = getFeedbackFromStorage();
    const feedbackIndex = allFeedback.findIndex(f => f.trackingId === trackingId);
    if (feedbackIndex === -1) return;

    const feedback = allFeedback[feedbackIndex];
    if (!feedback.actionItems) return;

    const actionItemIndex = feedback.actionItems.findIndex(a => a.id === actionItemId);
    if (actionItemIndex === -1) return;

    const currentStatus = feedback.actionItems[actionItemIndex].status;
    feedback.actionItems[actionItemIndex].status = currentStatus === 'pending' ? 'completed' : 'pending';

    saveFeedbackToStorage(allFeedback);
}


export async function requestIdentityReveal(trackingId: string, actor: Role, reason: string): Promise<void> {
    const allFeedback = getFeedbackFromStorage();
    const feedbackIndex = allFeedback.findIndex(f => f.trackingId === trackingId);
    if (feedbackIndex === -1) return;

    const item = allFeedback[feedbackIndex];
    item.status = 'Pending Identity Reveal';

    const commitmentText = `**Manager’s Acknowledgment:**\n"I acknowledge my responsibility to protect the employee from any form of bias, retaliation, or adverse consequence during this process. I am committed to handling this matter with fairness, discretion, and confidentiality."\n\n**Manager’s Reason:**`;
    const details = `${commitmentText}\n"${reason}"`;
    
    item.auditTrail?.push({
        event: 'Identity Reveal Requested',
        timestamp: new Date(),
        actor: actor,
        details: details,
    });

    saveFeedbackToStorage(allFeedback);
}


export async function respondToIdentityReveal(trackingId: string, actor: Role, accepted: boolean): Promise<void> {
    const allFeedback = getFeedbackFromStorage();
    const feedbackIndex = allFeedback.findIndex(f => f.trackingId === trackingId);
    if (feedbackIndex === -1) return;

    const item = allFeedback[feedbackIndex];
    const user = roleUserMapping[actor];

    if (accepted) {
        item.isAnonymous = false;
        item.submittedBy = user.role;
        item.status = 'Pending Manager Action'; // Return to manager's queue, now identified
        item.auditTrail?.push({
            event: 'User acknowledged retaliation/bias feature',
            timestamp: new Date(),
            actor: user.role,
            details: 'User was informed of the retaliation/bias reporting feature and acknowledged this before revealing their identity.',
        });
        item.auditTrail?.push({
            event: 'Identity Revealed',
            timestamp: new Date(),
            actor: user.role,
            details: `User ${user.name} accepted the request and revealed their identity.`,
        });

        // Add the tracking ID to the identified list in localStorage
        const key = getIdentifiedCaseKey(actor);
        if (key) {
            const existingIds = JSON.parse(localStorage.getItem(key) || '[]');
            if (!existingIds.includes(trackingId)) {
                existingIds.push(trackingId);
                localStorage.setItem(key, JSON.stringify(existingIds));
            }
        }

    } else {
        item.status = 'Pending HR Action';
        item.assignedTo = ['Manager', 'HR Head'];
        item.auditTrail?.push({
            event: 'Identity Reveal Declined; Escalated to HR',
            timestamp: new Date(),
            actor: 'Anonymous',
            details: `User declined the request to reveal their identity. Case has been escalated to HR Head and Manager for collaborative review.`,
        });
    }

    saveFeedbackToStorage(allFeedback);
}

export async function employeeAcknowledgeMessageRead(trackingId: string, actor: Role): Promise<void> {
    const allFeedback = getFeedbackFromStorage();
    const feedbackIndex = allFeedback.findIndex(f => f.trackingId === trackingId);
    if (feedbackIndex === -1) return;

    const item = allFeedback[feedbackIndex];

    // Check if this event already exists to prevent duplicates
    const alreadyAcknowledged = item.auditTrail?.some(e => e.event === "Employee acknowledged manager's assurance message");

    if (!alreadyAcknowledged) {
        item.auditTrail?.push({
            event: "Employee acknowledged manager's assurance message",
            timestamp: new Date(),
            actor: 'Anonymous',
            details: `The user has read and acknowledged the manager's message and assurance of a non-retaliatory process.`
        });
        saveFeedbackToStorage(allFeedback);
    }
}

export async function requestAnonymousInformation(trackingId: string, actor: Role, question: string): Promise<void> {
    const allFeedback = getFeedbackFromStorage();
    const feedbackIndex = allFeedback.findIndex(f => f.trackingId === trackingId);
    if (feedbackIndex === -1) return;

    const item = allFeedback[feedbackIndex];
    item.status = 'Pending Anonymous Reply';
    
    item.auditTrail?.push({
        event: 'Information Requested',
        timestamp: new Date(),
        actor: actor,
        details: question,
    });

    saveFeedbackToStorage(allFeedback);
}

export async function submitAnonymousReply(trackingId: string, reply: string): Promise<void> {
    const allFeedback = getFeedbackFromStorage();
    const feedbackIndex = allFeedback.findIndex(f => f.trackingId === trackingId);
    if (feedbackIndex === -1) return;

    const item = allFeedback[feedbackIndex];
    
    if (item.source === 'Voice – In Silence') {
        item.status = 'In Progress'; // Keep it in HR's view
    } else {
        item.status = 'Pending Manager Action';
    }
    
    item.auditTrail?.push({
        event: 'Anonymous User Responded',
        timestamp: new Date(),
        actor: 'Anonymous',
        details: reply,
    });

    saveFeedbackToStorage(allFeedback);
}
    
