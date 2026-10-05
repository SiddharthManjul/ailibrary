"use client";

import { useState } from "react";
import { home } from "@content/home";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export function FAQAccordion() {
  const [value, setValue] = useState("question-0");
  return (
    <Accordion className="lp-qa" type="single" collapsible value={value} onValueChange={setValue}>
      {home.faq.map((item, index) => {
        const itemValue = `question-${index}`;
        const open = value === itemValue;
        return <AccordionItem className={`lp-q ${open ? "is-on" : ""}`} value={itemValue} key={item[0]}><AccordionTrigger>{item[0]}<i aria-hidden="true" /></AccordionTrigger><AccordionContent className="lp-q-a" forceMount aria-hidden={!open} inert={!open}><div><p>{item[1]}</p></div></AccordionContent></AccordionItem>;
      })}
    </Accordion>
  );
}
