import React, { useState } from 'react';
import { Params } from '../../hooks/useGreeks';

interface ExplainerPanelProps {
  chartType: string;
  selectedGreek: string;
  params: Params;
}

export const ExplainerPanel: React.FC<ExplainerPanelProps> = ({
  chartType,
  selectedGreek,
  params
}) => {
  const [open, setOpen] = useState(true);
  const getExplanation = (): string => {
    // Profile chart explanations
    if (chartType === 'profile') {
      if (selectedGreek === 'delta') {
        return 'Delta shows how much the option price changes for each $1 move in the underlying. For calls, delta ranges from 0 to 1; for puts, from -1 to 0. Near-the-money options have deltas close to 0.5 or -0.5.';
      }
      if (selectedGreek === 'gamma') {
        if (params.T < 7) {
          return 'With less than a week to expiration, Gamma spikes dramatically for near-the-money options — the option becomes nearly binary. This extreme sensitivity to spot price changes is the defining characteristic of short-dated options.';
        }
        return 'Gamma is the derivative of delta — it measures how fast delta changes. The peak gamma occurs at-the-money where delta is most sensitive to spot moves. Gamma is always positive, whether you hold a call or put.';
      }
      if (selectedGreek === 'theta') {
        return 'Theta measures time decay — how much value the option loses each day as expiration approaches. Call holders lose theta (negative), while put holders benefit from theta decay on puts selling for less than intrinsic value. Theta accelerates as expiration nears.';
      }
      if (selectedGreek === 'vega') {
        return 'Vega measures sensitivity to changes in implied volatility. It peaks at-the-money and is highest for options with intermediate time to expiry. Both calls and puts have positive vega — they gain value when volatility increases.';
      }
      if (selectedGreek === 'rho') {
        return 'Rho measures sensitivity to changes in interest rates. For calls, rho is positive (higher rates increase call value). For puts, rho is negative (higher rates decrease put value). Rho is most significant for long-dated options.';
      }
    }

    // Multi chart explanations
    if (chartType === 'multi') {
      if (selectedGreek === 'delta') {
        return 'Comparing all Greeks over spot price: Notice how Delta (blue) is the smoothest curve, ranging from 0 to 1. Gamma (green) peaks at-the-money where delta changes most rapidly. Theta appears flat because it\'s normalized to match the scale of other Greeks.';
      }
      return 'The multi-Greek chart overlays all five Greeks normalized to fit in the same space. This reveals the interdependencies: Gamma is the derivative of Delta, Theta accelerates near expiry, and each Greek tells part of the story of how option prices behave.';
    }

    // Heatmap explanations
    if (chartType === 'heatmap') {
      if (selectedGreek === 'theta') {
        return 'The accelerating color gradient toward the bottom (near expiry) shows how Theta decay is non-linear — options lose value fastest in their final days. This is why short-dated options require precise timing and timing risk management.';
      }
      if (selectedGreek === 'gamma') {
        return 'The heatmap shows how Gamma intensity varies across both spot price and time. The brightest colors (near-the-money, short time) reveal where the option is most "binary" — where small spot moves create large payoff swings.';
      }
      return `The heatmap shows ${selectedGreek} across all combinations of spot price (horizontal) and days to expiry (vertical). The brightest colors indicate highest sensitivity. The crosshair marks your current position.`;
    }

    // Radar explanations
    if (chartType === 'radar') {
      return 'The radar chart shows all five Greeks on a normalized scale [0, 1], comparing the call and put at your current parameters. Notice how some Greeks diverge between calls and puts (delta, rho) while others remain the same (gamma, vega). This reveals the mathematical structure of option pricing.';
    }

    return 'Adjust the parameters on the left to explore how each Greek changes. Click the chart tabs to switch between different visualization modes. Each Greek measures a different sensitivity — together, they capture all the ways option values move.';
  };

  return (
    <div className="bg-slate-900 border-t border-slate-700">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-6 py-2 text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
      >
        <span className="font-medium uppercase tracking-wide">Explanation</span>
        <svg
          className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none" stroke="currentColor" strokeWidth={2}
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="px-6 pb-4 text-sm text-slate-300 max-h-32 overflow-y-auto">
          <p>{getExplanation()}</p>
        </div>
      )}
    </div>
  );
};
