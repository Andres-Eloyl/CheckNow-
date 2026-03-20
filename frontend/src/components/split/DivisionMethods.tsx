"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useOrder } from '@/hooks/useOrder';
import { useSession } from '@/context/SessionContext';
import { Avatar } from '@/components/ui/Avatar';
import type { OrderItemResponse } from '@/types/api.types';

export type SplitMethod = 'mine' | 'split' | 'gift' | null;

interface DivisionMethodsProps {
  onMethodChange: (method: SplitMethod, finalToPay: number) => void;
}

export function DivisionMethods({ onMethodChange }: DivisionMethodsProps) {
  const [selectedMethod, setSelectedMethod] = useState<SplitMethod>(null);
  const [selectedSplitFriends, setSelectedSplitFriends] = useState<string[]>([]);
  const [selectedGiftFriends, setSelectedGiftFriends] = useState<string[]>([]);

  const { myTotal, tableTotal, orders } = useOrder();
  const { session, currentUser } = useSession();

  // Other users in the session (exclude current user)
  const otherUsers = (session?.users || []).filter(u => u.id !== currentUser?.id);

  const toggleSplitFriend = (id: string) => {
    setSelectedSplitFriends(prev => prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]);
  };

  const toggleGiftFriend = (id: string) => {
    setSelectedGiftFriends(prev => prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]);
  };

  useEffect(() => {
    let finalToPay = tableTotal;
    if (selectedMethod === 'mine') finalToPay = myTotal;
    if (selectedMethod === 'split') {
      const sharedTotal = tableTotal - myTotal;
      const splitCount = selectedSplitFriends.length + 1;
      finalToPay = myTotal + (selectedSplitFriends.length > 0 ? (sharedTotal / splitCount) : 0);
    }
    if (selectedMethod === 'gift') {
      let friendsTotal = 0;
      selectedGiftFriends.forEach((fId: string) => {
        const ft = orders
          .filter((i: OrderItemResponse) => i.session_user_id === fId)
          .reduce((acc: number, i: OrderItemResponse) => acc + i.unit_price * i.quantity, 0);
        friendsTotal += ft;
      });
      finalToPay = myTotal + friendsTotal;
    }
    
    onMethodChange(selectedMethod, finalToPay);
  }, [selectedMethod, selectedSplitFriends, selectedGiftFriends, myTotal, tableTotal, orders, onMethodChange]);

  const currentFinalPay = (): number => {
     if (selectedMethod === 'mine') return myTotal;
     if (selectedMethod === 'split') return myTotal + ((tableTotal - myTotal) / (selectedSplitFriends.length + 1));
     if (selectedMethod === 'gift') {
       return myTotal + selectedGiftFriends.reduce((acc: number, fId: string) => 
         acc + orders.filter((i: OrderItemResponse) => i.session_user_id === fId).reduce((a: number, i: OrderItemResponse) => a + i.unit_price * i.quantity, 0), 0);
     }
     return tableTotal;
  };
  const finalToPay = currentFinalPay();

  return (
    <div className="flex flex-col gap-4">
      
      {/* Card 1: Lo Mío */}
      <motion.button 
        animate={selectedMethod === 'mine' ? { scale: 1.02 } : selectedMethod ? { scale: 0.95, opacity: 0.6 } : {}}
        onClick={() => setSelectedMethod('mine')}
        className={`group relative flex flex-col justify-between gap-4 rounded-xl p-6 shadow-sm border transition-all text-left overflow-hidden ${
          selectedMethod === 'mine' ? 'bg-slate-50 dark:bg-slate-800 border-primary' : 'bg-white dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/50 hover:border-primary'
        }`}
      >
        <div className="relative z-10 w-full flex items-center justify-between">
          <div className="flex items-center gap-5">
            <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-primary text-white">
              <span className="material-symbols-outlined text-3xl">person</span>
            </div>
            <div className="flex flex-col gap-1">
              <p className="text-slate-900 dark:text-slate-100 text-xl font-bold leading-tight">Lo Mío</p>
              <p className="text-slate-500 dark:text-slate-400 text-sm font-normal">Paga solo lo que consumiste</p>
            </div>
          </div>
          <div className={`flex items-center text-primary transition-opacity ${selectedMethod === 'mine' ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
            <span className="material-symbols-outlined">check_circle</span>
          </div>
        </div>
        
        <AnimatePresence>
          {selectedMethod === 'mine' && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="relative z-10 w-full border-t border-slate-200 dark:border-slate-700 pt-4 mt-2"
            >
              <div className="flex justify-between items-center text-lg font-bold text-slate-900 dark:text-white">
                <span>Total a pagar</span>
                <span className="text-primary text-2xl">${finalToPay.toFixed(2)}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Card 2: A Medias */}
      <motion.button 
        animate={selectedMethod === 'split' ? { scale: 1.02 } : selectedMethod ? { scale: 0.95, opacity: 0.6 } : {}}
        onClick={() => setSelectedMethod('split')}
        className={`group relative flex flex-col justify-between gap-4 rounded-xl p-6 shadow-sm border transition-all text-left overflow-hidden ${
          selectedMethod === 'split' ? 'bg-slate-50 dark:bg-slate-800 border-primary' : 'bg-white dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/50 hover:border-primary'
        }`}
      >
        <div className="relative z-10 w-full flex items-center justify-between">
          <div className="flex items-center gap-5">
            <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-primary/20 text-primary">
              <span className="material-symbols-outlined text-3xl">local_pizza</span>
            </div>
            <div className="flex flex-col gap-1">
              <p className="text-slate-900 dark:text-slate-100 text-xl font-bold leading-tight">A Medias</p>
              <p className="text-slate-500 dark:text-slate-400 text-sm font-normal">Divide la cuenta en partes iguales</p>
            </div>
          </div>
          <div className={`flex items-center text-primary transition-opacity ${selectedMethod === 'split' ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
            <span className="material-symbols-outlined">check_circle</span>
          </div>
        </div>

        <AnimatePresence>
          {selectedMethod === 'split' && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="relative z-10 w-full border-t border-slate-200 dark:border-slate-700 pt-4 mt-2"
            >
              <p className="font-medium mb-3 text-slate-800 dark:text-slate-200">¿Con quién divides el resto de la mesa?</p>
              <div className="flex gap-2 mb-4">
                {otherUsers.map(user => (
                  <div 
                    key={user.id} 
                    onClick={(e) => { e.stopPropagation(); toggleSplitFriend(user.id); }}
                    className={`flex flex-col items-center gap-2 p-2 rounded-2xl border-2 transition-all cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/80 ${
                      selectedSplitFriends.includes(user.id) ? 'bg-primary/10 border-primary' : 'border-transparent bg-slate-200 dark:bg-slate-700'
                    }`}
                  >
                    <Avatar alias={user.alias} size="lg" />
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{user.alias}</span>
                  </div>
                ))}
              </div>
              <div className="flex justify-between items-center text-lg font-bold text-slate-900 dark:text-white">
                <span>Total a pagar</span>
                <span className="text-primary text-2xl">${finalToPay.toFixed(2)}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Card 3: Yo Invito */}
      <motion.button 
        animate={selectedMethod === 'gift' ? { scale: 1.02 } : selectedMethod ? { scale: 0.95, opacity: 0.6 } : {}}
        onClick={() => setSelectedMethod('gift')}
        className={`group relative flex flex-col justify-between gap-4 rounded-xl p-6 shadow-sm border transition-all text-left overflow-hidden ${
          selectedMethod === 'gift' ? 'bg-slate-50 dark:bg-slate-800 border-primary' : 'bg-white dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/50 hover:border-primary'
        }`}
      >
        <div className="relative z-10 w-full flex items-center justify-between">
          <div className="flex items-center gap-5">
            <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-primary/20 text-primary">
              <span className="material-symbols-outlined text-3xl">featured_seasonal_and_gifts</span>
            </div>
            <div className="flex flex-col gap-1">
              <p className="text-slate-900 dark:text-slate-100 text-xl font-bold leading-tight">Yo Invito</p>
              <p className="text-slate-500 dark:text-slate-400 text-sm font-normal">Invita a tus amigos</p>
            </div>
          </div>
          <div className={`flex items-center text-primary transition-opacity ${selectedMethod === 'gift' ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
            <span className="material-symbols-outlined">check_circle</span>
          </div>
        </div>

        <AnimatePresence>
          {selectedMethod === 'gift' && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="relative z-10 w-full border-t border-slate-200 dark:border-slate-700 pt-4 mt-2"
            >
              <p className="font-medium mb-3 text-slate-800 dark:text-slate-200">¿A quién invitas hoy?</p>
              <div className="flex flex-col gap-3 mb-4">
                {otherUsers.map(user => {
                  const fTotal = orders
                    .filter((i: OrderItemResponse) => i.session_user_id === user.id)
                    .reduce((acc: number, i: OrderItemResponse) => acc + i.unit_price * i.quantity, 0);
                  const isInvited = selectedGiftFriends.includes(user.id);
                  return (
                    <div 
                      key={user.id} 
                      onClick={(e) => { e.stopPropagation(); toggleGiftFriend(user.id); }}
                      className={`flex items-center gap-4 p-3 rounded-2xl border-2 transition-all cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/80 ${
                        isInvited ? 'bg-primary/10 border-primary dark:bg-slate-800' : 'border-slate-200 bg-white dark:bg-slate-700 dark:border-transparent'
                      }`}
                    >
                      <Avatar alias={user.alias} size="md" />
                      <div className="flex-1">
                        <span className="text-sm font-bold block text-slate-800 dark:text-slate-200">{user.alias}</span>
                        <span className="text-xs text-slate-500 dark:text-slate-400">${fTotal.toFixed(2)}</span>
                      </div>
                      {isInvited && <span className="material-symbols-outlined text-primary pr-2">check_circle</span>}
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-between items-center text-lg font-bold text-slate-900 dark:text-white">
                <span>Total a pagar</span>
                <span className="text-primary text-2xl">${finalToPay.toFixed(2)}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

    </div>
  );
}
