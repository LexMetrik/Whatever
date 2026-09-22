/**
 * `npm run gen:tokens` (schreibt) · `npm run check:tokens-drift` (prüft)
 * ───────────────────────────────────────────────────────────────────────────
 * DIE EINE TOKEN-QUELLE (W2·29-WERKBANK-TOKENS, Fahrplan FAHRPLAN-WERKBANK-
 * UMBAU §4; Rats-Auflage 2 «eine Token-Quelle»).
 *
 * `design/tokens.json` ist die Quelle. Aus ihr entstehen ZWEI deterministische
 * Projektionen (§5 — keine zweite Wahrheit):
 *
 *   (a) die Token-Blöcke in `src/index.css`: je ein Abschnitt zwischen
 *       `@generated tokens:start` und `@generated tokens:end`, einmal in
 *       `:root` (helle Werte + alle skalaren) und einmal in `html.dark`
 *       (nur die Token mit eigenem Dunkel-Wert).
 *   (b) `tailwind.tokens.generated.js`: die Token-Teile der Tailwind-Konfig
 *       (colors · fontFamily · borderRadius · boxShadow · zIndex).
 *       `tailwind.config.js` importiert sie und ergänzt von Hand, was NICHT
 *       aus Token stammt (maxWidth, minHeight, transition*, die color-mix-
 *       Rezepte `line`/`rule-artikel`/`*-bg`).
 *   (c) die Typo-Skala (`fontSize`) als Marker-Block IN `tailwind.config.js`.
 *       Sie bleibt dort und wandert NICHT in die Modul-Datei, weil zwei
 *       Vitest-Fälle sie am WORTLAUT dieser Datei festnageln —
 *       `src/tests/leser-typo-tokens.test.ts` und
 *       `src/tests/leser-schriftskala.test.ts` lesen `tailwind.config.js` als
 *       Text und halten die drei Leser-Stufen gegen `leserSchrift.ts`
 *       (§5-Spiegel). §6.3 verbietet, einen Test für einen Umbau anzupassen;
 *       also folgt die Projektion dem Konsumenten, nicht umgekehrt. Eine
 *       Quelle bleibt es dadurch: der Block ist generiert wie die anderen zwei.
 *
 * WAS NICHT AUS DER QUELLE KOMMT, bleibt handgeschrieben AUSSERHALB der
 * Marker: color-mix()-Rezepte (`--line`, `--rule-artikel`, `--sage-bg` …),
 * Mischverhältnisse (`--status-tint`), calc()/clamp()/max() (`--app-kopf-h`,
 * `--timer-fs`, `--hochgestellt`), die Motion-Familie (`--dur-*`, `--ease`)
 * und komponentenlokale Variablen. Begründung je Fall: der Token-Quelle
 * beigelegte Liste im PR #… (W2·29-WERKBANK-TOKENS).
 *
 * VIER WACHEN (§6.7 — das Tor muss scheitern können; Rot-Beweise im PR-Body):
 *   (1) jeder Token-Name der Quelle steht GENAU EINMAL im generierten Block;
 *   (2) jede Custom-Property innerhalb der Marker stammt aus der Quelle;
 *   (3) kein Token-Name der Quelle ist ausserhalb der Marker in `src/**\/*.css`
 *       noch einmal definiert (Doppel-Definitions-Wache);
 *   (4) Namen sind in der Quelle eindeutig.
 * Dazu im `--check`-Modus der Drift-Vergleich generiert ↔ Datei, der die
 * abweichenden Zeilen druckt und mit Exit 1 endet.
 *
 * DETERMINISTISCH (§2): kein Netz, keine Uhr, kein Zufall; die Ausgabe folgt
 * ausschliesslich der Reihenfolge in `design/tokens.json`.
 */
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

// ── Orte ────────────────────────────────────────────────────────────────────
const QUELLE = 'design/tokens.json';
const CSS = 'src/index.css';
const TW_DATEI = 'tailwind.tokens.generated.js';
const TW_KONFIG = 'tailwind.config.js';
const CSS_WURZEL = 'src';

const MARKER_START =
  '/* @generated tokens:start — Quelle design/tokens.json, npm run gen:tokens; nie von Hand */';
const MARKER_ENDE = '/* @generated tokens:end */';

