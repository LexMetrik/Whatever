// ─── S0 · Flächen-Ratsche über die Rest-Flächen (W2·29-WERKBANK-REST) ────────
//
// ZWECK: Die Scheiben S1 (Entscheid-Leser), S2 (Materialien) und S3 (statische
// Seiten) sind Design-Umzüge (FAHRPLAN-WERKBANK-UMBAU §5f). Nach §6 ist die
// Verhaltensgleichheit zu BEWEISEN — diese Ratsche friert je Route die SICHTBARE
// Fläche ein, die ein reines Umziehen nicht ändern darf:
//   · Titel (h1), Overline(s), Zwischentitel h2/h3 in Dokument-Reihenfolge,
//   · Knöpfe und Reiter (Text, sonst aria-label) in Dokument-Reihenfolge,
//   · Links (Text → Ziel), Klappkästen (`summary`), Formular-Beschriftungen,
//   · Status-Etiketten (Badges, `role="img"` mit aria-label),
//   · Quell-/Stand-Angaben (innerste Blöcke mit Stand/Quelle/Fassung/abgerufen),
//   · Leer-/Fehler-/Live-Zustände (`data-leerzustand`, role status/alert, aria-live).
// KEINE CSS-Klassen im Soll — Klassen dienen nur als Selektor (Overline, Badge).
//
// ROUTEN: die Rest-Routen stehen bewusst NICHT im Routen-Manifest
// (`routesManifest.ts`, Kopfkommentar: statische Seiten + 404 sind Sonderrouten),
// sondern in `RouteSwitch.tsx`. Die Ratsche rendert darum den ECHTEN Routen-Baum
// (`<RouteSwitch />`) je Adresse — eine umbenannte oder gestrichene Route zeigt
// sich als 404-Fläche im Diff. Repräsentatives Material: die Botschaft
// BOTSCHAFT-1999-1_4983_4601_4303 — Botschaft ist die Kern-Gattung der Rubrik
// (409 von 1684 Einträgen, nach Vernehmlassungen die zweitgrösste), der Fall
// trägt Nummer, Fundstelle, drei Norm-Keys (→ Kontext «Wendet an» / «Wird zitiert
// von») und einen Hinweis; seine Anker-Datei fehlt (404) — der Normalfall.
// Entscheide (drei Typen): bge_149_IV_213 (BGE-Leitentscheid, amtliche Regeste
// DE/FR/IT, öffnet im Auszug), bger_12T_3_2025 (BGer-Urteil ohne Regeste,
// Unter-Erwägungen, Dispositiv), bs_appellationsgericht_BEZ.2024.66 (kantonal,
// Sachverhalt + Normbezüge). Dazu die zwei Fehlzustände «nicht im Bestand».
//
// GELADENER ZUSTAND statt Erst-Render (Abweichung zu R0, begründet): Materialien,
// Material-Leser, Deckung und Entscheid-Leser laden per `useEffect` + `fetch`.
// Ein `prerenderToNodeStream` (R0) sähe nur den Ladehinweis — die Fläche, die
// S1/S2 umziehen, entstünde nie. Die Ratsche mountet deshalb mit
// `react-dom/client` auf ein linkedom-Dokument (Muster
// materialien-blatt-gattung.test.tsx), beantwortet jeden `fetch` aus der
// eingefrorenen Fixture und wartet, bis keine Anfrage offen ist UND das Markup
// fünf Takte stabil bleibt. Browser-APIs, die linkedom nicht kennt (rAF,
// matchMedia, Observer, Storage, location/history), sind neutral gestubbt.
//
// DATEN EINGEFROREN: `fixtures/rest-flaechen/netz.json` (URL → JSON, null = 404;
// Extraktion 25.9.2026 aus public/, Auswahl im `_meta`). Daten-Nachzüge kippen die
// Ratsche darum nicht. Jede Anfrage ausserhalb der Fixture ist rot, jede
// Fixture-Antwort muss mindestens einmal angefragt werden (keine toten Daten).
// Der Zähler `STARTSEITE_ZAEHLER.materialien` (Generat, wandert mit jedem
// Register-Lauf) ist auf den Stand 25.9.2026 festgesetzt.
// UHR: fest auf den 7.10.2026, 12:00 (nur `Date`) — die Verfalls-Übersicht auf
// /methodik rechnet gegen «heute».
//
// SOLL: src/tests/fixtures/rest-flaechen.json, erzeugt mit
// `REST_FLAECHEN_SCHREIBEN=1 npx vitest run src/tests/rest-flaechen-ratsche.test.tsx`.
// Ohne die Variable ist der Test streng: jede Abweichung ist rot. Neu erzeugen
// ist eine deklarierte Änderung (§6.3) und steht begründet im auslösenden Commit.
//
// Rot-Beweis (§6.7): siehe PR-Body.
import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { act, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { parseHTML } from 'linkedom';
import { LocaleProvider } from '../components/locale';
import { RouteSwitch } from '../RouteSwitch';

vi.mock('../data/startseiteZaehler.generated', async (original) => {
  const o = await original<typeof import('../data/startseiteZaehler.generated')>();
  return { ...o, STARTSEITE_ZAEHLER: { ...o.STARTSEITE_ZAEHLER, materialien: 1684 } };
});

const FIXTURE = join(__dirname, 'fixtures', 'rest-flaechen.json');
const NETZ: Record<string, unknown> = JSON.parse(
  readFileSync(join(__dirname, 'fixtures', 'rest-flaechen', 'netz.json'), 'utf8'),
).antworten;
const SCHREIBEN = process.env.REST_FLAECHEN_SCHREIBEN === '1';

const ROUTEN = [
  '/materialien',
  '/materialien/BOTSCHAFT-1999-1_4983_4601_4303',
  '/materialien/deckung',
  '/methodik',
  '/ueber',
  '/kontakt',
  '/datenschutz',
  '/gibt-es-nicht',                                   // 404 (Catch-all)
  '/rechtsprechung/bge_149_IV_213',
  '/rechtsprechung/bger_12T_3_2025',
  '/rechtsprechung/bs_appellationsgericht_BEZ.2024.66',
  '/materialien/GIBT-ES-NICHT',                       // Fehlzustand Material
  '/rechtsprechung/gibt_es_nicht',                    // Fehlzustand Entscheid
];

interface Flaeche {
  titel: string[];
  overline: string[];
  ueberschriften: string[];
  knoepfe: string[];
  links: string[];
  klappen: string[];
  beschriftungen: string[];
  etiketten: string[];
  quelleStand: string[];
  zustaende: string[];
}

const txt = (el: Element | null | undefined): string => (el?.textContent ?? '').replace(/\s+/g, ' ').trim();
const name = (el: Element): string => txt(el) || el.getAttribute('aria-label') || el.getAttribute('title') || '';

const angefragt = new Set<string>();
const fremd: string[] = [];

async function rendere(href: string): Promise<Element> {
  const { document, window } = parseHTML('<!doctype html><html><head></head><body><div id="app"></div></body></html>');
  const speicher = () => {
    const m = new Map<string, string>();
    return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => { m.set(k, String(v)); }, removeItem: (k: string) => { m.delete(k); }, clear: () => m.clear(), key: () => null, length: 0 };
  };
  class Beobachter { observe() {} unobserve() {} disconnect() {} takeRecords() { return []; } }
  const browser = {
    requestAnimationFrame: (f: FrameRequestCallback) => globalThis.setTimeout(() => f(0), 0) as unknown as number,
    cancelAnimationFrame: (id: number) => globalThis.clearTimeout(id),
    matchMedia: (q: string) => ({ matches: false, media: q, onchange: null, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {}, dispatchEvent: () => false }),
    IntersectionObserver: Beobachter, ResizeObserver: Beobachter, scrollTo() {}, scrollBy() {},
    localStorage: speicher(), sessionStorage: speicher(),
    location: new URL(`https://lexmetrik.ch${href}`),
    history: { state: null, length: 1, replaceState() {}, pushState() {}, back() {}, forward() {}, go() {} },
  };
  for (const [k, v] of Object.entries(browser)) vi.stubGlobal(k, v);
  vi.stubGlobal('window', Object.assign(window, browser, { setTimeout: globalThis.setTimeout, clearTimeout: globalThis.clearTimeout }));
  vi.stubGlobal('document', document);
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  let offen = 0;
  vi.stubGlobal('fetch', vi.fn(async (u: string) => {
    const pfad = String(u).split('?')[0];
    offen++;
    try {
      if (!(pfad in NETZ)) { fremd.push(`${href} → ${pfad}`); return { ok: false, status: 404, json: async () => null }; }
      angefragt.add(pfad);
      const koerper = NETZ[pfad];
      if (koerper === null) return { ok: false, status: 404, json: async () => null };
      return { ok: true, status: 200, json: async () => structuredClone(koerper) };
    } finally { offen--; }
  }));

  const ziel = document.getElementById('app') as unknown as HTMLElement;
  const root = createRoot(ziel);
  await act(async () => {
    root.render(
      <MemoryRouter initialEntries={[href]}>
        <LocaleProvider><Suspense fallback={null}><RouteSwitch /></Suspense></LocaleProvider>
      </MemoryRouter>,
    );
  });
  // Warten auf den GELADENEN Zustand: keine offene Anfrage und fünf Takte
  // unverändertes Markup (Lazy-Seite + Lade-Kette + Folge-Renders).
  let vorher = '';
  let stabil = 0;
  for (let i = 0; i < 500 && stabil < 5; i++) {
    await act(async () => { await new Promise((r) => setTimeout(r, 10)); });
    const jetzt = ziel.innerHTML;
    stabil = jetzt !== '' && jetzt === vorher && offen === 0 ? stabil + 1 : 0;
    vorher = jetzt;
  }
  if (stabil < 5) throw new Error(`${href}: Fläche wurde nicht stabil`);
  const kopie = parseHTML(`<!doctype html><html><body>${ziel.innerHTML}</body></html>`).document.body;
  act(() => root.unmount());
  vi.unstubAllGlobals();
  return kopie as unknown as Element;
}

