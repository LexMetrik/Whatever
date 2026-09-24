// Dossier: bibliothek/recherche/stpo-rechtsmittel.md
import type { StrafFrist, StrafNorm } from './strafZustaendigkeit';
import type { Berechnungsergebnis } from '../types/legal';

// ─── StPO-Rechtsmittel-Engine (Rechtsweg «Straf», Stufe Rechtsmittel) ───────
//
// Eigene Engine analog der zivilen bestimmeRechtsmittel (§4: keine Fusion in
// strafZustaendigkeit.ts — gemeinsam sind nur die Anzeige-Typen). Quelle:
// bibliothek/recherche/stpo-rechtsmittel.md (Decision Tree + 12-Zeilen-
// Konstellationstabelle); alle tragenden Wortlaute am Cache /tmp/stpo.html
// (Stand 1.1.2024) verifiziert (6.6.2026): Art. 222 (rev. 2024: «Einzig die
// verhaftete Person …»), 382, 391 Abs. 2, 393–396, 398/399 (10-Tage-Anmeldung
// ≠ 20-Tage-Erklärung!), 410/411, 354–356; BGG 78 ff. am /tmp/bgg.html.
// Rein und deterministisch (§2): Die QUALIFIKATION (rechtlich geschütztes
// Interesse, Urteils- vs. Beschluss-Charakter, Revisionsgrund) ist Eingabe-
// Verantwortung und wird als Weiche/Warnung offengelegt (§8). KEIN
// Fristenstillstand: Art. 89 Abs. 2 StPO gilt vorbehaltlos.

export type StrafEntscheidTyp =
  | 'urteil_erstinstanz'          // Urteil/nachträgl. Entscheid/Einziehung → Berufung (Art. 398/399)
  | 'verfahrensleitend_gericht'   // verfahrensleitende Anordnung → KEIN Rechtsmittel (393 I lit. b)
  | 'anderer_entscheid_gericht'   // Beschluss/Verfügung erstinstanzl. Gericht → Beschwerde
  | 'verfuegung_sta_polizei'      // Vorverfahren inkl. Einstellung/Nichtanhandnahme → Beschwerde
  | 'strafbefehl'                 // → Einsprache (354)
  | 'zmg_haftentscheid'           // U-/Sicherheitshaft → Beschwerde NUR verhaftete Person (222)
  | 'zmg_andere_zwangsmassnahme'  // übrige ZMG-Entscheide → Beschwerde (393 I lit. c)
  | 'haftentscheid_berufungsverfahren' // Verfahrensleitung Berufungsgericht (233) → nur BGer
  | 'rechtskraeftiges_urteil'     // → Revision (410)
  | 'rechtsverweigerung';         // → Beschwerde FRISTLOS (396 II)

export type StrafAnfechtende =
  | 'beschuldigte_person' | 'privatklaegerschaft' | 'staatsanwaltschaft'
  | 'weitere_partei' | 'angehoerige';

export type StrafAnfechtungsziel = 'umfassend' | 'nur_sanktion' | 'nur_zivilpunkt' | 'nur_kosten';

export type RevisionsGrund =
  | 'noven'        // 410 Abs. 1 lit. a: neue Tatsachen/Beweismittel → unbefristet
  | 'widerspruch'  // 410 Abs. 1 lit. b: Widerspruch zu späterem Entscheid → 90 Tage
  | 'straftat'     // 410 Abs. 1 lit. c: Einwirkung durch Straftat → unbefristet
  | 'emrk';        // 410 Abs. 2: EGMR-Urteil → 90 Tage (411 Abs. 2)

export interface StrafRmInput {
  entscheidTyp: StrafEntscheidTyp;
  werFichtAn: StrafAnfechtende;
  anfechtungsziel?: StrafAnfechtungsziel; // Default 'umfassend'
  uebertretung?: boolean;                 // Kognitionsbeschränkung Berufung (398 Abs. 4)
  nurZugunstenBeschuldigte?: boolean;     // reformatio in peius (391 Abs. 2)
  revisionsgrund?: RevisionsGrund;        // nur bei rechtskraeftiges_urteil
  /** Bundesgerichtsbarkeit: Beschwerdeinstanz = Beschwerdekammer BStGer. */
  bundesgerichtsbarkeit?: boolean;
}

