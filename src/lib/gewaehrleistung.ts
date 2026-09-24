import { parseISO, addDays, addYears, isAfter, isBefore } from 'date-fns';
import type { Berechnungsergebnis, Rechenschritt, Normverweis, Kanton } from '../types/legal';
import { formatDatum, formatISO } from './datumsUtils';
import { werktagsEnde } from './verjaehrung';
import { rechtsprechung } from '../data/verifikation';

// ─── Gewährleistung & Mängelrüge (Art. 197 ff., 219/219a, 367 ff. OR) ──────
//
// Zwei Regime parallel (Teilrevision «Baumängel», AS 2025 270, in Kraft
// 1.1.2026): Verzweigung nach Vertragsabschlussdatum. Strikt getrennt werden
// Rügefrist (Obliegenheit/Verwirkung – keine Unterbrechung/Hemmung) und
// Verjährungsfrist (Einrede – AT-Mechanik Art. 132/134/135 ff. anwendbar;
// dafür der Verjährungsrechner). Eine Mängelrüge unterbricht die Verjährung NICHT.
//
// Bewusst nicht abgebildet: Viehkauf (Art. 198/202), Kulturgüter (Art. 210
// Abs. 3), Rechtsgewährleistung/Eviktion (Art. 127 OR – 10 Jahre, separat).

export type GwVertragstyp = 'fahrniskauf' | 'werkvertrag' | 'grundstueckkauf';
export type GwObjekt =
  | 'beweglich'     // bewegliche Sache / bewegliches Werk
  | 'integriert'    // bestimmungsgemäss in ein unbewegliches Werk integriert (kausal für dessen Mangel)
  | 'unbeweglich';  // unbewegliches Werk (nur Werkvertrag)
export type GwMangelTyp = 'offen' | 'versteckt';

export type GewaehrleistungInput = {
  vertragstyp: GwVertragstyp;
  vertragsdatum: string;          // Recht-Schalter: vor / ab 1.1.2026 (Art. 1 SchlT ZGB)
  objekt: GwObjekt;
  uebergabe: string;              // Ablieferung (Kauf) / Abnahme (Werk) / Besitzesantritt (Grundstück)
  eigentumserwerb?: string;       // Grundstück: Grundbucheintrag (Verjährungsbeginn)
  mangelTyp: GwMangelTyp;
  entdeckung?: string;            // versteckter Mangel: dies a quo der Rüge
  ruegeErhobenAm?: string;        // optional: erhobene Rüge auf Rechtzeitigkeit prüfen
  arglist?: boolean;              // Art. 203 / 210 Abs. 6
  konsumentenkauf?: boolean;      // Art. 210 Abs. 4 (alle drei Merkmale kumulativ)
  gebraucht?: boolean;            // gebrauchte Sache (Mindestfrist 1 Jahr)
  vereinbarteVerjaehrungJahre?: number;
  sia118?: boolean;               // nur Werkvertrag: SIA-Norm 118 vereinbart
  kanton: Kanton;
  stichtag: string;
};

export type GewaehrleistungErgebnis = Berechnungsergebnis & {
  rechtsstand: 'alt' | 'neu';
  ruege: {
    art: 'sofort' | 'tage60' | 'sia' | 'entfaellt';
    zwingend: boolean;
    basisISO?: string;
    sicherISO?: string;      // sofort: + 3 Tage (sicher rechtzeitig)
    richtwertISO?: string;   // sofort: + 7 Tage (Richtwert)
    maximalISO?: string;     // sofort: + 11 Tage (Ausnahme)
    endeISO?: string;        // 60-Tage- bzw. SIA-Frist: festes Ende
    beurteilung?: string;    // falls ruegeErhobenAm gesetzt
  };
  verjaehrung: {
    jahre: number;
    teilzwingend: boolean;
    vereinbartUnwirksam?: boolean;
    beginnISO?: string;
    endeISO?: string;
    verjaehrtAmStichtag?: boolean;
  };
};

// ─── Normverweise ───────────────────────────────────────────────────────────

const N = (artikel: string, bemerkung?: string): Normverweis => ({ artikel, bemerkung });
const fmt = formatDatum;
const iso = formatISO;

const REVISION = parseISO('2026-01-01'); // Inkrafttreten Teilrevision Baumängel (AS 2025 270)

