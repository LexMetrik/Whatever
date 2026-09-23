import { useMemo, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import type { Sektion } from '../../../lib/normtext/browse';
import { verifizierLinkSektion } from '../../../lib/normtext/verifikationslink';
import { ArtikelLeser, SektionKopf } from '../parts';
import { istAnhangToken } from '../berechnungen';
import { bestimmungsWort, erlassPfad } from './erlassAnsicht';
import type { LeserV3Modell } from './leserV3Modell';
import { usePaneSteuerung } from '../../../components/layout/usePaneLayout';
import { randNotizZiel } from '../randNotizOeffnen';
import { useBezuegeZaehler } from '../bezuegeZaehler';
import { useArtikelMaterialien } from '../artikelMaterialienLaden';
import type { PanelBezuege } from './panelModell';
import { baueNachbarn } from './nachbarArtikel';
import { LeserEinzelAnsicht } from './LeserEinzelAnsicht';
import { einzelAdresse } from './einzelModus';
import { labelMitBereich } from '../../../lib/normtext/darstellung';

// ─── Die Lesespalte (FAHRPLAN-LESER-V3 Kap. 1.3 «Kern-Grenze») ──────────────
//
// HIER STEHT DER TEIL, DER SICH NICHT ÄNDERN DARF. Markup, Klassen und
// Reihenfolge sind byte-gleich aus der Ist-Hülle übernommen
// (`inhalt-volltext.tsx` / `inhalt.tsx`) — die `#lc-lesespalte`-Identität, das
// Lesemass `max-w-normtext mx-auto` (A37), die `data-normtext-linie`-Marke und
// die Sortierung von Kindern und direkten Artikeln nach Dokumentposition
// (6b/T8). Die frühere Einzug-Skala stand auch in dieser Aufzählung; sie ist
// mit dem Entscheid David 29.8.2026 aufgehoben (Herleitung in `renderSektion`).
//
// Der Grund ist keine Vorsicht, sondern ein Tor: der Pixelvergleich PX (Kap. 7)
// misst genau diese Region gegen V1. **Wer hier eine Klasse „aufräumt", bricht
// die Treue-Grenze**, und zwar auf eine Weise, die DOM-Tests durchlassen
// (Abstände, Einzüge, Zeilenumbrüche). Die Typografie des Normtexts ist Etappe
// **S2** und wird dort einmalig und deklariert neu gesetzt — nicht hier.
//
// Eigene Datei, weil der Rahmen sonst Layout UND Lesekörper trüge: zwei
// Verantwortungen, von denen genau eine eingefroren ist. So sieht man der
// Dateiliste an, welche das ist.

// ── `beiwerkSlot` IST GESTRICHEN (C4, H3-Nachzug 17.8.2026) ──────────────────
// Er war als «Beiwerk-Zone je Artikel» angekündigt, gebaut war EIN ReactNode am
// Fuss der Spalte — und über drei Etappen hat ihn kein Aufrufer gesetzt. S2, die
// Etappe, für die er gedacht war, baut die Zone im KERN (`parts/ArtikelLeser`,
// Kap. 1.3) und braucht ihn nicht. §17: gestrichen statt bewacht; Herleitung im
// Rahmen (`LeserRahmenV3`, «DIE DREI ERWEITERUNGS-SLOTS SIND GESTRICHEN»).
// ── `trefferListe` IST GESTRICHEN (Ä76, 17.8.2026) ───────────────────────────
// Der Prop hängte die Trefferliste INLINE über den Lesetext, angekündigt für den
// Rand-Fall «keine Leiste, aber breit genug». Er traf den falschen Fall: bei
// EINGEKLAPPTER Gliederung lag die Liste 3596 px hoch bei y = 755 unter der Falz
// und schob den Gesetzestext um 3,6 Bildschirmhöhen nach unten (Davids Befund
// «resultat ist versteckt»). Der angekündigte Fall war ohnehin unerreichbar:
// «keine Leiste» heisst `eintraege.length === 0`, also kein Artikel — dann gibt
// es weder Treffer noch Lesetext. §17: gestrichen statt verengt.
// ── UND ER KOMMT MIT D38 NICHT ZURÜCK (7.9.2026) ─────────────────────────────
// Seit D38 liegt die Trefferliste über der Lesespalte — aber als eigene Ebene
// AUSSERHALB dieser Datei (`./LeserTrefferSpalte`, eingehängt in der Lese-Zelle
// von `./LeserLeseZeile`). Genau das ist der Unterschied zum gestrichenen Prop:
// die Liste steht nicht IM Fluss des Lesekörpers, sondern `absolute` darüber,
// verschiebt also keinen Pixel und lässt die PX-Region hier unangetastet.
export function LeserLesespalte({ m, bezuege, weckeBezuege, oeffneBlatt, bezuegeGeweckt = false, einzelToken, search = '' }: {
  m: LeserV3Modell;
  /** W2·5m (Kap. 15.3) · Im Einzelmodus der Token der EINEN Bestimmung.
   *  DIE SPALTE BLEIBT DIE SPALTE: die Artikel-Props werden weiter an genau
   *  einer Stelle gebaut (`artikel()` unten) — eine eigene Einzel-Spalte wäre
   *  dieselbe Kette ein zweites Mal (§5). Was der Modus ändert, ist die
   *  Anordnung, und die steht in `./LeserEinzelAnsicht.tsx`. */
  einzelToken?: string | null;
  /** Query-Teil der Adresse — beim Blättern mitgeführt (`./einzelModus`). */
  search?: string;
  /** D30 · der Apparat des Panels — DIESELBE `useBezuege`-Instanz, kein zweiter
   *  Lader (§5). `undefined` in der Ist-Hülle und in Tests, die die Spalte ohne
   *  Rahmen mounten; dann verhält sich die Zeile wie vor D30. */
  bezuege?: PanelBezuege;
  /** D30 · Aufklappen der Bezüge-Zeile ⇒ Nachladen armieren (`weckeDaten`). */
  weckeBezuege?: () => void;
  /** D35-F2 · «im Blatt öffnen ›» der Rubrik «Entscheide» — referenz-stabil aus
   *  `./panelModell` (`oeffneEntscheide`), sonst fiele die `memo`-Schranke von
   *  `parts/ArtikelLeser` über alle Artikel (§15). */
  oeffneBlatt?: () => void;
  /** D30 · ist bereits jemand nach den Daten gefragt worden? Steuert die
   *  Skelett-Zeile «lädt …» UND das Laden der Materialien. */
  bezuegeGeweckt?: boolean;
}) {
  const { erlass, eintraege, struktur, sektionen, ohneGliederung, basisPfad, vorher, nachher } = m;
  // Refs einzeln herausgezogen: die Lint-Regel `react-hooks/refs` erkennt einen
  // Ref am Namen, und `refs.leseRef` ist für sie ein Member-Zugriff im Render.
  const { leseRef, sekRef } = m.refs;
  // W2·24-R6c: die ZAHLEN der Bezüge-Zeile aus der Zähl-Datei (ø 289 B) statt
  // aus dem 2.2-MB-Bezugs-Shard — Herleitung in `../bezuegeZaehler`. Der Hook
  // steht HIER und nicht im Modell: die Lesespalte ist sein einziger Konsument,
  // und das Modell hält damit seine §6.6-Schwelle (`leser-v3-fundament`).
  const bezuegeZaehler = useBezuegeZaehler(erlass);
  // D30 · die Materialien-LISTE zur bereits gezählten Materialien-ZAHL. Wie der
  // Zähler: EIN Fetch je Erlass, im Leerlauf, hier und nicht im Modell (die
  // Lesespalte ist der einzige Konsument, §6.6-Schwelle des Modells).
  const artikelMaterialien = useArtikelMaterialien(erlass?.key, bezuegeGeweckt);
  // Split-Regel der Randnotiz (s. `onClickCapture` unten): EIN Abo je Spalte.
  // VOR dem Lade-Guard, weil Hooks nicht bedingt laufen dürfen.
  const { oeffneDaneben, kannOeffnen, istOffen: paneOffen } = usePaneSteuerung();
  // ── W2·5m · NACHBAR-ARTIKEL, EINMAL JE ERLASS ─────────────────────────────
  // Die Map wohnt HIER und nicht im Modell — dieselbe Begründung wie bei
  // `useBezuegeZaehler` oben: die Lesespalte ist der einzige Konsument, und das
  // Modell hält damit seine §6.6-Schwelle (`leser-v3-fundament`).
  // `useMemo` ist kein Tempo-Schmuck, sondern die Bedingung der `memo`-Schranke
  // von `parts/ArtikelLeser`: die Werte müssen über Scroll-Spy-Takte hinweg
  // DIESELBEN Objekte bleiben (§15, Herleitung in `./nachbarArtikel.ts`).
  // VOR dem Lade-Guard, weil Hooks nicht bedingt laufen dürfen.
  const nachbarn = useMemo(() => baueNachbarn(eintraege), [eintraege]);
  if (!erlass || !eintraege) return null;
  const fn = (tok: string) => struktur?.[tok]?.fussnoten;
  const istOffen = (id: string, defOpen: boolean) => m.offen[id] ?? defOpen;
  const toggle = (id: string, defOpen: boolean) =>
    m.setOffen((o) => ({ ...o, [id]: !(o[id] ?? defOpen) }));
  const regRef = (id: string) => (el: HTMLElement | null) => {
    if (el) sekRef.current.set(id, el); else sekRef.current.delete(id);
  };

  // ── H3 · POS. 12 · KEIN `bezuege` MEHR AM ARTIKEL ─────────────────────────
  // Bis H2 stand hier `bezuege={m.bezuegeFuer(e.artikel)}` und der Kern rendete
  // darunter die `BezuegeZeile` — je Instanz eine waagrecht scrollbare Chip-Linie
  // (277 Z.). Genau die ist Pos. 12 («12 Entscheide im Fliesstext»): sie verlässt
  // den Lesekörper. In V3 stehen die Entscheide im Panel (Kap. 4d).
  //
  // DER PROP-VERTRAG DES KERNS GENÜGT — KEINE KERN-ÄNDERUNG. `ArtikelLeser`
  // rendert bei ungesetztem `bezuege` die `LeitfallZeile`, und die kehrt ohne
  // `leitfaelle` mit `null` zurück: unter dem Artikel steht nichts. Die Prop
  // WEGZULASSEN ist damit der ganze Umbau. `revision` und `historie` bleiben —
  // sie sind Fassungs-Auskunft, nicht Rechtsprechung.
  //
  // UND KEIN ZÄHLER HIER (Entscheid H3, im Vollzugsvermerk begründet): ein
  // Zähler je Artikel bräuchte die Trefferzahl beim ersten Paint. Die kommt aus
  // dem Bezugs-Shard, und der wird seit H3 erst beim Öffnen des Panels geladen —
  // die Zahl erschiene also erst nach dem Öffnen, und zwar an JEDEM Artikel
  // gleichzeitig. Das wäre ein Layout-Sprung über das ganze Dokument, ausgelöst
  // vom Öffnen des Panels: exakt das, was `leser-v3-kontext-cls` verbietet. Der
  // Zähler je Artikel gehört in die höhenfeste Beiwerk-Zone von **S2** — dort ist
  // der Platz reserviert, bevor die Zahl kommt.
  const artikel = (e: (typeof eintraege)[number], einzel = false) => (
    <ArtikelLeser key={e.id} e={e} erlass={erlass} basisPfad={basisPfad} fussnoten={fn(e.artikel)}
      intern={m.internRefs} marg={m.margAnzeige.get(e.artikel)?.teile} margBasis={m.margAnzeige.get(e.artikel)?.ab}
      revision={m.revisionFuer(e.artikel)} historie={m.historieFuer(e.artikel)}
      // W2·24-R6c: die ZAHLEN der Bezüge-Zeile aus der Zähl-Datei (289 B im
      // Mittel) statt aus dem 2.2-MB-Shard — Herleitung in `../bezuegeZaehler`.
      // Der Kern rendert wie bisher; das Öffnen der Zeile lädt weiterhin lazy.
      zaehler={bezuegeZaehler(e.artikel)}
      // ── D30 · POS. 12 IST NICHT ZURÜCK (und `bezuege` bleibt ungesetzt) ──
      // D34 (7.9.2026): die Prop hiess bis D33 `bezuegeImKopf` — die Zeile stand
      // damals unter der Artikelnummer, seit D34 steht sie am Artikelfuss. Nur
      // der Name folgt dem Ort; der Ladevertrag darunter ist unverändert.
      // Der Block darüber begründet, warum `bezuege` an dieser Stelle FIEL: die
      // `BezuegeZeile` stand damals UNBEDINGT im Fliesstext, an jedem Artikel,
      // und wuchs beim Eintreffen des Shards in den Lesekörper hinein. Beides
      // ist hier nicht der Fall. Die Prop kommt nur, NACHDEM der Leser eine
      // Bezüge-Zeile aufgeklappt hat (`bezuegeGeweckt`), und sie landet
      // ausschliesslich INNERHALB des `<details>`, das er dafür geöffnet hat.
      // Ein geschlossenes `<details>` rendert seinen Inhalt nicht — die 1685
      // anderen Artikel bleiben unberührt, es gibt keinen dokumentweiten
      // Layout-Sprung, und `leser-v3-kontext-cls` misst weiterhin dasselbe.
      // `alleFuer`, nicht `bezuegeFuer`: die Zeile zeigt, was ihre Kopfzahl
      // zählt — ungefiltert. Herleitung in `../bezuegeLaden` (D30).
      bezuegeImFuss={bezuege?.alleFuer(e.artikel)}
      materialien={artikelMaterialien(e.artikel)}
      onBezuegeOeffnen={weckeBezuege}
      onImBlatt={oeffneBlatt}
      // «lädt …» heisst: geweckt, aber der Lade-VERSUCH ist noch nicht durch.
      // `geladen` (nicht die Kanten) unterscheidet «unterwegs» von «leer» — die
      // A1-Lehre aus `panelModell.ts`, hier dieselbe Quelle (§5).
      bezuegeLaedt={bezuegeGeweckt && bezuege != null && !bezuege.geladen}
      // ── W2·5m · DIE PFEILE STEHEN NUR NOCH IM EINZELMODUS (D-E1) ────────
      // David 14.9.2026, wörtlich: «das bringt aber nur etwas wenn man einzeln
      // einen artikel hat. wenn man einfach scrollen kann dann bringt das ja
      // nichts». RÜCKBAU aus #854, keine Abschaltung: Komponente, Selektoren
      // (`data-artikel-nachbarn`, `data-nachbar`) und `./nachbarArtikel.ts`
      // bleiben unverändert — sie tragen jetzt den Modus, für den sie gebaut
      // wurden (Kap. 15.3). `.get()` liefert je Token DASSELBE Objekt (§15,
      // `memo`-Schranke); im Erlass-Modus ist der Wert konstant `undefined`.
      nachbarn={einzel ? nachbarn.get(e.artikel) : undefined}
      // Beide Pfeil-Paare tragen DIESELBE Adresse (B1) — s. die Prop selbst.
      nachbarnAdresse={einzel ? (t) => einzelAdresse(basisPfad, search, t, 'artikel') : undefined}
      // Kap. 15.5 · aus den Rubriken der Zeile werden gestapelte Blöcke —
      // DIESELBEN Marken, ein anderes Bild (`parts/ArtikelDossier.tsx`).
      fussForm={einzel ? 'dossier' : undefined}
      istAnhang={istAnhangToken(e.artikel)} />
  );

  // ── W2·5m · DER EINZELMODUS (Kap. 15.3) ───────────────────────────────────
  // Er ersetzt den Lesekörper, nicht die Spalte: Wurzelelement, Lesemass,
  // Satzspiegel und die Randnotiz-Split-Regel (`onClickCapture` unten) gelten
  // unverändert weiter — sie sind Eigenschaften der LESEFLÄCHE, nicht der Menge
  // der gezeigten Artikel. Gliederungspfad, Vorschau und Fuss stehen in
  // `./LeserEinzelAnsicht.tsx`; von hier kommt die fertige KARTE (§5).
  const einzelEintrag = einzelToken ? eintraege.find((e) => e.artikel === einzelToken) : undefined;

  const renderSektion = (s: Sektion, defOpen: boolean, randTiefe = 0): ReactNode => {
    const auf = istOffen(s.id, defOpen);
    const kinderRandTiefe = s.randtitel ? randTiefe + 1 : 0;
    // Kinder UND direkte Artikel in EINER nach Dokumentposition sortierten
    // Liste: ein Knoten kann seit 6b beides tragen.
    const inhalt = auf
      ? [
          ...s.kinder.map((k) => ({ pos: m.sekPos.get(k.id) ?? Infinity, el: renderSektion(k, true, kinderRandTiefe) })),
          ...s.artikel.map((e) => ({ pos: m.artIndex.get(e.artikel) ?? 0, el: artikel(e) })),
        ].sort((a, b) => a.pos - b.pos)
      : [];
    // ── EINE LINKE TEXTKANTE (Entscheid David 29.8.2026, wörtlich: «wichtige
    //    änderung … im gesetz die staffelung aufzuheben. es soll alles auf der
    //    selben höhe stehen. … analog zu fedlex») ────────────────────────────
    // Hier stand die Einzug-Skala V2·L-1 (`pl-einzug-mobil sm:pl-einzug`, Tiefe
    // 1–5 je eine 20-px-Stufe, mobil 12 px). Weil die `section`-Knoten INEINANDER
    // stecken, summierten sich die Stufen: gemessen @1440 hatte das OR SECHS
    // verschiedene linke Textkanten (554…654 px) und der Textkörper sechs
    // verschiedene Breiten (540…640 px); mobil @390 fünf Stufen à 12 px
    // (Kanten 20…80, Breiten 290…350 px). Ein Artikel war damit umso schmaler
    // gesetzt, je tiefer er in der Kodifikation steht — die dichtesten Stellen
    // des ZGB (Art. 105/125/208/416) bekamen die engste Spalte.
    //
    // NEU trägt die Tiefe allein die Zwischen-Überschrift (Typo-Rang 1 der
    // Rangfolge DESIGN-REGLEMENT §N-4b) — der Wortlaut selbst steht auf
    // EINER Kante, über alle Gliederungstiefen, Desktop wie mobil, wie bei
    // Fedlex. Die ABSATZ-Rinne (hängende Absatznummern, `pl-9 -indent-9` in
    // `ArtikelBody`) ist davon unberührt: sie ist amtliche Absatz-Auszeichnung,
    // keine Gliederungstiefe.
    //
    // Der Parameter `tiefe` fällt mit (§17 «gestrichen statt bewacht»): er hatte
    // nach dem Wegfall des Einzugs keinen Verbraucher mehr. `randTiefe` bleibt —
    // über sie staffelt `SektionKopf` weiterhin die ÜBERSCHRIFT (Rang 1).
    // Wächter: `e2e/leser-ohne-gliederungslinie.e2e.ts` («eine linke Textkante»).
    return (
      <section key={s.id} data-normtext-linie className="space-y-3">
        <SektionKopf s={s} refCb={regRef(s.id)} offen={auf} onToggle={() => toggle(s.id, defOpen)}
          bereich={m.sektionMeta.get(s.id)?.bereich} bereichEinzel={m.sektionMeta.get(s.id)?.einzel ?? false}
          amtlichUrl={verifizierLinkSektion(erlass, s.eId) ?? undefined}
          randTiefe={randTiefe} />
        {auf && <div className="space-y-5">{inhalt.map((x) => x.el)}</div>}
      </section>
    );
  };

  // ── F24 · DIE SPALTE LÄUFT DOKUMENTLINEAR (K-1a, W2·13-KANTONE, 31.8.2026) ─
  //
  // BIS HIERHER standen zwei Blöcke untereinander: erst ALLE Artikel aus
  // `ohneGliederung` (`<div className="space-y-5 mb-6">`), dann alle Sektionen.
  // Das stimmt genau so lange, wie die freien Artikel ein VORSPANN sind — und
  // das sind sie nicht immer. `baueGliederungsbaum` legt einen Artikel in
  // `ohneGliederung`, sobald er weder eine amtliche Gliederung noch eine
  // GETEILTE Randtitel-Stufe trägt; eine fehlende oder nur EINTEILIGE Marginalie
  // genügt. Solche Artikel stehen im Erlass mitten zwischen den Stufen — im
  // Markup sprangen sie an den Anfang. GEMESSEN 31.8.2026 am committeten Korpus
  // trifft das noch VIER Erlasse: BS-569.500 (§§ 3, 5, 7–9 vor §§ 1, 2, 4, 6,
  // 10), GR-310.250, ZG-641.1 und bund/KKV (Art. 126z Ziff. 2, Position 181
  // von 211, stand zuoberst — §9-Bug-Check 31.8. hat die Zählung unabhängig
  // re-deriviert; Testfall KKV in leser-lesereihenfolge-k1a).
  //
  // Das ist keine Kosmetik, sondern eine Falschaussage über den Erlass (§8): der
  // Leser liest eine Reihenfolge, die die amtliche Quelle nicht kennt.
  //
  // DERSELBE FIX, DEN DAS TOC-MODELL SEIT B2 (9.8.2026) HAT. `gliederungsModell`
  // ordnet dieselbe Klasse dort als Vorspann/Mittelgruppe/Nachspann
  // dokumentlinear ein — die Gliederungsleiste zeigte die Artikel also längst an
  // der richtigen Stelle, während die Lesespalte sie vorne stapelte: zwei
  // Aussagen über dieselbe Reihenfolge (§5). Massgeblich ist hier wie dort
  // allein die Dokumentposition (`artIndex` für Artikel, `sekPos` für Sektionen
  // = Index ihres ersten Artikels). Nichts wird geraten und nichts einer Sektion
  // zugeschlagen, zu der der Artikel amtlich nicht gehört.
  //
  // MARKUP-TREUE (die PX-Grenze oben): aufeinanderfolgende freie Artikel bleiben
  // EIN Block mit unverändertem `space-y-5 mb-6`. Liegen alle freien Artikel vor
  // dem Baum — der Regelfall, insbesondere jeder Erlass ganz ohne Sektionen —,
  // entsteht exakt dieselbe Elementfolge wie vorher; Keys erscheinen nicht im
  // Markup. Nur die drei betroffenen Erlasse ändern sich, und genau dort ist die
  // Änderung der Zweck. Wächter: `src/tests/leser-lesereihenfolge-k1a.test.tsx`.
  const dokumentLinear = (): ReactNode[] => {
    const posten = [
      ...sektionen.map((s) => ({ pos: m.sekPos.get(s.id) ?? Infinity, sek: s, frei: null as (typeof eintraege)[number] | null })),
      ...ohneGliederung.map((e) => ({ pos: m.artIndex.get(e.artikel) ?? 0, sek: null as Sektion | null, frei: e })),
    ].sort((a, b) => a.pos - b.pos);

    const bloecke: ReactNode[] = [];
    let lauf: typeof ohneGliederung = [];
    const spuele = () => {
      if (lauf.length === 0) return;
      bloecke.push(<div key={`frei-${lauf[0].artikel}`} className="space-y-5 mb-6">{lauf.map((e) => artikel(e))}</div>);
      lauf = [];
    };
    for (const p of posten) {
      if (p.frei) { lauf.push(p.frei); continue; }
      spuele();
      bloecke.push(renderSektion(p.sek as Sektion, true));
    }
    spuele();
    return bloecke;
  };

  return (
    // ── Ä2 · SATZSPIEGEL V3 (historisch 40 rem; seit 21.8. LESEMASS_MAX 45 rem, seit 29.8. zusätzlich 1C-Zeichen-Deckel — massgeblich index.css --leser-zeilenmass) (Entscheid 16.8.2026, Design-Grundlage
    // Kap. 3) ──────────────────────────────────────────────────────────────
    // Bis hierher stand `max-w-normtext` (42 rem), byte-gleich aus der
    // Ist-Hülle. Gemessen blieben davon in V3 aber nur 556–616 px @1280 übrig,
    // weil die 18-rem-Seitenleiste vorher Breite nimmt: der Lesetext war
    // schmaler als sein eigenes Mass und schwankte mit dem Klapp-Zustand.
    // `max-w-reading` (40 rem) ist ein BESTEHENDES Haus-Token, kein Ad-hoc-Wert.
    //
    // DEKLARIERTE ÄNDERUNG AN DER PX-REGION (Herleitung, historisch): der
    // Textkörper wurde schmaler, die V3-Baseline damals einmalig neu gesetzt —
    // zulässig, weil der frühere Pixelvergleich (`e2e/px-textkoerper.e2e.ts`,
    // A-7, V1 gegen V3) bei GLEICHER Artikelbreite mass, den Text-KERN also
    // unabhängig vom Satzspiegel bewies. Mit H5 (21.8.2026) gelöscht — V1, das
    // Vergleichsziel, gibt es nicht mehr.
    <div ref={leseRef} id="lc-lesespalte" className="mx-auto w-full max-w-reading"
      // ── W2·24-R6 · SPLIT-REGEL DER RANDNOTIZ (Auftrag David 6.9.2026) ──────
      // Ein Bezug am Rand öffnet in der ANDEREN Hälfte; der Artikel bleibt
      // stehen. Die Regel selbst (Modifikatoren, externe Ziele, Dedup) ist rein
      // und liegt in `../randNotizOeffnen` — hier steht nur die Verdrahtung.
      //
      // WARUM DELEGIERT UND NICHT AM LINK: `usePaneSteuerung` liefert bei jedem
      // Shell-Render ein neues Objekt (`Shell.tsx`, Objektliteral). Ein Abo je
      // Artikel hiesse auf dem OR 1'686 Abonnenten, die bei jedem
      // Scroll-Spy-Takt neu rendern — genau die Bauart, die §15.4 an dieser
      // Spalte verbietet. EIN Abo an der Spalte, ein Handler, kein Prop durch
      // die memoisierte Artikelkette.
      //
      // ── W2·26/Z5 · D45 (Mandat David 11.9.2026) · DIE AUFGEKLAPPTE RUBRIK
      //    «ENTSCHEIDE» IST DERSELBE APPARAT ─────────────────────────────────
      // BEFUND (Fahrplan D45, Nebenfund des D41-Fixers): ein Klick auf einen
      // Entscheid IN der Funktionszeile navigierte die ganze Seite weg, während
      // derselbe Entscheid in der Randnotiz daneben aufging. Zwei Gesten für
      // dieselbe Absicht — und die schlechtere dort, wo die Liste seit D34/D35
      // eigentlich zuhause ist.
      //
      // DER JURISTISCHE GRUND IST WORTGLEICH DER VON R6 (`../randNotizOeffnen`):
      // ein Bezug am Artikel wird GEPRÜFT, nicht besucht; der Artikel muss
      // stehen bleiben, sonst liest man den Entscheid ohne die Norm. Genau
      // darum ist das hier KEINE zweite Regel, sondern DERSELBE Aufruf mit
      // einem zweiten Herkunfts-Ort (§5): ⌘/Strg-Klick bleibt neuer Reiter,
      // Mittel-/Umschalt-Klick bleiben dem Browser, ein schon offenes Ziel wird
      // nicht zweimal geöffnet, und wo keine zweite Hälfte möglich ist
      // (schmales Fenster, Pane-Kontingent voll) navigiert der Klick wie bisher
      // — `kannOeffnen` entscheidet das, nicht diese Stelle.
      //
      // NUR `[data-reg="r"]`: «Materialien», «Verweise» und «Rechner» führen zu
      // Seiten, die man BESUCHT (ein Rechner, eine Botschaft, ein anderer
      // Artikel) — dort ist Navigation die richtige Geste, und der Unterschied
      // zwischen Apparat und Navigation ist genau der, den R6 gezogen hat. Der
      // Neben-Griff «im Blatt öffnen ›» (D35-F2) bleibt unberührt: er ist ein
      // `<button>`, kein `<a>`, und fällt durch `closest('a')` ohnehin heraus.
      onClickCapture={(ev) => {
        const ziel = (ev.target as HTMLElement | null)?.closest?.('a');
        if (!ziel || !ziel.closest('.lr-notiz, .lr7-bez-block[data-reg="r"]')) return;
        if (randNotizZiel(ev, ziel.getAttribute('href'), kannOeffnen, paneOffen) !== 'daneben') return;
        ev.preventDefault();
        oeffneDaneben(ziel.getAttribute('href') as string);
      }}>
      {einzelEintrag
        ? (
          <LeserEinzelAnsicht m={m} karte={artikel(einzelEintrag, true)} search={search}
            token={einzelEintrag.artikel} label={labelMitBereich(einzelEintrag.artikelLabel, einzelEintrag.artikel)}
            nachbarn={nachbarn.get(einzelEintrag.artikel)}
            bestimmungsWort={bestimmungsWort(erlass.key)} />
        )
        : <div className="space-y-2">{dokumentLinear()}</div>}

      {/* ── B9 (Klick-Test) → B6 (H4-Nachzug 18.8.2026) · DIE SEITE LÄUFT QUER ─
          GEMELDET war «ZH-211.11 § 4: Tabelle 81 px Seiten-Überlauf @390 trotz
          `.lc-scroll-x`». NACHGEMESSEN 18.8.2026 (390×844, V3 UND V1, je 81 px
          Überlauf) ist die Zuordnung FALSCH — und das ist der eigentliche Fund:
            · Die Tabelle in § 4 ist 1002 px breit und sitzt KORREKT in ihrem
              Scroller (`span.lc-scroll-x`: clientWidth 312, scrollWidth 1002,
              `overflow-x: auto`). Sie läuft nirgends über. Wer sie über ihren
              `getBoundingClientRect` misst, misst die Breite INNERHALB des
              Scrollers und hält sie für Seitenbreite.
            · Der einzige UNGEKLIPPTE Überläufer der Seite ist dieser Link:
              «Notariatsgebührenverordnung (NotGebV) ›», 191 px breit, rechte
              Kante bei 471 in einem 390-Fenster — exakt die gemeldeten 81 px.
              (Sonde: jedes Element mit `right > clientWidth`, das KEINEN
              klippenden Vorfahren hat. Ohne diesen zweiten Filter meldet eine
              Überlauf-Sonde den Inhalt jedes Scrollers mit.)
          URSACHE: drei Flex-Kinder ohne `min-w-0`. Ein Flex-Kind schrumpft nicht
          unter seine `min-content`-Breite, und die ist hier das längste Wort —
          «Notariatsgebührenverordnung». Dass der Kürzel-Wert an diesem Erlass der
          Volltitel ist, ist ein eigener DATEN-Befund (Klick-Test C3); die Zeile
          darf aber an KEINEM Wert brechen: ein Kürzel ist eine Zeichenkette aus
          den Daten, keine Zusage über ihre Länge.
          FIX: `min-w-0` lässt schrumpfen, `[overflow-wrap:anywhere]` lässt das
          lange Wort umbrechen statt hinauszuragen; «Übersicht» in der Mitte hält
          seine Breite (`shrink-0`), sie ist kurz und konstant. KEIN Ellipsis: der
          Name des Nachbar-Erlasses ist die ganze Auskunft dieser Zeile (§8,
          Ä15-Klasse). Wortgleich in `../inhalt-volltext.tsx` — V1 zeigt denselben
          Überlauf aus derselben Ursache (§5).
          Wächter: `e2e/leser-kein-seitenueberlauf.e2e.ts`, beide Hüllen. */}
      <nav className="mt-12 border-t border-line pt-5 flex justify-between gap-4 text-body-s" aria-label="Weitere Erlasse">
        {vorher ? <Link to={erlassPfad(vorher)} className="min-w-0 text-ink-900 [overflow-wrap:anywhere]">‹ {vorher.kuerzel}</Link> : <span />}
        {/* ── Ä119 (Live-Ästhetik-Prüfung 18.8.2026) · «ÜBERSICHT» WAR DOPPELT
            BELEGT ───────────────────────────────────────────────────────────
            GEMESSEN am Live-Stand @1440: das Wort «Übersicht» bezeichnete auf
            DERSELBEN Seite zwei verschiedene Dinge — die Steckbrief-Box der
            Seitenleiste («▸ Übersicht  SR 312.0 · 480 Artikel») und diesen Link
            in der Fuss-Navigation, der auf `/gesetze` führt, also die Liste
            ALLER Erlasse. Wer «Übersicht» gelesen hatte und es unten wiederfand,
            durfte den Steckbrief erwarten und bekam die Gesetzesliste.
            ENTSCHIEDEN (Glossar, Design-Grundlage Abschnitt «Benennung»): die
            Box behält «Übersicht» — sie steht dort seit H2b, ist der häufigere
            Begriff und meint tatsächlich eine Übersicht ÜBER DIESEN Erlass. Der
            Link sagt jetzt, wohin er führt: «Alle Gesetze».
            `shrink-0` bleibt (B6): die Beschriftung ist kurz und konstant, sie
            gibt in der Zeile nicht nach — nachgeben sollen die Erlass-Namen
            links und rechts, deren Länge aus den Daten kommt. */}
        <Link to="/gesetze" className="shrink-0 text-ink-500 hover:text-ink-900">Alle Gesetze</Link>
        {nachher ? <Link to={erlassPfad(nachher)} className="min-w-0 text-right text-ink-900 [overflow-wrap:anywhere]">{nachher.kuerzel} ›</Link> : <span />}
      </nav>
    </div>
  );
}
