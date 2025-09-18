
"use client"
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from './use-toast';
import { getIccMembers } from '@/services/admin-service';

export type Role = 'Manager' | 'Team Lead' | 'AM' | 'Employee' | 'HR Head' | 'Anonymous' | 'ICC Head' | 'ICC Member';

export const availableRoles: Role[] = ['Employee', 'Team Lead', 'AM', 'Manager', 'HR Head', 'ICC Head', 'ICC Member'];
export const availableRolesForAssignment: Role[] = ['Manager', 'Team Lead', 'AM'];

const ROLE_STORAGE_KEY = 'accountability-os-role';

export const useRole = () => {
    const [role, setRole] = useState<Role | null>(null);
    const [isIccMember, setIsIccMember] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();
    const { toast } = useToast();

    const checkIccMembership = useCallback(async (currentRole: Role | null) => {
        if (!currentRole) {
            setIsIccMember(false);
            return;
        }
        try {
            const iccMembers = await getIccMembers();
            // A user is an ICC member if their specific role is in the list, OR if they are the ICC Head/Member role itself.
            setIsIccMember(iccMembers.includes(currentRole) || currentRole === 'ICC Head' || currentRole === 'ICC Member');
        } catch (error) {
            console.error("Failed to check ICC membership", error);
            setIsIccMember(false);
        }
    }, []);

    useEffect(() => {
        const initializeRole = async () => {
            try {
                const storedRole = localStorage.getItem(ROLE_STORAGE_KEY) as Role;
                if (storedRole && [...availableRoles].includes(storedRole)) {
                    setRole(storedRole);
                    await checkIccMembership(storedRole);
                }
            } catch (error) {
                console.error("Could not read role from localStorage", error);
            } finally {
                setIsLoading(false);
            }
        };
        initializeRole();
    }, [checkIccMembership]);

    const setCurrentRole = useCallback(async (newRole: Role | null) => {
        setRole(newRole);
        await checkIccMembership(newRole);
        
        try {
            if (newRole) {
                localStorage.setItem(ROLE_STORAGE_KEY, newRole);
            } else {
                localStorage.removeItem(ROLE_STORAGE_KEY);
            }
        } catch (error) {
            console.error("Could not write role to localStorage", error);
        }
    }, [checkIccMembership]);

    return { role, setRole: setCurrentRole, isLoading, isIccMember, availableRoles: availableRoles, toast };
};
