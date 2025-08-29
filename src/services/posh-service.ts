

'use client';

import { v4 as uuidv4 } from 'uuid';
import type { Role } from '@/hooks/use-role';
import { addAdminLogEntry } from '@/services/admin-service';

// ==========================================
// Data Structures & Types
// ==========================================

export const poshCaseStatuses = [
    'Under Preliminary Review',
    'Pending Withdrawal',
    'Pending Conciliation',
    'Pending Complainant Acknowledgement',
    'Pending Final Disposition',
    'Inquiry Initiated',
    'Evidence Review',
    'Hearing Scheduled',
    'Report Drafted',
    'Resolved (Action Taken)',
    'Closed (No Action Required)',
    'Escalated to External Authority'
] as const;

export type CaseStatus = 
  | 'New' 
  | typeof poshCaseStatuses[number]
  | 'Resolved' 
  | 'Closed';

export interface PoshAuditEvent {
  event: string;
  timestamp: Date | string;
  actor: Role | string;
  details?: string;
  isPublic?: boolean; // New flag for complainant visibility
}

export interface PoshAttachment {
    name: string;
    dataUri: string;
}

export interface PoshComplaint {
  caseId: string;
  createdAt: Date | string;
  caseType: 'POSH';
  caseStatus: CaseStatus;
  
  complainantInfo: {
    name: string;
    department: string;
  };
  
  respondentInfo: {
    name: string;
    details?: string;
  };
  
  title: string;
  dateOfIncident: Date | string;
  location: string;
  incidentDetails: string;
  witnesses?: string;
  
  priorHistory: {
    hasPriorIncidents: boolean;
    priorIncidentsDetails?: string;
    hasPriorComplaints: boolean;
    priorComplaintsDetails?: string;
  };
  
  consent: {
    confidentialityAcknowledgement: boolean;
    inquiryConsent: boolean;
  };
  
  lateSubmission?: {
    isLate: boolean;
    justification: string;
    attachments: PoshAttachment[];
  };

  attachments: PoshAttachment[];
  auditTrail: PoshAuditEvent[];
  isLocked: boolean;
  assignedTo: Role[];
  parentCaseId?: string; // For linking retaliation cases
}

export interface PoshComplaintInput {
    title: string;
    location: string;
    dateOfIncident: Date;
    complainantName: string;
    complainantDepartment: string;
    respondentName: string;
    respondentDetails?: string;
    incidentDetails: string;
    witnesses?: string;
    evidenceFiles?: File[];
    priorIncidents: 'yes' | 'no';
    priorIncidentsDetails?: string;
    priorComplaints: 'yes' | 'no';
    priorComplaintsDetails?: string;
    delayJustification?: string;
    delayEvidenceFiles?: File[];
    role: Role;
}

export interface RetaliationReportInput {
    parentCaseId: string;
    submittedBy: Role;
    description: string;
    files: File[];
}


// ==========================================
// Storage Service
// ==========================================

const POSH_COMPLAINTS_KEY = 'posh_complaints_storage';
const getPoshCaseKey = (role: string | null) => role ? `posh_cases_${role.replace(/\s/g, '_')}` : null;


const generatePoshCaseId = () => `Org-POSH-${Math.floor(1000 + Math.random() * 9000)}`;

// Helper to read a file as a data URI
const fileToDataUri = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = (error) => reject(error);
        reader.readAsDataURL(file);
    });
};

export const getPoshFromStorage = (): PoshComplaint[] => {
    if (typeof window === 'undefined') return [];
    const json = sessionStorage.getItem(POSH_COMPLAINTS_KEY);
    if (!json) return [];
    try {
        const data = JSON.parse(json) as PoshComplaint[];
        return data.map(c => ({
            ...c,
            createdAt: new Date(c.createdAt),
            dateOfIncident: new Date(c.dateOfIncident),
            auditTrail: c.auditTrail.map(a => ({...a, timestamp: new Date(a.timestamp)}))
        }));
    } catch (e) {
        console.error(`Error parsing ${POSH_COMPLAINTS_KEY} from sessionStorage`, e);
        return [];
    }
}

