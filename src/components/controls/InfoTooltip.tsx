import React, { useState } from 'react';

interface InfoTooltipProps {
  text: string;
}

export const InfoTooltip: React.FC<InfoTooltipProps> = ({ text }) => {
  const [visible, setVisible] = useState(false);

  return (
    <span className="relative inline-flex items-center ml-1">
      <button
        type="button"
        onMouseEnter={() => setVisible(true)}
        onMouseLeave={() => setVisible(false)}
        onFocus={() => setVisible(true)}
        onBlur={() => setVisible(false)}
        className="w-4 h-4 rounded-full bg-slate-600 text-slate-300 text-[10px] font-bold flex items-center justify-center hover:bg-slate-500 transition-colors cursor-help leading-none"
        aria-label={text}
      >
        i
      </button>
      {visible && (
        <div className="absolute top-5 left-0 z-50 w-56 bg-slate-700 text-slate-200 text-xs rounded-md p-2.5 shadow-xl border border-slate-500 pointer-events-none">
          {text}
        </div>
      )}
    </span>
  );
};
