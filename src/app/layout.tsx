import type { Metadata, Viewport } from "next";
import "@fontsource/spectral/300.css";
import "@fontsource/spectral/300-italic.css";
import "@fontsource/spectral/400.css";
import "@fontsource/spectral/400-italic.css";
import "@fontsource/spectral/500.css";
import "@fontsource/spectral/600.css";
import "@fontsource-variable/literata/opsz.css";
import "@fontsource-variable/literata/opsz-italic.css";
import "@fontsource-variable/geologica/wght.css";
import "@fontsource-variable/martian-mono/wght.css";
import "@fontsource-variable/jetbrains-mono/wght.css";
import "./globals.css";
import { CommandPalette } from "@/components/nav/CommandPalette";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader, type HeaderDomain } from "@/components/layout/SiteHeader";
import { domains } from "@/content/registry";
import { THEME_INIT_SCRIPT } from "@/lib/theme";
import { ClerkProvider } from "@clerk/nextjs";
import { ruRU } from "@clerk/localizations";
import { CloudSyncSlot } from "@/components/auth/AuthSlots";
import { authEnabled } from "@/lib/auth/config";
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
  themeColor: "#0f0e0c",
  colorScheme: "dark",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const headerDomains: HeaderDomain[] = domains.map((d) => ({
    slug: d.slug,
    title: d.title,
    code: d.code,
    available: d.modules.some((m) => m.topics.length > 0),
  }));

  const auth = authEnabled();
  const page = (
    <html lang="ru" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body suppressHydrationWarning>
        <StoreHydrator />
        <SiteHeader domains={headerDomains} authEnabled={auth} />
        <main id="main">{children}</main>
        <SiteFooter />
        <CommandPalette />
        {auth && <CloudSyncSlot />}
      </body>
    </html>
  );

  // Без ключей Clerk слой входа не подключается вообще.
  return auth ? (
    <ClerkProvider
      localization={ruRU}
      appearance={{
        variables: {
          colorPrimary: "#e8603f",
          colorBackground: "#14120f",
          colorForeground: "#ece5d3",
          colorMutedForeground: "#b8ae98",
          colorInput: "#191712",
          colorInputForeground: "#ece5d3",
          colorBorder: "#4a4332",
          borderRadius: "3px",
        },
      }}
    >
      {page}
    </ClerkProvider>
  ) : (
    page
  );
}
