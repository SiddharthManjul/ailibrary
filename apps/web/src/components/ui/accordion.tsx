"use client";

import * as React from "react";
import * as AccordionPrimitive from "radix-ui/accordion";

function Accordion(props: React.ComponentProps<typeof AccordionPrimitive.Root>) {
  return <AccordionPrimitive.Root data-slot="accordion" {...props} />;
}

function AccordionItem(props: React.ComponentProps<typeof AccordionPrimitive.Item>) {
  return <AccordionPrimitive.Item data-slot="accordion-item" {...props} />;
}

function AccordionTrigger(props: React.ComponentProps<typeof AccordionPrimitive.Trigger>) {
  return <AccordionPrimitive.Header className="lp-q-heading"><AccordionPrimitive.Trigger data-slot="accordion-trigger" {...props} /></AccordionPrimitive.Header>;
}

function AccordionContent(props: React.ComponentProps<typeof AccordionPrimitive.Content>) {
  return <AccordionPrimitive.Content data-slot="accordion-content" {...props} />;
}

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent };
