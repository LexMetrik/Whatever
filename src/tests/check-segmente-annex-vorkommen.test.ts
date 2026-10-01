// W2·27-BUND-FERTIG (1.10.2026): Tor `check:segmente` und doppelte Anhang-id (VZV).
//
// Anlass: Fedlex-Frische-Lauf 36828566407 (1.10.2026) scheiterte in
// `check-segmente.ts --schreiben` mit «2 unerwartete Ausklammerung(en): VZV
// annex_u1__2 · VZV annex_u1__3». Wurzel: VZV (SR 741.51) trägt DREI
// <section id="annex_u1"> (Beilage; Anhänge 5 und 6; Anhang 8 und 9); der
// Extraktor vergibt den Folge-Vorkommen den Synthese-Suffix «__2»/«__3», das Tor
// lokalisierte Anker aber nur per getElementById(<id>) — «annex_u1__2» existiert
// als Attribut-Wert nie ⇒ «Anker nicht lokalisierbar». Zweite Lücke: Modus B
// (der CI-Lauf, ohne HTML-Cache) las nur die Soll-Dateien; ein Projektions-
// Eintrag OHNE Soll-Eintrag (#1204: Soll nicht nachgezogen) blieb unsichtbar ⇒
// CI grün, obwohl das Tor den Eintrag nie geprüft hat (§6.7).
import { describe, it, expect } from 'vitest';
import {
  alleAnhangEids,
  lokalisiereAnker,
  parseErlassHtml,
  projektionOhneSoll,
  segmentiereArtikel,
} from '../../scripts/normtext/segmente-logik.ts';
import { zerlegeVorkommenSuffix } from '../../scripts/normtext/anhang-vorkommen.ts';

const sektion = (titel: string, text: string): string =>
  `<section id="annex_u1"><h1 class="heading"><a href="#annex_u1">${titel}</a></h1>` +
  `<div class="collapseable"><p class="absatz">${text}</p></div></section>`;

// Reihenfolge wie in der VZV: Beilage, «Anhänge 5 und 6», «Anhang 8 und 9».
const VZV =
  '<div id="annex">' +
  sektion('Beilage', 'Führerausweiskategorie A: Motorräder mit Leistungsbeschränkung.') +
  '<section id="annex_7"><h1 class="heading"><a href="#annex_7">Anhang 7</a></h1><div class="collapseable"><p class="absatz">Sieben.</p></div></section>' +
  sektion('Anhänge 5 und 6', 'Aufgehoben durch Ziff. I der V vom 22. Dezember 1999.') +
  sektion('Anhang 8 und 9', 'Aufgehoben durch Ziff. II der V vom 15. Juni 2012.') +
  '</div>';

const texte = (html: string, anker: string): string[] | null =>
  segmentiereArtikel(html, anker)?.map((s) => s.text) ?? null;

describe('check:segmente — doppelte Anhang-id (VZV annex_u1)', () => {
  it('Folge-Vorkommen «annex_u1__2/__3» sind lokalisierbar (nicht mehr null) und tragen den Text IHRER Sektion', () => {
    const erstes = texte(VZV, 'annex_u1');
    const zweites = texte(VZV, 'annex_u1__2');
    const drittes = texte(VZV, 'annex_u1__3');
    expect(erstes?.join(' ')).toContain('Motorräder');
    expect(zweites?.join(' ')).toContain('22. Dezember 1999');
    expect(drittes?.join(' ')).toContain('15. Juni 2012');
    // N-tes Vorkommen, nie ein anderes: kein Übersprechen auf die Nachbarsektion.
    expect(zweites?.join(' ')).not.toContain('Motorräder');
    expect(drittes?.join(' ')).not.toContain('22. Dezember');
  });

  it('lokalisiereAnker: __N ist das N-te <section> derselben id in Dokumentreihenfolge', () => {
    const dok = parseErlassHtml(VZV);
    expect(lokalisiereAnker(dok, 'annex_u1')?.textContent).toContain('Beilage');
    expect(lokalisiereAnker(dok, 'annex_u1__2')?.textContent).toContain('Anhänge 5 und 6');
    expect(lokalisiereAnker(dok, 'annex_u1__3')?.textContent).toContain('Anhang 8 und 9');
  });

  it('ein viertes Vorkommen, das es nicht gibt, bleibt null (kein stilles Raten, §7)', () => {
    expect(texte(VZV, 'annex_u1__4')).toBeNull();
    expect(texte(VZV, 'annex_zz__2')).toBeNull();
  });

  it('KKV-Ausnahme bleibt wie dokumentiert: doppeltes <article id="art_126_z"> ist NICHT per «__2» lokalisierbar', () => {
    const kkv =
      '<article id="art_126_z"><h6>Art. 126z</h6><p class="absatz">Erstes.</p></article>' +
      '<article id="art_126_z"><h6>Art. 126z</h6><p class="absatz">Zweites.</p></article>';
    expect(texte(kkv, 'art_126_z')?.join(' ')).toContain('Erstes');
    expect(texte(kkv, 'art_126_z__2')).toBeNull();
  });

  it('eine echte id gewinnt vor der Suffix-Deutung', () => {
    const html = '<section id="annex_u1__2"><h1>X</h1><div><p class="absatz">Echte id mit Doppel-Unterstrich.</p></div></section>';
    expect(texte(html, 'annex_u1__2')?.join(' ')).toContain('Echte id');
  });

  it('alleAnhangEids (HTML-Seite der Vollständigkeit): Folge-Vorkommen stehen mit Suffix in der Menge', () => {
    expect(alleAnhangEids(parseErlassHtml(VZV)).sort()).toEqual(
      ['annex_7', 'annex_u1', 'annex_u1__2', 'annex_u1__3'].sort(),
    );
  });

  it('Namenskonvention: EINE Zerlegung für Anker-Auflösung und Tor', () => {
    expect(zerlegeVorkommenSuffix('annex_u1__3')).toEqual({ basis: 'annex_u1', nth: 3 });
    expect(zerlegeVorkommenSuffix('annex_u1')).toBeNull();
    expect(zerlegeVorkommenSuffix('annex_2_16')).toBeNull();
  });
});

describe('check:segmente Modus B — Projektions-Eintrag ohne Soll-Eintrag (§6.7)', () => {
  const praefix = 'bund/VZV/';
  const projektion = ['bund/VZV/art_1', 'bund/VZV/annex_u1', 'bund/VZV/annex_u1__2', 'bund/VZV/annex_u1__3'];

  it('meldet jeden Projektions-Eintrag, den das Soll nicht führt (#1204: Soll nicht nachgezogen)', () => {
    expect(projektionOhneSoll(praefix, projektion, ['art_1', 'annex_u1'])).toEqual(['annex_u1__2', 'annex_u1__3']);
  });

  it('vollständiges Soll ⇒ nichts zu melden', () => {
    expect(projektionOhneSoll(praefix, projektion, ['art_1', 'annex_u1', 'annex_u1__2', 'annex_u1__3'])).toEqual([]);
  });

  it('Einträge fremder Präfixe zählen nicht mit', () => {
    expect(projektionOhneSoll(praefix, ['bund/ZGB/art_1'], [])).toEqual([]);
  });
});
