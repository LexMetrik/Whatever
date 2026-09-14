// ─── Z6c (W2·22) · Artikel-Bestand je Bund-Erlass — Generator + Drift-Tor ────
//
// WOZU. Ein Verweis «Art. N KÜRZEL» erzeugte bis hierher IMMER einen
// Artikel-Anker — allein aus Kürzel + Nummer, ohne nachzuschlagen, ob es die
// Zielbestimmung im Zielerlass überhaupt gibt. Gemessen 14.9.2026 (V-1-Tor,
// Sonderliste `toteFremdanker`): 36 von 9 675 prüfbaren Fremd-Ankern zeigen auf
// eine Bestimmung, die der Snapshot des Zielerlasses nicht kennt — z. B.
// «Artikel 91a StGB» (JStG Art. 19/19c/27a/28) oder «Art. 341bis OR» (ArG
// Art. 73). Der Sprung landet ins Leere; §8 verlangt, dass die Oberfläche nicht
// mehr verspricht, als die Daten hergeben, §1 «kein Link ist besser als ein
// falscher Link».
//
// WAS DIESE DATEI ERZEUGT. `src/lib/normtext/artikel-bestand.generated.ts` —
// je Bund-Snapshot die MENGE seiner Artikel-Token, lauf-kodiert. Damit kann der
// Chip SYNCHRON (also auch im Prerender, ohne Flackern nach der Hydration)
// entscheiden: Ziel-Token vorhanden ⇒ Artikel-Anker wie bisher; Ziel-Token
// fehlt ⇒ Rückfall auf den ERLASS-Link (`src/components/vorlagen/NormChip.tsx`).
//
// WARUM EINE PROJEKTION UND KEINE FEHLER-LISTE (§5, Mechanik-Entscheid). Eine
// generierte Liste der 36 gemessenen Fehlstellen wäre 150× kleiner — aber sie
// wäre eine ZWEITE WAHRHEIT über den Artikel-Bestand: sie beantwortet die Frage
// nur für Zitate, die im Korpus vorkommen, und sie kippt bei jeder Korpus-
// Fortschreibung ins Falsche (bekommt das StGB in einer neuen Konsolidierung
// einen Art. 91a, unterdrückte die Liste einen dann RICHTIGEN Link, ohne dass
// irgendetwas rot würde). Der vollständige Bestand ist dagegen eine
// deterministische Projektion der Snapshots — dieselbe Quelle, aus der der Leser
// den Artikel rendert — und kann gegenüber ihr nicht still altern: `--check`
// rechnet neu und vergleicht byte-gleich.
//
// §15 GERÄTE-LAST. Lauf-Kodierung («1-477» statt 477 Einzeltoken): 99.8 KiB roh
// → 44.0 KiB (gzip 13.8 KiB) für alle 228 Bund-Snapshots mit 25 463 Artikeln.
// Der Konsument (`artikel-bestand.ts`) expandiert NICHTS: er prüft
// Ganzzahl-Token gegen die Läufe und nur die Sonderformen gegen eine faule
// Menge je Erlass.
//
// A/B AM GEBAUTEN BUNDLE (14.9.2026, `npx vite build` mit und ohne Inhalt der
// generierten Datei, sonst identischer Baum):
//   entry index-*.js      57.97 → 57.95 KB gzip  (unverändert, Budget 60.0 KB)
//   NormText-*.js (lazy)  12.44 → 27.10 KB gzip  (+14.66 KB)
// Die Last liegt damit VOLLSTÄNDIG im faul geladenen Normtext-Chunk;
// Entry-Chunk und sein Budget sind unberührt. Logikverlust: keiner — die
// Prüfung ist rein additiv und nimmt einem Link höchstens den Anker, nie das
// Ziel.
//
// BERICHTIGUNG 14.9.2026 (Gegenprüfungs-Befund C). Hier stand «wer keinen
// Normtext rendert, lädt kein Byte davon». Das ist FALSCH, und zwar messbar.
// Gemessen mit Playwright gegen `vite preview` des gebauten `dist/` (Requests
// je Seite, Fingerabdruck «1-29,annex_u1» = ADOV-Bestand im Chunk):
//
//   /                          Projektion geladen: JA  · Fremd-Artikel-Anker im DOM:   0
//   /einstellungen             Projektion geladen: JA  · Fremd-Artikel-Anker im DOM:   0
//   /vorlagen/fristerstreckung Projektion geladen: JA  · Fremd-Artikel-Anker im DOM:  10
//   /vorlagen/arbeitsvertrag   Projektion geladen: JA  · Fremd-Artikel-Anker im DOM:  41
//   /gesetze/bund/OR           Projektion geladen: JA  · Fremd-Artikel-Anker im DOM: 345
//
// URSACHE, nachverfolgt bis zur Quelle: `src/leserPrefetch.ts` wärmt nach dem
// Erstpaint per `requestIdleCallback` die schweren Leser-Chunks vor
// (`prefetchLeser()` → GesetzLeser + EntscheidLeser). Beide importieren
// NormText statisch, NormText importiert NormChip, NormChip importiert diese
// Projektion — sie fährt darum auf JEDER Seite mit, auch auf Seiten ohne einen
// einzigen Fremd-Anker. Was stimmt: es ist ein Idle-Prefetch NACH dem
// Erstpaint, kein kritischer Pfad, und der Entry ist unberührt (oben gemessen).
// Was nicht stimmt, ist der Satz «lädt kein Byte davon»: 14.66 KB gzip
// Transfervolumen fallen überall an.
//
// Der Fix gehört NICHT hierher: die Projektion vom vorgewärmten Leser-Chunk zu
// trennen, ohne die Synchronität zu verlieren, heisst den Ladepfad des Lesers
// anfassen (der Chip müsste den Bestand als Wert bekommen, wie `kantonKuerzel`)
// — das ist derselbe Folge-Schritt wie der kantonale Fallback. Bis dahin steht
// die Zahl hier, statt dass ein falscher Satz sie verdeckt (§8).
//
// ERZEUGEN / PRÜFEN:
//   npm run gen:artikel-bestand
//   npm run check:artikel-bestand      (Drift-Tor: Neuberechnung == Datei)
//
// Nachlauf nach einem Korpus-Nachzug: `npm run gen:artikel-bestand`,
// `npm run check:verweis-inventar -- --schreiben`, `npm run datenhaltung:manifest`.

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const WURZEL = process.cwd();
const REGISTER_PFAD = join(WURZEL, 'public', 'normtext', 'register.json');
const SNAPSHOT_WURZEL = join(WURZEL, 'public', 'normtext');
export const ZIEL_PFAD = join(WURZEL, 'src', 'lib', 'normtext', 'artikel-bestand.generated.ts');

