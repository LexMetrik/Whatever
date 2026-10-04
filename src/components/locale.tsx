import { createContext, useContext, useEffect, useState } from 'react';
import { lokalSpeicher } from '../lib/sichererSpeicher';

// ─── Minimales i18n-Gerüst (deterministisch, ohne maschinelle Übersetzung) ──
//
// de ist Quelle und Default; en/fr/it sind «in Bearbeitung»: der Umschalter
// funktioniert, ALLE Inhalte fallen aber auf Deutsch zurück, bis eine
// fachkundige Person übersetzt. Keine Text-API, kein LLM. Die gewählte Locale
// wird lokal gespeichert und an <html lang> gekoppelt; Fedlex-Links folgen
// der Locale (fr/it amtlich; en → amtliche de-Fassung).

/* eslint-disable react-refresh/only-export-components --
   Infrastruktur-Modul: Provider + Hook + Helfer gehören fachlich zusammen;
   Fast-Refresh-Optimierung ist hier verzichtbar. */
export type Locale = 'de' | 'en' | 'fr' | 'it';

export const LOCALES: { code: Locale; label: string; inBearbeitung: boolean }[] = [
  { code: 'de', label: 'Deutsch', inBearbeitung: false },
  { code: 'en', label: 'English', inBearbeitung: true },
  { code: 'fr', label: 'Français', inBearbeitung: true },
  { code: 'it', label: 'Italiano', inBearbeitung: true },
];

const SPEICHER_KEY = 'lexmetrik.locale';

function gespeicherteLocale(): Locale {
  try {
    const roh = lokalSpeicher.lies(SPEICHER_KEY);
    if (roh === 'de' || roh === 'en' || roh === 'fr' || roh === 'it') return roh;
  } catch { /* Speicher blockiert → Default */ }
  return 'de';
}

const LocaleContext = createContext<{ locale: Locale; setLocale: (l: Locale) => void }>({
  locale: 'de',
  setLocale: () => {},
});

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocale] = useState<Locale>(gespeicherteLocale);

  useEffect(() => {
    lokalSpeicher.schreib(SPEICHER_KEY, locale); // ignorieren
    // <html lang> technisch an die Locale koppeln (Inhalt bleibt vorerst de)
    document.documentElement.lang = locale;
  }, [locale]);

  return <LocaleContext.Provider value={{ locale, setLocale }}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  return useContext(LocaleContext);
}

// Fedlex-Links locale-bewusst: gebackene /de-URLs auf die amtliche Sprach-
// fassung umschreiben. fr/it sind amtlich (Anker sprachunabhängig, per
// Stichprobe gegen die fr/it-Filestore-HTML verifiziert); en hat keine
// amtliche Fassung → de. Nichts wird erfunden.
export function fedlexLokalisiert(url: string, locale: Locale): string {
  const ziel = locale === 'fr' || locale === 'it' ? locale : 'de';
  if (ziel === 'de') return url;
  return url.replace('/de#', `/${ziel}#`).replace(/\/de$/, `/${ziel}`);
}
