import { CheckCircle2, CircleDashed, Lock, ShieldCheck } from 'lucide-react';
import { analyticsServerConfigurationPlaceholders } from '@/lib/analytics-providers';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const readinessItems = [
  { label: 'UI prepared', value: 'Complete', complete: true },
  { label: 'Mock provider', value: 'Active', complete: true },
  { label: 'Secure server-side provider', value: 'Not configured', complete: false },
  { label: 'Microsoft authentication', value: 'Not configured', complete: false },
  { label: 'Power BI semantic model connection', value: 'Not validated', complete: false },
  { label: 'Live query execution', value: 'Not attempted', complete: false },
  { label: 'Live result rendering', value: 'Not active', complete: false },
];

export function IntegrationReadinessPanel() {
  return (
    <Card className="bg-card text-card-foreground shadow-sm">
      <CardHeader className="px-4 py-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle className="flex items-center gap-2"><ShieldCheck className="h-5 w-5" />Technical integration readiness</CardTitle>
          <Badge variant="secondary">Administrator only</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 px-4 pb-4">
        <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
          {readinessItems.map((item: (typeof readinessItems)[number]) => {
            const Icon = item.complete ? CheckCircle2 : CircleDashed;
            return (
              <div key={item.label} className="rounded-lg border border-border bg-background p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold">{item.label}</p>
                  <Icon className="h-4 w-4" />
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{item.value}</p>
              </div>
            );
          })}
        </div>
        <div className="grid gap-2 md:grid-cols-2">
          <div className="rounded-lg bg-secondary p-3 text-secondary-foreground">
            <p className="text-xs font-semibold">Configuration targets only</p>
            <p className="mt-1 text-sm">Workspace ID: {analyticsServerConfigurationPlaceholders.workspaceId}</p>
            <p className="text-sm">Semantic model ID: {analyticsServerConfigurationPlaceholders.usageMetricsSemanticModelId}</p>
          </div>
          <div className="rounded-lg bg-secondary p-3 text-secondary-foreground">
            <p className="text-xs font-semibold">Mock data state</p>
            <p className="mt-1 text-sm">Last live retrieval: Never</p>
            <p className="text-sm">Query duration: Not applicable</p>
            <p className="text-sm">Authenticated identity: Not configured</p>
            <p className="text-sm">RLS status: Not validated</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-background p-3">
          <Button disabled><Lock className="mr-2 h-4 w-4" />Validate live Power BI connection</Button>
          <p className="text-sm text-muted-foreground">Requires a secure server-side provider with delegated Microsoft authentication.</p>
        </div>
      </CardContent>
    </Card>
  );
}
