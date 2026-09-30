/**
 * W2·19-DESIGN-KONSISTENZ · Bündel DK-B (HN-D5 / Befund DK-05, DK-21, DK-27) —
 * Leer-, Lade- und Fehlerzustände der Start-Blätter aus den Hausbausteinen.
 *
 * Vorher (Stand main 4ae286c88, 30.9.2026; `leerzustand-d7` Abschnitt (4) war
 * damit rot, 6 Stellen): die Blätter zeichneten alle drei Zustände von Hand —
 * «Kein X passt auf «q».» in ink-600/-700 ohne Weiterweg, den Ladezustand als
 * nackten Absatz, den Ladefehler als ink-700-Absatz. Hier bewacht wird das
 * VERHALTEN am echten React-Render (linkedom, Stil `gesetze-blatt-suche-u11`):
 *   (1) Bausteine: `BlattLaedt` = Ladeanzeige | FehlerBox | Inhalt; der Fehler
 *       nennt sich nicht «Eingabefehler».
 *   (2) Filter ohne Treffer ⇒ `Leerzustand art="filter"` mit dem Weiterweg, und
 *       der Weiterweg WIRKT (Suche/Filter zurück, Liste wieder da) — Werkzeuge
 *       (Rechner, Vorlagen), Gesetze (Wahl, Gebiet), Materialien, Rechtsprechung.
 *   (3) Status «in Vorbereitung» im Werkzeuge-Blatt ist die Marke
 *       `lc-badge-geplant` mit dem Kanon-Wortlaut.
 *   (4) Laden und Fehler der drei Sammlungs-Blätter laufen über die Bausteine.
 *
 * ROT ZU BEKOMMEN: in `WerkzeugeBlatt.tsx` den `<Leerzustand …>` wieder durch
 * `<p>Kein Rechner passt auf …</p>` ersetzen → (2) rot; `BlattLaedt` in
 * `BlattBausteine.tsx` wieder auf einen nackten `<p>` → (1)/(4) rot.
 */
import { act, createElement, type ReactElement } from 'react';
import type { Root } from 'react-dom/client';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { parseHTML } from 'linkedom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { BlattLaedt } from '../components/start/BlattBausteine';
import { FehlerBox } from '../components/vorlagen/ui';
import type { BrowseErlass } from '../lib/normtext/browse-typen';

// ─── (1) Bausteine ──────────────────────────────────────────────────────────
describe('DK-B (1) — BlattLaedt: Ladeanzeige | FehlerBox | Inhalt', () => {
  const rendere = (laedt: boolean, fehler: boolean) => renderToStaticMarkup(
    <BlattLaedt laedt={laedt} fehler={fehler} ladetext="Erlasse werden geladen …" fehlertext="Die Sammlung konnte nicht geladen werden.">
      {() => <p>INHALT</p>}
    </BlattLaedt>,
  );

  it('lädt: die eine Ladeanzeige (Ablesekante + Text, role=status)', () => {
    const out = rendere(true, false);
    expect(out).toContain('role="status"');
    expect(out).toContain('scale-rule');
    expect(out).toContain('Erlasse werden geladen …');
    expect(out).not.toContain('INHALT');
  });

  it('Fehler: die Haus-Fehlerbox (role=alert, lc-notice-danger), nicht «Eingabefehler»', () => {
    const out = rendere(false, true);
    expect(out).toContain('role="alert"');
    expect(out).toContain('lc-notice-danger');
    expect(out).toContain('Laden fehlgeschlagen');
    expect(out).toContain('Die Sammlung konnte nicht geladen werden.');
    expect(out).not.toContain('Eingabefehler');
    expect(out).not.toContain('INHALT');
  });

  it('Fehler gewinnt vor Laden; bereit zeigt den Inhalt ohne Rahmen', () => {
    expect(rendere(true, true)).toContain('lc-notice-danger');
    const bereit = rendere(false, false);
    expect(bereit).toContain('INHALT');
    expect(bereit).not.toContain('scale-rule');
    expect(bereit).not.toContain('lc-notice');
  });

  it('FehlerBox: Vorgabe-Titel bleibt «Eingabefehler» (alle Formulare unverändert)', () => {
    expect(renderToStaticMarkup(<FehlerBox fehler={['Betrag fehlt.']} />)).toContain('Eingabefehler');
  });
});

