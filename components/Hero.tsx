"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import {
  NVGAI_TOKEN_ADDRESS,
  NVGAI_RAYDIUM_REFERRAL_URL,
  NVGAI_EXPLORER_URL,
} from "@/config/token";

const NOVAPX1_TOKEN_ADDRESS =
  "5PEyzvHSLGJgHFm8kheKfZRiMpwV2mbkAts8X73ipump";

const NOVAPX1_EXPLORER_URL =
  "https://explorer.solana.com/address/5PEyzvHSLGJgHFm8kheKfZRiMpwV2mbkAts8X73ipump";

export default function Hero() {
  return (
    <section
      id="home"
      className="
        min-h-screen
        flex
        items-center
        px-6
        py-24
      "
    >
      <div
        className="
          mx-auto
          grid
          max-w-7xl
          items-center
          gap-12
          md:grid-cols-2
        "
      >
        {/* LEFT CONTENT */}

        <motion.div
          initial={{
            opacity: 0,
            x: -50,
          }}
          animate={{
            opacity: 1,
            x: 0,
          }}
          transition={{
            duration: 0.8,
          }}
        >
          {/* TAGLINE */}

          <p
            className="
              mb-5
              inline-block
              rounded-full
              border
              border-cyan-400
              bg-cyan-400/10
              px-5
              py-2
              text-sm
              text-cyan-300
            "
          >
            🤖 Building A Smarter Future With AI & Blockchain
          </p>

          {/* TITLE */}

          <h1
            className="
              text-5xl
              font-extrabold
              text-emerald-400
              sm:text-6xl
              md:text-7xl
            "
          >
            NovaGaia
          </h1>

          {/* SUBTITLE */}

          <h2
            className="
              mt-4
              text-2xl
              font-semibold
              text-white
              sm:text-3xl
            "
          >
            One Planet. One Intelligence. One Community.
          </h2>

          {/* DESCRIPTION */}

          <p
            className="
              mt-6
              max-w-xl
              text-lg
              leading-8
              text-gray-300
            "
          >
            NovaGaia (NVGAI) is a global community exploring
            Artificial Intelligence, Blockchain Technology,
            Collective Intelligence, and sustainable innovation
            to help build a smarter, safer, and more connected future.
          </p>

          {/* MAIN BUTTONS */}

          <div
            className="
              mt-10
              flex
              flex-col
              gap-4
              sm:flex-row
            "
          >
            {/* WHITEPAPER */}

            <a
              href="/NovaGaia-Whitepaper-v1.4.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="
                rounded-xl
                bg-emerald-400
                px-8
                py-4
                text-center
                font-bold
                text-black
                transition
                hover:bg-emerald-300
              "
            >
              📄 View Whitepaper
            </a>

            {/* COMMUNITY */}

            <a
              href="#community"
              className="
                rounded-xl
                border
                border-cyan-400
                px-8
                py-4
                text-center
                text-white
                transition
                hover:bg-cyan-900/40
              "
            >
              🌐 Join Community
            </a>
          </div>

          {/* ============================= */}
          {/* NVGAI TOKEN SECTION */}
          {/* ============================= */}

          <div className="mt-8 max-w-xl">
            {/* TOKEN ADDRESS LABEL */}

            <p className="mb-2 text-sm font-semibold text-cyan-300">
              🪙 NVGAI Contract Address
            </p>

            {/* TOKEN ADDRESS + COPY BUTTON */}

            <div className="flex flex-col gap-3 sm:flex-row">
              <div
                className="
                  flex-1
                  rounded-xl
                  border
                  border-cyan-400/30
                  bg-black/40
                  px-4
                  py-3
                "
              >
                <p className="break-all font-mono text-sm text-gray-300">
                  {NVGAI_TOKEN_ADDRESS}
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(
                    NVGAI_TOKEN_ADDRESS
                  );
                }}
                className="
                  rounded-xl
                  border
                  border-cyan-400
                  px-5
                  py-3
                  font-semibold
                  text-cyan-300
                  transition
                  hover:bg-cyan-900/40
                "
              >
                📋 Copy
              </button>
            </div>

            {/* TOKEN ACTION BUTTONS */}

            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              {/* RAYDIUM REFERRAL / TRADE BUTTON */}

              <a
                href={NVGAI_RAYDIUM_REFERRAL_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="
                  rounded-xl
                  bg-emerald-400
                  px-6
                  py-3
                  text-center
                  font-bold
                  text-black
                  transition
                  hover:bg-emerald-300
                "
              >
                🚀 Buy / Trade NVGAI
              </a>

              {/* SOLANA EXPLORER */}

              <a
                href={NVGAI_EXPLORER_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="
                  rounded-xl
                  border
                  border-cyan-400
                  px-6
                  py-3
                  text-center
                  font-semibold
                  text-cyan-300
                  transition
                  hover:bg-cyan-900/40
                "
              >
                🔎 View Contract
              </a>
            </div>

            {/* SMALL REFERRAL DISCLOSURE */}

            <p className="mt-3 text-xs leading-5 text-gray-500">
              Trading link includes NovaGaia's official Raydium referral
              attribution.
            </p>
          </div>

          {/* ====================================== */}
          {/* NOVAPX1 CONTRACT SECTION */}
          {/* ====================================== */}

          <div
            className="
              mt-8
              max-w-xl
              rounded-2xl
              border
              border-emerald-500/30
              bg-gradient-to-br
              from-emerald-950/40
              via-black/50
              to-cyan-950/40
              p-5
            "
          >
            {/* NOVAPX1 TITLE */}

            <div className="mb-4 flex items-center gap-3">
              <div
                className="
                  flex
                  h-10
                  w-10
                  items-center
                  justify-center
                  rounded-full
                  border
                  border-emerald-400/40
                  bg-emerald-500/10
                  text-xl
                "
              >
                🛡️
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
                  NovaGaia Guardian
                </p>

                <h3 className="text-xl font-bold text-white">
                  NOVAPX1
                </h3>
              </div>
            </div>

            {/* NOVAPX1 DESCRIPTION */}

            <p className="mb-4 text-sm leading-6 text-gray-400">
              NOVAPX1 is a community meme token inspired by the
              NovaGaia universe and created to represent the spirit,
              energy, and growing community behind NovaGaia.
            </p>

            {/* NOVAPX1 ADDRESS LABEL */}

            <p className="mb-2 text-sm font-semibold text-emerald-300">
              🛡️ NOVAPX1 Contract Address
            </p>

            {/* NOVAPX1 ADDRESS + COPY */}

            <div className="flex flex-col gap-3 sm:flex-row">
              <div
                className="
                  flex-1
                  rounded-xl
                  border
                  border-emerald-400/30
                  bg-black/50
                  px-4
                  py-3
                "
              >
                <p className="break-all font-mono text-sm text-gray-300">
                  {NOVAPX1_TOKEN_ADDRESS}
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(
                    NOVAPX1_TOKEN_ADDRESS
                  );
                }}
                className="
                  rounded-xl
                  border
                  border-emerald-400
                  px-5
                  py-3
                  font-semibold
                  text-emerald-300
                  transition
                  hover:bg-emerald-900/40
                "
              >
                📋 Copy
              </button>
            </div>

            {/* NOVAPX1 EXPLORER BUTTON */}

            <div className="mt-4">
              <a
                href={NOVAPX1_EXPLORER_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="
                  block
                  rounded-xl
                  border
                  border-emerald-400/40
                  bg-emerald-500/10
                  px-6
                  py-3
                  text-center
                  text-sm
                  font-semibold
                  text-emerald-300
                  transition
                  hover:bg-emerald-500/20
                "
              >
                🔎 View NOVAPX1 Contract
              </a>
            </div>

            {/* DISCLAIMER */}

            <p className="mt-4 text-center text-xs text-gray-500">
              NOVAPX1 is separate from the main NVGAI token.
            </p>
          </div>

          {/* STATISTICS */}

          <div
            className="
              mt-12
              grid
              grid-cols-1
              gap-4
              sm:grid-cols-3
            "
          >
            <StatCard
              title="NVGAI"
              text="Solana Token"
            />

            <StatCard
              title="🤖 AI"
              text="Future Innovation"
            />

            <StatCard
              title="🌍"
              text="Global Community"
            />
          </div>
        </motion.div>

        {/* RIGHT SIDE MASCOT */}

        <motion.div
          initial={{
            opacity: 0,
            scale: 0.8,
          }}
          animate={{
            opacity: 1,
            scale: 1,
          }}
          transition={{
            duration: 0.8,
          }}
          className="
            flex
            justify-center
          "
        >
          <Image
            src="/nova-mascot.png"
            alt="NovaGaia Nova Mascot"
            width={700}
            height={700}
            priority
            className="
              w-full
              max-w-sm
              drop-shadow-[0_0_50px_rgba(34,211,238,0.6)]
              sm:max-w-md
            "
          />
        </motion.div>
      </div>
    </section>
  );
}

function StatCard({
  title,
  text,
}: {
  title: string;
  text: string;
}) {
  return (
    <div
      className="
        rounded-xl
        border
        border-emerald-800
        bg-black/40
        p-5
        text-center
      "
    >
      <h3
        className="
          text-2xl
          font-bold
          text-emerald-400
        "
      >
        {title}
      </h3>

      <p
        className="
          text-sm
          text-gray-300
        "
      >
        {text}
      </p>
    </div>
  );
}