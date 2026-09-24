// Dossier: bibliothek/normen/schkg-zustaendigkeit-regelwerk.md
import { parseISO, addDays, differenceInCalendarDays, isAfter, isBefore } from 'date-fns';
import type { Normverweis, Rechenschritt } from '../types/legal';
import { formatDatum, formatISO } from './datumsUtils';
import type { SchkgInput, SchkgErgebnis, SchkgModus, SchkgFristnatur } from '../types/schkg';
import { stillstandsperioden, stillstandsperiodeFuer } from '../data/zpoFeiertage';
import { betreibungsferien, betreibungsperiodeFuer } from '../data/schkgFeiertage';
import { rechtsprechung } from '../data/verifikation';
import {
  fristendeTage,
  fristendeKalender,
  normalisiereEnde,
  OHNE_STILLSTAND,
  type Periode,
  type Stillstand,
} from './fristenEngine';

// ─── Feste Normverweise ───────────────────────────────────────────────────

const N_31:     Normverweis = { artikel: 'Art. 31 SchKG', bemerkung: 'Fristberechnung subsidiär nach der ZPO' };
const N_142_1:  Normverweis = { artikel: 'Art. 142 Abs. 1 ZPO', bemerkung: 'Tagesfrist: Beginn am Folgetag (Zustelltag zählt nicht)' };
const N_142_2:  Normverweis = { artikel: 'Art. 142 Abs. 2 ZPO', bemerkung: 'Monatsfrist: gleichbezeichneter Tag (Jahresfristen analog, st. Praxis)' };
const N_142_3:  Normverweis = { artikel: 'Art. 142 Abs. 3 ZPO', bemerkung: 'Ende am Sa/So/Feiertag → nächster Werktag' };
const N_56_1:   Normverweis = { artikel: 'Art. 56 Abs. 1 SchKG', bemerkung: 'Betreibungsferien und Rechtsstillstand' };
const N_56_2:   Normverweis = { artikel: 'Art. 56 Abs. 2 SchKG', bemerkung: 'Gerichtliche SchKG-Klagen: ZPO-Stillstand (Revision 1.1.2025, AS 2023 491)' };
const N_63:     Normverweis = { artikel: 'Art. 63 SchKG', bemerkung: 'Kein Ruhen; Verlängerung um 3 Werktage, wenn das Fristende in die geschlossene Zeit fällt' };
const N_145_1:  Normverweis = { artikel: 'Art. 145 Abs. 1 ZPO', bemerkung: 'Fristenstillstand (Ruhen)' };
const N_145_4:  Normverweis = { artikel: 'Art. 145 Abs. 4 ZPO', bemerkung: 'Stillstand für gerichtliche SchKG-Klagen; nicht für die Aufsichtsbeschwerde' };
const N_33_4:   Normverweis = { artikel: 'Art. 33 Abs. 4 SchKG', bemerkung: 'Wiederherstellung bei unverschuldetem Hindernis' };
const N_88_2:   Normverweis = { artikel: 'Art. 88 Abs. 2 SchKG', bemerkung: 'Stillstand der Verwirkungsfrist während rechtsvorschlagsbedingtem Verfahren' };
const N_166_2:  Normverweis = { artikel: 'Art. 166 Abs. 2 SchKG', bemerkung: 'Stillstand der Verwirkungsfrist während rechtsvorschlagsbedingtem Verfahren' };
const N_56_1_2: Normverweis = { artikel: 'Art. 56 Abs. 1 Ziff. 2 SchKG', bemerkung: 'Keine Betreibungshandlungen während der Betreibungsferien' };

