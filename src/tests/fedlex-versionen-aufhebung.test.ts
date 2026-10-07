import { describe, it, expect, vi } from 'vitest';
import { bewerte, parseKonsolidierungen, ausserKraftSignal, fuehreAus } from '../../scripts/fedlex-versionen-pruefen';
import type { Pin } from '../../scripts/fedlex-pins';
import { ANERKANNTE_AUFHEBUNGEN } from '../lib/normtext/aufhebungen';

// ─── G-AUFH: Aufhebungs-Blindheit der Currency-Prüfung ───────────────────────
// Vor dem Fix fragte check:fedlex-versionen jolux:dateNoLongerInForce NIRGENDS
// ab: ein ganz aufgehobener Erlass (dateNoLongerInForce ≤ heute) wäre still als
// «geltend geprüft» (OK/grün) stehen geblieben — §7/§8-Verstoss (stilles
// Veralten). Diese Tests verankern die Offline-Entscheidungslogik fixture-basiert;
// der Netz-Teil (SPARQL-Fetch) läuft im check:netz-Pfad.

const HEUTE = '2026-07-17';
const pin = (p: Partial<Pin> = {}): Pin => ({
  name: 'testerlass',
  eli: 'cc/2000/1',
  kons: '2020-01-01',
  ...p,
});

describe('bewerte — Aufhebungs-Zweige (G-AUFH)', () => {
  it('AUFGEHOBEN: dateNoLongerInForce ≤ heute ⇒ ROT, klare Meldung mit Datum', () => {
    const v = bewerte(pin(), ['2020-01-01'], '2025-06-30', HEUTE);
    expect(v.art).toBe('AUFGEHOBEN');
    expect(v.text).toContain('aufgehoben per 2025-06-30');
    expect(v.text).toContain('Snapshot nicht mehr geltend');
  });

  it('AUFGEHOBEN hat VORRANG vor ÜBERHOLT (aufgehoben ist nie „geltend geprüft")', () => {
    // dateApplicability 2026-06-01 wäre für sich «überholt», aber der Erlass ist tot.
    const v = bewerte(pin({ kons: '2020-01-01' }), ['2026-06-01'], '2025-01-01', HEUTE);
    expect(v.art).toBe('AUFGEHOBEN');
  });

  it('AUFHEBUNG (künftig): dateNoLongerInForce > heute ⇒ WARN mit Datum, blockiert nicht', () => {
    const v = bewerte(pin(), ['2020-01-01'], '2027-01-01', HEUTE);
    expect(v.art).toBe('AUFHEBUNG');
    expect(v.text).toContain('AUFGEHOBEN per 2027-01-01');
  });

  it('Grenzfall: Aufhebung GENAU heute ⇒ AUFGEHOBEN (≤ heute ist inklusiv)', () => {
    const v = bewerte(pin(), ['2020-01-01'], HEUTE, HEUTE);
    expect(v.art).toBe('AUFGEHOBEN');
  });
});

