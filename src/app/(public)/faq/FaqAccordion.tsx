"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

interface FaqItemData {
  _id: string;
  question: string;
  answer: string;
}

export default function FaqAccordion({ item }: { item: FaqItemData }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="surface-card">
      <div className="surface-card-inner">
        <button
          onClick={() => setIsOpen((prev) => !prev)}
          className="flex w-full items-center justify-between px-5 py-4 text-left"
        >
          <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{item.question}</span>
          <ChevronDown
            size={18}
            className={`flex-shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`}
            style={{ color: "var(--text-muted)" }}
          />
        </button>
        {isOpen && (
          <p className="border-t px-5 py-4 text-sm leading-relaxed" style={{ borderColor: "var(--border-subtle)", color: "var(--text-secondary)" }}>
            {item.answer}
          </p>
        )}
      </div>
    </div>
  );
}
