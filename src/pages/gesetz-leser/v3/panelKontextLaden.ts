import { useCallback, useEffect, useState } from 'react';
import { revisionenFuerNorm, type RevisionAnsicht } from '../../../lib/normtext/revisionen';
import { botschaftenFuer, type BotschaftBezug } from '../../../lib/materialien/botschaften';
import { vernehmlassungenFuer, type VernehmlassungBezug } from '../../../lib/materialien/vernehmlassungen';
import { kantonaleGesetzgebungFuer, type KantonalesGeschaeft } from '../../../lib/materialien/ratschlaege';
import { ladeMaterialManifest } from '../../../lib/materialien/browse';
import { ladeRevisionShard, type RevisionShard } from '../../../lib/verzahnung/artikel-revisionen';
import { kontextSoftLaw, materialienFuer, mischeMaterialien } from '../../../lib/kontext';
import type { MaterialBezug } from '../../../lib/normtext/werkzeuge';

// ─── Nachladen der Reiter «Änderungen» und «Materialien» (H3, Kap. 7) ────────
//
// DASSELBE PRINZIP WIE BEI DEN BEZÜGEN, an derselben Stelle entschieden: geladen
// wird, sobald das Panel EINMAL offen war (`laden`), nie beim Seitenaufruf. Die
// Ist-Hülle holt diese drei Sidecars heute unbedingt, sobald das `KontextPanel`
// in der Lesespalte steht.
//
// EIN LADEN JE ERLASS, NICHT JE REITER-WECHSEL: die Gate-Bedingung ist
// «Panel war offen», nicht «dieser Reiter ist aktiv». Wer zwischen den Reitern
// hin und her klickt, löst keinen neuen Fetch aus; wer das Panel schliesst,
// verliert die Daten nicht. Die Sidecar-Lader darunter haben ohnehin ihre
// eigenen Caches — die Gate-Bedingung schützt vor dem Fetch, nicht vor der
// Wiederholung.
//
// ── DREI ZUSTÄNDE, EHRLICH GETRENNT (§8) ────────────────────────────────────
// `null` aus den Lade-Funktionen heisst «Quelle nicht erreichbar» (Fetch-Fehler)
// und ist NICHT dasselbe wie eine leere Liste («nichts erfasst»). Beide wieder
// nicht dasselbe wie «lädt noch» (`fertig === false`). Die Reiter unterscheiden
// alle drei — ein gemeinsames «keine Daten» hätte einen Netzwerkfehler als
// Bestandsaussage ausgegeben.
//
// AN DEN ERLASS-KEY GEBUNDEN (Repo-Muster, vgl. `bezuegeLaden.ts`): ein
// Pane-/Erlass-Wechsel liefert nie die Änderungen des vorigen Erlasses.

export interface Geladen<T> {
  wert: T | null;
  fertig: boolean;
  /** S6 · Befund M-8/AN-4: erneut versuchen (nach einem Ladefehler). Die
   *  Lade-Funktionen cachen einen Fehlschlag nicht (`lib/materialien/browse`),
   *  der Griff stösst den Effekt nur noch einmal an. Fehlt er, gibt es keinen
   *  Wiederholungsweg (Tests, reine Anzeige). */
  erneut?: () => void;
}

const NICHT_FERTIG = { wert: null, fertig: false } as const;

/**
 * S6 · DER EINE Lade-/Gate-Rhythmus aller Reiter-Quellen (vorher viermal
 * wortgleich als eigene Hook). An den Erlass-Key gebunden, erst nach dem
 * ersten Öffnen (`laden`), mit Wiederholung: `erneut` zählt `versuch` hoch und
 * lässt den Effekt ein zweites Mal laufen. `lade` MUSS modul-stabil sein (eine
 * Funktion auf Modul-Ebene oder `useCallback`), sonst lädt der Effekt bei
 * jedem Render.
 */
function useNachladen<T>(erlassKey: string | undefined, laden: boolean, lade: (key: string) => Promise<T | null>): Geladen<T> {
  const [stand, setStand] = useState<{ key: string; wert: T | null; versuch: number } | null>(null);
  const [versuch, setVersuch] = useState(0);
  useEffect(() => {
    if (!laden || !erlassKey) return;
    let lebt = true;
    void lade(erlassKey).then((w) => { if (lebt) setStand({ key: erlassKey, wert: w, versuch }); });
    return () => { lebt = false; };
  }, [erlassKey, laden, lade, versuch]);
  const erneut = useCallback(() => setVersuch((v) => v + 1), []);
  if (!erlassKey || stand?.key !== erlassKey || stand.versuch !== versuch) return NICHT_FERTIG;
  return { wert: stand.wert, fertig: true, erneut };
}

const ladeRevisionen = (key: string) => revisionenFuerNorm([key]);

export function useRevisionen(erlassKey: string | undefined, laden: boolean): Geladen<RevisionAnsicht> {
  return useNachladen(erlassKey, laden, ladeRevisionen);
}

// ── §7b-DECKUNGSLÜCKE GESCHLOSSEN (21.8.2026, normrevision-badge.e2e.ts) ─────
// Derselbe Lade-/Gate-Rhythmus wie `useRevisionen` oben, andere Quelle: der
// erlass-lokale Revisions-Shard (`ladeRevisionShard`, seit V1c bestandsfest,
// bisher nur vom Ist-KontextPanel gemountet). `null` = Erlass ohne
// Revisions-Beleg (kein Fehler, §8 — `ladeRevisionShard` unterscheidet das
// bereits vom Fetch-Fehler, der dort ebenfalls `null` liefert und dafür den
// Promise-Cache NICHT setzt, also beim nächsten Aufruf erneut versucht).
export function useArtikelRevisionShard(erlassKey: string | undefined, laden: boolean): Geladen<RevisionShard | null> {
  return useNachladen(erlassKey, laden, ladeRevisionShard);
}

