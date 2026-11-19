---
title: "FVSD Nexus: From Evidence to Action"
description: Conference deck — how one rural Alberta division builds governed, role-aware software on Fabric, Dataverse and Power Platform.
type: deck
status: current
icon: 🎤
area: presentation
audience: [leadership, conference, architects]
owner: Scott McKenzie
tags: [nexus, nexus/presentation, deck]
aliases: [Evidence to Action deck, Nexus conference deck]
updated: 2026-11-17
related: ["[[presentation/README]]", "[[philosophy/README]]", "[[architecture/overview]]"]
deck:
  output: from-evidence-to-action
  brand_sub: Evidence to Action
  presenter: Scott Mckenzie
  role: Chief Technology Officer · Fort Vermilion School Division
  meta_description: How one rural Alberta school division built governed, role-aware software on Microsoft Fabric, Dataverse and Power Platform, and what it taught us about trust.
  social_description: Governed, role-aware software on Microsoft Fabric, Dataverse and Power Platform, and what it taught us about trust.
  site_url: https://skmckenfvsd.github.io/FVSD-Nexus/
  social_image: social-card.png
  social_image_alt: "FVSD Nexus: From Evidence to Action. Scott Mckenzie, Chief Technology Officer."
---

# 🎤 FVSD Nexus: From Evidence to Action

[🏠 Home](../../README.md) › [🎤 Presentation](../README.md) › From Evidence to Action

> [!NOTE]
> This file is the **source** of the conference deck. Each slide sits between horizontal rules, and the HTML comments carry layout hints that the deck build reads. Edit the words here and run `npm run docs:deck` (see [Presentation layer](../README.md)) to regenerate `publish/presentation/from-evidence-to-action/index.html`.

---

<!-- slide: layout=title group="Opening" nav="Title" -->

# From Evidence to Action

How one rural Alberta division is building governed, role-aware software on Fabric, Dataverse and Power Platform, and what it taught us about trust.

<!-- byline -->
**Scott Mckenzie**\
Chief Technology Officer · Fort Vermilion School Division\
*CDAO Canada* · *Microsoft Power Platform & Fabric Community Events*

---

<!-- slide: layout=statement group="Opening" nav="Who owns this number?" -->

> Every organisation believes its measures are aligned. Usually that alignment is an illusion created by repetition.

*The problem we set out to solve*

---

<!-- slide: group="The Problem" nav="The measure illusion" -->

#### Where trust breaks

## Familiarity replaces understanding.<br>Recognition replaces trust.

<!-- cards edge=cyan -->
- **The gap** — Definition lives in one place. Logic lives in another. Interpretation lives somewhere in between.
- **The consequence** — The number gets used long before anyone takes responsibility for it. Ownership is implied, so accountability becomes optional.
- **The real question** — Not *“is the dataset governed?”* but **“is the measure understood?”**

---

<!-- slide: group="The Problem" nav="A teacher's Tuesday" lead -->

#### The daily reality

## The connective tissue between our systems is a person

A learning support teacher preparing for one meeting needs screening scores from one system, enrolment context from another, the current plan from a vendor product, and progress notes from wherever they were last written down.

- **Time.** The same information re-entered and re-checked in more than one place.
- **Confidence.** When two systems disagree, staff hesitate, and hesitation delays a response to a student.
- **Dependency.** When a workflow lives only inside a vendor product, improvement moves at the vendor's pace and price.

---

<!-- slide: group="The Architecture" nav="Three sources of truth" -->

#### The rule everything else hangs from

## Three questions. Three permanent answers.

<!-- truth -->
- 🗄️ **Record** — *Where is the record created and managed?* **Dataverse** Assessments, program plans, reference data, workflow state and the audit history of who changed what, and when.
- 🧮 **Calculation** — *How is a number calculated?* **The semantic model** Every measure, trend and classification is defined once. No application recalculates it independently.
- 🪪 **Identity** — *Who is this person, and what may they use?* **Entra** Identity, licence entitlement, department and location: the organisational facts about staff.

<!-- catalog tag="OneLake catalog · the catalogue" -->
**Not a fourth source of truth, and that distinction is the point.** The catalogue holds none of the record, the calculation or the identity. It publishes what they *mean*, who owns them and where they came from, beside the model they describe, so the answer can be found and trusted rather than merely returned.

---

<!-- slide: layout=statement group="The Architecture" nav="Not a fourth source" -->

> The app is where the work happens.<br>It is never where the truth lives.

*The test every future decision has to pass*

---

<!-- slide: group="The Architecture" nav="What we built" -->

#### Deployed and running

## Two narrow slices, built end to end

We deliberately built complete journeys rather than broad prototypes, so leadership could judge the idea on working evidence rather than a demo video.

