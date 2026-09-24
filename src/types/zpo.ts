import type { Kanton, Berechnungsergebnis } from './legal';

// ─── ZPO-Fristenrechner: Typen (Art. 142–147 ZPO) ─────────────────────────

export type ZpoEinheit = 'tage' | 'wochen' | 'monate' | 'jahre';

export type ZpoVerfahren =
  | 'ordentlich'
  | 'vereinfacht'
  | 'familienrecht'
  | 'klagefrist_klagebewilligung'
  | 'schlichtung'
  | 'summarisch'
  | 'rechtsmittel_summarisch';

export type ZpoFristnatur = 'gesetzlich' | 'gerichtlich';

export type ZpoZustellart = 'empfangsbestaetigung' | 'gewoehnliche_post';

// Berechnungsmodus für Wochen-/Monats-/Jahresfristen (Ziff. 7.3) [UMSTRITTEN]
export type ZpoModus = 'bundesgericht' | 'mindermeinung';

type ZpoErstreckung = {
  einheit: 'tage' | 'wochen';
  laenge: number;
};

export type ZpoInput = {
  ereignis: string;            // yyyy-MM-dd, auslösendes Ereignis / Zustellung
  einheit: ZpoEinheit;
  laenge: number;              // > 0
  verfahren: ZpoVerfahren;
  kanton: Kanton;              // Gerichtsort (Sitz des Gerichts), Art. 142 Abs. 3
  fristnatur: ZpoFristnatur;
  zustellart?: ZpoZustellart;  // optional, Art. 142 Abs. 1bis
  modus?: ZpoModus;            // optional, default 'bundesgericht'
  erstreckung?: ZpoErstreckung; // optional, Ziff. 7.5 (nur gerichtliche Fristen)
  // Art. 145 Abs. 3 ZPO (Gültigkeitsvorschrift, BGE 139 III 78): Hat das Gericht im
  // Schlichtungs-/summarischen Verfahren auf die Nichtgeltung des Stillstands hingewiesen?
  // Fehlt der Hinweis (false), gilt der Stillstand gleichwohl. Default true.
  gerichtshinweisStillstand?: boolean;
  // RL-20/F1-04 (Prüfung Rechtslogik 23.9.2026): Frist, die nicht vom Gericht
  // in einem Schlichtungs-/summarischen Verfahren eröffnet wird (Preset
  // «Arrestprosekution», Art. 279 SchKG). Die Hinweis-Regel nach Art. 145
  // Abs. 3 ZPO (BGE 139 III 78) wird dann nicht angewandt: kein «Stillstand
  // gleichwohl», gerechnet ohne Stillstand (sichere Seite). Default false.
  hinweispflichtEntfaellt?: boolean;
};

// Erweitert das gemeinsame Ergebnis um die ZPO-spezifischen Eckdaten.
export type ZpoErgebnis = Berechnungsergebnis & {
  massgeblicherEreignistag: string; // dd.MM.yyyy
  diesAQuo: string;                 // Beginn des Fristenlaufs
  diesAdQuem: string;               // Fristende (24.00 Uhr)
  erstrecktBis?: string;            // optional, bei Erstreckung
  // ISO-Daten + Kontext für die Kalender-Visualisierung
  ereignisISO: string;
  diesAQuoISO: string;
  diesAdQuemISO: string;
  stillstandAktiv: boolean;
  // Benannte Fristbeginn-Norm (statt fragilem normverweise[0], FAHRPLAN-
  // BEGRUENDUNGS-ABSATZ B1-1): die Norm, auf der der Fristbeginn beruht.
  fristbeginnNorm: string;
};
