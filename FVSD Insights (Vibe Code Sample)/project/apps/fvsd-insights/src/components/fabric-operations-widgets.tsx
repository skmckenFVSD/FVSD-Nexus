import { Activity, BarChart3, Boxes, CheckCircle2, DatabaseZap, Gauge, RefreshCw, ShieldCheck, UsersRound } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, XAxis, YAxis } from 'recharts';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

type FabricMetricTitle = 'Semantic Model Health' | 'Dataset Refresh Status' | 'Assessment Coverage' | 'Data Product Readiness' | 'User Adoption Metrics' | 'Security and RLS Validation';
type FabricMetric = {
  title: FabricMetricTitle;
  value: string;
  status: 'Ready' | 'Watch' | 'Action';
  detail: string;
  futureBinding: string;
};

type FabricReadinessItem = {
  name: string;
  score: number;
  exceptions: number;
  owner: string;
};

const fabricChartConfig = {
  score: { label: 'Readiness score', color: 'var(--chart-1)' },
  exceptions: { label: 'Exceptions', color: 'var(--chart-3)' },
  users: { label: 'Users', color: 'var(--chart-2)' },
  validation: { label: 'Validation', color: 'var(--chart-1)' },
} satisfies ChartConfig;

const operationsMetrics: FabricMetric[] = [
  { title: 'Semantic Model Health', value: '92%', status: 'Watch', detail: 'Prototype health score across relationships, measures, calculation groups, and certification readiness.', futureBinding: 'Bind to Fabric semantic model metadata and refresh diagnostics.' },
  { title: 'Dataset Refresh Status', value: '6 / 8', status: 'Watch', detail: 'Mock refresh monitor for assessment, attendance, literacy, intervention, and roster data products.', futureBinding: 'Bind to Fabric refresh history, gateway status, and pipeline run outcomes.' },
  { title: 'Assessment Coverage', value: '87%', status: 'Action', detail: 'Placeholder coverage of expected benchmark and assessment records by school, grade, and reporting period.', futureBinding: 'Bind to assessment lakehouse tables and certified semantic measures.' },
  { title: 'Data Product Readiness', value: '4', status: 'Ready', detail: 'Candidate data products prepared for leadership reporting, governance review, and certification.', futureBinding: 'Bind to Fabric domains, data products, lineage, endorsement, and ownership metadata.' },
  { title: 'User Adoption Metrics', value: '143', status: 'Ready', detail: 'Mock active viewers, meeting usage, assistant prompt volume, and role-based dashboard engagement.', futureBinding: 'Bind to usage telemetry, audit logs, and Power BI activity events.' },
  { title: 'Security and RLS Validation', value: '98%', status: 'Watch', detail: 'Prototype validation of school-level filters, role visibility, and administrator-only access checks.', futureBinding: 'Bind to Entra groups, RLS test results, workspace roles, and access review logs.' },
];

const readinessItems: FabricReadinessItem[] = [
  { name: 'Attendance semantic model', score: 94, exceptions: 3, owner: 'Analytics operations' },
  { name: 'Literacy assessment model', score: 86, exceptions: 12, owner: 'Assessment services' },
  { name: 'Intervention data product', score: 89, exceptions: 7, owner: 'Student services' },
  { name: 'School profile dimensions', score: 97, exceptions: 1, owner: 'SIS administration' },
  { name: 'RLS validation suite', score: 98, exceptions: 2, owner: 'Security governance' },
];

const refreshRows = [
  { source: 'Student roster lakehouse', lastRun: 'Today 06:10', duration: '11 min', status: 'Ready', nextStep: 'Ready for certified model binding' },
  { source: 'Attendance fact dataset', lastRun: 'Today 06:24', duration: '18 min', status: 'Ready', nextStep: 'Add gateway run history in Phase 2' },
  { source: 'Literacy benchmark dataset', lastRun: 'Yesterday 22:15', duration: '24 min', status: 'Watch', nextStep: 'Validate winter assessment coverage' },
  { source: 'Intervention support plans', lastRun: 'Yesterday 21:40', duration: '16 min', status: 'Watch', nextStep: 'Resolve duplicate referral key rule' },
  { source: 'Security test matrix', lastRun: 'Today 07:05', duration: '7 min', status: 'Ready', nextStep: 'Bind to Entra/RLS validation output' },
];

const adoptionSegments = [
  { name: 'Executives', value: 18 },
  { name: 'School admins', value: 42 },
  { name: 'Teachers', value: 61 },
  { name: 'Support teams', value: 22 },
];

const iconMap = {
  'Semantic Model Health': DatabaseZap,
  'Dataset Refresh Status': RefreshCw,
  'Assessment Coverage': BarChart3,
  'Data Product Readiness': Boxes,
  'User Adoption Metrics': UsersRound,
  'Security and RLS Validation': ShieldCheck,
};

