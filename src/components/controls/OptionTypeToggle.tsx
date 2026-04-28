import React from 'react';

interface OptionTypeToggleProps {
  value: 'call' | 'put';
  onChange: (type: 'call' | 'put') => void;
}

export const OptionTypeToggle: React.FC<OptionTypeToggleProps> = ({ value, onChange }) => {
  return (
    <div className="mb-3">
      <label className="text-sm font-medium text-slate-300 block mb-2">Option Type</label>
      <div className="flex gap-2 bg-slate-800 p-1 rounded-lg">
        <button
          onClick={() => onChange('call')}
          className={`flex-1 py-2 px-3 rounded font-medium transition-colors ${
            value === 'call'
              ? 'bg-blue-600 text-white'
              : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
          }`}
        >
          Call
        </button>
        <button
          onClick={() => onChange('put')}
          className={`flex-1 py-2 px-3 rounded font-medium transition-colors ${
            value === 'put'
              ? 'bg-red-600 text-white'
              : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
          }`}
        >
          Put
        </button>
      </div>
    </div>
  );
};
