import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import { useUser } from '@/hooks/use-user';

export type DevelopmentRole = 'Executive' | 'School Administration' | 'Teacher' | 'Class Room Support' | 'Data Analyst (Administrator)';
export const developmentRoles: DevelopmentRole[] = ['Executive', 'School Administration', 'Teacher', 'Class Room Support', 'Data Analyst (Administrator)'];

const ROLE_SWITCHER_EMAIL = 'scottm@fvsd.ab.ca';

type RoleContextValue = {
  role: DevelopmentRole;
  setRole: (role: DevelopmentRole) => void;
  canSwitchRole: boolean;
  roleFocus: string;
};

const roleFocusMap: Record<DevelopmentRole, string> = {
  Executive: 'District leadership, board reporting, school comparison, and strategic priorities',
  'School Administration': 'School improvement, student support, and team action planning',
  Teacher: 'Classroom instruction, learner progress, group planning, and intervention recommendations',
  'Class Room Support': 'Support planning, active interventions, referral management, and student monitoring',
  'Data Analyst (Administrator)': 'Full visibility across schools, users, pages, filters, quality, and administration',
};

const RoleContext = createContext<RoleContextValue | undefined>(undefined);

export function RoleProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<DevelopmentRole>('Executive');
  const { data: user } = useUser();
  const userEmail = user?.userPrincipalName?.toLowerCase() ?? '';
  const canSwitchRole = userEmail === ROLE_SWITCHER_EMAIL;

  const value = useMemo<RoleContextValue>(() => ({
    role,
    setRole,
    canSwitchRole,
    roleFocus: roleFocusMap[role],
  }), [canSwitchRole, role]);

  return <RoleContext.Provider value={value}>{children}</RoleContext.Provider>;
}

export function useDevelopmentRole() {
  const context = useContext(RoleContext);
  if (!context) {
    throw new Error('useDevelopmentRole must be used within RoleProvider');
  }
  return context;
}
