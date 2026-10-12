'use client';

import { useState, useEffect } from 'react';
import { Award, Loader2, BookOpen } from 'lucide-react';
import { downloadCertificate } from '@/lib/download-certificate';
import CertificateBadgeMural from '@/components/certificates/CertificateBadgeMural';

interface Certificate {
  id: string;
  courseId: string;
  courseName: string;
  issuedAt: string;
  verificationHash: string;
}

export default function CertificatesPage() {
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
      alert(err instanceof Error ? err.message : 'Erro ao baixar certificado.');
    } finally {
      setDownloading(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[70vh] bg-md-surface-dim">
        <Loader2 className="animate-spin text-md-primary" size={36} />
      </div>
    );
  }

  const userName = typeof window !== 'undefined' ? (document.querySelector('[data-user-name]')?.getAttribute('data-user-name') || '') : '';
  const tenantName = typeof window !== 'undefined' ? (document.querySelector('[data-tenant-name]')?.getAttribute('data-tenant-name') || '') : '';

  return (
    <main className="min-h-screen pb-20 pt-24 bg-md-surface-dim">
      <div className="max-w-5xl mx-auto px-6 md:px-8">
        <header className="mb-8 flex items-center gap-3">
          <Award size={28} className="text-md-primary" />
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight">Meus Certificados</h1>
            <p className="text-gray-500 mt-0.5 text-sm">Certificados emitidos pelos cursos que você concluiu — cada um com raridade única e verificação criptográfica.</p>
          </div>
        </header>

        {certificates.length === 0 ? (
          <div className="text-center py-24 bg-black/20 border border-white/10 rounded-2xl">
            <BookOpen size={40} className="mx-auto text-gray-600 mb-4" />
            <p className="text-white font-semibold mb-1">Nenhum certificado ainda</p>
            <p className="text-gray-500 text-sm mb-6">Conclua um curso para receber seu certificado com badge de raridade.</p>
            <a
              href="/cursos"
              className="inline-block px-5 py-2.5 rounded-full text-sm font-bold text-black bg-md-primary hover:opacity-90 transition"
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