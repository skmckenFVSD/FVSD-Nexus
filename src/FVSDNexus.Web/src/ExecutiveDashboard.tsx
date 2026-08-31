import { useEffect, useMemo, useRef, useState } from 'react'
import { BarChart3, BookOpenText, Calculator, CircleAlert, Gauge, School, Target, Users } from 'lucide-react'

export type ExecutiveFilters = {
  school: string[]
  schoolYear: string[]
  grade: string[]
  period: string[]
}

type ExecutiveInstrumentDefinition = {
  key: string
  label: string
  curriculum: string
  assessmentGroup: string
  grades: string[]
  sortOrder: number
}

type ExecutiveDomainDefinition = {
  key: string
  label: string
  instruments: ExecutiveInstrumentDefinition[]
}

type TermDefinition = {
  descriptiveTerm: string
  sortOrder: number
  termGroup: string
  termGroupSortOrder: number
  cohortGroup: string
  range: string | null
  lowValue: number | null
  highValue: number | null
  fillHexCode: string | null
  fontHexCode: string | null
  termGroupFillHexCode: string | null
  termGroupFontHexCode: string | null
}

type ExecutiveOverviewRow = {
  instrument: string
  instrumentSortOrder: number
  schoolYear: string
  schoolYearSortOrder: number
  period: string
  periodSortOrder: number
  descriptiveTerm: string
  termSortOrder: number
  termGroup: string
  termGroupSortOrder: number
  range: string | null
  lowValue: number | null
  highValue: number | null
  fillHexCode: string | null
  fontHexCode: string | null
  submitted: number
  medianScore: number | null
}

type ExecutiveSchoolComparisonRow = {
  school: string
  schoolYear: string
  schoolYearSortOrder: number
  grade: string
  gradeSortOrder: number
  period: string
  periodSortOrder: number
  termGroup: string
  termGroupSortOrder: number
  medianScore: number | null
}

type MatrixChartFocus = {
  school: string
  schoolYear: string
  grade: string
}

const periodOrder = ['Fall', 'Winter', 'Spring']
const matrixTermGroups = ['Below Average', 'Average and Above']
const assessmentContext: Record<string, string> = {
  TOSREC: 'Term submissions and median performance',
  TOWRE: 'Reading fluency and efficiency trends',
  CTOPP: 'Phonological processing indicators',
  PNSA: 'Foundational numeracy risk indicators',
  'WRAT-5': 'Mathematics performance trends',
}

async function getJson<T>(url: string): Promise<T> {
  const response = await fetch(url, { credentials: 'include' })
  if (!response.ok) throw new Error(`${response.status}`)
  return response.json() as Promise<T>
}

