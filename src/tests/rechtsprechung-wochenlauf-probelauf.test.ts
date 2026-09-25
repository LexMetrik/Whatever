// Wochenlauf-Reparatur nach dem Probelauf 25.9.2026 (Actions-Lauf 36170527404,
// Entwurfs-PR #1129) — je Muss-Punkt M1–M8 ein Block. Jeder Block nennt die
// Mutation, die ihn rot macht (Rot-Beweis in der Bau-Rückgabe).
import { describe, it, expect, vi, afterEach } from 'vitest';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import {
  kindUmgebung, oclUrsachen, erkenneAusfaelle, pruefeText, entscheide, AUSGENOMMEN, DATUM_VOLLPRUEFUNG, aktiveGerichte,
  KANTONS_GERICHTE, type Lage, type RegEintrag, type StichprobenZeile,
} from '../../scripts/rechtsprechung/wochenlauf-kern';
import { fehlerKlasse, holeSeite, stichprobeZeile } from '../../scripts/rechtsprechung/wochenlauf-netz';
import { vollpruefungOffen } from '../../scripts/rechtsprechung/wochenlauf-vorwoche';
import { jget, atomIds, OCL_ABRUF } from '../../scripts/normtext/ocl-abruf';
import { sachgebietFuerEntscheid } from '../../scripts/normtext/sachgebiet-klassierung';
import { mappeEntscheidOCL, type OclDecision } from '../../scripts/normtext/adapter-entscheide';
import { MEHRWORT_KUERZEL, verbindeMehrwortKuerzel } from '../../scripts/normtext/mehrwort-kuerzel';
import { normKeyFuerAbk, normalisiereAbk, normKeysVonSnapshot, artikelSchluesselVonSnapshot } from '../../scripts/normtext/entscheide-mapping';
import { extrahiereStatutRefs } from '../lib/rechtsprechung/zitat-extraktion';
import { ABK_ALIASE } from '../lib/normtext/abk-aliase.generated';
import type { EntscheidSnapshot } from '../lib/rechtsprechung/typen';

const e = (key: string, gericht: string, datum: string, x: Partial<RegEintrag> = {}): RegEintrag => ({ key, gericht, datum, ...x });
const gruen: Lage = {
  inhaltsDiff: true, quellenAus: [], toreRot: [], nachbauRot: [], mergeSchutzSperrt: true,
  stichprobe: [{ key: 'a', url: null, ergebnis: 'treffer', detail: '' }], unerwartet: [], budgetUeber: [], vorwocheVerworfen: null,
};
const cli = readFileSync('scripts/rechtsprechung/wochenlauf.ts', 'utf8');
afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });

describe('M1 · Kind-Prozesse ohne geerbtes NODE_ENV', () => {
  // Mutation: `delete out.NODE_ENV` in kindUmgebung entfernen ⇒ rot.
  it('NODE_ENV fällt weg, alles andere bleibt, Eingabe unverändert', () => {
    const ein = { NODE_ENV: 'development', PATH: '/bin', GH_TOKEN: 'x' };
    const aus = kindUmgebung(ein);
    expect('NODE_ENV' in aus).toBe(false);
    expect(aus).toEqual({ PATH: '/bin', GH_TOKEN: 'x' });
    expect(ein.NODE_ENV).toBe('development');
  });
  it('echter Kind-Prozess sieht kein NODE_ENV (vite-node setzte development)', () => {
    const env = kindUmgebung({ ...process.env, NODE_ENV: 'development' });
    const out = execFileSync(process.execPath, ['-e', 'process.stdout.write(String(process.env.NODE_ENV))'], { env, encoding: 'utf8' });
    expect(out).toBe('undefined');
  });
  it('CLI: fuehreAus spawnt mit kindUmgebung(process.env)', () => {
    expect(cli).toMatch(/spawn\(cmd, args, \{ stdio: \['ignore', 'pipe', 'pipe'\], env: kindUmgebung\(process\.env\) \}\)/);
  });
});

