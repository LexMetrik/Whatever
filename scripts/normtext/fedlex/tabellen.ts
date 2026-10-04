/**
 * Fedlex-Extraktor — <table> → mehrspaltig-Block (Alt-Parse {kopf,zeilen} und Roh-Parse für
 * `normalisiereTabelle`). Split aus `extrahiere-fedlex.ts`, W2·27-BUND-FERTIG PR 0, 2.10.2026.
 * Code und Kommentare unverändert verschoben.
 */
import { entferneTags } from './text.ts';
import type { RohTabelle, RohZelle } from '../tabelle-normalisieren.ts';

/** Tag-/Fussnoten-bereinigter Inhalt einer Tabellen-Zelle. */
function zellText(c: string): string {
  return entferneTags(c.replace(/<sup[^>]*><a[\s\S]*?<\/a><\/sup>/gi, ''));
}

/**
 * Zerlegt die Zellen einer <tr> (Tag `td` oder `th`) zu einem Spalten-Array und
 * EXPANDIERT colspan: eine Zelle mit colspan=N belegt N Spalten — der Text steht
 * in der ersten, die übrigen (N-1) sind leer. So bleibt die Spaltenzahl von Kopf
 * und Daten konsistent, wenn NUR der Kopf gruppierte (colspan-)Zellen hat
 * (GebV SchKG art_30: Kopf 2 colspan-Zellen über 6 Datenspalten). Minimal — kein
 * Zell-Merge/rowspan (David-Entscheid 28.6.: «minimal colspan→Kopf-Padding»).
 */
