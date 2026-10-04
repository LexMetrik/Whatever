/**
 * XML-Cache für den Struktur-Lauf: lädt je gepinntem Bund-Erlass das amtliche
 * Akoma-Ntoso-XML DESSELBEN Stands (eli + Konsolidierung) wie das HTML-Cache
 * (`/tmp/<key>.html`, fedlex-cache.sh) nach `/tmp/<key>.xml`.
 *
 * Wozu: `struktur-marginalien-xml.ts` liest die Randtitel aus `fedlex:role="marginal"`.
 *
 * Auflösung: dieselbe SPARQL-Abfrage wie die Synopse (`baueStaendeQuery`: Konsolidierung →
 * deutsche XML-Manifestation, jüngste `-N`-Generation) — nie eine konstruierte URL (Skill
 * `scraping-swiss-official-sources`: der Filestore beantwortet Fehlendes mit HTTP 200 + Shell,
 * Erfolg = Content-Type xml UND keine Casemates-Shell).
 *
 * Pin-Marker `/tmp/<key>.xml.pin` = «eli|konsolidierung»: ein Cache gilt nur für genau
 * den gepinnten Stand (Muster wie `cache-pin-befund.ts` beim HTML; Re-Pin → Marker passt
 * nicht mehr → Neuladen). Ohne Netz, solange alle Marker stimmen.
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { sparqlBatch } from '../fedlex-sparql.ts';
import { baueStaendeQuery, baueStaende, type StandKandidat } from '../entstehung/synopse.ts';
import type { FedlexCacheEintrag } from './inventar-bund.ts';

export const xmlPfad = (key: string): string => `/tmp/${key.toLowerCase()}.xml`;
const pinText = (p: FedlexCacheEintrag): string => `${p.eli}|${p.konsolidierung}`;

/** Gilt der vorhandene XML-Cache für genau diesen Pin? */
export function xmlCacheGueltig(
  key: string,
  pins: ReadonlyMap<string, FedlexCacheEintrag>,
  vorhanden: (pfad: string) => boolean = existsSync,
  lies: (pfad: string) => string = (p) => readFileSync(p, 'utf8'),
): boolean {
  const pin = pins.get(key.toLowerCase());
  if (!pin) return false;
  const pfad = xmlPfad(key);
  return vorhanden(pfad) && vorhanden(`${pfad}.pin`) && lies(`${pfad}.pin`) === pinText(pin);
}

/** Der Stand eines Pins unter den aufgelösten Ständen seines Erlasses (Datum = Konsolidierung). */
export function xmlStandFuerPin(staende: readonly StandKandidat[], konsolidierung: string): StandKandidat | null {
  const datum = `${konsolidierung.slice(0, 4)}-${konsolidierung.slice(4, 6)}-${konsolidierung.slice(6, 8)}`;
  return staende.find((s) => s.datum === datum) ?? null;
}

/** Lädt die fehlenden/pin-veralteten XML-Caches; wirft bei jedem Fehlschlag (kein stiller Skip). */
export async function sicherstelleXmlCaches(
  keys: readonly string[],
  pins: ReadonlyMap<string, FedlexCacheEintrag>,
): Promise<void> {
  const fehlend = keys.filter((k) => !xmlCacheGueltig(k, pins));
  if (fehlend.length === 0) return;
  console.log(`\n[XML-Cache] ${fehlend.length} Cache(s) fehlen oder sind pin-veraltet — lade via Fedlex-SPARQL + Filestore …`);
  const eintraege = fehlend.map((k) => pins.get(k.toLowerCase())).filter((p): p is FedlexCacheEintrag => !!p);
  const abstracts = [...new Set(eintraege.map((p) => p.eli))];
  const bindings = await sparqlBatch(
    abstracts.map((e) => `<https://fedlex.data.admin.ch/eli/${e}>`),
    baueStaendeQuery,
    { batchGroesse: 20 },
  );
  const staende = baueStaende(bindings, '1900-01-01');
  const fehler: string[] = [];
  for (const p of eintraege) {
    const st = xmlStandFuerPin(staende.get(`https://fedlex.data.admin.ch/eli/${p.eli}`) ?? [], p.konsolidierung);
    if (!st) { fehler.push(`${p.name}: keine XML-Manifestation für Stand ${p.konsolidierung}`); continue; }
    const res = await fetch(st.xmlUrl);
    const typ = res.headers.get('content-type') ?? '';
    const xml = await res.text();
    if (!res.ok || !/xml/i.test(typ) || /<title>\s*Casemates/i.test(xml)) {
      fehler.push(`${p.name}: HTTP ${res.status} ${typ} ${st.xmlUrl}`);
      continue;
    }
    writeFileSync(xmlPfad(p.name), xml, 'utf8');
    writeFileSync(`${xmlPfad(p.name)}.pin`, pinText(p), 'utf8');
    await new Promise((r) => setTimeout(r, 200)); // höflich zum Filestore
  }
  if (fehler.length) throw new Error(`XML-Cache: ${fehler.length} Fehlschlag/Fehlschläge:\n${fehler.join('\n')}`);
}
