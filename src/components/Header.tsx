import React, { useState, useEffect } from 'react';
import { Menu, X, ArrowRight, ChevronDown, Shield, Zap, Crown, BookOpen, LogIn } from 'lucide-react';
import { translations } from '../translations';
import { LOGIN_URL } from '../config';

interface HeaderProps {
  language: string;
  setLanguage: (lang: string) => void;
  points: number;
}

const badges = [
  {
    id: 'novice',
    threshold: 0,
    icon: BookOpen,
    names: {
      'PT-BR': 'Aprendiz Novato',
      'EN-US': 'Novice Learner',
      'ES-LA': 'Aprendiz Novato'
    },
    descriptions: {
      'PT-BR': 'Iniciou sua jornada rumo ao acúmulo de patrimônio profissional.',
      'EN-US': 'Started your journey towards building professional equity.',
      'ES-LA': 'Inició su viaje hacia la acumulación de patrimonio profesional.'
    }
  },
  {
    id: 'security_pro',
    threshold: 600,
    icon: Shield,
    names: {
      'PT-BR': 'Pro de Segurança',
      'EN-US': 'Security Pro',
      'ES-LA': 'Pro de Seguridad'
    },
    descriptions: {
      'PT-BR': 'Dominou os pilares de segurança e integridade de ledger.',
      'EN-US': 'Mastered the pillars of security and ledger integrity.',
      'ES-LA': 'Dominó los pilares de seguridad e integridad del ledger.'
    }
  },
  {
    id: 'master_trainer',
    threshold: 1000,
    icon: Zap,
    names: {
      'PT-BR': 'Treinador Mestre',
      'EN-US': 'Master Trainer',
      'ES-LA': 'Maestro de Entrenamiento'
    },
    descriptions: {
      'PT-BR': 'Capaz de disseminar conhecimentos complexos com excelência.',
      'EN-US': 'Capable of teaching complex topics with supreme autonomy.',
      'ES-LA': 'Capaz de enseñar temas complejos con suprema autonomía.'
    }
  },
  {
    id: 'trajectory_titan',
    threshold: 1500,
    icon: Crown,
    names: {
      'PT-BR': 'Titã de Trajetória',
      'EN-US': 'Trajectory Titan',
      'ES-LA': 'Titán de Trayectoria'
    },
    descriptions: {
      'PT-BR': 'Nível máximo de proficiência. Conhecimento portátil consolidado.',
      'EN-US': 'Maximum level of proficiency. Consolidated portable knowledge.',
      'ES-LA': 'Nivel máximo de competencia. Conocimiento portátil consolidado.'
    }
  }
];

type LangKey = 'PT-BR' | 'EN-US' | 'ES-LA';

