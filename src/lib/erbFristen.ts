// Dossier: bibliothek/normen/erbrecht-regelwerk.md · bibliothek/recherche/erbrecht-ausbau.md
import type { Berechnungsergebnis, Kanton, Normverweis } from '../types/legal';
import { berechneAllgemeineFrist, type AllgFristResult } from './allgemeineFrist';

// ─── Erb-Fristen-Rechner (Art. 521/533/567 ff. ZGB) – dünne Engine ──────────
//
// Grundlage: bibliothek/recherche/erbrecht-ausbau.md (Rechner 2) +
// bibliothek/normen/erbrecht-regelwerk.md. Alle Wortlaute am Fedlex-Cache
// /tmp/zgb.html (Stand 20260101) verifiziert (6.6.2026): 521, 533, 566–569,
// 580, 587, 600, 601. Muster: allgemeineFrist.ts – deklarativer Frist-Katalog,
// Nutzer wählt Tatbestand + gibt das Trigger-Datum ein; KEINE Stillstände
// (materielles Erbrecht kennt keine Gerichtsferien), Arithmetik über die
// geteilten Bausteine (Art.-77-analog: Ereignistag zählt nicht, Monats-/
// Jahresfrist endet am gleichbezeichneten Tag; Monatsende-Klemmung).
//
// §2: rein und deterministisch. Die QUALIFIKATION des Triggers («Kenntnis»,
// gesetzlicher vs. eingesetzter Erbe, Bösgläubigkeit) ist Rechtsfrage und
// bleibt Auswahl/Eingabe des Nutzers – nie Heuristik (§8: Warnungen).
//
// Fristbeginn-Konvention (Annahme, offengelegt): Auch die Klage-/
// Verjährungsfristen (521/533/600/601) werden nach der Art.-77-analogen
// Logik des allgemeinen Fristenrechners berechnet (gleichbezeichneter Tag);
// die h.L. behandelt sie als Verwirkungs- bzw. verjährungsähnliche Fristen –
// [zu verifizieren], Differenz maximal 1 Tag, Annahme wird ausgegeben.

export type ErbFristKey =
  | 'ausschlagung_gesetzlich'
  | 'ausschlagung_eingesetzt'
  | 'ausschlagung_inventar'
  | 'oeff_inventar_begehren'
  | 'erklaerung_nach_inventar'
  | 'ungueltigkeit_relativ'
  | 'ungueltigkeit_absolut'
  | 'ungueltigkeit_boesglaeubig'
  | 'herabsetzung_relativ'
  | 'herabsetzung_absolut_verfuegung'
  | 'herabsetzung_absolut_lebzeitig'
  | 'erbschaftsklage_relativ'
  | 'erbschaftsklage_absolut'
  | 'erbschaftsklage_boesglaeubig'
  | 'vermaechtnisklage';

type ErbFristGruppe = 'erbgang' | 'klage';

export interface ErbFristPreset {
  key: ErbFristKey;
  gruppe: ErbFristGruppe;
  label: string;
  laenge: number;
  einheit: 'monate' | 'jahre';
  /** Auslösendes Ereignis (dies a quo) – exakte gesetzliche Umschreibung. */
  trigger: string;
  norm: string;
  hinweis?: string;
}

