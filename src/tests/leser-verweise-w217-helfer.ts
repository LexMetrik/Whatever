// Geteilte Test-Helfer für `leser-verweise-w217*.test.tsx` (Korpus-Zugriff, Leser-Weichen).
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { InternRefs } from '../components/NormText';
import type { BrowseErlass } from '../lib/normtext/browse-typen';
import type { NormSnapshot } from '../lib/normtext/typen';
import { istParagrafDesigniert } from '../pages/gesetz-leser/inhalt-sprung';

export type Eintrag = NormSnapshot;
const WURZEL = join(__dirname, '..', '..', 'public', 'normtext');

export const lade = (ebene: 'bund' | 'kanton', key: string): Eintrag[] =>
  JSON.parse(readFileSync(join(WURZEL, ebene, `${key}.json`), 'utf8')).eintraege;

/** Dieselbe Token-Ableitung wie `useInternRefs` (inhalt-sprung.tsx). */
export function internFuer(ebene: 'bund' | 'kanton', key: string, eintraege: Eintrag[]): InternRefs {
  const basisPfad = `/gesetze/${ebene}/${key}`;
  const tokenMap = new Map<string, string>();
  for (const e of eintraege) tokenMap.set(e.artikel.toLowerCase().replace(/[^a-z0-9]/g, ''), e.artikel);
  return { tokenMap, basisPfad, springeZu: () => {}, paragrafDesigniert: istParagrafDesigniert(basisPfad) };
}

export const art = (eintraege: Eintrag[], token: string): Eintrag => {
  const e = eintraege.find((x) => x.artikel === token);
  if (!e) throw new Error(`Artikel ${token} fehlt im Korpus`);
  return e;
};

export const bundPfad = (key: string) => ['', 'gesetze', 'bund', key].join('/');
export const blatt = (eintrag: Eintrag) => ({ eintrag });
const ERLASS_REST = { sr: '0', rechtsgebiet: 'privat', sprache: 'de', rang: 0, status: 'snapshot', datei: 'x' };
const ERLASS_REST2 = { artikelAnzahl: 1, stand: '2026-06-12', quelleUrl: 'x', fassungsToken: '20260612', pdfPfad: null };
export const erlassFuer = (key: string, kuerzel: string) => Object.assign({ key, ebene: 'bund', kanton: null, kuerzel, titel: kuerzel }, ERLASS_REST, ERLASS_REST2) as unknown as BrowseErlass;
