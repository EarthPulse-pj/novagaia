import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { isAdmin } from "@/lib/admin-auth";

const ALLOWED_STATUSES = [
  "NEW",
  "UNDER REVIEW",
  "INVESTIGATING",
  "VERIFIED",
  "DISMISSED",
] as const;

type ReportStatus = (typeof ALLOWED_STATUSES)[number];

export async function PATCH(request: Request) {
  try {
    // Only the designated admin may change report status.
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

    const { reportId, status } = body as {
      reportId?: string;
      status?: string;
    };

    if (!reportId || !status) {
      return NextResponse.json(
        {
          success: false,
          error: "Report ID and status are required.",
        },
        { status: 400 }
      );
    }

    if (!ALLOWED_STATUSES.includes(status as ReportStatus)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid report status.",
        },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("threat_reports")
      .update({
        status,
      })
      .eq("id", reportId)
      .select(
        "id, created_at, report_number, threat_type, project, evidence, description, contact, status"
      )
      .single();

    if (error) {
      console.error("Supabase threat report status update error:", error);

      return NextResponse.json(
        {
          success: false,
          error: "Unable to update report status.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        report: data,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Threat report status API error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Invalid request. Please try again.",
      },
      { status: 400 }
    );
  }
}