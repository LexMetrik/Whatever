// ─── B4: Reader-seitiges Laden + Auflösen der Bezugs-Shards ──────────────────
//
// W2·7-BEZUG/B4. UI-naher Lade-/Auflöse-Helfer — KEINE Datenschicht: das Laden,
// Auflösen, Filtern und Zählen liegt vollständig in `lib/rechtsprechung/bezuege.ts`
// (B1) und wird hier nur konsumiert (§3). Was hier lebt, ist die Bedien-Frage
// «WANN wird geladen und für welchen Artikel gilt was» — und die ist reine
// Darstellung.
//
// ── ON DEMAND, NIE EAGER (§15) ─────────────────────────────────────────────
// Der Bezugs-Shard ist schwer, und mit B7 (Deckel aufgehoben, David-Auftrag
// 28.7.2026) deutlich schwerer geworden: gemessen 29.7.2026 BGG 2'504 KB roh /
// 300 KB gzip, StPO 1'194 / 102 KB — vorher 717 / 65 KB beim damals grössten.
// Er wird darum NUR geladen, wenn überhaupt eine Instanz-Facette aktiv ist; sind
// alle abgewählt, fasst der Reader ihn nie an. Das Laden läuft im Leerlauf
// (`beiLeerlauf`, dasselbe Muster wie Leitfall-/Revisions-/Historie-Shard), nie
// im kritischen Pfad des Seitenaufbaus, und AN DER STELLE des schlanken
// norm-index-Shards, nie zusätzlich.
//
// ── EIN FETCH JE ERLASS, NICHT EINER JE ARTIKEL (§15.4) ────────────────────
// Grosse Erlasse haben ~1000 Artikel. Ein Fetch je Zeile war der belegte
// Idle-Herden-Befund aus W2·7-VZUI (>13 s Long-Tasks im 20×-Throttle). Darum:
// EIN Fetch auf Reader-Ebene, das Ergebnis als Prop an reine Renderer.
//
// ── WARUM «STATT», NICHT «ZUSÄTZLICH» (§5) ─────────────────────────────────
// Der Bezugs-Shard ist die OBERMENGE des Leitfall-Shards (Abgrenzungs-Kommentar
// in bezuege.ts). Beide für DIESELBE Zeile zu laden hiesse, dieselben BGE-Kanten
// zweimal über die Leitung zu holen und zwei Wahrheiten am selben Artikel zu
// haben. Der ARTIKEL-FUSS speist sich deshalb aus genau einem der beiden und
// wechselt mit der Facetten-Wahl; es gibt nur EIN Einwachsen der Zeile, also
// keinen zweiten Layout-Sprung (CLS).
//
// EHRLICHE EINSCHRÄNKUNG (an der Netzwerk-Sonde gemessen, 28.7.2026): «kein
// norm-index-Fetch mehr» gilt NICHT für die Seite als Ganzes. Das KontextPanel
// (`components/kontext/KontextPanel.tsx`) lädt denselben Shard für seinen
// eigenen Zweck und ist von B4 unberührt — im erweiterten Zustand gehen daher
// weiterhin beide Dateien über die Leitung, nur eben für zwei verschiedene
// Flächen. Wer das zusammenlegen will, muss das KontextPanel umstellen; das ist
// bewusst NICHT Teil von B4 (fremde Fläche, eigener Schritt).

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ladeBezugsShard, bezuegeFuerArtikel, klassenImShard, normArtikelToken,
  type Bezug, type BezugsShard, type KlassenZahlen,
} from '../../lib/rechtsprechung/bezuege';
import type { BezugStatus } from '../../lib/verzahnung/facetten';
import { bauePraedikate, waehleBezuege } from './bezugAuswahl';
import { baueJahresHistogramm, istBereichOffen, type Histogramm, type Zeitbereich } from './bezugZeit';
import { holeBezugKlassen, useBezugBis, useBezugKantone, useBezugKlassen, useBezugVon } from './leserOptionen';
import { beiLeerlauf } from '../../lib/leerlauf';

