import React, { useState } from 'react';
import { GreekMetadata } from '../../constants/greekMeta';
import { Params } from '../../hooks/useGreeks';
import {
  gamma,
  theta,
  vega,
  rho,
  solveSpotFromDelta,
  solveParamBisection
} from '../../lib/blackScholes';

interface GreekCardProps {
  greekKey: 'delta' | 'gamma' | 'theta' | 'vega' | 'rho';
  greek: GreekMetadata;
  value: number;
  params: Params;
  onParamsChange: (p: Params) => void;
}

interface SliderConfig {
  range: (type: 'call' | 'put') => [number, number];
  step: number;
  adjustsLabel: string;
  solve: (target: number, params: Params) => number | null;
}

// params.T is stored in DAYS, but the Black-Scholes solvers expect T in YEARS.
// All callers below convert at the boundary; for the theta solver we work in
// years internally (search range 1/365..1 yr) and convert the result back to
// days before storing it on params.T.
const SLIDER_CONFIG: Record<string, SliderConfig> = {
  delta: {
    range: (type) => (type === 'call' ? [0.01, 0.99] : [-0.99, -0.01]),
    step: 0.01,
    adjustsLabel: 'adjusts S',
    solve: (target, p) => solveSpotFromDelta(target, p.K, p.T / 365, p.r, p.sigma, p.type)
  },
  gamma: {
    range: () => [0, 0.05],
    step: 0.0005,
    adjustsLabel: 'adjusts σ',
    solve: (target, p) =>
      solveParamBisection(target, 'sigma', gamma, { ...p, T: p.T / 365 }, [0.01, 2.0], 60)
  },
  theta: {
    range: () => [-2, -0.001],
    step: 0.001,
    adjustsLabel: 'adjusts T',
    solve: (target, p) => {
      const solvedYears = solveParamBisection(
        target,
        'T',
        theta,
        { ...p, T: p.T / 365 },
        [1 / 365, 1],
        60
      );
      return solvedYears === null ? null : solvedYears * 365;
    }
  },
  vega: {
    range: () => [0, 0.5],
    step: 0.005,
    adjustsLabel: 'adjusts σ',
    solve: (target, p) =>
      solveParamBisection(target, 'sigma', vega, { ...p, T: p.T / 365 }, [0.01, 2.0], 60)
  },
  rho: {
    range: (type) => (type === 'call' ? [0, 0.5] : [-0.5, 0]),
    step: 0.005,
    adjustsLabel: 'adjusts r',
    solve: (target, p) =>
      solveParamBisection(target, 'r', rho, { ...p, T: p.T / 365 }, [0, 0.15], 60)
  }
};

const PARAM_KEYS: Record<string, keyof Params> = {
  delta: 'S',
  gamma: 'sigma',
  theta: 'T',
  vega: 'sigma',
  rho: 'r'
};

export const GreekCard: React.FC<GreekCardProps> = ({
  greekKey,
  greek,
  value,
  params,
  onParamsChange
}) => {
  const [error, setError] = useState(false);
  const config = SLIDER_CONFIG[greekKey];
  const [min, max] = config.range(params.type);

  const clampedValue = Math.max(min, Math.min(max, value));

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const target = parseFloat(e.target.value);
    const solved = config.solve(target, params);
    if (solved === null) {
      setError(true);
      setTimeout(() => setError(false), 800);
      return;
    }
    const paramKey = PARAM_KEYS[greekKey];
    onParamsChange({ ...params, [paramKey]: solved });
  };

  const formatValue = (val: number): string => {
    if (Math.abs(val) < 0.0001) return '0.0000';
    if (Math.abs(val) < 0.01) return val.toFixed(6);
    return val.toFixed(4);
  };

  const valueColor = value === 0 ? 'text-slate-400' : value > 0 ? 'text-green-400' : 'text-red-400';

  return (
    <div className={`bg-slate-800 border rounded-lg p-4 flex-1 flex flex-col gap-2 transition-colors ${error ? 'border-orange-500' : 'border-slate-700'}`}>
      <div className="flex items-center gap-2">
        <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: greek.color }} />
        <span className="text-sm font-semibold text-slate-200">{greek.name}</span>
        <span className="text-xs text-slate-500">{greek.symbol}</span>
      </div>

      <div className={`text-2xl font-bold ${valueColor}`}>
        {value > 0 ? '+' : ''}{formatValue(value)}
      </div>

      <input
        type="range"
        min={min}
        max={max}
        step={config.step}
        value={clampedValue}
        onChange={handleSliderChange}
        className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-slate-700"
        style={{ accentColor: greek.color }}
      />

      <div className="flex justify-between items-center">
        <span className="text-xs text-slate-500">{greek.unit}</span>
        <span className="text-xs text-slate-600">{config.adjustsLabel}</span>
      </div>
    </div>
  );
};
