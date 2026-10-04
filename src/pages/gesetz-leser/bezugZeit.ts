// ─── B5: Zeit-Achse der Bezüge — Bereich, Histogramm, Migration (rein) ───────
//
// W2·7-BEZUG/B5 (FAHRPLAN-VERZAHNUNG-UI §9 B5). David 28.7.2026: «zeitstrahl und
// datumseingabe anstatt 5 jahre 10 jahre usw. menu soll interaktiv und innovativ
// nützlich sein». Diese Datei ist der rechnende Teil davon: sie kennt weder JSX
// noch Zustand noch die Uhr — jede Funktion ist rein und deterministisch (§2),
// jede Zeit-Referenz kommt als Parameter herein.
//
// Reine DARSTELLUNGS-Logik (§3): sie entscheidet, welche bereits geladenen
// Kanten gezeigt werden. Sie verändert keine Kante, ordnet nichts um und trifft
// keine Aussage über die Rechtslage.
//
// ── WARUM KEINE PERIODEN-BUCKETS MEHR (David 28.7.2026, ausdrücklich) ───────
// Die abgelöste Wahl «alle · 20 · 10 · 5 J.» beantwortete eine Frage, die
// niemand stellt. Wer die Praxis zu einem Artikel liest, fragt «was gilt seit
// der Revision von 2020?» oder «was kam nach BGE X?» — beides sind DATEN, keine
// runden Jahresabstände. Ein Bereich mit zwei offenen Enden deckt jede dieser
// Fragen ab UND die alte (heute minus n Jahre) als Sonderfall; umgekehrt geht
// es nicht. Darum ersetzt der Bereich die Stufen vollständig, statt neben ihnen
// zu stehen (§5: nicht zwei Steuerungen für dieselbe Frage).
//
// ── Q1-AUFLAGE: BANDJAHR NIE TAGESGENAU VERGLEICHEN ─────────────────────────
// BGE-Auszüge tragen teils nur das Bandjahr als Platzhalter (YYYY-01-01) statt
// eines echten Urteilsdatums — ein Urteil datiert nie auf den 1.1.
// (`entscheidPraezision`, artikel-revisionen.ts). Ein tagesgenauer Vergleich
// gegen ein solches Datum ist eine Behauptung über einen Tag, den die Daten
// nicht kennen: ein Bereich «ab 15.06.2020» liesse einen BGE des BANDES 2020
// durchfallen, obwohl er sehr wohl aus der zweiten Jahreshälfte stammen kann.
// Darum wird bei `praezision === 'bandjahr'` ausschliesslich das JAHR
// verglichen — die Richtung ist einseitig konservativ: im Zweifel behalten, nie
// eine echte Fundstelle verschweigen (§8). Dieselbe Einseitigkeit galt schon im
// abgelösten Filter (unparsbares Datum ⇒ behalten) und bleibt hier erhalten.

import type { Datumspraezision } from '../../lib/verzahnung/typen';
import { fmtIsoStrict } from '../../lib/format';

/** Ein Von-Bis-Bereich. Leerer String = OFFENES Ende (nicht «Anfang der Zeit»):
 *  ein offenes Ende schränkt gar nicht ein, es ist kein Grenzwert. */
export interface Zeitbereich {
  /** Frühestes Datum (ISO yyyy-MM-dd) oder '' = offen. */
  von: string;
  /** Spätestes Datum (ISO yyyy-MM-dd) oder '' = offen. */
  bis: string;
}

/** Beide Enden offen — der Grundzustand, in dem der Zeitfilter nichts tut.
 *  Geteilte Konstante, damit der Grundzustand referenz-stabil bleibt (§15). */
export const OFFENER_BEREICH: Zeitbereich = { von: '', bis: '' };

const ISO_RE = /^\d{4}-\d{2}-\d{2}$/;

