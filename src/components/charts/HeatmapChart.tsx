import React, { useEffect, useRef, useState } from 'react';
import { SurfaceCanvas3D } from './SurfaceCanvas3D';
import { GREEK_META, GREEK_KEYS } from '../../constants/greekMeta';

interface HeatmapData {
  [greek: string]: Array<{ spotPrice: number; days: number; value: number }>;
}

interface HeatmapChartProps {
  data: HeatmapData;
  currentS: number;
  currentT: number;
  selectedGreek: string;
  onGreekSelect: (greek: string) => void;
}

export const HeatmapChart: React.FC<HeatmapChartProps> = ({
  data,
  currentS,
  currentT,
  selectedGreek,
  onGreekSelect,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [view3D, setView3D] = useState(false);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const obs = new ResizeObserver(([entry]) => setContainerWidth(entry.contentRect.width));
    obs.observe(el);
    setContainerWidth(el.getBoundingClientRect().width);
    return () => obs.disconnect();
  }, []);

  const greekData = data[selectedGreek];
  const greek = GREEK_META[selectedGreek as keyof typeof GREEK_META];

  const spotPrices = Array.from(new Set(greekData.map(d => d.spotPrice))).sort((a, b) => a - b);
  const days = Array.from(new Set(greekData.map(d => d.days))).sort((a, b) => a - b);

  const values = greekData.map(d => d.value);
  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);
  const absMax = Math.max(Math.abs(minVal), Math.abs(maxVal));

  const getColor = (value: number): string => {
    const normalized = absMax === 0 ? 0 : value / absMax;
    if (normalized > 0) {
      const intensity = Math.min(normalized, 1);
      const r = Math.round(239 + (16 - 239) * intensity);
      return `rgb(${r}, 68, 68)`;
    } else {
      const intensity = Math.min(-normalized, 1);
      const r = Math.round(59 + (255 - 59) * intensity);
      const g = Math.round(130 + (255 - 130) * intensity);
      const b = Math.round(246 + (255 - 246) * intensity);
      return `rgb(${r}, ${g}, ${b})`;
    }
  };

  const cellSize = containerWidth > 0
    ? Math.min(Math.floor((containerWidth - 60) / spotPrices.length), 80)
    : 40;

  // 3D surface data
  const z3D = days.map(day =>
    spotPrices.map(spot => {
      const cell = greekData.find(
        d => Math.abs(d.spotPrice - spot) < 0.1 && Math.abs(d.days - day) < 1
      );
      return cell?.value ?? 0;
    })
  );

  return (
    <div className="flex-1 flex flex-col bg-slate-900 p-4 md:p-6 rounded-lg border border-slate-700 min-h-[400px] md:min-h-0 overflow-auto">
      <div className="mb-4">
        <div className="flex items-center justify-between gap-2 flex-wrap mb-3">
          <h2 className="text-lg font-bold text-slate-100">
            {greek.name} ({greek.symbol}) Heatmap
          </h2>
          <button
            onClick={() => setView3D(v => !v)}
            className={`px-3 py-1 rounded text-sm font-medium transition-colors border ${
              view3D
                ? 'bg-blue-600 text-white border-blue-600'
                : 'text-slate-400 border-slate-600 hover:text-slate-200 hover:border-slate-400'
            }`}
          >
            {view3D ? '2D' : '3D'}
          </button>
        </div>

        <div className="flex gap-2 flex-wrap">
          {GREEK_KEYS.map(key => {
            const meta = GREEK_META[key];
            return (
              <button
                key={key}
                onClick={() => onGreekSelect(key)}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  selectedGreek === key ? 'text-white' : 'text-slate-400 hover:text-slate-300'
                }`}
                style={{
                  backgroundColor: selectedGreek === key ? meta.color : 'transparent',
                  borderWidth: 1,
                  borderColor: selectedGreek === key ? 'transparent' : meta.color,
                  opacity: selectedGreek === key ? 1 : 0.6,
                }}
              >
                {meta.symbol}
              </button>
            );
          })}
        </div>
      </div>

      {view3D ? (
        <SurfaceCanvas3D
          xs={spotPrices}
          ys={days.map(d => Math.round(d))}
          zs={z3D}
          xLabel="Spot Price"
          yLabel="Days"
          zLabel={greek.name}
          colorMode="diverging"
          height={450}
          currentX={currentS}
          currentY={currentT}
        />
      ) : (
        <div className="flex-1 overflow-auto" ref={scrollRef}>
          <div className="inline-block">
            <div className="flex">
              <div style={{ width: cellSize, height: cellSize / 2 }} />
              {spotPrices.map(spot => (
                <div
                  key={`h-${spot}`}
                  style={{ width: cellSize, height: cellSize / 2 }}
                  className="flex items-center justify-center text-xs text-slate-400 font-mono"
                >
                  ${spot.toFixed(0)}
                </div>
              ))}
            </div>

            {days.map(day => (
              <div key={`row-${day}`} className="flex">
                <div
                  style={{ width: cellSize, height: cellSize }}
                  className="flex items-center justify-center text-xs text-slate-400 font-mono border border-slate-700"
                >
                  {Math.round(day)}d
                </div>
                {spotPrices.map(spot => {
                  const cell = greekData.find(
                    d => Math.abs(d.spotPrice - spot) < 0.1 && Math.abs(d.days - day) < 1
                  );
                  const cellValue = cell?.value ?? 0;
                  const isCurrent =
                    Math.abs(spot - currentS) < spotPrices[1] - spotPrices[0] &&
                    Math.abs(day - currentT) < 15;

                  return (
                    <div
                      key={`cell-${spot}-${day}`}
                      style={{
                        width: cellSize,
                        height: cellSize,
                        backgroundColor: getColor(cellValue),
                        border: isCurrent ? '3px solid white' : '1px solid #334155',
                      }}
                      className="flex items-center justify-center relative"
                      title={`Spot: $${spot.toFixed(2)}, Days: ${day.toFixed(0)}, ${greek.name}: ${cellValue.toFixed(4)}`}
                    >
                      {isCurrent && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <span className="text-white text-lg font-bold leading-none">+</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-3 text-xs text-slate-400">
        Current: Spot = ${currentS.toFixed(2)}, T = {currentT.toFixed(0)} days
      </div>
    </div>
  );
};
