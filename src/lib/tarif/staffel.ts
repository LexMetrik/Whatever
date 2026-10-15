// ─── Fachneutrales Tarif-Staffel-Primitiv ──────────────────────────────────
//
// FAHRPLAN-PRODUKTAUSBAU-BURGGRABEN B-P0a (Säule B, Hauptmoat). Reine,
// deterministische Auswertung deklarierter Gebührenregeln über einen
// Bemessungswert (i.d.R. Streitwert/Forderung in CHF). Dies ist
// INFRASTRUKTUR, KEINE materielle Rechtsregel (§2 Determinismus; §4: geteilte
// fachneutrale Schicht, kein Recht). Welche Regel für welches Verfahren in
// welchem Kanton gilt, deklariert die Datenschicht je Kanton (B-P1) — dieses
// Modul rechnet nur aus, was man ihm gibt.
//
// Bandgrenzen-Semantik ist EXPLIZIT typisiert (§1: lieber zwei klare Typen als
// eine Abstraktion, die einen Frankenbetrag um einen Rappen verschiebt):
//  · staffel_inklusiv  – Obergrenze gehört noch zum Band (wert <= bisChf);
//    das ist die in gebvKosten.ts bewährte Form (Charakterisierungs-Test in
//    tarifStaffel.test.ts reproduziert sie → spätere Ablösung byte-gleich).
//  · staffel_exklusiv  – Obergrenze ist erste Zahl des Folgebandes
//    (wert <  bisChf); für Tarife in der Schreibweise «1001–10 000».
//
// Ermessens-/extern bestimmte Tarife liefern KEINEN erfundenen Punktwert
// (§2/§8): `rahmen`/`formel_extern` tragen das Betrags-Feld typseitig gar nicht
// — die diskriminierte Ergebnis-Union zwingt die UI, den Rahmen/Hinweis
// auszuweisen statt eine Scheinzahl anzuzeigen.

import { chfBedingt, chfGanz, chfOhnePraefix } from '../format';

/** Ein Band einer flachen Bracket-Staffel: bis zur Grenze gilt der Festbetrag.
 *  Das letzte Band MUSS `bisChf: Infinity` tragen (Bereich lückenlos decken). */
export interface StaffelBand {
  bisChf: number;
  chf: number;
}

/** Ein Band einer Rahmen-Staffel: bis zur Streitwert-Grenze gilt der
 *  Gebühren-RAHMEN [minChf, maxChf] (Festsetzung im Ermessen der Behörde nach
 *  ihren Kriterien — KEIN Punktwert, §2/§8). Häufigster Schweizer Tarif-Typ
 *  (z. B. BS § 5 GGR, BL, SO, BE, GE, SG). Letztes Band `grenzeChf: Infinity`. */
interface RahmenBand {
  grenzeChf: number;
  /** Feste Untergrenze des Gebührenrahmens. `null`/weglassen, wenn keine
   *  Untergrenze gilt (z. B. Bemessung nach Zeitaufwand) oder eine
   *  prozentuale Untergrenze (`minProzent`) zu verwenden ist. */
  minChf?: number | null;
  /** Feste Obergrenze des Gebührenrahmens. */
  maxChf?: number | null;
  /** Alternativ: Unter-/Obergrenze als Prozentsatz des Streitwerts (häufig im
   *  obersten Band, «über X Mio: a–b % des Streitwerts»; ganze TI-Skala). */
  minProzent?: number;
  maxProzent?: number;
  /** Bei prozentualer Bemessung: harter Sockel-/Deckelbetrag (CHF). */
  mindestChf?: number;
  hoechstChf?: number;
  hinweis?: string;
  /** Opt-in (RL-27): Richtpunkt. Ist gesetzt und der Band-Rahmen beidseitig
   *  bezifferbar, interpoliert das Ergebnis den Streitwert linear zwischen der
   *  unteren Bandgrenze (Streitwert) und `grenzeChf` auf den Rahmen und weist
   *  das Ergebnis als `richtpunktChf` aus (Rappen). Der Rahmen bleibt Spanne,
   *  der Richtpunkt ist KEIN Punktwert (§8). Untere Bandgrenze: `vonGrenzeChf`,
   *  sonst `grenzeChf` des Vorbands; ohne beides, oder bei `grenzeChf: Infinity`,
   *  ist die Regel fehlerhaft deklariert (RangeError). */
  interpoliert?: true;
  vonGrenzeChf?: number;
}

/** Rundung auf ein Vielfaches von `schrittChf` (RL-27, Opt-in). `naechste`
 *  rundet einen Gleichstand (genau halber Schritt) auf. */
export interface Rundung {
  schrittChf: number;
  richtung: 'auf' | 'ab' | 'naechste';
}

