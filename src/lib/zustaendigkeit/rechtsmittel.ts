// ─── Zuständigkeits-Engine (ZPO/BGG) — Rechtsmittelzug ──────────────────────
//
// `bestimmeRechtsmittel` + Berichts-Mapper. Eigenständige Prüfung neben der
// erstinstanzlichen Zuständigkeit in `./erstinstanz`; geteilt wird nur die
// fachneutrale Grundlage aus `./gemeinsam` (CLAUDE.md §4).

import type { Berechnungsergebnis, Normverweis, Rechenschritt } from '../../types/legal';
import { bgerAbteilungZivil, BGER_SCHWELLEN, type BgerZivilgebiet } from '../bgerRechtsweg';
import {
  ZPO_SCHWELLEN, ungueltig,
  type Streitsache, type ZustaendigkeitInput,
} from './gemeinsam';

// ─── Rechtsmittel: obere Instanzen (Ausbau, Anordnung David 5.6.2026) ────────
//
// Bundesrechtliche Rechtsmittel-Weiche für erstinstanzliche Zivilentscheide.
// Wortlaut-verifiziert am Fedlex-Cache (5.6.2026):
//   Art. 308 Abs. 2 ZPO — Berufung in vermögensrechtlichen Angelegenheiten
//   nur ab Streitwert 10 000 (zuletzt aufrechterhaltene Rechtsbegehren).
//   Art. 319 lit. a ZPO — Beschwerde gegen nicht berufungsfähige Endentscheide.
//   Art. 74 BGG (SR 173.110, Stand 1.1.2025) — Beschwerde in Zivilsachen:
//   15 000 in arbeits- und mietrechtlichen Fällen, 30 000 übrige; Abs. 2
//   lit. a Rechtsfrage grundsätzlicher Bedeutung, lit. b einzige kantonale
//   Instanz (dann streitwertUNabhängig zulässig).
// Die konkrete obere Instanz je Kanton liefert die Datenschicht
// (src/data/obereInstanzen.ts) — hier nur Bundesrecht (§3).

export const RECHTSMITTEL_SCHWELLEN = {
  /** Art. 308 Abs. 2 ZPO */
  BERUFUNG_MIN: 10_000,
  // BGer-Streitwertgrenzen (Art. 74 Abs. 1 BGG) liegen zentral in
  // bgerRechtsweg.ts (BGER_SCHWELLEN, §5, D-1) — hier nicht zweitdefiniert.
} as const;

/** Konkret aufgelöste Rechtsmittelfrist (eine Ebene). */
interface RechtsmittelFrist {
  /** Fristlänge in Tagen; null = von einer offenen Weiche abhängig. */
  tage: number | null;
  text: string;
  /** Gilt der Fristenstillstand (Art. 145 ZPO bzw. Art. 46 BGG)? */
  stillstand: boolean;
  stillstandText: string;
}

export interface RechtsmittelErgebnis {
  /** Kantonales Rechtsmittel gegen den erstinstanzlichen Endentscheid. */
  kantonal: 'berufung' | 'beschwerde' | 'offen' | 'entfaellt_einzige_instanz';
  kantonalText: string;
  /** Konkret aufgelöste kantonale Frist — null, wenn das kantonale Rechtsmittel entfällt. */
  kantonalFrist: RechtsmittelFrist | null;
  /** Beschwerde in Zivilsachen ans Bundesgericht. */
  bger: 'zulaessig' | 'schwelle_verfehlt' | 'offen';
  bgerText: string;
  /** BGer-Frist (Art. 100 Abs. 1 BGG) inkl. Stillstands-Auflösung (Art. 46). */
  bgerFrist: RechtsmittelFrist;
  /** Offene Rechtsfragen-Weichen (Art. 319 lit. b ZPO; Art. 92/93 BGG) — §8. */
  weichen: string[];
  /** Kognitions-/Rügen-Hinweise (z. B. Art. 98 BGG bei vorsorglichen Massnahmen). */
  kognitionHinweis: string | null;
  /** Zuständige BGer-Abteilung nach Geschäftsverteilung (Art. 33/34 BGerR;
   *  B.5a, 11.6.2026 — Regel lebt in lib/bgerRechtsweg.ts, §5). */
  bgerAbteilung: string;
  fristHinweis: string;
  normverweise: Normverweis[];
}

