"use client";

import { useEffect, useMemo, useState } from "react";
import { jsPDF } from "jspdf";

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
  contract_address: string | null;
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
  contractAddress?: string | null;
  publicationChecklist?: {
    caseReview: boolean;
    evidenceReviewed: boolean;
    riskAssessmentReviewed: boolean;
    publicDisclosureReady: boolean;
    reviewChecklist?: {
      investigationFindingsReviewed: boolean;
      riskAssessmentReviewed: boolean;
      evidenceReviewed: boolean;
      readyForPublication: boolean;
    };
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
    scoringGuide: [
      "0-4: No significant control concerns identified.",
      "5-9: Minor or limited concerns.",
      "10-14: Multiple significant control risks.",
      "15-20: Severe or highly concerning contract/token controls.",
    ].join(" "),
  },
  {
    name: "Holder Distribution",
    description:
      "Concentration of token holdings, insider allocations, whale exposure, wallet clustering, or other distribution-related risks.",
    max: 15,
    scoringGuide: [
      "0-3: Healthy or well-distributed holder structure.",
      "4-6: Some concentration concerns.",
      "7-10: Significant holder concentration.",
      "11-15: Extreme concentration or major holder-dump risk.",
    ].join(" "),
  },
  {
    name: "Liquidity & Exit Risk",
    description:
      "Liquidity depth, liquidity concentration, withdrawal or removal risk, trading conditions, and potential barriers to exiting positions.",
    max: 15,
    scoringGuide: [
      "0-3: Healthy liquidity with low exit risk.",
      "4-6: Some liquidity limitations or concerns.",
      "7-10: Significant liquidity or withdrawal risks.",
      "11-15: Severe liquidity risk or potential inability to exit.",
    ].join(" "),
  },
  {
    name: "Team & Transparency",
    description:
      "Team identity and verifiability, project disclosures, documentation, token allocations, development activity, and consistency of public information.",
    max: 10,
    scoringGuide: [
      "0-2: Strong team transparency and accountability.",
      "3-4: Minor transparency gaps.",
      "5-7: Significant identity or accountability concerns.",
      "8-10: Severe opacity or serious team-related concerns.",
    ].join(" "),
  },
  {
    name: "Website & Infrastructure",
    description:
      "Website authenticity, domain and infrastructure security, technical reliability, linked services, impersonation risks, and suspicious infrastructure.",
    max: 10,
    scoringGuide: [
      "0-2: Reliable website and infrastructure.",
      "3-4: Minor technical or security concerns.",
      "5-7: Significant infrastructure or credibility issues.",
      "8-10: Severe failures, deceptive infrastructure, or major security concerns.",
    ].join(" "),
  },
  {
    name: "Marketing & Promotion",
    description:
      "Misleading promotion, unrealistic claims, undisclosed paid promotion, aggressive marketing behavior, or other promotional risk indicators.",
    max: 10,
    scoringGuide: [
      "0-2: Responsible and transparent promotion.",
      "3-4: Some exaggerated or poorly disclosed claims.",
      "5-7: Significant misleading promotion or undisclosed incentives.",
      "8-10: Severe manipulation, deceptive claims, or coordinated promotion risks.",
    ].join(" "),
  },
  {
    name: "Community Behavior",
    description:
      "Harassment, manipulation, impersonation, coordinated abuse, censorship of legitimate concerns, or other harmful community behavior.",
    max: 10,
    scoringGuide: [
      "0-2: Healthy and constructive community behavior.",
      "3-4: Some suspicious or disruptive behavior.",
      "5-7: Significant manipulation, harassment, or coordinated activity.",
      "8-10: Severe abuse, organized manipulation, or widespread deceptive behavior.",
    ].join(" "),
  },
  {
    name: "On-Chain Behavior",
    description:
      "Suspicious wallet activity, unusual transaction patterns, fund movements, wallet relationships, contract interactions, or other verifiable on-chain behavior.",
    max: 10,
    scoringGuide: [
      "0-2: No significant suspicious on-chain activity identified.",
      "3-4: Minor anomalies requiring further review.",
      "5-7: Significant suspicious transactions or activity patterns.",
      "8-10: Severe suspicious activity or strong evidence of coordinated harmful behavior.",
    ].join(" "),
  },
];

const riskChecklistCriteria: Record<
  string,
  { id: string; label: string; points: number }[]
> = {
  "Contract & Token Controls": [
    { id: "mint", label: "Unrestricted mint authority confirmed", points: 4 },
    { id: "freeze", label: "Concerning freeze authority confirmed", points: 4 },
    { id: "upgrade", label: "Material upgrade control risk verified", points: 4 },
    { id: "ownership", label: "Concentrated or unsafe control permissions verified", points: 4 },
    { id: "contract", label: "Other material contract risk supported by evidence", points: 4 },
  ],
  "Holder Distribution": [
    { id: "concentration", label: "High holder concentration verified", points: 3 },
    { id: "insiders", label: "Material insider allocation concern documented", points: 3 },
    { id: "whales", label: "Significant whale exposure verified", points: 3 },
    { id: "clusters", label: "Related wallets or clustering supported by analysis", points: 3 },
    { id: "distribution", label: "Other material distribution risk documented", points: 3 },
  ],
  "Liquidity & Exit Risk": [
    { id: "depth", label: "Insufficient liquidity depth verified", points: 3 },
    { id: "concentration", label: "Liquidity concentrated in a risky pool or venue", points: 3 },
    { id: "removal", label: "Liquidity removal or withdrawal risk identified", points: 3 },
    { id: "trading", label: "Material trading or slippage concern documented", points: 3 },
    { id: "exit", label: "Significant exit barriers supported by evidence", points: 3 },
  ],
  "Team & Transparency": [
    { id: "identity", label: "Important team identity claims remain unverified", points: 2 },
    { id: "disclosure", label: "Material project disclosures are missing", points: 2 },
    { id: "allocation", label: "Token allocation information is unclear or inconsistent", points: 2 },
    { id: "development", label: "Expected development activity lacks verifiable support", points: 2 },
    { id: "inconsistency", label: "Material public statements conflict with evidence", points: 2 },
  ],
  "Website & Infrastructure": [
    { id: "authenticity", label: "Website authenticity concern verified", points: 2 },
    { id: "domain", label: "Domain or infrastructure security concern identified", points: 2 },
    { id: "reliability", label: "Material technical reliability issue documented", points: 2 },
    { id: "services", label: "Linked service or integration presents a verified risk", points: 2 },
    { id: "impersonation", label: "Impersonation or deceptive infrastructure evidence found", points: 2 },
  ],
  "Marketing & Promotion": [
    { id: "claims", label: "Material promotional claims are misleading or unsupported", points: 2 },
    { id: "paid", label: "Paid promotion appears undisclosed based on available evidence", points: 2 },
    { id: "returns", label: "Unrealistic or guaranteed-return claims documented", points: 2 },
    { id: "pressure", label: "Aggressive or coercive promotional tactics documented", points: 2 },
    { id: "coordination", label: "Coordinated deceptive promotion supported by evidence", points: 2 },
  ],
  "Community Behavior": [
    { id: "harassment", label: "Harassment or targeted abuse documented", points: 2 },
    { id: "manipulation", label: "Manipulative community activity supported by evidence", points: 2 },
    { id: "impersonation", label: "Community impersonation incident verified", points: 2 },
    { id: "censorship", label: "Evidence of suppressing legitimate concerns documented", points: 2 },
    { id: "coordination", label: "Coordinated harmful behavior substantiated", points: 2 },
  ],
  "On-Chain Behavior": [
    { id: "wallets", label: "Suspicious wallet activity verified", points: 2 },
    { id: "transactions", label: "Materially unusual transaction patterns documented", points: 2 },
    { id: "funds", label: "Concerning fund movements traced with evidence", points: 2 },
    { id: "relationships", label: "Relevant wallet relationships supported by analysis", points: 2 },
    { id: "interactions", label: "Suspicious contract interactions substantiated", points: 2 },
  ],
};
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
      "0-2: No concerning history identified. " +
      "3-5: One or more questionable promotions with limited evidence of serious problems. " +
      "6-8: Multiple questionable promotions or recurring concerns. " +
      "9-11: Several promotions connected to serious misconduct or substantial unresolved concerns. " +
      "12-15: Strong documented pattern involving multiple projects associated with serious misconduct.",
  },
  {
    name: "Project Due Diligence",
    description:
      "Apparent level of verification performed before promoting a project or campaign.",
    max: 15,
    scoringGuide:
      "0-2: Reasonable verification is documented. " +
      "3-5: Some verification but important gaps remain. " +
      "6-8: Limited due diligence with significant unchecked information. " +
      "9-11: Repeated promotion despite obvious unresolved warning signs. " +
      "12-15: Strong evidence of repeatedly disregarding substantial and readily identifiable warning indicators.",
  },
  {
    name: "Misleading Claims",
    description:
      "False, exaggerated, unverifiable, or materially misleading promotional statements.",
    max: 15,
    scoringGuide:
      "0-2: Claims appear appropriately supported and qualified. " +
      "3-5: Minor exaggeration or weakly supported claims. " +
      "6-8: Multiple unsupported or substantially exaggerated claims. " +
      "9-11: Repeated materially misleading claims. " +
      "12-15: Strong documented pattern of materially false or deceptive promotional claims.",
  },
  {
    name: "Transparency & Disclosure",
    description:
      "Disclosure of sponsorships, payments, token allocations, affiliate relationships, and other material incentives.",
    max: 10,
    scoringGuide:
      "0-1: Relevant relationships are clearly disclosed. " +
      "2-3: Minor disclosure gaps. " +
      "4-5: Important promotional relationships are inconsistently disclosed. " +
      "6-8: Repeated failure to disclose material relationships. " +
      "9-10: Strong evidence of concealed or deceptive material relationships.",
  },
  {
    name: "Promotion Pattern",
    description:
      "Recurring patterns of promoting questionable projects or campaigns.",
    max: 10,
    scoringGuide:
      "0-1: No concerning pattern. " +
      "2-3: Isolated questionable promotion. " +
      "4-5: Several questionable promotions with common characteristics. " +
      "6-8: Repeated promotion of projects displaying similar warning signs. " +
      "9-10: Strong recurring pattern despite repeated warning indicators or previous negative outcomes.",
  },
  {
    name: "Financial Incentives",
    description:
      "Whether financial or token incentives appear connected to promotional behavior in a concerning way.",
    max: 10,
    scoringGuide:
      "0-1: No significant incentive concern. " +
      "2-3: Incentives exist and appear appropriately disclosed. " +
      "4-5: Significant incentives with incomplete disclosure. " +
      "6-8: Strong evidence that substantial incentives influenced promotion without adequate transparency. " +
      "9-10: Strong documented evidence of concealed or deceptive incentive arrangements.",
  },
  {
    name: "Community Conduct",
    description:
      "Documented behavior toward audiences and communities during promotion or investigation.",
    max: 10,
    scoringGuide:
      "0-1: No significant concern. " +
      "2-3: Occasional inappropriate behavior without a clear pattern. " +
      "4-5: Repeated hostile, manipulative, or misleading interactions. " +
      "6-8: Documented manipulation, intimidation, deceptive engagement, or targeted pressure. " +
      "9-10: Strong evidence of systematic manipulation, intimidation, or deceptive recruitment.",
  },
];

