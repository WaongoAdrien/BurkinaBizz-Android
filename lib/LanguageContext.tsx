// lib/LanguageContext.tsx

import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type Language = 'fr' | 'en';

const STORAGE_KEY = 'burkinabizz_language';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
}

const LanguageContext = createContext<LanguageContextType | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('fr');

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then(saved => {
      if (saved === 'en' || saved === 'fr') setLanguageState(saved);
    });
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    AsyncStorage.setItem(STORAGE_KEY, lang);
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within a LanguageProvider');
  return ctx;
}

// Translate a French UI string to English when the app is in English mode.
// Usage: const { t } = useLanguage(); ... t('Accueil')
export function useTranslation() {
  const { language } = useLanguage();
  const t = (frText: string): string => {
    if (language === 'fr') return frText;
    return translations[frText] ?? frText;
  };
  return { t, language };
}

// Central French → English dictionary, populated incrementally per screen.
export const translations: Record<string, string> = {};

export function registerTranslations(dict: Record<string, string>) {
  Object.assign(translations, dict);
}