const BLOCK = 'p, li, dd, dt, td, th, small, figcaption, footer, div, span';
const QUELLE_STAND = /\b(Stand|Quelle|Fassung|abgerufen|Abruf|konsolidiert)/i;

function erfasse(wurzel: Element): Flaeche {
  const alle = (sel: string) => [...wurzel.querySelectorAll(sel)];
  return {
    titel: alle('h1').map(txt),
    overline: alle('[class*="overline"]').map(txt).filter(Boolean),
    ueberschriften: alle('h2, h3').map((h) => `${h.tagName.toLowerCase()} ${txt(h)}`),
    knoepfe: alle('button, [role="tab"]').map(name).filter(Boolean),
    links: alle('a[href]').map((a) => `${name(a)} → ${a.getAttribute('href')}`),
    klappen: alle('summary').map(txt),
    beschriftungen: alle('label, legend').map(txt).filter(Boolean),
    etiketten: alle('[class*="lc-badge"], [role="img"][aria-label]').map(name).filter(Boolean),
    // Innerste Blöcke mit Quell-/Stand-Wort (kein passender Block darunter), gekappt.
    quelleStand: alle(BLOCK)
      .filter((el) => QUELLE_STAND.test(txt(el)) && txt(el).length <= 400
        && ![...el.querySelectorAll(BLOCK)].some((k) => QUELLE_STAND.test(txt(k))))
      .map(txt),
    zustaende: alle('[data-leerzustand], [role="status"], [role="alert"], [aria-live]').map(txt).filter(Boolean),
  };
}

