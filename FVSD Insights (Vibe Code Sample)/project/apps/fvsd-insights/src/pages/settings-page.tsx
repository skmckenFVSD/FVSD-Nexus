import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { FilterPanel, PageHeader } from '@/components/analytics-widgets';
import { type FilterState } from '@/lib/analytics-data';
import { getRoleCopy } from '@/lib/role-content';
import { useDevelopmentRole } from '@/lib/role-context';


export function SettingsPage() {
  const [filters, setFilters] = useState<FilterState>({ school: 'All schools', gradeBand: 'All grades', studentGroup: 'All students', period: 'Year to date' });
  const { role } = useDevelopmentRole();
  const roleCopy = getRoleCopy(role);
  return (
    <div>
      <PageHeader title={`${roleCopy.titlePrefix} Settings`} description={`Configure ${role.toLowerCase()} prototype preferences, role-aware dashboard defaults, and analytics meeting display behaviour.`} />
      <FilterPanel filters={filters} setFilters={setFilters} selectedSignal={`${role} dashboard preferences`} labels={roleCopy.filters} />
      <div className="grid gap-4 xl:grid-cols-3">
        {['Show benchmark targets', 'Enable dense meeting view', `Highlight ${roleCopy.titlePrefix.toLowerCase()} priorities`, 'Display assistant on home', 'Use tablet optimized spacing', 'Show phase 2 scope notes'].map((setting: string) => (
          <Card key={setting} className="bg-card text-card-foreground"><CardHeader><CardTitle className="text-base">{setting}</CardTitle></CardHeader><CardContent className="flex items-center justify-between"><p className="text-sm text-muted-foreground">{role} prototype preference</p><Switch defaultChecked /></CardContent></Card>
        ))}
      </div>
    </div>
  );
}
