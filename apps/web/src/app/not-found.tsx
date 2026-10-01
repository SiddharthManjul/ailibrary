import Link from "next/link";

import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-svh bg-background text-foreground">
      <header className="border-b border-border">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <Link href="/" className="font-display text-lg font-bold">
            AI Library
          </Link>
          <ThemeToggle />
        </div>
      </header>
      <main
        className="mx-auto flex min-h-[calc(100svh-4rem)] max-w-xl flex-col items-center justify-center gap-6 px-6 py-16 text-center"
        aria-labelledby="not-found-title"
      >
        <div className="space-y-3">
          <p className="font-mono text-sm text-primary">404</p>
          <h1 id="not-found-title" className="text-4xl font-bold tracking-tight sm:text-5xl">
            Page not found
          </h1>
          <p className="text-muted-foreground">
            This page may have moved or no longer exists.
          </p>
        </div>
        <Button asChild>
          <Link href="/">Return home</Link>
        </Button>
      </main>
    </div>
  );
}
