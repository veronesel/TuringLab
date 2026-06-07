import React, { useState, useRef } from "react";
import { useTMStore } from "../../store/tmStore";
import { useScenariosStore } from "../../store/scenariosStore";
import { presetScenarios } from "../../data/scenarios";
import { TMScenario } from "../../types/tm";
import {
  BrainCircuit,
  Loader2,
  BookOpen,
  List,
  Plus,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Download,
  Upload,
  Search
} from "lucide-react";

export const ScenarioLibrary: React.FC = () => {
  const loadScenario = useTMStore((state) => state.loadScenario);
  const activeInstanceDetails = useTMStore((state) => state.activeScenario);

  const { activeScenarios, scenarioProgress, addActiveScenario, removeActiveScenario, clearActiveScenarios } =
    useScenariosStore();

  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [tab, setTab] = useState<"library" | "active">("library");
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    const handleToggle = () => setIsCollapsed(c => !c);
    window.addEventListener('toggle-sidebar', handleToggle);
    return () => window.removeEventListener('toggle-sidebar', handleToggle);
  }, []);

  const filteredPresets = presetScenarios.filter((sc) =>
    sc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    sc.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleExport = () => {
    if (!activeInstanceDetails) {
      alert("No active scenario to export.");
      return;
    }
    const currentRules = useTMStore.getState().rules;
    const currentTape = useTMStore.getState().history[0]?.tape;
    let initialTapeStr = activeInstanceDetails.initialTape;
    if (currentTape) {
      // Find min and max index
      const indices = Object.keys(currentTape).map(Number);
      if (indices.length > 0) {
         const min = Math.min(...indices);
         const max = Math.max(...indices);
         let t = "";
         for(let i=min; i<=max; i++) t += currentTape[i] || '_';
         initialTapeStr = t;
      }
    }

    const dataToExport = {
      ...activeInstanceDetails,
      rules: currentRules,
    };
    const dataStr = JSON.stringify(dataToExport, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `turing-scenario-${activeInstanceDetails.id}-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const result = event.target?.result as string;
        const imported = JSON.parse(result);
        const scenarios = Array.isArray(imported) ? imported : [imported];
        scenarios.forEach((sc) => addActiveScenario(sc));
        if (scenarios.length > 0) {
          loadScenario(scenarios[0]);
        }
      } catch (err) {
        alert("Failed to parse JSON file.");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    setError(null);
    try {
      const res = await fetch("/api/generate-scenario", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ description: prompt }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate");

      const newScenario = data.configuration as TMScenario;
      addActiveScenario(newScenario);
      loadScenario(newScenario);
      setTab("active");
      setPrompt("");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleLoadToActive = (scenario: TMScenario) => {
    addActiveScenario(scenario);
    loadScenario(scenario);
    setTab("active");
  };

  if (isCollapsed) {
    return (
      <aside className="w-full border-r border-border-main bg-bg-surface flex flex-col items-center shrink-0 h-full py-4 relative z-20 overflow-hidden">
        <button
          onClick={() => setIsCollapsed(false)}
          className="p-1.5 hover:bg-bg-element rounded-md text-text-secondary transition-colors absolute top-3 right-1.5"
          title="Expand Sidebar"
        >
          <ChevronRight size={16} />
        </button>
        <div className="mt-8 flex flex-col gap-4 text-text-muted">
          <button
            className="p-1.5 hover:bg-bg-element hover:text-text-primary rounded-md transition-colors"
            onClick={() => {
              setTab("library");
              setIsCollapsed(false);
            }}
            title="Library"
          >
            <BookOpen
              size={16}
              className={tab === "library" ? "text-primary-base" : ""}
            />
          </button>
          <button
            className="p-1.5 hover:bg-bg-element hover:text-text-primary rounded-md transition-colors"
            onClick={() => {
              setTab("active");
              setIsCollapsed(false);
            }}
            title="Active Scenarios"
          >
            <List
              size={16}
              className={tab === "active" ? "text-primary-base" : ""}
            />
          </button>
        </div>
      </aside>
    );
  }

  return (
    <aside className="w-full border-r border-border-main bg-bg-surface flex flex-col shrink-0 h-full relative z-20">
      <button
        onClick={() => setIsCollapsed(true)}
        className="absolute top-3 right-2 p-1 text-text-secondary hover:bg-bg-element hover:text-text-primary rounded z-10"
        title="Collapse Sidebar"
      >
        <ChevronLeft size={16} />
      </button>

      <div className="p-3 border-b border-border-main flex flex-col gap-3 bg-bg-panel/50 pt-4">
        <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted pr-6">
          Scenarios
        </span>
        <div className="flex bg-bg-surface border border-border-main rounded p-0.5 w-full">
          <button
            onClick={() => setTab("library")}
            className={`flex-1 flex justify-center items-center gap-1.5 px-2 py-1 text-[10px] font-bold rounded transition-all ${tab === "library" ? "bg-bg-panel text-text-primary shadow-sm" : "hover:bg-bg-element text-text-secondary"}`}
          >
            <BookOpen size={12} /> LIBRARY
          </button>
          <button
            onClick={() => setTab("active")}
            className={`flex-1 flex justify-center items-center gap-1.5 px-2 py-1 text-[10px] font-bold rounded transition-all ${tab === "active" ? "bg-bg-panel text-text-primary shadow-sm" : "hover:bg-bg-element text-text-secondary"}`}
          >
            <List size={12} /> ACTIVE
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto w-full">
        {tab === "library" && (
          <div className="flex flex-col h-full">
            <div className="p-2 border-b border-border-main shrink-0">
              <div className="relative">
                <Search size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-text-muted" />
                <input
                  type="text"
                  placeholder="Search scenarios..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-bg-surface border border-border-main rounded pl-7 pr-2 py-1.5 text-[10px] outline-none focus:border-primary-base text-text-primary"
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-1 space-y-0.5">
              {filteredPresets.length === 0 ? (
                <div className="p-4 text-center text-xs text-text-muted italic">
                  No matching scenarios found.
                </div>
              ) : (
                filteredPresets.map((sc) => (
                  <div
                    key={sc.id}
                    className="border border-transparent hover:border-border-active hover:bg-bg-element/50 rounded transition-colors overflow-hidden"
                  >
                    <button
                      onClick={() =>
                        setSelectedPreset(selectedPreset === sc.id ? null : sc.id)
                      }
                      className="w-full text-left p-2 cursor-pointer flex justify-between items-center"
                    >
                      <div className="text-xs font-bold text-text-primary">
                        {sc.name}
                      </div>
                      <ChevronRight
                        size={14}
                        className={`text-text-muted transition-transform ${selectedPreset === sc.id ? "rotate-90" : ""}`}
                      />
                    </button>
                    {selectedPreset === sc.id && (
                      <div className="px-2 pb-2 text-[10px] text-text-secondary leading-tight flex flex-col gap-3">
                        <p className="border-l-2 border-primary-base/30 pl-2 text-text-primary">
                          {sc.description}
                        </p>
                        <button
                          onClick={() => handleLoadToActive(sc)}
                          className="w-full bg-bg-panel border border-border-main text-text-primary font-bold py-1.5 rounded hover:bg-bg-element hover:border-border-active hover:text-primary-base transition-colors flex items-center justify-center gap-1 shadow-sm"
                        >
                          <Plus size={12} /> LOAD SCENARIO
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {tab === "active" && (
          <div className="flex flex-col h-full">
            <div className="p-2 border-b border-border-main shrink-0 flex gap-2">
              <button
                onClick={handleExport}
                className="flex-1 flex justify-center items-center gap-1 text-[10px] font-bold py-1 bg-bg-element hover:bg-border-active text-text-primary rounded transition-colors"
              >
                <Download size={12} /> EXPORT
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 flex justify-center items-center gap-1 text-[10px] font-bold py-1 bg-bg-element hover:bg-border-active text-text-primary rounded transition-colors"
              >
                <Upload size={12} /> IMPORT
              </button>
              <input
                type="file"
                accept=".json"
                ref={fileInputRef}
                style={{ display: "none" }}
                onChange={handleImport}
              />
            </div>
            <div className="flex-1 overflow-y-auto p-1 space-y-0.5">
              {activeScenarios.length === 0 ? (
                <div className="p-4 text-center text-xs text-text-muted italic">
                  No active scenarios. Load one from the library or generate with
                  AI.
                </div>
              ) : (
                activeScenarios.map((sc) => {
                  const status = scenarioProgress[sc.id] || 'Not Started';
                  return (
                <div
                  key={sc.id}
                  className={`flex flex-col rounded ${activeInstanceDetails?.id === sc.id ? "bg-bg-panel border border-primary-base shadow-sm" : "hover:bg-bg-element border border-transparent"} transition-colors overflow-hidden group`}
                >
                  <div className="flex w-full items-stretch relative">
                    <button
                      onClick={() => loadScenario(sc)}
                      className="flex-1 text-left p-2 cursor-pointer pr-1"
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className={`text-xs font-bold ${activeInstanceDetails?.id === sc.id ? "text-primary-base" : "text-text-secondary"}`}
                        >
                          {sc.name}
                        </div>
                        <div className={`text-[8px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded ${
                          status === 'Completed' ? 'bg-green-500/20 text-green-500 border border-green-500/30' :
                          status === 'In-Progress' ? 'bg-orange-500/20 text-orange-500 border border-orange-500/30' :
                          'bg-bg-element text-text-muted border border-border-main'
                        }`}>
                          {status}
                        </div>
                      </div>
                      <div className="text-[10px] text-text-muted mt-1 leading-tight line-clamp-2">
                        {sc.description}
                      </div>
                    </button>
                    <button
                      onClick={() => removeActiveScenario(sc.id)}
                      className="px-2 text-text-faint hover:text-red-500 hover:bg-red-500/10 transition-colors opacity-0 group-hover:opacity-100 flex items-center justify-center absolute right-0 top-0 bottom-0"
                      title="Remove from Active"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              );
            })
            )}
            </div>
          </div>
        )}
      </div>

      <div className="mt-auto p-3 border-t border-border-main bg-bg-panel shrink-0">
        <div className="text-[10px] font-bold uppercase tracking-wider text-text-muted mb-2 flex items-center justify-between">
          <span>AI Generator</span>
          <BrainCircuit size={12} className="text-primary-base" />
        </div>
        <textarea
          placeholder="Describe target behavior..."
          className="w-full bg-bg-surface border border-border-main rounded p-2 text-[10px] h-20 outline-none focus:border-primary-base text-text-secondary resize-none"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
        />
        <button
          onClick={handleGenerate}
          disabled={isGenerating || !prompt.trim()}
          className="w-full bg-slate-200 text-black text-[10px] font-bold py-1.5 mt-2 rounded hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isGenerating ? "GENERATING..." : "GENERATE STATE CHART"}
        </button>
        {error && (
          <div className="text-red-400 text-xs mt-2 break-words">{error}</div>
        )}
      </div>
    </aside>
  );
};
