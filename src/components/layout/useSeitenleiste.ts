import { useCallback, useEffect, useState } from 'react';

// ─── Seitenleisten-Layout (einklappbar + breitenverstellbar, persistent) ─────
//
// Reiner UI-Zustand der Darstellungsschicht (§3 — KEINE Rechtslogik): Breite und
// Eingeklappt-Status der Desktop-Seitenleiste, gespiegelt in localStorage, damit
// die Wahl über Sitzungen/Reloads erhalten bleibt (Auftrag David: Seitenleiste
// während des Gebrauchs ein-/ausklappbar + verstellbar).
//
// SSR/Prerender-sicher: Initialwerte über typeof-window-Guard (Default = offen,
// Standardbreite). Die App ersetzt beim Mount (createRoot render-then-replace),
// hydratisiert also nicht — der erste Client-Render darf direkt aus localStorage
// lesen, ohne Mismatch-Klasse.

const BREITE_KEY = 'lexmetrik-seitenleiste-breite';
// ── A1 (H2b-Nachzug, Bug-Check 17.8.2026) · VERSIONIERTER SCHLÜSSEL ──────────
// Der Alt-Schlüssel ohne Suffix ist UNBRAUCHBAR als Wahl-Speicher: der Stand vor
// H2b legte bei JEDEM Mount `'0'` ab (Effekt ohne Wahl-Unterscheidung, s. u.).
// Wer die Anwendung vor H2b ein einziges Mal geöffnet hat, trägt darum `'0'` im
// Speicher — H2b las das als «Nutzer will offen» und die Ä1c-Vorgabe «im Leser
// eingeklappt» griff nur in fabrikneuen Profilen. GEMESSEN 17.8.2026 @1440
// (StPO, `?leser=v3`): mit vorbelegtem `'0'` stand die App-Leiste 256 px breit
// offen, fabrikneu 0 px.
const EIN_KEY = 'lexmetrik-seitenleiste-eingeklappt.v2';
const EIN_KEY_ALT = 'lexmetrik-seitenleiste-eingeklappt';

/** Grenzen der ziehbaren Breite (px). Standard entspricht dem früheren `w-64`. */
export const BREITE_MIN = 208;
export const BREITE_MAX = 460;
const BREITE_STD = 256;
/** Schrittweite der Tastatur-Verstellung (Pfeiltasten auf dem Ziehgriff). */
export const BREITE_SCHRITT = 16;

function klemme(b: number): number {
  return Math.min(BREITE_MAX, Math.max(BREITE_MIN, Math.round(b)));
}

function ladeBreite(): number {
  if (typeof window === 'undefined') return BREITE_STD;
  const v = Number(window.localStorage.getItem(BREITE_KEY));
  return Number.isFinite(v) && v >= BREITE_MIN && v <= BREITE_MAX ? v : BREITE_STD;
}

// ── Ä1c (LESER-V3 H2b) · «noch nicht gewählt» ist ein eigener Zustand ────────
//
// BEFUND (Ästhetik-Review H1, gemessen 17.8.2026): im Gesetz-Leser stand die
// 256 px breite App-Seitenleiste offen und nahm dem Lesetext ein Sechstel der
// Fensterbreite — obwohl der Leser seine eigene Hauptnavigation (die Gliederung)
// gleich daneben trägt. Verlangt ist: im Leser eingeklappt STARTEN, die
// Nutzerwahl aber respektieren.
//
// Das ging vorher konstruktiv nicht. Der Schreib-Effekt legte bei JEDEM Mount
// `'0'` ab, also auch dann, wenn niemand etwas gewählt hatte — nach dem ersten
// Seitenaufruf war «offen, weil Vorgabe» von «offen, weil gewählt» nicht mehr zu
// unterscheiden, und ein Vorgabewert je Bereich hätte die Wahl überschrieben.
//
// NEU: `null` = keine Wahl. Geschrieben wird nur, was der Nutzer selbst
// umschaltet. Der Vorgabewert kommt vom Aufrufer und darf sich mit dem Bereich
// ändern; sobald einmal umgeschaltet wurde, gewinnt die Wahl überall und für
// immer. Weiterhin reiner UI-Zustand (§3) und Prerender-sicher.
//
// ── A1 · WAS AUS DEM ALT-SCHLÜSSEL ÜBERNOMMEN WIRD, UND WARUM NUR DAS ────────
// Der Alt-Schlüssel wird gelesen, aber nur der Wert `'1'`. Das ist keine
// Vorsicht, sondern die einzige Lesart, die die Beweislage zulässt: der
// Alt-Effekt schrieb `eingeklappt ? '1' : '0'` bei jedem Mount, also
//   `'0'` = «Leiste war offen» — das war der VORGABEWERT und ist von einer Wahl
//           nicht zu unterscheiden ⇒ zählt NICHT als Wahl,
//   `'1'` = «Leiste war eingeklappt» — dazu musste jemand den Schalter drücken,
//           denn eingeklappt war nie die Vorgabe ⇒ zählt als Wahl.
// Damit verliert niemand eine echte Wahl, und die Ä1c-Vorgabe wirkt für alle
// Bestandsnutzer. Der Alt-Schlüssel wird NICHT gelöscht und NICHT geschrieben:
// eine Migration, die beim Mount in den Speicher greift, wäre genau der Fehler,
// den A1 aufdeckt (Schreiben ohne Nutzerhandlung).
/**
 * Die ENTSCHEIDUNG, getrennt vom Speicherzugriff (§2, DOM-frei und darum an
 * jeder Kombination prüfbar — `src/tests/seitenleiste-wahl.test.ts`):
 * `null` = keine Wahl ⇒ der Aufrufer nimmt seinen Vorgabewert.
 */
