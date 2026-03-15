"use client";

interface TipSelectorProps {
  selectedTip: number | null;
  onSelectTip: (tip: number | null) => void;
}

export function TipSelector({ selectedTip, onSelectTip }: TipSelectorProps) {
  return (
    <section className="px-5 py-4">
      <h3 className="text-slate-900 dark:text-white text-lg font-bold leading-tight tracking-tight mb-4">Recompensa al equipo</h3>
      <div className="grid grid-cols-4 gap-3">
        {[
          { val: 10, emoji: '😐', label: '10%' },
          { val: 15, emoji: '🙂', label: '15%' },
          { val: 20, emoji: '🤩', label: '20%' },
          { val: null, emoji: 'add', label: 'Otro', isIcon: true }
        ].map(tip => {
          const isSelected = selectedTip === tip.val;
          return (
            <button
              key={tip.label}
              onClick={() => onSelectTip(tip.val)}
              className={`flex flex-col items-center justify-center aspect-square rounded-2xl border-2 transition-all active:scale-95 ${
                isSelected 
                  ? 'bg-primary/10 dark:bg-primary/20 border-primary text-primary shadow-[0_4px_12px_-4px_rgba(244,123,37,0.2)]' 
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
