// QS-TOK/P5 (T14 Stufe 1): reine Berechnungs-/Helfer-Logik des Gesetz-Lesers,
// aus dem inhalt.tsx-Monolithen in eine Geschwister-Datei ausgelagert (§6 Ziff. 6,
// verhaltensneutral). Ausgelagert wird NUR Zustands-freie Rechenlogik — alle React-
// Hooks, Effekte und das Rendering bleiben in inhalt.tsx. Die useMemo-Rümpfe rufen
// diese Funktionen mit denselben Deps auf (byte-gleiche Ableitung, golden + e2e).
import type { RefObject } from 'react';
import type { Sektion, StrukturMap } from '../../lib/normtext/browse';
import type { NormSnapshot } from '../../lib/normtext/typen';

// ─── Pane-Scoping-Helfer (B-2.5) — MODUL-Ebene = referenzstabil ────────────
// Bewusst KEIN React Compiler im Projekt → in-Komponente definierte Funktionen
// hätten je Render neue Identität und würden Effekte (IntersectionObserver,
// Hash-Sprung) bei jedem Render neu auslösen (Re-Render-/Scroll-Schleife). Als
// Modulfunktionen sind sie stabil und nicht Teil der Effect-Deps (nur die
// Primitiven `imPane` + die Ref `wurzel` zählen).
export function paneRoot(imPane: boolean, wurzel: RefObject<HTMLElement | null> | null): HTMLElement | null {
  return imPane ? wurzel?.current ?? null : null;
}
// W2·5d G3b (③/⑤): Anhang- (`annex_*`) bzw. Staatsvertrags-Protokoll-Token
// (`lvl_*`, LugÜ) sowie Erklärungs-/Geltungsbereichs-Token (`decl_*`/`scope_*`,
// PR #195: Schweizer Erklärungen zu Staatsverträgen) — steuert die abgesetzte
// Anhang-Block-Darstellung (ArtikelLeser istAnhang) und das Unterdrücken des
// «Bereich»-Badges reiner Anhang-Sektionen. Modul-Ebene (referenzstabil, §15/4).
// Namespaces aus M13 (annex-Extraktion) + Anhang-Scanner (scope_|decl_).
export function istAnhangToken(token: string): boolean {
  return /^(annex|lvl|decl|scope)_/i.test(token);
}
export function findeArt(root: HTMLElement | null, token: string): HTMLElement | null {
  if (!root) return document.getElementById(`art-${token}`);
  // CSS.escape: ein präparierter #hash-Token (z. B. mit «"]») darf den Selektor
  // nicht sprengen. getElementById (document-Pfad) ist ohnehin selektor-frei.
  const id = `art-${token}`;
  return root.querySelector(`#${typeof CSS !== 'undefined' && CSS.escape ? CSS.escape(id) : id}`);
}

// Dokument-Position (Index des ersten enthaltenen Artikels) je Sektion — EINMAL
// bottom-up berechnet, damit renderSektion die Kinder + direkten Artikel eines
// Knotens in Dokument-Reihenfolge mischen kann, ohne pro Scroll-Render erneut den
// Teilbaum zu durchlaufen (6b: Knoten tragen seit der Randtitel-Promotion oft
// beides). Reine Darstellung (§3).
export function berechneSekPos(sektionen: Sektion[], eintraege: NormSnapshot[] | null): Map<string, number> {
  const pos = new Map<string, number>();
  const artPos = new Map<string, number>();
  (eintraege ?? []).forEach((e, i) => artPos.set(e.artikel, i));
  const walk = (s: Sektion): number => {
    let min = Infinity;
    for (const a of s.artikel) min = Math.min(min, artPos.get(a.artikel) ?? Infinity);
    for (const k of s.kinder) min = Math.min(min, walk(k));
    pos.set(s.id, min);
    return min;
  };
  for (const s of sektionen) walk(s);
  return pos;
}