export function wahlAusSpeicher(v2: string | null, alt: string | null): boolean | null {
  if (v2 === '1') return true;
  if (v2 === '0') return false;
  return alt === '1' ? true : null;
}

function ladeEingeklappt(): boolean | null {
  if (typeof window === 'undefined') return null;
  return wahlAusSpeicher(
    window.localStorage.getItem(EIN_KEY),
    window.localStorage.getItem(EIN_KEY_ALT),
  );
}

// ── Ä1c (LESER-V3 H2b, 17.8.2026) · DER ABGELÖSTE BEFUND, WÖRTLICH ──────────
// Aus `Shell.tsx` hierher verschoben, als D25 den bereichsabhängigen Vorgabewert
// abschaffte (Beleg altert nicht, er wird ergänzt — er begründete die Mechanik,
// die D25 weiterbenutzt):
//   «Der Leser trägt seine eigene Hauptnavigation (die Gliederung) unmittelbar
//    daneben; die 256 px der App-Leiste gingen dort dem Lesetext verloren, ohne
//    etwas beizutragen (Design-Grundlage Kap. 1 Nr. 1: ≥ 60 % der Fläche gehören
//    dem Normtext). Es ist eine VORGABE, keine Sperre: `useSeitenleiste`
//    unterscheidet seit H2b «noch nicht gewählt» von «gewählt», und eine einmal
//    getroffene Nutzerwahl gewinnt hier wie überall.
//    Bewusst der Gesetz-Leser und nicht «jede Inhaltsseite»: nur er hat eine
//    zweite, gleichwertige Navigationsspalte. Und bewusst OHNE Kenntnis des
//    V3-Flags — die Vorgabe gilt für beide Hüllen, der Befund ist in beiden
//    derselbe (FL-1: das Flag hat genau einen Schaltpunkt, und der ist nicht hier).»
// Gemessen blieb, was gemessen wurde; nur der GELTUNGSBEREICH ist seit D25 «alle
// Routen» statt «nur der Leser».

// ── D25 (David 6.9.2026) · DIE LEISTE STARTET ÜBERALL EINGEKLAPPT ───────────
// «seitenleiste soll als default zuerst eingeklappt sein». Damit ist die
// Ä1c-Vorgabe von 2026-08-17 («nur im Gesetz-Leser eingeklappt») nicht
// verschärft, sondern ABGELÖST: die Unterscheidung «Leser vs. Rest» hatte ihren
// Grund allein darin, dass der Leser eine zweite Navigationsspalte trägt — jetzt
// gilt für JEDE Route dasselbe, und ein bereichsabhängiger Vorgabewert wäre eine
// Regel ohne Fall. Der Aufrufer bestimmt darum nichts mehr (der Parameter ist
// mit dieser Zeile weggefallen, §17-Gegengewicht: was nicht scheitern kann,
// wird gestrichen statt bewacht).
//
// WAS SICH NICHT ÄNDERT: `null` = «noch nicht gewählt». Wer den Schalter im
// Titelblatt einmal betätigt, dessen Wahl gewinnt überall und für immer —
// dieselbe Mechanik wie seit H2b, nur mit anderem Vorgabewert.
//
// PRERENDER: `ladeEingeklappt()` liefert ohne `window` null ⇒ der Vorgabewert
// greift ⇒ das prerenderte HTML trägt KEINE Seitenleiste, die Inhaltsspalte hat
// ab dem ersten Frame die volle Breite. Der erste Client-Render liest
// localStorage synchron (kein Hydrations-Mismatch, s. Kopf dieser Datei), also
// springt auch bei getroffener Wahl nichts nach.
const VORGABE_EINGEKLAPPT = true;

export interface SeitenleisteLayout {
  breite: number;
  setBreite: (b: number) => void;
  eingeklappt: boolean;
  umschalten: () => void;
}

export function useSeitenleiste(): SeitenleisteLayout {
  const [breite, setBreiteRoh] = useState(ladeBreite);
  const [wahl, setWahl] = useState<boolean | null>(ladeEingeklappt);

  const setBreite = useCallback((b: number) => setBreiteRoh(klemme(b)), []);
  // Umschalten heisst: ab jetzt gibt es eine Wahl. Sie bezieht sich auf das, was
  // gerade zu sehen ist — darum kippt sie den WIRKSAMEN Zustand, nicht die
  // gespeicherte `null`.
  const umschalten = useCallback(() => setWahl((w) => !(w ?? VORGABE_EINGEKLAPPT)), []);

  useEffect(() => {
    try { window.localStorage.setItem(BREITE_KEY, String(breite)); } catch { /* Speicher gesperrt — Zustand bleibt nur für die Sitzung */ }
  }, [breite]);
  useEffect(() => {
    // NUR eine echte Wahl wird abgelegt. Ohne Wahl bleibt der Schlüssel
    // ungeschrieben — genau daran erkennt der nächste Aufruf, dass er den
    // Vorgabewert seines Bereichs nehmen darf.
    if (wahl === null) return;
    try { window.localStorage.setItem(EIN_KEY, wahl ? '1' : '0'); } catch { /* s. o. */ }
  }, [wahl]);

  return { breite, setBreite, eingeklappt: wahl ?? VORGABE_EINGEKLAPPT, umschalten };
}
