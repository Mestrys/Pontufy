import React, { useState } from 'react';
import Header from './components/Header';
import Hero from './components/Hero';
import HowItWorks from './components/HowItWorks';
import CourseSimulator from './components/CourseSimulator';
import RewardsSimulator from './components/RewardsSimulator';
import SecurityConsole from './components/SecurityConsole';
import FeaturesMatrix from './components/FeaturesMatrix';
import FAQAccordion from './components/FAQAccordion';
import Footer from './components/Footer';
import { SecurityLog } from './types';
import { ShieldCheck } from 'lucide-react';
import { translations } from './translations';

const LANG_STORAGE_KEY = 'pontufy-lang';

function detectInitialLanguage(): string {
  const saved = localStorage.getItem(LANG_STORAGE_KEY);
  if (saved && translations[saved]) return saved;

  const nav = navigator.language?.toLowerCase() ?? '';
  if (nav.startsWith('pt')) return 'PT-BR';
  if (nav.startsWith('es')) return 'ES-LA';
  return 'EN-US';
}

export default function App() {
  const [language, setLanguageState] = useState(detectInitialLanguage);

  const setLanguage = (lang: string) => {
    localStorage.setItem(LANG_STORAGE_KEY, lang);
    setLanguageState(lang);
  };
  const [points, setPoints] = useState(500); // Starting with 500 so they can try rewards instantly!
  const [logs, setLogs] = useState<SecurityLog[]>([
    {
      id: '1',
      timestamp: '11:35:10',
      action: 'TENANT_AUTH_SUCCESS',
      status: 'success',
      details: 'Tenant TNT-891-CORP autenticado via Zero Trust Token'
    },
    {
      id: '2',
      timestamp: '11:35:12',
      action: 'LEDGER_INTEGRITY_CHECK',
      status: 'success',
      details: 'Varredura de hashes de pontuação concluída. Pontos íntegros.'
    },
    {
      id: '3',
      timestamp: '11:35:15',
      action: 'API_GATEWAY_HEALTH',
      status: 'info',
      details: 'Gateways nativos (Amazon, Magalu, Shopee) operando normalmente'
    }
  ]);

  const addSecurityLog = (action: string, status: 'success' | 'warning' | 'info', details: string) => {
    const now = new Date();
    const timeStr = now.toTimeString().split(' ')[0];
    const newLog: SecurityLog = {
      id: crypto.randomUUID(),
      timestamp: timeStr,
      action,
      status,
      details
    };
    setLogs(prev => [...prev, newLog]);
  };

  const handleStartSimulation = () => {
    const element = document.getElementById('course-simulator');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans antialiased text-slate-800">

      <Header language={language} setLanguage={setLanguage} points={points} />
      
      <main className="relative">
        <Hero onStartSimulation={handleStartSimulation} language={language} />
        
        {/* Connection strip between modules */}
        <section className="bg-slate-50 py-10 border-y border-slate-200/60">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white border border-slate-200/60 rounded-xl text-slate-700">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-display font-semibold text-slate-900 text-base tracking-tight">
                  {translations[language].connectivity.title}
                </h4>
                <p className="text-sm text-slate-500">
                  {translations[language].connectivity.desc}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-8">
              <div className="text-center">
                <span className="block font-display text-lg font-semibold text-slate-900">100%</span>
                <span className="text-xs text-slate-500">
                  {translations[language].connectivity.labelAI}
                </span>
              </div>
              <div className="text-center">
                <span className="block font-display text-lg font-semibold text-slate-900">Zero</span>
                <span className="text-xs text-slate-500">
                  {translations[language].connectivity.labelRH}
                </span>
              </div>
            </div>
          </div>
        </section>

        <HowItWorks language={language} />
        
        {/* Course generation simulator */}
        <CourseSimulator 
          points={points} 
          setPoints={setPoints} 
          addSecurityLog={addSecurityLog} 
          language={language}
        />
        
        {/* Rewards and marketplace showcase */}
        <RewardsSimulator 
          points={points} 
          setPoints={setPoints} 
          addSecurityLog={addSecurityLog} 
          language={language}
        />
        
        {/* Zero trust security control view */}
        <SecurityConsole 
          language={language}
          logs={logs}
          addSecurityLog={addSecurityLog}
        />
        
        <FeaturesMatrix language={language} />
        
        <FAQAccordion language={language} />
      </main>

      <Footer language={language} />
    </div>
  );
}
