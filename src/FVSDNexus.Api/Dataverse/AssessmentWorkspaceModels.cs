namespace FVSDNexus.Api.Dataverse;

public sealed record AssessmentSchoolOption(Guid Id, string Name);

public sealed record AssessmentSectionGroupOption(string Value, string Label, int SortOrder);

public sealed record AssessmentWorkspaceContext(
    string Role,
    IReadOnlyList<AssessmentSchoolOption> Schools,
    Guid? DefaultSchoolId,
    bool SchoolSelectionEnabled,
    bool TeacherLockedToSignedInUser);

public sealed record AssessmentTeacherSection(
    Guid Id,
    string SectionNumber,
    Guid SchoolId,
    string SchoolName,
    string SectionGroup,
    int SectionGroupOrder,
    string CourseNumber,
    string CourseName,
    int SortOrder,
    Guid TeacherId,
    string TeacherName,
    int StudentCount);

public sealed record AssessmentStudent(
    Guid StudentSectionId,
    string? SectionNumber,
    Guid Id,
    string Name,
    string? ObfuscatedName,
    string? Asn,
    string? ObfuscatedAsn,
    DateTimeOffset? DateOfBirth,
    string? Gender,
    string? Grade,
    int? GradeValue,
    string? SpedCategory,
    string? SpedSeries,
    string? Fnmi,
    string? EslCategory,
    string? SpokenLanguage);

public sealed record AssessmentHistoryRecord(
    Guid Id,
    string AssessmentType,
    string RecordName,
    string SchoolYear,
    string Period,
    int PeriodSortOrder,
    DateTimeOffset? AssessmentDate,
    string? GradeAtAssessment,
    string? ChronologicalAge,
    string? Curriculum,
    string? SchoolAtAssessment,
    string? CourseNumber,
    string? CourseName,
    string? TeacherAtAssessment,
    string? SectionNumber,
    int? TotalCorrect,
    int? TotalError,
    int? RawScore,
    int? StandardScore,
    string? PercentileRank,
    string DescriptiveTerm,
    string? DescriptiveTermFill,
    string? DescriptiveTermFont,
    bool Exempt,
    string? ExemptReason,
    string? ETag);

public sealed record StudentPlanHistoryRecord(
    Guid Id,
    string Name,
    string SchoolYear,
    string? GradeAtPlan,
    string? SchoolAtPlan,
    string? TeacherAtPlan,
    string? CourseName,
    string? Curriculum,
    DateTimeOffset? ModifiedOn);

public sealed record StudentPlanModuleState(
    Guid Id,
    string Name,
    string Group,
    string Description,
    string FrontFacingDescription,
    int SortOrder,
    bool Selected,
    bool Available,
    bool LocksWhenSelected,
    bool Locked,
    bool CanRemove,
    string? StateReason);

public sealed record StudentPlanDetails(
    string SchoolYear,
    string? GradeAtPlan,
    string? SchoolAtPlan,
    string? CourseName,
    string? TeacherAtPlan,
    string? PrincipalAtPlan,
    string? ParentOrGuardianName,
    string? ParentOrGuardianEmail,
    decimal? FallAttendance,
    decimal? WinterAttendance,
    decimal? SpringAttendance,
    DateTimeOffset? ModifiedOn);

public sealed record StudentPlanModulesResponse(
    Guid PlanId,
    string ETag,
    StudentPlanDetails Details,
    IReadOnlyList<StudentPlanModuleState> Modules);

public sealed record StudentPlanAttendanceCommand(
    int? FallAttendance,
    int? WinterAttendance,
    int? SpringAttendance);

public sealed record StudentPlanSignatureDetailsCommand(
    string? ParentOrGuardianName,
    string? ParentOrGuardianEmail);

public sealed record StudentPlanSignature(
    Guid Id,
    string Name,
    int RecipientType,
    string RecipientTypeLabel,
    int SignatoryRole,
    string SignatoryRoleLabel,
    string SignatoryName,
    string SignatoryEmail,
    int SignatoryOrder,
    int SignatoryAddedOrder,
    bool AllowComments,
    DateTimeOffset? DateRequested,
    string? DateSigned,
    int StateCode,
    string StateLabel,
    int StatusCode,
    string StatusLabel,
    string? ETag);

public sealed record StudentPlanSignaturesResponse(
    Guid PlanId,
    string SchoolYear,
    IReadOnlyList<StudentPlanSignature> Signatures);

public sealed record StudentPlanSignatureChoiceOption(
    int Value,
    string Label);

public sealed record StudentPlanSignatureOptionsResponse(
    IReadOnlyList<StudentPlanSignatureChoiceOption> RecipientTypes,
    IReadOnlyList<StudentPlanSignatureChoiceOption> SignatoryRoles);

