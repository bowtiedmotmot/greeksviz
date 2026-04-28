import React from 'react';
import { GreekCard } from './GreekCard';
import { GREEK_META } from '../../constants/greekMeta';
import { GreekValues, Params } from '../../hooks/useGreeks';

interface GreekCardRowProps {
  greekValues: GreekValues;
  params: Params;
  onParamsChange: (p: Params) => void;
}

export const GreekCardRow: React.FC<GreekCardRowProps> = ({ greekValues, params, onParamsChange }) => {
  return (
    <div className="flex gap-4 px-6 py-4 bg-slate-900 border-b border-slate-700">
      {(['delta', 'gamma', 'theta', 'vega', 'rho'] as const).map((key) => (
        <GreekCard
          key={key}
          greekKey={key}
          greek={GREEK_META[key]}
          value={greekValues[key]}
          params={params}
          onParamsChange={onParamsChange}
        />
      ))}
    </div>
  );
};
