import { describe, it, expect } from 'vitest';
import { istBuchstabenTaste, zifferTaste } from '../components/layout/reiterleiste/tasten';

// ── W2·18 Punkt 1 (Fahrplan §4.R) · DIE ALT-KÜRZEL AM MAC ───────────────────
//
// BELEG 13.9.2026: die Leiste prüfte `e.key === 't' / 'w' / /^[1-9]$/`. Auf
// macOS liefert Option+Buchstabe/Ziffer ein Sonderzeichen als `key` — Option+T
// ist «†», Option+W «∑», Option+1 «¡». Alt+T, Alt+W, Alt+⇧+T und Alt+1…9 waren
// dort tot, während Linux/CI grün blieb (dort IST `key` der Buchstabe).
//
// ROT ZU BEKOMMEN (§6.7): in `reiterleiste/tasten.ts` die `e.code`-Zweige
// streichen (`istBuchstabenTaste` auf `e.key.toLowerCase() === taste`,
// `zifferTaste` auf `/^[1-9]$/.test(e.key)` zurückbauen) ⇒ alle «macOS»-Fälle
// unten werden rot, die Linux-Fälle bleiben grün. Genau so gefahren.

/** Was der Browser auf macOS bei Option+<Taste> meldet. */
const mac = (key: string, code: string) => ({ key, code });
/** Dieselbe Taste auf Linux/Windows. */
const linux = (zeichen: string, code: string) => ({ key: zeichen, code });

describe('Reiterleiste-Tasten — Option/Alt am Mac (W2·18 Punkt 1)', () => {
  it('macOS: Option+T meldet «†», trifft aber die T-Taste', () => {
    expect(istBuchstabenTaste(mac('†', 'KeyT'), 't')).toBe(true);
  });

  it('macOS: Option+W meldet «∑», trifft aber die W-Taste', () => {
    expect(istBuchstabenTaste(mac('∑', 'KeyW'), 'w')).toBe(true);
  });

  it('macOS: Option+⇧+T meldet «ˇ», trifft aber die T-Taste', () => {
    expect(istBuchstabenTaste(mac('ˇ', 'KeyT'), 't')).toBe(true);
  });

  it('macOS: Option+1…9 melden Sonderzeichen, treffen aber ihre Ziffer', () => {
    const zeichen = ['¡', '™', '£', '¢', '∞', '§', '¶', '•', 'ª'];
    zeichen.forEach((z, i) => {
      expect(zifferTaste(mac(z, `Digit${i + 1}`))).toBe(i + 1);
    });
  });

  it('Linux/Windows unverändert: key trägt den Buchstaben, die Ziffer', () => {
    expect(istBuchstabenTaste(linux('t', 'KeyT'), 't')).toBe(true);
    expect(istBuchstabenTaste(linux('W', 'KeyW'), 'w')).toBe(true);
    expect(zifferTaste(linux('9', 'Digit9'))).toBe(9);
  });

  it('fremde Belegung (Dvorak): der Buchstabe auf der Taste zählt auch', () => {
    // Dvorak legt «t» auf die physische Taste KeyK.
    expect(istBuchstabenTaste({ key: 't', code: 'KeyK' }, 't')).toBe(true);
  });

  it('Zifferblock zählt mit, die 0 und Buchstaben nicht', () => {
    expect(zifferTaste({ key: '3', code: 'Numpad3' })).toBe(3);
    expect(zifferTaste({ key: '0', code: 'Digit0' })).toBe(null);
    expect(zifferTaste({ key: 'q', code: 'KeyQ' })).toBe(null);
  });

  it('andere Tasten treffen nicht', () => {
    expect(istBuchstabenTaste({ key: 'r', code: 'KeyR' }, 't')).toBe(false);
    expect(istBuchstabenTaste({ key: 'Enter', code: 'Enter' }, 'w')).toBe(false);
  });
});
