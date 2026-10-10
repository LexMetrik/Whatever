// ─── Bekannte Fehler je Werkzeug — EINE Quelle (§5, §8; ROADMAP JETZT 3 WARNHINWEIS) ──
//
// Werkzeuge, deren Ergebnis laut `plan/FEHLERBESTAND.md` Bereich 5 belegt falsch
// sein kann, zeigen beim Ergebnis (ErgebnisBlock), im PDF, in der Kopie und im
// Kalendereintrag den Hinweis «Bekannter Fehler – Ergebnis nicht verwenden».
// Schlüssel = Karten-id aus dem Katalog (`startseiteConfig`), Wert = die
// betroffenen Fehlerbestand-Zeilen in Klartext. Keine Rechtslogik (§3): die
// Liste ändert kein Ergebnis, sie legt nur offen.
//
// AUSWAHL (Bau 11.10.2026, offengelegt): Zeile mit Kl. R, «offen? ja», kein
// offener Entscheid Davids, Klartext nennt ein falsches oder fehlendes
// Ergebnis (Betrag, Datum, Verdikt, Quote) — nicht bloss ein Zitat, einen
// fehlenden Hinweis oder eine Vorlage; Werkzeug über die Spalte «Ort» bzw.
// die Engine, die es speist (geteilte Engines: alle Konsumenten).
//
// ENTFERNEN (JETZT 4 RECHTSLOGIK): ist ein Fehler behoben, die Zeile hier
// löschen; ist die Liste eines Werkzeugs leer, den Schlüssel löschen. Der
// Rahmen (`BekannteFehlerRahmen`) auf der Seite darf stehen bleiben — ohne
// Eintrag zeigt er nichts.

export interface BekannterFehler {
  /** Zeilen-ID in `plan/FEHLERBESTAND.md` (Teil A, Bereich 5). */
  fb: string;
  /** Klartext für Nutzer: was ist falsch. Zahlen wortgleich aus der FB-Zeile. */
  text: string;
}

export const BEKANNTER_FEHLER_TITEL = 'Bekannter Fehler – Ergebnis nicht verwenden';
export const BEKANNTER_FEHLER_SATZ =
  'Für dieses Werkzeug sind falsche Ergebnisse belegt, die noch nicht behoben sind. '
  + 'Ob die eigene Eingabe betroffen ist, lässt sich nicht sicher ausschliessen.';

const STAFFEL: BekannterFehler = {
  fb: 'RV-18',
  text: 'Staffeltarife mit Höchstbetrag oder Rundung werden falsch gerechnet (Deckel und Rundung).',
};
const VERZUGSZINS: readonly BekannterFehler[] = [
  { fb: 'RV-29', text: 'Verzugszins: Zinsforderung bei Mahnung falsch gerechnet (Fall V6: Mahnung – kein Zins).' },
  { fb: 'RV-80', text: 'Verzugszins: Zwischenrundung verschiebt das Ergebnis um bis zu ±5 Rappen.' },
];
const KALENDER_NE_SO: BekannterFehler = {
  fb: 'RV-53',
  text: 'Kalender-Ansicht: NE-Schliesstage und der 1. Mai in SO sind nicht als arbeitsfrei markiert.',
};

