import {
  ArrowLeft,
  BookOpenCheck,
  ChartNoAxesCombined,
  FileCheck2,
  PenLine,
  Printer,
  Target,
  UsersRound,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

const screenerRows = [
  { assessment: 'Comprehension (TOSREC)', short: 'TOSREC', fall: '58', winter: '60', spring: '79', change: '+21', term: 'Poor' },
  { assessment: 'Decoding (TOWRE)', short: 'TOWRE', fall: '63', winter: '63', spring: '62', change: '-1', term: 'Very Poor' },
  { assessment: 'Real Words (TOWRE RW)', short: 'TOWRE RW', fall: '66', winter: '69', spring: '63', change: '-3', term: 'Very Poor' },
  { assessment: 'Nonsense Words (TOWRE NW)', short: 'TOWRE NW', fall: '64', winter: '61', spring: '65', change: '+1', term: 'Very Poor' },
]

const levels = [
  { level: '1', title: 'Beginning', detail: 'Considerable teacher support' },
  { level: '2', title: 'Sometimes', detail: 'Some teacher support' },
  { level: '3', title: 'Often', detail: 'Minimal teacher support' },
  { level: '4', title: 'Consistently', detail: 'Independent and consistent' },
]

const empowerGoals = [
  {
    name: 'Sounding Out Strategy',
    lesson: 'From lesson 1',
    detail: 'Applies sound knowledge, blending, irregular word recognition, and taught spelling rules.',
    level: 2,
  },
  {
    name: 'Rhyming Strategy',
    lesson: 'From lesson 14',
    detail: 'Uses rhyme recognition, spelling patterns, keywords, and rhyming rules.',
    level: 2,
  },
  {
    name: 'Peeling Off Strategy',
    lesson: 'From lesson 41',
    detail: 'Identifies prefixes, suffixes, and roots to read and spell unfamiliar words.',
    level: 1,
  },
  {
    name: 'Vowel Alert Strategy',
    lesson: 'Not in this term',
    detail: 'Recognizes variable vowel sounds and vowel combinations in connected text.',
    level: null,
  },
  {
    name: 'Strategy Review',
    lesson: 'From lesson 6',
    detail: 'Names, describes, and explains when and how to use taught decoding strategies.',
    level: 2,
  },
  {
    name: 'Reading Fluency',
    lesson: 'From lesson 1',
    detail: 'Reads connected text with appropriate rate, accuracy, phrasing, and expression.',
    level: 1,
  },
]

const writingGoals = [
  ['Shares a clear idea or message', 2],
  ['Organizes ideas in a sensible order', 2],
  ['Tries taught spelling strategies', 1],
  ['Uses capitals, spacing, and punctuation', 1],
  ['Adds supporting details', 2],
  ['Writes with growing independence', 2],
] as const

export function IppPreview({ onBackToClassAssignment }: { onBackToClassAssignment: () => void }) {
  return (
    <section className="ipp-preview" aria-labelledby="ipp-preview-title">
      <div className="ipp-preview-notice" role="status">
        <div>
          <strong>Static design preview</strong>
          <span>Illustrative sample values only. Dataverse questions, live student records, editing, and approvals are not connected.</span>
        </div>
        <span className="ipp-preview-state">View only</span>
      </div>

      <article className="ipp-document">
        <nav className="ipp-document-toolbar" aria-label="IPP preview sections">
          <div className="ipp-document-links">
            <a href="#ipp-overview">Overview</a>
            <a href="#ipp-screener">Screener</a>
            <a href="#ipp-placement">Placement</a>
            <a href="#ipp-empower">Empower</a>
            <a href="#ipp-word-study">Word study</a>
            <a href="#ipp-writing">Writing</a>
            <a href="#ipp-review">Review</a>
          </div>
          <div className="ipp-document-actions">
            <button type="button" onClick={onBackToClassAssignment}>
              <ArrowLeft size={15} aria-hidden="true" /> Class Assignment
            </button>
            <button type="button" onClick={() => window.print()}>
              <Printer size={15} aria-hidden="true" /> Print preview
            </button>
          </div>
        </nav>

        <header className="ipp-document-hero">
          <div>
            <span>Individual Program Plan</span>
            <h2 id="ipp-preview-title">Sample Student</h2>
            <p>Foundations 1 - Term 1</p>
          </div>
          <div className="ipp-document-status">
            <span>2026 / 2027</span>
            <strong>Draft preview</strong>
          </div>
        </header>

        <div className="ipp-score-strip" aria-label="Latest illustrative screener results">
          {screenerRows.map((row) => (
            <div key={row.assessment}>
              <span>{row.short}</span>
              <strong>{row.spring}</strong>
              <small>Spring standard score</small>
            </div>
          ))}
        </div>

        <section className="ipp-section" id="ipp-overview">
          <SectionHeading eyebrow="Section overview" title="Student details" icon={UsersRound} />
          <p className="ipp-lede">The future plan will combine approved student context with the staff and reporting information required for the active plan.</p>
          <dl className="ipp-detail-grid">
            <Detail label="Student name" value="Sample Student" />
            <Detail label="Grade" value="3" />
            <Detail label="School" value="Blue Hills Community School" />
            <Detail label="School year" value="2026 / 2027" />
            <Detail label="Report period" value="Term 1" />
            <Detail label="Report date" value="November 20, 2026" />
            <Detail label="Foundations teacher" value="Awaiting entry" pending />
            <Detail label="Homeroom teacher" value="Awaiting entry" pending />
          </dl>
        </section>

        <section className="ipp-section ipp-section-alt" id="ipp-screener">
          <SectionHeading eyebrow="Assessment data" title="TOSREC and TOWRE screener results" icon={ChartNoAxesCombined} />
          <p className="ipp-lede">These sample scores demonstrate the intended evidence display. Live values and descriptive terms will come from governed assessment sources.</p>
          <div className="ipp-table-wrap">
            <table className="ipp-table">
              <thead>
                <tr><th>Assessment</th><th>Fall</th><th>Winter</th><th>Spring</th><th>Change</th><th>Descriptive term</th></tr>
              </thead>
              <tbody>
                {screenerRows.map((row) => (
                  <tr key={row.assessment}>
                    <td><strong>{row.assessment}</strong></td>
                    <td>{row.fall}</td><td>{row.winter}</td><td>{row.spring}</td>
                    <td className={row.change.startsWith('+') ? 'ipp-positive' : 'ipp-negative'}>{row.change}</td>
                    <td><span className="ipp-term-pill">{row.term}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="ipp-section" id="ipp-placement">
          <SectionHeading eyebrow="Programming decision" title="Cohort placement and intervention focus" icon={Target} />
          <p className="ipp-lede">The placement decision and its evidence remain visible so the team can review the plan at each reporting period.</p>
          <dl className="ipp-detail-grid">
            <Detail label="Cohort assignment" value="Foundations 1" />
            <Detail label="Primary area of need" value="Literacy" />
            <Detail label="Program" value="Empower Reading, Decoding and Spelling" />
            <Detail label="Lesson reached" value="47" />
            <Detail label="Intervention group" value="Awaiting entry" pending />
            <Detail label="Next review date" value="Awaiting entry" pending />
          </dl>
          <PlaceholderBlock label="Placement rationale" />
        </section>

        <section className="ipp-section ipp-section-alt" id="ipp-empower">
          <SectionHeading eyebrow="Section one" title="Empower Reading" icon={BookOpenCheck} />
          <p className="ipp-lede">Goal ratings communicate how independently the student applies each strategy over repeated opportunities.</p>
          <div className="ipp-levels" aria-label="Rating levels">
            {levels.map((item) => (
              <div key={item.level}>
                <span>{item.level}</span>
                <strong>{item.title}</strong>
                <small>{item.detail}</small>
              </div>
            ))}
          </div>
          <div className="ipp-goal-list">
            {empowerGoals.map((goal) => (
              <div className={goal.level === null ? 'ipp-goal ipp-goal-muted' : 'ipp-goal'} key={goal.name}>
                <div>
                  <div className="ipp-goal-title"><strong>{goal.name}</strong><span>{goal.lesson}</span></div>
                  <p>{goal.detail}</p>
                </div>
                <div className="ipp-goal-rating">
                  {goal.level === null ? <span>Not evaluated</span> : <><span>Level</span><strong>{goal.level}</strong></>}
                </div>
              </div>
            ))}
          </div>
          <PlaceholderBlock label="Strengths, patterns, and notable growth this term" />
        </section>

        <section className="ipp-section" id="ipp-word-study">
          <SectionHeading eyebrow="Section two" title="Word Study" icon={FileCheck2} />
          <p className="ipp-lede">Words Their Way stages and skills will be recorded for each reporting term.</p>
          <div className="ipp-term-grid">
            {['Term 1', 'Term 2', 'Term 3'].map((term) => (
              <div key={term}>
                <strong>{term}</strong>
                <Detail label="Starting stage" value="Awaiting entry" pending />
                <Detail label="Ending stage or skill" value="Awaiting entry" pending />
                <Detail label="Notes" value="Awaiting entry" pending />
              </div>
            ))}
          </div>
        </section>

        <section className="ipp-section ipp-section-alt" id="ipp-writing">
          <SectionHeading eyebrow="Section three" title="Writing snapshot" icon={PenLine} />
          <p className="ipp-lede">The writing snapshot records representative strengths, next steps, and the level of support provided.</p>
          <div className="ipp-writing-support"><strong>Support level:</strong> completed independently in this illustrative sample.</div>
          <div className="ipp-writing-grid">
            {writingGoals.map(([name, level]) => (
              <div key={name}><span>{name}</span><strong>Level {level}</strong></div>
            ))}
          </div>
          <div className="ipp-comment-grid">
            <PlaceholderBlock label="Strength shown in this sample" />
            <PlaceholderBlock label="Next step for writing" />
          </div>
        </section>

        <section className="ipp-section" id="ipp-review">
          <SectionHeading eyebrow="Teacher summary" title="Review, next steps, and sign-off" icon={FileCheck2} />
          <div className="ipp-comment-grid">
            <PlaceholderBlock label="Overall progress this term" />
            <PlaceholderBlock label="Focus for next term" />
            <PlaceholderBlock label="How the family can help at home" />
          </div>
          <div className="ipp-signatures">
            {['Foundations teacher', 'Parent or guardian', 'Principal'].map((role) => (
              <div key={role}><span>{role}</span><strong>Signature</strong><small>Date</small></div>
            ))}
          </div>
        </section>

        <footer className="ipp-document-footer">
          <strong>Fort Vermilion School Division</strong>
          <span>Foundations 1 Individual Program Plan - static Nexus preview</span>
        </footer>
      </article>
    </section>
  )
}

function SectionHeading({ eyebrow, title, icon: Icon }: {
  eyebrow: string
  title: string
  icon: LucideIcon
}) {
  return (
    <div className="ipp-section-heading">
      <span>{eyebrow}</span>
      <h3><Icon size={20} aria-hidden="true" />{title}</h3>
    </div>
  )
}

function Detail({ label, value, pending = false }: { label: string; value: string; pending?: boolean }) {
  return <div><dt>{label}</dt><dd className={pending ? 'ipp-pending' : undefined}>{value}</dd></div>
}

function PlaceholderBlock({ label }: { label: string }) {
  return (
    <div className="ipp-placeholder-block">
      <strong>{label}</strong>
      <span>Awaiting teacher entry</span>
    </div>
  )
}
