
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { isAdmin } from "@/lib/admin-auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      threatType,
      project,
      evidence,
      description,
      contact,
      contractAddress,
    } = body ?? {};

    if (
      typeof threatType !== "string" ||
      typeof project !== "string" ||
      typeof description !== "string" ||
      !threatType.trim() ||
      !project.trim() ||
      !description.trim()
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Please complete all required fields.",
        },
        { status: 400 }
      );
    }

    if (
      (evidence != null && typeof evidence !== "string") ||
      (contact != null && typeof contact !== "string") ||
      (contractAddress != null && typeof contractAddress !== "string")
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid report field format.",
        },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("threat_reports")
      .insert({
        threat_type: threatType.trim(),
        project: project.trim(),
        evidence: evidence?.trim() || null,
        description: description.trim(),
        contact: contact?.trim() || null,
        contract_address: contractAddress?.trim() || null,
      })
      .select("id, report_number")
      .single();

    if (error || !data) {
      console.error("Supabase threat report error:", error);

      return NextResponse.json(
        {
          success: false,
          error: "Unable to save the report. Please try again.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Threat report submitted successfully.",
        report: {
          id: data.id,
          report_number: data.report_number,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Threat report API error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Invalid request. Please try again.",
      },
      { status: 400 }
    );
  }
}

// GET — Retrieve saved threat reports
export async function GET() {
  try {
    // Only the designated admin email may retrieve reports.
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

    // The admin client bypasses RLS.
    // This is safe because the admin check happens first.
    const { data, error } = await supabaseAdmin
      .from("threat_reports")
      .select(
    "id, created_at, report_number, threat_type, project, contract_address, evidence, description, contact, status"
    )
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Supabase threat reports fetch error:", error);

      return NextResponse.json(
        {
          success: false,
          error: "Unable to retrieve threat reports.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        reports: data,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Threat reports GET error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Unable to retrieve threat reports.",
      },
      { status: 500 }
    );
  }
}