import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { ohneKommentare } from './appDateien';

// ═══ W2·5m/E2 · DER §5-WÄCHTER DER DOSSIER-BLÖCKE ═══════════════════════════
//
// Kap. 15.5 wörtlich: «§5: kein zweites Modul, keine Kopie — wer im Bau eine
// `EinzelBlockEntscheide.tsx` anlegt, hat den Schritt verfehlt.» Das ist die
// Zusage, die dieser Schritt trägt: der Einzelmodus zeigt DIESELBEN Rubriken
// wie die Funktionszeile am Artikelende, aus derselben Rechnung, mit denselben
// Ladepfaden — er entfaltet sie nur grosszügiger.
//
// Eine solche Zusage ist ohne Wächter eine Absichtserklärung: die naheliegende
// Abkürzung im nächsten Bau ist genau der eigene Lader «nur für den Block».
// Darum prüft diese Sonde die QUELLEN, nicht das Bild — sie liest die Importe.
//
// ── ROT GEFAHREN (§6.7), am gebauten Stand 14.9.2026 ───────────────────────
//  (a) `import { useBezuege } from '../bezuegeLaden'` in `ArtikelDossier.tsx`
//      eingefügt  ⇒  «ArtikelDossier.tsx lädt selbst: bezuegeLaden» ROT.
//  (b) Datei `src/pages/gesetz-leser/parts/EinzelBlockEntscheide.tsx` angelegt
//      ⇒  «zweites Block-Modul gefunden: EinzelBlockEntscheide.tsx» ROT.
//  (c) Eine zweite Marken-Liste in `ArtikelDossier.tsx` angelegt
//      ⇒  «Marken werden an 2 Stellen gebaut» ROT.
//  (d) `RECHTSPRECHUNG_BLOCK_FREI` still auf `true` gesetzt
//      ⇒  M3-Fall ROT (genau der Diff, den M3 sichtbar halten will).
// Alle vier danach zurückgenommen; die Sonde ist grün.
// ERGÄNZT 2.10.2026 (Rückbau Rechtsprechungs-Zeilen, W2·17-UI-BEFUNDE): (d) und der
// zugehörige M3-Fall entfallen — die Konstante `RECHTSPRECHUNG_BLOCK_FREI` und die
// Rubrik `r` sind aus dem Dossier gelöscht; die Abwesenheit des Blocks sichert
// `e2e/leser-einzelmodus.e2e.ts` (`data-dossier-reg="r"` Anzahl 0).

const WURZEL = resolve(import.meta.dirname ?? '.', '..');
const DOSSIER = 'pages/gesetz-leser/parts/ArtikelDossier.tsx';
const lies = (p: string) => readFileSync(resolve(WURZEL, p), 'utf8');
// Kommentare zählen nicht (geteiltes Sieb `ohneKommentare`) — sie NENNEN die Lader, das ist ihr Zweck.
/**
 * Nur Code, auch für POSITIV-Proben (W2·19 Kleinaufräumen 2, 30.9.2026): das
 * geteilte Sieb streicht ganze Kommentarzeilen und Blöcke, lässt aber den
 * Zeilenend-Kommentar hinter Code stehen (`x(); // marken: readonly BezugsMarke[]`).
 * Für die ABWESENHEITS-Probe (Lader) ist das unschädlich (ein Kommentar kann nur
 * zu viel finden), für eine ANWESENHEITS-Probe ist es ein Schlupfloch: ein
 * Kommentar könnte sie erfüllen, nachdem der Code weg ist. `[ \t]//` (Leerraum
 * vor dem Doppelstrich) lässt `http://` in Zeichenketten unberührt.
 */
const nurCode = (s: string): string => ohneKommentare(s).replace(/[ \t]\/\/.*$/gm, '');

/**
 * Die Datenlader des Artikel-Kontexts. Jeder von ihnen ist ein eigener
 * Netzweg bzw. ein eigener Shard — ein zweiter Aufrufer wäre eine zweite
 * Ladung derselben Daten (§5/§15), und im schlimmeren Fall eine zweite ZAHL
 * neben der, die die Funktionszeile zeigt (§8, der D30-Befund «11 Entscheide
 * im Kopf gegen 3 gezeigte»).
 */
const LADER = [
  'bezuegeLaden', 'bezuegeZaehler', 'artikelMaterialienLaden', 'historie-laden',
  'werkzeuge', 'norm-index', 'panelKontextLaden', 'entscheidZahl', 'fassungsEtikett',
];