/** Schränkt dieser Bereich überhaupt etwas ein? Beide Enden offen ⇒ nein. */
export function istBereichOffen(b: Zeitbereich): boolean {
  return b.von === '' && b.bis === '';
}

/**
 * Ein Datum aus Speicher oder Eingabefeld auf die strenge ISO-Form bringen.
 * Alles, was nicht genau `yyyy-MM-dd` ist, wird zu '' (= offen) — bewusst KEIN
 * Rate-Versuch: ein halb erkanntes Datum filterte still nach etwas anderem, als
 * dasteht. Ein Datum, das nicht gilt, gilt gar nicht.
 */
export function normalisiereDatum(roh: unknown): string {
  return typeof roh === 'string' && ISO_RE.test(roh) ? roh : '';
}

/**
 * Bereich normalisieren. Beide Enden einzeln geprüft; steht «von» NACH «bis»,
 * werden sie GETAUSCHT statt verworfen.
 *
 * Warum tauschen und nicht ablehnen: die Zieh-Auswahl am Zeitstrahl läuft in
 * beide Richtungen (nach links ziehen ist dieselbe Absicht wie nach rechts), und
 * in den Datumsfeldern ist die verdrehte Eingabe der häufigste Tippfehler. Ein
 * leerer Trefferbereich wäre die technisch korrekte, praktisch nutzlose Antwort.
 */
export function normalisiereBereich(von: unknown, bis: unknown): Zeitbereich {
  const v = normalisiereDatum(von);
  const b = normalisiereDatum(bis);
  if (v === '' && b === '') return OFFENER_BEREICH;
  return v !== '' && b !== '' && v > b ? { von: b, bis: v } : { von: v, bis: b };
}

/**
 * Darf ein Wert aus einem Datumsfeld SOFORT in den Bereich übernommen werden?
 *
 * Ja bei leer (= offenes Ende) und bei einem vollen vierstelligen Jahr ab 1000.
 * Grund (W2·17-UI-BEFUNDE E5-B01, 1.10.2026): das native `type=date` meldet beim
 * Tippen des Jahres nach JEDER Ziffer einen gültigen Wert (erste «2» ⇒
 * `0002-MM-DD`). Mit «von» = 2021-01-01 tauschte `normalisiereBereich` dann die
 * Enden, das fokussierte «bis»-Feld sprang unter dem Cursor um, und die
 * Folgeziffern schrieben in den falschen Zustand — Endstand «0002 … 0023», alle
 * datierten Entscheide weg (gemessen an StPO Art. 5). Zwischenstufen eines
 * Jahres sind keine Absicht und gehören nicht in den Bereich. Ein Jahr unter
 * 1000 trägt kein Entscheid (ältestes Datum in den Bezugs-Shards: 2007-10-17,
 * gemessen 1.10.2026 mit `jq -r '.dokumente[].datum' public/rechtsprechung/bezuege/*.json | sort | head -1`).
 * Rein (§2).
 */
export function istUebernehmbar(wert: string): boolean {
  if (wert === '') return true;
  const m = /^(\d{4})-/.exec(wert);
  return m !== null && Number(m[1]) >= 1000;
}

/**
 * Liegt ein Entscheid-Datum im Bereich? Q1-sicher (siehe Kopf-Kommentar).
 *
 * @param datum      ISO-Datum der Kante, wie es im Shard steht.
 * @param praezision Aus `entscheidPraezision(datum, gericht)`.
 *                   'bandjahr' ⇒ JAHR-Vergleich; 'unbekannt' ⇒ immer behalten.
 */
