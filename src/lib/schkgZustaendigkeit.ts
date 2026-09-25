// Dossier: bibliothek/normen/schkg-zustaendigkeit-regelwerk.md
// ─── SchKG-Zuständigkeits-Engine (Rechtsweg «Betreibung») ───────────────────
//
// Eigene Engine analog Zivil (Anordnung David 5.6.2026; §4: KEINE Fusion mit
// lib/zustaendigkeit.ts). Quelle: bibliothek/normen/schkg-zustaendigkeit-
// regelwerk.md (Wortlaute verbatim am Fedlex-Cache /tmp/schkg.html, Stand
// 1.1.2025, verifiziert 5.6.2026) — insb. die Synthese-Tabelle §6.
// Kosten: GebV SchKG (SR 281.35) Art. 16 — Staffel Wert für Wert am
// Filestore-HTML der Konsolidierung 1.1.2026 verifiziert (Dossier
// gebv-schkg-kostenrechner, 7.6.2026: AS 2025 630 ändert nur Art. 15a/15b
// eSchKG; Beträge seit 1.1.2022 unverändert).
//
// Rein und deterministisch (§2). Reihenfolge der Prüfung analog Zivil:
// 1) BETREIBUNGSORT (Wurzelgrösse, Art. 46–55) → 2) FORUM des Anliegens
// (Synthese-Tabelle) → 3) Eingabe-Art/Verfahren → 4) FRISTEN (Verwirkung!).

import type { Berechnungsergebnis } from '../types/legal';

export type SchkgSchuldnerTyp =
  | 'natuerlich_wohnsitz'      // Art. 46 Abs. 1
  | 'natuerlich_ohne_wohnsitz' // Art. 48
  | 'jur_person_hr'            // Art. 46 Abs. 2 (Sitz)
  | 'jur_person_nicht_hr'      // Art. 46 Abs. 2 (Hauptsitz der Verwaltung)
  | 'erbschaft'                // Art. 49
  | 'stockwerkeigentuemer'     // Art. 46 Abs. 4 (Gemeinschaft → Ort der Sache)
  | 'ausland_niederlassung';   // Art. 50 Abs. 1

export type SchkgPfand = 'kein' | 'faustpfand' | 'grundpfand';

export type SchkgAnliegen =
  | 'betreibung_einleiten'
  | 'rechtsoeffnung'
  | 'aberkennungsklage'
  | 'anerkennungsklage'
  | 'rueckforderung'
  | 'feststellung'        // Art. 85 / 85a
  | 'widerspruch'         // Art. 106–109
  | 'kollokation'         // Art. 148 / 250
  | 'arrest'
  | 'konkursbegehren'
  | 'beschwerde_amt';     // Art. 17–19 (Aufsichtsbehörde!)

export type WiderspruchKonstellation =
  | 'gewahrsam_schuldner'        // 107/109 I Ziff. 1 → Betreibungsort
  | 'gewahrsam_dritter_ch'       // 108/109 II → Wohnsitz Beklagter
  | 'gewahrsam_dritter_ausland'  // 108/109 I Ziff. 2 → Betreibungsort
  | 'grundstueck';               // 109 III → Ort des Grundstücks

export interface SchkgInput {
  anliegen: SchkgAnliegen;
  schuldnerTyp: SchkgSchuldnerTyp;
  pfand?: SchkgPfand;
  arrestGelegt?: boolean;
  forderungCHF?: number | null;
  widerspruchKonstellation?: WiderspruchKonstellation;
  kollokationIn?: 'pfaendung' | 'konkurs';
  rechtsoeffnungArt?: 'provisorisch' | 'definitiv';
}

interface SchkgNorm { artikel: string; bemerkung?: string }
export interface SchkgFrist { label: string; frist: string; norm: string; kritisch: boolean }
interface SchkgSchritt { titel: string; text: string }

export interface SchkgErgebnis {
  betreibungsort: { text: string; normen: SchkgNorm[] };
  forum: { stelle: string; text: string; normen: SchkgNorm[] };
  eingabe: { art: string; verfahren: string };
  fristen: SchkgFrist[];
  /** Gebühr Zahlungsbefehl nach Art. 16 GebV SchKG (nur bei Einleitung). */
  kostenZahlungsbefehl: { gebuehrCHF: number; band: string } | null;
  fahrplan: SchkgSchritt[];
  warnungen: string[];
  weichen: string[];
  normverweise: SchkgNorm[];
}

// Art. 16 Abs. 1 GebV SchKG — Staffel wörtlich (verifiziert an der
// Konsolidierung 1.1.2026; Beträge seit 1.1.2022 unverändert):
const GEBUEHR_ZB: { bis: number; gebuehr: number; band: string }[] = [
  { bis: 100, gebuehr: 7, band: 'bis 100' },
  { bis: 500, gebuehr: 20, band: 'über 100 bis 500' },
  { bis: 1_000, gebuehr: 40, band: 'über 500 bis 1 000' },
  { bis: 10_000, gebuehr: 60, band: 'über 1 000 bis 10 000' },
  { bis: 100_000, gebuehr: 90, band: 'über 10 000 bis 100 000' },
  { bis: 1_000_000, gebuehr: 190, band: 'über 100 000 bis 1 000 000' },
  { bis: Number.POSITIVE_INFINITY, gebuehr: 400, band: 'über 1 000 000' },
];

