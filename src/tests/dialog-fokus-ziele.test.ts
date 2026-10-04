// W2·17-UI-BEFUNDE · PE-H1-D01/D02 + Erlass-Blatt-Falle — Kandidatenauswahl der
// geteilten Dialog-Fokus-Falle (`useDialogFokus`).
//
// Der Befund (1.10.2026): Gliederungs-Sheet (<1024 px) und Erlass-Blatt (375/768 px)
// zählten die drei Links der ZUGEKLAPPTEN Übersichts-Box (`<details>`) als
// Fokusziele — in Chromium bleibt ihr `offsetParent` ungleich null (Inhalt ist
// `content-visibility`-versteckt), `focus()` wirkt aber nicht. Tab landete 5×
// im Suchfeld bzw. auf «schliessen»: eine Tastaturfalle. Gleichzeitig fehlte
// `<summary>` in der Selektor-Liste, die Klappe war per Tab nicht erreichbar.
//
// Läuft in linkedom (echtes DOM ohne Layout). Die LAYOUT-Frage («ist das Element
// gezeichnet?») ist darum als Parameter `sichtbar` austauschbar; der Standard
// (`layoutSichtbar`) wird separat mit Attrappen geprüft, und die echte Tab-Taste
// im echten Chromium bewacht `e2e/leser-dialog-fokus.e2e.ts`.
import { describe, it, expect } from 'vitest';
import { parseHTML } from 'linkedom';
import { fokusziele, layoutSichtbar } from '../components/layout/useDialogFokus';

const ALLES_SICHTBAR = () => true;

function dialog(html: string) {
  const { document } = parseHTML(`<!doctype html><html><body><div id="d">${html}</div></body></html>`);
  const wurzel = document.getElementById('d') as unknown as HTMLElement;
  const q = (s: string) => wurzel.querySelector(s) as HTMLElement;
  return { wurzel, q };
}

const namen = (l: HTMLElement[]) => l.map((e) => e.getAttribute('id') ?? e.tagName);

describe('fokusziele — geschlossene <details>', () => {
  const BOX = (offen: boolean) => `
    <button id="zu">schliessen</button>
    <input id="suche">
    <details${offen ? ' open' : ''}>
      <summary id="sum">Übersicht</summary>
      <p><a id="l1" href="/a">Amtlich</a> <a id="l2" href="/b">PDF</a></p>
      <p><a id="l3" href="/c">Rohdaten</a></p>
    </details>
    <button id="baum">Baum</button>`;

  it('PE-H1-D01: Links in ZUGEKLAPPTER Box sind keine Fokusziele (nur <summary>)', () => {
    const { wurzel } = dialog(BOX(false));
    expect(namen(fokusziele(wurzel, null, ALLES_SICHTBAR))).toEqual(['zu', 'suche', 'sum', 'baum']);
  });

  it('PE-H1-D02: <summary> ist ein Fokusziel, in DOM-Reihenfolge vor den Links', () => {
    const { wurzel } = dialog(BOX(true));
    expect(namen(fokusziele(wurzel, null, ALLES_SICHTBAR)))
      .toEqual(['zu', 'suche', 'sum', 'l1', 'l2', 'l3', 'baum']);
  });

  it('verschachtelt: offene Box in zugeklappter Aussenbox bleibt unerreichbar', () => {
    const { wurzel } = dialog(`
      <details><summary id="aussen">aussen</summary>
        <details open><summary id="innen">innen</summary><a id="x" href="/x">x</a></details>
      </details>`);
    expect(namen(fokusziele(wurzel, null, ALLES_SICHTBAR))).toEqual(['aussen']);
  });

  it('verschachtelt: zugeklappte Innenbox in offener Aussenbox zeigt nur ihr <summary>', () => {
    const { wurzel } = dialog(`
      <details open><summary id="aussen">aussen</summary>
        <details><summary id="innen">innen</summary><a id="x" href="/x">x</a></details>
        <a id="y" href="/y">y</a>
      </details>`);
    expect(namen(fokusziele(wurzel, null, ALLES_SICHTBAR))).toEqual(['aussen', 'innen', 'y']);
  });

  it('das gerade fokussierte Element bleibt Kandidat (auch wenn die Layout-Prüfung es ausschliesst)', () => {
    const { wurzel, q } = dialog('<button id="a">a</button><button id="b">b</button>');
    const aktiv = q('#b');
    expect(namen(fokusziele(wurzel, aktiv, (e) => e !== aktiv && e.id !== 'a'))).toEqual(['b']);
  });

  it('inert-Teilbäume und disabled-Knöpfe sind keine Fokusziele', () => {
    const { wurzel } = dialog(`
      <button id="a">a</button><button id="b" disabled>b</button>
      <div inert><button id="c">c</button></div>
      <input id="d" disabled><a id="e" href="/e">e</a>`);
    expect(namen(fokusziele(wurzel, null, ALLES_SICHTBAR))).toEqual(['a', 'e']);
  });

  it('die Layout-Prüfung wird auf jedes Kandidaten-Element angewandt', () => {
    const { wurzel } = dialog('<button id="a">a</button><button id="b">b</button><button id="c">c</button>');
    expect(namen(fokusziele(wurzel, null, (e) => e.id !== 'b'))).toEqual(['a', 'c']);
  });
});

describe('layoutSichtbar — Standard-Prüfung', () => {
  const att = (teile: Record<string, unknown>) => teile as unknown as HTMLElement;

  it('nutzt checkVisibility, wenn vorhanden — auch bei offsetParent === null (position: fixed)', () => {
    expect(layoutSichtbar(att({ checkVisibility: () => true, offsetParent: null }))).toBe(true);
    expect(layoutSichtbar(att({ checkVisibility: () => false, offsetParent: {} }))).toBe(false);
  });

  it('fragt visibility: hidden mit ab (visibilityProperty)', () => {
    let arg: unknown;
    layoutSichtbar(att({ checkVisibility: (o: unknown) => { arg = o; return true; } }));
    expect(arg).toMatchObject({ visibilityProperty: true });
  });

  it('Fallback ohne checkVisibility: offsetParent', () => {
    expect(layoutSichtbar(att({ offsetParent: {} }))).toBe(true);
    expect(layoutSichtbar(att({ offsetParent: null }))).toBe(false);
  });
});
