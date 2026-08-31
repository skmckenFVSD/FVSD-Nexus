export type PageKey = 'home' | 'school-profile' | 'student-success' | 'attendance' | 'literacy' | 'intervention-tracking' | 'analytics-assistant' | 'settings';

export type FilterState = {
  school: string;
  gradeBand: string;
  studentGroup: string;
  period: string;
};

export type MetricRecord = {
  id: string;
  school: string;
  gradeBand: string;
  studentGroup: string;
  program: string;
  metric: string;
  value: number;
  target: number;
  status: 'On track' | 'Watch' | 'Priority';
};

export const schools = ['All schools', 'Cedar Valley Elementary', 'Fraser Ridge Secondary', 'Mountainview Middle', 'Riverside Elementary', 'Pacific Heights Secondary'];
export const gradeBands = ['All grades', 'Primary', 'Intermediate', 'Middle Years', 'Senior'];
export const studentGroups = ['All students', 'Indigenous Students', 'English Language Learners', 'Students with Diverse Abilities'];
export const periods = ['Current month', 'Year to date', 'Term 1', 'Term 2'];

export const executiveKpis = [
  { label: 'Leadership attention items', value: '18', change: '+4', trend: 'down', detail: 'Priority signals requiring principal follow-up' },
  { label: 'Schools on watch', value: '3', change: '+1', trend: 'down', detail: 'Below target in attendance or literacy' },
  { label: 'District readiness', value: '87%', change: '+2.1%', trend: 'up', detail: 'Composite success, attendance, and plan completion' },
  { label: 'Intervention pressure', value: '412', change: '+28', trend: 'down', detail: 'Students in Tier 2/3 support pathways' },
  { label: 'Board briefing confidence', value: 'High', change: '6 insights', trend: 'up', detail: 'Evidence-backed summary available' },
];

export const executiveTrend = [
  { month: 'Sep', readiness: 84, attention: 11, attendance: 94.8, literacy: 72.1 },
  { month: 'Oct', readiness: 83, attention: 13, attendance: 93.6, literacy: 72.8 },
  { month: 'Nov', readiness: 80, attention: 19, attendance: 91.9, literacy: 73.6 },
  { month: 'Dec', readiness: 84, attention: 16, attendance: 92.4, literacy: 74.2 },
  { month: 'Jan', readiness: 87, attention: 18, attendance: 93.1, literacy: 74.9 },
];

export const executiveInsights = [
  { title: 'Middle years attendance needs leadership attention', severity: 'Priority', summary: 'Two schools account for 64% of new chronic absence risk.', action: 'Review outreach staffing and principal intervention cadence.' },
  { title: 'Literacy gains are not evenly distributed', severity: 'Watch', summary: 'District average improved, but ELL and diverse abilities gaps widened.', action: 'Prioritize targeted small-group literacy blocks.' },
  { title: 'Support plan completion improved', severity: 'On track', summary: 'January completion rose to 79%, led by elementary referral closure.', action: 'Share workflow from Cedar Valley and Pacific Heights.' },
];

export const schoolProfiles = [
  { school: 'Cedar Valley Elementary', students: 518, attendance: 94.8, literacy: 76.5, supports: 42, principal: 'Megan Tremblay', risk: 18, momentum: 2.2 },
  { school: 'Fraser Ridge Secondary', students: 1187, attendance: 91.2, literacy: 72.4, supports: 67, principal: 'Arjun Singh', risk: 41, momentum: -1.1 },
  { school: 'Mountainview Middle', students: 734, attendance: 89.5, literacy: 64.8, supports: 31, principal: 'Nadia Pelletier', risk: 56, momentum: -2.4 },
  { school: 'Riverside Elementary', students: 384, attendance: 92.6, literacy: 69.1, supports: 18, principal: 'Evan Chen', risk: 33, momentum: 0.4 },
  { school: 'Pacific Heights Secondary', students: 1304, attendance: 93.4, literacy: 81.7, supports: 26, principal: 'Claire McLeod', risk: 21, momentum: 3.1 },
];

export const schoolComparisonBars = schoolProfiles.map((school: (typeof schoolProfiles)[number]) => ({ name: school.school.split(' ')[0], attendance: school.attendance, literacy: school.literacy, risk: school.risk }));

