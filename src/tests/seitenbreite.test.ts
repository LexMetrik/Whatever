// ─── Breitenstufe je Seitenart (W2·31-BILDSCHIRMBREITE B1a, 25.9.2026) ───────
//
// `components/layout/seitenbreite.ts` ordnet jeder Route eine Seitenart zu,
// deren Stufe (content|weit) die Rahmenbreite bestimmt. Die Gefahr ist die
// STILLE Einordnung: eine neue Route in `RouteSwitch.tsx` fiele ohne eigenen
// Eintrag auf ein dynamisches Geschwister-Muster (z. B. eine neue feste Seite
// unter /materialien auf `material-leser`) oder auf die Fehlerseite — und
// erbte deren Breite, ohne dass es jemand entschieden hat. Darum wird die
// Routenmenge aus dem QUELLTEXT des Routers gelesen (die eine
// Routendefinition), nicht abgeschrieben.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { ROUTEN_MANIFEST } from '../routesManifest';
import {
  SEITENART_MUSTER, SEITENBREITE, rahmenbreiteKlasse, seitenartVon, type Seitenart,
} from '../components/layout/seitenbreite';

const routerMuster = [...readFileSync('src/RouteSwitch.tsx', 'utf8').matchAll(/<Route path="([^"]+)"/g)]
  .map((m) => m[1]);

describe('seitenbreite: jede Route hat eine deklarierte Seitenart', () => {
  it('liest die Routen des Routers (Plausibilität der Quelle)', () => {
    expect(routerMuster).toContain('/');
    expect(routerMuster).toContain('*');
    expect(routerMuster.length).toBeGreaterThanOrEqual(25);
  });

  it('jedes Router-Muster (ausser dem Catch-all) steht wörtlich in der Tabelle', () => {
    const fehlend = routerMuster.filter((m) => m !== '*' && !SEITENART_MUSTER.includes(m));
    expect(fehlend).toEqual([]);
  });

  it('die Tabelle führt kein Muster, das der Router nicht kennt (einzige Ausnahme: /vorlagen/:slug für die Manifest-Vorlagen)', () => {
    const fremd = SEITENART_MUSTER.filter((m) => m !== '/vorlagen/:slug' && !routerMuster.includes(m));
    expect(fremd).toEqual([]);
  });

  it('jede Karten-Route des ROUTEN_MANIFEST ist Rechner oder Vorlage nach ihrem Präfix', () => {
    for (const { pfad } of ROUTEN_MANIFEST) {
      const erwartet: Seitenart = pfad.startsWith('/rechner/') ? 'rechner' : 'vorlage';
      expect(pfad.startsWith('/rechner/') || pfad.startsWith('/vorlagen/'), pfad).toBe(true);
      expect(seitenartVon(pfad), pfad).toBe(erwartet);
    }
  });

  it('Stub /rechner/:slug und Catch-all: unbekannter Rechner = rechner, unbekannter Pfad = fehlerseite', () => {
    expect(seitenartVon('/rechner/noch-nicht-gebaut')).toBe('rechner');
    expect(seitenartVon('/gibt/es/nicht')).toBe('fehlerseite');
  });

  it('feste Pfade schlagen ihre :param-Geschwister; Query und Hash zählen nicht', () => {
    expect(seitenartVon('/materialien/deckung')).toBe('materialien-deckung');
    expect(seitenartVon('/gesetze/bund')).toBe('gesetze');
    expect(seitenartVon('/rechner?q=frist#x')).toBe('rubrik');
    expect(seitenartVon('/gesetze/bund/OR?art=1')).toBe('gesetz-leser');
  });
});

describe('seitenbreite: Tabelle', () => {
  it('jeder beispielPfad klassifiziert auf seine eigene Seitenart zurück', () => {
    for (const [art, { beispielPfad }] of Object.entries(SEITENBREITE)) {
      expect(seitenartVon(beispielPfad), `${art} ← ${beispielPfad}`).toBe(art);
    }
  });

  it('die Leser-Beispiele verweisen auf existierende Schlüssel (Identität, kein Teilstring)', () => {
    const lies = (p: string) => JSON.parse(readFileSync(p, 'utf8'));
    const erlass = SEITENBREITE['gesetz-leser'].beispielPfad.split('/');
    expect(lies('public/normtext/register.json').erlasse
      .some((e: { key: string; ebene: string }) => e.ebene === erlass[2] && e.key === erlass[3])).toBe(true);
    const entscheid = SEITENBREITE['entscheid-leser'].beispielPfad.split('/')[2];
    expect(lies('public/rechtsprechung/register.json').entscheide
      .some((e: { key: string }) => e.key === entscheid)).toBe(true);
    const material = SEITENBREITE['material-leser'].beispielPfad.split('/')[2];
    expect(lies('public/materialien/register.json').materialien
      .some((e: { key: string }) => e.key === material)).toBe(true);
  });

  it('B1a: alle Seitenarten stehen auf content, die Rahmenklasse ist die bisherige', () => {
    for (const [art, { stufe, beispielPfad }] of Object.entries(SEITENBREITE)) {
      expect(stufe, art).toBe('content');
      expect(rahmenbreiteKlasse(beispielPfad, 'fenster'), art).toBe('max-w-content');
      expect(rahmenbreiteKlasse(beispielPfad, 'pane'), art).toBe('max-w-content');
    }
  });
});
