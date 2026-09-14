import { useEffect, useRef, type MutableRefObject } from 'react';
import {
  tabSchluessel, type TabEintrag, ordneTabsUm,
  ladeTabs, vorherigerReiter,
} from '../../lib/tabs';
import { manifestBedarf } from '../../lib/tabGruppen';
import type { VerlaufManifeste } from '../../lib/verlaufLabel';
import { istBuchstabenTaste, zifferTaste } from './reiterleiste/tasten';
import { randSeite, schubZiel, SCHUB_MS } from './reiterleiste/randschub';

// ── §15 · DAS KONTEXTMENÜ GEHÖRT NICHT IN DEN START-CHUNK ──────────────────
// GEMESSEN 6.9.2026 (`npm run check:perf-budget`, gebautes dist/): mit einem
// statischen Import stieg der Entry-Chunk von 59.7 KB auf 61.3 KB gzip und
// riss das 60-KB-Budget — das Menü zieht `ui/Menue` mit, das sonst nur die
// (lazy geladene) Leser-Fläche braucht. Es erscheint frühestens beim ersten
// Rechtsklick; bis dahin kostet es nichts. Fallback `null`: es gibt nichts zu
// zeigen, solange nichts geöffnet ist, und ein Platzhalter unter dem Zeiger
// wäre schlechter als das Menü einen Wimpernschlag später.
// LOGIKVERLUST-BEWERTUNG (§15): keiner — dieselbe Komponente, dieselben
// Aktionen, nur später geladen. Die Reiter-Mechanik selbst (`lib/tabs`) bleibt
// im Entry, wo sie hingehört.
// ── W2·18 WELLE 2 PUNKT 5 · «EINEN WIMPERNSCHLAG SPÄTER» WAR EINE DRITTEL-
//    SEKUNDE, JEDES MAL AM ERSTEN RECHTSKLICK ────────────────────────────────
//
// GEMESSEN 13.9.2026, in der Seite (MutationObserver ab `contextmenu` bis
// `[role=menu]` im DOM; Chromium, vier Reiter):
//     gebautes dist/ (vite preview)   1. Rechtsklick 320 ms · 2. 10 ms · 3. 8 ms
//     Dev-Server                      1. Rechtsklick 728 ms · 2. 76 ms
// Das Menü ging also nicht verloren, es kam ZU SPÄT — und wer nach einer
// Drittelsekunde nichts sieht, klickt ein zweites Mal oder gibt auf.
//
// ZWEI URSACHEN, und die zweite ist die grössere:
//  (1) der Chunk wurde erst beim Klick angefordert (über eine echte Leitung
//      kostet das eine Rundreise, lokal nur ~6 ms);
//  (2) `React.lazy` + `Suspense` SUSPENDIERT auch dann, wenn das Modul längst
//      geladen ist: der erste Render ruft den Loader, bekommt ein — bereits
//      erfülltes — Versprechen und wirft es trotzdem; der Inhalt kommt erst im
//      Nachlauf. GEMESSEN blieb der erste Rechtsklick darum auch MIT
//      vorgeladenem Chunk bei 316 ms (gegen 322 ohne), während der zweite
//      10 ms brauchte. Die Differenz ist Reacts Nachlauf, nicht das Netz.
//
// DIE ANTWORT: kein `lazy`/`Suspense` mehr für diese eine Fläche, sondern der
// dynamische Import von Hand — das Ergebnis liegt im Zustand, und das Menü
// rendert im SELBEN Commit wie der Rechtsklick. Angefordert wird es, sobald
// jemand die Leiste betritt (Zeiger oder Fokus): zwischen Ankunft und Klick
// liegen beim Menschen Hunderte von Millisekunden.
// DAS START-BUDGET BLEIBT UNBERÜHRT (§15, Herleitung oben): der Chunk bleibt
// ein eigener (gemessen 923 B gzip), er wird nur früher angefordert; der
// Entry-Chunk misst weiterhin 54.9 KB gzip gegen 60.0 KB Budget.
// KOMMT DER RECHTSKLICK DOCH ZUERST (Touch, Shift+F10 ohne Vorlauf), bleibt
// `menue` gesetzt und das Menü öffnet, sobald das Modul da ist — es wird nicht
// verworfen.
let menueVorlauf: Promise<typeof import('./ReiterMenue')> | null = null;
/** Den Menü-Chunk anfordern (höchstens einmal je Seitenleben). */
export const ladeMenue = (): Promise<typeof import('./ReiterMenue')> => (menueVorlauf ??= import('./ReiterMenue'));

