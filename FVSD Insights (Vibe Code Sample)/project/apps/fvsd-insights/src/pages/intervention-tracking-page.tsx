import { useState } from 'react';
import { DrilldownTable, FilterPanel, InterventionCohortTable, InterventionResultsChart, KpiGrid, PageHeader } from '@/components/analytics-widgets';
import { applyFilters, records, type FilterState, type MetricRecord } from '@/lib/analytics-data';
import { getRoleCopy, getRoleKpis } from '@/lib/role-content';
import { useDevelopmentRole } from '@/lib/role-context';


const getInterventionTitle = (role: string) => {
  if (role === 'Teacher') return 'Classroom Intervention Response';
  if (role === 'Class Room Support') return 'Referral and Support Tracking';
  if (role === 'School Administration') return 'School Intervention Tracking';
  if (role === 'Data Analyst (Administrator)') return 'Intervention Data Administration';
  return 'District Intervention Results';
};

const getInterventionDescription = (role: string) => {
  if (role === 'Teacher') return 'Which classroom interventions are producing results? Compare small-group growth, fidelity, and next instructional actions.';
  if (role === 'Class Room Support') return 'Which active supports require action? Monitor referrals, intervention response, and student support follow-up.';
  if (role === 'School Administration') return 'Which school interventions are producing results? Compare cohort growth, completion, fidelity, and support plan evidence.';
  if (role === 'Data Analyst (Administrator)') return 'Which intervention datasets and referral workflows require validation across schools, users, and filters?';
  return 'Which interventions are producing district results? Compare growth, completion, fidelity, and strategic-priority evidence.';
};

export function InterventionTrackingPage() {
  const [filters, setFilters] = useState<FilterState>({ school: 'All schools', gradeBand: 'All grades', studentGroup: 'All students', period: 'Current month' });
  const { role } = useDevelopmentRole();
  const roleCopy = getRoleCopy(role);
  const [selectedSignal, setSelectedSignal] = useState('Which interventions are producing results?');
  const filteredRecords = applyFilters(records, filters).filter((record: MetricRecord) => record.metric.includes('Referral') || record.metric.includes('Intervention') || record.metric.includes('Literacy'));

  return (
    <div>
      <PageHeader title={getInterventionTitle(role)} description={getInterventionDescription(role)} />
      <FilterPanel filters={filters} setFilters={setFilters} selectedSignal={selectedSignal} labels={roleCopy.filters} />
      <div className="space-y-3">
        <KpiGrid items={getRoleKpis(role, 'intervention')} onSelect={setSelectedSignal} />
        <div className="grid gap-3 xl:grid-cols-[1fr_1fr]"><InterventionResultsChart onSelect={setSelectedSignal} /><InterventionCohortTable onSelect={setSelectedSignal} /></div>
        <DrilldownTable items={filteredRecords} onSelect={setSelectedSignal} title={`${roleCopy.titlePrefix} intervention evidence`} />
      </div>
    </div>
  );
}
