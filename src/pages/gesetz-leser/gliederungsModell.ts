// ═══ W2·19-GLIEDERUNG · S3 — Gliederungs-Modell (pure Ableitung) ═════════════
//
// Bau-Spec: fahrplaene/FAHRPLAN-W2-19-SEITENLEISTE.md §3 (Modell-Modul, Modus-
// Kette, Zeilen-Anatomie, Sonderknoten), §8 (Erlass-Typen-Matrix), §9-S3.
//
// WAS DIESES MODUL IST. Eine reine, UI-freie Ableitung aus dem bereits geladenen
// Baum (`baueGliederungsbaum`) und den bereits geladenen Snapshot-/Sidecar-Daten.
// Kein React, kein DOM, kein `Date.now()`, kein Netz — gleiche Eingabe, gleiche
// Ausgabe (§2). Es liegt in `src/pages/`, weil es DARSTELLUNG ableitet und keine
// Rechtslogik trägt (§3): es entscheidet, WIE eine Gliederung gezeigt wird, nie
// WAS rechtlich gilt. Es schreibt nichts nach `src/lib/normtext/` und liest von
// dort nur Typen.
//
// WARUM EIGENE DATEI. `inhalt-hooks.tsx` hat bei 698 Zeilen nur ~100 Zeilen Luft
// bis zum 800-Zeilen-Schlankheits-Tor (`check:schlankheit`), und das Modell ist
// als reine Funktion ohne Hooks unit-testbar — genau das verlangt §3.2 der Spec
// («Reine Funktion, unit-getestet gegen die Referenz-Erlasse»).
//
// WARUM DREI DATEIEN (13.8.2026). Mit der Artikel-Ebene (W2·18-FEHLERBUCH) riss
// diese Datei dasselbe Tor (1047 Zeilen). Geschnitten wurde entlang der Fragen,
// nicht der Zeilenzahl: `gliederungsTypen.ts` sagt, WAS ein Modell ist (reine
// Typen), `gliederungsArtikel.ts`, was die Leiste über einzelne ARTIKEL weiss,
// und hier steht der Sektionsbaum samt Modus-Kette. Die Fassade unten hält den
// Importpfad `./gliederungsModell` für alle Aufrufer gültig.
//
// WARUM EIN MODUS-SYSTEM UND KEIN «BAUM MIT SONDERFÄLLEN». Ein Drittel des
// Korpus hat keine amtliche Gliederung, 42 Kantons-Snapshots haben gar kein
// Sidecar. Leere und Teilerfassung sind damit benannte Normalfälle (§8), keine
// Bugs — und der Modus sagt der Oberfläche ehrlich, welchen der vier Fälle sie
// vor sich hat (§8 Ehrlichkeit).
//
// KNOTEN-IDENTITÄT: die bestehende `Sektion.id` (`sek-N`) bleibt der EINZIGE
// Schlüssel. `browse.ts:303` vergibt sie deterministisch in Baumbau-Reihenfolge,
// kollisionsfrei ohne Label und ohne eId; die Zuklapp-Buchhaltung, `data-sektion-id`
// und der Scroll-Spy hängen bereits daran. Der in allen drei Vor-Konzepten
// vorgeschlagene Ordinalpfad ist bewusst GESTRICHEN — er wäre eine
// §5-Doppelwahrheit ohne Konsumenten. Labels taugen nicht als Schlüssel
// (SORTG-Labelkollision), eIds fehlen kantonal vollständig.

import type { Sektion, StrukturMap } from '../../lib/normtext/browse';
import type { NormSnapshot } from '../../lib/normtext/typen';
import { berechneSektionMeta } from './berechnungen';
import { artikelSchluessel } from './tocAutoZuklappen';

// ─── Fassade (§6.6-Aufteilung 13.8.2026) ─────────────────────────────────────
// Die Typen und die Artikel-Ebene liegen seit dem 13.8.2026 in eigenen Dateien
// (`gliederungsTypen.ts`, `gliederungsArtikel.ts`), weil diese Datei mit der
// Artikel-Ebene die 800-Zeilen-Schwelle riss. Damit KEIN Aufrufer seinen
// Importpfad ändern muss — und damit `./gliederungsModell` weiterhin die eine
// Adresse des Modells bleibt —, wird hier alles re-exportiert, was vorher hier
// stand. Reines Fassaden-Muster: keine Umbenennung, keine Signatur-Änderung.
export type { ArtikelIndexZeile, ArtikelIndexGruppe } from './gliederungsTypen';
export {
  ARTIKEL_EBENE_MAX_BLATT_DECKUNG, ID_ARTIKEL, artikelRandtitel, hatRandtitel, istAnhangEintrag,
} from './gliederungsArtikel';

import type {
  ArtikelEbeneUmfang, GliederungsKennzahlen, GliederungsKnoten, GliederungsModell, GliederungsModus, ModellEingabe,
} from './gliederungsTypen';
// Die hier auch LOKAL gebrauchten Typen werden aus dem Import re-exportiert —
// ein zweites `export … from` daneben wäre laut `tsc -b` ein Konflikt (TS2484).
export type {
  ArtikelEbeneUmfang, GliederungsKennzahlen, GliederungsKnoten, GliederungsModell, GliederungsModus, ModellEingabe,
};
import {
  ARTIKEL_EBENE_MAX_BLATT_DECKUNG, baueArtikelIndex, haengeArtikelZeilen, hatRandtitel,
  istAnhangEintrag, istSchonArtikelZeile, sammleArtikel, type DirektArtikel,
} from './gliederungsArtikel';

