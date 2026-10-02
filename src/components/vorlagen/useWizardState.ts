import { useEffect, useState } from 'react';
import { useKopieren } from '../useKopieren';
import { lokalSpeicher } from '../../lib/sichererSpeicher';

// ─── Geteilter Zustands-Rahmen der Vorlagen-Wizards ─────────────────────────
//
// Antworten (optional mit localStorage-Sicherung + Hydration-Normalisierung),
// Schritt-Navigation, Bestätigungs-Gate und Kopier-Feedback – der in allen
// Wizards identische Unterbau. Enthält BEWUSST keine Fachlogik (CLAUDE.md §3).
// Ohne `speicherKey` bleibt der Zustand nur im Speicher (Schlichtungsgesuch:
// Anweisung «keine Browser-Storage-APIs»).

export function useWizardState<T extends object>(opts: {
  defaults: T;
  speicherKey?: string;
  /** Hydration absichern: Array-/Record-Felder aus älteren Speicherständen normalisieren. */
  normalisieren?: (geladen: T) => T;
  /** Profil-Prefill (Auftrag David): füllt NUR leere Felder vor (gespeicherte
   *  Nutzerwerte/Defaults gewinnen). Reiner Komfort (§3), nie Rechtsinhalt. */
  prefill?: Partial<T>;
}) {
  const { defaults, speicherKey, normalisieren, prefill } = opts;
  const [a, setA] = useState<T>(() => {
    let basis = defaults;
    if (speicherKey) {
      try {
        const roh = lokalSpeicher.lies(speicherKey);
        if (roh) {
          const geladen = { ...defaults, ...JSON.parse(roh) } as T;
          basis = normalisieren ? normalisieren(geladen) : geladen;
        }
      } catch { /* defekter Speicher → Defaults */ }
    }
    if (prefill) {
      const ergaenzt = { ...basis } as Record<string, unknown>;
      for (const k in prefill) {
        const cur = ergaenzt[k];
        if ((cur === undefined || cur === '') && prefill[k]) ergaenzt[k] = prefill[k];
      }
      return ergaenzt as T;
    }
    return basis;
  });
  const [schritt, setSchritt] = useState(0);
  const [bestaetigt, setBestaetigt] = useState(false);

  // Eingaben lokal sichern (verlassen den Browser nicht)
  useEffect(() => {
    if (!speicherKey) return;
    lokalSpeicher.schreib(speicherKey, JSON.stringify(a)); // Speicher voll/blockiert
  }, [a, speicherKey]);

  const set = <K extends keyof T>(k: K, v: T[K]) => setA((alt) => ({ ...alt, [k]: v }));

  const zuruecksetzen = () => {
    setA(defaults); setSchritt(0); setBestaetigt(false);
    if (speicherKey) { lokalSpeicher.entferne(speicherKey); // ignorieren }
  };

  // R4-D (5.9.2026): Timer-Handle, Unmount-Aufräumen und die
  // Erst-nach-Erfolg-Quittung standen hier zeichengleich zum geteilten Hook —
  // die Mechanik war schon dieselbe, nur zweimal geschrieben (§5). Der Hook
  // nimmt den Text jetzt beim KLICK entgegen; genau daran scheiterte die
  // Migration bisher.
  const { kopiert, kopieren } = useKopieren();

  return { a, setA, set, schritt, setSchritt, bestaetigt, setBestaetigt, kopiert, kopieren, zuruecksetzen };
}
