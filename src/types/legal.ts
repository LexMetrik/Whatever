// ─── Core legal type system ───────────────────────────────────────────────

export type Normverweis = {
  artikel: string;
  bemerkung?: string;
  /** Direkter amtlicher Link — für KANTONALE Erlasse/Verordnungen (die die
   *  zentrale normLinks-Registry nicht kennt). Hat Vorrang vor normLink();
   *  fehlt er, greift normLink (Bundeserlasse via Fedlex). */
  url?: string;
};

export type Rechtsprechungshinweis = {
  aktenzeichen: string;
  aussage: string;
  verifiziert: boolean;
};

export type Rechenschritt = {
  beschreibung: string;
  zwischenergebnis: string;
  normen: Normverweis[];
  rechtsprechung?: Rechtsprechungshinweis[];
};

export type BerechnungsStatus =
  | 'ok'
  | 'nichtig'
  | 'kein_anspruch'
  | 'unzulaessig'
  | 'ktg_regime';

export type Berechnungsergebnis = {
  ergebnis: string;
  status: BerechnungsStatus;
  rechenweg: Rechenschritt[];
  annahmen: string[];
  warnungen: string[];
  normverweise: Normverweis[];
};

// ─── Module A: Lohnfortzahlung ────────────────────────────────────────────

export type Kanton =
  | 'AG' | 'AI' | 'AR' | 'BE' | 'BL' | 'BS' | 'FR' | 'GE' | 'GL'
  | 'GR' | 'JU' | 'LU' | 'NE' | 'NW' | 'OW' | 'SG' | 'SH' | 'SO'
  | 'SZ' | 'TG' | 'TI' | 'UR' | 'VD' | 'VS' | 'ZG' | 'ZH';

// KTG-Gleichwertigkeits-Kriterien (Art. 324a Abs. 4 OR, SHK N 61–62) – §2.6
export type KtgKriterien = {
  taggeldProzent?: number;                    // z.B. 80 (% des Lohnes)
  leistungsdauerTage?: number;                // z.B. 720/730
  karenzTage?: number;                        // max. 3 Tage zulässig
  praemienAnteilArbeitgeberProzent?: number;  // mind. 50 %
  alleRisikenAbgedeckt?: boolean;
  schriftlichVereinbart?: boolean;            // Gültigkeitsvoraussetzung (Art. 324a Abs. 4 OR)
};

// Verhinderungsgrund (Art. 324a Abs. 1 / Art. 324b OR) – steuert die Koordination
// mit obligatorischen Versicherungen.
export type Verhinderungsgrund =
  | 'krankheit'        // 324a (ohne obligat. Versicherung; ausser gleichwertige KTG Abs. 4)
  | 'unfall'           // 324b / UVG: 80% ab 3. Tag, AG trägt 2 Karenztage
  | 'schwangerschaft'  // 324a Abs. 3 (gleicher Umfang); nach Niederkunft EOG
  | 'dienst'           // 324b / EO: Militär-/Zivil-/Schutzdienst
  | 'amt'              // öffentliches Amt; Entschädigung anrechenbar
  | 'uebrige';         // übrige persönliche Gründe (Art. 329 Abs. 3 OR)

export type LohnfortzahlungInput = {
  vertragsbeginn: string;           // yyyy-MM-dd (= tatsächliche Arbeitsaufnahme)
  verhinderungBeginn: string;       // yyyy-MM-dd (Stichtag A)
  verhinderungsgrund?: Verhinderungsgrund; // default 'krankheit'
  verhinderungEnde?: string;        // yyyy-MM-dd, optional – für DJ-übergreifende Verhinderung (§2.1)
  arbeitsunfaehigkeitProzent: number; // 1–100, bezogen auf die geschuldete Arbeitsleistung
  pensumProzent?: number;           // Beschäftigungsgrad 1–100 (§2.3), default 100
  kanton: Kanton;
  ktgGleichwertigVorhanden: boolean;
  ktgKriterien?: KtgKriterien;      // §2.6 Gleichwertigkeits-Checkliste
  monatslohnBrutto?: number;
  dreizehnterMonatslohn?: boolean;  // §2.7 13. Monatslohn (anteilig) berücksichtigen
  befristetFest?: boolean;          // §2.2 befristeter Vertrag fester Dauer
  vereinbarteKuendigungsfristMonate?: number; // §2.2 (unbefristet)
  anrechenbareVordienstzeitMonate?: number;   // §2.2 SHK N 44 (Lehre, Praktikum, Folge-Befristungen)
  bereitsBezogeneTageImDienstjahr?: number;   // B3-Fix 10.6.2026 (SHK N 52): frühere Absenzen im selben DJ verbrauchen das Kontingent
  arbeitsverhaeltnisEnde?: string;            // B4-Fix 10.6.2026 (SHK N 55, BGE 127 III 318): Pflicht endet mit dem AV
};

// ─── Module B: Kündigungsfrist ────────────────────────────────────────────

type KuendigungsPartei = 'arbeitgeber' | 'arbeitnehmer';

