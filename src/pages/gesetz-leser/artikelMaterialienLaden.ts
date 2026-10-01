// ─── Materialien je Artikel für die Bezüge-Zeile (W2·24-R5-F1K, D30) ─────────
//
// BEFUND David 6.9.2026, wörtlich: die Bezüge-Zeile «klappt auf, zeigt aber nur
// den Rechnen-Block; die gezählten Entscheide und Materialien werden nicht
// geladen/gerendert».
//
// Die ZAHL der Rubrik «Materialien» stand seit W2·24-R6c da — sie kommt aus der
// buildseitigen Zähl-Datei (`./bezuegeZaehler`), die ihrerseits aus
// `public/materialien/kanten/<KEY>.json` gezählt wird. Die LISTE dazu gab es im
// Leser nie. Diese Hook holt sie, und zwar aus GENAU DERSELBEN Quelle, aus der
// die Zahl gezählt wurde — Zahl und Liste können damit nicht auseinanderlaufen
// (§5; die andere Richtung bewacht `check:bezuege-zaehler`).
//
// ── KEINE NEUE RECHNUNG (§5) ────────────────────────────────────────────────
// Projiziert wird mit `projiziereMaterialien` aus `lib/kontext` — derselben
// Funktion, die das Verweis-Popover seit W2·5d/A7 benutzt (dort als async
// `materialienFuerArtikel`, seit #1196 `materialienFuerArtikelErgebnis` — ihr Wrapper;
// die dünne Fassung ist am 1.10.2026 entfernt). Hier steht nur das
// Laden und das Gedächtnis, keine Zuordnung.
//
// ── EIN LADEN JE ERLASS, NICHT JE ARTIKEL (§15) ─────────────────────────────
// Die async-Fassung je Artikel hätte im OR 1686 Effekte bedeutet. Stattdessen
// dasselbe Muster wie Zähl-, Historie- und Revisions-Shard: EIN Fetch auf
// Reader-Ebene, im Leerlauf, Ergebnis als Nachschlage-Funktion an reine
// Renderer. Beide Loader tragen zudem ihren modulweiten Promise-Cache — das
// Panel und das Verweis-Popover teilen ihn, es entsteht kein zweiter Fetch.
//
// ── ERST AUF WUNSCH (`laden`) ───────────────────────────────────────────────
// Geladen wird NICHT beim Seitenaufruf, sondern sobald der Leser die erste
// Bezüge-Zeile aufklappt (`laden === true`). Das ist derselbe Riegel, mit dem
// H3 den Bezugs-Shard entschärft hat (`panelModell.ts`), an derselben Stelle
// entschieden: der Leser, der nur liest, zahlt nichts.

import { useCallback, useEffect, useState } from 'react';
import { beiKantenShardErholt, ladeKantenShardErgebnis, type KantenShard } from '../../lib/materialien/kanten-shard';
import { ladeMaterialManifest } from '../../lib/materialien/browse';
import { projiziereMaterialien } from '../../lib/kontext';
import { beiLeerlauf } from '../../lib/leerlauf';
import type { MaterialManifest } from '../../lib/materialien/typen';
import type { MaterialBezug } from '../../lib/normtext/werkzeuge';

/** Nachschlage-Funktion je Artikel-Token. `undefined` = (noch) nichts geladen. */
export type MaterialNachschlag = (artikelToken: string) => MaterialBezug[] | undefined;

const LEER: MaterialNachschlag = () => undefined;

/** Ergebnis EINES Lade-Versuchs (Shard + Manifest), an den Erlass-Key gebunden. */
interface MaterialStand {
  key: string;
  versuch: number;
  shard: KantenShard | null;
  /** W3-5-Rest: der Shard-Abruf ist gescheitert (Netz/Parse/5xx) — NICHT «Erlass
   *  ohne Kanten» (das ist `shard: null` bei `shardFehler: false`). */
  shardFehler: boolean;
  manifest: MaterialManifest | null;
}

/**
 * Die reine Ableitung hinter `useArtikelMaterialien` (testbar ohne DOM).
 * `unsicher` = mindestens EINE der beiden Quellen ist gescheitert; dann ist
 * eine leere Liste keine Auskunft («nichts erfasst»), sondern ein Ladefehler.
 */
