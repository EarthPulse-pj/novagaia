import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

const BUCKET = "threat-report-evidence";
const MAX_FILE_SIZE = 10 * 1024 * 1024;

const ALLOWED_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "application/pdf": "pdf",
  "text/plain": "txt",
  "text/csv": "csv",
  "application/msword": "doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
    "docx",
  "application/vnd.ms-excel": "xls",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":
    "xlsx",
  "application/vnd.ms-powerpoint": "ppt",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation":
    "pptx",
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { reportId, path, fileName, mimeType, fileSize } = body ?? {};

    if (
      typeof reportId !== "string" ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        reportId
      ) ||
      typeof path !== "string" ||
      !path.startsWith(`${reportId}/`) ||
      !/^[0-9a-f-]{36}\.(jpg|png|webp|gif|pdf|txt|csv|doc|docx|xls|xlsx|ppt|pptx)$/i.test(
        path.slice(reportId.length + 1)
      ) ||
      typeof fileName !== "string" ||
      !fileName.trim() ||
      fileName.length > 255 ||
      typeof mimeType !== "string" ||
      !ALLOWED_TYPES[mimeType] ||
      !path.endsWith(`.${ALLOWED_TYPES[mimeType]}`) ||
      typeof fileSize !== "number" ||
      !Number.isSafeInteger(fileSize) ||
      fileSize <= 0 ||
      fileSize > MAX_FILE_SIZE
    ) {
      return NextResponse.json(
        { success: false, error: "Invalid attachment details." },
        { status: 400 }
      );
    }

    const { data: report, error: reportError } = await supabaseAdmin
      .from("threat_reports")
      .select("id")
      .eq("id", reportId)
      .maybeSingle();

    if (reportError) {
      console.error("Attachment report lookup error:", reportError);
      return NextResponse.json(
        { success: false, error: "Unable to verify the report." },
        { status: 500 }
      );
    }

    if (!report) {
      return NextResponse.json(
        { success: false, error: "Threat report not found." },
        { status: 404 }
      );
    }

    const { count, error: countError } = await supabaseAdmin
      .from("threat_report_attachments")
      .select("id", { count: "exact", head: true })
      .eq("report_id", reportId);

    if (countError) {
      console.error("Attachment count error:", countError);
      return NextResponse.json(
        { success: false, error: "Unable to check report attachments." },
        { status: 500 }
      );
    }

    if ((count ?? 0) >= 5) {
      return NextResponse.json(
        { success: false, error: "This report already has five attachments." },
        { status: 400 }
      );
    }

    const { data: existing, error: storageError } = await supabaseAdmin.storage
      .from(BUCKET)
      .list(reportId, {
        search: path.slice(reportId.length + 1),
        limit: 100,
      });

    if (storageError) {
      console.error("Attachment storage lookup error:", storageError);
      return NextResponse.json(
        { success: false, error: "Unable to verify the uploaded file." },
        { status: 500 }
      );
    }

    const objectName = path.slice(reportId.length + 1);
    const uploadedObject = existing?.find((item) => item.name === objectName);

    if (!uploadedObject) {
      return NextResponse.json(
        { success: false, error: "The uploaded file was not found." },
        { status: 400 }
      );
    }

    const safeFileName = fileName
      .replace(/[\\/]/g, "_")
      .replace(/[\u0000-\u001f\u007f]/g, "")
      .trim();

    if (!safeFileName) {
      return NextResponse.json(
        { success: false, error: "Invalid file name." },
        { status: 400 }
      );
    }

    const { data: attachment, error: insertError } = await supabaseAdmin
      .from("threat_report_attachments")
      .insert({
        report_id: reportId,
        storage_path: path,
        file_name: safeFileName,
        mime_type: mimeType,
        file_size: fileSize,
      })
      .select("id, file_name, mime_type, file_size, created_at")
      .single();

    if (insertError || !attachment) {
      console.error("Attachment metadata insert error:", insertError);
      return NextResponse.json(
        { success: false, error: "Unable to save attachment details." },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true, attachment },
      { status: 201 }
    );
  } catch (error) {
    console.error("Attachment registration error:", error);
    return NextResponse.json(
      { success: false, error: "Invalid request. Please try again." },
      { status: 400 }
    );
  }
}