// BGer-Abteilung (B.5a, 11.6.2026): Zuteilung nach Rechtsgebiet, Art. 33/34
// BGerR — gilt für die ordentliche Beschwerde UND die subsidiäre
// Verfassungsbeschwerde (Wortlaut beider Artikel). Die Streitsachen des
// Katalogs sind Schuldrecht-/Haftpflicht-Materien der I. Abteilung bzw.
// ZGB-Materien der II.; «geldforderung» meint die vertragliche Forderung
// (Schuldrecht). Regel zentral in lib/bgerRechtsweg.ts (§5); exportiert für
// die Prefill-Brücke des Rechtsmittel-Fahrplans in den BGer-Rechner.
const STREITSACHE_GEBIET: Record<Streitsache, BgerZivilgebiet> = {
  geldforderung: 'schuldrecht', miete_wohn_geschaeft: 'miete', arbeit: 'arbeit',
  scheidung: 'familienrecht', erbrecht: 'erbrecht', delikt: 'haftpflicht',
  persoenlichkeit: 'personenrecht', gesellschaft: 'schuldrecht', ip_wettbewerb: 'immaterialgueter',
};

export function bgerGebietFuerStreitsache(s: Streitsache): BgerZivilgebiet {
  return STREITSACHE_GEBIET[s];
}