/** Zeilenbreite der erzeugten Kommentare (Einzug eingerechnet). */
const BREITE = 100;

// ── Gestalt der Quelle ──────────────────────────────────────────────────────
type Wert = string | { light: string; dark: string };
type Token = { name: string; value: Wert; usage?: string; usageDark?: string };
type Stil = {
  name: string;
  fontSize: string;
  lineHeight: string;
  fontWeight?: number;
  letterSpacing?: string;
  usage?: string;
};
type Familie = { value: string; usage?: string };
type Quelle = {
  color: { tokens: Token[] };
  type: { families: Record<string, Familie>; groups: { name: string; styles: Stil[] }[] };
  spacing: { tokens: Token[] };
  radius: { tokens: Token[] };
  shadow: { tokens: Token[] };
  zIndex: { tokens: Token[] };
};

/**
 * SONDERFALL-TABELLE TAILWIND-FARBEN (die Gruppierung leitet sich sonst
 * mechanisch aus dem Namen ab: `a-b` → `a: { b }`, `a` → `a: { DEFAULT }`,
 * eine Gruppe mit NUR `DEFAULT` wird zur flachen Zeichenkette).
 *
 * OHNE Utility — die Token leben ausschliesslich hinter `var()` in
 * `src/index.css`; ein Tailwind-Eintrag wäre eine Klasse, die niemand ruft:
 *   ink-fixed-dark / ink-fixed-light  Solitäre, nur Speiser anderer Token
 *   placeholder                       nur `.lc-input::placeholder`
 *   focus                             nur `--ring` / `:focus-visible`
 *   brass-line                        Call-Sites greifen die Rolle `accent-line`
 *   scrim / scrim-dialog / scrim-voll  nur `background` der Overlay-Flächen
 */
const OHNE_UTILITY = new Set([
  'ink-fixed-dark',
  'ink-fixed-light',
  'placeholder',
  'focus',
  'brass-line',
  'scrim',
  'scrim-dialog',
  'scrim-voll',
]);

/** Schrift-Ketten HINTER dem Token (Systemschriften; nicht Teil der Quelle). */
const FONT_FALLBACK: Record<string, string[]> = {
  display: ['system-ui', 'sans-serif'],
  sans: ['system-ui', 'sans-serif'],
  mono: ['ui-monospace', 'monospace'],
  serif: ['Georgia', 'serif'],
};

/**
 * `borderRadius.DEFAULT` (= die nackte Klasse `rounded`) liegt seit 31.8.2026
 * auf demselben Token wie `rounded-sm` statt auf Tailwinds eigenem Default.
 * Beide Werte waren damals 4 px — die Angleichung war visuell wirkungslos und
 * rein latent. Sie schliesst aber die `rounded`-Fundstellen an die
 * Haus-Radius-Skala an: ohne sie liefe eine künftige Rekalibrierung von
 * `--radius-sm` an genau diesen Stellen still vorbei und die Kanten der Seite
 * würden zweierlei (§5, Design-Konsistenz E-Mitgedacht a).
 */
const RADIUS_DEFAULT = 'radius-sm';

// ── Hilfen ──────────────────────────────────────────────────────────────────
/** `{brass-700}` → `var(--brass-700)`; mehrere Aliase je Wert sind erlaubt. */
function aliasAufVar(wert: string): string {
  return wert.replace(/\{([\w-]+)\}/g, 'var(--$1)');
}

function umbrich(zeile: string, platz: number): string[] {
  if (zeile.length <= platz) return [zeile];
  const raus: string[] = [];
  let akt = '';
  for (const wort of zeile.split(' ')) {
    if (akt && `${akt} ${wort}`.length > platz) {
      raus.push(akt);
      akt = wort;
    } else akt = akt ? `${akt} ${wort}` : wort;
  }
  if (akt) raus.push(akt);
  return raus;
}

/**
 * Setzt einen Erläuterungstext als CSS-Blockkommentar. Die ZEILENSTRUKTUR der
 * Quelle bleibt erhalten (Messreihen und Tabellen in den Texten stehen in
 * Spalten); nur Zeilen jenseits der Breite werden zusätzlich umbrochen.
 */
