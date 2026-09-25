// ─── Rechtsprechungs-Wochenlauf: reine Logik (§2, netz- und git-frei) ────────
//
// Kern von scripts/rechtsprechung/wochenlauf.ts (CLI, Netz, Prozesse). Hier
// liegen nur deterministische Entscheide, damit sie ohne Netz testbar sind:
// Bandberechnung, Register-Vergleich vorher/nachher, Ausfall-Erkennung im
// Generator-Log, Stichproben-Auswahl, Identitätsprüfung einer amtlichen Seite,
// Entscheid «kein Diff / Entwurf / PR» und der PR-Bericht.
//
// Entscheid David 25.9.2026 («Vorbereiten, Prüfung vor Live»): der Lauf
// bereitet EINEN PR vor, live geht er erst nach der Gegenprüfung einer
// Session. Nichts hier darf einen Befund unterdrücken — jeder Ausfall, jedes
// rote Tor und jeder Fehltreffer der Stichprobe steht im Bericht.
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
 */
const AUSFALL_MUSTER: RegExp[] = [
  /übersprungen/, // kein \b: «ü» ist für JS-\b kein Wortzeichen
  /nicht erreichbar/,
  /Korpus unberührt/,
  /\bFetch-Fehler\b/,
  /\bABBRUCH\b/,
];
export function erkenneAusfaelle(log: string): string[] {
  const out: string[] = [];
  for (const roh of log.split('\n')) {
    const z = roh.trim();
    if (z && AUSFALL_MUSTER.some((re) => re.test(z)) && !out.includes(z)) out.push(z);
  }
  return out;
}

/** BS-Delta-Plan aus dem Log (Zeilenform: scripts/rechtsprechung/bs-delta.ts, berichteBsDelta). */
export function leseBsDelta(log: string): { aktualisiert: string[]; takedown: string[] } {
  const aktualisiert: string[] = [];
  const takedown: string[] = [];
  for (const z of log.split('\n')) {
    const a = /\[bs-delta\]\s+aktualisiert:\s+(.+)$/.exec(z);
    if (a) aktualisiert.push(a[1].trim());
    const t = /\[bs-delta\]\s+Takedown[^:]*:\s+(\S+)/.exec(z);
    if (t) takedown.push(t[1]);
  }
  return { aktualisiert, takedown };
}

// ── Stichprobe ──────────────────────────────────────────────────────────────
export type Gruppe = 'bge' | 'bs' | 'uebrige';
export function gruppeVon(e: RegEintrag): Gruppe {
  if (e.gericht === 'bge') return 'bge';
  if (e.quelle === 'gerichte-bs') return 'bs';
  return 'uebrige';
}

/**
 * Deterministische Auswahl: reihum BGE → BS → übrige, je Gruppe nach key; alle,
 * wenn weniger als n. Übrige höchstens 2 — ihre Quellen sind meist PDF und
 * damit automatisch nicht prüfbar (pruefeGenerisch); die n Plätze sollen
 * prüfbare BGE/BS-Treffer liefern.
 */
export function waehleStichprobe(neu: RegEintrag[], n: number): RegEintrag[] {
  const gruppen: Record<Gruppe, RegEintrag[]> = { bge: [], bs: [], uebrige: [] };
  for (const e of [...neu].sort((a, b) => (a.key < b.key ? -1 : 1))) gruppen[gruppeVon(e)].push(e);
  // gleichmässig über die Gruppe verteilt (nicht nur die ersten Keys eines Bandes)
  const verteilt = (xs: RegEintrag[], k: number) =>
    xs.length <= k ? xs : Array.from({ length: k }, (_, i) => xs[Math.floor((i * xs.length) / k)]);
  const out: RegEintrag[] = [];
  const reihe: Gruppe[] = ['bge', 'bs', 'uebrige'];
  const anteil: Record<Gruppe, number> = { bge: 0, bs: 0, uebrige: 0 };
  const deckel: Record<Gruppe, number> = { bge: gruppen.bge.length, bs: gruppen.bs.length, uebrige: Math.min(gruppen.uebrige.length, Math.max(2, n - gruppen.bge.length - gruppen.bs.length)) };
  let rest = Math.min(n, deckel.bge + deckel.bs + deckel.uebrige);
  while (rest > 0) {
    for (const g of reihe) if (rest > 0 && anteil[g] < deckel[g]) { anteil[g]++; rest--; }
  }
  for (const g of reihe) out.push(...verteilt(gruppen[g], anteil[g]));
  return out;
}

