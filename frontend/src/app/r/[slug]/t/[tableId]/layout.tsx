'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { restaurantService } from '@/lib/api/restaurant.service';
import { useSessionStore } from '@/stores/session.store';
import type { RestaurantPublic } from '@/types/api.types';

/**
 * Guest app layout: wraps all comensal pages under /r/[slug]/t/[tableId].
 * Loads restaurant branding (name, logo, colors) on mount and applies them.
 */
export default function GuestLayout({ children }: { children: React.ReactNode }) {
  const params = useParams<{ slug: string; tableId: string }>();
  const slug = params.slug;
  const [restaurant, setRestaurant] = useState<RestaurantPublic | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;
    
    restaurantService.getPublicInfo(slug)
      .then((data) => {
        setRestaurant(data);
        setLoading(false);
      })
      .catch(() => {
        setError('Restaurante no encontrado');
        setLoading(false);
      });
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-[100dvh] flex flex-col items-center justify-center bg-background-dark">
        <div className="relative size-16">
          <div className="absolute inset-0 rounded-full bg-primary/30 blur-xl animate-pulse" />
          <div className="relative size-16 rounded-full bg-primary/20 flex items-center justify-center">
            <span className="material-symbols-outlined text-primary text-3xl animate-pulse">restaurant</span>
          </div>
        </div>
        <p className="text-text-muted text-sm mt-4 animate-pulse">Cargando restaurante...</p>
      </div>
    );
  }

  if (error || !restaurant) {
    return (
      <div className="min-h-[100dvh] flex flex-col items-center justify-center bg-background-dark px-6 text-center">
        <div className="size-20 bg-danger/20 rounded-full flex items-center justify-center mb-4">
          <span className="material-symbols-outlined text-danger text-4xl">error</span>
        </div>
        <h1 className="text-xl font-bold text-white mb-2">Restaurante no encontrado</h1>
        <p className="text-text-muted text-sm max-w-xs">
          El enlace que escaneaste no es válido o el restaurante ya no está activo.
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Dynamic CSS variables from restaurant branding */}
      <style>{`
        :root {
          --color-primary: ${restaurant.primary_color || '#6C63FF'};
          --color-secondary: ${restaurant.secondary_color || '#FF6B35'};
        }
      `}</style>
      {children}
    </>
  );
}
