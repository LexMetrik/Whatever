import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  bereinigeZitierteNormen, istPhantomNormzitat, verlegeSeitenmarkerVorNormzitat,
} from '../lib/rechtsprechung/seitenmarker';
import { bereinigeFliesstext } from '../lib/rechtsprechung/register';

// U-04 (plan/FEHLERBESTAND.md): der Kolumnentitel «BGE 147 III 218 S. 221» der amtlichen Sammlung
// steht mitten im Normzitat («Art. 257d BGE 147 III 218 S. 221 Abs. 1 OR»); die Zitat-Erkennung
// las daraus «Art. 257d BGE». Belege: BGE 147 III 218 E. 3.3.2 (Original-Fundstelle des Satzes),
// amtliche Sammlung https://www.bger.ch (clir) — der Vermerk ist ein Layout-Artefakt der Seite.

const MARKER_ALLE = /\bBGE\s+\d+\s+[IVXLCDM]+[ab]?\s+\d+\s+S\.\s*\d+\b/g;
const ohneMarker = (t: string) => t.replace(MARKER_ALLE, ' ').replace(/\s+/g, ' ').trim();

describe('verlegeSeitenmarkerVorNormzitat', () => {
  it('Anlassfall BGE 147 III 218: Marker steht vor «Art. 257d», nicht mittendrin', () => {
    const roh = 'dass der Mietzins bei Hinterlegung innert der Zahlungsfrist von Art. 257d BGE 147 III 218 S. 221 Abs. 1 OR als bezahlt gelte';
    const neu = verlegeSeitenmarkerVorNormzitat(roh);
    expect(neu).toBe('dass der Mietzins bei Hinterlegung innert der Zahlungsfrist von BGE 147 III 218 S. 221 Art. 257d Abs. 1 OR als bezahlt gelte');
    expect(neu).not.toMatch(/Art\. \d+[a-z]* BGE\b/);
  });

  it('zusammenhängende Kopf-Glieder wandern gemeinsam (Art. + Abs. + Satz)', () => {
    const roh = 'an Art. 391 Abs. 2 BGE 146 IV 172 S. 183 Satz 1 StPO anknüpfende Ausnahme';
    expect(verlegeSeitenmarkerVorNormzitat(roh)).toBe('an BGE 146 IV 172 S. 183 Art. 391 Abs. 2 Satz 1 StPO anknüpfende Ausnahme');
    const kette = 'von Art. 391 Abs. 2 Satz 1 BGE 146 IV 172 S. 183 StPO';
    expect(verlegeSeitenmarkerVorNormzitat(kette)).toBe('von BGE 146 IV 172 S. 183 Art. 391 Abs. 2 Satz 1 StPO');
  });

  it('nur das letzte Zitat einer Aufzählung wird berührt', () => {
    const roh = '(vgl. Art. 34 Abs. 3 und Art. 44 BGE 149 II 96 S. 103 Abs. 1 SVG)';
    expect(verlegeSeitenmarkerVorNormzitat(roh)).toBe('(vgl. Art. 34 Abs. 3 und BGE 149 II 96 S. 103 Art. 44 Abs. 1 SVG)');
  });

  it('Literaturzitat (N. … zu Art.) und altes Recht (aArt.)', () => {
    expect(verlegeSeitenmarkerVorNormzitat('N. 13 zu Art. 80 BGE 146 III 284 S. 286 SchKG; STÉPHANE'))
      .toBe('N. 13 zu BGE 146 III 284 S. 286 Art. 80 SchKG; STÉPHANE');
    expect(verlegeSeitenmarkerVorNormzitat('nach dem damals geltenden aArt. 47 BGE 150 V 305 S. 312 Abs. 2 AHVG auf'))
      .toBe('nach dem damals geltenden BGE 150 V 305 S. 312 aArt. 47 Abs. 2 AHVG auf');
  });

  it('Wortinvariante, Idempotenz und Nulldifferenz ohne Marker', () => {
    const faelle = [
      'von Art. 257d BGE 147 III 218 S. 221 Abs. 1 OR als',
      'Art. 391 Abs. 2 BGE 146 IV 172 S. 183 Satz 1 StPO',
      'zwei Marker: Art. 4 BGE 146 V 51 S. 71 ATSG und Art. 43 BGE 146 V 51 S. 70 Abs. 1 ATSG',
      'ohne jeden Marker, nur Art. 4 ATSG und BGE 140 III 1 E. 3 S. 4 als Fundstelle',
      'Marker mitten im Satz ohne Kopf: Nach BGE 147 III 218 S. 223 dem Willen des Gesetzgebers',
    ];
    for (const t of faelle) {
      const n = verlegeSeitenmarkerVorNormzitat(t);
      expect(ohneMarker(n), t).toBe(ohneMarker(t));
      expect(verlegeSeitenmarkerVorNormzitat(n), t).toBe(n);
    }
    // Marker ohne Zitat-Kopf bleibt an seiner Stelle; Text ohne Marker kommt identisch zurück (§6).
    expect(verlegeSeitenmarkerVorNormzitat(faelle[4])).toBe(faelle[4]);
    expect(verlegeSeitenmarkerVorNormzitat(faelle[3])).toBe(faelle[3]);
  });

  it('bereinigeFliesstext wendet die Regel an (Adapter-Pfad)', () => {
    expect(bereinigeFliesstext('von Art. 257d\nBGE 147 III 218 S. 221\nAbs. 1 OR'))
      .toBe('von BGE 147 III 218 S. 221 Art. 257d Abs. 1 OR');
  });
});

describe('Phantom-Einträge in zitierteNormen', () => {
  it('erkennt «Art. N BGE» und «Art. N Abs. N BGE», aber keine echten Erlasse', () => {
    expect(istPhantomNormzitat('Art. 257d BGE')).toBe(true);
    expect(istPhantomNormzitat('Art. 2 Abs. 2 BGE')).toBe(true);
    expect(istPhantomNormzitat('Art. 59 BGERR')).toBe(false);   // BGerR = Reglement für das Bundesgericht
    expect(istPhantomNormzitat('Art. 82 BGG')).toBe(false);
    expect(bereinigeZitierteNormen(['Art. 257d Abs. 1 OR', 'Art. 257d BGE', 'Art. 259g CO']))
      .toEqual(['Art. 257d Abs. 1 OR', 'Art. 259g CO']);
  });
});

// Korpus-Tor: die gelieferten BGE-Snapshots tragen das Phantom nirgends mehr (Wortgrenze: «BGERR» ist
// ein echtes Kürzel). Vorher: 85 Treffer in 64 Dateien (grep -roE 'Art\. [0-9]+[a-z]{0,9} BGE', 7.10./11.10.2026).
describe('Korpus: kein Phantomzitat «Art. … BGE»', () => {
  const dir = join(process.cwd(), 'public', 'rechtsprechung', 'bund', 'bge');
  const treffer: string[] = [];
  for (const f of readdirSync(dir).filter((n) => n.endsWith('.json'))) {
    const roh = readFileSync(join(dir, f), 'utf8');
    if (/Art\. [0-9]+[a-z]{0,9} BGE\b/.test(roh)) treffer.push(f);
  }
  it('0 BGE-Dateien mit «Art. n BGE»', () => {
    expect(treffer).toEqual([]);
  });
});
