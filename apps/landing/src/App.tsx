import { useEffect, useState } from 'react';
import Header from './components/Header';
import Hero from './components/Hero';
import { AiCourses, Faq, HowItWorks, Rewards, Security } from './components/Sections';
import Footer from './components/Footer';
import { COPY, type Lang } from './i18n';

const LANG_STORAGE_KEY = 'pontufy-lang';
const HTML_LANG: Record<Lang, string> = { 'PT-BR': 'pt-BR', 'EN-US': 'en', 'ES-LA': 'es' };

function isLang(v: string | null): v is Lang {
  return v !== null && v in COPY;
}

function detectInitialLanguage(): Lang {
  try {
    const saved = localStorage.getItem(LANG_STORAGE_KEY);
    if (isLang(saved)) return saved;
  } catch {
    // Sem storage (aba privada): segue pelo idioma do navegador.
  }
  const nav = navigator.language?.toLowerCase() ?? '';
  if (nav.startsWith('pt')) return 'PT-BR';
  if (nav.startsWith('es')) return 'ES-LA';
  return 'EN-US';
}

export default function App() {
  const [language, setLanguageState] = useState<Lang>(detectInitialLanguage);

  const setLanguage = (lang: Lang) => {
    try {
      localStorage.setItem(LANG_STORAGE_KEY, lang);
    } catch {
      // Sem storage: vale até recarregar.
    }
    setLanguageState(lang);
  };

  useEffect(() => {
    document.documentElement.lang = HTML_LANG[language];
  }, [language]);

  return (
    <div className="min-h-screen bg-md-surface-dim font-sans text-md-on-surface antialiased">
      <a
        href="#conteudo"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-full focus:bg-md-primary focus:px-4 focus:py-3 focus:text-md-on-primary"
      >
        {language === 'EN-US' ? 'Skip to content' : language === 'ES-LA' ? 'Saltar al contenido' : 'Pular para o conteúdo'}
      </a>
      <Header language={language} setLanguage={setLanguage} />
      <main id="conteudo">
        <Hero language={language} />
        <HowItWorks language={language} />
        <AiCourses language={language} />
        <Rewards language={language} />
        <Security language={language} />
        <Faq language={language} />
      </main>
      <Footer language={language} />
    </div>
  );
}
