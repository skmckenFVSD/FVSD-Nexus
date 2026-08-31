import { useState } from 'react';
import { AssistantAnalysisCards, AssistantFeature, AssistantWorkspace, DrilldownTable, FilterPanel, PageHeader } from '@/components/analytics-widgets';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { type FilterState } from '@/lib/analytics-data';
import { getPageRoleCopy, getRoleCopy } from '@/lib/role-content';
import { useDevelopmentRole } from '@/lib/role-context';


export function AnalyticsAssistantPage() {
  const [selectedSignal, setSelectedSignal] = useState('Help leadership understand and act on performance information.');
  const [filters, setFilters] = useState<FilterState>({ school: 'All schools', gradeBand: 'All grades', studentGroup: 'All students', period: 'Year to date' });
  const { role } = useDevelopmentRole();
  const roleCopy = getRoleCopy(role);
  const pageCopy = getPageRoleCopy(role, 'assistant');

  return (
    <div>
      <PageHeader title={pageCopy.title} description={pageCopy.description} actions={<Button onClick={() => setSelectedSignal(`${role} assistant generated briefing`)}>{pageCopy.action}</Button>} />
      <FilterPanel filters={filters} setFilters={setFilters} selectedSignal={selectedSignal} labels={roleCopy.filters} />
      <div className="space-y-3">
        <div className="grid gap-3 xl:grid-cols-[1.25fr_0.75fr]">
          <AssistantWorkspace onSelect={setSelectedSignal} prompts={roleCopy.assistantPrompts} suggestedQuestion={roleCopy.assistantPrompts[0]} />
          <AssistantFeature onSelect={setSelectedSignal} prompts={roleCopy.assistantPrompts} intro={roleCopy.assistantIntro} />
        </div>
        <div className="grid gap-3 xl:grid-cols-[1.1fr_0.9fr]">
          <AssistantAnalysisCards onSelect={setSelectedSignal} />
          <Card className="bg-card text-card-foreground shadow-sm"><CardHeader className="px-4 py-3"><CardTitle>Context captured from filters</CardTitle></CardHeader><CardContent className="grid gap-2 px-4 pb-3 text-sm"><p><span className="font-semibold">Role:</span> {role}</p><p><span className="font-semibold">{roleCopy.filters[0]}:</span> {filters.school}</p><p><span className="font-semibold">{roleCopy.filters[1]}:</span> {filters.gradeBand}</p><p><span className="font-semibold">Recommendation:</span> {roleCopy.recommendation}</p><p className="text-muted-foreground">The assistant uses the active role and dashboard context to frame prompts and evidence tables.</p></CardContent></Card>
        </div>
        <DrilldownTable onSelect={setSelectedSignal} title={`${roleCopy.titlePrefix} assistant evidence`} />
      </div>
    </div>
  );
}
