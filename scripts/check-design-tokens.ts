// ─── Token-Schranke (DESIGN-REGLEMENT B2/D2/F7/E1, §13) ─────────────────────
// 1) TYPO (B2): keine Tailwind-Default-Grössen (text-sm/lg/xl…), keine rohen
//    absoluten Arbitrary-Grössen (text-[12px]/[1.1rem]). Erlaubt: Haus-Skala,
//    text-[length:var(--…)], relative em/%.
// 2) FARBE (F7): jede Farb-Utility (bg-/text-/border-/ring-… Haus-Familie)
//    muss in tailwind.config.js existieren — sonst generiert Tailwind die
//    Klasse still nicht (No-op). Seit W2·29-WERKBANK-TOKENS (22.9.2026) stammen
//    die Farb-Utilities aus `tailwind.tokens.generated.js`, der Projektion der
//    EINEN Token-Quelle `design/tokens.json` (`npm run gen:tokens`); in der
//    Konfig von Hand stehen nur noch die color-mix-Rezepte. Regel (2) bleibt
//    unverändert — sie liest weiterhin den FERTIGEN Farbbaum aus
//    `tailwind.config.js` und ist damit gegen beide Herkünfte dieselbe Prüfung.
// 3) DECKKRAFT (D0, 8.8.2026): `bg-brass-100/70` & Co. erzeugten am Stand
//    16.8.2026 KEINE CSS-Regel — var(--token)-Farbwerte sind nicht alpha-
//    fähig (LM-156, PR #472). Wächter kompiliert die genutzten /<alpha>-
//    Klassen mit echtem Tailwind, verlangt Regel + abweichenden Rumpf ggü.
//    der opaken Schwesterklasse.
// Lauf: npm run check:design-tokens (Teil von npm run check).
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import postcss, { type Declaration } from 'postcss';
import tailwindcss from 'tailwindcss';
import tw from '../tailwind.config.js';

const WURZEL = 'src';