/** Regel-weite Rundungs-Optionen (RL-27, Opt-in; fehlen sie, gilt das Verhalten
 *  vor RL-27 unverändert). `basisRundung` wirkt auf den Bemessungswert VOR der
 *  Bandwahl, `ergebnisRundung` NACH Mindest-/Höchstbetrag auf das Ergebnis
 *  (bei Spannen auf beide Grenzen und den Richtpunkt). */
export interface RundungsOptionen {
  basisRundung?: Rundung;
  ergebnisRundung?: Rundung;
}

/** Streitwertabhängiger Faktor auf einen Gebührenrahmen (RL-27, Opt-in), z. B.
 *  SG/AR/AI «Faktor 2 über CHF 50'000, … je weitere CHF 250'000 plus 1».
 *  Faktor = `faktor` der höchsten Stufe mit Streitwert STRIKT über `ueberChf`
 *  (unterhalb der ersten Stufe: 1). Mit `jeWeitereChf` kommt über der letzten
 *  Stufe je weitere Tranche `plusFaktor` dazu; ob eine angefangene Tranche
 *  zählt, bestimmt `stufenZaehlung` und ist in den Daten ausdrücklich zu
 *  wählen (die Primitive entscheidet diese Fachfrage nicht). `seite` 'bis'
 *  skaliert nur die Obergrenze (Untergrenze konstant), 'beide' beide Grenzen.
 *  `hoechstChf` deckelt die skalierte Grenze. */
export type StreitwertFaktor = {
  stufen: { ueberChf: number; faktor: number }[];
  hoechstChf?: number;
  seite: 'bis' | 'beide';
} & (
  | { jeWeitereChf?: undefined; plusFaktor?: undefined; stufenZaehlung?: undefined }
  | { jeWeitereChf: number; plusFaktor: number; stufenZaehlung: 'angefangen' | 'voll' }
);

/** Ein Band einer mehrbandigen Sockel+Prozent-Staffel: bis zur Grenze gilt
 *  `sockelChf + prozent% × (wert − abChf)`. Der Sockel kumuliert die unteren
 *  Bänder, der Prozentsatz wirkt nur auf den Überschuss über `abChf`.
 *  (Deterministische Grundgebühr, z. B. ZH § 4 Abs. 1 GebV OG.) */
export interface SockelProzentBand {
  bisChf: number;
  sockelChf: number;
  abChf: number;
  prozent: number;
  minChf?: number;
  /** Höchstbetrag des Bandes (Deckel), z. B. NE >1 Mio: 4 %, max CHF 300'000. */
  maxChf?: number;
  /** §8 ehrliche Spanne, Variante (a) «Rahmen unter der Schwelle»: Unterhalb von
   *  `abChf` ist die Grundgebühr ein behördlicher Ermessens-RAHMEN
   *  [minChf, sockelChf] statt des Punktwerts sockelChf; an UND über der Schwelle
   *  deterministisch (der Rahmen «kollabiert» auf sockelChf, zzgl. Marginal).
   *  Strikt «basisChf < abChf» → an der Schwelle selbst deterministisch. Z. B. BS
   *  Notariatstarif Ziff. 33 lit. a: Kapital < CHF 100'000 → Rahmen 750–2000, ab
   *  CHF 100'000 fix 2000 + marginaler Zuschlag. */
  unterAbRahmen?: boolean;
}

/** Ein Band einer Fix+Prozent-vom-Gesamtwert-Staffel: bis zur Grenze gilt
 *  `fixChf + prozent% × wert` (Prozent auf den GESAMTEN Streitwert, nicht den
 *  Überschuss). (Deterministisch, z. B. AG § 7 Abs. 1 GebührD.) Optionaler
 *  Mindest-/Höchstbetrag JE BAND (Schwellensatz-Tarife mit Stufen-Minima, z. B.
 *  UR Notariatstarif A, TI LTORF Art. 11/13). */
interface VollProzentBand {
  bisChf: number;
  fixChf: number;
  prozent: number;
  minChf?: number;
  maxChf?: number;
}

