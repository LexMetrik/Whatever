import { describe, it, expect } from 'vitest';
import { findeFremdeFundstelleImBody } from '../../scripts/normtext/entscheide-koerper-konflation';
import { konflationsBefunde } from '../../scripts/normtext/check-entscheide';

describe('findeFremdeFundstelleImBody (Gegenprüfungs-Auflage C1, 12.9.2026, PR #816)', () => {
  it('erkennt einen laufenden Kopf DESSELBEN Bandes, der zu einer ANDEREN Fundstelle gehört (Anlassfall bge_152_V_2 ← 152 V 20)', () => {
    const body = 'Diese Version stand vom 1. Januar BGE 152 V 20 S. 23 1996 bis Ende Juli 2008 in Kraft.';
    expect(findeFremdeFundstelleImBody(body, '152 V 2')).toBe('152 V 20');
  });
  it('meldet NICHTS bei einer legitimen Zitierung eines ÄLTEREN Bandes (Norm-/Präjudiz-Zitat)', () => {
    const body = 'Nach ständiger Rechtsprechung (vgl. BGE 82 III 94 S. 96) gilt …';
    expect(findeFremdeFundstelleImBody(body, '146 III 113')).toBeNull();
  });
  it('meldet NICHTS, wenn der laufende Kopf zur EIGENEN Fundstelle passt', () => {
    const body = 'BGE 151 II 475 S. 480 Erwägungen …';
    expect(findeFremdeFundstelleImBody(body, '151 II 475')).toBeNull();
  });
  it('meldet NICHTS ohne bgeReferenz (kantonale/bger-Entscheide)', () => {
    expect(findeFremdeFundstelleImBody('BGE 152 V 20 S. 23', null)).toBeNull();
  });
  it('meldet NICHTS in leerem Text', () => {
    expect(findeFremdeFundstelleImBody('', '152 V 2')).toBeNull();
  });
});

// Tor check:entscheide prüft seit 25.9.2026 auch den amtlichen Sammlungs-Auszug
// (`auszugAbschnitte`) — dort steht seit #1099 der Sammlungstext mit laufenden
// Seitenköpfen; vorher lag er ausserhalb des Tors.
describe('konflationsBefunde (check:entscheide, Body UND Auszug)', () => {
  const abs = (text: string) => [{ bloecke: [{ text }] }] as never;
  it('meldet einen fremden Kopf DESSELBEN Bandes im Auszug (152 I 2 ← Auszug von 152 I 20)', () => {
    const f = konflationsBefunde('bge_152_I_2', '152 I 2', {
      abschnitte: abs('Sachverhalt ohne Seitenkopf.'),
      auszugAbschnitte: abs('Aus den Erwägungen: BGE 152 I 20 S. 24 … die Beschwerde ist abzuweisen.'),
    });
    expect(f).toHaveLength(1);
    expect(f[0]).toMatch(/^bge_152_I_2: Sammlungs-Auszug trägt den laufenden Kopf von BGE 152 I 20 \(eigene Fundstelle 152 I 2\)/);
  });
  it('meldet den Body-Befund wie bisher', () => {
    const f = konflationsBefunde('bge_152_V_2', '152 V 2', { abschnitte: abs('BGE 152 V 20 S. 23') });
    expect(f).toEqual([expect.stringMatching(/^bge_152_V_2: Body trägt den laufenden Kopf von BGE 152 V 20 /)]);
  });
  it('bleibt still bei eigenem Kopf im Auszug und ohne bgeReferenz', () => {
    expect(konflationsBefunde('bge_152_I_2', '152 I 2', {
      abschnitte: abs(''), auszugAbschnitte: abs('BGE 152 I 2 S. 5 … vgl. BGE 82 III 94 S. 96'),
    })).toEqual([]);
    expect(konflationsBefunde('x', null, {
      abschnitte: abs('BGE 152 I 20 S. 24'), auszugAbschnitte: abs('BGE 152 I 20 S. 24'),
    })).toEqual([]);
  });
});
