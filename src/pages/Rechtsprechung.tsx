import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SeitenKopf } from '../components/layout/SeitenKopf';
import { usePaneKlasse } from '../components/layout/PaneKontext';
import { EntscheidKarte } from '../components/rechtsprechung/EntscheidKarte';
import { EntscheidZeile } from '../components/rechtsprechung/EntscheidZeile';
import { EntscheidFilter } from '../components/rechtsprechung/EntscheidFilter';
import { SachgebietKacheln } from '../components/rechtsprechung/SachgebietKacheln';
import { LiveSuche } from '../components/rechtsprechung/LiveSuche';
import { Leerzustand } from '../components/ui/Leerzustand';
import { GruppenKopf } from '../components/ui/GruppenKopf';
import { zahlGruppiert } from '../components/typografie';
import {
  ladeEntscheidManifest, ladeRichterRegister, filterEntscheide, sortiere, gruppiereNachLeit,
  gruppiereNachInstanz, zaehleSachgebiete, normLabel,
  type EntscheidFilterWerte, type SortModus,
} from '../lib/rechtsprechung/browse';
import {
  achsenDiff, leseFilterAusUrl, lokaleWerte, wendeAchsenAn,
  leseDichte, schreibeDichte, leseSort, schreibeSort, leseKlappe, schreibeKlappe,
  leseFenster, schreibeFenster, zaehleAktiveFilter, type Fenster,
  type Dichte, type UrlAchse,
} from '../components/rechtsprechung/zustand';
import { zaehleBaender, istChronologisch, type BandGruppe } from '../components/rechtsprechung/baender';
import { FilterSheet } from '../components/rechtsprechung/FilterSheet';
import type { BrowseEntscheid, RichterRegister } from '../lib/rechtsprechung/register';
import type { Rechtsgebiet } from '../lib/normtext/register';
import { useSucheAusUrl } from '../components/suche/useSucheAusUrl';
import { STARTSEITE_ZAEHLER } from '../data/startseiteZaehler.generated';

/** Zahl der Ausgabe-Zeile in Schweizer Schreibweise (1'338). */
const nf = (n: number) => n.toLocaleString('de-CH');


// Übersicht der Rubrik «Rechtsprechung» — kuratierter Einstieg (Sachgebiets-Rail,
// Leitentscheide-first, Norm-Verzahnung), bessere Übersicht als eine flache
// Trefferliste. Reine Darstellung (§3): Laden/Sortieren/Filtern/Gruppieren liegen
// in lib/rechtsprechung/browse.ts.
//
// Wo welcher Zustand liegt — Inhalt (Treffermenge) in der URL, Darstellung
// (Liste/Karten, Sortierung, Klappe) in localStorage — steht mitsamt Begründung
// an EINER Stelle: components/rechtsprechung/zustand.ts. Diese Seite wendet die
// Weiche nur an; neue Filter kommen dort in die Tabelle URL_ACHSEN und sind
// damit automatisch teilbar und neuladefest.

// DOM-Deckel (BS-Tranche §7.1, axe-Timeout-Lektion): mit ~3'800 BS-Einträgen
// wüchse eine ungefilterte Sektion sonst auf Tausende DOM-Knoten. Es werden je
// Liste max. LISTE_DECKEL Einträge GERENDERT («Weitere anzeigen» lädt +Deckel);
// die Facetten-/Sektions-Zähler bleiben über den Gesamtbestand (R15) — reine
// Render-Begrenzung, keine Daten-/Zählerspaltung. Die Register-Liste ist kein
// Normtext (§15.1 unberührt); jeder Entscheid bleibt als Datei vollständig.
const LISTE_DECKEL = 100;

// Harte Obergrenze der GERENDERTEN Zeilen je Liste (Gegenprüfungs-Befund B2).
// Sie begrenzt, was ein wiederhergestelltes Fenster aufziehen darf; im Betrieb
// wächst das Fenster ohnehin nur batchweise auf Klick. 20 Batches sind weit
// jenseits dessen, was jemand durchblättert, und halten das DOM trotzdem in der
// Grössenordnung, in der axe und die Scroll-Restauration gemessen wurden.
const FENSTER_MAX = LISTE_DECKEL * 20;

