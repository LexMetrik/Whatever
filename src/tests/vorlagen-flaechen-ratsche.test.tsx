// ─── V0 · Flächen-Ratsche über die gebauten Vorlagen (W2·29-WERKBANK-VORLAGEN) ─
//
// ZWECK: Die Umbau-Scheiben V1 (Rahmen-Optik) und V2 (Migration von 18 Seiten
// auf `VorlagenSeite`) sind Struktur-Umbauten. Nach §6 ist Verhaltensgleichheit
// zu BEWEISEN, nicht zu behaupten — diese Ratsche friert das sichtbare
// Vorlagen-Verhalten je Route ein (Abnahmeliste: docs/INVENTAR-FUNKTIONEN.md
// 5.3 Rahmen, 5.4 die 30 Vorlagen im Einzelnen, 5.5 Mappen):
//   · Seitentitel und Formvorschrift-Badge (`[data-formgate]`, Wortlaut),
//   · Schrittnamen in Reihenfolge (Wizard-Schrittleiste),
//   · Export-Knöpfe im LETZTEN Schritt (Wortlaut, gesperrt ja/nein) — daraus
//     abgeleitet DOCX angeboten ja/nein, Kopieren-Knopf ja/nein,
//   · Direkt-Export-Zeile der Vorschau (Knöpfe ab Schritt 1),
//   · «Eingaben zurücksetzen» ja/nein und der Speicher-/Datenschutz-Hinweis,
//   · Mappen: die Dokument-Reiter (Variante `#mappe-beispiel`, s. unten);
//     Checkliste (kuendigung-vermieter): ihre nummerierten Punkte, kein Export.
//     Die Auskunfts-Kacheln der Checkliste erscheinen erst nach Eingabe und
//     sind darum NICHT eingefroren.
//
// ROUTEN-QUELLE: der Katalog (§5) — jede Vorlagen-Karte mit Status ≠ geplant.
// Dazu die drei Arbeitsvertrag-Untertyp-Seiten (Lehrvertrag, Handelsreisender,
// Heimarbeit): KEINE eigenen Routen, sondern Regime-Wahl innerhalb von
// /vorlagen/arbeitsvertrag (persistiert unter REGIME_KEY) — hier als Variante
// über einen Speicherstand angesteuert. Ebenso der Vorsorgeauftrag in der
// Form «öffentlich beurkundet», weil nur dort DOCX angeboten wird.
//
// LETZTER SCHRITT — WAHL DER EBENE: Die Export-Leiste rendert jede Seite erst
// im letzten Wizard-Schritt, und der Schritt-Zustand ist NICHT persistiert
// (`useWizardState`: `useState(0)`). Statt Klicks zu simulieren (die
// Schrittleiste lässt nur rückwärts springen, «Weiter» sperrt bei leeren
// Pflichtfeldern) hüllt der Test `useWizardState` — die EINE Quelle des
// Schritt-Zustands aller Wizard-Seiten, auch von `VorlagenSeite` — per
// `vi.mock` und setzt nur `schritt` auf den letzten Index; alles andere
// (Antworten, Gates, Bestätigung) bleibt der echte Hook. Ob der Sprung griff,
// prüft der Test selbst: im gezwungenen Render muss der aktive Schritt
// (`aria-current="step"`) der letzte der Leiste sein.
//
// DOCX ⇔ docxAktiv: Das Form-Gate der Karte (`seiteHelfer.docxAktiv`) muss
// exakt dem angebotenen DOCX-Knopf entsprechen — Ausnahmen nur mit Beleg in
// DOCX_ABWEICHUNG unten.
//
// FIXTURE: src/tests/fixtures/vorlagen-flaechen.json, erzeugt aus dem Ist-Stand
// mit `VORLAGEN_FLAECHEN_SCHREIBEN=1 npx vitest run
// src/tests/vorlagen-flaechen-ratsche.test.tsx`. Ohne die Variable ist der
// Test streng: jede Abweichung ist rot. Neu erzeugen ist eine fachliche
// Änderung (§6.3) und gehört in einen eigenen, begründeten Schritt.
//
// Rot-Beweis (§6.7): siehe PR-Body (Schrittname in einer Seite vertauscht).
import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { prerenderToNodeStream } from 'react-dom/static';
import { MemoryRouter } from 'react-router-dom';
import { parseHTML } from 'linkedom';
import { LocaleProvider } from '../components/locale';
import { ALLE_KARTEN, type CatalogItem } from '../lib/startseiteConfig';
import { ROUTEN_MANIFEST } from '../routesManifest';
import { docxAktiv } from '../components/vorlagen/seiteHelfer';
import { GMBH_DOK_DEFAULTS, type GmbhDokAntworten } from '../lib/vorlagen/gruendungGmbhDokumente';
import { KE_DEFAULTS, type KeAntworten } from '../lib/vorlagen/kapitalerhoehung';
import { BASIS as AG_BEISPIEL } from './gruendungAgDokumente.helfer';