// ── W2·18 WELLE 3 PUNKT 4 · DIE HOVER-KARTE KOMMT DENSELBEN WEG ────────────
// Wortgleiche Bauart wie beim Menü darüber, aus denselben zwei Gründen: der
// Chunk gehört nicht in den Start (§15), und `lazy`/`Suspense` käme einen
// Nachlauf zu spät. Angefordert wird auch sie beim Betreten der Leiste — die
// 600 ms, die die Karte ohnehin wartet, reichen dafür dreifach.
let karteVorlauf: Promise<typeof import('./reiterleiste/ReiterKarte')> | null = null;
export const ladeKarte = (): Promise<typeof import('./reiterleiste/ReiterKarte')> =>
  (karteVorlauf ??= import('./reiterleiste/ReiterKarte'));

// ── W2·25 · DER MAPPEN-DIALOG KOMMT DENSELBEN WEG (§15) ────────────────────
// Dieselbe Bauart wie Menü und Karte darüber, aus demselben Grund: die Fläche
// gehört nicht in den Start-Chunk (`check:perf-budget`, Entry-Deckel 60 KB
// gzip), und `lazy`/`Suspense` käme einen React-Nachlauf zu spät. Angefordert
// wird sie beim Betreten der Leiste — zwischen Ankunft und Rechtsklick liegen
// beim Menschen Hunderte von Millisekunden.
// LOGIKVERLUST-BEWERTUNG (§15): keiner — dieselbe Komponente, dieselben
// Aktionen, nur später geladen. Die Mappen-MECHANIK (`lib/mappen`, wenige
// hundert Byte reiner Zeichenketten-Arbeit) bleibt im Entry: das Kontextmenü
// muss die Namen der gespeicherten Mappen kennen, BEVOR es sich öffnet.
let mappenVorlauf: Promise<typeof import('./reiterleiste/MappenDialog')> | null = null;
export const ladeMappenDialog = (): Promise<typeof import('./reiterleiste/MappenDialog')> =>
  (mappenVorlauf ??= import('./reiterleiste/MappenDialog'));

// ── W2·18 WELLE 3 PUNKT 2 · DER RAND-SCHUB ───────────────────────────────
// Was hier NICHT steht, ist Auto-Scroll: der Streifen scrollt GEMESSEN nie
// (Herleitung und Messreihe in `reiterleiste/randschub.ts`). Am Rand schiebt
// sich der gezogene Reiter stattdessen selbst durch die Speicherordnung,
// einen Platz je Takt — so kommt er über die Fenstergrenze hinaus.
export function useReiterleisteSchub(gezogenRef: MutableRefObject<string | null>) {
  const schub = useRef<{ seite: 'links' | 'rechts'; takt: number } | null>(null);

  const stoppSchub = () => {
    if (!schub.current) return;
    window.clearInterval(schub.current.takt);
    schub.current = null;
  };

  const schubTakt = (links: boolean) => {
    const von = gezogenRef.current;
    if (!von) { stoppSchub(); return; }
    // FRISCH aus `lib/tabs`, nicht aus der Render-Ordnung: dieser Rückruf lebt
    // über viele Schübe hinweg und sähe sonst immer die erste Ordnung.
    const pfade = ladeTabs().map((t) => tabSchluessel(t.path));
    const ziel = schubZiel(pfade, tabSchluessel(von), links);
    // `null` = Anschlag. Der Takt läuft weiter (der Zeiger steht ja noch am
    // Rand), tut aber nichts — kein Umlauf ans andere Ende.
    if (ziel) ordneTabsUm(von, ziel.ziel, ziel.davor);
  };

  const beiRandZug = (ev: { clientX: number; currentTarget: HTMLElement }) => {
    if (!gezogenRef.current) return;
    const seite = randSeite(ev.clientX, ev.currentTarget.getBoundingClientRect());
    if (!seite) { stoppSchub(); return; }
    if (schub.current?.seite === seite) return;
    stoppSchub();
    const links = seite === 'links';
    schub.current = { seite, takt: window.setInterval(() => schubTakt(links), SCHUB_MS) };
  };

  // Ein Intervall, das einen Zug überlebt, ordnete später ohne Zutun um.
  useEffect(() => stoppSchub, []);

  return { stoppSchub, beiRandZug };
}

