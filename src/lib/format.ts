// ─── Fachneutrale Formatter & Parser (Formatter-Heimat, H-9) ────────────────
//
// SSOT der fachneutralen Anzeige-/Parse-Helfer (Datum, CHF, Schweizer Zahl).
// KEINE materielle Rechtsregel (§2/§3): reine Darstellung/Normalisierung, kein
// Recht. Ausserhalb des Risikopfad-Namespaces `vorlagen/` angesiedelt, damit
// Engine-/Tarif-Module hier importieren statt lokal zu kopieren (Duplikat-
// Ursache war strukturell). `vorlagen/datum.ts` re-exportiert diese Symbole
// unverändert (Fassade, §6 Ziff. 6) — kein Konsument-Importpfad bricht.

import { ISO_DATUM_RE } from './datumsUtils';

// Langes Schweizer Datumsformat für Briefkopf/Unterschriften der Vorlagen
// («5. Juni 2026») – deterministisch aus ISO, kein Locale-API.
const MONATE = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
  'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];

export function fmtDatumLang(iso?: string): string {
  if (!iso?.includes('-')) return iso || '________';
  const [j, m, t] = iso.split('-').map(Number);
  if (!j || !m || !t || m < 1 || m > 12) return iso;
  return `${t}. ${MONATE[m - 1]} ${j}`;
}

/** ISO-Datum → dd.MM.yyyy; leer/unvollständig → Ausfüll-Strich. */
export const fmtDatum = (iso?: string): string =>
  (iso?.includes('-') ? iso.split('-').reverse().join('.') : iso || '________');

/** STRENGES ISO-Datum (genau yyyy-MM-dd) → dd.MM.yyyy; sonst Ausfüll-Strich.
 *  Bewusst strenger als fmtDatum (Regex statt includes; '________' statt Roh-ISO).
 *  Zuvor 6× wortgleich in den Vertrags-Schemas (Entdoppelung, golden-bewiesen). */
export const fmtIsoStrict = (iso: string): string =>
  ISO_DATUM_RE.test(iso) ? iso.split('-').reverse().join('.') : '________';