// ─── G-AUFH · Anerkannte Aufhebung (§8-ehrlich, PR #287) ─────────────────────
// Ein in aufhebungen.ts DEKLARIERTER Repeal wird von bewerte() gegen das amtliche
// dateNoLongerInForce verifiziert: stimmt Datum ⇒ ehrliches OK «bewusst
// historisch»; sonst ROT (AUFGEHOBEN). Fixtures docken an der echten SSoT-Zeile
// (BMV) an, damit der Test mit der Deklaration mitwandert. Ein UNDEKLARIERTER
// Repeal bleibt über die Blindheitsprüfung ROT (Tests oben, eli cc/2000/1).
describe('bewerte — anerkannte Aufhebung (§8: OK statt Dauer-Rot)', () => {
  const anerkannt = ANERKANNTE_AUFHEBUNGEN[0]; // BMV: eli cc/2009/423, seit 2026-03-01
  const apin = (p: Partial<Pin> = {}): Pin =>
    pin({ name: 'bmv', eli: anerkannt.eli, ...p });

  it('anerkannt + Fedlex bestätigt Aufhebung (Datum == Deklaration) ⇒ ehrliches OK', () => {
    const v = bewerte(apin(), ['2020-01-01'], anerkannt.seit, HEUTE);
    expect(v.art).toBe('OK');
    expect(v.text).toContain('OK (aufgehoben)');
    expect(v.text).toContain(`amtlich aufgehoben per ${anerkannt.seit}`);
    expect(v.text).toContain('bewusst als historische Fassung geführt');
  });

  it('anerkannt hat VORRANG vor ÜBERHOLT (aufgehobener, deklarierter Erlass ⇒ OK)', () => {
    // dateApplicability 2026-06-01 > gepinnt ⇒ für sich «überholt», aber tot+anerkannt.
    const v = bewerte(apin({ kons: '2020-01-01' }), ['2026-06-01'], anerkannt.seit, HEUTE);
    expect(v.art).toBe('OK');
  });

  it('anerkannt, aber Fedlex-Datum weicht von der Deklaration ab ⇒ ROT (nachführen)', () => {
    const v = bewerte(apin(), ['2020-01-01'], '2025-01-01', HEUTE);
    expect(v.art).toBe('AUFGEHOBEN');
    expect(v.text).toContain(`Deklaration seit=${anerkannt.seit}`);
    expect(v.text).toContain('nachführen');
  });

  it('anerkannt, aber Fedlex meldet KEINE Aufhebung (kein noLonger) ⇒ ROT (Deklaration falsch)', () => {
    const v = bewerte(apin(), ['2020-01-01'], null, HEUTE);
    expect(v.art).toBe('AUFGEHOBEN');
    expect(v.text).toContain('KEINE geltende Aufhebung');
  });

  it('anerkannt, aber Fedlex meldet nur KÜNFTIGE Aufhebung (> heute) ⇒ ROT (noch geltend)', () => {
    const v = bewerte(apin(), ['2020-01-01'], '2027-01-01', HEUTE);
    expect(v.art).toBe('AUFGEHOBEN');
    expect(v.text).toContain('KEINE geltende Aufhebung');
  });
});

describe('bewerte — bestehende Grün-Semantik unverändert (byte-genau)', () => {
  it('OK: geltend, kein Aufhebungsdatum ⇒ exakter Alt-Wortlaut', () => {
    const v = bewerte(pin(), ['2020-01-01'], null, HEUTE);
    expect(v.art).toBe('OK');
    expect(v.text).toBe('OK         testerlass: gepinnt 2020-01-01 = neueste Konsolidierung');
  });

  it('ÜBERHOLT: neuere geltende Konsolidierung, kein Aufhebungsdatum ⇒ exakter Alt-Wortlaut', () => {
    const v = bewerte(pin({ kons: '2020-01-01' }), ['2026-06-01'], null, HEUTE);
    expect(v.art).toBe('ÜBERHOLT');
    expect(v.text).toBe('ÜBERHOLT   testerlass: gepinnt 2020-01-01, geltend ist 2026-06-01 → neu pinnen + §7-Verifikation!');
  });

  it('HINWEIS: künftige Fassung, kein Aufhebungsdatum ⇒ exakter Alt-Wortlaut', () => {
    const v = bewerte(pin({ kons: '2020-01-01' }), ['2020-01-01', '2027-01-01'], null, HEUTE);
    expect(v.art).toBe('HINWEIS');
    expect(v.text).toBe('HINWEIS    testerlass: gepinnt 2020-01-01 (aktuell) — künftige Fassung(en) angekündigt: 2027-01-01');
  });

  it('FEHLER: keine Konsolidierungen ⇒ exakter Alt-Wortlaut', () => {
    const v = bewerte(pin(), [], null, HEUTE);
    expect(v.art).toBe('FEHLER');
    expect(v.text).toBe('FEHLER     testerlass: keine Konsolidierungen via SPARQL gefunden (ELI cc/2000/1 prüfen!)');
  });

  it('FEHLER auch bei undefined (kein SPARQL-Treffer für die ELI)', () => {
    expect(bewerte(pin(), undefined, null, HEUTE).art).toBe('FEHLER');
  });
});

