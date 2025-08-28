
'use client';

import { v4 as uuidv4 } from 'uuid';
import { type Role } from '@/hooks/use-role';
import { roleUserMapping } from '@/lib/role-mapping';
import { getPoshFromStorage, type PoshComplaint } from './posh-service';
import { poshCaseStatuses } from './posh-service';

export interface AdminLogEntry {
    id: string;
    timestamp: string;
    actor: string;
    action: string;
    caseId?: string;
}

const ADMIN_LOG_KEY = 'admin_audit_log';
const ICC_MEMBERS_KEY = 'icc_members_list';

const getAdminLogFromStorage = (): AdminLogEntry[] => {
    if (typeof window === 'undefined') return [];
    const json = sessionStorage.getItem(ADMIN_LOG_KEY);
    return json ? JSON.parse(json) : [];
};

const saveAdminLogToStorage = (log: AdminLogEntry[]): void => {
    if (typeof window === 'undefined') return;
    sessionStorage.setItem(ADMIN_LOG_KEY, JSON.stringify(log));
};

const getIccMembersFromStorage = (): Role[] => {
    if (typeof window === 'undefined') return [];
    const json = sessionStorage.getItem(ICC_MEMBERS_KEY);
    // Initialize with ICC Head if not present
    return json ? JSON.parse(json) : ['ICC Head'];
};

const saveIccMembersToStorage = (members: Role[]): void => {
    if (typeof window === 'undefined') return;
    sessionStorage.setItem(ICC_MEMBERS_KEY, JSON.stringify(members));
};


export const addAdminLogEntry = (actor: string, action: string, caseId?: string) => {
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

export async function getAllUsers(): Promise<{ all: Role[], icc: Role[] }> {
    const allUserRoles = Object.keys(roleUserMapping).filter(r => r !== 'Voice – In Silence' && r !== 'Anonymous') as Role[];
    const iccMembers = getIccMembersFromStorage();
    return { all: allUserRoles, icc: iccMembers };
}

export async function manageIccMembership(userRole: Role, action: 'add' | 'remove'): Promise<void> {
    const iccMembers = getIccMembersFromStorage();
    const newMembers = new Set(iccMembers);

    if (action === 'add') {
        newMembers.add(userRole);
    } else {
        if (userRole !== 'ICC Head') { // Prevent removing the head
            newMembers.delete(userRole);
        }
    }
    
    saveIccMembersToStorage(Array.from(newMembers));
    
    const actionText = `${action === 'add' ? 'Added' : 'Removed'} ${userRole} ${action === 'add' ? 'to' : 'from'} the ICC.`;
    addAdminLogEntry('ICC Head', actionText);
}

export async function getIccMembers(): Promise<Role[]> {
    return getIccMembersFromStorage();
}

export async function overrideCaseStatus(caseId: string, newStatus: typeof poshCaseStatuses[number] | 'New' | 'Closed' | 'Resolved', reason: string): Promise<void> {
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

    const poshComplaintsKey = 'posh_complaints_storage';
    if(typeof window !== 'undefined') {
        sessionStorage.setItem(poshComplaintsKey, JSON.stringify(allComplaints));
        window.dispatchEvent(new CustomEvent('poshComplaintUpdated'));
    }
    
    addAdminLogEntry('ICC Head', `Overrode status for case ${caseId} to "${newStatus}".`, caseId);
}