// ─── RL-18 (Prüfung Rechtslogik 23.9.2026, Befunde F2-03/F2-04) ──────────
//
// Zustellung einer Betreibungsurkunde in den Betreibungsferien. Art. 56 Abs. 1
// Ziff. 2 SchKG (Fedlex SR 281.1, Fassung 1.1.2026,
// https://www.fedlex.admin.ch/eli/cc/11/529_488_529/de): während der
// Betreibungsferien «dürfen Betreibungshandlungen nicht vorgenommen werden»
// (ausser im Arrestverfahren; in der Wechselbetreibung gibt es keine
// Betreibungsferien). Rechtsfolge eines Verstosses: BGE 121 III 284 E. 2b —
// die Handlung ist weder nichtig noch anfechtbar, sie «entfaltet ihre
// Rechtswirkungen erst am ersten Tag nach Ablauf der Betreibungsferien»;
// E. 2c — die Fristen (namentlich die Rechtsvorschlagsfrist) haben mit dem
// ersten Tag nach den Ferien «zu laufen begonnen».
//
// ZÄHLWEISE (Q-10, offen für die Gegenprüfung): Tages- und Kalenderfrist-
// Zweig verankern unterschiedlich.
// – Tagesfrist: Tag 1 = erster Tag nach den Ferien (BGE 121 III 284 E. 2c).
//   Technisch ist der letzte Ferientag Referenztag, Beginn am Folgetag
//   (Art. 142 Abs. 1 ZPO) — dieselbe Behandlung, die die Engine im ZPO-Pfad
//   für die Zustellung während des Stillstands anwendet (Art. 146 Abs. 1 ZPO:
//   «beginnt der Fristenlauf am ersten Tag nach Ende des Stillstandes»). Die
//   Gegenlesart (E. 2b als Zustellfiktion am ersten Tag nach den Ferien,
//   Fristbeginn nach Art. 142 Abs. 1 ZPO erst am Tag darauf) wird mit ihrem
//   Datum als Warnung offengelegt; bei einer Wartefrist wird sie Hauptwert,
//   wenn sie das spätere Datum ergibt (RL-18 Nachzug, s. u.).
// – Kalenderfrist (Monate/Jahre): Anker = letzter Ferientag (gleichbezeichneter
//   Tag). OFFENER PUNKT: BGE 150 III 367 E. 5.6 (5A_691/2023 vom 13.8.2024)
//   bezieht den «Tag, an dem die Frist zu laufen begann» (Art. 142 Abs. 2 ZPO,
//   Fedlex SR 272, Fassung 1.7.2026) nicht auf Abs. 1, sondern auf den Tag des
//   fristauslösenden Ereignisses. Der Entscheid betrifft die ZPO (Klagefrist
//   nach Art. 209 Abs. 3 ZPO); für das SchKG gilt er nur über den Verweis in
//   Art. 31 SchKG — Übertragung, kein SchKG-Leitentscheid. Gilt der
//   Wirkungstag (E. 2b) als Ereignistag, endet die Frist einen Tag später.
//   Die Warnung legt beide Lesarten gleichrangig offen (Gegenprüfung 24.9.2026).
// RICHTUNGSSICHERER HAUPTWERT (RL-18 Nachzug, Gegenprüfung #2 24.9.2026):
//   Beide Lesarten werden gerechnet; ausgewiesen wird bei einer Wartefrist
//   das SPÄTERE, bei Handlungs-/Verwirkungsfristen das FRÜHERE Datum (§1 —
//   sicher ist, was nach beiden Lesarten nicht zu spät bzw. nicht verfrüht
//   ist). Gilt für Tages- und Kalenderfristen.
// Beispiel ZB 8.4.2026 (Osterferien 29.3.–12.4.2026): Rechtsvorschlag 22.4.
// (Gegenlesart 23.4.), Fortsetzung frühestens beide 4.5., Fortsetzung
// spätestens 12.4.2027 (Ereignistag-Lesart 13.4.2027); Pfandverwertung
// frühestens (1 Monat, Art. 154 SchKG) 15.5.2026 (Ereignistag-Lesart,
// 14.5.2026 Auffahrt) statt 13.5.2026.
//
// BINDUNG: Die Regel greift nur, wenn der Auslöser nachweislich die Zustellung
// einer Betreibungsurkunde an den Schuldner ist — Identitätsvergleich mit den
// Preset-Auslösern (kein Substring), und nur im Betreibungsferien-Regime
// (Wechselbetreibung: modus 'kein'). Ohne Auslöser ist die Ereignisart
// unbekannt → keine Fiktion (Golden schkg:weihnachten bleibt byte-gleich).
// Bewusst NICHT gebunden: Zustellung Arresturkunde (Art. 56 Abs. 1 SchKG
// «ausser im Arrestverfahren»); Pfändungsvollzug/Lastenverzeichnis/Frist-
// ansetzungen des Amtes (Wirkungsaufschub nicht einzeln belegt — offen).
export const BETREIBUNGSURKUNDEN_AUSLOESER: readonly string[] = [
  'Zustellung Zahlungsbefehl',
  'Zustellung Zahlungsbefehl (Bedenkfrist Art. 152 SchKG)',
  'Zustellung Konkursandrohung',
];

function istBetreibungsurkundenZustellung(ausloeser: string | undefined): boolean {
  return ausloeser !== undefined && BETREIBUNGSURKUNDEN_AUSLOESER.includes(ausloeser);
}