// ─── Harness (Stil gesetze-blatt-suche-u11) ─────────────────────────────────
let root: Root | null = null;
let Ev: typeof Event;

const erlass = (p: Partial<BrowseErlass> & Pick<BrowseErlass, 'key' | 'kuerzel' | 'titel'>): BrowseErlass => ({
  ebene: 'bund', kanton: null, sr: null, rechtsgebiet: 'privatrecht', sprache: 'de', rang: 1, status: 'snapshot',
  datei: null, artikelAnzahl: 0, stand: '2026-01-01', quelleUrl: 'https://www.fedlex.admin.ch/', fassungsToken: '', pdfPfad: null,
  ...p,
} as BrowseErlass);

function aufbauen(antwort: (url: string) => Promise<unknown>): HTMLElement {
  const { document, Event: E } = parseHTML('<!doctype html><html><body><div id="app"></div></body></html>');
  Ev = E as unknown as typeof Event;
  (document as unknown as { oninput: null }).oninput = null;
  vi.stubGlobal('window', {
    document, location: { pathname: '/' }, setTimeout: globalThis.setTimeout, clearTimeout: globalThis.clearTimeout,
    matchMedia: () => ({ matches: false, addEventListener() {}, removeEventListener() {} }),
  });
  vi.stubGlobal('document', document);
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  vi.stubGlobal('fetch', vi.fn(async (u: unknown) => antwort(String(u))));
  return document.getElementById('app') as unknown as HTMLElement;
}
const ok = (daten: unknown) => ({ ok: true, status: 200, json: async () => daten }) as unknown as Response;
const nichtOk = { ok: false, status: 500, json: async () => ({}) } as unknown as Response;

async function zeige(ziel: HTMLElement, bau: () => Promise<ReactElement>) {
  const { createRoot } = await import('react-dom/client');
  const el = await bau();
  root = createRoot(ziel);
  await act(async () => { root!.render(createElement(MemoryRouter, null, el)); });
  await act(async () => { await new Promise((r) => setTimeout(r, 0)); });
}

const feld = (ziel: HTMLElement) => ziel.querySelector('input[type="search"]') as HTMLInputElement;
async function tippe(ziel: HTMLElement, wert: string) {
  const f = feld(ziel);
  const setter = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(f), 'value')?.set;
  if (setter) setter.call(f, wert); else f.value = wert;
  await act(async () => { f.dispatchEvent(new Ev('input', { bubbles: true })); });
  await act(async () => { await new Promise((r) => setTimeout(r, 0)); });
}
async function klickeKnopf(ziel: HTMLElement, name: string) {
  const k = [...ziel.querySelectorAll('button')].find((b) => b.textContent?.trim() === name) as unknown as HTMLElement;
  expect(k, `Knopf «${name}» fehlt`).toBeTruthy();
  await act(async () => { k.dispatchEvent(new Ev('click', { bubbles: true })); });
  await act(async () => { await new Promise((r) => setTimeout(r, 0)); });
}
const leer = (ziel: HTMLElement) => ziel.querySelector('[data-leerzustand]');
const leerText = (ziel: HTMLElement) => leer(ziel)?.textContent?.replace(/\s+/g, ' ').trim();

const HARNESS_AUFRAEUMEN = async () => {
  if (root) { const r = root; root = null; await act(async () => r.unmount()); }
  vi.unstubAllGlobals();
};

