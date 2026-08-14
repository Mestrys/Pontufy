// Client-only: baixa o PDF do certificado emitido por POST /api/certificates.

export async function downloadCertificate(courseId: string, courseTitle: string): Promise<void> {
  const res = await fetch('/api/certificates', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ courseId }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Erro ao gerar certificado.');
  }

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `certificado-${courseTitle}.pdf`;
  a.click();
  URL.revokeObjectURL(url);
}