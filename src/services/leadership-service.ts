
'use client';

import { v4 as uuidv4 } from 'uuid';
import type { Role } from '@/hooks/use-role';
import { roleUserMapping } from '@/lib/role-mapping';
import { getFeedbackFromStorage, saveFeedbackToStorage, type Feedback } from './feedback-service';

export interface LeadershipModule {
    id: string;
    title: string;
    description: string;
    content: string; // Simplified content for now
    isCompleted: boolean;
}

export interface LeadershipNomination {
    id: string;
    nominatedBy: Role;
    nomineeRole: Role;
    targetRole: string; // e.g., 'Team Lead / Manager'
    status: 'InProgress' | 'Completed' | 'Certified';
    startDate: string;
    modules: LeadershipModule[];
    modulesCompleted: number;
    currentModuleId: string;
    certified: boolean;
    lastUpdated: string;
}

const LEADERSHIP_COACHING_KEY = 'leadership_coaching_nominations_v1';

const getInitialModules = (): LeadershipModule[] => [
    { id: 'm1', title: 'From Peer to Leader', description: 'Navigating the transition from individual contributor to a leadership role.', content: 'This module covers managing former peers, setting boundaries, and establishing authority.', isCompleted: false },
    { id: 'm2', title: 'Effective Communication', description: 'Mastering the art of clear, concise, and empathetic communication.', content: 'Lessons on active listening, delivering feedback, and leading team meetings.', isCompleted: false },
    { id: 'm3', title: 'Delegation and Empowerment', description: 'Learning to delegate tasks effectively and empower your team.', content: 'Strategies for assigning tasks, trusting your team, and avoiding micromanagement.', isCompleted: false },
    { id: 'm4', title: 'Performance Management', description: 'Setting goals, tracking performance, and handling difficult conversations.', content: 'Frameworks for performance reviews, goal setting (OKRs/SMART), and constructive feedback.', isCompleted: false },
    { id: 'm5', title: 'Strategic Thinking', description: 'Developing a strategic mindset to align team goals with company objectives.', content: 'Introduction to strategic planning, resource allocation, and long-term vision.', isCompleted: false },
];

// ==========================================
// Generic Storage Helpers
// ==========================================

const getFromStorage = <T>(key: string): T[] => {
    if (typeof window === 'undefined') return [];
    const json = sessionStorage.getItem(key);
    
    if (!json) {
        if (key === LEADERSHIP_COACHING_KEY) {
            const mockData = getMockLeadershipData() as T[];
            saveToStorage(key, mockData);
            return mockData;
        }
        return [];
    }
    
    return JSON.parse(json);
};

const saveToStorage = (key: string, data: any[]): void => {
    if (typeof window === 'undefined') return;
    sessionStorage.setItem(key, JSON.stringify(data));
    window.dispatchEvent(new CustomEvent('feedbackUpdated'));
    window.dispatchEvent(new Event('storage'));
};


const getMockLeadershipData = (): LeadershipNomination[] => {
    const modules = getInitialModules();
    const mockNomination: LeadershipNomination = {
        id: 'mock-lead-1',
        nominatedBy: 'Manager',
        nomineeRole: 'Team Lead',
        targetRole: 'Manager',
        status: 'InProgress',
        startDate: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString(),
        modules: modules.map((m, i) => ({ ...m, isCompleted: i < 1 })), // First module completed
        modulesCompleted: 1,
        currentModuleId: 'm2',
        certified: false,
        lastUpdated: new Date().toISOString(),
    };
    return [mockNomination];
};


// ==========================================
// Service Functions
// ==========================================

/**
 * Nominates an employee for the Leadership Coaching program.
 */
export async function nominateForLeadership(managerRole: Role, nomineeRole: Role): Promise<LeadershipNomination> {
    const allNominations = getFromStorage<LeadershipNomination>(LEADERSHIP_COACHING_KEY);
    const now = new Date().toISOString();
    const initialModules = getInitialModules();

    const newNomination: LeadershipNomination = {
        id: uuidv4(),
        nominatedBy: managerRole,
        nomineeRole,
        targetRole: 'Team Lead / Manager',
        status: 'InProgress',
        startDate: now,
        modules: initialModules,
        modulesCompleted: 0,
        currentModuleId: initialModules[0].id,
        certified: false,
        lastUpdated: now,
    };

    allNominations.unshift(newNomination);
    saveToStorage(LEADERSHIP_COACHING_KEY, allNominations);

    // Create a notification for the nominated user
    const managerName = roleUserMapping[managerRole]?.name || managerRole;
    const notification: Feedback = {
        trackingId: `LD-NOM-${newNomination.id}`,
        subject: `You've been enrolled in the Leadership Development Program!`,
        message: `Congratulations! ${managerName} has enrolled you in the Leadership Development Program.\n\nThis program is designed to help you grow from a subject matter expert into an effective leader. You can track your progress and access modules in the "Leadership" section.`,
        submittedAt: now,
        criticality: 'Low',
        status: 'Pending Acknowledgement',
        assignedTo: [nomineeRole],
        viewed: false,
        auditTrail: [{
            event: 'Notification Created',
            timestamp: now,
            actor: 'System',
            details: `Automated notification for Leadership Program enrollment.`
        }]
    };
    
    const allFeedback = getFeedbackFromStorage();
    allFeedback.unshift(notification);
    saveFeedbackToStorage(allFeedback);

    return newNomination;
}

/**
 * Gets all leadership nominations initiated by a specific manager.
 */
export async function getLeadershipNominationsForManager(managerRole: Role): Promise<LeadershipNomination[]> {
    const allNominations = getFromStorage<LeadershipNomination>(LEADERSHIP_COACHING_KEY);
    return allNominations
        .filter(n => n.nominatedBy === managerRole)
        .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
}

/**
 * Gets the leadership nomination for the currently logged-in user, if one exists.
 */
export async function getNominationForUser(userRole: Role): Promise<LeadershipNomination | null> {
    const allNominations = getFromStorage<LeadershipNomination>(LEADERSHIP_COACHING_KEY);
    return allNominations.find(n => n.nomineeRole === userRole) || null;
}
