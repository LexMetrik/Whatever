// ─── Rechtsprechungs-Wochenlauf: reine Logik (§2, netz- und git-frei) ────────
//
// Kern von scripts/rechtsprechung/wochenlauf.ts (CLI, Netz, Prozesse). Hier
// liegen nur deterministische Entscheide, damit sie ohne Netz testbar sind:
// Bandberechnung, Register-Vergleich vorher/nachher, Ausfall- und Guard-
// Erkennung im Generator-Log, Stichproben-Auswahl, Identitätsprüfung einer
// amtlichen Seite (HTML oder PDF-Text), Budget, Frische, Positivliste,
// «in Prüfung» und der Entscheid «kein Diff / Entwurf / PR». Der PR-Bericht
// steht in wochenlauf-bericht.ts.
//
// Entscheid David 25.9.2026 («Vorbereiten, Prüfung vor Live»): der Lauf
// bereitet EINEN PR vor, live geht er erst nach der Gegenprüfung einer
// Session. Nichts hier darf einen Befund unterdrücken — jeder Ausfall, jedes
// rote Tor, jeder Guard-Befund und jeder Fehltreffer der Stichprobe steht im
// Bericht.
import { bandJahrVon, istBandjahrPlatzhalter } from '../normtext/bge-bandjahr';
import { inlineZuText, parseClirUrteilskopf } from '../normtext/clir-regeste';
import { behalten } from '../gegenpruefung/kern';

/** Register-Eintrag (public/rechtsprechung/register.json), nur die gelesenen Felder. */
export interface RegEintrag {
  key: string;
  gericht: string;
  datum: string;
  nummer?: string | null;
  bgeReferenz?: string | null;
  quelle?: string | null;
  quelleUrl?: string | null;
  /** Registerpfad des Snapshots (z. B. «kanton/BS/…/AUS.2026.77.json»). */
  datei?: string | null;
  verweis?: unknown;
}

// ── Bänder ──────────────────────────────────────────────────────────────────
/**
 * Laufender und Vorjahres-BGE-Band zum Laufdatum. Band = Publikationsjahr − 1874
 * — die Umkehrung von `bandJahrVon` (bge-bandjahr.ts, eine Quelle, §5). Am
 * Bestand verifiziert (25.9.2026): in jedem Band 146–152 ist das jüngste
 * Entscheiddatum genau Band+1874, ältere stammen aus dem Vorjahr — darum
 * läuft der Vorjahresband immer mit (späte Publikationen).
 */
export function baenderFuer(datumIso: string): { vor: number; lauf: number } {
  const m = /^(\d{4})-\d{2}-\d{2}$/.exec(datumIso);
  if (!m) throw new Error(`Laufdatum nicht ISO (YYYY-MM-DD): «${datumIso}»`);
  const lauf = Number(m[1]) - 1874;
  if (bandJahrVon(`${lauf} I 1`) !== Number(m[1])) throw new Error(`Bandformel widerspricht bandJahrVon (${datumIso})`);
  return { vor: lauf - 1, lauf };
}

// ── Register-Vergleich ──────────────────────────────────────────────────────
export interface GerichtZeile { gericht: string; vorher: number; nachher: number; neuestes: string | null }
export interface RegisterVergleich { neu: RegEintrag[]; entfernt: RegEintrag[]; jeGericht: GerichtZeile[] }

/** Vergleicht zwei Register (Verweis-Einträge zählen nicht — sie haben keinen eigenen Snapshot). */
export function vergleicheRegister(vorher: RegEintrag[], nachher: RegEintrag[]): RegisterVergleich {
  const echt = (xs: RegEintrag[]) => xs.filter((e) => !e.verweis);
  const v = echt(vorher);
  const n = echt(nachher);
  const vKeys = new Set(v.map((e) => e.key));
  const nKeys = new Set(n.map((e) => e.key));
  const nachKey = (a: RegEintrag, b: RegEintrag) => (a.key < b.key ? -1 : a.key > b.key ? 1 : 0);
  const zeilen = new Map<string, GerichtZeile>();
  const zeile = (g: string) => {
    let z = zeilen.get(g);
    if (!z) { z = { gericht: g, vorher: 0, nachher: 0, neuestes: null }; zeilen.set(g, z); }
    return z;
  };
  for (const e of v) zeile(e.gericht).vorher++;
  for (const e of n) {
    const z = zeile(e.gericht);
    z.nachher++;
    if (!z.neuestes || e.datum > z.neuestes) z.neuestes = e.datum;
  }
  return {
    neu: n.filter((e) => !vKeys.has(e.key)).sort(nachKey),
    entfernt: v.filter((e) => !nKeys.has(e.key)).sort(nachKey),
    jeGericht: [...zeilen.values()].sort((a, b) => (a.gericht < b.gericht ? -1 : 1)),
  };
}

// ── Ausfälle im Generator-Log ───────────────────────────────────────────────
/**
 * Die Generatoren enden bei nicht erreichbarer Quelle oft mit Exit 0 und
 * «Korpus unberührt» (Leer-Guard). Das ist richtig, darf aber nicht still
 * bleiben: diese Zeilen werden als Ausfall in den Bericht gehoben.
 * `[clir] AUSFALL: …` führt der Quellen-Robustheits-PR ein (clir-regeste.ts).
 */
const AUSFALL_MUSTER: RegExp[] = [
  /übersprungen/, // kein \b: «ü» ist für JS-\b kein Wortzeichen
  /nicht erreichbar/,
  /Korpus (?:bleibt )?unberührt/,
  /\bFetch-Fehler\b/,
  /\bABBRUCH\b/,
  /\bAUSFALL\b/,
];
/**
 * «Nichts Neues» ist KEIN Ausfall (A8, 25.9.2026): diese Zeilen treffen ein
 * AUSFALL_MUSTER, melden aber einen gesunden Lauf. Ohne die Ausnahme zählte
 * jede ruhige BS-Woche als Ausfall, und eine Woche ohne Diff endete mit Exit 1
 * (Fehlalarm des Wächters).
 *  · bs-delta.ts `parseUndSchreibeDelta`: Plan leer — das Inventar ist durch
 *    die Count-Gates G1/G2 (bs-inventar.ts) belegt, sonst wäre es geworfen.
 *  · bs-fetch.ts Fortschritt/Schluss mit «0 Fehler»: «übersprungen» zählt dort
 *    Rohdateien, die schon im Store liegen (Idempotenz), keine Quelle.
 */
