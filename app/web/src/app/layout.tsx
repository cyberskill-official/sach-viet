import type { Metadata } from "next";
import "@cyberskill/design/styles.css";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { LocaleProvider } from "@/components/locale-provider";
import { TourProvider } from "@/components/tours/tour-provider";

export const metadata: Metadata = {
  title: "Sách Việt",
  description: "Vietnamese books for readers and partners",
};

const bootScript = `(function(){try{var t=localStorage.getItem("sv_theme");if(t==="light"||t==="dark")document.documentElement.setAttribute("data-theme",t);var l=localStorage.getItem("sv_locale");if(l!=="en"&&l!=="vi"){var m=document.cookie.match(/(?:^|;\\s*)sv_locale=(en|vi)(?:;|$)/);l=m?m[1]:null;}if(l==="en"||l==="vi")document.documentElement.lang=l;else document.documentElement.lang="en";}catch(e){document.documentElement.lang="en";}})();`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-theme="light" data-cs-element="thuy" data-cs-variant="ocean" className="h-full" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: bootScript }} />
      </head>
      <body className="min-h-full">
        <ThemeProvider>
          <LocaleProvider>
            <TourProvider>{children}</TourProvider>
          </LocaleProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