export function gebuehrZahlungsbefehl(forderungCHF: number): { gebuehrCHF: number; band: string } {
  if (!Number.isFinite(forderungCHF) || forderungCHF < 0) {
    throw new Error('Forderung muss eine Zahl ≥ 0 sein.');
  }
  const stufe = GEBUEHR_ZB.find((s) => forderungCHF <= s.bis)!;
  return { gebuehrCHF: stufe.gebuehr, band: stufe.band };
}

const ORT_NORM: Record<SchkgSchuldnerTyp, { text: string; norm: SchkgNorm }> = {
  natuerlich_wohnsitz: { text: 'am WOHNSITZ der Schuldnerin/des Schuldners', norm: { artikel: 'Art. 46 Abs. 1 SchKG' } },
  natuerlich_ohne_wohnsitz: { text: 'am AUFENTHALTSORT (kein fester Wohnsitz)', norm: { artikel: 'Art. 48 SchKG' } },
  jur_person_hr: { text: 'am SITZ der im Handelsregister eingetragenen juristischen Person/Gesellschaft', norm: { artikel: 'Art. 46 Abs. 2 SchKG' } },
  jur_person_nicht_hr: { text: 'am HAUPTSITZ DER VERWALTUNG (nicht eingetragene juristische Person)', norm: { artikel: 'Art. 46 Abs. 2 SchKG' } },
  erbschaft: { text: 'am Ort, wo die Erblasserin/der Erblasser zur Zeit des Todes betrieben werden konnte (solange Teilung/Gemeinderschaft/amtliche Liquidation nicht erfolgt ist)', norm: { artikel: 'Art. 49 SchKG' } },
  stockwerkeigentuemer: { text: 'am ORT DER GELEGENEN SACHE (Stockwerkeigentümergemeinschaft)', norm: { artikel: 'Art. 46 Abs. 4 SchKG' } },
  ausland_niederlassung: { text: 'am SITZ DER SCHWEIZER GESCHÄFTSNIEDERLASSUNG (für auf deren Rechnung eingegangene Verbindlichkeiten); bei gewähltem Spezialdomizil an diesem Ort', norm: { artikel: 'Art. 50 SchKG' } },
};

