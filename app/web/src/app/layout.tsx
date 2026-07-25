import type { Metadata } from "next";
import "@cyberskill/design/styles.css";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";

export const metadata: Metadata = {
  title: "Sách Việt",
  description: "Không gian sách Việt dành cho độc giả và đối tác",
};

const themeInitScript = `(function(){try{var t=localStorage.getItem("sv_theme");if(t==="light"||t==="dark")document.documentElement.setAttribute("data-theme",t);}catch(e){}})();`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" data-theme="light" data-cs-element="thuy" className="h-full" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="min-h-full">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
