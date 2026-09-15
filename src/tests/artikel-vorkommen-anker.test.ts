// W2·27 (15.9.2026, Gegenprüfung PR #890) — amtlicher Sprungziel-Anker bei
// doppelter Fedlex-«art_*»-id.
//
// Fixtures sind WÖRTLICHE Ausschnitte aus dem gepinnten Cache /tmp/kkv.html
// (KKV, SR 951.311, ELI cc/2006/859, Konsolidierung 20251125, abgerufen
// 14.9.2026): beide <article id="art_126_z"> vom Öffnungs-Tag bis zum Ende des
// Kopf-<h6>, unverändert. Nur das zweite trägt den Namens-Anker «ta126z» —
// genau ihn muss die quelleUrl treffen, weil ein Browser das doppelte `id`
// sonst auf das ERSTE Vorkommen («Anlagebeschränkungen») auflöst.
import { describe, it, expect } from 'vitest';
import {
  namensAnkerVorKopf,
  istFragmentEindeutig,
  amtlicherAnker,
  artikelRohHtml,
} from '../../scripts/normtext/artikel-vorkommen.ts';

const ART_126_Z_ERSTES =
  '<article id="art_126_z"><a name="a126z"></a><h6 class="heading" role="heading">' +
  '<span class="display-icon"></span><span class="external-link-icon"></span>' +
  '<a href="#art_126_z"><b>Art. 126</b><i>z</i><i><sup></sup></i> <i><sup></sup></i>' +
  'Anlagebeschränkungen und Anlagetechniken</a></h6>';

const ART_126_Z_ZWEITES =
  '<article id="art_126_z"><a name="ta126z"></a><h6 class="heading" role="heading">' +
  '<span class="display-icon"></span><span class="external-link-icon"></span>' +
  '<a href="#art_126_z"><b>Art. 126</b><i>z</i><sup></sup> <sup>tredecies</sup>' +
  '<sub></sub>Wesentliche Mängel</a></h6>';

/** Dokument mit beiden Vorkommen — wie im Cache, nur ohne den Rumpftext dazwischen. */
const KKV_AUSSCHNITT = `${ART_126_Z_ERSTES}</article>${ART_126_Z_ZWEITES}</article>`;

describe('namensAnkerVorKopf — amtlicher <a name> vor dem Artikel-Kopf', () => {
  it('2. Vorkommen: «ta126z»', () => {
    const roh = artikelRohHtml(KKV_AUSSCHNITT, 'art_126_z__2');
    expect(namensAnkerVorKopf(roh as string)).toBe('ta126z');
  });

  it('1. Vorkommen: «a126z» — ein anderer Name, darum kollisionsfrei', () => {
    const roh = artikelRohHtml(KKV_AUSSCHNITT, 'art_126_z');
    expect(namensAnkerVorKopf(roh as string)).toBe('a126z');
  });

  it('<a name> NACH dem Kopf zählt nicht (nur der eigene Anker des Artikels)', () => {
    expect(namensAnkerVorKopf('<h6>Art. 1</h6><p><a name="fn1"></a>Fussnote</p>')).toBeNull();
  });

  it('Artikel ohne Namens-Anker → null (Aufrufer fällt auf den Basis-Anker zurück)', () => {
    expect(namensAnkerVorKopf('<h6>Art. 1</h6><p>Text</p>')).toBeNull();
  });
});

describe('istFragmentEindeutig — Fragment darf nicht auf ein fremdes Element umschlagen', () => {
  it('«ta126z»: 1× name, 0× id → tauglich', () => {
    expect(istFragmentEindeutig(KKV_AUSSCHNITT, 'ta126z')).toBe(true);
  });

  it('gleichnamiges id="…" im Dokument → untauglich (id schlägt name)', () => {
    expect(istFragmentEindeutig(`${KKV_AUSSCHNITT}<div id="ta126z"></div>`, 'ta126z')).toBe(false);
  });

  it('Name zweimal vergeben → untauglich', () => {
    expect(istFragmentEindeutig(`${KKV_AUSSCHNITT}<a name="ta126z"></a>`, 'ta126z')).toBe(false);
  });
});

describe('amtlicherAnker — Fragment der quelleUrl', () => {
  it('KKV 126_z__2 → «ta126z» statt «art_126_z» (Kern des Befunds)', () => {
    expect(amtlicherAnker(KKV_AUSSCHNITT, 'art_126_z__2')).toBe('ta126z');
  });

  it('ohne «__N» unverändert — der Normalfall bleibt byte-gleich', () => {
    expect(amtlicherAnker(KKV_AUSSCHNITT, 'art_126_z')).toBe('art_126_z');
    expect(amtlicherAnker(KKV_AUSSCHNITT, 'disp_u1/art_1')).toBe('disp_u1/art_1');
  });

  it('«__N» ohne brauchbaren Namens-Anker → Basis-Anker (§7: nichts erfinden)', () => {
    const ohneNamen = '<article id="art_5"><h6>Art. 5</h6></article><article id="art_5"><h6>Art. 5</h6></article>';
    expect(amtlicherAnker(ohneNamen, 'art_5__2')).toBe('art_5');
  });

  it('«__N» ohne passendes <article> → Basis-Anker', () => {
    expect(amtlicherAnker(KKV_AUSSCHNITT, 'art_126_z__9')).toBe('art_126_z');
  });
});
