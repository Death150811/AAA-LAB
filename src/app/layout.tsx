import type { Metadata, Viewport } from "next";
import "@fontsource/ibm-plex-sans/latin-400.css";
import "@fontsource/ibm-plex-sans/latin-500.css";
import "@fontsource/ibm-plex-sans/latin-600.css";
import "@fontsource/ibm-plex-sans/latin-700.css";
import "@fontsource/ibm-plex-sans/cyrillic-400.css";
import "@fontsource/ibm-plex-sans/cyrillic-500.css";
import "@fontsource/ibm-plex-sans/cyrillic-600.css";
import "@fontsource/ibm-plex-sans/cyrillic-700.css";
import "@fontsource-variable/jetbrains-mono/wght.css";
import "./globals.css";
import { CommandPalette } from "@/components/nav/CommandPalette";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader, type HeaderDomain } from "@/components/layout/SiteHeader";
import { domains } from "@/content/registry";
import { StoreHydrator } from "@/store/hydrate";

export const metadata: Metadata = {
  title: {
    default: "DevDock Ultra — инженерная энциклопедия веб-разработки и Computer Science",
    template: "%s · DevDock Ultra",
  },
  description:
    "Структурированная система знаний: HTML, CSS, JavaScript, SQL, Git и основы Computer Science — от фундамента до инженерных задач, проектов и подготовки к собеседованиям.",
};

export const viewport: Viewport = {
  themeColor: "#090c11",
  colorScheme: "dark",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const headerDomains: HeaderDomain[] = domains.map((d) => ({
    slug: d.slug,
    title: d.title,
    code: d.code,
    available: d.modules.some((m) => m.topics.length > 0),
  }));

  return (
    <html lang="ru">
      <body>
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:rounded-md focus:bg-cyan focus:px-3 focus:py-2 focus:text-sm focus:font-semibold focus:text-bg"
        >
          Перейти к содержимому
        </a>
        <StoreHydrator />
        <SiteHeader domains={headerDomains} />
        <main id="main">{children}</main>
        <SiteFooter />
        <CommandPalette />
      </body>
    </html>
  );
}
