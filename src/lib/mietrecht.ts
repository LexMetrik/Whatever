// Dossier: bibliothek/recherche/mietrecht-ausbau.md
import { parseISO, addDays, addMonths, lastDayOfMonth, isLastDayOfMonth, isBefore, isAfter } from 'date-fns';
import type { Normverweis, Rechenschritt } from '../types/legal';
import { formatDatum, formatISO } from './datumsUtils';
import type { MietInput, MietErgebnis, Mietobjekt, TerminQuelle } from '../types/mietrecht';
import { ORTSUEBLICHE_TERMINE } from '../data/mietTermine';
import { naechsterWerktag } from '../data/zpoFeiertage';
import { rechtsprechung } from '../data/verifikation';

// ─── Mietrecht: Kündigungstermine und -fristen (Art. 253 ff. OR) ──────────
//
// Kernalgorithmus (Konzept-Empfehlung 1): Objekttyp → Mindestfrist;
// Termin-Hierarchie Vertrag → Ortsgebrauch → gesetzliche Auffangregel;
// Zieltermin = frühester Termin mit Zugang ≤ (Termin − Frist); bei Verfehlen
// nächstmöglicher Termin (Art. 266a Abs. 2 OR).
//
// Art. 78 OR (Werktagsverschiebung) gilt WEDER für den spätesten Zustelltag
// NOCH für den Endtermin des Mietverhältnisses (F4-01, W2·30-RL-W1; Detail
// bei spaetesterZugangFuer). Angewandt wird er nur auf echte Fristenden
// (Zahlungsfrist Art. 257d, Anfechtung/Erstreckung Art. 273 OR).
//
// VERIFY: Wortlaute der zitierten OR-Artikel vor Produktivschaltung auf
// Fedlex SR 220 endkontrollieren; ortsübliche Termine sind Tatfrage.

const N_266a: Normverweis = { artikel: 'Art. 266a OR', bemerkung: 'Fristen/Termine; bei Verfehlen Wirkung auf den nächstmöglichen Termin (Abs. 2)' };
const N_266b: Normverweis = { artikel: 'Art. 266b OR', bemerkung: 'Unbewegliche Sachen/Fahrnisbauten: 3 Monate' };
const N_266c: Normverweis = { artikel: 'Art. 266c OR', bemerkung: 'Wohnungen: 3 Monate' };
const N_266d: Normverweis = { artikel: 'Art. 266d OR', bemerkung: 'Geschäftsräume: 6 Monate' };
const N_266e: Normverweis = { artikel: 'Art. 266e OR', bemerkung: 'Möblierte Zimmer/Einstellplätze: 2 Wochen auf Ende einer einmonatigen Mietdauer' };
const N_266f: Normverweis = { artikel: 'Art. 266f OR', bemerkung: 'Bewegliche Sachen: 3 Tage auf beliebigen Zeitpunkt' };
const N_266g: Normverweis = { artikel: 'Art. 266g OR', bemerkung: 'Wichtige Gründe: gesetzliche Frist auf beliebigen Zeitpunkt' };
const N_266i: Normverweis = { artikel: 'Art. 266i OR', bemerkung: 'Tod des Mieters: Erben mit gesetzlicher Frist auf nächsten gesetzlichen Termin' };
const N_266k: Normverweis = { artikel: 'Art. 266k OR', bemerkung: 'Konsumgütermiete: 30 Tage auf Ende einer dreimonatigen Mietdauer' };
const N_266l: Normverweis = { artikel: 'Art. 266l OR', bemerkung: 'Schriftform; Vermieter: amtlich genehmigtes Formular' };
const N_266m: Normverweis = { artikel: 'Art. 266m OR', bemerkung: 'Familienwohnung: Kündigung des Mieters nur mit Zustimmung des Ehegatten' };
const N_266n: Normverweis = { artikel: 'Art. 266n OR', bemerkung: 'Familienwohnung: separate Zustellung an beide Ehegatten' };
const N_266o: Normverweis = { artikel: 'Art. 266o OR', bemerkung: 'Nichtigkeit bei Formverstoss' };
const N_257d: Normverweis = { artikel: 'Art. 257d OR', bemerkung: 'Zahlungsverzug: Frist ≥ 30 Tage, dann Kündigung ≥ 30 Tage auf Monatsende' };
const N_257f: Normverweis = { artikel: 'Art. 257f OR', bemerkung: 'Pflichtverletzung: ≥ 30 Tage auf Monatsende (Abs. 3); fristlos bei vorsätzlich schwerer Schädigung (Abs. 4)' };
const N_261: Normverweis = { artikel: 'Art. 261 OR', bemerkung: 'Eigentümerwechsel: dringender Eigenbedarf, gesetzliche Frist auf nächsten gesetzlichen Termin' };
const N_273: Normverweis = { artikel: 'Art. 273 OR', bemerkung: 'Anfechtung/Erstreckung: 30 Tage ab Empfang (Schlichtungsbehörde)' };
const N_272a: Normverweis = { artikel: 'Art. 272a OR', bemerkung: 'Erstreckung ausgeschlossen (u.a. Art. 257d/257f/266h)' };
const N_77: Normverweis = { artikel: 'Art. 77 OR', bemerkung: 'Fristberechnung (Tage/Wochen/Monate)' };
const N_78: Normverweis = { artikel: 'Art. 78 OR', bemerkung: 'Letzter Fristtag an Sa/So/Feiertag → nächster Werktag (nur Fristwahrung)' };

