/**
 * @fileOverview A service for managing Interviewer Lab nominations and progress.
 */
'use client';

import { v4 as uuidv4 } from 'uuid';
import type { Role } from '@/hooks/use-role';
import { roleUserMapping } from '@/lib/role-mapping';
import type { InterviewerAnalysisOutput } from '@/ai/schemas/interviewer-lab-schemas';
import type { NetsInitialInput } from '@/ai/schemas/nets-schemas';
import { getFeedbackFromStorage, saveFeedbackToStorage, type Feedback } from './feedback-service';

// ==========================================
// NEW: Multi-step Lesson Structure
// ==========================================

export interface ScriptStep {
    type: 'script';
    title?: string;
    content: string;
}

export interface QuizStep {
    type: 'quiz_mcq';
    question: string;
    options: string[];
    correctAnswer: string;
    feedback: {
        correct: string;
        incorrect: string;
    };
}

export interface JournalStep {
    type: 'journal';
    prompt: string;
}

export type LessonStep = ScriptStep | QuizStep | JournalStep;

export interface TrainingLesson {
    id: string;
    title: string;
    type: 'standard' | 'practice'; // Simplified type
    isCompleted: boolean;
    steps?: LessonStep[]; // A lesson can have multiple steps
    practiceScenario?: NetsInitialInput; // For practice-type lessons
    result?: any;
}


// --- Old activity types, kept for compatibility if needed, but new lessons use steps ---
export interface QuizActivity {
    type: 'quiz_mcq';
    question: string;
    options: string[];
    correctAnswer: string;
}
export interface MatchActivity { type: 'match_game'; prompt: string; items: { text: string, category: string }[]; categories: string[]; }
export interface FillBlankActivity { type: 'fill_blank'; prompt: string; }
export interface ChecklistActivity { type: 'checklist'; prompt: string; options: string[]; }
export interface BranchingActivity { type: 'branching_scenario'; prompt: string; options: { text: string, isCorrect: boolean }[]; }
export interface JournalActivity { type: 'journal'; prompt: string; }
export interface SwipeActivity { type: 'swipe_quiz'; prompt: string; cards: { text: string, correctAnswer: 'Legal' | 'Illegal' }[]; }
export type LessonActivity = QuizActivity | MatchActivity | FillBlankActivity | ChecklistActivity | BranchingActivity | JournalActivity | SwipeActivity;


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

