// ─── Bilder herunterladen, selbst hosten, aufräumen (Bilder&Formeln 1.7.2026) ───
//
// Der Extraktor erfasst je Bild die RELATIVE Quell-src («image/imageN.png»). Hier:
// → absolute Filestore-URL (gleiche Basis wie fedlex-cache.sh), herunterladen nach
// public/normtext/bilder/<erlass>/, sha über die Bytes, `datei` auf den lokalen Pfad.
//
// W2·27-BUND-FERTIG (Fedlex-Frische-Lauf 36838192603, 1.10.2026) — DREI Wurzeln, die
// diese Datei schliesst (vorher: `ladeBilder` in normtext-snapshot.ts, «Datei existiert
// → nur sha aus den Bytes; kein Re-Fetch»):
//
//  1. STALE-BY-NAME (Fidelitäts-Defekt, kein Schönheitsfehler): Fedlex NUMMERIERT die
//     Bilder je Konsolidierung NEU (SSV 20260701 → 20261001: «image27.png» ist ein
//     anderes Bild, zwei Bilder vorn eingefügt, die Folge verschiebt sich). Der alte
//     Name-Cache nahm die lokale Datei gleichen Namens, rechnete den sha AUS DEN
//     ALTEN BYTES und hängte ihn an den neuen Snapshot — das Tor `check:bilder`
//     (sha gegen Datei) blieb damit grün, obwohl ein FALSCHES Piktogramm unter dem
//     Artikel stand. Gemessen 1.10.2026 gegen die amtliche Fassung: 214 von 438
//     committeten Bild-Dateien auf main trugen andere Bytes als die gepinnte
//     Konsolidierung (SSV 210, MEPV 2, KKG 1, BVV_2 1). Fix: die Bytes kommen IMMER
//     aus der amtlichen Quelle der gepinnten Konsolidierung; eine lokale Datei wird
//     nur noch geschrieben, wenn sie von den amtlichen Bytes abweicht.
//  2. VERWAISTE DATEIEN: ein Re-Pin, der Bilder umbenennt, liess die alten Dateien
//     liegen (`check:bilder` Punkt 3: «17 verwaiste Bild-Dateien»). Fix: nach der
//     Erzeugung eines Erlasses wird sein Bilder-Ordner auf die tatsächlich
//     referenzierten Dateien zurückgeschnitten (deterministisch, NUR dieser Erlass).
//  3. ESCAPE-HATCH bleibt: Nicht-200 / Content-Type ≠ image/* → Build-Fehler
//     (nie ein stilles Bild-Loch, nie eine Soft-404-Shell als Bild).
//
// Rein bezüglich Netz/Dateisystem injizierbar (fetchImpl, bilderWurzel) → Unit-Test
// ohne Netz (bilder-sync.test.ts).
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import type { BildRef } from './extrahiere-fedlex.ts';

export const BILDER_BASIS = 'https://fedlex.data.admin.ch/filestore/fedlex.data.admin.ch/eli';
const BILDER_WURZEL_STANDARD = 'public/normtext/bilder';

type BlockMitBild = { bild?: BildRef; bildKacheln?: Array<{ bild?: BildRef }> };
type FetchLike = (url: string) => Promise<{
  ok: boolean;
  status: number;
  headers: { get(name: string): string | null };
  arrayBuffer(): Promise<ArrayBuffer>;
}>;

export interface BilderSitzung {
  /** Lädt/prüft jedes Bild der Blöcke, setzt `datei` (lokal) + `sha` (aus den amtlichen Bytes). */
  lade(bloecke: BlockMitBild[]): Promise<void>;
  /** Entfernt alle Dateien des Erlass-Ordners, die in dieser Sitzung nicht referenziert wurden.
   *  Liefert die entfernten Dateinamen (sortiert). Nur aufrufen, wenn ALLE Blöcke des Erlasses
   *  durch `lade` gelaufen sind. */
  raeumeAuf(): string[];
}

/** Eine Sitzung = ein Erlass in EINER Konsolidierung (die Bild-Nummerierung gilt nur dort). */
export function erstelleBilderSitzung(opts: {
  name: string;
  eli: string;
  konsolidierung: string;
  bilderWurzel?: string;
  fetchImpl?: FetchLike;
}): BilderSitzung {
  const nameLc = opts.name.toLowerCase();
  const dir = `${opts.bilderWurzel ?? BILDER_WURZEL_STANDARD}/${nameLc}`;
  const base = `${BILDER_BASIS}/${opts.eli}/${opts.konsolidierung}/de/html/`;
  const doFetch: FetchLike = opts.fetchImpl ?? ((u) => fetch(u));
  const referenziert = new Set<string>();
  const bytesProName = new Map<string, Buffer>(); // ein Bild, mehrfach referenziert → ein Abruf

  async function amtlicheBytes(relName: string, quellSrc: string): Promise<Buffer> {
    const bekannt = bytesProName.get(relName);
    if (bekannt) return bekannt;
    const url = `${base}${quellSrc}`; // base + «image/imageN.png»
    const res = await doFetch(url);
    const ct = res.headers.get('content-type') ?? '';
    if (!res.ok || !ct.startsWith('image/')) {
      throw new Error(
        `[Bilder] Download fehlgeschlagen: ${opts.name} ${url} → http=${res.status}, type=${ct}. ` +
          `(Filestore-URL instabil? Escape-Hatch: Erlass ausnehmen statt stilles Bild-Loch.)`,
      );
    }
    const bytes = Buffer.from(await res.arrayBuffer());
    bytesProName.set(relName, bytes);
    return bytes;
  }

  return {
    async lade(bloecke) {
      const refs: BildRef[] = [];
      for (const b of bloecke) {
        if (b.bild) refs.push(b.bild);
        for (const k of b.bildKacheln ?? []) if (k.bild) refs.push(k.bild);
      }
      for (const ref of refs) {
        if (ref.sha) continue; // im selben Lauf bereits verarbeitet
        const relName = ref.datei.split('/').pop() ?? ref.datei; // imageN.png
        const lokal = `${dir}/${relName}`;
        const bytes = await amtlicheBytes(relName, ref.datei);
        if (!existsSync(lokal) || !readFileSync(lokal).equals(bytes)) {
          mkdirSync(dir, { recursive: true });
          writeFileSync(lokal, bytes);
        }
        referenziert.add(relName);
        ref.sha = createHash('sha256').update(bytes).digest('hex');
        ref.datei = `bilder/${nameLc}/${relName}`;
      }
    },
    raeumeAuf() {
      if (!existsSync(dir)) return [];
      const entfernt: string[] = [];
      for (const datei of readdirSync(dir).sort()) {
        if (referenziert.has(datei)) continue;
        rmSync(`${dir}/${datei}`);
        entfernt.push(datei);
      }
      if (readdirSync(dir).length === 0) rmSync(dir, { recursive: true });
      return entfernt;
    },
  };
}
