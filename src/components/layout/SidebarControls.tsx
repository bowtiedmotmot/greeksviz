import React from 'react';
import { ParamSlider } from '../controls/ParamSlider';
import { OptionTypeToggle } from '../controls/OptionTypeToggle';
import { InfoTooltip } from '../controls/InfoTooltip';
import { BSEquation } from '../panels/BSEquation';
import { Params } from '../../hooks/useGreeks';

interface SidebarControlsProps {
  params: Params;
  onParamsChange: (newParams: Params) => void;
}

const DEFAULT_PARAMS: Params = {
  S: 100,
  K: 100,
  T: 90,
  r: 0.05,
  sigma: 0.25,
  type: 'call'
};

export const SidebarControls: React.FC<SidebarControlsProps> = ({ params, onParamsChange }) => {
  const updateParam = <K extends keyof Params>(key: K, value: Params[K]) => {
    onParamsChange({ ...params, [key]: value });
  };

  const handleReset = () => {
    onParamsChange(DEFAULT_PARAMS);
  };

  const moneyness = ((params.S - params.K) / params.K) * 100;

  const getMoneynessBadge = () => {
    if (moneyness > 5) return { label: 'ITM', color: 'bg-green-600' };
    if (moneyness < -5) return { label: 'OTM', color: 'bg-red-600' };
    return { label: 'ATM', color: 'bg-yellow-600' };
  };

  const badge = getMoneynessBadge();

  const handleMoneynessChange = (newMoneyness: number) => {
    const newS = params.K * (1 + newMoneyness / 100);
    updateParam('S', newS);
  };

  return (
    <div className="w-80 bg-slate-900 border-r border-slate-700 p-5 flex flex-col h-screen overflow-hidden">
      <h1 className="text-xl font-bold text-slate-100 mb-3">Options Greeks Explorer</h1>

      <div className="mb-3">
        <div className="flex justify-between items-baseline mb-2">
          <label className="text-sm font-medium text-slate-300 flex items-center">
            Moneyness (%)
            <InfoTooltip text="How far the spot price is from the strike price, as a percentage. ITM (in-the-money) means the option has intrinsic value; OTM (out-of-the-money) means it doesn't; ATM is near the strike." />
          </label>
          <span className={`${badge.color} text-white px-2 py-0.5 rounded font-medium text-xs`}>
            {badge.label}
          </span>
        </div>
        <div className="flex gap-2 items-center">
          <span className="text-xs text-slate-500">-40%</span>
          <input
            type="range"
            min={-40}
            max={40}
            step={0.1}
            value={moneyness}
            onChange={(e) => handleMoneynessChange(parseFloat(e.target.value))}
            className="flex-1 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
          />
          <span className="text-xs text-slate-500">+40%</span>
        </div>
        <div className="text-sm font-mono bg-slate-800 px-2 py-1 rounded text-slate-100 mt-2">
          {moneyness > 0 ? '+' : ''}{moneyness.toFixed(1)}%
        </div>
      </div>

      <ParamSlider
        label="Spot Price (S)"
        value={params.S}
        min={50}
        max={200}
        step={0.5}
        onChange={(value) => updateParam('S', value)}
        format={(v) => `$${v.toFixed(2)}`}
        tooltip="The current market price of the underlying asset. This is what the option is written on."
      />

      <ParamSlider
        label="Strike Price (K)"
        value={params.K}
        min={50}
        max={200}
        step={0.5}
        onChange={(value) => updateParam('K', value)}
        format={(v) => `$${v.toFixed(2)}`}
        tooltip="The price at which the option holder can buy (call) or sell (put) the underlying asset upon exercise."
      />

      <ParamSlider
        label="Days to Expiry (T)"
        value={params.T}
        min={1}
        max={365}
        step={1}
        onChange={(value) => updateParam('T', value)}
        format={(v) => `${Math.round(v)} days`}
        tooltip="Calendar days until the option expires. More time gives the underlying more room to move, increasing option value (all else equal)."
      />

      <ParamSlider
        label="Risk-Free Rate (r)"
        value={params.r}
        min={0}
        max={0.1}
        step={0.001}
        onChange={(value) => updateParam('r', value)}
        format={(v) => `${(v * 100).toFixed(2)}%`}
        tooltip="The annualized risk-free interest rate, typically approximated by short-term Treasury bill yields. Used to discount the option's expected payoff."
      />

      <ParamSlider
        label="Volatility (σ)"
        value={params.sigma}
        min={0.01}
        max={1.0}
        step={0.01}
        onChange={(value) => updateParam('sigma', value)}
        format={(v) => `${(v * 100).toFixed(1)}%`}
        tooltip="Annualized volatility of the underlying asset — how much the price is expected to fluctuate. Higher volatility increases option value for both calls and puts."
      />

      <OptionTypeToggle
        value={params.type}
        onChange={(type) => updateParam('type', type)}
      />

      <div className="mt-auto flex flex-col gap-3">
        <BSEquation optionType={params.type} />
        <button
          onClick={handleReset}
          className="w-full bg-slate-700 hover:bg-slate-600 text-slate-100 font-medium py-2 px-4 rounded transition-colors"
        >
          Reset
        </button>
      </div>
    </div>
  );
};
