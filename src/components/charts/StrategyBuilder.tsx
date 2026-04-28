import React, { useState, useMemo } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine,
  ResponsiveContainer
} from 'recharts';
import {
  blackScholesPrice,
  delta as calcDelta,
  gamma as calcGamma,
  theta as calcTheta,
  vega as calcVega,
  rho as calcRho,
} from '../../lib/blackScholes';
import { Params } from '../../hooks/useGreeks';

interface Leg {
  id: string;
  type: 'call' | 'put';
  side: 'long' | 'short';
  qty: number;
  K: number;
  T: number;
}

interface StrategyBuilderProps {
  params: Params;
}

let _uid = 0;
const uid = () => String(++_uid);

function makeLeg(type: 'call' | 'put', side: 'long' | 'short', K: number, T: number, qty = 1): Leg {
  return { id: uid(), type, side, qty, K, T };
}

const PRESETS: Record<string, (K: number, T: number) => Leg[]> = {
  Straddle: (K, T) => [makeLeg('call', 'long', K, T), makeLeg('put', 'long', K, T)],
  Strangle: (K, T) => [makeLeg('call', 'long', K + 10, T), makeLeg('put', 'long', K - 10, T)],
  'Bull Call Spread': (K, T) => [makeLeg('call', 'long', K - 5, T), makeLeg('call', 'short', K + 5, T)],
  'Bear Put Spread': (K, T) => [makeLeg('put', 'long', K + 5, T), makeLeg('put', 'short', K - 5, T)],
  Butterfly: (K, T) => [makeLeg('call', 'long', K - 10, T), makeLeg('call', 'short', K, T, 2), makeLeg('call', 'long', K + 10, T)],
  'Iron Condor': (K, T) => [
    makeLeg('put', 'long', K - 15, T),
    makeLeg('put', 'short', K - 5, T),
    makeLeg('call', 'short', K + 5, T),
    makeLeg('call', 'long', K + 15, T),
  ],
};

const GREEK_META: Record<string, { label: string; color: string }> = {
  delta: { label: 'Δ Delta', color: '#3B82F6' },
  gamma: { label: 'Γ Gamma', color: '#10B981' },
  theta: { label: 'Θ Theta', color: '#F59E0B' },
  vega: { label: 'ν Vega', color: '#8B5CF6' },
  rho: { label: 'ρ Rho', color: '#EF4444' },
};

