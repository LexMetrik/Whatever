// ─── check:ui-normzitate — UI-Normzitate gegen den Korpus (QS-CODE-AUSSENKANTEN) ──
//
// Anlass (Code-Inventur 4.8.2026): ~1'100 hart kodierte «Art.»-Zitate in
// src/pages + src/components sind eine zweite Norm-Quelle neben den Engines —
// ändert ein Erlass seine Nummerierung, prüfte bisher KEIN Tor die UI-Texte.
//
// Mechanik (deterministisch, offline):
//   1. Quelltexte der Darstellungsschicht einlesen (src/pages, src/components).
//   2. Zitate mit dem EINEN Fliesstext-Parser der App erkennen
//      (normVerweiseImText, src/lib/fedlex.ts — §5: keine zweite Regex-Wahrheit).
//   3. Je Zitat den Artikel gegen den committeten Korpus-Snapshot des Erlasses
//      prüfen (public/normtext/bund/<ERLASS>.json, Feld artikel).
//   4. Basislinien-Modell wie report:tot (QS-BASIS-TOT): deklarierter Bestand
//      in scripts/ui-normzitate-basislinie.json ist geduldet, jeder NEUE
//      Verstoss ist rot. Abgebaute Basislinien-Einträge werden gemeldet
//      (Basislinie nachziehen), reissen das Tor aber nicht.
//
// Grenzen (offengelegt, §8): geprüft wird nur, was der Parser auflöst —
// Bundes-Erlasse der FEDLEX-Tabelle mit vorhandenem Korpus-Snapshot.
// Kantonale «§»-Zitate und nicht erfasste Erlasse sind ausserhalb (Zähler
// «nicht prüfbar» weist sie aus). Der Parser (NORM_IM_TEXT) endet bei
// «sexies» — Zitate mit septies…decies sowie Aufzählungen («Art. 1, 2 und
// 3 OR»), ff.-Spannen und kleingeschriebenes «art.» erreichen das Tor gar
// nicht (auch nicht als «nicht prüfbar»); Gegenprüfungs-Befund 4.8.2026.
// Existenz ≠ inhaltliche Richtigkeit; aufgehobene Artikel fehlen im
// Snapshot und würden als historische Zitate rot → Basislinie mit
// Begründung dulden.
//
// Scheiterns-Fähigkeit (§6.7): der eingebaute Selbsttest jagt bei JEDEM Lauf
// ein synthetisches Falsch-Zitat («Art. 9999 OR») durch dieselbe Pipeline —
// wird es nicht gefunden, bricht das Tor sich selbst.
//
// Aufrufe:  vite-node scripts/check-ui-normzitate.ts            → Tor
//           vite-node scripts/check-ui-normzitate.ts --schreiben → Basislinie neu

import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative } from 'node:path';
import { normVerweiseImText, erkenneFedlexGesetz, artikelToken } from '../src/lib/fedlex';

const WURZEL = process.cwd();
const BASISLINIE_PFAD = join(WURZEL, 'scripts', 'ui-normzitate-basislinie.json');
const SNAPSHOT_DIR = join(WURZEL, 'public', 'normtext', 'bund');

// ── Quelldateien der Darstellungsschicht ────────────────────────────────────

function dateienUnter(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out.push(...dateienUnter(p));
    else if (/\.tsx?$/.test(name)) out.push(p);
  }
  return out;
}

// ── Artikel-Bestand je Erlass (lazy aus dem committeten Snapshot) ───────────

const artikelJeErlass = new Map<string, Set<string> | null>();

function artikelSet(kuerzel: string): Set<string> | null {
  const bekannt = artikelJeErlass.get(kuerzel);
  if (bekannt !== undefined) return bekannt;
  // Snapshot-Dateinamen sind grossgeschrieben (SCHKG.json), FEDLEX-Schlüssel
  // teils gemischt (SchKG) — beide Formen versuchen.
  const kandidaten = [`${kuerzel}.json`, `${kuerzel.toUpperCase()}.json`];
  let set: Set<string> | null = null;
  for (const k of kandidaten) {
    const pfad = join(SNAPSHOT_DIR, k);
    if (!existsSync(pfad)) continue;
    const roh = JSON.parse(readFileSync(pfad, 'utf8')) as { eintraege?: { artikel?: unknown }[] };
    if (!Array.isArray(roh.eintraege)) break;
    set = new Set(
      roh.eintraege
        .map((e) => (typeof e.artikel === 'string' ? e.artikel.toLowerCase() : null))
        .filter((a): a is string => a !== null),
    );
    break;
  }
  artikelJeErlass.set(kuerzel, set);
  return set;
}

