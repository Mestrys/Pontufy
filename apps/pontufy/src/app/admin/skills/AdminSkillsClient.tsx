'use client';

import { useEffect, useState } from 'react';
import { Loader2, TreePine, Target, ArrowLeft, Send } from 'lucide-react';
import Link from 'next/link';

// TAREFA 12.5 — Painel de trilhas + PDI do RH (paleta admin legada).

interface NodeRow {
  id: string;
  title: string;
  x: number;
  y: number;
  requiredScore: number;
  courseId: string | null;
  prerequisiteId: string | null;
}

interface SkillRow {
  id: string;
  name: string;
  category: string;
  targetLevel: number;
  nodes: NodeRow[];
}

interface UserRow {
  id: string;
  name: string;
  email: string;
}

interface PdiRow {
  userId: string;
  userName: string;
  nodeId: string;
  nodeTitle: string;
  skillName: string;
  createdAt: string;
}

export default function AdminSkillsClient() {
  const [skills, setSkills] = useState<SkillRow[]>([]);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [pdis, setPdis] = useState<PdiRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form de criação
  const [skillName, setSkillName] = useState('');
  const [skillCategory, setSkillCategory] = useState('leadership');
  const [targetLevel, setTargetLevel] = useState(4);

  // Form de PDI
  const [pdiUserId, setPdiUserId] = useState('');
  const [pdiNodeId, setPdiNodeId] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const [skillsRes, invRes, pdiRes] = await Promise.all([
        fetch('/api/admin/skills', { cache: 'no-store' }),
        fetch('/api/invitations', { cache: 'no-store' }),
        fetch('/api/admin/skills/pdi', { cache: 'no-store' }),
      ]);
      const skillsData = await skillsRes.json();
      const invData = await invRes.json();
      const pdiData = await pdiRes.json();
      if (skillsRes.ok) setSkills(skillsData.skills ?? []);
      if (invRes.ok) setUsers(invData.users ?? []);
      if (pdiRes.ok) setPdis(pdiData.pdis ?? []);
    } catch {
      setMessage({ type: 'error', text: 'Erro ao carregar dados.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleCreateSkill = async () => {
    if (!skillName.trim()) {
      setMessage({ type: 'error', text: 'Informe o nome da competência.' });
      return;
    }
    setCreating(true);
    setMessage(null);
    try {
      const res = await fetch('/api/admin/skills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: skillName.trim(), category: skillCategory, targetLevel }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage({ type: 'error', text: data.error || 'Erro ao criar.' });
        return;
      }
      setMessage({ type: 'success', text: `Competência "${skillName.trim()}" criada.` });
      setSkillName('');
      await load();
    } catch {
      setMessage({ type: 'error', text: 'Erro ao criar competência.' });
    } finally {
      setCreating(false);
    }
  };

  const handleAssignPdi = async () => {
    if (!pdiUserId || !pdiNodeId) {
      setMessage({ type: 'error', text: 'Selecione colaborador e nó da árvore.' });
      return;
    }
    setCreating(true);
    setMessage(null);
    try {
      const res = await fetch('/api/admin/skills/pdi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: pdiUserId, skillNodeId: pdiNodeId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage({ type: 'error', text: data.error || 'Erro ao vincular PDI.' });
        return;
      }
      setMessage({ type: 'success', text: 'Nó vinculado ao PDI do colaborador.' });
      await load();
    } catch {
      setMessage({ type: 'error', text: 'Erro ao vincular PDI.' });
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] px-4 py-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <div>
          <Link
            href="/admin"
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-300 transition-colors mb-2"
          >
            <ArrowLeft size={15} /> Voltar ao painel
          </Link>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <TreePine className="text-emerald-400" /> Trilhas de Competência
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Crie competências corporativas e vincule nós de PDI ao desenvolvimento individual dos colaboradores.
          </p>
        </div>

        {message && (
          <div
            className={`text-sm p-3 rounded-lg text-center font-medium ${
              message.type === 'success'
                ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                : 'bg-red-500/10 border border-red-500/20 text-red-400'
            }`}
          >
            {message.text}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="animate-spin text-emerald-500" size={26} />
          </div>
        ) : (
          <>
            {/* ── Nova competência ─────────────────────────────────────── */}
            <section className="bg-[#141414] border border-[#2a2a2a] rounded-2xl p-5">
              <h2 className="text-sm font-bold text-white uppercase tracking-wide mb-4">Nova Competência</h2>
              <div className="grid sm:grid-cols-4 gap-3">
                <input
                  value={skillName}
                  onChange={(e) => setSkillName(e.target.value)}
                  placeholder="Ex.: Liderança"
                  className="sm:col-span-2 px-4 py-2.5 bg-[#1f1f1f] border border-[#2a2a2a] rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500 text-sm"
                />
                <select
                  value={skillCategory}
                  onChange={(e) => setSkillCategory(e.target.value)}
                  className="px-4 py-2.5 bg-[#1f1f1f] border border-[#2a2a2a] rounded-lg text-white focus:outline-none focus:border-emerald-500 text-sm"
                >
                  <option value="leadership">Liderança</option>
                  <option value="compliance">Compliance</option>
                  <option value="tech">Tecnologia</option>
                  <option value="health">Saúde</option>
                  <option value="retail">Varejo</option>
                  <option value="industry">Indústria</option>
                  <option value="general">Geral</option>
                </select>
                <select
                  value={targetLevel}
                  onChange={(e) => setTargetLevel(Number(e.target.value))}
                  className="px-4 py-2.5 bg-[#1f1f1f] border border-[#2a2a2a] rounded-lg text-white focus:outline-none focus:border-emerald-500 text-sm"
                >
                  {[3, 4, 5].map((l) => (
                    <option key={l} value={l}>Nível-alvo {l}</option>
                  ))}
                </select>
              </div>
              <p className="text-xs text-gray-600 mt-2">
                Os nós da árvore são criados ao vincular cursos existentes — os primeiros nós ficam
                disponíveis automaticamente; os seguintes exigem ≥ 80% no pré-requisito.
              </p>
              <button
                type="button"
                onClick={handleCreateSkill}
                disabled={creating}
                className="mt-4 flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-500 transition-colors disabled:opacity-50"
              >
                {creating ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
                Criar competência
              </button>
            </section>

            {/* ── Trilhas existentes ───────────────────────────────────── */}
            <section className="bg-[#141414] border border-[#2a2a2a] rounded-2xl p-5">
              <h2 className="text-sm font-bold text-white uppercase tracking-wide mb-4">Trilhas Publicadas</h2>
              {skills.length === 0 ? (
                <p className="text-sm text-gray-600 text-center py-6">Nenhuma competência criada ainda.</p>
              ) : (
                <div className="grid sm:grid-cols-2 gap-3">
                  {skills.map((s) => (
                    <div key={s.id} className="bg-[#1f1f1f] border border-[#2a2a2a] rounded-xl p-4">
                      <div className="flex items-center justify-between">
                        <p className="font-bold text-white">{s.name}</p>
                        <span className="text-[10px] font-bold uppercase text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-2 py-0.5">
                          {s.category}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">{s.nodes.length} nós · nível-alvo {s.targetLevel}</p>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {s.nodes.map((n) => (
                          <span
                            key={n.id}
                            title={`${n.title}${n.prerequisiteId ? ' (requer pré-requisito)' : ' (raiz)'}`}
                            className="text-[10px] font-mono text-gray-400 bg-[#2a2a2a] rounded px-1.5 py-0.5"
                          >
                            {n.title.length > 14 ? `${n.title.slice(0, 13)}…` : n.title}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* ── PDI ──────────────────────────────────────────────────── */}
            <section className="bg-[#141414] border border-[#2a2a2a] rounded-2xl p-5">
              <h2 className="text-sm font-bold text-white uppercase tracking-wide mb-4 flex items-center gap-2">
                <Target size={15} className="text-emerald-400" /> Plano de Desenvolvimento Individual
              </h2>
              <div className="grid sm:grid-cols-3 gap-3">
                <select
                  value={pdiUserId}
                  onChange={(e) => setPdiUserId(e.target.value)}
                  className="px-4 py-2.5 bg-[#1f1f1f] border border-[#2a2a2a] rounded-lg text-white focus:outline-none focus:border-emerald-500 text-sm"
                >
                  <option value="">Colaborador…</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.email})
                    </option>
                  ))}
                </select>
                <select
                  value={pdiNodeId}
                  onChange={(e) => setPdiNodeId(e.target.value)}
                  className="px-4 py-2.5 bg-[#1f1f1f] border border-[#2a2a2a] rounded-lg text-white focus:outline-none focus:border-emerald-500 text-sm"
                >
                  <option value="">Nó da árvore…</option>
                  {skills.flatMap((s) =>
                    s.nodes.map((n) => (
                      <option key={n.id} value={n.id}>
                        {s.name} → {n.title}
                      </option>
                    )),
                  )}
                </select>
                <button
                  type="button"
                  onClick={handleAssignPdi}
                  disabled={creating}
                  className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-500 transition-colors disabled:opacity-50"
                >
                  {creating ? <Loader2 size={15} className="animate-spin" /> : <Target size={15} />}
                  Vincular ao PDI
                </button>
              </div>

              {pdis.length > 0 && (
                <div className="mt-4">
                  <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-2">PDIs ativos</p>
                  <div className="space-y-2">
                    {pdis.map((p, i) => (
                      <div key={`${p.userId}-${p.nodeId}-${i}`} className="flex items-center justify-between bg-[#1f1f1f] border border-[#2a2a2a] rounded-lg px-4 py-2.5 text-sm">
                        <div>
                          <span className="text-white font-semibold">{p.userName}</span>
                          <span className="text-gray-500"> → {p.skillName}: {p.nodeTitle}</span>
                        </div>
                        <span className="text-xs text-gray-600">{new Date(p.createdAt).toLocaleDateString('pt-BR')}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
}