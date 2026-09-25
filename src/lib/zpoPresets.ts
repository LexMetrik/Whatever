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
  /** RL-20/F1-04 (Prüfung Rechtslogik 23.9.2026): Frist wird nicht vom
   *  Gericht im Verfahren eröffnet → die Hinweis-Regel nach Art. 145 Abs. 3
   *  ZPO (BGE 139 III 78) passt nicht; das Formular reicht das Merkmal als
   *  `hinweispflichtEntfaellt` an die Engine und blendet die Checkbox aus. */
  hinweispflichtEntfaellt?: true;
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
    hinweis: 'Gesetzlich, nicht erstreckbar – keine «Fristabnahme» (BGE 141 III 554). Gilt so im ordentlichen/vereinfachten Verfahren (mit Stillstand). Gegen einen im summarischen Verfahren ergangenen Entscheid: 10 Tage ohne Stillstand (Art. 314 Abs. 1, Art. 145 Abs. 2 lit. b ZPO) – Preset «Berufungsantwort gegen Summarentscheid» wählen; familienrechtliche Summarsachen (Art. 271/276/302/305): 30 Tage (Art. 314 Abs. 2).' },
  // RL-20/R5-01 (Prüfung Rechtslogik 23.9.2026, mittel): Art. 314 Abs. 1 ZPO
  // (Fedlex SR 272, Konsolidierung 1.7.2026) — «je zehn Tage» für Berufung
  // UND Berufungsantwort gegen Summarentscheide; kein Stillstand auch im
  // Berufungsverfahren (BGE 139 III 78 E. 4). Beleg: Zustellung 10.7.2026
  // → 20.7.2026 (Ist mit Preset «Berufungsantwort» 10.9.2026).
  { key: 'berufungsantwort_summar', phase: 'rechtsmittel', label: 'Berufungsantwort gegen Summarentscheid – 10 Tage', norm: 'Art. 314 Abs. 1 ZPO',
    einheit: 'tage', laenge: 10, verfahren: 'rechtsmittel_summarisch', fristnatur: 'gesetzlich',
    hinweis: 'Kein Stillstand (summarisch, gilt auch im Berufungsverfahren, BGE 139 III 78) – Hinweis des Gerichts beachten. Anschlussberufung unzulässig (Art. 314 Abs. 1 Satz 2 ZPO). Familienrechtliche Summarsachen (Art. 271/276/302/305): 30 Tage (Art. 314 Abs. 2).' },
  { key: 'anschlussberufung', phase: 'rechtsmittel', label: 'Anschlussberufung – 30 Tage', norm: 'Art. 313 Abs. 1 ZPO',
    einheit: 'tage', laenge: 30, verfahren: 'ordentlich', fristnatur: 'gesetzlich',
    hinweis: 'Innert der Berufungsantwortfrist. Gegen einen im summarischen Verfahren ergangenen Entscheid unzulässig (Art. 314 Abs. 1 Satz 2 ZPO; Ausnahme familienrechtliche Summarsachen, Abs. 2).' },
  { key: 'beschwerde', phase: 'rechtsmittel', label: 'Beschwerde (begründeter Entscheid) – 30 Tage', norm: 'Art. 321 Abs. 1 ZPO',
    einheit: 'tage', laenge: 30, verfahren: 'ordentlich', fristnatur: 'gesetzlich' },
  { key: 'beschwerde_summar', phase: 'rechtsmittel', label: 'Beschwerde gegen Summarentscheid – 10 Tage', norm: 'Art. 321 Abs. 2 ZPO',
    einheit: 'tage', laenge: 10, verfahren: 'rechtsmittel_summarisch', fristnatur: 'gesetzlich',
    hinweis: 'Kein Stillstand, wenn der Entscheid im summarischen Verfahren erging (Art. 145 Abs. 2 lit. b ZPO). 10 Tage gelten auch für prozessleitende Verfügungen und andere erstinstanzliche Entscheide (Art. 321 Abs. 2): ergehen sie in einem ordentlichen oder vereinfachten Verfahren, ist die Ausnahme nicht einschlägig und der Stillstand gilt (Art. 145 Abs. 1 ZPO) – dann Verfahrensart umstellen. Ohne Stillstand gerechnet liegt das Datum auf der sicheren Seite.' },
  { key: 'revision', phase: 'rechtsmittel', label: 'Revision – 90 Tage (relativ)', norm: 'Art. 329 Abs. 1 ZPO',
    einheit: 'tage', laenge: 90, verfahren: 'ordentlich', fristnatur: 'gesetzlich',
    hinweis: 'Ab Entdeckung des Revisionsgrundes. Absolute Frist: 10 Jahre ab Rechtskraft (Art. 329 Abs. 2). Gerechnet mit Stillstand (ordentliches/vereinfachtes Verfahren). Ob er bei der Revision eines im summarischen Verfahren ergangenen Entscheids entfällt (Art. 145 Abs. 2 lit. b ZPO), ist nicht geklärt – sicherer Weg: Verfahrensart «summarisch» wählen.' },

  // ── Schlichtung ──
  // Bug-Check 10.6.2026 (HOCH, deklarierte fachliche Änderung): Die Art.-209-
  // Klagefristen gehören zum GERICHTLICHEN Verfahren — Stillstand gilt
  // (BGE 138 III 615 E. 2.4; eigener Engine-Zweig klagefrist_klagebewilligung,
  // identisch gerechnet in vorlagen/klageVereinfacht.ts). Vorher verfahren
  // 'schlichtung' → Frist ohne Stillstand bis 1 Monat zu früh angezeigt.
  { key: 'klagebewilligung', phase: 'schlichtung', label: 'Gültigkeit Klagebewilligung – 3 Monate', norm: 'Art. 209 Abs. 3 ZPO',
    einheit: 'monate', laenge: 3, verfahren: 'klagefrist_klagebewilligung', fristnatur: 'gesetzlich',
    hinweis: 'Ab Zustellung/Eröffnung. Stillstand gilt (BGE 138 III 615: die Klagefrist nach Art. 209 Abs. 3 und 4 ZPO steht während der Gerichtsferien still).' },
  { key: 'klagefrist_miete', phase: 'schlichtung', label: 'Klagefrist Miete/Pacht – 30 Tage', norm: 'Art. 209 Abs. 4 ZPO',
    einheit: 'tage', laenge: 30, verfahren: 'klagefrist_klagebewilligung', fristnatur: 'gesetzlich',
    hinweis: 'Wohn-/Geschäftsräume und landw. Pacht. Ab Zustellung der Klagebewilligung. Stillstand gilt (BGE 138 III 615).' },
  { key: 'entscheidvorschlag', phase: 'schlichtung', label: 'Ablehnung Entscheidvorschlag – 20 Tage', norm: 'Art. 211 Abs. 1 ZPO',
    einheit: 'tage', laenge: 20, verfahren: 'ordentlich', fristnatur: 'gesetzlich',
    hinweis: 'Hier ist der Fristenstillstand zu berücksichtigen (BGE 144 III 404; Ausnahme für Schlichtung gilt nicht).' },

  // ── Erstinstanz ──
  { key: 'begruendung', phase: 'erstinstanz', label: 'Begründung verlangen – 10 Tage', norm: 'Art. 239 Abs. 2 ZPO',
    einheit: 'tage', laenge: 10, verfahren: 'ordentlich', fristnatur: 'gesetzlich',
    hinweis: 'Ab Eröffnung des Dispositivs; sonst gilt das Rechtsmittel als verzichtet. Gilt so im ordentlichen/vereinfachten Verfahren (mit Stillstand). Bei einem Entscheid im summarischen Verfahren gilt kein Stillstand (Art. 145 Abs. 2 lit. b ZPO) – Verfahrensart auf «summarisch» umstellen; fehlte der Hinweis des Gerichts (Art. 145 Abs. 3), steht die Frist gleichwohl still (BGE 139 III 78 E. 5).' },
  { key: 'neueinreichung', phase: 'erstinstanz', label: 'Neueinreichung nach Nichteintreten – 1 Monat', norm: 'Art. 63 Abs. 1 ZPO',
    einheit: 'monate', laenge: 1, verfahren: 'ordentlich', fristnatur: 'gesetzlich',
    hinweis: 'Fristwahrend für die Rechtshängigkeit. Gerechnet mit Stillstand (ordentliches/vereinfachtes Verfahren). Ob er gilt, wenn neu bei der Schlichtungsbehörde oder im summarischen Verfahren einzureichen ist (Schlichtung: Art. 145 Abs. 2 lit. a; summarisch: Art. 145 Abs. 2 lit. b ZPO), ist nicht geklärt – sicherer Weg: Verfahrensart ohne Stillstand wählen.' },
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
  // RL-17 / Befund R5-02 (V14, Etikett und Hinweis; Rechnung unverändert):
  // Art. 279 Abs. 1 SchKG kennt zwei Wege. Dieses Preset ist der KLAGEweg:
  // Für Klagen nach dem SchKG vor Gericht gelten seit 1.1.2025
  // «ausschliesslich» die ZPO-Stillstandsregeln (Art. 56 Abs. 2 SchKG, SR 281.1
  // Fassung 1.1.2026; Art. 145 Abs. 4 Satz 1 ZPO, SR 272 Fassung 1.7.2026) —
  // der frühere Hinweis «Betreibungs-/SchKG-Ferien gesondert prüfen» widersprach
  // dem. Gerechnet wird ohne Stillstand (verfahren 'summarisch'): Norm-Beleg
  // für «kein Stillstand» ist Art. 145 Abs. 2 ZPO — lit. a (Schlichtungs-
  // verfahren; die Klage wird i.d.R. mit dem Schlichtungsgesuch eingeleitet,
  // Art. 197/62 Abs. 1 ZPO), lit. b (summarisches Verfahren). Ob für die
  // Prosequierungsklage im ordentlichen/vereinfachten Verfahren der Stillstand
  // nach Art. 145 Abs. 1 ZPO gilt, ist zum neuen Recht nicht höchstrichterlich
  // geklärt (V14: keine Rechtsprechung gefunden) → das Datum ohne Stillstand ist
  // das frühere, sichere. `hinweispflichtEntfaellt` (RL-20/F1-04) bleibt.
  // Der Betreibungsweg steht im SchKG-Rechner (schkgPresets 'arrestprosekution').
  { key: 'arrestprosekution', phase: 'besondere', label: 'Arrestprosekution durch Klage – 10 Tage', norm: 'Art. 279 Abs. 1 SchKG i.V.m. Art. 56 Abs. 2 SchKG',
    einheit: 'tage', laenge: 10, verfahren: 'summarisch', fristnatur: 'gesetzlich', hinweispflichtEntfaellt: true,
    hinweis: 'Klageweg: Für die Prosequierungsklage gelten seit 1.1.2025 ausschliesslich die Stillstandsregeln der ZPO (Art. 56 Abs. 2 SchKG, Art. 145 Abs. 4 ZPO) — keine Betreibungsferien, keine Verlängerung nach Art. 63 SchKG. Gerechnet ohne Stillstand: Er gilt nicht im Schlichtungsverfahren (Art. 145 Abs. 2 lit. a ZPO), mit dem die Klage in der Regel eingeleitet wird, und nicht im summarischen Verfahren (lit. b); ob er für die Klage im ordentlichen oder vereinfachten Verfahren gilt, ist zum neuen Recht nicht geklärt — das Datum ohne Stillstand ist das frühere, sichere. Prosequierung durch Betreibungsbegehren: SchKG-Fristenrechner (Betreibungsferien, Art. 63 SchKG).' },

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
