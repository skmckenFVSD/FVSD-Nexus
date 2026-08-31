import { ArrowDownRight, ArrowUpRight, Bot, Filter, Map, Send, Sparkles } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, XAxis, YAxis } from 'recharts';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { achievementDistribution, assistantCards, assistantPrompts, attendanceRiskTrend, attendanceSegments, executiveInsights, executiveKpis, gradeBands, interventionCohorts, interventionResults, literacyBenchmarkTrend, literacySkillGaps, periods, records, schoolComparisonBars, schoolProfiles, schools, studentGroupAnalysis, studentGroups, tierMix, type FilterState, type MetricRecord } from '@/lib/analytics-data';

type KpiItem = { label: string; value: string; change: string; trend: string; detail: string };

const chartConfig = {
  attendance: { label: 'Attendance', color: 'var(--chart-1)' },
  literacy: { label: 'Literacy', color: 'var(--chart-2)' },
  intervention: { label: 'Intervention', color: 'var(--chart-3)' },
  readiness: { label: 'Readiness', color: 'var(--chart-1)' },
  attention: { label: 'Attention', color: 'var(--chart-3)' },
  chronic: { label: 'Chronic absence', color: 'var(--chart-3)' },
  emerging: { label: 'Emerging risk', color: 'var(--chart-2)' },
  outreach: { label: 'Outreach success', color: 'var(--chart-1)' },
  proficiency: { label: 'Proficiency', color: 'var(--chart-2)' },
  support: { label: 'Support need', color: 'var(--chart-3)' },
  completion: { label: 'Completion', color: 'var(--chart-1)' },
  growth: { label: 'Growth', color: 'var(--chart-2)' },
  fidelity: { label: 'Fidelity', color: 'var(--chart-3)' },
  value: { label: 'Students', color: 'var(--chart-5)' },
} satisfies ChartConfig;