export type TarifRegel =
  | { typ: 'fix'; chf: number }
  /** Sockelbetrag + Prozentsatz auf den Überschuss über eine Schwelle,
   *  optional gedeckelt/mit Mindestbetrag. Z. B. «CHF 3'150 + 8 % über
   *  CHF 20'000». `abChf`/`sockelChf` default 0. */
  | ({ typ: 'sockel_prozent'; prozent: number; abChf?: number; sockelChf?: number; minChf?: number; maxChf?: number } & RundungsOptionen)
  /** Promille des Bemessungswerts, optional gedeckelt/mit Mindestbetrag. */
  | ({ typ: 'promille'; promille: number; minChf?: number; maxChf?: number } & RundungsOptionen)
  | ({ typ: 'staffel_inklusiv'; baender: StaffelBand[] } & RundungsOptionen)
  | ({ typ: 'staffel_exklusiv'; baender: StaffelBand[] } & RundungsOptionen)
  /** Mehrbandige Sockel+Prozent-Tabelle (deterministische Grundgebühr). */
  /** Mehrbandige Sockel+Prozent-Tabelle. Optionaler regel-weiter ERMESSENS-
   *  AUFSCHLAG (§8): liegt eine behördliche Ermessens-Spanne über dem ganzen
   *  Tarif (z. B. Grundgebühren-Rahmen, dessen Untergrenze als sockelChf kodiert
   *  ist, oder eine additive Rahmen-Komponente wie NW § 40), so wird das Ergebnis
   *  zur Spanne [Betrag + aufschlagVonChf, Betrag + aufschlagBisChf] (aufschlagVon
   *  default 0). Beispiele: GE Art. 25 (Basis 500–2000 → aufBis 1500), VD Art. 26
   *  (200–2000 → 1800), OW Art. 10 (500–1800 → 1300), NW § 37/§ 40 (aufVon 300,
   *  aufBis 2000), BS Stiftung (400–2000 → aufBis 1600). */
  | ({ typ: 'staffel_sockel_prozent'; baender: SockelProzentBand[]; aufschlagVonChf?: number; aufschlagBisChf?: number } & RundungsOptionen)
  /** Fix + Prozent vom Gesamtwert je Band (deterministisch). */
  | ({ typ: 'staffel_voll_prozent'; baender: VollProzentBand[] } & RundungsOptionen)
  /** Bracket-Staffel, deren Bänder einen Gebühren-RAHMEN statt eines
   *  Punktwerts tragen (deterministische Band-Wahl, ehrliche Spanne). */
  | ({ typ: 'staffel_rahmen'; baender: RahmenBand[]; streitwertFaktor?: StreitwertFaktor } & RundungsOptionen)
  /** Behördlicher Rahmen ohne deterministischen Punktwert. Mit `streitwertFaktor`
   *  (RL-27, Opt-in) wird der Rahmen nach dem Bemessungswert skaliert; dann ist
   *  der Bemessungswert Pflicht (RangeError bei ungültigem Wert). */
  | ({ typ: 'rahmen'; vonChf: number; bisChf: number; hinweis?: string; streitwertFaktor?: StreitwertFaktor } & RundungsOptionen)
  /** Summe mehrerer Teilregeln mit Etikett (RL-27, Opt-in), z. B. Gebühr nach
   *  zwei Normen. Alle Teile beziffert: Betrag = Summe, dann Mindest-/Höchstbetrag
   *  der Summe. Ein Teil als Spanne: Spanne (Σ von, Σ bis). Ein Teil ohne
   *  Ober- bzw. Untergrenze (z. B. `formel_extern`): keine Scheinzahl für die
   *  betroffene Seite (§8). Deckel je Teil: in der Teilregel selbst. */
  | ({ typ: 'summe'; teile: { etikett: string; regel: TarifRegel }[]; minChf?: number; maxChf?: number } & Pick<RundungsOptionen, 'ergebnisRundung'>)
  /** Tarif hängt von extern bestimmten Faktoren ab (nicht berechenbar). */
  | { typ: 'formel_extern'; hinweis: string };

export type TarifErgebnis =
  | { deterministisch: true; betragChf: number; schritte: string[] }
  | { deterministisch: false; vonChf?: number; bisChf?: number; hinweis: string;
      /** Nur bei Bändern mit `interpoliert` und bei Summen daraus (RL-27). */
      richtpunktChf?: number };

const round2 = (x: number) => Math.round(x * 100) / 100;
// Gebühren werden ganzzahlig dargestellt (Frankenbeträge; Bug-Check 14.6.2026).
// Geteilte Formatter-Heimat (lib/format, H-9) statt Lokal-Duplikat — byte-gleich.
const chf = chfGanz;

const pruefeBasis = (basisChf: number): void => {
  if (!Number.isFinite(basisChf) || basisChf < 0) {
    throw new RangeError(`Bemessungswert muss eine Zahl ≥ 0 sein (erhalten: ${basisChf}).`);
  }
};

/** Mindest-/Höchstbetrag anwenden; protokolliert die wirksame Klammer. */
const klammere = (roh: number, minChf: number | undefined, maxChf: number | undefined, schritte: string[]): number => {
  if (typeof minChf === 'number' && typeof maxChf === 'number' && minChf > maxChf) {
    throw new RangeError(`Bandgrenzen widersprüchlich: minChf ${minChf} > maxChf ${maxChf}.`);
  }
  let betrag = roh;
  if (typeof maxChf === 'number' && betrag > maxChf) {
    betrag = maxChf;
    schritte.push(`Höchstgebühr ${chf(maxChf)} → ${chf(betrag)}`);
  }
  if (typeof minChf === 'number' && betrag < minChf) {
    betrag = minChf;
    schritte.push(`Mindestgebühr ${chf(minChf)} → ${chf(betrag)}`);
  }
  return betrag;
};

