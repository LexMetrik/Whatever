// Dossier: bibliothek/recherche/arbeitsrecht-rechner.md
import { parseISO, addDays, addMonths, addYears, differenceInDays, isAfter, isBefore, isEqual, format } from 'date-fns';
import type { SperrfristenInput, Sperrereignis, SperrereignisTyp, Berechnungsergebnis, Normverweis } from '../types/legal';

// Reicheres Ergebnis: strukturierte Beendigung bzw. – bei Nichtigkeit – das Datum,
// ab dem frühestens neu gekündigt werden kann.
export type SperrfristenErgebnis = Berechnungsergebnis & {
  beendigungISO?: string;              // gültige Beendigung (yyyy-MM-dd)
  zugangISO?: string;
  gehemmtTage?: number;
  sperrfristEndeISO?: string;          // Ende der massgebenden Sperrfrist (bei Nichtigkeit)
  fruehesteNeueKuendigungISO?: string; // bei Nichtigkeit: ab hier neu kündbar
  sperrIntervalle?: { von: string; bis: string; typ: string }[]; // für die Zeitstrahl-Grafik
  // Sperrtage-Zähler je Ereignis: beanspruchte Tage; bei Krankheit/Unfall
  // zusätzlich Kontingent (30/90/180 je DJ) und verbleibende Tage.
  sperrtage?: {
    ereignis: number;            // 1-basiert (UI-Nummerierung)
    typ: string;
    vonISO: string; bisISO: string;
    // Krankheit: Art.-77-Zählung (Anfangstag zählt nicht; der Hemmungszähler
    // `gehemmtTage` zählt dagegen kalenderinklusiv — S3f-3, beide Zählweisen
    // gewollt); Rückfall: jeder Tag der erneuten Verhinderung (derselbe Lauf,
    // kein zweiter ausgenommener Anfangstag); sonst Kalendertage.
    beansprucht: number;
    kontingent?: number;         // Rückfall: Kontingent des Ursprungsereignisses
    verbleibend?: number;        // Rückfall: Rest nach diesem Rückfall
    rueckfall?: boolean;         // Rückfall gleicher Ursache: kein neues Kontingent, Rest des ursprünglichen (UI-06/W-04)
  }[];
};

const iso = (d: Date) => format(d, 'yyyy-MM-dd');
import { letzerTagDesMonats,
  berechneDienstjahr,
  formatDatum,
  intervallSchnittTage,
  istInIntervall,
  sperrfristEnde,
} from './datumsUtils';
import { berechneKuendigungsfrist, probezeitEnde, subFristMonate, type KuendigungsfristResultat } from './kuendigungsfrist';
import { rechtsprechung } from '../data/verifikation';

// ─── Feste Normverweise (Art. 336c OR) ────────────────────────────────────

const N_336c_1: Normverweis = { artikel: 'Art. 336c Abs. 1 OR', bemerkung: 'Sperrfristen-Tatbestände' };
const N_336c_2: Normverweis = { artikel: 'Art. 336c Abs. 2 OR', bemerkung: 'Nichtigkeit / Hemmung' };
const N_336c_3: Normverweis = { artikel: 'Art. 336c Abs. 3 OR', bemerkung: 'Erstreckung auf Kündigungstermin' };
const N_77:     Normverweis = { artikel: 'Art. 77 OR', bemerkung: 'Anfangstag zählt nicht (§1.2)' };
const N_335c_1: Normverweis = { artikel: 'Art. 335c Abs. 1 OR', bemerkung: 'Rückrechnung vom Endtermin (§1.1)' };
const N_336d:   Normverweis = { artikel: 'Art. 336d OR', bemerkung: 'Kündigung zur Unzeit durch den Arbeitnehmer' };

/** Kontingent Art. 336c Abs. 1 lit. b OR je Dienstjahr (30/90/180 Tage). */
const kontingentFuerDj = (dj: number): number => (dj <= 1 ? 30 : dj <= 5 ? 90 : 180);

// UI-06 / W-04 (Entscheid David 24.9.2026): Vorbehalt im Ergebnis, sobald ein
// Rückfall aus dem Restkontingent gerechnet wird (§8 — Lesart offenlegen).
const RUECKFALL_VORBEHALT =
  ' Vorbehalt: Rückfall aus dem Restkontingent gerechnet — diese Lesart ist nicht gerichtlich bestätigt (siehe Hinweise).';

// ─── Hilfsfunktion: Sperrfrist-Intervall berechnen ───────────────────────

type SperrfristIntervall = {
  von: Date;
  bis: Date;
  beschreibung: string;
  normen: Normverweis[];
  kontingent?: number; // nur Krankheit/Unfall: 30/90/180 Tage je Dienstjahr (Art. 336c Abs. 1 lit. b OR)
  /** Randfall-Fix 6.6.2026: Tatbestand greift NICHT (z. B. cter-Urlaub beginnt
   *  erst nach Ablauf der Kappung) — kein Intervall, nur erklärender Schritt. */
  keinSchutz?: boolean;
  /** SHK-Abgleich-Fix 10.6.2026 (B2): zweite Konstellation von BGE 133 III 517
   *  (SHK 336c N 20) — die kürzere Sperrfrist ist VOR dem Dienstjahres-Jahrestag
   *  aufgebraucht, die Arbeitsunfähigkeit dauert an. Läuft die (gehemmte)
   *  Kündigungsfrist über den Jahrestag, wird sie dort ERNEUT unterbrochen:
   *  längere Sperrfrist unter Anrechnung der bezogenen Tage. Der Kandidat wirkt
   *  nur, wo er die laufende Frist tatsächlich schneidet (Hemmungspfad). */
  folgeKandidat?: { von: Date; bis: Date; zusatzTage: number; neueMaxTage: number; jahrestag: Date; dj: number };
};

