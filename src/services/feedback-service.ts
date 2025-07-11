
/**
 * @fileOverview A service for managing feedback submissions using sessionStorage.
 *
 * This service provides a simple, client-side persistent storage mechanism for feedback,
 * suitable for a prototype. It now includes custom event dispatching for same-tab updates.
 */
import { v4 as uuidv4 } from 'uuid';
import type { Role } from '@/hooks/use-role';
import type { AnalyzeOneOnOneOutput, CriticalCoachingInsight } from '@/ai/schemas/one-on-one-schemas';

export interface AuditEvent {
  event: string;
  timestamp: Date | string; 
  actor: Role;
  details?: string;
}

// Simplified status for the first level of escalation
export type FeedbackStatus = 
  | 'Open' 
  | 'Pending Supervisor Action'
  | 'To-Do'
  | 'Resolved';
  
export interface ActionItem {
    id: string;
    text: string;
    status: 'pending' | 'completed';
    owner: Role;
}

export interface Feedback {
  trackingId: string;
  subject: string;
  message: string;
  submittedAt: Date | string; 
  summary?: string;
  criticality?: 'Low' | 'Medium' | 'High' | 'Critical';
  criticalityReasoning?: string;
  auditTrail?: AuditEvent[];
  viewed?: boolean;
  status?: FeedbackStatus;
  assignedTo?: Role;
  resolution?: string;
  oneOnOneId?: string; // Link back to the 1-on-1 history item
  supervisor?: Role; 
  employee?: Role;
  supervisorUpdate?: string;
  actionItems?: ActionItem[];
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

// Client-side tracking types
export interface TrackFeedbackInput {
  trackingId: string;
}
export interface TrackedFeedback {
  trackingId: string;
  subject: string;
  submittedAt: string;
  status?: FeedbackStatus;
  assignedTo?: Role;
  auditTrail?: AuditEvent[];
  resolution?: string;
}
export interface TrackFeedbackOutput {
  found: boolean;
  feedback?: TrackedFeedback;
}


const FEEDBACK_KEY = 'accountability_feedback_v3';
const ONE_ON_ONE_HISTORY_KEY = 'one_on_one_history_v3';


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

export async function saveOneOnOneHistory(item: Omit<OneOnOneHistoryItem, 'id' | 'assignedTo'>): Promise<OneOnOneHistoryItem> {
    const history = await getOneOnOneHistory();
    const newHistoryItem: OneOnOneHistoryItem = { ...item, id: uuidv4(), assignedTo: null };
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
        allHistory[index].analysis.criticalCoachingInsight!.supervisorResponse = response;
        allHistory[index].analysis.criticalCoachingInsight!.status = 'pending_employee_acknowledgement';
        saveToStorage(ONE_ON_ONE_HISTORY_KEY, allHistory);
    } else {
        throw new Error("Could not find history item or critical insight to update.");
    }
}