const ausStaffel = (baender: StaffelBand[], basisChf: number, inklusiv: boolean): TarifErgebnis => {
  const treffer = baender.find((b) => (inklusiv ? basisChf <= b.bisChf : basisChf < b.bisChf));
  if (!treffer) {
    throw new RangeError(`Staffel deckt den Bemessungswert ${chf(basisChf)} nicht (letztes Band braucht bisChf: Infinity).`);
  }
  const grenze = Number.isFinite(treffer.bisChf)
    ? `${inklusiv ? 'bis und mit' : 'unter'} ${chf(treffer.bisChf)}`
    : 'oberstes Band';
  return { deterministisch: true, betragChf: round2(treffer.chf), schritte: [`Band ${grenze}: ${chf(treffer.chf)}`] };
};

// ─── RL-27: Rundung, Streitwertfaktor, Satz-Helfer (alles Opt-in) ───────────

/** Toleranz gegen Gleitkomma-Rauschen: ein Quotient, der um höchstens dies von
 *  einer ganzen Zahl abweicht, gilt als exaktes Vielfaches (idempotent). Rappen-
 *  genaue Eingaben liegen bei Schritten bis 10 Mio weit ausserhalb (≥ 1e-9). */
const VIELFACHES_TOL = 1e-9;

const pruefeRundung = (r: Rundung, was: string): void => {
  if (!Number.isFinite(r.schrittChf) || r.schrittChf <= 0) {
    throw new RangeError(`${was}: schrittChf muss eine Zahl > 0 sein (erhalten: ${r.schrittChf}).`);
  }
};

/** Rundet auf ein Vielfaches von `schrittChf`; `vorRappen` rundet vorher auf
 *  Rappen (Ergebnisse: sonst kippt 1610 durch 1609.9999999999998 auf 1600). */
const runde = (x: number, r: Rundung, vorRappen: boolean): number => {
  const q = (vorRappen ? round2(x) : x) / r.schrittChf;
  const nah = Math.round(q);
  let n: number;
  if (Math.abs(q - nah) <= VIELFACHES_TOL) n = nah;
  else if (r.richtung === 'auf') n = Math.ceil(q);
  else if (r.richtung === 'ab') n = Math.floor(q);
  else n = Math.round(q);
  return round2(n * r.schrittChf);
};

const rundungWort = (r: Rundung): string =>
  r.richtung === 'auf' ? 'aufgerundet' : r.richtung === 'ab' ? 'abgerundet' : 'gerundet';

/** Hängt einen ganzen Satz an einen Hinweis (setzt den Schlusspunkt, falls er fehlt). */
const mitSatz = (hinweis: string, satz: string): string => {
  const h = /[.!?]$/.test(hinweis.trimEnd()) ? hinweis.trimEnd() : `${hinweis.trimEnd()}.`;
  return `${h} ${satz}`;
};

/** Faktor der Streitwert-Stufung für den Bemessungswert (siehe `StreitwertFaktor`). */
const faktorFuer = (f: StreitwertFaktor, basisChf: number): number => {
  if (f.stufen.length === 0) throw new RangeError('streitwertFaktor: mindestens eine Stufe nötig.');
  for (const st of f.stufen) {
    if (!Number.isFinite(st.ueberChf) || !Number.isFinite(st.faktor) || st.faktor <= 0) {
      throw new RangeError(`streitwertFaktor: Stufe über ${st.ueberChf} mit Faktor ${st.faktor} ist ungültig.`);
    }
  }
  const stufen = [...f.stufen].sort((a, b) => a.ueberChf - b.ueberChf);
  let faktor = 1;
  let letzte: (typeof stufen)[number] | undefined;
  for (const st of stufen) {
    if (basisChf > st.ueberChf) {
      faktor = st.faktor;
      letzte = st;
    }
  }
  if (f.jeWeitereChf !== undefined) {
    if (!Number.isFinite(f.jeWeitereChf) || f.jeWeitereChf <= 0 || !Number.isFinite(f.plusFaktor)) {
      throw new RangeError('streitwertFaktor: jeWeitereChf muss > 0 und plusFaktor eine Zahl sein.');
    }
    if (letzte === stufen[stufen.length - 1] && letzte !== undefined) {
      const t = (basisChf - letzte.ueberChf) / f.jeWeitereChf;
      const n = f.stufenZaehlung === 'angefangen' ? Math.ceil(t - VIELFACHES_TOL) : Math.floor(t + VIELFACHES_TOL);
      faktor += n * f.plusFaktor;
    }
  }
  return faktor;
};