/** treffer: true = belegt, false = Gegenbeweis (Fehltreffer), null = nicht prüfbar. */
export interface Identitaet { treffer: boolean | null; detail: string }
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
  if (!ref || i < 0) return { treffer: false, detail: 'kein Urteilskopf/keine Fundstelle' };
  const kopf = t.slice(i + 'Urteilskopf'.length, i + 'Urteilskopf'.length + 40);
  if (!new RegExp(`^\\s*${esc(ref).replace(/\s+/g, '\\s+')}(?!\\d)`).test(kopf)) {
    return { treffer: false, detail: `Urteilskopf nennt «${kopf.trim().slice(0, 20)}», erwartet ${ref}` };
  }
  if (istBandjahrPlatzhalter({ datum: e.datum, bgeReferenz: ref })) return { treffer: true, detail: `${ref} (Bandjahr-Platzhalter, nur Fundstelle)` };
  const { aza, datumIso } = parseClirUrteilskopf(html);
  if (datumIso !== e.datum) return { treffer: false, detail: `${ref}: Datum amtlich ${datumIso ?? '–'} ≠ Korpus ${e.datum}` };
  return { treffer: true, detail: `${ref} · ${aza ?? '–'} · ${datumIso}` };
}

/** BS-Portal: «Geschäftsnummer: <nummer>» und «Entscheiddatum: TT.MM.JJJJ» = Korpus. */
export function pruefeBs(html: string, e: RegEintrag): Identitaet {
  const t = text(html);
  const nr = (e.nummer ?? '').trim();
  const m = /Gesch(?:ä|&auml;)ftsnummer:\s*(\S+)/.exec(t);
  if (!nr || !m || m[1] !== nr) return { treffer: false, detail: `Geschäftsnummer amtlich «${m?.[1] ?? '–'}», erwartet «${nr}»` };
  const d = /Entscheiddatum:\s*(\d{2})\.(\d{2})\.(\d{4})/.exec(t);
  const iso = d ? `${d[3]}-${d[2]}-${d[1]}` : null;
  if (iso !== e.datum) return { treffer: false, detail: `${nr}: Entscheiddatum amtlich ${iso ?? '–'} ≠ Korpus ${e.datum}` };
  return { treffer: true, detail: `${nr} · ${iso}` };
}

/**
 * Übrige Gerichte: das (erste) Aktenzeichen steht mit Wortgrenze auf der Quellseite.
 * Nur der POSITIVE Beleg zählt: die Quell-URLs sind oft PDF (BStGer, BE, SG, GR, AG)
 * oder eine JS-Hülle (weblaw) — gemessen 25.9.2026, je jüngster Eintrag. Fehlt das
 * Aktenzeichen, ist das kein Gegenbeweis, sondern «nicht prüfbar» (Handprüfung).
 */
export function pruefeGenerisch(html: string, e: RegEintrag): Identitaet {
  const nr = (e.nummer ?? '').split(',')[0].trim();
  if (!nr) return { treffer: null, detail: 'kein Aktenzeichen im Korpus' };
  if (html.startsWith('%PDF')) return { treffer: null, detail: `${nr}: Quelle ist PDF — Handprüfung` };
  return grenze(nr).test(text(html))
    ? { treffer: true, detail: nr }
    : { treffer: null, detail: `${nr}: nicht im HTML (JS-Hülle?) — Handprüfung` };
}

export function pruefeIdentitaet(html: string, e: RegEintrag): Identitaet {
  const g = gruppeVon(e);
  return g === 'bge' ? pruefeBge(html, e) : g === 'bs' ? pruefeBs(html, e) : pruefeGenerisch(html, e);
}

export interface StichprobenZeile { key: string; url: string | null; ergebnis: 'treffer' | 'fehltreffer' | 'nicht-pruefbar'; detail: string }

// ── Entscheid ───────────────────────────────────────────────────────────────
export type Entscheid = 'kein-diff' | 'entwurf' | 'pr';
export interface Lage {
  inhaltsDiff: boolean;
  toreRot: string[];
  nachbauRot: string[];
  stichprobe: StichprobenZeile[];
  mergeSchutzSperrt: boolean;
}

