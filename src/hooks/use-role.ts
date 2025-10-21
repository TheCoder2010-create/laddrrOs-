
"use client"
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from './use-toast';

export type Role = 'Manager' | 'Team Lead' | 'AM' | 'Employee' | 'HR Head' | 'Anonymous';

export const availableRoles: Role[] = ['Employee', 'Team Lead', 'AM', 'Manager', 'HR Head'];
export const availableRolesForAssignment: Role[] = ['AM', 'Manager', 'HR Head'];

const ROLE_STORAGE_KEY = 'accountability-os-role';
const ACTIVE_SURVEY_KEY = 'active_survey_exists';

export const useRole = () => {
    const [role, setRole] = useState<Role | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [activeSurveyExists, setActiveSurveyExists] = useState(false);
    const router = useRouter();
    const { toast } = useToast();

    useEffect(() => {
        const initializeRole = async () => {
            try {
                const storedRole = localStorage.getItem(ROLE_STORAGE_KEY) as Role;
                if (storedRole && [...availableRoles].includes(storedRole)) {
                    setRole(storedRole);
                }
                const surveyStatus = sessionStorage.getItem(ACTIVE_SURVEY_KEY);
                setActiveSurveyExists(surveyStatus === 'true');
            } catch (error) {
                console.error("Could not read from storage", error);
            } finally {
                setIsLoading(false);
            }
        };
        initializeRole();

        const handleStorageChange = () => {
            const surveyStatus = sessionStorage.getItem(ACTIVE_SURVEY_KEY);
            setActiveSurveyExists(surveyStatus === 'true');
        };

        window.addEventListener('storage', handleStorageChange);
        window.addEventListener('feedbackUpdated', handleStorageChange); // Using existing event for simplicity

        return () => {
            window.removeEventListener('storage', handleStorageChange);
            window.removeEventListener('feedbackUpdated', handleStorageChange);
        };
    }, []);

    const setCurrentRole = useCallback(async (newRole: Role | null) => {
        setRole(newRole);
        
        try {
            if (newRole) {
                localStorage.setItem(ROLE_STORAGE_KEY, newRole);
                 if (newRole !== 'HR Head') {
                    // If a non-HR user logs in, assume they might need to see the survey again
                    // This logic might be adjusted based on real product requirements
                }
            } else {
                localStorage.removeItem(ROLE_STORAGE_KEY);
                // When logging out, also clear the active survey flag from sessionStorage for a clean state
                sessionStorage.removeItem(ACTIVE_SURVEY_KEY);
                setActiveSurveyExists(false);
            }
        } catch (error) {
            console.error("Could not write role to localStorage", error);
        }
    }, []);

    return { role, setRole: setCurrentRole, isLoading, availableRoles, activeSurveyExists, toast };
};
