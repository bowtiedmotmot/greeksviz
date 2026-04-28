import React from 'react';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
  ResponsiveContainer,
  Tooltip
} from 'recharts';
import { GREEK_META } from '../../constants/greekMeta';
import { GreekValues } from '../../hooks/useGreeks';

interface SensitivityRadarProps {
  greekValues: GreekValues;
  optionType: 'call' | 'put';
}

export const SensitivityRadar: React.FC<SensitivityRadarProps> = ({ greekValues, optionType }) => {
  // Normalize Greeks to [0, 1] scale using reasonable maximums
  const normalize = (value: number, max: number): number => {
    const normalized = Math.abs(value) / max;
    return Math.min(normalized, 1);
  };

  // Reasonable maximums for normalization
  const maxDelta = 1;
  const maxGamma = 0.1;
  const maxTheta = 0.02;
  const maxVega = 0.5;
  const maxRho = 0.2;

  const radarData = [
    {
      name: `${GREEK_META.delta.symbol} Delta`,
      call: normalize(greekValues.delta, maxDelta),
      put: normalize(Math.abs(greekValues.delta), maxDelta)
    },
    {
      name: `${GREEK_META.gamma.symbol} Gamma`,
      call: normalize(greekValues.gamma, maxGamma),
      put: normalize(greekValues.gamma, maxGamma)
    },
    {
      name: `${GREEK_META.theta.symbol} Theta`,
      call: normalize(Math.abs(greekValues.theta), maxTheta),
      put: normalize(Math.abs(greekValues.theta), maxTheta)
    },
    {
      name: `${GREEK_META.vega.symbol} Vega`,
      call: normalize(greekValues.vega, maxVega),
      put: normalize(greekValues.vega, maxVega)
    },
    {
      name: `${GREEK_META.rho.symbol} Rho`,
      call: normalize(greekValues.rho, maxRho),
      put: normalize(Math.abs(greekValues.rho), maxRho)
    }
  ];

  return (
    <div className="flex-1 flex flex-col bg-slate-900 p-6 rounded-lg border border-slate-700">
      <h2 className="text-lg font-bold text-slate-100 mb-4">Greeks Sensitivity Radar</h2>

      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={radarData} margin={{ top: 10, right: 30, bottom: 20, left: 30 }}>
          <PolarGrid stroke="#475569" />
          <PolarAngleAxis
            dataKey="name"
            tick={{ fontSize: 12, fill: '#cbd5e1' }}
          />
          <PolarRadiusAxis
            angle={90}
            domain={[0, 1]}
            tick={{ fontSize: 12, fill: '#94a3b8' }}
          />
          <Radar
            name={`${optionType.toUpperCase()} (Normalized)`}
            dataKey={optionType}
            stroke={optionType === 'call' ? '#3B82F6' : '#EF4444'}
            fill={optionType === 'call' ? '#3B82F6' : '#EF4444'}
            fillOpacity={0.25}
            isAnimationActive={false}
          />
          <Legend />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1e293b',
              border: '1px solid #475569',
              borderRadius: '8px'
            }}
            labelStyle={{ color: '#e2e8f0' }}
            formatter={(value) => (typeof value === 'number' ? value.toFixed(3) : value)}
          />
        </RadarChart>
      </ResponsiveContainer>

      <div className="mt-4 text-xs text-slate-400 text-center">
        All values normalized to [0, 1] relative to reasonable maximums for visualization
      </div>
    </div>
  );
};
