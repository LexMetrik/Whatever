/**
 * W2·17-UI-BEFUNDE · Folgebefunde aus der Prüfung von #1272 (2.10.2026):
 *
 *  (1) §8 — das Panel zitierte den Schlusstitel-Artikel `disp_u1_art_3` als
 *      «Art. 3 ZGB» (= der Hauptartikel) und schrieb «Zu Art. 3 ist kein Entscheid
 *      … erfasst», obwohl der Hauptartikel 3 Leitentscheide trägt. Richtig: die
 *      amtliche Form «Art. 3 SchlT ZGB» (Beleg: `../pages/gesetz-leser/
 *      artikelBezeichnung.ts`), bei Gruppen ohne Kurzform die ausgeschriebene
 *      Gruppe; und weil die Entscheid-Zuordnung keinen einzigen `disp_`-Schlüssel
 *      kennt, ehrlich «nicht zugeordnet» statt «kein Entscheid erfasst».
 *  (2) Rückfallform ohne Sidecar zeigt keinen Rohschlüssel («disp_u1») mehr.
 *  (3) Weiterlesen: Chip «Weiterlesen bei Art. 457», 100-px-Scroll im Art. 1 —
 *      die gemerkte Stelle wurde sofort durch «Art. 1» überschrieben (Browser,
 *      2.10.2026), der zweite Reload bot nichts mehr an.
 *
 * ROT ZU BEKOMMEN (§6.7): (1) `zitatKuerzel` auf `return kuerzel` bzw. die Regel «nur wo das Label mehrdeutig ist», (3) in
 * `useWeiterlesen` die Zeile `if (angebotOffen.current) return;` streichen.
 */
import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { parseHTML } from 'linkedom';
import fs from 'node:fs';
import path from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { StrukturMap } from '../lib/normtext/browse';
import type { BrowseErlass } from '../lib/normtext/browse-typen';
import type { NormSnapshot } from '../lib/normtext/typen';
import type { BezugStatus } from '../lib/verzahnung/facetten';
import { eindeutigeBezeichnung, zitatKuerzel } from '../pages/gesetz-leser/artikelBezeichnung';
import { useWeiterlesen } from '../pages/gesetz-leser/inhalt-weiterlesen';
import { holeLesePosition, merkeLesePosition } from '../pages/gesetz-leser/lesePosition';
import { normZitat } from '../pages/gesetz-leser/v3/panelModell';
import { PanelEntscheide } from '../pages/gesetz-leser/v3/PanelEntscheide';

const WURZEL = path.join(process.cwd(), 'public/normtext');
const lies = (rel: string) => JSON.parse(fs.readFileSync(path.join(WURZEL, rel), 'utf8'));
const eintraegeVon = (k: string) => lies(`bund/${k}.json`).eintraege as NormSnapshot[];
const strukturVon = (k: string) => lies(`struktur/bund/${k}.json`).artikel as StrukturMap;