public sealed record StudentPlanSignatureCommand(
    int RecipientType,
    int SignatoryRole,
    string SignatoryName,
    string SignatoryEmail,
    int SignatoryOrder,
    bool AllowComments,
    string? ETag = null);

public sealed record StudentPlanSignatureOrderItem(
    Guid Id,
    string? ETag);

public sealed record StudentPlanSignatureOrderCommand(
    IReadOnlyList<StudentPlanSignatureOrderItem> Signatures);

public sealed record StudentPlanScreenerResult(
    string AssessmentType,
    string Period,
    int PeriodSortOrder,
    DateTimeOffset? AssessmentDate,
    int? StandardScore,
    string? DescriptiveTerm,
    string? DescriptiveTermFill,
    string? DescriptiveTermFont);

public sealed record StudentPlanScreenersResponse(
    Guid PlanId,
    string SchoolYear,
    IReadOnlyList<StudentPlanScreenerResult> Results);

public sealed record StudentPlanOralReadingFluencyResult(
    Guid Id,
    string Name,
    DateTimeOffset? AssessmentDate,
    int LevelOfReading,
    string LevelOfReadingLabel,
    int WordsPerMinute,
    string? ETag);

public sealed record StudentPlanOralReadingFluencyResponse(
    Guid PlanId,
    string SchoolYear,
    IReadOnlyList<StudentPlanOralReadingFluencyResult> Results);

public sealed record StudentPlanOralReadingFluencyOption(
    int Value,
    string Label);

public sealed record StudentPlanOralReadingFluencyOptionsResponse(
    IReadOnlyList<StudentPlanOralReadingFluencyOption> LevelsOfReading);

public sealed record StudentPlanOralReadingFluencyCommand(
    DateOnly AssessmentDate,
    int LevelOfReading,
    int WordsPerMinute,
    string? ETag = null);

public sealed record StudentPlanWordStudyRecord(
    Guid Id,
    string Name,
    DateTimeOffset? TermStartDate,
    DateTimeOffset? TermEndDate,
    Guid StartingLevelId,
    string StartingLevelName,
    string? StartingStageReference,
    string? StartingExpectedGrade,
    Guid? FinishingLevelId,
    string? FinishingLevelName,
    string? FinishingStageReference,
    string? FinishingExpectedGrade,
    string? ETag);

public sealed record StudentPlanWordStudyResponse(
    Guid PlanId,
    string SchoolYear,
    IReadOnlyList<StudentPlanWordStudyRecord> Records);

public sealed record StudentPlanWordStudyStageOption(
    Guid Id,
    string Name,
    string? Section,
    string? ExpectedGrade,
    int SortOrder,
    string Display);

public sealed record StudentPlanWordStudyOptionsResponse(
    IReadOnlyList<StudentPlanWordStudyStageOption> Stages);

public sealed record StudentPlanWordStudyCommand(
    DateOnly TermStartDate,
    Guid StartingLevelId,
    DateOnly? TermEndDate,
    Guid? FinishingLevelId,
    string? ETag = null);

public sealed record StudentPlanEmpowerLevelOption(
    Guid Id,
    string Name,
    string Description,
    string FillHex,
    string FontHex,
    int SortOrder);

public sealed record StudentPlanEmpowerGoal(
    Guid GoalId,
    string Name,
    string Alias,
    string Description,
    string FoundationLevel,
    string Division,
    string? Subsection,
    int SortOrder,
    Guid? ProgressId,
    Guid? InitialLevelId,
    string? InitialLevelName,
    string? InitialLevelFillHex,
    string? InitialLevelFontHex,
    DateTimeOffset? InitialDate,
    Guid? CurrentLevelId,
    string? CurrentLevelName,
    string? CurrentLevelFillHex,
    string? CurrentLevelFontHex,
    DateTimeOffset? CurrentDate,
    string? ETag);

public sealed record StudentPlanEmpowerResponse(
    Guid PlanId,
    string SchoolYear,
    string SectionName,
    string SectionDescription,
    IReadOnlyList<StudentPlanEmpowerLevelOption> Levels,
    IReadOnlyList<StudentPlanEmpowerGoal> Goals);

public sealed record StudentPlanEmpowerProgressCommand(
    Guid LevelId,
    DateOnly DateAchieved,
    string? ETag = null);

public sealed record StudentPlanMathematicsLevelOption(
    Guid Id,
    string Name,
    string Description,
    string FillHex,
    string FontHex,
    int SortOrder);

public sealed record StudentPlanMathematicsGoal(
    Guid GoalId,
    string Name,
    string Alias,
    string Description,
    string Outcome,
    string Grade,
    string ColumnTitle,
    int SortOrder,
    Guid? ProgressId,
    Guid? InitialLevelId,
    string? InitialLevelName,
    string? InitialLevelFillHex,
    string? InitialLevelFontHex,
    DateTimeOffset? InitialDate,
    Guid? CurrentLevelId,
    string? CurrentLevelName,
    string? CurrentLevelFillHex,
    string? CurrentLevelFontHex,
    DateTimeOffset? CurrentDate,
    string? ETag);

