import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { supabaseAdmin } from "@/lib/supabase-admin";

const BUCKET = "threat-report-evidence";
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const MAX_ATTACHMENTS = 5;

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
    const { reportId, fileName, mimeType, fileSize } = body ?? {};

    if (
      typeof reportId !== "string" ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        reportId
      ) ||
      typeof fileName !== "string" ||
      !fileName.trim() ||
      fileName.length > 255 ||
      typeof mimeType !== "string" ||
      typeof fileSize !== "number" ||
      !Number.isSafeInteger(fileSize) ||
      fileSize <= 0 ||
      fileSize > MAX_FILE_SIZE
    ) {
      return NextResponse.json(
        { success: false, error: "Invalid attachment details or file size." },
        { status: 400 }
      );
    }

    const extension = ALLOWED_TYPES[mimeType];

    if (!extension) {
      return NextResponse.json(
        {
          success: false,
          error: "This file type is not supported. Upload an image or document.",
        },
        { status: 400 }
      );
    }

    const { data: report, error: reportError } = await supabaseAdmin
      .from("threat_reports")
      .select("id")
      .eq("id", reportId)
      .maybeSingle();

    if (reportError) {
      console.error("Report lookup error:", reportError);
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

    if ((count ?? 0) >= MAX_ATTACHMENTS) {
      return NextResponse.json(
        { success: false, error: "This report already has the maximum of five attachments." },
        { status: 400 }
      );
    }

    const safeName = fileName
      .replace(/\\/g, "/")
      .split("/")
      .pop()!
      .replace(/[\u0000-\u001f\u007f]/g, "")
      .trim();

    if (!safeName) {
      return NextResponse.json(
        { success: false, error: "Invalid file name." },
        { status: 400 }
      );
    }

    const storagePath = `${reportId}/${randomUUID()}.${extension}`;

    const { data: signedUpload, error: uploadError } =
      await supabaseAdmin.storage
        .from(BUCKET)
        .createSignedUploadUrl(storagePath);

    if (uploadError || !signedUpload?.token) {
      console.error("Signed upload URL error:", uploadError);
      return NextResponse.json(
        {
          success: false,
          error: "Unable to prepare the file upload. Please try again.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      path: storagePath,
      token: signedUpload.token,
      fileName: safeName,
      mimeType,
      fileSize,
    });
  } catch (error) {
    console.error("Attachment upload URL error:", error);

    return NextResponse.json(
      { success: false, error: "Invalid request. Please try again." },
      { status: 400 }
    );
  }
}
