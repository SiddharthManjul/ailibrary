"use client";

import { Moon, Sun } from "lucide-react";
import dynamic from "next/dynamic";
import { useTheme } from "next-themes";
import { useId, useSyncExternalStore } from "react";

const subscribe = () => () => {};
const getSnapshot = () => true;
const getServerSnapshot = () => false;
const ThemeSelect = dynamic(() => import("./theme-select").then((module) => module.ThemeSelect), {
  loading: () => (
    <button
      type="button"
      aria-label="Theme"
      disabled
      data-slot="theme-toggle"
      data-value="system"
      className="inline-flex h-9 w-full items-center justify-between gap-2 rounded-xl border border-input bg-card px-3 text-sm text-foreground opacity-45"
    >
      <span>System</span>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="m6 9 6 6 6-6" />
      </svg>
    </button>
  ),
});

export function ThemeToggle({ className, variant = "icon", ariaLabel }: { className?: string; variant?: "icon" | "select"; ariaLabel?: string }) {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const id = useId();
  const mounted = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const isDark = mounted && resolvedTheme === "dark";
  const nextTheme = isDark ? "light" : "dark";
  const Icon = isDark ? Sun : Moon;
  const label = mounted ? `Switch to ${nextTheme} mode` : "Toggle color theme";

  if (variant === "select") {
    return (
      <label htmlFor={id} className={`grid min-w-0 gap-2 text-xs text-muted-foreground${className ? ` ${className}` : ""}`}>
        <span>Theme</span>
        <ThemeSelect
          id={id}
          value={mounted ? theme ?? "system" : "system"}
          disabled={!mounted}
          onValueChange={setTheme}
        />
      </label>
    );
  }

  return (
    <button
      type="button"
      className={`inline-flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-[var(--button-radius)] border-0 bg-transparent text-foreground shadow-none outline-none transition-colors hover:text-primary focus-visible:bg-accent focus-visible:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 motion-reduce:transition-none${className ? ` ${className}` : ""}`}
      disabled={!mounted}
      onClick={() => setTheme(nextTheme)}
      aria-label={ariaLabel || label}
      title={label}
      data-slot="theme-toggle"
    >
      <Icon aria-hidden="true" className="size-4" />
    </button>
  );
}
