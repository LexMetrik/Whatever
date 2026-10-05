// scripts/materialien/nachzug.ts — Kern des Materialien-Nachzug-Bots (MONITOR, Auftrag David
// 6.10.2026 «mach die materialien»). Aufrufer: nachzug-run.ts (CLI) ← .github/workflows/
// materialien-nachzug.yml (montags 05:43 UTC). Rein bis auf die injizierten Werkzeuge
// (Muster lik/vergleich-kern.ts), damit Reihenfolge, Rauschschutz und Fehlerpfade testbar sind.
//
// ABLAUF (Bauplan .claude/notizen/2026-10-06-materialien-bot-bauplan.md, Befunde 1–4):
//   1. `check:materialien-netz` — Exit 0 ⇒ nichts zu tun. Exit 1 ⇒ stderr-Zeilen
//      «ROT   materialien-netz: <QUELLE>: …» auswerten. Das Tor kennt KEINEN eigenen Exit-Code für
//      «Quelle nicht erreichbar»: Netzfehler, Count-Gate und echte Drift sind alle Exit 1. Darum
//      zählt hier nur als DRIFT, was eine POSITIV-Liste von Befund-Formen trifft (neues Dokument ·
//      entlistet · drift_token abweichend · Stand-Probe «Publiziert-am ≠ committeter Stand»).
//      Alles andere (Live-Crawl/Live-Inventar ROT, Arbiter-Fehler, Kurz-URL-Stichprobe, tote
//      Stand-Probe, Struktur-Drift, unbekannte Form) ist ein HINWEIS ohne Snapshot und ohne PR —
//      ein Netz-Wackler darf weder einen 3118-Abrufe-Vollcrawl auf ESTV-MWST auslösen (Grenze
//      David 6.10.2026: Vollabruf nur bei erkannter Änderung) noch den Lauf rot färben.
//   2. Je driftender Quelle in fester Reihenfolge: `materialien:snapshot` und SOFORT danach
//      `materialien` (Bauplan Befund 2: der Snapshot der nächsten Quelle seedet die Kanten aus den
//      Shards im Arbeitsbaum — ohne Projektion dazwischen gingen die frischen Kanten der vorigen
//      Quelle verloren, die Vollständigkeits-Wache in soft-law-projektion-run.ts bräche Exit 1).
//   3. Einmal `materialien:kaskade --ohne-revisionen` (Begründung in kaskade-run.ts: Soft-Law
//      bewegt die Revisions-Sidecars nie; das Fedlex-Glied zöge sachfremde Änderungen in den PR).
//   4. Pfad-Wache: jede geänderte Datei ausserhalb ERLAUBTE_PFADE ⇒ Werkzeugfehler.
//   5. Rauschschutz (Befund 4): gezählt werden die an soft-law-zustand.jsonl ANGEHÄNGTEN
//      `{"typ":"dok"`-Zeilen — die `lauf`-Kopfzeile entsteht bei jedem Snapshot, auch ohne
//      Änderung, und `abgerufen` erzeugt nie eine dok-Zeile. 0 ⇒ Arbeitsbaum verwerfen, kein PR.
//      Nur NEU ⇒ «anfuegung» (normaler PR). GEÄNDERT / ENTLISTET / WIEDER GELISTET ⇒ «pruefen»
//      (PR als Entwurf).
//   6. WIDERSPRUCH: meldet das Netz-Tor für eine Quelle Drift, der Snapshot derselben Quelle
//      schreibt aber keine dok-Zeile, widersprechen sich Detektor und Reparatur — genau die
//      Fehlerklasse vom 5.9.2026 (soft-law-snapshot.ts, «0 Zustandsänderung(en)» trotz ROT). Das
//      ist ein Werkzeugfehler: der Lauf wird rot (der Wächter sieht ihn), sonst führe der Bot
//      jede Woche denselben Vollcrawl, ohne dass es jemand merkt.
//
//   7. NETZFEHLER IM SNAPSHOT (Entscheid Orchestrator nach Gegenprüfung 6.10.2026, K1): bricht
//      ein Snapshot NACH erkannter Drift an einem erschöpften Abruf ab (fetchMitWiederholung wirft
//      nur, wenn auch der letzte Versuch WARF — Fetch-Fehler/Timeout, nie ein HTTP-Status), ist das
//      kein Werkzeugfehler: Arbeitsbaum verwerfen, Warnung, Status «keine», kein PR — der nächste
//      Lauf versucht erneut. Count-Gate/Struktur-Bruch bei erreichbarer Quelle bleibt rot.
//
// VORPRÜFUNG (Gegenprüfung 6.10.2026, B1) — vor JEDEM Netz-Abruf, im Runner: offener Bot-PR
// (Kopf-Präfix NACHZUG_ZWEIG_PRAEFIX) ⇒ Abbruch, sonst meldete das Netz-Tor dieselbe Drift jede
// Woche erneut (Vollcrawl ESTV-MWST + zweiter, kollidierender PR). Letzter abgeschlossener Lauf
// rot und Auslöser `schedule` ⇒ Abbruch (Widerspruch/Werkzeugfehler noch nicht behoben — sonst
// derselbe Vollcrawl jede Woche); `workflow_dispatch` übersteuert das bewusst (Handprobe nach der
// Reparatur, deren grüner Lauf den Takt wieder freigibt).
//
// Exit-Politik (Monitor-Entscheid David 5.10.2026): Materialien färben nie rot — rot NUR bei
// Werkzeugfehler (Klasse Werkzeugfehler unten bzw. widerspruch ≠ ∅).

