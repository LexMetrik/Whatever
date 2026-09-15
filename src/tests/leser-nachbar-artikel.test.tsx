/**
 * W2·5m · NACHBAR-ARTIKEL-PFEILE — Reihenfolge und Darstellung
 *
 * Zwei getrennte Fragen, darum zwei `describe`:
 *  (a) WELCHE Artikel sind die Nachbarn? — rein, ohne DOM
 *      (`v3/nachbarArtikel.ts`). Die Fälle, an denen eine selbstgebaute
 *      Sortierung scheitern würde: «a»-Artikel (90a zwischen 90 und 91),
 *      aufgehobene Artikel mitten in der Kette, Anfang und Ende des Erlasses.
 *  (b) WIE stehen sie im Artikelkopf? — `renderToString`, echte `<a href>`,
 *      zugänglicher Name, `data-such-meta`, und am Rand des Erlasses KEIN
 *      zweiter, leerer Pfeil.
 *
 * ROT GEFAHREN (§6.7), alle Sonden, 14.9.2026:
 *  · (a) `baueNachbarn` mit `i > 0 ? liste[i - 1]` → `liste[i + 1]` vertauscht:
 *        «90a hat 90 davor und 91 danach» wird rot
 *        (`expected 'Art. 91' to be 'Art. 90'`).
 *  · (a) aufgehobene Artikel übersprungen (`.filter(e => !e.aufgehoben)` vor
 *        dem Bau): «der aufgehobene Artikel bleibt in der Kette» wird rot.
 *  · (b) `data-such-meta` aus `parts/ArtikelNachbarn.tsx` entfernt: die
 *        SUCH_META-Sonde wird rot.
 *  · (b) `if (!nachbarn.vor && !nachbarn.nach) return null` durch
 *        `<span aria-disabled>‹</span>` ersetzt: «kein leerer Pfeil am ersten
 *        Artikel» wird rot (2 statt 1 Treffer).
 */
import { describe, it, expect } from 'vitest';
import { renderToString } from 'react-dom/server';
import { baueNachbarn } from '../pages/gesetz-leser/v3/nachbarArtikel';
import { ArtikelLeser } from '../pages/gesetz-leser/parts';
import type { NormSnapshot } from '../lib/normtext/typen';
import type { BrowseErlass } from '../lib/normtext/browse-typen';

const erlass: BrowseErlass = {
  key: 'OR', ebene: 'bund', kanton: null, kuerzel: 'OR', titel: 'Obligationenrecht', sr: '220',
  rechtsgebiet: 'privat', sprache: 'de', rang: 0, status: 'snapshot',
  datei: 'bund/OR.json', artikelAnzahl: 5, stand: '2026-01-01',
  quelleUrl: 'https://www.fedlex.admin.ch/eli/cc/27/317_321_377/de', fassungsToken: '20260101',
  pdfPfad: null,
};

/** Ein Eintrag in Snapshot-Form.
 *  `tot` = AMTLICH aufgehobener Artikel: Platzhalter-Body «…» UND das Feld
 *  `aufgehoben` (W2·27, 15.9.2026 — RE-BLESS deklariert). Bis dahin trug die
 *  Vorrichtung nur den Body; seit der §8-Trennung ist das der Fall
 *  «leer-ungeklaert», nicht «aufgehoben». Der Fall OHNE Feld hat jetzt einen
 *  eigenen Abschnitt (unten) — er ist der Kern der Auflage. */
const eintrag = (artikel: string, tot = false): NormSnapshot => ({
  id: `bund/OR/art_${artikel}`, ebene: 'bund', quelle: 'OR', erlass: 'OR',
  artikel, artikelLabel: `Art. ${artikel}`,
  bloecke: tot ? [{ absatz: null, text: '…' }] : [{ absatz: '1', text: `Wortlaut von Art. ${artikel}.` }],
  ...(tot ? { aufgehoben: true as const } : {}),
  stand: '2026-01-01', quelleUrl: 'https://x', abgerufen: '2026-09-14',
  fassungsToken: '20260101', sha: artikel,
});

