import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { useTMStore } from "../../store/tmStore";
import { useScenariosStore } from "../../store/scenariosStore";
import { presetScenarios } from "../../data/scenarios";
import { TMScenario } from "../../types/tm";
import { AiScenarioStudio } from "./AiScenarioStudio";
import { SaveScenarioModal } from "./SaveScenarioModal";
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
  Sparkles,
  X,
  Eye,
  Star
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

export const getScenarioTags = (sc: TMScenario): string[] => {
  if (sc.tags && sc.tags.length > 0) return sc.tags;
  
  // Default tags mapping for preset scenarios
  const presetTagsMap: Record<string, string[]> = {
    "binary-palindrome": ["palindrome", "binary", "language", "symmetric"],
    "unary-addition": ["unary", "addition", "math", "arithmetic"],
    "unary-add": ["unary", "addition", "math", "arithmetic"],
    "binary-increment": ["binary", "increment", "math", "add-one"],
    "binary-decrement": ["binary", "decrement", "math", "sub-one"],
    "bit-inverter": ["basics", "logic", "not-gate", "binary"],
    "copy-unary": ["unary", "copy", "utility"],
    "shift-right": ["basics", "shift", "binary", "utility"],
    "find-pattern": ["pattern", "search", "binary", "match"],
    "clear-tape": ["basics", "clear", "utility"],
    "duplicate-char": ["duplicate", "string", "manipulation"],
    "binary-equal": ["binary", "equality", "comparison"],
    "busy-beaver-4": ["beaver", "busy-beaver", "theoretical", "halting"],
    "binary-to-unary": ["binary", "unary", "conversion"],
    "find-middle": ["basics", "string", "middle", "utility"],
    "swap-01": ["swap", "binary", "manipulation"],
    "count-zeros": ["count", "binary", "unary", "utility"],
    "move-tape": ["basics", "shift", "utility"],
    "parity-check": ["parity", "binary", "check"],
    "multiply-by-2": ["unary", "multiply", "doubling", "math"],
    "inc-binary": ["binary", "increment", "math"],
    "dec-binary": ["binary", "decrement", "math"],
    "ones-complement": ["binary", "complement", "invert"],
    "busy-beaver-3": ["beaver", "busy-beaver", "theoretical", "halting"],
    "an-bn-cn": ["language", "recognition", "context-free"],
    "reverse-string": ["reverse", "string", "manipulation", "utility"],
    "copy-string": ["copy", "string", "manipulation", "utility"],
    "find-char": ["search", "character", "find"],
    "replace-char": ["replace", "string", "manipulation"],
    "check-even-length": ["length", "parity", "check"],
    "subtraction-unary": ["unary", "subtraction", "math"]
  };

  return presetTagsMap[sc.id] || ["turing", sc.category?.toLowerCase() || "utility"];
};