function berechneSperrfristIntervall(
  ereignis: Sperrereignis,
  vertragsbeginn: Date,
): SperrfristIntervall {
  const von = parseISO(ereignis.von);
  const bis = parseISO(ereignis.bis);

  switch (ereignis.typ) {
    case 'krankheit_unfall': {
      // Dienstjahr am Beginn der Verhinderung
      const dj = berechneDienstjahr(vertragsbeginn, von);
      const kurzeMaxTage = dj <= 1 ? 30 : dj <= 5 ? 90 : 180;

      // §1.2: Anfangstag zählt nicht (Art. 77 OR) → sperrfristEnde = von + Tage (kein −1),
      // gekappt durch tatsächliches Ende der Verhinderung ("bis").
      const kurzeEndeMax = sperrfristEnde(von, kurzeMaxTage);
      const kurzeEnde = isBefore(bis, kurzeEndeMax) ? bis : kurzeEndeMax;

      // §1.5 / C5: Dienstjahreswechsel 1→2 (30→90) oder 5→6 (90→180) während laufender Sperrfrist.
      // BGE 133 III 517: längere Sperrfrist ab ERSTEM AUF-Tag berechnen; bereits verstrichene
      // Tage werden dadurch automatisch angerechnet. Nur wenn die (kürzere) Sperrfrist beim
      // Jahrestag NOCH LÄUFT.
      if (dj === 1 || dj === 5) {
        // addYears statt Date-Konstruktor: bei Vertragsbeginn 29.2. fällt der Jahrestag
        // auf den 28.2. (wie differenceInYears in berechneDienstjahr) – kein Monatsüberlauf zum 1.3.
        const jahrestag = addYears(vertragsbeginn, dj);
        const laeuftNoch =
          (isAfter(jahrestag, von) || isEqual(jahrestag, von)) &&
          (isBefore(jahrestag, kurzeEnde) || isEqual(jahrestag, kurzeEnde));
        if (laeuftNoch) {
          const neueMaxTage = dj === 1 ? 90 : 180;
          const neuEndeMax = sperrfristEnde(von, neueMaxTage); // ab erstem AUF-Tag, Art. 77 OR
          const neuEnde = isBefore(bis, neuEndeMax) ? bis : neuEndeMax;
          return {
            von,
            bis: neuEnde,
            kontingent: neueMaxTage,
            beschreibung:
              `Krankheit/Unfall: Sperrfrist ${kurzeMaxTage} Tage (${dj}. DJ). Dienstjahreswechsel zum ${dj + 1}. DJ ` +
              `am ${formatDatum(jahrestag)} während laufender Sperrfrist → längere Sperrfrist ${neueMaxTage} Tage ` +
              `ab erstem AUF-Tag (Art. 77 OR), alte Tage angerechnet. Effektives Ende: ${formatDatum(neuEnde)}. ` +
              `(BGE 133 III 517, zu verifizieren.)`,
            normen: [N_336c_1, N_77],
          };
        }
        // SHK-Abgleich-Fix 10.6.2026 (B2, deklarierte fachliche Änderung —
        // normen/arbeitsrecht-shk-abgleich.md): zweite Konstellation von
        // BGE 133 III 517 — Sperrfrist vor dem Jahrestag aufgebraucht, die
        // Arbeitsunfähigkeit dauert am Jahrestag an. Kandidat für das
        // Wiederaufleben ab Jahrestag: Zusatztage = Differenz der Kontingente
        // (90−30 bzw. 180−90, Art.-77-Zählung ab Jahrestag), gekappt auf das
        // AUF-Ende. Wirkung entscheidet sich erst am Hemmungsfenster.
        if (isAfter(bis, jahrestag) || isEqual(bis, jahrestag)) {
          const neueMaxTage = dj === 1 ? 90 : 180;
          const zusatzTage = neueMaxTage - kurzeMaxTage;
          const folgeEndeMax = sperrfristEnde(jahrestag, zusatzTage);
          const folgeEnde = isBefore(bis, folgeEndeMax) ? bis : folgeEndeMax;
          return {
            von,
            bis: kurzeEnde,
            kontingent: kurzeMaxTage,
            beschreibung:
              `Krankheit/Unfall: Schutz max. ${kurzeMaxTage} Tage (${dj}. DJ), Anfangstag zählt nicht (Art. 77 OR). ` +
              `Sperrfrist ${formatDatum(von)} – ${formatDatum(kurzeEnde)}.`,
            normen: [N_336c_1, N_77],
            folgeKandidat: { von: jahrestag, bis: folgeEnde, zusatzTage, neueMaxTage, jahrestag, dj },
          };
        }
      }

      return {
        von,
        bis: kurzeEnde,
        kontingent: kurzeMaxTage,
        beschreibung:
          `Krankheit/Unfall: Schutz max. ${kurzeMaxTage} Tage (${dj}. DJ), Anfangstag zählt nicht (Art. 77 OR). ` +
          `Sperrfrist ${formatDatum(von)} – ${formatDatum(kurzeEnde)}.`,
        normen: [N_336c_1, N_77],
      };
    }

    case 'schwangerschaft': {
      // lit. c: «während der Schwangerschaft und in den 16 Wochen nach der Niederkunft».
      // B10-Fix 6.6.2026: Mit Niederkunftsdatum rechnet die Engine das Ende selbst
      // (Niederkunft + 112 Tage); ohne Datum wird die Nutzereingabe «bis» übernommen
      // und das ehrlich ausgewiesen (vorher suggerierte der Text eine Berechnung).
      if (ereignis.niederkunft) {
        const niederkunft = parseISO(ereignis.niederkunft);
        const ende = addDays(niederkunft, 112);
        return {
          von,
          bis: ende,
          beschreibung:
            `Schwangerschaft: Sperrfrist gesamte Schwangerschaft + 16 Wochen (112 Tage) nach Niederkunft. ` +
            `Niederkunft ${formatDatum(niederkunft)} → berechnetes Ende ${formatDatum(ende)}; Sperrfrist ${formatDatum(von)} – ${formatDatum(ende)}. ` +
            `(Schwangerschaftsbeginn als Anfangstag: BGE 143 III 21, zu verifizieren.)`,
          normen: [N_336c_1],
        };
      }
      return {
        von,
        bis, // Nutzereingabe: Beginn Schwangerschaft bis 16 Wochen (112 Tage) nach Niederkunft
        beschreibung:
          `Schwangerschaft: Sperrfrist gesamte Schwangerschaft + 16 Wochen (112 Tage) nach Niederkunft. ` +
          `Ende gemäss Eingabe (ohne Niederkunftsdatum nicht nachgerechnet): ${formatDatum(von)} – ${formatDatum(bis)}. ` +
          `(Schwangerschaftsbeginn als Anfangstag: BGE 143 III 21, zu verifizieren.)`,
        normen: [N_336c_1],
      };
    }

    case 'mutterschaftsurlaub_verlaengert': {
      // lit. cbis (BG 18.12.2020, in Kraft 1.7.2021): «vor dem Ende des verlängerten
      // Mutterschaftsurlaubs nach Artikel 329f Absatz 2» — Hospitalisierung des
      // Neugeborenen verlängert den Urlaub um die verlängerte Dauer der
      // Mutterschaftsentschädigung. Eingabe: Urlaubsbeginn bis (verlängertes) Ende.
      return {
        von,
        bis,
        beschreibung:
          `Verlängerter Mutterschaftsurlaub (lit. cbis, Art. 329f Abs. 2 OR — Hospitalisierung des ` +
          `Neugeborenen): Kündigungsschutz bis zum Ende des verlängerten Urlaubs. ` +
          `${formatDatum(von)} – ${formatDatum(bis)} (Urlaubsende gemäss Eingabe; die Verlängerungsdauer ` +
          `richtet sich nach der Mutterschaftsentschädigung, Art. 16c EOG).`,
        normen: [N_336c_1],
      };
    }

    case 'zusatzurlaub_tod_elternteil': {
      // lit. cter (BG 17.3.2023, in Kraft 1.1.2024): Urlaub der Mutter nach Art. 329f
      // Abs. 3 (Tod des anderen Elternteils; 2 Wochen, wochen-/tageweise innert
      // Rahmenfrist 6 Monate). Sperrfrist «zwischen dem Beginn des Urlaubs … und dem
      // letzten bezogenen Urlaubstag, längstens aber während drei Monaten ab dem Ende
      // der Sperrfrist nach Buchstabe c» (= Niederkunft + 112 Tage).
      if (ereignis.niederkunft) {
        const litCEnde = addDays(parseISO(ereignis.niederkunft), 112);
        const kappe = addMonths(litCEnde, 3);
        // Randfall-Fix 6.6.2026 (adversarialer Review): Beginnt der Urlaub erst
        // NACH der Kappung (möglich, weil die Rahmenfrist des Art. 329f Abs. 3
        // sechs Monate ab Tod läuft), besteht KEIN cter-Schutz — vorher entstand
        // ein invertiertes Intervall (von > bis, «−8 Sperrtage» in der Anzeige).
        if (isAfter(von, kappe)) {
          return {
            von,
            bis: von,
            keinSchutz: true,
            beschreibung:
              `Zusatzurlaub nach Tod des anderen Elternteils (lit. cter, Art. 329f Abs. 3 OR): Der Urlaubsbeginn ` +
              `${formatDatum(von)} liegt NACH der gesetzlichen Kappung («längstens drei Monate ab dem Ende der ` +
              `lit.-c-Sperrfrist» = ${formatDatum(kappe)}) — für diesen Urlaubsbezug besteht KEIN zeitlicher ` +
              `Kündigungsschutz nach lit. cter mehr.`,
            normen: [N_336c_1],
          };
        }
        const ende = isBefore(bis, kappe) ? bis : kappe;
        const gekappt = isAfter(bis, kappe);
        return {
          von,
          bis: ende,
          beschreibung:
            `Zusatzurlaub nach Tod des anderen Elternteils (lit. cter, Art. 329f Abs. 3 OR): Sperrfrist ` +
            `vom Urlaubsbeginn bis zum letzten bezogenen Urlaubstag, längstens drei Monate ab dem Ende der ` +
            `lit.-c-Sperrfrist (${formatDatum(litCEnde)} + 3 Monate = ${formatDatum(kappe)}). ` +
            (gekappt
              ? `Eingegebenes Urlaubsende ${formatDatum(bis)} überschreitet die Kappung → Sperrfrist ${formatDatum(von)} – ${formatDatum(ende)}.`
              : `Sperrfrist ${formatDatum(von)} – ${formatDatum(ende)}.`),
          normen: [N_336c_1],
        };
      }
      return {
        von,
        bis,
        beschreibung:
          `Zusatzurlaub nach Tod des anderen Elternteils (lit. cter, Art. 329f Abs. 3 OR): Sperrfrist ` +
          `${formatDatum(von)} – ${formatDatum(bis)} (letzter bezogener Urlaubstag gemäss Eingabe). ` +
          `ACHTUNG: Die gesetzliche Kappung «längstens drei Monate ab dem Ende der Sperrfrist nach lit. c» ` +
          `wurde mangels Niederkunftsdatum NICHT geprüft — Niederkunftsdatum erfassen.`,
        normen: [N_336c_1],
      };
    }

    case 'urlaub_tod_mutter': {
      // lit. cquinquies (BG 17.3.2023, in Kraft 1.1.2024): «während des Urlaubs nach
      // Artikel 329gbis» — stirbt die Mutter am Tag der Niederkunft oder in den
      // 14 Wochen danach, hat der andere Elternteil 14 Wochen Urlaub (ab dem Tag nach
      // dem Tod, an aufeinanderfolgenden Tagen; Verlängerung bei Hospitalisierung
      // max. 8 Wochen, Abs. 3). Eingabe: Urlaubszeitraum.
      return {
        von,
        bis,
        beschreibung:
          `Urlaub des anderen Elternteils nach Tod der Mutter (lit. cquinquies, Art. 329gbis OR): ` +
          `Kündigungsschutz während des Urlaubs. ${formatDatum(von)} – ${formatDatum(bis)} ` +
          `(14 Wochen ab dem Tag nach dem Tod, an aufeinanderfolgenden Tagen; bei Hospitalisierung ` +
          `des Neugeborenen Verlängerung um höchstens 8 Wochen, Abs. 3).`,
        normen: [N_336c_1],
      };
    }

    case 'militaer_zivil': {
      const dauerTage = differenceInDays(bis, von) + 1;
      let sfVon = von;
      let sfBis = bis;
      if (dauerTage > 11) {
        sfVon = addDays(von, -28); // 4 Wochen vor
        sfBis = addDays(bis, 28);  // 4 Wochen nach
      }
      return {
        von: sfVon,
        bis: sfBis,
        beschreibung:
          `Militär/Zivildienst: Dauer ${dauerTage} Tage.` +
          (dauerTage > 11
            ? ` > 11 Tage → Sperrfrist je 4 Wochen davor/danach. Sperrfrist ${formatDatum(sfVon)} – ${formatDatum(sfBis)}.`
            : ` ≤ 11 Tage → nur Dienstdauer. Sperrfrist ${formatDatum(sfVon)} – ${formatDatum(sfBis)}.`),
        normen: [N_336c_1],
      };
    }

    case 'hilfsaktion': {
      return {
        von,
        bis,
        beschreibung: `Hilfsaktion (lit. d): Sperrfrist Dauer der Dienstleistung. ${formatDatum(von)} – ${formatDatum(bis)}.`,
        normen: [N_336c_1],
      };
    }

    case 'betreuungsurlaub': {
      // Art. 329i OR: zeitlicher Kündigungsschutz solange Anspruch, längstens 6 Monate
      // ab Beginn der Rahmenfrist. B5-Fix 10.6.2026 (SHK-Abgleich): Die Kappung
      // hängt an der Eingabe-Semantik — «von» MUSS der Rahmenfrist-Beginn sein
      // (UI-Label angepasst); die Annahme wird im Text offengelegt.
      const maxEnde = addMonths(von, 6);
      const ende = isBefore(bis, maxEnde) ? bis : maxEnde;
      return {
        von,
        bis: ende,
        beschreibung:
          `Betreuungsurlaub (Art. 329i OR): zeitlicher Kündigungsschutz solange der Anspruch besteht, ` +
          `längstens 6 Monate ab Beginn der Rahmenfrist (Annahme: das eingegebene Von-Datum ist der Rahmenfrist-Beginn, nicht erst der erste Urlaubstag). ` +
          `${formatDatum(von)} – ${formatDatum(ende)}.`,
        normen: [N_336c_1],
      };
    }
  }
}