const fmt = formatDatum;
const iso = formatISO;
const leq = (a: Date, b: Date) => !isAfter(a, b);

// Gesetzliche Mindestfrist je Objekt (Konzept-Übersichtstabelle).
const FRIST: Record<Mietobjekt, { monate?: number; tage?: number; norm: Normverweis }> = {
  wohnung: { monate: 3, norm: N_266c },
  geschaeftsraum: { monate: 6, norm: N_266d },
  unbewegliche_sache: { monate: 3, norm: N_266b },
  moebliertes_zimmer: { tage: 14, norm: N_266e },
  bewegliche_sache: { tage: 3, norm: N_266f },
};

// Gesetzliche Auffangregel: Ende einer X-monatigen Mietdauer ab Mietbeginn.
const AUFFANG_MONATE: Record<Mietobjekt, number> = {
  wohnung: 3, geschaeftsraum: 3, unbewegliche_sache: 6, moebliertes_zimmer: 1, bewegliche_sache: 0,
};

const OBJEKT_LABEL: Record<Mietobjekt, string> = {
  wohnung: 'Wohnräume', geschaeftsraum: 'Geschäftsräume', unbewegliche_sache: 'Unbewegliche Sache/Fahrnisbaute',
  moebliertes_zimmer: 'Möbliertes Zimmer / Einstellplatz', bewegliche_sache: 'Bewegliche Sache',
};

// Art. 78 OR: fällt der LETZTE Tag einer Frist auf Sa/So/Feiertag, gilt der
// nächste Werktag (Samstag gleichgestellt, SR 173.110.3).
function werktagOderNaechster(d: Date, kanton: MietInput['kanton']): { tag: Date; verschoben: boolean } {
  const tag = naechsterWerktag(d, kanton);
  return { tag, verschoben: +tag !== +d };
}

// Spätester rechtzeitiger Zugang für einen Termin T — OHNE Art. 78 OR.
// Art. 78 Abs. 1 OR verschiebt nur den «Zeitpunkt der Erfüllung oder den
// letzten Tag einer Frist». Die Kündigungsfrist (Art. 266a Abs. 1, 266b–266e
// OR) endet am Termin; der späteste Zugangstag ist der Tag VOR ihrem Beginn,
// kein Fristende. Fällt er auf Sa/So/Feiertag, muss die Kündigung trotzdem an
// diesem Tag (bzw. früher) zugehen; ein Zugang am nächsten Werktag verkürzt
// die gesetzliche Mindestfrist und wirkt auf den nächstmöglichen Termin
// (Art. 266a Abs. 2 OR). BGE 148 III 126 E. 5.2.9 lässt die Anwendung von
// Art. 78 OR selbst auf ein vorwärts laufendes Probezeitende offen; eine
// BGer-Stütze für die Verschiebung des Zugangstags gibt es nicht (Prüfung
// Rechtslogik 23.9.2026, Befund F4-01 + Zweitprüfung V1).
// Quelle: Fedlex SR 220, Art. 77/78/266a–266e OR, Stand 1.1.2026,
// https://www.fedlex.admin.ch/eli/cc/27/317_321_377/de (Wortlaut aus dem Repo-Cache public/normtext/bund/OR.json, abgerufen 14.9.2026).
// Monatsfristen: Es müssen FRIST volle Monate vor dem Termin liegen (Beispiel
// Konzept §E: Termin 31.12., 3 Monate → Zugang spätestens 30.9.). Gerechnet
// wird deshalb vom Folgetag des Termins zurück (Termin 30.6., 3 Monate →
// 31.3., NICHT 30.3. – addMonths allein klemmt am kürzeren Monat).
function spaetesterZugangFuer(T: Date, frist: { monate?: number; tage?: number }): Date {
  return frist.monate != null
    ? addDays(addMonths(addDays(T, 1), -frist.monate), -1)
    : addDays(T, -(frist.tage ?? 0));
}

