import { useState } from 'react';
import { AchievementDistributionChart, DrilldownTable, FilterPanel, InterventionCohortTable, KpiGrid, PageHeader, StudentGroupAnalysisChart } from '@/components/analytics-widgets';
import { Button } from '@/components/ui/button';
import { type FilterState } from '@/lib/analytics-data';
import { getPageRoleCopy, getRoleCopy, getRoleKpis } from '@/lib/role-content';
import { useDevelopmentRole } from '@/lib/role-context';


export function StudentSuccessPage() {
  const [selectedSignal, setSelectedSignal] = useState('Which learners need support?');
  const [filters, setFilters] = useState<FilterState>({ school: 'All schools', gradeBand: 'All grades', studentGroup: 'All students', period: 'Year to date' });
  const { role } = useDevelopmentRole();
  const roleCopy = getRoleCopy(role);
  const pageCopy = getPageRoleCopy(role, 'student');

  return (
    <div>
      <PageHeader title={pageCopy.title} description={pageCopy.description} actions={<Button onClick={() => setSelectedSignal(`${role} learner support brief`)}>{pageCopy.action}</Button>} />
      <FilterPanel filters={filters} setFilters={setFilters} selectedSignal={selectedSignal} labels={roleCopy.filters} />
      <div className="space-y-3">
        <KpiGrid items={getRoleKpis(role, 'student')} onSelect={setSelectedSignal} />
        <div className="grid gap-3 xl:grid-cols-[1.25fr_0.8fr]">
          <StudentGroupAnalysisChart onSelect={setSelectedSignal} />
          <AchievementDistributionChart onSelect={setSelectedSignal} />
        </div>
        <div className="grid gap-3 xl:grid-cols-[0.95fr_1.15fr]">
          <InterventionCohortTable onSelect={setSelectedSignal} />
          <DrilldownTable onSelect={setSelectedSignal} title={`${roleCopy.titlePrefix} learner evidence`} />
        </div>
      </div>
    </div>
  );
}
