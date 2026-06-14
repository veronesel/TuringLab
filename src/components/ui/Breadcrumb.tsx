import React from 'react';
import { ChevronRight, Home } from 'lucide-react';
import { TMScenario } from '../../types/tm';

interface BreadcrumbProps {
  activeScenario: TMScenario | null;
  onNavigateToCategory: () => void;
  onNavigateToMachine: () => void;
}

export function Breadcrumb({ activeScenario, onNavigateToCategory, onNavigateToMachine }: BreadcrumbProps) {
  if (!activeScenario) {
    return (
      <div className="flex items-center text-[10px] sm:text-[11px] font-sans flex-1 min-w-0">
        <span className="text-text-muted px-2 py-0.5 rounded bg-bg-surface border border-transparent">
          Loading...
        </span>
      </div>
    );
  }

  return (
    <nav className="flex items-center text-[10px] sm:text-[11px] font-sans flex-1 min-w-0" aria-label="Breadcrumb">
      <ol className="flex items-center space-x-1 min-w-0 w-full">
        <li className="shrink-0">
          <div>
            <button
              onClick={onNavigateToCategory}
              className="text-text-muted flex items-center justify-center p-1 rounded hover:bg-bg-element hover:text-text-primary transition-colors cursor-pointer"
              title="Workspaces"
            >
              <Home size={12} />
              <span className="sr-only">Home</span>
            </button>
          </div>
        </li>
        <li className="shrink min-w-0 hidden sm:block">
          <div className="flex items-center min-w-0">
            <span className="text-text-muted opacity-50 px-0.5 shrink-0">
              <ChevronRight size={12} />
            </span>
            <button
              onClick={onNavigateToCategory}
              className="text-text-muted px-2 py-0.5 rounded bg-bg-surface hover:bg-bg-element hover:text-text-primary transition-colors border border-transparent truncate max-w-[120px] cursor-pointer"
              title={`Return to ${activeScenario.category || 'Workspace'} library`}
            >
              {activeScenario.category || 'Workspace'}
            </button>
          </div>
        </li>
        <li className="shrink min-w-0">
          <div className="flex items-center min-w-0">
            <span className="text-text-muted opacity-50 px-0.5 shrink-0">
              <ChevronRight size={12} />
            </span>
            <button
              onClick={onNavigateToMachine}
              className="text-text-primary font-bold px-2 py-0.5 rounded bg-bg-panel hover:bg-bg-element transition-colors border border-border-main shadow-sm truncate max-w-[200px] cursor-pointer"
              title={`Configure ${activeScenario.name || 'Untitled Machine'}`}
            >
              {activeScenario.name || 'Untitled Machine'}
            </button>
          </div>
        </li>
      </ol>
    </nav>
  );
}