// ─── Schwellen der Modus-Kette (§3.2) ───────────────────────────────────────
// Alle fünf Zahlen stehen hier und nur hier; die Kette unten liest sie, die
// Unit-Tests prüfen die Referenz-Erlasse GEGEN sie (nicht gegen Kopien).
/** B4 Mini: bis zu so vielen Artikeln lohnt keine Leiste. */
export const MINI_MAX_ARTIKEL = 9;
// LEER_MAX_DICHTE (0.2) ist am 13.8.2026 ERSATZLOS ENTFALLEN. Sie beantwortete
// die Frage «ab wann trägt ein Artikel-Index nicht mehr» — und die Antwort war
// falsch: ein Index aus blossen Nummern («§ 1», «§ 2» …) trägt sehr wohl, er
// ist der einzige Zugang zu 68 Erlassen ohne Randtitel. Herleitung in
// `waehleModus`. Die Nummer wird nicht neu belegt, damit kein Bestandsverweis
// still auf eine andere Schwelle zeigt.
/** B2 Artikel-Index: ab dieser Randtitel-Dichte ist «Art. N — Randtitel» tragfähig. */
export const INDEX_MIN_DICHTE = 0.6;
/** B2: so wenige AMTLICHE Knoten sind keine Gliederung mehr (VwVG: 5). */
export const INDEX_MAX_AMTLICHE_KNOTEN = 6;
/** B2: erst ab dieser Artikelzahl ist ein Index überhaupt ein Thema. */
export const INDEX_MIN_ARTIKEL = 30;
/** B1: bis zu so vielen Baumzeilen darf der Baum ganz offen starten. */
export const OFFEN_MAX_ZEILEN = 40;
/** Anhang-Ast startet aufgeklappt, sobald er den Erlass dominiert (ZH-243: 88 %). */
export const ANHANG_DOMINANZ = 0.5;

/** Synthetische Knoten-Ids — bewusst KEIN `sek-`-Präfix (Kollision ausgeschlossen). */
export const ID_VORSPANN = 'gm-vorspann';
export const ID_NACHSPANN = 'gm-nachspann';
export const ID_ANHANG = 'gm-anhang';
/**
 * Mittelgruppe (Bug-Check 9.8.2026, B2) — freie Artikel ZWISCHEN zwei
 * Baumknoten. Präfix + laufender Roh-Index des vorangehenden Stamm-Knotens,
 * damit mehrere Lücken im selben Erlass kollisionsfrei bleiben.
 */
export const ID_MITTE = 'gm-mitte';

/**
 * Übersetzt einen Rohpfad (Sektions-Ids aus `pfadZu`) in den Modellpfad, indem
 * das Umhäng-Präfix vorangestellt wird. Rein, deterministisch, ohne Kopie der
 * Umhäng-Regel — die lebt allein in `baueGliederungsModell` (§5).
 */
export function uebersetzeRohPfad(umhaengPraefix: Record<string, string[]>, roh: string[]): string[] {
  if (roh.length === 0) return roh;
  const praefix = umhaengPraefix[roh[0]];
  return praefix === undefined ? roh : [...praefix, ...roh];
}

// ─── Rohbaum-Kennzahlen ──────────────────────────────────────────────────────
interface RohMass { knoten: number; amtlich: number }
function messeRohbaum(sektionen: Sektion[]): RohMass {
  let knoten = 0, amtlich = 0;
  const gehe = (s: Sektion): void => {
    knoten++;
    if (s.randtitel !== true) amtlich++;
    s.kinder.forEach(gehe);
  };
  sektionen.forEach(gehe);
  return { knoten, amtlich };
}

// ─── Aufbau des Zeilenbaums ──────────────────────────────────────────────────
type SekMeta = ReturnType<typeof berechneSektionMeta>;

interface Bauhilfe {
  artPos: Map<string, number>;
  meta: SekMeta;
  /** Zeilen-Id → unmittelbar getragene Artikel (nur Sektionszeilen). */
  direkt: Map<string, DirektArtikel>;
}

/**
 * Einzelkind-Verdichtung (§3.3): eine Stufe, die GENAU EIN Kind und KEINE
 * eigenen Artikel hat, trägt keine eigene Information — sie wird mit ihrem Kind
 * zu EINER Zeile «§ 3 › I. › 1.» verschmolzen. Die Bedingung «keine eigenen
 * Artikel» ist nicht verhandelbar: hätte die Stufe eigene Artikel, verschwänden
 * sie beim Verschmelzen aus dem Zählwert des Kindes (T8-Falle, stummer Verlust).
 *
 * EMPIRISCHE KORREKTUR ZUR SPEC (§7 — abweichend umsetzen und offenlegen): die
 * Spec nennt BS-730.110 als Referenzfall der Verdichtung. Gemessen am
 * committeten Snapshot hat BS-730.110 KEINE einzige Einzelkind-Stufe (151
 * Knoten, alle mit ≥ 2 Kindern oder eigenen Artikeln). Wo die Verdichtung
 * wirklich greift: ZGB (3), BS-211.100 (4), BS-640.100 (2) — je Kette genau
 * EINE Stufe, im ganzen Referenzbestand keine längere. Die Unit-Tests prüfen
 * darum die Fälle, in denen die Regel feuert, UND BS-730.110 als belegten
 * Nullfall.
 */
function verdichte(s: Sektion): { kette: Sektion[]; blatt: Sektion } {
  const kette: Sektion[] = [s];
  let blatt = s;
  while (blatt.kinder.length === 1 && blatt.artikel.length === 0) {
    blatt = blatt.kinder[0];
    kette.push(blatt);
  }
  return { kette, blatt };
}

function baueSektionsKnoten(s: Sektion, tiefe: number, hilfe: Bauhilfe): GliederungsKnoten {
  const { kette, blatt } = verdichte(s);
  const arts = sammleArtikel(blatt);
  const meta = hilfe.meta.get(blatt.id);
  const erster = arts.reduce<NormSnapshot | null>(
    (best, a) => (best === null || (hilfe.artPos.get(a.artikel) ?? 0) < (hilfe.artPos.get(best.artikel) ?? 0) ? a : best),
    null,
  );
  const labelKette = kette.map((k) => k.label);
  hilfe.direkt.set(kette[0].id, {
    arts: blatt.artikel,
    randtitelBlatt: blatt.randtitel === true,
    ohneKinder: blatt.kinder.length === 0,
  });
  return {
    id: kette[0].id,
    art: 'sektion',
    ids: kette.map((k) => k.id),
    labelKette,
    label: labelKette.join(' › '),
    ebene: kette[0].ebene,
    tiefe,
    randtitel: kette[0].randtitel === true,
    eId: kette.find((k) => k.eId)?.eId,
    kinder: blatt.kinder.map((k) => baueSektionsKnoten(k, tiefe + 1, hilfe)),
    artikelAnzahl: arts.length,
    eigeneArtikel: blatt.artikel.length,
    gemischt: blatt.artikel.length > 0 && blatt.kinder.length > 0,
    bereich: meta?.bereich,
    ersterArtikel: erster?.artikel,
    aufgehoben: arts.length > 0 && arts.every((a) => a.aufgehoben === true),
    anhang: meta?.anhang === true,
  };
}