describe('M2 · bvger-IDs mit «-» und jget meldet statt still null', () => {
  // Mutation: atomIds zurück auf `${court}_[A-Za-z0-9_]+` ⇒ bvger_A statt bvger_A-1851_2026.
  const atom = readFileSync('src/tests/fixtures/ocl-atom-bvger-auszug.xml', 'utf8'); // echter Feed, Abruf 25.9.2026
  it('Atom-Auszug: volle IDs, nur das angefragte Gericht', () => {
    expect(atomIds(atom, 'bvger')).toEqual(['bvger_C-706_2026', 'bvger_F-6436_2026', 'bvger_A-1851_2026']);
    expect(atomIds(atom, 'bstger')).toEqual([]);
    // bstger-IDs tragen Punkte (Feed-Zeile bstger.xml, 25.9.2026)
    expect(atomIds('<id>https://mcp.opencaselaw.ch/entscheid/bstger_BB.2026.11</id>', 'bstger')).toEqual(['bstger_BB.2026.11']);
  });
  it('404 ⇒ null (Semantik bleibt) + Zeile mit Präfix am Zeilenanfang', async () => {
    // Mutation: console.warn im 404-Zweig entfernen ⇒ keine Zeile.
    vi.stubGlobal('fetch', vi.fn(async () => new Response('', { status: 404 })));
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(await jget('https://mcp.opencaselaw.ch/api/decisions/bvger_A')).toBeNull();
    expect(warn.mock.calls.map((c) => String(c[0]))).toEqual([`${OCL_ABRUF} HTTP 404 · https://mcp.opencaselaw.ch/api/decisions/bvger_A`]);
  });
  it('5xx bis zum letzten Versuch ⇒ null + Status in der Zeile', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('', { status: 503 })));
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(await jget('https://x/liste', 1)).toBeNull();
    expect(String(warn.mock.calls[0][0])).toBe(`${OCL_ABRUF} null nach 1 Versuchen (HTTP 503) · https://x/liste`);
  });
  it('Zeilen sind kein Ausfall; der Bericht holt sie nur zeilenanfang-verankert', () => {
    // Mutation: Anker ^ in oclUrsachen entfernen ⇒ die npm-Kopfzeile käme mit (Lehre A1).
    const log = `> vite-node x.ts -- --grep="${OCL_ABRUF} HTTP"\n${OCL_ABRUF} HTTP 404 · u1\n${OCL_ABRUF} null nach 3 Versuchen (Zeitlimit 60 s) · u2\n`;
    expect(erkenneAusfaelle(log)).toEqual([]);
    expect(oclUrsachen(log)).toEqual([`${OCL_ABRUF} HTTP 404 · u1`, `${OCL_ABRUF} null nach 3 Versuchen (Zeitlimit 60 s) · u2`]);
    expect(cli).toMatch(/ausfaelle: aus\.length \|\| r\.code !== 0 \? \[\.\.\.aus, \.\.\.oclUrsachen\(r\.log\)\] : aus/);
  });
});

