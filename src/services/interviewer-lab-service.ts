/**
 * @fileOverview A service for managing Interviewer Lab nominations and progress.
 */
'use client';

import { v4 as uuidv4 } from 'uuid';
import type { Role } from '@/hooks/use-role';
import { roleUserMapping } from '@/lib/role-mapping';
import type { InterviewerAnalysisOutput } from '@/ai/schemas/interviewer-lab-schemas';
import type { NetsInitialInput } from '@/ai/schemas/nets-schemas';

export interface QuizActivity {
    type: 'quiz_mcq';
    question: string;
    options: string[];
    correctAnswer: string;
}

export interface MatchActivity {
    type: 'match_game';
    prompt: string;
    items: { text: string, category: string }[];
    categories: string[];
}

export interface FillBlankActivity {
    type: 'fill_blank';
    prompt: string;
}

export interface ChecklistActivity {
    type: 'checklist';
    prompt: string;
    options: string[];
}

export interface BranchingActivity {
    type: 'branching_scenario';
    prompt: string;
    options: { text: string, isCorrect: boolean }[];
}

export interface JournalActivity {
    type: 'journal';
    prompt: string;
}

export interface SwipeActivity {
    type: 'swipe_quiz';
    prompt: string;
    cards: { text: string, correctAnswer: 'Legal' | 'Illegal' }[];
}

export type LessonActivity = QuizActivity | MatchActivity | FillBlankActivity | ChecklistActivity | BranchingActivity | JournalActivity | SwipeActivity;


export interface TrainingLesson {
    id: string;
    title: string;
    type: 'video' | 'reading' | 'interactive' | 'practice';
    isCompleted: boolean;
    script?: string;
    activity?: LessonActivity;
    practiceScenario?: NetsInitialInput;
    result?: any;
}

