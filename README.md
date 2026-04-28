# Options Greeks Explorer

An interactive web application for exploring how options Greeks—the key sensitivities in options pricing—interact with each other and respond to market conditions.

## What This Is

This is a React-based visualization tool for options traders, quants, and anyone learning about options pricing. It lets you manipulate option parameters in real time and instantly see how all five Greeks (Delta, Gamma, Theta, Vega, and Rho) change. The app uses the Black-Scholes model to compute option values and Greeks, then presents them in five different chart formats to help you understand their relationships.

## Features

**Five Chart Types**
- **All Greeks**: Grid of all five Greeks as line charts, click any to zoom into Profile view
- **Profile**: Show how a single Greek responds as spot price changes
- **Multi**: Compare all Greeks on the same chart
- **Heatmap**: 2D surface of a Greek across spot price and time to expiry
- **Radar**: Sensitivity pentagon showing relative magnitude of all Greeks

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

# Preview production build locally
npm run preview
```

## Deployment

Hosted on Cloudflare Pages. Every push to `main` triggers an automatic redeploy.

To deploy manually:

```bash
npm install -g wrangler
npm run build
wrangler pages deploy dist --project-name options-greek-viz
```

## Tech Stack

- **React 18** - UI framework
- **TypeScript** - Type-safe code
- **Recharts** - Interactive charts
- **Tailwind CSS** - Styling
- **Vite 8** - Fast build tool

## Project Structure

```
src/
  App.tsx                    # Main app, chart type routing
  lib/
    blackScholes.ts          # All pricing and Greek calculations
  hooks/
    useGreeks.ts             # State management for option params
  constants/
    greekMeta.ts             # Metadata (names, colors, descriptions)
  components/
    layout/
      AppShell.tsx           # Two-column layout
      SidebarControls.tsx    # Parameter sliders and Greek inverter
    controls/
      ParamSlider.tsx        # Reusable labeled slider with tooltip support
      OptionTypeToggle.tsx   # Call/put toggle
      InfoTooltip.tsx        # Hover tooltip icon for parameter labels
    charts/
      GreekGridChart.tsx     # All Greeks grid (click to zoom)
      GreekProfileChart.tsx  # Single-Greek line chart
      MultiGreekChart.tsx    # All Greeks overlaid
      HeatmapChart.tsx       # 2D surface chart
      SensitivityRadar.tsx   # Radar/pentagon chart
    panels/
      GreekCardRow.tsx       # Greek value summary cards
      GreekCard.tsx          # Individual card with live value + target slider
      BSEquation.tsx         # Color-coded Black-Scholes equation display
      ExplainerPanel.tsx     # Context for current view (collapsible)
```

## Tips

- Use the **All Greeks** grid to spot which Greeks are most sensitive at your current params
- Use the **Profile** chart to deeply understand one Greek's behavior
- Use **Multi** to see how Greeks trade off as you move spot price
- Use the **Heatmap** to explore time decay and volatility effects
- Use the **Radar** to compare all Greeks at a glance
- Experiment with the moneyness slider and watch delta shift for calls vs puts
- Drag a Greek card's slider to reverse-engineer parameters from a target Greek value
- Hover the **ⓘ** icons next to any parameter for a plain-English explanation
- Switch between Call and Put to see how the Black-Scholes formula changes at the bottom of the sidebar
- Click the **Explanation** bar at the bottom of the chart area to collapse or expand the context description