const fmt = formatDatum;
const iso = formatISO;

// ─── Stillstand-Strategie je Modus ────────────────────────────────────────

function baueStrategie(modus: SchkgModus, rsVon?: string, rsBis?: string): Stillstand {
  if (modus === 'zpo_stillstand') {
    // Gerichtliche SchKG-Klage – ZPO-Ruhen (Art. 56 Abs. 2 SchKG / Art. 145 Abs. 4 ZPO).
    return {
      periodeFuer: stillstandsperiodeFuer,
      perioden: stillstandsperioden,
      ruhenZaehlung: true,
      endregel: 'ruhen_weiter',
    };
  }
  if (modus === 'kein') return OHNE_STILLSTAND;

  // schkg_betreibungsferien – Betreibungsferien (+ optional schuldnerbezogener
  // Rechtsstillstand). Kein Ruhen, nur 3-Werktage-Verlängerung am Ende (Art. 63).
  const rs: Periode | null =
    rsVon && rsBis ? { key: 'rechtsstillstand', von: parseISO(rsVon), bis: parseISO(rsBis) } : null;
  const inRs = (d: Date) => rs !== null && !isBefore(d, rs.von) && !isAfter(d, rs.bis);
  const basisPeriode = (d: Date): Periode | null => betreibungsperiodeFuer(d) ?? (inRs(d) ? rs : null);
  return {
    // Überlappen Betreibungsferien und Rechtsstillstand, bilden sie EINE
    // geschlossene Zeit: die Hülle wird vorwärts gemerged, damit Art. 63 am
    // Ende der gesamten geschlossenen Zeit ankert (nicht an der ersten Teilperiode).
    periodeFuer: (d) => {
      const p = basisPeriode(d);
      if (!p) return null;
      let bis = p.bis;
      for (let guard = 0; guard < 12; guard++) {
        const next = basisPeriode(addDays(bis, 1));
        if (!next) break;
        bis = next.bis;
      }
      return bis === p.bis ? p : { key: `${p.key}+verbund`, von: p.von, bis };
    },
    perioden: betreibungsferien,
    ruhenZaehlung: false,
    endregel: 'verlaengerung_3wt',
  };
}

const MODUS_LABEL: Record<SchkgModus, string> = {
  schkg_betreibungsferien: 'SchKG-Betreibungsferien (Art. 56/63 SchKG – kein Ruhen, 3-Werktage-Verlängerung)',
  zpo_stillstand: 'ZPO-Stillstand (gerichtliche Klage – Art. 56 Abs. 2 SchKG / Art. 145 Abs. 4 ZPO)',
  kein: 'Kein Stillstand (nur Werktagsverschiebung am Ende)',
};

const NATUR_WARNUNG: Partial<Record<SchkgFristnatur, string>> = {
  verwirkung:
    'Verwirkungsfrist – nicht erstreckbar und nicht wiederherstellbar (Ausnahme: unverschuldetes Hindernis, Art. 33 Abs. 4 SchKG). Das angezeigte Datum ist der letzte zulässige Tag.',
  wartefrist:
    'Wartefrist – das angezeigte Datum ist das FRÜHESTE zulässige Datum. Eine Handlung vor dessen Ablauf ist unzulässig und kann nichtig sein.',
};

// ─── Hauptfunktion ────────────────────────────────────────────────────────