/** Was ein Artikel-Fuss zum Rendern braucht (siehe `BezuegeZeile`). */
export interface ArtikelBezuege {
  /** Kanten NACH Facetten-Filter, in Shard-Ordnung. */
  kanten: Bezug[];
  /** Kanten je Status an diesem Artikel OHNE UI-Filter — die Bezugsgrösse (§8).
   *  AM ARTIKEL ist «Kante» = «Entscheid» (ein Dokument steht dort genau
   *  einmal); der Unterschied entsteht erst beim Aufsummieren über einen ganzen
   *  Erlass, siehe `KlassenZahlen` in bezuege.ts. */
  gesamt: Partial<Record<BezugStatus, number>>;
  /**
   * Ist ein Zeitraum-Filter aktiv? B7: seit der Deckel weg ist, kann eine
   * verkürzte Linie NUR noch von einem UI-Filter kommen — und dann soll am
   * Gruppenkopf stehen, von welchem («12 von 30 im Zeitraum» statt bloss
   * «12 von 30»). Ohne diese Auskunft läse sich die Verkürzung wie die
   * Datenlage (§8).
   */
  zeitAktiv: boolean;
  /**
   * Ist ein Kantons-Filter aktiv? Dieselbe Frage, zweite Achse — und der
   * Befund, der sie nachträglich erzwungen hat: ohne dieses Feld fiel der
   * Zähler an StPO/428 mit Kanton «GR» auf «1» zurück, obwohl der Artikel 882
   * kantonale Entscheide führt (Gegenprüfung Runde 2/J1).
   *
   * Die Bedingung ist DIESELBE wie in `bauePraedikate` (§5): eine Kantonswahl
   * wirkt nur, solange die kantonale Klasse überhaupt eingeschaltet ist —
   * sonst gäbe es nichts zu schneiden, und der Zusatz behauptete eine
   * Einschränkung, die gar nicht greift.
   */
  kantonAktiv: boolean;
}

/**
 * Bezüge des aktuellen Erlasses bereitstellen.
 *
 * Rückgabe: siehe die Feld-Kommentare am Rückgabetyp direkt darunter. Der
 * wichtigste ist `bezuegeFuer(artikel)` — die gefilterten Kanten eines Artikels,
 * oder `undefined`, solange nichts geladen ist bzw. der Erlass keinen Shard hat.
 *
 * ── EIN FELD `erweitert` GIBT ES NICHT (W2·7-VZUI, 31.8.2026) ──────────────
 * Hier stand bis 31.8.2026 ein JSDoc-Absatz über ein Rückgabe-Feld `erweitert`,
 * «an dem der Reader entscheidet, ob er den schlanken Leitfall-Shard lädt oder
 * diesen hier». Das Feld hat diese Hook nie geführt (der Typ darunter ist
 * vollständig: `aktiv`, `geladen`, `bezuegeFuer`, `kantoneVerfuegbar`,
 * `klassenImErlass`, `histogramm`, `bereich`), und die beschriebene Weiche
 * existiert nicht — der schlanke Shard wird im Gesetz-Leser gar nicht mehr
 * geholt. Der Absatz ist darum gestrichen, nicht korrigiert: er dokumentierte
 * kein Verhalten, sondern eine Absicht (Herleitung im Kopf von
 * `bezugAuswahl.ts`).
 *
 * Das Ergebnis ist an den Erlass-Key gebunden (wie beim Leitfall-Shard): ein
 * Pane-/Erlass-Wechsel liefert nie fremde Kanten.
 */
