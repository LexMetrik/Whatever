import type { MaterialBezug } from '../../../lib/normtext/werkzeuge';

// ─── Modell des Reiters «Erläuterungen» (S6, Befund AN-8) ───────────────────
//
// Rein, ohne JSX (§3). Ordnet die gemischte Liste (kuratiertes
// `MATERIAL_REGISTER` + Kanten-Shards, `panelKontextLaden.useErlaeuterungen`)
// zu POSTEN — ohne ein Dokument wegzulassen und ohne eines zu erfinden.
//
// ── DER BEFUND ──────────────────────────────────────────────────────────────
// Am ArG zählte der Vorgänger-Reiter «Behörden-Praxis 71»: die SECO-Wegleitung
// zum Arbeitsgesetz liegt artikelweise vor (ein Registereintrag je Artikel,
// `SECO-WL-ARG-ART-1` …), und jeder Teil wurde als eigenes Dokument gezählt.
// Ebenso standen die Anhänge eines ESTV-Kreisschreibens («Nr. 37 · Anhang 1»)
// als eigene Zeilen neben ihm. Sortiert wurde nach key — «Nr. 11» vor «Nr. 5».
//
// ── DIE REGELN (alle nur aus Feldern, die das Register führt) ──────────────
// 1. ANHANG: eine Nummer «X · Y» (gezählt 23.9.2026: nur ESTV-«KS-Anhang», 18
//    Einträge) hängt am Dokument derselben Behörde mit Nummer «X» — sofern es in
//    DERSELBEN Liste steht. Fehlt es, bleibt der Anhang eigener Posten (§8:
//    nichts verschwindet, nur weil sein Hauptdokument nicht zugeordnet ist).
// 2. REIHE: mindestens zwei Einträge derselben Behörde und Dokumentart mit
//    Nummer «Art. …» sind die Teile EINER artikelweisen Publikation und werden
//    ein Posten (aufklappbar, alle Teile bleiben einzeln verlinkt).
// 3. SORTIERUNG: Behörde → Dokumentart → Nummer NATÜRLICH (5 < 11 < 11a) →
//    Titel. Die Zahl im Kopf ist die Zahl der Posten.

export type ErlaeuterungPosten =
  | { art: 'dokument'; m: MaterialBezug; anhaenge: MaterialBezug[] }
  | { art: 'reihe'; key: string; behoerdeKuerzel: string; doktypLabel: string; teile: MaterialBezug[] };

const ANHANG_RE = /^(.+?) · .+$/;
const ARTIKEL_RE = /^Art\.\s/;

/** Natürlicher Vergleich: Ziffernfolgen als Zahlen, der Rest als Text
 *  («Nr. 5» < «Nr. 11» < «Nr. 11a»; «Art. 3» < «Art. 3a» < «Art. 10»). */
export function natuerlich(a: string, b: string): number {
  const ta = a.match(/\d+|\D+/g) ?? [];
  const tb = b.match(/\d+|\D+/g) ?? [];
  for (let i = 0; i < Math.min(ta.length, tb.length); i++) {
    const x = ta[i], y = tb[i];
    const nx = /^\d/.test(x), ny = /^\d/.test(y);
    if (nx && ny) {
      const d = Number(x) - Number(y);
      if (d !== 0) return d;
    } else if (x !== y) {
      return x < y ? -1 : 1;
    }
  }
  return ta.length - tb.length;
}

function vergleicheBezug(a: MaterialBezug, b: MaterialBezug): number {
  return a.behoerdeKuerzel.localeCompare(b.behoerdeKuerzel, 'de')
    || a.doktypLabel.localeCompare(b.doktypLabel, 'de')
    || natuerlich(a.nummer ?? '', b.nummer ?? '')
    || a.titel.localeCompare(b.titel, 'de')
    || (a.key < b.key ? -1 : a.key > b.key ? 1 : 0);
}

function kopfVon(p: ErlaeuterungPosten): MaterialBezug {
  return p.art === 'dokument' ? p.m : p.teile[0];
}

export function ordneErlaeuterungen(liste: readonly MaterialBezug[]): ErlaeuterungPosten[] {
  // Dubletten per key weg (die Mischung dedupliziert bereits; hier Absicherung).
  const eindeutig = [...new Map(liste.map((m) => [m.key, m])).values()];
  const hauptNachNummer = new Map<string, MaterialBezug>();
  for (const m of eindeutig) {
    if (m.nummer && !ANHANG_RE.test(m.nummer)) hauptNachNummer.set(`${m.behoerdeKuerzel}|${m.nummer}`, m);
  }
  const anhaengeVon = new Map<string, MaterialBezug[]>();
  const frei: MaterialBezug[] = [];
  for (const m of eindeutig) {
    const treffer = m.nummer ? ANHANG_RE.exec(m.nummer) : null;
    const haupt = treffer ? hauptNachNummer.get(`${m.behoerdeKuerzel}|${treffer[1]}`) : undefined;
    if (haupt) {
      const l = anhaengeVon.get(haupt.key) ?? [];
      l.push(m);
      anhaengeVon.set(haupt.key, l);
    } else {
      frei.push(m);
    }
  }
  const reihen = new Map<string, MaterialBezug[]>();
  for (const m of frei) {
    if (!m.nummer || !ARTIKEL_RE.test(m.nummer)) continue;
    const k = `${m.behoerdeKuerzel}|${m.doktypLabel}`;
    const l = reihen.get(k) ?? [];
    l.push(m);
    reihen.set(k, l);
  }
  const inReihe = new Set<string>();
  const posten: ErlaeuterungPosten[] = [];
  for (const [k, teile] of reihen) {
    if (teile.length < 2) continue;
    teile.sort(vergleicheBezug);
    for (const t of teile) inReihe.add(t.key);
    posten.push({ art: 'reihe', key: `reihe:${k}`, behoerdeKuerzel: teile[0].behoerdeKuerzel, doktypLabel: teile[0].doktypLabel, teile });
  }
  for (const m of frei) {
    if (inReihe.has(m.key)) continue;
    posten.push({ art: 'dokument', m, anhaenge: (anhaengeVon.get(m.key) ?? []).sort(vergleicheBezug) });
  }
  return posten.sort((a, b) => vergleicheBezug(kopfVon(a), kopfVon(b)));
}
