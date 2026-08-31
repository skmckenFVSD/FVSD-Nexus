import { NavLink, Outlet } from 'react-router-dom';
import { Bot, BookOpenText, CalendarDays, Database, GraduationCap, Home, LifeBuoy, School, Settings, ShieldCheck } from 'lucide-react';
import { FVSDLogo } from '@/components/fvsd-logo';
import { developmentRoles, useDevelopmentRole, type DevelopmentRole } from '@/lib/role-context';
import { cn } from '@/lib/utils';

const getOverviewLabel = (role: DevelopmentRole) => {
  if (role === 'School Administration') {
    return 'School Overview';
  }

  if (role === 'Teacher') {
    return 'Classroom Overview';
  }
  if (role === 'Class Room Support') {
    return 'Support Overview';
  }
  if (role === 'Data Analyst (Administrator)') {
    return 'Admin Overview';
  }
  return 'Executive Overview';
};

type NavItem = {
  to: string;
  label: string;
  icon: typeof Home;
  hiddenForRoles: DevelopmentRole[];
};

const navItems: NavItem[] = [
  { to: '/', label: 'Overview', icon: Home, hiddenForRoles: [] },
  { to: '/school-profile', label: 'School Profile', icon: School, hiddenForRoles: ['Teacher', 'Class Room Support'] },
  { to: '/student-success', label: 'Student Success', icon: GraduationCap, hiddenForRoles: [] },
  { to: '/attendance', label: 'Attendance', icon: CalendarDays, hiddenForRoles: [] },
  { to: '/literacy', label: 'Literacy', icon: BookOpenText, hiddenForRoles: [] },
  { to: '/intervention-tracking', label: 'Intervention Tracking', icon: LifeBuoy, hiddenForRoles: [] },
  { to: '/analytics-assistant', label: 'Analytics Assistant', icon: Bot, hiddenForRoles: [] },
  { to: '/data-quality', label: 'Data Quality', icon: Database, hiddenForRoles: ['Executive', 'School Administration', 'Teacher', 'Class Room Support'] },
  { to: '/data-administration', label: 'Data Administration', icon: ShieldCheck, hiddenForRoles: ['Executive', 'School Administration', 'Teacher', 'Class Room Support'] },
  { to: '/settings', label: 'Settings', icon: Settings, hiddenForRoles: [] },
];


export function AnalyticsShell() {
  const { role, setRole, canSwitchRole } = useDevelopmentRole();
  return (
    <div className="min-h-screen bg-background text-foreground lg:grid lg:grid-cols-[264px_1fr]">
      <aside className="bg-sidebar text-sidebar-foreground border-sidebar-border lg:sticky lg:top-0 lg:h-screen lg:border-r">
        <div className="flex h-full flex-col gap-4 p-3">
          <div className="rounded-xl border border-sidebar-border bg-sidebar-accent p-2.5 text-sidebar-accent-foreground shadow-sm">
            <div className="flex min-w-0 items-center gap-2.5">
              <FVSDLogo />
              <div className="min-w-0">
                <p className="truncate text-base font-semibold tracking-tight">FVSD Insights</p>
                <p className="truncate text-xs font-medium">Leadership analytics portal</p>
              </div>
            </div>
          </div>
          <nav className="grid gap-1">
            {navItems
              .filter((item: NavItem) => !item.hiddenForRoles.includes(role))
              .map(({ to, label, icon: Icon }: NavItem) => {
                const displayLabel = to === '/' ? getOverviewLabel(role) : role === 'Teacher' && to === '/student-success' ? 'Learner Progress' : role === 'Class Room Support' && to === '/student-success' ? 'Support Monitoring' : role === 'Data Analyst (Administrator)' && to === '/student-success' ? 'Dataset Coverage' : label;

                return (
                  <NavLink
                    key={to}
                    to={to}
                    end={to === '/'}
                    className={({ isActive }: { isActive: boolean }) =>
                      cn(
                        'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                        isActive ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-sm' : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                      )
                    }
                  >
                    <Icon className="h-4 w-4" />
                    <span>{displayLabel}</span>
                  </NavLink>
                );
              })}
          </nav>
          {canSwitchRole ? (
            <div className="mt-auto rounded-xl border border-sidebar-border bg-sidebar-accent p-3 text-sidebar-accent-foreground">
              <p className="text-xs font-semibold uppercase tracking-wide">Development role</p>
              <div className="mt-2 grid gap-1">
                {developmentRoles.map((item: DevelopmentRole) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setRole(item)}
                    className={cn(
                      'rounded-md px-2 py-1.5 text-left text-xs font-semibold transition-colors',
                      role === item ? 'bg-sidebar-primary text-sidebar-primary-foreground' : 'hover:bg-sidebar hover:text-sidebar-foreground',
                    )}
                  >
                    {item}
                  </button>
                ))}
              </div>


            </div>
          ) : null}

        </div>
      </aside>
      <main className="min-w-0 p-4 lg:p-5">
        <Outlet />
      </main>
    </div>
  );
}