describe('(1) amtliches Zitat im Panel', () => {
  const zgb = eintraegeVon('ZGB');
  const zgbStruktur = strukturVon('ZGB');
  const orE = eintraegeVon('OR');
  const orStruktur = strukturVon('OR');
  const zitat = (token: string, kuerzel: string, e: NormSnapshot[], s: StrukturMap | null) => {
    const label = e.find((x) => x.artikel === token)!.artikelLabel;
    return normZitat(label, zitatKuerzel(token, label, kuerzel, s, e));
  };

  it('ZGB-Schlusstitel: «Art. 3 SchlT ZGB» — nicht «Art. 3 ZGB»', () => {
    expect(zitat('disp_u1_art_3', 'ZGB', zgb, zgbStruktur)).toBe('Art. 3 SchlT ZGB');
    expect(zitat('disp_u1_art_3', 'ZGB', zgb, null)).toBe('Art. 3 SchlT ZGB'); // auch ohne Sidecar
  });

  it('Gegenprobe: der Hauptartikel 3 bleibt «Art. 3 ZGB»', () => {
    expect(zitat('3', 'ZGB', zgb, zgbStruktur)).toBe('Art. 3 ZGB');
  });

  it('OR-Übergangsgruppe: keine erfundene Kurzform, die Gruppe steht ausgeschrieben', () => {
    expect(zitat('disp_u3_art_1', 'OR', orE, orStruktur))
      .toBe('Art. 1 OR (Übergangsbestimmungen der Änderung vom 16. Dezember 2005)');
  });

  it('ZGB disp_u2 («Wortlaut der früheren Bestimmungen») heisst nie «Übergangs-/Schlussbestimmungen»', () => {
    const z = zitat('disp_u2_art_178', 'ZGB', zgb, zgbStruktur);
    expect(z).toBe('Art. 178 ZGB (Wortlaut der früheren Bestimmungen des sechsten Titels)');
    expect(eindeutigeBezeichnung('disp_u2_art_178', 'Art. 178', null)).not.toMatch(/Übergangs|Schluss/);
  });

  it('(2) ohne Sidecar: nutzertauglich, eindeutig, ohne Rohschlüssel', () => {
    const a = eindeutigeBezeichnung('disp_u3_art_1', 'Art. 1', null);
    const b = eindeutigeBezeichnung('disp_u2_art_1', 'Art. 1', null);
    const z = zitat('disp_u3_art_1', 'OR', orE, null);
    for (const t of [a, b, z]) expect(t).not.toMatch(/disp_/);
    expect(a).not.toBe(b);
    expect(z).toContain('OR (');
    expect(z).not.toBe('Art. 1 OR');
  });

  it('Korpus: über OR, ZGB und SchKG nennt kein Zitat zwei verschiedene Artikel (mit und ohne Sidecar)', () => {
    for (const [kz, mitSidecar] of [['OR', true], ['ZGB', true], ['SCHKG', true], ['OR', false], ['ZGB', false], ['SCHKG', false]] as const) {
      const e = eintraegeVon(kz);
      const s = mitSidecar ? strukturVon(kz) : null;
      const kuerzel = kz === 'SCHKG' ? 'SchKG' : kz;
      const wer = new Map<string, string[]>();
      let uebergang = 0;
      for (const x of e) {
        const z = normZitat(x.artikelLabel, zitatKuerzel(x.artikel, x.artikelLabel, kuerzel, s, e));
        wer.set(z, [...(wer.get(z) ?? []), x.artikel]);
        if (x.artikel.startsWith('disp_')) uebergang++;
      }
      expect(uebergang, `${kz}: Übergangsartikel gelesen`).toBeGreaterThan(0);
      expect([...wer].filter(([, t]) => t.length > 1), `${kz} sidecar=${mitSidecar}`).toEqual([]);
    }
  });

  describe('Nachzug · die Qualifikation hängt an «eigene Nummern», nicht an «mehrdeutig»', () => {
    const zitatVon = (k: string, kz: string, token: string) => {
      const e = eintraegeVon(k);
      const x = e.find((y) => y.artikel === token)!;
      return normZitat(x.artikelLabel, zitatKuerzel(token, x.artikelLabel, kz, strukturVon(k), e));
    };

    it('(a) ALLE ZGB-Schlusstitel-Artikel (disp_u1) tragen «SchlT» — auch die ohne Hauptteil-Gegenstück (Art. 6a)', () => {
      const alle = zgb.filter((x) => x.artikel.startsWith('disp_u1_'));
      const ohneSchlT = alle.filter((x) => !normZitat(x.artikelLabel, zitatKuerzel(x.artikel, x.artikelLabel, 'ZGB', zgbStruktur, zgb)).includes(' SchlT ZGB'));
      expect(alle.length, 'Vorbedingung: der Schlusstitel ist gelesen').toBeGreaterThanOrEqual(100);
      expect(ohneSchlT.map((x) => x.artikel)).toEqual([]);
      expect(zitatVon('ZGB', 'ZGB', 'disp_u1_art_6_a')).toBe('Art. 6a SchlT ZGB'); // «Art. 6a ZGB» gibt es nicht
    });

    it('(b) OR disp_u12_art_2_4 («Art. 2–4») trägt die Gruppe, nicht «Art. 2–4 OR»', () => {
      const z = zitatVon('OR', 'OR', 'disp_u12_art_2_4');
      expect(z).toBe('Art. 2–4 OR (Schlussbestimmungen zum VIII. Titel und zum VIIIbis. Titel)');
    });

    it('(c) PatG (Art. 141–149) und VZG (Art. 135–136) setzen die Hauptnummerierung fort: blosse Form', () => {
      const patg = eintraegeVon('PATG').filter((x) => x.artikel.startsWith('disp_'));
      const vzg = eintraegeVon('VZG').filter((x) => x.artikel.startsWith('disp_'));
      expect(patg.length).toBeGreaterThan(0);
      expect(vzg.length).toBeGreaterThan(0);
      for (const x of patg) expect(zitatVon('PATG', 'PatG', x.artikel), x.artikel).toBe(`${x.artikelLabel} PatG`);
      for (const x of vzg) expect(zitatVon('VZG', 'VZG', x.artikel), x.artikel).toBe(`${x.artikelLabel} VZG`);
    });

    it('Gegenprobe: ZGB disp_u2 (Art. 178–251, Nummern des Hauptteils wiederholt) bleibt Gruppe, KEIN SchlT', () => {
      const z = zitatVon('ZGB', 'ZGB', 'disp_u2_art_178');
      expect(z).toBe('Art. 178 ZGB (Wortlaut der früheren Bestimmungen des sechsten Titels)');
      expect(z).not.toContain('SchlT');
    });

    it('Korpus: jeder Übergangsartikel einer Gruppe mit eigenen Nummern ist qualifiziert, jede fortlaufende Gruppe blank', () => {
      const falsch: string[] = [];
      const zaehler = { eigene: 0, fortlaufend: 0 };
      for (const datei of fs.readdirSync(path.join(WURZEL, 'bund')).filter((f) => f.endsWith('.json'))) {
        const kz = datei.replace('.json', '');
        const e = eintraegeVon(kz);
        const disp = e.filter((x) => x.artikel.startsWith('disp_'));
        if (!disp.length) continue;
        const nummer = (l: string) => Number(/\d+/.exec(l)?.[0]);
        const hauptLetzte = nummer(e.filter((x) => /^\d/.test(x.artikel)).at(-1)!.artikelLabel);
        for (const x of disp) {
          const ns = x.artikel.replace(/_art.*/, '');
          const gruppe = disp.filter((y) => y.artikel.startsWith(`${ns}_`)).map((y) => nummer(y.artikelLabel));
          const fortlaufend = Math.min(...gruppe) > hauptLetzte;
          const z = zitatKuerzel(x.artikel, x.artikelLabel, kz, null, e);
          if (fortlaufend) zaehler.fortlaufend++;
          else zaehler.eigene++;
          if (fortlaufend ? z !== kz : z === kz) falsch.push(`${kz}:${x.artikel} → «${z}»`);
        }
      }
      expect(zaehler.eigene, 'Vorbedingung').toBeGreaterThan(200);
      expect(zaehler.fortlaufend, 'Vorbedingung').toBeGreaterThan(0);
      expect(falsch).toEqual([]);
    });
  });

  describe('Reiter «Entscheide» an einem Übergangsartikel', () => {
    const basis = {
      revisionShard: null, bestimmungsWort: 'Artikel' as const,
      klassen: ['bge', 'bger', 'eidg', 'kantonal'] as BezugStatus[], kantone: [] as string[], kantoneVerfuegbar: [] as string[],
      histogramm: { balken: [], ohneJahr: 0 }, bereich: { von: '', bis: '' },
      onKlassen: () => {}, onKantone: () => {}, onBereich: () => {},
    };
    const text = (p: { aktArtikel: string; artikelLabel: string; normZitat: string }) =>
      renderToString(<MemoryRouter><PanelEntscheide {...basis} {...p} geladen kanten={[]} alleKanten={[]} /></MemoryRouter>)
        .replace(/<[^>]+>/g, '').replace(/\s+/g, ' ');

    it('sagt «nicht zugeordnet» mit dem amtlichen Zitat — nie «kein Entscheid erfasst», nie «Zu Art. 3 ZGB»', () => {
      const t = text({ aktArtikel: 'disp_u1_art_3', artikelLabel: 'Art. 3', normZitat: 'Art. 3 SchlT ZGB' });
      expect(t).toContain('Zu Art. 3 SchlT ZGB sind keine Entscheide zugeordnet: die Zuordnung deckt den Hauptteil des Erlasses ab');
      expect(t).not.toContain('kein Entscheid');
      expect(t).not.toContain('Zu Art. 3 ZGB');
    });

    it('Gegenprobe: ein Hauptartikel ohne Entscheid behält den Bestandssatz', () => {
      const t = text({ aktArtikel: '3', artikelLabel: 'Art. 3', normZitat: 'Art. 3 ZGB' });
      expect(t).toContain('Zu Art. 3 ist kein Entscheid der eingeschalteten Instanzen erfasst.');
    });
  });
});

