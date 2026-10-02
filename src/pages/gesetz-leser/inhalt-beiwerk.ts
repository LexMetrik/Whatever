import type { Dispatch, SetStateAction } from 'react';
import {
  ladeCurrency, ladeKantonLuecken, ladeStrukturDokumentStreng,
  type CurrencyMap, type ErlassKopf, type KantonLueckenMap, type StrukturMap,
} from '../../lib/normtext/browse';
import type { Teilausfall, TeilausfallTeil } from './inhalt-zustand';

// ═══ Die BEGLEIT-Sidecars des Lesers (BG-02/03/04, W2·17-UI-BEFUNDE 2.10.2026) ═
// Fassungsangaben (`currency`), Erfassungslücken (nur Kanton, §8-Nachzug PR #614-
// Auflage; der Bund trägt keine Einträge, §15 kein Zusatz-Fetch) und Gliederung/
// Erlass-Kopf (Struktur-Sidecar). Aus `useLeserDaten` ausgelagert (§6.6).
//
// Ein Ausfall ist KEIN «leer»: er wird ausgewiesen (`setTeilausfall`, das
// Titelblatt zeigt ihn mit «Erneut laden») und nicht gecacht (browse.ts).
// Besonders die Fassungsangaben tragen «nächste Fassung ab …» und «seit … gilt
// eine neuere Fassung» — das darf nie still fehlen (§1/§8). `currency` löst
// trotzdem IMMER auf (`{}`), damit `FruehAnsicht` nicht auf den Platzhalter
// wartet; `struktur`/`kopf` bleiben `null` — für den Tieflink-Sprung ist das
// «entschieden» (`useStrukturEntschieden`, #1267), er hängt nicht.
//
// «Erneut laden» holt NUR diese Sidecars (eigener Lauf-Zähler), nicht den
// Erlass-Text noch einmal.

type Setter<T> = Dispatch<SetStateAction<T>>;

/** Feste Reihenfolge der Teile (Satzbau im Titelblatt), unabhängig von der Ankunftszeit. */
const REIHENFOLGE: readonly TeilausfallTeil[] = ['fassung', 'luecken', 'struktur'];

export function baueBeiwerkLader(o: {
  /** DATEN-Ebene (`bund`/`kanton`/…), nicht die Routen-Ebene. */
  daten: string;
  schluessel: string;
  /** Lebt die Instanz noch? (Aufräumen des Effekts.) */
  lebt: () => boolean;
  setCurrency: Setter<CurrencyMap | null>;
  setStruktur: Setter<StrukturMap | null>;
  setKopf: Setter<ErlassKopf | null>;
  setKantonLuecken: Setter<KantonLueckenMap>;
  setTeilausfall: Setter<Teilausfall | null>;
}): { laden: () => void } {
  const { daten, schluessel, lebt, setCurrency, setStruktur, setKopf, setKantonLuecken, setTeilausfall } = o;
  let lauf = 0;
  const laden = () => {
    const mein = ++lauf;
    const gueltig = () => lebt() && mein === lauf;
    setTeilausfall(null);
    const ausgefallen = new Set<TeilausfallTeil>();
    const fallAus = (teil: TeilausfallTeil) => {
      if (!gueltig()) return;
      ausgefallen.add(teil);
      setTeilausfall({ teile: REIHENFOLGE.filter((t) => ausgefallen.has(t)), erneut: () => { if (lebt()) laden(); } });
    };
    void ladeCurrency().then(
      (c) => { if (gueltig()) setCurrency(c); },
      () => { if (gueltig()) { setCurrency({}); fallAus('fassung'); } },
    );
    void ladeStrukturDokumentStreng(daten, schluessel).then(
      (d) => { if (gueltig()) { setStruktur(d.artikel); setKopf(d.kopf); } },
      () => fallAus('struktur'),
    );
    if (daten === 'kanton') {
      void ladeKantonLuecken().then(
        (l) => { if (gueltig()) setKantonLuecken(l); },
        () => fallAus('luecken'),
      );
    }
  };
  return { laden };
}