export const BEKANNTE_FEHLER: Readonly<Record<string, readonly BekannterFehler[]>> = {
  'notariat-grundbuch': [
    { fb: 'RV-17', text: 'Uri: rechnet weiter nach dem Verbandstarif der Urner Notare (23 Einträge), obwohl entschieden ist, ihn nicht mehr anzuwenden.' },
    STAFFEL,
    { fb: 'RV-19', text: 'Grundpfand: Pauschalsätze in 14 Kantonen falsch.' },
    { fb: 'RV-20', text: 'Notariats- und Grundbuch-Staffeln falsch (TI bis 5-fach; VD, FR, VS, NE, GE, JU, BE).' },
    { fb: 'RV-24', text: 'Mehrwertsteuer auf Notariatsgebühren fehlt oder ist falsch (7 Kantone).' },
    { fb: 'RV-25', text: 'Emissionsabgabe fehlt ohne Hinweis im Ergebnis (bis CHF 40’000).' },
    { fb: 'RV-27', text: 'Kopierte Tarifdaten weichen voneinander ab (u. a. Beurkundung VS).' },
    { fb: 'RV-82', text: '«Weitere Geschäftsarten» FR, VD, VS, JU, NE nicht abgebildet; GE Kapitalherabsetzung: Sockel 88 statt 87.50.' },
  ],
  prozesskosten: [
    STAFFEL,
    { fb: 'RV-21', text: 'Gerichtskosten-Staffeln kantonal falsch (u. a. ZG, SG).' },
    { fb: 'RV-22', text: 'Tarife je Verfahrensart (vereinfacht, summarisch) falsch (u. a. LU, UR, OW).' },
    { fb: 'RV-23', text: 'Wallis: Parteientschädigung über CHF 1 Mio. bis CHF 8’200 zu hoch.' },
    { fb: 'RV-28', text: 'ZPO-Kosten Bund: Verfahrensart fest «ordentlich», Streitwert teils falsch bestimmt.' },
  ],
  streitwert: [
    { fb: 'RV-26', text: 'Streitwert wiederkehrender Leistungen nach Art. 51 Abs. 4 BGG falsch berechnet.' },
    { fb: 'RV-28', text: 'Streitwert teils falsch bestimmt (dieselbe Engine speist die Prozesskosten).' },
  ],
  betreibungskosten: [
    { fb: 'RV-28', text: 'Kostenregeln mit Streitwertfehler (u. a. Rahmen der Entscheidgebühr in Summarsachen).' },
  ],
  'bgg-fristen': [
    { fb: 'RV-26', text: 'Streitwert wiederkehrender Leistungen nach Art. 51 Abs. 4 BGG falsch berechnet.' },
  ],
  zustaendigkeit: [
    { fb: 'RV-27', text: 'Kopierte Tarifdaten der Kostenangaben weichen von der Tarifquelle ab (u. a. Schlichtung AI).' },
    { fb: 'RV-33', text: 'Bestimmung der Schlichtungsbehörde doppelt vorhanden, die beiden Fassungen weichen voneinander ab.' },
    { fb: 'RV-79', text: 'Zwischenentscheide: Rechtsmittel als «zulässig» ausgewiesen, obwohl Art. 92/93 BGG es einschränken.' },
  ],
  tagerechner: [
    { fb: 'RV-49', text: 'Strafverfahren (StPO): rechnet mit den allgemeinen statt den strafprozessualen kantonalen Feiertagen.' },
    { fb: 'RV-52', text: 'Mit SchKG-Ferien: Zustellung während der Betreibungsferien wird nie berücksichtigt, ohne Hinweis.' },
    KALENDER_NE_SO,
  ],
  'zpo-fristen': [KALENDER_NE_SO],
  'schkg-fristen': [
    { fb: 'RV-63', text: 'Monats- und Jahresfristen: die Kachel «Fristbeginn» zeigt bei Ferienzustellung den letzten Ferientag statt des Fristbeginns.' },
  ],
  mietrecht: [
    { fb: 'RV-06', text: 'Werte aus einem verlassenen Eingabe-Zweig gelangen ins Ergebnis (Kündigungstermine, Art. 266e OR).' },
    { fb: 'RV-33', text: 'Familienwohnung wird auch bei Geschäftsräumen angeboten (Art. 266m/n OR).' },
    { fb: 'RV-40', text: 'Bei verfehltem Termin nennt das Ergebnis einen falschen Ersatztermin.' },
  ],
  'kuendigung-sperrfristen': [
    { fb: 'RV-33', text: 'Fristen nach Art. 336b OR nur bei Kündigung durch die Arbeitgeberseite berechnet.' },
    { fb: 'RV-44', text: 'Sperrfrist: angezeigtes Hemmungsfenster weicht am Monatsende vom gerechneten ab (Beispiel: Anzeige 30.08.–30.09., gerechnet ab 31.08.).' },
  ],
  erbteilung: [
    { fb: 'RV-08', text: 'Stammesteilung über mehrere Generationen fehlt; Hinweis zu Art. 457 Abs. 3 ZGB nur bedingt.' },
    { fb: 'RV-29', text: 'Weitere offene Befunde der Erbteilung aus der Rechtslogik-Prüfung.' },
    { fb: 'RV-38', text: 'Überschuldeter Nachlass: negative Erb- und Pflichtteile ohne Warnung und ohne Hinweis auf die Ausschlagung (Art. 566 ZGB).' },
  ],
  verzugszins: VERZUGSZINS,
  'inkasso-strecke': VERZUGSZINS,
  teuerungsrechner: [
    { fb: 'RV-29', text: 'Landesindex-Reihe (LIK) teilweise falsch; das Ergebnis kann abweichen.' },
  ],
  gewaehrleistung: [
    { fb: 'RV-77', text: 'Verjährung bei Plänen (Art. 371 Abs. 2 OR, lit. b; 5 Jahre) ist nicht abgebildet.' },
  ],
  'verjaehrung-board': [
    { fb: 'RV-77', text: 'Gewährleistung: Verjährung bei Plänen (Art. 371 Abs. 2 OR, lit. b; 5 Jahre) ist nicht abgebildet.' },
  ],
};

/** Vereinigung über die Werkzeuge eines Ergebnisses (verschachtelte Rahmen), ohne Doppel. */
export function bekannteFehlerFuer(werkzeuge: readonly string[]): BekannterFehler[] {
  const gesehen = new Set<string>();
  const aus: BekannterFehler[] = [];
  for (const w of werkzeuge) {
    for (const f of BEKANNTE_FEHLER[w] ?? []) {
      const schluessel = `${f.fb}\u0000${f.text}`;
      if (gesehen.has(schluessel)) continue;
      gesehen.add(schluessel);
      aus.push(f);
    }
  }
  return aus;
}

/** Eine Zeile je Fehler, FB-ID in Klammern — für Anzeige, PDF, Kopie und Kalender. */
export const bekannterFehlerZeile = (f: BekannterFehler): string => `${f.text} (${f.fb})`;
