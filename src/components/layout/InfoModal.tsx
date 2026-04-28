import React from 'react';

interface InfoModalProps {
  onClose: () => void;
}

export const InfoModal: React.FC<InfoModalProps> = ({ onClose }) => {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl max-w-lg w-full mx-4 p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-4">
          <h2 className="text-xl font-bold text-slate-100">Options Greeks Explorer</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-100 transition-colors ml-4 text-lg leading-none"
          >
            ✕
          </button>
        </div>

        <div className="text-slate-300 text-sm space-y-3">
          <p>
            An interactive visualizer for the Black-Scholes option pricing model and its
            sensitivity measures — the <span className="text-blue-400 font-medium">Greeks</span>.
          </p>

          <div>
            <p className="text-slate-100 font-medium mb-1">What are the Greeks?</p>
            <ul className="space-y-1 pl-3 border-l border-slate-700">
              <li><span className="text-yellow-400 font-mono">Delta (Δ)</span> — sensitivity to spot price changes</li>
              <li><span className="text-yellow-400 font-mono">Gamma (Γ)</span> — rate of change of Delta</li>
              <li><span className="text-yellow-400 font-mono">Theta (Θ)</span> — time decay per day</li>
              <li><span className="text-yellow-400 font-mono">Vega (ν)</span> — sensitivity to volatility changes</li>
              <li><span className="text-yellow-400 font-mono">Rho (ρ)</span> — sensitivity to interest rate changes</li>
            </ul>
          </div>

          <div>
            <p className="text-slate-100 font-medium mb-1">How to use it</p>
            <p>
              Adjust the sliders on the left to set your option parameters. Switch between
              chart views using the tabs — <span className="text-slate-200">Profile</span> shows a
              single Greek vs. spot price, <span className="text-slate-200">All Greeks</span> gives
              a side-by-side overview, <span className="text-slate-200">Heatmap</span> shows how a
              Greek varies across spot price and time, and <span className="text-slate-200">Radar</span>{' '}
              gives a normalized sensitivity snapshot.
            </p>
          </div>

          <p className="text-slate-500 text-xs pt-1">
            All calculations use the analytical Black-Scholes formula. No market data is used — prices are theoretical.
          </p>
        </div>
      </div>
    </div>
  );
};
