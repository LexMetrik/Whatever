// W2·27-BUND-FERTIG P4, Nachzug zur Gegenprüfung (3.10.2026), Befund 1: Die Teilung der Item-Liste an einer
// marke-losen Anhang-Zeile (`einzug`) darf den Zitierknopf nicht um den übergeordneten Punkt kürzen
// («Anhang 4 lit. a FAV» statt «Anhang 4 Ziff. 3.1 lit. a FAV» ist ein FALSCHES Zitat, §1).
// Beleg am gebauten Korpus (public/normtext/bund, 9 Erlasse) und am echten Renderer (renderToString).
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { renderToString } from 'react-dom/server';
import { ArtikelBody } from '../components/normtext/ArtikelBody';
import { anhangVorKette, einzugStil, itemZitatSegmente, stufenFuer } from '../components/normtext/ArtikelBody.helfer';
import type { NormSnapshot } from '../lib/normtext/typen';

type Eintrag = { id: string; artikel: string; artikelLabel: string; bloecke: NormSnapshot['bloecke'] };
const laden = (k: string): Eintrag[] =>
  JSON.parse(readFileSync(`public/normtext/bund/${k}.json`, 'utf8')).eintraege as Eintrag[];
const eintrag = (k: string, id: string): Eintrag => laden(k).find((e) => e.id === id)!;

const rendern = (e: Eintrag, kuerzel: string) =>
  renderToString(
    <ArtikelBody bloecke={e.bloecke} artikel={e.artikel} passus={{ absatz: null }}
      zitierKontext={{ artikelLabel: e.artikelLabel, kuerzel }} />,
  );
// Alle Zitate einer Marke im gerenderten Artikel (aria-label der Zitiermarke), HTML-Entitäten aufgelöst.
const zitate = (html: string): string[] =>
  [...html.matchAll(/aria-label="([^"]+) — kopieren"/g)].map((m) => m[1].replace(/&#x27;|&#39;/g, "'").replace(/&amp;/g, '&'));

describe('Zitierknopf trägt den Eltern-Punkt über die Blockgrenze (Befund 1)', () => {
  it('FAV Anh. 4: «Ziff. 3.1 lit. a» und «Ziff. 3.2 lit. a» (vorher «lit. a»)', () => {
    const z = zitate(rendern(eintrag('FAV', 'bund/FAV/annex_4'), 'FAV'));
    expect(z).toContain('Anhang 4 Ziff. 3.1 lit. a FAV');
    expect(z).toContain('Anhang 4 Ziff. 3.2 lit. g FAV');
    expect(z).not.toContain('Anhang 4 lit. a FAV');
    expect(z.filter((x) => /^Anhang 4 lit\. /.test(x))).toEqual([]);
  });
  it('FIDLEV Anh. 1: «Ziff. 2.6.3 lit. a» (Einzelmodus-Fall, vorher «lit. a»)', () => {
    const z = zitate(rendern(eintrag('FIDLEV', 'bund/FIDLEV/annex_1'), 'FIDLEV'));
    expect(z).toContain('Anhang 1 Ziff. 2.6.3 lit. a FIDLEV');
  });
  it('VTS Anh. 7: «Ziff. 232 Klasse 1» trägt die Ziffer (vorher «Klasse 1» allein)', () => {
    const z = zitate(rendern(eintrag('VTS', 'bund/VTS/annex_7'), 'VTS'));
    expect(z.some((x) => /^Anhang 7 Ziff\. 232 Klasse 1 VTS$/.test(x))).toBe(true);
  });
  it('FZA Anh. II: «lit. b lit. aa» unter der Antrags-Zeile hängt am Punkt b)', () => {
    const z = zitate(rendern(eintrag('FZA', 'bund/FZA/annex_II'), 'FZA'));
    expect(z.some((x) => /lit\. b lit\. aa FZA$/.test(x))).toBe(true);
  });
});

describe('Korpus-Invariante: die Kette über die Blockgrenze = die Kette der ungeteilten Liste', () => {
  // Referenz = die Liste vor der Teilung: alle Items der zusammenhängenden Listen-Blöcke bis zum Punkt
  // (so stand sie bis P4 in EINEM Block). Die 9 Erlasse, deren Anhänge die Teilung betrifft.
  const ERLASSE = ['AVO', 'FAV', 'FIDLEV', 'FZA', 'HZUE', 'KKV_FINMA', 'VTS', 'VVV', 'VZV'] as const;
  const listenBlock = (b: NormSnapshot['bloecke'][number]) =>
    b.titel === undefined && b.absatz == null && (b as { bild?: unknown }).bild == null
    && (b as { bildKacheln?: unknown[] }).bildKacheln == null && b.mehrspaltig == null && !(b.tabelle?.length);
  it('für jeden Punkt der betroffenen Blöcke gleiche Segmente wie auf der ungeteilten Liste', () => {
    let geprueft = 0, tief = 0;
    const abweichend: string[] = [];
    for (const k of ERLASSE) {
      for (const e of laden(k).filter((x) => /\/annex_/.test(x.id))) {
        e.bloecke.forEach((b, i) => {
          if (!b.items || b.items.length === 0) return;
          const betroffen = b.einzug != null || (i > 0 && e.bloecke[i - 1].einzug != null);
          if (!betroffen) return;
          let k0 = i;
          while (k0 > 0 && listenBlock(e.bloecke[k0 - 1]) && listenBlock(e.bloecke[k0])) k0--;
          const flach = e.bloecke.slice(k0, i).flatMap((x) => x.items ?? []);
          const stufen = stufenFuer(b.items);
          const vor = anhangVorKette(e.bloecke, i);
          b.items.forEach((it, j) => {
            if (/^[–—-]$/.test(it.marke.trim())) return; // Gedankenstrich: kein Zitierknopf
            const alle = [...flach, ...b.items!.slice(0, j + 1)];
            const soll = itemZitatSegmente(alle, stufenFuer(alle), alle.length - 1).join(' ');
            const ist = itemZitatSegmente(b.items!, stufen, j, vor).join(' ');
            geprueft++;
            if (stufen[j] > 0) tief++;
            if (ist !== soll) abweichend.push(`${e.id}#${i}.${j} «${it.marke}» ist «${ist}» soll «${soll}»`);
          });
        });
      }
    }
    expect(geprueft).toBeGreaterThan(300); // Sonde ist nicht leer (§6.7)
    expect(tief).toBeGreaterThan(100);
    expect(abweichend).toEqual([]);
  });
});

