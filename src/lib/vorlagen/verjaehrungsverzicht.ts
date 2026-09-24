// Dossier: bibliothek/recherche/wettbewerbsanalyse-rechtswissen-schweizer-vertraege.md
import type { VorlageSchema, Antworten, Baustein } from './engine';
import { assemble } from './engine';
import { fmtDatum, fmtCHF, zahl } from './datum';
import { istGueltigesISO } from '../datumsUtils';
import {
  type KdgBasisAntworten, KDG_BASIS_DEFAULTS, kdgBasisAbgeleitet,
  kdgDatumzeile, kdgSchluss,
} from './kuendigungGemeinsam';

// ─── Verjährungsverzichtserklärung (Art. 141 OR) ────────────────────────────
//
// P1-Vorlage der Wettbewerbsanalyse 12.6.2026 (FAHRPLAN-VORLAGEN-AUSBAU V2).
// Wortlaut am Filestore-Cache verifiziert (12.6.2026, OR-Konsolidierung
// 20260101): Art. 141 Abs. 1 («Der Schuldner kann ab Beginn der Verjährung
// jeweils für höchstens zehn Jahre auf die Erhebung der Verjährungseinrede
// verzichten»), Abs. 1bis (SCHRIFTFORM; in AGB kann nur der VERWENDER
// verzichten), Abs. 2 (Verzicht eines Solidarschuldners wirkt nicht gegen
// die übrigen), Abs. 3 (dito unteilbare Leistung; Bürge beim Verzicht des
// Hauptschuldners), Abs. 4 (Versicherer bei direktem Forderungsrecht).
//
// Fachliche Festlegungen:
// - ABSENDER ist die SCHULDNERSEITE (nur der Schuldner kann verzichten).
// - «Ab Beginn der Verjährung» in Art. 141 Abs. 1 OR regelt, AB WANN
//   verzichtet werden DARF (Zulässigkeit), nicht den Lauf der zehn Jahre.
//   Die Höchstdauer gilt je Verzicht; ob sie ab der Erklärung oder ab dem
//   Verjährungseintritt läuft, lässt das Gesetz bewusst offen (Botschaft
//   BBl 2014 235, S. 262: Auslegung der Erklärung). Die Vorlage schliesst
//   diese Frage durch die Erklärung selbst (Entscheid David 24.9.2026, W-06
//   «Vorlage B»; Befund VB-01 Prüfung Rechtslogik 23.9.2026): «mit Wirkung
//   ab dem Datum dieser Erklärung bis …, längstens jedoch für zehn Jahre ab
//   dem Datum dieser Erklärung». Die frühere Klausel «zehn Jahre ab Beginn
//   der Verjährung» hatte keine amtliche Stütze und hob bei zehnjähriger
//   Frist (Art. 127 OR) den Verzicht wörtlich auf (Fall V6).
// - Blocker: Enddatum mehr als zehn Jahre nach dem ERKLÄRUNGSDATUM — mit der
//   Formulierung ab Erklärung ist die Grenze damit exakt (Fristende nach
//   Art. 77 Abs. 1 Ziff. 3 i.V.m. Abs. 2 OR: Tag gleicher Zahl).
// - Der Standard-Vorbehalt «soweit nicht bereits eingetreten» und die
//   Klarstellung «keine Anerkennung» (Abregrenzung zu Art. 135 Ziff. 1 OR)
//   sind Praxis-Standard und abwählbar.

export type VvAntworten = KdgBasisAntworten & {
  forderungBeschrieb: string;     // z. B. «Werklohnforderung aus Werkvertrag vom …»
  betragErfassen: boolean;
  betrag: string;                 // CHF, optional (Nutzer-String)
  verzichtBis: string;            // ISO — Ende des Verzichts
  vorbehaltEingetreten: boolean;  // «soweit nicht bereits eingetreten»
  keineAnerkennung: boolean;      // Abgrenzung Art. 135 Ziff. 1 OR
};

export const VV_DEFAULTS: VvAntworten = {
  ...KDG_BASIS_DEFAULTS,
  forderungBeschrieb: '',
  betragErfassen: false, betrag: '',
  verzichtBis: '',
  vorbehaltEingetreten: true,
  keineAnerkennung: true,
};

// ── Gates/Hinweise (deterministisch, normverifiziert) ───────────────────────

