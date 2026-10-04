// ─── BS-Entscheiddatum: Kopf-Datum, Wahl und Plausibilitäts-Wächter (rein, §2) ─
//
// Aus bs-parse.ts herausgelöst (§6.6 Datei-Schlankheit, 4.10.2026; Code und Kommentare
// WÖRTLICH verschoben, Verhalten unverändert): `kopfDatum`, `plausiblesKopfDatum` (B-1,
// 23.9.2026) und neu `waehleBsDatum` (Variante A, 4.10.2026). bs-parse.ts re-exportiert
// die Namen, damit Aufrufer und Tests unverändert bleiben.

// ─── Kopf-Datum: das Entscheiddatum aus dem Deckblatt (W2·29-WERKBANK-LESER D2/B-1) ──
//
// BEFUND (Prüfrunde 1, reproduziert 23.9.2026): 42 der 3'765 BS-Dokumente haben im
// Metadaten-Kopf des Portals KEIN «Entscheiddatum» (Inventar `datum: null`). Der
// Import führte sie darum als `datumUnbekannt` mit dem Platzhalter <GN-Jahr>-01-01
// — und dieser Platzhalter wanderte ohne das Flag in die Bezugs-Shards, wo er als
// echtes Datum «01.01.2024» erschien und das «revidiert»-Warnzeichen auslöste.
// Das Datum steht aber im amtlichen Dokument selbst: das Deckblatt trägt unter der
// Titelzeile «ENTSCHEID»/«URTEIL»/«Urteil der Präsidentin» einen eigenen Absatz
// «vom 15. September 2025» (BES.2024.88, nF30_KEY 78827).
//
// DIE REGEL ist strukturell, kein Fliesstext-Raten (§1/§2): ein Absatz, der
// VOLLSTÄNDIG aus «vom <T>. <Monat> <JJJJ>» besteht UND unmittelbar auf einen
// Absatz folgt, der VOLLSTÄNDIG eine Entscheid-Titelzeile ist, innerhalb der
// ersten KOPF_FENSTER Einheiten (Briefkopf-Tabelle, GN, Titel, Datum stehen real
// an Position 3–6). Ein «vom …» im Sachverhalt ist nie ein ganzer Absatz direkt
// nach «URTEIL» und trifft darum nicht.
//
// GEMESSEN 23.9.2026 (Rohdokumente frisch vom Portal): 42/42 datumlose Dokumente
// tragen genau einen solchen Kopf; Gegenprobe an 42 Dokumenten MIT Metadaten-
// Datum (jedes 90. des Inventars): Kopf-Datum == Metadaten-Datum in allen Fällen,
// in denen die Regel greift (Zahl im PR-Bericht). Das Metadaten-Datum bleibt die
// erste Quelle; das Kopf-Datum füllt nur die Lücke (`baueSnapshot`).
//
// ERGÄNZUNG 4.10.2026 (Belege altern nicht — der Absatz oben bleibt als Stand
// 23.9.2026 stehen): «Kopf-Datum == Metadaten-Datum in allen Fällen» ist WIDERLEGT.
// Gegenprüfung Opus von PR #1295 (Abruf rechtsprechung.gerichte.bs.ch, 4.10.2026):
// AUS.2026.85 Portal 30.09.2026 / Kopf 1. Oktober 2026; BES.2025.105 04.03. / 1. April;
// BES.2025.117 08.04. / 6. Mai; VD.2025.146 06.05. / 6. April 2026; im Bestand
// AUS.2022.46 16.9. / 21.9.22 (der Urteilstext bestätigt den Kopf), AUS.2022.57,
// BES.2023.14, BEZ.2025.33 (4 von 31 ≈ 13 %). Seit der Variante A (Entscheid David
// 4.10.2026) gewinnt darum der KOPF, das Portal-Metadatum ist Rückfall und bleibt
// als `datumPortal` sichtbar (`waehleBsDatum`); Bestandsberichtigung:
// `berichtigeBsDatum`, Liste bibliothek/rechtsprechung/bs-datum-kopf-2026-10-04.md.
const KOPF_FENSTER = 12;
const MONATE: Record<string, string> = {
  Januar: '01', Februar: '02', März: '03', April: '04', Mai: '05', Juni: '06',
  Juli: '07', August: '08', September: '09', Oktober: '10', November: '11', Dezember: '12',
};
const KOPF_TITEL_RE = /^(?:ENTSCHEID|URTEIL|BESCHLUSS|VERFÜGUNG|(?:Entscheid|Urteil|Beschluss|Verfügung) de[rs] [A-ZÄÖÜ][a-zäöüß]+)$/;
const KOPF_DATUM_RE = new RegExp(`^vom (\\d{1,2})\\. (${Object.keys(MONATE).join('|')}) (\\d{4})$`);

/** Ganzabsatz-Text für den Kopf-Vergleich: NBSP/U+202F → Leerzeichen, kollabiert. */
const kopfText = (s: string): string => s.replace(/[\u00a0\u202f]/g, ' ').replace(/\s+/g, ' ').trim();

/** Das gelesene Kopf-Datum samt Fundstelle im Deckblatt (für die Änderungsliste, §7). */
export interface KopfDatumFund {
  iso: string;
  /** 0-basierte Einheit des Datums-Absatzes im Dokument-Body (Titelzeile = einheit − 1). */
  einheit: number;
  titel: string;
  text: string;
}

/**
 * Entscheiddatum aus dem Deckblatt samt Fundstelle, oder null. Rein (§2). Die
 * Anwendung steht in `waehleBsDatum` / `baueSnapshot`.
 */
