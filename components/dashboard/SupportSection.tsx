'use client';

import { HelpCircle } from 'lucide-react';

interface Faq {
  question: string;
  answer: string;
}

interface SupportSectionProps {
  faqs: Faq[];
}

export function SupportSection({ faqs }: SupportSectionProps) {
  if (!faqs || faqs.length === 0) return null;

  return (
    <section className="pt-2">
      <div className="bg-card/10 border border-border/20 rounded-xl overflow-hidden shadow-none backdrop-blur-sm">
        <div className="flex items-center gap-2 p-3.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground border-b border-border/20">
          <HelpCircle size={15} className="text-primary" /> Support & Frequently Asked Questions
        </div>
        <div className="p-4 grid gap-4 md:grid-cols-2">
          {faqs.map((faq, index) => (
            <div key={index} className="space-y-1">
              <p className="text-xs sm:text-sm font-semibold text-foreground/90">{faq.question}</p>
              <p className="text-xs text-muted-foreground leading-relaxed">{faq.answer}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