export const QUELLEN = ['seco', 'edoeb', 'estv-ks', 'estv-mwst'] as const;
export type Quelle = (typeof QUELLEN)[number];

/** Präfix im Befundtext (check-materialien-netz.ts) → --quelle-Wert von materialien:snapshot. */
const PRAEFIX: Readonly<Record<string, Quelle>> = {
  SECO: 'seco',
  'EDÖB': 'edoeb',
  'ESTV-KS': 'estv-ks',
  'ESTV-MWST': 'estv-mwst',
  // «${a.quelle}: Arbiter-Fehler — …» trägt den kleingeschriebenen Arbiter-Namen.
  seco: 'seco',
  edoeb: 'edoeb',
  'estv-ks': 'estv-ks',
  'estv-mwst': 'estv-mwst',
};

/** Befund-Formen, die ein Snapshot heilen kann (Vertrag mit check-materialien-netz.ts, Test koppelt). */
const DRIFT_FORMEN: readonly RegExp[] = [
  /^neues Dokument '[^']+' live, fehlt im Manifest/,
  /^Dokument '[^']+' im Manifest, aber live nicht mehr/,
  /^drift_token '[^']+' abweichend/,
  /^Stand-Probe \S+ Publiziert-am \S+ ≠ committeter Stand/,
];

const ROT_ZEILE = /^ROT\s+materialien-netz: (.*)$/;
const QUELL_KOPF = /^(ESTV-MWST|ESTV-KS|SECO|EDÖB|estv-mwst|estv-ks|seco|edoeb): (.*)$/;
const ZUSAMMENFASSUNG = /check:materialien-netz — (\d+) Drift-Befund\(e\)/;

export class Werkzeugfehler extends Error {
  constructor(m: string) {
    super(m);
    this.name = 'Werkzeugfehler';
  }
}

export interface Hinweis {
  quelle: Quelle | null;
  text: string;
}

export interface NetzAuswertung {
  /** Quellen mit heilbarer Drift, in QUELLEN-Reihenfolge. */
  drift: Quelle[];
  /** Drift-Befunde je Quelle (für den PR-Text). */
  befunde: Map<Quelle, string[]>;
  /** Nicht heilbare / nicht unterscheidbare Befunde — Warnung, kein Snapshot, kein PR. */
  hinweise: Hinweis[];
}