describe('parseKonsolidierungen — noLonger-Extraktion aus SPARQL-Bindings', () => {
  const bind = (eli: string, date: string, noLonger?: string) => ({
    abstract: { value: `https://fedlex.data.admin.ch/eli/${eli}` },
    date: { value: `${date}T00:00:00` },
    ...(noLonger ? { noLonger: { value: `${noLonger}T00:00:00` } } : {}),
  });

  it('extrahiert dateNoLongerInForce, wenn präsent (auf jeder date-Zeile gespiegelt)', () => {
    const m = parseKonsolidierungen([
      bind('cc/2000/1', '2019-01-01', '2025-06-30'),
      bind('cc/2000/1', '2020-01-01', '2025-06-30'),
    ]);
    const b = m.get('cc/2000/1')!;
    expect(b.noLonger).toBe('2025-06-30');
    expect(b.daten).toEqual(['2019-01-01', '2020-01-01']); // sortiert
  });

  it('noLonger bleibt null, wenn Fedlex keins liefert (geltender Erlass)', () => {
    const m = parseKonsolidierungen([bind('cc/2000/2', '2020-01-01')]);
    expect(m.get('cc/2000/2')!.noLonger).toBeNull();
  });

  it('hält das früheste Aufhebungsdatum (defensiv gegen Mehrfachwerte)', () => {
    const m = parseKonsolidierungen([
      bind('cc/2000/3', '2020-01-01', '2026-01-01'),
      bind('cc/2000/3', '2020-01-01', '2024-01-01'),
    ]);
    expect(m.get('cc/2000/3')!.noLonger).toBe('2024-01-01');
  });
});

