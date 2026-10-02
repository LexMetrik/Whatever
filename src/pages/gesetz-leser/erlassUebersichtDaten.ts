import type { ErlassKopf } from '../../lib/normtext/browse';

// ═══ ABSCHNITT · Daten und reine Ableitungen der Erlass-Übersicht ════════════
// (W2·19-GLIEDERUNG/S6, Bau-Spec §5.1)
//
// Eigene Datei, weil `parts/ErlassUebersicht.tsx` sonst neben der Komponente
// auch Konstanten und Funktionen exportierte — das bricht Fast Refresh
// (eslint `react-refresh/only-export-components`). Hier lebt alles, was OHNE
// React auskommt und einzeln unit-testbar ist; die Komponente konsumiert es.
// Reine Darstellungs-Vorstufe (§3): kein Rechtsinhalt, keine Heuristik.

// ─── §8-Ehrlichkeit: belegte Teilerfassung einzelner Erlasse ─────────────────
//
// Entscheid David 8.8.2026 (Bau-Spec §11 Ziff. 2, Wortlaut des angenommenen
// Vorschlags: «Option A — sofort ehrlicher §8-Hinweis ‹Auswahl, nicht
// vollständig› in der Erlass-Übersicht (kein Korpus-Eingriff) + separater
// Korpus-Prüfauftrag»). Die neue Seitenleiste macht die Lücke erstmals
// sichtbar; bis der Korpus geprüft ist, sagt die UI sie an, statt sie zu
// verschweigen.
//
// FORM nach dem Vorbild `ENUMERATIONS_BELEGE` (src/lib/normtext/erfassungsgrad.ts):
// ein EMPIRISCH BELEGTER Fakt mit Prüfdatum — kein `if (key === …)`-Codepfad,
// keine Heuristik (§2/§8). Die amtliche Quelle-URL steht bewusst NICHT hier,
// sie kommt zur Laufzeit aus `erlass.quelleUrl`: keine zweite Quell-Wahrheit
// (§5), nichts Erfundenes (§7).
//
// PROVENIENZ des einen Eintrags (gemessen am committeten Snapshot
// `public/normtext/kanton/SG-3849.json`, 607 Einträge, 9.8.2026): nur 17 der
// 607 Einträge tragen überhaupt eine Erlass-Artikelnummer, und deren Folge ist
// grob lückenhaft — 2, 7, 11, 12, 13, 15, 19, 43, 51, 71, 80, 82, 84, 381, 505,
// 544, 1032. Art. 1 fehlt, ebenso alles dazwischen; die übrigen 590 Einträge
// sind Anhang-Ziffern.
//
// KORREKTUR gegenüber der ersten Fassung dieses Eintrags (§7 in Aktion): sie
// behauptete «erfasst sind die Artikel 2 und 7» — das war eine zu enge Sonde
// (Token-Filter statt Label-Filter), und der Test hat sie sofort rot gemacht.
// Der Wortlaut nennt darum die MESSBARE Eigenschaft «lückenhaft» statt einer
// Liste, die beim nächsten Korpus-Lauf falsch wäre.
//
// ZWEITE KORREKTUR (W2·19B-KORPUS, 13.8.2026 — der Prüfauftrag selbst): Die
// Annahme «teilerfasst/lückenhaft» ist WIDERLEGT. Gegen die amtliche Quelle
// geprüft (gesetzessammlung.sg.ch, Portal-API `texts_of_law/821.5` und das
// amtliche PDF der Version 3849, Stand 1. Januar 2026):
//   · SG-3849 ist der Gebührentarif für die Kantons- und Gemeindeverwaltung
//     (GebT, sGS 821.5) — NICHT die GB-GebV (sGS 914.5), die das `erlass`-Feld
//     des Snapshots fälschlich mitnennt (eigener Mangel, siehe Rückgabe).
//   · Der GebT führt AMTLICH KEINE EIGENEN ARTIKEL. Sein Textkörper ist
//     durchgehend nach Gebühren-Nummern (10.01 … 70.11) gegliedert. Es fehlt
//     also nichts «zwischen Art. 2 und Art. 7» — es gibt gar keine Artikel.
//   · Alle 17 als «Art. N» geführten Einträge (2, 7, 11, 12, 13, 15, 19, 43,
//     51, 71, 80, 82, 84, 381, 505, 544, 1032) sind FEHLEXTRAKTIONEN: der
//     PDF-Pfad hat Verweise auf FREMDE Erlasse (Art. 381/505/544 ZGB,
//     Art. 1032 OR, kantonale Verordnungen) als eigene Artikel-Köpfe gelesen.
//     Stichprobe 17/17, auf zwei unabhängigen Wegen geprüft (Portal-API und
//     PDF-Volltext).
// Der Befund-Satz sagt darum jetzt die richtige Sache: nicht «da fehlt etwas»,
// sondern «was hier als Artikel steht, gehört nicht hierher».
//
// AUFLÖSUNG: der Eintrag verschwindet, sobald der PDF-Pfad die Ziffern-Tarife
// richtig liest (eigene Erkennungsregel «Nr. XX.YY am Zeilenanfang» statt des
// generischen «Art. N»-Musters) und der Snapshot ohne die 17 Phantom-Artikel
// neu erzeugt ist — sein natürlicher Ort ist danach der Generator, nicht die
// Darstellungsschicht. Bis dahin bleibt er stehen, weil die UI sonst 17
// erfundene Artikel unwidersprochen als amtlich ausgäbe (§8).
export interface TeilerfassungsBeleg {
  /** Der §8-Satz, den die UI zeigt. Beschreibt den MESSBAREN Befund, kein Urteil. */
  befund: string;
  /** Prüfdatum des Befunds (ISO) — er gilt für den Snapshot dieses Standes. */
  geprueftAm: string;
}

