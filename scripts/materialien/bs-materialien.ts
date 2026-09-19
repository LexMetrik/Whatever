// scripts/materialien/bs-materialien.ts
// K-16 (W2·13-KANTONE-DATEN): REINE Ableitung der Basel-Städter Materialien-Einträge
// aus den amtlichen Grossrats-Datensätzen. Kein Netz, kein Dateizugriff, kein Date.now —
// der Runner (`bs-materialien-run.ts`) holt und schreibt, dieses Modul rechnet (§2/§3,
// Repo-Muster soft-law-projektion / botschaften-generieren).
//
// WAS HIER ENTSTEHT: ein Register-Eintrag je Geschäft des Grossen Rates, das mit
// mindestens einem Erlass des BS-Korpus verknüpft werden KANN — mit der Verfahrenskette
// aus den amtlichen Dokumenten des Geschäfts. Die Einträge reihen sich über
// material-manifest.ts in public/materialien/register.json ein, wie die Botschaften des
// Bundes; sie verknüpfen über `normKeys` (kein Kanten-Shard, s. Vormessung §3).
//
// WAS HIER NICHT ENTSTEHT: keine Zuordnung ohne Beleg. Die drei Wege stehen in
// `KANTEN_REGELN`; jeder trägt seine Herkunft bis in die ausgelieferte Datei (`bsKanten`),
// zwei davon sind ausdrücklich maschinell (§8). Ein Geschäft ohne Kante kommt nicht ins
// Register — die 21 164 Geschäfte sind KEIN Inhaltsverzeichnis unserer App.
//
// Messgrundlage und Belege: bibliothek/materialien/2026-09-12-k16-bs-vormessung.md.

import type { VerfahrensEreignis } from '../../src/lib/materialien/verfahren.ts';
import { bsCodeVonBezeichnung } from '../../src/lib/materialien/verfahren.ts';
import type { DoktypId } from '../../src/lib/materialien/typen.ts';
import type { Rechtsgebiet } from '../../src/lib/normtext/register.ts';
import { kantonGebiet } from '../../src/lib/normtext/register.ts';
import type { BsGeschaeft, BsDokument } from './adapter-bs-grossrat.ts';

