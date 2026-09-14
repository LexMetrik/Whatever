/**
 * W2·27 — doppelte Fedlex-`art_`-id im Struktur-Sidecar (Fahrplan BUND-FERTIG §1.1,
 * Posten «KKV-Token 126_z__2»).
 *
 * BELEG AUS DER QUELLE (Fedlex-Filestore-HTML der KKV, SR 951.311, Abruf 12.9.2026,
 * https://www.fedlex.admin.ch/eli/cc/2006/859/de): `grep -o 'id="art_126_z[^"]*"'`
 * liefert `id="art_126_z"` ZWEIMAL — einmal für Art. 126z «Anlagebeschränkungen und
 * Anlagetechniken» (3a. Titel, 3. Kapitel) und einmal für Art. 126z^tredecies
 * «Wesentliche Mängel» (3a. Titel, 5. Kapitel), dessen Ordinal-Suffix Fedlex nicht in
 * die eId schreibt. Das ist ein QUELL-Effekt (ungültiges HTML mit doppelter id), kein
 * Extraktionsfehler unsererseits.
 *
 * Der Snapshot-Generator vergibt dafür seit M9/G7 den Synthese-Suffix «__2»
 * (`alleArtikelTokens`, extrahiere-fedlex.ts). Der Struktur-Extraktor tat es NICHT.
 *
 * ROT-BEWEIS (§6.7): vor dem Fix keyte `extrahiereStruktur` beide <article> auf
 * denselben Schlüssel — das zweite ÜBERSCHRIEB das erste. Folge war nicht nur ein
 * fehlender Eintrag, sondern FALSCHE Daten: Art. 126z KKV trug im Sidecar die
 * Marginalie «Wesentliche Mängel» und die Gliederung des 5. Kapitels (§1/§7).
 * Test 1 unten schlägt ohne den Fix fehl (nur 1 Schlüssel, falsche Marginalie).
 */
import { describe, it, expect } from 'vitest';
import { extrahiereStruktur } from '../../scripts/normtext/struktur-extrahiere.ts';
import { extrahiereFussnoten } from '../../scripts/normtext/fussnoten-extrahiere.ts';

/** Minimal-Nachbau der KKV-Stelle: gleiche id, zwei Kapitel, zwei Randtitel. */
const KKV_AUSSCHNITT =
  '<h2 class="heading">3a. Titel: Limited Qualified Investor Fund</h2>' +
  '<div class="collapseable">' +
  '<h3 class="heading">3. Kapitel: Anlagevorschriften</h3>' +
  '<div class="collapseable">' +
  '<div class="heading">Anlagebeschränkungen und Anlagetechniken</div>' +
  '<div class="collapseable">' +
  '<article id="art_126_z"><div class="collapseable">' +
  '<p class="absatz ">Der Gesellschaftsvertrag muss die Anlagebeschränkungen nennen.</p>' +
  '</div></article>' +
  '</div></div>' +
  '<h3 class="heading">5. Kapitel: Prüfung und Prüfberichte</h3>' +
  '<div class="collapseable">' +
  '<div class="heading">Wesentliche Mängel</div>' +
  '<div class="collapseable">' +
  '<article id="art_126_z"><div class="collapseable">' +
  '<p class="absatz ">Stellt die Prüfgesellschaft wesentliche Mängel fest, so muss sie diese aufnehmen.</p>' +
  '</div></article>' +
  '</div></div>' +
  '</div>';

describe('extrahiereStruktur — doppelte Fedlex-art_id (KKV Art. 126z)', () => {
  it('ROT-BEWEIS: beide Vorkommen behalten ihre eigene Marginalie und Gliederung; das zweite wird «__2»', () => {
    const s = extrahiereStruktur(KKV_AUSSCHNITT);
    expect(Object.keys(s).sort()).toEqual(['126_z', '126_z__2']);
    expect(s['126_z'].marginalie).toEqual(['Anlagebeschränkungen und Anlagetechniken']);
    expect(s['126_z__2'].marginalie).toEqual(['Wesentliche Mängel']);
    expect(s['126_z'].gliederung.map((g) => g.label)).toEqual([
      '3a. Titel: Limited Qualified Investor Fund',
      '3. Kapitel: Anlagevorschriften',
    ]);
    expect(s['126_z__2'].gliederung.map((g) => g.label)).toEqual([
      '3a. Titel: Limited Qualified Investor Fund',
      '5. Kapitel: Prüfung und Prüfberichte',
    ]);
  });

  it('einfache ids bleiben unveraendert (kein Suffix ohne Wiederholung)', () => {
    const s = extrahiereStruktur(
      '<article id="art_1"><div class="collapseable"><p class="absatz ">A.</p></div></article>' +
        '<article id="art_2"><div class="collapseable"><p class="absatz ">B.</p></div></article>',
    );
    expect(Object.keys(s).sort()).toEqual(['1', '2']);
  });

  it('zaehlt je Anker getrennt — Haupttext art_1 und Schlussteil disp_u1/art_1 kollidieren nicht', () => {
    const s = extrahiereStruktur(
      '<article id="art_1"><div class="collapseable"><p class="absatz ">A.</p></div></article>' +
        '<article id="disp_u1/art_1"><div class="collapseable"><p class="absatz ">B.</p></div></article>',
    );
    expect(Object.keys(s).sort()).toEqual(['1', 'disp_u1_art_1']);
  });
});

describe('extrahiereFussnoten — derselbe Synthese-Suffix (Join-Schluessel, §5)', () => {
  it('ordnet den Fussnoten-Apparat des ZWEITEN Vorkommens nicht dem ersten zu', () => {
    const html =
      '<article id="art_9"><div class="collapseable"><p class="absatz ">Erster Text.</p></div></article>' +
      '<article id="art_9"><div class="collapseable"><p class="absatz ">Zweiter Text.' +
      '<sup><a href="#fn-e1" id="fnbck-e1">7</a></sup></p></div></article>' +
      '<p id="fn-e1">Fassung gemaess Ziff. I der V vom 1. Jan. 2020.</p>';
    const fn = extrahiereFussnoten(html);
    expect(fn['9'] ?? []).toEqual([]);
    expect((fn['9__2'] ?? []).length).toBe(1);
  });
});
