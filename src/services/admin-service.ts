
'use client';

import { v4 as uuidv4 } from 'uuid';
import { roleUserMapping, type Role } from '@/hooks/use-role';
import { getPoshFromStorage, savePoshToStorage, type PoshComplaint, type CaseStatus } from './posh-service';

export interface AdminLogEntry {
    id: string;
    timestamp: string;
    actor: string;
    action: string;
    caseId?: string;
}

const ADMIN_LOG_KEY = 'admin_audit_log';

const getAdminLogFromStorage = (): AdminLogEntry[] => {
    if (typeof window === 'undefined') return [];
    const json = sessionStorage.getItem(ADMIN_LOG_KEY);
    return json ? JSON.parse(json) : [];
};

const saveAdminLogToStorage = (log: AdminLogEntry[]): void => {
    if (typeof window === 'undefined') return;
    sessionStorage.setItem(ADMIN_LOG_KEY, JSON.stringify(log));
};

const addAdminLogEntry = (actor: string, action: string, caseId?: string) => {
    const log = getAdminLogFromStorage();
    const newEntry: AdminLogEntry = {
        id: uuidv4(),
        timestamp: new Date().toISOString(),
        actor,
        action,
        caseId,
    };
    log.unshift(newEntry);
    saveAdminLogToStorage(log);
};

export async function getAdminAuditLog(): Promise<AdminLogEntry[]> {
    return getAdminLogFromStorage().sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

export async function getAllUsers(): Promise<{ all: string[], icc: string[] }> {
    const allUserNames = Object.values(roleUserMapping).map(u => u.name);
    const poshCases = await getPoshFromStorage();
    const iccMembers = new Set<string>();

    // ICC Head is always a member
    iccMembers.add('ICC Head');
    
    // Find anyone who has been assigned a case
    poshCases.forEach(c => {
        c.assignedTo.forEach(assignee => {
            if (assignee === 'ICC Member') { // Find specific ICC members from audit trail if needed
                 const assignEvent = c.auditTrail.find(e => e.event === 'Case Assigned' && e.details?.includes('ICC Member'));
                 if (assignEvent) iccMembers.add(assignEvent.actor as string);
            } else if (assignee === 'ICC Head') {
                 iccMembers.add(roleUserMapping['ICC Head'].name);
            }
        });
    });

    // In a real app, this would query a user directory. Here we simulate.
    const allHardcodedUsers = ['Frank Green', 'Gina Harris'];
    allHardcodedUsers.forEach(u => iccMembers.add(u));


    return { all: allUserNames, icc: Array.from(iccMembers) };
}

export async function manageIccMembership(user: string, action: 'add' | 'remove'): Promise<void> {
    // This is a placeholder for a real user management system.
    // We will log the action.
    const actionText = `${action === 'add' ? 'Added' : 'Removed'} ${user} ${action === 'add' ? 'to' : 'from'} the ICC.`;
    addAdminLogEntry('ICC Head', actionText);
}

export async function overrideCaseStatus(caseId: string, newStatus: CaseStatus, reason: string): Promise<void> {
    const allComplaints = getPoshFromStorage();
    const caseIndex = allComplaints.findIndex(c => c.caseId === caseId);
    if (caseIndex === -1) return;

    const complaint = allComplaints[caseIndex];
    complaint.caseStatus = newStatus;

    const details = `Status overridden to "${newStatus}". Reason: ${reason}`;
    complaint.auditTrail.push({
        event: 'Status Override',
        timestamp: new Date(),
        actor: 'ICC Head',
        details
    });

    savePoshToStorage(allComplaints);
    addAdminLogEntry('ICC Head', `Overrode status for case ${caseId} to "${newStatus}".`, caseId);
}