// Werkbank K3 (23.9.2026, Board «Unter-Rechtsprechung-Register»): «Weitere/
// Frühere anzeigen» als Haarlinien-Knopf; Hover = Linie + Tinte, ohne Messing-Fläche.
const MEHR_KNOPF = 'mx-auto flex w-fit px-3 text-xs text-ink-600 hover:border-line-strong hover:bg-transparent hover:text-ink-900';

// Eine Treffer-Liste je Dichte rendern (geteilte Datenquelle, nur Darstellung).
//
// `speicherKey` identifiziert DIESE Liste innerhalb der Seite (jede Sektion hat
// ihr eigenes Fenster). `mitSprungleiste` schaltet die Band-/Jahr-Leiste zu —
// nur der EINE Strom bekommt sie, nicht die Sektions-Ansicht (dort ordnet
// bereits die Sektion, und dieselbe Jahreszahl käme je Sektion erneut vor).
function Liste({ liste, dichte, onNorm, speicherKey, mitSprungleiste }: {
  liste: BrowseEntscheid[]; dichte: Dichte; onNorm: (k: string) => void;
  speicherKey: string; mitSprungleiste?: boolean;
}) {
  const pk = usePaneKlasse();
  // Fenster aus der Sitzung wiederherstellen — LAZY, also schon im ersten Render
  // (J1-Prüfpunkt: nach «zurück» muss das Dokument sofort wieder so hoch sein,
  // sonst greift die zentrale Scroll-Wiederherstellung in App.tsx ins Leere).
  const [fenster, setFenster] = useState<Fenster>(
    () => leseFenster(speicherKey, LISTE_DECKEL, FENSTER_MAX));
  // Bei neuer Datenbasis (Filterwechsel) auf den Anfang zurücksetzen — offizielles
  // «adjust state during render»-Muster (kein Effekt-Flackern, kein Ref im Render).
  // Beim MOUNT greift das nicht (gleiche Referenz) — der wiederhergestellte Wert
  // überlebt die Rückkehr also, ein Filterwechsel setzt ihn zurück.
  const [vorherListe, setVorherListe] = useState(liste);
  if (vorherListe !== liste) { setVorherListe(liste); setFenster({ von: 0, bis: LISTE_DECKEL }); }
  const behalteFenster = (f: Fenster) => { setFenster(f); schreibeFenster(speicherKey, f); };

  const behaelterRef = useRef<HTMLDivElement>(null);
  // Sprungziel als Index in `liste`; wird erst NACH dem Render aufgelöst, damit
  // der Eintrag garantiert im DOM steht (er kann ausserhalb des alten Fensters
  // liegen). Das Ziel selbst liegt in einer REF, nicht im State: es wird im
  // Effekt verbraucht, und ein setState dort löste eine Kaskaden-Renderung aus
  // (react-hooks/set-state-in-effect). Der Zähler ist die Auslöse-Flanke und
  // wird ausschliesslich im Klick-Handler gesetzt. Kein React Compiler (§15.4).
  const sprungRef = useRef<number | null>(null);
  const [sprungTick, setSprungTick] = useState(0);

  const von = Math.min(fenster.von, Math.max(0, liste.length - 1));
  const bis = Math.min(fenster.bis, liste.length);
  const sichtbar = liste.slice(von, bis);
  const mehr = liste.length - bis;      // noch ungerendert UNTERHALB des Fensters
  const frueher = von;                  // noch ungerendert OBERHALB des Fensters

  // Gruppen über die GANZE Liste (nicht nur den sichtbaren Teil): die Leiste soll
  // auch auf Jahre zeigen, die noch nicht geladen sind — der Sprung lädt nach.
  const gruppen = useMemo(
    () => (mitSprungleiste ? zaehleBaender(liste) : []), [mitSprungleiste, liste]);
  const leisteZeigen = gruppen.length > 1 && istChronologisch(gruppen);

  // Nach dem Klick: erst das Fenster verschieben (Render), dann scrollen. Der
  // Effekt läuft nach dem Commit, der Eintrag existiert dann im DOM.
  useEffect(() => {
    const ziel = sprungRef.current;
    if (ziel === null) return;
    if (ziel < von || ziel >= bis) return;   // wartet auf den Render mit neuem Fenster
    sprungRef.current = null;                // Ref-Schreiben im Effekt, kein setState
    // Der Behälter rendert erst ab `von` — der DOM-Index ist entsprechend versetzt.
    const el = behaelterRef.current?.children[ziel - von] as HTMLElement | undefined;
    el?.scrollIntoView({ block: 'start', behavior: 'instant' as ScrollBehavior });
  }, [sprungTick, von, bis]);

  const springe = (g: BandGruppe) => {
    // Das Fenster SPRINGT MIT, statt von 0 bis zum Ziel aufzuwachsen: es beginnt
    // an der Batch-Grenze vor dem Ziel und ist genau eine Batch-Breite hoch.
    // Damit rendert ein Sprung auf den ältesten Jahrgang gleich viele Zeilen wie
    // einer auf den jüngsten — unabhängig von der Länge der Liste (B2).
    sprungRef.current = g.ersterIndex;
    const neuVon = Math.floor(g.ersterIndex / LISTE_DECKEL) * LISTE_DECKEL;
    if (g.ersterIndex < von || g.ersterIndex >= bis) {
      behalteFenster({ von: neuVon, bis: neuVon + LISTE_DECKEL });
    }
    setSprungTick((t) => t + 1);
  };

  const sprungleiste = leisteZeigen && (
    // Juristen denken in Bänden: die Leiste führt direkt auf den Jahrgang, statt
    // ihn über wiederholtes «Weitere anzeigen» zu erscrollen (J1).
    // K3: Text-Schalter statt Kästen (D22), Zahl in Tinte.
    <nav aria-label="Nach Jahrgang springen"
      className="mb-3 flex flex-wrap items-baseline gap-x-4 gap-y-1">
      <span aria-hidden className="lc-overline shrink-0">Jahrgang</span>
      {gruppen.map((g) => (
        <button key={g.jahr} type="button" onClick={() => springe(g)}
          aria-label={`Zu Jahrgang ${g.label} springen (${g.count})`}
          className="ub-schalter">
          {g.label}{' '}<span className="num ml-1 text-ink-900">{g.count}</span>
        </button>
      ))}
    </nav>
  );

  // Anker nach OBEN — nötig, seit das Fenster mitspringt: sonst wäre der Teil
  // der Liste über dem Fenster nur über die Sprungleiste erreichbar, und in der
  // Sektions-Ansicht (ohne Leiste) gar nicht. Zeigt ehrlich, wie viele Einträge
  // oberhalb stehen (§8 — kein stiller Listenanfang mitten im Bestand).
  const frueherKnopf = frueher > 0 && (
    <button type="button"
      onClick={() => behalteFenster({ von: Math.max(0, von - LISTE_DECKEL), bis })}
      className={`lc-btn-mini ${MEHR_KNOPF} mb-3`}>
      Frühere anzeigen (<span className="num">{frueher}</span> darüber)
    </button>
  );

  const mehrKnopf = mehr > 0 && (
    <button type="button"
      // Wächst das Fenster über die harte Grenze, rückt die Oberkante mit —
      // das DOM bleibt gedeckelt, und «Frühere anzeigen» führt zurück.
      onClick={() => {
        const neuBis = bis + LISTE_DECKEL;
        const neuVon = Math.max(von, neuBis - FENSTER_MAX);
        behalteFenster({ von: neuVon, bis: neuBis });
      }}
      className={`lc-btn-mini ${MEHR_KNOPF} mt-3`}>
      Weitere anzeigen (<span className="num">{mehr}</span> weitere)
    </button>
  );
  if (dichte === 'karten') {
    return (
      <div>
        {sprungleiste}
        {frueherKnopf}
        {/* C-1 (Design-Konsistenz, 31.8.2026): das Raster hing als einzige
            Karten-Fläche der App noch am VIEWPORT (`xl:grid-cols-2`) statt an
            der eigenen Breite. Im Split-View war der Effekt sichtbar falsch
            herum: eine schmale Pane auf einem breiten Bildschirm bekam zwei
            Spalten, eine breite Pane auf einem schmalen Gerät keine. `pk()`
            wählt zwischen Viewport- und Container-Query-Stufen (48:1 die
            hausweite Form). Die Spaltenzahl bleibt bewusst bei ZWEI: die
            Entscheid-Karte trägt Regeste und Norm-Chips und ist breiter als
            die Erlass-Karte des dreispaltigen `Gitter`-Rezepts — dieselbe
            Klassenkette wäre eine Gleichsetzung zweier verschiedener Inhalte
            (§1), darum bleiben die beiden Raster getrennt. */}
        <div ref={behaelterRef} className={pk('grid grid-cols-1 gap-3 xl:grid-cols-2', 'grid grid-cols-1 gap-3 @3xl/pane:grid-cols-2')}>
          {sichtbar.map((e) => <EntscheidKarte key={e.key} e={e} onNorm={onNorm} />)}
        </div>
        {mehrKnopf}
      </div>
    );
  }
  return (
    <div>
      {sprungleiste}
      {frueherKnopf}
      {/* K3: Kopflinie 2 px Tinte, jede Zeile trägt ihre Haarlinie selbst. */}
      <div ref={behaelterRef} className="border-t-2 border-ink-900">
        {sichtbar.map((e) => <EntscheidZeile key={e.key} e={e} onNorm={onNorm} />)}
      </div>
      {mehrKnopf}
    </div>
  );
}

