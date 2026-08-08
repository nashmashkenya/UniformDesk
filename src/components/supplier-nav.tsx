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

const primary: NavItem[] = [
  { href: "/supplier", label: "Home", desc: "Supply overview", icon: NavIcons.home },
  {
    href: "/supplier/issue",
    label: "Co-issue",
    desc: "Admission issue with school",
    icon: NavIcons.issue,
  },
  {
    href: "/supplier/reports",
    label: "Reports",
    desc: "Issued & stock",
    icon: NavIcons.reports,
  },
  {
    href: "/supplier/deliveries",
    label: "Deliveries",
    desc: "Pack & dispatch",
    icon: NavIcons.deliveries,
  },
];

const moreLinksAll: NavItem[] = [
  {
    href: "/supplier/incomplete",
    label: "Still owed",
    desc: "Incomplete uniforms",
    icon: NavIcons.reports,
  },
  {
    href: "/supplier/orders",
    label: "Orders",
    desc: "School POs",
    icon: NavIcons.orders,
  },
  {
    href: "/supplier/invoices",
    label: "Invoices",
    desc: "Bill & collect",
    icon: NavIcons.invoices,
  },
  {
    href: "/supplier/activity",
    label: "Activity",
    desc: "Orders, DN, invoices, payments",
    icon: NavIcons.activity,
  },
  {
    href: "/supplier/notifications",
    label: "Notifications",
    desc: "Dispatch, collect, open orders",
    icon: NavIcons.bell,
  },
  {
    href: "/supplier/search",
    label: "Search",
    desc: "Schools, SKUs, supply docs",
    icon: NavIcons.search,
  },
  {
    href: "/supplier/schools",
    label: "Schools",
    desc: "Multi-school portfolio",
    icon: NavIcons.schools,
  },
  {
    href: "/supplier/catalog",
    label: "Catalog",
    desc: "Products & SKUs",
    icon: NavIcons.catalog,
  },
  {
    href: "/supplier/branding",
    label: "Branding",
    desc: "White-label look",
    icon: NavIcons.branding,
  },
];

function isActive(pathname: string, href: string) {
  if (href === "/supplier") return pathname === "/supplier";
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
  const moreLinks =
    user.role === "supplier_admin"
      ? moreLinksAll
      : moreLinksAll.filter((l) => l.href !== "/supplier/branding");
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
                  <div className="nav-menu-label">Supply tools</div>
                  {moreLinks.map((link) => {
                    const Icon = link.icon;
                    const active = isActive(pathname, link.href);
                    return (
                      <Link
                        key={link.href}
                        href={link.href}
                        role="menuitem"
                        className={`nav-menu-item ${active ? "is-active" : ""}`}
                        onClick={() => more.setOpen(false)}
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
            href="/supplier/reports"
            className={`mobile-dock-link ${isActive(pathname, "/supplier/reports") ? "is-active" : ""}`}
          >
            <NavIcons.reports />
            <span>Reports</span>
          </Link>
          <Link
            href="/supplier/issue"
            className={`mobile-fab ${isActive(pathname, "/supplier/issue") ? "is-active" : ""}`}
            aria-label="Co-issue uniforms"
          >
            <NavIcons.issue />
          </Link>
          <Link
            href="/supplier/deliveries"
            className={`mobile-dock-link ${isActive(pathname, "/supplier/deliveries") ? "is-active" : ""}`}
          >
            <NavIcons.deliveries />
            <span>Deliveries</span>
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
            {[...primary, ...moreLinks].map((link) => {
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
