import {
  tabSchluessel, type TabEintrag, festeZone, letzterGeschlossener,
  naechsteInstanz, merkeTab, reiterKurzformText, ordneTabsUm, loeseAb,
  hefteAn, schliesseAndere, schliesseRechtsVon, uebernehmeMappe,
} from '../../lib/tabs';
import { ladeMappen, mappenAdresse, type Mappe } from '../../lib/mappen';
import type { VerlaufManifeste } from '../../lib/verlaufLabel';
import type { ReiterMenueEintrag } from './ReiterMenue';
import type { MappenAbsicht } from './reiterleiste/MappenDialog';

export const MAPPEN_IM_MENUE = 5;

export interface ReiterEintraegeKontext {
  ordnung: TabEintrag[];
  tabs: TabEintrag[];
  aktivSchluessel: string;
  manifeste: VerlaufManifeste;
  kannOeffnen: boolean;
  istOffen: (path: string) => boolean;
  oeffneDaneben: (path: string) => void;
  schliessePane: (path: string) => void;
  schliessen: (path: string) => void;
  alleSchliessen: () => void;
  neuerReiter: () => void;
  stelleWiederHer: () => void;
  oeffneMappen: (a: MappenAbsicht) => void;
  navigate: (path: string) => void;
  kopieren: (text: string) => void;
}

// ── W2·25 TEIL 2 · DIE ARBEITSMAPPE IM MENÜ (Spec §7, §5a Ziff. 9) ────────
//
// WARUM AM LEERRAUM UND AM «+N»-BLATT und nicht am einzelnen Reiter: eine
// Mappe ist die GANZE Leiste, kein einzelnes Dokument. Der Leerraum daneben
// ist die Fläche, die für «alles hier» steht — dieselbe Stelle, an der schon
// «Alle schliessen» und «Neuer Reiter» stehen (R13-5).
//
// JEDE MAPPE EINE EIGENE ZEILE statt eines Untermenüs «Mappe öffnen ▸»: ein
// Untermenü wäre ein zweites Menü-Muster in einer App, die genau eines hat
// (`ReiterMenue` = flache Liste mit Zustandswort) — und bei höchstens zwölf
// Mappen (`MAPPEN_MAX`) trägt die Liste sie. Der Wortlaut «Mappe öffnen: X»
// folgt der Zeile, die daneben schon steht («Wieder öffnen: ZGB», Ä118).
// Gezeigt werden die ersten fünf; alles Weitere führt «Mappen verwalten…»,
// das ohnehin für Löschen und Adresse gebraucht wird.
export function mappenEintraege(kontext: ReiterEintraegeKontext): ReiterMenueEintrag[] {
  const { tabs, oeffneMappen, kopieren } = kontext;
  const mappen = ladeMappen();
  const e: ReiterMenueEintrag[] = [];
  // Ohne offenen Reiter gäbe es nichts zu speichern (§8).
  if (tabs.length > 0) {
    e.push({ id: 'mappe-speichern', label: 'Als Mappe speichern…',
      onKlick: () => oeffneMappen({ art: 'speichern' }) });
  }
  for (const m of mappen.slice(0, MAPPEN_IM_MENUE)) {
    e.push({ id: `mappe-auf:${m.name}`, label: `Mappe öffnen: ${m.name}`,
      rechts: String(m.reiter.length),
      onKlick: () => oeffneMappen({ art: 'oeffnen', name: m.name }) });
  }
  if (mappen.length > 0) {
    e.push({ id: 'mappe-verwalten', label: 'Mappen verwalten…',
      rechts: mappen.length > MAPPEN_IM_MENUE ? String(mappen.length) : undefined,
      onKlick: () => oeffneMappen({ art: 'verwalten' }) });
  }
  // Die Adresse der GERADE offenen Leiste — dieselbe Kopier-Mechanik wie bei
  // «Adresse kopieren» am Reiter (R4-D: `useKopieren` quittiert erst nach
  // erfolgreichem Schreiben), und derselbe Vorbehalt: der Eintrag erscheint
  // nur, wo die Zwischenablage überhaupt zu haben ist.
  if (tabs.length > 0 && typeof navigator !== 'undefined' && navigator.clipboard) {
    e.push({ id: 'mappe-adresse', label: 'Adresse der Mappe kopieren',
      onKlick: () => kopieren(mappenAdresse(tabs)) });
  }
  return e;
}