const RUHIG_MUSTER: RegExp[] = [
  /^\[bs-delta\] nichts zu tun — Korpus unberührt\.?$/,
  /^\[bs-fetch\] (?:FERTIG: )?\d+ geholt\s*[,/]\s*\d+ übersprungen\s*[,/]\s*0 Fehler\b/,
];
export function erkenneAusfaelle(log: string): string[] {
  const out: string[] = [];
  for (const roh of log.split('\n')) {
    const z = roh.trim();
    if (!z || RUHIG_MUSTER.some((re) => re.test(z))) continue;
    if (AUSFALL_MUSTER.some((re) => re.test(z)) && !out.includes(z)) out.push(z);
  }
  return out;
}

// ── Guard-Befunde (A7) ──────────────────────────────────────────────────────
/**
 * Schutzregeln der Generatoren, die Einträge NICHT aufnehmen, zurückstufen oder
 * Keys verwerfen — gesammelt per grep über scripts/normtext-entscheide.ts,
 * scripts/normtext/*.ts, scripts/rechtsprechung/*.ts (25.9.2026). Kein Ausfall
 * und kein Entwurf, aber ein Befund, den die prüfende Session sehen muss.
 * Zeilen mit Zählern melden nur bei Zähler > 0 (die [b1]-/[remap]-Bilanzen
 * drucken auch 0). Folgezeilen «  · id: keys» (Remap) hängen am Befund.
 * NICHT erfasst: die [bezuege]-Riegel-Bilanzen von entscheide-schreiben.ts —
 * sie zählen den GANZEN Korpus bei jedem Schreiben, nicht den Wochenlauf, und
 * check:bezuege prüft sie.
 */
const GUARD_MUSTER: RegExp[] = [
  /§8-Konflations-Guard/, //      normtext-entscheide.ts [bge-baender]: NICHT aufgenommen
  /§8-Quarantäne/, //              [bge-baender]: ausgeschlossen (DE-Regeste unvollständig)
  /Kollisions-Quarantäne: [1-9]/, // [bge-baender]/[bge-refresh]/[bge]/[b1]: zurückgestuft
  /alt-verworfen .*: [1-9]\d* Keys/, // [remap]: Keys aus dem Bestand entfernt
  /— verworfen \(A1\)/, //         [b1]: frisches Ergebnis verschlechtert das Datum
];
export interface GuardBefund { zeile: string; details: string[] }
export function erkenneGuardBefunde(log: string): GuardBefund[] {
  const out: GuardBefund[] = [];
  let offen: GuardBefund | null = null;
  for (const roh of log.split('\n')) {
    if (offen && /^\s+· /.test(roh)) { if (offen.details.length < 40) offen.details.push(roh.trim().slice(2)); continue; }
    const z = roh.trim();
    offen = z && GUARD_MUSTER.some((re) => re.test(z)) ? { zeile: z, details: [] } : null;
    if (offen) out.push(offen);
  }
  return out;
}

// ── Gerichte des Wochenlaufs ────────────────────────────────────────────────
export const EIDG_GERICHTE = ['bvger', 'bstger', 'bpatger'];
export const KANTONS_GERICHTE = ['zh_obergericht', 'be_verwaltungsgericht', 'sg_gerichte', 'gr_gerichte', 'ag_gerichte'];
/**
 * Gerichte, die der Wochenlauf NICHT nachzieht — die einzige Stelle dafür (§5);
 * der Bericht nennt sie. Befund Stichproben-Nachzug PR #1117 (25.9.2026): OCL
 * liefert `decision_date` schon falsch, der Adapter übernimmt es als Text
 * (adapter-entscheide.ts) — sg_gerichte: Datum des nachfolgenden BGer-Urteils
 * (9/12 im Bestand); ag_gerichte: um Tage bis Wochen verschoben; gr_gerichte:
 * Bestand 6/6 falsch, +6 bis +62 Tage. Eigene Stichprobe 25.9.2026 gegen die
 * Quell-PDFs bestätigt: SG 2/2, AG 2/3, GR 3/3 Datum ✗. be_verwaltungsgericht
 * bleibt drin (neue Einträge 6/6 richtig), aber nur mit Datumsprüfung — ein
 * BE-Datum-Fehltreffer macht den PR zum Entwurf.
 * Rückbau: Posten QS-KORPUS 2026-09-25 Adapter-Datum (a)/(g) — entfällt je
 * Gericht, sobald dessen Datum an der Quelle belegt richtig ankommt.
 */
export const AUSGENOMMEN: Readonly<Record<string, string>> = {
  sg_gerichte: 'Datum aus OCL unzuverlässig',
  ag_gerichte: 'Datum aus OCL unzuverlässig',
  gr_gerichte: 'Datum aus OCL unzuverlässig',
};
export const aktiveGerichte = (gerichte: readonly string[]) => gerichte.filter((g) => !(g in AUSGENOMMEN));
/**
 * Nachgezogene Gerichte mit bekannter Datums-Unzuverlässigkeit — die einzige
 * Stelle dafür (§5): JEDER neue oder geänderte Eintrag geht zusätzlich zu n in
 * die Stichprobe (stichprobenPlan, wochenlauf-vorwoche.ts), nicht nur
 * stichprobenhaft. Auflage N1 der Gegenprüfung #1113 (25.9.2026): BE-Datum
 * stammt aus OCL wie bei SG/AG/GR; neue Einträge 6/6 richtig, aber nicht belegt
 * für die Zukunft.
 */
export const DATUM_VOLLPRUEFUNG: ReadonlySet<string> = new Set(['be_verwaltungsgericht']);

