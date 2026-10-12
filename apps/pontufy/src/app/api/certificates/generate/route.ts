import { NextResponse } from 'next/server';
import { getSessionContext } from '@/backend/session';
import { issueCertificate, CertificateError } from '@/lib/certificate-service';

// Compatibilidade: antigo endpoint de download do certificado. Delega toda a
// lógica (validação de conclusão + quiz, deduplicação, geração do PDF) ao
// serviço compartilhado usado por POST /api/certificates.

export async function POST(request: Request) {
  try {
    const { tenantId, userId } = await getSessionContext();
    const { courseId } = await request.json();

    if (!courseId || typeof courseId !== 'string') {
      return NextResponse.json({ error: 'courseId é obrigatório.' }, { status: 400 });
    }

    const { buffer, filename } = await issueCertificate(tenantId, userId, courseId);

    return new Response(buffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === 'Não autenticado.') {
      return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
    }
    if (error instanceof CertificateError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('POST /api/certificates/generate:', error);
    return NextResponse.json({ error: 'Erro interno ao gerar certificado.' }, { status: 500 });
  }
}