function Sektion({ titel, liste, dichte, onNorm, speicherKey }: {
  titel: string; liste: BrowseEntscheid[]; dichte: Dichte; onNorm: (k: string) => void;
  speicherKey: string;
}) {
  if (!liste.length) return null;
  return (
    <section className="space-y-3">
      <GruppenKopf stufe={2} titel={titel} zahl={liste.length} />
      <Liste liste={liste} dichte={dichte} onNorm={onNorm} speicherKey={speicherKey} />
    </section>
  );
}

export function Rechtsprechung() {
  // Split-View B-1: im Pane reagiert das 2-Spalten-Layout auf die PANE-Breite
  // (@3xl/pane) statt auf den Viewport; ausserhalb byte-gleich (lg:).
  const pk = usePaneKlasse();
  const [alle, setAlle] = useState<BrowseEntscheid[] | null>(null);
  // Richter-Register (Slug → Name) — eigene, kleine Projektion neben dem Manifest.
  // Nur für Labels; Filtern/Zählen laufen über die Slugs im Manifest. Bleibt es
  // null, zeigt die Facette ehrlich den Slug statt eines geratenen Namens (§8).
  const [richterRegister, setRichterRegister] = useState<RichterRegister | null>(null);
  const [fehler, setFehler] = useState(false);
  const [params, setParams] = useSearchParams();
  // Der Suchbegriff steht seit UI-NAV S1 EBENFALLS in der Adresse (`?q=`), aber
  // über einen eigenen, ENTPRELLTEN Weg: ein Facetten-Klick ist ein Ereignis, ein
  // getippter Begriff sind zehn — jede Taste sofort in die URL zu schreiben wäre
  // ein anderes Problem als der Klick (s. zustand.ts). Darum bleibt `q` aus
  // URL_ACHSEN/`achsenDiff` heraus und läuft über useSucheAusUrl.
  const [suchQ, setSuchQ] = useSucheAusUrl({ spiegeln: true });
  // Der übrige lokale Rest (heute leer — alle anderen Filter liegen in der URL).
  const [rest, setRest] = useState<EntscheidFilterWerte>({});
  const [sort, setSortState] = useState<SortModus>(leseSort);
  const [dichte, setDichte] = useState<Dichte>(leseDichte);
  const [klappeOffen, setKlappeOffen] = useState<boolean>(leseKlappe);

  // Alle Inhalts-Achsen aus der Adresse — die Adresse ist die Wahrheit über das,
  // was gefiltert wird (LM-206: nach dem Neuladen dieselbe Treffermenge).
  const urlWerte = useMemo(() => leseFilterAusUrl(params), [params]);
  const sachgebiet = urlWerte.sachgebiet ?? null;
  const norm = urlWerte.norm ?? null;

  // Immer GEMEINSAM schreiben: zwei getrennte Schreibvorgänge im selben Handler
  // bauen beide auf demselben — im laufenden Render bereits veralteten — `params`
  // auf (Begründung und Fundstelle in zustand.ts/wendeAchsenAn).
  // Funktionale Form: baut auf dem AKTUELLEN Stand der Adresse auf. Seit S1
  // schreibt auch die entprellte `?q=`-Spiegelung — ein Facetten-Klick, der auf
  // dem beim Render eingefangenen `params` aufbaut, nähme sie sonst zurück.
  const setzeUrlAchsen = (achsen: Partial<Record<UrlAchse, string | null>>) => {
    setParams((vorher) => wendeAchsenAn(vorher, achsen), { replace: true });
  };
  const setzeUrl = (schluessel: UrlAchse, wert: string | null) => setzeUrlAchsen({ [schluessel]: wert });
  // Darstellungs-Zustände: State + localStorage im Gleichschritt (drei gleiche
  // Fälle, ein Muster).
  const setzeDichte = (d: Dichte) => { setDichte(d); schreibeDichte(d); };
  const setzeSort = (s: SortModus) => { setSortState(s); schreibeSort(s); };
  const setzeKlappe = (offen: boolean) => { setKlappeOffen(offen); schreibeKlappe(offen); };

  useEffect(() => {
    let lebt = true;
    ladeEntscheidManifest().then((m) => {
      if (!lebt) return;
      if (!m) { setFehler(true); return; }
      setAlle(m.entscheide);
    });
    // Parallel, nicht verkettet: das Register blockiert die Liste nie (§15.3).
    ladeRichterRegister().then((r) => { if (lebt) setRichterRegister(r); });
    return () => { lebt = false; };
  }, []);

  // URL-Achsen + lokaler Rest + Suchbegriff zusammenführen. `q` zuletzt: das
  // Feld ist die Wahrheit über den Begriff, die Adresse folgt ihm entprellt
  // (sonst überschriebe der nachhängende URL-Stand die eben getippten Zeichen).
  const werte: EntscheidFilterWerte = useMemo(
    () => ({ ...rest, ...urlWerte, q: suchQ }), [rest, urlWerte, suchQ]);

  // Rail-Zähler über den vollen Bestand minus Sachgebiet (sonst zeigt die nicht
  // gewählte Kachel «0»); restliche Filter (Suche/Norm/…) dürfen die Zähler aber
  // einschränken, darum ohne sachgebiet.
  const fuerRail = useMemo(
    () => (alle ? filterEntscheide(alle, { ...werte, sachgebiet: null }) : []),
    [alle, werte],
  );
  const railZaehler = useMemo(() => zaehleSachgebiete(fuerRail), [fuerRail]);
  // «Alle Sachgebiete» = Summe der Kacheln: Verweis-Einträge (vollständige Urteile zu
  // einem BGE) ausschliessen, symmetrisch zu zaehleSachgebiete/echtAnzahl — sonst zeigt
  // der Aggregat-Zähler einen Wert ≠ Summe seiner Teile (Doppelzählung der BGE).
  const railGesamt = useMemo(() => fuerRail.filter((e) => !e.verweis).length, [fuerRail]);

  const gefiltert = useMemo(
    () => (alle ? sortiere(filterEntscheide(alle, werte), sort) : []),
    [alle, werte, sort],
  );
  const leitAnzahl = useMemo(() => gefiltert.filter((e) => !e.verweis && e.leitcharakter === 'leitentscheid').length, [gefiltert]);
  // Verweis-Einträge (vollständige Urteile) zählen nicht als eigenständige Entscheide.
  const echtAnzahl = useMemo(() => gefiltert.filter((e) => !e.verweis).length, [gefiltert]);
  const volltextAnzahl = useMemo(() => gefiltert.filter((e) => !!e.verweis).length, [gefiltert]);

  // Zwei Sektionen (Leitentscheide / Weitere) nur im Default-Sort ohne aktive
  // Suche/Norm — sonst EIN sortierter Strom (Leit oben via Sortierung).
  const alsSektionen = sort === 'relevanz' && !werte.q?.trim() && !norm;
  const gruppen = useMemo(() => gruppiereNachLeit(gefiltert), [gefiltert]);

  const onFilter = (w: EntscheidFilterWerte) => {
    // Jeder Inhalts-Filter geht in die URL, der Rest bleibt lokal — die Aufteilung
    // steht in zustand.ts und nicht hier, damit sie beim nächsten Filter nicht
    // vergessen wird (genau so entstand die Asymmetrie aus LM-200/203/206).
    const achsen = achsenDiff(w, params);
    if (Object.keys(achsen).length > 0) setzeUrlAchsen(achsen);
    const { q: neuQ, ...uebrig } = lokaleWerte(w);
    setSuchQ(neuQ ?? '');
    setRest(uebrig);
  };
  const waehleSachgebiet = (g: Rechtsgebiet | null) => setzeUrl('rg', g);
  const waehleNorm = (k: string) => setzeUrl('norm', k);

  // Identität einer Liste für den Sitzungs-Deckel (J1): Filterzustand + Rolle der
  // Liste auf der Seite. Der Filterzustand MUSS mit hinein — sonst erbte eine
  // über einen geteilten Link frisch geöffnete, ganz andere Treffermenge den
  // Deckel der zuvor besuchten. Innerhalb derselben Adresse ist der Schlüssel
  // stabil, und genau das trägt den Rückweg Treffer → Detail → zurück.
  // `sort` MUSS mit hinein (Gegenprüfungs-Befund B4): die Sortierung liegt in
  // localStorage, nicht in der Adresse — ohne sie im Schlüssel erbte eine nach
  // «Älteste zuerst» sortierte Liste das Fenster der Datums-absteigenden, und
  // nach einem Neuladen stünde der Nutzer an einer Stelle, die er in DIESER
  // Ordnung nie besucht hat. Die Dichte gehört NICHT hinein: sie ändert die
  // Darstellung der Einträge, nicht deren Reihenfolge oder Zahl.
  const deckelBasis = `${params.toString()}|${sort}`;
  const deckelKey = (rolle: string) => `${deckelBasis}|${rolle}`;

  return (
    <div className="space-y-6">
      {/* D11/D22 (David 6.9.2026) — Kopf-Regel für ALLE fünf Übersichten,
          Herleitung in `components/layout/SeitenKopf.tsx`: H1 = Bereichsname
          wie im Reiter, DARUNTER die Ausgabe-Zeile aus dem Register — keine
          Overline, keine halbe Haarlinie, kein Erklär-Absatz. */}
      <SeitenKopf
        titel="Rechtsprechung"
        ausgabe={`${nf(STARTSEITE_ZAEHLER.rechtsprechungVolltext)} Entscheide des Bundesgerichts und kantonaler Gerichte im Volltext`}
      />

      {fehler && (
        <div className="lc-notice lc-notice-warn">
          Die Rechtsprechungs-Sammlung konnte nicht geladen werden. Bitte die Seite neu laden.
        </div>
      )}

      {/* ── D21-NEBENFUND (David 6.9.2026): «Fusszeile flackert beim Routenwechsel» ──
          GEMESSEN 6.9.2026 @1440, gebautes dist/, Chromium mit 400 kbit/s + 150 ms
          Latenz (Nullprobe 3×, Weg /gesetze → /rechtsprechung per Sidebar-Klick):
            t≈2.8 s  Suspense-Fallback  → Dokumenthöhe 1524, Fuss bei y=1189 (unter der Falz)
            t≈3.2 s  DIESER Ladezustand → Dokumenthöhe  900, Fuss bei y= 564 (IM Bild)
            t≈5.4 s  Daten da           → Dokumenthöhe 27208
          Der einzige gezählte Layout-Shift war `<footer>` von y=564 nach unten,
          CLS 0.307. Über eine schnelle Leitung ist dasselbe Fenster ~100 ms lang —
          genau das «Flackern», das David gesehen hat. Auf «/» → /rechner trat es
          nicht auf: dort lädt die Seite keine zweite Datei nach.
          URSACHE: `RouteHuelle` reserviert die Routenhöhe NUR bis zum Auflösen des
          lazy-Chunks. Danach hängt die Seite an ihrem eigenen `register.json`
          (Fetch in der useEffect oben) und rendert bis dahin diesen ~200 px hohen
          Block — die Inhaltsspalte fällt unter die Fensterhöhe, der Fuss rutscht
          ins Bild und beim Eintreffen der Daten wieder hinaus.
          FIX: der Ladezustand reserviert dieselbe Höhe wie der Fallback der
          Routen-Hülle (`components/layout/RouteHuelle.tsx`, dort die Herleitung,
          warum es im Pane ein fester Block statt 100 vh ist). Nichts wird
          verzögert oder versteckt: es steht dieselbe Anzeige, nur ohne dass der
          Seitenfuss dafür nach oben rückt. */}
      {!alle && !fehler && (
        <div className={`${pk('min-h-screen', 'min-h-[24rem]')} space-y-3 py-12 text-center`}>
          <div className="scale-rule mx-auto max-w-[200px]" aria-hidden />
          <p className="text-body-s text-ink-500">Die Sammlung wird abgerufen …</p>
        </div>
      )}

      {alle && alle.length === 0 && (
        <div className="lc-notice">
          Es sind noch keine Entscheide erfasst. Die Sammlung wird laufend erweitert.
        </div>
      )}

      {alle && alle.length > 0 && (
        <div className={pk('lg:grid lg:grid-cols-[14rem_minmax(0,1fr)] lg:gap-6', '@3xl/pane:grid @3xl/pane:grid-cols-[14rem_minmax(0,1fr)] @3xl/pane:gap-6')}>
          {/* Links: Sachgebiets-Rail (Mobil oben als Chip-Band). */}
          {/* D22 Ziff. 4: @390 stand die Rail 49 px über der Live-Suche (Budget 48). */}
          <div className={pk('mb-3 lg:mb-0', 'mb-3 @3xl/pane:mb-0')}>
            <SachgebietKacheln
              zaehler={railZaehler}
              gesamt={railGesamt}
              aktiv={sachgebiet}
              onWaehle={waehleSachgebiet}
            />
          </div>

          {/* Rechts: Ergebnis-Spalte. */}
          <div className="min-w-0 space-y-4">
            {/* Discovery über den ganzen CH-Korpus (extern, opt-in) — prominent am
                Kopf der Ergebnis-Spalte (Auftrag David), über der kuratierten Auswahl. */}
            <LiveSuche initialQ={werte.q ?? ''} />

            {/* J2: mobil hinter einem «Filter (n)»-Auslöser im Bottom-Sheet,
                ab lg unverändert inline — damit die Treffer auf 390 px nicht
                erst unter der ganzen Steuerleiste beginnen. */}
            <FilterSheet anzahl={zaehleAktiveFilter(werte)}>
              <EntscheidFilter
                werte={werte}
                onChange={onFilter}
                bestand={alle}
                richterRegister={richterRegister}
                sort={sort}
                onSort={setzeSort}
                dichte={dichte}
                onDichte={setzeDichte}
                klappeOffen={klappeOffen}
                onKlappe={setzeKlappe}
              />
            </FilterSheet>

            {/* Norm-Kontextstreifen — der explizite Pfad «Rechtsprechung zu Art. X». */}
            {norm && (
              <div className="lc-notice flex items-center justify-between gap-3">
                <span className="text-body-s">
                  Rechtsprechung zu <span className="font-medium text-ink-900">{normLabel(norm)}</span>
                  {' '}— <span className="num">{gefiltert.length}</span> {gefiltert.length === 1 ? 'Entscheid' : 'Entscheide'}
                </span>
                <button type="button" onClick={() => setzeUrl('norm', null)}
                  className="shrink-0 text-xs font-medium text-ink-700 underline underline-offset-2 hover:text-ink-900">
                  aufheben
                </button>
              </div>
            )}

            {/* Treffer-Zähler. Die Bund↔Kanton-Trennung (früher ein eigenes Ebene-
                Segment, Auftrag David) liegt jetzt in der «Gemeinwesen»-Facetten-
                Leiste der Filterzeile — eine kohärente Achse statt zweier Controls. */}
            {/* B13/LM-116: die Zeile behält ihre drei Bestandteile und zeigt für
                jeden den Wert der AKTUELLEN Menge — auch die 0. Vorher fielen
                «Leitentscheide» und «Volltext-Verweise» beim Filtern ganz weg:
                die Zeile wurde kürzer, der Inhalt darunter rutschte hoch
                (§15.2), und «0 Leitentscheide in dieser Auswahl» blieb als
                Auskunft ungesagt (§8). Zahlen tausendergruppiert (LM-108). */}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-xs text-ink-500">
              <span><span className="num text-ink-900">{zahlGruppiert(echtAnzahl)}</span> {echtAnzahl === 1 ? 'Entscheid' : 'Entscheide'}</span>
              <span>· <span className="num">{zahlGruppiert(leitAnzahl)}</span> Leitentscheide</span>
              <span>· <span className="num">{zahlGruppiert(volltextAnzahl)}</span> Volltext-Verweise</span>
            </div>

            {gefiltert.length === 0 ? (
              /* W2·19-DESIGN-KONSISTENZ · D-7: EIN Leerzustands-Baustein statt
                 dreier Bauformen. Vorher eine `lc-notice`-Box mit dem Satz
                 «… Filter anpassen oder zurücksetzen.» — der Ausweg stand als
                 Prosa da, aber es gab nichts zu drücken (C1: keine Sackgasse).
                 Jetzt Aussagesatz + echter Knopf; die Sachgebiets-Achse (Rail/
                 URL) bleibt dabei erhalten, exakt wie beim «zurücksetzen» der
                 Filterleiste (§5: EINE Rücksetz-Semantik, nicht zwei). */
              <Leerzustand art="filter" text="Kein Entscheid gefunden."
                weiterweg={{ text: 'Filter zurücksetzen', onKlick: () => onFilter({ sachgebiet: werte.sachgebiet ?? null }) }} />
            ) : alsSektionen ? (
              <div className="space-y-8">
                <Sektion titel="Amtliche Leitentscheide (BGE)" liste={gruppen.leitentscheide} dichte={dichte} onNorm={waehleNorm} speicherKey={deckelKey('leit')} />
                {gruppen.volltexte.length > 0 && (
                  <Sektion titel="Vollständige Urteile zu den Leitentscheiden" liste={gruppen.volltexte} dichte={dichte} onNorm={waehleNorm} speicherKey={deckelKey('volltexte')} />
                )}
                {/* A3-Regel 5: Urteile ausserhalb der amtlichen BGE-Sammlung als eigene
                    Voll-Urteil-Zeilen, GRUPPIERT UNTER IHRER INSTANZ (gerichtstyp). Die
                    «verweis»-Karte bleibt der BGE-Auszug→Volltext-Brücke vorbehalten (oben).
                    Wortlaut «nicht in der amtlichen Sammlung (BGE)» statt «nicht amtlich
                    publiziert» (§8-Fix 19.7.2026): kantonale Portal-Entscheide (BS) SIND
                    amtlich publiziert (Rechtsprechungs-Datenbank der Gerichte BS, Karten-
                    Label «amtlich») — falsch ist nur die Zugehörigkeit zur BGE-Sammlung. */}
                {gruppen.weitere.length > 0 && (
                  <div className="space-y-6">
                    <GruppenKopf stufe={2} zahl={gruppen.weitere.length}
                      titel="Weitere Entscheide — nicht in der amtlichen Sammlung (BGE)" />
                    {gruppiereNachInstanz(gruppen.weitere).map((g) => (
                      <Sektion key={g.typ} titel={g.label} liste={g.liste} dichte={dichte} onNorm={waehleNorm} speicherKey={deckelKey(`instanz:${g.typ}`)} />
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <Liste liste={gefiltert} dichte={dichte} onNorm={waehleNorm} speicherKey={deckelKey('strom')} mitSprungleiste />
            )}

            {/* B2/R1 (QS-UI 8b Teil 2): Der §8-Fuss lief mit 728 px über die
                Lesespalte (41 rem ≙ 656 px, gemessen 1280×800). Gerade die
                Ehrlichkeits-Zeile soll gelesen werden. Trennlinie und Text laufen
                BEIDE in der Lesespalte (border-t sitzt am selben <p> — Bug-Check
                #441 B1: der frühere Kommentar behauptete «volle Spalte»). */}
            <p className="border-t border-rule-soft pt-3 text-micro text-ink-500 max-w-reading">
              Keine Rechtsberatung. «ungeprüft» = maschinell erfasst, fachlich noch nicht abgenommen; massgeblich ist stets die amtliche Fassung (Link je Entscheid).
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
