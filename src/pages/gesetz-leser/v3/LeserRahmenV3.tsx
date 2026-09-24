import { isValidElement, useId, useRef } from 'react';
import { grundartMeta } from '../helpers';
import { paneRoot } from '../berechnungen';
// Geteilte ANSICHTS-ZUSTÄNDE (Fehlseite · Currency-Pin · pdf-embed · Laden).
// Der zweite verbleibende Berührungspunkt zur `inhalt-*`-Familie neben dem
// Daten-Adapter — und ein bewusster: das sind Zustände des LESERS, nicht der
// Hülle. Sie umzuziehen hiesse, eine unter FL-4 eingefrorene Datei anzufassen;
// die Umbenennung in einen neutralen Namensraum gehört zu H5.
import { LadeAnzeige, FruehAnsicht } from '../inhalt-ansichten';
import { WeiterlesenChip } from '../parts/WeiterlesenChip';
import { LeserTastatur } from '../parts/LeserTastatur';
import { LeserKopf } from './LeserKopf';
import { gliederungsSheetAufbau, leisteAufbau, schieneAufbau } from './leisteAufbau';
import { merkeGliederung } from './gliederungGedaechtnis';
import { LeserLesespalte } from './LeserLesespalte';
import { LeserLeseZeile } from './LeserLeseZeile';
import { LeserErlassKopfZone } from './LeserErlassKopfZone';
import { LeserPanelZone } from './LeserPanelZone';
import { useEinzelModus } from './useEinzelModus';
import { ErlassGriff } from './LeserPanelOeffner';
import { normZitat, OEFFNER_NAME, OEFFNER_WORT, panelBezug, usePanelBezuege, usePanelZustand } from './panelModell';
import { useBlattGedaechtnis } from './blattGedaechtnis';
import { SuchSprungFeld } from './SuchSprungFeld';
import { suchZoneAufbau } from './suchZoneAufbau';
import { LandkarteZone } from './LandkarteZone';
import { SchwebeMeldung } from '../../../components/ui/SchwebeMeldung';
import { useTrefferSicht } from './useTrefferSicht';
import { LeserTrefferSpalte } from './LeserTrefferSpalte';
import { useKopfAnspruch } from './useKopfAnspruch';
import { useStickAusgleich } from './useStickAusgleich';
import { leserCssVariablen } from './leserGeometrie';
import { rahmenBild } from './rahmenSpalten';
import { useRahmenRaum } from './rahmenRaum';
import { kopfGlypheKlassen, kopfGriffKlassen, panelForm, useKopfStufe } from './kopfStufen';
import { useSuchSprungKuerzel } from './suchKuerzel';
import { bestimmungsWort as bestimmungsWortVon, panelEbene, suchFeldName, suchPlatzhalter } from './erlassAnsicht';
import { LeserUebersicht } from './LeserUebersicht';
import { useLeserV3Modell } from './leserV3Modell';

// ═══ LESER V3 · Rahmen (FAHRPLAN-LESER-V3, Etappe H1) ═══════════════════════
//
// **Nur Layout.** Daten und Effekte kommen fertig aus `./leserV3Modell` (die
// eine Naht zur geteilten Maschinerie), der Lesekörper aus `./LeserLesespalte`.
// Diese Datei entscheidet ausschliesslich, **wo etwas steht** — und ist damit
// die Datei, die man liest, um die Hülle zu verstehen.
//
// DER AUFBAU, VON OBEN:
//   LeserKopf   klebt · Kürzel · ⚖ · ☰ · Ansicht · Such-Zone (4a/Ä19/D28)
//   ┌ aside ────────────┬ Zelle ───────────────────────────┐
//   │ Übersicht (zu)    │ ErlassLeserKopf                  │  (Kap. 4b/4e)
//   │ Gliederung klebt  │ ErlassKopfBlock (Ingress)        │
//   │                   │ Lesespalte  ← KERN, eingefroren  │  (Kap. 1.3)
//   └───────────────────┴──────────────────────────────────┘
// Das Feld steht seit D28 (6.9.2026) in JEDER Lage im klebenden Kopf-Block
// (`./SuchZone`); ohne Spalte wandert nur die Gliederung in ein Bottom-Sheet
// hinter ☰.
//
// ── DIE ERWEITERUNGS-SLOTS SIND GESTRICHEN (C4/H3): null Aufrufer, von aussen
// nicht füllbar (§17). Herleitung: Vollzugsvermerk H3, Fahrplan Kap. 7.
// (Gestrafft H4-II 18.8. und Entscheid A 24.9.2026 — 420-Zeilen-Sonde, §6.6.)
//
// ── EINE WURZEL FÜR PANE UND BREITE (Kap. 10) ───────────────────────────────
// `imPane`/`istSekundaer`/`istXl` kommen als `umgebung` aus dem Modell und
// werden GENAU HIER gelesen — sonst nirgends in `v3/` (bewacht von
// `src/tests/leser-v3-fundament.test.ts`). Die zwei Werte, die daraus folgen,
// stehen als CSS-Variablen am Wurzel-Element — damit rechnet auch der
// Sprung-Offset der Anker aus derselben Quelle (Risiko R1, Lehre LM-003).
//
// Bis 16.8. lag `umgebung` zusätzlich in einem React-Kontext
// (`LeserV3Kontext.ts`) mit NULL Konsumenten — alle Bauteile bekommen ihre Werte
// als Prop. Gestrichen statt bewacht (§17 Rückbau, Architektur-Review A2).