// ─── (3) Weiterlesen ─────────────────────────────────────────────────────────
describe('(3) Weiterlesen — ein offenes Angebot wird nicht überschrieben', () => {
  let root: Root | null = null;
  const erlass = { key: 'ZGB', stand: '2026-07-01' } as unknown as BrowseErlass;
  const eintraege = ['1', '2', '3', '457'].map((t) => ({ artikel: t, artikelLabel: `Art. ${t}` })) as unknown as NormSnapshot[];

  function aufbauen(): HTMLElement {
    const { document } = parseHTML('<!doctype html><html><body><div id="app"></div></body></html>');
    vi.stubGlobal('window', {
      document,
      setTimeout: (...a: Parameters<typeof setTimeout>) => globalThis.setTimeout(...a),
      clearTimeout: (...a: Parameters<typeof clearTimeout>) => globalThis.clearTimeout(...a),
    });
    vi.stubGlobal('document', document);
    vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
    const speicher = new Map<string, string>();
    vi.stubGlobal('localStorage', {
      getItem: (k: string) => speicher.get(k) ?? null,
      setItem: (k: string, v: string) => void speicher.set(k, v),
      removeItem: (k: string) => void speicher.delete(k),
    });
    return document.getElementById('app') as unknown as HTMLElement;
  }
  afterEach(() => {
    if (root) act(() => root!.unmount());
    root = null;
    vi.unstubAllGlobals();
  });

  function sonde() {
    const ziel = aufbauen();
    const holder: { api: ReturnType<typeof useWeiterlesen> | null } = { api: null };
    function Sonde({ token }: { token: string | null }) {
      holder.api = useWeiterlesen({
        erlass, eintraege, struktur: null, istSekundaer: false, locationHash: '',
        aktArtikel: token ? `Art. ${token}` : null, aktivToken: token, springeZuArtikel: () => {},
      });
      return null;
    }
    root = createRoot(ziel);
    const rendern = async (token: string | null) => {
      await act(async () => { root!.render(createElement(Sonde, { token })); });
      await act(async () => { await new Promise((r) => globalThis.setTimeout(r, 5)); });
    };
    return { holder, rendern };
  }

  it('Angebot «Art. 457» steht, der Spy meldet Art. 1: die gemerkte Stelle bleibt «Art. 457»', async () => {
    const s = sonde();
    merkeLesePosition({ key: 'ZGB', token: '457', label: 'Art. 457', stand: '2026-07-01' });
    await s.rendern(null);
    expect(s.holder.api!.weiterlesen?.token).toBe('457');
    await s.rendern('1'); // 100-px-Scroll im ersten Artikel
    expect(s.holder.api!.weiterlesen?.token, 'Chip steht weiter').toBe('457');
    expect(holeLesePosition('ZGB', '2026-07-01')?.token, 'der zweite Reload bietet weiter «Art. 457» an').toBe('457');
  });

  it('liest der Nutzer selbst weiter (anderer Artikel), ist das Angebot beantwortet und die Stelle wird fortgeschrieben', async () => {
    const s = sonde();
    merkeLesePosition({ key: 'ZGB', token: '457', label: 'Art. 457', stand: '2026-07-01' });
    await s.rendern(null);
    await s.rendern('1');
    await s.rendern('2');
    expect(s.holder.api!.weiterlesen).toBeNull();
    expect(holeLesePosition('ZGB', '2026-07-01')?.token).toBe('2');
  });

  it('Gegenprobe: ohne gemerkte Stelle schreibt der Spy sofort (nichts angeboten, nichts zu schützen)', async () => {
    const s = sonde();
    await s.rendern(null);
    expect(s.holder.api!.weiterlesen).toBeNull();
    await s.rendern('2');
    expect(holeLesePosition('ZGB', '2026-07-01')?.token).toBe('2');
  });

  it('Verwerfen vergisst die Stelle und gibt das Schreiben frei', async () => {
    const s = sonde();
    merkeLesePosition({ key: 'ZGB', token: '457', label: 'Art. 457', stand: '2026-07-01' });
    await s.rendern(null);
    await s.rendern('1');
    await act(async () => { s.holder.api!.weiterlesenVerwerfen(); });
    await s.rendern('1');
    expect(s.holder.api!.weiterlesen).toBeNull();
    expect(holeLesePosition('ZGB', '2026-07-01')?.token).toBe('1');
  });
});
