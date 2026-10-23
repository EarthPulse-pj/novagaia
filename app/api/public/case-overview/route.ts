import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET() {
  try {
    const { data: cases, error } = await supabaseAdmin
      .from("blacklist_cases")
      .select(
        "id, case_number, report_id, subject, category, status, publication_checklist, created_at"
      )
      .in("status", ["published", "response", "update", "cleared"])
      .order("case_number", { ascending: true });

    if (error) {
      console.error("Public case overview retrieval error:", error);
      return NextResponse.json(
        { success: false, error: "Unable to load public cases." },
        { status: 500 }
      );
    }

    const approvedCases = (cases ?? []).filter((item) => {
      const checklist = item.publication_checklist;

      return (
        checklist !== null &&
        typeof checklist === "object" &&
        !Array.isArray(checklist) &&
        checklist.caseReview === true &&
        checklist.evidenceReviewed === true &&
        checklist.riskAssessmentReviewed === true &&
        checklist.publicDisclosureReady === true
      );
    });

    const approvedCaseIds = approvedCases.map((item) => item.id);

    const { data: projectAssessments, error: projectAssessmentsError } =
      approvedCaseIds.length > 0
        ? await supabaseAdmin
            .from("blacklist_risk_assessments")
            .select("*")
            .in("case_id", approvedCaseIds)
        : { data: [], error: null };

    if (projectAssessmentsError) {
      console.error(
        "Public project risk assessment retrieval error:",
        projectAssessmentsError
      );

      return NextResponse.json(
        { success: false, error: "Unable to load public cases." },
        { status: 500 }
      );
    }

    const { data: promoterAssessments, error: promoterAssessmentsError } =
      approvedCaseIds.length > 0
        ? await supabaseAdmin
            .from("blacklist_promoter_assessments")
            .select("*")
            .in("case_id", approvedCaseIds)
        : { data: [], error: null };

    if (promoterAssessmentsError) {
      console.error(
        "Public promoter assessment retrieval error:",
        promoterAssessmentsError
      );

      return NextResponse.json(
        { success: false, error: "Unable to load public cases." },
        { status: 500 }
      );
    }

    const reportIds = approvedCases
      .map((item) => item.report_id)
      .filter(
        (id): id is string =>
          typeof id === "string" && id.length > 0
      );

    const contractAddressByReportId: Record<string, string | null> = {};

    const descriptionByReportId: Record<string, string | null> = {};

    const evidenceByReportId: Record<string, string | null> = {};

    if (reportIds.length > 0) {
      const { data: reports, error: reportsError } = await supabaseAdmin
        .from("threat_reports")
        .select("id, contract_address, description, evidence")
        .in("id", reportIds);

      if (reportsError) {
        console.error("Public case contract lookup error:", reportsError);
        return NextResponse.json(
          { success: false, error: "Unable to load public cases." },
          { status: 500 }
        );
      }

      for (const report of reports ?? []) {
        contractAddressByReportId[report.id] =
          report.contract_address ?? null;

        descriptionByReportId[report.id] =
          report.description ?? null;

        evidenceByReportId[report.id] =
          report.evidence ?? null;
      }
    }

    const publicCases = approvedCases.map((item) => {
      const projectAssessment =
        (projectAssessments ?? [])
          .filter((assessment) => assessment.case_id === item.id)
          .sort(
            (a, b) =>
              new Date(b.updated_at ?? b.assessed_at ?? 0).getTime() -
              new Date(a.updated_at ?? a.assessed_at ?? 0).getTime()
          )[0] ?? null;

      const promoterAssessment =
        (promoterAssessments ?? [])
          .filter((assessment) => assessment.case_id === item.id)
          .sort(
            (a, b) =>
              new Date(b.updated_at ?? b.assessed_at ?? 0).getTime() -
              new Date(a.updated_at ?? a.assessed_at ?? 0).getTime()
          )[0] ?? null;

      // Use the most recently updated saved assessment when both exist.
      const projectTime = projectAssessment
        ? new Date(
            projectAssessment.updated_at ??
              projectAssessment.assessed_at ??
              0
          ).getTime()
        : -1;

      const promoterTime = promoterAssessment
        ? new Date(
            promoterAssessment.updated_at ??
              promoterAssessment.assessed_at ??
              0
          ).getTime()
        : -1;

      const assessmentType =
        promoterAssessment && promoterTime > projectTime
          ? "promoter"
          : projectAssessment
            ? "project"
            : promoterAssessment
              ? "promoter"
              : "none";

      const selectedAssessment =
        assessmentType === "promoter"
          ? promoterAssessment
          : projectAssessment;

      return {
        id: item.id,
        caseNumber: `NG-BL-${String(item.case_number).padStart(4, "0")}`,
        projectName: item.subject,
        category: item.category,
        description: item.report_id
          ? descriptionByReportId[item.report_id] ?? null
          : null,
        contractAddress: item.report_id
          ? contractAddressByReportId[item.report_id] ?? null
          : null,
        evidence: item.report_id
          ? evidenceByReportId[item.report_id] ?? null
          : null,
        caseDate: item.created_at,
        status:
          item.status === "cleared"
            ? "Cleared"
            : item.status === "response"
              ? "Response"
              : item.status === "update"
                ? "Update"
                : "Published",
        workflowStage:
          item.status === "cleared"
            ? "Cleared"
            : item.status === "response"
              ? "Response"
              : item.status === "update"
                ? "Update"
                : "Published",
        assessmentType,
        assessment: selectedAssessment
          ? assessmentType === "promoter"
            ? {
                promoter_risk_score: selectedAssessment.promoter_risk_score ?? null,
                promoter_risk_band: selectedAssessment.promoter_risk_band ?? null,
                promotion_history: selectedAssessment.promotion_history ?? null,
                project_due_diligence: selectedAssessment.project_due_diligence ?? null,
                misleading_claims: selectedAssessment.misleading_claims ?? null,
                transparency_disclosure: selectedAssessment.transparency_disclosure ?? null,
                promotion_pattern: selectedAssessment.promotion_pattern ?? null,
                financial_incentives: selectedAssessment.financial_incentives ?? null,
                community_conduct: selectedAssessment.community_conduct ?? null,
                evidence_strength: selectedAssessment.evidence_strength ?? null,
                evidence_confidence_score: selectedAssessment.evidence_confidence_score ?? null,
                evidence_confidence_level: selectedAssessment.evidence_confidence_level ?? null,
                assessed_at: selectedAssessment.assessed_at ?? null,
                updated_at: selectedAssessment.updated_at ?? null,
              }
            : {
                overall_score: selectedAssessment.overall_score ?? null,
                risk_band: selectedAssessment.risk_band ?? null,
                contract_token_controls: selectedAssessment.contract_token_controls ?? null,
                holder_distribution: selectedAssessment.holder_distribution ?? null,
                liquidity_exit_risk: selectedAssessment.liquidity_exit_risk ?? null,
                team_transparency: selectedAssessment.team_transparency ?? null,
                website_infrastructure: selectedAssessment.website_infrastructure ?? null,
                marketing_promotion: selectedAssessment.marketing_promotion ?? null,
                community_behavior: selectedAssessment.community_behavior ?? null,
                on_chain_behavior: selectedAssessment.on_chain_behavior ?? null,
                assessed_at: selectedAssessment.assessed_at ?? null,
                updated_at: selectedAssessment.updated_at ?? null,
              }
          : null,
      };
    });

    return NextResponse.json(
      { success: true, cases: publicCases },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    console.error("Public case overview API error:", error);
    return NextResponse.json(
      { success: false, error: "Unable to load public cases." },
      { status: 500 }
    );
  }
}