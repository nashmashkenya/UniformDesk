import { Suspense } from "react";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/login-form";
import { ThemeMenu } from "@/components/theme-menu";
import { getSessionUser, homePathForUser } from "@/lib/auth";

export default async function LoginPage() {
  const user = await getSessionUser();
  if (user) redirect(homePathForUser(user));

  return (
    <main className="hero-shell">
      <section className="hero-stage">
        <div className="absolute left-4 top-4 z-20 sm:left-6 sm:top-6">
          <ThemeMenu align="left" />
        </div>

        <div className="hero-content animate-rise">
          <div className="mb-4 inline-flex items-center gap-2 rounded-[4px] bg-white/15 px-2 py-1 text-xs font-semibold">
            <span className="grid h-5 w-5 place-items-center rounded-[3px] bg-white text-[10px] font-bold text-[#0f6cbd]">
              UD
            </span>
            Office-style workspace
          </div>
          <h1 className="hero-brand">UniformDesk</h1>
          <p className="hero-line">Issue uniforms with proof from a familiar office desk.</p>
          <p className="hero-support">
            Fluent-inspired layout for storekeepers: issue, receive, stock, and
            reports in one place.
          </p>
          <div className="hero-cta-row no-print">
            <a href="#sign-in" className="btn btn-hero">
              Sign in
            </a>
          </div>
        </div>
      </section>

      <section id="sign-in" className="hero-auth">
        <div className="hero-auth-card card animate-rise animate-rise-delay-1">
          <div className="card-header">
            <div>
              <h2 className="card-title text-base">Sign in</h2>
              <p className="card-subtitle">
                School desk or supplier supply account
              </p>
            </div>
          </div>
          <div className="card-body">
            <Suspense fallback={<p className="text-sm text-[var(--muted)]">Loading…</p>}>
              <LoginForm />
            </Suspense>
          </div>
          <div className="card-footer space-y-1 text-xs text-[var(--muted)]">
            <div>School · store@greenfield.school / desk1234</div>
            <div>Supplier · supply@uniformdesk.co / desk1234</div>
          </div>
        </div>
      </section>
    </main>
  );
}
