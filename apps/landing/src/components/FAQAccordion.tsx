import React, { useState } from 'react';
import { ChevronDown, HelpCircle } from 'lucide-react';
import { translations } from '../translations';

interface FAQAccordionProps {
  language: string;
}

export default function FAQAccordion({ language }: FAQAccordionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const t = translations[language].faq;

  return (
    <section id="faq" className="py-24 bg-slate-50 border-t border-slate-200/60">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 bg-slate-50 border border-slate-200/60 text-slate-500 px-3 py-1 rounded-full text-xs font-medium mb-4">
            <HelpCircle className="w-3.5 h-3.5 text-purple-500" />
            <span>{language === 'PT-BR' ? 'Respostas Imediatas' : language === 'EN-US' ? 'Instant Answers' : 'Respuestas Inmediatas'}</span>
          </div>
          <h2 className="font-display text-3xl sm:text-4xl font-semibold tracking-tight text-slate-900 text-balance">
            {t.title}
          </h2>
          <p className="mt-4 text-lg text-slate-500 text-balance">
            {t.desc}
          </p>
        </div>

        <div className="space-y-4">
          {t.items.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <div
                key={index}
                className={`border rounded-2xl overflow-hidden transition-colors duration-300 ${
                  isOpen
                    ? 'border-slate-300 bg-slate-50'
                    : 'border-slate-200/60 bg-white hover:border-slate-300'
                }`}
              >
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  aria-expanded={isOpen}
                  className="w-full flex justify-between items-center px-6 py-5 text-left font-medium text-slate-900 focus:outline-none cursor-pointer"
                >
                  <span className="pr-4">{faq.question}</span>
                  <ChevronDown
                    className={`w-5 h-5 text-slate-400 shrink-0 transition-transform duration-300 ${
                      isOpen ? 'rotate-180 text-slate-600' : ''
                    }`}
                  />
                </button>
                <div
                  className={`transition-all duration-300 ease-in-out overflow-hidden ${
                    isOpen ? 'max-h-60 border-t border-slate-200/60' : 'max-h-0'
                  }`}
                >
                  <div className="px-6 py-5 text-slate-500 text-sm leading-relaxed">
                    {faq.answer}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
