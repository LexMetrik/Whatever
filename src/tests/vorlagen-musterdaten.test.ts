// ─── V5 · Musterdaten für alle Vorlagen (W2·29-WERKBANK-VORLAGEN) ───────────
//
// Wunsch David 23.9.2026: «ich möchte dass alle vorlagen musterdaten möglich
// haben.» Dieser Wächter hält drei Dinge fest:
//   1. VOLLSTÄNDIGKEIT gegen den Katalog (§5): jede Vorlagen-Karte mit Status
//      ≠ geplant hat Musterdaten (Ausnahme: die Checkliste kuendigung-vermieter,
//      die kein Dokument erzeugt) — dazu die drei Arbeitsvertrag-Untertypen.
//   2. DURCHLAUF auf der ECHTEN Seite: der Stand `{ ...defaults, ...muster() }`
//      (genau das, was der Knopf setzt) wird über eine Hülle um
//      `useWizardState` eingespielt, der letzte Schritt erzwungen (Mechanik
//      wie die V0-Flächen-Ratsche). Dort muss der Prüf-Befund «vollständig»
//      sein und darf KEINE role=alert-Box stehen — d. h. `fehlerEingabe` aller
//      Schritte ist leer und `pruefeGates` liefert keinen Blocker; die
//      Vorschau trägt ein Dokument. Gegenprobe je Seite: OHNE Musterdaten
//      ist derselbe Schritt NICHT vollständig (sonst prüfte der Test nichts).
//   3. KNOPF: jede Seite zeigt «Mit Musterdaten füllen».
// Die Mappen GmbH/Kapitalerhöhung halten ihre Eingaben in lokalem useState —
// für sie prüft der Test die Engine direkt (`…Dokumentmappe(muster()).gates`).
//
// Warnungen (nicht Blocker) sind erlaubt; sie werden je Route gesammelt und
// im Snapshot unten festgehalten, damit eine neue Warnung sichtbar wird.
import { describe, it, expect, vi, beforeAll } from 'vitest';
import { createElement } from 'react';
import { prerenderToNodeStream } from 'react-dom/static';
import { MemoryRouter } from 'react-router-dom';
import { parseHTML } from 'linkedom';
import { LocaleProvider } from '../components/locale';
import { ALLE_KARTEN } from '../lib/startseiteConfig';
import { ROUTEN_MANIFEST } from '../routesManifest';
import { MUSTER, agMusterdaten } from '../components/vorlagen/musterdaten';
import { MAPPEN_MUSTER } from '../components/vorlagen/musterdaten-mappen';
import { gmbhDokumentmappe } from '../lib/vorlagen/gruendungGmbhDokumente';
import { keDokumentmappe } from '../lib/vorlagen/kapitalerhoehung';
import { PV_DEFAULT_MASSNAHMEN, zielDefaults } from '../lib/vorlagen/patientenverfuegung';

// ── Hülle um den echten Hook: Musterdaten als Stand, Schritt erzwingen ─────
const zwang = vi.hoisted(() => ({ schritt: null as number | null, muster: null as null | object }));
vi.mock('../components/vorlagen/useWizardState', async (original) => {
  const echt = await original<typeof import('../components/vorlagen/useWizardState')>();
  const gehuellt = ((opts: Parameters<typeof echt.useWizardState>[0]) => {
    const o = zwang.muster ? { ...opts, defaults: { ...opts.defaults, ...zwang.muster }, prefill: undefined } : opts;
    const r = echt.useWizardState(o);
    return zwang.schritt == null ? r : { ...r, schritt: zwang.schritt };
  }) as typeof echt.useWizardState;
  return { ...echt, useWizardState: gehuellt };
});

const REGIME_KEY = 'lexmetrik.vorlage.arbeitsvertrag.regime.v1';
const MAPPEN = new Set(['gmbh-gruendung', 'kapitalerhoehung']);
const OHNE_MUSTER = new Set(['kuendigung-vermieter']);
const AV_UNTERTYPEN = ['lehrvertrag', 'handelsreisendenvertrag', 'heimarbeitsvertrag'] as const;

type Variante = { schluessel: string; href: string; speicher: Record<string, string>; muster: () => object };

function vorlagenKarten() {
  return ALLE_KARTEN.filter((k) => k.modus === 'vorlage' && k.status !== 'geplant');
}

