import React from 'react';
import { ShieldAlert, Cpu, Gift, BarChart3, Fingerprint, Sparkles, Server } from 'lucide-react';
import { translations } from '../translations';

interface FeaturesMatrixProps {
  language: string;
}

export default function FeaturesMatrix({ language }: FeaturesMatrixProps) {
  const t = translations[language].matrix;

  const featureIcons = [Cpu, Gift, Fingerprint, Server, BarChart3, Sparkles];
  const featureBadges = [
    language === 'PT-BR' ? 'Inovação' : language === 'EN-US' ? 'Innovation' : 'Innovación',
    language === 'PT-BR' ? 'Mais Popular' : language === 'EN-US' ? 'Most Popular' : 'Más Popular',
    language === 'PT-BR' ? 'Segurança' : language === 'EN-US' ? 'Security' : 'Seguridad',
    language === 'PT-BR' ? 'Performance' : language === 'EN-US' ? 'Performance' : 'Performance',
    language === 'PT-BR' ? 'Analytics' : language === 'EN-US' ? 'Analytics' : 'Analytics',
    language === 'PT-BR' ? 'Customização' : language === 'EN-US' ? 'Customization' : 'Personalización',
  ];

  return (
    <section id="features-matrix" className="py-24 bg-slate-50 border-t border-slate-200/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 bg-slate-50 border border-slate-200/60 text-slate-500 px-3 py-1 rounded-full text-xs font-medium mb-4">
            <ShieldAlert className="w-3.5 h-3.5 text-purple-500" />
            <span>{language === 'PT-BR' ? 'Resiliência & Segurança' : language === 'EN-US' ? 'Resilience & Security' : 'Resiliencia & Seguridad'}</span>
          </div>
          <h2 className="font-display text-3xl sm:text-4xl font-semibold tracking-tight text-slate-900 text-balance">
            {t.title}
          </h2>
          <p className="mt-4 text-lg text-slate-500 text-balance">
            {t.desc}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {t.cards.map((card, index) => {
            const Icon = featureIcons[index] || Cpu;
            const badge = featureBadges[index] || 'Pontufy';

            return (
              <div
                key={index}
                className="group relative bg-white rounded-2xl p-8 border border-slate-200/60 hover:border-slate-300 transition-colors duration-300 flex flex-col"
              >
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-slate-50 border border-slate-200/60 text-slate-600 group-hover:text-purple-600 transition-colors duration-300">
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-medium text-slate-400">
                    {badge}
                  </span>
                </div>
                <h3 className="font-display text-lg font-semibold tracking-tight text-slate-900 mb-2">
                  {card.title}
                </h3>
                <p className="text-slate-500 text-sm leading-relaxed">
                  {card.text}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
