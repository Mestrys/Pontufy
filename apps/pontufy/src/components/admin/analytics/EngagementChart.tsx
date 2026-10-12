'use client';

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import type { TooltipContentProps } from 'recharts';
import type { EngagementPoint } from './types';

const EMERALD = '#10B981';
const PURPLE = '#8B5CF6';

function ChartTooltip({ active, payload, label }: TooltipContentProps) {
  if (!active || !payload?.length) return null;

  return (
    <div className="bg-[#1f1f1f] border border-[#2a2a2a] rounded-lg px-4 py-3 shadow-xl">
      <p className="text-xs font-bold text-white mb-2">{label}</p>
      <div className="space-y-1.5">
        {payload.map((entry) => (
          <div key={String(entry.dataKey)} className="flex items-center gap-2">
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: entry.color ?? EMERALD }}
            />
            <span className="text-xs text-gray-400">{entry.name ?? '—'}:</span>
            <span className="text-xs font-bold text-white">
              {new Intl.NumberFormat('pt-BR').format(Number(entry.value ?? 0))}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

interface EngagementChartProps {
  data: EngagementPoint[];
}

export default function EngagementChart({ data }: EngagementChartProps) {
  if (!data.length) {
    return (
      <div className="flex h-72 items-center justify-center">
        <p className="text-sm text-gray-500">Sem dados de engajamento nos últimos 30 dias.</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
            <defs>
              <linearGradient id="gradCompletions" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={EMERALD} stopOpacity={0.3} />
                <stop offset="100%" stopColor={EMERALD} stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gradRedemptions" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={PURPLE} stopOpacity={0.3} />
                <stop offset="100%" stopColor={PURPLE} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" vertical={false} />
            <XAxis
              dataKey="date"
              tick={{ fill: '#6b7280', fontSize: 11 }}
              tickLine={false}
              axisLine={{ stroke: '#2a2a2a' }}
              minTickGap={24}
            />
            <YAxis
              tick={{ fill: '#6b7280', fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              allowDecimals={false}
              width={44}
            />
            <Tooltip
              content={(props) => <ChartTooltip {...props} />}
              cursor={{ stroke: '#3f3f46', strokeDasharray: '4 4' }}
            />
            <Area
              type="monotone"
              dataKey="completions"
              name="Conclusões"
              stroke={EMERALD}
              strokeWidth={2}
              fill="url(#gradCompletions)"
            />
            <Area
              type="monotone"
              dataKey="redemptions"
              name="Resgates"
              stroke={PURPLE}
              strokeWidth={2}
              fill="url(#gradRedemptions)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 flex items-center gap-6">
        <span className="flex items-center gap-2 text-xs text-gray-400">
          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: EMERALD }} />
          Conclusões de aulas
        </span>
        <span className="flex items-center gap-2 text-xs text-gray-400">
          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: PURPLE }} />
          Resgates de benefícios
        </span>
      </div>
    </div>
  );
}