export default function Header({ language, setLanguage, points }: HeaderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [showLangDropdown, setShowLangDropdown] = useState(false);

  const t = translations[language].header;
  const lang = language as LangKey;

  const activeBadge = [...badges].reverse().find(b => points >= b.threshold) || badges[0];
  const ActiveBadgeIcon = activeBadge.icon;

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleScrollTo = (id: string) => {
    setIsOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const languagesList = [
    { code: 'PT-BR', label: 'Português', flag: '🇧🇷' },
    { code: 'EN-US', label: 'English', flag: '🇺🇸' },
    { code: 'ES-LA', label: 'Español', flag: '🇪🇸' }
  ];

  const currentLangObj = languagesList.find(l => l.code === language) || languagesList[0];

  const nextBadge = badges.find(b => points < b.threshold);
  const prevThreshold = activeBadge.threshold;
  const nextThreshold = nextBadge ? nextBadge.threshold : 1500;
  const range = nextThreshold - prevThreshold;
  const progress = range > 0 ? Math.min(100, Math.max(0, ((points - prevThreshold) / range) * 100)) : 100;

  return (
    <header className="fixed top-0 inset-x-0 z-50">
      {/* Main bar */}
      <div
        className={`backdrop-blur-md transition-colors duration-300 border-b ${
          isScrolled ? 'bg-white/80 border-slate-200/80' : 'bg-white/60 border-slate-200/60'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="flex items-center gap-2 cursor-pointer select-none"
            >
              <img
                src="/logo.svg"
                className="h-8 w-8 object-contain select-none"
                alt="Pontufy Logo"
              />
              <span className="font-display text-xl font-semibold tracking-tight text-slate-900">
                Pontu<span className="text-purple-600">fy</span>
              </span>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden xl:flex items-center gap-6">
              {[
                { id: 'how-it-works', label: t.howItWorks },
                { id: 'course-simulator', label: t.aiSimulator },
                { id: 'rewards-showcase', label: t.rewards },
                { id: 'security-architecture', label: t.security }
              ].map(item => (
                <button
                  key={item.id}
                  onClick={() => handleScrollTo(item.id)}
                  className="font-sans text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
                >
                  {item.label}
                </button>
              ))}
            </nav>

            {/* CTAs + Language Switcher */}
            <div className="hidden xl:flex items-center gap-2.5">
              {/* Language Switcher */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowLangDropdown(!showLangDropdown)}
                  aria-label="Selecionar idioma"
                  className="flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors py-2 px-2 rounded-xl hover:bg-slate-50 cursor-pointer"
                >
                  <span>{currentLangObj.flag}</span>
                  <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${showLangDropdown ? 'rotate-180' : ''}`} />
                </button>

                {showLangDropdown && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setShowLangDropdown(false)}
                    ></div>
                    <div className="absolute right-0 mt-2 w-40 rounded-2xl bg-white border border-slate-200/60 shadow-sm py-2 z-20 overflow-hidden">
                      {languagesList.map((l) => (
                        <button
                          key={l.code}
                          type="button"
                          onClick={() => {
                            setLanguage(l.code);
                            setShowLangDropdown(false);
                          }}
                          className={`w-full flex items-center gap-3 px-4 py-2.5 text-left text-xs font-medium transition-colors cursor-pointer ${
                            language === l.code ? 'text-slate-900 bg-slate-50' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                          }`}
                        >
                          <span className="text-base leading-none">{l.flag}</span>
                          <span>{l.label}</span>
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>

              <a
                href={LOGIN_URL}
                className="font-sans text-sm font-medium text-slate-700 px-4 py-2 rounded-xl border border-slate-200 bg-white/70 hover:border-slate-300 hover:text-slate-900 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <LogIn className="w-4 h-4" />
                <span>{t.login}</span>
              </a>
              <button
                onClick={() => handleScrollTo('lead-form')}
                className="font-sans text-sm font-medium text-white px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <span>{t.cta}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Mobile / compact: language + menu */}
            <div className="flex items-center gap-2 xl:hidden">
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowLangDropdown(!showLangDropdown)}
                  className="flex items-center gap-1 text-sm font-medium text-slate-500 py-1.5 px-2 rounded-lg bg-slate-50 border border-slate-200/60 cursor-pointer"
                >
                  <span>{currentLangObj.flag}</span>
                  <span className="text-xs">{currentLangObj.code}</span>
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                </button>

                {showLangDropdown && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowLangDropdown(false)}></div>
                    <div className="absolute right-0 mt-2 w-36 rounded-xl bg-white border border-slate-200/60 shadow-sm py-1.5 z-20 overflow-hidden">
                      {languagesList.map((l) => (
                        <button
                          key={l.code}
                          type="button"
                          onClick={() => {
                            setLanguage(l.code);
                            setShowLangDropdown(false);
                          }}
                          className={`w-full flex items-center gap-2.5 px-3 py-2 text-left text-xs font-medium ${
                            language === l.code ? 'text-slate-900 bg-slate-50' : 'text-slate-500 hover:bg-slate-50'
                          }`}
                        >
                          <span className="text-sm leading-none">{l.flag}</span>
                          <span>{l.label}</span>
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>

              <button
                onClick={() => setIsOpen(!isOpen)}
                aria-label={isOpen ? 'Fechar menu' : 'Abrir menu'}
                aria-expanded={isOpen}
                className="inline-flex items-center justify-center p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-50 focus:outline-none"
              >
                {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="xl:hidden bg-white border-t border-slate-200/60 px-4 pt-4 pb-6 space-y-1">
            {/* Demo profile summary */}
            <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-4 mb-3">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-xl bg-slate-900 flex items-center justify-center text-white font-semibold text-xs">
                  RS
                </div>
                <div>
                  <h4 className="font-display font-semibold text-slate-900 text-sm tracking-tight">Rodrigo Silva</h4>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <ActiveBadgeIcon className="w-3 h-3 text-slate-500" />
                    <span className="text-xs font-medium text-slate-500">
                      {activeBadge.names[lang]}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold font-mono text-slate-900">{points} Pts</span>
                  {nextBadge ? (
                    <span className="text-slate-400">
                      {language === 'PT-BR' ? 'Próximo' : language === 'EN-US' ? 'Next' : 'Próximo'}: {nextThreshold} Pts
                    </span>
                  ) : (
                    <span className="text-emerald-600 font-medium">
                      {language === 'PT-BR' ? 'Nível máximo' : language === 'EN-US' ? 'Max level' : 'Nivel máximo'}
                    </span>
                  )}
                </div>
                <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-slate-900 transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {[
              { id: 'how-it-works', label: t.howItWorks },
              { id: 'course-simulator', label: t.aiSimulator },
              { id: 'rewards-showcase', label: t.rewards },
              { id: 'security-architecture', label: t.security },
              { id: 'faq', label: t.faq }
            ].map(item => (
              <button
                key={item.id}
                onClick={() => handleScrollTo(item.id)}
                className="block w-full text-left px-3 py-2.5 rounded-lg text-base font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              >
                {item.label}
              </button>
            ))}

            <div className="pt-4 border-t border-slate-100 flex flex-col gap-3 px-1">
              <a
                href={LOGIN_URL}
                className="text-center py-3 text-base font-medium text-slate-700 rounded-xl border border-slate-200 hover:border-slate-300 flex items-center justify-center gap-2"
              >
                <LogIn className="w-5 h-5" />
                <span>{t.login}</span>
              </a>
              <button
                onClick={() => handleScrollTo('lead-form')}
                className="text-center py-3 text-base font-medium text-white rounded-xl bg-slate-900 hover:bg-slate-800 flex items-center justify-center gap-2"
              >
                <span>{t.cta}</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