const promoterRiskIndicatorCriteria: Record<
  string,
  { id: string; label: string; points: number }[]
> = {
  "Promotion History": [
    { id: "prior_failures", label: "Previous promoted projects have documented serious failures", points: 3 },
    { id: "repeat_concerns", label: "Multiple previous promotions have substantiated material concerns", points: 3 },
    { id: "ignored_warnings", label: "Promotion continued after credible, evidence-supported warnings", points: 3 },
    { id: "unresolved_projects", label: "Repeated promotion of projects with unresolved serious concerns", points: 3 },
    { id: "past_claims", label: "Material claims about previous promotions conflict with documented facts", points: 3 },
  ],

  "Project Due Diligence": [
    { id: "contract_unchecked", label: "Promoted token or contract was not independently verified", points: 3 },
    { id: "team_unverified", label: "Material team, partnership, or affiliation claims were not verified", points: 3 },
    { id: "warnings_overlooked", label: "Significant, readily identifiable warning signs were overlooked", points: 3 },
    { id: "safety_unsubstantiated", label: "Safety claims lacked supporting contract, liquidity, or tokenomics checks", points: 3 },
    { id: "discrepancies_ignored", label: "Promotion continued despite unresolved material discrepancies", points: 3 },
  ],

  "Misleading Claims": [
    { id: "guaranteed_returns", label: "Documented guaranteed-profit or risk-free investment claims", points: 3 },
    { id: "false_partnership", label: "Material partnership or endorsement claims were contradicted by evidence", points: 3 },
    { id: "unsupported_performance", label: "Material performance or price claims lacked adequate support", points: 3 },
    { id: "false_urgency", label: "Promotional statements materially misrepresented deadlines or scarcity", points: 3 },
    { id: "repeated_false_claims", label: "Repeated material claims remained false or misleading after correction opportunities", points: 3 },
  ],

  "Transparency & Disclosure": [
    { id: "undisclosed_payment", label: "Evidence supports an undisclosed payment for promotion", points: 2 },
    { id: "undisclosed_tokens", label: "Material token holdings or allocations were not adequately disclosed", points: 2 },
    { id: "hidden_affiliation", label: "A material project affiliation or conflict of interest was concealed", points: 2 },
    { id: "affiliate_omission", label: "Material referral or affiliate incentives were not disclosed", points: 2 },
    { id: "misleading_disclosure", label: "Disclosures materially contradicted available evidence", points: 2 },
  ],

  "Promotion Pattern": [
    { id: "repeated_high_risk", label: "Repeated promotion of projects with independently documented serious concerns", points: 2 },
    { id: "similar_claims", label: "Recurring unsupported claims across multiple promotions", points: 2 },
    { id: "warning_recurrence", label: "Similar warning signs recur across promoted projects", points: 2 },
    { id: "coordinated_campaigns", label: "Evidence supports coordinated promotional campaigns lacking transparency", points: 2 },
    { id: "repeat_after_outcomes", label: "Similar promotion patterns continued after documented negative outcomes", points: 2 },
  ],

  "Financial Incentives": [
    { id: "undisclosed_compensation", label: "Evidence supports material undisclosed promotional compensation", points: 2 },
    { id: "token_payment", label: "Token payments or allocations connected to promotion were inadequately disclosed", points: 2 },
    { id: "referral_conflict", label: "Material referral commissions or incentives were not disclosed", points: 2 },
    { id: "incentive_claim_conflict", label: "Statements about financial incentives conflict with available evidence", points: 2 },
    { id: "concealed_arrangement", label: "Evidence supports a concealed material financial arrangement", points: 2 },
  ],

  "Community Conduct": [
    { id: "targeted_harassment", label: "Documented targeted harassment connected to promotional activity", points: 2 },
    { id: "suppressed_questions", label: "Evidence supports deliberate suppression of legitimate project concerns", points: 2 },
    { id: "impersonation", label: "Verified impersonation or deceptive identity use", points: 2 },
    { id: "coercive_pressure", label: "Documented coercive pressure or intimidation of community members", points: 2 },
    { id: "deceptive_engagement", label: "Evidence supports fabricated engagement or deceptive community activity", points: 2 },
  ],
};

type PromoterChecklistItem = {
  id: string;
  label: string;
};

const promoterVerificationChecklist: Record<
  string,
  PromoterChecklistItem[]
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

