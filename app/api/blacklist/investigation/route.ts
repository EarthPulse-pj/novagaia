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

    const { data: investigation, error: investigationError } =
      await supabaseAdmin
        .from("blacklist_investigations")
        .select("*")
        .eq("case_id", caseId)
        .maybeSingle();

    if (investigationError) {
      console.error(
        "Blacklist investigation retrieval error:",
        investigationError
      );

      return NextResponse.json(
        {
          success: false,
          error: "Unable to retrieve Investigation assessment.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      investigation: investigation ?? null,
    });
  } catch (error) {
    console.error(
      "Blacklist investigation GET error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error: "Unable to retrieve Investigation assessment.",
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
      subject_identity_confirmed,
      subject_background_reviewed,
      project_history_reviewed,
      team_activity_reviewed,
      contract_reviewed,
      tokenomics_reviewed,
      liquidity_reviewed,
      on_chain_activity_reviewed,
      preliminary_findings,
      investigator_notes,
      investigation_decision,
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
        "Blacklist investigation case lookup error:",
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

    const investigationData = {
      case_id,
      subject_identity_confirmed: Boolean(
        subject_identity_confirmed
      ),
      subject_background_reviewed: Boolean(
        subject_background_reviewed
      ),
      project_history_reviewed: Boolean(
        project_history_reviewed
      ),
      team_activity_reviewed: Boolean(
        team_activity_reviewed
      ),
      contract_reviewed: Boolean(contract_reviewed),
      tokenomics_reviewed: Boolean(tokenomics_reviewed),
      liquidity_reviewed: Boolean(liquidity_reviewed),
      on_chain_activity_reviewed: Boolean(
        on_chain_activity_reviewed
      ),
      preliminary_findings:
        typeof preliminary_findings === "string"
          ? preliminary_findings.trim()
          : null,
      investigator_notes:
        typeof investigator_notes === "string"
          ? investigator_notes.trim()
          : null,
      investigation_decision:
        typeof investigation_decision === "string"
          ? investigation_decision
          : null,
      assessed_by: null,
      assessed_at: new Date().toISOString(),
    };

    const {
      data: investigation,
      error: investigationError,
    } = await supabaseAdmin
      .from("blacklist_investigations")
      .upsert(investigationData, {
        onConflict: "case_id",
      })
      .select()
      .single();

    if (investigationError) {
      console.error(
        "Blacklist investigation save error:",
        investigationError
      );

      return NextResponse.json(
        {
          success: false,
          error: "Unable to save Investigation assessment.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message:
        "Investigation assessment saved successfully.",
      investigation,
    });
  } catch (error) {
    console.error(
      "Blacklist investigation POST error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error: "Unable to save Investigation assessment.",
      },
      { status: 500 }
    );
  }
}