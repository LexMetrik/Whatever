// @vitest-environment node
/**
 * W2·18-FEHLERBUCH — «der Gliederungs-Pfeil klappt teils erst beim zweiten Klick»
 * (Befund David 15.9.2026).
 *
 * WAS DIESER TEST BEWACHT. Die read-only-Sonde vom 15.9.2026 hat den Pfeil
 * entlastet: in 112 Klicks (Desktop/Mobil, OR/ZGB) kippte der Chevron in 0
 * Fällen erst beim zweiten Mal — Hydration, Fokus und Doppel-Handler sind
 * widerlegt. Gefunden wurde ein anderer Defekt, der dasselbe ERLEBNIS erzeugt:
 * `springeZuArtikel` öffnete den Ast, verbuchte ihn aber nicht als manuell.
 * Der nächste Scroll-Spy-Zyklus adoptierte ihn damit ins Auto-Lager und durfte
 * ihn wieder zuklappen.
 *
 * WARUM ALS UNIT-FALL UND NICHT ALS e2e (§6.7 «ein Tor, das nicht scheitern
 * kann, ist gefährlicher als keines»). Das Zuklappen greift erst, wenn ein Ast
 * AUTO_ZU_NACHLAUF (6) Pfadwechsel alt ist — so weit scrollt keine der
 * bestehenden Gliederungs-Sonden, und genau darum blieb die Lücke unentdeckt
 * (dieselbe Begründung wie bei `toc-auto-zuklappen-w219.test.ts`). Geprüft wird
 * deshalb die REGEL an ihrer reinen Funktion, plus — zweiter Teil — dass die
 * vier Schreiber sie auch wirklich benutzen. Ohne den zweiten Teil wäre der
 * erste eine Aussage über ein Modul, das niemand ruft.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import {
  merkeSprungAstManuell, merkeKlappAstManuell, darfAutoAdoptieren, type AstBuchhaltung,
} from '../pages/gesetz-leser/sprungAst';

const leer = (): AstBuchhaltung => ({
  autoOffen: new Set(), autoTick: new Map(), manuellOffen: new Set(), manuellZu: new Set(),
});

/** Der Adoptions-Schritt eines Scroll-Spy-Zyklus (inhalt-hooks.tsx, `anwenden`):
 *  jede Id des aktiven Pfads, die der Nutzer nicht verbucht hat, wandert ins
 *  Auto-Lager und bekommt einen Nachlauf-Tick. Nur dort landende Äste dürfen
 *  später von `planeZuklappen` wieder geschlossen werden. */
function spyZyklus(ids: readonly string[], b: AstBuchhaltung, tick: number): void {
  for (const id of ids) if (darfAutoAdoptieren(id, b)) { b.autoOffen.add(id); b.autoTick.set(id, tick); }
}

