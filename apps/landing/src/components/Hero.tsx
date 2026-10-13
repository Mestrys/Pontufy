import { ArrowRight, BookOpen, Coins, LogIn, Sparkles } from 'lucide-react';
import { COPY, type Lang } from '../i18n';
import { LOGIN_URL, CONTACT_EMAIL } from '../config';

// Ilustração feita com os mesmos componentes do app (aula + carteira), não
// uma captura: mostra o ciclo aula → pontos sem prometer números.
function ProductSketch({ language }: { language: Lang }) {
  const pt = language === 'PT-BR';
  const es = language === 'ES-LA';
  return (
    <div aria-hidden="true" className="relative mx-auto w-full max-w-sm select-none">
      <div className="rounded-3xl border border-md-outline bg-md-surface p-5 pb-16 shadow-2xl shadow-black/20">
        <p className="flex items-center gap-2 text-xs text-md-on-surface-muted">
          <BookOpen className="h-3.5 w-3.5" />
          {pt ? 'Aula 2 de 4' : es ? 'Lección 2 de 4' : 'Lesson 2 of 4'}
        </p>
        <p className="mt-1 text-lg font-bold text-md-on-surface-strong">
          {pt ? 'Atendimento por telefone' : es ? 'Atención telefónica' : 'Phone support basics'}
        </p>
        <div className="mt-4 space-y-2">
          <div className="h-2.5 w-full rounded-full bg-md-surface-container-high" />
          <div className="h-2.5 w-11/12 rounded-full bg-md-surface-container-high" />
          <div className="h-2.5 w-4/5 rounded-full bg-md-surface-container-high" />
        </div>
        <div className="mt-5 flex h-11 items-center justify-center gap-2 rounded-full bg-md-primary text-sm font-bold text-md-on-primary">
          {pt ? 'Concluir e avançar' : es ? 'Completar y avanzar' : 'Complete and continue'}
          <span className="font-semibold">(+40 pts)</span>
          <ArrowRight className="h-4 w-4" />
        </div>
        <p className="mt-4 flex w-fit max-w-full items-center gap-1 rounded-full bg-md-secondary/15 px-3 py-1 text-xs font-medium text-md-secondary">
          <Sparkles className="h-3.5 w-3.5" />
          {COPY[language].ai.badgeExample}
        </p>
      </div>
      <div className="absolute -bottom-5 -right-2 rounded-2xl border border-md-outline bg-md-surface-container px-4 py-3 shadow-xl shadow-black/20 sm:-right-6">
        <p className="text-xs text-md-on-surface-muted">{pt ? 'Seu saldo' : es ? 'Tu saldo' : 'Your balance'}</p>
        <p className="flex items-center gap-1.5 text-xl font-black text-md-tertiary tabular-nums">
          <Coins className="h-5 w-5" /> 490 pts
        </p>
      </div>
    </div>
  );
}

export default function Hero({ language }: { language: Lang }) {
  const t = COPY[language].hero;
  const mailto = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(t.contactSubject)}`;

  return (
    <section id="topo" className="scroll-mt-24 pt-[calc(7rem+env(safe-area-inset-top))] pb-20 sm:pb-28">
      <div className="mx-auto grid max-w-6xl items-center gap-14 px-4 sm:px-6 lg:grid-cols-[1.15fr_1fr]">
        <div>
          <p className="text-sm font-semibold text-md-primary-text">{t.eyebrow}</p>
          <h1 className="mt-4 text-4xl font-black leading-[1.1] tracking-tight text-md-on-surface-strong text-balance sm:text-5xl">
            {t.title}
          </h1>
          <p className="mt-6 max-w-[60ch] text-lg leading-relaxed text-md-on-surface-variant">{t.desc}</p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <a
              href={mailto}
              aria-describedby="contato-dica"
              className="inline-flex h-12 items-center gap-2 rounded-full bg-md-primary px-6 text-base font-bold text-md-on-primary transition-colors hover:bg-md-primary-container"
            >
              {t.ctaContact}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </a>
            <a
              href={LOGIN_URL}
              className="inline-flex h-12 items-center gap-2 rounded-full border border-md-outline-variant px-6 text-base font-semibold text-md-on-surface-strong transition-colors hover:bg-md-on-surface-strong/5"
            >
              <LogIn className="h-4 w-4" aria-hidden="true" />
              {t.ctaLogin}
            </a>
          </div>
          <p id="contato-dica" className="mt-3 text-sm text-md-on-surface-muted">
            {t.contactHint}
          </p>
        </div>
        <ProductSketch language={language} />
      </div>
    </section>
  );
}
