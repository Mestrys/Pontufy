import { type ReactNode } from 'react';

// Renderer de Markdown das aulas. Não usa dangerouslySetInnerHTML: todo texto
// vira nó de texto do React, então HTML embutido aparece literal e nunca executa.
// Cobre o que o gerador de IA produz: títulos, listas, citação, código,
// tabelas, separador, links, negrito, itálico e código inline.

/** Só aceita link http(s) e mailto; o resto (javascript:, data:…) vira texto. */
function safeHref(raw: string): string | null {
  const href = raw.trim();
  if (/^mailto:/i.test(href)) return href;
  try {
    const url = new URL(href);
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.toString() : null;
  } catch {
    return null;
  }
}

const INLINE_RE = /(`[^`]+`|\*\*[^*]+\*\*|(?<!\w)__[^_]+__(?!\w)|\[[^\]]+\]\([^)\s]+\)|\*[^*\s][^*]*\*|(?<!\w)_[^_\s][^_]*_(?!\w))/g;

function formatInline(text: string): ReactNode[] {
  return text.split(INLINE_RE).map((part, i) => {
    if (!part) return null;
    if (part.startsWith('`') && part.endsWith('`') && part.length > 2) {
      return (
        <code key={i} className="rounded bg-md-surface-container px-1.5 py-0.5 font-mono text-[0.9em] text-md-on-surface">
          {part.slice(1, -1)}
        </code>
      );
    }
    if ((part.startsWith('**') && part.endsWith('**')) || (part.startsWith('__') && part.endsWith('__'))) {
      return <strong key={i} className="font-semibold text-white">{formatInline(part.slice(2, -2))}</strong>;
    }
    const link = /^\[([^\]]+)\]\(([^)\s]+)\)$/.exec(part);
    if (link) {
      const href = safeHref(link[2]);
      if (!href) return <span key={i}>{link[1]}</span>;
      const external = !href.startsWith('mailto:');
      return (
        <a
          key={i}
          href={href}
          className="text-md-primary-text underline underline-offset-2 hover:text-white"
          {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
        >
          {link[1]}
          {external && <span className="sr-only"> (abre em nova aba)</span>}
        </a>
      );
    }
    if ((part.startsWith('*') && part.endsWith('*')) || (part.startsWith('_') && part.endsWith('_'))) {
      return <em key={i} className="italic">{part.slice(1, -1)}</em>;
    }
    return <span key={i}>{part}</span>;
  });
}

function splitRow(line: string): string[] {
  return line.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map((c) => c.trim());
}

const TABLE_SEPARATOR = /^\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?$/;

export default function LessonMarkdown({ content }: { content: string }) {
  const lines = content.replace(/\r\n?/g, '\n').split('\n');
  const elements: ReactNode[] = [];
  let paragraph: string[] = [];
  let list: { type: 'ul' | 'ol'; items: string[] } | null = null;
  let quote: string[] = [];
  let key = 0;

  const flushParagraph = () => {
    const text = paragraph.join(' ').trim();
    if (text) elements.push(<p key={key++}>{formatInline(text)}</p>);
    paragraph = [];
  };
  const flushList = () => {
    if (!list) return;
    const items = list.items.map((item, i) => <li key={i}>{formatInline(item)}</li>);
    elements.push(
      list.type === 'ul'
        ? <ul key={key++} className="list-disc pl-6 space-y-2 marker:text-md-on-surface-muted">{items}</ul>
        : <ol key={key++} className="list-decimal pl-6 space-y-2 marker:text-md-on-surface-muted">{items}</ol>,
    );
    list = null;
  };
  const flushQuote = () => {
    if (quote.length === 0) return;
    elements.push(
      <blockquote key={key++} className="border-l-4 border-md-primary-text/60 bg-md-surface-container/60 rounded-r-lg py-3 pl-4 pr-3 text-md-on-surface">
        {quote.join('\n').split(/\n{2,}/).map((p, i) => (
          <p key={i} className={i > 0 ? 'mt-3' : ''}>{formatInline(p.replace(/\n/g, ' '))}</p>
        ))}
      </blockquote>,
    );
    quote = [];
  };
  const flushAll = () => {
    flushParagraph();
    flushList();
    flushQuote();
  };

  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();

    // Bloco de código cercado (``` ou ~~~)
    const fence = /^(```|~~~)\s*([\w-]*)/.exec(trimmed);
    if (fence) {
      flushAll();
      const body: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith(fence[1])) {
        body.push(lines[i]);
        i++;
      }
      elements.push(
        <pre key={key++} className="overflow-x-auto rounded-lg border border-md-outline bg-md-surface-container p-4 text-[0.875em] leading-relaxed">
          <code className="font-mono text-md-on-surface">{body.join('\n')}</code>
        </pre>,
      );
      continue;
    }

    // Tabela: linha com | seguida de separador ---|---
    if (trimmed.includes('|') && i + 1 < lines.length && TABLE_SEPARATOR.test(lines[i + 1].trim())) {
      flushAll();
      const header = splitRow(trimmed);
      const rows: string[][] = [];
      i += 2;
      while (i < lines.length && lines[i].trim().includes('|')) {
        rows.push(splitRow(lines[i]));
        i++;
      }
      i--;
      elements.push(
        <div key={key++} className="overflow-x-auto rounded-lg border border-md-outline" role="region" aria-label="Tabela" tabIndex={0}>
          <table className="w-full border-collapse text-left text-[0.9em]">
            <thead className="bg-md-surface-container">
              <tr>
                {header.map((h, c) => (
                  <th key={c} scope="col" className="px-3 py-2 font-semibold text-white border-b border-md-outline">{formatInline(h)}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, r) => (
                <tr key={r} className="border-b border-md-outline last:border-0">
                  {header.map((_, c) => (
                    <td key={c} className="px-3 py-2 align-top">{formatInline(row[c] ?? '')}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>,
      );
      continue;
    }

    const heading = /^(#{1,4})\s+(.*)$/.exec(trimmed);
    if (heading) {
      flushAll();
      // A aula já tem h2 com o título: # e ## do conteúdo viram h3, ### e #### viram h4.
      const level = heading[1].length;
      elements.push(
        level <= 2 ? (
          <h3 key={key++} className="text-[1.25em] font-bold text-white pt-4 first:pt-0 border-b border-md-outline pb-2">
            {formatInline(heading[2])}
          </h3>
        ) : (
          <h4 key={key++} className="text-[1.05em] font-bold text-white pt-2">
            {formatInline(heading[2])}
          </h4>
        ),
      );
      continue;
    }

    if (/^(-{3,}|\*{3,}|_{3,})$/.test(trimmed)) {
      flushAll();
      elements.push(<hr key={key++} className="border-md-outline" />);
      continue;
    }

    if (trimmed.startsWith('>')) {
      flushParagraph();
      flushList();
      quote.push(trimmed.replace(/^>\s?/, ''));
      continue;
    }
    if (quote.length > 0) flushQuote();

    const ul = /^[-*+]\s+(.*)$/.exec(trimmed);
    const ol = /^\d+[.)]\s+(.*)$/.exec(trimmed);
    if (ul || ol) {
      flushParagraph();
      const type = ul ? 'ul' : 'ol';
      if (!list || list.type !== type) {
        flushList();
        list = { type, items: [] };
      }
      list.items.push((ul ?? ol)![1]);
      continue;
    }

    if (trimmed === '') {
      flushParagraph();
      flushList();
      continue;
    }

    // Linha de continuação de item de lista recuado
    if (list && /^\s{2,}/.test(lines[i]) && paragraph.length === 0) {
      const items: string[] = (list as { items: string[] }).items;
      items[items.length - 1] += ` ${trimmed}`;
      continue;
    }

    flushList();
    paragraph.push(trimmed);
  }
  flushAll();

  // 17px no celular e 18px no desktop, entrelinha 1,6 e linha de até 68 caracteres.
  return (
    <div className="lesson-content max-w-[68ch] space-y-5 text-[17px] sm:text-[18px] leading-[1.6] text-md-on-surface">
      {elements}
    </div>
  );
}
