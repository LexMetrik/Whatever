// Dossier: bibliothek/normen/feiertage-kantone-bj.md · bibliothek/recherche/stillstand-vwvg-bgg.md
import { parseISO } from 'date-fns';
import type { Kanton } from '../types/legal';
import { formatDatum, formatISO } from './datumsUtils';
import {
  stillstandsperioden,
  stillstandsperiodeFuer,
} from '../data/zpoFeiertage';
import {
  fristendeTage,
  fristendeKalender,
  normalisiereEnde,
  OHNE_STILLSTAND,
  type Stillstand,
  type Einheit,
} from './fristenEngine';

// ─── Verwaltungs-Stillstand (Art. 22a VwVG) und BGG-Stillstand (Art. 46 BGG) ──
//
// Auftrag David 13.6.2026: «baue … den Verwaltungs-Stillstand (Art. 22a VwVG)
// und den BGG-Stillstand (Art. 46 BGG) im Fristenrechner».
//
// Beide Regimes kennen DIESELBEN drei Stillstandsperioden wie die ZPO-
// Gerichtsferien (Ostern ± 7 Tage · 15.7.–15.8. · 18.12.–2.1.) und denselben
// Ruhen-Mechanismus – das ist fachneutrale Fristen-Infrastruktur (§4), die mit
// `stillstandsperioden`/`stillstandsperiodeFuer` und der gemeinsamen
// fristenEngine geteilt wird. Regime-treu (KEIN Kollaps, §1/§4) bleiben die
// rechtlich UNTERSCHIEDLICHEN Teile als interne Verzweigung erhalten:
//
//   1. Geltungsbereich: Der Stillstand gilt NUR für «nach Tagen bestimmte»
//      Fristen (Art. 22a Abs. 1 / Art. 46 Abs. 1, Wortlaut am Cache
//      verifiziert 13.6.2026). Wochen-, Monats- und Jahresfristen stehen NICHT
//      still – anders als bei der ZPO (Art. 145 ZPO kennt diese Schranke
//      nicht). Sie erfahren nur die Werktagsverschiebung am Ende.
//   2. Ausnahmen (Abs. 2) sind je Regime verschieden:
//      · VwVG Art. 22a Abs. 2: a) aufschiebende Wirkung und andere vorsorgliche
//        Massnahmen; b) öffentliche Beschaffungen.
//      · BGG  Art. 46  Abs. 2: a) aufschiebende Wirkung/vorsorgliche
//        Massnahmen; b) Wechselbetreibung; c) Stimmrechtssachen; d) inter-
//        nationale Rechtshilfe in Strafsachen und Amtshilfe in Steuersachen;
//        e) öffentliche Beschaffungen.
//   3. Werktagsverschiebung des letzten Tages: Art. 20 Abs. 3 VwVG bzw.
//      Art. 45 BGG. Anders als das VwVG (Art. 20 Abs. 3 trägt BEIDE Sätze in
//      EINEM Absatz) verteilt das BGG die Regel auf zwei Absätze: Abs. 1 =
//      Werktagsverschiebung, Abs. 2 = «Massgebend ist das Recht des Kantons, in
//      dem die Partei oder ihr Vertreter … den Wohnsitz oder den Sitz hat».
//      Darum trägt der BGG-Anker Art. 45 BGG (nicht nur Abs. 1) — amtlich
//      verifiziert am Fedlex-Filestore SR 173.110, Konsolidierung 20260401
//      (§7-Gegenprüfung 2.7.2026).
//
// Diese Engine ist eine reine Kompositions-Schicht über der fristenEngine –
// keine eigene Datums-Arithmetik, kein LLM (§2/§3). Sie deckt die ordentliche
// Konstellation ab; die Abs.-2-Ausnahmen werden offengelegt, nicht automatisch
// erkannt (der Anwender wählt dort «Keine Ferien»).

export type StillstandRegime = 'vwvg' | 'bgg';

export interface BvFristInput {
  regime: StillstandRegime;
  ereignis: string;   // ISO (auslösendes Ereignis bzw. Mitteilung)
  einheit: Einheit;
  laenge: number;
  kanton: Kanton;     // Feiertage am Wohnsitz/Sitz (Art. 20 Abs. 3 VwVG / Art. 45 BGG)
}

export interface BvFristResult {
  diesAdQuemISO: string;
  diesAdQuem: string;       // dd.MM.yyyy
  stillstandAktiv: boolean; // Stillstand tatsächlich angewendet (nur Tagesfristen)
  verschoben: boolean;      // Endverschiebung auf Werktag erfolgt
  normen: string[];         // Norm-Labels (Anzeige)
  annahmen: string[];
  warnungen: string[];
  ausnahmen: string[];      // Abs.-2-Konstellationen ohne Stillstand (Offenlegung)
}

interface RegimeMeta {
  kuerzel: string;
  stillstandNorm: string;       // Abs. 1
  ausnahmeNorm: string;         // Abs. 2
  werktagNorm: string;          // Werktagsverschiebung
  ausnahmen: string[];          // Abs.-2-Katalog
}

