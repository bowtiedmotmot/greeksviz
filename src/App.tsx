import { useEffect, useState } from 'react';
import { AppShell } from './components/layout/AppShell';
import { SidebarControls } from './components/layout/SidebarControls';
import { GreekCardRow } from './components/panels/GreekCardRow';
import { GreekProfileChart } from './components/charts/GreekProfileChart';
import { GreekGridChart } from './components/charts/GreekGridChart';
import { MultiGreekChart } from './components/charts/MultiGreekChart';
import { HeatmapChart } from './components/charts/HeatmapChart';
import { SensitivityRadar } from './components/charts/SensitivityRadar';
import { VolSurfaceChart } from './components/charts/VolSurfaceChart';
import { StrategyBuilder } from './components/charts/StrategyBuilder';
import { ExplainerPanel } from './components/panels/ExplainerPanel';
import { useGreeks, Params } from './hooks/useGreeks';

type ChartType = 'profile' | 'grid' | 'multi' | 'heatmap' | 'radar' | 'volsurface' | 'strategy';

const TABS: { key: ChartType; label: string }[] = [
  { key: 'grid', label: 'All Greeks' },
  { key: 'profile', label: 'Profile' },
  { key: 'multi', label: 'Multi' },
  { key: 'heatmap', label: 'Heatmap' },
  { key: 'radar', label: 'Radar' },
  { key: 'volsurface', label: 'Vol Surface' },
  { key: 'strategy', label: 'Strategy' },
];

function App() {
  const [params, setParams] = useState<Params>({
    S: 100, K: 100, T: 90, r: 0.05, sigma: 0.25, type: 'call',
  });
  const [chartType, setChartType] = useState<ChartType>('profile');
  const [selectedGreek, setSelectedGreek] = useState('delta');
  const [baselineParams, setBaselineParams] = useState<Params | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const { greekValues, greekProfileSeries, heatmapData } = useGreeks(params);
  const { greekProfileSeries: baselineSeries } = useGreeks(baselineParams ?? params);

  // Time-decay animation: step T down 1 day per 80ms
  useEffect(() => {
    if (!isPlaying) return;
    const id = setInterval(() => {
      setParams(p => {
        if (p.T <= 1) return p;
        return { ...p, T: Math.max(1, Math.round(p.T) - 1) };
      });
    }, 80);
    return () => clearInterval(id);
  }, [isPlaying]);

  // Auto-stop when T hits 1
  useEffect(() => {
    if (isPlaying && params.T <= 1) setIsPlaying(false);
  }, [isPlaying, params.T]);

  const renderChart = () => {
    switch (chartType) {
      case 'profile':
        return (
          <GreekProfileChart
            data={greekProfileSeries}
            currentS={params.S}
            selectedGreek={selectedGreek}
            onGreekSelect={setSelectedGreek}
            params={params}
            baselineData={baselineParams ? baselineSeries : undefined}
          />
        );
      case 'grid':
        return (
          <GreekGridChart
            data={greekProfileSeries}
            currentS={params.S}
            onGreekSelect={(greek) => { setSelectedGreek(greek); setChartType('profile'); }}
          />
        );
      case 'multi':
        return (
          <MultiGreekChart
            data={greekProfileSeries}
            baselineData={baselineParams ? baselineSeries : undefined}
          />
        );
      case 'heatmap':
        return (
          <HeatmapChart
            data={heatmapData}
            currentS={params.S}
            currentT={params.T}
            selectedGreek={selectedGreek}
            onGreekSelect={setSelectedGreek}
          />
        );
      case 'radar':
        return <SensitivityRadar greekValues={greekValues} optionType={params.type} />;
      case 'volsurface':
        return <VolSurfaceChart params={params} />;
      case 'strategy':
        return <StrategyBuilder params={params} />;
    }
  };

  const showsBaseline = chartType === 'profile' || chartType === 'multi';

  return (
    <AppShell
      sidebar={<SidebarControls params={params} onParamsChange={setParams} />}
      main={
        <div className="flex flex-col md:h-full md:overflow-hidden">
          <GreekCardRow greekValues={greekValues} params={params} onParamsChange={setParams} />

          <div className="md:flex-1 flex flex-col md:overflow-hidden p-3 md:p-6 gap-3 md:gap-6 bg-slate-950">
            {/* Tab bar + controls */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex gap-1 md:gap-2 bg-slate-800 p-1.5 md:p-2 rounded-lg flex-wrap">
                {TABS.map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => setChartType(tab.key)}
                    className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                      chartType === tab.key
                        ? 'bg-blue-600 text-white'
                        : 'text-slate-400 hover:text-slate-300'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Time decay controls */}
              <div className="flex items-center gap-2 ml-auto">
                {isPlaying && (
                  <span className="text-xs text-amber-400 font-mono tabular-nums">
                    T = {Math.round(params.T)}d
                  </span>
                )}
                <button
                  onClick={() => setIsPlaying(v => !v)}
                  title={isPlaying ? 'Pause time decay' : 'Animate time decay (counts down T to expiry)'}
                  className={`px-3 py-1.5 rounded text-xs font-medium transition-colors border ${
                    isPlaying
                      ? 'bg-amber-600 border-amber-600 text-white'
                      : 'text-slate-400 border-slate-600 hover:text-slate-200 hover:border-slate-400'
                  }`}
                >
                  {isPlaying ? '⏸ Pause' : '▶ Decay'}
                </button>

                {/* Scenario comparison — only relevant on profile/multi */}
                {showsBaseline && (
                  baselineParams ? (
                    <button
                      onClick={() => setBaselineParams(null)}
                      className="px-3 py-1.5 rounded text-xs font-medium text-slate-400 border border-slate-600 hover:text-red-400 hover:border-red-600 transition-colors"
                    >
                      Clear baseline
                    </button>
                  ) : (
                    <button
                      onClick={() => setBaselineParams(params)}
                      className="px-3 py-1.5 rounded text-xs font-medium text-slate-400 border border-slate-600 hover:text-slate-200 hover:border-slate-400 transition-colors"
                      title="Pin current params as a baseline to compare against"
                    >
                      Pin baseline
                    </button>
                  )
                )}
              </div>
            </div>

            {renderChart()}
          </div>

          <ExplainerPanel
            chartType={chartType}
            selectedGreek={selectedGreek}
            params={params}
          />
        </div>
      }
    />
  );
}

export default App;
