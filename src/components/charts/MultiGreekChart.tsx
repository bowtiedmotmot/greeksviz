import React, { useState, useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { GREEK_META, GREEK_KEYS } from '../../constants/greekMeta';
import { GreekSeries } from '../../hooks/useGreeks';

interface MultiGreekChartProps {
  data: GreekSeries;
  baselineData?: GreekSeries;
}

export const MultiGreekChart: React.FC<MultiGreekChartProps> = ({ data, baselineData }) => {
  const [visibleGreeks, setVisibleGreeks] = useState<Set<string>>(new Set(GREEK_KEYS));

  const maxValues = useMemo(() => {
    const result: Record<string, number> = {};
    GREEK_KEYS.forEach(key => {
      const maxAbs = Math.max(...data[key as keyof GreekSeries].map(p => Math.abs(p.y)));
      result[key] = maxAbs || 1;
    });
    return result;
  }, [data]);

  const chartData = useMemo(() => {
    return data.delta.map((point, idx) => {
      const row: Record<string, number | undefined> = { x: point.x };
      GREEK_KEYS.forEach(key => {
        row[key] = data[key as keyof GreekSeries][idx].y / maxValues[key];
        if (baselineData) {
          row[`${key}_bl`] = baselineData[key as keyof GreekSeries][idx]?.y / maxValues[key];
        }
      });
      return row;
    });
  }, [data, baselineData, maxValues]);

  const handleLegendClick = (e: any) => {
    const key = e.dataKey as string;
    if (key.endsWith('_bl')) return;
    const next = new Set(visibleGreeks);
    next.has(key) ? next.delete(key) : next.add(key);
    setVisibleGreeks(next);
  };

  return (
    <div className="flex-1 flex flex-col bg-slate-900 p-4 md:p-6 rounded-lg border border-slate-700 min-h-[350px] md:min-h-0">
      <div className="flex items-center justify-between mb-4 gap-2 flex-wrap">
        <h2 className="text-lg font-bold text-slate-100">All Greeks (Normalized)</h2>
        {baselineData && (
          <span className="text-xs text-slate-400 flex items-center gap-1">
            <span className="inline-block w-6 border-t-2 border-dashed border-slate-400 opacity-50" />
            dashed = baseline
          </span>
        )}
      </div>

      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
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
            label={{ value: 'Normalized', angle: -90, position: 'insideLeft' }}
            stroke="#94a3b8"
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1e293b',
              border: '1px solid #475569',
              borderRadius: '8px',
            }}
            labelStyle={{ color: '#e2e8f0' }}
            labelFormatter={(v) => `Spot Price: $${Number(v).toFixed(2)}`}
            formatter={(v: number, name: string) => {
              const baseKey = String(name).replace('_bl', '');
              const label = GREEK_META[baseKey]
                ? `${GREEK_META[baseKey].name}${name.toString().endsWith('_bl') ? ' (baseline)' : ''}`
                : name;
              return [v.toFixed(4), label];
            }}
          />
          <Legend
            onClick={handleLegendClick}
            wrapperStyle={{ cursor: 'pointer' }}
            formatter={(name) => {
              const base = String(name).replace('_bl', '');
              return GREEK_META[base]
                ? `${GREEK_META[base].symbol} ${GREEK_META[base].name}${String(name).endsWith('_bl') ? ' (baseline)' : ''}`
                : name;
            }}
          />
          {GREEK_KEYS.filter(key => visibleGreeks.has(key)).map(key => {
            const meta = GREEK_META[key];
            return (
              <React.Fragment key={key}>
                {baselineData && (
                  <Line
                    type="monotone"
                    dataKey={`${key}_bl`}
                    stroke={meta.color}
                    strokeOpacity={0.35}
                    strokeDasharray="6 3"
                    dot={false}
                    strokeWidth={1.5}
                    isAnimationActive={false}
                    legendType="none"
                    name={`${key}_bl`}
                  />
                )}
                <Line
                  type="monotone"
                  dataKey={key}
                  stroke={meta.color}
                  dot={false}
                  strokeWidth={2}
                  isAnimationActive={false}
                  name={key}
                />
              </React.Fragment>
            );
          })}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