describe('S0 · Rest-Flächen-Ratsche (W2·29-WERKBANK-REST)', () => {
  beforeAll(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-10-07T12:00:00'));
  });
  afterAll(() => { vi.useRealTimers(); });

  it('jede Rest-Route rendert im geladenen Zustand die eingefrorene Fläche', async () => {
    const ist: Record<string, Flaeche> = {};
    for (const href of ROUTEN) ist[href] = erfasse(await rendere(href));
    // Stub beidseitig dicht: nichts ausserhalb der Fixture, keine toten Antworten.
    expect(fremd, 'Anfragen ausserhalb von fixtures/rest-flaechen/netz.json').toEqual([]);
    expect(Object.keys(NETZ).filter((u) => !angefragt.has(u)), 'nie angefragte Fixture-Antworten').toEqual([]);
    if (SCHREIBEN) {
      writeFileSync(FIXTURE, JSON.stringify(ist, null, 2) + '\n');
      return;
    }
    expect(existsSync(FIXTURE), 'Fixture fehlt — mit REST_FLAECHEN_SCHREIBEN=1 erzeugen').toBe(true);
    const soll = JSON.parse(readFileSync(FIXTURE, 'utf8')) as Record<string, Flaeche>;
    expect(Object.keys(ist)).toEqual(Object.keys(soll));
    for (const href of ROUTEN) expect(ist[href], href).toEqual(soll[href]);
  }, 120_000);
});