export function ExecutiveDashboard({ filters }: { filters: ExecutiveFilters }) {
  const [domains, setDomains] = useState<ExecutiveDomainDefinition[]>([])
  const [terms, setTerms] = useState<TermDefinition[]>([])
  const [activeDomainKey, setActiveDomainKey] = useState('literacy')
  const [assessmentGroup, setAssessmentGroup] = useState('')
  const [overview, setOverview] = useState<ExecutiveOverviewRow[]>([])
  const [focusedOverview, setFocusedOverview] = useState<ExecutiveOverviewRow[] | null>(null)
  const [comparison, setComparison] = useState<ExecutiveSchoolComparisonRow[]>([])
  const [loading, setLoading] = useState(true)
  const [chartLoading, setChartLoading] = useState(false)
  const [chartFocus, setChartFocus] = useState<MatrixChartFocus | null>(null)
  const [error, setError] = useState<string | null>(null)
  const chartRequest = useRef(0)

  const activeDomain = domains.find((domain) => domain.key === activeDomainKey) ?? null
  const chartOverview = focusedOverview ?? overview
  const matrixInstruments = useMemo(
    () => activeDomain?.instruments.filter((instrument) =>
      filters.grade.length === 0
      || instrument.grades.some((grade) => filters.grade.includes(grade))) ?? [],
    [activeDomain, filters.grade],
  )
  const visibleOverviewInstruments = useMemo(
    () => activeDomain?.instruments.filter((instrument) =>
      instrument.assessmentGroup === assessmentGroup
      && chartOverview.some((row) =>
        row.instrument === instrument.label && (row.submitted > 0 || row.medianScore !== null))) ?? [],
    [activeDomain, assessmentGroup, chartOverview],
  )

  useEffect(() => {
    Promise.all([
      getJson<ExecutiveDomainDefinition[]>('/api/executive/domains'),
      getJson<TermDefinition[]>('/api/executive/terms'),
    ])
      .then(([domainOptions, termOptions]) => {
        setDomains(domainOptions)
        setTerms(termOptions)
      })
      .catch(() => setError('The Executive Dashboard configuration could not be loaded from FVSDAnalytics.'))
  }, [])

  useEffect(() => {
    if (!activeDomain) return
    const available = matrixInstruments.some((instrument) => instrument.assessmentGroup === assessmentGroup)
    if (!available) setAssessmentGroup(matrixInstruments[0]?.assessmentGroup ?? '')
  }, [activeDomain, assessmentGroup, matrixInstruments])

  useEffect(() => {
    if (!activeDomain || !assessmentGroup
      || !matrixInstruments.some((instrument) => instrument.assessmentGroup === assessmentGroup)) return

    const commonQuery = buildCommonQuery(activeDomain.key, filters)
    const matrixQuery = new URLSearchParams(commonQuery)
    matrixQuery.set('assessmentGroup', assessmentGroup)

    chartRequest.current += 1
    setChartFocus(null)
    setFocusedOverview(null)
    setChartLoading(false)
    setLoading(true)
    setError(null)
    Promise.all([
      getJson<ExecutiveOverviewRow[]>(`/api/executive/overview?${commonQuery.toString()}`),
      getJson<ExecutiveSchoolComparisonRow[]>(`/api/executive/school-comparison?${matrixQuery.toString()}`),
    ])
      .then(([overviewRows, comparisonRows]) => {
        setOverview(overviewRows)
        setComparison(comparisonRows)
      })
      .catch(() => setError(`The ${activeDomain.label} dashboard could not be loaded from FVSDAnalytics.`))
      .finally(() => setLoading(false))
  }, [activeDomain, assessmentGroup, filters, matrixInstruments])

  const selectMatrixChartFocus = async (focus: MatrixChartFocus) => {
    const isSelected = chartFocus?.school === focus.school
      && chartFocus.schoolYear === focus.schoolYear
      && chartFocus.grade === focus.grade
    const requestId = ++chartRequest.current

    if (isSelected) {
      setChartFocus(null)
      setFocusedOverview(null)
      setChartLoading(false)
      return
    }
    if (!activeDomain) return

    setChartFocus(focus)
    setChartLoading(true)
    setError(null)
    const focusFilters: ExecutiveFilters = {
      ...filters,
      school: [focus.school],
      schoolYear: [focus.schoolYear],
      grade: [focus.grade],
    }
    const query = buildCommonQuery(activeDomain.key, focusFilters)

    try {
      const rows = await getJson<ExecutiveOverviewRow[]>(`/api/executive/overview?${query.toString()}`)
      if (requestId === chartRequest.current) setFocusedOverview(rows)
    } catch {
      if (requestId === chartRequest.current) {
        setChartFocus(null)
        setFocusedOverview(null)
        setError(`The chart could not be focused on ${focus.school}, ${focus.schoolYear}, ${focus.grade}.`)
      }
    } finally {
      if (requestId === chartRequest.current) setChartLoading(false)
    }
  }

  const clearMatrixChartFocus = () => {
    chartRequest.current += 1
    setChartFocus(null)
    setFocusedOverview(null)
    setChartLoading(false)
  }

  const visiblePeriods = filters.period.length > 0
    ? periodOrder.filter((period) => filters.period.includes(period))
    : periodOrder
  const executiveSignals = buildExecutiveSignals(
    activeDomain?.label ?? 'Executive',
    assessmentGroup,
    overview,
    comparison,
    visiblePeriods,
    loading,
  )

  return (
    <div className="executive-dashboard">
      <section className="domain-toolbar" aria-label="Executive dashboard focus area">
        <div className="domain-toolbar-heading">
          <span className="eyebrow">Main area of focus</span>
          <h2>{activeDomain?.label ?? 'Executive'} overview</h2>
          <p>Descriptive-term submissions and governed median score by school year and period.</p>
        </div>
        <div className="domain-controls">
          <div className="domain-tabs" role="tablist" aria-label="Achievement domain">
            {domains.map((domain) => (
              <button
                type="button"
                role="tab"
                aria-selected={domain.key === activeDomainKey}
                className={domain.key === activeDomainKey ? 'active' : ''}
                onClick={() => {
                  setLoading(true)
                  setActiveDomainKey(domain.key)
                }}
                key={domain.key}
              >
                {domain.key === 'literacy' ? <BookOpenText size={17} /> : <Calculator size={17} />}
                {domain.label}
              </button>
            ))}
            <button type="button" role="tab" aria-selected="false" disabled>
              <span className="wellbeing-mark">W</span> Wellbeing <small>Later</small>
            </button>
          </div>
          <label className="focus-assessment-selector">
            <span>Assessment group</span>
            <select
              value={assessmentGroup}
              onChange={(event) => {
                setLoading(true)
                setAssessmentGroup(event.target.value)
              }}
            >
              {matrixInstruments.map((instrument) => (
                <option value={instrument.assessmentGroup} key={instrument.key}>{instrument.label}</option>
              ))}
            </select>
          </label>
        </div>
      </section>

      <section className="executive-summary" aria-labelledby="executive-summary-title">
        <div className="executive-summary-heading">
          <div>
            <span className="eyebrow">Executive signals · {activeDomain?.label ?? 'Executive'} / {assessmentGroup || 'Assessment'}</span>
            <h2 id="executive-summary-title">What needs our attention?</h2>
          </div>
        </div>
        <div className="executive-signal-grid">
          <article className="executive-signal-card performance-signal">
            <div className="signal-icon"><Gauge size={17} /></div>
            <div><strong>Performance</strong><p>{executiveSignals.performance}</p></div>
          </article>
          <article className="executive-signal-card participation-signal">
            <div className="signal-icon"><Users size={17} /></div>
            <div><strong>Participation</strong><p>{executiveSignals.participation}</p></div>
          </article>
          <article className="executive-signal-card focus-signal">
            <div className="signal-icon"><Target size={17} /></div>
            <div><strong>Focus</strong><p>{executiveSignals.focus}</p></div>
          </article>
        </div>
      </section>

      {error ? <div className="error-banner"><CircleAlert size={18} />{error}</div> : null}

      <section className="card matrix-section">
        <div className="card-heading executive-section-heading matrix-heading">
          <div>
            <span className="eyebrow">School comparison</span>
            <h2>Median score by period and cohort group</h2>
            <p>School years and grades remain vertical; periods and compatible cohort groups remain fixed. Select a row to focus the chart.</p>
          </div>
        </div>
        {loading ? <DashboardSkeleton blocks={1} /> : (
          <SchoolComparisonMatrix
            rows={comparison}
            periods={visiblePeriods}
            termDefinitions={terms}
            selectedFocus={chartFocus}
            onRowSelect={selectMatrixChartFocus}
          />
        )}
      </section>

      <section className="card overview-section" aria-label={`${activeDomain?.label ?? 'Executive'} assessment overview`}>
        {chartFocus ? (
          <div className="chart-focus-banner" role="status">
            <div><strong>Chart focus</strong><span>{chartFocus.school} · {chartFocus.schoolYear} · {chartFocus.grade}</span></div>
            <button type="button" onClick={clearMatrixChartFocus}>Clear focus</button>
          </div>
        ) : null}
        {loading || chartLoading ? (
          <DashboardSkeleton blocks={1} />
        ) : activeDomain ? (
          visibleOverviewInstruments.length > 0 ? (
            <div className="overview-chart-grid">
              {visibleOverviewInstruments.map((instrument) => (
                <AssessmentOverviewChart
                  label={instrument.label}
                  description={assessmentContext[instrument.label] ?? 'Assessment performance and participation trends'}
                  rows={chartOverview.filter((row) => row.instrument === instrument.label)}
                  termDefinitions={terms}
                  periods={visiblePeriods}
                  key={instrument.key}
                />
              ))}
            </div>
          ) : <div className="overview-empty"><BarChart3 size={20} />No submitted assessments match the current filters and Assessment Group.</div>
        ) : null}
      </section>
    </div>
  )
}

