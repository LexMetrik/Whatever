// Abschnitts-Metadaten (Titel + Anker) — getrennt von der Komponente, damit die
// Komponentendatei nur Komponenten exportiert (react-refresh).

import type { Abschnittstyp, EntscheidAbschnitt, EntscheidBlock } from './typen';
import { fedlexLinkFuerArtikel, normVerweiseImText } from '../fedlex';

export const ABSCHNITT_TITEL: Record<Abschnittstyp, string> = {
  regeste: 'Regeste',
  sachverhalt: 'Sachverhalt',
  erwaegung: 'Erwägungen',
  dispositiv: 'Dispositiv',
};

/**
 * «1 Erwägung» / «2 Erwägungen» — die Zählform des Erwägungs-Abschnitts.
 *
 * EINE Quelle (§5): die Zeile des Erwägungs-Rails («… Treffer in 2 Erwägungen»)
 * und der zugängliche Name der Treffer-Landkarte sagen damit zwingend dasselbe
 * Wort. Bis zum Befund 21.9.2026 trug der Rail das Paar als Inline-Ternär und
 * der Streifen ein eigenes Vokabular («Abschnitten») — zwei Wörter für dieselbe
 * Zahl, nebeneinander auf demselben Bildschirm.
 * Die Mehrzahl kommt aus `ABSCHNITT_TITEL`, damit der Abschnittstitel und die
 * Zählform nicht auseinanderlaufen können.
 */
export function erwaegungsWort(n: number): string {
  return n === 1 ? 'Erwägung' : ABSCHNITT_TITEL.erwaegung;
}

/** Anker-Id eines Abschnitts (für die Sprung-Navigation). */
export function abschnittAnker(typ: Abschnittstyp): string {
  return `abschnitt-${typ}`;
}

// ─── Erwägungs-Gliederung + Anker (EINE Wahrheit, §5) ────────────────────────
//
// Die Anker-Ids der Erwägungen («e-2», «e-2-3-1») trägt der Reader (EntscheidBody)
// als teilbare Deep-Link-Ziele. Damit die Norm-Chip-Fundstellen-Suche (EntscheidLeser)
// EXAKT dieselben Ids trifft, lebt die Gruppier-/Anker-Regel hier einmal — beide
// Seiten konsumieren `gruppiereErwaegungen`. Reine, deterministische Helfer (§2/§3).

/** Zahl-Segmente einer Erwägungs-Marke: «E. 2.3.1» → [2,3,1]; markenlos → []. */
export function segmente(marke: string | null): number[] {
  const m = /(\d+(?:\.\d+)*)/.exec(marke ?? '');
  return m ? m[1].split('.').map(Number) : [];
}

/** Anker-Id einer Erwägungs-Marke: «E. 2.3.1» → «e-2-3-1». */
export function ankerFuer(marke: string): string {
  return marke.toLowerCase().replace(/[^0-9a-z]+/g, '-').replace(/^-+|-+$/g, '');
}

interface ErwSub {
  block: EntscheidBlock;
  /** Anker-Id des Unter-Blocks (leer bei markenlosen Erwägungen → kein Sprung-Ziel). */
  anker: string;
}
export interface ErwGruppe {
  /** Top-Ziffer (2 aus «E. 2.3.1»); 0 = markenlose Erwägung. */
  top: number;
  /** Kopf-Block der Gruppe («E. 2») oder null. */
  kopf: EntscheidBlock | null;
  /** Anker-Id des Kopfes («e-2»); leer bei markenlosen Gruppen. */
  kopfAnker: string;
  subs: ErwSub[];
}

/**
 * Gruppiert die Erwägungs-Blöcke nach Top-Ziffer und vergibt je Block seinen
 * stabilen Anker — die EINE Quelle der Erwägungs-Ankerbildung. Reihenfolge =
 * Dokument-Reihenfolge (Kopf vor seinen Unter-Erwägungen).
 */
