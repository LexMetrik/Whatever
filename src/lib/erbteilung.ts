// Dossier: bibliothek/normen/erbrecht-regelwerk.md
import type { Normverweis, Rechenschritt } from '../types/legal';
import type { ErbteilungInput, ErbteilungErgebnis, ErbeAnteil, ErbeGruppe } from '../types/erbrecht';
import { br, addB, subB, mulB, divB, fmtB, istNull, EINS, NULL_BRUCH, type Bruch } from './bruch';
import { chf as fmtCHF } from './vorlagen/datum';

// ─── Erbteilung & Pflichtteil (Art. 457 ff., 462, 470 ff. ZGB) ────────────
//
// Zweistufige Berechnung (Konzept §1): (1) güterrechtliche Auseinandersetzung
// bestimmt den Nachlass, (2) erbrechtliche Teilung verteilt Quoten und
// Pflichtteile. Alle Quoten als exakte Brüche.
//
// VERIFY: Wortlaut der zitierten ZGB-Artikel (insb. Art. 471 nF, Art. 472 nF,
// Art. 473 Abs. 2 nF) vor Produktivschaltung auf Fedlex SR 210 endkontrollieren.
// Rechtsgrundlage der Revision: BG vom 18.12.2020 (Erbrecht), AS 2021 312,
// in Kraft seit 1.1.2023.

// ─── Feste Normverweise ───────────────────────────────────────────────────

const N_457: Normverweis = { artikel: 'Art. 457 ZGB', bemerkung: 'Nachkommen erben zu gleichen Teilen; Eintritt nach Stämmen' };
const N_458: Normverweis = { artikel: 'Art. 458 ZGB', bemerkung: 'Elterlicher Stamm; Hälften, Eintritt, Anwachsung' };
const N_459: Normverweis = { artikel: 'Art. 459 ZGB', bemerkung: 'Stamm der Grosseltern (3. Parentel)' };
const N_460: Normverweis = { artikel: 'Art. 460 ZGB', bemerkung: 'Ende der Verwandtenerbfolge mit der 3. Parentel' };
const N_462: Normverweis = { artikel: 'Art. 462 ZGB', bemerkung: 'Ehegatte/eingetragene Partner: 1/2, 3/4 oder ganze Erbschaft' };
const N_466: Normverweis = { artikel: 'Art. 466 ZGB', bemerkung: 'Erbschaft fällt an das Gemeinwesen' };
const N_470: Normverweis = { artikel: 'Art. 470 ZGB', bemerkung: 'Kreis der Pflichtteilsberechtigten (seit 1.1.2023 ohne Eltern)' };
const N_471: Normverweis = { artikel: 'Art. 471 ZGB', bemerkung: 'Pflichtteil = Hälfte des gesetzlichen Erbanspruchs (Fassung ab 1.1.2023)' };
// Altrechtliche Fassungen (Tod ≤ 31.12.2022) – andere Pflichtteilsquoten und Berechtigtenkreis.
const N_470_AF: Normverweis = { artikel: 'Art. 470 ZGB', bemerkung: 'Kreis der Pflichtteilsberechtigten (Fassung bis 31.12.2022, inkl. Eltern)' };
const N_471_AF: Normverweis = { artikel: 'Art. 471 ZGB', bemerkung: 'Pflichtteile (Fassung bis 31.12.2022): Nachkommen 3/4, Eltern 1/2, überlebender Ehegatte 1/2' };
const N_472: Normverweis = { artikel: 'Art. 472 ZGB', bemerkung: 'Verlust des Pflichtteils bei hängigem Scheidungsverfahren (Fassung ab 1.1.2023)' };
const N_473: Normverweis = { artikel: 'Art. 473 ZGB', bemerkung: 'Nutzniessungslösung gegenüber gemeinsamen Nachkommen' };
const N_215: Normverweis = { artikel: 'Art. 215 ZGB', bemerkung: 'Hälftige Vorschlagsbeteiligung (Errungenschaftsbeteiligung)' };
const N_210_2: Normverweis = { artikel: 'Art. 210 Abs. 2 ZGB', bemerkung: 'Rückschlag wird nicht geteilt' };
const N_209_2: Normverweis = { artikel: 'Art. 209 Abs. 2 ZGB', bemerkung: 'Schuld belastet die zugehörige Masse, im Zweifel die Errungenschaft' };
const N_247: Normverweis = { artikel: 'Art. 247 ZGB', bemerkung: 'Gütertrennung: keine Vorschlagsteilung' };
const N_221: Normverweis = { artikel: 'Art. 221 ZGB', bemerkung: 'Gütergemeinschaft: Umfang des Gesamtguts' };
// Audit-Fix 6.6.2026: Die HÄLFTIGE Teilung des Gesamtguts trägt Art. 241 Abs. 1
// ZGB («steht jedem Ehegatten oder seinen Erben die Hälfte des Gesamtgutes zu»),
// nicht Art. 221 (definiert nur den Umfang des Güterstands).
const N_241: Normverweis = { artikel: 'Art. 241 Abs. 1 ZGB', bemerkung: 'Gütergemeinschaft: hälftige Teilung des Gesamtguts' };
const N_SCHLT: Normverweis = { artikel: 'Art. 15 SchlT ZGB', bemerkung: 'Übergangsrecht: massgebend ist das Todesdatum' };