// ── Typo-Regeln ──
const DEFAULT_GROESSE = /\btext-(sm|lg|[2-9]?xl)\b/;
const ROH_ABSOLUT = /text-\[[0-9.]+(?:px|rem)\]/;
// Inline-Style: rohe absolute fontSize (px/rem) umgeht die Typo-Skala wie eine
// Arbitrary-Grösse (B2). em/%/var()/calc()/clamp() bleiben erlaubt.
const INLINE_FONTSIZE_ABS = /fontSize:\s*['"][0-9.]+(?:px|rem)['"]/;

// ── Farb-Regel: gültige <familie>[-<stufe>] aus der Config ableiten ──
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const farben: Record<string, any> = (tw as any).theme?.extend?.colors ?? {};
const GUELTIG = new Set<string>();            // z. B. "brass-100", "line", "line-strong"
for (const [fam, val] of Object.entries(farben)) {
  if (val && typeof val === 'object') {
    for (const stufe of Object.keys(val)) GUELTIG.add(stufe === 'DEFAULT' ? fam : `${fam}-${stufe}`);
  } else {
    GUELTIG.add(fam);                          // skalare Familie (z. B. well)
  }
}
const FAMILIEN = Object.keys(farben).join('|');
// Utility-Präfixe, die eine Farbe tragen (shadow → --tw-shadow-color, D0):
const PRAEFIX = 'bg|text|border|ring|from|via|to|divide|outline|fill|stroke|decoration|placeholder|caret|accent|ring-offset|shadow';
// Fängt <praefix>-<familie>[-<stufe>] (Stufe optional = DEFAULT); /<alpha> wird ignoriert.
const FARB_RE = new RegExp(`\\b(?:${PRAEFIX})-(${FAMILIEN})(?:-([a-z0-9.]+))?(?:/[0-9.]+)?\\b`, 'g');

// ── Verbot: Ad-hoc-Status-Farben aus Tailwind-Default-Palette (§13 Pkt.1/F7) ──
// Keine Haus-Tokens; Tailwind generiert sie trotz extend weiter.
const DEFAULT_PALETTE = 'red|green|blue|yellow|orange|purple|pink|gray|grey|zinc|neutral|stone|amber|lime|emerald|teal|cyan|sky|indigo|violet|fuchsia|rose';
const DEFAULT_FARB_RE = new RegExp(`\\b(?:${PRAEFIX})-(?:${DEFAULT_PALETTE})-[0-9]+(?:/[0-9.]+)?\\b`, 'g');
// ── Verbot: Arbitrary-Color Hex/rgb/hsl in Komponenten (§13 Pkt.1). var(--…) bleibt erlaubt (Token-Escape). ──
const ARBITRARY_FARB_RE = new RegExp(`\\b(?:${PRAEFIX})-\\[(?:#|rgb|hsl)[^\\]]*\\]`, 'g');
// ── Verbot: eigene FARBE am Fokusring (E-1, 31.8.2026) ──────────────────────
// Fokusring hat GENAU EINE Rolle: --focus (src/index.css), global via
// :focus-visible. Fund: 9 Komponenten mit eigener Kette (z. B. outline-
// brass-600), im Dunkelmodus falsch — von FARB_RE/DEFAULT_FARB_RE nicht
// erfasst (§17-Nachzug). ERLAUBT: outline-none, Breiten, Offset
// (-outline-offset-2, für Scroll-Container). Fasst focus(-visible): +
// outline-/ring-/ring-offset- + arbitrary […] ausser var(--focus).
const FOKUS_FAMILIEN = [...Object.keys(farben), ...DEFAULT_PALETTE.split('|')]
  .filter((f) => f !== 'focus')                       // die Rolle selbst bleibt erlaubt
  .join('|');
const FOKUS_FARB_RE = new RegExp(
  `\\bfocus(?:-visible)?:-?(?:outline|ring|ring-offset)-(?:${FOKUS_FAMILIEN})(?:-[a-z0-9.]+)?(?:/[0-9.]+)?\\b`, 'g');
const FOKUS_ARB_RE = /\bfocus(?:-visible)?:-?(?:outline|ring|ring-offset)-\[(?!var\(--focus\))[^\]]+\]/g;
// ── Verbot: lc-overline mit ink-Dimm-Override (D-1.2, Befund 18) ───────────
// lc-overline ist auf ink-600 kalibriert (≥4.5:1); text-ink-500/400/300
// degradiert die 11px-Overline unter AA (ink-500 4.05:1, gemessen). axe-e2e
// blieb grün — einziger Wächter hier. brass-Pairings bleiben erlaubt; Treffer
// nur innerhalb desselben className-Strings.
// ERGÄNZUNG W2·24-DESIGN-IDENTITAET R1 (6.9.2026, §2b — der Befund oben bleibt
// als datierter Beleg stehen): die Overline ist seither entversalt, 12 px und
// selbst auf --ink-500 kalibriert (gemessen 5.31:1 auf --paper, 4.82:1 auf
// --well, KONTRAST-R1.md). Der Ausdruck bleibt UNVERÄNDERT scharf: ein
// ausdrückliches `text-ink-500` am Etikett ist heute ein No-op und morgen ein
// stiller Vorgriff auf eine Rekalibrierung, 400/300 bleiben unter AA.
const OVERLINE_DIM_RE = /\blc-overline\b[^"'`]*\btext-ink-(?:500|400|300)\b|\btext-ink-(?:500|400|300)\b[^"'`]*\blc-overline\b/;
// ── GB-13 (W2·24, 7.9.2026) · KEIN VERSAL-ETIKETT AM BADGE ──────────────────
// F0.7 («Kein ALL-CAPS-Etikett mehr») galt bis hierher nur der `.lc-overline`;
// GEMESSEN am gebauten Stand 6.9.2026 trugen 53 + 1 `span.lc-badge` auf
// /rechtsprechung und im Entscheid-Leser die Utility `uppercase` mit Inhalt
// «fr»/«it» — dieselbe Regel, andere Klasse, unbewacht. Die WIRKUNG ist seit
// GB-13 an `.lc-badge { text-transform: none }` gekappt (src/index.css); diese
// Schranke hält die QUELLE sauber, damit niemand ein `uppercase` schreibt, das
// still nichts tut (F7: ein No-op im Markup ist eine Lüge über die Absicht).
// ABGRENZUNG: nicht betroffen ist `uppercase` an einem Sprach-/ISO-CODE ausser
// halb der Badge-Achse (`SprachUmschalter`: «DE» ist ein Kürzel, kein Etikett).
const BADGE_VERSAL_RE = /\blc-badge(?:-[a-z]+)?\b[^"'`]*\buppercase\b|\buppercase\b[^"'`]*\blc-badge(?:-[a-z]+)?\b/;
const BADGE_VERSAL_AUSNAHMEN = new Set<string>(); // Ausnahme EntscheidLeser 7.9.2026 aufgelöst (GA+GB gelandet)
// ── Verbot: Reinweiss als Fläche (§13-Nachtrag d / Befund 41) ──────────────
// Lese-/Arbeitsflächen tragen --paper*/--surface*, nie #FFFFFF. Kein
// bg-white/text-white/…-white und kein #fff/#ffffff im Inline-Style
// (Arbitrary-Hex fängt ARBITRARY_FARB_RE). Ausnahmen (print, ink-Buttons)
// leben in index.css, ausserhalb dieses Scopes.
const WHITE_UTIL_RE = new RegExp(`\\b(?:${PRAEFIX})-white\\b`, 'g');
const INLINE_WHITE_RE = /(?:background|backgroundColor|color)\s*:\s*['"]#(?:fff|ffffff)['"]/i;
// ── Verbot: Ad-hoc-Scrim (F2-1, 31.8.2026) ──────────────────────────────────
// Scrim hat DREI Rollen mit je EINER Deckung (--scrim 30 %/--scrim-dialog
// 40 %/--scrim-voll 50 %, src/index.css) über .lc-scrim*. Fund: 7 Fundstellen
// als Utility-Kette, 3 mit bg-ink-900/<alpha> — Fehler, da --ink-900 mit dem
// Thema flippt (hell #201E16, dunkel #E9E7E2): bg-ink-900/30 hellt im
// Dunkelmodus auf statt abzudunkeln (Leuchtdichte v3/LeserScrim.tsx: hell
// 237.5→166.1, dunkel 32.7→23.0). FARB_RE/DEFAULT_FARB_RE/Prüfung 3 fingen das
// nicht. GELTUNG: nur mit inset-0 (echter Scrim); bg-black/<alpha> fällt mit
// darunter (§6.7, keine Ausnahme für letzte Fundstelle). Kommentarzeilen
// bleiben frei — datierte Belege im Code altern nicht (§2b).
const SCRIM_RE = /\bbg-(?:black|ink-\d{3})\/[0-9.]+\b/;
const SCRIM_TRAEGER_RE = /\binset-0\b/;
const KOMMENTAR_ZEILE_RE = /^\s*(?:\/\/|\*|\/\*|\{\/\*)/;
// ── Deckkraft-Suffix (Prüfung 3, D0): <praefix>-<farbe>/<alpha>. Ohne Familien-
// Filter — Kompilation entscheidet; nur Farb-Präfixe (w-1/2 bleibt aussen vor).
// Klammer-Formen laufen mit (D0 5.9.2026): …-[var(--x)]/60 lief bisher grün
// durch ohne Regel zu erzeugen; /[0.6] wirksam, aber unbewacht.
const ALPHA_UTIL_RE = new RegExp(
  `\\b(?:${PRAEFIX})-(?:[a-z]+(?:-[a-z0-9]+)*|\\[[^\\]\\s]+\\])\\/(?:[0-9]+(?:\\.[0-9]+)?|\\[[^\\]\\s]+\\])`, 'g');

function dateien(dir: string): string[] {
  const out: string[] = [];
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) { out.push(...dateien(p)); continue; }
    if (/\.(ts|tsx)$/.test(e) && !/\.test\.(ts|tsx)$/.test(e)) out.push(p);
  }
  return out;
}

// Kommentare raus vor dem Scan, Strings bleiben unberührt (Fehlerbuch W2·18, 5.9.2026).
const KOMMENTAR_ODER_STRING = /(["'`])(?:\\.|(?!\1)[\s\S])*\1|\/\/[^\n]*|\/\*[\s\S]*?\*\//g;
const ohneKommentare = (c: string) => c.replace(KOMMENTAR_ODER_STRING, (m) => (/^["'`]/.test(m) ? m : m.replace(/[^\n]/g, ' ')));

const fehler: string[] = [];
/** Fundstellen je Deckkraft-Klasse: "bg-brass-100/70" → ["src/…:42", …] */
const alphaFunde = new Map<string, string[]>();
for (const datei of dateien(WURZEL)) {
  const zeilen = ohneKommentare(readFileSync(datei, 'utf8')).split('\n');
  zeilen.forEach((zeile, i) => {
    if (DEFAULT_GROESSE.test(zeile))
      fehler.push(`${datei}:${i + 1} — Tailwind-Default-Grösse (text-sm/lg/xl…). Stattdessen die Skala oder text-[length:var(--…)].`);
    if (ROH_ABSOLUT.test(zeile))
      fehler.push(`${datei}:${i + 1} — rohe Arbitrary-Grösse text-[…px|rem]. Wert als Token (--…) führen und text-[length:var(--…)] nutzen.`);
    if (INLINE_FONTSIZE_ABS.test(zeile))
      fehler.push(`${datei}:${i + 1} — rohe absolute fontSize im Inline-Style (px/rem). Wert als Token (--…) in index.css führen und fontSize: 'var(--…)' nutzen.`);
    let m: RegExpExecArray | null;
    FARB_RE.lastIndex = 0;
    while ((m = FARB_RE.exec(zeile)) !== null) {
      const token = m[2] ? `${m[1]}-${m[2]}` : m[1];     // familie-stufe bzw. familie (DEFAULT)
      if (!GUELTIG.has(token))
        fehler.push(`${datei}:${i + 1} — Farb-Utility «${m[0]}» → Stufe «${token}» fehlt in tailwind.config.js (stiller No-op, F7). Existierende Stufe nutzen oder Token ergänzen.`);
    }
    let dm: RegExpExecArray | null;
    DEFAULT_FARB_RE.lastIndex = 0;
    while ((dm = DEFAULT_FARB_RE.exec(zeile)) !== null)
      fehler.push(`${datei}:${i + 1} — Ad-hoc-Status-Farbe «${dm[0]}» aus der Tailwind-Default-Palette (verboten, §13 Pkt.1/F7). Haus-Token (brass/sage/slate/warn/danger …) statt red/green/blue/gray nutzen.`);
    let am: RegExpExecArray | null;
    ARBITRARY_FARB_RE.lastIndex = 0;
    while ((am = ARBITRARY_FARB_RE.exec(zeile)) !== null)
      fehler.push(`${datei}:${i + 1} — Arbitrary-Farbe «${am[0]}» (Hex/rgb/hsl in Komponente verboten, §13 Pkt.1). Wert als CSS-Variable führen und …-[var(--…)] nutzen.`);
    for (const re of [FOKUS_FARB_RE, FOKUS_ARB_RE]) {
      let fm: RegExpExecArray | null;
      re.lastIndex = 0;
      while ((fm = re.exec(zeile)) !== null)
        fehler.push(`${datei}:${i + 1} — eigene Fokusring-Farbe «${fm[0]}» (E-1, §13 F3). Der Ring hat EINE Rolle (--focus) und kommt aus der globalen «:focus-visible»-Regel in src/index.css: Farb- und Breiten-Utilities ersatzlos streichen, nur einen wirklich nötigen Offset (focus-visible:-outline-offset-2) behalten.`);
    }
    if (BADGE_VERSAL_RE.test(zeile) && !BADGE_VERSAL_AUSNAHMEN.has(datei))
      fehler.push(`${datei}:${i + 1} — Versal-Etikett an einer lc-badge (F0.7 «Kein ALL-CAPS-Etikett mehr», Befund G13). Die Utility «uppercase» ersatzlos streichen: .lc-badge traegt seit GB-13 text-transform:none (src/index.css), das Markup-Wort ist damit ein stiller No-op (F7). Der volle Wortlaut gehoert in den title (§8).`);
    if (OVERLINE_DIM_RE.test(zeile))
      fehler.push(`${datei}:${i + 1} — lc-overline mit text-ink-500/400/300 gedimmt (AA-Fail bei 11px, D-1.2/E1). Override strippen — lc-overline trägt die kalibrierte ink-600-Basis.`);
    let wm: RegExpExecArray | null;
    WHITE_UTIL_RE.lastIndex = 0;
    while ((wm = WHITE_UTIL_RE.exec(zeile)) !== null)
      fehler.push(`${datei}:${i + 1} — Reinweiss-Utility «${wm[0]}» (§13-Nachtrag d / Reinweiss-Invariante). Warme Fläche/Tinte nutzen: bg-paper*/bg-surface* bzw. text-paper (nie #FFFFFF als Lesefläche).`);
    if (INLINE_WHITE_RE.test(zeile))
      fehler.push(`${datei}:${i + 1} — Reinweiss #fff im Inline-Style (§13-Nachtrag d / Reinweiss-Invariante). Token nutzen: var(--paper*)/var(--surface*) bzw. var(--paper) für Tinte auf Dunkel.`);
    if (!KOMMENTAR_ZEILE_RE.test(zeile) && SCRIM_RE.test(zeile) && SCRIM_TRAEGER_RE.test(zeile)) {
      const sm = SCRIM_RE.exec(zeile);
      fehler.push(`${datei}:${i + 1} — Ad-hoc-Scrim «${sm?.[0]}» auf einer inset-0-Fläche (F2-1). Der Scrim hat drei Rollen mit je EINER Deckung: .lc-scrim (Blatt/Menü, 30 %), .lc-scrim-dialog (zentrierter Dialog, 40 %), .lc-scrim-voll (Vollflächen-Schublade, 50 %) — src/index.css. bg-ink-900/… ist zusätzlich falsch: --ink-900 flippt mit dem Thema und hellt im Dunkelmodus auf, statt abzudunkeln.`);
    }
    let alm: RegExpExecArray | null;
    ALPHA_UTIL_RE.lastIndex = 0;
    while ((alm = ALPHA_UTIL_RE.exec(zeile)) !== null) {
      const liste = alphaFunde.get(alm[0]) ?? [];
      liste.push(`${datei}:${i + 1}`);
      alphaFunde.set(alm[0], liste);
    }
  });
}

// ── Prüfung 3: Deckkraft-Klassen gegen echtes Tailwind kompilieren ───────────
// Ein Lauf für alle Klassen (opak + Alpha) — Tailwind braucht dafür ~150 ms.
if (alphaFunde.size > 0) {
  const opak = (k: string) => k.slice(0, k.lastIndexOf('/'));
  const klassen = [...alphaFunde.keys()].flatMap((k) => [k, opak(k)]);
  const config = { ...(tw as Record<string, unknown>), content: [{ raw: klassen.join(' '), extension: 'html' }] };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ergebnis = await postcss([tailwindcss(config as any)]).process('@tailwind utilities;', { from: undefined });
  // Selektor → Deklarations-Rumpf. --tw-*-opacity fliegt raus (nur bei opaker
  // Variante emittiert, würde den Vergleich sonst immer "unterschiedlich" machen).
  const rumpf = new Map<string, string>();
  ergebnis.root.walkRules((regel) => {
    const treffer = /^\.((?:[^\s.:>~+[\\]|\\.)+)/.exec(regel.selector);
    if (!treffer) return;
    const klasse = treffer[1].replace(/\\/g, '');
    const decls = regel.nodes
      .filter((n): n is Declaration => n.type === 'decl' && !/^--tw-[a-z-]+-opacity$/.test(n.prop))
      .map((n) => `${n.prop}:${n.value}`)
      .join(';');
    rumpf.set(klasse, (rumpf.get(klasse) ?? '') + decls);
  });
  for (const [klasse, orte] of alphaFunde) {
    const wo = `${orte[0]}${orte.length > 1 ? ` (+${orte.length - 1} weitere)` : ''}`;
    const mit = rumpf.get(klasse);
    if (mit === undefined || mit === '') {
      fehler.push(`${wo} — Deckkraft-Klasse «${klasse}» erzeugt KEINE CSS-Regel (stiller No-op, D0/F7). Farbwert in tailwind.config.js alpha-fähig machen (Funktion mit opacityValue bzw. <alpha-value>), nicht die Klasse entfernen.`);
      continue;
    }
    if (mit === rumpf.get(opak(klasse)))
      fehler.push(`${wo} — Deckkraft-Klasse «${klasse}» erzeugt zwar eine Regel, aber denselben Wert wie «${opak(klasse)}» — der /-Modifier bleibt wirkungslos (D0/F7).`);
  }
}

// ── Prüfung 3b: `sage` ist Materialien-Kennfarbe, nicht die ok-Rolle ────────
// GEMESSEN (R3-α/A3-6, 31.8.2026): neun Flächen färbten einen ZUSTAND mit
// sage-* statt der wertidentischen Rolle --ok-* (seit F1, §4b-B-i) — gefährlich,
// weil beide Konzepte sich sonst stillschweigend mitverschieben (Befunde 7+37).
// REGEL: sage-*/var(--sage-*) ausserhalb src/index.css nur mit Begründung AM
// FUNDORT; Wächter zitiert sie wörtlich.
{
  /** Fundort-Ausnahmen: Datei → Satz, der dort stehen MUSS. */
  const SAGE_AUSNAHMEN: Record<string, string> = {
    // Bandfarben eines Diagramms (kategoriale Reihe), keine Status-Aussage.
    'src/components/VerzugszinsTimeline.tsx': 'A3-6-AUSNAHME (R3-α, 31.8.2026): kategoriale Bandfarbe, kein Zustand',
  };
  const SAGE_RE = /(?:^|[\s"'`:])(?:bg|text|border|ring|fill|stroke|from|via|to|divide|outline|decoration|shadow|accent|caret)-sage-[a-z0-9]+|var\(--sage-[a-z0-9-]+\)/;
  for (const datei of dateien(WURZEL)) {
    const roh = readFileSync(datei, 'utf8');
    const begruendung = SAGE_AUSNAHMEN[datei];
    if (begruendung !== undefined) {
      if (!roh.includes(begruendung))
        fehler.push(`${datei} — A3-6-Ausnahme ohne Begründung am Fundort: der Satz «${begruendung}» steht dort nicht (mehr). Entweder die Begründung zurückschreiben oder die Fläche auf die ok-Rolle ziehen.`);
      continue;
    }
    roh.split('\n').forEach((zeile, i) => {
      if (KOMMENTAR_ZEILE_RE.test(zeile)) return;   // Belege dürfen sage nennen (§2b)
      const sm = SAGE_RE.exec(zeile);
      if (sm)
        fehler.push(`${datei}:${i + 1} — «${sm[0].trim()}» färbt einen Zustand mit der Materialien-Kennfarbe «sage» (A3-6, §4b-B-i). Die Zustands-Rolle nutzen: bg-ok-solid / bg-ok-bg / text-ok-text / border-ok-line bzw. var(--ok-solid) — wertidentisch, aber semantisch getrennt.`);
    });
  }
}

// ── Prüfung 4: `theme-color` ist eine Projektion von --paper (E-3) ─────────
// Browser-Chrome-Farbe steht als Literal in index.html (media-Tags) und
// src/components/thema.ts (media-los) — beide MÜSSEN --paper (src/index.css)
// treffen. Ist-Stand war hell überall #F7F4EC ≠ --paper #FCFAF6 (ΔE 2.23,
// sichtbarer Kantensprung iOS/Android). Wächter statt Generator: index.html
// wird vor jedem JS geparst, kann keine TS-Konstante konsumieren (§17-Gegengewicht).
{
  const css = readFileSync('src/index.css', 'utf8');
  /** Inhalt von `<selektor> { … }` (Klammer-Zählung, Idiom aus check-farbwelt.ts). */
  const block = (selektor: string): string => {
    const start = css.indexOf(selektor);
    if (start < 0) throw new Error(`check-design-tokens: Selektor «${selektor}» fehlt in src/index.css.`);
    let i = css.indexOf('{', start);
    const von = i + 1;
    for (let tiefe = 0; i < css.length; i++) {
      if (css[i] === '{') tiefe++;
      else if (css[i] === '}' && --tiefe === 0) return css.slice(von, i);
    }
    throw new Error(`check-design-tokens: Block «${selektor}» nicht geschlossen.`);
  };
  const paper = (selektor: string): string => {
    const t = /--paper\s*:\s*([^;]+);/.exec(block(selektor));
    if (!t) throw new Error(`check-design-tokens: «--paper» fehlt im Block «${selektor}».`);
    return t[1].trim().toUpperCase();
  };
  const SOLL = { hell: paper('  :root {'), dunkel: paper('  html.dark {') };

  const html = readFileSync('index.html', 'utf8');
  const metaRe = /<meta\s+name="theme-color"\s+content="([^"]+)"\s+media="\(prefers-color-scheme:\s*(light|dark)\)"/g;
  const gefunden = new Set<string>();
  let mm: RegExpExecArray | null;
  while ((mm = metaRe.exec(html)) !== null) {
    const rolle = mm[2] === 'light' ? 'hell' : 'dunkel';
    gefunden.add(rolle);
    if (mm[1].toUpperCase() !== SOLL[rolle])
      fehler.push(`index.html — theme-color (${mm[2]}) «${mm[1]}» ≠ --paper ${rolle} «${SOLL[rolle]}» aus src/index.css (E-3). Die Chrome-Farbe ist eine Projektion der Seitenfläche, nie ein eigener Wert (§5).`);
  }
  for (const rolle of ['hell', 'dunkel'] as const)
    if (!gefunden.has(rolle))
      fehler.push(`index.html — theme-color-Tag für «${rolle}» fehlt (E-3). Beide media-Varianten decken den Moment vor dem JS ab.`);

  const thema = readFileSync('src/components/thema.ts', 'utf8');
  const tm = /m\.content\s*=\s*dunkel\s*\?\s*'(#[0-9A-Fa-f]{3,8})'\s*:\s*'(#[0-9A-Fa-f]{3,8})'/.exec(thema);
  if (!tm)
    fehler.push('src/components/thema.ts — die theme-color-Zuweisung («m.content = dunkel ? … : …») ist nicht mehr auffindbar (E-3). Wächter und Fundstelle zusammen nachziehen, nicht den Wächter blenden.');
  else {
    if (tm[1].toUpperCase() !== SOLL.dunkel)
      fehler.push(`src/components/thema.ts — theme-color dunkel «${tm[1]}» ≠ --paper dunkel «${SOLL.dunkel}» aus src/index.css (E-3).`);
    if (tm[2].toUpperCase() !== SOLL.hell)
      fehler.push(`src/components/thema.ts — theme-color hell «${tm[2]}» ≠ --paper hell «${SOLL.hell}» aus src/index.css (E-3).`);
  }
}

// ── Prüfung 6: Schichtungs-Skala — keine rohe z-Index-Utility mehr (C3) ─────
// (Prüfung 5 = der Ad-hoc-Scrim-Ausdruck, SCRIM_RE oben im Hauptlauf — der
// Name ist an zwei Stellen bereits verankert: `layout/Shell.tsx` und
// `src/tests/design-r2d-mobil-zustaende.test.ts`.)
// GEMESSEN (Design-Review C3, 5.9.2026): 65 Fundstellen in ~30 Dateien trugen
// `z-<Zahl>`/`z-[<Zahl>]` ohne Skala — Reihenfolgen liessen sich nur durch
// Ausprobieren rekonstruieren (Beleg: die geschachtelten Kommentare an
// `v3/LeserKopf.tsx`/`v3/LeserScrim.tsx`/`layout/InhaltsKopf.tsx`, je «ANLASS
// der Zahl» erklärend). Migriert auf `--z-*`/`zIndex`-Rollen (index.css bei
// --z-base, tailwind.config.js), Werte unverändert (1:1 benannt, keine Zahl
// geändert — Stapelreihenfolge bewiesen identisch). Diese Prüfung verbietet
// KÜNFTIGE rohe z-Utilities; Tailwinds eingebaute Zahlen-Skala bleibt technisch
// erreichbar (`extend` entfernt sie nicht), hier ist sie trotzdem verboten.
{
  // KEIN `\b` nach `\]`: «]» ist selbst ein Nicht-Wortzeichen, ein
  // nachfolgendes Nicht-Wortzeichen (Anführungszeichen, Leerzeichen) böte
  // darum NIE eine Wortgrenze — `\bz-\[[0-9]+\]` bräuchte sie auch nicht,
  // die schliessende Klammer ist Grenze genug (Rot-Beweis 5.9.2026:
  // `z-[99]` blieb mit `\b` am Ende unentdeckt).
  const Z_ROH_RE = /\bz-\[[0-9]+\]|\bz-[0-9]+\b/g;
  /** Befristete Ausnahme (Kollisions-Vorsicht, paralleler Bauer auf demselben
   *  Branch, C3/5.9.2026): Datei → Satz, der dort stehen MUSS. Fällt weg,
   *  sobald die Datei in einer eigenen, kollisionsfreien Runde migriert ist. */
  const Z_ROH_AUSNAHMEN: Record<string, string> = {};
  for (const datei of dateien(WURZEL)) {
    const begruendung = Z_ROH_AUSNAHMEN[datei];
    if (begruendung !== undefined) {
      if (!readFileSync(datei, 'utf8').includes(begruendung))
        fehler.push(`${datei} — C3-Ausnahme ohne Begründung am Fundort: der Satz «${begruendung}» steht dort nicht (mehr). Entweder die Begründung zurückschreiben oder die Datei auf die Schichtungs-Skala migrieren und die Ausnahme hier streichen.`);
      continue;
    }
    ohneKommentare(readFileSync(datei, 'utf8')).split('\n').forEach((zeile, i) => {
      let zm: RegExpExecArray | null;
      Z_ROH_RE.lastIndex = 0;
      while ((zm = Z_ROH_RE.exec(zeile)) !== null)
        fehler.push(`${datei}:${i + 1} — rohe z-Index-Utility «${zm[0]}» (C3, Schichtungs-Skala). Eine der Rollen aus tailwind.config.js nutzen (z-base/-sticky/-entscheid-sticky/-reader-scrim/-reader-kopf/-inhalt-kopf/-leiste/-dropdown/-overlay/-modal) oder — falls wirklich neu — Wert + Rolle in src/index.css bei --z-base ergänzen.`);
    });
  }
}

if (fehler.length > 0) {
  console.error(`Token-Schranke ROT — ${fehler.length} Verstoss/Verstösse (DESIGN-REGLEMENT B2/F7/§13):`);
  for (const f of fehler) console.error('  ' + f);
  process.exit(1);
}
console.log(`Token-Schranke ok — Typo-Skala sauber, alle Farb-Utilities in der Config (${GUELTIG.size} gültige Stufen), ${alphaFunde.size} Deckkraft-Klassen erzeugen eine wirksame Regel.`);
