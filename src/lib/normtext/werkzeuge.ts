// ─── Norm ↔ Werkzeug-Brücke (D1, Differenzierung) ───────────────────────────
//
// Aus einem Gesetz direkt zum passenden LexMetrik-Rechner/zur Vorlage — die
// Verknüpfung, die kein reiner Rechtstext-Anbieter (Fedlex/lexfind) hat, weil
// keiner Rechner UND Normtext führt.
//
// Deklarierte Zuordnung Erlass-Key (Bund) → Katalog-Karten-IDs. Die Karte liefert
// Titel + href ZUR LAUFZEIT (Single Source = startseiteConfig, §5); nicht
// verfügbare (geplante) Karten werden ausgeblendet → nie ein toter Link (§8).

import { ALLE_KARTEN, istVerfuegbar } from '../startseiteConfig';
import { ERLASS_REGISTER } from './register';
import { bundSnapshotRef } from './bundRef';
import { MATERIAL_REGISTER, behoerdeVon, DOKTYP_LABEL } from '../materialien/register';
import type { Herkunft } from '../verzahnung/typen';
import { erlassPfad } from './erlassAdresse';

// Exportiert für das Konsistenz-Tor (werkzeuge.test.ts): jede Karten-ID muss auf
// eine existierende Katalog-Karte zeigen — sonst verschluckt `werkzeugeFuerNorm`
// einen Tippfehler still (§8: kein toter Link, aber auch kein heimlich fehlendes
// Werkzeug).
export const ERLASS_WERKZEUGE: Readonly<Record<string, string[]>> = {
  OR: ['kuendigung-sperrfristen', 'lohnfortzahlung', 'ferienanspruch', 'dreizehnter-monatslohn', 'ueberstunden-zuschlag', 'verjaehrung', 'verzugszins', 'schadenszins', 'gewaehrleistung', 'mietrecht', 'mietzinsanpassung', 'arbeitsvertrag', 'mietvertrag-wohnen', 'auftrag', 'werkvertrag', 'mahnung'],
  ZGB: ['erbrecht-fristen', 'erbteilung', 'erb-ausgleichung', 'gueterrecht-vorschlag', 'vorsorgeausgleich', 'eigenhaendiges-testament', 'oeffentliches-testament', 'vorsorgeauftrag', 'patientenverfuegung'],
  ZPO: ['prozesskosten', 'zustaendigkeit', 'zpo-fristen', 'streitwert', 'kostenvorschuss', 'parteientschaedigung-sicherheit', 'schlichtungsgesuch', 'klage-vereinfacht', 'klage-ordentlich'],
  SCHKG: ['schkg-fristen', 'betreibungskosten', 'schkg-zustaendigkeit', 'rechtsoeffnungsbegehren', 'rechtsvorschlag', 'nichtbekanntgabe-betreibung'],
  GEBV_SCHKG: ['betreibungskosten'],
  STGB: ['straf-verjaehrung', 'straf-zustaendigkeit', 'strafanzeige', 'strafantrag-vorlage'],
  // strafanzeige ergänzt 23.9.2026 (D6): das Anzeigerecht steht in Art. 301 StPO
  // (dieselbe Norm trägt die artikelscharfe Kante unten) — vorher fehlte das
  // Werkzeug auf Erlass-Ebene genau beim Erlass, der die Regel trägt.
  STPO: ['straf-zustaendigkeit', 'einsprache', 'strafanzeige'],
  BGG: ['bgg-fristen', 'bundesgerichtsgebuehren', 'rechtsmittelpruefung'],
  VVG: ['klage-vvg-leistungen'],
  HREGV: ['gmbh-gruendung', 'ag-gruendung', 'statuten', 'gv-vr-beschluss'],
  // ArG (SR 822.11) — nur, was das ArG selbst regelt (Befund AN-6, 23.9.2026):
  // Überzeit und ihr Lohnzuschlag (Art. 12/13 ArG). Entfernt, weil die Regel im
  // OR steht, nicht im ArG: lohnfortzahlung (Art. 324a/324b OR; die einzige
  // Lohnfortzahlung im ArG, Art. 35b bei Mutterschaft, rechnet der Rechner mit
  // der kantonalen Skala nicht), ferienanspruch (Art. 329a ff. OR; das ArG
  // erwähnt Ferien nur in Art. 73 Abs. 1 lit. b/Abs. 2, Schlussbestimmung zu
  // kantonalem Recht) und dreizehnter-monatslohn (vertraglicher Lohnbestandteil;
  // das ArG kennt ihn nicht). Fedlex AKN, Fassung 1.9.2023, abgerufen 23.9.2026.
  ARG: ['ueberstunden-zuschlag'],
  VMWG: ['mietrecht', 'mietzinsanpassung'],
  // Stubs mit passenden Werkzeugen:
  DBG: ['steuer-verjaehrung'],
  STG: ['steuer-verjaehrung'],
  AHVG: ['ahv-beitraege'],
  AIG: ['auslaenderrecht-fristen'],
  DSG: ['datenschutz-fristen'],
};

export interface Werkzeug { id: string; titel: string; href: string; modus: 'rechner' | 'vorlage' }

/**
 * Karten-IDs → verfügbare Werkzeuge (Rechner/Vorlagen), in Eingabereihenfolge,
 * dedupliziert. Die Karte liefert Titel + href ZUR LAUFZEIT (Single Source =
 * startseiteConfig, §5); nicht verfügbare (geplante) oder href-lose Karten werden
 * ausgeblendet (§8: kein toter Link). Geteilter Auflöser für die Erlass- UND die
 * artikelscharfe Brücke — genau eine Auflöse-Regel.
 */
