"use client";

import { useConfig } from '@/context/ConfigContext';

interface TipSelectorProps {
  selectedTip: number | null;
  onSelectTip: (tip: number | null) => void;
}

export function TipSelector({ selectedTip, onSelectTip }: TipSelectorProps) {
  const { config } = useConfig();

  if (!config.tipsEnabled) return null;

  const getEmoji = (percent: number) => {
    if (percent <= 5) return '😐';
    if (percent <= 15) return '🙂';
    return '🤩';
  };

  const tipOptions = config.tipPercentages.map(val => ({
    val,
    emoji: getEmoji(val),
    label: `${val}%`,
    isIcon: false
  })).concat({ val: null as any, emoji: 'add', label: 'Otro', isIcon: true });

  return (
    <section className="px-5 py-4">
      <h3 className="text-slate-900 dark:text-white text-lg font-bold leading-tight tracking-tight mb-4">Recompensa al equipo</h3>
      <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${tipOptions.length}, minmax(0, 1fr))` }}>
        {tipOptions.map(tip => {
          const isSelected = selectedTip === tip.val;
          return (
            <button
              key={tip.label}
              onClick={() => onSelectTip(tip.val)}
              className={`flex flex-col items-center justify-center py-2 px-1 rounded-2xl border-2 transition-all active:scale-95 ${
                isSelected 
                  ? 'bg-primary/10 dark:bg-primary/20 border-primary text-primary shadow-[0_4px_12px_-4px_rgba(var(--color-primary-rgb),0.2)]' 
                  : 'border-slate-100 dark:border-white/5 bg-white dark:bg-white/5 hover:border-slate-300 dark:hover:border-white/20 text-slate-500 dark:text-slate-400'
              }`}
            >
              {tip.isIcon ? (
                <span className={`material-symbols-outlined mb-1 text-[24px] ${isSelected ? 'text-primary' : 'text-slate-400 dark:text-slate-500'}`}>
                  {tip.emoji}
                </span>
              ) : (
                <span className="text-[22px] mb-1">{tip.emoji}</span>
              )}
              <span className={`text-[13px] font-bold ${isSelected ? 'text-primary' : 'text-slate-600 dark:text-slate-400'}`}>
                {tip.label}
              </span>
            </button>
          )
        })}
      </div>
    </section>
  );
}
