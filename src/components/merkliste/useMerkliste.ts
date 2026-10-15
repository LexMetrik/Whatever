import { useSyncExternalStore } from 'react';
import { abonniereMerkliste, holeMerkliste, istGemerkt, type MerkEintrag } from '../../lib/merkliste';

// Reaktive Lese-Hooks auf die Merkliste (Muster useZuletzt, §3: reine Darstellung —
// die Liste lebt in lib/merkliste.ts). Der Server-Snapshot ist «leer»/«nicht
// gemerkt»: der Prerender kennt keinen Browserspeicher.

const LEER: MerkEintrag[] = [];

export function useMerkliste(): MerkEintrag[] {
  return useSyncExternalStore(abonniereMerkliste, holeMerkliste, () => LEER);
}

export function useGemerkt(route: string | null): boolean {
  return useSyncExternalStore(abonniereMerkliste, () => (route ? istGemerkt(route) : false), () => false);
}
