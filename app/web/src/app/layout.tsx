import type { Metadata } from "next";
import "@cyberskill/design/styles.css";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";

export const metadata: Metadata = {
  title: "Sách Việt",
  description: "Không gian sách Việt dành cho độc giả và đối tác",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" data-theme="light" data-cs-element="thuy" className="h-full" suppressHydrationWarning>
      <body className="min-h-full">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
