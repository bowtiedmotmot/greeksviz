import React, { ReactNode } from 'react';

interface AppShellProps {
  sidebar: ReactNode;
  main: ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({ sidebar, main }) => {
  return (
    <div className="flex h-screen bg-slate-950 text-slate-100">
      {sidebar}
      <div className="flex-1 flex flex-col overflow-hidden">
        {main}
      </div>
    </div>
  );
};