// Rank 4 (QS-PERF, §6.4): Sektions-Bereichslabel («Art. 1–10») + Artikelzahl
// EINMAL bottom-up vorberechnen — statt 2× O(Subtree) je Sektion je Scroll-Render
// (bisher rief renderSektion sekBereich(s) UND sammleArtikel(s).length je Knoten,
// jeweils den Teilbaum sammelnd). Deps [sektionen, artIndex] → nur bei echtem
// Gliederungs-/Index-Wechsel neu. Die Label-Logik ist byte-identisch zur früheren
// sekBereich/sammleArtikel (golden/struktur-konsistenz grün). Reine Darstellung (§3).
export function berechneSektionMeta(
  sektionen: Sektion[],
  artIndex: Map<string, number>,
): Map<string, { bereich: string | undefined; einzel: boolean; anhang: boolean }> {
  const meta = new Map<string, { bereich: string | undefined; einzel: boolean; anhang: boolean }>();
  const sammle = (s: Sektion): NormSnapshot[] => {
    const arts = [...s.artikel, ...s.kinder.flatMap(sammle)];
    // W2·5d G3b (③/⑤): reine Anhang-/Protokoll-Sektion (alle Einträge sind
    // `annex_*`/`lvl_*`). Für sie ist ein «Bereich»-Badge sinnlos (die Labels
    // sind Anhang-/Protokoll-Titel, keine Artikel-Spanne) → unterdrückt; die
    // Einträge rendern als abgesetzte Anhang-Blöcke (istAnhang).
    const anhang = arts.length > 0 && arts.every((a) => istAnhangToken(a.artikel));
    let bereich: string | undefined;
    if (arts.length > 0 && !anhang) {
      let erst = arts[0], letzt = arts[0];
      for (const a of arts) {
        const idx = artIndex.get(a.artikel) ?? 0;
        if (idx < (artIndex.get(erst.artikel) ?? 0)) erst = a;
        if (idx > (artIndex.get(letzt.artikel) ?? 0)) letzt = a;
      }
      bereich = erst === letzt
        ? erst.artikelLabel
        : `${erst.artikelLabel}–${letzt.artikelLabel.replace(/^(Art\.|§)\s*/, '')}`;
    }
    meta.set(s.id, { bereich, einzel: arts.length === 1, anhang });
    return arts;
  };
  sektionen.forEach(sammle);
  return meta;
}

// ─── E4/A36 (David 16.7.2026): TOC-Kuration — Anhangs-Wortlaute aus der Gliederung ───
//
// Der ZGB-Schlusstitel-Anhang «Wortlaut der früheren Bestimmungen des sechsten
// Titels» (M13-disp-Division, Token `disp_u2_art_*`) bläht den TOC-Baum mit dem
// AUFGEHOBENEN Alt-Güterrecht auf, obwohl er nur historisches Übergangsrecht
// dokumentiert. Er wird NUR aus der GLIEDERUNG (SektionBaumTOC) genommen —
// render-seitiger Filter in der Darstellungsschicht (§3), Sidecar/Generator
// unberührt. §15-Treue: die Lesespalte rendert weiterhin den UNGEFILTERTEN Baum
// (renderSektion in inhalt.tsx) — Inhalt, `#art-disp_*`-Anker, Ctrl+F und Print
// bleiben vollständig; reine TOC-Kuration, kein Substanz-Drop.
//
// Kriterium: Identitäts-Treffer auf das EXAKTE Top-Level-Label (§7, keine
// Substring-/Heuristik-Erkennung) — deterministisch, eng, kommentiert. Weitere
// Kurations-Kandidaten kommen nur nach ausdrücklichem Auftrag in diese Liste.
const TOC_KURATIERTE_LABELS = new Set([
  'Wortlaut der früheren Bestimmungen des sechsten Titels', // ZGB (A36)
]);
export function kuratiereTocSektionen(sektionen: Sektion[]): Sektion[] {
  const toc = sektionen.filter((s) => !TOC_KURATIERTE_LABELS.has(s.label));
  // Ohne Treffer DIESELBE Referenz zurück (memo-/React.memo-stabil, §15/4).
  return toc.length === sektionen.length ? sektionen : toc;
}

