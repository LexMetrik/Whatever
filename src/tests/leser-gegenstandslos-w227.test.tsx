/**
 * W2·27-BUND-FERTIG (30.9.2026) · «gegenstandslos» in der Lesesicht — eigenes Wort, nie «aufgehoben».
 *
 * «Gegenstandslos» (StGB Art. 67f, OR Schlusstitel Art. 6) ist rechtlich nicht «aufgehoben»
 * (§1/§8). Die Datei bindet drei Dinge fest: (a) der Leser schreibt «· gegenstandslos» und nicht
 * «· aufgehoben»/«· kein Text im Snapshot», (b) der Nachbar-Pfeil trägt dasselbe Zustandswort,
 * (c) die COMMITTETEN Bund-Snapshots tragen das Feld `gegenstandslos` genau dort, wo Fedlex den
 * Vermerk führt — und die 14 aufgehobenen Anhänge das Feld `aufgehoben`.
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { renderToString, renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { parseHTML } from 'linkedom';
import { ArtikelBody } from '../components/normtext/ArtikelBody';
import { NormPopover } from '../components/NormPopover';
import { SynopseKarte } from '../components/entstehung/SynopseKarte';
import type { SynopseLage } from '../lib/entstehung/synopse-diff';
import type { SynopseShard } from '../lib/entstehung/synopse';
import { ArtikelLeser } from '../pages/gesetz-leser/parts';
import { baueNachbarn } from '../pages/gesetz-leser/v3/nachbarArtikel';
import { leerstellenWort } from '../lib/normtext/darstellung';
import type { NormSnapshot } from '../lib/normtext/typen';
import type { BrowseErlass } from '../lib/normtext/browse-typen';

const erlass: BrowseErlass = {
  key: 'STGB', ebene: 'bund', kanton: null, kuerzel: 'StGB', titel: 'Strafgesetzbuch',
  sr: '311.0', rechtsgebiet: 'oeffentlich', sprache: 'de', rang: 0, status: 'snapshot',
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

// ── NACHZUG (30.9.2026, Gegenprüfung #1183): auch der AUFGEKLAPPTE Körper, Popover/Vorschau und
//    die Synopse-Karte sagen «gegenstandslos» — nicht «aufgehoben». Die erste Fassung prüfte nur
//    die Statuszeile im zugeklappten Zustand; der Körper (ArtikelBody) schrieb «aufgehoben».

/** Der Text innerhalb der Ersatztext-Spans (`italic text-ink-500`) — das Wort des Körpers. */
const koerperWorte = (html: string) =>
  [...html.matchAll(/<span[^>]*class="italic text-ink-500"[^>]*>([^<]*)<\/span>/g)].map((m) => m[1]);

describe('ArtikelBody — Körper folgt dem amtlichen Artikel-Vermerk (§1/§8)', () => {
  const block = (text: string) => [{ absatz: null, text }];
  const item = [{ absatz: '1', text: 'Einleitung:', items: [{ marke: 'a', text: '' }] }];

  it('«…» mit artikelGegenstandslos → «gegenstandslos», nicht «aufgehoben»', () => {
    const out = renderToStaticMarkup(<ArtikelBody bloecke={block('…')} artikel="67_f" passus={{ absatz: null }} artikelGegenstandslos />);
    expect(koerperWorte(out)).toEqual(['gegenstandslos']);
    expect(out).not.toContain('aufgehoben');
  });

  it('LEERER Block mit artikelGegenstandslos → «gegenstandslos» (nicht «kein Text im Snapshot»)', () => {
    const out = renderToStaticMarkup(<ArtikelBody bloecke={block('')} artikel="67_f" passus={{ absatz: null }} artikelGegenstandslos />);
    expect(koerperWorte(out)).toEqual(['gegenstandslos']);
    expect(out).not.toContain('kein Text im Snapshot');
  });

  it('leeres Item mit artikelGegenstandslos → «gegenstandslos»', () => {
    const out = renderToStaticMarkup(<ArtikelBody bloecke={item} artikel="67_f" passus={{ absatz: null }} artikelGegenstandslos />);
    expect(koerperWorte(out)).toContain('gegenstandslos');
    expect(out).not.toContain('>aufgehoben<');
  });

  it('Gegenproben, byte-gleich zu vorher: aufgehoben → «aufgehoben»; ohne Beleg «…» → «aufgehoben»; leer → «kein Text im Snapshot»', () => {
    const ab = (b: ReturnType<typeof block>, extra: { artikelAufgehoben?: boolean } = {}) =>
      renderToStaticMarkup(<ArtikelBody bloecke={b} artikel="48" passus={{ absatz: null }} {...extra} />);
    expect(koerperWorte(ab(block('…'), { artikelAufgehoben: true }))).toEqual(['aufgehoben']);
    expect(koerperWorte(ab(block('…')))).toEqual(['aufgehoben']); // EPV Anhang 2 u. ä.: eigener Posten, unverändert
    expect(koerperWorte(ab(block('')))).toEqual(['kein Text im Snapshot']);
  });
});