// ─── (2)/(3) Werkzeuge-Blatt ────────────────────────────────────────────────
describe('DK-B (2)/(3) — Werkzeuge-Blatt', () => {
  beforeEach(() => { vi.resetModules(); });
  afterEach(HARNESS_AUFRAEUMEN);
  const werkzeuge = (pfad: string[]) => async () => {
    const { WerkzeugeBlatt } = await import('../components/start/WerkzeugeBlatt');
    return createElement(WerkzeugeBlatt, { ort: { rubrik: 'werkzeuge', pfad }, gehe: () => {} });
  };

  for (const [zweig, label, satz] of [
    ['rechner', 'Rechner filtern', 'Kein Rechner gefunden.'],
    ['vorlagen', 'Vorlagen filtern', 'Keine Vorlage gefunden.'],
  ] as const) {
    it(`${zweig}: Filter ohne Treffer ⇒ Leerzustand «${satz}» + «Suche leeren» setzt die Suche zurück`, async () => {
      const ziel = aufbauen(async () => nichtOk);
      await zeige(ziel, werkzeuge([zweig]));
      expect(leer(ziel), 'ohne Suche kein Leerzustand').toBeNull();
      const vorher = ziel.querySelectorAll('section, h2, h3').length;
      expect(vorher).toBeGreaterThan(0);

      await tippe(ziel, 'zzzzq');
      expect(feld(ziel).value).toBe('zzzzq');
      expect(leer(ziel)?.getAttribute('data-leerzustand')).toBe('filter');
      expect(leerText(ziel)).toContain(satz);
      expect(leer(ziel)?.getAttribute('role'), 'Ansage für Vorlesehilfen').toBe('status');
      expect(leerText(ziel), 'kein alter Satzbau «passt auf»').not.toContain('passt auf');
      expect(label).toBeTruthy();

      await klickeKnopf(ziel, 'Suche leeren');
      expect(feld(ziel).value, 'der Weiterweg WIRKT').toBe('');
      expect(leer(ziel)).toBeNull();
      expect(ziel.querySelectorAll('section, h2, h3').length, 'Liste ist wieder da').toBe(vorher);
    });
  }

  it('«In Vorbereitung» in der Vorlagen-Wahl ist die Marke lc-badge-geplant, nie Klartext', async () => {
    const { KATALOG_KARTEN, istVerfuegbar } = await import('../lib/startseiteConfig');
    const { kartenDerKategorie } = await import('../lib/katalogKategorie');
    const { WERKZEUGE_VORLAGEN_GEBIETE } = await import('../lib/startBlatt');
    const vorl = kartenDerKategorie(KATALOG_KARTEN, 'vorlagen');
    const erwartet = WERKZEUGE_VORLAGEN_GEBIETE
      .filter((g) => vorl.filter((k) => k.rechtsgebiet === g.name).filter(istVerfuegbar).length === 0).length;
    // Negativ-Kontrolle: der Test sieht die Lage überhaupt (sonst wäre er leer grün).
    expect(erwartet, 'mindestens ein Rechtsgebiet ohne gebaute Vorlage').toBeGreaterThan(0);

    const ziel = aufbauen(async () => nichtOk);
    await zeige(ziel, werkzeuge([]));
    const marken = [...ziel.querySelectorAll('.lc-badge-geplant')];
    expect(marken.length).toBe(erwartet);
    for (const m of marken) expect(m.textContent).toBe('In Vorbereitung');
    // Kein Klartext-Rest in Kleinschreibung.
    const klartext = [...ziel.querySelectorAll('span')]
      .filter((s) => s.children.length === 0 && s.textContent === 'in Vorbereitung');
    expect(klartext).toHaveLength(0);
  });
});

