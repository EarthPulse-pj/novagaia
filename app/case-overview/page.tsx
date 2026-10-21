"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type PublicCase = {
  id: string;
  caseNumber: string;
  projectName: string;
  category: string;
  description: string | null;
  contractAddress: string | null;
  caseDate: string;
  status: string;
  workflowStage: string;
  publicationChecklist: Record<string, unknown> | null;
  assessmentType: "project" | "promoter" | "none";
  assessment: Record<string, unknown> | null;
};

function getText(value: unknown): string {
  if (typeof value === "string" && value.trim()) {
    return value.trim();
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }

  return "Not recorded";
}

function getChecklistSelections(
  value: unknown
): Record<string, string[]> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  const result: Record<string, string[]> = {};

  for (const [key, entry] of Object.entries(
    value as Record<string, unknown>
  )) {
    if (Array.isArray(entry)) {
      result[key] = entry.filter(
        (item): item is string => typeof item === "string"
      );
    }
  }

  return result;
}

function getSelectedIds(
  checklist: Record<string, string[]>,
  category: string
): string[] {
  return checklist[category] ?? [];
}

function formatIndicator(
  selected: boolean,
  label: string
): string {
  return `${selected ? "[X]" : "[ ]"} ${label}`;
}

const projectRiskIndicators: Record<
  string,
  { id: string; label: string }[]
> = {
  "Contract & Token Controls": [
    { id: "mint", label: "Unrestricted mint authority confirmed" },
    { id: "freeze", label: "Concerning freeze authority confirmed" },
    { id: "upgrade", label: "Material upgrade control risk verified" },
    { id: "ownership", label: "Concentrated or unsafe control permissions verified" },
    { id: "contract", label: "Other material contract risk supported by evidence" },
  ],
  "Holder Distribution": [
    { id: "concentration", label: "High holder concentration verified" },
    { id: "insiders", label: "Material insider allocation concern documented" },
    { id: "whales", label: "Significant whale exposure verified" },
    { id: "clusters", label: "Related wallets or clustering supported by analysis" },
    { id: "distribution", label: "Other material distribution risk documented" },
  ],
  "Liquidity & Exit Risk": [
    { id: "depth", label: "Insufficient liquidity depth verified" },
    { id: "concentration", label: "Liquidity concentrated in a risky pool or venue" },
    { id: "removal", label: "Liquidity removal or withdrawal risk identified" },
    { id: "trading", label: "Material trading or slippage concern documented" },
    { id: "exit", label: "Significant exit barriers supported by evidence" },
  ],
  "Team & Transparency": [
    { id: "identity", label: "Important team identity claims remain unverified" },
    { id: "disclosure", label: "Material project disclosures are missing" },
    { id: "allocation", label: "Token allocation information is unclear or inconsistent" },
    { id: "development", label: "Expected development activity lacks verifiable support" },
    { id: "inconsistency", label: "Material public statements conflict with evidence" },
  ],
  "Website & Infrastructure": [
    { id: "authenticity", label: "Website authenticity concern verified" },
    { id: "domain", label: "Domain or infrastructure security concern identified" },
    { id: "reliability", label: "Material technical reliability issue documented" },
    { id: "services", label: "Linked service or integration presents a verified risk" },
    { id: "impersonation", label: "Impersonation or deceptive infrastructure evidence found" },
  ],
  "Marketing & Promotion": [
    { id: "claims", label: "Material promotional claims are misleading or unsupported" },
    { id: "paid", label: "Paid promotion appears undisclosed based on available evidence" },
    { id: "returns", label: "Unrealistic or guaranteed-return claims documented" },
    { id: "pressure", label: "Aggressive or coercive promotional tactics documented" },
    { id: "coordination", label: "Coordinated deceptive promotion supported by evidence" },
  ],
  "Community Behavior": [
    { id: "harassment", label: "Harassment or targeted abuse documented" },
    { id: "manipulation", label: "Manipulative community activity supported by evidence" },
    { id: "impersonation", label: "Community impersonation incident verified" },
    { id: "censorship", label: "Evidence of suppressing legitimate concerns documented" },
    { id: "coordination", label: "Coordinated harmful behavior substantiated" },
  ],
  "On-Chain Behavior": [
    { id: "wallets", label: "Suspicious wallet activity verified" },
    { id: "transactions", label: "Materially unusual transaction patterns documented" },
    { id: "funds", label: "Concerning fund movements traced with evidence" },
    { id: "relationships", label: "Relevant wallet relationships supported by analysis" },
    { id: "interactions", label: "Suspicious contract interactions substantiated" },
  ],
};

