// ─── Fussnoten-Apparat + Normverweise des Artikels (§6.6-Split, W2·24) ──────
//
// Drei zusammenhaengende, REINE Rechenbloecke aus `ArtikelLeser.tsx`, Wort fuer
// Wort unveraendert hierher gezogen: (a) welche Fussnoten der Apparat zeigt und
// in welcher Reihenfolge, (b) an welchen Absatz/Item/Randtitel ihr Marker
// gehoert, (c) welche Normverweise im Artikeltext aufloesbar sind. Kein JSX,
// kein Hook, kein Zustand — dieselben Eingaben ergeben dieselben Ausgaben (§2).
//
// WARUM EIGENE DATEI. `ArtikelLeser.tsx` stand nach R6 bei 895 Zeilen
// (§6.6-Schwelle 800). Was hier steht, ist Rechnen, kein Zeichnen — und genau
// darum darf es gehen, ohne die Waechter zu schwaechen, die auf
// `ArtikelLeser.tsx` zielen: der Linien-Kanon (`check:linien-kanon`, Marker
// `data-normtext-linie`), die Typografie-Sonde (`leser-typo-tokens.test.ts`,
// `text-…`/`leading-…`), der Benennungs-Waechter (`leser-benennung.test.ts`)
// und die Adress-Sonde (`leser-adresse-lm202.test.ts`, `kopiere`) pruefen
// ausnahmslos MARKUP und BEDIENUNG. Beides bleibt vollstaendig drueben; hier
// steht keine einzige Klasse und kein einziges Wort der Oberflaeche.

import { trenneAenderungshistorie } from '../../../lib/normtext/darstellung';
import { isValidElement, type MouseEvent, type ReactElement, type ReactNode } from 'react';
import { ArtikelBody } from '../../../components/normtext/ArtikelBody';
import { NormText, type InternRefs } from '../../../components/NormText';
import { NormChip } from '../../../components/vorlagen/NormChip';
import { fnNrSortKey } from '../berechnungen';
import type { Fussnote } from '../../../lib/normtext/browse';
import type { NormSnapshot } from '../../../lib/normtext/typen';

type Bloecke = NormSnapshot['bloecke'];

/** Welche Fussnoten der Apparat zeigt — und in welcher Reihenfolge. */
export function fussnotenAnzeige(e: { bloecke: Bloecke }, fussnoten: Fussnote[] | undefined): Fussnote[] {
  // Fussnoten am Fuss: amtliche Sidecar-Fussnoten bevorzugen; fehlen sie, die
  // aus dem Wortlaut-Block abgetrennte Änderungshistorie (Extraktions-Artefakt)
  // hier zeigen — einheitlich EINE Quelle, keine Doppelung.
  const fussAnzeigeRoh: Fussnote[] = fussnoten && fussnoten.length > 0
    ? fussnoten
    : e.bloecke
        .map((b) => trenneAenderungshistorie(b.text).historie)
        .filter((h): h is string => !!h)
        .map((text): Fussnote => ({ nr: '', text, links: [] }));
  // A43 (David 16.7.): Fussnoten in Fedlex-ANZEIGE-Reihenfolge = laufende Nummer
  // (Fedlex nummeriert global nach Dokumentposition). Das Sidecar liefert bewusst
  // [artikel-eigene, …Section-heading] (load-bearing für den Revisions-Extrakt,
  // §3) — die Section-heading-Fussnote (z. B. SchKG 56 fn 95 am Randtitel «III.
  // Geschlossene Zeiten …», steht ÜBER dem Artikel) hat aber eine KLEINERE Nummer
  // und gehört im Apparat VOR die artikel-eigenen. Darum hier für die DARSTELLUNG
  // stabil nach numerischer Nr (+ Buchstaben-Suffix «95a») sortieren; leere/nicht-
  // parsbare Nr behalten stabil ihre Lage. Reine Darstellung — Sidecar/Daten unberührt.
  // W2·5i: der Nummern-Sortierschlüssel steht als `fnNrSortKey` in ./berechnungen
  // (identische Implementierung, dort auch von der Chronologie-Reihung genutzt) —
  // die frühere lokale Kopie ist entfallen, damit die Anzeige-Ordnung der
  // Fussnoten nicht an zwei Stellen definiert ist (§5).
  const fussAnzeige: Fussnote[] = [...fussAnzeigeRoh].sort((a, b) => {
    const ka = fnNrSortKey(a.nr), kb = fnNrSortKey(b.nr);
    return ka[0] - kb[0] || ka[1].localeCompare(kb[1]);
  });
  return fussAnzeige;
}

