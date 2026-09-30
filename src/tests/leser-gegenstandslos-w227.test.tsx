/**
 * W2·27-BUND-FERTIG (30.9.2026) · «gegenstandslos» in der Lesesicht — eigenes Wort, nie «aufgehoben».
 *
 * «Gegenstandslos» (StGB Art. 67f, OR Schlusstitel Art. 6) ist rechtlich nicht «aufgehoben»
 * (§1/§8). Die Datei bindet drei Dinge fest: (a) der Leser schreibt «· gegenstandslos» und nicht
 * «· aufgehoben»/«· kein Text im Snapshot», (b) der Nachbar-Pfeil trägt dasselbe Zustandswort,
 * (c) die COMMITTETEN Bund-Snapshots tragen das Feld `gegenstandslos` genau dort, wo Fedlex den
 * Vermerk führt — und die 14 aufgehobenen Anhänge das Feld `aufgehoben`.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { renderToString } from 'react-dom/server';
import { ArtikelLeser } from '../pages/gesetz-leser/parts';
import { baueNachbarn } from '../pages/gesetz-leser/v3/nachbarArtikel';
import { leerstellenWort } from '../lib/normtext/darstellung';
import type { NormSnapshot } from '../lib/normtext/typen';
import type { BrowseErlass } from '../lib/normtext/browse-typen';

const erlass: BrowseErlass = {
  key: 'STGB', ebene: 'bund', kanton: null, kuerzel: 'StGB', titel: 'Strafgesetzbuch',
  sr: '311.0', rechtsgebiet: 'strafrecht', sprache: 'de', rang: 0, status: 'snapshot',
  datei: 'bund/STGB.json', artikelAnzahl: 1, stand: '2026-06-12',
  quelleUrl: 'https://www.fedlex.admin.ch/eli/cc/54/757_781_799/de', fassungsToken: '20260612',
  pdfPfad: null,
};

const eintrag = (artikel: string, extra: Partial<NormSnapshot> = {}): NormSnapshot => ({
  id: `bund/STGB/art_${artikel}`, ebene: 'bund', quelle: 'STGB', erlass: 'StGB',
  artikel, artikelLabel: `Art. ${artikel}`, bloecke: [{ absatz: null, text: '…' }],
  stand: '2026-06-12', quelleUrl: `https://x#art_${artikel}`, abgerufen: '2026-09-30',
  fassungsToken: '20260612', sha: artikel, ...extra,
});

const zeige = (e: NormSnapshot) =>
  renderToString(<ArtikelLeser e={e} erlass={erlass} basisPfad="/gesetze/bund/STGB" />);

describe('Leser — «gegenstandslos» ist ein eigenes Wort (§1/§8)', () => {
  it('Art. 67f (gegenstandslos): «· gegenstandslos», weder «aufgehoben» noch «kein Text im Snapshot»', () => {
    const out = zeige(eintrag('67_f', { gegenstandslos: true }));
    expect(out).toContain('· gegenstandslos');
    expect(out).not.toContain('· aufgehoben');
    expect(out).not.toContain('kein Text im Snapshot');
    expect(out).toContain('nicht mit einem Aufhebungsvermerk'); // Erläuterung am title
  });

  it('Gegenproben: aufgehoben bleibt «· aufgehoben»; ohne Feld bleibt «kein Text im Snapshot»', () => {
    const aufgehoben = zeige(eintrag('48', { aufgehoben: true }));
    expect(aufgehoben).toContain('· aufgehoben');
    expect(aufgehoben).not.toContain('· gegenstandslos');
    const ungeklaert = zeige(eintrag('108'));
    expect(ungeklaert).toContain('kein Text im Snapshot');
    expect(ungeklaert).not.toContain('· gegenstandslos');
  });

  it('Form unverändert: eingeklappt/gedämpft, kein Klapp-Chevron (§6)', () => {
    const out = zeige(eintrag('67_f', { gegenstandslos: true }));
    expect(out).toContain('text-ink-500 font-normal');
    expect(out).not.toContain('▾');
    expect(out).not.toContain('▸');
  });

  it('Nachbar-Pfeil trägt dasselbe Zustandswort (leerstellenWort, §5)', () => {
    const map = baueNachbarn([eintrag('67_e'), eintrag('67_f', { gegenstandslos: true }), eintrag('67_g')]);
    const zielF = map.get('67_e')?.nach;
    expect(zielF?.zustand).toBe('gegenstandslos');
    expect(leerstellenWort(zielF!.zustand)).toBe('gegenstandslos');
  });
});

describe('Committete Bund-Snapshots — Feld dort, wo Fedlex den Vermerk führt', () => {
  const lade = (key: string) =>
    (JSON.parse(readFileSync(`public/normtext/bund/${key}.json`, 'utf8')) as { eintraege: NormSnapshot[] }).eintraege;
  const finde = (key: string, id: string) => lade(key).find((e) => e.id === `bund/${key}/${id}`);

  it('StGB Art. 67f und OR Schlusstitel Art. 6 tragen `gegenstandslos`, nicht `aufgehoben`', () => {
    for (const [key, id] of [['STGB', 'art_67_f'], ['OR', 'disp_u16_art_6']] as const) {
      const e = finde(key, id);
      expect(e?.gegenstandslos, `${key}/${id}`).toBe(true);
      expect(e?.aufgehoben, `${key}/${id}`).toBeUndefined();
    }
  });

  it('die 14 aufgehobenen Anhänge tragen `aufgehoben` (Fedlex «Aufgehoben durch …» am Anhang-Kopf)', () => {
    const erwartet: Array<[string, string]> = [
      ['AKKBV', 'annex_3'], ['ASYLV3', 'annex_2'], ['EBG', 'annex_u1'], ['EPV', 'annex_1'],
      ['KKV', 'annex_1'], ['KKV', 'annex_2'], ['KKV', 'annex_3'], ['RDV', 'annex_1'],
      ['VAM', 'annex_4'], ['VRV', 'annex_I'], ['VRV', 'annex_II'], ['VTS', 'annex_3'],
      ['VZV', 'annex_10'], ['WAV', 'annex_u1'],
    ];
    expect(erwartet).toHaveLength(14);
    for (const [key, id] of erwartet) expect(finde(key, id)?.aufgehoben, `${key}/${id}`).toBe(true);
  });

  it('EPV Anhang 2 (befristet, «Eingefügt … bis zum 31. Dez. 2023») bleibt OHNE Feld (§7)', () => {
    const e = finde('EPV', 'annex_2');
    expect(e).toBeDefined();
    expect(e?.aufgehoben).toBeUndefined();
    expect(e?.gegenstandslos).toBeUndefined();
  });

  it('kein Eintrag trägt beide Felder', () => {
    for (const key of ['STGB', 'OR', 'KKV', 'VRV']) {
      for (const e of lade(key)) expect(Boolean(e.aufgehoben && e.gegenstandslos), `${key}/${e.id}`).toBe(false);
    }
  });
});