describe('M3 · Aktenzeichen: verbundene Verfahren und BE-Punkte, nie Präfix', () => {
  const fueller = `\n${'Erwägung '.repeat(80)}`;
  const bv = `Decisione del 21 agosto 2026\nCorte dei reclami penali\nNumero dell’incarto: BV.2026.10-11\nBV.2026.10-11${fueller}`;
  const rr = `Arrêt du 26 août 2026\nCour des plaintes\nNuméros de dossiers: RR.2025.198-199\nRR.2025.198-199${fueller}`;
  it('BStGer-Kopfzeilen (bv10.pdf, rr198.pdf) ⇒ Treffer', () => {
    // Mutation: Bereichsendung `(?:[-/]\s?\d+)?` aus grenze entfernen ⇒ Fehltreffer (Probelauf #1129).
    expect(pruefeText(bv, e('bstger_BV_2026_10', 'bstger', '2026-08-21', { nummer: 'BV.2026.10' }), 'pdf')).toMatchObject({ treffer: true, akz: true, datum: true });
    expect(pruefeText(rr, e('bstger_RR_2025_198', 'bstger', '2026-08-26', { nummer: 'RR.2025.198' }), 'pdf')).toMatchObject({ treffer: true, akz: true, datum: true });
  });
  it('nie ein Präfix: BV.2026.1 trifft BV.2026.10-11 nicht, RR.2025.19 nicht RR.2025.198-199', () => {
    expect(pruefeText(bv, e('k', 'bstger', '2026-08-21', { nummer: 'BV.2026.1' }), 'pdf')).toMatchObject({ treffer: false, akz: false });
    expect(pruefeText(rr, e('k', 'bstger', '2026-08-26', { nummer: 'RR.2025.19' }), 'pdf')).toMatchObject({ treffer: false, akz: false });
    expect(pruefeText(`Urteil vom 1. Juli 2026\nBV.2026.10${fueller}`, e('k', 'bstger', '2026-07-01', { nummer: 'BV.2026.1' }), 'pdf').akz).toBe(false);
  });
  it('BE: Punkte ≙ Leerzeichen, «/143U» (Nrn., Verfahrensart) — eng', () => {
    // Mutation: `(?:\s+|\.)` zurück auf `\s+` ⇒ «100.2025.363» nicht gefunden.
    const be = (nr: string, t: string, g = 'be_verwaltungsgericht') => pruefeText(`Urteil vom 13. Juli 2026\n${t}${fueller}`, e('k', g, '2026-07-13', { nummer: nr }), 'pdf').akz;
    expect(be('100 2025 363', 'VGE 100.2025.363')).toBe(true);
    expect(be('100 2026 142', '100.2026.142/143U')).toBe(true); // PDF-Kopf be_verwaltungsgericht_1002026142
    expect(be('100 2026 142', 'Nrn. 100.2026.142/\n143')).toBe(true); // Zeilenumbruch nach dem Trenner
    expect(be('100 2026 14', '100.2026.142/143U')).toBe(false);
    expect(be('100 2025 36', '100.2025.363')).toBe(false);
    expect(be('100 2026 142', '100.2026.142/143U', 'zh_obergericht')).toBe(false); // Buchstabe nur für BE
  });
});

describe('M4 · «nicht prüfbar» nennt Status bzw. Fehlerklasse', () => {
  it('Fehlerklassen: Timeout, TLS, Netz', () => {
    expect(fehlerKlasse(Object.assign(new Error('x'), { name: 'TimeoutError' }))).toBe('Timeout');
    expect(fehlerKlasse(new TypeError('fetch failed', { cause: Object.assign(new Error('c'), { code: 'CERT_HAS_EXPIRED' }) }))).toBe('TLS CERT_HAS_EXPIRED');
    expect(fehlerKlasse(new TypeError('fetch failed', { cause: Object.assign(new Error('c'), { code: 'ECONNRESET' }) }))).toBe('Netz ECONNRESET');
  });
  it('HTTP 403 ⇒ Bericht-Detail «Quelle nicht erreichbar — HTTP 403»', async () => {
    // Mutation: in holeSeite `fehler = \`HTTP ${r.status}\`` entfernen ⇒ «keine Quell-URL».
    vi.stubGlobal('fetch', vi.fn(async () => new Response('', { status: 403 })));
    expect(await holeSeite(['https://www.vg-urteile.apps.be.ch/x'])).toEqual({ fehler: 'HTTP 403' });
    const z = await stichprobeZeile(e('be_verwaltungsgericht_1', 'be_verwaltungsgericht', '2026-07-13', { quelleUrl: 'https://www.vg-urteile.apps.be.ch/x' }));
    expect(z).toMatchObject({ ergebnis: 'nicht-pruefbar', detail: 'Quelle nicht erreichbar — HTTP 403' });
  });
});