describe('anhangVorKette: nur Notiz-Blöcke und ihr Folgeblock, nie ein gewöhnlicher Absatz-Block', () => {
  const it0 = { marke: '3.1', text: 'Eltern' };
  const unter = [{ marke: 'a', text: 'x', tiefe: 1 }, { marke: 'b', text: 'y', tiefe: 1 }];
  it('Notiz-Block (einzug) mit Unterliste: Kette = Items davor bis zum Wurzel-Punkt', () => {
    const bl: NormSnapshot['bloecke'] = [
      { absatz: null, text: '', items: [{ marke: '3', text: 'x' }, it0] },
      { absatz: null, text: 'Der Antrag enthält:', items: unter, einzug: 0 },
    ];
    expect(anhangVorKette(bl, 1).map((x) => x.marke)).toEqual(['3', '3.1']);
    expect(itemZitatSegmente(bl[1].items!, stufenFuer(bl[1].items!), 0, anhangVorKette(bl, 1))).toEqual(['Ziff. 3.1', 'lit. a']);
  });
  it('Folgeblock hinter einer text-losen Notiz (Notiz ohne Unterliste dazwischen) trägt die Kette', () => {
    const bl: NormSnapshot['bloecke'] = [
      { absatz: null, text: '', items: [it0] },
      { absatz: null, text: 'Zeile', einzug: 0 },
      { absatz: null, text: '', items: unter },
    ];
    expect(anhangVorKette(bl, 2).map((x) => x.marke)).toEqual(['3.1']);
  });
  it('gewöhnlicher Absatz-Block mit eigener Unterliste (RBUE/ARGV1-Form, kein `einzug`): leer, block-lokal wie zuvor', () => {
    const bl: NormSnapshot['bloecke'] = [
      { absatz: null, text: '', items: [it0] },
      { absatz: null, text: '3) Die Frist beträgt fünf Jahre:', items: unter },
    ];
    expect(anhangVorKette(bl, 1)).toEqual([]);
  });
  it('Block an der Wurzel (Stufe 0) braucht keine Kette; Absatz-/Titel-Block bricht die Liste ab', () => {
    const w: NormSnapshot['bloecke'] = [
      { absatz: null, text: '', items: [it0] },
      { absatz: null, text: 'Zeile', items: [{ marke: '3.2', text: 'z' }], einzug: 0 },
    ];
    expect(anhangVorKette(w, 1)).toEqual([]);
    const t: NormSnapshot['bloecke'] = [
      { absatz: null, text: '', items: [it0] },
      { absatz: null, text: 'Titel', titel: 3 },
      { absatz: null, text: 'Zeile', items: unter, einzug: 0 },
    ];
    expect(anhangVorKette(t, 2)).toEqual([]);
  });
});

describe('Darstellung: marke-lose Zeile steht auf der Ebene ihres Eltern-Punkts (Befund 2)', () => {
  it('einzugStil: Textspalte der Items der Ebene (4.5 rem + Ebene · 1.6 rem); ohne einzug kein Eingriff', () => {
    expect(einzugStil({ einzug: 0 })).toEqual({ paddingLeft: '4.5rem' });
    expect(einzugStil({ einzug: 1 })).toEqual({ paddingLeft: '6.1rem' });
    expect(einzugStil({})).toBeUndefined();
  });
  it('Lesesicht setzt den Einzug am Zeilen-Absatz; Popover (ohne zitierKontext) bleibt unverändert', () => {
    const bl: NormSnapshot['bloecke'] = [
      { absatz: null, text: '', items: [{ marke: '8', text: 'Feuer' }] },
      { absatz: null, text: 'Sämtliche Sachschäden durch:', items: [{ marke: '–', text: 'Feuer', tiefe: 1 }], einzug: 0 },
    ];
    const lese = renderToString(<ArtikelBody bloecke={bl} artikel="annex_1" passus={{ absatz: null }} zitierKontext={{ artikelLabel: 'Anhang 1', kuerzel: 'AVO' }} />);
    expect(lese).toContain('style="padding-left:4.5rem"');
    const popover = renderToString(<ArtikelBody bloecke={bl} artikel="annex_1" passus={{ absatz: null }} />);
    expect(popover).not.toContain('padding-left');
  });
});
