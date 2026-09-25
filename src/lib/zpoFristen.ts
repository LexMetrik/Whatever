// Dossier: bibliothek/normen/normtexte-zpo-zustaendigkeit.md
import { parseISO, addDays } from 'date-fns';
import type { Normverweis, Rechenschritt } from '../types/legal';
import { formatDatum, formatISO } from './datumsUtils';
import type { ZpoInput, ZpoErgebnis, ZpoVerfahren } from '../types/zpo';
import {
  stillstandsperioden,
  stillstandsperiodeFuer,
  istArbeitsfreierTag,
} from '../data/zpoFeiertage';
import {
  fristendeTage,
  fristendeKalender,
  normalisiereEnde,
  OHNE_STILLSTAND,
  type Stillstand,
} from './fristenEngine';
import { rechtsprechung } from '../data/verifikation';

// ─── Feste Normverweise (Art. 142–148 ZPO) ────────────────────────────────

const N_142_1:    Normverweis = { artikel: 'Art. 142 Abs. 1 ZPO', bemerkung: 'Tagesfrist: Beginn am Folgetag' };
const N_142_1bis: Normverweis = { artikel: 'Art. 142 Abs. 1bis ZPO', bemerkung: 'Zustellung an arbeitsfreiem Tag' };
const N_142_2:    Normverweis = { artikel: 'Art. 142 Abs. 2 ZPO', bemerkung: 'Monatsfrist: gleichbezeichneter Tag (Wochen-/Jahresfristen analog, st. Praxis)' };
const N_142_3:    Normverweis = { artikel: 'Art. 142 Abs. 3 ZPO', bemerkung: 'Ende am Sa/So/Feiertag → nächster Werktag' };
const N_143:      Normverweis = { artikel: 'Art. 143 ZPO', bemerkung: 'Fristwahrung (Expeditionsprinzip)' };
const N_144_1:    Normverweis = { artikel: 'Art. 144 Abs. 1 ZPO', bemerkung: 'Gesetzliche Frist nicht erstreckbar' };
const N_144_2:    Normverweis = { artikel: 'Art. 144 Abs. 2 ZPO', bemerkung: 'Gerichtliche Frist erstreckbar' };
const N_145_1:    Normverweis = { artikel: 'Art. 145 Abs. 1 ZPO', bemerkung: 'Fristenstillstand (Gerichtsferien)' };
const N_145_2:    Normverweis = { artikel: 'Art. 145 Abs. 2 ZPO', bemerkung: 'Ausnahmen vom Stillstand' };
const N_145_3:    Normverweis = { artikel: 'Art. 145 Abs. 3 ZPO', bemerkung: 'Hinweispflicht des Gerichts' };
const N_146_1:    Normverweis = { artikel: 'Art. 146 Abs. 1 ZPO', bemerkung: 'Wirkung des Stillstands / Aufschub' };
const N_147:      Normverweis = { artikel: 'Art. 147 ZPO', bemerkung: 'Säumnis' };
const N_148:      Normverweis = { artikel: 'Art. 148 ZPO', bemerkung: 'Wiederherstellung' };

// ─── Verfahrensart → Geltung des Fristenstillstands (Art. 145 Abs. 2) ─────

const STILLSTAND_GILT: Record<ZpoVerfahren, boolean> = {
  ordentlich: true,
  vereinfacht: true,
  familienrecht: true,
  klagefrist_klagebewilligung: true, // Art. 209 Abs. 3/4 – gehört zum gerichtlichen Verfahren
  schlichtung: false,
  summarisch: false,
  rechtsmittel_summarisch: false,
};

// ─── Datums-Helfer ────────────────────────────────────────────────────────

const fmt = formatDatum;
const iso = formatISO;

// ─── Hilfsfunktionen ───────────────────────────────────────────────────────

function imStillstand(d: Date, stillstandAktiv: boolean): boolean {
  return stillstandAktiv && stillstandsperiodeFuer(d) !== null;
}

// ZPO-Stillstand-Strategie für die gemeinsame Engine (Art. 145/146 ZPO: Ruhen).
// Gilt der Stillstand nicht, kennt die Strategie keine geschlossenen Zeiten.
function zpoStillstand(stillstandAktiv: boolean): Stillstand {
  if (!stillstandAktiv) return OHNE_STILLSTAND;
  return {
    periodeFuer: stillstandsperiodeFuer,
    perioden: stillstandsperioden,
    ruhenZaehlung: true,
    endregel: 'ruhen_weiter',
  };
}

