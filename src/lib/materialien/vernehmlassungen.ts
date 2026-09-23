// ─── Lese-Brücke «Gesetzgebung in Arbeit» (Vernehmlassungen) ────────────────────
//
// Paket 3 (W3·11): projiziert die generierten Vernehmlassungen aus der lazy geladenen
// register.json (Browse-Manifest) auf eine Norm. Reine Ladeschicht (§3) — kein Inhalt
// erzeugt, keine Rechtslogik. Die Verfahren liegen NICHT im App-Bundle (§15): sie kommen
// aus derselben register.json, die das Kontext-Panel ohnehin lädt (ladeMaterialManifest,
// gecachte Promise) — kein zweiter Fetch.
//
// FR/IT-Titel (12.9.2026): aus `register-i18n.json`, nur bei locale 'fr'/'it' geholt —
// der Index bleibt sprachfrei, die Übersetzung liegt erst auf dem Ergebnis (wie bei den
// Botschaften). Für 'de' kein Abruf und keine Kopie.
//
// Payload/§15 (Finding 11): vernehmlassungenFuer iteriert die volle Liste NICHT je Aufruf,
// sondern baut EINMAL einen erlassKey→Verfahren-Index (memoisiert auf die Manifest-Referenz).
// §5: keine zweite Wahrheit — In-Memory-Projektion des Manifests, keine committete Parallel-Datei.

import { ladeMaterialManifest, ladeMaterialTitelI18n, titelUebersetzung, type TitelRueckfall } from './browse';
import type { BrowseMaterial, MaterialManifest, VernehmlassungStatus } from './typen';

/** Anzeige-Form eines Vernehmlassungsverfahrens (Gesetzgebung-in-Arbeit-Eintrag). */
export interface VernehmlassungBezug {
  key: string;
  /** Amtlicher Titel je Sprache (DE Pflicht, FR/IT wo vorhanden). */
  titel: string;
  titelFr?: string;
  titelIt?: string;
  /** Verfahrens-Zustand (amtliches Vokabular 0–6). */
  status: VernehmlassungStatus;
  /** Anhörungs-Frist (ISO); fehlt bei Status in-vorbereitung/geplant. */
  fristStart?: string;
  fristEnde?: string;
  /** Fedlex-Live-Link zum Vernehmlassungs-Portal (amtliche Quelle, §7c). */
  quelleUrl: string;
  /** Wie bei den Botschaften: Grund, warum der deutsche Titel steht, obwohl die
   *  Oberfläche auf fr/it steht (§8). */
  titelRueckfall?: TitelRueckfall;
}

/** Priorität für die Anzeige-Sortierung: laufend zuerst (was jetzt offen ist), dann geplant/
 *  in Vorbereitung (was kommt), dann abgeschlossen, zurückgezogen zuletzt. */
const STATUS_RANG: Record<VernehmlassungStatus, number> = {
  laufend: 0,
  geplant: 1,
  'in-vorbereitung': 2,
  'abgeschlossen-stellungnahmen': 3,
  'abgeschlossen-bericht': 4,
  abgeschlossen: 5,
  zurueckgezogen: 6,
};

// Index memoisiert auf die Manifest-Referenz (eine Manifest-Instanz je Session).
let indexCache: { manifest: MaterialManifest; index: Map<string, VernehmlassungBezug[]> } | null = null;

function browseNachVernehmlassung(m: BrowseMaterial): VernehmlassungBezug | null {
  const v = m.vernehmlassung;
  if (!v) return null;
  return {
    key: m.key,
    titel: m.titel,
    status: v.status,
    fristStart: v.fristStart,
    fristEnde: v.fristEnde,
    quelleUrl: m.quelleUrl,
  };
}

/** Deterministische Anzeige-Sortierung: Status-Priorität → Fristende absteigend → key. */
function vergleiche(a: VernehmlassungBezug, b: VernehmlassungBezug): number {
  return (STATUS_RANG[a.status] - STATUS_RANG[b.status])
    || (a.fristEnde && b.fristEnde ? (a.fristEnde < b.fristEnde ? 1 : a.fristEnde > b.fristEnde ? -1 : 0) : (a.fristEnde ? -1 : b.fristEnde ? 1 : 0))
    || (a.key < b.key ? -1 : a.key > b.key ? 1 : 0);
}