function buildExecutiveSignals(
  domainLabel: string,
  assessmentGroup: string,
  overview: ExecutiveOverviewRow[],
  comparison: ExecutiveSchoolComparisonRow[],
  visiblePeriods: string[],
  loading: boolean,
) {
  const assessmentLabel = assessmentGroup || `selected ${domainLabel.toLowerCase()} assessment`
  if (loading) {
    return {
      performance: `Updating ${assessmentLabel} performance for the selected context…`,
      participation: `Updating ${assessmentLabel} participation for the selected context…`,
      focus: `Updating school-level ${assessmentLabel} movement…`,
    }
  }

  const assessmentRows = overview.filter((row) => row.instrument === assessmentGroup)
  const latestOverviewYearSort = Math.max(...assessmentRows.map((row) => row.schoolYearSortOrder))
  const latestOverviewRows = Number.isFinite(latestOverviewYearSort)
    ? assessmentRows.filter((row) => row.schoolYearSortOrder === latestOverviewYearSort)
    : []
  const periodSummaries = visiblePeriods
    .map((period) => {
      const rows = latestOverviewRows.filter((row) => row.period === period)
      return {
        period,
        schoolYear: rows[0]?.schoolYear ?? '',
        periodSortOrder: rows[0]?.periodSortOrder ?? Number.MAX_SAFE_INTEGER,
        medianScore: rows.find((row) => row.medianScore !== null)?.medianScore ?? null,
        submitted: rows.reduce((total, row) => total + row.submitted, 0),
      }
    })
    .filter((summary) => summary.medianScore !== null || summary.submitted > 0)
    .sort((left, right) => left.periodSortOrder - right.periodSortOrder)

  const medianSummaries = periodSummaries.filter((summary) => summary.medianScore !== null)
  let performance = `No ${assessmentLabel} median is available for the selected context.`
  if (medianSummaries.length === 1) {
    const summary = medianSummaries[0]
    performance = `${assessmentLabel} median is ${Math.round(summary.medianScore!)} in ${summary.period}, ${summary.schoolYear}.`
  } else if (medianSummaries.length > 1) {
    const first = medianSummaries[0]
    const last = medianSummaries.at(-1)!
    const firstValue = Math.round(first.medianScore!)
    const lastValue = Math.round(last.medianScore!)
    const movement = lastValue > firstValue ? 'increased' : lastValue < firstValue ? 'decreased' : 'remained stable'
    performance = `${assessmentLabel} median ${movement} from ${firstValue} in ${first.period} to ${lastValue} in ${last.period}, ${last.schoolYear}.`
  }

  const latestParticipation = periodSummaries.at(-1)
  const participation = latestParticipation
    ? `${latestParticipation.submitted.toLocaleString()} ${assessmentLabel} submissions are represented in ${latestParticipation.period}, ${latestParticipation.schoolYear}.`
    : `No ${assessmentLabel} submissions are available for the selected context.`

  const latestComparisonYearSort = Math.max(...comparison.map((row) => row.schoolYearSortOrder))
  const latestComparisonRows = Number.isFinite(latestComparisonYearSort)
    ? comparison.filter((row) =>
      row.schoolYearSortOrder === latestComparisonYearSort && visiblePeriods.includes(row.period))
    : []
  const series = new Map<string, ExecutiveSchoolComparisonRow[]>()
  latestComparisonRows.forEach((row) => {
    const key = `${row.school}\u0000${row.grade}\u0000${row.termGroup}`
    const values = series.get(key) ?? []
    values.push(row)
    series.set(key, values)
  })
  const decliningSchools = new Set<string>()
  series.forEach((rows) => {
    const ordered = rows
      .filter((row) => row.medianScore !== null)
      .sort((left, right) => left.periodSortOrder - right.periodSortOrder)
    if (ordered.length < 2) return
    const previous = ordered.at(-2)?.medianScore
    const current = ordered.at(-1)?.medianScore
    if (previous !== null && previous !== undefined && current !== null && current !== undefined
      && Math.round(current) < Math.round(previous)) {
      decliningSchools.add(ordered[0].school)
    }
  })
  const comparisonYear = latestComparisonRows[0]?.schoolYear
  const focus = visiblePeriods.length < 2
    ? `Select at least two periods to evaluate school movement for ${assessmentLabel}.`
    : decliningSchools.size === 0
      ? `No schools show a declining ${assessmentLabel} comparison across the latest available periods${comparisonYear ? ` in ${comparisonYear}` : ''}.`
      : `${decliningSchools.size} ${decliningSchools.size === 1 ? 'school shows' : 'schools show'} a declining ${assessmentLabel} comparison across the latest available periods${comparisonYear ? ` in ${comparisonYear}` : ''}.`

  return { performance, participation, focus }
}

