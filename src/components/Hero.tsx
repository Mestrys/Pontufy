import React, { useState } from 'react';
import { ArrowRight, Mail, Users, Building, CheckCircle, ChevronDown, Award, Sparkles, ShieldCheck } from 'lucide-react';
import { translations } from '../translations';

interface HeroProps {
  onStartSimulation: () => void;
  language: string;
}

export default function Hero({ onStartSimulation, language }: HeroProps) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('');
  const [companySize, setCompanySize] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const t = translations[language].hero;

  const handleLeadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setSubmitted(true);
  };

  return (
    <section className="relative pt-[108px] pb-24 bg-gradient-to-b from-slate-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">

          {/* Left Block: B2B Pitch & Features */}
          <div className="lg:col-span-7 space-y-8 text-left">

            {/* Top Badge */}
            <div className="inline-flex items-center gap-2 bg-white border border-slate-200/60 rounded-full px-4 py-1.5 text-xs font-medium text-slate-500">
              <Sparkles className="w-3.5 h-3.5 text-purple-500" />
              <span>{t.badge}</span>
            </div>

            {/* Main Headline */}
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight text-slate-900 leading-tight text-balance">
              {t.title}
              <span className="bg-gradient-to-r from-purple-600 to-emerald-500 bg-clip-text text-transparent">
                {t.titleAccent}
              </span>
              {t.titleEnd}
            </h1>

            {/* Supporting Pitch */}
            <p className="text-lg text-slate-500 leading-relaxed max-w-2xl">
              {t.desc}
            </p>

            {/* Bullet list of core capabilities */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-2.5 text-sm text-slate-600">
                  <CheckCircle className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>{translations[language].matrix.cards[i].title}</span>
                </div>
              ))}
            </div>

            {/* Stats */}
            <div className="pt-6 border-t border-slate-200/60 grid grid-cols-3 gap-6">
              <div>
                <span className="block text-2xl font-display font-semibold tracking-tight text-slate-900">+185%</span>
                <span className="text-xs text-slate-500">
                  {language === 'PT-BR' ? 'Engajamento em Cursos' : language === 'EN-US' ? 'Training Engagement' : 'Compromiso en Cursos'}
                </span>
              </div>
              <div>
                <span className="block text-2xl font-display font-semibold tracking-tight text-slate-900">Zero</span>
                <span className="text-xs text-slate-500">
                  {language === 'PT-BR' ? 'Logística para o RH' : language === 'EN-US' ? 'Logistics for HR' : 'Logística para RRHH'}
                </span>
              </div>
              <div>
                <span className="block text-2xl font-display font-semibold tracking-tight text-slate-900">100%</span>
                <span className="text-xs text-slate-500">
                  {language === 'PT-BR' ? 'Isolamento de Dados' : language === 'EN-US' ? 'Data Isolation' : 'Aislamiento de Datos'}
                </span>
              </div>
            </div>

          </div>

          {/* Right Block: Conversion Box */}
          <div id="lead-form" className="lg:col-span-5">
            <div className="bg-white border border-slate-200/60 p-8 rounded-2xl relative overflow-hidden">

              {/* Fine brand accent line */}
              <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-purple-500 to-emerald-400"></div>

              {!submitted ? (
                <form onSubmit={handleLeadSubmit} className="space-y-5">
                  <div className="text-center pb-2">
                    <h3 className="font-display text-xl font-semibold tracking-tight text-slate-900 text-balance">{t.formTitle}</h3>
                    <p className="text-xs text-slate-500 mt-1.5">
                      {t.formSub}
                    </p>
                  </div>

                  {/* Corporate Email */}
                  <div className="space-y-1">
                    <label className="block text-xs font-medium text-slate-500">
                      {t.labelEmail}
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="nome@empresa.com"
                        className="w-full bg-slate-50 border border-slate-200/60 rounded-xl py-3 pl-10 pr-4 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-500/10 transition-colors"
                      />
                    </div>
                  </div>

                  {/* Role Selection */}
                  <div className="space-y-1">
                    <label className="block text-xs font-medium text-slate-500">
                      {t.labelRole}
                    </label>
                    <div className="relative">
                      <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <select
                        required
                        value={role}
                        onChange={(e) => setRole(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200/60 rounded-xl py-3 pl-10 pr-10 text-sm text-slate-800 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-500/10 transition-colors appearance-none"
                      >
                        <option value="">{t.roleOptions.default}</option>
                        <option value="hrDirector">{t.roleOptions.hrDirector}</option>
                        <option value="ldManager">{t.roleOptions.ldManager}</option>
                        <option value="ceo">{t.roleOptions.ceo}</option>
                        <option value="opsManager">{t.roleOptions.opsManager}</option>
                        <option value="others">{t.roleOptions.others}</option>
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    </div>
                  </div>

                  {/* Company Size */}
                  <div className="space-y-1">
                    <label className="block text-xs font-medium text-slate-500">
                      {t.labelSize}
                    </label>
                    <div className="relative">
                      <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <select
                        required
                        value={companySize}
                        onChange={(e) => setCompanySize(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200/60 rounded-xl py-3 pl-10 pr-10 text-sm text-slate-800 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-500/10 transition-colors appearance-none"
                      >
                        <option value="">{t.sizeOptions.default}</option>
                        <option value="micro">{t.sizeOptions.micro}</option>
                        <option value="small">{t.sizeOptions.small}</option>
                        <option value="medium">{t.sizeOptions.medium}</option>
                        <option value="large">{t.sizeOptions.large}</option>
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    </div>
                  </div>

                  {/* Action Button */}
                  <button
                    type="submit"
                    className="w-full py-3.5 rounded-xl text-sm font-medium text-white bg-slate-900 hover:bg-slate-800 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>{t.btnSubmit}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  <div className="text-center pt-2">
                    <span className="text-xs text-slate-400 flex items-center justify-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
                      {t.disclaimer}
                    </span>
                  </div>
                </form>
              ) : (
                <div className="text-center space-y-6 py-8">
                  <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 mx-auto shadow-sm">
                    <CheckCircle className="w-8 h-8" />
                  </div>

                  <div className="space-y-2">
                    <h3 className="font-display text-2xl font-semibold tracking-tight text-slate-900">{t.successTitle}</h3>
                    <p className="text-sm text-slate-500 leading-relaxed">
                      {t.successDesc.replace('{email}', email)}
                    </p>
                  </div>

                  {/* Interactive hint */}
                  <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-4 text-xs text-slate-500 leading-relaxed">
                    <span className="font-medium text-slate-700 mb-1 flex items-center justify-center gap-1">
                      <Award className="w-4 h-4 text-slate-500" />
                      {t.successTipTitle}
                    </span>
                    {t.successTipText}
                  </div>

                  <button
                    type="button"
                    onClick={onStartSimulation}
                    className="px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-medium transition-colors cursor-pointer"
                  >
                    {t.successBtn}
                  </button>
                </div>
              )}

            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
