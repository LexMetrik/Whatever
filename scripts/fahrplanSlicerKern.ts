// scripts/fahrplanSlicerKern.ts — reiner Kern des FAHRPLAN-§-Slicers.
// QS-TOK / FAHRPLAN-TOKEN-OEKONOMIE.md §3 T3 «FAHRPLAN-§-Slice statt Ganzdatei».
//
// Hier steht die gesamte Logik OHNE Seiteneffekt; die CLI liegt in
// `scripts/fahrplan-slice.ts` und ist eine dünne Hülle darüber (Fassaden-Muster,
// §6.6). Der Schnitt wurde am 4.8.2026 nötig, weil die CLI beim blossen IMPORT
// mitlief: `scripts/plan/bildDaten.ts` verprobt seither jeden §-Anker des
// Bau-Prompts mit `trefferFuer()` und bekam «Datei nicht lesbar: anker» samt
// Exit 2 — die CLI las die argv des fremden Prozesses. Unter `vite-node` steht
// der Skriptpfad NICHT in `process.argv`, eine Einstiegspunkt-Weiche ist dort
// also kein gangbarer Weg (empirisch geprüft 4.8.2026). Die Auflösungs-Regel
// bleibt damit die EINE Wahrheit für «löst dieser Anker auf?» (§5), statt im
// Generator nachgebaut zu werden.
//
// Ein Bau-Agent braucht selten die ganze (oft > 100 KB) FAHRPLAN-Datei, sondern
// Kopf + §0 (Quer-Lektionen) + die zuständigen §§. Der Slicer liefert deterministisch
// genau das — plus IMMER das vollständige ##/###-Inventar (ToC, K §3 T3: gegen
// Querkontext-Blindheit). «Ganzdatei bei Unklarheit» bleibt der Rückfall.
//
//   npm run fahrplan -- <FAHRPLAN-Datei> <§...>
//   npm run fahrplan -- fahrplaene/FAHRPLAN-GESETZES-UX.md 10          → Kopf + §0 + §10 + ToC
//   npm run fahrplan -- fahrplaene/FAHRPLAN-TOKEN-OEKONOMIE.md §3 §8   → Kopf + §0/Stand + §3 + §8
//   npm run fahrplan -- fahrplaene/FAHRPLAN-GESETZES-UX.md 10.7        → Unter-§ (### 10.7)
//   npm run fahrplan -- fahrplaene/FAHRPLAN-X.md                       → nur Kopf + §0 + ToC
//   npm run fahrplan -- archiv/fahrplaene/FAHRPLAN-SPLIT-VIEW.md "§STRANG B"  → mehrwortiger Zeiger
//   npm run fahrplan -- FAHRPLAN-PERFORMANCE.md 1                      → barer Name wird aufgelöst
//
// Verschiedene FAHRPLAN-Dateien nummerieren unterschiedlich (`## §1`, `## 1 ·`,
// `### 10.7`, `## STRANG B`, `## Paket 3`). Der Matcher normalisiert: führendes «§»
// und Whitespace weg, dann Vergleich des ersten Wort-Tokens der Überschrift; greift
// das nicht, ein Präfix-Vergleich gegen den vollen Überschriften-Text (mehrwortige
// Zeiger). Trifft ein Schlüssel MEHRERE Überschriften, kommen ALLE in den Slice und
// die Mehrdeutigkeit steht in der Kopfzeile — nie still die erste (Fund 26).
// Mehrwortige Zeiger in Anführungszeichen übergeben, sonst splittet die Shell.
import { existsSync } from 'node:fs';

// Ablageorte, in denen ein BARER Dateiname gesucht wird. Reihenfolge = Vorrang:
// die aktive Fassung schlägt die archivierte.
export const SUCHORTE = ['fahrplaene', 'archiv'] as const;

/**
 * Löst einen Slicer-Dateiargument auf.
 *
 * Fund 4/5 der QS-TOK-Endprüfung (31.7.2026): Vier Skills (`perf`, `deploy-check`,
 * `korpus-werkstatt`, `abnahme`) nennen Fahrpläne weiterhin ohne Ordner — vor dem
 * AP-8-Umzug waren das gültige Wurzel-Pfade. Wer den dort genannten Namen 1:1
 * einsetzt, lief in `ENOENT` (reproduziert: `npm run fahrplan -- FAHRPLAN-PERFORMANCE.md 1`,
 * Exit 2). Enthält das Argument KEINEN Pfadtrenner und liegt es nicht im
 * Arbeitsverzeichnis, wird es in `fahrplaene/` und danach in `archiv/` gesucht.
 * Ein bereits qualifizierter Pfad wird nie umgebogen.
 *
 * @returns den auflösbaren Pfad oder `null` (dann meldet der Aufrufer wie bisher).
 */
export function aufloesenDatei(
  arg: string,
  da: (p: string) => boolean = (p) => existsSync(p),
): string | null {
  if (da(arg)) return arg;
  if (/[\\/]/.test(arg)) return null;
  for (const ort of SUCHORTE) {
    const kandidat = `${ort}/${arg}`;
    if (da(kandidat)) return kandidat;
  }
  return null;
}

export interface Heading {
  level: number; // 2 = ##, 3 = ###
  title: string; // Text nach «## »
  token: string; // erstes Wort, ohne führendes «§» (z. B. «10», «3», «10.7», «0b»)
  start: number; // Byte-/Zeichen-Offset der Überschrift im Volltext
}

