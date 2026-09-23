// ─── Die Bezüge-Zähler des Erlasses: Zahlen für die Funktionszeile ──────────
//
// W2·24-R6c, Prüfer-Befund R6 «ZÄHL-DATEI». Die Funktionszeile am Artikelende
// (`./parts/Funktionszeile.tsx`, bis D35-F1 `BezuegeKopf`) sagt «11 Entscheide ·
// 1 Materialie · Rechner ›». Bis dahin stammten die Entscheide aus dem vollen
// Bezugs-Shard (OR 2.2 MB roh) und erschienen erst, wenn der geladen war; die
// Rubrik MATERIALIEN fehlte ganz, weil ihr Shard im Leser gar nicht vorkommt —
// eine Rubrik ohne Zahl wäre eine Zusage ohne Deckung gewesen (§8).
//
// ── W2·26-FUNKTIONSZEILE-ZAEHLER (11.9.2026) · KEIN EIGENER FETCH MEHR ─────
// R6c löste das mit einer eigenen buildseitigen Zähl-Datei je Erlass
// (`public/verzahnung/bezuege-zaehler/<KEY>.json`, ø 289 B), die dieses Modul
// IM LEERLAUF holte. Der Preis stand im D34-Nachfix (ROADMAP.md): die Zahlen
// kamen erst NACH der Artikelliste, und im OR wuchsen die Funktionszeilen von
// 469 Artikeln (Bestand 11.9.2026; ROADMAP.md nennt für ihren Stand 145) in
// einer zweiten Render-Runde in den fertigen Lesekörper hinein.
//
// Die Zahlen stehen seither im STRUKTUR-SIDECAR des Erlasses
// (`public/normtext/struktur/<ebene>/<KEY>.json`, Schlüssel `zaehler`) — der
// Datei, die der Leser für Gliederung, Marginalien und Erlass-Kopf ohnehin holt.
// `ladeBezuegeZaehler` greift auf DENSELBEN gecachten Fetch zu wie
// `ladeStruktur`/`ladeErlassKopf` in `../../lib/normtext/browse` (eine Promise,
// eine Antwort); die eigene Datei, der eigene Cache und der `beiLeerlauf`-Aufschub
// sind ersatzlos gefallen (§17-Gegengewicht). Warum gerade das Sidecar und nicht
// der Snapshot: Kopf von `scripts/gen-bezuege-zaehler.ts`.
//
// ── EBENE: DIE EINE FALLE DIESES MODULS ────────────────────────────────────
// Der geteilte Cache greift nur, wenn die URL ZEICHENGLEICH ist. `inhalt-hooks`
// lädt mit `datenEbeneVonRoute(routenEbene)`, also der DATEN-Ebene; dieses Modul
// bekommt darum `erlass.ebene` aus dem Browse-Manifest — dasselbe Feld, aus dem
// die Datei-Ebene stammt (Befund 45: `/gesetze/international/CISG` liegt unter
// `bund/`, und `BrowseErlass.ebene` ist dort 'bund'). Nähme man stattdessen die
// Routen-Ebene, wäre das Ergebnis kein Fehler, sondern ein ZWEITER Fetch — also
// still genau der Zustand, den dieser Umbau beseitigt hat.

import { useEffect, useState } from 'react';
import { ladeBezuegeZaehler, type ZaehlBlock } from '../../lib/normtext/browse';
import { normArtikelToken } from '../../lib/rechtsprechung/norm-index';

/** Zahlen EINES Artikels. */
interface ArtikelZaehler {
  /** Entscheide an diesem Artikel, ohne UI-Filter (die Bezugsgrösse, §8). */
  entscheide: number;
  /** Verschiedene Materialien-Dokumente an diesem Artikel. */
  materialien: number;
}

/** Nachschlage-Funktion je Erlass. `undefined` = (noch) nichts geladen. */
export type ZaehlerNachschlag = (artikel: string) => ArtikelZaehler | undefined;

/** Was der Hook vom Erlass braucht: Daten-Ebene und Schlüssel (s. Falle oben). */
export type ZaehlerErlass = { ebene: string; key: string };

/**
 * Gibt die Nachschlage-Funktion für die Zähler des Erlasses zurück. Der Fetch
 * dahinter ist der Struktur-Sidecar-Fetch, den der Leser ohnehin absetzt —
 * dieses Modul hängt sich nur an dessen Promise.
 */
export function useBezuegeZaehler(erlass: ZaehlerErlass | null | undefined): ZaehlerNachschlag {
  // Der Zustand trägt den SCHLÜSSEL mit, zu dem er gehört. Ohne ihn müsste der
  // Effekt beim Erlass-Wechsel erst `null` setzen (ein synchroner setState im
  // Effekt-Rumpf — Kaskaden-Render-Regel, `react-hooks/set-state-in-effect`) und
  // die Zeile zeigte dazwischen die Zahlen des VORIGEN Erlasses. Mit dem Paar
  // entscheidet der Vergleich beim Nachschlagen, und der Effekt schreibt nur
  // noch aus dem Callback.
  const [stand, setStand] = useState<{ key: string; block: ZaehlBlock | null } | null>(null);
  const ebene = erlass?.ebene;
  const key = erlass?.key;
  useEffect(() => {
    if (!ebene || !key) return;
    let lebt = true;
    void ladeBezuegeZaehler(ebene, key).then((b) => { if (lebt) setStand({ key, block: b }); });
    return () => { lebt = false; };
  }, [ebene, key]);

  const block = stand && stand.key === key ? stand.block : null;
  return (artikel: string) => {
    const paar = block?.[normArtikelToken(artikel)];
    return paar ? { entscheide: paar[0], materialien: paar[1] } : undefined;
  };
}