/** Synthetischer Knoten (Vorspann/Nachspann/Anhang-Blatt) über einer Artikelliste. */
function baueSynth(
  id: string,
  art: GliederungsKnoten['art'],
  label: string,
  arts: NormSnapshot[],
  tiefe: number,
  kinder: GliederungsKnoten[] = [],
): GliederungsKnoten {
  const eigen = arts.length;
  const gesamt = eigen + kinder.reduce((n, k) => n + k.artikelAnzahl, 0);
  // Bereich aus den amtlichen Etiketten der EIGENEN Artikel (§3.3: nie geraten —
  // `artikelLabel` trägt «Art. N» bzw. «§ N» bereits so, wie das Register es
  // vorgibt). Der Zweitteil wird um das Etikett gekürzt: «Art. 1–47».
  const bereich = eigen === 0
    ? undefined
    : eigen === 1
      ? arts[0].artikelLabel
      : `${arts[0].artikelLabel}–${arts[eigen - 1].artikelLabel.replace(/^(Art\.|§)\s*/, '')}`;
  return {
    id,
    art,
    ids: [id],
    labelKette: [label],
    label,
    ebene: 0,
    tiefe,
    randtitel: false,
    kinder,
    tokens: arts.map((a) => a.artikel),
    artikelAnzahl: gesamt,
    eigeneArtikel: eigen,
    gemischt: eigen > 0 && kinder.length > 0,
    bereich,
    ersterArtikel: arts[0]?.artikel ?? kinder[0]?.ersterArtikel,
    aufgehoben: gesamt > 0 && arts.every((a) => a.aufgehoben === true) && kinder.every((k) => k.aufgehoben),
    anhang: art === 'anhang',
  };
}

/**
 * Anhang-Ziffernhierarchie aus den Tokens (§3.4). Beide Dialekte:
 *   · Bund `annex_1_2`  → Stufen ['annex_1', 'annex_1_2']
 *   · Kanton `1.1.2.1`  → Stufen ['1', '1.1', '1.1.2', '1.1.2.1']
 *   · Kanton `anhang_7` → eine Stufe
 * Zwischenstufen, die selbst KEIN Artikel sind, entstehen nicht — es wird nur
 * dort geschachtelt, wo ein Eltern-Token wirklich existiert (§7: nichts
 * fabrizieren). Alles andere hängt flach unter der Anhang-Wurzel.
 */
function elternToken(token: string): string | null {
  if (token.includes('.')) {
    const i = token.lastIndexOf('.');
    return i > 0 ? token.slice(0, i) : null;
  }
  const i = token.lastIndexOf('_');
  return i > 0 ? token.slice(0, i) : null;
}

/** Erste Sidecar-Gliederungsstufe eines Tokens, oder `null` (kein Sidecar/Eintrag). */
function sidecarGruppe(
  token: string | undefined, struktur: StrukturMap | null,
): { ebene: number; label: string; eId?: string } | null {
  if (!token) return null;
  const g = struktur?.[token]?.gliederung;
  return g && g.length > 0 ? g[0] : null;
}

/**
 * W2·18-FEHLERBUCH (12.9.2026, Gegenprüfung #838): die synthetische
 * Anhang-Wurzel hiess bisher IMMER «Anhänge» — auch dort, wo unter ihr kein
 * einziger echter Anhang hängt, sondern ausschliesslich `scope_*`/`decl_*`
 * (Geltungsbereich, Erklärungen und Vorbehalte der Schweiz). Amtliche Quelle
 * für den korrekten Namen ist der Struktur-Sidecar: `extrahiereAnhangStruktur`
 * (`scripts/normtext/struktur-extrahiere.ts`) berechnet dort bereits «Anhänge»
 * (Container `annex`) bzw. «Geltungsbereich»/«Geltungsbereich und Erklärungen»
 * (Container `scope`, PR #838) je Artikel — `leserSuche.ts` liest denselben
 * Wert für die Suchfacette. Diese Funktion ist der zweite Konsument (§5: eine
 * Berechnung, zwei Verbraucher), nie eine zweite Wahrheit.
 *
 * Konservativ nach §8: nur wenn AUSNAHMSLOS jeder Beitrag unter dieser Wurzel
 * die scope-Container-eId trägt, wird das Sidecar-Label übernommen. Fehlt für
 * einen Beitrag der Sidecar-Eintrag, oder trägt auch nur einer die annex-eId
 * (die 14 LUGUE-artigen Staatsverträge: scope UND annex im selben Erlass,
 * dort bereits heute als «Anhänge» im Sidecar geführt), bleibt es bei
 * «Anhänge» — eine Behauptung, die im Zweifel den Vorbestand nicht verschärft.
 * Kantone kennen `scope_`/`decl_` nicht (Bund-Token-Namensraum, s. o.) und
 * haben ausserdem kein `struktur`-Sidecar für ihre `anhang_N`-Tokens — sie
 * fallen darum unverändert auf «Anhänge».
 */
function waehleAnhangWurzelLabel(
  anhangFrei: NormSnapshot[], anhangAeste: GliederungsKnoten[], struktur: StrukturMap | null,
): string {
  const ANHAENGE = 'Anhänge';
  const gruppen = [
    ...anhangFrei.map((a) => sidecarGruppe(a.artikel, struktur)),
    ...anhangAeste.map((k) => sidecarGruppe(k.ersterArtikel, struktur)),
  ].filter((g): g is { ebene: number; label: string; eId?: string } => g !== null);
  if (gruppen.length === 0) return ANHAENGE;
  if (gruppen.some((g) => g.eId !== 'scope')) return ANHAENGE;
  return gruppen[0].label;
}