export function useBezuege(erlassKey: string | undefined): {
  /** Ist überhaupt eine Facette aktiv? Nur dann wird geladen und gerendert. */
  aktiv: boolean;
  /**
   * Ist der Lade-VERSUCH für diesen Erlass abgeschlossen? (H3-Nachzug A1)
   *
   * ── DER BEFUND, DEN DAS BEHEBT (gemessen 17.8.2026) ──────────────────────
   * Das V3-Panel leitete «geladen» aus `klassenImErlass` ab («nicht leer ⇒ ein
   * Shard wurde ausgewertet»). Bei einem Erlass OHNE Shard ist das dauerhaft
   * falsch: `ladeBezugsShard` löst 404 zu `null` auf, `klassenImShard(null)`
   * gibt `{}` zurück — die Ableitung sagt für immer «lädt noch». Gemessen an
   * ZH-211.11 (`?leser=v3`): nach 8 s stand im Reiter «Entscheide» nur
   * «Entscheide werden geladen …», und das an **1149 von 1459** Erlassen (79 %;
   * 311 Bezugs-Shards, kein einziger für ZH).
   *
   * Ein «Fetch fertig»-Signal ist aus dem ERGEBNIS grundsätzlich nicht
   * ableitbar — «leer» und «noch nichts da» sehen darin gleich aus. Es muss von
   * der Stelle kommen, die den Fetch kennt: von hier. Nach einem 404 ist der
   * Wert bewusst `true` — «wir haben nachgesehen, es gibt nichts» ist Wissen
   * und darf nicht als Unwissen erscheinen (§8).
   *
   * `aktiv === false` (alle Instanzen abgewählt) lädt nichts und meldet darum
   * auch nichts: dort gilt der BEDIEN-Zustand, nicht der Wissens-Zustand.
   */
  geladen: boolean;
  /** S6-W1b (E-3/D-3/B-8): der Ladeversuch ist GESCHEITERT (Netz/5xx) — nicht
   *  dasselbe wie ein 404 («kein Shard», dann ist `geladen` wahr). */
  fehler: boolean;
  /** Einen neuen Ladeversuch anstossen (Knopf «erneut laden»). */
  neuLaden: () => void;
  bezuegeFuer: (artikel: string) => ArtikelBezuege | undefined;
  /** D30 · dieselben Kanten OHNE die UI-Auswahl — die Bezugsgrösse, die die
   *  Kopfzahl der Bezüge-Zeile zählt (Herleitung an der Implementierung). */
  alleFuer: (artikel: string) => ArtikelBezuege | undefined;
  /** Kantone, zu denen dieser Erlass wirklich Kanten hat (leer, solange der
   *  Shard nicht geladen ist) — speist den Kanton-Schalter im «Ansicht ▾». */
  kantoneVerfuegbar: string[];
  /** B7/c: Kanten je Instanz-Klasse in DIESEM Erlass — die Zahl am
   *  Instanz-Schalter. Leer, solange kein Shard geladen ist. */
  klassenImErlass: Partial<Record<BezugStatus, KlassenZahlen>>;
  /** B5: Jahres-Verteilung der Kanten DIESES Erlasses für den Zeitstrahl. */
  histogramm: Histogramm;
  /** B5: der aktive Von-Bis-Bereich, für Steuerung und Kanten-Auswahl. */
  bereich: Zeitbereich;
} {
  const klassen = useBezugKlassen();
  const kantone = useBezugKantone();
  // B5: zwei Primitiv-Selektoren (Begründung in leserOptionen.ts) — das Objekt
  // entsteht memoisiert hier, damit es eine stabile Referenz für die
  // Abhängigkeits-Listen unten hat.
  const von = useBezugVon();
  const bis = useBezugBis();
  const bereich = useMemo<Zeitbereich>(() => ({ von, bis }), [von, bis]);
  // Vorgabe David 28.7.2026 («nur auflistung wenn aktiviert»): geladen wird,
  // sobald ÜBERHAUPT eine Facette aktiv ist — auch im Default (damals nur
  // Leitentscheide, seit S6-W1b alle Instanzen). Das ist kein Rückschritt gegenüber dem Bestand: die alte
  // V1a-Chip-Reihe lud dort faktisch ebenfalls einen Shard, nur den schlanken.
  // Sind ALLE Facetten aus, wird nichts geladen und nichts gerendert — dann
  // kostet die Verzahnung null Byte und null Pixel.
  const aktiv = klassen.length > 0;
  const [shard, setShard] = useState<{ key: string; shard: BezugsShard | null } | null>(null);
  // S6-W1b · Fehler-Lage und Neuversuch. `fehlerKey` bindet den Fehler an den
  // Erlass (wie `shard.key`): ein Pane-/Erlass-Wechsel erbt keinen fremden
  // Fehler. `versuch` ist der EINE Auslöser eines neuen Ladeversuchs — Knopf
  // «erneut laden» und die Netz-Rückkehr (`online`) zählen ihn beide hoch.
  const [fehlerKey, setFehlerKey] = useState<string | null>(null);
  const [versuch, setVersuch] = useState(0);
  const neuLaden = useCallback(() => { setFehlerKey(null); setVersuch((v) => v + 1); }, []);

  useEffect(() => {
    if (!erlassKey) return;
    let lebt = true;
    const abbrechen = beiLeerlauf(() => {
      // ALLE FACETTEN AUS ⇒ GAR NICHT LADEN — nicht «Grundzustand ⇒ gar nicht
      // laden», wie hier bis 31.8.2026 stand. Der Grundzustand ist `{bge}` (seit
      // S6-W1b, 23.9.2026: alle vier Klassen) und hat damit nie die Länge 0;
      // die Bedingung darunter greift erst, wenn der
      // Nutzer die letzte Instanz abwählt. Der falsche Satz war die
      // Kommentar-Hälfte derselben zweiten Wahrheit, die der Kopf von
      // `bezugAuswahl.ts` aufräumt.
      //
      // DIE §15-ZUSAGE HÄNGT NICHT AN DIESER ZEILE, sondern am Panel-Gate
      // (`usePanelBezuege`): ohne Nutzer-Geste kommt hier gar kein `erlassKey`
      // an, und der Effekt läuft oben in die frühe Rückgabe. Diese Bedingung ist
      // die zweite, engere Sperre: wer im offenen Panel ALLES abwählt, löst auch
      // dann keinen Fetch aus, wenn er den Erlass wechselt.
      //
      // Gefragt wird der MODULWERT, nicht der gerenderte Zustand: während der
      // Hydration liefert der Store noch den Default (Begründung an
      // `holeBezugKlassen`). Der Effekt läuft trotzdem auf `erweitert` als
      // Abhängigkeit — er soll ja erneut anlaufen, wenn der Nutzer umschaltet.
      if (holeBezugKlassen().length === 0) return;
      // S6-W1b (E-3/D-3/B-8): der zweite Zweig ist die FEHLER-Lage. Seit
      // `ladeBezugsShard` bei Netzfehler/5xx wirft statt `null` zu liefern,
      // landet ein Abbruch hier und nicht mehr als «kein Shard» im Zustand.
      void ladeBezugsShard(erlassKey).then(
        (s) => { if (lebt) { setShard({ key: erlassKey, shard: s }); setFehlerKey(null); } },
        () => { if (lebt) setFehlerKey(erlassKey); },
      );
    });
    return () => { lebt = false; abbrechen(); };
  }, [erlassKey, aktiv, versuch]);

  const bezuegeFuer = useCallback((artikel: string): ArtikelBezuege | undefined => {
    if (!aktiv || !erlassKey || shard?.key !== erlassKey || !shard.shard) return undefined;
    const s = shard.shard;
    const token = normArtikelToken(artikel);
    const alle = bezuegeFuerArtikel(s, token);
    if (alle.length === 0) return undefined;
    // `waehleBezuege` statt `filtereBezuege` direkt: die LEERE Auswahl heisst
    // in der Datenschicht «keine Einschränkung», in dieser Bedienung aber
    // «alles abgewählt» (Begründung dort, mit reproduziertem Befund).
    //
    // B5: der Zeit-Bereich geht als weiteres Prädikat mit hinein — dieselbe
    // Stelle, dieselbe Auswahl. Ein zweiter Filter irgendwo weiter unten in der
    // Darstellung erzeugte eine zweite Auswahl-Wahrheit am selben Artikel (§5).
    const kanten = waehleBezuege(alle, klassen, kantone, bereich);
    return {
      kanten,
      // Bezugsgrösse AUS DEM SHARD, nicht aus der gerenderten Liste.
      //
      // §8/B5-Auflage: `gesamt` bleibt die Zahl OHNE Zeitfilter. Die Zahl neben
      // dem Gruppenkopf antwortet damit auf «wie viel gibt es zu diesem
      // Artikel», nicht auf «wie viel habe ich gerade eingestellt» — sonst
      // schrumpfte die Grundgesamtheit mit dem Filter mit und behauptete, es
      // gäbe weniger Praxis, als es gibt.
      //
      // B7: seit der Auslieferungs-Deckel weg ist, ist diese Zahl im ungefilterten
      // Fall gleich `kanten.length` — die Zeile zeigt dann schlicht «30» statt
      // «8 von 30». Weichen die beiden ab, war es ein UI-Filter, und nur dann
      // steht das «von» überhaupt da.
      gesamt: s.gesamtProArtikel?.[token] ?? {},
      zeitAktiv: !istBereichOffen(bereich),
      kantonAktiv: kantone.length > 0 && klassen.includes('kantonal'),
    };
  }, [aktiv, erlassKey, shard, klassen, kantone, bereich]);

  /**
   * DIESELBEN KANTEN, OHNE DIE UI-AUSWAHL (W2·24-R5-F1K · D30, 6.9.2026).
   *
   * ── DER BEFUND, DEN DAS BEHEBT (gemessen 7.9.2026, OR 336c @1440) ─────────
   * Die aufgeklappte Bezüge-Zeile am Artikelkopf zeigte 3 von 11 Entscheiden.
   * Die Kopfzahl (Zähl-Datei, ungefiltert) sagte 11, die Liste zeigte die
   * Leitentscheide — die übrigen 8 fehlten samt ihrer Gruppe, also OHNE jeden
   * Hinweis, dass eine Auswahl im Spiel ist. Das ist genau das versteckte
   * Filter, das Ä54 am Panel verbietet: «ein Ergebnis, dessen Einschränkung man
   * nicht sieht, ist eine falsche Auskunft über den Bestand» (§8).
   *
   * WARUM NICHT STATTDESSEN DIE FILTERZEILE AN DIE BEZÜGE-ZEILE HÄNGEN: die
   * Facetten gehören zum Panel, das sie anzeigt und bedienbar macht. Die Zeile
   * am Artikelkopf ist eine ANTWORT AUF DIE KOPFZAHL — sie soll zeigen, was die
   * Zahl zählt, und die Zahl zählt ungefiltert (§5, eine Bezugsgrösse). Ein
   * zweiter Satz Filterknöpfe im Lesekörper wäre eine zweite Auswahl-Wahrheit.
   *
   * KEINE NEUE RECHNUNG: das ist `bezuegeFuer` ohne den einen `waehleBezuege`-
   * Schritt. Dieselbe Quelle, dieselbe Ordnung, dieselbe `gesamt`-Angabe;
   * `zeitAktiv`/`kantonAktiv` sind hier per Definition `false`, weil kein
   * Filter wirkt — die Gruppenköpfe schreiben dann keine «von»-Einschränkung,
   * und das ist wahr.
   */
  const alleFuer = useCallback((artikel: string): ArtikelBezuege | undefined => {
    if (!aktiv || !erlassKey || shard?.key !== erlassKey || !shard.shard) return undefined;
    const s = shard.shard;
    const token = normArtikelToken(artikel);
    const kanten = bezuegeFuerArtikel(s, token);
    if (kanten.length === 0) return undefined;
    return { kanten, gesamt: s.gesamtProArtikel?.[token] ?? {}, zeitAktiv: false, kantonAktiv: false };
  }, [aktiv, erlassKey, shard]);

  // useMemo, nicht bei jedem Render neu: die Ableitung geht über ALLE Dokumente
  // des Shards (bis ~1200 bei der StPO) und das Ergebnis hängt an einem Prop-
  // Pfad bis ins «Ansicht ▾»-Menü — eine neue Array-Identität je Render machte
  // dessen memo-Wrapper wirkungslos (§15.4).
  //
  // `shard != null` MUSS zuerst stehen und nicht bloss `shard?.key === erlassKey`:
  // solange kein Erlass geladen ist, sind BEIDE Seiten `undefined`, der Vergleich
  // ist wahr und der Zugriff auf `shard.shard` lief auf null («Cannot read
  // properties of null (reading 'shard')» — reproduziert 28.7.2026 im Dev-Server,
  // die ganze Leser-Seite fiel in die Fehlergrenze).
  const kantoneVerfuegbar = useMemo(
    () => (shard && erlassKey && shard.key === erlassKey ? kantoneImShard(shard.shard) : []),
    [shard, erlassKey],
  );

  // B7/c: dieselbe Bindung an den Erlass-Key wie oben — ein Pane-/Erlass-Wechsel
  // darf nie die Zahlen des vorigen Erlasses am Schalter stehen lassen. useMemo,
  // weil die Zählung über ALLE Kanten des Shards geht (BGG: 18'571) und das
  // Ergebnis als Prop bis ins Dropdown durchgereicht wird (§15.4).
  const klassenImErlass = useMemo(
    () => (shard && erlassKey && shard.key === erlassKey ? klassenImShard(shard.shard) : LEERE_KLASSEN),
    [shard, erlassKey],
  );

  // B5: Jahres-Verteilung für den Zeitstrahl. BEWUSST OHNE den Zeit-Bereich in
  // der Abhängigkeitsliste — der Zeitstrahl zeigt die Verteilung, AUS DER man
  // wählt, nicht das Ergebnis der eigenen Wahl. Ein Histogramm, das sich beim
  // Ziehen selbst umbaut, entzieht der Geste die Bezugsgrösse; man könnte eine
  // einmal enger gezogene Auswahl nicht mehr sehend erweitern.
  //
  // Die FACETTEN gehen hingegen ein: wer nur Leitentscheide zeigt, soll die
  // Verteilung der Leitentscheide sehen und nicht die aller 3207 Kanten der
  // StPO — sonst zöge er an Balken, die zu Entscheiden gehören, die er gar nicht
  // eingeschaltet hat (§8: keine Verteilung behaupten, die nicht die gezeigte ist).
  //
  // useMemo, nicht je Render: der Lauf geht über ALLE Kanten des Shards
  // (StPO 3207) — bei jedem Tastendruck im Datumsfeld wäre das eine vermeidbare
  // Runde (§15).
  const histogramm = useMemo<Histogramm>(() => {
    if (!aktiv || !shard || !erlassKey || shard.key !== erlassKey || !shard.shard) {
      return LEERES_HISTOGRAMM;
    }
    return histogrammAusShard(shard.shard, klassen, kantone);
  }, [aktiv, shard, erlassKey, klassen, kantone]);

  // A1: das Lade-Ende. `shard` wird auch bei 404 gesetzt (`shard: null`) — genau
  // darin liegt die Auskunft, die aus `klassenImErlass` nicht zu holen ist.
  const geladen = aktiv && shard != null && shard.key === erlassKey;
  // S6-W1b: der Fehler gilt nur, solange für DIESEN Erlass nichts geladen ist.
  const fehler = aktiv && !geladen && erlassKey != null && fehlerKey === erlassKey;

  // Nach Netz-Rückkehr von selbst neu laden (E-3: «lädt nach Netz-Rückkehr nie
  // neu»). Der Hörer steht nur, solange ein Fehler vorliegt — sonst gäbe es
  // nichts nachzuholen, und ein Dauer-Hörer wäre Last ohne Zweck (§15).
  useEffect(() => {
    if (!fehler) return;
    window.addEventListener('online', neuLaden);
    return () => window.removeEventListener('online', neuLaden);
  }, [fehler, neuLaden]);

  return { aktiv, geladen, fehler, neuLaden, bezuegeFuer, alleFuer, kantoneVerfuegbar, klassenImErlass, histogramm, bereich };
}