export function imBereich(datum: string, praezision: Datumspraezision, b: Zeitbereich): boolean {
  if (istBereichOffen(b)) return true;
  // Kein verwertbares Datum ⇒ BEHALTEN. Ein Entscheid verschwindet nie, weil wir
  // sein Datum nicht lesen können (§8) — dieselbe Richtung wie im Altfilter.
  if (praezision === 'unbekannt') return true;
  if (praezision === 'bandjahr') {
    const jahr = datum.slice(0, 4);
    if (b.von !== '' && jahr < b.von.slice(0, 4)) return false;
    if (b.bis !== '' && jahr > b.bis.slice(0, 4)) return false;
    return true;
  }
  // Tagesgenau: ISO-Strings sind lexikografisch = chronologisch sortierbar.
  if (b.von !== '' && datum < b.von) return false;
  if (b.bis !== '' && datum > b.bis) return false;
  return true;
}

/** Ein Balken des Zeitstrahls: ein Jahr und die Zahl der Kanten darin. */
interface JahrBalken {
  jahr: number;
  anzahl: number;
}

/** Ergebnis der Histogramm-Bildung — mit dem Rest, der kein Jahr trägt. */
export interface Histogramm {
  /** Lückenlos von der ersten bis zur letzten belegten Jahreszahl, aufsteigend.
   *  Jahre ohne Kante stehen mit `anzahl: 0` drin. */
  balken: JahrBalken[];
  /** Kanten ohne lesbares Jahr. Sie erscheinen in KEINEM Balken — darum werden
   *  sie hier ausgewiesen und nicht stillschweigend geschluckt (§8). */
  ohneJahr: number;
}

/**
 * Jahres-Histogramm über eine Menge von Kanten-Daten.
 *
 * SUMMEN-IDENTITÄT (im Test festgehalten): Summe aller `anzahl` + `ohneJahr`
 * ergibt IMMER die Zahl der übergebenen Daten. Ein Zeitstrahl, dessen Balken
 * weniger zeigen, als es Kanten gibt, ist eine falsche Verteilung — und eine
 * falsche Verteilung führt die Zieh-Auswahl systematisch in die Irre.
 *
 * LÜCKENLOS von min bis max: ein Jahr ohne Praxis IST eine Aussage. Kippte man
 * die leeren Jahre heraus und stellte die belegten nebeneinander, sähe eine
 * Lücke von acht Jahren aus wie ein normaler Abstand — die Zieh-Auswahl griffe
 * dann sichtbar andere Jahre als gemeint.
 *
 * Rein (§2): keine Uhr, kein «bis heute auffüllen».
 */
export function baueJahresHistogramm(daten: readonly string[]): Histogramm {
  const zaehler = new Map<number, number>();
  let ohneJahr = 0;
  let min = Infinity;
  let max = -Infinity;
  for (const d of daten) {
    const jahr = Number(String(d).slice(0, 4));
    if (!Number.isInteger(jahr) || jahr < 1000 || jahr > 9999) { ohneJahr += 1; continue; }
    zaehler.set(jahr, (zaehler.get(jahr) ?? 0) + 1);
    if (jahr < min) min = jahr;
    if (jahr > max) max = jahr;
  }
  if (zaehler.size === 0) return { balken: [], ohneJahr };
  const balken: JahrBalken[] = [];
  for (let j = min; j <= max; j += 1) balken.push({ jahr: j, anzahl: zaehler.get(j) ?? 0 });
  return { balken, ohneJahr };
}

/**
 * Zwei Jahre (Zieh-Auswahl am Zeitstrahl) in einen Bereich übersetzen: der
 * ganze erste bis zum ganzen letzten Jahr. Die Ränder sind INKLUSIV — wer den
 * Balken 2020 anfasst, meint das Jahr 2020 mit, nicht seinen Anfang.
 *
 * `bis` wird auf den 31.12. gesetzt und nicht auf den 1.1. des Folgejahres: ein
 * Bereichsende, das im nächsten Jahr steht, liesse einen Bandjahr-Entscheid des
 * Folgejahres (YYYY-01-01) durch den Jahresvergleich mit hineinrutschen.
 */