export function gruppiereErwaegungen(bloecke: EntscheidBlock[]): ErwGruppe[] {
  const roh: { top: number; bloecke: EntscheidBlock[] }[] = [];
  for (const b of bloecke) {
    const top = segmente(b.marke)[0] ?? 0;
    const g = roh[roh.length - 1];
    if (!g || g.top !== top) roh.push({ top, bloecke: [b] });
    else g.bloecke.push(b);
  }
  // Mehrteilige Urteile starten die amtliche Nummerierung mehrfach neu (BS-Korpus:
  // 31 Entscheide, z. B. SB.2018.46 tops = 1,2,4,5,1,2,3,1,…). Derselbe `top` darf
  // aber nie zweimal denselben Anker (und der Reader nie doppelte React-Keys)
  // erzeugen — Pin-Cite-Permalinks müssen eindeutig bleiben (R7). Regel: der ERSTE
  // Lauf einer Ziffer behält den bisherigen Anker («e-3», «e-3-1» — bestehende
  // Permalinks bleiben stabil), jeder WIEDERHOLUNGS-Lauf trägt das deterministische
  // Suffix «-wN» (N = Laufnummer, z. B. «e-3-w2», «e-3-1-w2»). «w» kollidiert nie
  // mit echten Marken-Ankern (nur Ziffern bzw. römisch i/v/x).
  const laufVon = new Map<number, number>();
  return roh.map(({ top, bloecke: bl }) => {
    if (top === 0) {
      // Markenlose Erwägungen: reiner Fliesstext, KEINE Anker (kein «E. 0»).
      return { top, kopf: null, kopfAnker: '', subs: bl.map((block) => ({ block, anker: '' })) };
    }
    const lauf = (laufVon.get(top) ?? 0) + 1;
    laufVon.set(top, lauf);
    const suffix = lauf > 1 ? `-w${lauf}` : '';
    const erstesIstKopf = segmente(bl[0].marke).length === 1;
    const kopf = erstesIstKopf ? bl[0] : null;
    const subBloecke = erstesIstKopf ? bl.slice(1) : bl;
    const kopfAnker = `e-${top}${suffix}`;
    const subs = subBloecke.map((block, i) => ({
      block,
      anker: block.marke ? `${ankerFuer(block.marke)}${suffix}` : `${kopfAnker}-${i}`,
    }));
    return { top, kopf, kopfAnker, subs };
  });
}

/**
 * Ein Sprungziel der Erwägungs-Navigation (V5): Anker + amtliche Marke + Tiefe.
 * `tiefe` = Anzahl Ziffern-Segmente − 1 (E. 2 ⇒ 0, E. 2.3 ⇒ 1, E. 2.3.1 ⇒ 2) und
 * ist damit die EINRÜCKUNG, nicht eine Rangaussage.
 */
export interface ErwPunkt {
  anker: string;
  /** Amtliche Marke, wie sie im Text steht («2.3.1» bzw. «E. 2.3.1»). */
  marke: string;
  tiefe: number;
}

/**
 * Gliederung der Erwägungen als flache, dokument-geordnete Sprungliste (V5,
 * W2·10-UI-NAV). Dieselbe Anker-Wahrheit wie `ersteFundstelle`/`nennungsAnker`
 * (§5 — alles läuft über `gruppiereErwaegungen`), nur anders projiziert.
 *
 * NUR Blöcke MIT Anker werden Sprungziele: ein markenloser Block trägt keine
 * zitierfähige Erwägungs-Nummer, und ein Verzeichnis-Eintrag ohne Nummer wäre
 * eine erfundene Gliederungsstufe (§8). Der zusätzliche `marke`-Test ist reine
 * TYP-VERENGUNG und kann nach heutiger Gruppierung nicht greifen (eine Gruppe
 * mit `top > 0` enthält per Konstruktion nur Blöcke mit Ziffern-Marke) — er ist
 * bewusst als solcher bezeichnet und nicht als Regel ausgegeben (§6.7).
 * Rein und deterministisch (§2).
 */
