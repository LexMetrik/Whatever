// Herkunft: FAHRPLAN-FRISTEN-EINHEIT · FAHRPLAN-STRUKTUR-UMBAU (git 3fd5db8f9:archiv/)
// ─── S-5b · Informationsarchitektur der Fristen-Kategorie ───────────────────
//
// Auftrag David 10.6.2026 abends: «Fristen soll unterteilt werden in
// prozessual und materiell.» Aufbau der Kategorie-Ansicht:
//  - HAUPTEINSTIEG: der Tagerechner mit dem ganz simplen Fristenrechner
//    zuoberst (Datum · Frist · Ferien-Wahl) und den Vorauswahl-Rechnern
//    darunter (S-5a).
//  - PROZESSUALE FRISTEN: Rechner für Fristen IM VERFAHREN mit eigenem
//    Stillstands-Regime (ZPO Art. 145 · SchKG Art. 56/63) — dieselben
//    Engines wie die Tagerechner-Tabs, direkt im Regime geöffnet
//    (Doppelpfad gewollt, FE-1).
//  - MATERIELLE FRISTEN: Rechner für Fristen des MATERIELLEN Rechts
//    (Verjährung, Sperrfristen 336c, Kündigungstermine, Rüge/Gewährleistung,
//    Erbrecht) — eigene Regimes ohne Gerichtsferien, mit Ein-Satz-WARUM.
// Der frühere zweite Haupteinstieg «Fristenspiegel» ist AUFGELÖST (S-5c) —
// seine Ereignisse leben in den Fach-Rechnern (EreignisFristenSektion).
//
// Die Zuordnung prozessual/materiell und die WARUM-Sätze sind fachliche
// Aussagen (Kuratierung Claude, Abnahme David offen). Der Test
// src/tests/fristenKategorie.test.ts erzwingt, dass jede VERFÜGBARE Karte
// der Fristen-Kategorie genau einem Einstiegstyp zugeordnet ist — eine neue
// Fristen-Karte ohne Zuordnung bricht die Suite (keine stille Mischliste).

export type FristenEinstiegArt = 'haupt' | 'prozessual' | 'materiell';

export interface FristenHaupteinstieg {
  id: string;
  /** Kurzzeile unter dem Titel. */
  untertitel: string;
}

export interface FristenRegimeZeile {
  id: string;
  /** Ein Satz, WARUM dieses Werkzeug ein eigenes Regime braucht. */
  warum: string;
}

/** Der grosse Einstieg der Fristen-Kategorie (S-5a: simpler Rechner oben). */
export const FRISTEN_HAUPTEINSTIEGE: FristenHaupteinstieg[] = [
  { id: 'tagerechner',
    untertitel: 'Einfacher Fristenrechner (Datum · Frist · Ferien-Wahl) – darunter Presets und die Voll-Rechner Allgemein/ZPO/SchKG inkl. Rückwärts' },
];

/** Prozessuale Fristen: eigenes Stillstands-Regime im Verfahren. */
export const FRISTEN_PROZESSUAL: FristenRegimeZeile[] = [
  { id: 'zpo-fristen',
    warum: 'Fristen im Zivilprozess mit Stillstand (Art. 145 ZPO), Zustellregeln und kantonalen Feiertagen – gerichtliche und gesetzliche Fristen' },
  { id: 'schkg-fristen',
    warum: 'Fristen in der Betreibung mit Betreibungsferien und Rechtsstillstand (Art. 56/63 SchKG) – getrennt vom ZPO-Stillstand gerechnet' },
  { id: 'bgg-fristen',
    warum: 'eigenes Bundesgerichts-Regime: Fristen 30/10/5/3 Tage je Materie (Art. 100 BGG) mit eigenem Stillstand samt abschliessenden Ausnahmen (Art. 46 BGG) – dazu Zulässigkeit und Abteilung' },
];

/** Materielle Fristen: Regimes des materiellen Rechts (ohne Gerichtsferien). */
export const FRISTEN_MATERIELL: FristenRegimeZeile[] = [
  { id: 'verjaehrung',
    warum: 'mit Unterbrechungs-Kette: Anerkennung, Betreibung oder Klage lassen die Frist neu laufen (bei Klage ab Abschluss vor der Instanz; Art. 135 ff. OR), relative und absolute Frist parallel' },
  { id: 'kuendigung-sperrfristen',
    warum: 'mit Sperrfristen nach Art. 336c OR: Krankheit, Unfall, Schwangerschaft machen die Kündigung nichtig oder hemmen die laufende Frist' },
  { id: 'mietrecht',
    warum: 'rechnet auf Kündigungstermine (Vertrag → Ortsgebrauch → Gesetz, Art. 266a ff. OR), nicht nur auf Fristlängen – samt Anfechtung und Erstreckung' },
  { id: 'gewaehrleistung',
    warum: 'zwei getrennte Uhren am selben Mangel: Rügeobliegenheit (Verwirkung – keine Hemmung) und Verjährung (Art. 197 ff., 367 ff. OR)' },
  { id: 'erbrecht-fristen',
    warum: 'eigener Fristen-Katalog je Tatbestand (Ausschlagung, Inventar, Klagefristen – Art. 521, 533, 567 ff. ZGB), je mit eigenem Fristauslöser' },
  { id: 'verjaehrung-board',
    warum: 'Verzahnungs-Board: die sechs Verjährungs-Regime (Art. 127/128/60/67 OR) im Überblick plus der Gewährleistungs-Sonderfall und die Brücke zur AT-Mechanik' },
];

/** Einstiegstyp einer Karte der Fristen-Kategorie — null heisst: noch nicht
 *  zugeordnet (der Test bricht dann; die UI fällt ehrlich auf eine
 *  Zeile ohne WARUM-Satz zurück). */
export function fristenEinstiegArt(id: string): FristenEinstiegArt | null {
  if (FRISTEN_HAUPTEINSTIEGE.some((h) => h.id === id)) return 'haupt';
  if (FRISTEN_PROZESSUAL.some((r) => r.id === id)) return 'prozessual';
  if (FRISTEN_MATERIELL.some((r) => r.id === id)) return 'materiell';
  return null;
}
