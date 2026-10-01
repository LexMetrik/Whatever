/**
 * Unit-Abdeckung für `useZurueckSchliesst` (`blattGesten.ts`) — Posten
 * 2026-09-24 (Dach W2·29-WERKBANK-LESER), Nachzug zu #1046.
 *
 * #1046 behob die Flacker-Wurzel nur mit einem e2e-Beleg (`net::ERR_ABORTED`
 * unter 4×-CPU-Drossel, `e2e/leser-v3-panel-nachzug.e2e.ts` Fall (f)): das
 * `history.back()` nach dem Schliessen lief per `setTimeout(…, 0)`
 * (Makrotask) statt `queueMicrotask` (Mikrotask) — in der Makrotask-Lücke
 * konnte eine ECHTE Navigation bereits unterwegs sein und mit dem
 * verspäteten `back()` um denselben Frame konkurrieren.
 *
 * ── WARUM ECHTER REACT-RENDER ────────────────────────────────────────────
 * Stil wie `src/tests/entscheid-erw-entprellung.test.tsx` /
 * `begruessung-strictmode.test.tsx`: `react-dom/client` (Dev-Build,
 * StrictMode aktiv) in ein `linkedom`-DOM. `useZurueckSchliesst` hängt an
 * `useEffect`/`useRef`-Commit-Reihenfolge (StrictMode cleanup→setup IM
 * SELBEN Commit) — das lässt sich nicht verlustfrei ohne React simulieren.
 *
 * ── DREI BEWEISPUNKTE ────────────────────────────────────────────────────
 * 1. Fremde Zurück-Geste (Marke schon weg) ruft `schliesse()` genau einmal.
 * 2. StrictMode-Doppelaufruf (cleanup→setup ohne Rückkehr zur Event-Loop)
 *    lässt den History-Eintrag stehen — `history.back()` wird NICHT gerufen.
 * 3. WURZEL-BEWEIS (Mikrotask vor Makrotask): eine bereits als Makrotask
 *    wartende Fremd-Navigation läuft NACH dem eigenen `history.back()` —
 *    mit der alten `setTimeout(…, 0)`-Variante wäre die Reihenfolge
 *    umgekehrt (Rot-Beweis im Bau-Bericht dokumentiert, hier als
 *    Wegwerf-Änderung gezeigt, nicht committet).
 *
 * ── NACHZUG W2·18-FEHLERBUCH (1.10.2026) ─────────────────────────────────
 * Ein Zuschnittwechsel bei offenem Blatt und der Abbau der Komponente rufen
 * KEIN `history.back()` mehr — `back()` kommt asynchron im Browser an und
 * bricht eine inzwischen begonnene Ganzseiten-Navigation ab (Beleg:
 * `e2e/leser-v3-panel-nachzug.e2e.ts` (f3)). Nur `offen` → false (Nutzergeste:
 * ✕, Esc, Scrim) nimmt den Eintrag zurück. Die Fälle ab «Gegenprobe» decken das
 * ab; der `beforeunload`-Merker aus #1239 ist zurückgebaut (seine Fälle sind
 * ersetzt, die Fremd-Navigation-Mechanik trägt der e2e-Fall (f3)).
 */
