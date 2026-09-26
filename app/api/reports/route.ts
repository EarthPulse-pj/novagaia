
import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
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
    } = body;

    // Validate required fields
    if (!threatType || !project || !description) {
      return NextResponse.json(
        {
          success: false,
          error: "Please complete all required fields.",
        },
        { status: 400 }
      );
    }

    // Save the report to Supabase
    // The database automatically generates report_number.
    const { error } = await supabase
      .from("threat_reports")
      .insert({
        threat_type: threatType,
        project: project.trim(),
        evidence: evidence?.trim() || null,
        description: description.trim(),
        contact: contact?.trim() || null,
      });

    if (error) {
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
    "id, created_at, report_number, threat_type, project, evidence, description, contact, status"
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