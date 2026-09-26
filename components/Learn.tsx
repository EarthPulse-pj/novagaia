"use client";

import { motion } from "framer-motion";

const learningPaths = [
  {
    icon: "🛡️",
    title: "Crypto Safety",
    description:
      "Learn how to recognize scams, suspicious projects, wallet risks, phishing attempts, and common crypto attack patterns.",
  },
  {
    icon: "🔗",
    title: "Blockchain Basics",
    description:
      "Understand wallets, transactions, tokens, smart contracts, networks, liquidity, and the fundamentals behind blockchain systems.",
  },
  {
    icon: "🔎",
    title: "Research Skills",
    description:
      "Develop practical habits for checking claims, examining project information, comparing evidence, and asking better questions.",
  },
  {
    icon: "🧠",
    title: "AI & Intelligence",
    description:
      "Explore how artificial intelligence can help communities organize information, identify patterns, and improve crypto research.",
  },
  {
    icon: "📊",
    title: "Project Analysis",
    description:
      "Learn how to examine tokenomics, team information, community signals, documentation, activity, and other important project indicators.",
  },
  {
    icon: "🌎",
    title: "Collective Learning",
    description:
      "Share knowledge with the community and learn from different perspectives, investigations, experiences, and verified evidence.",
  },
];

const habits = [
  "Question extraordinary claims.",
  "Check the source before sharing.",
  "Verify information independently.",
  "Understand the risks before participating.",
];

export default function Learn() {
  return (
    <section
      id="learn"
      className="relative overflow-hidden border-y border-emerald-900/40 px-6 py-24"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(34,211,238,0.08),transparent_28%),radial-gradient(circle_at_80%_70%,rgba(16,185,129,0.10),transparent_30%)]" />

      <div className="relative mx-auto max-w-7xl">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-bold uppercase tracking-[0.35em] text-cyan-300">
            NovaGaia Learning
          </p>

          <h2 className="mt-4 text-4xl font-black tracking-tight text-white sm:text-5xl lg:text-6xl">
            Learn before you leap.
          </h2>

          <p className="mt-6 text-lg leading-8 text-gray-300">
            Crypto education should help people make better decisions, not
            simply make them more confident. NovaGaia turns research,
            intelligence, and community knowledge into practical learning.
          </p>
        </div>

        <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {learningPaths.map((path, index) => (
            <motion.div
              key={path.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.5, delay: index * 0.06 }}
              whileHover={{ y: -6 }}
              className="rounded-2xl border border-emerald-800/60 bg-black/40 p-7 backdrop-blur-sm"
            >
              <div className="text-4xl">{path.icon}</div>

              <h3 className="mt-5 text-2xl font-bold text-emerald-400">
                {path.title}
              </h3>

              <p className="mt-4 leading-7 text-gray-300">
                {path.description}
              </p>
            </motion.div>
          ))}
        </div>

        <div className="mt-14 rounded-3xl border border-cyan-500/20 bg-cyan-500/[0.03] p-8 lg:p-10">
          <div className="grid gap-10 lg:grid-cols-[1fr_1fr] lg:items-center">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.3em] text-cyan-300">
                The NovaGaia habit
              </p>

              <h3 className="mt-3 text-3xl font-black text-white sm:text-4xl">
                Build knowledge that protects you.
              </h3>

              <p className="mt-5 max-w-2xl leading-7 text-gray-400">
                The goal isn't to predict every move in crypto. It's to
                develop the knowledge and habits needed to recognize risk,
                evaluate information, and make decisions with greater
                awareness.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {habits.map((habit, index) => (
                <div
                  key={habit}
                  className="rounded-xl border border-white/10 bg-black/40 p-4"
                >
                  <div className="flex items-start gap-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-400 text-sm font-black text-black">
                      {index + 1}
                    </span>

                    <span className="text-sm font-semibold leading-6 text-gray-200">
                      {habit}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-10 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-gray-500">
            Protect. Research. Learn.
          </p>
        </div>
      </div>
    </section>
  );
}