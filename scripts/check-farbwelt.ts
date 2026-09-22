// ─── Farbwelt-Mess-Tor (DESIGN-REGLEMENT §13/F2, FAHRPLAN-DESIGN-WAERME D-0) ──
//
// Das harte Kontrast-/Farbklima-Tor VOR jeder Wert-Änderung an der Farbwelt
// (E5 «Messung vor Geschmack»). Ohne dieses Script ist jedes «Kontrast-Gate»
// der Folge-Einheiten (D-1…D-8) Prosa — die axe-e2e-Stichprobe fängt Nicht-Text-
// Kontraste (WCAG 1.4.11) nicht, und dokumentierte Zahlen dürfen nie
// stillschweigend falsch werden (Fixpunkt 2 / D3/F6).
//
// QUELLE (deterministisch, §2 — kein Netz, keine Uhr, kein Zufall):
//   • `src/index.css`      — die :root- und html.dark-Token sind die WERTE.
//   • `tailwind.config.js` — Name→var()-Abbildung; Drift-Wächter, dass jedes
//     geprüfte Farb-Token als Utility überhaupt existiert (sonst stiller No-op).
//
// PRÜFUNGEN (Spec D-0):
//   (a) WCAG-Paare hell+dunkel als FAIL — Text ≥4.5:1, Nicht-Text/Zustände ≥3:1.
//       Die in den CSS-Kommentaren dokumentierten Paar-Listen sind Assertions.
//   (b) OKLCH Hue-Drift je Familie ≤~8° + L-Monotonie je Rampe — ERSTLAUF WARNUNG
//       (die Ist-ink-/brass-Mitten reissen die Schranke heute; erst D-4/D-5
//       legen die Sollwerte fest, dann scharf schalten).
//   (c) Dunkel-Rezept: Flächen-L-Leiter well<paper<surface<raised = FAIL-Regel;
//       Chroma-Dämpfung Akzent (dunkel C ≤ hell −10 %) = WARNUNG (D-4/D-5-Ziel).
//   (d) APCA-Spalte NUR beratend (Lc), nie Fail.
//   + REFERENZWERTE (C-1/C-2/C-3 Farb-Wörterbuch §4b-B + --paper-Fixpunkte):
//       Regressions-Referenz — Drift über Toleranz = FAIL (Zahlen dürfen nie
//       stillschweigend falsch werden).
//   (e) KEINE HEX-FARBE IN EINER DATA-URI in src/index.css (R3-F2, 6.9.2026) —
//       Farbwerte in URLs erben keine Token und überleben jede Rekalibrierung.
//   + BEKANNTE RISSE (D-1-Input): heute unter der Schwelle liegende Paare —
//       WARNUNG + Fail NUR bei Verschlechterung (Baseline-Guard), damit das Tor
//       auf dem IST-Stand grün ist, ohne die Risse zu verstecken.
//
// Lauf:  npm run check:farbwelt   (Teil von check:seriell → run-parallel → gate).
import { readFileSync } from 'node:fs';
import { calcAPCA } from 'apca-w3';
// Farb-Maschine (Token-Auflösung, Kontrast, OKLCh) und Regelkorpus (WAS
// geprüft wird) stehen in eigenen Modulen; hier lebt nur das Tor — Ausführung,
// Fail/Warn-Politik, Bericht (§6.6-Trennung, 31.8.2026).
import { hex, kontrast, loeseFarbe, oklchOf, tokensOf, ueber, type Mode } from './farbwelt-messung';
import {
  ALIAS, APCA_PROBEN, BASELINE_TOL, CONFIG_TOKENS, FAMILIEN, FIXPUNKT,
  HUE_DRIFT_MAX, PFLICHT, REFERENZ, REF_TOL, RISSE,
} from './farbwelt-tabellen';

// ── Tor-Zustand ─────────────────────────────────────────────────────────────
const fehler: string[] = [];
const warnungen: string[] = [];

function pruefeConfig(token: string) {
  if (ALIAS.has(token) || CONFIG_TOKENS.has(token)) return;
  fehler.push(`Config-Drift: Token «${token}» wird geprüft, fehlt aber in tailwind.config.js (stiller Utility-No-op, F7).`);
}

// ── 5 · Ausführung ───────────────────────────────────────────────────────────
console.log('Farbwelt-Tor (D-0) — WCAG hell+dunkel · OKLCH-Struktur · APCA beratend\n');

// (a) Pflichtpaare
for (const p of PFLICHT) {
  pruefeConfig(p.fg); pruefeConfig(p.bg);
  for (const mode of ['hell', 'dunkel'] as Mode[]) {
    const k = kontrast(p.fg, p.bg, mode);
    if (k < p.min - 1e-9)
      fehler.push(`WCAG ${p.art} ${p.fg}/${p.bg} ${mode}: ${k.toFixed(2)}:1 < ${p.min}:1 — ${p.quelle}`);
  }
}