export type VvGateErgebnis = { blocker: string[]; warnungen: string[]; hinweise: string[] };

/** Höchstdauer-Vergleich als reine ISO-String-Arithmetik (Jahr + 10), keine
 *  Date-Objekte (Datums-Konvention; lexikografischer Vergleich genügt). */
function vvUeberHoechstdauer(datumISO: string, verzichtBisISO: string): boolean {
  if (!istGueltigesISO(datumISO) || !istGueltigesISO(verzichtBisISO)) return false;
  const max = `${Number(datumISO.slice(0, 4)) + 10}${datumISO.slice(4)}`;
  return verzichtBisISO > max;
}

export function pruefeVvGates(a: VvAntworten): VvGateErgebnis {
  const blocker: string[] = [];
  const warnungen: string[] = [];
  const hinweise: string[] = [];

  if (istGueltigesISO(a.verzichtBis) && istGueltigesISO(a.datum) && a.verzichtBis <= a.datum) {
    blocker.push('Das Verzichts-Ende muss nach dem Erklärungsdatum liegen.');
  }
  if (vvUeberHoechstdauer(a.datum, a.verzichtBis)) {
    blocker.push(
      'Das gewählte Ende liegt mehr als zehn Jahre nach dem Erklärungsdatum – ein Verzicht ist '
      + 'jeweils für höchstens zehn Jahre zulässig (Art. 141 Abs. 1 OR), und diese Erklärung '
      + 'rechnet sie ab ihrem Datum. Enddatum kürzen; ein späterer ERNEUTER Verzicht bleibt '
      + 'möglich («jeweils»).',
    );
  }
  hinweise.push(
    'Ein Verzicht ist erst ab Beginn der Verjährung zulässig; die Höchstdauer von zehn Jahren '
    + 'gilt je Verzicht (Art. 141 Abs. 1 OR). Ob sie ab der Erklärung oder ab dem '
    + 'Verjährungseintritt zu rechnen ist, lässt das Gesetz bewusst offen (Botschaft BBl 2014 235, '
    + 'S. 262) – die Erklärung legt den Beginn darum selbst fest: mit Wirkung ab dem Datum dieser '
    + 'Erklärung, längstens zehn Jahre ab diesem Datum. Der Verzicht kann später erneuert werden '
    + '(«jeweils»).',
  );
  hinweise.push(
    'SCHRIFTFORM ist Gültigkeitsvoraussetzung (Art. 141 Abs. 1bis OR) – drucken und von der '
    + 'Schuldnerseite unterschreiben lassen. In allgemeinen Geschäftsbedingungen kann nur der '
    + 'VERWENDER der AGB verzichten.',
  );
  hinweise.push(
    'Wirkungsgrenzen: Der Verzicht eines Solidarschuldners kann den übrigen Solidarschuldnern '
    + 'nicht entgegengehalten werden (Art. 141 Abs. 2 OR); dasselbe gilt unter Schuldnern einer '
    + 'unteilbaren Leistung und für den Bürgen beim Verzicht des Hauptschuldners (Abs. 3). '
    + 'Bei direktem Forderungsrecht gegen einen Versicherer wirkt der Verzicht auch ihm '
    + 'gegenüber und umgekehrt (Abs. 4).',
  );
  return { blocker, warnungen, hinweise };
}

// ── Brief-Anatomie ──────────────────────────────────────────────────────────

const vvAbsender: Baustein = {
  id: 'VV_absender', rolle: 'absender', text: '{{absenderBlock}}',
  begruendung: 'Schuldnerin/Schuldner als erklärende Partei – nur sie kann verzichten (Art. 141 Abs. 1 OR).',
};
const vvAdressat: Baustein = {
  id: 'VV_adressat', rolle: 'adressat', text: '{{adressatBlock}}',
  begruendung: 'Gläubigerin/Gläubiger als Empfänger der Erklärung.',
};
const vvUnterschrift: Baustein = {
  id: 'VV_unterschrift', rolle: 'unterschrift',
  text: '___________________________\n{{absenderName}}',
  begruendung: 'Unterschrift der Schuldnerseite – Schriftform ist Gültigkeitsvoraussetzung (Art. 141 Abs. 1bis OR).',
};

// ── Schema ──────────────────────────────────────────────────────────────────

