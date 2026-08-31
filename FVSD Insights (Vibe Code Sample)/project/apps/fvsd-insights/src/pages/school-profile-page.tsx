import { useState } from 'react';
import { DistrictMapPlaceholder, DrilldownTable, FilterPanel, PageHeader, SchoolComparisonChart, SchoolComparisonTable } from '@/components/analytics-widgets';
import { Button } from '@/components/ui/button';
import { type FilterState } from '@/lib/analytics-data';
import { getPageRoleCopy, getRoleCopy } from '@/lib/role-content';
import { useDevelopmentRole } from '@/lib/role-context';


export function SchoolProfilePage() {
  const [selectedSignal, setSelectedSignal] = useState('How do schools compare?');
  const [filters, setFilters] = useState<FilterState>({ school: 'All schools', gradeBand: 'All grades', studentGroup: 'All students', period: 'Year to date' });
  const { role } = useDevelopmentRole();
  const roleCopy = getRoleCopy(role);
  const pageCopy = getPageRoleCopy(role, 'school');

  return (
    <div>
      <PageHeader title={pageCopy.title} description={pageCopy.description} actions={<Button variant="outline" onClick={() => setSelectedSignal(`${role} school comparison view`)}>{pageCopy.action}</Button>} />
      <FilterPanel filters={filters} setFilters={setFilters} selectedSignal={selectedSignal} labels={roleCopy.filters} />
      <div className="grid gap-3 xl:grid-cols-[1.45fr_0.85fr]">
        <SchoolComparisonTable onSelect={setSelectedSignal} />
        <DistrictMapPlaceholder />
      </div>
      <div className="mt-3 grid gap-3 xl:grid-cols-[0.95fr_1.25fr]">
        <SchoolComparisonChart onSelect={setSelectedSignal} />
        <DrilldownTable onSelect={setSelectedSignal} title={`${roleCopy.titlePrefix} comparison evidence`} />
      </div>
    </div>
  );
}
