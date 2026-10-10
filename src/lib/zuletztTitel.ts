// ─── Schreibzeit-Titelauflösung für den «Zuletzt verwendet»-Tracker ──────────
//
// Löst den Anzeige-Titel eines besuchten Gesetzes-/Entscheid-Pfads AUF, WÄHREND
// der Besuch getrackt wird (Schreibzeit), und reicht ihn an merkeBesuch weiter —
// die Startseite liest danach nur den gespeicherten Titel, löst NIE selbst auf
// (kein Register-/Korpus-Import in den Startseiten-Chunk, §15.3).
//
// Zwei Auflösungswege (EIN Resolver, SSoT §5 — teilt die reinen Helfer aus
// verlaufLabel.ts mit der Verlauf-Schiene, kein zweiter find):
//   · Katalog/statisch (Rechner/Vorlagen) → labelAusMeta(), synchron im Shell-
//     Bundle. Der Tracker nimmt diesen Weg direkt; hier als erster Zweig belassen,
//     damit die Funktion für JEDEN Inhaltspfad das bestmögliche Label liefert.
//   · Gesetz/Entscheid → die Manifest-LADER werden NUR hier per dynamischem
//     import() geholt (NIE statisch), damit weder Startseiten- noch Shell-Chunk
//     die Register-Ladeschicht (normtext/rechtsprechung-browse) statisch einbinden
//     — gleiches Muster wie Shell.tsx. Auf der besuchten Leser-Seite ist das
//     Manifest ohnehin schon geladen (modulweiter Promise-Cache in browse.ts) →
//     kein Doppel-Fetch, off-critical-path.
//
// null = nicht auflösbar (kein Manifest / unbekannter Schlüssel) → der Tracker
// merkt dann NICHTS (kein Roh-Slug-Chip, §8) — unverändertes Alt-Verhalten für
// nicht auflösbare Routen.

import { gesetzPfad, entscheidPfad, materialPfad, erlassVonPfad, labelAusMeta } from './verlaufLabel';

// Kurzform bevorzugt (Kürzel/Zitierung sind schon knapp); nur der lange
// Titel-Fallback (Erlass ohne Kürzel) wird gekappt, damit der Chip nicht über die
// harte 1-Zeilen-Kappung hinaus in die Breite wächst. Reine Anzeige-Metadaten,
// keine Rechtslogik (§2/§13).
const MAX_TITEL = 40;
function kuerze(s: string): string {
  const t = s.trim();
  if (t.length <= MAX_TITEL) return t;
  // An der Wortgrenze kappen statt mitten im Wort/Datum («… vom 26.0…», live
  // beobachtet bei langen kantonalen Zitierungen); liegt die letzte Wortgrenze
  // unnatürlich früh (< halbe Länge), hart kappen statt zu viel wegzuwerfen.
  const hart = t.slice(0, MAX_TITEL - 1);
  const grenze = hart.lastIndexOf(' ');
  const kopf = grenze > MAX_TITEL / 2 ? hart.slice(0, grenze) : hart;
  return `${kopf.trimEnd()}…`;
}

/** Bestmöglicher, kurzer Anzeige-Titel für einen Inhaltspfad zur Schreibzeit;
 *  null wenn (noch) nicht auflösbar. Für Gesetz/Entscheid lazy per import(). */
export async function loeseZuletztTitel(path: string): Promise<string | null> {
  const meta = labelAusMeta(path);
  if (meta) return meta;

  if (gesetzPfad(path)) {
    try {
      const { ladeBrowseManifest } = await import('./normtext/browse');
      const gesetze = await ladeBrowseManifest();
      const e = erlassVonPfad(path, { gesetze });
      return e ? kuerze(e.kuerzel || e.titel) : null;
    } catch {
      return null;
    }
  }

  const ent = entscheidPfad(path);
  if (ent) {
    try {
      const { ladeEntscheidIndex } = await import('./rechtsprechung/browse');
      const m = await ladeEntscheidIndex();
      const e = m?.entscheide.find((x) => x.key === ent.key);
      return e ? kuerze(e.zitierung) : null;
    } catch {
      return null;
    }
  }

  const mat = materialPfad(path);
  if (mat) {
    try {
      const { ladeMaterialManifest } = await import('./materialien/browse');
      const m = await ladeMaterialManifest();
      const e = m?.materialien.find((x) => x.key === mat.key);
      return e ? kuerze(e.titel) : null;
    } catch {
      return null;
    }
  }

  return null;
}