export const VV_SCHEMA: VorlageSchema = {
  id: 'verjaehrungsverzicht',
  format: 'eingabe',
  ausgabeArt: 'fertig',
  version: '1.1.0 (Wettbewerbsanalyse V2; Art. 141 OR verifiziert 20260101; VB-01 Laufbeginn ab Erklärung)',
  titel: 'Verjährungsverzichtserklärung',
  disclaimer:
    'Erstellt mit LexMetrik. Keine Rechtsberatung. Der Verzicht gilt längstens zehn Jahre ab '
    + 'dem Datum der Erklärung (Art. 141 Abs. 1 OR); massgebend sind Gesetz und konkreter '
    + 'Sachverhalt.',
  bausteine: [
    vvAbsender,
    vvAdressat,
    kdgDatumzeile('VV_datumzeile'),
    { id: 'VV_betreff', rolle: 'betreff',
      text: 'Verzicht auf die Einrede der Verjährung – {{forderungBeschrieb}}',
      begruendung: 'Betreff mit bestimmter Bezeichnung der Forderung.' },
    { id: 'VV_anrede', rolle: 'anrede', text: 'Sehr geehrte Damen und Herren',
      begruendung: 'Anrede – immer enthalten.' },
    { id: 'VV_verzicht',
      text: 'Hinsichtlich Ihrer Forderung ({{forderungBeschrieb}}{{betragSatz}}) verzichte ich '
        + 'hiermit mit Wirkung ab dem Datum dieser Erklärung bis zum {{verzichtBisFmt}} auf die '
        + 'Erhebung der Einrede der Verjährung, längstens jedoch für zehn Jahre ab dem Datum '
        + 'dieser Erklärung (Art. 141 Abs. 1 OR).',
      norm: 'Art. 141 Abs. 1 OR',
      begruendung: 'Kern der Erklärung: befristeter Einredeverzicht; die Erklärung legt den Beginn selbst auf ihr Datum fest (das Gesetz lässt ihn offen, BBl 2014 235, S. 262) und begrenzt sich auf zehn Jahre ab diesem Datum – das Dokument hält die Höchstdauer des Art. 141 Abs. 1 OR damit unter jeder Lesart ein.' },
    { id: 'VV_vorbehalt',
      text: 'Dieser Verzicht gilt nur, soweit die Verjährung im Zeitpunkt des Zugangs dieser Erklärung nicht bereits eingetreten ist.',
      includeIf: { feld: 'vorbehaltEingetreten', eq: true },
      begruendung: 'Praxis-Standard: bereits eingetretene Verjährung bleibt vorbehalten (ein nachträglicher Verzicht auf die bereits eingetretene Verjährung wäre eine weitergehende Erklärung).' },
    { id: 'VV_keine_anerkennung',
      text: 'Mit dieser Erklärung ist keine Anerkennung der Forderung im Sinne von Art. 135 Ziff. 1 OR und keine Anerkennung ihres Bestands oder ihrer Höhe verbunden.',
      includeIf: { feld: 'keineAnerkennung', eq: true },
      norm: 'Art. 135 Ziff. 1 OR',
      begruendung: 'Abgrenzung zur verjährungsunterbrechenden Anerkennung – der Verzicht auf die Einrede ist keine Anerkennung der Forderung; die Klarstellung verhindert die gegenteilige Deutung.' },
    kdgSchluss('VV_schluss'),
    vvUnterschrift,
  ],
};

// ── Zusammenstellung ────────────────────────────────────────────────────────
//
// Blanko-Grundsatz (Daueranweisung David 12.6.2026: Vorlagen auch unausgefüllt
// herunterladbar): leere Pflicht-Platzhalter füllt die ENGINE als «________»;
// optionale Fragmente enden auf «…Satz» und verschwinden leer (Konvention
// engine.ts formatiere()).

export function vvZusammenstellen(a: VvAntworten) {
  const betragFmt = zahl(a.betrag) !== null ? fmtCHF(a.betrag) : '________';
  const antworten: Antworten = {
    ...a,
    ...kdgBasisAbgeleitet(a),
    betragSatz: a.betragErfassen ? `, CHF ${betragFmt}` : '',
    verzichtBisFmt: istGueltigesISO(a.verzichtBis) ? fmtDatum(a.verzichtBis) : '',
  };
  return { ergebnis: assemble(VV_SCHEMA, antworten) };
}
