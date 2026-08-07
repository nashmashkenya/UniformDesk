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
  icon: () => React.ReactNode;
};

const primary: NavItem[] = [
  { href: "/", label: "Desk", desc: "Today overview", icon: DeskIcon },
  { href: "/issue", label: "Issue", desc: "Sign & release kits", icon: IssueIcon },
  { href: "/stock", label: "Stock", desc: "Balances by size", icon: StockIcon },
  { href: "/activity", label: "Activity", desc: "Audit timeline", icon: ActivityIcon },
];

const opsLinksAll: (NavItem & { roles?: SessionUser["role"][] })[] = [
  {
    href: "/notifications",
    label: "Notifications",
    desc: "Stock, invoices, deliveries",
    icon: BellIcon,
  },
  {
    href: "/search",
    label: "Search",
    desc: "Slips, students, supply docs",
    icon: SearchIcon,
  },
  {
    href: "/reports",
    label: "Reports",
    desc: "Issued today & shortages",
    icon: ReportIcon,
  },
  {
    href: "/deliveries",
    label: "Deliveries",
    desc: "Receive against supplier DN",
    icon: DeliveryIcon,
  },
  { href: "/orders", label: "Orders", desc: "Supply purchase orders", icon: OrdersIcon },
  {
    href: "/reorder",
    label: "Reorder",
    desc: "Low-stock to supplier PO",
    icon: ReorderIcon,
  },
  { href: "/invoices", label: "Invoices", desc: "Supplier invoices", icon: InvoiceIcon },
  { href: "/receive", label: "Receive", desc: "Manual inbound stock", icon: ReceiveIcon },
  { href: "/students", label: "Students", desc: "Admission roster", icon: StudentsIcon },
  {
    href: "/catalog",
    label: "Catalog",
    desc: "Items and sizes",
    icon: CatalogIcon,
    roles: ["school_admin"],
  },
  {
    href: "/kits",
    label: "Kits",
    desc: "Issue bundles",
    icon: KitsIcon,
    roles: ["school_admin"],
  },
  {
    href: "/users",
    label: "Users",
    desc: "Desk accounts & roles",
    icon: UsersIcon,
    roles: ["school_admin"],
  },
  {
    href: "/integrations",
    label: "Integrations",
    desc: "School Master sync & SSO",
    icon: IntegrationsIcon,
    roles: ["school_admin"],
  },
];

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
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

