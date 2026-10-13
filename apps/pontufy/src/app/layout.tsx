import type { Metadata, Viewport } from "next";
import { Roboto, Geist_Mono } from "next/font/google";
import AuthProvider from "@/components/providers/AuthProvider";
import AppShell from "@/components/layout/AppShell";
import PwaRegister from "@/components/pwa/PwaRegister";
import OfflineBanner from "@/components/pwa/OfflineBanner";
import DynamicThemeProvider from "@/components/theme/DynamicThemeProvider";
import { ToastProvider } from "@/components/ui/Toast";
import "./globals.css";

// Tipografia Pontufy (MD3): Google Sans Flex é a família corporativa, mas NÃO
// está publicada no Google Fonts nem licenciada para redistribuição local — o
// carregamento seguro via `next/font/google` é impossível. Estratégia: Roboto
// (webfont real, --font-roboto) entra no stack `--font-sans` do globals.css:
//   "Google Sans Flex", "Google Sans", var(--font-roboto), "Roboto", sans-serif
// Navegadores com Google Sans instalada localmente a usam; os demais caem em
// Roboto com métricas visuais equivalentes (mesmo DNA tipográfico).
const roboto = Roboto({
  variable: "--font-roboto",
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Pontufy — Plataforma de Gamificação Corporativa",
  description: "Transforme treinamentos corporativos em experiências engajadoras com gamificação, IA e recompensas reais.",
  manifest: "/manifest.json",
  applicationName: "Pontufy",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Pontufy",
  },
  icons: {
    icon: "/icons/icon-192x192.png",
    apple: "/icons/icon-192x192.png",
  },
  metadataBase: new URL("https://pontufy.com"),
  other: {
    lomadee: "2324685",
  },
  // Explicit meta tags for lomadee verification
  verification: {
    other: {
      lomadee: "2324685",
    },
  },
};

// viewport-fit=cover: com a barra de status translúcida (appleWebApp) o app
// desenha até as bordas do iPhone, e os elementos fixos usam
// env(safe-area-inset-*) para não ficar sob o entalhe ou a barra de início.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0a0a0a",
};

// Aplica a marca do tenant guardada na última visita antes da primeira pintura,
// sem esperar o fetch do DynamicThemeProvider (evita o "flash" da cor Pontufy).
// Só aceita nomes de token conhecidos e valores #RRGGBB.
const BRAND_BOOTSTRAP = `try{var v=JSON.parse(localStorage.getItem('pontufy-brand-vars')||'null');if(v){for(var k in v){if(/^--color-md-[a-z-]+$/.test(k)&&/^#[0-9A-F]{6}$/i.test(v[k]))document.documentElement.style.setProperty(k,v[k]);}}}catch(e){}`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${roboto.variable} ${geistMono.variable} font-sans h-full antialiased`}
      // O script de marca muda o style do <html> antes da hidratação.
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: BRAND_BOOTSTRAP }} />
      </head>
      <body className="min-h-full flex flex-col bg-brand-gray">
        <AuthProvider>
          <DynamicThemeProvider>
            <ToastProvider>
              <AppShell>{children}</AppShell>
            </ToastProvider>
          </DynamicThemeProvider>
        </AuthProvider>
        <PwaRegister />
        <OfflineBanner />
      </body>
    </html>
  );
}
