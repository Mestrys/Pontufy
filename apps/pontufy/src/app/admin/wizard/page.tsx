'use client';

import { useEffect, useState } from 'react';
import AIWizard from '@/components/admin/AIWizard';

export default function WizardPage() {
  const [tenantName, setTenantName] = useState('');

  useEffect(() => {
    fetch('/api/admin/tenant/branding')
      .then((r) => r.json())
      .then((data) => setTenantName(data.name || 'Empresa'))
      .catch(() => {});
  }, []);

  return (
    <div className="space-y-8">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3 sm:gap-4">
          <div>
            <h1 className="text-headline-md font-extrabold text-md-on-surface">Gerador de Treinamentos</h1>
            <p className="text-body-md text-md-on-surface-variant">Automatize a criação de conteúdo corporativo com IA.</p>
          </div>
        </div>
      </header>

      <div className="md-card-outlined md-elevation-1 overflow-hidden">
        <AIWizard />
      </div>
    </div>
  );
}