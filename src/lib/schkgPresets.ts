// Dossier: bibliothek/normen/schkg-zustaendigkeit-regelwerk.md
import type { SchkgModus, SchkgFristnatur, SchkgEinheit, SchkgFristSpec } from '../types/schkg';

// ─── SchKG-Fristen-Presets (Konzept Tabelle A / Gruppierung B) ────────────
//
// Jedes Preset parametrisiert Stillstand-Regime (Art. 56/63 SchKG bzw. ZPO),
// Rechtsnatur, auslösendes Ereignis und – wo das Gesetz «frühestens X /
// spätestens Y» kennt – eine Warte- UND eine Verwirkungsfrist (dual).
//
// VERIFY: Artikel, Absätze und Fristlängen sind aus dem redaktionellen Konzept
// übernommen und vor Produktivschaltung gegen Fedlex SR 281.1 zu prüfen.
// `verweise` referenzieren Schlüssel des zentralen Verifikations-Registers
// (src/data/verifikation.ts); alle dortigen Einträge tragen verifiziert:false.

export type SchkgPhase =
  | 'einleitung'
  | 'rechtsoeffnung'
  | 'fortsetzung'
  | 'verwertung'
  | 'konkurs'
  | 'nachlass'
  | 'arrest'
  | 'anfechtung'
  | 'rechtsmittel';

export type SchkgPreset = {
  key: string;
  phase: SchkgPhase;
  label: string;
  norm: string;
  // Einzelfrist:
  einheit?: SchkgEinheit;
  laenge?: number;
  // Dual («frühestens / spätestens»):
  wartefrist?: SchkgFristSpec;
  verwirkung?: SchkgFristSpec;
  // Reine Info (keine berechenbare Frist, z. B. «jederzeit»/«richterlich angesetzt»):
  infoOnly?: boolean;
  modus: SchkgModus;
  modusUmstritten?: boolean;   // Summarsache Art. 251 ZPO → Override + Warnung
  fristnatur: SchkgFristnatur;
  ausloeser: string;
  hemmungMoeglich?: boolean;   // Art. 88 Abs. 2 / Art. 166 Abs. 2
  hinweis?: string;
  verweise?: string[];
};

export const PHASEN_SCHKG: { code: SchkgPhase; label: string }[] = [
  { code: 'einleitung', label: 'Einleitung' },
  { code: 'rechtsoeffnung', label: 'Rechtsöffnung & Klagen' },
  { code: 'fortsetzung', label: 'Fortsetzung / Pfändung' },
  { code: 'verwertung', label: 'Verwertung' },
  { code: 'konkurs', label: 'Konkurs' },
  { code: 'nachlass', label: 'Nachlass' },
  { code: 'arrest', label: 'Arrest' },
  { code: 'anfechtung', label: 'Anfechtung (Pauliana)' },
  { code: 'rechtsmittel', label: 'Rechtsbehelfe/Rechtsmittel' },
];