export function bestimmeRechtsmittel(input: ZustaendigkeitInput): RechtsmittelErgebnis {
  // Gleiche Eingabe-Validierung wie bestimmeZustaendigkeit (Stufe-2-Check
  // 6.6.2026: jetzt wirklich symmetrisch — auch fehlender Streitwert wirft).
  if (input.vermoegensrechtlich && input.streitwertCHF == null) {
    throw new Error('Bei vermögensrechtlichen Streitigkeiten ist der Streitwert erforderlich.');
  }
  if (ungueltig(input.streitwertCHF)) {
    throw new Error('Streitwert muss eine Zahl ≥ 0 sein.');
  }
  const sw = input.vermoegensrechtlich ? input.streitwertCHF : null;
  // Rechtsmittel-Umbau 6.6.2026: Defaults erhalten das bisherige Verhalten.
  const objekt = input.rmObjekt ?? 'endentscheid';
  // Bug-Check 10.6.2026 (HOCH, deklarierte fachliche Änderung): Vorsorgliche
  // Massnahmen ergehen VON GESETZES WEGEN im summarischen Verfahren (Art. 248
  // lit. d ZPO) — Berufungsfrist 10 Tage OHNE Stillstand (Art. 314 Abs. 1 /
  // 145 Abs. 2 lit. b ZPO). Vorher lieferte das Default-Verfahren
  // 'ordentlich_vereinfacht' 30 Tage MIT Stillstand (doppeltes
  // Fristverpassungsrisiko); die BGer-Frist schaltete den Stillstand im
  // selben Resultat bereits korrekt aus (Art. 46 Abs. 2 lit. a BGG).
  const verfahren = objekt === 'vorsorgliche_massnahme'
    ? 'summarisch'
    : (input.rmVerfahren ?? 'ordentlich_vereinfacht');
  const vorinstanz = input.rmVorinstanz ?? 'erstinstanz';
  // Härtung 10.6.2026 (Latenz-Befund 6 Bug-Check 6.6., deklarierte fachliche
  // Änderung): Art. 314 Abs. 2 ZPO setzt eine familienrechtliche Streitigkeit
  // nach Art. 271/276/302/305 ZPO voraus (Wortlaut am Cache verifiziert).
  // Im Streitsachen-Katalog können solche Sachen nur als 'scheidung'
  // (Eheschutz 271 / vorsorgliche Massnahmen 276) oder 'geldforderung'
  // (Unterhalts-/PartG-Geldsachen 302/305) auftreten — bei allen übrigen
  // Streitsachen ist Abs. 2 begrifflich ausgeschlossen: Das Flag wird
  // ignoriert (fristsichere 10 Tage nach Abs. 1) und die Weiche erklärt es.
  const familienPlausibel = input.streitsache === 'scheidung' || input.streitsache === 'geldforderung';
  const familienSummarsache = input.rmFamilienSummarsache === true && verfahren === 'summarisch' && familienPlausibel;
  // Art. 5 ZPO: lit. a–c, e, g–i unbedingt; lit. d (UWG)/f (Bund) NUR über 30 000
  // (H1-Fix 6.6.2026). Bei uwg_oder_bund ≤30k läuft der ordentliche Weg.
  const ipU = input.ipUnterfall ?? 'ip_kartell_firma';
  const istEinzigeInstanzArt5 = input.streitsache === 'ip_wettbewerb'
    && (ipU === 'ip_kartell_firma'
      || (sw !== null && sw > ZPO_SCHWELLEN.VEREINFACHT)
      || (ipU === 'uwg' && input.bundKlagerecht === true));
  // Art. 75 Abs. 2 BGG (Wortlaut-verifiziert): lit. a Bundesgesetz-Einzelinstanz
  // (Art. 5 ZPO) · lit. b Handelsgericht (Art. 6 ZPO) · lit. c Direktklage beim
  // oberen Gericht (Art. 8 ZPO). In allen drei Fällen KEIN kantonales Rechtsmittel.
  const direktAnsBger = istEinzigeInstanzArt5 || vorinstanz !== 'erstinstanz';
  const mietArbeit = input.streitsache === 'arbeit' || input.streitsache === 'miete_wohn_geschaeft';
  const normverweise: Normverweis[] = [];
  const weichen: string[] = [];
  if (objekt === 'vorsorgliche_massnahme' && input.rmVerfahren === 'ordentlich_vereinfacht') {
    weichen.push('Vorsorgliche Massnahmen ergehen von Gesetzes wegen im SUMMARISCHEN Verfahren (Art. 248 lit. d ZPO) – die Verfahrens-Angabe «ordentlich/vereinfacht» wurde dafür übersteuert; massgeblich sind 10 Tage ohne Fristenstillstand (Art. 314 Abs. 1 / Art. 145 Abs. 2 lit. b ZPO).');
  }
  if (input.rmFamilienSummarsache === true && verfahren === 'summarisch' && !familienPlausibel) {
    weichen.push('Die 30-Tage-Berufungsfrist für familienrechtliche Summarsachen (Art. 314 Abs. 2 ZPO) setzt eine Streitigkeit nach Art. 271/276/302/305 ZPO voraus. Mit der gewählten Streitsache bildet der Katalog eine solche Sache nicht ab – gerechnet wird fristsicher mit 10 Tagen (Art. 314 Abs. 1 ZPO). Liegt tatsächlich eine Sache nach Art. 302/305 ZPO vor (z. B. HKÜ-Rückführung, Schutzmassnahmen der eingetragenen Partnerschaft), gilt die 30-Tage-Frist – im Einzelfall prüfen.');
  }

  // ── Kantonale Ebene: statthaftes Rechtsmittel (Art. 308/319 ZPO) ──────────
  // Art. 308 Abs. 1: berufungsfähig sind End- UND Zwischenentscheide (lit. a)
  // sowie Entscheide über vorsorgliche Massnahmen (lit. b) — die Objekt-Weiche
  // ändert am Berufung/Beschwerde-Schnitt also nichts; prozessleitende
  // Verfügungen sind NIE berufungsfähig (nur Art. 319 lit. b).
  let kantonal: RechtsmittelErgebnis['kantonal'];
  let kantonalText: string;
  if (direktAnsBger) {
    kantonal = 'entfaellt_einzige_instanz';
    kantonalText = istEinzigeInstanzArt5
      ? 'Die einzige kantonale Instanz (Art. 5 ZPO) entscheidet erst- und letztinstanzlich im Kanton — es gibt KEINE kantonale Berufung; nächste Stufe ist direkt das Bundesgericht (Art. 75 Abs. 2 lit. a BGG).'
      : vorinstanz === 'handelsgericht'
        ? 'Das Handelsgericht entscheidet als einzige kantonale Instanz (Art. 6 ZPO) — KEIN kantonales Rechtsmittel; nächste Stufe ist direkt das Bundesgericht (Art. 75 Abs. 2 lit. b BGG).'
        : 'Bei der Direktklage beim oberen Gericht (Art. 8 ZPO) entscheidet dieses als einzige kantonale Instanz — KEIN kantonales Rechtsmittel; nächste Stufe ist direkt das Bundesgericht (Art. 75 Abs. 2 lit. c BGG).';
    normverweise.push(
      istEinzigeInstanzArt5 ? { artikel: 'Art. 5 ZPO' } : vorinstanz === 'handelsgericht' ? { artikel: 'Art. 6 ZPO' } : { artikel: 'Art. 8 ZPO' },
      { artikel: 'Art. 75 Abs. 2 BGG' },
    );
  } else if (objekt === 'prozessleitende_verfuegung') {
    kantonal = 'beschwerde';
    kantonalText = 'Prozessleitende Verfügungen sind NICHT berufungsfähig. BESCHWERDE nur in den vom Gesetz bestimmten Fällen oder wenn ein nicht leicht wiedergutzumachender Nachteil droht (Art. 319 lit. b ZPO) — sonst zusammen mit dem Endentscheid anfechten.';
    weichen.push('Offene Rechtsfrage (Art. 319 lit. b ZPO): Liegt ein gesetzlich bestimmter Fall vor ODER droht ein nicht leicht wiedergutzumachender Nachteil? Nur dann ist die Beschwerde jetzt zulässig.');
    normverweise.push({ artikel: 'Art. 319 ZPO' });
  } else if (!input.vermoegensrechtlich) {
    kantonal = 'berufung';
    kantonalText = `Nicht vermögensrechtliche Streitigkeit → BERUFUNG an die obere kantonale Instanz (Art. 308 Abs. 1 ZPO; die 10 000er-Grenze von Abs. 2 gilt nur für vermögensrechtliche Fälle)${objekt === 'vorsorgliche_massnahme' ? ' — Entscheide über vorsorgliche Massnahmen sind nach Art. 308 Abs. 1 lit. b berufungsfähig' : objekt === 'zwischenentscheid' ? ' — Zwischenentscheide sind nach Art. 308 Abs. 1 lit. a berufungsfähig' : ''}.`;
    normverweise.push({ artikel: 'Art. 308 ZPO' });
  } else if (sw === null) {
    kantonal = 'offen';
    kantonalText = `Ohne bezifferten Streitwert nicht bestimmbar: BERUFUNG ab Streitwert CHF ${RECHTSMITTEL_SCHWELLEN.BERUFUNG_MIN.toLocaleString('de-CH')} (zuletzt aufrechterhaltene Rechtsbegehren, Art. 308 Abs. 2 ZPO), darunter BESCHWERDE (Art. 319 lit. a ZPO).`;
    normverweise.push({ artikel: 'Art. 308 Abs. 2 ZPO' }, { artikel: 'Art. 319 ZPO' });
  } else if (sw >= RECHTSMITTEL_SCHWELLEN.BERUFUNG_MIN) {
    kantonal = 'berufung';
    kantonalText = `Streitwert CHF ${sw.toLocaleString('de-CH')} ≥ ${RECHTSMITTEL_SCHWELLEN.BERUFUNG_MIN.toLocaleString('de-CH')} → BERUFUNG an die obere kantonale Instanz (Art. 308 Abs. 2 ZPO). Massgeblich sind die zuletzt aufrechterhaltenen Rechtsbegehren.`;
    normverweise.push({ artikel: 'Art. 308 Abs. 2 ZPO' });
  } else {
    kantonal = 'beschwerde';
    kantonalText = `Streitwert CHF ${sw.toLocaleString('de-CH')} unter ${RECHTSMITTEL_SCHWELLEN.BERUFUNG_MIN.toLocaleString('de-CH')} → keine Berufung; BESCHWERDE an die obere kantonale Instanz (Art. 319 lit. a ZPO; nur Rechtsverletzung und offensichtlich unrichtige Sachverhaltsfeststellung, Art. 320 ZPO).`;
    normverweise.push({ artikel: 'Art. 319 ZPO' }, { artikel: 'Art. 320 ZPO' });
  }

  // ── Kantonale Frist: konkret aufgelöst (Art. 311/314/321 ZPO; Rev. 1.1.2025) ─
  let kantonalFrist: RechtsmittelFrist | null = null;
  if (!direktAnsBger) {
    let tage: number | null;
    let text: string;
    if (objekt === 'prozessleitende_verfuegung') {
      tage = 10;
      text = 'Beschwerdefrist 10 Tage (Art. 321 Abs. 2 ZPO: prozessleitende Verfügungen), sofern das Gesetz nichts anderes bestimmt — ab Zustellung.';
    } else if (verfahren === 'summarisch' && familienSummarsache && kantonal !== 'beschwerde') {
      // K-1-Fix Bug-Check 6.6.2026: Art. 314 Abs. 2 ZPO steht im BERUFUNGS-
      // Abschnitt («…beträgt die Frist zur Einreichung der Berufung…», Wortlaut
      // am Fedlex-Cache verifiziert) und verlängert NUR die Berufungsfrist.
      // Die Beschwerdefrist im summarischen Verfahren bleibt bei 10 Tagen
      // (Art. 321 Abs. 2 ZPO, keine Familien-Ausnahme) — vorher behauptete die
      // Engine hier fälschlich 30 Tage (Fristverpassungs-Risiko).
      tage = 30;
      text = 'Berufungsfrist 30 Tage TROTZ summarischen Verfahrens: familienrechtliche Streitigkeit nach Art. 271/276/302/305 ZPO (Art. 314 Abs. 2, in Kraft seit 1.1.2025; Anschlussberufung zulässig) — ab Zustellung des begründeten Entscheids.';
    } else if (verfahren === 'summarisch') {
      tage = 10;
      text = `Frist 10 Tage: Entscheid aus dem summarischen Verfahren (${kantonal === 'beschwerde' ? 'Art. 321 Abs. 2' : 'Art. 314 Abs. 1'} ZPO; Anschlussberufung unzulässig) — ab Zustellung des begründeten Entscheids.`;
      if (familienSummarsache && kantonal === 'beschwerde') {
        text += ' Die 30-Tage-Ausnahme für familienrechtliche Streitigkeiten (Art. 314 Abs. 2 ZPO) gilt NUR für die Berufung — für die Beschwerde bleibt es bei 10 Tagen.';
      }
    } else if (kantonal === 'offen') {
      tage = 30;
      text = 'Frist 30 Tage ab Zustellung des begründeten Entscheids — für Berufung wie Beschwerde gleich (Art. 311 Abs. 1 / Art. 321 Abs. 1 ZPO).';
    } else {
      tage = 30;
      text = `${kantonal === 'berufung' ? 'Berufungsfrist' : 'Beschwerdefrist'} 30 Tage ab Zustellung des begründeten Entscheids bzw. der nachträglichen Begründung (Art. ${kantonal === 'berufung' ? '311 Abs. 1' : '321 Abs. 1'} ZPO).`;
    }
    // Art. 145 Abs. 1/Abs. 2 lit. b ZPO (Wortlaut-verifiziert): Stillstand gilt
    // NICHT im summarischen Verfahren — auch nicht im Familien-Fall des Art. 314
    // Abs. 2 (dieser ändert nur die Fristlänge, nicht Art. 145).
    const stillstand = verfahren !== 'summarisch';
    kantonalFrist = {
      tage, text, stillstand,
      stillstandText: stillstand
        ? 'Gerichtsferien-Stillstand gilt (Art. 145 Abs. 1 ZPO: Ostern ± 7 Tage · 15.7.–15.8. · 18.12.–2.1.).'
        : 'KEIN Gerichtsferien-Stillstand: summarisches Verfahren (Art. 145 Abs. 2 lit. b ZPO).',
    };
    normverweise.push({ artikel: 'Art. 145 ZPO' });
  }

  // ── Bundesgericht: Zulässigkeit (Art. 74 BGG) ─────────────────────────────
  let bger: RechtsmittelErgebnis['bger'];
  let bgerText: string;
  const bgerSchwelle = mietArbeit ? BGER_SCHWELLEN.MIETE_ARBEIT : BGER_SCHWELLEN.UEBRIGE;
  // Ultra-Review MITTEL (7.6.2026): Auch die Direktklage ans obere Gericht
  // (Art. 8 ZPO) ist eine bundesgesetzlich vorgesehene einzige kantonale
  // Instanz → Art. 74 Abs. 2 lit. b BGG, streitwertUNABHÄNGIG. Zuvor lief
  // sie in den Streitwert-Zweig (bei reduziertem Streitwert sogar falsches
  // «schwelle_verfehlt»; bei sw ≥ Grenze nur falsche Begründung).
  if (istEinzigeInstanzArt5 || vorinstanz === 'handelsgericht' || vorinstanz === 'direktklage_oberes_gericht') {
    bger = 'zulaessig';
    const grund = istEinzigeInstanzArt5
      ? 'ein Bundesgesetz eine einzige kantonale Instanz vorsieht'
      : vorinstanz === 'handelsgericht'
        ? 'das Handelsgericht als einzige kantonale Instanz entschieden hat'
        : 'das obere Gericht auf Direktklage hin als einzige kantonale Instanz entschieden hat (Art. 8 Abs. 2 ZPO)';
    bgerText = `Beschwerde in Zivilsachen ans Bundesgericht streitwertUNABHÄNGIG zulässig, weil ${grund} (Art. 74 Abs. 2 lit. b BGG).`;
    normverweise.push({ artikel: 'Art. 74 Abs. 2 BGG' });
  } else if (!input.vermoegensrechtlich) {
    bger = 'zulaessig';
    bgerText = 'Nicht vermögensrechtliche Angelegenheit: Die Streitwertgrenze von Art. 74 Abs. 1 BGG gilt nicht — Beschwerde in Zivilsachen grundsätzlich zulässig.';
    normverweise.push({ artikel: 'Art. 74 BGG' });
  } else if (sw === null) {
    bger = 'offen';
    bgerText = `Ohne bezifferten Streitwert nicht bestimmbar: Beschwerde in Zivilsachen ab CHF ${bgerSchwelle.toLocaleString('de-CH')} (${mietArbeit ? 'arbeits-/mietrechtlicher Fall, Art. 74 Abs. 1 lit. a' : 'Art. 74 Abs. 1 lit. b'} BGG).`;
    normverweise.push({ artikel: 'Art. 74 Abs. 1 BGG' });
  } else if (sw >= bgerSchwelle) {
    bger = 'zulaessig';
    // RL-42 / Z1-04: Art. 51 Abs. 1 BGG (SR 173.110, Fassung 1.4.2026,
    // Fedlex-Filestore eli/cc/2006/218/20260401, abgerufen 25.9.2026):
    // «a. bei Beschwerden gegen Endentscheide nach den Begehren, die vor der
    // Vorinstanz streitig geblieben waren; … c. bei Beschwerden gegen Vor- und
    // Zwischenentscheide nach den Begehren, die vor der Instanz streitig sind,
    // wo die Hauptsache hängig ist». Vorher stand lit. a für jedes Objekt.
    // Vorsorgliche Massnahmen: je nach Einordnung End- oder Zwischenentscheid
    // — nicht subsumiert, beide Buchstaben offengelegt (§8).
    const streitwertBasis51 = objekt === 'zwischenentscheid' || objekt === 'prozessleitende_verfuegung'
      ? 'Massgeblich sind die Begehren, die vor der Instanz streitig sind, wo die Hauptsache hängig ist (Art. 51 Abs. 1 lit. c BGG — Vor- und Zwischenentscheide).'
      : objekt === 'vorsorgliche_massnahme'
        ? 'Massgeblich sind bei einem Endentscheid die vor der Vorinstanz streitig gebliebenen Begehren (Art. 51 Abs. 1 lit. a BGG), bei einem Vor- oder Zwischenentscheid die Begehren vor der Instanz, wo die Hauptsache hängig ist (lit. c) — Einordnung des Massnahmeentscheids im Einzelfall prüfen.'
        : 'Massgeblich sind die vor der Vorinstanz streitig gebliebenen Begehren (Art. 51 Abs. 1 lit. a BGG).';
    bgerText = `Streitwert CHF ${sw.toLocaleString('de-CH')} ≥ ${bgerSchwelle.toLocaleString('de-CH')} (${mietArbeit ? 'arbeits-/mietrechtlicher Fall' : 'übrige Fälle'}) → Beschwerde in Zivilsachen ans Bundesgericht zulässig (Art. 74 Abs. 1 BGG). ${streitwertBasis51}`;
    normverweise.push({ artikel: 'Art. 74 Abs. 1 BGG' });
  } else {
    bger = 'schwelle_verfehlt';
    bgerText = `Streitwert CHF ${sw.toLocaleString('de-CH')} unter der BGer-Grenze von CHF ${bgerSchwelle.toLocaleString('de-CH')} (${mietArbeit ? 'Art. 74 Abs. 1 lit. a' : 'Art. 74 Abs. 1 lit. b'} BGG). Ausnahmen: Rechtsfrage von grundsätzlicher Bedeutung (Abs. 2 lit. a, in der Beschwerde zu begründen) — sonst bleibt die subsidiäre Verfassungsbeschwerde (Art. 113 ff. BGG; nur Verfassungsrügen, Art. 116; gleiche Frist, Art. 117).`;
    normverweise.push({ artikel: 'Art. 74 BGG' }, { artikel: 'Art. 113 BGG' });
  }

  // Plausibilisierung Direktklage (Review-Befund N-1, 6.6.2026): Art. 8 Abs. 1
  // ZPO setzt einen Streitwert von mindestens 100 000 Franken voraus — eine
  // Eingabe darunter ist faktisch unmöglich und wird offengelegt statt still
  // akzeptiert (§8).
  // RL-42 / VS3-19 (§5): Schwelle aus ZPO_SCHWELLEN statt Literal.
  if (vorinstanz === 'direktklage_oberes_gericht' && sw !== null && sw < ZPO_SCHWELLEN.DIREKTKLAGE_MIN) {
    weichen.push(`Eingabe prüfen: Die Direktklage beim oberen Gericht setzt einen Streitwert von mindestens CHF ${ZPO_SCHWELLEN.DIREKTKLAGE_MIN.toLocaleString('de-CH')} voraus (Art. 8 Abs. 1 ZPO) — angegeben sind CHF ${sw.toLocaleString('de-CH')}. Lag der Streitwert vor der Vorinstanz tatsächlich darunter, war Art. 8 nicht der richtige Weg.`);
  }

  // Zwischenentscheid-Weiche ans BGer (Art. 92/93 BGG — Wortlaut-verifiziert):
  // Zuständigkeit/Ausstand sofort UND zwingend (Art. 92); andere nur bei nicht
  // wieder gutzumachendem Nachteil oder sofortigem Endentscheid (Art. 93).
  if (objekt === 'zwischenentscheid' && bger !== 'schwelle_verfehlt') {
    weichen.push('Weiterzug eines ZWISCHENENTSCHEIDS ans Bundesgericht: Betrifft er Zuständigkeit oder Ausstand, ist die Beschwerde SOFORT zu erheben (Art. 92 BGG — spätere Anfechtung ausgeschlossen). Andere Zwischenentscheide nur, wenn ein nicht wieder gutzumachender Nachteil droht oder die Gutheissung sofort einen Endentscheid herbeiführt (Art. 93 Abs. 1 BGG) — sonst erst mit dem Endentscheid.');
    normverweise.push({ artikel: 'Art. 93 BGG' });
  }
  // M-1-Fix Bug-Check 6.6.2026: Auch die prozessleitende Verfügung ist vor
  // Bundesgericht kein Endentscheid, sondern ein «anderer Vor- und Zwischen-
  // entscheid» (Art. 93 BGG) — vorher behauptete die Engine die BGer-
  // Zulässigkeit unbedingt, während der Zwischenentscheid-Pfad den Vorbehalt
  // bereits trug (§8).
  if (objekt === 'prozessleitende_verfuegung' && bger !== 'schwelle_verfehlt') {
    weichen.push('Weiterzug einer PROZESSLEITENDEN VERFÜGUNG ans Bundesgericht: Sie ist kein Endentscheid, sondern ein «anderer Zwischenentscheid» — die Beschwerde ist nur zulässig, wenn ein nicht wieder gutzumachender Nachteil droht oder die Gutheissung sofort einen Endentscheid herbeiführt (Art. 93 Abs. 1 BGG); sonst erst zusammen mit dem Endentscheid anfechten.');
    normverweise.push({ artikel: 'Art. 93 BGG' });
  }

  // ── BGer-Frist (Art. 100 Abs. 1 BGG) + Stillstand (Art. 46) ───────────────
  // Art. 46 Abs. 2 lit. a (Wortlaut-verifiziert): KEIN Stillstand in Verfahren
  // betreffend aufschiebende Wirkung und andere vorsorgliche Massnahmen.
  const bgerStillstand = objekt !== 'vorsorgliche_massnahme';
  const bgerFrist: RechtsmittelFrist = {
    tage: 30,
    text: 'Beschwerdefrist 30 Tage ab Eröffnung der vollständigen Ausfertigung (Art. 100 Abs. 1 BGG); gesetzliche Frist, nicht erstreckbar (Art. 47 Abs. 1 BGG).',
    stillstand: bgerStillstand,
    stillstandText: bgerStillstand
      ? 'Fristenstillstand gilt (Art. 46 Abs. 1 BGG: Ostern ± 7 Tage · 15.7.–15.8. · 18.12.–2.1.).'
      : 'KEIN Fristenstillstand: Verfahren betreffend vorsorgliche Massnahmen (Art. 46 Abs. 2 lit. a BGG).',
  };
  normverweise.push({ artikel: 'Art. 100 Abs. 1 BGG' }, { artikel: 'Art. 46 BGG' });

  // Kognition (Art. 98 BGG): bei vorsorglichen Massnahmen nur Verfassungsrügen.
  const kognitionHinweis = objekt === 'vorsorgliche_massnahme'
    ? 'Vor Bundesgericht kann gegen Entscheide über vorsorgliche Massnahmen NUR die Verletzung verfassungsmässiger Rechte gerügt werden (Art. 98 BGG). Hinweis: Die Rechtsprechung behandelt auch Eheschutzentscheide als vorsorgliche Massnahmen in diesem Sinn (BGE 133 III 393 — Einordnung im Einzelfall prüfen).'
    : null;
  if (kognitionHinweis) normverweise.push({ artikel: 'Art. 98 BGG' });

  const abt = bgerAbteilungZivil(bgerGebietFuerStreitsache(input.streitsache));
  const bgerAbteilung = `${abt.name} (${abt.norm})`;
  normverweise.push({ artikel: abt.norm, bemerkung: 'Geschäftsverteilung Bundesgericht' });

  return {
    kantonal, kantonalText, kantonalFrist, bger, bgerText, bgerFrist,
    weichen, kognitionHinweis, bgerAbteilung,
    fristHinweis: 'Fristauslösend ist kantonal die Zustellung des begründeten Entscheids (Art. 311/321 ZPO), vor Bundesgericht die Eröffnung der vollständigen Ausfertigung (Art. 100 Abs. 1 BGG). Fristende an Sa/So/Feiertag → nächster Werktag (Art. 142 Abs. 3 ZPO / Art. 45 Abs. 1 BGG).',
    normverweise,
  };
}