public sealed record StudentPlanMathematicsResponse(
    Guid PlanId,
    string SchoolYear,
    string SectionName,
    string SectionDescription,
    IReadOnlyList<StudentPlanMathematicsLevelOption> Levels,
    IReadOnlyList<StudentPlanMathematicsGoal> Goals);

public sealed record StudentPlanMathematicsProgressCommand(
    Guid LevelId,
    DateOnly DateAchieved,
    string? ETag = null);

public sealed record StudentPlanFmcsLevelOption(
    Guid Id,
    string Name,
    string Description,
    string FillHex,
    string FontHex,
    int SortOrder);

public sealed record StudentPlanFmcsGoal(
    Guid GoalId,
    string Name,
    string Alias,
    string Description,
    string Outcome,
    string ColumnTitle,
    int SortOrder,
    Guid? ProgressId,
    Guid? InitialLevelId,
    string? InitialLevelName,
    string? InitialLevelFillHex,
    string? InitialLevelFontHex,
    DateTimeOffset? InitialDate,
    Guid? CurrentLevelId,
    string? CurrentLevelName,
    string? CurrentLevelFillHex,
    string? CurrentLevelFontHex,
    DateTimeOffset? CurrentDate,
    string? ETag);

public sealed record StudentPlanFmcsResponse(
    Guid PlanId,
    string SchoolYear,
    string SectionName,
    string SectionDescription,
    IReadOnlyList<StudentPlanFmcsLevelOption> Levels,
    IReadOnlyList<StudentPlanFmcsGoal> Goals);

public sealed record StudentPlanFmcsProgressCommand(
    Guid LevelId,
    DateOnly DateAchieved,
    string? ETag = null);

public sealed record StudentPlanFmcsOutcomeCommand(string Outcome);

public sealed record StudentPlanWritingSnapshotRecord(
    Guid Id,
    string Subject,
    string Description,
    bool IncludeInExport,
    DateTimeOffset? CommentDate,
    string AddedBy,
    DateTimeOffset? CreatedOn,
    bool HasWritingSampleFile,
    string? WritingSampleFileName,
    bool HasWritingSampleImage,
    string? ETag);

public sealed record StudentPlanWritingSnapshotsResponse(
    Guid PlanId,
    string SchoolYear,
    IReadOnlyList<StudentPlanWritingSnapshotRecord> Snapshots);

public sealed record StudentPlanWritingSnapshotCommand(
    DateOnly CommentDate,
    string EvidenceOfDevelopment,
    bool IncludeInExport,
    string? ETag = null);

public sealed record StudentPlanWritingSnapshotUpload(
    string FileName,
    string ContentType,
    byte[] Content);

public sealed record StudentPlanWritingSnapshotContent(
    byte[] Content,
    string ContentType,
    string FileName);

public sealed record StudentPlanTeacherCommentRecord(
    Guid Id,
    Guid SectionId,
    string SectionName,
    string CommentsAndNextSteps,
    string? AdditionalObservations,
    bool IncludeInExport,
    DateTimeOffset? CommentDate,
    string AddedBy,
    DateTimeOffset? CreatedOn,
    string? ETag);

public sealed record StudentPlanTeacherCommentsResponse(
    Guid PlanId,
    string SchoolYear,
    IReadOnlyList<StudentPlanTeacherCommentRecord> Comments);

public sealed record StudentPlanTeacherCommentCommand(
    Guid SectionId,
    DateOnly CommentDate,
    string CommentsAndNextSteps,
    string? AdditionalObservations,
    bool IncludeInExport,
    string? ETag = null);

public sealed record StudentPlanIntervention(
    Guid Id,
    Guid? InterventionTypeId,
    string InterventionType,
    string? Interventionist,
    string? Teacher,
    string? School,
    string? Grade,
    string? Curriculum,
    string? CourseNumber,
    string? CourseName,
    DateTimeOffset? DateStarted,
    DateTimeOffset? DateWithdrawn,
    string? WithdrawnReason,
    string? AdditionalInformation,
    string? ETag);

public sealed record StudentPlanInterventionsResponse(
    Guid PlanId,
    string SchoolYear,
    IReadOnlyList<StudentPlanIntervention> Interventions);

public sealed record StudentPlanInterventionTypeOption(
    Guid Id,
    string Name,
    string Alias,
    string? Curriculum);

public sealed record StudentPlanInterventionistOption(
    string Name,
    string Role,
    string Display);

public sealed record StudentPlanInterventionSectionOption(
    Guid TeacherSectionId,
    string Curriculum,
    string SectionGroup,
    string CourseNumber,
    string CourseName,
    string TeacherName);

