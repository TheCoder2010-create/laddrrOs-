/**
 * @fileOverview A service for managing anonymous feedback submissions in-memory.
 *
 * This service provides a simple, non-persistent storage mechanism for feedback,
 * suitable for a prototype. In a real application, this would be replaced with
 * a secure, encrypted database.
 */

export interface AuditEvent {
  event: string;
  timestamp: Date;
  details?: string;
}

export interface Feedback {
  trackingId: string;
  subject: string;
  message: string;
  submittedAt: Date;
  summary?: string;
  criticality?: 'Low' | 'Medium' | 'High' | 'Critical';
  criticalityReasoning?: string;
  auditTrail?: AuditEvent[];
}

// In-memory array to store feedback submissions.
// NOTE: This is for demonstration purposes only and will be cleared on server restart.
const feedbackStore: Feedback[] = [];

/**
 * Saves a new feedback submission to the in-memory store.
 * @param feedback The feedback object to save.
 * @returns A promise that resolves when the feedback is saved.
 */
export async function saveFeedback(feedback: Feedback): Promise<void> {
  console.log(`Saving feedback with tracking ID: ${feedback.trackingId}`);
  
  // Initialize the audit trail with the submission event
  const submissionEvent: AuditEvent = {
    event: 'Submitted',
    timestamp: feedback.submittedAt,
    details: 'Feedback was received by the system.',
  };
  
  feedback.auditTrail = [submissionEvent];

  feedbackStore.unshift(feedback); // Add to the beginning of the array
}

/**
 * Adds a new event to a feedback item's audit trail.
 * @param trackingId The ID of the feedback to add the event to.
 * @param event The audit event to add.
 */
export async function addAuditEvent(trackingId: string, event: Omit<AuditEvent, 'timestamp'>): Promise<void> {
  console.log(`Adding audit event to tracking ID: ${trackingId}`);
  const feedbackItem = await getFeedbackByTrackingId(trackingId);
  if (feedbackItem) {
    if (!feedbackItem.auditTrail) {
      feedbackItem.auditTrail = [];
    }
    feedbackItem.auditTrail.push({
      ...event,
      timestamp: new Date(),
    });
  } else {
    console.warn(`Could not find feedback with ID ${trackingId} to add audit event.`);
  }
}


/**
 * Retrieves all feedback submissions from the in-memory store.
 * @returns A promise that resolves with an array of all feedback submissions.
 */
export async function getAllFeedback(): Promise<Feedback[]> {
  console.log(`Retrieving all ${feedbackStore.length} feedback submissions.`);
  return feedbackStore;
}

/**
 * Retrieves a single feedback submission by its tracking ID.
 * @param trackingId The ID of the feedback to retrieve.
 * @returns A promise that resolves with the feedback object, or undefined if not found.
 */
export async function getFeedbackByTrackingId(trackingId: string): Promise<Feedback | undefined> {
    console.log(`Searching for feedback with tracking ID: ${trackingId}`);
    return feedbackStore.find(f => f.trackingId === trackingId);
}
