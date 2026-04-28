import React, { useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from 'recharts';
import { GREEK_META, GREEK_KEYS } from '../../constants/greekMeta';
import { GreekSeries } from '../../hooks/useGreeks';
import { Params } from '../../hooks/useGreeks';
import { blackScholesPrice } from '../../lib/blackScholes';

interface GreekProfileChartProps {
  data: GreekSeries;
  currentS: number;
  selectedGreek: string;
  onGreekSelect: (greek: string) => void;
  params: Params;
  baselineData?: GreekSeries;
}

export const GreekProfileChart: React.FC<GreekProfileChartProps> = ({
  data,
  currentS,
  selectedGreek,
  onGreekSelect,
  params,
  baselineData,
}) => {
  const [showPayoff, setShowPayoff] = useState(false);

  const greek = GREEK_META[selectedGreek as keyof typeof GREEK_META];
  const seriesData = data[selectedGreek as keyof GreekSeries];
  const baselineSeries = baselineData?.[selectedGreek as keyof GreekSeries];

  const premium = showPayoff
    ? blackScholesPrice(params.S, params.K, params.T / 365, params.r, params.sigma, params.type)
    : 0;

  const chartData = seriesData.map((pt, i) => ({
    x: pt.x,
    y: pt.y,
    baseline: baselineSeries?.[i]?.y,
    payoff: showPayoff
      ? (params.type === 'call'
          ? Math.max(pt.x - params.K, 0) - premium
          : Math.max(params.K - pt.x, 0) - premium)
      : undefined,
  }));

  return (
    <div className="flex-1 flex flex-col bg-slate-900 p-4 md:p-6 rounded-lg border border-slate-700 min-h-[350px] md:min-h-0">
      <div className="mb-4">
        <div className="flex items-center justify-between gap-2 flex-wrap mb-3">
          <h2 className="text-lg font-bold text-slate-100">
            {greek.name} ({greek.symbol}) Profile
          </h2>
          <div className="flex gap-2">
            {baselineData && (
              <span className="text-xs text-slate-400 self-center flex items-center gap-1">
                <span className="inline-block w-6 border-t-2 border-dashed" style={{ borderColor: greek.color, opacity: 0.5 }} />
                baseline
              </span>
            )}
            <button
              onClick={() => setShowPayoff(v => !v)}
              className={`px-2 py-1 rounded text-xs font-medium transition-colors border ${
                showPayoff
                  ? 'bg-amber-600 text-white border-amber-600'
                  : 'text-slate-400 border-slate-600 hover:text-slate-200 hover:border-slate-400'
              }`}
            >
              P&L overlay
            </button>
          </div>
        </div>

        <div className="flex gap-2 flex-wrap">
          {GREEK_KEYS.map((key) => {
            const meta = GREEK_META[key];
            return (
              <button
                key={key}
                onClick={() => onGreekSelect(key)}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  selectedGreek === key ? 'text-white' : 'text-slate-400 hover:text-slate-300'
                }`}
                style={{
                  backgroundColor: selectedGreek === key ? meta.color : 'transparent',
                  borderWidth: 1,
                  borderColor: selectedGreek === key ? 'transparent' : meta.color,
                  opacity: selectedGreek === key ? 1 : 0.6,
                }}
              >
                {meta.symbol}
              </button>
            );
          })}
        </div>
      </div>

      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 5, right: showPayoff ? 60 : 30, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis
            dataKey="x"
            type="number"
            domain={['dataMin', 'dataMax']}
            tickCount={6}
            tickFormatter={(v) => `$${Number(v).toFixed(0)}`}
            label={{ value: 'Spot Price', position: 'insideBottomRight', offset: -5 }}
            stroke="#94a3b8"
          />
          <YAxis
            yAxisId="greek"
            label={{ value: greek.unit, angle: -90, position: 'insideLeft' }}
            stroke="#94a3b8"
          />
          {showPayoff && (
            <YAxis
              yAxisId="payoff"
              orientation="right"
              stroke="#F59E0B"
              tickFormatter={(v) => `$${Number(v).toFixed(1)}`}
              label={{ value: 'P&L ($)', angle: 90, position: 'insideRight', fill: '#F59E0B', fontSize: 11 }}
            />
          )}
          <Tooltip
            contentStyle={{
              backgroundColor: '#1e293b',
              border: '1px solid #475569',
              borderRadius: '8px',
            }}
            labelStyle={{ color: '#e2e8f0' }}
            labelFormatter={(v) => `Spot Price: $${Number(v).toFixed(2)}`}
            formatter={(v: number, name: string) => {
              if (name === 'payoff') return [`$${v.toFixed(2)}`, 'P&L at expiry'];
              if (name === 'baseline') return [v.toFixed(4), `Baseline ${greek.name}`];
              return [v.toFixed(4), greek.name];
            }}
          />
          <ReferenceLine
            yAxisId="greek"
            x={currentS}
            stroke={greek.color}
            strokeDasharray="5 5"
            label={{ value: 'Spot Price', position: 'top', fill: greek.color, fontSize: 12 }}
          />
          {baselineData && (
            <Line
              yAxisId="greek"
              type="monotone"
              dataKey="baseline"
              stroke={greek.color}
              strokeOpacity={0.4}
              strokeDasharray="6 3"
              dot={false}
              strokeWidth={1.5}
              isAnimationActive={false}
              name="baseline"
            />
          )}
          <Line
            yAxisId="greek"
            type="monotone"
            dataKey="y"
            stroke={greek.color}
            dot={false}
            strokeWidth={2}
            isAnimationActive={false}
            name={selectedGreek}
          />
          {showPayoff && (
            <Line
              yAxisId="payoff"
              type="monotone"
              dataKey="payoff"
              stroke="#F59E0B"
              strokeDasharray="5 5"
              dot={false}
              strokeWidth={1.5}
              isAnimationActive={false}
              name="payoff"
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