/** Skaliert die Grenzen eines Rahmens mit dem Streitwertfaktor. Untergrenze nur
 *  bei `seite: 'beide'`; `hoechstChf` deckelt. Liefert zusätzlich den Hinweis-Satz. */
const wendeFaktorAn = (
  von: number | undefined,
  bis: number | undefined,
  f: StreitwertFaktor,
  basisChf: number,
): { von: number | undefined; bis: number | undefined; satz: string | undefined } => {
  const faktor = faktorFuer(f, basisChf);
  const skal = (x: number): number => {
    const v = round2(x * faktor);
    return f.hoechstChf !== undefined ? Math.min(v, f.hoechstChf) : v;
  };
  const neuBis = bis !== undefined ? skal(bis) : undefined;
  const neuVon = f.seite === 'beide' && von !== undefined ? skal(von) : von;
  if (neuBis === undefined) return { von: neuVon, bis: neuBis, satz: undefined };
  const gedeckelt = f.hoechstChf !== undefined && round2((bis as number) * faktor) > f.hoechstChf;
  const deckel = gedeckelt ? ` (Höchstgrenze ${chfBedingt(f.hoechstChf as number)})` : '';
  const satz = f.seite === 'beide' && neuVon !== undefined
    ? `Mit Streitwertfaktor ${faktor} beträgt der Gebührenrahmen ${chfBedingt(neuVon)}–${chfBedingt(neuBis)}${deckel}.`
    : `Mit Streitwertfaktor ${faktor} beträgt die Obergrenze ${chfBedingt(neuBis)}${deckel}.`;
  return { von: neuVon, bis: neuBis, satz };
};

/** Fasst Teilergebnisse einer `summe` zusammen (siehe Typ-Doku). */
const ausSumme = (regel: Extract<TarifRegel, { typ: 'summe' }>, basisChf: number): TarifErgebnis => {
  if (regel.teile.length === 0) throw new RangeError('Summe braucht mindestens einen Teil.');
  const erg = regel.teile.map((t) => ({ etikett: t.etikett, e: auswertenTarif(t.regel, basisChf) }));

  if (erg.every((x) => x.e.deterministisch)) {
    const schritte: string[] = [];
    let summe = 0;
    for (const x of erg) {
      if (!x.e.deterministisch) continue;
      for (const st of x.e.schritte) schritte.push(`${x.etikett}: ${st}`);
      schritte.push(`${x.etikett}: Teilbetrag ${chfBedingt(x.e.betragChf)}`);
      summe = round2(summe + x.e.betragChf);
    }
    schritte.push(`Summe der Teile: ${chfBedingt(summe)}`);
    return { deterministisch: true, betragChf: klammere(summe, regel.minChf, regel.maxChf, schritte), schritte };
  }

  const seitenSumme = (wahl: (e: TarifErgebnis) => number | undefined): number | undefined => {
    let acc = 0;
    for (const x of erg) {
      const v = wahl(x.e);
      if (v === undefined) return undefined;
      acc = round2(acc + v);
    }
    return acc;
  };
  let von = seitenSumme((e) => (e.deterministisch ? e.betragChf : e.vonChf));
  let bis = seitenSumme((e) => (e.deterministisch ? e.betragChf : e.bisChf));
  let richt = von !== undefined && bis !== undefined
    ? seitenSumme((e) => (e.deterministisch ? e.betragChf : e.richtpunktChf))
    : undefined;

  const etiketten = erg.map((x) => x.etikett).join(', ');
  const unbeziffert = erg.filter((x) => !x.e.deterministisch && x.e.vonChf === undefined && x.e.bisChf === undefined);
  if (von === undefined && bis === undefined) {
    const gruende = unbeziffert.map((x) => (x.e.deterministisch ? '' : `${x.etikett}: ${x.e.hinweis}`)).join(' | ');
    return {
      deterministisch: false,
      hinweis: mitSatz(`Summe aus ${etiketten} nicht beziffert, weil mindestens ein Teil nicht beziffert ist (${gruende})`, 'Eine Gesamtsumme wird nicht ausgewiesen.'),
    };
  }

  // Mindest-/Höchstbetrag der Summe auf jede ausgewiesene Grenze.
  let geklammert = false;
  const klemme = (x: number | undefined): number | undefined => {
    if (x === undefined) return undefined;
    const k = klammere(x, regel.minChf, regel.maxChf, []);
    if (k !== x) geklammert = true;
    return k;
  };
  von = klemme(von);
  bis = klemme(bis);
  richt = klemme(richt);

  const spanne = von !== undefined && bis !== undefined ? `${chfBedingt(von)}–${chfBedingt(bis)}`
    : bis !== undefined ? `bis ${chfBedingt(bis)}`
    : `ab ${chfBedingt(von as number)}`;
  let hinweis = `Summe aus ${etiketten}: Gebührenrahmen ${spanne}; Festsetzung der Rahmen-Teile im Ermessen der Behörde.`;
  if (unbeziffert.length > 0) hinweis = mitSatz(hinweis, `Nicht beziffert: ${unbeziffert.map((x) => x.etikett).join(', ')}.`);
  if (geklammert) hinweis = mitSatz(hinweis, 'Mindest- bzw. Höchstbetrag der Summe angewandt.');
  if (richt !== undefined) hinweis = mitSatz(hinweis, `Richtpunkt der Summe: ${chfBedingt(richt)}.`);
  const out: TarifErgebnis = { deterministisch: false, vonChf: von, bisChf: bis, hinweis };
  if (richt !== undefined) out.richtpunktChf = richt;
  return out;
};

