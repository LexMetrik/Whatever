// Funktionszeile am Artikelende, Rubrik «Werkzeuge» — suffix-exakt seit #1016.
//
// `werkzeugeAmArtikel` verglich bis 24.9.2026 nur die Hauptnummer des Anker-
// Tokens mit `von`/`bis` der Gruppe. Seit #1016 (S6-D6) tragen die Kanten
// exakte Suffix-Grenzen; ohne den Nachzug erschien der Lohnfortzahlungs-
// Rechner (Art. 324a/324b OR, Verhinderung des Arbeitnehmers) auch an
// Art. 324 OR (Annahmeverzug des Arbeitgebers) und die Nichtbekanntgabe-Vorlage
// (Art. 8a SchKG) an Art. 8 SchKG. Abgleich-Regel ist `trifftArtikel`
// (lib/normtext/werkzeuge.ts, §5: eine Regel für alle Leser der Tabelle).
import { describe, expect, it } from 'vitest';
import { werkzeugeAmArtikel } from '../pages/gesetz-leser/randNotizWerkzeuge';

const ids = (erlass: string, token: string) => werkzeugeAmArtikel(erlass, token).map((w) => w.id);

describe('werkzeugeAmArtikel — suffix-exakt (Nachzug #1016)', () => {
  it('Art. 324 OR trägt den Lohnfortzahlungs-Rechner NICHT', () => {
    expect(ids('OR', '324')).not.toContain('lohnfortzahlung');
  });
  it('Art. 324a und 324b OR tragen ihn', () => {
    expect(ids('OR', '324_a')).toContain('lohnfortzahlung');
    expect(ids('OR', '324_b')).toContain('lohnfortzahlung');
  });
  it('Art. 8 SchKG trägt die Nichtbekanntgabe-Vorlage nicht, Art. 8a schon', () => {
    expect(ids('SCHKG', '8')).not.toContain('nichtbekanntgabe-betreibung');
    expect(ids('SCHKG', '8_a')).toContain('nichtbekanntgabe-betreibung');
  });
  it('unverändert: blanker Bereich trifft weiter (Art. 130 OR ⇒ Verjährung)', () => {
    expect(ids('OR', '130')).toContain('verjaehrung');
  });
});
