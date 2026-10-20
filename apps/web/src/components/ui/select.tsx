"use client";

import * as React from "react";
import * as SelectPrimitive from "radix-ui/select";
import { Check, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "cn";

import styles from "./select.module.css";

function Select(props: React.ComponentProps<typeof SelectPrimitive.Root>) {
  return <SelectPrimitive.Root {...props} />;
}

function SelectValue(props: React.ComponentProps<typeof SelectPrimitive.Value>) {
  return <SelectPrimitive.Value data-slot="select-value" {...props} />;
}

function SelectTrigger({ className, children, ...props }: React.ComponentProps<typeof SelectPrimitive.Trigger>) {
  return (
    <SelectPrimitive.Trigger data-slot="select-trigger" className={cn(styles.trigger, className)} {...props}>
      <span className={styles.value}>{children}</span>
      <SelectPrimitive.Icon asChild>
        <ChevronDown className={styles.chevron} size={14} strokeWidth={1.75} aria-hidden="true" />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  );
}

function SelectContent({
  ref,
  className,
  children,
  position = "popper",
  align = "start",
  sideOffset = 6,
  collisionPadding = 12,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Content>) {
  const [content, setContent] = React.useState<HTMLDivElement | null>(null);
  const contentRef = React.useCallback((node: HTMLDivElement | null) => {
    setContent(node);
    const cleanup = typeof ref === "function" ? ref(node) : undefined;
    if (ref && typeof ref !== "function") ref.current = node;
    return () => {
      setContent(null);
      if (typeof cleanup === "function") cleanup();
      else if (typeof ref === "function") ref(null);
      else if (ref) ref.current = null;
    };
  }, [ref]);

  React.useLayoutEffect(() => {
    if (!content?.isConnected || content.dataset.state !== "open") return;
    // Radix traps focus and hides the background from assistive technology.
    // Inert also removes its controls from keyboard/programmatic focus while open.
    const background = new Map<Element, string | null>();
    let branch: Element = content;
    while (branch.parentElement) {
      const parent = branch.parentElement;
      for (const sibling of parent.children) {
        if (sibling === branch) continue;
        background.set(sibling, sibling.getAttribute("inert"));
        sibling.setAttribute("inert", "");
      }
      if (parent === content.ownerDocument.body) break;
      branch = parent;
    }
    return () => {
      for (const [element, previous] of background) {
        if (previous === null) element.removeAttribute("inert");
        else element.setAttribute("inert", previous);
      }
    };
  }, [content]);

  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        ref={contentRef}
        data-slot="select-content"
        className={cn(styles.content, className)}
        position={position}
        align={align}
        sideOffset={sideOffset}
        collisionPadding={collisionPadding}
        {...props}
      >
        <SelectPrimitive.ScrollUpButton className={styles.scrollButton}>
          <ChevronUp size={14} strokeWidth={1.75} aria-hidden="true" />
        </SelectPrimitive.ScrollUpButton>
        <SelectPrimitive.Viewport className={styles.viewport}>{children}</SelectPrimitive.Viewport>
        <SelectPrimitive.ScrollDownButton className={styles.scrollButton}>
          <ChevronDown size={14} strokeWidth={1.75} aria-hidden="true" />
        </SelectPrimitive.ScrollDownButton>
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  );
}

function SelectItem({ className, children, value, ...props }: React.ComponentProps<typeof SelectPrimitive.Item>) {
  return (
    <SelectPrimitive.Item data-slot="select-item" data-value={value} className={cn(styles.item, className)} value={value} {...props}>
      <SelectPrimitive.ItemText className={styles.itemText}>{children}</SelectPrimitive.ItemText>
      <SelectPrimitive.ItemIndicator className={styles.indicator}>
        <Check size={14} strokeWidth={1.75} aria-hidden="true" />
      </SelectPrimitive.ItemIndicator>
    </SelectPrimitive.Item>
  );
}

function SelectGroup(props: React.ComponentProps<typeof SelectPrimitive.Group>) {
  return <SelectPrimitive.Group data-slot="select-group" {...props} />;
}

function SelectLabel({ className, ...props }: React.ComponentProps<typeof SelectPrimitive.Label>) {
  return <SelectPrimitive.Label data-slot="select-label" className={cn(styles.label, className)} {...props} />;
}

function SelectSeparator({ className, ...props }: React.ComponentProps<typeof SelectPrimitive.Separator>) {
  return <SelectPrimitive.Separator data-slot="select-separator" className={cn(styles.separator, className)} {...props} />;
}

export { Select, SelectValue, SelectTrigger, SelectContent, SelectItem, SelectGroup, SelectLabel, SelectSeparator };