// ─── §1.3: Union überlappender Intervalle (verhindert Doppelzählung) ──────

type Iv = { von: Date; bis: Date };

function unionIntervalle(ivs: Iv[]): Iv[] {
  if (ivs.length === 0) return [];
  const sorted = [...ivs].sort((a, b) => a.von.getTime() - b.von.getTime());
  const merged: Iv[] = [{ ...sorted[0] }];
  for (let i = 1; i < sorted.length; i++) {
    const last = merged[merged.length - 1];
    const cur = sorted[i];
    // Überlappend oder direkt anschliessend (≤ 1 Tag Lücke) → zusammenfassen
    if (!isAfter(cur.von, addDays(last.bis, 1))) {
      if (isAfter(cur.bis, last.bis)) last.bis = cur.bis;
    } else {
      merged.push({ ...cur });
    }
  }
  return merged;
}

// ─── Probezeitverlängerung Art. 335b Abs. 3 OR (RL-16, W-08 Stufe 1) ──────
//
// Fedlex SR 220, Kons. 20260101 (Wortlaut in 20261001 unverändert): «Bei einer
// effektiven Verkürzung der Probezeit infolge Krankheit, Unfall oder Erfüllung
// einer nicht freiwillig übernommenen gesetzlichen Pflicht erfolgt eine
// entsprechende Verlängerung der Probezeit.» Die Engine RECHNET die
// Verlängerung (noch) nicht — sie braucht die Arbeitstage der Woche
// (BGE 148 III 126: nachzuholen sind die effektiv versäumten Arbeitstage;
// W-08 (b), Stufe 2). Bis dahin: Warnung, sobald ein Verlängerungsgrund in die
// Probezeit fällt und der Zugang nach deren unverlängertem Ende liegt — dann
// kann der Zugang in der verlängerten Probezeit liegen (7 Tage, keine
// Sperrfristen), und das Ergebnis ist nicht massgebend. Verlängerungsgründe im
// Ereignismodell: Krankheit/Unfall sowie obligatorischer Militär-, Schutz- oder
// Zivildienst (gesetzliche Pflicht); Schwangerschaft und Urlaube nicht.
const PZ_VERLAENGERUNG_TYPEN: Partial<Record<SperrereignisTyp, string>> = {
  krankheit_unfall: 'Krankheit/Unfall',
  militaer_zivil: 'Militär-/Schutz-/Zivildienst',
};

