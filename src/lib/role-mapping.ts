
import type { Role } from '@/hooks/use-role';

export const roleUserMapping: Record<Role, { name: string; fallback: string; imageHint: string, role: Role }> = {
  'Manager': { name: 'Alex Smith', fallback: 'AS', imageHint: 'manager', role: 'Manager' },
  'Team Lead': { name: 'Ben Carter', fallback: 'BC', imageHint: 'leader', role: 'Team Lead' },
  'AM': { name: 'Ashley Miles', fallback: 'AM', imageHint: 'assistant manager', role: 'AM' },
  'Employee': { name: 'Casey Day', fallback: 'CD', imageHint: 'employee', role: 'Employee' },
  'HR Head': { name: 'Dana Evans', fallback: 'DE', imageHint: 'hr head', role: 'HR Head' },
  'Voice – In Silence': { name: 'Anonymous', fallback: '??', imageHint: 'anonymous person', role: 'Voice – In Silence' }
};

export const getRoleByName = (name: string): Role | undefined => {
    for (const key in roleUserMapping) {
        if (roleUserMapping[key as Role].name === name) {
            return key as Role;
        }
    }
    return undefined;
}
