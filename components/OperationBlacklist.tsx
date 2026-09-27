"use client";

const investigationSteps = [
  {
    icon: "📩",
    title: "Report",
    text: "A potential threat is brought to NovaGaia for examination.",
  },
  {
    icon: "📋",
    title: "Triage",
    text: "The report is reviewed to determine whether it contains enough information to investigate.",
  },
  {
    icon: "🔎",
    title: "Investigate",
    text: "Researchers examine available on-chain, off-chain, and community evidence.",
  },
  {
    icon: "📊",
    title: "Risk Assess",
    text: "Observable risk indicators are assessed using the NovaGaia Risk Score framework.",
  },
  {
    icon: "👥",
    title: "Review",
    text: "Findings are reviewed before publication whenever independent review is practical.",
  },
  {
    icon: "📰",
    title: "Publish",
    text: "Evidence and findings can become part of the public Threat Intelligence Database.",
  },
  {
    icon: "💬",
    title: "Response",
    text: "Relevant responses, corrections, or additional information can be considered.",
  },
  {
    icon: "🔄",
    title: "Update",
    text: "Reports can be corrected, downgraded, escalated, or updated as new evidence appears.",
  },
];

const riskLevels = [
  {
    icon: "🟢",
    title: "Low Concern",
    text: "No significant concerns identified from the information reviewed.",
  },
  {
    icon: "🟡",
    title: "Watch",
    text: "Some warning indicators require attention.",
  },
  {
    icon: "🟠",
    title: "High Risk",
    text: "Multiple significant risk indicators identified.",
  },
  {
    icon: "🔴",
    title: "Critical",
    text: "Strong evidence of an immediate threat.",
  },
  {
    icon: "⚫",
    title: "Confirmed Fraud",
    text: "Reserved for cases with strong, verifiable evidence of fraudulent activity.",
  },
];

const principles = [
  "Evidence before accusation.",
  "Facts must be separated from interpretation and opinion.",
  "Independent review whenever possible.",
  "Give the subject an opportunity to respond when practical.",
  "Reports can be corrected, downgraded, escalated, or updated.",
  "Never accept payment to remove or manipulate an investigation.",
  "Protection and education — not harassment, retaliation, or financial advice.",
];