import { StrictMode, act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { parseHTML } from 'linkedom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useZurueckSchliesst } from './blattGesten';

interface FensterStumpf {
  history: {
    state: unknown;
    pushState: ReturnType<typeof vi.fn>;
    back: () => void;
  };
  addEventListener: (typ: string, hoerer: () => void) => void;
  removeEventListener: (typ: string, hoerer: () => void) => void;
  document: unknown;
}

let root: Root | null = null;

function aufbauen(): { ziel: HTMLElement; fenster: FensterStumpf; popstateFeuern: () => void } {
  const { document } = parseHTML('<!doctype html><html><body><div id="app"></div></body></html>');
  const popHoerer = new Set<() => void>();
  let zustand: unknown = null;
  const fenster: FensterStumpf = {
    history: {
      get state() { return zustand; },
      pushState: vi.fn((s: unknown) => { zustand = s; }),
      // Echtes `back()` nimmt den zuletzt gepushten Eintrag weg — die Marke
      // verschwindet, GENAU wie im Browser, bevor `popstate` feuert.
      back: vi.fn(() => {
        zustand = null;
        popHoerer.forEach((h) => h());
      }),
    },
    addEventListener: (typ: string, h: () => void) => {
      if (typ === 'popstate') popHoerer.add(h);
    },
    removeEventListener: (typ: string, h: () => void) => {
      if (typ === 'popstate') popHoerer.delete(h);
    },
    document,
  };
  vi.stubGlobal('window', fenster);
  vi.stubGlobal('document', document);
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  return {
    ziel: document.getElementById('app') as unknown as HTMLElement,
    fenster,
    // Simuliert die Zurück-GESTE des Telefons: die Marke ist beim Zurückkommen
    // bereits weg (der Browser hat den Eintrag schon genommen), erst DANACH
    // feuert `popstate` — anders als bei unserem eigenen `history.back()` oben.
    popstateFeuern: () => { zustand = null; popHoerer.forEach((h) => h()); },
  };
}

function Sonde({ offen, modal, schliesse }: { offen: boolean; modal: boolean; schliesse: () => void }) {
  useZurueckSchliesst(offen, modal, schliesse);
  return null;
}

/** `offen` = Absicht des Nutzers, `modal` = Gestalt des Zuschnitts (Standard: modal). */
async function rendern(ziel: HTMLElement, offen: boolean, schliesse: () => void, modal = true) {
  if (!root) root = createRoot(ziel);
  await act(async () => {
    root!.render(createElement(StrictMode, null, createElement(Sonde, { offen, modal, schliesse })));
  });
}

async function abbauen() {
  if (!root) return;
  const r = root;
  root = null;
  await act(async () => r.unmount());
}

describe('useZurueckSchliesst (Leser-Blatt) — echter React-Render, Nachzug #1046', () => {
  beforeEach(() => { vi.useFakeTimers(); });
  afterEach(async () => {
    await abbauen();
    // E-D15-B01: der «back() unterwegs»-Zähler ist Modul-Zustand; sein Notnetz
    // (5 s) gibt ihn frei — hier abgewartet, damit kein Fall dem nächsten einen
    // offenen Rücksprung hinterlässt.
    vi.advanceTimersByTime(10_000);
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it('Aktivierung schreibt einen History-Eintrag mit der Blatt-Marke', async () => {
    const { ziel, fenster } = aufbauen();
    await rendern(ziel, true, () => {});
    expect((fenster.history.state as Record<string, unknown>).lmErlassBlatt).toBe(true);
  });

  it('Zurück-Geste (Marke schon weg) ruft schliesse() genau einmal', async () => {
    const { ziel, popstateFeuern } = aufbauen();
    const schliesse = vi.fn();
    await rendern(ziel, true, schliesse);
    popstateFeuern();
    expect(schliesse).toHaveBeenCalledTimes(1);
  });

  it('StrictMode-Doppelaufruf (cleanup→setup im selben Commit) ruft history.back() NICHT — der Eintrag bleibt stehen', async () => {
    const { ziel, fenster } = aufbauen();
    await rendern(ziel, true, () => {});
    // Der Mikrotask, den der (verworfene) erste Effekt-Durchlauf in seinem
    // Cleanup geplant hätte, ist zu diesem Zeitpunkt längst gelaufen —
    // `laeuft.current` stand vom zweiten Durchlauf schon wieder auf `true`.
    await act(async () => { await Promise.resolve(); });
    expect(fenster.history.back).not.toHaveBeenCalled();
    expect((fenster.history.state as Record<string, unknown>).lmErlassBlatt).toBe(true);
  });

  it('WURZEL-BEWEIS: eigenes history.back() läuft VOR einer bereits wartenden Fremd-Navigation (Mikrotask vor Makrotask)', async () => {
    const { ziel, fenster } = aufbauen();
    const reihenfolge: string[] = [];
    (fenster.history.back as ReturnType<typeof vi.fn>).mockImplementation(() => reihenfolge.push('eigenes-back'));
    await rendern(ziel, true, () => {});

    // Eine ECHTE Navigation ist bereits als Makrotask unterwegs — genau der
    // Wettlauf aus #1046 (`page.goto` in `leser-v3-panel-nachzug.e2e.ts`
    // Fall (f), Läufe 35984783583/36009374111).
    setTimeout(() => reihenfolge.push('fremde-navigation'), 0);

    // Schliessen (✕/Esc/Scrim): offen → false, der Cleanup läuft synchron
    // und plant den Mikrotask.
    await rendern(ziel, false, () => {});
    await act(async () => { await Promise.resolve(); }); // Mikrotasks abarbeiten
    await act(async () => { vi.advanceTimersByTime(0); }); // die Fremd-Makrotask

    expect(reihenfolge).toEqual(['eigenes-back', 'fremde-navigation']);
  });

  it('Gegenprobe: Nutzergeste «Blatt zu» (offen → false) ruft history.back() genau einmal', async () => {
    const { ziel, fenster } = aufbauen();
    await rendern(ziel, true, () => {});
    await rendern(ziel, false, () => {});
    await act(async () => { await Promise.resolve(); });
    expect(fenster.history.back).toHaveBeenCalledTimes(1);
  });

  it('Zuschnittwechsel (offen bleibt, modal → false): KEIN history.back(), die Marke bleibt stehen', async () => {
    const { ziel, fenster } = aufbauen();
    await rendern(ziel, true, () => {});
    // Gestalt wechselt über die Breiten-Schwelle: das Blatt bleibt offen.
    await rendern(ziel, true, () => {}, false);
    await act(async () => { await Promise.resolve(); }); // Mikrotasks abarbeiten
    await act(async () => { vi.advanceTimersByTime(1000); }); // und jede Makrotask
    expect(fenster.history.back).not.toHaveBeenCalled();
    expect((fenster.history.state as Record<string, unknown>).lmErlassBlatt).toBe(true);
  });

  it('Zuschnittwechsel und wieder zurück: der Eintrag wird belegt, nicht ein zweiter geschrieben', async () => {
    const { ziel, fenster } = aufbauen();
    await rendern(ziel, true, () => {});
    await rendern(ziel, true, () => {}, false);
    await rendern(ziel, true, () => {}, true);
    await act(async () => { await Promise.resolve(); });
    expect(fenster.history.pushState).toHaveBeenCalledTimes(1);
    expect(fenster.history.back).not.toHaveBeenCalled();
  });

  it('Nachzug 2 (Milderung A): Nutzergeste «Blatt zu» am breiten Zuschnitt MIT stehender Marke nimmt den Eintrag weg (history.back() genau einmal)', async () => {
    const { ziel, fenster } = aufbauen();
    await rendern(ziel, true, () => {});
    await rendern(ziel, true, () => {}, false); // Zuschnittwechsel: Marke bleibt stehen
    expect(fenster.history.back).not.toHaveBeenCalled();
    await rendern(ziel, false, () => {}, false); // Nutzer schliesst auf dem breiten Zuschnitt
    await act(async () => { await Promise.resolve(); });
    expect(fenster.history.back).toHaveBeenCalledTimes(1);
  });

  it('Nachzug 2: breiter Zuschnitt OHNE Marke (nie modal gewesen): Schliessen ruft kein history.back()', async () => {
    const { ziel, fenster } = aufbauen();
    await rendern(ziel, true, () => {}, false);
    await rendern(ziel, false, () => {}, false);
    await act(async () => { await Promise.resolve(); });
    expect(fenster.history.back).not.toHaveBeenCalled();
  });

  it('Nachzug 2: Schliessen und Zuschnittwechsel im selben Commit ruft history.back() genau EINMAL (kein Doppel)', async () => {
    const { ziel, fenster } = aufbauen();
    await rendern(ziel, true, () => {});
    await rendern(ziel, false, () => {}, false); // offen → false UND modal → false zugleich
    await act(async () => { await Promise.resolve(); });
    expect(fenster.history.back).toHaveBeenCalledTimes(1);
  });

  it('Nachzug 2: breiter Zuschnitt, Eintrag steht, Blatt offen → zu → wieder offen → zu: je Geste höchstens ein back(), nie ein pushState', async () => {
    const { ziel, fenster } = aufbauen();
    await rendern(ziel, true, () => {});
    await rendern(ziel, true, () => {}, false);
    await rendern(ziel, false, () => {}, false);
    await act(async () => { await Promise.resolve(); });
    await rendern(ziel, true, () => {}, false); // Marke ist durch back() weg
    await rendern(ziel, false, () => {}, false);
    await act(async () => { await Promise.resolve(); });
    expect(fenster.history.back).toHaveBeenCalledTimes(1); // zweite Geste: keine Marke → kein back()
    expect(fenster.history.pushState).toHaveBeenCalledTimes(1); // nur das erste Öffnen am schmalen Zuschnitt
  });

  it('verwaister Eintrag (Zuschnittwechsel, dann Zurück-Geste am breiten Zuschnitt) bleibt wirkungslos: schliesse() wird nicht gerufen', async () => {
    const { ziel, popstateFeuern } = aufbauen();
    const schliesse = vi.fn();
    await rendern(ziel, true, schliesse);
    await rendern(ziel, true, schliesse, false);
    popstateFeuern();
    expect(schliesse).not.toHaveBeenCalled();
  });

  it('Abbau der Komponente bei offenem Blatt: KEIN history.back()', async () => {
    const { ziel, fenster } = aufbauen();
    await rendern(ziel, true, () => {});
    await abbauen();
    await act(async () => { await Promise.resolve(); });
    expect(fenster.history.back).not.toHaveBeenCalled();
  });

  // ── E-D15-B01 (W2·17-UI-BEFUNDE, 1.10.2026) ──────────────────────────────
  // Esc/✕ ruft `history.back()` ASYNCHRON; öffnet der Nutzer das Blatt, bevor
  // das `popstate` des eigenen `back()` eintrifft, sah der neue Setup die Marke
  // noch (kein Push) und registrierte `onPop` — das verspätete `popstate` landete
  // auf dem unmarkierten Eintrag und schloss das frisch geöffnete Blatt
  // (gemessen: OR#art-336_c @390, 5/5 Läufe mit Esc, dann `r` nach 2 Mikrotasks).
  // ROT: in `blattGesten.ts` `eigenesZurueck()` durch `window.history.back()` ersetzen.
  it('E-D15-B01: Blatt zu, sofort wieder auf, DANN trifft das popstate des eigenen back() ein ⇒ das neue Blatt bleibt offen', async () => {
    const { ziel, fenster, popstateFeuern } = aufbauen();
    // Wie im Browser: back() kehrt sofort zurück, das popstate kommt SPÄTER.
    (fenster.history.back as ReturnType<typeof vi.fn>).mockImplementation(() => {});
    const schliesse = vi.fn();
    await rendern(ziel, true, schliesse);
    await rendern(ziel, false, schliesse);
    await act(async () => { await Promise.resolve(); });
    expect(fenster.history.back).toHaveBeenCalledTimes(1);

    await rendern(ziel, true, schliesse); // der Nutzer öffnet sofort wieder
    popstateFeuern(); // das verspätete popstate des eigenen back()
    expect(schliesse).not.toHaveBeenCalled();
    // …und das Blatt hat wieder seinen Eintrag (Marke), damit die Zurück-Geste es schliesst.
    expect((fenster.history.state as Record<string, unknown>).lmErlassBlatt).toBe(true);
    expect(fenster.history.pushState).toHaveBeenCalledTimes(2);

    // Danach schliesst eine ECHTE Zurück-Geste wieder (der eigene Rücksprung ist verbraucht).
    await act(async () => { vi.advanceTimersByTime(0); });
    popstateFeuern();
    expect(schliesse).toHaveBeenCalledTimes(1);
  });

  it('E-D15-B01: kam das popstate des eigenen back() NIE (Navigation abgebrochen), zählt die nächste echte Zurück-Geste nach dem Notnetz wieder', async () => {
    const { ziel, fenster, popstateFeuern } = aufbauen();
    (fenster.history.back as ReturnType<typeof vi.fn>).mockImplementation(() => {});
    const schliesse = vi.fn();
    await rendern(ziel, true, schliesse);
    await rendern(ziel, false, schliesse);
    await act(async () => { await Promise.resolve(); });
    await act(async () => { vi.advanceTimersByTime(10_000); });
    await rendern(ziel, true, schliesse);
    popstateFeuern();
    expect(schliesse).toHaveBeenCalledTimes(1);
  });

  it('E-D15-B01: Gegenprobe — normales Schliessen (popstate des eigenen back() kommt VOR dem Öffnen) lässt das nächste Blatt unberührt', async () => {
    const { ziel, fenster, popstateFeuern } = aufbauen();
    (fenster.history.back as ReturnType<typeof vi.fn>).mockImplementation(() => {});
    const schliesse = vi.fn();
    await rendern(ziel, true, schliesse);
    await rendern(ziel, false, schliesse);
    await act(async () => { await Promise.resolve(); });
    popstateFeuern(); // eigenes back() fertig, kein Hörer mehr aktiv
    await act(async () => { vi.advanceTimersByTime(0); });
    await rendern(ziel, true, schliesse);
    expect(fenster.history.pushState).toHaveBeenCalledTimes(2); // frischer Eintrag
    expect(schliesse).not.toHaveBeenCalled();
    popstateFeuern(); // echte Geste
    expect(schliesse).toHaveBeenCalledTimes(1);
  });

  it('Zurück-Geste schliesst, ohne selbst history.back() zu rufen (der Eintrag ist schon weg)', async () => {
    const { ziel, fenster, popstateFeuern } = aufbauen();
    let offen = true;
    const schliesse = vi.fn(() => { offen = false; });
    await rendern(ziel, true, schliesse);
    popstateFeuern();
    await rendern(ziel, offen, schliesse);
    await act(async () => { await Promise.resolve(); });
    expect(schliesse).toHaveBeenCalledTimes(1);
    expect(fenster.history.back).not.toHaveBeenCalled();
  });
});
