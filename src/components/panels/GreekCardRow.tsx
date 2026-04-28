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
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 md:gap-3 px-3 py-3 md:px-6 md:py-4 bg-slate-900 border-b border-slate-700">
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
