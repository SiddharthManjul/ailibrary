import type { Metadata } from "next";
import type { ReactNode } from "react";

import { ThemeProvider } from "@/components/theme-provider";

import { display } from "./fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "AI Library",
    template: "%s | AI Library",
  },
  description: "Workflows, agents and UI, together in one library.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={display.variable}
      suppressHydrationWarning
    >
      <head><link rel="alternate" type="text/markdown" href="/llms.txt" title="AI Library for agents" /></head>
      <body className="min-h-svh bg-background font-sans text-foreground antialiased">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
