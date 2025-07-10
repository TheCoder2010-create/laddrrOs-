
/**
 * @fileOverview A service for managing feedback submissions using localStorage.
 *
 * This service provides a simple, client-side persistent storage mechanism for feedback,
 * suitable for a prototype. It now includes custom event dispatching for same-tab updates.
 */
import { v4 as uuidv4 } from 'uuid';
import type { Role } from '@/hooks/use-role';

export interface AuditEvent {
  event: string;
  timestamp: Date | string; 
  actor: Role;
  details?: string;
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
  status?: 'Open' | 'In Progress' | 'Resolved';
  assignedTo?: Role;
  resolution?: string;
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
  status?: 'Open' | 'In Progress' | 'Resolved';
  assignedTo?: Role;
  auditTrail?: AuditEvent[];
  resolution?: string;
}
export interface TrackFeedbackOutput {
  found: boolean;
  feedback?: TrackedFeedback;
}


const FEEDBACK_KEY = 'accountability_feedback_v1';

// Helper to get feedback from localStorage
const getFeedbackFromStorage = (): Feedback[] => {
  if (typeof window === 'undefined') {
    return [];
  }
  const feedbackJSON = localStorage.getItem(FEEDBACK_KEY);
  if (!feedbackJSON) {
    return [];
  }
  try {
    const feedback = JSON.parse(feedbackJSON) as Feedback[];
    // Dates are stored as strings in JSON, so we need to convert them back
    return feedback.map(c => ({
      ...c,
      submittedAt: new Date(c.submittedAt),
      auditTrail: c.auditTrail?.map(a => ({...a, timestamp: new Date(a.timestamp)}))
    }));
  } catch (error) {
    console.error("Error parsing feedback from localStorage", error);
    return [];
  }
};

// Helper to save feedback to localStorage and notify listeners
const saveFeedbackToStorage = (feedback: Feedback[]): void => {
   if (typeof window === 'undefined') {
    return;
  }
  localStorage.setItem(FEEDBACK_KEY, JSON.stringify(feedback));
  // Dispatch a custom event to notify components in the same tab
  window.dispatchEvent(new CustomEvent('feedbackUpdated'));
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
 * Resolves a feedback item.
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