export interface TrainingModule {
    id:string;
    title: string;
    description: string;
    duration: number; // in minutes
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

const INTERVIEWER_LAB_KEY = 'interviewer_lab_nominations_v3'; // Incremented version

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
        duration: 30,
        isCompleted: false,
        lessons: [
            {
                id: 'l1-1', title: 'Why Structure Matters', type: 'reading', isCompleted: false,
                script: "Unstructured interviews feel natural but are unreliable. Structured interviews predict performance better, reduce bias, and provide legal protection.",
                activity: { type: 'quiz_mcq', question: "Which interview type is most legally defensible?", options: ["Unstructured", "Semi-structured", "Structured"], correctAnswer: "Structured" }
            },
            {
                id: 'l1-2', title: 'Interview Phases', type: 'interactive', isCompleted: false,
                script: "A great interview has three phases:\n\n- Opening: Build rapport and explain the process.\n- Middle: Ask behavioral and skills-based questions.\n- Closing: Answer candidate questions and share the next steps.",
                activity: {
                    type: 'match_game', prompt: 'Place each step in the correct phase:',
                    items: [ { text: "Candidate Q&A", category: "Closing"}, { text: "Explain interview format", category: "Opening"}, { text: "Ask role-specific questions", category: "Middle"} ],
                    categories: ["Opening", "Middle", "Closing"]
                }
            },
            {
                id: 'l1-3', title: 'Active Listening', type: 'reading', isCompleted: false,
                script: "Good interviewers follow the 80/20 rule: the candidate should talk 80% of the time. Use reflective listening to paraphrase answers and confirm your understanding. Don't be afraid to use silence to allow the candidate to think.",
                activity: { type: 'quiz_mcq', question: "A candidate gives a long-winded answer. What should you do?", options: ["Interrupt and finish their sentence for them", "Paraphrase their key points to confirm understanding", "Immediately skip to the next question"], correctAnswer: "Paraphrase their key points to confirm understanding" }
            }
        ]
    },
    {
        id: 'm2',
        title: "Behavioral Interviewing Mastery",
        description: "Master the STAR method to effectively probe for behavioral examples.",
        duration: 40,
        isCompleted: false,
        lessons: [
            {
                id: 'l2-1', title: 'STAR Breakdown', type: 'interactive', isCompleted: false,
                script: "The STAR method is a framework for answering behavioral questions:\n- Situation: Background of the story.\n- Task: The goal the candidate was trying to achieve.\n- Action: The specific steps they took.\n- Result: The outcome of their actions, with metrics if possible.",
                activity: {
                    type: 'match_game', prompt: 'Match the statement to the STAR component:',
                    items: [{ text: "I had to resolve a team conflict", category: "Task"}, { text: "I spoke with each party individually", category: "Action"}, { text: "Team collaboration improved by 20%", category: "Result"}],
                    categories: ["Situation", "Task", "Action", "Result"]
                }
            },
            {
                id: 'l2-2', title: 'Writing STAR Questions', type: 'reading', isCompleted: false,
                script: "Behavioral questions should invite detailed stories, not 'yes' or 'no' answers. Start with phrases like 'Tell me about a time when...' or 'Describe a situation where...'",
                activity: { type: 'fill_blank', prompt: "Complete the prompt: 'Tell me about a time when you ___.'" }
            },
            {
                id: 'l2-3', title: 'Evaluating STAR Answers', type: 'reading', isCompleted: false,
                script: "Strong answers have clear, specific 'Action' steps taken by the candidate and measurable 'Results'. Weak answers are vague or miss the result entirely.",
                activity: { type: 'quiz_mcq', question: "An AI candidate will give a STAR response. Rate it Good / Fair / Poor.", options: ["Good", "Fair", "Poor"], correctAnswer: "Good" } // Simplified for now
            },
            {
                id: 'l2-4', title: 'Practice: Mock STAR Interview', type: 'practice', isCompleted: false,
                practiceScenario: { persona: 'Candidate', scenario: "You are the interviewer. Ask the AI candidate, 'Tell me about a time you had to handle a difficult stakeholder.' Your goal is to get a complete STAR answer, probing for details if they are vague.", difficulty: 'neutral' }
            }
        ]
    },
    {
        id: 'm3',
        title: "Bias Awareness & Mitigation",
        description: "Learn to identify and reduce unconscious bias in the hiring process.",
        duration: 30,
        isCompleted: false,
        lessons: [
            {
                id: 'l3-1', title: 'Spot the Bias', type: 'reading', isCompleted: false,
                script: "Common biases include: Confirmation (seeking info that confirms your beliefs), Similarity (favoring people like you), and Halo/Horn (letting one good/bad trait overshadow everything else).",
                activity: { type: 'quiz_mcq', question: "You find yourself really liking a candidate because they went to the same university as you. Which bias is at play?", options: ["Halo Effect", "Similarity Bias", "Confirmation Bias"], correctAnswer: "Similarity Bias" }
            },
            {
                id: 'l3-2', title: 'Bias Interruption Techniques', type: 'reading', isCompleted: false,
                script: "You can actively interrupt bias by using scorecards, asking all candidates the same core questions, and ensuring a diverse interview panel.",
                activity: { type: 'checklist', prompt: "Select which two strategies you’ll commit to using in your next interview:", options: ["Use a scorecard for every interview", "Ask the same core set of questions to all candidates", "Include a diverse panel of interviewers"] }
            },
            {
                id: 'l3-3', title: 'Inclusive Interviewing', type: 'reading', isCompleted: false,
                script: "Never ask about a candidate's family, religion, personal life, or other protected characteristics. Always frame questions around the requirements of the role.",
                activity: {
                    type: 'branching_scenario', prompt: "A candidate says: 'I may need some flexibility for childcare support.' What do you say?",
                    options: [{ text: "Do you plan to have kids soon?", isCorrect: false }, { text: "Are you able to meet the required work schedule for this role?", isCorrect: true }]
                }
            },
            {
                id: 'l3-4', title: 'Practice: Reflection', type: 'practice', isCompleted: false,
                script: "Bias is natural, but acknowledging it is the first step to mitigating it.",
                activity: { type: 'journal', prompt: "Write down one bias you will consciously watch for in yourself during your next interview." }
            }
        ]
    },
    {
        id: 'm4',
        title: "Legal Compliance Essentials",
        description: "Understand the legal boundaries of interviewing.",
        duration: 35,
        isCompleted: false,
        lessons: [
            {
                id: 'l4-1', title: 'Prohibited vs. Legal Questions', type: 'reading', isCompleted: false,
                script: "Illegal questions relate to protected classes like family status, age, religion, or disability. Legal questions focus on the candidate's ability to perform essential job functions.",
                activity: {
                    type: 'swipe_quiz', prompt: 'Is this question Legal or Illegal?',
                    cards: [ { text: "Are you planning to have children?", correctAnswer: 'Illegal'}, { text: "This role requires occasional travel. Are you able to travel for work?", correctAnswer: 'Legal'}]
                }
            },
            {
                id: 'l4-2', title: 'Protected Classes', type: 'interactive', isCompleted: false,
                script: "In the US, the EEOC protects candidates based on race, color, religion, sex (including gender identity, sexual orientation, and pregnancy), national origin, age (40 or older), disability, and genetic information.",
                activity: { type: 'checklist', prompt: 'Acknowledge you have reviewed the protected classes.', options: ["I have reviewed the list."]}
            },
            {
                id: 'l4-3', title: 'Documentation Best Practices', type: 'reading', isCompleted: false,
                script: "Always document the questions you asked, the candidate's responses (as factually as possible), your scoring against the rubric, and the final hiring decision.",
                activity: {
                    type: 'quiz_mcq', question: "Which of these notes is compliant?",
                    options: ["Candidate seemed nervous and low-energy.", "Candidate described leading a team of 5 people to launch a product.", "Not a great culture fit."],
                    correctAnswer: "Candidate described leading a team of 5 people to launch a product."
                }
            }
        ]
    },
    {
        id: 'm5',
        title: "Mock Interview Simulator",
        description: "Put all your skills together in a full mock interview.",
        duration: 60,
        isCompleted: false,
        lessons: [
            {
                id: 'l5-1', title: 'Final Mock Interview', type: 'practice', isCompleted: false,
                script: "It's time to put it all together. Conduct a full 30-minute interview with an AI candidate for your target role. You'll be scored on structure, STAR probing, bias avoidance, and legal compliance.",
                practiceScenario: { persona: 'Candidate', scenario: "This is a full mock interview simulation. You are the interviewer. Please conduct the interview from start to finish. Introduce yourself, ask 2-3 behavioral questions, and close the interview professionally.", difficulty: 'neutral' }
            }
        ]
    },
    {
        id: 'm6',
        title: "Leadership Through Interviewing",
        description: "Frame interviewing as a core leadership competency.",
        duration: 30,
        isCompleted: false,
        lessons: [
            {
                id: 'l6-1', title: 'Interviewing as a Leadership Skill', type: 'reading', isCompleted: false,
                script: "Great interviewing isn't just an HR task; it's a core leadership competency. It builds your decision-making, communication, and judgment skills.",
                activity: { type: 'quiz_mcq', question: "Which leadership skill is most strengthened by conducting structured interviews?", options: ["Emotional Intelligence", "Financial Modeling", "Coding"], correctAnswer: "Emotional Intelligence" }
            },
            {
                id: 'l6-2', title: 'Handling Difficult Situations', type: 'reading', isCompleted: false,
                script: "Great interviewers stay professional under pressure. To manage candidates who talk too much, politely interject and redirect. For evasive candidates, rephrase the question or ask a different STAR-based question to get the information you need.",
                activity: {
                    type: 'quiz_mcq', question: "A candidate is giving vague, evasive answers. What is the best approach?",
                    options: ["Push them aggressively for an answer", "Ask a different, more specific probing question using the STAR method", "End the interview early"],
                    correctAnswer: "Ask a different, more specific probing question using the STAR method"
                }
            },
            {
                id: 'l6-3', title: 'Reflection and Growth', type: 'practice', isCompleted: false,
                script: "The best leaders reflect after each interview on what went well and what they could improve for next time. Continuous improvement is key.",
                activity: { type: 'journal', prompt: "Write one thing you will do differently in your next real-world interview based on what you've learned in this program." }
            }
        ]
    }
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
