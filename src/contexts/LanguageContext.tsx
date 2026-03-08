import { createContext, useContext, useState, useCallback, useMemo, ReactNode } from 'react';
import { Language, Translations } from '@/i18n/types';
import { nl } from '@/i18n/nl';
import { en } from '@/i18n/en';

const DICTIONARIES: Record<Language, Translations> = { nl, en };
const STORAGE_KEY = 'noxhaven-lang';

function getInitialLang(): Language {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'en' || stored === 'nl') return stored;
  } catch {}
  return 'nl';
}

interface LanguageContextValue {
  lang: Language;
  setLang: (l: Language) => void;
  t: Translations;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Language>(getInitialLang);

  const setLang = useCallback((l: Language) => {
    setLangState(l);
    try { localStorage.setItem(STORAGE_KEY, l); } catch {}
  }, []);

  const value = useMemo<LanguageContextValue>(() => ({
    lang,
    setLang,
    t: DICTIONARIES[lang],
  }), [lang, setLang]);

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
}
