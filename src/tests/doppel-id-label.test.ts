// W2·27 (15.9.2026) — Label-Ableitung bei doppelter Fedlex-«art_*»-id.
//
// Fixtures sind WÖRTLICHE Ausschnitte aus dem gepinnten Cache /tmp/kkv.html
// (KKV, SR 951.311, ELI cc/2006/859, Konsolidierung 20251125, abgerufen
// 14.9.2026) — kein nachgebautes Markup. Fedlex vergibt dort «art_126_z»
// zweimal; nur das zweite Heading trägt das Ordinal «tredecies».
import { describe, it, expect } from 'vitest';
import {
  artikelKopfMarkup,
  ordinalAusKopf,
  doppelIdLabel,
} from '../../scripts/normtext/doppel-id-label.ts';

// 1. Vorkommen (art_126_z) — LEERE <sup>, kein Ordinal.
const KKV_126_Z_ERSTES =
  '<a name="a126z"></a><h6 class="heading" role="heading"><span class="display-icon"></span>' +
  '<span class="external-link-icon"></span><a href="#art_126_z"><b>Art. 126</b><i>z</i>' +
  '<i><sup></sup></i> <i><sup></sup></i>Anlagebeschränkungen und Anlagetechniken</a></h6>' +
  '<div class="collapseable"><p class="absatz man-space-before-4">Der Gesellschaftsvertrag …</p></div>';

// 2. Vorkommen (art_126_z, Synthese-Token «126_z__2») — <sup>tredecies</sup>.
const KKV_126_Z_ZWEITES =
  '<a name="ta126z"></a><h6 class="heading" role="heading"><span class="display-icon"></span>' +
  '<span class="external-link-icon"></span><a href="#art_126_z"><b>Art. 126</b><i>z</i><sup></sup> ' +
  '<sup>tredecies</sup><sub></sub>Wesentliche Mängel</a></h6><div class="collapseable">' +
  '<p class="absatz man-space-before-4"><sup>1</sup>&nbsp;Stellt die Prüfgesellschaft …</p></div>';

// Nachbar mit Heading-Fussnote: <sup><a …>24</a></sup> darf NIE als Ordinal gelten.
const MIT_FUSSNOTE =
  '<h6 class="heading" role="heading"><a href="#art_9"><b>Art. 9</b>' +
  '<sup><a href="#fn-d332218e605" id="fnbck-d332218e605">24</a></sup> Begriffe</a></h6><p>…</p>';

describe('ordinalAusKopf — amtliches Ordinal aus dem Artikel-Kopf (§7)', () => {
  it('KKV art_126_z, 2. Vorkommen: «tredecies»', () => {
    const kopf = artikelKopfMarkup(KKV_126_Z_ZWEITES);
    expect(kopf).not.toBeNull();
    expect(ordinalAusKopf(kopf as string)).toBe('tredecies');
  });

  it('KKV art_126_z, 1. Vorkommen: leere <sup> → kein Ordinal', () => {
    expect(ordinalAusKopf(artikelKopfMarkup(KKV_126_Z_ERSTES) as string)).toBeNull();
  });

  it('Fussnoten-Marker <sup><a>24</a></sup> ist kein Ordinal', () => {
    expect(ordinalAusKopf(artikelKopfMarkup(MIT_FUSSNOTE) as string)).toBeNull();
  });

  it('zwei verschiedene Ordinalia (Bereichs-Kopf) → null statt Rateschluss', () => {
    expect(ordinalAusKopf('<h6><b>Art. 15</b><sup>bis</sup>–<b>15</b><sup>ter</sup></h6>')).toBeNull();
  });

  it('Absatz-<sup> ausserhalb des Kopfes fliesst nicht ein', () => {
    // artikelKopfMarkup schneidet den Body weg — der <sup>1</sup> des Absatzes
    // wäre ohnehin numerisch, aber der Schnitt ist die tragende Regel.
    expect(artikelKopfMarkup(KKV_126_Z_ZWEITES)).not.toContain('Prüfgesellschaft');
  });
});

describe('doppelIdLabel — Basis-Label + Ordinal, sonst null', () => {
  it('KKV 126_z__2 → «Art. 126ztredecies» (Hausstil der Nachbarn 126zbis … 126zduodecies)', () => {
    expect(doppelIdLabel(KKV_126_Z_ZWEITES, 'Art. 126z')).toBe('Art. 126ztredecies');
  });

  it('Kopf ohne Ordinal → null (Aufrufer behält das Basis-Label, §7 nichts erfinden)', () => {
    expect(doppelIdLabel(KKV_126_Z_ERSTES, 'Art. 126z')).toBeNull();
  });

  it('kein Artikel gefunden (null) oder kein Kopf → null', () => {
    expect(doppelIdLabel(null, 'Art. 126z')).toBeNull();
    expect(doppelIdLabel('<p>nur Text, kein Kopf</p>', 'Art. 126z')).toBeNull();
  });
});
