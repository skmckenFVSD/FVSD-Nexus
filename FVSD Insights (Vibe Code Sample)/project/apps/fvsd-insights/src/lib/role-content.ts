import type { DevelopmentRole } from '@/lib/role-context';
import { attendanceKpis, executiveKpis, interventionKpis, literacyKpis, studentSuccessKpis } from '@/lib/analytics-data';

type RoleCopy = {
  titlePrefix: string;
  homeTitle: string;
  homeDescription: string;
  assistantIntro: string;
  assistantPrompts: string[];
  filters: string[];
  recommendation: string;
  kpis: typeof executiveKpis;
};

type PageRoleCopy = {
  title: string;
  description: string;
  action: string;
};

const teacherRoleCopy: RoleCopy = {
  titlePrefix: 'Classroom',
  homeTitle: 'Classroom Overview',
  homeDescription: 'What needs instructional attention? Focus on classroom progress, group planning, intervention recommendations, and next-week teaching decisions.',
  assistantIntro: 'Ask classroom planning questions, identify learners needing targeted instruction, and convert evidence into teaching moves.',
  assistantPrompts: ['Which learners need a small-group plan this week?', 'What skill gap should I reteach next?', 'Which interventions are helping my students grow?', 'What evidence should I bring to collaboration time?'],
  filters: ['Classroom', 'Grade group', 'Learner group', 'Instruction window'],
  recommendation: 'Use small-group literacy reteach for students below benchmark and monitor response within two weeks.',
  kpis: [
    { label: 'Learners needing conference', value: '14', change: '+3', trend: 'down', detail: 'Students flagged by progress and attendance evidence' },
    { label: 'Small groups active', value: '5', change: '+1', trend: 'up', detail: 'Current instructional intervention groups' },
    { label: 'Skill mastery growth', value: '+6.2 pts', change: '+1.1', trend: 'up', detail: 'Classroom benchmark movement' },
    { label: 'Attendance check-ins', value: '9', change: '-2', trend: 'up', detail: 'Learners needing follow-up this cycle' },
    { label: 'Plan response rate', value: '68%', change: '+7', trend: 'up', detail: 'Students improving after targeted instruction' },
  ],
};

const supportRoleCopy: RoleCopy = {
  titlePrefix: 'Support',
  homeTitle: 'Classroom Support Overview',
  homeDescription: 'What support planning needs attention? Focus on active interventions, referrals, student monitoring, and coordinated support actions.',
  assistantIntro: 'Ask support-planning questions, review active interventions, and prepare referral or monitoring next steps.',
  assistantPrompts: ['Which active interventions need follow-up?', 'Which referrals should be reviewed first?', 'Which students need support monitoring today?', 'What evidence should be shared with the support team?'],
  filters: ['Support caseload', 'Grade group', 'Need area', 'Monitoring window'],
  recommendation: 'Review active referrals with incomplete evidence and align next support actions before the next team meeting.',
  kpis: teacherRoleCopy.kpis,
};

const roleCopy: Record<DevelopmentRole, RoleCopy> = {
  Executive: {
    titlePrefix: 'Executive',
    homeTitle: 'Executive Summary',
    homeDescription: 'What requires district leadership attention? Board reporting, school comparison, strategic priorities, and superintendent decision points.',
    assistantIntro: 'Ask board-ready questions, compare schools, surface system drivers, and convert district signals into leadership next steps.',
    assistantPrompts: ['What requires leadership attention this week?', 'Which schools are improving but still below target?', 'What belongs in the next board update?', 'Which strategic priorities need intervention evidence?'],
    filters: ['School', 'Grade', 'Student group', 'Reporting period'],
    recommendation: 'Prioritize principal review for schools with simultaneous attendance decline and literacy gap widening.',
    kpis: executiveKpis,
  },
  'School Administration': {
    titlePrefix: 'School improvement',
    homeTitle: 'School Improvement Overview',
    homeDescription: 'What requires school leadership attention? School improvement, student support, team action planning, and follow-up accountability.',
    assistantIntro: 'Ask planning questions, identify student support needs, and turn school signals into staff meeting actions.',
    assistantPrompts: ['Which students need support planning this week?', 'What should our school improvement team review first?', 'Which cohorts are not responding to intervention?', 'What actions should grade teams take next?'],
    filters: ['Focus school', 'Grade team', 'Learner group', 'Review window'],
    recommendation: 'Schedule grade-team review for learners below both attendance and achievement thresholds.',
    kpis: [
      { label: 'Improvement priorities', value: '7', change: '+2', trend: 'down', detail: 'Signals requiring admin team follow-up' },
      { label: 'Learners needing review', value: '86', change: '+11', trend: 'down', detail: 'Students below school success threshold' },
      { label: 'Support plan completion', value: '79%', change: '+6', trend: 'up', detail: 'Active plans updated this cycle' },
      { label: 'Grade teams on track', value: '4 of 6', change: '+1', trend: 'up', detail: 'Teams meeting improvement cadence' },
      { label: 'Family outreach queue', value: '23', change: '-5', trend: 'up', detail: 'Open attendance or support contacts' },
    ],
  },
  Teacher: teacherRoleCopy,
  'Class Room Support': supportRoleCopy,
  'Data Analyst (Administrator)': {
    titlePrefix: 'Data administration',
    homeTitle: 'Analytics Administration Overview',
    homeDescription: 'What requires data stewardship attention? Full-platform visibility across schools, users, pages, filters, data quality, and administrative controls.',
    assistantIntro: 'Ask governance, data quality, adoption, and model-validation questions across all schools, users, filters, and analytics pages.',
    assistantPrompts: ['Which datasets have quality exceptions?', 'Which schools have incomplete submissions?', 'Which users need access review?', 'What filter combinations expose data gaps?'],
    filters: ['All schools', 'All users', 'All student groups', 'All reporting periods'],
    recommendation: 'Resolve stale attendance extracts and missing literacy benchmarks before the next executive review cycle.',
    kpis: [
      { label: 'Data quality exceptions', value: '42', change: '-8', trend: 'up', detail: 'Validation issues across active datasets' },
      { label: 'Schools visible', value: 'All 5', change: 'Full', trend: 'up', detail: 'Administrator visibility across sample schools' },
      { label: 'User access review', value: '18', change: '+4', trend: 'down', detail: 'Prototype accounts requiring role review' },
      { label: 'Refresh readiness', value: '91%', change: '+3', trend: 'up', detail: 'Datasets passing mock refresh checks' },
      { label: 'Filter coverage', value: '100%', change: 'All', trend: 'up', detail: 'All pages and filters available' },
    ],
  },
};