// ── R13-5 · DAS MENÜ DES LEERRAUMS (Prüfbefund 7.9.2026) ──────────────────
//
// GEMESSEN: nach dem Schliessen des LETZTEN Reiters standen 0 Reiter, der
// Ring hielt 3 Einträge — und der Rechtsklick auf den Leerraum ergab
// `[role=menu]` = 0 (das Browser-Menü). Zurück kam man nur mit Alt+⇧+T; mit
// der Maus gar nicht. Das ist genau der Moment, in dem man die Rückfahrkarte
// braucht, und genau die Stelle, an der der Browser sie anbietet.
export function leerraumEintraege(kontext: ReiterEintraegeKontext): ReiterMenueEintrag[] {
  const { tabs, manifeste, neuerReiter, stelleWiederHer, alleSchliessen } = kontext;
  const wieder = letzterGeschlossener();
  const e: ReiterMenueEintrag[] = [
    { id: 'neu', label: 'Neuer Reiter', rechts: 'Alt+T', onKlick: neuerReiter },
  ];
  // EIN WORT FÜR EINE SACHE (Ä118): derselbe Wortlaut wie im Reiter-Menü und
  // im Blatt.
  if (wieder) {
    e.push({ id: 'wieder', label: `Wieder öffnen: ${reiterKurzformText(wieder, manifeste)}`,
      rechts: 'Alt+⇧+T', onKlick: stelleWiederHer });
  }
  // W2·25: dieselbe Bedingung wie im Reiter-Menü — angeheftete Reiter
  // schliesst die Geste nicht, also zählt nur der freie Bestand.
  if (tabs.some((t) => !t.fest)) e.push({ id: 'alle', label: 'Alle schliessen', onKlick: alleSchliessen });
  for (const m of mappenEintraege(kontext)) e.push(m);
  return e;
}

