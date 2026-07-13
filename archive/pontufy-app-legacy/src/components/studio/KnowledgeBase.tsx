'use client';

import { useRef, useState } from 'react';
import {
  UploadCloud,
  FileType2,
  Presentation,
  Globe,
  Youtube,
  AlignLeft,
  Plus,
  AlertTriangle,
} from 'lucide-react';
import type { KnowledgeSource, SourceKind } from '@/lib/types';
import {
  ACCEPTED_FILE_EXTENSIONS,
  classifyUrl,
  createSource,
  isAcceptedFile,
} from '@/lib/studio';
import SourceChip from './SourceChip';

type InputTab = 'files' | 'cloud' | 'web' | 'text';

const TABS: { id: InputTab; label: string }[] = [
  { id: 'files', label: 'Arquivos' },
  { id: 'cloud', label: 'Cloud' },
  { id: 'web', label: 'Web & Mídia' },
  { id: 'text', label: 'Texto direto' },
];

interface KnowledgeBaseProps {
  sources: KnowledgeSource[];
  onAdd: (source: KnowledgeSource, file?: File) => void;
  onRemove: (id: string) => void;
}

export default function KnowledgeBase({ sources, onAdd, onRemove }: KnowledgeBaseProps) {
  const [tab, setTab] = useState<InputTab>('files');
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [gdocUrl, setGdocUrl] = useState('');
  const [gslidesUrl, setGslidesUrl] = useState('');
  const [webUrl, setWebUrl] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [rawText, setRawText] = useState('');

  const addFiles = (files: FileList | File[]) => {
    setError(null);
    for (const file of Array.from(files)) {
      if (!isAcceptedFile(file)) {
        setError(`Formato não suportado: ${file.name}. Use ${ACCEPTED_FILE_EXTENSIONS.join(', ')}.`);
        continue;
      }
      onAdd(createSource({ kind: 'file', label: file.name, sizeBytes: file.size }), file);
    }
  };

  const addUrl = (raw: string, expected: SourceKind, clear: () => void) => {
    setError(null);
    const kind = classifyUrl(raw);
    if (!kind) {
      setError('URL inválida. Cole o endereço completo, incluindo https://');
      return;
    }
    if ((expected === 'gdoc' || expected === 'gslides') && kind !== expected) {
      setError(
        expected === 'gdoc'
          ? 'Este campo espera um link de Google Docs (docs.google.com/document).'
          : 'Este campo espera um link de Google Slides (docs.google.com/presentation).'
      );
      return;
    }
    if (expected === 'youtube' && kind !== 'youtube') {
      setError('Este campo espera um link do YouTube (youtube.com ou youtu.be).');
      return;
    }
    const url = new URL(raw.trim());
    onAdd(createSource({ kind, label: url.hostname + url.pathname, detail: url.href }));
    clear();
  };

  const addText = () => {
    setError(null);
    const text = rawText.trim();
    if (text.length < 20) {
      setError('Escreva pelo menos 20 caracteres para dar contexto suficiente à IA.');
      return;
    }
    const label = text.length > 48 ? `${text.slice(0, 48)}…` : text;
    onAdd(createSource({ kind: 'text', label, detail: text }));
    setRawText('');
  };

  const urlField = (
    icon: React.ReactNode,
    placeholder: string,
    value: string,
    setValue: (v: string) => void,
    expected: SourceKind
  ) => (
    <div className="flex gap-2">
      <div className="relative flex-1">
        <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint">
          {icon}
        </span>
        <input
          type="url"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && value.trim()) addUrl(value, expected, () => setValue(''));
          }}
          placeholder={placeholder}
          className="w-full rounded-xl border border-edge bg-surface-0 py-2.5 pl-10 pr-4 text-sm text-ink placeholder:text-ink-dim focus:border-mint/50 focus:outline-none"
        />
      </div>
      <button
        type="button"
        onClick={() => addUrl(value, expected, () => setValue(''))}
        disabled={!value.trim()}
        aria-label={`Adicionar ${placeholder}`}
        className="flex items-center gap-1.5 rounded-xl border border-edge bg-surface-2 px-4 text-sm font-medium text-ink-soft transition-colors hover:border-ink-dim hover:text-ink disabled:cursor-not-allowed disabled:opacity-40"
      >
        <Plus className="h-4 w-4" />
        Adicionar
      </button>
    </div>
  );

  return (
    <section className="rounded-2xl border border-edge bg-surface-1 p-6">
      <h2 className="text-base font-semibold text-ink">Base de Conhecimento</h2>
      <p className="mt-1 text-sm text-ink-faint">
        Adicione as fontes que a IA usará para gerar o curso: documentos, links, vídeos ou
        instruções diretas.
      </p>

      <div className="mt-5 flex gap-1 rounded-xl border border-edge bg-surface-0 p-1">
        {TABS.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            onClick={() => {
              setTab(id);
              setError(null);
            }}
            className={`flex-1 rounded-lg px-3 py-2 text-xs font-semibold transition-colors sm:text-sm ${
              tab === id ? 'bg-surface-2 text-ink' : 'text-ink-faint hover:text-ink-soft'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="mt-4">
        {tab === 'files' && (
          <div
            data-testid="dropzone"
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              addFiles(e.dataTransfer.files);
            }}
            onClick={() => fileInputRef.current?.click()}
            className={`flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-10 text-center transition-colors ${
              dragging
                ? 'border-mint/60 bg-mint/5'
                : 'border-edge bg-surface-0 hover:border-ink-dim'
            }`}
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-2">
              <UploadCloud className={`h-6 w-6 ${dragging ? 'text-mint' : 'text-ink-muted'}`} />
            </span>
            <div>
              <p className="text-sm font-medium text-ink">
                Arraste arquivos aqui ou clique para selecionar
              </p>
              <p className="mt-1 text-xs text-ink-faint">
                {ACCEPTED_FILE_EXTENSIONS.join(' · ')} — vários arquivos de uma vez
              </p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept={ACCEPTED_FILE_EXTENSIONS.join(',')}
              className="hidden"
              onChange={(e) => {
                if (e.target.files) addFiles(e.target.files);
                e.target.value = '';
              }}
            />
          </div>
        )}

        {tab === 'cloud' && (
          <div className="space-y-3">
            {urlField(
              <FileType2 className="h-4 w-4" />,
              'Link do Google Docs',
              gdocUrl,
              setGdocUrl,
              'gdoc'
            )}
            {urlField(
              <Presentation className="h-4 w-4" />,
              'Link do Google Slides',
              gslidesUrl,
              setGslidesUrl,
              'gslides'
            )}
          </div>
        )}

        {tab === 'web' && (
          <div className="space-y-3">
            {urlField(<Globe className="h-4 w-4" />, 'URL de página web', webUrl, setWebUrl, 'url')}
            {urlField(
              <Youtube className="h-4 w-4" />,
              'URL do YouTube (extração de transcrição)',
              youtubeUrl,
              setYoutubeUrl,
              'youtube'
            )}
          </div>
        )}

        {tab === 'text' && (
          <div className="space-y-3">
            <textarea
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              rows={5}
              placeholder="Cole conteúdo bruto ou escreva instruções específicas para a IA — ex.: 'Foque em exemplos do setor de varejo e inclua um quiz por módulo.'"
              className="w-full resize-y rounded-xl border border-edge bg-surface-0 p-4 text-sm leading-relaxed text-ink placeholder:text-ink-dim focus:border-mint/50 focus:outline-none"
            />
            <button
              type="button"
              onClick={addText}
              disabled={!rawText.trim()}
              className="flex items-center gap-1.5 rounded-xl border border-edge bg-surface-2 px-4 py-2.5 text-sm font-medium text-ink-soft transition-colors hover:border-ink-dim hover:text-ink disabled:cursor-not-allowed disabled:opacity-40"
            >
              <AlignLeft className="h-4 w-4" />
              Adicionar texto como fonte
            </button>
          </div>
        )}
      </div>

      {error && (
        <p className="mt-3 flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-400">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {error}
        </p>
      )}

      {sources.length > 0 && (
        <div className="mt-5 border-t border-edge pt-5">
          <p className="mb-3 text-xs font-medium uppercase tracking-wide text-ink-faint">
            Fontes adicionadas ({sources.length})
          </p>
          <div className="flex flex-wrap gap-3">
            {sources.map((source) => (
              <SourceChip key={source.id} source={source} onRemove={onRemove} />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