/**
 * Wertet die Ausgabe (stdout+stderr) eines `check:materialien-netz`-Laufs mit Exit 1 aus.
 * Wirft Werkzeugfehler, wenn das Tor rot ist, ohne einen einzigen Befund in der vereinbarten Form
 * zu nennen, oder wenn Befundzahl und Zusammenfassungszeile auseinanderlaufen (Format verschoben).
 */
export function werteNetzAus(ausgabe: string): NetzAuswertung {
  const befunde = new Map<Quelle, string[]>();
  const hinweise: Hinweis[] = [];
  let rotZeilen = 0;
  for (const roh of ausgabe.split('\n')) {
    const m = ROT_ZEILE.exec(roh.normalize('NFC').replace(/\r$/, ''));
    if (!m) continue;
    rotZeilen++;
    const text = m[1];
    const k = QUELL_KOPF.exec(text);
    if (!k) {
      hinweise.push({ quelle: null, text });
      continue;
    }
    const quelle = PRAEFIX[k[1]];
    if (DRIFT_FORMEN.some((re) => re.test(k[2]))) {
      const liste = befunde.get(quelle) ?? [];
      liste.push(text);
      befunde.set(quelle, liste);
    } else {
      hinweise.push({ quelle, text });
    }
  }
  if (rotZeilen === 0) {
    throw new Werkzeugfehler(
      'check:materialien-netz endete rot, nannte aber keinen Befund der Form «ROT   materialien-netz: …» — ' +
        'Absturz des Tors oder geändertes Ausgabeformat.',
    );
  }
  const z = ZUSAMMENFASSUNG.exec(ausgabe);
  if (!z || Number(z[1]) !== rotZeilen) {
    throw new Werkzeugfehler(
      `check:materialien-netz: ${rotZeilen} Befundzeile(n) gelesen, Zusammenfassung meldet ${z ? z[1] : 'keine Zahl'} — Ausgabeformat verschoben.`,
    );
  }
  return { drift: QUELLEN.filter((q) => befunde.has(q)), befunde, hinweise };
}

// ── Vorprüfung (B1): vor jedem Netz-Abruf ────────────────────────────────────────────────────

/** Kopf-Präfix der Bot-Zweige; der Workflow hängt das Abrufdatum an (Test koppelt). */
export const NACHZUG_ZWEIG_PRAEFIX = 'chore/materialien-nachzug-';
/** `conclusion`-Werte (gh run list) eines roten Laufs. */
const ROTE_SCHLUESSE = new Set(['failure', 'timed_out']);

export interface VorpruefEingabe {
  /** headRefName aller offenen PRs (gh pr list --state open). */
  offeneKoepfe: string[];
  /** conclusion des letzten ABGESCHLOSSENEN Laufs dieses Workflows ('' = keiner). */
  letzterLauf: string;
  /** github.event_name des laufenden Laufs. */
  ausloeser: string;
}

/** Abbruchgrund (Exit 0 + ::notice::, kein Netz-Abruf) oder null = Nachzug fahren. */
export function vorpruefung(v: VorpruefEingabe): string | null {
  const offen = v.offeneKoepfe.map((k) => k.trim()).filter((k) => k.startsWith(NACHZUG_ZWEIG_PRAEFIX));
  if (offen.length) {
    return `Nachzug-PR noch offen (${offen.join(', ')}) — erst prüfen und landen oder schliessen; kein erneuter Abruf.`;
  }
  if (v.ausloeser === 'schedule' && ROTE_SCHLUESSE.has(v.letzterLauf.trim())) {
    return `Letzter Lauf endete «${v.letzterLauf.trim()}» (Werkzeugfehler/Widerspruch offen) — Takt pausiert bis zu einem grünen Lauf per workflow_dispatch.`;
  }
  return null;
}

// ── Netzfehler im Snapshot (K1) ──────────────────────────────────────────────────────────────

