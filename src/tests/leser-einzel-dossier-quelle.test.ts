import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

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

const WURZEL = resolve(import.meta.dirname ?? '.', '..');
const DOSSIER = 'pages/gesetz-leser/parts/ArtikelDossier.tsx';
const lies = (p: string) => readFileSync(resolve(WURZEL, p), 'utf8');
/** Kommentare zählen nicht — sie NENNEN die Lader, das ist ihr Zweck. */
const ohneKommentare = (s: string) =>
  s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');

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
    const quelle = ohneKommentare(lies(DOSSIER));
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
        const quelle = ohneKommentare(lies(`${v}/${datei}`));
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

  it('M3 · der Rechtsprechungs-Block ist angeschlossen, aber nicht freigegeben', () => {
    // Kap. 15.2/M3: solange der Phantom-Filter unter `QS-KORPUS` offen ist,
    // wird Block 3 NICHT ausgeliefert — ein prominenter Block mit erheblichem
    // Fehlanteil ist negativer Mehrwert. Die Sonde hält den Stand fest: fällt
    // die Konstante still auf `true`, ist DAS der Diff.
    const quelle = ohneKommentare(lies(DOSSIER));
    expect(quelle).toMatch(/RECHTSPRECHUNG_BLOCK_FREI\s*=\s*false/);
    // Und die Marke `r` wird ausschliesslich durch diese Konstante gefiltert —
    // nicht dadurch, dass sie gar nicht erst hereinkäme.
    expect(quelle).toMatch(/reg === 'r' && !RECHTSPRECHUNG_BLOCK_FREI/);
  });
});
