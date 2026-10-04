// W2·27-BUND-FERTIG (30.9.2026, Nachzug Gegenprüfung #1204, Befund «Beilage»):
// Fortsetzungszeilen in Anhang-Listen.
//
// Fedlex setzt die Kategorie-Beschreibung der VZV-«Beilage» (SR 741.51, ELI
// cc/1976/2423_2423_2423, Konsolidierung 20260101, abgerufen 30.9.2026) als
// <dl> aus <dt>/<dd>-Paaren; ein LEERES <dt> mit Text-<dd> ist die
// Fortsetzungszeile des vorausgehenden Items («B: Motorwagen …;» + 2 Zeilen
// «Fahrzeugkombinationen …»). Der Anhang-Pfad stellte diese Zeilen als lose
// Absätze VOR die Liste; die Kategorie B wirkte verkürzt (§8/§1). Der Haupttext
// (VZV art_3) hängt sie richtig ans Item (parseDefinitionsListe).
//
// Fixture: der Anfang der <dl> WÖRTLICH aus dem Cache (Kategorien A, B mit zwei
// Zeilen, C mit einer, D), Kopf gekürzt.
import { describe, it, expect } from 'vitest';
import { extrahiereAnhang } from '../../scripts/normtext/extrahiere-fedlex.ts';
import { ohneFortsetzungen } from '../../scripts/normtext/anhang-fortsetzung.ts';

const DL =
  '<dl class="man-space-after-0"><dt class="man-space-before-4"><span data-message="E40S10-TAB">[tab]</span></dt><dd class="man-space-before-4"><b>Kategorien:</b></dd><dt class="man-space-before-4">A: </dt><dd class="man-space-before-4">Motorräder</dd><dt class="man-space-before-4">B: </dt><dd class="man-space-before-4">Motorwagen und dreirädrige Motorfahrzeuge mit einem Gesamtgewicht von nicht mehr als 3500 kg und nicht mehr als acht Plätzen ausser dem Führersitz;</dd><dt class="man-space-before-4"></dt><dd class="man-space-before-4">Fahrzeugkombinationen aus einem Zugfahrzeug der Kategorie B und einem Anhänger, dessen Gesamtgewicht 750&nbsp;kg nicht übersteigt;</dd><dt class="man-space-before-4"></dt><dd class="man-space-before-4">Fahrzeugkombinationen aus einem Zugfahrzeug der Kategorie B und einem Anhänger mit einem Gesamtgewicht von mehr als 750&nbsp;kg, sofern das Gesamtzugsgewicht 3500&nbsp;kg nicht übersteigt;</dd><dt class="man-space-before-4">C: </dt><dd class="man-space-before-4">Motorwagen mit einem Gesamtgewicht von mehr als 3500&nbsp;kg und nicht mehr als acht Plätzen ausser dem Führersitz;</dd><dt class="man-space-before-4"></dt><dd class="man-space-before-4">Fahrzeugkombinationen aus einem Zugfahrzeug der Kategorie C und einem Anhänger, dessen Gesamtgewicht 750&nbsp;kg nicht übersteigt;</dd><dt class="man-space-before-4">D: </dt><dd class="man-space-before-4">Motorwagen zum Personentransport mit mehr als acht Plätzen ausser dem Führersitz; </dd></dl>';

const wrap = (dl: string) =>
  '<div id="annex"><section id="annex_u1"><h1 class="heading" role="heading" aria-level="1"><a href="#annex_u1">Beilage</a></h1><div class="collapseable">' +
  dl +
  '</div></section></div>';