/** Schlusszeile von soft-law-snapshot.ts bei Abbruch + Wurf-Text von fetchMitWiederholung (Test koppelt). */
const SNAPSHOT_ROT = /^soft-law-snapshot ROT: (.*)$/;
const ERSCHOEPFT = /^fetchMitWiederholung: \d+ Versuche erschöpft für \S+ — /;

/**
 * Der Abrufgrund, wenn ein roter Snapshot GENAU an einem erschöpften Abruf scheiterte (stderr),
 * sonst null (⇒ Werkzeugfehler). Verlangt genau eine ROT-Schlusszeile.
 */
export function netzfehlerAus(stderr: string): string | null {
  const rot = stderr
    .split('\n')
    .map((z) => SNAPSHOT_ROT.exec(z.normalize('NFC').replace(/\r$/, '')))
    .filter((m): m is RegExpExecArray => m !== null);
  if (rot.length !== 1) return null;
  return ERSCHOEPFT.test(rot[0][1]) ? rot[0][1] : null;
}

// ── Rauschschutz: angehängte Zustandszeilen klassifizieren ────────────────────────────────────

export type NachzugStatus = 'keine' | 'anfuegung' | 'pruefen';

export interface QuellAenderung {
  neu: string[];
  geaendert: string[];
  entlistet: string[];
  wiedergelistet: string[];
}

export interface Klassifikation {
  status: NachzugStatus;
  /** Je Quelle, die in diesem Lauf einen Snapshot geschrieben hat (lauf-Kopfzeile). */
  jeQuelle: Map<Quelle, QuellAenderung>;
  dokZeilen: number;
}

interface Zeilenkern {
  typ: 'lauf' | 'dok';
  id?: string;
  status?: string;
  quelle?: string;
}

function parseZeilen(text: string, wo: string): Zeilenkern[] {
  const out: Zeilenkern[] = [];
  text.split('\n').forEach((linie, i) => {
    const t = linie.trim();
    if (t === '') return;
    let o: unknown;
    try {
      o = JSON.parse(t);
    } catch {
      throw new Werkzeugfehler(`soft-law-zustand.jsonl (${wo}) Z.${i + 1}: kein gültiges JSON.`);
    }
    const z = o as Zeilenkern;
    if (z?.typ === 'lauf') {
      if (!QUELLEN.includes(z.quelle as Quelle)) {
        throw new Werkzeugfehler(`soft-law-zustand.jsonl (${wo}) Z.${i + 1}: lauf-Zeile mit unbekannter Quelle «${String(z.quelle)}».`);
      }
    } else if (z?.typ === 'dok') {
      if (typeof z.id !== 'string' || (z.status !== 'gelistet' && z.status !== 'entlistet')) {
        throw new Werkzeugfehler(`soft-law-zustand.jsonl (${wo}) Z.${i + 1}: dok-Zeile ohne id oder mit Status «${String(z.status)}».`);
      }
    } else {
      throw new Werkzeugfehler(`soft-law-zustand.jsonl (${wo}) Z.${i + 1}: unbekannter typ «${String(z?.typ)}».`);
    }
    out.push(z);
  });
  return out;
}

/**
 * Vergleicht den committeten Zustand (alt, HEAD) mit dem Arbeitsbaum (neu). Das Manifest ist
 * append-only: neu MUSS mit alt beginnen, sonst Werkzeugfehler. Jede angehängte dok-Zeile gehört
 * zur vorangehenden lauf-Kopfzeile (soft-law-snapshot.ts schreibt «lauf, dann dessen doks»).
 */
