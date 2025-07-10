/**
 * @fileOverview A service for managing anonymous feedback submissions using localStorage.
 *
 * This service provides a simple, client-side persistent storage mechanism for feedback,
 * suitable for a prototype.
 */

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

const COMPLAINTS_KEY = 'complaints';

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
  // Dispatch a custom event to notify other components in the same tab
  window.dispatchEvent(new Event('storage'));
};

/**
 * Saves a new feedback submission to localStorage.
 * @param feedback The feedback object to save.
 * @returns A promise that resolves when the feedback is saved.
 */
export async function saveFeedback(feedback: Feedback): Promise<void> {
  const allFeedback = getComplaintsFromStorage();
  allFeedback.unshift(feedback); // Add to the beginning
  saveComplaintsToStorage(allFeedback);
}

/**
 * Adds a new event to a feedback item's audit trail.
 * @param trackingId The ID of the feedback to add the event to.
 * @param event The audit event to add.
 */
export async function addAuditEvent(trackingId: string, event: Omit<AuditEvent, 'timestamp'>): Promise<void> {
  const allFeedback = getComplaintsFromStorage();
  const feedbackItem = allFeedback.find(f => f.trackingId === trackingId);
  if (feedbackItem) {
    if (!feedbackItem.auditTrail) {
      feedbackItem.auditTrail = [];
    }
    feedbackItem.auditTrail.push({
      ...event,
      timestamp: new Date(),
    });
    saveComplaintsToStorage(allFeedback);
  } else {
    console.warn(`Could not find feedback with ID ${trackingId} to add audit event.`);
  }
}

/**
 * Retrieves all feedback submissions from localStorage.
 * @returns A promise that resolves with an array of all feedback submissions.
 */
export async function getAllFeedback(): Promise<Feedback[]> {
  return getComplaintsFromStorage();
}

/**
 * Retrieves a single feedback submission by its tracking ID from localStorage.
 * @param trackingId The ID of the feedback to retrieve.
 * @returns A promise that resolves with the feedback object, or undefined if not found.
 */
export async function getFeedbackByTrackingId(trackingId: string): Promise<Feedback | undefined> {
  const allFeedback = getComplaintsFromStorage();
  return allFeedback.find(f => f.trackingId === trackingId);
}

/**
 * Marks all feedback as viewed.
 */
export async function markAllFeedbackAsViewed(): Promise<void> {
  let allFeedback = getComplaintsFromStorage();
  allFeedback = allFeedback.map(c => ({ ...c, viewed: true }));
  saveComplaintsToStorage(allFeedback);
}