// Die amtliche Reihung, wie der Snapshot sie liefert: 90a steht ZWISCHEN 90 und
// 91, und der aufgehobene Art. 91 bleibt Teil der Kette.
const KETTE = ['89', '90', '90a', '91', '92'];
const eintraege = KETTE.map((a) => eintrag(a, a === '91'));

describe('W2·5m (a) · welche Artikel sind die Nachbarn (rein, `v3/nachbarArtikel`)', () => {
  const map = baueNachbarn(eintraege);
  const labels = (tok: string) => ({
    vor: map.get(tok)?.vor?.label ?? null,
    nach: map.get(tok)?.nach?.label ?? null,
  });

  it('«a»-Artikel: 90a hat 90 davor und 91 danach — die Reihung kommt aus den Daten', () => {
    // Eine nummern-vergleichende Sortierung stellte 90a hinter 91 oder gar
    // hinter 9; genau darum sortiert `baueNachbarn` NICHT, sondern liest.
    expect(labels('90a')).toEqual({ vor: 'Art. 90', nach: 'Art. 91' });
    expect(labels('90')).toEqual({ vor: 'Art. 89', nach: 'Art. 90a' });
  });

  it('der aufgehobene Artikel bleibt in der Kette (§8 — nicht überspringen)', () => {
    // Art. 91 ist ganz aufgehoben. Er ist trotzdem der Nachfolger von 90a und
    // der Vorgänger von 92 — wer von 90a weiterblättert, soll SEHEN, dass dort
    // eine aufgehobene Bestimmung steht, statt still darüber zu springen.
    expect(labels('92').vor).toBe('Art. 91');
    // RE-BLESS W2·27: aus `aufgehoben: true/false` wurde die dreiwertige
    // Belegstufe — der amtlich markierte Art. 91 ist 'aufgehoben', Art. 90 lebt.
    expect(map.get('90a')?.nach?.zustand).toBe('aufgehoben');
    expect(map.get('90a')?.vor?.zustand).toBe('lebt');
  });

  it('Anfang und Ende des Erlasses: die fehlende Seite ist `null`, kein toter Verweis', () => {
    expect(labels('89')).toEqual({ vor: null, nach: 'Art. 90' });
    expect(labels('92')).toEqual({ vor: 'Art. 91', nach: null });
  });

  it('Erlass mit genau EINEM Eintrag: beide Seiten leer', () => {
    const einer = baueNachbarn([eintrag('1')]);
    expect(einer.get('1')).toEqual({ vor: null, nach: null });
  });

  it('leere/fehlende Liste ergibt eine leere Karte statt eines Absturzes', () => {
    expect(baueNachbarn(null).size).toBe(0);
    expect(baueNachbarn([]).size).toBe(0);
  });

  it('die Werte sind referenz-stabil je Token (Bedingung der `memo`-Schranke, §15)', () => {
    // Zweimal dasselbe Token abfragen muss DASSELBE Objekt liefern — sonst
    // rendert `parts/ArtikelLeser` bei jedem Scroll-Spy-Takt alle Artikel neu.
    expect(map.get('90')).toBe(map.get('90'));
  });

  it('das Label kommt aus dem Eintrag, nicht aus dem Token (Bereichs-Label)', () => {
    // «disp_u1_art_31_32» lässt sich nicht aus dem Token raten; der Eintrag
    // trägt sein Label selbst (§5, `labelMitBereich`).
    const mitBereich = baueNachbarn([
      eintrag('30'),
      { ...eintrag('31'), artikel: 'disp_u1_art_31_32', artikelLabel: 'Art. 31–32' },
    ]);
    expect(mitBereich.get('30')?.nach?.label).toBe('Art. 31–32');
    expect(mitBereich.get('30')?.nach?.token).toBe('disp_u1_art_31_32');
  });
});

