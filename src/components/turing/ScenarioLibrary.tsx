import React, { useState, useRef } from "react";
import { useTMStore } from "../../store/tmStore";
import { useScenariosStore } from "../../store/scenariosStore";
import { presetScenarios } from "../../data/scenarios";
import { TMScenario } from "../../types/tm";
import { AiScenarioStudio } from "./AiScenarioStudio";
import { AnimatePresence } from "motion/react";
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
  Search,
  Save,
  HelpCircle,
  CheckCircle2,
  Sparkles
} from "lucide-react";

const parseExpectedOutcome = (desc: string) => {
  const parts = desc.split(/Expected Outcome:\s*/i);
  if (parts.length > 1) {
    return {
      description: parts[0].trim(),
      expected: parts[1].trim()
    };
  }
  return {
    description: desc,
    expected: null
  };
};

const getExpectedColorInfo = (sc: TMScenario) => {
  if (sc.category === "Busy Beavers") {
    return {
      label: "Neutral Halting",
      bgClass: "bg-gray-500/10 text-gray-400 border-gray-500/25",
      dotClass: "bg-gray-400",
      colorType: "gray"
    };
  }
  if (
    sc.category === "String Manipulation" || 
    sc.id === "find-char" || 
    sc.id === "unary-add" || 
    sc.id === "subtraction-unary" ||
    sc.id === "ones-complement" ||
    sc.id === "multiply-by-2" ||
    sc.id === "inc-binary" ||
    sc.id === "dec-binary"
  ) {
    return {
      label: "Tape Modification",
      bgClass: "bg-amber-500/10 text-amber-500 border-amber-500/25",
      dotClass: "bg-amber-500",
      colorType: "amber"
    };
  }
  return {
    label: "Success/Accepted",
    bgClass: "bg-green-500/10 text-green-500 border-green-500/25",
    dotClass: "bg-green-500",
    colorType: "green"
  };
};

