// ─── R3 · Export-Ratsche über die Rechner MIT Ergebnis (W2·29-WERKBANK-RECHNER) ──
//
// ZWECK: Schwester der R0-Flächen-Ratsche (rechner-flaechen-ratsche.test.tsx).
// Die R0-Ratsche rendert jede Route ohne Query — dort erscheint die Exportzeile
// nur, wo die Vorgabewerte schon ein Ergebnis tragen. Diese Ratsche rendert
// zusätzlich je Rechner mit Permalink eine gültige Beispiel-Query (samt Reiter-
// Hash) und friert die Exportzeile ein (DESIGN-REGLEMENT §R-5, Inventar 4.3 R5):
//   · folge: Aktenzeichen-Feld und Export-Knöpfe in Dokument-Reihenfolge,
//   · je Knopf die Props, die er vom Formular bekommt (ICS: Titel, Datei,
//     Vorfrist, Beschreibung, Aktenzeichen, Query-Ergebnis; PDF: Kennung +
//     SHA-256 der Konfiguration; Teilen: Query-Ergebnis) und die Klasse der
//     umgebenden Zeile,
//   · knoepfe: alle Knopftexte der Seite in Dokument-Reihenfolge.
// Eigene Datei statt Erweiterung der R0-Datei: die Sonden laufen über vi.mock,
// und vi.mock wirkt dateiweit — die R0-Fixture bliebe sonst nicht byte-gleich.
//
// SONDEN: die drei Export-Knöpfe werden über vi.mock UMHÜLLT, nicht ersetzt —
// vor jedem echten Knopf steht ein `<i data-probe>` mit seinen Props.
// ADRESSZEILE: die Formulare lesen den Permalink aus `window.location.search`
// (usePermalinkFelder); im Node-Lauf wird dafür ein minimales `window` gesetzt.
// UHR: fest auf den 1.3.2026, 12:00 wie R0.
//
// FIXTURE: src/tests/fixtures/rechner-export.json, erzeugt mit
// `RECHNER_EXPORT_SCHREIBEN=1 npx vitest run src/tests/rechner-export-ratsche.test.tsx`.
// Ohne die Variable ist der Test streng. Neu erzeugen ist eine deklarierte
// Änderung (§6.3) mit Begründung im auslösenden Commit.
//
// DEKLARIERTE ÄNDERUNG (W2·29-WERKBANK-RECHNER R5a, 24.9.2026, §6.3): die vier
// Kosten-Rechner (Prozesskosten, Notariat/Grundstückkauf, Beurkundung,
// Grundbuch-Eintragung) nutzen ErgebnisExport. «Teilen» wandert aus der
// Schalterzeile hinter Aktenzeichen und PDF (§R-5); Props (Query, PDF-SHA)
// byte-gleich; bei Beurkundung Baurecht BS (Tarif offen, kein PDF) kommt das
// Aktenzeichen-Feld hinzu. Fixture neu erzeugt, Diff im Commit-Body.
import { describe, it, expect, vi, beforeAll, afterAll, afterEach } from 'vitest';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { prerenderToNodeStream } from 'react-dom/static';
import { MemoryRouter } from 'react-router-dom';
import { parseHTML } from 'linkedom';
import { LocaleProvider } from '../components/locale';
import { ROUTEN_MANIFEST } from '../routesManifest';