export function klassifiziereZustand(alt: string, neu: string): Klassifikation {
  if (!neu.startsWith(alt)) {
    throw new Werkzeugfehler('soft-law-zustand.jsonl ist nicht append-only fortgeschrieben (Arbeitsbaum beginnt nicht mit HEAD).');
  }
  const letzter = new Map<string, string>();
  for (const z of parseZeilen(alt, 'HEAD')) if (z.typ === 'dok') letzter.set(z.id!, z.status!);

  const jeQuelle = new Map<Quelle, QuellAenderung>();
  let aktuell: QuellAenderung | null = null;
  let dokZeilen = 0;
  for (const z of parseZeilen(neu.slice(alt.length), 'angehängt')) {
    if (z.typ === 'lauf') {
      const q = z.quelle as Quelle;
      aktuell = jeQuelle.get(q) ?? { neu: [], geaendert: [], entlistet: [], wiedergelistet: [] };
      jeQuelle.set(q, aktuell);
      continue;
    }
    if (!aktuell) throw new Werkzeugfehler('soft-law-zustand.jsonl: angehängte dok-Zeile vor jeder lauf-Kopfzeile.');
    dokZeilen++;
    const vorher = letzter.get(z.id!);
    if (z.status === 'entlistet') aktuell.entlistet.push(z.id!);
    else if (vorher === 'gelistet') aktuell.geaendert.push(z.id!);
    else if (vorher === 'entlistet') aktuell.wiedergelistet.push(z.id!);
    else aktuell.neu.push(z.id!);
    letzter.set(z.id!, z.status!);
  }
  let status: NachzugStatus = 'keine';
  if (dokZeilen > 0) {
    const nurNeu = [...jeQuelle.values()].every((a) => a.geaendert.length + a.entlistet.length + a.wiedergelistet.length === 0);
    status = nurNeu ? 'anfuegung' : 'pruefen';
  }
  return { status, jeQuelle, dokZeilen };
}

// ── Pfad-Wache ─────────────────────────────────────────────────────────────────────────────────

/**
 * Was ein Soft-Law-Nachzug ändern darf (Bauplan Befund 3, ohne die Revisions-Pfade — s. kaskade-run.ts
 * `--ohne-revisionen`). Ordner enden auf «/». Der Workflow staged GENAU diese Pfade (Test koppelt).
 */
export const ERLAUBTE_PFADE: readonly string[] = [
  'bibliothek/register/soft-law-zustand.jsonl',
  'public/materialien/',
  'src/data/startseiteZaehler.generated.ts',
  'daten-manifest.json',
];

/** Pfade aus `git status --porcelain=v1 -uall` (core.quotePath=false), Umbenennungen beidseitig. */
export function geaendertePfade(porcelain: string): string[] {
  const out: string[] = [];
  for (const z of porcelain.split('\n')) {
    if (z.trim() === '') continue;
    for (const p of z.slice(3).split(' -> ')) out.push(p.replace(/^"(.*)"$/, '$1'));
  }
  return out;
}

export function fremdePfade(porcelain: string): string[] {
  return geaendertePfade(porcelain).filter(
    (p) => !ERLAUBTE_PFADE.some((e) => (e.endsWith('/') ? p.startsWith(e) : p === e)),
  );
}

// ── Ablauf ─────────────────────────────────────────────────────────────────────────────────────

export interface Lauf {
  status: number;
  ausgabe: string;
}

/** Seiteneffekte, injiziert (CLI: echte Prozesse/git; Test: Attrappen). */
export interface Werkzeuge {
  /**
   * `npm run <skript> -- <args>`; erfasst=true ⇒ stdout+stderr in `ausgabe`; sonst stdout live
   * durchgereicht und nur stderr in `ausgabe` (Netzfehler-Erkennung K1).
   */
  npm(skript: string, args: string[], erfasst?: boolean): Lauf;
  gitStatus(): string;
  /** Inhalt des Zustands-Manifests in HEAD bzw. im Arbeitsbaum. */
  zustandHead(): string;
  zustandArbeitsbaum(): string;
  /** Arbeitsbaum auf HEAD zurück (nur ERLAUBTE_PFADE). */
  verwerfe(): void;
  log(s: string): void;
  warnung(s: string): void;
}