function zeileMitColspan(rowHtml: string, tag: 'td' | 'th'): string[] {
  const zellen: string[] = [];
  const re = new RegExp(`<${tag}\\b([^>]*)>([\\s\\S]*?)</${tag}>`, 'gi');
  for (const c of rowHtml.matchAll(re)) {
    const span = Number(c[1].match(/\bcolspan=["']?(\d+)/i)?.[1] ?? '1') || 1;
    zellen.push(zellText(c[2]));
    for (let k = 1; k < span; k++) zellen.push('');
  }
  return zellen;
}

/**
 * Zerlegt eine Fedlex-<table> in einen mehrspaltig-Block {kopf, zeilen}.
 *
 * ZWEI Markup-Varianten:
 *  (A) <th>-Tabellen (IVG art_28b, AHVV/BVG-Tarife): erste/letzte <th>-Zeile =
 *      Kopf, <td>-Zeilen = Daten — colspan wird (wie bisher) IGNORIERT, weil dort
 *      Kopf UND Daten dieselben colspan tragen und so konsistent ausgerichtet
 *      sind (Audit «colspan widerlegt» trifft für <th>-Tabellen zu). UNVERÄNDERT
 *      → byte-gleich.
 *  (B) kpf-als-<td>-Tabellen (GebV SchKG art_30): KEIN <th>, der Kopf steht als
 *      <td><p class="man-template-tab-kpf">…</p></td> — bisher als Datenzeile
 *      verkannt (G20) und ohne colspan-Expansion gegen die Daten verschoben.
 *      Hier: Kopf-Zeilen erkennen, colspan KONSISTENT (Kopf + Daten dieser
 *      Tabelle) expandieren, mehrere Kopfzeilen spaltenweise zusammenführen
 *      (G19: obere Kopfzeile ging sonst verloren).
 * Reale Struktur: <tr><td colspan="4"><p class="man-template-tab-kpf">…</p></td>…</tr>.
 */
export function parseFedlexTabelle(tableInner: string, anhang = false): { kopf?: string[]; zeilen: string[][] } {
  const hatTh = /<th\b/i.test(tableInner);
  const istKpfStil = !hatTh && /man-template-tab-kpf/i.test(tableInner);

  if (!istKpfStil) {
    // ── Variante (A) + plain-<td>: bestehender Pfad, byte-gleich ──────────────
    let kopf: string[] = [];
    const zeilen: string[][] = [];
    for (const r of tableInner.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)) {
      const ths = [...r[1].matchAll(/<th\b[^>]*>([\s\S]*?)<\/th>/gi)].map((c) => zellText(c[1]));
      if (ths.length > 0) {
        if (!ths.some((x) => x !== '')) continue;
        // M13-Annex (Gegenprüfung), NUR im Anhang-Pfad: <th>-DATEN-Zeile (Klasse
        // krpr/utit) ist KEIN Kopf — sonst überschriebe eine reine <th>-Tabelle
        // (LRV Anhang 3) ihren Kopf zeilenweise und verlöre ALLE Datenzeilen (§1).
        // Haupttext-Pfad UNVERÄNDERT (jede nicht-leere <th>-Zeile = Kopf, byte-gleich).
        if (anhang && /man-template-tab-(?:krpr|utit)/i.test(r[1])) zeilen.push(ths);
        else kopf = ths;
        continue;
      }
      const tds = [...r[1].matchAll(/<td\b[^>]*>([\s\S]*?)<\/td>/gi)].map((c) => zellText(c[1]));
      if (tds.some((x) => x !== '')) zeilen.push(tds);
    }
    return kopf.length > 0 ? { kopf, zeilen } : { zeilen };
  }

  // ── Variante (B): kpf-als-<td> — Kopf-Erkennung + colspan-Padding (G19/G20) ──
  const kopfZeilen: string[][] = [];
  const zeilen: string[][] = [];
  for (const r of tableInner.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)) {
    const zellenRoh = [...r[1].matchAll(/<td\b[^>]*>([\s\S]*?)<\/td>/gi)];
    // Kopfzeile: jede nicht-leere Zelle trägt die tab-kpf-Klasse (keine Datenzelle).
    const istKopf =
      zellenRoh.some((c) => /man-template-tab-kpf/i.test(c[1])) &&
      zellenRoh.every((c) => /man-template-tab-kpf/i.test(c[1]) || zellText(c[1]) === '');
    const zellen = zeileMitColspan(r[1], 'td');
    if (istKopf) kopfZeilen.push(zellen);
    else if (zellen.some((x) => x !== '')) zeilen.push(zellen);
  }
  // Mehrere Kopfzeilen spaltenweise zusammenführen (G19): je Spalte die nicht-
  // leeren Texte der Kopfzeilen mit ' ' verbinden — nichts geht verloren (§8).
  const breite = Math.max(0, ...kopfZeilen.map((z) => z.length));
  const kopf: string[] = [];
  for (let c = 0; c < breite; c++) {
    kopf.push(kopfZeilen.map((z) => z[c] ?? '').filter(Boolean).join(' '));
  }
  return kopf.some((x) => x !== '') ? { kopf, zeilen } : { zeilen };
}

/** Roh-Zellen einer <tr> (tag `td`|`th`) MIT colspan — Text via zellText
 *  (fussnoten-/tag-bereinigt). Keine colspan-Expansion hier; die macht der
 *  reine Normalisierer (T-A2). */
function rohZellen(rowHtml: string, tag: 'td' | 'th'): RohZelle[] {
  const out: RohZelle[] = [];
  const re = new RegExp(`<${tag}\\b([^>]*)>([\\s\\S]*?)</${tag}>`, 'gi');
  for (const c of rowHtml.matchAll(re)) {
    const span = Number(c[1].match(/\bcolspan=["']?(\d+)/i)?.[1] ?? '1') || 1;
    out.push({ text: zellText(c[2]), colspan: span });
  }
  return out;
}

/**
 * Zerlegt eine Fedlex-<table> in roh geparste Kopf-/Datenzeilen (mit colspan),
 * OHNE zu normalisieren — Eingabe für `normalisiereTabelle` (M10, T-F8).
 * Kopf-Erkennung beide Markup-Welten: (A) `<th>`-Zeile; (B) `<td>`-Zeile, deren
 * nicht-leere Zellen ALLE die `man-template-tab-kpf`-Klasse tragen. MEHRERE
 * Kopfzeilen werden gesammelt (T-A5-Merge geschieht im Normalisierer; der
 * Alt-Pfad behielt nur die letzte → G19-Caption-Verlust, z.B. AHVV Art. 21).
 */
export function parseRohTabelle(tableInner: string, anhang = false): RohTabelle {
  const kopfZeilen: RohZelle[][] = [];
  const datenZeilen: RohZelle[][] = [];
  for (const r of tableInner.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)) {
    const rowHtml = r[1];
    if (/<th\b/i.test(rowHtml)) {
      const ths = rohZellen(rowHtml, 'th');
      // M13-Annex (Gegenprüfung), NUR im Anhang-Pfad: Fedlex rendert manche DATEN-
      // Zeilen ebenfalls als <th> und unterscheidet sie NUR über die Klasse
      // (`man-template-tab-krpr`/`-utit` = Daten, `-kpf` = Kopf). Eine Tabelle, deren
      // Datenrumpf komplett aus <th class="…-krpr"> besteht (LRV Anhang 3 Grenzwerte,
      // VTS Anhang 9 Sitzmasse), wurde sonst KOMPLETT als Kopf gelesen → Datenzeilen
      // verloren (§1). Haupttext-Pfad UNVERÄNDERT (jede <th>-Zeile = Kopf, byte-gleich).
      if (anhang) {
        if (ths.every((z) => z.text === '')) continue;
        if (/man-template-tab-(?:krpr|utit)/i.test(rowHtml)) datenZeilen.push(ths);
        else kopfZeilen.push(ths);
      } else if (ths.some((z) => z.text !== '')) {
        kopfZeilen.push(ths);
      }
      continue;
    }
    const tds = rohZellen(rowHtml, 'td');
    const istKpf =
      /man-template-tab-kpf/i.test(rowHtml) &&
      [...rowHtml.matchAll(/<td\b[^>]*>([\s\S]*?)<\/td>/gi)].every(
        (m) => /man-template-tab-kpf/i.test(m[1]) || zellText(m[1]) === '',
      );
    if (istKpf) {
      if (tds.some((z) => z.text !== '')) kopfZeilen.push(tds);
    } else if (tds.some((z) => z.text !== '')) {
      datenZeilen.push(tds);
    }
  }
  return { kopfZeilen, datenZeilen };
}