export type KuendigungsfristInput = {
  vertragsbeginn: string;           // yyyy-MM-dd
  zugangKuendigung: string;         // yyyy-MM-dd (Stichtag B)
  kuendigendePartei: KuendigungsPartei;
  probezeitMonate: number;          // 0–3, default 1
  abweichendeFristMonate?: number;
  abweichendeFristFormGueltig?: boolean; // §3.2 schriftlich / GAV / NAV (Gültigkeitsvoraussetzung)
  abweichendeFristQuelleGAV?: boolean;   // §3.2 für Verkürzung < 1 Monat im 1. DJ
  kuendigungsterminMonatsende: boolean; // default true
  vaterschaftsurlaubResttage?: number;   // §3.4 Art. 335c Abs. 3 OR (nur Arbeitgeberkündigung)
  // RL-16b (W-08 b): Arbeitstage der Woche für die Probezeitverlängerung
  // (Art. 335b Abs. 3 OR, BGE 148 III 126) — Wochentage nach date-fns getDay
  // (0 = So … 6 = Sa); fehlt/ungültig → Mo–Fr mit Warnung.
  arbeitstageWoche?: number[];
};

// ─── Module C: Sperrfristen ───────────────────────────────────────────────

export type SperrereignisTyp =
  | 'krankheit_unfall'
  | 'schwangerschaft'
  | 'militaer_zivil'
  | 'hilfsaktion'
  | 'betreuungsurlaub'
  // Ergänzung 6.6.2026 (Audit-Befund B1) — eingefügte Tatbestände der BG vom
  // 18.12.2020 bzw. 17.3.2023, Wortlaute am OR-Cache (Stand 20260101) verifiziert:
  | 'mutterschaftsurlaub_verlaengert' // lit. cbis: Hospitalisierung Neugeborenes, Art. 329f Abs. 2 OR
  | 'zusatzurlaub_tod_elternteil'     // lit. cter: Urlaub der Mutter nach Tod des anderen Elternteils, Art. 329f Abs. 3 OR
  | 'urlaub_tod_mutter';              // lit. cquinquies: Urlaub des anderen Elternteils nach Tod der Mutter, Art. 329gbis OR

export type Sperrereignis = {
  typ: SperrereignisTyp;
  von: string; // yyyy-MM-dd
  bis: string; // yyyy-MM-dd
  // §1.3 Rückfall: Index (0-basiert) eines früheren krankheit_unfall-Ereignisses mit
  // DERSELBEN Ursache. Gesetzt → kein neues Kontingent; Schutz aus dem REST des
  // Kontingents des Ursprungsereignisses (RL-13/W-04, 24.9.2026; BGE 120 II 124
  // «aucun lien» betrifft nur unabhängige Ereignisse — Lesart offengelegt).
  // Nur bei typ 'krankheit_unfall' wirksam (lib/sperrfristen.ts).
  gleicheUrsacheWieEreignis?: number | null;
  // Niederkunftsdatum (optional, Audit-Befund B10): bei 'schwangerschaft' rechnet
  // die Engine das Sperrfristende deterministisch (Niederkunft + 112 Tage, lit. c)
  // statt die Nutzereingabe «bis» zu übernehmen; bei 'zusatzurlaub_tod_elternteil'
  // steuert es die Kappung «längstens drei Monate ab Ende der Sperrfrist nach lit. c».
  niederkunft?: string; // yyyy-MM-dd
};

export type SperrfristenInput = KuendigungsfristInput & {
  sperrereignisse?: Sperrereignis[];
};

// ─── Combined module ──────────────────────────────────────────────────────

export type ArbeitsrechtInput = SperrfristenInput & {
  verhinderungBeginn?: string;
  arbeitsunfaehigkeitProzent?: number;
  kanton?: Kanton;
  ktgGleichwertigVorhanden?: boolean;
  monatslohnBrutto?: number;
};


// ─── Scale table types ────────────────────────────────────────────────────

export type SkalaDauer =
  | { typ: 'wochen'; anzahl: number }
  | { typ: 'monate'; anzahl: number }
  | { typ: 'tage'; anzahl: number };

// knip meldet SkalaEintrag als «unused exported type» — FALSCH-POSITIV, nicht
// entfernen. Der Typ wird in src/data/lohnfortzahlungSkalen.ts:88 als INLINE-
// Import verwendet (`import('../types/legal').SkalaEintrag`); knip löst diese
// Form nicht auf. Zusätzlich referenziert ihn Skala.eintraege unten.
// Belegt 3.8.2026 per `grep -rnE "\bSkalaEintrag\b" src/`.
/**
 * @inlinetyp check:sediment (d) (W2·29-WERKBANK-EXPORTE, 22.9.2026) griff
 * denselben Fehlalarm erneut auf; Tag-Ausnahme `tags: ["-inlinetyp"]` in
 * knip.json macht ihn für knip dauerhaft unsichtbar statt bei jedem Lauf neu
 * aufzufallen.
 */
export type SkalaEintrag = {
  dienstjahrVon: number;
  dienstjahrBis: number | null; // null = unbeschränkt
  dauer: SkalaDauer;
};

export type Skala = {
  name: string;
  kantone: Kanton[];
  eintraege: SkalaEintrag[];
  quellenhinweis: string;
};