// Nummern-Extraktion: `\d+[a-z]*` nimmt den GANZEN angehängten Buchstaben-
// lauf («172ter», «329gbis», «335c»); die Zerlegung in den Snapshot-eId-Stil
// («172_ter», «329_g_bis», «324_a») macht ausschliesslich artikelToken aus
// fedlex.ts — EINE Ableitung (§5). Gegenprüfungs-Befund 4.8.2026 (MAJOR):
// eine eigene `[a-z]?(?:bis|…)?`-Regex frass hier das «t» von «ter»
// (172ter → 172_t: korrekte Zitate rot, kaputte bis-Zitate still grün) —
// exakt die in fedlex.ts dreifach dokumentierte Backtracking-Falle.
const ART_NR = /Art\.\s*(\d+[a-z]*)/i;

interface Befund { datei: string; zeile: number; zitat: string; erlass: string; artikel: string }

function zeileFuerOffset(text: string, offset: number): number {
  let z = 1;
  for (let i = 0; i < offset && i < text.length; i++) if (text[i] === '\n') z += 1;
  return z;
}

// ── Kommentare ausblenden (WURZELFIX 14.9.2026, Gegenprüfungs-Befund D) ─────
//
// ANLASS. Das Tor las den ROHEN Quelltext, also auch Kommentare. Ein Kommentar,
// der ÜBER tote Anker schreibt, muss aber genau die Zitate nennen, die nicht
// auflösen — er wurde damit zwangsläufig rot. In PR #856 hat ein Bau-Agent das
// umgangen, indem er die Beispiele in NormChip.tsx als «StGB 91a» statt «Art.
// 91a StGB» schrieb, die Zitierform also verbog, damit der Parser sie nicht
// findet. Das ist die schlechteste aller Lagen: das Tor ist zufrieden, die
// Wahrheit steht in einer Notation, die im Repo sonst nirgends gilt, und der
// nächste Leser hält sie für einen Tippfehler.
//
// FIX AN DER WURZEL, nicht am Symptom: das Tor heisst «UI-Normzitate» und
// schützt AUSGELIEFERTEN Text — die ~1'100 hart kodierten Zitate, die der
// Nutzer liest. Ein Kommentar wird nicht ausgeliefert; er ist Prosa ÜBER den
// Code, und Prosa über eine aufgehobene Bestimmung muss sie nennen dürfen.
// Kommentare werden darum vor dem Parser ausgeblendet (durch Leerzeichen
// ersetzt, nie gelöscht — die Offsets bleiben, damit Zeilennummern in den
// Befunden stimmen).
//
// WAS DAS KOSTET (§8, offen): ein veraltetes Zitat in einem Kommentar fällt
// nicht mehr auf. Das ist ein Doku-Mangel, kein Nutzer-Fehler, und der Preis
// dafür, dass die Gegenrichtung — Notations-Tricks im ausgelieferten Code —
// nicht mehr belohnt wird. Der Zähler unten weist die übersprungene Menge
// AUSDRÜCKLICH aus, damit die Grenze sichtbar bleibt statt still zu wirken.
//
// Der Automat kennt Zeilen-/Blockkommentare und die drei String-Formen; ein
// `//` INNERHALB eines Strings bleibt darum Code (sonst verschwände der Rest
// der Zeile). Regex-Literale werden nicht eigens verfolgt — sie enthalten kein
// unescaptes `//` (das wäre ein leeres Regex und syntaktisch unmöglich).
function ohneKommentare(text: string): { code: string; kommentarZeichen: number } {
  const out = text.split('');
  let zustand: 'code' | 'zeile' | 'block' | "'" | '"' | '`' = 'code';
  let kommentarZeichen = 0;
  for (let i = 0; i < text.length; i++) {
    const c = text[i], n = text[i + 1];
    if (zustand === 'code') {
      if (c === '/' && n === '/') { zustand = 'zeile'; }
      else if (c === '/' && n === '*') { zustand = 'block'; }
      else if (c === "'" || c === '"' || c === '`') { zustand = c; }
      else continue;
      if (zustand === 'zeile' || zustand === 'block') { out[i] = ' '; kommentarZeichen += 1; }
      continue;
    }
    if (zustand === 'zeile') {
      if (c === '\n') { zustand = 'code'; continue; }   // Zeilenumbruch behalten
      out[i] = ' '; kommentarZeichen += 1;
      continue;
    }
    if (zustand === 'block') {
      if (c !== '\n') { out[i] = ' '; kommentarZeichen += 1; }
      if (c === '*' && n === '/') { out[i + 1] = ' '; kommentarZeichen += 1; i += 1; zustand = 'code'; }
      continue;
    }
    // In einem String: Escape überspringen, sonst auf das schliessende Zeichen warten.
    if (c === '\\') { i += 1; continue; }
    if (c === zustand) zustand = 'code';
  }
  return { code: out.join(''), kommentarZeichen };
}

