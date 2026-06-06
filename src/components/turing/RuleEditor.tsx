import React, { useState } from 'react';
import { useTMStore } from '../../store/tmStore';
import { TMRule, Direction } from '../../types/tm';
import { v4 as uuidv4 } from 'uuid';
import { Plus, Trash2, Save } from 'lucide-react';

export const RuleEditor: React.FC = () => {
  const rules = useTMStore(state => state.rules);
  const setRules = useTMStore(state => state.setRules);
  const lastRuleId = useTMStore(state => state.lastRuleId);
  const isRunning = useTMStore(state => state.isRunning);

  const [localRules, setLocalRules] = useState<TMRule[]>(rules);

  // Sync when store rules change (like loading a new scenario)
  React.useEffect(() => {
    setLocalRules(rules);
  }, [rules]);

  const updateRule = (id: string, field: keyof TMRule, value: string) => {
    setLocalRules(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r));
  };

  const addRule = () => {
    setLocalRules(prev => [...prev, {
      id: uuidv4(),
      currentState: "q0",
      readSymbol: "0",
      nextState: "q0",
      writeSymbol: "0",
      moveDirection: "R"
    }]);
  };

  const removeRule = (id: string) => {
    setLocalRules(prev => prev.filter(r => r.id !== id));
  };

  const saveRules = () => {
    setRules(localRules);
  };

  const hasChanges = JSON.stringify(rules) !== JSON.stringify(localRules);

  return (
    <div className="flex flex-col flex-1 overflow-hidden font-mono">
      <div className="p-3 bg-bg-panel border-b border-border-main flex justify-between items-center shrink-0">
        <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted font-sans">Instructions / Rules</span>
        <div className="flex gap-2 font-sans">
          <button 
            onClick={addRule} 
            disabled={isRunning} 
            className="px-2 py-0.5 bg-green-900/30 text-green-500 text-[9px] border border-green-500/30 rounded hover:bg-green-900/50 disabled:opacity-50 transition-colors"
          >
            + Add Rule
          </button>
          <button 
            onClick={saveRules} 
            disabled={!hasChanges || isRunning} 
            className={`px-2 py-0.5 text-[9px] border rounded transition-colors ${hasChanges ? 'bg-amber-900/30 text-primary-base border-primary-base/30 hover:bg-amber-900/50' : 'bg-transparent text-text-faint border-transparent'}`}
          >
            Save Changes
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto text-[10px] p-2">
        <table className="w-full">
          <thead className="text-text-muted border-b border-border-main text-left sticky top-0 bg-bg-surface z-10">
            <tr>
              <th className="pb-1 font-normal w-1/5">ST</th>
              <th className="pb-1 font-normal w-[15%]">IN</th>
              <th className="pb-1 font-normal w-[15%]">OUT</th>
              <th className="pb-1 font-normal w-[15%]">MV</th>
              <th className="pb-1 font-normal w-1/5">NST</th>
              <th className="pb-1 font-normal w-[10%]"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#161B22]">
            {localRules.map(rule => {
              const isActive = lastRuleId === rule.id;
              return (
                <tr key={rule.id} className={isActive ? 'bg-primary-base/10 text-primary-base' : 'text-text-secondary hover:bg-bg-panel'}>
                  <td className="py-1">
                    <input 
                      value={rule.currentState} 
                      onChange={e => updateRule(rule.id, 'currentState', e.target.value)}
                      disabled={isRunning}
                      className="w-full bg-transparent outline-none focus:bg-bg-element rounded px-1 -ml-1 text-inherit"
                    />
                  </td>
                  <td className="py-1 font-bold">
                    <input 
                      value={rule.readSymbol} 
                      onChange={e => updateRule(rule.id, 'readSymbol', e.target.value)}
                      disabled={isRunning}
                      maxLength={1}
                      className="w-full bg-transparent outline-none focus:bg-bg-element rounded px-1 -ml-1 text-inherit text-center"
                    />
                  </td>
                  <td className="py-1">
                    <input 
                      value={rule.writeSymbol} 
                      onChange={e => updateRule(rule.id, 'writeSymbol', e.target.value)}
                      disabled={isRunning}
                      maxLength={1}
                      className="w-full bg-transparent outline-none focus:bg-bg-element rounded px-1 -ml-1 text-inherit text-center"
                    />
                  </td>
                  <td className="py-1 font-bold">
                    <select 
                      value={rule.moveDirection}
                      onChange={e => updateRule(rule.id, 'moveDirection', e.target.value as Direction)}
                      disabled={isRunning}
                      className="w-full bg-transparent outline-none focus:bg-bg-element rounded text-inherit appearance-none cursor-pointer"
                    >
                      <option className="bg-bg-panel" value="L">L</option>
                      <option className="bg-bg-panel" value="R">R</option>
                      <option className="bg-bg-panel" value="S">-</option>
                    </select>
                  </td>
                  <td className="py-1">
                    <input 
                      value={rule.nextState} 
                      onChange={e => updateRule(rule.id, 'nextState', e.target.value)}
                      disabled={isRunning}
                      className="w-full bg-transparent outline-none focus:bg-bg-element rounded px-1 -ml-1 text-inherit"
                    />
                  </td>
                  <td className="py-1 text-right">
                    <button onClick={() => removeRule(rule.id)} disabled={isRunning} className="text-red-900/50 hover:text-red-500 disabled:opacity-50 transition-colors">
                      <Trash2 size={12} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