// Katalog – jede Zeile gegen den ZGB-Wortlaut geprüft (6.6.2026).
export const ERB_FRISTEN: readonly ErbFristPreset[] = [
  // ── Erbgang: Ausschlagung & Inventar ──
  { key: 'ausschlagung_gesetzlich', gruppe: 'erbgang',
    label: 'Ausschlagung – gesetzliche Erbin/gesetzlicher Erbe (3 Monate)',
    laenge: 3, einheit: 'monate',
    trigger: 'Kenntnis vom Tod des Erblassers (sofern nicht nachweisbar erst später Kenntnis vom Erbfall)',
    // Gegenprüfung 2.7.2026: Die 3-Monats-Länge steht in Art. 567 Abs. 1 ZGB
    // («Die Frist zur Ausschlagung beträgt drei Monate»); Abs. 2 regelt nur den
    // Fristbeginn. Anker beide Absätze. Quelle: Fedlex SR 210, Konsolidierung 1.7.2026.
    norm: 'Art. 567 Abs. 1 und 2 ZGB',
    hinweis: 'Die Ausschlagung ist bei der zuständigen Behörde mündlich oder schriftlich zu erklären (Art. 570 ZGB); sie muss unbedingt und vorbehaltlos sein.' },
  { key: 'ausschlagung_eingesetzt', gruppe: 'erbgang',
    label: 'Ausschlagung – eingesetzte Erbin/eingesetzter Erbe (3 Monate)',
    laenge: 3, einheit: 'monate',
    trigger: 'Zugang der amtlichen Mitteilung von der Verfügung des Erblassers',
    // Gegenprüfung 2.7.2026: Länge (3 Monate) aus Art. 567 Abs. 1, Fristbeginn aus Abs. 2.
    norm: 'Art. 567 Abs. 1 und 2 ZGB' },
  { key: 'ausschlagung_inventar', gruppe: 'erbgang',
    label: 'Ausschlagung nach Sicherungs-Inventar (3 Monate)',
    laenge: 3, einheit: 'monate',
    trigger: 'Tag, an dem die Behörde den Abschluss des Inventars mitgeteilt hat',
    norm: 'Art. 568 ZGB',
    hinweis: 'Einheitlicher Fristbeginn für ALLE Erben, wenn ein Inventar als Sicherungsmassregel (Art. 553 ZGB) aufgenommen wurde.' },
  { key: 'oeff_inventar_begehren', gruppe: 'erbgang',
    label: 'Begehren um öffentliches Inventar (1 Monat)',
    laenge: 1, einheit: 'monate',
    trigger: 'gleicher Fristbeginn wie die Ausschlagung (Kenntnis vom Tod bzw. amtliche Mitteilung)',
    norm: 'Art. 580 Abs. 2 ZGB',
    hinweis: 'Das Begehren eines Erben gilt auch für die übrigen (Art. 580 Abs. 3 ZGB).' },
  { key: 'erklaerung_nach_inventar', gruppe: 'erbgang',
    label: 'Erklärung nach Abschluss des öffentlichen Inventars (1 Monat)',
    laenge: 1, einheit: 'monate',
    trigger: 'Aufforderung der Behörde nach Abschluss des Inventars',
    norm: 'Art. 587 Abs. 1 ZGB',
    hinweis: 'Schweigen gilt als Annahme unter öffentlichem Inventar (Art. 588 Abs. 2 ZGB); die Behörde kann die Frist erstrecken (Art. 587 Abs. 2 ZGB).' },
  // ── Klagefristen: 1/10/30-Muster ──
  { key: 'ungueltigkeit_relativ', gruppe: 'klage',
    label: 'Ungültigkeitsklage – relative Frist (1 Jahr)',
    laenge: 1, einheit: 'jahre',
    trigger: 'Kenntnis von der Verfügung UND vom Ungültigkeitsgrund',
    norm: 'Art. 521 Abs. 1 ZGB' },
  { key: 'ungueltigkeit_absolut', gruppe: 'klage',
    label: 'Ungültigkeitsklage – absolute Frist (10 Jahre)',
    laenge: 10, einheit: 'jahre',
    trigger: 'Eröffnung der Verfügung',
    norm: 'Art. 521 Abs. 1 ZGB' },
  { key: 'ungueltigkeit_boesglaeubig', gruppe: 'klage',
    label: 'Ungültigkeitsklage gegen Bösgläubige (30 Jahre)',
    laenge: 30, einheit: 'jahre',
    trigger: 'Eröffnung der Verfügung',
    norm: 'Art. 521 Abs. 2 ZGB',
    // Gegenprüfung 2.7.2026: Art. 519 Abs. 1 Ziff. 2 ZGB ist der MANGELHAFTE WILLE
    // (Willensmangel), nicht der Formmangel; der Formmangel ist ein eigener Grund
    // in Art. 520 ZGB. Die 30-Jahres-Frist (Art. 521 Abs. 2 ZGB) ist auf
    // Verfügungsunfähigkeit (Ziff. 1) und Unsittlichkeit/Rechtswidrigkeit (Ziff. 3)
    // beschränkt – ausgeschlossen sind Willensmangel (Ziff. 2) UND Formmangel (Art. 520).
    // Quelle: Fedlex SR 210, Konsolidierung 1.7.2026 (https://www.fedlex.admin.ch/eli/cc/24/233_245_233/de).
    hinweis: 'NUR bei Verfügungsunfähigkeit des Erblassers oder Rechtswidrigkeit/Unsittlichkeit (Art. 519 Abs. 1 Ziff. 1 und 3 ZGB) – NICHT bei mangelhaftem Willen (Art. 519 Abs. 1 Ziff. 2 ZGB) und nicht beim Formmangel (Art. 520 ZGB).' },
  { key: 'herabsetzung_relativ', gruppe: 'klage',
    label: 'Herabsetzungsklage – relative Frist (1 Jahr)',
    laenge: 1, einheit: 'jahre',
    trigger: 'Kenntnis der Erben von der Verletzung ihrer (Pflichtteils-)Rechte',
    norm: 'Art. 533 Abs. 1 ZGB' },
  { key: 'herabsetzung_absolut_verfuegung', gruppe: 'klage',
    label: 'Herabsetzungsklage – absolute Frist bei letztwilliger Verfügung (10 Jahre)',
    laenge: 10, einheit: 'jahre',
    trigger: 'Eröffnung der letztwilligen Verfügung',
    norm: 'Art. 533 Abs. 1 ZGB' },
  { key: 'herabsetzung_absolut_lebzeitig', gruppe: 'klage',
    label: 'Herabsetzungsklage – absolute Frist bei lebzeitiger Zuwendung (10 Jahre)',
    laenge: 10, einheit: 'jahre',
    trigger: 'Tod des Erblassers',
    norm: 'Art. 533 Abs. 1 ZGB' },
  { key: 'erbschaftsklage_relativ', gruppe: 'klage',
    label: 'Erbschaftsklage – relative Frist (1 Jahr)',
    laenge: 1, einheit: 'jahre',
    trigger: 'Kenntnis vom Besitz der beklagten Partei und vom eigenen besseren Recht',
    norm: 'Art. 600 Abs. 1 ZGB' },
  { key: 'erbschaftsklage_absolut', gruppe: 'klage',
    label: 'Erbschaftsklage – absolute Frist (10 Jahre)',
    laenge: 10, einheit: 'jahre',
    trigger: 'Tod des Erblassers bzw. Eröffnung der letztwilligen Verfügung',
    norm: 'Art. 600 Abs. 1 ZGB' },
  { key: 'erbschaftsklage_boesglaeubig', gruppe: 'klage',
    label: 'Erbschaftsklage gegen Bösgläubige (30 Jahre)',
    laenge: 30, einheit: 'jahre',
    trigger: 'Tod des Erblassers bzw. Eröffnung der letztwilligen Verfügung',
    norm: 'Art. 600 Abs. 2 ZGB',
    hinweis: 'Gegenüber bösgläubigen Beklagten beträgt die Frist STETS 30 Jahre – anders als bei Art. 521 Abs. 2 ohne Beschränkung auf bestimmte Gründe.' },
  { key: 'vermaechtnisklage', gruppe: 'klage',
    label: 'Vermächtnisklage (10 Jahre)',
    laenge: 10, einheit: 'jahre',
    trigger: 'Mitteilung der Verfügung oder späterer Fälligkeitszeitpunkt des Vermächtnisses',
    norm: 'Art. 601 ZGB' },
] as const;