type StrafRechtsmittelTyp = 'berufung' | 'beschwerde' | 'einsprache' | 'revision' | 'keines';

export interface StrafRmErgebnis {
  statthaft: StrafRechtsmittelTyp;
  /** Hauptaussage (Rechtsmittel · Instanz · Frist) für die Ergebnis-Kachel. */
  text: string;
  instanz: string;
  form: string;
  kognition: string | null;
  fristen: StrafFrist[];
  warnungen: string[];
  weichen: string[];
  /** Weiterzug ans Bundesgericht (immer als nachgelagerter Hinweis). */
  bger: { text: string; normen: StrafNorm[] };
  normverweise: StrafNorm[];
}

const N = (artikel: string, bemerkung?: string): StrafNorm => ({ artikel, bemerkung });

// Präzisiert 11.6.2026 (FAHRPLAN-BGER-RECHTSWEG R-3b, Dossier-Empfehlung
// Teil 3/5 — reiner Hinweistext, keine Logikänderung): Privatkläger-Bedingung
// (Art. 81 Abs. 1 lit. b Ziff. 5), Art.-79-Ausnahme (BStGer-Beschwerdekammer)
// und die zwei strafrechtlichen Abteilungen seit 1.2.2026 (Art. 35/35a BGerR).
// RL-21 (F3-03, Prüfung Rechtslogik 23.9.2026): Der fehlende Stillstand in
// Haftsachen war auf Art. 46 Abs. 2 lit. a BGG («vorsorgliche Massnahmen»)
// gestützt. BGE 133 I 270 E. 1.2.1/1.2.2 (1B_154/2007, 14.9.2007) lässt diese
// Einordnung ausdrücklich OFFEN und verneint den Stillstand wegen des
// Beschleunigungsgebots (Art. 31 Abs. 3 BV, Art. 5 Ziff. 3 EMRK); Art. 46
// Abs. 2 BGG (Fedlex-Konsolidierung 1.4.2026) nennt Haftsachen nicht.
// Ergebnis unverändert, nur der Anker.
const BGER_HINWEIS = {
  text:
    'WEITERZUG: Gegen den letztinstanzlichen kantonalen Endentscheid steht die Beschwerde in Strafsachen ans ' +
    'BUNDESGERICHT offen (Art. 78 ff. BGG) — Frist 30 Tage (Art. 100 Abs. 1 BGG), KEINE Streitwertgrenze. ' +
    'Legitimation nach Art. 81 BGG: Die PRIVATKLÄGERSCHAFT nur, wenn sich der Entscheid auf ihre Zivilansprüche ' +
    'auswirken kann (Abs. 1 lit. b Ziff. 5); die Staatsanwaltschaft nicht bei Haftentscheiden (Ziff. 3). ' +
    'Gegen Entscheide der BStGer-BESCHWERDEKAMMER nur bei Zwangsmassnahmen (Art. 79 BGG). ' +
    'Vor- und Zwischenentscheide nur unter den Voraussetzungen der Art. 92/93 BGG. ' +
    'Der BGG-Fristenstillstand (Art. 46 BGG) gilt — NICHT aber in Haftsachen: Das Bundesgericht schliesst ihn dort wegen des Beschleunigungsgebots aus (BGE 133 I 270 E. 1.2); Art. 46 Abs. 2 BGG nennt Haftsachen nicht ausdrücklich. ' +
    'Es entscheiden zwei strafrechtliche Abteilungen (seit 1.2.2026): materielle Straf-/Zivilfragen die Erste, ' +
    'strafprozessuale Zwischen-/Endentscheide und der Vollzug die Zweite (Art. 35/35a BGerR).',
  normen: [N('Art. 78 BGG'), N('Art. 79 BGG'), N('Art. 80 BGG'), N('Art. 81 BGG'), N('Art. 100 Abs. 1 BGG')],
};

