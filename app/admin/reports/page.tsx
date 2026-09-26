
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase-browser";

type ReportStatus =
  | "NEW"
  | "UNDER REVIEW"
  | "INVESTIGATING"
  | "VERIFIED"
  | "DISMISSED";

type ThreatReport = {
  id: string;
  created_at: string;
  report_number: number;
  threat_type: string;
  project: string;
  evidence: string | null;
  description: string;
  contact: string | null;
  status: ReportStatus;
};

const REPORT_STATUSES: ReportStatus[] = [
  "NEW",
  "UNDER REVIEW",
  "INVESTIGATING",
  "VERIFIED",
  "DISMISSED",
];

export default function AdminReportsPage() {
  const router = useRouter();

  const [reports, setReports] = useState<ThreatReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [signingOut, setSigningOut] = useState(false);
  const [updatingReportId, setUpdatingReportId] = useState<string | null>(
    null
  );

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | ReportStatus>(
    "ALL"
  );

  const [selectedReport, setSelectedReport] =
    useState<ThreatReport | null>(null);

  const filteredReports = reports.filter((report) => {
    const search = searchTerm.toLowerCase().trim();

    const matchesSearch =
      search === "" ||
      report.project.toLowerCase().includes(search) ||
      report.threat_type.toLowerCase().includes(search) ||
      report.report_number.toString().includes(search);

    const matchesStatus =
      statusFilter === "ALL" || report.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  useEffect(() => {
    async function fetchReports() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch("/api/reports", {
          method: "GET",
          cache: "no-store",
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(
            result.error || "Unable to retrieve threat reports."
          );
        }

        setReports(result.reports ?? []);
      } catch (error) {
        console.error("Admin reports fetch error:", error);

        setError(
          error instanceof Error
            ? error.message
            : "Unable to retrieve threat reports."
        );
      } finally {
        setLoading(false);
      }
    }

    fetchReports();
  }, []);

  async function handleStatusChange(
    reportId: string,
    newStatus: ReportStatus
  ) {
    try {
      setUpdatingReportId(reportId);
      setError("");

      const response = await fetch("/api/admin/reports/status", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          reportId,
          status: newStatus,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Unable to update report status.");
      }

      setReports((currentReports) =>
        currentReports.map((report) =>
          report.id === reportId
            ? {
                ...report,
                status: result.report.status,
              }
            : report
        )
      );

      setSelectedReport((currentReport) =>
        currentReport && currentReport.id === reportId
          ? {
              ...currentReport,
              status: result.report.status,
            }
          : currentReport
      );
    } catch (error) {
      console.error("Report status update error:", error);

      setError(
        error instanceof Error
          ? error.message
          : "Unable to update report status."
      );
    } finally {
      setUpdatingReportId(null);
    }
  }

  async function handleSignOut() {
    setSigningOut(true);
    setError("");

    const { error } = await supabaseBrowser.auth.signOut();

    if (error) {
      console.error("Sign out error:", error);

      setError("Unable to sign out. Please try again.");
      setSigningOut(false);
      return;
    }

    router.push("/login");
    router.refresh();
  }

  function openReportDetails(report: ThreatReport) {
    setSelectedReport(report);
  }

  function closeReportDetails() {
    setSelectedReport(null);
  }

  return (
    <main className="min-h-screen bg-black px-6 py-10 text-white">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold">
              NovaGaia Threat Reports
            </h1>

            <p className="mt-2 text-sm text-gray-400">
              Review submitted threat reports.
            </p>
          </div>

          <button
            type="button"
            onClick={handleSignOut}
            disabled={signingOut}
            className="rounded-lg border border-gray-700 bg-gray-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-gray-900 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {signingOut ? "Signing out..." : "Sign out"}
          </button>
        </div>

        {loading && (
          <div className="rounded-lg border border-gray-800 bg-gray-950 p-6 text-gray-300">
            Loading threat reports...
          </div>
        )}

        {!loading && error && (
          <div className="mb-6 rounded-lg border border-red-800 bg-red-950/30 p-6 text-red-300">
            <p className="font-semibold">Unable to process request</p>
            <p className="mt-2 text-sm">{error}</p>
          </div>
        )}

        {!loading && !error && reports.length === 0 && (
          <div className="rounded-lg border border-gray-800 bg-gray-950 p-6 text-gray-400">
            No threat reports have been submitted yet.
          </div>
        )}

        {!loading && !error && reports.length > 0 && (
          <div className="mb-6 flex flex-col gap-4 sm:flex-row">
            <input
              type="text"
              placeholder="Search by project, threat type, or report number..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="w-full rounded-lg border border-gray-700 bg-gray-950 px-4 py-3 text-sm text-white outline-none placeholder:text-gray-500 focus:border-gray-500"
            />

            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value as "ALL" | ReportStatus)
              }
              className="rounded-lg border border-gray-700 bg-gray-950 px-4 py-3 text-sm text-white outline-none focus:border-gray-500"
            >
              <option value="ALL">All statuses</option>

              {REPORT_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => {
                setSearchTerm("");
                setStatusFilter("ALL");
              }}
              className="rounded-lg border border-gray-700 bg-gray-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-gray-800"
            >
              Clear Filters
            </button>
          </div>
        )}

        {!loading && reports.length > 0 && (
          <div className="overflow-hidden rounded-lg border border-gray-800">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1400px] text-left text-sm">
                <thead className="bg-gray-900 text-gray-300">
                  <tr>
                    <th className="px-4 py-4 font-semibold">
                      Report #
                    </th>

                    <th className="px-4 py-4 font-semibold">
                      Date
                    </th>

                    <th className="px-4 py-4 font-semibold">
                      Threat Type
                    </th>

                    <th className="px-4 py-4 font-semibold">
                      Project
                    </th>

                    <th className="px-4 py-4 font-semibold">
                      Evidence
                    </th>

                    <th className="px-4 py-4 font-semibold">
                      Description
                    </th>

                    <th className="px-4 py-4 font-semibold">
                      Contact
                    </th>

                    <th className="px-4 py-4 font-semibold">
                      Status
                    </th>

                    <th className="px-4 py-4 font-semibold">
                      Details
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-800 bg-black">
                  {filteredReports.map((report) => (
                    <tr
                      key={report.id}
                      className="align-top hover:bg-gray-950"
                    >
                      <td className="whitespace-nowrap px-4 py-4 font-semibold text-white">
                        #{report.report_number}
                      </td>

                      <td className="whitespace-nowrap px-4 py-4 text-gray-300">
                        {new Date(
                          report.created_at
                        ).toLocaleString()}
                      </td>

                      <td className="px-4 py-4 text-gray-200">
                        {report.threat_type}
                      </td>

                      <td className="px-4 py-4 font-medium text-white">
                        {report.project}
                      </td>

                      <td className="max-w-xs px-4 py-4">
                        {report.evidence ? (
                          <a
                            href={report.evidence}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="break-all text-blue-400 underline hover:text-blue-300"
                          >
                            {report.evidence}
                          </a>
                        ) : (
                          <span className="text-gray-500">
                            None
                          </span>
                        )}
                      </td>

                      <td className="max-w-md whitespace-pre-wrap px-4 py-4 text-gray-300">
                        {report.description}
                      </td>

                      <td className="px-4 py-4 text-gray-300">
                        {report.contact || (
                          <span className="text-gray-500">
                            None
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-4">
                        <select
                          value={report.status}
                          onChange={(event) =>
                            handleStatusChange(
                              report.id,
                              event.target.value as ReportStatus
                            )
                          }
                          disabled={updatingReportId === report.id}
                          className="rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-xs font-semibold text-white outline-none transition focus:border-gray-500 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {REPORT_STATUSES.map((status) => (
                            <option key={status} value={status}>
                              {status}
                            </option>
                          ))}
                        </select>

                        {updatingReportId === report.id && (
                          <p className="mt-2 text-xs text-gray-500">
                            Updating...
                          </p>
                        )}
                      </td>

                      <td className="px-4 py-4">
                        <button
                          type="button"
                          onClick={() => openReportDetails(report)}
                          className="whitespace-nowrap rounded-lg border border-gray-700 bg-gray-900 px-4 py-2 text-xs font-semibold text-white transition hover:bg-gray-800"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}

                  {filteredReports.length === 0 && (
                    <tr>
                      <td
                        colSpan={9}
                        className="px-4 py-10 text-center text-gray-500"
                      >
                        No reports match the current search or filter.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="border-t border-gray-800 bg-gray-950 px-4 py-3 text-sm text-gray-400">
              {filteredReports.length}{" "}
              {filteredReports.length === 1 ? "report" : "reports"} found
            </div>
          </div>
        )}
      </div>

      {selectedReport && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4 py-8 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeReportDetails();
            }
          }}
        >
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-xl border border-gray-800 bg-gray-950 shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-800 px-6 py-5">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wider text-gray-500">
                  Threat Report
                </p>

                <h2 className="mt-1 text-2xl font-bold text-white">
                  Report #{selectedReport.report_number}
                </h2>
              </div>

              <button
                type="button"
                onClick={closeReportDetails}
                className="rounded-lg border border-gray-700 bg-gray-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-gray-800"
              >
                Close
              </button>
            </div>

            <div className="space-y-6 p-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-lg border border-gray-800 bg-black p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Report #
                  </p>

                  <p className="mt-2 text-white">
                    #{selectedReport.report_number}
                  </p>
                </div>

                <div className="rounded-lg border border-gray-800 bg-black p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Date Submitted
                  </p>

                  <p className="mt-2 text-gray-200">
                    {new Date(
                      selectedReport.created_at
                    ).toLocaleString()}
                  </p>
                </div>

                <div className="rounded-lg border border-gray-800 bg-black p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Threat Type
                  </p>

                  <p className="mt-2 text-white">
                    {selectedReport.threat_type}
                  </p>
                </div>

                <div className="rounded-lg border border-gray-800 bg-black p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Project
                  </p>

                  <p className="mt-2 font-medium text-white">
                    {selectedReport.project}
                  </p>
                </div>
              </div>

              <div className="rounded-lg border border-gray-800 bg-black p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Current Status
                </p>

                <div className="mt-3">
                  <select
                    value={selectedReport.status}
                    onChange={(event) =>
                      handleStatusChange(
                        selectedReport.id,
                        event.target.value as ReportStatus
                      )
                    }
                    disabled={
                      updatingReportId === selectedReport.id
                    }
                    className="w-full rounded-lg border border-gray-700 bg-gray-900 px-4 py-3 text-sm font-semibold text-white outline-none transition focus:border-gray-500 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                  >
                    {REPORT_STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>

                  {updatingReportId === selectedReport.id && (
                    <p className="mt-2 text-xs text-gray-500">
                      Updating...
                    </p>
                  )}
                </div>
              </div>

              <div className="rounded-lg border border-gray-800 bg-black p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Evidence
                </p>

                {selectedReport.evidence ? (
                  <a
                    href={selectedReport.evidence}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 block break-all text-sm leading-6 text-blue-400 underline hover:text-blue-300"
                  >
                    {selectedReport.evidence}
                  </a>
                ) : (
                  <p className="mt-3 text-sm text-gray-500">
                    No evidence provided.
                  </p>
                )}
              </div>

              <div className="rounded-lg border border-gray-800 bg-black p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Full Description
                </p>

                <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-gray-300">
                  {selectedReport.description}
                </p>
              </div>

              <div className="rounded-lg border border-gray-800 bg-black p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Contact
                </p>

                {selectedReport.contact ? (
                  <p className="mt-3 break-all text-sm text-gray-300">
                    {selectedReport.contact}
                  </p>
                ) : (
                  <p className="mt-3 text-sm text-gray-500">
                    No contact information provided.
                  </p>
                )}
              </div>

              <div className="flex justify-end border-t border-gray-800 pt-5">
                <button
                  type="button"
                  onClick={closeReportDetails}
                  className="rounded-lg border border-gray-700 bg-gray-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-gray-800"
                >
                  Close Details
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}