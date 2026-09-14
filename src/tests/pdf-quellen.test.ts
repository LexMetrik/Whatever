import { describe, it, expect } from 'vitest';
import {
  bundPdfQuellen, kantonAusLexwork, lexworkApiUrl, pdfQuellenJson,
  raeumeVerwaisteSidecarEintraege, type ErlassBasis, type PdfQuellenMap,
} from '../../scripts/normtext/pdf-quellen-generieren.ts';
import { pruefeOffline } from '../../scripts/normtext/check-pdf-quellen.ts';

// Fake-fetch, das eine SPARQL-Antwort mit den gegebenen Bindings liefert.
function sparqlFetch(bindings: Record<string, { value: string }>[]) {
  return (async () =>
    ({ ok: true, json: async () => ({ results: { bindings } }) }) as unknown as Response) as typeof fetch;
}

const bundE = (over: Partial<ErlassBasis> = {}): ErlassBasis => ({
  key: 'ZGB', sr: '210', kuerzel: 'ZGB', ebene: 'bund', status: 'snapshot',
  quelleUrl: 'https://www.fedlex.admin.ch/eli/cc/24/233_245_233/de',
  fassungsToken: '20260701', stand: '2026-07-01', kanton: null, ...over,
});

const URL_1 = 'https://fedlex.data.admin.ch/filestore/fedlex.data.admin.ch/eli/cc/24/233_245_233/20260701/de/pdf-a/fedlex-data-admin-ch-eli-cc-24-233_245_233-20260701-de-pdf-a-1.pdf';
const URL_ALT = 'https://fedlex.data.admin.ch/filestore/fedlex.data.admin.ch/eli/cc/24/233_245_233/20200101/de/pdf-a/fedlex-data-admin-ch-eli-cc-24-233_245_233-20200101-de-pdf-a-1.pdf';

describe('bundPdfQuellen — Suffix-Falle via isExemplifiedBy', () => {
  it('nimmt exakt die URL der GEPINNTEN Fassung (nicht die neueste/älteste)', async () => {
    const bindings = [
      { abstract: { value: 'https://fedlex.data.admin.ch/eli/cc/24/233_245_233' }, date: { value: '2020-01-01' }, url: { value: URL_ALT } },
      { abstract: { value: 'https://fedlex.data.admin.ch/eli/cc/24/233_245_233' }, date: { value: '2026-07-01' }, url: { value: URL_1 } },
    ];
    const { map, ohne } = await bundPdfQuellen([bundE()], sparqlFetch(bindings));
    expect(ohne).toEqual([]);
    expect(map.ZGB).toEqual({ url: URL_1, stand: '2026-07-01', quelle: 'fedlex' });
  });

  it('lässt Erlasse ohne pdf-a-Treffer der gepinnten Fassung weg (§8)', async () => {
    const bindings = [
      { abstract: { value: 'https://fedlex.data.admin.ch/eli/cc/24/233_245_233' }, date: { value: '2020-01-01' }, url: { value: URL_ALT } },
    ];
    const { map, ohne } = await bundPdfQuellen([bundE()], sparqlFetch(bindings));
    expect(map.ZGB).toBeUndefined();
    expect(ohne).toEqual(['ZGB']);
  });
});

describe('kantonAusLexwork — Versions-Gleichstand als §8-Ehrlichkeit', () => {
  const e = (over: Partial<ErlassBasis> = {}): ErlassBasis => ({
    key: 'AG-291.150', sr: 'SAR 291.150', kuerzel: 'Anwaltstarif', ebene: 'kanton', status: 'snapshot',
    quelleUrl: 'https://gesetzessammlungen.ag.ch/app/de/texts_of_law/291.150',
    fassungsToken: 'x', stand: '2024-01-01', kanton: 'AG', ...over,
  });
  const pdf = 'https://gesetzessammlungen.ag.ch/api/de/versions/3625/pdf_file';

  it('liefert pdf_link_tol wenn In-Kraft-Datum == snapshot.stand', () => {
    const q = kantonAusLexwork(e(), { text_of_law: { selected_version: { pdf_link_tol: pdf, version_dates_str: 'Aktuelle Version in Kraft seit: 01.01.2024 (Beschlussdatum: 19.09.2023)' } } });
    expect(q).toEqual({ url: pdf, stand: '2024-01-01', quelle: 'lexwork' });
  });

  it('gibt null bei Drift (LexWork-Version ≠ snapshot.stand)', () => {
    const q = kantonAusLexwork(e(), { text_of_law: { selected_version: { pdf_link_tol: pdf, version_dates_str: 'Aktuelle Version in Kraft seit: 01.01.2026 (Beschlussdatum: 20.11.2025)' } } });
    expect(q).toBeNull();
  });

  it('gibt null ohne pdf_link_tol', () => {
    const q = kantonAusLexwork(e(), { text_of_law: { selected_version: { pdf_link_tol: null, version_dates_str: 'in Kraft seit: 01.01.2024' } } });
    expect(q).toBeNull();
  });
});

