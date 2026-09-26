"use client";

import Image from "next/image";
import { motion } from "framer-motion";

export default function Hero() {
  return (
    <section id="home" className="relative min-h-screen overflow-hidden px-6 pb-20 pt-32 sm:pt-36">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_75%_42%,rgba(16,185,129,0.16),transparent_28%),radial-gradient(circle_at_15%_30%,rgba(34,211,238,0.08),transparent_24%)]" />

      <div className="relative mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[1.08fr_0.92fr]">
        <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7 }}>
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300">
            <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.8)]" />
            Community-driven crypto intelligence
          </div>

          <p className="text-sm font-bold uppercase tracking-[0.45em] text-cyan-300">
            Protect. Research. Learn.
          </p>

          <h1 className="mt-4 max-w-3xl text-5xl font-black tracking-tight text-white sm:text-6xl lg:text-7xl">
            Navigate crypto with{" "}
            <span className="text-emerald-400">evidence.</span>
          </h1>

          <p className="mt-6 max-w-2xl text-lg leading-8 text-gray-300 sm:text-xl">
            NovaGaia is a community-driven crypto intelligence and education ecosystem. We investigate potential threats, document evidence, and help people learn how to navigate crypto more safely.
          </p>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <a href="#report" className="rounded-xl bg-emerald-400 px-7 py-4 text-center font-bold text-black shadow-[0_0_30px_rgba(52,211,153,0.18)] transition hover:bg-emerald-300">
              🚨 Report a Threat
            </a>
            <a href="#intelligence" className="rounded-xl border border-cyan-400/60 bg-cyan-400/5 px-7 py-4 text-center font-bold text-cyan-200 transition hover:bg-cyan-400/10">
              🔎 Explore Intelligence
            </a>
          </div>

          <div className="mt-10 grid max-w-2xl grid-cols-1 gap-3 sm:grid-cols-3">
            {[
              ["🛡️", "Protect", "Identify risk signals"],
              ["🔎", "Research", "Verify the evidence"],
              ["🎓", "Learn", "Build safer habits"],
            ].map(([icon, title, text]) => (
              <div key={title} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur-sm">
                <div className="text-xl">{icon}</div>
                <p className="mt-2 font-bold text-white">{title}</p>
                <p className="mt-1 text-xs leading-5 text-gray-500">{text}</p>
              </div>
            ))}
          </div>

          <p className="mt-8 text-sm font-medium text-gray-500">
            <span className="text-gray-300">Don&apos;t trust the hype.</span> Verify the evidence.
          </p>
        </motion.div>

        <motion.div initial={{ opacity: 0, scale: 0.88 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8, delay: 0.1 }} className="relative flex justify-center lg:justify-end">
          <div className="absolute h-72 w-72 rounded-full bg-emerald-400/10 blur-3xl sm:h-96 sm:w-96" />
          <div className="relative rounded-[2rem] border border-emerald-400/20 bg-gradient-to-br from-emerald-950/40 via-black/30 to-cyan-950/30 p-5 shadow-2xl">
            <Image
              src="/NovaPX1.png"
              alt="NovaPX1, the Guardian of NovaGaia"
              width={700}
              height={700}
              priority
              className="w-full max-w-sm drop-shadow-[0_0_45px_rgba(34,211,238,0.35)] sm:max-w-md"
            />
            <div className="absolute bottom-5 left-5 right-5 rounded-2xl border border-white/10 bg-black/70 p-4 backdrop-blur-md">
              <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-emerald-400">NovaPX1</p>
              <p className="mt-1 font-bold text-white">The Guardian of NovaGaia</p>
              <p className="mt-1 text-xs text-gray-400">Protect the community. Follow the evidence.</p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
