"use client";

import { useEffect, useMemo, useState } from "react";

type WorkflowStage =
  | "report"
  | "triage"
  | "investigate"
  | "risk"
  | "review"
  | "publish"
  | "response"
  | "update"
  | "clear";

type CaseStatus =
  | "open"
  | "under_review"
  | "published"
  | "response"
  | "update"
  | "cleared";

type ThreatReport = {
  id: string;
  created_at: string;
  report_number: number;
  threat_type: string;
  project: string;
  evidence: string | null;
  description: string;
  contact: string | null;
  status:
    | "NEW"
    | "UNDER REVIEW"
    | "INVESTIGATING"
    | "VERIFIED"
    | "DISMISSED";
};

type BlacklistCase = {
  id: string;
  project: string;
  threatType: string;
  submitted: string;
  status: CaseStatus;
  stage: WorkflowStage;
  description: string;
  reportId?: string;
  reportNumber?: number;
  publicationChecklist?: {
    caseReview: boolean;
    evidenceReviewed: boolean;
    riskAssessmentReviewed: boolean;
    publicDisclosureReady: boolean;
  };
};

type RiskCategory = {
  name: string;
  description: string;
  max: number;
  scoringGuide: string;
};

const workflow: {
  key: WorkflowStage;
  label: string;
  description: string;
}[] = [
  {
    key: "report",
    label: "Report",
    description: "Threat report received",
  },
  {
    key: "triage",
    label: "Triage",
    description: "Initial case screening",
  },
  {
    key: "investigate",
    label: "Investigate",
    description: "Evidence investigation",
  },
  {
    key: "risk",
    label: "Risk Assess",
    description: "Calculate risk score",
  },
  {
    key: "review",
    label: "Review",
    description: "Final investigator review",
  },
  {
    key: "publish",
    label: "Published",
    description: "Publish confirmed threat",
  },
  {
    key: "response",
    label: "Response",
    description: "Document project or community response",
  },
  {
    key: "update",
    label: "Update",
    description: "Maintain ongoing case intelligence",
  },
  {
    key: "clear",
    label: "Clear",
    description: "Clear the case",
  },
];

const riskCategories: RiskCategory[] = [
  {
    name: "Contract & Token Controls",
    description:
      "Mint authority, freeze authority, upgradeability, ownership controls, suspicious permissions, or other contract and token-level risks.",
    max: 20,
    scoringGuide:
      "0–4: No significant control concerns identified. 5–9: Minor or limited concerns. 10–14: Multiple significant control risks. 15–20: Severe or highly concerning contract/token controls.",
  },
  {
    name: "Holder Distribution",
    description:
      "Concentration of token holdings, insider allocations, whale exposure, wallet clustering, or other distribution-related risks.",
    max: 15,
    scoringGuide:
      "0–3: Broad and relatively healthy distribution. 4–6: Some concentration concerns. 7–10: Significant concentration or insider exposure. 11–15: Extreme concentration or highly concerning holder patterns.",
  },
  {
    name: "Liquidity & Exit Risk",
    description:
      "Liquidity depth, liquidity concentration, withdrawal or removal risk, trading conditions, and potential barriers to exiting positions.",
    max: 15,
    scoringGuide:
      "0–3: Strong liquidity conditions with limited identified concerns. 4–6: Some liquidity limitations. 7–10: Significant liquidity or exit concerns. 11–15: Severe liquidity weakness or substantial exit risk.",
  },
  {
    name: "Team & Transparency",
    description:
      "Team identity and verifiability, project disclosures, documentation, token allocations, development activity, and consistency of public information.",
    max: 10,
    scoringGuide:
      "0–2: Strongly verifiable and transparent. 3–4: Minor transparency gaps. 5–7: Significant verification or disclosure concerns. 8–10: Severe lack of transparency or unverifiable claims.",
  },
  {
    name: "Website & Infrastructure",
    description:
      "Website authenticity, domain and infrastructure security, technical reliability, linked services, impersonation risks, and suspicious infrastructure.",
    max: 10,
    scoringGuide:
      "0–2: No significant infrastructure concerns. 3–4: Minor technical or authenticity concerns. 5–7: Significant infrastructure or authenticity risks. 8–10: Severe or highly suspicious infrastructure indicators.",
  },
  {
    name: "Marketing & Promotion",
    description:
      "Misleading promotion, unrealistic claims, undisclosed paid promotion, aggressive marketing behavior, or other promotional risk indicators.",
    max: 10,
    scoringGuide:
      "0–2: Responsible and evidence-based promotion. 3–4: Some questionable promotional practices. 5–7: Significant misleading or aggressive promotion. 8–10: Severe promotional misconduct or highly misleading claims.",
  },
  {
    name: "Community Behavior",
    description:
      "Harassment, manipulation, impersonation, coordinated abuse, censorship of legitimate concerns, or other harmful community behavior.",
    max: 10,
    scoringGuide:
      "0–2: No significant behavioral concerns. 3–4: Minor community conduct concerns. 5–7: Significant manipulation, harassment, or abusive behavior. 8–10: Severe or coordinated harmful behavior.",
  },
  {
    name: "On-Chain Behavior",
    description:
      "Suspicious wallet activity, unusual transaction patterns, fund movements, wallet relationships, contract interactions, or other verifiable on-chain behavior.",
    max: 10,
    scoringGuide:
      "0–2: No significant suspicious activity identified. 3–4: Minor anomalies requiring monitoring. 5–7: Significant suspicious on-chain patterns. 8–10: Severe or strongly corroborated suspicious activity.",
  },
];

type PromoterRiskCategory = {
  name: string;
  description: string;
  max: number;
  scoringGuide: string;
};

const promoterRiskCategories: PromoterRiskCategory[] = [
  {
    name: "Promotion History",
    description:
      "Documented history of promoting projects or campaigns associated with significant problems.",
    max: 15,
    scoringGuide:
      "0–2: No concerning history identified. 3–5: One or more questionable promotions with limited evidence of serious problems. 6–8: Multiple questionable promotions or recurring concerns. 9–11: Several promotions connected to serious misconduct or substantial unresolved concerns. 12–15: Strong documented pattern involving multiple projects associated with serious misconduct.",
  },
  {
    name: "Project Due Diligence",
    description:
      "Apparent level of verification performed before promoting a project or campaign.",
    max: 15,
    scoringGuide:
      "0–2: Reasonable verification is documented. 3–5: Some verification but important gaps remain. 6–8: Limited due diligence with significant unchecked information. 9–11: Repeated promotion despite obvious unresolved warning signs. 12–15: Strong evidence of repeatedly disregarding substantial and readily identifiable warning indicators.",
  },
  {
    name: "Misleading Claims",
    description:
      "False, exaggerated, unverifiable, or materially misleading promotional statements.",
    max: 15,
    scoringGuide:
      "0–2: Claims appear appropriately supported and qualified. 3–5: Minor exaggeration or weakly supported claims. 6–8: Multiple unsupported or substantially exaggerated claims. 9–11: Repeated materially misleading claims. 12–15: Strong documented pattern of materially false or deceptive promotional claims.",
  },
  {
    name: "Transparency & Disclosure",
    description:
      "Disclosure of sponsorships, payments, token allocations, affiliate relationships, and other material incentives.",
    max: 10,
    scoringGuide:
      "0–1: Relevant relationships are clearly disclosed. 2–3: Minor disclosure gaps. 4–5: Important promotional relationships are inconsistently disclosed. 6–8: Repeated failure to disclose material relationships. 9–10: Strong evidence of concealed or deceptive material relationships.",
  },
  {
    name: "Promotion Pattern",
    description:
      "Recurring patterns of promoting questionable projects or campaigns.",
    max: 10,
    scoringGuide:
      "0–1: No concerning pattern. 2–3: Isolated questionable promotion. 4–5: Several questionable promotions with common characteristics. 6–8: Repeated promotion of projects displaying similar warning signs. 9–10: Strong recurring pattern despite repeated warning indicators or previous negative outcomes.",
  },
  {
    name: "Financial Incentives",
    description:
      "Whether financial or token incentives appear connected to promotional behavior in a concerning way.",
    max: 10,
    scoringGuide:
      "0–1: No significant incentive concern. 2–3: Incentives exist and appear appropriately disclosed. 4–5: Significant incentives with incomplete disclosure. 6–8: Strong evidence that substantial incentives influenced promotion without adequate transparency. 9–10: Strong documented evidence of concealed or deceptive incentive arrangements.",
  },
  {
    name: "Community Conduct",
    description:
      "Documented behavior toward audiences and communities during promotion or investigation.",
    max: 10,
    scoringGuide:
      "0–1: No significant concern. 2–3: Occasional inappropriate behavior without a clear pattern. 4–5: Repeated hostile, manipulative, or misleading interactions. 6–8: Documented manipulation, intimidation, deceptive engagement, or targeted pressure. 9–10: Strong evidence of systematic manipulation, intimidation, or deceptive recruitment.",
  },
];

const promoterEvidenceCategory: PromoterRiskCategory = {
  name: "Evidence Strength",
  description:
    "Quality, reliability, corroboration, and completeness of evidence supporting the promoter assessment.",
  max: 15,
  scoringGuide:
    "0–2: Little or no reliable evidence. 3–5: Limited evidence with significant gaps. 6–8: Multiple reasonably credible sources with unresolved questions. 9–11: Strong corroborated evidence from multiple sources. 12–15: Extensive, highly reliable, independently corroborated evidence.",
};

const demoCases: BlacklistCase[] = [
  {
    id: "8e3d1744-9a98-4568-9b79-d7ad5a2d9b38",
    project: "Example Protocol",
    threatType: "Potential Rug Pull",
    submitted: "2026-09-16",
    status: "open",
    stage: "triage",
    description:
      "Demo case used to demonstrate the Operation Blacklist investigation workflow.",
  },

  {
    id: "46de87a0-d070-405e-b65f-dfd7fe711e3d",
    project: "Sample Finance",
    threatType: "Suspicious Token Activity",
    submitted: "2026-09-15",
    status: "under_review",
    stage: "investigate",
    description:
      "Demo investigation case with evidence awaiting investigator assessment.",
  },

  {
    id: "1c3aa44e-e9cb-484e-815c-dd9a53913690",
    project: "Demo DAO",
    threatType: "Transparency Concern",
    submitted: "2026-09-14",
    status: "under_review",
    stage: "risk",
    description:
      "Demo case currently ready for formal risk assessment.",
  },
];

function getStageIndex(stage: WorkflowStage) {
  return workflow.findIndex((item) => item.key === stage);
}

function getCategoryScoreBand(
  category: RiskCategory,
  score: number
) {
  if (category.max === 20) {
    if (score <= 4) {
      return {
        label: "Low",
        className:
          "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
      };
    }

    if (score <= 9) {
      return {
        label: "Moderate",
        className:
          "border-amber-500/30 bg-amber-500/10 text-amber-400",
      };
    }

    if (score <= 14) {
      return {
        label: "High",
        className:
          "border-orange-500/30 bg-orange-500/10 text-orange-400",
      };
    }

    return {
      label: "Severe",
      className:
        "border-red-500/30 bg-red-500/10 text-red-400",
    };
  }

  if (category.max === 15) {
    if (score <= 3) {
      return {
        label: "Low",
        className:
          "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
      };
    }

    if (score <= 6) {
      return {
        label: "Moderate",
        className:
          "border-amber-500/30 bg-amber-500/10 text-amber-400",
      };
    }

    if (score <= 10) {
      return {
        label: "High",
        className:
          "border-orange-500/30 bg-orange-500/10 text-orange-400",
      };
    }

    return {
      label: "Severe",
      className:
        "border-red-500/30 bg-red-500/10 text-red-400",
    };
  }

  if (score <= 2) {
    return {
      label: "Low",
      className:
        "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
    };
  }

  if (score <= 4) {
    return {
      label: "Moderate",
      className:
        "border-amber-500/30 bg-amber-500/10 text-amber-400",
    };
  }

  if (score <= 7) {
    return {
      label: "High",
      className:
        "border-orange-500/30 bg-orange-500/10 text-orange-400",
    };
  }

  return {
    label: "Severe",
    className:
      "border-red-500/30 bg-red-500/10 text-red-400",
  };
}

function getRiskLevel(score: number) {
  if (score >= 75) {
    return {
      label: "Critical",
      description: "Very high risk based on the current assessment.",
    };
  }

  if (score >= 50) {
    return {
      label: "High",
      description: "Significant risk indicators require careful review.",
    };
  }

  if (score >= 25) {
    return {
      label: "Moderate",
      description: "Some risk indicators are present.",
    };
  }

  return {
    label: "Low",
    description: "Limited risk indicators identified so far.",
  };
}