const INTERVIEWER_LAB_KEY = 'interviewer_lab_nominations_v4'; // Incremented version

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
                id: 'l1-1', title: 'Why Structured Interviews Matter', type: 'standard', isCompleted: false,
                steps: [
                    {
                        type: 'script',
                        title: '👋 Coach Intro',
                        content: "Most managers think they’re great at interviewing.\n\nBut research says otherwise: unstructured interviews are only about 20% predictive of job success. That’s barely better than flipping a coin.\n\nThe problem? Unstructured interviews:\n- Drift into small talk and gut feelings.\n- Let unconscious bias creep in.\n- Miss important, consistent evaluation points.\n\nSo how do world-class companies solve this? With structured interviews. Think of them as your playbook for fair, consistent, high-quality hiring."
                    },
                    {
                        type: 'script',
                        title: '📊 Teaching Moment',
                        content: "Structured interviews double predictive accuracy — about 40% predictive. That might not sound like much, but in hiring, it’s massive.\n\nHere’s an analogy:\nImagine you’re scouting athletes. If you let each coach ask random questions, one might ask about diet, another about favorite music. Results are all over the place.\n\nBut if everyone runs the same timed sprint test, you can compare apples to apples.\n\nThat’s the essence of structure: same test, fairer results, better hires."
                    },
                    {
                        type: 'script',
                        title: '📖 Mini-Case',
                        content: "Let me share a quick story.\n\nA retail company once let managers run their own unstructured interviews. The result? High turnover, inconsistent hiring, and even a lawsuit around discriminatory questioning.\n\nWhen they switched to structured interviews — same questions, standardized scoring — turnover dropped by 25% and legal risk disappeared.\n\nLesson: Structure isn’t bureaucracy. It’s protection + performance."
                    },
                    {
                        type: 'quiz_mcq',
                        question: "Which of these is a proven benefit of structured interviews?",
                        options: ["They allow managers to improvise fully.", "They ensure fairness and reduce legal risk.", "They focus on casual conversation.", "They guarantee every candidate accepts an offer."],
                        correctAnswer: "They ensure fairness and reduce legal risk.",
                        feedback: {
                            correct: "Exactly! Fairness and compliance are the backbone of structured interviews.",
                            incorrect: "Not quite. Improvisation and small talk can feel nice, but they don’t predict performance or protect you legally. The right answer is B."
                        }
                    },
                    {
                        type: 'journal',
                        prompt: "Now, let’s apply this.\n\nThink of a time you were in an interview — either giving it or sitting as a candidate.\n\nWas it structured or unstructured?\n\nHow did it feel — fair, consistent, or random?\n\nWhat did you learn about the effectiveness of that style?\n\nWrite 2–3 sentences in your notes. This reflection primes your brain to connect the concept to real experience."
                    },
                    {
                        type: 'script',
                        title: '📌 Coach Wrap-Up',
                        content: "Here’s what I want you to remember:\n\nUnstructured = random, risky, biased.\n\nStructured = fair, consistent, predictive.\n\nCompanies that use structured interviews not only hire better, they protect themselves legally and build trust with candidates.\n\nYour role as an interviewer is not just to ‘chat.’ It’s to create a reliable system that helps your team win. Structure is that system."
                    },
                    {
                        type: 'journal',
                        prompt: "Want to go deeper? Try this optional stretch activity:\n\nWrite down 3 interview questions you’ve asked (or been asked).\n\nAsk yourself: Could these be standardized and asked to every candidate?\n\nHow would that change fairness and consistency?"
                    }
                ]
            },
            {
                id: 'l1-2', title: 'Interview Phases', type: 'standard', isCompleted: false,
                steps: [
                    { type: 'script', content: "A great interview has three phases:\n\n- Opening: Build rapport and explain the process.\n- Middle: Ask behavioral and skills-based questions.\n- Closing: Answer candidate questions and share the next steps." },
                    { type: 'quiz_mcq', question: "In which phase do you answer the candidate's questions?", options: ["Opening", "Middle", "Closing"], correctAnswer: "Closing", feedback: {correct: "Correct!", incorrect:"Not quite, candidate Q&A happens in the closing phase."} }
                ]
            },
            {
                id: 'l1-3', title: 'Active Listening', type: 'standard', isCompleted: false,
                steps: [
                     { type: 'script', content: "Good interviewers follow the 80/20 rule: the candidate should talk 80% of the time. Use reflective listening to paraphrase answers and confirm your understanding. Don't be afraid to use silence to allow the candidate to think." },
                     { type: 'quiz_mcq', question: "A candidate gives a long-winded answer. What should you do?", options: ["Interrupt and finish their sentence for them", "Paraphrase their key points to confirm understanding", "Immediately skip to the next question"], correctAnswer: "Paraphrase their key points to confirm understanding", feedback: {correct: "Correct!", incorrect:"Not quite."} }
                ]
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
            { id: 'l2-1', title: 'STAR Breakdown', type: 'standard', isCompleted: false, steps: [{ type: 'script', content: 'STAR Method: Situation, Task, Action, Result. It is a framework for answering behavioral questions.'}] },
            { id: 'l2-2', title: 'Writing STAR Questions', type: 'standard', isCompleted: false, steps: [{ type: 'script', content: "Behavioral questions should invite detailed stories, not 'yes' or 'no' answers."}] },
            { id: 'l2-3', title: 'Evaluating STAR Answers', type: 'standard', isCompleted: false, steps: [{ type: 'script', content: "Strong answers have clear, specific 'Action' steps and measurable 'Results'."}] },
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
            { id: 'l3-1', title: 'Spot the Bias', type: 'standard', isCompleted: false, steps: [{ type: 'script', content: 'Common biases include: Confirmation, Similarity, and Halo/Horn effect.'}] },
            { id: 'l3-2', title: 'Bias Interruption Techniques', type: 'standard', isCompleted: false, steps: [{ type: 'script', content: 'Use scorecards, ask all candidates the same core questions, and ensure a diverse interview panel.'}] },
            { id: 'l3-3', title: 'Inclusive Interviewing', type: 'standard', isCompleted: false, steps: [{ type: 'script', content: 'Never ask about a candidate\'s family, religion, personal life, or other protected characteristics.'}] },
            { id: 'l3-4', title: 'Reflection', type: 'standard', isCompleted: false, steps: [{ type: 'journal', prompt: "Write down one bias you will consciously watch for in yourself during your next interview." }] }
        ]
    },
    {
        id: 'm4',
        title: "Legal Compliance Essentials",
        description: "Understand the legal boundaries of interviewing.",
        duration: 35,
        isCompleted: false,
        lessons: [
            { id: 'l4-1', title: 'Prohibited vs. Legal Qs', type: 'standard', isCompleted: false, steps: [{ type: 'script', content: 'Illegal questions relate to protected classes. Legal questions focus on ability to perform job functions.'}] },
            { id: 'l4-2', title: 'Protected Classes', type: 'standard', isCompleted: false, steps: [{ type: 'script', content: 'In the US, the EEOC protects candidates based on race, religion, sex, age (40+), disability, and more.'}] },
            { id: 'l4-3', title: 'Documentation Best Practices', type: 'standard', isCompleted: false, steps: [{ type: 'script', content: 'Always document questions asked, candidate responses, scoring, and the final hiring decision.'}] },
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
            { id: 'l6-1', title: 'Interviewing as a Leadership Skill', type: 'standard', isCompleted: false, steps: [{ type: 'script', content: 'Interviewing builds decision-making, communication, and judgment.'}] },
            { id: 'l6-2', title: 'Handling Difficult Situations', type: 'standard', isCompleted: false, steps: [{ type: 'script', content: 'Stay professional under pressure. To manage candidates who talk too much, politely interject and redirect.'}] },
            { id: 'l6-3', title: 'Reflection & Growth', type: 'standard', isCompleted: false, steps: [{ type: 'journal', prompt: "Write one thing you’ll do differently in your next real-world interview." }] }
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
    
    // Create a notification for the nominated user
    const managerName = roleUserMapping[managerRole]?.name || managerRole;
    const notification: Feedback = {
        trackingId: `IL-NOM-${newNomination.id}`,
        subject: `You've been nominated for Interviewer Training!`,
        message: `Congratulations! ${managerName} has nominated you for the Laddrr Interviewer Lab, a program designed to help you become a more effective and confident interviewer.\n\nThis training will help you:\n- Conduct structured, fair, and legally compliant interviews.\n- Master behavioral interviewing techniques like the STAR method.\n- Identify and mitigate unconscious bias.\n\nTo get started, please navigate to the "Interviewer Lab" section from the main sidebar and complete your pre-assessment.`,
        submittedAt: now,
        criticality: 'Low',
        status: 'Pending Acknowledgement',
        assignedTo: [nomineeRole],
        viewed: false,
        auditTrail: [{
            event: 'Notification Created',
            timestamp: now,
            actor: 'System',
            details: `Automated notification for Interviewer Lab nomination.`
        }]
    };
    
    const allFeedback = getFeedbackFromStorage();
    allFeedback.unshift(notification);
    saveFeedbackToStorage(allFeedback);

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
 * Saves the result of a post-assessment and determines certification.
 */
export async function savePostAssessment(nominationId: string, analysis: InterviewerAnalysisOutput): Promise<void> {
    const allNominations = getFromStorage<Nomination>(INTERVIEWER_LAB_KEY);
    const index = allNominations.findIndex(n => n.id === nominationId);

    if (index !== -1) {
        const nomination = allNominations[index];
        nomination.scorePost = analysis.overallScore;
        nomination.analysisPost = analysis;
        nomination.lastUpdated = new Date().toISOString();

        // Certification Logic: Must show at least 15% improvement
        const preScore = nomination.scorePre || 0;
        const postScore = nomination.scorePost;
        const improvement = preScore > 0 ? ((postScore - preScore) / preScore) * 100 : 100;

        if (postScore >= 75 && improvement >= 15) {
            nomination.status = 'Certified';
            nomination.certified = true;
        } else {
            nomination.status = 'Retry Needed';
        }

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