/** Reine Engine: statthaftes StPO-Rechtsmittel + Frist/Trigger/Instanz/Kognition. */
export function bestimmeStrafRechtsmittel(input: StrafRmInput): StrafRmErgebnis {
  const ziel = input.anfechtungsziel ?? 'umfassend';
  const warnungen: string[] = [];
  const weichen: string[] = [];
  const fristen: StrafFrist[] = [];
  const normverweise: StrafNorm[] = [];

  const beschwerdeinstanz = input.bundesgerichtsbarkeit
    ? 'Beschwerdekammer des Bundesstrafgerichts'
    : 'kantonale Beschwerdeinstanz';
  const berufungsgericht = input.bundesgerichtsbarkeit
    ? 'Berufungskammer des Bundesstrafgerichts'
    : 'Berufungsgericht (obere kantonale Instanz)';

  // ── Stufe 0 · Legitimations-Gates (vor allem anderen) ──────────────────────
  if (input.werFichtAn === 'privatklaegerschaft' && ziel === 'nur_sanktion') {
    return {
      statthaft: 'keines',
      text: 'KEIN Rechtsmittel der Privatklägerschaft: Sie kann einen Entscheid hinsichtlich der ausgesprochenen SANKTION nicht anfechten (Art. 382 Abs. 2 StPO; für die Einsprache: Art. 354 Abs. 1bis StPO).',
      instanz: '—', form: '—', kognition: null, fristen: [],
      warnungen: ['Anfechtbar bleiben Schuldpunkt, Zivilansprüche und Kostenfolgen — dafür Anfechtungsziel anpassen.'],
      weichen: [],
      bger: BGER_HINWEIS,
      normverweise: [N('Art. 382 Abs. 2 StPO'), N('Art. 354 Abs. 1bis StPO')],
    };
  }
  // Bug-Check 10.6.2026 (MITTEL, deklarierte fachliche Änderung): Art. 222
  // StPO (Fassung seit 1.1.2024) lässt EINZIG die verhaftete Person zu —
  // das Gate galt vorher nur für die Staatsanwaltschaft; Privatklägerschaft/
  // weitere Parteien/Angehörige erhielten trotzdem «BESCHWERDE» als
  // Hauptaussage (Widerspruch zur eigenen Warnung).
  if (input.werFichtAn !== 'beschuldigte_person' && input.entscheidTyp === 'zmg_haftentscheid') {
    const wer = input.werFichtAn === 'staatsanwaltschaft' ? 'der Staatsanwaltschaft'
      : input.werFichtAn === 'privatklaegerschaft' ? 'der Privatklägerschaft'
      : input.werFichtAn === 'angehoerige' ? 'der Angehörigen' : 'weiterer Verfahrensbeteiligter';
    return {
      statthaft: 'keines',
      text: `KEINE Beschwerde ${wer} gegen Haftentscheide: Seit der Revision (in Kraft 1.1.2024) kann EINZIG die verhaftete Person Entscheide über Anordnung, Verlängerung und Aufhebung der Untersuchungs- oder Sicherheitshaft anfechten (Art. 222 StPO).`,
      instanz: '—', form: '—', kognition: null, fristen: [],
      warnungen: ['Ältere Bundesgerichtsentscheide zum StA-Beschwerderecht (vor 2024) sind durch die Revision überholt; kohärent dazu Art. 81 Abs. 1 Ziff. 3 BGG.'],
      weichen: [],
      bger: BGER_HINWEIS,
      normverweise: [N('Art. 222 StPO', 'Fassung in Kraft seit 1.1.2024')],
    };
  }
  if (input.werFichtAn === 'angehoerige') {
    weichen.push('Angehörige (Art. 110 Abs. 1 StGB) sind nur NACH DEM TOD der beschuldigten/verurteilten Person bzw. der Privatklägerschaft legitimiert, in der Reihenfolge der Erbberechtigung (Art. 382 Abs. 3 StPO).');
    normverweise.push(N('Art. 382 Abs. 3 StPO'));
  }
  if (input.werFichtAn !== 'staatsanwaltschaft') {
    weichen.push('Legitimation setzt ein RECHTLICH GESCHÜTZTES Interesse an Aufhebung oder Änderung des Entscheids voraus (Art. 382 Abs. 1 StPO) — Rechtsfrage, im Einzelfall zu prüfen.');
    normverweise.push(N('Art. 382 Abs. 1 StPO'));
  } else {
    normverweise.push(N('Art. 381 StPO', 'Legitimation der Staatsanwaltschaft'));
  }

  // Reformatio in peius — relevant für alle echten Rechtsmittel.
  const reformatio =
    'VERSCHLECHTERUNGSVERBOT: Wird das Rechtsmittel NUR zugunsten der beschuldigten/verurteilten Person ergriffen, darf der Entscheid nicht zu ihrem Nachteil abgeändert werden (Art. 391 Abs. 2 StPO; vorbehalten strengere Bestrafung aufgrund erst nachträglich bekannt gewordener Tatsachen).';

  switch (input.entscheidTyp) {
    // ── 1 · Strafbefehl → Einsprache ─────────────────────────────────────────
    case 'strafbefehl': {
      const begruendung = input.werFichtAn === 'beschuldigte_person'
        ? 'Die EINSPRACHE der beschuldigten Person muss NICHT begründet werden (Art. 354 Abs. 2 StPO).'
        : 'Einsprachen der übrigen Berechtigten sind zu BEGRÜNDEN (Art. 354 Abs. 2 StPO).';
      fristen.push({ label: 'Einsprachefrist', frist: '10 Tage ab Zustellung des Strafbefehls', norm: 'Art. 354 Abs. 1 StPO', kritisch: true });
      warnungen.push(
        'RÜCKZUGSFIKTIONEN: Bleibt die Einsprache erhebende Person der Einvernahme (Art. 355 Abs. 2 StPO) bzw. der Hauptverhandlung (Art. 356 Abs. 4 StPO) trotz Vorladung unentschuldigt fern, gilt die Einsprache als zurückgezogen.',
        'Kein Fristenstillstand: Die StPO kennt KEINE Gerichtsferien (Art. 89 Abs. 2 StPO).',
      );
      // RL-21 (F3-02): Art. 354 Abs. 1 lit. c StPO (Fedlex 1.4.2025) gibt der
      // Staatsanwaltschaft die Einsprache nur «soweit vorgesehen» und nur der
      // Ober- oder Generalstaatsanwaltschaft; welche Behörde, bestimmen Bund
      // bzw. Kanton (Art. 381 Abs. 2 StPO).
      if (input.werFichtAn === 'staatsanwaltschaft') {
        weichen.push('EINSPRACHE DER STAATSANWALTSCHAFT nur, SOWEIT VORGESEHEN, durch die Ober- oder Generalstaatsanwaltschaft des Bundes bzw. des betreffenden Kantons im jeweiligen eidgenössischen oder kantonalen Verfahren (Art. 354 Abs. 1 lit. c StPO); ob eine solche Behörde besteht und berechtigt ist, bestimmen Bund bzw. Kanton (Art. 381 Abs. 2 StPO).');
        normverweise.push(N('Art. 354 Abs. 1 lit. c StPO', 'Ober-/Generalstaatsanwaltschaft'), N('Art. 381 Abs. 2 StPO'));
      }
      weichen.push(begruendung, 'Die Einsprache hat keinen Devolutiveffekt: Zunächst entscheidet die STAATSANWALTSCHAFT über Festhalten, neuen Strafbefehl, Einstellung oder Anklage (Art. 355 Abs. 3 StPO).');
      normverweise.push(N('Art. 354 StPO'), N('Art. 355 StPO'), N('Art. 356 StPO'));
      return {
        statthaft: 'einsprache',
        text: 'EINSPRACHE gegen den Strafbefehl: schriftlich innert 10 Tagen bei der STAATSANWALTSCHAFT (Art. 354 Abs. 1 StPO). Die Einsprache ist kein Rechtsmittel im engeren Sinn, sondern verschafft das ordentliche Verfahren.',
        instanz: 'Staatsanwaltschaft (bzw. Übertretungsstrafbehörde, Art. 357 Abs. 2 StPO)',
        form: 'schriftlich; Begründung nur für die übrigen Berechtigten (Art. 354 Abs. 2 StPO)',
        kognition: null,
        fristen, warnungen, weichen, bger: BGER_HINWEIS, normverweise,
      };
    }

    // ── 2 · Rechtsverweigerung → Beschwerde fristlos ─────────────────────────
    case 'rechtsverweigerung': {
      fristen.push({ label: 'Beschwerdefrist', frist: 'AN KEINE FRIST gebunden (Rechtsverweigerung/-verzögerung)', norm: 'Art. 396 Abs. 2 StPO', kritisch: false });
      normverweise.push(N('Art. 393 Abs. 2 StPO'), N('Art. 396 Abs. 2 StPO'));
      if (input.nurZugunstenBeschuldigte) weichen.push(reformatio);
      return {
        statthaft: 'beschwerde',
        text: `BESCHWERDE wegen Rechtsverweigerung oder Rechtsverzögerung an die ${beschwerdeinstanz} — an keine Frist gebunden (Art. 396 Abs. 2 StPO).`,
        instanz: beschwerdeinstanz,
        form: 'schriftlich und begründet (Art. 396 Abs. 1 StPO analog)',
        kognition: 'umfassend: Rechtsverletzung, Sachverhalt, Unangemessenheit (Art. 393 Abs. 2 StPO)',
        fristen, warnungen, weichen, bger: BGER_HINWEIS, normverweise,
      };
    }

    // ── 3 · Rechtskräftiger Entscheid → Revision ─────────────────────────────
    case 'rechtskraeftiges_urteil': {
      const grund = input.revisionsgrund ?? 'noven';
      const befristet = grund === 'widerspruch' || grund === 'emrk';
      if (befristet) {
        fristen.push({ label: 'Revisionsfrist', frist: '90 Tage nach Kenntnisnahme des betreffenden Entscheids', norm: 'Art. 411 Abs. 2 StPO', kritisch: true });
      } else {
        fristen.push({ label: 'Revisionsfrist', frist: 'AN KEINE FRIST gebunden (neue Tatsachen/Beweismittel bzw. Einwirkung durch Straftat)', norm: 'Art. 411 Abs. 2 StPO', kritisch: false });
      }
      warnungen.push('Revision ZUGUNSTEN der verurteilten Person ist auch nach Eintritt der Verjährung zulässig (Art. 410 Abs. 3 StPO).');
      weichen.push('Die Bezeichnung und der Beleg der Revisionsgründe im Gesuch sind Gültigkeitserfordernis (Art. 411 Abs. 1 StPO); die Würdigung des Revisionsgrundes ist Rechtsfrage.');
      normverweise.push(N('Art. 410 StPO'), N('Art. 411 StPO'));
      return {
        statthaft: 'revision',
        text: `REVISION beim ${berufungsgericht}: ausserordentliches Rechtsmittel gegen rechtskräftige Urteile, Strafbefehle und nachträgliche selbstständige Entscheide (Art. 410 Abs. 1 StPO).`,
        instanz: berufungsgericht,
        form: 'schriftlich und begründet; Revisionsgründe bezeichnen und belegen (Art. 411 Abs. 1 StPO)',
        kognition: null,
        fristen, warnungen, weichen, bger: BGER_HINWEIS, normverweise,
      };
    }

    // ── 4 · Urteil 1. Instanz → Berufung (verdrängt Beschwerde, 394 lit. a) ──
    case 'urteil_erstinstanz': {
      fristen.push(
        { label: 'Berufungs-ANMELDUNG', frist: '10 Tage seit ERÖFFNUNG des Urteils — an das ERSTINSTANZLICHE Gericht (schriftlich oder mündlich zu Protokoll)', norm: 'Art. 399 Abs. 1 StPO', kritisch: true },
        { label: 'Berufungs-ERKLÄRUNG', frist: '20 Tage seit ZUSTELLUNG des begründeten Urteils — an das BERUFUNGSGERICHT (schriftlich)', norm: 'Art. 399 Abs. 3 StPO', kritisch: true },
        { label: 'Anschlussberufung der Gegenpartei', frist: '20 Tage seit Empfang der Berufungserklärung', norm: 'Art. 400 Abs. 3 / Art. 401 StPO', kritisch: false },
      );
      // RL-21 (F3-01): Art. 398 Abs. 5 StPO (Fedlex 1.4.2025) — beschränkt sich
      // die Berufung auf den Zivilpunkt, wird nur so weit überprüft, als es das
      // am Gerichtsstand anwendbare Zivilprozessrecht vorsähe. Abs. 5 ist die
      // Sonderregel für den Zivilpunkt und geht der Übertretungs-Beschränkung
      // (Abs. 4, Schuld-/Strafpunkt) vor.
      const nurZivilpunkt = ziel === 'nur_zivilpunkt';
      const kognition = nurZivilpunkt
        ? 'BESCHRÄNKT AUF DEN ZIVILPUNKT: Das erstinstanzliche Urteil wird nur so weit überprüft, als es das am Gerichtsstand anwendbare Zivilprozessrecht vorsehen würde (Art. 398 Abs. 5 StPO).'
        : input.uebertretung
        ? 'EINGESCHRÄNKT: Bildeten ausschliesslich Übertretungen Gegenstand des Verfahrens, kann nur geltend gemacht werden, das Urteil sei rechtsfehlerhaft oder die Sachverhaltsfeststellung offensichtlich unrichtig/auf Rechtsverletzung beruhend; NEUE Behauptungen und Beweise sind ausgeschlossen (Art. 398 Abs. 4 StPO).'
        : 'umfassend in allen angefochtenen Punkten: Rechtsverletzungen inkl. Ermessen, Sachverhalt, Unangemessenheit (Art. 398 Abs. 2/3 StPO)';
      warnungen.push(
        'ZWEI getrennte Fristen mit VERSCHIEDENEN Triggern: Die 10-Tage-Anmeldung läuft ab Urteilseröffnung (Dispositiv), die 20-Tage-Erklärung erst ab Zustellung des BEGRÜNDETEN Urteils — die Anmeldung nicht verpassen, auch wenn die Begründung aussteht.',
        'Kein Fristenstillstand: Die StPO kennt KEINE Gerichtsferien (Art. 89 Abs. 2 StPO).',
      );
      weichen.push(
        'Die Berufung VERDRÄNGT die Beschwerde (Art. 394 lit. a StPO): Gegen berufungsfähige Urteile ist nur die Berufung gegeben; mit ihr können auch Verfahrensfehler gerügt werden.',
        'Die Berufung hat im Umfang der Anfechtung AUFSCHIEBENDE Wirkung (Art. 402 StPO); in der Erklärung ist anzugeben, ob das Urteil vollumfänglich oder in Teilen angefochten wird (Art. 399 Abs. 3/4 StPO).',
      );
      if (nurZivilpunkt) {
        weichen.push('ANSCHLUSSBERUFUNG: Bezieht sich die Hauptberufung ausschliesslich auf den Zivilpunkt des Urteils, ist auch die Anschlussberufung auf deren Umfang beschränkt (Art. 401 Abs. 2 StPO).');
      }
      if (input.nurZugunstenBeschuldigte) weichen.push(reformatio);
      normverweise.push(N('Art. 398 StPO'), N('Art. 399 StPO'), N('Art. 394 StPO', 'lit. a'), N('Art. 402 StPO'));
      if (nurZivilpunkt) normverweise.push(N('Art. 398 Abs. 5 StPO', 'Zivilpunkt'), N('Art. 401 Abs. 2 StPO'));
      return {
        statthaft: 'berufung',
        text: `BERUFUNG gegen das erstinstanzliche Urteil (auch selbstständige nachträgliche Entscheide und Einziehungsentscheide, Art. 398 Abs. 1 StPO) — Anmeldung beim erstinstanzlichen Gericht, Erklärung an das ${berufungsgericht}.`,
        instanz: berufungsgericht,
        form: 'Anmeldung schriftlich oder mündlich zu Protokoll; Erklärung schriftlich (Art. 399 StPO)',
        kognition,
        fristen, warnungen, weichen, bger: BGER_HINWEIS, normverweise,
      };
    }

    // ── 5 · Verfahrensleitende Anordnung des Gerichts → kein Rechtsmittel ────
    case 'verfahrensleitend_gericht': {
      normverweise.push(N('Art. 393 Abs. 1 lit. b StPO'));
      return {
        statthaft: 'keines',
        text: 'KEIN selbstständiges Rechtsmittel gegen VERFAHRENSLEITENDE Entscheide der erstinstanzlichen Gerichte und der Verfahrensleitung (Art. 393 Abs. 1 lit. b StPO) — die Rüge bleibt mit dem Endentscheid (Berufung) möglich.',
        instanz: '—', form: '—', kognition: null,
        fristen: [],
        warnungen: ['Abgrenzung verfahrensleitend/anderer Entscheid ist Rechtsfrage; nicht verfahrensleitende Beschlüsse und Verfügungen sind mit Beschwerde anfechtbar.'],
        weichen, bger: BGER_HINWEIS, normverweise,
      };
    }

    // ── 6 · Haftentscheid des Berufungsgerichts (Art. 233) ───────────────────
    case 'haftentscheid_berufungsverfahren': {
      normverweise.push(N('Art. 233 StPO'), N('Art. 222 StPO'));
      return {
        statthaft: 'keines',
        text: 'Haftentlassungsgesuche im Berufungsverfahren entscheidet die VERFAHRENSLEITUNG DES BERUFUNGSGERICHTS endgültig (Art. 233 StPO) — kein StPO-Rechtsmittel; offen bleibt nur die Beschwerde in Strafsachen ans Bundesgericht (Art. 78 ff. BGG).',
        instanz: '—', form: '—', kognition: null,
        fristen: [],
        warnungen: ['In Haftsachen gilt der BGG-Fristenstillstand NICHT — nach der Rechtsprechung wegen des Beschleunigungsgebots (BGE 133 I 270 E. 1.2), nicht kraft des Wortlauts von Art. 46 Abs. 2 BGG.'],
        weichen, bger: BGER_HINWEIS, normverweise,
      };
    }

    // ── 7 · Übrige Entscheide → Beschwerde (Art. 393/396) ────────────────────
    case 'verfuegung_sta_polizei':
    case 'anderer_entscheid_gericht':
    case 'zmg_haftentscheid':
    case 'zmg_andere_zwangsmassnahme': {
      const objekt =
        input.entscheidTyp === 'verfuegung_sta_polizei'
          ? 'Verfügungen und Verfahrenshandlungen von Polizei, Staatsanwaltschaft und Übertretungsstrafbehörden (Art. 393 Abs. 1 lit. a StPO) — namentlich auch Nichtanhandnahme (Art. 310) und Einstellung (Art. 322 Abs. 2)'
          : input.entscheidTyp === 'anderer_entscheid_gericht'
            ? 'Beschlüsse und Verfügungen der erstinstanzlichen Gerichte, soweit nicht verfahrensleitend (Art. 393 Abs. 1 lit. b StPO)'
            : input.entscheidTyp === 'zmg_haftentscheid'
              ? 'Entscheide des Zwangsmassnahmengerichts über Anordnung, Verlängerung und Aufhebung der Untersuchungs- oder Sicherheitshaft (Art. 222 StPO)'
              : 'Entscheide des Zwangsmassnahmengerichts in den vom Gesetz vorgesehenen Fällen (Art. 393 Abs. 1 lit. c StPO)';
      fristen.push({ label: 'Beschwerdefrist', frist: '10 Tage (schriftlich und begründet bei der Beschwerdeinstanz)', norm: 'Art. 396 Abs. 1 StPO', kritisch: true });
      if (input.entscheidTyp === 'zmg_haftentscheid') {
        warnungen.push('Beschwerdeberechtigt ist EINZIG die verhaftete Person (Art. 222 StPO, Fassung seit 1.1.2024); das frühere Beschwerderecht der Staatsanwaltschaft ist entfallen.');
        normverweise.push(N('Art. 222 StPO'));
      }
      if (input.entscheidTyp === 'verfuegung_sta_polizei') {
        weichen.push('AUSSCHLUSS (Art. 394 lit. b StPO): Gegen die Ablehnung von Beweisanträgen durch StA/Übertretungsstrafbehörde ist die Beschwerde unzulässig, wenn der Antrag ohne Rechtsnachteil vor dem erstinstanzlichen Gericht wiederholt werden kann.');
        normverweise.push(N('Art. 394 StPO', 'lit. b'));
      }
      warnungen.push(
        'Die Beschwerde hat KEINE aufschiebende Wirkung; die Verfahrensleitung der Beschwerdeinstanz kann sie anordnen (Art. 387 StPO).',
        'Kein Fristenstillstand: Die StPO kennt KEINE Gerichtsferien (Art. 89 Abs. 2 StPO).',
      );
      if (input.nurZugunstenBeschuldigte) weichen.push(reformatio);
      normverweise.push(N('Art. 393 StPO'), N('Art. 396 Abs. 1 StPO'));
      return {
        statthaft: 'beschwerde',
        text: `BESCHWERDE an die ${beschwerdeinstanz} gegen: ${objekt}.`,
        instanz: beschwerdeinstanz,
        form: 'schriftlich und begründet (Art. 396 Abs. 1 StPO)',
        kognition: 'umfassend: Rechtsverletzung inkl. Ermessen, unvollständige/unrichtige Sachverhaltsfeststellung, Unangemessenheit (Art. 393 Abs. 2 StPO)',
        fristen, warnungen, weichen, bger: BGER_HINWEIS, normverweise,
      };
    }
  }
}

