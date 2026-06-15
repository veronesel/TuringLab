import React from 'react';
import { X, Settings2, Palette, Sparkles, HelpCircle, Volume2, VolumeX, LayoutGrid, Target, Film } from 'lucide-react';
import { useThemeStore, DiagramTheme } from '../../store/themeStore';
import { playSubtleClick } from '../../utils/audio';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const { 
    diagramTheme, 
    setDiagramTheme, 
    themeMode, 
    soundEnabled, 
    setSoundEnabled, 
    autoArrangeEnabled, 
    setAutoArrangeEnabled,
    showExpectedOutcome,
    setShowExpectedOutcome,
    showExecutionTimeline,
    setShowExecutionTimeline
  } = useThemeStore();

  if (!isOpen) return null;

  const themes: Array<{
    id: DiagramTheme;
    name: string;
    description: string;
    icon: React.ReactNode;
    badgeBg: string;
    badgeText: string;
  }> = [
    {
      id: 'classic',
      name: 'Workspace Classic',
      description: 'Default state diagram styles synchronized with the current application mode and selected colors.',
      icon: <Palette size={16} className="text-primary-base" />,
      badgeBg: 'bg-primary-base/10',
      badgeText: 'text-primary-base',
    },
    {
      id: 'high-contrast',
      name: 'High Contrast',
      description: 'Pitch black/white background, sharp 3px solid borders, and neon active feedback for maximum legibility.',
      icon: <Settings2 size={16} className="text-[#3b82f6] dark:text-[#facc15]" />,
      badgeBg: 'bg-[#3b82f6]/10 dark:bg-[#facc15]/10',
      badgeText: 'text-[#3b82f6] dark:text-[#facc15]',
    },
    {
      id: 'minimal',
      name: 'Minimal Style',
      description: 'Seamless canvas without solid node fills, thin 1px borders, and ultra-subtle connecting lines.',
      icon: <HelpCircle size={16} className="text-text-secondary" />,
      badgeBg: 'bg-bg-element',
      badgeText: 'text-text-muted',
    },
    {
      id: 'vibrant',
      name: 'Vibrant Energy',
      description: 'Lush gradient backgrounds, glowing active state drop shadows, and animated neon connectors.',
      icon: <Sparkles size={16} className="text-pink-500" />,
      badgeBg: 'bg-pink-500/10',
      badgeText: 'text-pink-500',
    },
  ];

  return (
    <div className="fixed inset-0 z-[200] bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-bg-panel border border-border-main w-full max-w-lg rounded-xl shadow-2xl flex flex-col max-h-[90vh] p-6 relative overflow-hidden">
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-element transition-all"
          title="Close Settings"
        >
          <X size={18} />
        </button>

        <div className="flex items-center gap-3 mb-4 shrink-0">
          <div className="bg-primary-base/20 p-2 rounded-lg text-primary-base">
            <Settings2 size={22} className="animate-spin-slow" />
          </div>
          <div>
            <h2 className="text-base font-bold text-text-primary">Simulation Settings</h2>
            <p className="text-[10px] text-text-secondary">Configure the visualization dashboard settings</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto space-y-4 pr-1 min-h-0 [scrollbar-width:thin]">
          <div className="space-y-4">
            <div className="border-b border-border-main/50 pb-2">
              <h3 className="text-xs font-bold text-text-secondary uppercase tracking-wider">
                State Diagram Theme
              </h3>
              <p className="text-[10px] text-text-muted mt-0.5">
                Updates the CSS variables, nodes, and transition edges in the active state diagram.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3 pr-1">
            {themes.map((theme) => {
              const isSelected = diagramTheme === theme.id;
              return (
                <button
                  key={theme.id}
                  onClick={() => setDiagramTheme(theme.id)}
                  className={`flex flex-col text-left p-3.5 rounded-lg border transition-all relative ${
                    isSelected
                      ? 'bg-bg-surface border-primary-base shadow-md ring-1 ring-primary-base/50'
                      : 'bg-bg-surface/40 hover:bg-bg-surface/80 border-border-main hover:border-border-active'
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-1.5">
                    <div className="flex items-center gap-2">
                      <div className="p-1 rounded bg-bg-panel border border-border-main">
                        {theme.icon}
                      </div>
                      <span className="text-xs font-bold text-text-primary">{theme.name}</span>
                    </div>
                    <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider ${theme.badgeBg} ${theme.badgeText}`}>
                      {theme.id}
                    </span>
                  </div>
                  <span className="text-[10px] leading-relaxed text-text-secondary">
                    {theme.description}
                  </span>
                  
                  {isSelected && (
                    <div className="absolute right-3 bottom-3 flex items-center justify-center">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary-base animate-pulse" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Sound Settings */}
        <div className="border-t border-border-main/50 pt-4 mt-4">
          <div className="flex items-center justify-between pb-1 flex-wrap sm:flex-nowrap gap-4">
            <div>
              <h3 className="text-xs font-bold text-text-secondary uppercase tracking-wider flex items-center gap-1.5">
                {soundEnabled ? (
                  <Volume2 size={13} className="text-primary-base animate-pulse" />
                ) : (
                  <VolumeX size={13} className="text-text-muted" />
                )}
                Audio Feedback
              </h3>
              <p className="text-[10px] text-text-muted mt-0.5">
                Triggers a subtle tactile click sound when the Turing machine performs a step or transitions states.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                const nextVal = !soundEnabled;
                setSoundEnabled(nextVal);
                if (nextVal) {
                  playSubtleClick();
                }
              }}
              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                soundEnabled ? 'bg-primary-base' : 'bg-bg-element'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                  soundEnabled ? 'translate-x-4' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Auto-Arrange Layout Settings */}
        <div className="border-t border-border-main/50 pt-4 mt-4">
          <div className="flex items-center justify-between pb-1 flex-wrap sm:flex-nowrap gap-4">
            <div>
              <h3 className="text-xs font-bold text-text-secondary uppercase tracking-wider flex items-center gap-1.5">
                <LayoutGrid size={13} className={autoArrangeEnabled ? "text-primary-base animate-pulse" : "text-text-muted"} />
                Auto-Arrange Layout
              </h3>
              <p className="text-[10px] text-text-muted mt-0.5">
                Automatically organize state diagram nodes into a clean spacing layout whenever the rules or active scenario change.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                const nextVal = !autoArrangeEnabled;
                setAutoArrangeEnabled(nextVal);
                if (soundEnabled) {
                  playSubtleClick();
                }
              }}
              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                autoArrangeEnabled ? 'bg-primary-base' : 'bg-bg-element'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                  autoArrangeEnabled ? 'translate-x-4' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Expected Outcome Calibration */}
        <div className="border-t border-border-main/50 pt-4 mt-4">
          <div className="flex items-center justify-between pb-1 flex-wrap sm:flex-nowrap gap-4">
            <div>
              <h3 className="text-xs font-bold text-text-secondary uppercase tracking-wider flex items-center gap-1.5">
                <Target size={13} className={showExpectedOutcome ? "text-primary-base" : "text-text-muted"} />
                Show Expected Outcome Calibration
              </h3>
              <p className="text-[10px] text-text-muted mt-0.5">
                Displays the progress tracking, baseline calibration, and outcome analysis goals within the tape panel.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                const nextVal = !showExpectedOutcome;
                setShowExpectedOutcome(nextVal);
                if (soundEnabled) {
                  playSubtleClick();
                }
              }}
              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                showExpectedOutcome ? 'bg-primary-base' : 'bg-bg-element'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                  showExpectedOutcome ? 'translate-x-4' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Execution Spectrum Timeline */}
        <div className="border-t border-border-main/50 pt-4 mt-4">
          <div className="flex items-center justify-between pb-1 flex-wrap sm:flex-nowrap gap-4">
            <div>
              <h3 className="text-xs font-bold text-text-secondary uppercase tracking-wider flex items-center gap-1.5">
                <Film size={13} className={showExecutionTimeline ? "text-primary-base" : "text-text-muted"} />
                Show Execution Spectrum Timeline
              </h3>
              <p className="text-[10px] text-text-muted mt-0.5">
                Displays the visual scrubbing ribbon overlaying the colored states graph to fast-forward/rewind historical simulation states.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                const nextVal = !showExecutionTimeline;
                setShowExecutionTimeline(nextVal);
                if (soundEnabled) {
                  playSubtleClick();
                }
              }}
              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                showExecutionTimeline ? 'bg-primary-base' : 'bg-bg-element'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                  showExecutionTimeline ? 'translate-x-4' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        </div>

        <div className="mt-6 pt-4 border-t border-border-main/60 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-primary-base text-bg-base font-bold text-[11px] rounded hover:bg-primary-dark transition-all shadow-sm tracking-wider uppercase"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