/**
 * Kein Diff → kein PR. Sonst PR — als ENTWURF, sobald etwas rot ist: ein Tor,
 * ein Nachbau-Schritt, ein Fehltreffer der Stichprobe, eine Stichprobe ohne
 * einen einzigen prüfbaren Treffer, oder ein Diff, den check:merge-schutz
 * NICHT sperren würde (dann fehlte die Landungs-Sperre bis zum Verdikt).
 */
export function entscheide(l: Lage): { entscheid: Entscheid; gruende: string[] } {
  if (!l.inhaltsDiff) return { entscheid: 'kein-diff', gruende: [] };
  const g: string[] = [];
  if (l.toreRot.length) g.push(`Tor rot: ${l.toreRot.join(', ')}`);
  if (l.nachbauRot.length) g.push(`Nachbau rot: ${l.nachbauRot.join(', ')}`);
  const fehl = l.stichprobe.filter((s) => s.ergebnis === 'fehltreffer').length;
  if (fehl) g.push(`Stichprobe: ${fehl} Fehltreffer`);
  if (!l.stichprobe.some((s) => s.ergebnis === 'treffer')) g.push('Stichprobe: kein einziger prüfbarer Treffer');
  if (!l.mergeSchutzSperrt) g.push('check:merge-schutz würde diesen Diff NICHT sperren (kein Risiko-Pfad)');
  return { entscheid: g.length ? 'entwurf' : 'pr', gruende: g };
}

/** Sperrt check:merge-schutz diesen Diff bis zum Verdikt? Dieselbe Risiko-Definition (kern.ts, §5). */
export function mergeSchutzSperrt(dateien: string[]): boolean {
  return dateien.some((p) => behalten(p));
}

// ── Bericht ─────────────────────────────────────────────────────────────────
export interface Schritt { name: string; befehl: string; code: number; ausfaelle: string[] }
export interface Tor { name: string; code: number; auszug: string }
export interface BerichtDaten {
  datum: string;
  baender: { vor: number; lauf: number };
  quellen: Schritt[];
  nachbau: Schritt[];
  vergleich: RegisterVergleich;
  bs: { aktualisiert: string[]; takedown: string[] };
  tore: Tor[];
  stichprobe: StichprobenZeile[];
  entscheid: { entscheid: Entscheid; gruende: string[] };
  mergeSchutzSperrt: boolean;
  laufUrl: string | null;
}

export const TITEL = (datum: string) => `feat(rechtsprechung): Wochen-Nachzug ${datum} (QS-KORPUS)`;
/** Schlussabsatz: jede Zeile < 72 Zeichen; «ausstehend» ist KEIN taugliches Verdikt (squash-trailer.ts). */
export const SCHLUSS = [
  '🤖 Generated with [Claude Code](https://claude.com/claude-code)',
  '',
  'Roadmap: QS-KORPUS',
  'Gegenpruefung: ausstehend — Wochenlauf, Prüfung vor Landung',
].join('\n');

const liste = (xs: string[], max = 40) =>
  xs.length ? xs.slice(0, max).map((x) => `- ${x}`).join('\n') + (xs.length > max ? `\n- … und ${xs.length - max} weitere` : '') : '- keine';