<!-- cards edge=mint cols=two title=h3 -->
- 🟢 **Live** **Leadership analytics** — Governed semantic-model measures presented through a guided experience, not an embedded report a leader has to know how to drive. Multi-select year, period, school and grade; comparison matrix; focused charts.
- 🟢 **Live** **Class assignment & screening history** — Role-scoped cascade from school to section group to course to teacher to student, then read-only screening history with governed descriptive terms and colours drawn straight from Dataverse.

**Deliberately read-only.** We proved identity, role scope and trustworthy reading *before* asking anyone to type a student result into a new system.

---

<!-- slide: group="The Architecture" nav="Measure discipline" lead -->

#### The non-negotiable

## The app asks. It never answers.

Our applications send only predefined, reviewed queries. The browser is never handed the ability to ask the model anything it likes.

<!-- cards -->
- **Measures** — Stay defined in the semantic model. It remains the calculation authority.
- **Security** — Row-level security and permissions follow the individual, never a pooled service account.
- **Surface** — No general-purpose query endpoint is exposed. Ever.

---

<!-- slide: group="Governance" nav="Governed agents" -->

#### The parallel build

## Who owns this number, and can it be trusted?

Our Data Product Agent governs the lifecycle of every measure across Fabric, Dataverse, Power BI and the OneLake catalog. Four patterns carried the weight.

<!-- list mint -->
- **Extract documentation, don't write it.** Meaning is drawn from the model (logic, dependencies, lineage), not retyped into a document that starts drifting the moment it is saved.
- **Ownership is a gate.** A measure moves forward only when a business owner, technical owner and data steward are named. Missing ownership stops registration.
- **Nothing both decides and writes.** Each step hands a validated, typed contract to the next. No free-form instructions cross a boundary.
- **Exceptions route to a human.** When something can't complete correctly, work stops and a named governance role reviews it. The system never guesses.
- **It publishes to the catalogue.** Governed products land in the OneLake catalog beside the model they describe, so discovery arrives with ownership, endorsement and lineage already attached.

---

<!-- slide: group="Governance" nav="Privacy by construction" -->

#### FOIP, enforced not promised

## Privacy as a property of the system

<!-- cards edge=amber -->
- **Aggregate only** — No individual student rows are surfaced. Every value returned comes from a pre-defined aggregate measure.
- **Small groups suppressed** — Where five or fewer students sit behind a figure it is suppressed. Where subtraction could still reveal it, both sides are suppressed.
- **Security never bypassed** — The model enforces access. Users are told their scope limits a result; the system never infers what they cannot see.

Sensitivity classification and Purview labels travel *with* the record (aggregate, school, division or restricted) and govern who may receive it.

---

<!-- slide: group="Governance" nav="Residency" lead -->

#### The boundary we don't trade

## Canadian residency is a boundary,<br>not a preference

Identifiable student information, including anything student-identifiable used with AI, stays inside the approved Canadian geography.

We will not stand up a copy of student data outside Canada to gain early access to a preview tool. That has already cost us an attractive option, and it was still the right call. Evaluation happens on synthetic data or it doesn't happen.

---

<!-- slide: group="Governance" nav="Intelligence on top" lead -->

#### The payoff

## AI is only as trustworthy as<br>what it stands on

Every discipline in this deck exists so that when someone asks a question in plain language, the answer can be trusted, and so that governance survives the asking.

<!-- cards edge=mint -->
- **Ask where the work happens** — Copilot, Teams, Excel and Foundry, grounded in the same governed measures and the meaning the OneLake catalog already carries into them, not a separate copy of the data.
- **Permission-aware by construction** — Work IQ runs every request **user-scoped**. It accesses only what that person is already allowed to see. The named-user principle we built on, enforced at the intelligence layer.
- **Already speaking the protocol** — Our documentation agent is an A2A connected tool today. The governed catalogue becomes something agents can reason over, not just something people read.

🟠 **Eyes open** Every invocation is logged and evaluable, which is good for audit. It is consumption-billed, and residency still has to be answered before student-identifiable context goes anywhere near it.

---

<!-- slide: group="Governance" nav="Proof: the loop closes" lead -->

#### Working today, not a mock-up

## A governed measure became a plan<br>that goes home in a backpack

Our Foundations program plan is **generated, not assembled**: a Microsoft 365 Copilot skill reads the FVSD Analytics semantic model directly.

<!-- cards edge=mint -->
- **Nothing is re-keyed** — Screener scores, descriptive terms and cohort placement populate straight from the governed dataset. The teacher adds professional judgement; the evidence is already there and already correct.
- **Built to be read by a parent** — Letter portrait, proper margins, prints clean. Not a dashboard export, but a document a family reads at a kitchen table, with signatures at the end.
- **It scaffolds the writing** — Parent-friendly comment stems help staff describe strengths and next steps in language families actually use, raising the floor on every plan that goes out.

