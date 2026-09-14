import { describe, it, expect } from 'vitest';
import { renderToString } from 'react-dom/server';
import { NormChip } from '../components/vorlagen/NormChip';
import { LocaleProvider } from '../components/locale';
import { artikelImErlass, sammelblockFuer } from '../lib/normtext/artikel-bestand';
import { bundSnapshotRef } from '../lib/normtext/bundRef';

// ─── Z6c (W2·22-VERWEIS-FEDLEX) · toter Artikel-Anker → Erlass-Link ─────────
//
// Bis hierher entstand der Artikel-Anker eines Fremdverweises allein aus
// Kürzel + Nummer. Gemessen 14.9.2026 (`npm run check:verweis-inventar`,
// Sonderliste `toteFremdanker` in `messwerte/verweis-inventar.json`): 36 von
// 9 675 prüfbaren Fremd-Ankern zeigen auf eine Bestimmung, die der Snapshot des
// Zielerlasses nicht kennt.
//
// Die Proben unten sind KEINE erfundenen Fälle, sondern gemessene Korpus-
// Stellen, jede amtlich gegengeprüft (Fedlex-SPARQL + AKN-XML, 14.9.2026):
//   · «Artikel 91a StGB»  — JStG Art. 19/19c/27a/28. Im StGB gibt es die
//     Nummer NICHT (Nachbaranker amtlich nur art_91, art_92, art_92_a).
//   · «Art. 882 ZGB»      — ZH-230 § 44, SG-3849 Art. 84. Amtlich aufgehoben
//     und nur im Sammel-Anker `id="art_876_883"` («Art. 876–883 Aufgehoben»).
//   · «Art. 321 StGB»     — der Normalfall: Ziel existiert, Anker bleibt.
//
// §6.7: Der Test kann scheitern — würde der Fallback entfernt, trügen die
// beiden ersten Proben wieder ein `#art`-Fragment.

const ssr = (el: React.ReactElement) => renderToString(<LocaleProvider>{el}</LocaleProvider>);

describe('Z6c — artikelImErlass: die drei Lagen', () => {
  it('Ziel-Token existiert → true (StGB Art. 321)', () => {
    expect(artikelImErlass('STGB', '321')).toBe(true);
  });

  it('Ziel-Token existiert nicht → false (StGB Art. 91a; amtlich 0 Treffer)', () => {
    expect(artikelImErlass('STGB', '91_a')).toBe(false);
    // Abgrenzung: der NACHBAR existiert — der Fehlschlag ist der Buchstabe,
    // nicht die Zahl. Ein Fallback, der auf «91» ausweicht, wäre Raten (§1).
    expect(artikelImErlass('STGB', '91')).toBe(true);
  });

  it('Ziel-Erlass ohne Bund-Snapshot → null (nicht prüfbar, §8)', () => {
    expect(artikelImErlass('GIBTESNICHT', '1')).toBeNull();
  });

  it('Schreibweise entscheidet nicht: «335_c», «335c», «335 C» sind dasselbe Token', () => {
    for (const t of ['335_c', '335c', '335 C']) expect(artikelImErlass('OR', t)).toBe(true);
  });

  it('Sammelblock wird als solcher erkannt, gilt aber NICHT als Treffer', () => {
    expect(artikelImErlass('ZGB', '882')).toBe(false);
    expect(sammelblockFuer('ZGB', '882')).toBe('876_883');
    // Ein lebendes Ziel liegt in keinem Sammelblock.
    expect(sammelblockFuer('STGB', '321')).toBeNull();
  });
});

describe('Z6c — NormChip: kein toter Sprung', () => {
  it('lebendes Ziel: Artikel-Anker unverändert', () => {
    const out = ssr(<NormChip artikel="Art. 321 StGB" />);
    expect(out).toContain('href="/gesetze/bund/STGB#art-321"');
  });

  it('totes Ziel, interner Pfad: Erlass-Link OHNE Anker-Fragment', () => {
    // Ohne den Fallback stünde hier «/gesetze/bund/STGB#art-91_a» — ein Sprung
    // auf ein Element, das die Lesesicht nicht hat.
    const out = ssr(<NormChip artikel="Art. 91a StGB" />);
    expect(out).not.toContain('#art-91_a');
    expect(out).toContain('href="https://www.fedlex.admin.ch/eli/cc/54/757_781_799/de"');
  });

  it('totes Ziel, Fedlex-Pfad (zielIntern=false): Erlass-URL ohne #art_-Fragment', () => {
    const out = ssr(<NormChip artikel="Art. 882 ZGB" zielIntern={false} />);
    expect(out).not.toContain('#art_882');
    expect(out).not.toContain('#art_876_883'); // kein geratener Sammelblock-Sprung
    expect(out).toContain('/eli/cc/24/233_245_233/de"');
  });

  it('lebendes Ziel, Fedlex-Pfad: Deep-Link bleibt', () => {
    const out = ssr(<NormChip artikel="Art. 321 StGB" zielIntern={false} />);
    expect(out).toContain('#art_321');
  });

  it('Ziel nicht auflösbar: Verhalten unverändert (kein Fallback, §8)', () => {
    // Dritte Lage: `bundSnapshotRef` liefert keinen Bezug, die Bestandsfrage ist
    // also gar nicht gestellt. Heute (14.9.2026) trägt JEDES FEDLEX-Kürzel einen
    // Bund-Snapshot — der Fall entsteht darum an einem unbekannten Kürzel, und
    // im Korpuslauf an 9 Stellen. Der Chip bleibt dann der Chip von vorher.
    expect(bundSnapshotRef('Art. 5 UNBEKANNT')).toBeNull();
    const out = ssr(<NormChip artikel="Art. 5 UNBEKANNT" />);
    expect(out).toContain('<span class="lc-chip">'); // kein auflösbarer Link — wie bisher
  });
});