describe('W2·18 · ein per Artikel-Sprung geöffneter Ast bleibt offen', () => {
  const PFAD = ['sek-1', 'sek-4', 'sek-9'];

  it('Sprung → Spy-Zyklus → der Ast liegt NICHT im Auto-Lager (und kann nicht zugeklappt werden)', () => {
    const b = leer();
    merkeSprungAstManuell(PFAD, b);
    spyZyklus(PFAD, b, 1);
    spyZyklus(PFAD, b, 2);
    // Der Vorzustand trug hier den ganzen Pfad: `manuellZu` war geleert, aber
    // `manuellOffen` blieb leer, und der Spy adoptierte alles.
    expect([...b.autoOffen]).toEqual([]);
    expect([...b.autoTick.keys()]).toEqual([]);
    expect([...b.manuellOffen].sort()).toEqual([...PFAD].sort());
  });

  it('ein zuvor manuell ZUgeklappter Ast wird vom Sprung wieder geöffnet — und bleibt geschützt', () => {
    const b = leer();
    merkeKlappAstManuell(PFAD, false, b);
    expect([...b.manuellZu].sort()).toEqual([...PFAD].sort());
    merkeSprungAstManuell(PFAD, b);
    expect([...b.manuellZu]).toEqual([]);
    spyZyklus(PFAD, b, 1);
    expect([...b.autoOffen]).toEqual([]);
  });

  it('nie in beiden Lagern zugleich (B3-Mischzustand, Bug-Check 9.8.2026)', () => {
    const b = leer();
    merkeKlappAstManuell(PFAD, true, b);
    merkeKlappAstManuell(PFAD, false, b);
    expect([...b.manuellOffen]).toEqual([]);
    expect([...b.manuellZu].sort()).toEqual([...PFAD].sort());
    // Zugeklappt heisst zugeklappt: der Spy reisst ihn nicht wieder auf.
    expect(PFAD.every((id) => !darfAutoAdoptieren(id, b))).toBe(true);
  });

  it('idempotent: zweimal derselbe Sprung ergibt denselben Zustand (§2)', () => {
    const a = leer(); const b = leer();
    merkeSprungAstManuell(PFAD, a);
    merkeSprungAstManuell(PFAD, b); merkeSprungAstManuell(PFAD, b);
    expect([...b.manuellOffen].sort()).toEqual([...a.manuellOffen].sort());
    expect([...b.autoOffen]).toEqual([...a.autoOffen]);
  });

  it('ein Ast, den der Spy selbst geöffnet hat, verliert beim Sprung seinen Nachlauf-Tick', () => {
    const b = leer();
    spyZyklus(PFAD, b, 7);
    expect(b.autoTick.get('sek-4')).toBe(7);
    merkeSprungAstManuell(PFAD, b);
    expect(b.autoTick.has('sek-4')).toBe(false);
    expect(b.autoOffen.has('sek-4')).toBe(false);
  });
});

// ─── Zweiter Teil: die Regel hat GENAU EINEN Ort (§5) ───────────────────────
//
// Bis zum 15.9.2026 stand sie viermal getippt im Repo, und eine der vier Kopien
// (`springeZuArtikel`) war unvollständig — das ist der Defekt oben. Diese Sonde
// verhindert, dass eine fünfte Kopie entsteht oder eine der vier zurückfällt.
// `readFileSync` wirft, wenn eine Datei umbenannt wird: die Sonde wird dann rot
// und nicht still grün (§6.7 b).
const QUELLE = (p: string) => readFileSync(p, 'utf8');

describe('W2·18 · die Ast-Buchhaltung steht an EINEM Ort', () => {
  it('alle vier Schreiber rufen sprungAst statt eigener Mengen-Arithmetik', () => {
    const schreiber: Array<[string, RegExp]> = [
      ['src/pages/gesetz-leser/v3/leserV3Modell.ts', /merkeSprungAstManuell\(/],
      ['src/pages/gesetz-leser/inhalt-sprung.tsx', /merkeSprungAstManuell\(/],
      ['src/pages/gesetz-leser/inhalt-zustand.tsx', /merkeKlappAstManuell\(/],
      ['src/pages/gesetz-leser/inhalt-zustand.tsx', /merkeSprungAstManuell\(/],
    ];
    // Boolesch statt `toMatch`: ein Fehlschlag soll den DATEINAMEN melden, nicht
    // die halbe Quelldatei in die CI-Ausgabe kippen (gesehen bei der Rot-Probe).
    for (const [datei, muster] of schreiber) {
      expect(muster.test(QUELLE(datei)), `${datei} ruft ${muster} nicht`).toBe(true);
    }
  });

  it('der Scroll-Spy liest sein Adoptions-Prädikat aus derselben Datei', () => {
    expect(/darfAutoAdoptieren\(/.test(QUELLE('src/pages/gesetz-leser/inhalt-hooks.tsx'))).toBe(true);
  });

  it('keine Datei ausser sprungAst.ts schreibt noch von Hand in manuellOffenRef', () => {
    // `.add(` auf dem Ref ist die Signatur der Kopie, die driftete.
    const verdacht = [
      'src/pages/gesetz-leser/v3/leserV3Modell.ts',
      'src/pages/gesetz-leser/inhalt-sprung.tsx',
      'src/pages/gesetz-leser/inhalt-zustand.tsx',
      'src/pages/gesetz-leser/inhalt-hooks.tsx',
    ];
    for (const datei of verdacht) {
      expect(/manuellOffenRef\.current\.add\(/.test(QUELLE(datei)), `${datei} schreibt wieder von Hand`).toBe(false);
    }
  });
});
