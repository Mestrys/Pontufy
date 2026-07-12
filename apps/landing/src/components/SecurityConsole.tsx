import React, { useState, useEffect, useRef } from 'react';
import { ShieldCheck, Database, Key, RefreshCw } from 'lucide-react';
import { translations } from '../translations';
import { SecurityLog } from '../types';

interface SecurityConsoleProps {
  language: string;
  logs: SecurityLog[];
  addSecurityLog: (action: string, status: 'success' | 'warning' | 'info', details: string) => void;
}

export default function SecurityConsole({ language, logs, addSecurityLog }: SecurityConsoleProps) {
  const [tenant, setTenant] = useState('TNT-891-CORP');
  const [isZeroTrust, setIsZeroTrust] = useState(true);

  const t = translations[language].security;
  const secLogs = translations[language].security.logs;

  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  const handleToggleZeroTrust = () => {
    const newState = !isZeroTrust;
    setIsZeroTrust(newState);
    addSecurityLog(
      'ZERO_TRUST_TOGGLED',
      newState ? 'success' : 'warning',
      secLogs.zeroTrustToggled.replace('{state}', newState ? t.enabled : t.disabled)
    );
  };

  return (
    <section id="security-architecture" className="py-24 bg-slate-50 border-t border-slate-200/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Text Content */}
          <div className="lg:col-span-5 space-y-6">
            <div className="inline-flex items-center gap-2 bg-white border border-slate-200/60 text-slate-500 px-3 py-1 rounded-full text-xs font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-purple-500" />
              <span>{t.badge}</span>
            </div>
            
            <h2 className="font-display text-3xl sm:text-4xl font-semibold tracking-tight text-slate-900 text-balance">
              {t.title}
            </h2>
            
            <p className="text-slate-500 leading-relaxed">
              {t.desc}
            </p>

            <div className="space-y-4">
              {t.benefits.map((benefit, index) => {
                const Icons = [Database, RefreshCw, Key];
                const Icon = Icons[index] || Database;
                return (
                  <div key={index} className="flex items-start space-x-3">
                    <div className="p-2 rounded-lg bg-white border border-slate-200/60 text-slate-600 shrink-0 mt-0.5">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-medium text-slate-900 text-sm">{benefit.title}</h4>
                      <p className="text-slate-500 text-xs leading-relaxed mt-0.5">{benefit.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Interactive Console Mockup */}
          <div className="lg:col-span-7">
            <div className="bg-slate-900 rounded-2xl overflow-hidden border border-slate-800/80 font-mono text-xs text-slate-300">
              
              {/* Top Bar */}
              <div className="bg-slate-950 px-6 py-4 border-b border-slate-800 flex justify-between items-center flex-wrap gap-3">
                <div className="flex items-center space-x-2">
                  <div className="w-3.5 h-3.5 rounded-full bg-red-500"></div>
                  <div className="w-3.5 h-3.5 rounded-full bg-yellow-500"></div>
                  <div className="w-3.5 h-3.5 rounded-full bg-emerald-500"></div>
                  <span className="text-slate-400 text-[11px] ml-2">PONTUFY_INFRA_MONITOR_v1.0.4</span>
                </div>

                <div className="flex items-center space-x-3 text-[11px]">
                  <span className="text-slate-500">Tenant:</span>
                  <select
                    value={tenant}
                    onChange={(e) => {
                      const newTenant = e.target.value;
                      setTenant(newTenant);
                      addSecurityLog(
                        'TENANT_CHANGED',
                        'info',
                        secLogs.tenantChanged.replace('{tenant}', newTenant)
                      );
                    }}
                    className="bg-slate-900 border border-slate-700 rounded px-2 py-0.5 text-slate-300 focus:outline-none focus:border-purple-500 cursor-pointer"
                  >
                    <option value="TNT-891-CORP">TNT-891-CORP</option>
                    <option value="TNT-452-RETAIL">TNT-452-RETAIL</option>
                    <option value="TNT-109-HEALTH">TNT-109-HEALTH</option>
                  </select>
                </div>
              </div>

              {/* Status Banner */}
              <div className="bg-slate-900/60 p-4 border-b border-slate-800 grid grid-cols-3 gap-2 text-center text-[10px]">
                <div className="bg-slate-950 rounded-xl p-2.5 border border-slate-800">
                  <span className="block text-slate-500 mb-1 uppercase tracking-wider">{t.zeroTrustShield}</span>
                  <button
                    onClick={handleToggleZeroTrust}
                    className={`px-2 py-0.5 rounded font-bold transition-all cursor-pointer ${
                      isZeroTrust ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
                    }`}
                  >
                    {isZeroTrust ? t.enabled : t.disabled}
                  </button>
                </div>
                <div className="bg-slate-950 rounded-xl p-2.5 border border-slate-800">
                  <span className="block text-slate-500 mb-1 uppercase tracking-wider">{t.integrityLabel}</span>
                  <span className="font-bold text-emerald-400">100.00% SECURE</span>
                </div>
                <div className="bg-slate-950 rounded-xl p-2.5 border border-slate-800">
                  <span className="block text-slate-500 mb-1 uppercase tracking-wider">{t.auditsLabel}</span>
                  <span className="font-bold text-purple-400">{t.auditsValue}</span>
                </div>
              </div>

              {/* Console Logs */}
              <div className="h-64 p-6 overflow-y-auto space-y-3 bg-slate-950/80">
                {logs.map((log) => (
                  <div key={log.id} className="leading-relaxed">
                    <span className="text-slate-500">[{log.timestamp}]</span>{' '}
                    <span
                      className={`font-semibold px-1.5 py-0.5 rounded text-[10px] ${
                        log.status === 'success'
                          ? 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20'
                          : log.status === 'warning'
                          ? 'text-yellow-400 bg-yellow-500/10 border border-yellow-500/20'
                          : 'text-purple-400 bg-purple-500/10 border border-purple-500/20'
                      }`}
                    >
                      {log.action}
                    </span>{' '}
                    <span className="text-slate-300">— {log.details}</span>
                  </div>
                ))}
                <div ref={logEndRef}></div>
              </div>

            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
