import React, { useState } from 'react';
import { Params, GreekValues } from '../../hooks/useGreeks';
import { GREEK_META } from '../../constants/greekMeta';
import {
  gamma,
  theta,
  vega,
  rho,
  solveSpotFromDelta,
  solveParamBisection
} from '../../lib/blackScholes';

interface GreekInverterPanelProps {
  params: Params;
  greekValues: GreekValues;
  onParamsChange: (p: Params) => void;
}

interface GreekInverterRow {
  key: 'delta' | 'gamma' | 'theta' | 'vega' | 'rho';
  paramToSolve: 'S' | 'T' | 'sigma' | 'r';
  range: [number, number];
  label: string;
}

const getInverterRows = (optionType: 'call' | 'put'): GreekInverterRow[] => [
  {
    key: 'delta',
    paramToSolve: 'S',
    range: optionType === 'call' ? [0.01, 0.99] : [-0.99, -0.01],
    label: '(adjusts S)'
  },
  { key: 'gamma', paramToSolve: 'sigma', range: [0, 0.05], label: '(adjusts σ)' },
  { key: 'theta', paramToSolve: 'T', range: [-2, -0.001], label: '(adjusts T)' },
  { key: 'vega', paramToSolve: 'sigma', range: [0, 0.5], label: '(adjusts σ)' },
  {
    key: 'rho',
    paramToSolve: 'r',
    range: optionType === 'call' ? [0, 0.5] : [-0.5, 0],
    label: '(adjusts r)'
  }
];

export const GreekInverterPanel: React.FC<GreekInverterPanelProps> = ({
  params,
  greekValues,
  onParamsChange
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [erroredGreek, setErroredGreek] = useState<string | null>(null);

  const handleGreekTargetChange = (greekKey: string, targetValue: number) => {
    const rows = getInverterRows(params.type);
    const row = rows.find((r) => r.key === greekKey);
    if (!row) return;

    let newParams = params;
    let solved: number | null = null;

    // params.T is stored in DAYS for the UI; the Black-Scholes solvers expect
    // T in YEARS, so we always pass `paramsYears` into the solver and convert
    // the result back to days when the solver returns a T value.
    const paramsYears = { ...params, T: params.T / 365 };

    if (greekKey === 'delta') {
      // Use closed-form solution for delta
      solved = solveSpotFromDelta(targetValue, params.K, paramsYears.T, params.r, params.sigma, params.type);
      if (solved !== null) {
        newParams = { ...params, S: solved };
      }
    } else if (greekKey === 'gamma' || greekKey === 'vega') {
      // Both gamma and vega adjust sigma - use bisection
      let greekFn: (S: number, K: number, T: number, r: number, sigma: number, type?: 'call' | 'put') => number;
      if (greekKey === 'gamma') {
        greekFn = gamma;
      } else {
        greekFn = vega;
      }
      solved = solveParamBisection(targetValue, row.paramToSolve, greekFn, paramsYears, [0.01, 2.0], 60);
      if (solved !== null) {
        newParams = { ...params, sigma: solved };
      }
    } else if (greekKey === 'theta') {
      // Theta adjusts time. Solve in years (1 day .. 1 year), then convert
      // the solved T back to days for storage on params.T.
      solved = solveParamBisection(targetValue, row.paramToSolve, theta, paramsYears, [1 / 365, 1], 60);
      if (solved !== null) {
        newParams = { ...params, T: solved * 365 };
      }
    } else if (greekKey === 'rho') {
      // Rho adjusts interest rate
      const searchRange: [number, number] = [0, 0.15];
      solved = solveParamBisection(targetValue, row.paramToSolve, rho, paramsYears, searchRange, 60);
      if (solved !== null) {
        newParams = { ...params, r: solved };
      }
    }

    if (solved === null) {
      setErroredGreek(greekKey);
      setTimeout(() => setErroredGreek(null), 1000);
    } else {
      setErroredGreek(null);
      onParamsChange(newParams);
    }
  };

  const getGreekSliderRange = (greekKey: string): [number, number] => {
    const rows = getInverterRows(params.type);
    const row = rows.find((r) => r.key === greekKey);
    if (!row) return [0, 1];
    return row.range;
  };

  const getGreekValue = (greekKey: string): number => {
    return greekValues[greekKey as keyof GreekValues];
  };

  return (
    <div className="mt-6 pt-6 border-t border-slate-700">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 text-slate-300 hover:text-slate-100 transition-colors"
      >
        <span className="font-medium text-sm">Drive by Greek</span>
        <svg
          className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
      </button>

      {isExpanded && (
        <div className="mt-4 space-y-4">
          {getInverterRows(params.type).map((row) => {
            const meta = GREEK_META[row.key];
            const currentValue = getGreekValue(row.key);
            const [min, max] = getGreekSliderRange(row.key);
            const isError = erroredGreek === row.key;

            return (
              <div
                key={row.key}
                className={`p-3 rounded-lg transition-colors ${
                  isError ? 'bg-orange-900 bg-opacity-40' : 'bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: meta.color }}
                  />
                  <span className="text-xs font-medium text-slate-300">{meta.name}</span>
                  <span className="text-xs text-slate-500">{row.label}</span>
                </div>
                <div className="flex gap-2 items-center">
                  <span className="text-xs text-slate-500">{min.toFixed(2)}</span>
                  <input
                    type="range"
                    min={min}
                    max={max}
                    step={(max - min) / 100}
                    value={currentValue}
                    onChange={(e) => handleGreekTargetChange(row.key, parseFloat(e.target.value))}
                    className="flex-1 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                  />
                  <span className="text-xs text-slate-500">{max.toFixed(2)}</span>
                </div>
                <div className="text-xs font-mono text-slate-400 mt-1">
                  {currentValue.toFixed(4)}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
