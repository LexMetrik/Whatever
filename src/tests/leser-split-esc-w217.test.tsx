// @vitest-environment node
/**
 * W2·17-UI-BEFUNDE · F1-B02 (Nachzug Gegenprüfung #1275) — Esc im Split:
 * ECHTE Effekt-Ausführung von `usePopoverAutoZu` (linkedom + `createRoot` + `act`).
 *
 *  (1) Modus «fest» (Blatt neben dem Text, keine Falle): Esc schliesst nur, wenn
 *      kein MODALER Dialog offen ist (er nimmt das Esc selbst) UND das Pane des
 *      Blatts den Tastendruck beansprucht.
 *  (2) Modus «blatt»/«popover» (mit Falle, über `useDialogFokus`): liegt ein
 *      späterer modaler Dialog darüber (Norm-Popover am `body`), schliesst Esc
 *      die Fläche DAHINTER nicht mit — der Weg über Handy-Sheet und
 *      Ansicht-Popover, den der erste Wurf von #1275 offen liess.
 *
 * Jeder Fall hat seinen Gegenfall («ohne Hindernis schliesst Esc»): ohne ihn
 * wäre die Sperre ein Tor, das nicht scheitern kann (§6.7).
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { parseHTML } from 'linkedom';

type GlobalPatch = Record<string, unknown>;

async function umgebung() {
  vi.resetModules();
  const { window, document } = parseHTML(`<!doctype html><html><body>
    <div id="zeile">
      <main data-pane="primaer"><button id="knopf-p">p</button></main>
      <section data-pane="sekundaer"><p id="text-s">s</p></section>
      <div id="wurzel"></div>
    </div>
  </body></html>`);
  (globalThis as GlobalPatch).window = window;
  (globalThis as GlobalPatch).document = document;
  (globalThis as GlobalPatch).IS_REACT_ACT_ENVIRONMENT = true;
  // linkedom kennt weder `focus()` noch `activeElement` — beides minimal nachgebildet.
  let aktiv: unknown = document.body;
  const setzeAktiv = (el: unknown) => { aktiv = el; };
  (window.HTMLElement.prototype as unknown as { focus: () => void }).focus = function focus(this: unknown) { setzeAktiv(this); };
  Object.defineProperty(document, 'activeElement', { get: () => aktiv, configurable: true });

  const React = await import('react');
  const { createRoot } = await import('react-dom/client');
  const { act } = React as unknown as { act: (fn: () => void | Promise<void>) => Promise<void> };
  const { usePopoverAutoZu } = await import('../pages/gesetz-leser/v3/usePopoverAutoZu');

  /** `dialogUmPanel`: so ist das Handy-Sheet gebaut (`LeserPanelZone`) — das
   *  `role="dialog"`-Element UMSCHLIESST das Panel, `panelRef` ist sein KIND. */
  function Blatt({ modus, rolle, onZu, dialogUmPanel }: { modus: 'fest' | 'blatt'; rolle: 'primaer' | 'sekundaer'; onZu: () => void; dialogUmPanel: boolean }) {
    const wrapRef = React.useRef<HTMLDivElement | null>(null);
    const panelRef = React.useRef<HTMLDivElement | null>(null);
    usePopoverAutoZu({ offen: true, schliesse: onZu, wrapRef, panelRef, modus, aussenAusnahme: '[data-oeffner]' });
    const dialog = { role: 'dialog', 'aria-modal': 'true' };
    const panel = React.createElement('div', {
      ref: panelRef, tabIndex: -1, 'data-v3-panel': '',
      ...(modus === 'blatt' && !dialogUmPanel ? dialog : {}),
    });
    return React.createElement('div', { ref: wrapRef, 'data-v3-pane': rolle },
      dialogUmPanel ? React.createElement('div', dialog, panel) : panel);
  }

  const mounte = async (modus: 'fest' | 'blatt', rolle: 'primaer' | 'sekundaer', dialogUmPanel = false) => {
    const onZu = vi.fn();
    const root = createRoot(document.getElementById('wurzel') as unknown as Element);
    await act(async () => { root.render(React.createElement(Blatt, { modus, rolle, onZu, dialogUmPanel })); });
    return { onZu, root, act };
  };
  const druecke = () => {
    const e = new window.Event('keydown');
    Object.assign(e, { key: 'Escape' });
    window.dispatchEvent(e);
  };
  // Ein Klick im Browser: pointerdown, danach nimmt das Ziel (bzw. sein fokussierbarer
  // Vorfahr, hier das Ziel selbst) den Fokus.
  const klick = (id: string) => {
    const el = document.getElementById(id) as unknown as HTMLElement;
    el.dispatchEvent(new window.Event('pointerdown', { bubbles: true }));
    el.focus();
    el.dispatchEvent(new window.Event('focusin', { bubbles: true }));
  };
  const modal = (id: string) => {
    const d = document.createElement('div');
    d.id = id;
    d.setAttribute('role', 'dialog');
    d.setAttribute('aria-modal', 'true');
    document.body.appendChild(d);
    return d;
  };
  return { mounte, druecke, klick, modal, document };
}