export function kopfDatumFund(einheiten: ReadonlyArray<{ text: string }>): KopfDatumFund | null {
  const n = Math.min(einheiten.length, KOPF_FENSTER);
  for (let i = 1; i < n; i++) {
    const m = KOPF_DATUM_RE.exec(kopfText(einheiten[i].text));
    if (!m || !KOPF_TITEL_RE.test(kopfText(einheiten[i - 1].text))) continue;
    const tag = m[1].padStart(2, '0');
    const iso = `${m[3]}-${MONATE[m[2]]}-${tag}`;
    // Kalender-Gegenprobe: «vom 31. April» ist kein Datum (nie raten, §1).
    const d = new Date(`${iso}T00:00:00Z`);
    if (Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== iso) return null;
    return { iso, einheit: i, titel: kopfText(einheiten[i - 1].text), text: kopfText(einheiten[i].text) };
  }
  return null;
}

/** Entscheiddatum aus dem Deckblatt (ISO) oder null. Rein (§2). Exportiert für den Regressionstest. */
export function kopfDatum(einheiten: ReadonlyArray<{ text: string }>): string | null {
  return kopfDatumFund(einheiten)?.iso ?? null;
}

/**
 * Plausibilitäts-Riegel für das Kopf-Datum: nicht vor dem Jahr der Geschäftsnummer
 * (Eingang), nicht nach der Erstpublikation. Scheitert er, bleibt das Datum
 * ehrlich unbekannt (Platzhalter + `datumUnbekannt`) statt geraten.
 */
export function plausiblesKopfDatum(kopf: string | null | undefined, gnJahrZahl: number | null, erstpublikation: string | null): string | null {
  if (!kopf) return null;
  if (gnJahrZahl !== null && Number(kopf.slice(0, 4)) < gnJahrZahl) return null;
  if (erstpublikation && kopf > erstpublikation) return null;
  return kopf;
}

/**
 * Abstand Kopf-Datum ↔ Portal-Metadatum, ab dem das Kopf-Datum NICHT still
 * übernommen, sondern als Verdacht gemeldet wird (Auftrag David 4.10.2026). Messung
 * 4.10.2026 an den ersten acht Belegen: Abweichungen 2–30 Tage.
 */
export const KOPF_PORTAL_FENSTER_TAGE = 60;
const tageZwischen = (von: string, bis: string): number =>
  Math.round((Date.parse(`${bis}T00:00:00Z`) - Date.parse(`${von}T00:00:00Z`)) / 86_400_000);

export type BsDatumQuelle = 'kopf' | 'portal' | 'platzhalter';
export interface BsDatumWahl {
  datum: string;
  quelle: BsDatumQuelle;
  /** Portal-Metadatum, wenn es vom gewählten `datum` abweicht (→ `datumPortal`). */
  datumPortal: string | null;
  /** Gesetzt, wenn ein gelesenes Kopf-Datum NICHT übernommen wurde (Plausibilität). */
  verdacht: string | null;
}

/**
 * VARIANTE A für Basel-Stadt (Entscheid David 4.10.2026, Regel der OCL-Kantone vom
 * 25.9.2026): das Datum im Urteilskopf («ENTSCHEID/URTEIL vom …») gewinnt vor dem
 * Portal-Metadatum «Entscheiddatum»; das Metadatum ist nur Rückfall, wenn kein
 * Kopf-Datum lesbar ist. Fehlen beide: ehrlicher Platzhalter (`datumUnbekannt`).
 *
 * Plausibilitäts-Wächter (nie still übernehmen): ein Kopf-Datum vor dem GN-Jahr,
 * nach der Erstpublikation, in der Zukunft (nach `abgerufen`) oder mehr als
 * `KOPF_PORTAL_FENSTER_TAGE` Tage vom Portal-Datum entfernt wird nicht gewählt
 * (Portal/Platzhalter bleibt) und als `verdacht` ausgewiesen.
 */
export function waehleBsDatum(
  portal: string | null,
  kopf: string | null,
  gnJahrZahl: number | null,
  erstpublikation: string | null,
  abgerufen: string | null,
): BsDatumWahl {
  let verdacht: string | null = null;
  let kopfOk: string | null = null;
  if (kopf) {
    if (plausiblesKopfDatum(kopf, gnJahrZahl, erstpublikation) === null) {
      verdacht = `Kopf-Datum ${kopf} unplausibel (vor GN-Jahr ${gnJahrZahl ?? '–'} oder nach Erstpublikation ${erstpublikation ?? '–'})`;
    } else if (abgerufen && kopf > abgerufen) {
      verdacht = `Kopf-Datum ${kopf} liegt in der Zukunft (Abruf ${abgerufen})`;
    } else if (portal && Math.abs(tageZwischen(portal, kopf)) > KOPF_PORTAL_FENSTER_TAGE) {
      verdacht = `Kopf-Datum ${kopf} weicht ${tageZwischen(portal, kopf)} Tage vom Portal-Datum ${portal} ab (> ${KOPF_PORTAL_FENSTER_TAGE})`;
    } else kopfOk = kopf;
  }
  if (kopfOk) return { datum: kopfOk, quelle: 'kopf', datumPortal: portal && portal !== kopfOk ? portal : null, verdacht };
  if (portal) return { datum: portal, quelle: 'portal', datumPortal: null, verdacht };
  const j = gnJahrZahl;
  return { datum: j === null ? '' : `${j}-01-01`, quelle: 'platzhalter', datumPortal: null, verdacht };
}
