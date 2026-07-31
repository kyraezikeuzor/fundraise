"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

const FAQ_ITEMS = [
  {
    id: "used",
    question: "How will my donation be used?",
    answer:
      "Your gift supports Omelora's youth education programs: learning materials, community chapters, and hands-on projects that help young people access opportunity worldwide.",
  },
  {
    id: "tax",
    question: "Is my donation tax-deductible?",
    answer:
      "Yes. Omelora is fiscally sponsored by The Hack Foundation (d.b.a. Hack Club), a 501(c)(3) nonprofit (EIN 81-2908499). Donations processed through our fundraiser are generally tax-deductible in the U.S. to the extent allowed by law. Please consult your tax advisor for your situation.",
  },
  {
    id: "legit",
    question: "How do I know this is legitimate?",
    answer:
      "Omelora operates under fiscal sponsorship through HCB (Hack Club Bank / The Hack Foundation), which provides nonprofit banking, compliance, and transparent financial oversight. You can also reach us anytime at contact@omelora.org.",
  },
] as const;

export default function DonateFaq() {
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <section>
      <h2 className="text-2xl font-bold text-foreground sm:text-3xl">
        Frequently Asked Questions
      </h2>

      <div className="mt-6 divide-y divide-border border-y border-border">
        {FAQ_ITEMS.map((item) => {
          const isOpen = openId === item.id;
          return (
            <div key={item.id}>
              <button
                type="button"
                aria-expanded={isOpen}
                onClick={() =>
                  setOpenId((prev) => (prev === item.id ? null : item.id))
                }
                className="flex w-full items-center justify-between gap-4 py-4 text-left"
              >
                <span className="text-base font-medium text-foreground sm:text-lg">
                  {item.question}
                </span>
                <ChevronDown
                  className={`h-5 w-5 shrink-0 text-muted-foreground transition-transform ${
                    isOpen ? "rotate-180" : ""
                  }`}
                  aria-hidden
                />
              </button>
              {isOpen ? (
                <div className="pb-5 text-base font-normal leading-relaxed text-muted-foreground sm:text-lg">
                  {item.answer}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}