const HALB = br(1, 2);
const DREIVIERTEL = br(3, 4);

// Interner Verteilungs-Eintrag (mit Flag für den Eltern-Pflichtteil im alten Recht).
type Position = ErbeAnteil & { istLebenderElternteil?: boolean };

// ─── Schritt: gesetzliche Erbquoten verteilen ─────────────────────────────

function verteileQuoten(input: ErbteilungInput, mitEhegatte: boolean): { positionen: Position[]; parentel: 0 | 1 | 2 | 3 } {
  const positionen: Position[] = [];
  const staemmeVorverstorben = (input.kinderVorverstorben ?? []).filter((s) => s.enkel > 0);
  const staemme1 = input.kinderLebend + staemmeVorverstorben.length;

  const vaterSeite = input.vater?.lebt || input.vater?.stammNachkommen || false;
  const mutterSeite = input.mutter?.lebt || input.mutter?.stammNachkommen || false;

  if (staemme1 > 0) {
    // 1. Parentel (Art. 457; Ehegatte 1/2 nach Art. 462 Ziff. 1)
    const eg = mitEhegatte ? HALB : NULL_BRUCH;
    if (mitEhegatte) positionen.push({ bezeichnung: 'Ehegatte/Partner', gruppe: 'ehegatte', erbteil: eg, pflichtteil: NULL_BRUCH });
    const rest = subB(EINS, eg);
    const stammQuote = divB(rest, br(staemme1));
    for (let i = 1; i <= input.kinderLebend; i++) {
      positionen.push({ bezeichnung: input.kinderLebend === 1 ? 'Kind' : `Kind ${i}`, gruppe: 'nachkommen', erbteil: stammQuote, pflichtteil: NULL_BRUCH });
    }
    staemmeVorverstorben.forEach((s, j) => {
      const proEnkel = divB(stammQuote, br(s.enkel));
      positionen.push({
        bezeichnung: `Nachkommen des vorverstorbenen Kindes ${input.kinderLebend + j + 1} (je)`,
        gruppe: 'nachkommen', erbteil: proEnkel, pflichtteil: NULL_BRUCH, anzahl: s.enkel,
      });
    });
    return { positionen, parentel: 1 };
  }

  if (vaterSeite || mutterSeite) {
    // 2. Parentel (Art. 458; Ehegatte 3/4 nach Art. 462 Ziff. 2)
    const eg = mitEhegatte ? DREIVIERTEL : NULL_BRUCH;
    if (mitEhegatte) positionen.push({ bezeichnung: 'Ehegatte/Partner', gruppe: 'ehegatte', erbteil: eg, pflichtteil: NULL_BRUCH });
    const rest = subB(EINS, eg);
    const beideSeiten = vaterSeite && mutterSeite;
    const seitenQuote = beideSeiten ? divB(rest, br(2)) : rest; // Anwachsung (Art. 458 Abs. 4)
    const seite = (vorhanden: boolean, teil: ErbteilungInput['vater'], name: string) => {
      if (!vorhanden || !teil) return;
      if (teil.lebt) {
        positionen.push({ bezeichnung: name, gruppe: 'eltern_stamm', erbteil: seitenQuote, pflichtteil: NULL_BRUCH, istLebenderElternteil: true });
      } else {
        positionen.push({ bezeichnung: `Nachkommen ${name === 'Vater' ? 'des Vaters' : 'der Mutter'} (Geschwister/Nichten/Neffen, zusammen)`, gruppe: 'eltern_stamm', erbteil: seitenQuote, pflichtteil: NULL_BRUCH });
      }
    };
    seite(vaterSeite, input.vater, 'Vater');
    seite(mutterSeite, input.mutter, 'Mutter');
    return { positionen, parentel: 2 };
  }

  if (mitEhegatte) {
    // Art. 462 Ziff. 3: ganze Erbschaft; 3. Parentel wird verdrängt.
    positionen.push({ bezeichnung: 'Ehegatte/Partner', gruppe: 'ehegatte', erbteil: EINS, pflichtteil: NULL_BRUCH });
    return { positionen, parentel: 0 };
  }

  if (input.dritteParentelVorhanden) {
    positionen.push({ bezeichnung: 'Stamm der Grosseltern (3. Parentel, zusammen)', gruppe: 'dritte_parentel', erbteil: EINS, pflichtteil: NULL_BRUCH });
    return { positionen, parentel: 3 };
  }

  positionen.push({ bezeichnung: 'Gemeinwesen (Kanton/Gemeinde)', gruppe: 'gemeinwesen', erbteil: EINS, pflichtteil: NULL_BRUCH });
  return { positionen, parentel: 0 };
}