// ── Abbildung des Rechtsmittel-Fahrplans in das einheitliche Berichts-Format
// (G3.1 / M-8, 10.6.2026): reine Darstellungs-Abbildung für PDF/Anzeige —
// alle Texte stammen unverändert aus dem RechtsmittelErgebnis (§3/§5).
export function rechtsmittelBericht(r: RechtsmittelErgebnis): Berechnungsergebnis {
  const kantonalLabel = r.kantonal === 'berufung' ? 'Berufung'
    : r.kantonal === 'beschwerde' ? 'Beschwerde'
    : r.kantonal === 'offen' ? 'Berufung oder Beschwerde (streitwertabhängig)'
    : 'Kein kantonales Rechtsmittel (einzige kantonale Instanz)';
  const fristKurz = r.kantonalFrist && r.kantonalFrist.tage !== null ? ` – ${r.kantonalFrist.tage} Tage` : '';
  const bgerKurz = r.bger === 'zulaessig' ? `Beschwerde in Zivilsachen zulässig (${r.bgerFrist.tage} Tage)`
    : r.bger === 'schwelle_verfehlt' ? 'BGer: Streitwertgrenze nicht erreicht'
    : 'BGer: vom Streitwert abhängig';
  const rechenweg: Rechenschritt[] = [
    { beschreibung: 'Kantonales Rechtsmittel', zwischenergebnis: `${kantonalLabel}. ${r.kantonalText}`, normen: [] },
    ...(r.kantonalFrist ? [{
      beschreibung: 'Frist (kantonal)',
      zwischenergebnis: `${r.kantonalFrist.tage !== null ? `${r.kantonalFrist.tage} Tage. ` : ''}${r.kantonalFrist.text} ${r.kantonalFrist.stillstandText}`,
      normen: [],
    }] : []),
    { beschreibung: 'Weiterzug ans Bundesgericht', zwischenergebnis: `${r.bgerText} Zuständig wäre die ${r.bgerAbteilung}.`, normen: [] },
    { beschreibung: 'Frist (Bundesgericht)', zwischenergebnis: `${r.bgerFrist.tage} Tage. ${r.bgerFrist.text} ${r.bgerFrist.stillstandText}`, normen: [] },
  ];
  return {
    ergebnis: `${kantonalLabel}${fristKurz} · ${bgerKurz}`,
    status: 'ok',
    rechenweg,
    annahmen: [r.fristHinweis],
    warnungen: [...r.weichen, ...(r.kognitionHinweis ? [r.kognitionHinweis] : [])],
    normverweise: r.normverweise,
  };
}