function aufloeseWerkzeuge(ids: readonly string[]): Werkzeug[] {
  const seen = new Set<string>();
  const out: Werkzeug[] = [];
  for (const id of ids) {
    if (seen.has(id)) continue;
    const k = ALLE_KARTEN.find((c) => c.id === id);
    if (k && istVerfuegbar(k) && k.href) { seen.add(id); out.push({ id, titel: k.title, href: k.href, modus: k.modus }); }
  }
  return out;
}

/**
 * Norm↔Werkzeug-Index (ROADMAP Schritt 2): verfügbare Werkzeuge (Rechner/
 * Vorlagen) zu einem Erlass-Key, in deklarierter Reihenfolge. Erlass-granular
 * und ehrlich — nicht verfügbare/geplante Karten werden ausgeblendet (§8).
 */
export function werkzeugeFuerNorm(key: string): Werkzeug[] {
  const ids = ERLASS_WERKZEUGE[key];
  return ids ? aufloeseWerkzeuge(ids) : [];
}

// ─── Artikel-scharfe Norm↔Werkzeug-Map (V1, W2·10-UI-NAV) ───────────────────
//
// EINE artikel-scharfe Datenstruktur für BEIDE Richtungen (§5): am Artikel den
// passenden Rechner zeigen (Art. 127 OR → Verjährung) UND am Entscheid das
// Erlass-Rauschen wegfiltern (BGE 152 I 65 zitiert Art. 448 ZGB = Erwachsenen-
// schutz, NICHT Erbrecht → kein Erbrechts-Rechner). Jede Kante trägt einen
// fachlichen Norm-Beleg (§7); nur EINDEUTIGE Zuordnungen sind erfasst — Zweifels-
// fälle werden NICHT geraten, sondern ausgelassen und im Block §Zweifelsfälle
// unten offen ausgewiesen (§8). Der `erlass`-Key ist der Register-/Snapshot-Key
// (= `bundSnapshotRef().quelle`).
//
// ── ARTIKEL-KENNUNG MIT SUFFIX, EXAKT (Befund AN-5, 23.9.2026) ─────────────
// Bis 23.9.2026 kannte die Tabelle nur Hauptnummern: jeder Sub-Artikel fiel auf
// seine Hauptnummer («335_c» → 335). Folge: der Lohnfortzahlungs-Rechner hing an
// Art. 324 OR (Annahmeverzug des ARBEITGEBERS) statt an Art. 324a/324b OR
// (Verhinderung des Arbeitnehmers), die Nichtbekanntgabe-Vorlage an Art. 8 SchKG
// statt an Art. 8a SchKG, und «Art. 266–273» zog Mietzins- und Rückgabe-Artikel
// (267–270e) in den Kündigungsrechner. Seither gilt:
//   · Eine Artikel-Kennung ist Hauptnummer + Suffix-Folge («324a», «9bis»,
//     «329gbis», Anker-Token «8_a_bis»). Es gibt KEINEN Vorsilben-Treffer:
//     324 ≠ 324a, und 324a ≠ 324.
//   · `von`/`bis` bleiben die Hauptnummern (Feldnamen stabil, Verbraucher
//     sortieren danach). Die exakte Grenze steht in `vonArtikel`/`bisArtikel`;
//     fehlt sie, ist die Grenze der BLANKE Artikel `von` bzw. `bis`.
//   · Der Bereich ist inklusiv in der amtlichen Reihenfolge der Artikel:
//     324 < 324a < 324b < 325; 329g < 329gbis < 329h. Sub-Artikel ZWISCHEN den
//     Grenzen gehören dazu (128a ⊂ 127–142), Sub-Artikel NACH der blanken
//     Obergrenze nicht (273a ⊄ 271–273).
// Jede Kante ist am 23.9.2026 gegen die geltende Fedlex-Fassung (AKN-XML über
// SPARQL `dateApplicability`, Artikel-Nummer + Sachüberschrift) und gegen die
// Normverweise des Werkzeugs selbst (Karte `norms` / Engine) geprüft; Tabelle
// samt Stand: bibliothek/normtext/werkzeug-kanten-2026-09-23.md.
export interface ArtikelWerkzeugKante {
  /** Register-/Snapshot-Key des Erlasses (z. B. 'OR', 'ZGB'). */
  erlass: string;
  /** Hauptnummer der Unter-/Obergrenze, inklusiv (Sortierschlüssel). */
  von: number;
  bis: number;
  /** Exakte Untergrenze mit Suffix ('324a'); fehlt ⇒ blanker Artikel `von`. */
  vonArtikel?: string;
  /** Exakte Obergrenze mit Suffix ('324b'); fehlt ⇒ blanker Artikel `bis`. */
  bisArtikel?: string;
  /** Katalog-Karten-IDs (SSoT §5), Reihenfolge = Anzeige. */
  werkzeuge: string[];
  /** Fachlicher Beleg der Kante — welche Norm die Zuordnung trägt (§7). */
  beleg: string;
}