function probezeitVerlaengerungsWarnung(input: SperrfristenInput, kb: KuendigungsfristResultat): string | null {
  if (kb.istProbezeit) return null;
  const vb = parseISO(input.vertragsbeginn);
  const ende = probezeitEnde(vb, input.probezeitMonate);
  if (ende === null) return null;
  const treffer = (input.sperrereignisse ?? [])
    .map((e, i) => ({ e, nr: i + 1 }))
    .filter(({ e }) =>
      PZ_VERLAENGERUNG_TYPEN[e.typ] !== undefined &&
      !isAfter(parseISO(e.von), ende) &&
      !isBefore(parseISO(e.bis), vb));
  if (treffer.length === 0) return null;
  const liste = treffer
    .map(({ e, nr }) => `Ereignis ${nr} (${PZ_VERLAENGERUNG_TYPEN[e.typ]}, ${formatDatum(parseISO(e.von))} – ${formatDatum(parseISO(e.bis))})`)
    .join(', ');
  return (
    `Probezeitverlängerung nicht gerechnet: ${liste} fällt in die Probezeit (${formatDatum(vb)} – ${formatDatum(ende)}). ` +
    `Wird die Probezeit infolge Krankheit, Unfall oder Erfüllung einer nicht freiwillig übernommenen gesetzlichen Pflicht effektiv verkürzt, ` +
    `verlängert sie sich entsprechend (Art. 335b Abs. 3 OR); nachzuholen sind die effektiv versäumten Arbeitstage (BGE 148 III 126). ` +
    `Diese Verlängerung rechnet der Rechner nicht. Fällt der Zugang der Kündigung (${formatDatum(parseISO(input.zugangKuendigung))}) in die verlängerte Probezeit, ` +
    `gilt die Kündigungsfrist von sieben Tagen und es bestehen keine Sperrfristen (Art. 335b Abs. 1, Art. 336c Abs. 1 OR) — das Ergebnis ist dann nicht massgebend.`
  );
}

// ─── Hauptberechnung ──────────────────────────────────────────────────────

