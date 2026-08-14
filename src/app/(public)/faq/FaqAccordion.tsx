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
    <div className="rounded-lg border border-base-800 bg-base-900">
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex w-full items-center justify-between px-4 py-3 text-left"
      >
        <span className="text-sm font-medium text-neutral-100">{item.question}</span>
        <ChevronDown
          size={18}
          className={`flex-shrink-0 text-neutral-500 transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>
      {isOpen && <p className="border-t border-base-800 px-4 py-3 text-sm text-neutral-400">{item.answer}</p>}
    </div>
  );
}
