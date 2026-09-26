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

    const { data: triage, error: triageError } =
      await supabaseAdmin
        .from("blacklist_triage")
        .select("*")
        .eq("case_id", caseId)
        .maybeSingle();

    if (triageError) {
      console.error(
        "Blacklist triage retrieval error:",
        triageError
      );

      return NextResponse.json(
        {
          success: false,
          error: "Unable to retrieve Triage assessment.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      triage: triage ?? null,
    });
  } catch (error) {
    console.error(
      "Blacklist triage GET error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error: "Unable to retrieve Triage assessment.",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
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

    const body = await request.json();

    const {
      case_id,
      subject_identified,
      within_scope,
      sufficient_information,
      duplicate_check_completed,
      immediate_user_risk_identified,
      contract_token_evidence,
      website_social_links,
      screenshots_documents,
      on_chain_references,
      evidence_quality,
      triage_decision,
      triage_notes,
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

    const { data: existingCase, error: caseError } =
      await supabaseAdmin
        .from("blacklist_cases")
        .select("id")
        .eq("id", case_id)
        .maybeSingle();

    if (caseError) {
      console.error(
        "Blacklist triage case lookup error:",
        caseError
      );

      return NextResponse.json(
        {
          success: false,
          error: "Unable to verify the Blacklist case.",
        },
        { status: 500 }
      );
    }

    if (!existingCase) {
      return NextResponse.json(
        {
          success: false,
          error: "Blacklist case not found.",
        },
        { status: 404 }
      );
    }

    const triageData = {
      case_id,
      subject_identified: Boolean(subject_identified),
      within_scope: Boolean(within_scope),
      sufficient_information: Boolean(sufficient_information),
      duplicate_check_completed: Boolean(
        duplicate_check_completed
      ),
      immediate_user_risk_identified: Boolean(
        immediate_user_risk_identified
      ),
      contract_token_evidence: Boolean(
        contract_token_evidence
      ),
      website_social_links: Boolean(
        website_social_links
      ),
      screenshots_documents: Boolean(
        screenshots_documents
      ),
      on_chain_references: Boolean(
        on_chain_references
      ),
      evidence_quality:
        typeof evidence_quality === "string"
          ? evidence_quality
          : null,
      triage_decision:
        typeof triage_decision === "string"
          ? triage_decision
          : null,
      triage_notes:
        typeof triage_notes === "string"
          ? triage_notes.trim()
          : null,
      assessed_by: null,
      assessed_at: new Date().toISOString(),
    };

    const { data: triage, error: triageError } =
      await supabaseAdmin
        .from("blacklist_triage")
        .upsert(triageData, {
          onConflict: "case_id",
        })
        .select()
        .single();

    if (triageError) {
      console.error(
        "Blacklist triage save error:",
        triageError
      );

      return NextResponse.json(
        {
          success: false,
          error: "Unable to save Triage assessment.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Triage assessment saved successfully.",
      triage,
    });
  } catch (error) {
    console.error(
      "Blacklist triage POST error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error: "Unable to save Triage assessment.",
      },
      { status: 500 }
    );
  }
}