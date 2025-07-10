
/**
 * @fileOverview A service for managing feedback submissions using localStorage.
 *
 * This service provides a simple, client-side persistent storage mechanism for feedback,
 * suitable for a prototype. It now includes custom event dispatching for same-tab updates.
 */
import { v4 as uuidv4 } from 'uuid';
import type { Role } from '@/hooks/use-role';
import type { AnalyzeOneOnOneOutput } from '@/ai/schemas/one-on-one-schemas';

export interface AuditEvent {
  event: string;
  timestamp: Date | string; 
  actor: Role;
  details?: string;
}

export type FeedbackStatus = 
  | 'Open' 
  | 'In Progress' 
  | 'Pending Supervisor Action'
  | 'Pending Employee Acknowledgement'
  | 'Pending AM Review'
  | 'Pending Manager Acknowledgement'
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
  // New fields for the critical insight workflow
  supervisor?: Role; // The supervisor involved in the 1-on-1
  employee?: Role; // The employee involved in the 1-on-1
  supervisorUpdate?: string;
  employeeAcknowledgement?: {
      approved: boolean;
      justification: string;
  };
  amCoachingNotes?: string;
  managerAcknowledged?: boolean;
  // New field for trackable action items from 1-on-1s
  actionItems?: ActionItem[];
}

export interface OneOnOneHistoryItem {
    id: string;
    supervisorName: string;
    employeeName: string;
    date: string;
    analysis: AnalyzeOneOnOneOutput;
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


const FEEDBACK_KEY = 'accountability_feedback_v1';
const ONE_ON_ONE_HISTORY_KEY = 'one_on_one_history_v1';


// ==========================================
// Generic Storage Helpers
// ==========================================

const getFromStorage = <T>(key: string): T[] => {
    if (typeof window === 'undefined') return [];
    const json = localStorage.getItem(key);
    if (!json) return [];
    try {
        return JSON.parse(json) as T[];
    } catch (e) {
        console.error(`Error parsing ${key} from localStorage`, e);
        return [];
    }
}

const saveToStorage = (key: string, data: any[]): void => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(key, JSON.stringify(data));
    window.dispatchEvent(new CustomEvent('feedbackUpdated'));
    window.dispatchEvent(new CustomEvent('storage')); // for wider compatibility
}


// ==========================================
// 1-on-1 History Service
// ==========================================

export async function getOneOnOneHistory(): Promise<OneOnOneHistoryItem[]> {
    const history = getFromStorage<OneOnOneHistoryItem>(ONE_ON_ONE_HISTORY_KEY);
    return history.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export async function saveOneOnOneHistory(item: Omit<OneOnOneHistoryItem, 'id'>): Promise<OneOnOneHistoryItem> {
    const history = await getOneOnOneHistory();
    const newHistoryItem: OneOnOneHistoryItem = { ...item, id: uuidv4() };
    history.unshift(newHistoryItem);
    saveToStorage(ONE_ON_ONE_HISTORY_KEY, history);
    return newHistoryItem;
}

export async function updateOneOnOneHistoryItem(updatedItem: OneOnOneHistoryItem): Promise<void> {
    const allHistory = await getOneOnOneHistory();
    const index = allHistory.findIndex(h => h.id === updatedItem.id);
    if (index !== -1) {
        allHistory[index] = updatedItem;
        saveToStorage(ONE_ON_ONE_HISTORY_KEY, allHistory);
    }
}


// ==========================================
// Critical Feedback Service
// ==========================================

// Helper to get feedback from localStorage
export const getFeedbackFromStorage = (): Feedback[] => {
  const feedback = getFromStorage<Feedback>(FEEDBACK_KEY);
  // Dates are stored as strings in JSON, so we need to convert them back
  return feedback.map(c => ({
    ...c,
    submittedAt: new Date(c.submittedAt),
    auditTrail: c.auditTrail?.map(a => ({...a, timestamp: new Date(a.timestamp)}))
  }));
};

// Helper to save feedback to localStorage and notify listeners
export const saveFeedbackToStorage = (feedback: Feedback[]): void => {
   saveToStorage(FEEDBACK_KEY, feedback);
};


/**
 * Handles the logic for submitting new anonymous feedback.
 * @param input The user's feedback submission.
 * @returns A promise that resolves with the tracking ID.
 */
export async function submitAnonymousFeedback(input: AnonymousFeedbackInput): Promise<AnonymousFeedbackOutput> {
  const allFeedback = getFeedbackFromStorage();
  const trackingId = uuidv4();
  const submittedAt = new Date();

  // Simulate AI analysis
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
        actor: 'Employee', // Assuming submitter is an employee for demo
        details: 'Feedback was received by the system.',
      },
      {
        event: 'AI Analysis Completed',
        timestamp: new Date(submittedAt.getTime() + 1000), // 1 second later
        actor: 'HR Head', // System action, attributed to HR for demo
        details: `AI assessed criticality as ${criticality}.`,
      }
    ]
  };

  allFeedback.unshift(newFeedback); // Add to the beginning
  saveFeedbackToStorage(allFeedback);
  
  return { trackingId };
}