/** Code-Unit-Vergleich (ICU-frei, Dev↔CI-stabil) — wie in soft-law-projektion. */
export function cu(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

/**
 * Totale Ordnung der amtlichen BS-Dokumente vor der Roh-Ablage (Schreibstelle
 * `bs-materialien-run.ts`, §2 Determinismus). Bis 18.9.2026 endete die Ordnung bei
 * `titel_dok` — bei identischem Tupel (Geschäft, Dokudatum, Dok-Signatur, Titel)
 * entschied die arbiträre Reihenfolge des OpenDataSoft-Exports (kein `order_by`
 * dokumentiert, `adapter-bs-grossrat.ts` `exportUrl`) über die committete Ablage.
 * Beleg Automatik-PR #913 (18.9.2026): reiner Positionstausch zweier Einträge mit
 * identischem Tupel `04.8107`/«GR Beschluss»/2005-01-12 in
 * `bibliothek/materialien/bs-grossrat-raw/dokumente.json` — kein fachlicher Diff,
 * trotzdem ein PR. `url_dok` ist bei Duplikaten immer verschieden (eigene
 * PDF-Ablage je Dokument) und macht die Ordnung total, nach demselben Muster wie
 * `baueEreignisse` unten (dort bereits `res` als letzter Schlüssel).
 */
export function vergleicheBsDokumente(a: BsDokument, b: BsDokument): number {
  return cu(a.signatur_ges ?? '', b.signatur_ges ?? '') || cu(a.dokudatum ?? '', b.dokudatum ?? '')
    || cu(a.signatur_dok ?? '', b.signatur_dok ?? '') || cu(a.titel_dok ?? '', b.titel_dok ?? '')
    || cu(a.url_dok ?? '', b.url_dok ?? '');
}

// ── Grundmenge: die Geschäftsarten, die überhaupt Materialien sind ───────────
//
// `ga_rr_gr` ist ein amtliches Feld mit 32 Werten (gemessen). Aufgenommen werden nur
// die drei Vorlage-Arten — Ratschlag (das Botschafts-Pendant), Bericht und
// Ausgabenbericht. Vorstösse (Anzug, Interpellation, Motion, Schriftliche Anfrage …)
// sind KEINE Gesetzesmaterialien im hier gemeinten Sinn und tragen ausserdem als
// einzige Namen von Ratsmitgliedern im Titel (Vormessung §4).
export const GESCHAEFTSARTEN = ['Ratschlag', 'Bericht', 'Ausgabenbericht'] as const;

/**
 * Amtliche Geschäftsart (`ga_rr_gr`) → Doktyp. FESTE Tabelle, wie TYPE_PROJET in
 * verfahren.ts — und aus demselben Grund.
 *
 * BEFUND der Gegenprüfung zu PR #799 (12.9.2026): hier stand vorher eine binäre
 * Ableitung («Ratschlag» oder sonst «Bericht»). Geschäft 21.1247 ist amtlich eine
 * «Initiative» — die kantonale Volksinitiative «1% gegen globale Armut», die über
 * den amtlichen Fussnoten-Weg hereinkommt und darum NICHT der Artenliste oben
 * unterliegt. Sie erschien im Register als «Bericht an den Grossen Rat»: eine
 * Volksinitiative als Behördenvorlage etikettiert, also eine falsche Rechtsnatur
 * direkt in der Karte (§1/§8).
 *
 * Erfasst sind die drei Vorlage-Arten plus jede Art, die über den Fussnoten-Weg
 * belegt hereinkommt. Eine unbekannte Art wird NICHT geraten und NICHT eingereiht,
 * sondern macht den Generator rot (§2) — dann gehört sie mit ihrem amtlichen
 * Etikett in diese Tabelle und in DOKTYPEN, nicht in einen Sammeltopf.
 */
export const GESCHAEFTSART_DOKTYP: Readonly<Record<string, DoktypId>> = {
  Ratschlag: 'ratschlag',
  Bericht: 'gr-bericht',
  Ausgabenbericht: 'gr-ausgabenbericht',
  Initiative: 'gr-initiative',
};

/** Alle Doktypen, die ein BS-Eintrag tragen kann (Tor- und Testgrundmenge). */
export const DOKTYP_BS: ReadonlyArray<DoktypId> = [...new Set(Object.values(GESCHAEFTSART_DOKTYP))];

/** Amtliche Geschäftsart → Doktyp. Unbekannte Art ⇒ Fehler (§2: nie raten). */
export function doktypVonGeschaeftsart(art: string | null | undefined): DoktypId {
  const d = GESCHAEFTSART_DOKTYP[art ?? ''];
  if (!d) {
    throw new Error(
      `bs-materialien: unbekannte Geschäftsart '${art ?? ''}' — Zuwachs im amtlichen Feld ga_rr_gr. `
      + 'GESCHAEFTSART_DOKTYP in scripts/materialien/bs-materialien.ts und DOKTYPEN in '
      + 'src/lib/materialien/register.ts um die Art mit ihrer amtlichen Bezeichnung ergänzen '
      + '(nie in einen bestehenden Doktyp einsortieren, §1).',
    );
  }
  return d;
}

/** Stammdaten eines BS-Korpus-Erlasses, wie der Runner sie aus den committeten
 *  Struktur-Sidecars + den amtlichen Metadaten der Gesetzessammlung zusammenträgt. */
export interface BsErlassStamm {
  /** Korpus-Schlüssel, z. B. 'BS-640.100' oder 'BS-RiE 911.900'. */
  key: string;
  /** SG-Nummer ohne Präfix, z. B. '640.100' / 'RiE 911.900'. */
  sg: string;
  /** Titel aus dem Struktur-Sidecar (kopf.titel). */
  titel: string;
  /** kopf.erlassdatum, wörtlich: 'Vom 12. April 2000 (Stand 1. September 2025)'. */
  erlassdatum: string;
  /** Amtliche Stichwörter (keywords_de aus 100354), z. B. ['Steuergesetz','StG']. */
  stichworte: string[];
  /** Amtliche Kategorie (category_name aus 100354), z. B. 'Gesetz'. */
  kategorie: string;
  /** Geschäftsnummern, die die Fussnoten dieses Erlasses wörtlich nennen. */
  fussnotenGeschaefte: string[];
}

/** Eine belegte Verknüpfung Geschäft → Erlass. */
export interface BsKante {
  geschaeft: string;
  erlass: string;
  quelle: 'amtlich' | 'maschinell';
  regel: 'fussnote' | 'sg-nummer' | 'datum-titel';
  beleg: string;
}

/** Ein generierter Register-Eintrag (Feld-Namen = MaterialRegistereintrag-Teilmenge). */
export interface BsEintrag {
  key: string;
  behoerde: 'BS-GR';
  doktyp: DoktypId;
  titel: string;
  nummer: string;
  rechtsgebiet: Rechtsgebiet;
  sprache: 'de';
  status: 'nur-live-link';
  quelleUrl: string;
  stand: string;
  rang: number;
  normKeys: string[];
  hinweis: string;
  ereignisse: VerfahrensEreignis[];
  bsKanten: BsKante[];
}

/**
 * Feldnamen der Quelle, die niemals in einem unserer Artefakte auftauchen dürfen:
 * Namen, Vornamen, Anreden, Parteien und Mitglieder-Nummern der Urheberinnen und
 * Urheber von Vorstössen. Der Adapter holt sie gar nicht erst (Positivliste
 * `FELDER_GESCHAEFT`); diese Liste ist der zweite Zaun, den `check:bs-materialien`
 * und der Unit-Test gegen das Ergebnis ziehen.
 */
export const VERBOTENE_FELDER = [
  'name_urheber', 'vorname_urheber', 'name_vorname_urheber', 'anrede_urheber',
  'partei_kname_urheber', 'nr_urheber', 'url_urheber', 'url_urheber_ratsmitgl',
  'gremientyp_urheber',
  'name_miturheber', 'vorname_miturheber', 'name_vorname_miturheber', 'anrede_miturheber',
  'partei_kname_miturheber', 'nr_miturheber', 'url_miturheber', 'url_miturheber_ratsmitgl',
  'gremientyp_miturheber',
];

/** Titelform der Vorstösse («Anzug Bülent Pekerman und Konsorten betreffend …»).
 *  Ein Treffer im Bestand hiesse: ein Vorstoss ist hineingerutscht und trägt einen
 *  Personennamen im Titel. */
export const VORSTOSS_TITEL = /^(Anzug|Interpellation|Motion|Schriftliche Anfrage|Kleine Anfrage|Petition|Budgetpostulat|Planungsanzug|Resolution)\b/;

// ── Schritt 1: Muster je Erlass (deterministisch, ohne Scoring) ──────────────

const MONATE = [
  'januar', 'februar', 'märz', 'april', 'mai', 'juni',
  'juli', 'august', 'september', 'oktober', 'november', 'dezember',
];

/** Normalisiert einen Titel für den Textvergleich: Anführungszeichen weg, ein Leerzeichen,
 *  klein. KEINE Umlaut-Faltung — «über» und «uber» sind verschiedene Wörter (§1). */
export function normTitel(s: string | null | undefined): string {
  return (s ?? '').replace(/[«»"„“”]/g, ' ').replace(/\s+/g, ' ').trim().toLowerCase();
}

/** Gattungswort am Titelanfang (für den Titelrumpf «über die direkten Steuern»). */
const GATTUNG = /^(gesetz|verordnung|reglement|verfassung|dekret|ordnung|vereinbarung|vertrag|übereinkommen|konkordat|beschluss)\s+/;

/**
 * Wortfolge → Regex, die jedem Wort ein angehängtes `es`/`s`/`n` erlaubt.
 *
 * Das ist die einzige «Unschärfe» der Zuordnung und sie ist grammatikalisch, nicht
 * statistisch: der amtliche Geschäftstitel nennt den Erlass im Genitiv («Teilrevision
 * des **Lohngesetzes** vom 18. Januar 1995»), die Gesetzessammlung im Nominativ
 * («Lohngesetz»). Ohne diese Regel verlöre C+ knapp die Hälfte der echten Treffer;
 * mit ihr bleibt der Vergleich ein Wortgrenzen-Vergleich (CLAUDE.md §7), kein Substring.
 */
export function flexMuster(text: string): RegExp {
  const woerter = text
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => `${w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?:es|s|n)?`);
  return new RegExp(`\\b${woerter.join('\\s+')}\\b`);
}

/** Erlassdatum aus `kopf.erlassdatum` («Vom 12. April 2000 (Stand …)») → ISO-Tripel. */
export function erlassDatum(erlassdatum: string): { tag: number; monat: string; jahr: string } | null {
  const m = /^Vom\s+(\d{1,2})\.\s+([A-Za-zäöüÄÖÜ]+)\s+(\d{4})/.exec(erlassdatum);
  if (!m) return null;
  const monat = m[2].toLowerCase();
  if (!MONATE.includes(monat)) return null;
  return { tag: Number(m[1]), monat, jahr: m[3] };
}

/** Alle «vom TT. Monat JJJJ»-Angaben eines Geschäftstitels (normalisiert). */
export function datumsAngaben(titelNorm: string): Array<{ tag: number; monat: string; jahr: string }> {
  const treffer: Array<{ tag: number; monat: string; jahr: string }> = [];
  const re = /vom (\d{1,2})\.\s*([a-zäöü]+)\s*(\d{4})/g;
  for (let m = re.exec(titelNorm); m; m = re.exec(titelNorm)) {
    if (MONATE.includes(m[2])) treffer.push({ tag: Number(m[1]), monat: m[2], jahr: m[3] });
  }
  return treffer;
}

/** SG-Nummern, die ein Geschäftstitel wörtlich nennt («… (SG 162.100) …»). */
export function sgAngaben(titel: string): string[] {
  const treffer = new Set<string>();
  const re = /\bSG\s*((?:[A-Za-zÄÖÜ]{2,3}\s+)?\d{3}\.\d{3})\b/g;
  for (let m = re.exec(titel); m; m = re.exec(titel)) treffer.add(m[1].replace(/\s+/g, ' ').trim());
  return [...treffer].sort(cu);
}

/** Fussnoten-Referenzen «Ratschlag Nr. 06.1970.01» → Geschäftsnummer '06.1970'. */
export const FUSSNOTEN_MUSTER = /(Ratschlag|Kommissionsbericht|Ausgabenbericht|Bericht(?: der [A-ZÄÖÜ][\wäöüß]*)?)\s+Nr\.\s*(\d{2}\.\d{4})(?:\.\d+)?/g;

/** Alle Geschäftsnummern, die ein Fussnoten-Text wörtlich nennt (amtlicher Schlüssel). */
export function fussnotenGeschaefte(text: string): string[] {
  const treffer = new Set<string>();
  const re = new RegExp(FUSSNOTEN_MUSTER.source, 'g');
  for (let m = re.exec(text); m; m = re.exec(text)) treffer.add(m[2]);
  return [...treffer].sort(cu);
}

// ── Schritt 2: Kanten ────────────────────────────────────────────────────────

/** Die drei belegten Wege, in der Reihenfolge ihrer Beweiskraft (erste gewinnt). */
export const KANTEN_REGELN = ['fussnote', 'sg-nummer', 'datum-titel'] as const;

interface ErlassMuster extends BsErlassStamm {
  datum: { tag: number; monat: string; jahr: string } | null;
  muster: RegExp[];
}

/** Baut je Erlass die Vergleichsmuster (Titel · Titelrumpf · amtliche Stichwörter). */
export function erlassMuster(stamm: readonly BsErlassStamm[]): ErlassMuster[] {
  return [...stamm].sort((a, b) => cu(a.key, b.key)).map((e) => {
    const titel = normTitel(e.titel);
    const rumpf = titel.replace(GATTUNG, '');
    const muster: RegExp[] = [];
    if (titel.length >= 10) muster.push(flexMuster(titel));
    if (rumpf !== titel && rumpf.length >= 14) muster.push(flexMuster(rumpf));
    for (const w of e.stichworte) if (w.length >= 5) muster.push(flexMuster(normTitel(w)));
    return { ...e, datum: erlassDatum(e.erlassdatum), muster };
  });
}

/**
 * Alle belegten Kanten, deterministisch sortiert. Je (Geschäft, Erlass) bleibt die
 * stärkste Regel stehen — ein amtlicher Beleg wird nie von einer maschinellen
 * Zuordnung überschrieben und umgekehrt nie durch sie «aufgewertet».
 */
export function baueKanten(
  geschaefte: readonly BsGeschaeft[],
  stamm: readonly BsErlassStamm[],
): BsKante[] {
  const muster = erlassMuster(stamm);
  const nachSg = new Map(muster.map((e) => [e.sg, e]));
  const bekannt = new Set(geschaefte.map((g) => g.signatur_ges));
  const roh = new Map<string, BsKante>();
  const merke = (k: BsKante): void => {
    const id = `${k.geschaeft}|${k.erlass}`;
    const alt = roh.get(id);
    if (!alt || KANTEN_REGELN.indexOf(k.regel) < KANTEN_REGELN.indexOf(alt.regel)) roh.set(id, k);
  };

  // Weg 1 (amtlich): die Fussnote der Gesetzessammlung nennt die Geschäftsnummer.
  // Gilt unabhängig von der Geschäftsart — wenn die amtliche Quelle das Geschäft als
  // Materialie benennt, ist unsere Artenliste nicht klüger als sie.
  for (const e of muster) {
    for (const g of e.fussnotenGeschaefte) {
      if (bekannt.has(g)) merke({ geschaeft: g, erlass: e.key, quelle: 'amtlich', regel: 'fussnote', beleg: g });
    }
  }

  for (const g of geschaefte) {
    if (!(GESCHAEFTSARTEN as readonly string[]).includes(g.ga_rr_gr ?? '')) continue;
    const titel = g.titel_ges ?? '';
    const tn = normTitel(titel);

    // Weg 2 (maschinell): der amtliche Geschäftstitel nennt die SG-Nummer.
    for (const sg of sgAngaben(titel)) {
      const e = nachSg.get(sg);
      if (e) merke({ geschaeft: g.signatur_ges, erlass: e.key, quelle: 'maschinell', regel: 'sg-nummer', beleg: `SG ${sg}` });
    }

    // Weg 3 (maschinell): Erlassdatum UND Titel/Stichwort im Geschäftstitel.
    // Das Datum ALLEIN genügt nicht — belegte Kollision 161.100/162.100 (Vormessung §2.4).
    const daten = datumsAngaben(tn);
    if (daten.length === 0) continue;
    for (const e of muster) {
      if (!e.datum) continue;
      const d = e.datum;
      if (!daten.some((x) => x.tag === d.tag && x.monat === d.monat && x.jahr === d.jahr)) continue;
      if (!e.muster.some((m) => m.test(tn))) continue;
      // Beleg = das Erlassdatum in ISO, NICHT ein nachgebauter Titel-Ausschnitt: die
      // amtlichen Titel schreiben es uneinheitlich («vom 12.Oktober 1967» ohne
      // Leerzeichen, belegt an 04.0801), ein Nachbau wäre ein falsches Zitat. Das Tor
      // prüft dafür inhaltlich nach (Datum muss im Titel stehen), nicht per Textsuche.
      merke({
        geschaeft: g.signatur_ges,
        erlass: e.key,
        quelle: 'maschinell',
        regel: 'datum-titel',
        beleg: `${d.jahr}-${String(MONATE.indexOf(d.monat) + 1).padStart(2, '0')}-${String(d.tag).padStart(2, '0')}`,
      });
    }
  }
  return [...roh.values()].sort((a, b) => cu(a.geschaeft, b.geschaeft) || cu(a.erlass, b.erlass));
}

// ── Schritt 3: Verfahrenskette je Geschäft ──────────────────────────────────

/** Ergebnis der Ereignis-Ableitung samt der bewusst NICHT eingereihten Bezeichnungen. */
export interface EreignisErgebnis {
  jeGeschaeft: Map<string, VerfahrensEreignis[]>;
  /** Amtliche `titel_dok`-Werte ohne Klassen-Regel, mit Anzahl — nie stiller Drop (§8). */
  unklassiert: Array<{ bez: string; anzahl: number }>;
}

/**
 * Dokumente eines Geschäfts → Verfahrenskette. Sortiert nach Datum, dann Klasse, dann
 * Bezeichnung, dann Signatur (total, damit zwei Läufe byte-gleich sind, §2).
 * Dokumente ohne Datum fallen weg: ein undatierter Schritt kann in einer Zeitachse
 * nichts aussagen und würde nur Platz und Bytes kosten.
 */
export function baueEreignisse(dokumente: readonly BsDokument[]): EreignisErgebnis {
  const jeGeschaeft = new Map<string, VerfahrensEreignis[]>();
  const unklar = new Map<string, number>();
  for (const d of dokumente) {
    const bez = (d.titel_dok ?? '').trim();
    const sig = d.signatur_ges;
    if (!sig || !bez) continue;
    const code = bsCodeVonBezeichnung(bez);
    if (code === null) { unklar.set(bez, (unklar.get(bez) ?? 0) + 1); continue; }
    if (!d.dokudatum) continue;
    const e: VerfahrensEreignis = { code, datum: d.dokudatum, vok: 'bs-gr', bez };
    // Die amtliche URL wörtlich; nie aus der Signatur gebaut (s. verfahren.ts zu `res`).
    if (d.url_dok && /^https:\/\/grosserrat\.bs\.ch\//.test(d.url_dok)) e.res = d.url_dok;
    const liste = jeGeschaeft.get(sig) ?? [];
    liste.push(e);
    jeGeschaeft.set(sig, liste);
  }
  for (const [sig, liste] of jeGeschaeft) {
    liste.sort((a, b) => cu(a.datum ?? '', b.datum ?? '') || (a.code - b.code)
      || cu(a.bez ?? '', b.bez ?? '') || cu(a.res ?? '', b.res ?? ''));
    jeGeschaeft.set(sig, liste);
  }
  return {
    jeGeschaeft,
    unklassiert: [...unklar.entries()].map(([bez, anzahl]) => ({ bez, anzahl })).sort((a, b) => cu(a.bez, b.bez)),
  };
}

// ── Schritt 4: Register-Einträge ────────────────────────────────────────────

const PROVENIENZ: Record<BsKante['regel'], string> = {
  fussnote: 'Zuordnung amtlich: die Fussnote der Gesetzessammlung Basel-Stadt nennt dieses Geschäft.',
  'sg-nummer': 'Zuordnung maschinell über die SG-Nummer im amtlichen Geschäftstitel; fachlich nicht geprüft.',
  'datum-titel': 'Zuordnung maschinell über Erlassdatum und Titel im amtlichen Geschäftstitel; fachlich nicht geprüft.',
};

/** Stabiler, URL-sicherer Schlüssel eines Geschäfts ('26.0600' → 'BS-GR-26.0600'). */
export function keyAusSignatur(signatur: string): string {
  if (!/^\d{2}\.\d{4}$/.test(signatur)) {
    throw new Error(`bs-materialien: unerwartete Geschäftsnummer '${signatur}' (erwartet NN.NNNN).`);
  }
  return `BS-GR-${signatur}`;
}

/**
 * Der `stand` eines Eintrags: das Datum der Vorlage des Regierungsrats (Klasse 1010),
 * sonst das früheste Ereignis, sonst der Geschäftsbeginn. Amtliche Daten, in dieser
 * festen Reihenfolge — nie das Abrufdatum (das wäre ein selbstgemachter «Stand», §7a).
 */
export function standVon(g: BsGeschaeft, ereignisse: readonly VerfahrensEreignis[]): string {
  const vorlage = ereignisse.filter((e) => e.code === 1010 && e.datum).map((e) => e.datum as string).sort(cu);
  if (vorlage.length > 0) return vorlage[0];
  const alle = ereignisse.filter((e) => e.datum).map((e) => e.datum as string).sort(cu);
  if (alle.length > 0) return alle[0];
  return g.beginn_ges ?? '';
}

/** Baut die Einträge: ein Geschäft mit ≥ 1 Kante = ein Eintrag. Total sortiert (§2). */
export function baueBsEintraege(
  geschaefte: readonly BsGeschaeft[],
  kanten: readonly BsKante[],
  ereignisse: ReadonlyMap<string, VerfahrensEreignis[]>,
): BsEintrag[] {
  const jeGeschaeft = new Map<string, BsKante[]>();
  for (const k of kanten) {
    const liste = jeGeschaeft.get(k.geschaeft) ?? [];
    liste.push(k);
    jeGeschaeft.set(k.geschaeft, liste);
  }
  const nachSignatur = new Map(geschaefte.map((g) => [g.signatur_ges, g]));
  const roh: BsEintrag[] = [];
  for (const [signatur, liste] of jeGeschaeft) {
    const g = nachSignatur.get(signatur);
    if (!g) continue;
    const titel = (g.titel_ges ?? '').replace(/\s+/g, ' ').trim();
    if (!titel) continue;
    const ev = ereignisse.get(signatur) ?? [];
    const stand = standVon(g, ev);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(stand)) continue; // ohne amtliches Datum kein Eintrag (§7a)
    const meineKanten = [...liste].sort((a, b) => cu(a.erlass, b.erlass));
    const normKeys = [...new Set(meineKanten.map((k) => k.erlass))].sort(cu);
    const regeln = [...new Set(meineKanten.map((k) => k.regel))]
      .sort((a, b) => KANTEN_REGELN.indexOf(a) - KANTEN_REGELN.indexOf(b));
    roh.push({
      key: keyAusSignatur(signatur),
      behoerde: 'BS-GR',
      doktyp: doktypVonGeschaeftsart(g.ga_rr_gr),
      titel,
      nummer: signatur,
      rechtsgebiet: kantonGebiet(normKeys[0]),
      sprache: 'de',
      status: 'nur-live-link',
      quelleUrl: g.url_ges ?? `https://grosserrat.bs.ch/?gnr=${signatur}`,
      stand,
      rang: 0,
      normKeys,
      hinweis: regeln.map((r) => PROVENIENZ[r]).join(' '),
      ereignisse: ev,
      bsKanten: meineKanten,
    });
  }
  // Jüngste zuerst (wie die Botschaften); Schlüssel als Stichentscheid → total.
  roh.sort((a, b) => cu(b.stand, a.stand) || cu(a.key, b.key));
  return roh.map((e, i) => ({ ...e, rang: i + 1 }));
}

// ── Schritt 5: Serialisierung (byte-deterministisch) ────────────────────────

/** Serialisiert die Einträge als generiertes TS-Modul. */
export function serialisiere(eintraege: readonly BsEintrag[], abgerufen: string): string {
  const esc = (s: string): string => JSON.stringify(s);
  const zeilen = eintraege.map((e) => {
    const felder = [
      `key: ${esc(e.key)}`,
      `behoerde: 'BS-GR'`,
      `doktyp: ${esc(e.doktyp)}`,
      `titel: ${esc(e.titel)}`,
      `nummer: ${esc(e.nummer)}`,
      `rechtsgebiet: ${esc(e.rechtsgebiet)}`,
      `sprache: 'de'`,
      `status: 'nur-live-link'`,
      `quelleUrl: ${esc(e.quelleUrl)}`,
      `stand: ${esc(e.stand)}`,
      `rang: ${e.rang}`,
      `normKeys: [${e.normKeys.map(esc).join(', ')}]`,
      `hinweis: ${esc(e.hinweis)}`,
    ];
    if (e.ereignisse.length > 0) {
      const ev = e.ereignisse.map((v) => {
        const f = [`code: ${v.code}`];
        if (v.datum) f.push(`datum: ${esc(v.datum)}`);
        if (v.res) f.push(`res: ${esc(v.res)}`);
        f.push(`vok: 'bs-gr'`);
        if (v.bez) f.push(`bez: ${esc(v.bez)}`);
        return `{ ${f.join(', ')} }`;
      });
      felder.push(`ereignisse: [${ev.join(', ')}]`);
    }
    const kk = e.bsKanten.map((k) => `{ erlass: ${esc(k.erlass)}, quelle: ${esc(k.quelle)}, regel: ${esc(k.regel)}, beleg: ${esc(k.beleg)} }`);
    felder.push(`bsKanten: [${kk.join(', ')}]`);
    return `  { ${felder.join(', ')} },`;
  });
  return `// AUTO-GENERIERT von scripts/materialien/bs-materialien-run.ts — NICHT von Hand editieren.
// NICHT aus src/ importieren (Bundle §15) — reine Build-Zeit-Quelle für die register.json-Projektion.
// Materialien des Grossen Rates Basel-Stadt je BS-Korpus-Erlass (data.bs.ch, CC BY 4.0).
// Quelle abgerufen: ${abgerufen}. Regenerieren: npm run materialien:bs -- --datum=$(date +%F)
import type { MaterialRegistereintrag } from './typen';

export const BS_MATERIALIEN: MaterialRegistereintrag[] = [
${zeilen.join('\n')}
];
`;
}
