import { useEffect, useRef } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';
import { ersetzeTab, merkeTab } from '../lib/tabs';
import { labelAusMeta } from '../lib/verlaufLabel';
import { kanonisierePfad } from '../lib/normtext/erlassAdresse';

// Unsichtbarer Tracker in App.tsx: öffnet einen Reiter NUR für ein KONKRETES
// Inhalts-Item (Auftrag David) — ein bestimmter Rechner/Engine, ein bestimmtes
// Gesetz, eine bestimmte Vorlage oder ein konkreter Entscheid (zweite Pfadebene
// unter einer Inhalts-Rubrik). Seit D7 tragen auch die fünf Bereichs-Übersichten
// einen Reiter, seit R14 (7.9.2026) die Sammlung «/»; ohne Reiter blieben bis
// R14b allein die Info-/Meta-Seiten (/ueber, /methodik, /einstellungen,
// /kontakt) — seit R14b trägt JEDE Route einen Reiter (Herleitung in
// `lib/tabs.ts`, Block «R14b»). Reines localStorage-Schreiben (§3).
//
// ── W2·24 §5a Ziff. 3 (R2-NACHZUG) · NAVIGATION ERSETZT, SIE HÄUFT NICHT AN ──
// Bis 6.9.2026 hängte JEDE Navigation einen Reiter an (`merkeTab`). GEMESSEN
// (Preview 4335, drei Klicks OR → ZGB → ZPO über die Gesetze-Übersicht): drei
// Reiter, ohne dass jemand einen zweiten gewollt hätte — genau der
// «Reiter-Wildwuchs», den David 6.9.2026 ausgeschlossen hat. Jetzt gilt die
// Browser-Regel: der Klick ersetzt den AKTIVEN Reiter (`ersetzeTab`); ein
// zweiter entsteht nur auf ausdrückliche Geste —
//   · Mittelklick oder Ctrl/⌘-Klick auf einen Inhalts-Link (unten),
//   · ⌘/Ctrl+Enter im Suchfeld (`layout/HeaderSuche.tsx`, Navigations-State
//     `lmNeuerReiter`),
//   · «zweite Instanz» desselben Erlasses (`lib/useErlassOeffnen.ts`,
//     `gesetz-leser/v3/ReiterAktion.tsx` — beide rufen weiterhin `merkeTab`).
//
// ── R14 (Entscheid David 7.9.2026) · ALLES IST EIN REITER ───────────────────
// Die Sammlung «/» ist seit R14 ein gewöhnlicher Reiter (`lib/tabs`, Block bei
// `istReiterPfad`). Hier folgen daraus GENAU ZWEI Sätze:
//   · Wer auf «/» geht, ERSETZT nichts — die Sammlung wird aktiviert oder
//     angelegt (`merkeTab`). Das ist der Fix für Davids «weird»: der Klick auf
//     die Marke lässt das offene Gesetz stehen, statt es zu überschreiben.
//   · Wer eine Nicht-Reiter-Route betritt (/ueber, /kontakt …), verliert den
//     aktiven Reiter als Herkunft (`aktiv.current = null`). Sonst zeigte der Ref
//     weiter auf das verlassene Dokument, und die nächste Navigation träfe
//     DESSEN Reiter — genau die gemessene Wurzel des Verlusts (R14-Prüfung
//     §1.4). Damit erzeugt der Aufrufer endlich den Fall 3, den der Vertrag von
//     `lib/tabs.ersetzeTab` seit dem R2-Nachzug beschreibt.
//
// ── R14b (Nachzug 7.9.2026) · DER ZWEITE SATZ IST WEGGEFALLEN ──────────────
// Der Absatz darüber bleibt als datierter Beleg (§0 Ziff. 2b): er galt bis
// `8d398874e`. Seit R14b gibt es keine Nicht-Reiter-Route mehr, also auch
// keinen Zweig, der den aktiven Reiter als Herkunft wegwirft — die Meta-Seiten
// ERSETZEN den aktiven Reiter wie jedes andere Dokument. Der Fall 3 von
// `ersetzeTab` («kein aktiver Reiter») bleibt erreichbar: er ist der Kaltstart.
//
// ── D7 (David 6.9.2026) · DIE BEREICHS-ÜBERSICHTEN ZÄHLEN MIT ───────────────
// «achte darauf dass der reiter bei gesetz mitzählt». WELCHER Pfad einen Reiter
// trägt, entscheidet seit diesem Nachzug `lib/tabs.ts` (`istReiterPfad`) —
// dort steht auch die Begründung, warum die fünf Bereichs-Übersichten jetzt
// dazugehören und die Startseite «/» weiterhin nicht. Hier bleibt nur der
// Aufruf: das frühere Regex-Literal stand an ZWEI Stellen dieser Datei (Effekt
// und Mittelklick-Geste) und wäre beim ersten Nachjustieren auseinander-
// gelaufen (§5).