describe('Anhang-<dl>: leeres <dt> + Text-<dd> = Fortsetzung des vorausgehenden Items', () => {
  const ex = extrahiereAnhang(wrap(DL), 'annex_u1')!;
  const items = ex.bloecke.flatMap((b) => b.items ?? []);

  it('kein loser Absatz «Fahrzeugkombinationen …» vor der Liste', () => {
    expect(ex.bloecke.filter((b) => /^Fahrzeugkombinationen/.test(b.text))).toEqual([]);
  });

  it('Kategorie B trägt ihre beiden Anhänger-Kombinationen, in Quellreihenfolge', () => {
    const b = items.find((i) => i.marke === 'B')!;
    expect(b.text).toBe(
      'Motorwagen und dreirädrige Motorfahrzeuge mit einem Gesamtgewicht von nicht mehr als 3500 kg und nicht mehr als acht Plätzen ausser dem Führersitz; ' +
        'Fahrzeugkombinationen aus einem Zugfahrzeug der Kategorie B und einem Anhänger, dessen Gesamtgewicht 750 kg nicht übersteigt; ' +
        'Fahrzeugkombinationen aus einem Zugfahrzeug der Kategorie B und einem Anhänger mit einem Gesamtgewicht von mehr als 750 kg, sofern das Gesamtzugsgewicht 3500 kg nicht übersteigt;',
    );
  });

  it('Kategorie C trägt ihre Kombination; A und D bleiben unverändert', () => {
    expect(items.find((i) => i.marke === 'C')!.text).toMatch(
      /ausser dem Führersitz; Fahrzeugkombinationen aus einem Zugfahrzeug der Kategorie C und einem Anhänger, dessen Gesamtgewicht 750 kg nicht übersteigt;$/,
    );
    expect(items.find((i) => i.marke === 'A')!.text).toBe('Motorräder');
    expect(items.find((i) => i.marke === 'D')!.text).toBe(
      'Motorwagen zum Personentransport mit mehr als acht Plätzen ausser dem Führersitz;',
    );
  });

  it('Text erscheint genau einmal (keine Dublette als Notiz UND als Item-Anhang)', () => {
    const alles = JSON.stringify(ex.bloecke);
    expect(alles.match(/Kategorie C und einem Anhänger/g)).toHaveLength(1);
  });
});

// ── Grenzen der Regel (Mutationsfestigkeit, 2. Gegenprüfung #1204, 1.10.2026) ──────
// Die Regel hängt eine Zeile NUR an ein Item OHNE Unterliste. Bei mehrdeutigem Bezug
// blieb sie bis P4 Prosa-Notiz VOR der Liste; seit P4 (W2·27-BUND-FERTIG, 2.10.2026) steht
// sie als eigener Block AN IHRER STELLE — DEKLARIERTE Fachänderung (§6.3): M1/M2 hielten das
// frühere «lose vor der Liste» fest und halten jetzt die Quellreihenfolge fest (Regel und
// Belege: scripts/normtext/anhang-fortsetzung.ts, Tests: normtext-anhang-zwischennotiz.test.ts).
// Fixtures strukturtreu nach AVO Anh. 1 (B8-Definition) bzw. FIDLEV Anh. 2 (lit. e).
const liste = (dl: string) => extrahiereAnhang(wrap(dl), 'annex_u1')!;
const itemsVon = (ex: ReturnType<typeof liste>) => ex.bloecke.flatMap((b) => b.items ?? []);

describe('Anhang-Fortsetzung: Zeile mit EIGENER Unterliste wird nicht angehängt, sondern steht an ihrer Stelle (M1, P4)', () => {
  const ex = liste(
    '<dl><dt>B8 </dt><dd>Sonstige Sachschäden</dd>' +
      '<dt></dt><dd>Sämtliche Sachschäden durch:<dl><dt>a. </dt><dd>Hagel;</dd><dt>b. </dt><dd>Frost.</dd></dl></dd></dl>',
  );
  it('Item B8 bleibt unverändert, der Einleitungssatz steht als eigener Block (genau einmal) HINTER B8', () => {
    expect(itemsVon(ex).find((i) => i.marke === 'B8')!.text).toBe('Sonstige Sachschäden');
    expect(ex.bloecke.filter((b) => b.text === 'Sämtliche Sachschäden durch:')).toHaveLength(1);
    expect(JSON.stringify(ex.bloecke).match(/Sämtliche Sachschäden durch:/g)).toHaveLength(1);
    const blockB8 = ex.bloecke.findIndex((b) => (b.items ?? []).some((i) => i.marke === 'B8'));
    const blockSatz = ex.bloecke.findIndex((b) => b.text === 'Sämtliche Sachschäden durch:');
    expect(blockSatz).toBeGreaterThan(blockB8); // vorher (M1 alt): VOR der Liste
  });
  it('die Unterliste-Items bleiben erhalten, in Quellreihenfolge', () => {
    expect(itemsVon(ex).map((i) => i.marke)).toEqual(['B8', 'a', 'b']);
  });
});