/** Baut (einmal je Manifest) den erlassKey→Verfahren-Index. */
function baueIndex(manifest: MaterialManifest): Map<string, VernehmlassungBezug[]> {
  const index = new Map<string, VernehmlassungBezug[]>();
  for (const m of manifest.materialien) {
    if (m.doktyp !== 'vernehmlassung') continue;
    const bezug = browseNachVernehmlassung(m);
    if (!bezug) continue;
    for (const nk of m.normKeys) {
      const liste = index.get(nk) ?? [];
      liste.push(bezug);
      index.set(nk, liste);
    }
  }
  for (const liste of index.values()) liste.sort(vergleiche);
  return index;
}

/**
 * Vernehmlassungen über mehrere normKeys vereinigt + dedupliziert (Status-Priorität, laufend
 * zuerst). Leeres Array = keine Verknüpfung im Graphen (Reichweite ~ab 2006). `null` = Manifest-
 * Ladefehler (Fetch-Fehler ≠ leer, §8).
 */
export async function vernehmlassungenFuer(
  normKeys: readonly string[], locale = 'de',
): Promise<VernehmlassungBezug[] | null> {
  const [manifest, i18n] = await Promise.all([
    ladeMaterialManifest(), ladeMaterialTitelI18n(locale),
  ]);
  if (!manifest) return null;
  if (!indexCache || indexCache.manifest !== manifest) {
    indexCache = { manifest, index: baueIndex(manifest) };
  }
  const seen = new Set<string>();
  const out: VernehmlassungBezug[] = [];
  for (const k of normKeys) {
    for (const v of indexCache.index.get(k) ?? []) {
      if (!seen.has(v.key)) { seen.add(v.key); out.push(v); }
    }
  }
  out.sort(vergleiche);
  if (i18n.art === 'nicht-noetig') return out;
  return out.map((v) => ({ ...v, ...titelUebersetzung(v.key, locale, i18n) }));
}

/**
 * Deutsche Anzeige-Labels der Status (UI, keine Rechtslogik) — WÖRTLICH das
 * amtliche Vokabular.
 *
 * S6 · Befund M-2 (23.9.2026): hier standen eigene Kurzformen, und zwei davon
 * sagten das Gegenteil des amtlichen Sinns — Status 4 hiess «abgeschlossen
 * (Ergebnisbericht)», als läge der Bericht vor; amtlich heisst er «abwarten
 * Ergebnisbericht». Seither 1:1 die `skos:prefLabel` (de) von
 * https://fedlex.data.admin.ch/vocabulary/consultation-status/0 … /6,
 * abgefragt über https://fedlex.data.admin.ch/sparqlendpoint am 23.9.2026
 * (Abfrage: `?s skos:prefLabel ?l FILTER(lang(?l)="de")` über die sieben
 * Begriffe). Nicht kürzen: eine Kurzform ist die Stelle, an der der Sinn
 * kippte.
 */
export const VERNEHMLASSUNG_STATUS_LABEL: Record<VernehmlassungStatus, string> = {
  'in-vorbereitung': 'In Vorbereitung',
  geplant: 'Geplant',
  laufend: 'Laufend',
  'abgeschlossen-stellungnahmen': 'Abgeschlossen – abwarten Stellungnahmen und/oder des Ergebnisberichts',
  'abgeschlossen-bericht': 'Abgeschlossen – abwarten Ergebnisbericht',
  abgeschlossen: 'Abgeschlossen',
  zurueckgezogen: 'Zurückgezogen',
};

/**
 * S6 · Befund M-1: Welche Verfahren sind «in Arbeit»? Nur die, deren Anhörung
 * läuft oder noch bevorsteht (amtlich 0–2). Abgeschlossene (3–5) und
 * zurückgezogene (6) Verfahren sind Geschichte des Erlasses, nicht seine
 * Baustelle — unter «In Arbeit» gezählt hätten sie an OR 33 laufende
 * Verfahren behauptet, wo es null gab.
 */
export function vernehmlassungInArbeit(status: VernehmlassungStatus): boolean {
  return status === 'laufend' || status === 'geplant' || status === 'in-vorbereitung';
}