// ── Schritt-Zwang: Hülle um den echten Hook ─────────────────────────────────
const zwang = vi.hoisted(() => ({ schritt: null as number | null }));
vi.mock('../components/vorlagen/useWizardState', async (original) => {
  const echt = await original<typeof import('../components/vorlagen/useWizardState')>();
  const gehuellt = ((opts: Parameters<typeof echt.useWizardState>[0]) => {
    const r = echt.useWizardState(opts);
    return zwang.schritt == null ? r : { ...r, schritt: zwang.schritt };
  }) as typeof echt.useWizardState;
  return { ...echt, useWizardState: gehuellt };
});

// ── Mappen-Zwang: die drei Mappen erzeugen im Leerzustand kein Dokument
// (Blocker) — Reiter und Export-Leiste erscheinen erst mit vollständigen
// Angaben, und GmbH-/Kapitalerhöhungs-Seite halten ihre Eingaben in lokalem
// `useState` ohne Speicher. Für die Variante `#mappe-beispiel` reicht die Hülle
// dem ECHTEN Mappen-Generator ein vollständiges Beispiel (dieselben Fixtures
// wie formGate.test.ts / gruendungAgDokumente.helfer.ts) statt der leeren
// Seiten-Eingabe; die Seite entscheidet Reiter, Export-Knöpfe und das
// DOCX-Gate (`docxErlaubt`) selbst. Ohne Zwang: unveränderter Durchlauf.
const mappenZwang = vi.hoisted(() => ({ beispiel: null as null | { gmbh?: unknown; ke?: unknown; ag?: unknown } }));
vi.mock('../lib/vorlagen/gruendungGmbhDokumente', async (original) => {
  const echt = await original<typeof import('../lib/vorlagen/gruendungGmbhDokumente')>();
  const gehuellt = ((a: Parameters<typeof echt.gmbhDokumentmappe>[0]) =>
    echt.gmbhDokumentmappe((mappenZwang.beispiel?.gmbh as typeof a | undefined) ?? a)) as typeof echt.gmbhDokumentmappe;
  return { ...echt, gmbhDokumentmappe: gehuellt };
});
vi.mock('../lib/vorlagen/kapitalerhoehung', async (original) => {
  const echt = await original<typeof import('../lib/vorlagen/kapitalerhoehung')>();
  const gehuellt = ((a: Parameters<typeof echt.keDokumentmappe>[0]) =>
    echt.keDokumentmappe((mappenZwang.beispiel?.ke as typeof a | undefined) ?? a)) as typeof echt.keDokumentmappe;
  return { ...echt, keDokumentmappe: gehuellt };
});
vi.mock('../lib/vorlagen/gruendungAgDokumente', async (original) => {
  const echt = await original<typeof import('../lib/vorlagen/gruendungAgDokumente')>();
  const gehuellt = ((a: Parameters<typeof echt.agDokumentmappe>[0]) =>
    echt.agDokumentmappe((mappenZwang.beispiel?.ag as typeof a | undefined) ?? a)) as typeof echt.agDokumentmappe;
  return { ...echt, agDokumentmappe: gehuellt };
});

const FIXTURE = join(__dirname, 'fixtures', 'vorlagen-flaechen.json');
const SCHREIBEN = process.env.VORLAGEN_FLAECHEN_SCHREIBEN === '1';

const REGIME_KEY = 'lexmetrik.vorlage.arbeitsvertrag.regime.v1';
const VA_KEY = 'lexmetrik.vorlage.vorsorgeauftrag.v1';

type Mappe = NonNullable<typeof mappenZwang.beispiel>;
type Variante = { name: string; href: string; speicher: Record<string, string>; mappe?: Mappe };

