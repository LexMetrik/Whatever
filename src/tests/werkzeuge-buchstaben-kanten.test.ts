// Buchstaben-Artikel an den Werkzeug-Kanten (W2·29-WERKBANK-LESER, Posten
// 2026-09-24 «Art. 273a OR hängt nach #1016 an keinem Werkzeug»).
//
// Befund GP #1016: seit die Kanten suffix-exakt vergleichen, trifft die blanke
// Obergrenze «273» (Kante 271–273 → mietrecht) Art. 273a–273c OR nicht mehr.
// Prüfung 24.9.2026 (Register bibliothek/normtext/werkzeug-kanten-2026-09-23.md,
// Fedlex OR SR 220, Fassung 1.1.2026, AKN abgerufen 24.9.2026):
//   · 273a «Wohnung der Familie», 273b «Untermiete», 273c «Zwingende
//     Bestimmungen» — keine davon führt der Mietrecht-Rechner (Engine
//     `lib/mietrecht.ts` zitiert 266–266o, 257d, 257f, 272a, 272b, 273; Karte
//     führt «Anfechtung & Erstreckung» als GEPLANT). Nach der Register-Regel
//     (Artikel trägt die Regel UND das Werkzeug führt die Norm) bleibt der
//     Ausschluss — bewusst, nicht versehentlich. Offene Frage an David im
//     Register (Zweifelsfall 273a).
//   · 257d/257f → mietrecht und 219a → gewaehrleistung waren nur zurückgestellt,
//     bis die Funktionszeile (`randNotizWerkzeuge.ts`) suffix-exakt vergleicht.
//     Das tut sie seit dem Nachzug #1016 (`trifftArtikel`) — die Kanten fehlten
//     aber noch. Karte UND Engine führen alle drei Normen.
//
// ROT GESEHEN (§6.7): gegen werkzeuge.ts von origin/main 20f7a36f3 — die drei
// «trägt»-Fälle rot (257d, 257f, 219a ohne Werkzeug), Ausschluss-Fälle grün.
import { describe, expect, it } from 'vitest';
import { werkzeugeFuerArtikel, werkzeugeFuerZitate } from '../lib/normtext/werkzeuge';
import { werkzeugeAmArtikel } from '../pages/gesetz-leser/randNotizWerkzeuge';

const ids = (erlass: string, token: string) => werkzeugeFuerArtikel(erlass, token).map((w) => w.id);
const zeile = (erlass: string, token: string) => werkzeugeAmArtikel(erlass, token).map((w) => w.id);

describe('Buchstaben-Kanten nach #1016', () => {
  it('Art. 257d/257f OR tragen den Mietrecht-Rechner (Panel UND Funktionszeile)', () => {
    for (const t of ['257_d', '257_f']) {
      expect(ids('OR', t), t).toContain('mietrecht');
      expect(zeile('OR', t), t).toContain('mietrecht');
    }
    expect(werkzeugeFuerZitate(['Art. 257d Abs. 2 OR']).map((w) => w.id)).toContain('mietrecht');
  });

  it('Nachbarn von 257d/257f tragen ihn nicht (257, 257a–257c, 257e, 257g)', () => {
    for (const t of ['257', '257_a', '257_b', '257_c', '257_e', '257_g']) {
      expect(ids('OR', t), t).not.toContain('mietrecht');
      expect(zeile('OR', t), t).not.toContain('mietrecht');
    }
  });

  it('Art. 219a OR trägt den Gewährleistungs-Rechner, Art. 219 und 220 nicht', () => {
    expect(ids('OR', '219_a')).toContain('gewaehrleistung');
    expect(zeile('OR', '219_a')).toContain('gewaehrleistung');
    for (const t of ['219', '220']) {
      expect(ids('OR', t), t).not.toContain('gewaehrleistung');
      expect(zeile('OR', t), t).not.toContain('gewaehrleistung');
    }
  });

  it('Art. 273a–273c OR bleiben bewusst ohne Werkzeug (keine Norm des Rechners)', () => {
    for (const t of ['273_a', '273_b', '273_c']) {
      expect(ids('OR', t), t).toEqual([]);
      expect(zeile('OR', t), t).toEqual([]);
    }
    expect(ids('OR', '273')).toContain('mietrecht');
    expect(zeile('OR', '273')).toContain('mietrecht');
  });
});
