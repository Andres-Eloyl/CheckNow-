import React, { useMemo } from 'react';

const EMOJIS = ['😎', '🥑', '🍓', '🍕', '🌮', '🌶️', '🍔', '🍣', '🍦', '🍩', '👽', '👻', '🔥', '✨'];
const COLORS = [
  'from-primary to-orange-300',
  'from-blue-500 to-cyan-300',
  'from-green-500 to-emerald-300',
  'from-pink-500 to-rose-300',
  'from-purple-500 to-indigo-300',
];

export interface AvatarProps {
  alias: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export function Avatar({ alias, size = 'md', className = '' }: AvatarProps) {
  const { emoji, color } = useMemo(() => {
    if (!alias.trim()) return { emoji: '👋', color: 'from-neutral-700 to-neutral-600' };
    
    let hash = 0;
    for (let i = 0; i < alias.length; i++) {
      hash = alias.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    const emojiIdx = Math.abs(hash) % EMOJIS.length;
    const colorIdx = Math.abs(hash) % COLORS.length;
    
    return {
      emoji: EMOJIS[emojiIdx],
      color: COLORS[colorIdx]
    };
  }, [alias]);

  const sizeClasses = {
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-12 h-12 text-xl',
    xl: 'w-32 h-32 text-6xl',
  };

  return (
    <div
      className={`rounded-full bg-gradient-to-tr ${color} flex items-center justify-center shadow-sm shrink-0 ${sizeClasses[size]} ${className}`}
      title={alias}
    >
      <span className="drop-shadow-sm">{emoji}</span>
    </div>
  );
}
