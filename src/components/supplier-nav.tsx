"use client";

import { ChevronDown } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { logoutAction } from "@/app/actions/auth";
import { DeskSearch } from "@/components/desk-search";
import { NavIcons } from "@/components/nav-icons";
import { ThemeMenu } from "@/components/theme-menu";
import { ThemeToggle } from "@/components/theme-toggle";
import type { SessionUser } from "@/lib/auth";

type NavItem = {
  href: string;
  label: string;
  desc?: string;
  icon: () => React.ReactNode;
  section?: string;
};

/** Daily desk — same order for admin and staff so the issue path is shared. */
const deskPrimary: NavItem[] = [
  {
    href: "/supplier",
    label: "Home",
    desc: "Start here",
    icon: NavIcons.home,
    section: "Daily desk",
  },
  {
    href: "/supplier/issue",
    label: "Issue",
    desc: "Issue uniforms on campus",
    icon: NavIcons.issue,
    section: "Daily desk",
  },
  {
    href: "/supplier/incomplete",
    label: "To finish",
    desc: "Uniforms not fully given",
    icon: NavIcons.shortage,
    section: "Daily desk",
  },
  {
    href: "/supplier/reports",
    label: "Reports",
    desc: "Issued today & stock",
    icon: NavIcons.reports,
    section: "Daily desk",
  },
];

const staffMore: NavItem[] = [
  {
    href: "/supplier/activity",
    label: "Activity",
    desc: "Recent desk activity",
    icon: NavIcons.activity,
    section: "Look up",
  },
  {
    href: "/supplier/notifications",
    label: "Notifications",
    desc: "Alerts",
    icon: NavIcons.bell,
    section: "Look up",
  },
  {
    href: "/supplier/search",
    label: "Search",
    desc: "Find students & slips",
    icon: NavIcons.search,
    section: "Look up",
  },
];

/** More menu follows the setup → stock → optional billing → team path. */
const adminMore: NavItem[] = [
  {
    href: "/supplier/schools",
    label: "Schools",
    desc: "1. Create or link a campus",
    icon: NavIcons.schools,
    section: "Set up",
  },
  {
    href: "/supplier/catalog",
    label: "Products",
    desc: "2. Master SKUs & prices",
    icon: NavIcons.catalog,
    section: "Set up",
  },
  {
    href: "/supplier/deliveries",
    label: "Deliveries",
    desc: "3. DN and post to campus stock",
    icon: NavIcons.deliveries,
    section: "Set up",
  },
  {
    href: "/supplier/orders",
    label: "Orders",
    desc: "Optional purchase orders",
    icon: NavIcons.orders,
    section: "Optional billing",
  },
  {
    href: "/supplier/invoices",
    label: "Invoices",
    desc: "Optional bill & collect",
    icon: NavIcons.invoices,
    section: "Optional billing",
  },
  {
    href: "/supplier/team",
    label: "Team",
    desc: "Users, passwords, campus access",
    icon: NavIcons.users,
    section: "Organisation",
  },
  {
    href: "/supplier/branding",
    label: "Branding",
    desc: "Organisation look",
    icon: NavIcons.branding,
    section: "Organisation",
  },
  {
    href: "/supplier/activity",
    label: "Activity",
    desc: "Full ground monitor",
    icon: NavIcons.activity,
    section: "Look up",
  },
  {
    href: "/supplier/notifications",
    label: "Notifications",
    desc: "Post stock, collect, open orders",
    icon: NavIcons.bell,
    section: "Look up",
  },
  {
    href: "/supplier/search",
    label: "Search",
    desc: "Schools, SKUs, supply docs",
    icon: NavIcons.search,
    section: "Look up",
  },
];