/** Skaliert ein Tarif-Ergebnis mit einer Faktor-SPANNE (z. B. summarisches
 *  Verfahren ½–¾, Rechtsmittelinstanz, Schlichtungs-Bruchteil). Ergebnis wird
 *  zur Spanne (vonChf×faktorMin … bisChf×faktorMax); ein deterministischer
 *  Betrag wird zur Spanne. Faktor [1,1] lässt das Ergebnis unverändert. Nicht
 *  bezifferte Ergebnisse (formel_extern) bleiben unverändert. */
export function skaliereErgebnis(e: TarifErgebnis, faktorMin: number, faktorMax: number, hinweis: string): TarifErgebnis {
  if (faktorMin === 1 && faktorMax === 1) return e;
  if (e.deterministisch) {
    return { deterministisch: false, vonChf: Math.round(e.betragChf * faktorMin), bisChf: Math.round(e.betragChf * faktorMax), hinweis };
  }
  const von = typeof e.vonChf === 'number' ? Math.round(e.vonChf * faktorMin) : undefined;
  const bis = typeof e.bisChf === 'number' ? Math.round(e.bisChf * faktorMax) : undefined;
  if (von === undefined && bis === undefined) return e;
  return { deterministisch: false, vonChf: von, bisChf: bis, hinweis: `${e.hinweis} · ${hinweis}` };
}

