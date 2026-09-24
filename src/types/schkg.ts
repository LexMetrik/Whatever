import type { Kanton, Berechnungsergebnis } from './legal';

// ─── SchKG-Fristenrechner: Typen (Art. 31, 56, 63 SchKG; Art. 145 ZPO) ────

// Stillstand-Regime pro Frist (Konzept Abschnitt C – «Stillstand-Schalter»):
//   schkg_betreibungsferien – Betreibungshandlungen: kein Ruhen, nur
//                             Verlängerung um 3 Werktage (Art. 63 SchKG).
//   zpo_stillstand          – gerichtliche SchKG-Klagen ab 1.1.2025: ZPO-Ruhen
//                             (Art. 56 Abs. 2 SchKG / Art. 145 Abs. 4 ZPO).
//   kein                    – Konkurseingaben/Ordnungsfristen: kein Stillstand.
//   schkg_wechsel           – Wechselbetreibung (RL-19 / F2-05): keine
//                             Betreibungsferien (Art. 56 Abs. 1 Ziff. 2 SchKG),
//                             aber Rechtsstillstand mit Art. 63 SchKG (Ziff. 3).
export type SchkgModus = 'schkg_betreibungsferien' | 'zpo_stillstand' | 'kein' | 'schkg_wechsel';

// Rechtsgrundlage des Fristenstillstands während eines durch den
// Rechtsvorschlag veranlassten Verfahrens (RL-19 / F2-06). Ohne Angabe gilt
// der Bestand «Art. 88 Abs. 2 / Art. 166 Abs. 2 SchKG».
//   art154 – Pfandverwertung: «diese Fristen» (frühestens UND spätestens)
//            stehen während des gerichtlichen Verfahrens still.
//   art188 – Wechselbetreibung: zwei Zeiträume (Eingabe Rechtsvorschlag bis
//            Bewilligungsentscheid; bei Bewilligung Klageanhebung bis Erledigung).
export type SchkgHemmungNorm = 'art154' | 'art188';

// Rechtsnatur der Frist (steuert Anzeige, Farbe und Warnhinweise).
export type SchkgFristnatur =
  | 'verwirkung'      // nicht erstreckbar/wiederherstellbar (rot)
  | 'wartefrist'      // «frühestens»-Datum, Handlung vorher unzulässig (gelb)
  | 'beschwerdefrist'
  | 'klagefrist'
  | 'ordnungsfrist'   // blosse Ordnungsvorschrift (grau)
  | 'frist';

export type SchkgEinheit = 'tage' | 'monate' | 'jahre';

export type SchkgFristSpec = { einheit: SchkgEinheit; laenge: number };

export type SchkgInput = {
  ereignis: string;          // yyyy-MM-dd, auslösendes Ereignis / Zustellung
  einheit: SchkgEinheit;
  laenge: number;            // > 0
  modus: SchkgModus;
  fristnatur: SchkgFristnatur;
  kanton: Kanton;            // staatlich anerkannte Feiertage (Art. 31 i.V.m. 142 III ZPO)
  ausloeser?: string;        // textuelle Bezeichnung des auslösenden Ereignisses

  // Hemmung einer Verwirkungsfrist während eines rechtsvorschlagsbedingten
  // Gerichts-/Verwaltungsverfahrens (Art. 88 Abs. 2 / Art. 166 Abs. 2 SchKG):
  // echtes Ruhen der Frist im Fenster [hemmungVon, hemmungBis].
  hemmungVon?: string;
  hemmungBis?: string;
  // RL-19 / F2-06: zweiter Stillstands-Zeitraum (Art. 188 Abs. 2 Satz 2 SchKG:
  // Anhebung bis Erledigung der Klage nach bewilligtem Rechtsvorschlag) und
  // die Norm, die den Stillstand trägt (Text, Normverweis).
  hemmung2Von?: string;
  hemmung2Bis?: string;
  hemmungNorm?: SchkgHemmungNorm;

  // Schuldnerbezogener Rechtsstillstand (Art. 57–62 SchKG): wird für die
  // Endregel wie eine Betreibungsferien-Periode behandelt (Art. 63 SchKG).
  rechtsstillstandVon?: string;
  rechtsstillstandBis?: string;

  // Manueller Override des Stillstand-Regimes – für die in Lehre/Rechtsprechung
  // umstrittenen Summarsachen nach Art. 251 ZPO (Rechtsöffnung/Konkurs/Arrest/
  // Nachlass). Überschreibt `modus`, wenn gesetzt.
  modusOverride?: SchkgModus;
};

// Erweitert das gemeinsame Ergebnis um SchKG-spezifische Eckdaten.
export type SchkgErgebnis = Berechnungsergebnis & {
  massgeblicherEreignistag: string; // dd.MM.yyyy
  diesAQuo: string;                 // Beginn des Fristenlaufs
  diesAdQuem: string;               // Fristende
  ereignisISO: string;
  diesAQuoISO: string;
  diesAdQuemISO: string;
  modusAktiv: SchkgModus;           // tatsächlich angewandtes Regime (nach Override)
  ruhenAnzeige: boolean;            // für die Kalender-Visualisierung (nur bei Ruhen)
  // Benannte Fristbeginn-Norm (statt fragilem normverweise[1], FAHRPLAN-
  // BEGRUENDUNGS-ABSATZ B1-1): «Art. 31 SchKG i.V.m. …».
  fristbeginnNorm: string;
};
