'use client';

import { createContext, useContext } from 'react';
import type { Locale } from './getDictionary';
import type { Dictionary } from './types';

type I18nContextType = {
  locale: Locale;
  dict: Dictionary;
};

export const LocaleContext = createContext<I18nContextType | null>(null);

export function useI18n(): I18nContextType {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error('useI18n must be used inside LocaleProvider');
  return ctx;
}

export function LocaleProvider({
  locale,
  dict,
  children,
}: {
  locale: Locale;
  dict: Dictionary;
  children: React.ReactNode;
}) {
  return (
    <LocaleContext.Provider value={{ locale, dict }}>
      {children}
    </LocaleContext.Provider>
  );
}
