'use client';

import { useState, useTransition } from 'react';
import { Plus, Loader2, ChevronDown } from 'lucide-react';
import { createInviteCode, type ActionResult } from './actions';

export default function InviteCodeForm() {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<ActionResult | null>(null);

  const handleSubmit = (formData: FormData) => {
    startTransition(async () => {
      setResult(await createInviteCode(formData));
    });
  };

  return (
    <div className="space-y-3">
      <form action={handleSubmit} className="flex flex-wrap items-end gap-3">
        <div>
          <label htmlFor="roleType" className="mb-1.5 block text-xs font-medium text-ink-muted">
            Perfil do convite
          </label>
          <div className="relative">
            <select
              id="roleType"
              name="roleType"
              defaultValue="EMPLOYEE"
              className="appearance-none rounded-xl border border-edge bg-surface-0 py-2.5 pl-4 pr-10 text-sm text-ink focus:border-mint/50 focus:outline-none"
            >
              <option value="EMPLOYEE">Colaborador</option>
              <option value="MANAGER">Gestor</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
          </div>
        </div>

        <div>
          <label htmlFor="validityDays" className="mb-1.5 block text-xs font-medium text-ink-muted">
            Validade (dias)
          </label>
          <input
            id="validityDays"
            name="validityDays"
            type="number"
            min={1}
            max={365}
            defaultValue={30}
            className="w-28 rounded-xl border border-edge bg-surface-0 px-4 py-2.5 text-sm text-ink focus:border-mint/50 focus:outline-none"
          />
        </div>

        <button
          type="submit"
          disabled={pending}
          data-testid="create-invite-code"
          className="flex items-center gap-2 rounded-xl bg-mint px-5 py-2.5 text-sm font-semibold text-black transition-colors hover:bg-emerald-300 disabled:cursor-wait disabled:opacity-70"
        >
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          Gerar código
        </button>
      </form>

      {result && (
        <p
          data-testid="invite-code-result"
          className={`rounded-xl border p-3 text-xs ${
            result.ok
              ? 'border-mint/30 bg-mint/10 text-mint'
              : 'border-amber-500/30 bg-amber-500/10 text-amber-400'
          }`}
        >
          {result.message}
        </p>
      )}
    </div>
  );
}
