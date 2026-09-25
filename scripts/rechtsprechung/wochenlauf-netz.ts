// ─── Wochenlauf: Netz-Teil der Stichprobe und der Frische (aus wochenlauf.ts) ─
//
// Ausgelagert, damit die CLI und eine Beleg-Messung DENSELBEN Code fahren
// (Stichprobe gegen reale Quellen, 25.9.2026). Höflich: 30 s Timeout, zwei
// Versuche je URL, 1,5 s Pause; OCL über jget (adapter-entscheide.ts).
import {
  pruefeIdentitaet, pruefeText, oclIdFuerPdf, gruppeVon, bewerteFrische, aktiveGerichte, EIDG_GERICHTE, KANTONS_GERICHTE,
  type RegEintrag, type StichprobenZeile, type FrischeZeile,
} from './wochenlauf-kern';
import { pdfText } from './wochenlauf-pdf';
import { mitFrist, NICHT_GEPRUEFT } from './wochenlauf-vorwoche';
import { clirKandidaten, bgeRefZuClirId } from '../normtext/clir-regeste';
import { jget, type OclDecision } from '../normtext/adapter-entscheide';

const OCL = 'https://mcp.opencaselaw.ch/api'; // wie adapter-entscheide.ts (API nicht exportiert)

/**
 * Fehlerklasse eines gescheiterten fetch für den Bericht (M4, Probelauf 25.9.2026: BE nur vom
 * Runner «nicht erreichbar», Ursache verworfen ⇒ Diagnose unmöglich). undici hängt die
 * Ursache an `cause` (Code wie CERT_HAS_EXPIRED, ECONNRESET); AbortSignal.timeout wirft TimeoutError.
 */
export function fehlerKlasse(x: unknown): string {
  const f = x as { name?: string; message?: string; cause?: { code?: string; name?: string; message?: string } };
  const code = f?.cause?.code ?? '';
  if (f?.name === 'TimeoutError' || f?.name === 'AbortError' || /TIMEOUT/.test(code)) return 'Timeout';
  if (/CERT|TLS|SSL|SELF_SIGNED|UNABLE_TO_VERIFY/i.test(code + ' ' + (f?.cause?.message ?? ''))) return `TLS ${code || (f?.cause?.message ?? '').slice(0, 60)}`.trim();
  return `Netz ${code || f?.cause?.name || f?.name || 'Fehler'}`.trim();
}

/**
 * Amtliche Quelle holen: höflich, 30 s Timeout; nächste URL bei 5xx/Netzfehler (Reihenfolge der
 * Liste, BGE: clirKandidaten). Scheitert jede URL: `fehler` = letzter Status bzw. Fehlerklasse
 * («HTTP 403», «TLS CERT_HAS_EXPIRED», «Timeout») statt still null.
 */
export async function holeSeite(urls: string[]): Promise<{ url: string; bytes: Uint8Array; utf8: boolean } | { fehler: string }> {
  let fehler = 'keine Quell-URL';
  for (const url of urls) {
    for (let i = 0; i < 2; i++) {
      try {
        const r = await fetch(url, { signal: AbortSignal.timeout(30_000), headers: { 'User-Agent': 'LexMetrik/1.0 (+https://lexmetrik.vercel.app; Wochenlauf-Stichprobe)' } });
        if (r.ok) return { url, bytes: new Uint8Array(await r.arrayBuffer()), utf8: /utf-8/i.test(r.headers.get('content-type') ?? '') };
        fehler = `HTTP ${r.status}`;
        if (r.status < 500) break;
      } catch (x) { fehler = fehlerKlasse(x); /* Netz: nächster Versuch */ }
      await new Promise((ok) => setTimeout(ok, 1500));
    }
  }
  return { fehler };
}

/** Quell-URLs in Abrufreihenfolge. BGE: clirKandidaten (clir-regeste.ts, eine Quelle, §5 — search.bger.ch, dann www.bger.ch). */
export async function urlsFuer(e: RegEintrag): Promise<string[]> {
  if (gruppeVon(e) === 'bge') {
    const id = bgeRefZuClirId(e.bgeReferenz ?? '');
    return id ? clirKandidaten(id, 'de') : [];
  }
  const ocl = oclIdFuerPdf(e);
  const pdf = ocl ? (await jget<OclDecision>(`${OCL}/decisions/${encodeURIComponent(ocl)}`))?.pdf_url : null;
  return [...new Set([pdf, e.quelleUrl].filter((u): u is string => !!u))];
}

export async function stichprobeZeile(e: RegEintrag): Promise<StichprobenZeile> {
  const urls = await urlsFuer(e);
  const seite = await holeSeite(urls);
  if ('fehler' in seite) return { key: e.key, url: urls[0] ?? null, ergebnis: 'nicht-pruefbar', detail: urls.length ? `Quelle nicht erreichbar — ${seite.fehler}` : 'keine Quell-URL' };
  let id;
  if (new TextDecoder('latin1').decode(seite.bytes.slice(0, 5)) === '%PDF-') {
    try { id = pruefeText(await pdfText(seite.bytes), e, 'pdf'); }
    catch (x) { id = { treffer: null, detail: `PDF nicht lesbar: ${(x as Error).message.slice(0, 80)}` }; }
  } else {
    id = pruefeIdentitaet(new TextDecoder(seite.utf8 ? 'utf-8' : 'iso-8859-1').decode(seite.bytes), e);
  }
  return { key: e.key, url: seite.url, ergebnis: id.treffer === null ? 'nicht-pruefbar' : id.treffer ? 'treffer' : 'fehltreffer', detail: id.detail, akz: id.akz, datum: id.datum };
}

/**
 * Jüngstes Quelldatum je Gericht aus dem OCL-Listing (neueste zuerst); Kantone wie der Generator nur de.
 * `weiter` = Lauf-Frist noch offen (N2): danach kein Abruf mehr, Zeile «nicht geprüft».
 */
export async function frische(datum: string, nachher: RegEintrag[], weiter: () => boolean = () => true): Promise<{ zeilen: FrischeZeile[]; uebersprungen: number }> {
  const registerDatum = (c: string) => nachher.filter((e) => e.gericht === c && !e.verweis).reduce<string | null>((m, e) => (!m || e.datum > m ? e.datum : m), null);
  const r = await mitFrist(aktiveGerichte([...EIDG_GERICHTE, ...KANTONS_GERICHTE]), weiter, async (c) => {
    const spr = KANTONS_GERICHTE.includes(c) ? '&language=de' : '';
    const d = await jget<{ results?: OclDecision[] }>(`${OCL}/decisions?court=${c}${spr}&sort=date_desc&limit=1&fields=compact`, 2, 30_000);
    return bewerteFrische(datum, c, d?.results?.[0]?.decision_date ?? null, registerDatum(c));
  }, (c): FrischeZeile => ({ gericht: c, quelle: null, register: registerDatum(c), luecke: null, hinweis: NICHT_GEPRUEFT }));
  return { zeilen: r.out, uebersprungen: r.uebersprungen };
}