/**
 * Aufruf «Übrige Gerichte» (npm run entscheide, additiv): eidg. und kantonale
 * Gerichte OHNE die AUSGENOMMENEN — abgeleitet, nicht doppelt gepflegt (§5).
 * `--courts` im additiven Modus trägt seit #1117 (entscheide-additiv.ts).
 */
export function uebrigeAufruf(datum: string): { args: string[]; kantone: string[] } {
  const eidg = aktiveGerichte(EIDG_GERICHTE);
  const kantone = aktiveGerichte(KANTONS_GERICHTE);
  return {
    args: ['run', 'entscheide', '--', `--datum=${datum}`, '--additiv', `--eidg=${eidg.join(',')}`, '--eidg-pro=5', `--courts=${kantone.join(',')}`, '--kanton-pro=6'],
    kantone,
  };
}

// ── Kantonaler Zweig (A4) ───────────────────────────────────────────────────
/**
 * Bis #1117 ignorierte `npm run entscheide -- --additiv` die Optionen
 * `--courts/--kanton-pro` still (nur eidg.). Seit #1117 (25.9.2026) trägt die
 * Datei unten den additiven Kantonszweig; fehlt sie (Rückbau), ist «kantonal»
 * ein AUSFALL, nie still. Mit Zweig muss jedes angeforderte Gericht im Log
 * vorkommen — der Generator schreibt je Gericht «[kanton] <gericht>: …»
 * (auch bei «übersprungen»); fehlt die Zeile, ebenfalls Ausfall.
 * Gezählt wird NUR eine Zeile, die mit «[kanton] <gericht>:» BEGINNT
 * (normtext-entscheide.ts kantonKorpus). Befund Gegenprüfung #1113 (A1,
 * 25.9.2026): npm druckt den ganzen Aufruf samt «--courts=zh_obergericht,…» als
 * Kopfzeile ins Log — eine blosse Wortgrenzen-Suche fand dort jedes Gericht,
 * ein stummer Kantonszweig blieb unentdeckt.
 */
export const KANTONSZWEIG_DATEI = 'scripts/normtext/entscheide-additiv.ts';
export function kantonalAusfall(hatZweig: boolean, courts: string[], log: string): string[] {
  if (!courts.length) return [];
  if (!hatZweig) return [`kantonal: übersprungen — Generator ohne additiven Kantonszweig (${KANTONSZWEIG_DATEI} fehlt; ${courts.join(', ')})`];
  const stumm = courts.filter((c) => !new RegExp(`^\\[kanton\\] ${esc(c)}:`, 'm').test(log));
  return stumm.length ? [`kantonal: keine Rückmeldung im Generator-Log für ${stumm.join(', ')} — AUSFALL`] : [];
}

/**
 * BS-Delta-Plan aus dem Log (Zeilenform: scripts/rechtsprechung/bs-delta.ts,
 * berichteBsDelta). Einmal je Eintrag: bs-import.ts druckt den Plan in Phase 1
 * UND parseUndSchreibeDelta noch einmal (bis 25.9.2026 zählte der Bericht jede
 * Aktualisierung doppelt); der Vollabgleich druckt Listen- und Vollplan.
 */
export function leseBsDelta(log: string): { aktualisiert: string[]; takedown: string[] } {
  const aktualisiert = new Set<string>();
  const takedown = new Set<string>();
  for (const z of log.split('\n')) {
    const a = /\[bs-delta\]\s+aktualisiert:\s+(.+)$/.exec(z);
    if (a) aktualisiert.add(a[1].trim());
    const t = /\[bs-delta\]\s+Takedown[^:]*:\s+(\S+)/.exec(z);
    if (t) takedown.add(t[1]);
  }
  return { aktualisiert: [...aktualisiert], takedown: [...takedown] };
}

/** Bilanz des BS-Vollabgleichs (Zeile von wochenlauf-bs-voll.ts); null, wenn keine. */
export interface BsVollBilanz { geprueft: number; inhalt: number; liste: number; neu: number; takedown: number }
export function leseBsVoll(log: string): BsVollBilanz | null {
  const m = /\[bs-voll\] geprüft: (\d+) · Inhalt geändert: (\d+) · Listenfelder geändert: (\d+) · neu: (\d+) · Takedown: (\d+)/.exec(log);
  return m ? { geprueft: +m[1], inhalt: +m[2], liste: +m[3], neu: +m[4], takedown: +m[5] } : null;
}

// ── Stichprobe ──────────────────────────────────────────────────────────────
export type Gruppe = 'bge' | 'bs' | 'uebrige';
export function gruppeVon(e: RegEintrag): Gruppe {
  if (e.gericht === 'bge') return 'bge';
  if (e.quelle === 'gerichte-bs') return 'bs';
  return 'uebrige';
}

/**
 * Deterministische Auswahl: reihum BGE → BS → übrige; BGE/BS gleichmässig über
 * die Gruppe verteilt (nicht nur die ersten Keys eines Bandes), übrige reihum
 * über die Gerichte (jedes Gericht einmal, bevor eines zweimal kommt). Alle,
 * wenn weniger als n neu sind. Seit die PDF-Quellen prüfbar sind (Punkt 4,
 * 25.9.2026: BStGer/BVGer/BE/SG/GR/AG) gibt es keinen Deckel für «übrige» mehr.
 */
