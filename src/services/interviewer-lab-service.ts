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
            { id: 'l1-1', title: 'Why Structure Matters', description: 'Understand the impact of a well-structured interview process.', type: 'video', isCompleted: false },
            { id: 'l1-2', title: 'Quiz: Importance of Structure', description: 'Test your knowledge on interview structure.', type: 'quiz', isCompleted: false, quizOptions: ['It helps the candidate feel comfortable', 'It ensures fairness and consistency', 'It makes the interviewer look professional', 'All of the above'], correctAnswer: 'All of the above' },
            { id: 'l1-3', title: 'The Three Phases of an Interview', description: 'Explore the timeline: opening, middle, and closing.', type: 'interactive', isCompleted: false },
            { id: 'l1-4', title: 'Practice: The Introduction', description: 'Practice your interview opening with an AI candidate.', type: 'practice', isCompleted: false, practiceScenario: { persona: 'Candidate', scenario: "You are the interviewer. Start the interview by introducing yourself, setting the agenda, and building rapport with the AI candidate.", difficulty: 'friendly' } },
        ]
    },
    { 
        id: 'm2', 
        title: "Behavioral Interviewing Mastery", 
        description: "Master the STAR method to effectively probe for behavioral examples.", 
        isCompleted: false,
        lessons: [
            { id: 'l2-1', title: 'STAR Method Breakdown', description: 'A visual guide to Situation, Task, Action, and Result.', type: 'video', isCompleted: false },
            { id: 'l2-2', title: 'Quiz: Identifying STAR Components', description: 'Identify the "Action" in a sample candidate story.', type: 'quiz', isCompleted: false, quizOptions: ["'My project was falling behind schedule.'", "'I had to get the project back on track.'", "'I organized a daily stand-up and re-prioritized the backlog.'", "'The project was delivered on time.'"], correctAnswer: "'I organized a daily stand-up and re-prioritized the backlog.'" },
            { id: 'l2-3', title: 'Practice: Ask a STAR Question', description: 'Roleplay with an AI candidate to get a full STAR example.', type: 'practice', isCompleted: false, practiceScenario: { persona: 'Candidate', scenario: "You are the interviewer. Ask the candidate to describe a time they handled a difficult stakeholder. Your goal is to get a complete STAR answer, probing for details if they are vague.", difficulty: 'neutral' } },
        ]
    },
     { 
        id: 'm3', 
        title: "Bias Awareness & Mitigation", 
        description: "Learn to identify and reduce unconscious bias in the hiring process.", 
        isCompleted: false,
        lessons: [
            { id: 'l3-1', title: 'Common Types of Bias', description: 'Learn about affinity bias, confirmation bias, and the halo/horns effect.', type: 'video', isCompleted: false },
            { id: 'l3-2', title: 'Quiz: Spot the Bias', description: 'Read a scenario and identify the most likely bias at play.', type: 'quiz', isCompleted: false, quizOptions: ["Affinity Bias ('The candidate went to the same university as me, they must be great!')", "Horns Effect ('The candidate was a bit nervous, so they're probably not confident.')", "Confirmation Bias ('Their first answer was weak, so I doubt their other skills are strong.')"], correctAnswer: "Affinity Bias ('The candidate went to the same university as me, they must be great!')" },
            { id: 'l3-3', title: 'Practice: Rephrase a Biased Question', description: 'Rewrite a question to be more inclusive and effective.', type: 'practice', isCompleted: false, practiceScenario: { persona: 'Hiring Manager', scenario: "You are coaching a peer. They suggest asking, 'How would you handle a stressful deadline with a family at home?'. Help them rephrase this to focus only on job-relevant skills.", difficulty: 'cooperative' } },
        ]
    },
    { 
        id: 'm4', 
        title: "Legal Compliance Essentials", 
        description: "Understand the legal boundaries of interviewing.", 
        isCompleted: false,
        lessons: [
            { id: 'l4-1', title: 'Protected Classes Explained', description: 'A quick overview of legally protected characteristics.', type: 'interactive', isCompleted: false },
            { id: 'l4-2', title: 'Quiz: Is This Question Legal?', description: 'A rapid-fire quiz on common but problematic questions.', type: 'quiz', isCompleted: false, quizOptions: ["'Are you authorized to work in this country?'", "'Where are you from originally?'", "'Do you have children?'"], correctAnswer: "'Are you authorized to work in this country?'" },
            { id: 'l4-3', title: 'Practice: Documentation Best Practices', description: 'Review sample interview notes and identify potential legal risks.', type: 'practice', isCompleted: false, practiceScenario: { persona: 'Legal Advisor', scenario: "You are reviewing a colleague's interview notes which say 'Candidate seemed low-energy, might not be a culture fit.' The AI legal advisor will help you understand why this note is problematic and how to improve it.", difficulty: 'cooperative' } },
        ]
    },
    { 
        id: 'm5', 
        title: "Mock Interview Simulator", 
        description: "Put all your skills together in a full mock interview.", 
        isCompleted: false,
        lessons: [
            { id: 'l5-1', title: 'Final Mock Interview', description: "Conduct a full interview with an AI candidate for your target role. You'll be scored on structure, STAR probing, bias avoidance, and legal compliance.", type: 'practice', isCompleted: false, practiceScenario: { persona: 'Candidate', scenario: "This is a full mock interview simulation. You are the interviewer. Please conduct the interview from start to finish.", difficulty: 'neutral' } },
        ]
    },
    { 
        id: 'm6', 
        title: "Leadership Through Interviewing", 
        description: "Frame interviewing as a core leadership competency.", 
        isCompleted: false,
        lessons: [
            { id: 'l6-1', title: 'Interviewing as a Leadership Skill', description: 'A short article on how great interviewing reflects strong leadership.', type: 'reading', isCompleted: false },
            { id: 'l6-2', title: 'Practice: Handling a Difficult Candidate', description: "Practice managing a conversation with a candidate who is evasive or challenging.", type: 'practice', isCompleted: false, practiceScenario: { persona: 'Candidate', scenario: "You are the interviewer. The AI candidate will be difficult, providing vague answers and questioning your process. Your goal is to remain professional and guide the interview back on track.", difficulty: 'aggressive' } },
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
