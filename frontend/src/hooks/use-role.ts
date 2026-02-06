"use client"
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from './use-toast';
import { getLatestActiveSurvey } from '@/services/survey-service';
import { type Role, availableRoles, availableRolesForAssignment } from '@common/types/role';

const ROLE_STORAGE_KEY = 'accountability-os-role';
const ACTIVE_SURVEY_KEY = 'active_survey_exists';

export type { Role };
// This is being removed to prevent confusing re-exports.
// Components should import these directly from @common/types/role.
// export { availableRoles, availableRolesForAssignment };

export const useRole = () => {
    const [role, setRole] = useState<Role | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [activeSurveyExists, setActiveSurveyExists] = useState(true); // Always show the survey option
    const router = useRouter();
    const { toast } = useToast();

    useEffect(() => {
        const initializeRole = async () => {
            try {
                const storedRole = localStorage.getItem(ROLE_STORAGE_KEY) as Role;
                if (storedRole && [...availableRoles].includes(storedRole)) {
                    setRole(storedRole);
                }
                // The survey button is now always active, so we don't need to check session storage for its visibility.
            } catch (error) {
                console.error("Could not read from storage", error);
            } finally {
                setIsLoading(false);
            }
        };
        initializeRole();
    }, []);

    const setCurrentRole = useCallback(async (newRole: Role | null) => {
        setRole(newRole);
        
        try {
            if (newRole) {
                localStorage.setItem(ROLE_STORAGE_KEY, newRole);
            } else {
                localStorage.removeItem(ROLE_STORAGE_KEY);
            }
        } catch (error) {
            console.error("Could not write role to localStorage", error);
        }
    }, []);

    return { role, setRole: setCurrentRole, isLoading, availableRoles, availableRolesForAssignment, activeSurveyExists, toast };
};