export function waehleStichprobe(neu: RegEintrag[], n: number): RegEintrag[] {
  const gruppen: Record<Gruppe, RegEintrag[]> = { bge: [], bs: [], uebrige: [] };
  for (const e of [...neu].sort((a, b) => (a.key < b.key ? -1 : 1))) gruppen[gruppeVon(e)].push(e);
  const verteilt = (xs: RegEintrag[], k: number) =>
    xs.length <= k ? xs : Array.from({ length: k }, (_, i) => xs[Math.floor((i * xs.length) / k)]);
  const reihum = (xs: RegEintrag[], k: number) => {
    const je = new Map<string, RegEintrag[]>();
    for (const e of xs) (je.get(e.gericht) ?? (je.set(e.gericht, []), je.get(e.gericht)!)).push(e);
    const listen = [...je.keys()].sort().map((g) => verteilt(je.get(g)!, je.get(g)!.length));
    const out: RegEintrag[] = [];
    for (let i = 0; out.length < k && listen.some((l) => l.length > i); i++) for (const l of listen) if (l[i] && out.length < k) out.push(l[i]);
    return out;
  };
  const reihe: Gruppe[] = ['bge', 'bs', 'uebrige'];
  const anteil: Record<Gruppe, number> = { bge: 0, bs: 0, uebrige: 0 };
  let rest = Math.min(n, neu.length);
  while (rest > 0) for (const g of reihe) if (rest > 0 && anteil[g] < gruppen[g].length) { anteil[g]++; rest--; }
  return [...verteilt(gruppen.bge, anteil.bge), ...verteilt(gruppen.bs, anteil.bs), ...reihum(gruppen.uebrige, anteil.uebrige)];
}

/**
 * OCL-decision_id für die Detail-Abfrage (`pdf_url`). Nur BVGer: dort ist die
 * gespeicherte `quelleUrl` (OCL `source_url`) eine JS-Hülle, das Detail trägt
 * daneben `pdf_url` (ua-mess-B §4). Form am 25.9.2026 gemessen:
 * `bvger_F-4218_2026` ↔ Aktenzeichen «F-4218/2026».
 */
export function oclIdFuerPdf(e: RegEintrag): string | null {
  const nr = (e.nummer ?? '').split(',')[0].trim();
  return e.gericht === 'bvger' && nr ? `bvger_${nr.replace(/\//g, '_')}` : null;
}

/**
 * Ergebnis einer Identitätsprüfung. `treffer`: true = belegt, false = Gegenbeweis
 * (Fehltreffer), null = nicht prüfbar. `akz` und `datum` weisen die zwei
 * Kriterien getrennt aus (true ✓ · false ✗ · null nicht ermittelbar;
 * undefined = nicht anwendbar, z. B. Bandjahr-Platzhalter).
 */
export interface Identitaet { treffer: boolean | null; detail: string; akz?: boolean | null; datum?: boolean | null }
const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
/** Wortgrenze für Aktenzeichen: kein Buchstabe/Ziffer/Punkt/Schrägstrich direkt davor oder danach. */
const grenze = (s: string) => new RegExp(`(?<![\\p{L}\\p{N}./_-])${esc(s).replace(/\s+/g, '\\s+')}(?![\\p{L}\\p{N}/_-]|\\.\\d)`, 'u');
// Block-Tags als Trenner: sonst verschmelzen «152 V 122</div><div>14.» zu «152 V 12214.»
const text = (html: string) =>
  inlineZuText(html.replace(/<\/?(?:div|p|td|th|tr|table|h\d|li)\b[^>]*>/gi, ' ')).replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ');

/**
 * BGE gegen die clir-Seite (bger.ch): die Fundstelle direkt nach «Urteilskopf»
 * ist die eigene, und — ausser beim Bandjahr-Platzhalter — stimmt das
 * Urteilsdatum des Urteilskopfs (parseClirUrteilskopf, eine Quelle) mit dem
 * Korpus überein.
 */
export function pruefeBge(html: string, e: RegEintrag): Identitaet {
  const ref = (e.bgeReferenz ?? '').trim();
  const t = text(html);
  const i = t.indexOf('Urteilskopf');
  if (!ref || i < 0) return { treffer: false, akz: false, detail: 'kein Urteilskopf/keine Fundstelle' };
  const kopf = t.slice(i + 'Urteilskopf'.length, i + 'Urteilskopf'.length + 40);
  if (!new RegExp(`^\\s*${esc(ref).replace(/\s+/g, '\\s+')}(?!\\d)`).test(kopf)) {
    return { treffer: false, akz: false, detail: `Urteilskopf nennt «${kopf.trim().slice(0, 20)}», erwartet ${ref}` };
  }
  if (istBandjahrPlatzhalter({ datum: e.datum, bgeReferenz: ref })) return { treffer: true, akz: true, detail: `${ref} (Bandjahr-Platzhalter, nur Fundstelle)` };
  const { aza, datumIso } = parseClirUrteilskopf(html);
  if (datumIso !== e.datum) return { treffer: false, akz: true, datum: datumIso ? false : null, detail: `${ref}: Datum amtlich ${datumIso ?? '–'} ≠ Korpus ${e.datum}` };
  return { treffer: true, akz: true, datum: true, detail: `${ref} · ${aza ?? '–'} · ${datumIso}` };
}

/** BS-Portal: «Geschäftsnummer: <nummer>» und «Entscheiddatum: TT.MM.JJJJ» = Korpus. */
export function pruefeBs(html: string, e: RegEintrag): Identitaet {
  const t = text(html);
  const nr = (e.nummer ?? '').trim();
  const m = /Gesch(?:ä|&auml;)ftsnummer:\s*(\S+)/.exec(t);
  if (!nr || !m || m[1] !== nr) return { treffer: false, akz: false, detail: `Geschäftsnummer amtlich «${m?.[1] ?? '–'}», erwartet «${nr}»` };
  const d = /Entscheiddatum:\s*(\d{2})\.(\d{2})\.(\d{4})/.exec(t);
  const iso = d ? `${d[3]}-${d[2]}-${d[1]}` : null;
  if (iso !== e.datum) return { treffer: false, akz: true, datum: iso ? false : null, detail: `${nr}: Entscheiddatum amtlich ${iso ?? '–'} ≠ Korpus ${e.datum}` };
  return { treffer: true, akz: true, datum: true, detail: `${nr} · ${iso}` };
}

