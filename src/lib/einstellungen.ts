import { useSyncExternalStore } from 'react';
import type { Kanton } from '../types/legal';
import { type Detailgrad, DETAILGRAD_DEFAULT } from './vorlagen/detailgrad';
import { lokalSpeicher } from './sichererSpeicher';

// ─── Globale Einstellungen — heimatlose Nutzer-Defaults (§3/§5) ──────────────
//
// Hält NUR Felder, die heute keinen eigenen Store haben: Standard-Kanton, Profil
// (Name/Adresse fürs Vorlagen-Prefill) und der globale Vorlagen-Detailgrad.
// Theme/Stil/Listendichte/Schriftgrösse haben BEREITS eigene Stores (thema.ts,
// ausgabeStil.ts, rsp:dichte, rsp-fs-idx) — die Einstellungen-Seite BRÜCKT diese,
// dupliziert sie NICHT (sonst zweite Wahrheit, §5). Persistenz + Listener-Sync
// nach dem Muster von ausgabeStil.ts; KEIN Date.now() (§2, liegt in src/lib).

const KEY = 'lexmetrik.einstellungen.v1';

export interface Einstellungen {
  standardKanton: Kanton;
  profilName: string;
  profilAdresse: string;
  vorlagenDetailgrad: Detailgrad;
}

const EINSTELLUNGEN_DEFAULT: Einstellungen = {
  standardKanton: 'ZH',
  profilName: '',
  profilAdresse: '',
  vorlagenDetailgrad: DETAILGRAD_DEFAULT,
};

function leseGespeichert(): Einstellungen {
  try {
    const roh = lokalSpeicher.lies(KEY);
    if (!roh) return EINSTELLUNGEN_DEFAULT;
    const o = JSON.parse(roh) as Partial<Einstellungen>;
    if (!o || typeof o !== 'object') return EINSTELLUNGEN_DEFAULT;
    const dg = o.vorlagenDetailgrad;
    return {
      standardKanton: typeof o.standardKanton === 'string' ? (o.standardKanton as Kanton) : EINSTELLUNGEN_DEFAULT.standardKanton,
      profilName: typeof o.profilName === 'string' ? o.profilName : '',
      profilAdresse: typeof o.profilAdresse === 'string' ? o.profilAdresse : '',
      vorlagenDetailgrad: dg === 'einfach' || dg === 'standard' || dg === 'experte' ? dg : EINSTELLUNGEN_DEFAULT.vorlagenDetailgrad,
    };
  } catch {
    return EINSTELLUNGEN_DEFAULT;
  }
}

// Modul-Store mit stabiler Referenz (für useSyncExternalStore): solange nichts
// geschrieben/synchronisiert wird, liefert getSnapshot dasselbe Objekt zurück.
let aktuell: Einstellungen = leseGespeichert();
const hoerer = new Set<() => void>();

const ladeEinstellungen = (): Einstellungen => aktuell;

function schreibe(e: Einstellungen): void {
  aktuell = e;
  lokalSpeicher.schreib(KEY, JSON.stringify(e)); // privat-Modus
  // Sync: same-tab über hoerer (useSyncExternalStore-Subscriber), cross-tab über
  // den 'storage'-Listener in abonniere() — kein eigenes Custom-Event nötig.
  hoerer.forEach((f) => f());
}

export function setzeEinstellung<K extends keyof Einstellungen>(feld: K, wert: Einstellungen[K]): void {
  if (aktuell[feld] === wert) return;
  schreibe({ ...aktuell, [feld]: wert });
}

export const getStandardKanton = (): Kanton => aktuell.standardKanton;
export const getProfil = (): { name: string; adresse: string } => ({ name: aktuell.profilName, adresse: aktuell.profilAdresse });
export const getVorlagenDetailgrad = (): Detailgrad => aktuell.vorlagenDetailgrad;

function abonniere(f: () => void): () => void {
  hoerer.add(f);
  // Anderer Browser-Tab schreibt → frisch lesen, dann Hörer wecken.
  const ausStorage = () => { aktuell = leseGespeichert(); f(); };
  try { window.addEventListener('storage', ausStorage); } catch { /* SSR */ }
  return () => {
    hoerer.delete(f);
    try { window.removeEventListener('storage', ausStorage); } catch { /* SSR */ }
  };
}

/** React-Hook: liest die Einstellungen, re-rendert bei Änderung. Server-Snapshot
 *  = Defaults (kein localStorage im Prerender). */
export function useEinstellungen(): Einstellungen {
  return useSyncExternalStore(abonniere, ladeEinstellungen, () => EINSTELLUNGEN_DEFAULT);
}
