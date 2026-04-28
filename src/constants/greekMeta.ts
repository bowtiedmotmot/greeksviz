export interface GreekMetadata {
  name: string;
  symbol: string;
  color: string;
  description: string;
  unit: string;
}

export const GREEK_META: Record<string, GreekMetadata> = {
  delta: {
    name: 'Delta',
    symbol: 'Δ',
    color: '#3B82F6',
    description: 'The rate of change of option price with respect to the underlying asset price.',
    unit: 'per $1 move'
  },
  gamma: {
    name: 'Gamma',
    symbol: 'Γ',
    color: '#10B981',
    description: 'The rate of change of delta as the underlying asset price changes; measures the convexity of option payoff.',
    unit: 'per $1 move'
  },
  theta: {
    name: 'Theta',
    symbol: 'Θ',
    color: '#F59E0B',
    description: 'The rate of change of option price with respect to time; measures time decay.',
    unit: 'per day'
  },
  vega: {
    name: 'Vega',
    symbol: 'ν',
    color: '#8B5CF6',
    description: 'The rate of change of option price with respect to volatility; measures sensitivity to IV changes.',
    unit: 'per 1% vol'
  },
  rho: {
    name: 'Rho',
    symbol: 'ρ',
    color: '#EF4444',
    description: 'The rate of change of option price with respect to interest rates.',
    unit: 'per 1% rate'
  }
};

export const GREEK_KEYS = Object.keys(GREEK_META) as Array<keyof typeof GREEK_META>;