export const TEILERFASSUNG_BELEGE: Readonly<Record<string, TeilerfassungsBeleg>> = Object.freeze({
  'SG-3849': {
    befund: 'Fehlerhaft erfasst: dieser Gebührentarif ist amtlich durchgehend nach Gebühren-Nummern gegliedert und kennt gar keine eigenen Artikel. Die 17 hier als «Art.» geführten Einträge sind irrtümlich übernommene Verweise auf andere Erlasse; die Gebühren-Nummern selbst sind vollständig. Massgeblich ist die amtliche Fassung.',
    geprueftAm: '2026-08-13',
  },
});

/** Ein Erlass-Snapshot ist belegt teilerfasst (§8) — sonst `undefined`. */
export function teilerfassung(erlassKey: string): TeilerfassungsBeleg | undefined {
  return TEILERFASSUNG_BELEGE[erlassKey];
}

// ─── Reine Ableitungen aus dem Erlass-Kopf / Register ────────────────────────

/**
 * Das amtliche Datum ohne den nachgestellten Stand-Zusatz. Die Sidecar-Zeile
 * lautet «vom 10. Dezember 1907 (Stand am 1. Juli 2026)» — der Stand steht in
 * der Zeile direkt darunter mit seinem maschinellen Wert, hier wäre er eine
 * Dopplung. Der amtliche Wortlaut selbst bleibt unangetastet (§7): geschnitten
 * wird ausschliesslich diese eine, formelhafte Klammer am Ende; der volle
 * String bleibt über `title` erreichbar (§8, kein stiller Verlust).
 *
 * ── Ä74 (17.8.2026) · «am» IST OPTIONAL — 1182 VON 1420 SIDECARS ────────────
 * BEFUND, gemessen beim Umbau der V3-Übersichtsbox an BS-640.100: die Zeile las
 * «Erlassdatum · Vom 12. April 2000 (Stand 1. Januar 2026)» und direkt darunter
 * «Stand · 01.01.2026» — genau die Dopplung, gegen die diese Funktion gebaut ist,
 * ungehindert durchgelaufen. Ursache: Fedlex schreibt «(Stand am …)», die
 * KANTONALEN Sammlungen schreiben «(Stand …)» ohne «am», und das Muster verlangte
 * das «am».
 *
 * VERBREITUNG (gezählt 17.8.2026 über alle `public/normtext/struktur/**`):
 * 1420 Sidecars tragen ein Erlassdatum — 227 in der Fedlex-Form «(Stand am …)»,
 * **1182 in der kantonalen Form «(Stand …)»**, 11 mit einer anderen Klammer.
 * Die Funktion griff also bei 16 % und liess 83 % durch.
 *
 * Die Klammer bleibt eng gefasst: sie muss mit «Stand» BEGINNEN und am Ende der
 * Zeichenkette stehen. Klammern mit anderem Inhalt bleiben unangetastet — die
 * Fundstelle «(AS 2000 1)» ebenso wie die freiburgische Form «(Fassung in Kraft
 * getreten am 01.12.2025)», die eine EIGENE Aussage trägt und kein Stand-Zusatz
 * ist (beide als Negativ-Sonde im Test).
 *
 * Wirkung auf die Ist-Hülle: deren Erlass-Übersicht (`parts/ErlassUebersicht`)
 * konsumiert dieselbe Ableitung und zeigte die Dopplung an denselben 1182
 * Erlassen. Der Fix wirkt dort mit — bewusst, denn es ist derselbe Mangel;
 * eine korrigierte Zweitkopie in `v3/` wäre die zweite Wahrheit, die §5 verbietet.
 */
export function nurErlassdatum(erlassdatum: string): string {
  // P3-4 (Bug-Check-Nachzug 18.8.2026): `(?:…)+` statt EINER Klammer.
  // GEMESSEN an GWV_FINMA: «vom 3. Juni 2015 (Stand am 1. Januar 2023) (Stand
  // am 1. Januar 2023)» — dieselbe Klammer doppelt (1 von 1420 Sidecars). Ein
  // `$`-verankertes `replace` schnitt nur die letzte; die erste blieb über der
  // Zeile «Stand · 01.01.2023» stehen, also genau die Dopplung, gegen die diese
  // Funktion gebaut ist, eine Ebene höher. Die Enge bleibt unangetastet:
  // geschnitten wird weiter NUR eine Kette von Stand-Klammern am Ende, und
  // jede fremde Klammer davor («(AS 2000 1)») stoppt sie.
  return erlassdatum.replace(/(?:\s*\(Stand(?: am)? [^)]*\))+\s*$/, '').trim();
}

/** Das erlassgebende Organ aus der amtlichen Präambel (ohne Schluss-Komma). */
export function erlassOrgan(kopf: ErlassKopf | null): string | null {
  const zeile = kopf?.praeambel?.find((z) => z.rolle === 'autor')?.text?.trim();
  if (!zeile) return null;
  return zeile.replace(/[,;]\s*$/, '');
}