const projectRiskScoreFields: {
  name: string;
  field: string;
  max: number;
}[] = [
  { name: "Contract & Token Controls", field: "contract_token_controls", max: 20 },
  { name: "Holder Distribution", field: "holder_distribution", max: 15 },
  { name: "Liquidity & Exit Risk", field: "liquidity_exit_risk", max: 15 },
  { name: "Team & Transparency", field: "team_transparency", max: 10 },
  { name: "Website & Infrastructure", field: "website_infrastructure", max: 10 },
  { name: "Marketing & Promotion", field: "marketing_promotion", max: 10 },
  { name: "Community Behavior", field: "community_behavior", max: 10 },
  { name: "On-Chain Behavior", field: "on_chain_behavior", max: 10 },
];

const promoterRiskIndicators: Record<
  string,
  { id: string; label: string }[]
> = {
  "Promotion History": [
    { id: "prior_failures", label: "Previous promoted projects have documented serious failures" },
    { id: "repeat_concerns", label: "Multiple previous promotions have substantiated material concerns" },
    { id: "ignored_warnings", label: "Promotion continued after credible, evidence-supported warnings" },
    { id: "unresolved_projects", label: "Repeated promotion of projects with unresolved serious concerns" },
    { id: "past_claims", label: "Material claims about previous promotions conflict with documented facts" },
  ],
  "Project Due Diligence": [
    { id: "contract_unchecked", label: "Promoted token or contract was not independently verified" },
    { id: "team_unverified", label: "Material team, partnership, or affiliation claims were not verified" },
    { id: "warnings_overlooked", label: "Significant, readily identifiable warning signs were overlooked" },
    { id: "safety_unsubstantiated", label: "Safety claims lacked supporting contract, liquidity, or tokenomics checks" },
    { id: "discrepancies_ignored", label: "Promotion continued despite unresolved material discrepancies" },
  ],
  "Misleading Claims": [
    { id: "guaranteed_returns", label: "Documented guaranteed-profit or risk-free investment claims" },
    { id: "false_partnership", label: "Material partnership or endorsement claims were contradicted by evidence" },
    { id: "unsupported_performance", label: "Material performance or price claims lacked adequate support" },
    { id: "false_urgency", label: "Promotional statements materially misrepresented deadlines or scarcity" },
    { id: "repeated_false_claims", label: "Repeated material claims remained false or misleading after correction opportunities" },
  ],
  "Transparency & Disclosure": [
    { id: "undisclosed_payment", label: "Evidence supports an undisclosed payment for promotion" },
    { id: "undisclosed_tokens", label: "Material token holdings or allocations were not adequately disclosed" },
    { id: "hidden_affiliation", label: "A material project affiliation or conflict of interest was concealed" },
    { id: "affiliate_omission", label: "Material referral or affiliate incentives were not disclosed" },
    { id: "misleading_disclosure", label: "Disclosures materially contradicted available evidence" },
  ],
  "Promotion Pattern": [
    { id: "repeated_high_risk", label: "Repeated promotion of projects with independently documented serious concerns" },
    { id: "similar_claims", label: "Recurring unsupported claims across multiple promotions" },
    { id: "warning_recurrence", label: "Similar warning signs recur across promoted projects" },
    { id: "coordinated_campaigns", label: "Evidence supports coordinated promotional campaigns lacking transparency" },
    { id: "repeat_after_outcomes", label: "Similar promotion patterns continued after documented negative outcomes" },
  ],
  "Financial Incentives": [
    { id: "undisclosed_compensation", label: "Evidence supports material undisclosed promotional compensation" },
    { id: "token_payment", label: "Token payments or allocations connected to promotion were inadequately disclosed" },
    { id: "referral_conflict", label: "Material referral commissions or incentives were not disclosed" },
    { id: "incentive_claim_conflict", label: "Statements about financial incentives conflict with available evidence" },
    { id: "concealed_arrangement", label: "Evidence supports a concealed material financial arrangement" },
  ],
  "Community Conduct": [
    { id: "targeted_harassment", label: "Documented targeted harassment connected to promotional activity" },
    { id: "suppressed_questions", label: "Evidence supports deliberate suppression of legitimate project concerns" },
    { id: "impersonation", label: "Verified impersonation or deceptive identity use" },
    { id: "coercive_pressure", label: "Documented coercive pressure or intimidation of community members" },
    { id: "deceptive_engagement", label: "Evidence supports fabricated engagement or deceptive community activity" },
  ],
};

