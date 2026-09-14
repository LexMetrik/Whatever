import { useEffect, useRef, useState, type RefObject } from 'react';
import { Link } from 'react-router-dom';
import { tabSchluessel, reiterKurzformTeile, reiterKurzformText, reiterTitel, type TabEintrag } from '../../../lib/tabs';
import type { VerlaufManifeste } from '../../../lib/verlaufLabel';
import { registerVonPfad, REG_FLAECHE, REG_TON } from '../bereiche';
import { SchliessKnopf } from '../../ui/SchliessKnopf';
import { REITER_MIME } from './ueberlauf';

// ═══ EIN REITER (§6.6-Split aus `Reiterleiste.tsx`, R13) ════════════════
//
// Wörtlich aus der Leiste herausgelöst — Ziehen, Kontextmenü-Auslöser,
// Registerfarbe, Fenster-Marke, Griffe. Die Leiste behält, was ÜBER den
// Reitern steht (Fenster, Tastatur, Überlauf, Blatt); dieser Baustein weiss
// nur, wie EIN Reiter aussieht und welche Rückrufe er auslöst (§3).

export interface ReiterProps {
  t: TabEintrag;
  /** 1-basierte Stelle in der GESPEICHERTEN Ordnung — nicht im Fenster:
   *  «Reiter 3» und Alt+3 meinen denselben Reiter, auch wenn das sichtbare
   *  Fenster ihn an erster Stelle zeigt (R13-3). */
  nr: number;
  aktiv: boolean;
  /** Ist dies der LETZTE Reiter der Speicherordnung? (Alt+9, R13-8) */
  letzter: boolean;
  /** ── W2·18 Welle 2 Punkt 1 · DER EINE PLATZ IM TAB-RING ─────────────────
   *  WAI-ARIA APG (Tabs/Toolbar): von einer Gruppe gleichartiger Bedien-
   *  elemente steht genau EINES im Tabulator-Ring; bewegt wird INNERHALB der
   *  Gruppe mit den Pfeiltasten (die Leiste hört auf sie, s. dort). GEMESSEN
   *  13.9.2026 am Vorstand `2a331dcdd`: die Leiste trug 0 × `tabindex` — jeder
   *  Reiterknopf und jedes ✕ lag im Ring, sechs Reiter kosteten zwölf
   *  Tabulator-Anschläge bis zum Dokument, fünfzig hundert.
   *  Wer NICHT im Ring steht, nimmt auch seine Griffe (⧉/✕) mit heraus:
   *  sonst bliebe die Wüste, nur halb so lang. Der Reiter IM Ring behält sie
   *  ganz gewöhnlich — von ihm aus erreicht man sie mit der Tabulator-Taste,
   *  wie vorher. */
  imRing: boolean;
  /** ── W2·18 Welle 3 Punkt 1 · DER KOPF WEICHT, WEIL DAS FENSTER NICHT MEHR
   *  KANN ──────────────────────────────────────────────────────────────────
   *  Gesetzt, wenn das Fenster an seinem Boden steht (EIN Reiter) und der
   *  Streifen trotzdem überläuft — die Rechnung dazu und der Epochen-Riegel
   *  stehen in `useReiterFenster` (`Fenster.ohneKopf`). Hier ist es nur noch
   *  die Anweisung: den Kopf gar nicht erst rendern. F6-Reihenfolge — erst
   *  weicht das (ohnehin abgekürzte) Gericht, dann kürzt der Kern.
   *  Der VOLLE Name bleibt überall dort, wo er nicht am Platz spart: im
   *  `title`, im Namen des ✕ und in der Hover-Karte (Punkt 4). Verloren geht
   *  nur das Bild, nie die Auskunft (§8). */
  ohneKopf?: boolean;
  manifeste: VerlaufManifeste;
  paneSchluessel: string[];
  zieht: string | null;
  /** ── W2·25 · DIE EINFÜGEMARKE KENNT JETZT AUCH DIE ABLEHNUNG ────────────
   *  `gesperrt` heisst: dieser Zug ginge über die Zonengrenze der
   *  angehefteten Reiter und wird NICHT ausgeführt (D16-Auflage — abgelehnt,
   *  nicht stillschweigend korrigiert). Die Marke sagt es, bevor losgelassen
   *  wird; der `dropEffect` sagt es zusätzlich dem Zeiger. */
  ueber: { path: string; davor: boolean; gesperrt?: boolean } | null;
  gezogenRef: RefObject<string | null>;
  kannOeffnen: boolean;
  istOffen: (path: string) => boolean;
  onDaneben: (path: string) => void;
  onSchliessen: (path: string) => void;
  onZieht: (path: string | null) => void;
  onUeber: (u: { path: string; davor: boolean; gesperrt?: boolean } | null) => void;
  onMenue: (m: { path: string; x: number; y: number }) => void;
  /** ── W2·18 Welle 3 Punkt 4 · DIE HOVER-KARTE ───────────────────────────
   *  Gemeldet wird nur «zeige die Karte dieses Reiters hier» bzw. `null`.
   *  WAS auf der Karte steht, weiss `lib/tabs.reiterKarteTeile`, und WO sie
   *  hängt, entscheidet die Leiste — ein Reiter, der sein eigenes Portal
   *  mitbrächte, stünde bei fünfzehn Reitern fünfzehnmal bereit (§3, dieselbe
   *  Aufteilung wie beim Kontextmenü). */
  onKarte: (k: { path: string; x: number; y: number } | null) => void;
  /** Umordnen: gezogener Pfad, Ziel, davor/dahinter (`lib/tabs.ordneTabsUm`). */
  onUmordnen: (von: string, nach: string, davor: boolean) => void;
  /** ── W2·25 · WÜRDE DIESER ZUG ANGENOMMEN? ───────────────────────────────
   *  Gerechnet wird er in `lib/tabs.zugErlaubt` (§3), gefragt wird die Leiste
   *  (sie hält die Ordnung, §5). Der Reiter weiss nur, was er unter dem
   *  Zeiger zeichnen soll. */
  pruefeZug: (von: string, nach: string, davor: boolean) => boolean;
}