afterEach(() => {
  delete (globalThis as GlobalPatch).window;
  delete (globalThis as GlobalPatch).document;
  delete (globalThis as GlobalPatch).IS_REACT_ACT_ENVIRONMENT;
});

describe('Esc · Modus «fest» (Blatt neben dem Text)', () => {
  it('ohne Hindernis schliesst Esc das Blatt des aktiven Panes', async () => {
    const u = await umgebung();
    const b = await u.mounte('fest', 'sekundaer');
    u.klick('text-s');
    u.druecke();
    expect(b.onZu).toHaveBeenCalledTimes(1);
  });

  it('ein offener MODALER Dialog nimmt das Esc selbst — das Blatt dahinter bleibt', async () => {
    const u = await umgebung();
    const b = await u.mounte('fest', 'sekundaer');
    u.klick('text-s');
    const d = u.modal('hilfe');
    u.druecke();
    expect(b.onZu, 'Esc schloss das Blatt trotz modalem Dialog darüber').not.toHaveBeenCalled();
    d.remove();
    u.druecke();
    expect(b.onZu, 'Gegenfall: ohne Dialog schliesst Esc').toHaveBeenCalledTimes(1);
  });

  it('das Blatt des NICHT aktiven Panes bleibt stehen (Pane-Gating)', async () => {
    const u = await umgebung();
    const b = await u.mounte('fest', 'sekundaer');
    u.klick('knopf-p'); // zuletzt benutzt: primär
    u.druecke();
    expect(b.onZu, 'das sekundäre Blatt schloss, obwohl das primäre Pane aktiv ist').not.toHaveBeenCalled();
    u.klick('text-s');
    u.druecke();
    expect(b.onZu, 'Gegenfall: im eigenen Pane schliesst Esc').toHaveBeenCalledTimes(1);
  });
});

describe('Esc · Modus «blatt» (modal, Fokus-Falle über useDialogFokus)', () => {
  it('ohne Hindernis schliesst Esc das Blatt', async () => {
    const u = await umgebung();
    const b = await u.mounte('blatt', 'primaer');
    u.druecke();
    expect(b.onZu).toHaveBeenCalledTimes(1);
  });

  it('Handy-Sheet: das Panel ist ein KIND des modalen Dialogs — Esc schliesst es (Rückschritt der ersten Fassung)', async () => {
    const u = await umgebung();
    const b = await u.mounte('blatt', 'primaer', true);
    u.druecke();
    expect(b.onZu, 'das Sheet hielt sich selbst für überdeckt und verschluckte Esc').toHaveBeenCalledTimes(1);
  });

  it('Handy-Sheet mit Norm-Popover darüber: erst das Popover, dann das Sheet', async () => {
    const u = await umgebung();
    const b = await u.mounte('blatt', 'primaer', true);
    const popover = u.modal('norm-popover');
    u.druecke();
    expect(b.onZu).not.toHaveBeenCalled();
    popover.remove();
    u.druecke();
    expect(b.onZu).toHaveBeenCalledTimes(1);
  });

  it('ein Norm-Popover (späterer modaler Dialog) über dem Blatt: Esc lässt das Blatt stehen', async () => {
    const u = await umgebung();
    const b = await u.mounte('blatt', 'primaer');
    const popover = u.modal('norm-popover');
    u.druecke();
    expect(b.onZu, 'Esc schloss Popover UND Blatt dahinter').not.toHaveBeenCalled();
    popover.remove();
    u.druecke();
    expect(b.onZu, 'Gegenfall: nach dem Popover schliesst das nächste Esc das Blatt').toHaveBeenCalledTimes(1);
  });
});