/** Kern-Auswertung ohne regel-weite Rundung (siehe `auswertenTarif`). */
function werteAus(regel: TarifRegel, basisChf: number): TarifErgebnis {
  switch (regel.typ) {
    case 'fix':
      return { deterministisch: true, betragChf: round2(regel.chf), schritte: [`Fixgebühr ${chf(regel.chf)}`] };

    case 'sockel_prozent': {
      pruefeBasis(basisChf);
      const ab = regel.abChf ?? 0;
      const sockel = regel.sockelChf ?? 0;
      const ueberschuss = Math.max(0, basisChf - ab);
      const schritte: string[] = [];
      if (sockel > 0) schritte.push(`Sockel ${chf(sockel)}`);
      schritte.push(`${regel.prozent} % auf ${chf(ueberschuss)}${ab > 0 ? ` (Überschuss über ${chf(ab)})` : ''} = ${chf(ueberschuss * regel.prozent / 100)}`);
      const roh = round2(sockel + (ueberschuss * regel.prozent) / 100);
      return { deterministisch: true, betragChf: klammere(roh, regel.minChf, regel.maxChf, schritte), schritte };
    }

    case 'promille': {
      pruefeBasis(basisChf);
      const schritte = [`${regel.promille} ‰ von ${chf(basisChf)} = ${chf((basisChf * regel.promille) / 1000)}`];
      const roh = round2((basisChf * regel.promille) / 1000);
      return { deterministisch: true, betragChf: klammere(roh, regel.minChf, regel.maxChf, schritte), schritte };
    }

    case 'staffel_inklusiv':
      pruefeBasis(basisChf);
      return ausStaffel(regel.baender, basisChf, true);

    case 'staffel_exklusiv':
      pruefeBasis(basisChf);
      return ausStaffel(regel.baender, basisChf, false);

    case 'staffel_sockel_prozent': {
      pruefeBasis(basisChf);
      const b = regel.baender.find((x) => basisChf <= x.bisChf);
      if (!b) throw new RangeError(`Sockel-Prozent-Staffel deckt ${chf(basisChf)} nicht (letztes Band braucht bisChf: Infinity).`);
      const ueberschuss = Math.max(0, basisChf - b.abChf);

      // (a) Rahmen unter der Schwelle: ehrliche Spanne [minChf, sockelChf] statt
      // des erfundenen Punktwerts sockelChf (§8). Nur strikt unterhalb abChf.
      if (b.unterAbRahmen && basisChf < b.abChf && b.minChf != null) {
        return {
          deterministisch: false,
          vonChf: round2(b.minChf),
          bisChf: round2(b.sockelChf),
          hinweis: `Gebührenrahmen ${chf(b.minChf)}–${chf(b.sockelChf)} (Geschäftswert unter ${chf(b.abChf)}); Festsetzung im Ermessen der Behörde.`,
        };
      }

      const schritte: string[] = [];
      if (b.sockelChf > 0) schritte.push(`Sockel ${chf(b.sockelChf)}`);
      schritte.push(`${b.prozent} % auf ${chf(ueberschuss)}${b.abChf > 0 ? ` (Überschuss über ${chf(b.abChf)})` : ''} = ${chf((ueberschuss * b.prozent) / 100)}`);
      const roh = round2(b.sockelChf + (ueberschuss * b.prozent) / 100);
      const det = klammere(roh, b.minChf, b.maxChf, schritte);

      // (b) Regel-weiter Ermessens-Aufschlag: über dem deterministischen Betrag
      // liegt ein behördlicher Rahmen → ehrliche Spanne [det + von, det + bis] (§8).
      if (regel.aufschlagBisChf != null) {
        const von = round2(det + (regel.aufschlagVonChf ?? 0));
        const bis = round2(det + regel.aufschlagBisChf);
        const zusatz = ueberschuss > 0 ? ` (deterministischer Wertanteil ${chf(det)})` : '';
        return {
          deterministisch: false,
          vonChf: von,
          bisChf: bis,
          hinweis: `Gebührenrahmen ${chf(von)}–${chf(bis)}${zusatz}; Festsetzung im Ermessen der Behörde.`,
        };
      }

      return { deterministisch: true, betragChf: det, schritte };
    }

    case 'staffel_voll_prozent': {
      pruefeBasis(basisChf);
      const b = regel.baender.find((x) => basisChf <= x.bisChf);
      if (!b) throw new RangeError(`Voll-Prozent-Staffel deckt ${chf(basisChf)} nicht (letztes Band braucht bisChf: Infinity).`);
      const schritte = [`Fix ${chf(b.fixChf)} + ${b.prozent} % von ${chf(basisChf)} = ${chf(b.fixChf + (basisChf * b.prozent) / 100)}`];
      const roh = round2(b.fixChf + (basisChf * b.prozent) / 100);
      return { deterministisch: true, betragChf: klammere(roh, b.minChf, b.maxChf, schritte), schritte };
    }

    case 'staffel_rahmen': {
      pruefeBasis(basisChf);
      const b = regel.baender.find((x) => basisChf <= x.grenzeChf);
      if (!b) {
        throw new RangeError(`Rahmen-Staffel deckt den Bemessungswert ${chf(basisChf)} nicht (letztes Band braucht grenzeChf: Infinity).`);
      }
      // Grenze fest (minChf/maxChf) ODER prozentual (minProzent/maxProzent ×
      // Streitwert, optional mit Sockel/Deckel). `null`/undefined = keine Grenze.
      const seite = (fest: number | null | undefined, pct: number | undefined): number | undefined => {
        if (fest != null) return fest;
        if (pct == null) return undefined;
        let v = Math.round((basisChf * pct) / 100);
        if (b.mindestChf != null) v = Math.max(v, b.mindestChf);
        if (b.hoechstChf != null) v = Math.min(v, b.hoechstChf);
        return v;
      };
      let von = seite(b.minChf, b.minProzent);
      let bis = seite(b.maxChf, b.maxProzent);
      // RL-27 (Opt-in): Streitwertfaktor auf die Grenzen des gewählten Bands.
      let faktorSatz: string | undefined;
      if (regel.streitwertFaktor) {
        const skaliert = wendeFaktorAn(von, bis, regel.streitwertFaktor, basisChf);
        von = skaliert.von;
        bis = skaliert.bis;
        faktorSatz = skaliert.satz;
      }
      const grenze = Number.isFinite(b.grenzeChf) ? `bis und mit ${chf(b.grenzeChf)}` : 'oberstes Band';
      const spanne = von != null && bis != null ? `${chf(von)}–${chf(bis)}`
        : bis != null ? `bis ${chf(bis)}`
        : von != null ? `ab ${chf(von)}`
        : 'nach Aufwand';
      // %-Hinweis nur für tatsächlich prozentual bestimmte Seiten (kein irreführendes «0 %»).
      const pctNote = (b.minProzent != null && b.maxProzent != null) ? ` (${b.minProzent}–${b.maxProzent} % des Streitwerts)`
        : b.maxProzent != null ? ` (bis ${b.maxProzent} % des Streitwerts)`
        : b.minProzent != null ? ` (ab ${b.minProzent} % des Streitwerts)`
        : '';
      let hinweis = b.hinweis ?? `Gebührenrahmen ${spanne}${pctNote} (Streitwert-Band ${grenze}); Festsetzung im Ermessen der Behörde.`;
      if (faktorSatz) hinweis = mitSatz(hinweis, faktorSatz);

      // RL-27 (Opt-in): interpolierter Richtpunkt innerhalb des Band-Rahmens.
      let richtpunkt: number | undefined;
      if (b.interpoliert) {
        const idx = regel.baender.indexOf(b);
        const unten = b.vonGrenzeChf ?? (idx > 0 ? regel.baender[idx - 1].grenzeChf : undefined);
        if (unten === undefined || !Number.isFinite(b.grenzeChf) || !(b.grenzeChf > unten)) {
          throw new RangeError(`Rahmen-Band bis ${b.grenzeChf} kann nicht interpoliert werden (untere Grenze ${unten}, obere Grenze muss endlich und grösser sein).`);
        }
        if (von != null && bis != null) {
          const t = Math.min(1, Math.max(0, (basisChf - unten) / (b.grenzeChf - unten)));
          richtpunkt = round2(von + t * (bis - von));
          hinweis = mitSatz(hinweis, `Richtpunkt nach Streitwert interpoliert: ${chfBedingt(richtpunkt)}; die Festsetzung im Rahmen bleibt der Behörde vorbehalten.`);
        }
      }
      const ergebnis: TarifErgebnis = { deterministisch: false, vonChf: von, bisChf: bis, hinweis };
      if (richtpunkt !== undefined) ergebnis.richtpunktChf = richtpunkt;
      return ergebnis;
    }

    case 'rahmen': {
      if (!regel.streitwertFaktor) {
        return { deterministisch: false, vonChf: regel.vonChf, bisChf: regel.bisChf, hinweis: regel.hinweis ?? 'Behördlicher Gebührenrahmen – kein fester Punktwert.' };
      }
      // RL-27 (Opt-in): Rahmen nach Streitwert skalieren; Bemessungswert Pflicht.
      pruefeBasis(basisChf);
      const skaliert = wendeFaktorAn(regel.vonChf, regel.bisChf, regel.streitwertFaktor, basisChf);
      const basisHinweis = regel.hinweis ?? 'Behördlicher Gebührenrahmen – kein fester Punktwert.';
      return {
        deterministisch: false,
        vonChf: skaliert.von,
        bisChf: skaliert.bis,
        hinweis: skaliert.satz ? mitSatz(basisHinweis, skaliert.satz) : basisHinweis,
      };
    }

    case 'summe':
      return ausSumme(regel, basisChf);

    case 'formel_extern':
      return { deterministisch: false, hinweis: regel.hinweis };
  }
}

