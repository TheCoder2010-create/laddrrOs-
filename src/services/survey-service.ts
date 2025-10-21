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
    };

    allSurveys.unshift(newSurvey);
    saveToStorage(SURVEY_KEY, allSurveys);
    return newSurvey;
}

/**
 * Gets all currently active surveys.
 */
export async function getActiveSurveys(): Promise<DeployedSurvey[]> {
    const allSurveys = getFromStorage<DeployedSurvey>(SURVEY_KEY);
    return allSurveys
        .filter(s => s.status === 'active')
        .sort((a, b) => new Date(b.deployedAt).getTime() - new Date(a.deployedAt).getTime());
}
