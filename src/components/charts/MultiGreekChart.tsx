import React, { useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { GREEK_META, GREEK_KEYS } from '../../constants/greekMeta';
import { GreekSeries } from '../../hooks/useGreeks';

interface MultiGreekChartProps {
  data: GreekSeries;
}

export const MultiGreekChart: React.FC<MultiGreekChartProps> = ({ data }) => {
  const [visibleGreeks, setVisibleGreeks] = useState<Set<string>>(new Set(GREEK_KEYS));

  // Normalize Greek values by max absolute value in range
  const normalizeData = () => {
    const maxValues: { [key: string]: number } = {};

    GREEK_KEYS.forEach((key) => {
      const series = data[key as keyof GreekSeries];
      const maxAbs = Math.max(...series.map((p) => Math.abs(p.y)));
      maxValues[key] = maxAbs || 1;
    });

    const baseData = data.delta;
    return baseData.map((point, idx) => {
      const result: any = { x: point.x };

      GREEK_KEYS.forEach((key) => {
        const series = data[key as keyof GreekSeries];
        const normalized = series[idx].y / maxValues[key];
        result[key] = normalized;
      });

      return result;
    });
  };

  const chartData = normalizeData();

  const handleLegendClick = (e: any) => {
    const greek = e.dataKey;
    const newVisible = new Set(visibleGreeks);
    if (newVisible.has(greek)) {
      newVisible.delete(greek);
    } else {
      newVisible.add(greek);
    }
    setVisibleGreeks(newVisible);
  };

  return (
    <div className="flex-1 flex flex-col bg-slate-900 p-6 rounded-lg border border-slate-700">
      <h2 className="text-lg font-bold text-slate-100 mb-4">All Greeks (Normalized)</h2>

      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
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
            label={{ value: 'Normalized Value', angle: -90, position: 'insideLeft' }}
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
          <Legend onClick={handleLegendClick} wrapperStyle={{ cursor: 'pointer' }} />

          {visibleGreeks.has('delta') && (
            <Line
              type="monotone"
              dataKey="delta"
              stroke={GREEK_META.delta.color}
              dot={false}
              strokeWidth={2}
              isAnimationActive={false}
              name={`${GREEK_META.delta.symbol} Delta`}
            />
          )}
          {visibleGreeks.has('gamma') && (
            <Line
              type="monotone"
              dataKey="gamma"
              stroke={GREEK_META.gamma.color}
              dot={false}
              strokeWidth={2}
              isAnimationActive={false}
              name={`${GREEK_META.gamma.symbol} Gamma`}
            />
          )}
          {visibleGreeks.has('theta') && (
            <Line
              type="monotone"
              dataKey="theta"
              stroke={GREEK_META.theta.color}
              dot={false}
              strokeWidth={2}
              isAnimationActive={false}
              name={`${GREEK_META.theta.symbol} Theta`}
            />
          )}
          {visibleGreeks.has('vega') && (
            <Line
              type="monotone"
              dataKey="vega"
              stroke={GREEK_META.vega.color}
              dot={false}
              strokeWidth={2}
              isAnimationActive={false}
              name={`${GREEK_META.vega.symbol} Vega`}
            />
          )}
          {visibleGreeks.has('rho') && (
            <Line
              type="monotone"
              dataKey="rho"
              stroke={GREEK_META.rho.color}
              dot={false}
              strokeWidth={2}
              isAnimationActive={false}
              name={`${GREEK_META.rho.symbol} Rho`}
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
