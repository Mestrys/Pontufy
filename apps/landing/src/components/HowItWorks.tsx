import React from 'react';
import { Sparkles, BrainCircuit, BarChart, Gift, ArrowRight } from 'lucide-react';
import { translations } from '../translations';

interface HowItWorksProps {
  language: string;
}

export default function HowItWorks({ language }: HowItWorksProps) {
  const t = translations[language].howItWorks;

  const stepIcons = [BrainCircuit, Sparkles, BarChart, Gift];

  return (
    <section id="how-it-works" className="py-24 bg-slate-50 border-t border-slate-200/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 bg-slate-50 border border-slate-200/60 text-slate-500 px-3 py-1 rounded-full text-xs font-medium mb-4">
            <span>{t.badge}</span>
          </div>
          <h2 className="font-display text-3xl sm:text-4xl font-semibold tracking-tight text-slate-900 text-balance">
            {t.title}
          </h2>
          <p className="mt-4 text-lg text-slate-500 text-balance">
            {t.desc}
          </p>
        </div>

        {/* Steps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {t.steps.map((step, index) => {
            const Icon = stepIcons[index] || BrainCircuit;
            return (
              <div key={index} className="flex flex-col items-center text-center group">
                {/* Icon Container */}
                <div className="relative w-16 h-16 rounded-2xl bg-slate-50 border border-slate-200/60 flex items-center justify-center mb-6 transition-colors duration-300 group-hover:border-slate-300">
                  <Icon className="w-7 h-7 text-slate-700 transition-colors duration-300 group-hover:text-purple-600" />
                  <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-white border border-slate-200/60 flex items-center justify-center text-xs font-medium text-slate-400">
                    {step.num}
                  </span>
                </div>

                {/* Content */}
                <h3 className="font-display text-lg font-semibold tracking-tight text-slate-900 mb-2">
                  {step.title}
                </h3>
                <p className="text-slate-500 text-sm leading-relaxed max-w-xs">
                  {step.text}
                </p>
              </div>
            );
          })}
        </div>

        {/* CTA Banner */}
        <div className="mt-16 bg-slate-50 rounded-2xl p-8 md:p-10 border border-slate-200/60 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-center md:text-left">
            <h4 className="font-display text-xl font-semibold tracking-tight text-slate-900 text-balance">
              {language === 'PT-BR' ? 'Pronto para engajar seus colaboradores?' : language === 'EN-US' ? 'Ready to engage your employees?' : '¿Listo para comprometer a sus colaboradores?'}
            </h4>
            <p className="text-sm text-slate-500 mt-1">
              {language === 'PT-BR' ? 'Gere um curso completo e teste o resgate de vouchers no simulador abaixo.' : language === 'EN-US' ? 'Generate a custom training module and test voucher redemption in the simulator below.' : 'Genere una lección completa y pruebe el canje de cupones en el simulador.'}
            </p>
          </div>
          <button
            onClick={() => {
              const element = document.getElementById('course-simulator');
              if (element) element.scrollIntoView({ behavior: 'smooth' });
            }}
            className="font-sans text-sm font-medium text-white px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 transition-colors flex items-center gap-1.5 cursor-pointer shrink-0"
          >
            <span>{language === 'PT-BR' ? 'Ir Para o Simulador IA' : language === 'EN-US' ? 'Go to AI Simulator' : 'Ir al Simulador IA'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

      </div>
    </section>
  );
}