export interface NachzugErgebnis {
  status: NachzugStatus;
  /** Quellen, für die ein Snapshot gefahren wurde. */
  quellen: Quelle[];
  hinweise: Hinweis[];
  /** Drift gemeldet, aber per Filter ausgelassen (workflow_dispatch-Eingabe «quellen»). */
  ausgelassen: Quelle[];
  /** Drift gemeldet, Snapshot ohne dok-Zeile ⇒ Lauf rot (Kopf Ziff. 6). */
  widerspruch: Quelle[];
  befunde: Map<Quelle, string[]>;
  klassifikation: Klassifikation | null;
  /** Snapshot an erschöpftem Abruf abgebrochen (K1) ⇒ verworfen, kein PR, nächster Lauf erneut. */
  netzfehler: string | null;
}

export function parseQuellenFilter(roh: string | undefined): Quelle[] | null {
  if (roh === undefined || roh.trim() === '') return null;
  const teile = roh.split(',').map((s) => s.trim()).filter(Boolean);
  for (const t of teile) {
    if (!QUELLEN.includes(t as Quelle)) throw new Werkzeugfehler(`--quellen: unbekannte Quelle «${t}» (erlaubt: ${QUELLEN.join(', ')}).`);
  }
  return teile as Quelle[];
}

export function nachzug(datum: string, filter: Quelle[] | null, w: Werkzeuge): NachzugErgebnis {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(datum)) throw new Werkzeugfehler('--datum=YYYY-MM-DD erforderlich (§2, kein Date.now).');
  const leer: NachzugErgebnis = {
    status: 'keine', quellen: [], hinweise: [], ausgelassen: [], widerspruch: [], befunde: new Map(), klassifikation: null,
    netzfehler: null,
  };
  const vorher = w.gitStatus();
  if (vorher.trim() !== '') throw new Werkzeugfehler(`Arbeitsbaum nicht sauber vor dem Nachzug:\n${vorher}`);

  w.log('── check:materialien-netz ──');
  const netz = w.npm('check:materialien-netz', [], true);
  if (netz.status === 0) {
    w.log('Keine Drift — nichts zu tun.');
    return leer;
  }
  if (netz.status !== 1) throw new Werkzeugfehler(`check:materialien-netz endete mit Exit ${netz.status} (erwartet 0 oder 1).`);
  const a = werteNetzAus(netz.ausgabe);
  for (const h of a.hinweise) w.warnung(`Materialien-Netz (${h.quelle ?? '?'}) nicht per Snapshot heilbar — Hinweis, kein PR: ${h.text}`);
  const quellen = a.drift.filter((q) => !filter || filter.includes(q));
  const ausgelassen = a.drift.filter((q) => !quellen.includes(q));
  for (const q of ausgelassen) w.warnung(`Drift ${q} gemeldet, per Eingabe «quellen» ausgelassen.`);
  const basis: NachzugErgebnis = { ...leer, hinweise: a.hinweise, ausgelassen, befunde: a.befunde };
  if (quellen.length === 0) {
    w.log('Keine per Snapshot heilbare Drift — kein PR.');
    return basis;
  }

  for (const q of quellen) {
    w.log(`── Quelle ${q}: materialien:snapshot, dann materialien ──`);
    const s = w.npm('materialien:snapshot', [`--datum=${datum}`, `--quelle=${q}`]);
    if (s.status !== 0) {
      const nf = netzfehlerAus(s.ausgabe);
      if (nf === null) throw new Werkzeugfehler(`materialien:snapshot --quelle=${q} rot (Exit ${s.status}).`);
      verwirf(w);
      w.warnung(`Netzfehler beim Nachladen (${q}) — nächster Lauf versucht erneut; Änderungen verworfen, kein PR: ${nf}`);
      return { ...basis, netzfehler: `${q}: ${nf}` };
    }
    const p = w.npm('materialien', [`--datum=${datum}`]);
    if (p.status !== 0) throw new Werkzeugfehler(`materialien (Projektion nach ${q}) rot (Exit ${p.status}).`);
  }
  w.log('── materialien:kaskade --ohne-revisionen ──');
  const k = w.npm('materialien:kaskade', [`--datum=${datum}`, '--ohne-revisionen']);
  if (k.status !== 0) throw new Werkzeugfehler(`materialien:kaskade rot (Exit ${k.status}).`);

  const fremd = fremdePfade(w.gitStatus());
  if (fremd.length) throw new Werkzeugfehler(`Nachzug änderte Dateien ausserhalb der erlaubten Pfade: ${fremd.join(', ')}`);

  const kl = klassifiziereZustand(w.zustandHead(), w.zustandArbeitsbaum());
  const widerspruch = quellen.filter((q) => {
    const x = kl.jeQuelle.get(q);
    return !x || x.neu.length + x.geaendert.length + x.entlistet.length + x.wiedergelistet.length === 0;
  });
  for (const q of widerspruch) {
    w.warnung(`WIDERSPRUCH ${q}: check:materialien-netz meldet Drift, der Snapshot schrieb keine Zustandsänderung — Detektor oder Snapshot defekt (Lauf wird rot).`);
  }
  if (kl.status === 'keine') {
    verwirf(w);
    w.log('Nur Lauf-Kopfzeilen/Datumsstempel — Arbeitsbaum verworfen, kein PR.');
  }
  return { ...basis, status: kl.status, quellen, widerspruch, klassifikation: kl };
}

