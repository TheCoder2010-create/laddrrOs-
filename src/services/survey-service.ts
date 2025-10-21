
'use client';

import { v4 as uuidv4 } from 'uuid';
import type { DeployedSurvey, SurveyQuestion } from '@/ai/schemas/survey-schemas';

export const SURVEY_KEY = 'org_health_surveys_v1';

const getFromStorage = <T>(key: string): T[] => {
    if (typeof window === 'undefined') return [];
    const json = sessionStorage.getItem(key);
    return json ? JSON.parse(json) : [];
};

const saveToStorage = (key: string, data: any[]): void => {
    if (typeof window === 'undefined') return;
    sessionStorage.setItem(key, JSON.stringify(data));
    window.dispatchEvent(new CustomEvent('feedbackUpdated'));
    window.dispatchEvent(new Event('storage'));
};

/**
 * Deploys a new survey.
 */
export async function deploySurvey(surveyData: { objective: string; questions: SurveyQuestion[] }): Promise<DeployedSurvey> {
    const allSurveys = getFromStorage<DeployedSurvey>(SURVEY_KEY);

    const newSurvey: DeployedSurvey = {
        id: uuidv4(),
        objective: surveyData.objective,
        questions: surveyData.questions,
        deployedAt: new Date().toISOString(),
        status: 'active',
        submissionCount: 0,
        optOutCount: 0,
    };

    allSurveys.unshift(newSurvey);
    saveToStorage(SURVEY_KEY, allSurveys);
    return newSurvey;
}

/**
 * Gets all surveys, both active and closed.
 */
export async function getAllSurveys(): Promise<DeployedSurvey[]> {
    const allSurveys = getFromStorage<DeployedSurvey>(SURVEY_KEY);
    return allSurveys
        .sort((a, b) => new Date(b.deployedAt).getTime() - new Date(a.deployedAt).getTime());
}

/**
 * Gets the most recent active survey.
 */
export async function getLatestActiveSurvey(): Promise<DeployedSurvey | null> {
    const allSurveys = await getAllSurveys();
    return allSurveys.find(s => s.status === 'active') || null;
}

/**
 * Anonymously submits a survey response by incrementing the submission count.
 */
export async function submitSurveyResponse(surveyId: string): Promise<void> {
    const allSurveys = getFromStorage<DeployedSurvey>(SURVEY_KEY);
    const surveyIndex = allSurveys.findIndex(s => s.id === surveyId);
    if (surveyIndex !== -1) {
        allSurveys[surveyIndex].submissionCount++;
        saveToStorage(SURVEY_KEY, allSurveys);
    }
}

/**
 * Logs that a user has opted out of a survey.
 */
export async function logSurveyOptOut(surveyId: string): Promise<void> {
    const allSurveys = getFromStorage<DeployedSurvey>(SURVEY_KEY);
    const surveyIndex = allSurveys.findIndex(s => s.id === surveyId);
    if (surveyIndex !== -1) {
        if (!allSurveys[surveyIndex].optOutCount) {
            allSurveys[surveyIndex].optOutCount = 0;
        }
        allSurveys[surveyIndex].optOutCount++;
        saveToStorage(SURVEY_KEY, allSurveys);
    }
}


/**
 * Closes an active survey.
 */
export async function closeSurvey(surveyId: string): Promise<void> {
    const allSurveys = getFromStorage<DeployedSurvey>(SURVEY_KEY);
    const surveyIndex = allSurveys.findIndex(s => s.id === surveyId);
    if (surveyIndex !== -1 && allSurveys[surveyIndex].status === 'active') {
        allSurveys[surveyIndex].status = 'closed';
        saveToStorage(SURVEY_KEY, allSurveys);
    }
}
