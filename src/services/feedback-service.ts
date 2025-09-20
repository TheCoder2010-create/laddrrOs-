/**
 * @fileOverview A service for managing feedback submissions using sessionStorage.
 *
 * This service provides a simple, client-side persistent storage mechanism for feedback,
 * suitable for a prototype. It now includes custom event dispatching for same-tab updates.
 */
import { v4 as uuidv4 } from 'uuid';
import type { Role } from '@/hooks/use-role';
import { roleUserMapping, getRoleByName } from '@/lib/role-mapping';
import type { AnalyzeOneOnOneOutput, CriticalCoachingInsight, CoachingRecommendation, CheckIn, ActionItem } from '@/ai/schemas/one-on-one-schemas';

// Helper function to generate a new ID format
const generateTrackingId = () => `Org-Ref-${Math.floor(100000 + Math.random() * 900000)}`;

export interface AuditEvent {
  event: string;
  timestamp: Date | string; 
  actor: Role | string;
  details?: string;
  isPublic?: boolean;
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


export interface Attachment {
    name: string;
    dataUri: string;
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
  attachmentNames?: string[];
  attachments?: Attachment[];
}

export interface OneOnOneHistoryItem {
    id: string;
    supervisorName: string;
    employeeName: string;
    date: string;
    analysis: AnalyzeOneOnOneOutput;
    // We add a top-level assignedTo for escalation routing outside the insight
    assignedTo?: Role[]; 
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
    const newHistoryItem: OneOnOneHistoryItem = { ...item, id: generateTrackingId(), assignedTo: [] };
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

export async function toggleActionItemStatus(historyId: string, actionItemId: string): Promise<void> {
    const allHistory = await getOneOnOneHistory();
    const historyIndex = allHistory.findIndex(h => h.id === historyId);
    if (historyIndex === -1) return;

    const item = allHistory[historyIndex];
    if (!item.analysis.actionItems) return;

    const actionItemIndex = item.analysis.actionItems.findIndex(a => a.id === actionItemId);
    if (actionItemIndex === -1) return;

    const actionItem = item.analysis.actionItems[actionItemIndex];
    if (actionItem.status === 'pending') {
        actionItem.status = 'completed';
        actionItem.completedAt = new Date().toISOString();
    } else {
        actionItem.status = 'pending';
        actionItem.completedAt = undefined;
    }

    saveToStorage(ONE_ON_ONE_HISTORY_KEY, allHistory);
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

    const fullAcknowledgement = `${acknowledgement}${comments ? ` "${comments}"` : ''}`;
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

    const currentAssignees = new Set(item.assignedTo || []);

    if (acknowledgement === "The concern was fully addressed to my satisfaction.") {
        insight.status = 'resolved';
        item.assignedTo = Array.from(currentAssignees); // Keep current assignees for history
    } else if (wasHrAction) {
        insight.status = 'pending_final_hr_action';
        currentAssignees.add('HR Head');
        item.assignedTo = Array.from(currentAssignees);
    } else if (wasManagerAction) {
        insight.status = 'pending_hr_review';
        currentAssignees.add('HR Head');
        item.assignedTo = Array.from(currentAssignees);
    } else if (wasRetry || wasAmResponse) {
        insight.status = 'pending_manager_review';
        currentAssignees.add('Manager');
        item.assignedTo = Array.from(currentAssignees);
    } else {
        insight.status = 'pending_am_review';
        currentAssignees.add('AM');
        item.assignedTo = Array.from(currentAssignees);
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
    
    const currentAssignees = new Set(item.assignedTo || []);
    currentAssignees.add('Manager');
    item.assignedTo = Array.from(currentAssignees);

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
    // Don't unassign, keep in manager's view
    
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
    data?: { reason?: string; startDate?: string; endDate?: string; }
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

export async function addCustomCoachingPlan(actor: Role, data: { area: string; resource: string; startDate: Date; endDate: Date }): Promise<void> {
    const supervisorName = roleUserMapping[actor]?.name;
    if (!supervisorName) throw new Error("Invalid actor role provided.");

    const allHistory = await getOneOnOneHistory();

    const newCustomRecommendation: CoachingRecommendation = {
        id: uuidv4(),
        area: data.area,
        recommendation: `Custom goal added by user: ${data.resource}`,
        example: "N/A (user-added goal)",
        type: "Other", // Default type for custom plans
        resource: data.resource,
        justification: "This is a self-directed development goal.",
        status: "accepted",
        rejectionReason: undefined,
        auditTrail: [{
            event: "Custom Goal Created",
            actor: supervisorName,
            timestamp: new Date().toISOString(),
            details: "User added a new self-directed development goal."
        }],
        startDate: data.startDate.toISOString(),
        endDate: data.endDate.toISOString(),
        progress: 0,
        checkIns: [],
    };
    
    const newHistoryItem: OneOnOneHistoryItem = {
        id: generateTrackingId(),
        supervisorName: supervisorName,
        employeeName: "System", // Indicates a system-generated container
        date: new Date().toISOString(),
        analysis: {
            supervisorSummary: "Container for custom development goals.",
            employeeSummary: "",
            leadershipScore: 0,
            effectivenessScore: 0,
            employeeSwotAnalysis: { strengths: [], weaknesses: [], opportunities: [], threats: [] },
            strengthsObserved: [],
            coachingRecommendations: [newCustomRecommendation],
            actionItems: [],
            legalDataCompliance: { piiOmitted: false, privacyRequest: false },
            biasFairnessCheck: { flag: false },
            localizationCompliance: { applied: false },
        },
        assignedTo: [],
    };
    allHistory.unshift(newHistoryItem);
    
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

export async function getAllFeedback(): Promise<Feedback[]> {
  return getFeedbackFromStorage();
}

export async function getFeedbackById(trackingId: string): Promise<Feedback | null> {
    const allFeedback = await getAllFeedback();
    return allFeedback.find(f => f.trackingId === trackingId) || null;
}


export async function saveFeedback(feedback: Feedback[], append = false): Promise<void> {
    if (append) {
        const existingFeedback = getFeedbackFromStorage();
        saveFeedbackToStorage([...feedback, ...existingFeedback]);
    } else {
        saveFeedbackToStorage(feedback);
    }
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
    feedback.assignedTo = [];
    feedback.auditTrail?.push({
        event: 'Resolved',
        timestamp: new Date(),
        actor,
        details: resolution,
        isPublic: true,
    });

    saveFeedbackToStorage(allFeedback);
}

export async function submitEmployeeFeedbackAcknowledgement(trackingId: string, accepted: boolean, comments: string): Promise<void> {
    const allFeedback = getFeedbackFromStorage();
    const feedbackIndex = allFeedback.findIndex(f => f.trackingId === trackingId);
    if (feedbackIndex === -1) return;

    const item = allFeedback[feedbackIndex];
    const actor = item.submittedBy || 'Anonymous';
    
    const relevantEvents = ['Resolution Submitted', 'HR Resolution Submitted', 'HR Responded to Retaliation Claim', 'Manager Resolution'];
    const lastResponderEvent = item.auditTrail?.slice().reverse().find(e => relevantEvents.includes(e.event));
    const lastResponder = lastResponderEvent?.actor as Role | undefined;

    const currentAssignees = new Set(item.assignedTo || []);

    if (accepted) {
        item.status = 'Resolved';
        item.resolution = item.supervisorUpdate;
        item.auditTrail?.push({
            event: 'Employee Accepted Resolution',
            timestamp: new Date(),
            actor: actor,
            details: `Resolution accepted.${comments ? ` "${comments}"` : ''}`
        });
        item.auditTrail?.push({
            event: 'Resolved',
            timestamp: new Date(),
            actor: actor,
            details: 'Case resolved after employee acknowledgment.',
        });
    } else {
        const escalationDetails = `Resolution not accepted.${comments ? ` "${comments}"` : ''}`;
        
        let nextAssignee: Role | undefined = undefined;
        let nextStatus: FeedbackStatus = 'Pending Manager Action';
        
        const lastResponderRole = Object.values(roleUserMapping).find(u => u.name === lastResponder)?.role || lastResponder;
        
        if (item.criticality === 'Retaliation Claim' || lastResponderEvent?.event === 'HR Resolution Submitted' || lastResponderRole === 'HR Head') {
             item.status = 'Final Disposition Required';
             currentAssignees.add('HR Head');
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
             currentAssignees.add(nextAssignee);
             item.auditTrail?.push({
                event: 'Employee Escalated Concern',
                timestamp: new Date(),
                actor: actor,
                details: `Concern escalated to ${nextAssignee}. ${escalationDetails}`
            });
        }
    }
    
    item.assignedTo = Array.from(currentAssignees);
    saveFeedbackToStorage(allFeedback);
}
