import { describe, it, expect, vi, afterEach } from 'vitest';
import { kantonsEntscheiddatum, kopfdatumRueckfallMeldung, holeAmtlicheKopfSeiten, kopfZurueckhalten, ausEigenemTitel, type Zurueckgehalten } from '../../scripts/normtext/entscheid-kantonsdatum';
import { bestandStattZurueckgehalten, zurueckhalteZeile, waehleNeue, fuehreAdditivZusammen, nachDatumDesc } from '../../scripts/normtext/entscheide-additiv';
import { readFileSync } from 'node:fs';
import { kopfdatumRefresh } from '../../scripts/normtext/entscheide-kopfdatum-refresh';
import { mappeEntscheidOCL, holeEntscheidOCL, type OclDecision } from '../../scripts/normtext/adapter-entscheide';

// QS-KORPUS, Nachzug 25.9.2026 — Befund (hoch): Beim Kopfdatum-Refresh antwortete der
// SG-Server für das amtliche PDF von UV 2025/14 erst nach 43 s (Grenze damals 30 s);
// der Refresh schrieb still das Plattformdatum 23.10.2025 über das Kopfdatum 21.10.2025.
// Echte Auszüge (OCL full_text / amtliches PDF, abgerufen 25.9.2026, gemeinfrei Art. 5 URG).
// Kein echtes Netz: `fetch` ist gemockt (vi.stubGlobal).
const OCL_KOPF = 'St.Gallen Versicherungsgericht 23.10.2025 UV 2025/14 Saint-Gall Versicherungsgericht 23.10.2025 UV 2025/14 San Gallo Versicherungsgericht 23.10.2025 UV 2025/14 Art. 6 Abs. 1 UVG; Art. 11 UVV; Leistungspflicht der Unfallversicherung';
const PDF_SEITEN = [
  'Publikationsplattform St.Galler Gerichte Fall-Nr.: UV 2025/14 Stelle: Versicherungsgericht Rubrik: UV - Unfallversicherung Publikationsdatum: 21.11.2025 Entscheiddatum: 23.10.2025',
  'Kanton St.Gallen Gerichte 1/16 Versicherungsgericht Abteilung III Entscheid vom 21. Oktober 2025 Besetzung Versicherungsrichter Michael Rutz (Vorsitz) Geschäftsnr. UV 2025/14 Parteien',
];
const PDF_URL = 'https://www.gerichte.sg.ch/entscheid/UV-2025-14.pdf';
const sg = (over: Partial<OclDecision> = {}): OclDecision => ({
  decision_id: 'sg_gerichte_UV_2025_14', court: 'sg_gerichte', canton: 'SG', language: 'de', docket_number: 'UV 2025/14',
  decision_date: '2025-10-23', full_text: OCL_KOPF, pdf_url: PDF_URL, content_hash: 'h', ...over,
} as OclDecision);
/** Bestand wie nach dem Refresh vom 25.9.2026: Kopfdatum 21.10.2025 (aus dem amtlichen PDF). */
const bestand = () => mappeEntscheidOCL(sg(), null, '2026-06-26', { amtlicheKopfSeiten: PDF_SEITEN, sprache: null })!;

/** Minimales einseitiges PDF (ASCII-Text), damit pdfjs echte Seiten liefert. */
function minimalPdf(text: string): ArrayBuffer {
  const inhalt = `BT /F1 12 Tf 72 700 Td (${text}) Tj ET`;
  const objs = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>',
    `<< /Length ${inhalt.length} >>\nstream\n${inhalt}\nendstream`,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
  ];
  let pdf = '%PDF-1.4\n';
  const off: number[] = [];
  objs.forEach((o, i) => { off.push(pdf.length); pdf += `${i + 1} 0 obj\n${o}\nendobj\n`; });
  const xref = pdf.length;
  pdf += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n${off.map((o) => `${String(o).padStart(10, '0')} 00000 n \n`).join('')}`;
  pdf += `trailer\n<< /Size ${objs.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return new TextEncoder().encode(pdf).buffer as ArrayBuffer;
}
/** fetch-Mock, der nur auf den Abbruch (AbortSignal) reagiert: ein Server, der nicht antwortet. */
const stumm = (abbrueche: number[]) => (_u: unknown, init?: RequestInit) => new Promise<Response>((_, rej) => {
  init?.signal?.addEventListener('abort', () => { abbrueche.push(Date.now()); rej(new Error('AbortError')); });
});

