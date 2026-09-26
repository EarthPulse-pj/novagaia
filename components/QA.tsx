"use client";

import { motion } from "framer-motion";
import { useState } from "react";

const questions = [
  {
    question: "What is NovaGaia?",
    answer:
      "NovaGaia is a community-driven crypto intelligence and education ecosystem focused on helping people navigate crypto through research, transparency, evidence, and collective intelligence.",
  },
  {
    question: "What does “Protect. Research. Learn.” mean?",
    answer:
      "Protect means recognizing risks and potential threats. Research means checking claims and examining evidence. Learn means building the knowledge and habits needed to make safer, more informed decisions.",
  },
  {
    question: "How does NovaGaia approach crypto research?",
    answer:
      "NovaGaia focuses on evidence rather than hype. Research may involve examining project information, documentation, public claims, community signals, on-chain activity, and other available evidence before reaching a conclusion.",
  },
  {
    question: "Is NovaGaia financial advice?",
    answer:
      "No. NovaGaia is designed for education, research, and community intelligence. Information shared through the ecosystem should not be treated as financial, investment, legal, or other professional advice.",
  },
  {
    question: "How can I contribute to NovaGaia intelligence?",
    answer:
      "Community members can contribute by sharing useful information, reporting suspicious activity, documenting evidence, asking questions, checking sources, and helping others learn. Quality and verification are more important than simply being first.",
  },
  {
    question: "What should I do before trusting a crypto project?",
    answer:
      "Slow down and investigate. Check the project's official information, understand what it claims to do, verify important statements independently, examine available evidence, and consider the risks before taking action.",
  },
];

export default function QA() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section
      id="qa"
      className="relative overflow-hidden border-y border-emerald-900/40 px-6 py-24"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_75%_30%,rgba(16,185,129,0.10),transparent_30%),radial-gradient(circle_at_20%_70%,rgba(34,211,238,0.07),transparent_28%)]" />

      <div className="relative mx-auto max-w-5xl">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-bold uppercase tracking-[0.35em] text-cyan-300">
            NovaGaia Q&A
          </p>

          <h2 className="mt-4 text-4xl font-black tracking-tight text-white sm:text-5xl lg:text-6xl">
            Questions before conclusions.
          </h2>

          <p className="mt-6 text-lg leading-8 text-gray-300">
            Start with the fundamentals. Explore common questions about
            NovaGaia, crypto research, community intelligence, and safer
            decision-making.
          </p>
        </div>

        <div className="mt-14 space-y-4">
          {questions.map((item, index) => {
            const isOpen = openIndex === index;

            return (
              <motion.div
                key={item.question}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.45, delay: index * 0.04 }}
                className="overflow-hidden rounded-2xl border border-emerald-800/60 bg-black/40 backdrop-blur-sm"
              >
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center justify-between gap-6 px-6 py-5 text-left transition hover:bg-emerald-950/30 sm:px-7"
                >
                  <span className="text-base font-bold text-white sm:text-lg">
                    {item.question}
                  </span>

                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-emerald-400/40 text-xl font-light text-emerald-400 transition-transform ${
                      isOpen ? "rotate-45" : ""
                    }`}
                    aria-hidden="true"
                  >
                    +
                  </span>
                </button>

                {isOpen && (
                  <div className="border-t border-white/10 px-6 pb-6 pt-5 sm:px-7">
                    <p className="max-w-4xl leading-7 text-gray-300">
                      {item.answer}
                    </p>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>

        <div className="mt-12 rounded-3xl border border-cyan-500/20 bg-cyan-500/[0.03] p-8 text-center">
          <p className="text-sm font-bold uppercase tracking-[0.3em] text-cyan-300">
            NovaGaia Philosophy
          </p>

          <h3 className="mt-3 text-2xl font-black text-white sm:text-3xl">
            Don&apos;t trust the hype.
          </h3>

          <p className="mx-auto mt-4 max-w-2xl leading-7 text-gray-400">
            Ask questions. Check the evidence. Understand the risks. Then
            make your own informed decision.
          </p>

          <div className="mt-6 flex flex-wrap justify-center gap-3">
            {["Protect", "Research", "Learn"].map((item) => (
              <span
                key={item}
                className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-5 py-2 text-sm font-bold text-emerald-300"
              >
                {item}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}