export const ARTIKEL_WERKZEUGE: readonly ArtikelWerkzeugKante[] = [
  // ── OR — Obligationenrecht (SR 220, Fassung 1.1.2026) ────────────────────
  { erlass: 'OR', von: 60, bis: 60, werkzeuge: ['verjaehrung'],
    beleg: 'Art. 60 OR — Verjährung des Anspruchs aus unerlaubter Handlung (relativ 3 J. / absolut). Verjährungsrechner.' },
  { erlass: 'OR', von: 67, bis: 67, werkzeuge: ['verjaehrung'],
    beleg: 'Art. 67 OR — Verjährung des Bereicherungsanspruchs (3 J. / 10 J.). Verjährungsrechner.' },
  { erlass: 'OR', von: 102, bis: 102, werkzeuge: ['mahnung', 'verzugszins'],
    beleg: 'Art. 102 OR — Schuldnerverzug durch Mahnung. Mahnungs-Vorlage; Verzugsfolge = Verzugszins.' },
  { erlass: 'OR', von: 104, bis: 105, werkzeuge: ['verzugszins'],
    beleg: 'Art. 104 OR — Verzugszins 5 %; Art. 105 OR — Verzugszins auf Zinsen/Renten. Verzugszinsrechner.' },
  { erlass: 'OR', von: 127, bis: 142, werkzeuge: ['verjaehrung'],
    beleg: 'Art. 127–142 OR — allgemeine Verjährung: 10 J. (Art. 127), 5 J. (Art. 128), 20 J. (Art. 128a), Beginn (Art. 130), Stillstand (Art. 134), Unterbrechung (Art. 135). Verjährungsrechner.' },
  { erlass: 'OR', von: 197, bis: 210, werkzeuge: ['gewaehrleistung'],
    beleg: 'Art. 197–210 OR — Sachgewährleistung im Kaufrecht: Mängelrüge (Art. 201), Verjährung der Gewährleistung (Art. 210).' },
  { erlass: 'OR', von: 253, bis: 253, werkzeuge: ['mietvertrag-wohnen'],
    beleg: 'Art. 253 OR — Begriff des Mietvertrags. Wohnungsmietvertrag-Vorlage.' },
  { erlass: 'OR', von: 266, bis: 266, bisArtikel: '266o', werkzeuge: ['mietrecht'],
    beleg: 'Art. 266–266o OR — Beendigung des Mietverhältnisses: Kündigungsfristen und -termine (Art. 266a–266f), ausserordentliche Kündigung (Art. 266g–266k), Form (Art. 266l–266o).' },
  { erlass: 'OR', von: 269, bis: 270, bisArtikel: '270e', werkzeuge: ['mietzinsanpassung'],
    beleg: 'Art. 269–270e OR — missbräuchliche Mietzinse, Mietzinserhöhung (Art. 269d), Herabsetzung und Anfechtung (Art. 270–270e).' },
  { erlass: 'OR', von: 271, bis: 273, werkzeuge: ['mietrecht'],
    beleg: 'Art. 271–273 OR — Anfechtbarkeit der Kündigung (Art. 271/271a), Erstreckung (Art. 272–272d), Fristen und Verfahren: Anfechtung binnen 30 Tagen (Art. 273).' },
  { erlass: 'OR', von: 319, bis: 319, werkzeuge: ['arbeitsvertrag'],
    beleg: 'Art. 319 OR — Begriff des Einzelarbeitsvertrags. Arbeitsvertrags-Vorlage.' },
  { erlass: 'OR', von: 321, bis: 321, vonArtikel: '321c', bisArtikel: '321c', werkzeuge: ['ueberstunden-zuschlag'],
    beleg: 'Art. 321c OR — Überstundenarbeit und Zuschlag (25 %, dispositiv).' },
  { erlass: 'OR', von: 324, bis: 324, vonArtikel: '324a', bisArtikel: '324b', werkzeuge: ['lohnfortzahlung'],
    beleg: 'Art. 324a/324b OR — Lohn bei unverschuldeter Verhinderung des Arbeitnehmers (Grundsatz, Skalen-Dauer Abs. 2) und Ausnahmen bei obligatorischer Versicherung. Nicht Art. 324 OR (Annahmeverzug des Arbeitgebers).' },
  { erlass: 'OR', von: 329, bis: 329, vonArtikel: '329a', bisArtikel: '329d', werkzeuge: ['ferienanspruch'],
    beleg: 'Art. 329a–329d OR — Ferien: Dauer, Kürzung, Zusammenhang und Zeitpunkt, Ferienlohn.' },
  { erlass: 'OR', von: 335, bis: 335, bisArtikel: '335c', werkzeuge: ['kuendigung-sperrfristen'],
    beleg: 'Art. 335–335c OR — Kündigung des unbefristeten Arbeitsverhältnisses und Kündigungsfristen (allgemein, Probezeit, nach Ablauf der Probezeit).' },
  { erlass: 'OR', von: 336, bis: 336, vonArtikel: '336c', bisArtikel: '336c', werkzeuge: ['kuendigung-sperrfristen'],
    beleg: 'Art. 336c OR — Kündigung zur Unzeit durch den Arbeitgeber (Sperrfristen).' },
  { erlass: 'OR', von: 363, bis: 363, werkzeuge: ['werkvertrag'],
    beleg: 'Art. 363 OR — Begriff des Werkvertrags. Werkvertrags-Vorlage.' },
  { erlass: 'OR', von: 367, bis: 371, werkzeuge: ['gewaehrleistung'],
    beleg: 'Art. 367–371 OR — Haftung des Unternehmers für Mängel: Prüfung und Rüge (Art. 367, 370), Rechte des Bestellers (Art. 368), Verjährung (Art. 371). Der Rechner führt den Werkvertrag als eigenen Vertragstyp.' },
  { erlass: 'OR', von: 394, bis: 394, werkzeuge: ['auftrag'],
    beleg: 'Art. 394 OR — Begriff des einfachen Auftrags. Auftrags-Vorlage.' },
  { erlass: 'OR', von: 620, bis: 635, bisArtikel: '635a', werkzeuge: ['ag-gruendung', 'statuten'],
    beleg: 'Art. 620–635a OR — Gründung der Aktiengesellschaft (Begriff, Statuteninhalt, Errichtungsakt, Einlagen, Gründungsprüfung).' },
  { erlass: 'OR', von: 698, bis: 705, werkzeuge: ['gv-vr-beschluss'],
    beleg: 'Art. 698–705 OR — Generalversammlung der AG: Befugnisse, Einberufung, Beschlüsse, Protokoll.' },
  { erlass: 'OR', von: 772, bis: 779, bisArtikel: '779a', werkzeuge: ['gmbh-gruendung', 'statuten'],
    beleg: 'Art. 772–779a OR — Gründung der GmbH (Begriff, Stammkapital, Statuten, Errichtungsakt, Einlagen, Eintragung, Erwerb der Persönlichkeit).' },
  // ── ZGB — Zivilgesetzbuch (SR 210, Fassung 1.7.2026) ─────────────────────
  { erlass: 'ZGB', von: 122, bis: 124, bisArtikel: '124e', werkzeuge: ['vorsorgeausgleich'],
    beleg: 'Art. 122–124e ZGB — Ausgleich der beruflichen Vorsorge (BVG) bei Scheidung.' },
  { erlass: 'ZGB', von: 207, bis: 215, werkzeuge: ['gueterrecht-vorschlag'],
    beleg: 'Art. 207–215 ZGB — güterrechtliche Auseinandersetzung, Vorschlagsberechnung (Errungenschaftsbeteiligung).' },
  { erlass: 'ZGB', von: 360, bis: 369, werkzeuge: ['vorsorgeauftrag'],
    beleg: 'Art. 360–369 ZGB — Vorsorgeauftrag (Errichtung, Form, Wirksamkeit).' },
  { erlass: 'ZGB', von: 370, bis: 373, werkzeuge: ['patientenverfuegung'],
    beleg: 'Art. 370–373 ZGB — Patientenverfügung.' },
  { erlass: 'ZGB', von: 457, bis: 466, werkzeuge: ['erbteilung'],
    beleg: 'Art. 457–466 ZGB — gesetzliche Erben und ihre Erbteile (Stämme, überlebender Ehegatte, Gemeinwesen); Grundlage der Pflichtteilsberechnung.' },
  { erlass: 'ZGB', von: 470, bis: 473, werkzeuge: ['erbteilung'],
    beleg: 'Art. 470–473 ZGB — verfügbare Quote und Pflichtteile (Fassung ab 1.1.2023).' },
  { erlass: 'ZGB', von: 499, bis: 503, werkzeuge: ['oeffentliches-testament'],
    beleg: 'Art. 499–503 ZGB — öffentliche letztwillige Verfügung (Beurkundung mit zwei Zeugen).' },
  { erlass: 'ZGB', von: 505, bis: 505, werkzeuge: ['eigenhaendiges-testament'],
    beleg: 'Art. 505 ZGB — eigenhändige letztwillige Verfügung (vollständig handschriftlich).' },
  { erlass: 'ZGB', von: 521, bis: 521, werkzeuge: ['erbrecht-fristen'],
    beleg: 'Art. 521 ZGB — Verjährung der Ungültigkeitsklage (1 J. relativ / 10 bzw. 30 J. absolut).' },
  { erlass: 'ZGB', von: 522, bis: 532, werkzeuge: ['erbteilung'],
    beleg: 'Art. 522–532 ZGB — Herabsetzung bei Pflichtteilsverletzung (Voraussetzungen, Wirkung, Reihenfolge Art. 532).' },
  { erlass: 'ZGB', von: 533, bis: 533, werkzeuge: ['erbrecht-fristen'],
    beleg: 'Art. 533 ZGB — Verjährung der Herabsetzungsklage (1 Jahr relativ / 10 bzw. 30 J. absolut).' },
  { erlass: 'ZGB', von: 566, bis: 571, werkzeuge: ['erbrecht-fristen'],
    beleg: 'Art. 566–571 ZGB — Ausschlagung der Erbschaft (Befugnis, Frist 3 Monate Art. 567, Verwirkung Art. 571).' },
  { erlass: 'ZGB', von: 580, bis: 580, werkzeuge: ['erbrecht-fristen'],
    beleg: 'Art. 580 ZGB — Begehren um öffentliches Inventar (Frist 1 Monat, Abs. 2).' },
  { erlass: 'ZGB', von: 587, bis: 587, werkzeuge: ['erbrecht-fristen'],
    beleg: 'Art. 587 ZGB — Frist zur Erklärung nach Abschluss des öffentlichen Inventars (1 Monat).' },
  { erlass: 'ZGB', von: 600, bis: 601, werkzeuge: ['erbrecht-fristen'],
    beleg: 'Art. 600 ZGB — Verjährung der Erbschaftsklage (1 J. relativ / 10 bzw. 30 J. absolut); Art. 601 ZGB — Klage der Vermächtnisnehmer (10 J.).' },
  { erlass: 'ZGB', von: 626, bis: 632, werkzeuge: ['erb-ausgleichung'],
    beleg: 'Art. 626–632 ZGB — erbrechtliche Ausgleichung von Zuwendungen.' },
  // ── ZPO — Zivilprozessordnung (SR 272, Fassung 1.7.2026) ─────────────────
  { erlass: 'ZPO', von: 9, bis: 46, werkzeuge: ['zustaendigkeit'],
    beleg: 'Art. 9–46 ZPO — örtliche Zuständigkeit (Gerichtsstände) im Zivilprozess.' },
  { erlass: 'ZPO', von: 91, bis: 94, bisArtikel: '94a', werkzeuge: ['streitwert'],
    beleg: 'Art. 91–94a ZPO — Berechnung des Streitwerts (inkl. Verbandsklage, Art. 94a).' },
  { erlass: 'ZPO', von: 95, bis: 96, werkzeuge: ['prozesskosten'],
    beleg: 'Art. 95–96 ZPO — Prozesskosten (Gerichtskosten, Parteientschädigung, Tarife).' },
  { erlass: 'ZPO', von: 98, bis: 98, werkzeuge: ['kostenvorschuss'],
    beleg: 'Art. 98 ZPO — Kostenvorschuss für die Gerichtskosten.' },
  { erlass: 'ZPO', von: 99, bis: 99, werkzeuge: ['parteientschaedigung-sicherheit'],
    beleg: 'Art. 99 ZPO — Sicherheit für die Parteientschädigung.' },
  { erlass: 'ZPO', von: 104, bis: 111, werkzeuge: ['prozesskosten'],
    beleg: 'Art. 104–111 ZPO — Verteilung und Liquidation der Prozesskosten.' },
  { erlass: 'ZPO', von: 142, bis: 149, werkzeuge: ['zpo-fristen'],
    beleg: 'Art. 142–149 ZPO — Fristenberechnung, Stillstand, Säumnis, Wiederherstellung.' },
  { erlass: 'ZPO', von: 202, bis: 202, werkzeuge: ['schlichtungsgesuch'],
    beleg: 'Art. 202 ZPO — Einleitung des Schlichtungsverfahrens (Schlichtungsgesuch).' },
  { erlass: 'ZPO', von: 220, bis: 220, werkzeuge: ['klage-ordentlich'],
    beleg: 'Art. 220 ZPO — Einleitung des ordentlichen Verfahrens durch Klage.' },
  { erlass: 'ZPO', von: 243, bis: 247, werkzeuge: ['klage-vereinfacht'],
    beleg: 'Art. 243–247 ZPO — vereinfachtes Verfahren.' },
  { erlass: 'ZPO', von: 311, bis: 314, werkzeuge: ['zpo-fristen'],
    beleg: 'Art. 311–314 ZPO — Berufungsfrist (30 Tage), Berufungsantwort, Anschlussberufung, summarisches Verfahren (10 Tage).' },
  { erlass: 'ZPO', von: 321, bis: 321, werkzeuge: ['zpo-fristen'],
    beleg: 'Art. 321 ZPO — Einreichen der Beschwerde (30 bzw. 10 Tage).' },
  // ── SchKG — Schuldbetreibung und Konkurs (SR 281.1, Fassung 1.1.2026) ────
  { erlass: 'SCHKG', von: 8, bis: 8, vonArtikel: '8a', bisArtikel: '8a', werkzeuge: ['nichtbekanntgabe-betreibung'],
    beleg: 'Art. 8a SchKG — Einsichtsrecht und Nichtbekanntgabe der Betreibung gegenüber Dritten (Art. 8a Abs. 3). Nicht Art. 8 SchKG (Protokollführung).' },
  { erlass: 'SCHKG', von: 31, bis: 33, werkzeuge: ['schkg-fristen'],
    beleg: 'Art. 31–33 SchKG — Fristen im Betreibungsverfahren (Berechnung, Einhaltung, Änderung und Wiederherstellung).' },
  { erlass: 'SCHKG', von: 46, bis: 55, werkzeuge: ['schkg-zustaendigkeit'],
    beleg: 'Art. 46–55 SchKG — Betreibungsort (ordentlich und besonders).' },
  { erlass: 'SCHKG', von: 56, bis: 63, werkzeuge: ['schkg-fristen'],
    beleg: 'Art. 56–63 SchKG — geschlossene Zeiten, Betreibungsferien, Rechtsstillstand und ihre Wirkung auf den Fristenlauf (Art. 63).' },
  { erlass: 'SCHKG', von: 68, bis: 68, werkzeuge: ['betreibungskosten'],
    beleg: 'Art. 68 SchKG — Kostentragung der Betreibung (Tarif: GebV SchKG).' },
  { erlass: 'SCHKG', von: 74, bis: 75, werkzeuge: ['rechtsvorschlag', 'schkg-fristen'],
    beleg: 'Art. 74–75 SchKG — Rechtsvorschlag (Frist 10 Tage ab Zustellung des Zahlungsbefehls).' },
  { erlass: 'SCHKG', von: 80, bis: 84, werkzeuge: ['rechtsoeffnungsbegehren'],
    beleg: 'Art. 80–84 SchKG — provisorische und definitive Rechtsöffnung.' },
  // ── StGB — Strafgesetzbuch (SR 311.0, Fassung 12.6.2026) ──────────────────
  { erlass: 'STGB', von: 8, bis: 8, werkzeuge: ['straf-zustaendigkeit'],
    beleg: 'Art. 8 StGB — Begehungsort (Ausführungs- und Erfolgsort); an ihn knüpft der Gerichtsstand des Tatortes (Art. 31 StPO) an. Nicht Art. 3–7 StGB (Geltung schweizerischen Rechts), die der Rechner nicht prüft.' },
  { erlass: 'STGB', von: 30, bis: 33, werkzeuge: ['strafantrag-vorlage'],
    beleg: 'Art. 30–33 StGB — Strafantrag bei Antragsdelikten (Frist 3 Monate, Art. 31).' },
  { erlass: 'STGB', von: 97, bis: 101, werkzeuge: ['straf-verjaehrung'],
    beleg: 'Art. 97–101 StGB — Verfolgungs- und Vollstreckungsverjährung.' },
  // ── StPO — Strafprozessordnung (SR 312.0, Fassung 1.4.2025) ──────────────
  { erlass: 'STPO', von: 31, bis: 42, werkzeuge: ['straf-zustaendigkeit'],
    beleg: 'Art. 31–42 StPO — Gerichtsstand im Strafverfahren.' },
  { erlass: 'STPO', von: 301, bis: 301, werkzeuge: ['strafanzeige'],
    beleg: 'Art. 301 StPO — Anzeigerecht (Strafanzeige).' },
  { erlass: 'STPO', von: 354, bis: 354, werkzeuge: ['einsprache'],
    beleg: 'Art. 354 StPO — Einsprache gegen den Strafbefehl (Frist 10 Tage).' },
  // ── BGG — Bundesgerichtsgesetz (SR 173.110, Fassung 1.4.2026) ────────────
  { erlass: 'BGG', von: 44, bis: 48, werkzeuge: ['bgg-fristen'],
    beleg: 'Art. 44–48 BGG — Fristenberechnung, Stillstand, Einhaltung vor Bundesgericht.' },
  { erlass: 'BGG', von: 65, bis: 65, werkzeuge: ['bundesgerichtsgebuehren'],
    beleg: 'Art. 65 BGG — Gerichtsgebühren des Bundesgerichts.' },
  { erlass: 'BGG', von: 72, bis: 89, werkzeuge: ['rechtsmittelpruefung'],
    beleg: 'Art. 72–89 BGG — Beschwerdearten und Zulässigkeit (Beschwerde in Zivil-/Straf-/öffentlich-rechtlichen Sachen).' },
  { erlass: 'BGG', von: 100, bis: 100, werkzeuge: ['bgg-fristen'],
    beleg: 'Art. 100 BGG — Beschwerdefrist (30 Tage).' },
  // ── ArG — Arbeitsgesetz (SR 822.11, Fassung 1.9.2023) ────────────────────
  { erlass: 'ARG', von: 12, bis: 13, werkzeuge: ['ueberstunden-zuschlag'],
    beleg: 'Art. 12 ArG — Voraussetzungen und Dauer der Überzeitarbeit; Art. 13 ArG — Lohnzuschlag für Überzeitarbeit (25 %).' },
  // ── DBG — Direkte Bundessteuer (SR 642.11) ────────────────────────────────
  { erlass: 'DBG', von: 120, bis: 121, werkzeuge: ['steuer-verjaehrung'],
    beleg: 'Art. 120–121 DBG — Veranlagungs- und Bezugsverjährung.' },
  // ── AHVG — Alters- und Hinterlassenenversicherung (SR 831.10) ─────────────
  { erlass: 'AHVG', von: 4, bis: 11, werkzeuge: ['ahv-beitraege'],
    beleg: 'Art. 4–11 AHVG — Beitragspflicht und Bemessung der AHV-Beiträge.' },
  // ── DSG — Datenschutzgesetz (SR 235.1) ────────────────────────────────────
  { erlass: 'DSG', von: 25, bis: 25, werkzeuge: ['datenschutz-fristen'],
    beleg: 'Art. 25 DSG — Auskunftsrecht der betroffenen Person; die 30-Tage-Frist steht in Art. 18 DSV (SR 235.11). Gegenprüfung 11.7.2026.' },
];