const promoterEvidenceCategory: PromoterRiskCategory = {
  name: "Evidence Strength",
  description:
    "Quality, reliability, corroboration, and completeness of evidence supporting the promoter assessment.",
  max: 15,
  scoringGuide:
    "0-2: Little or no reliable evidence. " +
    "3-5: Limited evidence with significant gaps. " +
    "6-8: Multiple reasonably credible sources with unresolved questions. " +
    "9-11: Strong corroborated evidence from multiple sources. " +
    "12-15: Extensive, highly reliable, independently corroborated evidence.",
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

  const [publicationChecklistMessage, setPublicationChecklistMessage] =
    useState("");

  const [reviewChecklist, setReviewChecklist] = useState({
    investigationFindingsReviewed: false,
    riskAssessmentReviewed: false,
    evidenceReviewed: false,
    readyForPublication: false,
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
const [riskChecklistSelections, setRiskChecklistSelections] = useState<Record<string, string[]>>({});

const [promoterScores, setPromoterScores] = useState<
  Record<string, number>
>({});

const [promoterChecklistSelections, setPromoterChecklistSelections] =
  useState<Record<string, string[]>>({});

const [promoterRiskIndicatorSelections, setPromoterRiskIndicatorSelections] =
  useState<Record<string, string[]>>({});

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

  const [responseAssessment, setResponseAssessment] =
    useState<{
      response_type: string;
      response_details: string;
      investigator_notes: string;
    } | null>(null);

  const [loadingResponse, setLoadingResponse] = useState(false);
  const [savingResponse, setSavingResponse] = useState(false);
  const [responseMessage, setResponseMessage] = useState("");

    const [clearanceAssessment, setClearanceAssessment] =
    useState<{
      clearance_decision: string;
      clearance_reason: string;
      investigator_notes: string;
    } | null>(null);

  const [loadingClearance, setLoadingClearance] = useState(false);
  const [savingClearance, setSavingClearance] = useState(false);
  const [clearanceMessage, setClearanceMessage] = useState("");

  const [updateAssessment, setUpdateAssessment] =
    useState<{
      update_type: string;
      update_details: string;
      investigator_notes: string;
    } | null>(null);

  const [savingUpdate, setSavingUpdate] = useState(false);
  const [loadingUpdate, setLoadingUpdate] = useState(false);

  const [updateMessage, setUpdateMessage] = useState("");
  
  const [caseOverviewPreview, setCaseOverviewPreview] = useState<string | null>(null);

  const selectedCase = cases.find(
    (item) => item.id === selectedCaseId
  );

// Builds the same complete Case Overview for preview and PDF export.
const buildCaseOverviewText = async (): Promise<string> => {
  if (!selectedCase) {
    throw new Error("Select a case before previewing or exporting.");
  }

  const currentCase = selectedCase;
  const threatType = currentCase.threatType?.trim() || "Unspecified";
  const isPromoterCase = /\b(scam|fraud)\b/i.test(threatType);
  const caseNumber =
    currentCase.reportNumber != null
      ? `NG-BL-${String(currentCase.reportNumber).padStart(4, "0")}`
      : String(currentCase.id);

  const lines: string[] = [
    "NOVAGAIA INTELLIGENCE",
    "OPERATION BLACKLIST - CASE OVERVIEW",
    `Exported at (UTC): ${new Date().toISOString()}`,
    "",
    "CASE DETAILS",
    `Case Number: ${caseNumber}`,
    `Case ID: ${currentCase.id}`,
    `Project / Subject: ${currentCase.project?.trim() || "Not provided"}`,
    `Threat Type: ${threatType}`,
    `Assessment Classification: ${isPromoterCase ? "Promoter Assessment" : "Project / Token Risk Assessment"}`,
    `Status: ${currentCase.status || "Not recorded"}`,
    `Workflow Stage: ${workflow.find((item) => item.key === currentCase.stage)?.label ?? currentCase.stage ?? "Not recorded"}`,
    `Submitted: ${currentCase.submitted || "Not recorded"}`,
    `Contract / Token Address: ${currentCase.contractAddress?.trim() || "Not provided"}`,
    "",
    "CASE DESCRIPTION",
    currentCase.description?.trim() || "No description provided.",
    "",
  ];

  const endpoint = isPromoterCase
    ? "/api/blacklist/promoter-assessment"
    : "/api/blacklist/risk-assessment";

  const response = await fetch(
    `${endpoint}?case_id=${encodeURIComponent(String(currentCase.id))}`,
    { method: "GET", cache: "no-store" }
  );

  const payload = await response.json();

  if (!response.ok || payload.success !== true) {
    throw new Error(
      payload.error ||
      `Unable to load the saved ${isPromoterCase ? "promoter" : "project/token"} assessment.`
    );
  }

  const assessment = payload.assessment as Record<string, any> | null;

  const displayScore = (value: unknown, maximum: number): string =>
    typeof value === "number" ? `${value}/${maximum}` : `Not recorded (max ${maximum})`;

  if (!assessment) {
    lines.push(
      isPromoterCase ? "PROMOTER ASSESSMENT" : "PROJECT / TOKEN RISK ASSESSMENT",
      "No saved assessment record was found for this case.",
      "No assessment score or risk band has been inferred.",
      ""
    );
  } else if (isPromoterCase) {
    const promoterCategories = [
      { label: "Promotion History", field: "promotion_history", max: 15 },
      { label: "Project Due Diligence", field: "project_due_diligence", max: 15 },
      { label: "Misleading Claims", field: "misleading_claims", max: 15 },
      { label: "Transparency & Disclosure", field: "transparency_disclosure", max: 10 },
      { label: "Promotion Pattern", field: "promotion_pattern", max: 10 },
      { label: "Financial Incentives", field: "financial_incentives", max: 10 },
      { label: "Community Conduct", field: "community_conduct", max: 10 },
    ];

    lines.push(
      "PROMOTER ASSESSMENT",
      `Promoter Risk Score: ${displayScore(assessment.promoter_risk_score, 85)}`,
      `Promoter Risk Band: ${assessment.promoter_risk_band || "Not recorded"}`,
      `Evidence Confidence Score: ${displayScore(assessment.evidence_confidence_score, 15)}`,
      `Evidence Confidence Level: ${assessment.evidence_confidence_level || "Not recorded"}`,
      `Evidence Strength: ${assessment.evidence_strength || "Not recorded"}`,
      "",
      "PROMOTER RISK PARAMETERS"
    );

    for (const category of promoterCategories) {
      lines.push(
        `${category.label}: ${displayScore(assessment[category.field], category.max)}`
      );
    }

    const rawChecklist = assessment.verification_checklist;
    let savedChecklistObject: Record<string, unknown> = {};
    const legacySelectedIds = new Set<string>();

    if (Array.isArray(rawChecklist)) {
      for (const item of rawChecklist) {
        const id = typeof item === "string" ? item : item?.id;
        if (typeof id === "string") legacySelectedIds.add(id);
      }
    } else if (rawChecklist && typeof rawChecklist === "object") {
      savedChecklistObject = rawChecklist as Record<string, unknown>;
    } else if (typeof rawChecklist === "string" && rawChecklist.trim()) {
      try {
        const parsed: unknown = JSON.parse(rawChecklist);

        if (Array.isArray(parsed)) {
          for (const item of parsed) {
            const id = typeof item === "string" ? item : item?.id;
            if (typeof id === "string") legacySelectedIds.add(id);
          }
        } else if (parsed && typeof parsed === "object") {
          savedChecklistObject = parsed as Record<string, unknown>;
        }
      } catch {
        lines.push("Checklist note: saved checklist could not be parsed.");
      }
    }

const isRiskIndicatorChecked = (
      category: string,
      itemId: string
    ): boolean => {
      const savedItems =
        savedChecklistObject[`__risk_indicator__:${category}`];

      return (
        (Array.isArray(savedItems) && savedItems.includes(itemId)) ||
        legacySelectedIds.has(`__risk_indicator__:${itemId}`) ||
        legacySelectedIds.has(`__risk_indicator__:${category}:${itemId}`)
      );
    };

lines.push("", "EVIDENCE-BASED PROMOTER RISK INDICATORS");

    for (const [category, items] of Object.entries(promoterRiskIndicatorCriteria)) {
      lines.push("", category);

      for (const item of items) {
        const checked = isRiskIndicatorChecked(category, item.id);

        lines.push(
          `${checked ? "[X]" : "[ ]"} ${item.label} (${item.points} points)`
        );
      }
    }

    lines.push(
      "",
      "PROMOTER ASSESSMENT NOTES",
      assessment.assessment_notes?.trim() || "No assessment notes recorded."
    );
  } else {
    const projectCategories = [
      { label: "Contract & Token Controls", field: "contract_token_controls", max: 20 },
      { label: "Holder Distribution", field: "holder_distribution", max: 15 },
      { label: "Liquidity & Exit Risk", field: "liquidity_exit_risk", max: 15 },
      { label: "Team & Transparency", field: "team_transparency", max: 10 },
      { label: "Website & Infrastructure", field: "website_infrastructure", max: 10 },
      { label: "Marketing & Promotion", field: "marketing_promotion", max: 10 },
      { label: "Community Behavior", field: "community_behavior", max: 10 },
      { label: "On-Chain Behavior", field: "on_chain_behavior", max: 10 },
    ];

    lines.push(
      "PROJECT / TOKEN RISK ASSESSMENT",
      `Overall Risk Score: ${displayScore(assessment.overall_score, 100)}`,
      `Risk Band: ${assessment.risk_band || "Not recorded"}`,
      "",
      "PROJECT / TOKEN RISK PARAMETERS"
    );

    for (const category of projectCategories) {
      lines.push(
        `${category.label}: ${displayScore(assessment[category.field], category.max)}`
      );
    }

    lines.push(
      "",
      "PROJECT / TOKEN ASSESSMENT NOTES",
      assessment.assessment_notes?.trim() || "No assessment notes recorded.",
      "",
      "Indicator checkbox limitation: The current Project / Token Risk API does not persist individual indicator selections. No saved checkbox states are available to report."
    );
  }

  // Load the saved Response, Update, and Clearance records.
  const workflowRecordEndpoints = [
    {
      label: "RESPONSE RECORD",
      endpoint: "/api/blacklist/response",
      key: "response",
      fields: [
        { label: "Response Type", field: "response_type" },
        { label: "Response Details", field: "response_details" },
        { label: "Last Updated (UTC)", field: "updated_at" },
      ],
    },
    {
      label: "UPDATE RECORD",
      endpoint: "/api/blacklist/update",
      key: "update",
      fields: [
        { label: "Update Type", field: "update_type" },
        { label: "Update Details", field: "update_details" },
        { label: "Last Updated (UTC)", field: "updated_at" },
      ],
    },
    {
      label: "CLEARANCE RECORD",
      endpoint: "/api/blacklist/clearance",
      key: "clearance",
      fields: [
        { label: "Clearance Decision", field: "clearance_decision" },
        { label: "Clearance Reason", field: "clearance_reason" },
        { label: "Last Updated (UTC)", field: "updated_at" },
      ],
    },
  ] as const;

  for (const recordConfig of workflowRecordEndpoints) {
    const recordResponse = await fetch(
      `${recordConfig.endpoint}?case_id=${encodeURIComponent(String(currentCase.id))}`,
      { method: "GET", cache: "no-store" }
    );

    const recordPayload = await recordResponse.json();

    if (!recordResponse.ok || recordPayload.success !== true) {
      throw new Error(
        recordPayload.error ||
        `Unable to load the saved ${recordConfig.label.toLowerCase()}.`
      );
    }

    const savedRecord = recordPayload[recordConfig.key] as
      | Record<string, unknown>
      | null;

    if (!savedRecord) {
      continue;
    }

    lines.push("", recordConfig.label);

    for (const fieldConfig of recordConfig.fields) {
      const value = savedRecord[fieldConfig.field];

      lines.push(
        `${fieldConfig.label}: ${
          value !== null && value !== undefined && String(value).trim()
            ? String(value).trim()
            : "Not recorded"
        }`
      );
    }
  }

  lines.push(
    "",
    "PUBLICATION / REVIEW CHECKLIST",
    `[${currentCase.publicationChecklist?.caseReview === true ? "X" : " "}] Case review confirmed`,
    `[${currentCase.publicationChecklist?.evidenceReviewed === true ? "X" : " "}] Evidence reviewed`,
    `[${currentCase.publicationChecklist?.riskAssessmentReviewed === true ? "X" : " "}] Risk assessment reviewed`,
    `[${currentCase.publicationChecklist?.publicDisclosureReady === true ? "X" : " "}] Public disclosure marked ready`,
    "",
    "IMPORTANT CONTEXT",
    "This document reports the selected case and its saved assessment record. A report or risk score is an assessment, not proof that alleged wrongdoing occurred.",
    "Review supporting evidence and the complete case record before making public claims.",
    "",
    "END OF CASE OVERVIEW"
  );

  return lines.join("\n");
};


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
  const loadResponseAssessment = async (caseId: string) => {
    if (!caseId) {
      setResponseAssessment(null);
      return;
    }

    setLoadingResponse(true);
    setResponseMessage("");

    try {
      const response = await fetch(
        `/api/blacklist/response?case_id=${encodeURIComponent(caseId)}`
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.error || "Unable to load Response record."
        );
      }

      if (!data.response) {
        setResponseAssessment(null);
        setResponseMessage(
          "No saved Response record for this case."
        );
        return;
      }

      setResponseAssessment({
        response_type:
          typeof data.response.response_type === "string"
            ? data.response.response_type
            : "",

        response_details:
          typeof data.response.response_details === "string"
            ? data.response.response_details
            : "",

        investigator_notes:
          typeof data.response.investigator_notes === "string"
            ? data.response.investigator_notes
            : "",
      });

      setResponseMessage(
        "Saved Response record loaded."
      );
    } catch (error) {
      console.error(
        "Response record load error:",
        error
      );

      setResponseAssessment(null);

      setResponseMessage(
        error instanceof Error
          ? error.message
          : "Unable to load Response record."
      );
    } finally {
      setLoadingResponse(false);
    }
  };

  const saveResponseAssessment = async () => {
    if (!selectedCaseId) {
      setResponseMessage("No case is selected.");
      return;
    }

    if (!responseAssessment?.response_type.trim()) {
      setResponseMessage(
        "Please select a Response Type before saving."
      );
      return;
    }

    setSavingResponse(true);
    setResponseMessage("");

    try {
      const response = await fetch(
        "/api/blacklist/response",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            case_id: selectedCaseId,
            response_type:
              responseAssessment.response_type,
            response_details:
              responseAssessment.response_details,
            investigator_notes:
              responseAssessment.investigator_notes,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.error || "Unable to save Response record."
        );
      }

      setResponseAssessment({
        response_type:
          typeof data.response?.response_type === "string"
            ? data.response.response_type
            : responseAssessment.response_type,

        response_details:
          typeof data.response?.response_details === "string"
            ? data.response.response_details
            : responseAssessment.response_details,

        investigator_notes:
          typeof data.response?.investigator_notes === "string"
            ? data.response.investigator_notes
            : responseAssessment.investigator_notes,
      });

      setResponseMessage(
        "Response record saved successfully."
      );
    } catch (error) {
      console.error(
        "Response record save error:",
        error
      );

      setResponseMessage(
        error instanceof Error
          ? error.message
          : "Unable to save Response record."
      );
    } finally {
      setSavingResponse(false);
    }
  };

  const loadUpdateAssessment = async (caseId: string) => {
    if (!caseId) {
      setUpdateAssessment(null);
      return;
    }

    setLoadingUpdate(true);
    setUpdateMessage("");

    try {
      const response = await fetch(
        `/api/blacklist/update?case_id=${encodeURIComponent(caseId)}`
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.error || "Unable to load Update record."
        );
      }

      if (!data.update) {
        setUpdateAssessment({
          update_type: "",
          update_details: "",
          investigator_notes: "",
        });
        setUpdateMessage(
          "No saved Update record for this case."
        );
        return;
      }

      setUpdateAssessment({
        update_type:
          typeof data.update.update_type === "string"
            ? data.update.update_type
            : "",
        update_details:
          typeof data.update.update_details === "string"
            ? data.update.update_details
            : "",
        investigator_notes:
          typeof data.update.investigator_notes === "string"
            ? data.update.investigator_notes
            : "",
      });

      setUpdateMessage("Saved Update record loaded.");
    } catch (error) {
      console.error(
        "Blacklist update load error:",
        error
      );

      setUpdateAssessment({
        update_type: "",
        update_details: "",
        investigator_notes: "",
      });

      setUpdateMessage(
        error instanceof Error
          ? error.message
          : "Unable to load Update record."
      );
    } finally {
      setLoadingUpdate(false);
    }
  };
    const saveUpdateAssessment = async () => {
    if (!selectedCaseId) {
      setUpdateMessage("No case is selected.");
      return;
    }

    if (!updateAssessment?.update_type.trim()) {
      setUpdateMessage(
        "Please select an Update Type before saving."
      );
      return;
    }

    setSavingUpdate(true);
    setUpdateMessage("");

    try {
      const response = await fetch(
        "/api/blacklist/update",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            case_id: selectedCaseId,
            update_type:
              updateAssessment.update_type,
            update_details:
              updateAssessment.update_details,
            investigator_notes:
              updateAssessment.investigator_notes,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.error || "Unable to save Update record."
        );
      }

      setUpdateAssessment({
        update_type:
          typeof data.update?.update_type === "string"
            ? data.update.update_type
            : updateAssessment.update_type,

        update_details:
          typeof data.update?.update_details === "string"
            ? data.update.update_details
            : updateAssessment.update_details,

        investigator_notes:
          typeof data.update?.investigator_notes === "string"
            ? data.update.investigator_notes
            : updateAssessment.investigator_notes,
      });

      setUpdateMessage(
        "Update record saved successfully."
      );
    } catch (error) {
      console.error(
        "Update record save error:",
        error
      );

      setUpdateMessage(
        error instanceof Error
          ? error.message
          : "Unable to save Update record."
      );
    } finally {
      setSavingUpdate(false);
    }
  };

  const loadClearanceAssessment = async (caseId: string) => {
    if (!caseId) {
      setClearanceAssessment(null);
      return;
    }

    setLoadingClearance(true);
    setClearanceMessage("");

    try {
      const response = await fetch(
        `/api/blacklist/clearance?case_id=${encodeURIComponent(caseId)}`
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.error || "Unable to load Clearance record."
        );
      }

      if (!data.clearance) {
        setClearanceAssessment(null);
        setClearanceMessage(
          "No saved Clearance record for this case."
        );
        return;
      }

      setClearanceAssessment({
        clearance_decision:
          typeof data.clearance.clearance_decision === "string"
            ? data.clearance.clearance_decision
            : "",
        clearance_reason:
          typeof data.clearance.clearance_reason === "string"
            ? data.clearance.clearance_reason
            : "",
        investigator_notes:
          typeof data.clearance.investigator_notes === "string"
            ? data.clearance.investigator_notes
            : "",
      });

      setClearanceMessage("Saved Clearance record loaded.");
    } catch (error) {
      console.error(
        "Blacklist clearance load error:",
        error
      );

      setClearanceAssessment(null);
      setClearanceMessage(
        error instanceof Error
          ? error.message
          : "Unable to load Clearance record."
      );
    } finally {
      setLoadingClearance(false);
    }
  };

  const saveClearanceAssessment = async () => {
    console.log("SAVE CLEARANCE CLICKED:", {
      selectedCaseId,
      clearanceAssessment,
    });
    if (!selectedCaseId) {
      setClearanceMessage("No case is selected.");
      return;
    }

    if (!clearanceAssessment?.clearance_decision.trim()) {
      setClearanceMessage(
        "Please select a Clearance Decision before saving."
      );
      return;
    }

    setSavingClearance(true);
    setClearanceMessage("");

    try {
      const response = await fetch(
        "/api/blacklist/clearance",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            case_id: selectedCaseId,
            clearance_decision:
              clearanceAssessment.clearance_decision,
            clearance_reason:
              clearanceAssessment.clearance_reason,
            investigator_notes:
              clearanceAssessment.investigator_notes,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.error || "Unable to save Clearance record."
        );
      }

      if (data.clearance) {
        setClearanceAssessment({
          clearance_decision:
            typeof data.clearance.clearance_decision === "string"
              ? data.clearance.clearance_decision
              : "",
          clearance_reason:
            typeof data.clearance.clearance_reason === "string"
              ? data.clearance.clearance_reason
              : "",
          investigator_notes:
            typeof data.clearance.investigator_notes === "string"
              ? data.clearance.investigator_notes
              : "",
        });
      }

      setClearanceMessage(
        "Clearance record saved successfully."
      );
    } catch (error) {
      console.error(
        "Blacklist clearance save error:",
        error
      );

      setClearanceMessage(
        error instanceof Error
          ? error.message
          : "Unable to save Clearance record."
      );
    } finally {
      setSavingClearance(false);
    }
  };

    const clearCase = async () => {
      if (!selectedCaseId) {
        setClearanceMessage("No case is selected.");
        return;
      }

      if (!clearanceAssessment?.clearance_decision) {
        setClearanceMessage(
          "Please save a Clearance decision before clearing this case."
        );
        return;
      }

      try {
        setClearanceMessage("Clearing case...");

        const response = await fetch("/api/cases", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            case_id: selectedCaseId,
            status: "cleared",
          }),
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(
            data.error || "Unable to clear the case."
          );
        }

        setCases((currentCases) =>
          currentCases.map((item) =>
            item.id === selectedCaseId
              ? {
                  ...item,
                  status: "cleared",
                  stage: "clear",
                }
              : item
          )
        );

        setClearanceMessage(
          "Case cleared successfully."
        );
      } catch (error) {
        console.error(
          "Blacklist case clearance error:",
          error
        );

        setClearanceMessage(
          error instanceof Error
            ? error.message
            : "Unable to clear the case."
        );
      }
    };

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

    const saveInvestigationAssessment = async () => {
      if (!selectedCaseId) {
        setInvestigationMessage("No case selected.");
        return;
      }

      if (!investigationAssessment) {
        setInvestigationMessage(
          "No Investigation assessment data to save."
        );
        return;
      }

      setLoadingInvestigation(true);
      setInvestigationMessage("");

      try {
        const response = await fetch(
          "/api/blacklist/investigation",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              case_id: selectedCaseId,

              subject_identity_confirmed:
                investigationAssessment.subject_identity_confirmed,

              subject_background_reviewed:
                investigationAssessment.subject_background_reviewed,

              project_history_reviewed:
                investigationAssessment.project_history_reviewed,

              team_activity_reviewed:
                investigationAssessment.team_activity_reviewed,

              contract_reviewed:
                investigationAssessment.contract_reviewed,

              tokenomics_reviewed:
                investigationAssessment.tokenomics_reviewed,

              liquidity_reviewed:
                investigationAssessment.liquidity_reviewed,

              on_chain_activity_reviewed:
                investigationAssessment.on_chain_activity_reviewed,

              preliminary_findings:
                investigationAssessment.preliminary_findings,

              investigator_notes:
                investigationAssessment.investigator_notes,

              investigation_decision:
                investigationAssessment.investigation_decision,
            }),
          }
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(
            data.error ||
              "Unable to save Investigation assessment."
          );
        }

        setInvestigationMessage(
          "Investigation assessment saved successfully."
        );
      } catch (error) {
        console.error(
          "Investigation assessment save error:",
          error
        );

        setInvestigationMessage(
          error instanceof Error
            ? error.message
            : "Unable to save Investigation assessment."
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
    if (!selectedCaseId) {
      setResponseAssessment(null);
      setResponseMessage("");
      return;
    }

    loadResponseAssessment(selectedCaseId);
  }, [selectedCaseId]);


  useEffect(() => {
    if (!selectedCaseId) {
      setUpdateAssessment(null);
      setUpdateMessage("");
      return;
    }

    loadUpdateAssessment(selectedCaseId);
  }, [selectedCaseId]);

    useEffect(() => {
    if (!selectedCaseId) {
      setClearanceAssessment(null);
      setClearanceMessage("");
      return;
    }

    loadClearanceAssessment(selectedCaseId);
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

  setReviewChecklist(
    currentCase?.publicationChecklist?.reviewChecklist ?? {
      investigationFindingsReviewed: false,
      riskAssessmentReviewed: false,
      evidenceReviewed: false,
      readyForPublication: false,
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
        reviewChecklist?: {
          investigationFindingsReviewed?: boolean;
          riskAssessmentReviewed?: boolean;
          evidenceReviewed?: boolean;
          readyForPublication?: boolean;
        };
      };
      created_at: string;
      description?: string;
      evidence?: string | null;
      contact?: string | null;
      contract_address?: string | null;
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
      contractAddress: item.contract_address ?? null,

      publicationChecklist: {
        caseReview:
          item.publication_checklist?.caseReview ?? false,
        evidenceReviewed:
          item.publication_checklist?.evidenceReviewed ?? false,
        riskAssessmentReviewed:
          item.publication_checklist?.riskAssessmentReviewed ?? false,
        publicDisclosureReady:
          item.publication_checklist?.publicDisclosureReady ?? false,
        reviewChecklist: {
          investigationFindingsReviewed: item.publication_checklist?.reviewChecklist?.investigationFindingsReviewed ?? false,
          riskAssessmentReviewed: item.publication_checklist?.reviewChecklist?.riskAssessmentReviewed ?? false,
          evidenceReviewed: item.publication_checklist?.reviewChecklist?.evidenceReviewed ?? false,
          readyForPublication: item.publication_checklist?.reviewChecklist?.readyForPublication ?? false,
        },
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
      contractAddress: report.contract_address ?? null,
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
    console.log(
      "PROMOTER NOTES DEBUG:",
      JSON.stringify(
        {
          caseId,
          assessmentNotes: assessment?.assessment_notes,
          assessmentRecordFound: Boolean(assessment),
        },
        null,
        2
      )
    );

    const savedChecklist = assessment?.verification_checklist;

    const savedChecklistEntries =
      savedChecklist &&
      typeof savedChecklist === "object" &&
      !Array.isArray(savedChecklist)
        ? Object.entries(savedChecklist)
            .filter((entry) => Array.isArray(entry[1]))
            .map(([category, items]) => [
              category,
              (items as unknown[]).filter(
                (item): item is string => typeof item === "string"
              ),
            ] as [string, string[]])
        : [];

    setPromoterChecklistSelections(
      Object.fromEntries(
        savedChecklistEntries.filter(
          ([category]) =>
            !category.startsWith("__risk_indicator__:")
        )
      )
    );

setPromoterRiskIndicatorSelections(
  Object.fromEntries(
    savedChecklistEntries
      .filter(([category]) =>
        category.startsWith("__risk_indicator__:")
      )
      .map(([category, items]) => [
        category.slice("__risk_indicator__:".length),
        items,
      ])
  )
);

    if (!assessment) {
      setPromoterScores({});
      setPromoterChecklistSelections({});
      setPromoterRiskIndicatorSelections({});
      setPromoterAssessmentNotes("");
      return;
    }

    const loadedPromoterScores: Record<string, number> = {
      "Promotion History": assessment.promotion_history ?? 0,
      "Project Due Diligence": assessment.project_due_diligence ?? 0,
      "Misleading Claims": assessment.misleading_claims ?? 0,
      "Transparency & Disclosure": assessment.transparency_disclosure ?? 0,
      "Promotion Pattern": assessment.promotion_pattern ?? 0,
      "Financial Incentives": assessment.financial_incentives ?? 0,
      "Community Conduct": assessment.community_conduct ?? 0,
      "Evidence Strength": assessment.evidence_strength ?? 0,
    };

    for (const category of promoterRiskCategories) {
      const selectedIds =
        savedChecklistEntries.find(
          ([key]) => key === `__risk_indicator__:${category.name}`
        )?.[1] ?? [];

      const criteria = promoterRiskIndicatorCriteria[category.name];

      if (selectedIds.length > 0 && criteria) {
        loadedPromoterScores[category.name] = Math.min(
          category.max,
          criteria
            .filter((item) => selectedIds.includes(item.id))
            .reduce((total, item) => total + item.points, 0)
        );
      }
    }

    setPromoterScores(loadedPromoterScores);

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
      setRiskChecklistSelections({});
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

    const savedChecklist = assessment.verification_checklist;
    const restoredSelections: Record<string, string[]> = {};

    if (
      savedChecklist &&
      typeof savedChecklist === "object" &&
      !Array.isArray(savedChecklist)
    ) {
      for (const [category, items] of Object.entries(savedChecklist)) {
        if (Array.isArray(items)) {
          restoredSelections[category] = items.filter(
            (item): item is string => typeof item === "string"
          );
        }
      }
    }

    setRiskChecklistSelections(restoredSelections);

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

          verification_checklist: riskChecklistSelections,
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

          // Promoter Risk Assessment 85 points
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

          // Evidence Confidence 15 points
          evidence_strength:
            promoterScores["Evidence Strength"] || 0,

          evidence_confidence_score:
            evidenceConfidenceScore,

          verification_checklist: {
            ...promoterChecklistSelections,
            ...Object.fromEntries(
              Object.entries(promoterRiskIndicatorSelections).map(
                ([category, items]) => [
                  `__risk_indicator__:${category}`,
                  items,
                ]
              )
            ),
          },

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
console.log("UPDATE TRANSITION CHECK:", {
  currentStage: currentCase.stage,
  requestedStage: stage,
  selectedCaseId,
});
  const targetIndex = getStageIndex(stage);

// Do not allow a case to skip forward over workflow stages.
//
// The Promoter Assessment is completed during the
// investigation stage, so Investigate -> Review is valid.
// The Project/Token Risk Assessment follows the normal
// Investigate -> Risk Assess -> Review path.
const allowedTransitions: Record<
  WorkflowStage,
  WorkflowStage[]
> = {
  report: ["triage"],
  triage: ["investigate"],
  investigate: ["risk", "review"],
  risk: ["review", "investigate"],
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
    ? "update"
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
          ? "update"
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
        publication_checklist: {
                                  ...publishChecklist,
                                  reviewChecklist,
                                },
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
      setActiveTab("response");
    } else if (stage === "response") {
      setActiveTab("response");
    } else if (stage === "update") {
      setActiveTab("update");
    } else if (stage === "clear") {
      setActiveTab("clear");
    } else if (stage === "triage") {
      setActiveTab("triage");
    } else if (stage === "investigate") {
      setActiveTab("investigate");
    } else if (stage === "report") {
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

  function toggleRiskChecklistItem(
    category: string,
    itemId: string,
    checked: boolean
  ) {
    const criteria = riskChecklistCriteria[category];

    if (!criteria) return;

    const currentSelected = riskChecklistSelections[category] ?? [];
    const nextSelected = checked
      ? currentSelected.includes(itemId)
        ? currentSelected
        : [...currentSelected, itemId]
      : currentSelected.filter((id) => id !== itemId);

    const nextScore = criteria
      .filter((item) => nextSelected.includes(item.id))
      .reduce((total, item) => total + item.points, 0);

    setRiskChecklistSelections((current) => ({
      ...current,
      [category]: nextSelected,
    }));

    updateScore(category, Math.min(criteria.reduce((total, item) => total + item.points, 0), nextScore));
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

function togglePromoterRiskIndicator(
  category: string,
  itemId: string,
  checked: boolean
) {
  const criteria = promoterRiskIndicatorCriteria[category];

  if (!criteria) return;

  const currentSelected =
    promoterRiskIndicatorSelections[category] ?? [];

  const nextSelected = checked
    ? currentSelected.includes(itemId)
      ? currentSelected
      : [...currentSelected, itemId]
    : currentSelected.filter((id) => id !== itemId);

  const nextScore = criteria
    .filter((item) => nextSelected.includes(item.id))
    .reduce((total, item) => total + item.points, 0);

  const categoryMaximum =
    promoterRiskCategories.find((item) => item.name === category)?.max ?? 0;

  setPromoterRiskIndicatorSelections((current) => ({
    ...current,
    [category]: nextSelected,
  }));

  setPromoterScores((current) => ({
    ...current,
    [category]: Math.min(categoryMaximum, nextScore),
  }));

  setPromoterAssessmentMessage("");
}

  function togglePromoterChecklistItem(
    category: string,
    itemId: string,
    checked: boolean
  ) {
    setPromoterChecklistSelections((current) => {
      const existing = current[category] ?? [];

      const updated = checked
        ? existing.includes(itemId)
          ? existing
          : [...existing, itemId]
        : existing.filter((id) => id !== itemId);

      return {
        ...current,
        [category]: updated,
      };
    });

    setPromoterAssessmentMessage("");
  }

  function resetAssessment() {
    setScores({});
    setAssessmentNotes("");
    setAssessmentMessage("");
  }

function resetPromoterAssessment() {
  setPromoterScores({});
  setPromoterChecklistSelections({});
  setPromoterRiskIndicatorSelections({});
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
                {report.contract_address && (
                  <p className="mt-2 break-all text-xs text-slate-500">
                    Contract / Token Address:{" "}
                    <span className="text-slate-400">
                      {report.contract_address}
                    </span>
                  </p>
                )}

                {report.evidence && (
                  <p className="mt-2 break-all text-xs text-slate-500">
                    Evidence:{" "}
                    {/^https?:\/\/\S+$/i.test(report.evidence.trim()) ? (
                      <a
                        href={report.evidence.trim()}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sky-400 underline hover:text-sky-300"
                      >
                        {report.evidence}
                      </a>
                    ) : (
                      <span className="text-slate-400">
                        {report.evidence}
                      </span>
                    )}
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
                    setPromoterChecklistSelections({});
                    setPromoterRiskIndicatorSelections({});
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
                    Triage
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
                    Investigate
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
                    Review
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
                    Publish
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
                    Response
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
                    Update
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
                    Clear
                  </button>
                </div>
              </div>

              {/* Case Overview */}
              {activeTab === "cases" ? (
                <div className="space-y-6 p-5 sm:p-6">
                    <div className="flex flex-wrap justify-end gap-3">
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            setCaseOverviewPreview(await buildCaseOverviewText());
                          } catch (error) {
                            console.error("Case Overview preview error:", error);
                            window.alert(error instanceof Error ? error.message : "Unable to build the Case Overview.");
                          }
                        }}
                        className="rounded-xl border border-slate-600 bg-slate-800 px-4 py-3 text-sm font-semibold text-slate-200 transition hover:bg-slate-700"
                      >
                        Preview Case Overview
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            const report = await buildCaseOverviewText();
                            const doc = new jsPDF({ unit: "mm", format: "a4" });
                            const marginX = 15;
                            const usableWidth = 180;
                            let y = 15;

                            doc.setFont("helvetica", "normal");
                            doc.setFontSize(10);

                            for (const line of report.split("\n")) {
                              const wrapped = doc.splitTextToSize(line || " ", usableWidth);

                              for (const part of wrapped) {
                                if (y > 282) {
                                  doc.addPage();
                                  y = 15;
                                }

                                doc.text(part, marginX, y);
                                y += 5;
                              }
                            }

                            const safeCaseNumber = String(
                              selectedCase?.reportNumber ?? selectedCase?.id ?? "case"
                            ).replace(/[^a-zA-Z0-9-]/g, "-");

                            doc.save(`NG-BL-${safeCaseNumber}-case-overview.pdf`);
                          } catch (error) {
                            console.error("Case Overview PDF error:", error);
                            window.alert(error instanceof Error ? error.message : "Unable to export the Case Overview PDF.");
                          }
                        }}
                        className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm font-semibold text-emerald-400 transition hover:bg-emerald-500/20"
                      >
                        Export Case Overview (PDF)
                      </button>
                    </div>
                    {caseOverviewPreview !== null && (
                      <div className="space-y-3 rounded-xl border border-sky-500/30 bg-sky-500/5 p-4">
                        <h3 className="text-sm font-semibold text-sky-300">
                          Case Overview Preview
                        </h3>
                        <textarea
                          readOnly
                          value={caseOverviewPreview}
                          rows={22}
                          className="w-full rounded-lg border border-slate-700 bg-slate-950 p-3 font-mono text-sm leading-6 text-slate-200"
                        />
                        <div className="flex flex-wrap gap-3">
                          <button
                            type="button"
                            onClick={async () => {
                              try {
                                await navigator.clipboard.writeText(caseOverviewPreview);
                              } catch (error) {
                                console.error("Copy Case Overview error:", error);
                                window.alert("Unable to copy. Please select the preview text and copy it manually.");
                              }
                            }}
                            className="rounded-lg border border-sky-500/40 bg-sky-500/10 px-4 py-2 text-sm font-semibold text-sky-300 hover:bg-sky-500/20"
                          >
                            Copy Case Overview
                          </button>
                          <button
                            type="button"
                            onClick={() => setCaseOverviewPreview(null)}
                            className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800"
                          >
                            Close Preview
                          </button>
                        </div>
                        <p className="text-xs leading-5 text-slate-400">
                          This preview does not publish to X. Review the assessment and supporting evidence before sharing publicly.
                        </p>
                      </div>
                    )}
                  <div>
                    <h3 className="text-sm font-semibold">
                      Case Description
                    </h3>

                    <p className="mt-2 rounded-xl border border-slate-800 bg-slate-950/60 p-4 text-sm leading-6 text-slate-400">
                      {selectedCase.description}
                    </p>
                  </div>

                    <div className="mt-4">
                      <h3 className="text-sm font-semibold">
                        Contract / Token Address
                      </h3>
                      <p className="mt-2 break-all rounded-xl border border-slate-800 bg-slate-950/60 p-4 text-sm text-slate-300">
                        {selectedCase.contractAddress || "Not provided"}
                      </p>
                    </div>

                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => moveCaseToStage("triage")}
                      className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm font-semibold text-emerald-300 transition hover:bg-emerald-500/20"
                    >
                      Triage
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
                        Triage
                      </button>

                      <button
                        type="button"
                        onClick={() => moveCaseToStage("investigate")}
                        className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm font-semibold text-slate-300 transition hover:border-emerald-500/50 hover:text-white"
                      >
                        Investigate
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
                          Open Risk Assess
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => moveCaseToStage("review")}
                        className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm font-semibold text-slate-300 transition hover:border-emerald-500/50 hover:text-white"
                      >
                        Review
                      </button>

                      <button
  type="button"
  onClick={() => setActiveTab("publish")}
  className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm font-semibold text-slate-300 transition hover:border-emerald-500/50 hover:text-white"
>
  Publish
</button>

                      <button
                        type="button"
                        onClick={() => moveCaseToStage("response")}
                        className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm font-semibold text-slate-300 transition hover:border-emerald-500/50 hover:text-white"
                      >
                        Response
                      </button>

                      <button
                        type="button"
                        onClick={() => moveCaseToStage("update")}
                        className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm font-semibold text-slate-300 transition hover:border-emerald-500/50 hover:text-white"
                      >
                        Update
                      </button>

                      <button
                        type="button"
                        onClick={() => moveCaseToStage("clear")}
                        className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm font-semibold text-slate-300 transition hover:border-emerald-500/50 hover:text-white"
                      >
                        Clear Case
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
                      Triage Case
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
                          : "Save Triage"}
                      </button>

                      <button
                        type="button"
                        onClick={() => moveCaseToStage("investigate")}
                        className="rounded-xl bg-amber-500 px-5 py-3 text-sm font-bold text-slate-950 transition hover:bg-amber-400"
                      >
                        Start Investigation
                      </button>

                      <button
                        type="button"
                        disabled
                        className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-300 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        Dismiss Case
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
                      Investigate Case
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
                        onClick={saveInvestigationAssessment}
                        disabled={
                          loadingInvestigation ||
                          !investigationAssessment
                        }
                        className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm font-semibold text-slate-200 transition hover:border-slate-500 hover:bg-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {loadingInvestigation
                          ? "Saving Investigation..."
                          : "Save Investigation"}
                      </button>

                      <button
                        type="button"
                        onClick={() => moveCaseToStage("risk")}
                        className="rounded-xl bg-blue-500 px-5 py-3 text-sm font-bold text-slate-950 transition hover:bg-blue-400"
                      >
                        Continue to Risk Assessment
                      </button>

                      <button
                        type="button"
                        onClick={() => setActiveTab("triage")}
                        className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm font-semibold text-slate-300 transition hover:border-slate-600 hover:bg-slate-900"
                      >
                        Triage
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
                        {selectedCase?.project ?? "Project not available"}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5">
                      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Current Stage
                      </p>

                      <p className="mt-2 text-lg font-bold text-emerald-400">
                        {selectedCase?.stage === "review"
                          ? "Final Investigator Review"
                          : selectedCase?.stage ?? "Not set"}
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
                          checked={reviewChecklist.investigationFindingsReviewed}
                          onChange={(event) =>
                            setReviewChecklist((current) => ({
                              ...current,
                              investigationFindingsReviewed: event.target.checked,
                            }))
                          }
                          className="h-4 w-4 rounded border-slate-700 bg-slate-950"
                        />
                        Investigation findings reviewed
                      </label>

                      <label className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={reviewChecklist.riskAssessmentReviewed}
                          onChange={(event) =>
                            setReviewChecklist((current) => ({
                              ...current,
                              riskAssessmentReviewed: event.target.checked,
                            }))
                          }
                          className="h-4 w-4 rounded border-slate-700 bg-slate-950"
                        />
                        Risk assessment reviewed
                      </label>

                      <label className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={reviewChecklist.evidenceReviewed}
                          onChange={(event) =>
                            setReviewChecklist((current) => ({
                              ...current,
                              evidenceReviewed: event.target.checked,
                            }))
                          }
                          className="h-4 w-4 rounded border-slate-700 bg-slate-950"
                        />
                        Evidence reviewed
                      </label>

                      <label className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={reviewChecklist.readyForPublication}
                          onChange={(event) =>
                            setReviewChecklist((current) => ({
                              ...current,
                              readyForPublication: event.target.checked,
                            }))
                          }
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
                        setActiveTab("investigate");
                      }}
                      className="rounded-xl border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-sm font-semibold text-amber-300 transition hover:border-amber-400/60 hover:bg-amber-500/10 hover:text-amber-200"
                    >
                      Return to Investigation
                    </button>

                    <button
                      type="button"
                      onClick={() => {
    if (!reviewConfirmed) {
      return;
    }

    setActiveTab("publish");
  }}
                      disabled={!reviewConfirmed}
                      className="rounded-xl bg-emerald-500 px-5 py-3 text-sm font-bold text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-emerald-500"
                    >
                      Publish
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
                        {selectedCase?.project ?? "Project not available"}
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
                      Back to Review
                    </button>

                    <button
                      type="button"
                      onClick={async () => {
                        setPublicationChecklistMessage("");

                        if (!selectedCaseId) {
                          setPublicationChecklistMessage("Please select a case first.");
                          return;
                        }

                        try {
                          const response = await fetch("/api/cases", {
                            method: "PATCH",
                            headers: {
                              "Content-Type": "application/json",
                            },
                            body: JSON.stringify({
                                case_id: selectedCaseId,
                                publication_checklist: {
                                  ...publishChecklist,
                                  reviewChecklist,
                                },
                            }),
                          });

                          const result = await response.json();

                          if (!response.ok || !result.success) {
                            throw new Error(
                              result.error ||
                                "Unable to save publication checklist."
                            );
                          }

                          setPublicationChecklistMessage(
                            "Publication checklist saved successfully."
                          );

                          setCases((currentCases) =>
                            currentCases.map((item) =>
                              item.id === selectedCaseId
                                ? {
                                    ...item,
                                    publicationChecklist: {
                                      ...publishChecklist,
                                      reviewChecklist,
                                    },
                                  }
                                : item
                            )
                          );
                        } catch (error) {
                          console.error("Save publication checklist error:", error);

                          setPublicationChecklistMessage(
                            error instanceof Error
                              ? error.message
                              : "Unable to save publication checklist."
                          );
                        }
                      }}
                      className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-5 py-3 text-sm font-bold text-emerald-300 transition hover:bg-emerald-500/20"
                    >
                      Save Checklist
                    </button>
                      {publicationChecklistMessage && (
                        <p
                          className={`mt-3 text-sm font-semibold ${
                            publicationChecklistMessage.toLowerCase().includes("unable") ||
                            publicationChecklistMessage.toLowerCase().includes("error") ||
                            publicationChecklistMessage.toLowerCase().includes("please")
                              ? "text-red-400"
                              : "text-emerald-400"
                          }`}
                          role="status"
                        >
                          {publicationChecklistMessage}
                        </p>
                      )}
                    <button
                      type="button"
                      onClick={() => {
                        if (!publishChecklistComplete) {
                          return;
                        }

                        void moveCaseToStage("publish");
                      }}
                      disabled={!publishChecklistComplete}
                      className="rounded-xl bg-emerald-500 px-5 py-3 text-sm font-bold text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-emerald-500"
                    >
                      Publish Case
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
                        {selectedCase?.project ?? "Project not available"}
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
                          value={responseAssessment?.response_type ?? ""}
                          onChange={(event) =>
                            setResponseAssessment((current) => ({
                              response_type: event.target.value,
                              response_details: current?.response_details ?? "",
                              investigator_notes: current?.investigator_notes ?? "",
                            }))
                          }
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
                          value={responseAssessment?.response_details ?? ""}
                          onChange={(event) =>
                            setResponseAssessment((current) => ({
                              response_type: current?.response_type ?? "",
                              response_details: event.target.value,
                              investigator_notes: current?.investigator_notes ?? "",
                            }))
                          }
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
                          value={responseAssessment?.investigator_notes ?? ""}
                          onChange={(event) =>
                            setResponseAssessment((current) => ({
                              response_type: current?.response_type ?? "",
                              response_details: current?.response_details ?? "",
                              investigator_notes: event.target.value,
                            }))
                          }
                          rows={4}
                          placeholder="Add internal notes about the response..."
                          className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white placeholder:text-slate-600 outline-none transition focus:border-emerald-500"
                        />
                      </div>
                    </div>
                  </div>

                  {responseMessage && (
                    <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 text-sm text-slate-300">
                      {responseMessage}
                    </div>
                  )}

                  <div className="flex flex-wrap gap-3 border-t border-slate-800 pt-5">
                    <button
                      type="button"
                      onClick={saveResponseAssessment}
                      disabled={
                        savingResponse ||
                        loadingResponse ||
                        !selectedCaseId ||
                        !responseAssessment?.response_type
                      }
                      className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-5 py-3 text-sm font-semibold
                    text-emerald-400 transition hover:bg-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {savingResponse
                        ? "Saving..."
                        : "Save Response"}
                    </button>

                    <button
                      type="button"
                      onClick={() => moveCaseToStage("update")}
                      className="rounded-xl border border-slate-700 bg-slate-950 px-5 py-3 text-sm font-semibold text-slate-300 transition hover:border-slate-600 hover:text-white"
                    >
                      Update
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
                        {selectedCase?.project ?? "Project not available"}
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
                          value={updateAssessment?.update_type ?? ""}
                          onChange={(event) =>
                            setUpdateAssessment((current) => ({
                              update_type: event.target.value,
                              update_details: current?.update_details ?? "",
                              investigator_notes: current?.investigator_notes ?? "",
                            }))
                          }
                          disabled={savingUpdate}
                          className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
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
                          value={updateAssessment?.update_details ?? ""}
                          onChange={(event) =>
                            setUpdateAssessment((current) => ({
                              update_type: current?.update_type ?? "",
                              update_details: event.target.value,
                              investigator_notes: current?.investigator_notes ?? "",
                            }))
                          }
                          rows={6}
                          placeholder="Describe the new information, development, evidence, or change..."
                          disabled={savingUpdate}
                          className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white placeholder:text-slate-600 outline-none transition focus:border-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
                        />
                      </div>

                      <div>
                        <label className="text-sm font-semibold text-slate-300">
                          Internal Investigator Notes
                        </label>

                        <textarea
                          value={updateAssessment?.investigator_notes ?? ""}
                          onChange={(event) =>
                            setUpdateAssessment((current) => ({
                              update_type: current?.update_type ?? "",
                              update_details: current?.update_details ?? "",
                              investigator_notes: event.target.value,
                            }))
                          }
                          rows={4}
                          placeholder="Add internal notes about this update..."
                          disabled={savingUpdate}
                          className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white placeholder:text-slate-600 outline-none transition focus:border-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3 border-t border-slate-800 pt-5">
                    <button
                      type="button"
                      onClick={saveUpdateAssessment}
                      disabled={
                        savingUpdate ||
                        !selectedCaseId ||
                        !updateAssessment?.update_type
                      }
                      className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-5 py-3 text-sm font-semibold text-emerald-400 transition hover:bg-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Update
                    </button>

                    <button
                      type="button"
                      onClick={() => moveCaseToStage("clear")}
                      className="rounded-xl border border-slate-700 bg-slate-950 px-5 py-3 text-sm font-semibold text-slate-300 transition hover:border-slate-600 hover:text-white"
                    >
                      Clear
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
                        {selectedCase?.project ?? "Project not available"}
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
                          value={clearanceAssessment?.clearance_decision ?? ""}
                          onChange={(event) =>
                            setClearanceAssessment((current) => ({
                              clearance_decision: event.target.value,
                              clearance_reason: current?.clearance_reason ?? "",
                              investigator_notes: current?.investigator_notes ?? "",
                            }))
                          }
                          disabled={loadingClearance || savingClearance}
                          className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
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
                          value={clearanceAssessment?.clearance_reason ?? ""}
                          onChange={(event) =>
                            setClearanceAssessment((current) => ({
                              clearance_decision: current?.clearance_decision ?? "",
                              clearance_reason: event.target.value,
                              investigator_notes: current?.investigator_notes ?? "",
                            }))
                          }
                          rows={6}
                          placeholder="Explain why this case is being cleared and provide the supporting reasoning..."
                          disabled={loadingClearance || savingClearance}
                          className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white placeholder:text-slate-600 outline-none transition focus:border-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
                        />
                      </div>

                      <div>
                        <label className="text-sm font-semibold text-slate-300">
                          Internal Investigator Notes
                        </label>

                        <textarea
                          value={clearanceAssessment?.investigator_notes ?? ""}
                          onChange={(event) =>
                            setClearanceAssessment((current) => ({
                              clearance_decision: current?.clearance_decision ?? "",
                              clearance_reason: current?.clearance_reason ?? "",
                              investigator_notes: event.target.value,
                            }))
                          }
                          rows={4}
                          placeholder="Add final internal notes about the case resolution..."
                          disabled={loadingClearance || savingClearance}
                          className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white placeholder:text-slate-600 outline-none transition focus:border-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3 border-t border-slate-800 pt-5">
                    <button
                      type="button"
                      onClick={saveClearanceAssessment}
                      disabled={
                        savingClearance ||
                        loadingClearance ||
                        !selectedCaseId ||
                        !clearanceAssessment?.clearance_decision
                      }
                      className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-5 py-3 text-sm font-semibold text-emerald-400 transition hover:bg-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {savingClearance
                        ? "Saving..."
                        : "Save Clearance"}
                    </button>

                    {clearanceMessage && (
                      <div className="mt-4 w-full rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 text-sm text-emerald-400">
                        {clearanceMessage}
                      </div>
                    )}

                    <button
                      type="button"
                      disabled
                      className="rounded-xl bg-emerald-500 px-5 py-3 text-sm font-bold text-slate-950 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Clear Case
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
                          Project / Token Risk Assessment
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
                          Scam / Fraud Promoter Assessment
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

                                  <div className="mt-4 w-full space-y-3">
                                    <div className="flex flex-wrap items-center gap-2">
                                      <span className={`rounded-lg border px-2 py-1 text-[10px] font-semibold uppercase tracking-wide ${scoreBand.className}`}>
                                        {scoreBand.label}
                                      </span>
                                      <span className={`rounded-lg border px-3 py-1 text-sm font-semibold ${scoreBand.className}`}>
                                        {value} / {category.max}
                                      </span>
                                      <span className="text-xs text-slate-500">
                                        Select only indicators supported by evidence.
                                      </span>
                                    </div>

                                    <div className="space-y-2">
                                      {(riskChecklistCriteria[category.name] ?? []).map((item) => {
                                        const selected = riskChecklistSelections[category.name] ?? [];

                                        return (
                                          <label
                                            key={item.id}
                                            className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-800 bg-slate-900/60 p-3 hover:border-emerald-500/40"
                                          >
                                            <input
                                              type="checkbox"
                                              checked={selected.includes(item.id)}
                                              onChange={(event) =>
                                                toggleRiskChecklistItem(
                                                  category.name,
                                                  item.id,
                                                  event.target.checked
                                                )
                                              }
                                              className="mt-1 h-4 w-4 shrink-0 accent-emerald-500"
                                            />
                                            <span className="flex-1 text-xs leading-5 text-slate-300">
                                              {item.label}
                                            </span>
                                            <span className="shrink-0 text-xs font-semibold text-amber-400">
                                              +{item.points}
                                            </span>
                                          </label>
                                        );
                                      })}
                                    </div>

                                    <p className="text-[11px] leading-5 text-slate-500">
                                      Unchecked indicators are not confirmed findings. A zero score does not establish that a project is safe.
                                    </p>
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

                      {/* Promoter Identity & Affiliation Verification */}
                      <div className="mb-5 rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
                        <h3 className="text-sm font-semibold">
                          Identity &amp; Affiliation Verification
                        </h3>

                        <p className="mt-1 text-xs leading-5 text-slate-500">
                          Record which verification checks have been completed.
                          A checked item records a completed check; it does not
                          by itself establish wrongdoing.
                        </p>

                        <div className="mt-4 grid gap-3 sm:grid-cols-2">
                          {(promoterVerificationChecklist["Identity & Affiliation"] ?? []).map(
                            (item) => (
                              <label
                                key={item.id}
                                className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-800 p-3 text-sm text-slate-300"
                              >
                                <input
                                  type="checkbox"
                                  checked={(
                                    promoterChecklistSelections["Identity & Affiliation"] ?? []
                                  ).includes(item.id)}
                                  onChange={(event) =>
                                    togglePromoterChecklistItem(
                                      "Identity & Affiliation",
                                      item.id,
                                      event.target.checked
                                    )
                                  }
                                  className="mt-1 accent-emerald-500"
                                />
                                <span>{item.label}</span>
                              </label>
                            )
                          )}
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


                                  <div className="flex min-w-[220px] items-center justify-end gap-3">
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
                                        <span className="text-xs font-normal text-slate-500">
                                          /{category.max}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                    {(promoterRiskIndicatorCriteria[category.name] ?? []).length > 0 && (
                                      <div className="mt-4 border-t border-orange-500/20 pt-4">
                                        <h5 className="mb-2 text-xs font-semibold uppercase tracking-wide text-orange-400">
                                          Evidence-Based Risk Indicators
                                        </h5>

                                        <p className="mb-3 text-xs leading-5 text-slate-500">
                                          Select an indicator only when supported by documented evidence.
                                          Selected indicators automatically contribute to this category's risk score.
                                        </p>

                                        <div className="grid gap-3 sm:grid-cols-2">
                                          {(promoterRiskIndicatorCriteria[category.name] ?? []).map(
                                            (item) => (
                                              <label
                                                key={item.id}
                                                className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-800 p-3 text-sm text-slate-300"
                                              >
                                                <input
                                                  type="checkbox"
                                                  checked={(
                                                    promoterRiskIndicatorSelections[category.name] ?? []
                                                  ).includes(item.id)}
                                                  onChange={(event) =>
                                                    togglePromoterRiskIndicator(
                                                      category.name,
                                                      item.id,
                                                      event.target.checked
                                                    )
                                                  }
                                                  className="mt-1 accent-orange-500"
                                                />

                                                <span className="flex-1">
                                                  {item.label}
                                                </span>

                                                <span className="shrink-0 text-xs font-semibold text-orange-400">
                                                  +{item.points}
                                                </span>
                                              </label>
                                            )
                                          )}
                                        </div>
                                      </div>
                                    )}

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
                          onClick={() => {
                            setActiveTab("investigate");
                          }}
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
                              : "Save Promoter Assessment - Next Step"}
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