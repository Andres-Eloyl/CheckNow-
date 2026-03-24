'use client';

import { useEffect } from 'react';
import { useThemeStore } from '@/stores/theme.store';
import { restaurantService } from '@/lib/api/restaurant.service';

interface ThemeProviderProps {
  slug?: string;
  defaultPrimary?: string | null;
  defaultSecondary?: string | null;
}

export function ThemeProvider({ slug, defaultPrimary, defaultSecondary }: ThemeProviderProps) {
  const { primaryColor, secondaryColor, setTheme } = useThemeStore();

  useEffect(() => {
    // If the store is empty, but we receive defaults, set them
    if (!primaryColor && !secondaryColor && (defaultPrimary || defaultSecondary)) {
      setTheme(defaultPrimary || null, defaultSecondary || null);
    }
  }, [defaultPrimary, defaultSecondary, primaryColor, secondaryColor, setTheme]);

  useEffect(() => {
    // If we have a slug, try to fetch the latest public info to ensure we have the right colors
    if (!slug) return;

    restaurantService.getPublicInfo(slug)
      .then((data) => {
        if (data.primary_color || data.secondary_color) {
          setTheme(data.primary_color || null, data.secondary_color || null);
        }
      })
      .catch((err) => {
        console.error('Failed to load restaurant branding:', err);
      });
  }, [slug, setTheme]);

  // Use the loaded colors or fallback to default styles from globals.css
  const finalPrimary = primaryColor || defaultPrimary || '#6C63FF';
  const finalSecondary = secondaryColor || defaultSecondary || '#FF6B35';

  return (
    <style>{`
      :root {
        --theme-primary: ${finalPrimary};
        --theme-secondary: ${finalSecondary};
      }
    `}</style>
  );
}
