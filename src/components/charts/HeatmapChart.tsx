import React, { useEffect, useRef, useState } from 'react';
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
  onGreekSelect
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);

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

  // Get unique spot prices and days
  const spotPrices = Array.from(new Set(greekData.map((d) => d.spotPrice))).sort((a, b) => a - b);
  const days = Array.from(new Set(greekData.map((d) => d.days))).sort((a, b) => a - b);

  // Find min/max for color scaling
  const values = greekData.map((d) => d.value);
  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);
  const absMax = Math.max(Math.abs(minVal), Math.abs(maxVal));

  // Color function: diverging scale blue-white-red
  const getColor = (value: number): string => {
    const normalized = absMax === 0 ? 0 : value / absMax; // range [-1, 1]

    if (normalized > 0) {
      // Red scale for positive
      const intensity = Math.min(normalized, 1);
      const r = Math.round(239 + (16 - 239) * intensity);
      const g = Math.round(68 + (68 - 68) * intensity);
      const b = Math.round(68 + (68 - 68) * intensity);
      return `rgb(${r}, ${g}, ${b})`;
    } else {
      // Blue scale for negative
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

  return (
    <div className="flex-1 flex flex-col bg-slate-900 p-6 rounded-lg border border-slate-700 overflow-auto">
      <div className="mb-4">
        <h2 className="text-lg font-bold text-slate-100 mb-3">
          {greek.name} ({greek.symbol}) Heatmap
        </h2>

        <div className="flex gap-2 flex-wrap">
          {GREEK_KEYS.map((key) => {
            const meta = GREEK_META[key];
            return (
              <button
                key={key}
                onClick={() => onGreekSelect(key)}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  selectedGreek === key
                    ? 'text-white'
                    : 'text-slate-400 hover:text-slate-300'
                }`}
                style={{
                  backgroundColor: selectedGreek === key ? meta.color : 'transparent',
                  borderWidth: selectedGreek === key ? 0 : 1,
                  borderColor: selectedGreek === key ? 'transparent' : meta.color,
                  opacity: selectedGreek === key ? 1 : 0.6
                }}
              >
                {meta.symbol}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex-1 overflow-auto" ref={scrollRef}>
        <div className="inline-block">
          {/* Header row with spot prices */}
          <div className="flex">
            <div style={{ width: cellSize, height: cellSize }} />
            {spotPrices.map((spot) => (
              <div
                key={`header-${spot}`}
                style={{ width: cellSize, height: cellSize / 2 }}
                className="flex items-center justify-center text-xs text-slate-400 font-mono"
              >
                ${spot.toFixed(0)}
              </div>
            ))}
          </div>

          {/* Heatmap grid */}
          {days.map((day) => (
            <div key={`row-${day}`} className="flex">
              {/* Day label */}
              <div
                style={{ width: cellSize, height: cellSize }}
                className="flex items-center justify-center text-xs text-slate-400 font-mono border border-slate-700"
              >
                {Math.round(day)}d
              </div>

              {/* Cells */}
              {spotPrices.map((spot) => {
                const cell = greekData.find(
                  (d) => Math.abs(d.spotPrice - spot) < 0.1 && Math.abs(d.days - day) < 1
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
                      border: isCurrent ? '3px solid white' : '1px solid #334155'
                    }}
                    className="flex items-center justify-center text-xs font-mono relative group"
                    title={`S: $${spot.toFixed(2)}, T: ${day.toFixed(0)} days, Value: ${cellValue.toFixed(4)}`}
                  >
                    {isCurrent && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="text-white text-lg font-bold">+</div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 text-xs text-slate-400">
        Current: S = ${currentS.toFixed(2)}, T = {currentT.toFixed(0)} days
      </div>
    </div>
  );
};
