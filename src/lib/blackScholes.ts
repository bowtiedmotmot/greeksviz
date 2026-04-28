// Normal CDF using Abramowitz & Stegun approximation 7.1.26 for erf
// erf(x) ≈ 1 - (a1·t + a2·t² + a3·t³ + a4·t⁴ + a5·t⁵)·exp(-x²),  t = 1/(1+p·x)
// Φ(x) = 0.5·(1 + erf(x/√2))
function normalCDF(x: number): number {
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;

  const sign = x < 0 ? -1 : 1;
  const ax = Math.abs(x) / Math.sqrt(2);

  const t = 1.0 / (1.0 + p * ax);
  // Horner's evaluation of (a1·t + a2·t² + a3·t³ + a4·t⁴ + a5·t⁵)
  const poly = ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t;
  const erf = 1.0 - poly * Math.exp(-ax * ax);

  return 0.5 * (1.0 + sign * erf);
}

// PDF of standard normal distribution
function normalPDF(x: number): number {
  return Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI);
}

// Inverse normal CDF (probit) — Peter J. Acklam's rational approximation.
// Relative error < 1.15e-9 across the full domain.
export function inverseNormalCDF(p: number): number {
  // Clamp to avoid infinities
  p = Math.max(1e-10, Math.min(1 - 1e-10, p));

  // Coefficients for the central region (|p - 0.5| <= 0.47575)
  const a1 = -3.969683028665376e+1;
  const a2 = 2.209460984245205e+2;
  const a3 = -2.759285104469687e+2;
  const a4 = 1.383577518672690e+2;
  const a5 = -3.066479806614716e+1;
  const a6 = 2.506628277459239e+0;

  const b1 = -5.447609879822406e+1;
  const b2 = 1.615858368580409e+2;
  const b3 = -1.556989798598866e+2;
  const b4 = 6.680131188771972e+1;
  const b5 = -1.328068155288572e+1;

  // Coefficients for the tails
  const c1 = -7.784894002430293e-3;
  const c2 = -3.223964580411365e-1;
  const c3 = -2.400758277161838e+0;
  const c4 = -2.549732539343734e+0;
  const c5 = 4.374664141464968e+0;
  const c6 = 2.938163982698783e+0;

  const d1 = 7.784695709041462e-3;
  const d2 = 3.224671290700398e-1;
  const d3 = 2.445134137142996e+0;
  const d4 = 3.754408661907416e+0;

  const pLow = 0.02425;
  const pHigh = 1 - pLow;

  if (p < pLow) {
    // Lower tail
    const q = Math.sqrt(-2.0 * Math.log(p));
    return (((((c1 * q + c2) * q + c3) * q + c4) * q + c5) * q + c6) /
           ((((d1 * q + d2) * q + d3) * q + d4) * q + 1.0);
  } else if (p <= pHigh) {
    // Central region
    const q = p - 0.5;
    const r = q * q;
    return (((((a1 * r + a2) * r + a3) * r + a4) * r + a5) * r + a6) * q /
           (((((b1 * r + b2) * r + b3) * r + b4) * r + b5) * r + 1.0);
  } else {
    // Upper tail
    const q = Math.sqrt(-2.0 * Math.log(1.0 - p));
    return -(((((c1 * q + c2) * q + c3) * q + c4) * q + c5) * q + c6) /
            ((((d1 * q + d2) * q + d3) * q + d4) * q + 1.0);
  }
}

// Solve for spot price given target delta
export function solveSpotFromDelta(
  targetDelta: number,
  K: number,
  T: number,
  r: number,
  sigma: number,
  type: 'call' | 'put'
): number {
  // Clamp targetDelta to valid range
  let d1: number;
  if (type === 'call') {
    targetDelta = Math.max(0.01, Math.min(0.99, targetDelta));
    d1 = inverseNormalCDF(targetDelta);
  } else {
    targetDelta = Math.max(-0.99, Math.min(-0.01, targetDelta));
    d1 = inverseNormalCDF(targetDelta + 1);
  }

  // From d1 = (ln(S/K) + (r + 0.5*sigma^2)*T) / (sigma*sqrt(T))
  // Solve for S: S = K * exp(d1 * sigma * sqrt(T) - (r + 0.5*sigma^2)*T)
  const sqrtT = Math.sqrt(T);
  const exponent = d1 * sigma * sqrtT - (r + 0.5 * sigma * sigma) * T;
  const S = K * Math.exp(exponent);

  // Clamp result to reasonable range
  return Math.max(1, Math.min(9999, S));
}