function isActive(pathname: string, href: string) {
  if (href === "/supplier") return pathname === "/supplier";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function renderNavSections(
  links: NavItem[],
  pathname: string,
  onNavigate: () => void,
) {
  const seen = new Set<string>();
  const nodes: React.ReactNode[] = [];
  let lastSection: string | undefined;

  for (const link of links) {
    if (seen.has(link.href)) continue;
    seen.add(link.href);

    if (link.section && link.section !== lastSection) {
      lastSection = link.section;
      nodes.push(
        <div key={`section:${link.section}`} className="nav-menu-label">
          {link.section}
        </div>,
      );
    }

    const Icon = link.icon;
    const active = isActive(pathname, link.href);
    nodes.push(
      <Link
        key={link.href}
        href={link.href}
        role="menuitem"
        className={`nav-menu-item ${active ? "is-active" : ""}`}
        onClick={onNavigate}
      >
        <span className="nav-menu-icon">
          <Icon />
        </span>
        <span>
          <span className="block font-semibold">{link.label}</span>
          {link.desc ? (
            <span className="block text-xs text-[var(--muted)]">{link.desc}</span>
          ) : null}
        </span>
      </Link>,
    );
  }

  return nodes;
}

function useMenu() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (!ref.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  return { open, setOpen, ref };
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
  const more = useMenu();
  const account = useMenu();
  const [mobileMore, setMobileMore] = useState(false);
  const mark = brandMark || "UD";
  const isAdmin = user.role === "supplier_admin";
  const primary = deskPrimary;
  const moreLinks = isAdmin ? adminMore : staffMore;
  const noticeLabel =
    noticeCount > 99 ? "99+" : noticeCount > 0 ? String(noticeCount) : null;

  useEffect(() => {
    if (!mobileMore) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileMore]);

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
            {primary.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`nav-pill-link ${isActive(pathname, link.href) ? "is-active" : ""}`}
                >
                  <Icon />
                  <span>{link.label}</span>
                </Link>
              );
            })}

            <div className="relative" ref={more.ref}>
              <button
                type="button"
                className={`nav-pill-link ${
                  more.open || moreLinks.some((l) => isActive(pathname, l.href))
                    ? "is-active"
                    : ""
                }`}
                aria-haspopup="menu"
                aria-expanded={more.open}
                onClick={() => {
                  account.setOpen(false);
                  more.setOpen((v) => !v);
                }}
              >
                <NavIcons.more />
                <span>More</span>
                <ChevronDown
                  size={12}
                  strokeWidth={2}
                  aria-hidden
                  className={`transition ${more.open ? "rotate-180" : ""}`}
                />
              </button>
              {more.open && (
                <div className="nav-dropdown nav-dropdown-center" role="menu">
                  {renderNavSections(moreLinks, pathname, () =>
                    more.setOpen(false),
                  )}
                </div>
              )}
            </div>
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
              <NavIcons.bell />
              {noticeLabel && (
                <span className="nav-badge" aria-hidden>
                  {noticeLabel}
                </span>
              )}
            </Link>
            <ThemeMenu />
            <div className="relative" ref={account.ref}>
              <button
                type="button"
                className="nav-account-btn"
                aria-haspopup="menu"
                aria-expanded={account.open}
                onClick={() => {
                  more.setOpen(false);
                  account.setOpen((v) => !v);
                }}
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
                <ChevronDown
                  size={12}
                  strokeWidth={2}
                  aria-hidden
                  className={`transition ${account.open ? "rotate-180" : ""}`}
                />
              </button>
              {account.open && (
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
                      <span className="nav-menu-icon">
                        <NavIcons.logout />
                      </span>
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
          <Link
            href="/supplier"
            className={`mobile-dock-link ${pathname === "/supplier" ? "is-active" : ""}`}
          >
            <NavIcons.home />
            <span>Home</span>
          </Link>
          <Link
            href="/supplier/incomplete"
            className={`mobile-dock-link ${isActive(pathname, "/supplier/incomplete") ? "is-active" : ""}`}
          >
            <NavIcons.shortage />
            <span>Finish</span>
          </Link>
          <Link
            href="/supplier/issue"
            className={`mobile-fab ${isActive(pathname, "/supplier/issue") ? "is-active" : ""}`}
            aria-label="Issue uniforms"
          >
            <NavIcons.issue />
          </Link>
          <Link
            href="/supplier/reports"
            className={`mobile-dock-link ${isActive(pathname, "/supplier/reports") ? "is-active" : ""}`}
          >
            <NavIcons.reports />
            <span>Reports</span>
          </Link>
          <button
            type="button"
            className={`mobile-dock-link ${
              mobileMore || moreLinks.some((l) => isActive(pathname, l.href))
                ? "is-active"
                : ""
            }`}
            onClick={() => setMobileMore(true)}
            aria-expanded={mobileMore}
          >
            <NavIcons.more />
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
          <div
            className="mobile-sheet-panel animate-rise"
            role="dialog"
            aria-modal="true"
            aria-label="Supply menu"
          >
            <div className="mb-3 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="text-base font-semibold">Supply menu</div>
                <div className="truncate text-xs text-[var(--muted)]">
                  {user.supplierName}
                </div>
              </div>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setMobileMore(false)}
              >
                Close
              </button>
            </div>
            {renderNavSections(
              [...primary, ...moreLinks],
              pathname,
              () => setMobileMore(false),
            )}
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