export default function BlacklistPage() {
  const [cases, setCases] =
    useState<BlacklistCase[]>(demoCases);

  const [reports, setReports] =
    useState<ThreatReport[]>([]);

  const [loadingReports, setLoadingReports] =
    useState(true);

  const [reportsError, setReportsError] =
    useState("");
  const [creatingCaseReportId, setCreatingCaseReportId] =
  useState<string | null>(null);

const [caseCreationMessage, setCaseCreationMessage] =
  useState("");
    
  const [selectedCaseId, setSelectedCaseId] = useState("");
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [activeTab, setActiveTab] =
    useState<
      "cases"
      | "triage"
      | "investigate"
      | "risk"
      | "review"
      | "publish"
      | "response"
      | "update"
      | "clear"
    >("cases");

  const [reviewConfirmed, setReviewConfirmed] =
  useState(false);

  const [publishChecklist, setPublishChecklist] =
  useState({
    caseReview: false,
    evidenceReviewed: false,
    riskAssessmentReviewed: false,
    publicDisclosureReady: false,
  });

  const publishChecklistComplete =
  publishChecklist.caseReview &&
  publishChecklist.evidenceReviewed &&
  publishChecklist.riskAssessmentReviewed &&
  publishChecklist.publicDisclosureReady;

const [assessmentType, setAssessmentType] = useState<
  "project" | "promoter"
>("project");

const [scores, setScores] = useState<Record<string, number>>({});

const [promoterScores, setPromoterScores] = useState<
  Record<string, number>
>({});

const [promoterAssessmentNotes, setPromoterAssessmentNotes] =
  useState("");

const [savingPromoterAssessment, setSavingPromoterAssessment] =
  useState(false);

const [promoterAssessmentMessage, setPromoterAssessmentMessage] =
  useState("");
  const [assessmentNotes, setAssessmentNotes] = useState("");
    const [triageAssessment, setTriageAssessment] =
    useState<{
      subject_identified: boolean;
      within_scope: boolean;
      sufficient_information: boolean;
      duplicate_check_completed: boolean;
      immediate_user_risk_identified: boolean;
      contract_token_evidence: boolean;
      website_social_links: boolean;
      screenshots_documents: boolean;
      on_chain_references: boolean;
      evidence_quality: string;
      triage_decision: string;
      triage_notes: string;
    } | null>(null);

  const [loadingTriage, setLoadingTriage] = useState(false);
  const [savingTriage, setSavingTriage] = useState(false);
  const [triageMessage, setTriageMessage] = useState("");
   
  const [investigationAssessment,
    setInvestigationAssessment] =
    useState<{
      subject_identity_confirmed: boolean;
      subject_background_reviewed: boolean;
      project_history_reviewed: boolean;
      team_activity_reviewed: boolean;
      contract_reviewed: boolean;
      tokenomics_reviewed: boolean;
      liquidity_reviewed: boolean;
      on_chain_activity_reviewed: boolean;
      preliminary_findings: string;
      investigator_notes: string;
      investigation_decision: string;
    } | null>(null);

  const [loadingInvestigation,
    setLoadingInvestigation] = useState(false);

  const [investigationMessage,
    setInvestigationMessage] = useState("");
  const [savingAssessment, setSavingAssessment] = useState(false);
  const [assessmentMessage, setAssessmentMessage] = useState("");
  const [loadingAssessment, setLoadingAssessment] = useState(false);
  const selectedCase = cases.find(
    (item) => item.id === selectedCaseId
  );

    console.log(
  "SELECTED CASE DEBUG:",
  JSON.stringify(
    {
      selectedCaseId,
      selectedCase,
      casesCount: cases.length,
    },
    null,
    2
  )
);
    const loadTriageAssessment = async (caseId: string) => {
    if (!caseId) {
      setTriageAssessment(null);
      return;
    }

    setLoadingTriage(true);
    setTriageMessage("");

    try {
      const response = await fetch(
        `/api/blacklist/triage?case_id=${encodeURIComponent(caseId)}`
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.error || "Unable to load Triage assessment."
        );
      }

      if (!data.triage) {
        setTriageAssessment(null);
        setTriageMessage(
          "No saved Triage assessment for this case."
        );
        return;
      }

      setTriageAssessment({
        subject_identified:
          Boolean(data.triage.subject_identified),

        within_scope:
          Boolean(data.triage.within_scope),

        sufficient_information:
          Boolean(data.triage.sufficient_information),

        duplicate_check_completed:
          Boolean(data.triage.duplicate_check_completed),

        immediate_user_risk_identified:
          Boolean(
            data.triage.immediate_user_risk_identified
          ),

        contract_token_evidence:
          Boolean(data.triage.contract_token_evidence),

        website_social_links:
          Boolean(data.triage.website_social_links),

        screenshots_documents:
          Boolean(data.triage.screenshots_documents),

        on_chain_references:
          Boolean(data.triage.on_chain_references),

        evidence_quality:
          typeof data.triage.evidence_quality === "string"
            ? data.triage.evidence_quality
            : "",

        triage_decision:
          typeof data.triage.triage_decision === "string"
            ? data.triage.triage_decision
            : "",

        triage_notes:
          typeof data.triage.triage_notes === "string"
            ? data.triage.triage_notes
            : "",
      });

      setTriageMessage(
        "Saved Triage assessment loaded."
      );
    } catch (error) {
      console.error(
        "Triage assessment load error:",
        error
      );

      setTriageAssessment(null);

      setTriageMessage(
        error instanceof Error
          ? error.message
          : "Unable to load Triage assessment."
      );
    } finally {
      setLoadingTriage(false);
    }
  };

    const loadInvestigationAssessment = async (caseId: string) => {
    if (!caseId) {
      setInvestigationAssessment(null);
      return;
    }

    setLoadingInvestigation(true);
    setInvestigationMessage("");

    try {
      const response = await fetch(
        `/api/blacklist/investigation?case_id=${encodeURIComponent(caseId)}`
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.error || "Unable to load Investigation assessment."
        );
      }

      if (!data.investigation) {
        setInvestigationAssessment(null);
        setInvestigationMessage(
          "No saved Investigation assessment for this case."
        );
        return;
      }

      setInvestigationAssessment({
        subject_identity_confirmed: Boolean(
          data.investigation.subject_identity_confirmed
        ),
        subject_background_reviewed: Boolean(
          data.investigation.subject_background_reviewed
        ),
        project_history_reviewed: Boolean(
          data.investigation.project_history_reviewed
        ),
        team_activity_reviewed: Boolean(
          data.investigation.team_activity_reviewed
        ),
        contract_reviewed: Boolean(
          data.investigation.contract_reviewed
        ),
        tokenomics_reviewed: Boolean(
          data.investigation.tokenomics_reviewed
        ),
        liquidity_reviewed: Boolean(
          data.investigation.liquidity_reviewed
        ),
        on_chain_activity_reviewed: Boolean(
          data.investigation.on_chain_activity_reviewed
        ),
        preliminary_findings:
          typeof data.investigation.preliminary_findings === "string"
            ? data.investigation.preliminary_findings
            : "",
        investigator_notes:
          typeof data.investigation.investigator_notes === "string"
            ? data.investigation.investigator_notes
            : "",
        investigation_decision:
          typeof data.investigation.investigation_decision === "string"
            ? data.investigation.investigation_decision
            : "",
      });

      setInvestigationMessage(
        "Saved Investigation assessment loaded."
      );
    } catch (error) {
      console.error(
        "Investigation assessment load error:",
        error
      );

      setInvestigationAssessment(null);

      setInvestigationMessage(
        error instanceof Error
          ? error.message
          : "Unable to load Investigation assessment."
      );
    } finally {
      setLoadingInvestigation(false);
    }
  };

  const saveTriageAssessment = async () => {
    if (!selectedCaseId) {
      setTriageMessage("No case selected.");
      return;
    }

    if (!triageAssessment) {
      setTriageMessage("No Triage assessment data to save.");
      return;
    }

    setSavingTriage(true);
    setTriageMessage("");

    try {
      const response = await fetch(
        "/api/blacklist/triage",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            case_id: selectedCaseId,

            subject_identified:
              triageAssessment.subject_identified,

            within_scope:
              triageAssessment.within_scope,

            sufficient_information:
              triageAssessment.sufficient_information,

            duplicate_check_completed:
              triageAssessment.duplicate_check_completed,

            immediate_user_risk_identified:
              triageAssessment.immediate_user_risk_identified,

            contract_token_evidence:
              triageAssessment.contract_token_evidence,

            website_social_links:
              triageAssessment.website_social_links,

            screenshots_documents:
              triageAssessment.screenshots_documents,

            on_chain_references:
              triageAssessment.on_chain_references,

            evidence_quality:
              triageAssessment.evidence_quality,

            triage_decision:
              triageAssessment.triage_decision,

            triage_notes:
              triageAssessment.triage_notes,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.error ||
            "Unable to save Triage assessment."
        );
      }

      setTriageMessage(
        "Triage assessment saved successfully."
      );

      console.log(
        "Triage assessment saved:",
        data.triage
      );
    } catch (error) {
      console.error(
        "Triage assessment save error:",
        error
      );

      setTriageMessage(
        error instanceof Error
          ? error.message
          : "Unable to save Triage assessment."
      );
    } finally {
      setSavingTriage(false);
    }
  };

  useEffect(() => {

  if (!selectedCaseId) {
    setTriageAssessment(null);
    setTriageMessage("");
    return;
  }

  loadTriageAssessment(selectedCaseId);
}, [selectedCaseId]);

useEffect(() => {
  if (!selectedCaseId) {
    setInvestigationAssessment(null);
    setInvestigationMessage("");
    return;
  }

  loadInvestigationAssessment(selectedCaseId);
}, [selectedCaseId]);

  useEffect(() => {
  loadThreatReports();
  loadBlacklistCases();
}, []);

  useEffect(() => {
  if (!selectedCaseId) return;

  setReviewConfirmed(false);

  loadRiskAssessment(selectedCaseId);
}, [selectedCaseId]);

useEffect(() => {
  if (!selectedCaseId) return;

  setReviewConfirmed(false);

  loadPromoterAssessment(selectedCaseId);
}, [selectedCaseId]);

useEffect(() => {
  if (!selectedCaseId) return;

  const currentCase = cases.find(
    (item) => item.id === selectedCaseId
  );

  setPublishChecklist(
    currentCase?.publicationChecklist ?? {
      caseReview: false,
      evidenceReviewed: false,
      riskAssessmentReviewed: false,
      publicDisclosureReady: false,
    }
  );
}, [selectedCaseId, cases]);

async function loadBlacklistCases() {
  try {
    const response = await fetch("/api/cases", {
      method: "GET",
      cache: "no-store",
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(
        result.error || "Unable to load Blacklist cases."
      );
    }

    const loadedCases: BlacklistCase[] =
  result.cases.map(
    (item: {
      id: string;
      case_number: number;
      report_id?: string;
      subject: string;
      category: string;
      status: string;
      publication_checklist?: {
        caseReview?: boolean;
        evidenceReviewed?: boolean;
        riskAssessmentReviewed?: boolean;
        publicDisclosureReady?: boolean;
      };
      created_at: string;
      description?: string;
      evidence?: string | null;
      contact?: string | null;
    }) => ({
      id: item.id,
      project: item.subject,
      threatType: item.category,
      submitted: item.created_at,

        status:
        item.status === "triage"
          ? "open"
          : item.status === "investigating"
            ? "under_review"
            : item.status === "published"
              ? "published"
              : item.status === "response"
                ? "response"
                : item.status === "update"
                  ? "update"
                  : item.status === "cleared"
                    ? "cleared"
                    : "open",

      stage:
        item.status === "triage"
          ? "triage"
          : item.status === "investigating"
            ? "investigate"
            : item.status === "risk_assessment"
              ? "risk"
              : item.status === "review"
                ? "review"
                : item.status === "published"
                  ? "publish"
                  : item.status === "response"
                    ? "response"
                    : item.status === "update"
                      ? "update"
                      : item.status === "cleared"
                        ? "clear"
                        : "triage",

      description: item.description ?? "",
      reportId: item.report_id,
      reportNumber: item.case_number,

      publicationChecklist: {
        caseReview:
          item.publication_checklist?.caseReview ?? false,
        evidenceReviewed:
          item.publication_checklist?.evidenceReviewed ?? false,
        riskAssessmentReviewed:
          item.publication_checklist?.riskAssessmentReviewed ?? false,
        publicDisclosureReady:
          item.publication_checklist?.publicDisclosureReady ?? false,
      },
    })
  );
    setCases(loadedCases);

    console.log("LOADED BLACKLIST CASES:", {
      count: loadedCases.length,
      cases: loadedCases.map((item) => ({
        id: item.id,
        caseNumber: item.reportNumber,
        project: item.project,
        status: item.status,
        stage: item.stage,
      })),
    });

    if (loadedCases.length > 0) {
      setSelectedCaseId((currentSelectedId) => {
        const stillExists = loadedCases.some(
          (item) => item.id === currentSelectedId
        );

        return stillExists
          ? currentSelectedId
          : loadedCases[0].id;
      });
    }
  } catch (error) {
    console.error(
      "Blacklist cases loading error:",
      error
    );
  }
}

async function loadThreatReports() {
    setLoadingReports(true);
    setReportsError("");

    try {
      const response = await fetch("/api/reports", {
        method: "GET",
        cache: "no-store",
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.error || "Unable to load threat reports."
        );
      }

      const loadedReports: ThreatReport[] =
        result.reports ?? [];

      setReports(loadedReports);
    } catch (error) {
      console.error(
        "Threat reports load error:",
        error
      );

      setReportsError(
        error instanceof Error
          ? error.message
          : "Unable to load threat reports."
      );
    } finally {
      setLoadingReports(false);
    }
  }

  async function createBlacklistCase(report: ThreatReport) {
  setCreatingCaseReportId(report.id);
  setCaseCreationMessage("");

  try {
    const response = await fetch("/api/cases", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        reportId: report.id,
        subject: report.project,
        category: report.threat_type,
      }),
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(
        result.error || "Unable to create Blacklist case."
      );
    }

    const createdCase = result.case;

    const newCase: BlacklistCase = {
      id: createdCase.id,
      project: createdCase.subject,
      threatType: createdCase.category,
      submitted: createdCase.created_at,
      status: "under_review",
      stage: "triage",
      description: report.description,
      reportId: createdCase.report_id,
      reportNumber: report.report_number,
    };

    setCases((current) => [
      newCase,
      ...current,
    ]);

    setSelectedCaseId(createdCase.id);
    setActiveTab("triage");

    setCaseCreationMessage(
  `Blacklist case NG-${String(createdCase.case_number).padStart(4, "0")} created successfully and moved to Triage.`
);
  } catch (error) {
    console.error(
      "Blacklist case creation error:",
      error
    );

    setCaseCreationMessage(
      error instanceof Error
        ? error.message
        : "Unable to create Blacklist case."
    );
  } finally {
    setCreatingCaseReportId(null);
  }
}

async function loadPromoterAssessment(caseId: string) {
  setPromoterAssessmentMessage("");

  try {
    const response = await fetch(
      `/api/blacklist/promoter-assessment?case_id=${encodeURIComponent(
        caseId
      )}`,
      {
        cache: "no-store",
      }
    );

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(
        result.error ||
          "Unable to load promoter assessment."
      );
    }

    const assessment = result.assessment;

    if (!assessment) {
      setPromoterScores({});
      setPromoterAssessmentNotes("");
      return;
    }

    setPromoterScores({
      "Promotion History":
        assessment.promotion_history ?? 0,

      "Project Due Diligence":
        assessment.project_due_diligence ?? 0,

      "Misleading Claims":
        assessment.misleading_claims ?? 0,

      "Transparency & Disclosure":
        assessment.transparency_disclosure ?? 0,

      "Promotion Pattern":
        assessment.promotion_pattern ?? 0,

      "Financial Incentives":
        assessment.financial_incentives ?? 0,

      "Community Conduct":
        assessment.community_conduct ?? 0,

      "Evidence Strength":
        assessment.evidence_strength ?? 0,
    });

    setPromoterAssessmentNotes(
      assessment.assessment_notes ?? ""
    );
  } catch (error) {
    console.error(
      "Promoter assessment load error:",
      error
    );

    setPromoterAssessmentMessage(
      error instanceof Error
        ? error.message
        : "Unable to load promoter assessment."
    );
  }
}

  const filteredCases = useMemo(() => {
    const query = search.trim().toLowerCase();

    return cases.filter((item) => {
      const matchesSearch =
        !query ||
        item.id.toLowerCase().includes(query) ||
        item.project.toLowerCase().includes(query) ||
        item.threatType.toLowerCase().includes(query);

      const matchesCategory =
        categoryFilter === "All" ||
        item.threatType === categoryFilter;

      return matchesSearch && matchesCategory;
    });
  }, [cases, search, categoryFilter]);

  const totalRiskScore = riskCategories.reduce(
    (total, category) => total + (scores[category.name] || 0),
    0
  );

const promoterRiskScore = promoterRiskCategories.reduce(
  (total, category) =>
    total + (promoterScores[category.name] || 0),
  0
);