// Bisection solver for other Greeks
export function solveParamBisection(
  targetValue: number,
  paramToSolve: 'S' | 'T' | 'sigma' | 'r',
  greekFn: (S: number, K: number, T: number, r: number, sigma: number, type: 'call' | 'put') => number,
  fixed: { S: number; K: number; T: number; r: number; sigma: number; type: 'call' | 'put' },
  searchRange: [number, number],
  iterations: number = 60
): number | null {
  let [low, high] = searchRange;

  // Test bounds
  const fLow = greekFn(
    paramToSolve === 'S' ? low : fixed.S,
    fixed.K,
    paramToSolve === 'T' ? low : fixed.T,
    paramToSolve === 'r' ? low : fixed.r,
    paramToSolve === 'sigma' ? low : fixed.sigma,
    fixed.type
  );

  const fHigh = greekFn(
    paramToSolve === 'S' ? high : fixed.S,
    fixed.K,
    paramToSolve === 'T' ? high : fixed.T,
    paramToSolve === 'r' ? high : fixed.r,
    paramToSolve === 'sigma' ? high : fixed.sigma,
    fixed.type
  );

  // Check if target is in range
  if ((fLow - targetValue) * (fHigh - targetValue) > 0) {
    return null; // No solution in range
  }

  // Bisection
  for (let i = 0; i < iterations; i++) {
    const mid = (low + high) / 2;
    const fMid = greekFn(
      paramToSolve === 'S' ? mid : fixed.S,
      fixed.K,
      paramToSolve === 'T' ? mid : fixed.T,
      paramToSolve === 'r' ? mid : fixed.r,
      paramToSolve === 'sigma' ? mid : fixed.sigma,
      fixed.type
    );

    if (Math.abs(fMid - targetValue) < 1e-8) {
      return mid;
    }

    if ((fMid - targetValue) * (fLow - targetValue) < 0) {
      high = mid;
    } else {
      low = mid;
    }
  }

  return (low + high) / 2;
}

// Black-Scholes price
export function blackScholesPrice(
  S: number,
  K: number,
  T: number,
  r: number,
  sigma: number,
  type: 'call' | 'put'
): number {
  // Guard against edge cases
  if (T <= 0) {
    if (type === 'call') {
      return Math.max(S - K, 0);
    } else {
      return Math.max(K - S, 0);
    }
  }

  if (sigma <= 0) {
    const discountedStrike = K * Math.exp(-r * T);
    if (type === 'call') {
      return Math.max(S - discountedStrike, 0);
    } else {
      return Math.max(discountedStrike - S, 0);
    }
  }

  const d1 = (Math.log(S / K) + (r + 0.5 * sigma * sigma) * T) / (sigma * Math.sqrt(T));
  const d2 = d1 - sigma * Math.sqrt(T);

  const nd1 = normalCDF(d1);
  const nd2 = normalCDF(d2);
  const nnd1 = normalCDF(-d1);
  const nnd2 = normalCDF(-d2);

  const discountFactor = Math.exp(-r * T);

  if (type === 'call') {
    return S * nd1 - K * discountFactor * nd2;
  } else {
    return K * discountFactor * nnd2 - S * nnd1;
  }
}

// Delta: rate of change of option price with respect to spot price
export function delta(
  S: number,
  K: number,
  T: number,
  r: number,
  sigma: number,
  type: 'call' | 'put'
): number {
  if (T <= 0) {
    if (type === 'call') {
      return S > K ? 1 : 0;
    } else {
      return S < K ? -1 : 0;
    }
  }

  if (sigma <= 0) {
    if (type === 'call') {
      return S > K ? 1 : 0;
    } else {
      return S < K ? -1 : 0;
    }
  }

  const d1 = (Math.log(S / K) + (r + 0.5 * sigma * sigma) * T) / (sigma * Math.sqrt(T));

  if (type === 'call') {
    return normalCDF(d1);
  } else {
    return normalCDF(d1) - 1;
  }
}

