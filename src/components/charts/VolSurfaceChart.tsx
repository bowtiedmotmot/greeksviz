import React, { useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ReferenceLine,
  ResponsiveContainer
} from 'recharts';
import { SurfaceCanvas3D } from './SurfaceCanvas3D';
import { Params } from '../../hooks/useGreeks';

interface VolSurfaceChartProps {
  params: Params;
}

const EXPIRY_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];
const EXPIRIES = [14, 30, 60, 90, 180, 365];
const N_STRIKES = 30;

export const VolSurfaceChart: React.FC<VolSurfaceChartProps> = ({ params }) => {
  const [smileAlpha, setSmileAlpha] = useState(0.3);
  const [view3D, setView3D] = useState(false);

  const strikes = Array.from({ length: N_STRIKES }, (_, i) =>
    Math.round(params.S * (0.6 + (i / (N_STRIKES - 1)) * 0.8))
  );

  const getSmileVol = (K: number, T: number) => {
    const logM = Math.log(K / params.S);
    // Term structure: slightly higher vol at short expiries
    const termAdj = 1 + 0.08 * (1 - Math.sqrt(Math.max(T, 1) / 365));
    return Math.max(0.01, params.sigma * (1 + smileAlpha * logM * logM) * termAdj);
  };

  const chartData = strikes.map(K => {
    const row: Record<string, number> = { K };
    EXPIRIES.forEach(T => {
      row[`t${T}`] = parseFloat((getSmileVol(K, T) * 100).toFixed(2));
    });
    return row;
  });

  const z3D = EXPIRIES.map(T =>
    strikes.map(K => parseFloat((getSmileVol(K, T) * 100).toFixed(3)))
  );

  return (
    <div className="flex-1 flex flex-col bg-slate-900 p-4 md:p-6 rounded-lg border border-slate-700 min-h-[400px] md:min-h-0">
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <h2 className="text-lg font-bold text-slate-100">Vol Surface (Parametric Smile)</h2>
        <button
          onClick={() => setView3D(v => !v)}
          className={`px-3 py-1 rounded text-sm font-medium transition-colors border ${
            view3D
              ? 'bg-blue-600 text-white border-blue-600'
              : 'text-slate-400 border-slate-600 hover:text-slate-200 hover:border-slate-400'
          }`}
        >
          {view3D ? '2D' : '3D'}
        </button>
      </div>

      <div className="mb-3">
        <div className="flex justify-between text-xs text-slate-400 mb-1">
          <span>Smile steepness α = {smileAlpha.toFixed(2)}</span>
          <span className="text-slate-500">0 = flat · 1 = strong smile</span>
        </div>
        <input
          type="range" min={0} max={1} step={0.01}
          value={smileAlpha}
          onChange={e => setSmileAlpha(parseFloat(e.target.value))}
          className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
        />
      </div>

      <div className="flex-1 min-h-0">
        {!view3D ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis
                dataKey="K"
                type="number"
                domain={['dataMin', 'dataMax']}
                tickFormatter={(v) => `$${Number(v).toFixed(0)}`}
                stroke="#94a3b8"
                label={{ value: 'Strike Price', position: 'insideBottomRight', offset: -5, fill: '#64748b', fontSize: 11 }}
              />
              <YAxis
                tickFormatter={(v) => `${Number(v).toFixed(0)}%`}
                stroke="#94a3b8"
                label={{ value: 'Implied Vol (%)', angle: -90, position: 'insideLeft', fill: '#64748b', fontSize: 11 }}
              />
              <Tooltip
                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '8px' }}
                labelStyle={{ color: '#e2e8f0' }}
                labelFormatter={(v) => `Strike: $${Number(v).toFixed(2)}`}
                formatter={(v: number, name: string) => [`${v.toFixed(2)}%`, `${String(name).replace('t', '')}d expiry`]}
              />
              <ReferenceLine
                x={Math.round(params.S)}
                stroke="#64748b"
                strokeDasharray="4 4"
                label={{ value: 'ATM', fill: '#64748b', fontSize: 10 }}
              />
              <Legend formatter={name => `${String(name).replace('t', '')}d`} />
              {EXPIRIES.map((T, i) => (
                <Line
                  key={T}
                  type="monotone"
                  dataKey={`t${T}`}
                  stroke={EXPIRY_COLORS[i]}
                  dot={false}
                  strokeWidth={1.5}
                  isAnimationActive={false}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <SurfaceCanvas3D
            xs={strikes}
            ys={EXPIRIES}
            zs={z3D}
            xLabel="Strike"
            yLabel="Days"
            zLabel="IV %"
            colorMode="sequential"
            height={450}
          />
        )}
      </div>

      <p className="mt-3 text-xs text-slate-500">
        σ(K,T) = σ_ATM · (1 + α · ln²(K/S)) · term-struct — ATM vol {(params.sigma * 100).toFixed(1)}% at S = ${params.S.toFixed(0)}
      </p>
    </div>
  );
};
