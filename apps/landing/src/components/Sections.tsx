import { BookOpen, Check, ChevronDown, Coins, FileText, Gift, KeyRound, Lock, LogOut, PenLine, ScrollText, Send, Sparkles } from 'lucide-react';
import { COPY, type Lang } from '../i18n';

function SectionHeader({ id, title, desc }: { id: string; title: string; desc: string }) {
  return (
    <div className="max-w-2xl">
      <h2 id={`${id}-titulo`} className="text-3xl font-black tracking-tight text-md-on-surface-strong text-balance sm:text-4xl">
        {title}
      </h2>
      <p className="mt-4 text-lg leading-relaxed text-md-on-surface-variant">{desc}</p>
    </div>
  );
}

const shell = 'scroll-mt-24 border-t border-md-outline py-20 sm:py-24';
const inner = 'mx-auto max-w-6xl px-4 sm:px-6';

export function HowItWorks({ language }: { language: Lang }) {
  const t = COPY[language].how;
  const icons = [BookOpen, Coins, Gift];
  return (
    <section id="como-funciona" aria-labelledby="como-funciona-titulo" className={shell}>
      <div className={inner}>
        <SectionHeader id="como-funciona" title={t.title} desc={t.desc} />
        <ol className="mt-12 grid gap-4 md:grid-cols-3">
          {t.steps.map((step, i) => {
            const Icon = icons[i];
            return (
              <li key={step.title} className="rounded-2xl border border-md-outline bg-md-surface p-6">
                <span className="flex size-11 items-center justify-center rounded-full bg-md-tertiary/10 text-md-tertiary">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <h3 className="mt-5 text-lg font-bold text-md-on-surface-strong">
                  <span className="text-md-on-surface-muted tabular-nums">{i + 1}. </span>
                  {step.title}
                </h3>
                <p className="mt-2 leading-relaxed text-md-on-surface-variant">{step.text}</p>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}

export function AiCourses({ language }: { language: Lang }) {
  const t = COPY[language].ai;
  const icons = [PenLine, FileText, Check, Send];
  return (
    <section id="cursos-com-ia" aria-labelledby="cursos-com-ia-titulo" className={shell}>
      <div className={inner}>
        <SectionHeader id="cursos-com-ia" title={t.title} desc={t.desc} />
        <ol className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {t.steps.map((step, i) => {
            const Icon = icons[i];
            return (
              <li key={step.title} className="rounded-2xl border border-md-outline bg-md-surface p-6">
                <span className="flex size-11 items-center justify-center rounded-full bg-md-primary/15 text-md-primary-text">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <h3 className="mt-5 font-bold text-md-on-surface-strong">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-md-on-surface-variant">{step.text}</p>
              </li>
            );
          })}
        </ol>
        <p className="mt-6 inline-flex items-center gap-2 rounded-full bg-md-secondary/15 px-4 py-2 text-sm font-medium text-md-secondary">
          <Sparkles className="h-4 w-4" aria-hidden="true" />
          {t.badgeExample}
        </p>
      </div>
    </section>
  );
}

export function Rewards({ language }: { language: Lang }) {
  const t = COPY[language].rewards;
  return (
    <section id="recompensas" aria-labelledby="recompensas-titulo" className={shell}>
      <div className={`${inner} grid gap-10 lg:grid-cols-2 lg:items-center`}>
        <SectionHeader id="recompensas" title={t.title} desc={t.desc} />
        <ul className="space-y-3">
          {t.items.map((item) => (
            <li key={item} className="flex items-start gap-3 rounded-2xl border border-md-outline bg-md-surface p-5">
              <Check className="mt-0.5 h-5 w-5 flex-none text-md-tertiary" aria-hidden="true" />
              <span className="leading-relaxed text-md-on-surface">{item}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export function Security({ language }: { language: Lang }) {
  const t = COPY[language].security;
  const f = COPY[language].footer;
  const icons = [Lock, ScrollText, KeyRound, LogOut];
  return (
    <section id="seguranca" aria-labelledby="seguranca-titulo" className={shell}>
      <div className={inner}>
        <SectionHeader id="seguranca" title={t.title} desc={t.desc} />
        <ul className="mt-12 grid gap-4 sm:grid-cols-2">
          {t.items.map((item, i) => {
            const Icon = icons[i];
            return (
              <li key={item.title} className="flex gap-4 rounded-2xl border border-md-outline bg-md-surface p-6">
                <Icon className="mt-0.5 h-5 w-5 flex-none text-md-primary-text" aria-hidden="true" />
                <div>
                  <h3 className="font-bold text-md-on-surface-strong">{item.title}</h3>
                  <p className="mt-1 leading-relaxed text-md-on-surface-variant">{item.text}</p>
                </div>
              </li>
            );
          })}
        </ul>
        <p className="mt-6 text-md-on-surface-variant">
          {t.legalPrefix}{' '}
          <a href="/privacy/" className="inline-flex min-h-11 items-center font-semibold text-md-primary-text underline underline-offset-2">{f.privacy}</a>
          {' · '}
          <a href="/terms/" className="inline-flex min-h-11 items-center font-semibold text-md-primary-text underline underline-offset-2">{f.terms}</a>
        </p>
      </div>
    </section>
  );
}

export function Faq({ language }: { language: Lang }) {
  const t = COPY[language].faq;
  return (
    <section id="perguntas" aria-labelledby="perguntas-titulo" className={shell}>
      <div className={`${inner} max-w-3xl`}>
        <h2 id="perguntas-titulo" className="text-3xl font-black tracking-tight text-md-on-surface-strong sm:text-4xl">
          {t.title}
        </h2>
        <div className="mt-10 divide-y divide-md-outline rounded-2xl border border-md-outline bg-md-surface">
          {t.items.map((item) => (
            <details key={item.q} className="group">
              <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 font-semibold text-md-on-surface-strong [&::-webkit-details-marker]:hidden">
                {item.q}
                <ChevronDown className="h-5 w-5 flex-none text-md-on-surface-muted transition-transform group-open:rotate-180" aria-hidden="true" />
              </summary>
              <p className="px-5 pb-5 leading-relaxed text-md-on-surface-variant">{item.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