// ── §Zweifelsfälle — bewusst NICHT eingebaut (§8) ──────────────────────────
// Ausgelassen, weil kein eindeutiger Artikel-Anker (nicht geraten):
//  · dreizehnter-monatslohn: der 13. Monatslohn ist vertraglich, kein eigener
//    OR-Artikel; Art. 322d OR (Gratifikation) ist rechtlich etwas anderes.
//  · schadenszins: Anker umstritten (analog Art. 73/104 OR, richterrechtlich) —
//    kein sauberer Artikel-Bereich.
//  · auslaenderrecht-fristen (AIG): Fristen über viele Bestimmungen verstreut,
//    keine tragende Einzelnorm.
// Werden nachgezogen, sobald der jeweilige Rechner die Norm eindeutig trägt.
// (23.9.2026, D6: der frühere Punkt «gewaehrleistung im Werkvertrag, Art. 367–371
// OR — Mängelrecht nicht abgebildet» ist überholt: die Engine führt den
// Werkvertrag als Vertragstyp (`GwVertragstyp`, lib/gewaehrleistung.ts) und die
// Karte nennt Art. 367/371 OR; die Kante steht oben.)
// Zurückgestellt bis der Funktionszeilen-Leser suffix-exakt vergleicht
// (lib/normtext/werkzeuge.ts `trifftArtikel`; heute Hauptnummer in
// pages/gesetz-leser/randNotizWerkzeuge.ts): mietrecht an Art. 257d/257f OR und
// gewaehrleistung an Art. 219a OR — beide in Karte und Engine belegt, aber ihre
// Hauptnummer träfe dort auch 257–257c/257e bzw. 219/219b ff. (Rauschen, AN-5).