afterEach(() => { vi.unstubAllGlobals(); vi.useRealTimers(); vi.restoreAllMocks(); });

describe('Punkt 1 — Refresh: Plattformdatum überschreibt nie still ein Kopfdatum', () => {
  it('echt UV 2025/14: PDF fällt aus ⇒ ABBRUCH «PDF nicht verfügbar: 1», nichts geändert', async () => {
    const s = bestand();
    expect(s.datum).toBe('2025-10-21');
    const vorher = JSON.stringify(s);
    await expect(kopfdatumRefresh([s], { holeDecision: async () => sg(), holeSeiten: async () => null }))
      .rejects.toThrow(/ABBRUCH.*PDF nicht verfügbar: 1.*UV2025_14 \(PDF nicht verfügbar: 2025-10-21 → 2025-10-23/);
    expect(JSON.stringify(s)).toBe(vorher);
  });
  it('kein Kopf im OCL-Text, PDF fehlt ⇒ OCL-decision_date überschreibt ein korrigiertes Datum nicht (früherer Posten)', async () => {
    const s = bestand();
    const ohneKopf = sg({ full_text: 'Versicherungsgericht Leistungspflicht der Unfallversicherung', decision_date: '2025-11-21' });
    await expect(kopfdatumRefresh([s], { holeDecision: async () => ohneKopf, holeSeiten: async () => null }))
      .rejects.toThrow(/ABBRUCH.*PDF nicht verfügbar: 1.*2025-10-21 → 2025-11-21 aus ocl-decision_date/);
    expect(s.datum).toBe('2025-10-21');
  });
  it('PDF gelesen, aber ohne eigenen Titel ⇒ Plattformdatum ersetzt das Kopfdatum ebenfalls nicht', async () => {
    const s = bestand();
    await expect(kopfdatumRefresh([s], { holeDecision: async () => sg(), holeSeiten: async () => [PDF_SEITEN[0]] }))
      .rejects.toThrow(/ABBRUCH.*PDF nicht verfügbar: 0.*\(Plattformdatum ohne eigenen Titel: 2025-10-21 → 2025-10-23/);
    expect(s.datum).toBe('2025-10-21');
  });
  it('PDF fällt aus, Datum bliebe gleich ⇒ kein Abbruch, aber gezählt (pdfFehlt)', async () => {
    const s = { ...bestand(), datum: '2025-10-23' };
    const z = await kopfdatumRefresh([s], { holeDecision: async () => sg(), holeSeiten: async () => null });
    expect(z).toMatchObject([{ alt: '2025-10-23', neu: '2025-10-23', quelle: 'plattform-ohne-kopf', pdfFehlt: true }]);
  });
  it('Gegenprobe: PDF da ⇒ Kopfdatum bleibt, kein Abbruch', async () => {
    const s = bestand();
    const z = await kopfdatumRefresh([s], { holeDecision: async () => sg(), holeSeiten: async () => PDF_SEITEN });
    expect(z).toMatchObject([{ alt: '2025-10-21', neu: '2025-10-21', quelle: 'kopf-amtliches-pdf', pdfFehlt: false }]);
  });
});

describe('Punkt 2 — Live-Import: fehlendes PDF ist erkennbar (Quelle plattform-ohne-kopf)', () => {
  it('Plattform-Kopfzeile ohne PDF ⇒ Quelle plattform-ohne-kopf, pdfFehlt, Meldung «PDF nicht verfügbar»', () => {
    const r = kantonsEntscheiddatum(sg(), null);
    expect(r).toMatchObject({ datum: '2025-10-23', quelle: 'plattform-ohne-kopf', pdfFehlt: true });
    expect(kopfdatumRueckfallMeldung(sg(), r)).toBe('[kopfdatum] Rückfall auf Plattformdatum 2025-10-23: sg_gerichte UV 2025/14 — kopfzeile-datum-az=2025-10-23 im OCL-Kopf ohne eigenen Titel; amtliches PDF nicht verfügbar');
    // PDF da ⇒ nichts davon
    expect(kantonsEntscheiddatum(sg(), PDF_SEITEN)).toMatchObject({ quelle: 'kopf-amtliches-pdf' });
    expect(kantonsEntscheiddatum(sg(), PDF_SEITEN).pdfFehlt).toBeUndefined();
  });
  it('holeEntscheidOCL: PDF antwortet nicht ⇒ Meldung; mit nurMitAmtlichemKopf ⇒ null (zurückgehalten)', async () => {
    const pdfAbrufe: string[] = [];
    vi.stubGlobal('fetch', async (u: string) => {
      if (u === PDF_URL) { pdfAbrufe.push(u); throw new TypeError('fetch failed'); }
      if (u.includes('/decisions/')) return new Response(JSON.stringify(sg()), { status: 200 });
      return new Response('', { status: 404 });
    });
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const s = await holeEntscheidOCL('sg_gerichte_UV_2025_14', '2026-09-25', { sprache: null });
    expect(s?.datum).toBe('2025-10-23');
    expect(warn.mock.calls.map((c) => String(c[0])).filter((m) => m.startsWith('[kopfdatum] Rückfall'))).toEqual([
      '[kopfdatum] Rückfall auf Plattformdatum 2025-10-23: sg_gerichte UV 2025/14 — kopfzeile-datum-az=2025-10-23 im OCL-Kopf ohne eigenen Titel; amtliches PDF nicht verfügbar',
    ]);
    expect(await holeEntscheidOCL('sg_gerichte_UV_2025_14', '2026-09-25', { sprache: null, nurMitAmtlichemKopf: true })).toBeNull();
    expect(pdfAbrufe.length).toBeGreaterThan(0);
    expect(pdfAbrufe.every((u) => u === PDF_URL)).toBe(true); // nur die amtliche Quelle
  }, 15_000);
});

describe('Punkt 3 — Abruf des amtlichen PDF: Grenze 60 s, ein neuer Versuch', () => {
  it('Zeitgrenze 60 s je Versuch, danach genau ein neuer Versuch derselben URL', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date'] });
    const abbrueche: number[] = [];
    const urls: string[] = [];
    const mock = stumm(abbrueche);
    vi.stubGlobal('fetch', (u: string, init?: RequestInit) => { urls.push(u); return mock(u, init); });
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    const p = holeAmtlicheKopfSeiten(PDF_URL);
    await vi.advanceTimersByTimeAsync(59_999);
    expect(abbrueche).toHaveLength(0); // 43 s (SG, 25.9.2026) hätten gereicht
    await vi.advanceTimersByTimeAsync(2);
    expect(abbrueche).toHaveLength(1);
    await vi.advanceTimersByTimeAsync(70_000);
    expect(await p).toBeNull();
    expect(abbrueche).toHaveLength(2);
    expect(urls).toEqual([PDF_URL, PDF_URL]);
  });
  it('Netzfehler beim ersten Versuch, PDF beim zweiten ⇒ Seiten', async () => {
    let n = 0;
    vi.stubGlobal('fetch', async () => {
      if (n++ === 0) throw new TypeError('fetch failed');
      return new Response(minimalPdf('Entscheid vom 21. Oktober 2025 UV 2025/14'), { status: 200 });
    });
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    const seiten = await holeAmtlicheKopfSeiten(PDF_URL, { pauseMs: 0 });
    expect(n).toBe(2);
    expect(seiten?.join(' ')).toMatch(/Entscheid vom 21\. Oktober 2025 UV 2025\/14/);
  });
  it('HTTP 404 ⇒ kein neuer Versuch', async () => {
    let n = 0;
    vi.stubGlobal('fetch', async () => { n++; return new Response('nicht gefunden', { status: 404 }); });
    expect(await holeAmtlicheKopfSeiten(PDF_URL, { pauseMs: 0 })).toBeNull();
    expect(n).toBe(1);
  });
});

describe('Punkt 4 — Kopf-Grenze auch für Seiten MIT eigenem Aktenzeichen', () => {
  it('Titel weit hinten auf einer Folgeseite mit Aktenzeichen (Zitat im Fliesstext) ist kein Kopfdatum', () => {
    const folge = `UV 2025/14 2/16 ${'Fliesstext ohne Stoppwort '.repeat(17)}. Urteil vom 5. März 2025 der Vorinstanz`;
    const r = kantonsEntscheiddatum(sg(), [PDF_SEITEN[0], folge]);
    expect(r.datum).not.toBe('2025-03-05');
    expect(r).toMatchObject({ datum: '2025-10-23', quelle: 'plattform-ohne-kopf' }); // Befund C: kein eigener Titel gelesen
    // derselbe Titel im Seitenkopf zählt weiterhin
    expect(kantonsEntscheiddatum(sg(), [PDF_SEITEN[0], 'UV 2025/14 2/16 Urteil vom 5. März 2025 Besetzung'])).toMatchObject({ datum: '2025-03-05', quelle: 'kopf-amtliches-pdf' });
  });
});

// Dritte Gegenprüfung 25.9.2026 (QS-KORPUS). Befund C: PDF geliefert, aber ohne lesbaren
// eigenen Titel (Scan ohne Textschicht, fremd gesetztes Aktenzeichen) ⇒ bis dahin still das
// Plattformdatum unter der Quelle `kopf-ocl-volltext`. Befund D: `nurMitAmtlichemKopf` ohne
// Aufrufer; der Generator-Kantonszweig schrieb das Plattformdatum mit nur einer Warnung.
describe('Befund C — kein eigener Titel gelesen ⇒ nie still das Plattformdatum', () => {
  const opts = (log: Zurueckgehalten[]) => ({ nurMitAmtlichemKopf: true, zurueckgehalten: (z: Zurueckgehalten) => log.push(z) });
  it('echter OCL-Kopf UV 2025/14 + PDF-Scan ohne Textschicht ⇒ plattform-ohne-kopf, Meldung, zurückgehalten', () => {
    const scan = ['', '', ''];
    const r = kantonsEntscheiddatum(sg(), scan);
    expect(r).toMatchObject({ datum: '2025-10-23', quelle: 'plattform-ohne-kopf', grund: 'kopfzeile-datum-az=2025-10-23 im OCL-Kopf ohne eigenen Titel; amtliches PDF ohne eigenes Aktenzeichen' });
    expect(r.pdfFehlt).toBeUndefined(); // das PDF kam — es trug nur keinen lesbaren Kopf
    expect(ausEigenemTitel(r)).toBe(false);
    expect(kopfdatumRueckfallMeldung(sg(), r)).toBe('[kopfdatum] Rückfall auf Plattformdatum 2025-10-23: sg_gerichte UV 2025/14 — kopfzeile-datum-az=2025-10-23 im OCL-Kopf ohne eigenen Titel; amtliches PDF ohne eigenes Aktenzeichen');
    const log: Zurueckgehalten[] = [];
    expect(kopfZurueckhalten(sg(), scan, opts(log))).toBe(true);
    expect(log).toEqual([{ decisionId: 'sg_gerichte_UV_2025_14', court: 'sg_gerichte', nummer: 'UV 2025/14', grund: 'plattform-ohne-kopf 2025-10-23: kopfzeile-datum-az=2025-10-23 im OCL-Kopf ohne eigenen Titel; amtliches PDF ohne eigenes Aktenzeichen' }]);
  });
  it('echtes PDF mit anders gesetztem Aktenzeichen «UV 2025 / 14» ⇒ ebenso, nicht kopf-ocl-volltext', () => {
    const fremd = PDF_SEITEN.map((p) => p.replaceAll('UV 2025/14', 'UV 2025 / 14'));
    expect(kantonsEntscheiddatum(sg(), fremd)).toMatchObject({ datum: '2025-10-23', quelle: 'plattform-ohne-kopf' });
    expect(kopfZurueckhalten(sg(), fremd, { nurMitAmtlichemKopf: true })).toBe(true);
  });
  it('PDF mit eigenem Aktenzeichen, aber ohne Titel ⇒ «ohne eigenen Titel»; OCL ohne Kopf ⇒ ocl-decision_date, zurückgehalten', () => {
    expect(kantonsEntscheiddatum(sg(), [PDF_SEITEN[0]]).grund).toMatch(/amtliches PDF ohne eigenen Titel$/);
    const ohneKopf = sg({ full_text: 'Versicherungsgericht Leistungspflicht', decision_date: '2025-11-21' });
    expect(kantonsEntscheiddatum(ohneKopf, [PDF_SEITEN[0]])).toMatchObject({ datum: '2025-11-21', quelle: 'ocl-decision_date' });
    expect(kopfZurueckhalten(ohneKopf, [PDF_SEITEN[0]], { nurMitAmtlichemKopf: true })).toBe(true);
  });
  it('Invariante: kopf-ocl-volltext bezeichnet nur noch einen eigenen Titel (titel-vom)', () => {
    const faelle: Array<[OclDecision, string[] | null]> = [
      [sg(), null], [sg(), ['', '', '']], [sg(), PDF_SEITEN], [sg(), [PDF_SEITEN[0]]], [sg(), ['Deckblatt UV 2025/15', 'Urteil vom 1. Mai 2020']],
      [sg({ full_text: 'Publikationsplattform Entscheiddatum: 23.10.2025 Versicherungsgericht' }), ['']],
      [sg({ full_text: 'Versicherungsgericht Abteilung III Entscheid vom 21. Oktober 2025 Besetzung' }), null],
    ];
    const volltext = faelle.map(([d, p]) => kantonsEntscheiddatum(d, p)).filter((r) => r.quelle === 'kopf-ocl-volltext');
    expect(volltext).toHaveLength(1);
    for (const r of volltext) expect(r.kopf).toMatchObject({ status: 'ok', regel: 'titel-vom' });
  });
  it('ohne nurMitAmtlichemKopf, mit eigenem Titel oder für den Bund ⇒ kein Zurückhalten', () => {
    const log: Zurueckgehalten[] = [];
    expect(kopfZurueckhalten(sg(), ['', '', ''], {})).toBe(false);
    expect(kopfZurueckhalten(sg(), PDF_SEITEN, opts(log))).toBe(false);
    expect(kopfZurueckhalten(sg({ canton: 'CH', court: 'bger' }), null, opts(log))).toBe(false);
    expect(log).toEqual([]);
  });
});

describe('Befund D — Generator-Kantonszweig: zurückhalten statt Plattformdatum, Bestand unverändert', () => {
  it('holeEntscheidOCL: PDF kommt ohne eigenen Kopf ⇒ mit nurMitAmtlichemKopf null + Meldekanal; sonst Plattformdatum mit Warnung', async () => {
    vi.stubGlobal('fetch', async (u: string) => {
      if (u === PDF_URL) return new Response(minimalPdf('Scan ohne Kopf'), { status: 200 });
      if (u.includes('/decisions/')) return new Response(JSON.stringify(sg()), { status: 200 });
      return new Response('', { status: 404 });
    });
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const log: Zurueckgehalten[] = [];
    expect(await holeEntscheidOCL('sg_gerichte_UV_2025_14', '2026-09-25', { sprache: null, nurMitAmtlichemKopf: true, zurueckgehalten: (z) => log.push(z) })).toBeNull();
    expect(log.map((z) => z.grund)).toEqual(['plattform-ohne-kopf 2025-10-23: kopfzeile-datum-az=2025-10-23 im OCL-Kopf ohne eigenen Titel; amtliches PDF ohne eigenes Aktenzeichen']);
    expect((await holeEntscheidOCL('sg_gerichte_UV_2025_14', '2026-09-25', { sprache: null }))?.datum).toBe('2025-10-23');
    expect(warn.mock.calls.map((c) => String(c[0])).filter((m) => m.startsWith('[kopfdatum] Rückfall auf Plattformdatum'))).toHaveLength(2);
  }, 15_000);
  it('bestandStattZurueckgehalten: exakte Identität court + Aktenzeichen, Bestandseintrag byte-gleich, sortiert', () => {
    const b = bestand();
    const vorher = JSON.stringify(b);
    const fremd = { ...bestand(), id: 'kanton/SG/sg_gerichte/UV2025_15', nummer: 'UV 2025/15' };
    const z = (court: string, nummer: string): Zurueckgehalten => ({ decisionId: 'x', court, nummer, grund: 'g' });
    expect(bestandStattZurueckgehalten([z('sg_gerichte', 'UV  2025/14 ')], [fremd, b])).toEqual([b]);
    expect(bestandStattZurueckgehalten([z('sg_gerichte', 'UV 2025/1')], [b])).toEqual([]);
    expect(bestandStattZurueckgehalten([z('ag_gerichte', 'UV 2025/14')], [b])).toEqual([]);
    expect(JSON.stringify(b)).toBe(vorher);
    const zz = [{ ...z('sg_gerichte', 'B 2'), decisionId: 'b' }, { ...z('sg_gerichte', 'A 1'), decisionId: 'a' }];
    expect(zurueckhalteZeile('sg_gerichte', zz, 0)).toBe(zurueckhalteZeile('sg_gerichte', [...zz].reverse(), 0));
    expect(zurueckhalteZeile('sg_gerichte', zz, 0)).toBe('[kanton] sg_gerichte: 2 zurückgehalten (kein eigener Urteilskopf; davon 0 Bestand unverändert): A 1 (g); B 2 (g)');
  });
  it('additiv: ein zurückgehaltener Neuabruf lässt den Bestandseintrag unverändert und löscht nichts', () => {
    const b = bestand();
    const vorher = JSON.stringify(b);
    const behalten = bestandStattZurueckgehalten([{ decisionId: 'sg_gerichte_UV_2025_14', court: 'sg_gerichte', nummer: 'UV 2025/14', grund: 'g' }], [b]);
    const ids = new Set([b.id]);
    const erg = fuehreAdditivZusammen([b], [{ name: 'kantonale', angefordert: 1, geholt: behalten.length, neu: waehleNeue(behalten, ids, 6, nachDatumDesc) }]);
    expect(erg.abbruch).toBeNull();
    expect(erg.auswahl).toEqual([b]);
    expect(JSON.stringify(erg.auswahl[0])).toBe(vorher);
  });
  it('Verdrahtung: der Kantonszweig ruft mit nurMitAmtlichemKopf und reicht den Bestand in Vollbau und additiv', () => {
    const gen = readFileSync('scripts/normtext-entscheide.ts', 'utf8');
    expect(gen).toMatch(/async function kantonKorpus\([^\n]*bestand: readonly EntscheidSnapshot\[\] = \[\]\): Promise<ZweigLauf> \{\n(?:(?!\nasync function)[\s\S])*?holeEntscheidOCL\(id, datum, \{ sprache: 'de', nurMitAmtlichemKopf: true, zurueckgehalten: /);
    expect(gen).toMatch(/const behalten = bestandStattZurueckgehalten\(zurueck, bestand\);/);
    expect(gen).toMatch(/kantonKorpus\(bestandIds, true, basis\)/);
    expect(gen).toMatch(/kantonKorpus\(new Set\(\), false, ladeBestandSnapshots\(\)\)/);
  });
});
