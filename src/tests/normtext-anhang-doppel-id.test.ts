// W2·27-BUND-FERTIG (30.9.2026, Gegenprüfung #1183): doppelte «annex_u1»-id in der VZV.
//
// Fedlex trägt in der VZV (SR 741.51, ELI cc/1976/2423_2423_2423, Konsolidierung
// 20260101, abgerufen 30.9.2026) DREI <section id="annex_u1"> im Anhang-Container:
// «Beilage» (lebender Inhalt: Führerausweiskategorien), «Anhänge 5 und 6» und
// «Anhang 8 und 9» (beide amtlich aufgehoben). Der Deckblatt-Ausschluss von
// alleAnhangAnker (unnummerierte Sektion neben nummerierten = Inhaltsübersicht,
// ChemRRV) verwarf ALLE drei; der Snapshot trug keine von ihnen.
//
// Fixtures: die beiden aufgehobenen Sektionen WÖRTLICH aus /tmp/vzv.html; die
// «Beilage» ist im Rumpf gekürzt (Kopf, erste zwei Kategorien verbatim).
import { describe, it, expect } from 'vitest';
import { alleAnhangAnker, extrahiereAnhang } from '../../scripts/normtext/extrahiere-fedlex.ts';
import { amtlicherAnhangAnker } from '../../scripts/normtext/anhang-vorkommen.ts';
import { pruefeLabelUrl } from '../../scripts/normtext/drift-logik.ts';
import type { NormSnapshot } from '../../scripts/normtext/drift-logik.ts';

const BEILAGE =
  '<section id="annex_u1"><h1 class="heading" role="heading" aria-level="1"><span class="display-icon"></span><span class="external-link-icon"></span><a href="#annex_u1">Beilage</a></h1><div class="collapseable"><section id="annex_u1/lvl_u1"><h2 class="heading" role="heading" aria-level="2"><span class="display-icon"></span><span class="external-link-icon"></span><a href="#annex_u1/lvl_u1">Beschreibung der Führerausweiskategorien, -unterkategorien und -spezialkategorien</a></h2><div class="collapseable"><dl class="man-space-after-0"><dt class="man-space-before-4"><span data-message="E40S10-TAB">[tab]</span></dt><dd class="man-space-before-4"><b>Kategorien:</b></dd><dt class="man-space-before-4">A: </dt><dd class="man-space-before-4">Motorräder</dd></dl></div></section></div></section>';

const ANH_5_6 =
  '<section id="annex_u1"><h1 class="heading" role="heading" aria-level="1"><span class="display-icon"></span><span class="external-link-icon"></span><a href="#annex_u1">Anhänge 5 und 6</a><span class="man-font-style-normal"><sup><a href="#fn-d367071e19095" id="fnbck-d367071e19095">490</a></sup></span></h1><div class="footnotes section-heading-footnote"><p id="fn-d367071e19095"><sup><a href="#fnbck-d367071e19095">490</a></sup><sup></sup><sup> </sup>Aufgehoben durch Ziff. II Abs. 1 der V vom 28. Sept. 2007, mit Wirkung seit 1. Jan. 2008  (<a href="https://fedlex.data.admin.ch/eli/oc/2007/703" target="_blank">AS <b>2007 </b>5013</a>).</p></div><div class="collapseable"></div></section>';

const ANH_8_9 =
  '<section id="annex_u1"><h1 class="heading" role="heading" aria-level="1"><span class="display-icon"></span><span class="external-link-icon"></span><a href="#annex_u1">Anhang 8 und 9</a><span class="man-font-style-normal"><sup><a href="#fn-d367071e19320" id="fnbck-d367071e19320">492</a></sup></span></h1><div class="footnotes section-heading-footnote"><p id="fn-d367071e19320"><sup><a href="#fnbck-d367071e19320">492</a></sup><sup></sup> Aufgehoben durch Ziff. II Abs. 1 der V vom 28. März 2007, mit Wirkung seit 1. Jan. 2008 (<a href="https://fedlex.data.admin.ch/eli/oc/2007/303" target="_blank">AS <b>2007 </b>2183</a>).</p></div><div class="collapseable"></div></section>';

const ANH_N = (n: string) =>
  `<section id="annex_${n}"><h1 class="heading" role="heading" aria-level="1"><a href="#annex_${n}">Anhang ${n}</a></h1><div class="collapseable"><p class="titelanhtext">(Art. 1)</p></div></section>`;

/** Reihenfolge wie in der VZV: …4a, Beilage, 5/6, 7, 8/9, 10. */
const VZV = `<div id="annex">${ANH_N('1')}${ANH_N('4')}${BEILAGE}${ANH_5_6}${ANH_N('7')}${ANH_8_9}${ANH_N('10')}</div>`;