// Referenzwerte
for (const r of REFERENZ) {
  for (const mode of ['hell', 'dunkel'] as Mode[]) {
    const soll = mode === 'hell' ? r.hell : r.dunkel;
    const ist = kontrast(r.fg, r.bg, mode);
    if (Math.abs(ist - soll) > REF_TOL)
      fehler.push(`Referenz-Drift ${r.fg}/${r.bg} ${mode}: ${ist.toFixed(2)}:1 ≠ dokumentiert ${soll.toFixed(2)}:1 (±${REF_TOL}) — ${r.quelle}. Zahl in DESIGN-REGLEMENT §N-4b-B nachziehen.`);
  }
}

// Fixpunkte
for (const f of FIXPUNKT) {
  const t = tokensOf(f.mode);
  const ist = hex(loeseFarbe(t.get(f.token)!, t));
  if (ist !== f.soll.toUpperCase())
    fehler.push(`Fixpunkt verletzt: --${f.token} ${f.mode} = ${ist} ≠ ${f.soll} (unantastbarer Anker, FAHRPLAN Fixpunkt 1).`);
}

// Bekannte Risse (Baseline-Guard)
for (const r of RISSE) {
  const ist = kontrast(r.fg, r.bg, r.mode);
  const marke = ist < r.schwelle ? 'RISS' : 'geheilt';
  warnungen.push(`[${marke}] ${r.fg}/${r.bg} ${r.mode}: ${ist.toFixed(2)}:1 (Ziel ${r.schwelle}:1) — ${r.tag}`);
  if (ist < r.ist - BASELINE_TOL)
    fehler.push(`Verschlechterung ${r.fg}/${r.bg} ${r.mode}: ${ist.toFixed(2)}:1 < Baseline ${r.ist.toFixed(2)}:1 — bekannter Riss darf nicht tiefer sinken (${r.tag}).`);
}

