import React from 'react';
import { Github, Linkedin, LogIn, ShieldCheck } from 'lucide-react';
import { translations } from '../translations';
import { LOGIN_URL } from '../config';

interface FooterProps {
  language: string;
}

const SOCIAL_LINKS = [
  { name: 'LinkedIn', href: '#', Icon: Linkedin },
  { name: 'GitHub', href: '#', Icon: Github },
] as const;

export default function Footer({ language }: FooterProps) {
  const currentYear = new Date().getFullYear();
  const t = translations[language].footer;
  const h = translations[language].header;

  const navLinks = [
    { href: '#how-it-works', label: h.howItWorks },
    { href: '#course-simulator', label: h.aiSimulator },
    { href: '#rewards-showcase', label: h.rewards },
    { href: '#security-architecture', label: h.security },
  ];

  const legalLabels =
    language === 'PT-BR'
      ? { privacy: 'Política de Privacidade', terms: 'Termos de Uso' }
      : language === 'EN-US'
        ? { privacy: 'Privacy Policy', terms: 'Terms of Service' }
        : { privacy: 'Política de Privacidad', terms: 'Términos de Uso' };

  return (
    <footer className="bg-slate-950 text-slate-400 border-t border-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-14">
        {/* Linha superior: marca + navegação principal */}
        <div className="flex flex-col items-center gap-6 text-center sm:flex-row sm:items-center sm:justify-between sm:text-left">
          <div className="flex items-center gap-2.5">
            <img src="/logo.svg" className="w-7 h-7 object-contain select-none" alt="Pontufy" />
            <span className="font-display text-base font-semibold tracking-tight text-white">
              Pontu<span className="text-purple-400">fy</span>
            </span>
          </div>
          <nav className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm">
            {navLinks.map((l) => (
              <a key={l.href} href={l.href} className="hover:text-white transition-colors">
                {l.label}
              </a>
            ))}
            <a
              href={LOGIN_URL}
              className="inline-flex items-center gap-1.5 font-medium text-purple-300 hover:text-purple-200 transition-colors"
            >
              <LogIn className="w-3.5 h-3.5" />
              {h.login}
            </a>
          </nav>
        </div>

        {/* Linha intermediária: selo de segurança + redes sociais */}
        <div className="mt-10 flex flex-col items-center gap-6 border-t border-slate-900 pt-8 sm:flex-row sm:justify-between">
          <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-3 py-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>{t.zeroTrustActive}</span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3">
            {SOCIAL_LINKS.map(({ name, href, Icon }) => (
              <a
                key={name}
                href={href}
                aria-label={name}
                className="flex size-9 items-center justify-center rounded-full border border-slate-800 text-slate-500 transition-colors hover:border-purple-500/50 hover:text-white"
              >
                <Icon className="w-4 h-4" />
              </a>
            ))}
          </div>
        </div>

        {/* Linha inferior: dados legais e endereço */}
        <div className="mt-8 flex flex-col items-center gap-4 border-t border-slate-900 pt-8 text-center sm:flex-row sm:items-center sm:justify-between sm:text-left">
          <div className="flex flex-col items-center gap-2 sm:items-start">
            <p className="text-xs text-slate-500">
              {t.copyright.replace('2026', String(currentYear))}
            </p>
            <div className="flex items-center gap-4 text-xs">
              <a href="/privacy/" className="hover:text-white transition-colors">
                {legalLabels.privacy}
              </a>
              <a href="/terms/" className="hover:text-white transition-colors">
                {legalLabels.terms}
              </a>
            </div>
          </div>
          <p className="text-xs text-slate-600 sm:text-right">{t.subCopyright}</p>
        </div>
      </div>
    </footer>
  );
}
