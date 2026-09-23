import { useEffect, useMemo, useState } from 'react';
import { useSearchParams, useLocation, Link } from 'react-router-dom';
import { useSucheAusUrl } from '../components/suche/useSucheAusUrl';
import { dedupErlasse } from '../lib/universalSuche';
import { SeitenKopf } from '../components/layout/SeitenKopf';
import { STARTSEITE_ZAEHLER } from '../data/startseiteZaehler.generated';
import { InternationalRubriken } from '../components/normtext/InternationalRubriken';
import { RechtsgebietSicht } from '../components/normtext/RechtsgebietSicht';
import {
  GliederungUmschalter, RelevanzGitter, KantonRelevanzListe,
  KantonGebietGruppen, IntlRechtsgebietSicht,
} from '../components/normtext/GesetzeGliederung';
import { loeseGliederung, speichereGliederung, type Gliederung } from '../lib/normtext/gliederung';
import {
  ladeBrowseManifest, ladeKantonSystematik, gruppiereNachKanton, filtern,
} from '../lib/normtext/browse';
import { type BrowseErlass } from '../lib/normtext/browse-typen';
import { type KantonSystematik as KantonSystematikBaum } from '../lib/normtext/systematik';
// Kanton-Vollnamen: EINE Quelle (§5) — dieselbe Tabelle wie die Tarif-Domäne.
// Codes bleiben die SSoT; der Name macht Raster/Sidebar scannbar. Auf string
// verbreitert, da die Übersicht mit rohen Kanton-Codes (string) indexiert.
import { KANTON_NAMEN as KANTON_NAMEN_TYP } from '../data/tarif/typen';
const KANTON_NAMEN: Record<string, string> = KANTON_NAMEN_TYP;
import { KantonWappen } from '../components/KantonWappen';
import { StufeBadge, ErfassungsgradLegende } from '../components/normtext/Erfassungsgrad';
import { erfassungsgrad, STUFE_WORT } from '../lib/normtext/erfassungsgrad';
import { usePaneKlasse } from '../components/layout/PaneKontext';
import { Leerzustand } from '../components/ui/Leerzustand';
import { GruppenKopf } from '../components/ui/GruppenKopf';
import { RubrikKachel } from '../components/ui/RubrikKachel';
import { AMTLICHE_FASSUNG_NOMEN } from '../lib/benennung';
// H-10 (§6.6 billig, B27): BundSystematik/KantonSystematik/KantonAuswahl
// (+Kachel) als reiner Move nach gesetze-teile/ — Props/Verhalten unverändert.
import { Gitter } from './gesetze-teile/geteilt';
import { BundSystematik } from './gesetze-teile/BundSystematik';
import { KantonSystematik } from './gesetze-teile/KantonSystematik';
import { KantonAuswahl } from './gesetze-teile/KantonAuswahl';
// IA-3 (§11.5): A–Z-/Kürzel-Register — Browse-Zwilling zum Norm-Sprung auf dem
// Landeplatz; rechnet auf dem BEREITS geladenen Manifest (kein zweiter Index, K10).
import { AzRegister } from './gesetze-teile/AzRegister';
// J3 (ROADMAP W2·10-UI-NAV, Idee David 16.8.2026, dejure.org-Vorbild): dichte
// Rechtsgebiets-Übersicht als gehaltvoller Default-Inhalt des Landeplatzes —
// SSoT-Details in RechtsgebietUebersicht.tsx.
import { RechtsgebietUebersicht } from './gesetze-teile/RechtsgebietUebersicht';
// IA-4 (§11.5): Scope des lokalen Browse-Filterfelds — Default = aktive Ebene,
// der Chip «auf alle Ebenen erweitern» weitet mit EINEM Klick (O5). Reine
// Teilmengen-Bildung auf dem geladenen Manifest (kein dritter Suchpfad, A5;
// kein zweiter Index, K10). Logik testbar in gesetze-teile/filter-scope.ts.
import { loeseFilterScope, scopeLabel, scopeBasis } from './gesetze-teile/filter-scope';
// IA-5 (§11.4 Ziff. 2): `?ansicht=rechtsgebiet` (alte G6-Tür) ist auflösbarer
// Alias auf den EINEN kanonischen Zustand `?ebene=bund&gliederung=rechtsgebiet`
// (A15-Mechanik) — parse-seitig sofort wirksam, die URL wird per Effect auf die
// kanonische Form gebracht (kein Router-Redirect, Leitplanke E.4).
import { istRechtsgebietAlias, normalisiereAnsicht } from './gesetze-teile/ansicht-alias';
// R12A (D22 Ziff. 5, R12 «Wege verkürzen»): die zehn Kernerlasse als Link-Zeile.
// Ziel-Adresse über die EINE Ableitung (`erlassPfadVonKey`, §5), Kürzel und
// Existenz aus dem Register — keine zweite Erlass-Liste im Code.
import { kernerlasse } from '../components/gesetze/kernerlasse';

/** Zahlen der Ausgabe-Zeile in Schweizer Schreibweise (1'338) — dieselbe
 *  Ein-Zeilen-Form, die die Startseiten-Bausteine seit W2·23 führen. */
const nf = (n: number) => n.toLocaleString('de-CH');


type Ebene = 'bund' | 'kanton' | 'international';

