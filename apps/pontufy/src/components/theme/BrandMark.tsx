'use client';

import { useState } from 'react';
import { useBrand } from './DynamicThemeProvider';

/**
 * Logo do cliente (white-label) com o nome da empresa como texto alternativo.
 * Sem logo, ou se a imagem falhar, mostra a marca Pontufy.
 */
export default function BrandMark({ className = 'h-8 max-w-[140px]' }: { className?: string }) {
  const { name, logoUrl } = useBrand();
  const [failed, setFailed] = useState<string | null>(null);

  if (logoUrl && failed !== logoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- URL externa do cliente, sem domínio fixo para next/image
      <img
        src={logoUrl}
        alt={name ?? 'Logo da empresa'}
        className={`${className} w-auto object-contain`}
        onError={() => setFailed(logoUrl)}
      />
    );
  }

  return (
    <span className="text-xl font-black tracking-tight text-white">
      <span className="text-md-primary-text">Pontu</span>fy
    </span>
  );
}