// Ende der k-ten Mietdauer-Periode ab Mietbeginn. Bei Mietbeginn am
// Monatsletzten endet die Periode am Monatsende (31.1. + 3 Monate → 30.4.,
// nicht 29.4. – addMonths-Klemmung würde sonst um 1–3 Tage driften).
function periodenEnde(beginn: Date, monate: number): Date {
  return isLastDayOfMonth(beginn)
    ? lastDayOfMonth(addMonths(beginn, monate))
    : addDays(addMonths(beginn, monate), -1);
}

// Kandidaten-Termine gemäss Quelle (aufsteigend, ab dem Zugangsmonat).
function kandidaten(input: MietInput, quelle: TerminQuelle, zugang: Date): Date[] {
  const out: Date[] = [];
  if (quelle === 'gesetzlich') {
    if (!input.mietbeginn) throw new Error('Für die gesetzliche Auffangregel wird der Mietbeginn benötigt.');
    const beginn = parseISO(input.mietbeginn);
    const periode = AUFFANG_MONATE[input.objekt] || 3;
    for (let k = 1; k <= 600; k++) {
      const t = periodenEnde(beginn, k * periode);
      if (isBefore(t, zugang)) continue;
      out.push(t);
      if (out.length >= 24) break;
    }
    return out;
  }
  // Monatsenden-Quellen
  let erlaubt: (monat: number) => boolean;
  if (quelle === 'vertraglich_monate') {
    const set = new Set(input.vertragsTermineMonate ?? []);
    if (set.size === 0) throw new Error('Bitte die vertraglich vereinbarten Kündigungstermine (Monate) angeben.');
    erlaubt = (m) => set.has(m);
  } else if (quelle === 'jedes_monatsende') {
    erlaubt = (m) => !(input.dezemberAusgeschlossen && m === 12);
  } else {
    // ortsüblich
    const o = ORTSUEBLICHE_TERMINE[input.kanton];
    if (o.typ === 'monatsenden') { const set = new Set(o.monate); erlaubt = (m) => set.has(m); }
    else if (o.typ === 'monatsende_ausser_dez') erlaubt = (m) => m !== 12;
    else throw new Error('ORTSGEBRAUCH_UNBEKANNT');
  }
  for (let i = 0; i < 60; i++) {
    const t = lastDayOfMonth(addMonths(zugang, i));
    if (isBefore(t, zugang)) continue;
    if (erlaubt(t.getMonth() + 1)) out.push(t);
    if (out.length >= 24) break;
  }
  return out;
}

// ─── Hauptfunktion ────────────────────────────────────────────────────────

