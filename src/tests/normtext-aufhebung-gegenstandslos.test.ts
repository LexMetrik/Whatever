/**
 * W2·27-BUND-FERTIG — Aufhebungs-Signal: «Gegenstandslos» und Anhänge/<section>
 * (Posten «Aufhebungs-Signal: Anhänge/<section> und «Gegenstandslos»», Prüfer #892).
 *
 * «Gegenstandslos» ist rechtlich NICHT «Aufgehoben» (§1/§8): der Artikel wurde nicht
 * durch einen Aufhebungsakt gestrichen, sondern ist gegenstandslos geworden. Darum
 * ein EIGENES Feld `gegenstandslos` und ein eigenes Zustandswort — nie als
 * «aufgehoben» gezeigt.
 *
 * Die HTML-Ausschnitte sind WÖRTLICH aus den gepinnten Fedlex-Konsolidierungen
 * (Filestore-HTML, abgerufen 30.9.2026; Pins scripts/fedlex-cache.sh):
 *   StGB  cc/54/757_781_799 / 20260612 / html-4   art_67_f            «Gegenstandslos gemäss Ziff. IV 1 …»
 *   OR    cc/27/317_321_377 / 20260101            disp_u16/art_6      «Gegenstandslos.»
 *   KKV   annex_1 (Aufgehoben durch …, Fn-Klasse «footnotes»)
 *   RDV   annex_1 (Aufgehoben durch …, Fn-Klasse «footnotes section-heading-footnote»)
 *   EPV   annex_2 («Eingefügt … bis zum 31. Dez. 2023» — befristet, NICHT aufgehoben)
 */
import { describe, it, expect } from 'vitest';
import {
  fussnoteGegenstandslos,
  artikelAmtlichesSignal,
  artikelAmtlichAufgehoben,
  artikelTextMitAufhebung,
  anhangAmtlichesSignal,
  signalFelder,
} from '../../scripts/normtext/aufhebung-signal.ts';
import { extrahiereArtikelAusAnker, extrahiereAnhang } from '../../scripts/normtext/extrahiere-fedlex.ts';
import {
  artikelLeerstellenStatus,
  leerstellenWort,
  LEERSTELLE_KURZ,
  LEERSTELLE_GEGENSTANDSLOS_ERLAEUTERUNG,
} from '../../src/lib/normtext/darstellung.ts';
import { zuBasislinie, sammleLeerstellen } from '../../scripts/normtext/check-leerstellen.ts';

// ── Artikel: «Gegenstandslos gemäss …» (StGB Art. 67f) ────────────────────────
const STGB_ART_67F =
  '<article id="art_67_f"><a name="a67f"></a><h6 class="heading" role="heading"><span class="display-icon"></span>' +
  '<span class="external-link-icon"></span><a href="#art_67_f"><b>Art. 67</b><i>f</i></a>' +
  '<sup><a href="#fn-d817201e5245" id="fnbck-d817201e5245">117</a></sup></h6><div class="collapseable">' +
  '<div class="footnotes"><p id="fn-d817201e5245"><sup><a href="#fnbck-d817201e5245">117</a></sup><sup></sup> ' +
  'Gegenstandslos gemäss Ziff. IV 1 des BG vom 19. Juni 2015 (Änderung des Sanktionenrechts), mit Wirkung seit ' +
  '1. Jan. 2018 (<a href="https://fedlex.data.admin.ch/eli/oc/2016/249" target="_blank">AS <b>2016</b> 1249</a>; ' +
  '<a href="https://fedlex.data.admin.ch/eli/fga/2012/670" target="_blank">BBl <b>2012</b> 4721</a>).</p></div></div></article>';