/** Navigations-State, mit dem ein Aufrufer «diesmal ein NEUER Reiter» sagt.
 *  Bewusst über `navigate(ziel, { state })` statt über ein Modul-Flag: der
 *  Wunsch gehört zu GENAU dieser Navigation und überlebt sie nicht (§2). */
export interface NeuerReiterState { lmNeuerReiter?: boolean }

export function TabTracker() {
  const { pathname, search, hash, state } = useLocation();
  // Die RICHTUNG der Navigation, deterministisch aus dem Router (§2): 'POP' =
  // Zurück/Vorwärts. Nur eine Vorwärts-Navigation verbraucht einen Reiter und
  // gehört in den Schliess-Ring — Blättern nicht (Herleitung bei `ersetzeTab`).
  const navTyp = useNavigationType();
  // Die Adresse, aus der die nächste Navigation kommt = der aktive Reiter.
  // `null` beim Kaltstart: dort wird nichts ersetzt, sondern der bestehende
  // Reiter aktualisiert bzw. angehängt — die Persistenz bleibt unberührt.
  const aktiv = useRef<string | null>(null);
  useEffect(() => {
    // R14b: hier stand der Meta-Zweig (`aktiv.current = null`). Er ist
    // ersatzlos weg — jede Route läuft jetzt denselben Weg.
    // pathname + ?search: der Instanz-Diskriminator ?r=<n> (dasselbe Gesetz
    // mehrfach offen, Auftrag David) gehört zur Reiter-Identität; merkeTab/
    // tabSchluessel ignorieren übrige Query-Parameter für die Dedup-Identität.
    // KANONISIERT (Gegenprüfung 29.8.2026, Mangel 2): dieser Effekt läuft VOR
    // dem Umzugs-Sprung im Leser — bei einer Alt-Adresse merkte er darum erst
    // `/gesetze/bund/CISG` und gleich danach `/gesetze/international/CISG`, also
    // zwei Reiter für EIN Gesetz, einer davon tot. Gemerkt wird die kanonische
    // Adresse; ein Alt-Link erzeugt damit denselben Reiter wie der neue.
    // ── #hash SEIT DEM R2-NACHZUG DABEI (F5): der GEWÄHLTE Artikel steht in der
    // Adresse und beschriftet den Reiter («Art. 336c OR», §5a Ziff. 2). Die
    // laufende Lesestellung schreibt weiterhin allein `aktualisiereTabArtikel`.
    const ziel = kanonisierePfad(pathname) + search + hash;
    const label = labelAusMeta(pathname) ?? undefined;
    // R14: die Sammlung wird AKTIVIERT oder ANGELEGT, nie an die Stelle eines
    // anderen Reiters gesetzt — dieselbe Semantik wie `merkeTab` sie ohnehin
    // trägt (Dublette behält ihre Position, Neues hängt hinten an). Damit ist
    // die «Höchstens EINE Sammlung»-Regel des «+» dieselbe Regel, kein zweiter
    // Ort (§5) — und der Weg zurück ins Gesetz kostet keinen Reiter.
    if ((state as NeuerReiterState | null)?.lmNeuerReiter || pathname === '/') merkeTab(ziel, label);
    else ersetzeTab(aktiv.current, ziel, label, navTyp !== 'POP');
    aktiv.current = ziel;
  }, [pathname, search, hash, state, navTyp]);

  useNeuerReiterGeste();
  return null;
}

