import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { isAdmin } from "@/lib/admin-auth";

export async function GET(request: Request) {
  try {
    const admin = await isAdmin();

    if (!admin) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized.",
        },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const caseId = searchParams.get("case_id");

    if (!caseId) {
      return NextResponse.json(
        {
          success: false,
          error: "case_id is required.",
        },
        { status: 400 }
      );
    }

    /*
     * ------------------------------------------------------------
     * 1. Load Blacklist Case
     * ------------------------------------------------------------
     */
    const { data: blacklistCase, error: caseError } =
      await supabaseAdmin
        .from("blacklist_cases")
        .select("*")
        .eq("id", caseId)
        .maybeSingle();

    if (caseError) {
      console.error(
        "Blacklist report case retrieval error:",
        caseError
      );

      return NextResponse.json(
        {
          success: false,
          error: "Unable to retrieve Blacklist case.",
        },
        { status: 500 }
      );
    }

    if (!blacklistCase) {
      return NextResponse.json(
        {
          success: false,
          error: "Blacklist case not found.",
        },
        { status: 404 }
      );
    }

    /*
     * ------------------------------------------------------------
     * 2. Load Original Threat Report
     * ------------------------------------------------------------
     */
    let threatReport = null;

    if (blacklistCase.report_id) {
      const { data, error } = await supabaseAdmin
        .from("threat_reports")
        .select(
          "id, created_at, report_number, threat_type, project, contract_address, evidence, description, contact, status"
        )
        .eq("id", blacklistCase.report_id)
        .maybeSingle();

      if (error) {
        console.error(
          "Blacklist report threat report retrieval error:",
          error
        );

        return NextResponse.json(
          {
            success: false,
            error: "Unable to retrieve source threat report.",
          },
          { status: 500 }
        );
      }

      threatReport = data ?? null;
    }

    /*
     * ------------------------------------------------------------
     * 3. Load Investigation
     * ------------------------------------------------------------
     */
    const { data: investigation, error: investigationError } =
      await supabaseAdmin
        .from("blacklist_investigations")
        .select("*")
        .eq("case_id", caseId)
        .maybeSingle();

    if (investigationError) {
      console.error(
        "Blacklist report investigation retrieval error:",
        investigationError
      );

      return NextResponse.json(
        {
          success: false,
          error: "Unable to retrieve investigation record.",
        },
        { status: 500 }
      );
    }

    /*
     * ------------------------------------------------------------
     * 4. Load Risk Assessment
     * ------------------------------------------------------------
     */
    const { data: riskAssessment, error: riskError } =
      await supabaseAdmin
        .from("blacklist_risk_assessments")
        .select("*")
        .eq("case_id", caseId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

    if (riskError) {
      console.error(
        "Blacklist report risk assessment retrieval error:",
        riskError
      );

      return NextResponse.json(
        {
          success: false,
          error: "Unable to retrieve risk assessment.",
        },
        { status: 500 }
      );
    }

    /*
     * ------------------------------------------------------------
     * 5. Load Publication Checklist
     * ------------------------------------------------------------
     */
    /*
     * ------------------------------------------------------------
     * 5. Load Saved Update
     * ------------------------------------------------------------
     */
    const { data: updateRecord, error: updateError } =
      await supabaseAdmin
        .from("blacklist_updates")
        .select("*")
        .eq("case_id", caseId)
        .maybeSingle();

    if (updateError) {
      console.error("Blacklist report update retrieval error:", updateError);
      return NextResponse.json(
        {
          success: false,
          error: "Unable to retrieve update record.",
        },
        { status: 500 }
      );
    }

    /*
     * ------------------------------------------------------------
     * 6. Load Latest Promoter Assessment
     * ------------------------------------------------------------
     */
    const {
      data: promoterAssessment,
      error: promoterAssessmentError,
    } = await supabaseAdmin
      .from("blacklist_promoter_assessments")
      .select("*")
      .eq("case_id", caseId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (promoterAssessmentError) {
      console.error(
        "Blacklist report promoter assessment retrieval error:",
        promoterAssessmentError
      );
      return NextResponse.json(
        {
          success: false,
          error: "Unable to retrieve promoter assessment.",
        },
        { status: 500 }
      );
    }
    const publicationChecklist =
      blacklistCase.publication_checklist ?? null;

    /*
     * ------------------------------------------------------------
     * 6. Load Public Response
     * ------------------------------------------------------------
     */
    const { data: responseRecord, error: responseError } =
      await supabaseAdmin
        .from("blacklist_responses")
        .select(
          "case_id, response_type, response_details, created_at, updated_at"
        )
        .eq("case_id", caseId)
        .maybeSingle();

    if (responseError) {
      console.error(
        "Blacklist report response retrieval error:",
        responseError
      );

      return NextResponse.json(
        {
          success: false,
          error: "Unable to retrieve response record.",
        },
        { status: 500 }
      );
    }

    /*
     * ------------------------------------------------------------
     * 7. Load Clearance
     * ------------------------------------------------------------
     */
    const { data: clearanceRecord, error: clearanceError } =
      await supabaseAdmin
        .from("blacklist_clearances")
        .select(
          "case_id, clearance_decision, clearance_reason, created_at, updated_at"
        )
        .eq("case_id", caseId)
        .maybeSingle();

    if (clearanceError) {
      console.error(
        "Blacklist report clearance retrieval error:",
        clearanceError
      );

      return NextResponse.json(
        {
          success: false,
          error: "Unable to retrieve clearance record.",
        },
        { status: 500 }
      );
    }

    /*
     * ------------------------------------------------------------
     * 8. Build Investigation Verification Checklist
     *
     * These are actual persisted verification fields.
     * Risk categories are intentionally NOT represented as
     * verification checkboxes because they are score-based.
     * ------------------------------------------------------------
     */
    const verificationChecklist = {
      projectIdentityReviewed:
        Boolean(investigation?.subject_identity_confirmed),

      teamOperatorInformationReviewed:
        Boolean(investigation?.team_activity_reviewed),

      websiteInfrastructureReviewed:
        Boolean(investigation?.subject_background_reviewed),

      publicStatementsReviewed:
        Boolean(investigation?.project_history_reviewed),

      contractTokenEvidenceReviewed:
        Boolean(investigation?.contract_reviewed),

      onChainActivityReviewed:
        Boolean(investigation?.on_chain_activity_reviewed),

      liquidityMarketActivityReviewed:
        Boolean(investigation?.liquidity_reviewed),

      tokenomicsPromotionalActivityReviewed:
        Boolean(investigation?.tokenomics_reviewed),
    };

    /*
     * ------------------------------------------------------------
     * 9. Build Risk Assessment Categories
     * ------------------------------------------------------------
     */
    const riskCategories = [
      {
        name: "Contract & Token Controls",
        score: riskAssessment?.contract_token_controls ?? null,
        max: 20,
      },
      {
        name: "Holder Distribution",
        score: riskAssessment?.holder_distribution ?? null,
        max: 15,
      },
      {
        name: "Liquidity & Exit Risk",
        score: riskAssessment?.liquidity_exit_risk ?? null,
        max: 15,
      },
      {
        name: "Team & Transparency",
        score: riskAssessment?.team_transparency ?? null,
        max: 10,
      },
      {
        name: "Website & Infrastructure",
        score: riskAssessment?.website_infrastructure ?? null,
        max: 10,
      },
      {
        name: "Marketing & Promotion",
        score: riskAssessment?.marketing_promotion ?? null,
        max: 10,
      },
      {
        name: "Community Behavior",
        score: riskAssessment?.community_behavior ?? null,
        max: 10,
      },
      {
        name: "On-Chain Behavior",
        score: riskAssessment?.on_chain_behavior ?? null,
        max: 10,
      },
    ];

    /*
     * ------------------------------------------------------------
     * 10. Determine publication status
     * ------------------------------------------------------------
     */
    const status =
      blacklistCase.status === "cleared"
        ? "Cleared"
        : blacklistCase.status === "published" ||
          blacklistCase.publication_status === "published"
        ? "Published"
        : blacklistCase.status === "update"
        ? "Updated"
        : blacklistCase.status;

    /*
     * ------------------------------------------------------------
     * 11. Return PUBLICATION-SAFE report data
     *
     * Internal investigator notes are deliberately excluded.
     * ------------------------------------------------------------
     */
    return NextResponse.json({
      success: true,

      report: {
        generated_at: new Date().toISOString(),

        case: {
          id: blacklistCase.id,
          case_number: blacklistCase.case_number,
          project: blacklistCase.subject,
          contract_address: threatReport?.contract_address ?? null,
          category: blacklistCase.category,
          status,
          publication_status:
            blacklistCase.publication_status ?? null,
          created_at: blacklistCase.created_at,
        },

        source_report: threatReport
          ? {
              id: threatReport.id,
              report_number: threatReport.report_number,
              created_at: threatReport.created_at,
              threat_type: threatReport.threat_type,
              project: threatReport.project,
              contract_address: threatReport.contract_address ?? null,
              evidence: threatReport.evidence,
              description: threatReport.description,
              status: threatReport.status,
            }
          : null,

        investigation: investigation
          ? {
              preliminary_findings:
                investigation.preliminary_findings ?? null,
              investigation_decision:
                investigation.investigation_decision ?? null,
              verification_checklist:
                verificationChecklist,
            }
          : null,

        risk_assessment: riskAssessment
          ? {
              overall_score:
                riskAssessment.overall_score ?? null,
              risk_band:
                riskAssessment.risk_band ?? null,
              categories: riskCategories,
              assessment_notes:
                riskAssessment.assessment_notes ?? null,
              assessed_at:
                riskAssessment.assessed_at ??
                riskAssessment.created_at ??
                null,
            }
          : null,

        publication_checklist: publicationChecklist,

        response: responseRecord
          ? {
              response_type:
                responseRecord.response_type ?? null,
              response_details:
                responseRecord.response_details ?? null,
              created_at:
                responseRecord.created_at ?? null,
              updated_at:
                responseRecord.updated_at ?? null,
            }
          : null,

        clearance: clearanceRecord
          ? {
              clearance_decision:
                clearanceRecord.clearance_decision ?? null,
              clearance_reason:
                clearanceRecord.clearance_reason ?? null,
              created_at:
                clearanceRecord.created_at ?? null,
              updated_at:
                clearanceRecord.updated_at ?? null,
            }
          : null,

        /*
         * Saved Update and Promoter Assessment data are included.
         * Internal investigator notes remain excluded from this report.
         */
        promoter_assessment: promoterAssessment
          ? {
              promotion_history: promoterAssessment.promotion_history ?? null,
              project_due_diligence: promoterAssessment.project_due_diligence ?? null,
              misleading_claims: promoterAssessment.misleading_claims ?? null,
              transparency_disclosure: promoterAssessment.transparency_disclosure ?? null,
              promotion_pattern: promoterAssessment.promotion_pattern ?? null,
              financial_incentives: promoterAssessment.financial_incentives ?? null,
              community_conduct: promoterAssessment.community_conduct ?? null,
              promoter_risk_score: promoterAssessment.promoter_risk_score ?? null,
              promoter_risk_band: promoterAssessment.promoter_risk_band ?? null,
              evidence_strength: promoterAssessment.evidence_strength ?? null,
              evidence_confidence_score: promoterAssessment.evidence_confidence_score ?? null,
              evidence_confidence_level: promoterAssessment.evidence_confidence_level ?? null,
              verification_checklist: promoterAssessment.verification_checklist ?? null,
              assessed_at: promoterAssessment.assessed_at ?? null,
              created_at: promoterAssessment.created_at ?? null,
              updated_at: promoterAssessment.updated_at ?? null,
            }
          : null,

        update: updateRecord
          ? {
              update_type: updateRecord.update_type ?? null,
              update_details: updateRecord.update_details ?? null,
              created_at: updateRecord.created_at ?? null,
              updated_at: updateRecord.updated_at ?? null,
            }
          : null,
      },
    });
  } catch (error) {
    console.error(
      "Blacklist report API error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error: "Unable to generate Blacklist report.",
      },
      { status: 500 }
    );
  }
}