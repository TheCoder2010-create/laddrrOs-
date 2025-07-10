
"use client"
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

export type Role = 'Manager' | 'Team Lead' | 'Employee' | 'HR Head' | 'Voice – In Silence';

export const availableRoles: Role[] = ['Employee', 'Team Lead', 'Manager', 'HR Head', 'Voice – In Silence'];

const ROLE_STORAGE_KEY = 'accountability-os-role';
const DATA_REFRESH_KEY = 'data-refresh-key';

export const useRole = () => {
    const [role, setRole] = useState<Role | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshKey, setRefreshKey] = useState(Date.now());
    const router = useRouter();

    useEffect(() => {
        // Initial check for the role on component mount
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
        
        // This listener reacts to changes in other tabs/windows.
        const handleStorageChange = (event: StorageEvent) => {
            if (event.key === DATA_REFRESH_KEY && event.newValue) {
                console.log('Data refresh key changed, forcing update.');
                setRefreshKey(parseInt(event.newValue, 10));
            }
             if (event.key === ROLE_STORAGE_KEY) {
                const newRole = event.newValue as Role | null;
                 if (newRole && availableRoles.includes(newRole)) {
                    setRole(newRole);
                } else if (!newRole) {
                    setRole(null);
                }
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
                localStorage.setItem(ROLE_STORAGE_KEY, newRole);
            } else {
                localStorage.removeItem(ROLE_STORAGE_KEY);
            }
        } catch (error) {
            console.error("Could not write role to localStorage", error);
        }
    }, [router]);

    return { role, setRole: setCurrentRole, isLoading, availableRoles, refreshKey };
};
