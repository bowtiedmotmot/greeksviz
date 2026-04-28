---
name: Black-Scholes implementation locations
description: Pointer to the files holding the BS math and every call site that must convert T from days to years.
type: reference
---

- Pure BS math: `src/lib/blackScholes.ts` — normalCDF (A&S 7.1.26), normalPDF, inverseNormalCDF (Acklam), blackScholesPrice, delta, gamma, theta (per day), vega (per 1% vol), rho (per 1% rate), solveSpotFromDelta, solveParamBisection, computeGreekSeries.
- Call sites that must convert `params.T / 365` before invoking BS:
  - `src/hooks/useGreeks.ts`
  - `src/components/panels/GreekCard.tsx` (SLIDER_CONFIG)
  - `src/components/panels/GreekInverterPanel.tsx` (handleGreekTargetChange)
- UI surfaces showing T in days: `src/components/layout/SidebarControls.tsx`, `src/components/charts/HeatmapChart.tsx`, `src/components/panels/ExplainerPanel.tsx`.
