
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { isAdmin } from "@/lib/admin-auth";

export async function GET() {
  try {
    // Only the designated admin can retrieve Blacklist cases.
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

    const { data: cases, error: casesError } =
      await supabaseAdmin
        .from("blacklist_cases")
        .select(
          "id, case_number, report_id, subject, category, status, publication_status, publication_checklist, created_at"
        )
        .order("case_number", { ascending: true });

    if (casesError) {
      console.error(
        "Blacklist cases retrieval error:",
        casesError
      );

      return NextResponse.json(
        {
          success: false,
          error: "Unable to retrieve Blacklist cases.",
        },
        { status: 500 }
      );
    }

    const caseList = cases ?? [];

    // Get the linked threat reports so the Blacklist
    // case can display the original report description.
    const reportIds = caseList
      .map((item) => item.report_id)
      .filter(
        (id): id is string =>
          typeof id === "string" && id.length > 0
      );

    let reportsById: Record<
      string,
      {
        description: string;
        evidence: string | null;
        contact: string | null;
      }
    > = {};

    if (reportIds.length > 0) {
      const {
        data: reports,
        error: reportsError,
      } = await supabaseAdmin
        .from("threat_reports")
        .select(
          "id, description, evidence, contact"
        )
        .in("id", reportIds);

      if (reportsError) {
        console.error(
          "Linked threat reports retrieval error:",
          reportsError
        );

        return NextResponse.json(
          {
            success: false,
            error:
              "Unable to retrieve linked threat reports.",
          },
          { status: 500 }
        );
      }

      reportsById = Object.fromEntries(
        (reports ?? []).map((report) => [
          report.id,
          {
            description: report.description,
            evidence: report.evidence,
            contact: report.contact,
          },
        ])
      );
    }

    const casesWithReports = caseList.map((item) => {
      const report = item.report_id
        ? reportsById[item.report_id]
        : undefined;

      return {
        ...item,
        description: report?.description ?? "",
        evidence: report?.evidence ?? null,
        contact: report?.contact ?? null,
      };
    });

    return NextResponse.json({
      success: true,
      cases: casesWithReports,
    });
  } catch (error) {
    console.error(
      "Blacklist cases API error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error: "Unable to retrieve Blacklist cases.",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    // Only the designated admin can create Blacklist cases.
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
      reportId,
      subject,
      category,
    } = body;

    // Validate required fields.
    if (!reportId || !subject || !category) {
      return NextResponse.json(
        {
          success: false,
          error: "Report ID, subject, and category are required.",
        },
        { status: 400 }
      );
    }

    // Verify that the source threat report exists.
    const { data: report, error: reportError } = await supabaseAdmin
      .from("threat_reports")
      .select("id, report_number")
      .eq("id", reportId)
      .maybeSingle();

    if (reportError) {
      console.error(
        "Blacklist source report lookup error:",
        reportError
      );

      return NextResponse.json(
        {
          success: false,
          error: "Unable to verify the source threat report.",
        },
        { status: 500 }
      );
    }

    if (!report) {
      return NextResponse.json(
        {
          success: false,
          error: "Threat report not found.",
        },
        { status: 404 }
      );
    }

   // Generate the next Blacklist case number.
const { data: latestCase, error: latestCaseError } =
  await supabaseAdmin
    .from("blacklist_cases")
    .select("case_number")
    .order("case_number", { ascending: false })
    .limit(1)
    .maybeSingle();

if (latestCaseError) {
  console.error(
    "Blacklist case number lookup error:",
    latestCaseError
  );

  return NextResponse.json(
    {
      success: false,
      error: "Unable to generate a Blacklist case number.",
    },
    { status: 500 }
  );
}

const nextCaseNumber =
  (latestCase?.case_number ?? 0) + 1;

// Create the private Blacklist case.
const { data: caseRecord, error: caseError } =
  await supabaseAdmin
    .from("blacklist_cases")
    .insert({
      case_number: nextCaseNumber,
      report_id: report.id,
      subject: subject.trim(),
      category: category.trim(),
      status: "triage",
      publication_status: "private",
    })
    .select(
      "id, case_number, report_id, subject, category, status, publication_status, publication_checklist, created_at"
    )
    .single();

  if (caseError) {
  console.error(
    "Blacklist case creation error:",
    caseError
  );

  return NextResponse.json(
    {
      success: false,
      error: "Unable to create the Blacklist case.",
    },
    { status: 500 }
  );
}

    return NextResponse.json(
      {
        success: true,
        message: "Blacklist case created successfully.",
        case: caseRecord,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(
      "Blacklist case API error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error: "Invalid request. Please try again.",
      },
      { status: 400 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    // Only the designated admin can update Blacklist cases.
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

    const caseId = body.case_id;
    const status = body.status;
    const publicationChecklist = body.publication_checklist;
    if (!caseId || !status) {
      return NextResponse.json(
        {
          success: false,
          error: "case_id and status are required.",
        },
        { status: 400 }
      );
    }

    const allowedStatuses = [
      "triage",
      "investigating",
      "risk_assessment",
      "review",
      "published",
      "response",
      "update",
      "cleared",
    ];

    if (!allowedStatuses.includes(status)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid case status.",
        },
        { status: 400 }
      );
    }

    const { data: updatedCase, error: updateError } =
      await supabaseAdmin
        .from("blacklist_cases")
        .update({
          status,
          ...(publicationChecklist !== undefined
            ? { publication_checklist: publicationChecklist }
            : {}),
        })
        .eq("id", caseId)
        .select()
        .single();

    if (updateError) {
      console.error(
        "Blacklist case update error:",
        updateError
      );

      return NextResponse.json(
        {
          success: false,
          error: "Unable to update Blacklist case.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      case: updatedCase,
    });
  } catch (error) {
    console.error(
      "Blacklist case PATCH error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error: "Unable to update Blacklist case.",
      },
      { status: 500 }
    );
  }
}