export function leiteMaterialNachschlag(
  stand: Pick<MaterialStand, 'shard' | 'shardFehler' | 'manifest'>,
): { nachschlag: MaterialNachschlag; unsicher: boolean; shardFehler: boolean } {
  const { shard, shardFehler, manifest } = stand;
  return {
    nachschlag: (artikelToken: string) => projiziereMaterialien(shard, manifest, artikelToken),
    // W3-5: `manifest === null` heisst NICHT «kein Manifest nötig» (das Manifest
    // ist erlassübergreifend, kein 404-Normalfall wie der Shard) — es heisst,
    // `ladeMaterialManifest` ist gescheitert. W3-5-Rest (30.9.2026): ebenso ein
    // gescheiterter Shard-Abruf (`/materialien/kanten/<ERLASS>.json`), den
    // `ladeKantenShard` bisher als `null` = «keine Kanten» weitergab.
    unsicher: manifest === null || shardFehler,
    // Getrennt mitgeführt: nur der Shard-Ausfall meldet die Artikel-Gruppe selbst;
    // den Manifest-Ausfall meldet `PanelErlaeuterungen` (AN-4) — sonst zwei
    // Fehlerzeilen, zwei Knöpfe für denselben Ausfall (Gegenprüfung B3, 30.9.2026).
    shardFehler,
  };
}

/**
 * @returns Quadrupel `[nachschlagen, unsicher, erneut, shardFehler]`. W3-5 (Audit 25.9.2026): bricht
 *  das Manifest (`/materialien/register.json`, `ladeMaterialManifest`) ab,
 *  liefert es `null` (Fangnetz dort) — `projiziereMaterialien` kann daraus
 *  nicht mehr unterscheiden, ob am Artikel wirklich nichts erfasst ist oder
 *  das Manifest bloss fehlte, und eine leere Liste sah in `PanelTafeln`
 *  darum wie eine geprüfte Auskunft aus («Zu Art. 336c nichts erfasst.»),
 *  während direkt darunter derselbe Ausfall als Fehlermeldung stand.
 *  `unsicher` macht die fehlende Unterscheidung explizit, statt sie in
 *  `src/lib/kontext.projiziereMaterialien` (Risikopfad) nachzuziehen.
 *  W3-5-Rest (30.9.2026): dasselbe für den Kanten-Shard — Ladefehler ≠ 404.
 *  `erneut` stösst den Abruf noch einmal an (beide Lader cachen keinen Fehlschlag).
 */
export function useArtikelMaterialien(
  erlassKey: string | undefined, laden: boolean,
): [MaterialNachschlag, boolean, () => void, boolean] {
  // Der Zustand trägt den SCHLÜSSEL mit (Muster aus `bezuegeZaehler.ts`): ohne
  // ihn zeigte die Zeile nach einem Erlass-Wechsel kurz die Materialien des
  // vorigen Erlasses, und der Effekt müsste synchron `null` setzen.
  const [stand, setStand] = useState<MaterialStand | null>(null);
  const [versuch, setVersuch] = useState(0);
  const erneut = useCallback(() => setVersuch((v) => v + 1), []);
  useEffect(() => {
    if (!laden || !erlassKey) return;
    let lebt = true;
    const abbrechen = beiLeerlauf(() => {
      void Promise.all([ladeKantenShardErgebnis(erlassKey), ladeMaterialManifest()]).then(([ergebnis, manifest]) => {
        if (!lebt) return;
        setStand({
          key: erlassKey, versuch,
          shard: ergebnis.zustand === 'ok' ? ergebnis.shard : null,
          shardFehler: ergebnis.zustand === 'fehler',
          manifest,
        });
      });
    });
    return () => { lebt = false; abbrechen?.(); };
  }, [erlassKey, laden, versuch]);

  const aktuell = !!erlassKey && stand?.key === erlassKey && stand.versuch === versuch;
  // Holt eine andere Fläche den gescheiterten Shard nach (Praxis-Zeile, Erlass-Tafel),
  // zieht dieser Hook mit — sonst bliebe seine Fehlerzeile trotz geladener Daten stehen.
  const shardAusfall = aktuell && stand.shardFehler;
  useEffect(() => (shardAusfall && erlassKey ? beiKantenShardErholt(erlassKey, erneut) : undefined),
    [shardAusfall, erlassKey, erneut]);

  if (!erlassKey || !aktuell) return [LEER, false, erneut, false];
  // Ab hier ist der Lade-VERSUCH durch: ein fehlender Shard (404 = Erlass ohne
  // Material-Kanten) ergibt die LEERE Liste, nicht `undefined` — sonst stünde
  // die Skelett-Zeile «lädt …» für immer (§8: «nichts erfasst» ist eine Antwort,
  // «lädt» wäre eine Unwahrheit).
  const { nachschlag, unsicher, shardFehler } = leiteMaterialNachschlag(stand);
  return [nachschlag, unsicher, erneut, shardFehler];
}