// ── M4 · WAS IM KONTEXTMENÜ EINES REITERS STEHT ───────────────────────────
//
// Die Fläche zeichnet `ReiterMenue`; WELCHE Einträge es gibt und was sie tun,
// steht hier — und rechnen tut es `lib/tabs` (§3). Jeder Eintrag erscheint
// nur, wenn er auch etwas bewirkt: kein «Daneben öffnen» ohne freies
// Fenster, kein «Rechts davon schliessen» am letzten Reiter, kein «Zuletzt
// geschlossen» bei leerem Ring. Ein Menüeintrag, der nichts tut, ist eine
// Zusage, die nicht gilt (§8).
export function menueEintraege(
  t: TabEintrag,
  kontext: ReiterEintraegeKontext
): ReiterMenueEintrag[] {
  const {
    ordnung, manifeste, kannOeffnen, istOffen, oeffneDaneben,
    schliessePane, schliessen, alleSchliessen, stelleWiederHer, navigate,
    kopieren, aktivSchluessel,
  } = kontext;

  const idx = ordnung.findIndex((x) => tabSchluessel(x.path) === tabSchluessel(t.path));
  // W2·25: was «rechts davon» wirklich schliesst, sind die FREIEN Reiter
  // rechts davon — angeheftete überleben die Geste (`lib/tabs`). Der Zähler
  // am Menüeintrag zählt darum dasselbe, was die Geste tut (§8).
  const rechts = idx >= 0 ? ordnung.slice(idx + 1).filter((x) => !x.fest) : [];
  // ── W2·25 · DIE ZONE, IN DER DIESER REITER SICH BEWEGEN DARF ───────────
  // Angeheftete Reiter bewegen sich innerhalb der festen Zone, freie
  // innerhalb der freien. Gezeigt wird nur, was auch WIRKT — dieselbe Regel,
  // nach der am ersten Reiter «Nach links» fehlt (§8); sie bekommt mit dem
  // Anheften bloss eine zweite Grenze.
  const zone = festeZone(ordnung);
  const vonIdx = t.fest ? 0 : zone;
  const bisIdx = (t.fest ? zone : ordnung.length) - 1;
  const wieder = letzterGeschlossener();
  const e: ReiterMenueEintrag[] = [];
  if (kannOeffnen && !istOffen(t.path)) {
    e.push({ id: 'daneben', label: 'Daneben öffnen', onKlick: () => oeffneDaneben(t.path) });
  }
  // «Duplizieren» ist der Klick-Weg zur ZWEITEN INSTANZ desselben Dokuments
  // (`?r=<n>`) — dieselbe Buchführung, die der Leser-Knopf bis M8 benutzt
  // hat. Die Funktion geht damit nicht verloren, sie steht jetzt an jedem
  // Reiter statt nur im Erlass-Kopf.
  e.push({ id: 'duplizieren', label: 'Duplizieren', onKlick: () => {
    const ziel = naechsteInstanz(t.path);
    merkeTab(ziel, t.label);
    navigate(ziel);
  } });
  // ── R13-9 · «ADRESSE KOPIEREN» (Prüfbefund 7.9.2026) ────────────────────
  // Das Kontextmenü eines Browser-Tabs trägt sie; die App kann sie (der
  // `LinkTeilenButton` tut dasselbe an anderer Stelle), das Reiter-Menü bot
  // sie nicht an. EIN Klick, kein neuer Zustand. Der Eintrag erscheint nur,
  // wo die Zwischenablage überhaupt zu haben ist (§8: kein toter Eintrag) —
  // `navigator.clipboard` fehlt in unsicheren Kontexten.
  // EINE KOPIER-MECHANIK (R4-D): geschrieben wird über `useKopieren`, nicht
  // von Hand — der Hook quittiert erst NACH erfolgreichem Schreiben und
  // schluckt weder verweigerte Berechtigung noch fehlende API als Erfolg.
  if (typeof navigator !== 'undefined' && navigator.clipboard) {
    e.push({ id: 'adresse', label: 'Adresse kopieren',
      onKlick: () => kopieren(new URL(t.path, window.location.origin).href) });
  }
  // ── W2·18 WELLE 3 PUNKT 5 · UMORDNEN OHNE MAUS ──────────────────────────
  // GEMESSEN am Vorstand (13.9.2026): die Reihenfolge liess sich NUR per
  // HTML5-Drag (Zeiger) oder Alt+⇧+←/→ (Tastatur mit Alt-Taste) ändern. Auf
  // einem Tablet gab es gar keinen Weg — der Finger kennt kein HTML5-Drag.
  // Vier Einträge in dem Menü, das ohnehin da ist, lösen das ohne eine
  // einzige neue Geste; erreichbar per Rechtsklick, Shift+F10 UND Langdruck
  // (`reiterleiste/Reiter.tsx`).
  // Gezeigt wird nur, was auch WIRKT: am ersten Reiter gibt es kein «nach
  // links» (§8 — ein Eintrag, der nichts tut, ist eine Zusage, die nicht
  // gilt). Die Kürzel stehen daneben, weil das Menü der Ort ist, an dem man
  // sie lernt (R13-7).
  if (idx > vonIdx) {
    e.push({ id: 'links-um', label: 'Nach links', rechts: 'Alt+⇧+←',
      onKlick: () => ordneTabsUm(t.path, ordnung[idx - 1].path, true) });
  }
  if (idx >= 0 && idx < bisIdx) {
    e.push({ id: 'rechts-um', label: 'Nach rechts', rechts: 'Alt+⇧+→',
      onKlick: () => ordneTabsUm(t.path, ordnung[idx + 1].path, false) });
  }
  if (idx > vonIdx) {
    // W2·25: «An den Anfang» heisst den Anfang der EIGENEN Zone — für einen
    // freien Reiter also hinter die angehefteten, nicht vor sie. Der Eintrag
    // rückt damit nie über eine Grenze, die das Ziehen daneben ablehnt.
    e.push({ id: 'anfang', label: 'An den Anfang',
      onKlick: () => ordneTabsUm(t.path, ordnung[vonIdx].path, true) });
  }
  if (idx >= 0 && idx < bisIdx) {
    e.push({ id: 'ende', label: 'Ans Ende',
      onKlick: () => ordneTabsUm(t.path, ordnung[bisIdx].path, false) });
  }
  // ── W2·25 · ANHEFTEN / LÖSEN (Spec §7 Teil 1, §5a Ziff. 5) ─────────────
  // Der einzige Weg zu beiden — und für einen angehefteten Reiter zugleich
  // der einzige Weg zum Schliessen (sein ✕ ist bewusst weg,
  // `reiterleiste/Reiter.tsx`). Darum steht «Lösen» VOR den Schliess-Zeilen:
  // wer einen festen Reiter loswerden will, will ihn meist nur befreien.
  e.push(t.fest
    ? { id: 'loesen', label: 'Lösen', onKlick: () => loeseAb(t.path) }
    : { id: 'anheften', label: 'Anheften', onKlick: () => hefteAn(t.path) });
  // W2·25: «alle anderen» schliesst nur die FREIEN anderen — gibt es keine,
  // täte der Eintrag nichts und erscheint darum nicht (§8, dieselbe Regel
  // wie an den Rändern oben).
  if (ordnung.some((x) => !x.fest && tabSchluessel(x.path) !== tabSchluessel(t.path))) {
    e.push({ id: 'andere', label: 'Alle anderen schliessen', onKlick: () => {
      for (const x of ordnung) if (!x.fest && tabSchluessel(x.path) !== tabSchluessel(t.path)) schliessePane(x.path);
      schliesseAndere(t.path);
      navigate(t.path);
    } });
  }
  if (rechts.length > 0) {
    e.push({ id: 'rechts', label: 'Rechts davon schliessen', rechts: String(rechts.length), onKlick: () => {
      for (const x of rechts) schliessePane(x.path);
      schliesseRechtsVon(t.path);
      if (rechts.some((x) => tabSchluessel(x.path) === aktivSchluessel)) navigate(t.path);
    } });
  }
  // W2·25: sind ALLE offenen Reiter angeheftet, schlösse «Alle schliessen»
  // nichts — kein toter Eintrag (§8).
  if (ordnung.some((x) => !x.fest)) {
    e.push({ id: 'alle', label: 'Alle schliessen', onKlick: alleSchliessen });
  }
  // KEINE ✕-Marke: das Schliess-Glyph kommt in dieser App aus genau EINEM
  // Baustein (`ui/SchliessKnopf`, A3-1) — eine Menüzeile, die es selbst
  // zeichnet, wäre die zweite Stelle (Wächter `design-r3b-chrome`).
  e.push({ id: 'schliessen', label: 'Schliessen', rechts: 'Alt+W', onKlick: () => schliessen(t.path) });
  if (wieder) {
    // EIN WORT FÜR EINE SACHE (Ä118-Lehre): dieselbe Zeile steht auch im
    // Überlauf-Blatt, darum derselbe Wortlaut. GEMESSEN 6.9.2026 (Screen
    // `r11-kontextmenue-1440-hell`, zweiter Lauf): «Zuletzt geschlossen:
    // ZGB» brach im Menü hinter dem Doppelpunkt ab — der Name, also gerade
    // das Nützliche, fiel weg. «Wieder öffnen: ZGB» stellt die Tätigkeit
    // nach vorn und trägt den Namen ganz.
    e.push({ id: 'wieder', label: `Wieder öffnen: ${reiterKurzformText(wieder, manifeste)}`,
      rechts: 'Alt+⇧+T', onKlick: stelleWiederHer });
  }
  return e;
}

/** Eine Mappe übernehmen und dorthin gehen, wo sie zeigt. Beides gehört
 *  zusammen: wer eine Mappe öffnet, will ihren ersten Reiter sehen, nicht
 *  bloss eine neue Leiste über dem alten Dokument. */
export function oeffneMappe(
  m: Mappe,
  ordnung: TabEintrag[],
  schliessePane: (path: string) => void,
  setMappenAbsicht: (a: MappenAbsicht | null) => void,
  navigate: (path: string) => void,
) {
  for (const x of ordnung) if (!x.fest) schliessePane(x.path);
  const neu = uebernehmeMappe(m.reiter);
  setMappenAbsicht(null);
  const ziel = neu.find((t) => m.reiter.some((r) => tabSchluessel(r.path) === tabSchluessel(t.path)));
  if (ziel) navigate(ziel.path);
}