export async function submitEmployeeAcknowledgement(historyId: string, acknowledgement: string): Promise<void> {
    let allHistory = await getOneOnOneHistory();
    const index = allHistory.findIndex(h => h.id === historyId);
    if (index === -1 || !allHistory[index].analysis.criticalCoachingInsight) {
         throw new Error("Could not find history item or critical insight to update.");
    }
    
    const item = allHistory[index];
    const insight = item.analysis.criticalCoachingInsight as CriticalCoachingInsight;

    insight.employeeAcknowledgement = acknowledgement;

    if (acknowledgement === "The concern was fully addressed to my satisfaction.") {
        insight.status = 'resolved';
    } else {
        insight.status = 'pending_am_review';
        item.assignedTo = 'AM'; // Assign the whole item to AM for visibility
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
  const trackingId = uuidv4();
  const submittedAt = new Date();

  // In a real app, this would be an AI call. For the prototype, we use mock data.
  // const { summary, criticality, criticalityReasoning } = await analyzeFeedback(input);
  const summary = "AI-generated summary of the user's feedback message.";
  const criticality = (['Low', 'Medium', 'High', 'Critical'] as const)[Math.floor(Math.random() * 4)];
  const criticalityReasoning = "AI-generated reasoning for the criticality assessment based on keywords and sentiment.";

  const newFeedback: Feedback = {
    ...input,
    trackingId,
    submittedAt,
    summary,
    criticality,
    criticalityReasoning,
    viewed: false,
    status: 'Open',
    assignedTo: 'HR Head',
    auditTrail: [
      {
        event: 'Submitted',
        timestamp: submittedAt,
        actor: 'Employee', // Represents the anonymous user
        details: 'Feedback was received by the system.',
      },
      {
        event: 'AI Analysis Completed',
        timestamp: new Date(submittedAt.getTime() + 1000), // Simulate a small delay
        actor: 'HR Head', // Represents the system AI
        details: `AI assessed criticality as ${criticality}.`,
      }
    ]
  };

  allFeedback.unshift(newFeedback);
  saveFeedbackToStorage(allFeedback);
  
  return { trackingId };
}

export async function trackFeedback(input: TrackFeedbackInput): Promise<TrackFeedbackOutput> {
  const allFeedback = getFeedbackFromStorage();
  const feedback = allFeedback.find(f => f.trackingId === input.trackingId);

  if (!feedback) {
    return { found: false };
  }
  
  // Create a version of the audit trail that's safe for public viewing
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

export async function markAllFeedbackAsViewed(): Promise<void> {
  let allFeedback = getFeedbackFromStorage();
  if (allFeedback.some(c => !c.viewed)) {
    allFeedback = allFeedback.map(c => ({ ...c, viewed: true }));
    saveFeedbackToStorage(allFeedback);
  }
}

/**
 * Assigns a feedback item to a new role.
 */
export async function assignFeedback(trackingId: string, assignTo: Role, actor: Role, comment: string): Promise<void> {
    const allFeedback = getFeedbackFromStorage();
    const feedbackIndex = allFeedback.findIndex(f => f.trackingId === trackingId);
    if (feedbackIndex === -1) return;

    const item = allFeedback[feedbackIndex];
    item.assignedTo = assignTo;
    item.status = 'Pending Supervisor Action';
    item.auditTrail?.push({
        event: 'Assigned',
        timestamp: new Date(),
        actor,
        details: `Case assigned to ${assignTo}.${comment ? `\nNote: "${comment}"` : ''}`,
    });

    saveFeedbackToStorage(allFeedback);
}

/**
 * Adds a general update to a feedback item's audit trail.
 */
export async function addFeedbackUpdate(trackingId: string, actor: Role, comment: string): Promise<void> {
    const allFeedback = getFeedbackFromStorage();
    const feedbackIndex = allFeedback.findIndex(f => f.trackingId === trackingId);
    if (feedbackIndex === -1) return;

    const item = allFeedback[feedbackIndex];
    item.auditTrail?.push({
        event: 'Update Added',
        timestamp: new Date(),
        actor,
        details: comment,
    });

    saveFeedbackToStorage(allFeedback);
}


/**
 * Supervisor submits an update for a critical insight.
 */
export async function submitSupervisorUpdate(trackingId: string, supervisor: Role, update: string): Promise<void> {
    const allFeedback = getFeedbackFromStorage();
    const feedbackIndex = allFeedback.findIndex(f => f.trackingId === trackingId);
    if (feedbackIndex === -1) return;

    const item = allFeedback[feedbackIndex];
    item.supervisorUpdate = update;
    item.status = 'Resolved'; // For now, the supervisor's action resolves it.
    item.assignedTo = 'HR Head'; // Goes back to HR for archival.
    item.auditTrail?.push({
        event: 'Supervisor Responded',
        timestamp: new Date(),
        actor: supervisor,
        details: update,
    });
    item.auditTrail?.push({
        event: 'Resolved',
        timestamp: new Date(),
        actor: supervisor,
        details: 'Case resolved after supervisor action.',
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
    feedback.status = 'Resolved';
    feedback.resolution = resolution;
    feedback.assignedTo = 'HR Head'; // Final state belongs to HR
    feedback.auditTrail?.push({
        event: 'Resolved',
        timestamp: new Date(),
        actor,
        details: resolution
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
