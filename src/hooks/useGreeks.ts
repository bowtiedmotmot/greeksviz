import { useMemo } from 'react';
import {
  delta,
  gamma,
  theta,
  vega,
  rho,
  blackScholesPrice,
  computeGreekSeries,
  GreekPoint
} from '../lib/blackScholes';

export interface Params {
  S: number;
  K: number;
  T: number;
  r: number;
  sigma: number;
  type: 'call' | 'put';
}

export interface GreekValues {
  delta: number;
  gamma: number;
  theta: number;
  vega: number;
  rho: number;
  price: number;
}

export interface GreekSeries {
  delta: GreekPoint[];
  gamma: GreekPoint[];
  theta: GreekPoint[];
  vega: GreekPoint[];
  rho: GreekPoint[];
}

export function useGreeks(params: Params) {
  // params.T is stored in DAYS for the UI. The Black-Scholes formulas in
  // src/lib/blackScholes.ts require T in YEARS, so we convert here at every
  // call site. (Day-count convention: 365 calendar days/year, matching the
  // /365 used inside theta() to produce per-day theta.)
  const Tyears = params.T / 365;

  // Calculate current Greek values
  const greekValues = useMemo<GreekValues>(() => {
    return {
      delta: delta(params.S, params.K, Tyears, params.r, params.sigma, params.type),
      gamma: gamma(params.S, params.K, Tyears, params.r, params.sigma),
      theta: theta(params.S, params.K, Tyears, params.r, params.sigma, params.type),
      vega: vega(params.S, params.K, Tyears, params.r, params.sigma),
      rho: rho(params.S, params.K, Tyears, params.r, params.sigma, params.type),
      price: blackScholesPrice(params.S, params.K, Tyears, params.r, params.sigma, params.type)
    };
  }, [params, Tyears]);

  // Greek profiles over spot price range
  const greekProfileSeries = useMemo<GreekSeries>(() => {
    const spotMin = params.K * 0.5;
    const spotMax = params.K * 1.5;
    const steps = 100;

    // computeGreekSeries reads T from `fixed.T` and passes it straight to the
    // Black-Scholes function, so we must hand it T in years.
    const fixedYears = { ...params, T: Tyears };

    return {
      delta: computeGreekSeries(
        (S, K, T, r, sigma, type) => delta(S, K, T, r, sigma, type as 'call' | 'put'),
        'S',
        [spotMin, spotMax],
        steps,
        fixedYears
      ),
      gamma: computeGreekSeries(
        (S, K, T, r, sigma) => gamma(S, K, T, r, sigma),
        'S',
        [spotMin, spotMax],
        steps,
        fixedYears
      ),
      theta: computeGreekSeries(
        (S, K, T, r, sigma, type) => theta(S, K, T, r, sigma, type as 'call' | 'put'),
        'S',
        [spotMin, spotMax],
        steps,
        fixedYears
      ),
      vega: computeGreekSeries(
        (S, K, T, r, sigma) => vega(S, K, T, r, sigma),
        'S',
        [spotMin, spotMax],
        steps,
        fixedYears
      ),
      rho: computeGreekSeries(
        (S, K, T, r, sigma, type) => rho(S, K, T, r, sigma, type as 'call' | 'put'),
        'S',
        [spotMin, spotMax],
        steps,
        fixedYears
      )
    };
  }, [params, Tyears]);

  // Heatmap data: spot price (X) vs time (Y)
  const heatmapData = useMemo<{
    [greek: string]: Array<{ spotPrice: number; days: number; value: number }>;
  }>(() => {
    const spotSteps = 20;
    const timeSteps = 10;
    const spotMin = params.K * 0.6;
    const spotMax = params.K * 1.4;
    const timeMin = 1;
    const timeMax = 365;

    const result: { [greek: string]: Array<{ spotPrice: number; days: number; value: number }> } = {
      delta: [],
      gamma: [],
      theta: [],
      vega: [],
      rho: []
    };

    for (let i = 0; i < spotSteps; i++) {
      const spotT = spotSteps > 1 ? i / (spotSteps - 1) : 0;
      const spotPrice = spotMin + spotT * (spotMax - spotMin);

      for (let j = 0; j < timeSteps; j++) {
        const timeT = timeSteps > 1 ? j / (timeSteps - 1) : 0;
        const days = timeMin + timeT * (timeMax - timeMin);
        const T = days / 365;

        const deltaVal = delta(spotPrice, params.K, T, params.r, params.sigma, params.type);
        const gammaVal = gamma(spotPrice, params.K, T, params.r, params.sigma);
        const thetaVal = theta(spotPrice, params.K, T, params.r, params.sigma, params.type);
        const vegaVal = vega(spotPrice, params.K, T, params.r, params.sigma);
        const rhoVal = rho(spotPrice, params.K, T, params.r, params.sigma, params.type);

        result.delta.push({ spotPrice, days, value: isFinite(deltaVal) ? deltaVal : 0 });
        result.gamma.push({ spotPrice, days, value: isFinite(gammaVal) ? gammaVal : 0 });
        result.theta.push({ spotPrice, days, value: isFinite(thetaVal) ? thetaVal : 0 });
        result.vega.push({ spotPrice, days, value: isFinite(vegaVal) ? vegaVal : 0 });
        result.rho.push({ spotPrice, days, value: isFinite(rhoVal) ? rhoVal : 0 });
      }
    }

    return result;
  }, [params]);

  return {
    greekValues,
    greekProfileSeries,
    heatmapData
  };
}