describe('lexworkApiUrl / pdfQuellenJson', () => {
  it('app → api', () => {
    expect(lexworkApiUrl('https://ai.clex.ch/app/de/texts_of_law/177.410'))
      .toBe('https://ai.clex.ch/api/de/texts_of_law/177.410');
    expect(lexworkApiUrl('https://www.fedlex.admin.ch/eli/cc/24/de')).toBeNull();
  });
  it('sortiert deterministisch mit genau einem Trailing-Newline', () => {
    const s = pdfQuellenJson({ B: { url: 'u2', stand: '2026-01-01', quelle: 'fedlex' }, A: { url: 'u1', stand: '2026-01-01', quelle: 'fedlex' } });
    expect(s.indexOf('"A"')).toBeLessThan(s.indexOf('"B"'));
    expect(s.endsWith('}\n')).toBe(true);
  });
});

describe('pruefeOffline — Bindung an die Pin-Überwachung', () => {
  const erlass = {
    key: 'ZGB', ebene: 'bund', status: 'snapshot',
    quelleUrl: 'https://www.fedlex.admin.ch/eli/cc/24/233_245_233/de',
    stand: '2026-07-01', pdfUrl: URL_1, pdfStand: '2026-07-01',
  };
  const pins = [{ eli: 'cc/24/233_245_233', kons: '2026-07-01' }];
  const quellen = { ZGB: { url: URL_1, stand: '2026-07-01', quelle: 'fedlex' as const } };
  // Seit dem §6.7-Wurzelfix (14.9.2026) gibt es keinen unscharfen Coverage-Floor
  // mehr, der hier hineinredete: ein Bund-Snapshot MIT Eintrag ist schlicht grün.
  it('grün bei URL == Pin-Konsolidierung + Projektion konsistent', () => {
    expect(pruefeOffline(quellen, [erlass], pins)).toEqual([]);
  });

  it('ROT wenn URL-Konsolidierung ≠ Pin (Re-Pin ohne Regen)', () => {
    const b = pruefeOffline(quellen, [erlass], [{ eli: 'cc/24/233_245_233', kons: '2027-01-01' }]);
    expect(b.some((x) => x.includes('≠ Pin'))).toBe(true);
  });

  it('ROT bei verwaistem Eintrag (kein Register-Erlass)', () => {
    const b = pruefeOffline({ XX: { url: URL_1, stand: '2026-07-01', quelle: 'fedlex' } }, [erlass], pins);
    expect(b.some((x) => x.includes('kein Register-Erlass'))).toBe(true);
  });

  it('ROT wenn register.pdfUrl nicht den Sidecar spiegelt (stale register)', () => {
    const stale = { ...erlass, pdfUrl: 'https://anders' };
    const b = pruefeOffline(quellen, [stale], pins);
    expect(b.some((x) => x.includes('register.pdfUrl ≠'))).toBe(true);
  });

  it('ROT bei LexWork-Host-Mismatch', () => {
    const kq = { 'AG-1': { url: 'https://boese.example/x.pdf', stand: '2024-01-01', quelle: 'lexwork' as const } };
    const ke = { key: 'AG-1', ebene: 'kanton', status: 'snapshot', quelleUrl: 'https://ag.ch/app/de/texts_of_law/1', stand: '2024-01-01', pdfUrl: 'https://boese.example/x.pdf', pdfStand: '2024-01-01' };
    const b = pruefeOffline(kq, [ke], pins);
    expect(b.some((x) => x.includes('PDF-Host'))).toBe(true);
  });
});