describe('Anhang-Fortsetzung: Zeile NACH einem Item MIT Unterliste steht hinter dessen Unterliste (M2, P4)', () => {
  const ex = liste(
    '<dl><dt>a. </dt><dd>Eltern:<dl><dt>1. </dt><dd>eins;</dd><dt>2. </dt><dd>zwei.</dd></dl></dd>' +
      '<dt></dt><dd>Schlusssatz ohne eigene Unterliste.</dd></dl>',
  );
  it('das letzte Unter-Item trägt den Schlusssatz NICHT', () => {
    const it2 = itemsVon(ex).find((i) => i.marke === '2')!;
    expect(it2.text).toBe('zwei.');
    expect(itemsVon(ex).find((i) => i.marke === 'a')!.text).toBe('Eltern:');
  });
  it('der Schlusssatz steht genau einmal als eigene Notiz, NACH der Liste (vorher M2 alt: davor)', () => {
    expect(ex.bloecke.filter((b) => b.text === 'Schlusssatz ohne eigene Unterliste.')).toHaveLength(1);
    expect(JSON.stringify(ex.bloecke).match(/Schlusssatz ohne eigene Unterliste/g)).toHaveLength(1);
    const letzter = ex.bloecke[ex.bloecke.length - 1];
    expect(letzter.text).toBe('Schlusssatz ohne eigene Unterliste.');
    expect(letzter.items).toBeUndefined(); // reiner Text-Block, nicht Lead der Liste davor (alt: Lead mit allen Items)
    expect(itemsVon(ex).map((i) => i.marke)).toEqual(['a', '1', '2']);
  });
});

describe('Anhang-Fortsetzung: leeres Paar unterbricht die Kette nicht (VZV Anh. 4 Ziff. 5.4)', () => {
  it('Fortsetzung hinter <dt></dt><dd></dd> hängt weiter am Item', () => {
    const ex = liste(
      '<dl><dt>5.4 </dt><dd>Bemerkungen:</dd><dt></dt><dd></dd><dt></dt><dd>Falls «Ja», Bericht beilegen.</dd>' +
        '<dt>5.5 </dt><dd>Sehtest.</dd></dl>',
    );
    expect(itemsVon(ex).find((i) => i.marke === '5.4')!.text).toBe('Bemerkungen: Falls «Ja», Bericht beilegen.');
    expect(itemsVon(ex).find((i) => i.marke === '5.5')!.text).toBe('Sehtest.');
  });
});

describe('ohneFortsetzungen: Disjunktheit wird erzwungen (M4)', () => {
  it('zieht je absorbiertem Text genau EINE Notiz ab (Multimenge, Reihenfolge der Rest-Notizen bleibt)', () => {
    expect(ohneFortsetzungen(['x', 'y', 'x', 'z'], ['x'])).toEqual(['y', 'x', 'z']);
    expect(ohneFortsetzungen(['x', 'x'], ['x', 'x'])).toEqual([]);
    expect(ohneFortsetzungen(['a'], [])).toEqual(['a']);
  });
  it('bricht LAUT ab, wenn ein absorbierter Text nicht unter den Notizen ist', () => {
    expect(() => ohneFortsetzungen(['a'], ['b'])).toThrow(/nicht unter den Notizen/);
    expect(() => ohneFortsetzungen(['x'], ['x', 'x'])).toThrow(/nicht unter den Notizen/);
  });
});
