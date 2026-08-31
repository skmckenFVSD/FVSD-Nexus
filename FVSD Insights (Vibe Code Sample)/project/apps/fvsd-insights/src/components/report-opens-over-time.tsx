import { useEffect, useMemo, useState } from 'react';
import { Activity, AlertTriangle, Clock, Database, ShieldAlert } from 'lucide-react';
import { Bar, CartesianGrid, ComposedChart, Legend, Line, XAxis, YAxis } from 'recharts';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { activeAnalyticsProvider, governedQueryRegistry, type AnalyticalResult } from '@/lib/analytics-providers';
import { useDevelopmentRole } from '@/lib/role-context';
import { useUser } from '@/hooks/use-user';

type ReportOpenRow = {
  date: string;
  dailyReportOpens: number | null;
  weeklyReportOpens: number | null;
};

const chartConfig = {
  dailyReportOpens: { label: 'Daily report opens', color: '#0097BC' },
  weeklyReportOpens: { label: 'Weekly report opens', color: '#071940' },
} satisfies ChartConfig;

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en-CA', { month: 'short', day: '2-digit' }).format(new Date(value));
}

function formatValue(value: number | null) {
  return value === null ? 'BLANK' : value.toLocaleString('en-CA');
}

export function ReportOpensOverTime() {
  const { role } = useDevelopmentRole();
  const { data: user } = useUser();
  const [result, setResult] = useState<AnalyticalResult<ReportOpenRow[]> | null>(null);
  const [state, setState] = useState<'loading' | 'empty' | 'unauthorised' | 'error' | 'success'>('loading');

  const query = governedQueryRegistry.find((item) => item.queryId === 'usage-report-opens-over-time');
  const dateRange = 'Year to date';

  useEffect(() => {
    let isActive = true;

    async function loadReportOpens() {
      if (!query) {
        setState('error');
        return;
      }

      setState('loading');
      const response = await activeAnalyticsProvider.executeGovernedQuery<ReportOpenRow[]>(query, {
        developmentRole: role,
        userPrincipalName: user?.userPrincipalName,
        objectId: user?.objectId,
        tenantId: user?.tenantId,
        filterContext: {
          dateRange,
          workspaceId: 'f8a1522b-e94c-4e57-a60e-392d892e27ff',
          semanticModelId: '543c76d7-c6b0-4b53-9c3a-717964149bc6',
        },
      });

      if (isActive) {
        setResult(response);
        setState(response.state);
      }
    }

    void loadReportOpens();

    return () => {
      isActive = false;
    };
  }, [dateRange, query, role, user?.objectId, user?.tenantId, user?.userPrincipalName]);

  const rows = useMemo(() => result?.data ?? [], [result?.data]);
  const statusLabel = result?.isMockData ? 'Mock data' : 'Live Fabric Data';

  return (
    <Card className="bg-card text-card-foreground shadow-sm">
      <CardHeader className="px-4 py-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle className="flex items-center gap-2"><Activity className="h-5 w-5" />Report Opens Over Time</CardTitle>
          <Badge variant={result?.isMockData ? 'secondary' : 'default'}>{statusLabel}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 px-4 pb-4">
        <div className="grid gap-2 md:grid-cols-4">
          <div className="rounded-lg bg-secondary p-3 text-secondary-foreground"><p className="text-xs font-semibold">Data source</p><p className="text-sm">Usage Metrics Report</p></div>
          <div className="rounded-lg bg-secondary p-3 text-secondary-foreground"><p className="text-xs font-semibold">Connection state</p><p className="text-sm">{result?.provider ?? activeAnalyticsProvider.kind} · {state}</p></div>
          <div className="rounded-lg bg-secondary p-3 text-secondary-foreground"><p className="text-xs font-semibold">Last live retrieval</p><p className="text-sm">{result?.isMockData ? 'Never' : (result?.lastSuccessfulQueryTimestamp ?? 'Never')}</p></div>
          <div className="rounded-lg bg-secondary p-3 text-secondary-foreground"><p className="text-xs font-semibold">Query duration</p><p className="text-sm">{result?.isMockData ? 'Not applicable' : (result?.lastQueryDurationMs ? `${result.lastQueryDurationMs} ms` : 'Not applicable')}</p></div>
        </div>

        {state === 'loading' && <div className="rounded-lg border border-border bg-background p-6 text-sm text-muted-foreground"><Clock className="mb-2 h-5 w-5" />Loading report open metrics through the analytics provider abstraction.</div>}
        {state === 'empty' && <div className="rounded-lg border border-border bg-background p-6 text-sm text-muted-foreground"><Database className="mb-2 h-5 w-5" />No report open metrics were returned for the applied date range.</div>}
        {state === 'unauthorised' && <div className="rounded-lg border border-border bg-background p-6 text-sm text-muted-foreground"><ShieldAlert className="mb-2 h-5 w-5" />The secure server-side Power BI provider is not authorised for this request.</div>}
        {state === 'error' && <div className="rounded-lg border border-border bg-background p-6 text-sm text-muted-foreground"><AlertTriangle className="mb-2 h-5 w-5" />{result?.errorDetails ?? 'Unable to retrieve report open metrics.'}</div>}

        {state === 'success' && (
          <div className="grid gap-3 xl:grid-cols-[1.35fr_0.65fr]">
            <ChartContainer config={chartConfig} className="h-[360px] w-full">
              <ComposedChart data={rows} margin={{ top: 10, right: 18, bottom: 6, left: 0 }}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="date" tickFormatter={formatDate} tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} allowDecimals={false} />
                <ChartTooltip content={<ChartTooltipContent labelFormatter={(label) => formatDate(String(label))} />} />
                <Legend />
                <Bar dataKey="dailyReportOpens" name="Daily report opens" fill="#0097BC" radius={[4, 4, 0, 0]} />
                <Line dataKey="weeklyReportOpens" name="Weekly report opens" type="monotone" stroke="#071940" strokeWidth={3} dot={{ r: 3 }} connectNulls={false} />
              </ComposedChart>
            </ChartContainer>
            <div className="rounded-lg border border-border bg-background p-3 text-sm">
              <p className="font-semibold">Integration status</p>
              <div className="mt-3 space-y-2 text-xs text-muted-foreground">
                <p>Mock or live data indicator: {statusLabel}</p>
                <p>Applied date range: {dateRange}</p>
                <p>Measure used: {result?.measureNames.length ? result.measureNames.join(', ') : 'Report views, Weekly Views'}</p>
                <p>Filter context: {JSON.stringify(result?.filterContext ?? {})}</p>
                <p>Authenticated identity: {result?.isMockData ? 'Not configured' : 'Configured by server-side provider'}</p>
                <p>RLS status: {result?.isMockData ? 'Not validated' : 'Applied by semantic model'}</p>
                <p>Error details: {result?.errorDetails ?? 'None'}</p>
              </div>
            </div>
          </div>
        )}

        <div className="rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow><TableHead>Date</TableHead><TableHead>Daily report opens</TableHead><TableHead>Weekly report opens</TableHead></TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row: ReportOpenRow) => (
                <TableRow key={row.date}>
                  <TableCell>{formatDate(row.date)}</TableCell>
                  <TableCell>{formatValue(row.dailyReportOpens)}</TableCell>
                  <TableCell>{formatValue(row.weeklyReportOpens)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