export const studentSuccessKpis = [
  { label: 'Learners below success threshold', value: '326', change: '+19', trend: 'down', detail: 'Students below attendance + achievement composite' },
  { label: 'ELL achievement gap', value: '10.1 pts', change: '+1.4', trend: 'down', detail: 'Gap versus all-student proficiency' },
  { label: 'Cohort movement', value: '+4.8 pts', change: '+0.7', trend: 'up', detail: 'Median growth in monitored cohorts' },
  { label: 'Transition risk', value: '146', change: '-12', trend: 'up', detail: 'Grade 7/10 learners flagged for review' },
];

export const studentGroupAnalysis = [
  { name: 'All students', proficiency: 74.9, attendance: 92.9, support: 9.6 },
  { name: 'Indigenous', proficiency: 69.1, attendance: 92.6, support: 14.2 },
  { name: 'ELL', proficiency: 64.8, attendance: 89.5, support: 18.9 },
  { name: 'Diverse abilities', proficiency: 67.4, attendance: 90.8, support: 22.4 },
];

export const achievementDistribution = [
  { name: 'Emerging', value: 318 },
  { name: 'Developing', value: 742 },
  { name: 'Proficient', value: 1816 },
  { name: 'Extending', value: 524 },
];

export const interventionCohorts = [
  { cohort: 'Literacy Tier 2', students: 138, completion: 72, growth: 4.8, fidelity: 83 },
  { cohort: 'Attendance outreach', students: 96, completion: 64, growth: 2.1, fidelity: 71 },
  { cohort: 'Credit recovery', students: 82, completion: 61, growth: 5.6, fidelity: 68 },
  { cohort: 'ELL vocabulary', students: 74, completion: 69, growth: 3.9, fidelity: 76 },
];

export const attendanceKpis = [
  { label: 'Chronic absence risk', value: '12.7%', change: '+0.9', trend: 'down', detail: 'Students missing 10%+ instructional days' },
  { label: 'Emerging risk students', value: '238', change: '+31', trend: 'down', detail: 'Missed 2+ days in current month' },
  { label: 'Successful re-engagement', value: '64%', change: '+6', trend: 'up', detail: 'Outreach cases with improved attendance' },
  { label: 'Highest risk grade band', value: 'Middle', change: '90.8%', trend: 'down', detail: 'Lowest attendance by grade band' },
];

export const attendanceRiskTrend = [
  { month: 'Sep', chronic: 9.8, emerging: 142, outreach: 48 },
  { month: 'Oct', chronic: 10.6, emerging: 174, outreach: 52 },
  { month: 'Nov', chronic: 12.2, emerging: 223, outreach: 58 },
  { month: 'Dec', chronic: 12.9, emerging: 251, outreach: 61 },
  { month: 'Jan', chronic: 12.7, emerging: 238, outreach: 64 },
];

export const attendanceSegments = [
  { name: '0-4 days missed', value: 2864 },
  { name: '5-9 days missed', value: 894 },
  { name: '10-14 days missed', value: 361 },
  { name: '15+ days missed', value: 167 },
];

export const literacyKpis = [
  { label: 'Below benchmark', value: '1,060', change: '-34', trend: 'up', detail: 'Emerging or developing readers' },
  { label: 'Primary phonics priority', value: '28%', change: '+3', trend: 'down', detail: 'Primary students below phonics benchmark' },
  { label: 'Middle years comprehension gap', value: '11.4 pts', change: '+1.2', trend: 'down', detail: 'Gap versus district proficiency' },
  { label: 'Intervention conversion', value: '42%', change: '+5', trend: 'up', detail: 'Students moving up one performance band' },
];

export const literacyBenchmarkTrend = [
  { period: 'Fall', emerging: 13, developing: 22, proficient: 50, extending: 15 },
  { period: 'Winter', emerging: 10, developing: 21, proficient: 53, extending: 16 },
  { period: 'Spring forecast', emerging: 8, developing: 18, proficient: 55, extending: 19 },
];

export const literacySkillGaps = [
  { skill: 'Phonics', primary: 72, intermediate: 81, middle: 84 },
  { skill: 'Fluency', primary: 69, intermediate: 77, middle: 79 },
  { skill: 'Vocabulary', primary: 74, intermediate: 70, middle: 65 },
  { skill: 'Comprehension', primary: 76, intermediate: 73, middle: 68 },
];

