# Options Greeks Explorer

An interactive web application for exploring how options Greeks—the key sensitivities in options pricing—interact with each other and respond to market conditions.

## What This Is

This is a React-based visualization tool for options traders, quants, and anyone learning about options pricing. It lets you manipulate option parameters in real time and instantly see how all five Greeks (Delta, Gamma, Theta, Vega, and Rho) change. The app uses the Black-Scholes model to compute option values and Greeks, then presents them in seven different chart formats to help you understand their relationships.

## Features

**Seven Chart Types**
- **All Greeks**: Grid of all five Greeks as line charts, click any to zoom into Profile view
- **Profile**: Show how a single Greek responds as spot price changes, with optional P&L overlay
- **Multi**: Compare all Greeks on the same normalized chart
- **Heatmap**: 2D or **3D surface** of a Greek across spot price and time to expiry
- **Radar**: Sensitivity pentagon showing relative magnitude of all Greeks
- **Vol Surface**: Parametric implied-vol smile across strikes and expiries, with **3D surface toggle** and adjustable smile steepness (α)
- **Strategy**: Multi-leg position builder — add calls and puts at any strike/expiry, load presets (Straddle, Strangle, Bull Call Spread, Bear Put Spread, Butterfly, Iron Condor), view aggregate Greeks and a net P&L-at-expiry chart

**Responsive Layout**
Works on desktop, tablet, and mobile. On narrow screens the sidebar collapses — tap the hamburger menu in the top bar to open it as a drawer. The main content area scrolls vertically on mobile. The Greek card row, chart grid, and chart padding all adapt to available width.

**Time Decay Animation**
The **▶ Decay** button in the toolbar steps T down 1 day per frame (80 ms), animating all charts in real time as the option approaches expiry. Press **⏸ Pause** to stop.

**Scenario Comparison**
On the Profile and Multi tabs, **Pin baseline** locks in the current parameter set as a reference. Adjust any slider and compare the new Greek curves against the original — baseline shown as dashed lines. **Clear baseline** removes the overlay.

**P&L Overlay**
On the Profile tab, toggle **P&L overlay** to add a dashed amber line showing the option's theoretical profit and loss at expiry across all spot prices. Uses a secondary Y axis so the scales don't collide.

**Parameter Controls**
A full sidebar with sliders for:
- Spot price (S) and strike price (K)
- Days to expiry (T)
- Risk-free rate (r)
- Implied volatility (σ)
- Call/put toggle

Each parameter label has an **ⓘ info tooltip** with a plain-English explanation of what that parameter means and how it affects pricing.

**Moneyness Slider**
Quick control for in-the-money / at-the-money / out-of-the-money positioning. Shows a color-coded badge (ITM/ATM/OTM) that updates as you adjust.

**Greek Target Sliders**
Each Greek card has a slider directly beneath its live value. Drag it to a target and the app back-solves the appropriate parameter:
- Delta slider → solves for spot price (S)
- Gamma slider → solves for volatility (σ)
- Theta slider → solves for days to expiry (T)
- Vega slider → solves for volatility (σ)
- Rho slider → solves for interest rate (r)

Useful for questions like "what spot price gives me 0.5 delta?" or "what vol gives me 0.01 gamma?" The card border flashes orange if no solution exists in the valid parameter range.

**Black-Scholes Equation Panel**
The sidebar displays the live Black-Scholes formula (call or put, switching with the toggle) color-coded by Greek:
- <span style="color:#3B82F6">Blue</span> → **Delta** terms (`S·N(d₁)`)
- <span style="color:#EF4444">Red</span> → **Rho** terms (`r`, `e^{−rT}`)
- <span style="color:#F59E0B">Amber</span> → **Theta** terms (`T` throughout)
- <span style="color:#8B5CF6">Purple</span> → **Vega** terms (`σ` throughout)

The d₁ and d₂ expansions are shown as proper fractions with each input variable colored by its primary Greek attribution.

## The Math

The app computes Greeks using the Black-Scholes model with numerical methods for accuracy:
- **Delta**: Rate of change of option price w.r.t. spot price
- **Gamma**: Rate of change of delta w.r.t. spot price
- **Theta**: Rate of change of option price w.r.t. time (per day)
- **Vega**: Rate of change of option price w.r.t. volatility (per 1% move)
- **Rho**: Rate of change of option price w.r.t. interest rate (per 1% move)

The normal CDF uses Abramowitz & Stegun polynomial approximation for speed. Inverse solvers use closed-form solutions (delta) or bisection (other Greeks).