function buildCommonQuery(domain: string, filters: ExecutiveFilters) {
  const query = new URLSearchParams({ domain })
  filters.school.forEach((value) => query.append('school', value))
  filters.schoolYear.forEach((value) => query.append('schoolYear', value))
  filters.period.forEach((value) => query.append('period', value))
  filters.grade.forEach((value) => query.append('grade', value))
  return query
}

function AssessmentOverviewChart({ label, description, rows, termDefinitions, periods }: {
  label: string
  description: string
  rows: ExecutiveOverviewRow[]
  termDefinitions: TermDefinition[]
  periods: string[]
}) {
  const [chartContainerRef, measuredWidth] = useMeasuredWidth<HTMLDivElement>()
  const terms = useMemo(() => {
    return rows
      .map((row) => {
        const definition = termDefinitions.find((term) =>
          term.descriptiveTerm === row.descriptiveTerm && term.termGroup === row.termGroup)
        return {
        descriptiveTerm: row.descriptiveTerm,
        sortOrder: row.termSortOrder,
        termGroup: row.termGroup,
        termGroupSortOrder: row.termGroupSortOrder,
          cohortGroup: definition?.cohortGroup ?? row.termGroup,
        range: row.range,
        lowValue: row.lowValue,
        highValue: row.highValue,
        fillHexCode: row.fillHexCode,
        fontHexCode: row.fontHexCode,
          termGroupFillHexCode: definition?.termGroupFillHexCode ?? null,
          termGroupFontHexCode: definition?.termGroupFontHexCode ?? null,
        }
      })
      .filter((term, index, all) => all.findIndex((item) => item.descriptiveTerm === term.descriptiveTerm) === index)
      .sort((left, right) => left.sortOrder - right.sortOrder)
  }, [rows, termDefinitions])

  if (rows.length === 0) {
    return (
      <article className="assessment-chart empty-chart">
        <div className="assessment-chart-title"><BarChart3 size={18} /><div><strong>{label}</strong><span>{description}</span></div></div>
        <p>No submitted assessments match the current filters.</p>
      </article>
    )
  }

  const categories = [...new Map(
    rows
      .filter((row) => periods.includes(row.period))
      .map((row) => [`${row.schoolYear}\u0000${row.period}`, {
        schoolYear: row.schoolYear,
        schoolYearSortOrder: row.schoolYearSortOrder,
        period: row.period,
        periodSortOrder: row.periodSortOrder,
      }]),
  ).values()].sort((left, right) =>
    left.schoolYearSortOrder - right.schoolYearSortOrder || left.periodSortOrder - right.periodSortOrder)
  const minimumChartWidth = Math.max(340, categories.length * 92 + 102)
  const width = Math.max(measuredWidth || 760, minimumChartWidth)
  const height = Math.round(Math.max(300, Math.min(350, width * .46)))
  const plot = { left: 48, right: 54, top: 28, bottom: 74 }
  const plotWidth = width - plot.left - plot.right
  const plotHeight = height - plot.top - plot.bottom
  const bottom = plot.top + plotHeight
  const maxSubmitted = niceAxisMaximum(Math.max(...rows.map((row) => row.submitted), 1))
  const medians = categories.map((category) => rows.find((row) =>
    row.schoolYear === category.schoolYear && row.period === category.period)?.medianScore ?? null)
  const maximumMedian = Math.max(...medians.flatMap((value) => value === null ? [] : [value]), 1)
  const scoreMaximum = Math.max(10, Math.ceil((maximumMedian + 5) / 10) * 10)
  const periodWidth = plotWidth / Math.max(categories.length, 1)
  const groupWidth = periodWidth * .72
  const barWidth = Math.min(18, Math.max(5, groupWidth / Math.max(terms.length, 1) - 2))
  const actualGroupWidth = terms.length * barWidth + Math.max(terms.length - 1, 0) * 2
  const medianPoints = categories.flatMap((category, index) => {
    const value = medians[index]
    if (value === null) return []
    return [{
      x: plot.left + periodWidth * index + periodWidth / 2,
      y: bottom - (value / scoreMaximum) * plotHeight,
      value,
      schoolYear: category.schoolYear,
      period: category.period,
    }]
  })
  const yearGroups = [...new Set(categories.map((category) => category.schoolYear))].map((schoolYear) => {
    const indexes = categories.flatMap((category, index) => category.schoolYear === schoolYear ? [index] : [])
    return {
      schoolYear,
      start: indexes[0] ?? 0,
      end: indexes.at(-1) ?? 0,
    }
  })

  return (
    <article className="assessment-chart">
      <div className="assessment-chart-title"><BarChart3 size={18} /><div><strong>{label}</strong><span>{description}</span></div></div>
      <div className="chart-svg-wrap" ref={chartContainerRef}>
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`${label} submitted assessments and median score by school year and period`}>
          {[0, .5, 1].map((ratio) => {
            const y = bottom - ratio * plotHeight
            return (
              <g key={ratio}>
                <line x1={plot.left} y1={y} x2={width - plot.right} y2={y} className="chart-grid-line" />
                <text x={plot.left - 8} y={y + 4} textAnchor="end" className="chart-axis-label">{Math.round(maxSubmitted * ratio).toLocaleString()}</text>
                <text x={width - plot.right + 8} y={y + 4} className="chart-axis-label">{Math.round(scoreMaximum * ratio)}</text>
              </g>
            )
          })}
          <text transform={`translate(13 ${plot.top + plotHeight / 2}) rotate(-90)`} textAnchor="middle" className="chart-axis-title">Submitted</text>
          <text transform={`translate(${width - 10} ${plot.top + plotHeight / 2}) rotate(-90)`} textAnchor="middle" className="chart-axis-title median-axis-title">Median score</text>

          {categories.map((category, periodIndex) => {
            const center = plot.left + periodWidth * periodIndex + periodWidth / 2
            const start = center - actualGroupWidth / 2
            return (
              <g key={`${category.schoolYear}-${category.period}`}>
                {terms.map((term, termIndex) => {
                  const row = rows.find((item) =>
                    item.schoolYear === category.schoolYear
                    && item.period === category.period
                    && item.descriptiveTerm === term.descriptiveTerm)
                  const value = row?.submitted ?? 0
                  const barHeight = value / maxSubmitted * plotHeight
                  return (
                    <rect
                      x={start + termIndex * (barWidth + 2)}
                      y={bottom - barHeight}
                      width={barWidth}
                      height={barHeight}
                      rx="1.5"
                      fill={term.fillHexCode ?? '#d8dee8'}
                      key={term.descriptiveTerm}
                    >
                      <title>{`${category.schoolYear} · ${category.period} · ${term.descriptiveTerm}: ${value.toLocaleString()} submitted`}</title>
                    </rect>
                  )
                })}
                <text x={center} y={bottom + 22} textAnchor="middle" className="chart-period-label">{category.period}</text>
              </g>
            )
          })}

          {yearGroups.map((group) => {
            const start = plot.left + periodWidth * group.start
            const end = plot.left + periodWidth * (group.end + 1)
            return (
              <g key={group.schoolYear}>
                <line x1={start + 4} y1={bottom + 31} x2={end - 4} y2={bottom + 31} className="chart-year-line" />
                <text x={(start + end) / 2} y={bottom + 48} textAnchor="middle" className="chart-year-label">{group.schoolYear}</text>
              </g>
            )
          })}

          {medianPoints.length > 1 ? <polyline points={medianPoints.map((point) => `${point.x},${point.y}`).join(' ')} className="median-line" /> : null}
          {medianPoints.map((point) => (
            <g key={`${point.schoolYear}-${point.period}`}>
              <circle cx={point.x} cy={point.y} r="4" className="median-point" />
              <rect x={point.x - 17} y={Math.max(point.y - 24, 2)} width="34" height="18" rx="4" className="median-label-bg" />
              <text x={point.x} y={Math.max(point.y - 11, 15)} textAnchor="middle" className="median-label">{Math.round(point.value)}</text>
            </g>
          ))}
        </svg>
      </div>
      <PerformanceClassificationKey assessmentLabel={label} terms={terms} />
    </article>
  )
}

