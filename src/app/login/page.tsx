import { Suspense } from "react";
import Image from "next/image";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/login-form";
import { ThemeMenu } from "@/components/theme-menu";
import { getSessionUser, homePathForUser } from "@/lib/auth";

export default async function LoginPage() {
  const user = await getSessionUser();
  if (user) redirect(homePathForUser(user));

  return (
    <main className="login-shell">
      <div className="login-bg" aria-hidden>
        <Image
          src="/login/students-kenya-central.png"
          alt="Kenyan secondary students in school uniforms"
          fill
          priority
          unoptimized
          sizes="100vw"
          className="login-bg-image"
        />
        <div className="login-bg-shade" />
      </div>

      <div className="login-topbar">
        <div className="login-theme-chip">
          <ThemeMenu align="left" />
        </div>
      </div>

      <div className="login-layout">
        <div className="login-center animate-rise">
          <section className="login-brand">
            <div className="login-mark" aria-hidden>
              UD
            </div>
            <h1 className="login-brand-title">UniformDesk</h1>
            <p className="login-brand-line">
              National supplier portal for uniform stock, campus co-issue, and
              school follow-up reports.
            </p>
          </section>

          <section id="sign-in" className="login-panel-wrap">
            <div className="login-glass">
              <header className="login-glass-header">
                <h2 className="login-glass-title">Sign in</h2>
                <p className="login-glass-sub">
                  Supplier admin or staff
                </p>
              </header>
              <div className="login-glass-body">
                <Suspense
                  fallback={
                    <p className="text-sm text-white/70">Loading…</p>
                  }
                >
                  <LoginForm variant="glass" />
                </Suspense>
              </div>
              <footer className="login-glass-footer">
                <details className="login-demo">
                  <summary>Demo accounts</summary>
                  <div className="login-demo-list">
                    <div>Admin · supply@uniformdesk.co / desk1234</div>
                    <div>Staff · staff@uniformdesk.co / desk1234</div>
                  </div>
                </details>
              </footer>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
