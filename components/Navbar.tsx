"use client";

import Image from "next/image";
import { useState } from "react";

const links = [
  { name: "Intelligence", href: "#intelligence" },
  { name: "Learn", href: "#learn" },
  { name: "Community", href: "#community" },
  { name: "NovaPX1", href: "#novapx1" },
  { name: "NVGAI", href: "#nvgai" },
  { name: "Q&A", href: "#qa" },
];

const primaryCta = { name: "🚨 Report a Threat", href: "#report" };

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <nav className="fixed top-0 z-50 w-full border-b border-emerald-900/70 bg-black/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3 sm:px-6">
        <a href="#home" className="flex items-center gap-3" aria-label="NovaGaia home">
          <Image
            src="/nova-logo.png"
            alt="NovaGaia logo"
            width={52}
            height={52}
            className="h-12 w-12 object-contain"
            priority
          />
          <div className="leading-none">
            <div className="text-xl font-extrabold tracking-tight text-white sm:text-2xl">
              <span className="text-emerald-400">Nova</span>Gaia
            </div>
            <div className="mt-1 text-[9px] font-semibold uppercase tracking-[0.28em] text-gray-500">
              Crypto Intelligence
            </div>
          </div>
        </a>

        <div className="hidden items-center gap-5 lg:flex">
          {links.map((link) => (
            <a key={link.name} href={link.href} className="text-sm font-medium text-gray-300 transition hover:text-emerald-400">
              {link.name}
            </a>
          ))}
          <a href={primaryCta.href} className="rounded-xl border border-emerald-400 bg-emerald-400 px-4 py-2 text-sm font-bold text-black transition hover:bg-emerald-300">
            {primaryCta.name}
          </a>
        </div>

        <button
          onClick={() => setOpen((value) => !value)}
          aria-label="Toggle navigation menu"
          aria-expanded={open}
          className="rounded-lg border border-emerald-800 px-3 py-2 text-2xl leading-none text-emerald-400 lg:hidden"
        >
          {open ? "×" : "☰"}
        </button>
      </div>

      {open && (
        <div className="border-t border-emerald-900/70 bg-black px-5 py-5 lg:hidden">
          <div className="mx-auto flex max-w-7xl flex-col gap-1">
            {links.map((link) => (
              <a key={link.name} href={link.href} onClick={() => setOpen(false)} className="rounded-lg px-3 py-3 text-gray-200 transition hover:bg-emerald-950/60 hover:text-emerald-400">
                {link.name}
              </a>
            ))}
            <a href={primaryCta.href} onClick={() => setOpen(false)} className="mt-2 rounded-xl bg-emerald-400 px-4 py-3 text-center font-bold text-black transition hover:bg-emerald-300">
              {primaryCta.name}
            </a>
          </div>
        </div>
      )}
    </nav>
  );
}
