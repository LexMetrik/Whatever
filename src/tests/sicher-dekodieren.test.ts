// W2·17-UI-BEFUNDE PA-1-B01 · kaputtes %-Escape im Anker darf nie werfen.
import { describe, it, expect } from 'vitest';
import { sicherDekodiert } from '../lib/sicherDekodieren';
import { stelleVonReiter } from '../lib/tabGruppen';
import { tokenAusHash } from '../pages/gesetz-leser/v3/einzelModus';
import { gesetzPfad, entscheidPfad, materialPfad } from '../lib/verlaufLabel';
import { internationalAnkerAbbildung } from '../lib/navigation';

describe('sicherDekodiert', () => {
  it('dekodiert gültige Escapes', () => {
    expect(sicherDekodiert('22%20a')).toBe('22 a');
    expect(sicherDekodiert('36%E2%80%9342')).toBe('36–42');
    expect(sicherDekodiert('336_c')).toBe('336_c');
  });
  it('liefert null statt zu werfen bei kaputtem Escape', () => {
    expect(sicherDekodiert('97%')).toBeNull();
    expect(sicherDekodiert('%E0')).toBeNull();
    expect(sicherDekodiert('%')).toBeNull();
    expect(sicherDekodiert('%E0%A4%A')).toBeNull();
  });
});

describe('Anker-Leser ohne Wurf bei kaputtem Escape', () => {
  it('tokenAusHash → null', () => {
    expect(tokenAusHash('#art-97%')).toBeNull();
    expect(tokenAusHash('#art-%E0')).toBeNull();
    expect(tokenAusHash('#art-22%20a')).toBe('22 a');
  });
  it('stelleVonReiter (Reiterleiste) wirft nicht', () => {
    expect(() => stelleVonReiter({ path: '/gesetze/bund/OR#art-97%' })).not.toThrow();
    expect(stelleVonReiter({ path: '/gesetze/bund/OR#art-97%' })).toBeNull();
    expect(stelleVonReiter({ path: '/gesetze/bund/OR#art-336_c' })?.stelle).toBe('Art. 336c');
  });
});

describe('weitere Adress-Leser ohne Wurf (PA-1-B01)', () => {
  it('Pfad-Leser der Reiterleiste/Verlauf: kaputtes Escape ⇒ Rohsegment statt Wurf', () => {
    expect(() => gesetzPfad('/gesetze/bund/OR%')).not.toThrow();
    expect(gesetzPfad('/gesetze/bund/OR%')).toEqual({ ebene: 'bund', key: 'OR%' });
    expect(gesetzPfad('/gesetze/kanton/ZH-230')).toEqual({ ebene: 'kanton', key: 'ZH-230' });
    expect(() => entscheidPfad('/rechtsprechung/BGE%E0')).not.toThrow();
    expect(() => materialPfad('/materialien/x%')).not.toThrow();
  });
  it('Alt-Link /international#<anker>: kaputtes Escape ⇒ kein Anker', () => {
    expect(() => internationalAnkerAbbildung('#%')).not.toThrow();
    expect(internationalAnkerAbbildung('#%')).toBe('');
  });
});
