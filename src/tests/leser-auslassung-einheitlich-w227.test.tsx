/**
 * W2·27-BUND-FERTIG (30.9.2026) · EINE ehrliche Anzeige für «…»-Artikel auf allen Flächen (§5/§8).
 *
 * DER FEHLER, DEN DIESE DATEI HÄLT. Ein Artikel, dessen Snapshot-Text nur «…» ist und der KEINEN
 * amtlichen Vermerk trägt (`aufgehoben`/`gegenstandslos`), hiess im Leser «kein Text im Snapshot»,
 * im Popover (Körper) und in der Synopse-Karte dagegen «aufgehoben» — drei Flächen, zwei Aussagen,
 * und die zweite behauptete eine Aufhebung, die die Quelle nicht hergibt (Beispiel: EPV Anhang 2,
 * befristet, ohne Aufhebungsvermerk). Das Popover liess ausserdem den amtlichen Vermerk fallen
 * (`artikelAufgehoben` wurde nicht durchgereicht).
 *
 * DIE REGEL (eine Quelle: `artikelLeerstellenStatus`/`leerstellenWort`, darstellung.ts):
 *   Zustandswort nur aus dem Datenfeld — `aufgehoben` ⇒ «aufgehoben», `gegenstandslos` ⇒
 *   «gegenstandslos»; ein Artikel, der GANZ nur aus «…» besteht und kein Feld trägt ⇒ «kein Text im
 *   Snapshot». Ein «…»-ABSATZ in einem sonst lebenden Artikel bleibt «aufgehoben» (amtliche
 *   Auslassungsmarke des Absatzes, Entscheid David 16.6.2026, NormPopover.test.tsx).
 *
 * ROT VOR DEM FIX: «Bund/Kanton-Artikel nur «…» ohne Feld», «Popover mit Vermerk und leerem Block»,
 * «Synopse ohne Vermerk», «Index gegenstandslos».
 */