// ─── Gesetze-Blatt ──────────────────────────────────────────────────────────
describe('DK-B (2)/(4) — Gesetze-Blatt', () => {
  beforeEach(() => { vi.resetModules(); });
  afterEach(HARNESS_AUFRAEUMEN);
  const gesetze = (pfad: string[]) => async () => {
    const { GesetzeBlatt } = await import('../components/start/GesetzeBlatt');
    return createElement(GesetzeBlatt, { ort: { rubrik: 'gesetze', pfad }, gehe: () => {} });
  };
  const REGISTER = { erlasse: [
    erlass({ key: 'OR', kuerzel: 'OR', titel: 'Obligationenrecht', sr: '220' }),
    erlass({ key: 'ZGB', kuerzel: 'ZGB', titel: 'Schweizerisches Zivilgesetzbuch', sr: '210' }),
  ] };
  const regFetch = (daten: unknown) => async (u: string) => (u.includes('/normtext/register.json') ? ok(daten) : nichtOk);

  it('Wahl: Suche ohne Treffer ⇒ Filter-Leere + «Suche leeren» bringt die Spalten zurück', async () => {
    const ziel = aufbauen(regFetch(REGISTER));
    await zeige(ziel, gesetze([]));
    expect(ziel.querySelector('ul[aria-label="Rechtsgebiete des Bundes"]')).toBeTruthy();
    await tippe(ziel, 'zzzzq');
    expect(ziel.querySelector('ul[aria-label="Rechtsgebiete des Bundes"]')).toBeNull();
    expect(leer(ziel)?.getAttribute('data-leerzustand')).toBe('filter');
    expect(leerText(ziel)).toContain('Kein Erlass gefunden.');
    expect(leerText(ziel)).not.toContain('passt auf');
    await klickeKnopf(ziel, 'Suche leeren');
    expect(feld(ziel).value).toBe('');
    expect(leer(ziel)).toBeNull();
    expect(ziel.querySelector('ul[aria-label="Rechtsgebiete des Bundes"]')).toBeTruthy();
  });

  it('Gebiet mit Suchtext: Filter-Leere mit Weiterweg; ohne Suchtext und ohne Erlasse: Bestands-Leere OHNE Knopf', async () => {
    // Register ohne ein einziges Privatrechts-Erlass-Schlüsselwort der Gruppen
    // von «02»: die Gebiets-Stufe ist leer, auch ohne Suche.
    const ziel = aufbauen(regFetch({ erlasse: [erlass({ key: 'XYZ', kuerzel: 'XYZ', titel: 'Unbekanntes Gesetz' })] }));
    await zeige(ziel, gesetze(['bund', '02']));
    expect(leer(ziel)?.getAttribute('data-leerzustand'), 'nichts da ⇒ bestand').toBe('bestand');
    expect(leer(ziel)?.querySelectorAll('button')).toHaveLength(0);
    expect(leerText(ziel)).toBe('Kein Erlass gefunden.');

    await tippe(ziel, 'zzzzq');
    expect(leer(ziel)?.getAttribute('data-leerzustand'), 'verdeckt ⇒ filter').toBe('filter');
    await klickeKnopf(ziel, 'Suche leeren');
    expect(feld(ziel).value).toBe('');
    expect(leer(ziel)?.getAttribute('data-leerzustand')).toBe('bestand');
  });

  it('Laden: die eine Ladeanzeige (role=status, Ablesekante) statt nacktem Absatz', async () => {
    const ziel = aufbauen(() => new Promise(() => {})); // Register hängt
    await zeige(ziel, gesetze([]));
    await tippe(ziel, 'or');
    const ladeanzeige = ziel.querySelector('[role="status"] .scale-rule')?.parentElement;
    expect(ladeanzeige, 'Ladeanzeige mit Ablesekante').toBeTruthy();
    expect(ladeanzeige!.textContent).toContain('Erlasse werden geladen …');
  });

  it('Fehler: Register nicht erreichbar ⇒ FehlerBox «Laden fehlgeschlagen», kein ink-700-Absatz', async () => {
    const ziel = aufbauen(async () => nichtOk);
    await zeige(ziel, gesetze([]));
    await tippe(ziel, 'or');
    const box = ziel.querySelector('[role="alert"]');
    expect(box, 'role=alert vorhanden').toBeTruthy();
    expect(box!.className).toContain('lc-notice-danger');
    expect(box!.textContent).toContain('Laden fehlgeschlagen');
    expect(box!.textContent).toContain('Die Gesetzessammlung konnte nicht geladen werden.');
    expect(ziel.querySelector('p.text-ink-700[role="alert"]')).toBeNull();
  });
});