// RL-18 Nachzug (Gegenprüfung #2, 24.9.2026): Bei Zustellung einer
// Betreibungsurkunde in den Betreibungsferien werden BEIDE Lesarten der
// Zählweise vollständig gerechnet (Kopfkommentar ZÄHLWEISE); der Hauptwert
// (Kachel, diesAdQuem, ICS/PDF) ist richtungssicher gewählt — Wartefrist →
// das spätere, Handlungs-/Verwirkungsfrist → das frühere Datum (§1). Anlass:
// Pfandverwertung Art. 154 SchKG, ZB 8.4.2026, 1 Monat Wartefrist → bisher
// 13.05.2026 ausgewiesen, Ereignistag-Lesart 15.05.2026 (14.5.2026 Auffahrt):
// ein Begehren am 13.5. wäre nach der Gegenlesart verfrüht.
export function berechneSchkgFrist(input: SchkgInput): SchkgErgebnis {
  if (!Number.isInteger(input.laenge) || input.laenge <= 0) {
    throw new Error('Fristlänge muss eine ganze Zahl > 0 sein.');
  }
  const a = berechneLesart(input, 'ferienende');
  if (!a.ferien) return a.r;
  const b = berechneLesart(input, 'ereignistag');

  const istWartefrist = input.fristnatur === 'wartefrist';
  const bSicherer = istWartefrist
    ? b.r.diesAdQuemISO > a.r.diesAdQuemISO
    : b.r.diesAdQuemISO < a.r.diesAdQuemISO;
  const haupt = bSicherer ? b.r : a.r;

  const einheit = input.laenge === 1
    ? { tage: 'Tag', monate: 'Monat', jahre: 'Jahr' }[input.einheit]
    : { tage: 'Tage', monate: 'Monate', jahre: 'Jahre' }[input.einheit];
  const wt = fmt(a.wirkungstag);
  const lesarten = input.einheit === 'tage'
    ? `Hauptlesart ist BGE 121 III 284 E. 2c — die Frist beginnt am ersten Tag nach den Ferien (${wt}) zu laufen: ${a.r.diesAdQuem}. ` +
      `Nach der Gegenlesart (Zustellung gilt erst am ${wt} als erfolgt, Fristbeginn am Folgetag nach Art. 142 Abs. 1 ZPO) ergibt sich ${b.r.diesAdQuem}. `
    : 'Zwei Lesarten sind vertretbar. ' +
      `Fristlauf ab dem ersten Tag nach den Ferien (BGE 121 III 284 E. 2c; Anker letzter Ferientag ${fmt(a.ferien.bis)}): ${a.r.diesAdQuem}. ` +
      `Gilt der Wirkungstag ${wt} als Tag des fristauslösenden Ereignisses, auf den Art. 142 Abs. 2 ZPO abstellt, ergibt sich ${b.r.diesAdQuem} — ` +
      'so BGE 150 III 367 E. 5.6 zu Art. 142 Abs. 2 ZPO (Fall zur Klagefrist nach Art. 209 Abs. 3 ZPO), hier über Art. 31 SchKG übertragen, kein SchKG-Leitentscheid. ';
  const wahl = a.r.diesAdQuemISO === b.r.diesAdQuemISO
    ? `Ausgewiesen ist ${haupt.diesAdQuem}; beide Lesarten führen zum selben Datum.`
    : istWartefrist
      ? `Ausgewiesen ist ${haupt.diesAdQuem} (das spätere Datum): Bei einer Wartefrist ist das spätere Datum die sichere Seite — eine Handlung vor Ablauf der Frist ist unzulässig.`
      : `Ausgewiesen ist ${haupt.diesAdQuem} (das frühere Datum): Bei Handlungs- und Verwirkungsfristen ist das frühere Datum die sichere Seite — wer bis dahin handelt, wahrt die Frist nach beiden Lesarten.`;
  haupt.warnungen.push(`Zählweise bei Zustellung in den Betreibungsferien (${input.laenge} ${einheit}): ` + lesarten + wahl);
  return haupt;
}

type Lesart = 'ferienende' | 'ereignistag';