const HEADING_RE = /^(#{2,3}) (.*)$/gm;

/** Normalisiert einen §-Schlüssel: «§10» → «10», « 3 » → «3». */
export function normKey(s: string): string {
  return s.trim().replace(/^§/, '').trim();
}

export function headings(md: string): Heading[] {
  const out: Heading[] = [];
  for (const m of md.matchAll(HEADING_RE)) {
    const title = m[2];
    const token = normKey(title.split(/\s+/)[0] ?? '');
    out.push({ level: m[1].length, title, token, start: m.index ?? 0 });
  }
  return out;
}

/** Ende-Offset einer Sektion: nächste Überschrift mit Level ≤ dem eigenen. */
function sektionEnde(hs: Heading[], i: number, laenge: number): number {
  for (let j = i + 1; j < hs.length; j++) {
    if (hs[j].level <= hs[i].level) return hs[j].start;
  }
  return laenge;
}

export interface SliceResult {
  text: string;
  gefunden: string[]; // aufgelöste Token
  fehlend: string[]; // angefragte, nicht gefundene Token
  mehrdeutig: { key: string; treffer: string[] }[]; // Token trifft mehrere Überschriften
}

/**
 * Findet ALLE Überschriften zu einem §-Schlüssel.
 *
 * Fund 26 der QS-TOK-Endprüfung (31.7.2026): `hs.find(x => x.token === k)` nahm den
 * ERSTEN Treffer und lieferte damit still die falsche Sektion — `§STRANG B` gab
 * «## STRANG A (✅ FERTIG)», `§Paket 3` gab «## Paket 1». Zwei Ursachen, beide hier
 * behoben:
 *  1. mehrteilige Zeiger («STRANG B», «Paket 3») trafen gar nichts, weil nur das
 *     ERSTE Wort der Überschrift als Token geführt wird → zusätzlich Präfix-Match
 *     auf den vollen Überschriften-Text;
 *  2. mehrdeutige Ein-Wort-Token wählten still den ersten → jetzt kommen ALLE
 *     Treffer in den Slice und die Mehrdeutigkeit wird in der Kopfzeile gemeldet.
 * Eindeutige Token verhalten sich unverändert (bestehende Fälle bleiben grün).
 */
export function trefferFuer(hs: Heading[], key: string): Heading[] {
  const exakt = hs.filter((x) => x.token === key);
  if (exakt.length) return exakt;
  const norm = key.toLowerCase();
  return hs.filter((x) => {
    const titel = normKey(x.title).toLowerCase();
    return titel === norm || titel.startsWith(`${norm} `);
  });
}

/**
 * Baut den Slice: Kopf (vor erster Überschrift) + §0-Sektion (falls vorhanden)
 * + Ziel-§§ + vollständiges ToC. Alle Sektionen VERBATIM (byte-treu).
 */
export function slice(md: string, keys: string[], datei = 'FAHRPLAN'): SliceResult {
  const hs = headings(md);
  const kopf = hs.length ? md.slice(0, hs[0].start) : md;

  // Immer mitliefern: eine «0»-Sektion (Quer-Lektionen / §0-Regeln), sofern vorhanden.
  const stets = hs.filter((h) => h.level === 2 && h.token === '0');
  const gewuenscht = keys.map(normKey).filter(Boolean);

  const gefunden: string[] = [];
  const fehlend: string[] = [];
  const mehrdeutig: { key: string; treffer: string[] }[] = [];
  const gewaehlt: Heading[] = [...stets];
  for (const k of gewuenscht) {
    const treffer = trefferFuer(hs, k);
    if (!treffer.length) {
      fehlend.push(k);
      continue;
    }
    // Alle Treffer aufnehmen — nie still den ersten wählen (Fund 26).
    for (const h of treffer) if (!gewaehlt.includes(h)) gewaehlt.push(h);
    gefunden.push(k);
    if (treffer.length > 1) mehrdeutig.push({ key: k, treffer: treffer.map((h) => h.title) });
  }
  // Nach Dokumentreihenfolge sortieren, Duplikate raus.
  const einzig = [...new Set(gewaehlt)].sort((a, b) => a.start - b.start);

  // ToC = vollständiges ##/###-Inventar (K §3 T3).
  const toc = hs
    .map((h) => `${h.level === 3 ? '  - ' : '- '}${'#'.repeat(h.level)} ${h.title}`)
    .join('\n');

  const teile: string[] = [];
  teile.push(
    `> **§-Slice von \`${datei}\`** (deterministisch, QS-TOK/T3). Enthalten: ` +
      `Kopf${stets.length ? ' + §0' : ''}${
        gefunden.length ? ' + §' + gefunden.join(' §') : ''
      }. **Ganzdatei bei Unklarheit:** \`cat ${datei}\` bzw. den ganzen §.` +
      (fehlend.length ? ` ⚠️ Nicht gefunden: ${fehlend.join(', ')}.` : '') +
      (mehrdeutig.length
        ? ` ⚠️ ${mehrdeutig
            .map((m) => `§${m.key} ist mehrdeutig (${m.treffer.length} Treffer: ${m.treffer.join(' · ')}) — ALLE enthalten`)
            .join('; ')}.`
        : ''),
  );
  teile.push(`\n## Inhalt — vollständiges ##/###-Inventar\n\n${toc}\n`);
  teile.push(`\n---\n\n${kopf.trimEnd()}\n`);
  for (const h of einzig) {
    teile.push(`\n${md.slice(h.start, sektionEnde(hs, hs.indexOf(h), md.length)).trimEnd()}\n`);
  }
  return { text: teile.join('\n'), gefunden, fehlend, mehrdeutig };
}
