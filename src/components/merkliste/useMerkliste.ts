import { useSyncExternalStore } from 'react';
import { abonniereMerkliste, istGemerktImStand, merklisteImStand, type MerkEintrag } from '../../lib/merkliste';

// Reaktive Lese-Hooks auf die Merkliste (Muster useZuletzt, §3: reine Darstellung —
// die Liste lebt in lib/merkliste.ts). Der Server-Snapshot ist «leer»/«nicht
// gemerkt»: der Prerender kennt keinen Browserspeicher. ALLE Hooks hängen an EINER
// geteilten Anmeldung im Modul (§15: im OR stehen ~1700 Merken-Knöpfe) und lesen den
// Cache, nicht den Speicher — siehe «Geteiltes Abo» in lib/merkliste.ts.

const LEER: MerkEintrag[] = [];

export function useMerkliste(): MerkEintrag[] {
  return useSyncExternalStore(abonniereMerkliste, merklisteImStand, () => LEER);
}

export function useGemerkt(route: string | null): boolean {
  return useSyncExternalStore(abonniereMerkliste, () => (route ? istGemerktImStand(route) : false), () => false);
}
