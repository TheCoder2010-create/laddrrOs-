
/**
 * @fileOverview A service for managing anonymous feedback submissions using localStorage.
 *
 * This service provides a simple, client-side persistent storage mechanism for feedback,
 * suitable for a prototype. It now includes custom event dispatching for same-tab updates.
 */
import { v4 as uuidv4 } from 'uuid';

export interface AuditEvent {
  event: string;
  timestamp: Date | string; // Allow string for JSON compatibility
  details?: string;
}

export interface Feedback {
  trackingId: string;
  subject: string;
  message: string;
  submittedAt: Date | string; // Allow string for JSON compatibility
  summary?: string;
  criticality?: 'Low' | 'Medium' | 'High' | 'Critical';
  criticalityReasoning?: string;
  auditTrail?: AuditEvent[];
  viewed?: boolean;
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
  message: string;
  submittedAt: string;
}
export interface TrackFeedbackOutput {
  found: boolean;
  feedback?: TrackedFeedback;
}


const COMPLAINTS_KEY = 'accountability_complaints_v2';

// Helper to get complaints from localStorage
const getComplaintsFromStorage = (): Feedback[] => {
  if (typeof window === 'undefined') {
    return [];
  }
  const complaintsJSON = localStorage.getItem(COMPLAINTS_KEY);
  if (!complaintsJSON) {
    return [];
  }
  try {
    const complaints = JSON.parse(complaintsJSON) as Feedback[];
    // Dates are stored as strings in JSON, so we need to convert them back
    return complaints.map(c => ({
      ...c,
      submittedAt: new Date(c.submittedAt),
      auditTrail: c.auditTrail?.map(a => ({...a, timestamp: new Date(a.timestamp)}))
    }));
  } catch (error) {
    console.error("Error parsing complaints from localStorage", error);
    return [];
  }
};

// Helper to save complaints to localStorage
const saveComplaintsToStorage = (complaints: Feedback[]): void => {
   if (typeof window === 'undefined') {
    return;
  }
  localStorage.setItem(COMPLAINTS_KEY, JSON.stringify(complaints));
  // Dispatch a custom event to notify components in the same tab
  window.dispatchEvent(new CustomEvent('complaintsUpdated'));
};


/**
 * Handles the logic for submitting new anonymous feedback.
 * @param input The user's feedback submission.
 * @returns A promise that resolves with the tracking ID.
 */
export async function submitAnonymousFeedback(input: AnonymousFeedbackInput): Promise<AnonymousFeedbackOutput> {
  const allFeedback = getComplaintsFromStorage();
  const trackingId = uuidv4();
  const submittedAt = new Date();

  const newFeedback: Feedback = {
    ...input,
    trackingId,
    submittedAt,
    viewed: false,
    auditTrail: [
      {
        event: 'Submitted',
        timestamp: submittedAt,
        details: 'Feedback was received by the system.',
      }
    ]
    // AI analysis would be added here in a real scenario
  };

  allFeedback.unshift(newFeedback); // Add to the beginning
  saveComplaintsToStorage(allFeedback);
  
  return { trackingId };
}


/**
 * Retrieves a single feedback submission by its tracking ID from localStorage.
 * @param input The tracking ID to look for.
 * @returns A promise that resolves with the feedback object, or a 'not found' status.
 */
export async function trackFeedback(input: TrackFeedbackInput): Promise<TrackFeedbackOutput> {
  const allFeedback = getComplaintsFromStorage();
  const feedback = allFeedback.find(f => f.trackingId === input.trackingId);

  if (!feedback) {
    return { found: false };
  }

  return {
    found: true,
    feedback: {
      trackingId: feedback.trackingId,
      subject: feedback.subject,
      message: feedback.message,
      submittedAt: new Date(feedback.submittedAt).toISOString(),
    },
  };
}

/**
 * Retrieves all feedback submissions from localStorage.
 * @returns A promise that resolves with an array of all feedback submissions.
 */
export async function getAllFeedback(): Promise<Feedback[]> {
  return getComplaintsFromStorage();
}


/**
 * Marks all feedback as viewed.
 */
export async function markAllFeedbackAsViewed(): Promise<void> {
  let allFeedback = getComplaintsFromStorage();
  if (allFeedback.some(c => !c.viewed)) {
    allFeedback = allFeedback.map(c => ({ ...c, viewed: true }));
    saveComplaintsToStorage(allFeedback);
  }
}