function varianten(): Variante[] {
  const m = MUSTER as Record<string, () => object>;
  const out: Variante[] = vorlagenKarten()
    .filter((k) => !OHNE_MUSTER.has(k.id) && !MAPPEN.has(k.id) && k.id !== 'ag-gruendung')
    .map((k) => ({ schluessel: k.id, href: k.href!, speicher: {}, muster: m[k.id] }));
  for (const u of AV_UNTERTYPEN) {
    out.push({ schluessel: u, href: '/vorlagen/arbeitsvertrag', speicher: { [REGIME_KEY]: u }, muster: m[u] });
  }
  let k = 1;
  out.push({ schluessel: 'ag-gruendung', href: '/vorlagen/ag-gruendung', speicher: {}, muster: () => agMusterdaten(() => k++) });
  return out.sort((a, b) => a.schluessel.localeCompare(b.schluessel));
}

function speicherStub(inhalt: Record<string, string>): Storage {
  const m = new Map(Object.entries(inhalt));
  return {
    getItem: (k: string) => m.get(k) ?? null,
    setItem: (k: string, v: string) => { m.set(k, v); },
    removeItem: (k: string) => { m.delete(k); },
    clear: () => m.clear(),
    key: (i: number) => [...m.keys()][i] ?? null,
    get length() { return m.size; },
  };
}

async function rendere(v: Variante, schritt: number | null, mitMuster: boolean): Promise<Document> {
  const eintrag = ROUTEN_MANIFEST.find((r) => r.pfad === v.href);
  if (!eintrag) throw new Error(`kein Manifest-Eintrag für ${v.href}`);
  const g = globalThis as { localStorage?: Storage };
  g.localStorage = speicherStub(v.speicher);
  zwang.schritt = schritt;
  zwang.muster = mitMuster ? v.muster() : null;
  try {
    const { prelude } = await prerenderToNodeStream(
      createElement(MemoryRouter, { initialEntries: [v.href] },
        createElement(LocaleProvider, null, createElement(eintrag.Comp))),
    );
    let html = '';
    for await (const teil of prelude) html += String(teil);
    return parseHTML(`<!doctype html><html><body>${html}</body></html>`).document;
  } finally {
    zwang.schritt = null;
    zwang.muster = null;
    delete g.localStorage;
  }
}

const txt = (el: Element | null | undefined): string => (el?.textContent ?? '').replace(/\s+/g, ' ').trim();

function schrittZahl(doc: Document): number {
  return doc.querySelectorAll('nav[aria-label="Schritte"] button').length;
}

type Befund = { knopf: boolean; alerts: string[]; befund: string | null; dokument: boolean; warnungen: string[]; gegenprobeOffen: boolean };