// ─── Pflichtteilsfaktor je Gruppe und Rechtsstand ─────────────────────────

function ptFaktor(gruppe: ErbeGruppe, istLebenderElternteil: boolean, rechtsstand: 'neu' | 'alt'): Bruch {
  if (gruppe === 'ehegatte') return HALB;
  if (gruppe === 'nachkommen') return rechtsstand === 'neu' ? HALB : DREIVIERTEL;
  if (gruppe === 'eltern_stamm' && istLebenderElternteil && rechtsstand === 'alt') return HALB;
  return NULL_BRUCH; // Eltern (neu), Geschwister, 3. Parentel, Gemeinwesen
}

// ─── Güterrechtliche Vorstufe ─────────────────────────────────────────────

function gueterrecht(input: ErbteilungInput): { nachlass?: number; schritt?: Rechenschritt } {
  if (input.nachlassDirekt != null) {
    return {
      nachlass: input.nachlassDirekt,
      schritt: {
        beschreibung: 'Schritt 1 – Nachlass (direkt angegeben)',
        zwischenergebnis: `Nachlass: CHF ${fmtCHF(input.nachlassDirekt)} (güterrechtliche Auseinandersetzung als bereits erfolgt unterstellt).`,
        normen: [],
      },
    };
  }
  if (!input.gueterstand) return {};

  if (input.gueterstand === 'errungenschaftsbeteiligung') {
    if (input.eigengutErblasser == null && input.vorschlagErblasser == null && input.vorschlagUeberlebender == null) return {};
    const eigengut = input.eigengutErblasser ?? 0;
    // B3-01 (Prüfung Rechtslogik 23.9.2026): Art. 210 Abs. 2 ZGB heisst nur, dass
    // der ANDERE Ehegatte keine Hälfte eines Rückschlags trägt. Der Rückschlag des
    // Erblassers bleibt seine Schuld (Art. 202, 209 Abs. 2 ZGB) und mindert den
    // Nachlass voll (Art. 474 Abs. 2, 560 Abs. 2 ZGB); nur ein positiver Vorschlag
    // wird hälftig geteilt (Art. 215 Abs. 1 ZGB). Der Rückschlag des Überlebenden
    // wird nicht übernommen → dort 0.
    const vsERoh = input.vorschlagErblasser ?? 0;
    const rueckschlagE = vsERoh < 0;
    const rueckschlagU = (input.vorschlagUeberlebender ?? 0) < 0;
    const anteilE = rueckschlagE ? vsERoh : vsERoh / 2;
    const vsU = Math.max(0, input.vorschlagUeberlebender ?? 0);
    const nachlass = eigengut + anteilE + vsU / 2;
    return {
      nachlass,
      schritt: {
        beschreibung: 'Schritt 1 – Güterrecht (Errungenschaftsbeteiligung)',
        zwischenergebnis:
          `Nachlass = Eigengut (CHF ${fmtCHF(eigengut)}) ` +
          (rueckschlagE
            ? `− Rückschlag des Erblassers (CHF ${fmtCHF(-vsERoh)}) `
            : `+ 1/2 eigener Vorschlag (CHF ${fmtCHF(anteilE)}) `) +
          `+ güterrechtliche Forderung = 1/2 Vorschlag des Überlebenden (CHF ${fmtCHF(vsU / 2)}) ` +
          `= CHF ${fmtCHF(nachlass)}.` +
          (rueckschlagE
            ? ' Der Rückschlag des Erblassers wird nicht geteilt (Art. 210 Abs. 2 ZGB), bleibt aber seine Schuld und mindert den Nachlass voll (Art. 209 Abs. 2, 474 Abs. 2 ZGB).'
            : '') +
          (rueckschlagU
            ? ' Der Rückschlag des Überlebenden wird nicht berücksichtigt (Art. 210 Abs. 2 ZGB): keine Beteiligungsforderung, der Nachlass übernimmt ihn nicht.'
            : ''),
        normen: rueckschlagE ? [N_215, N_210_2, N_209_2] : [N_215, N_210_2],
      },
    };
  }
  if (input.gueterstand === 'guetertrennung') {
    if (input.vermoegenErblasser == null) return {};
    return {
      nachlass: input.vermoegenErblasser,
      schritt: {
        beschreibung: 'Schritt 1 – Güterrecht (Gütertrennung)',
        zwischenergebnis: `Keine Vorschlagsteilung: das gesamte Vermögen des Erblassers (CHF ${fmtCHF(input.vermoegenErblasser)}) fällt in den Nachlass.`,
        normen: [N_247],
      },
    };
  }
  // Gütergemeinschaft
  if (input.eigengutErblasser == null && input.gesamtgut == null) return {};
  const eigengut = input.eigengutErblasser ?? 0;
  const gesamtgut = input.gesamtgut ?? 0;
  const nachlass = eigengut + gesamtgut / 2;
  return {
    nachlass,
    schritt: {
      beschreibung: 'Schritt 1 – Güterrecht (Gütergemeinschaft)',
      zwischenergebnis: `Nachlass = Eigengut (CHF ${fmtCHF(eigengut)}) + hälftiges Gesamtgut (CHF ${fmtCHF(gesamtgut / 2)}) = CHF ${fmtCHF(nachlass)} (hälftige Teilung mangels abweichender ehevertraglicher Regelung, Art. 241 Abs. 1/2 ZGB).`,
      normen: [N_241, N_221],
    },
  };
}

