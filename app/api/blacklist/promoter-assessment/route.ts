import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServerClient();

    const body = await request.json();

    const {
      case_id,

      // Promoter Risk — 85 points
      promotion_history,
      project_due_diligence,
      misleading_claims,
      transparency_disclosure,
      promotion_pattern,
      financial_incentives,
      community_conduct,

      promoter_risk_score,
      promoter_risk_band,

      // Evidence Confidence — 15 points
      evidence_strength,
      evidence_confidence_score,
      evidence_confidence_level,

      assessment_notes,
      verification_checklist,
    } = body;

    if (!case_id) {
      return NextResponse.json(
        {
          success: false,
          error: "case_id is required.",
        },
        { status: 400 }
      );
    }

    const { data: userData, error: userError } =
      await supabase.auth.getUser();

    if (userError || !userData.user) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized.",
        },
        { status: 401 }
      );
    }

const assessmentPayload = {
  case_id,

  promotion_history,
  project_due_diligence,
  misleading_claims,
  transparency_disclosure,
  promotion_pattern,
  financial_incentives,
  community_conduct,

  promoter_risk_score,
  promoter_risk_band: promoter_risk_band?.toLowerCase(),

  evidence_strength,
  evidence_confidence_score,
  evidence_confidence_level:
    Number(evidence_confidence_score ?? evidence_strength ?? 0) >= 13
      ? "very strong evidence"
      : Number(evidence_confidence_score ?? evidence_strength ?? 0) >= 10
        ? "strong evidence"
        : Number(evidence_confidence_score ?? evidence_strength ?? 0) >= 7
          ? "moderate evidence"
          : Number(evidence_confidence_score ?? evidence_strength ?? 0) >= 4
            ? "limited evidence"
            : "very limited evidence",

  assessment_notes,

  ...(verification_checklist !== undefined
    ? { verification_checklist }
    : {}),

  assessed_by: userData.user.id,
  assessed_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

const { data: existingAssessment, error: lookupError } =
  await supabaseAdmin
    .from("blacklist_promoter_assessments")
    .select("*")
    .eq("case_id", case_id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

if (lookupError) {
  console.error(
    "Promoter assessment lookup error:",
    lookupError
  );

  return NextResponse.json(
    {
      success: false,
      error: "Unable to check existing promoter assessment.",
      details: lookupError.message,
    },
    { status: 500 }
  );
}

const existingChecklistValue = existingAssessment?.verification_checklist;

const existingChecklist =
  existingChecklistValue &&
  typeof existingChecklistValue === "object" &&
  !Array.isArray(existingChecklistValue)
    ? (existingChecklistValue as Record<string, unknown>)
    : {};

const incomingChecklist =
  verification_checklist &&
  typeof verification_checklist === "object" &&
  !Array.isArray(verification_checklist)
    ? (verification_checklist as Record<string, unknown>)
    : {};

const existingIsV2 =
  existingChecklist.__promoter_risk_version === "v2";

const legacySnapshot = existingAssessment
  ? existingIsV2
    ? existingChecklist.__legacy_promoter_assessment_v1
    : {
        version: "v1",
        captured_at: new Date().toISOString(),
        scores: {
          promotion_history: existingAssessment.promotion_history,
          project_due_diligence: existingAssessment.project_due_diligence,
          misleading_claims: existingAssessment.misleading_claims,
          transparency_disclosure: existingAssessment.transparency_disclosure,
          promotion_pattern: existingAssessment.promotion_pattern,
          financial_incentives: existingAssessment.financial_incentives,
          community_conduct: existingAssessment.community_conduct,
          promoter_risk_score: existingAssessment.promoter_risk_score,
          promoter_risk_band: existingAssessment.promoter_risk_band,
          evidence_strength: existingAssessment.evidence_strength,
          evidence_confidence_score: existingAssessment.evidence_confidence_score,
          evidence_confidence_level: existingAssessment.evidence_confidence_level,
        },
        verification_checklist: existingChecklist,
        assessment_notes: existingAssessment.assessment_notes,
        assessed_at: existingAssessment.assessed_at,
      }
  : undefined;

const payloadToSave = {
  ...assessmentPayload,
  verification_checklist: {
    ...existingChecklist,
    ...incomingChecklist,
    ...(legacySnapshot !== undefined
      ? { __legacy_promoter_assessment_v1: legacySnapshot }
      : {}),
  },
};

const { data, error } = existingAssessment
  ? await supabaseAdmin
      .from("blacklist_promoter_assessments")
      .update(payloadToSave)
      .eq("id", existingAssessment.id)
      .select()
      .single()
  : await supabaseAdmin
      .from("blacklist_promoter_assessments")
      .insert(payloadToSave)
      .select()
      .single();

    if (error) {
      console.error(
        "Promoter assessment save error:",
        error
      );

      return NextResponse.json(
        {
          success: false,
          error: "Unable to save promoter assessment.",
          details: error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      assessment: data,
    });
  } catch (error) {
    console.error(
      "Promoter assessment API error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error: "Invalid request.",
      },
      { status: 400 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const supabase = await createSupabaseServerClient();

    const { data: userData, error: userError } =
      await supabase.auth.getUser();

    if (userError || !userData.user) {
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

    const { data, error } = await supabaseAdmin
      .from("blacklist_promoter_assessments")
      .select("*")
      .eq("case_id", caseId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error(
        "Promoter assessment load error:",
        error
      );

      return NextResponse.json(
        {
          success: false,
          error: "Unable to load promoter assessment.",
          details: error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      assessment: data,
    });
  } catch (error) {
    console.error(
      "Promoter assessment GET error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error: "Unable to load promoter assessment.",
      },
      { status: 500 }
    );
  }
}