export function bestimmeSchkgZustaendigkeit(input: SchkgInput): SchkgErgebnis {
  const warnungen: string[] = [];
  const weichen: string[] = [];
  const normverweise: SchkgNorm[] = [];
  const fristen: SchkgFrist[] = [];
  const fahrplan: SchkgSchritt[] = [];
  const pfand = input.pfand ?? 'kein';

  // ── 1 · Betreibungsort (Wurzelgrösse) ──────────────────────────────────────
  const basis = ORT_NORM[input.schuldnerTyp];
  let ortText: string;
  const ortNormen: SchkgNorm[] = [];
  if (pfand === 'grundpfand') {
    ortText = 'ZWINGEND am Ort des verpfändeten Grundstücks (bei mehreren Grundstücken: Betreibungskreis des wertvollsten Teils) — der allgemeine Betreibungsort steht NICHT zur Wahl';
    ortNormen.push({ artikel: 'Art. 51 Abs. 2 SchKG' });
  } else if (pfand === 'faustpfand') {
    ortText = `nach Wahl der Gläubigerin/des Gläubigers: ${basis.text} ODER am Ort, wo sich das Pfand bzw. sein wertvollster Teil befindet`;
    ortNormen.push({ artikel: 'Art. 51 Abs. 1 SchKG' }, basis.norm);
  } else {
    ortText = basis.text;
    ortNormen.push(basis.norm);
  }
  if (input.arrestGelegt && pfand !== 'grundpfand') {
    if (input.anliegen === 'konkursbegehren') {
      // Logik-Sweep 6.6.2026: Für das KONKURSBEGEHREN darf der Arrest-
      // Wahlort gar nicht erst angeboten werden — Art. 52 Satz 2 schliesst
      // ihn für Konkursandrohung/-eröffnung aus.
      warnungen.push('Trotz Arrest: Für das Konkursbegehren zählt AUSSCHLIESSLICH der ordentliche Betreibungsort — der Arrest-Wahlort des Art. 52 Satz 1 gilt für Konkursandrohung und Konkurseröffnung NICHT (Art. 52 Satz 2 SchKG).');
      ortNormen.push({ artikel: 'Art. 52 SchKG', bemerkung: 'Satz 2' });
    } else {
      ortText += '; zusätzlich WAHLWEISE am Ort des Arrestgegenstands';
      ortNormen.push({ artikel: 'Art. 52 SchKG' });
      warnungen.push('Arrest-Betreibungsort (Art. 52 SchKG): Konkursandrohung und Konkurseröffnung sind NUR am ordentlichen Betreibungsort möglich (Art. 52 Satz 2 SchKG).');
    }
  }
  weichen.push('Nach Ankündigung der Pfändung, Zustellung der Konkursandrohung oder des Zahlungsbefehls der Wechselbetreibung wird die Betreibung am BISHERIGEN Ort fortgesetzt, auch wenn der Schuldner den Wohnsitz wechselt (Art. 53 SchKG).');


  // ── 2 · Forum + Eingabe + Fristen je Anliegen (Synthese-Tabelle §6) ───────
  let forum: SchkgErgebnis['forum'];
  let eingabe: SchkgErgebnis['eingabe'];
  let kostenZB: SchkgErgebnis['kostenZahlungsbefehl'] = null;

  switch (input.anliegen) {
    case 'betreibung_einleiten': {
      forum = {
        stelle: 'Betreibungsamt am Betreibungsort',
        text: 'Das Betreibungsbegehren geht an das BETREIBUNGSAMT des Betreibungsortes (kein Gericht). Das zuständige Amt ermittelt die amtliche EasyGov-Betreibungsauskunft (SECO) nach dem Wohnort der Schuldnerin/des Schuldners.',
        normen: [{ artikel: 'Art. 67 SchKG', bemerkung: 'Betreibungsbegehren' }],
      };
      eingabe = { art: 'Betreibungsbegehren (Formular oder eSchKG)', verfahren: 'Vollstreckungsverfahren (kein Prozess); der Zahlungsbefehl ergeht ohne materielle Prüfung' };
      if (input.forderungCHF != null) kostenZB = gebuehrZahlungsbefehl(input.forderungCHF);
      fristen.push({ label: 'Rechtsvorschlag der Gegenseite', frist: '10 Tage ab Zustellung des Zahlungsbefehls', norm: 'Art. 74 Abs. 1 SchKG', kritisch: false });
      fahrplan.push(
        { titel: 'Betreibungsbegehren stellen', text: 'Gläubiger/Schuldner/Forderung (CHF, Grund) bezeichnen — Formular des Betreibungsamts oder eSchKG (Art. 67 SchKG). Ein Urteil ist NICHT erforderlich.' },
        { titel: 'Beim Betreibungsamt des Betreibungsortes einreichen', text: 'Das zuständige Amt ergibt sich aus dem Betreibungsort (oben); konkrete Adresse über das amtliche Verzeichnis (PLZ-Suche).' },
        { titel: 'Zahlungsbefehl wird zugestellt', text: 'Die Gegenseite kann innert 10 Tagen Rechtsvorschlag erheben (Art. 74 SchKG) — dann braucht es Rechtsöffnung oder Anerkennungsklage.' },
        { titel: 'Ohne Rechtsvorschlag: Fortsetzung verlangen', text: 'Frühestens 20 Tage, spätestens 1 Jahr nach Zustellung des Zahlungsbefehls (Art. 88 SchKG) — sonst erlischt die Betreibung.' },
      );
      fristen.push({ label: 'Fortsetzungsbegehren', frist: 'frühestens 20 Tage, spätestens 1 Jahr ab Zustellung ZB (Frist steht bei Rechtsvorschlag während des Gerichtsverfahrens still, Abs. 2)', norm: 'Art. 88 SchKG', kritisch: true });
      break;
    }
    case 'rechtsoeffnung': {
      const art = input.rechtsoeffnungArt ?? 'provisorisch';
      forum = {
        stelle: 'Gericht des Betreibungsortes (Rechtsöffnungsgericht)',
        text: 'Das Gesuch um Rechtsöffnung ist beim GERICHT DES BETREIBUNGSORTES zu stellen (Art. 84 Abs. 1 SchKG); summarisches Verfahren (Art. 251 lit. a ZPO).',
        // Norm-Anker-Präzision (QS-GP 2.7.2026): Abs./lit. wie im Prosatext –
        // Art. 84 Abs. 1 SchKG (Richter des Betreibungsortes) / Art. 251 lit. a ZPO
        // (summarisches Verfahren Rechtsöffnung), verbatim Fedlex SR 281.1 (1.1.2026)
        // bzw. SR 272 (1.7.2026), https://www.fedlex.admin.ch/eli/cc/11/529_488_529/de.
        normen: [{ artikel: 'Art. 84 Abs. 1 SchKG' }, { artikel: 'Art. 251 lit. a ZPO' }],
      };
      eingabe = {
        art: art === 'definitiv' ? 'Gesuch um DEFINITIVE Rechtsöffnung (vollstreckbares Urteil/Entscheid, Art. 80 SchKG)' : 'Gesuch um PROVISORISCHE Rechtsöffnung (Schuldanerkennung, Art. 82 SchKG)',
        verfahren: 'Summarisches Verfahren — KEIN Gerichtsferien-Stillstand (Art. 145 Abs. 2 lit. b ZPO)',
      };
      if (art === 'provisorisch') {
        fristen.push({ label: 'Aberkennungsklage der Gegenseite', frist: '20 Tage ab Rechtsöffnung', norm: 'Art. 83 Abs. 2 SchKG', kritisch: true });
        weichen.push('Nach provisorischer Rechtsöffnung kann die Schuldnerseite innert 20 Tagen Aberkennungsklage erheben (Art. 83 Abs. 2 SchKG) — erst danach wird die Rechtsöffnung definitiv wirksam.');
      }
      fahrplan.push(
        { titel: 'Rechtsöffnungsgesuch verfassen', text: art === 'definitiv' ? 'Vollstreckbaren Entscheid beilegen (Art. 80/81 SchKG); Einwendungen der Gegenseite sind eng begrenzt.' : 'Schuldanerkennung (Vertrag, unterschriebenes Dokument) beilegen (Art. 82 SchKG).' },
        { titel: 'Beim Gericht des Betreibungsortes einreichen', text: 'Summarisches Verfahren; der Entscheid soll innert 5 Tagen nach Eingang der Stellungnahme ergehen (Art. 84 Abs. 2 SchKG).' },
        { titel: 'Nach Gutheissung: Fortsetzung der Betreibung', text: 'Fortsetzungsbegehren beim Betreibungsamt (Art. 88 SchKG)' + (art === 'provisorisch' ? ' — vorbehältlich der Aberkennungsklage (20 Tage).' : '.') },
      );
      break;
    }
    case 'aberkennungsklage': {
      forum = {
        stelle: 'Gericht des Betreibungsortes',
        text: 'Die Aberkennungsklage ist beim GERICHT DES BETREIBUNGSORTES einzureichen (Art. 83 Abs. 2 SchKG) — ordentliches (bzw. je nach Streitwert vereinfachtes) Verfahren.',
        normen: [{ artikel: 'Art. 83 Abs. 2 SchKG' }],
      };
      eingabe = { art: 'Aberkennungsklage (negative Feststellungsklage der Schuldnerseite)', verfahren: 'Ordentliches/vereinfachtes Verfahren nach ZPO; KEINE Schlichtung (Art. 198 lit. e Ziff. 1 ZPO)' };
      fristen.push({ label: 'Klagefrist', frist: '20 Tage ab Erteilung der provisorischen Rechtsöffnung', norm: 'Art. 83 Abs. 2 SchKG', kritisch: true });
      fahrplan.push(
        { titel: 'Frist sichern: 20 Tage', text: 'Die Frist ist eine VERWIRKUNGSFRIST — nach Ablauf wird die provisorische Rechtsöffnung definitiv (Art. 83 Abs. 3 SchKG).' },
        { titel: 'Klage direkt beim Gericht des Betreibungsortes', text: 'Keine Schlichtung (Art. 198 lit. e Ziff. 1 ZPO) — die Klage geht direkt ans Gericht.' },
      );
      break;
    }
    case 'anerkennungsklage': {
      forum = {
        stelle: 'ordentliches Gericht nach ZPO (KEIN SchKG-Forum)',
        text: 'Die Anerkennungsklage (Art. 79 SchKG) folgt den ORDENTLICHEN Gerichtsständen der ZPO (i. d. R. Wohnsitz/Sitz der beklagten Partei, Art. 10 ZPO) — der Betreibungsort begründet KEINE Zuständigkeit.',
        normen: [{ artikel: 'Art. 79 SchKG' }, { artikel: 'Art. 10 ZPO' }],
      };
      eingabe = { art: 'Anerkennungsklage (ordentlicher Prozess über den Bestand der Forderung)', verfahren: 'Verfahren nach ZPO inkl. Schlichtung (für die örtliche Prüfung: Zivil-Rechtsweg dieses Rechners nutzen)' };
      weichen.push('Alternative bei Schuldanerkennung/Urteil: provisorische bzw. definitive Rechtsöffnung am Betreibungsort (Art. 80/82 SchKG) — meist schneller und günstiger.');
      fahrplan.push(
        { titel: 'Forum nach ZPO bestimmen', text: 'Wohnsitz/Sitz der beklagten Partei (Art. 10 ZPO) oder besonderer Gerichtsstand — den Zivil-Rechtsweg dieses Rechners verwenden.' },
        { titel: 'Schlichtung/Klage nach ZPO', text: 'Obsiegen beseitigt den Rechtsvorschlag (Art. 79 SchKG) — danach Fortsetzungsbegehren.' },
      );
      break;
    }
    case 'rueckforderung': {
      forum = {
        stelle: 'Gericht des Betreibungsortes ODER ordentlicher Gerichtsstand der beklagten Partei (Wahl)',
        text: 'Die Rückforderungsklage (Nichtschuld bezahlt) kann am BETREIBUNGSORT oder am ordentlichen Gerichtsstand der BEKLAGTEN Partei erhoben werden (Art. 86 Abs. 2 SchKG).',
        normen: [{ artikel: 'Art. 86 SchKG' }],
      };
      eingabe = { art: 'Rückforderungsklage', verfahren: 'Verfahren nach ZPO' };
      fristen.push({ label: 'Klagefrist', frist: '1 Jahr ab Zahlung', norm: 'Art. 86 Abs. 1 SchKG', kritisch: true });
      fahrplan.push({ titel: 'Innert 1 Jahr klagen', text: 'Beweislast: Nichtschuld der bezahlten Forderung (Art. 86 Abs. 3 SchKG); Wahlgerichtsstand nutzen.' });
      break;
    }
    case 'feststellung': {
      forum = {
        stelle: 'Gericht des Betreibungsortes',
        text: 'Klagen nach Art. 85 (Aufhebung/Einstellung bei urkundlichem Tilgungs-/Stundungsnachweis, summarisch) und Art. 85a SchKG (Feststellung des Nichtbestands) gehen an das GERICHT DES BETREIBUNGSORTES.',
        normen: [{ artikel: 'Art. 85 SchKG' }, { artikel: 'Art. 85a SchKG' }],
      };
      eingabe = { art: 'Gesuch (Art. 85: Urkundenbeweis, summarisch) bzw. Klage (Art. 85a)', verfahren: 'Art. 85 summarisch (keine Schlichtung, Art. 198 lit. a ZPO) · Art. 85a ordentliches/vereinfachtes Verfahren, KEINE Schlichtung (Art. 198 lit. e Ziff. 2 ZPO)' };
      fristen.push({ label: 'Einreichung', frist: 'jederzeit während der Betreibung', norm: 'Art. 85/85a SchKG', kritisch: false });
      weichen.push('Art. 85a: Die Einstellung der Betreibung erfolgt erst auf gerichtliche Anordnung hin (Abs. 2) — die Klage allein stoppt die Betreibung nicht.');
      fahrplan.push({ titel: 'Nachweis wählen', text: 'Mit Urkunde (Quittung, Stundungsvereinbarung): schneller Weg über Art. 85. Ohne Urkunde: Klage nach Art. 85a.' });
      break;
    }
    case 'widerspruch': {
      const k = input.widerspruchKonstellation ?? 'gewahrsam_schuldner';
      // M-4-Fix Bug-Check 6.6.2026: Die 20-Tage-Frist hat je Konstellation
      // GENAU EINE Grundlage (Wortlaut am Fedlex-Cache verifiziert):
      // Art. 107 Abs. 5 setzt die Frist dem DRITTEN (Gewahrsam Schuldner;
      // Grundstück NICHT aus dem Grundbuch ersichtlich, Abs. 1 Ziff. 3),
      // Art. 108 Abs. 2 setzt sie GLÄUBIGER UND SCHULDNER (Gewahrsam Dritter;
      // Grundstück aus dem Grundbuch ersichtlich, Abs. 1 Ziff. 3). Die
      // frühere Pauschal-Zitierung «107 Abs. 5 / 108 Abs. 2» mischte die
      // Parteirollen; beim Grundstück entscheidet der Grundbuch-Eintrag.
      const map: Record<WiderspruchKonstellation, { stelle: string; norm: string; fristNorm: string }> = {
        gewahrsam_schuldner: { stelle: 'Gericht des Betreibungsortes (Dritter klagt)', norm: 'Art. 107 Abs. 5 / 109 Abs. 1 Ziff. 1 SchKG', fristNorm: 'Art. 107 Abs. 5 SchKG' },
        gewahrsam_dritter_ch: { stelle: 'Gericht am Wohnsitz der beklagten Partei', norm: 'Art. 108 / 109 Abs. 2 SchKG', fristNorm: 'Art. 108 Abs. 2 SchKG' },
        gewahrsam_dritter_ausland: { stelle: 'Gericht des Betreibungsortes', norm: 'Art. 108 / 109 Abs. 1 Ziff. 2 SchKG', fristNorm: 'Art. 108 Abs. 2 SchKG' },
        grundstueck: { stelle: 'Gericht am Ort der gelegenen Sache (Grundstück)', norm: 'Art. 109 Abs. 3 SchKG', fristNorm: 'Art. 107 Abs. 5 bzw. 108 Abs. 2 SchKG (je nach Grundbuch-Eintrag des Anspruchs)' },
      };
      forum = {
        stelle: map[k].stelle,
        text: `Widerspruchsverfahren (Drittansprache an gepfändeten Vermögenswerten): zuständig ist das ${map[k].stelle} (${map[k].norm}).`,
        normen: [{ artikel: map[k].norm }],
      };
      eingabe = { art: 'Widerspruchsklage', verfahren: 'Ordentliches bzw. vereinfachtes Verfahren (je nach Streitwert); KEINE Schlichtung (Art. 198 lit. e Ziff. 3 ZPO)' };
      fristen.push({ label: 'Klagefrist', frist: '20 Tage ab Fristansetzung durch das Betreibungsamt', norm: map[k].fristNorm, kritisch: true });
      fahrplan.push({ titel: 'Konstellation bestimmt Forum UND Parteirollen', text: 'Gewahrsam beim Schuldner → der DRITTE muss klagen (Art. 107); Gewahrsam beim Dritten → der GLÄUBIGER muss klagen (Art. 108). Die 20-Tage-Frist ist Verwirkung.' });
      break;
    }
    case 'kollokation': {
      const inKonkurs = (input.kollokationIn ?? 'pfaendung') === 'konkurs';
      forum = {
        stelle: inKonkurs ? 'Gericht des Konkursortes' : 'Gericht des Betreibungsortes',
        text: inKonkurs
          ? 'Kollokationsklage im KONKURS: Gericht des Konkursortes (Art. 250 Abs. 1 SchKG).'
          : 'Kollokationsklage in der PFÄNDUNG: Gericht des Betreibungsortes (Art. 148 Abs. 1 SchKG).',
        normen: [{ artikel: inKonkurs ? 'Art. 250 SchKG' : 'Art. 148 SchKG' }],
      };
      eingabe = { art: 'Kollokationsklage', verfahren: 'Ordentliches bzw. vereinfachtes Verfahren (je nach Streitwert); KEINE Schlichtung (Art. 198 lit. e Ziff. 6 ZPO)' };
      fristen.push({ label: 'Klagefrist', frist: inKonkurs ? '20 Tage ab öffentlicher Auflage des Kollokationsplans' : '20 Tage ab Zustellung des Auszugs', norm: inKonkurs ? 'Art. 250 Abs. 1 SchKG' : 'Art. 148 Abs. 1 SchKG', kritisch: true });
      break;
    }
    case 'arrest': {
      forum = {
        stelle: 'Gericht des Betreibungsortes ODER Gericht am Ort der Vermögenswerte (Wahl)',
        text: 'Arrestgesuch beim Gericht des Betreibungsortes ODER am Ort, wo sich Vermögensgegenstände befinden (Art. 272 Abs. 1 SchKG); Glaubhaftmachung von Forderung, Arrestgrund (Art. 271) und Vermögenswerten.',
        normen: [{ artikel: 'Art. 271 SchKG' }, { artikel: 'Art. 272 SchKG' }],
      };
      eingabe = { art: 'Arrestgesuch (einseitig, ohne Anhörung der Gegenseite)', verfahren: 'Summarisches Verfahren (Art. 251 lit. a ZPO)' };
      fristen.push(
        { label: 'Arresteinsprache der Gegenseite', frist: '10 Tage ab Kenntnis des Arrests', norm: 'Art. 278 Abs. 1 SchKG', kritisch: true },
        { label: 'Arrestprosequierung (Betreibung/Klage)', frist: '10 Tage ab Zustellung der Arresturkunde', norm: 'Art. 279 Abs. 1 SchKG', kritisch: true },
        { label: 'Prosequierung nach Rechtsvorschlag', frist: '10 Tage ab Zustellung des Gläubigerdoppels des Zahlungsbefehls: Rechtsöffnung verlangen oder Anerkennungsklage; nach Abweisung im Rechtsöffnungsverfahren weitere 10 Tage für die Klage', norm: 'Art. 279 Abs. 2 SchKG', kritisch: true },
        { label: 'Fortsetzungsbegehren nach unbestrittenem Zahlungsbefehl', frist: '20 Tage ab Zustellung des Gläubigerdoppels des Zahlungsbefehls (ohne Rechtsvorschlag) bzw. ab rechtskräftiger Beseitigung des Rechtsvorschlags', norm: 'Art. 279 Abs. 3 SchKG', kritisch: true },
      );
      warnungen.push('Arrestkaution/Schadenersatzrisiko: Bei ungerechtfertigtem Arrest haftet die Arrestgläubigerin (Art. 273 SchKG); das Gericht kann Sicherheitsleistung verlangen.');
      fahrplan.push(
        { titel: 'Arrestgrund glaubhaft machen', text: 'Katalog des Art. 271 SchKG (z. B. kein Wohnsitz in der Schweiz, Schuldnerflucht, definitiver Rechtsöffnungstitel Ziff. 6).' },
        { titel: 'Nach Vollzug: prosequieren', text: 'Innert 10 Tagen Betreibung oder Klage anheben (Art. 279 SchKG) — sonst fällt der Arrest dahin.' },
      );
      break;
    }
    case 'konkursbegehren': {
      forum = {
        stelle: 'Konkursgericht am (ordentlichen) Betreibungsort',
        text: 'Das Konkursbegehren ist beim KONKURSGERICHT des Betreibungsortes zu stellen (Art. 166 SchKG); bei Arrest-/Pfand-Spezialorten gilt zwingend der ORDENTLICHE Betreibungsort (Art. 52 Satz 2 SchKG).',
        normen: [{ artikel: 'Art. 166 SchKG' }, { artikel: 'Art. 52 SchKG' }],
      };
      eingabe = { art: 'Konkursbegehren (nach Konkursandrohung)', verfahren: 'Summarisches Verfahren; Entscheid durch das Konkursgericht (Art. 171 SchKG)' };
      fristen.push(
        { label: 'Frühester Zeitpunkt', frist: '20 Tage nach Zustellung der Konkursandrohung', norm: 'Art. 166 Abs. 1 SchKG', kritisch: false },
        { label: 'Erlöschen des Rechts', frist: '15 Monate nach Zustellung des Zahlungsbefehls (Stillstand während des Rechtsvorschlag-Verfahrens, Abs. 2)', norm: 'Art. 166 Abs. 2 SchKG', kritisch: true },
        { label: 'Beschwerde gegen das Konkurserkenntnis', frist: '10 Tage', norm: 'Art. 174 SchKG', kritisch: true },
      );
      // M-5-Fix Bug-Check 6.6.2026: Die Konkursbetreibung setzt einen HR-
      // Eintrag des Schuldners in einer der Eigenschaften von Art. 39 Abs. 1
      // SchKG voraus; «in allen andern Fällen» wird auf PFÄNDUNG fortgesetzt
      // (Art. 42 Abs. 1; beide am Fedlex-Cache Wortlaut-verifiziert). Die
      // Schuldnertyp-Auswahl erfragt den HR-Status bei natürlichen Personen
      // nicht (Einzelfirma-Inhaber sind eingetragen!) — deshalb Warnung statt
      // Hard-Stop (§8). Vorbehalt: Konkurseröffnung OHNE vorgängige Betreibung
      // (Art. 190 Abs. 1 Ziff. 1: gegen JEDEN Schuldner bei Flucht/unbekanntem
      // Aufenthalt/betrügerischen Handlungen) bleibt ein eigener Weg.
      if (input.schuldnerTyp !== 'jur_person_hr') {
        warnungen.push('Voraussetzung prüfen: Die Konkursbetreibung setzt voraus, dass die Schuldnerin/der Schuldner im Handelsregister eingetragen ist — z.B. als Inhaber/in einer Einzelfirma, Kollektiv-/Kommanditgesellschaft(er), AG, GmbH, Genossenschaft, Verein oder Stiftung (Art. 39 Abs. 1 SchKG). Ohne HR-Eintrag wird die Betreibung auf PFÄNDUNG fortgesetzt (Art. 42 Abs. 1 SchKG) und es ergeht keine Konkursandrohung. Davon zu unterscheiden ist die Konkurseröffnung OHNE vorgängige Betreibung in den Sonderfällen von Art. 190 SchKG (u.a. unbekannter Aufenthalt, Flucht, betrügerische Handlungen).');
      }
      break;
    }
    case 'beschwerde_amt': {
      forum = {
        stelle: 'AUFSICHTSBEHÖRDE über Betreibungs- und Konkursämter (NICHT das Gericht)',
        text: 'Gegen VERFÜGUNGEN des Betreibungs-/Konkursamts (Pfändungsvollzug, Zustellung, Verwertung …) ist die BESCHWERDE an die kantonale Aufsichtsbehörde zu richten (Art. 17 SchKG) — nicht an das Zivilgericht. Materielle Einwände gegen die Forderung gehören dagegen vor das Gericht (Rechtsöffnung/Klagen).',
        normen: [{ artikel: 'Art. 17 SchKG' }, { artikel: 'Art. 13 SchKG' }],
      };
      eingabe = { art: 'Beschwerde (schriftlich, begründet)', verfahren: 'Aufsichtsverfahren; Weiterzug an das Bundesgericht nach Art. 19 SchKG (Beschwerde in Zivilsachen, streitwertunabhängig — Art. 74 Abs. 2 lit. c BGG)' };
      fristen.push(
        { label: 'Beschwerdefrist', frist: '10 Tage ab Kenntnis der Verfügung', norm: 'Art. 17 Abs. 2 SchKG', kritisch: true },
        { label: 'Rechtsverweigerung/-verzögerung', frist: 'jederzeit', norm: 'Art. 17 Abs. 3 SchKG', kritisch: false },
        // Ultra-Review NIEDRIG (7.6.2026): Für den BGer-Weiterzug gilt NICHT
        // die 30-Tage-Regelfrist, sondern verkürzt 10 Tage (Cache-verifiziert:
        // «Die Beschwerdefrist beträgt zehn Tage: a. bei Entscheiden der
        // kantonalen Aufsichtsbehörden in Schuldbetreibungs- und Konkurs-
        // sachen»); Wechselbetreibung sogar 5 Tage (Abs. 3 lit. a).
        { label: 'Weiterzug ans Bundesgericht', frist: '10 Tage ab Eröffnung des Aufsichts-Entscheids (Wechselbetreibung: 5 Tage)', norm: 'Art. 100 Abs. 2 lit. a BGG', kritisch: true },
      );
      weichen.push('NICHTIGE Verfügungen (Verstoss gegen Vorschriften, die im öffentlichen Interesse oder im Interesse unbeteiligter Dritter erlassen sind) sind ohne Fristbindung von Amtes wegen festzustellen (Art. 22 SchKG).');
      break;
    }
  }

  // ── 3 · Rechenweg/Normverweise sammeln ─────────────────────────────────────
  normverweise.push(...ortNormen, ...forum.normen);

  return {
    betreibungsort: { text: ortText, normen: ortNormen },
    forum, eingabe, fristen,
    kostenZahlungsbefehl: kostenZB,
    fahrplan, warnungen, weichen, normverweise,
  };
}