// ── Artikel: «Gegenstandslos.» (OR Schlusstitel, Anker mit «/») ───────────────
const OR_DISP_U16_ART_6 =
  '<article id="disp_u16/art_6"><a name="tttttta6"></a><h6 class="heading" role="heading"><span class="display-icon"></span>' +
  '<span class="external-link-icon"></span><a href="#disp_u16/art_6"><b>Art. 6</b></a>' +
  '<sup><a href="#fn-d2095895e60325" id="fnbck-d2095895e60325">928</a></sup></h6><div class="collapseable">' +
  '<div class="footnotes"><p id="fn-d2095895e60325"><sup><a href="#fnbck-d2095895e60325">928</a></sup><sup></sup><sup> </sup>' +
  'Gegenstandslos.</p></div></div></article>';

// ── Artikel: «Gegenstandslos» an EINEM Absatz eines lebenden Artikels (KOV Art. 99) ──
const ARTIKEL_ABS2_GEGENSTANDSLOS =
  '<article id="art_99"><h6 class="heading" role="heading"><a href="#art_99"><b>Art. 99</b></a></h6><div class="collapseable">' +
  '<p class="absatz"><sup>1</sup>&nbsp;Die vorliegende Verordnung tritt auf den 1. Januar 1912 in Kraft.</p>' +
  '<p class="absatz"><sup>2</sup>&nbsp;…<sup><a href="#fn-k" id="fnbck-k">1</a></sup></p>' +
  '<div class="footnotes"><p id="fn-k"><sup>1</sup> Gegenstandslose UeB.</p></div></div></article>';

// ── Anhänge: leerer <section>-Körper + Kopf-Fussnote ──────────────────────────
const KKV_ANNEX_1_2 =
  '<div id="annex"><section id="annex_1"><h1 class="heading" role="heading" aria-level="1"><span class="display-icon"></span>' +
  '<span class="external-link-icon"></span><a href="#annex_1">Anhang 1</a><span class="man-font-style-normal">' +
  '<sup><a href="#fn-d332218e10859" id="fnbck-d332218e10859">290</a></sup></span></h1><div class="footnotes">' +
  '<p id="fn-d332218e10859"><sup><a href="#fnbck-d332218e10859">290</a></sup><sup></sup> Aufgehoben durch Anhang 11 Ziff. 1 der ' +
  'Finanzdienstleistungsverordnung vom&nbsp;6.&nbsp;Nov.&nbsp;2019, mit Wirkung seit 1. Jan. 2020 (<a href="https://fedlex.data.admin.ch/eli/oc/2019/759" ' +
  'target="_blank">AS <b>2019 </b>4459</a>).</p></div><div class="collapseable"></div></section>' +
  '<section id="annex_2"><h1 class="heading" role="heading" aria-level="1"><span class="display-icon"></span>' +
  '<span class="external-link-icon"></span><a href="#annex_2">Anhang 2</a><span class="man-font-style-normal">' +
  '<sup><a href="#fn-d332218e10876" id="fnbck-d332218e10876">291</a></sup></span></h1><div class="footnotes">' +
  '<p id="fn-d332218e10876"><sup><a href="#fnbck-d332218e10876">291</a></sup><sup></sup> Aufgehoben durch Anhang 11 Ziff. 1 der ' +
  'Finanzdienstleistungsverordnung vom&nbsp;6.&nbsp;Nov.&nbsp;2019, mit Wirkung seit 1. Jan. 2020 (AS <b>2019 </b>4459).</p></div>' +
  '<div class="collapseable"></div></section></div>';

const RDV_ANNEX_1 =
  '<div id="annex"><section id="annex_1"><h1 class="heading" role="heading" aria-level="1"><span class="display-icon"></span>' +
  '<span class="external-link-icon"></span><a href="#annex_1">Anhang&nbsp;1</a><span class="man-font-style-normal">' +
  '<sup><a href="#fn-d34811e1502" id="fnbck-d34811e1502">48</a></sup></span></h1>' +
  '<div class="footnotes section-heading-footnote"><p id="fn-d34811e1502"><sup><a href="#fnbck-d34811e1502">48</a></sup><sup></sup> ' +
  'Aufgehoben durch Ziff. I der V vom 15. Sept. 2023, mit Wirkung seit 15. Okt. 2023 (AS <b>2023</b> 552).</p></div>' +
  '<div class="collapseable"></div></section></div>';