/** Lateinische Ordnungszahl-Suffixe in amtlicher Reihenfolge (bis = 2. …). */
const LATEIN_SUFFIXE = [
  'bis', 'ter', 'quater', 'quinquies', 'sexies', 'septies', 'octies', 'novies',
  'decies', 'undecies', 'duodecies', 'terdecies', 'quaterdecies', 'quinquiesdecies',
  'sexiesdecies', 'septiesdecies', 'octiesdecies', 'noviesdecies', 'vicies',
] as const;
// Längste zuerst, damit «quinquiesdecies» nicht als «quinquies»+Rest zerfällt.
const LATEIN_NACH_LAENGE = [...LATEIN_SUFFIXE].sort((a, b) => b.length - a.length);

/** Zerlegte Artikel-Kennung: Hauptnummer + Suffix-Rangfolge. */
interface ArtikelKennung { nr: number; rang: readonly number[] }

/**
 * Artikel-Kennung aus Anker-Token («324_a», «8_a_bis», «9_bis») oder Etikett
 * («324a», «329gbis», «Art. 8a») — Hauptnummer + Rangfolge der Suffixe.
 * Buchstabe a…z ⇒ Rang 1…26 (×2), lateinisches Suffix bis/ter/… ⇒ Ordnungszahl
 * 2/3/… (×2 + 1): so liegt 6bis hinter 6a/6b und vor 6c, und «b» ≠ «bis».
 * `null` für alles, was keine Artikel-Kennung ist (Anhänge, «627_628»,
 * Schlusstitel) — §8: lieber kein Treffer als ein geratener.
 */