// ─── W2·5d U-POSITION (A2): per-Artikel-Höhenschätzung ──────────────────────
//
// Wurzel des Scrollbalken-Bugs (David 5.7.2026): die Artikel-Knoten tragen
// `content-visibility:auto` mit EINEM flachen `contain-intrinsic-size: auto 320px`
// (index.css) — ein 40-Absatz-Artikel (z. B. OR Art. 336c-Kontext) und ein
// Einzeiler reservieren beide 320px Platzhalter-Höhe. Die Summe der Platzhalter
// (= die Dokumenthöhe VOR dem Rendern) weicht dadurch stark von der echten Höhe
// ab → der Scrollbalken ist nicht proportional («Daumen ganz nach unten = nur
// Gesetzes-Mitte», und die Höhe wächst beim Durchscrollen nach).
//
// Fix (§15-treu, KEIN Logikverlust): jeder Artikel bekommt eine DETERMINISTISCH
// aus seinem Snapshot geschätzte Platzhalter-Höhe (inline `contain-intrinsic-size`,
// überschreibt den 320px-Default der `.nt-art-cv`-Klasse). `content-visibility:auto`
// BLEIBT — Off-Screen-Artikel überspringen weiterhin Layout/Paint, jeder Knoten
// bleibt im DOM (Ctrl+F/Anker/Screenreader/Druck unberührt). Nur der Platzhalter-
// Schätzwert wird von einer Konstante auf eine inhalts-proportionale Zahl gehoben →
// die Summe (Dokumenthöhe) trifft die Realität deutlich besser, der Scrollbalken
// wird proportional. Sobald ein Artikel EINMAL gerendert wurde, merkt sich der
// Browser über das `auto`-Schlüsselwort ohnehin die ECHTE Höhe (kein Springen).
//
// Reine Darstellung (§3) + rein deterministisch (§2): Funktion nur des Snapshots,
// keine DOM-/Zeitzugriffe → unit-testbar. Golden/Prerender unberührt (der
// String-Builder `erlassVolltextHtml` emittiert kein `nt-art-cv` — die
// content-visibility-Optimierung existiert nur im Client-Reader).
//
// Kalibrierung: Lesespalte `max-w-normtext` (≈ 42rem ≈ 672px, E6/A37), Serif-Body
// ~18px × 1.65 ≈ 30px/Zeile, ~71 Zeichen je Lesezeile. Der Zeilen-Teiler unten (68)
// bleibt bewusst knapper als die reale ~71-ch-Zeile → die Schätzung fällt eher etwas
// zu HOCH aus (mehr angenommene Zeilen) = die gewünschte konservative Richtung
// («echte Höhe ≤ Schätzung»). Die Konstanten müssen nicht
// pixelgenau sein — für einen proportionalen Balken zählt das VERHÄLTNIS der
// Artikel zueinander. Bewusst leicht grosszügig (echte Höhe ≤ Schätzung), damit
// die Höhe beim Rendern eher schrumpft (Daumen kriecht hoch) als „wegläuft".
export const A2_HOEHE_FALLBACK = 320; // = index.css-Default; Schätzung ohne Blöcke
function textZeilen(text: string | undefined, proZeile = 68): number {
  return Math.max(1, Math.ceil((text?.length ?? 0) / proZeile));
}
/** `randtitelZeile`: steht die Sachüberschrift als EIGENE Zeile über «Art. N»?
 *  Seit S6 W1g (24.9.2026) nur noch in der Zeilenform; in der Breitform steht
 *  sie IN der Artikelnummer-Zeile (`parts/ArtikelLeser`) und kostet keine
 *  eigene Höhe — die +30 wären dort eine Überschätzung je Artikel. */
