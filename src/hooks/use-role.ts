
"use client"
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

export type Role = 'Manager' | 'Team Lead' | 'Employee' | 'HR Head' | 'Voice – In Silence';

export const availableRoles: Role[] = ['Employee', 'Team Lead', 'Manager', 'HR Head', 'Voice – In Silence'];

const DATA_REFRESH_KEY = 'data-refresh-key';

export const useRole = () => {
    const [role, setRole] = useState<Role | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshKey, setRefreshKey] = useState(Date.now());
    const router = useRouter();

    useEffect(() => {
        try {
            const storedRole = localStorage.getItem('accountability-os-role') as Role;
            if (storedRole && availableRoles.includes(storedRole) && storedRole !== 'Voice – In Silence') {
                setRole(storedRole);
            }
        } catch (error) {
            console.error("Could not read role from localStorage", error);
        } finally {
            setIsLoading(false);
        }
        
        // Listen for storage changes to trigger refresh
        const handleStorageChange = (event: StorageEvent) => {
            if (event.key === DATA_REFRESH_KEY) {
                setRefreshKey(Date.now());
            }
        };

        window.addEventListener('storage', handleStorageChange);
        return () => {
            window.removeEventListener('storage', handleStorageChange);
        };

    }, []);

    const setCurrentRole = useCallback((newRole: Role | null) => {
        if (newRole === 'Voice – In Silence') {
            router.push('/voice-in-silence/submit');
            return;
        }

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
    }, [router]);

    return { role, setRole: setCurrentRole, isLoading, availableRoles, refreshKey };
};
