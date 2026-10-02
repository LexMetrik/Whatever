/**
 * W2·17-UI-BEFUNDE E5-B01 — die Weiche `istUebernehmbar` im Datumsfeld des
 * Zeitstrahls, am ECHTEN Feld getestet (Prüfer-Befund 2.10.2026, §6.7).
 *
 * `istUebernehmbar` selbst hat Unit-Tests (`leser-entscheide-filter.test.tsx`).
 * Sie bleiben aber grün, wenn jemand die Weiche im `onChange` des Feldes
 * zurückbaut (`onWert(v)` ohne Prüfung) — und genau dort sass der Fehler:
 * die Zwischenstufe «0002-…» beim Tippen des Jahres ging in den Bereich. Darum
 * hier React-Dev-Build in ein linkedom-DOM (Stil `begruessung-strictmode`):
 * ein Zwischenwert erreicht `onBereich` NICHT, ein volles Jahr schon.
 *
 * ── WARUM DAS DOM VOR DEN IMPORTS STEHT (`vi.hoisted`) ───────────────────────
 * React entscheidet beim LADEN von `react-dom/client`, ob es `onChange` über das
 * `input`-Ereignis speist (`'oninput' in document`). linkedom kennt die
 * Eigenschaft nicht: ohne sie fällt React auf einen IE-Pfad zurück
 * (`selectionchange`/`attachEvent`), und `onChange` feuert nie — der Test wäre
 * dann für BEIDE Fälle grün/rot aus dem falschen Grund. Darum Fenster und
 * Dokument vor den Importen setzen und `oninput` anlegen. Die Positivprobe
 * («2023 wird übernommen») beweist, dass das Ereignis ankommt, bevor die
 * Negativprobe etwas aussagt.
 */
import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { BezugZeitWahl } from '../components/verzahnung/BezugZeitWahl';
import { OFFENER_BEREICH, baueJahresHistogramm } from '../pages/gesetz-leser/bezugZeit';

const dom = await vi.hoisted(async () => {
  const { parseHTML } = await import('linkedom');
  const r = parseHTML('<!doctype html><html><body><div id="app"></div></body></html>');
  (r.document as unknown as Record<string, unknown>).oninput = null;
  Object.assign(globalThis, {
    window: { document: r.document },
    document: r.document,
    IS_REACT_ACT_ENVIRONMENT: true,
  });
  return r;
});

let root: Root | null = null;

afterEach(async () => {
  if (!root) return;
  const r = root;
  root = null;
  await act(async () => r.unmount());
});

async function aufbauen(onBereich: (von: string, bis: string) => void) {
  const ziel = dom.document.getElementById('app') as unknown as HTMLElement;
  root = createRoot(ziel);
  const histogramm = baueJahresHistogramm(['2018-01-01', '2021-02-02']);
  await act(async () => {
    root!.render(createElement(BezugZeitWahl, { bereich: OFFENER_BEREICH, histogramm, onBereich }));
  });
  return dom.document.querySelector('input[data-zeit-feld="von"]') as unknown as HTMLInputElement;
}

/** Tippen: Wert am Prototyp setzen (React beobachtet `value` am Feld-Objekt
 *  selbst; eine Zuweisung dort liefe am Beobachter vorbei) und `input` auslösen. */
async function tippe(feld: HTMLInputElement, wert: string) {
  await act(async () => {
    Object.getOwnPropertyDescriptor(Object.getPrototypeOf(feld), 'value')!.set!.call(feld, wert);
    feld.dispatchEvent(new (dom.document.defaultView as unknown as { Event: typeof Event }).Event('input', { bubbles: true }));
  });
}

describe('E5-B01 · Datumsfeld: die Weiche sitzt im Feld, nicht nur in der Funktion', () => {
  it('ein volles Jahr («2023-03-11») wird übernommen — das Ereignis kommt an', async () => {
    const onBereich = vi.fn();
    const feld = await aufbauen(onBereich);
    await tippe(feld, '2023-03-11');
    expect(onBereich).toHaveBeenCalledWith('2023-03-11', '');
  });

  it('eine Jahr-Zwischenstufe («0002-03-11») erreicht onBereich NICHT', async () => {
    const onBereich = vi.fn();
    const feld = await aufbauen(onBereich);
    await tippe(feld, '0002-03-11');
    expect(onBereich).not.toHaveBeenCalled();
  });
});