export function berechneMietkuendigung(input: MietInput): MietErgebnis {
  const rechenweg: Rechenschritt[] = [];
  const annahmen: string[] = [];
  const warnungen: string[] = [];

  const zugang = parseISO(input.zugang);
  const istRaum = input.objekt === 'wohnung' || input.objekt === 'geschaeftsraum';

  // ── Form / Nichtigkeit (Wohn-/Geschäftsräume, Art. 266l–266o) ──
  if (istRaum && ['ordentlich', 'zahlungsverzug', 'pflichtverletzung', 'wichtige_gruende', 'eigenbedarf'].includes(input.kuendigungsart)) {
    const maengel: string[] = [];
    if (input.partei === 'vermieter' && input.amtlichesFormular === false) {
      maengel.push('Vermieterkündigung ohne amtlich genehmigtes Formular (Art. 266l Abs. 2 OR)');
    }
    if (input.familienwohnung && input.partei === 'vermieter' && input.separateZustellung === false) {
      maengel.push('Familienwohnung: keine separate Zustellung an beide Ehegatten/Partner (Art. 266n OR)');
    }
    if (input.familienwohnung && input.partei === 'mieter' && input.zustimmungEhegatte === false) {
      maengel.push('Familienwohnung: Kündigung des Mieters ohne ausdrückliche Zustimmung des Ehegatten/Partners (Art. 266m OR)');
    }
    if (maengel.length > 0) {
      rechenweg.push({
        beschreibung: 'Formprüfung (Art. 266l–266o OR)',
        zwischenergebnis: `Formverstoss: ${maengel.join('; ')}. Die Kündigung ist NICHTIG (Art. 266o OR) und entfaltet keine Wirkung.`,
        normen: [N_266l, N_266m, N_266n, N_266o],
        rechtsprechung: [rechtsprechung('BGE_137_III_208')],
      });
      warnungen.push('Eine nichtige Kündigung kann formgerecht wiederholt werden; Fristen laufen erst ab der neuen, gültigen Kündigung.');
      return {
        ergebnis: 'Die Kündigung ist NICHTIG (Art. 266o OR): ' + maengel.join('; ') + '.',
        status: 'nichtig',
        rechenweg, annahmen, warnungen,
        normverweise: [N_266l, N_266o],
        zugangISO: iso(zugang),
      };
    }
  }

  rechenweg.push({
    beschreibung: 'Zugang der Kündigung',
    zwischenergebnis:
      `Zugang am ${fmt(zugang)} (absolute Empfangstheorie: massgeblich ist der Eintritt in den Machtbereich des Empfängers; ` +
      'bei eingeschriebener Sendung mit Abholungseinladung in der Regel der Folgetag der Einladung. Die zivilprozessuale ' +
      '7-Tage-Zustellfiktion gilt im materiellen Recht NICHT).',
    normen: [],
    rechtsprechung: [rechtsprechung('BGE_137_III_208'), rechtsprechung('BGE_140_III_244')],
  });

  // ── Sonderpfade ohne Terminsuche ──
  const frist = FRIST[input.objekt];

  if (input.kuendigungsart === 'wichtige_gruende') {
    const ende = frist.monate != null ? addMonths(zugang, frist.monate) : addDays(zugang, frist.tage ?? 0);
    rechenweg.push({
      beschreibung: 'Ausserordentliche Kündigung aus wichtigen Gründen (Art. 266g OR)',
      zwischenergebnis:
        `Kündigung mit der GESETZLICHEN Frist (${frist.monate != null ? `${frist.monate} Monate` : `${frist.tage} Tage`}) auf einen ` +
        `BELIEBIGEN Zeitpunkt: Ende am ${fmt(ende)} (Art. 77 OR: gleichbezeichneter Tag; Praxis BGer 5A_691/2023: Anknüpfung am Ereignistag). ` +
        'Voraussetzung ist die Unzumutbarkeit der Vertragserfüllung – die Rechtsprechung ist streng; der Richter regelt die vermögensrechtlichen Folgen (Abs. 2).',
      normen: [N_266g, N_77],
      rechtsprechung: [rechtsprechung('BGer_4C_375_2000'), rechtsprechung('BGer_5A_691_2023')],
    });
    warnungen.push('Wichtige Gründe (Art. 266g OR) sind restriktiv anerkannt (z. B. ernsthafte Krankheit); blosse berufliche Versetzung genügt nach der Praxis nicht.');
    return abschluss(input, zugang, ende, undefined, undefined, rechenweg, annahmen, warnungen, [N_266g, N_77]);
  }

  if (input.kuendigungsart === 'zahlungsverzug' || input.kuendigungsart === 'pflichtverletzung') {
    if (!istRaum) {
      warnungen.push('Bei anderen Objekten als Wohn-/Geschäftsräumen ist die Kündigung nach Art. 257d Abs. 2 / 257f OR fristlos möglich – dieser Rechner berechnet hier kein Datum.');
    }
    let zahlungsfristEnde: Date | undefined;
    if (input.kuendigungsart === 'zahlungsverzug' && input.zahlungsaufforderungZugang) {
      const za = parseISO(input.zahlungsaufforderungZugang);
      // Bug-Audit 19.6.2026 (H4): Art. 257d Abs. 1 OR — «mindestens zehn Tage, bei
      // Wohn- und Geschäftsräumen mindestens 30 Tage». Nicht-Raum-Objekte: 10 Tage.
      const zfTage = istRaum ? 30 : 10;
      const zfRoh = addDays(za, zfTage);
      const zf = werktagOderNaechster(zfRoh, input.kanton);
      zahlungsfristEnde = zf.tag;
      rechenweg.push({
        beschreibung: 'Stufe 1 – Zahlungsfrist (Art. 257d Abs. 1 OR)',
        zwischenergebnis:
          `Zugang der Zahlungsaufforderung am ${fmt(za)} (RELATIVE Empfangstheorie – der ganze Fristbeginn muss dem Mieter zugutekommen). ` +
          `Zahlungsfrist mindestens ${zfTage} Tage: läuft bis ${fmt(zahlungsfristEnde)}${zf.verschoben ? ' (Art. 78 OR: Verschiebung auf den nächsten Werktag)' : ''}. ` +
          'Mit Androhung der Kündigung; bei Familienwohnung separat an beide Ehegatten (Art. 266n OR).',
        normen: [N_257d, N_77, N_78],
        rechtsprechung: [rechtsprechung('BGE_119_II_147')],
      });
    }
    const basis = addDays(zugang, 30);
    const ende = lastDayOfMonth(basis); // stets ≥ basis → «30 Tage auf Ende eines Monats» gewahrt
    const norm = input.kuendigungsart === 'zahlungsverzug' ? N_257d : N_257f;
    rechenweg.push({
      beschreibung: input.kuendigungsart === 'zahlungsverzug'
        ? 'Stufe 2 – Kündigung (Art. 257d Abs. 2 OR)'
        : 'Kündigung nach schriftlicher Mahnung (Art. 257f Abs. 3 OR)',
      zwischenergebnis:
        `Bei Wohn-/Geschäftsräumen: Kündigung mit mindestens 30 Tagen auf das Ende eines Monats. ` +
        `Zugang ${fmt(zugang)} + 30 Tage = ${fmt(basis)} → wirksam auf ${fmt(ende)}.` +
        (input.kuendigungsart === 'pflichtverletzung' ? ' Bei vorsätzlicher schwerer Schädigung ist die fristlose Kündigung möglich (Abs. 4).' : ''),
      normen: [norm, N_77],
    });
    warnungen.push('Die Erstreckung des Mietverhältnisses ist bei Kündigung nach Art. 257d/257f OR ausgeschlossen (Art. 272a OR).');
    return abschluss(input, zugang, istRaum ? ende : undefined, undefined, zahlungsfristEnde, rechenweg, annahmen, warnungen, [norm, N_272a, N_77], true);
  }

  if (input.kuendigungsart === 'konsumgueter') {
    if (!input.mietbeginn) throw new Error('Art. 266k OR: Bitte den Mietbeginn angeben (Ende einer dreimonatigen Mietdauer).');
    const beginn = parseISO(input.mietbeginn);
    const fruehestens = addDays(zugang, 30);
    let ende: Date | null = null;
    for (let k = 1; k <= 600; k++) {
      const t = periodenEnde(beginn, k * 3);
      if (leq(fruehestens, t)) { ende = t; break; }
    }
    rechenweg.push({
      beschreibung: 'Konsumgütermiete (Art. 266k OR)',
      zwischenergebnis:
        `Der Mieter kann mit mindestens 30 Tagen auf das Ende einer dreimonatigen Mietdauer kündigen – auch bei längerer vereinbarter Dauer; ` +
        `der Vermieter hat keinen Entschädigungsanspruch. Zugang ${fmt(zugang)} + 30 Tage = ${fmt(fruehestens)} → Ende am ${fmt(ende!)}.`,
      normen: [N_266k, N_77],
    });
    return abschluss(input, zugang, ende!, undefined, undefined, rechenweg, annahmen, warnungen, [N_266k, N_77], true);
  }

  // ── Ordentliche Kündigung / Tod / Eigenbedarf (Terminsuche) ──

  // Frist bestimmen (Art. 266a Abs. 1: länger zulässig, kürzer nichtig).
  let fristEff = { ...frist };
  const sonderGesetzlich = input.kuendigungsart === 'tod_mieter' || input.kuendigungsart === 'eigenbedarf';
  if (!sonderGesetzlich && frist.monate != null && input.vereinbarteFristMonate != null) {
    if (input.vereinbarteFristMonate < frist.monate) {
      warnungen.push(
        `Die vereinbarte Frist von ${input.vereinbarteFristMonate} Monaten unterschreitet das gesetzliche Minimum von ${frist.monate} Monaten ` +
        'und ist insoweit NICHTIG (Art. 266a Abs. 1 OR) – gerechnet wird mit dem Minimum.',
      );
    } else if (input.vereinbarteFristMonate > frist.monate) {
      fristEff = { ...frist, monate: input.vereinbarteFristMonate };
      annahmen.push(`Vereinbarte (längere) Kündigungsfrist: ${input.vereinbarteFristMonate} Monate (zulässig, Art. 266a Abs. 1 OR); Symmetrie für beide Parteien unterstellt.`);
    }
  }
  const sonderNorm = input.kuendigungsart === 'tod_mieter' ? N_266i : input.kuendigungsart === 'eigenbedarf' ? N_261 : null;
  if (sonderGesetzlich && sonderNorm) {
    annahmen.push(`Es gilt die GESETZLICHE Frist auf den nächsten GESETZLICHEN Termin – auch bei längerer Vertragsdauer/-frist (${sonderNorm.artikel}); Vertragstermine bleiben unbeachtlich.`);
  }
  rechenweg.push({
    beschreibung: 'Objekt und Kündigungsfrist',
    zwischenergebnis:
      `${OBJEKT_LABEL[input.objekt]}: Frist ${fristEff.monate != null ? `${fristEff.monate} Monate` : `${fristEff.tage} Tage`} ` +
      `(gesetzliches Minimum ${frist.monate != null ? `${frist.monate} Monate` : `${frist.tage} Tage`}, ${frist.norm.artikel}).`,
    normen: sonderNorm ? [sonderNorm, frist.norm, N_266a] : [frist.norm, N_266a],
  });

  // Bewegliche Sachen: kein Termin (Art. 266f).
  if (input.objekt === 'bewegliche_sache') {
    const ende = addDays(zugang, 3);
    rechenweg.push({
      beschreibung: 'Bewegliche Sachen (Art. 266f OR)',
      zwischenergebnis: `Kündigung mit 3 Tagen auf einen beliebigen Zeitpunkt: Ende am ${fmt(ende)} (Tag des Zugangs wird nicht mitgezählt, Art. 77 Abs. 1 Ziff. 1 OR).`,
      normen: [N_266f, N_77],
    });
    return abschluss(input, zugang, ende, undefined, undefined, rechenweg, annahmen, warnungen, [N_266f, N_77], true);
  }

  // Termin-Quelle (Hierarchie: Vertrag → Ortsgebrauch → Auffangregel).
  let quelle: TerminQuelle = sonderGesetzlich
    ? (ORTSUEBLICHE_TERMINE[input.kanton].typ === 'unbekannt' || ORTSUEBLICHE_TERMINE[input.kanton].typ === 'keine' ? 'gesetzlich' : 'ortsueblich')
    : input.terminQuelle ?? 'ortsueblich';
  if (input.objekt === 'moebliertes_zimmer' && quelle === 'ortsueblich') quelle = 'gesetzlich'; // Art. 266e: Ende einer einmonatigen Mietdauer

  let liste: Date[];
  try {
    liste = kandidaten(input, quelle, zugang);
  } catch (e) {
    if ((e as Error).message === 'ORTSGEBRAUCH_UNBEKANNT') {
      const o = ORTSUEBLICHE_TERMINE[input.kanton];
      warnungen.push(
        (o.typ === 'keine'
          ? `Kanton ${input.kanton}: keine ortsüblichen Kündigungstermine` +
            (o.hinweis ? ` (${o.hinweis})` : '')
          : `Kanton ${input.kanton}: ortsübliche Termine in der hinterlegten Tabelle nicht belegt${o.hinweis ? ` (${o.hinweis})` : ''}`) +
        ' – es gilt die gesetzliche Auffangregel.',
      );
      quelle = 'gesetzlich';
      liste = kandidaten(input, quelle, zugang);
    } else {
      throw e;
    }
  }

  const quelleText =
    quelle === 'vertraglich_monate' ? `vertraglich vereinbarte Termine (Monatsenden: ${(input.vertragsTermineMonate ?? []).join(', ')})`
    : quelle === 'jedes_monatsende' ? `Vertragsklausel «auf jedes Monatsende»${input.dezemberAusgeschlossen ? ' (ausser 31. Dezember)' : ''} – verdrängt den Ortsgebrauch`
    : quelle === 'ortsueblich' ? `ortsübliche Termine im Kanton ${input.kanton} (Tatfrage – verbindliche Auskunft: Schlichtungsbehörde/Gemeinde)`
    : `gesetzliche Auffangregel: Ende einer ${AUFFANG_MONATE[input.objekt]}-monatigen Mietdauer ab Mietbeginn ${input.mietbeginn ? input.mietbeginn.split('-').reverse().join('.') : ''}`;
  const ortHinweis = quelle === 'ortsueblich' ? ORTSUEBLICHE_TERMINE[input.kanton] : null;

  rechenweg.push({
    beschreibung: 'Kündigungstermine (Hierarchie: Vertrag → Ortsgebrauch → Gesetz)',
    zwischenergebnis:
      `Massgebend: ${quelleText}.` + (ortHinweis && 'hinweis' in ortHinweis && ortHinweis.hinweis ? ` Hinweis: ${ortHinweis.hinweis}` : '') +
      ` Nächste Termine: ${liste.slice(0, 4).map(fmt).join(', ')} …`,
    normen: [N_266a, frist.norm],
  });

  // Frühester Termin, für den der Zugang rechtzeitig war.
  let endtermin: Date | null = null;
  let spaetester: Date | null = null;
  let verfehlter: Date | null = null;
  for (const T of liste) {
    const s = spaetesterZugangFuer(T, fristEff);
    if (leq(zugang, s)) { endtermin = T; spaetester = s; break; }
    if (!verfehlter) verfehlter = T;
  }
  if (!endtermin || !spaetester) throw new Error('Kein gültiger Kündigungstermin gefunden – Eingaben prüfen.');
  const spaetesterRuhetag = werktagOderNaechster(spaetester, input.kanton).verschoben;

  rechenweg.push({
    beschreibung: 'Fristwahrung und wirksamer Endtermin',
    zwischenergebnis:
      (verfehlter
        ? `Für den Termin ${fmt(verfehlter)} wäre der Zugang spätestens am ${fmt(spaetesterZugangFuer(verfehlter, fristEff))} nötig gewesen – verfehlt. ` +
          `Die Kündigung ist deswegen NICHT ungültig, sie wirkt auf den nächstmöglichen Termin (Art. 266a Abs. 2 OR). `
        : '') +
      `Wirksamer Endtermin: ${fmt(endtermin)}. Spätester rechtzeitiger Zugang dafür: ${fmt(spaetester)}` +
      (spaetesterRuhetag ? ' (fällt auf Sa/So/Feiertag – die Kündigung muss trotzdem spätestens an diesem Tag zugehen)' : '') +
      '. Art. 78 OR verschiebt diesen Zugangstag NICHT auf den nächsten Werktag: Er liegt vor Beginn der Kündigungsfrist und ist weder Erfüllungszeitpunkt noch letzter Tag einer Frist (Art. 266a Abs. 1 OR). ' +
      'Auch der ENDTERMIN wird nicht verschoben, wenn er auf ein Wochenende fällt.',
    normen: verfehlter ? [N_266a, N_77, N_78] : [N_77, N_78],
  });

  return abschluss(input, zugang, endtermin, spaetester, undefined, rechenweg, annahmen, warnungen,
    [...(sonderNorm ? [sonderNorm] : []), frist.norm, N_266a, N_77, N_78], false, verfehlter ?? undefined);
}

