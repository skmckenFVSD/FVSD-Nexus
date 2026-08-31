import { ServerCog, ShieldCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { analyticsServerConfigurationPlaceholders, governedQueryRegistry, integrationStatusSnapshot, type GovernedQueryDefinition } from '@/lib/analytics-providers';

const statusRows = [
  { label: 'Active provider', value: integrationStatusSnapshot.activeProvider },
  { label: 'Semantic model connection status', value: integrationStatusSnapshot.semanticModelConnectionStatus },
  { label: 'Authenticated identity status', value: integrationStatusSnapshot.authenticatedIdentityStatus },
  { label: 'RLS context status', value: integrationStatusSnapshot.rlsContextStatus },
  { label: 'Last successful query timestamp', value: integrationStatusSnapshot.lastSuccessfulQueryTimestamp },
  { label: 'Last query duration', value: `${integrationStatusSnapshot.lastQueryDurationMs} ms` },
  { label: 'Measure used', value: integrationStatusSnapshot.measureUsed },
  { label: 'Filter context', value: integrationStatusSnapshot.filterContext },
  { label: 'Error details', value: integrationStatusSnapshot.errorDetails },
  { label: 'Mock or live data indicator', value: integrationStatusSnapshot.dataIndicator },
];

export function IntegrationStatusPanel() {
  return (
    <div className="grid gap-3 xl:grid-cols-[0.85fr_1.15fr]">
      <Card className="bg-card text-card-foreground shadow-sm">
        <CardHeader className="px-4 py-3">
          <CardTitle className="flex items-center gap-2"><ServerCog className="h-5 w-5" />Power BI integration status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 px-4 pb-3">
          <div className="rounded-lg bg-secondary p-3 text-secondary-foreground">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-semibold">Secure server-side integration boundary</p>
              <Badge variant="secondary">{integrationStatusSnapshot.dataIndicator}</Badge>
            </div>
            <p className="mt-1 text-xs">Configuration source: {analyticsServerConfigurationPlaceholders.configurationSource}</p>
            <p className="mt-1 text-xs">{analyticsServerConfigurationPlaceholders.clientSecurityBoundary}</p>
          </div>
          <div className="grid gap-2">
            {statusRows.map((row: (typeof statusRows)[number]) => (
              <div key={row.label} className="grid gap-1 rounded-lg border border-border bg-background p-2 md:grid-cols-[0.38fr_0.62fr]">
                <p className="text-xs font-semibold text-foreground">{row.label}</p>
                <p className="text-xs text-muted-foreground">{row.value}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      <Card className="bg-card text-card-foreground shadow-sm">
        <CardHeader className="px-4 py-3">
          <CardTitle className="flex items-center gap-2"><ShieldCheck className="h-5 w-5" />Governed query registry</CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-3">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Query</TableHead>
                <TableHead>Semantic model</TableHead>
                <TableHead>Measures</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Visual</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {governedQueryRegistry.map((query: GovernedQueryDefinition) => (
                <TableRow key={query.queryId}>
                  <TableCell className="font-medium"><div>{query.displayName}</div><div className="text-xs text-muted-foreground">{query.queryId}</div></TableCell>
                  <TableCell className="text-xs">{query.semanticModelId}</TableCell>
                  <TableCell>{query.approvedMeasureNames.length > 0 ? query.approvedMeasureNames.join(', ') : 'Awaiting approved measures'}</TableCell>
                  <TableCell><Badge variant="secondary">{query.status}</Badge></TableCell>
                  <TableCell>{query.outputVisualType}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="mt-3 rounded-lg border border-border bg-background p-3 text-xs text-muted-foreground">
            Fixed dashboard queries must use approved semantic-model Measures, preserve BLANK values, return measure names and filter context, and execute only through secure server-side services.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