/** Ergebnis der Marker-Verteilung — dieselben Namen wie zuvor im Komponentenkoerper. */
export interface FussnotenVerteilung {
  fnProAbsatz: Record<number, string[]>;
  fnProItem: Record<string, string[]>;
  fnArtikelEbene: string[];
  fnProSektion: Record<string, string[]>;
  fnInlineAbsatz: Record<number, Array<{ nr: string; o: number }>>;
  fnInlineItem: Record<string, Array<{ nr: string; o: number }>>;
  fnKlasse: Record<string, string>;
}

/** An welchen Absatz, welches Item, welchen Randtitel gehoert welcher Marker. */
export function verteileFussnoten(fussAnzeige: Fussnote[], bloecke: Bloecke): FussnotenVerteilung {
  const e = { bloecke };
  // Fussnoten dem Absatz zuordnen, den sie betreffen: trägt der Absatz einen
  // Normverweis auf denselben Erlass (eli/cc-Basis), auf den die Fussnote
  // verlinkt (z. B. «SR 311.0» = StGB), gehört die Fussnote zu diesem Absatz →
  // Marker am Absatzende. Sonst (z. B. «Fassung gemäss …») an der Artikelnummer.
  // Fussnote → Block: die Absatznummer kommt direkt aus der Extraktion
  // (fn.absatz = Absatz, in dem der Marker im Fedlex-HTML steht). Marker auf dem
  // Artikelkopf/der Marginalie tragen absatz=null → Artikelebene. Schlüssel =
  // Block-Index (mehrere absatzlose Blöcke kollidieren nicht).
  const fnProAbsatz: Record<number, string[]> = {};
  const fnProItem: Record<string, string[]> = {}; // Schlüssel «<blockIndex>|<marke>»
  const fnArtikelEbene: string[] = [];
  // G11: Marker für section-heading-Fussnoten je Überschrift-Label — landen NICHT
  // mehr anonym auf Artikelebene, sondern an der passenden Randtitel-/Sektions-Zeile.
  const fnProSektion: Record<string, string[]> = {};
  // FN-5/M14: wortgenau positionierbare Marker (Sidecar-`pos`) je Block bzw.
  // Item (Schlüssel «<blockIndex>|<itemIndex>»). NUR wenn der Drift-Riegel hält
  // (pos.l === aktuelle Textlänge, Offset im Bereich) — sonst fällt der Marker
  // auf die bisherigen Block-Ende-Pfade zurück (§1: nie eine geratene Position).
  const fnInlineAbsatz: Record<number, Array<{ nr: string; o: number }>> = {};
  const fnInlineItem: Record<string, Array<{ nr: string; o: number }>> = {};
  // W2·5i-HIST-ANSICHT: Fussnoten-Nr → build-seitige Klasse (`kl`). EINE Abbildung
  // für alle Marker-Pfade (ArtikelBody-Prop) und den Apparat hier. Fehlt `kl`
  // (Kanton-Sidecars, Extraktions-Fallback aus dem Wortlaut-Block), bleibt der
  // Eintrag leer → kein data-fn-klasse → in JEDER Ansicht sichtbar (§8).
  const fnKlasse: Record<string, string> = {};
  for (const f of fussAnzeige) if (f.nr && f.kl) fnKlasse[f.nr] = f.kl;
  // S1 (Optionen-Rückbau, David F1 «ja»): die frühere Chronologie-Reihung dieses
  // Artikels ist ENTFALLEN — mit dem dritten Historie-Modus fällt die zweite
  // Darstellung derselben Vermerke weg. Die Vermerke selbst sind unberührt: sie
  // stehen im Fussnoten-Apparat unten, mit Nummer, Wortlaut und AS/BBl-Link.
  for (const f of fussAnzeige) {
    if (!f.nr) continue;
    if (f.sektion) { (fnProSektion[f.sektion] ??= []).push(f.nr); continue; }
    const p = f.pos;
    if (p != null && p.b >= 0 && p.b < e.bloecke.length) {
      const blk = e.bloecke[p.b];
      // B1-Riegel (Gegenprüfungs-Befund 26.7.): eine pos darf nur inline
      // routen, wenn ArtikelBody für die Zielstelle wirklich einen Marker-Slot
      // rendert — sonst wird der Marker ersatzlos verschluckt. Spiegelbildlich
      // zu ArtikelBody, seit PR #372 (Bild-Blöcke rendern ihre items über die
      // geteilte itemListe) nach Slot getrennt:
      // - titel-Block (`titel !== undefined`; Gegenprüfung R2: `== null`
      //   liesse `titel: null` durch): rendert weder Text noch items → JEDE
      //   pos verwerfen, Legacy-Fallback unten.
      // - Bild-/Kachel-Block: Item-Slot existiert (itemListe), Text-<p>
      //   weiterhin nicht → Item-pos inline erlaubt (DBG 22 fn57, STHG 7
      //   fn27: <dl> am Formelbild), Absatz-pos verwerfen.
      // - Prosa-Block: beide Slots wie bisher.
      const bb = blk as { bild?: unknown; bildKacheln?: unknown[]; titel?: unknown };
      const istTitel = bb.titel !== undefined;
      const istBild = Boolean(bb.bild) || Boolean(bb.bildKacheln && bb.bildKacheln.length > 0);
      const itemSlotDa = !istTitel;
      const textSlotDa = !istTitel && !istBild;
      if (p.it != null && !itemSlotDa) {
        // pos verwerfen → Legacy-Routing unten (Marker am sichtbaren Block).
      } else if (p.it == null && !textSlotDa) {
        // pos verwerfen → Legacy-Routing unten (Marker am sichtbaren Block).
      } else if (p.it != null) {
        const its = blk.items ?? [];
        const zt = p.it >= 0 && p.it < its.length ? its[p.it].text : null;
        if (zt != null && p.l === zt.length && p.o >= 0 && p.o <= zt.length) {
          (fnInlineItem[`${p.b}|${p.it}`] ??= []).push({ nr: f.nr, o: p.o });
          continue;
        }
      } else if (blk.text && p.l === blk.text.length && p.o >= 0 && p.o <= blk.text.length) {
        (fnInlineAbsatz[p.b] ??= []).push({ nr: f.nr, o: p.o });
        continue;
      }
    }
    let idx = f.absatz != null ? e.bloecke.findIndex((b) => b.absatz === f.absatz) : -1;
    // A31a: Marker in einem absatzlosen Fliesstext-Absatz (fn 667 in ZGB 798a) → am
    // Ende SEINES Blocks (0-basierter Index vom Extraktor) statt auf der Artikelebene.
    // Defensiv: Index im Bereich UND Zielblock wirklich absatzlos (gegen Sidecar-Drift).
    if (idx < 0 && f.absatzIndex != null && f.absatzIndex >= 0 && f.absatzIndex < e.bloecke.length
        && e.bloecke[f.absatzIndex].absatz == null) idx = f.absatzIndex;
    if (f.item && idx < 0) idx = e.bloecke.findIndex((b) => (b.items ?? []).some((it) => it.marke === f.item));
    if (idx >= 0 && f.item && (e.bloecke[idx].items ?? []).some((it) => it.marke === f.item)) {
      (fnProItem[`${idx}|${f.item}`] ??= []).push(f.nr); // Fussnote am lit/Ziff-Item
    } else if (idx >= 0) {
      (fnProAbsatz[idx] ??= []).push(f.nr); // am Absatz
    } else fnArtikelEbene.push(f.nr); // am Artikel
  }
  return { fnProAbsatz, fnProItem, fnArtikelEbene, fnProSektion, fnInlineAbsatz, fnInlineItem, fnKlasse };
}