// ── Stillstand-Hinweis je Frist (RL-42 / Z1-06, Prüfung Rechtslogik 23.9.2026)
// Wortlaute (Fedlex-Filestore, abgerufen 25.9.2026):
//   Art. 145 Abs. 4 ZPO (SR 272, Fassung 1.7.2026): «Die Bestimmungen dieses
//   Gesetzes über den Stillstand der Fristen sind für alle Klagen nach dem
//   SchKG, die vor einem Gericht einzureichen sind, anwendbar. Sie sind für
//   die Beschwerde vor der Aufsichtsbehörde nicht anwendbar.»
//   Art. 56 Abs. 2 SchKG (SR 281.1, Fassung 1.1.2026): «Für die Klagen nach
//   diesem Gesetz, die vor einem Gericht einzureichen sind, sind
//   ausschliesslich die Bestimmungen der ZPO über den Stillstand der Fristen
//   anwendbar.»
// Anker gleich wie src/lib/schkgPresets.ts (RL-05/RL-17): Klagen → Art. 56
// Abs. 2 SchKG (+ Art. 145 Abs. 4 Satz 1 ZPO), zpo_stillstand; Aufsichts-
// beschwerde → Art. 145 Abs. 4 Satz 2 ZPO, Art. 63 SchKG nur bei Betreibungs-
// handlung. Nur Fristen mit eindeutigem Regime; Fristen mit eigenem Regime
// (Art. 74, 88 Abs. 2, 166 Abs. 2, BGG) und die Arrest-Fristen (Art. 278/279,
// Rechtslage seit 1.1.2025 offen, siehe Presets) bleiben ohne Pauschal-Hinweis.
// Als reine Ableitung aus der Frist-Norm gehalten (kein neues Feld im
// SchkgErgebnis): Anzeige und Bericht rufen dieselbe Funktion (§3/§5).
const ZPO_STILLSTAND_KLAGEN: ReadonlySet<string> = new Set([
  'Art. 83 Abs. 2 SchKG',   // Aberkennungsklage
  'Art. 86 Abs. 1 SchKG',   // Rückforderungsklage
  'Art. 107 Abs. 5 SchKG',  // Widerspruchsklage (Gewahrsam Schuldner)
  'Art. 108 Abs. 2 SchKG',  // Widerspruchsklage (Gewahrsam Dritter)
  'Art. 107 Abs. 5 bzw. 108 Abs. 2 SchKG (je nach Grundbuch-Eintrag des Anspruchs)',
  'Art. 148 Abs. 1 SchKG',  // Kollokationsklage Pfändung
  'Art. 250 Abs. 1 SchKG',  // Kollokationsklage Konkurs
]);
const SCHKG_STILLSTAND_KLAGE = 'Gerichtliche Klage: Es gilt der Fristenstillstand der ZPO (Ostern ± 7 Tage, 15. Juli–15. August, 18. Dezember–2. Januar), nicht die Betreibungsferien (Art. 56 Abs. 2 SchKG; Art. 145 Abs. 4 Satz 1 ZPO).';
const SCHKG_STILLSTAND_BESCHWERDE = 'Aufsichtsbeschwerde: KEIN Fristenstillstand der ZPO (Art. 145 Abs. 4 Satz 2 ZPO). Fällt das Fristende in die Betreibungsferien, verlängert Art. 63 SchKG die Frist nur, wenn die angefochtene Verfügung eine Betreibungshandlung ist — im Zweifel vom früheren Datum ausgehen.';

