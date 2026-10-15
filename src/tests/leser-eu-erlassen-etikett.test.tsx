/**
 * O-02 (Nachzug, Gegenprüfung A2): das Etikett «Erlassen» gilt nicht nur in der
 * Liste, sondern auch im Kopf und in der Übersicht der Leseseite. Vorher sagte
 * die Verweiskarte «Erlassen am 27.04.2016», Kopf und Übersicht «Stand
 * 27.04.2016» — dasselbe Datum, zwei Bedeutungen auf einer Seite (§8).
 *
 * ROT ZU BEKOMMEN: in `ErlassLeserKopf.tsx` oder `uebersichtAngaben.ts` das
 * Etikett wieder fest «Stand» setzen → der DSGVO-Fall rot; `standEtikett`
 * immer «Erlassen» liefern lassen → der CISG-Fall rot.
 */
import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { FruehAnsicht } from '../pages/gesetz-leser/inhalt-ansichten';
import { uebersichtsAngaben, type UebersichtsEingabe } from '../pages/gesetz-leser/v3/uebersichtAngaben';
import type { BrowseErlass } from '../lib/normtext/browse-typen';

const erlass = (o: Partial<BrowseErlass> & Pick<BrowseErlass, 'key' | 'kuerzel' | 'stand' | 'status'>): BrowseErlass => ({
  ebene: 'bund', kanton: null, titel: `Titel ${o.kuerzel}`, sr: null, rechtsgebiet: 'international', sprache: 'de', rang: 1,
  datei: null, artikelAnzahl: 0, quelleUrl: 'https://example.org/', fassungsToken: '', pdfPfad: null, ...o,
} as BrowseErlass);

const DSGVO = erlass({ key: 'DSGVO', kuerzel: 'DSGVO', stand: '2016-04-27', status: 'nur-live-link' });
const CISG = erlass({ key: 'CISG', kuerzel: 'CISG', sr: '0.221.211.1', stand: '2026-05-22', status: 'nur-live-link' });

const seite = (e: BrowseErlass) => renderToStaticMarkup(
  <MemoryRouter>
    {FruehAnsicht({ fehler: false, schluessel: e.key, manifest: null, erlass: e, currency: {}, teilausfall: null, kopf: null, internRefs: undefined })}
  </MemoryRouter>,
).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');

const eingabe = (e: BrowseErlass): UebersichtsEingabe => ({
  erlass: e, kopf: null, currency: undefined, erlassTyp: undefined, anzahl: null,
  bestimmungsWort: 'Artikel', bestimmungsEtikettStatus: undefined, gliederungsTiefe: 0, kennzahlen: null, kantonSys: {},
} as UebersichtsEingabe);

describe('O-02 · Leseseite: «Erlassen» in Kopf und Übersicht', () => {
  it('Kopf: EU-Verordnung «Erlassen 27.04.2016», kein «Stand 27.04.2016»', () => {
    const t = seite(DSGVO);
    expect(t).toContain('Erlassen 27.04.2016');
    expect(t).not.toContain('Stand 27.04.2016');
  });

  it('Kopf: Fedlex-Eintrag (CISG) bleibt «Stand 22.05.2026»', () => {
    const t = seite(CISG);
    expect(t).toContain('Stand 22.05.2026');
    expect(t).not.toContain('Erlassen 22.05.2026');
  });

  it('Übersicht: EU-Verordnung trägt die Zeile «Erlassen», nicht «Stand»', () => {
    const z = uebersichtsAngaben(eingabe(DSGVO)).zeilen.find((r) => r.wert === '27.04.2016');
    expect(z?.label).toBe('Erlassen');
  });

  it('Übersicht: CISG trägt die Zeile «Stand»', () => {
    const z = uebersichtsAngaben(eingabe(CISG)).zeilen.find((r) => r.wert === '22.05.2026');
    expect(z?.label).toBe('Stand');
  });
});
