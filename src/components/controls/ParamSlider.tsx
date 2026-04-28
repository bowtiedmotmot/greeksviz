import React from 'react';
import { InfoTooltip } from './InfoTooltip';

interface ParamSliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
  format?: (value: number) => string;
  tooltip?: string;
}

export const ParamSlider: React.FC<ParamSliderProps> = ({
  label,
  value,
  min,
  max,
  step,
  onChange,
  format = (v) => v.toString(),
  tooltip
}) => {
  return (
    <div className="mb-3">
      <div className="flex justify-between items-baseline mb-2">
        <label className="text-sm font-medium text-slate-300 flex items-center">
          {label}
          {tooltip && <InfoTooltip text={tooltip} />}
        </label>
        <span className="text-sm font-mono bg-slate-800 px-2 py-1 rounded text-slate-100">
          {format(value)}
        </span>
      </div>
      <div className="flex gap-2 items-center">
        <span className="text-xs text-slate-500">{format(min)}</span>
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="flex-1 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
        />
        <span className="text-xs text-slate-500">{format(max)}</span>
      </div>
    </div>
  );
};