describe('W2·5m/E2 · die Dossier-Blöcke haben KEINE eigene Quelle', () => {
  it('das Dossier lädt und zählt nichts selbst — es bekommt fertige Marken', () => {
    const quelle = ohneKommentare(lies(DOSSIER));
    const treffer = LADER.filter((l) => quelle.includes(l));
    expect(
      treffer,
      `${DOSSIER} lädt oder rechnet selbst: ${treffer.join(', ')} — die Rubriken `
      + 'werden in `ArtikelLeser.bezuegeFuss.tsx` gerechnet, und zwar EINMAL '
      + 'für beide Gestalten (Kap. 15.5, §5).',
    ).toEqual([]);
  });

  it('das Dossier bezieht seinen Bestand aus der Prop `marken`', () => {
    // Positiv formuliert, damit die Sonde nicht bloss Abwesenheit prüft: fiele
    // die Prop weg, käme der Bestand zwangsläufig von woanders.
    const quelle = nurCode(lies(DOSSIER));
    expect(quelle).toMatch(/marken:\s*readonly BezugsMarke\[\]/);
    expect(quelle).toMatch(/bloeckeAus\(marken\)/);
  });

  it('es gibt kein zweites Block-Modul neben dem einen', () => {
    // Kap. 15.5 nennt den Fehlgriff beim Namen: `EinzelBlockEntscheide.tsx`.
    // Geprüft wird das MUSTER, nicht dieser eine Name — sonst genügte eine
    // Umbenennung, um an der Sonde vorbeizukommen.
    const verzeichnisse = ['pages/gesetz-leser/parts', 'pages/gesetz-leser/v3'];
    const gefunden: string[] = [];
    for (const v of verzeichnisse) {
      for (const datei of readdirSync(resolve(WURZEL, v))) {
        if (/^(Einzel|Dossier).*(Block|Entscheide|Materialien|Verweise|Historie|Werkzeuge)/.test(datei)) {
          gefunden.push(`${v}/${datei}`);
        }
      }
    }
    expect(
      gefunden,
      'zweites Block-Modul gefunden — der Einzelmodus entfaltet die BESTEHENDEN '
      + 'Rubriken, er baut sie nicht nach (Kap. 15.5).',
    ).toEqual([]);
  });

  it('die Marken werden an GENAU EINER Stelle gerechnet', () => {
    // Wer eine zweite `BezugsMarke[]`-Liste anlegt, hat die Rechnung kopiert —
    // und mit ihr die Zahlen, die Leerzustände und die Ladebedarfe.
    const verzeichnisse = ['pages/gesetz-leser/parts', 'pages/gesetz-leser/v3'];
    const bauer: string[] = [];
    for (const v of verzeichnisse) {
      for (const datei of readdirSync(resolve(WURZEL, v))) {
        if (!datei.endsWith('.tsx') && !datei.endsWith('.ts')) continue;
        const quelle = nurCode(lies(`${v}/${datei}`));
        // Eine Marken-RECHNUNG erkennt man am FELD eines Objektliterals — am
        // Komma dahinter. Weder die Typ-Annotation (`const raus: BezugsMarke[]
        // = []`, eine leere Sammelliste) noch die Union im Typ selbst
        // (`reg: 'f' | 'r' | …` in `Funktionszeile.tsx`) sind eine Rechnung.
        if (/\breg:\s*'[frmgw]',/.test(quelle)) bauer.push(datei);
      }
    }
    expect(bauer, `Marken werden an ${bauer.length} Stellen gebaut: ${bauer.join(', ')}`)
      .toEqual(['ArtikelLeser.bezuegeFuss.tsx']);
  });
});

describe('nurCode (Selbsttest der Positiv-Proben)', () => {
  it('ein Zeilenend-Kommentar erfüllt keine Anwesenheits-Probe mehr; Code und URLs bleiben', () => {
    const quelle = [
      'const url = "https://x.ch/a"; // bleibt',
      'const a = 1; // marken: readonly BezugsMarke[]',
      '/* bloeckeAus(marken) */ const b = 2;',
      'const RECHTSPRECHUNG_BLOCK_FREI = false;',
    ].join('\n');
    // Das geteilte Sieb allein liesse den Zeilenend-Kommentar stehen (der Schlupf) …
    expect(ohneKommentare(quelle)).toMatch(/marken:\s*readonly BezugsMarke\[\]/);
    // … nurCode nicht; Code-Treffer bleiben erhalten.
    expect(nurCode(quelle)).not.toMatch(/marken:\s*readonly BezugsMarke\[\]/);
    expect(nurCode(quelle)).not.toMatch(/bloeckeAus\(marken\)/);
    expect(nurCode(quelle)).toMatch(/RECHTSPRECHUNG_BLOCK_FREI\s*=\s*false/);
    expect(nurCode(quelle)).toContain('https://x.ch/a');
  });
});
