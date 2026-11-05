# Individual Education and Individual Program Plans

> [FVSD Nexus](../../../README.md) / [Documentation](../../README.md) / [Capabilities](../README.md) / Individual Education and Individual Program Plans

**Status:** Approved for implementation; Class Assignment plan history, annual-plan creation, and governed module composition are implemented as the first operational slice

The IEP/IPP capability will replace the current third-party user experience while retaining Dataverse as the FVSD operational truth store. IEP and IPP use the same underlying plan workflow. The displayed classification is expected to depend on the plan's selected modules and goals: a curriculum-only plan can be identified as an IEP, while a plan containing broader program modules can be identified as an IPP. The final classification rule remains to be confirmed before it becomes an enforced business rule.

## Confirmed entry point and annual plan rule

- Plans are opened from the selected student's context, following the same interaction pattern as Student Assessment History and Intervention History.
- The student view lists the student's available plans and opens the selected plan without rebuilding school, teacher, or student filters.
- Foundations sections expose both relevant literacy/numeracy assessment history and IEP/IPP history. Homeroom exposes IEP/IPP history. Literacy and Numeracy expose their relevant assessment histories without adding a plan entry point.
- A student can have no more than one plan for a school year, regardless of whether the plan is displayed as an IEP or IPP.
- Nexus must enforce the student and school-year uniqueness rule on the server and through a Dataverse alternate key or equivalent database constraint. A user-interface check alone is insufficient.
- Historical school years remain available from the student plan list and are distinct from the current editable plan.
- Student-level intervention work is represented by the existing **Intervention Focus** plan module rather than a separate School Administration intervention page. Aggregate intervention analytics can remain a separate governed analytics concern.

## Functional source baseline

The working **Educational Framework** Canvas app is the current functional reference. Its `conIPP` layout container contains the principal plan editor: section navigation, student context, SPED coding, goals and rubric levels, ORF and Word Study, writing snapshots, comments and next steps, intervention and screener evidence, signatures, document compilation, and export history.

Nexus will preserve the functional rules and structured Dataverse records without reproducing the Canvas app's large client-side formula graph or treating generated HTML as operational truth. The selected student, teacher, school-year, and plan context currently supplied by the surrounding Canvas screen must become explicit Nexus navigation and API inputs.

Nexus will also replace the Canvas/Power Automate/OneDrive HTML-to-PDF chain with app-native server-side document generation. The plan screen and PDF will share semantic templates derived from the same structured records; see [App-native document and PDF generation](../../architecture/document-generation.md).

## Modular plan model

`fvsd_ippsection` (`IPP Sections`) is the module-definition catalogue. It is not a fixed list of pages that every student receives.

- Each plan selects only the modules required for that student.
- A plan can contain multiple distinct modules.
- Module definitions can be added as requirements are confirmed and as existing Dossier functionality is migrated.
- School-specific and curriculum-specific availability remains supported.
- Required, locked, optional, display-order, and export behaviour belong to module configuration rather than hard-coded page navigation.
- Module order comes from the governed `fvsd_ippsection.fvsd_sortorder` value rather than the allocation-string order.

`fvsd_studentipp.fvsd_ippsections` remains the module-allocation field. It stores the selected `fvsd_ippsection` GUIDs as a pipe-delimited string. This is intentionally a lightweight membership list, not storage for module content.

```text
Student
  `-- Annual Plan (one per student + school year)
        |-- fvsd_ippsections: guid|guid|guid
        |       `-- resolves to governed fvsd_ippsection definitions
        `-- structured module data in activities, goals, levels, notes,
            student details, assessments, and bounded module tables
