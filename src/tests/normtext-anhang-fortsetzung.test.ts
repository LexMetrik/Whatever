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