/**
 * Gerichte, deren Urteile das Jahr im Aktenzeichen zweistellig schreiben, wo
 * OCL/Register es vierstellig führen — eng gefasst, je Gericht belegt (GR ist
 * derzeit AUSGENOMMEN; die Regel bleibt für die Wiederaufnahme):
 *  · gr_gerichte: «Referenz ZR1 24 196» / «SBK 26 38» / «SV1 26 9» im Urteil,
 *    «ZR1 2024 196» / «SBK 2026 38» / «SV1 2026 9» im Register (PDF-Messung
 *    25.9.2026, drei Urteile).
 * Nur ein freistehendes Jahr (Leerzeichen auf beiden Seiten) wird gekürzt;
 * Zeichenfolge, Reihenfolge und die Wortgrenze bleiben sonst gleich.
 */
export const KURZJAHR_GERICHTE: ReadonlySet<string> = new Set(['gr_gerichte']);
export function aktenzeichenVarianten(nr: string, gericht: string): string[] {
  if (!KURZJAHR_GERICHTE.has(gericht)) return [nr];
  const kurz = nr.replace(/(?<=\s)(?:19|20)(\d{2})(?=\s)/g, '$1');
  return kurz === nr ? [nr] : [nr, kurz];
}

const MONATE: Record<'de' | 'fr' | 'it', string[]> = {
  de: ['januar', 'februar', 'märz', 'april', 'mai', 'juni', 'juli', 'august', 'september', 'oktober', 'november', 'dezember'],
  fr: ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'],
  it: ['gennaio', 'febbraio', 'marzo', 'aprile', 'maggio', 'giugno', 'luglio', 'agosto', 'settembre', 'ottobre', 'novembre', 'dicembre'],
};
const MONAT_NR = new Map<string, number>(Object.values(MONATE).flatMap((ms) => ms.map((m, i) => [m, i + 1] as [string, number])));
const MONAT_RE = [...MONAT_NR.keys()].sort((a, b) => b.length - a.length).join('|');
const TYP_RE = 'urteil|entscheid|beschluss|verfügung|arrêt|décision|jugement|ordonnance|sentenza|decisione|decreto|ordinanza';

/**
 * Das AMTLICHE Entscheiddatum aus dem Kopf eines Urteils (erste 3000 Zeichen),
 * gebaut an realen Quell-PDFs (25.9.2026): BStGer «Beschluss vom 11. Juni 2026»,
 * BVGer gesperrt «U r t e i l v o m 1 7 . J u n i 2 0 2 6» / «S e n t e n z a
 * d e l 1 9 g i u g n o 2 0 2 6», BE «Urteil der Einzelrichterin vom 20. Mai
 * 2026», GR «Urteil vom 25. April 2026», AG «Urteil vom11. September 2025», SG
 * «Entscheiddatum: 03.02.2025», ZH (HTML) «Beschluss 12.05.2026». Weil Sperrschrift die Wortabstände verschluckt,
 * wird auf dem Kopf OHNE Leerraum gesucht. Vorrang: ein Etikett
 * «Entscheiddatum:»; sonst die ERSTE Fügung «<Entscheidart> … vom/du/del
 * <Datum>» mit höchstens 60 Zeichen dazwischen (auch ein Aktenzeichen:
 * «Urteil 8C_484/2025 vom …»); der Rubrum-Kopf steht vor Vorinstanz- und
 * Verfahrensdaten.
 * Nur Tag/Monat/Jahr als Text — keine Zeitstempel, also keine Zeitzonen-Falle.
 */
export function amtlichesDatum(t: string): string | null {
  const k = t.normalize('NFC').slice(0, 3000).replace(/\s+/g, '').toLowerCase();
  const iso = (j: string, m: number, d: string) => (m >= 1 && m <= 12 && +d >= 1 && +d <= 31 ? `${j}-${String(m).padStart(2, '0')}-${d.padStart(2, '0')}` : null);
  const etikett = /entscheiddatum:?(\d{1,2})\.(\d{1,2})\.(\d{4})(?!\d)/u.exec(k);
  if (etikett) return iso(etikett[3], +etikett[2], etikett[1]);
  const re = new RegExp(`(?:${TYP_RE}).{0,60}?(?:vom|du|del|dell['’]|dello)(\\d{1,2})(?:er|°)?\\.?(?:(${MONAT_RE})|(\\d{1,2})\\.)(\\d{4})(?!\\d)`, 'u');
  // ZH (HTML-Druckansicht, 25.9.2026): «Beschluss 12.05.2026» — Entscheidart direkt vor dem Zahlendatum.
  const direkt = new RegExp(`(?:${TYP_RE})(\\d{1,2})\\.(\\d{1,2})\\.(\\d{4})(?!\\d)`, 'u').exec(k);
  const m = re.exec(k);
  if (direkt && (!m || direkt.index < m.index)) return iso(direkt[3], +direkt[2], direkt[1]);
  if (!m) return null;
  return iso(m[4], m[2] ? MONAT_NR.get(m[2])! : +m[3], m[1]);
}

/** Unter dieser Zeichenzahl hat ein PDF keine brauchbare Textebene (Scan) — nicht prüfbar statt Fehltreffer. */
export const PDF_MIN_TEXT = 500;

/**
 * Übrige Gerichte, ZWEI Kriterien, getrennt ausgewiesen (Befund PR #1117,
 * 25.9.2026: das OCL-Entscheiddatum ist bei SG/AG falsch — das Datum ist
 * darum Pflicht, nicht Zusatz):
 *  · Aktenzeichen: das (erste) Aktenzeichen steht mit Wortgrenze im Text (HTML
 *    oder PDF-Text aus wochenlauf-pdf.ts). Beim PDF mit Textebene ist ein
 *    FEHLENDES Aktenzeichen ein Gegenbeweis; beim HTML nicht (JS-Hülle).
 *  · Datum: amtlichesDatum(Text) = Korpus-Datum, auf den Tag (±0).
 * treffer nur mit beidem ✓; ein ✗ in einem Kriterium ⇒ Fehltreffer; Datum
 * nicht ermittelbar ⇒ nicht prüfbar (Teilbeleg, Handprüfung).
 */