const savePoshToStorage = (complaints: PoshComplaint[]): void => {
    if (typeof window === 'undefined') return;
    sessionStorage.setItem(POSH_COMPLAINTS_KEY, JSON.stringify(complaints));
    window.dispatchEvent(new CustomEvent('poshComplaintUpdated'));
}

// ==========================================
// Public API
// ==========================================

export async function submitPoshComplaint(input: PoshComplaintInput): Promise<PoshComplaint> {
    const allComplaints = getPoshFromStorage();
    const caseId = generatePoshCaseId();
    const createdAt = new Date();

    const evidenceAttachments = await Promise.all(
        (input.evidenceFiles || []).map(async (file) => ({
            name: file.name,
            dataUri: await fileToDataUri(file),
        }))
    );
    
    const delayAttachments = await Promise.all(
        (input.delayEvidenceFiles || []).map(async (file) => ({
            name: file.name,
            dataUri: await fileToDataUri(file),
        }))
    );

    const newComplaint: PoshComplaint = {
        caseId,
        createdAt,
        caseType: 'POSH',
        caseStatus: 'New',
        title: input.title,
        location: input.location,
        dateOfIncident: input.dateOfIncident,
        complainantInfo: {
            name: input.complainantName,
            department: input.complainantDepartment,
        },
        respondentInfo: {
            name: input.respondentName,
            details: input.respondentDetails,
        },
        incidentDetails: input.incidentDetails,
        witnesses: input.witnesses,
        priorHistory: {
            hasPriorIncidents: input.priorIncidents === 'yes',
            priorIncidentsDetails: input.priorIncidentsDetails,
            hasPriorComplaints: input.priorComplaints === 'yes',
            priorComplaintsDetails: input.priorComplaintsDetails,
        },
        consent: {
            confidentialityAcknowledgement: true,
            inquiryConsent: true,
        },
        lateSubmission: input.delayJustification ? {
            isLate: true,
            justification: input.delayJustification,
            attachments: delayAttachments,
        } : undefined,
        attachments: evidenceAttachments,
        isLocked: false,
        assignedTo: ['ICC Head'],
        auditTrail: [{
            event: 'Complaint Filed',
            timestamp: createdAt,
            actor: input.role, 
            details: `New POSH complaint filed by ${input.complainantName}.`,
            isPublic: true,
        }],
    };

    allComplaints.unshift(newComplaint);
    savePoshToStorage(allComplaints);

    const caseKey = getPoshCaseKey(input.role);
    if (caseKey) {
        const caseIds = JSON.parse(sessionStorage.getItem(caseKey) || '[]');
        caseIds.push(caseId);
        sessionStorage.setItem(caseKey, JSON.stringify(caseIds));
    }

    return newComplaint;
}

export async function requestPoshCaseWithdrawal(caseId: string, actor: Role, reason: string): Promise<void> {
    const allComplaints = getPoshFromStorage();
    const caseIndex = allComplaints.findIndex(c => c.caseId === caseId);
    if (caseIndex === -1) return;

    const complaint = allComplaints[caseIndex];
    complaint.caseStatus = 'Pending Withdrawal';
    complaint.auditTrail.push({
        event: 'Withdrawal Requested by Complainant',
        timestamp: new Date(),
        actor: actor,
        details: reason,
        isPublic: false, // This is an internal request for the ICC
    });

    savePoshToStorage(allComplaints);
}

export async function requestPoshCaseConciliation(caseId: string, actor: Role, reason: string): Promise<void> {
    const allComplaints = getPoshFromStorage();
    const caseIndex = allComplaints.findIndex(c => c.caseId === caseId);
    if (caseIndex === -1) return;

    const complaint = allComplaints[caseIndex];
    complaint.caseStatus = 'Pending Conciliation';
    complaint.auditTrail.push({
        event: 'Conciliation Requested by Complainant',
        timestamp: new Date(),
        actor: actor,
        details: reason,
        isPublic: false, // Internal request
    });

    savePoshToStorage(allComplaints);
}

