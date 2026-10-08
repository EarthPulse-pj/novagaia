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

    const {
      data: clearanceRecord,
      error: clearanceError,
    } = await supabaseAdmin
      .from("blacklist_clearances")
      .select("*")
      .eq("case_id", caseId)
      .maybeSingle();

    if (clearanceError) {
      console.error(
        "Blacklist clearance retrieval error:",
        clearanceError
      );

      return NextResponse.json(
        {
          success: false,
          error: "Unable to retrieve Clearance record.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      clearance: clearanceRecord ?? null,
    });
  } catch (error) {
    console.error(
      "Blacklist clearance GET error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error: "Unable to retrieve Clearance record.",
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
      clearance_decision,
      clearance_reason,
      investigator_notes,
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

    if (
      typeof clearance_decision !== "string" ||
      !clearance_decision.trim()
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "clearance_decision is required.",
        },
        { status: 400 }
      );
    }

    const {
      data: existingCase,
      error: caseError,
    } = await supabaseAdmin
      .from("blacklist_cases")
      .select("id")
      .eq("id", case_id)
      .maybeSingle();

    if (caseError) {
      console.error(
        "Blacklist clearance case lookup error:",
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

    const clearanceData = {
      case_id,
      clearance_decision: clearance_decision.trim(),
      clearance_reason:
        typeof clearance_reason === "string"
          ? clearance_reason.trim()
          : null,
      investigator_notes:
        typeof investigator_notes === "string"
          ? investigator_notes.trim()
          : null,
      updated_at: new Date().toISOString(),
    };

    const {
      data: clearanceRecord,
      error: clearanceError,
    } = await supabaseAdmin
      .from("blacklist_clearances")
      .upsert(clearanceData, {
        onConflict: "case_id",
      })
      .select()
      .single();

    if (clearanceError) {
      console.error(
        "Blacklist clearance save error:",
        clearanceError
      );

      return NextResponse.json(
        {
          success: false,
          error: "Unable to save Clearance record.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Clearance record saved successfully.",
      clearance: clearanceRecord,
    });
  } catch (error) {
    console.error(
      "Blacklist clearance POST error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error: "Unable to save Clearance record.",
      },
      { status: 500 }
    );
  }
}