function berechneLesart(
  input: SchkgInput,
  lesart: Lesart,
): { r: SchkgErgebnis; ferien: ReturnType<typeof betreibungsperiodeFuer>; wirkungstag: Date } {

  const rechenweg: Rechenschritt[] = [];
  const annahmen: string[] = [];
  const warnungen: string[] = [];

  const modus = input.modusOverride ?? input.modus;
  const st = baueStrategie(modus, input.rechtsstillstandVon, input.rechtsstillstandBis);
  const ereignis = parseISO(input.ereignis);

  // RL-18 / F2-03: Zustellung einer Betreibungsurkunde in den Betreibungsferien
  // → Wirkung und Fristbeginn am ersten Tag nach den Ferien (BGE 121 III 284
  // E. 2b/c). `referenz` ist der Tag, ab dem gezählt wird: Lesart
  // 'ferienende' = letzter Ferientag, Lesart 'ereignistag' = Wirkungstag.
  const urkundenZustellung = istBetreibungsurkundenZustellung(input.ausloeser);
  const ferienBeiZustellung =
    urkundenZustellung && modus === 'schkg_betreibungsferien' ? betreibungsperiodeFuer(ereignis) : null;
  const wirkungstag = ferienBeiZustellung ? addDays(ferienBeiZustellung.bis, 1) : ereignis;
  const referenz = ferienBeiZustellung
    ? (lesart === 'ereignistag' ? wirkungstag : ferienBeiZustellung.bis)
    : ereignis;

  if (input.modusOverride && input.modusOverride !== input.modus) {
    rechenweg.push({
      beschreibung: 'Manueller Override des Stillstand-Regimes',
      zwischenergebnis: `Das Stillstand-Regime wurde manuell auf «${MODUS_LABEL[modus]}» gesetzt (umstrittene Konstellation, z. B. Summarsache nach Art. 251 ZPO).`,
      normen: [N_56_1, N_56_2],
    });
  }

  // Schritt 1 – auslösendes Ereignis
  rechenweg.push({
    beschreibung: 'Schritt 1 – Auslösendes Ereignis',
    zwischenergebnis:
      `${input.ausloeser ? input.ausloeser + ': ' : ''}${fmt(ereignis)}. ` +
      'Der Tag der Zustellung/Mitteilung wird nicht mitgezählt (Art. 31 SchKG i.V.m. Art. 142 Abs. 1 ZPO).',
    normen: [N_31, N_142_1],
  });

  if (ferienBeiZustellung) {
    rechenweg.push({
      beschreibung: 'Schritt 1a – Zustellung in den Betreibungsferien',
      zwischenergebnis:
        `Die Zustellung am ${fmt(ereignis)} fällt in die Betreibungsferien (${fmt(ferienBeiZustellung.von)}–${fmt(ferienBeiZustellung.bis)}). ` +
        'Sie ist weder nichtig noch anfechtbar, entfaltet ihre Wirkung aber erst am ersten Tag nach den Ferien; ' +
        `die Fristen beginnen an diesem Tag zu laufen (BGE 121 III 284 E. 2b/c): ${fmt(wirkungstag)}. ` +
        (lesart === 'ereignistag'
          ? `Gezählt wird nach der Ereignistag-Lesart: Der Wirkungstag (${fmt(referenz)}) gilt als Tag des fristauslösenden Ereignisses; ` +
            'diese Lesart ergibt hier das richtungssichere Datum (siehe Hinweis «Zählweise»).'
          : `Gezählt wird ab dem letzten Ferientag (${fmt(referenz)}) als Referenztag.`),
      normen: [N_56_1_2, N_31],
    });
  }

  // Schritt 2 – Fristende provisorisch
  let diesAQuo: Date;
  let endeProvisorisch: Date;

  if (input.einheit === 'tage') {
    const r = fristendeTage(referenz, input.laenge, st);
    diesAQuo = r.diesAQuo;
    endeProvisorisch = r.ende;
    rechenweg.push({
      beschreibung: 'Schritt 2 – Tagesfrist (Beginn am Folgetag)',
      zwischenergebnis:
        `Tagesfrist von ${input.laenge} Tagen, Beginn (dies a quo): ${fmt(diesAQuo)}. ` +
        (modus === 'zpo_stillstand'
          ? 'Stillstandstage werden nicht mitgezählt (ZPO-Ruhen). '
          : 'Die Frist läuft ohne Unterbruch (Betreibungsferien hemmen den Lauf nicht, Art. 63 SchKG). ') +
        `Rechnerisches Ende (vor Endnormalisierung): ${fmt(endeProvisorisch)}.`,
      normen: modus === 'zpo_stillstand' ? [N_142_1, N_145_1] : [N_142_1, N_63],
      rechtsprechung: modus === 'schkg_betreibungsferien' ? [rechtsprechung('BGE_143_III_149')] : undefined,
    });
  } else {
    const r = fristendeKalender(referenz, input.einheit, input.laenge, st, false);
    diesAQuo = r.diesAQuo;
    endeProvisorisch = r.ende;
    const einheitLabel = input.einheit === 'monate' ? 'Monats' : 'Jahres';
    rechenweg.push({
      beschreibung: `Schritt 2 – ${einheitLabel}frist (gleichbezeichneter Tag, Art. 142 Abs. 2 ZPO)`,
      zwischenergebnis:
        `dies a quo: ${fmt(diesAQuo)}. Naives Ende: ${fmt(endeProvisorisch)}.` +
        (r.verlaengerungTage > 0 ? ` Stillstandsverlängerung: +${r.verlaengerungTage} Tage (ZPO-Ruhen).` : ''),
      normen: modus === 'zpo_stillstand' ? [N_142_2, N_145_1] : [N_142_2],
    });
  }

  // Schritt 2b – Hemmung der Verwirkungsfrist (Art. 88 Abs. 2 / Art. 166 Abs. 2)
  // Echtes Ruhen: Beginnt das hemmende Verfahren während des Fristenlaufs,
  // pausiert die Frist für das GANZE Fenster – auch über das rechnerische Ende
  // hinaus (das Verfahren dauert typischerweise länger als der Fristrest).
  if (input.hemmungVon && input.hemmungBis) {
    const hv = parseISO(input.hemmungVon);
    const hb = parseISO(input.hemmungBis);
    const von = isBefore(hv, diesAQuo) ? diesAQuo : hv;
    const beginntImLauf = !isAfter(von, endeProvisorisch) && !isBefore(hb, von);
    if (beginntImLauf) {
      const tage = differenceInCalendarDays(hb, von) + 1;
      endeProvisorisch = addDays(endeProvisorisch, tage);
      rechenweg.push({
        beschreibung: 'Schritt 2b – Stillstand der Verwirkungsfrist (Hemmung)',
        zwischenergebnis:
          `Während des rechtsvorschlagsbedingten Verfahrens (${fmt(hv)}–${fmt(hb)}) steht die Verwirkungsfrist still: ` +
          `${tage} Tage (ab ${fmt(von)}); die Frist läuft nach Verfahrensende weiter → neues rechnerisches Ende: ${fmt(endeProvisorisch)}.`,
        normen: [N_88_2, N_166_2],
        rechtsprechung: [rechtsprechung('BGer_5A_190_2023')],
      });
      warnungen.push(
        'Die Hemmung der Verwirkungsfrist (Art. 88 Abs. 2 / Art. 166 Abs. 2 SchKG) ist als ganztägiger Stillstand im angegebenen Fenster modelliert; der genaue Beginn/Ablauf des hemmenden Verfahrens ist im Einzelfall zu prüfen.',
      );
    }
  }

  // Schritt 3 – Endnormalisierung
  // QS-GP-Fix 2.7.2026 (Norm: Art. 142 Abs. 3 ZPO, SR 272, Stand 1.7.2026,
  // https://www.fedlex.admin.ch/eli/cc/2010/262/de): Abs. 3 verschiebt NUR das
  // Ende einer HANDLUNGSfrist auf den nächsten Werktag. Eine WARTEFRIST (frühestes
  // zulässiges Datum, Art. 88 Abs. 1 SchKG) läuft dagegen auch an Sa/So/Feiertagen
  // ab (h.M.). Ihr Fristende wird daher NICHT verschoben; erst der Folgetag als
  // frühester Handlungstag wird normalisiert (Schritt 4). Zuvor wurde das
  // Wartefrist-Ende verschoben UND danach +1 gerechnet → frühestes Datum bis zu
  // mehreren Tagen zu spät (konservativ, aber norm-widrig).
  const istWartefrist = input.fristnatur === 'wartefrist';
  const { tag: diesAdQuem, verschoben } = istWartefrist
    ? { tag: endeProvisorisch, verschoben: false }
    : normalisiereEnde(endeProvisorisch, input.kanton, st);
  // Frühestes zulässiges Datum (Begründung bei Schritt 4 unten); schon hier
  // berechnet, weil es der Hauptwert dieser Lesart ist (diesAdQuem).
  const folgetag = istWartefrist ? addDays(diesAdQuem, 1) : diesAdQuem;
  const massgeblich = istWartefrist
    ? normalisiereEnde(folgetag, input.kanton, st).tag
    : diesAdQuem;
  rechenweg.push({
    beschreibung: istWartefrist
      ? 'Schritt 3 – Ablauf der Wartefrist (keine Werktagsverschiebung, Art. 142 Abs. 3 ZPO)'
      : modus === 'schkg_betreibungsferien'
        ? 'Schritt 3 – Endnormalisierung (Art. 63 SchKG / Art. 31 i.V.m. Art. 142 Abs. 3 ZPO)'
        : 'Schritt 3 – Endnormalisierung (Art. 142 Abs. 3 / Art. 145 Abs. 1 ZPO)',
    zwischenergebnis: istWartefrist
      ? `Die Wartefrist läuft am ${fmt(diesAdQuem)} ab und wird NICHT auf den nächsten Werktag verschoben (Art. 142 Abs. 3 ZPO verschiebt nur das Ende einer Handlungsfrist). Der früheste Handlungstag folgt in Schritt 4.`
      : verschoben
        ? modus === 'schkg_betreibungsferien'
          ? `Das rechnerische Ende ${fmt(endeProvisorisch)} fiel in eine geschlossene Zeit oder auf einen arbeitsfreien Tag → verschoben auf ${fmt(diesAdQuem)} (bei Ende in den Betreibungsferien: 3. Werktag danach, Art. 63 SchKG).`
          : `Das rechnerische Ende ${fmt(endeProvisorisch)} fiel auf einen arbeitsfreien Tag bzw. in einen Stillstand → verschoben auf ${fmt(diesAdQuem)}.`
        : `Ende ${fmt(diesAdQuem)} ist bereits ein Werktag – keine Verschiebung.`,
    normen: istWartefrist
      ? [N_142_3]
      : modus === 'schkg_betreibungsferien' ? [N_63, N_142_3] : [N_142_3, N_145_1],
    rechtsprechung: modus === 'schkg_betreibungsferien' && verschoben ? [rechtsprechung('BGE_108_III_49')] : undefined,
  });

  // ─── Hinweise / Vorbehalte ──────────────────────────────────────────────

  const naturWarnung = NATUR_WARNUNG[input.fristnatur];
  if (naturWarnung) warnungen.push(naturWarnung);

  if (modus === 'schkg_betreibungsferien') {
    warnungen.push(
      'Achtung Betreibungsferien (Art. 56 SchKG) – NICHT identisch mit den Gerichtsferien: Sommer nur bis 31.7. (nicht 15.8.), Weihnachten nur bis 1.1. (nicht 2.1.). Sie hemmen den Fristenlauf nicht (Art. 63 SchKG).',
    );
  }
  if (modus === 'zpo_stillstand') {
    warnungen.push(
      'Gerichtliche SchKG-Klage: Seit 1.1.2025 gilt der ZPO-Fristenstillstand (Art. 56 Abs. 2 SchKG / Art. 145 Abs. 4 ZPO), nicht die Betreibungsferien.',
    );
  }
  warnungen.push(
    'Kantonal unterschiedliche Feiertage beeinflussen das Fristende (Art. 31 SchKG i.V.m. Art. 142 Abs. 3 ZPO) und sind eigenständig zu prüfen.',
  );
  if ((input.rechtsstillstandVon || input.rechtsstillstandBis) && modus !== 'schkg_betreibungsferien') {
    warnungen.push(
      'Der eingegebene Rechtsstillstand (Art. 57–62 SchKG) wirkt nur im Regime der Betreibungsferien (Art. 63 SchKG) und bleibt im gewählten Stillstand-Regime unberücksichtigt.',
    );
  }

  // RL-18 / F2-04: Zustellung einer Betreibungsurkunde während eines
  // Rechtsstillstands. Beim Rechtsstillstand wegen Militär-, Zivil- oder
  // Schutzdienstes (Art. 57 SchKG) ist die Zustellung nichtig (BGE 127 III 173
  // E. 3, in Abgrenzung zu den Betreibungsferien, E. 3b); Art und Grund des
  // eingegebenen Rechtsstillstands kennt die Engine nicht → Warnung, keine
  // Umrechnung. Geprüft werden der Zustelltag und der Wirkungstag nach RL-18.
  if (urkundenZustellung && input.rechtsstillstandVon && input.rechtsstillstandBis) {
    const rsVon = parseISO(input.rechtsstillstandVon);
    const rsBis = parseISO(input.rechtsstillstandBis);
    const inRs = (d: Date) => !isBefore(d, rsVon) && !isAfter(d, rsBis);
    if (inRs(ereignis) || inRs(wirkungstag)) {
      warnungen.push(
        `Zustellung während des eingegebenen Rechtsstillstands (${fmt(rsVon)}–${fmt(rsBis)}): Beruht er auf Militär-, Zivil- oder Schutzdienst (Art. 57 SchKG), ist die Zustellung nichtig (BGE 127 III 173 E. 3) — die Frist wird nicht ausgelöst, die Zustellung ist nach dem Ende des Rechtsstillstands zu wiederholen; die berechneten Daten gelten dann nicht. ` +
          'Ausnahmen: Betreibung für periodische familienrechtliche Unterhalts- und Unterstützungsbeiträge (Art. 57 Abs. 3 SchKG), Zahlungsbefehl in der Betreibung auf Pfandverwertung nach drei Monaten Rechtsstillstand (Art. 57b Abs. 2 SchKG). ' +
          'Bei einem Rechtsstillstand aus anderem Grund (Art. 58–62 SchKG) ist die Rechtsfolge im Einzelfall zu prüfen.',
      );
    }
  }

  // RL-18 / Q-10: Die Offenlegung der jeweils anderen Lesart mit ihrem Datum
  // hängt berechneSchkgFrist an (richtungssichere Wahl des Hauptwerts).

  annahmen.push(
    `Stillstand-Regime: ${MODUS_LABEL[modus]}.`,
    `Rechtsnatur: ${input.fristnatur}.`,
    `Kanton (staatlich anerkannte Feiertage): ${input.kanton}.`,
    'Reine prozessuale Fristberechnung; der konkrete Sachverhalt ist im Einzelfall zu prüfen.',
  );

  // Fristbeginn-Norm explizit benannt (B1-1): Art. 31 SchKG verweist auf die
  // ZPO-Fristberechnung — nicht über normverweise[1] erschlossen.
  const fristbeginnZpoNorm = input.einheit === 'tage' ? N_142_1 : N_142_2;
  const fristbeginnNorm = `Art. 31 SchKG i.V.m. ${fristbeginnZpoNorm.artikel}`;
  const normverweise: Normverweis[] = [
    N_31,
    fristbeginnZpoNorm,
    N_142_3,
  ];
  if (modus === 'schkg_betreibungsferien') normverweise.push(N_56_1, N_63);
  if (modus === 'zpo_stillstand') normverweise.push(N_56_2, N_145_4, N_145_1);
  if (input.fristnatur === 'verwirkung') normverweise.push(N_33_4);

  // Bug-Check 10.6.2026 (MITTEL, deklarierte fachliche Änderung): Die Warte-
  // frist läuft am rechnerischen Ende um 24.00 Uhr ab — frühestes ZULÄSSIGES
  // Datum ist erst der FOLGETAG (Art. 88 Abs. 1 SchKG: «frühestens 20 Tage
  // NACH der Zustellung»). Vorher wurde der letzte Tag DER LAUFENDEN Frist
  // als zulässig ausgewiesen (verfrühtes Begehren → Rückweisung).
  // Wartefrist: frühester Handlungstag = Folgetag des (unverschobenen) Fristablaufs.
  // Fällt dieser Folgetag selbst auf einen Sa/So/Feiertag, ist die Handlung als
  // HANDLUNGSfrist erst am nächsten Werktag zulässig (Art. 142 Abs. 3 ZPO). Die
  // Normalisierung wird deshalb NACH dem +1-Folgetag angewandt, nicht davor
  // (folgetag/massgeblich sind oben nach Schritt 3 berechnet).
  if (istWartefrist) {
    const folgetagVerschoben = differenceInCalendarDays(massgeblich, folgetag) > 0;
    rechenweg.push({
      beschreibung: 'Schritt 4 – Frühestes zulässiges Datum (Wartefrist)',
      zwischenergebnis: folgetagVerschoben
        ? `Die Wartefrist läuft am ${fmt(diesAdQuem)} um 24.00 Uhr ab; frühester Handlungstag wäre der Folgetag ${fmt(folgetag)} – da dieser arbeitsfrei ist, ist die Handlung erst am nächsten Werktag, ${fmt(massgeblich)}, zulässig (Art. 142 Abs. 3 ZPO).`
        : `Die Wartefrist läuft am ${fmt(diesAdQuem)} um 24.00 Uhr ab – die Handlung ist frühestens am Folgetag, ${fmt(massgeblich)}, zulässig.`,
      normen: [N_31, N_142_3],
    });
  }
  const datumLabel =
    input.fristnatur === 'wartefrist'
      ? `Frühestes zulässiges Datum: ${fmt(massgeblich)}`
      : input.fristnatur === 'verwirkung'
        ? `Letzter zulässiger Tag (Verwirkung): ${fmt(diesAdQuem)}, 24.00 Uhr`
        : `Fristende: ${fmt(diesAdQuem)}, 24.00 Uhr`;

  const r: SchkgErgebnis = {
    ergebnis: datumLabel + '.',
    fristbeginnNorm,
    status: 'ok',
    rechenweg,
    annahmen,
    warnungen,
    normverweise,
    massgeblicherEreignistag: fmt(wirkungstag),
    diesAQuo: fmt(diesAQuo),
    diesAdQuem: fmt(massgeblich),
    ereignisISO: iso(ereignis),
    diesAQuoISO: iso(diesAQuo),
    diesAdQuemISO: iso(massgeblich),
    modusAktiv: modus,
    ruhenAnzeige: modus === 'zpo_stillstand',
  };
  return { r, ferien: ferienBeiZustellung, wirkungstag };
}
