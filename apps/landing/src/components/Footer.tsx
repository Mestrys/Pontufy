import React from 'react';
import { Github, Linkedin, LogIn, ShieldCheck } from 'lucide-react';
import { translations } from '../translations';
import { LOGIN_URL } from '../config';

interface FooterProps {
  language: string;
}

export default function Footer({ language }: FooterProps) {
  const currentYear = new Date().getFullYear();
  const t = translations[language].footer;

  return (
    <footer className="bg-slate-950 text-slate-400 pt-20 pb-12 border-t border-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Brand signature */}
        <div className="flex flex-col items-center text-center pb-12 border-b border-slate-900 mb-12">
          <img
            src="/logo.svg"
            className="w-12 h-12 object-contain select-none mb-4"
            alt="Pontufy Brand Mark"
          />
          <span className="font-display text-2xl font-semibold tracking-tight text-white mb-3">
            Pontu<span className="text-purple-400">fy</span>
          </span>
          <p className="max-w-2xl text-sm text-slate-400 leading-relaxed text-balance">
            {t.desc}
          </p>
          <div className="flex items-center gap-4 pt-5">
            <a href="#" aria-label="LinkedIn" className="text-slate-500 hover:text-white transition-colors">
              <Linkedin className="w-5 h-5" />
            </a>
            <a href="#" aria-label="GitHub" className="text-slate-500 hover:text-white transition-colors">
              <Github className="w-5 h-5" />
            </a>
            <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-3 py-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{t.zeroTrustActive}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-12 text-center md:text-left">
          {/* Column 1: Platform */}
          <div>
            <h3 className="text-white font-medium text-xs tracking-wide uppercase mb-4">{t.colPlatform}</h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <a
                  href={LOGIN_URL}
                  className="inline-flex items-center gap-1.5 font-medium text-purple-300 hover:text-purple-200 transition-colors"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  {translations[language].header.login}
                </a>
              </li>
              <li>
                <a href="#how-it-works" className="hover:text-white transition-colors">
                  {translations[language].header.howItWorks}
                </a>
              </li>
              <li>
                <a href="#course-simulator" className="hover:text-white transition-colors">
                  {translations[language].header.aiSimulator}
                </a>
              </li>
              <li>
                <a href="#rewards-showcase" className="hover:text-white transition-colors">
                  {translations[language].header.rewards}
                </a>
              </li>
              <li>
                <a href="#security-architecture" className="hover:text-white transition-colors">
                  {translations[language].header.security}
                </a>
              </li>
            </ul>
          </div>

          {/* Column 2: Solutions */}
          <div>
            <h3 className="text-white font-medium text-xs tracking-wide uppercase mb-4">
              {language === 'PT-BR' ? 'Soluções' : language === 'EN-US' ? 'Solutions' : 'Soluciones'}
            </h3>
            <ul className="space-y-2.5 text-sm">
              {t.colSolutionsItems.map((item, index) => (
                <li key={index}>
                  <a href="#lead-form" className="hover:text-white transition-colors">
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-slate-900 text-center md:flex md:justify-between md:items-center">
          <p className="text-xs text-slate-500 mb-4 md:mb-0">
            {t.copyright.replace('2026', String(currentYear))}
          </p>
          <p className="text-xs text-slate-600">
            {t.subCopyright}
          </p>
        </div>
      </div>
    </footer>
  );
}