// Beispiel-Eingaben der Mappen (Wortlaut aus formGate.test.ts übernommen).
const KE_BEISPIEL: KeAntworten = {
  ...KE_DEFAULTS,
  rechtsform: 'ag', firma: 'Muster Holding AG', sitz: 'Zürich', kanton: 'ZH',
  bisherigesKapitalChf: "100'000", bisherigeAnzahl: '100', nennwertChf: "1'000",
  anzahlNeue: '50', ausgabebetragChf: "1'200", statutenArtikelNr: '3',
  gvDatum: '2026-06-01',
  zeichner: [
    { name: 'Anna Muster', angaben: 'von Basel, in Zürich', anzahl: '30', bereitsBeteiligt: true },
    { name: 'Beat Beispiel', angaben: 'von Bern, in Bern', anzahl: '20', bereitsBeteiligt: true },
  ],
  bankName: 'Zürcher Kantonalbank', bankOrt: 'Zürich',
  berichtUnterzeichner: 'Anna Muster', vorsitzName: 'Anna Muster',
  ort: 'Zürich', datum: '2026-06-07',
};
const GMBH_BEISPIEL: GmbhDokAntworten = {
  einlageArt: 'bar', besondereVorteile: false, gfGewaehlt: true,
  mehrereGeschaeftsfuehrer: false, weitereVertretungsberechtigte: false,
  optingOut: false, eigeneBueros: true, immobilienHauptzweck: false,
  auslJurPersonGesellschafter: false, fremdwaehrung: false,
  bankInUrkundeGenannt: false, chWohnsitzVertretung: true,
  statutKlauseln: [], leistungenChf: undefined,
  ...GMBH_DOK_DEFAULTS,
  firma: 'Muster GmbH', sitz: 'Zürich', kanton: 'ZH', zweck: 'Treuhand',
  stammkapitalChf: "20'000", anzahlAnteile: '20', nennwertChf: "1'000",
  gruender: [{ name: 'A', angaben: 'von Basel, in Zürich', anzahl: '20' }],
  geschaeftsfuehrer: [
    { name: 'A', herkunft: 'Basel', wohnort: 'Zürich', adresse: 'W 1', vorsitz: true, zeichnungsArt: 'einzelunterschrift' },
  ],
  revisionsstelleName: 'R AG', revisionsstelleSitz: 'Zürich',
  ort: 'Zürich', datum: '2026-06-15',
};
const MAPPEN: Record<string, Mappe> = {
  '/vorlagen/gmbh-gruendung': { gmbh: GMBH_BEISPIEL },
  '/vorlagen/kapitalerhoehung': { ke: KE_BEISPIEL },
  '/vorlagen/ag-gruendung': { ag: AG_BEISPIEL },
};
const MAPPE_SUFFIX = '#mappe-beispiel';

/** Die DOCX-Abweichungen vom Karten-Gate, je mit Grund. Sonst gilt exakt
 *  `docxKnopf === docxAktiv(card)`. */
const DOCX_ABWEICHUNG: Record<string, string> = {
  // VorlageVorsorgeauftrag.tsx: `docx={… && !eigenhaendig …}` — die Karte führt
  // DOCX (für die beurkundete Form), die Vorgabe-Form «eigenhändig» ist aber
  // Abschrift-pflichtig (Art. 361 Abs. 1 ZGB) und bietet darum kein DOCX an.
  '/vorlagen/vorsorgeauftrag': 'eigenhändige Form (Vorgabe) — kein DOCX; die beurkundete Variante führt es',
};

function vorlagenKarten(): CatalogItem[] {
  return ALLE_KARTEN.filter((k) => k.modus === 'vorlage' && k.status !== 'geplant');
}

