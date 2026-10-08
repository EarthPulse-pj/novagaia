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
      data: updateRecord,
      error: updateError,
    } = await supabaseAdmin
      .from("blacklist_updates")
      .select("*")
      .eq("case_id", caseId)
      .maybeSingle();

    if (updateError) {
      console.error(
        "Blacklist update retrieval error:",
        updateError
      );

      return NextResponse.json(
        {
          success: false,
          error: "Unable to retrieve Update record.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      update: updateRecord ?? null,
    });
  } catch (error) {
    console.error(
      "Blacklist update GET error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error: "Unable to retrieve Update record.",
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
      update_type,
      update_details,
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
      typeof update_type !== "string" ||
      !update_type.trim()
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "update_type is required.",
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
        "Blacklist update case lookup error:",
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

    const updateData = {
      case_id,
      update_type: update_type.trim(),
      update_details:
        typeof update_details === "string"
          ? update_details.trim()
          : null,
      investigator_notes:
        typeof investigator_notes === "string"
          ? investigator_notes.trim()
          : null,
      updated_at: new Date().toISOString(),
    };

    const {
      data: updateRecord,
      error: updateError,
    } = await supabaseAdmin
      .from("blacklist_updates")
      .upsert(updateData, {
        onConflict: "case_id",
      })
      .select()
      .single();

    if (updateError) {
      console.error(
        "Blacklist update save error:",
        updateError
      );

      return NextResponse.json(
        {
          success: false,
          error: "Unable to save Update record.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Update record saved successfully.",
      update: updateRecord,
    });
  } catch (error) {
    console.error(
      "Blacklist update POST error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error: "Unable to save Update record.",
      },
      { status: 500 }
    );
  }
}
