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
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f5f4f6" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
};

// Antes da primeira pintura: aplica a aparência escolhida no Perfil
// (data-theme) e a marca do tenant guardada na última visita, sem esperar o
// fetch do DynamicThemeProvider. Só aceita nomes de token e #RRGGBB.
const THEME_BOOTSTRAP = `try{var t=localStorage.getItem('pontufy-theme');if(t==='light'||t==='dark')document.documentElement.setAttribute('data-theme',t);}catch(e){}
try{var v=JSON.parse(localStorage.getItem('pontufy-brand-v2')||'null');if(v&&v.dark&&v.light){var b=function(o){var r='';for(var k in o){if(/^--color-md-[a-z-]+$/.test(k)&&/^#[0-9A-F]{6}$/i.test(o[k]))r+=k+':'+o[k]+';';}return r;};var s=document.createElement('style');s.id='pontufy-brand';s.textContent=':root:root{'+b(v.dark)+'}:root:root[data-theme="light"]{'+b(v.light)+'}@media (prefers-color-scheme: light){:root:root:not([data-theme="dark"]){'+b(v.light)+'}}';document.head.appendChild(s);}}catch(e){}`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${roboto.variable} ${geistMono.variable} font-sans h-full antialiased`}
      // O script do <head> põe data-theme no <html> antes da hidratação.
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOTSTRAP }} />
      </head>
      <body className="min-h-full flex flex-col bg-md-surface-dim text-md-on-surface">
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