public sealed record StudentPlanInterventionOptionsResponse(
    string PlanSectionGroup,
    bool RequiresSourceSection,
    IReadOnlyList<string> Curricula,
    IReadOnlyList<StudentPlanInterventionSectionOption> StudentSections,
    IReadOnlyList<StudentPlanInterventionTypeOption> InterventionTypes,
    IReadOnlyList<StudentPlanInterventionistOption> Interventionists);

public sealed record StudentPlanInterventionCommand(
    Guid InterventionTypeId,
    DateOnly DateStarted,
    string? Interventionist,
    DateOnly? DateWithdrawn,
    int? WithdrawnReason,
    string? AdditionalInformation,
    Guid? SourceTeacherSectionId,
    string? ETag);

public sealed record StudentPlanCodingCategoryOption(
    Guid Id,
    string Code,
    string Name);

public sealed record StudentPlanCodingConditionOption(
    Guid Id,
    Guid? CategoryId,
    string CategoryName,
    string Name,
    string? Details);

public sealed record StudentPlanCodingGroup(
    string Key,
    string Title,
    Guid? CategoryId,
    string? CategoryName,
    IReadOnlyList<string> Conditions,
    string? Observations);

public sealed record StudentPlanCodingResponse(
    Guid PlanId,
    string ETag,
    StudentPlanCodingGroup Primary,
    IReadOnlyList<StudentPlanCodingGroup> AdditionalGroups,
    IReadOnlyList<StudentPlanCodingCategoryOption> Categories,
    IReadOnlyList<StudentPlanCodingConditionOption> ConditionOptions);

public sealed record StudentPlanCodingGroupCommand(
    Guid? CategoryId,
    IReadOnlyList<string>? Conditions,
    string? Observations);

public sealed record StudentPlanCodingCommand(
    IReadOnlyList<string>? PrimaryConditions,
    StudentPlanCodingGroupCommand? AdditionalOne,
    StudentPlanCodingGroupCommand? AdditionalTwo,
    StudentPlanCodingGroupCommand? AdditionalThree);

public sealed record StudentPlanDocument(
    Guid Id,
    string Title,
    string? Description,
    string FileName,
    string MimeType,
    int? FileSize,
    DateTimeOffset? ModifiedOn);

public sealed record StudentPlanDocumentContent(
    Guid Id,
    string FileName,
    string MimeType,
    byte[] Content);

public sealed record TosrecReferenceOption(
    int RawScore,
    int StandardScore,
    string PercentileRank,
    Guid DescriptiveTermId,
    string DescriptiveTerm,
    string? DescriptiveTermFill,
    string? DescriptiveTermFont);

public sealed record TosrecAssessmentCommand(
    DateOnly AssessmentDate,
    int Period,
    bool Exempt,
    string? ExemptReason,
    int? TotalCorrect,
    int? TotalError,
    string? ETag);

internal sealed record AssessmentAccessPolicy(
    string Role,
    IReadOnlyList<DataverseSchoolAssignment> AssignedSchools,
    bool CanViewAllSelectableSchools,
    bool SchoolSelectionEnabled,
    bool TeacherLockedToSignedInUser)
{
    public static AssessmentAccessPolicy Create(
        DataverseAccessContext accessContext,
        string? developmentRole,
        bool isDeveloper)
    {
        var role = isDeveloper && !string.IsNullOrWhiteSpace(developmentRole)
            ? NormalizeRole(developmentRole)
            : NormalizeRole(accessContext.EffectiveRole);
        var allAssignments = new[] { accessContext.PrimarySchool, accessContext.AlternativeSchool }
            .Where(school => school is not null)
            .Cast<DataverseSchoolAssignment>()
            .DistinctBy(school => school.Id)
            .ToArray();
        var assignments = role is "Administrator" or "Data Analyst"
            ? allAssignments
            : allAssignments.Take(1).ToArray();

        var broadSchoolAccess = role == "Data Analyst";
        var schoolSelectionEnabled = broadSchoolAccess
            || (role == "Administrator" && assignments.Length > 1);

        return new AssessmentAccessPolicy(
            role,
            assignments,
            broadSchoolAccess,
            schoolSelectionEnabled,
            role is "Teacher" or "Class Room Support");
    }

    public bool AllowsSchool(Guid schoolId, IReadOnlyList<AssessmentSchoolOption> availableSchools) =>
        availableSchools.Any(school => school.Id == schoolId);

    public bool CanManageHistoricalAssessments => Role is "Administrator" or "Data Analyst";

    public bool CanDeleteAssessments => Role is "Administrator" or "Data Analyst";

    private static string NormalizeRole(string role) => role switch
    {
        "School Administration" => "Administrator",
        "Student Support" => "Class Room Support",
        "Data Analyst (Administrator)" => "Data Analyst",
        _ => role
    };
}