const teacherPageCopy: Record<string, PageRoleCopy> = {
  school: { title: 'Classroom Context', description: 'How does my class compare with grade-level patterns and school improvement focus areas?', action: 'Class context view' },
  student: { title: 'Learner Progress', description: 'Which learners need support? Focus on classroom groups, assessment movement, and targeted instruction.', action: 'Build small-group brief' },
  attendance: { title: 'Class Attendance Signals', description: 'Where are attendance risks emerging for learners in my classes and intervention groups?', action: 'Prepare check-ins' },
  assistant: { title: 'Instructional Planning Assistant', description: 'Help teachers understand student evidence and convert it into classroom interventions and planning prompts.', action: 'Generate teaching moves' },
};

const supportPageCopy: Record<string, PageRoleCopy> = {
  school: { title: 'Support Context', description: 'How do support needs compare across classrooms, grades, and referral pathways?', action: 'Support context view' },
  student: { title: 'Student Support Monitoring', description: 'Which learners need support? Focus on active interventions, referral status, and monitoring evidence.', action: 'Build support brief' },
  attendance: { title: 'Support Attendance Monitoring', description: 'Where are attendance risks affecting students with active support or referrals?', action: 'Prepare outreach list' },
  assistant: { title: 'Support Planning Assistant', description: 'Help support staff interpret evidence, prepare referrals, and monitor active interventions.', action: 'Generate support actions' },
};

const pageCopy: Record<DevelopmentRole, Record<string, PageRoleCopy>> = {
  Executive: {
    school: { title: 'School Comparison', description: 'How do schools compare? Rank schools by performance, risk, movement, and strategic priority evidence.', action: 'Comparison view' },
    student: { title: 'District Student Success', description: 'Which learners need support? Compare learner groups, achievement distribution, transition risk, and intervention cohorts.', action: 'Build board cohort brief' },
    attendance: { title: 'District Attendance Risk', description: 'Where are attendance risks emerging? Identify chronic absence patterns, emerging risk bands, and re-engagement evidence.', action: 'Attendance briefing' },
    assistant: { title: 'Executive Analytics Assistant', description: 'Help district leadership understand and act on performance information through guided prompts and decision-ready summaries.', action: 'Generate briefing' },
  },
  'School Administration': {
    school: { title: 'School Improvement Comparison', description: 'How does our school compare with peer patterns, improvement targets, and priority support indicators?', action: 'Build improvement view' },
    student: { title: 'Learner Support Planning', description: 'Which learners need support? Focus on school cohorts, transition risk, intervention response, and admin follow-up.', action: 'Build support brief' },
    attendance: { title: 'School Attendance Risk', description: 'Where are attendance risks emerging in our school, grade teams, and student groups?', action: 'Plan outreach' },
    assistant: { title: 'School Planning Assistant', description: 'Help the school leadership team interpret evidence, prepare staff conversations, and act on improvement priorities.', action: 'Generate plan' },
  },
  Teacher: teacherPageCopy,
  'Class Room Support': supportPageCopy,
  'Data Analyst (Administrator)': {
    school: { title: 'All-School Comparison Administration', description: 'How do schools compare across every metric, filter state, and data completeness indicator?', action: 'Audit comparison data' },
    student: { title: 'Learner Dataset Coverage', description: 'Which learner analytics require validation? Review group coverage, cohort completeness, and evidence availability.', action: 'Validate learner data' },
    attendance: { title: 'Attendance Data Operations', description: 'Where are attendance risks and data quality issues emerging across schools, extracts, and reporting periods?', action: 'Review extracts' },
    assistant: { title: 'Analytics Operations Assistant', description: 'Help administrators validate datasets, review access, test filters, and explain model readiness.', action: 'Generate admin brief' },
  },
};