const promoterRiskScoreFields: {
  name: string;
  field: string;
  max: number;
}[] = [
  { name: "Promotion History", field: "promotion_history", max: 15 },
  { name: "Project Due Diligence", field: "project_due_diligence", max: 15 },
  { name: "Misleading Claims", field: "misleading_claims", max: 15 },
  { name: "Transparency & Disclosure", field: "transparency_disclosure", max: 10 },
  { name: "Promotion Pattern", field: "promotion_pattern", max: 10 },
  { name: "Financial Incentives", field: "financial_incentives", max: 10 },
  { name: "Community Conduct", field: "community_conduct", max: 10 },
];

const promoterVerificationItems: Record<
  string,
  { id: string; label: string }[]
> = {
  "Identity & Affiliation": [
    { id: "identity_verified", label: "Identity independently verified" },
    { id: "official_accounts_verified", label: "Official social accounts verified" },
    { id: "project_affiliation_verified", label: "Claimed project affiliations independently verified" },
    { id: "promotion_disclosures_checked", label: "Sponsorships and paid-promotion disclosures checked" },
    { id: "independent_sources_checked", label: "Claims cross-checked against independent sources" },
  ],
  "Promotion History": [
    { id: "previous_promotions_reviewed", label: "Previous promotions and their outcomes reviewed" },
    { id: "past_project_issues_checked", label: "Publicly documented issues involving previously promoted projects checked" },
    { id: "promotion_claims_compared", label: "Past promotional claims compared with verifiable outcomes" },
  ],
  "Project Due Diligence": [
    { id: "project_identity_checked", label: "Promoted project's identity and official links checked" },
    { id: "contract_address_checked", label: "Token or contract address independently verified" },
    { id: "project_evidence_reviewed", label: "Project claims checked against primary evidence" },
  ],
  "Misleading Claims": [
    { id: "guaranteed_returns_checked", label: "Claims of guaranteed returns or risk-free profits reviewed" },
    { id: "claims_evidence_checked", label: "Material claims checked against supporting evidence" },
    { id: "edited_content_checked", label: "Relevant posts, edits, corrections, and deleted claims documented where available" },
  ],
  "Transparency & Disclosure": [
    { id: "paid_promotion_checked", label: "Paid promotion or sponsorship disclosure checked" },
    { id: "token_holdings_disclosed", label: "Relevant token holdings or allocations disclosed or investigated" },
    { id: "conflicts_checked", label: "Potential conflicts of interest documented" },
  ],
  "Promotion Pattern": [
    { id: "campaign_pattern_reviewed", label: "Promotion timing and repeated campaign patterns reviewed" },
    { id: "coordination_evidence_checked", label: "Evidence of coordinated promotion independently checked" },
    { id: "repeated_projects_checked", label: "Repeated promotion of projects with documented concerns reviewed" },
  ],
  "Financial Incentives": [
    { id: "referral_rewards_checked", label: "Referral links, commissions, or rewards checked" },
    { id: "token_compensation_checked", label: "Token payments, allocations, or other compensation investigated" },
    { id: "incentive_disclosure_checked", label: "Disclosure of relevant financial incentives reviewed" },
  ],
  "Community Conduct": [
    { id: "impersonation_checked", label: "Evidence of impersonation or false identity checked" },
    { id: "question_suppression_checked", label: "Documented attempts to suppress legitimate questions reviewed" },
    { id: "harassment_evidence_checked", label: "Relevant, documented harassment or intimidation evidence reviewed" },
  ],
};

const publicationChecklistItems: {
  key: string;
  label: string;
}[] = [
  { key: "caseReview", label: "Case review confirmed" },
  { key: "evidenceReviewed", label: "Evidence reviewed" },
  { key: "riskAssessmentReviewed", label: "Risk assessment reviewed" },
  { key: "publicDisclosureReady", label: "Public disclosure marked ready" },
];