export function bereichAusJahren(vonJahr: number, bisJahr: number): Zeitbereich {
  const a = Math.min(vonJahr, bisJahr);
  const b = Math.max(vonJahr, bisJahr);
  return { von: `${a}-01-01`, bis: `${b}-12-31` };
}

/**
 * Deckt der Bereich das ganze Jahr `jahr` ab oder schneidet er es an? Für die
 * Einfärbung der Balken — ein angeschnittenes Jahr gilt als getroffen, weil in
 * ihm Kanten liegen können, die der Bereich behält.
 */
export function jahrImBereich(jahr: number, b: Zeitbereich): boolean {
  if (istBereichOffen(b)) return true;
  if (b.von !== '' && jahr < Number(b.von.slice(0, 4))) return false;
  if (b.bis !== '' && jahr > Number(b.bis.slice(0, 4))) return false;
  return true;
}

/**
 * Kurz-Label des aktiven Bereichs für Kopfzeile und Tooltip; offener Bereich ⇒
 * null (dann steht gar nichts da — ein «alle» wäre Lärm ohne Erkenntnis).
 * Schweizer Schreibung, Datum dd.MM.yyyy wie überall im Reader.
 */
export function bereichLabel(b: Zeitbereich): string | null {
  if (istBereichOffen(b)) return null;
  // Ä117 (18.8.2026): BIS-Strich ohne Spatien. Mit Spatien las sich der
  // Halbgeviertstrich als Gedankenstrich und stand damit in derselben Rolle wie
  // das «—» daneben (Benennungs-Glossar «ein Zeichen»). «Art. 1–10» im
  // Sektionskopf hält es seit je so — jetzt beide Spannen gleich.
  if (b.von !== '' && b.bis !== '') return `${fmtIsoStrict(b.von)}–${fmtIsoStrict(b.bis)}`;
  return b.von !== '' ? `ab ${fmtIsoStrict(b.von)}` : `bis ${fmtIsoStrict(b.bis)}`;
}

/**
 * EINMALIGE Migration der abgelösten Stufen-Wahl «alle · 20 · 10 · 5 J.» auf
 * einen Bereich (§9 B5 Ziff. 3).
 *
 * Abbildung: '5'|'10'|'20' ⇒ `von` = heute minus n Jahre, `bis` offen; 'alle'
 * und alles Unbekannte ⇒ offener Bereich. Das ist genau die Menge, die die
 * Stufe zuletzt gezeigt hat — der Nutzer sieht nach dem Update dieselben
 * Entscheide wie davor, nur mit einem Datum statt einer Stufe daneben (§8: eine
 * Umstellung kippt keine getroffene Wahl).
 *
 * `heute` kommt als ISO-String HEREIN (§2, Muster `heuteIso`): die Uhr sitzt an
 * der Store-Grenze, diese Funktion ist deterministisch und testbar.
 *
 * Der 29. Februar wird auf den 28. gezogen, wenn das Zieljahr kein Schaltjahr
 * ist. Ein «2023-02-29» wäre kein Datum, und `normalisiereDatum` machte daraus
 * '' — aus «letzte 5 Jahre» würde stillschweigend «alle». Genau einen Tag
 * früher zu beginnen ist die konservative Richtung (eher zu viel zeigen).
 */
export function migriereZeitraum(alt: unknown, heute: string): Zeitbereich {
  const jahre = alt === '5' ? 5 : alt === '10' ? 10 : alt === '20' ? 20 : 0;
  if (jahre === 0 || !ISO_RE.test(heute)) return OFFENER_BEREICH;
  const jahr = Number(heute.slice(0, 4)) - jahre;
  let rest = heute.slice(4); // '-MM-dd'
  if (rest === '-02-29' && !istSchaltjahr(jahr)) rest = '-02-28';
  return { von: `${String(jahr).padStart(4, '0')}${rest}`, bis: '' };
}

function istSchaltjahr(j: number): boolean {
  return (j % 4 === 0 && j % 100 !== 0) || j % 400 === 0;
}