describe('M5 · Kantonale Aktenzeichen-Präfixe nur für kantonale Gerichte', () => {
  const sg = (docket: string, kanton: string, legalArea: string | null) =>
    sachgebietFuerEntscheid({ hint: null, docket, normKeys: [], zitierteNormen: [], legalArea, kanton });
  it('BStGer BV.2026.10 (legal_area criminal, OCL 25.9.2026) ⇒ straf, nicht Sozialversicherung', () => {
    // Mutation: Kanton-Weiche entfernen ⇒ «BV» = berufliche Vorsorge ⇒ sozialversicherung (Tor B).
    expect(sg('BV.2026.10', 'CH', 'criminal')).toBe('straf');
    expect(sg('SK.2025.57', 'CH', 'criminal')).toBe('straf'); // einziger Bundes-Eintrag, der bisher über die Tabelle lief — Ergebnis gleich
  });
  it('kantonal bleibt die Tabelle massgeblich', () => {
    expect(sg('BV.2025.5', 'BS', null)).toBe('sozialversicherung');
    expect(sg('SK 2024 12', 'ZH', 'civil')).toBe('straf');
  });
});

describe('M6 · «GebV SchKG» im Fliesstext erreichbar (SR 281.35)', () => {
  const snap = (text: string): EntscheidSnapshot => ({
    id: 'kanton/ZH/zh_obergericht/PS260265', gericht: 'zh_obergericht', gerichtName: 'Obergericht Zürich',
    gerichtstyp: 'kantonal', kanton: 'ZH', abteilung: null, nummer: 'PS260265', bgeReferenz: null, zitierung: 'x', datum: '2026-08-01',
    sprache: 'de', leitcharakter: 'routine', sachgebiet: 'privat', legalArea: null, rubrum: null, regeste: null, regesteAmtlich: false,
    abschnitte: [{ typ: 'erwaegung', bloecke: [{ marke: 'E. 3', text }] }], dispositivOrders: [], zitierteNormen: [], normKeys: [],
    zitierteEntscheide: [], bestand: 'snapshot', kuratierung: 'maschinell', quelle: 'opencaselaw', quelleUrl: 'https://www.gerichte-zh.ch', abgerufen: '2026-09-25',
    fassungsToken: 'h', sha: 's',
  } as EntscheidSnapshot);
  it('jede Form steht als Alias im Fedlex-Artefakt und löst auf (§5 — keine zweite Zuordnung)', () => {
    for (const k of MEHRWORT_KUERZEL) {
      expect(/\s/.test(k), k).toBe(true);
      expect(ABK_ALIASE.some((a) => a.abk === k), k).toBe(true);
      expect(normKeyFuerAbk(normalisiereAbk(k)), k).not.toBeNull();
    }
    expect(ABK_ALIASE.find((a) => a.abk === 'GebV SchKG')?.sr).toBe('281.35');
  });
  it('Produktpfad: normKeys und Artikel-Schlüssel tragen GEBV_SCHKG', () => {
    // Mutation: verbindeMehrwortKuerzel in fliesstextOhneApparat weglassen ⇒ Token GEBV, kein Key.
    const s = snap('Die Spruchgebühr richtet sich nach Art. 48 GebV SchKG.');
    expect(normKeysVonSnapshot(s)).toContain('GEBV_SCHKG');
    expect([...artikelSchluesselVonSnapshot(s)]).toContain('GEBV_SCHKG/48');
    expect(extrahiereStatutRefs('Art. 48 GebV SchKG').map((r) => r.gesetz)).toEqual(['GEBV']); // Extraktor selbst unverändert
  });
  it('eng: «GebV OG» (ZH LS 211.11) und verklebte Formen bleiben unberührt', () => {
    expect(verbindeMehrwortKuerzel('§ 4 GebV OG')).toBe('§ 4 GebV OG');
    expect(verbindeMehrwortKuerzel('GebV SchKGentspricht')).toBe('GebV SchKGentspricht');
    expect(verbindeMehrwortKuerzel('Art. 48 GebV\nSchKG')).toBe('Art. 48 GebVSchKG');
    expect(normKeysVonSnapshot(snap('Art. 3 GebV OG und Art. 48 GebV'))).not.toContain('GEBV_SCHKG');
  });
});

