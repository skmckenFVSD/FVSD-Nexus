import { useState } from 'react';
import { Database, ShieldCheck, TriangleAlert } from 'lucide-react';
import { DrilldownTable, FilterPanel, KpiGrid, PageHeader } from '@/components/analytics-widgets';
import { FabricOperationsCards, FabricReadinessCharts } from '@/components/fabric-operations-widgets';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { type FilterState } from '@/lib/analytics-data';
import { getRoleCopy } from '@/lib/role-content';
import { useDevelopmentRole } from '@/lib/role-context';

const qualityKpis = [
  { label: 'Semantic health exceptions', value: '42', change: '-8', trend: 'up', detail: 'Model, measure, relationship, and source quality rules requiring review' },
  { label: 'Refresh watch items', value: '3', change: '+1', trend: 'down', detail: 'Future Fabric datasets beyond expected refresh window' },
  { label: 'Assessment coverage gaps', value: '118', change: '-24', trend: 'up', detail: 'Expected assessment records requiring validation before model certification' },
  { label: 'Data product readiness', value: '91%', change: '+3', trend: 'up', detail: 'Readiness for Fabric semantic model and data product binding' },
];

const qualityRows = [
  { source: 'Attendance extract', issue: 'Late refresh', severity: 'Priority', owner: 'Data operations', status: 'Investigating' },
  { source: 'Literacy benchmarks', issue: 'Missing winter records', severity: 'Watch', owner: 'Assessment team', status: 'Remediation planned' },
  { source: 'Support plans', issue: 'Duplicate referral identifiers', severity: 'Watch', owner: 'Student services', status: 'Rule update' },
  { source: 'School roster', issue: 'Grade band mismatch', severity: 'On track', owner: 'SIS administrator', status: 'Resolved sample' },
];

export function DataQualityPage() {
  const [selectedSignal, setSelectedSignal] = useState('Which datasets require validation before leadership review?');
  const [filters, setFilters] = useState<FilterState>({ school: 'All schools', gradeBand: 'All grades', studentGroup: 'All students', period: 'Year to date' });
  const { role } = useDevelopmentRole();
  const roleCopy = getRoleCopy(role);

  return (
    <div>
      <PageHeader title="Data Quality and Fabric Readiness" description="Administrator-only review of semantic model health, assessment coverage, refresh readiness, security validation, data product quality, and dashboard trust indicators." />
      <FilterPanel filters={filters} setFilters={setFilters} selectedSignal={selectedSignal} labels={roleCopy.filters} />
      <div className="space-y-3">
        <KpiGrid items={qualityKpis} onSelect={setSelectedSignal} />
        <div className="grid gap-3 xl:grid-cols-[0.95fr_1.05fr]">
          <Card className="bg-card text-card-foreground shadow-sm">
            <CardHeader className="px-4 py-3"><CardTitle className="flex items-center gap-2"><Database className="h-5 w-5" />Source readiness</CardTitle></CardHeader>
            <CardContent className="grid gap-2 px-4 pb-3">
              {qualityRows.map((row: (typeof qualityRows)[number]) => (
                <button key={row.source} type="button" onClick={() => setSelectedSignal(row.issue)} className="rounded-lg border border-border bg-background p-3 text-left">
                  <div className="flex items-center justify-between gap-2"><p className="text-sm font-semibold">{row.source}</p><Badge variant={row.severity === 'Priority' ? 'destructive' : row.severity === 'Watch' ? 'secondary' : 'default'}>{row.severity}</Badge></div>
                  <p className="mt-1 text-xs text-muted-foreground">{row.issue} • {row.owner}</p>
                  <p className="mt-2 text-xs font-medium">{row.status}</p>
                </button>
              ))}
            </CardContent>
          </Card>
          <Card className="bg-card text-card-foreground shadow-sm">
            <CardHeader className="px-4 py-3"><CardTitle className="flex items-center gap-2"><TriangleAlert className="h-5 w-5" />Quality rules</CardTitle></CardHeader>
            <CardContent className="grid gap-3 px-4 pb-3 text-sm">
              <div className="rounded-lg bg-secondary p-3 text-secondary-foreground"><p className="font-semibold">Completeness threshold</p><p>Flags schools below 95% expected record coverage for the selected reporting period.</p></div>
              <div className="rounded-lg bg-secondary p-3 text-secondary-foreground"><p className="font-semibold">Freshness threshold</p><p>Highlights source extracts older than the mock refresh service-level target.</p></div>
              <div className="rounded-lg bg-secondary p-3 text-secondary-foreground"><p className="font-semibold">Referential integrity</p><p>Identifies missing student, school, cohort, and support-plan relationships.</p></div>
              <div className="flex items-center gap-2 text-sm font-semibold"><ShieldCheck className="h-4 w-4" />Ready for administrator validation</div>
            </CardContent>
          </Card>
        </div>
        <FabricOperationsCards onSelect={setSelectedSignal} />
        <FabricReadinessCharts onSelect={setSelectedSignal} />
        <DrilldownTable onSelect={setSelectedSignal} title="Data quality evidence table" />
      </div>
    </div>
  );
}