describe('doppelte annex_u1-id (VZV) — keine Sektion geht verloren', () => {
  it('alleAnhangAnker: alle drei Vorkommen, Folge-Vorkommen mit Synthese-Suffix __N', () => {
    expect(alleAnhangAnker(VZV)).toEqual([
      'annex_1', 'annex_4', 'annex_u1', 'annex_u1__2', 'annex_7', 'annex_u1__3', 'annex_10',
    ]);
  });

  it('bestehende Anker bleiben unverändert (kein Deep-Link-Bruch): nummerierte Anhänge unberührt', () => {
    const ohneDoppel = `<div id="annex">${ANH_N('1')}${ANH_N('4')}${ANH_N('7')}${ANH_N('10')}</div>`;
    expect(alleAnhangAnker(ohneDoppel)).toEqual(['annex_1', 'annex_4', 'annex_7', 'annex_10']);
  });

  it('extrahiereAnhang: Beilage lebend; «Anhänge 5 und 6» / «Anhang 8 und 9» amtlich aufgehoben, nie lebend (§8)', () => {
    const b = extrahiereAnhang(VZV, 'annex_u1');
    expect(b?.titel).toBe('Beilage');
    expect(b?.aufgehoben).toBeUndefined();
    expect(b?.bloecke.length).toBeGreaterThan(1);
    const a56 = extrahiereAnhang(VZV, 'annex_u1__2');
    expect(a56?.titel).toMatch(/^Anhänge 5 und 6/);
    expect(a56?.aufgehoben).toBe(true);
    const a89 = extrahiereAnhang(VZV, 'annex_u1__3');
    expect(a89?.titel).toMatch(/^Anhang 8 und 9/);
    expect(a89?.aufgehoben).toBe(true);
  });

  it('Deckblatt-Ausschluss bleibt für die EINZELNE unnummerierte Sektion (ChemRRV-Muster)', () => {
    const html =
      '<div id="annex"><section id="annex_u1"><h1 class="heading"><a href="#annex_u1">Anhänge</a></h1></section>' +
      `${ANH_N('1')}${ANH_N('2')}</div>`;
    expect(alleAnhangAnker(html)).toEqual(['annex_1', 'annex_2']);
  });
});

describe('amtlicherAnhangAnker — eindeutiges Sprungziel je Vorkommen (§5-Gleichstand mit amtlicherAnker)', () => {
  it('1. Vorkommen / ohne Suffix: Basis-Anker unverändert', () => {
    expect(amtlicherAnhangAnker(VZV, 'annex_u1')).toBe('annex_u1');
    expect(amtlicherAnhangAnker(VZV, 'annex_7')).toBe('annex_7');
  });

  it('Folge-Vorkommen: eindeutige id im Kopf der N-ten Sektion (live belegt 30.9.2026)', () => {
    expect(amtlicherAnhangAnker(VZV, 'annex_u1__2')).toBe('fnbck-d367071e19095');
    expect(amtlicherAnhangAnker(VZV, 'annex_u1__3')).toBe('fnbck-d367071e19320');
  });

  it('kein eindeutiges Fragment im Kopf → Basis-Anker (Verhalten davor, §8-Unschärfe)', () => {
    const ohneMarker = `<div id="annex">${ANH_N('1')}${BEILAGE}${BEILAGE.replace('Beilage', 'Zweite')}</div>`;
    expect(amtlicherAnhangAnker(ohneMarker, 'annex_u1__2')).toBe('annex_u1');
  });

  it('Fragment, das im Dokument doppelt vorkommt → Basis-Anker (Browser löste aufs erste auf)', () => {
    const doppelt = ANH_5_6 + ANH_5_6;
    expect(amtlicherAnhangAnker(`<div id="annex">${ANH_N('1')}${doppelt}</div>`, 'annex_u1__2')).toBe('annex_u1');
  });
});

describe('Drift-Riegel: Anhang-Folge-Vorkommen', () => {
  const B = 'https://www.fedlex.admin.ch/eli/cc/1976/2423_2423_2423/de';
  const snap = (id: string, artikelLabel: string, quelleUrl: string): NormSnapshot => ({
    id, quelle: 'VZV', fassungsToken: '20260101', artikelLabel, quelleUrl,
  });
  const regeln = (s: NormSnapshot[]) => pruefeLabelUrl(s).map((b) => `${b.regel}${b.klasse ? `:${b.klasse}` : ''}`);

  it('grün: eindeutige amtliche Anker je Vorkommen', () => {
    expect(regeln([
      snap('bund/VZV/annex_u1', 'Beilage', `${B}#annex_u1`),
      snap('bund/VZV/annex_u1__2', 'Anhänge 5 und 6', `${B}#fnbck-d367071e19095`),
      snap('bund/VZV/annex_u1__3', 'Anhang 8 und 9', `${B}#fnbck-d367071e19320`),
    ])).toEqual([]);
  });

  it('rot: Synthese-Suffix im Anker, leeres Label, Basis-Anker doppelt (Fehlsprung aufs 1. Vorkommen)', () => {
    expect(regeln([snap('bund/VZV/annex_u1__2', 'X', `${B}#annex_u1__2`)])).toContain('B2-anker-synthese');
    expect(regeln([snap('bund/VZV/annex_u1__2', '', `${B}#fnbck-d367071e19095`)])).toEqual(['B1-label:annex-doppelt']);
    const beide = regeln([
      snap('bund/VZV/annex_u1', 'Beilage', `${B}#annex_u1`),
      snap('bund/VZV/annex_u1__2', 'Anhänge 5 und 6', `${B}#annex_u1`),
    ]);
    expect(beide).toContain('B3-url-doppelt');
  });
});