function kommentar(text: string, einzug: string): string[] {
  const zeilen = text
    .split('\n')
    .map((z) => z.trimEnd())
    .flatMap((z) => umbrich(z, BREITE - einzug.length - 3));
  if (zeilen.length === 0) return [];
  if (zeilen.length === 1) return [`${einzug}/* ${zeilen[0]} */`];
  return zeilen.map((z, i) => {
    if (i === 0) return `${einzug}/* ${z}`;
    if (i === zeilen.length - 1) return `${einzug}   ${z} */`;
    return z === '' ? '' : `${einzug}   ${z}`;
  });
}

// ── (a) CSS-Blöcke ──────────────────────────────────────────────────────────
type Eintrag = { name: string; wert: string; text?: string };

/** Alle Token der Quelle in Ausgabe-Reihenfolge, als Name/Wert-Paare je Modus. */
function eintraege(q: Quelle, modus: 'light' | 'dark'): Eintrag[] {
  const raus: Eintrag[] = [];
  const nimm = (t: Token) => {
    if (typeof t.value === 'object') {
      raus.push({ name: t.name, wert: aliasAufVar(t.value[modus]), text: modus === 'light' ? t.usage : t.usageDark });
    } else if (modus === 'light') {
      raus.push({ name: t.name, wert: aliasAufVar(t.value), text: t.usage });
    }
  };
  q.color.tokens.forEach(nimm);
  if (modus === 'light')
    for (const [name, familie] of Object.entries(q.type.families))
      raus.push({ name: `font-${name}`, wert: familie.value, text: familie.usage });
  q.spacing.tokens.forEach(nimm);
  q.radius.tokens.forEach(nimm);
  q.shadow.tokens.forEach(nimm);
  q.zIndex.tokens.forEach(nimm);
  return raus;
}

function cssBlock(q: Quelle, modus: 'light' | 'dark', einzug: string): string {
  const zeilen: string[] = [`${einzug}${MARKER_START}`];
  for (const e of eintraege(q, modus)) {
    if (e.text) zeilen.push(...kommentar(e.text, einzug));
    zeilen.push(`${einzug}--${e.name}: ${e.wert};`);
  }
  zeilen.push(`${einzug}${MARKER_ENDE}`);
  return zeilen.join('\n');
}

/** Ersetzt der Reihe nach jeden Marker-Abschnitt einer Datei durch `inhalt`. */
function ersetzeMarker(datei: string, text: string, abschnitte: string[]): string {
  let rest = text;
  let raus = '';
  for (const inhalt of abschnitte) {
    const von = rest.indexOf(MARKER_START);
    if (von < 0) throw new Error(`${datei}: Marker «tokens:start» fehlt (erwartet ${abschnitte.length} Abschnitte).`);
    const bis = rest.indexOf(MARKER_ENDE, von);
    if (bis < 0) throw new Error(`${datei}: Marker «tokens:end» fehlt nach Position ${von}.`);
    const zeilenanfang = rest.lastIndexOf('\n', von) + 1;
    raus += rest.slice(0, zeilenanfang) + inhalt;
    rest = rest.slice(bis + MARKER_ENDE.length);
  }
  if (rest.includes(MARKER_START)) throw new Error(`${datei}: mehr Marker-Abschnitte als erwartet (${abschnitte.length}).`);
  return raus + rest;
}

/** (c) Die Typo-Skala als Marker-Block für `tailwind.config.js`. */
function fontSizeBlock(q: Quelle, einzug: string): string {
  const zeilen: string[] = [`${einzug}${MARKER_START}`];
  for (const gruppe of q.type.groups) {
    zeilen.push(...kommentar(`── ${gruppe.name} ──`, einzug));
    for (const s of gruppe.styles) {
      if (s.usage) zeilen.push(...kommentar(s.usage, einzug));
      const zusatz = [`lineHeight: '${s.lineHeight}'`];
      if (s.letterSpacing !== undefined) zusatz.push(`letterSpacing: '${s.letterSpacing}'`);
      if (s.fontWeight !== undefined) zusatz.push(`fontWeight: ${s.fontWeight}`);
      zeilen.push(`${einzug}'${s.name}': ['${s.fontSize}', { ${zusatz.join(', ')} }],`);
    }
  }
  zeilen.push(`${einzug}${MARKER_ENDE}`);
  return zeilen.join('\n');
}

