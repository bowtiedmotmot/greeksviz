import React, { ReactNode, useState } from 'react';

interface AppShellProps {
  sidebar: ReactNode;
  main: ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({ sidebar, main }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden">
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/60 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div
        className={[
          'fixed inset-y-0 left-0 z-40 transition-transform duration-200 ease-in-out',
          'md:relative md:translate-x-0 md:flex md:flex-shrink-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full',
        ].join(' ')}
      >
        {sidebar}
      </div>

      <div className="flex-1 flex flex-col overflow-y-auto md:overflow-hidden min-w-0">
        <div className="flex items-center gap-3 px-4 py-3 bg-slate-900 border-b border-slate-700 md:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-slate-400 hover:text-slate-100 transition-colors"
            aria-label="Open controls"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
          <span className="text-base font-bold text-slate-100">Options Greeks Explorer</span>
        </div>
        {main}
      </div>
    </div>
  );
};