function getPromoterRiskLevel(score: number) {
  if (score >= 61) {
    return {
      label: "CRITICAL RISK",
      description:
        "Extensive or severe documented indicators warrant heightened scrutiny and review.",
      className:
        "border-red-500/30 bg-red-500/10 text-red-400",
    };
  }

  if (score >= 41) {
    return {
      label: "HIGH RISK",
      description:
        "Multiple significant indicators of concerning promotional behavior are documented.",
      className:
        "border-orange-500/30 bg-orange-500/10 text-orange-400",
    };
  }

  if (score >= 21) {
    return {
      label: "MODERATE RISK",
      description:
        "Some documented indicators warrant additional review or monitoring.",
      className:
        "border-amber-500/30 bg-amber-500/10 text-amber-400",
    };
  }

  return {
    label: "LOW RISK",
    description:
      "Limited documented indicators of concerning promotional behavior.",
    className:
      "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
  };
}

function getEvidenceConfidenceLevel(score: number) {
  if (score >= 13) {
    return {
      label: "VERY STRONG EVIDENCE",
      description:
        "Extensive, credible, and well-correlated evidence supports the assessment.",
      className:
        "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
    };
  }

  if (score >= 10) {
    return {
      label: "STRONG EVIDENCE",
      description:
        "Multiple credible and corroborating sources support the assessment.",
      className:
        "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
    };
  }

  if (score >= 7) {
    return {
      label: "MODERATE EVIDENCE",
      description:
        "Multiple relevant sources support some findings, with unresolved questions.",
      className:
        "border-amber-500/30 bg-amber-500/10 text-amber-400",
    };
  }

  if (score >= 4) {
    return {
      label: "LIMITED EVIDENCE",
      description:
        "Some relevant evidence exists, but significant gaps remain.",
      className:
        "border-amber-500/30 bg-amber-500/10 text-amber-400",
    };
  }

  return {
    label: "VERY LIMITED EVIDENCE",
    description:
      "Evidence is insufficient or largely unverified.",
    className:
      "border-red-500/30 bg-red-500/10 text-red-400",
  };
}

const promoterRiskLevel =
  getPromoterRiskLevel(promoterRiskScore);

const evidenceConfidenceScore =
  promoterScores["Evidence Strength"] || 0;

const evidenceConfidenceLevel =
  getEvidenceConfidenceLevel(evidenceConfidenceScore);

  const riskLevel = getRiskLevel(totalRiskScore);
async function loadRiskAssessment(caseId: string) {
  setLoadingAssessment(true);
  setAssessmentMessage("");

  try {
    const response = await fetch(
      `/api/blacklist/risk-assessment?case_id=${encodeURIComponent(
        caseId
      )}`
    );

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(
        result.error || "Unable to load risk assessment."
      );
    }

    const assessment = result.assessment;

    if (!assessment) {
      setScores({});
      setAssessmentNotes("");
      return;
    }

    setScores({
      "Contract & Token Controls":
        assessment.contract_token_controls ?? 0,

      "Holder Distribution":
        assessment.holder_distribution ?? 0,

      "Liquidity & Exit Risk":
        assessment.liquidity_exit_risk ?? 0,

      "Team & Transparency":
        assessment.team_transparency ?? 0,

      "Website & Infrastructure":
        assessment.website_infrastructure ?? 0,

      "Marketing & Promotion":
        assessment.marketing_promotion ?? 0,

      "Community Behavior":
        assessment.community_behavior ?? 0,

      "On-Chain Behavior":
        assessment.on_chain_behavior ?? 0,
    });

    setAssessmentNotes(
      assessment.assessment_notes ?? ""
    );
  } catch (error) {
    console.error("Risk assessment load error:", error);

    setAssessmentMessage(
      error instanceof Error
        ? error.message
        : "Unable to load risk assessment."
    );
  } finally {
    setLoadingAssessment(false);
  }
}
async function saveRiskAssessment() {
  if (!selectedCase) return;

  setSavingAssessment(true);
  setAssessmentMessage("");

  try {
    const response = await fetch(
      "/api/blacklist/risk-assessment",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          case_id: selectedCase.id,

          // Locked NovaGaia Risk Score V1.0
          overall_score: totalRiskScore,
          risk_band: riskLevel.label,

          contract_token_controls:
            scores["Contract & Token Controls"] || 0,

          holder_distribution:
            scores["Holder Distribution"] || 0,

          liquidity_exit_risk:
            scores["Liquidity & Exit Risk"] || 0,

          team_transparency:
            scores["Team & Transparency"] || 0,

          website_infrastructure:
            scores["Website & Infrastructure"] || 0,

          marketing_promotion:
            scores["Marketing & Promotion"] || 0,

          community_behavior:
            scores["Community Behavior"] || 0,

          on_chain_behavior:
            scores["On-Chain Behavior"] || 0,

          assessment_notes:
            assessmentNotes.trim() || null,
        }),
      }
    );

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(
        result.error || "Unable to save risk assessment."
      );
    }

    setAssessmentMessage(
      "Risk assessment saved successfully."
    );

    moveCaseToStage("review");
  } catch (error) {
    console.error("Risk assessment save error:", error);

    setAssessmentMessage(
      error instanceof Error
        ? error.message
        : "Unable to save risk assessment."
    );
  } finally {
    setSavingAssessment(false);
  }
}

async function savePromoterAssessment() {
  if (!selectedCase) return;

  setSavingPromoterAssessment(true);
  setPromoterAssessmentMessage("");

  try {
    const response = await fetch(
      "/api/blacklist/promoter-assessment",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          case_id: selectedCase.id,

          // Promoter Risk — 85 points
          promotion_history:
            promoterScores["Promotion History"] || 0,

          project_due_diligence:
            promoterScores["Project Due Diligence"] || 0,

          misleading_claims:
            promoterScores["Misleading Claims"] || 0,

          transparency_disclosure:
            promoterScores["Transparency & Disclosure"] || 0,

          promotion_pattern:
            promoterScores["Promotion Pattern"] || 0,

          financial_incentives:
            promoterScores["Financial Incentives"] || 0,

          community_conduct:
            promoterScores["Community Conduct"] || 0,

          promoter_risk_score:
            promoterRiskScore,

          promoter_risk_band:
            promoterRiskLevel.label,

          // Evidence Confidence — 15 points
          evidence_strength:
            promoterScores["Evidence Strength"] || 0,

          evidence_confidence_score:
            evidenceConfidenceScore,

          evidence_confidence_level:
            evidenceConfidenceLevel.label,

          assessment_notes:
            promoterAssessmentNotes.trim() || null,
        }),
      }
    );

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(
        result.error ||
          "Unable to save promoter assessment."
      );
    }

    setPromoterAssessmentMessage(
      "Promoter assessment saved successfully."
    );

    moveCaseToStage("review");
  } catch (error) {
    console.error(
      "Promoter assessment save error:",
      error
    );

    setPromoterAssessmentMessage(
      error instanceof Error
        ? error.message
        : "Unable to save promoter assessment."
    );
  } finally {
    setSavingPromoterAssessment(false);
  }
}

