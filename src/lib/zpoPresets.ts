// Dossier: bibliothek/normen/normtexte-zpo-zustaendigkeit.md
import type { ZpoEinheit, ZpoVerfahren, ZpoFristnatur } from '../types/zpo';

// Verfahrensphasen-Presets für den ZPO-Fristenrechner (Stand revidierte ZPO, 1.1.2025).
// Jedes Preset parametrisiert: Fristlänge, Verfahren (→ Stillstand Art. 145), Fristnatur
// (→ Erstreckbarkeit Art. 144) und einen kontextuellen Hinweis.

export type ZpoPhase = 'rechtsmittel' | 'schlichtung' | 'erstinstanz' | 'besondere' | 'schied' | 'materiell';

export type ZpoPreset = {
  key: string;
  phase: Exclude<ZpoPhase, 'materiell'>;
  label: string;
  norm: string;
  einheit: ZpoEinheit;
  laenge?: number;            // undefined → richterlich angesetzt (Dauer vom Nutzer)
  verfahren: ZpoVerfahren;
  fristnatur: ZpoFristnatur;
  hinweis?: string;
  /** RL-07/F1-01 (Prüfung Rechtslogik 23.9.2026): Frist folgt NICHT der ZPO,
   *  sondern dem BGG — Fristbeginn Art. 44 Abs. 1, Feiertage am Wohnsitz/Sitz
   *  der Partei oder ihrer Vertretung (Art. 45 Abs. 2), Stillstand Art. 46 BGG.
   *  Das Formular rechnet solche Presets mit der BGG-Engine (bggVwvgFristen),
   *  nicht mit der ZPO-Feiertagsregel «Gerichtsort» (Art. 142 Abs. 3 ZPO). Die
   *  Regeln bleiben getrennt (§1/§4) — kein Umbau der ZPO-Engine. */
  engine?: 'bgg';
};

export const PHASEN: { code: ZpoPhase; label: string }[] = [
  { code: 'rechtsmittel', label: 'Rechtsmittel' },
  { code: 'schlichtung', label: 'Schlichtung' },
  { code: 'erstinstanz', label: 'Erstinstanz' },
  { code: 'besondere', label: 'Besondere Verfahren' },
  { code: 'schied', label: 'Schiedsverfahren' },
  { code: 'materiell', label: 'Materielle Frist' },
];

