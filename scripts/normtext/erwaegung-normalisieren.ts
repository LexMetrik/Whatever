// ─── Deterministische Erwägungs-Normalisierung (rein, browserlos, §2/§3) ──────
//
// EINE reine Funktion, die einen Erwägungs-Abschnitt zu konsistenten
// {marke, tiefe?, text}-Blöcken vereinheitlicht — gleicher Pfad für Live-Import,
// Cache-Replay und Bestands-Renormalisierung (Single Source, §5).
//
// Zwei-Track-Design (vom Code-Befund diktiert, §7/§1):
//  1. paras (OCL e_number) vorhanden  → marke aus e_number, wenn `markenPlausibel`;
//     sonst alle marke=null (ehrlich flach, §8). Das ist der grosse Hebel: der
//     reparierte `markenPlausibel` akzeptiert publizierte Sammlungs-Auszüge, die
//     legitim bei consid. N≥3 starten und echte Innenlücken haben (4→7).
//  2. paras leer, EIN Block (Monolith) → `spalteMonolith` versuchen — NUR wenn
//     ≥2 echte FÜHRENDE Gliederungsnummern existieren. Sonst null (flach lassen).
//     Niemals Gliederung aus Zitaten fabrizieren (§1).
//
// WORT-ERHALTEND: die Funktion fügt nur Marken hinzu und schneidet/spaltet Text,
// erfindet aber NIE Worte und stellt NIE um. Die Wort-Invariante ist getestet.

import type { EntscheidBlock } from '../../src/lib/rechtsprechung/typen';
import type { OclParagraph } from './adapter-typen';
import { bereinigeFliesstext } from '../../src/lib/rechtsprechung/register';

/** Monatsname am Absatz-Anfang ⇒ Jahreszahl-Datum als Marke fehlgeparst. */
export const MONAT =
  /^(Januar|Februar|März|April|Mai|Juni|Juli|August|September|Oktober|November|Dezember)\b/;

/** Kein Erwägungs-Top liegt realistisch über dieser Schwelle — darüber ist die
 *  Zahl sicher fehlgeparst (Rand-/Fussnotennummer, Jahreszahl). Bug-Check #4:
 *  ersetzt die alte 1900-Grenze, die «E. 400» noch durchgelassen hätte. */
const SECTION_MAX = 60;

/** Top-Segment-Folge einer e_number-Liste. Leere/fehlende e_number werden
 *  ÜBERSPRUNGEN (Bug-Check #1: `Number('') === 0` hätte sonst eine Phantom-Top-0
 *  eingeschleust und eine voll nummerierte Erwägung fälschlich verworfen). */
function tops(nums: (string | undefined)[]): number[] {
  return nums
    .filter((e) => String(e ?? '').trim() !== '')
    .map((e) => Number(String(e).split('.')[0]))
    .filter((n) => Number.isFinite(n));
}

/**
 * Plausibilität der OCL-Erwägungs-Nummerierung — REPARIERT (§1):
 * akzeptiert publizierte Sammlungs-Auszüge, die legitim bei consid. N≥3 starten
 * und echte Innenlücken haben (amtliche BGE drucken nur die relevante Teilmenge).
 * Verwirft NUR fehlgeparste Marken:
 *  · Top-Marke ≥ Jahr-Schwelle (Datum/Jahr als Marke fehlgeparst),
 *  · NICHT-monoton aufsteigende Top-Folge (Parse/Reihenfolge kaputt),
 *  · Block-Start mit Monatsname (Jahreszahl-Datum als Marke).
 * Die alte Start-bei-1/2-Annahme (`tops[0] > 2`) und der pauschale Sprung≥3-Guard
 * entfallen — beide entwerteten genuine amtliche Nummerierung (168 flache BGE).
 */
export function markenPlausibel(paras: OclParagraph[]): boolean {
  const t = tops(paras.map((p) => p.e_number));
  if (!t.length) return false;
  if (t.some((n) => n > SECTION_MAX)) return false;   // fehlgeparste Rand-/Fussnoten-/Jahreszahl
  for (let i = 1; i < t.length; i++) if (t[i] < t[i - 1]) return false;
  if (paras.some((p) => MONAT.test(String(p.text ?? p.text_excerpt ?? '').trim()))) return false;
  return true;
}

/**
 * Robuste Regex für eine FÜHRENDE Gliederungsnummer am Absatz-Anfang.
 * Schutz gegen Datum/Betrag/Jahr/Liste: keine weitere Ziffer direkt danach
 * (Betrag „1 000"), kein Monat danach (Datum), kein 4-stelliges Jahr,
 * Folge-Zeichen muss Grossbuchstabe/Anführung/Klammer sein. 0 Fehltreffer auf
 * dem Korpus (empirisch verifiziert).
 */