// ─── D22 (David 6.9.2026) · DIE EBENE IST EINE FACETTE, KEIN KASTEN ──────────
//
// Hier stand die Segmented-Control aus `ui/Tabs` — eine Leiste mit Rahmen,
// Radius, Fläche und Schatten am aktiven Reiter, die nur nach Säulen-Wahl
// erschien und daneben einen zweiten Knopf «← Übersicht» brauchte, um wieder
// herauszukommen. Zwei Bedienelemente für EINE Achse, beide als Kästen.
// Neu: vier Text-Schalter (`.ub-schalter`) unter dem Filterfeld — «Alle» ist
// der Landeplatz, die drei anderen die Säulen. Der Zustand steht als
// Unterstrich in der Registerfarbe, nicht als Kasten.
//
// `aria-pressed` statt `role=tab`: die Schalter sind IMMER sichtbar, das
// zugehörige Panel rendert aber nur nach einer Wahl. Ein `role=tab` mit
// `aria-controls` auf eine dann fehlende `id` wäre ein gebrochenes
// ARIA-Versprechen (§8) — gedrückte Schalter sagen dasselbe ohne die Zusage.
// `ui/Tabs` bleibt unangetastet: die Kasten-Anatomie ist dort für Reiter
// richtig; hier wird gefiltert, nicht geblättert.
function EbenenSchalter({ aktiv, onWahl, onAlle }: {
  aktiv: Ebene | null; onWahl: (e: Ebene) => void; onAlle: () => void;
}) {
  const opt: { id: Ebene | null; label: string }[] = [
    { id: null, label: 'Alle' },
    { id: 'bund', label: 'Bund' },
    { id: 'kanton', label: 'Kantone' },
    { id: 'international', label: 'International' },
  ];
  return (
    <div role="group" aria-label="Ebene" className="flex flex-wrap items-baseline gap-x-5 gap-y-1 print:hidden">
      {opt.map((o) => (
        <button key={o.id ?? 'alle'} type="button" className="ub-schalter"
          aria-pressed={aktiv === o.id}
          onClick={() => (o.id === null ? onAlle() : onWahl(o.id))}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

// D6 (W2·24-Funktions-Inventar, Befund 6./7.9.2026): bei aktivem Filter blieb
// die Zeile stehen und stand ÜBER den echten Treffern (§1: kein Rechtsschluss,
// reine Bedienreihenfolge — Treffer zuerst). `aktiv=false` blendet sie darum
// per `visibility:hidden` (+ `aria-hidden`) aus, statt sie zu unmounten: die
// erste Fassung (bedingtes Rendering) schob den `min-h-inhalt-region`-Block
// darunter um die Zeilenhöhe nach oben — ein ECHTER, unter CPU-Drossel 6×
// gemessener Layout-Shift (0.0198, Quelle `DIV.min-h-inhalt-region`, Rot-Probe
// 7.9.2026 in `gesetze-footer-cls.e2e.ts`). `visibility:hidden` reserviert die
// Zeilenhöhe unverändert (kein Element darunter bewegt sich, D9), entfernt die
// Links aber aus Fokus-Reihenfolge und Screenreader-Baum — dasselbe Muster wie
// `html[data-lr6-anker-warten] footer` in index.css.
function Kernerlasse({ aktiv }: { aktiv: boolean }) {
  return (
    <div className={`space-y-1.5${aktiv ? '' : ' invisible'}`} aria-hidden={!aktiv}>
      <p className="lc-overline">Kernerlasse</p>
      <ul className="ub-kern">
        {kernerlasse().map((e) => (
          <li key={e.key}>
            <Link to={e.pfad} title={e.titel} tabIndex={aktiv ? undefined : -1}>{e.kuerzel}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

// Neutraler Landeplatz /gesetze (G4 · §4.1): prominenter Sprung-/Such-Einstieg
// (fokussiert die normale HeaderSuche, in der der Norm-Sprung sitzt — A5, David
// 5.7.2026, keine eigene Palette mehr) + drei gleichwertige Einstiegskacheln mit
// Kurz-Statistik. Löst die frühere Dreifach-Redundanz (Overline + Tab-Leiste +
// Sidebar) auf: EINE Steuerung, kein stiller Bund-Default. Reine Darstellung (§3).
function Einstieg({ bund, bundArtikel, kantone, kantonErlasse, international, onWahl }: {
  bund: number; bundArtikel: number; kantone: number; kantonErlasse: number; international: number;
  onWahl: (e: Ebene) => void;
}) {
  const pk = usePaneKlasse();
  const kacheln: { id: Ebene; titel: string; zahl: number; einheit: string; sub: string; legende?: boolean }[] = [
    { id: 'bund', titel: 'Bundesrecht', zahl: bund, einheit: 'Erlasse', sub: `Gesetze & Verordnungen · ${bundArtikel.toLocaleString('de-CH')} Artikel im Volltext` },
    { id: 'kanton', titel: 'Kantone', zahl: kantone, einheit: 'Kantone', sub: `${kantonErlasse.toLocaleString('de-CH')} kantonale Erlasse`, legende: true },
    { id: 'international', titel: 'International', zahl: international, einheit: 'Erlasse', sub: 'Staatsverträge & EU-Recht' },
  ];
  return (
    <div className="space-y-6">
      {/* ── D22 Ziff. 3 (David 6.9.2026) · DIE DRITTE SUCHE IST WEG ────────────
          Hier stand ein Kasten (Rahmen + Füllung + Lupe + ⌘K-Kürzel) mit den
          Zeilen «Direkt zum Artikel springen — z. B. «OR 257d»» und «oder
          Stichwort suchen über Gesetze, Rechtsprechung und Werkzeuge». Er war
          das dritte Suchangebot auf derselben Seite (Kopf-Suche, Filterfeld,
          dieser Kasten) und tat selbst nichts: sein Klick fokussierte bloss die
          Kopf-Suche (`lm:suche-fokus`).
          NICHTS GEHT VERLOREN — der Norm-Sprung IST die Kopf-Suche (A5, David
          5.7.2026: keine eigene Palette mehr). Sie steht auf jeder Route, hört
          auf «/» und ⌘K/Ctrl-K und trägt die Sprung-Gruppe als obersten
          Treffer; der Hinweis darauf steht jetzt als Halbsatz an der Filterzeile
          (`gesetze-filter-scope`), nicht als eigener Kasten. Beweis, dass der
          Weg trägt: `e2e/norm-sprung.e2e.ts` («OR 257d» → Art. 257d OR ab
          /gesetze, ohne den Kasten). */}
      <div className={pk('grid grid-cols-1 sm:grid-cols-3 gap-3', 'grid grid-cols-1 @2xl/pane:grid-cols-3 gap-3')}>
        {/* C-5 (31.8.2026): die Kachel-Anatomie liegt in `ui/RubrikKachel`;
            seit W2·29 K1 trägt sie das Register als Fläche (`reg`). */}
        {kacheln.map((k) => (
          <RubrikKachel key={k.id} reg="g" onWahl={() => onWahl(k.id)}
            zahl={k.zahl} einheit={k.einheit} titel={k.titel} nutzen={k.sub}
            /* IA-2 (§11.1): Erfassungsgrad-Kurzlegende auf der Kantone-Kachel. */
            extra={k.legende ? <ErfassungsgradLegende className="mt-0.5" /> : undefined} />
        ))}
      </div>
    </div>
  );
}

export function Gesetze() {
  const [erlasse, setErlasse] = useState<BrowseErlass[] | null>(null);
  // ── §15.2/§8-BEFUND 6.9.2026 (CI-Flake `gesetze-footer-cls`) · «NOCH NICHT
  //    GELADEN» IST NICHT «KEIN BAUM» ────────────────────────────────────────
  // GEMESSEN @1440×900 unter CPU-Drossel 6× auf `/gesetze?ebene=kanton&kt=ZH`:
  // die Zeile «Alle aufklappen» stand erst bei y=828, dann bei y=774 — ein
  // input-freier Sprung um 54 px, weil ÜBER ihr der Hinweis «Die amtliche
  // Systematik dieses Kantons ist noch nicht hinterlegt» erschien und wieder
  // verschwand. Ursache war der Startwert `{}`: bis die Bäume da waren, sah
  // jeder Kanton wie einer OHNE Baum aus. Das ist zweimal falsch — ein
  // Layout-Shift (§15.2) UND eine unwahre Auskunft über den Bestand (§8), die
  // 19 der 26 Kantone für einen Moment traf.
  // `null` = noch nicht geladen, `{}` = geladen und leer. Der Unterschied ist
  // die ganze Korrektur; sie kostet nichts und macht die Aussage ehrlich.
  const [systematik, setSystematik] = useState<Record<string, KantonSystematikBaum> | null>(null);
  const [fehler, setFehler] = useState(false);
  // ?q= (Startseiten-Rubrik «Gesetze» #6, «alle N →» aus der Universal-Suche
  // UI-NAV S1) füllt die Suche vor. Über useSucheAusUrl statt Lazy-Init: der
  // Lazy-Init griff nur beim MOUNT — stand man bereits auf /gesetze, kam die
  // Query des Header-Sprungs nie im Feld an (SPA-Navigation ohne Remount).
  const [suche, setSuche] = useSucheAusUrl();
  // IA-4 (§11.5, verallgemeinert N6): der Filter-Scope folgt der aktiven Ebene
  // (Säule bzw. gewählter Kanton — auf der BS-Seite erwartet man BS-Treffer,
  // nicht Bund + alle 25 anderen Kantone). Der Chip «auf alle Ebenen erweitern»
  // am Feld weitet mit EINEM Klick; client-only State, kein neuer Index (K10).
  const [alleEbenen, setAlleEbenen] = useState(false);
  // Karte/Liste der Kantons-Übersicht (§4.3.3). Der Zustand liegt HIER und nicht
  // mehr in KantonAuswahl: die Übersicht unmountet, sobald ein Kanton gewählt
  // ist, und nahm die Wahl bisher mit ins Grab — wer über die Liste einstieg,
  // landete auf dem Rückweg «← Alle Kantone» wieder auf der Karte
  // (Fehlerbuch-Befund 41 «Umschalter weg nach Wahl», reproduziert 29.8.2026:
  // Liste gewählt → Kanton → zurück → `Karte aria-pressed=true`). Client-only,
  // nicht in der URL — es ist eine Vorliebe, kein teilbarer Ort (§4.3.3).
  const [kantonsAnsicht, setKantonsAnsicht] = useState<'karte' | 'liste'>('karte');

  // Ebene (Bund/Kantone) UND der gewählte Kanton liegen in der URL (?ebene= / ?kt=)
  // — so verlinkt die App-Shell-Seitenleiste direkt auf den Kantone-Tab bzw. einen
  // einzelnen Kanton (?kt=ZH); teilbar und mit Zurück-Taste, wie der Katalog.
  const [params, setParams] = useSearchParams();
  // #sys-<id> (Sidebar-Deeplink auf eine Bund-Kategorie) → öffnet sie in der
  // Systematik; key= an BundSystematik mountet bei Hash-Wechsel frisch.
  const { hash } = useLocation();
  const hashSys = hash.startsWith('#sys-') ? hash.slice(5) : null;
  // Einstiegs-Auflösung (G4 · §4.1): OHNE explizites ?ebene= landet man NICHT
  // still auf «Bund», sondern auf dem neutralen Landeplatz (drei Einstiegskacheln).
  // Eine Säule ist erst gewählt, wenn ?ebene= gesetzt ist (Deep-Links bleiben
  // erreichbar). `ebene` (Fallback 'bund') trägt nur die abgeleiteten Listen.
  // IA-5 (§11.4 Ziff. 2): der Alias wird schon beim Parse aufgelöst (kein
  // Flash der falschen Sicht); der Effect unten schreibt die kanonische URL.
  const ansichtAlias = istRechtsgebietAlias(params);
  const ebeneParam = params.get('ebene');
  // Cowork-Befund 39 (18.8.2026): `?ebene=kantone` (Plural) fiel still auf die
  // Standard-Übersicht zurück statt die Kanton-Säule zu zeigen — toleranter
  // Alias, kein neuer kanonischer Wert (der bleibt Singular `kanton`).
  const gewaehlt: Ebene | null = ansichtAlias ? 'bund'
    : ebeneParam === 'kanton' || ebeneParam === 'kantone' ? 'kanton'
    : ebeneParam === 'international' ? 'international'
    : ebeneParam === 'bund' ? 'bund' : null;
  const ebene: Ebene = gewaehlt ?? 'bund';
  const kanton = gewaehlt === 'kanton' ? params.get('kt') : null;
  // IA-4: wirksamer Scope des lokalen Filterfelds (Default = aktive Ebene;
  // Landeplatz = alle Ebenen; Chip weitet).
  const filterScope = loeseFilterScope(gewaehlt, kanton, alleEbenen);
  // Gliederung (A15): EINE Wahl für alle drei Säulen (Relevanz/Systematisch/
  // Rechtsgebiet). URL `?gliederung=` gewinnt (teilbarer Deep-Link), sonst die
  // persistente Wahl (localStorage), sonst Default 'systematisch' — das hält die
  // prerenderte Sicht + bestehende e2e-/Golden-Kontrakte byte-gleich. Die
  // Store-Lesung ist synchron (Pre-Paint-Muster, §15/G2a): kein Flash, weil der
  // Inhalt ohnehin erst nach dem async Manifest paintet. Der IA-5-Alias gewinnt
  // (die alte Tür WAR die Rechtsgebiets-Sicht) und wird nicht persistiert
  // (Deep-Link-Semantik, wie `?gliederung=`).
  const gliederung: Gliederung = ansichtAlias ? 'rechtsgebiet' : loeseGliederung(params.get('gliederung'));
  // URL-Normalisierung Alt → kanonisch (IA-5): idempotent, feuert nur solange
  // `?ansicht=rechtsgebiet` in der URL steht — danach nie wieder (kein Loop).
  useEffect(() => {
    const n = normalisiereAnsicht(params);
    if (n) setParams(n, { replace: true });
  }, [params, setParams]);
  const setzeGliederung = (g: Gliederung) => {
    const p = new URLSearchParams(params);
    p.set('gliederung', g);
    setParams(p, { replace: true });
    speichereGliederung(g);
  };
  const setzeEbene = (e: Ebene) => {
    const p = new URLSearchParams(params);
    p.set('ebene', e);
    p.delete('kt');
    p.delete('ansicht');
    setParams(p, { replace: true });
  };
  const zurUebersicht = () => {
    const p = new URLSearchParams(params);
    p.delete('ebene');
    p.delete('kt');
    p.delete('ansicht');
    setParams(p, { replace: true });
  };
  const setzeKanton = (k: string | null) => {
    const p = new URLSearchParams(params);
    if (k) p.set('kt', k); else p.delete('kt');
    setParams(p, { replace: true });
  };

  useEffect(() => {
    let lebt = true;
    ladeBrowseManifest().then((m) => {
      if (!lebt) return;
      if (!m) { setFehler(true); return; }
      // ALLE Erlasse halten — die International-Erlasse (SR 0.* + EU-Recht,
      // rechtsgebiet 'international') gehören jetzt in den eigenen International-Tab
      // der Übersicht (Auftrag David 25.6.2026: International gleichwertig hier
      // abdecken). Die Bund-Ansicht blendet sie weiter aus (istIntl-Filter unten).
      setErlasse(m.erlasse);
    });
    // Systematik-Bäume parallel; fehlen sie, greift der neutrale Fallback (§8).
    ladeKantonSystematik().then((s) => { if (lebt) setSystematik(s); });
    return () => { lebt = false; };
  }, []);

  const istIntl = (e: BrowseErlass) => e.rechtsgebiet === 'international';
  // Bund-Ansicht: nur echte Bundeserlasse (International sind ebene 'bund', aber
  // rechtsgebiet 'international' → hier ausgeschlossen, sie haben den eigenen Tab).
  const gefiltert = useMemo(
    () => (erlasse ? filtern(erlasse.filter((e) => e.ebene === 'bund' && !istIntl(e)), suche) : []),
    [erlasse, suche],
  );
  const international = useMemo(
    () => (erlasse ? erlasse.filter(istIntl) : []),
    [erlasse],
  );
  const kantone = useMemo(
    () => (erlasse ? [...new Set(erlasse.filter((e) => e.ebene === 'kanton').map((e) => e.kanton!))].sort() : []),
    [erlasse],
  );
  // IA-2 (§11.2): erfasste Erlass-Zahl je Kanton (Gesamtkorpus, such-unabhängig) —
  // trägt Schnellwechsel-Pill-Badge + Erfassungs-Kopf. Eine Ableitung (§3), kein
  // «if kanton===» und keine hartkodierte Menge (§11.0-Invariante).
  const kantonAnzahl = useMemo(() => {
    const m = new Map<string, number>();
    if (erlasse) for (const e of erlasse) if (e.ebene === 'kanton' && e.kanton) m.set(e.kanton, (m.get(e.kanton) ?? 0) + 1);
    return m;
  }, [erlasse]);
  // Kanton-Ansicht: nur kantonale Erlasse (sonst zeigte der Kanton-Zweig das
  // Bund-only `gefiltert` → leeres Raster, keine Kantone). Suche mitgeführt.
  const kantGefiltert = useMemo(
    () => (erlasse ? filtern(erlasse.filter((e) => e.ebene === 'kanton'), suche) : []),
    [erlasse, suche],
  );

  return (
    <div className="space-y-6">
      {/* D22 Ziff. 4 · DIE ABSTÄNDE DER ÜBERSICHT SIND GEDECKELT.
          Gemessen (Playwright, Preview, 6.9.2026, @1440/@1160/@1024/@390):
          die grösste senkrechte Leerfläche zwischen zwei Inhaltsblöcken lag
          auf den fünf Übersichten bei 64/49/57/74/56 px. Das Budget ist
          48 px — der Seitenrhythmus geht darum von `space-y-8` (32) auf
          `space-y-6` (24). Nur Abstand, kein Inhalt, keine Reihenfolge. */}
      {/* ── D11 (David 6.9.2026, Bild /gesetze) · DER KOPF NENNT DEN BEREICH ──
          Bis hierher standen drei Angaben übereinander: eine Overline
          («Rechtssammlung Schweiz»), eine H1, die dasselbe noch einmal sagte
          («Schweizer Gesetzessammlung»), und ein Erklär-Absatz, der die Seite
          beschrieb, statt sie zu zeigen. Neu trägt die H1 den BEREICHSNAMEN —
          dasselbe Wort, das der Reiter und die Navigation führen (§5: eine
          Sache heisst überall gleich) —, und darüber steht EINE Ausgabe-Zeile
          mit den Zahlen aus dem Register. Der §8-Vorbehalt («massgeblich ist
          die amtliche Fassung») steht im Seitenfuss, wo er den Einstieg nicht
          mehr zustellt.
          KEINE ZAHL OHNE DECKUNG: das Datum des jüngsten Inhalts (D8) hat im
          generierten Zähler noch kein Feld — die Zeile führt darum nur, was
          gezählt ist, und nicht «jüngster Stand …» (§8). */}
      <SeitenKopf
        titel="Gesetze"
        ausgabe={`${nf(STARTSEITE_ZAEHLER.gesetzeBundVolltext)} Bundeserlasse · ${nf(STARTSEITE_ZAEHLER.gesetzeKantonVolltext)} Kantonserlasse · ${nf(STARTSEITE_ZAEHLER.gesetzeInternationalVolltext)} Staatsverträge im Volltext`}
      />

      {/* ── D22 Ziff. 2 · EIN FILTERFELD, VOLLE BREITE, MIT LABEL ─────────────
          Das Feld sass in einer `justify-between`-Zeile rechts (`max-w-sm`) und
          liess links 60 % der Zeile leer — die Lücke, die David gesehen hat.
          Neu: Label über Feld (`.ub-filter`, Anatomie des Referenzbilds), Feld
          über die volle Inhaltsbreite, Facetten als Text-Schalter darunter.
          DAS FELD STEHT JETZT IMMER — auch während das Manifest lädt. Es
          braucht die Daten nicht (es hält nur den Suchbegriff), und wer es erst
          nach dem Laden einsetzt, schiebt beim Eintreffen des Manifests den
          halben Seiteninhalt (§15.2). Der reservierte Inhaltsbereich darunter
          bleibt unverändert.
          Der sichtbare Text IST der zugängliche Name (WCAG 2.5.3): das frühere
          `aria-label` («Gesetze durchsuchen …») sagte etwas anderes als das,
          was auf dem Bild steht; der Umfang steht in der Fuss-Zeile und ist
          über `aria-describedby` verknüpft. */}
      <div className="ub-filter">
        <label htmlFor="gesetze-filter" className="lc-overline">Filtern</label>
        <input
          id="gesetze-filter"
          type="search"
          value={suche}
          onChange={(e) => setSuche(e.target.value)}
          placeholder="Kürzel, Titel, SR-Nr. …"
          aria-describedby="gesetze-filter-scope"
          className="lc-input h-11 py-0 text-body-s w-full"
        />
        <p id="gesetze-filter-scope" className="ub-filter-fuss min-h-5">
          <span>{scopeLabel(filterScope, (k) => KANTON_NAMEN[k] ?? k)}</span>
          {/* Chip nur, wo ein enger Default-Scope existiert (aktive Säule/
              Kanton) — auf dem Landeplatz ist «alle Ebenen» bereits der Scope.
              Als Text-Schalter, nicht mehr als Chip mit Rahmen (D22). */}
          {gewaehlt !== null && (
            <button type="button" aria-pressed={alleEbenen} className="ub-schalter"
              onClick={() => setAlleEbenen((a) => !a)}>
              auf alle Ebenen erweitern
            </button>
          )}
          {/* G9 (Gesamtprüfung 6.9.2026): der Satz «Artikel-Sprung über die
              Suche oben (⌘K)» ist gestrichen — ein Erklärtext über ein
              Bedienelement, das sichtbar zwei Zeilen darüber steht und seinen
              Kürzel-Hinweis selbst führt (D11). Die Scope-Zeile daneben
              BLEIBT: sie ist die `aria-describedby`-Beschreibung des Feldes
              (WCAG) und ändert sich mit dem Filter — eine Auskunft, keine
              Erklärung. */}
        </p>
        <div className="mt-1">
          <EbenenSchalter aktiv={gewaehlt} onWahl={setzeEbene} onAlle={zurUebersicht} />
        </div>
      </div>

      {/* D22 Ziff. 5 / R12: Kernerlasse direkt unter dem Filter — ein Klick.
          D6 (Befund 6./7.9.2026): bei aktivem Filterbegriff blendet die Zeile
          aus (Treffer zuerst, kein Rechtsschluss — §1) — nicht bei blosser
          Ebenen-Wahl ohne Suchtext. `aktiv`-Steuerung samt D9-Begründung
          (reservierte Höhe, kein Layout-Sprung) direkt bei `Kernerlasse`. */}
      <Kernerlasse aktiv={!suche.trim()} />

      {/* B2 (Bug-Check #565): auch der Fehlerpfad reserviert die Inhaltshöhe —
          sonst kollabiert die Fläche auf die Notice und der Footer springt
          (gemessen 0.195 CLS bei abgebrochenem Manifest-Abruf). */}
      {fehler && (
        <div className="lc-notice lc-notice-warn min-h-inhalt-region">
          Die Gesetzessammlung konnte nicht geladen werden. Bitte die Seite neu laden.
        </div>
      )}

      {!erlasse && !fehler && (
        /* Lade-CLS der Übersicht (W2·15-CLS, §15.2): DERSELBE Höhen-Token
           `inhalt-region` wie am geladenen Inhalt unten — der Platzhalter ist
           die PRERENDERTE Fassung dieser Fläche (dist/gesetze.html trägt genau
           diesen Zweig), und ohne Reservierung sass der Footer beim ersten Paint
           im Fold und wurde zweimal verschoben: Route-Fallback (min-h-screen)
           → Spinner riss ihn hoch (Shift 0.1242), Manifest-Einwuchs schob ihn
           auf 8420 px (Shift 0.3143) — zusammen CLS 0.4387 @8×, Nullprobe
           29.8.2026 auf main 7ab30ea9e. Mit der Reservierung beginnt der Footer
           von Anfang an UNTERHALB des Folds und bewegt sich nur noch dort.
           Reine Platz-Reservierung: kein Zustand entfernt, kein Inhalt gekürzt
           (§15: Layout ändert das WO, nie das WAS). */
        <div className="min-h-inhalt-region py-12 text-center space-y-3">
          <div className="scale-rule max-w-[200px] mx-auto" aria-hidden />
          {/* Eigener Lade-Text: NICHT «Wird geladen» — dieser Wortlaut ist dem
              Suspense-Fallback-Drift-Tor in scripts/prerender.ts vorbehalten. */}
          <p className="text-body-s text-ink-500">Die Sammlung wird abgerufen …</p>
        </div>
      )}

      {erlasse && (
        <>
          {/* Footer-CLS (§15.2, David 25.7.2026): EIN Rahmen um die drei
              exklusiven Inhalts-Zustände (Landeplatz / Trefferregion /
              Ebenen-Panel) reserviert von Anfang an gut eine Viewport-Höhe
              (Token `inhalt-region`, §13) — der Ergebnis-Swap beim Tippen/
              Löschen zog sonst den FOOTER in den Viewport (input-adjazenter
              Shift ~0.0496, Nullprobe 25.7. unter Drossel 6×; Beweis
              e2e/gesetze-footer-cls.e2e.ts). Reine Platz-Reservierung: kein
              Zustand entfernt, kein Inhalt gekürzt (§15: Defer/Layout ändert
              das WANN/WO, nie das WAS). */}
          <div className="min-h-inhalt-region">
          {/* Landeplatz (G4 · §4.1): drei gleichwertige Einstiegskacheln mit
              Kurz-Statistik statt stillem Bund-Default. Prominenter Sprung-/
              Such-Hinweis (Cmd/Ctrl-K, §4.2) darüber. */}
          {!suche.trim() && gewaehlt === null && (
            <div className="space-y-3">
              <Einstieg
                bund={gefiltert.length}
                bundArtikel={gefiltert.reduce((a, e) => a + e.artikelAnzahl, 0)}
                kantone={kantone.length}
                kantonErlasse={erlasse.filter((e) => e.ebene === 'kanton').length}
                international={international.length}
                onWahl={setzeEbene}
              />
              {/* Y-A (§11.8, David 16.7.2026 Auswahl-Dialog: JA): die frühere 4.
                  Einstiegskachel «Nach Rechtsgebiet & Thema» ist zum reinen
                  Gliederungs-Modus demoted — der Zugang lebt im Gliederungs-
                  Umschalter der Säulen (A15/A14); `?ansicht=rechtsgebiet` bleibt
                  auflösbarer Alias (IA-5, A15: Tür NICHT entfernt). */}
              {/* J3: dichte Rechtsgebiets-Übersicht als gehaltvoller Default-
                  Inhalt (Cowork-Befund 19, 18.8.2026) — VOR dem A–Z-Register,
                  das damit zum zweiten, alphabetischen Zugang wird. */}
              <RechtsgebietUebersicht erlasse={erlasse} />
              {/* IA-3 (§11.5): A–Z-Register am ENDE des Landeplatzes — wächst nur
                  nach unten (§15.2), alle Listen-Wechsel sind input-getrieben. */}
              <AzRegister erlasse={erlasse} />
            </div>
          )}

          {/* Suche im wirksamen Scope (IA-4, verallgemeinert N6): Default ist
              die aktive Ebene (Säule/Kanton), der Chip AM FELD weitet auf alle
              Ebenen — der frühere Trefferlisten-Umschalter «Nur …/Alle» ist
              darin aufgegangen (EIN Control, §3.1 keine Wucherung). */}
          {suche.trim() && (() => {
            const aufKanton = filterScope.art === 'kanton';
            const basis = scopeBasis(erlasse, filterScope);
            // §8-Zählparität mit der Universal-Suche (Gegenprüfungs-Befund
            // 7.8.2026): das Header-Dropdown kollabiert die Gemeinde-Doppel
            // (Riehen/Bettingen führen denselben BS-Erlass unter eigenem Präfix)
            // über dedupErlasse, diese Seite tat es nicht — «alle 73 →» landete
            // auf «74 Treffer», q=«zivil» 30 gegen 31. Zwei Zahlen für dieselbe
            // Menge sind ein §8-Verstoss; dedupliziert ist die ehrliche, weil ein
            // Doppel kein zweiter Erlass ist. EINE Funktion für beide Wege (§5).
            const treffer = dedupErlasse(filtern(basis, suche));
            const bund = treffer.filter((e) => e.ebene === 'bund' && !istIntl(e));
            const kant = treffer.filter((e) => e.ebene === 'kanton');
            const intl = treffer.filter(istIntl);
            return (
              <div className="space-y-8">
                <p className="text-body-s text-ink-500"><span className="num">{treffer.length}</span> Treffer für «{suche.trim()}»</p>
                {bund.length > 0 && (
                  <section className="space-y-3">
                    {/* C-7 (31.8.2026): hier stand «Bund · 12» — der
                        Mittelpunkt ist ein Trennzeichen ohne Aussage, die Zahl
                        steht ohnehin allein in ihrem Slot. Nackte Zahl ist der
                        hausweite Kanon (Zählung 12:6:4:2), und der Kopf trägt
                        jetzt auch die Haarlinie der übrigen Gruppenköpfe. */}
                    <GruppenKopf stufe={2} titel="Bund" zahl={bund.length} />
                    <Gitter erlasse={bund} />
                  </section>
                )}
                {gruppiereNachKanton(kant).map((g) => (
                  <section key={g.kanton} className="space-y-3">
                    <GruppenKopf stufe={2} titel={`Kanton ${g.kanton}`} zahl={g.erlasse.length} />
                    <Gitter erlasse={g.erlasse} />
                  </section>
                ))}
                {intl.length > 0 && (
                  <section className="space-y-3">
                    <GruppenKopf stufe={2} titel="International" zahl={intl.length} />
                    <Gitter erlasse={intl} />
                  </section>
                )}
                {treffer.length === 0 && (
                  aufKanton && kanton ? (
                    /* IA-2 (§11.1): Null-Treffer im Kanton-Scope rendert IMMER die
                       Abdeckungslücke mit Weiterweg — nie einen leeren Zustand /
                       eine Sackgasse (praxis #4/#11, Reibung 5). */
                    <div className="lc-notice space-y-1.5">
                      <p className="text-body-s text-ink-700">Kein Treffer für «{suche.trim()}» in {KANTON_NAMEN[kanton] ?? kanton}.</p>
                      <p className="text-xs text-ink-500">
                        <span className="num text-ink-700">{kantonAnzahl.get(kanton) ?? 0}</span> {(kantonAnzahl.get(kanton) ?? 0) === 1 ? 'Erlass' : 'Erlasse'} in diesem Kanton erfasst — die vollständige kantonale Sammlung:{' '}
                        <a href="https://www.lexfind.ch" target="_blank" rel="noopener noreferrer" className="text-brass-700 no-underline hover:text-brass-600">lexfind ↗</a>{' · '}
                        <Link to="/abdeckung" className="text-brass-700 no-underline hover:text-brass-600">Was ist durchsuchbar</Link>
                      </p>
                    </div>
                  ) : (
                    /* W2·19-DESIGN-KONSISTENZ · D-7: Suchlauf ins Leere ⇒
                       `art="filter"` MIT Weiterweg. Der Ausweg existiert hier
                       wirklich — das Suchfeld ist die einzige Achse dieses
                       Zweigs (`treffer = dedupErlasse(filtern(basis, suche))`),
                       und `setSuche('')` führt zurück auf die volle Sammlung. */
                    <Leerzustand art="filter" text="Kein Erlass gefunden."
                      weiterweg={{ text: 'Suche zurücksetzen', onKlick: () => setSuche('') }} />
                  )
                )}
              </div>
            );
          })()}

          {/* Ein Tab-Panel pro Ebene (nur das aktive rendert); id/aria-labelledby
              folgen der aktiven Ebene und verbinden es mit dem gewählten Tab.
              Erst NACH Säulen-Wahl (gewaehlt !== null) — davor trägt der Landeplatz. */}
          {/* D22: hier stand `role=tabpanel` + `aria-labelledby` auf die Reiter
              der Segmented-Control. Die Ebene ist jetzt eine Facette mit
              gedrückten Text-Schaltern (s. `EbenenSchalter`) — ein Panel ohne
              Reiter darf die Rolle nicht behalten, sonst verspricht es eine
              Beziehung, die es nicht mehr gibt (§8). */}
          {!suche.trim() && gewaehlt !== null && (
          <div>
          {ebene === 'bund' && (
            gefiltert.length === 0
              /* W2·19-DESIGN-KONSISTENZ · D-7: dieser Zweig läuft NUR bei leerem
                 Suchfeld (`!suche.trim()` weiter oben) — `gefiltert` ist dann der
                 ungefilterte Bundesbestand. Leer heisst hier also: es ist nichts
                 da (Ladefehler/leeres Manifest), nicht «etwas ist verdeckt». Kein
                 Weiterweg, weil es keinen gibt: ein «zurücksetzen»-Knopf ohne
                 etwas zum Zurücksetzen wäre eine Fehlversprechung (§8) — die
                 `art="bestand"`-Variante lässt ihn darum ausdrücklich weg
                 («sonst ohne — nicht erfinden»). Der WORTLAUT bleibt unangetastet
                 «Kein Erlass gefunden.»: die Zweiteilung gefunden/erfasst ist
                 bedeutungstragend und wurde in Runde 1 ausdrücklich NICHT als
                 Befund geführt — sie hier nachzuziehen wäre ein eigener Schritt. */
              ? <Leerzustand art="bestand" text="Kein Erlass gefunden." />
              : (
                <div className="space-y-4">
                  {/* A15 — Gliederungs-Umschalter (dieselbe Bedienung auf allen Säulen).
                      ── LM-143 (W2·17-UI-BEFUNDE/B16) · ERKLÄRUNG UND UMSCHALTER
                      STEHEN BEIEINANDER. Die Hülle stand auf `justify-end`.
                      Gemessen 4.9.2026 @1440 auf /gesetze?ebene=bund (Preview von
                      origin/main): der Umschalter «Relevanz · Systematisch ·
                      Rechtsgebiet» klebte rechts bei x = 1076–1384, der Satz, der
                      genau diese Wahl erklärt (`RelevanzHinweis` als erstes Kind
                      der gewählten Sicht), begann links bei x = 333 und 145 px
                      tiefer — Bedienelement und Erklärung diagonal über die Seite
                      verteilt. Linksbündig fluchten sie an derselben Kante und
                      stehen unmittelbar übereinander. Die drei Säulen (Bund,
                      International, Kanton) tragen dieselbe Änderung — «dieselbe
                      Bedienung auf allen Säulen» gilt auch für ihre Stellung. */}
                  <div className="flex justify-start">
                    <GliederungUmschalter wert={gliederung} onWahl={setzeGliederung} />
                  </div>
                  {gliederung === 'relevanz'
                    ? <RelevanzGitter erlasse={gefiltert} />
                    : gliederung === 'rechtsgebiet'
                      ? <RechtsgebietSicht erlasse={gefiltert} />
                      : <BundSystematik key={hashSys ?? 'base'} erlasse={gefiltert} hashOffen={hashSys} />}
                </div>
              )
          )}

          {/* International-Tab (Auftrag David 25.6.2026): gleichwertige Säule neben
              Bund/Kantone — Staatsverträge SR 0.* + EU-Verordnungen, geteilte
              Rubriken-Darstellung (§5, identisch zu /international). */}
          {!suche.trim() && ebene === 'international' && (
            <div className="space-y-4">
              <p className="text-body-s text-ink-500 max-w-reading">
                {/* B-6-Nachzug (R2-A): «amtliche Fassung» im Link-Satz, «amtliche
                    Quelle» im Vorbehalt desselben Absatzes — ein Nomen genügt. */}
                Für die Schweiz massgebliche Staatsverträge und internationales Recht — je mit Live-Link zur amtlichen Fassung (Fedlex SR 0.* bzw. EUR-Lex). Einzelne Erlasse (z. B. EMRK) werden als amtliches PDF in-app angezeigt; massgeblich bleibt stets {AMTLICHE_FASSUNG_NOMEN}.
              </p>
              {/* A15 — Gliederungs-Umschalter (dieselbe Bedienung auf allen Säulen). */}
              <div className="flex justify-start">
                <GliederungUmschalter wert={gliederung} onWahl={setzeGliederung} />
              </div>
              {gliederung === 'relevanz'
                ? <RelevanzGitter erlasse={international} />
                : gliederung === 'rechtsgebiet'
                  ? <IntlRechtsgebietSicht erlasse={international} />
                  : <InternationalRubriken erlasse={international} />}
            </div>
          )}

          {!suche.trim() && ebene === 'kanton' && (
            <div className="space-y-6">
              {kanton ? (
                /* Ein Kanton → Zurück-Leiste (mit Wappen-Chip) + nach Kosten-/Abgabe-Art gegliedert. */
                <>
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5">
                    <button type="button" onClick={() => setzeKanton(null)}
                      className="inline-flex items-center gap-1.5 text-body-s font-medium text-brass-700 hover:text-brass-600 transition-colors">
                      <KantonWappen kanton={kanton} className="h-5 w-4" />
                      ← Alle Kantone
                    </button>
                    <span aria-hidden className="text-ink-300">·</span>
                    {/* Schnellwechsel zu Nachbarkantonen ohne Umweg über die Übersicht.
                        IA-2 (§11.1 / M4): Erlass-Zahl-Badge an JEDER Pill — die
                        Mengen-Asymmetrie bleibt an jeder Kantons-Weiche sichtbar; das
                        aria-label trägt Name + Zahl + Zustands-Wort (nicht nur Farbe). */}
                    <div className="flex flex-wrap gap-1">
                      {kantone.map((k) => {
                        const n = kantonAnzahl.get(k) ?? 0;
                        const g = erfassungsgrad(k, n);
                        return (
                          <button type="button" key={k} onClick={() => setzeKanton(k)} aria-pressed={kanton === k}
                            aria-label={`${KANTON_NAMEN[k] ?? k} — ${n} ${n === 1 ? 'Erlass' : 'Erlasse'}, ${STUFE_WORT[g.stufe]}`}
                            className={`inline-flex items-baseline gap-1 rounded px-1.5 py-0.5 text-xs font-medium transition-colors ${
                              kanton === k ? 'bg-brass-100 text-brass-800' : 'text-ink-500 lc-hover-flaeche hover:text-brass-700'
                            }`}>
                            <span className="num">{k}</span>
                            {/* Zahl erbt die (kontrast-geprüfte) Pill-Textfarbe —
                                kein eigenes helleres Token (§13/F2, WCAG ≥4.5). */}
                            <span aria-hidden className="num text-micro">{n}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <section className="lc-card p-5 sm:p-6 space-y-5 scroll-mt-24">
                    {/* IA-2 Erfassungs-Kopf (§11.1 / K-2c): «n Erlasse erfasst — [Wort]»
                        + Weiterweg zur amtlichen Sammlung (lexfind) + /abdeckung. Für
                        dünne Kantone IST diese Zeile der Lücken-Hinweis (nie Sackgasse,
                        auch bei n=0). Zahl + Zustands-Wort als Text (§11.6.8). Nicht
                        doppelt zur G5-Kontextzeile (die lebt in der «Alle»-Auswahl). */}
                    {(() => {
                      const gesamt = kantonAnzahl.get(kanton) ?? 0;
                      return (
                        <div className="border-b border-line pb-3 space-y-2">
                          <div className="flex items-center gap-3">
                            <KantonWappen kanton={kanton} className="h-11 w-10" />
                            <span className="flex flex-col">
                              <span className="flex items-baseline gap-2">
                                <span className="font-sans font-semibold text-ink-900 text-h3 tracking-tight leading-tight">{KANTON_NAMEN[kanton] ?? 'Kanton'}</span>
                                <span aria-hidden className="num text-body-s text-ink-500">{kanton}</span>
                              </span>
                              <span className="lc-overline">Kantonale Erlasse</span>
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5 text-xs text-ink-500">
                            <span><span className="num text-ink-700">{gesamt}</span> {gesamt === 1 ? 'Erlass' : 'Erlasse'} erfasst</span>
                            <StufeBadge kanton={kanton} n={gesamt} />
                            <span aria-hidden className="text-ink-300">·</span>
                            <span>
                              Vollständigkeit:{' '}
                              <a href="https://www.lexfind.ch" target="_blank" rel="noopener noreferrer"
                                className="text-brass-700 no-underline hover:text-brass-600">
                                Kantonale Gesetzessammlungen (lexfind) ↗
                              </a>
                            </span>
                            <span aria-hidden className="text-ink-300">·</span>
                            <Link to="/abdeckung" className="text-brass-700 no-underline hover:text-brass-600">Was ist durchsuchbar</Link>
                          </div>
                        </div>
                      );
                    })()}
                    {/* A14/A15 — Gliederungs-Umschalter für die Erlasse dieses Kantons
                        (die G5-Umschalter Alphabet/Erlass-Zahl/Region auf dem 26er-
                        Raster bleiben davon unberührt — sie ordnen die KANTONE). */}
                    <div className="flex justify-start">
                      <GliederungUmschalter wert={gliederung} onWahl={setzeGliederung} />
                    </div>
                    {(() => {
                      const eig = kantGefiltert.filter((e) => e.kanton === kanton);
                      const sys = systematik?.[kanton];
                      return gliederung === 'relevanz'
                        ? <KantonRelevanzListe erlasse={eig} sys={sys} />
                        : gliederung === 'rechtsgebiet'
                          ? <KantonGebietGruppen erlasse={eig} />
                          : <KantonSystematik erlasse={eig} sys={sys} sysGeladen={systematik !== null} />;
                    })()}
                  </section>
                </>
              ) : (
                /* «Alle» → entrümpelte Auswahl (G5 · §4.3): Kontext-Zeile + Karte/
                    Liste + Sortierung. */
                <KantonAuswahl
                  gruppen={gruppiereNachKanton(kantGefiltert)}
                  alleKantone={kantone}
                  onWaehle={setzeKanton}
                  ansicht={kantonsAnsicht}
                  onAnsicht={setKantonsAnsicht}
                />
              )}
              {/* D-7, wie oben: leeres Suchfeld ⇒ `kantGefiltert` ist der volle
                  kantonale Bestand; leer heisst «nichts da», nicht «verdeckt».
                  Kein Weiterweg, weil keiner existiert. */}
              {kantGefiltert.length === 0 && <Leerzustand art="bestand" text="Kein Erlass gefunden." />}
            </div>
          )}
          </div>
          )}
          </div>
        </>
      )}
      {/* D11: der §8-Vorbehalt gehört an den Fuss, nicht in den Einstieg. */}
      <p className="border-t border-line/60 pt-3 text-micro text-ink-500 max-w-reading">
        Geltende Fassung mit Stand und amtlichem Live-Link je Erlass; massgeblich bleibt stets {AMTLICHE_FASSUNG_NOMEN}.
      </p>
    </div>
  );
}
