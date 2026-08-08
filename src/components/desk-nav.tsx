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
};

/** Campus surface: stock + issue + reports (supplier owns purchasing). */
const primary: NavItem[] = [
  { href: "/", label: "Home", desc: "Today overview", icon: NavIcons.desk },
  { href: "/issue", label: "Issue", desc: "Co-issue with supplier", icon: NavIcons.issue },
  { href: "/stock", label: "Stock", desc: "Balances by size", icon: NavIcons.stock },
  {
    href: "/incomplete",
    label: "Still owed",
    desc: "Incomplete uniforms",
    icon: NavIcons.reports,
  },
];

const opsLinksAll: (NavItem & { roles?: SessionUser["role"][] })[] = [
  {
    href: "/reports",
    label: "Reports",
    desc: "Issued & shortages",
    icon: NavIcons.reports,
  },
  {
    href: "/students",
    label: "Students",
    desc: "Admission roster",
    icon: NavIcons.students,
  },
  {
    href: "/deliveries",
    label: "Deliveries",
    desc: "Receive supplier DN into stock",
    icon: NavIcons.deliveries,
  },
  {
    href: "/receive",
    label: "Receive",
    desc: "Manual inbound stock",
    icon: NavIcons.receive,
  },
  {
    href: "/activity",
    label: "Activity",
    desc: "Issue & stock timeline",
    icon: NavIcons.activity,
  },
  {
    href: "/notifications",
    label: "Notifications",
    desc: "Stock & inbound alerts",
    icon: NavIcons.bell,
  },
  {
    href: "/search",
    label: "Search",
    desc: "Students & slips",
    icon: NavIcons.search,
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
                <NavIcons.ops />
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
            <NavIcons.issue />
          </Link>

          <Link
            href="/incomplete"
            className={`mobile-dock-link ${isActive(pathname, "/incomplete") ? "is-active" : ""}`}
          >
            <NavIcons.reports />
            <span>Owed</span>
          </Link>

          <button
            type="button"
            className={`mobile-dock-link ${
              mobileMore || opsLinks.some((l) => isActive(pathname, l.href))
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
          <div className="mobile-sheet-panel animate-rise" role="dialog" aria-modal="true" aria-label="Menu">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="text-base font-semibold">Menu</div>
                <div className="truncate text-xs text-[var(--muted)]">
                  {user.schoolName}
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
    <ChevronDown
      size={12}
      strokeWidth={2}
      aria-hidden
      className={`transition ${open ? "rotate-180" : ""}`}
    />
  );
}