function varianten(): Variante[] {
  const out: Variante[] = vorlagenKarten()
    .map((k) => ({ name: k.href!, href: k.href!, speicher: {} }));
  for (const regime of ['lehrvertrag', 'handelsreisendenvertrag', 'heimarbeitsvertrag']) {
    out.push({ name: `/vorlagen/arbeitsvertrag#${regime}`, href: '/vorlagen/arbeitsvertrag', speicher: { [REGIME_KEY]: regime } });
  }
  for (const [href, mappe] of Object.entries(MAPPEN)) {
    out.push({ name: href + MAPPE_SUFFIX, href, speicher: {}, mappe });
  }
  out.push({
    name: '/vorlagen/vorsorgeauftrag#oeffentlich_beurkundet', href: '/vorlagen/vorsorgeauftrag',
    speicher: { [VA_KEY]: JSON.stringify({ formMode: 'oeffentlich_beurkundet' }) },
  });
  return out.sort((a, b) => a.name.localeCompare(b.name));
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

async function rendere(href: string, speicher: Record<string, string>, schritt: number | null, mappe?: Mappe): Promise<Document> {
  const eintrag = ROUTEN_MANIFEST.find((r) => r.pfad === href);
  if (!eintrag) throw new Error(`kein Manifest-Eintrag für ${href}`);
  const g = globalThis as { localStorage?: Storage };
  g.localStorage = speicherStub(speicher);
  zwang.schritt = schritt;
  mappenZwang.beispiel = mappe ?? null;
  try {
    const { prelude } = await prerenderToNodeStream(
      <MemoryRouter initialEntries={[href]}>
        <LocaleProvider><eintrag.Comp /></LocaleProvider>
      </MemoryRouter>,
    );
    let html = '';
    for await (const teil of prelude) html += String(teil);
    return parseHTML(`<!doctype html><html><body>${html}</body></html>`).document;
  } finally {
    zwang.schritt = null;
    mappenZwang.beispiel = null;
    delete g.localStorage;
  }
}

const txt = (el: Element | null | undefined): string => (el?.textContent ?? '').replace(/\s+/g, ' ').trim();

/** Schrittname = Knopftext ohne die vorangestellte Marke (Ziffer oder ✓). */
function schrittLabel(knopf: Element): string {
  const marke = knopf.firstElementChild;
  const voll = txt(knopf);
  const m = txt(marke);
  return marke && /^(\d+|✓)$/.test(m) && voll.startsWith(m) ? voll.slice(m.length).trim() : voll;
}

function schrittleiste(doc: Document): { labels: string[]; aktiv: string | null } {
  const nav = doc.querySelector('nav[aria-label="Schritte"]');
  if (!nav) return { labels: [], aktiv: null };
  const knoepfe = [...nav.querySelectorAll('button')];
  const aktiv = knoepfe.find((b) => b.getAttribute('aria-current') === 'step');
  return { labels: knoepfe.map(schrittLabel), aktiv: aktiv ? schrittLabel(aktiv) : null };
}

const ausserhalbDokument = (el: Element) => !el.closest('[data-dokument]');

/** Export-relevante Knöpfe in Dokument-Reihenfolge (Wortlaut + Sperre),
 *  ohne Wiederholungen: die Vorschau steht bewusst zweimal im DOM (mobil
 *  einklappbar + Desktop klebend, wizard.tsx) — angeboten ist ein Knopf
 *  einmal, nicht je Platzierung. */
function exportKnoepfe(doc: Document): string[] {
  const alle = [...doc.querySelectorAll('button')]
    .filter(ausserhalbDokument)
    .map((b) => ({ t: txt(b), aus: b.hasAttribute('disabled') }))
    .filter(({ t }) => /PDF|DOCX|Word|kopieren|ZIP/i.test(t))
    .map(({ t, aus }) => (aus ? `${t} [gesperrt]` : t));
  return [...new Set(alle)];
}

function speicherHinweise(doc: Document): string[] {
  const treffer = [...doc.querySelectorAll('p')]
    .filter(ausserhalbDokument)
    .map(txt)
    .filter((t) => /Browser|gespeichert|Speicher/i.test(t));
  return [...new Set(treffer)];
}

type Flaeche = {
  titel: string;
  badge: string[];
  schritte: string[];
  zuruecksetzen: boolean;
  speicherHinweis: string[];
  /** Knöpfe im Start-Zustand (Schritt 1): Direkt-Export der Vorschau bzw.
   *  bei Nicht-Wizards die ganze Fläche. */
  knoepfeStart: string[];
  /** Knöpfe im letzten Schritt (nur Wizards). */
  knoepfeLetzterSchritt?: string[];
  /** Mappen: Dokument-Reiter (role=tab) im Endzustand. */
  reiter?: string[];
  /** Checkliste: nummerierte Punkte und Kennzahl-Titel. */
  checkliste?: string[];
  docxKnopf: boolean;
  kopierKnopf: boolean;
};

async function erfasse(v: Variante): Promise<Flaeche> {
  const start = await rendere(v.href, v.speicher, null, v.mappe);
  const leiste = schrittleiste(start);
  const f: Flaeche = {
    titel: txt(start.querySelector('h1')),
    badge: [...start.querySelectorAll('[data-formgate]')].map(txt),
    schritte: leiste.labels,
    zuruecksetzen: [...start.querySelectorAll('button')].some((b) => /Eingaben zurücksetzen/.test(txt(b))),
    speicherHinweis: speicherHinweise(start),
    knoepfeStart: exportKnoepfe(start),
    docxKnopf: false,
    kopierKnopf: false,
  };
  let ende = start;
  if (leiste.labels.length > 0) {
    ende = await rendere(v.href, v.speicher, leiste.labels.length - 1, v.mappe);
    const l2 = schrittleiste(ende);
    // Der Zwang muss gegriffen haben — sonst prüfte der Test den falschen Schritt.
    if (l2.aktiv !== leiste.labels[leiste.labels.length - 1]) {
      throw new Error(`${v.name}: letzter Schritt nicht erreicht (aktiv: ${l2.aktiv})`);
    }
    f.knoepfeLetzterSchritt = exportKnoepfe(ende);
  }
  const reiter = [...ende.querySelectorAll('[role="tab"]')].map(txt);
  if (reiter.length > 0) f.reiter = reiter;
  if (leiste.labels.length === 0 && reiter.length === 0) {
    const punkte = [...start.querySelectorAll('ol > li')].filter(ausserhalbDokument).map(txt);
    if (punkte.length > 0) f.checkliste = punkte;
  }
  const endKnoepfe = f.knoepfeLetzterSchritt ?? f.knoepfeStart;
  f.docxKnopf = endKnoepfe.some((t) => /DOCX|Word/.test(t));
  f.kopierKnopf = endKnoepfe.some((t) => /kopieren/i.test(t));
  return f;
}

describe('V0 · Flächen-Ratsche der gebauten Vorlagen (W2·29-WERKBANK-VORLAGEN)', () => {
  const ist: Record<string, Flaeche> = {};

  beforeAll(async () => {
    for (const v of varianten()) ist[v.name] = await erfasse(v);
    if (SCHREIBEN) writeFileSync(FIXTURE, JSON.stringify(ist, null, 2) + '\n', 'utf8');
  }, 120_000);

  afterAll(() => { zwang.schritt = null; });

  it('Fixture existiert (sonst: VORLAGEN_FLAECHEN_SCHREIBEN=1)', () => {
    expect(existsSync(FIXTURE)).toBe(true);
  });

  it('Routenmenge = Katalog (Status ≠ geplant) + 3 AV-Untertypen + 3 Mappen-Beispiele + VA beurkundet', () => {
    const soll = JSON.parse(readFileSync(FIXTURE, 'utf8')) as Record<string, Flaeche>;
    expect(Object.keys(ist).sort()).toEqual(Object.keys(soll).sort());
  });

  it('jede Fläche ist gleich dem eingefrorenen Stand', () => {
    const soll = JSON.parse(readFileSync(FIXTURE, 'utf8')) as Record<string, Flaeche>;
    for (const name of Object.keys(soll)) {
      expect(ist[name], name).toEqual(soll[name]);
    }
  });

  it('DOCX-Knopf ⇔ docxAktiv(Karte) — Abweichungen nur mit Beleg', () => {
    const befund: string[] = [];
    for (const k of vorlagenKarten()) {
      // Mappen: das Gate zeigt sich erst mit Dokumenten → Beispiel-Variante.
      const f = ist[k.href! + MAPPE_SUFFIX] ?? ist[k.href!];
      const soll = docxAktiv(k);
      if (f.docxKnopf !== soll && !DOCX_ABWEICHUNG[k.href!]) {
        befund.push(`${k.href}: Knopf ${f.docxKnopf}, docxAktiv ${soll}`);
      }
      if (DOCX_ABWEICHUNG[k.href!]) {
        // Eine Ausnahme darf nie DOCX ZEIGEN, wo das Gate es verbietet.
        expect(soll, k.href).toBe(true);
        expect(f.docxKnopf, k.href).toBe(false);
      }
    }
    expect(befund).toEqual([]);
    expect(ist['/vorlagen/vorsorgeauftrag#oeffentlich_beurkundet'].docxKnopf).toBe(true);
  });
});