export const ScenarioLibrary: React.FC<{
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}> = ({ isCollapsed, onToggleCollapse }) => {
  const loadScenario = useTMStore((state) => state.loadScenario);
  const clearScenario = useTMStore((state) => state.clearScenario);
  const activeInstanceDetails = useTMStore((state) => state.activeScenario);
  const currentStatus = useTMStore((state) => state.status);
  const stepCount = useTMStore((state) => state.stepCount);

  const getActualResultInfo = (scId: string) => {
    if (activeInstanceDetails?.id !== scId) {
      return (
        <div className="text-text-muted text-[8px] italic mt-1">
          Select scenario to run & view results
        </div>
      );
    }

    if (currentStatus === 'accepted') {
      return (
        <>
          <div className="flex items-center gap-1">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            <span className="text-[9px] font-bold text-green-500 uppercase tracking-wider">
              Accepted
            </span>
          </div>
          <span className="text-[8px] text-text-secondary leading-tight block mt-0.5">
            The machine successfully halted in an accept state in {stepCount} steps.
          </span>
        </>
      );
    }

    if (currentStatus === 'rejected') {
      return (
        <>
          <div className="flex items-center gap-1">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            <span className="text-[9px] font-bold text-amber-500 uppercase tracking-wider">
              Rejected/Halted
            </span>
          </div>
          <span className="text-[8px] text-text-secondary leading-tight block mt-0.5">
            Machine halted in non-accept state after {stepCount} steps.
          </span>
        </>
      );
    }

    if (currentStatus === 'error') {
      return (
        <>
          <div className="flex items-center gap-1">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-red-400" />
            <span className="text-[9px] font-bold text-red-400 uppercase tracking-wider">
              Error
            </span>
          </div>
          <span className="text-[8px] text-text-secondary leading-tight block mt-0.5">
            The machine encountered an execution error.
          </span>
        </>
      );
    }

    if (currentStatus === 'running') {
      return (
        <>
          <div className="flex items-center gap-1">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-500 animate-ping" />
            <span className="text-[9px] font-bold text-[#3b82f6] uppercase tracking-wider animate-pulse">
              Running
            </span>
          </div>
          <span className="text-[8px] text-text-secondary leading-tight block mt-0.5">
            Currently running on step {stepCount}...
          </span>
        </>
      );
    }

    if (currentStatus === 'paused') {
      return (
        <>
          <div className="flex items-center gap-1">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-gray-400" />
            <span className="text-[9px] font-bold text-text-secondary uppercase tracking-wider">
              Paused
            </span>
          </div>
          <span className="text-[8px] text-text-secondary leading-tight block mt-0.5">
            Execution suspended at step {stepCount}.
          </span>
        </>
      );
    }

    if (stepCount > 0) {
      return (
        <>
          <div className="flex items-center gap-1">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-cyan-500" />
            <span className="text-[9px] font-bold text-cyan-400 uppercase tracking-wider">
              Mid-execution
            </span>
          </div>
          <span className="text-[8px] text-text-secondary leading-tight block mt-0.5">
            Step-by-step check is active (step {stepCount}).
          </span>
        </>
      );
    }

    return (
      <>
        <div className="flex items-center gap-1">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-gray-400/40" />
          <span className="text-[9px] font-bold text-text-muted uppercase tracking-wider">
            Not Started
          </span>
        </div>
        <span className="text-[8px] text-text-muted leading-tight block mt-0.5">
          Press Play or Step to run machine.
        </span>
      </>
    );
  };

  const { activeScenarios, customScenarios, scenarioProgress, addActiveScenario, removeActiveScenario, clearActiveScenarios, addCustomScenario } =
    useScenariosStore();

  const [isAiStudioOpen, setIsAiStudioOpen] = useState(false);

  const [tab, setTab] = useState<"library" | "active">("active");
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const allLibraryScenarios = [
    ...presetScenarios,
    ...customScenarios.map(sc => ({ ...sc, category: sc.category || "Custom" }))
  ];

  const categories = ["All", ...Array.from(new Set(allLibraryScenarios.map(sc => sc.category || "Uncategorized"))).sort()];

  const filteredPresets = allLibraryScenarios.filter((sc) => {
    const matchesSearch = sc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sc.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === "All" || (sc.category || "Uncategorized") === activeCategory;
    return matchesSearch && matchesCategory;
  });

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

  const handleSaveAsCustom = () => {
    if (!activeInstanceDetails) {
      alert("No active scenario to save.");
      return;
    }
    const defaultName = activeInstanceDetails.name.startsWith("Custom:") || activeInstanceDetails.name.startsWith("AI:") 
      ? activeInstanceDetails.name 
      : activeInstanceDetails.name;
    const name = window.prompt("Enter name for custom scenario:", defaultName);
    if (!name) return;

    const currentRules = useTMStore.getState().rules;
    const currentTapeDict = useTMStore.getState().tape;
    const currentPositions = activeInstanceDetails.customPositions;
    let initialTapeStr = activeInstanceDetails.initialTape;
    
    if (currentTapeDict) {
      const indices = Object.keys(currentTapeDict).map(Number);
      if (indices.length > 0) {
         const min = Math.min(...indices);
         const max = Math.max(...indices);
         let t = "";
         for(let i=min; i<=max; i++) t += currentTapeDict[i] || '_';
         initialTapeStr = t;
      }
    }

    const newCustomScenario: TMScenario = {
      ...activeInstanceDetails,
      id: `custom-${Date.now()}`,
      name,
      category: activeInstanceDetails.category === "AI Generated" ? "AI Generated" : "Custom",
      rules: currentRules,
      initialTape: initialTapeStr,
      customPositions: currentPositions,
    };
    
    addCustomScenario(newCustomScenario);
    alert(`Saved custom scenario: ${name}`);
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

  const handleLoadToActive = (scenario: TMScenario) => {
    addActiveScenario(scenario);
    loadScenario(scenario);
    setTab("active");
  };

  if (isCollapsed) {
    return (
      <aside className="w-full border-r border-border-main bg-bg-surface flex flex-col items-center shrink-0 h-full py-4 relative z-20 overflow-hidden">
        <button
          onClick={onToggleCollapse}
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
              onToggleCollapse();
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
              onToggleCollapse();
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
        onClick={onToggleCollapse}
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
              <div className="flex gap-1.5 mt-2 overflow-x-auto no-scrollbar pb-1">
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`whitespace-nowrap px-2 py-0.5 text-[10px] rounded-full border transition-colors ${activeCategory === cat ? "bg-primary-base text-white border-primary-base" : "bg-bg-element text-text-secondary border-border-main hover:border-text-muted"}`}
                  >
                    {cat}
                  </button>
                ))}
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
                    className="border border-transparent hover:border-border-active hover:bg-bg-element/50 rounded transition-colors overflow-hidden group"
                    title={`Objective: ${sc.description}\n\nInitial Tape: ${sc.initialTape}`}
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
                      <div className="px-2 pb-2 text-[10px] text-text-secondary leading-tight flex flex-col gap-3 pt-1">
                        <p className="border-l-2 border-primary-base/30 pl-2 text-text-primary">
                          {parseExpectedOutcome(sc.description).description}
                        </p>
                        
                        {parseExpectedOutcome(sc.description).expected && (
                          <div className="bg-bg-element/50 border border-border-main/60 rounded p-2 flex flex-col gap-1.5">
                            <div className="flex items-center justify-between">
                              <span className="text-[8px] font-bold uppercase tracking-wider text-text-muted">
                                Expected Outcome
                              </span>
                              <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 text-[8px] font-bold rounded-full border ${getExpectedColorInfo(sc).bgClass}`}>
                                <span className={`w-1 h-1 rounded-full ${getExpectedColorInfo(sc).dotClass}`} />
                                {getExpectedColorInfo(sc).label}
                              </span>
                            </div>
                            <span className="text-[9px] text-text-secondary leading-normal">
                              {parseExpectedOutcome(sc.description).expected}
                            </span>
                          </div>
                        )}

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
            <div className="p-2 border-b border-border-main shrink-0 flex flex-col gap-2">
              <button
                onClick={handleSaveAsCustom}
                className="w-full flex justify-center items-center gap-1.5 text-[10px] font-bold py-1.5 bg-primary-base/10 hover:bg-primary-base/20 text-primary-base border border-primary-base/30 hover:border-primary-base/50 rounded transition-colors"
                title="Save current state as custom layout in Library"
              >
                <Save size={12} /> SAVE TO LIBRARY
              </button>
              <div className="flex gap-2">
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
              </div>
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
                    <div
                      onClick={() => loadScenario(sc)}
                      role="button"
                      tabIndex={0}
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
                      <div className="text-[10px] text-text-muted mt-1 leading-tight">
                        {activeInstanceDetails?.id === sc.id 
                          ? parseExpectedOutcome(sc.description).description
                          : sc.description
                        }
                      </div>

                      {activeInstanceDetails?.id === sc.id && (
                        <>
                          <div className="mt-2.5 pt-2 border-t border-border-main/40 grid grid-cols-2 gap-2 text-left">
                            {/* Expected Block */}
                            <div className="bg-bg-surface/60 border border-border-main/50 rounded p-1.5 flex flex-col justify-between min-h-[58px]">
                              <div>
                                <span className="text-[7.5px] font-bold text-text-muted uppercase tracking-wider block mb-1">
                                  Expected Outcome
                                </span>
                                <div className="flex items-center gap-1">
                                  <span className={`inline-block w-1.5 h-1.5 rounded-full ${getExpectedColorInfo(sc).dotClass}`} />
                                  <span className="text-[8.5px] font-bold text-text-primary leading-none">
                                    {getExpectedColorInfo(sc).label}
                                  </span>
                                </div>
                              </div>
                              <span className="text-[8px] text-text-secondary leading-normal block mt-1 line-clamp-3">
                                {parseExpectedOutcome(sc.description).expected || "Halt in success state."}
                              </span>
                            </div>

                            {/* Actual Block */}
                            <div className="bg-bg-surface/60 border border-border-main/50 rounded p-1.5 flex flex-col justify-between min-h-[58px]">
                              <div>
                                <span className="text-[7.5px] font-bold text-text-muted uppercase tracking-wider block mb-[3px]">
                                  Actual Result
                                </span>
                                {getActualResultInfo(sc.id)}
                              </div>
                            </div>
                          </div>

                          {/* SAVE WORKSPACE STATE AS PRESET */}
                          <div className="mt-2.5 flex gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSaveAsCustom();
                              }}
                              className="w-full flex justify-center items-center gap-1.5 text-[9.5px] font-bold py-1.5 bg-primary-base/10 hover:bg-primary-base/20 text-primary-base border border-primary-base/20 hover:border-primary-base/40 rounded transition-all active:scale-[0.98]"
                              title="Save current rules & tape modifications as a permanent Library preset"
                            >
                              <Save size={11} /> SAVE STATE TO LIBRARY AS PRESET
                            </button>
                          </div>

                          {/* UPFRONT SIMULATOR VERIFICATION RESULTS */}
                          {sc.upfrontTestResult && (
                            <div className="mt-2.5 text-left bg-blue-500/5 hover:bg-blue-500/10 border border-blue-500/20 rounded-md p-2 text-[9px] font-sans antialiased transition-colors">
                              <div className="flex items-center gap-1 text-sky-400 font-extrabold mb-1">
                                <CheckCircle2 size={11} className="text-emerald-400" />
                                <span className="uppercase tracking-wider font-sans">Upfront Tested & Verified</span>
                              </div>
                              <p className="text-text-muted leading-relaxed font-sans text-[8.5px]">
                                Turing backend execution dry-run successfully passed on initial tape <code className="bg-[#161b22] font-mono px-1 py-0.5 rounded text-blue-400 font-normal">"{sc.initialTape}"</code> from <code className="bg-[#161b22] font-mono px-1 py-0.5 rounded text-indigo-400 font-normal">{sc.initialState}</code>.
                              </p>
                              <div className="grid grid-cols-3 gap-2 mt-2 pt-2 border-t border-border-main/30 font-mono text-[8px] text-text-muted">
                                <div>
                                  <span className="text-text-faint text-[7px] uppercase block tracking-wider mb-0.5">STATUS</span>
                                  <span className={`font-extrabold ${sc.upfrontTestResult.status === 'accepted' ? 'text-green-500' : 'text-amber-500'}`}>
                                    {sc.upfrontTestResult.status.toUpperCase()}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-text-faint text-[7px] uppercase block tracking-wider mb-0.5">STEPS</span>
                                  <span className="text-text-primary font-bold">
                                    {sc.upfrontTestResult.stepsExecuted} Cycles
                                  </span>
                                </div>
                                <div>
                                  <span className="text-text-faint text-[7px] uppercase block tracking-wider mb-0.5">FINAL TAPE</span>
                                  <span className="text-text-primary truncate block font-bold" title={sc.upfrontTestResult.finalTape}>
                                    {sc.upfrontTestResult.finalTape || '_'}
                                  </span>
                                </div>
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeActiveScenario(sc.id);
                        if (activeInstanceDetails?.id === sc.id) {
                          clearScenario();
                        }
                      }}
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

      <div className="mt-auto p-4 border-t border-border-main bg-bg-panel/40 shrink-0 relative flex flex-col gap-2">
        <div className="text-[10px] font-extrabold uppercase tracking-widest text-[#3b82f6] flex items-center justify-between">
          <span className="flex items-center gap-1.5"><Sparkles size={12} /> Synthesize New Machines</span>
        </div>
        <p className="text-[10px] text-text-muted leading-relaxed hidden sm:block">
          Use the AI Scenario Studio to describe custom Turing Machine behaviors and automatically generate the rules, tape, and layout.
        </p>

        <button
          onClick={() => setIsAiStudioOpen(true)}
          className="w-full bg-[#1d4ed8]/10 hover:bg-[#1d4ed8]/20 text-[#3b82f6] border border-[#3b82f6]/30 text-[10px] font-extrabold py-2.5 rounded transition-all flex items-center justify-center gap-2 uppercase tracking-wider shadow"
        >
          <BrainCircuit size={14} className="animate-pulse" />
          AI Scenario Studio
        </button>
      </div>

      <AnimatePresence>
        {isAiStudioOpen && (
          <AiScenarioStudio
            isOpen={isAiStudioOpen}
            onClose={() => setIsAiStudioOpen(false)}
          />
        )}
      </AnimatePresence>
    </aside>
  );
};