/** Wertet eine Tarifregel über den Bemessungswert aus. Deterministisch für
 *  fix/sockel_prozent/promille/staffel_*; ehrlicher Rahmen/Hinweis für
 *  rahmen/formel_extern. Opt-in (RL-27): `basisRundung` rundet den Bemessungs-
 *  wert VOR der Bandwahl, `ergebnisRundung` das Ergebnis NACH Mindest-/Höchst-
 *  betrag. Ohne diese Felder läuft ausschliesslich der unveränderte Kern. */
export function auswertenTarif(regel: TarifRegel, basisChf: number): TarifErgebnis {
  const opt = regel as Partial<RundungsOptionen>;
  const br = opt.basisRundung;
  const er = opt.ergebnisRundung;
  if (!br && !er) return werteAus(regel, basisChf);

  let basis = basisChf;
  let basisSatz: string | undefined;
  if (br) {
    pruefeRundung(br, 'basisRundung');
    pruefeBasis(basisChf);
    basis = runde(basisChf, br, false);
    basisSatz = `Bemessungsbasis auf ${chfBedingt(br.schrittChf)} ${rundungWort(br)}: ${chfOhnePraefix(basis)}.`;
  }
  const e = werteAus(regel, basis);
  let aus: TarifErgebnis = e;
  if (basisSatz) {
    aus = e.deterministisch
      ? { ...e, schritte: [basisSatz, ...e.schritte] }
      : { ...e, hinweis: mitSatz(e.hinweis, basisSatz) };
  }
  if (!er) return aus;

  pruefeRundung(er, 'ergebnisRundung');
  const wort = `auf ${chfBedingt(er.schrittChf)} ${rundungWort(er)}`;
  if (aus.deterministisch) {
    const betrag = runde(aus.betragChf, er, true);
    return { ...aus, betragChf: betrag, schritte: [...aus.schritte, `Ergebnis ${wort}: ${chfOhnePraefix(betrag)}.`] };
  }
  const rund = { ...aus, hinweis: mitSatz(aus.hinweis, `Grenzen ${wort}.`) };
  if (aus.vonChf !== undefined) rund.vonChf = runde(aus.vonChf, er, true);
  if (aus.bisChf !== undefined) rund.bisChf = runde(aus.bisChf, er, true);
  if (aus.richtpunktChf !== undefined) rund.richtpunktChf = runde(aus.richtpunktChf, er, true);
  return rund;
}
