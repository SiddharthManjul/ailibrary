"use client";

import { Button } from "@/components/ui/button";
import { cn } from "cn";
import { useEffect, useRef, useState } from "react";
import type { ComponentProps } from "react";
import { useControllableState } from "../src/hooks/use-controllable-state";

export interface ButtonExampleLabels {
  off: string;
  on: string;
  pending: string;
  success: string;
  error: string;
  retry: string;
}

export interface ButtonExampleProps extends Omit<ComponentProps<"div">, "defaultValue" | "onChange"> {
  value?: boolean;
  defaultValue?: boolean;
  onValueChange?: (value: boolean) => void;
  /** Persist the requested value. A rejection keeps the previous value. */
  onAction?: (next: boolean) => void | Promise<void>;
  disabled?: boolean;
  labels?: Partial<ButtonExampleLabels>;
}

const defaultLabels: ButtonExampleLabels = {
  off: "Enable notifications",
  on: "Notifications enabled",
  pending: "Saving preference…",
  success: "Preference saved.",
  error: "Preference could not be saved. Try again.",
  retry: "Retry preference update",
};

/** Registry smoke-test item: a shadcn toggle with local or owner-managed state. */
export function ButtonExample({
  value: controlledValue,
  defaultValue = false,
  onValueChange,
  onAction,
  disabled = false,
  labels: customLabels,
  className,
  children,
  ...props
}: ButtonExampleProps) {
  const [value, setValue] = useControllableState({
    value: controlledValue,
    defaultValue,
    onChange: onValueChange,
  });
  const [status, setStatus] = useState<"idle" | "pending" | "success" | "error">("idle");
  const locked = useRef(false);
  const mounted = useRef(true);
  const lastRequest = useRef(!value);
  const labels = { ...defaultLabels, ...customLabels };

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  async function request(next: boolean) {
    if (disabled || locked.current) return;
    locked.current = true;
    lastRequest.current = next;
    setStatus("pending");
    try {
      await onAction?.(next);
      if (mounted.current) {
        setValue(next);
        setStatus("success");
      }
    } catch {
      if (mounted.current) setStatus("error");
    } finally {
      locked.current = false;
    }
  }

  return (
    <div
      data-slot="button-example"
      data-state={status === "idle" || status === "success" ? (value ? "on" : "off") : status}
      data-disabled={disabled ? "" : undefined}
      aria-busy={status === "pending"}
      className={cn("grid justify-items-start gap-3", className)}
      {...props}
    >
      <Button
        type="button"
        aria-pressed={value}
        disabled={disabled || status === "pending"}
        onClick={() => { void request(!value); }}
        data-slot="button-example-trigger"
        className="min-h-11 max-w-full whitespace-normal"
      >
        {children ?? (value ? labels.on : labels.off)}
      </Button>
      <div data-slot="button-example-feedback" className="min-h-32 text-sm">
        {status === "pending" && <p role="status" className="text-muted-foreground">{labels.pending}</p>}
        {status === "success" && <p role="status" className="text-success">{labels.success}</p>}
        {status === "error" && (
          <div className="grid justify-items-start gap-2">
            <p role="alert" className="text-destructive">{labels.error}</p>
            <Button type="button" variant="outline" disabled={disabled} onClick={() => { void request(lastRequest.current); }} data-slot="button-example-retry" className="min-h-11 max-w-full whitespace-normal">{labels.retry}</Button>
          </div>
        )}
      </div>
    </div>
  );
}

export default ButtonExample;
