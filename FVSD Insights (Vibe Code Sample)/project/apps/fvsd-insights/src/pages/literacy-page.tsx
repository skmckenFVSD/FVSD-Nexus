import { useState } from 'react';
import { DrilldownTable, FilterPanel, KpiGrid, LiteracyBenchmarkChart, LiteracySkillGapChart, PageHeader } from '@/components/analytics-widgets';
import { applyFilters, records, type FilterState, type MetricRecord } from '@/lib/analytics-data';
import { getRoleCopy, getRoleKpis } from '@/lib/role-content';
import { useDevelopmentRole } from '@/lib/role-context';


const getLiteracyTitle = (role: string) => {
  if (role === 'Teacher') return 'Classroom Literacy Planning';
  if (role === 'Class Room Support') return 'Support Literacy Monitoring';
  if (role === 'School Administration') return 'School Literacy Intervention';
  if (role === 'Data Analyst (Administrator)') return 'Literacy Data Coverage';
  return 'District Literacy Outcomes';
};

const getLiteracyDescription = (role: string) => {
  if (role === 'Teacher') return 'What literacy outcomes require classroom intervention? Review skill gaps, benchmark movement, and next instructional groups.';
  if (role === 'Class Room Support') return 'What literacy outcomes require support intervention? Review monitored learners, referral evidence, and active literacy supports.';
  if (role === 'School Administration') return 'What literacy outcomes require school intervention? Review benchmark movement, grade-team needs, and targeted response evidence.';
  if (role === 'Data Analyst (Administrator)') return 'Which literacy datasets require validation? Review benchmark coverage, skill-domain completeness, and source readiness.';
  return 'What literacy outcomes require district intervention? Review benchmark movement, skill gaps, and board-ready evidence.';
};

export function LiteracyPage() {
  const [filters, setFilters] = useState<FilterState>({ school: 'All schools', gradeBand: 'All grades', studentGroup: 'All students', period: 'Term 2' });
  const { role } = useDevelopmentRole();
  const roleCopy = getRoleCopy(role);
  const [selectedSignal, setSelectedSignal] = useState('What literacy outcomes require intervention?');
  const filteredRecords = applyFilters(records, filters).filter((record: MetricRecord) => record.metric.includes('Literacy'));

  return (
    <div>
      <PageHeader title={getLiteracyTitle(role)} description={getLiteracyDescription(role)} />
      <FilterPanel filters={filters} setFilters={setFilters} selectedSignal={selectedSignal} labels={roleCopy.filters} />
      <div className="space-y-3">
        <KpiGrid items={getRoleKpis(role, 'literacy')} onSelect={setSelectedSignal} />
        <div className="grid gap-3 xl:grid-cols-2"><LiteracyBenchmarkChart onSelect={setSelectedSignal} /><LiteracySkillGapChart onSelect={setSelectedSignal} /></div>
        <DrilldownTable items={filteredRecords} onSelect={setSelectedSignal} title={`${roleCopy.titlePrefix} literacy evidence`} />
      </div>
    </div>
  );
}
