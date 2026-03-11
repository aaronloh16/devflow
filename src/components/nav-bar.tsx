"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, Github, Workflow } from "lucide-react";

const NAV_LINKS = [
  { href: "/workflows", label: "Workflows" },
  { href: "/leaderboard", label: "Builder's Picks" },
  { href: "/submit", label: "Submit" },
];

export function NavBar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(href + "/");
  }

  return (
    <nav
      style={{
        borderBottom: "1px solid var(--border-subtle)",
        background: "rgba(9,9,11,0.85)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        position: "sticky",
        top: 0,
        zIndex: 50,
      }}
      className="px-6 py-4"
    >
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <Workflow
            className="w-4 h-4 transition-transform group-hover:rotate-12"
            style={{ color: "var(--text-secondary)" }}
          />
          <span
            className="text-base font-bold tracking-tight"
            style={{
              color: "var(--text-primary)",
              fontFamily: "var(--font-syne), sans-serif",
              letterSpacing: "-0.02em",
            }}
          >
            DevFlow
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden sm:flex items-center gap-1">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="px-3.5 py-2 text-sm rounded-lg transition-colors"
              style={{
                color: isActive(link.href)
                  ? "var(--text-primary)"
                  : "var(--text-secondary)",
                fontWeight: isActive(link.href) ? 600 : 400,
              }}
            >
              {link.label}
            </Link>
          ))}
          <a
            href="https://github.com/aaronloh16/devflow"
            target="_blank"
            rel="noopener noreferrer"
            className="ml-2 p-2 rounded-lg transition-colors"
            style={{ color: "var(--text-tertiary)" }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.color = "var(--text-secondary)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.color = "var(--text-tertiary)";
            }}
          >
            <Github className="w-4 h-4" />
          </a>
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="sm:hidden p-2 rounded-lg transition-colors"
          style={{ color: "var(--text-secondary)" }}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div
          className="sm:hidden mt-4 pb-4 space-y-1"
          style={{
            borderTop: "1px solid var(--border-subtle)",
            paddingTop: "1rem",
          }}
        >
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className="block px-4 py-2.5 text-sm rounded-lg transition-colors"
              style={{
                color: isActive(link.href)
                  ? "var(--text-primary)"
                  : "var(--text-secondary)",
                fontWeight: isActive(link.href) ? 600 : 400,
              }}
            >
              {link.label}
            </Link>
          ))}
          <a
            href="https://github.com/aaronloh16/devflow"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2.5 px-4 py-2.5 text-sm rounded-lg"
            style={{ color: "var(--text-secondary)" }}
          >
            <Github className="w-4 h-4" />
            GitHub
          </a>
        </div>
      )}
    </nav>
  );
}