export const StrategyBuilder: React.FC<StrategyBuilderProps> = ({ params }) => {
  const [legs, setLegs] = useState<Leg[]>(() => PRESETS['Straddle'](params.K, params.T));

  const addLeg = () =>
    setLegs(l => [...l, makeLeg('call', 'long', params.K, params.T)]);

  const removeLeg = (id: string) =>
    setLegs(l => l.filter(leg => leg.id !== id));

  const updateLeg = (id: string, patch: Partial<Leg>) =>
    setLegs(l => l.map(leg => (leg.id === id ? { ...leg, ...patch } : leg)));

  const applyPreset = (name: string) => {
    const fn = PRESETS[name];
    if (fn) setLegs(fn(params.K, params.T));
  };

  const pnlData = useMemo(() => {
    const spotMin = params.K * 0.6;
    const spotMax = params.K * 1.4;
    return Array.from({ length: 100 }, (_, i) => {
      const S = spotMin + (i / 99) * (spotMax - spotMin);
      let pnl = 0;
      for (const leg of legs) {
        const Ty = leg.T / 365;
        const premium = blackScholesPrice(params.S, leg.K, Ty, params.r, params.sigma, leg.type);
        const payoff = leg.type === 'call' ? Math.max(S - leg.K, 0) : Math.max(leg.K - S, 0);
        const sign = leg.side === 'long' ? 1 : -1;
        pnl += sign * (payoff - premium) * leg.qty;
      }
      return { S: parseFloat(S.toFixed(2)), pnl: parseFloat(pnl.toFixed(2)) };
    });
  }, [legs, params]);

  const aggregateGreeks = useMemo(() => {
    let d = 0, g = 0, t = 0, v = 0, r = 0;
    for (const leg of legs) {
      const Ty = leg.T / 365;
      const sign = leg.side === 'long' ? 1 : -1;
      const q = leg.qty;
      d += sign * q * calcDelta(params.S, leg.K, Ty, params.r, params.sigma, leg.type);
      g += sign * q * calcGamma(params.S, leg.K, Ty, params.r, params.sigma);
      t += sign * q * calcTheta(params.S, leg.K, Ty, params.r, params.sigma, leg.type);
      v += sign * q * calcVega(params.S, leg.K, Ty, params.r, params.sigma);
      r += sign * q * calcRho(params.S, leg.K, Ty, params.r, params.sigma, leg.type);
    }
    return { delta: d, gamma: g, theta: t, vega: v, rho: r };
  }, [legs, params]);

  return (
    <div className="flex-1 flex flex-col bg-slate-900 p-4 md:p-6 rounded-lg border border-slate-700 min-h-[600px] md:min-h-0 overflow-auto">
      <h2 className="text-lg font-bold text-slate-100 mb-3">Strategy Builder</h2>

      {/* Presets */}
      <div className="flex gap-2 flex-wrap mb-3 items-center">
        <span className="text-xs text-slate-400">Preset:</span>
        {Object.keys(PRESETS).map(p => (
          <button
            key={p}
            onClick={() => applyPreset(p)}
            className="px-2 py-1 rounded text-xs text-slate-300 border border-slate-600 hover:border-slate-400 hover:text-slate-100 transition-colors"
          >
            {p}
          </button>
        ))}
      </div>

      {/* Legs table */}
      <div className="mb-4 overflow-x-auto rounded border border-slate-700">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-slate-400 bg-slate-800">
              <th className="px-3 py-2">Type</th>
              <th className="px-3 py-2">Side</th>
              <th className="px-3 py-2">Qty</th>
              <th className="px-3 py-2">Strike</th>
              <th className="px-3 py-2">Days</th>
              <th className="px-3 py-2">Premium</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {legs.map(leg => {
              const premium = blackScholesPrice(params.S, leg.K, leg.T / 365, params.r, params.sigma, leg.type);
              return (
                <tr key={leg.id} className="border-t border-slate-800 hover:bg-slate-800/50">
                  <td className="px-3 py-1.5">
                    <select
                      value={leg.type}
                      onChange={e => updateLeg(leg.id, { type: e.target.value as 'call' | 'put' })}
                      className="bg-slate-800 text-slate-200 rounded px-2 py-1 text-xs border border-slate-600 focus:outline-none focus:border-blue-500"
                    >
                      <option value="call">Call</option>
                      <option value="put">Put</option>
                    </select>
                  </td>
                  <td className="px-3 py-1.5">
                    <select
                      value={leg.side}
                      onChange={e => updateLeg(leg.id, { side: e.target.value as 'long' | 'short' })}
                      className="bg-slate-800 text-slate-200 rounded px-2 py-1 text-xs border border-slate-600 focus:outline-none focus:border-blue-500"
                    >
                      <option value="long">Long</option>
                      <option value="short">Short</option>
                    </select>
                  </td>
                  <td className="px-3 py-1.5">
                    <input
                      type="number" min={1} max={10} value={leg.qty}
                      onChange={e => updateLeg(leg.id, { qty: Math.max(1, parseInt(e.target.value) || 1) })}
                      className="bg-slate-800 text-slate-200 rounded px-2 py-1 text-xs border border-slate-600 w-14 focus:outline-none focus:border-blue-500"
                    />
                  </td>
                  <td className="px-3 py-1.5">
                    <input
                      type="number" min={10} max={500} step={0.5} value={leg.K}
                      onChange={e => updateLeg(leg.id, { K: parseFloat(e.target.value) || params.K })}
                      className="bg-slate-800 text-slate-200 rounded px-2 py-1 text-xs border border-slate-600 w-20 focus:outline-none focus:border-blue-500"
                    />
                  </td>
                  <td className="px-3 py-1.5">
                    <input
                      type="number" min={1} max={365} step={1} value={Math.round(leg.T)}
                      onChange={e => updateLeg(leg.id, { T: parseFloat(e.target.value) || params.T })}
                      className="bg-slate-800 text-slate-200 rounded px-2 py-1 text-xs border border-slate-600 w-16 focus:outline-none focus:border-blue-500"
                    />
                  </td>
                  <td className="px-3 py-1.5 text-slate-300 font-mono text-xs">
                    ${premium.toFixed(2)}
                  </td>
                  <td className="px-3 py-1.5">
                    <button
                      onClick={() => removeLeg(leg.id)}
                      className="text-slate-500 hover:text-red-400 transition-colors text-xs"
                      title="Remove leg"
                    >
                      ✕
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div className="px-3 py-2 bg-slate-800/50">
          <button
            onClick={addLeg}
            className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
          >
            + Add Leg
          </button>
        </div>
      </div>

      {/* Aggregate Greeks */}
      <div className="flex gap-2 flex-wrap mb-4">
        {(Object.entries(GREEK_META) as [string, { label: string; color: string }][]).map(([key, meta]) => {
          const val = aggregateGreeks[key as keyof typeof aggregateGreeks];
          return (
            <div key={key} className="bg-slate-800 rounded-lg px-3 py-2 text-center min-w-[72px]">
              <div className="text-xs mb-1" style={{ color: meta.color }}>{meta.label}</div>
              <div className={`text-sm font-bold font-mono ${val > 0 ? 'text-green-400' : val < 0 ? 'text-red-400' : 'text-slate-400'}`}>
                {val > 0 ? '+' : ''}{val.toFixed(4)}
              </div>
            </div>
          );
        })}
      </div>

      {/* P&L Chart */}
      <div className="flex-1 min-h-[200px]">
        <p className="text-xs text-slate-400 mb-2">Net P&L at expiry — computed at current spot (${params.S.toFixed(2)}), vol & rate</p>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={pnlData} margin={{ top: 5, right: 20, left: 10, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis
              dataKey="S"
              type="number"
              domain={['dataMin', 'dataMax']}
              tickFormatter={(v) => `$${Number(v).toFixed(0)}`}
              stroke="#94a3b8"
              label={{ value: 'Spot Price at Expiry', position: 'insideBottomRight', offset: -5, fill: '#64748b', fontSize: 11 }}
            />
            <YAxis
              tickFormatter={(v) => `$${Number(v).toFixed(1)}`}
              stroke="#94a3b8"
              label={{ value: 'P&L ($)', angle: -90, position: 'insideLeft', fill: '#64748b', fontSize: 11 }}
            />
            <Tooltip
              contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '8px' }}
              labelStyle={{ color: '#e2e8f0' }}
              labelFormatter={(v) => `Spot Price: $${Number(v).toFixed(2)}`}
              formatter={(v: number) => [`$${v.toFixed(2)}`, 'Net P&L']}
            />
            <ReferenceLine y={0} stroke="#475569" strokeDasharray="4 4" />
            <ReferenceLine
              x={params.S}
              stroke="#3B82F6"
              strokeDasharray="4 4"
              label={{ value: 'Current', fill: '#3B82F6', fontSize: 10 }}
            />
            {legs.map(leg => (
              <ReferenceLine
                key={leg.id}
                x={leg.K}
                stroke="#334155"
                strokeDasharray="2 4"
              />
            ))}
            <Line
              type="monotone"
              dataKey="pnl"
              stroke="#10B981"
              dot={false}
              strokeWidth={2}
              isAnimationActive={false}
              name="Net P&L"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