describe('W2·5m (b) · wie die Pfeile im Artikelkopf stehen', () => {
  const map = baueNachbarn(eintraege);
  const rendere = (tok: string) => renderToString(
    <ArtikelLeser e={eintraege[KETTE.indexOf(tok)]} erlass={erlass}
      basisPfad="/gesetze/bund/OR" nachbarn={map.get(tok)} />,
  );

  it('beide Nachbarn sind echte `<a href="#art-…">` — Tastatur, neuer Reiter, Kopieren', () => {
    const out = rendere('90a');
    expect(out).toContain('href="#art-90"');
    expect(out).toContain('href="#art-91"');
    // Und die Beschriftung nennt den Artikel, nicht nur ein Zeichen.
    expect(out).toContain('Art. 90');
    expect(out).toContain('Art. 91');
  });

  it('zugänglicher Name nennt Richtung UND Ziel (WCAG 4.1.2)', () => {
    const out = rendere('90a');
    expect(out).toContain('aria-label="Voriger Artikel: Art. 90"');
    // Der aufgehobene Nachfolger sagt das im Namen, bevor man springt (§8).
    expect(out).toContain('aria-label="Nächster Artikel: Art. 91 (aufgehoben)"');
  });

  it('der aufgehobene Nachbar wird NICHT auf ink-400 gedämpft (WCAG 1.4.3)', () => {
    // GEFANGEN VON `e2e/a11y.e2e.ts` am 14.9.2026 (Reader BS-640.100, hell und
    // dunkel): der erste Wurf setzte `text-ink-400` und riss mit 3.29 die
    // 4.5:1. Dieselbe Lehre steht wörtlich an der Zeile «· aufgehoben» in
    // `parts/ArtikelLeser.tsx` — ink-400 ist für essentiellen Link-Text zu
    // schwach. Diese Sonde bindet sie eine Ebene tiefer und billiger als axe:
    // sie braucht keinen Browser und läuft in jedem `npm test`.
    // ROT: in `parts/ArtikelNachbarn.tsx` `text-ink-500` → `text-ink-400`.
    const out = rendere('90a');
    const zeile = out.slice(out.indexOf('data-artikel-nachbarn'));
    const bis = zeile.slice(0, zeile.indexOf('</span></div>'));
    expect(bis).not.toContain('text-ink-400');
    expect(bis.match(/text-ink-500/g) ?? [], 'beide Pfeile tragen dieselbe Tinte').toHaveLength(2);
  });

  it('die Zeile trägt `data-such-meta` — sonst malt die Suche Treffer auf Bedienung (B1)', () => {
    const out = rendere('90a');
    // Der Such-Walker verwirft den ganzen Teilbaum unter diesem Attribut
    // (`suchHighlight.ts`). Ohne es zählte eine Suche nach «90» an JEDEM
    // Nachbarn eine Fundstelle mehr, als der Zähler nennt.
    expect(out).toMatch(/data-such-meta[^>]*data-artikel-nachbarn|data-artikel-nachbarn[^>]*data-such-meta/);
  });

  it('erster Artikel: NUR der Nachfolger steht da, kein leerer/toter Vorgänger-Pfeil', () => {
    const out = rendere('89');
    expect(out.match(/data-nachbar="/g) ?? []).toHaveLength(1);
    expect(out).toContain('data-nachbar="nach"');
    expect(out).not.toContain('data-nachbar="vor"');
  });

  it('letzter Artikel: NUR der Vorgänger steht da', () => {
    const out = rendere('92');
    expect(out.match(/data-nachbar="/g) ?? []).toHaveLength(1);
    expect(out).toContain('data-nachbar="vor"');
  });

  it('ohne die Prop bleibt der Artikelkopf, was er war (Ist-Hülle, Test-Render, Druck)', () => {
    const out = renderToString(
      <ArtikelLeser e={eintraege[0]} erlass={erlass} basisPfad="/gesetze/bund/OR" />,
    );
    expect(out).not.toContain('data-artikel-nachbarn');
  });

  it('Suchsicht (`imTreffer`): keine Pfeile — dort zeigt `#art-…` ins Leere', () => {
    const out = renderToString(
      <ArtikelLeser e={eintraege[1]} erlass={erlass} basisPfad="/gesetze/bund/OR"
        nachbarn={map.get('90')} imTreffer onSpringe={() => {}} />,
    );
    expect(out).not.toContain('data-artikel-nachbarn');
  });
});