export interface ErbFristInput {
  key: ErbFristKey;
  /** Trigger-Datum (yyyy-MM-dd) – Qualifikation gemäss Katalog-Trigger. */
  trigger: string;
  /** Fristende auf Sa/So/Feiertag → nächster Werktag (Art. 78 OR analog). */
  werktagsVerschiebung?: boolean;
  /** Kanton für die Feiertags-Verschiebung (Sitz der Behörde/des Gerichts). */
  kanton?: Kanton;
}

const N = (artikel: string, bemerkung?: string): Normverweis => ({ artikel, bemerkung });

/** Reine Engine: Erb-Frist nach Katalog + Trigger-Datum. */
export function berechneErbFrist(
  input: ErbFristInput,
): Berechnungsergebnis & { resultat: AllgFristResult; preset: ErbFristPreset } {
  const preset = ERB_FRISTEN.find((p) => p.key === input.key);
  if (!preset) throw new Error(`Unbekannter Erb-Frist-Tatbestand: ${input.key}`);

  // Arithmetik über den geteilten allgemeinen Fristenrechner (Art.-77-analog;
  // gleichbezeichneter Tag, Monatsende-Klemmung) – §10: Rahmen wiederverwenden.
  const basis = berechneAllgemeineFrist({
    start: input.trigger,
    laenge: preset.laenge,
    einheit: preset.einheit,
    wochenendeVerschieben: !!input.werktagsVerschiebung,
    feiertageVerschieben: !!input.werktagsVerschiebung && !!input.kanton,
    kanton: input.kanton,
  });

  const annahmen: string[] = [
    'Fristberechnung Art.-77-OR-analog: Der Trigger-Tag zählt nicht mit; Monats-/Jahresfristen enden am gleichbezeichneten Tag (Monatsende-Klemmung). Für die Klagefristen (Art. 521/533/600/601 ZGB) ist diese Konvention h.L.-konform, aber nicht höchstrichterlich fixiert – im Grenzfall (±1 Tag) anwaltlich prüfen.',
    'Die Qualifikation des Trigger-Ereignisses (massgebliche «Kenntnis», Stellung als gesetzliche/eingesetzte Erbin, Bösgläubigkeit) ist Rechtsfrage und Eingabe-Verantwortung – der Rechner prüft sie nicht.',
  ];
  const warnungen: string[] = [];

  // RL-24/UI-08 (Prüfung Rechtslogik 23.9.2026): die Werktagsverschiebung ist
  // im Formular vorgewählt und verlängert Verwirkungsfristen (z. B. Art. 567
  // ZGB) — die Analogie war weder Annahme noch Warnung. Grundlage: Art. 7 ZGB
  // (allgemeine OR-Bestimmungen über Erfüllung gelten für andere zivilrechtliche
  // Verhältnisse; ZGB-Snapshot Stand 1.7.2026) i.V.m. Art. 78 OR (Stand
  // 1.1.2026); Samstag nach SR 173.110.3 (nicht amtlich nachgelesen, Netz aus
  // 24.9.2026). Ob jede Erb-Frist so zu rechnen ist, ist nicht höchstrichterlich
  // fixiert — darum offengelegt und bei tatsächlicher Verschiebung die
  // sichere Variante (rohes Ende) genannt (§8).
  if (input.werktagsVerschiebung) {
    annahmen.push('Fristende auf Samstag, Sonntag oder Feiertag → nächster Werktag: Art. 78 OR (Samstag: SR 173.110.3), auf ZGB-Fristen übertragen über Art. 7 ZGB. Diese Analogie ist für die Erb-Fristen nicht höchstrichterlich bestätigt.');
    if (basis.verschoben) {
      warnungen.push(`Das Fristende wurde vom ${basis.rohEndDatum} auf den ${basis.endDatum} verschoben. Sichere Variante: spätestens am ${basis.rohEndDatum} handeln.`);
    }
  }

  if (preset.gruppe === 'erbgang') {
    warnungen.push(
      'Ausschlagung und Inventar-Begehren sind bei der ZUSTÄNDIGEN KANTONALEN BEHÖRDE anzubringen (Art. 570/580 ZGB) – kantonal unterschiedlich organisiert (Erbschaftsamt, Bezirksgericht, Gemeinde).',
      'Ist die Zahlungsunfähigkeit des Erblassers im Todeszeitpunkt amtlich festgestellt oder offenkundig, wird die Ausschlagung VERMUTET (Art. 566 Abs. 2 ZGB) – dann ist unter Umständen keine aktive Erklärung nötig.',
      'Die Behörde kann die Frist aus wichtigen Gründen verlängern oder eine neue Frist ansetzen (Art. 576 ZGB). Vorbehalt: Verwirkung der Ausschlagungsbefugnis bei Einmischung in die Erbschaft (Art. 571 Abs. 2 ZGB).',
    );
  } else {
    warnungen.push(
      'EINREDEWEISE kann die Ungültigkeit bzw. der Herabsetzungsanspruch JEDERZEIT geltend gemacht werden (Art. 521 Abs. 3 / 533 Abs. 3 ZGB) – die Frist betrifft nur die KLAGE.',
    );
    if (preset.key.startsWith('ungueltigkeit')) {
      // Gegenprüfung 2.7.2026: vollständige Ausschlussliste (Art. 521 Abs. 2 ZGB) –
      // nicht nur der Formmangel (Art. 520), auch der Willensmangel (Art. 519 Abs. 1 Ziff. 2)
      // ist von der 30-Jahres-Frist ausgeschlossen. Quelle: Fedlex SR 210, Konsolidierung 1.7.2026.
      warnungen.push('Die 30-Jahres-Frist gegen Bösgläubige gilt NUR bei Verfügungsunfähigkeit, Rechtswidrigkeit oder Unsittlichkeit (Art. 519 Abs. 1 Ziff. 1/3 ZGB), nicht bei mangelhaftem Willen (Ziff. 2) und nicht beim Formmangel (Art. 520 ZGB).');
    }
  }

  const normverweise: Normverweis[] = [
    N(preset.norm, preset.label),
    ...(preset.gruppe === 'erbgang'
      ? [N('Art. 570 ZGB', 'Form der Ausschlagung: Erklärung an die Behörde'), N('Art. 576 ZGB', 'Fristverlängerung aus wichtigen Gründen')]
      : [N('Art. 521 Abs. 3 / 533 Abs. 3 ZGB', 'Einrede unbefristet')]),
  ];

  const rechenweg: Berechnungsergebnis['rechenweg'] = [
    {
      beschreibung: `Tatbestand: ${preset.label}`,
      zwischenergebnis: `Frist ${preset.laenge} ${preset.einheit === 'monate' ? 'Monat(e)' : 'Jahr(e)'} ab: ${preset.trigger} (${preset.norm}).${preset.hinweis ? ' ' + preset.hinweis : ''}`,
      normen: [N(preset.norm)],
    },
    ...basis.schritte.map((s) => ({
      beschreibung: s.label,
      zwischenergebnis: `${s.datum} (${s.wochentag})${s.grund ? ' – ' + s.grund : ''}`,
      normen: [] as Normverweis[],
    })),
  ];

  return {
    ergebnis: `Fristende: ${basis.endDatum} (${basis.endWochentag}) – ${preset.label}.`,
    status: 'ok',
    rechenweg,
    annahmen,
    warnungen: [...warnungen, ...basis.hinweise],
    normverweise,
    resultat: basis,
    preset,
  };
}
