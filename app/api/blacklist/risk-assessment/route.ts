import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServerClient();

    const body = await request.json();

    const {
      case_id,
      overall_score,
      risk_band,

      // Locked NovaGaia Risk Score V1.0 fields
      contract_token_controls,
      holder_distribution,
      liquidity_exit_risk,
      team_transparency,
      website_infrastructure,
      marketing_promotion,
      community_behavior,
      on_chain_behavior,

      assessment_notes,
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

    const { data, error } = await supabaseAdmin
      .from("blacklist_risk_assessments")
      .insert({
        case_id,
        overall_score,
        risk_band: risk_band?.toLowerCase(),

        // Locked V1.0 category fields
        contract_token_controls,
        holder_distribution,
        liquidity_exit_risk,
        team_transparency,
        website_infrastructure,
        marketing_promotion,
        community_behavior,
        on_chain_behavior,

        assessment_notes,

        // Existing authentication tracking
        assessed_by: userData.user.id,
        assessed_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error("Risk assessment save error:", error);

      return NextResponse.json(
        {
          success: false,
          error: "Unable to save risk assessment.",
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
    console.error("Risk assessment API error:", error);

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
      .from("blacklist_risk_assessments")
      .select("*")
      .eq("case_id", caseId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error("Risk assessment load error:", error);

      return NextResponse.json(
        {
          success: false,
          error: "Unable to load risk assessment.",
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
    console.error("Risk assessment GET error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Unable to load risk assessment.",
      },
      { status: 500 }
    );
  }
}