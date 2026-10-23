import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { isAdmin } from "@/lib/admin-auth";

const BUCKET = "threat-report-evidence";
const SIGNED_URL_SECONDS = 300;

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(
  _request: Request,
  context: RouteContext
) {
  try {
    const admin = await isAdmin();

    if (!admin) {
      return NextResponse.json(
        { success: false, error: "Unauthorized." },
        { status: 401 }
      );
    }

    const { id } = await context.params;

    if (
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)
    ) {
      return NextResponse.json(
        { success: false, error: "Invalid report ID." },
        { status: 400 }
      );
    }

    const { data: attachments, error } = await supabaseAdmin
      .from("threat_report_attachments")
      .select("id, report_id, storage_path, file_name, mime_type, file_size, created_at")
      .eq("report_id", id)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Report attachments lookup error:", error);

      return NextResponse.json(
        { success: false, error: "Unable to retrieve report attachments." },
        { status: 500 }
      );
    }

    const results = await Promise.all(
      (attachments ?? []).map(async (attachment) => {
        // Only sign objects belonging to this report.
        if (!attachment.storage_path.startsWith(`${id}/`)) {
          return null;
        }

        const { data, error: signingError } = await supabaseAdmin.storage
          .from(BUCKET)
          .createSignedUrl(
            attachment.storage_path,
            SIGNED_URL_SECONDS,
            { download: attachment.file_name }
          );

        if (signingError || !data?.signedUrl) {
          console.error(
            "Attachment signing error:",
            signingError
          );
          return null;
        }

        return {
          id: attachment.id,
          file_name: attachment.file_name,
          mime_type: attachment.mime_type,
          file_size: attachment.file_size,
          created_at: attachment.created_at,
          url: data.signedUrl,
        };
      })
    );

    return NextResponse.json({
      success: true,
      attachments: results.filter((item) => item !== null),
    });
  } catch (error) {
    console.error("Report attachments API error:", error);

    return NextResponse.json(
      { success: false, error: "Unable to retrieve report attachments." },
      { status: 500 }
    );
  }
}