export async function respondToComplainantRequest(
    caseId: string,
    actor: Role,
    requestType: 'Withdrawal' | 'Conciliation',
    approved: boolean,
    notes: string
): Promise<void> {
    const allComplaints = getPoshFromStorage();
    const caseIndex = allComplaints.findIndex(c => c.caseId === caseId);
    if (caseIndex === -1) return;

    const complaint = allComplaints[caseIndex];
    const decision = approved ? 'Approved' : 'Denied';

    if (approved) {
        complaint.caseStatus = requestType === 'Withdrawal' ? 'Closed' : 'Under Preliminary Review'; // Or a specific conciliation status
    } else {
        complaint.caseStatus = 'Under Preliminary Review'; // Revert to a previous state
    }
    
    complaint.auditTrail.push({
        event: `${requestType} Request ${decision}`,
        timestamp: new Date(),
        actor,
        details: `ICC Head ${decision.toLowerCase()} the request. Notes: ${notes}`,
        isPublic: true, // Make the decision public to the complainant
    });

    savePoshToStorage(allComplaints);
}

export async function reportPoshRetaliation(input: RetaliationReportInput): Promise<PoshComplaint> {
    const allComplaints = getPoshFromStorage();
    const childCaseId = generatePoshCaseId();
    const createdAt = new Date();

    const parentCase = allComplaints.find(c => c.caseId === input.parentCaseId);
    if (!parentCase) {
        throw new Error("Parent case not found");
    }

    const attachments = await Promise.all(
        input.files.map(async (file) => ({
            name: file.name,
            dataUri: await fileToDataUri(file),
        }))
    );

    const newRetaliationCase: PoshComplaint = {
        ...parentCase, // Inherit details from parent
        caseId: childCaseId,
        parentCaseId: input.parentCaseId,
        createdAt,
        title: `Retaliation Claim for case ${input.parentCaseId}`,
        incidentDetails: input.description,
        attachments,
        caseStatus: 'New',
        assignedTo: ['ICC Head'],
        isLocked: false,
        auditTrail: [{
            event: 'Retaliation Claim Filed',
            timestamp: createdAt,
            actor: input.submittedBy,
            details: `This case was filed as a retaliation claim linked to parent case ${input.parentCaseId}.`,
            isPublic: true,
        }],
    };

    // Add event to parent case
    parentCase.auditTrail.push({
        event: 'Retaliation Claim Filed',
        timestamp: createdAt,
        actor: input.submittedBy,
        details: `A linked retaliation case was filed. New Case ID: ${childCaseId}`,
        isPublic: false, // Internal note for ICC
    });

    allComplaints.unshift(newRetaliationCase);
    savePoshToStorage(allComplaints);

     // Add new case to complainant's list
    const caseKey = getPoshCaseKey(input.submittedBy);
    if (caseKey) {
        const caseIds = JSON.parse(sessionStorage.getItem(caseKey) || '[]');
        caseIds.push(childCaseId);
        sessionStorage.setItem(caseKey, JSON.stringify(caseIds));
    }


    return newRetaliationCase;
}

export async function submitPoshComplainantAcknowledgement(caseId: string, actor: Role, accepted: boolean, comments?: string): Promise<void> {
    const allComplaints = getPoshFromStorage();
    const caseIndex = allComplaints.findIndex(c => c.caseId === caseId);
    if (caseIndex === -1) return;

    const complaint = allComplaints[caseIndex];
    
    if (accepted) {
        complaint.caseStatus = 'Resolved';
        complaint.auditTrail.push({
            event: 'Complainant Accepted Resolution',
            timestamp: new Date(),
            actor,
            details: `The complainant has accepted the resolution. ${comments ? `Comments: "${comments}"` : ''}`,
            isPublic: true,
        });
    } else {
        complaint.caseStatus = 'Pending Final Disposition';
        complaint.auditTrail.push({
            event: 'Complainant Rejected Resolution',
            timestamp: new Date(),
            actor,
            details: `The complainant was not satisfied with the resolution and has escalated the case for final disposition. ${comments ? `Comments: "${comments}"` : ''}`,
            isPublic: true,
        });
    }
    
    savePoshToStorage(allComplaints);
}