// ── Kern: eine Quelldatei prüfen ────────────────────────────────────────────

function pruefeText(
  roh: string, datei: string,
  zaehler: { geprueft: number; nichtPruefbar: number; imKommentar: number },
): Befund[] {
  const befunde: Befund[] = [];
  // Zeilennummern werden gegen den ROHEN Text gerechnet (gleiche Offsets, weil
  // `ohneKommentare` nur ersetzt, nie löscht) — ein Befund zeigt also auf die
  // echte Zeile der Datei.
  const { code } = ohneKommentare(roh);
  zaehler.imKommentar += normVerweiseImText(roh).length - normVerweiseImText(code).length;
  const text = code;
  for (const span of normVerweiseImText(text)) {
    const kuerzel = erkenneFedlexGesetz(span.artikel);
    if (!kuerzel) { zaehler.nichtPruefbar += 1; continue; }
    const set = artikelSet(kuerzel);
    if (!set) { zaehler.nichtPruefbar += 1; continue; }
    const m = ART_NR.exec(span.artikel);
    if (!m) { zaehler.nichtPruefbar += 1; continue; }
    zaehler.geprueft += 1;
    const artikel = artikelToken(m[1]);
    if (!set.has(artikel)) {
      befunde.push({ datei, zeile: zeileFuerOffset(text, span.start), zitat: span.artikel, erlass: kuerzel, artikel });
    }
  }
  return befunde;
}

// ── Selbsttest (§6.7): das Tor muss ein Falsch-Zitat finden können ──────────

function selbsttest(): void {
  const synthetisch = "const hinweis = 'Massgeblich ist Art. 9999 OR für diesen Fall.';";
  const z = { geprueft: 0, nichtPruefbar: 0, imKommentar: 0 };
  const befunde = pruefeText(synthetisch, '<selbsttest>', z);
  if (befunde.length !== 1 || befunde[0].artikel !== '9999') {
    console.error('check:ui-normzitate ROT (Selbsttest): das synthetische Falsch-Zitat «Art. 9999 OR» wurde NICHT erkannt — das Tor kann nicht scheitern (§6.7).');
    process.exit(1);
  }
  // Kommentar-Ausblendung (Befund D, 14.9.2026) — BEIDE Richtungen, sonst wäre
  // sie eine stille Abschaltung: dasselbe Falsch-Zitat muss im Kommentar
  // durchgehen UND in einer echten Code-Zeile derselben Datei rot bleiben.
  const kommentarProben = [
    `// Beispiel: Art. 9999 OR ist aufgehoben.\n${synthetisch}`,
    `/* Blockform: Art. 9999 OR */\n${synthetisch}`,
    `const s = 'ein // im String hebt die Prüfung nicht auf';\n${synthetisch}`,
  ];
  for (const probe of kommentarProben) {
    const zk = { geprueft: 0, nichtPruefbar: 0, imKommentar: 0 };
    const b = pruefeText(probe, '<selbsttest-kommentar>', zk);
    if (b.length !== 1) {
      console.error(
        `check:ui-normzitate ROT (Selbsttest): Kommentar-Ausblendung falsch — erwartet GENAU 1 Befund `
        + `(die Code-Zeile), gefunden ${b.length}. Probe: ${JSON.stringify(probe.split('\n')[0])}`);
      process.exit(1);
    }
  }
  // Regressions-Anker Gegenprüfung 4.8.2026 (Suffix-Falle): die Nummern-
  // Normalisierung muss lateinische Suffixe ganz erhalten, nie abschneiden.
  const proben: [string, string][] = [['172ter', '172_ter'], ['89bis', '89_bis'], ['329gbis', '329_g_bis'], ['335c', '335_c']];
  for (const [roh, soll] of proben) {
    const m = ART_NR.exec(`Art. ${roh}`);
    const ist = m ? artikelToken(m[1]) : '<kein Treffer>';
    if (ist !== soll) {
      console.error(`check:ui-normzitate ROT (Selbsttest): Nummern-Normalisierung «${roh}» → «${ist}», erwartet «${soll}» (Suffix-Falle).`);
      process.exit(1);
    }
  }
}