/** Ein im Artikel verlinkter Verweis — genau das, was der Wortlaut selbst als Link rendert. */
export interface Verweis {
  /** Dedupe-Schluessel: Chip-Text (Normverweis) bzw. Ziel-Adresse (Sprung). */
  key: string;
  /** Anzeige wie im Wortlaut («Artikel 336c», «§ 228», «Art. 51 ATSG»). */
  anzeige: string;
  /** Normverweis auf einen anderen Erlass: Text fuer den NormChip (Popover/Fedlex). */
  norm?: string;
  /** Sprung im Lesetext (eigener Erlass bzw. anderer Erlass desselben Kantons). */
  href?: string;
  /** Klick-Handler des Wortlaut-Links (Sprung im Leser) — derselbe wie dort. */
  onKlick?: (e: MouseEvent<HTMLAnchorElement>) => void;
}

// Kinder eines Elementbaums in Renderreihenfolge; `besuch` meldet true = nicht tiefer.
function wandere(n: ReactNode, besuch: (el: ReactElement<Record<string, unknown>>) => boolean): void {
  if (Array.isArray(n)) { for (const k of n) wandere(k, besuch); return; }
  if (!isValidElement<Record<string, unknown>>(n)) return;
  if (besuch(n)) return;
  wandere(n.props.children as ReactNode, besuch);
}