## Getting Started

```bash
# Install dependencies
npm install

# Start dev server
npm run dev
```

The app runs on `http://localhost:5173` by default.

## Build & Preview

```bash
# Type-check and build for production
npm run build

# Preview production build locally (Vite static server)
npm run preview
```

The production build splits the bundle into three cached chunks:

| Chunk | Gzipped | Changes when |
|---|---|---|
| `index` (app code) | ~16 kB | You push new features |
| `react-vendor` | ~53 kB | React version bumps |
| `recharts-vendor` | ~99 kB | Recharts version bumps |

Only the `index` chunk re-downloads on each deploy. The vendor chunks are cached indefinitely by the browser and Cloudflare's edge.

## Deployment

Deployed as a Cloudflare Worker with static assets. Every push to `main` triggers an automatic redeploy via the Cloudflare build pipeline.

To deploy manually:

```bash
npm run deploy
```

The `wrangler.jsonc` in the repo root configures the Worker name, compatibility date, and SPA routing (so direct URL navigation doesn't 404).

## Tech Stack

- **React 18** — UI framework
- **TypeScript** — Type-safe code
- **Recharts** — Interactive 2D charts
- **Canvas 2D API** — 3D surface rendering (Heatmap and Vol Surface); isometric projection, no WebGL required
- **Tailwind CSS** — Styling
- **Vite 8** — Build tool (rolldown bundler)
- **Wrangler** — Cloudflare deployment

## Project Structure

```
src/
  App.tsx                    # Main app, chart routing, time decay, scenario state
  lib/
    blackScholes.ts          # All pricing and Greek calculations
  hooks/
    useGreeks.ts             # Computes Greek values and series from params
  constants/
    greekMeta.ts             # Metadata (names, colors, descriptions)
  components/
    layout/
      AppShell.tsx           # Responsive layout (drawer on mobile, sidebar on desktop)
      SidebarControls.tsx    # Parameter sliders, moneyness badge, reset, info modal
      InfoModal.tsx          # About modal
    controls/
      ParamSlider.tsx        # Reusable labeled slider with tooltip support
      OptionTypeToggle.tsx   # Call/put toggle
      InfoTooltip.tsx        # Hover tooltip icon for parameter labels
    charts/
      SurfaceCanvas3D.tsx    # Canvas isometric 3D surface renderer (painter's algorithm)
      GreekGridChart.tsx     # All Greeks grid (click to zoom into Profile)
      GreekProfileChart.tsx  # Single-Greek line chart, P&L overlay, baseline
      MultiGreekChart.tsx    # All Greeks normalized and overlaid, baseline
      HeatmapChart.tsx       # 2D grid or canvas 3D surface
      SensitivityRadar.tsx   # Radar/pentagon chart
      VolSurfaceChart.tsx    # Parametric vol smile, 2D lines or canvas 3D surface
      StrategyBuilder.tsx    # Multi-leg strategy P&L builder
    panels/
      GreekCardRow.tsx       # Responsive row of Greek value cards
      GreekCard.tsx          # Individual card with live value and target slider
      BSEquation.tsx         # Color-coded Black-Scholes equation display
      ExplainerPanel.tsx     # Collapsible context description for current chart
```

## Tips

- Use the **All Greeks** grid to spot which Greeks are most sensitive at your current params
- Use the **Profile** chart to deeply understand one Greek's behavior
- Use **Multi** to see how Greeks trade off as spot price changes
- Use the **Heatmap** to explore time decay and volatility effects across the full (S, T) space
- Use the **Radar** to compare all Greeks at a glance
- Experiment with the moneyness slider and watch delta shift for calls vs puts
- Drag a Greek card's slider to reverse-engineer parameters from a target Greek value
- Hover the **ⓘ** icons next to any parameter for a plain-English explanation
- Switch between Call and Put to see how the Black-Scholes formula changes at the bottom of the sidebar
- Click the **Explanation** bar at the bottom of the chart area to expand or collapse the context description
- Use **▶ Decay** to animate time passing and watch all Greeks evolve toward expiry in real time
- On Profile or Multi, click **Pin baseline** before adjusting params to compare before/after curves side-by-side
- On Profile, enable **P&L overlay** to see the option's break-even profile alongside the Greek curve
- On Strategy, change strike/expiry inputs directly in the table, or load a preset and edit from there
- The 3D toggle on Heatmap and Vol Surface uses WebGL — drag to rotate, scroll to zoom