describe('M8 · BE ausgenommen; R2: Vollprüfungs-Gericht «nicht prüfbar» ⇒ Entwurf', () => {
  it('BE nicht nachgezogen, Grund mit Messung; Vollprüfungs-Regel bleibt für die Wiederaufnahme', () => {
    // Mutation: be_verwaltungsgericht aus AUSGENOMMEN streichen ⇒ rot.
    expect(AUSGENOMMEN.be_verwaltungsgericht).toBe('Datum aus OCL unzuverlässig — 5/12 Bestand falsch, Messung 25.9.2026');
    expect(aktiveGerichte(KANTONS_GERICHTE)).not.toContain('be_verwaltungsgericht');
    expect(DATUM_VOLLPRUEFUNG.has('be_verwaltungsgericht')).toBe(true);
  });
  const plan = [e('be_verwaltungsgericht_1002026142', 'be_verwaltungsgericht', '2026-08-18'), e('bvger_x', 'bvger', '2026-09-01')];
  const sp: StichprobenZeile[] = [
    { key: 'be_verwaltungsgericht_1002026142', url: null, ergebnis: 'nicht-pruefbar', detail: 'Quelle nicht erreichbar — HTTP 403' },
    { key: 'bvger_x', url: null, ergebnis: 'treffer', detail: '' },
  ];
  it('nur das Vollprüfungs-Gericht erzeugt den Grund; Entscheid «entwurf» trotz Treffer', () => {
    // Mutation: vollpruefungOffen nicht in entscheide() übernehmen ⇒ «pr» (Probelauf: 6/6 BE nicht prüfbar, kein Grund).
    const offen = vollpruefungOffen(plan, sp);
    expect(offen).toEqual(['BE: Datum nicht belegbar — be_verwaltungsgericht_1002026142']);
    expect(vollpruefungOffen(plan, sp.map((s) => ({ ...s, ergebnis: 'treffer' as const })))).toEqual([]);
    expect(entscheide({ ...gruen, stichprobe: sp, vollpruefungOffen: offen })).toEqual({ entscheid: 'entwurf', gruende: offen });
    expect(entscheide({ ...gruen, stichprobe: sp }).entscheid).toBe('pr');
  });
  it('CLI verdrahtet den Grund in den Entscheid', () => {
    expect(cli).toMatch(/vollOffen\.push\(\.\.\.vollpruefungOffen\(plan, sp\.out\)\)/);
    expect(cli).toMatch(/vollpruefungOffen: vollOffen/);
  });
});

describe('M7 · Workflow legt das Label in-pruefung an, bevor die Basis liest', () => {
  it('idempotent (--force), im Basis-Schritt vor wochenlauf-basis.ts', () => {
    // Mutation: Zeile entfernen oder hinter den Basis-Aufruf schieben ⇒ rot.
    const yml = readFileSync('.github/workflows/rechtsprechung-wochenlauf.yml', 'utf8');
    const i = yml.indexOf('gh label create in-pruefung --force');
    expect(i).toBeGreaterThan(yml.indexOf('name: Basis wählen'));
    expect(i).toBeLessThan(yml.indexOf('npx vite-node scripts/rechtsprechung/wochenlauf-basis.ts'));
  });
});

describe('M5 · Verdrahtung: mappeEntscheidOCL reicht den Kanton an die Klassierung', () => {
  // Nach-Verdikt #1130 (Merge #1126): kanton-Übergabe war nur direkt geprüft.
  // Mutation: `kanton: canton` in adapter-entscheide.ts auf 'ZH' oder 'CH' ⇒ rot.
  const det = (over: Partial<OclDecision>): OclDecision => ({
    decision_id: 'x', language: 'de', docket_number: 'BV.2026.10', decision_date: '2026-08-21',
    full_text: 'Entscheid BV.2026.10 vom 21. August 2026. Erwägungen folgen hier im Text.', ...over,
  } as OclDecision);
  it('bstger «BV.2026.10» (Verwaltungsstrafrecht) bleibt straf', () => {
    const s = mappeEntscheidOCL(det({ court: 'bstger', canton: 'CH', legal_area: 'criminal' }), null, '2026-09-25')!;
    expect(s.sachgebiet).toBe('straf');
  });
  it('kantonal «BV …» (berufliche Vorsorge) bleibt sozialversicherung', () => {
    const s = mappeEntscheidOCL(det({ court: 'zh_sozialversicherungsgericht', canton: 'ZH' }), null, '2026-09-25')!;
    expect(s.sachgebiet).toBe('sozialversicherung');
  });
});
