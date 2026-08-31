import type { DevelopmentRole } from '@/lib/role-context';

export type AnalyticsProviderKind = 'Mock' | 'Power BI REST' | 'Power BI MCP';
export type AnalyticsResultState = 'loading' | 'empty' | 'unauthorised' | 'error' | 'success';
export type AnalyticsVisualType = 'kpi' | 'chart' | 'table' | 'filter' | 'assistant';
export type ExpectedResultShape = 'scalar' | 'time-series' | 'category-series' | 'tabular' | 'assistant-context';

export type AnalyticsFilterContext = Record<string, string | number | boolean | null | undefined>;

export type GovernedQueryDefinition = {
  queryId: string;
  displayName: string;
  semanticModelId: string;
  approvedMeasureNames: string[];
  daxTemplate: string | null;
  permittedFilterParameters: string[];
  expectedResultShape: ExpectedResultShape;
  supportedApplicationRoles: DevelopmentRole[];
  outputVisualType: AnalyticsVisualType;
  status: 'awaiting-schema-inspection' | 'approved' | 'retired';
  notes: string;
  verifiedModelElements?: {
    dateField: string;
    dailyReportOpensDisplayLabel: string;
    dailyReportOpensMeasure: string;
    weeklyReportOpensDisplayLabel: string;
    weeklyReportOpensMeasure: string;
    expectedResultFields: string[];
    blankHandling: string;
  };
};

export type AnalyticalResult<TData = unknown> = {
  state: AnalyticsResultState;
  provider: AnalyticsProviderKind;
  queryId: string;
  displayName: string;
  semanticModelId: string;
  data: TData | null;
  measureNames: string[];
  filterContext: AnalyticsFilterContext;
  isMockData: boolean;
  errorDetails?: string;
  lastSuccessfulQueryTimestamp?: string;
  lastQueryDurationMs?: number;
};

export type AuthenticatedAnalyticsContext = {
  userPrincipalName?: string;
  objectId?: string;
  tenantId?: string;
  developmentRole: DevelopmentRole;
  filterContext: AnalyticsFilterContext;
};

export interface AnalyticsProvider {
  kind: AnalyticsProviderKind;
  executeGovernedQuery: <TData>(query: GovernedQueryDefinition, context: AuthenticatedAnalyticsContext) => Promise<AnalyticalResult<TData>>;
}

export const analyticsServerConfigurationPlaceholders = {
  workspaceId: 'f8a1522b-e94c-4e57-a60e-392d892e27ff',
  usageMetricsSemanticModelId: '543c76d7-c6b0-4b53-9c3a-717964149bc6',
  configurationSource: 'Secure server-side configuration source required before live provider activation',
  clientSecurityBoundary: 'React client never stores credentials, secrets, access tokens, or direct MCP endpoint configuration',
} as const;

export const governedQueryRegistry: GovernedQueryDefinition[] = [
  {
    queryId: 'usage-report-opens-over-time',
    displayName: 'Report Opens Over Time',
    semanticModelId: analyticsServerConfigurationPlaceholders.usageMetricsSemanticModelId,
    approvedMeasureNames: ['Report views', 'Weekly Views'],
    daxTemplate: null,
    permittedFilterParameters: ['dateRange', 'workspaceId', 'semanticModelId'],
    expectedResultShape: 'time-series',
    supportedApplicationRoles: ['Data Analyst (Administrator)'],
    outputVisualType: 'chart',
    status: 'awaiting-schema-inspection',
    notes: 'Verified model elements are registered for future server-side query binding. DAX remains server-side only and is not stored in browser code.',
    verifiedModelElements: {
      dateField: 'Dates[Date]',
      dailyReportOpensDisplayLabel: 'Daily report opens',
      dailyReportOpensMeasure: 'Report views',
      weeklyReportOpensDisplayLabel: 'Weekly report opens',
      weeklyReportOpensMeasure: 'Weekly Views',
      expectedResultFields: ['date', 'dailyReportOpens', 'weeklyReportOpens'],
      blankHandling: 'Preserve Weekly Views BLANK results as null',
    },
  }
];