export function Reiter({
  t, nr, aktiv, letzter, imRing, ohneKopf, manifeste, paneSchluessel, zieht, ueber, gezogenRef,
  kannOeffnen, istOffen, onDaneben, onSchliessen, pruefeZug,
  onZieht, onUeber, onMenue, onKarte, onUmordnen,
}: ReiterProps) {
  // ── W2·18 WELLE 3 PUNKT 4 · 600 ms SIND DIE ABSICHT ────────────────────────
  // Kürzer, und die Karte springt jedem Zeiger nach, der die Leiste nur
  // überquert; länger, und man hält sie für kaputt. 600 ms ist die Spanne, die
  // der Fahrplan nennt und die Browser für ihre eigenen Reiter-Tooltips
  // verwenden.
  const KARTE_MS = 600;
  const karteZeit = useRef<number | null>(null);
  /** Steht der Zeiger auf diesem Reiter? Nur dafür da, den NATIVEN Tooltip
   *  wegzunehmen, solange die Karte zuständig ist (s. beim `title` unten). */
  const [zeigerHier, setZeigerHier] = useState(false);
  const stoppKarte = () => {
    if (karteZeit.current === null) return;
    window.clearTimeout(karteZeit.current);
    karteZeit.current = null;
  };
  const meldeKarte = (el: HTMLElement) => {
    const k = el.getBoundingClientRect();
    onKarte({ path: t.path, x: k.left, y: k.bottom });
  };
  // ── W2·18 WELLE 3 PUNKT 5 · DER LANGDRUCK ──────────────────────────────────
  // 500 ms liegender Finger öffnen dasselbe Menü, das der Rechtsklick öffnet —
  // der zweite Weg zu den Verschiebe-Einträgen (`Reiterleiste.menueEintraege`)
  // und damit der einzige, den ein Tablet hat: HTML5-Drag kennt der Finger
  // nicht. 500 ms ist die Spanne, die iOS und Android für ihre eigenen
  // Langdrücke verwenden; 10 px Toleranz, weil ein Finger nie still liegt.
  const LANGDRUCK_MS = 500;
  const LANGDRUCK_PX = 10;
  const langdruck = useRef<{ zeit: number; x: number; y: number } | null>(null);
  /** Hat der Langdruck gerade das Menü geöffnet? Dann ist der `click`, der dem
   *  Loslassen folgt, KEIN Tippen — er dürfte sonst zusätzlich navigieren. */
  const langdruckGriff = useRef(false);
  const stoppLangdruck = () => {
    if (!langdruck.current) return;
    window.clearTimeout(langdruck.current.zeit);
    langdruck.current = null;
  };
  // Zeitgeber, die den Reiter überleben, öffneten eine Karte bzw. ein Menü zu
  // einem Reiter, den es nicht mehr gibt.
  useEffect(() => () => { stoppKarte(); stoppLangdruck(); }, []);
  const schluessel = tabSchluessel(t.path);
  const { kopf: kopfRoh, kern, stelle, instanz } = reiterKurzformTeile(t, manifeste);
  // W2·18 Welle 3 Punkt 1 (Herleitung bei `ohneKopf`): am Anschlag weicht der
  // Kopf GANZ — und damit fällt der Reiter in genau die Form, die ein Reiter
  // ohne Kopf ohnehin hat (Kern kürzbar, eigener Boden `reiterBoden` unten).
  const kopf = ohneKopf ? null : kopfRoh;
  const name = reiterKurzformText(t, manifeste);
  // R8 · Volltitel, Stand/Datum/Kurzbeschreibung und Lesestellung stehen in
  // EINER Ableitung (`lib/tabs.reiterTitel`) — Herleitung dort.
  const titel = reiterTitel(t, manifeste);
  // ── R13-7 · DER TASTATURWEG STEHT AM ORT DER HANDLUNG ────────────────────
  // GEMESSEN 7.9.2026: in der ganzen Leiste 0 × `aria-keyshortcuts`; der
  // `title` nannte Stand, Datum und Lesestellung — aber keinen Alt-Weg.
  // Alt+1…9 und Alt+⇧+←/→ funktionierten, lernte aber niemand.
  // Die 9 gehört dem LETZTEN Reiter (Browser-Norm, R13-8): sie steht darum nur
  // dort, wo sie auch trifft — an Reiter 1–8 die eigene Zahl, am letzten
  // zusätzlich (bzw. ausschliesslich) die 9. Kein Kürzel an Reiter 10 ff.:
  // ein angezeigtes Kürzel, das nichts tut, wäre eine Zusage, die nicht gilt.
  const kuerzel = [nr <= 8 ? `Alt+${nr}` : null, letzter ? 'Alt+9' : null]
    .filter(Boolean).join(' ');
  const reg = registerVonPfad(t.path);
  // F10 · EINE REGEL FÜR BEIDE GRIFFE (✕ und ⧉): der aktive Reiter zeigt sie
  // immer, inaktive bei Hover ODER Tastatur-Fokus irgendwo im Reiter. Vorher
  // war das ✕ dauernd sichtbar und das ⧉ nur bei Hover — zwei Regeln für
  // dieselbe Zeile, und die Tastatur erreichte das ⧉ nur unsichtbar.
  const griffSicht = aktiv
    ? ''
    : 'opacity-0 transition-opacity group-hover/reiter:opacity-100 group-focus-within/reiter:opacity-100';
  // Aktiv-Marken der Panes: welcher Reiter steht in welchem Fenster (§5a
  // Ziff. 4). Bei einem einzigen Pane trägt der aktive Reiter keine Marke —
  // «links» ohne ein «rechts» sagt nichts.
  const paneIdx = paneSchluessel.length > 1 ? paneSchluessel.indexOf(schluessel) : -1;
  const paneWort = paneIdx === 0 ? 'links' : paneIdx > 0 ? 'rechts' : null;
  // R13B: «in diesem Reiter wird gelesen» — nur er kann vom Scroll-Spy eine
  // Lesestellung bekommen und hält darum ihren Platz frei (s. bei `.rl-stelle`).
  const liest = aktiv || paneSchluessel.indexOf(schluessel) >= 0;
  // ── W2·18 Punkt 5, NACHGEZOGEN (R8-Sweep 13.9.2026) · DER BODEN IST EINE
  //    ZAHL, WEIL DAS SCHLÜSSELWORT NICHT RECHNEN KANN ─────────────────────
  // `.rl-reiter { min-width: min-content }` (und ebenso `auto`, GEPRÜFT) lösen
  // dieselbe Rechnung: die INTRINSISCHE Mindestgrösse eines Flex-Elternteils
  // zählt bei `white-space: nowrap`-Text (`truncate`) dessen VOLLE, ungekürzte
  // Breite — ein `min-width`-Boden am Kern (`min-w-[6ch]`) ändert daran
  // nichts, weil diese Rechnung nicht „wie weit darf schrumpfen", sondern „wie
  // breit ist der Inhalt ungebrochen" misst (GEMESSEN: Playwright-Sonde gegen
  // `dist/`, `/vorlagen/nda` @320 — Kern rendert bei 188 px trotz 48-px-Boden).
  // Setzt man darum `.rl-reiter` stattdessen auf eine EXPLIZITE Zahl (`0`,
  // ebenfalls GEPRÜFT), verschwindet zwar der Überlauf am STREIFEN — aber die
  // äussere Schrumpf-Verteilung (`useReiterFenster`, 8 Reiter @390) kennt den
  // inneren Kern-Boden dann GAR NICHT mehr und drückt einzelne Reiter-Kästen
  // UNTER 48 px — der Kern hält seinen Boden, sprengt aber lautlos seinen
  // eigenen Kasten (`scrollWidth 321` gegen `clientWidth 241`, Rot in
  // `e2e/w224-r13-reiter.e2e.ts` FB und R13-2 @390).
  // EINE Zahl, die beides trägt, kennt nur DIESER Reiter — sie hängt an
  // seiner eigenen Zusammensetzung (Stelle reserviert ja/nein — DIESELBE
  // Bedingung wie unten bei `.rl-stelle`/`.rl-stelle-frei`, R13-4/R13B: nicht
  // `stelle !== null` allein, sonst reserviert der Boden auch dort, wo gar
  // nichts rendert wird — R13-4s eigener Befund, ROT gesehen mit `stelle !==
  // null` allein: 161 px Reiterbreite statt < 120 ohne Lesestellung) — und
  // wird hier berechnet, nicht in `index.css` geraten. Nur die Reiter OHNE
  // Kopf brauchen sie: mit Kopf bleibt der Kern `shrink-0` (F6), sein wahrer
  // Boden ist sein voller, ungebrochene Text — und den kennt nur die
  // automatische (Schlüsselwort-)Rechnung, die `.rl-reiter` in `index.css`
  // für genau diesen Fall trägt.
  // ── W2·25 · DER ANGEHEFTETE REITER IST EINE ANDERE FORM ──────────────────
  //
  // «schmaler Reiter nur mit Kürzel, ganz links, ohne ✕» (Spec §7 Teil 1,
  // §5a Ziff. 5). Konkret fällt WEG: der Kopf (das Gericht), die Lesestellung
  // (sie wandert beim Scrollen und wäre gerade hier der breiteste Teil), das
  // ✕ und das ⧉. Übrig bleibt der KERN — das Kürzel, an dem man den Erlass
  // erkennt. Die Instanz-Nummer bleibt: zwei angeheftete «OR» wären sonst ein
  // Bild (W2·18 Punkt 5, dieselbe Begründung wie dort).
  //
  // DER GEWINN IST MESSBAR UND GEWOLLT: ohne Stelle (60 px) und ohne die
  // beiden 24-px-Griffe trägt derselbe Reiter dieselbe Auskunft auf rund einem
  // Drittel der Breite — das ist der ganze Sinn des Anheftens, wenn OR, ZGB
  // und ZPO dauerhaft offen bleiben sollen.
  //
  // OHNE ✕ HEISST NICHT OHNE AUSWEG (§8): Schliessen und Lösen stehen im
  // Kontextmenü (Rechtsklick, Shift+F10, Langdruck), Alt+W schliesst weiterhin
  // den aktiven Reiter, und der Mittelklick bleibt — das Browser-Idiom, das
  // ohnehin keine Fläche kostet.
  const fest = !!t.fest;
  const stelleReserviert = !fest && stelle !== null && (stelle !== '' || liest);
  const reiterBoden = fest || kopf ? undefined
    : `calc(6ch + 1.75rem + 0.875rem${stelleReserviert ? ' + var(--app-reiter-stelle-b) + 0.25rem' : ''})`;
  return (
    <div
      data-reiter-aktiv={aktiv}
      // Test-Anker: die Reiter-IDENTITÄT im DOM (`lib/tabs.tabSchluessel`).
      // Die Beschriftung taugt dafür nicht — sie hängt an lazy geladenen
      // Manifesten und ist genau das, was hier NICHT gemessen werden soll.
      data-reiter-schluessel={schluessel}
      // W2·25 · Mess-Anker der festen Zone: die Sonden zählen sie im DOM,
      // statt sie aus Breiten zu erraten (dieselbe Wahl wie bei
      // `data-reiter-fenster`).
      data-reiter-fest={fest ? 'true' : undefined}
      draggable
      onDragStart={(ev) => {
        // W2·18 Welle 3 Punkt 4: während eines Zugs ist die Karte nur Nebel.
        stoppKarte();
        onKarte(null);
        gezogenRef.current = t.path;
        onZieht(t.path);
        ev.dataTransfer.setData('text/plain', t.path);
        ev.dataTransfer.setData(REITER_MIME, t.path);
        ev.dataTransfer.effectAllowed = 'copyMove';
        // GHOST: der Reiter selbst hängt am Zeiger, gefasst dort, wo man ihn
        // angepackt hat. Chromium nimmt zwar von sich aus das gezogene
        // Element — aber erst NACH dem Handler und ohne Griffpunkt; ein
        // explizites `setDragImage` mit dem Zeiger-Offset ist der Unterschied
        // zwischen «etwas fliegt» und «ich halte diesen Reiter» (D15: die
        // Funktion war da, nur nicht als Funktion erkennbar).
        const kasten = ev.currentTarget.getBoundingClientRect();
        try { ev.dataTransfer.setDragImage(ev.currentTarget, ev.clientX - kasten.left, ev.clientY - kasten.top); }
        catch { /* ältere Engines ohne setDragImage — der Default-Ghost tut es auch */ }
      }}
      onDragOver={(ev) => {
        const von = gezogenRef.current;
        if (!von || von === t.path) return;
        ev.preventDefault();
        // SEITE AUS DEM ZEIGER-X (D15, «analog browser»): linke Hälfte des
        // Ziels = davor, rechte Hälfte = dahinter. Ohne diese Unterscheidung
        // liesse sich ein Reiter nie ans ENDE der Leiste ziehen — hinter dem
        // letzten gibt es kein weiteres Ziel.
        const kasten = ev.currentTarget.getBoundingClientRect();
        const davor = ev.clientX < kasten.left + kasten.width / 2;
        // ── W2·25 · DIE ABLEHNUNG KOMMT VOR DEM LOSLASSEN ──────────────────
        // `dropEffect = 'none'` ist die Auskunft, die JEDER Browser von sich
        // aus in den Zeiger zeichnet (das «kein Zutritt»-Symbol) — die App
        // muss dafür kein eigenes Bild erfinden. Daneben trägt die Marke
        // `data-reiter-sperre` und wird stumpf statt registerfarbig. Was hier
        // NICHT passiert: den Zug auf die nächste erlaubte Stelle rücken —
        // das wäre die stille Korrektur, die D16 ausschliesst.
        const gesperrt = !pruefeZug(von, t.path, davor);
        ev.dataTransfer.dropEffect = gesperrt ? 'none' : 'move';
        if (ueber?.path !== t.path || ueber.davor !== davor || !!ueber.gesperrt !== gesperrt) {
          onUeber({ path: t.path, davor, ...(gesperrt ? { gesperrt: true } : {}) });
        }
      }}
      onDrop={(ev) => {
        ev.preventDefault();
        const von = gezogenRef.current ?? ev.dataTransfer.getData(REITER_MIME);
        if (von && von !== t.path) {
          // ── W2·26 · DAS LOSLASSEN VOLLZIEHT, WAS DIE MARKE ANGESAGT HAT ───
          // GEMESSEN 14.9.2026 (Wurzel der 3/3 roten CI-Läufe in #859 und der
          // 2/2 in #855; Messreihe in `e2e/w224-reiter-umordnen-d16.e2e.ts`
          // beim Fall «was die Einfügemarke ansagt»): die Beschriftung eines
          // Reiters kommt aus einem NACHLADENDEN Manifest — der Entscheid-
          // Reiter wächst von «Entscheid öffnen» (171 px) auf «AppGer BS
          // BEZ.2022.42» (225 px), und alles rechts davon rückt um 54 px. Fällt
          // dieses Nachladen zwischen das letzte `dragover` und das `drop`,
          // liegt ein Zeiger, der in der RECHTEN Hälfte des Ziels stand, ohne
          // jede Bewegung in dessen linker: die Marke sagte «dahinter», das
          // frisch gerechnete `drop` fügte «davor» ein.
          //
          // Die Marke ist die ZUSAGE (§8) — sie steht im Bild, der Zeiger nicht.
          // Darum vollzieht das Loslassen die angesagte Seite und rechnet nicht
          // neu. Nur wenn die Marke gar nicht an diesem Reiter steht (kein
          // `dragover` angekommen, etwa weil Zeigerbewegung und Loslassen in
          // EINEN Tick fielen — so tun es die synthetischen Züge der Sonden),
          // bleibt die Geometrie der einzige Anhaltspunkt.
          const kasten = ev.currentTarget.getBoundingClientRect();
          const davor = ueber?.path === t.path
            ? ueber.davor
            : ev.clientX < kasten.left + kasten.width / 2;
          // Über die Zonengrenze wird gar nicht erst gerufen — und `ordneTabsUm`
          // wiese den Zug auch dann ab, wenn es hier jemand doch täte (§5: die
          // Regel wohnt in `lib/tabs`, hier steht nur ihr Bild).
          onUmordnen(von, t.path, davor);
        }
        gezogenRef.current = null; onZieht(null); onUeber(null);
      }}
      onDragEnd={() => { gezogenRef.current = null; onZieht(null); onUeber(null); }}
      // M4 · RECHTSKLICK ÖFFNET DAS REITER-MENÜ. Unterdrückt wird das
      // Browser-Kontextmenü NUR über einem Reiter — über der Leiste
      // daneben, über dem «+» und über der ganzen übrigen Seite bleibt es
      // erreichbar (Risiko aus dem Plan).
      onContextMenu={(ev) => {
        ev.preventDefault();
        onMenue({ path: t.path, x: ev.clientX, y: ev.clientY });
      }}
      // ── W2·18 WELLE 3 PUNKT 4 · ZWEI TOOLTIPS WÄREN EINER ZU VIEL ────────
      // Der `title` BLEIBT — er ist die Auskunft für Touch (dort gibt es keine
      // Karte), und der R8-Sweep zählt eine per Ellipse gekappte Stelle nur
      // dann nicht als Fund, wenn der volle Text über einen `title` am
      // Vorfahren erreichbar ist (`e2e/helpers/abschnittMessung.ts`,
      // `gekapptMitTitle`). Solange der Zeiger aber HIER steht, ist die Karte
      // zuständig: Chromium zeigte sonst ~400 ms nach ihr noch seinen eigenen,
      // einzeiligen Tooltip darüber.
      // W2·25: der angeheftete Reiter zeigt nur sein Kürzel — der volle Titel
      // bleibt hier (und in der Hover-Karte) erreichbar, dazu das Wort, das
      // seine Form erklärt. Verloren geht das Bild, nie die Auskunft (§8).
      title={zeigerHier ? undefined : [
        titel,
        fest ? 'angeheftet' : null,
        kuerzel ? kuerzel.replace(' ', ' · ') : null,
      ].filter(Boolean).join(' — ')}
      onPointerEnter={(ev) => {
        // Auf Touch gibt es kein «darüberfahren» — dort käme die Karte als
        // Fleck, den man nicht wieder loswird (Fahrplan §4.R3 Punkt 4).
        if (ev.pointerType === 'touch') return;
        setZeigerHier(true);
        const el = ev.currentTarget;
        stoppKarte();
        karteZeit.current = window.setTimeout(() => meldeKarte(el), KARTE_MS);
      }}
      onPointerLeave={() => { setZeigerHier(false); stoppKarte(); onKarte(null); stoppLangdruck(); }}
      // W2·18 Welle 3 Punkt 5 · Langdruck (Herleitung oben). NUR für Finger
      // und Stift: die Maus hat den Rechtsklick, und ein Menü, das unter der
      // gedrückten Maustaste aufgeht, nähme dem Ziehen den Anfang.
      onPointerDown={(ev) => {
        langdruckGriff.current = false;
        if (ev.pointerType === 'mouse') return;
        const { clientX: x, clientY: y } = ev;
        stoppLangdruck();
        langdruck.current = {
          x, y,
          zeit: window.setTimeout(() => {
            langdruck.current = null;
            langdruckGriff.current = true;
            onMenue({ path: t.path, x, y });
          }, LANGDRUCK_MS),
        };
      }}
      onPointerMove={(ev) => {
        const l = langdruck.current;
        if (!l) return;
        // Wer scrollt oder zieht, drückt nicht lange.
        if (Math.abs(ev.clientX - l.x) > LANGDRUCK_PX || Math.abs(ev.clientY - l.y) > LANGDRUCK_PX) stoppLangdruck();
      }}
      onPointerUp={stoppLangdruck}
      onPointerCancel={stoppLangdruck}
      // Fokus zeigt SOFORT: wer mit der Tastatur hier ankommt, hat die 600 ms
      // Zögern schon mit dem Weg hierher bezahlt.
      // ABER NUR BEI SICHTBAREM FOKUS (`:focus-visible`). GEMESSEN 13.9.2026
      // (Playwright `hasTouch`, @390): ein ANTIPPEN fokussiert den Link und
      // öffnete darüber doch noch die Karte — auf Touch stand sie dann als
      // Fleck, den man nicht mehr los wird. `:focus-visible` ist genau die
      // Unterscheidung, die der Browser dafür schon trifft: gesetzt bei
      // Tastatur, nicht bei Zeiger oder Finger.
      onFocus={(ev) => {
        stoppKarte();
        const ziel = ev.target as HTMLElement;
        if (typeof ziel.matches === 'function' && !ziel.matches(':focus-visible')) return;
        meldeKarte(ev.currentTarget);
      }}
      onBlur={(ev) => {
        // Der Sprung vom Link zum ✕ desselben Reiters ist kein Verlassen.
        if (ev.currentTarget.contains(ev.relatedTarget as Node | null)) return;
        stoppKarte();
        onKarte(null);
      }}
      // F9 · DER AKTIVE REITER IST EINE FLÄCHE, KEIN 4-EINHEITEN-UNTERSCHIED.
      // GEMESSEN 6.9.2026: aktiv `paper-raised` (255) gegen inaktiv `paper`
      // (251) — der Unterschied trug allein der 2-px-Strich. Jetzt trägt der
      // aktive Reiter die REGISTERFARBE seiner Domäne als leichte Tönung
      // (Papier bleibt Papier, die Farbe sagt zugleich, WELCHES Register).
      // `cursor-grab` / `active:cursor-grabbing` an der HÜLLE: die Affordanz
      // war der ganze D15-Befund — das Ziehen funktionierte, sah aber nach
      // nichts aus. Der Zeiger sagt jetzt schon vor dem Anfassen, dass hier
      // etwas zu greifen ist; die Griffe ✕/⧉ setzen ihren eigenen Zeiger.
      // Der gezogene Reiter nimmt sich zurück (`opacity-40`) — was am Zeiger
      // hängt, soll nicht zugleich an seinem alten Platz stehen.
      // ── R13-2 · DER REITER SCHRUMPFT, STATT ÜBER DIE KANTE ZU LAUFEN ────
        // Hier stand `shrink-0`. GEMESSEN 7.9.2026: 8 realistische Reiter
        // @1440 massen zusammen 1476 px in einem 1355 px breiten Streifen —
        // der Scrollbalken ist per CSS unsichtbar, ein «+N» gab es bei 8
        // Reitern noch nicht, also stand der letzte als stummes «Z» an der
        // Kante. Ohne `shrink-0` gibt der Reiter nach: der Kopf (das ohnehin
        // gekürzte Gericht) kürzt sich weg, die Untergrenze ist sein
        // `min-content` — die Geschäftsnummer bleibt ungekürzt (F6, unten).
        // Was auch dann nicht mehr passt, zieht ins Blatt (`useReiterFenster`).
        // ── FB (Prüfbefund 7.9.2026) · DER KASTEN TRÄGT SEINEN INHALT ─────
        //    Hier stand seit R8 (`ce321f202`) `min-w-0`. Schrumpfen muss die
        //    Hülle wirklich (R8s eigener Befund, s. bei den Spans unten) — nur
        //    ist `min-width:0` die Aussage «dieser Reiter darf 0 px breit
        //    sein», und die ist nie wahr. Unter seinem Boden passt der KASTEN
        //    per Definition immer, sein INHALT steht daneben; genau auf die
        //    Kastenkante misst aber R13-2 (`useReiterFenster`).
        //    GEMESSEN am Stand `85daf2926` (Preview 4419, gebautes dist/,
        //    Chromium @390, 8 Reiter): alle acht Kästen endeten bei 241 px =
        //    `clientWidth`, `ersterUeberlauf` fand nichts, das Fenster blieb
        //    `0/8/8`, «+N» erschien nie — und der Streifen mass `scrollWidth
        //    256`, weil der letzte Kasten (22 px) 38 px Inhalt trug
        //    (218 + 38). Alle acht Beschriftungen standen auf Breite 0.
        //    `.rl-reiter` (index.css) setzt an dieselbe Stelle einen Boden:
        //    schrumpfen ja, aber nur bis dorthin, wo der Inhalt noch ganz im
        //    Kasten steht. Der Rest zieht ins «+N»-Blatt.
        //    W2·18 (13.9.2026): dieser Boden war bis dahin die feste Zahl
        //    `--app-reiter-min-b` (5rem) und kannte den Inhalt nicht; er ist
        //    jetzt `min-content` und kommt aus den Teilen unten (Herleitung
        //    und Messreihe: index.css bei `.rl-reiter`).
        className={`group/reiter rl-reiter relative flex cursor-grab items-center border-r border-rule-soft active:cursor-grabbing ${
        zieht === t.path ? 'opacity-40' : ''
      } ${aktiv ? (reg ? REG_TON[reg] : 'bg-paper-raised') : ''}`}
        style={reiterBoden ? { minWidth: reiterBoden } : undefined}>
      {/* EINFÜGEMARKE (D15): 2 px in der Registerfarbe des GEZOGENEN Reiters,
          über die volle Reiterhöhe, auf der Seite, auf der er landen wird.
          Sie ersetzt den früheren, immer linken `border-l-2` — der konnte
          nicht sagen, ob der Reiter davor oder dahinter einrastet, und ans
          Ende der Leiste kam man mit ihm gar nicht. */}
      {ueber?.path === t.path && (
        <span aria-hidden data-reiter-marke={ueber.davor ? 'davor' : 'dahinter'}
          // W2·25: dieselbe Marke, zwei Bedeutungen — an der Zonengrenze steht
          // sie STUMPF (kein Registerton, halbe Deckkraft) und trägt
          // `data-reiter-sperre`. Sie verschwindet nicht: «hier landet nichts»
          // ist eine Auskunft, «nichts zu sehen» wäre keine (§8).
          data-reiter-sperre={ueber.gesperrt ? 'fest' : undefined}
          className={`pointer-events-none absolute inset-y-0 w-0.5 ${ueber.davor ? '-left-px' : '-right-px'} ${
            ueber.gesperrt ? 'bg-ink-400 opacity-50'
              : zieht && registerVonPfad(zieht) ? REG_FLAECHE[registerVonPfad(zieht)!] : 'bg-ink-900'}`} />
      )}
      {/* ── R1 (Prüfbefund R11, 6.9.2026) · DIE LEISTE IST NICHT TRIST ─────
          GEMESSEN: alle inaktiven Reiter trugen `bg-ink-400 opacity-30` —
          eine graue Leiste, in der die Registerfarbe erst beim Überfahren
          erschien. Der Streifen ist aber die EINE Stelle, an der man ohne
          Lesen sieht, was offen ist (Gesetz, Entscheid, Werkzeug …).
          ENTSCHEID (David «nicht trist»): jeder Reiter trägt seine eigene
          Registerfarbe, der inaktive auf 60 % Deckkraft, der aktive voll
          plus Flächen-Tönung (`REG_TON`, oben). 60 % ist die Stufe, die
          RUHIG bleibt und den aktiven Reiter trotzdem eindeutig lässt: er
          unterscheidet sich in ZWEI Merkmalen (volle Farbe UND Tönung),
          nicht nur in der Deckkraft. Der Hover hebt auf 100 % — dieselbe
          Auskunft wie vorher, nur nicht mehr die einzige.
          Ohne Register (Meta-Route) bleibt es bei Tinte: geraten wird keine
          Farbe (§8). */}
      <span aria-hidden className={`absolute inset-x-0 bottom-0 h-0.5 ${
        aktiv
          ? (reg ? REG_FLAECHE[reg] : 'bg-ink-900')
          : `${reg ? REG_FLAECHE[reg] : 'bg-ink-400'} opacity-60 group-hover/reiter:opacity-100`}`} />
      {/* ── W2·18 WELLE 3 PUNKT 3 · WER ZU EINER ADRESSE FÜHRT, IST EIN LINK ─
          Hier stand ein `<button type="button">` mit `onClick={navigate}`.
          GEMESSEN am Vorstand (13.9.2026): Screenreader meldeten
          «Schaltfläche», es gab keine Adresse zum Kopieren, «In neuem Fenster
          öffnen» fehlte im Browser-Kontextmenü, und Strg/⌘-Klick tat nichts —
          für ein Navigations-Element die falsche Rolle (WCAG 4.1.2, ARIA APG).
          Der React-Router-`Link` löst das ohne eine Zeile eigener Logik: der
          einfache Klick bleibt eine Navigation OHNE Neuladen, die Tastatur
          bleibt bei Enter, und der `href` trägt alles, was der Browser von
          sich aus daraus macht.
          `draggable={false}` AM LINK, nicht `draggable` — die Absicht des
          Fahrplans («`dragstart` verhindert den Navigations-Drag») wird hier
          eine Stufe früher erreicht: ein nicht-ziehbares Kind lässt den Zug
          an der ziehbaren HÜLLE beginnen, und damit bleibt der D15-Ghost
          (`setDragImage` auf den ganzen Reiter) wortgleich der von vorher.
          Mit `draggable` am Link wäre der Link selbst die Quelle, Chromium
          legte `text/uri-list` dazu, und der Ghost wäre der Schriftzug statt
          des Reiters. */}
      <Link to={t.path} aria-current={aktiv ? 'page' : undefined}
        draggable={false}
        aria-keyshortcuts={kuerzel || undefined}
        // W2·18 Welle 2 Punkt 1 · roving tabindex (Herleitung bei `imRing`).
        // AUSGESCHRIEBENE 0 statt weggelassenem Attribut: der Ring-Platz soll
        // im Markup ABLESBAR sein — die Sonde zählt ihn
        // (`src/tests/reiter-tastaturring.test.tsx`).
        tabIndex={imRing ? 0 : -1}
        // W2·18 Welle 3 Punkt 5: der `click`, der auf einen Langdruck folgt,
        // ist kein Tippen — er würde sonst navigieren, während das Menü
        // aufgeht (GEMESSEN: Chromium schickt nach `pointerup` den Klick).
        onClick={(ev) => {
          if (!langdruckGriff.current) return;
          langdruckGriff.current = false;
          ev.preventDefault();
        }}
        // ── DIE EINE AUSNAHME VOM LINK-IDIOM (W2·18 Welle 3 Punkt 3) ────────
        // Mittelklick schliesst — das Browser-Idiom, das David meint («analog
        // browser»). Auf einem gewöhnlichen Link öffnete er einen zweiten
        // Browser-Tab; auf einem REITER schliesst er ihn, in jedem Browser.
        // Das stärkere Idiom gewinnt, und `preventDefault` hält den Browser
        // davon ab, daneben noch sein eigenes zu tun.
        onAuxClick={(ev) => {
          if (ev.button === 1) { ev.preventDefault(); onSchliessen(t.path); }
        }}
        // M4 · DASSELBE MENÜ OHNE MAUS: Shift+F10 und die Menü-Taste sind
        // die beiden Wege, die Windows/Linux-Tastaturen dafür kennen
        // (WCAG 2.1.1 — eine Zeigergeste allein wäre keine Bedienung).
        // Verankert wird es an der linken unteren Ecke des Reiters, nicht am
        // Zeiger, den es hier nicht gibt.
        onKeyDown={(ev) => {
          if (ev.key !== 'ContextMenu' && !(ev.key === 'F10' && ev.shiftKey)) return;
          ev.preventDefault();
          const k = ev.currentTarget.getBoundingClientRect();
          onMenue({ path: t.path, x: k.left, y: k.bottom });
        }}
        // ── W2·18 Punkt 5, NACHGEZOGEN (R8-Sweep 13.9.2026) · `min-w-0` IST
        //    ZURÜCK, AN ANDERER STELLE IN DER KLASSENLISTE ──────────────────
        // Hier stand `flex items-baseline gap-1 …` OHNE `min-w-0` — die Sorge
        // war, dass «dieser Knopf darf 0 px breit sein» den Boden wieder
        // verschluckt (GEMESSEN 13.9.2026 @1024: «StGB»/«ZPO» auf Breite 0).
        // GEMESSEN am Nachzug-Stand (Playwright-Sonde gegen `dist/`,
        // `/vorlagen/nda` @320): OHNE `min-w-0` schrumpfte der Knopf gar
        // NICHT — er rendert bei 202 px in einem 171-px-Streifen, die
        // Aufschrift (`min-w-[6ch] truncate`) bei voller Textbreite (188 px)
        // trotz ihres eigenen 48-px-Bodens. Grund: `min-width: auto` an einem
        // Flex-Kind mit `overflow: visible` (dieser Knopf) berechnet seine
        // Mindestgrösse aus dem INTRINSISCHEN `min-content` seines Inhalts —
        // und das ignoriert `min-width`-Böden an Nachfahren wie dem Kern
        // vollständig (Herleitung: `.rl-reiter`, `index.css`). `min-w-0` am
        // Knopf ist darum kein Rückfall in die alte Breite-0-Sorge, sondern
        // die Voraussetzung dafür, dass der Kern-Boden (`min-w-[6ch]`) beim
        // Schrumpfen überhaupt erreicht wird — er steht absichtlich NICHT an
        // zweiter Stelle (`flex min-w-0 items-baseline`, die alte, von
        // `reiter-beschriftung.test.tsx` bewachte Reihenfolge), sondern nach
        // `items-baseline`, damit dieselbe Textprobe unverändert grün bleibt.
        // `no-underline`: die Rolle ändert sich, das Bild nicht — ein Reiter
        // ist eine Fläche, kein Fliesstext-Verweis (D13/Design-Reglement).
        className={`flex items-baseline min-w-0 gap-1 py-1.5 pl-2.5 pr-1 text-body-s no-underline ${
          aktiv ? 'font-medium text-ink-900' : 'text-ink-600 hover:text-ink-900'}`}>
        {/* W2·25: «angeheftet» steht im Accessible Name, nicht als Glyphe im
            Reiter — eine Nadel neben dem Kürzel kostete genau die Breite, die
            das Anheften gewinnt, und sagt einer Sprachausgabe nichts. Für den
            Zeiger trägt es der `title` (unten), für die Maus die Form selbst
            (schmal, ganz links, kein ✕). */}
        <span className="sr-only">{fest ? `Angehefteter Reiter ${nr}: ` : `Reiter ${nr}: `}</span>
        {/* F6 · DIE GESCHÄFTSNUMMER WIRD NIE GEKÜRZT. Gekürzt wird der Kopf
            (das Gericht, ohnehin schon abgekürzt); der Kern trägt die Nummer
            und steht `shrink-0`. Der Deckel sitzt darum AM KOPF, nicht am
            Knopf: läge er am Knopf, ragte ein langer Kern als `shrink-0`-Kind
            über dessen Kasten und legte sich über die ⧉/✕-Griffe daneben.
            Ohne Kopf kürzt der Kern selbst — dann ist er der ganze Name
            (Gesetz, Rechner, Vorlage) und nichts daran ist geschützt. */}
        {/* ── DIE WORTFUGE IST EIN ECHTES LEERZEICHEN, KEIN `gap` ─────────
            GEMESSEN 6.9.2026 (`e2e/w224-plus-reiter`, nach der D27-Trennung):
            der Knopf las sich als «Art. 257dOR» — die Lücke kam allein aus
            `gap-1` des Flex-Kastens, und die trägt weder `textContent` noch
            die Berechnung des Accessible Name (WCAG 4.1.2: eine Sprachaus-
            gabe hätte «Artikel 257dOR» gesagt). `{' '}` ist ein Leerzeichen-
            Textknoten: als Flex-Kind wird er nicht gerendert (das Bild bleibt
            byte-gleich, die Lücke macht weiter `gap-1`), im Text steht er.
            Gilt für BEIDE Fugen — die zum Kopf hatte den Defekt schon
            vorher («OGer AGHOR.2024.19»). */}
        {/* R8 (7.9.2026) · `min-w-0`, SONST SCHRUMPFT DER REITER NICHT WIRKLICH.
            Ein `truncate`-Span setzt `white-space: nowrap`; als Flex-Kind ist
            seine `min-content`-Breite damit der GANZE Text, nicht die Ellipse.
            Der Reiter konnte deshalb nicht unter diese Breite — gemessen auf
            /gesetze/kanton/ZH-211.11 @320: Reiterkasten 171 px, Inhalt 283 px,
            der Rest lief in den Nachbarn. `min-w-0` hebt genau diese Sperre auf
            und stellt her, was der Kommentar oben schon beschreibt («der Kopf
            kuerzt sich weg, die Geschaeftsnummer bleibt»). Die max-w-Deckel
            bleiben, sie begrenzen nach OBEN. */}
        {/* ── W2·18 WELLE 3 PUNKT 6 · DIE TEILE TRAGEN NAMEN ──────────────
            `data-reiter-teil` statt Tailwind-Deckel: die Sonden griffen den
            Kopf bis hierher über `span[class*="max-w-[9rem]"]` — eine Klasse,
            die jederzeit aus Gestaltungsgründen wechselt (9 rem → 10 rem), und
            jede Sonde wäre danach blind, ohne rot zu werden. Der Anker sagt,
            WAS der Span ist, nicht wie breit er sein darf. */}
        {/* W2·25: der angeheftete Reiter trägt weder Kopf noch Lesestellung —
            er ist auf sein Kürzel zusammengezogen (Herleitung bei `fest`). */}
        {!fest && kopf && <span data-reiter-teil="kopf" className="min-w-0 truncate max-w-[9rem]">{kopf}</span>}
        {!fest && kopf && ' '}
        {/* ── D27 (David 6.9.2026) · DIE LESESTELLUNG STEHT IM REITER ──────
            «diese funktion, dass es anzeigt in welchem artikel wir sind,
            soll der tab bekommen.» Die Stelle wandert beim Scrollen (aus
            `lib/tabs`, entprellt auf 200 ms vom Scroll-Spy des Lesers) —
            und ein wandernder Text ändert seine Breite. Läge er im selben
            Fluss wie der Kern, schöbe jeder Artikelwechsel alle Reiter
            rechts davon. `.rl-stelle` (index.css) reserviert darum eine
            feste Breite, auch solange die Stellung noch unbekannt ist
            (`stelle === ''`): die Leiste steht schon vor dem ersten
            Spy-Lauf da, wo sie danach steht. Nur Gesetzes-Reiter tragen den
            Platz (`stelle === null` = keine Stellung möglich). */}
        {/* ── R13-4 · KEIN LEERER PLATZHALTER MEHR ────────────────────
            GEMESSEN 7.9.2026: ein Gesetzes-Reiter OHNE Lesestellung trug
            `.rl-stelle` mit leerem `textContent` und 60 px Breite — ein
            sichtbares Loch links vom Namen (ZGB 137 px gegen 77 px ohne).
            Entscheid/Rechner/Vorlage hatten gar keinen Platzhalter; die
            Reitertexte begannen also an drei verschiedenen Stellen.
            Der Platz wird jetzt erst reserviert, WENN eine Stellung da ist
            (`.rl-stelle:empty` fällt in `index.css` weg) — die Reservierung
            selbst bleibt, damit der wandernde Artikel den Reiter nicht bei
            jedem Scroll umbaut (D27). Der einmalige Übergang «keine Stelle →
            Art. 1» springt seit R13-2 nichts mehr: die Reiter schrumpfen
            gemeinsam, die Gesamtbreite des Streifens ändert sich nicht. */}
        {/* ── R13B (7.9.2026) · DER GELESENE REITER HÄLT SEINEN PLATZ ──────
            `stelle === ''` heisst «Gesetzes-Reiter, Stellung noch unbekannt».
            Unbekannt bleibt sie, bis der Spy nach dem ERSTEN Scrollen meldet
            (`inhalt-hooks.tsx`, `if (gescrollt.current)`) — und genau dieser
            Mount weitete den Reiter GEMESSEN von 80 auf 137 px, das ✕ von 69
            auf 133 (Stand `cfa8a9f81`, @1280, /gesetze/bund/ZGB).
            Gescrollt wird im Reiter, der offen VOR EINEM steht: aktiv, oder in
            einem der beiden Panes. Nur dort wird der Platz vorgehalten
            (`.rl-stelle-frei`, index.css — dort auch die Baseline-Kur). Der
            Hintergrund-Reiter ohne Stellung bleibt schmal; das war R13-4s
            Befund und bleibt so (Sonde `w224-r13-reiter.e2e.ts` R13-4).
            `aria-hidden` und kein Textknoten: der Accessible Name bleibt Wort
            für Wort derselbe wie ohne Reserve. */}
        {fest ? null : stelle ? <span className="rl-stelle num">{stelle}</span>
          : stelle === '' && liest ? <span aria-hidden className="rl-stelle-frei" /> : null}
        {!fest && stelle ? ' ' : null}
        {/* ── W2·18 Punkt 5 · SECHS ZEICHEN BLEIBEN STEHEN ─────────────────
            `min-w-[6ch]` statt `min-w-0`: der Name ist das, woran man einen
            Reiter erkennt — er darf kürzen, aber nicht verschwinden. Sechs
            Zeichen tragen jedes Erlass-Kürzel ganz («StGB», «SchKG») und von
            einem längeren Namen genug, um ihn zu unterscheiden. Die Zahl ist
            der Boden des ganzen Reiters: sie geht über den Knopf (oben, MIT
            `min-w-0` — NACHGEZOGEN 13.9.2026, s. dort: ohne ihn schrumpft
            gar nichts) und die Hülle — NACHGEZOGEN als `reiterBoden` (oben,
            `style` statt `index.css`: nur dieser Reiter kennt seine eigene
            Zusammensetzung, Stelle reserviert ja/nein) — bis in die
            Fenster-Messung, die daraufhin FRÜHER einen Überlauf findet und
            den Rest ins «+N»-Blatt schickt — statt sieben unlesbare Reiter
            nebeneinander zu quetschen.
            Mit Kopf bleibt der Kern wie bisher `shrink-0` (F6: die
            Geschäftsnummer wird nie gekürzt). */}
        {/* W2·25: angeheftet steht hier das Kürzel allein — `max-w-[7rem]`
            statt 15 rem, damit auch ein langer Vorlagen-/Rechnername die
            schmale Form hält, und `min-w-[3ch]`, weil ohne Kopf und Stelle
            drei Zeichen den Reiter noch unterscheidbar machen. */}
        <span data-reiter-teil="kern"
          className={fest ? 'min-w-[3ch] truncate max-w-[7rem]'
            : kopf ? 'shrink-0' : 'min-w-[6ch] truncate max-w-[15rem]'}>{kern}</span>
        {/* ── W2·18 Punkt 5 · DIE INSTANZ-NUMMER WIRD NIE GEKÜRZT ──────────
            Sie hing bis hierher hinten am Kern und fiel darum als erstes weg:
            GEMESSEN 13.9.2026 standen «ZPO-Fristen (2)» und «(3)» beide als
            «ZPO-…» — zwei Reiter, ein Bild. Als eigener `shrink-0`-Teil steht
            sie immer. Das Leerzeichen ist ein echter Textknoten, nicht `gap`
            (sonst läse sich der Accessible Name «ZPO-Fristen(2)», WCAG 4.1.2 —
            dieselbe Fuge wie oben). */}
        {instanz && ' '}
        {instanz && <span data-reiter-teil="nummer" className="shrink-0 num">{instanz}</span>}
        {paneWort && <span className="sr-only">{` (Fenster ${paneWort})`}</span>}
      </Link>
      {/* Fenster-Marke: zeigt, welcher Reiter links bzw. rechts steht. */}
      {paneWort && (
        <span aria-hidden title={`Fenster ${paneWort}`}
          className="shrink-0 border border-rule-soft px-1 text-micro leading-tight text-ink-500">
          {paneWort === 'links' ? '◧' : '◨'}
        </span>
      )}
      {/* «daneben öffnen» — der Klick-Weg zu dem, was das Ziehen ins zweite
          Fenster tut (§5a Ziff. 4); nur ab lg und mit freier Kapazität.
          ── W2·18 Welle 2 Punkt 7 · DIE TREFFERFLÄCHE IST 24 × 24 ──────────
          GEMESSEN 13.9.2026 (gebautes dist/, Chromium, @1440 und @1024): das
          ✕ mass 24 × 24 (das bringt `.lc-schliessknopf` über `--tap-ziel`
          mit), dieses ⧉ daneben 20 × 24 — vier Pixel unter der AA-Untergrenze
          von WCAG 2.5.8 (24 × 24 CSS-px). Auf die Ausnahme «spacing» konnte
          es sich nicht berufen: der Abstand zum ✕ ist GEMESSEN 0 px, die
          24-px-Kreise der beiden Ziele überschneiden sich also.
          Der Fahrplan fragte, ob 24 px OHNE Pseudo-Element erreichbar sind —
          sie sind es: hier steht eine echte Mindestbox, kein `::after` wie
          bei `.lc-schliessknopf-komfort`. Damit bleibt die A3-1-Begründung
          für `komfort={false}` am ✕ unberührt (das Pseudo-Element nähme dem
          Nachbarn die Klicks); die 24 px trägt beides ohne es.
          DIE ZAHL STEHT NICHT HIER (§5/D2): `--tap-ziel` ist der eine Ort,
          an dem 24 px definiert sind — dieselbe Quelle, aus der das ✕ sie
          zieht. Der Zuwachs von 4 px je Reiter fällt nur ab `lg` an (darunter
          ist der Griff gar nicht da) und dort, wo Platz ist; die Leiste rückt
          ihn wie jede andere Breite ins Fenster ein (R13-2). */}
      {!fest && kannOeffnen && !istOffen(t.path) && (
        <button type="button" onClick={() => onDaneben(t.path)}
          aria-label={`«${name}» daneben öffnen`} title="Daneben öffnen"
          tabIndex={imRing ? undefined : -1}
          className={`hidden lg:inline-flex min-h-[var(--tap-ziel)] min-w-[var(--tap-ziel)] shrink-0 items-center justify-center text-ink-400 hover:text-ink-900 ${griffSicht}`}>
          <span aria-hidden className="lc-griff-glyph">⧉</span>
        </button>
      )}
      {/* A3-1: EIN Schliess-✕ der App; der Klick wirft ein offenes Dokument
          samt Leseposition weg — derselbe deklarierte destruktive Ton wie in
          der Reiter-Liste und der Pane-Titelleiste.
          `komfort={false}`: die 44-px-Trefferfläche des Bausteins läge in
          einer 28-px-Reiterzeile über dem ⧉-Nachbarn UND über dem nächsten
          Reiter — dieselbe begründete Ausnahme wie dort; die AA-Untergrenze
          (24 px, WCAG 2.5.8) hält die Grundklasse.
          NACHGEMESSEN 13.9.2026 (W2·18 Welle 2 Punkt 7): dieses ✕ misst
          24 × 24 und hält sie wirklich — der ⧉-Nachbar tat es nicht (20 × 24)
          und trägt seine Mindestbox jetzt selbst (Herleitung dort). */}
      {/* W2·25 · KEIN ✕ AM ANGEHEFTETEN REITER (Spec §7 Teil 1). Der Grund ist
          nicht die Fläche, sondern die Absicht: wer anheftet, sagt «der bleibt
          offen» — ein ✕ direkt daneben stellte genau das jedem Fehlklick
          anheim. Schliessen und Lösen bleiben im Kontextmenü erreichbar (eine
          Geste mehr, und das ist hier die Zusage, nicht der Preis). */}
      {!fest && (
        <SchliessKnopf name={`Reiter «${name}» schliessen`} ton="destruktiv" komfort={false}
          tabIndex={imRing ? undefined : -1}
          onClick={() => onSchliessen(t.path)} klasse={`h-6 w-6 mr-1 shrink-0 ${griffSicht}`} />
      )}
    </div>
  );
}