function baueAnhangAst(arts: NormSnapshot[], dominant: boolean): GliederungsKnoten | null {
  if (arts.length === 0) return null;
  const vorhanden = new Set(arts.map((a) => a.artikel));
  const knoten = new Map<string, GliederungsKnoten>();
  const wurzelKinder: GliederungsKnoten[] = [];
  for (const a of arts) {
    const k = baueSynth(`${ID_ANHANG}:${a.artikel}`, 'anhang', a.artikelLabel, [a], 0);
    knoten.set(a.artikel, k);
  }
  for (const a of arts) {
    const k = knoten.get(a.artikel)!;
    let p = elternToken(a.artikel);
    while (p !== null && !vorhanden.has(p)) p = elternToken(p);
    const eltern = p !== null ? knoten.get(p) : undefined;
    if (eltern && eltern !== k) eltern.kinder.push(k);
    else wurzelKinder.push(k);
  }
  // Tiefen und Teilbaum-Summen nachziehen (die Zuordnung stand erst jetzt fest).
  const setze = (k: GliederungsKnoten, tiefe: number): number => {
    k.tiefe = tiefe;
    k.artikelAnzahl = k.eigeneArtikel + k.kinder.reduce((n, kk) => n + setze(kk, tiefe + 1), 0);
    k.gemischt = k.eigeneArtikel > 0 && k.kinder.length > 0;
    return k.artikelAnzahl;
  };
  const wurzel = baueSynth(ID_ANHANG, 'anhang', 'Anhänge', [], 0, wurzelKinder);
  wurzelKinder.forEach((k) => setze(k, 1));
  wurzel.artikelAnzahl = wurzelKinder.reduce((n, k) => n + k.artikelAnzahl, 0);
  wurzel.ersterArtikel = arts[0].artikel;
  wurzel.aufgehoben = arts.every((a) => a.aufgehoben === true);
  // §3.4: bei Anhang-Dominanz startet der Ast aufgeklappt (ZH-243: 88 % des Texts).
  if (dominant) wurzel.startOffen = true;
  return wurzel;
}

function zaehleZeilen(knoten: GliederungsKnoten[]): number {
  return knoten.reduce((n, k) => n + 1 + zaehleZeilen(k.kinder), 0);
}

// ─── Modus-Kette (§3.2) ──────────────────────────────────────────────────────
/**
 * Geordnete Bedingungskette — die ERSTE zutreffende gewinnt. Sie entscheidet an
 * der ZEILENZAHL, nie an der Tiefe: AIG ist nur zwei Ebenen tief, aber 52 Zeilen
 * lang und gehört darum in «B1 kompakt», nicht in «B1 offen».
 *
 * | # | Modus         | Bedingung                                                          |
 * |---|---------------|--------------------------------------------------------------------|
 * | 1 | B3 Leer       | der Snapshot trägt keinen einzigen Artikel                           |
 * | 2 | B4 Mini       | artikelAnzahl ≤ 9                                                    |
 * | 3 | B2 Index      | keine Sektionen ODER (< 6 amtliche Knoten bei ≥ 30 Art. UND ≥ 60 %)  |
 * | 4 | B1 offen      | Vollausklapp ≤ 40 Zeilen                                             |
 * | 5 | B1 kompakt    | sonst                                                                |
 *
 * «Knoten» in Zeile 3 sind die AMTLICHEN Knoten (ohne randtitel-promotete) —
 * gemessen und gegen die Spec-Zahlen belegt: VwVG 5, OR 171, ZGB 134.
 *
 * B3 IST SEIT DEM 13.8.2026 DIE ECHTE LEERE, NICHT MEHR DIE FEHLENDE
 * GLIEDERUNG (Auftrag David: die Artikel-Ebene muss in JEDEM Erlass erreichbar
 * sein). Die Bedingung hiess vorher «kein Sidecar ODER (keine Sektionen UND
 * Randtitel-Dichte < 20 %)». Gemessen am committeten Korpus traf sie 68
 * Erlasse — ausnahmslos ohne Sektionen und mit Randtitel-Dichte 0, im Mittel
 * 22 Artikel, der grösste 607 (SG-3849), 40 davon ohne Sidecar. Die Leiste
 * sagte dort «keine Gliederung erfasst» und bot NICHTS an, obwohl die
 * Artikel-Folge im Snapshot steht: sie braucht dafür weder Sidecar noch
 * Randtitel, nur das amtliche `artikelLabel` («Art. 1», «§ 1» — der Designator
 * kommt aus dem Register, nie geraten). Diese Erlasse fallen jetzt auf B2 und
 * zeigen den flachen Artikel-Index; wo Randtitel fehlen, trägt die Zeile eben
 * nur ihre Nummer (§8: nichts erfinden, aber auch nichts vorenthalten).
 * Die ehrliche Leer-Zeile bleibt für den einen Fall, in dem sie stimmt: ein
 * Erlass ohne jeden Artikel. Sie steht darum ZUERST — sonst schluckte B4 Mini
 * (≤ 9) sie und die Leiste böte ein leeres Verzeichnis an.
 * Was NICHT verschwindet: der §8-Hinweis auf das fehlende Sidecar in der
 * Erlass-Übersicht (`kennzahlen.hatSidecar`, Zone C). Dass die amtliche
 * Gliederung fehlt, erfährt der Nutzer weiterhin — er steht nur nicht mehr vor
 * einer leeren Fläche. `LEER_MAX_DICHTE` wird damit von keiner Regel mehr
 * gelesen und ist entfallen.
 */
export function waehleModus(k: GliederungsKennzahlen, hatSektionen: boolean): GliederungsModus {
  if (k.artikelAnzahl === 0) return 'b3-leer';
  if (k.artikelAnzahl <= MINI_MAX_ARTIKEL) return 'b4-mini';
  if (!hatSektionen
    || (k.amtlicheKnoten < INDEX_MAX_AMTLICHE_KNOTEN
      && k.artikelAnzahl >= INDEX_MIN_ARTIKEL
      && k.marginalienDichte >= INDEX_MIN_DICHTE)) return 'b2-index';
  return k.zeilenVoll <= OFFEN_MAX_ZEILEN ? 'b1-offen' : 'b1-kompakt';
}

/**
 * Das Modell eines Erlasses. Rein, deterministisch, ohne Seiteneffekte (§2).
 */