// Reader-Labels (Gesetz/Entscheid) aus den ohnehin lazy ladbaren Manifesten —
// Muster und Bedingung wörtlich aus der abgelösten `ReiterUebersicht`.
//
// M2 (6.9.2026): dasselbe Muster jetzt DREIMAL — Materialien tragen seit
// `lib/tabs.istReiterPfad` einen eigenen Reiter, und ohne ihr Manifest hiesse
// er «Material öffnen», also eine Aufforderung statt eines Namens
// (Prüfbefund R11 #24). Die `brauchtX`-Bedingung bleibt die Eintrittskarte:
// `/materialien/register.json` wird NUR geladen, wenn wirklich ein
// Material-Reiter offen ist — kein dritter Download in der Kopfzone auf
// Vorrat (§15; `check:perf-budget` misst es).
//
// ── W2·18 Punkt 2 · DER EFFEKT HÄNGT AM BEDARF, NICHT AN DER LISTE ────────
// Die `brauchtX`-Ableitung stand IM Effekt, und der Effekt hung an `[tabs]`.
// Weil `useTabs` bei jedem Ereignis ein neues Array lieferte, lief er
// dauernd — und legte bei jedem Lauf ein NEUES `manifeste`-Objekt ab, also
// einen zweiten Render obendrauf und neue Prop-Identität für jeden Reiter.
// GEMESSEN 13.9.2026 (20 Rad-Schritte auf /gesetze/bund/OR): 11 Läufe.
// Der Bedarf selbst ändert sich dabei nie: ein wandernder `#art-…`-Anker
// macht aus einem Gesetzes-Reiter keinen anderen Bedarf. Die Ableitung wohnt
// darum jetzt in `lib/tabGruppen.manifestBedarf` (§3, dort auch die
// §15-Herleitung der Material-Regel), und die Abhängigkeit sind die drei
// Wahrheitswerte — stabile Primitive statt einer Array-Identität.
export function useReiterleisteManifeste(
  tabs: TabEintrag[],
  setManifeste: React.Dispatch<React.SetStateAction<VerlaufManifeste>>
) {
  const { gesetze: brauchtG, rechtsprechung: brauchtE, materialien: brauchtM } = manifestBedarf(tabs);
  useEffect(() => {
    if (!brauchtG && !brauchtE && !brauchtM) return;
    let lebt = true;
    void (async () => {
      const [g, ent, mat] = await Promise.all([
        brauchtG ? import('../../lib/normtext/browse').then((m) => m.ladeBrowseManifest()).catch(() => null) : Promise.resolve(null),
        brauchtE ? import('../../lib/rechtsprechung/browse').then((m) => m.ladeEntscheidManifest()).catch(() => null) : Promise.resolve(null),
        brauchtM ? import('../../lib/materialien/browse').then((m) => m.ladeMaterialManifest()).catch(() => null) : Promise.resolve(null),
      ]);
      if (lebt) setManifeste((alt) => ({
        gesetze: g ?? alt.gesetze ?? null,
        entscheide: ent ?? alt.entscheide ?? null,
        materialien: mat ?? alt.materialien ?? null,
      }));
    })();
    return () => { lebt = false; };
  }, [brauchtG, brauchtE, brauchtM, setManifeste]);
}

// ── Tastatur (§5a Ziff. 7) ────────────────────────────────────────────────
// Alt+1…9 springt auf den n-ten Reiter der sichtbaren Ordnung. Zum SCHLIESSEN
// ist es Alt+W und NICHT Ctrl/⌘+W: der Browser fängt Ctrl/⌘+W selbst ab und
// schliesst sein eigenes Fenster — eine Belegung, die man nicht bekommen
// kann, wäre eine Zusage, die nicht gilt (§8). §5a Ziff. 7 sieht genau diesen
// Rückfall vor. Kein Eingriff, solange der Fokus in einem Eingabefeld steht.
//
// ── W2·18 Punkt 1 · WELCHE TASTE, NICHT WELCHES ZEICHEN ───────────────────
// Hier stand `e.key === 't' / 'w' / /^[1-9]$/`. macOS legt auf Option+Taste
// ein Sonderzeichen («†», «∑», «¡»): am Mac war damit KEIN einziger dieser
// Kürzel erreichbar, während Linux/CI grün blieb. Gelesen wird jetzt die
// physische Taste (`reiterleiste/tasten`, dort die Herleitung); `e.key`
// bleibt als zweiter Weg für fremde Belegungen. Die Kürzel, die Pfeile,
// Bild↑/↓ und Tab betrifft das nicht — die tragen unter Option denselben
// `key`.