export function PageHeader({ title, description, actions }: { title: string; description: string; actions?: React.ReactNode }) {
  return (
    <div className="mb-4 flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">FVSD leadership question</p>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        <p className="mt-1 max-w-5xl text-sm text-muted-foreground">{description}</p>
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}

export function FilterPanel({ filters, setFilters, selectedSignal, labels = ['School', 'Grade', 'Group', 'Period'] }: { filters: FilterState; setFilters: (filters: FilterState) => void; selectedSignal: string; labels?: string[] }) {
  const updateFilter = (key: keyof FilterState, value: string) => setFilters({ ...filters, [key]: value });
  return (
    <Card className="mb-3 border-border bg-card text-card-foreground shadow-sm">
      <CardContent className="grid gap-2 p-3 md:grid-cols-[150px_repeat(4,minmax(130px,1fr))]">
        <div className="flex items-center gap-2 text-sm font-semibold"><Filter className="h-4 w-4" />Visible filters</div>
        <FilterSelect label={labels[0] ?? 'School'} value={filters.school} values={schools} onChange={(value: string) => updateFilter('school', value)} />
        <FilterSelect label={labels[1] ?? 'Grade'} value={filters.gradeBand} values={gradeBands} onChange={(value: string) => updateFilter('gradeBand', value)} />
        <FilterSelect label={labels[2] ?? 'Group'} value={filters.studentGroup} values={studentGroups} onChange={(value: string) => updateFilter('studentGroup', value)} />
        <FilterSelect label={labels[3] ?? 'Period'} value={filters.period} values={periods} onChange={(value: string) => updateFilter('period', value)} />
        <div className="rounded-md bg-accent px-2 py-1.5 text-xs text-accent-foreground md:col-span-5">Active analysis selection: <span className="font-semibold">{selectedSignal}</span></div>
      </CardContent>
    </Card>
  );
}

function FilterSelect({ label, value, values, onChange }: { label: string; value: string; values: string[]; onChange: (value: string) => void }) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
        <SelectContent>{values.filter((item: string) => item).map((item: string) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent>
      </Select>
    </div>
  );
}

export function KpiGrid({ items, onSelect, columns = 'xl:grid-cols-4' }: { items: KpiItem[]; onSelect: (signal: string) => void; columns?: string }) {
  return (
    <div className={`grid gap-3 md:grid-cols-2 ${columns}`}>
      {items.map((kpi: KpiItem) => (
        <button key={kpi.label} onClick={() => onSelect(kpi.label)} className="text-left">
          <Card className="h-full border-border bg-card text-card-foreground shadow-sm transition-shadow hover:shadow-md">
            <CardContent className="p-3">
              <div className="flex items-start justify-between gap-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{kpi.label}</p>
                <Badge variant={kpi.trend === 'down' ? 'destructive' : 'default'}>{kpi.change}</Badge>
              </div>
              <div className="mt-2 flex items-end justify-between gap-2">
                <p className="text-2xl font-semibold tracking-tight">{kpi.value}</p>
                {kpi.trend === 'up' ? <ArrowUpRight className="h-5 w-5" /> : <ArrowDownRight className="h-5 w-5" />}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{kpi.detail}</p>
            </CardContent>
          </Card>
        </button>
      ))}
    </div>
  );
}

export function ExecutiveSummaryCards({ onSelect }: { onSelect: (signal: string) => void }) {
  return (
    <div className="grid gap-3 lg:grid-cols-3">
      {executiveInsights.map((insight: (typeof executiveInsights)[number]) => (
        <button key={insight.title} onClick={() => onSelect(insight.title)} className="text-left">
          <Card className="h-full border-l-4 border-l-primary bg-card text-card-foreground shadow-sm">
            <CardContent className="p-3">
              <div className="flex items-center justify-between gap-2"><p className="text-sm font-semibold">{insight.title}</p><Badge variant={insight.severity === 'Priority' ? 'destructive' : insight.severity === 'Watch' ? 'secondary' : 'default'}>{insight.severity}</Badge></div>
              <p className="mt-1 text-xs text-muted-foreground">{insight.summary}</p>
              <p className="mt-2 text-xs font-semibold">Decision cue: {insight.action}</p>
            </CardContent>
          </Card>
        </button>
      ))}
    </div>
  );
}

export function ExecutiveTrendChart({ data, onSelect }: { data: { month: string; readiness: number; attention: number; attendance: number; literacy: number }[]; onSelect: (signal: string) => void }) {
  return (
    <Card className="border-border bg-card text-card-foreground shadow-sm">
      <CardHeader className="px-4 py-3"><CardTitle>Executive attention trend</CardTitle></CardHeader>
      <CardContent className="px-4 pb-3">
        <ChartContainer config={chartConfig} className="h-[390px] w-full">
          <LineChart data={data} onClick={() => onSelect('Executive attention trend')}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="month" tickLine={false} axisLine={false} />
            <YAxis tickLine={false} axisLine={false} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Line dataKey="readiness" stroke="var(--chart-1)" strokeWidth={3} dot={false} />
            <Line dataKey="attendance" stroke="var(--chart-2)" strokeWidth={3} dot={false} />
            <Line dataKey="literacy" stroke="var(--chart-3)" strokeWidth={3} dot={false} />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

export function AssistantFeature({ compact = false, onSelect, prompts = assistantPrompts, intro = 'Ask board-ready questions, surface performance drivers, and convert selected signals into leadership next steps.' }: { compact?: boolean; onSelect?: (signal: string) => void; prompts?: string[]; intro?: string }) {
  return (
    <Card className="h-full border-primary bg-primary text-primary-foreground shadow-sm">
      <CardHeader className="px-4 py-3"><CardTitle className="flex items-center gap-2"><Bot className="h-5 w-5" />FVSD Analytics Assistant</CardTitle></CardHeader>
      <CardContent className="space-y-3 px-4 pb-3">
        <p className="text-sm">{intro}</p>
        <div className="grid gap-2">
          {prompts.slice(0, compact ? 2 : 4).map((prompt: string) => <Button key={prompt} variant="secondary" className="h-auto justify-start whitespace-normal py-2 text-left" onClick={() => onSelect?.(prompt)}><Sparkles className="mr-2 h-4 w-4 shrink-0" />{prompt}</Button>)}
        </div>
      </CardContent>
    </Card>
  );
}

export function SchoolComparisonTable({ onSelect }: { onSelect: (signal: string) => void }) {
  const rankedSchools = [...schoolProfiles].sort((a: (typeof schoolProfiles)[number], b: (typeof schoolProfiles)[number]) => b.literacy + b.attendance - (a.literacy + a.attendance));
  return (
    <Card className="bg-card text-card-foreground shadow-sm">
      <CardHeader className="px-4 py-3"><CardTitle>How schools compare</CardTitle></CardHeader>
      <CardContent className="px-4 pb-3">
        <Table>
          <TableHeader><TableRow><TableHead>Rank</TableHead><TableHead>School</TableHead><TableHead>Principal</TableHead><TableHead className="text-right">Risk index</TableHead><TableHead className="text-right">Attendance</TableHead><TableHead className="text-right">Literacy</TableHead><TableHead>Status</TableHead><TableHead>Trend</TableHead></TableRow></TableHeader>
          <TableBody>
            {rankedSchools.map((school: (typeof rankedSchools)[number], index: number) => (
              <TableRow key={school.school} onClick={() => onSelect(school.school)} className="cursor-pointer">
                <TableCell className="font-semibold">#{index + 1}</TableCell><TableCell className="font-medium">{school.school}</TableCell><TableCell>{school.principal}</TableCell><TableCell className="text-right">{school.risk}</TableCell><TableCell className="text-right">{school.attendance}%</TableCell><TableCell className="text-right">{school.literacy}%</TableCell><TableCell><Badge variant={school.risk > 45 ? 'destructive' : school.risk > 30 ? 'secondary' : 'default'}>{school.risk > 45 ? 'Priority' : school.risk > 30 ? 'Watch' : 'On track'}</Badge></TableCell><TableCell>{school.momentum >= 0 ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

export function SchoolComparisonChart({ onSelect }: { onSelect: (signal: string) => void }) {
  return (
    <Card className="bg-card text-card-foreground shadow-sm">
      <CardHeader className="px-4 py-3"><CardTitle>Comparison by attendance, literacy, and risk</CardTitle></CardHeader>
      <CardContent className="px-4 pb-3">
        <ChartContainer config={chartConfig} className="h-[280px] w-full">
          <BarChart data={schoolComparisonBars} onClick={() => onSelect('School comparison chart')}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="name" tickLine={false} axisLine={false} />
            <YAxis tickLine={false} axisLine={false} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="attendance" fill="var(--chart-1)" radius={4} />
            <Bar dataKey="literacy" fill="var(--chart-2)" radius={4} />
            <Bar dataKey="risk" fill="var(--chart-3)" radius={4} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

export function DistrictMapPlaceholder() {
  return (
    <Card className="h-full bg-card text-card-foreground shadow-sm">
      <CardHeader className="px-4 py-3"><CardTitle className="flex items-center gap-2"><Map className="h-5 w-5" />District overview</CardTitle></CardHeader>
      <CardContent className="px-4 pb-3">
        <div className="grid h-[300px] place-items-center rounded-lg border border-dashed border-border bg-secondary text-secondary-foreground">
          <div className="text-center"><p className="font-semibold">FVSD district overview placeholder</p><p className="mt-1 text-xs">Future school cluster, catchment, and status overlay map.</p></div>
        </div>
      </CardContent>
    </Card>
  );
}

export function StudentGroupAnalysisChart({ onSelect }: { onSelect: (signal: string) => void }) {
  return (
    <Card className="bg-card text-card-foreground shadow-sm">
      <CardHeader className="px-4 py-3"><CardTitle>Which learners need support?</CardTitle></CardHeader>
      <CardContent className="px-4 pb-3">
        <ChartContainer config={chartConfig} className="h-[280px] w-full">
          <BarChart data={studentGroupAnalysis} onClick={() => onSelect('Student group analysis')}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="name" tickLine={false} axisLine={false} />
            <YAxis tickLine={false} axisLine={false} domain={[0, 100]} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="proficiency" fill="var(--chart-2)" radius={4} />
            <Bar dataKey="support" fill="var(--chart-3)" radius={4} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

export function AchievementDistributionChart({ onSelect }: { onSelect: (signal: string) => void }) {
  return (
    <Card className="bg-card text-card-foreground shadow-sm">
      <CardHeader className="px-4 py-3"><CardTitle>Achievement distribution</CardTitle></CardHeader>
      <CardContent className="px-4 pb-3">
        <ChartContainer config={chartConfig} className="h-[280px] w-full">
          <PieChart onClick={() => onSelect('Achievement distribution')}>
            <ChartTooltip content={<ChartTooltipContent />} />
            <Pie data={achievementDistribution} dataKey="value" nameKey="name" innerRadius={54} outerRadius={92} paddingAngle={3}>
              {achievementDistribution.map((entry: (typeof achievementDistribution)[number], index: number) => <Cell key={entry.name} fill={`var(--chart-${(index % 5) + 1})`} />)}
            </Pie>
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

export function AttendanceRiskChart({ onSelect }: { onSelect: (signal: string) => void }) {
  return (
    <Card className="bg-card text-card-foreground shadow-sm">
      <CardHeader className="px-4 py-3"><CardTitle>Where attendance risks are emerging</CardTitle></CardHeader>
      <CardContent className="px-4 pb-3">
        <ChartContainer config={chartConfig} className="h-[320px] w-full">
          <LineChart data={attendanceRiskTrend} onClick={() => onSelect('Attendance risk trend')}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="month" tickLine={false} axisLine={false} />
            <YAxis tickLine={false} axisLine={false} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Line dataKey="chronic" stroke="var(--chart-3)" strokeWidth={3} dot={false} />
            <Line dataKey="outreach" stroke="var(--chart-1)" strokeWidth={3} dot={false} />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

export function AttendanceSegmentDonut({ onSelect }: { onSelect: (signal: string) => void }) {
  return (
    <Card className="bg-card text-card-foreground shadow-sm">
      <CardHeader className="px-4 py-3"><CardTitle>Absence band distribution</CardTitle></CardHeader>
      <CardContent className="px-4 pb-3">
        <ChartContainer config={chartConfig} className="h-[320px] w-full">
          <PieChart onClick={() => onSelect('Absence band distribution')}>
            <ChartTooltip content={<ChartTooltipContent />} />
            <Pie data={attendanceSegments} dataKey="value" nameKey="name" innerRadius={62} outerRadius={98} paddingAngle={3}>
              {attendanceSegments.map((entry: (typeof attendanceSegments)[number], index: number) => <Cell key={entry.name} fill={`var(--chart-${(index % 5) + 1})`} />)}
            </Pie>
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

export function LiteracyBenchmarkChart({ onSelect }: { onSelect: (signal: string) => void }) {
  return (
    <Card className="bg-card text-card-foreground shadow-sm">
      <CardHeader className="px-4 py-3"><CardTitle>Literacy benchmark movement</CardTitle></CardHeader>
      <CardContent className="px-4 pb-3">
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <BarChart data={literacyBenchmarkTrend} onClick={() => onSelect('Literacy benchmark movement')}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="period" tickLine={false} axisLine={false} />
            <YAxis tickLine={false} axisLine={false} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="emerging" fill="var(--chart-3)" radius={4} />
            <Bar dataKey="developing" fill="var(--chart-5)" radius={4} />
            <Bar dataKey="proficient" fill="var(--chart-2)" radius={4} />
            <Bar dataKey="extending" fill="var(--chart-1)" radius={4} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

export function LiteracySkillGapChart({ onSelect }: { onSelect: (signal: string) => void }) {
  return (
    <Card className="bg-card text-card-foreground shadow-sm">
      <CardHeader className="px-4 py-3"><CardTitle>Skill area gaps requiring intervention</CardTitle></CardHeader>
      <CardContent className="px-4 pb-3">
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <BarChart data={literacySkillGaps} onClick={() => onSelect('Literacy skill gap chart')}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="skill" tickLine={false} axisLine={false} />
            <YAxis tickLine={false} axisLine={false} domain={[50, 100]} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="primary" fill="var(--chart-1)" radius={4} />
            <Bar dataKey="intermediate" fill="var(--chart-2)" radius={4} />
            <Bar dataKey="middle" fill="var(--chart-3)" radius={4} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

export function InterventionResultsChart({ onSelect }: { onSelect: (signal: string) => void }) {
  return (
    <Card className="bg-card text-card-foreground shadow-sm">
      <CardHeader className="px-4 py-3"><CardTitle>Which interventions are producing results?</CardTitle></CardHeader>
      <CardContent className="px-4 pb-3">
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <BarChart data={interventionResults} onClick={() => onSelect('Intervention results chart')}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="name" tickLine={false} axisLine={false} />
            <YAxis tickLine={false} axisLine={false} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="completion" fill="var(--chart-1)" radius={4} />
            <Bar dataKey="fidelity" fill="var(--chart-3)" radius={4} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

export function InterventionCohortTable({ onSelect }: { onSelect: (signal: string) => void }) {
  return (
    <Card className="bg-card text-card-foreground shadow-sm">
      <CardHeader className="px-4 py-3"><CardTitle>Intervention cohort evidence</CardTitle></CardHeader>
      <CardContent className="px-4 pb-3">
        <Table>
          <TableHeader><TableRow><TableHead>Cohort</TableHead><TableHead className="text-right">Students</TableHead><TableHead className="text-right">Completion</TableHead><TableHead className="text-right">Growth</TableHead><TableHead className="text-right">Fidelity</TableHead></TableRow></TableHeader>
          <TableBody>{interventionCohorts.map((cohort: (typeof interventionCohorts)[number]) => <TableRow key={cohort.cohort} onClick={() => onSelect(cohort.cohort)} className="cursor-pointer"><TableCell className="font-medium">{cohort.cohort}</TableCell><TableCell className="text-right">{cohort.students}</TableCell><TableCell className="text-right">{cohort.completion}%</TableCell><TableCell className="text-right">+{cohort.growth}</TableCell><TableCell className="text-right">{cohort.fidelity}%</TableCell></TableRow>)}</TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

export function AssistantWorkspace({ onSelect, prompts = assistantPrompts, suggestedQuestion = 'What requires leadership attention this week, and which evidence should be reviewed first?' }: { onSelect: (signal: string) => void; prompts?: string[]; suggestedQuestion?: string }) {
  return (
    <Card className="bg-card text-card-foreground shadow-sm">
      <CardHeader className="px-4 py-3"><CardTitle className="flex items-center gap-2"><Bot className="h-5 w-5" />Leadership decision workspace</CardTitle></CardHeader>
      <CardContent className="space-y-3 px-4 pb-3">
        <div className="rounded-lg border border-border bg-background p-3"><p className="text-sm font-semibold">Suggested role-aware question</p><p className="mt-1 text-sm text-muted-foreground">{suggestedQuestion}</p></div>
        <div className="grid gap-2 md:grid-cols-2">{prompts.map((prompt: string) => <Button key={prompt} variant="outline" className="h-auto justify-start whitespace-normal py-2 text-left" onClick={() => onSelect(prompt)}><Sparkles className="mr-2 h-4 w-4 shrink-0" />{prompt}</Button>)}</div>
        <div className="flex gap-2"><Input value="Draft an action summary from the selected role-specific dashboard signal" readOnly /><Button onClick={() => onSelect('Assistant prompt submitted')} size="icon"><Send className="h-4 w-4" /></Button></div>
      </CardContent>
    </Card>
  );
}

export function AssistantAnalysisCards({ onSelect }: { onSelect: (signal: string) => void }) {
  return (
    <Card className="bg-card text-card-foreground shadow-sm">
      <CardHeader className="px-4 py-3"><CardTitle>Suggested insight workflows</CardTitle></CardHeader>
      <CardContent className="grid gap-2 px-4 pb-3 md:grid-cols-2">
        {assistantCards.map((card: (typeof assistantCards)[number]) => <button key={card.title} onClick={() => onSelect(card.title)} className="rounded-lg border border-border bg-background p-3 text-left hover:bg-secondary"><p className="text-sm font-semibold">{card.title}</p><p className="mt-1 text-xs text-muted-foreground">{card.prompt}</p><p className="mt-2 text-xs font-medium">Evidence: {card.evidence}</p></button>)}
      </CardContent>
    </Card>
  );
}

export function DrilldownTable({ items, onSelect, title = 'Evidence table' }: { items?: MetricRecord[]; onSelect: (signal: string) => void; title?: string }) {
  const tableItems = items ?? records;
  return (
    <Card className="border-border bg-card text-card-foreground shadow-sm">
      <CardHeader className="px-4 py-3"><CardTitle>{title}</CardTitle></CardHeader>
      <CardContent className="px-4 pb-3">
        <Table>
          <TableHeader><TableRow><TableHead>School</TableHead><TableHead>Metric</TableHead><TableHead>Group</TableHead><TableHead className="text-right">Value</TableHead><TableHead className="text-right">Target</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
          <TableBody>
            {tableItems.map((record: MetricRecord) => (
              <TableRow key={record.id} onClick={() => onSelect(record.metric)} className="cursor-pointer">
                <TableCell className="font-medium">{record.school}</TableCell><TableCell>{record.metric}</TableCell><TableCell>{record.studentGroup}</TableCell><TableCell className="text-right">{record.value}%</TableCell><TableCell className="text-right">{record.target}%</TableCell><TableCell><Badge variant={record.status === 'Priority' ? 'destructive' : record.status === 'Watch' ? 'secondary' : 'default'}>{record.status}</Badge></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

export { executiveKpis };