import { describe, it, expect } from 'vitest';
import { renderToString, renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { ArtikelBody } from '../components/normtext/ArtikelBody';
import { NormPopover } from '../components/NormPopover';
import { SynopseKarte } from '../components/entstehung/SynopseKarte';
import { ArtikelIndex } from '../pages/gesetz-leser/parts/ArtikelIndex';
import { baueArtikelIndex } from '../pages/gesetz-leser/gliederungsArtikel';
import { ArtikelLeser } from '../pages/gesetz-leser/parts';
import { artikelLeerstellenStatus, leerstellenWort, type LeerstellenStatus } from '../lib/normtext/darstellung';
import type { SynopseLage } from '../lib/entstehung/synopse-diff';
import type { SynopseShard } from '../lib/entstehung/synopse';
import type { NormSnapshot } from '../lib/normtext/typen';
import type { BrowseErlass } from '../lib/normtext/browse-typen';

const KURZ = 'kein Text im Snapshot';

const erlass: BrowseErlass = {
  key: 'EPV', ebene: 'bund', kanton: null, kuerzel: 'EPV', titel: 'Verordnung über die Einzelpraxis',
  sr: '999.1', rechtsgebiet: 'oeffentlich', sprache: 'de', rang: 0, status: 'snapshot',
  datei: 'bund/EPV.json', artikelAnzahl: 1, stand: '2026-06-12',
  quelleUrl: 'https://www.fedlex.admin.ch/eli/cc/x/de', fassungsToken: '20260612', pdfPfad: null,
};

const eintrag = (artikel: string, extra: Partial<NormSnapshot> = {}): NormSnapshot => ({
  id: `bund/EPV/art_${artikel}`, ebene: 'bund', quelle: 'EPV', erlass: 'EPV',
  artikel, artikelLabel: `Art. ${artikel}`, bloecke: [{ absatz: null, text: '…' }],
  stand: '2026-06-12', quelleUrl: `https://x#art_${artikel}`, abgerufen: '2026-09-30',
  fassungsToken: '20260612', sha: artikel, ...extra,
});

/** Der Text der Ersatztext-Spans (`italic text-ink-500`) — das Wort des Körpers. */
const koerperWorte = (html: string) =>
  [...html.matchAll(/<span[^>]*class="italic text-ink-500"[^>]*>([^<]*)<\/span>/g)].map((m) => m[1]);

const body = (bloecke: NormSnapshot['bloecke'], extra: { artikelAufgehoben?: boolean; artikelGegenstandslos?: boolean } = {}) =>
  renderToStaticMarkup(<ArtikelBody bloecke={bloecke} artikel="2" passus={{ absatz: null }} {...extra} />);

const popover = (e: NormSnapshot) => renderToString(
  <MemoryRouter><NormPopover snapshot={e} passus={{ absatz: null }} onClose={() => {}} /></MemoryRouter>);

const leser = (e: NormSnapshot) =>
  renderToString(<ArtikelLeser e={e} erlass={erlass} basisPfad="/gesetze/bund/EPV" />);

describe('ArtikelBody — «…» sagt «aufgehoben» nur mit Beleg (§8)', () => {
  it('Artikel GANZ nur «…», kein Feld (EPV Anhang 2) ⇒ «kein Text im Snapshot», nie «aufgehoben»', () => {
    const out = body([{ absatz: null, text: '…' }]);
    expect(koerperWorte(out)).toEqual([KURZ]);
    expect(out).not.toContain('aufgehoben');
  });

  it('mehrere «…»-Blöcke, kein Feld ⇒ jeder sagt «kein Text im Snapshot»', () => {
    const out = body([{ absatz: '1', text: '…' }, { absatz: '2', text: '…' }]);
    expect(koerperWorte(out)).toEqual([KURZ, KURZ]);
  });

  it('«…» MIT amtlichem Feld ⇒ «aufgehoben»; MIT «gegenstandslos» ⇒ «gegenstandslos»', () => {
    expect(koerperWorte(body([{ absatz: null, text: '…' }], { artikelAufgehoben: true }))).toEqual(['aufgehoben']);
    expect(koerperWorte(body([{ absatz: null, text: '…' }], { artikelGegenstandslos: true }))).toEqual(['gegenstandslos']);
  });

  it('Gegenprobe: «…»-ABSATZ in einem sonst lebenden Artikel bleibt «aufgehoben» (Absatz-Auslassung)', () => {
    const out = body([{ absatz: '1', text: 'Gültiger Wortlaut des ersten Absatzes.' }, { absatz: '2', text: '…' }]);
    expect(koerperWorte(out)).toEqual(['aufgehoben']);
    expect(out).not.toContain(KURZ);
  });

  it('Gegenprobe: echter Wortlaut mit Auslassung im Satz bleibt unberührt', () => {
    const out = body([{ absatz: '1', text: 'Text mit … Auslassung im Satz.' }]);
    expect(koerperWorte(out)).toEqual([]);
    expect(out).toContain('Text mit … Auslassung im Satz.');
  });
});

describe('NormPopover — trägt den amtlichen Vermerk des Artikels in den Körper (§5)', () => {
  it('«…» ohne Feld ⇒ «kein Text im Snapshot»', () => {
    const out = popover(eintrag('2'));
    expect(koerperWorte(out)).toEqual([KURZ]);
    expect(out).not.toContain('aufgehoben');
  });

  it('«…» mit `aufgehoben` ⇒ «aufgehoben»; LEERER Block mit `aufgehoben` ⇒ «aufgehoben» (nicht «kein Text»)', () => {
    expect(koerperWorte(popover(eintrag('2', { aufgehoben: true })))).toEqual(['aufgehoben']);
    const leer = popover(eintrag('2', { aufgehoben: true, bloecke: [{ absatz: null, text: '' }] }));
    expect(koerperWorte(leer)).toEqual(['aufgehoben']);
    expect(leer).not.toContain(KURZ);
  });

  it('`gegenstandslos` ⇒ «gegenstandslos»', () => {
    expect(koerperWorte(popover(eintrag('2', { gegenstandslos: true })))).toEqual(['gegenstandslos']);
  });
});

describe('SynopseKarte — rechte Spalte «Wortlaut → …» am Zustand des geltenden Artikels', () => {
  const shard = {
    erlass: 'EPV', eli: 'cc/x', normProfil: 'p/1', erzeugt: '2026-09-30', fensterAb: '2021-01-01',
    kuenftigeStaende: [], staende: [], schritte: [],
  } as unknown as SynopseShard;
  const lage = (neuHerkunft: 'geltend' | 'folgestand') => ({
    art: 'vergleich',
    treffer: {
      schritt: { von: '2021-01-01', bis: '2024-01-01', artikel: [] },
      artikel: {
        eId: 'art_2', token: '2', label: 'Art. 2', art: 'geaendert', zustand: 'ereignis', shaNorm: 'a'.repeat(64),
        alt: [['', '', 'Früherer Wortlaut des Artikels.']],
      },
      neu: [['', '', '…']],
      neuHerkunft,
      mehrdeutig: false,
    },
  } as unknown as SynopseLage);
  const karte = (zustand: LeerstellenStatus, herkunft: 'geltend' | 'folgestand' = 'geltend') => renderToStaticMarkup(
    <SynopseKarte lage={lage(herkunft)} shard={shard} geltend={{ stand: '2026-06-12' }} zustand={zustand} id="x" />);

  it('ohne Vermerk (leer-ungeklaert) ⇒ Zeilenmarke und rechte Spalte «kein Text im Snapshot»', () => {
    const out = karte('leer-ungeklaert');
    expect(out).toContain(`— ${KURZ}`);
    expect(out).toContain(`>${KURZ}<`);
    expect(out).not.toContain('>aufgehoben<');
    expect(out).not.toContain('— aufgehoben');
  });

  it('mit Vermerk: «aufgehoben» bzw. «gegenstandslos», je beide Stellen', () => {
    const a = karte('aufgehoben');
    expect(a).toContain('— aufgehoben');
    expect(a).toContain('>aufgehoben<');
    const g = karte('gegenstandslos');
    expect(g).toContain('— gegenstandslos');
    expect(g).toContain('>gegenstandslos<');
    expect(g).not.toContain('>aufgehoben<');
  });

  it('Folgestand (rechte Spalte ist ein HISTORISCHER Stand, nicht der Korpus): der heutige Zustand gilt dort nicht', () => {
    // `zustand` beschreibt den GELTENDEN Artikel; ein früherer Stand trägt seine eigene
    // amtliche Auslassung — die Zeilenmarke bleibt beim bisherigen Wort.
    for (const z of ['leer-ungeklaert', 'gegenstandslos'] as const) {
      const out = karte(z, 'folgestand');
      expect(out, z).toContain('— aufgehoben');
      expect(out, z).not.toContain(KURZ);
    }
  });
});

describe('Querschnitt — dasselbe Zustandswort auf Leser, Popover und Synopse (§5: EINE Quelle)', () => {
  const fall: Array<[string, Partial<NormSnapshot>, LeerstellenStatus]> = [
    ['ohne Vermerk', {}, 'leer-ungeklaert'],
    ['aufgehoben', { aufgehoben: true }, 'aufgehoben'],
    ['gegenstandslos', { gegenstandslos: true }, 'gegenstandslos'],
  ];
  for (const [name, extra, erwartet] of fall) {
    it(`${name}: Statuszeile (Leser) = Körper (Popover) = leerstellenWort`, () => {
      const e = eintrag('2', extra);
      expect(artikelLeerstellenStatus(e.bloecke, e.aufgehoben, e.gegenstandslos)).toBe(erwartet);
      const wort = leerstellenWort(erwartet)!;
      expect(leser(e).replace(/<!-- -->/g, '')).toContain(`· ${wort}`);
      expect(koerperWorte(popover(e))).toEqual([wort]);
    });
  }
});

describe('Artikel-Index — «gegenstandslos» trägt sein Zustandswort (Datenfeld `gegenstandslos`)', () => {
  it('baueArtikelIndex setzt das Feld je Zeile; aufgehoben und gegenstandslos schliessen sich aus', () => {
    const gr = baueArtikelIndex([], [], [eintrag('1'), eintrag('2', { aufgehoben: true }), eintrag('3', { gegenstandslos: true })], null);
    const z = gr[0].zeilen;
    expect(z.map((x) => [x.token, x.aufgehoben, x.gegenstandslos === true])).toEqual([
      ['1', false, false], ['2', true, false], ['3', false, true],
    ]);
  });

  it('die Zeile sagt «gegenstandslos» (sichtbar UND im Namen), nie «aufgehoben»; ohne Feld kein Wort', () => {
    const gr = baueArtikelIndex([], [], [eintrag('1'), eintrag('2', { aufgehoben: true }), eintrag('3', { gegenstandslos: true })], null);
    const out = renderToStaticMarkup(<ArtikelIndex gruppen={gr} aktivToken={null} onSprung={() => {}} />);
    const zeile = (t: string) => out.split('<li>').find((s) => s.includes(`Art. ${t}</span>`)) ?? '';
    expect(zeile('3')).toContain('>gegenstandslos<');
    expect(zeile('3')).toContain('Art. 3 — gegenstandslos');
    expect(zeile('3')).not.toContain('aufgehoben');
    expect(zeile('2')).toContain('>aufgehoben<');
    expect(zeile('1')).not.toContain('aufgehoben');
    expect(zeile('1')).not.toContain('gegenstandslos');
  });
});