// Art. 142 Abs. 1bis: Zustellung per gewöhnlicher Post an Sa/So/Feiertag → nächster Werktag.
function ereignisKorrigiert(input: ZpoInput, ereignis: Date): { tag: Date; korrigiert: boolean } {
  if (input.zustellart === 'gewoehnliche_post' && istArbeitsfreierTag(ereignis, input.kanton)) {
    let d = ereignis;
    while (istArbeitsfreierTag(d, input.kanton)) d = addDays(d, 1);
    return { tag: d, korrigiert: true };
  }
  return { tag: ereignis, korrigiert: false };
}

// ─── Hauptfunktion ──────────────────────────────────────────────────────────

export function berechneFrist(input: ZpoInput): ZpoErgebnis {
  if (!Number.isInteger(input.laenge) || input.laenge <= 0) {
    throw new Error('Fristlänge muss eine ganze Zahl > 0 sein.');
  }

  const rechenweg: Rechenschritt[] = [];
  const annahmen: string[] = [];
  const warnungen: string[] = [];

  const ereignis = parseISO(input.ereignis);
  // RL-24/F1-07 (Prüfung Rechtslogik 23.9.2026): ein Nicht-Kalendertag
  // (2026-02-30) lief bis in date-fns und warf «Invalid time value».
  // Kontrollierte Meldung wie allgemeineFrist.ts (Muster dort).
  if (isNaN(ereignis.getTime())) throw new Error('Ungültiges Ereignisdatum.');

  // Stillstand: grundsätzlich nach Verfahren (Art. 145 Abs. 2). ABER: Im Schlichtungs-/
  // summarischen Verfahren ist der Hinweis nach Art. 145 Abs. 3 ZPO Gültigkeitsvorschrift
  // (BGE 139 III 78 E. 5) – fehlt er, stehen die Fristen gleichwohl still.
  // RL-20/F1-04: Bei Fristen, die das Gericht nicht im Verfahren eröffnet
  // (hinweispflichtEntfaellt, z.B. Arrestprosekution Art. 279 SchKG), greift
  // die Hinweis-Regel nicht — ein fehlender Hinweis löst keinen Stillstand aus.
  const verfahrenStillstand = STILLSTAND_GILT[input.verfahren];
  const hinweisregel = input.hinweispflichtEntfaellt !== true;
  const hinweisErfolgt = input.gerichtshinweisStillstand ?? true;
  const stillstandGilt = verfahrenStillstand || (hinweisregel && hinweisErfolgt === false);
  const st = zpoStillstand(stillstandGilt);
  if (!verfahrenStillstand && stillstandGilt) {
    rechenweg.push({
      beschreibung: 'Art. 145 Abs. 3 ZPO – Hinweispflicht (Gültigkeitsvorschrift)',
      zwischenergebnis:
        'Im gewählten Verfahren gilt der Stillstand an sich nicht (Art. 145 Abs. 2 ZPO). Da das Gericht jedoch NICHT auf die Nichtgeltung hingewiesen hat, stehen die Fristen gleichwohl still (Art. 145 Abs. 3 ZPO ist Gültigkeitsvorschrift).',
      normen: [N_145_3, N_145_2],
      rechtsprechung: [rechtsprechung('BGE_139_III_78')],
    });
  }

  // Schritt 1: massgeblichen Ereignistag bestimmen (Art. 142 Abs. 1bis)
  const { tag: massgeblich, korrigiert } = ereignisKorrigiert(input, ereignis);
  rechenweg.push({
    beschreibung: 'Schritt 1 – Massgeblicher Ereignistag',
    zwischenergebnis: korrigiert
      ? `Zustellung per gewöhnlicher Post an einem arbeitsfreien Tag (${fmt(ereignis)}) → gilt als zugestellt am nächsten Werktag ${fmt(massgeblich)}.`
      : `Auslösendes Ereignis: ${fmt(ereignis)} (keine Korrektur nach Art. 142 Abs. 1bis).`,
    normen: korrigiert ? [N_142_1bis] : [],
  });

  // Schritt 2: Fristende provisorisch berechnen
  let diesAQuo: Date;
  let endeProvisorisch: Date;

  if (input.einheit === 'tage') {
    const r = fristendeTage(massgeblich, input.laenge, st);
    diesAQuo = r.diesAQuo;
    endeProvisorisch = r.ende;
    rechenweg.push({
      beschreibung: 'Schritt 2 – Tagesfrist (dies a quo am Folgetag)',
      zwischenergebnis:
        `Tagesfrist von ${input.laenge} Tagen. Beginn des Fristenlaufs (dies a quo): ${fmt(diesAQuo)}. ` +
        (stillstandGilt ? 'Stillstandstage werden nicht mitgezählt (die Frist pausiert). ' : 'Kein Fristenstillstand in diesem Verfahren. ') +
        `Rechnerisches Ende (vor Endnormalisierung): ${fmt(endeProvisorisch)}.`,
      normen: stillstandGilt ? [N_142_1, N_146_1] : [N_142_1],
    });
  } else {
    const r = fristendeKalender(massgeblich, input.einheit, input.laenge, st, input.modus === 'mindermeinung');
    diesAQuo = r.diesAQuo;
    endeProvisorisch = r.ende;
    const verlaengerungTage = r.verlaengerungTage;
    const einheitLabel = input.einheit === 'wochen' ? 'Wochen' : input.einheit === 'monate' ? 'Monate' : 'Jahre';
    rechenweg.push({
      beschreibung: `Schritt 2 – ${einheitLabel}frist (gleichbezeichneter Tag, Art. 142 Abs. 2)`,
      zwischenergebnis:
        `dies a quo: ${fmt(diesAQuo)}` +
        (imStillstand(massgeblich, stillstandGilt) ? ' (Ereignis im Stillstand → letzter Tag der Stillstandsperiode, Art. 146 Abs. 1).' : ' (Ereignistag selbst; Art. 142 Abs. 1 findet keine Anwendung).') +
        (input.modus === 'mindermeinung' ? ' [Mindermeinung: Beginn am Folgetag.]' : '') +
        ` Naives Ende: ${fmt(endeProvisorisch)}.` +
        (verlaengerungTage > 0 ? ` Stillstandsverlängerung: +${verlaengerungTage} Tage (Art. 145 Abs. 1).` : ''),
      normen: verlaengerungTage > 0 ? [N_142_2, N_145_1, N_146_1] : [N_142_2],
    });
  }

  // Schritt 3: Endnormalisierung (Art. 142 Abs. 3 + Art. 145 kumulativ)
  const { tag: diesAdQuem, verschoben } = normalisiereEnde(endeProvisorisch, input.kanton, st);
  rechenweg.push({
    beschreibung: 'Schritt 3 – Endnormalisierung (Art. 142 Abs. 3 / Art. 145 Abs. 1)',
    zwischenergebnis: verschoben
      ? `Das rechnerische Ende ${fmt(endeProvisorisch)} fiel auf einen arbeitsfreien Tag bzw. in einen Stillstand → verschoben auf den nächsten Werktag: ${fmt(diesAdQuem)}.`
      : `Ende ${fmt(diesAdQuem)} ist bereits ein Werktag ausserhalb des Stillstands – keine Verschiebung.`,
    normen: [N_142_3, N_145_1],
  });

  // Optional: Erstreckung (Ziff. 7.5) – nur gerichtliche Fristen
  let erstrecktBis: string | undefined;
  if (input.erstreckung && input.fristnatur === 'gerichtlich') {
    const tage = input.erstreckung.einheit === 'wochen' ? input.erstreckung.laenge * 7 : input.erstreckung.laenge;
    // Beginn am Tag nach dem letzten Tag der ursprünglichen Frist; Art. 142 Abs. 1 gilt nicht.
    let cursor = addDays(diesAdQuem, 1);
    let gezaehlt = 0;
    let ende = cursor;
    for (let guard = 0; guard < 4000 && gezaehlt < tage; guard++) {
      if (!imStillstand(cursor, stillstandGilt)) {
        gezaehlt += 1;
        ende = cursor;
      }
      if (gezaehlt < tage) cursor = addDays(cursor, 1);
    }
    const norm = normalisiereEnde(ende, input.kanton, st);
    erstrecktBis = iso(norm.tag);
    rechenweg.push({
      beschreibung: 'Erstreckung (gerichtliche Frist, Art. 144 Abs. 2 ZPO)',
      zwischenergebnis: `Erstreckung um ${input.erstreckung.laenge} ${input.erstreckung.einheit} ab dem Tag nach Fristablauf. Neues Ende: ${fmt(norm.tag)} (Art. 142 Abs. 1 findet keine Anwendung; Abs. 3 und Stillstand gelten).`,
      normen: [N_144_2, N_142_3],
    });
  }

  // ─── Hinweise / Vorbehalte ────────────────────────────────────────────

  // Erstreckbarkeit (Ziff. 6.8)
  if (input.fristnatur === 'gesetzlich') {
    warnungen.push('Gesetzliche Frist: nicht erstreckbar (Art. 144 Abs. 1 ZPO). Bei Versäumnis kommt nur die Wiederherstellung in Betracht (Art. 148 ZPO).');
    rechenweg.push({
      beschreibung: 'Erstreckbarkeit (Art. 144 Abs. 1 ZPO)',
      zwischenergebnis: 'Gesetzliche Frist – nicht erstreckbar.',
      normen: [N_144_1],
    });
  } else {
    warnungen.push('Gerichtliche Frist: erstreckbar aus zureichenden Gründen, sofern das Gesuch vor Fristablauf (spätestens am letzten Tag bis 24.00 Uhr) gestellt wird (Art. 144 Abs. 2 ZPO). Kein Anspruch; Entscheid im gerichtlichen Ermessen.');
    rechenweg.push({
      beschreibung: 'Erstreckbarkeit (Art. 144 Abs. 2 ZPO)',
      zwischenergebnis: 'Gerichtliche Frist – aus zureichenden Gründen erstreckbar (Gesuch vor Fristablauf).',
      normen: [N_144_2],
    });
  }

  // Art. 145 Abs. 3: Hinweispflicht bei Nichtgeltung des Stillstands
  if (!stillstandGilt && !hinweisregel) {
    // RL-20/F1-04: keine Art.-145-Abs.-3-Warnung (sie verspräche einen
    // Stillstand «gleichwohl», der für diese Frist nicht belegt ist).
    warnungen.push('Gerechnet ohne Fristenstillstand (sichere Seite). Die Regel, wonach eine Frist ohne Hinweis des Gerichts gleichwohl stillsteht (Art. 145 Abs. 3 ZPO, BGE 139 III 78), ist auf diese nicht vom Gericht im Verfahren eröffnete Frist nicht zugeschnitten – darauf nicht vertrauen.');
    rechenweg.push({
      beschreibung: 'Geltung des Fristenstillstands (Art. 145 Abs. 2/3 ZPO)',
      zwischenergebnis: 'Ohne Fristenstillstand gerechnet (sichere Seite); die Hinweis-Regel nach Art. 145 Abs. 3 ZPO ist nicht angewandt.',
      normen: [N_145_2],
    });
  } else if (!stillstandGilt) {
    warnungen.push('Der Fristenstillstand gilt in diesem Verfahren nicht (Art. 145 Abs. 2 ZPO). Dies setzt voraus, dass das Gericht auf die Nichtgeltung hingewiesen hat (Art. 145 Abs. 3 ZPO – Gültigkeitsvorschrift, BGE 139 III 78); andernfalls steht die Frist gleichwohl still.');
    rechenweg.push({
      beschreibung: 'Geltung des Fristenstillstands (Art. 145 Abs. 2/3 ZPO)',
      zwischenergebnis: `Im gewählten Verfahren gilt der Fristenstillstand nicht (Hinweis des Gerichts nach Art. 145 Abs. 3 ZPO vorausgesetzt).`,
      normen: [N_145_2, N_145_3],
    });
  }

  // [UNGEKLÄRT] Jahresfristen vs. Gerichtsferien
  if (input.einheit === 'jahre' && stillstandGilt) {
    warnungen.push('[UNGEKLÄRT] Die Behandlung von Jahresfristen im Verhältnis zu den Gerichtsferien ist nicht gesichert. Bitte manuell prüfen.');
  }

  // [UMSTRITTEN] Mindermeinung
  if (input.modus === 'mindermeinung') {
    warnungen.push('[UMSTRITTEN] Berechnung nach der Mindermeinung (Art. 142 Abs. 1 ZPO für alle Fristen → Beginn am Folgetag). Das Bundesgericht teilt diese Auffassung nicht (BGer 5A_691/2023); es besteht ein Fristrisiko.');
  }

  // Feiertags-Verifikationsvorbehalt (Ziff. 6.7). RL-20/R1-08 (Prüfung
  // Rechtslogik 23.9.2026): vorher «kommt regelmässig eine Fristwiederher-
  // stellung in Betracht» — zu beruhigend; Art. 148 Abs. 1 ZPO verlangt
  // Glaubhaftmachung von keinem oder nur leichtem Verschulden.
  warnungen.push('Kantonale/lokale Feiertage bitte verifizieren (Gerichtsort massgeblich); bei Unklarheit über einen Feiertag kommt eine Wiederherstellung (Art. 148 ZPO) nur ausnahmsweise in Betracht – sie setzt voraus, dass die Partei kein oder nur ein leichtes Verschulden trifft (Art. 148 Abs. 1 ZPO).');

  // Fristwahrung (Art. 143) + Säumnis (Art. 147/148)
  rechenweg.push({
    beschreibung: 'Fristwahrung (Art. 143 ZPO)',
    // BK-Abgleich-Fix 10.6.2026 (B-2): Abs. 1 nennt als dritte fristwahrende
    // Übergabestelle die schweizerische diplomatische/konsularische Vertretung —
    // auch für nur vorübergehend im Ausland weilende Parteien.
    zwischenergebnis: 'Eingaben spätestens am letzten Tag bis 24.00 Uhr beim Gericht oder zu dessen Handen der Schweizerischen Post oder einer schweizerischen diplomatischen oder konsularischen Vertretung übergeben (Expeditionsprinzip; rechtzeitige Aufgabe ist beweisbelastet; die Vertretung steht auch nur vorübergehend im Ausland weilenden Parteien offen). Elektronisch: Quittung der Zustellplattform (Abs. 2). Fristgerecht beim unzuständigen schweizerischen Gericht eingereicht gilt als rechtzeitig (Abs. 1bis).',
    normen: [N_143],
  });
  rechenweg.push({
    beschreibung: 'Säumnisfolgen (Hinweis)',
    zwischenergebnis: 'Dieser Rechner bestimmt nur das Fristende, nicht die Rechtsfolgen einer Versäumnis. Bei Säumnis: Art. 147 ZPO; Wiederherstellung: Art. 148 ZPO.',
    normen: [N_147, N_148],
  });

  annahmen.push(
    `Verfahrensart: ${input.verfahren} – Fristenstillstand ${stillstandGilt ? 'gilt' : 'gilt nicht'} (Art. 145 Abs. 2 ZPO).`,
    `Gerichtsort: ${input.kanton} (Sitz des Gerichts; massgeblich für Feiertage, nicht der Wohnsitz der Partei/Vertretung).`,
    `Fristtyp: ${input.einheit}; Berechnungsmodus: ${input.modus === 'mindermeinung' ? 'Mindermeinung' : 'bundesgerichtliche Praxis (BGer 5A_691/2023)'}.`,
    'Ablauf jeweils um 24.00 Uhr des letzten Tages (dies ad quem).',
  );

  // Fristbeginn-Norm explizit benannt (B1-1): Art. 142 Abs. 1 (Tage) bzw.
  // Abs. 2 (Monate/Jahre) ZPO — nicht über normverweise[0] erschlossen.
  const fristbeginnNormVerweis = input.einheit === 'tage' ? N_142_1 : N_142_2;
  const normverweise: Normverweis[] = [
    fristbeginnNormVerweis,
    N_142_3,
    N_145_1,
    N_143,
    input.fristnatur === 'gesetzlich' ? N_144_1 : N_144_2,
    N_148,
  ];

  return {
    ergebnis: `Fristende (dies ad quem): ${fmt(diesAdQuem)}, 24.00 Uhr.` + (erstrecktBis ? ` Nach Erstreckung: ${fmt(parseISO(erstrecktBis))}.` : ''),
    fristbeginnNorm: fristbeginnNormVerweis.artikel,
    status: 'ok',
    rechenweg,
    annahmen,
    warnungen,
    normverweise,
    massgeblicherEreignistag: fmt(massgeblich),
    diesAQuo: fmt(diesAQuo),
    diesAdQuem: fmt(diesAdQuem),
    erstrecktBis: erstrecktBis ? fmt(parseISO(erstrecktBis)) : undefined,
    ereignisISO: iso(massgeblich),
    diesAQuoISO: iso(diesAQuo),
    diesAdQuemISO: iso(diesAdQuem),
    stillstandAktiv: stillstandGilt,
  };
}

// ─── Optional (Ziff. 7.2): Zustellfiktion-Helfer (Art. 138 Abs. 3 lit. a) ──
//
// Nicht abgeholte eingeschriebene Sendung gilt am 7. Tag nach dem erfolglosen
// Zustellversuch als zugestellt (unabhängig vom Wochentag). Hilfsgrösse.

export function zustellfiktion(erfolgloserVersuch: string): string {
  const d = parseISO(erfolgloserVersuch);
  // RL-24/F1-07: keine rohe RangeError-Meldung bei ungültigem Datum.
  if (isNaN(d.getTime())) throw new Error('Ungültiges Datum des Zustellversuchs.');
  return iso(addDays(d, 7));
}