export function pruefeText(t: string, e: RegEintrag, art: 'pdf' | 'html'): Identitaet {
  const nr = (e.nummer ?? '').split(',')[0].trim();
  if (!nr) return { treffer: null, akz: null, detail: 'kein Aktenzeichen im Korpus' };
  if (art === 'pdf' && t.replace(/\s+/g, '').length < PDF_MIN_TEXT) return { treffer: null, akz: null, detail: `${nr}: PDF ohne Textebene — Handprüfung` };
  const var_ = aktenzeichenVarianten(nr, e.gericht).find((v) => grenze(v).test(t));
  const quelle = art === 'pdf' ? 'PDF' : 'HTML';
  if (!var_) {
    return art === 'pdf'
      ? { treffer: false, akz: false, detail: `${nr}: nicht im PDF-Text (${t.length} Zeichen)` }
      : { treffer: null, akz: null, detail: `${nr}: nicht im HTML (JS-Hülle?) — Handprüfung` };
  }
  const akzText = var_ === nr ? nr : `${nr} (als «${var_}»)`;
  const amtlich = amtlichesDatum(t);
  if (amtlich === null) return { treffer: null, akz: true, datum: null, detail: `${akzText} · ${quelle} · Datum nicht ermittelbar (Korpus ${e.datum}) — Handprüfung` };
  if (amtlich !== e.datum) return { treffer: false, akz: true, datum: false, detail: `${akzText} · ${quelle} · Datum amtlich ${amtlich} ≠ Korpus/OCL ${e.datum}` };
  return { treffer: true, akz: true, datum: true, detail: `${akzText} · ${quelle} · ${amtlich}` };
}

/** HTML einer übrigen Quelle (PDF-Bytes gehen über pdfText + pruefeText). */
export function pruefeGenerisch(html: string, e: RegEintrag): Identitaet {
  if (html.startsWith('%PDF')) return { treffer: null, detail: 'Quelle ist PDF — über pdfText prüfen' };
  return pruefeText(text(html), e, 'html');
}

export function pruefeIdentitaet(html: string, e: RegEintrag): Identitaet {
  const g = gruppeVon(e);
  return g === 'bge' ? pruefeBge(html, e) : g === 'bs' ? pruefeBs(html, e) : pruefeGenerisch(html, e);
}

export interface StichprobenZeile {
  key: string;
  url: string | null;
  ergebnis: 'treffer' | 'fehltreffer' | 'nicht-pruefbar';
  detail: string;
  /** Kriterien getrennt (Identitaet.akz/.datum); fehlt = nicht anwendbar. */
  akz?: boolean | null;
  datum?: boolean | null;
}

// ── Budget (Punkt 12) ───────────────────────────────────────────────────────
export interface BudgetZeile { pfad: string; vorher: number | null; nachher: number | null; budget: number; anteil: number | null; wochen: number | null }
/**
 * Budget-Zeilen aus DATEN_BUDGET (scripts/perf/daten-budget.ts, eine Quelle):
 * alle Dateien unter public/rechtsprechung/ und jede, die der Diff berührt.
 * `wochen` = Luft / Wochenzuwachs (abgerundet), nur bei Zuwachs > 0.
 */
export function budgetZeilen(budget: readonly (readonly [string, number])[], vorher: Record<string, number | null>, nachher: Record<string, number | null>, beruehrt: string[]): BudgetZeile[] {
  return budget.filter(([p]) => p.startsWith('public/rechtsprechung/') || beruehrt.includes(p)).map(([pfad, b]) => {
    const v = vorher[pfad] ?? null;
    const n = nachher[pfad] ?? null;
    const zu = v !== null && n !== null ? n - v : 0;
    return { pfad, vorher: v, nachher: n, budget: b, anteil: n === null ? null : n / b, wochen: zu > 0 && n !== null ? Math.max(0, Math.floor((b - n) / zu)) : null };
  });
}
export const BUDGET_WARNUNG = 0.9;
export function budgetBefund(z: BudgetZeile[]): { warnung: string[]; ueber: string[] } {
  const pct = (x: BudgetZeile) => `${x.pfad} ${(100 * (x.anteil ?? 0)).toFixed(1)} %`;
  return {
    warnung: z.filter((x) => x.anteil !== null && x.anteil >= BUDGET_WARNUNG && x.anteil <= 1).map(pct),
    ueber: z.filter((x) => x.anteil !== null && x.anteil > 1).map(pct),
  };
}

// ── Frische je Gericht (Punkt 10) ───────────────────────────────────────────
export const FRISCHE_SCHWELLE_TAGE = 60;
export interface FrischeZeile { gericht: string; quelle: string | null; register: string | null; luecke: number | null; hinweis: string | null }
const tage = (von: string, bis: string) => Math.round((Date.parse(`${bis}T00:00:00Z`) - Date.parse(`${von}T00:00:00Z`)) / 86_400_000);
/**
 * Jüngstes Quelldatum (OCL-Listing, neueste zuerst) gegen jüngstes Registerdatum.
 * Hinweis (kein Entwurf), wenn die Lücke oder das Alter der Quelle die Schwelle
 * übersteigt: OCL selbst alt ⇒ «Quelle hinkt»; OCL frisch, Register alt ⇒
 * «Auswahl/Filter» (kantonKorpus wählt nach Rang, nicht nach Datum — ua-mess-B §10).
 */
export function bewerteFrische(laufdatum: string, gericht: string, quelle: string | null, register: string | null): FrischeZeile {
  if (!quelle) return { gericht, quelle, register, luecke: null, hinweis: 'Quelldatum nicht abrufbar (OCL)' };
  const luecke = register ? tage(register, quelle) : null;
  const alter = tage(quelle, laufdatum);
  let hinweis: string | null = null;
  if (alter > FRISCHE_SCHWELLE_TAGE) hinweis = `Quelle hinkt: jüngstes OCL-Datum ${alter} Tage vor dem Laufdatum`;
  else if (luecke === null) hinweis = 'noch kein Eintrag im Register';
  else if (luecke > FRISCHE_SCHWELLE_TAGE) hinweis = `Auswahl/Filter: OCL frisch, Register ${luecke} Tage älter`;
  return { gericht, quelle, register, luecke, hinweis };
}

