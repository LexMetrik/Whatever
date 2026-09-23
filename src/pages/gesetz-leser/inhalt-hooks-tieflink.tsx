// ─── Tieflink-Sprung des Lesers (§6.6-Split, W2·24-DESIGN-IDENTITAET) ───────
//
// EIN kontiguer Block aus `useLeserSprungSpy` (inhalt-hooks.tsx), Wort fuer
// Wort unveraendert hierher gezogen: der Hash-Seed-Waechter, sein Ruecksetzer
// und der Tieflink-Sprung samt R6/L1-Verdeckung. Der Block sass am ANFANG des
// Hooks, vor dem Scroll-Spy — `useLeserSprungSpy` ruft diesen Hook an exakt
// derselben Stelle, an der die drei Aufrufe (useRef · useEffect ·
// useIsoLayoutEffect) vorher standen. Damit ist die HOOK-REIHENFOLGE
// byte-identisch und der Split verhaltensneutral (§6): keine Dependency-Liste,
// keine Bedingung, keine Reihenfolge veraendert.
//
// WARUM EIGENE DATEI. `inhalt-hooks.tsx` stand nach R10 bei 839 Zeilen (§6.6-
// Schwelle 800). Der Tieflink-Sprung ist der einzige grosse Block, der sich
// ohne Eingriff in den Scroll-Spy loesen laesst: er teilt mit dem Rest weder
// Ref noch Closure ausser `setOffen` (hier als `oeffnePfad` gekapselt, das
// ausserhalb dieses Blocks niemand mehr braucht). Der Spy selbst bleibt
// bewusst in `inhalt-hooks.tsx` — die Quellensonden in
// `leser-adresse-lm202.test.ts` und `tab-titel-paritaet.test.ts` bewachen ihn
// genau dort, und ein Refactoring passt keine Tests an (§6.3).

import { useEffect, useLayoutEffect, useRef, type Dispatch, type RefObject, type SetStateAction } from 'react';
import { aktualisiereTabArtikel } from '../../lib/tabs';
import { istHashVerbraucht } from './scrollAnker';
import { pfadZu } from './helpers';
import { kanonischerAnkerToken } from './suchTreffer';
import { paneRoot, findeArt } from './berechnungen';
import type { Sektion } from '../../lib/normtext/browse';
import type { NormSnapshot } from '../../lib/normtext/typen';

/**
 * Layout-Effekt im Browser, gewoehnlicher Effekt im Prerender (W2·24-R6/L1).
 *
 * Wortgleich zu `useIsoLayoutEffect` in `App.tsx` — dort steht die Herleitung.
 * Gebraucht wird er hier fuer den Tieflink-Sprung: er muss VOR dem ersten Paint
 * laufen, und `useLayoutEffect` warnt im Server-Render.
 */
const useIsoLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