// ── Lauf ────────────────────────────────────────────────────────────────────

const schreiben = process.argv.includes('--schreiben');

selbsttest();

const dateien = [...dateienUnter(join(WURZEL, 'src', 'pages')), ...dateienUnter(join(WURZEL, 'src', 'components'))];
const zaehler = { geprueft: 0, nichtPruefbar: 0, imKommentar: 0 };
const alle: Befund[] = [];
for (const pfad of dateien) {
  const rel = relative(WURZEL, pfad);
  alle.push(...pruefeText(readFileSync(pfad, 'utf8'), rel, zaehler));
}

const schluessel = (b: Befund) => `${b.datei}|${b.erlass}|${b.artikel}`;

interface Basislinie { _begruendung: string; eintraege: string[] }

if (schreiben) {
  const basislinie: Basislinie = {
    _begruendung:
      'Deklarierter Bestand nicht auflösbarer UI-Normzitate (QS-CODE-AUSSENKANTEN). '
      + 'Jeder Eintrag ist ein GEDULDETER Altfall (Format datei|erlass|artikel) — vor dem '
      + 'Dulden prüfen, ob das Zitat fachlich falsch ist (dann fixen, nicht dulden). '
      + 'Neuzugänge sind rot; abgebaute Einträge hier entfernen.',
    eintraege: [...new Set(alle.map(schluessel))].sort(),
  };
  writeFileSync(BASISLINIE_PFAD, `${JSON.stringify(basislinie, null, 2)}\n`);
  console.log(`Basislinie geschrieben: ${basislinie.eintraege.length} Einträge → ${relative(WURZEL, BASISLINIE_PFAD)}`);
  process.exit(0);
}

const basislinie: Basislinie = existsSync(BASISLINIE_PFAD)
  ? (JSON.parse(readFileSync(BASISLINIE_PFAD, 'utf8')) as Basislinie)
  : { _begruendung: '', eintraege: [] };
const geduldet = new Set(basislinie.eintraege);

const neu = alle.filter((b) => !geduldet.has(schluessel(b)));
const aktuelleSchluessel = new Set(alle.map(schluessel));
const abgebaut = basislinie.eintraege.filter((e) => !aktuelleSchluessel.has(e));

console.log(
  `check:ui-normzitate — ${dateien.length} UI-Dateien · ${zaehler.geprueft} Zitate gegen den Korpus geprüft · `
  + `${zaehler.nichtPruefbar} nicht prüfbar (kein Bund-Snapshot/kein Parser-Treffer) · `
  + `${zaehler.imKommentar} in Kommentaren übersprungen (Prosa über Normen, nicht ausgeliefert) · `
  + `Basislinie ${basislinie.eintraege.length}`,
);

if (abgebaut.length > 0) {
  console.log(`  Hinweis: ${abgebaut.length} Basislinien-Einträge sind abgebaut — Basislinie nachziehen (--schreiben):`);
  for (const e of abgebaut.slice(0, 10)) console.log(`    − ${e}`);
}

if (neu.length > 0) {
  console.error(`check:ui-normzitate ROT — ${neu.length} NEUE nicht auflösbare Zitate (Artikel existiert im Korpus-Snapshot nicht):`);
  for (const b of neu) console.error(`  ${b.datei}:${b.zeile} · «${b.zitat}» → ${b.erlass} kennt Art. ${b.artikel} nicht`);
  process.exit(1);
}

console.log('check:ui-normzitate GRÜN — kein neues nicht auflösbares UI-Zitat.');