/** ── «In neuem Reiter öffnen» ohne Menü: Mittelklick und Ctrl/⌘-Klick ───────
 *
 *  Erkannt wird die GESTE (Maustaste + Modifikator), nicht eine `data-`-Marke:
 *  so gilt sie für jeden Inhalts-Link der App, auch für künftige, ohne dass
 *  irgendwo ein Attribut nachgezogen werden muss.
 *
 *  Wie im Browser öffnet die Geste den Reiter IM HINTERGRUND — die aktuelle
 *  Ansicht bleibt stehen, der neue Reiter erscheint in der Arbeitsleiste. Der
 *  Vorgabe-Weg des Browsers (ein neues BROWSER-Fenster/-Tab) wird dabei
 *  unterdrückt; er bleibt über Shift-Klick und das Kontextmenü des Browsers
 *  erreichbar, und weil die Reiter im localStorage derselben Herkunft liegen,
 *  sieht ein zweites Browser-Fenster dieselbe Liste.
 *
 *  Ziel ist jeder app-eigene, absolute Pfad. Bis R14b filterte hier zusätzlich
 *  `istReiterPfad`, weil ein Mittelklick auf «Über uns» kein Reiter-Ziel hatte;
 *  seit R14b gibt es diesen Fall nicht mehr — jede In-App-Adresse ist ein
 *  Reiter, genau wie im Browser jeder Link ein Tab werden kann. Externe Ziele
 *  (http(s), mailto, `target="_blank"`, Downloads) bleiben unverändert beim
 *  Browser; das prüft die Bedingung unten. */
function useNeuerReiterGeste(): void {
  useEffect(() => {
    const geste = (e: MouseEvent) => {
      if (e.defaultPrevented) return;
      const mittel = e.type === 'auxclick' && e.button === 1;
      const modifiziert = e.type === 'click' && (e.ctrlKey || e.metaKey) && !e.altKey && !e.shiftKey;
      if (!mittel && !modifiziert) return;
      const a = (e.target as Element | null)?.closest?.('a[href]') as HTMLAnchorElement | null;
      if (!a || a.target === '_blank' || a.hasAttribute('download')) return;
      // ── W2·18 WELLE 3 PUNKT 3 · DAS REITERBAND IST KEIN INHALT ────────────
      // Seit dem Rollenwechsel ist jeder Reiter der Arbeitsleiste selbst ein
      // `<a href>` — und lief damit in diese Geste hinein. GEMESSEN 13.9.2026
      // (gebautes dist/, Chromium, vier Reiter): der Mittelklick auf Reiter 2
      // kam hier an, wurde mit `preventDefault`/`stopPropagation` beansprucht
      // und endete in `merkeTab` auf einen bereits offenen Pfad — der Reiter
      // blieb stehen, statt zu schliessen.
      // Für die Leiste gilt das REITERBAND-Idiom, nicht das Link-Idiom:
      // Mittelklick schliesst (`reiterleiste/Reiter.tsx`), und «in einem neuen
      // Reiter öffnen» wäre hier ohnehin ein stiller Leerlauf — der Reiter ist
      // ja schon offen. Strg/⌘-Klick fällt damit an den Browser zurück und
      // öffnet dieselbe Adresse in einem zweiten Browser-Fenster; die Reiter
      // liegen im localStorage derselben Herkunft, die Liste ist dort dieselbe.
      if (a.closest('[data-reiter-streifen]')) return;
      const href = a.getAttribute('href') ?? '';
      // Nur app-eigene, absolute Pfade — kein http(s), kein mailto, kein #-Sprung.
      if (!href.startsWith('/')) return;
      const [vorHash, ankerTeil] = href.split('#');
      const pfad = vorHash.split('?')[0];
      e.preventDefault();
      e.stopPropagation();
      merkeTab(
        kanonisierePfad(pfad) + (vorHash.includes('?') ? `?${vorHash.split('?')[1]}` : '') + (ankerTeil ? `#${ankerTeil}` : ''),
        labelAusMeta(pfad) ?? undefined,
      );
    };
    // Capture-Phase: der Klick soll nicht erst durch fremde Handler laufen, die
    // ihn (wie React Routers `Link` bei unmodifizierten Klicks) beanspruchen.
    document.addEventListener('click', geste, true);
    document.addEventListener('auxclick', geste, true);
    return () => {
      document.removeEventListener('click', geste, true);
      document.removeEventListener('auxclick', geste, true);
    };
  }, []);
}