const EPV_ANNEX_2 =
  '<div id="annex"><section id="annex_2"><h1 class="heading" role="heading" aria-level="1"><span class="display-icon"></span>' +
  '<span class="external-link-icon"></span><a href="#annex_2">Anhang 2</a><span class="man-font-style-normal">' +
  '<sup><a href="#fn-d7e2956" id="fnbck-d7e2956">52</a></sup></span></h1><div class="footnotes"><p id="fn-d7e2956">' +
  '<sup><a href="#fnbck-d7e2956">52</a></sup><sup></sup> Eingefügt durch Ziff. II der V vom 24. Aug. 2022, in Kraft vom ' +
  '1. Sept. 2022 bis zum 31. Dez. 2023 (AS <b>2022</b> 467).</p></div><div class="collapseable"></div></section></div>';

// Anhang MIT lebendem Wortlaut und Kopf-Fussnote «Aufgehoben durch» (zB. teilweise Neufassung): KEIN Signal.
const ANHANG_LEBEND_MIT_KOPFVERMERK =
  '<div id="annex"><section id="annex_7"><h1 class="heading" role="heading" aria-level="1"><a href="#annex_7">Anhang 7</a>' +
  '<sup><a href="#fn-z" id="fnbck-z">9</a></sup></h1><div class="footnotes"><p id="fn-z"><sup>9</sup> Aufgehoben durch Ziff. I der V vom ' +
  '1. Jan. 2020, mit Wirkung seit 1. Jan. 2021 (AS 2020 1).</p></div><div class="collapseable">' +
  '<p class="absatz">Die Gebühr beträgt 50 Franken.</p></div></section></div>';

describe('fussnoteGegenstandslos — amtlicher Vermerk am Fussnoten-ANFANG', () => {
  it('«Gegenstandslos gemäss …» (StGB Art. 67f) und «Gegenstandslos.» (OR Schlusstitel Art. 6)', () => {
    expect(fussnoteGegenstandslos('Gegenstandslos gemäss Ziff. IV 1 des BG vom 19. Juni 2015, mit Wirkung seit 1. Jan. 2018 (AS 2016 1249).')).toBe(true);
    expect(fussnoteGegenstandslos('Gegenstandslos.')).toBe(true);
  });

  it('erkennt NICHT: Adjektiv «Gegenstandslose UeB.», Mitte-Satz «ist … gegenstandslos», Aufhebung, leer', () => {
    expect(fussnoteGegenstandslos('Gegenstandslose UeB.')).toBe(false); // KOV Art. 99 / VZG Art. 135 (Absatz-Skopus)
    expect(fussnoteGegenstandslos('Aufgrund der Annahme dieses BB ist dieser Art. gegenstandslos.')).toBe(false);
    expect(fussnoteGegenstandslos('Aufgehoben durch Ziff. I des BG vom 1. Jan. 2020, mit Wirkung seit 1. Jan. 2021 (AS 2020 1).')).toBe(false);
    expect(fussnoteGegenstandslos('')).toBe(false);
  });
});