// Gamma: rate of change of delta with respect to spot price
export function gamma(S: number, K: number, T: number, r: number, sigma: number): number {
  if (T <= 0 || sigma <= 0 || S <= 0) {
    return 0;
  }

  const d1 = (Math.log(S / K) + (r + 0.5 * sigma * sigma) * T) / (sigma * Math.sqrt(T));

  return normalPDF(d1) / (S * sigma * Math.sqrt(T));
}

// Theta: rate of change of option price with respect to time (per day)
export function theta(
  S: number,
  K: number,
  T: number,
  r: number,
  sigma: number,
  type: 'call' | 'put'
): number {
  if (T <= 0) {
    return 0;
  }

  if (sigma <= 0) {
    if (type === 'call') {
      return -r * K * Math.exp(-r * T) / 365;
    } else {
      return r * K * Math.exp(-r * T) / 365;
    }
  }

  const d1 = (Math.log(S / K) + (r + 0.5 * sigma * sigma) * T) / (sigma * Math.sqrt(T));
  const d2 = d1 - sigma * Math.sqrt(T);

  const sqrtT = Math.sqrt(T);
  const nd1PDF = normalPDF(d1);
  const nd2 = normalCDF(d2);
  const nnd2 = normalCDF(-d2);
  const discountFactor = Math.exp(-r * T);

  let theta_val: number;

  if (type === 'call') {
    const term1 = (-S * nd1PDF * sigma) / (2 * sqrtT);
    const term2 = -r * K * discountFactor * nd2;
    theta_val = term1 + term2;
  } else {
    const term1 = (-S * nd1PDF * sigma) / (2 * sqrtT);
    const term2 = r * K * discountFactor * nnd2;
    theta_val = term1 + term2;
  }

  // Return per day (divide by 365)
  return theta_val / 365;
}

// Vega: rate of change of option price with respect to volatility (per 1% change)
export function vega(S: number, K: number, T: number, r: number, sigma: number): number {
  if (T <= 0 || sigma <= 0 || S <= 0) {
    return 0;
  }

  const d1 = (Math.log(S / K) + (r + 0.5 * sigma * sigma) * T) / (sigma * Math.sqrt(T));

  // Return per 1% vol move (divide by 100)
  return S * normalPDF(d1) * Math.sqrt(T) / 100;
}

// Rho: rate of change of option price with respect to risk-free rate (per 1% change)
export function rho(
  S: number,
  K: number,
  T: number,
  r: number,
  sigma: number,
  type: 'call' | 'put'
): number {
  if (T <= 0 || sigma <= 0) {
    if (type === 'call') {
      return K * T * Math.exp(-r * T) / 100;
    } else {
      return -K * T * Math.exp(-r * T) / 100;
    }
  }

  const d2 = (Math.log(S / K) + (r - 0.5 * sigma * sigma) * T) / (sigma * Math.sqrt(T));

  const discountFactor = Math.exp(-r * T);
  const nd2 = normalCDF(d2);
  const nnd2 = normalCDF(-d2);

  if (type === 'call') {
    return K * T * discountFactor * nd2 / 100;
  } else {
    return -K * T * discountFactor * nnd2 / 100;
  }
}

export interface GreekPoint {
  x: number;
  y: number;
}

// Compute a series of greek values over a range of a parameter
export function computeGreekSeries(
  greekFn: (S: number, K: number, T: number, r: number, sigma: number, type?: string) => number,
  param: 'S' | 'T' | 'sigma' | 'r',
  range: [number, number],
  steps: number,
  fixed: {
    S: number;
    K: number;
    T: number;
    r: number;
    sigma: number;
    type: 'call' | 'put';
  }
): GreekPoint[] {
  const series: GreekPoint[] = [];
  const [min, max] = range;

  for (let i = 0; i < steps; i++) {
    const t = steps > 1 ? i / (steps - 1) : 0;
    const value = min + t * (max - min);

    let S = fixed.S;
    let K = fixed.K;
    let T = fixed.T;
    let r = fixed.r;
    let sigma = fixed.sigma;

    if (param === 'S') S = value;
    if (param === 'T') T = Math.max(value, 0.001);
    if (param === 'sigma') sigma = Math.max(value, 0.001);
    if (param === 'r') r = Math.max(value, 0);

    const result = greekFn(S, K, T, r, sigma, fixed.type);

    // Guard against NaN and Infinity
    const y = isFinite(result) ? result : 0;

    series.push({ x: value, y });
  }

  return series;
}