export function schaetzeArtikelHoehe(e: NormSnapshot, randtitelZeile = true): number {
  const ZEILE = 30;        // px je Fliesstext-Zeile
  // G-HIST-UI (§15.2, 20.7.2026): der reservierte Fassungs-Slot am Artikel-Fuss
  // (`mt-4 min-h-beiwerk` in ArtikelLeser, bis S2 `min-h-hist-zeile`) ist
  // 16 + 24 px hoch — er gehört darum in die Platzhalter-Höhe der off-screen-
  // Artikel (`contain-intrinsic-size`), sonst schiebt das Aufblenden beim
  // Hereinscrollen.
  //
  // KORREKTUR S1-NACHZUG (17.8.2026, Bug-Check B4): «bei JEDEM Artikel» stimmt
  // seit S1 nicht mehr unbedingt. Steht der Schalter «Änderungsvermerke» auf
  // `aus`, blendet `html[data-histansicht="aus"] .lc-leser [data-hist-slot]`
  // (index.css) den SLOT aus — dann sind diese 40 px nicht da, und die Schätzung
  // überreserviert um 40 px je off-screen-Artikel.
  // NACHTRAG D35-F3 (7.9.2026, §0 Ziff. 2b — ergänzt, nicht nachgeführt): der
  // Schalter heisst jetzt eine Stellung, die Weiche `html[data-vermerke]`. Der
  // Sachverhalt ist unverändert; die Stellungen «fussnoten» und «aus» nehmen
  // den Slot, «fassung» zeigt ihn.
  //
  // KORREKTUR S2 · Ä26 (17.8.2026): «bei JEDEM Artikel» stimmt jetzt auch OHNE
  // Schalter nicht mehr. Der Slot trägt seine Mindesthöhe nur noch, wenn der
  // Artikel Fussnoten führt — nur dort kann der Generator je einen Historie-
  // Eintrag erzeugen (Herleitung und Korpus-Messung stehen am Slot selbst,
  // `ArtikelLeser.tsx`). Korpusweit betrifft die Reservierung damit 17 547 von
  // 53 849 Artikeln; bei den übrigen überreserviert die Schätzung um 40 px.
  //
  // Auch das bleibt bewusst ungerechnet, aus DEMSELBEN Grund wie unten: die
  // Fussnoten stehen im Struktur-Sidecar, diese Funktion bekommt nur den
  // Snapshot-Eintrag `e`. Sie hier einzuspeisen hiesse, eine reine Funktion (§2)
  // an einen zweiten, asynchron eintreffenden Datenweg zu binden.
  //
  // Bewusst NICHT nachgerechnet: die Richtung ist die tolerierte. Die Zusage der
  // Schätzung lautet «echte Höhe ≤ Schätzung» (s. Kalibrierung oben) — zu HOCH
  // ist der gewünschte Fehler, der Platzhalter schrumpft beim Rendern statt zu
  // wachsen, und die Ankertreue bleibt grün. Den Wert vom Options-Zustand
  // abhängig zu machen hiesse, eine reine Funktion (§2/§3) an einen
  // Darstellungs-Store zu binden und die `contain-intrinsic-size` jedes Artikels
  // beim Umschalten neu zu schreiben — genau der Re-Render des Normtexts, den die
  // CSS-Mechanik vermeidet (§15). Nur der Kommentar zieht nach.
  //
  // NACHTRAG W2·24-D40 (7.9.2026, §0 Ziff. 2b — ERGÄNZT, nicht nachgeführt):
  // den Fassungs-Slot gibt es nicht mehr; die Auskunft steht als Rubrik in der
  // Funktionszeile am Artikelende (David: «und wieso ist fassung nicht auch
  // unten am artikel?»). Die 40 px BLEIBEN stehen und heissen jetzt: Platz für
  // die Funktionszeile, die unter jedem Artikel steht. Das ist keine Kosmetik,
  // sondern dieselbe Rechnung wie oben — die Zusage lautet «echte Höhe ≤
  // Schätzung», und zu HOCH ist die tolerierte Richtung. Der Name der Konstante
  // bleibt ebenfalls: er ist der Anker der Messreihen von 2026.
  const HIST_SLOT = 40;
  let h = 104 + HIST_SLOT; // Artikelkopf: «Art. N» + Trenner (border-t + pt-7 mt-7) + Basisabstand + Beiwerk-Zuschlag
  if (e.titel && randtitelZeile) h += 30;    // amtlicher Randtitel/Sachüberschrift (eine Zeile)
  for (const b of e.bloecke) {
    // M13-Annex-Zwischenüberschrift (titel = Heading-Tiefe): kompakte Titelzeile.
    if (b.titel) { h += 40; continue; }
    h += textZeilen(b.text) * ZEILE + 10;       // Absatz + Abstand (space-y-5 ≈ 10px)
    for (const it of b.items ?? []) h += textZeilen(it.text, 62) * (ZEILE - 2) + 4; // lit./Ziff.
    if (b.tabelle) h += b.tabelle.length * 28 + 14;                                  // Füllpunkt-Tarif
    if (b.mehrspaltig) h += (b.mehrspaltig.zeilen.length + 1) * 30 + 14;             // Mehrspalten-Tabelle inkl. Kopf
  }
  return Math.max(120, Math.round(h));
}

// ─── Fussnoten-Reihung ────────────────────────────────────────────────────────
//
// S1 (Optionen-Rückbau, David F1 «ja», 17.8.2026): die frühere `baueChronologie`
// — Reihung derselben Änderungsvermerke als zeitlich geordnete Zweitdarstellung —
// ist ERSATZLOS ENTFALLEN, samt `ChronoFussnote`/`ChronoEintrag` und der eigenen
// Testdatei. Mit dem dritten Historie-Modus fällt ihr einziger Aufrufer weg
// (§17-Rückbau: was nichts mehr bedient, wird gestrichen, nicht bewacht).
//
// `fnNrSortKey` BLEIBT: er ordnet den regulären Fussnoten-Apparat in
// `ArtikelLeser` (numerisch, dann Buchstaben-Suffix «95a») und ist dort weiter im
// Einsatz. Als reine Funktion ist er direkt prüfbar
// (src/tests/fn-nr-sortierung.test.ts).