```

The existing allocation column is an audited, writable 2,000-character Dataverse text field. Canonical 36-character GUIDs plus separators permit approximately 54 module allocations, which is comfortably above the current catalogue. Nexus must monitor this limit as Dossier modules are added.

### Allocation defaults

When an annual plan is created:

1. **Student Details** is always allocated.
2. **Screener Results** is always allocated.
3. **Student Conditions and Coding** is also allocated when the synchronized student record is SPED Coded at creation time.
4. The teacher adds or removes the remaining applicable modules.

The coded-state check establishes the creation-time default. A later coding change must not silently rewrite an existing plan; any required reconciliation behaviour remains to be defined. Required and locked behaviour should use the module catalogue's existing configuration.

### Nexus allocation contract

The browser will not directly concatenate or patch the string. A purpose-built API operation will:

- Parse only non-empty pipe-separated values as GUIDs.
- Reject unknown, inactive, school-inapplicable, or curriculum-inapplicable module definitions.
- Add the creation defaults and prevent required or locked modules from being removed.
- De-duplicate allocations and persist a canonical `guid|guid|guid` value without spaces or a trailing separator.
- Use Dataverse optimistic concurrency so two editors cannot silently overwrite one another's module changes.
- Resolve display order and labels from `fvsd_ippsection` after reading the allocation list.

The text field is not filterable and should not be used for cross-plan module reporting. If Nexus later needs repeated instances of the same module, per-allocation status or dates, cross-plan module queries, or more than the column can safely hold, that requirement will trigger reconsideration of a related allocation table.

Module content remains structured. Shared module data should use existing plan, goal, progress, activity, note, student-detail, assessment, and attachment records. A genuinely different data shape can use a bounded module-specific related table and frontend/backend handler. It should not be placed into generated HTML or unvalidated JSON merely to avoid modelling it.

### HTML retirement direction

Nexus will not add a dedicated multi-line HTML column for each module. Existing `IPP Section - ...` HTML columns can remain temporarily for Canvas compatibility and migration comparison, but they are legacy output caches rather than authoritative module data. Nexus will render the interactive plan and generate print/export output from structured records at request time.

## Current Dataverse foundation

| Table | Role in Nexus |
|---|---|
| `fvsd_studentipp` | Annual student plan master, historical context snapshot, and pipe-delimited module allocation list. |
| `fvsd_ippsection` | Module-definition catalogue. |
| `fvsd_ippgoal` | Governed goal definitions associated with modules. |
| `fvsd_ipplevel` | Governed progress/rubric definitions. |
| `fvsd_studentipplevel` | Student-specific goal, level, and achievement-date records. |
| `fvsd_ippactivity` | Comments, writing snapshots, evidence, and other plan activity. |
| `fvsd_spedcondition` | Governed condition definitions used with synchronized student details. |
| Dataverse Notes | Exported plans and supporting attachments. |

No new allocation table is required for the initial Nexus design. Additional module-specific tables will be introduced only when a migrated Dossier module has a distinct structured data requirement.

## Dossier migration direction

Dossier migration will be incremental and module-led:

1. Inventory a Dossier module and its historical data, documents, rules, and output requirements.
2. Map it to an existing `fvsd_ippsection` definition or add a governed definition.
3. Reuse common Nexus plan structures where the data meaning matches.
4. Add a module-specific structure and handler only for genuinely different content.
5. Preserve source system, legacy identifier, migration batch, and reconciliation status.
6. Validate representative current and historical plans against Dossier before enabling the module broadly.

This permits new modules to enter Nexus without redesigning the annual plan or creating a separate page for each plan type.

## Current Nexus implementation

The first operational plan slice is available from the selected student in Class Assignment:

- Current and previous annual plans load from `fvsd_studentipp`.
- **Add IEP / IPP** opens an explicit creation confirmation; navigation alone never creates a record.
- Creation is limited to Foundations and Homeroom sections and uses the active school year and authorized student/class context.
- The API rejects a second active plan for the same student and school year.
- New plans receive Student Details and Screener Results, plus Student Conditions and Coding when the student is SPED Coded.
- Selected modules appear in a compact horizontal navigator. Opening a module is separate from changing membership.
- **Manage modules** expands a grouped, full-width catalogue using live `fvsd_ippsection` configuration, including curriculum, school-specific, availability, sort-order, required, and lock-on-select rules.
- Teachers can add or remove applicable modules. Required and locked modules cannot be removed.
- Module allocation updates use the plan ETag and `If-Match`; a concurrent update is reloaded rather than silently overwritten.
- Selected definitions that later become inactive or inapplicable remain visible and locked so an existing plan is not silently stripped.
- Student Details has the first live section renderer. Other selected modules currently show an honest migration placeholder until their structured tables and forms are connected.

The earlier static Foundations 1 document remains the print/design reference when no Class Assignment plan context is supplied. Its values are illustrative and are not written to Dataverse.

## Current premise

- Existing Dataverse structures and the working Canvas implementation cover most of the currently understood IEP/IPP information and behaviour.
- The modular model retains the audited pipe-delimited allocation field and may add bounded module-specific tables as Dossier discovery proceeds; table count is not treated as a fixed design target.
- Required PowerSchool demographic context already synchronizes to Dataverse.
- The principal delivery work is expected to be UX, workflow, and controlled migration rather than foundational integration.

## Capability areas

- Student plan history and annual-plan creation, with one plan per student per school year.
- Modular plan composition using governed `fvsd_ippsection` definitions.
- Goals, objectives, and baselines.
- Progress observations and evidence.
- Assigned staff and collaborative work.
- Review cycles, status, and approval history.
- Attachments and supporting documentation.
- Printable or exportable plans and progress summaries.
- Role-aware student and school access.
- Incremental, provenance-preserving migration from Dossier.

## Experience direction

- Start from the authorized student's profile or staff caseload.
- Allow an authorized Class Assignment user to open the selected student's current plan without rebuilding the student context as a separate filter workflow.
- Present the current plan, required actions, and recent progress clearly.
- Use progressive disclosure so occasional users are not confronted with the entire data structure.
- Reuse the same form, validation, audit, and status patterns established for assessment entry.
- Separate current operational values from Fabric analytics that update through OneLake.

## Discovery priorities

1. Inventory every current vendor workflow, including less-visible administrative behaviour.
2. Confirm the remaining Dataverse tables and relationships.
3. Determine plan versioning and amendment rules.
4. Confirm attachment, evidence, retention, and export requirements.
5. Obtain and validate a complete historical-data export.
6. Define the staff, school, student, and administrative access matrix.
7. Establish parallel-run and migration acceptance criteria.

## Primary risks

- Incomplete vendor exports or undocumented workflows.
- Historical plan and progress versioning.
- Attachment volume and retention requirements.
- Concurrent editing and approval behaviour.
- Reproducing printable outputs relied upon by staff.
- Support and product ownership after vendor retirement.

## PASI relationship

The Phase 4 [PASI connector](../pasi-connector/README.md) can support replacement of overlapping third-party student-support functions, but the boundaries must remain explicit:

- Nexus IPP owns plan, goal, progress, review, approval, and export workflows.
- PASI integration owns only provincially supported and FVSD-authorized exchanges.
- Discovery must identify which current Intellimedia, Jigsaw, and PowerSchool functions depend on PASI.
- No assumption has been made that an IPP document or every IPP field is submitted to PASI.
- PASI connector tables and IPP tables should be designed only after the provincial operation and retention requirements are confirmed.

## Related documentation

- [Profiles](../profiles/README.md)
- [Data and integrations](../../architecture/data-and-integrations.md)
- [ADR-0006: Modular annual student plans](../../decisions/adr/0006-modular-annual-student-plans.md)
- [App-native document and PDF generation](../../architecture/document-generation.md)
- [Phased delivery plan](../../delivery/roadmap.md)
- [PASI provincial connector](../pasi-connector/README.md)
