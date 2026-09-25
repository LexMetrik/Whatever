// Dossier: bibliothek/recherche/arbeitsrecht-rechner.md
import { parseISO, addDays, addMonths, subMonths, isAfter, isBefore, isEqual } from 'date-fns';
import type { KuendigungsfristInput, SperrfristenInput, Berechnungsergebnis, Normverweis } from '../types/legal';
import {
  berechneDienstjahr,
  formatDatum,
  letzerTagDesMonats,
} from './datumsUtils';
import { rechtsprechung } from '../data/verifikation';
import { berechneProbezeitVerlaengerung, probezeitVerlaengerungTexte, N_335b_3, N_BV_110_3 } from './kuendigungsfristProbezeit';

// ─── Feste Normverweise (Art. 335a–c OR) ─────────────────────────────────

const N_335a:   Normverweis = { artikel: 'Art. 335a OR', bemerkung: 'Parität der Kündigungsfristen' };
const N_335b:   Normverweis = { artikel: 'Art. 335b OR', bemerkung: 'Probezeit' };
const N_335c:   Normverweis = { artikel: 'Art. 335c OR', bemerkung: 'Kündigungsfristen und -termine' };
const N_335c_2: Normverweis = { artikel: 'Art. 335c Abs. 2 OR', bemerkung: 'Abänderung; < 1 Monat nur GAV & 1. DJ' };
// B6-Fix 10.6.2026 (SHK-Abgleich, am OR-Cache 20260101 verifiziert): Abs. 3
// spricht seit der Revision vom «Urlaub des andern Elternteils nach Art. 329g»
// (nicht mehr «Vaterschaftsurlaub»). Internes Feld vaterschaftsurlaubResttage
// bleibt (Permalink-/Schema-Stabilität); nutzersichtbare Texte folgen dem Gesetz.
const N_335c_3: Normverweis = { artikel: 'Art. 335c Abs. 3 OR', bemerkung: 'Verlängerung bei Urlaub des andern Elternteils (Art. 329g OR)' };
const N_77_halb: Normverweis = { artikel: 'Art. 77 Abs. 1 Ziff. 3 OR', bemerkung: '«halber Monat» = 15 Tage, zuletzt gezählt' };

// ─── Monatsfristen mit halbem Monat (RL-16 / S3b-a, 24.9.2026) ───────────
//
// Art. 77 Abs. 1 Ziff. 3 Satz 2 OR (Fedlex SR 220, Kons. 20260101, Wortlaut
// in 20261001 unverändert): Der Ausdruck «halber Monat» wird einem Zeitraum
// von 15 Tagen gleichgeachtet, die bei einer Frist von einem oder mehreren
// Monaten und einem halben Monat ZULETZT zu zählen sind. date-fns 4 schneidet
// Bruchteile in addMonths still ab (0,5 → 0) und rechnet subMonths(…, 0,5)
// als ganzen Monat — vorher verschwand der GAV-Halbmonat (1. DJ) und die
// Sperrfristen-Rückrechnung griff einen Monat zurück.

/** Frist in (halben) Monaten vorwärts: ganze Monate, dann 15 Tage. */
function addFristMonate(d: Date, monate: number): Date {
  const ganz = Math.floor(monate);
  const nachMonaten = addMonths(d, ganz);
  return monate - ganz === 0.5 ? addDays(nachMonaten, 15) : nachMonaten;
}

/** Rückrechnung vom Endtermin: zuerst die zuletzt gezählten 15 Tage, dann die ganzen Monate. */
export function subFristMonate(d: Date, monate: number): Date {
  const ganz = Math.floor(monate);
  const ohneHalbmonat = monate - ganz === 0.5 ? addDays(d, -15) : d;
  return subMonths(ohneHalbmonat, ganz);
}

// ─── Probezeit (Art. 335b OR) ─────────────────────────────────────────────

/** Wirksame Probezeitdauer: höchstens drei Monate (Art. 335b Abs. 2 OR). */
function wirksameProbezeitMonate(probezeitMonate: number): number {
  return Math.min(Math.max(probezeitMonate, 0), 3);
}