function verwirf(w: Werkzeuge): void {
  w.verwerfe();
  const rest = w.gitStatus();
  if (rest.trim() !== '') throw new Werkzeugfehler(`Verwerfen liess Änderungen stehen:\n${rest}`);
}

// ── PR-Text ────────────────────────────────────────────────────────────────────────────────────

export function prText(e: NachzugErgebnis, datum: string): string {
  const z: string[] = [];
  z.push(`Automatischer Lauf \`materialien-nachzug.yml\` (\`scripts/materialien/nachzug.ts\`), Abrufdatum ${datum}, Bot-Tor: **${e.status}**.`);
  z.push('');
  if (e.status === 'pruefen') {
    z.push('**ENTWURF:** mindestens ein bestehendes Dokument wurde geändert, entlistet oder wieder gelistet — Inhalt und Kanten gegen die Amtsquelle prüfen, bevor der Entwurf freigegeben wird.');
    z.push('');
  }
  z.push('| Quelle | neu | geändert | entlistet | wieder gelistet |');
  z.push('|---|---|---|---|---|');
  const f = (l: string[] | undefined) => (l && l.length ? l.join(', ') : '—');
  for (const q of e.quellen) {
    const x = e.klassifikation?.jeQuelle.get(q);
    z.push(`| ${q} | ${f(x?.neu)} | ${f(x?.geaendert)} | ${f(x?.entlistet)} | ${f(x?.wiedergelistet)} |`);
  }
  z.push('');
  z.push('Drift-Befunde von `check:materialien-netz`:');
  for (const q of e.quellen) for (const b of e.befunde.get(q) ?? []) z.push(`- ${b}`);
  if (e.hinweise.length) {
    z.push('');
    z.push('Hinweise ohne Snapshot (nicht per Snapshot heilbar oder nicht von Netzfehlern unterscheidbar):');
    for (const h of e.hinweise) z.push(`- ${h.text}`);
  }
  if (e.widerspruch.length) {
    z.push('');
    z.push(`**Widerspruch Detektor ↔ Snapshot:** ${e.widerspruch.join(', ')} — Drift gemeldet, aber keine Zustandsänderung geschrieben (Lauf rot).`);
  }
  z.push('');
  z.push('Kaskade: je Quelle `materialien:snapshot` → `materialien`, dann `materialien:kaskade --ohne-revisionen` (Revisions-Sidecars führt fedlex-frische.yml nach). NIE Auto-Merge: Risikopfad (istRisikoPfad), Gegenprüfung nachgelagert.');
  return z.join('\n') + '\n';
}
