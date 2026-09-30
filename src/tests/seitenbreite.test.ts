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

  // Folgeposten (30.9.2026, Bündel E): eine variantenPfade-Route ist dieselbe
  // Seitenart mit anderem Inhalt (B8-Lehre) — auch sie muss auf ihre Art
  // zurückklassifizieren, sonst würde der e2e-Wächter (B1c) die falsche
  // Rahmenbreite erwarten.
  it('jeder variantenPfad klassifiziert auf seine eigene Seitenart zurück', () => {
    for (const [art, { variantenPfade }] of Object.entries(SEITENBREITE)) {
      for (const pfad of variantenPfade ?? []) {
        expect(seitenartVon(pfad), `${art} ← ${pfad}`).toBe(art);
      }
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

  // Gegenprüfung 30.9.2026 (Befund 1a, Bündel E-Nachbesserung): die Prüfung
  // oben deckte nur `beispielPfad` — ein `variantenPfad` mit einem toten
  // Schlüssel (Tippfehler, gelöschter Eintrag) fiel auf die Fehlerseite
  // zurück, OHNE dass dieser Unit-Test es sah (der e2e-Wächter B1c prüfte
  // damals nur ein sichtbares `h1`, das auch die Fehlerseite trägt — Fix
  // dazu in `e2e/seitenbreite.e2e.ts`). Dieselbe Methode wie oben, nur über
  // `variantenPfade` statt `beispielPfad`; heute nur `material-leser`
  // betroffen (`/materialien/BOTSCHAFT-2025-1478`), die Schleife ist generisch
  // für jede künftige Leser-Variante.
  it('jeder Leser-variantenPfad verweist auf einen existierenden Schlüssel (Identität, kein Teilstring)', () => {
    const lies = (p: string) => JSON.parse(readFileSync(p, 'utf8'));
    const REGISTER: Partial<Record<Seitenart, { pfad: string; feld: string }>> = {
      'gesetz-leser': { pfad: 'public/normtext/register.json', feld: 'erlasse' },
      'entscheid-leser': { pfad: 'public/rechtsprechung/register.json', feld: 'entscheide' },
      'material-leser': { pfad: 'public/materialien/register.json', feld: 'materialien' },
    };
    let geprueft = 0;
    for (const [art, cfg] of Object.entries(SEITENBREITE)) {
      const register = REGISTER[art as Seitenart];
      if (!register) continue;
      for (const pfad of cfg.variantenPfade ?? []) {
        geprueft++;
        const teile = pfad.split('/');
        const eintraege = lies(register.pfad)[register.feld] as Array<{ key: string; ebene?: string }>;
        if (art === 'gesetz-leser') {
          expect(eintraege.some((e) => e.ebene === teile[2] && e.key === teile[3]), pfad).toBe(true);
        } else {
          expect(eintraege.some((e) => e.key === teile[2]), pfad).toBe(true);
        }
      }
    }
    // Kontrolle: die Schleife lief wirklich über mindestens einen Fall (sonst
    // wäre das leere `for` eine stille Nicht-Prüfung).
    expect(geprueft).toBeGreaterThan(0);
  });

  // §6.3-DEKLARATION (B1c, 25.9.2026): hier stand «alle Seitenarten stehen
  // auf content» — eine Momentaufnahme von B1a, die jeden Posten B2–B12 (der
  // genau EINE Zeile der Tabelle auf `weit` stellt) zu einer Testanpassung
  // zwänge. B1 führt den Mechanismus erst ein; die tragende Invariante ist
  // nicht der heutige Wert, sondern: nur die zwei Stufen, und unterhalb von
  // 2xl (1536 px Viewport bzw. 96rem Pane) bleibt JEDE Art auf `content`.
  // Die gemessene Breite je Art bewacht `e2e/seitenbreite.e2e.ts`.
  it('jede Stufe ist content|weit; unter 2xl bleibt jede Art auf content', () => {
    for (const [art, { stufe, beispielPfad }] of Object.entries(SEITENBREITE)) {
      expect(['content', 'weit'], art).toContain(stufe);
      const fenster = rahmenbreiteKlasse(beispielPfad, 'fenster');
      const pane = rahmenbreiteKlasse(beispielPfad, 'pane');
      // Grundklasse (ohne Präfix) ist immer `max-w-content`.
      expect(fenster.split(' ').filter((k) => !k.includes(':')), art).toEqual(['max-w-content']);
      expect(pane.split(' ').filter((k) => !k.includes(':')), art).toEqual(['max-w-content']);
      if (stufe === 'weit') {
        expect(fenster, art).toContain('2xl:max-w-weit');
        expect(pane, art).toContain('@[96rem]/pane:max-w-weit');
      } else {
        expect(fenster, art).toBe('max-w-content');
        expect(pane, art).toBe('max-w-content');
      }
    }
  });
});
