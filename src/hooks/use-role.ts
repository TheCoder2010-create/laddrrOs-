
"use client"
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

export type Role = 'Manager' | 'Team Lead' | 'Employee' | 'HR Head' | 'Voice – In Silence';

export const availableRoles: Role[] = ['Employee', 'Team Lead', 'Manager', 'HR Head'];

const ROLE_STORAGE_KEY = 'accountability-os-role';

export const useRole = () => {
    const [role, setRole] = useState<Role | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        // This effect runs once on mount to restore the role from localStorage
        try {
            const storedRole = localStorage.getItem(ROLE_STORAGE_KEY) as Role;
            if (storedRole && availableRoles.includes(storedRole)) {
                setRole(storedRole);
            }
        } catch (error) {
            console.error("Could not read role from localStorage", error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const setCurrentRole = useCallback((newRole: Role | null) => {
        if (newRole === 'Voice – In Silence') {
            // We need to ensure the user is "logged out" before navigating to the anonymous page.
            localStorage.removeItem(ROLE_STORAGE_KEY);
            setRole(null);
            router.push('/voice-in-silence/submit');
            return;
        }

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
    }, [router]);

    // We add 'Voice – In Silence' separately for the selection screen
    const allAvailableRoles: Role[] = [...availableRoles, 'Voice – In Silence'];

    return { role, setRole: setCurrentRole, isLoading, availableRoles: allAvailableRoles };
};
