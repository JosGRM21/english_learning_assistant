import { useState } from 'react';
import { Compass, Split } from 'lucide-react';
import { MotionVerbsStudio } from './MotionVerbsStudio';
import { PolysemyStudio } from './PolysemyStudio';

export function SemanticsStudio() {
  const [activeSubTab, setActiveSubTab] = useState<'motion' | 'polysemy'>('motion');

  return (
    <div className="space-y-6">
      {/* Subtab Navigation Bar */}
      <div className="flex items-center gap-2 p-1.5 bg-gray-100 dark:bg-[#131722] rounded-2xl w-fit border border-gray-200 dark:border-gray-800">
        <button
          onClick={() => setActiveSubTab('motion')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === 'motion'
              ? 'bg-white dark:bg-[#1C2230] text-indigo-600 dark:text-indigo-400 shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <Compass className="w-4 h-4" />
          <span>Verbos de Movimiento</span>
        </button>

        <button
          onClick={() => setActiveSubTab('polysemy')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === 'polysemy'
              ? 'bg-white dark:bg-[#1C2230] text-purple-600 dark:text-purple-400 shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <Split className="w-4 h-4" />
          <span>Diferencias de Significado (Polisemia)</span>
        </button>
      </div>

      {activeSubTab === 'motion' ? <MotionVerbsStudio /> : <PolysemyStudio />}
    </div>
  );
}