// ─── Materialien- und Rechtsprechung-Blatt ──────────────────────────────────
describe('DK-B (2)/(4) — Materialien- und Rechtsprechung-Blatt', () => {
  beforeEach(() => { vi.resetModules(); });
  afterEach(HARNESS_AUFRAEUMEN);

  it('Materialien: leeres Register ⇒ Filter-Leere; «Filter zurücksetzen» setzt Suche UND Gattung zurück', async () => {
    const ziel = aufbauen(async (u) => (u.includes('/materialien/register.json') ? ok({ erzeugt: '2026-09-24', materialien: [] }) : nichtOk));
    await zeige(ziel, async () => {
      const { MaterialienBlatt } = await import('../components/start/MaterialienBlatt');
      return createElement(MaterialienBlatt);
    });
    await tippe(ziel, 'zzzzq');
    await klickeKnopf(ziel, 'Erläuterungen');
    expect(leer(ziel)?.getAttribute('data-leerzustand')).toBe('filter');
    expect(leerText(ziel)).toContain('Kein Material gefunden.');
    const gattung = (n: string) => [...ziel.querySelectorAll('[role="group"][aria-label="Gattung"] button')]
      .find((b) => b.textContent === n)!.getAttribute('aria-pressed');
    expect(gattung('Erläuterungen')).toBe('true');
    await klickeKnopf(ziel, 'Filter zurücksetzen');
    expect(feld(ziel).value).toBe('');
    expect(gattung('Alle')).toBe('true');
    expect(gattung('Erläuterungen')).toBe('false');
  });

  it('Rechtsprechung: «Filter zurücksetzen» löst auch die Schalter (Leitentscheide/Ebene)', async () => {
    const ziel = aufbauen(async (u) => (u.includes('/rechtsprechung/register.json') ? ok({ entscheide: [] }) : nichtOk));
    await zeige(ziel, async () => {
      const { RechtsprechungBlatt } = await import('../components/start/RechtsprechungBlatt');
      return createElement(RechtsprechungBlatt);
    });
    await klickeKnopf(ziel, 'Leitentscheide');
    await klickeKnopf(ziel, 'Kantonal');
    const gedrueckt = () => [...ziel.querySelectorAll('button[aria-pressed]')].map((b) => b.getAttribute('aria-pressed'));
    expect(gedrueckt()).toEqual(['true', 'false', 'true']);
    expect(leer(ziel)?.getAttribute('data-leerzustand')).toBe('filter');
    expect(leerText(ziel)).toContain('Kein Entscheid gefunden.');
    await klickeKnopf(ziel, 'Filter zurücksetzen');
    expect(gedrueckt()).toEqual(['false', 'false', 'false']);
  });

  it('Laden und Fehler laufen über die Bausteine (beide Blätter)', async () => {
    for (const [pfad, blatt] of [['/materialien/register.json', 'MaterialienBlatt'], ['/rechtsprechung/register.json', 'RechtsprechungBlatt']] as const) {
      vi.resetModules();
      // Laden
      let ziel = aufbauen(() => new Promise(() => {}));
      const bau = async () => {
        const m = await import(`../components/start/${blatt}`);
        return createElement(m[blatt] as never);
      };
      await zeige(ziel, bau);
      const la = ziel.querySelector('[role="status"] .scale-rule')?.parentElement;
      expect(la?.textContent, `${blatt} lädt`).toContain('Die Sammlung wird abgerufen …');
      await HARNESS_AUFRAEUMEN();
      // Fehler
      vi.resetModules();
      ziel = aufbauen(async (u) => (u.includes(pfad) ? nichtOk : nichtOk));
      await zeige(ziel, bau);
      const box = ziel.querySelector('[role="alert"]');
      expect(box?.className, `${blatt} Fehler`).toContain('lc-notice-danger');
      expect(box?.textContent).toContain('Laden fehlgeschlagen');
      await HARNESS_AUFRAEUMEN();
    }
  });
});