export async function submitPoshFinalDisposition(caseId: string, actor: Role, disposition: string, notes: string): Promise<void> {
    const allComplaints = getPoshFromStorage();
    const caseIndex = allComplaints.findIndex(c => c.caseId === caseId);
    if (caseIndex === -1) return;

    const complaint = allComplaints[caseIndex];
    complaint.caseStatus = 'Closed';
    
    complaint.auditTrail.push({
        event: 'Final Disposition Logged',
        timestamp: new Date(),
        actor,
        details: `Case closed and routed to ${disposition}. Final notes: ${notes}`,
        isPublic: true,
    });
    
    savePoshToStorage(allComplaints);
}

export async function getAllPoshComplaints(): Promise<PoshComplaint[]> {
    return getPoshFromStorage().sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function getComplaintsForUser(userName: string): Promise<PoshComplaint[]> {
    const allComplaints = await getAllPoshComplaints();
    return allComplaints.filter(c => c.complainantInfo.name === userName);
}

export async function getComplaintsByIds(caseIds: string[]): Promise<PoshComplaint[]> {
    const allComplaints = getPoshFromStorage();
    return allComplaints.filter(c => caseIds.includes(c.caseId));
}

export async function getPoshComplaintsForMember(memberRole: Role): Promise<PoshComplaint[]> {
    const allComplaints = await getAllPoshComplaints();
    return allComplaints.filter(c => c.assignedTo.includes(memberRole));
}

export async function assignPoshCase(
    caseId: string, 
    assignees: Role[], 
    actor: Role, 
    mode: 'assign' | 'unassign',
    comment: string
): Promise<void> {
    const allComplaints = getPoshFromStorage();
    const caseIndex = allComplaints.findIndex(c => c.caseId === caseId);
    if (caseIndex === -1) return;

    const complaint = allComplaints[caseIndex];
    const currentAssignees = new Set(complaint.assignedTo || []);

    if (mode === 'assign') {
        assignees.forEach(role => currentAssignees.add(role));
    } else {
        assignees.forEach(role => currentAssignees.delete(role));
    }
    
    complaint.assignedTo = Array.from(currentAssignees);
    
    const eventName = mode === 'assign' ? 'Case Assigned' : 'Case Unassigned';
    complaint.auditTrail.push({
        event: eventName,
        timestamp: new Date(),
        actor: actor,
        details: `${eventName} for: ${assignees.join(', ')}.${comment ? ` Note: "${comment}"` : ''}`,
        isPublic: false, // Internal action
    });

    // Log this important action to the central admin log
    const actionText = `${mode === 'assign' ? 'Assigned' : 'Unassigned'} ${assignees.join(', ')} ${mode === 'assign' ? 'to' : 'from'} case`;
    addAdminLogEntry(actor, actionText, caseId);

    savePoshToStorage(allComplaints);
}

export async function addPoshInternalNote(caseId: string, note: string, actor: Role, noteType: string = 'Internal Note Added', isPublic: boolean = false): Promise<void> {
    const allComplaints = getPoshFromStorage();
    const caseIndex = allComplaints.findIndex(c => c.caseId === caseId);
    if (caseIndex === -1) return;

    const complaint = allComplaints[caseIndex];
    
    complaint.auditTrail.push({
        event: noteType,
        timestamp: new Date(),
        actor: actor,
        details: note,
        isPublic: isPublic,
    });

    savePoshToStorage(allComplaints);
}

export async function updatePoshStatus(caseId: string, status: CaseStatus, actor: Role): Promise<void> {
    const allComplaints = getPoshFromStorage();
    const caseIndex = allComplaints.findIndex(c => c.caseId === caseId);
    if (caseIndex === -1) return;

    const complaint = allComplaints[caseIndex];
    complaint.caseStatus = status;

    complaint.auditTrail.push({
        event: 'Status Updated',
        timestamp: new Date(),
        actor,
        details: `Case status changed to: ${status}`,
        isPublic: true,
    });

    savePoshToStorage(allComplaints);
}