async function moveCaseToStage(stage: WorkflowStage) {
  console.log("MOVE CASE CLICKED:", {
    stage,
    selectedCaseId,
    casesCount: cases.length,
  });
  const currentCase = cases.find(
    (item) => item.id === selectedCaseId
  );

  if (!currentCase) return;

  // Do not allow a case to skip forward over workflow stages.
  // ...

  const currentIndex = getStageIndex(currentCase.stage);
  const targetIndex = getStageIndex(stage);

// Do not allow a case to skip forward over workflow stages.
//
// The Promoter Assessment is completed during the
// investigation stage, so Investigate → Review is valid.
// The Project/Token Risk Assessment follows the normal
// Investigate → Risk Assess → Review path.
const allowedTransitions: Record<
  WorkflowStage,
  WorkflowStage[]
> = {
  report: ["triage"],
  triage: ["investigate"],
  investigate: ["risk", "review"],
  risk: ["review"],
  review: ["publish", "investigate"],
  publish: ["response", "clear"],
  response: ["update"],
  update: ["clear"],
  clear: [],
};

const isAllowedTransition =
  stage === currentCase.stage ||
  allowedTransitions[currentCase.stage]?.includes(stage);

if (!isAllowedTransition) {
  console.log(
    "WORKFLOW BLOCKED:",
    {
      currentStage: currentCase.stage,
      currentIndex,
      targetStage: stage,
      targetIndex,
      selectedCaseId,
    }
  );

  return;
}

  const nextStatus =
  stage === "clear"
    ? "cleared"
    : stage === "update"
      ? "update"
      : stage === "response"
        ? "response"
        : stage === "publish"
          ? "published"
          : stage === "review"
            ? "review"
            : stage === "risk"
              ? "risk_assessment"
              : stage === "investigate"
                ? "investigating"
                : "triage";

    console.log(
  "MOVE CASE TO STAGE:",
  {
    stage,
    nextStatus,
    selectedCaseId,
  }
);

  // Update the UI immediately.
  setCases((currentCases) =>
  currentCases.map((item) => {
    if (item.id !== selectedCaseId) return item;

    return {
      ...item,
      stage,
      status:
        stage === "clear"
          ? "cleared"
          : stage === "publish"
            ? "published"
            : stage === "review"
              ? "under_review"
              : stage === "investigate"
                ? "under_review"
                : stage === "risk"
                  ? "under_review"
                  : "open",
    };
  })
);

  try {
    const response = await fetch("/api/cases", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        case_id: selectedCaseId,
        status: nextStatus,
        publication_checklist: publishChecklist,
      }),
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(
        result.error ||
          "Unable to save case workflow status."
      );
    }

    console.log(
      "Blacklist case workflow saved:",
      result.case
    );

    // Open the UI section only after the database update succeeds.
    if (stage === "risk") {
      setActiveTab("risk");
    } else if (stage === "review") {
      setActiveTab("review");
    } else if (stage === "publish") {
      setActiveTab("publish");
    } else if (stage === "triage") {
      setActiveTab("triage");
    } else if (
      stage === "investigate" ||
      stage === "report"
    ) {
      setActiveTab("cases");
    }

  } catch (error) {
    console.error(
      "Blacklist case workflow update error:",
      error
    );

    // Revert the UI if the database update failed.
    setCases((currentCases) =>
      currentCases.map((item) => {
        if (item.id !== selectedCaseId) return item;

        return currentCase;
      })
    );
  }
}

  function updateScore(category: string, value: number) {
    setScores((current) => ({
      ...current,
      [category]: value,
    }));

    setAssessmentMessage("");
  }

  function updatePromoterScore(
  category: string,
  value: number
) {
  setPromoterScores((current) => ({
    ...current,
    [category]: value,
  }));

  setPromoterAssessmentMessage("");
}

  function resetAssessment() {
    setScores({});
    setAssessmentNotes("");
    setAssessmentMessage("");
  }

  function resetPromoterAssessment() {
  setPromoterScores({});
  setPromoterAssessmentNotes("");
  setPromoterAssessmentMessage("");
}

  return (
  <main className="min-h-screen bg-slate-950 px-4 py-8 text-white sm:px-6 lg:px-8">
    <div className="mx-auto max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <div className="mb-2 flex flex-wrap items-center gap-3">
          <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-emerald-400">
            NovaGaia Intelligence
          </span>

          <span className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-xs text-slate-400">
            Private Investigator Area
          </span>
        </div>

        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Operation Blacklist
        </h1>

        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
          Structured threat investigation workflow for reviewing reports,
          evaluating evidence, calculating risk, and managing case outcomes.
        </p>
      </div>

      {/* Workflow */}
      <section className="mb-8 rounded-2xl border border-slate-800 bg-slate-900/70 p-4 shadow-xl sm:p-6">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">
              Investigation Workflow
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              Every case moves through a controlled investigation process.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
          {workflow.map((stage, index) => {
            const currentIndex = selectedCase
              ? getStageIndex(selectedCase.stage)
              : -1;

            const completed = index < currentIndex;
            const current = index === currentIndex;

            return (
              <button
                key={stage.key}
                type="button"
                onClick={() => moveCaseToStage(stage.key)}
                className={`rounded-xl border p-3 text-left transition ${
                  current
                    ? "border-emerald-500 bg-emerald-500/10"
                    : completed
                      ? "border-emerald-500/30 bg-emerald-500/5"
                      : "border-slate-800 bg-slate-950/60 hover:border-slate-700"
                }`}
              >
                <div className="mb-2 flex items-center gap-2">
                  <span
                    className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                      current || completed
                        ? "bg-emerald-500 text-slate-950"
                        : "bg-slate-800 text-slate-400"
                    }`}
                  >
                    {index + 1}
                  </span>

                  <span className="text-sm font-semibold">
                    {stage.label}
                  </span>
                </div>

                <p className="text-[11px] leading-4 text-slate-500">
                  {stage.description}
                </p>
              </button>
            );
          })}
        </div>
      </section>

      {/* Main layout */}
      <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
        {/* Incoming Threat Reports */}
        <section className="mb-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4 shadow-xl sm:p-5 lg:col-span-2">
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-semibold">
                Incoming Threat Reports
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                Public reports awaiting investigator triage.
              </p>
            </div>

            <span className="rounded-full border border-slate-700 bg-slate-950 px-3 py-1 text-xs text-slate-400">
              {loadingReports
                ? "Loading..."
                : `${reports.length} report${
                    reports.length === 1 ? "" : "s"
                  }`}
            </span>
          </div>

          {reportsError && (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">
              {reportsError}
            </div>
          )}

          {caseCreationMessage && (
            <div
              className={`mb-4 rounded-xl border px-4 py-3 text-sm ${
                caseCreationMessage.includes("successfully")
                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                  : "border-red-500/30 bg-red-500/10 text-red-400"
              }`}
            >
              {caseCreationMessage}
            </div>
          )}

          {!loadingReports &&
            !reportsError &&
            reports.length === 0 && (
              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-5 text-center">
                <p className="text-sm text-slate-400">
                  No threat reports are currently available for triage.
                </p>
              </div>
            )}

          <div className="space-y-3">
            {reports.map((report) => (
              <div
                key={report.id}
                className="rounded-xl border border-slate-800 bg-slate-950/70 p-4"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-semibold text-emerald-400">
                        Report #{report.report_number}
                      </span>

                      <span className="rounded-full border border-slate-700 bg-slate-900 px-2 py-1 text-[10px] uppercase text-slate-400">
                        {report.status}
                      </span>
                    </div>

                    <h3 className="mt-2 text-sm font-semibold text-white">
                      {report.project}
                    </h3>

                    <p className="mt-1 text-xs text-slate-500">
                      {report.threat_type}
                    </p>
                  </div>

                  <span className="text-xs text-slate-600">
                    {new Date(report.created_at).toLocaleDateString()}
                  </span>
                </div>

                <p className="mt-3 text-sm leading-6 text-slate-400">
                  {report.description}
                </p>

                {report.evidence && (
                  <p className="mt-2 text-xs text-slate-500">
                    Evidence:{" "}
                    <span className="text-slate-400">
                      {report.evidence}
                    </span>
                  </p>
                )}

                <div className="mt-4 flex justify-end">
                  <button
                    type="button"
                    onClick={() => createBlacklistCase(report)}
                    disabled={creatingCaseReportId === report.id}
                    className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-2 text-xs font-semibold text-emerald-400 transition hover:bg-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {creatingCaseReportId === report.id
                      ? "Creating Case..."
                      : "Create Blacklist Case"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Cases */}
        <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 shadow-xl">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="font-semibold">
                Cases
              </h2>

              <p className="text-xs text-slate-500">
                {filteredCases.length} case
                {filteredCases.length === 1 ? "" : "s"}
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search cases..."
              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm outline-none placeholder:text-slate-600 focus:border-emerald-500"
            />

            <select
              value={categoryFilter}
              onChange={(event) => setCategoryFilter(event.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-300 outline-none focus:border-emerald-500"
            >
              <option value="All">
                All threat types
              </option>

              <option value="Scam / Fraud">
                Scam / Fraud
              </option>

              <option value="Phishing">
                Phishing
              </option>

              <option value="Suspicious Token">
                Suspicious Token
              </option>

              <option value="Fake Project">
                Fake Project
              </option>

              <option value="Impersonation">
                Impersonation
              </option>

              <option value="Hacked / Compromised">
                Hacked / Compromised
              </option>

              <option value="Other">
                Other
              </option>
            </select>
          </div>

          <div className="mt-5 space-y-2">
            {filteredCases.map((item) => {
              const selected = item.id === selectedCaseId;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setSelectedCaseId(item.id);
                    setActiveTab("cases");

                    // Clear previous Project / Token assessment state.
                    setScores({});
                    setAssessmentNotes("");
                    setAssessmentMessage("");

                    // Clear previous Promoter assessment state.
                    setPromoterScores({});
                    setPromoterAssessmentNotes("");
                    setPromoterAssessmentMessage("");

                    // Reset assessment mode for the newly selected case.
                    setAssessmentType("project");
                  }}
                  className={`w-full rounded-xl border p-3 text-left transition ${
                    selected
                      ? "border-emerald-500/50 bg-emerald-500/10"
                      : "border-slate-800 bg-slate-950/40 hover:border-slate-700"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold text-emerald-400">
                        Case{" "}
                        {item.reportNumber
                          ? `NG-BL-${String(item.reportNumber).padStart(4, "0")}`
                          : "N/A"}
                      </p>

                      <p className="mt-1 text-sm font-semibold text-white">
                        {item.project}
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        {item.threatType}
                      </p>
                    </div>

                    <span className="rounded-full bg-slate-800 px-2 py-1 text-[10px] uppercase text-slate-400">
                      {item.stage}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* Case workspace */}
        <section className="rounded-2xl border border-slate-800 bg-slate-900/70 shadow-xl">
          {selectedCase ? (
            <>
              {/* Case header */}
              <div className="border-b border-slate-800 p-5 sm:p-6">
                <div className="flex flex-col justify-between gap-4 sm:flex-row">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
                      Case{" "}
                      {selectedCase.reportNumber
                        ? `NG-BL-${String(selectedCase.reportNumber).padStart(4, "0")}`
                        : "N/A"}
                    </p>

                    <h2 className="mt-1 text-2xl font-bold">
                      {selectedCase.project}
                    </h2>

                    <p className="mt-1 text-sm text-slate-400">
                      {selectedCase.threatType}
                    </p>
                  </div>

                  <div className="flex items-start gap-2">
                    <span className="rounded-full border border-slate-700 bg-slate-950 px-3 py-1 text-xs uppercase text-slate-400">
                      {selectedCase.status}
                    </span>

                    <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs uppercase text-emerald-400">
                      {selectedCase.stage}
                    </span>
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <div className="border-b border-slate-800">
                <div className="flex">
                  <button
                    type="button"
                    onClick={() => setActiveTab("cases")}
                    className={`px-5 py-4 text-sm font-semibold ${
                      activeTab === "cases"
                        ? "border-b-2 border-emerald-500 text-emerald-400"
                        : "text-slate-500"
                    }`}
                  >
                    Case Overview
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("triage")}
                    className={`px-5 py-4 text-sm font-semibold ${
                      activeTab === "triage"
                        ? "border-b-2 border-emerald-500 text-emerald-400"
                        : "text-slate-500"
                    }`}
                  >
                    📋 Triage
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab("investigate")}
                    className={`px-5 py-4 text-sm font-semibold ${
                      activeTab === "investigate"
                        ? "border-b-2 border-emerald-500 text-emerald-400"
                        : "text-slate-500"
                    }`}
                  >
                    🔎 Investigate
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("risk")}
                    className={`px-5 py-4 text-sm font-semibold ${
                      activeTab === "risk"
                        ? "border-b-2 border-emerald-500 text-emerald-400"
                        : "text-slate-500"
                    }`}
                  >
                    Risk Assess
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab("review")}
                    className={`px-5 py-4 text-sm font-semibold ${
                      activeTab === "review"
                        ? "border-b-2 border-emerald-500 text-emerald-400"
                        : "text-slate-500"
                    }`}
                  >
                    👥 Review
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab("publish")}
                    className={`px-5 py-4 text-sm font-semibold ${
                      activeTab === "publish"
                        ? "border-b-2 border-emerald-500 text-emerald-400"
                        : "text-slate-500"
                    }`}
                                    >
                    📰 Publish
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab("response")}
                    className={`px-5 py-4 text-sm font-semibold ${
                      activeTab === "response"
                        ? "border-b-2 border-emerald-500 text-emerald-400"
                        : "text-slate-500"
                    }`}
                  >
                    💬 Response
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab("update")}
                    className={`px-5 py-4 text-sm font-semibold ${
                      activeTab === "update"
                        ? "border-b-2 border-emerald-500 text-emerald-400"
                        : "text-slate-500"
                    }`}
                  >
                    🔄 Update
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab("clear")}
                    className={`px-5 py-4 text-sm font-semibold ${
                      activeTab === "clear"
                        ? "border-b-2 border-emerald-500 text-emerald-400"
                        : "text-slate-500"
                    }`}
                  >
                    ✓ Clear
                  </button>
                </div>
              </div>

              {/* Case Overview */}
              {activeTab === "cases" ? (
                <div className="space-y-6 p-5 sm:p-6">
                  <div>
                    <h3 className="text-sm font-semibold">
                      Case Description
                    </h3>

                    <p className="mt-2 rounded-xl border border-slate-800 bg-slate-950/60 p-4 text-sm leading-6 text-slate-400">
                      {selectedCase.description}
                    </p>
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => moveCaseToStage("triage")}
                      className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm font-semibold text-emerald-300 transition hover:bg-emerald-500/20"
                    >
                      📋 Move to Triage
                    </button>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold">
                      Investigation Stage
                    </h3>

                    <div className="mt-3 rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                      <p className="text-sm text-slate-300">
                        Current stage:{" "}
                        <span className="font-semibold text-emerald-400">
                          {
                            workflow.find(
                              (item) =>
                                item.key === selectedCase.stage
                            )?.label
                          }
                        </span>
                      </p>

                      <p className="mt-2 text-xs leading-5 text-slate-500">
                        Select a workflow stage above to move this case
                        through the investigation process.
                      </p>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold">
                      Investigation Actions
                    </h3>

                    <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      <button
                        type="button"
                        onClick={() => moveCaseToStage("triage")}
                        className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm font-semibold text-slate-300 transition hover:border-emerald-500/50 hover:text-white"
                      >
                        📋 Start Triage
                      </button>

                      <button
                        type="button"
                        onClick={() => moveCaseToStage("investigate")}
                        className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm font-semibold text-slate-300 transition hover:border-emerald-500/50 hover:text-white"
                      >
                        🔎 Investigate
                      </button>

                      {selectedCase?.stage === "investigate" && (
                        <button
                          type="button"
                          onClick={() => {
                            moveCaseToStage("risk");
                            setActiveTab("risk");
                          }}
                          className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm font-semibold text-emerald-400 transition hover:bg-emerald-500/20"
                        >
                          📊 Open Risk Assess
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => moveCaseToStage("review")}
                        className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm font-semibold text-slate-300 transition hover:border-emerald-500/50 hover:text-white"
                      >
                        👥 Review
                      </button>

                      <button
                        type="button"
                        onClick={() => moveCaseToStage("publish")}
                        className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm font-semibold text-slate-300 transition hover:border-emerald-500/50 hover:text-white"
                      >
                        📰 Publish
                      </button>

                      <button
                        type="button"
                        onClick={() => moveCaseToStage("response")}
                        className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm font-semibold text-slate-300 transition hover:border-emerald-500/50 hover:text-white"
                      >
                        💬 Response
                      </button>

                      <button
                        type="button"
                        onClick={() => moveCaseToStage("update")}
                        className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm font-semibold text-slate-300 transition hover:border-emerald-500/50 hover:text-white"
                      >
                        🔄 Update
                      </button>

                      <button
                        type="button"
                        onClick={() => moveCaseToStage("clear")}
                        className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm font-semibold text-slate-300 transition hover:border-emerald-500/50 hover:text-white"
                      >
                        ✓ Clear Case
                      </button>
                    </div>
                  </div>
                </div>
              ) : activeTab === "triage" ? (
                /* Triage */
                <div className="space-y-6 p-5 sm:p-6">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-amber-400">
                      Initial Case Screening
                    </p>

                    <h2 className="mt-2 text-2xl font-bold">
                      📋 Triage Case
                    </h2>

                    <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
                      Review the incoming case, confirm that it is within
                      NovaGaia&apos;s scope, check the available evidence,
                      and determine whether it should proceed to investigation.
                    </p>
                  </div>

                  {/* Case Intake */}
                  <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5">
                    <p className="text-xs font-semibold uppercase tracking-wider text-amber-400">
                      Case Intake
                    </p>

                    <h3 className="mt-2 text-xl font-bold">
                      Incoming Case Information
                    </h3>

                    <div className="mt-5 grid gap-4 md:grid-cols-2">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                          Case Number
                        </p>

                        <div className="mt-2 rounded-xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm text-slate-200">
                          {selectedCase?.reportNumber
                            ? `NG-${String(selectedCase.reportNumber).padStart(4, "0")}`
                            : "No case selected"}
                        </div>
                      </div>

                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                          Project / Subject
                        </p>

                        <div className="mt-2 rounded-xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm text-slate-200">
                          {selectedCase?.project || "No case selected"}
                        </div>
                      </div>

                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                          Threat Type
                        </p>

                        <div className="mt-2 rounded-xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm text-slate-200">
                          {selectedCase?.threatType || "Not specified"}
                        </div>
                      </div>

                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                          Source Report
                        </p>

                        <div className="mt-2 rounded-xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm text-slate-200">
                          {selectedCase?.reportId
                            ? "Linked threat report"
                            : "No linked report"}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Initial Screening */}
                  <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5">
                    <p className="text-xs font-semibold uppercase tracking-wider text-amber-400">
                      Initial Screening
                    </p>

                    <h3 className="mt-2 text-xl font-bold">
                      Screening Checklist
                    </h3>

                    <p className="mt-2 text-sm leading-6 text-slate-500">
                      Confirm the basic conditions before beginning a full
                      investigation.
                    </p>

                    <div className="mt-5 grid gap-4 md:grid-cols-2">
                      <label className="flex items-start gap-3 rounded-xl border border-slate-800 bg-slate-900/60 p-4">
                        <input
                          type="checkbox"
                          checked={triageAssessment?.subject_identified ?? false}
                          onChange={(event) => {
                            setTriageAssessment((current) => ({
                              ...(current ?? {
                                subject_identified: false,
                                within_scope: false,
                                sufficient_information: false,
                                duplicate_check_completed: false,
                                immediate_user_risk_identified: false,
                                contract_token_evidence: false,
                                website_social_links: false,
                                screenshots_documents: false,
                                on_chain_references: false,
                                evidence_quality: "",
                                triage_decision: "",
                                triage_notes: "",
                              }),
                              subject_identified: event.target.checked,
                            }));
                          }}
                          className="h-4 w-4"
                        />

                        <span>
                          <span className="block text-sm font-semibold text-slate-200">
                            Subject Identified
                          </span>

                          <span className="mt-1 block text-xs leading-5 text-slate-500">
                            The project, token, organization, team, or promoter
                            can be reasonably identified.
                          </span>
                        </span>
                      </label>

                      <label className="flex items-start gap-3 rounded-xl border border-slate-800 bg-slate-900/60 p-4">
                        <input
                          type="checkbox"
                          checked={triageAssessment?.within_scope ?? false}
                          onChange={(event) => {
                            setTriageAssessment((current) => ({
                              ...(current ?? {
                                subject_identified: false,
                                within_scope: false,
                                sufficient_information: false,
                                duplicate_check_completed: false,
                                immediate_user_risk_identified: false,
                                contract_token_evidence: false,
                                website_social_links: false,
                                screenshots_documents: false,
                                on_chain_references: false,
                                evidence_quality: "",
                                triage_decision: "",
                                triage_notes: "",
                              }),
                              within_scope: event.target.checked,
                            }));
                          }}
                          className="h-4 w-4"
                        />

                        <span>
                          <span className="block text-sm font-semibold text-slate-200">
                            Within NovaGaia Scope
                          </span>

                          <span className="mt-1 block text-xs leading-5 text-slate-500">
                            The reported issue falls within the scope of
                            Operation Blacklist.
                          </span>
                        </span>
                      </label>

                      <label className="flex items-start gap-3 rounded-xl border border-slate-800 bg-slate-900/60 p-4">
                        <input
                          type="checkbox"
                          checked={triageAssessment?.sufficient_information ?? false}
                          onChange={(event) => {
                            setTriageAssessment((current) => ({
                              ...(current ?? {
                                subject_identified: false,
                                within_scope: false,
                                sufficient_information: false,
                                duplicate_check_completed: false,
                                immediate_user_risk_identified: false,
                                contract_token_evidence: false,
                                website_social_links: false,
                                screenshots_documents: false,
                                on_chain_references: false,
                                evidence_quality: "",
                                triage_decision: "",
                                triage_notes: "",
                              }),
                              sufficient_information: event.target.checked,
                            }));
                          }}
                          className="h-4 w-4"
                        />

                        <span>
                          <span className="block text-sm font-semibold text-slate-200">
                            Sufficient Initial Information
                          </span>

                          <span className="mt-1 block text-xs leading-5 text-slate-500">
                            Enough information is available to begin an
                            investigation.
                          </span>
                        </span>
                      </label>

                      <label className="flex items-start gap-3 rounded-xl border border-slate-800 bg-slate-900/60 p-4">
                        <input
                          type="checkbox"
                          checked={triageAssessment?.duplicate_check_completed ?? false}
                          onChange={(event) => {
                            setTriageAssessment((current) => ({
                              ...(current ?? {
                                subject_identified: false,
                                within_scope: false,
                                sufficient_information: false,
                                duplicate_check_completed: false,
                                immediate_user_risk_identified: false,
                                contract_token_evidence: false,
                                website_social_links: false,
                                screenshots_documents: false,
                                on_chain_references: false,
                                evidence_quality: "",
                                triage_decision: "",
                                triage_notes: "",
                              }),
                              duplicate_check_completed: event.target.checked,
                            }));
                          }}
                          className="h-4 w-4"
                        />

                        <span>
                          <span className="block text-sm font-semibold text-slate-200">
                            Duplicate Check Completed
                          </span>

                          <span className="mt-1 block text-xs leading-5 text-slate-500">
                            No existing case appears to represent the same
                            matter.
                          </span>
                        </span>
                      </label>

                      <label className="flex items-start gap-3 rounded-xl border border-slate-800 bg-slate-900/60 p-4 md:col-span-2">
                        <input
                          type="checkbox"
                          checked={triageAssessment?.immediate_user_risk_identified ?? false}
                          onChange={(event) => {
                            setTriageAssessment((current) => ({
                              ...(current ?? {
                                subject_identified: false,
                                within_scope: false,
                                sufficient_information: false,
                                duplicate_check_completed: false,
                                immediate_user_risk_identified: false,
                                contract_token_evidence: false,
                                website_social_links: false,
                                screenshots_documents: false,
                                on_chain_references: false,
                                evidence_quality: "",
                                triage_decision: "",
                                triage_notes: "",
                              }),
                              immediate_user_risk_identified: event.target.checked,
                            }));
                          }}
                          className="h-4 w-4"
                        />

                        <span>
                          <span className="block text-sm font-semibold text-slate-200">
                            Immediate User Risk Identified
                          </span>

                          <span className="mt-1 block text-xs leading-5 text-slate-500">
                            Initial review indicates a potential immediate
                            risk requiring priority handling.
                          </span>
                        </span>
                      </label>
                    </div>
                  </div>

                  {/* Evidence Check */}
                  <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5">
                    <p className="text-xs font-semibold uppercase tracking-wider text-amber-400">
                      Evidence Check
                    </p>

                    <h3 className="mt-2 text-xl font-bold">
                      Available Evidence
                    </h3>

                    <p className="mt-2 text-sm leading-6 text-slate-500">
                      Record the evidence currently available at the triage
                      stage. Detailed verification will occur during
                      investigation.
                    </p>

                    <div className="mt-5 grid gap-4 md:grid-cols-2">
                      <label className="flex items-start gap-3 rounded-xl border border-slate-800 bg-slate-900/60 p-4">
                        <input
                          type="checkbox"
                          checked={triageAssessment?.contract_token_evidence ?? false}
                          onChange={(event) => {
                            setTriageAssessment((current) => ({
                              ...(current ?? {
                                subject_identified: false,
                                within_scope: false,
                                sufficient_information: false,
                                duplicate_check_completed: false,
                                immediate_user_risk_identified: false,
                                contract_token_evidence: false,
                                website_social_links: false,
                                screenshots_documents: false,
                                on_chain_references: false,
                                evidence_quality: "",
                                triage_decision: "",
                                triage_notes: "",
                              }),
                              contract_token_evidence: event.target.checked,
                            }));
                          }}
                          className="h-4 w-4"
                        />

                        <span>
                          <span className="block text-sm font-semibold text-slate-200">
                            Contract / Token Address
                          </span>

                          <span className="mt-1 block text-xs text-slate-500">
                            A contract or token address is available.
                          </span>
                        </span>
                      </label>

                      <label className="flex items-start gap-3 rounded-xl border border-slate-800 bg-slate-900/60 p-4">
                        <input
                          type="checkbox"
                          checked={triageAssessment?.website_social_links ?? false}
                          onChange={(event) => {
                            setTriageAssessment((current) => ({
                              ...(current ?? {
                                subject_identified: false,
                                within_scope: false,
                                sufficient_information: false,
                                duplicate_check_completed: false,
                                immediate_user_risk_identified: false,
                                contract_token_evidence: false,
                                website_social_links: false,
                                screenshots_documents: false,
                                on_chain_references: false,
                                evidence_quality: "",
                                triage_decision: "",
                                triage_notes: "",
                              }),
                              website_social_links: event.target.checked,
                            }));
                          }}
                          className="h-4 w-4"
                        />

                        <span>
                          <span className="block text-sm font-semibold text-slate-200">
                            Website / Social Links
                          </span>

                          <span className="mt-1 block text-xs text-slate-500">
                            Relevant project or promoter links are available.
                          </span>
                        </span>
                      </label>

                      <label className="flex items-start gap-3 rounded-xl border border-slate-800 bg-slate-900/60 p-4">
                      <input
                          type="checkbox"
                          checked={triageAssessment?.screenshots_documents ?? false}
                          onChange={(event) => {
                            setTriageAssessment((current) => ({
                              ...(current ?? {
                                subject_identified: false,
                                within_scope: false,
                                sufficient_information: false,
                                duplicate_check_completed: false,
                                immediate_user_risk_identified: false,
                                contract_token_evidence: false,
                                website_social_links: false,
                                screenshots_documents: false,
                                on_chain_references: false,
                                evidence_quality: "",
                                triage_decision: "",
                                triage_notes: "",
                              }),
                              screenshots_documents: event.target.checked,
                            }));
                          }}
                          className="h-4 w-4"
                        />

                        <span>
                          <span className="block text-sm font-semibold text-slate-200">
                            Screenshots / Documents
                          </span>

                          <span className="mt-1 block text-xs text-slate-500">
                            Supporting screenshots or documents were provided.
                          </span>
                        </span>
                      </label>

                      <label className="flex items-start gap-3 rounded-xl border border-slate-800 bg-slate-900/60 p-4">
                        <input
                          type="checkbox"
                          checked={triageAssessment?.on_chain_references ?? false}
                          onChange={(event) => {
                            setTriageAssessment((current) => ({
                              ...(current ?? {
                                subject_identified: false,
                                within_scope: false,
                                sufficient_information: false,
                                duplicate_check_completed: false,
                                immediate_user_risk_identified: false,
                                contract_token_evidence: false,
                                website_social_links: false,
                                screenshots_documents: false,
                                on_chain_references: false,
                                evidence_quality: "",
                                triage_decision: "",
                                triage_notes: "",
                              }),
                              on_chain_references: event.target.checked,
                            }));
                          }}
                          className="h-4 w-4"
                        />

                        <span>
                          <span className="block text-sm font-semibold text-slate-200">
                            On-Chain References
                          </span>

                          <span className="mt-1 block text-xs text-slate-500">
                            Transactions, wallets, contracts, or other
                            blockchain references are available.
                          </span>
                        </span>
                      </label>
                    </div>

                    <div className="mt-5">
                      <label className="text-sm font-semibold text-slate-300">
                        Initial Evidence Quality
                      </label>

                      <select
                        value={triageAssessment?.evidence_quality ?? ""}
                        onChange={(event) => {
                          setTriageAssessment((current) => ({
                            ...(current ?? {
                              subject_identified: false,
                              within_scope: false,
                              sufficient_information: false,
                              duplicate_check_completed: false,
                              immediate_user_risk_identified: false,
                              contract_token_evidence: false,
                              website_social_links: false,
                              screenshots_documents: false,
                              on_chain_references: false,
                              evidence_quality: "",
                              triage_decision: "",
                              triage_notes: "",
                            }),
                            evidence_quality: event.target.value,
                          }));
                        }}
                        className="mt-2 w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-amber-500"
                      >
                        <option value="" disabled>
                          Select evidence quality
                        </option>
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                      </select>
                    
                    </div>
                  </div>

                 <select
                    value={triageAssessment?.triage_decision ?? ""}
                    onChange={(event) => {
                      setTriageAssessment((current) => ({
                        ...(current ?? {
                          subject_identified: false,
                          within_scope: false,
                          sufficient_information: false,
                          duplicate_check_completed: false,
                          immediate_user_risk_identified: false,
                          contract_token_evidence: false,
                          website_social_links: false,
                          screenshots_documents: false,
                          on_chain_references: false,
                          evidence_quality: "",
                          triage_decision: "",
                          triage_notes: "",
                        }),
                        triage_decision: event.target.value,
                      }));
                    }}
                    className="mt-5 w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-amber-500"
                  >
                    <option value="" disabled>
                      Select triage decision
                    </option>

                    <option value="proceed_to_investigation">
                      Proceed to Investigation
                    </option>

                    <option value="more_information">
                      Request More Information
                    </option>

                    <option value="duplicate">
                      Duplicate / Merge
                    </option>

                    <option value="dismiss">
                      Dismiss
                    </option>

                    <option value="escalate">
                      Escalate
                    </option>
                  </select>

                  {/* Notes */}
                  <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5">
                    <p className="text-xs font-semibold uppercase tracking-wider text-amber-400">
                      Triage Notes
                    </p>

                    <h3 className="mt-2 text-xl font-bold">
                      Investigator Notes
                    </h3>

                    <textarea
                      rows={6}
                      value={triageAssessment?.triage_notes ?? ""}
                      onChange={(event) => {
                        setTriageAssessment((current) => ({
                          ...(current ?? {
                            subject_identified: false,
                            within_scope: false,
                            sufficient_information: false,
                            duplicate_check_completed: false,
                            immediate_user_risk_identified: false,
                            contract_token_evidence: false,
                            website_social_links: false,
                            screenshots_documents: false,
                            on_chain_references: false,
                            evidence_quality: "",
                            triage_decision: "",
                            triage_notes: "",
                          }),
                          triage_notes: event.target.value,
                        }));
                      }}
                      placeholder="Document the reasoning behind the triage decision..."
                      className="mt-5 w-full resize-y rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-amber-500"
                    />
                  </div>

                  {/* Actions */}
                  <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-5">
                    <p className="text-xs font-semibold uppercase tracking-wider text-amber-400">
                      Triage Actions
                    </p>

                    <h3 className="mt-2 text-xl font-bold">
                      Workflow Controls
                    </h3>

                    <p className="mt-2 text-sm leading-6 text-slate-500">
                      Save the current Triage assessment for this case.
                    </p>

                    <div className="mt-5 flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={saveTriageAssessment}
                        disabled={
                          savingTriage ||
                          loadingTriage ||
                          !selectedCaseId
                        }
                        className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm font-semibold text-emerald-300 transition hover:bg-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {savingTriage
                          ? "Saving Triage..."
                          : "💾 Save Triage"}
                      </button>

                      <button
                        type="button"
                        onClick={() => moveCaseToStage("investigate")}
                        className="rounded-xl bg-amber-500 px-5 py-3 text-sm font-bold text-slate-950 transition hover:bg-amber-400"
                      >
                        🔎 Start Investigation
                      </button>

                      <button
                        type="button"
                        disabled
                        className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-300 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        ✕ Dismiss Case
                      </button>
                    </div>
                  </div>
                </div>
              ) : activeTab === "investigate" ? (
                /* Investigate */
                <div className="space-y-6 p-5 sm:p-6">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-blue-400">
                      Evidence Investigation
                    </p>

                    <h2 className="mt-2 text-2xl font-bold">
                      🔎 Investigate Case
                    </h2>

                    <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
                      Conduct a structured investigation of the subject,
                      evidence, on-chain activity, team behavior, and
                      promotional activity before assigning a formal risk
                      assessment.
                    </p>
                  </div>

                  {/* Investigation Overview */}
                  <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5">
                    <p className="text-xs font-semibold uppercase tracking-wider text-blue-400">
                      Investigation Overview
                    </p>

                    <h3 className="mt-2 text-xl font-bold">
                      Case Information
                    </h3>

                    <div className="mt-5 grid gap-4 md:grid-cols-2">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                          Case Number
                        </p>

                        <div className="mt-2 rounded-xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm text-slate-200">
                          {selectedCase?.reportNumber
                            ? `NG-${String(selectedCase.reportNumber).padStart(4, "0")}`
                            : "No case selected"}
                        </div>
                      </div>

                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                          Project / Subject
                        </p>

                        <div className="mt-2 rounded-xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm text-slate-200">
                          {selectedCase?.project || "No case selected"}
                        </div>
                      </div>

                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                          Threat Type
                        </p>

                        <div className="mt-2 rounded-xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm text-slate-200">
                          {selectedCase?.threatType || "Not specified"}
                        </div>
                      </div>

                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                          Investigation Status
                        </p>

                        <div className="mt-2 rounded-xl border border-blue-500/20 bg-blue-500/5 px-4 py-3 text-sm font-semibold text-blue-300">
                          Investigation in progress
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Subject Investigation */}
                  <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5">
                    <p className="text-xs font-semibold uppercase tracking-wider text-blue-400">
                      Subject Investigation
                    </p>

                    <h3 className="mt-2 text-xl font-bold">
                      Project / Team Review
                    </h3>

                    <div className="mt-5 grid gap-4 md:grid-cols-2">
                      <label className="flex items-start gap-3 rounded-xl border border-slate-800 bg-slate-900/60 p-4">
                        <input
                          type="checkbox"
                          checked={
                            investigationAssessment?.subject_identity_confirmed ??
                            false
                          }
                          onChange={(event) => {
                            setInvestigationAssessment((current) => ({
                              ...(current ?? {
                                subject_identity_confirmed: false,
                                subject_background_reviewed: false,
                                project_history_reviewed: false,
                                team_activity_reviewed: false,
                                contract_reviewed: false,
                                tokenomics_reviewed: false,
                                liquidity_reviewed: false,
                                on_chain_activity_reviewed: false,
                                preliminary_findings: "",
                                investigator_notes: "",
                                investigation_decision: "",
                              }),
                              subject_identity_confirmed: event.target.checked,
                            }));
                          }}
                          className="mt-1 h-4 w-4 rounded border-slate-700 bg-slate-950"
                        />

                        <span>
                          <span className="block text-sm font-semibold text-slate-200">
                            Project Identity Reviewed
                          </span>

                          <span className="mt-1 block text-xs leading-5 text-slate-500">
                            Project name, token identity, official accounts,
                            and related identifiers have been reviewed.
                          </span>
                        </span>
                      </label>

                      <label className="flex items-start gap-3 rounded-xl border border-slate-800 bg-slate-900/60 p-4">
                        <input
                          type="checkbox"
                          checked={
                            investigationAssessment?.subject_background_reviewed ??
                            false
                          }
                          onChange={(event) => {
                            setInvestigationAssessment((current) => ({
                              ...(current ?? {
                                subject_identity_confirmed: false,
                                subject_background_reviewed: false,
                                project_history_reviewed: false,
                                team_activity_reviewed: false,
                                contract_reviewed: false,
                                tokenomics_reviewed: false,
                                liquidity_reviewed: false,
                                on_chain_activity_reviewed: false,
                                preliminary_findings: "",
                                investigator_notes: "",
                                investigation_decision: "",
                              }),
                              subject_background_reviewed: event.target.checked,
                            }));
                          }}
                          className="mt-1 h-4 w-4 rounded border-slate-700 bg-slate-950"
                        />

                        <span>
                          <span className="block text-sm font-semibold text-slate-200">
                            Team / Operator Information Reviewed
                          </span>

                          <span className="mt-1 block text-xs leading-5 text-slate-500">
                            Available information about team members,
                            operators, developers, or promoters has been
                            examined.
                          </span>
                        </span>
                      </label>

                      <label className="flex items-start gap-3 rounded-xl border border-slate-800 bg-slate-900/60 p-4">
                        <input
                          type="checkbox"
                          checked={
                            investigationAssessment?.project_history_reviewed ??
                            false
                          }
                          onChange={(event) => {
                            setInvestigationAssessment((current) => ({
                              ...(current ?? {
                                subject_identity_confirmed: false,
                                subject_background_reviewed: false,
                                project_history_reviewed: false,
                                team_activity_reviewed: false,
                                contract_reviewed: false,
                                tokenomics_reviewed: false,
                                liquidity_reviewed: false,
                                on_chain_activity_reviewed: false,
                                preliminary_findings: "",
                                investigator_notes: "",
                                investigation_decision: "",
                              }),
                              project_history_reviewed: event.target.checked,
                            }));
                          }}
                          className="mt-1 h-4 w-4 rounded border-slate-700 bg-slate-950"
                        />

                        <span>
                          <span className="block text-sm font-semibold text-slate-200">
                            Website / Infrastructure Reviewed
                          </span>

                          <span className="mt-1 block text-xs leading-5 text-slate-500">
                            Official websites, domains, documentation, and
                            related infrastructure have been reviewed.
                          </span>
                        </span>
                      </label>

                      <label className="flex items-start gap-3 rounded-xl border border-slate-800 bg-slate-900/60 p-4">
                        <input
                          type="checkbox"
                          checked={
                            investigationAssessment?.team_activity_reviewed ??
                            false
                          }
                          onChange={(event) => {
                            setInvestigationAssessment((current) => ({
                              ...(current ?? {
                                subject_identity_confirmed: false,
                                subject_background_reviewed: false,
                                project_history_reviewed: false,
                                team_activity_reviewed: false,
                                contract_reviewed: false,
                                tokenomics_reviewed: false,
                                liquidity_reviewed: false,
                                on_chain_activity_reviewed: false,
                                preliminary_findings: "",
                                investigator_notes: "",
                                investigation_decision: "",
                              }),
                              team_activity_reviewed: event.target.checked,
                            }));
                          }}
                          className="mt-1 h-4 w-4 rounded border-slate-700 bg-slate-950"
                        />

                        <span>
                          <span className="block text-sm font-semibold text-slate-200">
                            Public Statements Reviewed
                          </span>

                          <span className="mt-1 block text-xs leading-5 text-slate-500">
                            Public claims, announcements, disclosures, and
                            statements have been reviewed.
                          </span>
                        </span>
                      </label>
                    </div>
                  </div>

                  {/* Evidence Investigation */}
                  <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5">
                    <p className="text-xs font-semibold uppercase tracking-wider text-blue-400">
                      Evidence Investigation
                    </p>

                    <h3 className="mt-2 text-xl font-bold">
                      Evidence Verification
                    </h3>

                    <p className="mt-2 text-sm leading-6 text-slate-500">
                      Review and verify the evidence collected during triage.
                      Detailed evidence records will be connected to the
                      investigation system later.
                    </p>

                    <div className="mt-5 grid gap-4 md:grid-cols-2">
                      <label className="flex items-start gap-3 rounded-xl border border-slate-800 bg-slate-900/60 p-4">
                        <input
                          type="checkbox"
                          checked={
                            investigationAssessment?.contract_reviewed ??
                            false
                          }
                          onChange={(event) => {
                            setInvestigationAssessment((current) => ({
                              ...(current ?? {
                                subject_identity_confirmed: false,
                                subject_background_reviewed: false,
                                project_history_reviewed: false,
                                team_activity_reviewed: false,
                                contract_reviewed: false,
                                tokenomics_reviewed: false,
                                liquidity_reviewed: false,
                                on_chain_activity_reviewed: false,
                                preliminary_findings: "",
                                investigator_notes: "",
                                investigation_decision: "",
                              }),
                              contract_reviewed: event.target.checked,
                            }));
                          }}
                          className="mt-1 h-4 w-4 rounded border-slate-700 bg-slate-950"
                        />

                        <span>
                          <span className="block text-sm font-semibold text-slate-200">
                            Contract / Token Evidence Reviewed
                          </span>

                          <span className="mt-1 block text-xs text-slate-500">
                            Contract addresses, token information, and relevant
                            blockchain records have been reviewed.
                          </span>
                        </span>
                      </label>

                      <label className="flex items-start gap-3 rounded-xl border border-slate-800 bg-slate-900/60 p-4">
                        <input
                          type="checkbox"
                          checked={
                            investigationAssessment?.on_chain_activity_reviewed ??
                            false
                          }
                          onChange={(event) => {
                            setInvestigationAssessment((current) => ({
                              ...(current ?? {
                                subject_identity_confirmed: false,
                                subject_background_reviewed: false,
                                project_history_reviewed: false,
                                team_activity_reviewed: false,
                                contract_reviewed: false,
                                tokenomics_reviewed: false,
                                liquidity_reviewed: false,
                                on_chain_activity_reviewed: false,
                                preliminary_findings: "",
                                investigator_notes: "",
                                investigation_decision: "",
                              }),
                              on_chain_activity_reviewed: event.target.checked,
                            }));
                          }}
                          className="mt-1 h-4 w-4 rounded border-slate-700 bg-slate-950"
                        />

                        <span>
                          <span className="block text-sm font-semibold text-slate-200">
                            On-Chain Activity Reviewed
                          </span>

                          <span className="mt-1 block text-xs text-slate-500">
                            Relevant wallets, transactions, holders, and
                            blockchain activity have been examined.
                          </span>
                        </span>
                      </label>

                      <label className="flex items-start gap-3 rounded-xl border border-slate-800 bg-slate-900/60 p-4">
                        <input
                          type="checkbox"
                          checked={
                            investigationAssessment?.liquidity_reviewed ??
                            false
                          }
                          onChange={(event) => {
                            setInvestigationAssessment((current) => ({
                              ...(current ?? {
                                subject_identity_confirmed: false,
                                subject_background_reviewed: false,
                                project_history_reviewed: false,
                                team_activity_reviewed: false,
                                contract_reviewed: false,
                                tokenomics_reviewed: false,
                                liquidity_reviewed: false,
                                on_chain_activity_reviewed: false,
                                preliminary_findings: "",
                                investigator_notes: "",
                                investigation_decision: "",
                              }),
                              liquidity_reviewed: event.target.checked,
                            }));
                          }}
                          className="mt-1 h-4 w-4 rounded border-slate-700 bg-slate-950"
                        />

                        <span>
                          <span className="block text-sm font-semibold text-slate-200">
                            Liquidity / Market Activity Reviewed
                          </span>

                          <span className="mt-1 block text-xs text-slate-500">
                            Liquidity, trading activity, market behavior, and
                            relevant movements have been examined.
                          </span>
                        </span>
                      </label>

                      <label className="flex items-start gap-3 rounded-xl border border-slate-800 bg-slate-900/60 p-4">
                        <input
                          type="checkbox"
                          checked={
                            investigationAssessment?.tokenomics_reviewed ??
                            false
                          }
                          onChange={(event) => {
                            setInvestigationAssessment((current) => ({
                              ...(current ?? {
                                subject_identity_confirmed: false,
                                subject_background_reviewed: false,
                                project_history_reviewed: false,
                                team_activity_reviewed: false,
                                contract_reviewed: false,
                                tokenomics_reviewed: false,
                                liquidity_reviewed: false,
                                on_chain_activity_reviewed: false,
                                preliminary_findings: "",
                                investigator_notes: "",
                                investigation_decision: "",
                              }),
                              tokenomics_reviewed: event.target.checked,
                            }));
                          }}
                          className="mt-1 h-4 w-4 rounded border-slate-700 bg-slate-950"
                        />

                        <span>
                          <span className="block text-sm font-semibold text-slate-200">
                            Tokenomics / Promotional Activity Reviewed
                          </span>

                          <span className="mt-1 block text-xs text-slate-500">
                            Marketing claims, influencer activity, promotion
                            patterns, and disclosures have been examined.
                          </span>
                        </span>
                      </label>
                    </div>
                  </div>

                  {/* Findings */}
                  <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5">
                    <p className="text-xs font-semibold uppercase tracking-wider text-blue-400">
                      Investigation Findings
                    </p>

                    <h3 className="mt-2 text-xl font-bold">
                      Preliminary Findings
                    </h3>

                    <textarea
                      rows={7}
                      value={investigationAssessment?.preliminary_findings ?? ""}
                      onChange={(event) => {
                        setInvestigationAssessment((current) => ({
                          ...(current ?? {
                            subject_identity_confirmed: false,
                            subject_background_reviewed: false,
                            project_history_reviewed: false,
                            team_activity_reviewed: false,
                            contract_reviewed: false,
                            tokenomics_reviewed: false,
                            liquidity_reviewed: false,
                            on_chain_activity_reviewed: false,
                            preliminary_findings: "",
                            investigator_notes: "",
                            investigation_decision: "",
                          }),
                          preliminary_findings: event.target.value,
                        }));
                      }}
                      placeholder="Document the evidence reviewed, significant findings, contradictions, unresolved questions, and other investigation observations..."
                      className="mt-5 w-full resize-y rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-blue-500"
                    />
                  </div>

                  {/* Investigator Notes */}
                  <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5">
                    <p className="text-xs font-semibold uppercase tracking-wider text-blue-400">
                      Investigator Notes
                    </p>

                    <h3 className="mt-2 text-xl font-bold">
                      Internal Investigation Notes
                    </h3>

                  <textarea
                    rows={6}
                    value={investigationAssessment?.investigator_notes ?? ""}
                    onChange={(event) => {
                      setInvestigationAssessment((current) => ({
                        ...(current ?? {
                          subject_identity_confirmed: false,
                          subject_background_reviewed: false,
                          project_history_reviewed: false,
                          team_activity_reviewed: false,
                          contract_reviewed: false,
                          tokenomics_reviewed: false,
                          liquidity_reviewed: false,
                          on_chain_activity_reviewed: false,
                          preliminary_findings: "",
                          investigator_notes: "",
                          investigation_decision: "",
                        }),
                        investigator_notes: event.target.value,
                      }));
                    }}
                    placeholder="Record internal notes, follow-up questions, source references, and investigation decisions..."
                    className="mt-5 w-full resize-y rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-blue-500"
                     />
                   </div>

                   {/* Investigation Decision */}
                   <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5">
                    <p className="text-xs font-semibold uppercase tracking-wider text-blue-400">
                      Investigation Decision
                    </p>

                    <h3 className="mt-2 text-xl font-bold">
                      Determine Next Stage
                    </h3>

                    <select
                      defaultValue=""
                      className="mt-5 w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-blue-500"
                    >
                      <option value="" disabled>
                        Select investigation decision
                      </option>

                      <option value="risk_assessment">
                        Proceed to Risk Assessment
                      </option>

                      <option value="additional_investigation">
                        Continue Investigation
                      </option>

                      <option value="request_information">
                        Request Additional Information
                      </option>

                      <option value="return_triage">
                        Return to Triage
                      </option>
                    </select>
                  </div>

                  {/* Actions */}
                  <div className="rounded-2xl border border-blue-500/20 bg-blue-500/5 p-5">
                    <p className="text-xs font-semibold uppercase tracking-wider text-blue-400">
                      Investigation Actions
                    </p>

                    <h3 className="mt-2 text-xl font-bold">
                      Workflow Controls
                    </h3>

                    <p className="mt-2 text-sm leading-6 text-slate-500">
                      Investigation persistence will be connected after the
                      interface has been verified.
                    </p>

                    <div className="mt-5 flex flex-wrap gap-3">
                      <button
                        type="button"
                        disabled
                        className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm font-semibold text-slate-500 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        💾 Save Investigation
                      </button>

                      <button
                        type="button"
                        onClick={() => moveCaseToStage("risk")}
                        className="rounded-xl bg-blue-500 px-5 py-3 text-sm font-bold text-slate-950 transition hover:bg-blue-400"
                      >
                        ⚖️ Continue to Risk Assessment
                      </button>

                      <button
                        type="button"
                        onClick={() => setActiveTab("triage")}
                        className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm font-semibold text-slate-300 transition hover:border-slate-600 hover:bg-slate-900"
                      >
                        ← Return to Triage
                      </button>
                    </div>
                  </div>
                </div>
              ) : activeTab === "review" ? (
                /* Review */
                <div className="space-y-6 p-5 sm:p-6">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
                      Final Investigator Review
                    </p>

                    <h2 className="mt-2 text-2xl font-bold text-white">
                      Review Case
                    </h2>

                    <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
                      Review the investigation findings, risk assessment,
                      evidence, and case information before deciding whether
                      the case is ready for publication.
                    </p>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5">
                      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Case
                      </p>

                      <p className="mt-2 text-lg font-bold text-white">
                        {selectedCase
                          ? `NG-BL-${String(
                              selectedCase.reportNumber ?? ""
                            ).padStart(4, "0")}`
                          : "No case selected"}
                      </p>

                      <p className="mt-1 text-sm text-slate-400">
                        {selectedCase?.project ?? "—"}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5">
                      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Current Stage
                      </p>

                      <p className="mt-2 text-lg font-bold text-emerald-400">
                        {selectedCase?.stage === "review"
                          ? "Final Investigator Review"
                          : selectedCase?.stage ?? "—"}
                      </p>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Case Description
                    </p>

                    <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-300">
                      {selectedCase?.description ||
                        "No case description available."}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5">
                    <p className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
                      Review Checklist
                    </p>

                    <div className="mt-4 space-y-3 text-sm text-slate-300">
                      <label className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-slate-700 bg-slate-950"
                        />
                        Investigation findings reviewed
                      </label>

                      <label className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-slate-700 bg-slate-950"
                        />
                        Risk assessment reviewed
                      </label>

                      <label className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-slate-700 bg-slate-950"
                        />
                        Evidence reviewed
                      </label>

                      <label className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-slate-700 bg-slate-950"
                        />
                        Case information is ready for publication decision
                      </label>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Review Decision
                    </p>

                    <h3 className="mt-2 text-lg font-bold text-white">
                      Investigator Decision
                    </h3>

                    <p className="mt-2 text-sm leading-6 text-slate-400">
                      Confirm that the case has completed the investigator
                      review before proceeding to the publication stage.
                    </p>

                    <div className="mt-4 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
                      <p className="text-sm leading-6 text-amber-300/80">
                        Approval for publication should only be selected after
                        the investigation findings, evidence, and risk
                        assessment have been reviewed.
                      </p>
                    </div>

                    <label className="mt-5 flex items-start gap-3 text-sm text-slate-300">
                      <input
                        type="checkbox"
                        checked={reviewConfirmed}
                        onChange={(event) =>
                          setReviewConfirmed(event.target.checked)
                        }
                        className="mt-0.5 h-4 w-4 rounded border-slate-700 bg-slate-950"
                      />

                      <span>
                        I confirm that I have reviewed the available case
                        evidence, investigation findings, and risk assessment
                        and that this case is ready for the publication
                        decision.
                      </span>
                    </label>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setReviewConfirmed(false);
                        moveCaseToStage("investigate");
                      }}
                      className="rounded-xl border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-sm font-semibold text-amber-300 transition hover:border-amber-400/60 hover:bg-amber-500/10 hover:text-amber-200"
                    >
                      ↩️ Return to Investigation
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        if (!reviewConfirmed) {
                          return;
                        }

                        moveCaseToStage("publish");
                      }}
                      disabled={!reviewConfirmed}
                      className="rounded-xl bg-emerald-500 px-5 py-3 text-sm font-bold text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-emerald-500"
                    >
                      📰 Approve for Publish
                    </button>
                  </div>
                </div>
              ) : activeTab === "publish" ? (
                /* Publish */
                <div className="space-y-6 p-5 sm:p-6">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
                      Publication Stage
                    </p>

                    <h2 className="mt-2 text-2xl font-bold text-white">
                      Publish Case
                    </h2>

                    <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
                      The case has completed investigator review and is now
                      ready for publication. Review the case information below
                      before publishing the confirmed threat intelligence.
                    </p>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5">
                      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Case
                      </p>

                      <p className="mt-2 text-lg font-bold text-white">
                        {selectedCase
                          ? `NG-BL-${String(
                              selectedCase.reportNumber ?? ""
                            ).padStart(4, "0")}`
                          : "No case selected"}
                      </p>

                      <p className="mt-1 text-sm text-slate-400">
                        {selectedCase?.project ?? "—"}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5">
                      <p className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
                        Publication Status
                      </p>

                      <p className="mt-2 text-lg font-bold text-emerald-400">
                        Ready for Publication
                      </p>

                      <p className="mt-1 text-sm text-slate-400">
                        Investigator review completed
                      </p>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Case Description
                    </p>

                    <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-300">
                      {selectedCase?.description ||
                        "No case description available."}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5">
                    <p className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
                      Publication Checklist
                    </p>

                    <div className="mt-4 space-y-3 text-sm text-slate-300">
                      <label className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={publishChecklist.caseReview}
                          onChange={(event) =>
                            setPublishChecklist((current) => ({
                              ...current,
                              caseReview: event.target.checked,
                            }))
                          }
                          className="h-4 w-4 rounded border-slate-700 bg-slate-950"
                        />
                        Case review has been completed
                      </label>

                      <label className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={publishChecklist.evidenceReviewed}
                          onChange={(event) =>
                            setPublishChecklist((current) => ({
                              ...current,
                              evidenceReviewed: event.target.checked,
                            }))
                          }
                          className="h-4 w-4 rounded border-slate-700 bg-slate-950"
                        />
                        Evidence supporting the case has been reviewed
                      </label>

                      <label className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={
                            publishChecklist.riskAssessmentReviewed
                          }
                          onChange={(event) =>
                            setPublishChecklist((current) => ({
                              ...current,
                              riskAssessmentReviewed: event.target.checked,
                            }))
                          }
                          className="h-4 w-4 rounded border-slate-700 bg-slate-950"
                        />
                        Risk assessment has been reviewed
                      </label>

                      <label className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={
                            publishChecklist.publicDisclosureReady
                          }
                          onChange={(event) =>
                            setPublishChecklist((current) => ({
                              ...current,
                              publicDisclosureReady:
                                event.target.checked,
                            }))
                          }
                          className="h-4 w-4 rounded border-slate-700 bg-slate-950"
                        />
                        Case information is ready for public disclosure
                      </label>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-5">
                    <p className="text-xs font-semibold uppercase tracking-wider text-amber-300">
                      Publication Notice
                    </p>

                    <p className="mt-3 text-sm leading-6 text-amber-200/80">
                      Publishing this case will mark the Blacklist case as
                      published. Published case information may be used as part
                      of NovaGaia threat intelligence and public scam awareness
                      resources.
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => setActiveTab("review")}
                      className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm font-semibold text-slate-300 transition hover:border-emerald-500/50 hover:text-white"
                    >
                      ↩️ Back to Review
                    </button>

                    <button
                      type="button"
                      onClick={async () => {
                        if (!selectedCaseId) return;

                        try {
                          const response = await fetch("/api/cases", {
                            method: "PATCH",
                            headers: {
                              "Content-Type": "application/json",
                            },
                            body: JSON.stringify({
                              case_id: selectedCaseId,
                              status:
                                selectedCase?.stage === "triage"
                                  ? "triage"
                                  : selectedCase?.stage === "investigate"
                                    ? "investigating"
                                    : selectedCase?.stage === "risk"
                                      ? "risk_assessment"
                                      : selectedCase?.stage === "review"
                                        ? "review"
                                        : selectedCase?.stage === "publish"
                                          ? "published"
                                          : selectedCase?.stage === "clear"
                                            ? "cleared"
                                            : "triage",
                              publication_checklist: publishChecklist,
                            }),
                          });

                          const result = await response.json();

                          if (!response.ok || !result.success) {
                            throw new Error(
                              result.error ||
                                "Unable to save publication checklist."
                            );
                          }

                          setCases((currentCases) =>
                            currentCases.map((item) =>
                              item.id === selectedCaseId
                                ? {
                                    ...item,
                                    publicationChecklist: publishChecklist,
                                  }
                                : item
                            )
                          );
                        } catch (error) {
                          console.error(
                            "Save publication checklist error:",
                            error
                          );
                        }
                      }}
                      className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-5 py-3 text-sm font-bold text-emerald-300 transition hover:bg-emerald-500/20"
                    >
                      💾 Save Checklist
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        if (!publishChecklistComplete) {
                          return;
                        }

                        moveCaseToStage("response");
                      }}
                      disabled={!publishChecklistComplete}
                      className="rounded-xl bg-emerald-500 px-5 py-3 text-sm font-bold text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-emerald-500"
                    >
                      📰 Publish Case
                    </button>
                  </div>
                </div>
                            ) : activeTab === "response" ? (
                /* Response */
                <div className="space-y-6 p-5 sm:p-6">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
                      Investigation Subject Response
                    </p>

                    <h2 className="mt-2 text-2xl font-bold text-white">
                      Subject Response
                    </h2>

                    <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
                      Provide the token, organization, team, or promoter under
                      investigation an opportunity to respond to the findings.
                      Record their explanation, clarification, supporting evidence,
                      or dispute regarding the investigation.
                    </p>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5">
                      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Case
                      </p>

                      <p className="mt-2 text-lg font-bold text-white">
                        {selectedCase
                          ? `NG-BL-${String(
                              selectedCase.reportNumber ?? ""
                            ).padStart(4, "0")}`
                          : "No case selected"}
                      </p>

                      <p className="mt-1 text-sm text-slate-400">
                        {selectedCase?.project ?? "—"}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5">
                      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Publication Status
                      </p>

                      <p className="mt-2 text-lg font-bold text-emerald-400">
                        Published
                      </p>

                      <p className="mt-1 text-sm text-slate-400">
                        The case is now in the post-publication response stage.
                      </p>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5">
                    <div>
                     <p className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
                      Subject Response Record
                    </p>

                    <h3 className="mt-2 text-xl font-bold text-white">
                      Document the Subject's Response
                    </h3>

                    <p className="mt-2 text-sm leading-6 text-slate-500">
                      Record the response provided by the token, organization,
                      team, or promoter under investigation, including any
                      explanation, clarification, supporting evidence, or dispute.
                    </p>
                    </div>

                    <div className="mt-5 space-y-4">
                      <div>
                        <label className="text-sm font-semibold text-slate-300">
                          Response Type
                        </label>

                        <select
                          defaultValue=""
                          className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-emerald-500"
                        >
                          <option value="" disabled>
                            Select response type
                          </option>
                         <option value="project_statement">
                          Project / Organization Statement
                        </option>
                        <option value="team_explanation">
                          Team Explanation
                        </option>
                        <option value="promoter_response">
                          Promoter Response
                        </option>
                        <option value="supporting_evidence">
                          Supporting Evidence
                        </option>
                        <option value="dispute">
                          Dispute / Challenge
                        </option>
                        <option value="clarification">
                          Clarification
                        </option>
                        <option value="other">
                          Other
                        </option>
                        </select>
                      </div>

                      <div>
                        <label className="text-sm font-semibold text-slate-300">
                          Response Details
                        </label>

                        <textarea
                          defaultValue=""
                          rows={6}
                          placeholder="Document the response, communication, action taken, or outcome..."
                          className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white placeholder:text-slate-600 outline-none transition focus:border-emerald-500"
                        />
                      </div>

                      <div>
                        <label className="text-sm font-semibold text-slate-300">
                          Internal Investigator Notes
                        </label>

                        <textarea
                          defaultValue=""
                          rows={4}
                          placeholder="Add internal notes about the response..."
                          className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white placeholder:text-slate-600 outline-none transition focus:border-emerald-500"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3 border-t border-slate-800 pt-5">
                    <button
                      type="button"
                      disabled
                      className="rounded-xl border border-slate-700 bg-slate-950 px-5 py-3 text-sm font-semibold text-slate-500 disabled:cursor-not-allowed"
                    >
                      💾 Save Response
                    </button>

                    <button
                      type="button"
                      disabled
                      className="rounded-xl border border-slate-700 bg-slate-950 px-5 py-3 text-sm font-semibold text-slate-500 disabled:cursor-not-allowed"
                    >
                      🔄 Continue to Update
                    </button>
                  </div>
                </div>
                            ) : activeTab === "update" ? (
                /* Update */
                <div className="space-y-6 p-5 sm:p-6">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
                      Case Maintenance
                    </p>

                    <h2 className="mt-2 text-2xl font-bold text-white">
                      Update Case
                    </h2>

                    <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
                      Record new information, developments, or changes related
                      to this published case. Updates should preserve the
                      original investigation record while documenting new
                      findings.
                    </p>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5">
                      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Case
                      </p>

                      <p className="mt-2 text-lg font-bold text-white">
                        {selectedCase
                          ? `NG-BL-${String(
                              selectedCase.reportNumber ?? ""
                            ).padStart(4, "0")}`
                          : "No case selected"}
                      </p>

                      <p className="mt-1 text-sm text-slate-400">
                        {selectedCase?.project ?? "—"}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5">
                      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Current Status
                      </p>

                      <p className="mt-2 text-lg font-bold text-emerald-400">
                        Published
                      </p>

                      <p className="mt-1 text-sm text-slate-400">
                        Record any new information or developments affecting
                        this case.
                      </p>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
                        Update Record
                      </p>

                      <h3 className="mt-2 text-xl font-bold text-white">
                        Document Case Update
                      </h3>

                      <p className="mt-2 text-sm leading-6 text-slate-500">
                        Record the type of update and explain what has changed
                        since the case was published.
                      </p>
                    </div>

                    <div className="mt-5 space-y-4">
                      <div>
                        <label className="text-sm font-semibold text-slate-300">
                          Update Type
                        </label>

                        <select
                          defaultValue=""
                          className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-emerald-500"
                        >
                          <option value="" disabled>
                            Select update type
                          </option>
                          <option value="new_evidence">
                            New Evidence
                          </option>
                          <option value="project_response">
                            Project / Team Response
                          </option>
                          <option value="platform_action">
                            Platform Action
                          </option>
                          <option value="community_update">
                            Community Update
                          </option>
                          <option value="risk_change">
                            Risk Assessment Change
                          </option>
                          <option value="other">
                            Other
                          </option>
                        </select>
                      </div>

                      <div>
                        <label className="text-sm font-semibold text-slate-300">
                          Update Details
                        </label>

                        <textarea
                          defaultValue=""
                          rows={6}
                          placeholder="Describe the new information, development, evidence, or change..."
                          className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white placeholder:text-slate-600 outline-none transition focus:border-emerald-500"
                        />
                      </div>

                      <div>
                        <label className="text-sm font-semibold text-slate-300">
                          Internal Investigator Notes
                        </label>

                        <textarea
                          defaultValue=""
                          rows={4}
                          placeholder="Add internal notes about this update..."
                          className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white placeholder:text-slate-600 outline-none transition focus:border-emerald-500"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3 border-t border-slate-800 pt-5">
                    <button
                      type="button"
                      disabled
                      className="rounded-xl border border-slate-700 bg-slate-950 px-5 py-3 text-sm font-semibold text-slate-500 disabled:cursor-not-allowed"
                    >
                      💾 Save Update
                    </button>

                    <button
                      type="button"
                      disabled
                      className="rounded-xl border border-slate-700 bg-slate-950 px-5 py-3 text-sm font-semibold text-slate-500 disabled:cursor-not-allowed"
                    >
                      ✓ Continue to Clear
                    </button>
                  </div>
                </div>
                            ) : activeTab === "clear" ? (
                /* Clear */
                <div className="space-y-6 p-5 sm:p-6">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
                      Case Resolution
                    </p>

                    <h2 className="mt-2 text-2xl font-bold text-white">
                      Clear Case
                    </h2>

                    <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
                      Record the final resolution of this case. A cleared case
                      should include a documented reason explaining why the
                      case is no longer considered an active threat.
                    </p>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5">
                      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Case
                      </p>

                      <p className="mt-2 text-lg font-bold text-white">
                        {selectedCase
                          ? `NG-BL-${String(
                              selectedCase.reportNumber ?? ""
                            ).padStart(4, "0")}`
                          : "No case selected"}
                      </p>

                      <p className="mt-1 text-sm text-slate-400">
                        {selectedCase?.project ?? "—"}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5">
                      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Resolution Status
                      </p>

                      <p className="mt-2 text-lg font-bold text-emerald-400">
                        Final Resolution
                      </p>

                      <p className="mt-1 text-sm text-slate-400">
                        Document the reason and evidence supporting case
                        clearance.
                      </p>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
                        Clearance Record
                      </p>

                      <h3 className="mt-2 text-xl font-bold text-white">
                        Document Final Resolution
                      </h3>

                      <p className="mt-2 text-sm leading-6 text-slate-500">
                        Record the final decision, supporting reason, and
                        internal notes before clearing the case.
                      </p>
                    </div>

                    <div className="mt-5 space-y-4">
                      <div>
                        <label className="text-sm font-semibold text-slate-300">
                          Clearance Decision
                        </label>

                        <select
                          defaultValue=""
                          className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-emerald-500"
                        >
                          <option value="" disabled>
                            Select clearance decision
                          </option>
                          <option value="resolved">
                            Threat Resolved
                          </option>
                          <option value="false_positive">
                            False Positive
                          </option>
                          <option value="insufficient_evidence">
                            Insufficient Evidence
                          </option>
                          <option value="no_longer_active">
                            No Longer Active
                          </option>
                          <option value="other">
                            Other
                          </option>
                        </select>
                      </div>

                      <div>
                        <label className="text-sm font-semibold text-slate-300">
                          Clearance Reason
                        </label>

                        <textarea
                          defaultValue=""
                          rows={6}
                          placeholder="Explain why this case is being cleared and provide the supporting reasoning..."
                          className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white placeholder:text-slate-600 outline-none transition focus:border-emerald-500"
                        />
                      </div>

                      <div>
                        <label className="text-sm font-semibold text-slate-300">
                          Internal Investigator Notes
                        </label>

                        <textarea
                          defaultValue=""
                          rows={4}
                          placeholder="Add final internal notes about the case resolution..."
                          className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white placeholder:text-slate-600 outline-none transition focus:border-emerald-500"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3 border-t border-slate-800 pt-5">
                    <button
                      type="button"
                      disabled
                      className="rounded-xl border border-slate-700 bg-slate-950 px-5 py-3 text-sm font-semibold text-slate-500 disabled:cursor-not-allowed"
                    >
                      💾 Save Clearance
                    </button>

                    <button
                      type="button"
                      disabled
                      className="rounded-xl bg-emerald-500 px-5 py-3 text-sm font-bold text-slate-950 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      ✓ Clear Case
                    </button>
                  </div>
                </div>
              ) : (
                /* Risk Assessment */
                <div className="space-y-6 p-5 sm:p-6">
                  {/* Assessment Type */}
                  <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
                        Assessment Type
                      </p>

                      <h3 className="mt-2 text-xl font-bold">
                        Select Investigation Assessment
                      </h3>

                      <p className="mt-2 text-sm leading-6 text-slate-500">
                        Select the assessment that matches the subject of the
                        investigation. Project / Token Risk and Scam / Fraud
                        Promoter Risk are separate assessment models.
                      </p>
                    </div>

                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      <button
                        type="button"
                        onClick={() => {
                          setAssessmentType("project");
                        }}
                        className={`rounded-xl border p-4 text-left transition ${
                          assessmentType === "project"
                            ? "border-emerald-500 bg-emerald-500/10"
                            : "border-slate-800 bg-slate-950 hover:border-slate-700"
                        }`}
                      >
                        <p className="text-sm font-semibold">
                          🔍 Project / Token Risk Assessment
                        </p>

                        <p className="mt-1 text-xs leading-5 text-slate-500">
                          Existing 100-point risk model for projects, tokens,
                          contracts, liquidity, infrastructure, and on-chain
                          behavior.
                        </p>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setAssessmentType("promoter");
                        }}
                        className={`rounded-xl border p-4 text-left transition ${
                          assessmentType === "promoter"
                            ? "border-orange-500/50 bg-orange-500/10"
                            : "border-slate-800 bg-slate-950 hover:border-slate-700"
                        }`}
                      >
                        <p className="text-sm font-semibold">
                          📣 Scam / Fraud Promoter Assessment
                        </p>

                        <p className="mt-1 text-xs leading-5 text-slate-500">
                          Separate assessment for documented promotional
                          behavior, transparency, incentives, community
                          conduct, and supporting evidence.
                        </p>
                      </button>
                    </div>
                  </div>

                  {assessmentType === "project" ? (
                    <>
                      {/* Existing Project Risk Header */}
                      <div className="grid gap-4 md:grid-cols-[1fr_220px]">
                        <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5">
                          <p className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
                            Project / Token Risk Assessment
                          </p>

                          <h3 className="mt-2 text-xl font-bold">
                            100-Point Risk Model
                          </h3>

                          <p className="mt-2 text-sm leading-6 text-slate-500">
                            Score each category based on the evidence available
                            to the investigator. The assessment is a structured
                            intelligence tool and should be supported by
                            evidence.
                          </p>
                        </div>

                        <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5 text-center">
                          <p className="text-xs uppercase tracking-wider text-slate-500">
                            Total Risk
                          </p>

                          <div className="mt-2 text-5xl font-bold">
                            {totalRiskScore}
                          </div>

                          <p className="mt-1 text-xs text-slate-500">
                            / 100
                          </p>

                          <div className="mt-4 rounded-full border border-slate-700 bg-slate-900 px-3 py-2">
                            <span className="text-sm font-semibold text-emerald-400">
                              {riskLevel.label}
                            </span>
                          </div>

                          <p className="mt-3 text-xs leading-5 text-slate-500">
                            {riskLevel.description}
                          </p>
                        </div>
                      </div>

                      {/* Existing Project Risk Categories */}
                      <div>
                        <div className="mb-3 flex items-center justify-between">
                          <h3 className="text-sm font-semibold">
                            Risk Categories
                          </h3>

                          <span className="text-xs text-slate-500">
                            {riskCategories.length} categories
                          </span>
                        </div>

                        <div className="space-y-3">
                          {riskCategories.map((category) => {
                            const value =
                              scores[category.name] || 0;

                            const scoreBand =
                              getCategoryScoreBand(
                                category,
                                value
                              );

                            return (
                              <div
                                key={category.name}
                                className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4"
                              >
                                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                  <div className="max-w-xl">
                                    <div className="flex items-center gap-2">
                                      <h4 className="text-sm font-semibold">
                                        {category.name}
                                      </h4>

                                      <span className="text-xs text-slate-600">
                                        max {category.max}
                                      </span>
                                    </div>

                                    <p className="mt-1 text-xs leading-5 text-slate-500">
                                      {category.description}
                                    </p>

                                    <p className="mt-2 text-[11px] leading-5 text-slate-400">
                                      <span className="font-semibold text-slate-300">
                                        Proposed scoring:
                                      </span>{" "}
                                      {category.scoringGuide}
                                    </p>
                                  </div>

                                  <div className="flex min-w-[220px] items-center gap-3">
                                    <input
                                      type="range"
                                      min="0"
                                      max={category.max}
                                      value={value ?? 0}
                                      onChange={(event) =>
                                        updateScore(
                                          category.name,
                                          Number(
                                            event.target.value
                                          )
                                        )
                                      }
                                      className="w-full accent-emerald-500"
                                    />

                                    <div className="flex items-center gap-2">
                                      <div
                                        className={`rounded-lg border px-2 py-1 text-[10px] font-semibold uppercase tracking-wide ${scoreBand.className}`}
                                      >
                                        {scoreBand.label}
                                      </div>

                                      <div
                                        className={`w-14 rounded-lg border px-2 py-2 text-center text-sm font-semibold ${scoreBand.className}`}
                                      >
                                        {value}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      {/* Promoter Risk Header */}
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="rounded-2xl border border-orange-500/20 bg-orange-500/5 p-5">
                          <p className="text-xs font-semibold uppercase tracking-wider text-orange-400">
                            Scam / Fraud Promoter Assessment
                          </p>

                          <h3 className="mt-2 text-xl font-bold">
                            Promoter Risk Model
                          </h3>

                          <p className="mt-2 text-sm leading-6 text-slate-500">
                            Evaluate documented promotional behavior using a
                            separate 85-point Promoter Risk model and a
                            separate 15-point Evidence Confidence score.
                          </p>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-1">
                          <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5 text-center">
                            <p className="text-xs uppercase tracking-wider text-slate-500">
                              Promoter Risk
                            </p>

                            <div className="mt-2 text-5xl font-bold">
                              {promoterRiskScore}
                            </div>

                            <p className="mt-1 text-xs text-slate-500">
                              / 85
                            </p>

                            <div
                              className={`mt-4 rounded-full border px-3 py-2 ${promoterRiskLevel.className}`}
                            >
                              <span className="text-sm font-semibold">
                                {promoterRiskLevel.label}
                              </span>
                            </div>

                            <p className="mt-3 text-xs leading-5 text-slate-500">
                              {promoterRiskLevel.description}
                            </p>
                          </div>

                          <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5 text-center">
                            <p className="text-xs uppercase tracking-wider text-slate-500">
                              Evidence Confidence
                            </p>

                            <div className="mt-2 text-5xl font-bold">
                              {evidenceConfidenceScore}
                            </div>

                            <p className="mt-1 text-xs text-slate-500">
                              / 15
                            </p>

                            <div
                              className={`mt-4 rounded-full border px-3 py-2 ${evidenceConfidenceLevel.className}`}
                            >
                              <span className="text-sm font-semibold">
                                {evidenceConfidenceLevel.label}
                              </span>
                            </div>

                            <p className="mt-3 text-xs leading-5 text-slate-500">
                              {evidenceConfidenceLevel.description}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Promoter Risk Categories */}
                      <div>
                        <div className="mb-3 flex items-center justify-between">
                          <h3 className="text-sm font-semibold">
                            Promoter Risk Categories
                          </h3>

                          <span className="text-xs text-slate-500">
                            7 categories / 85 points
                          </span>
                        </div>

                        <div className="space-y-3">
                          {promoterRiskCategories.map((category) => {
                            const value =
                              promoterScores[category.name] || 0;

                            const scoreBand =
                              getCategoryScoreBand(
                                category,
                                value
                              );

                            return (
                              <div
                                key={category.name}
                                className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4"
                              >
                                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                  <div className="max-w-xl">
                                    <div className="flex items-center gap-2">
                                      <h4 className="text-sm font-semibold">
                                        {category.name}
                                      </h4>

                                      <span className="text-xs text-slate-600">
                                        max {category.max}
                                      </span>
                                    </div>

                                    <p className="mt-1 text-xs leading-5 text-slate-500">
                                      {category.description}
                                    </p>

                                    <p className="mt-2 text-[11px] leading-5 text-slate-400">
                                      <span className="font-semibold text-slate-300">
                                        Proposed scoring:
                                      </span>{" "}
                                      {category.scoringGuide}
                                    </p>
                                  </div>

                                  <div className="flex min-w-[220px] items-center gap-3">
                                    <input
                                      type="range"
                                      min="0"
                                      max={category.max}
                                      value={value ?? 0}
                                      onChange={(event) =>
                                        updatePromoterScore(
                                          category.name,
                                          Number(
                                            event.target.value
                                          )
                                        )
                                      }
                                      className="w-full accent-orange-500"
                                    />

                                    <div className="flex items-center gap-2">
                                      <div
                                        className={`rounded-lg border px-2 py-1 text-[10px] font-semibold uppercase tracking-wide ${scoreBand.className}`}
                                      >
                                        {scoreBand.label}
                                      </div>

                                      <div
                                        className={`w-14 rounded-lg border px-2 py-2 text-center text-sm font-semibold ${scoreBand.className}`}
                                      >
                                        {value}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Evidence Confidence */}
                      <div>
                        <div className="mb-3 flex items-center justify-between">
                          <h3 className="text-sm font-semibold">
                            Evidence Confidence
                          </h3>

                          <span className="text-xs text-slate-500">
                            Separate 15-point confidence score
                          </span>
                        </div>

                        <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
                          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <div className="max-w-xl">
                              <div className="flex items-center gap-2">
                                <h4 className="text-sm font-semibold">
                                  {promoterEvidenceCategory.name}
                                </h4>

                                <span className="text-xs text-slate-600">
                                  max 15
                                </span>
                              </div>

                              <p className="mt-1 text-xs leading-5 text-slate-500">
                                {promoterEvidenceCategory.description}
                              </p>

                              <p className="mt-2 text-[11px] leading-5 text-slate-400">
                                <span className="font-semibold text-slate-300">
                                  Proposed scoring:
                                </span>{" "}
                                {promoterEvidenceCategory.scoringGuide}
                              </p>
                            </div>

                            <div className="flex min-w-[220px] items-center gap-3">
                              <input
                                type="range"
                                min="0"
                                max="15"
                                value={evidenceConfidenceScore ?? 0}
                                onChange={(event) =>
                                  updatePromoterScore(
                                    "Evidence Strength",
                                    Number(
                                      event.target.value
                                    )
                                  )
                                }
                                className="w-full accent-emerald-500"
                              />

                              <div
                                className={`w-14 rounded-lg border px-2 py-2 text-center text-sm font-semibold ${evidenceConfidenceLevel.className}`}
                              >
                                {evidenceConfidenceScore}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Disclaimer */}
                      <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 text-xs leading-5 text-slate-500">
                        <strong className="text-slate-300">
                          Assessment Disclaimer:
                        </strong>{" "}
                        Promoter Risk reflects documented indicators
                        identified during the investigation. It is not a
                        definitive finding that a promoter has committed
                        fraud, scams, or other wrongdoing. Scores should be
                        interpreted together with the supporting evidence,
                        investigator notes, and available context.
                      </div>
                    </>
                  )}

                  {/* Assessment Notes */}
                  <div>
                    <label
                      htmlFor="risk-notes"
                      className="text-sm font-semibold"
                    >
                      Assessment Notes
                    </label>

                    <textarea
                      id="risk-notes"
                      rows={5}
                      value={
                        assessmentType === "promoter"
                          ? promoterAssessmentNotes
                          : assessmentNotes
                      }
                      onChange={(event) => {
                        if (assessmentType === "promoter") {
                          setPromoterAssessmentNotes(
                            event.target.value
                          );
                        } else {
                          setAssessmentNotes(
                            event.target.value
                          );
                        }
                      }}
                      placeholder={
                        assessmentType === "promoter"
                          ? "Document the evidence and reasoning supporting this promoter assessment..."
                          : "Document the evidence and reasoning supporting this risk assessment..."
                      }
                      className="mt-3 w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-emerald-500"
                    />
                  </div>

                  {/* Actions */}
                  <div className="border-t border-slate-800 pt-5">
                    {(assessmentType === "promoter"
                      ? promoterAssessmentMessage
                      : assessmentMessage) && (
                      <div
                        className={`mb-4 rounded-xl border px-4 py-3 text-sm ${
                          (
                            assessmentType === "promoter"
                              ? promoterAssessmentMessage
                              : assessmentMessage
                          ).includes("successfully")
                            ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                            : "border-red-500/30 bg-red-500/10 text-red-400"
                        }`}
                      >
                        {assessmentType === "promoter"
                          ? promoterAssessmentMessage
                          : assessmentMessage}
                      </div>
                    )}

                    <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
                      <button
                        type="button"
                        onClick={
                          assessmentType === "promoter"
                            ? resetPromoterAssessment
                            : resetAssessment
                        }
                        disabled={
                          assessmentType === "promoter"
                            ? savingPromoterAssessment
                            : savingAssessment
                        }
                        className="rounded-xl border border-slate-700 bg-slate-950 px-5 py-3 text-sm font-semibold text-slate-400 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Reset Assessment
                      </button>

                      <div className="flex flex-col gap-3 sm:flex-row">
                        <button
                          type="button"
                          onClick={() =>
                            moveCaseToStage("investigate")
                          }
                          disabled={
                            savingAssessment ||
                            savingPromoterAssessment
                          }
                          className="rounded-xl border border-slate-700 bg-slate-950 px-5 py-3 text-sm font-semibold text-slate-300 hover:border-slate-600 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Back to Investigate
                        </button>

                        {assessmentType === "project" ? (
                          <button
                            type="button"
                            onClick={saveRiskAssessment}
                            disabled={savingAssessment}
                            className="rounded-xl bg-emerald-500 px-5 py-3 text-sm font-bold text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {savingAssessment
                              ? "Saving Assessment..."
                              : "Submit for Review"}
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              console.log(
                                "SAVE PROMOTER BUTTON CLICKED"
                              );
                              savePromoterAssessment();
                            }}
                            disabled={savingPromoterAssessment}
                            className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm font-semibold text-emerald-300 transition hover:bg-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {savingPromoterAssessment
                              ? "Saving Promoter Assessment..."
                              : "Save Promoter Assessment — Next Step"}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="flex min-h-[400px] items-center justify-center p-6 text-center">
              <div>
                <h2 className="text-lg font-semibold">
                  No case selected
                </h2>

                <p className="mt-2 text-sm text-slate-500">
                  Select a case from the case list to begin.
                </p>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  </main>
  );
}