const TYP_LABEL: Record<GwVertragstyp, string> = {
  fahrniskauf: 'Fahrniskauf (Art. 197 ff. OR)',
  werkvertrag: 'Werkvertrag (Art. 367 ff. OR)',
  grundstueckkauf: 'Grundstückkauf (Art. 219/219a OR)',
};

const OBJEKT_LABEL: Record<GwObjekt, string> = {
  beweglich: 'bewegliche Sache / bewegliches Werk',
  integriert: 'bestimmungsgemäss in ein unbewegliches Werk integriert',
  unbeweglich: 'unbewegliches Werk',
};

// ─── Hauptfunktion ──────────────────────────────────────────────────────────

export function berechneGewaehrleistung(input: GewaehrleistungInput): GewaehrleistungErgebnis {
  const rechenweg: Rechenschritt[] = [];
  const annahmen: string[] = [];
  const warnungen: string[] = [];

  const vertrag = parseISO(input.vertragsdatum);
  const uebergabe = parseISO(input.uebergabe);
  const stichtag = parseISO(input.stichtag);
  const neu = !isNaN(vertrag.getTime()) && !isBefore(vertrag, REVISION);
  const rechtsstand: 'alt' | 'neu' = neu ? 'neu' : 'alt';

  const leer: GewaehrleistungErgebnis = {
    ergebnis: '', status: 'ok', rechenweg, annahmen, warnungen, normverweise: [],
    rechtsstand,
    ruege: { art: 'sofort', zwingend: false },
    verjaehrung: { jahre: 0, teilzwingend: false },
  };

  if (isNaN(vertrag.getTime()) || isNaN(uebergabe.getTime()) || isNaN(stichtag.getTime())) {
    return { ...leer, ergebnis: 'Ungültige Eingabe: Vertrags-, Übergabe- und Stichtagsdatum prüfen.', status: 'unzulaessig' };
  }
  const istWerk = input.vertragstyp === 'werkvertrag';
  const istGrundstueck = input.vertragstyp === 'grundstueckkauf';
  const objekt: GwObjekt = istGrundstueck ? 'unbeweglich' : input.objekt;
  if (!istWerk && objekt === 'unbeweglich' && !istGrundstueck) {
    return { ...leer, ergebnis: 'Unbewegliche Objekte beim Kauf bitte als Grundstückkauf erfassen.', status: 'unzulaessig' };
  }
  const sia = istWerk && (input.sia118 ?? false);

  // Schritt 1 – Regime
  rechenweg.push({
    beschreibung: 'Schritt 1 – Vertragstyp und anwendbares Recht',
    zwischenergebnis: `${TYP_LABEL[input.vertragstyp]}; Objekt: ${OBJEKT_LABEL[objekt]}. Vertragsschluss ${fmt(vertrag)} → ${
      neu
        ? 'NEUES Recht (Teilrevision «Baumängel», in Kraft seit 1.1.2026).'
        : 'ALTES Recht (Vertrag vor dem 1.1.2026; Art. 1 SchlT ZGB) – auch die Rügefrist richtet sich nach altem Recht.'
    }${sia ? ' SIA-Norm 118 vereinbart (Vertragswerk; Fristen gemäss Art. 172/179/180 SIA 118).' : ''}`,
    normen: [N('Art. 1 SchlT ZGB', 'Übergangsrecht')],
  });

  // ── Rügefrist (Obliegenheit / Verwirkung) ──
  const versteckt = input.mangelTyp === 'versteckt';
  const entdeckung = input.entdeckung ? parseISO(input.entdeckung) : null;
  if (versteckt && (!entdeckung || isNaN(entdeckung.getTime()))) {
    return { ...leer, ergebnis: 'Für versteckte Mängel ist das Entdeckungsdatum anzugeben (dies a quo der Rüge).', status: 'unzulaessig' };
  }
  const ruegeBasis = versteckt ? entdeckung! : uebergabe;

  // Gilt die 60-Tage-Frist? (nur neues Recht; Bau-Konstellationen)
  const sechzig = neu && (
    (input.vertragstyp === 'fahrniskauf' && objekt === 'integriert') ||  // Art. 201 Abs. 4
    (istWerk && (objekt === 'unbeweglich' || objekt === 'integriert')) || // Art. 367 Abs. 1bis / 370 Abs. 4
    istGrundstueck                                                        // Art. 219a Abs. 1
  );

  const ruege: GewaehrleistungErgebnis['ruege'] = { art: 'sofort', zwingend: false };

  if (input.arglist) {
    ruege.art = 'entfaellt';
    rechenweg.push({
      beschreibung: 'Schritt 2 – Mängelrüge bei absichtlicher Täuschung',
      zwischenergebnis: 'Bei arglistiger Täuschung ist die Mängelhaftung nicht durch unterlassene oder verspätete Rüge beschränkt – die Rügeobliegenheit entfällt.',
      normen: [N('Art. 203 OR', 'Arglist: Rügeversäumnis unschädlich')],
    });
  } else if (sechzig) {
    ruege.art = 'tage60';
    ruege.zwingend = true;
    ruege.basisISO = iso(ruegeBasis);
    // Verwirkungsfrist: Beginntag zählt nicht; Fristende an Sa/So/Feiertag → nächster Werktag (Art. 76 ff. OR analog)
    const ende = werktagsEnde(addDays(ruegeBasis, 60), input.kanton);
    ruege.endeISO = iso(ende);
    const norm = istGrundstueck ? 'Art. 219a Abs. 1 OR'
      : input.vertragstyp === 'fahrniskauf' ? 'Art. 201 Abs. 4 OR'
      : versteckt ? 'Art. 370 Abs. 4 OR' : 'Art. 367 Abs. 1bis OR';
    rechenweg.push({
      beschreibung: 'Schritt 2 – Mängelrüge: 60-Tage-Frist (zwingend, neues Recht)',
      zwischenergebnis: `${versteckt ? 'Versteckter Mangel: Frist läuft ab Entdeckung' : 'Frist läuft ab ' + (istWerk ? 'Abnahme' : istGrundstueck ? 'Besitzesantritt' : 'Ablieferung')} (${fmt(ruegeBasis)}); 60 Tage → ${fmt(ende)}. Die Vereinbarung kürzerer Fristen ist unwirksam. Versäumnis führt zur Genehmigungsfiktion (Verwirkung der Mängelrechte).`,
      normen: [N(norm, '60 Tage, zwingend'), N('Art. 78 OR', 'Werktagsregel für das Fristende')],
    });
    // F5-08 (RL-06): Art. 367 Abs. 1bis / 370 Abs. 4 OR (Fassung 1.1.2026) machen nur
    // KÜRZERE Fristen unwirksam. Eine vertraglich längere Rügefrist nach SIA 118 bleibt
    // möglich – sie wird nicht gerechnet (SIA 118 ist Vertragsinhalt, keine amtliche
    // Quelle), sondern offengelegt; gerechnet bleibt die gesetzliche 60-Tage-Frist.
    if (sia) {
      warnungen.push('SIA-Norm 118 vereinbart: Gerechnet ist die gesetzliche 60-Tage-Frist; unwirksam sind nur kürzere Fristen (Art. 367 Abs. 1bis / 370 Abs. 4 OR). Eine vertraglich längere Rügefrist nach SIA 118 (Rüge während der zweijährigen Garantiefrist, Art. 172 f. SIA 118) kann wirksam sein – Vertrag und Ausgabe der Norm prüfen.');
    }
  } else if (sia && !versteckt) {
    ruege.art = 'sia';
    ruege.basisISO = iso(uebergabe);
    const ende = addYears(uebergabe, 2);
    ruege.endeISO = iso(ende);
    rechenweg.push({
      beschreibung: 'Schritt 2 – Mängelrüge nach SIA-Norm 118 (Garantiefrist)',
      zwischenergebnis: `Während der zweijährigen Garantiefrist ab Abnahme (${fmt(uebergabe)} – ${fmt(ende)}) können Mängel jederzeit gerügt werden (Art. 172 SIA 118). Die SIA-Norm 118 ist ein Vertragswerk – Anwendbarkeit und Fassung sind zu prüfen.`,
      normen: [N('Art. 367 Abs. 1 OR', 'dispositiv; SIA 118 als Vertragsabrede')],
    });
    warnungen.push('SIA-Norm 118 (Ausgabe 2013) ist noch nicht an das revidierte OR angepasst – Fristen im Vertrag prüfen (Verifikations-Vorbehalt).');
  } else {
    ruege.art = 'sofort';
    ruege.basisISO = iso(ruegeBasis);
    ruege.sicherISO = iso(addDays(ruegeBasis, 3));
    ruege.richtwertISO = iso(addDays(ruegeBasis, 7));
    ruege.maximalISO = iso(addDays(ruegeBasis, 11));
    rechenweg.push({
      beschreibung: 'Schritt 2 – Mängelrüge: «sofort» (Richtwerte der Praxis)',
      zwischenergebnis: `${versteckt ? 'Versteckter Mangel: «sofort nach der Entdeckung»' : 'Nach Prüfung «sobald nach üblichem Geschäftsgang tunlich», dann «sofort»'} (ab ${fmt(ruegeBasis)}). Keine starre Frist – Richtwerte: 2–3 Tage sicher rechtzeitig (${fmt(addDays(ruegeBasis, 3))}), längstens ~7 Tage (${fmt(addDays(ruegeBasis, 7))}), ausnahmsweise 11 Tage (${fmt(addDays(ruegeBasis, 11))}). Versäumnis führt zur Genehmigungsfiktion.`,
      normen: istWerk
        ? [N(versteckt ? 'Art. 370 Abs. 3 OR' : 'Art. 367 Abs. 1 OR', 'Prüf-/Rügeobliegenheit')]
        : [N(versteckt ? 'Art. 201 Abs. 3 OR' : 'Art. 201 Abs. 1 OR', 'Prüf-/Rügeobliegenheit')],
      rechtsprechung: [
        rechtsprechung('BGer_4A_252_2010'),
        rechtsprechung('BGer_4A_399_2018'),
        rechtsprechung('BGer_4D_25_2010'),
        ...(istGrundstueck ? [rechtsprechung('BGE_81_II_56')] : []),
      ],
    });
    annahmen.push('Die «sofort»-Rüge ist einzelfallabhängig (Art des Mangels, Verschlimmerungsgefahr – bei sich fortentwickelnden Mängeln kürzer); die Tagesangaben sind Näherungen der Rechtsprechung.');
  }

  // Beurteilung einer erhobenen Rüge
  if (input.ruegeErhobenAm && ruege.art !== 'entfaellt') {
    const r = parseISO(input.ruegeErhobenAm);
    if (!isNaN(r.getTime())) {
      let text: string;
      if (ruege.art === 'sofort') {
        text = !isAfter(r, addDays(ruegeBasis, 3)) ? 'sicher rechtzeitig (2–3 Tage)'
          : !isAfter(r, addDays(ruegeBasis, 7)) ? 'nach dem Richtwert (≤ 7 Tage) rechtzeitig'
          : !isAfter(r, addDays(ruegeBasis, 11)) ? 'nur ausnahmsweise noch rechtzeitig (8–11 Tage; Einzelfall)'
          : 'voraussichtlich verspätet – Genehmigungsfiktion droht';
      } else {
        const ende = parseISO(ruege.endeISO!);
        text = !isAfter(r, ende) ? `rechtzeitig (Frist bis ${fmt(ende)})` : `verspätet (Frist bis ${fmt(ende)}) – Genehmigungsfiktion droht`;
      }
      ruege.beurteilung = `Rüge vom ${fmt(r)}: ${text}.`;
      rechenweg.push({
        beschreibung: 'Beurteilung der erhobenen Rüge',
        zwischenergebnis: ruege.beurteilung,
        normen: [],
      });
    }
  }

  // ── Verjährungsfrist (Einrede) ──
  const verjBeginn = istGrundstueck
    ? (input.eigentumserwerb ? parseISO(input.eigentumserwerb) : null)
    : uebergabe;
  if (!verjBeginn || isNaN(verjBeginn.getTime())) {
    return { ...leer, ergebnis: 'Beim Grundstückkauf ist das Datum des Eigentumserwerbs (Grundbucheintrag) anzugeben – dies a quo der Verjährung.', status: 'unzulaessig' };
  }

  // Gesetzliche Dauer
  let jahre: number;
  let dauerNorm: Normverweis;
  let teilzwingend = false;
  if (input.arglist) {
    jahre = 10;
    dauerNorm = N('Art. 210 Abs. 6 OR', 'Arglist: Berufung auf Verjährung ausgeschlossen → Art. 127 OR');
  } else if (istGrundstueck) {
    jahre = 5;
    teilzwingend = neu;
    dauerNorm = neu ? N('Art. 219a Abs. 3 OR', '5 Jahre ab Eigentumserwerb, teilzwingend') : N('Art. 219 Abs. 3 OR', '5 Jahre ab Eigentumserwerb für Mängel eines Gebäudes (aufgehoben per 1.1.2026)');
  } else if (istWerk) {
    jahre = sia ? 5 : objekt === 'beweglich' ? 2 : 5;
    // S3-b (RL-06): Teilzwingend ist die GESETZLICHE 5-Jahres-Frist (Art. 371 Abs. 1
    // Satz 2 / Abs. 2 i.V.m. Abs. 3 OR, Fassung 1.1.2026: «kann nicht zu Lasten des
    // Bestellers abgeändert werden»). Die Vereinbarung von SIA 118 ist Vertragsinhalt
    // und kann die zwingende Norm nicht verdrängen – massgeblich ist allein das Objekt.
    // Beim beweglichen Werk beruhen die 5 Jahre nur auf SIA 118 (gesetzlich 2 Jahre) →
    // nicht teilzwingend.
    teilzwingend = neu && objekt !== 'beweglich';
    dauerNorm = objekt === 'unbeweglich'
      ? N('Art. 371 Abs. 2 OR', '5 Jahre ab Abnahme (unbewegliches Werk, inkl. Architekt/Ingenieur)')
      : objekt === 'integriert'
        ? N('Art. 371 Abs. 1 OR', '5 Jahre (integriertes bewegliches Werk)')
        : N('Art. 371 Abs. 1 OR', '2 Jahre ab Abnahme');
  } else {
    jahre = objekt === 'integriert' ? 5 : 2;
    dauerNorm = objekt === 'integriert'
      ? N('Art. 210 Abs. 2 OR', '5 Jahre (integrierte Sache); dispositiv')
      : N('Art. 210 Abs. 1 OR', '2 Jahre ab Ablieferung');
  }

  // Vereinbarte Frist prüfen (Mindestdauern / Höchstdauer)
  let vereinbartUnwirksam = false;
  const v = input.vereinbarteVerjaehrungJahre;
  if (!input.arglist && v != null && Number.isFinite(v) && v > 0) {
    // Mindestdauer bestimmen
    let mindest = 0;
    let mindestGrund = '';
    if (input.vertragstyp === 'fahrniskauf' && input.konsumentenkauf) {
      mindest = input.gebraucht ? 1 : 2;
      mindestGrund = `Art. 210 Abs. 4 OR (Konsumentenkauf: mind. ${mindest} Jahr${mindest > 1 ? 'e' : ''}${input.gebraucht ? ', gebrauchte Sache' : ''})`;
    }
    if (teilzwingend) {
      mindest = Math.max(mindest, 5);
      mindestGrund = istGrundstueck ? 'Art. 219a Abs. 3 OR (teilzwingend)' : 'Art. 371 Abs. 3 OR (teilzwingend)';
    }
    // Übergangsrecht (F5-05, RL-06): KEINE Rückwirkung der teilzwingenden 5-Jahres-Frist.
    // Die Teilrevision «Baumängel» (AS 2025 270, in Kraft 1.1.2026) enthält keine eigene
    // Übergangsbestimmung (Ziff. I–III; https://www.fedlex.admin.ch/eli/oc/2025/270/de).
    // Damit gilt Art. 1 Abs. 2 SchlT ZGB (SR 210): vor dem Inkrafttreten vorgenommene
    // Handlungen – hier die Verkürzungsabrede – unterliegen «in Bezug auf ihre rechtliche
    // Verbindlichkeit» dem bei ihrer Vornahme geltenden Recht
    // (https://www.fedlex.admin.ch/eli/cc/24/233_245_233/de, Fassung 1.7.2026).
    // Botschaft BBl 2022 2743, Ziff. 4.2: Vereinbarungen eines Altvertrags werden «nach dem
    // alten Recht beurteilt», ausdrücklich auch bei der Gewährleistung.
    // Altes Recht (SR 220, Fassung 1.1.2025, https://www.fedlex.admin.ch/eli/cc/27/317_321_377/20250101/de):
    // Art. 371 Abs. 2 und Art. 219 Abs. 3 OR a.F. sind dispositiv; die Unabänderlichkeit
    // «zu Lasten des Bestellers/Käufers» steht erst in Art. 371 Abs. 3 / Art. 219a Abs. 3 OR
    // (Fassung 1.1.2026). Art. 49 SchlT ZGB betrifft die gesetzliche Frist (unverändert
    // 5 Jahre), nicht die Gültigkeit der Parteiabrede.
    // Geprüft 24.9.2026 gegen die Fedlex-XML-Fassungen; bis zu diesem Fix (24.9.2026) hat die Engine
    // die Mindestdauer rückwirkend angewandt (Befund F5-05, Prüfung Rechtslogik 23.9.2026).
    if (!neu && v < 5 && (istGrundstueck || (istWerk && objekt !== 'beweglich'))) {
      warnungen.push(`Übergangsrecht: Altvertrag (Vertragsschluss vor dem 1.1.2026) – die vereinbarte Verkürzung wird nach dem bei Vertragsschluss geltenden Recht beurteilt (Art. 1 Abs. 2 SchlT ZGB). Die Unabänderlichkeit zu Lasten ${istGrundstueck ? 'des Käufers (Art. 219a Abs. 3 OR)' : 'des Bestellers (Art. 371 Abs. 3 OR)'} gilt erst für Verträge ab dem 1.1.2026 und wirkt nicht zurück.`);
    }

    if (v < mindest) {
      vereinbartUnwirksam = true;
      warnungen.push(`Die vereinbarte Verjährungsfrist von ${v} Jahr${v > 1 ? 'en' : ''} ist unwirksam (${mindestGrund}) – es gilt die gesetzliche Frist von ${jahre} Jahren.`);
    } else if (v < jahre) {
      jahre = v;
      warnungen.push('Zulässige vertragliche Verkürzung – sie darf die Rechtsverfolgung aber nicht in unbilliger Weise erschweren (BGE 108 II 194).');
    } else if (v > jahre) {
      jahre = Math.min(v, 10);
      if (v > 10) warnungen.push('Vertragliche Verlängerung über 10 Jahre hinaus ist unzulässig – auf die Höchstdauer von 10 Jahren gekürzt (Art. 127 OR; BGE 132 III 226).');
    }
  }

  const verjEnde = werktagsEnde(addYears(verjBeginn, jahre), input.kanton);
  const verjaehrt = isAfter(stichtag, verjEnde);

  rechenweg.push({
    beschreibung: 'Schritt 3 – Verjährung der Mängelrechte',
    zwischenergebnis: `${jahre} Jahre ab ${istGrundstueck ? 'Eigentumserwerb (Grundbucheintrag)' : istWerk ? 'Abnahme des Werks' : 'Ablieferung'} (${fmt(verjBeginn)}) → ${fmt(verjEnde)}${
      input.arglist ? ' – bei nachgewiesener absichtlicher Täuschung kann sich der Verkäufer/Unternehmer nicht auf die kurze Verjährung berufen' : ''}${
      !istGrundstueck && objekt !== 'unbeweglich' && !input.arglist ? '; massgeblich ist die Ablieferung/Abnahme, selbst wenn der Mangel erst später entdeckt wird' : ''}.`,
    normen: [dauerNorm, N('Art. 132 OR', 'Beginntag zählt nicht; Ende am zahlengleichen Tag'), N('Art. 78 OR', 'Werktagsregel')],
  });

  rechenweg.push({
    beschreibung: 'Schritt 4 – Rechtsnatur und AT-Mechanik',
    zwischenergebnis: 'Die Rügefrist ist eine Verwirkungsfrist (keine Unterbrechung/Hemmung; Versäumnis = Genehmigungsfiktion). Die Verjährung ist Einrede (Art. 142 OR) und unterliegt der AT-Mechanik (Stillstand, Unterbrechung, Verzicht – siehe Verjährungsrechner). Eine Mängelrüge unterbricht die Verjährung NICHT; nötig sind Klage, Schlichtungsgesuch, Betreibung oder Anerkennung (Art. 135 OR) bzw. Verzicht (Art. 141 OR). Rechtzeitige Anzeige innerhalb der Verjährungsfrist erhält die Einreden des Käufers (Art. 210 Abs. 5 OR).',
    normen: [N('Art. 135 OR'), N('Art. 141 OR'), N('Art. 142 OR'), N('Art. 210 Abs. 5 OR', 'Einredeerhalt')],
  });

  // Hinweis: Entdeckung nach Verjährungseintritt
  if (entdeckung && isAfter(entdeckung, verjEnde) && !input.arglist) {
    warnungen.push(`Der Mangel wurde erst nach Eintritt der Verjährung entdeckt (${fmt(entdeckung)} > ${fmt(verjEnde)}) – die Mängelrechte sind verjährt, «selbst wenn der Käufer die Mängel erst später entdeckt» (Art. 210 Abs. 1 OR).`);
  }
  // F5-06 (RL-06): Art. 219 Abs. 3 OR a.F. (Fassung 1.1.2025) erfasst nur «die Mängel eines
  // Gebäudes»; für übrige Grundstücksmängel verweist Art. 221 OR auf den Fahrniskauf
  // (Art. 210 Abs. 1 OR in der Fassung 1.1.2025: zwei Jahre). Ohne Eingabe zur Mangelart
  // nicht berechenbar und in der Lehre strittig → nur Hinweis; gerechnet sind 5 Jahre.
  if (istGrundstueck && !neu && !input.arglist) {
    warnungen.push('Grundstückkauf nach altem Recht: Die gerechneten 5 Jahre (Art. 219 Abs. 3 OR, Fassung bis 31.12.2025) gelten nur für Mängel eines Gebäudes. Für andere Mängel des Grundstücks (z. B. des Bodens) verweist Art. 221 OR auf den Fahrniskauf – Art. 210 Abs. 1 OR sah zwei Jahre vor; Beginn und Abgrenzung sind im Einzelfall zu prüfen.');
  }
  if (input.konsumentenkauf) {
    annahmen.push('Konsumentenkauf: Es wird unterstellt, dass alle drei Merkmale von Art. 210 Abs. 4 OR kumulativ erfüllt sind (persönlicher/familiärer Gebrauch, gewerblicher Verkäufer, Verkürzungsabrede).');
  }
  warnungen.push(
    'Nicht abgebildet: Viehkauf (Art. 198/202 OR), Kulturgüter (Art. 210 Abs. 3 OR) und die Rechtsgewährleistung/Eviktion (ordentliche Frist nach Art. 127 OR). Umstritten bzw. einzelfallabhängig: Beginn bei sukzessiver Ablieferung, Abgrenzung Werkvertrag/Kauf bei herzustellenden Sachen, Reichweite der «Integration» in ein Bauwerk.',
  );

  const normverweise: Normverweis[] = [
    ...(input.vertragstyp === 'fahrniskauf' ? [N('Art. 197 OR', 'Sachgewährleistung'), N('Art. 201 OR', 'Prüf-/Rügeobliegenheit'), N('Art. 210 OR', 'Verjährung')] : []),
    ...(istWerk ? [N('Art. 367 OR', 'Prüfung/Rüge'), N('Art. 368 OR', 'Mängelrechte'), N('Art. 370 OR', 'Genehmigung'), N('Art. 371 OR', 'Verjährung')] : []),
    ...(istGrundstueck ? (neu ? [N('Art. 219a OR', 'Rüge/Nachbesserung/Verjährung (neu)')] : [N('Art. 219 OR', 'Gewährleistung Grundstückkauf'), N('Art. 201 OR', 'Rüge analog')]) : []),
    ...(input.arglist ? [N('Art. 203 OR'), N('Art. 210 Abs. 6 OR')] : []),
    N('Art. 132 OR'), N('Art. 142 OR'),
  ];

  const ruegeText = ruege.art === 'entfaellt'
    ? 'Rügeobliegenheit entfällt (Arglist).'
    : ruege.art === 'tage60'
      ? `Mängelrüge bis ${fmt(parseISO(ruege.endeISO!))} (60 Tage, zwingend).`
      : ruege.art === 'sia'
        ? `Mängelrüge während der SIA-Garantiefrist bis ${fmt(parseISO(ruege.endeISO!))}.`
        : `Mängelrüge «sofort» – Richtwert bis ${fmt(parseISO(ruege.richtwertISO!))} (sicher: ${fmt(parseISO(ruege.sicherISO!))}, äusserstens: ${fmt(parseISO(ruege.maximalISO!))}).`;

  return {
    ergebnis: `${ruegeText} Verjährung der Mängelrechte: ${jahre} Jahre, bis ${fmt(verjEnde)}${verjaehrt ? ` – am Stichtag ${fmt(stichtag)} VERJÄHRT (Einrede, Art. 142 OR)` : ''}.`,
    status: 'ok',
    rechenweg, annahmen, warnungen, normverweise,
    rechtsstand,
    ruege,
    verjaehrung: {
      jahre, teilzwingend, vereinbartUnwirksam,
      beginnISO: iso(verjBeginn),
      endeISO: iso(verjEnde),
      verjaehrtAmStichtag: verjaehrt,
    },
  };
}
