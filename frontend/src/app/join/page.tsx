"use client";

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Avatar } from '@/components/ui/Avatar';

export default function JoinPage() {
  const [name, setName] = useState('');
  const router = useRouter();

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      router.push('/menu');
    }
  };

  // Animation variants for staggered entrance
  const containerVariants: import('framer-motion').Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants: import('framer-motion').Variants = {
    hidden: { opacity: 0, y: 20 },
    show: { 
      opacity: 1, 
      y: 0,
      transition: { type: 'spring', stiffness: 300, damping: 24 }
    }
  };

  return (
    <div className="bg-background-light dark:bg-background-dark font-display text-slate-900 dark:text-slate-100 min-h-screen flex flex-col">
      <div className="relative flex min-h-screen w-full flex-col overflow-hidden">
        
        <motion.header 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="flex items-center justify-between p-6 pt-12"
        >
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 text-primary shadow-inner">
            <span className="material-symbols-outlined text-3xl">restaurant</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-wider shadow-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            En Vivo
          </div>
        </motion.header>

        <motion.main 
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="flex-1 flex flex-col items-center px-6 pt-8 gap-8"
        >
          <motion.div variants={itemVariants} className="flex flex-col items-center gap-6 w-full">
            
            <div className="relative h-32 w-32 group">
              {/* Pulsing glow background behind avatar */}
              <div className="absolute inset-0 rounded-full bg-primary/30 blur-xl animate-[pulse_3s_ease-in-out_infinite] transition-all duration-700" />
              
              <AnimatePresence mode="popLayout">
                <motion.div
                  key={name.trim() || 'default'}
                  initial={{ scale: 0, rotate: -45 }}
                  animate={{ scale: 1, rotate: 0 }}
                  exit={{ scale: 0, opacity: 0 }}
                  transition={{ type: "spring", stiffness: 260, damping: 20 }}
                  className="relative z-10 shadow-xl shadow-primary/20 border-4 border-background-light dark:border-background-dark/50 rounded-full"
                >
                  <Avatar alias={name} size="xl" />
                </motion.div>
              </AnimatePresence>
              
              <motion.button 
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="absolute bottom-0 right-0 z-20 bg-background-light dark:bg-background-dark border-2 border-primary w-11 h-11 rounded-full flex items-center justify-center shadow-lg text-primary hover:bg-primary hover:text-white transition-colors"
                aria-label="Cambiar foto de perfil"
                type="button"
              >
                <span className="material-symbols-outlined text-xl">add_a_photo</span>
              </motion.button>
            </div>

            <div className="text-center space-y-2">
              <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                ¡Bienvenido!
              </h1>
              <p className="text-slate-500 dark:text-primary/70 text-base font-medium">
                Personaliza tu perfil para empezar
              </p>
            </div>
          </motion.div>

          <motion.form variants={itemVariants} onSubmit={handleJoin} className="w-full space-y-6 mt-4">
            <div className="flex flex-col gap-2 group/input">
              <label 
                htmlFor="nameInput"
                className="text-sm font-semibold text-slate-600 dark:text-slate-400 ml-1 transition-colors group-focus-within/input:text-primary"
              >
                ¿Cómo te llamas?
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-4 material-symbols-outlined text-slate-400 transition-colors group-focus-within/input:text-primary z-10">person</span>
                <input 
                  id="nameInput"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="form-input w-full pl-12 pr-4 h-14 bg-white/60 dark:bg-white/5 border-2 border-transparent dark:border-white/5 rounded-2xl focus:bg-white dark:focus:bg-background-dark focus:ring-4 focus:ring-primary/20 focus:border-primary text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-all outline-none font-medium shadow-sm hover:bg-white dark:hover:bg-white/10" 
                  placeholder="Escribe tu nombre o apodo"
                  name="username"
                  autoComplete="off"
                />
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group/card shadow-slate-200/50 dark:shadow-none">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/5 to-primary/0 translate-x-[-100%] group-hover/card:translate-x-[100%] transition-transform duration-1000"></div>
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0 relative z-10">
                <span className="material-symbols-outlined">table_restaurant</span>
              </div>
              <div className="relative z-10">
                <p className="text-sm font-bold text-slate-900 dark:text-white">Mesa Reservada</p>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Restaurante "El Círculo" • Mesa #4</p>
              </div>
            </div>
          </motion.form>
        </motion.main>

        <motion.footer 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6, ease: 'easeOut' }}
          className="p-6 pb-10 w-full"
        >
          <motion.button 
            type="submit"
            onClick={handleJoin}
            disabled={!name.trim()}
            whileHover={name.trim() ? { scale: 1.02 } : {}}
            whileTap={name.trim() ? { scale: 0.98 } : {}}
            className="group w-full h-14 bg-primary text-white font-bold text-lg rounded-2xl flex items-center justify-center gap-2 transition-all outline-none shadow-[0_8px_30px_rgb(244,123,37,0.3)] disabled:shadow-none disabled:bg-slate-200 dark:disabled:bg-white/10 disabled:text-slate-400 dark:disabled:text-slate-500 focus:ring-4 focus:ring-primary/30"
            aria-label="Unirse a la mesa"
          >
            <span>Unirme a la Mesa #4</span>
            <span className={`text-xl transition-all duration-300 ${name.trim() ? 'translate-x-0 opacity-100 group-hover:translate-x-1 group-hover:-translate-y-1' : '-translate-x-4 opacity-0'}`}>🚀</span>
          </motion.button>
          
          <p className="text-center text-xs font-medium text-slate-500 dark:text-slate-500 mt-4">
            Al unirte, aceptas nuestras Condiciones de Servicio
          </p>
        </motion.footer>

      </div>
    </div>
  );
}