export function DeskNav({
  user,
  noticeCount = 0,
}: {
  user: SessionUser;
  noticeCount?: number;
}) {
  const pathname = usePathname();
  const ops = useMenu();
  const account = useMenu();
  const [mobileMore, setMobileMore] = useState(false);
  const opsLinks = opsLinksAll.filter(
    (link) => !link.roles || link.roles.includes(user.role),
  );
  const noticeLabel =
    noticeCount > 99 ? "99+" : noticeCount > 0 ? String(noticeCount) : null;

  return (
    <>
      <header className="desk-topbar no-print">
        <div className="nav-shell">
          <Link href="/" className="nav-brand">
            <span className="nav-mark" aria-hidden>
              UD
            </span>
            <span className="min-w-0">
              <span className="nav-brand-title">UniformDesk</span>
              <span className="nav-brand-sub">{user.schoolName}</span>
            </span>
          </Link>

          <nav className="nav-pill" aria-label="Main">
            {primary.map((link) => {
              const active = isActive(pathname, link.href);
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`nav-pill-link ${active ? "is-active" : ""}`}
                >
                  <Icon />
                  <span>{link.label}</span>
                </Link>
              );
            })}

            <div className="relative" ref={ops.ref}>
              <button
                type="button"
                className={`nav-pill-link ${
                  ops.open || opsLinks.some((l) => isActive(pathname, l.href))
                    ? "is-active"
                    : ""
                }`}
                aria-haspopup="menu"
                aria-expanded={ops.open}
                onClick={() => {
                  account.setOpen(false);
                  ops.setOpen((v) => !v);
                }}
              >
                <OpsIcon />
                <span>Ops</span>
                <ChevronIcon open={ops.open} />
              </button>
              {ops.open && (
                <div className="nav-dropdown nav-dropdown-center" role="menu">
                  <div className="nav-menu-label">Operations</div>
                  {opsLinks.map((link) => {
                    const Icon = link.icon;
                    const active = isActive(pathname, link.href);
                    return (
                      <Link
                        key={link.href}
                        href={link.href}
                        role="menuitem"
                        className={`nav-menu-item ${active ? "is-active" : ""}`}
                        onClick={() => ops.setOpen(false)}
                      >
                        <span className="nav-menu-icon">
                          <Icon />
                        </span>
                        <span>
                          <span className="block font-semibold">{link.label}</span>
                          <span className="block text-xs text-[var(--muted)]">
                            {link.desc}
                          </span>
                        </span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          </nav>

          <div className="nav-actions">
            <DeskSearch />
            <Link
              href="/notifications"
              className={`nav-icon-btn relative ${
                isActive(pathname, "/notifications") ? "is-active" : ""
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

            <div className="relative" ref={account.ref}>
              <button
                type="button"
                className="nav-account-btn"
                aria-haspopup="menu"
                aria-expanded={account.open}
                onClick={() => {
                  ops.setOpen(false);
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
                <ChevronIcon open={account.open} />
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
                  <div className="nav-menu-divider xl:hidden" />
                  <form action={logoutAction}>
                    <button type="submit" className="nav-menu-item w-full text-[var(--danger)]">
                      <span className="nav-menu-icon">
                        <LogoutIcon />
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
          {[primary[0], primary[2]].map((link) => {
            const active = isActive(pathname, link.href);
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`mobile-dock-link ${active ? "is-active" : ""}`}
              >
                <Icon />
                <span>{link.label}</span>
              </Link>
            );
          })}

          <Link
            href="/issue"
            className={`mobile-fab ${isActive(pathname, "/issue") ? "is-active" : ""}`}
            aria-label="Issue uniforms"
          >
            <IssueIcon />
          </Link>

          <Link
            href="/activity"
            className={`mobile-dock-link ${isActive(pathname, "/activity") ? "is-active" : ""}`}
          >
            <ActivityIcon />
            <span>Activity</span>
          </Link>

          <button
            type="button"
            className={`mobile-dock-link ${
              mobileMore || opsLinks.some((l) => isActive(pathname, l.href))
                ? "is-active"
                : ""
            }`}
            onClick={() => setMobileMore(true)}
          >
            <MoreIcon />
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
                <div className="font-display text-lg font-bold">Menu</div>
                <div className="text-xs text-[var(--muted)]">{user.schoolName}</div>
              </div>
              <button
                type="button"
                className="nav-icon-btn"
                onClick={() => setMobileMore(false)}
              >
                Close
              </button>
            </div>

            <div className="nav-menu-label">Operations</div>
            {opsLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className="nav-menu-item"
                  onClick={() => setMobileMore(false)}
                >
                  <span className="nav-menu-icon">
                    <Icon />
                  </span>
                  <span>
                    <span className="block font-semibold">{link.label}</span>
                    <span className="block text-xs text-[var(--muted)]">
                      {link.desc}
                    </span>
                  </span>
                </Link>
              );
            })}

            <div className="nav-menu-divider" />
            <ThemeToggle />
            <div className="nav-menu-divider" />

            <div className="flex items-center justify-between gap-3 px-1 py-2">
              <div className="min-w-0">
                <div className="truncate font-semibold">{user.name}</div>
                <div className="truncate text-xs text-[var(--muted)]">
                  {user.role.replace("_", " ")}
                </div>
              </div>
              <form action={logoutAction}>
                <button type="submit" className="btn btn-ghost px-3 text-xs">
                  Sign out
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      className={`transition ${open ? "rotate-180" : ""}`}
    >
      <path
        d="M6 9l6 6 6-6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function DeskIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-9.5Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IssueIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M8 7h11M8 12h11M8 17h7M4 7h.01M4 12h.01M4 17h.01"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function StockIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 8.5 12 4l8 4.5v7L12 20l-8-4.5v-7Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M12 12v8M4 8.5l8 3.5 8-3.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ReportIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M5 19V9M10 19V5M15 19v-7M20 19V8"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ActivityIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 6h16M4 12h10M4 18h13"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <circle cx="18" cy="12" r="2" fill="currentColor" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M16 16l4 4"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
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

function OpsIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ReceiveIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 3v12m0 0 4-4m-4 4-4-4M4 19h16"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function DeliveryIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M3 7h11v10H3V7Zm11 3h4l3 3v4h-7v-7ZM7 19a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Zm10 0a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function OrdersIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M7 4h10l1 16H6L7 4Zm3 4h4M9 12h6M9 16h4"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ReorderIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 7h11l2 3v7H4V7Zm13 3h3v7h-3M8 20a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Zm8 0a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M14 4v3m0 0 1.5-1.5M14 7l-1.5-1.5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

function InvoiceIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M7 3h10v18l-2.5-1.5L12 21l-2.5-1.5L7 21V3Zm3 5h4M10 11h4M10 15h2"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function StudentsIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M16 11a3 3 0 1 0-6 0 3 3 0 0 0 6 0ZM4 19c.8-2.7 3.2-4 6-4h0c2.8 0 5.2 1.3 6 4M17 8a2.5 2.5 0 1 0 0-5M20.5 19c-.4-1.8-1.7-3-3.5-3.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CatalogIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 6.5A2.5 2.5 0 0 1 6.5 4H20v14.5A1.5 1.5 0 0 1 18.5 20H6.5A2.5 2.5 0 0 1 4 17.5v-11Z"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M8 8h8M8 12h8M8 16h5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function KitsIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 8h16v11H4V8Zm3-4h10l1 4H6l1-4Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function UsersIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M9 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM16.5 8.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5ZM3.5 19c.7-2.6 2.9-4 5.5-4s4.8 1.4 5.5 4M14 15c1.8.2 3.4 1.2 4 3"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IntegrationsIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M8 7h3v3H8V7Zm5 7h3v3h-3v-3ZM7 14a3 3 0 0 1 3-3h1v2H10a1 1 0 0 0-1 1v1H7v-1Zm10-4h-2V9h1a1 1 0 0 0 1-1V7h2v1a3 3 0 0 1-3 3h-1V9h1Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function MoreIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="6" cy="12" r="1.6" fill="currentColor" />
      <circle cx="12" cy="12" r="1.6" fill="currentColor" />
      <circle cx="18" cy="12" r="1.6" fill="currentColor" />
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M10 7V6a2 2 0 0 1 2-2h7v16h-7a2 2 0 0 1-2-2v-1M3 12h11m0 0-3-3m3 3-3 3"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
