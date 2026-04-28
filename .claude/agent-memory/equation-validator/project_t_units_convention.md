---
name: T units convention (days vs years)
description: The UI stores T in days but Black-Scholes math needs years; conversion happens at every call site, not inside the BS lib.
type: project
---

`Params.T` is stored in DAYS (slider range 1..365 in `SidebarControls.tsx`, default `T: 90` in `App.tsx`).
The pure Black-Scholes functions in `src/lib/blackScholes.ts` (delta/gamma/theta/vega/rho/blackScholesPrice/solveSpotFromDelta/solveParamBisection) all expect T in **years**.

**Why:** This split keeps the BS library a pure mathematical primitive (year-based, matching textbook formulas) while letting the UI think in human-friendly days. Theta is divided by 365 inside `theta()` to express per-day decay, on the assumption the caller already passed T in years — same 365-day calendar-day convention is used everywhere.

**How to apply:**
- Any new call site that passes `params.T` to a BS function MUST convert with `params.T / 365`.
- Any solver returning T (e.g., `solveParamBisection` with `paramToSolve: 'T'`) returns years and must be multiplied by 365 before storing on `params.T`.
- Existing converted call sites: `useGreeks.ts` (`Tyears = params.T / 365`), `HeatmapChart` data path in `useGreeks.ts` (`T = days / 365`), `GreekCard.tsx` (all SLIDER_CONFIG entries), `GreekInverterPanel.tsx` (`paramsYears` local).
- This was the root cause of every Greek being off by a factor related to 365 in the main UI prior to the 2026-04-27 fix; verify any new BS call site against the same checklist.