/** CHF-Betrag mit Tausender-Apostroph und zwei Dezimalen. */
export function fmtCHF(roh: string): string {
  const n = Number(String(roh).replace(/['’\s]/g, '').replace(',', '.'));
  if (!Number.isFinite(n)) return roh;
  const [ganz, dez] = n.toFixed(2).split('.');
  return ganz.replace(/\B(?=(\d{3})+(?!\d))/g, "'") + '.' + dez;
}

/**
 * CHF-Betrag aus einer ZAHL: de-CH mit genau zwei Dezimalen
 * (Tausender-Trennung gemäss Locale). Zuvor wortgleich lokal definiert in
 * lib/teuerung.ts, lib/erbteilung.ts und components/forms/ErbteilungForm.tsx
 * (Entdoppelung 5.6.2026, golden-bewiesen). NICHT verwechseln mit `fmtCHF`
 * (oben, für Nutzer-STRINGS) oder verzugszins.formatCHF (spezialisiert).
 */
export const chf = (n: number): string =>
  n.toLocaleString('de-CH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/**
 * CHF-Betrag GERUNDET auf GANZE Franken mit «CHF »-Präfix (de-CH-Trennung).
 * Reiner Anzeige-Helfer der Gebühren-/Kosten-Formulare. BEWUSST verschieden von
 * `chf` (zwei Dezimalen, kein Präfix): hier ganze Franken — daher eigener Name,
 * nicht zusammenführen (§1). Zuvor wortgleich in GrundbuchEintragForm/
 * BeurkundungForm/NotariatGrundbuchForm/ProzesskostenForm (Entdopplung, §6 Ziff. 6)
 * SOWIE 5× lokal in tarif/staffel · prozesskosten · notariatGrundbuch (H-9).
 */
export const chfGanz = (n: number): string => `CHF ${Math.round(n).toLocaleString('de-CH')}`;

/**
 * CHF-Betrag mit «CHF »-Präfix und BEDINGTEN Dezimalstellen: ganzzahlige Werte
 * ohne Dezimalstellen, gebrochene mit genau zwei (`n % 1` als Wahrheitswert).
 * BEWUSST verschieden von `chfGanz` (rundet IMMER auf ganze Franken, verwirft
 * also Dezimalstellen) und von `chfPraefix`/`chf` (feste Dezimalstellen-Zahl):
 * hier zeigt die Dezimalstelle selbst an, ob der Betrag glatt ist — Rappen-
 * Bänder (2 ‰/5 ‰) brauchen genau das (§1, nicht zusammenführen). Zuvor
 * wortgleich lokal in gebvKosten.ts (QS-CODE-ENTDOPPLUNG, 4.8.2026).
 */
export const chfBedingt = (n: number): string =>
  `CHF ${n.toLocaleString('de-CH', { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 })}`;

/**
 * CHF-Betrag mit «CHF »-Präfix, UNGERUNDET mit den de-CH-Standard-Dezimalen
 * (`toLocaleString` ohne explizite Fraction-Digit-Optionen). BEWUSST
 * verschieden von `chfBedingt` (kappt auf max. 2 Dezimalen) und `chfGanz`
 * (rundet auf ganze Franken): hier bleibt der Rohwert unverändert sichtbar —
 * nicht zusammenführen (§1). Zuvor wortgleich lokal in streitwert.ts
 * (QS-CODE-ENTDOPPLUNG, 4.8.2026).
 */
export const chfPraefix = (n: number): string => `CHF ${n.toLocaleString('de-CH')}`;

/**
 * Reine de-CH-Zahldarstellung OHNE «CHF »-Präfix und ohne Rundung
 * (`toLocaleString` ohne explizite Fraction-Digit-Optionen). BEWUSST
 * verschieden von `chfPraefix` (trägt den Präfix): hier steht das Wort «CHF»
 * bereits im umgebenden Text des Aufrufers — ein zweiter Präfix wäre doppelt
 * (§1, nicht zusammenführen). Zuvor wortgleich lokal in bgerRechtsweg.ts
 * (QS-CODE-ENTDOPPLUNG, 4.8.2026).
 */
export const chfOhnePraefix = (n: number): string => n.toLocaleString('de-CH');

/** Robuste Zahl aus Nutzereingabe (Apostroph/Komma toleriert) – sonst null. */
export const zahl = (roh?: string): number | null => {
  const n = Number(String(roh ?? '').replace(/['’\s]/g, '').replace(',', '.'));
  return Number.isFinite(n) && String(roh ?? '').trim() !== '' ? n : null;
};

/** Positive GANZE Zahl aus Nutzereingabe (Stückzahlen: Aktien, Stammanteile,
 *  Zeichnungen) – sonst null. /simplify 7.6.2026: das Muster
 *  «zahl(x) ≤ 0 ‖ !Number.isInteger» stand zuvor 5× wortgleich in den
 *  Mappen-Gates; die NORM-Fehlertexte bleiben bewusst beim Aufrufer (§3/§4). */
export const ganzePositive = (roh?: string): number | null => {
  const n = zahl(roh);
  return n !== null && n > 0 && Number.isInteger(n) ? n : null;
};

// ─── B-6 · Stand-Ausweis (QS-BASIS) ─────────────────────────────────────────
//
// EIN Baustein für den Herkunfts-/Stand-Nachweis JEDER Zitat-Kopie (§7-Zitat-
// Ausnahme a–d): Fassungs-/Konsolidierungsdatum + Abrufdatum + Permalink. Zuvor
// hand-rollte jeder Kopier-Pfad (Reader-Artikel, inline-Marke, Entscheid) seinen
// eigenen `${zitat}\n${url}`-String — Streu-Implementierungen ohne Abruf-/Stand-
// Angabe (anwaltlich unvollständig, bei der nächsten Revision eine Falle in der
// eigenen Akte). Fachneutral (§3): baut nur die Nachweiszeile, kennt KEINE
// Rechtsregel. Fehlende Fassung (Gerichtsentscheide haben keine Konsolidierung)
// wird EHRLICH weggelassen (§8), nie erfunden. Domain-neutral: der Permalink kommt
// als fertige absolute URL vom Aufrufer (Klick-Zeit `location.origin`), damit ein
// späterer Domain-Wechsel (B-4/B-10) nur die Basis tauscht.

export interface StandAusweis {
  /** Konsolidierungs-/Fassungsdatum ISO (YYYY-MM-DD). Entfällt bei Entscheiden (§8). */
  fassung?: string;
  /** Abrufdatum ISO (YYYY-MM-DD) — der Klick-Zeitpunkt der Kopie. */
  abruf: string;
  /** Permalink: absolute URL inkl. origin, Pfad und #anker (domain-neutral aufgebaut). */
  permalink: string;
  /** W2·10-UI-NAV/R3: amtlicher Deep-Link auf DIESELBE Stelle in der geltenden
   *  Fassung (ELI-Form, z. B. Fedlex `…/de#art_957`). Optional — liegt er nicht
   *  vor (Kanton, aufgehobener Artikel, Synthese-Suffix), bleibt die Zeile ohne
   *  ihn (§8: lieber keine Quelle als eine erfundene). */
  amtlich?: string;
}

/** Stand-Ausweis als eine Zeile:
 *  «Fassung vom … · abgerufen am … · <permalink> · amtliche Fassung: <url>».
 *  Reihenfolge fest (§7 a–d); fehlende Fassung wird ehrlich ausgelassen (§8).
 *
 *  W2·10-UI-NAV/R3: die amtliche Quelle steht ZULETZT und ausdrücklich benannt.
 *  Zwei URLs unkommentiert nebeneinander wären in einer Rechtsschrift nicht
 *  auseinanderzuhalten — und §7 macht die amtliche Fassung zur massgeblichen:
 *  der Permalink zeigt auf unsere Projektion, dieser Link auf das Original. Wer
 *  das Zitat in eine Akte klebt, trägt damit beides bei sich (D1: Norm, Link,
 *  Stand). Der Aufrufer liefert die fertige URL (verifizierLinkArtikel, im
 *  Builder gegen den Snapshot validiert) — dieser Baustein bildet keine URL. */
export function standAusweis(a: StandAusweis): string {
  const teile: string[] = [];
  if (a.fassung) teile.push(`Fassung vom ${fmtIsoStrict(a.fassung)}`);
  teile.push(`abgerufen am ${fmtIsoStrict(a.abruf)}`);
  if (a.permalink) teile.push(a.permalink);
  if (a.amtlich) teile.push(`amtliche Fassung: ${a.amtlich}`);
  return teile.join(' · ');
}

/** Kopierbares Zitat: Fundstelle in Zeile 1, Stand-Ausweis in Zeile 2.
 *  Trägt die Fundstelle bereits ein Standdatum (baueZitat «(Stand …)»), bleibt
 *  `fassung` weg — sonst stünde das Datum doppelt (§5 «nichts doppelt»). */
export function zitatMitAusweis(zitat: string, a: StandAusweis): string {
  return `${zitat}\n${standAusweis(a)}`;
}

/** ISO-Datum (YYYY-MM-DD) aus einem Date — das Abrufdatum der Kopie. Das Date wird
 *  als EINGABE geführt (§2: kein arg-loses `new Date()` in src/lib); der Klick-
 *  Handler in der UI-Schicht reicht `new Date()` herein. So bleibt der Baustein
 *  deterministisch/testbar, die Uhr sitzt an der UI-Grenze (Muster VerfallUebersicht). */
export const heuteIso = (jetzt: Date): string => {
  // W2·17 E-D1-B04: LOKALES Kalenderdatum des Nutzers (nicht toISOString = UTC) —
  // sonst trug «abgerufen am» zwischen 00:00 und 01:00/02:00 Schweizer Zeit den Vortag.
  const z = (n: number): string => String(n).padStart(2, '0');
  return `${jetzt.getFullYear()}-${z(jetzt.getMonth() + 1)}-${z(jetzt.getDate())}`;
};
