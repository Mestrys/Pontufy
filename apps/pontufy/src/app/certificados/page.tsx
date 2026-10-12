'use client';

import { useState, useEffect } from 'react';
import { Award, BookOpen } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { downloadCertificate } from '@/lib/download-certificate';
import CertificateBadgeMural from '@/components/certificates/CertificateBadgeMural';
import { ListSkeleton, LoadingRegion } from '@/components/ui/Skeleton';

interface Certificate {
  id: string;
  courseId: string;
  courseName: string;
  issuedAt: string;
  verificationHash: string;
}

export default function CertificatesPage() {
  const { toast } = useToast();
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [downloading, setDownloading] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/certificates')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setCertificates(data);
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  const handleDownload = async (cert: Certificate) => {
    setDownloading(cert.id);
    try {
      await downloadCertificate(cert.courseId, cert.courseName);
    } catch (err) {
      console.error(err);
      toast({ tone: 'error', title: 'Não foi possível baixar o certificado.', description: 'Tente de novo em instantes.' });
    } finally {
      setDownloading(null);
    }
  };

  if (isLoading) {
    return (
      <main className="min-h-screen bg-md-surface-dim pt-24 pb-12 px-4 sm:px-8 md:px-16">
        <LoadingRegion label="Carregando seus certificados…" className="max-w-4xl mx-auto">
          <ListSkeleton rows={3} />
        </LoadingRegion>
      </main>
    );
  }

  const userName = typeof window !== 'undefined' ? (document.querySelector('[data-user-name]')?.getAttribute('data-user-name') || '') : '';
  const tenantName = typeof window !== 'undefined' ? (document.querySelector('[data-tenant-name]')?.getAttribute('data-tenant-name') || '') : '';

  return (
    <main className="min-h-screen pb-20 pt-24 bg-md-surface-dim">
      <div className="max-w-5xl mx-auto px-6 md:px-8">
        <header className="mb-8 flex items-center gap-3">
          <Award size={28} className="text-md-primary-text" />
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight">Meus Certificados</h1>
            <p className="text-md-on-surface-muted mt-0.5 text-sm">Certificados emitidos pelos cursos que você concluiu — cada um com raridade única e verificação criptográfica.</p>
          </div>
        </header>

        {certificates.length === 0 ? (
          <div className="text-center py-24 bg-black/20 border border-white/10 rounded-2xl">
            <BookOpen size={40} className="mx-auto text-md-on-surface-muted mb-4" />
            <p className="text-white font-semibold mb-1">Nenhum certificado ainda</p>
            <p className="text-md-on-surface-muted text-sm mb-6">Conclua um curso para receber seu certificado com badge de raridade.</p>
            <a
              href="/cursos"
              className="inline-flex items-center h-11 px-5 rounded-full text-sm font-bold text-md-on-primary bg-md-primary hover:opacity-90 transition"
            >
              Ver cursos disponíveis
            </a>
          </div>
        ) : (
          <CertificateBadgeMural
            certificates={certificates}
          />
        )}
      </div>
    </main>
  );
}