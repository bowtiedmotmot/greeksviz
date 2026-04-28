import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip
} from 'recharts';
import { GREEK_META, GREEK_KEYS } from '../../constants/greekMeta';
import { GreekSeries } from '../../hooks/useGreeks';

interface GreekGridChartProps {
  data: GreekSeries;
  currentS: number;
  onGreekSelect: (greek: string) => void;
}

export const GreekGridChart: React.FC<GreekGridChartProps> = ({ data, currentS, onGreekSelect }) => {
  return (
    <div className="flex-1 flex flex-col bg-slate-900 p-4 rounded-lg border border-slate-700 overflow-auto min-h-[520px] md:min-h-0">
      <h2 className="text-lg font-bold text-slate-100 mb-4">All Greek Profiles</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 flex-1" style={{ gridAutoRows: '1fr' }}>
        {GREEK_KEYS.map((key) => {
          const greek = GREEK_META[key];
          const seriesData = data[key as keyof GreekSeries];
          return (
            <div
              key={key}
              className="bg-slate-800 rounded-lg border border-slate-700 p-3 flex flex-col cursor-pointer hover:border-slate-500 transition-colors"
              style={{ minHeight: 180 }}
              onClick={() => onGreekSelect(key)}
              title={`Click to open ${greek.name} profile`}
            >
              <div className="text-sm font-semibold mb-2" style={{ color: greek.color }}>
                {greek.symbol} {greek.name}
                <span className="text-slate-500 text-xs font-normal ml-2">{greek.unit}</span>
              </div>
              <div className="flex-1">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={seriesData} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis
                      dataKey="x"
                      type="number"
                      domain={['dataMin', 'dataMax']}
                      tickCount={4}
                      tickFormatter={(v) => `$${Number(v).toFixed(0)}`}
                      stroke="#475569"
                      tick={{ fontSize: 10, fill: '#64748b' }}
                    />
                    <YAxis
                      stroke="#475569"
                      tick={{ fontSize: 10, fill: '#64748b' }}
                      width={40}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1e293b',
                        border: '1px solid #475569',
                        borderRadius: '6px',
                        fontSize: 11
                      }}
                      labelStyle={{ color: '#e2e8f0' }}
                      labelFormatter={(v) => `Spot Price: $${Number(v).toFixed(2)}`}
                      formatter={(v: number) => [v.toFixed(4), greek.name]}
                    />
                    <ReferenceLine
                      x={currentS}
                      stroke={greek.color}
                      strokeDasharray="4 4"
                      strokeOpacity={0.7}
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
            </div>
          );
        })}
      </div>
    </div>
  );
};