function artikelKennung(roh: string): ArtikelKennung | null {
  const s = roh.trim().toLowerCase().replace(/^art(?:\.|_)?\s*/, '');
  const m = /^(\d+)([a-z_]*)$/.exec(s);
  if (!m) return null;
  let rest = m[2].replace(/_/g, '');
  const rang: number[] = [];
  while (rest.length > 0) {
    const latein = LATEIN_NACH_LAENGE.find((w) => rest.startsWith(w));
    if (latein) {
      rang.push((LATEIN_SUFFIXE.indexOf(latein) + 2) * 2 + 1);
      rest = rest.slice(latein.length);
    } else {
      rang.push((rest.charCodeAt(0) - 96) * 2);
      rest = rest.slice(1);
    }
  }
  return { nr: Number.parseInt(m[1], 10), rang };
}

/** Amtliche Reihenfolge zweier Kennungen (<0, 0, >0); Präfix vor Verlängerung. */
function vergleicheKennung(a: ArtikelKennung, b: ArtikelKennung): number {
  if (a.nr !== b.nr) return a.nr - b.nr;
  const n = Math.min(a.rang.length, b.rang.length);
  for (let i = 0; i < n; i++) if (a.rang[i] !== b.rang[i]) return a.rang[i] - b.rang[i];
  return a.rang.length - b.rang.length;
}