This is the entire argument in a single artifact: **a governed measure became a document a parent can act on, and nobody copied a number to get there.**

---

<!-- slide: group="The Opportunity" nav="The consumption question" lead -->

#### Everyone asks about consumption cost

## Break-even is about an hour a month

The honest way to price this isn't against a software budget. It's against the cost of the person waiting on the answer.

<!-- stats -->
- **$70** one teacher hour
- **$90** one principal hour
- **$120** one executive hour

Copilot lands under a single teacher hour per person per month. Fabric adds roughly **$5**, about a fourteenth of that same hour. **Save one hour a month and the stack has paid for itself; that hour is worth $840 a year per teacher.** Everything after that is return.

🟢 **Conservative** These are base rates before benefits and overhead, so the real hourly cost is higher and the real payback is faster.

---

<!-- slide: group="The Opportunity" nav="Replacing the vendor" -->

#### The business case

## Bringing program plans in-house

<!-- stats -->
- **~80%** of the data foundation already exists in Dataverse
- **~10** additional tables estimated, to be confirmed in discovery
- **1** set of form, validation and audit patterns, built once and used twice

This is a **workflow project, not a platform project**, which is precisely why it is credible. Plans would open from the student profile or a staff caseload, with screening evidence already beside the goals.

---

<!-- slide: group="The Opportunity" nav="Provincial connection" -->

#### The strategic differentiator

## A division-owned provincial connection

Today the provincial exchange reaches us through third-party interfaces. Owning it directly would give us control of timing, visible submission status for our own staff, and one governed workflow end to end.

<!-- flow -->
- **Stage 0 · Discovery** — Confirm supported operations, environments and registration.
- **Stage 1 · Connectivity** — One documented call from an isolated connector.
- **Stage 2 · Read & sync** — One approved area, resumable after interruption.
- **Stage 3 · Narrow write** — One low-volume operation, with concurrency tested.
- **Stage 4 · Harden** — Monitoring, retries, certificate lifecycle, runbooks.

🟠 **Candour** Avoided vendor dependency is valuable, but it is not free integration. If you aren't prepared to fund lifetime ownership, don't start.

---

<!-- slide: group="The Opportunity" nav="Capability map" -->

#### Honest status labels

## Where each capability actually stands

| Capability | Status | Value |
|---|---|---|
| Leadership analytics | 🟢 **Live** | District signal down to the grade and period needing attention |
| Assessment entry | 🟢 **Partial** | Modern validated entry; scoring stays governed as data |
| School & student profiles | 🔵 **Planned** | One role-aware starting point per school or student |
| Individual program plans | 🟢 **Active build** | Annual plans joined to screening evidence through governed modules |
| Intervention tracking | 🔵 **Phase 1–2** | Intervention Focus within the annual-plan workflow |
| Microsoft 365 Copilot integration | 🔵 **Phase 3** | Work IQ, agents, skills and governed tools through the Copilot harness |
| Provincial connector | 🔵 **Phase 4** | Division-owned exchange with the province |
| OneLake catalog governance | 🔵 **Phase 3** | Meaning, ownership, endorsement and lineage beside the model |
| Purview protection | 🔵 **Phase 3** | Sensitivity labels, DLP and compliance for app content and AI |

---

<!-- slide: group="Where Next" nav="Platform today" lead -->

#### Where it runs

## Azure today, deliberately

React and ASP.NET Core in Canada Central. Complete control over the experience, the security boundary, the region and the timing of every release.

Azure is the confirmed application home. It gives FVSD a stable operational experience now while allowing Foundry services and the Microsoft 365 Copilot harness to be added through governed contracts.

---

<!-- slide: group="Where Next" nav="Foundry service plane" -->

#### Confirmed platform direction

## Nexus is the application.<br>Foundry is the intelligence service plane.

Microsoft Foundry will provide the approved API, model, agent, evaluation, toolbox and MCP components. The Azure application remains the structured operational experience, while the Microsoft 365 Copilot harness becomes an additional governed entry point in Phase 3.

<!-- cards -->
- **Reusable services** — One governed tool or agent contract can support Nexus and Microsoft 365 Copilot.
- **Clear authority** — Dataverse remains operational truth; Fabric remains the governed analytical layer and, through the OneLake catalog, where meaning is governed.
- **Same identity** — Entra identity and destination permissions continue to follow the named user.

---

<!-- slide: group="Where Next" nav="Governance moves to Fabric" lead -->

#### Validation, November 2026

## Governance moved to where<br>the measures live

Microsoft is moving data governance into Fabric. The OneLake catalog becomes the single foundation for discovery, governance and protection; Purview Data Governance retires in November 2027.