/**
 * Retrieves a single feedback submission by its tracking ID from localStorage for public tracking.
 * @param input The tracking ID to look for.
 * @returns A promise that resolves with the feedback object, or a 'not found' status.
 */
export async function trackFeedback(input: TrackFeedbackInput): Promise<TrackFeedbackOutput> {
  const allFeedback = getFeedbackFromStorage();
  const feedback = allFeedback.find(f => f.trackingId === input.trackingId);

  if (!feedback) {
    return { found: false };
  }
  
  // Create a safe, public-facing version of the audit trail
  const publicAuditTrail = feedback.auditTrail?.map(event => ({
      event: event.event,
      timestamp: new Date(event.timestamp).toISOString(),
      actor: event.actor, // We will hide this on the front-end
      // Intentionally omitting 'details'
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

/**
 * Retrieves a single feedback item by ID.
 * @param trackingId The ID of the feedback to retrieve.
 * @returns A promise that resolves with the feedback item or null.
 */
export async function getFeedbackById(trackingId: string): Promise<Feedback | null> {
    const allFeedback = getFeedbackFromStorage();
    return allFeedback.find(f => f.trackingId === trackingId) || null;
}

/**
 * Retrieves all feedback submissions from localStorage.
 * @returns A promise that resolves with an array of all feedback submissions.
 */
export async function getAllFeedback(): Promise<Feedback[]> {
  return getFeedbackFromStorage();
}

/**
 * Saves a full array of feedback objects to storage.
 * @param feedback The array of feedback to save.
 */
export async function saveFeedback(feedback: Feedback[]): Promise<void> {
    saveFeedbackToStorage(feedback);
}


/**
 * Marks all feedback as viewed.
 */
export async function markAllFeedbackAsViewed(): Promise<void> {
  let allFeedback = getFeedbackFromStorage();
  if (allFeedback.some(c => !c.viewed)) {
    allFeedback = allFeedback.map(c => ({ ...c, viewed: true }));
    saveFeedbackToStorage(allFeedback);
  }
}

/**
 * Assigns a feedback item to a new role.
 * @param trackingId The ID of the feedback to assign.
 * @param assignTo The role to assign the feedback to.
 * @param actor The role performing the assignment.
 * @param comment An optional comment for the assignment.
 */
export async function assignFeedback(trackingId: string, assignTo: Role, actor: Role, comment?: string): Promise<void> {
    const allFeedback = getFeedbackFromStorage();
    const feedbackIndex = allFeedback.findIndex(f => f.trackingId === trackingId);

    if (feedbackIndex === -1) return;

    const feedback = allFeedback[feedbackIndex];
    feedback.assignedTo = assignTo;
    feedback.status = assignTo === 'HR Head' ? 'Open' : 'In Progress';
    feedback.auditTrail?.push({
        event: 'Assigned',
        timestamp: new Date(),
        actor,
        details: `Assigned to ${assignTo}.${comment ? ` Comment: ${comment}` : ''}`
    });

    saveFeedbackToStorage(allFeedback);
}

/**
 * Adds an update to a feedback item.
 * @param trackingId The ID of the feedback to update.
 * @param actor The role adding the update.
 * @param comment The update comment.
 */
export async function addFeedbackUpdate(trackingId: string, actor: Role, comment: string): Promise<void> {
    const allFeedback = getFeedbackFromStorage();
    const feedbackIndex = allFeedback.findIndex(f => f.trackingId === trackingId);

    if (feedbackIndex === -1) return;

    const feedback = allFeedback[feedbackIndex];
    feedback.auditTrail?.push({
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
    item.status = 'Pending Employee Acknowledgement';
    item.assignedTo = item.employee; // Now the employee needs to act
    item.auditTrail?.push({
        event: 'Supervisor Responded',
        timestamp: new Date(),
        actor: supervisor,
        details: update,
    });

    saveFeedbackToStorage(allFeedback);
}

/**
 * Employee acknowledges the supervisor's update.
 */
export async function submitEmployeeAcknowledgement(trackingId: string, employee: Role, approved: boolean, justification: string): Promise<void> {
    const allFeedback = getFeedbackFromStorage();
    const feedbackIndex = allFeedback.findIndex(f => f.trackingId === trackingId);
    if (feedbackIndex === -1) return;

    const item = allFeedback[feedbackIndex];
    item.employeeAcknowledgement = { approved, justification };

    if (approved) {
        item.status = 'Pending AM Review';
        item.assignedTo = 'AM';
        item.auditTrail?.push({
            event: 'Employee Approved',
            timestamp: new Date(),
            actor: employee,
            details: justification,
        });
    } else {
        item.status = 'Pending AM Review'; // AM needs to review the rejection
        item.assignedTo = 'AM';
        item.auditTrail?.push({
            event: 'Employee Rejected',
            timestamp: new Date(),
            actor: employee,
            details: justification,
        });
    }

    saveFeedbackToStorage(allFeedback);
}


/**
 * AM resolves a case after employee approval.
 */
export async function amAcknowledgeResolution(trackingId: string, am: Role): Promise<void> {
    const allFeedback = getFeedbackFromStorage();
    const feedbackIndex = allFeedback.findIndex(f => f.trackingId === trackingId);
    if (feedbackIndex === -1) return;

    const item = allFeedback[feedbackIndex];
    item.status = 'Pending Manager Acknowledgement';
    item.assignedTo = 'Manager';
    item.auditTrail?.push({
        event: 'AM Acknowledged Resolution',
        timestamp: new Date(),
        actor: am,
        details: 'AM has reviewed and acknowledged the positive resolution.',
    });

    saveFeedbackToStorage(allFeedback);
}


/**
 * AM submits coaching notes after employee rejection.
 */
export async function amSubmitCoachingNotes(trackingId: string, am: Role, notes: string): Promise<void> {
    const allFeedback = getFeedbackFromStorage();
    const feedbackIndex = allFeedback.findIndex(f => f.trackingId === trackingId);
    if (feedbackIndex === -1) return;

    const item = allFeedback[feedbackIndex];
    item.amCoachingNotes = notes;
    item.status = 'Pending Manager Acknowledgement';
    item.assignedTo = 'Manager';
    item.auditTrail?.push({
        event: 'AM Coached Supervisor',
        timestamp: new Date(),
        actor: am,
        details: notes,
    });
    
    saveFeedbackToStorage(allFeedback);
}

/**
 * Manager provides the final acknowledgement.
 */
export async function managerAcknowledge(trackingId: string, manager: Role): Promise<void> {
    const allFeedback = getFeedbackFromStorage();
    const feedbackIndex = allFeedback.findIndex(f => f.trackingId === trackingId);
    if (feedbackIndex === -1) return;

    const item = allFeedback[feedbackIndex];
    item.managerAcknowledged = true;
    item.status = 'Resolved';
    item.assignedTo = 'HR Head'; // Case is now closed and archived under HR
    item.auditTrail?.push({
        event: 'Manager Acknowledged',
        timestamp: new Date(),
        actor: manager,
        details: 'The full cycle has been reviewed and acknowledged by the Manager. Case closed.',
    });

    saveFeedbackToStorage(allFeedback);
}


/**
 * Resolves a feedback item (HR function).
 * @param trackingId The ID of the feedback to resolve.
 * @param actor The role resolving the feedback.
 * @param resolution The resolution comment.
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