// ── Positivliste (A11) ──────────────────────────────────────────────────────
/**
 * Was Quellen und Nachbau schreiben dürfen — ermittelt aus den Schreibstellen
 * (entscheide-schreiben.ts, bs-import/bs-fetch, gen:zaehler, gen:bezuege-
 * zaehler, gen:feed, gen:historie, gen:e2e-shards, datenhaltung:manifest,
 * bge-register-generieren) und den Nachzügen #1099/#1112, gegengeprüft per
 * Offline-Probe (Remap + Projektionen mit neuem --datum, 25.9.2026). Alles
 * andere wird NICHT gestagt und macht den PR zum Entwurf.
 */
export const ERWARTETE_PFADE: RegExp[] = [
  /^public\/rechtsprechung\//,
  /^public\/normtext\/struktur\//, // gen:bezuege-zaehler (Sidecars)
  /^public\/normtext\/historie\//, // gen:historie
  /^public\/feed\//, //               gen:feed
  /^daten\/bs-fiw\/(?:inventar|fehlerliste)\.json$/,
  /^daten-manifest\.json$/,
  /^bibliothek\/rechtsprechung\/bge-register\.md$/,
  /^src\/data\/startseiteZaehler\.generated\.ts$/,
  /^src\/lib\/rechtsprechung\/erfasste-keys\.generated\.ts$/,
  /^e2e\/shard-gruppen\.json$/,
];
/**
 * Pfade aus `git status --porcelain -z -uall`: NUL-getrennt, nie gequotet
 * (Offline-Probe 25.9.2026: «public/rechtsprechung/bezuege/BS-RiE 640.100.json»
 * kam ohne -z in Anführungszeichen). Bei Umbenennung/Kopie (R/C) folgt der alte
 * Pfad als eigenes Feld — er wird übersprungen, der neue zählt.
 */
export function leseStatusZ(z: string): string[] {
  const teile = z.split('\0');
  const out: string[] = [];
  for (let i = 0; i < teile.length; i++) {
    const t = teile[i];
    if (t.length < 4) continue;
    out.push(t.slice(3));
    if (/^[RC]/.test(t)) i++;
  }
  return out;
}

export function teilePfade(dateien: string[]): { erwartet: string[]; unerwartet: string[] } {
  const erwartet: string[] = [];
  const unerwartet: string[] = [];
  for (const p of dateien) (ERWARTETE_PFADE.some((re) => re.test(p)) ? erwartet : unerwartet).push(p);
  return { erwartet, unerwartet };
}

// ── «In Prüfung» (A9) ───────────────────────────────────────────────────────
export const BOT = 'rechtsprechung-wochenlauf-bot';
export const LABEL_IN_PRUEFUNG = 'in-pruefung';
export interface PrLage {
  /** Autor und Committer JEDES Commits in origin/main..branch (auch amend: Committer wechselt). */
  commits: Array<{ autor: string; committer: string }>;
  body: string;
  labels: string[];
  /** Logins von Kommentaren/Reviews mit user.type «User» (keine Bots). */
  menschen: string[];
}
/** Grund, warum der offene Auto-PR NICHT überschrieben werden darf; null = unberührt. */
export function inPruefung(l: PrLage): string | null {
  const fremd = l.commits.find((c) => c.autor !== BOT || c.committer !== BOT);
  if (fremd) return `fremder Commit (Autor ${fremd.autor}, Committer ${fremd.committer})`;
  const verdikt = [...l.body.matchAll(/^Gegenpruefung:\s*(.*)$/gm)].map((m) => m[1].trim()).find((v) => !/^ausstehend\b/.test(v));
  if (verdikt !== undefined) return `Verdikt im Body: «${verdikt.slice(0, 60)}»`;
  if (l.labels.includes(LABEL_IN_PRUEFUNG)) return `Label ${LABEL_IN_PRUEFUNG}`;
  if (l.menschen.length) return `Kommentar/Review von ${[...new Set(l.menschen)].sort().join(', ')}`;
  return null;
}

// ── Richter-Phantome (Lehre #1117/#1122) ────────────────────────────────────
/**
 * Neue Richter-Slugs in public/rechtsprechung/richter.json auf Phantome prüfen:
 * Skill korpus-werkstatt, methodology/rechtsprechung.md (Nachtrag #1122) —
 * Rollenwörter und Einwort-Slugs erkennt check:besetzung nicht (Beleg #1117:
 * «Vorsitz Martin Stupf», «Mark»/«Schweizer»). Der Bestand trägt 239 legitime
 * Einwort-Namen (BGer-Kurzform «Abrecht», Messung 25.9.2026), darum zählen nur
 * NEUE Slugs gegen main: Rollenwort im Namen ⇒ Phantom; Einwort-Name ⇒ zu
 * sichten. Beides macht das Tor rot (Entwurf), damit die prüfende Session jeden
 * neuen Namen sieht, bevor er live geht.
 */
const ROLLENWORT = /(?<![\p{L}])(?:vorsitz\p{L}*|(?:vize|gerichts)?präsident\p{L}*|gerichtsschreiber\p{L}*|aktuar\p{L}*|\p{L}*richter\p{L}*|kammer|instanz|referent\p{L}*|juge|greffi\p{L}*|président\p{L}*|giudice|cancellier\p{L}*|presidente|und|mit|sowie)(?![\p{L}])/iu;
export function richterPhantome(vorher: Record<string, { name: string }>, nachher: Record<string, { name: string }>): string[] {
  const out: string[] = [];
  for (const [slug, { name }] of Object.entries(nachher).sort(([a], [b]) => (a < b ? -1 : 1))) {
    if (slug in vorher) continue;
    if (ROLLENWORT.test(name)) out.push(`${slug} «${name}»: Rollenwort im Namen — Phantom`);
    else if (!/\s/.test(name.trim())) out.push(`${slug} «${name}»: Einwort-Name — gegen den Spruchkörper sichten`);
  }
  return out;
}