export default function OperationBlacklist() {
  return (
    <section
      id="operation-blacklist"
      className="relative overflow-hidden border-t border-white/10 bg-black px-6 py-24"
    >
      {/* Background glow */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-20 h-80 w-80 -translate-x-1/2 rounded-full bg-emerald-500/10 blur-[120px]" />
        <div className="absolute right-0 top-1/2 h-64 w-64 rounded-full bg-cyan-500/5 blur-[100px]" />
      </div>

      <div className="relative mx-auto max-w-6xl">
        {/* Section heading */}
        <div className="mx-auto mb-14 max-w-3xl text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-emerald-300">
            🛡️ Operation Blacklist
          </div>

          <h2 className="text-4xl font-bold tracking-tight text-white md:text-5xl">
            We don't blacklist people.
            <span className="block bg-gradient-to-r from-emerald-300 via-cyan-300 to-blue-400 bg-clip-text text-transparent">
              We document evidence.
            </span>
          </h2>

          <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-white/60 md:text-lg">
            Operation Blacklist is NovaGaia's public threat-intelligence
            framework for identifying, investigating, documenting, and educating
            the community about potential crypto threats.
          </p>

          <p className="mt-4 text-sm font-medium text-emerald-300/80">
            NovaGaia Threat Intelligence Database
          </p>
        </div>

        {/* Intro card */}
        <div className="mx-auto mb-8 max-w-4xl rounded-3xl border border-white/10 bg-white/[0.03] p-6 shadow-2xl shadow-emerald-950/20 backdrop-blur-xl md:p-8">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-emerald-400/20 bg-emerald-400/10 text-2xl">
              🛡️
            </div>

            <div>
              <h3 className="text-lg font-semibold text-white">
                What is Operation Blacklist?
              </h3>

              <p className="mt-2 leading-7 text-white/60">
                It is a system for turning community observations into
                evidence-based investigations. A report is a starting point,
                not a verdict.
              </p>

              <p className="mt-3 leading-7 text-white/60">
                NovaGaia investigates before accusing, separates facts from
                interpretation, and updates reports when new evidence becomes
                available.
              </p>
            </div>
          </div>
        </div>

        {/* FAQ-style information blocks */}
        <div className="mx-auto max-w-4xl space-y-4">
          {/* Investigation process */}
          <details
            open
            className="group rounded-3xl border border-white/10 bg-white/[0.03] backdrop-blur-xl"
          >
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-6 md:p-7">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300/70">
                  Intelligence Process
                </p>
                <h3 className="mt-1 text-lg font-semibold text-white">
                  How does an investigation work?
                </h3>
              </div>

              <span className="text-xl text-white/40 transition-transform group-open:rotate-45">
                +
              </span>
            </summary>

            <div className="border-t border-white/10 px-6 pb-7 pt-6 md:px-7">
              <div className="grid gap-3 sm:grid-cols-2">
                {investigationSteps.map((step) => (
                  <div
                    key={step.title}
                    className="rounded-2xl border border-white/10 bg-black/30 p-4"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{step.icon}</span>
                      <span className="font-semibold text-white">
                        {step.title}
                      </span>
                    </div>

                    <p className="mt-2 text-sm leading-6 text-white/50">
                      {step.text}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-5 rounded-2xl border border-emerald-400/10 bg-emerald-400/[0.04] p-4 text-center">
                <p className="text-sm font-medium tracking-wide text-emerald-300">
                  Evidence → Research → Risk Assessment → Review → Publication
                </p>
              </div>
            </div>
          </details>

          {/* Risk levels */}
          <details className="group rounded-3xl border border-white/10 bg-white/[0.03] backdrop-blur-xl">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-6 md:p-7">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300/70">
                  Risk Intelligence
                </p>
                <h3 className="mt-1 text-lg font-semibold text-white">
                  What do the risk levels mean?
                </h3>
              </div>

              <span className="text-xl text-white/40 transition-transform group-open:rotate-45">
                +
              </span>
            </summary>

            <div className="border-t border-white/10 px-6 pb-7 pt-6 md:px-7">
              <div className="space-y-3">
                {riskLevels.map((level) => (
                  <div
                    key={level.title}
                    className="flex gap-4 rounded-2xl border border-white/10 bg-black/30 p-4"
                  >
                    <span className="text-xl">{level.icon}</span>

                    <div>
                      <h4 className="font-semibold text-white">
                        {level.title}
                      </h4>

                      <p className="mt-1 text-sm leading-6 text-white/50">
                        {level.text}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </details>

          {/* Principles */}
          <details className="group rounded-3xl border border-white/10 bg-white/[0.03] backdrop-blur-xl">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-6 md:p-7">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-300/70">
                  NovaGaia Principles
                </p>
                <h3 className="mt-1 text-lg font-semibold text-white">
                  What keeps the system accountable?
                </h3>
              </div>

              <span className="text-xl text-white/40 transition-transform group-open:rotate-45">
                +
              </span>
            </summary>

            <div className="border-t border-white/10 px-6 pb-7 pt-6 md:px-7">
              <div className="space-y-3">
                {principles.map((principle, index) => (
                  <div
                    key={principle}
                    className="flex gap-3 rounded-2xl border border-white/10 bg-black/30 p-4"
                  >
                    <span className="font-mono text-sm text-emerald-300">
                      0{index + 1}
                    </span>

                    <p className="text-sm leading-6 text-white/60">
                      {principle}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </details>
        </div>

        {/* Bottom message */}
        <div className="mx-auto mt-10 max-w-4xl rounded-3xl border border-emerald-400/20 bg-gradient-to-br from-emerald-400/[0.08] to-cyan-400/[0.04] p-7 text-center md:p-9">
          <p className="text-lg font-semibold text-white md:text-xl">
            A NovaGaia warning is a signal to investigate —
            <span className="text-emerald-300"> not an instruction to buy or sell.</span>
          </p>

          <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-white/50">
            Risk assessments reflect observable indicators and available
            evidence. They are not automatically declarations of fraud or
            financial advice.
          </p>

          <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
            <a
              href="#report"
              className="rounded-full bg-emerald-400 px-6 py-3 text-sm font-semibold text-black transition hover:bg-emerald-300"
            >
              🚨 Report a Threat
            </a>

            <a
              href="#intelligence"
              className="rounded-full border border-white/15 bg-white/5 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              🔎 Explore Intelligence
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}