export function getRoleCopy(role: DevelopmentRole): RoleCopy {
  return roleCopy[role];
}

export function getPageRoleCopy(role: DevelopmentRole, page: string): PageRoleCopy {
  return pageCopy[role][page];
}

export function getRoleKpis(role: DevelopmentRole, page: 'home' | 'student' | 'attendance' | 'literacy' | 'intervention') {
  if (page === 'home') return roleCopy[role].kpis;
  if (role === 'Data Analyst (Administrator)') return roleCopy[role].kpis.slice(0, 4);
  if (role === 'Executive') {
    if (page === 'student') return studentSuccessKpis;
    if (page === 'attendance') return attendanceKpis;
    if (page === 'literacy') return literacyKpis;
    return interventionKpis;
  }
  if (role === 'School Administration') {
    if (page === 'student') return [
      { label: 'Students needing team review', value: '86', change: '+11', trend: 'down', detail: 'School learners below success threshold' },
      { label: 'Grade cohort gap', value: '8.4 pts', change: '+0.8', trend: 'down', detail: 'Largest school learner-group gap' },
      { label: 'Support response', value: '58%', change: '+6', trend: 'up', detail: 'Students improving after support' },
      { label: 'Transition watchlist', value: '31', change: '-4', trend: 'up', detail: 'Learners flagged for admin review' },
    ];
    if (page === 'attendance') return [
      { label: 'School chronic risk', value: '10.9%', change: '+0.4', trend: 'down', detail: 'Students missing 10%+ instructional days' },
      { label: 'Grade-team alerts', value: '42', change: '+8', trend: 'down', detail: 'Students with new attendance risk' },
      { label: 'Outreach improvement', value: '71%', change: '+9', trend: 'up', detail: 'Cases improving after contact' },
      { label: 'Family follow-ups', value: '18', change: '-6', trend: 'up', detail: 'Open attendance contacts' },
    ];
    if (page === 'literacy') return [
      { label: 'Below benchmark at school', value: '143', change: '-12', trend: 'up', detail: 'Students needing literacy response' },
      { label: 'Priority skill gap', value: 'Fluency', change: '69%', trend: 'down', detail: 'Lowest school skill indicator' },
      { label: 'Group conversion', value: '46%', change: '+8', trend: 'up', detail: 'Students moving up one band' },
      { label: 'Intervention seats', value: '28', change: '+5', trend: 'down', detail: 'Open targeted literacy capacity' },
    ];
  }
  if (role === 'Class Room Support') return [
    { label: 'Active support monitors', value: '22', change: '+4', trend: 'down', detail: 'Students requiring support monitoring' },
    { label: 'Open referrals', value: '8', change: '+2', trend: 'down', detail: 'Referrals awaiting evidence or team action' },
    { label: 'Interventions responding', value: '61%', change: '+5', trend: 'up', detail: 'Students improving after support' },
    { label: 'Follow-ups due', value: '11', change: '-3', trend: 'up', detail: 'Support actions due this cycle' },
  ];
  if (page === 'student') return [
    { label: 'Learners below target', value: '14', change: '+3', trend: 'down', detail: 'Students needing instructional follow-up' },
    { label: 'Small-group growth', value: '+5.1 pts', change: '+1.0', trend: 'up', detail: 'Median movement in teacher groups' },
    { label: 'Missing evidence', value: '6', change: '-2', trend: 'up', detail: 'Learners needing assessment update' },
    { label: 'Ready to extend', value: '11', change: '+4', trend: 'up', detail: 'Students ready for enrichment' },
  ];
  if (page === 'attendance') return [
    { label: 'Learner check-ins', value: '9', change: '-2', trend: 'up', detail: 'Students needing attendance conversation' },
    { label: 'Emerging absence risk', value: '7', change: '+2', trend: 'down', detail: 'Students missing 2+ recent days' },
    { label: 'Improved attendance', value: '63%', change: '+5', trend: 'up', detail: 'Students improving after check-in' },
    { label: 'Family contacts due', value: '4', change: '-1', trend: 'up', detail: 'Open teacher follow-ups' },
  ];
  if (page === 'literacy') return [
    { label: 'Readers below benchmark', value: '18', change: '-3', trend: 'up', detail: 'Students needing targeted literacy instruction' },
    { label: 'Reteach focus', value: 'Vocabulary', change: '65%', trend: 'down', detail: 'Lowest classroom skill area' },
    { label: 'Moved up a band', value: '7', change: '+2', trend: 'up', detail: 'Students improving after instruction' },
    { label: 'Conference notes due', value: '5', change: '+1', trend: 'down', detail: 'Learners needing documentation' },
  ];
  return interventionKpis;
}