// ─── B1 (Gegenprüfung Opus 7.10.2026): Ausser-Kraft ohne dateNoLongerInForce ─────
// Fedlex setzt bei ausser Kraft getretenen Erlassen oft nur inForceStatus …/3 + dateEndApplicability
// (live 7.10.2026: SR 172.220.111.323.2 → cc/2023/787, endApp 2025-12-31; SR 0.142.114.239 →
// cc/2016/678, endApp 2021-10-06). Der Wächter sah nur dateNoLongerInForce und blieb grün.
describe('bewerte — inForceStatus / dateEndApplicability (B1)', () => {
  it('inForceStatus 3 ohne noLonger ⇒ AUFGEHOBEN (ROT), Grund im Klartext', () => {
    const v = bewerte(pin(), ['2024-01-01'], null, HEUTE, { status: ['3'], endApp: null });
    expect(v.art).toBe('AUFGEHOBEN');
    expect(v.text).toContain('nicht mehr in Kraft');
    expect(v.text).toContain('enforcement-status/3');
  });

  it('nur dateEndApplicability < heute (Status fehlt) ⇒ AUFGEHOBEN, Datum in der Meldung', () => {
    const v = bewerte(pin(), ['2024-01-01'], null, HEUTE, { status: [], endApp: '2025-12-31' });
    expect(v.art).toBe('AUFGEHOBEN');
    expect(v.text).toContain('2025-12-31');
  });

  it('Grenze: dateEndApplicability == heute zählt noch als in Kraft (Endtag inklusive) ⇒ OK', () => {
    const v = bewerte(pin({ kons: '2024-01-01' }), ['2024-01-01'], null, HEUTE, { status: ['0'], endApp: HEUTE });
    expect(v.art).toBe('OK');
  });

  it('Status 0 «In Kraft» ⇒ kein Signal; Status 0 und 3 gemischt ⇒ Signal', () => {
    expect(ausserKraftSignal({ status: ['0'], endApp: null }, HEUTE)).toBeNull();
    expect(ausserKraftSignal(undefined, HEUTE)).toBeNull();
    expect(ausserKraftSignal({ status: ['0', '3'], endApp: null }, HEUTE)).toContain('enforcement-status/3');
  });

  it('AUSNAHME bmv: anerkannte Aufhebung bleibt «bewusst historisch» OK, auch mit Status 3 + endApp (Pfad vor dem B1-Zweig)', () => {
    const a = ANERKANNTE_AUFHEBUNGEN[0];
    const v = bewerte(pin({ name: 'bmv', eli: a.eli }), ['2020-01-01'], a.seit, HEUTE, { status: ['3'], endApp: '2026-02-28' });
    expect(v.art).toBe('OK');
    expect(v.text).toContain('bewusst als historische Fassung geführt');
  });

  it('parseKonsolidierungen liest status + spätestes endApp, dedupliziert Codes', () => {
    const b = (status?: string, endApp?: string) => ({
      abstract: { value: 'https://fedlex.data.admin.ch/eli/cc/2023/787' },
      date: { value: '2024-01-01' },
      ...(status ? { status: { value: `https://fedlex.data.admin.ch/vocabulary/enforcement-status/${status}` } } : {}),
      ...(endApp ? { endApp: { value: `${endApp}T00:00:00` } } : {}),
    });
    const m = parseKonsolidierungen([b('3', '2025-12-31'), b('3', '2025-06-30'), b('0')]);
    expect(m.get('cc/2023/787')).toMatchObject({ status: ['0', '3'], endApp: '2025-12-31' });
    expect(parseKonsolidierungen([b()]).get('cc/2023/787')).toMatchObject({ status: [], endApp: null });
  });

  // Ende-zu-Ende durch SPARQL-Text → parse → bewerte. Die pdf-embed-Pins (emrk …) liefert die Attrappe
  // nicht, sie melden FEHLER ⇒ Exit 1 ohnehin; darum zählt die ZEILE des Sonden-Pins, nicht der Exit.
  const laufMitStatus = async (status: string, endApp: string | null): Promise<string[]> => {
    const SH = '  "sonde|cc/2023/787|20240101|0|art_1|172.220.111.323.2"';
    const stub = (async (input: RequestInfo | URL, init?: RequestInit) => {
      const abstract = { value: 'https://fedlex.data.admin.ch/eli/cc/2023/787' };
      const q = decodeURIComponent(String(init?.body ?? '').replace(/^query=/, ''));
      expect(q).toContain('jolux:inForceStatus');
      expect(q).toContain('jolux:dateEndApplicability');
      const b = q.includes('isExemplifiedBy')
        ? [{ abstract, date: { value: '2024-01-01' }, file: { value: 'https://fedlex.data.admin.ch/filestore/fedlex.data.admin.ch/eli/cc/2023/787/20240101/de/html/fedlex-data-admin-ch-eli-cc-2023-787-20240101-de-html.html' } }]
        : [{
            abstract,
            date: { value: '2024-01-01' },
            status: { value: `https://fedlex.data.admin.ch/vocabulary/enforcement-status/${status}` },
            ...(endApp ? { endApp: { value: endApp } } : {}),
          }];
      return new Response(JSON.stringify({ results: { bindings: b } }), { headers: { 'content-type': 'application/sparql-results+json' } });
    }) as typeof fetch;
    const zeilen: string[] = [];
    const spy = vi.spyOn(console, 'log').mockImplementation((...a: unknown[]) => void zeilen.push(a.join(' ')));
    try {
      await fuehreAus({ fetchImpl: stub, heute: HEUTE, shText: SH });
    } finally {
      spy.mockRestore();
    }
    return zeilen.filter((z) => z.includes(' sonde:'));
  };

  it('Lauf-Ende-zu-Ende: inForceStatus 3 + endApp, OHNE noLonger ⇒ Zeile AUFGEHOBEN für den Pin', async () => {
    const z = await laufMitStatus('3', '2025-12-31');
    expect(z).toHaveLength(1);
    expect(z[0]).toMatch(/^AUFGEHOBEN sonde: .*nicht mehr in Kraft.*enforcement-status\/3.*2025-12-31/);
  });

  it('Kontrolle: derselbe Lauf mit Status 0 ⇒ OK (Rot kommt nur vom Signal)', async () => {
    const z = await laufMitStatus('0', null);
    expect(z).toHaveLength(1);
    expect(z[0]).toMatch(/^OK /);
  });
});