// ── (b) Tailwind-Projektion ─────────────────────────────────────────────────
type JsWert = string | string[] | { [k: string]: JsWert } | [string, Record<string, string | number>];

function schluessel(k: string): string {
  return /^[A-Za-z_$][\w$]*$/.test(k) || /^\d+$/.test(k) ? k : `'${k}'`;
}

function js(wert: unknown, einzug: string): string {
  if (typeof wert === 'string') return `'${wert}'`;
  if (typeof wert === 'number') return String(wert);
  if (Array.isArray(wert)) return `[${wert.map((w) => js(w, einzug)).join(', ')}]`;
  const paare = Object.entries(wert as Record<string, unknown>).map(
    ([k, v]) => `${einzug}  ${schluessel(k)}: ${js(v, `${einzug}  `)},`,
  );
  return `{\n${paare.join('\n')}\n${einzug}}`;
}

function tailwindFarben(q: Quelle): Record<string, JsWert> {
  const gruppen = new Map<string, Record<string, string>>();
  const folge: string[] = [];
  for (const t of q.color.tokens) {
    if (OHNE_UTILITY.has(t.name)) continue;
    const strich = t.name.indexOf('-');
    const gruppe = strich < 0 ? t.name : t.name.slice(0, strich);
    const blatt = strich < 0 ? 'DEFAULT' : t.name.slice(strich + 1);
    if (!gruppen.has(gruppe)) {
      gruppen.set(gruppe, {});
      folge.push(gruppe);
    }
    gruppen.get(gruppe)![blatt] = `var(--${t.name})`;
  }
  const raus: Record<string, JsWert> = {};
  for (const gruppe of folge) {
    const blaetter = gruppen.get(gruppe)!;
    const namen = Object.keys(blaetter);
    // Eine Gruppe mit NUR `DEFAULT` ist keine Gruppe, sondern eine Farbe.
    raus[gruppe] = namen.length === 1 && namen[0] === 'DEFAULT' ? blaetter.DEFAULT : blaetter;
  }
  return raus;
}

function praefixMap(tokens: Token[], praefix: string): Record<string, string> {
  const raus: Record<string, string> = {};
  for (const t of tokens)
    if (t.name.startsWith(praefix)) raus[t.name.slice(praefix.length)] = `var(--${t.name})`;
  return raus;
}

function tailwindDatei(q: Quelle): string {
  const radius = praefixMap(q.radius.tokens, 'radius-');
  const schriften: Record<string, string[]> = {};
  for (const name of Object.keys(q.type.families))
    schriften[name] = [`var(--font-${name})`, ...(FONT_FALLBACK[name] ?? [])];

  const teile: Array<[string, unknown]> = [
    ['colors', tailwindFarben(q)],
    ['fontFamily', schriften],
    ['borderRadius', { DEFAULT: `var(--${RADIUS_DEFAULT})`, ...radius }],
    ['boxShadow', praefixMap(q.shadow.tokens, 'shadow-')],
    ['zIndex', praefixMap(q.zIndex.tokens, 'z-')],
  ];

  const kopf = [
    '// @generated — erzeugt aus design/tokens.json durch `npm run gen:tokens`.',
    '// NIE VON HAND ÄNDERN: `npm run check:tokens-drift` hält Quelle und diese',
    '// Projektion byte-gleich (W2·29-WERKBANK-TOKENS, CLAUDE.md §5).',
    '//',
    '// `tailwind.config.js` importiert die Teile hier und ergänzt von Hand, was',
    '// NICHT aus Token stammt — maxWidth, minHeight, transition*, screens und die',
    '// color-mix-Rezepte (`line`, `rule-artikel`/`-struktur`, `*-bg`).',
    '//',
    '// Die Typo-Skala (`fontSize`) fehlt hier mit Absicht: sie steht als eigener',
    '// @generated-Block IN `tailwind.config.js` — Begründung im Kopf von',
    '// `scripts/design/tokens-generieren.ts` (Projektion (c)).',
    '',
  ];
  const koerper = teile.map(([name, wert]) => `export const ${name} = ${js(wert, '')};\n`);
  const fuss = `export default { ${teile.map(([n]) => n).join(', ')} };\n`;
  return `${kopf.join('\n')}${koerper.join('\n')}\n${fuss}`;
}

