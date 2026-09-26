
"use client";

import { motion } from "framer-motion";
import { useState } from "react";

const threatTypes = [
  "Scam / Fraud",
  "Phishing",
  "Suspicious Token",
  "Fake Project",
  "Impersonation",
  "Hacked / Compromised",
  "Other",
];

export default function ReportThreat() {
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [reportNumber, setReportNumber] = useState<number | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");

    const form = event.currentTarget;
    const formData = new FormData(form);

    const report = {
      threatType: formData.get("threatType"),
      project: formData.get("project"),
      evidence: formData.get("evidence"),
      description: formData.get("description"),
      contact: formData.get("contact"),
    };

    try {
      const response = await fetch("/api/reports", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(report),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Unable to submit the threat report."
        );
      }

      // Save the generated report number returned by the API
      setReportNumber(data.report?.report_number ?? null);

      setSubmitted(true);
      form.reset();
    } catch (error) {
      console.error("Report submission error:", error);

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to submit the threat report. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleAnotherReport() {
    setSubmitted(false);
    setErrorMessage("");
    setReportNumber(null);
  }

  return (
    <section
      id="report"
      className="relative overflow-hidden border-y border-red-900/40 px-6 py-24"
    >
      {/* Background glow */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(239,68,68,0.10),transparent_35%),radial-gradient(circle_at_20%_80%,rgba(34,211,238,0.06),transparent_28%)]" />

      <div className="relative mx-auto max-w-6xl">
        {/* Section heading */}
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-bold uppercase tracking-[0.35em] text-red-400">
            NovaGaia Threat Intelligence
          </p>

          <h2 className="mt-4 text-4xl font-black tracking-tight text-white sm:text-5xl lg:text-6xl">
            See something suspicious?
          </h2>

          <p className="mt-6 text-lg leading-8 text-gray-300">
            Help protect the community by reporting suspicious projects,
            scams, phishing attempts, impersonation, compromised accounts,
            and other potential crypto threats.
          </p>
        </div>

        {/* Main content */}
        <div className="mt-14 grid gap-8 lg:grid-cols-[0.85fr_1.15fr]">
          {/* Information panel */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.5 }}
            className="rounded-3xl border border-red-900/50 bg-black/40 p-8 backdrop-blur-sm lg:p-10"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-red-400/30 bg-red-400/10 text-3xl">
              🚨
            </div>

            <h3 className="mt-6 text-3xl font-black text-white">
              Protect the community.
            </h3>

            <p className="mt-5 leading-7 text-gray-300">
              A useful report starts with evidence. Share what you observed,
              where you found it, and any information that can help the
              community investigate the situation.
            </p>

            <div className="mt-8 space-y-4">
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                <p className="font-bold text-cyan-300">01 — Observe</p>

                <p className="mt-2 text-sm leading-6 text-gray-400">
                  Identify the suspicious activity or claim before reporting
                  it.
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                <p className="font-bold text-cyan-300">02 — Document</p>

                <p className="mt-2 text-sm leading-6 text-gray-400">
                  Collect relevant links, wallet addresses, screenshots,
                  transaction information, or other available evidence.
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                <p className="font-bold text-cyan-300">03 — Report</p>

                <p className="mt-2 text-sm leading-6 text-gray-400">
                  Submit the information so it can be reviewed and
                  investigated.
                </p>
              </div>
            </div>

            <div className="mt-8 rounded-2xl border border-yellow-500/20 bg-yellow-500/[0.04] p-5">
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-yellow-300">
                Important
              </p>

              <p className="mt-2 text-sm leading-6 text-gray-400">
                A report is not automatically proof that a project or person
                is malicious. Reports should be reviewed carefully and
                supported by evidence.
              </p>
            </div>
          </motion.div>

          {/* Report form / success state */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.5, delay: 0.08 }}
            className="rounded-3xl border border-emerald-800/60 bg-black/40 p-8 backdrop-blur-sm lg:p-10"
          >
            {!submitted ? (
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Visible error message */}
                {errorMessage && (
                  <div
                    role="alert"
                    className="rounded-2xl border border-red-500/30 bg-red-500/10 p-5"
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-xl" aria-hidden="true">
                        ⚠️
                      </span>

                      <div>
                        <p className="font-bold text-red-300">
                          Submission failed
                        </p>

                        <p className="mt-1 text-sm leading-6 text-red-200/80">
                          {errorMessage}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <label
                    htmlFor="threat-type"
                    className="mb-2 block text-sm font-bold text-gray-200"
                  >
                    Threat Type
                  </label>

                  <select
                    id="threat-type"
                    name="threatType"
                    required
                    disabled={isSubmitting}
                    defaultValue=""
                    className="w-full rounded-xl border border-white/10 bg-black/60 px-4 py-3 text-gray-200 outline-none transition focus:border-emerald-400/60 focus:ring-2 focus:ring-emerald-400/10 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="">Select a category</option>

                    {threatTypes.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="project"
                    className="mb-2 block text-sm font-bold text-gray-200"
                  >
                    Project / Token / Account
                  </label>

                  <input
                    id="project"
                    name="project"
                    type="text"
                    placeholder="Enter the project, token, account, or website"
                    required
                    disabled={isSubmitting}
                    className="w-full rounded-xl border border-white/10 bg-black/60 px-4 py-3 text-gray-200 placeholder:text-gray-600 outline-none transition focus:border-emerald-400/60 focus:ring-2 focus:ring-emerald-400/10 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </div>

                <div>
                  <label
                    htmlFor="evidence"
                    className="mb-2 block text-sm font-bold text-gray-200"
                  >
                    Evidence / Link
                  </label>

                  <input
                    id="evidence"
                    name="evidence"
                    type="url"
                    placeholder="https://..."
                    disabled={isSubmitting}
                    className="w-full rounded-xl border border-white/10 bg-black/60 px-4 py-3 text-gray-200 placeholder:text-gray-600 outline-none transition focus:border-emerald-400/60 focus:ring-2 focus:ring-emerald-400/10 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </div>

                <div>
                  <label
                    htmlFor="description"
                    className="mb-2 block text-sm font-bold text-gray-200"
                  >
                    What happened?
                  </label>

                  <textarea
                    id="description"
                    name="description"
                    rows={6}
                    required
                    disabled={isSubmitting}
                    placeholder="Describe what you observed and why you believe it may be suspicious..."
                    className="w-full resize-none rounded-xl border border-white/10 bg-black/60 px-4 py-3 text-gray-200 placeholder:text-gray-600 outline-none transition focus:border-emerald-400/60 focus:ring-2 focus:ring-emerald-400/10 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </div>

                <div>
                  <label
                    htmlFor="contact"
                    className="mb-2 block text-sm font-bold text-gray-200"
                  >
                    Contact (Optional)
                  </label>

                  <input
                    id="contact"
                    name="contact"
                    type="text"
                    placeholder="X handle, Telegram username, or email"
                    disabled={isSubmitting}
                    className="w-full rounded-xl border border-white/10 bg-black/60 px-4 py-3 text-gray-200 placeholder:text-gray-600 outline-none transition focus:border-emerald-400/60 focus:ring-2 focus:ring-emerald-400/10 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex w-full items-center justify-center gap-3 rounded-xl border border-red-400/30 bg-red-500/10 px-6 py-4 font-black uppercase tracking-[0.15em] text-red-300 transition hover:bg-red-500/20 hover:text-red-200 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSubmitting ? (
                    <>
                      <span
                        className="h-5 w-5 animate-spin rounded-full border-2 border-red-300/30 border-t-red-300"
                        aria-hidden="true"
                      />

                      Submitting Report...
                    </>
                  ) : (
                    "Submit Threat Report"
                  )}
                </button>

                <p className="text-center text-xs leading-5 text-gray-500">
                  Please provide accurate information and avoid submitting
                  unverified accusations as facts.
                </p>
              </form>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex min-h-[500px] flex-col items-center justify-center text-center"
              >
                {/* Report number */}
                <div className="w-full rounded-2xl border border-cyan-400/30 bg-cyan-400/10 px-6 py-5">
                  <p className="text-xs font-bold uppercase tracking-[0.3em] text-cyan-300">
                    Report Number
                  </p>

                  <p className="mt-2 text-3xl font-black tracking-wider text-white sm:text-4xl">
                    {reportNumber !== null
                      ? `NG-${String(reportNumber).padStart(6, "0")}`
                      : "NG-REPORT"}
                  </p>
                </div>

                <div className="mt-8 flex h-20 w-20 items-center justify-center rounded-full border border-emerald-400/30 bg-emerald-400/10 text-4xl">
                  ✓
                </div>

                <h3 className="mt-6 text-3xl font-black text-white">
                  Report received.
                </h3>

                <p className="mt-4 max-w-md leading-7 text-gray-400">
                  Thank you for helping protect the NovaGaia community.
                  Remember: reports should be investigated and supported by
                  evidence before conclusions are reached.
                </p>

                <button
                  type="button"
                  onClick={handleAnotherReport}
                  className="mt-8 rounded-xl border border-emerald-400/30 bg-emerald-400/10 px-6 py-3 font-bold text-emerald-300 transition hover:bg-emerald-400/20"
                >
                  Submit Another Report
                </button>
              </motion.div>
            )}
          </motion.div>
        </div>

        {/* Philosophy footer */}
        <div className="mt-12 text-center">
          <p className="text-sm font-bold uppercase tracking-[0.3em] text-gray-500">
            Protect. Research. Learn.
          </p>

          <p className="mt-3 text-lg font-semibold text-gray-300">
            Don&apos;t trust the hype. Verify the evidence.
          </p>
        </div>
      </div>
    </section>
  );
}