// ── (e) KEINE HEX-FARBE IN EINER DATA-URI (R3-F2, 6.9.2026) ─────────────────
//
// ANLASS, gemessen: Nach dem Token-Tausch R1 (Messing → Tinte/Registerfarben)
// blieb GENAU EINE Stelle in `src/index.css` gold — der Select-Chevron, zweimal
// als `data:image/svg+xml` mit `stroke='%23826225'` (hell) bzw. `%23D8BD78`
// (dunkel). Kein Tor konnte das sehen: dieses Script prüft TOKEN-Werte, und ein
// Farbwert in einer URL ist für die Token-Auflösung unsichtbar. Genau darin
// liegt der Schaden — eine Rekalibrierung der Farbwelt zieht jeden Token mit,
// aber keine data-URI. Das ist die zweite Wahrheit, die §5 verbietet.
//
// GREIFER: jedes `%23`-Hexliteral (URL-kodiertes `#`) im Blatt. Nur dort —
// gewöhnliche `#RRGGBB`-Literale sind in `index.css` die TOKEN-DEFINITIONEN
// selbst und damit die eine Quelle, kein Verstoss.
// KOMMENTARE werden vorher entfernt: ein Hexwert in einer Notiz malt nichts
// (und dieser Befund selbst wird unten in `index.css` erklärt — der Wächter
// dürfte sich nicht an seiner eigenen Begründung entzünden).
const CSS_ROH = readFileSync(new URL('../src/index.css', import.meta.url), 'utf8');
const CSS_OHNE_KOMMENTAR = CSS_ROH.replace(/\/\*[\s\S]*?\*\//g, '');
for (const m of CSS_OHNE_KOMMENTAR.matchAll(/%23[0-9A-Fa-f]{3,8}/g)) {
  fehler.push(
    `Hex-Farbe «${m[0]}» in einer data-URI in src/index.css — eine URL erbt keine Token und `
    + `wird bei einer Farb-Rekalibrierung stumm zurückgelassen (§5, Befund R3-F2 6.9.2026). `
    + `Weg: currentColor (Farbverlauf/SVG-Element) oder ein Token an einer CSS-Eigenschaft.`,
  );
}

// (c) Dunkel-Rezept: Flächen-L-Leiter well<paper<surface<raised — FAIL-Regel.
for (const mode of ['hell', 'dunkel'] as Mode[]) {
  const leiter = ['well', 'paper', 'surface', 'paper-raised'];
  const Ls = leiter.map((t) => oklchOf(t, mode).l);
  for (let i = 1; i < Ls.length; i++)
    if (!(Ls[i] > Ls[i - 1]))
      fehler.push(`Flächen-L-Leiter ${mode}: ${leiter[i - 1]}(L${Ls[i - 1].toFixed(3)}) ≥ ${leiter[i]}(L${Ls[i].toFixed(3)}) — Erhebungs-Logik verletzt (D-0c/D-6).`);
}

// (b) OKLCH Hue-Drift + L-Monotonie je Familie (Tabelle: farbwelt-tabellen.ts).
for (const [fam, toks] of Object.entries(FAMILIEN)) {
  const senke = fam === 'ink' ? fehler : warnungen;
  const stufe = fam === 'ink' ? 'HART (D-4)' : 'beratend';
  for (const mode of ['hell', 'dunkel'] as Mode[]) {
    const oks = toks.map((t) => oklchOf(t, mode));
    const hues = oks.map((o) => o.h).filter((h): h is number => h != null && Number.isFinite(h));
    if (hues.length) {
      const spanne = Math.max(...hues) - Math.min(...hues);
      if (spanne > HUE_DRIFT_MAX)
        senke.push(`[b] Hue-Drift ${fam} ${mode}: ${spanne.toFixed(1)}° > ${HUE_DRIFT_MAX}° — EIN Ziel-Hue je Achse (D-4). ${stufe}.`);
    }
    // L-Monotonie: -900 dunkelste Stufe (Text) … monoton fallende L Richtung -300.
    const Ls = oks.map((o) => o.l);
    for (let i = 1; i < Ls.length; i++)
      if (mode === 'hell' ? Ls[i] <= Ls[i - 1] : Ls[i] >= Ls[i - 1]) {
        senke.push(`[b] L-Monotonie ${fam} ${mode}: bei ${toks[i - 1]}→${toks[i]} nicht monoton — Rampe (D-4/D-5). ${stufe}.`);
        break;
      }
  }
}

// (c) Chroma-Dämpfung Akzent: dunkel C ≤ hell −10 % — WARNUNG (D-4/D-5-Ziel).
for (const tok of FAMILIEN.brass) {
  const ch = oklchOf(tok, 'hell').c, cd = oklchOf(tok, 'dunkel').c;
  if (cd > ch * 0.9 + 1e-9)
    warnungen.push(`[c] Chroma-Dämpfung ${tok}: dunkel C${cd.toFixed(3)} > hell C${ch.toFixed(3)} −10 % — Akzent dunkel zu bunt (D-4/D-5). Erstlauf beratend.`);
}

// (d) APCA-Spalte — NUR beratend (Lc), nie Fail.
const apcaZeilen: string[] = [];
for (const a of APCA_PROBEN) {
  for (const mode of ['hell', 'dunkel'] as Mode[]) {
    const t = tokensOf(mode);
    const basis = ueber(loeseFarbe(t.get('paper')!, t), { mode: 'rgb', r: 1, g: 1, b: 1, alpha: 1 });
    let bgC = loeseFarbe(t.get(a.bg) ?? a.bg, t); if (bgC.alpha < 1) bgC = ueber(bgC, basis);
    let fgC = loeseFarbe(t.get(a.fg) ?? a.fg, t); if (fgC.alpha < 1) fgC = ueber(fgC, bgC);
    const lc = Number(calcAPCA(hex(fgC), hex(bgC)));
    const mk = Math.abs(lc) >= a.ziel ? 'ok ' : '—  ';
    apcaZeilen.push(`    ${mk} ${a.label.padEnd(18)} ${a.fg}/${a.bg} ${mode.padEnd(6)} Lc ${lc.toFixed(1).padStart(6)} (Ziel |Lc|≥${a.ziel})`);
  }
}

// ── 6 · Bericht ──────────────────────────────────────────────────────────────
if (warnungen.length) {
  console.log(`WARNUNGEN (beratend, kein Tor — D-1/D-4/D-5-Input, ${warnungen.length}):`);
  for (const w of warnungen) console.log('  · ' + w);
  console.log('');
}
console.log('APCA (beratend, KEIN Tor — WCAG 2.2 ist das Gate):');
for (const z of apcaZeilen) console.log(z);
console.log('');

if (fehler.length) {
  console.error(`Farbwelt-Tor ROT — ${fehler.length} harte(r) Verstoss/Verstösse (DESIGN-REGLEMENT §13/F2):`);
  for (const f of fehler) console.error('  ✗ ' + f);
  process.exit(1);
}
console.log(
  `Farbwelt-Tor ok — ${PFLICHT.length * 2} WCAG-Pflichtpaare (hell+dunkel), ` +
  `${REFERENZ.length * 2} Referenzwerte (§4b-B), ${FIXPUNKT.length} Fixpunkte, ` +
  `Flächen-L-Leiter beide Modi, kein Hex in data-URIs. ${warnungen.length} beratende Warnung(en) offen (D-1/D-4/D-5).`,
);