/** Bereichsgrenzen einer Kante/Gruppe — gemeinsame Form beider Typen. */
type Bereich = Pick<ArtikelWerkzeugKante, 'von' | 'bis' | 'vonArtikel' | 'bisArtikel'>;

function grenzen(b: Bereich): [ArtikelKennung, ArtikelKennung] {
  return [
    (b.vonArtikel !== undefined ? artikelKennung(b.vonArtikel) : null) ?? { nr: b.von, rang: [] },
    (b.bisArtikel !== undefined ? artikelKennung(b.bisArtikel) : null) ?? { nr: b.bis, rang: [] },
  ];
}

/**
 * Amtliche Reihenfolge zweier Artikel-Kennungen («324» < «324a» < «324b» <
 * «325»). Unlesbare Kennungen sortieren ans Ende. Exportiert für die Tore
 * (Überlappung, Grenzen-Ordnung) — dieselbe Regel wie die Zuordnung selbst.
 */
export function vergleicheArtikel(a: string, b: string): number {
  const ka = artikelKennung(a), kb = artikelKennung(b);
  if (!ka || !kb) return ka ? -1 : kb ? 1 : 0;
  return vergleicheKennung(ka, kb);
}

/**
 * Trifft der Artikel (Anker-Token «324_a» oder Etikett «324a») den Bereich der
 * Kante/Gruppe? Exakt mit Suffix, inklusiv, in amtlicher Reihenfolge — KEIN
 * Vorsilben-Treffer (324 trifft 324a–324b nicht, 324a trifft 324 nicht).
 * Die eine Abgleich-Regel für alle Leser der Tabelle (§5).
 */
export function trifftArtikel(bereich: Bereich, token: string): boolean {
  const t = artikelKennung(token);
  if (!t) return false;
  const [lo, hi] = grenzen(bereich);
  return vergleicheKennung(lo, t) <= 0 && vergleicheKennung(t, hi) <= 0;
}

/** Etikett eines Bereichs: «Art. 8a», «Art. 324a–324b», «Art. 127–142». */
export function bereichLabel(bereich: Bereich): string {
  const von = bereich.vonArtikel ?? String(bereich.von);
  const bis = bereich.bisArtikel ?? String(bereich.bis);
  return von === bis ? `Art. ${von}` : `Art. ${von}–${bis}`;
}

/**
 * Artikel-scharfe Richtung «Artikel → Werkzeug» (V1): verfügbare Werkzeuge zu
 * EINEM Artikel eines Erlasses (Register-Key + Anker-Token). Union der Kanten,
 * deren Bereich den Artikel exakt enthält (`trifftArtikel`), in Kanten-
 * Reihenfolge, dedupliziert. Leer, wo keine eindeutige Kante existiert (§8:
 * lieber nichts als grobes Rauschen).
 */
export function werkzeugeFuerArtikel(erlassKey: string, token: string): Werkzeug[] {
  const ids: string[] = [];
  for (const k of ARTIKEL_WERKZEUGE) {
    if (k.erlass === erlassKey && trifftArtikel(k, token)) ids.push(...k.werkzeuge);
  }
  return aufloeseWerkzeuge(ids);
}

/**
 * Artikel-scharfe Werkzeuge zu den ZITIERTEN Normen eines Entscheids (V1,
 * Rausch-Filter #28): jedes Zitat wird über `bundSnapshotRef` in Erlass-Key +
 * Artikel-Token aufgelöst und artikelscharf gemappt. Union über alle Zitate,
 * dedupliziert. Ersetzt am Entscheid die grobe Erlass-Zuordnung — nur Werkzeuge
 * zu tatsächlich zitierten Artikeln (Art. 448 ZGB ⇒ kein Erbrecht).
 */
export function werkzeugeFuerZitate(zitate: readonly string[]): Werkzeug[] {
  const ids: string[] = [];
  for (const zitat of zitate) {
    const ref = bundSnapshotRef(zitat);
    if (!ref) continue;
    for (const k of ARTIKEL_WERKZEUGE) {
      if (k.erlass === ref.quelle && trifftArtikel(k, ref.token)) ids.push(...k.werkzeuge);
    }
  }
  return aufloeseWerkzeuge(ids);
}

/** Anzeige-Gruppe der Richtung «Artikel → Werkzeug» für den Gesetz-Reader (#38). */
export interface ArtikelWerkzeugGruppe {
  /** «Art. 127–142», «Art. 324a–324b» bzw. «Art. 8a» (einzelner Artikel). */
  label: string;
  /** Hauptnummern (Sortierschlüssel); exakte Grenzen in `vonArtikel`/`bisArtikel`. */
  von: number;
  bis: number;
  vonArtikel?: string;
  bisArtikel?: string;
  werkzeuge: Werkzeug[];
  beleg: string;
}