// ─── Trägt dieser Erlass überhaupt Änderungsvermerke? (S1-Nachzug B3) ─────────
//
// BEFUND (Bug-Check 17.8.2026): «Änderungsvermerke: aus» wirkte auf
// Kantonserlassen und Staatsverträgen NUR als Layout-Raffung (−40 px je Artikel),
// weil dort gar keine Vermerke existieren — `[data-historie-zeile]` = 0 auf
// ZH-211.11, BS-640.100 und LugÜ. Die faktischen Änderungs-Fussnoten ohne
// Klasse blieben sichtbar (H0-Auflage 1, gewollt: eine fehlende Klasse blendet
// nie etwas aus). Der Schalter versprach damit mehr, als er hielt (§8).
//
// FIX: der Schalter wird nur angeboten, wenn der Erlass Vermerke TRÄGT — und das
// entscheidet das DATENMODELL, nicht die Herkunft. Kein `if (kanton)`: die
// Eigenschaft ist «hat klassifizierte Historie», nicht «ist kantonal». Es gibt
// Bundes-Staatsverträge ohne Vermerke und (s. u.) Staatsverträge mit Fassungs-
// zeile, aber ohne klassifizierte Fussnote; eine Herkunfts-Weiche träfe beide falsch.
//
// ── Ä68-NACHZUG (Entscheid David 17.8.2026): DIE REGEL BLEIBT, IHR GRUND ÄNDERT
// SICH ────────────────────────────────────────────────────────────────────────
// Bis zur Entkopplung blendete der Schalter ZWEI Dinge aus, und darum fragte er
// nach zwei Trägern:
//   1. `[data-fn-klasse="A"]` + der dadurch leere `[data-fn-apparat]`
//      → Quelle: `kl: 'A'` im Struktur-Sidecar (`zaehleAenderungsvermerke`).
//   2. `[data-hist-slot]`, die «Fassung»-Zeile am Artikelfuss
//      → Quelle: der Historie-Shard (`historie/<KEY>.json`).
// SEIT Ä68 (index.css) blendet er NUR noch Nr. 2 aus. Streng genommen wäre die
// Frage damit allein `hatFassungsZeile`; Nr. 1 ist keine Wirkung des Schalters
// mehr, sondern die des Fussnoten-Schalters.
//
// GEMESSEN, statt geschlossen (17.8.2026, alle 1420 Struktur-Sidecars gegen alle
// 209 Historie-Shards, davon 205 mit Einträgen):
//   `kl:'A'` > 0 UND Fassungszeile   203  → Schalter wirksam, Regel unverändert richtig
//   `kl:'A'` > 0 OHNE Fassungszeile    0  → **kein einziger** Erlass
//   `kl:'A'` = 0 MIT Fassungszeile     2  (MONTREAL, PVUE) → nur Nr. 2 trägt
// Die `kl:'A'`-Bedingung kann nach der Entkopplung also nur noch ÜBERANBIETEN,
// und sie tut es heute an null Erlassen: {203} ∪ {2} ist genau die Menge der 205
// Shards mit Einträgen. Sie bleibt darum stehen (§1: lieber die Prüfung
// verdoppeln, als ein wirksames Steuerelement stillschweigend wegzunehmen) — aber
// als Redundanz mit gemessener Deckung, nicht mehr als eigene Wirkung.
// NÄHME der Korpus je einen Erlass mit `kl:'A'` ohne Historie-Einträge auf, bekäme
// er einen wirkungslosen Schalter (§8). Das ist die eine Stelle, an der diese
// Redundanz schaden kann — Wächter samt Messung:
// `src/tests/aenderungsvermerke-schalter.test.ts`.
export function zaehleAenderungsvermerke(struktur: StrukturMap | null | undefined): number | null {
  // null = Sidecar noch nicht geladen. Bewusst UNTERSCHIEDEN von 0: «weiss ich
  // noch nicht» darf nicht wie «gibt es nicht» wirken (§8).
  if (!struktur) return null;
  let n = 0;
  for (const v of Object.values(struktur)) {
    for (const fn of v?.fussnoten ?? []) if (fn.kl === 'A') n += 1;
  }
  return n;
}

