import { useEffect, useState } from 'react';
import { nichtKonsolidierteInkrafttreten, revisionenFuerNorm } from '../../../lib/normtext/revisionen';
import type { CurrencyEintrag } from '../../../lib/normtext/browse';
import type { BrowseErlass } from '../../../lib/normtext/browse-typen';
import { zukunftsHinweis, type ZukunftsHinweis } from '../zukunftsfassungen';

// ─── W2·27 (BUND-FERTIG §4 b) · die React-Seite des Zukunftsfassungs-Hinweises ──
//
// Die AUSSAGE steht in `../zukunftsfassungen` (rein, ohne React, §3). Hier steht
// nur, woher die Zahl der weiteren Fassungen kommt.
//
// KEIN ZWEITER FETCH (§15.3). `revisionenFuerNorm` führt einen modulweiten
// Promise-Cache — ein Fetch je Erlass-Key und Sitzung. Dieselbe Quelle holen
// bereits `../inhalt-zustand` (für `nichtKonsolidiertSeit`) und
// `./panelKontextLaden` (für den Reiter «Änderungen»), und beide Stellen
// begründen genau so, warum sie sie unabhängig anfordern statt sie
// durchzureichen. Diese Datei reiht sich in dieses Muster ein.
//
// ── WARUM NICHT DURCH `leserV3Modell` GEREICHT (gemessen 14.9.2026) ──────────
// Der naheliegende Weg wäre ein Feld am V3-Adapter gewesen, gespeist aus der
// Liste, die `../inhalt-zustand` ohnehin hält. Er ist verworfen, nicht
// übersehen: die Fundament-Sonde (`src/tests/leser-v3-fundament.test.ts`) lässt
// in `v3/` höchstens 420 Zeilen je Datei zu, und `leserV3Modell.ts` steht bei
// GENAU 420 — jede Feldzeile, erst recht mit ihrer Begründung, hätte den Deckel
// gerissen. Ihn dafür anzuheben verbietet §17-Gegengewicht (wer hinzufügt, hebt
// nicht die Schranke an). Die Kosten dieses Wegs sind ein zweiter `useEffect`
// auf einen bereits gecachten Promise; die Kosten des anderen wären eine
// aufgeweichte Schlankheits-Zusage gewesen.
//
// AN DEN ERLASS-KEY GEBUNDEN (Repo-Muster, vgl. `./panelKontextLaden`): ein
// Erlass-Wechsel liefert nie die Fassungen des vorigen Erlasses.
//
// CLS (§15/2): der Hinweis SELBST hängt nicht an diesem Effekt — Satz und Link
// kommen aus `currency`, das der Kopf schon beim ersten Paint hat. Nachwachsen
// kann allein der kurze Zusatz «(+N weitere)», und der steht in der
// höhenfesten Stand-Zelle (`kopf-stand*`, tailwind.config.js), die seit S3
// genau für solche Nachzügler reserviert ist.
const KEINE_INKRAFTTRETEN: readonly string[] = [];

export function useZukunftsfassung(
  erlass: BrowseErlass | null | undefined,
  currency: CurrencyEintrag | undefined,
): ZukunftsHinweis | null {
  const key = erlass?.key;
  const [stand, setStand] = useState<{ key: string; daten: string[] } | null>(null);
  useEffect(() => {
    if (!key) return;
    let lebt = true;
    void revisionenFuerNorm([key]).then((a) => {
      if (lebt) setStand({ key, daten: nichtKonsolidierteInkrafttreten(a?.revisionen) });
    });
    return () => { lebt = false; };
  }, [key]);
  if (!erlass) return null;
  const daten = stand && stand.key === key ? stand.daten : KEINE_INKRAFTTRETEN;
  return zukunftsHinweis(erlass, currency, daten);
}
