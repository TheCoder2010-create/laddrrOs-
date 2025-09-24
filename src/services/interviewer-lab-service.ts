/**
 * @fileOverview A service for managing Interviewer Lab nominations and progress.
 */
'use client';

import { v4 as uuidv4 } from 'uuid';
import type { Role } from '@/hooks/use-role';
import { roleUserMapping } from '@/lib/role-mapping';
import type { InterviewerAnalysisOutput } from '@/ai/schemas/interviewer-lab-schemas';
import type { NetsInitialInput } from '@/ai/schemas/nets-schemas';

export interface TrainingLesson {
    id: string;
    title: string;
    description: string;
    type: 'video' | 'quiz' | 'interactive' | 'practice' | 'reading';
    isCompleted: boolean;
    // For quizzes
    quizOptions?: string[];
    correctAnswer?: string;
    // For practice scenarios
    practiceScenario?: NetsInitialInput;
    // For storing results
    result?: any;
}

export interface TrainingModule {
    id: string;
    title: string;
    description: string;
    isCompleted: boolean;
    lessons: TrainingLesson[];
}

// Mirroring the planned Firebase structure
export interface Nomination {
    id: string;
    nominatedBy: Role;
    nominee: Role;
    targetInterviewRole: string;
    status: 'Pre-assessment pending' | 'In Progress' | 'Post-assessment pending' | 'Retry Needed' | 'Certified';
    scorePre?: number;
    scorePost?: number;
    analysisPre?: InterviewerAnalysisOutput;
    analysisPost?: InterviewerAnalysisOutput;
    modules: TrainingModule[];
    modulesTotal: number;
    modulesCompleted: number;
    certified: boolean;
    lastUpdated: string;
    nominatedAt: string;
}

const INTERVIEWER_LAB_KEY = 'interviewer_lab_nominations_v2'; // Incremented version

// ==========================================
// Generic Storage Helpers
// ==========================================

const getFromStorage = <T>(key: string): T[] => {
    if (typeof window === 'undefined') return [];
    const json = sessionStorage.getItem(key);
    return json ? JSON.parse(json) : [];
};

const saveToStorage = (key: string, data: any[]): void => {
    if (typeof window === 'undefined') return;
    sessionStorage.setItem(key, JSON.stringify(data));
    window.dispatchEvent(new CustomEvent('feedbackUpdated')); // Use existing event for simplicity
    window.dispatchEvent(new Event('storage'));
};


const getInitialModules = (): TrainingModule[] => [
    { 
        id: 'm1', 
        title: "Interview Foundations", 
        description: "Learn the fundamentals of conducting a structured and professional interview.", 
        isCompleted: false,
        lessons: [
            { id: 'l1-1', title: 'Why Structure Matters', description: '2-min explainer video', type: 'video', isCompleted: false },
            { id: 'l1-2', title: 'Quiz: Importance of Structure', description: 'Test your knowledge', type: 'quiz', isCompleted: false, quizOptions: ['It helps the candidate feel comfortable', 'It ensures fairness and consistency', 'It makes the interviewer look professional', 'All of the above'], correctAnswer: 'All of the above' },
            { id: 'l1-3', title: 'The Three Phases', description: 'Explore the interview timeline', type: 'interactive', isCompleted: false },
            { id: 'l1-4', title: 'Practice: The Introduction', description: 'Practice your interview opening', type: 'practice', isCompleted: false, practiceScenario: { persona: 'Candidate', scenario: "You are a candidate for a software engineering role. The interviewer will start the conversation. Respond as you would in a real interview.", difficulty: 'friendly' } },
        ]
    },
    { 
        id: 'm2', 
        title: "Behavioral Interviewing Mastery", 
        description: "Master the STAR method to effectively probe for behavioral examples.", 
        isCompleted: false,
        lessons: [
            { id: 'l2-1', title: 'STAR Method Breakdown', description: 'Visual guide and examples', type: 'video', isCompleted: false },
            { id: 'l2-2', title: 'Practice: Ask a STAR Question', description: 'Roleplay with an AI candidate', type: 'practice', isCompleted: false, practiceScenario: { persona: 'Candidate', scenario: "You are the candidate. The interviewer will ask you a behavioral question. Please respond using the STAR method, but be a little vague at first to see if they can probe for more details.", difficulty: 'neutral' } },
        ]
    },
     { 
        id: 'm3', 
        title: "Bias Awareness & Mitigation", 
        description: "Learn to identify and reduce unconscious bias in the hiring process.", 
        isCompleted: false,
        lessons: [
            { id: 'l3-1', title: 'Spot the Bias', description: 'Interactive quiz with scenarios', type: 'quiz', isCompleted: false, quizOptions: ['Affinity Bias', 'Confirmation Bias', 'Halo Effect'], correctAnswer: 'Affinity Bias' },
            { id: 'l3-2', title: 'Practice: Rephrase a Biased Question', description: 'Rewrite a question to be more inclusive', type: 'practice', isCompleted: false, practiceScenario: { persona: 'Hiring Manager', scenario: "You are coaching a fellow hiring manager. They suggest asking a candidate 'Are you a real team player?'. Help them rephrase this to be a better, less biased behavioral question.", difficulty: 'neutral' } },
        ]
    },
];


