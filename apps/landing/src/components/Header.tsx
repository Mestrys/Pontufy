import { useEffect, useRef, useState } from 'react';
import { Menu, X, LogIn, Globe } from 'lucide-react';
import { COPY, LANGS, type Lang } from '../i18n';
import { LOGIN_URL } from '../config';
import Wordmark from './Wordmark';

interface HeaderProps {
  language: Lang;
  setLanguage: (lang: Lang) => void;
}

export const SECTIONS = ['como-funciona', 'cursos-com-ia', 'recompensas', 'seguranca', 'perguntas'] as const;

export default function Header({ language, setLanguage }: HeaderProps) {
  const [open, setOpen] = useState(false);
  const menuButton = useRef<HTMLButtonElement>(null);
  const t = COPY[language].nav;
  const items = [t.how, t.ai, t.rewards, t.security, t.faq].map((label, i) => ({ id: SECTIONS[i], label }));

  // Escape fecha o menu do celular e devolve o foco ao botão.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        menuButton.current?.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  const languageSelect = (id: string) => (
    <label className="relative inline-flex min-h-11 items-center gap-1.5 rounded-full px-2 text-sm text-md-on-surface-variant hover:text-md-on-surface-strong">
      <Globe className="h-4 w-4" aria-hidden="true" />
      <span className="sr-only">{t.language}</span>
      <select
        id={id}
        value={language}
        onChange={(e) => setLanguage(e.target.value as Lang)}
        className="cursor-pointer appearance-none bg-transparent py-2 pr-1 font-medium focus:outline-none"
      >
        {LANGS.map((l) => (
          <option key={l.code} value={l.code} className="bg-md-surface text-md-on-surface">
            {l.label}
          </option>
        ))}
      </select>
    </label>
  );

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-md-outline bg-md-surface-dim/90 backdrop-blur-md pt-[env(safe-area-inset-top)]">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <a href="#topo" className="inline-flex min-h-11 items-center" aria-label="Pontufy, início da página">
          <Wordmark />
        </a>

        <nav aria-label={t.main} className="hidden items-center gap-1 lg:flex">
          {items.map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              className="inline-flex min-h-11 items-center rounded-full px-3 text-sm font-medium text-md-on-surface-variant transition-colors hover:bg-md-on-surface-strong/5 hover:text-md-on-surface-strong"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          {languageSelect('lang-desktop')}
          <a
            href={LOGIN_URL}
            className="inline-flex h-11 items-center gap-2 rounded-full border border-md-outline-variant px-5 text-sm font-semibold text-md-on-surface-strong transition-colors hover:bg-md-on-surface-strong/5"
          >
            <LogIn className="h-4 w-4" aria-hidden="true" />
            {t.login}
          </a>
        </div>

        <button
          ref={menuButton}
          type="button"
          onClick={() => setOpen(!open)}
          aria-expanded={open}
          aria-controls="menu-celular"
          aria-label={open ? t.closeMenu : t.openMenu}
          className="-mr-2 flex size-11 items-center justify-center rounded-full text-md-on-surface-variant hover:text-md-on-surface-strong lg:hidden"
        >
          {open ? <X className="h-6 w-6" aria-hidden="true" /> : <Menu className="h-6 w-6" aria-hidden="true" />}
        </button>
      </div>

      {open && (
        <div id="menu-celular" className="border-t border-md-outline bg-md-surface px-4 pb-6 pt-2 lg:hidden">
          <nav aria-label={t.main}>
            <ul>
              {items.map((item) => (
                <li key={item.id}>
                  <a
                    href={`#${item.id}`}
                    onClick={() => setOpen(false)}
                    className="flex min-h-12 items-center rounded-xl px-3 text-base font-medium text-md-on-surface hover:bg-md-on-surface-strong/5"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
          <div className="mt-4 flex items-center justify-between gap-3 border-t border-md-outline pt-4">
            {languageSelect('lang-mobile')}
            <a
              href={LOGIN_URL}
              className="inline-flex h-11 items-center gap-2 rounded-full bg-md-primary px-5 text-sm font-semibold text-md-on-primary hover:bg-md-primary-container"
            >
              <LogIn className="h-4 w-4" aria-hidden="true" />
              {t.login}
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
