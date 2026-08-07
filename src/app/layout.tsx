import type { Metadata, Viewport } from "next";
import { ServiceWorkerRegister } from "@/components/sw-register";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "UniformDesk",
  description: "Supplier supply · School issue · Proof for every student",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "UniformDesk",
    statusBarStyle: "default",
  },
  icons: {
    icon: [{ url: "/icons/icon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/icons/icon.svg" }],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#faf9f8" },
    { media: "(prefers-color-scheme: dark)", color: "#1f1f1f" },
  ],
};

const themeBootScript = `
(() => {
  try {
    const stored = localStorage.getItem('ud-theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    let theme = 'fluent';
    if (stored === 'fluent' || stored === 'fluent-dark' || stored === 'colorful') theme = stored;
    else if (stored === 'evening' || stored === 'noir' || stored === 'midnight' || stored === 'dark' || (!stored && prefersDark)) theme = 'fluent-dark';
    else if (stored) theme = 'fluent';
    document.documentElement.setAttribute('data-theme', theme);
  } catch {}
})();
`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootScript }} />
      </head>
      <body className="flex min-h-full flex-col text-[var(--ink)]">
        <ThemeProvider>
          <ServiceWorkerRegister />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
