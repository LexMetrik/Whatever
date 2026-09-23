// ─── Typen des Startseiten-Modul-Registrys (W2·24-DESIGN-IDENTITAET) ────────
//
// Reine Typ-Deklarationen — bewusst OHNE Wert-Import. Das Registry selbst
// (`lib/startseiteModule.tsx`) importiert die fünf Modul-Komponenten als Werte;
// dieselben Komponenten brauchen umgekehrt die Typen `Register` und
// `StartModulProps`. Stünden die Typen im Registry, liefe jeder solche Import
// zurück in die Datei, die die Komponente lädt — madge sieht darin einen
// echten Zyklus und `check:zyklen` wird rot (Schranke 1, kalibriert auf den
// EINEN beabsichtigten NormText-Zyklus).
//
// Gleiches Muster wie B22 (`normtext/register-typen.ts`, `adapter-typen.ts`):
// die Typen wandern in ein blattnahes Modul, das Registry bleibt der Ort der
// Registrierung. `lib/startseiteModule.tsx` re-exportiert sie unverändert
// weiter (Fassade, §6.6) — bestehende Importpfade bleiben gültig.

import type React from 'react';

/** Die vier Register der Sammlung (index.css `--reg-*`, R1) — hier definiert,
 *  weil das Registry die Zuordnung Modul → Register trägt und die Komponenten
 *  sie nur konsumieren (§5; vormals in `start/Satzspiegel`, R3). */
export type Register = 'g' | 'r' | 'm' | 'w';

type StartModulId = 'systematik' | 'kantone' | 'frist' | 'entscheide' | 'behoerden';

/** Was jedes Modul von seinem Rahmen erfährt. */
export interface StartModulProps {
  /**
   * Ist das Modul aufgeklappt?
   *
   * Ein zugeklapptes Modul wird WEITER GERENDERT (der Rahmen versteckt seinen
   * Inhalt mit `hidden`), damit Server- und Client-Baum dieselbe Gestalt haben —
   * React 19 wirft bei einem Struktur-Unterschied die Hydration weg und rendert
   * neu, was auf «/» die ganze Seite umbauen würde. Module mit NACHLADENDEM
   * Inhalt (Entscheide) lesen diese Angabe trotzdem und laden nichts, solange
   * sie zu sind — verstecktes Nachladen wäre Verkehr ohne Nutzen (§15).
   */
  an: boolean;
}

export interface StartModul {
  id: StartModulId;
  /** Beschriftung der Modulzeile UND des Eintrags im Blatt «Startseite anpassen». */
  titel: string;
  /** Registerfarbe des 3-px-Strichs (die einzige Farbfläche der Startseite). */
  reg: Register;
  /** Werkseinstellung: offen ohne eigene Wahl des Nutzers? */
  standard: boolean;
  /** MUSS beim Prerender synchron rendern (prerender.ts verbietet Suspense-Reste). */
  Komponente: React.ComponentType<StartModulProps>;
}
