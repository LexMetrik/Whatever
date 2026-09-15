import { describe, it, expect } from 'vitest';
import { renderToString } from 'react-dom/server';
import { ArtikelBody } from '../components/normtext/ArtikelBody';
import { SUCH_META } from '../pages/gesetz-leser/suchHighlight';
import type { NormSnapshot } from '../lib/normtext/typen';

// ═══ §4.4-Vertrag «gemalte ≤ gezählte» an den Aufhebungs-Platzhaltern ════════
//
// Bug-Check §9 zu W2·19-S8, Befund B2. Der Reader malt für eine aufgehobene
// Bestimmung einen ERSATZTEXT — das Wort «aufgehoben» —, den es im Snapshot
// nicht gibt: gespeichert ist dort ein LEERER Text bzw. «…» (S3, BS-Audit
// 23.6.2026: kein fabrizierter Wortlaut, §7). Der datenseitige Suchindex
// (leserSuche.ts) kennt darum nur die leere Zeichenkette.
//
// Folge ohne Marker: die Suche «aufgehoben» zählt 0 Fundstellen in diesem
// Artikel, der `sammleTrefferRanges`-Walker malt sie aber — die verbotene
// Richtung des §4.4-Vertrags. Sichtbar wird das als Selbstwiderspruch: die
// Leiste sagt «Kein Artikel gefunden», während in der Lesespalte Stellen
// leuchten; korpusweit betrifft es rund 85 Artikel.
//
// WARUM DIESER TEST UND NICHT EIN e2e-FALL. Der Vertrag ist eine Eigenschaft
// des MARKUPS, nicht des Zusammenspiels: trägt der Platzhalter das
// Meta-Attribut, überspringt der Walker ihn per Konstruktion (die
// Ausgrenzung lebt in `sammleTrefferRanges` und nur dort, §5). Ein e2e-Fall
// prüfte dieselbe Zeile über drei Schichten hinweg und wäre langsamer und
// unschärfer. Der e2e-Fall für die SICHTBARE Wirkung kommt zusätzlich (B8).
//
// ROT VOR DEM FIX: beide Fälle scheiterten («expected … to contain
// data-such-meta») — die Platzhalter-Spans trugen das Attribut nicht.
describe('B2 — Aufhebungs-Platzhalter sind Bedienung, nicht Wortlaut', () => {
  // RE-BLESS W2·27 (15.9.2026, §6.3 deklariert): der Platzhalter am LEEREN Block
  // ohne amtlichen Vermerk heisst «kein Text im Snapshot» statt «aufgehoben».
  // Der geprüfte Vertrag (Ersatztext trägt data-such-meta) ist unverändert.
  it('Leerstelle eines Blocks: Platzhalter trägt data-such-meta', () => {
    const bloecke: NormSnapshot['bloecke'] = [{ absatz: null, text: '' }];
    const out = renderToString(
      <ArtikelBody bloecke={bloecke} artikel="12" passus={{ absatz: null }} />,
    );
    expect(out).toContain('kein Text im Snapshot');
    expect(out).toContain(SUCH_META);
  });

  // RE-BLESS W2·27 (15.9.2026, §6.3 deklariert): ebenso am leeren Item.
  it('leere lit./Ziff.: auch der Item-Platzhalter trägt ihn', () => {
    const bloecke: NormSnapshot['bloecke'] = [{
      absatz: '1',
      text: 'Der Vertrag endet:',
      items: [
        { marke: 'a.', text: 'durch Zeitablauf;' },
        { marke: 'b.', text: '' },
      ],
    }];
    const out = renderToString(
      <ArtikelBody bloecke={bloecke} artikel="13" passus={{ absatz: null }} />,
    );
    expect(out).toContain('kein Text im Snapshot');
    expect(out).toContain(SUCH_META);
  });

  it('Ein Block MIT Wortlaut bleibt unangetastet — kein Meta-Attribut im Fliesstext', () => {
    // Gegenprobe (§6.7): der Marker darf nicht pauschal überall stehen, sonst
    // verschwände echter Wortlaut aus der Suche — die andere, schlimmere
    // Verletzung desselben Vertrags.
    const bloecke: NormSnapshot['bloecke'] = [{ absatz: '1', text: 'Die Bestimmung gilt.' }];
    const out = renderToString(
      <ArtikelBody bloecke={bloecke} artikel="14" passus={{ absatz: null }} />,
    );
    expect(out).toContain('Die Bestimmung gilt.');
    expect(out).not.toContain(SUCH_META);
  });
});