describe('ArtikelLeser — AUFGEKLAPPT trägt der Körper dasselbe Wort wie die Statuszeile', () => {
  let root: Root | null = null;
  afterEach(async () => {
    if (root) { const r = root; root = null; await act(async () => r.unmount()); }
    vi.unstubAllGlobals();
  });

  it('StGB 67f, nachdem der Artikel offen war (Zustand bleibt bei Wechsel von `e`): Körper «gegenstandslos»', async () => {
    const { document } = parseHTML('<!doctype html><html><body><div id="app"></div></body></html>');
    vi.stubGlobal('window', { document, location: { origin: 'https://lexmetrik.test' }, setTimeout: globalThis.setTimeout, clearTimeout: globalThis.clearTimeout });
    vi.stubGlobal('document', document);
    vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
    root = createRoot(document.getElementById('app') as unknown as HTMLElement);
    const lebend = eintrag('67_f', { bloecke: [{ absatz: '1', text: 'Lebender Wortlaut des Artikels.' }] });
    const render = (e: NormSnapshot) => act(async () => {
      root!.render(createElement(ArtikelLeser, { e, erlass, basisPfad: '/gesetze/bund/STGB' }));
    });
    await render(lebend); // startet aufgeklappt (artOffen = true)
    expect(document.body.innerHTML).toContain('Lebender Wortlaut');
    await render(eintrag('67_f', { gegenstandslos: true })); // dieselbe Instanz, nun gegenstandslos — bleibt offen
    const out = document.body.innerHTML;
    expect(out).toContain('· gegenstandslos'); // Kopf
    expect(koerperWorte(out)).toContain('gegenstandslos'); // Körper
    expect(out).not.toContain('aufgehoben');
  });
});

describe('NormPopover/Vorschau — dasselbe Wort wie der Leser (§5)', () => {
  const popover = (e: NormSnapshot) => renderToString(
    <MemoryRouter><NormPopover snapshot={e} passus={{ absatz: null }} onClose={() => {}} /></MemoryRouter>);

  it('gegenstandslos → «gegenstandslos» im Körper, nirgends «aufgehoben»', () => {
    const out = popover(eintrag('67_f', { gegenstandslos: true }));
    expect(koerperWorte(out)).toEqual(['gegenstandslos']);
    expect(out).not.toContain('aufgehoben');
  });

  it('Gegenprobe: aufgehoben und Eintrag ohne Feld bleiben «aufgehoben» (byte-gleich)', () => {
    expect(koerperWorte(popover(eintrag('48', { aufgehoben: true })))).toEqual(['aufgehoben']);
    expect(koerperWorte(popover(eintrag('108')))).toEqual(['aufgehoben']);
  });
});

describe('SynopseKarte — rechte Spalte «Wortlaut → …» trägt das Zustandswort', () => {
  const shard = {
    erlass: 'STGB', eli: 'cc/54/757_781_799', normProfil: 'p/1', erzeugt: '2026-09-30', fensterAb: '2021-01-01',
    kuenftigeStaende: [], staende: [], schritte: [],
  } as unknown as SynopseShard;
  const lage = {
    art: 'vergleich',
    treffer: {
      schritt: { von: '2021-01-01', bis: '2024-01-01', artikel: [] },
      artikel: {
        eId: 'art_67_f', token: '67_f', label: 'Art. 67f', art: 'geaendert', zustand: 'ereignis', shaNorm: 'a'.repeat(64),
        alt: [['', '', 'Früherer Wortlaut des Artikels.']],
      },
      neu: [['', '', '…']],
      neuHerkunft: 'geltend',
      mehrdeutig: false,
    },
  } as unknown as SynopseLage;
  const karte = (zustand: 'gegenstandslos' | 'aufgehoben' | 'leer-ungeklaert') => renderToStaticMarkup(
    <SynopseKarte lage={lage} shard={shard} geltend={{ stand: '2026-06-12' }} zustand={zustand} id="x" />);

  it('gegenstandslos: Zeilenmarke und rechte Spalte «gegenstandslos», kein «aufgehoben»', () => {
    const out = karte('gegenstandslos');
    expect(out).toContain('— gegenstandslos');
    expect(out).toContain('>gegenstandslos<');
    expect(out).not.toContain('aufgehoben');
  });

  it('Gegenproben: aufgehoben und ohne Vermerk bleiben «aufgehoben» (byte-gleich)', () => {
    for (const z of ['aufgehoben', 'leer-ungeklaert'] as const) {
      const out = karte(z);
      expect(out, z).toContain('— aufgehoben');
      expect(out, z).toContain('>aufgehoben<');
      expect(out, z).not.toContain('gegenstandslos');
    }
  });
});