vi.mock('../components/IcsExportButton', async (orig) => {
  const m = await orig<typeof import('../components/IcsExportButton')>();
  // Schlüssel sortiert: die Reihenfolge der JSX-Attribute ist kein Verhalten.
  const Ics = (p: Parameters<typeof m.IcsExportButton>[0]) => {
    const props: Record<string, unknown> = { ...p, query: p.query?.() };
    const sortiert = Object.fromEntries(Object.keys(props).sort().map((k) => [k, props[k]]));
    return <><i data-probe="ICS" data-props={JSON.stringify(sortiert)} /><m.IcsExportButton {...p} /></>;
  };
  return { ...m, IcsExportButton: Ics };
});
vi.mock('../components/PdfExport', async (orig) => {
  const m = await orig<typeof import('../components/PdfExport')>();
  const { createHash } = await import('node:crypto');
  const Pdf = (p: Parameters<typeof m.PdfExportButton>[0]) => {
    const { title, fileBase, domain, aktenzeichen } = p.config;
    const sha = createHash('sha256').update(JSON.stringify(p.config)).digest('hex').slice(0, 16);
    return <><i data-probe="PDF" data-props={JSON.stringify({ title, fileBase, domain, aktenzeichen, sha })} /><m.PdfExportButton {...p} /></>;
  };
  return { ...m, PdfExportButton: Pdf };
});
vi.mock('../components/LinkTeilenButton', async (orig) => {
  const m = await orig<typeof import('../components/LinkTeilenButton')>();
  const Teilen = (p: Parameters<typeof m.LinkTeilenButton>[0]) => (
    <><i data-probe="Teilen" data-props={JSON.stringify({ query: p.query() })} /><m.LinkTeilenButton {...p} /></>
  );
  return { ...m, LinkTeilenButton: Teilen };
});

const FIXTURE = join(__dirname, 'fixtures', 'rechner-export.json');
const SCHREIBEN = process.env.RECHNER_EXPORT_SCHREIBEN === '1';
const AKTENZEICHEN = 'input[placeholder="z. B. 2026-014 MUS"]';

// Beispiel-Queries je Rechner mit Permalink (Parameter: die Link-Specs in
// src/lib/rechnerPermalinks.ts und src/components/forms/*). Reiter per Hash.
const VARIANTEN: string[] = [
  '/rechner/kuendigung?vb=2020-01-01&z=2026-02-10&kp=arbeitgeber#kuendigung',
  '/rechner/zpo-fristen?e=2026-02-10&u=tage&l=30&v=ordentlich&k=BS&n=gesetzlich',
  '/rechner/tagerechner?e=2026-02-10&u=tage&l=30&v=ordentlich&k=BS&n=gesetzlich#zpo',
  '/rechner/bgg-fristen?w=zivil&g=schuldrecht&o=endentscheid&v=1&s=50000&e=2026-02-10&k=BS',
  '/rechner/streitwert?b=%5B%7B%22typ%22%3A%22einmalig%22%2C%22betrag%22%3A%2212000%22%7D%5D',
  '/rechner/betreibungskosten?f=12000&zb=1',
  '/rechner/prozesskosten?kt=BS&sw=50000&ph=entscheid',
  '/rechner/notariat-grundbuch?kt=BS&kp=500000',
  '/rechner/notariat-grundbuch?ga=baurecht&kt=BS&gw=500000',
  '/rechner/notariat-grundbuch?ea=grundpfand&kt=BS&gw=500000',
  // R5a (24.9.2026): Beurkundung MIT PDF-Zustand. Baurecht BS liefert status
  // 'offen' (Tarif in Recherche) → kein PDF, nur «Teilen»; Baurecht ZH ist
  // wertbasiert belegt (berechneBeurkundung → status 'ok') und erreicht die
  // volle Exportzeile.
  '/rechner/notariat-grundbuch?ga=baurecht&kt=ZH&gw=500000',
  '/rechner/tagerechner?e=2026-02-10&u=tage&l=10&m=schkg_betreibungsferien&n=frist&k=BS#schkg',
  // R5a: Ratschen-Lücke aus der R3-Gegenprüfung — Reiter #allgemein mit
  // Beispiel-Query (Parameter: fristQueryKodieren, src/lib/allgemeineFrist.ts).
  '/rechner/tagerechner?s=2026-02-10&l=30&e=tage&w=1&f=1&k=BS#allgemein',
  '/rechner/zustaendigkeit?ss=geldforderung&vr=1&sw=50000&k=BS&g=Basel&pl=4051&sch=8',
  '/rechner/zustaendigkeit?ss=geldforderung&vr=1&sw=50000&k=BS&in=rechtsmittel&ro=endentscheid&rv=ordentlich_vereinfacht&ri=erstinstanz&sch=8',
  '/rechner/zustaendigkeit?sa=betreibung_einleiten&sst=natuerlich_wohnsitz&spf=kein&sfo=12000&spl=4051&skt=BS&sgm=Basel#schkg',
  '/rechner/zustaendigkeit?tan=anzeige&tat=bekannt&tkt=BS#straf',
  '/rechner/zustaendigkeit?tan=rechtsmittel&tre=urteil_erstinstanz&trw=beschuldigte_person&trz=umfassend&trk=BS#straf',
];