/** Geteilte Leer-Instanzen: halten die Referenz stabil, solange nichts geladen
 *  ist — eine neue Objekt-Identität je Render machte die memo-Wrapper auf dem
 *  Prop-Pfad bis ins Dropdown wirkungslos (§15.4). */
const LEERES_HISTOGRAMM: Histogramm = { balken: [], ohneJahr: 0 };
const LEERE_KLASSEN: Partial<Record<BezugStatus, KlassenZahlen>> = {};

/**
 * Jahres-Verteilung ALLER Kanten eines Shards, gefiltert nach den aktiven
 * Facetten (ohne Zeit-Achse — siehe Aufruf-Kommentar).
 *
 * ZÄHLEINHEIT IST DIE KANTE, nicht das Dokument: ein Entscheid, der fünf Artikel
 * dieses Erlasses auslegt, ist an diesem Erlass fünfmal einschlägig. Die
 * Auflistung unter den Artikeln zählt genauso, und ein Zeitstrahl, der anders
 * zählte als die Liste darunter, wäre eine zweite Zahl-Wahrheit (§5). Die
 * Summen-Identität (Balken + `ohneJahr` = Kanten) ist im Test festgehalten.
 *
 * Rein (§2), exportiert für genau diesen Test.
 */
export function histogrammAusShard(
  shard: BezugsShard,
  klassen: readonly BezugStatus[],
  kantone: readonly string[],
): Histogramm {
  if (klassen.length === 0) return LEERES_HISTOGRAMM;
  const praedikate = bauePraedikate(klassen, kantone);
  const daten: string[] = [];
  for (const eintraege of Object.values(shard.proArtikel)) {
    for (const e of eintraege) {
      const kopf = shard.dokumente[e.key];
      // Eintrag ohne Dokument-Kopf wird ÜBERSPRUNGEN — genau wie in
      // `bezuegeFuerArtikel`, sonst zählte der Strahl Kanten, die die Liste
      // darunter gar nicht rendert.
      if (!kopf) continue;
      if (!praedikate.every((p) => p(kopf))) continue;
      daten.push(kopf.datum);
    }
  }
  return baueJahresHistogramm(daten);
}

/**
 * Welche Kantone kommen im Shard dieses Erlasses überhaupt vor?
 *
 * Der Kanton-Schalter im «Ansicht ▾»-Menü wird AUS DEN DATEN gebaut, nicht aus
 * einer Kantonsliste: ein Schalter für einen Kanton, zu dem dieser Erlass keine
 * Kante hat, wäre ein Steuerelement, das garantiert nichts findet (§13 F4) —
 * und zugleich die stille Behauptung, dort gäbe es Praxis, die wir nur gerade
 * ausgeblendet haben (§8). 'CH' ist kein Kanton und fällt weg.
 *
 * Rein abgeleitet, alphabetisch (§2 — nie nach Häufigkeit, das wäre eine
 * Gewichtung, die die Daten nicht tragen).
 */
function kantoneImShard(shard: BezugsShard | null | undefined): string[] {
  if (!shard) return [];
  const aus = new Set<string>();
  for (const d of Object.values(shard.dokumente)) {
    if (d.facetten.kanton !== 'CH') aus.add(d.facetten.kanton);
  }
  return [...aus].sort();
}