export function baueGliederungsModell(ein: ModellEingabe): GliederungsModell {
  const { sektionen, ohneGliederung, eintraege, struktur } = ein;
  const artPos = new Map<string, number>();
  eintraege.forEach((e, i) => artPos.set(e.artikel, i));
  const hilfe: Bauhilfe = { artPos, meta: berechneSektionMeta(sektionen, artPos), direkt: new Map() };
  const roh = messeRohbaum(sektionen);

  // 1 · Zeilenbaum aus den echten Sektionen (mit Verdichtung, Zählwerten, T8).
  const sektionsKnoten = sektionen.map((s) => baueSektionsKnoten(s, 0, hilfe));

  // 2 · Sonderknoten. Die Artikel OHNE Gliederungs-Zuordnung sind kein Rest,
  //     sondern in 18 Erlassen der Haupttext (T9 RBUE: 96 % des Texts läge sonst
  //     unerreichbar). Sie zerfallen in drei ehrliche Gruppen:
  //       · Anhang-Einträge      → eigener Ast «Anhänge» am Baumende
  //       · davor liegende Rest-Artikel → «Ohne Abschnitt (Art. 1–47)» ganz oben
  //       · dahinter liegende          → derselbe Knoten am Ende
  //     Getrennt statt zusammengefasst, damit das Bereichs-Label nie eine Spanne
  //     behauptet, die es nicht gibt (§8).
  const anhangAlle = eintraege.filter(istAnhangEintrag);
  const ersteBaumPos = sektionsKnoten.length > 0
    ? Math.min(...sektionen.flatMap((s) => sammleArtikel(s).map((a) => artPos.get(a.artikel) ?? Infinity)))
    : Infinity;
  const letzteBaumPos = sektionsKnoten.length > 0
    ? Math.max(...sektionen.flatMap((s) => sammleArtikel(s).map((a) => artPos.get(a.artikel) ?? -1)))
    : -1;
  const freieArtikel = ohneGliederung.filter((e) => !istAnhangEintrag(e));
  const vorspann = freieArtikel.filter((e) => (artPos.get(e.artikel) ?? 0) < ersteBaumPos);
  const nachspann = freieArtikel.filter((e) => (artPos.get(e.artikel) ?? 0) > letzteBaumPos);
  // B2 (Bug-Check 9.8.2026): freie Artikel liegen nicht nur VOR und NACH dem
  // Baum, sondern auch MITTENDRIN — und die fielen bis hierher aus BEIDEN Filtern
  // und damit aus dem Modell. Belegt am committeten Korpus: BS-569.500 5 von 10
  // Artikeln, ZG-641.1 2 von 14, KKV 1 von 211; in allen drei Fällen wird die
  // Leiste gerendert, die Artikel waren über sie schlicht unerreichbar. Zweit-
  // wirkung: `findeSynthPfad` lieferte für sie `null`, der Scroll-Spy stieg
  // stumm aus und die Positionsmarke behauptete weiter den zuletzt bekannten
  // Standort — eine Falschaussage (§8), nicht nur eine Lücke.
  const mittelfrei = freieArtikel.filter((e) => {
    const p = artPos.get(e.artikel) ?? 0;
    return p > ersteBaumPos && p < letzteBaumPos;
  });
  const anhangFrei = ohneGliederung.filter(istAnhangEintrag);

  // 3 · Reine Anhang-Teilbäume wandern ans Ende unter die Anhang-Wurzel
  //     (ChemRRV/AIG: die Anhänge stehen dort IM Sidecar-Baum).
  const anhangAeste = sektionsKnoten.filter((k) => k.anhang);
  // B4: die EINE Übersetzungstabelle Rohpfad→Modellpfad (Herleitung am Feld
  // `umhaengPraefix`). Alle Ids der umgehängten Zeile — auch die inneren Stufen
  // einer verdichteten Kette — zeigen auf dieselbe neue Elternzeile.
  const umhaengPraefix: Record<string, string[]> = {};
  for (const ast of anhangAeste) for (const id of ast.ids) umhaengPraefix[id] = [ID_ANHANG];

  // B2: Zuordnung der Mittelgruppen. Massgeblich ist allein die Dokument-
  // reihenfolge: eine Gruppe hängt hinter dem letzten Stamm-Knoten, der VOR ihr
  // endet. Nichts wird geraten und nichts einer Sektion zugeschlagen, zu der der
  // Artikel amtlich nicht gehört (§8) — die Gruppe ist ein eigener, ehrlich
  // benannter Knoten «Ohne Abschnitt», genau wie Vor- und Nachspann.
  const letztePosJeWurzel = sektionen.map((s) =>
    sammleArtikel(s).reduce((m, a) => Math.max(m, artPos.get(a.artikel) ?? -1), -1));
  const mittelTopf = new Map<number, NormSnapshot[]>();
  for (const a of mittelfrei) {
    const p = artPos.get(a.artikel) ?? 0;
    let idx = -1;
    for (let i = 0; i < sektionsKnoten.length; i++) {
      if (sektionsKnoten[i].anhang) continue;
      if (letztePosJeWurzel[i] < p) idx = i;
    }
    if (idx < 0) continue; // vor jedem Stamm-Knoten ⇒ deckt bereits der Vorspann
    const topf = mittelTopf.get(idx);
    if (topf) topf.push(a); else mittelTopf.set(idx, [a]);
  }

  const anhangAnteil = eintraege.length > 0 ? anhangAlle.length / eintraege.length : 0;
  const dominant = anhangAnteil > ANHANG_DOMINANZ;
  let anhangWurzel: GliederungsKnoten | null = null;
  if (anhangFrei.length > 0 || anhangAeste.length > 0) {
    anhangWurzel = baueAnhangAst(anhangFrei, dominant);
    if (anhangWurzel === null) {
      anhangWurzel = baueSynth(ID_ANHANG, 'anhang', 'Anhänge', [], 0, []);
      if (dominant) anhangWurzel.startOffen = true;
    }
    for (const ast of anhangAeste) anhangWurzel.kinder.push(ast);
    // W2·18-FEHLERBUCH: Label NACH dem Zusammenführen von anhangFrei und
    // anhangAeste neu bestimmen — erst jetzt stehen alle Beitragenden fest.
    anhangWurzel.label = waehleAnhangWurzelLabel(anhangFrei, anhangAeste, struktur);
    anhangWurzel.labelKette = [anhangWurzel.label];
    const setzeTiefe = (k: GliederungsKnoten, t: number): void => {
      k.tiefe = t;
      k.kinder.forEach((kk) => setzeTiefe(kk, t + 1));
    };
    anhangWurzel.kinder.forEach((k) => setzeTiefe(k, 1));
    anhangWurzel.artikelAnzahl = anhangWurzel.kinder.reduce((n, k) => n + k.artikelAnzahl, 0);
    anhangWurzel.aufgehoben = anhangWurzel.artikelAnzahl > 0
      && anhangWurzel.kinder.every((k) => k.aufgehoben);
    // B7 (Bug-Check 9.8.2026): die Wurzel «Anhänge» ist ein Sprungziel wie jede
    // andere Zeile — ihr Knopf ruft `onSprungArtikel(k.ersterArtikel)`. Wo der
    // Anhang vollständig IM Sidecar-Baum steht (AIG, ASYLG, KKV …), gibt es
    // keine freien Anhang-Artikel, aus denen `baueSynth` den Wert hätte ziehen
    // können: der Knopf blieb feedbacklos. Der erste Artikel des ersten Kindes
    // ist die Dokumentreihenfolge, nichts Geratenes.
    anhangWurzel.ersterArtikel ??= anhangWurzel.kinder.find((k) => k.ersterArtikel)?.ersterArtikel;
  }

  // Der Vorspann-Knoten hängt daran, dass es ÜBERHAUPT einen Baum gibt — nicht
  // daran, dass ein STAMM übrig bleibt. RBUE ist genau dieser Fall: sein einziger
  // Sidecar-Knoten ist ein reiner Anhang-Knoten, der Stamm also leer. Wäre die
  // Bedingung an `stammKnoten` geknüpft, fielen die 47 Vorspann-Artikel (96 % des
  // Texts) ersatzlos aus der Leiste — genau der Verlust, den T9 verhindern soll.
  // Ohne Sektionen greift ohnehin B2/B3, dort wird `knoten` gar nicht gezeigt.
  const hatBaum = sektionen.length > 0;
  const knoten: GliederungsKnoten[] = [];
  if (vorspann.length > 0 && hatBaum) {
    knoten.push(baueSynth(ID_VORSPANN, 'vorspann', 'Ohne Abschnitt', vorspann, 0));
  }
  // Stamm-Knoten in Dokumentreihenfolge; jede Mittelgruppe steht direkt hinter
  // dem Knoten, nach dem sie im Text folgt (B2, Herleitung bei `mittelfrei`).
  sektionsKnoten.forEach((k, i) => {
    if (k.anhang) return; // reiner Anhang-Ast: hängt unten unter «Anhänge»
    knoten.push(k);
    const topf = mittelTopf.get(i);
    if (topf) knoten.push(baueSynth(`${ID_MITTE}:${i}`, 'mitte', 'Ohne Abschnitt', topf, 0));
  });
  if (nachspann.length > 0 && hatBaum) {
    knoten.push(baueSynth(ID_NACHSPANN, 'nachspann', 'Ohne Abschnitt', nachspann, 0));
  }
  if (anhangWurzel) knoten.push(anhangWurzel);

  // Wieviele Artikel haben schon OHNE Artikel-Ebene ihre eigene Zeile? Genau die
  // Zeilen, an denen `haengeArtikelZeilen` nichts anhängen würde (Fall 1 dort) —
  // dieselbe Prüfung, EINE Definition (§5), keine zweite Zählung daneben.
  const blattGedeckt = [...hilfe.direkt.values()].filter(istSchonArtikelZeile).length;

  const kennzahlen: GliederungsKennzahlen = {
    artikelAnzahl: eintraege.length,
    hatSidecar: struktur !== null,
    // `zeilenVoll` zählt bewusst NUR die Sektionszeilen und wird VOR der
    // Artikel-Ebene gemessen: an ihm entscheidet die Modus-Kette (AIG = 52
    // Zeilen, Spec §3.2/§8), und ein Erlass darf seinen Modus nicht dadurch
    // wechseln, dass wir seine Artikel anzeigen. `zeilenGesamt` unten zählt
    // dagegen alles wirklich Gerenderte, also auch die Artikel-Zeilen.
    zeilenVoll: zaehleZeilen(sektionsKnoten),
    zeilenGesamt: 0,
    amtlicheKnoten: roh.amtlich,
    knotenGesamt: roh.knoten,
    marginalienDichte: eintraege.length > 0
      ? eintraege.filter((e) => hatRandtitel(e, struktur)).length / eintraege.length
      : 0,
    artikelBlattDeckung: eintraege.length > 0 ? blattGedeckt / eintraege.length : 0,
    anhangAnteil,
    vorspannArtikel: vorspann.length,
    nachspannArtikel: nachspann.length,
    anhangArtikel: anhangAlle.length,
  };

  const modus = waehleModus(kennzahlen, sektionen.length > 0);
  const startOffeneTiefe = modus === 'b2-index' ? Number.POSITIVE_INFINITY
    : modus === 'b1-offen' && ein.startSichtbarGo === true ? Number.POSITIVE_INFINITY
      : 0;

  // Artikel-Ebene (W2·18-FEHLERBUCH, David 13.8.2026): in JEDEM Baum-Modus,
  // nicht nur bei hoher Sachtitel-Dichte — und seit dem Nachtrag vom selben Tag
  // in JEDEM Erlass, nur in zwei Umfängen (s. `ArtikelEbeneUmfang`):
  //   · nicht artikel-granular  → `voll`    (Nummer + Sachtitel an jeder Zeile)
  //   · schon artikel-granular  → `luecken` (nur die sonst unerreichbaren)
  // Die beiden anderen Modi brauchen sie nicht bzw. können sie nicht tragen:
  //   · b2-index / b4-mini zeigen die Artikel bereits FLACH (`artikelIndex`);
  //     eine zweite, geschachtelte Artikel-Liste daneben wäre die Doppelung,
  //     die §5 verbietet (der Baum-Renderer läuft dort nur für den Anhang-Ast).
  //   · b3-leer trifft seit dem 13.8.2026 nur noch den Erlass OHNE jeden
  //     Artikel — da gibt es nichts anzuhängen. Die 68 sidecar-/randtitel-losen
  //     Erlasse, die früher hier landeten, zeigen jetzt den flachen Index
  //     (Herleitung in `waehleModus`).
  const artikelEbene: ArtikelEbeneUmfang = (modus !== 'b1-offen' && modus !== 'b1-kompakt') ? 'keine'
    : kennzahlen.artikelBlattDeckung < ARTIKEL_EBENE_MAX_BLATT_DECKUNG ? 'voll'
      : 'luecken';
  const artNach = new Map(eintraege.map((e) => [e.artikel, e]));
  if (artikelEbene !== 'keine') {
    haengeArtikelZeilen(knoten, hilfe.direkt, artPos, artNach, struktur, artikelEbene);
  } else if (anhangWurzel && (modus === 'b2-index' || modus === 'b4-mini')) {
    // In B2/B4 rendert der Baum-Renderer NUR den Anhang-Ast (inhalt.tsx) — der
    // flache Index deckt die Anhang-Einträge bewusst nicht ab (§5). Steht dort
    // eine Anhang-SEKTION mit mehreren Artikeln, springt ihre Zeile nur zum
    // ersten und der Rest bliebe unerreichbar: belegt an ASYLV3 (5 von 51) und
    // RDV (3 von 37). Darum schliesst auch hier die Lücken-Regel auf — nur im
    // Anhang-Ast, weil der Rest des Baums in diesen Modi gar nicht gezeigt wird
    // (§15: nichts bauen, was niemand sieht).
    haengeArtikelZeilen([anhangWurzel], hilfe.direkt, artPos, artNach, struktur, 'luecken');
  }
  kennzahlen.zeilenGesamt = zaehleZeilen(knoten);

  // S9: der Artikel-Index wird NUR gebaut, wo ihn ein Modus zeigt (B2 und B4 —
  // ein geöffneter Mini-Erlass braucht dieselbe flache Liste, sonst öffnet ☰
  // auf eine leere Fläche, §8). Für B1/B3 bleibt er leer statt umsonst über
  // 1'686 OR-Artikel zu laufen (§15).
  const artikelIndex = modus === 'b2-index' || modus === 'b4-mini'
    ? baueArtikelIndex(sektionen, ohneGliederung, eintraege, struktur)
    : [];

  return {
    modus,
    // B3 ist die ehrliche Leere: kein Baum, keine Ersatz-Konstruktion (§8).
    knoten: modus === 'b3-leer' ? [] : knoten,
    startOffeneTiefe,
    leisteStartetZu: modus === 'b4-mini',
    umhaengPraefix,
    artikelEbene,
    kennzahlen,
    artikelIndex,
  };
}