const REGIME: Record<StillstandRegime, RegimeMeta> = {
  vwvg: {
    kuerzel: 'VwVG',
    stillstandNorm: 'Art. 22a Abs. 1 VwVG',
    ausnahmeNorm: 'Art. 22a Abs. 2 VwVG',
    werktagNorm: 'Art. 20 Abs. 3 VwVG',
    ausnahmen: [
      'die aufschiebende Wirkung und andere vorsorgliche Massnahmen',
      'die öffentlichen Beschaffungen',
    ],
  },
  bgg: {
    kuerzel: 'BGG',
    stillstandNorm: 'Art. 46 Abs. 1 BGG',
    ausnahmeNorm: 'Art. 46 Abs. 2 BGG',
    // Art. 45 BGG: Abs. 1 = Werktagsverschiebung, Abs. 2 = massgebendes
    // kantonales Recht (Wohnsitz/Sitz der Partei/Vertretung). Beide Sätze
    // hängen hier am selben werktagNorm-Anker → Art. 45 BGG als Ganzes zitieren,
    // nicht nur Abs. 1 (die Wohnsitz/Sitz-Aussage steht in Abs. 2). Amtlich
    // verifiziert Fedlex SR 173.110, Konsolidierung 20260401 (§7, 2.7.2026).
    werktagNorm: 'Art. 45 BGG',
    ausnahmen: [
      'die aufschiebende Wirkung und andere vorsorgliche Massnahmen',
      'die Wechselbetreibung',
      'Stimmrechtssachen',
      'die internationale Rechtshilfe in Strafsachen und die internationale Amtshilfe in Steuersachen',
      'die öffentlichen Beschaffungen',
    ],
  },
};

// Ruhen-Strategie (identische Perioden wie ZPO; geteilte Infrastruktur, §4).
const RUHEN_STILLSTAND: Stillstand = {
  periodeFuer: stillstandsperiodeFuer,
  perioden: stillstandsperioden,
  ruhenZaehlung: true,
  endregel: 'ruhen_weiter',
};

export function berechneBggVwvgFrist(input: BvFristInput): BvFristResult {
  if (!Number.isInteger(input.laenge) || input.laenge <= 0) {
    throw new Error('Fristlänge muss eine ganze Zahl > 0 sein.');
  }
  const meta = REGIME[input.regime];
  const ereignis = parseISO(input.ereignis);

  // Geltungsbereich: Stillstand NUR bei «nach Tagen bestimmten» Fristen
  // (Art. 22a Abs. 1 VwVG / Art. 46 Abs. 1 BGG). Sonst keine geschlossene Zeit.
  const istTage = input.einheit === 'tage';
  const st = istTage ? RUHEN_STILLSTAND : OHNE_STILLSTAND;

  const { ende } = istTage
    ? fristendeTage(ereignis, input.laenge, st)
    : fristendeKalender(ereignis, input.einheit, input.laenge, st, false);

  const { tag: diesAdQuem, verschoben } = normalisiereEnde(ende, input.kanton, st);

  const annahmen: string[] = [];
  const warnungen: string[] = [];

  if (istTage) {
    annahmen.push(
      `Stillstand nach ${meta.stillstandNorm} berücksichtigt (Ostern ± 7 Tage · 15.7.–15.8. · `
      + `18.12.–2.1.); die Stillstandstage werden nicht mitgezählt.`,
    );
  } else {
    const einheitWort = input.einheit === 'wochen' ? 'Wochenfristen' : input.einheit === 'monate' ? 'Monatsfristen' : 'Jahresfristen';
    warnungen.push(
      `Der Stillstand nach ${meta.stillstandNorm} gilt nur für nach Tagen bestimmte Fristen – `
      + `${einheitWort} stehen nicht still. Es wird nur der letzte Tag auf einen Werktag verschoben `
      + `(${meta.werktagNorm}).`,
    );
  }

  // RL-07/F3-04 (Prüfung Rechtslogik 23.9.2026): «die Partei oder ihr
  // Vertreter» (Art. 45 Abs. 2 BGG; Art. 20 Abs. 3 Satz 2 VwVG) — die
  // Vertretung fehlte im Text, obwohl der Kopfkommentar sie nennt.
  annahmen.push(
    `Endverschiebung nach ${meta.werktagNorm}: massgebend sind die Feiertage am Wohnsitz/Sitz der `
    + `Partei oder ihrer Vertretung (gewählter Kanton ${input.kanton}).`,
  );

  return {
    diesAdQuemISO: formatISO(diesAdQuem),
    diesAdQuem: formatDatum(diesAdQuem),
    stillstandAktiv: istTage,
    verschoben,
    normen: [meta.stillstandNorm, meta.werktagNorm],
    annahmen,
    warnungen,
    ausnahmen: meta.ausnahmen,
  };
}

/** Offenlegungs-Satz für die Abs.-2-Ausnahmen (UI/Hinweis). */
export function bvAusnahmenSatz(regime: StillstandRegime): string {
  const meta = REGIME[regime];
  return `Kein Stillstand gilt in Verfahren betreffend ${meta.ausnahmen.join('; ')} `
    + `(${meta.ausnahmeNorm}) – dort «Keine Ferien» wählen.`;
}