/** Der Hash-Seed-Sprung. Signatur = genau die Werte, die der Block gelesen hat. */
export function useTieflinkSprung(opts: {
  ebene: string;
  schluessel: string;
  eintraege: NormSnapshot[] | null;
  sektionen: Sektion[];
  istSekundaer: boolean;
  imPane: boolean;
  wurzel: RefObject<HTMLElement | null> | null;
  paneLocationHash: string;
  artLabelByToken: Map<string, string>;
  setOffen: Dispatch<SetStateAction<Record<string, boolean>>>;
  setAktArtikel: Dispatch<SetStateAction<string | null>>;
  setAktivIds: Dispatch<SetStateAction<string[]>>;
}): void {
  const {
    ebene, schluessel, eintraege, sektionen, istSekundaer, imPane, wurzel,
    paneLocationHash, artLabelByToken, setOffen, setAktArtikel, setAktivIds,
  } = opts;

  const oeffnePfad = (ids: string[]) => setOffen((o) => {
    const n = { ...o }; for (const id of ids) n[id] = true; return n;
  });

  // E3/A34 (David 16.7.2026): der Seed-Sprung unten darf pro Erlass-Ladung NUR
  // EINMAL feuern — nicht erneut, wenn die Einzelansicht in den Split-View kippt
  // (`imPane`/`wurzel` wechseln von false→true). Sonst las der Effekt beim Pane-
  // Öffnen erneut `window.location.hash` (= der zuvor angeklickte Artikel) und
  // sprang das frisch weitergescrollte Gesetz-Pane auf diesen früheren Artikel
  // zurück (Scroll-Verlust, §15 Funktions-Treue «Split-View-Pane-Zustand»). Der
  // Wächter wird pro Erlass zurückgesetzt; spätere Hash-Wechsel trägt ohnehin der
  // letzteNavKey-Effekt (Primär) bzw. die eigene Pane-History (A16/A17).
  const hashSeedGetan = useRef(false);
  useEffect(() => { hashSeedGetan.current = false; }, [ebene, schluessel]);

  // Hash-Sprung: alle Vorfahren des Ziel-Artikels öffnen + scrollen.
  // W2·5d U-POSITION/A17: auch im SEKUNDÄREN Pane an die Fundstelle springen —
  // der ⧉-Öffner legt den Pfad MIT `#art-token` ab (NormPopover readerLink), aber
  // die Fundstelle stand bisher nur in `window.location.hash` (= die Haupt-URL,
  // NICHT der Pane-Pfad) und der Effekt brach für Panes ab ⇒ das Pane öffnete oben
  // statt an der Norm. Quelle des Hashs ist im Pane die PANE-LOKALE Location
  // (`<Routes location={loc}>` → react-router `useLocation()` liefert den Pane-Pfad),
  // sonst wie bisher die echte Fenster-URL (Primär/Einzelansicht byte-gleich).
  useIsoLayoutEffect(() => {
    if (!eintraege || !sektionen.length || typeof window === 'undefined') return;
    // A34: nur der ERSTE inhaltsbereite Lauf sät den Sprung. Danach gesperrt —
    // ein `imPane`/`wurzel`-Wechsel (Split-View öffnet) re-triggert den Effekt,
    // darf aber NICHT erneut an den (alten) Hash springen. Wächter VOR dem Hash-
    // Test setzen, damit auch ein hashloser Erststart den späteren Re-Lauf sperrt.
    if (hashSeedGetan.current) return;
    hashSeedGetan.current = true;
    // LM-199 (W2·17-UI-BEFUNDE-B2): VERBRAUCHTER Einstiegs-Hash — beim Browser-
    // Zurück aus einer anderen Route steht der alte «#art-…» noch in der URL,
    // massgeblich ist aber die A16-Anker-Restauration (App.tsx). Ohne diesen
    // Wächter kaperte der Seed-Sprung nach dem Remount die Rückkehr-Position
    // erneut (Prod-Messung 2.8.2026: ~149'000 px daneben). Nur Primär — das
    // sekundäre Pane hat seine eigene, frisch geseedete Location (A17).
    if (!istSekundaer && istHashVerbraucht()) return;
    const hashQuelle = istSekundaer ? paneLocationHash : window.location.hash;
    const m = hashQuelle.match(/^#art-(.+)$/);
    if (!m) return;
    // Deep-Link mit Artikel-Anker → aktiven Reiter darauf melden (Live-Label).
    // Sekundäres Pane treibt den globalen Reiter-Tracker NICHT (es ist nicht die URL).
    if (!istSekundaer) aktualisiereTabArtikel(window.location.pathname + window.location.search + window.location.hash);
    // Nebenfund S6 (23.9.2026): «#art-336c» trifft den Token «336_c» (`./suchTreffer`).
    const token = kanonischerAnkerToken(decodeURIComponent(m[1]), eintraege?.map((e) => e.artikel) ?? []);
    const ids = pfadZu(sektionen, (s) => s.artikel.some((e) => e.artikel === token)) ?? [];
    // LM-157 (W2·17-UI-BEFUNDE-B4): der Seed-Sprung öffnete den TOC-Pfad
    // (`oeffnePfad`) und scrollte den Text, setzte aber nie `aktivIds`/`aktArtikel`
    // selbst — beides blieb dem IntersectionObserver-Scroll-Spy weiter unten
    // überlassen. Bei einem frischen Aufruf mit `#art-…`-Anker beobachtete der Spy
    // den programmatischen Sprung nicht zuverlässig (Ziel ist im selben Frame noch
    // nicht am Bezugspunkt), darum blieben Gliederung UND Breadcrumb auf dem
    // Dokumentanfang stehen, bis von Hand gescrollt wurde. Fix: dieselben zwei
    // State-Setter, die auch der Klick-Sprung (springeZuSektion) und der laufende
    // Scroll-Spy (unten, Z. ~421/453) verwenden — hier synchron mit dem Seed statt
    // erst nach dem ersten manuellen Scroll.
    if (ids.length) {
      setAktivIds(ids);
      const artLabel = artLabelByToken.get(token) ?? `Art. ${token.replace(/_/g, '')}`;
      setAktArtikel(artLabel);
    }
    if (ids.length) oeffnePfad(ids);
    // ═══ W2·24-R6/L1 · DER TIEFLINK-SPRUNG WIRD NICHT GEMALT, BEVOR ER STEHT ══
    //
    // BEFUND (gemessen 6.9.2026, `dist/`-Preview, Chromium @390×844, je 3 Läufe
    // mit byte-gleichem Ergebnis): CLS **1.1664** auf OR#art-336_c, **0.9307**
    // auf OR#art-1, **0.5749** auf ZGB#art-457 — gegen **0.0362** ohne Anker
    // (ZPO). Der Anker war der Fall, nicht der Erlass.
    //
    // WAS WIRKLICH PASSIERT (Frame-Trace, `requestAnimationFrame`):
    //   t≈1313 ms  Artikel im DOM, scrollY 219'766, docH 828'570
    //   t≈1362 ms  scrollY 221'226, docH 830'803
    //   t≈1440 ms  scrollY 221'403 — steht
    // Also DREI gemalte Lagen desselben Sprungs. Ursache ist
    // `content-visibility:auto`: die 1'000+ Artikel VOR dem Ziel tragen
    // Platzhalterhöhen (`schaetzeArtikelHoehe`), solange sie nie im Bild waren.
    // Der Sprung rechnet mit diesen Schätzungen, macht dabei die Nachbarschaft
    // des Ziels «relevant», die echten Höhen laufen ein — und das Ziel wandert
    // um 1'637 px. Weil sich dabei auch die Höhen ändern, verbucht der Browser
    // die Bewegung nicht als Scroll, sondern als unerwartete Verschiebung.
    //
    // ZWEI WEGE, DIE NICHT FUNKTIONIEREN — beide gemessen, beide verworfen:
    //  (a) Sprung in den Layout-Effekt ziehen (statt `useEffect` nach dem Paint):
    //      richtig und nötig, aber allein wirkungslos — CLS blieb byte-gleich
    //      1.1664. Die erste Lage wird dann eben vor dem Paint eingenommen; die
    //      beiden Korrekturen danach bleiben.
    //  (b) Die Korrektur in denselben Tick schleifen (`scrollIntoView` +
    //      `getBoundingClientRect` bis zur Konvergenz): ebenfalls wirkungslos,
    //      wieder 1.1664. `getBoundingClientRect` erzwingt zwar das Layout, aber
    //      die RELEVANZ eines `content-visibility`-Teilbaums entscheidet der
    //      Browser erst im nächsten Rendering-Lifecycle — im selben Tick sieht
    //      die Schleife immer dieselbe Schätzung und bricht nach zwei Runden ab.
    //
    // DER WEG, DER FUNKTIONIERT: die Lesespalte wird für die Dauer des
    // Einschwingens NICHT GEMALT (`visibility:hidden`, Klasse `.lr6-anker-
    // warten`). Sie behält ihren Platz — die Höhe steht, nichts springt —, und
    // was nicht gemalt wird, kann auch nicht verrutschen: der Browser zählt
    // Verschiebungen nur an sichtbaren Knoten. Sichtbar wird die Spalte erst,
    // wenn die Lage zwei Frames lang steht. Der Leser bekommt damit statt
    // dreier Sprünge EIN Bild, und zwar das richtige.
    //
    // DREI KLAMMERN, damit daraus nie eine leere Seite wird:
    //  · findet der Effekt den Artikel nicht, wird gar nichts versteckt;
    //  · die Aufräum-Funktion des Effekts deckt auf (Abbruch/Unmount);
    //  · ein Zeitdeckel (`AUFDECK_MS`) deckt in jedem Fall auf, auch wenn die
    //    Lage unter Last nie zwei Frames lang steht.
    // Der Schalter sitzt an der WURZEL, nicht an der Lesespalte: verdeckt werden
    // muss auch der Seitenfuss. GEMESSEN auf OR#art-1 (dem Tieflink mit dem
    // KÜRZESTEN Sprung, 1'011 px): dort zeigte der Zwischenframe den Fuss bei
    // y 95 mit 749 px Höhe im Bild, und sein Verschwinden allein trug 0.8874
    // des CLS. Ein Fuss, der für zwei Frames am Kopf des Dokuments steht, ist
    // dieselbe Verschiebung wie ein springender Artikel — nur an einem anderen
    // Knoten. Welche Flächen still bleiben, sagt die Regel in `index.css`.
    const wurzelEl = typeof document !== 'undefined' ? document.documentElement : null;
    wurzelEl?.setAttribute('data-lr6-anker-warten', '');
    let aufgedeckt = false;
    const aufdecken = () => { aufgedeckt = true; wurzelEl?.removeAttribute('data-lr6-anker-warten'); };
    const ziel = () => findeArt(paneRoot(imPane, wurzel), token);
    // R1: oberer Lese-Rand statt Mitte (deckt sich mit der Scroll-Spy-Bezugslinie).
    // EINE Sprung-Stelle für Erst-Sprung, Einschwingen und Nachzug (§5).
    const springe = (el: HTMLElement) => el.scrollIntoView({ block: 'start', behavior: 'auto' });
    const erstZiel = ziel();
    if (erstZiel) {
      springe(erstZiel);
      erstZiel.classList.add('lc-ziel-blink');
      window.setTimeout(() => erstZiel.classList.remove('lc-ziel-blink'), 2400);
    }
    // Deckel für den Aufdeck-Zeitpunkt. GEMESSEN schwingt der Sprung nach
    // 127 ms ein (1313 → 1440); 600 ms ist das Vierfache davon und damit die
    // Reserve für langsame Geräte, nicht der Regelfall.
    const AUFDECK_MS = 600;
    const deckel = window.setTimeout(aufdecken, AUFDECK_MS);
    // ── W2·24-D34 · DER NACHZUG: WAS NACH DEM AUFDECKEN NOCH WÄCHST ─────────
    //
    // BEFUND (CI-Rot 34111127560, Shard 5; lokal byte-gleich nachgestellt,
    // `dist/`-Preview, Chromium 1440×900, 6× CPU-Drossel, rAF-Sampler auf
    // `/gesetze/bund/BV#art-8`):
    //     t 6046 ms  Lage steht, Verdeckung fällt — Ziel bei 154 px
    //                (= Landepunkt), 0 Bezüge-Zeilen im Dokument
    //     t 7099 ms  145 Bezüge-Zeilen da, davon 7 oberhalb des Ziels,
    //                docH 118'314 → 119'000 — Ziel bei 203 px
    // Die Zähl-Datei (`../bezuegeZaehler`) entscheidet, OB ein Artikel eine
    // Bezüge-Zeile bekommt (§8: keine Rubrik ohne echte Zahl). Bei der BV führt
    // vor ihrem Eintreffen KEIN Artikel eine Zahl aus statischer Quelle; die
    // Zeile ist seit D34 der Artikel-FUSS und damit 49 px hoch. Ihr Zuwachs
    // liegt also ZWISCHEN dem Scroll-Anker des Browsers (oberer Bildrand) und
    // dem Ziel — den Teil oberhalb des Ankers fängt die Scroll-Verankerung auf,
    // diesen nicht, und das Ziel rutscht um genau eine Zeilenhöhe ab.
    //
    // NICHT DER WEG: die Datei früher laden. GEMESSEN (Netz-Zeitleiste): sie
    // ist bei t 1116 ms fertig — 5 s vor dem Aufdecken. Was fehlt, ist nicht
    // das Byte, sondern die ZWEITE Render-Runde: ein Fetch-Ergebnis kann
    // frühestens im Folge-Render stehen, und der lag unter Last hinter dem
    // Einschwingen. Ein Vorziehen des Fetch (probiert, gemessen, verworfen)
    // ändert daran nichts und kostet nur die Leerlauf-Schonung (§15).
    //
    // DER WEG: dieselbe Schleife läuft weiter, nur mit anderem Auftrag. Bis zum
    // Aufdecken zieht sie JEDEN Frame nach (unverändert); danach fasst sie
    // nichts mehr an, ausser das Ziel ist von seiner eingeschwungenen Lage
    // WEGGELAUFEN — dann stellt sie es einmal zurück. Das ist keine Animation
    // und kein zweites Bild: die Korrektur ist ein SCROLL, der einen Zuwachs
    // oberhalb ausgleicht, und macht damit genau das sichtbar-Nichts, das die
    // Scroll-Verankerung des Browsers hier nicht leisten kann.
    //
    // ZWEI KLAMMERN. (1) `NACHZUG_MS` — gemessene Verzugszeit 1053 ms bzw.
    // 1665 ms in zwei Läufen; 4000 ms ist rund das Doppelte des schlechteren
    // und deckt den 2-vCPU-Runner. (2) ÜBERNAHME durch den Leser: wer scrollt,
    // tippt oder klickt, bestimmt die Lage selbst — dieselben vier Ereignisse,
    // mit denen auch die Zielansage aufhört (`components/layout/
    // DeepLinkSkeleton.tsx`); ein Nachzug, der gegen den Leser scrollt, wäre
    // schlimmer als der Versatz, den er heilt.
    const NACHZUG_MS = 4000;
    let ruhig = 0;
    // Gemessen wird die LAGE DES ZIELS im Bild, nicht `window.scrollY`: im
    // sekundären Pane scrollt nicht das Fenster, sondern der Pane-Scroller —
    // die Fensterposition stünde dort von Anfang an still und der Deckel wäre
    // die einzige Klammer (§5: eine Grösse, die in beiden Lagen dasselbe misst).
    // Aus demselben Grund misst auch der Nachzug den ABSTAND ZUR LETZTEN LAGE
    // und nicht den Landepunkt: `scroll-margin-top` gilt gegen den Scroll-
    // Container, nicht gegen den Bildschirm — im Pane wäre der Vergleich falsch.
    let letzteLage = Number.NaN;
    let rafId = 0;
    let fertig = false;
    // ── W2·24-D34/2 · WER BESITZT DEN SCROLL GERADE (§5) ────────────────────
    //
    // BEFUND (CI-Rot 34117385177, Shard 1, `e2e/leser-history-hash.e2e.ts:21`;
    // lokal 3/3 byte-gleich nachgestellt, `dist/`-Preview, Chromium 1440×900,
    // Port 4424). Die Sonde springt per Tieflink auf `AIG#art-90` und scrollt
    // dann PROGRAMMATISCH zu Art. 5. Zwei `scroll`-Ereignisse, 10 ms auseinander:
    //     t 1458 ms  scrollY 3'280   — Art. 90 bei 92'403 px (weit unterhalb)
    //     t 1468 ms  scrollY 95'529  — Art. 90 wieder bei 154 px
    // Die zweite Zeile ist der Nachzug: er las «das Ziel ist von seiner Lage
    // weggelaufen» und zog zurück. Der Anker-Spy sah damit nie Art. 5, die
    // A16-Leseposition blieb Art. 90 — die ganze LM-199-Kette fiel.
    //
    // WURZEL: die Schleife kannte NUR die Frage «hat sich die Lage geändert?»,
    // nicht die Frage «von wem?». Zuwachs oberhalb (der D34-Fall) und ein
    // FREMDER Scroll erzeugen dasselbe Signal. Die vier Übernahme-Ereignisse
    // unten fangen den Menschen (Rad, Tippen, Tippen auf den Schirm, Zeiger),
    // aber keinen Scroll aus Code — Playwrights `scrollIntoViewIfNeeded`, die
    // A16-Konvergenzschleife, ein `scrollTo` aus einem anderen Baustein.
    //
    // DER MASSSTAB, und er ist hergeleitet, nicht gewählt: unkompensiert kann
    // das Ziel nur das verschieben, was ZWISCHEN dem oberen Bildrand (dem
    // Scroll-Anker des Browsers) und dem Ziel wächst — und das Ziel steht per
    // Konstruktion am Landepunkt, also im ERSTEN Bild. Ein Nachzug bewegt es
    // darum höchstens um eine Bildhöhe. Ein Ziel, das das Bild VERLASSEN hat,
    // ist kein Nachzug-Fall, sondern ein fremder Scroll: dann gibt die Schleife
    // ab, statt zurückzureissen. Damit gibt es genau EINEN Eigentümer des
    // Scrolls je Zeitpunkt (§5) statt zweier Schleifen im Rennen.
    //
    // GEMESSEN wird die Bildhöhe am FENSTER, auch im Pane: `getBoundingClient-
    // Rect().top` ist immer fenster-relativ, und das Pane liegt im Fenster —
    // eine Grösse, die in beiden Lagen dasselbe misst (wie oben bei `letzteLage`).
    //
    // DER SCHALTER IST NICHT `aufgedeckt`, SONDERN `eingeschwungen`. Deckt der
    // Zeitdeckel (`AUFDECK_MS`) auf, WÄHREND die Lage noch wandert, steht das
    // Ziel u. U. gar nicht im Bild — eine Abgabe in diesem Moment liesse den
    // Leser irgendwo stehen. Erst wenn die Lage zwei Frames ruhig war, ist der
    // Landepunkt erreicht und «ausserhalb des Bildes» aussagekräftig.
    //
    // NICHT NOCHMAL GEBAUT (§17-Gegengewicht): «nur beim echten Tieflink-
    // Einsprung» steht bereits zweimal weiter oben — `istHashVerbraucht()`
    // (Z. 95) sperrt Zurück/Vorwärts aus einer anderen Route, `hashSeedGetan`
    // (Z. 87) den Pane-Wechsel. Beim Browser-Zurück läuft dieser Effekt also
    // gar nicht erst bis hierher; die Sonde unten belegt das.
    let eingeschwungen = false;
    const UEBERNAHME = ['wheel', 'touchstart', 'keydown', 'pointerdown'] as const;
    const beende = () => {
      if (fertig) return;
      fertig = true;
      window.clearTimeout(deckel);
      window.clearTimeout(nachzugDeckel);
      window.cancelAnimationFrame(rafId);
      for (const ev of UEBERNAHME) window.removeEventListener(ev, beende);
      aufdecken();
    };
    const nachzugDeckel = window.setTimeout(beende, NACHZUG_MS);
    for (const ev of UEBERNAHME) window.addEventListener(ev, beende, { passive: true, once: true });
    const nachziehen = () => {
      if (fertig) return;
      const el = ziel();
      if (!el) { beende(); return; }
      const vorLage = el.getBoundingClientRect().top;
      // Ziel ausserhalb des Bildes ⇒ der Scroll gehört jemand anderem: abgeben.
      if (eingeschwungen && (vorLage < 0 || vorLage > window.innerHeight)) { beende(); return; }
      // Verdeckt: jeden Frame nachziehen. Aufgedeckt: nur bei Weglaufen.
      if (!aufgedeckt || Math.abs(vorLage - letzteLage) > 1) springe(el);
      const lage = el.getBoundingClientRect().top;
      ruhig = Math.abs(lage - letzteLage) <= 1 ? ruhig + 1 : 0;
      if (ruhig >= 2) {
        eingeschwungen = true;
        if (!aufgedeckt) { window.clearTimeout(deckel); aufdecken(); }
      }
      letzteLage = lage;
      rafId = window.requestAnimationFrame(nachziehen);
    };
    rafId = window.requestAnimationFrame(nachziehen);
    return beende;
    // location.hash bewusst NICHT in den Deps: der Effekt springt EINMAL beim
    // Erlass-Laden an die (Pane-lokale bzw. Fenster-)Fundstelle — die Primär-
    // Instanz führt spätere Hash-Wechsel über den letzteNavKey-Effekt nach
    // (kein Doppel-Sprung/-Blink), das Pane öffnet an seiner Seed-Fundstelle.
    // Die `eslint-disable`-Zeile für `react-hooks/exhaustive-deps` ist mit R6
    // ERSATZLOS weg: sie stand über einem `useEffect`, das die Regel geprüft
    // hätte — `useIsoLayoutEffect` ist ein Alias, den die Regel gar nicht
    // ansieht, und eine Ausnahme von einer Prüfung, die nicht stattfindet, ist
    // eine tote Zeile (eslint meldet sie selbst als «unused directive»). Die
    // Dep-Liste bleibt byte-gleich; abgeschaltet war die Prüfung vorher wie
    // nachher.
  }, [eintraege, sektionen, istSekundaer, imPane, wurzel]);
}