/**
 * Ist die Zeile aufgeklappt? Eine explizite Angabe (Klick oder Scroll-Spy) für
 * IRGENDEINE ihrer Ids gewinnt gegen den Modus-Default; liegt keine vor,
 * entscheidet die Ausnahme des Knotens (Anhang-Dominanz) bzw. die Start-Tiefe.
 */
export function zeileIstOffen(k: GliederungsKnoten, offen: Record<string, boolean>, startOffeneTiefe: number): boolean {
  const zustaende = k.ids.map((id) => offen[id]).filter((v): v is boolean => v !== undefined);
  if (zustaende.length > 0) return zustaende.some(Boolean);
  return k.startOffen ?? k.tiefe < startOffeneTiefe;
}

/**
 * Zeigt diese Zeile ihre ARTIKEL-Kinder? (F1 des §9-Bug-Checks 13.8.2026,
 * verschärft nach dem CI-Rot vom selben Tag.)
 *
 * Der gemischte Knoten (T8) trägt eigene Artikel UND Untersektionen. Beide
 * hängen an DERSELBEN Zeile und damit am selben Klapp-Zustand — die
 * Start-Regel kann also nicht beide zugleich richtig bedienen: Sektionen
 * sollen bei kleinen Bäumen offen starten (Entscheid David 8.8.2026), Artikel
 * nie (Auftrag David 13.8.2026). Die Klemme `startOffen: false` am Elternknoten
 * hat das falsch aufgelöst: sie nahm den Sektions-Kindern die Start-Sicht mit
 * (58 Erlasse, 257 Zeilen; BS-257.820 7 → 1).
 *
 * Auflösung: die Artikel-Kinder bekommen eine eigene, engere Regel — sie
 * erscheinen NUR auf einen ausdrücklichen Schritt hin. Massgeblich ist der
 * eigene Schlüssel `art@<id>` der Klapp-Karte (Herleitung bei `klappZeile`).
 * Seit W2·5m-LESER-V3 (19.9.2026) schreiben ihn alle AUSDRÜCKLICHEN Öffner —
 * Chevron, Titel, Sprung, Tieflink, Sheet-Öffnen, «alles auf» (`./klappKarte`)
 * —, nur der Spy nicht; und er gilt nur noch für Zeilen, die NUR Artikel
 * tragen (gemischte Knoten: s. u.).
 *
 * DASS DER SCROLL-SPY SIE NICHT ÖFFNET, IST KEIN DETAIL, sondern der Kern:
 * er schreibt beim Weiterlesen `true` auf die Sektions-Ids des Aktiv-Pfads.
 * Solange das auch die Artikel-Ebene aufriss, wuchs ein Ast im Vorbeilesen um
 * bis zu 49 Zeilen — und das Auto-Zuklappen hängte ihn später wieder aus. Im
 * CI kostete das 0.0751 CLS gegen ein Budget von 0.05 (Lauf 31721564029,
 * Shard 6; Quelle: eine 280×498-px-Baumzeile, die im Sichtband auf 0×0 fällt).
 * Der a33-Kontrakt «der Baum bewegt sich beim Lesen nicht von selbst» gilt
 * damit auch für die Artikel-Ebene.
 *
 * Rein und ohne DOM, damit die Regel ohne Renderer prüfbar bleibt (§3/§6.7).
 */