interface RegisterErlass {
  key: string; ebene: string; status: string; datei: string | null;
}

/**
 * Lauf-Kodierung einer Token-Menge. Reine Ganzzahl-Token werden aufsteigend
 * sortiert und zu geschlossenen Läufen «a-b» zusammengefasst; alles Übrige
 * (`92_a`, `335_c_bis`, Anhang-Ziffern …) steht wörtlich und alphabetisch
 * dahinter. Deterministisch (§2): dieselbe Menge ergibt dieselbe Zeichenkette.
 */
export function laufKodiere(tokens: Iterable<string>): string {
  const alle = [...new Set(tokens)];
  const zahlen = alle.filter((t) => /^\d+$/.test(t)).map(Number).sort((a, b) => a - b);
  const rest = alle.filter((t) => !/^\d+$/.test(t)).sort();
  const laeufe: string[] = [];
  let i = 0;
  while (i < zahlen.length) {
    let j = i;
    while (j + 1 < zahlen.length && zahlen[j + 1] === zahlen[j] + 1) j += 1;
    laeufe.push(i === j ? String(zahlen[i]) : `${zahlen[i]}-${zahlen[j]}`);
    i = j + 1;
  }
  return [...laeufe, ...rest].join(',');
}

/** Artikel-Token je Bund-Snapshot, aus den Snapshot-Dateien projiziert (§5). */
export function bestandAusSnapshots(): Record<string, string> {
  const register = JSON.parse(readFileSync(REGISTER_PFAD, 'utf8')) as { erlasse: RegisterErlass[] };
  const out: Record<string, string> = {};
  for (const e of register.erlasse.filter((x) => x.ebene === 'bund' && x.status === 'snapshot' && x.datei)
    .sort((a, b) => (a.key < b.key ? -1 : a.key > b.key ? 1 : 0))) {
    const pfad = join(SNAPSHOT_WURZEL, e.datei!);
    if (!existsSync(pfad)) continue;
    const snap = JSON.parse(readFileSync(pfad, 'utf8')) as { eintraege: { artikel: string }[] };
    out[e.key] = laufKodiere(snap.eintraege.map((x) => x.artikel));
  }
  return out;
}

