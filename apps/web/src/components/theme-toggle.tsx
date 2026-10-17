"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";

const subscribe = () => () => {};
const getSnapshot = () => true;
const getServerSnapshot = () => false;

export function ThemeToggle({ className, variant = "icon", ariaLabel }: { className?: string; variant?: "icon" | "select"; ariaLabel?: string }) {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const isDark = mounted && resolvedTheme === "dark";
  const nextTheme = isDark ? "light" : "dark";
  const Icon = isDark ? Sun : Moon;
  const label = mounted ? `Switch to ${nextTheme} mode` : "Toggle color theme";

  if (variant === "select") {
    return (
      <label className={`grid gap-1 text-xs text-muted-foreground${className ? ` ${className}` : ""}`}>
        Theme
        <select
          aria-label="Theme"
          value={mounted ? theme ?? "system" : "system"}
          disabled={!mounted}
          onChange={(event) => setTheme(event.target.value)}
          className="min-h-11 rounded-md border border-input bg-card px-3 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          data-slot="theme-toggle"
        >
          <option value="light">Light</option>
          <option value="dark">Dark</option>
          <option value="system">System</option>
        </select>
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
