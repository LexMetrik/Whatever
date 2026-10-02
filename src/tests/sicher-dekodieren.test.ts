// W2·17-UI-BEFUNDE PA-1-B01 · kaputtes %-Escape im Anker darf nie werfen.
import { describe, it, expect } from 'vitest';
import { sicherDekodiert } from '../lib/sicherDekodieren';
import { artikelLabelVonPfad } from '../lib/tabGruppen';
import { tokenAusHash } from '../pages/gesetz-leser/v3/einzelModus';

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
  it('artikelLabelVonPfad (Reiterleiste) wirft nicht', () => {
    expect(() => artikelLabelVonPfad('/gesetze/bund/OR#art-97%')).not.toThrow();
    expect(artikelLabelVonPfad('/gesetze/bund/OR#art-97%')).toBeNull();
    expect(artikelLabelVonPfad('/gesetze/bund/OR#art-336_c')).toBe('Art. 336c');
  });
});