/**
 * Soll der Schalter «Änderungsvermerke» angeboten werden?
 *
 *  · `vermerke`         — Ergebnis von `zaehleAenderungsvermerke`; `null` heisst
 *                         «kein Struktur-Sidecar da».
 *  · `hatFassungsZeile` — trägt mindestens ein Artikel einen Historie-Eintrag?
 *  · `erlassGeladen`    — sind die Artikel des Erlasses eingetroffen?
 *
 * Die DREI Zustände von `vermerke` müssen auseinandergehalten werden, und genau
 * daran wäre eine naive Fassung gescheitert (Befund beim Bau, 17.8.2026):
 *
 *   0    — Sidecar da, keine Vermerke        ⇒ nicht anbieten
 *   > 0  — Sidecar da, Vermerke da           ⇒ anbieten
 *   null — kein Sidecar. ZWEIDEUTIG, und `ladeStruktur` löst beide Fälle
 *          gleich auf (404 → null, browse.ts): «lädt noch» ODER «gibt es
 *          gar nicht». `erlassGeladen` entscheidet. Ohne diese Unterscheidung
 *          behielte ZH-211.11 den Schalter — der Erlass hat überhaupt kein
 *          Struktur-Sidecar und war einer der drei gemeldeten Fälle.
 *
 * KONSERVATIV bleibt nur die echte Unwissenheit (`erlassGeladen === false`):
 * dort wird ANGEBOTEN. Ein Steuerelement zu verschweigen, dessen Wirkung man noch
 * nicht kennt, wäre die falsche Richtung — und der umgekehrte Fehler ist harmlos,
 * weil das Panel im Grundzustand geschlossen ist (kein CLS, dieselbe Begründung
 * wie beim nachwachsenden Fussnoten-Zähler in `v3/LeserAnsichtV3.tsx`). Kein Sidecar
 * bei geladenem Erlass heisst dagegen: gar keine Fussnoten, also auch keine
 * Vermerke — das ist Wissen, keine Unwissenheit.
 */
// ── W2·26/Z8-NACHZUG (Mandat David 11.9.2026): EIN DRITTER TRÄGER ───────────
//
// Seit W2·26 nimmt die Stellung «Fassung»/«aus» den Fussnoten-Apparat als
// GANZES (`src/index.css`, Herleitung samt Nullprobe dort) — nicht mehr nur die
// Klasse `A`. Damit hat die Wahl auf JEDEM Erlass mit Fussnoten eine Wirkung,
// auch dort, wo es weder eine `kl`-Klassifikation noch eine Fassungszeile gibt.
//
// DAS IST KEIN KOMFORT, SONDERN DIE PFLICHT ZUM RÜCKWEG (§8): die VORGABE ist
// «Fassung», und sie gilt erlass-übergreifend aus dem geteilten Speicher. Ohne
// diese dritte Bedingung hätte ein Erlass ohne Vermerke seinen Apparat versteckt
// und den Schalter, mit dem man ihn zurückholt, gar nicht erst angeboten —
// genau der Treuebruch vom 16.8.2026 (H2), nur eine Ebene höher.
//
// GEMESSEN (11.9.2026, alle 1531 Struktur-Sidecars): 1088 tragen Artikel-
// Fussnoten, 253 tragen NUR Kopf-Fussnoten (CISG, VRK, STAATENLOSE, AR-131.13
// u. a.), 190 gar keine. Die 253 sind genau die Menge, die ohne diesen Nachzug
// durchgefallen wäre — darum zählt der Aufrufer Kopf- UND Artikel-Fussnoten
// (`v3/leserV3Modell.ts`).
export function bieteAenderungsvermerkeSchalter(
  vermerke: number | null,
  hatFassungsZeile: boolean,
  erlassGeladen: boolean,
  fussnoten: number | null = null,
): boolean {
  if (vermerke === null && !erlassGeladen) return true;
  return (vermerke ?? 0) > 0 || hatFassungsZeile || (fussnoten ?? 0) > 0;
}

/** Fussnoten-Nummer → Sortierschlüssel [Zahl, Suffix]; unparsbar ⇒ ans Ende. */
export function fnNrSortKey(nr: string | undefined): [number, string] {
  const m = /^(\d+)([a-z]*)$/i.exec((nr ?? '').trim());
  return m ? [parseInt(m[1], 10), m[2].toLowerCase()] : [Number.POSITIVE_INFINITY, nr ?? ''];
}