// ── Abbildung in das einheitliche Berichts-Format (G3.1 / M-8, 10.6.2026):
// reine Darstellungs-Abbildung für PDF/Anzeige — alle Texte stammen
// unverändert aus dem StrafRmErgebnis (§3/§5).
export function strafRechtsmittelBericht(r: StrafRmErgebnis): Berechnungsergebnis {
  return {
    ergebnis: r.text,
    status: r.statthaft === 'keines' ? 'unzulaessig' : 'ok',
    rechenweg: [
      { beschreibung: 'Statthaftes Rechtsmittel', zwischenergebnis: r.text, normen: [] },
      ...(r.statthaft !== 'keines' ? [
        { beschreibung: 'Instanz', zwischenergebnis: r.instanz, normen: [] },
        { beschreibung: 'Form', zwischenergebnis: r.form, normen: [] },
        ...(r.kognition ? [{ beschreibung: 'Kognition', zwischenergebnis: r.kognition, normen: [] }] : []),
      ] : []),
      ...r.fristen.map((f) => ({
        beschreibung: `Frist: ${f.label}${f.kritisch ? ' (Verwirkung)' : ''}`,
        zwischenergebnis: `${f.frist} (${f.norm})`,
        normen: [],
      })),
      { beschreibung: 'Weiterzug ans Bundesgericht', zwischenergebnis: r.bger.text, normen: r.bger.normen },
    ],
    annahmen: [],
    warnungen: [...r.weichen, ...r.warnungen],
    normverweise: r.normverweise,
  };
}
