import { useState } from 'react';
import { AttendanceRiskChart, AttendanceSegmentDonut, DrilldownTable, FilterPanel, KpiGrid, PageHeader } from '@/components/analytics-widgets';
import { applyFilters, records, type FilterState, type MetricRecord } from '@/lib/analytics-data';
import { getPageRoleCopy, getRoleCopy, getRoleKpis } from '@/lib/role-content';
import { useDevelopmentRole } from '@/lib/role-context';


export function AttendancePage() {
  const [filters, setFilters] = useState<FilterState>({ school: 'All schools', gradeBand: 'All grades', studentGroup: 'All students', period: 'Current month' });
  const [selectedSignal, setSelectedSignal] = useState('Where are attendance risks emerging?');
  const { role } = useDevelopmentRole();
  const roleCopy = getRoleCopy(role);
  const pageCopy = getPageRoleCopy(role, 'attendance');
  const filteredRecords = applyFilters(records, filters).filter((record: MetricRecord) => record.metric.includes('Attendance') || record.metric.includes('Absence'));

  return (
    <div>
      <PageHeader title={pageCopy.title} description={pageCopy.description} />
      <FilterPanel filters={filters} setFilters={setFilters} selectedSignal={selectedSignal} labels={roleCopy.filters} />
      <div className="space-y-3">
        <KpiGrid items={getRoleKpis(role, 'attendance')} onSelect={setSelectedSignal} />
        <div className="grid gap-3 xl:grid-cols-[1.2fr_0.8fr]"><AttendanceRiskChart onSelect={setSelectedSignal} /><AttendanceSegmentDonut onSelect={setSelectedSignal} /></div>
        <DrilldownTable items={filteredRecords} onSelect={setSelectedSignal} title={`${roleCopy.titlePrefix} attendance evidence`} />
      </div>
    </div>
  );
}