export function baueBericht(d: BerichtDaten): string {
  const s = d.stichprobe;
  const tr = s.filter((x) => x.ergebnis === 'treffer').length;
  const pr = s.filter((x) => x.ergebnis !== 'nicht-pruefbar').length;
  const ausfall = [...d.quellen, ...d.nachbau].filter((q) => q.code !== 0 || q.ausfaelle.length);
  const kopf = d.entscheid.entscheid === 'entwurf'
    ? `> **ENTWURF — rot:** ${d.entscheid.gruende.join(' · ')}`
    : '> Alle Tore grün, Stichprobe ohne Fehltreffer. Landung erst nach Gegenprüfung.';
  return [
    `Automatischer Rechtsprechungs-Wochenlauf ${d.datum} (Entscheid David 25.9.2026: «Vorbereiten, Prüfung vor Live»). **Kein Auto-Merge.** Landung erst, wenn eine Session die Gegenprüfung gemacht hat (Skill korpus-werkstatt, «Wochen-Nachzug prüfen und landen»).`,
    '',
    kopf,
    '',
    '## Zahlen je Gericht',
    '',
    '| Gericht | vorher | nachher | Δ | neuestes Datum |',
    '|---|---:|---:|---:|---|',
    ...d.vergleich.jeGericht.map((z) => `| ${z.gericht} | ${z.vorher} | ${z.nachher} | ${z.nachher - z.vorher >= 0 ? '+' : ''}${z.nachher - z.vorher} | ${z.neuestes ?? '–'} |`),
    '',
    `Neu: ${d.vergleich.neu.length} · entfernt: ${d.vergleich.entfernt.length} · BGE-Bände ${d.baender.vor}+${d.baender.lauf}`,
    '',
    '## Übersprungene Quellen und Ausfälle',
    '',
    ausfall.length
      ? ausfall.map((q) => `- **${q.name}** (Exit ${q.code}${q.code !== 0 ? ', Änderungen dieses Schritts verworfen' : ''})\n${q.ausfaelle.slice(0, 12).map((a) => `  - \`${a.slice(0, 160)}\``).join('\n')}`).join('\n')
      : '- keine',
    '',
    '## Basel-Stadt: Takedowns und aktualisierte Urteile',
    '',
    `Takedowns (aus dem Portal verschwunden, entfernt): ${d.bs.takedown.length}`,
    liste(d.bs.takedown),
    '',
    `Aktualisiert: ${d.bs.aktualisiert.length}`,
    liste(d.bs.aktualisiert),
    '',
    '## Tore',
    '',
    '| Tor | Ergebnis |',
    '|---|---|',
    ...d.tore.map((t) => `| \`${t.name}\` | ${t.code === 0 ? 'grün' : `**ROT** (Exit ${t.code}): ${t.auszug.replace(/\|/g, '\\|').replace(/\n/g, ' ').slice(0, 200)}`} |`),
    '',
    `check:merge-schutz sperrt diesen Diff bis zum Verdikt: **${d.mergeSchutzSperrt ? 'ja' : 'NEIN'}**`,
    '',
    `## Identitäts-Stichprobe (automatisch): ${tr}/${pr} Treffer${s.length - pr ? `, ${s.length - pr} nicht prüfbar` : ''}`,
    '',
    'BGE gegen bger.ch clir (Ausweichadresse search.bger.ch), BS gegen das Portal (Geschäftsnummer + Entscheiddatum), übrige gegen die Quell-URL (Aktenzeichen mit Wortgrenze; PDF/JS-Hülle = nicht prüfbar, Handprüfung).',
    '',
    '| Eintrag | Ergebnis | Beleg |',
    '|---|---|---|',
    ...s.map((x) => `| ${x.url ? `[${x.key}](${x.url})` : x.key} | ${x.ergebnis} | ${x.detail.replace(/\|/g, '\\|')} |`),
    '',
    '## Für die prüfende Session',
    '',
    '- Reihenfolge: erst nach #1112 (BS-Delta) und dem additiven Kantonszweig (Branch daten/rs-stichproben-2026-09-25) einreihen — deren Flags setzt dieser Lauf voraus.',
    '- Korpus-Zahl-Pins in Tests/e2e (z. B. bezuege-facetten) reissen am Zuwachs; nachziehen als eigener test(-Commit mit Nullprobe.',
    d.laufUrl ? `- Lauf: ${d.laufUrl}` : '',
    '',
    SCHLUSS,
    '',
  ].filter((z, i, a) => !(z === '' && a[i - 1] === '')).join('\n');
}

/** Commit-Nachricht (Datei für `git commit -F`); Trailer als letzter Absatz. */
export function baueCommit(d: BerichtDaten): string {
  return [
    TITEL(d.datum),
    '',
    `Automatischer Wochenlauf: ${d.vergleich.neu.length} neu, ${d.vergleich.entfernt.length} entfernt,`,
    `${d.bs.aktualisiert.length} BS aktualisiert. Entscheid: ${d.entscheid.entscheid}.`,
    '',
    'Roadmap: QS-KORPUS',
    'Gegenpruefung: ausstehend — Wochenlauf, Prüfung vor Landung',
    '',
  ].join('\n');
}
