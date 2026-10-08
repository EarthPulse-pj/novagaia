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

    const { data: responseRecord, error: responseError } =
      await supabaseAdmin
        .from("blacklist_responses")
        .select("*")
        .eq("case_id", caseId)
        .maybeSingle();

    if (responseError) {
      console.error(
        "Blacklist response retrieval error:",
        responseError
      );

      return NextResponse.json(
        {
          success: false,
          error: "Unable to retrieve Response record.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      response: responseRecord ?? null,
    });
  } catch (error) {
    console.error(
      "Blacklist response GET error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error: "Unable to retrieve Response record.",
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
      response_type,
      response_details,
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
      typeof response_type !== "string" ||
      !response_type.trim()
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "response_type is required.",
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
        "Blacklist response case lookup error:",
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

    const responseData = {
      case_id,
      response_type: response_type.trim(),
      response_details:
        typeof response_details === "string"
          ? response_details.trim()
          : null,
      investigator_notes:
        typeof investigator_notes === "string"
          ? investigator_notes.trim()
          : null,
      updated_at: new Date().toISOString(),
    };

    const {
      data: responseRecord,
      error: responseError,
    } = await supabaseAdmin
      .from("blacklist_responses")
      .upsert(responseData, {
        onConflict: "case_id",
      })
      .select()
      .single();

    if (responseError) {
      console.error(
        "Blacklist response save error:",
        responseError
      );

      return NextResponse.json(
        {
          success: false,
          error: "Unable to save Response record.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Response record saved successfully.",
      response: responseRecord,
    });
  } catch (error) {
    console.error(
      "Blacklist response POST error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error: "Unable to save Response record.",
      },
      { status: 500 }
    );
  }
}