/** Letzter Tag der (unverlängerten) Probezeit; null ohne Probezeit.
 *  Bug-Check 10.6.2026: Der erste Arbeitstag zählt mit (1 Monat ab 1.4. endet
 *  am 30.4.). RL-16/F4-03 (24.9.2026): EINE Funktion für Logik UND Rechenweg —
 *  vorher zeigte der Rechenweg addMonths ohne −1 Tag (01.02. statt 31.01.).
 *  Nachtrag RL-16b (Gegenprüfung 25.9.2026, deklarierte Fachänderung): Die
 *  Regel vom 10.6.2026 widerspricht der Rechtsprechung. BGE 144 III 152
 *  E. 4.4.3: Wird der Vertrag am Tag des Stellenantritts geschlossen, zählt
 *  dieser Tag nicht (Zivilkomputation), «Art. 77 Abs. 1 Ziff. 3 OR ist ohne
 *  Weiteres anwendbar» — Antritt 15.7.2015, 1 Monat → Ende 15.8.2015. Bestätigt
 *  in 8C_317/2021 E. 5.2.3.1 (= BGE 148 III 126): Antritt 16.3.2020, 3 Monate
 *  → Ende 16.6.2020 [Präzisierung 25.9.2026: E. 5.2.3.1 steht nur im
 *  vollständigen Urteil 8C_317/2021, entscheidsuche.ch
 *  CH_BGer_008_8C-317-2021_2022-03-08, nicht in der Publikation BGE 148 III
 *  126]. Also Ende am gleichnamigen Tag; fehlt er, am letzten Tag
 *  des Monats (Art. 77 Abs. 1 Ziff. 3 OR — date-fns addMonths kappt genau so:
 *  31.1. + 1 Monat = 28.2.). Offen gelassen (E. 4.4.3 a.E.): Vertragsschluss
 *  VOR dem Antritt — dafür rechnet berechneKuendigungsfrist das Vortags-Ende
 *  als Gegenprobe und warnt, wo es das Ergebnis kippt (§8). */
function probezeitEnde(vertragsbeginn: Date, probezeitMonate: number): Date | null {
  const monate = wirksameProbezeitMonate(probezeitMonate);
  return monate === 0 ? null : addMonths(vertragsbeginn, monate);
}

export type KuendigungsfristResultat = {
  ergebnis: Berechnungsergebnis;
  beendigungsdatum?: Date;
  fristLaufendeDatum?: Date;
  /** Ordentlicher Endtermin OHNE die Verlängerung nach Art. 335c Abs. 3 OR —
   *  Anker für die Sperrfristen-Rückrechnung (das hemmbare Fenster beginnt
   *  beim ordentlichen Fristlauf, nicht erst um die Resttage verschoben). */
  ordentlichesEndeDatum?: Date;
  istProbezeit: boolean;
  fristMonate: number;
};

function istInProbezeit(zugang: Date, ende: Date | null): boolean {
  if (ende === null) return false;
  // Bug-Check 10.6.2026 (MITTEL, deklarierte fachliche Änderung): Vorher galt
  // der Zugang am Tag NACH Probezeitende noch als Probezeitkündigung (7 Tage,
  // keine Sperrfristen). Ende inklusive.
  return isBefore(zugang, ende) || isEqual(zugang, ende);
}

/** `sperrereignisse` (optional): Verhinderungen für die Probezeitverlängerung
 *  nach Art. 335b Abs. 3 OR (RL-16b) — dieselben Ereignisse wie im
 *  Sperrfristen-Rechner, damit Formular und Vorlagen EIN Probezeitende sehen. */
