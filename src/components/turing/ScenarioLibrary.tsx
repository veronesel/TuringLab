import React, { useState } from 'react';
import { useTMStore } from '../../store/tmStore';
import { presetScenarios } from '../../data/scenarios';
import { TMScenario } from '../../types/tm';
import { BrainCircuit, Loader2, BookOpen } from 'lucide-react';

export const ScenarioLibrary: React.FC = () => {
  const loadScenario = useTMStore(state => state.loadScenario);
  const activeScenario = useTMStore(state => state.activeScenario);
  
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    setError(null);
    try {
      const res = await fetch('/api/generate-scenario', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ description: prompt })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate");
      
      loadScenario(data.configuration as TMScenario);
      setPrompt("");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <aside className="w-60 border-r border-border-main bg-bg-surface flex flex-col shrink-0 h-full">
      <div className="p-3 border-b border-border-main flex justify-between items-center bg-bg-panel/50">
        <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted">Scenario Library</span>
        <span className="text-[10px] bg-bg-element px-1.5 py-0.5 rounded">{presetScenarios.length} Total</span>
      </div>
      
      <div className="flex-1 overflow-y-auto space-y-0.5 p-1">
        {presetScenarios.map(sc => (
          <button
            key={sc.id}
            onClick={() => loadScenario(sc)}
            className={`w-full text-left p-2 rounded cursor-pointer ${activeScenario?.id === sc.id ? 'bg-primary-base/10 border border-primary-base/20' : 'hover:bg-bg-element border border-transparent'} transition-colors`}
          >
            <div className={`text-xs font-bold ${activeScenario?.id === sc.id ? 'text-primary-base' : 'text-text-secondary'}`}>{sc.name}</div>
            <div className={`text-[10px] text-text-muted mt-1 leading-tight ${activeScenario?.id === sc.id ? 'italic' : ''}`}>{sc.description}</div>
          </button>
        ))}
      </div>

      <div className="mt-auto p-3 border-t border-border-main bg-bg-panel">
        <div className="text-[10px] font-bold uppercase tracking-wider text-text-muted mb-2 flex items-center justify-between">
           <span>AI Generator</span>
           <BrainCircuit size={12} className="text-primary-base" />
        </div>
        <textarea 
          placeholder="Describe target behavior..."
          className="w-full bg-bg-surface border border-border-main rounded p-2 text-[10px] h-20 outline-none focus:border-primary-base text-text-secondary resize-none"
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
        />
        <button 
          onClick={handleGenerate}
          disabled={isGenerating || !prompt.trim()}
          className="w-full bg-slate-200 text-black text-[10px] font-bold py-1.5 mt-2 rounded hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isGenerating ? 'GENERATING...' : 'GENERATE STATE CHART'}
        </button>
        {error && <div className="text-red-400 text-xs mt-2">{error}</div>}
      </div>
    </aside>
  );
};