// ─── Hauptfunktion ────────────────────────────────────────────────────────

export function berechneErbteilung(input: ErbteilungInput): ErbteilungErgebnis {
  if (!Number.isInteger(input.kinderLebend) || input.kinderLebend < 0) {
    throw new Error('Anzahl lebender Kinder muss eine ganze Zahl ≥ 0 sein.');
  }
  for (const s of input.kinderVorverstorben ?? []) {
    if (!Number.isInteger(s.enkel) || s.enkel < 0) throw new Error('Enkel je Stamm muss eine ganze Zahl ≥ 0 sein.');
  }

  const rechenweg: Rechenschritt[] = [];
  const annahmen: string[] = [];
  const warnungen: string[] = [];

  // Rechtsstand (Art. 15/16 SchlT ZGB) – ISO-Vergleich genügt.
  const rechtsstand: 'neu' | 'alt' = input.todesdatum >= '2023-01-01' ? 'neu' : 'alt';
  // Fassungsabhängige Pflichtteils-Normanker (Art. 470/471 ZGB; A5-2): altrechtliche
  // Todesfälle dürfen nicht die nF-Bemerkung zitieren.
  const N470 = rechtsstand === 'neu' ? N_470 : N_470_AF;
  const N471 = rechtsstand === 'neu' ? N_471 : N_471_AF;
  rechenweg.push({
    beschreibung: 'Rechtsstand (Übergangsrecht)',
    zwischenergebnis:
      rechtsstand === 'neu'
        ? `Todesdatum ${input.todesdatum.split('-').reverse().join('.')} ≥ 1.1.2023 → neues Recht: einheitlicher Pflichtteil 1/2 des gesetzlichen Erbanspruchs; Eltern ohne Pflichtteil (BG vom 18.12.2020, AS 2021 312).`
        : `Todesdatum ${input.todesdatum.split('-').reverse().join('.')} ≤ 31.12.2022 → altes Recht: Pflichtteil Nachkommen 3/4, Eltern 1/2, Ehegatte 1/2.`,
    normen: [N_SCHLT, N471],
  });

  // Schritt 1 – Güterrecht
  const g = gueterrecht(input);
  if (g.schritt) rechenweg.push(g.schritt);

  const hatEhe = input.zivilstand !== 'ledig';

  // Schritt 2/3 – Parentel und gesetzliche Erbquoten
  const { positionen, parentel } = verteileQuoten(input, hatEhe);
  const parentelText =
    parentel === 1 ? '1. Parentel (Nachkommen, Art. 457 ZGB); Ehegatte/Partner erhält daneben 1/2 (Art. 462 Ziff. 1).'
    : parentel === 2 ? '2. Parentel (elterlicher Stamm, Art. 458 ZGB); Ehegatte/Partner erhält daneben 3/4 (Art. 462 Ziff. 2).'
    : parentel === 3 ? '3. Parentel (Stamm der Grosseltern, Art. 459 ZGB).'
    : hatEhe ? 'Weder 1. noch 2. Parentel vorhanden → Ehegatte/Partner ist Alleinerbe (Art. 462 Ziff. 3); die 3. Parentel wird verdrängt.'
    : 'Keine erbberechtigten Verwandten (bis 3. Parentel) → Erbschaft fällt an das Gemeinwesen (Art. 466 ZGB).';

  rechenweg.push({
    beschreibung: 'Schritt 2 – Gesetzliche Erbfolge (Parentelsystem)',
    zwischenergebnis:
      parentelText + ' Verteilung: ' +
      positionen.map((p) => `${p.bezeichnung}${p.anzahl ? ` (${p.anzahl} Personen)` : ''}: ${fmtB(p.erbteil)}${p.anzahl ? ' je Person' : ''}`).join('; ') + '.',
    normen: parentel === 1 ? [N_457, ...(hatEhe ? [N_462] : [])]
      : parentel === 2 ? [N_458, ...(hatEhe ? [N_462] : [])]
      : parentel === 3 ? [N_459, N_460]
      : hatEhe ? [N_462] : [N_466],
  });

  // Schritt 4 – Pflichtteile
  // Art. 472 ZGB (Pflichtteilsverlust bei hängigem Scheidungsverfahren) existiert in dieser
  // Fassung erst seit 1.1.2023 (BG vom 18.12.2020, AS 2021 312). Massgebend ist nach Art. 15/16
  // SchlT ZGB das Todesdatum → für altrechtliche Todesfälle (≤ 31.12.2022) greift er NICHT (A5-1).
  const art472 = rechtsstand === 'neu' && hatEhe
    && input.scheidungHaengig === true && input.scheidung472Erfuellt === true;
  if (rechtsstand === 'alt' && hatEhe && input.scheidungHaengig === true && input.scheidung472Erfuellt === true) {
    annahmen.push(
      'Hängiges Scheidungsverfahren bei altrechtlichem Todesfall (≤ 31.12.2022): Der automatische ' +
      'Pflichtteilsverlust nach Art. 472 ZGB gilt erst für Todesfälle ab 1.1.2023 und wird hier daher ' +
      'NICHT angewandt – der überlebende Ehegatte behält seinen altrechtlichen Pflichtteil (1/2).',
    );
  }
  let ptBasis: Position[] = positionen;
  if (art472) {
    // Pflichtteile, «wie wenn der Erblasser nicht verheiratet wäre» (Art. 472 Abs. 2).
    const hypo = verteileQuoten(input, false).positionen;
    const reale = positionen.filter((p) => p.gruppe !== 'ehegatte');
    ptBasis = positionen.map((p) => {
      if (p.gruppe === 'ehegatte') return { ...p };
      const idx = reale.indexOf(p);
      return { ...p, erbteil: hypo[idx]?.erbteil ?? p.erbteil };
    });
    rechenweg.push({
      beschreibung: 'Pflichtteilsverlust im Scheidungsverfahren (Art. 472 ZGB)',
      zwischenergebnis:
        'Hängiges Scheidungs-/Auflösungsverfahren mit erfüllten Voraussetzungen (gemeinsames Begehren oder ≥ 2 Jahre getrennt): ' +
        'Der überlebende Ehegatte/Partner verliert den Pflichtteilsschutz; die Pflichtteile gelten, wie wenn der Erblasser ' +
        'nicht verheiratet wäre (Abs. 2). Der GESETZLICHE Erbanspruch bleibt bis zur Rechtskraft bestehen – ohne Verfügung ' +
        'von Todes wegen erbt der Noch-Ehegatte seinen gesetzlichen Anteil.',
      normen: [N_472],
    });
  }

  const erben: ErbeAnteil[] = positionen.map((p, i) => {
    const faktor = art472 && p.gruppe === 'ehegatte'
      ? NULL_BRUCH
      : ptFaktor(p.gruppe, ptBasis[i].istLebenderElternteil ?? false, rechtsstand);
    const basisErbteil = art472 ? ptBasis[i].erbteil : p.erbteil;
    const { istLebenderElternteil: _drop, ...rest } = p;
    void _drop;
    return { ...rest, pflichtteil: istNull(faktor) ? NULL_BRUCH : mulB(basisErbteil, faktor) };
  });

  const faktorText = rechtsstand === 'neu'
    ? 'Pflichtteil = gesetzlicher Erbteil × 1/2 (Nachkommen und Ehegatte/Partner); Eltern und übrige Verwandte: kein Pflichtteil (Art. 470/471 ZGB).'
    : 'Altes Recht: Nachkommen × 3/4, Ehegatte/Partner × 1/2, Eltern × 1/2; übrige Verwandte: kein Pflichtteil.';
  rechenweg.push({
    beschreibung: 'Schritt 3 – Pflichtteile',
    zwischenergebnis:
      faktorText + ' Ergebnis: ' +
      erben.map((e) => `${e.bezeichnung}: ${fmtB(e.pflichtteil)}${e.anzahl ? ' je Person' : ''}`).join('; ') + '.',
    normen: [N470, N471],
  });

  // Schritt 5 – verfügbare Quote
  const summePt = erben.reduce((acc, e) => addB(acc, mulB(e.pflichtteil, br(e.anzahl ?? 1))), NULL_BRUCH);
  const verfuegbareQuote = subB(EINS, summePt);
  rechenweg.push({
    beschreibung: 'Schritt 4 – Verfügbare Quote',
    zwischenergebnis:
      `Verfügbare Quote = Nachlass − Summe der Pflichtteile = 1 − ${fmtB(summePt)} = ${fmtB(verfuegbareQuote)}. ` +
      'Über diesen Teil kann durch Verfügung von Todes wegen frei verfügt werden; bei Verletzung eines Pflichtteils steht die Herabsetzungsklage offen (Art. 522 ff. ZGB).',
    normen: [N470, N471],
  });

  // Nutzniessungs-Hinweis (Art. 473) bei Ehegatte + Nachkommen
  if (hatEhe && parentel === 1 && rechtsstand === 'neu' && !art472) {
    rechenweg.push({
      beschreibung: 'Alternative: Nutzniessungslösung (Hinweis)',
      zwischenergebnis:
        'Gegenüber GEMEINSAMEN Nachkommen kann dem überlebenden Ehegatten/Partner die Nutzniessung am ganzen ' +
        'ihnen zufallenden Teil zugewendet werden; daneben beträgt der verfügbare Teil die Hälfte des Nachlasses ' +
        '(Art. 473 Abs. 2 ZGB). Bei Wiederverheiratung entfällt die Nutzniessung auf dem Pflichtteilsteil (Abs. 3). Wird hier nicht berechnet.',
      normen: [N_473],
    });
  }

  // ─── Annahmen / Warnungen ───────────────────────────────────────────────

  annahmen.push(
    `Rechtsstand: ${rechtsstand === 'neu' ? 'neues Recht (Tod ab 1.1.2023)' : 'altes Recht (Tod bis 31.12.2022)'} – massgebend ist das Todesdatum (Art. 15/16 SchlT ZGB).`,
    'Eingetragene Partner sind Ehegatten erbrechtlich gleichgestellt (Art. 462 ZGB).',
    'Gleich nahe Verwandte erben zu gleichen Teilen; Eintritt nach Stämmen, subsidiär Anwachsung.',
  );
  if (g.nachlass == null) {
    annahmen.push('Ohne Vermögensangaben werden nur Quoten (Bruchteile des Nachlasses) berechnet.');
  }

  warnungen.push(
    'Der Rechner liefert Quoten bzw. Wertansprüche, nicht die Realteilung einzelner Gegenstände (Art. 522 Abs. 1 ZGB: Pflichtteil ist Wertanspruch).',
    'Pflichtteilsberechnungsmasse: Hinzurechnungen (lebzeitige Zuwendungen Art. 475 ZGB, Versicherungs-/Säule-3a-Ansprüche Art. 476 ZGB) und die Herabsetzungsreihenfolge (Art. 532 ZGB) werden nicht berechnet – bei solchen Sachverhalten Ergebnis fachlich prüfen.',
    'Ausgleichung von Vorempfängen unter Nachkommen (Art. 626 ff. ZGB) kann die effektive Teilung verschieben und ist hier nicht modelliert.',
    'Internationale Sachverhalte (Art. 86 ff. IPRG, professio iuris) können anderes Recht zur Anwendung bringen.',
  );
  if (rechtsstand === 'neu') {
    warnungen.push(
      'Bei Verfügungen von Todes wegen, die VOR dem 1.1.2023 errichtet wurden, ist durch Auslegung zu ermitteln, ob alte oder neue Quoten gemeint sind (abstrakte Pflichtteils-Verweisungen führen im Zweifel zu den neuen Quoten; fixe Bruchangaben bleiben grundsätzlich bestehen).',
    );
  }
  // Gegenprüfung 2.7.2026: Diese Warnung nur im neuen Recht (Tod ab 1.1.2023).
  // Art. 472 ZGB nF existiert erst seit 1.1.2023 (BG vom 18.12.2020, AS 2021 312);
  // die aF wurde 1988 aufgehoben (AS 1986 122). Für altrechtliche Todesfälle mit
  // hängiger Scheidung UND erfüllten Voraussetzungen trägt bereits die Annahme
  // (oben) die korrekte Begründung; die «OHNE erfüllte Voraussetzungen»-Warnung
  // hätte ihr widersprochen. Quelle: Fedlex SR 210, Konsolidierung 1.7.2026 i.V.m.
  // Art. 15/16 SchlT ZGB.
  if (rechtsstand === 'neu' && hatEhe && input.scheidungHaengig && !art472) {
    warnungen.push(
      'Hängiges Scheidungsverfahren OHNE erfüllte Voraussetzungen von Art. 472 ZGB: Erbrecht UND Pflichtteilsschutz des Ehegatten/Partners bestehen unverändert weiter.',
    );
  }
  if (parentel === 3) {
    warnungen.push('Die Aufteilung innerhalb der 3. Parentel (Linien/Stämme der Grosseltern, Art. 459 ZGB) wird nicht im Detail berechnet.');
  }

  const normverweise: Normverweis[] = [
    ...(parentel === 1 ? [N_457] : parentel === 2 ? [N_458] : parentel === 3 ? [N_459, N_460] : []),
    ...(hatEhe ? [N_462] : []),
    ...(parentel === 0 && !hatEhe ? [N_466] : []),
    N470, N471,
    ...(art472 ? [N_472] : []),
    N_SCHLT,
  ];

  // Ergebnistext
  const titelzeile = erben
    .map((e) => `${e.bezeichnung}${e.anzahl ? ` (je)` : ''}: Erbteil ${fmtB(e.erbteil)}, Pflichtteil ${fmtB(e.pflichtteil)}`)
    .join(' · ');

  // CHF-Beträge GENAU EINMAL hier rechnen (Ultra-Review NIEDRIG 7.6.2026,
  // §3/§5): UI und PDF rendern nur noch — keine Quote-×-Nachlass-Arithmetik
  // mehr in der Darstellungsschicht.
  const chf = (b: { z: number; n: number }) =>
    g.nachlass != null ? (b.z / b.n) * g.nachlass : undefined;
  const erbenMitChf = erben.map((e) => ({
    ...e,
    erbteilChf: chf(e.erbteil),
    pflichtteilChf: chf(e.pflichtteil),
  }));

  return {
    ergebnis: `Verfügbare Quote: ${fmtB(verfuegbareQuote)}${g.nachlass != null ? ` (CHF ${fmtCHF((verfuegbareQuote.z / verfuegbareQuote.n) * g.nachlass)})` : ''}. ${titelzeile}.`,
    status: 'ok',
    rechenweg,
    annahmen,
    warnungen,
    normverweise,
    rechtsstand,
    erben: erbenMitChf,
    verfuegbareQuote,
    nachlassChf: g.nachlass,
    verfuegbareQuoteChf: chf(verfuegbareQuote),
  };
}