/** Der Dateiinhalt — eine Zeile je Erlass, damit ein Diff lesbar bleibt. */
export function alsModul(bestand: Record<string, string>): string {
  const keys = Object.keys(bestand);
  const artikel = keys.reduce((a, k) => a + bestand[k].split(',').length, 0);
  return [
    '// AUTO-GENERIERT von scripts/normtext/artikel-bestand-generieren.ts — NICHT von Hand editieren.',
    `// Artikel-Bestand je Bund-Snapshot (${keys.length} Erlasse, ${artikel} Läufe/Token),`,
    '// lauf-kodiert: «a-b» = geschlossener Ganzzahl-Lauf, alles Übrige wörtlich.',
    '// Quelle: public/normtext/bund/*.json (Projektion, §5). Herleitung, §15-Messung',
    '// und der Mechanik-Entscheid stehen im Kopf des Generators.',
    '// Regenerieren:  npm run gen:artikel-bestand   ·   Drift-Tor: npm run check:artikel-bestand',
    '',
    'export const ARTIKEL_BESTAND: Readonly<Record<string, string>> = {',
    ...keys.map((k) => `  ${/^[A-Za-z_$][\w$]*$/.test(k) ? k : JSON.stringify(k)}: '${bestand[k]}',`),
    '};',
    '',
  ].join('\n');
}

// ─── CLI ────────────────────────────────────────────────────────────────────

if (!process.env.VITEST) {
  const soll = alsModul(bestandAusSnapshots());
  if (process.argv.includes('--check')) {
    const ist = existsSync(ZIEL_PFAD) ? readFileSync(ZIEL_PFAD, 'utf8') : '';
    if (ist !== soll) {
      console.error(
        'check:artikel-bestand ROT — src/lib/normtext/artikel-bestand.generated.ts weicht von den\n'
        + 'Snapshots ab. Das Artefakt entscheidet, ob ein Verweis einen Artikel-Anker bekommt; eine\n'
        + 'veraltete Kopie unterdrückt RICHTIGE Links bzw. lässt tote stehen (§1/§5).\n'
        + '  Regenerieren: npm run gen:artikel-bestand',
      );
      process.exit(1);
    }
    console.log(
      `check:artikel-bestand GRÜN — ${Object.keys(bestandAusSnapshots()).length} Bund-Erlasse `
      + 'deckungsgleich mit den Snapshots.',
    );
  } else {
    writeFileSync(ZIEL_PFAD, soll, 'utf8');
    console.log(
      `gen:artikel-bestand — ${Object.keys(bestandAusSnapshots()).length} Bund-Erlasse `
      + `→ src/lib/normtext/artikel-bestand.generated.ts (${(soll.length / 1024).toFixed(1)} KiB).`,
    );
    console.log('Nachlauf: npm run check:verweis-inventar -- --schreiben · npm run datenhaltung:manifest');
  }
}