function PerformanceClassificationKey({ assessmentLabel, terms }: {
  assessmentLabel: string
  terms: TermDefinition[]
}) {
  const summaryOnly = ['PNSA', 'ADLOF'].includes(assessmentLabel.trim().toUpperCase())
  const groups = ['Foundation', 'Curriculum'].map((cohortGroup) => {
    const groupTerms = terms.filter((term) => term.cohortGroup === cohortGroup)
    const representative = groupTerms[0]
    return {
      cohortGroup,
      terms: groupTerms,
      fill: representative?.termGroupFillHexCode ?? (cohortGroup === 'Foundation' ? '#B20000' : '#00803A'),
      font: representative?.termGroupFontHexCode ?? '#FFFFFF',
    }
  })

  return (
    <div className={`performance-key${summaryOnly ? ' summary-only' : ''}`} aria-label={`${assessmentLabel} performance classification key`}>
      {groups.map((group) => (
        <section className="performance-key-group" aria-label={group.cohortGroup} key={group.cohortGroup}>
          <div className="performance-key-heading" style={{ backgroundColor: group.fill, color: group.font }}>
            {group.cohortGroup}
          </div>
          {!summaryOnly ? (
            <div className="performance-key-bands">
              {group.terms.map((term) => {
                const lightForeground = isLightLegendForeground(term.fontHexCode)
                return (
                  <div
                    className={`performance-key-band ${lightForeground ? 'light-foreground' : 'dark-foreground'}`}
                    style={{ backgroundColor: term.fillHexCode ?? '#d8dee8', color: term.fontHexCode ?? '#1A1A1A' }}
                    key={term.descriptiveTerm}
                  >
                    <span className="performance-key-name">{term.descriptiveTerm}</span>
                    {term.range ? <span className="performance-key-range">{term.range}</span> : null}
                  </div>
                )
              })}
            </div>
          ) : null}
        </section>
      ))}
    </div>
  )
}

