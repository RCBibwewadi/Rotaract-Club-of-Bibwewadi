"use client";

import Link from "next/link";
import { Phone, MapPin } from "lucide-react";
import { FaInstagram, FaLinkedinIn, FaFacebookF } from "react-icons/fa";
import { HiOutlineMail } from "react-icons/hi";
import { useStore } from "@/lib/store";

export default function Footer() {
  const content = useStore((s) => s.content);

  return (
    <footer className="bg-dark text-white relative overflow-hidden">
      <div className="max-w-5xl mx-auto px-6 py-16">
        {/* Top tagline */}
        <p className="text-center text-xl tracking-[0.3em] uppercase text-white/25 mb-14">
          MAKE IT MATTER
        </p>

        {/* 4-Column Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Column 1 — Identity */}
          <div>
            <p className="text-sm font-medium text-white">Rotaract Club of Bibwewadi Pune</p>
            <p className="text-[10px] text-white/25 tracking-wider uppercase mt-3">
              ROTARY INTERNATIONAL · DISTRICT 3131
            </p>
          </div>

          {/* Column 2 — Explore */}
          <div>
            <h3 className="text-[10px] tracking-[0.15em] uppercase text-white/35 mb-3">
              EXPLORE
            </h3>
            <ul className="space-y-2">
              {[
                { href: "/about", label: "About" },
                { href: "/projects", label: "Projects" },
                { href: "/events", label: "Events" },
                { href: "/board", label: "Board" },
                { href: "/join", label: "Join" },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-[13px] text-white/45 hover:text-white/75 transition-colors duration-200"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3 — Reach Us */}
          <div>
            <h3 className="text-[10px] tracking-[0.15em] uppercase text-white/35 mb-3">
              REACH US
            </h3>
            <div className="space-y-2">
              <a
                href={`mailto:${content.contactEmail}`}
                className="flex items-center gap-2 text-[13px] text-white/45 hover:text-white/75 transition-colors"
              >
                <HiOutlineMail size={12} className="shrink-0" />{" "}
                {content.contactEmail}
              </a>
              <a
                href={`tel:${content.contactPhone}`}
                className="flex items-center gap-2 text-[13px] text-white/45 hover:text-white/75 transition-colors"
              >
                <Phone size={12} className="shrink-0" /> {content.contactPhone}
              </a>
              <p className="flex items-center gap-2 text-[13px] text-white/45">
                <MapPin size={12} className="shrink-0" />{" "}
                {content.contactAddress}
              </p>
            </div>
          </div>

          {/* Column 4 — Connect */}
          <div>
            <h3 className="text-[10px] tracking-[0.15em] uppercase text-white/35 mb-3">
              CONNECT
            </h3>
            <div className="flex gap-3">
              {content.socialLinks.map((link) => {
                const Icon =
                  link.platform === "Instagram"
                    ? FaInstagram
                    : link.platform === "Facebook"
                      ? FaFacebookF
                      : FaLinkedinIn;
                return (
                  <a
                    key={link.platform}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-8 h-8 rounded-full border border-white/15 flex items-center justify-center text-white/40 hover:text-white/65 hover:border-white/30 transition-all duration-300"
                  >
                    <Icon size={14} />
                  </a>
                );
              })}
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/8 mt-12 pt-5 flex flex-col md:flex-row items-center justify-center gap-2">
          <p className="text-md tracking-tight hover:text-accent transition-colors">
            &copy; {new Date().getFullYear()} Rotaract Club of Bibwewadi Pune
          </p>

          <span className="hidden md:inline">|</span>

          <a
            href={`mailto:${content.contactEmail}`}
            className="flex items-center gap-1 text-md tracking-tight hover:text-accent transition-colors"
          >
            <HiOutlineMail size={14} className="shrink-0" />
            <span>Made By USP Face</span>
          </a>
        </div>
      </div>
    </footer>
  );
}
