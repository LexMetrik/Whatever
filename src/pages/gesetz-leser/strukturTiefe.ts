// ─── Amtliche Gliederungstiefe eines Erlasses (Kennzahl, W2·5d-EID3) ─────────
//
// Liefert EINE Zahl: wie tief ist der Erlass amtlich verschachtelt? Verbraucher
// ist die Erlass-Übersicht (`ErlassUebersicht`, Prop `gliederungsTiefe`) — eine
// reine Kennzahl neben Artikelzahl und Umfang, keine Rechtslogik (§3).
//
// ── Herkunft der Datei: Linien-Rückbau V1 (16.8.2026) ────────────────────────
// Bis zum 16.8.2026 hiess das Modul `linienAufbau.ts` und war die SSoT für die
// Frage «wann zeigt der Reader den vertikalen Gliederungs-Guide?». Diese Frage
// gibt es nicht mehr: David hat die Gliederungslinie im Lesetext nach zwei
// gescheiterten Bauversuchen (A8 5.7.2026, A28 12.7.2026, PR #423 3.8.2026)
// am 13.8.2026 ganz verworfen — «ja linien ganz entfernen» (Variante V1,
// FAHRPLAN-GESETZESDARSTELLUNG-V2 §9.3 e). Der strukturelle Grund, warum kein
// Nachjustieren half: der Reader konnte HÖCHSTENS EINE Linie auf genau EINER
// Ebene zeigen — bei ZGB (Tiefe 5) oder OR (Tiefe 4) markiert ein einzelner
// Strich zwangsläufig nur einen Bruchteil der Verschachtelung. Die Übersicht,
// die der Guide nie lieferte, trägt seit dem 13.8.2026 die Seitenleiste mit
// Gliederungsbaum und Sprungnavigation (W2·19-GLIEDERUNG).
//
// Mit dem Rückbau entfallen `guideEbene`, `dichteAmGuide`, `autoGuide`, der
// Schalter «Linien» und das Aufbau-Regelwerk in `check:linien-kanon` (Teil B).
// Struktur im Fliesstext trägt allein die Typo (seit §4b-C, 29.8.2026 — der Tiefen-Einzug ist aufgehoben, Entscheid David «eine Kante wie Fedlex»); zuvor die höchsten zwei Ränge
// der Rangfolge aus DESIGN-REGLEMENT §N-4b («Typo > Einzug > Guide»),
// deren dritter Rang damit ersatzlos wegfällt. Übrig bleibt genau die Kennzahl
// unten; sie hat mit Linien nie etwas zu tun gehabt.
//
// ── EID-3(b) · Tiefe primär aus der eId-Pfadlänge (§12.2, 3.8.2026) ───────────
// Die Tiefe kam bisher allein aus der Sidecar-Rekursionstiefe, und die ist eine
// hN-ABLEITUNG: der Struktur-Extraktor macht nur `h1`–`h5`-Überschriften zu
// `gliederung`-Stufen (struktur-extrahiere.ts:259), ein amtlicher Container OHNE
// hN-Überschrift fällt heraus. Fedlex selbst nummeriert seine Container-Pfade
// kumulativ (`tit_3/lvl_u1/chap_2/lvl_I`) — die Segmentzahl ist damit die
// direktere, robustere Aussage über die amtliche Verschachtelung als unsere
// Ableitung. Seit EID-1 liegt sie je Stufe im Sidecar (`gliederung[].eId`).
//
// BELEGTER Abweichungsfall (korpusweit erhoben über 1416 Sidecars / 94 976
// Gliederungsstufen, 3.8.2026): GENAU EIN Erlass weicht ab — SVG (SR 741.01),
// 54 Stufen in 34 Artikeln, Tiefe 3 → 4. Ursache empirisch gegen die amtliche
// Quelle belegt (Fedlex-HTML-Manifestation SR 741.01, Konsolidierung 20260701,
// abgerufen 3.8.2026): `<section id="tit_3/lvl_u1">` trägt seine Überschrift
// («Grundregel») als `div.heading` mit `aria-level="2"` statt als `h2` — 85
// solcher `lvl_u*`-Container allein im SVG. Unsere hN-Ableitung sieht diese
// Ebene nicht, der kumulative eId-Pfad der Kindstufe führt sie mit.
//
// FALLBACK IST PFLICHT. 1202 der 1416 Sidecars tragen KEINE eId (13 eId-lose
// Bundeserlasse + alle 1189 Kantons-Sidecars — kantonales Recht steht nicht in
// Fedlex). Darum zählt jede Stufe MINDESTENS ihre eigene Position (`L + 1`);
// die eId kann die Tiefe nur ANHEBEN, nie senken. Das deckt zugleich den flachen
// `annex`-Wert ab (W2·5d-ANNEX, PR #425: ein Segment auf Position 0 ⇒ keine
// Wirkung).
//
// Gliederungstiefe je Erlass zur Einordnung (Stand 4.8.2026, 1416 Sidecars):
//   0: 486 · 1: 520 · 2: 284 · 3: 93 · 4: 24 · 5: 9

import type { StrukturMap } from '../../lib/normtext/browse';

/**
 * EID-3(b): Verschachtelungstiefe, die ein kumulativer Fedlex-Container-eId-Pfad
 * ausweist = Zahl seiner Segmente (`book_2/part_2/tit_7/chap_4/lvl_D` → 5).
 * Leere Segmente werden verworfen (führender/doppelter Slash zählt nicht mit),
 * ein flacher Wert ohne Slash ergibt 1 — namentlich `annex` (W2·5d-ANNEX).
 * `undefined`/leer ⇒ 0, d. h. «keine Aussage»; der Aufrufer fällt dann auf die
 * Sidecar-Position zurück. Rein deterministisch (§2), kein Zugriff nach aussen.
 */
export function eIdPfadTiefe(eId: string | undefined): number {
  if (!eId) return 0;
  let n = 0;
  for (const seg of eId.split('/')) if (seg !== '') n++;
  return n;
}

/**
 * Maximale amtliche Gliederungs-Verschachtelung eines Erlasses aus seinem
 * Struktur-Sidecar (der von `ladeStruktur` geladenen StrukturMap). 0 = flache
 * Artikelliste ohne jede Gliederungsstufe. Deterministisch, seiteneffektfrei;
 * eId-primär mit Positions-Fallback (Herleitung im Kopfkommentar).
 */
export function strukturTiefe(struktur: StrukturMap | null | undefined): number {
  if (!struktur) return 0;
  let tiefste = 0;
  for (const key in struktur) {
    const g = struktur[key].gliederung ?? [];
    for (let L = 0; L < g.length; L++) {
      const tiefe = Math.max(L + 1, eIdPfadTiefe(g[L].eId));
      if (tiefe > tiefste) tiefste = tiefe;
    }
  }
  return tiefste;
}