// ─── Gemeinsamer Abschluss: Anfechtung/Erstreckung + Ergebnisobjekt ───────

function abschluss(
  input: MietInput,
  zugang: Date,
  endtermin: Date | undefined,
  spaetesterZugang: Date | undefined,
  zahlungsfristEnde: Date | undefined,
  rechenweg: Rechenschritt[],
  annahmen: string[],
  warnungen: string[],
  normverweise: Normverweis[],
  erstreckungAusgeschlossen = false,
  verfehlter?: Date,
): MietErgebnis {
  const istRaum = input.objekt === 'wohnung' || input.objekt === 'geschaeftsraum';
  let anfechtungBis: Date | undefined;
  let erstreckungBis: Date | undefined;

  if (istRaum && input.partei === 'vermieter') {
    const grenze = werktagOderNaechster(addDays(zugang, 30), input.kanton).tag;
    anfechtungBis = grenze;
    if (!erstreckungAusgeschlossen) erstreckungBis = grenze;
    rechenweg.push({
      beschreibung: 'Rechte des Mieters: Anfechtung und Erstreckung (Art. 273 OR)',
      zwischenergebnis:
        `Anfechtung der Kündigung bei der Schlichtungsbehörde innert 30 Tagen nach Empfang: bis ${fmt(grenze)} (Verwirkungsfrist; Art. 78 OR angewandt). ` +
        (erstreckungAusgeschlossen
          ? 'Eine ERSTRECKUNG ist bei dieser Kündigungsart ausgeschlossen (Art. 272a OR).'
          : `Erstreckungsbegehren (unbefristetes Verhältnis) ebenfalls innert 30 Tagen: bis ${fmt(grenze)} (Höchstdauer: Wohnräume 4, Geschäftsräume 6 Jahre, Art. 272b OR).`),
      normen: erstreckungAusgeschlossen ? [N_273, N_272a] : [N_273],
      rechtsprechung: [rechtsprechung('BGer_5A_691_2023')],
    });
  }

  annahmen.push(
    'Unbefristetes Mietverhältnis (befristete enden ohne Kündigung durch Zeitablauf, Art. 266 OR).',
    `Kündigende Partei: ${input.partei === 'vermieter' ? 'Vermieter' : 'Mieter'}; Kanton ${input.kanton} (Feiertage für Art. 78 OR).`,
    'Zugang nach absoluter Empfangstheorie; A-Post-Plus-Zustellung ist auch samstags möglich.',
  );
  warnungen.push(
    'Ortsübliche Termine sind eine TATFRAGE und variieren teils nach Gemeinde – verbindliche Auskunft erteilt die Schlichtungsbehörde bzw. die Gemeinde.',
    'Bei Wohn-/Geschäftsräumen: Schriftform; Vermieterkündigung nur mit amtlich genehmigtem Formular; Familienwohnung mit Sonderschutz (Art. 266l–266n OR) – Verstoss macht die Kündigung nichtig (Art. 266o OR).',
  );

  const ergebnisText = endtermin
    ? `Das Mietverhältnis endet am ${fmt(endtermin)}.` +
      (verfehlter ? ` Der angestrebte Termin ${fmt(verfehlter)} wurde verfehlt (Art. 266a Abs. 2 OR).` : '') +
      (spaetesterZugang ? ` Spätester rechtzeitiger Zugang für diesen Termin: ${fmt(spaetesterZugang)}.` : '')
    : 'Kein Endtermin berechnet (fristlose Konstellation bzw. fehlende Angaben – siehe Rechenweg).';

  return {
    ergebnis: ergebnisText,
    status: 'ok',
    rechenweg,
    annahmen,
    warnungen,
    normverweise,
    endtermin: endtermin ? fmt(endtermin) : undefined,
    endterminISO: endtermin ? iso(endtermin) : undefined,
    spaetesterZugang: spaetesterZugang ? fmt(spaetesterZugang) : undefined,
    verfehlterTermin: verfehlter ? fmt(verfehlter) : undefined,
    zahlungsfristEnde: zahlungsfristEnde ? fmt(zahlungsfristEnde) : undefined,
    anfechtungBis: anfechtungBis ? fmt(anfechtungBis) : undefined,
    erstreckungBis: erstreckungBis ? fmt(erstreckungBis) : undefined,
    zugangISO: iso(zugang),
  };
}
