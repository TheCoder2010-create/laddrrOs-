
'use client';

import { v4 as uuidv4 } from 'uuid';
import type { Role } from '@/hooks/use-role';

// ==========================================
// Data Structures & Types
// ==========================================

export type CaseStatus = 
  | 'New' 
  | 'Under Preliminary Review' 
  | 'Inquiry Initiated' 
  | 'Evidence Review' 
  | 'Hearing Scheduled' 
  | 'Report Drafted' 
  | 'Resolved' 
  | 'Closed';

export interface PoshAuditEvent {
  event: string;
  timestamp: Date | string;
  actor: Role | string;
  details?: string;
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
}


// ==========================================
// Storage Service
// ==========================================

const POSH_COMPLAINTS_KEY = 'posh_complaints_storage';

// Helper to read a file as a data URI
const fileToDataUri = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = (error) => reject(error);
        reader.readAsDataURL(file);
    });
};

const getPoshFromStorage = (): PoshComplaint[] => {
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
    const caseId = uuidv4();
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
            actor: 'System', // The initial actor is the system itself
            details: `New POSH complaint filed by ${input.complainantName}.`,
        }],
    };

    allComplaints.unshift(newComplaint);
    savePoshToStorage(allComplaints);
    return newComplaint;
}


export async function getAllPoshComplaints(): Promise<PoshComplaint[]> {
    return getPoshFromStorage().sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function getComplaintsForUser(userName: string): Promise<PoshComplaint[]> {
    const allComplaints = await getAllPoshComplaints();
    return allComplaints.filter(c => c.complainantInfo.name === userName);
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
        details: `${eventName} for: ${assignees.join(', ')}.${comment ? ` Note: "${comment}"` : ''}`
    });

    savePoshToStorage(allComplaints);
}

export async function addPoshInternalNote(caseId: string, note: string, actor: Role): Promise<void> {
    const allComplaints = getPoshFromStorage();
    const caseIndex = allComplaints.findIndex(c => c.caseId === caseId);
    if (caseIndex === -1) return;

    const complaint = allComplaints[caseIndex];
    
    complaint.auditTrail.push({
        event: 'Internal Note Added',
        timestamp: new Date(),
        actor: actor,
        details: note
    });

    savePoshToStorage(allComplaints);
}