export function erwaegungsGliederung(abschnitte: EntscheidAbschnitt[]): ErwPunkt[] {
  const erw = abschnitte.find((a) => a.typ === 'erwaegung');
  if (!erw) return [];
  const punkte: ErwPunkt[] = [];
  for (const g of gruppiereErwaegungen(erw.bloecke)) {
    if (g.kopf && g.kopfAnker && g.kopf.marke) {
      punkte.push({ anker: g.kopfAnker, marke: g.kopf.marke, tiefe: 0 });
    }
    for (const s of g.subs) {
      if (!s.anker || !s.block.marke) continue;
      punkte.push({
        anker: s.anker,
        marke: s.block.marke,
        tiefe: Math.max(0, segmente(s.block.marke).length - 1),
      });
    }
  }
  return punkte;
}

/**
 * Anker der ERSTEN Erwägung, deren Text den Ziel-Artikel zitiert (inkl. der
 * per «i.V.m.»-Kette propagierten Glieder, `normVerweiseImText`) — für den
 * Norm-Chip-Sprung im Entscheid-Kopf. Vergleich über die aufgelöste Fedlex-URL
 * (Artikel-Anker, gesetz-genau); Absatz-Feinheiten spielen keine Rolle.
 * Gibt null zurück, wenn keine Erwägung den Artikel im Text nennt (dann fällt
 * der Reader auf die Regeste zurück).
 */
export function ersteFundstelle(abschnitte: EntscheidAbschnitt[], zielArtikel: string): string | null {
  const zielUrl = fedlexLinkFuerArtikel(zielArtikel);
  if (!zielUrl) return null;
  const erw = abschnitte.find((a) => a.typ === 'erwaegung');
  if (!erw) return null;
  for (const g of gruppiereErwaegungen(erw.bloecke)) {
    // Kopf vor Unter-Blöcken = Dokument-Reihenfolge; nur Blöcke MIT Anker.
    const eintraege: { text: string; anker: string }[] = [];
    if (g.kopf && g.kopfAnker) eintraege.push({ text: g.kopf.text, anker: g.kopfAnker });
    for (const s of g.subs) if (s.anker) eintraege.push({ text: s.block.text, anker: s.anker });
    for (const e of eintraege) {
      if (normVerweiseImText(e.text).some((sp) => fedlexLinkFuerArtikel(sp.artikel) === zielUrl)) {
        return e.anker;
      }
    }
  }
  return null;
}

/**
 * Anker der ERSTEN Erwägung, deren Text den Suchtext wörtlich enthält
 * (whitespace-normalisiert) — für den in-Text-Sprung der «Zitierte Entscheide»-
 * Gruppe (V1.3, W2·7-VZUI): «BGE 144 II 486» → die Erwägung, die das Zitat
 * trägt. Dieselbe Gruppier-/Anker-Wahrheit wie ersteFundstelle (§5); reine,
 * deterministische Textsuche (§2). null = kein Vorkommen in den Erwägungen.
 */
export function ersteTextFundstelle(abschnitte: EntscheidAbschnitt[], suchtext: string): string | null {
  const norm = (s: string) => s.replace(/\s+/g, ' ');
  const ziel = norm(suchtext).trim();
  if (!ziel) return null;
  const erw = abschnitte.find((a) => a.typ === 'erwaegung');
  if (!erw) return null;
  for (const g of gruppiereErwaegungen(erw.bloecke)) {
    const eintraege: { text: string; anker: string }[] = [];
    if (g.kopf && g.kopfAnker) eintraege.push({ text: g.kopf.text, anker: g.kopfAnker });
    for (const s of g.subs) if (s.anker) eintraege.push({ text: s.block.text, anker: s.anker });
    for (const e of eintraege) {
      if (norm(e.text).includes(ziel)) return e.anker;
    }
  }
  return null;
}

/**
 * Map «zitierteNorm → Fundstellen-Anker | null» für alle genannten Normen eines
 * Entscheids. `null` = keine Erwägungs-Fundstelle (Chip springt zur Regeste).
 * Rein/deterministisch — im Reader memoisiert.
 */
export function fundstellenFuerNormen(
  abschnitte: EntscheidAbschnitt[],
  zitierteNormen: string[],
): Map<string, string | null> {
  const m = new Map<string, string | null>();
  for (const norm of zitierteNormen) {
    if (m.has(norm)) continue;
    m.set(norm, ersteFundstelle(abschnitte, norm));
  }
  return m;
}
