// @vitest-environment node
/**
 * LESER-NAV · O-28(c) Nachzug (Gegenprüfung #1387) — die Fokus-Suche nach dem Klick auf «Artikel N»
 * läuft nach ZEIT, nicht nach Frames.
 *
 * GEMESSEN 15.10.2026 (Gegenprüfung, Dev-Server, 8-fache CPU-Drosselung im zweiten Fenster): die
 * 40 Frames der ersten Fassung reichten nicht; der Ziel-Artikel stand erst nach dem Router-Render da,
 * der Fokus blieb auf `<body>`. Hier wird die Uhr (`performance.now`) und der Frame-Takt gefälscht:
 * ein langsamer Takt (wenige Frames je Sekunde) darf die Suche nicht vorzeitig beenden.
 *
 * ROT ZU BEKOMMEN (§6.7): in `inhalt-sprung.fokussiereArtikel` die Frist wieder an einen Frame-Zähler
 * hängen (`if (++n < 40)` statt `performance.now() - start < FOKUS_FRIST_MS`) ⇒ (a) fällt.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { FOKUS_FRIST_MS, fokussiereArtikel } from '../pages/gesetz-leser/inhalt-sprung';

interface FakeEl {
  hasAttribute: (n: string) => boolean;
  tabIndex: number;
  focus: ReturnType<typeof vi.fn>;
}
const element = (): FakeEl => ({ hasAttribute: () => false, tabIndex: 0, focus: vi.fn() });

let jetzt = 0;
let warteschlange: Array<() => void> = [];
let frames = 0;

/** Ein Frame: die Uhr springt um `dauerMs` (langsames Gerät = grosse Zahl), dann laufen die Rückrufe. */
function frame(dauerMs: number): void {
  jetzt += dauerMs;
  const lauf = warteschlange;
  warteschlange = [];
  if (lauf.length) frames += 1;                            // nur Frames, in denen die Suche noch läuft
  lauf.forEach((f) => f());
}

const BODY = {};
beforeEach(() => {
  jetzt = 0;
  frames = 0;
  warteschlange = [];
  vi.stubGlobal('window', { requestAnimationFrame: (f: () => void) => { warteschlange.push(f); return warteschlange.length; } });
  vi.stubGlobal('document', { body: BODY, activeElement: BODY });
  vi.stubGlobal('performance', { now: () => jetzt });
});
afterEach(() => { vi.unstubAllGlobals(); });

describe('O-28(c) — Fokus-Suche mit Zeitfrist', () => {
  it('(a) ein Ziel, das nach 2 s und 50 langsamen Frames erscheint (mehr als die 40 der alten Fassung), bekommt den Fokus', () => {
    const el = element();
    let da = false;
    fokussiereArtikel(() => (da ? (el as unknown as HTMLElement) : null));
    for (let i = 0; i < 50; i++) frame(40);                // 2 s Gerätezeit, Ziel fehlt noch
    expect(el.focus).not.toHaveBeenCalled();
    da = true;                                             // der Router hat den Artikel gerendert
    frame(40);
    expect(el.focus).toHaveBeenCalledTimes(1);
    expect(frames).toBe(51);
    expect(jetzt).toBeLessThan(FOKUS_FRIST_MS);
  });

  it('(b) die Suche gibt nach der Frist auf (kein Dauerwächter), auch bei sehr langsamen Frames', () => {
    fokussiereArtikel(() => null);
    for (let i = 0; i < 20; i++) frame(FOKUS_FRIST_MS / 10);
    expect(warteschlange.length).toBe(0);
    expect(jetzt).toBeGreaterThanOrEqual(FOKUS_FRIST_MS);
    expect(frames).toBeLessThanOrEqual(11);                // 3000 ms / 300 ms je Frame: nach rund zehn Frames Schluss
  });

  it('(c) ein Ziel, das gleich da ist, wird einmal fokussiert (tabindex=-1, ohne Scroll)', () => {
    const el = element();
    fokussiereArtikel(() => el as unknown as HTMLElement);
    frame(16);
    expect(el.tabIndex).toBe(-1);
    expect(el.focus).toHaveBeenCalledWith({ preventScroll: true });
    expect(warteschlange.length).toBe(0);
  });

  it('(d) arbeitet der Nutzer inzwischen in einem Eingabefeld, bleibt der Fokus dort', () => {
    vi.stubGlobal('document', { body: BODY, activeElement: { matches: () => false } });
    const el = element();
    fokussiereArtikel(() => el as unknown as HTMLElement);
    frame(16);
    expect(el.focus).not.toHaveBeenCalled();
  });
});
