import type { Metadata } from "next";
import { cookies } from "next/headers";
import "@cyberskill/design/styles.css";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { LocaleProvider } from "@/components/locale-provider";
import { TourProvider } from "@/components/tours/tour-provider";
import { DEFAULT_LOCALE, LOCALE_COOKIE, normalizeLocale } from "@/lib/i18n/index.mjs";

export const metadata: Metadata = {
  title: "Sách Việt",
  description: "Vietnamese books for readers and partners",
};

/**
 * Inline boot for theme + lang before paint. Allowed by interim CSP
 * `script-src 'self' 'unsafe-inline'` (no hash — see next.config.ts / audit C1).
 */
const bootScript = `(function(){try{var t=localStorage.getItem("sv_theme");if(t==="light"||t==="dark")document.documentElement.setAttribute("data-theme",t);var l=localStorage.getItem("sv_locale");if(l!=="en"&&l!=="vi"){var m=document.cookie.match(/(?:^|;\\s*)sv_locale=(en|vi)(?:;|$)/);l=m?m[1]:null;}if(l==="en"||l==="vi")document.documentElement.lang=l;else document.documentElement.lang="en";}catch(e){document.documentElement.lang="en";}})();`;

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jar = await cookies();
  const cookieLocale = jar.get(LOCALE_COOKIE)?.value;
  const initialLocale = normalizeLocale(cookieLocale || DEFAULT_LOCALE) as "en" | "vi";

  return (
    <html lang={initialLocale} data-theme="light" data-cs-element="thuy" data-cs-variant="ocean" className="h-full" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: bootScript }} />
      </head>
      <body className="min-h-full">
        <ThemeProvider>
          <LocaleProvider initialLocale={initialLocale}>
            <TourProvider>{children}</TourProvider>
          </LocaleProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