export function artikelKinderOffen(
  k: GliederungsKnoten, offen: Record<string, boolean>, startOffeneTiefe: number,
): boolean {
  if (!zeileIstOffen(k, offen, startOffeneTiefe)) return false;
  // W2·5m-LESER-V3 (Befund David 19.9.2026, «bei svg art. 26 nicht
  // ersichtlich»): am GEMISCHTEN Knoten folgen die Artikel der Zeile. Sie
  // stehen im Gesetz VOR dem ersten Unterabschnitt (SVG Art. 26 unter
  // «III. Titel»); eine offene Zeile, die ihre Unterabschnitte zeigt und den
  // Artikel davor verschweigt, ist ein halb offener Ast — genau der Befund
  // (Messung 19.9.2026: 6 Erlasse/29 Art. beim Öffnen, 27/245 nach Mitlaufen).
  // Die Klemme bleibt für die Zeile, die NUR Artikel trägt: dort ist die
  // Artikel-Liste der ganze Ast (bis 49 Zeilen, CLS-Beleg oben), und dort
  // öffnet ihn weiterhin nur ein ausdrücklicher Schritt (`art@`).
  // Preis (§15): öffnet der Spy einen gemischten Knoten, wachsen mit den
  // Unterabschnitten auch dessen direkte Artikel ein — korpusweit höchstens 26
  // an einem Knoten (AHVV «B. Die ordentlichen Renten»), im selben Commit wie
  // die Unterabschnitte, die der Spy dort ohnehin einblendet.
  if (k.kinder.some((kk) => kk.art !== 'artikel')) return true;
  return k.ids.some((id) => offen[artikelSchluessel(id)] === true);
}

