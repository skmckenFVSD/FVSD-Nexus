import { useState } from 'react';
import { Boxes, SlidersHorizontal, UsersRound } from 'lucide-react';
import { DrilldownTable, FilterPanel, KpiGrid, PageHeader } from '@/components/analytics-widgets';
import { FabricOperationsCards, FabricReadinessCharts, FabricRefreshStatusTable } from '@/components/fabric-operations-widgets';
import { IntegrationStatusPanel } from '@/components/integration-status-panel';
import { IntegrationReadinessPanel } from '@/components/integration-readiness-panel';
import { ReportOpensOverTime } from '@/components/report-opens-over-time';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { type FilterState } from '@/lib/analytics-data';
import { getRoleCopy } from '@/lib/role-content';
import { useDevelopmentRole } from '@/lib/role-context';

const adminKpis = [
  { label: 'Fabric readiness score', value: '91%', change: '+3', trend: 'up', detail: 'Prototype readiness across semantic models, data products, RLS, and adoption' },
  { label: 'Governed assets', value: '12', change: '+4', trend: 'up', detail: 'Future Fabric reports, semantic models, lakehouses, and data products tracked' },
  { label: 'Refresh monitors', value: '8', change: 'Mock', trend: 'up', detail: 'Placeholder refresh status cards awaiting Fabric operational binding' },
  { label: 'RLS validation checks', value: '27', change: '+9', trend: 'up', detail: 'Security and school-filter validation scenarios for Phase 2' },
  { label: 'Adoption signals', value: '143', change: '+18', trend: 'up', detail: 'Prototype active-user, assistant, and dashboard consumption metrics' },
  { label: 'Open governance actions', value: '18', change: '-4', trend: 'down', detail: 'Administrative readiness items before production integration' },
];

const roleRows = [
  { role: 'Executive', access: 'District leadership pages', scope: 'District-wide', status: 'Configured' },
  { role: 'School Administration', access: 'School improvement pages', scope: 'School-level', status: 'Configured' },
  { role: 'Teacher', access: 'Classroom analytics pages', scope: 'Classroom-level', status: 'Configured' },
  { role: 'Class Room Support', access: 'Support monitoring pages', scope: 'Support caseload', status: 'Configured' },
  { role: 'Data Analyst (Administrator)', access: 'All pages and filters', scope: 'Full visibility', status: 'Administrator' },
];

export function DataAdministrationPage() {
  const [selectedSignal, setSelectedSignal] = useState('Which administration controls need review?');
  const [filters, setFilters] = useState<FilterState>({ school: 'All schools', gradeBand: 'All grades', studentGroup: 'All students', period: 'Year to date' });
  const { role } = useDevelopmentRole();
  const roleCopy = getRoleCopy(role);

  return (
    <div>
      <PageHeader title="Analytics Operations Centre" description="Administrator-only command centre for future Microsoft Fabric governance, semantic model health, refresh monitoring, data product readiness, adoption analytics, and RLS validation." actions={<Button onClick={() => setSelectedSignal('Analytics operations centre reviewed')}>Review operations readiness</Button>} />
      <FilterPanel filters={filters} setFilters={setFilters} selectedSignal={selectedSignal} labels={roleCopy.filters} />
      <div className="space-y-3">
        <IntegrationStatusPanel />
        <KpiGrid items={adminKpis} onSelect={setSelectedSignal} columns="xl:grid-cols-3" />
        <FabricOperationsCards onSelect={setSelectedSignal} />
        <FabricReadinessCharts onSelect={setSelectedSignal} />
        <div className="grid gap-3 xl:grid-cols-[1.1fr_0.9fr]">
          <Card className="bg-card text-card-foreground shadow-sm">
            <CardHeader className="px-4 py-3"><CardTitle className="flex items-center gap-2"><UsersRound className="h-5 w-5" />Development role and visibility matrix</CardTitle></CardHeader>
            <CardContent className="grid gap-2 px-4 pb-3">
              {roleRows.map((row: (typeof roleRows)[number]) => (
                <button key={row.role} type="button" onClick={() => setSelectedSignal(row.role)} className="rounded-lg border border-border bg-background p-3 text-left">
                  <div className="flex items-center justify-between gap-2"><p className="text-sm font-semibold">{row.role}</p><Badge variant={row.status === 'Administrator' ? 'default' : 'secondary'}>{row.status}</Badge></div>
                  <p className="mt-1 text-xs text-muted-foreground">{row.access}</p>
                  <p className="mt-2 text-xs font-medium">Scope: {row.scope}</p>
                </button>
              ))}
            </CardContent>
          </Card>
          <Card className="bg-card text-card-foreground shadow-sm">
            <CardHeader className="px-4 py-3"><CardTitle className="flex items-center gap-2"><SlidersHorizontal className="h-5 w-5" />Prototype operations controls</CardTitle></CardHeader>
            <CardContent className="grid gap-3 px-4 pb-3 text-sm">
              <div className="rounded-lg bg-secondary p-3 text-secondary-foreground"><p className="font-semibold">Fabric binding placeholders</p><p>Cards and charts are structured for future semantic model, report, data product, refresh history, telemetry, and RLS validation binding.</p></div>
              <div className="rounded-lg bg-secondary p-3 text-secondary-foreground"><p className="font-semibold">Administrator validation</p><p>Data Analyst has full visibility to all schools, users, filters, pages, and readiness controls for governance review.</p></div>
              <div className="rounded-lg bg-secondary p-3 text-secondary-foreground"><p className="font-semibold">Production note</p><p>Future implementation will use Entra ID, Microsoft Fabric domains, governed workspaces, certified semantic models, and row-level security.</p></div>
              <div className="flex items-center gap-2 text-sm font-semibold"><Boxes className="h-4 w-4" />Analytics Operations Centre prototype</div>
            </CardContent>
          </Card>
        <IntegrationReadinessPanel />
        <ReportOpensOverTime />
        </div>
        <FabricRefreshStatusTable onSelect={setSelectedSignal} />
        <DrilldownTable onSelect={setSelectedSignal} title="Operations evidence table" />
      </div>
    </div>
  );
}