export default function CaseOverviewPage() {
  const [cases, setCases] = useState<PublicCase[]>([]);
  const [expandedCase, setExpandedCase] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadCases() {
      try {
        const response = await fetch("/api/public/case-overview", {
          cache: "no-store",
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error("Unable to load published cases.");
        }

        if (active) {
          setCases(result.cases ?? []);
        }
      } catch {
        if (active) {
          setError(
            "Published cases could not be loaded. Please try again later."
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadCases();

    return () => {
      active = false;
    };
  }, []);

  function formatDate(value: string) {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "Not available";
    }

    return date.toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-12 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-cyan-300 transition hover:text-cyan-200"
        >
          <span aria-hidden="true">←</span>
          Back to NovaGaia
        </Link>

        <header className="mt-8 border-b border-slate-800 pb-8">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-400">
            NovaGaia Intelligence
          </p>

          <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
            Public Case Overview
          </h1>

          <p className="mt-4 max-w-2xl leading-7 text-slate-300">
            Browse Operation Blacklist cases approved for public disclosure.
            Select a case number to view its available public information.
            A published case represents a reviewed report, not automatic
            proof of wrongdoing.
          </p>
        </header>

        <section className="mt-8" aria-labelledby="published-cases-heading">
          <div className="mb-4 flex items-center justify-between gap-4">
            <h2
              id="published-cases-heading"
              className="text-xl font-semibold"
            >
              Published Cases
            </h2>

            {!loading && !error && (
              <span className="rounded-full border border-slate-700 px-3 py-1 text-sm text-slate-300">
                {cases.length} {cases.length === 1 ? "case" : "cases"}
              </span>
            )}
          </div>

          {loading && (
            <p className="rounded-xl border border-slate-800 bg-slate-900 p-5 text-slate-300">
              Loading published cases…
            </p>
          )}

          {!loading && error && (
            <div
              role="alert"
              className="rounded-xl border border-red-900 bg-red-950/40 p-5 text-red-200"
            >
              {error}
            </div>
          )}

          {!loading && !error && cases.length === 0 && (
            <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
              <h3 className="font-semibold text-white">
                No published cases available
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                Cases will appear here when they have been published and all
                required publication checks are confirmed.
              </p>
            </div>
          )}

          {!loading && !error && cases.length > 0 && (
            <div className="space-y-3">
              {cases.map((item) => {
                const isExpanded = expandedCase === item.caseNumber;
                const panelId = `case-panel-${item.caseNumber}`;

                return (
                  <article
                    key={item.caseNumber}
                    className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900"
                  >
                    <button
                      type="button"
                      aria-expanded={isExpanded}
                      aria-controls={panelId}
                      onClick={() =>
                        setExpandedCase(
                          isExpanded ? null : item.caseNumber
                        )
                      }
                      className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition hover:bg-slate-800/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-cyan-400"
                    >
                      <span>
                        <span className="block font-semibold text-cyan-300">
                          {item.caseNumber}
                        </span>
                        <span className="mt-1 block text-sm text-slate-300">
                          {item.projectName || "Project name unavailable"}
                        </span>
                      </span>

                      <span
                        aria-hidden="true"
                        className="shrink-0 text-xl text-slate-400"
                      >
                        {isExpanded ? "−" : "+"}
                      </span>
                    </button>

                    {isExpanded && (
                      <div
                        id={panelId}
                        className="space-y-4 border-t border-slate-800 px-5 py-5"
                      >
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                            Project / Token
                          </p>
                          <p className="mt-1 break-words text-slate-100">
                            {item.projectName || "Not available"}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                            Case Description
                          </p>
                          <p className="mt-2 rounded-xl border border-slate-800 bg-slate-950/60 p-4 text-sm leading-6 text-slate-300 whitespace-pre-wrap">
                            {item.description?.trim() || "No public description available."}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                            Threat Category
                          </p>
                          <p className="mt-1 break-words text-slate-100">
                            {item.category || "Not available"}
                          </p>
                        </div>

                        {item.contractAddress && (
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                              Contract / Token Address
                            </p>
                            <p className="mt-1 break-all font-mono text-sm text-slate-200">
                              {item.contractAddress}
                            </p>
                          </div>
                        )}

                        <div className="grid gap-4 sm:grid-cols-2">
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                              Case Created
                            </p>
                            <p className="mt-1 text-slate-200">
                              {formatDate(item.caseDate)}
                            </p>
                          </div>

                          <div>
                            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                              Public Status
                            </p>
                            <p className="mt-1 text-emerald-300">
                              {item.status}
                            </p>
                          </div>
                        </div>

                        {item.assessment && item.assessmentType !== "none" && (
                          <section className="space-y-4 rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                            <div>
                              <h3 className="text-sm font-semibold uppercase tracking-wider text-cyan-300">
                                {item.assessmentType === "promoter"
                                  ? "Promoter Risk Assessment"
                                  : "Project / Token Risk Assessment"}
                              </h3>
                              <p className="mt-1 text-xs leading-5 text-slate-400">
                                Saved assessment scores approved for public display.
                                Scores reflect the recorded assessment and are not,
                                by themselves, proof of wrongdoing.
                              </p>
                            </div>

                            <div className="grid gap-3 sm:grid-cols-2">
                              <div className="rounded-lg border border-slate-800 p-3">
                                <p className="text-xs uppercase tracking-wider text-slate-500">
                                  Overall Risk Score
                                </p>
                                <p className="mt-1 text-2xl font-bold text-white">
                                  {getText(
                                    item.assessmentType === "promoter"
                                      ? item.assessment.promoter_risk_score
                                      : item.assessment.overall_score
                                  )}
                                  <span className="ml-1 text-sm font-normal text-slate-400">
                                    /{item.assessmentType === "promoter" ? "85" : "100"}
                                  </span>
                                </p>
                              </div>

                              <div className="rounded-lg border border-slate-800 p-3">
                                <p className="text-xs uppercase tracking-wider text-slate-500">
                                  Recorded Risk Band
                                </p>
                                <p className="mt-2 font-semibold text-white">
                                  {getText(
                                    item.assessmentType === "promoter"
                                      ? item.assessment.promoter_risk_band
                                      : item.assessment.risk_band
                                  )}
                                </p>
                              </div>
                            </div>

                            <div>
                              <h4 className="mb-3 text-sm font-semibold text-slate-200">
                                Category Score Breakdown
                              </h4>
                              <div className="space-y-2">
                                {(item.assessmentType === "promoter"
                                  ? promoterRiskScoreFields
                                  : projectRiskScoreFields
                                ).map((field) => (
                                  <div
                                    key={field.field}
                                    className="flex items-start justify-between gap-4 rounded-lg border border-slate-800 px-3 py-2"
                                  >
                                    <span className="text-sm text-slate-300">
                                      {field.name}
                                    </span>
                                    <span className="shrink-0 text-sm font-medium text-white">
                                      {getText(item.assessment?.[field.field])}
                                      <span className="text-slate-500">
                                        {" "}/ {field.max}
                                      </span>
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {item.assessmentType === "promoter" && (
                              <div className="grid gap-3 sm:grid-cols-2">
                                <div>
                                  <p className="text-xs uppercase tracking-wider text-slate-500">
                                    Evidence Confidence Score
                                  </p>
                                  <p className="mt-1 text-slate-200">
                                    {getText(item.assessment.evidence_confidence_score)}
                                    <span className="text-slate-500"> / 15</span>
                                  </p>
                                </div>
                                <div>
                                  <p className="text-xs uppercase tracking-wider text-slate-500">
                                    Evidence Confidence Level
                                  </p>
                                  <p className="mt-1 text-slate-200">
                                    {getText(item.assessment.evidence_confidence_level)}
                                  </p>
                                </div>
                                <div className="sm:col-span-2">
                                  <p className="text-xs uppercase tracking-wider text-slate-500">
                                    Evidence Strength
                                  </p>
                                  <p className="mt-1 text-slate-200">
                                    {getText(item.assessment.evidence_strength)}
                                  </p>
                                </div>
                              </div>
                            )}

                            <div className="grid gap-3 border-t border-slate-800 pt-3 sm:grid-cols-2">
                              <div>
                                <p className="text-xs uppercase tracking-wider text-slate-500">
                                  Assessment Recorded
                                </p>
                                <p className="mt-1 text-sm text-slate-300">
                                  {getText(item.assessment.assessed_at)}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs uppercase tracking-wider text-slate-500">
                                  Last Assessment Update
                                </p>
                                <p className="mt-1 text-sm text-slate-300">
                                  {getText(item.assessment.updated_at)}
                                </p>
                              </div>
                            </div>
                          </section>
                        )}

                        <p className="border-t border-slate-800 pt-4 text-sm leading-6 text-slate-400">
                          This overview contains approved public listing
                          information only. It does not publish private
                          investigation records or supporting evidence.
                        </p>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <footer className="mt-10 border-t border-slate-800 pt-6 text-sm text-slate-500">
          NovaGaia Operation Blacklist · Public case information
        </footer>
      </div>
    </main>
  );
}