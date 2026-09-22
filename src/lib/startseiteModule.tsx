// ─── Modul-Registry der Startseite (FAHRPLAN-STARTSEITE §2/§3) ──────────────
//
// Reine Darstellungs-Deklaration (§3): welche Module die Startseite unter dem
// Pult-Kopf anbietet, in welcher Ordnung, mit welchem Register und welcher
// Werkseinstellung. Katalog bleibt startseiteConfig.ts, Rubriken bleiben
// navigation.ts (§5). OHNE `sichtbar()` — SSR-Determinismus ist nicht
// garantierbar (Council-Auflage 3); Leerzustände gehören INS Modul.
//
// W2·24-DESIGN-IDENTITAET R10 (6.9.2026, DEKLARIERTE fachliche Änderung, kein
// Refactoring — Referenzbild `abnahme/design-identitaet/pult-freigegeben.html`,
// von David am 6.9.2026 freigegeben: «ja das gefällt mir, nimm das als vorgabe
// für runde 10»). Drei Folgen für dieses Registry:
//
//  1. DER KOPF IST KEIN MODUL MEHR. Suche, Bereichs-Reihe und «Zuletzt» stehen
//     als feste Ebenen des Pults in `pages/Startseite.tsx` — sie sind nicht
//     abschaltbar, und ein Registry-Eintrag mit `standard: true, fest: true`
//     wäre ein Schalter, den es nicht gibt (§6.7: was nicht scheitern kann,
//     wird gestrichen statt bewacht). Das Registry führt darum genau die FÜNF
//     Module, die einen Schalter tragen.
//  2. JEDES MODUL TRÄGT TITEL UND REGISTER HIER, nicht in seiner Komponente.
//     Beide werden an ZWEI Orten gebraucht — an der Modulzeile selbst und im
//     Blatt «Startseite anpassen». Stünden sie in der Komponente, müsste das
//     Blatt sie ein zweites Mal führen (§5).
//  3. DIE MARGINALIENSPALTE IST WEG. Die Module rendern ihren Inhalt; Kopfzeile,
//     Registerstrich und der Schalter «Anzeigen/Ausblenden» kommen aus dem EINEN
//     Rahmen `components/start/PultModul`.
//
// WERKSEINSTELLUNG (Referenzbild, Vorgabe David): Systematik · Frist · Entscheide
// offen; Kantone und Materialien-nach-Behörde zu, aber verfügbar. Sie ist die
// Vorgabe, nicht die Wahrheit: was der Nutzer wählt, liegt in
// `lib/startseiteEinstellung.ts` (localStorage), und der Prerender liefert immer
// die Werkseinstellung aus.

import { SystematikListe } from '../components/start/SystematikListe';
import { KantoneRaster } from '../components/start/KantoneRaster';
import { EntscheideListe } from '../components/start/EntscheideListe';
import { MaterialienListe } from '../components/start/MaterialienListe';
import { Werkzeuge } from '../components/start/Werkzeuge';

// Die Typen stehen in `startseiteModulTypen.ts` — ohne diese Trennung liefe der
// Typ-Import der Modul-Komponenten (`Register`, `StartModulProps`) zurueck in
// die Datei, die dieselben Komponenten als Werte laedt: ein echter Import-
// Zyklus (check:zyklen). Diese Datei bleibt die Fassade (§6.6) — wer die Typen
// hier importiert, bekommt sie unveraendert.
export type { StartModul } from './startseiteModulTypen';
import type { StartModul } from './startseiteModulTypen';

// Reihenfolge = die des Referenzbildes: Bundesrecht → Kantone → Frist →
// Entscheide → Materialien. Nachschlagen vor Rechnen bleibt die Grundordnung
// (wie NAVIGATION); die Frist-Zeile steht dazwischen, weil sie im Bild der eine
// Handgriff zwischen den beiden Gesetzes-Modulen und der Rechtsprechung ist.
// Wer es anders will, ordnet es selbst um — dafür gibt es den Schalter.
export const START_MODULE: readonly StartModul[] = [
  { id: 'systematik', titel: 'Bundesrecht, systematische Ordnung', reg: 'g', standard: true, Komponente: SystematikListe },
  { id: 'kantone', titel: 'Kantone, erfasste Erlasse', reg: 'g', standard: false, Komponente: KantoneRaster },
  { id: 'frist', titel: 'Frist berechnen', reg: 'w', standard: true, Komponente: Werkzeuge },
  { id: 'entscheide', titel: 'Jüngste Entscheide im Korpus', reg: 'r', standard: true, Komponente: EntscheideListe },
  { id: 'behoerden', titel: 'Amtliche Materialien nach Behörde', reg: 'm', standard: false, Komponente: MaterialienListe },
];