export const PRESETS_SCHKG: SchkgPreset[] = [
  // ── Einleitungsverfahren ──
  { key: 'rechtsvorschlag', phase: 'einleitung', label: 'Rechtsvorschlag – 10 Tage', norm: 'Art. 74 Abs. 1 SchKG',
    einheit: 'tage', laenge: 10, modus: 'schkg_betreibungsferien', fristnatur: 'frist', ausloeser: 'Zustellung Zahlungsbefehl',
    hinweis: 'Keine Begründung nötig (Art. 75 SchKG); Wiederherstellung nach Art. 33 Abs. 4 SchKG.' },
  { key: 'rechtsvorschlag_nachtraeglich', phase: 'einleitung', label: 'Nachträglicher Rechtsvorschlag – 10 Tage', norm: 'Art. 77 SchKG',
    einheit: 'tage', laenge: 10, modus: 'schkg_betreibungsferien', fristnatur: 'frist', ausloeser: 'Kenntnis des Gläubigerwechsels' },
  // B2-Fix 6.6.2026: «in der Wechselbetreibung gibt es keine Betreibungsferien»
  // (Art. 56 Ziff. 2 SchKG, Wortlaut am Cache verifiziert) → modus 'kein' für
  // alle drei Wechsel-Presets; vorher verschob die Ferien-Logik das Fristende
  // fälschlich um bis zu ~1 Woche nach hinten.
  { key: 'rechtsvorschlag_wechsel', phase: 'einleitung', label: 'Rechtsvorschlag Wechselbetreibung – 5 Tage', norm: 'Art. 179 Abs. 1 SchKG',
    einheit: 'tage', laenge: 5, modus: 'kein', fristnatur: 'frist', ausloeser: 'Zustellung Zahlungsbefehl',
    hinweis: 'Muss begründet werden; gerichtliche Bewilligung (Art. 181 f. SchKG). In der Wechselbetreibung gibt es KEINE Betreibungsferien (Art. 56 Ziff. 2 SchKG).' },

  // ── Rechtsöffnung & materiellrechtliche Klagen ──
  { key: 'aberkennungsklage', phase: 'rechtsoeffnung', label: 'Aberkennungsklage – 20 Tage', norm: 'Art. 83 Abs. 2 SchKG',
    einheit: 'tage', laenge: 20, modus: 'zpo_stillstand', fristnatur: 'verwirkung', ausloeser: 'Eröffnung/Rechtskraft der provisorischen Rechtsöffnung',
    hinweis: 'Gerichtliche Klage → seit 1.1.2025 ZPO-Stillstand (Art. 56 Abs. 2 SchKG). Auslöser ist eine Betreibungshandlung – altrechtlich galten die Betreibungsferien.', verweise: ['BGE_143_III_38'] },
  { key: 'anerkennungsklage', phase: 'rechtsoeffnung', label: 'Anerkennungsklage (keine eigene Frist)', norm: 'Art. 79 SchKG',
    infoOnly: true, modus: 'zpo_stillstand', fristnatur: 'klagefrist', ausloeser: 'Rechtsvorschlag',
    hinweis: 'Keine eigene Frist; Spiegelbild der Aberkennungsklage. Beachte die Jahresfrist nach Art. 88 SchKG.' },
  { key: 'feststellung_aufhebung', phase: 'rechtsoeffnung', label: 'Feststellungs-/Aufhebungsklage (jederzeit)', norm: 'Art. 85 / 85a SchKG',
    infoOnly: true, modus: 'zpo_stillstand', fristnatur: 'klagefrist', ausloeser: '–',
    hinweis: 'Während der Betreibung jederzeit möglich (Art. 85: Urkundenbeweis Tilgung/Stundung).' },
  { key: 'rueckforderungsklage', phase: 'rechtsoeffnung', label: 'Rückforderungsklage – 1 Jahr', norm: 'Art. 86 SchKG',
    einheit: 'jahre', laenge: 1, modus: 'zpo_stillstand', fristnatur: 'klagefrist', ausloeser: 'Zahlung der Nichtschuld',
    hinweis: 'Nach unterlassenem oder beseitigtem Rechtsvorschlag.' },

  // ── Fortsetzung / Pfändung ──
  { key: 'fortsetzungsbegehren', phase: 'fortsetzung', label: 'Fortsetzungsbegehren – frühestens 20 Tage / spätestens 1 Jahr', norm: 'Art. 88 SchKG',
    wartefrist: { einheit: 'tage', laenge: 20 }, verwirkung: { einheit: 'jahre', laenge: 1 },
    modus: 'schkg_betreibungsferien', fristnatur: 'verwirkung', ausloeser: 'Zustellung Zahlungsbefehl', hemmungMoeglich: true,
    hinweis: 'Abs. 1: vor Ablauf von 20 Tagen unzulässig. Abs. 2: Verwirkung nach 1 Jahr; Stillstand während rechtsvorschlagsbedingtem Verfahren.' },
  // Norm-Anker-Korrektur (QS-GP 2.7.2026): Der 30-Tage-Wert ist die ordentliche
  // Anschlusspfändung nach Art. 110 Abs. 1 SchKG (SR 281.1, Stand 1.1.2026,
  // https://www.fedlex.admin.ch/eli/cc/11/529_488_529/de, am XML verifiziert).
  // Das Sammelzitat «Art. 110/111» konflatierte zwei verschieden lange Fristen:
  // Der privilegierte Anschluss (Art. 111 Abs. 1) läuft 40 Tage – anderes Regime,
  // hier bewusst nicht als eigenes Preset abgebildet (§8-Offenlegung im hinweis).
  { key: 'teilnahme_pfaendung', phase: 'fortsetzung', label: 'Teilnahme an Pfändung (Anschluss) – 30 Tage', norm: 'Art. 110 Abs. 1 SchKG',
    einheit: 'tage', laenge: 30, modus: 'schkg_betreibungsferien', fristnatur: 'frist', ausloeser: 'Pfändungsvollzug',
    hinweis: 'Ordentliche Anschlusspfändung: 30 Tage ab Pfändungsvollzug (Art. 110 Abs. 1 SchKG). Der privilegierte Anschluss ohne vorgängige Betreibung (Ehegatte, Kinder u.a.) läuft dagegen 40 Tage (Art. 111 Abs. 1 SchKG) und ist hier nicht abgebildet.' },
  { key: 'widerspruch_bestreitung', phase: 'fortsetzung', label: 'Widerspruch – Bestreitungsfrist – 10 Tage', norm: 'Art. 107 Abs. 2 SchKG',
    einheit: 'tage', laenge: 10, modus: 'schkg_betreibungsferien', fristnatur: 'frist', ausloeser: 'Mitteilung/Fristansetzung (Gewahrsam Schuldner)' },
  { key: 'widerspruchsklage_schuldner', phase: 'fortsetzung', label: 'Widerspruchsklage (Gewahrsam Schuldner) – 20 Tage', norm: 'Art. 107 Abs. 5 SchKG',
    einheit: 'tage', laenge: 20, modus: 'zpo_stillstand', fristnatur: 'klagefrist', ausloeser: 'Fristansetzung Betreibungsamt' },
  { key: 'widerspruchsklage_dritter', phase: 'fortsetzung', label: 'Widerspruchsklage (Gewahrsam Dritter) – 20 Tage', norm: 'Art. 108 Abs. 2 SchKG',
    einheit: 'tage', laenge: 20, modus: 'zpo_stillstand', fristnatur: 'klagefrist', ausloeser: 'Fristansetzung Betreibungsamt',
    hinweis: 'Auch im Arrest (Art. 275 SchKG).' },

  // ── Verwertung ──
  { key: 'verwertung_beweglich', phase: 'verwertung', label: 'Verwertungsbegehren bewegliche Sachen – frühestens 1 Monat / spätestens 1 Jahr', norm: 'Art. 116 Abs. 1 SchKG',
    wartefrist: { einheit: 'monate', laenge: 1 }, verwirkung: { einheit: 'jahre', laenge: 1 },
    modus: 'schkg_betreibungsferien', fristnatur: 'verwirkung', ausloeser: 'Pfändungsvollzug',
    hinweis: 'Bei Ergänzungspfändung ab letzter Pfändung (Art. 116 Abs. 3 SchKG).' },
  { key: 'verwertung_grundstueck', phase: 'verwertung', label: 'Verwertungsbegehren Grundstücke – frühestens 6 Monate / spätestens 2 Jahre', norm: 'Art. 116 Abs. 1 SchKG',
    wartefrist: { einheit: 'monate', laenge: 6 }, verwirkung: { einheit: 'jahre', laenge: 2 },
    modus: 'schkg_betreibungsferien', fristnatur: 'verwirkung', ausloeser: 'Pfändungsvollzug',
    hinweis: 'Minimalfrist im Schuldnerinteresse.', verweise: ['BGer_5A_611_2023'] },
  { key: 'verwertung_lohn', phase: 'verwertung', label: 'Verwertungsbegehren Lohn – bis 15 Monate', norm: 'Art. 116 Abs. 2 SchKG',
    einheit: 'monate', laenge: 15, modus: 'schkg_betreibungsferien', fristnatur: 'frist', ausloeser: 'Pfändung' },
  { key: 'erloeschen_pfaendung', phase: 'verwertung', label: 'Erlöschen der Betreibung bei Pfändung', norm: 'Art. 121 SchKG',
    infoOnly: true, modus: 'schkg_betreibungsferien', fristnatur: 'verwirkung', ausloeser: 'Fristablauf Art. 116 SchKG',
    hinweis: 'Wird kein fristgerechtes Verwertungsbegehren gestellt, erlischt die Betreibung; spätere Handlungen sind nichtig.' },
  { key: 'pfandverwertung_faust', phase: 'verwertung', label: 'Pfandverwertung Faustpfand – frühestens 1 Monat / spätestens 1 Jahr', norm: 'Art. 154 SchKG',
    wartefrist: { einheit: 'monate', laenge: 1 }, verwirkung: { einheit: 'jahre', laenge: 1 },
    modus: 'schkg_betreibungsferien', fristnatur: 'verwirkung', ausloeser: 'Zustellung Zahlungsbefehl (Bedenkfrist Art. 152 SchKG)',
    hinweis: 'Erlöschen nach Art. 154 Abs. 2 SchKG.' },
  { key: 'pfandverwertung_grund', phase: 'verwertung', label: 'Pfandverwertung Grundpfand – frühestens 6 Monate / spätestens 2 Jahre', norm: 'Art. 154 SchKG',
    wartefrist: { einheit: 'monate', laenge: 6 }, verwirkung: { einheit: 'jahre', laenge: 2 },
    modus: 'schkg_betreibungsferien', fristnatur: 'verwirkung', ausloeser: 'Zustellung Zahlungsbefehl (Bedenkfrist Art. 152 SchKG)' },
  { key: 'steigerung_publikation', phase: 'verwertung', label: 'Steigerungspublikation Grundstück – mind. 1 Monat vorher', norm: 'Art. 138 Abs. 1 SchKG',
    infoOnly: true, modus: 'schkg_betreibungsferien', fristnatur: 'ordnungsfrist', ausloeser: 'Ansetzung der Steigerung',
    hinweis: 'Mindestfrist von einem Monat vor der Steigerung; bei verschobener Steigerung keine erneute Minimalfrist.', verweise: ['BGE_119_III_26'] },
  { key: 'lastenverzeichnis_eingabe', phase: 'verwertung', label: 'Lastenverzeichnis – Eingabe Ansprüche – 20 Tage', norm: 'Art. 138 Abs. 2 Ziff. 3 SchKG',
    einheit: 'tage', laenge: 20, modus: 'schkg_betreibungsferien', fristnatur: 'verwirkung', ausloeser: 'Bekanntmachung',
    hinweis: 'Bei Versäumnis nur Teilnahme, soweit im Grundbuch eingetragen.' },
  { key: 'lastenbereinigung', phase: 'verwertung', label: 'Lastenbereinigung – Bestreitung – 10 Tage', norm: 'Art. 140 i.V.m. 107/109 SchKG',
    einheit: 'tage', laenge: 10, modus: 'schkg_betreibungsferien', fristnatur: 'frist', ausloeser: 'Zustellung Lastenverzeichnis',
    hinweis: 'Bestreitung muss nicht substantiiert sein. Anschliessend Klagefristansetzung 20 Tage (ZPO-Stillstand).', verweise: ['BGer_5A_852_2014'] },
  // Norm-Anker-Korrektur (QS-GP 2.7.2026): Der Doppelaufruf steht in Art. 142
  // Abs. 1 SchKG («…kann der Grundpfandgläubiger innert zehn Tagen nach Zustellung
  // des Lastenverzeichnisses den Aufruf sowohl mit als auch ohne die Last
  // verlangen»). Art. 141 SchKG regelt dagegen die Aussetzung der Versteigerung
  // bei streitigem Lastenverzeichnis-Anspruch – falscher Artikel (um eins
  // verschoben). SR 281.1, Stand 1.1.2026,
  // https://www.fedlex.admin.ch/eli/cc/11/529_488_529/de, am XML verifiziert.
  { key: 'doppelaufruf', phase: 'verwertung', label: 'Doppelaufruf-Begehren – 10 Tage', norm: 'Art. 142 Abs. 1 SchKG',
    einheit: 'tage', laenge: 10, modus: 'schkg_betreibungsferien', fristnatur: 'frist', ausloeser: 'Zustellung Lastenverzeichnis',
    hinweis: 'Nur in der Pfandverwertung.' },

  // ── Konkurs ──
  { key: 'konkursandrohung_warte', phase: 'konkurs', label: 'Konkursbegehren – Wartefrist – frühestens 20 Tage', norm: 'Art. 166 Abs. 1 SchKG',
    einheit: 'tage', laenge: 20, modus: 'schkg_betreibungsferien', fristnatur: 'wartefrist', ausloeser: 'Zustellung Konkursandrohung',
    hinweis: 'Vorgängige Konkursandrohung Art. 159/160 SchKG.' },
  { key: 'konkursbegehren_verwirkung', phase: 'konkurs', label: 'Konkursbegehren – Verwirkung – 15 Monate', norm: 'Art. 166 Abs. 2 SchKG',
    einheit: 'monate', laenge: 15, modus: 'schkg_betreibungsferien', fristnatur: 'verwirkung', ausloeser: 'Zustellung Zahlungsbefehl', hemmungMoeglich: true,
    hinweis: 'Stillstand während rechtsvorschlagsbedingtem Gerichtsverfahren.', verweise: ['BGer_5A_190_2023'] },
  { key: 'konkursbegehren_wechsel', phase: 'konkurs', label: 'Konkursbegehren Wechselbetreibung – 1 Monat', norm: 'Art. 188 SchKG',
    // B2-Fix 6.6.2026: keine Betreibungsferien in der Wechselbetreibung (Art. 56 Ziff. 2 SchKG).
    einheit: 'monate', laenge: 1, modus: 'kein', fristnatur: 'verwirkung', ausloeser: 'Zustellung Zahlungsbefehl',
    hinweis: 'In der Wechselbetreibung gibt es KEINE Betreibungsferien (Art. 56 Ziff. 2 SchKG).' },
  { key: 'durchfuehrung_mangels_aktiven', phase: 'konkurs', label: 'Durchführungsbegehren mangels Aktiven – 20 Tage', norm: 'Art. 230 SchKG',
    einheit: 'tage', laenge: 20, modus: 'kein', fristnatur: 'frist', ausloeser: 'Publikation',
    hinweis: 'Kostenvorschuss sicherzustellen.' },
  { key: 'schuldenruf_konkurs', phase: 'konkurs', label: 'Eingabefrist Forderungen (Schuldenruf) – 1 Monat', norm: 'Art. 232 Abs. 2 Ziff. 2 SchKG',
    einheit: 'monate', laenge: 1, modus: 'kein', fristnatur: 'ordnungsfrist', ausloeser: 'Publikation SHAB',
    hinweis: 'Eingabe auch später bis Verfahrensschluss möglich (Konkurs = keine Betreibungshandlung). In der Pfandverwertung: 20 Tage (Art. 138 Abs. 2 Ziff. 3).' },
  { key: 'kollokationsklage_konkurs', phase: 'konkurs', label: 'Kollokationsklage Konkurs – 20 Tage', norm: 'Art. 250 Abs. 1 SchKG',
    einheit: 'tage', laenge: 20, modus: 'zpo_stillstand', fristnatur: 'klagefrist', ausloeser: 'Auflage des Kollokationsplans',
    hinweis: 'Die Auflage des Kollokationsplans ist keine Betreibungshandlung → ZPO-Gerichtsferien (Art. 145 ZPO), nicht Art. 63 SchKG.', verweise: ['BGE_149_III_179'] },
  { key: 'kollokationsklage_pfaendung', phase: 'konkurs', label: 'Kollokationsklage Pfändung – 20 Tage', norm: 'Art. 148 SchKG',
    einheit: 'tage', laenge: 20, modus: 'zpo_stillstand', fristnatur: 'klagefrist', ausloeser: 'Zustellung Kollokationsverfügung' },
  { key: 'anfechtung_glaeubigerversammlung', phase: 'konkurs', label: 'Anfechtung erste Gläubigerversammlung – 5 Tage', norm: 'Art. 239 Abs. 1 SchKG',
    einheit: 'tage', laenge: 5, modus: 'schkg_betreibungsferien', fristnatur: 'beschwerdefrist', ausloeser: 'Gläubigerversammlung' },

  // ── Nachlass ──
  { key: 'nachlass_provisorisch', phase: 'nachlass', label: 'Provisorische Nachlassstundung – max. 4 (+4) Monate', norm: 'Art. 293a SchKG',
    infoOnly: true, modus: 'kein', fristnatur: 'frist', ausloeser: 'Bewilligung Nachlassgericht',
    hinweis: 'Stundungsdauer (keine Fristberechnung): max. 4 Monate, Verlängerung um max. 4 Monate. Bei Aussichtslosigkeit Konkurs von Amtes wegen.' },
  { key: 'nachlass_definitiv', phase: 'nachlass', label: 'Definitive Nachlassstundung – 4–6 (bis 24) Monate', norm: 'Art. 294 Abs. 1 / 295b SchKG',
    infoOnly: true, modus: 'kein', fristnatur: 'frist', ausloeser: 'Bewilligung',
    hinweis: 'Stundungsdauer: 4–6 Monate, gesamt bis 12, in komplexen Fällen bis 24 Monate.' },
  { key: 'schuldenruf_nachlass', phase: 'nachlass', label: 'Schuldenruf im Nachlass (richterlich)', norm: 'Art. 300 SchKG',
    infoOnly: true, modus: 'kein', fristnatur: 'frist', ausloeser: 'Publikation',
    hinweis: 'Vom Sachwalter angesetzte Frist.' },

  // ── Arrest ──
  { key: 'arresteinsprache', phase: 'arrest', label: 'Arresteinsprache – 10 Tage', norm: 'Art. 278 Abs. 1 SchKG',
    einheit: 'tage', laenge: 10, modus: 'schkg_betreibungsferien', modusUmstritten: true, fristnatur: 'frist', ausloeser: 'Zustellung Arresturkunde',
    hinweis: 'Betreibungsrechtliche Summarsache (Art. 251 ZPO) – Stillstand-Regime in Lehre/Rechtsprechung umstritten (Default Art. 56 ff. SchKG, manueller Override möglich). Nur Einsprache nötig; Begründung kann nachgereicht werden.', verweise: ['BGer_5A_545_2017'] },
  { key: 'arrestprosekution', phase: 'arrest', label: 'Arrestprosekution – Betreibung einleiten – 10 Tage', norm: 'Art. 279 Abs. 1 SchKG',
    einheit: 'tage', laenge: 10, modus: 'schkg_betreibungsferien', fristnatur: 'verwirkung', ausloeser: 'Zustellung Arresturkunde',
    hinweis: '«Einleitung» = Stellung des Betreibungsbegehrens. Arrest fällt sonst dahin (Art. 280 SchKG); Stillstand während Einspracheverfahren (Art. 278 Abs. 5).', verweise: ['BGer_5A_288_2012'] },

  // ── Anfechtung (Pauliana) ──
  // Bug-Check 10.6.2026 (HOCH, deklarierte fachliche Änderung): Art. 292 SchKG
  // ist seit 1.1.2020 VERJÄHRUNGSfrist — materielle Verjährung ruht nicht
  // während der Gerichtsferien (Hemmungs-/Stillstandsgründe abschliessend
  // Art. 134 OR; Repo-Prinzip MATERIELL_WARNUNG zpoPresets, BGE 140 III 561).
  // Vorher modus 'zpo_stillstand' → Verjährungseintritt ~8 Monate zu spät.
  { key: 'pauliana', phase: 'anfechtung', label: 'Paulianische Anfechtungsklage – 3 Jahre', norm: 'Art. 285 Abs. 2 / Art. 292 SchKG',
    einheit: 'jahre', laenge: 3, modus: 'kein', fristnatur: 'frist', ausloeser: 'Pfändungsverlustschein / Konkurseröffnung / Bestätigung Nachlassvertrag',
    hinweis: 'VERJÄHRUNGSfrist (seit 1.1.2020 drei Jahre) – kein Gerichtsferien-Stillstand; Hemmung/Unterbrechung nur nach Art. 134 f. OR. Verdachtsperioden materiell: 1 Jahr (Art. 286/287), 5 Jahre (Art. 288).' },

  // ── Rechtsbehelfe / Rechtsmittel ──
  { key: 'beschwerde_aufsicht', phase: 'rechtsmittel', label: 'Beschwerde an Aufsichtsbehörde – 10 Tage', norm: 'Art. 17 Abs. 2 SchKG',
    einheit: 'tage', laenge: 10, modus: 'schkg_betreibungsferien', fristnatur: 'beschwerdefrist', ausloeser: 'Kenntnis der Verfügung',
    hinweis: 'Aufsichtsbeschwerde: ZPO-Stillstand gilt NICHT (Art. 145 Abs. 4 Satz 2 ZPO); Art. 63 SchKG nur, wenn eine Betreibungshandlung angefochten wird. Rechtsverweigerung/-verzögerung jederzeit (Art. 17 Abs. 3).', verweise: ['BGE_141_III_170'] },
  // RL-05 / Befund F2-01 (Prüfung Rechtslogik 23.9.2026, deklarierte fachliche
  // Änderung): vorher modus 'schkg_betreibungsferien' → Art.-63-Verlängerung
  // eingerechnet (Eröffnung 10.7.2026 ZH: 05.08. statt 20.07.2026). Art. 63
  // SchKG gilt nur für Fristen, die eine Betreibungshandlung (Art. 56) auslöst;
  // der Entscheid der Aufsichtsbehörde ist i.d.R. keine (BGer 5A_730/2023 vom
  // 21.11.2023 E. 3.2–3.4). Werktagsregel (Art. 31 SchKG i.V.m. Art. 142 Abs. 3
  // ZPO) bleibt über modus 'kein' erhalten.
  { key: 'weiterzug_ab', phase: 'rechtsmittel', label: 'Weiterzug an obere Aufsichtsbehörde – 10 Tage', norm: 'Art. 18 Abs. 1 SchKG',
    einheit: 'tage', laenge: 10, modus: 'kein', fristnatur: 'beschwerdefrist', ausloeser: 'Eröffnung des Entscheids',
    hinweis: 'Entscheide der Aufsichtsbehörde sind i.d.R. keine Betreibungshandlung → keine Verlängerung nach Art. 63 SchKG (auch nicht in den Betreibungsferien). Ausnahme: ordnet der Entscheid selbst eine Betreibungshandlung an (oder schreibt sie dem Amt vor), gilt Art. 63 SchKG (BGer 5A_730/2023 E. 3.2–3.4).', verweise: ['BGer_5A_730_2023'] },
  { key: 'beschwerde_bger', phase: 'rechtsmittel', label: 'Beschwerde ans Bundesgericht – 10 Tage', norm: 'Art. 19 SchKG i.V.m. Art. 100 Abs. 2 lit. a BGG',
    einheit: 'tage', laenge: 10, modus: 'kein', fristnatur: 'beschwerdefrist', ausloeser: 'Eröffnung des Endentscheids',
    hinweis: 'BGG-Fristen folgen dem Stillstand nach Art. 46 BGG (eigener Kalender) – dieser Rechner bildet ihn NICHT ab; im Einzelfall prüfen.' },
  { key: 'beschwerde_wechsel', phase: 'rechtsmittel', label: 'Beschwerde Wechselbetreibung – 5 Tage', norm: 'Art. 20 SchKG',
    // B2-Fix 6.6.2026: keine Betreibungsferien in der Wechselbetreibung (Art. 56 Ziff. 2 SchKG).
    einheit: 'tage', laenge: 5, modus: 'kein', fristnatur: 'beschwerdefrist', ausloeser: 'Kenntnis der Verfügung',
    hinweis: 'Verkürzte Fristen; keine Wiederherstellung. In der Wechselbetreibung gibt es KEINE Betreibungsferien (Art. 56 Ziff. 2 SchKG).' },
];

export const SCHKG_DISCLAIMER =
  'Dieser Fristenrechner ist eine rechnerische Orientierungshilfe zum Schuldbetreibungs- und Konkursrecht ' +
  '(Art. 31, 56, 63 SchKG; Schnittstelle Art. 145 ZPO) und stellt keine Rechtsberatung und keine verbindliche ' +
  'Fristberechnung dar. Das Stillstand-Regime, die Rechtsnatur der Frist und das auslösende Ereignis sind im ' +
  'Einzelfall zu prüfen; insbesondere ist die Behandlung der betreibungsrechtlichen Summarsachen (Art. 251 ZPO) ' +
  'in Lehre und Rechtsprechung umstritten. Kantonale Feiertage und der konkrete Sachverhalt sind eigenständig zu ' +
  'prüfen. Für die Wahrung einer Frist im Einzelfall ist allein die nutzende Person verantwortlich.';