/**
 * Im Artikel verlinkte Verweise (dedupliziert, in Textordnung).
 *
 * §5 (W2·17-UI-BEFUNDE E-D12-B01/PE-F5-B01, 1.10.2026): KEINE eigene Erkennung.
 * Bis hierher las diese Funktion den Text mit `NORM_IM_TEXT` («Art. N KUERZEL»)
 * und sah damit weder Binnenverweise («Artikel 336c», «§ 228»), noch die
 * ausgeschriebene Form («Artikel 51 ATSG»), noch Plural-Ketten — der Wortlaut
 * verlinkte sie, das Dossier sagte «0 Verweise» (§8). Jetzt laeuft derselbe
 * Weg wie beim Rendern: `ArtikelBody` (autolink, mit Chapeau-/Selbstmarker-
 * Weichen) liefert die `NormText`-Stellen, `NormText` liefert die Links; hier
 * werden nur deren Ziele eingesammelt. Eine neue Weiche im Linker wirkt damit
 * von selbst auch hier — und ein Guard, der im Wortlaut Text laesst, taucht in
 * der Liste nie als Link auf (z. B. «Art. 52» unter dem BVG-Chapeau von
 * ZGB 89a ist nur als «Art. 52 BVG» dabei, nie als ZGB 52).
 *
 * `ArtikelBody` und `NormText` sind hook-frei und werden hier wie reine
 * Funktionen aufgerufen (kein Rendern, kein DOM). Bekommt eine der beiden einen
 * Hook, wirft der Aufruf laut — der Paritaetstest (`leser-verweise-w217`) faengt
 * das. `intern` ist PFLICHT: es traegt Ebene und Erlass des Lesers — ohne sie
 * wuerde der Linker einen kantonalen Verweis wie «Art. 70a StG» (AR-621.111)
 * als Bundesrecht aufloesen (E-D13-B01). Wer es nicht hat, zeigt keine Liste.
 */
export function sammleVerweise(
  e: Pick<NormSnapshot, 'bloecke' | 'artikel'>,
  kontext: { kuerzel: string; intern: InternRefs; fussnoten?: Fussnote[] },
): Verweis[] {
  const seen = new Set<string>();
  const out: Verweis[] = [];
  const merke = (v: Verweis) => { if (!seen.has(v.key)) { seen.add(v.key); out.push(v); } };
  // Der eigene Artikel steht nie in seiner Liste: ein Chip auf die Seite, auf der man
  // schon ist, sagt nichts. Der Wortlaut-Link selbst bleibt (er gehoert dem Text).
  const selbst = `${kontext.intern.basisPfad}#art-${e.artikel}`;
  const links = (el: ReactElement<Record<string, unknown>>): boolean => {
    if (el.type === NormChip) {
      const artikel = String(el.props.artikel);
      // Nur Verweise auf BESTIMMUNGEN («Art. 51 ATSG»). Der blosse Erlass-Verweis
      // ohne Nummer («… des StG», `artikel` = «StG») ist im Wortlaut ein Link,
      // aber keine Bestimmung — die Liste fuehrt ihn nicht (und erbt so auch nicht
      // dessen Kuerzel-Aufloesung, die in kantonalen Erlassen aufs Bundes-StG zeigt).
      if (!/^Art\b/.test(artikel)) return true;
      merke({ key: artikel.replace(/\s+/g, ' '), norm: artikel, anzeige: artikel });
      return true;
    }
    if (el.type === 'a' && typeof el.props.children === 'string') {
      const href = String(el.props.href);
      if (href === selbst) return true;
      merke({ key: href, href, anzeige: el.props.children, onKlick: el.props.onClick as Verweis['onKlick'] });
      return true;
    }
    return false;
  };
  // Dieselben Fussnoten-Eingaben wie der Wortlaut (ArtikelLeser): ein Marker mitten im Satz
  // zerlegt den Text in Segmente, und der Linker entscheidet je Segment (§5, Prüfer 2.10.2026).
  const fn = verteileFussnoten(fussnotenAnzeige(e, kontext.fussnoten), e.bloecke);
  const koerper = ArtikelBody({
    bloecke: e.bloecke, artikel: e.artikel, passus: { absatz: null }, autolink: true,
    intern: kontext.intern, zitierKontext: { artikelLabel: '', kuerzel: kontext.kuerzel },
    fnProAbsatz: fn.fnProAbsatz, fnProItem: fn.fnProItem,
    fnInlineAbsatz: fn.fnInlineAbsatz, fnInlineItem: fn.fnInlineItem, fnKlasse: fn.fnKlasse,
  });
  wandere(koerper, (el) => {
    if (el.type !== NormText) return false;
    wandere(NormText(el.props as unknown as Parameters<typeof NormText>[0]), links);
    return true;
  });
  return out;
}