const RE_FUEHREND =
  /^\s*(\d{1,2}(?:\.\d{1,2}){0,3})\.?\s+(?!\d)(?!(?:Januar|Februar|März|April|Mai|Juni|Juli|August|September|Oktober|November|Dezember)\b)(?=[A-ZÄÖÜ«"(])/;

/**
 * Eine führende Gliederungsnummer am Absatz-Anfang erkennen. Liefert
 * {nummer, rest} oder null. Wort-erhaltend: `rest` ist exakt der Resttext.
 */
export function fuehrendeGliederungsnummer(p: string): { nummer: string; rest: string } | null {
  const m = RE_FUEHREND.exec(p);
  if (!m) return null;
  return { nummer: m[1], rest: p.slice(m[0].length) };
}

/**
 * Monolith-Split: EIN markenloser Erwägungs-Block → mehrere, NUR wenn ≥2 echte
 * führende Gliederungsnummern existieren, deren Top-Folge streng aufsteigend &
 * lückenarm ist (Start ≤ 2, kein Top-Sprung ≥ 3 — Schutz gegen Zitat-Treffer).
 * Sonst null (ehrlich flach lassen, §8). WORT-ERHALTEND: reines Slicing an den
 * Absatzgrenzen, kein Wort wird verändert oder umgestellt.
 */
export function spalteMonolith(text: string): EntscheidBlock[] | null {
  const paras = String(text).split(/\n{2,}/).map((p) => p.replace(/^[ \t]+/, '')).filter((p) => p.trim());
  // Treffer-Indizes: Absätze mit echter führender Gliederungsnummer.
  const treffer: { i: number; nummer: string; top: number }[] = [];
  for (let i = 0; i < paras.length; i++) {
    const g = fuehrendeGliederungsnummer(paras[i]);
    if (g) treffer.push({ i, nummer: g.nummer, top: Number(g.nummer.split('.')[0]) });
  }
  if (treffer.length < 2) return null;
  // Nur die Top-Köpfe (eine Segment-Tiefe) als Schnittpunkte werten; Folge plausibel?
  const koepfe = treffer.filter((t) => !t.nummer.includes('.'));
  // Bug-Check #2 (§1, Fabrikations-Schutz): ein Monolith ist der VOLLE Erwägungstext,
  // echte Erwägungen laufen daher 1,2,3,… lückenlos ab 1. Verlangt:
  //  · ≥ 3 Köpfe (2 Treffer sind zu schwach — «1. Auflage … 2. Kammer …» wäre Prosa),
  //  · Start bei genau 1,
  //  · streng konsekutiv (+1 je Schritt) — sonst KEIN Split (lieber flach, §8).
  if (koepfe.length < 3) return null;
  const ttops = koepfe.map((k) => k.top);
  if (ttops[0] !== 1) return null;
  for (let i = 1; i < ttops.length; i++) {
    if (ttops[i] !== ttops[i - 1] + 1) return null;
  }
  // An den Kopf-Absätzen schneiden. Text VOR dem ersten Kopf bleibt markenlos voran.
  const grenzen = koepfe.map((k) => k.i);
  const bloecke: EntscheidBlock[] = [];
  if (grenzen[0] > 0) {
    const vorab = paras.slice(0, grenzen[0]).join('\n\n');
    if (vorab.trim()) bloecke.push({ marke: null, text: bereinigeFliesstext(vorab) });
  }
  for (let g = 0; g < grenzen.length; g++) {
    const von = grenzen[g];
    const bis = g + 1 < grenzen.length ? grenzen[g + 1] : paras.length;
    const stueck = paras.slice(von, bis).join('\n\n');
    const txt = bereinigeFliesstext(stueck);
    if (txt) bloecke.push({ marke: `E. ${koepfe[g].nummer}`, tiefe: 1, text: txt });
  }
  return bloecke.length >= 2 ? bloecke : null;
}

// ── U-13: Kommentar-Zitat-Fragmente und verschluckte Haupt-Überschriften reparieren ──────────
//
// OCL gliedert den Volltext nach Zahlen am Absatzanfang. Zwei Fehlgriffe (BGE 152 III 205 = Urteil
// 4A_129/2024, Messung 11.10.2026 gegen mcp.opencaselaw.ch/api/structure/bger_4A_129_2024):
//  (a) Zitat «…, 2e éd. 2019, n° 5 ad art. 34 CL; …, n° 10 ad art. 45 …» — OCL setzt die Zahl nach «n o»
//      als Erwägungs-Nummer: Phantom-Blöcke «E. 5» (Text «ad art. 34 CL; …») und «E. 10» («ad art. 45 …»),
//      die Zahl selbst steht nur noch in e_number;
//  (b) die echten Haupt-Überschriften «5.» und «6.» bleiben als eigener Absatz «5.» / «6.» im Text der
//      vorangehenden Erwägung stehen (E. 4.7 bzw. E. 5.4).
// Beide Reparaturen sind fail-closed (§1/§8): (a) nur, wenn ein früherer Block auf «n o» endet UND das
// Fragment klein beginnt; (b) nur, wenn die Zahl genau der nächste Haupt-Rang ist, kein Block mit dieser
// Marke existiert und ein grossgeschriebener Absatz folgt. Wort-erhaltend: (a) fügt die verlorene
// Zahl wieder ein, (b) verschiebt die Zahl vom Text in die Marke.

const KLEIN_START = /^[a-zäöüéèàç]/;
const ENDET_AUF_NR = /\bn\s*(?:\n+\s*)?(?:os?|°)\s*$/;
const LONE_HAUPT = /^(\d{1,2})\.$/;
const GROSS_START = /^[A-ZÄÖÜÉÈÀ«"(]/;

const topVon = (marke: string | null): number | null => {
  const m = /^E\.\s*(\d+)/.exec(marke ?? '');
  return m ? Number(m[1]) : null;
};

export function repariereErwaegungsBloecke(eingang: readonly EntscheidBlock[]): EntscheidBlock[] {
  // (a) Zitat-Fragmente an den Block zurückführen, dessen Text auf «n o» abbricht. OCL hängt das Fragment
  // nach seiner (falschen) e_number ein, es steht darum NICHT neben seinem Ursprung (BGE 152 III 205:
  // der Ursprung ist E. 4.3, das Fragment «E. 5» steht hinter E. 4.7, «E. 10» ganz am Ende) — gesucht wird
  // rückwärts der nächste offene Block. Ohne offenen Block bleibt das Fragment, wie es ist.
  const a: EntscheidBlock[] = [];
  for (const b of eingang) {
    const nr = /^E\.\s*(\d+)$/.exec(b.marke ?? '')?.[1];
    if (nr && KLEIN_START.test(b.text)) {
      let k = a.length - 1;
      while (k >= 0 && !ENDET_AUF_NR.test(a[k].text)) k--;
      if (k >= 0) {
        a[k] = { ...a[k], text: `${a[k].text} ${nr} ${b.text}` };
        continue;
      }
    }
    a.push(b);
  }
  // (b) Verschluckte Haupt-Überschriften «N.» abspalten.
  const vorhanden = new Set(a.map((b) => b.marke).filter(Boolean));
  const out: EntscheidBlock[] = [];
  for (const b of a) {
    let cur = b;
    for (let guard = 0; guard < 50; guard++) {
      const top = topVon(cur.marke);
      if (top === null) break;
      const paras = cur.text.split(/\n{2,}/);
      const i = paras.findIndex((p, k) => {
        const m = LONE_HAUPT.exec(p.trim());
        return k >= 1 && !!m && Number(m[1]) === top + 1 && !vorhanden.has(`E. ${m[1]}`)
          && k + 1 < paras.length && GROSS_START.test(paras[k + 1].trim());
      });
      if (i < 0) break;
      const nr = LONE_HAUPT.exec(paras[i].trim())![1];
      out.push({ ...cur, text: paras.slice(0, i).join('\n\n') });
      cur = { marke: `E. ${nr}`, tiefe: 1, text: paras.slice(i + 1).join('\n\n') };
      vorhanden.add(cur.marke!);
    }
    out.push(cur);
  }
  return out;
}

/**
 * EINZIGE Eintrittsfunktion. Vereinheitlicht einen Erwägungs-Abschnitt zu
 * konsistenten {marke, tiefe?, text}-Blöcken. Pure, deterministisch (§2).
 *
 * Quelle-Priorität (typ-neutral — kennt weder leitcharakter noch Regeste):
 *   1. paras vorhanden  → marke aus e_number (wenn markenPlausibel), tiefe aus
 *      depth bzw. Segmentzahl; sonst alle marke=null (ehrlich flach).
 *   2. paras leer, EIN markenloser Block → spalteMonolith versuchen.
 *   3. sonst → unverändert (vorhandeneBloecke).
 *
 * `vorhandeneBloecke` ist die bereits bereinigte Block-Liste (text fertig); bei
 * vorhandenen `paras` werden die Texte aus `paras` genommen (Live-/Replay-Pfad).
 */
export function normalisiereErwaegung(
  paras: OclParagraph[],
  vorhandeneBloecke: EntscheidBlock[],
): EntscheidBlock[] {
  if (paras.length) {
    const plaus = markenPlausibel(paras);
    const bloecke = paras
      .map((p): EntscheidBlock => {
        const text = bereinigeFliesstext(String(p.text ?? p.text_excerpt ?? ''));
        if (!plaus || !p.e_number) return { marke: null, text };
        // Bug-Check #5: tiefe aus der Segmentzahl der ANGEZEIGTEN Nummer ableiten
        // (nie aus p.depth, das mit der Marke widersprechen und die Einrückung
        // verfälschen könnte). Segmentzahl ist immer ≥ 1 und deckt sich mit «E. x.y».
        const tiefe = String(p.e_number).split('.').length;
        return { marke: `E. ${p.e_number}`, tiefe, text };
      })
      .filter((b) => b.text);
    return repariereErwaegungsBloecke(bloecke);   // U-13
  }
  // Kein paras (Bestand ohne Cache): nur Monolith-Veredelung, sonst unverändert.
  if (vorhandeneBloecke.length === 1 && !vorhandeneBloecke[0].marke) {
    const gespalten = spalteMonolith(vorhandeneBloecke[0].text);
    if (gespalten) return gespalten;
  }
  return vorhandeneBloecke;
}