/**
 * Was zeigt diese Zeile — und gilt sie als aufgeklappt? (W2·5m-LESER-V3,
 * Befund David 19.9.2026 «klappt oft unterste Ebene nicht auf».)
 *
 * Die EINE Ableitung, aus der Renderer (`SektionBaumTOC`, Chevron,
 * `aria-expanded`), Positionsmarke und Wächter lesen — bis hierher stand sie
 * inline im Renderer, und die Tests prüften eine Kopie davon.
 */
export interface ZeilenAnsicht {
  /** Gilt als aufgeklappt (Chevron gedreht, `aria-expanded`). */
  auf: boolean;
  /** Die Kind-Zeilen, die tatsächlich gerendert werden (Gesetzesreihenfolge). */
  sichtbareKinder: GliederungsKnoten[];
}
export function zeilenAnsicht(
  k: GliederungsKnoten, offen: Record<string, boolean>, startOffeneTiefe: number,
): ZeilenAnsicht {
  if (!zeileIstOffen(k, offen, startOffeneTiefe)) return { auf: false, sichtbareKinder: [] };
  const sichtbareKinder = artikelKinderOffen(k, offen, startOffeneTiefe)
    ? k.kinder
    : k.kinder.filter((kk) => kk.art !== 'artikel');
  // «Offen» heisst: man sieht etwas. Eine Zeile, die nur Artikel trägt und
  // deren Artikel-Ebene zu ist (Spy, Sprung auf einen Vorfahren), meldet sich
  // darum ZU — Pfeil zu, `aria-expanded=false` —, und der erste Klick öffnet
  // sie. Vorher meldete sie «offen» bei null Kindern, und der erste Klick
  // klappte sie zu (4'586 Zeilen in 222 Erlassen, Messung 19.9.2026).
  return { auf: sichtbareKinder.length > 0, sichtbareKinder };
}

/**
 * F5: welche EINE Zeile trägt die Positionsmarke?
 *
 * Die Spec sagt «der tiefste aktive Knoten». Das genügt als Regel nicht ganz,
 * denn der Nutzer darf einen Ast, in dem er gerade liest, von Hand zuklappen
 * (`manuellZuRef` — der Spy reisst ihn dann bewusst NICHT wieder auf). Läge die
 * Marke stur am tiefsten Knoten, verschwände sie in diesem Fall aus der
 * sichtbaren Leiste: der Leser stünde ohne Standort da, und der Selektor
 * `[data-toc] [data-toc-aktiv]` (a9-Sprungziel, a33-Ruhe-Messung) fände nichts
 * Bedienbares mehr. Darum: der tiefste aktive Knoten, der noch SICHTBAR ist —
 * man steigt den Aktiv-Pfad hinab, solange die Äste offen sind. Bei ganz
 * geöffnetem Pfad ist das exakt der tiefste Knoten (der Normalfall), sonst der
 * letzte sichtbare Vorfahre. In beiden Fällen genau EINE Marke.
 */
export function findeMarke(
  knoten: GliederungsKnoten[], aktivPfad: string[], offen: Record<string, boolean>, startOffeneTiefe: number,
  /**
   * Token des gerade gelesenen Artikels (F2 des §9-Bug-Checks 13.8.2026).
   * Ohne ihn endete die Marke am Kapitel, obwohl die Artikel-Zeile daneben
   * sichtbar war: der Aktiv-Pfad kommt aus `pfadZu`/`findeSynthPfad` und kennt
   * nur Sektions- bzw. Synth-Ids, nie die `gm-art:`-Ids. Belegt an ZPO Art. 404
   * (Marke auf «Übergangsbestimmungen» statt auf der Zeile) und OR Art. 329gbis
   * (Marke auf einem sachfremden Nachbarknoten). Der flache Artikel-Index
   * (B2/B4) markiert längst artikelgenau — die Baum-Ansicht zieht hier nach.
   */
  aktivToken?: string | null,
): string | null {
  if (aktivPfad.length === 0) return null;
  let marke: string | null = null;
  let liste = knoten;
  for (;;) {
    const treffer = liste.find((k) => k.ids.some((id) => aktivPfad.includes(id)));
    if (!treffer) return marke;
    marke = treffer.id;
    // Abstieg nur, wo die Zeile wirklich etwas zeigt (`zeilenAnsicht`, EINE Quelle).
    if (!zeilenAnsicht(treffer, offen, startOffeneTiefe).auf) return marke;
    // Die Artikel-Zeile gewinnt, sobald sie wirklich sichtbar ist: sie ist der
    // tiefste sichtbare Knoten des Aktiv-Pfads. Ist sie zugeklappt (oder liest
    // der Nutzer einen Artikel ohne eigene Zeile), bleibt es beim Kapitel —
    // «genau EINE Marke» gilt unverändert.
    if (aktivToken && artikelKinderOffen(treffer, offen, startOffeneTiefe)) {
      const zeile = treffer.kinder.find((kk) => kk.art === 'artikel' && kk.ersterArtikel === aktivToken);
      if (zeile) return zeile.id;
    }
    liste = treffer.kinder;
  }
}

/** Alle Zeilen des Modells in Renderreihenfolge (Testhilfe und Zählwerk). */
export function flacheZeilen(knoten: GliederungsKnoten[]): GliederungsKnoten[] {
  return knoten.flatMap((k) => [k, ...flacheZeilen(k.kinder)]);
}

/**
 * Pfad (Wurzel → Zeile) zu der SYNTHETISCHEN Zeile, die diesen Artikel deckt —
 * oder `null`, wenn der Artikel in der amtlichen Gliederung liegt (dann ist
 * `pfadZu` über den Rohbaum zuständig, §5: eine Quelle je Frage).
 *
 * W2·19-GLIEDERUNG/S5, Spec §3.4 «Scroll-Spy kennt den Zustand ‹vor dem ersten
 * Knoten› und markiert ihn». Ohne diese Auflösung liest man beim RBUE 47 von 49
 * Artikeln, ohne dass die Leiste irgendetwas markiert.
 */
export function findeSynthPfad(knoten: GliederungsKnoten[], token: string): string[] | null {
  for (const k of knoten) {
    if (k.art !== 'sektion') {
      if (k.tokens?.includes(token)) return [k.id];
      const tiefer = findeSynthPfad(k.kinder, token);
      if (tiefer) return [k.id, ...tiefer];
    }
  }
  return null;
}
