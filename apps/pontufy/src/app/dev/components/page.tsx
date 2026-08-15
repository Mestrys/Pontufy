'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/TextField';
import { Card } from '@/components/ui/Card';
import { Chip, PointsChip } from '@/components/ui/Chip';

export default function DevComponentsCatalog() {
  const [value, setValue] = useState('');

  return (
    <main className="min-h-screen bg-md-surface-dim pt-24 pb-16 px-4 sm:px-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-black text-white tracking-tight mb-2">
          Catálogo de Componentes <span className="text-md-primary-container">MD3</span>
        </h1>
        <p className="text-gray-500 text-sm mb-10">
          Validação visual dos primitivos atômicos — Material Design 3 · Google Sans Flex.
        </p>

        {/* Buttons */}
        <section className="mb-10">
          <h2 className="text-title-md text-white mb-4">Button (4 variantes, pill 40dp)</h2>
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="filled">Filled</Button>
            <Button variant="tonal">Tonal</Button>
            <Button variant="outlined">Outlined</Button>
            <Button variant="text">Text</Button>
            <Button variant="filled" disabled>
              Disabled
            </Button>
            <Button variant="filled" className="pointer-events-none opacity-60">
              Focus (estado da borda via :focus-visible)
            </Button>
          </div>
        </section>

        {/* TextField */}
        <section className="mb-10">
          <h2 className="text-title-md text-white mb-4">TextField (floating label + erro inline)</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <TextField id="cat-nome" label="Nome completo" value={value} onChange={(e) => setValue(e.target.value)} />
            <TextField id="cat-email" label="E-mail corporativo" type="email" aria-invalid={!!value && !value.includes('@')} />
          </div>
          {value && !value.includes('@') && (
            <p className="mt-2 text-sm text-md-error" role="alert">
              Informe um e-mail válido (estado de erro inline).
            </p>
          )}
          <div className="mt-4">
            <TextField id="cat-pts" label="Pontos (núcleo terciário no card abaixo)" value="1.250" readOnly />
          </div>
        </section>

        {/* Cards */}
        <section className="mb-10">
          <h2 className="text-title-md text-white mb-4">Card (elevated · outlined · filled)</h2>
          <div className="grid sm:grid-cols-3 gap-4">
            <Card variant="elevated" className="p-5">
              <p className="font-semibold text-white">Elevated</p>
              <p className="text-sm text-gray-500 mt-1">shadow-md (M3 2dp)</p>
            </Card>
            <Card variant="outlined" className="p-5">
              <p className="font-semibold text-white">Outlined</p>
              <p className="text-sm text-gray-500 mt-1">border-md-outline</p>
            </Card>
            <Card variant="filled" className="p-5">
              <p className="font-semibold text-white">Filled</p>
              <p className="text-sm text-gray-500 mt-1">surface-container</p>
            </Card>
          </div>
        </section>

        {/* Chips & Badges */}
        <section className="mb-10">
          <h2 className="text-title-md text-white mb-4">Chip / Badge (pontos SEMPRE terciário)</h2>
          <div className="flex flex-wrap items-center gap-3">
            <Chip>Padrão</Chip>
            <Chip tone="primary">Primary</Chip>
            <Chip tone="secondary">Secondary</Chip>
            <Chip tone="tertiary">Tertiary</Chip>
            <Chip tone="highlight">Highlight</Chip>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <PointsChip value={1250} />
            <PointsChip value={0} />
            <PointsChip value={99999} />
          </div>
        </section>

        {/* Elevações e superfícies */}
        <section className="mb-10">
          <h2 className="text-title-md text-white mb-4">Elevações M3 (0–5) e containers tonais</h2>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
            {(['md-elevation-1', 'md-elevation-2', 'md-elevation-3', 'md-elevation-4', 'md-elevation-5'] as const).map(
              (el) => (
                <div key={el} className={`${el} bg-md-surface rounded-xl p-4 text-center`}>
                  <p className="text-xs text-gray-400 font-mono">{el}</p>
                </div>
              )
            )}
          </div>
          <div className="mt-3 flex flex-wrap gap-3">
            <div className="surface-container rounded-xl px-4 py-3 text-sm text-gray-300">surface-container</div>
            <div className="surface-container-high rounded-xl px-4 py-3 text-sm text-gray-300">surface-container-high</div>
            <div className="surface-variant rounded-xl px-4 py-3 text-sm text-gray-300">surface-variant</div>
          </div>
        </section>
      </div>
    </main>
  );
}
