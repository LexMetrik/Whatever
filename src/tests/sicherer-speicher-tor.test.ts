// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
import { alleQuellen, APP_WURZEL, rel } from './appDateien';

// ─── TOR: KEIN DIREKTER BROWSERSPEICHER-ZUGRIFF AUSSERHALB DES HELFERS ───────
// (W2·17-UI-BEFUNDE BG-01, 2.10.2026; CLAUDE.md §5 — EINE Stelle.)
//
// Wurzel des weissen Bildschirms bei gesperrtem Speicher: schon das Lesen der
// Eigenschaft `window.localStorage` WIRFT. Verstreute try/catch-Kopien hatten
// je eine eigene Lücke (useSeitenleiste, lesePosition, zuletztVerwendet). Der
// einzige wurfsichere Zugriff ist `src/lib/sichererSpeicher.ts`; dieses Tor
// verbietet in `src/` (ohne Tests) jeden Identifier `localStorage` /
// `sessionStorage` im CODE — Kommentare, Strings und JSX-Text zählen nicht
// (AST statt Regex, sonst schlügen Doku-Zeilen an).
//
// ROT (§6.7): in irgendeiner Nicht-Test-Datei unter src/ eine Zeile
// `localStorage.getItem('x')` einfügen — dieses Tor nennt Datei:Zeile.

/** Der Helfer selbst — die einzige Stelle, die den rohen Speicher berührt. */
const HELFER = 'lib/sichererSpeicher.ts';

/** Bekannte Ausnahmen (Pfad relativ zu src/): jede mit Grund und Rückbau-Auslöser. */
const AUSNAHMEN: Record<string, string> = {
  // Datei steht im Bau-Zeitraum in einem offenen PR (Reiter-/Split-Arbeit);
  // alle Zugriffe dort liegen bereits in try/catch (BG-01-Sonde: ladeTabs/
  // merkeTab/letzterGeschlossener werfen nicht). Nach Landung von PR #1275
  // auf lokalSpeicher umstellen und diesen Eintrag löschen.
  'lib/tabs.ts': 'nach PR #1275 umstellen',
};

function funde(quelle: string, name: string): number[] {
  const sf = ts.createSourceFile(name, quelle, ts.ScriptTarget.Latest, true, name.endsWith('x') ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
  const zeilen: number[] = [];
  const besuche = (n: ts.Node) => {
    if (ts.isIdentifier(n) && (n.text === 'localStorage' || n.text === 'sessionStorage')) {
      zeilen.push(sf.getLineAndCharacterOfPosition(n.getStart(sf)).line + 1);
    }
    ts.forEachChild(n, besuche);
  };
  besuche(sf);
  return zeilen;
}

describe('Tor: Browserspeicher nur über lib/sichererSpeicher.ts', () => {
  it('Sonde erkennt Code-Zugriffe, ignoriert Kommentar/String/JSX-Text', () => {
    const q = [
      '// localStorage im Kommentar',
      "const a = 'localStorage';",
      'const b = <em>sessionStorage</em>;',
      "const c = window.localStorage.getItem('x');",
      "const d = typeof sessionStorage;",
    ].join('\n');
    expect(funde(q, 'x.tsx')).toEqual([4, 5]);
  });

  it('kein direkter localStorage-/sessionStorage-Zugriff ausserhalb des Helfers', () => {
    const verstoesse: string[] = [];
    for (const datei of alleQuellen()) {
      const r = rel(datei);
      if (r === HELFER || r in AUSNAHMEN) continue;
      for (const z of funde(readFileSync(datei, 'utf8'), r)) verstoesse.push(`src/${r}:${z}`);
    }
    expect(verstoesse, 'Direkter Speicherzugriff — stattdessen lokalSpeicher/sitzungsSpeicher aus lib/sichererSpeicher.ts').toEqual([]);
  });

  it('Ausnahmeliste enthält nur Dateien, die den Zugriff wirklich noch haben', () => {
    for (const r of Object.keys(AUSNAHMEN)) {
      const n = funde(readFileSync(`${APP_WURZEL}/${r}`, 'utf8'), r).length;
      expect(n, `${r} ist umgestellt — Ausnahme löschen`).toBeGreaterThan(0);
    }
  });
});
