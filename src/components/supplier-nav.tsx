"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { logoutAction } from "@/app/actions/auth";
import { DeskSearch } from "@/components/desk-search";
import { ThemeMenu } from "@/components/theme-menu";
import { ThemeToggle } from "@/components/theme-toggle";
import type { SessionUser } from "@/lib/auth";

type NavItem = {
  href: string;
  label: string;
  desc?: string;
};

const primary: NavItem[] = [
  { href: "/supplier", label: "Home", desc: "Supply overview" },
  { href: "/supplier/orders", label: "Orders", desc: "School POs" },
  { href: "/supplier/deliveries", label: "Deliveries", desc: "Pack & dispatch" },
  { href: "/supplier/invoices", label: "Invoices", desc: "Bill & collect" },
];

const moreLinks: NavItem[] = [
  {
    href: "/supplier/activity",
    label: "Activity",
    desc: "Orders, DN, invoices, payments",
  },
  {
    href: "/supplier/notifications",
    label: "Notifications",
    desc: "Dispatch, collect, open orders",
  },
  {
    href: "/supplier/search",
    label: "Search",
    desc: "Schools, SKUs, supply docs",
  },
  { href: "/supplier/schools", label: "Schools", desc: "Multi-school portfolio" },
  { href: "/supplier/catalog", label: "Catalog", desc: "Products & SKUs" },
  { href: "/supplier/branding", label: "Branding", desc: "White-label look" },
];

function isActive(pathname: string, href: string) {
  if (href === "/supplier") return pathname === "/supplier";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SupplierNav({
  user,
  brandMark,
  noticeCount = 0,
}: {
  user: SessionUser;
  brandMark?: string;
  noticeCount?: number;
}) {
  const pathname = usePathname();
  const [accountOpen, setAccountOpen] = useState(false);
  const [mobileMore, setMobileMore] = useState(false);
  const accountRef = useRef<HTMLDivElement>(null);
  const mark = brandMark || "UD";
  const navLinks =
    user.role === "supplier_admin"
      ? moreLinks
      : moreLinks.filter((l) => l.href !== "/supplier/branding");
  const noticeLabel =
    noticeCount > 99 ? "99+" : noticeCount > 0 ? String(noticeCount) : null;

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (!accountRef.current?.contains(event.target as Node)) {
        setAccountOpen(false);
      }
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, []);

  return (
    <>
      <header className="desk-topbar no-print">
        <div className="nav-shell">
          <Link href="/supplier" className="nav-brand">
            <span className="nav-mark" aria-hidden>
              {mark}
            </span>
            <span className="min-w-0">
              <span className="nav-brand-title">{user.supplierName}</span>
              <span className="nav-brand-sub">Supply on UniformDesk</span>
            </span>
          </Link>

          <nav className="nav-pill" aria-label="Main">
            {primary.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`nav-pill-link ${isActive(pathname, link.href) ? "is-active" : ""}`}
              >
                <span>{link.label}</span>
              </Link>
            ))}
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`nav-pill-link ${isActive(pathname, link.href) ? "is-active" : ""}`}
              >
                <span>{link.label}</span>
              </Link>
            ))}
          </nav>

          <div className="nav-actions">
            <DeskSearch
              actionPath="/supplier/search"
              placeholder="Search supply…"
              inputId="supplier-search"
              label="Search supply"
            />
            <Link
              href="/supplier/notifications"
              className={`nav-icon-btn relative ${
                isActive(pathname, "/supplier/notifications") ? "is-active" : ""
              }`}
              aria-label={
                noticeLabel
                  ? `Notifications, ${noticeLabel} open`
                  : "Notifications"
              }
              title="Notifications"
            >
              <BellIcon />
              {noticeLabel && (
                <span className="nav-badge" aria-hidden>
                  {noticeLabel}
                </span>
              )}
            </Link>
            <ThemeMenu />
            <div className="relative" ref={accountRef}>
              <button
                type="button"
                className="nav-account-btn"
                aria-haspopup="menu"
                aria-expanded={accountOpen}
                onClick={() => setAccountOpen((v) => !v)}
              >
                <span className="nav-avatar" aria-hidden>
                  {user.name
                    .split(" ")
                    .map((p) => p[0])
                    .slice(0, 2)
                    .join("")
                    .toUpperCase()}
                </span>
                <span className="hidden min-w-0 text-left xl:block">
                  <span className="block truncate text-sm font-semibold leading-tight">
                    {user.name}
                  </span>
                  <span className="block truncate text-[0.7rem] text-[var(--muted)]">
                    {user.role.replace("_", " ")}
                  </span>
                </span>
              </button>
              {accountOpen && (
                <div className="nav-dropdown nav-dropdown-right" role="menu">
                  <div className="px-3 py-2">
                    <div className="font-semibold">{user.name}</div>
                    <div className="text-xs text-[var(--muted)]">{user.email}</div>
                  </div>
                  <div className="nav-menu-divider" />
                  <div className="px-2 py-2 xl:hidden">
                    <ThemeToggle />
                  </div>
                  <form action={logoutAction}>
                    <button
                      type="submit"
                      className="nav-menu-item w-full text-[var(--danger)]"
                    >
                      <span className="font-semibold">Sign out</span>
                    </button>
                  </form>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <nav className="desk-bottom-nav no-print md:hidden" aria-label="Mobile">
        <div className="mobile-dock">
          {primary.slice(0, 3).map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`mobile-dock-link ${isActive(pathname, link.href) ? "is-active" : ""}`}
            >
              <span>{link.label}</span>
            </Link>
          ))}
          <button
            type="button"
            className="mobile-dock-link"
            onClick={() => setMobileMore(true)}
          >
            <span>More</span>
          </button>
        </div>
      </nav>

      {mobileMore && (
        <div className="mobile-sheet md:hidden">
          <button
            type="button"
            className="mobile-sheet-backdrop"
            aria-label="Close menu"
            onClick={() => setMobileMore(false)}
          />
          <div className="mobile-sheet-panel animate-rise">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <div className="font-display text-lg font-bold">Supply menu</div>
                <div className="text-xs text-[var(--muted)]">
                  {user.supplierName}
                </div>
              </div>
              <button
                type="button"
                className="nav-icon-btn"
                onClick={() => setMobileMore(false)}
              >
                Close
              </button>
            </div>
            {[...primary, ...navLinks].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="nav-menu-item"
                onClick={() => setMobileMore(false)}
              >
                <span>
                  <span className="block font-semibold">{link.label}</span>
                  <span className="block text-xs text-[var(--muted)]">
                    {link.desc}
                  </span>
                </span>
              </Link>
            ))}
            <div className="nav-menu-divider" />
            <form action={logoutAction}>
              <button type="submit" className="btn btn-ghost w-full">
                Sign out
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

function BellIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M6 9a6 6 0 1 1 12 0c0 3.5 1.5 5 2 6H4c.5-1 2-2.5 2-6Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M10 19a2 2 0 0 0 4 0"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}
