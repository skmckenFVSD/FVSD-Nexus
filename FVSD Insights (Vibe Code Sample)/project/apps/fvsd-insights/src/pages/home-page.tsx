import { useMemo, useState } from 'react';
import { AssistantFeature, DrilldownTable, ExecutiveSummaryCards, ExecutiveTrendChart, FilterPanel, KpiGrid, PageHeader } from '@/components/analytics-widgets';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { executiveTrend, records, type FilterState, type MetricRecord } from '@/lib/analytics-data';
import { getRoleCopy } from '@/lib/role-content';
import { useDevelopmentRole } from '@/lib/role-context';


export function HomePage() {
  const [selectedSignal, setSelectedSignal] = useState('What requires leadership attention?');
  const { role } = useDevelopmentRole();
  const roleCopy = getRoleCopy(role);
  const [filters, setFilters] = useState<FilterState>({ school: 'All schools', gradeBand: 'All grades', studentGroup: 'All students', period: 'Year to date' });
  const filteredRecords = useMemo(() => records.filter((record: MetricRecord) => (filters.school === 'All schools' || record.school === filters.school) && (filters.studentGroup === 'All students' || record.studentGroup === filters.studentGroup)), [filters]);

  return (
    <div>
      <PageHeader title={roleCopy.homeTitle} description={roleCopy.homeDescription} actions={<Button onClick={() => setSelectedSignal(`${role} assistant briefing`)}>Open {roleCopy.titlePrefix.toLowerCase()} briefing</Button>} />
      <FilterPanel filters={filters} setFilters={setFilters} selectedSignal={selectedSignal} labels={roleCopy.filters} />
      <div className="space-y-3">
        <KpiGrid items={roleCopy.kpis} onSelect={setSelectedSignal} columns="xl:grid-cols-5" />
        <ExecutiveSummaryCards onSelect={setSelectedSignal} />
        <div className="grid gap-3 xl:grid-cols-[1.45fr_0.9fr]">
          <ExecutiveTrendChart data={executiveTrend} onSelect={setSelectedSignal} />
          <div className="grid gap-3">
            <AssistantFeature compact onSelect={setSelectedSignal} prompts={roleCopy.assistantPrompts} intro={roleCopy.assistantIntro} />
            <Card className="border-border bg-card text-card-foreground shadow-sm"><CardContent className="grid gap-2 p-3 text-sm"><div><p className="font-semibold">Decision cadence</p><p className="text-muted-foreground">Use the assistant to convert selected signals into role-specific next steps.</p></div><div><p className="font-semibold">Current recommendation</p><p className="text-muted-foreground">{roleCopy.recommendation}</p></div></CardContent></Card>
          </div>
        </div>
        <DrilldownTable items={filteredRecords} onSelect={setSelectedSignal} title={`${roleCopy.titlePrefix} evidence`} />
      </div>
    </div>
  );
}