export function berechneSperrfristen(input: SperrfristenInput): SperrfristenErgebnis {
  const { kuendigendePartei, sperrereignisse = [] } = input;

  const rechenweg: Berechnungsergebnis['rechenweg'] = [];
  const annahmen: string[] = [];
  const warnungen: string[] = [];

  // ─── C7: Arbeitnehmerkündigung ────────────────────────────────────────

  if (kuendigendePartei === 'arbeitnehmer') {
    rechenweg.push({
      beschreibung: 'Sperrfristen-Prüfung (Art. 336c OR)',
      // S3f-3 / QS-GP (24.9.2026): nicht mehr kategorisch — Art. 336d OR
      // (Fedlex SR 220, Kons. 20260101) kennt ein Kündigungsverbot für den
      // Arbeitnehmer; der Tatbestand ist im Sperrereignis-Modell nicht abbildbar
      // und wird darum offengelegt statt still ausgeschlossen.
      zwischenergebnis:
        'Art. 336c OR gilt nur für Arbeitgeberkündigungen; bei Arbeitnehmerkündigung rechnet der Rechner keine Sperrfristen und keine Hemmung. ' +
        'Nicht geprüft wird der Sonderfall von Art. 336d OR: Der Arbeitnehmer darf nicht kündigen, solange ein Vorgesetzter, dessen Funktionen er ' +
        'auszuüben vermag, oder der Arbeitgeber selbst wegen Militär-, Schutz- oder Zivildienst (Art. 336c Abs. 1 lit. a OR) verhindert ist und er ' +
        'dessen Tätigkeit übernehmen muss; Art. 336c Abs. 2 und 3 OR gelten dann entsprechend.',
      normen: [N_336c_1, N_336d],
    });
    const kb = berechneKuendigungsfrist(input);
    rechenweg.push(...kb.ergebnis.rechenweg);
    annahmen.push(...kb.ergebnis.annahmen);
    // RL-16: Warnungen der Kündigungsfrist (z. B. Art. 335b Abs. 2, 335c Abs. 2
    // OR) erreichen das Formular nur über dieses Ergebnis — vorher verloren.
    warnungen.push(...kb.ergebnis.warnungen);
    const pzWarnungAN = probezeitVerlaengerungsWarnung(input, kb);
    if (pzWarnungAN) warnungen.push(pzWarnungAN);
    return {
      ergebnis: kb.ergebnis.ergebnis + ' (Art. 336c OR nicht anwendbar; Sonderfall Art. 336d OR nicht geprüft.)',
      status: 'ok',
      rechenweg,
      annahmen,
      warnungen,
      normverweise: [N_336c_1, ...kb.ergebnis.normverweise],
      zugangISO: input.zugangKuendigung,
      beendigungISO: kb.beendigungsdatum ? iso(kb.beendigungsdatum) : undefined,
    };
  }

  // ─── Kündigungsfrist-Ergebnis holen ──────────────────────────────────

  const kb = berechneKuendigungsfrist(input);
  // RL-16: Kündigungsfrist-Warnungen durchreichen (vorher ausser im Pfad ohne
  // Ereignisse verloren) + Warnung Probezeitverlängerung (Art. 335b Abs. 3 OR).
  warnungen.push(...kb.ergebnis.warnungen);
  const pzWarnung = probezeitVerlaengerungsWarnung(input, kb);
  if (pzWarnung) warnungen.push(pzWarnung);

  if (kb.istProbezeit) {
    rechenweg.push({
      beschreibung: 'Sperrfristen-Prüfung (Art. 336c OR)',
      zwischenergebnis: 'Art. 336c OR gilt nicht während der Probezeit (Art. 335b OR). Beendigung nach 7-Tages-Frist.',
      normen: [N_336c_1, { artikel: 'Art. 335b OR', bemerkung: 'Probezeit' }],
    });
    rechenweg.push(...kb.ergebnis.rechenweg);
    return {
      ergebnis: kb.ergebnis.ergebnis,
      status: 'ok',
      rechenweg,
      annahmen: [...kb.ergebnis.annahmen],
      warnungen,
      normverweise: [N_336c_1],
      zugangISO: input.zugangKuendigung,
      beendigungISO: kb.beendigungsdatum ? iso(kb.beendigungsdatum) : undefined,
    };
  }

  if (sperrereignisse.length === 0) {
    rechenweg.push({
      beschreibung: 'Sperrfristen-Prüfung (Art. 336c OR)',
      zwischenergebnis: 'Keine Sperrereignisse angegeben. Keine Sperrfrist-Hemmung.',
      normen: [N_336c_1],
    });
    rechenweg.push(...kb.ergebnis.rechenweg);
    annahmen.push(...kb.ergebnis.annahmen);
    return {
      ...kb.ergebnis,
      rechenweg,
      zugangISO: input.zugangKuendigung,
      beendigungISO: kb.beendigungsdatum ? iso(kb.beendigungsdatum) : undefined,
    };
  }

  const vb     = parseISO(input.vertragsbeginn);
  const zugang = parseISO(input.zugangKuendigung);

  // ─── Sperrfrist-Intervalle berechnen (§1.3: Rückfall ohne eigene Frist) ───

  const intervalle: SperrfristIntervall[] = [];
  const sperrIntervalle: { von: string; bis: string; typ: string }[] = [];
  const sperrtage: NonNullable<SperrfristenErgebnis['sperrtage']> = [];
  // B2-Fix 10.6.2026: Wiederaufleben-Kandidaten (BGE 133 III 517, 2. Konstellation)
  const folgeKandidaten: { ereignis: number; typ: string; von: Date; bis: Date; zusatzTage: number; neueMaxTage: number; jahrestag: Date; dj: number }[] = [];
  // UI-06 / W-04 (Fachänderung 24.9.2026): Rückfall derselben Ursache → kein
  // neues Kontingent, aber Schutz aus dem REST des ursprünglichen Kontingents.
  // Grundlage ist der Wortlaut von Art. 336c Abs. 1 lit. b OR («während» der
  // Verhinderung, höchstens 30/90/180 Tage — Obergrenze je Ursache); BGE 120 II
  // 124 E. 3d/e entscheidet nur, dass Ereignisse «n'ayant aucun lien entre eux»
  // je eine NEUE Sperrfrist auslösen. Die Lesart ist gerichtlich nicht bestätigt
  // und wird im Ergebnis offengelegt. Vorher: Rückfall = null Schutz (V10: HOCH).
  // Konto je Ursprungsereignis (Index): Rest, Kontingent, Dienstjahr am Ersteintritt.
  const konten = new Map<number, { rest: number; kontingent: number; dj: number }>();
  const wurzelVon = new Map<number, number>(); // Ereignis-Index → Index des Ursprungsereignisses
  let mitRueckfall = false;
  sperrereignisse.forEach((e, i) => {
    // Nur Krankheit/Unfall kennt einen Rückfall; ein nach Typwechsel stehen
    // gebliebener Bezug (Formular behält das Feld) darf z. B. eine Schwangerschaft
    // nicht um ihren Schutz bringen.
    const ref = e.typ === 'krankheit_unfall' ? e.gleicheUrsacheWieEreignis : null;
    if (ref != null) {
      const wurzel = Number.isInteger(ref) && ref >= 0 && ref < i ? wurzelVon.get(ref) : undefined;
      const konto = wurzel != null ? konten.get(wurzel) : undefined;
      if (wurzel != null && konto) {
        mitRueckfall = true;
        wurzelVon.set(i, wurzel);
        const von = parseISO(e.von);
        const restVorher = konto.rest;
        // Jeder Tag der erneuten Verhinderung zählt gegen den Rest — der
        // ausgenommene Anfangstag (Art. 77 OR) gehört zum Ersteintritt; eine
        // zweigeteilte Krankheit gibt so nie mehr Schutz als dieselbe am Stück.
        const bisMax = addDays(von, restVorher - 1);
        const bisEingabe = parseISO(e.bis);
        const bis = isBefore(bisEingabe, bisMax) ? bisEingabe : bisMax;
        const tage = restVorher > 0 && !isBefore(bis, von) ? differenceInDays(bis, von) + 1 : 0;
        konto.rest = restVorher - tage;
        const djRueckfall = berechneDienstjahr(vb, von);
        const kopf =
          `Rückfall derselben Ursache wie Ereignis ${wurzel + 1}: kein neues Kontingent (BGE 120 II 124 E. 3d/e — nur voneinander ` +
          `unabhängige Ereignisse lösen je eine neue Sperrfrist aus). Weiter gilt das Kontingent von Ereignis ${wurzel + 1} ` +
          `(${konto.kontingent} Tage; Ersteintritt im ${konto.dj}. DJ), davon vor diesem Rückfall noch ${restVorher} Tage offen.`;
        if (tage > 0) {
          intervalle.push({
            von, bis, kontingent: konto.kontingent,
            beschreibung: `Rückfall Ereignis ${i + 1} aus dem Restkontingent von Ereignis ${wurzel + 1}`,
            normen: [N_336c_1, N_77],
          });
          sperrIntervalle.push({ von: iso(von), bis: iso(bis), typ: e.typ });
        }
        sperrtage.push({
          ereignis: i + 1, typ: e.typ,
          vonISO: tage > 0 ? iso(von) : e.von, bisISO: tage > 0 ? iso(bis) : e.bis,
          beansprucht: tage, kontingent: konto.kontingent, verbleibend: konto.rest, rueckfall: true,
        });
        rechenweg.push({
          beschreibung: `Sperrereignis ${i + 1} – ${e.typ}: Rückfall (gleiche Ursache wie Ereignis ${ref + 1})`,
          zwischenergebnis:
            kopf + ' ' +
            (tage > 0
              ? `Im Rückfall zählt jeder Tag der Verhinderung (der Anfangstag ist nur beim Ersteintritt ausgenommen, Art. 77 OR): ` +
                `Sperrfrist ${formatDatum(von)} – ${formatDatum(bis)} (${tage} Tage), danach verbleibend ${konto.rest} Tage.`
              : `Das Kontingent ist aufgebraucht — dieser Rückfall löst keinen Kündigungsschutz aus.`),
          normen: [N_336c_1, N_77],
        });
        warnungen.push(
          `Rückfall (Ereignis ${i + 1}, gleiche Ursache wie Ereignis ${ref + 1}): Gerechnet wird kein neues Kontingent, sondern der Rest des ` +
          `ursprünglichen (${konto.kontingent} Tage, noch ${restVorher} offen). Diese Lesart stützt sich auf den Wortlaut von ` +
          `Art. 336c Abs. 1 lit. b OR (Schutz während der Verhinderung, höchstens ${konto.kontingent} Tage je Ursache); gerichtlich bestätigt ist ` +
          `sie nicht — BGE 120 II 124 entscheidet nur, dass voneinander unabhängige Krankheiten oder Unfälle je eine neue Sperrfrist auslösen. ` +
          // RL-13 PR 2 (Gegenprüfung PR 1): die Zählweise gehört zur offengelegten Auslegung.
          `Teil derselben Lesart ist die Zählweise: Im Rückfall zählt jeder Tag der Verhinderung; der Anfangstag ist nur beim Ersteintritt ` +
          `nicht mitgezählt (Art. 77 OR), damit eine unterbrochene Krankheit nicht mehr Schutz erhält als dieselbe am Stück.`,
        );
        if (kontingentFuerDj(djRueckfall) !== konto.kontingent) {
          warnungen.push(
            `Rückfall (Ereignis ${i + 1}) im ${djRueckfall}. Dienstjahr, Ersteintritt im ${konto.dj}. Dienstjahr: gerechnet wird mit dem ` +
            `Kontingent des Ersteintritts (${konto.kontingent} Tage). Ob stattdessen das Kontingent des neuen Dienstjahrs ` +
            `(${kontingentFuerDj(djRueckfall)} Tage) unter Anrechnung der bezogenen Tage gilt, ist nicht geklärt.`,
          );
        }
        return;
      }
      // Bezug ungültig (kein früheres Krankheits-/Unfallereignis): nicht still
      // schutzlos lassen, sondern als eigenständige Ursache rechnen und offenlegen.
      warnungen.push(
        `Ereignis ${i + 1} ist als Rückfall von Ereignis ${ref + 1} erfasst, das kein früheres Krankheits- oder Unfallereignis ist — ` +
        `als eigenständige Ursache gerechnet (eigene Sperrfrist). Bitte die Angabe prüfen.`,
      );
    }
    const iv = berechneSperrfristIntervall(e, vb);
    if (iv.keinSchutz) {
      // Tatbestand greift nicht (Randfall-Fix 6.6.2026): kein Intervall, kein
      // Zähler-Eintrag mit negativen Tagen — nur der erklärende Schritt.
      sperrtage.push({ ereignis: i + 1, typ: e.typ, vonISO: e.von, bisISO: e.bis, beansprucht: 0 });
      rechenweg.push({
        beschreibung: `Sperrereignis ${i + 1} – ${e.typ} (Art. 336c Abs. 1 OR)`,
        zwischenergebnis: iv.beschreibung,
        normen: iv.normen,
      });
      return;
    }
    intervalle.push(iv);
    if (iv.folgeKandidat) folgeKandidaten.push({ ereignis: i + 1, typ: e.typ, ...iv.folgeKandidat });
    sperrIntervalle.push({ von: iso(iv.von), bis: iso(iv.bis), typ: e.typ });
    // Zähler: Krankheit nach Art.-77-Zählung (Anfangstag zählt nicht, daher
    // ohne +1 – deckungsgleich mit dem Kontingent); übrige Typen Kalendertage.
    const beansprucht = e.typ === 'krankheit_unfall'
      ? differenceInDays(iv.bis, iv.von)
      : differenceInDays(iv.bis, iv.von) + 1;
    sperrtage.push({
      ereignis: i + 1, typ: e.typ, vonISO: iso(iv.von), bisISO: iso(iv.bis),
      beansprucht,
      kontingent: iv.kontingent,
      verbleibend: iv.kontingent != null ? Math.max(0, iv.kontingent - beansprucht) : undefined,
    });
    // UI-06: Konto für spätere Rückfälle derselben Ursache eröffnen.
    if (e.typ === 'krankheit_unfall' && iv.kontingent != null) {
      wurzelVon.set(i, i);
      konten.set(i, { rest: Math.max(0, iv.kontingent - beansprucht), kontingent: iv.kontingent, dj: berechneDienstjahr(vb, iv.von) });
    }
    rechenweg.push({
      beschreibung: `Sperrereignis ${i + 1} – ${e.typ} (Art. 336c Abs. 1 OR)`,
      zwischenergebnis: iv.beschreibung,
      normen: iv.normen,
    });
  });

  warnungen.push(
    'Sperrfrist (Art. 336c OR) und Lohnfortzahlung (Art. 324a OR) sind voneinander unabhängig. Eine Sperrfrist bedeutet nicht automatisch Lohnfortzahlung in gleicher Dauer (Art. 336c N 2; BGE 115 V 437, zu verifizieren).',
  );

  // ─── C2: Kündigung WÄHREND Sperrfrist → nichtig (Stichtag = Zugang) ───

  const waehrendSperrfrist = intervalle.find((iv) => istInIntervall(zugang, iv.von, iv.bis));

  if (waehrendSperrfrist) {
    // Audit 5.6.2026: Massgeblich für die Wiederholung ist das Ende der
    // GESAMTEN geschlossenen Sperrzeit – überlappende oder unmittelbar
    // anschliessende Sperrfristen weiterer Ereignisse werden vereinigt
    // (gleiche unionIntervalle-Logik wie im Hemmungspfad). Sonst fiele die
    // «frühestens»-Empfehlung mitten in die nächste Sperrfrist und die
    // wiederholte Kündigung wäre erneut nichtig.
    const unionAlle = unionIntervalle(intervalle.map((iv) => ({ von: iv.von, bis: iv.bis })));
    const geschlossen = unionAlle.find((iv) => istInIntervall(zugang, iv.von, iv.bis)) ?? waehrendSperrfrist;
    const fruehesteNeue = addDays(geschlossen.bis, 1); // frühestens nach Ablauf der gesamten Sperrzeit
    const anschlussHinweis = isAfter(geschlossen.bis, waehrendSperrfrist.bis)
      ? ` Dabei ist die unmittelbar anschliessende weitere Sperrfrist (bis ${formatDatum(geschlossen.bis)}) berücksichtigt.`
      : '';
    rechenweg.push({
      beschreibung: 'C2 – Kündigung während Sperrfrist → NICHTIG (Art. 336c Abs. 2 OR)',
      zwischenergebnis:
        `Zugang der Kündigung (${formatDatum(zugang)}) fällt in die Sperrfrist ${formatDatum(waehrendSperrfrist.von)} – ${formatDatum(waehrendSperrfrist.bis)}. ` +
        `Die Kündigung ist NICHTIG (sie entfaltet keine Wirkung). Das Arbeitsverhältnis dauert fort. ` +
        `Die Kündigung muss nach Ablauf der Sperrfrist (Ende der geschützten Verhinderung), also frühestens am ${formatDatum(fruehesteNeue)}, ` +
        `unter Einhaltung der ordentlichen Kündigungsfrist wiederholt werden.${anschlussHinweis}`,
      normen: [N_336c_2],
      rechtsprechung: [rechtsprechung('BGE_134_III_354')],
    });
    return {
      ergebnis:
        `Kündigung NICHTIG – kein Beendigungsdatum. Der Zugang (${formatDatum(zugang)}) liegt in der Sperrfrist ` +
        `(${formatDatum(waehrendSperrfrist.von)} – ${formatDatum(waehrendSperrfrist.bis)}); die Kündigung entfaltet keine Wirkung und das Arbeitsverhältnis besteht weiter. ` +
        `Sie ist nach Ablauf der Sperrfrist/Verhinderung – frühestens am ${formatDatum(fruehesteNeue)} – mit ordentlicher Frist zu wiederholen.` +
        (mitRueckfall ? RUECKFALL_VORBEHALT : ''),
      status: 'nichtig',
      rechenweg,
      annahmen,
      warnungen,
      normverweise: [N_336c_1, N_336c_2],
      zugangISO: input.zugangKuendigung,
      sperrfristEndeISO: iso(geschlossen.bis),
      fruehesteNeueKuendigungISO: iso(fruehesteNeue),
      sperrIntervalle,
      sperrtage,
    };
  }

  // ─── §1.1: Hemmung anhand der RÜCKGERECHNETEN Kündigungsfrist ────────

  rechenweg.push(...kb.ergebnis.rechenweg);
  annahmen.push(...kb.ergebnis.annahmen);

  const ende_ungehemmt = kb.beendigungsdatum!; // Endtermin aus Modul B (inkl. Art.-335c-III-Resttage)
  // VERIFY: Rückrechnung Fristbeginn = Endtermin − Frist (Kalendermonate). Bei Monatsendtermin
  // beginnt die Frist effektiv am 1. des auf den Zugang folgenden Monats; Rückrechnungslehre
  // (h.L., BGE 134 III 354 / 115 V 437), a.M. BGE 131 III 467 (Frist ab Zustellung).
  // B1-Folgefix 10.6.2026: Anker der Rückrechnung ist der ORDENTLICHE Endtermin
  // (ohne Vaterschafts-Resttage) — sonst rutscht das hemmbare Fenster um die
  // Resttage nach hinten und frühe Sperrgründe gingen verloren; das Fenster
  // endet aber am verlängerten Endtermin.
  // RL-16 / S3b-a: halber Monat = 15 Tage, zuletzt gezählt (Art. 77 Abs. 1
  // Ziff. 3 OR) → in der Rückrechnung zuerst abgezogen; subMonths(…, 0,5)
  // rechnete vorher einen ganzen Monat zurück.
  const beginn_frist_roh = subFristMonate(kb.ordentlichesEndeDatum ?? ende_ungehemmt, kb.fristMonate);
  // Bug-Audit 19.6.2026 (H1): Bei Zugang am Monatsletzten klemmt addMonths/subMonths
  // (z. B. Februar) asymmetrisch, sodass die Rückrechnung VOR den Zugang rutschen kann
  // (Zugang 31.12. + 2 Mt. → 28.02. → −2 Mt. → 28.12.). Ein Sperrgrund vor dem Zugang
  // kann die erst mit/nach Zugang laufende Kündigungsfrist nicht hemmen (Art. 336c
  // Abs. 2 OR) → Fenster-Untergrenze auf den Zugang klemmen.
  const beginn_frist = isBefore(beginn_frist_roh, zugang) ? zugang : beginn_frist_roh;

  annahmen.push(
    `Hemmung nach Rückrechnungsprinzip: massgeblich ist die rückgerechnete Kündigungsfrist ` +
    `(${formatDatum(beginn_frist)} – ${formatDatum(ende_ungehemmt)}), nicht das Fenster ab Zugang (${formatDatum(zugang)}). ` +
    `Ein Sperrgrund zwischen Zugang und Fristbeginn löst keine Hemmung aus (Art. 336c N 7, abweichende Lehre vorhanden).`,
  );

  rechenweg.push({
    beschreibung: 'C3 – Rückgerechnete Kündigungsfrist (Art. 335c Abs. 1 i.V.m. Art. 336c Abs. 2 OR)',
    zwischenergebnis:
      `Endtermin (ungehemmt): ${formatDatum(ende_ungehemmt)}. Frist ${kb.fristMonate} Monat/e rückgerechnet → ` +
      `hemmbares Fenster ${formatDatum(beginn_frist)} – ${formatDatum(ende_ungehemmt)}. ` +
      `Sperrgründe zwischen Zugang (${formatDatum(zugang)}) und Fristbeginn werden NICHT gehemmt.`,
    normen: [N_335c_1, N_336c_2],
    rechtsprechung: [rechtsprechung('BGE_134_III_354'), rechtsprechung('BGE_115_V_437'), rechtsprechung('BGE_131_III_467')],
  });

  // B2-Fix 10.6.2026 (§8-Offenlegung): Fällt der ZUGANG in ein Wiederaufleben-
  // Intervall, ist die Nichtigkeitsfrage höchstrichterlich nicht gesichert —
  // die Engine rechnet gültig weiter, legt die offene Rechtsfrage aber offen.
  const zugangInFolge = folgeKandidaten.find((f) => istInIntervall(zugang, f.von, f.bis));
  if (zugangInFolge) {
    warnungen.push(
      `Der Zugang der Kündigung (${formatDatum(zugang)}) fällt in das am Dienstjahres-Jahrestag wiederauflebende Sperr-Intervall (${formatDatum(zugangInFolge.von)} – ${formatDatum(zugangInFolge.bis)}; BGE 133 III 517, zweite Konstellation). Ob eine in dieser Phase ausgesprochene Kündigung nichtig ist, ist höchstrichterlich nicht geklärt — das Ergebnis ist mit Vorsicht zu verwenden.`,
    );
  }

  // §1.3: Union der Sperrfrist-Intervalle bilden, dann mit dem Fenster schneiden.
  // Bug-Check 10.6.2026 (HOCH, deklarierte fachliche Änderung): Das Fenster
  // wird ITERIERT — jede Hemmung verlängert die LAUFENDE Kündigungsfrist
  // (Art. 336c Abs. 2 OR: Frist steht still und läuft danach weiter); eine
  // neue Sperrfrist innerhalb der verlängerten Frist hemmt erneut (Fixpunkt-
  // Schleife wie mitStillstand() in verjaehrung.ts). Vorher wurde nur das
  // ungehemmte Fenster geschnitten — eine zweite Arbeitsunfähigkeit in der
  // verlängerten Frist blieb wirkungslos (zu frühes Beendigungsdatum).
  // B2-Fix 10.6.2026: Die Wiederaufleben-Kandidaten laufen in der Union mit —
  // schneiden sie das (iterativ verlängerte) Fenster nicht, bleiben sie
  // wirkungslos (genau die Bedingung «Kündigungsfrist läuft am Jahrestag noch»).
  const union = unionIntervalle([
    ...intervalle.map((iv) => ({ von: iv.von, bis: iv.bis })),
    ...folgeKandidaten.map((f) => ({ von: f.von, bis: f.bis })),
  ]);

  let totalHemmungTage = 0;
  let fensterBis = ende_ungehemmt;
  for (let runde = 0; runde < 24; runde++) {
    const fenster: Iv = { von: beginn_frist, bis: fensterBis };
    let neu = 0;
    union.forEach((piece) => { neu += intervallSchnittTage(fenster, piece); });
    if (neu === totalHemmungTage) break;
    totalHemmungTage = neu;
    fensterBis = addDays(ende_ungehemmt, totalHemmungTage);
  }
  // B2-Fix 10.6.2026: wirksame Wiederaufleben-Kandidaten rapportieren —
  // erklärender Schritt, Zeitstrahl-Intervall und Sperrtage-Zähler (Kontingent
  // des neuen Dienstjahrs, bezogene Tage angerechnet).
  folgeKandidaten.forEach((f) => {
    const schnitt = intervallSchnittTage({ von: beginn_frist, bis: fensterBis }, { von: f.von, bis: f.bis });
    if (schnitt === 0) return;
    sperrIntervalle.push({ von: iso(f.von), bis: iso(f.bis), typ: f.typ });
    const zaehler = sperrtage.find((s) => s.ereignis === f.ereignis);
    if (zaehler && zaehler.kontingent != null) {
      const folgeTage = differenceInDays(f.bis, f.von); // Art.-77-Zählung ab Jahrestag
      zaehler.kontingent = f.neueMaxTage;
      zaehler.beansprucht += folgeTage;
      zaehler.verbleibend = Math.max(0, f.neueMaxTage - zaehler.beansprucht);
    }
    rechenweg.push({
      beschreibung: `C3a – Erneuter Unterbruch am Dienstjahres-Jahrestag (Art. 336c Abs. 1 lit. b und Abs. 2 OR)`,
      zwischenergebnis:
        `Die Sperrfrist des Ereignisses ${f.ereignis} war vor dem Jahrestag aufgebraucht, die Arbeitsunfähigkeit dauert an ` +
        `und die Kündigungsfrist wirkt über den Dienstjahreswechsel (${formatDatum(f.jahrestag)}) hinaus: Die Frist wird am Jahrestag ` +
        `erneut unterbrochen — es gilt die Sperrfrist des ${f.dj + 1}. Dienstjahrs (${f.neueMaxTage} Tage) unter Anrechnung der bezogenen Tage, ` +
        `d. h. bis zu ${f.zusatzTage} weitere Sperrtage ab Jahrestag (Art. 77 OR), gekappt auf das Ende der Arbeitsunfähigkeit: ` +
        `${formatDatum(f.von)} – ${formatDatum(f.bis)}. (BGE 133 III 517, zweite Konstellation, zu verifizieren.)`,
      normen: [N_336c_1, N_336c_2, N_77],
    });
  });

  union.forEach((piece) => {
    const schnitt = intervallSchnittTage({ von: beginn_frist, bis: fensterBis }, piece);
    if (schnitt > 0) {
      rechenweg.push({
        beschreibung: 'C3 – Hemmung: Sperrfrist schneidet rückgerechnete Kündigungsfrist',
        zwischenergebnis:
          `Sperrfrist-Abschnitt ${formatDatum(piece.von)} – ${formatDatum(piece.bis)} schneidet die (um bisherige Hemmungen verlängerte) Frist ` +
          `${formatDatum(beginn_frist)} – ${formatDatum(fensterBis)}: ${schnitt} Hemmungstage.`,
        normen: [N_336c_2],
      });
    }
  });

  if (totalHemmungTage === 0) {
    rechenweg.push({
      beschreibung: 'C3 – Hemmungsprüfung',
      zwischenergebnis: 'Keine Sperrfrist-Überschneidung mit der rückgerechneten Kündigungsfrist. Keine Hemmung.',
      normen: [N_336c_2],
    });
    return {
      ergebnis: kb.ergebnis.ergebnis + ' (Keine Sperrfrist-Hemmung; Sperrgrund ausserhalb der rückgerechneten Frist.)' +
        (mitRueckfall ? RUECKFALL_VORBEHALT : ''),
      status: 'ok',
      rechenweg,
      annahmen,
      warnungen,
      normverweise: [N_336c_1, N_336c_2, N_336c_3, N_335c_1, ...kb.ergebnis.normverweise],
      zugangISO: input.zugangKuendigung,
      beendigungISO: iso(ende_ungehemmt),
      gehemmtTage: 0,
      sperrIntervalle,
      sperrtage,
    };
  }

  rechenweg.push({
    beschreibung: 'Hemmung total',
    zwischenergebnis: `Gesamt Hemmungstage (Union, keine Doppelzählung): ${totalHemmungTage}. Endtermin vor Hemmung: ${formatDatum(ende_ungehemmt)}.`,
    normen: [N_336c_2],
  });

  // Endtermin nach Hemmung (vor Erstreckung)
  const beendigungNachHemmung = addDays(ende_ungehemmt, totalHemmungTage);

  // ─── §1.4 / C4: Erstreckung auf Endtermin (Monatsende) ───────────────

  // V1 Vereinheitlichung 10.6.2026: Monatsende-Erstreckung aus datumsUtils
  // (EINE Quelle, identische date-fns-Semantik — byte-golden).
  const eoM = letzerTagDesMonats(beendigungNachHemmung);
  const beendigungEndgueltig =
    input.kuendigungsterminMonatsende && !isEqual(beendigungNachHemmung, eoM)
      ? eoM
      : beendigungNachHemmung;

  rechenweg.push({
    beschreibung: 'C4 – Erstreckung auf Kündigungstermin (Art. 336c Abs. 3 OR)',
    zwischenergebnis:
      `Nach Hemmung: ${formatDatum(beendigungNachHemmung)}.` +
      (input.kuendigungsterminMonatsende && !isEqual(beendigungNachHemmung, eoM)
        ? ` Kein Monatsende → Erstreckung auf ${formatDatum(beendigungEndgueltig)}.`
        : ` Bereits Monatsende → keine weitere Erstreckung.`) +
      ` Eine neue Arbeitsunfähigkeit in der Erstreckungsphase löst keine neue Sperrfrist aus (BGE 124 III 474, zu verifizieren).`,
    normen: [N_336c_3],
    rechtsprechung: [rechtsprechung('BGE_124_III_474')],
  });

  warnungen.push(
    'Rückfall derselben Krankheit/desselben Unfalls löst keine neue Sperrfrist aus (BGE 120 II 124, zu verifizieren).',
  );

  return {
    ergebnis:
      `Kündigung gültig. Kündigungsfrist gehemmt um ${totalHemmungTage} Tage. ` +
      `Beendigungsdatum nach Hemmung und Erstreckung: ${formatDatum(beendigungEndgueltig)}.` +
      (mitRueckfall ? RUECKFALL_VORBEHALT : ''),
    status: 'ok',
    rechenweg,
    annahmen,
    warnungen,
    normverweise: [N_336c_1, N_336c_2, N_336c_3, N_335c_1, ...kb.ergebnis.normverweise],
    zugangISO: input.zugangKuendigung,
    beendigungISO: iso(beendigungEndgueltig),
    gehemmtTage: totalHemmungTage,
    sperrIntervalle,
    sperrtage,
  };
}