// ── D15 · UMORDNEN OHNE MAUS: Alt+Shift+←/→ ───────────────────────────────
// Ziehen ist eine Zeigergeste; sie allein zu bauen hiesse, das Umordnen für
// Tastatur und Screenreader gar nicht anzubieten (WCAG 2.1.1). Alt+Shift ist
// frei — Alt+Ziffer und Alt+W belegen die Leiste schon, Alt+←/→ OHNE Shift
// gehört dem Browser (Verlauf zurück/vorwärts). KEIN UMLAUF am Rand: ein
// Reiter, der am linken Ende gedrückt suddenly rechts steht, ist verloren
// statt verschoben.
export function useReiterleisteTastatur({
  ordnung,
  aktivSchluessel,
  navigate,
  schliessen,
  neuerReiter,
  stelleWiederHer,
}: {
  ordnung: TabEintrag[];
  aktivSchluessel: string;
  navigate: (path: string) => void;
  schliessen: (path: string) => void;
  neuerReiter: () => void;
  stelleWiederHer: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented) return;
      const strgTab = e.ctrlKey && !e.altKey && !e.metaKey && e.key === 'Tab';
      if (!e.altKey && !strgTab) return;
      const a = document.activeElement as HTMLElement | null;
      if (a && (/^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName) || a.isContentEditable)) return;
      // ── R13-8 · ZYKLISCH BLÄTTERN ────────────────────────────────────────
      // Browser-Norm ist Ctrl+Tab / Ctrl+⇧+Tab, UMLAUFEND (anders als das
      // Umordnen mit Alt+⇧+←/→, das am Rand bewusst stehen bleibt: hier geht
      // nichts verloren, man kommt nur wieder vorn heraus).
      // GEMESSEN 7.9.2026: Ctrl+Tab bleibt im normalen Browserfenster wirkungs-
      // los — Chrome und Firefox fangen es für ihre EIGENEN Tabs ab, bevor die
      // Seite es sieht. Der Griff steht hier trotzdem (er kostet nichts und
      // wirkt dort, wo die Umgebung ihn durchlässt), ANGEBOTEN wird in der
      // Oberfläche aber nur das Paar, das man wirklich bekommt: Alt+Bild↑/↓
      // (§8 — keine Zusage, die nicht gilt).
      const blaettern = (vor: boolean) => {
        if (ordnung.length < 2) return;
        const idx = ordnung.findIndex((t) => tabSchluessel(t.path) === aktivSchluessel);
        const von = idx === -1 ? 0 : idx;
        const ziel = ordnung[(von + (vor ? 1 : ordnung.length - 1)) % ordnung.length];
        navigate(ziel.path);
      };
      if (strgTab) { e.preventDefault(); blaettern(!e.shiftKey); return; }
      if (e.key === 'PageDown' || e.key === 'PageUp') {
        e.preventDefault();
        blaettern(e.key === 'PageDown');
        return;
      }
      if (e.ctrlKey || e.metaKey) return;
      if (e.shiftKey && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) {
        const idx = ordnung.findIndex((t) => tabSchluessel(t.path) === aktivSchluessel);
        if (idx === -1) return;
        const links = e.key === 'ArrowLeft';
        const ziel = ordnung[idx + (links ? -1 : 1)];
        if (!ziel) { e.preventDefault(); return; }
        e.preventDefault();
        // W2·25: über die Zonengrenze meldet `ordneTabsUm` `false` und
        // schreibt nichts — die Taste steht dort still, genau wie am Rand der
        // Leiste. Dieselbe Wahl wie dort: kein Umlauf, keine Ausweichstelle.
        ordneTabsUm(ordnung[idx].path, ziel.path, links);
        return;
      }
      // ── M3 · ALT+SHIFT+T STELLT WIEDER HER ─────────────────────────────────
      // Browser-Idiom (dort Ctrl/⌘+Shift+T); Ctrl/⌘ fängt der Browser selbst
      // ab und stellt SEINEN Tab wieder her — dieselbe Lage wie bei Alt+W und
      // Alt+T, darum dieselbe Antwort: Alt statt Ctrl/⌘.
      if (e.shiftKey && istBuchstabenTaste(e, 't')) {
        e.preventDefault();
        stelleWiederHer();
        return;
      }
      if (e.shiftKey) return;
      // ── W2·18 WELLE 2 PUNKT 2 · ALT+Q PENDELT (zuletzt benutzt) ─────────
      //
      // WARUM Q, GEMESSEN/BELEGT 13.9.2026:
      //  · `Ctrl+Tab` wäre das Browser-Idiom — der Browser fängt es für seine
      //    EIGENEN Reiter ab (gemessen 7.9.2026, wirkungslos; der Griff steht
      //    oben trotzdem, angeboten wird er nicht, §8).
      //  · `Alt+Tab` gehört auf Windows/Linux dem Fenstermanager, `Cmd+Tab`
      //    auf macOS dem Dock — die Seite sieht sie gar nicht.
      //  · `Alt+Q` ist frei: in der App belegt Alt sonst nur T, W, 1…9, ⇧+T,
      //    ⇧+←/→ und Bild↑/↓ (Vollerhebung `altKey` über `src/`, 13.9.2026 —
      //    ausser der Leiste liest nur `HeaderSuche` Alt, und zwar am KLICK),
      //    und die Alt-Belegungen der Browser (←/→ Verlauf, Home, D, F/E)
      //    lassen Q aus. GEMESSEN (Chromium, `keydown`-Mitschrift): Alt+Q
      //    kommt als `code: 'KeyQ'`, `altKey: true`, `defaultPrevented: false`
      //    an der Seite an — kein Browser-Griff liegt davor.
      //  · macOS legt auf Option+Buchstabe ein SONDERZEICHEN (Option+Q = «œ»,
      //    dieselbe Klasse wie die gemessenen †/∑/¡ aus Welle 1). Gelesen wird
      //    darum die PHYSISCHE Taste — `istBuchstabenTaste` prüft `e.code`
      //    zuerst (`reiterleiste/tasten.ts`, dort die Herleitung). Der
      //    «œ»-Konflikt ist damit konstruktiv ausgeschlossen, nicht gehofft.
      if (istBuchstabenTaste(e, 'q')) {
        const ziel = vorherigerReiter(ordnung, aktivSchluessel);
        // Kein Ziel = frischer Start oder alles Gemerkte geschlossen: dann tut
        // die Taste NICHTS, statt irgendwohin zu springen (§8).
        if (!ziel) return;
        e.preventDefault();
        navigate(ziel.path);
        return;
      }
      // ── R13-8 · ALT+9 IST DER LETZTE REITER, NICHT DER NEUNTE ───────────
      // Browser-Norm (Chrome, Firefox, Safari): die 9 springt ans ENDE. Vorher
      // war sie schlicht der neunte — bei 15 Reitern war #10 und alles dahinter
      // per Tastatur unerreichbar (GEMESSEN 7.9.2026).
      const n = zifferTaste(e);
      if (n !== null) {
        const ziel = n === 9 ? ordnung[ordnung.length - 1] : ordnung[n - 1];
        if (!ziel) return;
        e.preventDefault();
        navigate(ziel.path);
        return;
      }
      if (istBuchstabenTaste(e, 'w')) {
        const aktiv = ordnung.find((t) => tabSchluessel(t.path) === aktivSchluessel);
        if (!aktiv) return;
        e.preventDefault();
        schliessen(aktiv.path);
        return;
      }
      // ── D19 · NEUER REITER OHNE MAUS: Alt+T ─────────────────────────────────
      // Ctrl/⌘+T wäre die Browser-Erwartung, aber der Browser fängt sie selbst
      // ab und öffnet sein EIGENES Fenster (dieselbe Lage wie beim Schliessen,
      // Alt+W statt Ctrl/⌘+W oben) — eine Zusage, die man nicht bekommen kann.
      if (istBuchstabenTaste(e, 't')) {
        e.preventDefault();
        neuerReiter();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });
}