// ── Wachen ──────────────────────────────────────────────────────────────────
function cssDateien(wurzel: string): string[] {
  const raus: string[] = [];
  for (const e of readdirSync(wurzel, { withFileTypes: true })) {
    const p = join(wurzel, e.name);
    if (e.isDirectory()) raus.push(...cssDateien(p));
    else if (e.name.endsWith('.css')) raus.push(p);
  }
  return raus;
}

/**
 * Alle Custom-Property-Namen eines CSS-Textes, getrennt nach innen/ausserhalb
 * der Marker. Kommentare werden je Abschnitt entfernt, BEVOR gesucht wird —
 * die Erläuterungstexte nennen Token-Namen im Fliesstext (`--ink-900` trägt …),
 * und ein Treffer dort wäre ein erfundener Doppel-Definitions-Befund.
 */
function propertiesNachZone(css: string): { drin: string[]; draussen: string[] } {
  const drin: string[] = [];
  const draussen: string[] = [];
  let rest = css;
  const sammle = (text: string, ziel: string[]) => {
    const re = /--([\w-]+)\s*:/g;
    let m: RegExpExecArray | null;
    const ohneKommentare = text.replace(/\/\*[\s\S]*?\*\//g, ' ');
    while ((m = re.exec(ohneKommentare)) !== null) ziel.push(m[1]);
  };
  for (;;) {
    const von = rest.indexOf(MARKER_START);
    if (von < 0) break;
    const bis = rest.indexOf(MARKER_ENDE, von);
    if (bis < 0) break;
    sammle(rest.slice(0, von), draussen);
    sammle(rest.slice(von + MARKER_START.length, bis), drin);
    rest = rest.slice(bis + MARKER_ENDE.length);
  }
  sammle(rest, draussen);
  return { drin, draussen };
}

function wachen(q: Quelle, css: string): string[] {
  const fehler: string[] = [];
  const quellNamen = [
    ...q.color.tokens.map((t) => t.name),
    ...Object.keys(q.type.families).map((n) => `font-${n}`),
    ...q.spacing.tokens.map((t) => t.name),
    ...q.radius.tokens.map((t) => t.name),
    ...q.shadow.tokens.map((t) => t.name),
    ...q.zIndex.tokens.map((t) => t.name),
  ];

  // (4) Eindeutigkeit in der Quelle.
  const gezaehlt = new Map<string, number>();
  for (const n of quellNamen) gezaehlt.set(n, (gezaehlt.get(n) ?? 0) + 1);
  for (const [n, z] of gezaehlt) if (z > 1) fehler.push(`Quelle: Token «${n}» steht ${z}× in ${QUELLE}.`);

  const { drin, draussen } = propertiesNachZone(css);
  const drinZahl = new Map<string, number>();
  for (const n of drin) drinZahl.set(n, (drinZahl.get(n) ?? 0) + 1);

  // (1) Jeder Token genau einmal je Block, in dem er stehen muss.
  const soll = new Map<string, number>();
  const zaehle = (t: Token) => soll.set(t.name, typeof t.value === 'object' ? 2 : 1);
  q.color.tokens.forEach(zaehle);
  for (const n of Object.keys(q.type.families)) soll.set(`font-${n}`, 1);
  q.spacing.tokens.forEach(zaehle);
  q.radius.tokens.forEach(zaehle);
  q.shadow.tokens.forEach(zaehle);
  q.zIndex.tokens.forEach(zaehle);
  for (const [n, z] of soll) {
    const ist = drinZahl.get(n) ?? 0;
    if (ist !== z) fehler.push(`Wache 1: «--${n}» steht ${ist}× im generierten Block, erwartet ${z}×.`);
  }

  // (2) Nichts Fremdes innerhalb der Marker.
  const bekannt = new Set(quellNamen);
  for (const n of new Set(drin))
    if (!bekannt.has(n)) fehler.push(`Wache 2: «--${n}» steht im generierten Block, fehlt aber in ${QUELLE}.`);

  // (3) Kein Token-Name ausserhalb der Marker — in KEINER CSS-Datei.
  const draussenAlle = new Map<string, string[]>();
  for (const datei of cssDateien(CSS_WURZEL)) {
    const namen = datei === CSS ? draussen : propertiesNachZone(readFileSync(datei, 'utf8')).draussen;
    for (const n of new Set(namen)) {
      if (!bekannt.has(n)) continue;
      draussenAlle.set(n, [...(draussenAlle.get(n) ?? []), datei]);
    }
  }
  for (const [n, dateien] of draussenAlle)
    fehler.push(`Wache 3: «--${n}» ist ausserhalb der Marker definiert (${dateien.join(', ')}) — Doppel-Definition (§5).`);

  return fehler;
}

// ── Lauf ────────────────────────────────────────────────────────────────────
function zeilenDiff(soll: string, ist: string, datei: string): string[] {
  const a = soll.split('\n');
  const b = ist.split('\n');
  const raus: string[] = [];
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    if (a[i] === b[i]) continue;
    raus.push(`  ${datei}:${i + 1}\n    Datei:     ${b[i] ?? '(fehlt)'}\n    Generiert: ${a[i] ?? '(fehlt)'}`);
    if (raus.length >= 20) {
      raus.push('  … weitere Abweichungen unterdrückt.');
      break;
    }
  }
  return raus;
}