/**
 * Alle artikelscharfen Kanten EINES Erlasses als anzeige-fertige Gruppen (#38,
 * «Werkzeuge zu diesem Artikel» im KontextPanel des Gesetz-Readers). Kanten ohne
 * derzeit verfügbares Werkzeug (nur geplante Karten) werden ausgelassen (§8: kein
 * leerer Eintrag). In amtlicher Artikel-Reihenfolge sortiert (Untergrenze, dann
 * Obergrenze — mit Suffix). Wer einen Artikel einer Gruppe zuordnet, nimmt
 * `trifftArtikel(gruppe, token)`, nicht die Hauptnummer.
 */
export function artikelWerkzeugGruppen(erlassKey: string): ArtikelWerkzeugGruppe[] {
  const out: ArtikelWerkzeugGruppe[] = [];
  for (const k of ARTIKEL_WERKZEUGE) {
    if (k.erlass !== erlassKey) continue;
    const werkzeuge = aufloeseWerkzeuge(k.werkzeuge);
    if (werkzeuge.length === 0) continue;
    out.push({
      label: bereichLabel(k),
      von: k.von, bis: k.bis,
      ...(k.vonArtikel !== undefined ? { vonArtikel: k.vonArtikel } : {}),
      ...(k.bisArtikel !== undefined ? { bisArtikel: k.bisArtikel } : {}),
      werkzeuge, beleg: k.beleg,
    });
  }
  return out.sort((a, b) => {
    const [alo, ahi] = grenzen(a), [blo, bhi] = grenzen(b);
    return vergleicheKennung(alo, blo) || vergleicheKennung(ahi, bhi);
  });
}

/**
 * Werkzeuge zu den ANGEWANDTEN Normen eines Entscheids (transitiv über die
 * Norm↔Werkzeug-Brücke). Grob (Erlass-Granularität) → «auch relevant»-Klasse,
 * Status 'maschinell'; keine kuratierte Empfehlung (§8). Dedupliziert.
 */
export function werkzeugeFuerEntscheid(normKeys: string[]): Werkzeug[] {
  const seen = new Set<string>();
  const out: Werkzeug[] = [];
  for (const k of normKeys) {
    for (const w of werkzeugeFuerNorm(k)) {
      if (!seen.has(w.id)) { seen.add(w.id); out.push(w); }
    }
  }
  return out;
}

export interface MassgebenderErlass { key: string; kuerzel: string; titel: string; pfad: string }

/**
 * Inverse Norm↔Werkzeug-Brücke (W2.1): Erlasse mit Volltext-Detailseite
 * (status 'snapshot' → kein toter Link, §8), die mindestens ein verfügbares
 * Werkzeug des gegebenen Modus tragen — für den «Massgebende Gesetze»-Block der
 * Rubrik-Übersichten (interne Verlinkung Werkzeug → Norm-Detailseite). Reihenfolge
 * = ERLASS_REGISTER (rang/Gebiet). Pfad-Keys sind Bund (sauber, keine Kodierung).
 */
export function massgebendeErlasse(modus: 'rechner' | 'vorlage'): MassgebenderErlass[] {
  const out: MassgebenderErlass[] = [];
  for (const e of ERLASS_REGISTER) {
    if (e.status !== 'snapshot') continue;
    if (!werkzeugeFuerNorm(e.key).some((w) => w.modus === modus)) continue;
    out.push({ key: e.key, kuerzel: e.kuerzel, titel: e.titel, pfad: erlassPfad(e) });
  }
  return out;
}

// ─── Norm ↔ Material-Brücke (Auftrag 5, additiv) ────────────────────────────
//
// Inverse zu MaterialRegistereintrag.normKeys: zu einem Erlass-Key die amtlichen
// Materialien (Kreisschreiben/Wegleitungen/Leitfäden …), die ihn auslegen — für
// einen «Materialien zu diesem Erlass»-Block im Gesetze-Reader (Burggraben:
// Norm + Behördenpraxis an einer Stelle). Reine Daten-Projektion aus dem
// MATERIAL_REGISTER (§3); Reihenfolge = Behörde-rang → eigener rang.

export interface MaterialBezug {
  key: string; titel: string; behoerdeKuerzel: string; doktypLabel: string;
  nummer: string | null; pfad: string;
  /** §8-Herkunft. In-Bundle-kuratierte Materialien sind 'kuratiert'; die asynchron
   *  geladenen Soft-Law-Kanten (kontextSoftLaw) tragen die Adapter-quelle. */
  herkunft: Herkunft;
  /** Stand der Dokument-Fassung (ISO) — Chip-Anzeige + Staleness-Klassifikation (§2.4). */
  stand: string;
  /** Repräsentativer Korpus-Artikel-Token für DIESEN Erlass (Staleness §2.4). */
  artikel?: string;
  /** Fundstellen-Sublabel («via Art. 24») oder undefined (Erlass-Ebene). */
  sublabel?: string;
}

export function materialienFuerNorm(normKey: string): MaterialBezug[] {
  const out: MaterialBezug[] = [];
  for (const m of MATERIAL_REGISTER) {
    if (!(m.normKeys ?? []).includes(normKey)) continue;
    // Kuratierter artikelscharfer Bezug für DIESEN Erlass (E6a·M5, §2.4/§7).
    const bezug = m.artikelBezuege?.find((b) => b.erlass === normKey);
    out.push({
      key: m.key,
      titel: m.titel,
      behoerdeKuerzel: behoerdeVon(m.behoerde).kuerzel,
      doktypLabel: DOKTYP_LABEL[m.doktyp],
      nummer: m.nummer ?? null,
      pfad: `/materialien/${encodeURIComponent(m.key)}`,
      herkunft: 'kuratiert',
      stand: m.stand,
      artikel: bezug?.artikel,
      sublabel: bezug ? `via Art. ${bezug.artikel.replace(/_/g, '')}` : undefined,
    });
  }
  return out.sort((a, b) => a.behoerdeKuerzel.localeCompare(b.behoerdeKuerzel) || a.key.localeCompare(b.key));
}