// ==========================================
// Service Functions
// ==========================================

/**
 * Nominates a user for the Interviewer Coaching program.
 */
export async function nominateUser(managerRole: Role, nomineeRole: Role, targetRole: string): Promise<Nomination> {
    const allNominations = getFromStorage<Nomination>(INTERVIEWER_LAB_KEY);
    const now = new Date().toISOString();
    const initialModules = getInitialModules();

    const newNomination: Nomination = {
        id: uuidv4(),
        nominatedBy: managerRole,
        nominee: nomineeRole,
        targetInterviewRole: targetRole,
        status: 'Pre-assessment pending',
        modules: initialModules,
        modulesTotal: initialModules.length,
        modulesCompleted: 0,
        certified: false,
        lastUpdated: now,
        nominatedAt: now,
    };

    allNominations.unshift(newNomination);
    saveToStorage(INTERVIEWER_LAB_KEY, allNominations);
    return newNomination;
}

/**
 * Gets all nominations initiated by a specific manager.
 */
export async function getNominationsForManager(managerRole: Role): Promise<Nomination[]> {
    const allNominations = getFromStorage<Nomination>(INTERVIEWER_LAB_KEY);
    return allNominations
        .filter(n => n.nominatedBy === managerRole)
        .sort((a, b) => new Date(b.nominatedAt).getTime() - new Date(a.nominatedAt).getTime());
}

/**
 * Gets the nomination for the currently logged-in user, if one exists.
 */
export async function getNominationForUser(userRole: Role): Promise<Nomination | null> {
    const allNominations = getFromStorage<Nomination>(INTERVIEWER_LAB_KEY);
    return allNominations.find(n => n.nominee === userRole) || null;
}

/**
 * Saves the result of a pre-assessment mock interview.
 */
export async function savePreAssessment(nominationId: string, analysis: InterviewerAnalysisOutput): Promise<void> {
    const allNominations = getFromStorage<Nomination>(INTERVIEWER_LAB_KEY);
    const index = allNominations.findIndex(n => n.id === nominationId);

    if (index !== -1) {
        allNominations[index].scorePre = analysis.overallScore;
        allNominations[index].analysisPre = analysis;
        allNominations[index].status = 'In Progress';
        allNominations[index].lastUpdated = new Date().toISOString();
        saveToStorage(INTERVIEWER_LAB_KEY, allNominations);
    }
}

/**
 * Marks a training module as complete for a given nomination.
 */
export async function completeModule(nominationId: string, moduleId: string): Promise<Nomination> {
    const allNominations = getFromStorage<Nomination>(INTERVIEWER_LAB_KEY);
    const index = allNominations.findIndex(n => n.id === nominationId);

    if (index === -1) {
        throw new Error("Nomination not found.");
    }

    const nomination = allNominations[index];
    const moduleIndex = nomination.modules.findIndex(m => m.id === moduleId);

    if (moduleIndex !== -1 && !nomination.modules[moduleIndex].isCompleted) {
        nomination.modules[moduleIndex].isCompleted = true;
        nomination.modulesCompleted = nomination.modules.filter(m => m.isCompleted).length;
        nomination.lastUpdated = new Date().toISOString();

        if (nomination.modulesCompleted === nomination.modulesTotal) {
            nomination.status = 'Post-assessment pending';
        }
        
        saveToStorage(INTERVIEWER_LAB_KEY, allNominations);
    }

    return nomination;
}

/**
 * Saves the result of a single lesson.
 */
export async function saveLessonResult(nominationId: string, moduleId: string, lessonId: string, result: any): Promise<void> {
    const allNominations = getFromStorage<Nomination>(INTERVIEWER_LAB_KEY);
    const nominationIndex = allNominations.findIndex(n => n.id === nominationId);
    if (nominationIndex === -1) return;

    const moduleIndex = allNominations[nominationIndex].modules.findIndex(m => m.id === moduleId);
    if (moduleIndex === -1) return;

    const lessonIndex = allNominations[nominationIndex].modules[moduleIndex].lessons.findIndex(l => l.id === lessonId);
    if (lessonIndex === -1) return;

    allNominations[nominationIndex].modules[moduleIndex].lessons[lessonIndex].isCompleted = true;
    allNominations[nominationIndex].modules[moduleIndex].lessons[lessonIndex].result = result;
    
    saveToStorage(INTERVIEWER_LAB_KEY, allNominations);
}
