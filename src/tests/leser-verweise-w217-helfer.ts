// Geteilte Test-Helfer für `leser-verweise-w217*.test.tsx` (Korpus-Zugriff, Leser-Weichen).
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { InternRefs } from '../components/NormText';
import type { BrowseErlass } from '../lib/normtext/browse-typen';
import type { NormSnapshot } from '../lib/normtext/typen';
import type { Fussnote } from '../lib/normtext/browse';
import { baueKantonKuerzelKarte, istParagrafDesigniert } from '../pages/gesetz-leser/inhalt-sprung';

export type Eintrag = NormSnapshot;
const WURZEL = join(__dirname, '..', '..', 'public', 'normtext');

export const lade = (ebene: 'bund' | 'kanton', key: string): Eintrag[] =>
  JSON.parse(readFileSync(join(WURZEL, ebene, `${key}.json`), 'utf8')).eintraege;

type RegisterZeile = { key: string; kuerzel: string; kanton: string | null; status: string };
let registerCache: BrowseErlass[] | null = null;
const register = (): BrowseErlass[] =>
  (registerCache ??= JSON.parse(readFileSync(join(WURZEL, 'register.json'), 'utf8')).erlasse as BrowseErlass[]);

/** Register-Schlüssel aller lesbaren Snapshots einer Ebene (Korpus-Läufe). */
export const alleErlassKeys = (ebene: 'bund' | 'kanton'): string[] =>
  (register() as unknown as (RegisterZeile & { ebene: string; datei?: string })[])
    .filter((e) => e.ebene === ebene && e.status === 'snapshot' && e.datei).map((e) => e.key);

/** Register-Kürzel des Erlasses (das Feld, das `useInternRefs` als `eigenesKuerzel` bekommt). */
export const registerKuerzel = (key: string): string | undefined =>
  (register() as unknown as RegisterZeile[]).find((e) => e.key === key)?.kuerzel;

/** Dieselben Weichen wie `useInternRefs` (inhalt-sprung.tsx): Token-Karte, §-Designation,
 *  Register-Kürzel des Erlasses (V-2) und Kürzel-Karte des Kantons (V-3). Ohne die beiden
 *  letzten prüfte der Test einen Leser, den es nicht gibt (Prüfer-Befund 2.10.2026). */
export function internFuer(ebene: 'bund' | 'kanton', key: string, eintraege: Eintrag[]): InternRefs {
  const basisPfad = `/gesetze/${ebene}/${key}`;
  const tokenMap = new Map<string, string>();
  for (const e of eintraege) tokenMap.set(e.artikel.toLowerCase().replace(/[^a-z0-9]/g, ''), e.artikel);
  const zeile = (register() as unknown as RegisterZeile[]).find((e) => e.key === key);
  return {
    tokenMap, basisPfad, springeZu: () => {}, paragrafDesigniert: istParagrafDesigniert(basisPfad),
    eigenesKuerzel: zeile?.kuerzel,
    kantonKuerzel: baueKantonKuerzelKarte(register(), zeile?.kanton ?? null, key),
  };
}

/** Fussnoten je Artikel-Token, wie der Leser sie aus dem Struktur-Sidecar bekommt. */
export function fussnotenFuer(ebene: 'bund' | 'kanton', key: string): Record<string, Fussnote[] | undefined> {
  const pfad = join(WURZEL, 'struktur', ebene, `${key}.json`);
  if (!existsSync(pfad)) return {};
  const doc = JSON.parse(readFileSync(pfad, 'utf8')) as { artikel?: Record<string, { fussnoten?: Fussnote[] }> };
  return Object.fromEntries(Object.entries(doc.artikel ?? {}).map(([tok, a]) => [tok, a.fussnoten]));
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