function isLightLegendForeground(colour: string | null) {
  return !colour || colour.trim().toUpperCase() === '#FFFFFF' || colour.trim().toUpperCase() === 'WHITE'
}

function SchoolComparisonMatrix({ rows, periods, termDefinitions, selectedFocus, onRowSelect }: {
  rows: ExecutiveSchoolComparisonRow[]
  periods: string[]
  termDefinitions: TermDefinition[]
  selectedFocus: MatrixChartFocus | null
  onRowSelect: (focus: MatrixChartFocus) => void
}) {
  const cohortLabels = useMemo(() => {
    return new Map(termDefinitions
      .filter((term) => matrixTermGroups.includes(term.termGroup) && term.cohortGroup)
      .map((term) => [term.termGroup, term.cohortGroup]))
  }, [termDefinitions])

  const grouped = useMemo(() => {
    const schools = new Map<string, Map<string, Map<string, ExecutiveSchoolComparisonRow[]>>>()
    rows.forEach((row) => {
      const years = schools.get(row.school) ?? new Map<string, Map<string, ExecutiveSchoolComparisonRow[]>>()
      const grades = years.get(row.schoolYear) ?? new Map<string, ExecutiveSchoolComparisonRow[]>()
      const gradeRows = grades.get(row.grade) ?? []
      gradeRows.push(row)
      grades.set(row.grade, gradeRows)
      years.set(row.schoolYear, grades)
      schools.set(row.school, years)
    })
    return [...schools.entries()]
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([school, years]) => ({
        school,
        years: [...years.entries()]
          .map(([schoolYear, grades]) => ({
            schoolYear,
            grades: [...grades.entries()]
              .map(([grade, gradeRows]) => ({ grade, rows: gradeRows }))
              .sort((left, right) => {
                const leftSort = left.rows[0]?.gradeSortOrder ?? Number.MAX_SAFE_INTEGER
                const rightSort = right.rows[0]?.gradeSortOrder ?? Number.MAX_SAFE_INTEGER
                return leftSort - rightSort || left.grade.localeCompare(right.grade)
              }),
          }))
          .sort((left, right) => {
            const leftSort = left.grades[0]?.rows[0]?.schoolYearSortOrder ?? 0
            const rightSort = right.grades[0]?.rows[0]?.schoolYearSortOrder ?? 0
            return rightSort - leftSort
          }),
      }))
  }, [rows])

  const groupStyle = (termGroup: string) => {
    return {
      background: termGroup === 'Below Average' ? '#B20000' : '#00803A',
      color: '#FFFFFF',
    }
  }

  if (grouped.length === 0) {
    return <div className="matrix-empty"><School size={22} /><span>No schools match the selected year, grade, period, and Assessment Group.</span></div>
  }

  return (
    <div className="matrix-wrap">
      <table className="school-matrix">
        <thead>
          <tr>
            <th rowSpan={2} className="school-year-heading">School / School year / Grade</th>
            {periods.map((period) => <th colSpan={2} className="period-heading" key={period}>{period}</th>)}
          </tr>
          <tr>
            {periods.flatMap((period) => matrixTermGroups.map((termGroup) => (
              <th style={groupStyle(termGroup)} className="term-group-heading" key={`${period}-${termGroup}`}>
                {cohortLabels.get(termGroup) ?? termGroup}
              </th>
            )))}
          </tr>
        </thead>
        <tbody>
          {grouped.flatMap(({ school, years }) => years.flatMap(({ schoolYear, grades }, yearIndex) =>
            grades.map(({ grade, rows: gradeRows }, gradeIndex) => (
            <tr
              key={`${school}-${schoolYear}-${grade}`}
              className={`${yearIndex === 0 && gradeIndex === 0 ? 'school-start-row' : gradeIndex === 0 ? 'school-year-start-row' : ''} matrix-focus-row${selectedFocus?.school === school && selectedFocus.schoolYear === schoolYear && selectedFocus.grade === grade ? ' selected' : ''}`}
              tabIndex={0}
              aria-label={`Focus chart on ${school}, ${schoolYear}, ${grade}`}
              aria-selected={selectedFocus?.school === school && selectedFocus.schoolYear === schoolYear && selectedFocus.grade === grade}
              onClick={() => onRowSelect({ school, schoolYear, grade })}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault()
                  onRowSelect({ school, schoolYear, grade })
                }
              }}
            >
              <td className="school-year-cell">
                {yearIndex === 0 && gradeIndex === 0 ? <strong>{school}</strong> : null}
                {gradeIndex === 0 ? <span>{schoolYear}</span> : null}
                <small className="matrix-grade">{grade}</small>
              </td>
              {periods.flatMap((period) => matrixTermGroups.map((termGroup) => {
                const value = gradeRows.find((row) => row.period === period && row.termGroup === termGroup)?.medianScore
                const periodIndex = periods.indexOf(period)
                const previousPeriod = periodIndex > 0 ? periods[periodIndex - 1] : null
                const previousValue = previousPeriod
                  ? gradeRows.find((row) => row.period === previousPeriod && row.termGroup === termGroup)?.medianScore
                  : null
                const trend = getMatrixTrend(value, previousValue)
                return (
                  <td className="matrix-value" key={`${period}-${termGroup}`}>
                    {value === null || value === undefined ? '—' : (
                      <span className="matrix-score-content">
                        <span className="matrix-score-value">{Math.round(value)}</span>
                        {trend ? (
                          <span className={`matrix-trend ${trend.className}`} aria-label={trend.label} title={trend.label}>
                            {trend.symbol}
                          </span>
                        ) : null}
                      </span>
                    )}
                  </td>
                )
              }))}
            </tr>
            )),
          ))}
        </tbody>
      </table>
    </div>
  )
}

