"use client";

import { useState } from "react";
import { ChevronDown, ArrowUpRight } from "lucide-react";
import Link from "next/link";

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
          <div className="border-t px-5 py-4" style={{ borderColor: "var(--border-subtle)" }}>
            <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>{item.answer}</p>
            <Link href={`/faq/${item._id}`} className="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-brand-cyan-300 hover:text-brand-cyan-200">
              Open shareable answer <ArrowUpRight size={14} />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
