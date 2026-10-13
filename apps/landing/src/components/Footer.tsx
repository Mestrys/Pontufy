import { COPY, type Lang } from '../i18n';
import { LOGIN_URL, CONTACT_EMAIL } from '../config';
import { SOCIAL_LINKS } from '../social';
import { SECTIONS } from './Header';
import Wordmark from './Wordmark';

export default function Footer({ language }: { language: Lang }) {
  const c = COPY[language];
  const f = c.footer;
  const n = c.nav;
  const sections = [n.how, n.ai, n.rewards, n.security, n.faq];
  const link = 'inline-flex min-h-11 min-w-11 items-center text-md-on-surface-variant hover:text-md-on-surface-strong';

  return (
    <footer className="border-t border-md-outline bg-md-surface pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1.5fr_1fr_1fr_1fr]">
        <div>
          <Wordmark className="text-2xl" />
          <p className="mt-3 max-w-xs text-sm text-md-on-surface-muted">{c.hero.eyebrow}</p>
        </div>
        <nav aria-label={f.product}>
          <h2 className="text-sm font-semibold text-md-on-surface-strong">{f.product}</h2>
          <ul className="mt-2 text-sm">
            {sections.map((label, i) => (
              <li key={SECTIONS[i]}><a href={`#${SECTIONS[i]}`} className={link}>{label}</a></li>
            ))}
            <li><a href={LOGIN_URL} className={link}>{n.login}</a></li>
          </ul>
        </nav>
        <nav aria-label={f.legal}>
          <h2 className="text-sm font-semibold text-md-on-surface-strong">{f.legal}</h2>
          <ul className="mt-2 text-sm">
            <li><a href="/privacy/" className={link}>{f.privacy}</a></li>
            <li><a href="/terms/" className={link}>{f.terms}</a></li>
          </ul>
        </nav>
        <div>
          <h2 className="text-sm font-semibold text-md-on-surface-strong">{f.contact}</h2>
          <a href={`mailto:${CONTACT_EMAIL}`} className={`${link} text-sm`}>{CONTACT_EMAIL}</a>
          <h2 className="mt-4 text-sm font-semibold text-md-on-surface-strong">{f.follow}</h2>
          <ul className="mt-1 flex flex-wrap -ml-2.5">
            {SOCIAL_LINKS.map(({ name, href, viewBox, path }) => (
              <li key={name}>
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`${name} (abre em nova aba)`}
                  className="flex size-11 items-center justify-center rounded-full text-md-on-surface-variant hover:bg-md-on-surface-strong/5 hover:text-md-on-surface-strong"
                >
                  <svg viewBox={viewBox} className="h-4 w-4 fill-current" aria-hidden="true"><path d={path} /></svg>
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="border-t border-md-outline">
        <p className="mx-auto max-w-6xl px-4 py-6 text-xs leading-relaxed text-md-on-surface-muted sm:px-6">
          {f.copyright} {f.company}
        </p>
      </div>
    </footer>
  );
}
