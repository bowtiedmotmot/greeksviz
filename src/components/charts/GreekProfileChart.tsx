import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer
} from 'recharts';
import { GREEK_META, GREEK_KEYS } from '../../constants/greekMeta';
import { GreekSeries } from '../../hooks/useGreeks';

interface GreekProfileChartProps {
  data: GreekSeries;
  currentS: number;
  selectedGreek: string;
  onGreekSelect: (greek: string) => void;
}

export const GreekProfileChart: React.FC<GreekProfileChartProps> = ({
  data,
  currentS,
  selectedGreek,
  onGreekSelect
}) => {
  const greek = GREEK_META[selectedGreek as keyof typeof GREEK_META];
  const seriesData = data[selectedGreek as keyof GreekSeries];

  return (
    <div className="flex-1 flex flex-col bg-slate-900 p-6 rounded-lg border border-slate-700">
      <div className="mb-4">
        <h2 className="text-lg font-bold text-slate-100 mb-3">
          {greek.name} ({greek.symbol}) Profile
        </h2>

        <div className="flex gap-2 flex-wrap">
          {GREEK_KEYS.map((key) => {
            const meta = GREEK_META[key];
            return (
              <button
                key={key}
                onClick={() => onGreekSelect(key)}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  selectedGreek === key
                    ? 'text-white'
                    : 'text-slate-400 hover:text-slate-300'
                }`}
                style={{
                  backgroundColor: selectedGreek === key ? meta.color : 'transparent',
                  borderWidth: selectedGreek === key ? 0 : 1,
                  borderColor: selectedGreek === key ? 'transparent' : meta.color,
                  opacity: selectedGreek === key ? 1 : 0.6
                }}
              >
                {meta.symbol}
              </button>
            );
          })}
        </div>
      </div>

      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={seriesData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis
            dataKey="x"
            type="number"
            domain={['dataMin', 'dataMax']}
            tickCount={6}
            tickFormatter={(v) => `$${Number(v).toFixed(0)}`}
            label={{ value: 'Spot Price ($)', position: 'insideBottomRight', offset: -5 }}
            stroke="#94a3b8"
          />
          <YAxis
            label={{ value: greek.unit, angle: -90, position: 'insideLeft' }}
            stroke="#94a3b8"
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1e293b',
              border: '1px solid #475569',
              borderRadius: '8px'
            }}
            labelStyle={{ color: '#e2e8f0' }}
          />
          <ReferenceLine
            x={currentS}
            stroke={greek.color}
            strokeDasharray="5 5"
            label={{ value: 'Current S', position: 'top', fill: greek.color, fontSize: 12 }}
          />
          <Line
            type="monotone"
            dataKey="y"
            stroke={greek.color}
            dot={false}
            strokeWidth={2}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
