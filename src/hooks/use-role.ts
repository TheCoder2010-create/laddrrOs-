
"use client"
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

export type Role = 'Manager' | 'Team Lead' | 'AM' | 'Employee' | 'HR Head' | 'Voice – In Silence' | 'Anonymous';

export const availableRoles: Role[] = ['Employee', 'Team Lead', 'AM', 'Manager', 'HR Head'];
export const availableRolesForAssignment: Role[] = ['Manager', 'Team Lead', 'AM'];

const ROLE_STORAGE_KEY = 'accountability-os-role';

export const useRole = () => {
    const [role, setRole] = useState<Role | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        try {
            const storedRole = localStorage.getItem(ROLE_STORAGE_KEY) as Role;
            if (storedRole && [...availableRoles, 'Voice – In Silence'].includes(storedRole)) {
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
            localStorage.removeItem(ROLE_STORAGE_KEY);
            setRole(newRole);
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

    