"use client"
import { useState, useEffect, useCallback } from 'react';

export type Role = 'Manager' | 'Team Lead' | 'Individual Contributor' | 'Auditor';

export const availableRoles: Role[] = ['Manager', 'Team Lead', 'Individual Contributor', 'Auditor'];

export const useRole = () => {
    const [role, setRole] = useState<Role | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        try {
            const storedRole = localStorage.getItem('accountability-os-role') as Role;
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
        setRole(newRole);
        try {
            if (newRole) {
                localStorage.setItem('accountability-os-role', newRole);
            } else {
                localStorage.removeItem('accountability-os-role');
            }
        } catch (error) {
            console.error("Could not write role to localStorage", error);
        }
    }, []);

    return { role, setRole: setCurrentRole, isLoading, availableRoles };
};