export const interventionKpis = [
  { label: 'Active support plans', value: '184', change: '+11', trend: 'down', detail: 'Open plans across monitored schools' },
  { label: 'Plans showing growth', value: '61%', change: '+8', trend: 'up', detail: 'Improved outcome after intervention' },
  { label: 'Fidelity concern', value: '3 cohorts', change: '+1', trend: 'down', detail: 'Below 75% implementation fidelity' },
  { label: 'Referral cycle time', value: '12 days', change: '-3', trend: 'up', detail: 'Median referral to first support' },
];

export const interventionResults = [
  { name: 'Literacy Tier 2', growth: 4.8, completion: 72, fidelity: 83 },
  { name: 'Attendance outreach', growth: 2.1, completion: 64, fidelity: 71 },
  { name: 'Credit recovery', growth: 5.6, completion: 61, fidelity: 68 },
  { name: 'ELL vocabulary', growth: 3.9, completion: 69, fidelity: 76 },
];

export const tierMix = [
  { name: 'Tier 1 monitor', value: 2860 },
  { name: 'Tier 2 targeted', value: 338 },
  { name: 'Tier 3 intensive', value: 74 },
  { name: 'Transition', value: 42 },
];

export const assistantPrompts = [
  'What requires leadership attention this week?',
  'Which schools are improving but still below target?',
  'Which learner groups need additional support?',
  'Which interventions are producing measurable results?',
];

export const assistantCards = [
  { title: 'Attention briefing', prompt: 'Create a superintendent-ready summary of the top three risks.', evidence: 'Uses KPI exceptions, trend reversals, and school ranking movement.' },
  { title: 'Root cause explorer', prompt: 'Explain why middle years attendance is declining.', evidence: 'Combines grade band, school, cohort, and monthly attendance signals.' },
  { title: 'Action planner', prompt: 'Recommend next steps for interventions with low fidelity.', evidence: 'Connects intervention completion, growth, and implementation fidelity.' },
  { title: 'Meeting prep', prompt: 'Generate principal discussion prompts for the next school review.', evidence: 'Produces evidence-based questions tied to selected filters.' },
];

export const records: MetricRecord[] = [
  { id: '1', school: 'Cedar Valley Elementary', gradeBand: 'Primary', studentGroup: 'All students', program: 'Regular Program', metric: 'Attendance Rate', value: 94.8, target: 94, status: 'On track' },
  { id: '2', school: 'Fraser Ridge Secondary', gradeBand: 'Senior', studentGroup: 'All students', program: 'Career Pathways', metric: 'Credits On Track', value: 84.6, target: 90, status: 'Watch' },
  { id: '3', school: 'Mountainview Middle', gradeBand: 'Middle Years', studentGroup: 'English Language Learners', program: 'Regular Program', metric: 'Literacy Proficiency', value: 64.8, target: 75, status: 'Priority' },
  { id: '4', school: 'Riverside Elementary', gradeBand: 'Intermediate', studentGroup: 'Indigenous Students', program: 'Indigenous Education Support', metric: 'Referral Completion', value: 83.3, target: 85, status: 'Watch' },
  { id: '5', school: 'Pacific Heights Secondary', gradeBand: 'Senior', studentGroup: 'All students', program: 'French Immersion', metric: 'Literacy Benchmark', value: 81.7, target: 78, status: 'On track' },
  { id: '6', school: 'Mountainview Middle', gradeBand: 'Middle Years', studentGroup: 'All students', program: 'Attendance Outreach', metric: 'Chronic Absence', value: 15.8, target: 10, status: 'Priority' },
  { id: '7', school: 'Fraser Ridge Secondary', gradeBand: 'Senior', studentGroup: 'Students with Diverse Abilities', program: 'Credit Recovery', metric: 'Intervention Growth', value: 5.6, target: 4, status: 'On track' },
];

export function applyFilters<T extends { school?: string; gradeBand?: string; studentGroup?: string }>(items: T[], filters: FilterState): T[] {
  return items.filter((item: T) => {
    const schoolMatch = filters.school === 'All schools' || item.school === filters.school;
    const gradeMatch = filters.gradeBand === 'All grades' || item.gradeBand === filters.gradeBand;
    const groupMatch = filters.studentGroup === 'All students' || item.studentGroup === filters.studentGroup;
    return schoolMatch && gradeMatch && groupMatch;
  });
}