export const PRESETS: ZpoPreset[] = [
  // ── Rechtsmittel (Phase A – höchste Praxisrelevanz) ──
  { key: 'berufung', phase: 'rechtsmittel', label: 'Berufung (ordentlich) – 30 Tage', norm: 'Art. 311 Abs. 1 ZPO',
    einheit: 'tage', laenge: 30, verfahren: 'ordentlich', fristnatur: 'gesetzlich',
    hinweis: 'Ab Zustellung des begründeten Entscheids. Bei nur im Dispositiv eröffnetem Entscheid zuerst innert 10 Tagen Begründung verlangen (Art. 239 Abs. 2 ZPO).' },
  { key: 'berufung_summar', phase: 'rechtsmittel', label: 'Berufung gegen Summarentscheid – 10 Tage', norm: 'Art. 314 Abs. 1 ZPO',
    einheit: 'tage', laenge: 10, verfahren: 'rechtsmittel_summarisch', fristnatur: 'gesetzlich',
    hinweis: 'Kein Stillstand (summarisch, gilt auch für die Berufungsfrist, BGE 139 III 78) – Hinweis des Gerichts beachten.' },
  { key: 'berufung_familienrecht', phase: 'rechtsmittel', label: 'Berufung familienr. Summarsache – 30 Tage (2025)', norm: 'Art. 314 Abs. 2 ZPO',
    einheit: 'tage', laenge: 30, verfahren: 'rechtsmittel_summarisch', fristnatur: 'gesetzlich',
    hinweis: 'Revision 2025: 30 statt 10 Tage bei Art. 271/276/302/305 ZPO; Anschlussberufung zulässig. Stillstand-Anwendbarkeit im Einzelfall prüfen.' },
  { key: 'berufungsantwort', phase: 'rechtsmittel', label: 'Berufungsantwort – 30 Tage', norm: 'Art. 312 Abs. 2 ZPO',
    einheit: 'tage', laenge: 30, verfahren: 'ordentlich', fristnatur: 'gesetzlich',
    hinweis: 'Gesetzlich, nicht erstreckbar – keine «Fristabnahme» (BGE 141 III 554).' },
  { key: 'anschlussberufung', phase: 'rechtsmittel', label: 'Anschlussberufung – 30 Tage', norm: 'Art. 313 Abs. 1 ZPO',
    einheit: 'tage', laenge: 30, verfahren: 'ordentlich', fristnatur: 'gesetzlich',
    hinweis: 'Innert der Berufungsantwortfrist.' },
  { key: 'beschwerde', phase: 'rechtsmittel', label: 'Beschwerde (begründeter Entscheid) – 30 Tage', norm: 'Art. 321 Abs. 1 ZPO',
    einheit: 'tage', laenge: 30, verfahren: 'ordentlich', fristnatur: 'gesetzlich' },
  { key: 'beschwerde_summar', phase: 'rechtsmittel', label: 'Beschwerde gegen Summarentscheid – 10 Tage', norm: 'Art. 321 Abs. 2 ZPO',
    einheit: 'tage', laenge: 10, verfahren: 'rechtsmittel_summarisch', fristnatur: 'gesetzlich',
    hinweis: 'Auch prozessleitende Verfügungen; kein Stillstand (summarisch).' },
  { key: 'revision', phase: 'rechtsmittel', label: 'Revision – 90 Tage (relativ)', norm: 'Art. 329 Abs. 1 ZPO',
    einheit: 'tage', laenge: 90, verfahren: 'ordentlich', fristnatur: 'gesetzlich',
    hinweis: 'Ab Entdeckung des Revisionsgrundes. Absolute Frist: 10 Jahre ab Rechtskraft (Art. 329 Abs. 2).' },

  // ── Schlichtung ──
  // Bug-Check 10.6.2026 (HOCH, deklarierte fachliche Änderung): Die Art.-209-
  // Klagefristen gehören zum GERICHTLICHEN Verfahren — Stillstand gilt
  // (BGE 138 III 615 E. 2.4; eigener Engine-Zweig klagefrist_klagebewilligung,
  // identisch gerechnet in vorlagen/klageVereinfacht.ts). Vorher verfahren
  // 'schlichtung' → Frist ohne Stillstand bis 1 Monat zu früh angezeigt.
  { key: 'klagebewilligung', phase: 'schlichtung', label: 'Gültigkeit Klagebewilligung – 3 Monate', norm: 'Art. 209 Abs. 3 ZPO',
    einheit: 'monate', laenge: 3, verfahren: 'klagefrist_klagebewilligung', fristnatur: 'gesetzlich',
    hinweis: 'Ab Zustellung/Eröffnung. Ob für die Prosekutionsfrist ein Stillstand greift, ist nicht abschliessend geklärt – im Einzelfall prüfen.' },
  { key: 'klagefrist_miete', phase: 'schlichtung', label: 'Klagefrist Miete/Pacht – 30 Tage', norm: 'Art. 209 Abs. 4 ZPO',
    einheit: 'tage', laenge: 30, verfahren: 'klagefrist_klagebewilligung', fristnatur: 'gesetzlich',
    hinweis: 'Wohn-/Geschäftsräume und landw. Pacht. Ab Zustellung der Klagebewilligung. Stillstand gilt (BGE 138 III 615).' },
  { key: 'entscheidvorschlag', phase: 'schlichtung', label: 'Ablehnung Entscheidvorschlag – 20 Tage', norm: 'Art. 211 Abs. 1 ZPO',
    einheit: 'tage', laenge: 20, verfahren: 'ordentlich', fristnatur: 'gesetzlich',
    hinweis: 'Hier ist der Fristenstillstand zu berücksichtigen (BGE 144 III 404; Ausnahme für Schlichtung gilt nicht).' },

  // ── Erstinstanz ──
  { key: 'begruendung', phase: 'erstinstanz', label: 'Begründung verlangen – 10 Tage', norm: 'Art. 239 Abs. 2 ZPO',
    einheit: 'tage', laenge: 10, verfahren: 'ordentlich', fristnatur: 'gesetzlich',
    hinweis: 'Ab Eröffnung des Dispositivs; sonst gilt das Rechtsmittel als verzichtet.' },
  { key: 'neueinreichung', phase: 'erstinstanz', label: 'Neueinreichung nach Nichteintreten – 1 Monat', norm: 'Art. 63 Abs. 1 ZPO',
    einheit: 'monate', laenge: 1, verfahren: 'ordentlich', fristnatur: 'gesetzlich',
    hinweis: 'Fristwahrend für die Rechtshängigkeit.' },
  { key: 'klageantwort', phase: 'erstinstanz', label: 'Klageantwort (ordentlich) – richterlich', norm: 'Art. 222 Abs. 1 ZPO',
    einheit: 'tage', verfahren: 'ordentlich', fristnatur: 'gerichtlich',
    hinweis: 'Vom Gericht angesetzt – Dauer eingeben. Richterliche Frist (erstreckbar, Art. 144 Abs. 2).' },
  { key: 'stellungnahme_summar', phase: 'erstinstanz', label: 'Stellungnahme summarisch – richterlich', norm: 'Art. 253 ZPO',
    einheit: 'tage', verfahren: 'summarisch', fristnatur: 'gerichtlich',
    hinweis: 'Vom Gericht angesetzt – Dauer eingeben. Kein Stillstand (summarisch).' },

  // ── Besondere / vorsorgliche Verfahren ──
  { key: 'prosekution', phase: 'besondere', label: 'Prosekutionsfrist vorsorgl. Massnahmen – richterlich', norm: 'Art. 263 ZPO',
    einheit: 'tage', verfahren: 'summarisch', fristnatur: 'gerichtlich',
    hinweis: 'Vom Gericht angesetzt (Praxis z.B. 60 Tage). Stillstand-Anwendbarkeit umstritten (BGer 4A_20/2024) – im Einzelfall prüfen.' },
  { key: 'arrestprosekution', phase: 'besondere', label: 'Arrestprosekution – 10 Tage', norm: 'Art. 279 SchKG i.V.m. ZPO',
    einheit: 'tage', laenge: 10, verfahren: 'summarisch', fristnatur: 'gesetzlich',
    hinweis: 'Schnittstelle SchKG: Betreibungs-/SchKG-Ferien gesondert prüfen.' },

  // ── Schiedsverfahren ──
  // RL-07/F1-01 (Prüfung Rechtslogik 23.9.2026, schwer): rechnete mit der
  // ZPO-Engine → Feiertage am Gerichtsort (BGer = VD). Beleg: 21.8.2026 + 30 T,
  // Vertretung ZH → Ist 22.9.2026 (Bettagsmontag VD), Soll 21.9.2026 nach
  // Art. 45 Abs. 2 BGG (Fedlex SR 173.110, Konsolidierung 1.4.2026). Jetzt
  // engine 'bgg': Rechnung über berechneBggVwvgFrist({ regime: 'bgg' }).
  { key: 'schied_bger', phase: 'schied', label: 'Beschwerde ans Bundesgericht – 30 Tage', norm: 'Art. 389 ZPO / Art. 100 BGG',
    einheit: 'tage', laenge: 30, verfahren: 'ordentlich', fristnatur: 'gesetzlich', engine: 'bgg',
    hinweis: 'Richtet sich nach dem BGG (Art. 389 ZPO, Art. 77 BGG) und wird nach Art. 44–46 BGG gerechnet: Feiertage am Wohnsitz/Sitz der Partei oder ihrer Vertretung (Art. 45 Abs. 2 BGG), nicht am Gerichtsort; Stillstand nach Art. 46 BGG (Ausnahmen Abs. 2). Zulässigkeit und Rügen im BGer-Rechtsweg-Rechner prüfen.' },
];

export const MATERIELL_WARNUNG =
  'Materielle Klage-, Verjährungs- und Verwirkungsfristen des Bundeszivilrechts (z.B. Art. 75 ZGB, ' +
  'Art. 521/533 ZGB, Art. 706a OR) werden von diesem Rechner NICHT erfasst. Sie unterliegen nicht dem ' +
  'Fristenstillstand der ZPO und werden durch Rechtshängigkeit gewahrt (Art. 64 Abs. 2 ZPO; BGE 140 III 561).';