describe('V5 · Musterdaten für alle Vorlagen (W2·29-WERKBANK-VORLAGEN)', () => {
  const ist: Record<string, Befund> = {};

  beforeAll(async () => {
    for (const v of varianten()) {
      const start = await rendere(v, null, false);
      const knopf = [...start.querySelectorAll('button')].some((b) => txt(b) === 'Mit Musterdaten füllen');
      const letzter = schrittZahl(start) - 1;
      const ende = await rendere(v, letzter, true);
      const leer = await rendere(v, letzter, false);
      ist[v.schluessel] = {
        knopf,
        alerts: [...ende.querySelectorAll('[role="alert"]')].map(txt),
        befund: ende.querySelector('[data-pruefbefund]')?.getAttribute('data-pruefbefund') ?? null,
        dokument: txt(ende.querySelector('[data-dokument]')).length > 200 || ende.querySelectorAll('[role="tab"]').length > 0,
        warnungen: [...new Set([...ende.querySelectorAll('[data-vorbehalte]')].map(txt))],
        gegenprobeOffen: leer.querySelector('[data-pruefbefund="offen"]') != null || leer.querySelectorAll('[role="alert"]').length > 0,
      };
    }
  }, 180_000);

  it('Vollständigkeit: Musterdaten für jede Vorlagen-Karte (ausser Checkliste) + AV-Untertypen, keine verwaisten', () => {
    const soll = [
      ...vorlagenKarten().map((k) => k.id).filter((id) => !OHNE_MUSTER.has(id)),
      ...AV_UNTERTYPEN,
    ].sort();
    const vorhanden = [...Object.keys(MUSTER), ...Object.keys(MAPPEN_MUSTER), 'ag-gruendung'].sort();
    expect(vorhanden).toEqual(soll);
  });

  it('jede Seite zeigt den Knopf «Mit Musterdaten füllen»', () => {
    const ohne = Object.entries(ist).filter(([, b]) => !b.knopf).map(([k]) => k);
    expect(ohne).toEqual([]);
  });

  it('mit Musterdaten: letzter Schritt ohne Blocker/Pflichtlücke, mit Dokument', () => {
    const befund: string[] = [];
    for (const [k, b] of Object.entries(ist)) {
      if (b.alerts.length > 0) befund.push(`${k}: ${b.alerts.join(' | ')}`);
      if (b.befund === 'offen') befund.push(`${k}: Prüf-Befund offen`);
      if (!b.dokument) befund.push(`${k}: kein Dokument`);
    }
    expect(befund).toEqual([]);
  });

  it('Gegenprobe: ohne Musterdaten ist der letzte Schritt NICHT vollständig', () => {
    const ohne = Object.entries(ist).filter(([, b]) => !b.gegenprobeOffen).map(([k]) => k);
    expect(ohne).toEqual([]);
  });

  it('Warnungen der Musterdaten sind festgehalten (neue Warnung = sichtbare Änderung)', () => {
    const w = Object.fromEntries(Object.entries(ist).filter(([, b]) => b.warnungen.length > 0).map(([k, b]) => [k, b.warnungen]));
    expect(w).toMatchInlineSnapshot(`
      {
        "ag-gruendung": [
          "• Geschäftsübernahme von Anna Muster: Mit der Übernahme von Aktiven und Passiven haftet die Gesellschaft den Gläubigern ab Mitteilung bzw. Auskündigung; die bisherige Schuldnerin haftet drei Jahre solidarisch weiter (Art. 181 Abs. 1 und 2 OR). Bei im Handelsregister eingetragenen Rechtsträgern richtet sich die Übernahme nach dem Fusionsgesetz (Art. 181 Abs. 4 OR).",
        ],
        "kuendigung-mieter": [
          "Ortsübliche Termine sind eine TATFRAGE und variieren teils nach Gemeinde – verbindliche Auskunft erteilt die Schlichtungsbehörde bzw. die Gemeinde.",
          "Bei Wohn-/Geschäftsräumen: Schriftform; Vermieterkündigung nur mit amtlich genehmigtem Formular; Familienwohnung mit Sonderschutz (Art. 266l–266n OR) – Verstoss macht die Kündigung nichtig (Art. 266o OR).",
        ],
        "nichtbekanntgabe-betreibung": [
          "Die Aussage «kein Beseitigungs-Verfahren bekannt» nur stehen lassen, wenn sie zutrifft – ist eine Rechtsöffnung oder Anerkennungsklage hängig, ist das Gesuch aussichtslos.",
        ],
      }
    `);
  });

  it('Patientenverfügung: Massnahmen-Literal = Zielwahl «palliativ» (zielDefaults, R1)', () => {
    expect(MUSTER.patientenverfuegung().massnahmen).toEqual(zielDefaults('palliativ', { ...PV_DEFAULT_MASSNAHMEN }));
  });

  it('Mappen GmbH/Kapitalerhöhung: Knopf im Kopf', async () => {
    for (const k of vorlagenKarten().filter((x) => MAPPEN.has(x.id))) {
      const doc = await rendere({ schluessel: k.id, href: k.href!, speicher: {}, muster: () => ({}) }, null, false);
      expect([...doc.querySelectorAll('button')].some((b) => txt(b) === 'Mit Musterdaten füllen'), k.id).toBe(true);
    }
  });

  it('Mappen GmbH/Kapitalerhöhung: Engine ohne Blocker, Dokumente vorhanden', () => {
    const g = gmbhDokumentmappe(MAPPEN_MUSTER['gmbh-gruendung']());
    const ke = keDokumentmappe(MAPPEN_MUSTER.kapitalerhoehung());
    expect(g.gates.blocker).toEqual([]);
    expect(ke.gates.blocker).toEqual([]);
    expect(g.dokumente.length).toBeGreaterThan(0);
    expect(ke.dokumente.length).toBeGreaterThan(0);
  });
});