export function schkgFristStillstand(f: SchkgFrist): string | null {
  if (ZPO_STILLSTAND_KLAGEN.has(f.norm)) return SCHKG_STILLSTAND_KLAGE;
  if (f.norm === 'Art. 17 Abs. 2 SchKG') return SCHKG_STILLSTAND_BESCHWERDE;
  return null;
}

/** Amtliche Abfrage des zuständigen Betreibungs-/Konkursamts — deterministischer
 *  Einstieg zur konkreten Amtsadresse. Behörden-Audit 6.6.2026: die frühere
 *  BJ-eSchKG-URL (e-service.admin.ch/eschkg/app/verzeichnis) liefert 404;
 *  amtlicher Nachfolger ist die EasyGov-Betreibungsauskunft des SECO
 *  (vom BJ verlinkt, HTTP 200 verifiziert). */
export const BETREIBUNGSAEMTER_VERZEICHNIS = 'https://www.easygov.swiss/easygov/#/de/betreibungen';

// ── Abbildung in das einheitliche Berichts-Format (G3.1 / M-8, 10.6.2026):
// reine Darstellungs-Abbildung für PDF/Anzeige — alle Texte stammen
// unverändert aus dem SchkgErgebnis (§3/§5). Weichen erscheinen im Bericht
// bei den Warnhinweisen (§8: offene Rechtsfragen gehören ins Dokument).
export function schkgZustaendigkeitBericht(r: SchkgErgebnis): Berechnungsergebnis {
  return {
    ergebnis: `${r.forum.stelle} · ${r.eingabe.art}`,
    status: 'ok',
    rechenweg: [
      { beschreibung: 'Betreibungsort (Wurzelgrösse)', zwischenergebnis: `${r.betreibungsort.text}.`, normen: r.betreibungsort.normen },
      { beschreibung: 'Forum für dieses Anliegen', zwischenergebnis: `${r.forum.stelle}. ${r.forum.text}`, normen: r.forum.normen },
      { beschreibung: 'Eingabe und Verfahren', zwischenergebnis: `${r.eingabe.art}. ${r.eingabe.verfahren}.`, normen: [] },
      ...r.fristen.map((f) => {
        const stillstand = schkgFristStillstand(f);
        return {
          beschreibung: `Frist: ${f.label}${f.kritisch ? ' (Verwirkung)' : ''}`,
          zwischenergebnis: `${f.frist} (${f.norm})${stillstand ? ` — ${stillstand}` : ''}`,
          normen: [],
        };
      }),
      ...(r.kostenZahlungsbefehl ? [{
        beschreibung: 'Gebühr Zahlungsbefehl',
        zwischenergebnis: `CHF ${r.kostenZahlungsbefehl.gebuehrCHF.toFixed(2)} (Forderung ${r.kostenZahlungsbefehl.band} Franken)`,
        normen: [{ artikel: 'Art. 16 Abs. 1 GebV SchKG' }],
      }] : []),
      ...r.fahrplan.map((s) => ({ beschreibung: s.titel, zwischenergebnis: s.text, normen: [] })),
    ],
    annahmen: r.kostenZahlungsbefehl
      ? ['Tarifstand GebV SchKG: Konsolidierung 1.1.2026 (Art.-16-Staffel unverändert seit 1.1.2022; am Filestore-HTML verifiziert, Dossier gebv-schkg-kostenrechner). Hinzu kommen Zustellkosten (CHF 7.– je Versuch, Art. 16 Abs. 3) – vorzuschiessen und der Forderung zuschlagbar (Art. 68 SchKG).']
      : [],
    warnungen: [...r.weichen, ...r.warnungen],
    normverweise: r.normverweise,
  };
}
