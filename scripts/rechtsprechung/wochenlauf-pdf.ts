// ─── Wochenlauf-Stichprobe: PDF-Text für die Identitätsprüfung ──────────────
//
// Die Quell-URLs von BStGer, BE, SG, GR, AG (und BVGer über OCL `pdf_url`)
// liefern PDF (Messung 25.9.2026, ua-mess-B §4). Für die Stichprobe genügt der
// Fliesstext in Lesereihenfolge — KEINE Geometrie-Pipeline wie
// `extrahierePdfZeilen` (adapter-pdf.ts), die Kopf-/Fussbänder und Marginalien
// aussondert: dort steht bei Urteilen oft gerade das Aktenzeichen. Dieselbe
// Bibliothek (pdfjs-dist, legacy-Build wie adapter-pdf.ts), keine neue
// Dependency.
//
// Fügeregel (Aktenzeichen dürfen nicht zerreissen, «F-4218/» + «2026»): zwei
// Fragmente derselben Zeile, zwischen denen weniger als ein Viertel der
// Schrifthöhe Abstand liegt, werden OHNE Leerzeichen verbunden; sonst ein
// Leerzeichen; `hasEOL`/Zeilenwechsel ergibt einen Zeilenumbruch. Rein und
// deterministisch (§2) für gleiche Bytes.

interface Stueck { str: string; x: number; y: number; w: number; h: number; eol: boolean }

/** Fragmente einer Seite zu Text fügen (ausgelagert und exportiert für den Test). */
export function fuegeStuecke(stuecke: Stueck[]): string {
  let out = '';
  let vor: Stueck | null = null;
  for (const s of stuecke) {
    if (vor) {
      const gleicheZeile = Math.abs(s.y - vor.y) < Math.max(1, Math.min(s.h, vor.h) * 0.5);
      if (vor.eol || !gleicheZeile) out += '\n';
      else {
        const luecke = s.x - (vor.x + vor.w);
        const anliegend = luecke < Math.max(0.5, Math.min(s.h, vor.h) * 0.25);
        if (!anliegend && !out.endsWith(' ') && !s.str.startsWith(' ')) out += ' ';
      }
    }
    out += s.str;
    vor = s;
  }
  return out;
}

/**
 * Volltext eines PDF (alle Seiten, getrennt durch Seitenvorschub «\f» — `amtlichesDatum`
 * liest daran den Kopf einer Folgeseite, SG-Deckblatt 26.9.2026); leerer String, wenn
 * keine Textebene (Scan).
 */
export async function pdfText(bytes: Uint8Array): Promise<string> {
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
  const doc = await pdfjs.getDocument({ data: bytes, useSystemFonts: true, isEvalSupported: false }).promise;
  const seiten: string[] = [];
  try {
    for (let p = 1; p <= doc.numPages; p++) {
      const inhalt = await (await doc.getPage(p)).getTextContent();
      const stuecke: Stueck[] = [];
      for (const it of inhalt.items) {
        const i = it as { str?: string; transform?: number[]; width?: number; height?: number; hasEOL?: boolean };
        if (typeof i.str !== 'string' || !i.transform) continue;
        stuecke.push({ str: i.str, x: i.transform[4], y: i.transform[5], w: i.width ?? 0, h: i.height ?? 0, eol: !!i.hasEOL });
      }
      seiten.push(fuegeStuecke(stuecke));
    }
  } finally {
    await doc.destroy();
  }
  return seiten.join('\f');
}