// Gegenprüfungs-Befund PR #694 (5.9.2026): die Waisen-Räumung (main(), vormals
// Zeilen 239-260) hatte keinen Unit-Test — nur die STATISCHE check-pdf-quellen-
// Meldung oben («ROT bei verwaistem Eintrag») war getestet, nicht die Funktion,
// die den Sidecar tatsächlich bereinigt. Minimal aus main() extrahiert
// (raeumeVerwaisteSidecarEintraege), keine Logikänderung.
describe('raeumeVerwaisteSidecarEintraege — löscht nur Waisen des gefahrenen Kantons', () => {
  const map: PdfQuellenMap = {
    'GL-III%20B_7_1': { url: 'https://gl.ch/x', stand: '2024-01-01', quelle: 'lexwork' },
    'GL-III-A.5': { url: 'https://gl.ch/y', stand: '2024-01-01', quelle: 'lexwork' },
    'BE-154.21': { url: 'https://be.ch/z', stand: '2024-01-01', quelle: 'lexwork' },
  };
  const imRegister = new Set(['GL-III-A.5', 'BE-154.21']); // GL-III%20B_7_1 zurückgezogen

  it('entfernt genau den zurückgezogenen Key des gefahrenen Kantons', () => {
    const { map: bereinigt, entfernt } = raeumeVerwaisteSidecarEintraege(map, imRegister, new Set(['GL']));
    expect(entfernt).toEqual(['GL-III%20B_7_1']);
    expect('GL-III%20B_7_1' in bereinigt).toBe(false);
    expect(bereinigt['GL-III-A.5']).toEqual(map['GL-III-A.5']);
  });

  it('fremder Kanton bleibt unberührt, auch wenn er (fälschlich) nicht im Register steht', () => {
    const ohneBE = new Set(['GL-III-A.5']); // BE-154.21 fehlt jetzt zusätzlich im Register
    const { map: bereinigt, entfernt } = raeumeVerwaisteSidecarEintraege(map, ohneBE, new Set(['GL']));
    // Nur der GL-Waise wird entfernt — GL ist der einzige gefahrene Kanton.
    expect(entfernt).toEqual(['GL-III%20B_7_1']);
    // BE-154.21 fehlt im Register, aber BE wird nicht gefahren → unangetastet
    // (§8: aufgeräumt wird nur innerhalb der gefahrenen Kantone).
    expect(bereinigt['BE-154.21']).toEqual(map['BE-154.21']);
  });

  it('leere Waisen-Menge → map unverändert (kein Eintrag entfernt)', () => {
    const vollstaendig = new Set(Object.keys(map));
    const { map: bereinigt, entfernt } = raeumeVerwaisteSidecarEintraege(map, vollstaendig, new Set(['GL', 'BE']));
    expect(entfernt).toEqual([]);
    expect(bereinigt).toEqual(map);
  });
});

// §6.7-Wurzelfix (Gegenprüfungs-Auflage PR #860, 14.9.2026): das Tor prüfte bis
// dahin NUR die vorhandenen Sidecar-Einträge («228 Bund») und konnte bei
// FEHLENDEN Einträgen gar nicht scheitern — drei Kernerlasse (EMRK, EÖBV, AVG)
// kamen so ohne amtlichen PDF-Zugang durch. Diese Tests binden das Gegenteil fest.
describe('pruefeOffline — Vollständigkeit gegen die Snapshot-Menge', () => {
  const bundOhne = {
    key: 'EMRK', ebene: 'bund', status: 'snapshot',
    quelleUrl: 'https://www.fedlex.admin.ch/eli/cc/1974/2151_2151_2151/de',
    stand: '2022-09-16',
  };
  const bundMit = {
    key: 'ZGB', ebene: 'bund', status: 'snapshot',
    quelleUrl: 'https://www.fedlex.admin.ch/eli/cc/24/233_245_233/de',
    stand: '2026-07-01', pdfUrl: URL_1, pdfStand: '2026-07-01',
  };
  const pins = [{ eli: 'cc/24/233_245_233', kons: '2026-07-01' }];
  const quellen = { ZGB: { url: URL_1, stand: '2026-07-01', quelle: 'fedlex' as const } };

  it('ROT bei einem Bund-Snapshot ohne pdf-quellen-Eintrag (der reale #860-Fall)', () => {
    const b = pruefeOffline(quellen, [bundMit, bundOhne], pins);
    expect(b.some((x) => x.includes('Bund-Snapshot(s) ohne pdf-quellen-Eintrag'))).toBe(true);
    expect(b.some((x) => x.includes('EMRK'))).toBe(true);
  });

  it('grün, sobald der fehlende Eintrag nachgezogen ist', () => {
    const url = 'https://fedlex.data.admin.ch/filestore/fedlex.data.admin.ch/eli/cc/1974/2151_2151_2151/20220916/de/pdf-a/fedlex-data-admin-ch-eli-cc-1974-2151_2151_2151-20220916-de-pdf-a-2.pdf';
    const b = pruefeOffline(
      { ...quellen, EMRK: { url, stand: '2022-09-16', quelle: 'fedlex' as const } },
      [bundMit, { ...bundOhne, pdfUrl: url, pdfStand: '2022-09-16' }],
      [...pins, { eli: 'cc/1974/2151_2151_2151', kons: '2022-09-16' }],
    );
    expect(b).toEqual([]);
  });

  it('nicht-snapshot-Status (nur-live-link, pdf-embed) verlangt keinen Eintrag', () => {
    const live = { key: 'XYZ', ebene: 'bund', status: 'nur-live-link', quelleUrl: 'https://www.fedlex.admin.ch/eli/cc/1/1/de', stand: '2026-01-01' };
    expect(pruefeOffline(quellen, [bundMit, live], pins)).toEqual([]);
  });

  it('Kanton bleibt unter der Basislinie stumm (152 LexWork-Lücken sind Ist-Stand)', () => {
    const kantonOhne = Array.from({ length: 20 }, (_, i) => ({
      key: `ZH-${i}`, ebene: 'kanton', status: 'snapshot',
      quelleUrl: `https://www.zh.ch/app/de/texts_of_law/${i}`, stand: '2024-01-01',
    }));
    expect(pruefeOffline(quellen, [bundMit, ...kantonOhne], pins)).toEqual([]);
  });
});
