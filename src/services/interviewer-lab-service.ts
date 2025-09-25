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
                id: 'l1-2', title: 'Core Principles of Structured Interviewing', type: 'standard', isCompleted: false,
                steps: [
                    {
                        type: 'script',
                        title: '🎙️ Coach Intro',
                        content: "Structured interviews aren’t just about asking the same questions. They’re built on 3 principles:\n\n- Consistency — ask the same core questions.\n- Relevance — questions tied to the job role.\n- Scoring — rate answers against clear criteria."
                    },
                    {
                        type: 'script',
                        title: '📊 Teaching Moment / Analogy',
                        content: "Think of it like refereeing a game.\n\nEvery player follows the same rules.\nScores are based on agreed standards.\n\nThat’s how you keep the game — and the hiring process — fair."
                    },
                    {
                        type: 'script',
                        title: '📖 Mini-Case',
                        content: "A financial services firm introduced structured scoring rubrics. Managers reported more confidence in hiring decisions because they had objective data to back them up."
                    },
                    {
                        type: 'quiz_mcq',
                        question: "Which principle ensures fairness across candidates?",
                        options: ["Consistency", "Small talk", "Improvisation", "Intuition"],
                        correctAnswer: "Consistency",
                        feedback: {
                            correct: "Yes! Consistency = fairness.",
                            incorrect: "The answer is A. Consistency is the foundation of fairness."
                        }
                    },
                    {
                        type: 'journal',
                        prompt: "Which of these principles do you personally find hardest: consistency, relevance, or scoring? Why?"
                    },
                    {
                        type: 'script',
                        title: '📌 Coach Wrap-Up',
                        content: "Consistency makes it fair. Relevance makes it useful. Scoring makes it actionable."
                    },
                    {
                        type: 'journal',
                        prompt: "🚀 Stretch Activity\n\nPick one job in your team. Write 2 consistent, relevant questions you could ask every candidate for that role."
                    }
                ]
            },
            {
                id: 'l1-3', title: 'Designing Structured Interview Questions', type: 'standard', isCompleted: false,
                steps: [
                    {
                        type: 'script',
                        title: '🎙️ Coach Intro',
                        content: "Not all questions are created equal. Structured interviews rely on behavioral (‘Tell me about a time…’) and situational (‘What would you do if…’) questions. These dig into real skills, not just surface-level talk."
                    },
                    {
                        type: 'script',
                        title: '📊 Teaching Moment / Analogy',
                        content: "Think of it like testing a driver. Asking ‘Are you good at driving?’ is useless. Making them take a road test shows you the truth.\n\nGood questions = road test for skills."
                    },
                    {
                        type: 'script',
                        title: '📖 Mini-Case',
                        content: "A tech company replaced vague questions (‘What’s your greatest strength?’) with behavioral ones (‘Tell me about a time you solved a tough bug’). Result: much stronger signal about candidate skills."
                    },
                    {
                        type: 'quiz_mcq',
                        question: "Which of these is a behavioral interview question?",
                        options: ["What’s your favorite movie?", "Tell me about a time you led a difficult project.", "Do you consider yourself detail-oriented?", "How would you feel about working weekends?"],
                        correctAnswer: "Tell me about a time you led a difficult project.",
                        feedback: {
                            correct: "Correct — behavioral questions use past experiences as evidence.",
                            incorrect: "The answer is B. Behavioral questions start with ‘Tell me about a time…’"
                        }
                    },
                    {
                        type: 'journal',
                        prompt: "Think of a role you hire for. What’s one strong behavioral question you could use?"
                    },
                    {
                        type: 'script',
                        title: '📌 Coach Wrap-Up',
                        content: "Structured interviews use job-relevant, evidence-based questions. Behavior predicts future behavior."
                    },
                    {
                        type: 'journal',
                        prompt: "🚀 Stretch Activity\n\nWrite one behavioral and one situational question for your next role. Save them for your question bank."
                    }
                ]
            },
            {
                id: 'l1-4', title: 'Scoring and Evaluation Rubrics', type: 'standard', isCompleted: false,
                steps: [
                    {
                        type: 'script',
                        title: '🎙️ Coach Intro',
                        content: "Even the best questions fail without clear scoring. Structured interviews use rubrics: 1–5 scales with defined behaviors at each level."
                    },
                    {
                        type: 'script',
                        title: '📊 Teaching Moment / Analogy',
                        content: "Imagine grading an essay without a rubric. One teacher gives it an A, another a C. That’s chaos. A rubric makes evaluation fair and repeatable."
                    },
                    {
                        type: 'script',
                        title: '📖 Mini-Case',
                        content: "A healthcare company trained managers to use 1–5 rubrics. Result: interviewer agreement went up 40%. That means less debate, faster decisions."
                    },
                    {
                        type: 'quiz_mcq',
                        question: "Why are rubrics important?",
                        options: ["They allow gut-based scoring", "They reduce subjectivity", "They replace job descriptions", "They guarantee a perfect hire"],
                        correctAnswer: "They reduce subjectivity",
                        feedback: {
                            correct: "Exactly — rubrics reduce subjectivity.",
                            incorrect: "The answer is B. Rubrics keep scoring consistent and fair."
                        }
                    },
                    {
                        type: 'journal',
                        prompt: "Think about the last time you scored a candidate. Did you have a clear rubric, or did you rely on gut feel?"
                    },
                    {
                        type: 'script',
                        title: '📌 Coach Wrap-Up',
                        content: "Rubrics = fairness + reliability. They turn vague answers into measurable data."
                    },
                    {
                        type: 'journal',
                        prompt: "🚀 Stretch Activity\n\nDesign a 1–5 scoring rubric for one interview question. Write what ‘1’ looks like, what ‘5’ looks like, and fill in the middle."
                    }
                ]
            },
            {
                id: 'l1-5', title: 'Reducing Bias in Hiring', type: 'standard', isCompleted: false,
                steps: [
                    {
                        type: 'script',
                        title: '🎙️ Coach Intro',
                        content: "Bias creeps in when interviews are unstructured. Structured interviews help — but only if you stay disciplined. Bias isn’t always obvious; it’s often unconscious."
                    },
                    {
                        type: 'script',
                        title: '📊 Teaching Moment / Analogy',
                        content: "Think of it like a GPS. Without structure, you drift off course without noticing. Structure = a route that keeps you honest."
                    },
                    {
                        type: 'script',
                        title: '📖 Mini-Case',
                        content: "A consulting firm trained managers to stick to structured questions and scoring. Over 18 months, their gender balance in new hires improved by 20% — not by lowering the bar, but by reducing bias."
                    },
                    {
                        type: 'quiz_mcq',
                        question: "Which practice reduces bias in interviews?",
                        options: ["Asking every candidate different questions", "Sticking to structured questions and rubrics", "Relying on first impressions", "Letting gut feel decide"],
                        correctAnswer: "Sticking to structured questions and rubrics",
                        feedback: {
                            correct: "Yes — consistency and rubrics reduce bias.",
                            incorrect: "The correct answer is B. Structure keeps bias out."
                        }
                    },
                    {
                        type: 'journal',
                        prompt: "Think of a time when bias — yours or someone else’s — may have influenced a hiring decision. How could structure have reduced it?"
                    },
                    {
                        type: 'script',
                        title: '📌 Coach Wrap-Up',
                        content: "Bias is sneaky. Structure protects against it by forcing consistency and fairness. That’s how you build diverse, high-performing teams."
                    },
                    {
                        type: 'journal',
                        prompt: "🚀 Stretch Activity\n\nReview your last interview notes. Did you evaluate everyone against the same criteria, or were impressions creeping in? Rewrite your notes with a structured rubric lens."
                    }
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
            { id: 'l3-4', title: 'Reflection', type: 'journal', isCompleted: false, steps: [{ type: 'journal', prompt: "Write down one bias you will consciously watch for in yourself during your next interview." }] }
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