const ROUTEN = ROUTEN_MANIFEST.map((r) => r.pfad).filter((p) => /^\/rechner\/[a-z0-9-]+$/.test(p));
const HREFS = [...ROUTEN, ...VARIANTEN];

interface Export {
  folge: string[];
  zeilen: string[];
  knoepfe: string[];
}

const txt = (el: Element | null | undefined): string => (el?.textContent ?? '').replace(/\s+/g, ' ').trim();

async function erfasse(href: string): Promise<Export> {
  const u = new URL(href, 'https://lexmetrik.ch');
  const eintrag = ROUTEN_MANIFEST.find((r) => r.pfad === u.pathname);
  if (!eintrag) throw new Error(`kein Manifest-Eintrag für ${u.pathname}`);
  vi.stubGlobal('window', { location: { search: u.search, hash: u.hash, pathname: u.pathname, origin: u.origin } });
  const { prelude } = await prerenderToNodeStream(
    <MemoryRouter initialEntries={[u.pathname + u.search + u.hash]}>
      <LocaleProvider><eintrag.Comp /></LocaleProvider>
    </MemoryRouter>,
  );
  let html = '';
  for await (const teil of prelude) html += String(teil);
  const doc = parseHTML(`<!doctype html><html><body>${html}</body></html>`).document;
  const folge = [...doc.querySelectorAll(`[data-probe], ${AKTENZEICHEN}`)].map((el) =>
    el.matches(AKTENZEICHEN) ? 'Aktenzeichen' : `${el.getAttribute('data-probe')} ${el.getAttribute('data-props')}`);
  return {
    folge,
    zeilen: [...doc.querySelectorAll('[data-probe]')].map((el) => `${el.getAttribute('data-probe')} in «${el.parentElement?.getAttribute('class') ?? ''}»`),
    knoepfe: [...doc.querySelectorAll('button')].map(txt).filter(Boolean),
  };
}

describe('R3 · Rechner-Export-Ratsche (W2·29-WERKBANK-RECHNER)', () => {
  beforeAll(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-03-01T12:00:00'));
  });
  afterEach(() => { vi.unstubAllGlobals(); });
  afterAll(() => { vi.useRealTimers(); });

  it('jede Route (mit und ohne Beispiel-Query) rendert die eingefrorene Exportzeile', async () => {
    const ist: Record<string, Export> = {};
    for (const href of HREFS) {
      ist[href] = await erfasse(href);
      vi.unstubAllGlobals();
    }
    if (SCHREIBEN) {
      writeFileSync(FIXTURE, JSON.stringify(ist, null, 2) + '\n');
      return;
    }
    expect(existsSync(FIXTURE), 'Fixture fehlt — mit RECHNER_EXPORT_SCHREIBEN=1 erzeugen').toBe(true);
    const soll = JSON.parse(readFileSync(FIXTURE, 'utf8')) as Record<string, Export>;
    expect(Object.keys(ist)).toEqual(Object.keys(soll));
    for (const href of HREFS) expect(ist[href], href).toEqual(soll[href]);
  }, 180_000);

  it('jede Beispiel-Query erreicht eine Exportzeile (sonst prüft die Ratsche nichts)', () => {
    const soll = JSON.parse(readFileSync(FIXTURE, 'utf8')) as Record<string, Export>;
    for (const href of VARIANTEN) expect(soll[href]?.folge.some((f) => f.startsWith('PDF') || f.startsWith('Teilen')), href).toBe(true);
  });
});