<!-- list mint -->
- **The catalogue now sits beside the calculation.** Meaning, ownership, endorsement and lineage live in the same platform as the semantic model they describe. *Extract, don't write* gets easier, not harder.
- **Purview does what it does best.** Labels, data-loss prevention and compliance across the estate and AI, without also being the catalogue.
- **It travels to where people work.** The catalog is embedded in Teams, Excel and Foundry, so the same permissions and lineage govern how AI uses the data.
- **Our principle didn't move.** The catalogue was never a fourth source of truth. Only its address changed.

🟠 **Eyes open** Our catalog agent still publishes to Purview. It gets re-pointed to the OneLake catalog well before support ends, and we confirm exactly what the retirement covers with Microsoft.

---

<!-- slide: group="Where Next" nav="The Copilot harness" -->

#### Phase 3

## Conversation becomes another doorway,<br>not another source of truth.

<!-- list mint -->
- **Work IQ supplies permission-aware work context** inside the Microsoft 365 Copilot harness.
- **Foundry supplies the governed service components**: APIs, models, agents, evaluations, tools and MCP connections.
- **Nexus and destination systems keep the rules**: authorization, validation, scoring, workflow state and consequential writes remain deterministic.

🟠 **Boundary** An agent can explain, prepare and coordinate work; it cannot grant itself data access or replace the person accountable for a student decision.

---

<!-- slide: group="Where Next" nav="The gate" -->

#### Conditions we will not waive

## Any platform move clears the same gate

- **The three sources of truth survive unchanged.** First test, not last.
- **Canadian storage and processing** of identifiable student information.
- **Named-user access.** People continue to act as themselves.
- **Ownership and portability** of what we build. We must be able to take it with us.
- **Security, auditing, accessibility and monitoring** at least equal to what we have now.

Preview availability is not a strategy. We build so adoption is a cheap choice later, never a dependency now.

---

<!-- slide: group="Where Next" nav="Roadmap" -->

#### Staged and reversible

## Every step buys evidence

<!-- timeline -->
- [x] **Now · Deployed** — Leadership analytics and the class assignment / screening history slice, running on real identity and real permissions.
- [ ] **Phase 1 · Active** — Finish Fabric pages, Class Assignments, Assessments and the core modular IEP / IPP.
- [ ] **Phase 2** — Extend IEP / IPP to incorporate agreed Dossier functionality, history and migration.
- [ ] **Phase 3** — Connect Copilot, Work IQ, agents, skills and MCP components through the Microsoft 365 Copilot harness.
- [ ] **Phase 4** — Deliver the FVSD-owned PASI connector with status, retry, reconciliation and support controls.
- [ ] **Every release** — Parallel validation, accessibility, privacy, security and support evidence. A date never overrides an unmet readiness gate.

---

<!-- slide: group="Takeaways" nav="Portable patterns" -->

#### If you take one thing

## Patterns that travel beyond education

<!-- cards edge=cyan cols=two title=h3 number -->
- **Name your sources of truth, then defend them** — Record, calculation, identity. Write them down. Every architecture decision becomes a test against three lines.
- **Build vertical slices, not prototypes** — One narrow journey built completely earns more trust than a broad demo that works only on stage.
- **Extract documentation from the model** — Anything written separately is already drifting. The model already holds the truth. Reveal it.
- **Separate deciding from writing** — No component should both make a judgement and commit it. Contracts between steps, not free-form instructions.

---

<!-- slide: group="Takeaways" nav="The real return: trust" lead -->

#### What the discipline actually buys

## The return isn't efficiency.<br>It's trust.

Hours saved are how you justify the invoice. Trust is why the work matters, and in public education it is the currency you cannot buy back once it is spent.

<!-- cards edge=mint -->
- **Our Board** — Numbers that hold up under questioning. Every figure has a definition, an owner and a lineage; a hard question gets an answer, not a research project.
- **Our parents** — A plan for their child that is consistent, current and defensible, because it is written from evidence rather than reassembled from four systems the night before.
- **Our province** — Reporting we can stand behind, with privacy enforced by construction and an audit trail that already exists, because it was never bolted on afterwards.

Governance is what makes an answer **defensible**. Everything else in this deck is the machinery that produces one.

---

<!-- slide: layout=statement group="Takeaways" nav="Closing thought" -->

> Governance isn't a constraint on self-service.<br>It's the condition that makes it possible.

*Without it, the loop never closes; it just repeats the same assumptions faster*

---

<!-- slide: layout=title group="Takeaways" nav="Thank you" -->

# Thank you

Happy to talk about governed agents, semantic-model discipline, or what it takes to build this in a division with a very small team.

<!-- byline -->
**Scott Mckenzie**\
Chief Technology Officer · Fort Vermilion School Division

---

*🏫 FVSD Nexus · Fort Vermilion School Division · Presentation layer*
