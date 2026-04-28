import { useState } from 'react';
import { AppShell } from './components/layout/AppShell';
import { SidebarControls } from './components/layout/SidebarControls';
import { GreekCardRow } from './components/panels/GreekCardRow';
import { GreekProfileChart } from './components/charts/GreekProfileChart';
import { GreekGridChart } from './components/charts/GreekGridChart';
import { MultiGreekChart } from './components/charts/MultiGreekChart';
import { HeatmapChart } from './components/charts/HeatmapChart';
import { SensitivityRadar } from './components/charts/SensitivityRadar';
import { ExplainerPanel } from './components/panels/ExplainerPanel';
import { useGreeks, Params } from './hooks/useGreeks';

type ChartType = 'profile' | 'grid' | 'multi' | 'heatmap' | 'radar';

function App() {
  const [params, setParams] = useState<Params>({
    S: 100,
    K: 100,
    T: 90,
    r: 0.05,
    sigma: 0.25,
    type: 'call'
  });

  const [chartType, setChartType] = useState<ChartType>('profile');
  const [selectedGreek, setSelectedGreek] = useState('delta');

  const { greekValues, greekProfileSeries, heatmapData } = useGreeks(params);

  const renderChart = () => {
    switch (chartType) {
      case 'profile':
        return (
          <GreekProfileChart
            data={greekProfileSeries}
            currentS={params.S}
            selectedGreek={selectedGreek}
            onGreekSelect={setSelectedGreek}
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
        return (
          <SensitivityRadar
            greekValues={greekValues}
            optionType={params.type}
          />
        );
    }
  };

  return (
    <AppShell
      sidebar={<SidebarControls params={params} onParamsChange={setParams} />}
      main={
        <div className="flex flex-col h-full overflow-hidden">
          <GreekCardRow greekValues={greekValues} params={params} onParamsChange={setParams} />

          <div className="flex-1 flex flex-col overflow-hidden p-6 gap-6 bg-slate-950">
            <div className="flex gap-2 bg-slate-800 p-2 rounded-lg w-fit">
              {[
                { key: 'grid', label: 'All Greeks' },
                { key: 'profile', label: 'Profile' },
                { key: 'multi', label: 'Multi' },
                { key: 'heatmap', label: 'Heatmap' },
                { key: 'radar', label: 'Radar' }
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setChartType(tab.key as ChartType)}
                  className={`px-4 py-2 rounded font-medium transition-colors ${
                    chartType === tab.key
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-400 hover:text-slate-300'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
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