export const ScenarioLibrary: React.FC<{
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}> = ({ isCollapsed, onToggleCollapse }) => {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  
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

  const { activeScenarios, customScenarios, favoriteScenarioIds, scenarioProgress, addActiveScenario, removeActiveScenario, clearActiveScenarios, addCustomScenario, toggleFavorite } =
    useScenariosStore();

  const [isAiStudioOpen, setIsAiStudioOpen] = useState(false);

  const [tab, setTab] = useState<"library" | "active" | "synthesize">("active");
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Quick preview & group collapsible state hooks
  const [previewScenario, setPreviewScenario] = useState<TMScenario | null>(null);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});

  const allLibraryScenarios = [
    ...presetScenarios,
    ...customScenarios.map(sc => ({ ...sc, category: sc.category || "Custom" }))
  ];

  const existingTags = React.useMemo(() => {
    const tagsSet = new Set<string>();
    allLibraryScenarios.forEach(sc => {
      getScenarioTags(sc).forEach(t => tagsSet.add(t));
    });
    return Array.from(tagsSet).sort();
  }, [allLibraryScenarios]);

  const categories = ["All", ...Array.from(new Set(allLibraryScenarios.map(sc => sc.category || "Uncategorized"))).sort()];

  const filteredPresets = allLibraryScenarios.filter((sc) => {
    const tags = getScenarioTags(sc);
    const matchesSearch = sc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sc.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = activeCategory === "All" || (sc.category || "Uncategorized") === activeCategory;
    return matchesSearch && matchesCategory;
  });

  // Group sc by category (e.g. { "Basic Arithmetic": [...], "String Manipulation": [...] })
  const groupedPresetsByCat: Record<string, TMScenario[]> = {};
  
  // Filtered favorites for the virtual group
  const favoritePresets = filteredPresets.filter(sc => favoriteScenarioIds.includes(sc.id));
  if (favoritePresets.length > 0) {
    groupedPresetsByCat["★ Favorites"] = favoritePresets;
  }

  filteredPresets.forEach((sc) => {
    const cat = sc.category || "Uncategorized";
    if (!groupedPresetsByCat[cat]) {
      groupedPresetsByCat[cat] = [];
    }
    groupedPresetsByCat[cat].push(sc);
  });

  const sortedGroupedCategories = Object.keys(groupedPresetsByCat)
    .filter(cat => cat !== "★ Favorites")
    .sort((a, b) => a.localeCompare(b));
    
  if (groupedPresetsByCat["★ Favorites"]) {
    sortedGroupedCategories.unshift("★ Favorites");
  }

  const filteredActiveScenarios = activeScenarios.filter((sc) => {
    const tags = getScenarioTags(sc);
    const matchesSearch = sc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sc.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesSearch;
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
    setIsSaveModalOpen(true);
  };

  const handleSavePreset = (name: string, tags: string[]) => {
    if (!activeInstanceDetails) return;

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
      tags,
      category: activeInstanceDetails.category === "AI Generated" ? "AI Generated" : "Custom",
      rules: currentRules,
      initialTape: initialTapeStr,
      customPositions: currentPositions,
    };
    
    addCustomScenario(newCustomScenario);
    setIsSaveModalOpen(false);
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
          <button
            className="p-1.5 hover:bg-bg-element hover:text-text-primary rounded-md transition-colors animate-pulse"
            onClick={() => {
              setTab("synthesize");
              onToggleCollapse();
            }}
            title="Synthesize New Machine"
          >
            <BrainCircuit
              size={16}
              className={tab === "synthesize" ? "text-primary-base" : ""}
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

      <div className="p-3 border-b border-border-main flex flex-col gap-2.5 bg-bg-panel/50 pt-4">
        <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted pr-6">
          Scenarios
        </span>
        
        {tab !== "synthesize" && (
          <div className="relative">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              placeholder="Search scenarios by name or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-bg-surface border border-border-main rounded pl-7 pr-6 py-1 text-[10px] outline-none focus:border-primary-base text-text-primary transition-colors placeholder:text-text-faint"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary p-0.5 rounded cursor-pointer"
                title="Clear search query"
              >
                <X size={11} />
              </button>
            )}
          </div>
        )}

        <div className="flex bg-bg-surface border border-border-main rounded p-0.5 w-full">
          <button
            onClick={() => setTab("library")}
            className={`flex-1 flex justify-center items-center gap-1 px-1 py-1 text-[9px] font-bold rounded transition-all ${tab === "library" ? "bg-bg-panel text-text-primary shadow-sm" : "hover:bg-bg-element text-text-secondary"}`}
          >
            <BookOpen size={11} /> LIBRARY
          </button>
          <button
            onClick={() => setTab("active")}
            className={`flex-1 flex justify-center items-center gap-1 px-1 py-1 text-[9px] font-bold rounded transition-all ${tab === "active" ? "bg-bg-panel text-text-primary shadow-sm" : "hover:bg-bg-element text-text-secondary"}`}
          >
            <List size={11} /> ACTIVE
          </button>
          <button
            onClick={() => setTab("synthesize")}
            className={`flex-1 flex justify-center items-center gap-1 px-1 py-1 text-[9px] font-bold rounded transition-all ${tab === "synthesize" ? "bg-bg-panel text-text-primary shadow-sm" : "hover:bg-bg-element text-text-secondary"}`}
            title="AI Synthesizer Studio"
          >
            <BrainCircuit size={11} /> SYNTHESIZE
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto w-full">
        {tab === "library" && (
          <div className="flex flex-col h-full">
            <div className="p-2 border-b border-border-main shrink-0">
              <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
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
            <div className="flex-1 overflow-y-auto p-1.5 space-y-2">
              {filteredPresets.length === 0 ? (
                <div className="p-4 text-center text-xs text-text-muted italic">
                  No matching scenarios found.
                </div>
              ) : (
                sortedGroupedCategories.map((catName) => {
                  const isCatCollapsed = searchQuery ? false : !!collapsedCategories[catName];
                  const scList = groupedPresetsByCat[catName];
                  
                  // Sort scList so favorites are at the top, then alphabetically
                  const scListSorted = [...scList].sort((a, b) => {
                    const aFav = favoriteScenarioIds.includes(a.id);
                    const bFav = favoriteScenarioIds.includes(b.id);
                    if (aFav && !bFav) return -1;
                    if (!aFav && bFav) return 1;
                    return a.name.localeCompare(b.name);
                  });

                  return (
                    <div key={catName} className="flex flex-col border border-border-main/50 rounded bg-bg-panel/10 overflow-hidden">
                      {/* Collapse Header */}
                      <button
                        onClick={() => setCollapsedCategories({
                          ...collapsedCategories,
                          [catName]: !isCatCollapsed
                        })}
                        className="w-full flex items-center justify-between p-2 pb-1.5 bg-bg-surface hover:bg-bg-element text-left transition-colors cursor-pointer select-none border-b border-border-main/40"
                        title={isCatCollapsed ? `Expand ${catName}` : `Collapse ${catName}`}
                      >
                        <div className="flex items-center gap-1.5 min-w-0">
                          <ChevronDown
                            size={12}
                            className={`text-text-secondary shrink-0 transition-transform duration-200 ${isCatCollapsed ? "-rotate-90 text-text-muted" : "text-primary-base"}`}
                          />
                          <span className="text-[10px] font-extrabold uppercase tracking-wide text-text-primary truncate">
                            {catName}
                          </span>
                        </div>
                        <span className="text-[8px] bg-bg-element border border-border-main px-1.5 py-0.5 rounded-full font-bold text-text-muted shrink-0 shadow-sm leading-none">
                          {scList.length}
                        </span>
                      </button>

                      {/* Scenario list inside category */}
                      {!isCatCollapsed && (
                        <div className="p-1 space-y-1">
                          {scListSorted.map((sc) => {
                            const isFav = favoriteScenarioIds.includes(sc.id);
                            return (
                              <div
                                key={sc.id}
                                className="border border-border-main/20 hover:border-border-active hover:bg-bg-element/40 rounded transition-colors overflow-hidden group relative"
                                title={`Objective: ${sc.description}\n\nInitial Tape: ${sc.initialTape}`}
                              >
                                <div className="flex items-center w-full bg-bg-surface/30">
                                  {/* Clicking the name toggles the expansion */}
                                  <button
                                    onClick={() =>
                                      setSelectedPreset(selectedPreset === sc.id ? null : sc.id)
                                    }
                                    className="flex-1 text-left p-2 cursor-pointer pr-1 flex flex-col gap-1 bg-transparent border-0"
                                  >
                                    <div className="text-xs font-bold text-text-primary pr-2 flex items-center gap-1.5 flex-wrap">
                                      {sc.name}
                                      {isFav && (
                                        <Star size={11} className="text-amber-400 fill-amber-400 shrink-0" />
                                      )}
                                    </div>
                                    <div className="flex flex-wrap gap-1">
                                      {getScenarioTags(sc).map((tag) => (
                                        <span key={tag} className="px-1 py-[1px] bg-bg-panel text-[8px] font-semibold text-text-muted rounded-full border border-border-main/40 hover:text-text-primary transition-colors">
                                          #{tag}
                                        </span>
                                      ))}
                                    </div>
                                  </button>

                                  {/* Icon Buttons panel: Star, Eye Icon & Expansion indicator */}
                                  <div className="flex items-center gap-1.5 px-2 shrink-0">
                                    {/* Star Toggle Button */}
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        toggleFavorite(sc.id);
                                      }}
                                      className={`p-1 rounded border transition-colors cursor-pointer ${
                                        isFav 
                                          ? "bg-amber-500/10 text-amber-400 border-amber-500/30 hover:bg-amber-500/20" 
                                          : "bg-bg-element text-text-secondary border-border-main hover:text-amber-400"
                                      }`}
                                      title={isFav ? "Remove from Favorites" : "Mark as Favorite (Pins to top)"}
                                    >
                                      <Star size={11} fill={isFav ? "currentColor" : "none"} />
                                    </button>

                                    {/* Quick Preview Button */}
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setPreviewScenario(sc);
                                      }}
                                      className="p-1 hover:bg-primary-base hover:text-white rounded border border-border-main text-text-secondary bg-bg-element transition-colors cursor-pointer"
                                      title={`Quick blueprint preview of ${sc.name}`}
                                    >
                                      <Eye size={11} />
                                    </button>

                                    <button
                                      onClick={() =>
                                        setSelectedPreset(selectedPreset === sc.id ? null : sc.id)
                                      }
                                      className="p-1 text-text-muted hover:text-text-primary transition-colors cursor-pointer"
                                      title={selectedPreset === sc.id ? "Collapse Details" : "Expand Details"}
                                    >
                                      <ChevronRight
                                        size={14}
                                        className={`text-text-muted transition-transform duration-200 ${selectedPreset === sc.id ? "rotate-90" : ""}`}
                                      />
                                    </button>
                                  </div>
                              </div>

                              {/* Expanded Inline Detail */}
                              {selectedPreset === sc.id && (
                                <div className="px-2 pb-2 text-[10px] text-text-secondary leading-tight flex flex-col gap-2.5 pt-1 border-t border-border-main/20 bg-bg-panel/20">
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
                                    className="w-full bg-bg-panel border border-border-main text-text-primary font-bold py-1.5 rounded hover:bg-bg-element hover:border-border-active hover:text-primary-base transition-colors flex items-center justify-center gap-1 shadow-sm cursor-pointer"
                                  >
                                    <Plus size={12} /> LOAD SCENARIO
                                  </button>
                                </div>
                              )}
                            </div>
                          )})}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
            
            {/* Library list count footer */}
            <div className="p-2 border-t border-border-main bg-bg-panel/20 shrink-0 text-[10px] text-text-muted flex justify-between items-center font-sans">
              <span>Filtered Scenarios:</span>
              <span className="font-bold text-text-primary">
                {filteredPresets.length} of {allLibraryScenarios.length}
              </span>
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
              ) : filteredActiveScenarios.length === 0 ? (
                <div className="p-4 text-center text-xs text-text-muted italic">
                  No matching active scenarios found for "{searchQuery}".
                </div>
              ) : (
                filteredActiveScenarios.map((sc) => {
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
                      <div className="flex items-center gap-2 flex-wrap">
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
                        
                        {/* Star Toggle Button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavorite(sc.id);
                          }}
                          className={`p-0.5 rounded transition-colors cursor-pointer ${
                            favoriteScenarioIds.includes(sc.id)
                              ? "text-amber-400 hover:text-amber-500"
                              : "text-text-muted hover:text-amber-400"
                          }`}
                          title={favoriteScenarioIds.includes(sc.id) ? "Remove from Favorites" : "Mark as Favorite"}
                        >
                          <Star size={11} fill={favoriteScenarioIds.includes(sc.id) ? "currentColor" : "none"} />
                        </button>
                      </div>
                      <div className="text-[10px] text-text-muted mt-1 leading-tight">
                        {activeInstanceDetails?.id === sc.id 
                          ? parseExpectedOutcome(sc.description).description
                          : sc.description
                        }
                      </div>
                      
                      {/* Active Card Tags */}
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {getScenarioTags(sc).map((tag) => (
                          <span key={tag} className="px-1 py-[1px] bg-bg-panel text-[8px] font-semibold text-text-muted rounded-full border border-border-main/40 hover:text-text-primary transition-colors">
                            #{tag}
                          </span>
                        ))}
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

            {/* Active list count footer */}
            <div className="p-2 border-t border-border-main bg-bg-panel/20 shrink-0 text-[10px] text-text-muted flex justify-between items-center font-sans">
              <span>Filtered Active:</span>
              <span className="font-bold text-text-primary">
                {filteredActiveScenarios.length} of {activeScenarios.length}
              </span>
            </div>
          </div>
        )}

        {tab === "synthesize" && (
          <AiScenarioStudio inline={true} />
        )}
      </div>

      {/* Quick Preview Modal Overlay */}
      {mounted && createPortal(
        <>
          <AnimatePresence>
            {previewScenario && (
            <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
              <div className="bg-[#0f172a] border border-[#1e293b] rounded-xl w-full max-w-xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-[fadeIn_0.2s_ease-out] font-sans">
                
                {/* Header */}
                <div className="p-4 border-b border-[#1e293b] flex items-center justify-between bg-[#1e293b]/40">
                <div className="flex flex-col gap-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-extrabold text-white animate-pulse">
                      {previewScenario.name}
                    </span>
                    <span className="text-[9px] font-bold bg-[#3b82f6]/20 text-[#60a5fa] px-2 py-0.5 rounded border border-[#3b82f6]/30">
                      {previewScenario.category || "Uncategorized"}
                    </span>
                  </div>
                  <span className="text-[9px] text-[#94a3b8]">
                    Scenario Blueprint & Configuration Preview
                  </span>
                </div>
                <button
                  onClick={() => setPreviewScenario(null)}
                  className="p-1.5 hover:bg-[#1e293b] rounded-lg text-[#94a3b8] hover:text-white transition-colors cursor-pointer border-0"
                  title="Close Preview"
                >
                  <X size={15} />
                </button>
              </div>

              {/* Scrollable Content */}
              <div className="p-5 overflow-y-auto flex flex-col gap-4 text-xs text-[#94a3b8] leading-relaxed no-scrollbar bg-[#0f172a]">
                
                {/* description */}
                <div className="flex flex-col gap-1">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-[#64748b]">
                    Objective Description
                  </span>
                  <p className="border-l-2 border-[#3b82f6] pl-3 text-[#f1f5f9] font-medium text-[11px]">
                    {parseExpectedOutcome(previewScenario.description).description}
                  </p>
                </div>

                {/* Expected Outcome details */}
                {parseExpectedOutcome(previewScenario.description).expected && (
                  <div className="bg-[#1e293b]/20 border border-[#1e293b] rounded-lg p-3 flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-bold uppercase tracking-wider text-[#64748b]">
                        Expected Outcome
                      </span>
                      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-[8px] font-bold rounded-full border ${getExpectedColorInfo(previewScenario).bgClass}`}>
                        <span className={`w-1 h-1 rounded-full ${getExpectedColorInfo(previewScenario).dotClass}`} />
                        {getExpectedColorInfo(previewScenario).label}
                      </span>
                    </div>
                    <span className="text-[10px] text-[#cbd5e1] leading-normal font-sans">
                      {parseExpectedOutcome(previewScenario.description).expected}
                    </span>
                  </div>
                )}

                {/* Configuration detail card split */}
                <div className="grid grid-cols-2 gap-3 mt-1">
                  <div className="bg-[#1e293b]/10 p-3 rounded-lg border border-[#1e293b] flex flex-col gap-1">
                    <span className="text-[8.5px] font-bold uppercase tracking-wider text-[#64748b]">
                      Initial Machine Setup
                    </span>
                    <div className="mt-1 flex flex-col gap-1.5 text-[10px]">
                      <div>
                        <span className="text-[#64748b]">Start State: </span>
                        <code className="bg-[#0f172a] px-1.5 py-0.5 rounded text-[#60a5fa] font-bold font-mono border border-[#1e293b]">
                          {previewScenario.initialState}
                        </code>
                      </div>
                      <div className="flex items-center gap-1 flex-wrap">
                        <span className="text-[#64748b]">Accepting: </span>
                        {previewScenario.acceptStates.length > 0 ? (
                          previewScenario.acceptStates.map((s) => (
                            <code key={s} className="bg-[#0f172a] px-1.5 py-0.5 rounded text-emerald-400 font-bold font-mono border border-[#1e293b]">
                              {s}
                            </code>
                          ))
                        ) : (
                          <span className="text-text-muted font-mono font-bold text-[9px]">None</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="bg-[#1e293b]/10 p-3 rounded-lg border border-[#1e293b] flex flex-col gap-1">
                    <span className="text-[8.5px] font-bold uppercase tracking-wider text-[#64748b]">
                      Initial Tape Input
                    </span>
                    <div className="mt-1 flex flex-col gap-1">
                      <div className="font-mono text-center bg-[#090d16] p-1.5 rounded border border-[#1e293b]/60 font-bold text-[#60a5fa] text-[10.5px] overflow-x-auto whitespace-nowrap scrollbar-thin">
                        {previewScenario.initialTape || "EMPTY TAPE (_)"}
                      </div>
                      <span className="text-[7.5px] text-[#64748b] uppercase text-center mt-0.5 font-bold">
                        Head Start Position: index {previewScenario.initialHeadPosition || 0}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Transition Rules List */}
                <div className="flex flex-col gap-1.5 mt-1">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-[#64748b]">
                    Rules Matrix ({previewScenario.rules?.length || 0} transition{previewScenario.rules?.length !== 1 ? "s" : ""})
                  </span>
                  {previewScenario.rules && previewScenario.rules.length > 0 ? (
                    <div className="border border-[#1e293b] rounded-lg overflow-hidden bg-[#0a0f1d] max-h-[160px] overflow-y-auto no-scrollbar shadow-inner">
                      <table className="w-full border-collapse font-sans text-[10px]">
                        <thead>
                          <tr className="bg-[#111827] border-b border-[#1e293b] text-[#64748b] font-bold text-[8px] uppercase tracking-wider text-left">
                            <th className="p-2 pl-3">Current State</th>
                            <th className="p-2">Read</th>
                            <th className="p-2 text-center text-[#475569]">➔</th>
                            <th className="p-2">Next State</th>
                            <th className="p-2">Write</th>
                            <th className="p-2 pr-3">Move</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#1e293b]/40 font-mono">
                          {previewScenario.rules.map((rule, idx) => (
                            <tr key={rule.id || idx} className="hover:bg-[#1e293b]/30 transition-colors">
                              <td className="p-2 pl-3 text-white font-bold">{rule.currentState}</td>
                              <td className="p-2 text-[#60a5fa] font-bold">{rule.readSymbol === " " ? "_" : rule.readSymbol}</td>
                              <td className="p-2 text-center text-[#475569] font-sans">➔</td>
                              <td className="p-2 text-emerald-400 font-bold">{rule.nextState}</td>
                              <td className="p-2 text-purple-400 font-bold">{rule.writeSymbol === " " ? "_" : rule.writeSymbol}</td>
                              <td className="p-2 pr-3 font-sans font-bold">
                                {rule.moveDirection === "R" ? "⏩ Right" : rule.moveDirection === "L" ? "⏪ Left" : "⏺ Stay"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="border border-[#1e293b]/50 rounded-lg p-3 bg-[#0a0f1d]/55 text-center text-[#475569] font-sans uppercase text-[8px] tracking-widest font-extrabold">
                      Rules Studio Custom Scripted Setup
                    </div>
                  )}
                </div>
              </div>

              {/* Footer action buttons */}
              <div className="p-4 bg-[#0a0f1d] border-t border-[#1e293b] flex items-center justify-end gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setPreviewScenario(null)}
                  className="px-4 py-2 bg-transparent hover:bg-[#1e293b] border border-[#1e293b] text-[#94a3b8] hover:text-white rounded font-bold text-[10px] uppercase tracking-wider transition-all cursor-pointer border-0"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleLoadToActive(previewScenario);
                    setPreviewScenario(null);
                  }}
                  className="px-4 py-2 bg-[#1d4ed8] hover:bg-blue-600 text-white rounded font-bold text-[10px] uppercase tracking-wider transition-all flex items-center gap-1.5 shadow cursor-pointer border-0"
                >
                  <Plus size={11} /> Load Workspace
                </button>
              </div>
            </div>
          </div>
        )}
          </AnimatePresence>

          <AnimatePresence>
            {isSaveModalOpen && (
              <SaveScenarioModal
                isOpen={isSaveModalOpen}
                onClose={() => setIsSaveModalOpen(false)}
                onSave={handleSavePreset}
                defaultName={activeInstanceDetails ? activeInstanceDetails.name : "My Custom Preset"}
                existingTags={existingTags}
              />
            )}
          </AnimatePresence>
        </>,
        document.body
      )}
    </aside>
  );
};
