"use client";

import { motion } from "framer-motion";

const intelligenceAreas = [
  {
    icon: "🛡️",
    title: "Threat Intelligence",
    description:
      "Identify suspicious projects, warning signs, scams, and potential threats before they become costly mistakes.",
  },
  {
    icon: "🔎",
    title: "Evidence & Research",
    description:
      "Separate claims from evidence by examining project information, on-chain activity, documentation, and public signals.",
  },
  {
    icon: "🧠",
    title: "Collective Intelligence",
    description:
      "Bring community observations together so useful information can be investigated, documented, and shared.",
  },
];

const principles = [
  "Verify before you trust.",
  "Evidence before hype.",
  "Community before speculation.",
];

export default function Intelligence() {
  return (
    <section
      id="intelligence"
      className="relative overflow-hidden border-y border-emerald-900/40 px-6 py-24"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(16,185,129,0.12),transparent_35%)]" />

      <div className="relative mx-auto max-w-7xl">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-bold uppercase tracking-[0.35em] text-cyan-300">
            NovaGaia Intelligence
          </p>

          <h2 className="mt-4 text-4xl font-black tracking-tight text-white sm:text-5xl lg:text-6xl">
            Think beyond the hype.
          </h2>

          <p className="mt-6 text-lg leading-8 text-gray-300">
            NovaGaia helps the community investigate crypto risks, examine
            evidence, and turn scattered information into useful intelligence.
          </p>
        </div>

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {intelligenceAreas.map((area, index) => (
            <motion.div
              key={area.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.5, delay: index * 0.08 }}
              whileHover={{ y: -6 }}
              className="rounded-2xl border border-emerald-800/70 bg-black/40 p-7 backdrop-blur-sm"
            >
              <div className="text-4xl">{area.icon}</div>

              <h3 className="mt-5 text-2xl font-bold text-emerald-400">
                {area.title}
              </h3>

              <p className="mt-4 leading-7 text-gray-300">
                {area.description}
              </p>
            </motion.div>
          ))}
        </div>

        <div className="mt-12 grid gap-8 rounded-3xl border border-cyan-500/20 bg-cyan-500/[0.03] p-8 lg:grid-cols-[1fr_auto] lg:items-center lg:p-10">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.3em] text-cyan-300">
              Our intelligence philosophy
            </p>

            <h3 className="mt-3 text-3xl font-black text-white sm:text-4xl">
              Don&apos;t trust the hype.
            </h3>

            <p className="mt-4 max-w-2xl leading-7 text-gray-400">
              Crypto moves quickly. Good decisions require patience,
              verification, and a willingness to question what everyone else
              is repeating.
            </p>
          </div>

          <div className="space-y-3">
            {principles.map((principle, index) => (
              <div
                key={principle}
                className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/40 px-5 py-3"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-400 text-sm font-black text-black">
                  {index + 1}
                </span>

                <span className="font-semibold text-gray-200">
                  {principle}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}