const pruefen = process.argv.includes('--check');
const quelle = JSON.parse(readFileSync(QUELLE, 'utf8')) as Quelle;
const cssIst = readFileSync(CSS, 'utf8');
const konfigIst = readFileSync(TW_KONFIG, 'utf8');
// Marker-Fehler gefasst wie die übrigen Tor-Befunde, kein Stack-Trace im CI-Log (Auflage GP PR #981, 23.9.2026).
let cssSoll = '';
let konfigSoll = '';
try {
  cssSoll = ersetzeMarker(CSS, cssIst, [cssBlock(quelle, 'light', '    '), cssBlock(quelle, 'dark', '    ')]);
  konfigSoll = ersetzeMarker(TW_KONFIG, konfigIst, [fontSizeBlock(quelle, '        ')]);
} catch (e) {
  console.error(`check:tokens-drift ROT — Marker-Struktur verletzt.\n  ${(e as Error).message}\n\n` +
    '  Beheben: je Abschnitt genau ein Paar «tokens:start»/«tokens:end», dann npm run gen:tokens.');
  process.exit(1);
}
const twSoll = tailwindDatei(quelle);

const fehler = wachen(quelle, cssSoll);
if (fehler.length > 0) {
  console.error('Token-Wachen rot:\n' + fehler.map((f) => `  ${f}`).join('\n'));
  process.exit(1);
}

if (pruefen) {
  const twIst = readFileSync(TW_DATEI, 'utf8');
  const abweichungen = [
    ...zeilenDiff(cssSoll, cssIst, CSS),
    ...zeilenDiff(twSoll, twIst, TW_DATEI),
    ...zeilenDiff(konfigSoll, konfigIst, TW_KONFIG),
  ];
  if (abweichungen.length > 0) {
    console.error(
      `check:tokens-drift ROT — Quelle ${QUELLE} und Projektion stehen auseinander.\n` +
        `${abweichungen.join('\n')}\n\n  Beheben: npm run gen:tokens (nie die Projektion von Hand ändern).`,
    );
    process.exit(1);
  }
  const zahl = quelle.color.tokens.length + quelle.spacing.tokens.length + quelle.radius.tokens.length +
    quelle.shadow.tokens.length + quelle.zIndex.tokens.length + Object.keys(quelle.type.families).length;
  const stufen = quelle.type.groups.reduce((a, g) => a + g.styles.length, 0);
  console.log(
    `check:tokens-drift grün — ${zahl} Token und ${stufen} Typo-Stufen; ` +
      `${CSS}, ${TW_DATEI} und ${TW_KONFIG} decken sich mit ${QUELLE}.`,
  );
} else {
  writeFileSync(CSS, cssSoll);
  writeFileSync(TW_DATEI, twSoll);
  writeFileSync(TW_KONFIG, konfigSoll);
  console.log(`gen:tokens — ${CSS}, ${TW_DATEI} und ${TW_KONFIG} aus ${QUELLE} erzeugt.`);
}