export class MockAnalyticsProvider implements AnalyticsProvider {
  kind: AnalyticsProviderKind = 'Mock';

  async executeGovernedQuery<TData>(query: GovernedQueryDefinition, context: AuthenticatedAnalyticsContext): Promise<AnalyticalResult<TData>> {
    const reportOpenRows = [
      { date: '2026-08-03', dailyReportOpens: 24, weeklyReportOpens: 118 },
      { date: '2026-08-04', dailyReportOpens: 31, weeklyReportOpens: 126 },
      { date: '2026-08-05', dailyReportOpens: 28, weeklyReportOpens: null },
      { date: '2026-08-06', dailyReportOpens: 36, weeklyReportOpens: 141 },
      { date: '2026-08-07', dailyReportOpens: 19, weeklyReportOpens: 132 },
      { date: '2026-08-10', dailyReportOpens: 42, weeklyReportOpens: 156 },
      { date: '2026-08-11', dailyReportOpens: 38, weeklyReportOpens: null },
    ];

    return {
      state: reportOpenRows.length > 0 ? 'success' : 'empty',
      provider: this.kind,
      queryId: query.queryId,
      displayName: query.displayName,
      semanticModelId: query.semanticModelId,
      data: reportOpenRows as TData,
      measureNames: query.approvedMeasureNames,
      filterContext: context.filterContext,
      isMockData: true,

    };
  }
}

export class PowerBIQueryProvider implements AnalyticsProvider {
  kind: AnalyticsProviderKind = 'Power BI REST';

  async executeGovernedQuery<TData>(query: GovernedQueryDefinition, context: AuthenticatedAnalyticsContext): Promise<AnalyticalResult<TData>> {
    return {
      state: 'unauthorised',
      provider: this.kind,
      queryId: query.queryId,
      displayName: query.displayName,
      semanticModelId: query.semanticModelId,
      data: null,
      measureNames: query.approvedMeasureNames,
      filterContext: context.filterContext,
      isMockData: false,
      errorDetails: 'Live Power BI Execute Queries must be invoked by a secure server-side API using approved measures and server-side configuration. Browser-side execution is intentionally disabled.',
    };
  }
}

export class PowerBIMcpProvider implements AnalyticsProvider {
  kind: AnalyticsProviderKind = 'Power BI MCP';

  async executeGovernedQuery<TData>(query: GovernedQueryDefinition, context: AuthenticatedAnalyticsContext): Promise<AnalyticalResult<TData>> {
    return {
      state: 'unauthorised',
      provider: this.kind,
      queryId: query.queryId,
      displayName: query.displayName,
      semanticModelId: query.semanticModelId,
      data: null,
      measureNames: query.approvedMeasureNames,
      filterContext: context.filterContext,
      isMockData: false,
      errorDetails: 'Power BI MCP access is reserved for a server-side agent or framework. React components may request assistant context through a secure application service only.',
    };
  }
}

export const activeAnalyticsProvider: AnalyticsProvider = new MockAnalyticsProvider();

export const integrationStatusSnapshot = {
  activeProvider: activeAnalyticsProvider.kind,
  semanticModelConnectionStatus: 'Not validated',
  authenticatedIdentityStatus: 'Not configured',
  rlsContextStatus: 'Not validated',
  lastSuccessfulQueryTimestamp: 'Never',
  lastQueryDurationMs: 'Not applicable',
  measureUsed: 'Report views; Weekly Views',
  filterContext: 'Configuration target only: workspaceId=f8a1522b-e94c-4e57-a60e-392d892e27ff; semanticModelId=543c76d7-c6b0-4b53-9c3a-717964149bc6',
  errorDetails: 'Secure server-side provider not configured; Microsoft authentication not configured; live query execution not attempted',
  dataIndicator: 'Mock data',
} as const;
