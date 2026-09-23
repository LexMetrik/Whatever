// ─── Oberkategorien des Registers (Auftrag David 10.6.2026) ─────────────────
//
// «aufteilen in zuständigkeiten, fristen, gebühren und vorlagen als grosse
// oberkategorien»: Die Startseite gliedert den Katalog primär nach dem
// OUTPUT-Typ (was die Kanzlei bekommt), nicht mehr nach juristischen
// Obergruppen; das Rechtsgebiet bleibt als zweite Ebene (Kacheln) erhalten.
// SSoT (§5): Jede Karte fällt über `kategorieFuer` deterministisch in GENAU
// eine Kategorie — Werkzeuge per expliziter Zuordnung (Test erzwingt
// Vollständigkeit, src/tests/oberkategorien.test.ts).

import type { CalculatorCard } from './startseiteConfig';

export type OberkategorieId = 'zustaendigkeiten' | 'fristen' | 'gebuehren' | 'vorlagen';

export interface Oberkategorie {
  id: OberkategorieId;
  titel: string;
  lede: string;
}

export const OBERKATEGORIEN: Oberkategorie[] = [
  { id: 'zustaendigkeiten', titel: 'Zuständigkeiten',
    lede: 'Welches Gericht, welche Behörde, welches Rechtsmittel – die Eingangsfrage jedes Mandats.' },
  { id: 'fristen', titel: 'Fristen',
    lede: 'Prozessuale und materielle Fristen – vom auslösenden Ereignis bis zum letzten Tag, mit Kalender-Export.' },
  { id: 'gebuehren', titel: 'Gebühren & Beträge',
    lede: 'Gebühren, Zinsen, Quoten und Kosten – Franken für Franken hergeleitet.' },
  { id: 'vorlagen', titel: 'Vorlagen',
    lede: 'Verträge, Eingaben, Erklärungen und Dokumentmappen – regelbasiert aufgesetzt, mit ehrlichen Form-Grenzen.' },
];

// Werkzeug-Karten (rechtsgebietsübergreifend) tragen keinen fachlichen
// Output-Typ — sie werden EXPLIZIT zugeordnet; der Test bricht, wenn eine
// neue Werkzeug-Karte hier fehlt (keine stille Fallback-Einsortierung).
const WERKZEUG_KATEGORIE: Record<string, OberkategorieId> = {
  tagerechner: 'fristen',
  'ferien-checker': 'fristen',
  'ferien-assistent': 'fristen',
  teuerungsrechner: 'gebuehren',
  'kostenblatt-export': 'gebuehren',
  checklisten: 'vorlagen',
  mandatsaufnahme: 'vorlagen',
  // Gerichts-Baustein-Set (ROADMAP W2·7): der amtliche Zitierer ist ein
  // Text-/Schriftsatz-Baustein, Geschwister der Rubrum-Vorlage. Bis 23.9.2026
  // hier 'vorlagen' — damit stand er auf KEINER Katalogseite (/rechner blendet
  // `vorlagen` aus, das VorlagenRegister zeigt nur modus 'vorlage'), zählte
  // aber im Kopf «23 Rechner». Entscheid David 23.9.2026: auf /rechner
  // (K8 W2·29-WERKBANK-KATALOGE). Zuständigkeiten statt Fristen/Gebühren: die
  // einzige Rechner-Oberkategorie mit Gerichts-Bezug («welches Gericht …,
  // welches Rechtsmittel»), und ihr Register führt Nicht-Feld-Karten als
  // «Weitere Werkzeuge». Das Fristen-Register hängte unzugeordnete Karten
  // unter «Materielle Fristen» (sachlich falsch), das Gebühren-Register zeigt
  // Karten ohne Rubrik gar nicht (gebuehrenRubrik → null).
  gerichtszitat: 'zustaendigkeiten',
};

export function kategorieFuer(karte: CalculatorCard): OberkategorieId | null {
  if (karte.modus === 'vorlage') return 'vorlagen';
  switch (karte.art) {
    case 'zuordnung': return 'zustaendigkeiten';
    case 'frist': return 'fristen';
    case 'betrag': return 'gebuehren';
    case 'werkzeug': return WERKZEUG_KATEGORIE[karte.id] ?? null;
    default: return null;
  }
}