function statusVariant(status: FabricMetric['status'] | string): 'default' | 'secondary' | 'destructive' {
  if (status === 'Action') {
    return 'destructive';
  }
  if (status === 'Watch') {
    return 'secondary';
  }
  return 'default';
}

export function FabricOperationsCards({ onSelect }: { onSelect: (signal: string) => void }) {
  return (
    <div className="grid gap-3 md:grid-cols-2 2xl:grid-cols-3">
      {operationsMetrics.map((metric: FabricMetric) => {
        const Icon = iconMap[metric.title];
        return (
          <button key={metric.title} type="button" onClick={() => onSelect(metric.title)} className="text-left">
            <Card className="h-full border-border bg-card text-card-foreground shadow-sm transition-shadow hover:shadow-md">
              <CardContent className="p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-2">
                    <div className="rounded-lg bg-primary p-2 text-primary-foreground"><Icon className="h-4 w-4" /></div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{metric.title}</p>
                      <p className="text-xs text-muted-foreground">Future Fabric binding placeholder</p>
                    </div>
                  </div>
                  <Badge variant={statusVariant(metric.status)}>{metric.status}</Badge>
                </div>
                <div className="mt-3 flex items-end justify-between gap-3">
                  <p className="text-2xl font-semibold tracking-tight">{metric.value}</p>
                  <p className="text-right text-xs font-medium text-muted-foreground">Not connected</p>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">{metric.detail}</p>
                <p className="mt-2 rounded-md bg-secondary p-2 text-xs text-secondary-foreground">{metric.futureBinding}</p>
              </CardContent>
            </Card>
          </button>
        );
      })}
    </div>
  );
}

export function FabricReadinessCharts({ onSelect }: { onSelect: (signal: string) => void }) {
  return (
    <div className="grid gap-3 xl:grid-cols-[1.2fr_0.8fr]">
      <Card className="bg-card text-card-foreground shadow-sm">
        <CardHeader className="px-4 py-3"><CardTitle className="flex items-center gap-2"><Gauge className="h-5 w-5" />Data product readiness by asset</CardTitle></CardHeader>
        <CardContent className="px-4 pb-3">
          <ChartContainer config={fabricChartConfig} className="h-[310px] w-full">
            <BarChart data={readinessItems} onClick={() => onSelect('Data product readiness by asset')}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="name" tickLine={false} axisLine={false} />
              <YAxis tickLine={false} axisLine={false} domain={[0, 100]} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="score" fill="var(--chart-1)" radius={4} />
              <Bar dataKey="exceptions" fill="var(--chart-3)" radius={4} />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>
      <Card className="bg-card text-card-foreground shadow-sm">
        <CardHeader className="px-4 py-3"><CardTitle className="flex items-center gap-2"><Activity className="h-5 w-5" />User adoption mix</CardTitle></CardHeader>
        <CardContent className="px-4 pb-3">
          <ChartContainer config={fabricChartConfig} className="h-[310px] w-full">
            <PieChart onClick={() => onSelect('User adoption mix')}>
              <ChartTooltip content={<ChartTooltipContent />} />
              <Pie data={adoptionSegments} dataKey="value" nameKey="name" innerRadius={62} outerRadius={102} paddingAngle={3}>
                {adoptionSegments.map((segment: (typeof adoptionSegments)[number], index: number) => <Cell key={segment.name} fill={`var(--chart-${(index % 5) + 1})`} />)}
              </Pie>
            </PieChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
}

export function FabricRefreshStatusTable({ onSelect }: { onSelect: (signal: string) => void }) {
  return (
    <Card className="bg-card text-card-foreground shadow-sm">
      <CardHeader className="px-4 py-3"><CardTitle className="flex items-center gap-2"><CheckCircle2 className="h-5 w-5" />Fabric integration readiness register</CardTitle></CardHeader>
      <CardContent className="px-4 pb-3">
        <Table>
          <TableHeader>
            <TableRow><TableHead>Future Fabric asset</TableHead><TableHead>Mock refresh</TableHead><TableHead>Duration</TableHead><TableHead>Status</TableHead><TableHead>Phase 2 binding action</TableHead></TableRow>
          </TableHeader>
          <TableBody>
            {refreshRows.map((row: (typeof refreshRows)[number]) => (
              <TableRow key={row.source} onClick={() => onSelect(row.source)} className="cursor-pointer">
                <TableCell className="font-medium">{row.source}</TableCell>
                <TableCell>{row.lastRun}</TableCell>
                <TableCell>{row.duration}</TableCell>
                <TableCell><Badge variant={statusVariant(row.status)}>{row.status}</Badge></TableCell>
                <TableCell>{row.nextStep}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
