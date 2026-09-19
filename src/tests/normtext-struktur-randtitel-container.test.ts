import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { extrahiereStruktur } from '../../scripts/normtext/struktur-extrahiere.ts';

// W2·5m-LESER-V3 (Befund 19.9.2026): Fedlex verpackt im SVG (SR 741.01) den ganzen
// III. Titel in den Container `tit_3/lvl_u1`, dessen Überschrift «Grundregel» der
// Randtitel von Art. 26 ist; die Abschnitte `chap_1`…`chap_6` liegen INNERHALB
// dieses Randtitel-Containers (Filestore-Konsolidierung 20260701). Der Extraktor
// vererbte «Grundregel» deshalb als Marginalien-Vorfahre an Art. 27–57.
// Regel: Ein Randtitel gilt nur bis zur ersten amtlichen Gliederungsebene, die er
// umschliesst — die Artikel darunter erben ihn nicht.

// Verkürzte Nachbildung des amtlichen Markups (Struktur 1:1, Texte gekürzt).
function art(n: string): string {
  return `<article id="art_${n}"><h6 class="heading"><a href="#art_${n}"><b>Art. ${n}</b></a></h6>`
    + `<div class="collapseable"><p class="absatz ">Text.</p></div></article>`;
}
function rand(id: string, titel: string, inhalt: string): string {
  return `<section id="${id}"><div class="heading" role="heading" aria-level="4"><a href="#${id}">${titel}</a></div>`
    + `<div class="collapseable">${inhalt}</div></section>`;
}
function glied(id: string, h: number, titel: string, inhalt: string): string {
  return `<section id="${id}"><h${h} class="heading"><a href="#${id}">${titel}</a></h${h}>`
    + `<div class="collapseable">${inhalt}</div></section>`;
}
const SVG_TIT3 = glied('tit_3', 1, 'III. Titel: Verkehrsregeln',
  rand('tit_3/lvl_u1', 'Grundregel',
    art('26')
    + glied('tit_3/lvl_u1/chap_1', 3, '1. Abschnitt: Regeln für alle Strassenbenützer',
      rand('tit_3/lvl_u1/chap_1/lvl_u1', 'Beachten der Signale', art('27')))
    + glied('tit_3/lvl_u1/chap_2', 3, '2. Abschnitt: Regeln für den Fahrverkehr',
      glied('tit_3/lvl_u1/chap_2/lvl_I', 4, 'I. Allgemeine Fahrregeln',
        rand('tit_3/lvl_u1/chap_2/lvl_I/lvl_u1', 'Beherrschen des Fahrzeuges', art('31'))))))
  + glied('tit_4', 1, 'IV. Titel: Haftpflicht', rand('tit_4/lvl_u1', 'Haftpflicht des Halters', art('58')));

describe('extrahiereStruktur — Randtitel-Container um Gliederungsebenen (SVG tit_3)', () => {
  const s = extrahiereStruktur(SVG_TIT3);

  it('Art. 26 (eigener Artikel des Containers) behält «Grundregel»', () => {
    expect(s['26'].marginalie).toEqual(['Grundregel']);
  });

  it('Art. 27 und 31 (in umschlossenen Abschnitten) erben «Grundregel» nicht', () => {
    expect(s['27'].marginalie).toEqual(['Beachten der Signale']);
    expect(s['31'].marginalie).toEqual(['Beherrschen des Fahrzeuges']);
  });

  it('Gliederung bleibt amtlich, ohne «Grundregel»-Knoten', () => {
    expect(s['31'].gliederung.map((g) => g.label)).toEqual([
      'III. Titel: Verkehrsregeln', '2. Abschnitt: Regeln für den Fahrverkehr', 'I. Allgemeine Fahrregeln',
    ]);
  });

  it('der Nachbar-Titel bleibt unberührt', () => {
    expect(s['58'].marginalie).toEqual(['Haftpflicht des Halters']);
  });
});

describe('Sidecar SVG (public/normtext/struktur/bund/SVG.json) — «Grundregel» nur an Art. 26', () => {
  const sc = JSON.parse(readFileSync('public/normtext/struktur/bund/SVG.json', 'utf8')) as {
    artikel: Record<string, { gliederung: Array<{ label: string }>; marginalie: string[] }>;
  };
  const eintraege = Object.entries(sc.artikel);

  it('Art. 26 trägt die Marginalie «Grundregel»', () => {
    expect(sc.artikel['26'].marginalie).toEqual(['Grundregel']);
  });

  it('kein anderer Artikel trägt «Grundregel» in der Marginalienkette', () => {
    const traeger = eintraege.filter(([, a]) => a.marginalie.includes('Grundregel')).map(([k]) => k);
    expect(traeger).toEqual(['26']);
  });

  it('kein Gliederungsknoten ist mit «Grundregel» beschriftet', () => {
    const treffer = eintraege.filter(([, a]) => a.gliederung.some((g) => /\bGrundregel\b/.test(g.label)));
    expect(treffer.map(([k]) => k)).toEqual([]);
  });
});