describe('artikelAmtlichesSignal — Artikel', () => {
  it('StGB Art. 67f: leerer «…»-Body + Kopf-Fussnote «Gegenstandslos gemäss …» ⇒ gegenstandslos', () => {
    expect(artikelAmtlichesSignal(STGB_ART_67F, [{ text: '…' }], [null])).toBe('gegenstandslos');
  });

  it('OR Schlusstitel Art. 6: «Gegenstandslos.» ⇒ gegenstandslos', () => {
    expect(artikelAmtlichesSignal(OR_DISP_U16_ART_6, [{ text: '…' }], [null])).toBe('gegenstandslos');
  });

  it('«gegenstandslos» ist NICHT «aufgehoben»: das alte Boolean bleibt false (§1)', () => {
    expect(artikelAmtlichAufgehoben(STGB_ART_67F, [{ text: '…' }], [null])).toBe(false);
  });

  it('ein lebender Absatz schlägt «Gegenstandslos» an einem anderen Absatz (KOV Art. 99)', () => {
    const bloecke = [{ text: 'Die vorliegende Verordnung tritt auf den 1. Januar 1912 in Kraft.' }, { text: '…' }];
    expect(artikelAmtlichesSignal(ARTIKEL_ABS2_GEGENSTANDSLOS, bloecke, ['x', 'y'])).toBeNull();
  });

  it('Tabelle schlägt «Gegenstandslos» (lebender Inhalt)', () => {
    expect(artikelAmtlichesSignal(STGB_ART_67F, [{ text: '…', tabelle: [{}] }], [null])).toBeNull();
  });

  it('artikelTextMitAufhebung setzt `gegenstandslos`, nie `aufgehoben`, und lässt bloecke/grundlage unberührt', () => {
    const r = { bloecke: [{ text: '…' }], quellen: [null] as (string | null)[] };
    const out = artikelTextMitAufhebung(STGB_ART_67F, r);
    expect(out).toEqual({ gegenstandslos: true, bloecke: [{ text: '…' }] });
    expect('aufgehoben' in out).toBe(false);
  });
});

describe('Generator-Pfad (Extraktor) — Artikel', () => {
  it('extrahiereArtikelAusAnker: StGB Art. 67f ⇒ gegenstandslos:true, Block «…», kein aufgehoben', () => {
    const r = extrahiereArtikelAusAnker(STGB_ART_67F, 'art_67_f');
    expect(r?.gegenstandslos).toBe(true);
    expect(r?.aufgehoben).toBeUndefined();
    expect(r?.bloecke).toEqual([{ absatz: null, text: '…' }]);
  });

  it('extrahiereArtikelAusAnker: Schlusstitel-Anker mit «/» (OR disp_u16/art_6)', () => {
    const r = extrahiereArtikelAusAnker(OR_DISP_U16_ART_6, 'disp_u16/art_6');
    expect(r?.gegenstandslos).toBe(true);
  });
});

describe('Anhang-<section> — amtliches Signal (Generator-Pfad extrahiereAnhang)', () => {
  it('KKV Anhang 1/2: leerer Körper + Kopf-Fussnote «Aufgehoben durch …» ⇒ aufgehoben (Fn-Klasse «footnotes»)', () => {
    for (const anker of ['annex_1', 'annex_2']) {
      const r = extrahiereAnhang(KKV_ANNEX_1_2, anker);
      expect(r?.aufgehoben, anker).toBe(true);
      expect(r?.gegenstandslos, anker).toBeUndefined();
      expect(r?.bloecke).toEqual([{ absatz: null, text: '…' }]);
    }
  });

  it('RDV Anhang 1: Fn-Klasse «footnotes section-heading-footnote» wird ebenfalls gelesen', () => {
    expect(extrahiereAnhang(RDV_ANNEX_1, 'annex_1')?.aufgehoben).toBe(true);
  });

  it('EPV Anhang 2: «Eingefügt … bis zum 31. Dez. 2023» (befristet) ⇒ KEIN Signal (§7)', () => {
    const r = extrahiereAnhang(EPV_ANNEX_2, 'annex_2');
    expect(r?.aufgehoben).toBeUndefined();
    expect(r?.gegenstandslos).toBeUndefined();
  });

  it('Anhang MIT lebendem Wortlaut trägt nie ein Signal, auch bei Kopf-Vermerk', () => {
    const r = extrahiereAnhang(ANHANG_LEBEND_MIT_KOPFVERMERK, 'annex_7');
    expect(r?.aufgehoben).toBeUndefined();
    expect(r?.gegenstandslos).toBeUndefined();
  });

  it('anhangAmtlichesSignal: Gegenstandslos-Vermerk am Anhang-Kopf ⇒ gegenstandslos; ohne Fn ⇒ null', () => {
    const roh =
      '<h1 class="heading"><a href="#annex_3">Anhang 3</a><sup><a href="#fn-g">5</a></sup></h1>' +
      '<div class="footnotes"><p id="fn-g"><sup>5</sup> Gegenstandslos gemäss Ziff. I der V vom 1. Jan. 2020 (AS 2020 1).</p></div>';
    expect(anhangAmtlichesSignal(roh)).toBe('gegenstandslos');
    expect(anhangAmtlichesSignal('<h1 class="heading"><a href="#annex_3">Anhang 3</a></h1>')).toBeNull();
  });
});

