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
                        content: "Structured interviews double predictive accuracy — about 40% predictive. That might not sound like much, but in hiring, it’s massive.\n\nHere’s an analogy:\n\nImagine you’re scouting athletes. If you let each coach ask random questions, one might ask about diet, another about favorite music. Results are all over the place.\n\nBut if everyone runs the same timed sprint test, you can compare apples to apples.\n\nThat’s the essence of structure: same test, fairer results, better hires."
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
                        prompt: "Want to go deeper? Try this optional stretch activity:\n\nWrite down 3 interview questions you’ve asked (or been asked).\n\nAsk yourself: Could these be standardized and asked to every candidate?\n\nHow would that change fairness and consistency?\n\nBring these to our next lesson — we’ll build on them."
                    }
                ]
            },
            {
                id: 'l1-2', title: 'Core Principles of Structured Interviewing', type: 'standard', isCompleted: false,
                steps: [
                    { type: 'script', title: '🎙️ Coach Intro', content: "Structured interviews aren’t just about asking the same questions. They’re built on 3 principles:\n\n- Consistency — ask the same core questions.\n- Relevance — questions tied to the job role.\n- Scoring — rate answers against clear criteria." },
                    { type: 'script', title: '📊 Teaching Moment / Analogy', content: "Think of it like refereeing a game.\n\nEvery player follows the same rules.\nScores are based on agreed standards.\n\nThat’s how you keep the game — and the hiring process — fair." },
                    { type: 'script', title: '📖 Mini-Case', content: "A financial services firm introduced structured scoring rubrics. Managers reported more confidence in hiring decisions because they had objective data to back them up." },
                    { type: 'quiz_mcq', question: "Which principle ensures fairness across candidates?", options: ["Consistency", "Small talk", "Improvisation", "Intuition"], correctAnswer: "Consistency", feedback: { correct: "Yes! Consistency = fairness.", incorrect: "The answer is A. Consistency is the foundation of fairness." } },
                    { type: 'journal', prompt: "Which of these principles do you personally find hardest: consistency, relevance, or scoring? Why?" },
                    { type: 'script', title: '📌 Coach Wrap-Up', content: "Consistency makes it fair. Relevance makes it useful. Scoring makes it actionable." },
                    { type: 'journal', prompt: "🚀 Stretch Activity\n\nPick one job in your team. Write 2 consistent, relevant questions you could ask every candidate for that role." }
                ]
            },
            {
                id: 'l1-3', title: 'Designing Structured Interview Questions', type: 'standard', isCompleted: false,
                steps: [
                    { type: 'script', title: '🎙️ Coach Intro', content: "Not all questions are created equal. Structured interviews rely on behavioral (‘Tell me about a time…’) and situational (‘What would you do if…’) questions. These dig into real skills, not just surface-level talk." },
                    { type: 'script', title: '📊 Teaching Moment / Analogy', content: "Think of it like testing a driver. Asking ‘Are you good at driving?’ is useless. Making them take a road test shows you the truth.\n\nGood questions = road test for skills." },
                    { type: 'script', title: '📖 Mini-Case', content: "A tech company replaced vague questions (‘What’s your greatest strength?’) with behavioral ones (‘Tell me about a time you solved a tough bug’). Result: much stronger signal about candidate skills." },
                    { type: 'quiz_mcq', question: "Which of these is a behavioral interview question?", options: ["What’s your favorite movie?", "Tell me about a time you led a difficult project.", "Do you consider yourself detail-oriented?", "How would you feel about working weekends?"], correctAnswer: "Tell me about a time you led a difficult project.", feedback: { correct: "Correct — behavioral questions use past experiences as evidence.", incorrect: "The answer is B. Behavioral questions start with ‘Tell me about a time…’" } },
                    { type: 'journal', prompt: "Think of a role you hire for. What’s one strong behavioral question you could use?" },
                    { type: 'script', title: '📌 Coach Wrap-Up', content: "Structured interviews use job-relevant, evidence-based questions. Behavior predicts future behavior." },
                    { type: 'journal', prompt: "🚀 Stretch Activity\n\nWrite one behavioral and one situational question for your next role. Save them for your question bank." }
                ]
            },
            {
                id: 'l1-4', title: 'Scoring and Evaluation Rubrics', type: 'standard', isCompleted: false,
                steps: [
                    { type: 'script', title: '🎙️ Coach Intro', content: "Even the best questions fail without clear scoring. Structured interviews use rubrics: 1–5 scales with defined behaviors at each level." },
                    { type: 'script', title: '📊 Teaching Moment / Analogy', content: "Imagine grading an essay without a rubric. One teacher gives it an A, another a C. That’s chaos. A rubric makes evaluation fair and repeatable." },
                    { type: 'script', title: '📖 Mini-Case', content: "A healthcare company trained managers to use 1–5 rubrics. Result: interviewer agreement went up 40%. That means less debate, faster decisions." },
                    { type: 'quiz_mcq', question: "Why are rubrics important?", options: ["They allow gut-based scoring", "They reduce subjectivity", "They replace job descriptions", "They guarantee a perfect hire"], correctAnswer: "They reduce subjectivity", feedback: { correct: "Exactly — rubrics reduce subjectivity.", incorrect: "The answer is B. Rubrics keep scoring consistent and fair." } },
                    { type: 'journal', prompt: "Think about the last time you scored a candidate. Did you have a clear rubric, or did you rely on gut feel?" },
                    { type: 'script', title: '📌 Coach Wrap-Up', content: "Rubrics = fairness + reliability. They turn vague answers into measurable data." },
                    { type: 'journal', prompt: "🚀 Stretch Activity\n\nDesign a 1–5 scoring rubric for one interview question. Write what ‘1’ looks like, what ‘5’ looks like, and fill in the middle." }
                ]
            },
            {
                id: 'l1-5', title: 'Reducing Bias in Hiring', type: 'standard', isCompleted: false,
                steps: [
                    { type: 'script', title: '🎙️ Coach Intro', content: "Bias creeps in when interviews are unstructured. Structured interviews help — but only if you stay disciplined. Bias isn’t always obvious; it’s often unconscious." },
                    { type: 'script', title: '📊 Teaching Moment / Analogy', content: "Think of it like a GPS. Without structure, you drift off course without noticing. Structure = a route that keeps you honest." },
                    { type: 'script', title: '📖 Mini-Case', content: "A consulting firm trained managers to stick to structured questions and scoring. Over 18 months, their gender balance in new hires improved by 20% — not by lowering the bar, but by reducing bias." },
                    { type: 'quiz_mcq', question: "Which practice reduces bias in interviews?", options: ["Asking every candidate different questions", "Sticking to structured questions and rubrics", "Relying on first impressions", "Letting gut feel decide"], correctAnswer: "Sticking to structured questions and rubrics", feedback: { correct: "Yes — consistency and rubrics reduce bias.", incorrect: "The correct answer is B. Structure keeps bias out." } },
                    { type: 'journal', prompt: "Think of a time when bias — yours or someone else’s — may have influenced a hiring decision. How could structure have reduced it?" },
                    { type: 'script', title: '📌 Coach Wrap-Up', content: "Bias is sneaky. Structure protects against it by forcing consistency and fairness. That’s how you build diverse, high-performing teams." },
                    { type: 'journal', prompt: "🚀 Stretch Activity\n\nReview your last interview notes. Did you evaluate everyone against the same criteria, or were impressions creeping in? Rewrite your notes with a structured rubric lens." }
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
            {
                id: 'l2-1', title: 'Introduction to Behavioral Interviewing', type: 'standard', isCompleted: false,
                steps: [
                    { type: 'script', title: '🎙️ Coach Intro', content: 'Behavioral interviews are built on one principle: Past behavior predicts future performance. Asking candidates how they handled situations in the past is far more reliable than asking what they might do.\n\nIn this module, we’ll learn to ask, evaluate, and score behavioral questions consistently.' },
                    { type: 'script', title: '📊 Teaching Moment / Analogy', content: 'Think of it like a flight simulator. You want to see how someone actually responds in realistic scenarios — not just what they say they would do.' },
                    { type: 'script', title: '📖 Mini-Case', content: 'A software firm switched from hypotheticals (‘What would you do?’) to behavioral questions (‘Tell me about a time you resolved a customer complaint’). They found predictive validity improved — employees who performed well in the interview excelled on the job.' },
                    { type: 'quiz_mcq', question: 'Why are behavioral interviews effective?', options: ['They are more fun than structured interviews', 'Past behavior predicts future performance', 'They allow improvisation', 'They focus mainly on small talk'], correctAnswer: 'Past behavior predicts future performance', feedback: { correct: 'Correct! Evidence-based questions = better prediction.', incorrect: 'The answer is B. Behavioral questions are based on real past behavior.' } },
                    { type: 'journal', prompt: 'Think of a recent interview you conducted. Did you ask any behavioral questions? What was the outcome?' },
                    { type: 'script', title: '📌 Coach Wrap-Up', content: 'Behavioral interviewing isn’t optional. It’s the backbone of predicting on-the-job success.' },
                    { type: 'journal', prompt: '🚀 Stretch Activity\n\nList 2 behavioral questions for a role you hire often. Keep them job-relevant and open-ended.' }
                ]
            },
            {
                id: 'l2-2', title: 'STAR Method for Structured Answers', type: 'standard', isCompleted: false,
                steps: [
                    { type: 'script', title: '🎙️ Coach Intro', content: 'The STAR method breaks down answers into:\n\nSituation — context\nTask — responsibilities or challenge\nAction — what they did\nResult — the outcome\n\nUsing STAR ensures candidates give complete, measurable answers.' },
                    { type: 'script', title: '📊 Teaching Moment / Analogy', content: 'Think of STAR like a recipe: you need all four ingredients to bake the perfect cake. Missing one? You won’t get a full picture.' },
                    { type: 'script', title: '📖 Mini-Case', content: 'A retail manager used STAR to evaluate candidates. Before STAR, answers were vague and hard to compare. After STAR, evaluation became consistent, and candidate comparisons were objective.' },
                    { type: 'quiz_mcq', question: 'Which part of STAR explains what the candidate did?', options: ['Situation', 'Task', 'Action', 'Result'], correctAnswer: 'Action', feedback: { correct: 'Yes! Action = what the candidate actually did.', incorrect: 'The correct answer is C. Action is the steps they took to address the task.' } },
                    { type: 'journal', prompt: 'Pick one past candidate’s answer. Could it be rewritten in STAR format? Try rewriting it briefly.' },
                    { type: 'script', title: '📌 Coach Wrap-Up', content: 'STAR = structured, complete, and comparable answers. Always look for all four parts.' },
                    { type: 'journal', prompt: '🚀 Stretch Activity\n\nWrite one behavioral question. Create a sample STAR answer for scoring practice.' }
                ]
            },
            {
                id: 'l2-3', title: 'Probing Techniques', type: 'standard', isCompleted: false,
                steps: [
                    { type: 'script', title: '🎙️ Coach Intro', content: 'Candidates often give short or incomplete answers. That’s where probing comes in. Probing ensures you get the full story without leading or biasing them.' },
                    { type: 'script', title: '📊 Teaching Moment / Analogy', content: 'Think of probing like peeling an onion. Each layer you uncover reveals deeper insights. But be gentle — you don’t want to confuse or pressure the candidate.' },
                    { type: 'script', title: '📖 Mini-Case', content: 'A tech interviewer asked: ‘Tell me about a time you led a project.’ Candidate gave a brief overview. The interviewer probed: ‘What specifically did you do to motivate your team?’ This revealed leadership behaviors not in the resume.' },
                    { type: 'quiz_mcq', question: 'Which is an example of an effective probe?', options: ['“So you did everything yourself, right?”', '“Can you explain exactly what steps you took?”', '“Was it hard?”', '“Do you think that was good?”'], correctAnswer: '“Can you explain exactly what steps you took?”', feedback: { correct: 'Correct — probes should uncover specifics without leading.', incorrect: 'The correct answer is B. Ask for concrete details, not yes/no answers.' } },
                    { type: 'journal', prompt: 'Think of a time you asked a question and got a short answer. How could you have probed to get a full STAR response?' },
                    { type: 'script', title: '📌 Coach Wrap-Up', content: 'Probing = complete answers. Practice asking ‘What exactly did you do?’ or ‘How did you handle that challenge?’”' },
                    { type: 'journal', prompt: '🚀 Stretch Activity\n\nWrite 2 probing questions for each behavioral question in your candidate bank.' }
                ]
            },
            {
                id: 'l2-4', title: 'Evaluating STAR Responses', type: 'standard', isCompleted: false,
                steps: [
                    { type: 'script', title: '🎙️ Coach Intro', content: 'Once you have a STAR answer, you need to score it objectively. Focus on:\n\nRelevance: Does it match the job requirements?\nDepth: Does it show real skill and ownership?\nOutcome: Did it produce measurable results?' },
                    { type: 'script', title: '📊 Teaching Moment / Analogy', content: 'Think of scoring like judging a competition. Judges follow clear criteria to make fair, comparable evaluations.' },
                    { type: 'script', title: '📖 Mini-Case', content: 'A finance firm created a rubric for STAR responses. Each answer was rated 1–5 for relevance, action, and result. Consistency improved and managers trusted the data.' },
                    { type: 'quiz_mcq', question: 'Which element is not a scoring criterion for STAR answers?', options: ['Relevance', 'Depth', 'Outcome', 'Candidate’s personality color preference'], correctAnswer: 'Candidate’s personality color preference', feedback: { correct: 'Correct. Personal traits unrelated to job performance should not affect scoring.', incorrect: 'The answer is D. Focus on relevant skills, actions, and results.' } },
                    { type: 'journal', prompt: 'Review your last STAR evaluation. Did you use all three scoring dimensions? Note one way to improve your scoring next time.' },
                    { type: 'script', title: '📌 Coach Wrap-Up', content: 'Scoring STAR responses objectively ensures fair, data-driven decisions.' },
                    { type: 'journal', prompt: '🚀 Stretch Activity\n\nTake a sample STAR answer. Score it 1–5 for relevance, depth, and outcome. Compare your scores with a peer or team rubric.' }
                ]
            },
            {
                id: 'l2-5', title: 'Practice, Feedback, and Continuous Improvement', type: 'practice', isCompleted: false,
                steps: [
                    { type: 'script', title: '🎙️ Coach Intro', content: 'Behavioral interviewing is a skill. You improve by:\n\nPracticing questions and probing\nScoring consistently\nIncorporating feedback\nReflecting on your own biases and assumptions' },
                    { type: 'script', title: '📊 Teaching Moment / Analogy', content: 'Like learning an instrument — you won’t master it by reading a book. You need practice, feedback, and repetition.' },
                    { type: 'script', title: '📖 Mini-Case', content: 'A company implemented mock interviews internally. Interviewers practiced STAR questions, scored each other, and gave feedback. Six months later, hiring accuracy increased 30%.' },
                    { type: 'quiz_mcq', question: 'Which action improves interviewer skill the most?', options: ['Asking random questions', 'Practicing, scoring, and reflecting', 'Relying on intuition', 'Watching interviews passively'], correctAnswer: 'Practicing, scoring, and reflecting', feedback: { correct: 'Correct. Skill develops through active practice and reflection.', incorrect: 'The answer is B. Deliberate practice + scoring = improvement.' } },
                    { type: 'journal', prompt: 'Commit to a weekly practice: either mock interviews, reviewing notes, or evaluating STAR answers. What will you do first?' },
                    { type: 'script', title: '📌 Coach Wrap-Up', content: 'Behavioral interviewing is a craft. Practice + structured evaluation = expertise.' },
                    { type: 'journal', prompt: '🚀 Stretch Activity\n\nSchedule a mock interview with a colleague. Use STAR, probing, and scoring. Write a reflection on your strengths and areas to improve.' }
                ],
                practiceScenario: { persona: 'Candidate', scenario: "This is a practice session for behavioral interviewing. Ask the AI candidate, 'Tell me about a time you had to handle a difficult stakeholder.' Your goal is to get a complete STAR answer, probing effectively for details.", difficulty: 'neutral' }
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
                id: 'l3-1', title: 'Understanding Bias in Interviews', type: 'standard', isCompleted: false,
                steps: [
                    { type: 'script', title: '🎙️ Coach Intro', content: 'Bias is a natural human tendency. In interviews, unconscious bias can distort your judgment, favor some candidates, or disadvantage others. Recognizing bias is the first step to reducing it.' },
                    { type: 'script', title: '📊 Teaching Moment / Analogy', content: 'Think of bias like colored glasses. If you don’t notice the tint, everything you see is slightly skewed. Removing or adjusting those glasses gives a clearer, fairer view.' },
                    { type: 'script', title: '📖 Mini-Case', content: 'A tech company found interviewers favored candidates from their own alma mater. After bias awareness training, interviewers consciously evaluated candidates based on competencies, not backgrounds.' },
                    { type: 'quiz_mcq', question: 'What is unconscious bias?', options: ['Intentional discrimination', 'Automatic, unintentional mental shortcuts', 'Strict adherence to rules', 'Following the STAR method'], correctAnswer: 'Automatic, unintentional mental shortcuts', feedback: { correct: 'Correct! Unconscious biases happen without awareness but still influence decisions.', incorrect: 'The answer is B. Bias is often invisible and automatic, not intentional.' } },
                    { type: 'journal', prompt: 'Recall your last interview. Can you identify any moments where bias may have influenced your judgment?' },
                    { type: 'script', title: '📌 Coach Wrap-Up', content: 'Bias is inevitable, but awareness and structured methods help reduce its impact.' },
                    { type: 'journal', prompt: '🚀 Stretch Activity\n\nWrite down 2 biases you think might affect your interviews and 1 strategy to mitigate each.' }
                ]
            },
            {
                id: 'l3-2', title: 'Common Interview Biases', type: 'standard', isCompleted: false,
                steps: [
                    { type: 'script', title: '🎙️ Coach Intro', content: 'Let’s explore the biases most likely to appear in interviews and how to counter them.' },
                    { type: 'script', title: '📊 Bias Breakdown', content: 'Confirmation Bias\n\nDefinition: Seeking info that confirms your first impression.\nMitigation: Follow a structured question set and score each answer objectively.\n\nHalo/Horn Effect\n\nDefinition: One positive/negative trait dominates your judgment.\nMitigation: Evaluate competencies individually.\n\nSimilarity Bias\n\nDefinition: Favoring candidates with similar backgrounds or interests.\nMitigation: Focus on job-relevant criteria, not personal similarities.\n\nRecency Bias\n\nDefinition: Giving disproportionate weight to the last candidate.\nMitigation: Take notes and review previous candidates before scoring.\n\nAffinity Bias\n\nDefinition: Favoring those who share your opinions or personality.\nMitigation: Use objective metrics and a scoring rubric.' },
                    { type: 'quiz_mcq', question: 'Which bias occurs when one strong trait influences all judgments?', options: ['Confirmation', 'Halo/Horn', 'Recency', 'Similarity'], correctAnswer: 'Halo/Horn', feedback: { correct: 'Correct! The halo/horn effect makes one trait dominate perception.', incorrect: 'The answer is B. Evaluate each competency independently.' } },
                    { type: 'journal', prompt: 'Identify a bias you think is most common in your interviews. How have you unintentionally allowed it to affect your judgment?' },
                    { type: 'script', title: '📌 Coach Wrap-Up', content: 'Recognizing common biases is the first step; applying structured mitigation strategies ensures fairness.' },
                    { type: 'journal', prompt: '🚀 Stretch Activity\n\nPick one bias. Write a short strategy for counteracting it in every interview you conduct this week.' }
                ]
            },
            {
                id: 'l3-3', title: 'Structural Bias Mitigation Techniques', type: 'standard', isCompleted: false,
                steps: [
                    { type: 'script', title: '🎙️ Coach Intro', content: 'Structure is your best defense against bias. The more consistent and objective your process, the less influence bias has.' },
                    { type: 'script', title: '📊 Teaching Moment / Analogy', content: 'Imagine a scale. Bias is like uneven weights. Structured interviews balance the scale.' },
                    { type: 'script', title: '📖 Mini-Case', content: 'A sales organization implemented standard scoring rubrics and identical question sets. After six months, employee diversity and performance metrics improved significantly.' },
                    { type: 'quiz_mcq', question: 'Which is a structural bias mitigation technique?', options: ['Using different questions for each candidate', 'Blind resume reviews', 'Relying on gut feeling', 'Asking personal questions'], correctAnswer: 'Blind resume reviews', feedback: { correct: 'Correct! Blind reviews and structured rubrics reduce bias.', incorrect: 'The answer is B. Objective, standardized methods counter bias effectively.' } },
                    { type: 'journal', prompt: 'Which structural change can you implement immediately to reduce bias in your interviews?' },
                    { type: 'script', title: '📌 Coach Wrap-Up', content: 'Structure = fairness. Standardized questions and scoring rubrics reduce unconscious bias influence.' },
                    { type: 'journal', prompt: '🚀 Stretch Activity\n\nCreate a simple scoring rubric for one of your commonly asked behavioral questions.' }
                ]
            },
            {
                id: 'l3-4', title: 'Real-Time Bias Interruption Techniques', type: 'standard', isCompleted: false,
                steps: [
                    { type: 'script', title: '🎙️ Coach Intro', content: 'Even with structure, bias can creep in. Real-time techniques help you pause and reset during interviews.' },
                    { type: 'script', title: '📊 Techniques', content: 'Self-Check: Ask, ‘Am I favoring this candidate based on irrelevant factors?’\n\nPause & Reflect: Take a 5-second mental pause before scoring.\n\nObjective Notes: Record quotes or behaviors before giving a rating.\n\nUse Comparisons: Evaluate candidates against competency benchmarks, not each other.' },
                    { type: 'script', title: '📖 Mini-Case', content: 'During a panel interview, one interviewer realized they were favoring a candidate with similar hobbies. They paused, reviewed the scoring rubric, and corrected their evaluation.' },
                    { type: 'quiz_mcq', question: 'What is the best immediate action if you notice bias creeping in?', options: ['Ignore it', 'Pause and check the rubric', 'Ask the candidate personal questions', 'Score based on gut feeling'], correctAnswer: 'Pause and check the rubric', feedback: { correct: 'Correct! Pause and review your rubric or notes to counter bias immediately.', incorrect: 'The answer is B. Conscious reflection mitigates bias impact.' } },
                    { type: 'journal', prompt: 'Think of a bias you notice in yourself. How will you pause and interrupt it in future interviews?' },
                    { type: 'script', title: '📌 Coach Wrap-Up', content: 'Bias interruption is about awareness and action — a conscious habit.' },
                    { type: 'journal', prompt: '🚀 Stretch Activity\n\nDuring your next interview, note any moments you consciously applied a bias interruption technique.' }
                ]
            },
            {
                id: 'l3-5', title: 'Continuous Improvement and Accountability', type: 'practice', isCompleted: false,
                steps: [
                    { type: 'script', title: '🎙️ Coach Intro', content: 'Bias awareness isn’t one-off. Continuous improvement and accountability help maintain fair interviewing practices.' },
                    { type: 'script', title: '📊 Strategies', content: 'Peer Review: Regularly review each other’s interview notes.\n\nCalibration Meetings: Compare scores across interviewers and align standards.\n\nFeedback Loops: Incorporate feedback from candidates and hiring teams.\n\nSelf-Reflection Journals: Record and review your interviews to spot patterns.' },
                    { type: 'script', title: '📖 Mini-Case', content: 'A consulting firm implemented quarterly calibration sessions. Interviewers became more aligned, consistent scoring increased, and hiring outcomes improved.' },
                    { type: 'quiz_mcq', question: 'Which action supports continuous bias mitigation?', options: ['Occasional reminders only', 'Peer review and calibration', 'Relying on memory', 'Ignoring feedback'], correctAnswer: 'Peer review and calibration', feedback: { correct: 'Correct! Continuous checks and accountability prevent bias drift.', incorrect: 'The answer is B. Regular calibration and feedback are essential.' } },
                    { type: 'journal', prompt: 'What one accountability mechanism will you implement immediately to track your own bias reduction?' },
                    { type: 'script', title: '📌 Coach Wrap-Up', content: 'Bias mitigation is a journey. Structure, reflection, and peer accountability create lasting fairness.' },
                    { type: 'journal', prompt: '🚀 Stretch Activity\n\nSet up a bi-weekly review with a peer to discuss scoring alignment and bias reflections.' }
                ]
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
                steps: [],
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
            { 
                id: 'l6-3', title: 'Reflection & Growth', type: 'standard', isCompleted: false,
                steps: [{ type: 'journal', prompt: "Write one thing you’ll do differently in your next real-world interview." }]
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