export function berechneKuendigungsfrist(
  input: KuendigungsfristInput & Pick<SperrfristenInput, 'sperrereignisse'>,
): KuendigungsfristResultat {
  const {
    vertragsbeginn,
    zugangKuendigung,
    kuendigendePartei,
    probezeitMonate,
    abweichendeFristMonate,
    kuendigungsterminMonatsende,
  } = input;

  const vb     = parseISO(vertragsbeginn);
  const zugang = parseISO(zugangKuendigung);

  const rechenweg: Berechnungsergebnis['rechenweg'] = [];
  const annahmen: string[] = [
    'Massgebend ist der Zugang der Kündigung beim Empfänger (Zugangsprinzip), nicht das Datum des Absenders.',
    `Kündigungstermin: ${kuendigungsterminMonatsende ? 'Monatsende' : 'freies Datum (kein Monatsendtermin vereinbart)'}.`,
  ];
  const warnungen: string[] = [];

  // ─── Probezeit prüfen (Art. 335b OR) ─────────────────────────────────

  const dauerProbezeitMonate = wirksameProbezeitMonate(probezeitMonate);
  const pzEnde = probezeitEnde(vb, probezeitMonate);
  // RL-16b (W-08 b): Verlängerung nach Art. 335b Abs. 3 OR — nur relevant,
  // wenn der Zugang nach dem unverlängerten Ende liegt (sonst ohnehin Probezeit).
  const pzVerl = pzEnde !== null && isAfter(zugang, pzEnde)
    ? berechneProbezeitVerlaengerung(vb, pzEnde, input.sperrereignisse, input.arbeitstageWoche)
    : null;
  const inProbezeit = istInProbezeit(zugang, pzVerl?.ende ?? pzEnde);

  // Gegenprobe zur offenen Frage aus BGE 144 III 152 E. 4.4.3 a.E.: zählt bei
  // Vertragsschluss vor dem Antritt der erste Tag mit, endet die Probezeit am
  // Vortag des gleichnamigen Tages (samt Verlängerung neu gerechnet).
  if (pzEnde !== null) {
    const endeVortag = addDays(pzEnde, -1);
    const verlVortag = isAfter(zugang, endeVortag)
      ? berechneProbezeitVerlaengerung(vb, endeVortag, input.sperrereignisse, input.arbeitstageWoche)
      : null;
    const endeAlt = verlVortag?.ende ?? endeVortag;
    if (istInProbezeit(zugang, endeAlt) !== inProbezeit) {
      warnungen.push(
        `Probezeitende nach BGE 144 III 152 E. 4.4.3 (Art. 77 Abs. 1 Ziff. 3 OR): Der Tag des Stellenantritts zählt nicht mit, wenn der Arbeitsvertrag an diesem Tag geschlossen wurde — gerechnet ist darum mit Ende am ${formatDatum(pzEnde)}${pzVerl ? ` (verlängert bis ${formatDatum(pzVerl.ende)})` : ''}. ` +
        `Wurde der Vertrag schon vor dem Stellenantritt geschlossen, hat das Bundesgericht offengelassen, ob der erste Tag mitzählt; dann endete die Probezeit am ${formatDatum(endeAlt)}, und der Zugang (${formatDatum(zugang)}) läge ${inProbezeit ? 'ausserhalb' : 'in'} der Probezeit — das Ergebnis hängt davon ab.`,
      );
    }
  }

  // RL-16 / F4-04 (24.9.2026): Art. 335b Abs. 2 OR erlaubt höchstens drei
  // Monate — die Kappung bleibt, wird aber offengelegt (§8) statt still.
  if (probezeitMonate > 3) {
    warnungen.push(
      `Die vereinbarte Probezeit von ${probezeitMonate} Monaten übersteigt das Höchstmass von drei Monaten (Art. 335b Abs. 2 OR); die Abrede ist insoweit unwirksam. Gerechnet wird mit drei Monaten.`,
    );
  }

  if (pzEnde !== null) {
    rechenweg.push({
      beschreibung: 'Schritt 1 – Probezeit prüfen (Art. 335b OR)',
      zwischenergebnis: pzVerl
        ? `Zugang ${formatDatum(zugang)} liegt nach dem unverlängerten Ende der Probezeit (${dauerProbezeitMonate} Monat/e, Ende ${formatDatum(pzEnde)}); Verhinderung in der Probezeit → Verlängerung prüfen.`
        : inProbezeit
        ? `Zugang ${formatDatum(zugang)} liegt in der Probezeit (${dauerProbezeitMonate} Monat/e, Ende ${formatDatum(pzEnde)}). Frist: 7 Tage, kein Monatsendtermin, keine Sperrfristen.`
        : `Zugang ${formatDatum(zugang)} liegt ausserhalb der Probezeit (Ende ${formatDatum(pzEnde)}). Ordentliche Frist gilt.`,
      normen: [N_335b],
    });
  }

  if (pzVerl) {
    const t = probezeitVerlaengerungTexte(pzVerl, zugang);
    rechenweg.push({
      beschreibung: 'Schritt 1a – Verlängerung der Probezeit (Art. 335b Abs. 3 OR)',
      zwischenergebnis: t.schritt,
      normen: [N_335b_3, ...(pzVerl.bundesfeiertagNichtGezaehlt ? [N_BV_110_3] : [])],
      rechtsprechung: [rechtsprechung('BGE_148_III_126')],
    });
    warnungen.push(...t.warnungen);
    annahmen.push(...t.annahmen);
  }

  if (inProbezeit) {
    const beendigung = addDays(zugang, 7);
    return {
      ergebnis: {
        ergebnis: `Kündigung in der Probezeit: Frist 7 Tage. Beendigung: ${formatDatum(beendigung)}.`,
        status: 'ok',
        rechenweg,
        annahmen,
        warnungen,
        normverweise: [N_335b, ...(pzVerl ? [N_335b_3] : []), N_335a],
      },
      beendigungsdatum: beendigung,
      istProbezeit: true,
      fristMonate: 0,
    };
  }

  // ─── Dienstjahr und gesetzliche Frist (Art. 335c OR) ─────────────────

  const dienstjahr = berechneDienstjahr(vb, zugang);

  let gesetzlicheFristMonate: number;
  if (dienstjahr <= 1) {
    gesetzlicheFristMonate = 1;
  } else if (dienstjahr <= 9) {
    gesetzlicheFristMonate = 2;
  } else {
    gesetzlicheFristMonate = 3;
  }

  rechenweg.push({
    beschreibung: 'Schritt 2 – Dienstjahr (Stichtag = Zugang der Kündigung)',
    zwischenergebnis:
      `Vertragsbeginn ${formatDatum(vb)}, Zugang ${formatDatum(zugang)}: ${dienstjahr - 1} vollendete Jahre + 1 = ${dienstjahr}. Dienstjahr. Gesetzliche Frist: ${gesetzlicheFristMonate} Monat/e.`,
    normen: [N_335c],
    rechtsprechung: [rechtsprechung('BGE_134_III_354')],
  });

  // ─── Abweichende Frist prüfen (§3.2 – max() entfernt) ─────────────────
  //
  // Art. 335c Abs. 2 OR: Abänderung durch schriftliche Abrede / NAV / GAV; Minimalfrist
  // 1 Monat (beidseitig zwingend); Verkürzung < 1 Monat nur durch GAV und nur im 1. DJ.
  // Schriftform ist Gültigkeitsvoraussetzung. Parität: für AG und AN gilt dieselbe Frist
  // (Art. 335a Abs. 1 OR).

  let fristMonate = gesetzlicheFristMonate;

  if (abweichendeFristMonate != null) {
    const formGueltig = input.abweichendeFristFormGueltig ?? false;
    const quelleGAV = input.abweichendeFristQuelleGAV ?? false;

    if (!formGueltig) {
      // Schriftform/GAV nicht bestätigt → Abrede unwirksam, gesetzliche Frist gilt.
      fristMonate = gesetzlicheFristMonate;
      warnungen.push(
        abweichendeFristMonate < gesetzlicheFristMonate
          ? `Abweichende Frist (${abweichendeFristMonate} Monate) unterschreitet die gesetzliche Frist (${gesetzlicheFristMonate} Monate); mangels bestätigter Schriftform/GAV (Art. 335c Abs. 2 OR, Gültigkeitsvoraussetzung) gilt die gesetzliche Frist.`
          : `Abweichende Frist (${abweichendeFristMonate} Monate) ist mangels bestätigter Schriftform/GAV (Art. 335c Abs. 2 OR) unwirksam; es gilt die gesetzliche Frist (${gesetzlicheFristMonate} Monate).`,
      );
      rechenweg.push({
        beschreibung: 'Schritt 3 – Abweichende Kündigungsfrist: Schriftform/GAV nicht bestätigt (Art. 335c Abs. 2 OR)',
        zwischenergebnis: `Abrede unwirksam → gesetzliche Frist ${gesetzlicheFristMonate} Monat/e.`,
        normen: [N_335c_2, N_335a],
      });
    } else if (abweichendeFristMonate >= 1) {
      // Gültig vereinbarte Frist ≥ 1 Monat gilt – auch wenn KÜRZER als gesetzlich.
      fristMonate = abweichendeFristMonate;
      rechenweg.push({
        beschreibung: 'Schritt 3 – Abweichende Kündigungsfrist gültig vereinbart (Art. 335a/c OR)',
        zwischenergebnis:
          `Schriftlich/GAV vereinbarte Frist ${abweichendeFristMonate} Monat/e (≥ Minimalfrist 1 Monat) gilt` +
          (abweichendeFristMonate < gesetzlicheFristMonate
            ? `, auch wenn kürzer als die dispositive gesetzliche Frist (${gesetzlicheFristMonate} Monate).`
            : abweichendeFristMonate > gesetzlicheFristMonate
              ? ` (länger als die gesetzliche Frist).`
              : ` (entspricht der gesetzlichen Frist).`) +
          ` Parität (Art. 335a Abs. 1 OR): für Arbeitgeber und Arbeitnehmer gilt dieselbe Frist.`,
        normen: [N_335a, N_335c_2],
      });
    } else if (quelleGAV && dienstjahr === 1) {
      // Verkürzung < 1 Monat nur durch GAV und nur im 1. Dienstjahr.
      fristMonate = abweichendeFristMonate;
      rechenweg.push({
        beschreibung: 'Schritt 3 – Verkürzung < 1 Monat (GAV, 1. Dienstjahr) (Art. 335c Abs. 2 OR)',
        zwischenergebnis: `Durch GAV im 1. Dienstjahr zulässige Frist < 1 Monat: ${abweichendeFristMonate} Monat/e.`,
        normen: [N_335c_2],
      });
    } else {
      // Unzulässige Verkürzung < 1 Monat → gesetzliche Mindestfrist.
      fristMonate = Math.max(1, gesetzlicheFristMonate);
      warnungen.push(
        `Verkürzung unter 1 Monat ist nur durch Gesamtarbeitsvertrag und nur im ersten Dienstjahr zulässig (Art. 335c Abs. 2 OR). Es gilt die gesetzliche Frist (${fristMonate} Monat/e).`,
      );
      rechenweg.push({
        beschreibung: 'Schritt 3 – Unzulässige Verkürzung < 1 Monat (Art. 335c Abs. 2 OR)',
        zwischenergebnis: `Verkürzung unzulässig → gesetzliche Frist ${fristMonate} Monat/e.`,
        normen: [N_335c_2],
      });
    }
  }

  // RL-16 / S3b-a (24.9.2026): Monatsfristen sind nur in ganzen und halben
  // Monaten bestimmbar (Art. 77 Abs. 1 Ziff. 3 OR). Andere Bruchteile werden
  // auf den halben Monat abgerundet — wie bisher nie länger als eingegeben —
  // und offengelegt (§8), statt von date-fns still abgeschnitten.
  const fristMonateHalb = Math.floor(fristMonate * 2) / 2;
  if (fristMonateHalb !== fristMonate) {
    warnungen.push(
      `Die Frist von ${fristMonate} Monaten ist keine bestimmbare Monatsfrist: Art. 77 Abs. 1 Ziff. 3 OR kennt neben ganzen Monaten nur den halben Monat (15 Tage). Gerechnet wird mit ${fristMonateHalb} Monat/en; eine in Tagen oder Wochen vereinbarte Frist ist gesondert zu prüfen.`,
    );
    fristMonate = fristMonateHalb;
  }
  const mitHalbmonat = fristMonate % 1 !== 0;

  // ─── Fristberechnung und Endtermin (inkl. §3.4 Urlaub des andern Elternteils) ────

  const fristLaufende = addFristMonate(zugang, fristMonate);

  // SHK-Abgleich-Fix 10.6.2026 (B1, deklarierte fachliche Änderung —
  // normen/arbeitsrecht-shk-abgleich.md): Die Verlängerung um nicht bezogene
  // Vaterschaftsurlaubstage (Art. 335c Abs. 3 OR, nur Arbeitgeberkündigung)
  // läuft TAGGENAU über den ordentlichen Endtermin hinaus; eine Erstreckung
  // der Verlängerung auf das nächste Monatsende gibt es von Gesetzes wegen
  // nicht (nur durch vertragliche Abrede, Analogie zu Art. 336c Abs. 3).
  // Vorher wurden die Resttage VOR der Monatsende-Erstreckung addiert und vom
  // Rounding verschluckt (Zugang 15.3. + 1 Mt. + 10 Resttage ergab 30.4. —
  // identisch mit dem Ergebnis ohne Resttage; Abs. 3 ist teilzwingend).
  const vaterschaftResttage =
    kuendigendePartei === 'arbeitgeber' && input.vaterschaftsurlaubResttage
      ? Math.max(0, input.vaterschaftsurlaubResttage)
      : 0;

  const ordentlichesEnde = kuendigungsterminMonatsende
    ? letzerTagDesMonats(fristLaufende)
    : fristLaufende;
  const beendigung =
    vaterschaftResttage > 0 ? addDays(ordentlichesEnde, vaterschaftResttage) : ordentlichesEnde;

  rechenweg.push({
    beschreibung: `Schritt ${abweichendeFristMonate != null ? 4 : 3} – Fristberechnung und Endtermin`,
    zwischenergebnis:
      `Frist: ${fristMonate} Monat/e ab Zugang ${formatDatum(zugang)}` +
      (mitHalbmonat ? ` (halber Monat = 15 Tage, zuletzt gezählt)` : '') +
      ` → ${formatDatum(fristLaufende)}. ` +
      (vaterschaftResttage > 0
        ? (kuendigungsterminMonatsende
            ? `Kündigungstermin = Monatsende: ordentlicher Endtermin ${formatDatum(ordentlichesEnde)}. `
            : `Kein Monatsendtermin: ordentlicher Endtermin ${formatDatum(ordentlichesEnde)}. `) +
          `Verlängerung um ${vaterschaftResttage} nicht bezogene Tage des Urlaubs des andern Elternteils (Art. 335c Abs. 3 i.V.m. Art. 329g OR) taggenau über den Endtermin hinaus: Beendigung ${formatDatum(beendigung)}.`
        : kuendigungsterminMonatsende
          ? `Kündigungstermin = Monatsende: Beendigung ${formatDatum(beendigung)}.`
          : `Kein Monatsendtermin: Beendigung ${formatDatum(beendigung)}.`),
    normen: [N_335c, ...(vaterschaftResttage > 0 ? [N_335c_3] : []), ...(mitHalbmonat ? [N_77_halb] : [])],
  });

  if (vaterschaftResttage > 0) {
    annahmen.push(
      'Während des Urlaubs des andern Elternteils (Art. 329g OR, vormals «Vaterschaftsurlaub») besteht kein zeitlicher Kündigungsschutz (keine Sperrfrist), die Kündigungsfrist verlängert sich aber um die nicht bezogenen Urlaubstage (Art. 335c Abs. 3 OR). Die Verlängerung läuft taggenau; eine zusätzliche Erstreckung auf das nächste Monatsende gilt nur bei entsprechender vertraglicher Abrede und ist hier nicht berücksichtigt.',
    );
  }

  annahmen.push(
    `Kündigung durch: ${kuendigendePartei === 'arbeitgeber' ? 'Arbeitgeber' : 'Arbeitnehmer'}.`,
  );

  return {
    ergebnis: {
      ergebnis: `Ordentliche Kündigung (${kuendigendePartei === 'arbeitgeber' ? 'Arbeitgeber' : 'Arbeitnehmer'}): Frist ${fristMonate} Monat/e. Beendigungsdatum: ${formatDatum(beendigung)}.`,
      status: 'ok',
      rechenweg,
      annahmen,
      warnungen,
      normverweise: [N_335a, N_335b, N_335c],
    },
    beendigungsdatum: beendigung,
    fristLaufendeDatum: fristLaufende,
    ordentlichesEndeDatum: ordentlichesEnde,
    istProbezeit: false,
    fristMonate,
  };
}
