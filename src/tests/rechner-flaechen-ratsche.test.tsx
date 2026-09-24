// ─── R0 · Flächen-Ratsche über die gebauten Rechner (W2·29-WERKBANK-RECHNER) ──
//
// ZWECK: Die Umbau-Scheiben R1 (Kopf auf `layout/WerkzeugKopf`), R2
// (Ergebnisblock-Optik) und R3 (gemeinsame Exportzeile) sind Struktur-Umbauten
// an 20 Rechner-Seiten. Nach §6 ist Verhaltensgleichheit zu BEWEISEN — diese
// Ratsche friert die sichtbare Fläche je Route im Erst-Render ein (Abnahmeliste
// docs/INVENTAR-FUNKTIONEN.md 4.3 Rahmen, 4.4 die 20 Rechner):
//   · Kopf: Overline, H1, Kurzbeschrieb sichtbar, Norm-Chips (Text + Ziel),
//   · Knöpfe in Dokument-Reihenfolge (Beispiele, Reiter, Export, Teilen …),
//   · Klappkästen (`summary`), Zwischentitel (h2/h3), Ergebnis-Anker
//     (`[id^="lc-ergebnis"]`), Platzhalter (`[data-platzhalter]`),
//   · innere Links (Tagerechner-Rückverweis R2, Themen-Einstieg R10).
// Die Rechenwerte selbst sind NICHT Gegenstand — die liegen am Engine-Golden
// (scripts/golden-outputs.ts) und bewegen sich durch keinen Rahmen-Umbau.
//
// ROUTEN-QUELLE: das Routen-Manifest (§5) — jede `/rechner/<slug>`-Route.
// UHR: fest auf den 1.3.2026, 12:00 — Formulare mit «heute»-Vorgabe rendern
// sonst tagesabhängig.
//
// FIXTURE: src/tests/fixtures/rechner-flaechen.json, erzeugt aus dem Ist-Stand
// mit `RECHNER_FLAECHEN_SCHREIBEN=1 npx vitest run
// src/tests/rechner-flaechen-ratsche.test.tsx`. Ohne die Variable ist der Test
// streng: jede Abweichung ist rot. Neu erzeugen ist eine deklarierte Änderung
// (§6.3) und steht mit Begründung im Commit, der sie auslöst.
//
// Rot-Beweis (§6.7): siehe PR-Body.
import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { prerenderToNodeStream } from 'react-dom/static';
import { MemoryRouter } from 'react-router-dom';
import { parseHTML } from 'linkedom';
import { LocaleProvider } from '../components/locale';
import { ROUTEN_MANIFEST } from '../routesManifest';

const FIXTURE = join(__dirname, 'fixtures', 'rechner-flaechen.json');
const SCHREIBEN = process.env.RECHNER_FLAECHEN_SCHREIBEN === '1';

interface Flaeche {
  overline: string;
  titel: string;
  kurzbeschrieb: boolean;
  normen: string[];
  knoepfe: string[];
  klappen: string[];
  titelZwischen: string[];
  ergebnisAnker: string[];
  platzhalter: number;
  links: string[];
}

const txt = (el: Element | null | undefined): string => (el?.textContent ?? '').replace(/\s+/g, ' ').trim();

async function rendere(href: string): Promise<Document> {
  const eintrag = ROUTEN_MANIFEST.find((r) => r.pfad === href);
  if (!eintrag) throw new Error(`kein Manifest-Eintrag für ${href}`);
  const { prelude } = await prerenderToNodeStream(
    <MemoryRouter initialEntries={[href]}>
      <LocaleProvider><eintrag.Comp /></LocaleProvider>
    </MemoryRouter>,
  );
  let html = '';
  for await (const teil of prelude) html += String(teil);
  return parseHTML(`<!doctype html><html><body>${html}</body></html>`).document;
}

async function erfasse(href: string): Promise<Flaeche> {
  const { getCalculator } = await import('../lib/calculators');
  const calc = getCalculator(href.slice('/rechner/'.length));
  const doc = await rendere(href);
  const h1 = doc.querySelector('h1');
  const alle = (sel: string) => [...doc.querySelectorAll(sel)];
  return {
    overline: txt(doc.querySelector('.lc-overline')),
    titel: txt(h1),
    kurzbeschrieb: !!calc && alle('p').some((p) => txt(p) === calc.kurzbeschrieb),
    normen: alle('.lc-chip-zeile a').slice(0, 12).map((a) => `${txt(a)} → ${a.getAttribute('href') ?? ''}`),
    knoepfe: alle('button').map(txt).filter(Boolean),
    klappen: alle('summary').map(txt),
    titelZwischen: alle('h2, h3').map((h) => `${h.tagName.toLowerCase()} ${txt(h)}`),
    ergebnisAnker: alle('[id^="lc-ergebnis"]').map((e) => e.getAttribute('id') ?? ''),
    platzhalter: alle('[data-platzhalter]').length,
    links: alle('a[href^="/"]').map((a) => `${txt(a)} → ${a.getAttribute('href')}`),
  };
}

const ROUTEN = ROUTEN_MANIFEST.map((r) => r.pfad).filter((p) => /^\/rechner\/[a-z0-9-]+$/.test(p));

describe('R0 · Rechner-Flächen-Ratsche (W2·29-WERKBANK-RECHNER)', () => {
  beforeAll(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-03-01T12:00:00'));
  });
  afterAll(() => { vi.useRealTimers(); });

  it('umfasst die 20 gebauten Rechner-Routen', () => {
    expect(ROUTEN.length).toBe(20);
  });

  it('jede Rechner-Route rendert die eingefrorene Fläche', async () => {
    const ist: Record<string, Flaeche> = {};
    for (const href of ROUTEN) ist[href] = await erfasse(href);
    if (SCHREIBEN) {
      writeFileSync(FIXTURE, JSON.stringify(ist, null, 2) + '\n');
      return;
    }
    expect(existsSync(FIXTURE), 'Fixture fehlt — mit RECHNER_FLAECHEN_SCHREIBEN=1 erzeugen').toBe(true);
    const soll = JSON.parse(readFileSync(FIXTURE, 'utf8')) as Record<string, Flaeche>;
    expect(Object.keys(ist)).toEqual(Object.keys(soll));
    for (const href of ROUTEN) expect(ist[href], href).toEqual(soll[href]);
  }, 120_000);
});
