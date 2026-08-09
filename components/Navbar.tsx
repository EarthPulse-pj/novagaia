"use client";

import Image from "next/image";
import { useState } from "react";
import { NVGAI_RAYDIUM_REFERRAL_URL } from "@/config/token";

export default function Navbar() {
  const [open, setOpen] = useState(false);

  const links = [
    {
      name: "Home",
      href: "#home",
    },

    {
      name: "About",
      href: "#about",
    },

    {
      name: "Tokenomics",
      href: "#tokenomics",
    },

    {
      name: "Roadmap",
      href: "#roadmap",
    },

    {
      name: "Community",
      href: "#community",
    },
  ];

  return (
    <nav
      className="
      fixed
      top-0
      z-50
      w-full
      border-b
      border-emerald-900
      bg-black/70
      backdrop-blur-md
      "
    >
      <div
        className="
        mx-auto
        flex
        max-w-7xl
        items-center
        justify-between
        px-6
        py-4
        "
      >
        {/* Logo */}

        <a
          href="#home"
          className="
          flex
          items-center
          gap-3
          "
        >
          <Image
            src="/nova-logo.png"
            alt="NovaGaia Logo"
            width={72}
            height={72}
            style={{
              width: "72px",
              height: "72px",
              objectFit: "contain",
            }}
            priority
          />

          <div
            className="
            text-2xl
            font-extrabold
            "
          >
            <span className="text-emerald-400">
              NovaGaia
            </span>

            <span className="text-white">
              {" "}
              NVGAI
            </span>
          </div>
        </a>

        {/* Desktop Navigation */}

        <div
          className="
          hidden
          items-center
          gap-8
          md:flex
          "
        >
          {links.map((link) => (
            <a
              key={link.name}
              href={link.href}
              className="
              text-gray-300
              transition
              hover:text-emerald-400
              "
            >
              {link.name}
            </a>
          ))}

          {/* Buy Button */}

          <a
            href={NVGAI_RAYDIUM_REFERRAL_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="
            rounded-xl
            bg-emerald-400
            px-5
            py-2
            font-bold
            text-black
            transition
            hover:bg-emerald-300
            "
          >
            🚀 Buy / Trade NVGAI
          </a>
        </div>

        {/* Mobile Menu Button */}

        <button
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
          className="
          text-3xl
          text-emerald-400
          md:hidden
          "
        >
          ☰
        </button>
      </div>

      {/* Mobile Menu */}

      {open && (
        <div
          className="
          flex
          flex-col
          gap-5
          border-t
          border-emerald-900
          bg-black
          px-6
          py-6
          md:hidden
          "
        >
          {links.map((link) => (
            <a
              key={link.name}
              href={link.href}
              onClick={() => setOpen(false)}
              className="
              text-gray-300
              transition
              hover:text-emerald-400
              "
            >
              {link.name}
            </a>
          ))}

          {/* Mobile Buy Button */}

          <a
            href={NVGAI_RAYDIUM_REFERRAL_URL}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setOpen(false)}
            className="
            rounded-xl
            bg-emerald-400
            px-5
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
        </div>
      )}
    </nav>
  );
}