// ── Tore (Punkt 3) ──────────────────────────────────────────────────────────
export interface Tor { name: string; code: number; auszug: string }
export const auszug = (log: string, n = 4) => log.trim().split('\n').filter((z) => z.trim()).slice(-n).join('\n');
/**
 * `npm run check` (scripts/run-parallel.ts) in Einzel-Tore zerlegen: je rotem
 * Sub-Check ein Block «FEHLER in <name> (Exit n) — volle Ausgabe:». Ohne Block
 * aber Exit ≠ 0 (Runner selbst gestorben) ⇒ ein Tor «npm run check».
 */
export function zerlegeRunParallel(log: string, code: number): Tor[] {
  const tore: Tor[] = [];
  const re = /FEHLER in (\S+) \(Exit (\d+)\) — volle Ausgabe:\n═+\n([\s\S]*?)(?=\n═{10,}\nFEHLER in |\nrun-parallel: |$)/g;
  for (const m of log.matchAll(re)) tore.push({ name: m[1], code: Number(m[2]), auszug: auszug(m[3]) });
  if (!tore.length) tore.push({ name: 'npm run check', code, auszug: auszug(log) });
  return tore;
}

/**
 * Korpusabhängige e2e-Specs (Punkt 3): Dateiname nennt Rechtsprechung,
 * Entscheid, Bezüge oder Verzahnung, dazu startseite-blatt (Leitentscheid-Link,
 * Kantonal-Kombination). Regel statt Liste, damit neue Specs mitlaufen;
 * Abgleich 25.9.2026 per grep auf Korpus-Pins (ua-mess-A §1).
 */
export function e2eAuswahl(dateien: string[]): string[] {
  return dateien.filter((d) => /\.e2e\.ts$/.test(d) && /rechtsprechung|entscheid|bezuege|verzahnung|startseite-blatt/.test(d)).sort();
}

/** Restzeit bis zur Frist in Minuten (≥ 0); die Uhr liest nur die CLI (§2). */
export const restMinuten = (startMs: number, jetztMs: number, fristMin: number) => Math.max(0, fristMin - (jetztMs - startMs) / 60_000);

// ── Entscheid ───────────────────────────────────────────────────────────────
export type Entscheid = 'kein-diff' | 'entwurf' | 'pr';
export interface Lage {
  inhaltsDiff: boolean;
  /** Quellen mit Exit ≠ 0 oder Ausfall-Zeile (Bug B1: bisher nicht im Entscheid). */
  quellenAus: string[];
  toreRot: string[];
  nachbauRot: string[];
  stichprobe: StichprobenZeile[];
  mergeSchutzSperrt: boolean;
  unerwartet: string[];
  budgetUeber: string[];
  vorwocheVerworfen: string | null;
  /** Vorwochen-Befunde, die nicht erneut grün sind (pruefeVorwoche, wochenlauf-vorwoche.ts — A2). */
  vorwocheOffen?: string[];
  /** Nach der Lauf-Frist übersprungene Prüfschritte (N2). */
  fristAus?: string[];
}

/**
 * Kein Diff → kein PR. Sonst PR — als ENTWURF, sobald etwas rot ist: eine
 * ausgefallene Quelle (auch bei Diff einer anderen), ein Tor, ein Nachbau-
 * Schritt, ein Fehltreffer der Stichprobe, eine Stichprobe ohne einen einzigen
 * prüfbaren Treffer, eine unerwartete Datei, ein gerissenes Budget, eine
 * verworfene Vorwoche, oder ein Diff, den check:merge-schutz NICHT sperren
 * würde. Die letzte Weiche ist der massgebliche Landungsschutz des Wochen-PR:
 * public/rechtsprechung/** allein ist KEIN Risikopfad (behalten() in
 * scripts/gegenpruefung/kern.ts) — gesperrt wird erst über daten-manifest.json,
 * daten/** oder bezuege/*.json. Fehlt jede davon, gäbe es bis zum Verdikt keine
 * Sperre, darum Entwurf.
 */
export function entscheide(l: Lage): { entscheid: Entscheid; gruende: string[] } {
  if (!l.inhaltsDiff) return { entscheid: 'kein-diff', gruende: [] };
  const g: string[] = [];
  if (l.quellenAus.length) g.push(`Quelle ausgefallen: ${l.quellenAus.join(', ')}`);
  if (l.vorwocheVerworfen) g.push(`Vorwoche verworfen: ${l.vorwocheVerworfen}`);
  g.push(...(l.vorwocheOffen ?? []));
  if (l.fristAus?.length) g.push(`Lauf-Frist erreicht, nicht geprüft: ${l.fristAus.join(', ')}`);
  if (l.toreRot.length) g.push(`Tor rot: ${l.toreRot.join(', ')}`);
  if (l.nachbauRot.length) g.push(`Nachbau rot: ${l.nachbauRot.join(', ')}`);
  const fehl = l.stichprobe.filter((s) => s.ergebnis === 'fehltreffer').length;
  if (fehl) g.push(`Stichprobe: ${fehl} Fehltreffer`);
  if (!l.stichprobe.some((s) => s.ergebnis === 'treffer')) g.push('Stichprobe: kein einziger prüfbarer Treffer');
  if (l.unerwartet.length) g.push(`unerwartete Dateien (nicht gestagt): ${l.unerwartet.length}`);
  if (l.budgetUeber.length) g.push(`Budget überschritten: ${l.budgetUeber.join(', ')}`);
  if (!l.mergeSchutzSperrt) g.push('check:merge-schutz würde diesen Diff NICHT sperren (kein Risiko-Pfad)');
  return { entscheid: g.length ? 'entwurf' : 'pr', gruende: g };
}

/** Sperrt check:merge-schutz diesen Diff bis zum Verdikt? Dieselbe Risiko-Definition (kern.ts, §5). */
export function mergeSchutzSperrt(dateien: string[]): boolean {
  return dateien.some((p) => behalten(p));
}