function getMatrixTrend(current: number | null | undefined, previous: number | null | undefined) {
  if (current === null || current === undefined || previous === null || previous === undefined) return null

  const currentValue = Math.round(current)
  const previousValue = Math.round(previous)
  if (currentValue > previousValue) return { symbol: '▲', label: 'Improving', className: 'improving' }
  if (currentValue < previousValue) return { symbol: '▼', label: 'Declining', className: 'declining' }
  return { symbol: '►', label: 'Stable', className: 'stable' }
}

function useMeasuredWidth<T extends HTMLElement>() {
  const elementRef = useRef<T>(null)
  const [width, setWidth] = useState(0)

  useEffect(() => {
    const element = elementRef.current
    if (!element) return

    const updateWidth = (nextWidth: number) => {
      const roundedWidth = Math.max(0, Math.floor(nextWidth))
      setWidth((currentWidth) => currentWidth === roundedWidth ? currentWidth : roundedWidth)
    }

    updateWidth(element.getBoundingClientRect().width)
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (entry) updateWidth(entry.contentRect.width)
    })
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  return [elementRef, width] as const
}

function niceAxisMaximum(value: number) {
  if (value <= 10) return 10
  const magnitude = 10 ** Math.floor(Math.log10(value))
  return Math.ceil(value / magnitude) * magnitude
}

function DashboardSkeleton({ blocks }: { blocks: number }) {
  return <div className="dashboard-skeleton">{Array.from({ length: blocks }, (_, index) => <span key={index} />)}</div>
}
