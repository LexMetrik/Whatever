// ─── Label-Auflösung für die Verlauf-Schiene ────────────────────────────────
//
// Reiner Resolver (§3): aus einem Navigationspfad ein menschenlesbares Label.
// Kein document.title-Hack — die Leser-Seiten (GesetzLeser/EntscheidLeser)
// setzen ihren Titel asynchron NACH dem Route-Tracker, wären als Quelle also
// unzuverlässig. Stattdessen:
//   · Katalog-/statische Routen  → metaFuerPfad() (synchron, im Shell-Bundle)
//   · /gesetze/:ebene/:key       → Kürzel/Titel aus dem Browse-Manifest
//   · /rechtsprechung/:key       → Zitierung aus dem Entscheid-Manifest
// Die Manifest-Lookups bekommen die bereits geladenen Manifeste als Argument
// (die Verlauf-Komponente lädt sie lazy); ohne Manifest gibt es ein ehrliches
// Platzhalter-Label statt eines Rohpfads.

import { metaFuerPfad } from './seo';
import type { BrowseManifest, BrowseErlass } from './normtext/browse-typen';
import type { EntscheidManifest } from './rechtsprechung/register';
import type { MaterialManifest } from './materialien/typen';
import type { StelleDatenMap } from './reiterStelle';
import { sicherDekodiert } from './sicherDekodieren';

/** Pfad-Segment dekodieren; kaputtes %-Escape ⇒ Rohsegment (PA-1-B01, kein Wurf in der Reiterleiste). */
const dek = (s: string): string => sicherDekodiert(s) ?? s;

const SUFFIX = /\s*[—–-]\s*LexMetrik\s*$/;

/** Reines pathname (ohne ?search/#hash). */
export function pfadTeil(path: string): string {
  return path.split(/[?#]/)[0];
}

/** Gesetzes-Leser-Pfad → {ebene, key} oder null. */
export function gesetzPfad(path: string): { ebene: string; key: string } | null {
  const m = /^\/gesetze\/([^/]+)\/([^/]+)\/?$/.exec(pfadTeil(path));
  return m ? { ebene: dek(m[1]), key: dek(m[2]) } : null;
}

/** Entscheid-Leser-Pfad → {key} oder null. */
export function entscheidPfad(path: string): { key: string } | null {
  const m = /^\/rechtsprechung\/([^/]+)\/?$/.exec(pfadTeil(path));
  return m ? { key: dek(m[1]) } : null;
}

/** Material-Leser-Pfad → {key} oder null. */
export function materialPfad(path: string): { key: string } | null {
  const p = pfadTeil(path);
  // Eine Route mit EIGENEM Meta-Eintrag ist eine Seite, kein Material-Schlüssel
  // (seit 12.9.2026: `/materialien/deckung`). Ohne diese Zeile löste jeder
  // Aufrufer sie als Material auf, fände den «Schlüssel» im Register nicht —
  // und hätte dafür 1,4 MB geladen (gemessen, Sonde e2e/deckung-seite (a)).
  // Die Prüfung ist allgemein, nicht auf einen Pfad geschrieben: sie gilt für
  // jede künftige statische Unterseite von /materialien.
  if (metaFuerPfad(p)) return null;
  const m = /^\/materialien\/([^/]+)\/?$/.exec(p);
  return m ? { key: dek(m[1]) } : null;
}

/** ── M7 · KATALOG-KURZFORM EINER RECHNER-/VORLAGEN-ROUTE ────────────────────
 *  Liest das Feld `kurz` der Karte, die diese Route vertritt (SSoT §5:
 *  `startseiteConfig`), oder null — dann steht der volle Titel im Reiter.
 *  Rein und synchron; kein Manifest, kein Netz. */
export function katalogKurzform(path: string): string | null {
  return metaFuerPfad(pfadTeil(path))?.karte?.kurz ?? null;
}

/** Synchron auflösbares Label (Katalog/statisch) — sonst null. */
export function labelAusMeta(path: string): string | null {
  const meta = metaFuerPfad(pfadTeil(path));
  if (!meta) return null;
  return meta.titel.replace(SUFFIX, '').trim() || null;
}

export interface VerlaufManifeste {
  /** Einträge je Erlass-Schlüssel für die Stelle im Reiter (`reiterStelle`,
   *  DFG-F01): wo sie fehlen, greift die Rückfallform. Geladen von
   *  `useStelleDaten` — nie vom Manifest selbst, das die Einträge nicht trägt. */
  artikel?: StelleDatenMap;
  gesetze?: BrowseManifest | null;
  entscheide?: EntscheidManifest | null;
  materialien?: MaterialManifest | null;
}

/**
 * Browse-Erlass eines Gesetz-Leser-Pfads aus dem geladenen Manifest auflösen
 * (SSoT §5: EINE Stelle für die {ebene,key}→Erlass-Suche, von verlaufLabel UND
 * vom Tab-Streifen-Wappen genutzt — kein doppelter find). Exakter (ebene,key)-
 * Treffer zuerst, dann key-only als Fallback. null = kein Gesetz-Pfad / kein
 * Manifest / unbekannter Schlüssel.
 */
export function erlassVonPfad(path: string, m: VerlaufManifeste = {}): BrowseErlass | null {
  const g = gesetzPfad(path);
  if (!g) return null;
  return m.gesetze?.erlasse.find((x) => x.key === g.key && x.ebene === g.ebene)
    ?? m.gesetze?.erlasse.find((x) => x.key === g.key)
    ?? null;
}

/**
 * Bestmögliches Label für die Anzeige; nie ein Rohpfad.
 *
 * R7-F3 (W2·24, 6./7.9.2026): der generische Platzhalter «X öffnen» galt
 * bisher UNBEDINGT — auch dann, wenn das Manifest längst geladen war und der
 * Schlüssel darin nachweislich FEHLT (nicht gefunden statt noch ladend). Die
 * Verlaufsschiene übernimmt das Label unverändert als Reiter-Titel; ein Reiter
 * «Entscheid öffnen» neben einem Seiteninhalt «Entscheid nicht gefunden» ist
 * ein sichtbarer Widerspruch (Linse 3, Befund F3). Fix, EINHEITLICH für alle
 * drei Manifest-Zweige (gleiche Bauform, keine Sonderlösung nur für Entscheide):
 * Manifest noch nicht geladen (`m.… === undefined`) → weiterhin der
 * Lade-Platzhalter «X öffnen»; Manifest geladen, Schlüssel fehlt → «X nicht
 * gefunden».
 */
export function verlaufLabel(path: string, m: VerlaufManifeste = {}): string {
  const meta = labelAusMeta(path);
  if (meta) return meta;

  if (gesetzPfad(path)) {
    const e = erlassVonPfad(path, m);
    if (e) return e.kuerzel || e.titel;
    return m.gesetze ? 'Gesetz nicht gefunden' : 'Gesetz öffnen';
  }

  const ent = entscheidPfad(path);
  if (ent) {
    const e = m.entscheide?.entscheide.find((x) => x.key === ent.key);
    if (e) return e.zitierung;
    return m.entscheide ? 'Entscheid nicht gefunden' : 'Entscheid öffnen';
  }

  const mat = materialPfad(path);
  if (mat) {
    const e = m.materialien?.materialien.find((x) => x.key === mat.key);
    if (e) return e.titel;
    return m.materialien ? 'Material nicht gefunden' : 'Material öffnen';
  }

  return 'Zuletzt geöffnet';
}
