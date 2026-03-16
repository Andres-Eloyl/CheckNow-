"use client";

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useConfig } from '@/context/ConfigContext';
import { Toast, useToast } from '@/components/ui/Toast';

export default function ConfigPage() {
  const router = useRouter();
  const { config, updateConfig } = useConfig();
  const { toast } = useToast();
  
  // Local state for the form, to allow cancelling changes (if we wanted to, though auto-save is nice too)
  // We'll use local state and a save button for a more deliberate feel.
  const [localConfig, setLocalConfig] = useState(config);

  const predefinedColors = ['#f47b25', '#25a3f4', '#f4255d', '#25f496', '#9b25f4'];

  const handleSave = () => {
    updateConfig(localConfig);
    toast('Configuración guardada exitosamente.', 'success');
  };

  return (
    <div className="bg-slate-50 dark:bg-[#0A0A0B] min-h-screen text-slate-900 dark:text-slate-100 font-display font-medium">
      <header className="flex items-center px-6 py-5 border-b border-slate-200 dark:border-white/5 bg-white/80 dark:bg-[#0A0A0B]/80 backdrop-blur-md sticky top-0 z-10 p-safe-top">
        <button 
          onClick={() => router.back()} 
          className="mr-4 size-10 flex items-center justify-center rounded-full bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 transition-colors"
        >
          <span className="material-symbols-outlined text-[20px]">arrow_back</span>
        </button>
        <h1 className="text-xl font-bold tracking-tight">Personalización</h1>
      </header>
      
      <main className="max-w-xl mx-auto p-4 space-y-6 pb-24">
        <motion.div 
          initial={{ opacity: 0, y: 10 }} 
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-[#151517] rounded-[24px] p-5 shadow-sm border border-slate-100 dark:border-white/5"
        >
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">storefront</span>
            Marca y Estilo
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-slate-500 dark:text-slate-400 mb-2">Nombre del Restaurante</label>
              <input 
                type="text" 
                value={localConfig.restaurantName}
                onChange={e => setLocalConfig(prev => ({ ...prev, restaurantName: e.target.value }))}
                className="w-full bg-slate-50 dark:bg-[#0A0A0B] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              />
            </div>

            <div>
              <label className="block text-sm text-slate-500 dark:text-slate-400 mb-2">Color Principal</label>
              <div className="flex gap-3">
                {predefinedColors.map(color => (
                  <button
                    key={color}
                    onClick={() => setLocalConfig(prev => ({ ...prev, primaryColor: color }))}
                    className={`size-10 rounded-full border-2 transition-all ${localConfig.primaryColor === color ? 'border-slate-400 dark:border-white scale-110' : 'border-transparent'}`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
            {/* Visualizer of the theme */}
            <div className="mt-4 p-4 rounded-xl border border-slate-100 dark:border-white/10" style={{ '--color-primary': localConfig.primaryColor } as React.CSSProperties}>
                <div className="flex items-center gap-3">
                   <div className="size-12 rounded-full bg-[var(--color-primary)] opacity-20 flex-shrink-0"></div>
                   <div className="flex-1">
                      <div className="h-4 w-2/3 bg-slate-200 dark:bg-white/10 rounded mb-2"></div>
                      <div className="h-3 w-1/3 bg-slate-100 dark:bg-white/5 rounded"></div>
                   </div>
                   <div className="px-3 py-1.5 rounded-full text-xs font-bold bg-[var(--color-primary)] text-white">Prueba</div>
                </div>
            </div>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 10 }} 
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-[#151517] rounded-[24px] p-5 shadow-sm border border-slate-100 dark:border-white/5"
        >
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">volunteer_activism</span>
              Propinas
            </h2>
            <button 
                onClick={() => setLocalConfig(prev => ({ ...prev, tipsEnabled: !prev.tipsEnabled }))}
                className={`w-12 h-6 rounded-full p-1 transition-colors ${localConfig.tipsEnabled ? 'bg-primary' : 'bg-slate-300 dark:bg-white/20'}`}
            >
                <motion.div 
                    initial={false}
                    animate={{ x: localConfig.tipsEnabled ? 24 : 0 }}
                    className="size-4 bg-white rounded-full shadow-sm"
                />
            </button>
          </div>

          <AnimatePresence>
            {localConfig.tipsEnabled && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-4 overflow-hidden"
              >
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                  Personaliza los porcentajes sugeridos de propina para tus clientes.
                </p>
                <div className="grid grid-cols-3 gap-3">
                  {localConfig.tipPercentages.map((percent, i) => (
                    <div key={i} className="relative">
                      <input 
                        type="number" 
                        value={percent}
                        onChange={e => {
                          const val = Math.max(0, parseInt(e.target.value) || 0);
                          const currentTipPercentages = [...localConfig.tipPercentages];
                          currentTipPercentages[i] = val;
                          setLocalConfig(prev => ({...prev, tipPercentages: currentTipPercentages}));
                        }}
                        className="w-full bg-slate-50 dark:bg-[#0A0A0B] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-center text-lg font-bold outline-none focus:ring-2 focus:ring-primary/50"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">%</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </main>

      <div className="fixed bottom-0 left-0 right-0 p-4 border-t border-slate-200 dark:border-white/5 bg-white/80 dark:bg-[#0A0A0B]/80 backdrop-blur-xl z-20 pb-safe-bottom">
        <button 
          onClick={handleSave}
          className="w-full max-w-xl mx-auto block bg-primary hover:bg-primary/90 text-white font-bold text-lg h-14 rounded-2xl shadow-[0_8px_24px_rgba(244,123,37,0.3)] active:scale-[0.98] transition-all"
          style={{ backgroundColor: localConfig.primaryColor, boxShadow: `0 8px 24px ${localConfig.primaryColor}40` }}
        >
          Guardar Cambios
        </button>
      </div>
    </div>
  );
}