describe('signalFelder — Schlüsselreihenfolge und Weglassen', () => {
  it('nur gesetzte Felder, aufgehoben vor gegenstandslos (DB-Projektion byte-gleich)', () => {
    expect(signalFelder({})).toEqual({});
    expect(Object.keys(signalFelder({ aufgehoben: true }))).toEqual(['aufgehoben']);
    expect(Object.keys(signalFelder({ gegenstandslos: true }))).toEqual(['gegenstandslos']);
  });
});

describe('Darstellung — eigene Belegstufe «gegenstandslos»', () => {
  const leer = [{ text: '…' }];

  it('gegenstandslos-Marker ⇒ Zustand «gegenstandslos», Wort «gegenstandslos» (nicht «aufgehoben»)', () => {
    expect(artikelLeerstellenStatus(leer, undefined, true)).toBe('gegenstandslos');
    expect(leerstellenWort('gegenstandslos')).toBe('gegenstandslos');
  });

  it('aufgehoben schlägt gegenstandslos nie stillschweigend: beide gesetzt ⇒ «aufgehoben»-Beleg bleibt führend', () => {
    expect(artikelLeerstellenStatus(leer, true, true)).toBe('aufgehoben');
  });

  it('Bestand unverändert: ohne Marker «leer-ungeklaert», mit aufgehoben «aufgehoben», lebender Text «lebt»', () => {
    expect(artikelLeerstellenStatus(leer)).toBe('leer-ungeklaert');
    expect(artikelLeerstellenStatus(leer, true)).toBe('aufgehoben');
    expect(artikelLeerstellenStatus([{ text: 'Wortlaut.' }], undefined, true)).toBe('lebt');
    expect(leerstellenWort('leer-ungeklaert')).toBe(LEERSTELLE_KURZ);
    expect(leerstellenWort('lebt')).toBeNull();
  });

  it('die Erläuterung sagt «gegenstandslos» und behauptet keine Aufhebung (§8)', () => {
    expect(LEERSTELLE_GEGENSTANDSLOS_ERLAEUTERUNG).toMatch(/gegenstandslos/i);
    expect(LEERSTELLE_GEGENSTANDSLOS_ERLAEUTERUNG).not.toMatch(/aufgehoben/i);
  });
});

describe('check:leerstellen — amtlich gekennzeichnete Einträge sind geklärt', () => {
  it('ein Eintrag mit `gegenstandslos` zählt nicht als ungeklärte Leerstelle', async () => {
    const fs = await import('node:fs');
    const os = await import('node:os');
    const path = await import('node:path');
    const wurzel = fs.mkdtempSync(path.join(os.tmpdir(), 'leerstellen-'));
    fs.mkdirSync(path.join(wurzel, 'public/normtext/bund'), { recursive: true });
    fs.mkdirSync(path.join(wurzel, 'public/normtext/kanton'), { recursive: true });
    fs.writeFileSync(
      path.join(wurzel, 'public/normtext/bund/X.json'),
      JSON.stringify({
        eintraege: [
          { artikelLabel: 'Art. 1', bloecke: [{ text: '…' }], gegenstandslos: true },
          { artikelLabel: 'Art. 2', bloecke: [{ text: '…' }], aufgehoben: true },
          { artikelLabel: 'Art. 3', bloecke: [{ text: '…' }] },
        ],
      }),
    );
    const funde = sammleLeerstellen(wurzel, 'bund');
    expect(zuBasislinie(funde)).toEqual({ bund: { X: 1 }, kanton: {} });
    expect(funde.map((f) => f.label)).toEqual(['Art. 3']);
  });
});