export interface LeserRahmenV3Props {
  ebene: string;
  schluessel: string;
}

export function LeserRahmenV3({ ebene, schluessel }: LeserRahmenV3Props) {
  const { modell: m, umgebung } = useLeserV3Modell({ ebene, schluessel });
  const { stufe, kopfRef } = useKopfStufe();
  // A3: die Id der Panel-Fläche entsteht HIER — Öffner und Fläche stehen in
  // verschiedenen Teilbäumen und brauchen dieselbe (`aria-controls`).
  const panelId = useId();
  // H3 · Panel: Zustand und Bezugs-Daten. BEIDE Hooks stehen VOR den frühen
  // Rückgaben (Hooks laufen nicht bedingt) und kosten im Ruhezustand nichts —
  // `usePanelBezuege` bekommt den Erlass-Key erst, wenn das Panel einmal offen
  // war, und ohne Key lädt die Bezugs-Hook nicht (Nachladen, Kap. 7).
  const rohPanel = usePanelZustand();
  // D-6 (S6-W1a, `./blattGedaechtnis`): nur primär — das Zweit-Pane zeigt oft DENSELBEN Erlass (D42 (b)).
  useBlattGedaechtnis(umgebung.istSekundaer ? undefined : m.erlass?.key, rohPanel);
  const bezuege = usePanelBezuege(m.erlass?.key, rohPanel.jeGeoeffnet);
  // ── D35-F2 (7.9.2026) · HIER STAND DER ZWEITE KONSUMENT DER ZÄHL-DATEI ───
  // N1 (7.9.2026) hatte den Kopf-Zähler auf `useBezuegeZaehler` umgestellt,
  // damit er DIESELBE Bezugsgrösse nennt wie die Zeile am Artikel (Befund:
  // «11 Entscheide» gegen «⚖ 3 Entscheide» auf einem Bildschirm). Der Befund
  // bleibt richtig für seinen Stand (§0 Ziff. 2b); D35-F2 löst ihn eine Ebene
  // höher — der Kopf nennt gar keine Artikel-Zahl mehr, es gibt also nur noch
  // EINEN Konsumenten (`./LeserLesespalte`, für die Funktionszeile).
  // V6/Ä88: Höhenausgleich, wenn der klebende Kopf-Block wächst — Befund,
  // Messreihe und der Vertrag von `mitAusgleich`/`wurzelRef`:
  // `./useStickAusgleich`. Scroller aus derselben `paneRoot`-Auflösung wie
  // «↑ Anfang» (§5). Seit Entscheid A (24.9.2026) verschiebt auch das Blatt
  // wieder Spuren (`./rahmenSpalten`) — beide Zustände stehen im Schlüssel.
  const { wurzelRef, mitAusgleich } = useStickAusgleich(
    `${m.tocOffen}·${rohPanel.offen}`,
    paneRoot(umgebung.imPane, umgebung.wurzel), m.aktivToken);
  // Die NUTZERWAHL wird gemerkt, erlassübergreifend (`./gliederungGedaechtnis`,
  // Entscheid David 24.9.2026) — nicht das Weichen vor dem Blatt, nicht `leisteStartetZu`.
  const setzeTocOffen = (auf: boolean) => mitAusgleich(() => { m.setTocOffen(auf); merkeGliederung(auf); });
  // Ä88: JEDER Weg, der das Blatt auf- oder zumacht, läuft durch den Ausgleich —
  // Kopf-Zähler, Menü-Eintrag, Taste «r», das ✕ und Esc des Blattes selbst.
  // Gewickelt wird darum der ZUSTAND, nicht jeder Aufrufpunkt: ein vergessener
  // Aufrufpunkt wäre genau der Sprung, den diese Zeile verhindert (§5).
  const panel = {
    ...rohPanel,
    oeffne: (r?: Parameters<typeof rohPanel.oeffne>[0]) => mitAusgleich(() => rohPanel.oeffne(r)),
    schliesse: () => mitAusgleich(rohPanel.schliesse),
    umschalten: () => mitAusgleich(rohPanel.umschalten),
  };
  // Ä60 (c) · WIE BREIT der Rahmen ist und WELCHE Spuren er trägt: `./rahmenSpalten`
  // (Herleitung, Messreihe und die eine Schwelle stehen dort). Gemessen wird der
  // RAUM im `<main>`, nicht das eigene Element — sonst entschiede der Rahmen über
  // seine Breite anhand seiner Breite.
  const { raum, raumRef } = useRahmenRaum();

  // ⌘K / «/» — Zusage des RAHMENS, nicht des Feldes (Bug-Check B1). Steht VOR den
  // frühen Rückgaben, weil Hooks nicht bedingt laufen dürfen.
  // A3: WELCHES Pane den Tastendruck bekommt, entscheidet `./suchKuerzel` am
  // Fokus. KEIN `onKuerzel` mehr — das Feld ist in jeder Lage im DOM (Kopf-Zone
  // bzw. offenes Blatt), es ist also nichts zu öffnen (§17 Rückbau).
  const suchFeldRef = useRef<HTMLInputElement>(null);
  useSuchSprungKuerzel({ feldRef: suchFeldRef, imSekundaerenPane: umgebung.istSekundaer });
  // D38: Liegt die Trefferliste über der Lesespalte? (`./LeserTrefferSpalte`.)
  // Vor den frühen Rückgaben — Hooks laufen nicht bedingt. Schlüssel ist der
  // ROHE Feldwert: wer nach dem Wegschalten weitertippt, bekommt sie sofort
  // zurück, nicht erst nach der Entprellung.
  const trefferSicht = useTrefferSicht(m.suche.trim());
  // W2·5m · die Lesart (Kap. 15.3/15.6), vor den frühen Rückgaben; die Regeln stehen rein in `./einzelModus.ts`.
  const einzel = useEinzelModus(m, !umgebung.istSekundaer);
  const imEinzel = einzel.modus === 'artikel';

  // Frühe Ansichten (Fehlseite · Currency-Pin · pdf-embed · nur-live-link) und
  // der Ladezustand — dieselben Bausteine wie die Ist-Hülle (§5).
  const frueheAnsicht = FruehAnsicht({
    fehler: m.fehler, schluessel, manifest: m.manifest, erlass: m.erlass,
    currency: m.currency, kopf: m.kopf, internRefs: m.internRefs,
  });
  // V1: Der Kopf-Anspruch der Fassade ist eine RESERVIERUNG und auf drei Wegen falsch
  // (Fehlseite · pdf-embed · nur-live-link — dort stand weder App-Krume noch ✕); der
  // Lade-Platzhalter ist der Übergang, für den sie existiert (`./useKopfAnspruch`).
  useKopfAnspruch(isValidElement(frueheAnsicht) && frueheAnsicht.type !== LadeAnzeige);

  if (frueheAnsicht) return frueheAnsicht;
  if (!m.erlass || !m.eintraege) return <LadeAnzeige />;

  const { erlass, eintraege } = m;
  const meta = grundartMeta(erlass.key);
  const bestimmungsWort = bestimmungsWortVon(erlass.key); // B8: EINE Ableitung
  const hatLeiste = eintraege.length > 0;
  const ruheForm = panelForm(stufe, !umgebung.imPane);
  const bild = rahmenBild({
    raum, spaltenLage: hatLeiste && umgebung.istXl, tocOffen: m.tocOffen, ruheForm,
    // Entscheid A (24.9.2026): Blatt-Spur nur, wo auch die Gliederung Spalte sein kann. D-E4 (#1040): im Einzelmodus kein Blatt.
    blattLage: umgebung.istXl && ruheForm === 'rechts', blattOffen: panel.offen, einzelModus: imEinzel,
  });
  const zweiSpalten = bild.gliederungSpalte;
  // ── P3 (3b) · DREI NAMEN FÜR DREI DINGE (H4-Nachzug 18.8.2026) ────────────
  // Zwei Flächen hiessen einmal beide `blattOffen`, die dritte Frage hatte gar
  // keinen Namen (Architektur-Review 18.8.2026). Seither:
  //   `gliederungsSheetOffen`  das GLIEDERUNGS-Sheet (☰, unter der Spaltenschwelle)
  //   `panel.offen`            das BEIWERK-Blatt (Rechtsprechung & Kontext)
  //   `leisteSteht`            trägt die Seitenleiste den Steckbrief gerade
  //                            irgendwo — als Spalte ODER im Sheet?
  const gliederungsSheetOffen = !umgebung.istXl && m.tocAuf && hatLeiste; // A2: Feld im Blatt
  const leisteSteht = zweiSpalten || gliederungsSheetOffen;

  // Ä20 · Platzhalter-Beispiel = amtliches Etikett des ERSTEN Eintrags («Art. 1»
  // bzw. «§ 1»), nie aus dem Bestimmungswort gebaut (§5, `./erlassAnsicht`).
  const beispielBestimmung = eintraege[0]?.artikelLabel ?? null;

  const suchFeld = (
    <SuchSprungFeld wert={m.suche} setzeWert={m.setSuche} loeseArtikel={m.loeseArtikel}
      onSprung={m.springeZuArtikel} feldRef={suchFeldRef}
      // Ä112/Ä126 (18.8.2026): der Platzhalter nennt die SACHE («Im Erlass
      // suchen») — sonst standen @720–1440 zwei fast gleich beschriftete
      // Suchfelder übereinander (Topbar vs. Leser). Das KÜRZEL steht nur im
      // zugänglichen Namen: es ist im Register nicht längenbeschränkt und
      // sprengte @390 das Feld. Herleitung in `./erlassAnsicht.suchPlatzhalter`.
      platzhalter={suchPlatzhalter(beispielBestimmung)}
      ariaName={suchFeldName(m.erlass?.kuerzel)} escLeert={!gliederungsSheetOffen}
      // H2 (Kap. 4h): ↑↓ und Enter bedienen dieselbe Fundstellen-Folge wie die
      // ↑↓-Knöpfe im Kopf der Trefferliste — EIN Weg, zwei Bedienarten (§5).
      hatTreffer={m.fundstellen > 0}
      onVor={() => m.springeZuFundstelle?.(1)}
      onZurueck={() => m.springeZuFundstelle?.(-1)}
      // D38: ↵ ist die Wahl — die Liste gibt die Lesefläche frei (`./SuchSprungFeld`).
      onBestaetigt={trefferSicht.schliesse} />
  );

  // D28 (6.9.2026): der Kopf-Block trägt das Feld IMMER — bis hierher stand
  // `&& !zweiSpalten`, und dieses Hin-und-Her war der Mangel (`./SuchZone`).
  const suchZoneKlebt = hatLeiste;
  // D38 · ZWEI FRAGEN, ZWEI NAMEN (dieselbe Trennung wie W2·24-F): `feldGefuellt`
  // ist GEOMETRIE und sofort — daran hängen Zonenhöhe und Erscheinen der Liste,
  // beides eingabe-nah (Messreihe in `./leserGeometrie`, `zoneHoch`).
  // `m.sucheAktiv` ist die entprellte DATENLAGE und sagt nur, ob in der Liste
  // schon Treffer oder noch «sucht …» stehen.
  const feldGefuellt = m.suche.trim() !== '';
  const trefferSteht = hatLeiste && feldGefuellt && trefferSicht.offen;
  // Zusammensetzung in `./suchZoneAufbau` (§6.6-Auslagerung 17.8.2026); der
  // Rahmen sagt, OB die Zone klebt und WAS darin steht.
  const suchZone = suchZoneAufbau({
    klebt: suchZoneKlebt, sucheAktiv: m.sucheAktiv, feldImSheet: gliederungsSheetOffen, suchFeld, bestimmungsWort,
    bestimmungen: m.treffer.length, fundstellen: m.fundstellen, onListe: trefferSicht.oeffne,
    // D28 · ‹ ›: dieselben Callbacks wie ↑↓ im Feld (§5, eine Folge).
    onVor: () => m.springeZuFundstelle?.(1), onZurueck: () => m.springeZuFundstelle?.(-1),
    listeSteht: trefferSteht, // D38, Herleitung in `./SuchZone`
    markenAus: m.markenAus, setzeMarkenAus: m.setzeMarkenAus, // W2·28/L-2, s. dort
  });
  // N4: die Zone zieht genau dann in die Kopfzeile, wenn links eine Spur steht
  // — nur dort hat das Feld eine Kante (D32) und daneben Platz für die Griffe
  // (Messung und Höhen-Rechnung in `./leserGeometrie`, `suchInZeile`).
  const suchInZeile = suchZone != null && bild.spurVersatzRem > 0;
  // D32: «‹ Gliederung ausblenden» steht seit 7.9.2026 im linken Streifen der
  // Kopfzeile (`./LeserKopf`) statt über der Spalte — und nur, wo die Spalte
  // steht: eingeklappt ist die Schiene der eine Griff (Ä79).

  // ── H3 · Panel: WO es steht, WAS am Öffner steht ──────────────────────────
  // Die Overlay-Wurzel und die Pane-Rolle stehen hier EINMAL — Gliederungs-Blatt
  // und Panel-Blatt hängen in dieselbe Schicht und müssen dieselbe Rolle tragen
  // (H2-Befund, `./leisteAufbau`).
  const overlayZiel = (umgebung.imPane && umgebung.overlayWurzel?.current) || null;
  const paneRolle = umgebung.istSekundaer ? 'sekundaer' as const : 'primaer' as const;
  // Ohne Leseposition gilt der ERSTE Artikel — benannt, nicht stillschweigend
  // (Begründung und Befund in `./panelModell`, `panelBezug`).
  const panelZiel = panelBezug(m.aktArtikel, m.aktivToken, eintraege[0]);
  const panelArtikel = panelZiel.label;
  // D35-F2: die Zone steht immer. Bis hierher hing sie an
  // `panel.oeffnerSichtbar || panel.offen` — der zweite Zweig war der F8-Fall
  // (Schalter aus, Panel per «r» aufgezogen). Mit dem Wegfall des Schalters ist
  // der erste Zweig konstant `true`, und ein konstanter Ausdruck ist keine
  // Bedingung mehr (§17-Gegengewicht). Die Zahl `panelZahl` fällt mit ihm: der
  // Kopf nennt keine Artikel-Zahl mehr (Herleitung in `./LeserPanelOeffner`).

  // Ä79 (H4-II): steht die Schiene, ist SIE der eine Griff — die Herleitung samt
  // Messreihe steht am Bauteil, das sie betrifft (`./leisteAufbau`).
  const schieneSteht = bild.schiene;
  // Entscheid A (24.9.2026): die Schiene steht wieder aus ZWEI Gründen — der
  // Nutzer hat eingeklappt, oder das offene Blatt hat ihren Platz (transient).
  // Im zweiten Fall holt ihr Klick den Platz zurück (Ä60 (c) P1-1; D33 hatte das
  // gestrichen): die Gliederung ist ja offen gewählt, «einblenden» täte nichts.
  const schieneAuf = bild.schieneHoltPlatz ? panel.schliesse : () => setzeTocOffen(true);
  // ☰ nur, wenn die Gliederung gerade NICHT als Spalte steht — sonst ein Knopf
  // ohne Wirkung (Kap. 6, Icon-Flut-Verbot). Ä90: dieselbe Bauform wie ⚖ und
  // «Ansicht»; bis 17.8. der einzige NACKTE Griff der Zeile, bis G14 (7.9.2026)
  // @390 der einzige ganz OHNE Wort — Messreihe in `./LeserPanelOeffner`.
  const gliederungKnopf = hatLeiste && !zweiSpalten && !schieneSteht
    ? (
      <button type="button" data-v3-gliederung-auf
        aria-expanded={umgebung.istXl ? m.tocOffen : m.tocAuf}
        onClick={() => { if (umgebung.istXl) setzeTocOffen(true); else m.setTocAuf((v) => !v); }}
        // ── Ä111 (18.8.2026) · ZWEI ☰, ZWEI ZIELE ──────────────────────────
        // GEMESSEN @390: zwei ☰ in derselben Kopfzone — links das der App-Topbar
        // («Navigation öffnen»), rechts dieses; beide Namen waren Substantive,
        // keiner sagte, was der Klick tut. JETZT nennt er die Handlung,
        // wortgleich mit «Gliederung ausblenden»/«einblenden» (`LeserLeseZeile`,
        // Schiene). Die Glyphe blieb damals — ein zweites ZEICHEN wäre eine
        // Icon-Set-Entscheidung und damit H5; seit G14 weicht sie @390 dem WORT.
        title="Gliederung öffnen" aria-label="Gliederung öffnen" className={`${kopfGriffKlassen(stufe === 'mini')} ${stufe === 'mini' ? 'px-1.5' : ''}`}>
        {stufe === 'mini' ? <span className="whitespace-nowrap">Gliederung</span> : <span aria-hidden className={kopfGlypheKlassen(false)}>☰</span>}
      </button>
    )
    : undefined;

  return (
    <div
      ref={(el) => { kopfRef(el); wurzelRef.current = el; raumRef(el); }}
      data-leser-v3="rahmen"
      className="lc-leser space-y-5"
      data-grundart={meta.grundart ?? undefined}
      // Die Geometrie (sechs voneinander abhängige CSS-Variablen, Risiko R1) ist
      // eine reine Funktion in `./leserGeometrie` — dort steht auch die Herleitung
      // samt LM-003. Der Rahmen sagt nur noch, WELCHE Lage gilt (C5a, §6.6).
      style={{
        ...leserCssVariablen({
          stufe, vollflaechig: !umgebung.imPane, suchZoneKlebt,
          // W2·24-F: roher Feldwert (`zoneHoch`). D38 strich `&& !zweiSpalten`:
          // die Zone ist hoch, sobald im Feld etwas steht — auch wenn die
          // Zähler-Zeile schweigt, weil die Liste dasteht. RESERVIERT statt
          // gefüllt, sonst spränge `--nt-stick` bei jedem Wechsel um 24 px.
          zoneHoch: feldGefuellt,
          suchInZeile, spurVersatzRem: bild.spurVersatzRem, spurVersatzRechtsRem: bild.spurVersatzRechtsRem,
        }),
        // Entscheid A (24.9.2026): die Aufweitung ist zurück (`./rahmenSpalten`).
        ...bild.breite,
      }}>

      {/* D27: kein `aktArtikel` mehr — Herleitung in `./LeserKopf`. */}
      <LeserKopf erlass={erlass} fussnotenAnzahl={m.fussnotenAnzahl}
        hatAenderungsvermerke={m.hatAenderungsvermerke}  modus={einzel.modus} onModusWahl={einzel.waehleModus}
        bestimmungsWort={bestimmungsWort} stufe={stufe} gliederungKnopf={gliederungKnopf}
        suchInZeile={suchInZeile} tocOffen={m.tocOffen}
        onGliederungZu={zweiSpalten ? () => setzeTocOffen(false) : undefined}
        // D35-F2: EIN Öffner je Breite (Ä92). Entscheid A (24.9.2026): wo das
        // Blatt eine Spur hat, ist er die Schiene (zu) bzw. «Erlass-Blatt
        // ausblenden ›» im rechten Streifen (offen) — der Kopf-Griff entfällt.
        panelOeffner={!bild.blattGriff ? undefined : (
          <ErlassGriff offen={panel.offen} kompakt={stufe === 'mini'}
            // A3: dieselbe Id wie die Fläche — sonst ist `aria-controls` null.
            panelId={panel.offen ? panelId : undefined}
            onKlick={panel.umschalten} />
        )}
        rechterStreifen={bild.blattForm === 'spalte'}
        onBlattZu={bild.blattSpur ? panel.schliesse : undefined} blattPanelId={panelId}
        suchZone={suchZone} />

      {/* Handy/schmales Pane: die GANZE Seitenleiste als Bottom-Sheet hinter ☰
          (Kap. 4b). Aufbau und Herleitung: `./leisteAufbau` (D38-Auslagerung,
          §6.6); der Rahmen entscheidet OB, WOHIN und WAS darin steht. */}
      {gliederungsSheetOffen && gliederungsSheetAufbau({
        m, bestimmungsWort, ziel: overlayZiel, paneRolle,
        sheetRef: m.refs.tocDrawerRef, suchFeld,
      })}

      {/* Die Lese-Zeile — die drei Spuren nebeneinander (`./LeserLeseZeile`,
          Auslagerung H4-Nachzug 18.8.2026, §6.6). Der Rahmen entscheidet ihre
          Gestalt (`bild` aus `./rahmenSpalten`) und füllt ihre Slots; WIE die
          Spuren stehen, steht dort. */}
      <LeserLeseZeile bild={bild} vollflaechig={!umgebung.imPane}
        onSchieneAuf={schieneAuf}
        // Entscheid A: der Spiegel der Gliederungs-Schiene; Anker wie `ErlassGriff`.
        blattSchiene={schieneAufbau({
          wort: OEFFNER_WORT, glyphe: '‹', titel: 'Erlass-Blatt einblenden', onAuf: () => panel.oeffne(),
          merkmale: { 'data-v3-blatt-schiene': true, 'data-v3-panel-zaehler': true, 'data-v3-panel-oeffner': true,
            'aria-label': OEFFNER_NAME, 'aria-keyshortcuts': 'r' },
        })}
        leiste={leisteAufbau(m, bestimmungsWort, false)}
        zelle={<>
          {/* Das Titelblatt samt Ingress (S2) — Verdrahtung in `./LeserErlassKopfZone`;
              der Ingress entfällt im Einzelmodus (W2·5m). */}
          <LeserErlassKopfZone m={m} erlass={erlass} artikelAnzahl={eintraege.length}
            bestimmungsWort={bestimmungsWort} ingress={imEinzel ? null : m.kopf} />
          {/* D38: der Text bleibt IMMER gerendert, die Trefferliste legt sich darüber (`./LeserTrefferSpalte`). */}
          {/* W2·5m · im Einzelmodus EINE Bestimmung, dieselbe Prop-Kette (§5). */}
          <LeserLesespalte m={m} bezuege={bezuege} weckeBezuege={rohPanel.weckeDaten}
            oeffneBlatt={bild.blatt ? rohPanel.oeffne : undefined} bezuegeGeweckt={rohPanel.jeGeoeffnet}
            einzelToken={imEinzel ? einzel.token : null} search={einzel.search} />
        </>}
        // D38 · Trefferliste über der Lesespalte — `absolute`, ohne Platz im
        // Fluss; der Rahmen sagt nur, OB sie da ist (`./LeserTrefferSpalte`).
        trefferSpalte={trefferSteht
          ? (
            <LeserTrefferSpalte m={m} bestimmungsWort={bestimmungsWort}
              vollflaechig={!umgebung.imPane}
              // Esc ist eine TASTATUR-Geste ⇒ Fokus zurück ins Feld, sonst fiele
              // er auf den Body. Beim KLICK nicht: ein Fokus im Feld öffnete
              // @390 die Bildschirmtastatur über dem eben geholten Text.
              onSprung={trefferSicht.schliesse}
              onSchliessen={() => { trefferSicht.schliesse(); suchFeldRef.current?.focus(); }} />
          )
          : null}
        // H3 · Panel/Lasche. EIN Aufrufpunkt für beide Modi: im Spalten-Modus
        // füllt die Zone die dritte Grid-Spur, im Blatt-Modus hat sie keine Box
        // und liegt ausserhalb des Flusses.
        // W2·5m (D-E4) · «panel im einzelmodus weg» — NICHT GEMOUNTET, nicht versteckt:
        // sonst blieben Reiter im Fokusbaum, ←/→ belegt und Shards geladen (§17: die Datei bleibt).
        panelZone={!bild.blatt ? null : (
            <LeserPanelZone form={bild.blattForm} panelId={panelId}
              paneZiel={overlayZiel} paneRolle={paneRolle}
              zustand={panel} bezuege={bezuege} erlassKey={erlass.key} quelleUrl={erlass.quelleUrl}
              normZitat={normZitat(panelArtikel, erlass.kuerzel)} stichtag={m.currency?.[erlass.key]?.geprueftAm ?? null}
              artikelLabel={panelArtikel} erlassKuerzel={erlass.kuerzel}
              bestimmungsWort={bestimmungsWort} aktArtikel={panelZiel.token} ebene={panelEbene(erlass)}
              steckbrief={leisteSteht ? null : <LeserUebersicht m={m} bestimmungsWort={bestimmungsWort} />} />
          )} />

      {/* R4 «Weiterlesen» + R8 Tastatur — dieselben BAUSTEINE wie die Ist-Hülle
          (Kap. 4h: KEINE zweite Tastaturebene), direkt aus `parts/` statt über
          den Ist-Wrapper `inhalt-overlays`. Nur die PRIMÄR-/Einzelansicht: im
          sekundären Pane liefe sonst ein zweiter globaler keydown-Listener und
          j/k sprängen doppelt.
          `display: contents` am Träger ist kein Zierrat, sondern der Fix eines
          gemessenen 20-px-Shifts: `.lc-leser` trägt `space-y-5`, und dessen
          `> * + *`-Regel gäbe dem Lese-Inhalt einen Margin, sobald ein zweites
          Kind danebensteht — obwohl beide Overlays `fixed` sind und gar keinen
          Platz brauchen. Ein Träger ohne eigene Box nimmt den Margin entgegen
          und wirft ihn weg. */}
      <div className="contents">
        <LandkarteZone m={m} bestimmungsWort={bestimmungsWort} randluft={!umgebung.imPane} listeSteht={trefferSteht} onVorSprung={trefferSicht.schliesse} />
        {/* Der Reiter-Toast gehört hierher, nicht an den Kopf des Rahmens: er
            ist `fixed` und braucht keinen Platz, stand als ERSTES Grid-Kind aber
            im `space-y-5`-Fluss und gab der Kopfzeile darunter ein `mt-5` — ein
            sichtbarer Sprung von 20 px, sobald er erschien (Bug-Check «Nice»,
            16.8.2026). Derselbe `display: contents`-Träger, der das schon für
            «Weiterlesen» und die Tastatur löst, nimmt den Margin entgegen und
            wirft ihn weg. F2-5 (31.8.2026): Geometrie und Optik kommen aus `ui/SchwebeMeldung` — der Toast war die Abweichung unter drei gleichen Rollen (`top-20` geraten statt `--nt-stick`, darum @390 über den Kopf-Griffen; Herleitung und Messung dort). Behalten: `role="status"`. M8 (6.9.2026): der INHALT hiess «Im neuen Reiter geöffnet — oben unter ☰» und war zweimal überholt — das ☰-Flyout ist mit der Arbeitsleiste (W2·24) weg, und der auslösende Knopf öffnet seit M8 das zweite Fenster statt eines zweiten Reiters (Herleitung in `ReiterAktion.tsx`). */}
        {m.reiterToast && (
          <SchwebeMeldung kante="oben" ausrichtung="rechts" rolle="status" inhaltKlassen="gap-2 px-3 py-2 text-body-s text-ink-700">
            <span aria-hidden className="text-brass-700">⧉</span>
            Daneben geöffnet — im Fenster rechts
          </SchwebeMeldung>
        )}
        {!umgebung.istSekundaer && m.weiterlesen && (
          <WeiterlesenChip label={m.weiterlesen.label}
            onWeiterlesen={m.weiterlesenSprung} onVerwerfen={m.weiterlesenVerwerfen} />
        )}
        {/* H3 · «r» schaltet das Blatt (KEINE zweite Tastaturebene, Kap. 4h).
            A2: der Listener läuft in BEIDEN Panes und beansprucht die Taste nur
            mit dem Fokus in SEINEM Pane (`../panePrioritaet`, wie ⌘K). */}
        {/* W2·5m · ←/→ nur im Einzelmodus — erst das fehlende Panel gibt sie frei (Kap. 15.6); `j`/`k` unverändert. */}
        <LeserTastatur tokens={m.artTokens} aktivToken={m.aktivToken} onSprung={m.springeZuArtikel}
          onPanel={!bild.blatt ? undefined : panel.umschalten /* D-8 (S6-W1a): umschalten, Reiter bleibt */}
          onBlaettern={imEinzel ? einzel.blaettere : undefined}
          imSekundaerenPane={umgebung.istSekundaer} />
      </div>
    </div>
  );
}