// ── W2·7-VZUI (31.8.2026) · Behörden-Ressourcen für den Reiter «Anwendung» ───
// Derselbe Lade-/Gate-Rhythmus wie oben, dritte Quelle: `kontextSoftLaw` zieht
// die Material-Kanten-Shards und das Browse-Register und liefert die
// Behördenpublikationen zu diesem Erlass (Kreisschreiben, Wegleitungen,
// Leitfäden). Das ist der Bestand, den die V3-Hülle beim Ablösen des
// `KontextPanel` verloren hat — er war nie falsch, er hatte nur keinen Ort mehr
// (Dateikopf `PanelMaterialien.tsx`: «Soft Law bleibt draussen … offener Punkt
// im Vollzugsvermerk, nicht stillschweigend weggelassen»).
//
// `[]` und «Fetch fehlgeschlagen» sind hier NICHT unterscheidbar: `kontextSoftLaw`
// löst beides zur leeren Liste auf (`ladeMaterialManifest` → `null` ⇒ `return []`).
// Der Reiter darf darum «keine erfasst» NICHT behaupten, wo er in Wahrheit
// nichts weiss — er sagt es so, wie es ist (§8, Wortlaut in `PanelAnwendung`).
//
// ── S6 (23.9.2026) · REITER «ERLÄUTERUNGEN», ZWEI BEFUNDE AN DIESER STELLE ──
// AN-3: die V3-Hülle las NUR `kontextSoftLaw` — die kuratierten Einträge des
// `MATERIAL_REGISTER` (im Bundle, `materialienFuer`) fehlten: gezählt 28
// Dokumente, darunter die BSV-Wegleitungen am AHVG (Reiter leer) und EHRA
// 1/25, 1/26 am OR. Das `KontextPanel` mischte beide (`mischeMaterialien`) —
// jetzt dieselbe Mischung, dieselbe Funktion (§5), Dubletten per key weg.
// AN-4: der Satz oben («nicht unterscheidbar») ist für `kontextSoftLaw` wahr
// und bleibt stehen; unterscheidbar wird es HIER: das Manifest wird parallel
// gefragt — es ist dieselbe memoisierte Promise, die `kontextSoftLaw` ohnehin
// zieht (kein zweiter Fetch). Ist es `null`, ist die Quelle unerreichbar, und
// der Reiter sagt das statt «nichts erfasst» (`wert: null`).
/** Behördliche Erläuterungen eines Erlasses + Datenstand des Registers (ISO). */
export interface ErlaeuterungStand {
  liste: MaterialBezug[];
  erzeugt: string;
}

async function ladeErlaeuterungen(key: string): Promise<ErlaeuterungStand | null> {
  const [manifest, weich] = await Promise.all([ladeMaterialManifest(), kontextSoftLaw('norm', [key])]);
  if (!manifest) return null;
  return { liste: mischeMaterialien(materialienFuer([key]), weich), erzeugt: manifest.erzeugt };
}

export function useErlaeuterungen(erlassKey: string | undefined, laden: boolean): Geladen<ErlaeuterungStand> {
  return useNachladen(erlassKey, laden, ladeErlaeuterungen);
}

/** Gesetzgebungsmaterialien eines Erlasses (Reiter «Materialien»). Je Liste
 *  `null` = Manifest unerreichbar; `erzeugt` = Datenstand des Registers. */
export interface MaterialStand {
  botschaften: BotschaftBezug[] | null;
  vernehmlassungen: VernehmlassungBezug[] | null;
  /** S6 · M-3: kantonale Ratschläge/Berichte (bisher gar nicht geladen). */
  kanton: KantonalesGeschaeft[] | null;
  /** S6 · M-6/B-12: Erzeugungsdatum des Registers (ISO) oder `null`. */
  erzeugt: string | null;
}

// EIN Promise.all, nicht mehrere Effekte: alle ziehen dasselbe Material-Manifest
// (`ladeMaterialManifest`, dort memoisiert), und der Reiter soll in EINEM
// Schritt fertig werden statt in mehreren sichtbaren Sprüngen (§15/2 — jeder
// Teil-Resolve wäre ein eigenes Einwachsen).
async function ladeGesetzgebung(key: string, locale: string): Promise<MaterialStand> {
  const [botschaften, vernehmlassungen, kanton, manifest] = await Promise.all([
    botschaftenFuer([key], locale), vernehmlassungenFuer([key], locale),
    kantonaleGesetzgebungFuer([key]), ladeMaterialManifest(),
  ]);
  return { botschaften, vernehmlassungen, kanton, erzeugt: manifest?.erzeugt ?? null };
}

/** S6 · M-11: die Sprache wird durchgereicht (vorher fest `de`) — fr/it holen
 *  die übersetzten Titel, `titelRueckfall` sagt, wo keiner vorliegt. */
export function useMaterialien(erlassKey: string | undefined, laden: boolean, locale = 'de'): Geladen<MaterialStand> {
  const lade = useCallback((key: string) => ladeGesetzgebung(key, locale), [locale]);
  return useNachladen(erlassKey, laden, lade);
}
